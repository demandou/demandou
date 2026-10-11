import prompts from "./prompts-de-estilo.json";

/**
 * AS ARTES DO PROJETO COM MODELO DO CURSO PELOS MODELOS DE IMAGEM (11/10/2026).
 *
 * Decisão do Bruno (11/10, 01h25), depois de ver as artes feitas como quadro
 * parado do template do modelo (tamanhos errados, elementos soltos, caixas
 * vazias da janela da pessoa): "os posts que herdam o design têm que herdar um
 * PROMPT para enviar para os nossos modelos de IA (Higgsfield, Nano Banana,
 * Veo 3, GPT image etc.), senão vamos ficar com esses erros grosseiros".
 *
 * Como fica:
 *   1  cada modelo do curso tem um PROMPT DE ESTILO (prompts-de-estilo.json,
 *      gerado uma vez por scripts/prompts-de-estilo-dos-modelos.mjs a partir do
 *      estilo.md, do SKILL.md e do quadros.jpg do modelo; nenhuma campanha paga
 *      por ele): atmosfera, elemento visual, cinco composições, tipografia,
 *      textura, luz e o que evitar, SEM as cores do modelo;
 *   2  a peça (a foto do dia, cada lâmina do carrossel) é pedida ao Nano Banana
 *      Pro com esse estilo, o texto EXATO da peça, o contexto do post e as
 *      cores da MARCA nos papéis (fundo, texto, destaque nos detalhes); a
 *      conferência de toda arte lê o que ele escreveu (lib/media/arte-por-rede.ts)
 *      e a reprovação de escrita refaz no GPT Image;
 *   3  VARIEDADE: a composição sai da lista do estilo por dia (cada peça da
 *      semana numa composição diferente) e, no carrossel, por lâmina (mesma
 *      linguagem, composições variadas);
 *   4  o infográfico vai pelo desenho de sempre (Nano Banana Pro com o
 *      conteúdo extraído), com o estilo do modelo como linguagem;
 *   5  a IA falhou: o caminho de hoje (a cena da IA com a frase em código).
 *
 * A trava: ARTE_PELO_MODELO=1 escolhe as artes pelo modelo; dentro dela,
 * ARTE_PELO_MODELO_IA=0 volta ao template do worker (desligado por padrão: a IA
 * é o caminho). Este arquivo é PURO (sem banco, sem rede).
 */

export type PromptDeEstilo = {
  nomeDoEstilo: string;
  atmosfera: string;
  elementoVisual: string;
  composicoes: string[];
  tipografia: string;
  textura: string;
  luz: string;
  papeisDasCores: string;
  evitar: string;
  soTipografico: boolean;
  fonte?: string;
};

const PROMPTS = prompts as Record<string, PromptDeEstilo>;

/** As artes pelo modelo vão pela IA de imagem (o padrão) ou pelo template do worker (ARTE_PELO_MODELO_IA=0)? */
export function arteDoModeloPelaIa(env: Record<string, string | undefined> = process.env): boolean {
  return env.ARTE_PELO_MODELO_IA?.trim() !== "0";
}

/** O prompt de estilo do modelo (a versão deitada "-16x9" usa o do vertical). Null sem prompt gerado. */
export function promptDeEstiloDoModelo(id: string | null | undefined, lista: Record<string, PromptDeEstilo> = PROMPTS): PromptDeEstilo | null {
  if (!id) return null;
  const base = id.replace(/-(16x9|9x16)$/, "");
  const p = lista[id] ?? lista[base];
  return p && p.composicoes?.length ? p : null;
}

/**
 * A composição da peça, para a semana não sair com a mesma cara: a foto do dia
 * gira pela lista com o dia da semana; o carrossel começa no dia e cada lâmina
 * anda uma casa (mesma linguagem, composições variadas). Puro.
 */
export function composicaoDaPeca(estilo: Pick<PromptDeEstilo, "composicoes">, o: { dia?: number | null; lamina?: number | null }): string {
  const lista = estilo.composicoes.filter(Boolean);
  if (!lista.length) return "";
  const dia = Math.max(0, Math.floor(o.dia ?? 0));
  const lamina = Math.max(0, Math.floor(o.lamina ?? 0));
  return lista[(dia + lamina) % lista.length];
}

/** Travessão nunca vai para texto de peça (regra do Bruno): vira vírgula. */
function semTravessao(t: string): string {
  return t.replace(/\s*[\u2014\u2013]\s*/g, ", ").replace(/\s+/g, " ").trim();
}

/** Aspas duplas dentro da frase viram simples para não quebrar a citação. */
function citar(s: string): string {
  return `"${semTravessao(s).replace(/"/g, "'")}"`;
}

/** Equipamento de gravação só entra quando a frase pede (regra do Bruno de 10/10). */
const EQUIPAMENTO = /\b(c[aâ]mera|microfone|grava[çc][aã]o|gravar|est[uú]dio|trip[eé]|ring ?light|luz de anel|celular)\b/i;
export function frasePedeEquipamento(frase: string): boolean {
  return EQUIPAMENTO.test(frase);
}

export type CoresDaPeca = { fundo: string; titulo: string; destaque: string };

export type EntradaDaArte = {
  estilo: PromptDeEstilo;
  /** O texto exato da peça (a frase do dia, a lâmina). */
  texto: string;
  tipo: "post" | "capa" | "lamina";
  cores: CoresDaPeca;
  composicao: string;
  /** O texto do post (a legenda), para o elemento visual sair do assunto certo. */
  contexto?: string | null;
  nicho?: string | null;
  /** A lâmina do carrossel (1 de n). */
  pagina?: { i: number; total: number } | null;
};

/** Texto de contexto cortado na palavra. */
function curto(s: string | null | undefined, max: number): string {
  const t = semTravessao(s ?? "");
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, "").replace(/[\s,;:.]+$/, "");
}

/**
 * O PROMPT DA PEÇA: o estilo do modelo (forma), a cor da marca (cor), o texto
 * exato e o assunto. Instruções em inglês (a língua dos prompts de imagem da
 * casa), a frase em português entre aspas, as cores em hex. A instrução de
 * formato e a margem entram depois (arte-por-rede cola a dela). Puro.
 */
export function promptDaArteNoModelo(e: EntradaDaArte): string {
  const s = e.estilo;
  const texto = semTravessao(e.texto);
  const papel =
    e.tipo === "capa"
      ? "the COVER slide of an Instagram carousel (it must stop the scroll)"
      : e.tipo === "lamina"
        ? "one INNER slide of an Instagram carousel"
        : "a single Instagram feed post";
  const linhas = [
    `Create a finished, publication ready social media image: ${papel}, in Brazilian Portuguese, in the visual style called ${s.nomeDoEstilo}. Premium art direction, crisp rendering, nothing amateur.`,
    "",
    `STYLE (faithful to this look; it decides HOW things are drawn): ${s.atmosfera} ${s.textura} ${s.luz}`,
    `VISUAL ELEMENT: ${s.elementoVisual} Build it from the idea of the sentence and its subject${e.nicho ? ` (the world of ${curto(e.nicho, 80)})` : ""}, as a metaphor; one strong element, not a collage of small things.`,
    `COMPOSITION FOR THIS PIECE: ${e.composicao} The hero sentence and the visual element are both large and clearly separated; nothing tiny, nothing floating at random.`,
    "",
    `TYPOGRAPHY: ${s.tipografia} The sentence is the hero text, big and highly readable on a phone, at most 4 balanced lines; a line never starts with a punctuation mark.`,
    `TEXT: render EXACTLY this sentence, once, letter by letter, every accent and cedilla correct, no word changed, added or removed: ${citar(texto)}`,
    `No other word, letter or number anywhere: no label, page number, logo, watermark, signature, date, place name, fake interface or English word. Font names, the style name, the subject and every instruction in this prompt are NEVER written on the image. Leave out anything that would normally carry writing (price tags, signs, plaques, screens, documents, buttons).`,
    `LABELS: any label, arrow, callout, leader line, tag, caption or annotation that the style uses may ONLY contain words copied from the sentence above (for example pointing to one of its key words); otherwise draw it as lines and dots with NO text at all. Never invent a label word.`,
    "",
    `COLORS (the client's brand, use exactly; ignore any color the style might suggest): background and dominant field ${e.cores.fundo}; hero text ${e.cores.titulo}; accent ${e.cores.destaque} ONLY in details (thin lines, highlights, one or two key words, small shapes, lights). ${s.papeisDasCores} Rendered materials and light keep their natural look; the brand color is never a tint over the whole image.`,
    "",
    `AVOID: ${s.evitar} No people, faces, hands or silhouettes.${frasePedeEquipamento(texto) ? "" : " No camera, microphone, ring light, tripod, phone on a stand or recording studio."} No empty boxes, empty frames, empty windows or placeholder panels: every shape is filled with the scene or with solid color. No long dash.`,
  ];
  if (e.pagina && e.pagina.total > 1) {
    linhas.push(
      "",
      `CAROUSEL: this is slide ${e.pagina.i} of ${e.pagina.total}. Same visual language, typography and colors as the other slides, with its own composition; do not draw page numbers, dots or arrows.`
    );
  }
  const contexto = curto(e.contexto, 420);
  if (contexto) linhas.push("", `SUBJECT OF THE POST (context only, never written on the image): ${contexto}`);
  return linhas.join("\n");
}

/**
 * A CENA NO ESTILO DO MODELO SEM NENHUM TEXTO (11/10, segunda decisão do
 * Bruno): esgotadas as tentativas com o texto desenhado pela IA, a reserva não
 * volta ao estilo antigo. A IA desenha só a cena, no estilo do modelo e nas
 * cores da marca, com uma área calma para a frase, que entra por cima em
 * código (sempre exata). Puro.
 */
export function promptDaCenaNoModelo(e: Omit<EntradaDaArte, "texto"> & { ideia: string }): string {
  const s = e.estilo;
  const contexto = curto(e.contexto, 420);
  return [
    `Create the background artwork of a social media image (${e.tipo === "post" ? "a single Instagram feed post" : "an Instagram carousel slide"}) in the visual style called ${s.nomeDoEstilo}. Premium art direction, crisp rendering.`,
    `STYLE: ${s.atmosfera} ${s.textura} ${s.luz}`,
    `VISUAL ELEMENT: ${s.elementoVisual} Built from this idea, as a metaphor: ${citar(e.ideia)}${e.nicho ? ` (the world of ${curto(e.nicho, 80)})` : ""}. One strong element.`,
    `COMPOSITION: the element fills the lower half (or one side) of the frame; keep the upper third as a calm, clean area of plain ${e.cores.fundo} where a headline will be added later in code.`,
    `COLORS (the client's brand): dominant field ${e.cores.fundo}; light tones ${e.cores.titulo}; accent ${e.cores.destaque} only in details. ${s.papeisDasCores}`,
    `ABSOLUTELY NO TEXT: no letters, words, numbers, labels, captions, logos or signs anywhere; arrows, leader lines and callouts are lines and dots only. No people, faces or hands.${frasePedeEquipamento(e.ideia) ? "" : " No camera, microphone, ring light or recording studio."} No empty boxes or frames.`,
    ...(contexto ? [`SUBJECT (context only, never written): ${contexto}`] : []),
  ].join("\n");
}

/** O estilo como LINGUAGEM, para o infográfico (o layout dele manda; aqui só como desenhar). Puro. */
export function estiloComoLinguagem(s: PromptDeEstilo): string {
  return semTravessao(`${s.nomeDoEstilo}: ${s.atmosfera} ${s.textura} ${s.luz} Typography: ${s.tipografia}`);
}
