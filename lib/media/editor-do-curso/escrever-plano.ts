import { askClaude, askClaudeComImagens } from "@/lib/claude";
import { numerosDoTexto } from "@/lib/media/numeros-falados";

/**
 * O MAPA E O PLANO DOS MODELOS DO CURSO (09/10/2026): os passos 6 e 7 do
 * SKILL.md de cada modelo, que no curso o Claude faz no computador do aluno.
 *
 * O Claude recebe o treinamento INTEIRO do modelo (SKILL.md, references/plano.md,
 * adaptar.md, estilo.md, os tipos de src/plano.ts e o exemplo comentado), a
 * fala já cortada com o tempo de cada palavra, e escreve o mapa editorial e os
 * campos do plano que o curso manda o aluno escrever (marca, momentos,
 * semLegenda, correções e os campos próprios do modelo). Quem decide se o plano
 * vale é o `conferir.mjs` do próprio curso, no worker, e a guarda de número
 * abaixo; reprovado, o motivo volta para cá e o Claude conserta só o apontado.
 *
 * Os textos de referência chegam do worker (worker/modelos/<id>/referencias),
 * que é onde os modelos moram: uma cópia só, a mesma que o render usa.
 */

export type ReferenciasDoModelo = {
  id: string;
  /** references/exemplo/quadros.jpg em base64: um quadro de cada momento do exemplo, com o bloco e a fala. */
  quadros?: string | null;
  skill: string | null;
  plano: string | null;
  adaptar: string | null;
  estilo: string | null;
  imagens: string | null;
  exemploComentado: string | null;
  exemploPlano: string | null;
  tipos: string | null;
  modelo: Record<string, unknown>;
  outros: { nome: string; texto: string }[];
};

export type PalavraDoPlano = { em: number; ate: number; w: string };

export type EsqueletoDoPlano = {
  duracao: number;
  fps: number;
  videoAltura?: number;
  rosto: { x: number; y: number } | null;
  zona?: { topo: number; altura: number };
  cortesEm?: number[];
  palavras: PalavraDoPlano[];
  [campo: string]: unknown;
};

export type PlanoEscrito = {
  mapa: string;
  plano: Record<string, unknown>;
};

export type RetornoDaConferencia = {
  /** O plano que foi conferido (o que o Claude escreveu na volta anterior). */
  plano: Record<string, unknown>;
  /** A saída do conferir.mjs e dos gates de tempo, como o curso imprime. */
  saidas: string[];
  /** Os números que a guarda não achou na fala. */
  numerosSemLastro?: string[];
};

const CAMPOS_DO_MOTOR = new Set(["video", "fps", "largura", "altura", "duracao", "videoAltura", "rosto", "zona", "cortesEm", "palavras", "enquadramentos", "imagens"]);

/** O prefixo estável por modelo, que vai para o cache: o treinamento inteiro. */
export function treinamentoDoModelo(r: ReferenciasDoModelo): string {
  const partes: string[] = [];
  partes.push(`# TREINAMENTO DO MODELO ${r.id} (curso Máquina de Edição IA)\n`);
  partes.push("A seguir está a skill completa deste modelo, exatamente como o curso entrega. Ela é a autoridade sobre o estilo, os blocos, os campos, os limites de texto, o ritmo e a fidelidade.");
  if (r.skill) partes.push(`\n## SKILL.md\n\n${r.skill}`);
  if (r.adaptar) partes.push(`\n## references/adaptar.md\n\n${r.adaptar}`);
  if (r.plano) partes.push(`\n## references/plano.md\n\n${r.plano}`);
  if (r.estilo) partes.push(`\n## references/estilo.md\n\n${r.estilo}`);
  for (const o of r.outros) partes.push(`\n## references/${o.nome}\n\n${o.texto}`);
  if (r.tipos) partes.push(`\n## src/plano.ts (os tipos que o template aceita; campo fora daqui é ignorado ou quebra o render)\n\n\`\`\`ts\n${r.tipos}\n\`\`\``);
  if (r.modelo && Object.keys(r.modelo).length) partes.push(`\n## modelo.json (assinatura e limites da conferência deste modelo)\n\n\`\`\`json\n${JSON.stringify(r.modelo, null, 1)}\n\`\`\``);
  if (r.exemploComentado) partes.push(`\n## references/exemplo/plano-comentado.md\n\n${r.exemploComentado}`);
  if (r.exemploPlano) partes.push(`\n## O plano.json do exemplo (sem as palavras e sem o rastro do rosto)\n\n\`\`\`json\n${r.exemploPlano}\n\`\`\``);
  return partes.join("\n");
}

const SISTEMA = `Você é o editor de vídeo que executa uma skill do curso "Máquina de Edição IA" dentro de um sistema automático.

O sistema já fez os passos 1 a 5 do fluxo da skill (criar o projeto, preparar, escolher as tomadas, medir o rosto, cortar, conferir o enquadramento). Você faz os passos 6 e 7: o mapa editorial (references/adaptar.md) e o plano (references/plano.md e src/plano.ts). Não há usuário para perguntar nada: o nome e a área já vêm prontos, e onde a skill diria "pergunte", decida pelo que ela recomenda e registre no mapa.

A régua é o EXEMPLO do modelo: a folha de quadros anexada (um quadro de cada momento, com o bloco e a fala embaixo), o plano comentado e o plano.json do exemplo. Estude a folha antes do mapa, como o adaptar.md manda: é a forma mais precisa de entender o estilo. Copie o estilo, nunca o assunto. A sua edição precisa ter a MESMA densidade, a mesma variedade e o mesmo nível de riqueza do exemplo:
- use os blocos mais ricos que a fala permite, e não os mais simples: se a fala tem números, use os blocos que contam, desenham, dividem e comparam (os próprios do modelo e a assinatura), como o exemplo faz; prefira o bloco próprio do modelo ao universal quando os dois servem;
- todo número dito na fala aparece na tela no instante em que é dito, num bloco que o valoriza;
- quando a fala dá parâmetros (valor, prazo, parcela, taxa) e a skill tem o recurso de simulação ou conta, use-o como ela ensina, mostrando os parâmetros ditos e a etiqueta de simulação; conta que a skill não prevê, não faça;
- abra com o bloco de abertura mais forte que a skill oferece para a fala (no exemplo, normalmente o próprio do modelo).

Regras que não se quebram (são da própria skill):
- Tudo o que aparece na tela vem da fala. Pode resumir com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, taxa, data nem fato. Número só se foi dito. Conta feita a partir de parâmetros ditos é simulação e segue a regra de simulação da skill (ficha com os parâmetros e nota de simulação), quando a skill tiver esse recurso; se não tiver, não faça a conta.
- Sem número dito, use a forma ilustrativa que a skill define.
- Cada item entra no "em" da palavra que o nomeia, tirado da lista de palavras abaixo (tempo no vídeo já cortado). Nada aparece antes de ser dito.
- Respeite os limites de texto, os campos obrigatórios, a gramática de layout e a assinatura do modelo (pelo menos uma vez, de forma metafórica se o assunto for outro), e pelo menos 2 efeitos próprios do modelo além dos blocos universais quando o vídeo passar de 20 s.
- Use só os tipos e campos que src/plano.ts define.
- Transcrição errada vai em "correcoes", como a skill ensina, e só quando a própria fala deixa claro o certo (por exemplo, o mesmo nome dito certo mais adiante). Na dúvida, não corrija.
- Nunca use o travessão (—) em nenhum texto.
- Não escreva os campos do motor (video, fps, largura, altura, duracao, videoAltura, rosto, zona, cortesEm, palavras): eles já estão prontos.

Responda SOMENTE com um objeto JSON, sem cerca de código e sem texto antes ou depois, no formato:
{"mapa": "<o mapa editorial em markdown: uma linha por batida com tempo, trecho falado, forma, bloco e o que aparece na tela>", "plano": {"marca": {...}, "momentos": [...], "semLegenda": [...], "correcoes": {...}, <outros campos de topo que a skill manda você escrever, quando houver>}}`;

function formatarPalavras(palavras: PalavraDoPlano[]): string {
  return palavras.map((p) => `${p.em.toFixed(2)}–${p.ate.toFixed(2)} ${p.w}`).join("\n");
}

function lerJson(texto: string): PlanoEscrito {
  const limpo = texto.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  const tentar = (t: string) => {
    try {
      return JSON.parse(t) as PlanoEscrito;
    } catch {
      return null;
    }
  };
  const direto = tentar(limpo);
  if (direto) return direto;
  const a = limpo.indexOf("{");
  const b = limpo.lastIndexOf("}");
  const recorte = a >= 0 && b > a ? tentar(limpo.slice(a, b + 1)) : null;
  if (recorte) return recorte;
  throw new Error("o plano não voltou em JSON válido");
}

/**
 * Escreve (ou conserta) o mapa e o plano de um vídeo num modelo do curso.
 * `anterior` traz o plano reprovado e as saídas da conferência: o Claude
 * conserta só o que foi apontado, como a skill manda.
 */
export async function escreverPlanoDoModelo(args: {
  referencias: ReferenciasDoModelo;
  esqueleto: EsqueletoDoPlano;
  marca: { nome: string; area: string };
  nicho?: string | null;
  anterior?: RetornoDaConferencia | null;
  /** O mapa já feito no passo das imagens (modelos com imagem): o plano segue ele. */
  mapa?: string | null;
  modelo?: string;
  usage: { projectId?: string | null; operation: string };
  onCusto?: (usd: number) => void;
}): Promise<PlanoEscrito> {
  const { referencias, esqueleto, marca } = args;
  const { palavras, ...resto } = esqueleto;
  // O quadro deitado (a versão 16:9 de um modelo, para o vídeo completo) vai dito no contexto:
  // o rosto e a zona são frações e px de um quadro 1920×1080, não do vertical. No vertical o
  // contexto fica como sempre foi (o mesmo texto, o mesmo cache).
  const largura = Number(resto.largura);
  const altura = Number(resto.altura);
  const deitado = largura > altura;
  const contexto = {
    duracao: resto.duracao,
    fps: resto.fps,
    ...(deitado ? { largura, altura } : {}),
    videoAltura: resto.videoAltura,
    rosto: resto.rosto,
    zona: resto.zona,
    cortesEm: resto.cortesEm,
  };
  // As imagens escolhidas no passo 6b (o imagens.mjs grava em plano.imagens): o
  // plano só pode usar estes ids; `sem: true` vira o cartão com a palavra.
  const imagens = (resto as { imagens?: Record<string, unknown> }).imagens;
  let pedido = `# O VÍDEO A EDITAR NO MODELO ${referencias.id}

Quem fala: ${marca.nome || "(sem nome)"}${marca.area ? `, ${marca.area}. Use exatamente isto em "marca".` : `. Use este nome em "marca"; a área (até 30 caracteres, como "Consultor de consórcio") você resume do assunto do perfil abaixo, sem inventar nada que ele não diga.`}
${args.nicho ? `Assunto do perfil (contexto para entender a fala; não é texto de tela): ${args.nicho}\n` : ""}
O que o cortar.mjs já gravou no plano (não reescreva):
${JSON.stringify(contexto)}

A fala no vídeo já cortado, uma palavra por linha (início–fim em segundos e a palavra), como em work/palavras.json:
${formatarPalavras(palavras)}

${imagens && Object.keys(imagens).length ? `\nAs imagens já escolhidas no passo 6b (plano.imagens, gravado pelo imagens.mjs; use só estes ids em "imagem": { "id", "efeito" }, e "sem": true quer dizer cartão com a palavra):\n${JSON.stringify(imagens)}\n` : ""}${args.mapa ? `\nO mapa editorial já feito no passo 6 (siga-o; ajuste só o que a conferência pedir):\n${args.mapa}\n` : ""}
Faça o mapa editorial e o plano deste vídeo neste modelo.`;

  if (args.anterior) {
    pedido += `

# A CONFERÊNCIA REPROVOU O PLANO ANTERIOR

O plano anterior:
${JSON.stringify(args.anterior.plano)}

O que o conferir.mjs e os gates de tempo do curso disseram:
${args.anterior.saidas.join("\n\n")}
${args.anterior.numerosSemLastro?.length ? `\nNúmeros na tela que não foram ditos na fala (tire, ou troque pela forma ilustrativa): ${args.anterior.numerosSemLastro.join(", ")}\n` : ""}
Conserte o que foi apontado, mantendo o que estava certo, e devolva o mapa e o plano inteiros de novo, no mesmo formato JSON.`;
  }

  const opcoes = {
    cachedPrefix: treinamentoDoModelo(referencias),
    model: args.modelo,
    maxTokens: 48_000,
    timeoutMs: 15 * 60_000,
    usage: { projectId: args.usage.projectId ?? undefined, operation: args.usage.operation },
    onCusto: args.onCusto,
  };
  const resposta = referencias.quadros
    ? await askClaudeComImagens(
        SISTEMA,
        pedido,
        [{ base64: referencias.quadros, rotulo: `references/exemplo/quadros.jpg do modelo ${referencias.id}: um quadro de cada momento do exemplo (estado montado), com o tipo do bloco e a fala embaixo.` }],
        opcoes
      )
    : await askClaude(SISTEMA, pedido, opcoes);
  const escrito = lerJson(resposta);
  if (!escrito.plano || !Array.isArray((escrito.plano as { momentos?: unknown }).momentos)) {
    throw new Error("o plano voltou sem momentos");
  }
  for (const k of Object.keys(escrito.plano)) if (CAMPOS_DO_MOTOR.has(k)) delete escrito.plano[k];
  return { mapa: String(escrito.mapa ?? ""), plano: escrito.plano };
}

/**
 * A GUARDA DE NÚMERO: todo número na tela precisa estar na fala. O conferir do
 * curso confere forma e ritmo, não fidelidade; a fidelidade, no curso, é a
 * pessoa olhando os quadros. Aqui é código: os números ditos (por extenso ou
 * em algarismo, lib/media/numeros-falados.ts) contra os números do plano.
 *
 * Fica de fora o que não é afirmação: contagem até 10 (itens, etapas) e os
 * campos de tempo e de desenho. Momento marcado como simulação (nota com
 * "simula") passa, porque a skill exige mostrar os parâmetros ditos na ficha.
 */
const CAMPOS_DE_TEMPO_OU_DESENHO = new Set([
  "de", "ate", "em", "inicio", "casas", "zoom", "ancoraY", "ancoraX", "destaque", "vencedor", "serie", "ponto", "peso", "fatias", "x", "y", "w", "h", "nivel", "tamanho", "escala", "volume", "ordem", "indice",
]);

/**
 * "424 mil" e "1,2 milhão" escritos na tela: o algarismo com a escala vira um
 * número só (424000). Sem isto o "mil" solto contava como 1000, número que
 * ninguém disse (prova do Case, 09/10).
 */
function comEscalaJunta(texto: string): string {
  return texto.replace(/(\d+(?:[.,]\d+)*)\s*(mil|milh(?:ão|ao|ões|oes)|bilh(?:ão|ao|ões|oes))\b/gi, (_, n: string, escala: string) => {
    const base = Number(n.replace(/\.(?=\d{3}(?!\d))/g, "").replace(",", "."));
    if (!Number.isFinite(base)) return n;
    const fator = /^mil$/i.test(escala) ? 1_000 : /^milh/i.test(escala) ? 1_000_000 : 1_000_000_000;
    return String(Math.round(base * fator));
  });
}

export function numerosSemLastro(plano: Record<string, unknown>, palavras: PalavraDoPlano[], correcoes?: Record<string, string>): string[] {
  let fala = palavras.map((p) => p.w).join(" ");
  for (const certo of Object.values(correcoes ?? {})) fala += ` ${certo}`;
  const ditos = new Set(numerosDoTexto(fala).map((n) => String(Number(n))));
  const faltam = new Set<string>();
  const conferir = (n: number) => {
    if (!Number.isFinite(n) || Math.abs(n) <= 10) return;
    const chave = String(Number(n));
    if (ditos.has(chave)) return;
    // "152.638" dito e "152,6 mil" na tela: aceita o arredondamento de um dito
    for (const d of ditos) {
      const v = Number(d);
      if (v > 0 && Math.abs(v - n) / v < 0.01) return;
      if (v >= 1000 && Math.abs(v / 1000 - n) / (v / 1000) < 0.01) return;
      if (v >= 1_000_000 && Math.abs(v / 1_000_000 - n) / (v / 1_000_000) < 0.01) return;
    }
    faltam.add(chave);
  };
  const andar = (v: unknown, chave: string, simulacao: boolean) => {
    if (simulacao) return;
    if (typeof v === "number") {
      if (!CAMPOS_DE_TEMPO_OU_DESENHO.has(chave) && !/Em$/.test(chave)) conferir(v);
    } else if (typeof v === "string") {
      for (const n of numerosDoTexto(comEscalaJunta(v))) conferir(Number(n));
    } else if (Array.isArray(v)) {
      for (const x of v) andar(x, chave, simulacao);
    } else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) andar(x, k, simulacao);
    }
  };
  for (const m of (plano.momentos as Record<string, unknown>[] | undefined) ?? []) {
    const simulacao = typeof m.nota === "string" && /simula/i.test(m.nota);
    for (const [k, x] of Object.entries(m)) {
      if (k === "tipo" || k === "de" || k === "ate") continue;
      andar(x, k, simulacao);
    }
  }
  return [...faltam];
}
