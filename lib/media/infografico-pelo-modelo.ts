import { gravarCustoDeImagem, type ContextoMidia } from "@/lib/media/usage";
import { conferirResposta } from "@/lib/fornecedores/aviso-de-saldo";
import { gerarNaHiggsfield, type ImagemGerada } from "@/lib/media/imagem-higgsfield";
import { MARGEM_SEGURA, type ProporcaoPedida } from "@/lib/media/formatos-das-redes";
import { LETRAS } from "@/lib/modelos-de-arte/identidade";
import { modeloPorId } from "@/lib/modelos-de-arte/catalogo";
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
  return t.slice(0, max).replace(/\s+\S*$/, "");
}

/** "Anton-400" vira "Anton"; "PlayfairDisplay-700" vira "Playfair Display". */
function nomeDaFonte(id: string): string {
  return id.replace(/-\d+$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
}

/** As cores nos papéis aprovados (fundo, título, destaque); sem aprovação, as da marca. */
export function coresDoInfografico(marca?: MarcaDaArte): { fundo: string; texto: string; destaque: string } {
  const p = marca?.cores.papeis;
  return {
    fundo: p?.fundo ?? marca?.cores.claro ?? "#f7f5f0",
    texto: p?.titulo ?? marca?.cores.escuro ?? "#15171a",
    destaque: p?.destaque ?? marca?.cores.acento ?? "#F97316",
  };
}

function layoutDaProporcao(proporcao: ProporcaoPedida, modulos: number): string {
  const n = Math.max(modulos, 1);
  if (proporcao === "16:9") {
    return [
      `LAYOUT (horizontal landscape 16:9): title and subtitle across the top; on the left a hero data visual for the main number; on the right the ${n} modules as a left to right flow (a 2x2 grid when there are 4), each with its own icon, joined by arrows; key numbers in a slim strip along the bottom.`,
      `This format is shown small in the feed: keep every text LARGE and short lines. Title at least 7% of the image height, module text at least 3.5% of the image height. Fewer decorations, more room for the words.`,
    ].join("\n");
  }
  if (proporcao === "9:16") {
    return `LAYOUT (tall vertical 9:16): title and subtitle in the upper third; a big hero data visual for the main number below it; the ${n} modules stacked top to bottom along a vertical flow line with arrows, each with its own icon on the left and its text on the right; key numbers at the bottom, above the safe margin.`;
  }
  if (proporcao === "1:1") {
    return `LAYOUT (square 1:1): title and subtitle at the top; a hero data visual for the main number in the center; the ${n} modules around it as a compact grid with arrows, each with its own icon; key numbers in a bottom strip.`;
  }
  return `LAYOUT (vertical portrait 4:5, Instagram feed): title and subtitle at the top; a hero data visual for the main number right below; then the ${n} modules in a vertical flow (a 2x2 grid when there are 4) connected by arrows, each with its own icon next to its heading; key numbers in a bottom strip.`;
}

export type EntradaDoPrompt = {
  conteudo: ConteudoDoInfografico;
  marca?: MarcaDaArte;
  proporcao: ProporcaoPedida;
  /** O estilo do dia (`estiloDoDia.prompt`) ou o pedido do cliente no chat. Linguagem, nunca chave. */
  estilo?: string;
  /** O nicho do projeto, para os ícones virem do mundo do cliente. */
  nicho?: string | null;
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
  const modelo = (e.marca?.modelos ?? []).map((id) => modeloPorId(id)).find(Boolean) ?? null;
  const secoes = (c.sections ?? []).filter((s) => s.heading?.trim() || s.body?.trim());
  const numeros = (c.keyNumbers ?? []).filter((n) => n.value?.trim());
  const setor = e.marca?.identidade?.setor?.nome;
  const publico = e.marca?.identidade?.publico;

  const linhas: string[] = [
    `Create a finished, publication ready INFOGRAPHIC for a social media feed, written in Brazilian Portuguese. Real visual storytelling: every module has its own icon or small spot illustration, there is at least one simple chart drawn from the real numbers (bar, donut, progress bar or before and after), and arrows show how the ideas connect. It must NOT look like a slide of plain text and numbers.`,
    "",
    `SUBJECT: ${curto(e.nicho, 80) || "business"}${setor ? `; sector ${setor}` : ""}${publico ? `; audience ${curto(publico, 140)}` : ""}. Icons and illustrations come from the subject of the text below and from this world.`,
    "",
    `HIERARCHY (reading order): 1) the TITLE, the largest text, at the top; 2) the MAIN NUMBER, very big, in the accent color, with its label; 3) the SUBTITLE; 4) the MODULES, each one a heading with its icon, its number when it has one, and its short text; 5) the KEY NUMBERS, small, at the bottom. Generous whitespace, aligned grid, nothing overlapping.`,
    "",
    layoutDaProporcao(e.proporcao, secoes.length),
    "",
    `BRAND IDENTITY (approved by the client, use exactly):`,
    `- background ${cores.fundo}, flat or with a very subtle texture in the same color;`,
    `- title and all body text ${cores.texto};`,
    `- accent ${cores.destaque} ONLY in details: the main number, the module numbers, icon accents, arrows, thin bands and the chart. Never flood the image with the accent and never tint the illustrations entirely with it: illustrations keep natural or neutral tones with accent touches;`,
    letra
      ? `- typography: titles in a ${nomeDaFonte(letra.titulo)} style typeface${letra.caixaAlta ? " in UPPERCASE" : ""}; body text in a ${nomeDaFonte(letra.texto)} style typeface. One type family per role, nothing decorative.`
      : `- typography: one clean ${e.marca?.tipografia ?? "sem-serifa"} family, bold titles, regular body text.`,
  ];
  if (modelo) {
    linhas.push(`- the client approved this art template: carry its visual language (type character and color use), never its layout: "${curto(modelo.estrutura, 200)}"; color use "${curto(modelo.cor, 160)}".`);
  }
  if (e.estilo?.trim()) {
    linhas.push(
      "",
      `ART STYLE of the project. It describes HOW things are drawn (rendering, line, texture, mood). Ignore every object, person, place or scene it names: icons and illustrations come only from the text below, and the infographic layout above always wins. Style: ${curto(e.estilo, 700)}`
    );
  }
  linhas.push(
    "",
    `TEXT: render EXACTLY the strings below, in Brazilian Portuguese, letter by letter, each one once, with every accent and cedilla correct (á, à, â, ã, é, ê, í, ó, ô, õ, ú, ç). Numbers, percent signs, "R$", commas and dots identical. No misspelling, no abbreviation, no word cut in the middle.`,
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
  linhas.push(
    "",
    `DO NOT draw any word, number or label that is not listed above: no step numbers ("01", "1."), no source line, no date, no logo, no watermark, no signature, no speech bubble, no English words, no fake interface. No people, faces, hands or human silhouettes: icons are objects and symbols. Never draw a long dash.`
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
