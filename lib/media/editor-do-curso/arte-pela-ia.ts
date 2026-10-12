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
 *   5  a IA falhou: tenta de novo no MESMO estilo (a cena do estilo sem texto,
 *      com a frase em código) e, sem sair, a peça para como falha técnica com
 *      "Tentar de novo" (11/10, regra do Bruno: nunca trocar o estilo sozinho;
 *      o caminho antigo, o template genérico e o modelo de reserva não entram).
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
  /**
   * O estilo põe a pessoa (o Recorte com letreiro). Desde 11/10 a IA NUNCA a
   * desenha: ela faz só o fundo e o letreiro, e a pessoa é o recorte real da
   * gravação colado em código (recorte-com-letreiro.tsx).
   */
  pessoa?: boolean;
  /** O elemento visual no infográfico, quando o do estilo não serve a ele (o palco vazio do Recorte). */
  elementoNoInfografico?: string;
};

const PROMPTS = prompts as Record<string, PromptDeEstilo>;

/**
 * OS ESTILOS DAS EDIÇÕES SOB MEDIDA (11/10, Bruno escolheu a "Maquete 3D" e as
 * artes saíram no Anatomia, a reserva). Escritos à mão a partir das provas
 * aprovadas (aulas 8.1 e 8.2 e o exemplo da aula 6), no mesmo formato dos
 * modelos do curso. Cores sempre as da marca.
 */
export const PROMPTS_SOB_MEDIDA: Record<string, PromptDeEstilo> = {
  "sob-medida-3d": {
    nomeDoEstilo: "Isometric 3D Diorama",
    atmosfera: "Clean, premium explainer look, like a product reveal: one physical object built as a small 3D model on a dark stage, calm and precise.",
    elementoVisual: "A clean isometric 3D maquette (diorama) of the concrete object the speaker talks about, rendered as a soft matte 3D model with real proportions and parts (for example a tent with its canvas, ropes and stakes; a desk with its tools; a shop with its counter). It may be shown whole, or slightly exploded into its parts floating apart with thin leader lines, or being rebuilt. Smooth materials, soft contact shadows, a thin accent outline marking its footprint on the floor.",
    composicoes: [
      "Hero text large in the upper third; the 3D maquette whole and centered below it, seen from a three quarter isometric angle, with a thin accent outline of its footprint on the floor.",
      "Hero text in the lower third; the maquette in the upper half, exploded into its parts floating slightly apart, with thin leader lines between the parts.",
      "Hero text in a left column; the maquette on the right, larger, cropped slightly by the edge, seen from a low isometric angle.",
      "Hero text centered at the top; the maquette small in the center of a wide empty dark stage, with long soft shadows and lots of negative space.",
      "Hero text at the bottom; the maquette close up, filling the upper two thirds, one part highlighted with the accent while the rest stays neutral.",
    ],
    tipografia: "A heavy geometric sans serif like Montserrat ExtraBold for the hero text, uppercase or sentence case, tight but readable tracking; small wide tracked uppercase labels only if made of words of the sentence.",
    textura: "Matte 3D surfaces with soft ambient occlusion on a smooth dark stage; no grain, no clutter.",
    luz: "Soft studio key light from above with a gentle rim light; the accent glows faintly on the outline and on one highlighted part.",
    papeisDasCores: "Dark background dominates; the maquette is in neutral light tones; the accent appears only in the footprint outline, one highlighted part and one or two key words.",
    evitar: "No busy city, no collage of many objects, no photorealistic room, no neon, no text on the model's parts unless copied from the sentence.",
    soTipografico: false,
  },
  // A PESSOA NUNCA É DESENHADA PELA IA (11/10, teste de ponta a ponta: com o
  // quadro nítido como referência, a IA trocou o Bruno por um padre e por um
  // homem de óculos). Princípio da aula 8.2: a IA faz só o fundo e o letreiro
  // grande, com o palco da pessoa vazio; a pessoa é o RECORTE REAL da gravação,
  // colado em código por cima (recorte-com-letreiro.tsx), a cabeça na frente
  // da palavra. As composições variam só os detalhes: o lugar da palavra e do
  // palco é fixo, porque o código cola a pessoa nele.
  "sob-medida-recorte": {
    nomeDoEstilo: "Cutout with Lettering",
    atmosfera: "Bold, personal, editorial, like a magazine cover: a giant word on a smooth dark gradient, made to have the speaker standing in front of it.",
    elementoVisual:
      "A giant, very heavy uppercase KEY WORD as lettering across the upper part of the frame, on a smooth dark radial gradient, and an EMPTY stage below and in front of it, reserved for the real speaker (the cutout from the recording is pasted there later, in code, with the head in front of the lower half of the letters). Beside the empty stage, at most one or two small glassy cards (never touching the giant word, the face or the image border), each with one simple object of the subject drawn inside and no text, and a thin accent outline frame drawn low, behind where the person will stand.",
    composicoes: [
      "The giant word centered in its band; the empty stage centered below; a thin accent outline frame low in the center, behind the stage.",
      "The giant word in its band with a thin accent underline; one small glassy card in the left card area.",
      "The giant word in its band in a light tone; two small glassy cards, one in each card area beside the stage.",
      "The giant word in its band with a thin accent line under it; a faint radial light behind the empty stage.",
      "The giant word in its band; one small glassy card in the right card area; a thin accent outline frame low in the center.",
    ],
    tipografia: "A very heavy geometric sans serif like Montserrat Black, uppercase, for the giant key word, the WHOLE word in one single color, every letter the same.",
    textura: "Smooth dark radial gradient; glassy cards with a soft blur and a thin border.",
    luz: "Soft studio light falling on the empty stage, as if a person stood there; a soft halo of darkness around the edges.",
    papeisDasCores: "Dark gradient background; giant word entirely in one light tone (the accent only in a thin underline or line near it, never on single letters); cards dark with an accent line; the accent never tints the whole image.",
    evitar:
      "NEVER draw any person, face, head, body, hand, silhouette, mannequin, statue or portrait, not even in the cards or in the background: the real speaker is pasted later from the recording, and any drawn person would be a different person. No jagged shapes, no glow blob in the middle, no stickers or emojis.",
    soTipografico: false,
    pessoa: true,
    elementoNoInfografico:
      "A giant, very heavy uppercase key word as lettering in the header area, on a smooth dark gradient; the modules are small dark glassy cards with a thin accent border, each with one simple object of the subject drawn inside. Absolutely no people, faces or silhouettes anywhere.",
  },
  "sob-medida-graficos": {
    nomeDoEstilo: "Charts that Draw Themselves",
    atmosfera: "Clean financial dashboard mood: one big number and one chart on a dark card, calm and credible.",
    elementoVisual: "A dark rounded card with one simple chart (a rising or falling line, bars or a single comparison) drawn with a thin accent line and a soft accent area under it, built only from the numbers in the sentence; when the sentence has no number, a clean comparison card (two terms with a not equal sign, or a before and after) using only words of the sentence.",
    composicoes: [
      "The big number of the sentence on top of a dark card with a line chart rising to the right; the rest of the sentence below the card.",
      "Two dark cards side by side comparing the two values or terms of the sentence, the winner marked with the accent.",
      "One dark card with vertical bars growing left to right, the last bar in the accent; the sentence as the title above.",
      "The sentence as the title at the top; a dark card with a single accent line chart ending in a glowing dot.",
      "A dark card with the two terms of the sentence stacked and a large not equal sign between them in the accent.",
    ],
    tipografia: "A bold geometric sans serif like Montserrat for the sentence and big numbers, with small wide tracked uppercase labels only from words of the sentence.",
    textura: "Dark glassy cards with soft shadows on a dark gradient; thin chart lines.",
    luz: "Even soft light; the accent line and its end dot glow slightly.",
    papeisDasCores: "Dark background and cards; light text; the accent only in the chart line, the highlighted bar and the key number.",
    evitar: "Charts carry NO axis, tick labels, legends, scales or counters: bars and lines are pure shapes. The only number allowed anywhere is one written in the sentence, copied exactly as written there (a number spelled as a word stays a word, never becomes a digit); never a percentage, currency or value that is not in the sentence; no crowded dashboards, no fake interface text, no stock tickers.",
    soTipografico: false,
  },
  // A GENÉRICA (sem técnica fixa: o JEV escolhe a aula de cada corte pela fala).
  // Não é mais oferecida na biblioteca, mas o projeto que a tem gravada segue
  // nela, nunca no modelo de reserva (11/10): a linguagem comum das três aulas.
  "sob-medida": {
    nomeDoEstilo: "Custom Explainer",
    atmosfera: "Premium explainer look built for this speaker: one clear idea per piece on a dark stage, calm, precise and modern.",
    elementoVisual: "ONE concrete thing the speaker talks about, shown in the way that explains it best: a clean matte 3D model of the object, or one simple chart drawn with a thin accent line when the sentence has a number, on a dark stage with soft contact shadows.",
    composicoes: [
      "Hero text large in the upper third; the subject centered below it, seen from a three quarter angle, with a thin accent outline on the floor.",
      "Hero text in the lower third; the subject in the upper half, slightly exploded into its parts with thin leader lines.",
      "Hero text in a left column; the subject on the right, larger, cropped slightly by the edge.",
      "Hero text centered at the top; the subject small in the center of a wide empty dark stage, with long soft shadows.",
      "Hero text at the bottom; the subject close up in the upper two thirds, one part highlighted with the accent.",
    ],
    tipografia: "A heavy geometric sans serif like Montserrat ExtraBold for the hero text, sentence case or uppercase, tight but readable tracking.",
    textura: "Matte 3D surfaces and dark glassy cards with soft ambient occlusion on a smooth dark stage; no grain, no clutter.",
    luz: "Soft studio key light from above with a gentle rim light; the accent glows faintly on one highlighted detail.",
    papeisDasCores: "Dark background dominates; the subject in neutral light tones; the accent only in one outline, one highlighted part or line and one or two key words.",
    evitar: "No busy scenes, no collage of many objects, no neon, no number that is not in the sentence, no text on the subject unless copied from the sentence.",
    soTipografico: false,
  },
};

/** As artes pelo modelo vão pela IA de imagem (o padrão) ou pelo template do worker (ARTE_PELO_MODELO_IA=0)? */
export function arteDoModeloPelaIa(env: Record<string, string | undefined> = process.env): boolean {
  return env.ARTE_PELO_MODELO_IA?.trim() !== "0";
}

/** O id é um estilo de edição sob medida (as três opções ou a genérica)? Puro. */
export function ehEstiloSobMedida(id: string | null | undefined): boolean {
  return Boolean(id && PROMPTS_SOB_MEDIDA[id]);
}

/**
 * Este estilo é desenhado pela IA de imagem? O modelo do curso, quando a IA é
 * o caminho (o padrão); a edição sob medida, SEMPRE: ela não tem template no
 * worker, e o template de outro modelo seria outro estilo (11/10). Puro.
 */
export function estiloVaiPelaIa(modelo: string | null | undefined, env: Record<string, string | undefined> = process.env): boolean {
  if (!promptDeEstiloDoModelo(modelo)) return false;
  return ehEstiloSobMedida(modelo) || arteDoModeloPelaIa(env);
}

/** O prompt de estilo do modelo (a versão deitada "-16x9" usa o do vertical). Null sem prompt gerado. */
export function promptDeEstiloDoModelo(id: string | null | undefined, lista: Record<string, PromptDeEstilo> = PROMPTS): PromptDeEstilo | null {
  if (!id) return null;
  const base = id.replace(/-(16x9|9x16)$/, "");
  const p = lista[id] ?? lista[base] ?? PROMPTS_SOB_MEDIDA[id];
  return p && p.composicoes?.length ? p : null;
}

/**
 * O ESTILO DAS ARTES quando o projeto escolheu uma edição sob medida (11/10):
 * a opção escolhida (as três e a genérica têm prompt próprio). NUNCA o modelo
 * de reserva gravado junto: ele serve só ao corte que falhar na edição, e
 * mesmo lá a regra nova para o corte em vez de trocar. Null quando o escolhido
 * não é sob medida (aí vale o modelo do curso escolhido). Puro.
 */
export function estiloDasArtesDoProjeto(escolhido: string | null | undefined): string | null {
  return escolhido && PROMPTS_SOB_MEDIDA[escolhido] ? escolhido : null;
}

/**
 * O TRECHO DA FALA de onde a peça saiu (11/10): a janela da transcrição que
 * mais divide palavras de conteúdo com a frase e a legenda da peça. Puro.
 */
const VAZIAS = new Set("a o as os de da do das dos e em no na nos nas um uma uns umas que se por para pra com sem seu sua seus suas voce você eu ele ela isso esse essa este esta aqui ai aí la lá mais menos muito muita ja já nao não sim tem ter ser foi vai vou e é ou mas como quando onde porque pq tudo todo toda".split(" "));
function chaves(t: string): string[] {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !VAZIAS.has(w));
}
export function trechoDaFala(transcricao: string | null | undefined, alvo: string, palavras = 70): string | null {
  const todas = (transcricao ?? "").split(/\s+/).filter(Boolean);
  if (!todas.length) return null;
  if (todas.length <= palavras) return todas.join(" ");
  const quer = new Set(chaves(alvo));
  if (!quer.size) return null;
  let melhor = { i: 0, nota: -1 };
  const passo = Math.max(5, Math.floor(palavras / 4));
  for (let i = 0; i + palavras <= todas.length + passo; i += passo) {
    const janela = new Set(chaves(todas.slice(i, i + palavras).join(" ")));
    let nota = 0;
    for (const w of quer) if (janela.has(w)) nota++;
    if (nota > melhor.nota) melhor = { i, nota };
  }
  if (melhor.nota <= 0) return null;
  return todas.slice(melhor.i, melhor.i + palavras).join(" ");
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

/**
 * `destaqueNoTexto` (11/10): a cor da LETRA em destaque, o mesmo matiz da marca
 * com contraste de leitura sobre o fundo (lib/media/papeis-da-paleta.ts,
 * destaqueLegivel). Ausente, a letra usa o próprio destaque.
 */
export type CoresDaPeca = { fundo: string; titulo: string; destaque: string; destaqueNoTexto?: string };

/** A frase das palavras em destaque: cor legível, e nunca a palavra repetida. Puro. */
function linhaDoDestaqueNaLetra(c: CoresDaPeca): string {
  const letra = c.destaqueNoTexto && c.destaqueNoTexto.toLowerCase() !== c.destaque.toLowerCase() ? c.destaqueNoTexto : null;
  return letra
    ? ` Key words written in the accent use ${letra} (the same hue of the accent, lighter or darker so they read clearly on the background); lines and shapes keep ${c.destaque}.`
    : "";
}

/** O que a arte é: o post, a capa e a lâmina do carrossel, e as capas do vídeo (11/10): a thumb 16:9 do completo e a capa 9:16 do corte. */
export type TipoDaArte = "post" | "capa" | "lamina" | "thumb" | "capa-vertical";

export type EntradaDaArte = {
  estilo: PromptDeEstilo;
  /** O texto exato da peça (a frase do dia, a lâmina). */
  texto: string;
  tipo: TipoDaArte;
  cores: CoresDaPeca;
  composicao: string;
  /** O texto do post (a legenda), para o elemento visual sair do assunto certo. */
  contexto?: string | null;
  nicho?: string | null;
  /** A lâmina do carrossel (1 de n). */
  pagina?: { i: number; total: number } | null;
  /** O trecho da transcrição de onde a peça saiu (11/10): o assunto da arte vem dele. */
  trecho?: string | null;
  /** O ajuste pedido pelo cliente no refazer (a capa do corte pelo chat), no mesmo estilo. */
  ajuste?: string | null;
};

/** O papel da peça, dito ao modelo de imagem. Puro. */
function papelDaPeca(tipo: TipoDaArte): string {
  return tipo === "capa"
    ? "the COVER slide of an Instagram carousel (it must stop the scroll)"
    : tipo === "lamina"
      ? "one INNER slide of an Instagram carousel"
      : tipo === "thumb"
        ? "the THUMBNAIL of a YouTube video (16:9, it must win the click at small size: few words, huge type, strong contrast)"
        : tipo === "capa-vertical"
          ? "the COVER of a vertical short video (9:16, Reels, Shorts, TikTok: the key words big in the middle band, nothing important at the very top or bottom)"
          : "a single Instagram feed post";
}

/**
 * O ASSUNTO DA ARTE VEM DA FALA (11/10, Bruno: "as artes não têm nada a ver
 * com o que eu falo no vídeo"). Antes o elemento visual do estilo (engrenagens,
 * olho, cidade) virava o assunto; agora o assunto é um objeto ou uma cena
 * concreta do trecho do vídeo e da frase, e o estilo decide só COMO desenhar.
 * Os objetos que o estilo cita valem só como cenário. Puro.
 */
function linhasDoAssunto(s: PromptDeEstilo, e: { texto: string; trecho?: string | null; contexto?: string | null; nicho?: string | null }): string[] {
  const trecho = curto(e.trecho, 700);
  const contexto = curto(e.contexto, 360);
  return [
    `SUBJECT (what to draw; never written on the image): ONE concrete, physical thing that the speaker literally talks about${trecho ? " in this excerpt of the video" : ""} and that matches the sentence ${citar(e.texto)}: an object, a place, a tool or a scene that is named or described, not an abstract symbol, not a generic metaphor.${trecho ? ` Excerpt of the video: ${citar(trecho)}` : ""}${contexto ? ` Post caption: ${citar(contexto)}` : ""}${e.nicho ? ` The world of ${curto(e.nicho, 80)}.` : ""}`,
    `HOW TO DRAW IT (the style decides only the rendering; the objects it mentions are at most scenery, never the subject): ${s.elementoVisual}`,
  ];
}

/**
 * A IA de imagem NUNCA desenha gente (11/10): nem no estilo que põe a pessoa,
 * onde ela é o recorte real da gravação colado em código. Puro.
 */
function linhaDaPessoa(s: PromptDeEstilo): string {
  return s.pessoa
    ? "No people, faces, heads, bodies, hands or silhouettes anywhere: the real speaker is pasted later from the recording, never drawn."
    : "No people, faces, hands or silhouettes.";
}

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
  const papel = papelDaPeca(e.tipo);
  const linhas = [
    `Create a finished, publication ready social media image: ${papel}, in Brazilian Portuguese, in the visual style called ${s.nomeDoEstilo}. Premium art direction, crisp rendering, nothing amateur.`,
    "",
    `STYLE (faithful to this look; it decides HOW things are drawn): ${s.atmosfera} ${s.textura} ${s.luz}`,
    ...linhasDoAssunto(s, e),
    `COMPOSITION FOR THIS PIECE: ${e.composicao} (where this layout names an object, put the SUBJECT there instead.) The hero sentence and the subject are both large and clearly separated; one strong element, nothing tiny, nothing floating at random.`,
    "",
    `TYPOGRAPHY: ${s.tipografia} The sentence is the hero text, big and highly readable on a phone, at most 4 balanced lines; a line never starts with a punctuation mark.`,
    `TEXT: render EXACTLY this sentence, once, letter by letter, every accent and cedilla correct, no word changed, added or removed: ${citar(texto)}`,
    `No other word, letter or number anywhere: no label, page number, logo, watermark, signature, date, place name, fake interface or English word. Font names, the style name, the subject and every instruction in this prompt are NEVER written on the image. Leave out anything that would normally carry writing (price tags, signs, plaques, screens, documents, buttons).`,
    `LABELS: any label, arrow, callout, leader line, tag, caption or annotation that the style uses may ONLY contain words copied from the sentence above (for example pointing to one of its key words); otherwise draw it as lines and dots with NO text at all. Never invent a label word.`,
    "",
    `COLORS (the client's brand, use exactly; ignore any color the style might suggest): background and dominant field ${e.cores.fundo}; hero text ${e.cores.titulo}; accent ${e.cores.destaque} ONLY in details (thin lines, highlights, one or two key words, small shapes, lights). ${s.papeisDasCores}${linhaDoDestaqueNaLetra(e.cores)} The key words in the accent are words that appear only ONCE in the sentence; never highlight a repeated word. Rendered materials and light keep their natural look; the brand color is never a tint over the whole image.`,
    "",
    `AVOID: ${s.evitar} ${linhaDaPessoa(s)}${frasePedeEquipamento(texto) ? "" : " No camera, microphone, ring light, tripod, phone on a stand or recording studio."} No empty boxes, empty frames, empty windows or placeholder panels: every shape is filled with the scene or with solid color. No real brand logos or app icons (Instagram, TikTok, YouTube, Facebook, WhatsApp and the like), even when the speaker names them: use plain generic shapes. No long dash.`,
  ];
  if (e.ajuste?.trim()) {
    linhas.push("", `CLIENT'S ADJUSTMENT (apply it without leaving the style, the colors or the exact text above): ${citar(curto(e.ajuste, 300))}`);
  }
  if (e.pagina && e.pagina.total > 1) {
    linhas.push(
      "",
      `CAROUSEL: this is slide ${e.pagina.i} of ${e.pagina.total}. Same visual language, typography and colors as the other slides, with its own composition; do not draw page numbers, dots or arrows.`
    );
  }
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
  // Gente nunca (11/10): a pessoa do estilo que a pede é o recorte real, colado em código.
  const pessoa = ` ${linhaDaPessoa(s)}`;
  return [
    `Create the background artwork of ${papelDaPeca(e.tipo)}, in the visual style called ${s.nomeDoEstilo}. Premium art direction, crisp rendering.`,
    `STYLE: ${s.atmosfera} ${s.textura} ${s.luz}`,
    ...linhasDoAssunto(s, { texto: e.ideia, trecho: e.trecho, contexto: e.contexto, nicho: e.nicho }),
    e.tipo === "thumb"
      ? `COMPOSITION (16:9): the subject sits in the RIGHT half of the frame; the LEFT 50% is EMPTY, a flat area of plain ${e.cores.fundo}, where a headline will be added later in code. The whole background is ${e.cores.fundo} (this overrides any paper or surface tone named in the style).`
      : `COMPOSITION: the subject sits in the lower 55% of the frame; the upper 40% is EMPTY, a flat area of plain ${e.cores.fundo}, where a headline will be added later in code. The whole background is ${e.cores.fundo} (this overrides any paper or surface tone named in the style).`,
    `COLORS (the client's brand): dominant field ${e.cores.fundo}; light tones ${e.cores.titulo}; accent ${e.cores.destaque} only in details. ${s.papeisDasCores} Rendered materials, light and skin keep their natural look; the brand color is never a tint over the whole image.`,
    `ABSOLUTELY NO TEXT: no letters, words, numbers, labels, captions, logos or signs anywhere; arrows, leader lines and callouts are lines and dots only.${pessoa}${frasePedeEquipamento(e.ideia) ? "" : " No camera, microphone, ring light or recording studio."} No empty boxes or frames. No real brand logos or app icons.`,
  ].join("\n");
}

/**
 * A letra da frase em código na cena sem texto, pela tipografia do estilo: a
 * frase composta por cima segue o estilo (a geométrica sem serifa da Maquete,
 * a serifada do editorial, a condensada do pôster), não a letra da família. Puro.
 */
export function tipografiaDoEstilo(s: Pick<PromptDeEstilo, "tipografia">): "condensada" | "serifada" | "sem-serifa" {
  const t = s.tipografia ?? "";
  if (/condensed/i.test(t)) return "condensada";
  if (/sans[- ]?serif|grotesk|geometric|montserrat|inter\b|helvetica/i.test(t)) return "sem-serifa";
  if (/serif/i.test(t)) return "serifada";
  return "sem-serifa";
}

/** O estilo como LINGUAGEM, para o infográfico (o layout dele manda; aqui só como desenhar). Puro. */
export function estiloComoLinguagem(s: PromptDeEstilo): string {
  return semTravessao(`${s.nomeDoEstilo}: ${s.atmosfera} ${s.textura} ${s.luz} Typography: ${s.tipografia}`);
}

/**
 * O INFOGRÁFICO NO ESTILO ESCOLHIDO (11/10): a Maquete 3D saiu como infográfico
 * escuro genérico com ícones, porque só a atmosfera do estilo ia ao prompt (e
 * ele mandava ignorar os objetos que o estilo nomeia). Agora o ELEMENTO VISUAL
 * do estilo (a maquete, o recorte, o card com gráfico) desenha o visual
 * principal e os módulos, e o que o estilo evita vale no infográfico. Puro.
 */
export function linguagemDoInfografico(s: PromptDeEstilo): { nome: string; desenho: string; elemento: string; tipografia: string; evitar: string } {
  return {
    nome: s.nomeDoEstilo,
    desenho: semTravessao(`${s.atmosfera} ${s.textura} ${s.luz}`),
    // O palco vazio do Recorte não serve ao infográfico (ninguém é colado nele):
    // o estilo diz o seu elemento de infográfico, sem gente (11/10, o padre).
    elemento: semTravessao(s.elementoNoInfografico ?? s.elementoVisual),
    tipografia: semTravessao(s.tipografia),
    // Sempre: a conferência do infográfico reprova qualquer pessoa, também nos estilos sem apresentador (o Arquivo, 11/10 noite).
    evitar: semTravessao(`${s.evitar} No people, faces or silhouettes in the infographic.`),
  };
}

/**
 * A PALAVRA DO LETREIRO do Recorte (11/10): a palavra de conteúdo mais longa
 * da frase, em caixa alta, com acento. É ela que a IA desenha gigante atrás
 * da cabeça, e só ela (a conferência reprova qualquer outra). Puro.
 */
export function palavraDoLetreiro(frase: string): string {
  const palavras = semTravessao(frase)
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((w) => /\p{L}/u.test(w) && !/\d/.test(w));
  const conteudo = palavras.filter((w) => w.length >= 4 && chaves(w).length > 0);
  const lista = conteudo.length ? conteudo : palavras;
  if (!lista.length) return "";
  const melhor = lista.reduce((a, b) => (b.length > a.length ? b : a));
  return melhor.toLocaleUpperCase("pt-BR");
}

/**
 * A GEOMETRIA DO RECORTE (11/10), a mesma para o prompt do fundo e para o
 * código que cola a pessoa: a faixa da palavra gigante, onde fica o alto da
 * cabeça (na metade de baixo da palavra), o centro e o tamanho máximo da
 * pessoa e a zona da frase em código. Frações da largura (x) e da altura (y).
 * Puro.
 */
export type GeometriaDoRecorte = {
  forma: "deitada" | "alta" | "retrato";
  faixa: { topo: number; base: number };
  topoDaCabeca: number;
  centroX: number;
  larguraMaxima: number;
  cabecaMaxima: number;
  frase: { x: number; y: number; w: number; h: number; alinhar: "fim" | "centro" };
  /**
   * As áreas dos cartões (frações): abaixo da faixa da palavra, acima da frase,
   * nas laterais, longe do rosto (que fica no centro, até a cabeça máxima).
   * Vazia na deitada: a palavra, o palco e a manchete ocupam tudo (11/10, a
   * ampulheta encostada no fim de PRODUTIVIDADE).
   */
  cartoes: Array<{ x0: number; x1: number; y0: number; y1: number }>;
};
/** As duas áreas laterais dos cartões, entre a faixa e a frase, fora do rosto. Puro. */
function areasDosCartoes(faixaBase: number, fraseY: number, cabecaMaxima: number): GeometriaDoRecorte["cartoes"] {
  const y0 = faixaBase + 0.05;
  const y1 = fraseY - 0.08;
  // O rosto ocupa no máximo o centro (0,5 mais ou menos metade da cabeça máxima); folga de 4%.
  const borda = 0.5 - cabecaMaxima / 2 - 0.04;
  const x1 = Math.min(0.26, borda);
  if (y1 - y0 < 0.08 || x1 - 0.1 < 0.08) return [];
  return [
    { x0: 0.1, x1, y0, y1 },
    { x0: 1 - x1, x1: 0.9, y0, y1 },
  ];
}
// A gravação deitada põe braços e ombros largos no quadro: em pé, a pessoa pode
// passar da largura (as laterais são cortadas) para a cabeça chegar à palavra;
// o limite que manda é o da cabeça.
export function geometriaDoRecorte(razao: number): GeometriaDoRecorte {
  if (razao > 1.2) {
    return { forma: "deitada", faixa: { topo: 0.08, base: 0.4 }, topoDaCabeca: 0.27, centroX: 0.7, larguraMaxima: 0.62, cabecaMaxima: 0.2, frase: { x: 0.05, y: 0.48, w: 0.42, h: 0.46, alinhar: "centro" }, cartoes: [] };
  }
  if (razao < 0.65) {
    return { forma: "alta", faixa: { topo: 0.14, base: 0.3 }, topoDaCabeca: 0.235, centroX: 0.5, larguraMaxima: 2.4, cabecaMaxima: 0.42, frase: { x: 0.07, y: 0.6, w: 0.86, h: 0.24, alinhar: "fim" }, cartoes: areasDosCartoes(0.3, 0.6, 0.42) };
  }
  return { forma: "retrato", faixa: { topo: 0.11, base: 0.33 }, topoDaCabeca: 0.25, centroX: 0.5, larguraMaxima: 1.8, cabecaMaxima: 0.36, frase: { x: 0.07, y: 0.68, w: 0.86, h: 0.26, alinhar: "fim" }, cartoes: areasDosCartoes(0.33, 0.68, 0.36) };
}

/** A razão largura/altura de cada proporção pedida ao gerador. Puro. */
export function razaoDaProporcao(proporcao: string): number {
  const [a, b] = proporcao.split(":").map(Number);
  return a > 0 && b > 0 ? a / b : 1;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/**
 * Onde fica cada coisa no fundo do Recorte, na proporção desta imagem (a
 * mesma geometria que o código usa para colar a pessoa). Puro.
 */
export function layoutDoFundoDoRecorte(proporcao: string, comPalavra: boolean): string {
  const g = geometriaDoRecorte(razaoDaProporcao(proporcao));
  const banda = comPalavra
    ? `The giant word spans about 80% of the width (never closer than 9% to the left or right edge), centered horizontally, its letters filling the band between ${pct(g.faixa.topo)} and ${pct(g.faixa.base)} of the image height.`
    : `The band between ${pct(g.faixa.topo)} and ${pct(g.faixa.base)} of the height stays a clean dark gradient (a word goes there later, in code).`;
  const palco =
    g.forma === "deitada"
      ? `The EMPTY STAGE for the person is the right half, from ${pct(g.topoDaCabeca)} of the height down to the bottom edge, centered at ${pct(g.centroX)} of the width: only smooth dark gradient and soft light there. The LEFT half below the band stays plain and dark, with nothing in it (a headline goes there later).`
      : `The EMPTY STAGE for the person is the center of the frame, from ${pct(g.topoDaCabeca)} of the height down to the bottom edge, about 70% of the width: only smooth dark gradient and soft light there. The lower ${pct(1 - g.frase.y)} of the image stays calm and dark (a headline goes there later).`;
  const area = (a: GeometriaDoRecorte["cartoes"][number]) => `from ${pct(a.x0)} to ${pct(a.x1)} of the width and from ${pct(a.y0)} to ${pct(a.y1)} of the height`;
  const cartoes = g.cartoes.length
    ? `CARD AREAS: small cards, if any, fit entirely inside the left card area (${area(g.cartoes[0])}) or the right card area (${area(g.cartoes[1])}). A card never touches or overlaps the giant word, never enters the central stage where the face goes, and never touches the image border.`
    : "NO CARDS in this image: nothing touches or overlaps the giant word, and nothing sits on the stage or in the headline area.";
  return `LAYOUT OF THIS IMAGE: ${banda} ${palco} ${cartoes}`;
}

/**
 * O PROMPT DO FUNDO DO RECORTE (11/10): a IA desenha só o fundo, o letreiro
 * gigante (a palavra exata, ou nada na reserva) e os detalhes do estilo, com
 * o palco da pessoa vazio. Nenhuma pessoa: ela é o recorte real, colado depois
 * em código. O layout por proporção entra em quem desenha
 * (layoutDoFundoDoRecorte). Puro.
 */
export function promptDoFundoDoRecorte(e: {
  estilo: PromptDeEstilo;
  frase: string;
  palavra: string | null;
  tipo: TipoDaArte;
  cores: CoresDaPeca;
  composicao: string;
  contexto?: string | null;
  nicho?: string | null;
  trecho?: string | null;
  pagina?: { i: number; total: number } | null;
  ajuste?: string | null;
}): string {
  const s = e.estilo;
  const palavra = e.palavra ? semTravessao(e.palavra) : null;
  const linhas = [
    `Create the BACKGROUND LAYER of ${papelDaPeca(e.tipo)}, in the visual style called ${s.nomeDoEstilo}. The real speaker will be cut out of the recording and pasted on top of this layer later, in code: this layer has NO person at all. Premium art direction, crisp rendering.`,
    "",
    `STYLE: ${s.atmosfera} ${s.textura} ${s.luz}`,
    // O assunto aqui só enche os cartões: linha curta, para o pedido inteiro (com
    // formato, correção e layout) caber no limite do GPT Image (5000 caracteres).
    `SUBJECT OF THE CARDS (never written): one concrete object the speaker literally talks about, matching ${citar(e.frase)}${e.trecho ? `; excerpt of the video: ${citar(curto(e.trecho, 300))}` : ""}${e.nicho ? `; the world of ${curto(e.nicho, 60)}` : ""}.`,
    `DETAILS FOR THIS PIECE: ${e.composicao} Cards are small, drawn as an object without any text, and stay inside the card areas of the layout (never on the word, never on the face).`,
    "",
    palavra
      ? `THE GIANT WORD: write EXACTLY ${citar(palavra)}, once, in huge, very heavy uppercase letters (${s.tipografia}), every accent correct, no letter changed, added or removed. It is the ONLY text in the image.`
      : "NO WORD: the band of the word stays empty, a clean dark gradient.",
    palavra
      ? `No other word, letter or number anywhere: no label, caption, page number, logo, watermark, signature, date, interface text or English word; the cards carry no text. Font names, the style name and every instruction in this prompt are NEVER written on the image.`
      : "ABSOLUTELY NO TEXT: no letters, words, numbers, labels, captions, logos or signs anywhere.",
    "",
    `COLORS (the client's brand, use exactly): background ${e.cores.fundo};${palavra ? ` the giant word ENTIRELY in ${e.cores.titulo}, every letter the same color (never single letters or pairs of letters in another color; if the accent touches the word, it is only a thin underline or line near it);` : ""} accent ${e.cores.destaque} ONLY in details (thin lines, the outline frame, card borders, small lights). ${s.papeisDasCores}`,
    "",
    `AVOID: ${s.evitar} ${linhaDaPessoa(s)}${frasePedeEquipamento(e.frase) ? "" : " No camera, microphone, ring light, tripod or recording studio."} No real brand logos or app icons. No empty boxes or placeholder panels besides the stage. No long dash.`,
  ];
  if (e.ajuste?.trim()) linhas.push("", `CLIENT'S ADJUSTMENT (apply it to the background without leaving the style, the colors or the layout): ${citar(curto(e.ajuste, 300))}`);
  if (e.pagina && e.pagina.total > 1) linhas.push("", `CAROUSEL: slide ${e.pagina.i} of ${e.pagina.total}; same visual language as the other slides; no page numbers, dots or arrows.`);
  return linhas.join("\n");
}
