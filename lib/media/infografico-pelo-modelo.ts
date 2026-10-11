import { gravarCustoDeImagem, type ContextoMidia } from "@/lib/media/usage";
import { conferirResposta } from "@/lib/fornecedores/aviso-de-saldo";
import { gerarNaHiggsfield, type ImagemGerada } from "@/lib/media/imagem-higgsfield";
import { MARGEM_SEGURA, type ProporcaoPedida } from "@/lib/media/formatos-das-redes";
import { LETRAS } from "@/lib/modelos-de-arte/identidade";
import { destaqueLegivel } from "@/lib/media/papeis-da-paleta";
import type { MarcaDaArte } from "@/lib/media/arte-com-frase";
import type { ConteudoDoInfografico } from "@/lib/media/infographic";

/**
 * O INFOGRÁFICO DESENHADO PELO MODELO DE IMAGEM (08/10/2026).
 *
 * O pedido do Bruno, com o print do infográfico da campanha: "os infográficos
 * não estão usando um modelo de IA, pra mim está bem claro, quando peço para
 * o Nano Banana sempre o resultado é outro, fora que o formato sai errado
 * para Instagram". Ele tinha razão nas duas: desde 30/09 o infográfico era um
 * molde desenhado em código (lib/media/infografico-em-codigo.tsx, removido
 * hoje), e o card da semana do vídeo mostrava a versão deitada do LinkedIn.
 *
 * Como fica:
 *   1. O conteúdo continua extraído UMA vez (lib/media/infographic.ts), já sem
 *      número repetido.
 *   2. O Nano Banana Pro (gemini-3-pro-image-preview, o modelo do Google feito
 *      para layout com texto) desenha UMA imagem por proporção do dia, na
 *      proporção nativa (4:5 no Instagram, 16:9 no LinkedIn, Facebook e X),
 *      em 2K, com o texto em português EXATO entre aspas, a hierarquia, as
 *      cores nos papéis aprovados, a letra aprovada, o estilo do dia e o
 *      nicho.
 *   3. A conferência é a de toda arte (lib/media/arte-por-rede.ts): o texto
 *      pedido vai como `textoEsperado`, o Haiku transcreve, o código conta o
 *      que é contagem (número igual, texto inventado) e o JEV decide a
 *      leitura. Reprovação de escrita refaz no OUTRO modelo.
 *   4. Nenhum modelo devolveu a arte: lança `InfograficoSemImagem`, e o card
 *      mostra o erro com o pedido pelo chat, como as outras imagens. Não há
 *      desenho em código calado no lugar.
 *
 * O que a prova de 06/10 (branch infografico-nano-banana, não publicada)
 * ensinou e está aqui: o estilo do projeto trouxe objetos de consórcio para o
 * fundo do 16:9 (o texto do estilo entra só como linguagem, com a ordem de
 * ignorar objetos e cenas citados nele), e o 16:9 foi reprovado na leitura do
 * texto (o prompt pede letra grande no formato deitado).
 */

/** Os modelos que desenham o infográfico, pelo nome da casa. */
export type ModeloDoInfografico = "nano-banana-pro" | "nano-banana-2" | "gpt-image";

/** O id de cada um no fornecedor e o preço por imagem (US$, tabela de 08/10/2026). */
export const FICHA_DO_MODELO: Record<ModeloDoInfografico, { id: string; precoUsd: number }> = {
  // US$ 0,134 em 1K ou 2K (lib/media/usage.ts).
  "nano-banana-pro": { id: "gemini-3-pro-image-preview", precoUsd: 0.134 },
  // US$ 0,101 em 2K (o mesmo cálculo de nano-banana.ts).
  "nano-banana-2": { id: "gemini-3.1-flash-image-preview", precoUsd: 0.101 },
  // GPT Image 2.5 em qualidade média pela Higgsfield (estimativa da tabela da casa).
  "gpt-image": { id: "higgsfield-gpt-image-2.5-medium", precoUsd: 0.06 },
};

/**
 * A ORDEM DE QUEM DESENHA.
 *
 * A principal começa no Nano Banana Pro. Se ele não devolver imagem (fora do
 * ar, recusa, prazo), o Nano Banana 2 tenta, que aceita a mesma proporção
 * nativa; depois o GPT Image.
 *
 * A alternativa é a do `desenharAlternativo` de arte-por-rede: a conferência
 * reprovou a ESCRITA, e refazer no mesmo modelo que acabou de errar é esperar
 * sorte. Ela começa por outra família (GPT Image), segue no Nano Banana 2 e só
 * então volta ao Pro.
 */
export const ORDEM_PRINCIPAL: ModeloDoInfografico[] = ["nano-banana-pro", "nano-banana-2", "gpt-image"];
export const ORDEM_ALTERNATIVA: ModeloDoInfografico[] = ["gpt-image", "nano-banana-2", "nano-banana-pro"];

/** A operação gravada no extrato de custo, quando quem chama não diz outra. */
export const OPERACAO_DO_INFOGRAFICO = "infografico";

/**
 * Nenhum modelo devolveu o infográfico. A mensagem é NEUTRA porque chega à
 * tela do cliente (regra de 21/09: o cliente não lê fornecedor nem saldo); o
 * motivo de cada modelo fica em `motivos` e no log do servidor, e a falta de
 * saldo já virou aviso ao admin em `conferirResposta`.
 */
export class InfograficoSemImagem extends Error {
  constructor(public motivos: string[]) {
    super("o infográfico não saiu desta vez: nenhum modelo de imagem devolveu a arte. Peça pelo chat deste card para gerar de novo");
    this.name = "InfograficoSemImagem";
  }
}

/** Pelo nome também: o mesmo módulo pode carregar duas vezes (caminho do Windows), e aí o instanceof falha. */
export function ehInfograficoSemImagem(e: unknown): e is InfograficoSemImagem {
  return e instanceof InfograficoSemImagem || (e instanceof Error && e.name === "InfograficoSemImagem");
}

// ───────────────────────────── o texto ─────────────────────────────

/** O travessão sai de todo texto da peça (regra do Bruno): vira vírgula. */
export function semTravessao(t: string): string {
  return t.replace(/\s*[\u2014\u2013]\s*/g, ", ").replace(/\s+/g, " ").trim();
}

/** O conteúdo com o travessão trocado em todos os campos. Puro. */
export function conteudoSemTravessao(c: ConteudoDoInfografico): ConteudoDoInfografico {
  const t = (s: string | undefined) => (typeof s === "string" ? semTravessao(s) : s);
  return {
    ...c,
    title: t(c.title) ?? "",
    subtitle: t(c.subtitle) ?? "",
    sections: (c.sections ?? []).map((s) => ({ ...s, heading: t(s.heading) ?? "", body: t(s.body) ?? "", stat: t(s.stat) })),
    highlight: c.highlight ? { value: t(c.highlight.value) ?? "", label: t(c.highlight.label) ?? "" } : undefined,
    keyNumbers: (c.keyNumbers ?? []).map((n) => ({ value: t(n.value) ?? "", label: t(n.label) ?? "" })),
  };
}

/**
 * Os textos que a imagem TEM de trazer, na ordem de leitura. É o
 * `textoEsperado` da conferência: o que o modelo escreveu é comparado com isto.
 */
export function textosDoInfografico(c: ConteudoDoInfografico): string[] {
  const t: string[] = [];
  const add = (s?: string | null) => {
    const v = semTravessao(s ?? "");
    if (v && !t.includes(v)) t.push(v);
  };
  add(c.title);
  add(c.highlight?.value);
  add(c.highlight?.label);
  add(c.subtitle);
  for (const s of c.sections ?? []) {
    add(s.heading);
    add(s.stat);
    add(s.body);
  }
  for (const n of c.keyNumbers ?? []) {
    add(n.value);
    add(n.label);
  }
  add(c.fonte);
  return t;
}

// ───────────────────────────── o prompt ─────────────────────────────

/** Aspas duplas dentro do texto viram simples para não quebrar a citação. */
function q(s: string): string {
  return `"${semTravessao(s).replace(/"/g, "'")}"`;
}

/** Texto de configuração cortado na palavra, sem ponto final duplicado. */
function curto(s: string | null | undefined, max: number): string {
  const t = (s ?? "").replace(/\s+/g, " ").trim().replace(/\.+$/, "");
  if (t.length <= max) return t;
  // Corta na palavra e não deixa vírgula ou dois-pontos pendurados no fim.
  return t.slice(0, max).replace(/\s+\S*$/, "").replace(/[\s,;:.]+$/, "");
}

/** "Anton-400" vira "Anton"; "PlayfairDisplay-700" vira "Playfair Display". */
function nomeDaFonte(id: string): string {
  return id.replace(/-\d+$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
}

/** As cores nos papéis aprovados (fundo, título, destaque); sem aprovação, as da marca. */
export function coresDoInfografico(marca?: MarcaDaArte): { fundo: string; texto: string; destaque: string; destaqueNoTexto: string } {
  const p = marca?.cores.papeis;
  const fundo = p?.fundo ?? marca?.cores.claro ?? "#f7f5f0";
  const destaque = p?.destaque ?? marca?.cores.acento ?? "#F97316";
  return {
    fundo,
    texto: p?.titulo ?? marca?.cores.escuro ?? "#15171a",
    destaque,
    // A letra e o número em destaque com contraste de leitura (11/10); a cor da marca segue nos detalhes.
    destaqueNoTexto: destaqueLegivel(destaque, fundo),
  };
}

/**
 * A LINGUAGEM DO ESTILO ESCOLHIDO no infográfico (11/10): na Maquete 3D o
 * infográfico saía escuro e genérico, com ícones chapados, porque o estilo
 * entrava só como "como desenhar" e o desenho dele (a maquete) era mandado
 * ignorar. Com a linguagem, o elemento visual do estilo desenha o visual
 * principal e as ilustrações dos módulos, no lugar dos ícones.
 */
export type LinguagemDoInfografico = { nome: string; desenho: string; elemento: string; tipografia: string; evitar: string };

// A FAIXA DE NÚMEROS SÓ EXISTE COM NÚMERO REAL (08/10, prova paga): o layout pedia "key numbers in a
// bottom strip" mesmo sem número nenhum, e o modelo preencheu a faixa inventando "67%", "82%" e "3x".
function layoutDaProporcao(proporcao: ProporcaoPedida, modulos: number, comNumeros: boolean): string {
  const n = Math.max(modulos, 1);
  const faixa = (t: string) => (comNumeros ? t : "NO number strip at the bottom: end with the last module, then empty space.");
  if (proporcao === "16:9") {
    return [
      `LAYOUT (horizontal landscape 16:9): title and subtitle on top; main number with its chart on the left; the ${n} modules on the right as a left to right flow joined by arrows (2x2 grid when there are 4); ${faixa("key numbers in a slim bottom strip.")}`,
      `Shown small in the feed: keep every text LARGE, title at least 7% of the image height, module text at least 3.5%. Fewer decorations, more room for words.`,
    ].join("\n");
  }
  if (proporcao === "9:16") {
    return `LAYOUT (tall vertical 9:16): title and subtitle in the upper third; a big hero data visual for the main number below it; the ${n} modules stacked top to bottom along a vertical flow line with arrows, each with its own icon on the left and its text on the right; ${faixa("key numbers at the bottom, above the safe margin.")}`;
  }
  if (proporcao === "1:1") {
    return `LAYOUT (square 1:1): title and subtitle at the top; a hero data visual for the main number in the center; the ${n} modules around it as a compact grid with arrows, each with its own icon; ${faixa("key numbers in a bottom strip.")}`;
  }
  return `LAYOUT (vertical portrait 4:5, Instagram feed): title and subtitle at the top; a hero data visual for the main number right below; then the ${n} modules in a vertical flow (a 2x2 grid when there are 4) connected by arrows, each with its own icon next to its heading; ${faixa("key numbers in a bottom strip.")}`;
}

export type EntradaDoPrompt = {
  conteudo: ConteudoDoInfografico;
  marca?: MarcaDaArte;
  proporcao: ProporcaoPedida;
  /** O estilo do dia (`estiloDoDia.prompt`) ou o pedido do cliente no chat. Linguagem, nunca chave. */
  estilo?: string;
  /** O nicho do projeto, para os ícones virem do mundo do cliente. */
  nicho?: string | null;
  /** O estilo escolhido (modelo do curso ou opção sob medida): desenha o visual e os módulos, no lugar dos ícones. */
  linguagem?: LinguagemDoInfografico | null;
};

/**
 * O prompt do infográfico. Instruções em inglês (o idioma dos prompts de
 * imagem da casa), o texto da peça em português entre aspas, as cores em hex.
 * Nenhum ramo depende do NOME do estilo ou do modelo: eles entram como texto.
 * A instrução de formato e a margem vêm de fora (arte-por-rede cola a dela, e
 * a correção da tentativa anterior, no fim).
 */
export function promptDoInfografico(e: EntradaDoPrompt): string {
  const c = conteudoSemTravessao(e.conteudo);
  const cores = coresDoInfografico(e.marca);
  const letra = e.marca?.letra ? LETRAS[e.marca.letra] : null;
  const secoes = (c.sections ?? []).filter((s) => s.heading?.trim() || s.body?.trim());
  const numeros = (c.keyNumbers ?? []).filter((n) => n.value?.trim());
  const setor = e.marca?.identidade?.setor?.nome;
  const publico = e.marca?.identidade?.publico;

  const lg = e.linguagem ?? null;
  const temNumero = Boolean(c.highlight?.value?.trim()) || numeros.length > 0 || secoes.some((s) => s.stat?.trim());
  const linhas: string[] = [
    lg
      ? `Create a finished, publication ready INFOGRAPHIC for a social media feed, in Brazilian Portuguese, drawn ENTIRELY in the visual style called ${lg.nome}. Visual storytelling, NOT a slide of text and NOT a generic dark dashboard: the hero visual and every module illustration are drawn in that style (described below), never flat icons or clip art; ${temNumero ? "at least one simple chart drawn ONLY from the numbers listed below (never invent a number, percentage, multiplier or statistic)" : "there is NO number in this infographic: organize it as steps, a comparison or a list, with no chart, percentage or statistic"}, and arrows connecting the ideas.`
      : `Create a finished, publication ready INFOGRAPHIC for a social media feed, in Brazilian Portuguese. Visual storytelling, NOT a slide of text: each module has its own icon or small illustration, ${temNumero ? "at least one simple chart drawn ONLY from the numbers listed below (never invent a number, percentage, multiplier or statistic)" : "NO chart, percentage or statistic (the text below has no number: organize it as steps, a comparison or a list)"}, and arrows connecting the ideas.`,
    "",
    `SUBJECT: ${curto(e.nicho, 90) || "business"}${setor ? `; sector ${setor}` : ""}${publico ? `; audience ${curto(publico, 110)}` : ""}. Icons and illustrations come from the subject of the text below and from this world.`,
    "",
    `HIERARCHY: 1) TITLE, the largest text, at the top; 2) MAIN NUMBER, very big, in the accent color, with its label; 3) SUBTITLE; 4) MODULES (heading, icon, number if any, short text); 5) KEY NUMBERS, small, at the bottom. Generous whitespace, aligned grid, nothing overlapping.`,
    "",
    layoutDaProporcao(e.proporcao, secoes.length, numeros.length > 0),
  ];
  if (lg) {
    linhas.push(
      "",
      `VISUAL STYLE (mandatory; wherever this prompt says icon or illustration, draw it in this style): ${lg.nome}. ${curto(lg.desenho, 420)}`,
      `ILLUSTRATIONS: ${curto(lg.elemento, 520)} The hero visual is the main concrete thing of the text drawn this way; each module gets its own small piece in the same rendering (one object of that module's idea), not an icon.`,
      `STYLE TYPOGRAPHY: ${curto(lg.tipografia, 220)}`,
      `STYLE AVOID: ${curto(lg.evitar, 300)}`
    );
  }
  linhas.push(
    "",
    `BRAND IDENTITY (approved by the client, use exactly):`,
    `- background ${cores.fundo}, flat or with a very subtle texture in the same color;`,
    `- title and all body text ${cores.texto};`,
    `- accent ${cores.destaque} ONLY in details (main number, module numbers, icon accents, arrows, thin bands, the chart); illustrations stay neutral with accent touches, never flooded with it;`,
    ...(cores.destaqueNoTexto.toLowerCase() !== cores.destaque.toLowerCase()
      ? [`- the main number, module numbers and any word written in the accent use ${cores.destaqueNoTexto} (the same hue, adjusted to read on the background); lines and shapes keep ${cores.destaque};`]
      : []),
    letra
      ? nomeDaFonte(letra.titulo) === nomeDaFonte(letra.texto)
        ? `- typography: a ${nomeDaFonte(letra.titulo)} style typeface for everything, bold titles${letra.caixaAlta ? " in UPPERCASE" : ""}, regular body text, nothing decorative.`
        : `- typography: titles in a ${nomeDaFonte(letra.titulo)} style typeface${letra.caixaAlta ? " in UPPERCASE" : ""}; body text in a ${nomeDaFonte(letra.texto)} style typeface; nothing decorative.`
      : `- typography: one clean ${e.marca?.tipografia ?? "sem-serifa"} family, bold titles, regular body text.`
  );
  // O modelo do book NÃO entra: ele é a composição de uma peça de frase
  // ("letra condensada enorme ocupando a peça"), e brigava com o layout do
  // infográfico na prova de 08/10. A identidade entra pelas cores e pela letra.
  // Com a linguagem do estilo escolhido (11/10), ela é o estilo: o texto solto não entra por cima.
  if (e.estilo?.trim() && !lg) {
    linhas.push(
      "",
      `ART STYLE (only HOW things are drawn: rendering, line, texture, mood; ignore any object, person, scene, logo area or word count it names; the layout above wins): ${curto(e.estilo, 450)}`
    );
  }
  linhas.push(
    "",
    `TEXT: render EXACTLY these strings in Brazilian Portuguese, letter by letter, each once, every accent and cedilla correct; numbers, %, "R$", commas and dots identical; no abbreviation, no word cut.`,
    `TITLE: ${q(c.title)}`
  );
  if (c.highlight?.value?.trim()) linhas.push(`MAIN NUMBER: ${q(c.highlight.value)} with the label ${q(c.highlight.label ?? "")}`);
  if (c.subtitle?.trim()) linhas.push(`SUBTITLE: ${q(c.subtitle)}`);
  secoes.forEach((s, i) => {
    const partes = [`heading ${q(s.heading)}`];
    if (s.stat?.trim()) partes.push(`number ${q(s.stat)}`);
    if (s.body?.trim()) partes.push(`text ${q(s.body)}`);
    linhas.push(`MODULE ${i + 1}: ${partes.join("; ")}`);
  });
  if (numeros.length) linhas.push(`KEY NUMBERS: ${numeros.map((n) => `${q(n.value)} with the label ${q(n.label ?? "")}`).join("; ")}`);
  // A FONTE RASTREÁVEL do número de pesquisa (11/10): um rodapé discreto, escrito como pedido.
  const fonte = c.fonte?.trim();
  if (fonte) linhas.push(`SOURCE LINE (small, discreet, at the very bottom, inside the safe margin, in the body text color at low emphasis): ${q(fonte)}`);
  linhas.push(
    "",
    `DO NOT draw any other word, number or label: no step numbers ("01"), ${fonte ? "other source line" : "source line"}, date, logo, watermark, signature, speech bubble, English word or fake interface. No people, faces, hands or silhouettes: icons are objects and symbols. No long dash.`
  );
  return linhas.join("\n");
}

/** A margem pedida quando quem chama não cola a instrução de formato dele. */
function margemPadrao(proporcao: ProporcaoPedida): string {
  const pct = Math.round(MARGEM_SEGURA * 100);
  return `COMPOSITION FORMAT: aspect ratio ${proporcao}. Keep every text, number and icon at least ${pct}% away from all four edges.`;
}

// ───────────────────────────── os modelos ─────────────────────────────

/** O pedido ao Google, separado para o teste conferir a proporção nativa sem rede. Puro. */
export function pedidoAoGoogle(modelo: ModeloDoInfografico, prompt: string, proporcao: ProporcaoPedida): { url: string; corpo: Record<string, unknown> } {
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${FICHA_DO_MODELO[modelo].id}:generateContent`,
    corpo: {
      contents: [{ parts: [{ text: prompt }] }],
      // A proporção NATIVA: 4:5 é aceita pelos dois Nano Banana, e 16:9 é a
      // aceita mais perto do 1,91:1 do LinkedIn e do Facebook (o recorte
      // final tira 3,5% de cima e de baixo). 2K dispensa ampliar para 1080.
      generationConfig: { responseModalities: ["IMAGE", "TEXT"], imageConfig: { aspectRatio: proporcao, imageSize: "2K" } },
    },
  };
}

/** Quem de fato chama um modelo. Parâmetro para o teste trocar por um falso. */
export type GeradorDoInfografico = (modelo: ModeloDoInfografico, prompt: string, proporcao: ProporcaoPedida, ctx: ContextoMidia) => Promise<ImagemGerada | null>;

async function gerarNoGoogle(modelo: ModeloDoInfografico, prompt: string, proporcao: ProporcaoPedida, ctx: ContextoMidia): Promise<ImagemGerada | null> {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) throw new Error("GEMINI_API_KEY não configurada");
  const { url, corpo } = pedidoAoGoogle(modelo, prompt, proporcao);
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
    body: JSON.stringify(corpo),
    // O Pro pensa antes de desenhar: um infográfico em 2K passa de 30 s.
    signal: AbortSignal.timeout(modelo === "nano-banana-pro" ? 150_000 : 100_000),
  });
  if (!r.ok) {
    const texto = await r.text().catch(() => "");
    await conferirResposta("google", { status: r.status, corpo: texto }, `infográfico pelo ${FICHA_DO_MODELO[modelo].id}`);
    throw new Error(`HTTP ${r.status}: ${texto.slice(0, 160)}`);
  }
  const j = (await r.json()) as { candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ inlineData?: { data: string; mimeType?: string } }> } }> };
  const parte = (j.candidates?.[0]?.content?.parts ?? []).find((p) => p.inlineData?.data);
  if (!parte?.inlineData) {
    console.warn(`[infografico] ${FICHA_DO_MODELO[modelo].id} respondeu sem imagem (${j.candidates?.[0]?.finishReason ?? "sem motivo"})`);
    return null;
  }
  const { id, precoUsd } = FICHA_DO_MODELO[modelo];
  gravarCustoDeImagem(id, precoUsd, ctx);
  return { dataUrl: `data:${parte.inlineData.mimeType ?? "image/png"};base64,${parte.inlineData.data}`, modelo: id, custoUsd: precoUsd };
}

/** O gerador de verdade: Google para os Nano Banana, Higgsfield para o GPT Image. */
export const gerarNoModelo: GeradorDoInfografico = async (modelo, prompt, proporcao, ctx) => {
  if (modelo === "gpt-image") {
    // A Higgsfield grava o custo dela e lança `RecuoParaOGoogle` quando não
    // dá (sem vaga, saldo, prazo, prompt longo): aqui vira o próximo da ordem.
    return gerarNaHiggsfield({ gerador: "higgsfield-gpt-image-2.5-medium", prompt, proporcao, ctx });
  }
  return gerarNoGoogle(modelo, prompt, proporcao, ctx);
};

/**
 * Pede a imagem na ordem dada e devolve a primeira que sair. Nenhuma saiu:
 * lança `InfograficoSemImagem` com o motivo de cada modelo.
 */
export async function gerarInfografico(
  prompt: string,
  proporcao: ProporcaoPedida,
  ctx: ContextoMidia,
  ordem: ModeloDoInfografico[] = ORDEM_PRINCIPAL,
  gerar: GeradorDoInfografico = gerarNoModelo
): Promise<ImagemGerada> {
  const motivos: string[] = [];
  for (const modelo of ordem) {
    try {
      const img = await gerar(modelo, prompt, proporcao, ctx);
      if (img) {
        if (motivos.length) console.warn(`[infografico] ${proporcao} saiu no ${modelo} depois de: ${motivos.join(" | ")}`);
        return img;
      }
      motivos.push(`${modelo}: sem imagem`);
    } catch (e) {
      motivos.push(`${modelo}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  console.error(`[infografico] nenhum modelo devolveu o infográfico ${proporcao}: ${motivos.join(" | ")}`);
  throw new InfograficoSemImagem(motivos);
}

export type OpcoesDoDesenho = {
  /** O nicho do projeto. */
  nicho?: string | null;
  /** Onde o custo cai. Sem isto, só a operação "infografico". */
  ctx?: ContextoMidia;
  /** O que vai no fim do prompt (formato, margem e correção); sem isto, a margem padrão. */
  complemento?: string;
  ordem?: ModeloDoInfografico[];
  gerar?: GeradorDoInfografico;
};

/** O prompt completo de uma proporção: o infográfico e, no fim, o formato e a correção. */
export function promptCompleto(entrada: EntradaDoPrompt, complemento?: string): string {
  const fim = complemento?.trim() || margemPadrao(entrada.proporcao);
  return `${promptDoInfografico(entrada)}\n\n${fim}`;
}
