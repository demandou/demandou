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
  /** O quadro do corte (11/10): 1080 × 1920 em pé (os cortes) ou 1920 × 1080 deitado (o completo de gravação deitada). */
  quadro?: { largura: number; altura: number; formato?: "9:16" | "16:9" } | null;
  /** O completo em blocos (11/10): qual bloco é este, de quantos, e onde ele cai no vídeo inteiro. */
  bloco?: { indice: number; total: number; inicioNoVideo: number; duracaoDoVideo: number } | null;
  /** O completo em blocos: como o bloco anterior terminou, para este seguir sem salto. */
  continuidade?: ContinuidadeDoBloco | null;
  /** A fala do VÍDEO INTEIRO e o tema (11/10): para entender de que o trecho fala (a tenda de Isaías 54). */
  videoInteiro?: { texto: string; tema: string | null } | null;
};
export type ContinuidadeDoBloco = {
  /**
   * O ENQUADRAMENTO BASE do vídeo (o último quadro do apresentador no primeiro bloco, sem o "em"):
   * todo bloco começa e termina nele, e a emenda entre blocos não salta (o worker fixa os dois).
   */
  apresentador?: Record<string, unknown> | null;
  /** A faixa da legenda do vídeo inteiro (a mesma em todos os blocos). */
  legenda?: Record<string, unknown> | null;
  /** As cenas do primeiro bloco: a linguagem visual do vídeo (o que cada uma explicou). */
  cenas?: Array<{ arquivo: string; oQue: string }>;
  /** O comum.tsx do primeiro bloco, quando havia: o mesmo objeto continua igual se voltar. */
  comum?: string | null;
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
/** O quadro do corte, em texto (o deitado leva as regras de composição do 16:9). Puro (testado). */
export function textoDoQuadro(quadro: ContextoDaCena["quadro"]): string {
  const L = Number(quadro?.largura) > 0 ? Number(quadro!.largura) : 1080;
  const A = Number(quadro?.altura) > 0 ? Number(quadro!.altura) : 1920;
  if (L <= A) return `O QUADRO: em pé, ${L} × ${A} (9:16).`;
  return `O QUADRO: DEITADO, ${L} × ${A} (16:9), o vídeo completo para o YouTube. Siga a seção "O quadro deitado (16:9)" do kit: todo número de posição e tamanho é em px DESTE quadro (use LARGURA e ALTURA do kit, nunca os números dos exemplos em pé), a pessoa ocupa um lado e a explicação o outro, a legenda numa faixa embaixo terminando acima de y = ${Math.round(A * (1840 / 1920))}.`;
}

/** O bloco do completo e a continuidade com o bloco anterior, em texto. Puro (testado). */
export function textoDaContinuidade(contexto: ContextoDaCena): string {
  const b = contexto.bloco;
  if (!b) return "";
  const partes = [
    `# ESTE É UM BLOCO DO VÍDEO COMPLETO
Bloco ${b.indice + 1} de ${b.total}: os segundos ${b.inicioNoVideo.toFixed(1)} a ${(b.inicioNoVideo + contexto.duracao).toFixed(1)} de um vídeo de ${b.duracaoDoVideo.toFixed(0)} s, editado em blocos de cerca de um minuto que são emendados um atrás do outro. O tempo da fala abaixo já é o do bloco (começa em 0). Vídeo longo: a pessoa é a base, e as cenas entram nas ideias fortes da fala, cada uma explicando o que é dito, com respiro entre elas (de 4 a 8 cenas por bloco de um minuto, no lugar da densidade do corte curto). Nada termina pela metade no fim do bloco: a última cena sai antes do "fim", e o apresentador termina o bloco num enquadramento estável (sem transição nos últimos 1,5 s).`,
  ];
  const c = contexto.continuidade;
  if (b.indice === 0 || !c) {
    partes.push("É o primeiro bloco: o apresentador começa como a técnica pede, e a linguagem visual que você escolher aqui (formas, enquadramentos, faixa da legenda, ritmo das entradas) vale para o vídeo inteiro. O enquadramento em que o apresentador termina este bloco vira o enquadramento base de todos os outros.");
  } else {
    partes.push(`CONTINUIDADE (os blocos são emendados sem corte visível; o worker garante a emenda):
- O ENQUADRAMENTO BASE do vídeo: o primeiro quadro do apresentador (em "inicio") é exatamente este, e o bloco termina nele (o worker fixa os dois). Entre o começo e o fim, mude com transição quando a fala pedir: ${JSON.stringify(c.apresentador ?? {})}
- A legenda é a mesma faixa do vídeo inteiro (o worker fixa): ${JSON.stringify(c.legenda ?? {})}. Planeje as cenas fora dela.
- A linguagem do vídeo, do primeiro bloco (siga as mesmas formas, a mesma paleta de movimentos e o mesmo nível; não repita a mesma explicação): ${(c.cenas ?? []).map((x) => `${x.arquivo}: ${x.oQue}`).join(" | ") || "nada"}${c.comum ? `
- O comum.tsx do primeiro bloco (o mesmo objeto continua igual, se ele voltar nesta fala; pode reaproveitar este código):
${c.comum.slice(0, 6000)}` : ""}`);
  }
  return partes.join("\n\n");
}

/** O vídeo inteiro em texto, para quem escreve entender o assunto do trecho. Puro (testado). */
export function textoDoVideoInteiro(contexto: ContextoDaCena): string {
  const v = contexto.videoInteiro;
  if (!v?.texto) return "";
  return `# O VÍDEO INTEIRO (contexto; leia ANTES de escolher o que desenhar)
Este corte é um trecho de um vídeo maior. Leia a fala inteira para entender DE QUE a pessoa está falando: o objeto e a cena do trecho saem do assunto do vídeo (na aula 8.1 o trecho dizia só "estica a corda, finca a estaca, a cortina", e o vídeo inteiro falava da tenda de Isaías 54: a maquete foi ESSA tenda). Desenhe o que o vídeo inteiro está explicando, ancorado nas palavras ditas NESTE trecho; nada que o vídeo não fale.
${v.tema ? `Tema do vídeo: ${v.tema}
` : ""}A fala do vídeo inteiro:
${v.texto}

`;
}

export function blocoDoCorte(contexto: ContextoDaCena, fala: PalavraDaCena[]): string {
  const quem = contexto.marca?.nome ? `Quem fala: ${contexto.marca.nome}${contexto.marca.area ? `, ${contexto.marca.area}` : ""}.` : "";
  const quadro = contexto.quadro ?? { largura: 1080, altura: 1920 };
  const continuidade = textoDaContinuidade(contexto);
  return `# O CORTE

Técnica (escolhida pelo cliente, ou pelo JEV pela fala): "${contexto.tecnica}", ${O_QUE_E[contexto.tecnica]}.
Duração: ${contexto.duracao.toFixed(2)} s (${Math.round(contexto.duracao * 30)} quadros a 30 fps).
Recorte com alfa: ${contexto.temRecorte ? "SIM (recorte: true vale nos quadros do apresentador)" : "NÃO (nunca use recorte: true)"}.
Letra da marca: ${contexto.letra ?? "moderna"}.
${quem}
${contexto.nicho ? `Assunto do perfil (só contexto para entender a fala; não é texto de tela): ${contexto.nicho}\n` : ""}
${textoDoQuadro(contexto.quadro)}
Geometria do apresentador neste corte (px; a gravação é deitada e o quadro é ${quadro.largura} × ${quadro.altura}):
${JSON.stringify(contexto.geometria ?? {}, null, 1)}
${continuidade ? `
${continuidade}
` : ""}
${textoDoVideoInteiro(contexto)}A fala do corte, uma palavra por linha (início–fim em segundos e a palavra, já no tempo do corte):
${formatarFala(fala)}`;
}

type Esforco = "low" | "medium" | "high";
type Opcoes = { usage: { projectId?: string | null; operation: string }; onCusto?: (usd: number) => void; tetoRestanteUsd?: number | null; esforco?: Esforco | null };

/**
 * O TEMPO DE UMA FASE (11/10/2026): cada fase roda numa invocação da Vercel com
 * 800 s de prazo. A escrita da Maquete 3D com o esforço padrão (alto) e 64 mil
 * de teto pensou até a função morrer. Agora cada chamada tem esforço e teto que
 * cabem em poucos minutos (92 tokens por segundo medidos no Sonnet 5: 32 mil em
 * 346 s) e um prazo de 9 minutos; a chamada que acabar só pensando volta como
 * falha com custo, e quem tenta de novo, com esforço baixo, é o worker, numa
 * invocação nova (uma vez só).
 */
export const LIMITE_DA_CHAMADA_MS = 9 * 60_000;
export const ESFORCO_E_TETO = {
  // medido em 11/10 no trecho do teste do Bruno (Maquete 3D, 36 s): o médio pensou os 32 mil
  // inteiros em 346 s sem escrever (US$ 0,40); o baixo escreveu tudo em 213 s (US$ 0,29)
  escrever: { esforco: "low" as Esforco, maxTokens: 32_000 },
  consertar: { esforco: "medium" as Esforco, maxTokens: 20_000 },
};

function tetoDeSaida(base: number, tetoRestanteUsd?: number | null): number {
  // US$ 10 por milhão de saída no Sonnet 5: o que sobra do teto vira o teto de tokens (com folga para a entrada)
  if (!(Number(tetoRestanteUsd) > 0)) return base;
  return Math.max(8000, Math.min(base, Math.floor((Number(tetoRestanteUsd) * 0.8 * 1_000_000) / 10)));
}

/** A chamada acabou toda em pensamento (stop_reason max_tokens sem texto): vale tentar de novo com menos esforço. */
export const acabouPensando = (e: unknown) => e instanceof Error && /tokens pensando/.test(e.message);

/** Uma chamada só (sem segunda tentativa aqui dentro: a fase inteira precisa caber no prazo da função). */
async function chamar(kit: KitDoWorker, pedido: string, padrao: { esforco: Esforco; maxTokens: number }, o: Opcoes): Promise<{ arquivos: Record<string, string>; bruto: string }> {
  const esforco = o.esforco ?? padrao.esforco;
  const resposta = await askClaude(SISTEMA, pedido, {
    cachedPrefix: prefixoDaCena(kit),
    cacheTtl: "1h",
    model: modeloDasCenas(),
    maxTokens: tetoDeSaida(padrao.maxTokens, o.tetoRestanteUsd),
    timeoutMs: LIMITE_DA_CHAMADA_MS,
    effort: esforco,
    usage: { projectId: o.usage.projectId ?? undefined, operation: o.usage.operation },
    onCusto: (usd) => o.onCusto?.(usd),
  });
  return { arquivos: lerArquivosDaResposta(resposta), bruto: resposta };
}

/** A escrita: o roteiro e as cenas do corte inteiro. */
export async function escreverCenas(a: { kit: KitDoWorker; contexto: ContextoDaCena; fala: PalavraDaCena[] } & Opcoes) {
  const pedido = `${blocoDoCorte(a.contexto, a.fala)}

Escreva o roteiro.json e as cenas deste corte na técnica "${a.contexto.tecnica}", no nível dos exemplos aprovados: cada ideia da fala explicada na hora em que é dita, as cores e a letra da marca, nada inventado.`;
  const r = await chamar(a.kit, pedido, ESFORCO_E_TETO.escrever, a);
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
  return (await chamar(a.kit, pedido, ESFORCO_E_TETO.consertar, a)).arquivos;
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
  const r = await chamar(a.kit, pedido, ESFORCO_E_TETO.consertar, a);
  return Object.fromEntries(Object.entries(r.arquivos).filter(([n]) => a.alvo.includes(n)));
}
