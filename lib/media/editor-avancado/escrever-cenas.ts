import { askClaude } from "@/lib/claude";
import { lerArquivosDaResposta } from "./arquivos";
import { modeloDasCenas } from "./no-corte";
import { FORMATO_DA_RESPOSTA, REGRAS_DAS_AULAS } from "./regras";

/**
 * QUEM ESCREVE A CENA (editor avançado, 10/10/2026): o Claude Sonnet 5
 * (decisão do Bruno) escreve o roteiro.json e os arquivos de cena de um corte
 * sobre o kit do worker, e conserta só o que os portões ou a revisão apontam.
 * "Claude só escreve": a técnica do corte e a reprovação de uma cena são do
 * JEV (tecnica.ts e revisao.ts); quem decide se o código vale são os portões
 * do worker (portao.mjs, tsc, render).
 *
 * O prefixo em cache (os mesmos bytes em toda chamada) tem as regras das
 * aulas e do remotion-best-practices, a API do kit e os exemplos aprovados,
 * que chegam do worker (worker/avancado/kit-api.md e exemplos/).
 */
export type ArquivoDoExemplo = { nome: string; conteudo: string };
export type KitDoWorker = { api: string; versao: string; exemplos: { nome: string; leia: string; arquivos: ArquivoDoExemplo[] }[] };
export type PalavraDaCena = { de: number; ate: number; w: string };
export type ContextoDaCena = {
  tecnica: "maquete-3d" | "recorte-letreiro" | "graficos" | "moldura-explicativa";
  duracao: number;
  marca?: { nome?: string; area?: string } | null;
  nicho?: string | null;
  letra?: string;
  temRecorte: boolean;
  geometria?: Record<string, unknown> | null;
};
export type ProblemaDoPortao = { arquivo: string; linha?: number; motivo: string };
export type DefeitoDaCena = { arquivo: string; problemas: Array<{ t: number; tipo: string; descricao: string }>; probabilidade?: number | null };

const blocos = (arquivos: Record<string, string> | ArquivoDoExemplo[]) =>
  (Array.isArray(arquivos) ? arquivos : Object.entries(arquivos).map(([nome, conteudo]) => ({ nome, conteudo })))
    .map((a) => `=== arquivo: ${a.nome} ===\n${a.conteudo.trimEnd()}`)
    .join("\n");

/** O prefixo em cache: regras, API do kit e exemplos. */
export function prefixoDaCena(kit: KitDoWorker): string {
  const exemplos = kit.exemplos
    .map((e) => `## Exemplo: ${e.nome}\n\n${e.leia}\n\n${blocos(e.arquivos)}\n=== fim ===`)
    .join("\n\n");
  return `${REGRAS_DAS_AULAS}\n\n${kit.api}\n\n# OS EXEMPLOS (o nível a alcançar; o LEIA de cada um diz de qual aula é)\n\n${exemplos}`;
}

const SISTEMA = `Você escreve o código Remotion de um corte, sobre o kit e as regras acima.\n\n${FORMATO_DA_RESPOSTA}`;

const O_QUE_E: Record<ContextoDaCena["tecnica"], string> = {
  "maquete-3d": "aula 8.1: uma maquete 3D conceitual que explica a ideia da fala, com vista explodida, rótulos presos e reconstrução; o apresentador vai de tela cheia para a moldura chanfrada no canto inferior esquerdo",
  "recorte-letreiro": "aula 8.2: o apresentador recortado do fundo, palavras grandes atrás dele, tipografia cinética e moldura assimétrica com a cabeça por fora",
  graficos: "aula 6: o apresentador centralizado e, uma inserção por vez, gráficos que se desenham na palavra dita (linha que rompe um nível, barras que crescem, número que conta até o valor dito), um card e ícones com função",
  "moldura-explicativa": "aula 7: o apresentador alterna tela cheia e moldura arredondada, e cartões com ícones animados explicam cada ponto da fala",
};

const formatarFala = (fala: PalavraDaCena[]) => fala.map((p) => `${p.de.toFixed(2)}–${p.ate.toFixed(2)} ${p.w}`).join("\n");

/** O bloco do corte (o mesmo em todas as fases): a técnica, os números do apresentador e a fala com os tempos. */
export function blocoDoCorte(contexto: ContextoDaCena, fala: PalavraDaCena[]): string {
  const quem = contexto.marca?.nome ? `Quem fala: ${contexto.marca.nome}${contexto.marca.area ? `, ${contexto.marca.area}` : ""}.` : "";
  return `# O CORTE

Técnica (escolhida pelo cliente, ou pelo JEV pela fala): "${contexto.tecnica}", ${O_QUE_E[contexto.tecnica]}.
Duração: ${contexto.duracao.toFixed(2)} s (${Math.round(contexto.duracao * 30)} quadros a 30 fps).
Recorte com alfa: ${contexto.temRecorte ? "SIM (recorte: true vale nos quadros do apresentador)" : "NÃO (nunca use recorte: true)"}.
Letra da marca: ${contexto.letra ?? "moderna"}.
${quem}
${contexto.nicho ? `Assunto do perfil (só contexto para entender a fala; não é texto de tela): ${contexto.nicho}\n` : ""}
Geometria do apresentador neste corte (px; a gravação é deitada e o quadro é 1080 × 1920):
${JSON.stringify(contexto.geometria ?? {}, null, 1)}

A fala do corte, uma palavra por linha (início–fim em segundos e a palavra, já no tempo do corte):
${formatarFala(fala)}`;
}

type Opcoes = { usage: { projectId?: string | null; operation: string }; onCusto?: (usd: number) => void; tetoRestanteUsd?: number | null };

function tetoDeSaida(base: number, tetoRestanteUsd?: number | null): number {
  // US$ 10 por milhão de saída no Sonnet 5: o que sobra do teto vira o teto de tokens (com folga para a entrada)
  if (!(Number(tetoRestanteUsd) > 0)) return base;
  return Math.max(8000, Math.min(base, Math.floor((Number(tetoRestanteUsd) * 0.8 * 1_000_000) / 10)));
}

/** A chamada acabou toda em pensamento (stop_reason max_tokens sem texto): vale tentar de novo com menos esforço. */
export const acabouPensando = (e: unknown) => e instanceof Error && /tokens pensando/.test(e.message);

async function chamar(kit: KitDoWorker, pedido: string, maxTokens: number, effort: "low" | "medium" | "high" | undefined, o: Opcoes): Promise<{ arquivos: Record<string, string>; bruto: string }> {
  let gasto = 0;
  const pedir = (esforco: typeof effort, teto: number) =>
    askClaude(SISTEMA, pedido, {
      cachedPrefix: prefixoDaCena(kit),
      cacheTtl: "1h",
      model: modeloDasCenas(),
      maxTokens: teto,
      timeoutMs: 14 * 60_000,
      ...(esforco ? { effort: esforco } : {}),
      usage: { projectId: o.usage.projectId ?? undefined, operation: o.usage.operation },
      onCusto: (usd) => {
        gasto += usd;
        o.onCusto?.(usd);
      },
    });
  let resposta: string;
  try {
    resposta = await pedir(effort, tetoDeSaida(maxTokens, o.tetoRestanteUsd));
  } catch (e) {
    // A prova da maquete (10/10) gastou 40 mil tokens pensando e não escreveu nada.
    // Uma segunda vez com menos esforço, se ainda couber no teto do corte.
    const sobra = o.tetoRestanteUsd == null ? null : Number(o.tetoRestanteUsd) - gasto;
    if (!acabouPensando(e) || effort === "low" || (sobra !== null && sobra < 0.25)) throw e;
    resposta = await pedir(effort === "medium" ? "low" : "medium", tetoDeSaida(maxTokens, sobra));
  }
  return { arquivos: lerArquivosDaResposta(resposta), bruto: resposta };
}

/** A escrita: o roteiro e as cenas do corte inteiro. */
export async function escreverCenas(a: { kit: KitDoWorker; contexto: ContextoDaCena; fala: PalavraDaCena[] } & Opcoes) {
  const pedido = `${blocoDoCorte(a.contexto, a.fala)}

Escreva o roteiro.json e as cenas deste corte na técnica "${a.contexto.tecnica}", no nível dos exemplos aprovados: cada ideia da fala explicada na hora em que é dita, as cores e a letra da marca, nada inventado.`;
  // 64 mil de teto: a maquete 3D fez o Sonnet 5 gastar 40 mil só pensando na prova de 10/10
  // (a segunda tentativa, com esforço médio, fica em `chamar`)
  const r = await chamar(a.kit, pedido, 64_000, undefined, a);
  if (!r.arquivos["roteiro.json"]) throw new Error(`a escrita da cena voltou sem roteiro.json (${r.bruto.slice(0, 200)})`);
  return r.arquivos;
}

/** O conserto do código que os portões recusaram (estático, tsc ou render). Devolve só os arquivos que mudaram. */
export async function consertarCodigo(a: { kit: KitDoWorker; contexto: ContextoDaCena; fala: PalavraDaCena[]; arquivos: Record<string, string>; problemas: ProblemaDoPortao[] } & Opcoes) {
  const lista = a.problemas.map((p) => `- ${p.arquivo}${p.linha && p.linha > 1 ? `:${p.linha}` : ""}: ${p.motivo}`).join("\n");
  const pedido = `${blocoDoCorte(a.contexto, a.fala)}

# OS ARQUIVOS ATUAIS
${blocos(a.arquivos)}
=== fim ===

# O QUE O PORTÃO, O TSC OU O RENDER RECUSARAM
${lista}

Conserte SÓ o que foi apontado, mantendo todo o resto como está. Devolva só os arquivos que mudaram, cada um inteiro.`;
  return (await chamar(a.kit, pedido, 24_000, "medium", a)).arquivos;
}

/** O conserto das cenas que a revisão reprovou: reescreve SÓ os arquivos com defeito. */
export async function consertarCenas(a: { kit: KitDoWorker; contexto: ContextoDaCena; fala: PalavraDaCena[]; arquivos: Record<string, string>; alvo: string[]; defeitos: DefeitoDaCena[] } & Opcoes) {
  const lista = a.defeitos
    .map((d) => `- ${d.arquivo}:\n${d.problemas.slice(0, 6).map((p) => `  em ${Number(p.t).toFixed(1)} s, ${p.tipo}: ${p.descricao}`).join("\n")}`)
    .join("\n");
  const pedido = `${blocoDoCorte(a.contexto, a.fala)}

# OS ARQUIVOS ATUAIS
${blocos(a.arquivos)}
=== fim ===

# A REVISÃO DOS QUADROS REPROVOU (o que se vê no vídeo montado)
${lista}

Reescreva SÓ estes arquivos: ${a.alvo.join(", ")}. Corrija o defeito apontado (mover, encolher, trocar o momento, tirar o que cobre o rosto ou a legenda) e mantenha a ideia, a sincronia com a fala e tudo o que estava certo. Defeito do recorte da pessoa (halo, mão sumindo) não se conserta no código: não mexa por causa dele. Devolva só esses arquivos, cada um inteiro.`;
  const r = await chamar(a.kit, pedido, 24_000, "medium", a);
  return Object.fromEntries(Object.entries(r.arquivos).filter(([n]) => a.alvo.includes(n)));
}
