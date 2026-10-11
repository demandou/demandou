import catalogo from "./catalogo.json";
import { formatoDaPeca } from "@/lib/media/formatos-das-redes";
import { chaveDoGrupo, marcarGerando } from "@/lib/modelos-de-arte/espera-da-identidade";
import type { ModeloDoPost } from "@/lib/estilo-dos-posts/tipos";
import type { ConteudoDoInfografico } from "@/lib/media/infographic";

/**
 * AS ARTES DA CAMPANHA PELO TEMPLATE DO MODELO DO CURSO (10/10/2026).
 *
 * Regra do Bruno, aprovada no protótipo (worker/src/modelo/arte-no-modelo.mjs):
 * o post, a capa e as lâminas do carrossel e o infográfico de um projeto que
 * escolheu um modelo do curso, e cujos posts seguem o estilo mestre, saem
 * desenhados pelo PRÓPRIO template do modelo, nas cores da marca (onde o modelo
 * põe a pessoa entra a foto dela da Biblioteca de materiais; sem foto, desde
 * 11/10, um quadro NÍTIDO da gravação diferente em cada peça; sem quadro bom,
 * nada). Desde 11/10 cada peça do lote usa um bloco diferente do modelo (só as
 * lâminas repetem entre si). Quem criou o próprio estilo dos posts ("não gostei")
 * segue o dele, e o modelo que pede capturas ou entradas de fora (`pede` no
 * catálogo) fica no caminho de hoje.
 *
 * O desenho:
 *   1  a semana do vídeo (lib/media/pecas-da-semana.ts) junta as peças visuais
 *      de todos os dias numa coleta e cria os posts SEM arte, marcados
 *      "gerando" (a mesma marca do "Aprovar e gerar": o quadro mostra "o squad
 *      está fazendo"), com `arteNoModelo` dizendo de qual lote e de quais
 *      peças a arte do post sai;
 *   2  a coleta vai ao worker num pedido por execução (POST /arte-no-modelo,
 *      até 10 peças por pedido; mais que isso, o resto vai num segundo);
 *   3  o callback (app/api/editor-do-curso/arte-callback) põe cada imagem no
 *      post certo e, no que falhou, desenha pelo caminho de hoje (a reserva):
 *      nenhum post fica sem arte.
 *
 * A trava é ARTE_PELO_MODELO=1 (desligada por padrão). Este arquivo é PURO
 * (sem banco, sem rede): as decisões e as contas, que o teste prova.
 */

/** O 16:9 (11/10) é só da capa do vídeo completo no YouTube (lib/media/capa-pelo-modelo.ts). */
export type FormatoNoModelo = "4:5" | "1:1" | "9:16" | "16:9";
export type TipoDaPecaNoModelo = "post" | "capa" | "lamina" | "infografico";
/** `fotoUrl` (11/10): a foto da pessoa DESTA peça (um quadro nítido diferente da gravação por peça). */
export type PecaDoLote = { tipo: TipoDaPecaNoModelo; texto: string; formatos: FormatoNoModelo[]; fotoUrl?: string };

const FORMATOS: ReadonlySet<string> = new Set(["4:5", "1:1", "9:16", "16:9"]);
/** Os travessões (longo e meio), que nunca vão para texto de peça ou de legenda. */
const TRACOS = /[\u2014\u2013]/g;

type ModeloDoCatalogo = { id: string; formato: string; pede: string[]; automatico: boolean };
const CATALOGO = catalogo as ModeloDoCatalogo[];

export function arteDoModeloLigada(env: Record<string, string | undefined> = process.env): boolean {
  return env.ARTE_PELO_MODELO?.trim() === "1"; // trim (10/10, noite): a variável foi gravada com quebra de linha e o caminho nunca ligou
}

/**
 * O modelo serve às artes? Vertical, que roda inteiro sozinho e que não pede
 * nada de fora (capturas de tela, gravação de tela, fotos de antes e depois):
 * sem essas entradas, o template desenharia a peça com o lugar delas vazio.
 */
export function modeloServeParaArte(id: string | null | undefined, lista: ModeloDoCatalogo[] = CATALOGO): boolean {
  const m = lista.find((x) => x.id === id);
  return Boolean(m && m.automatico && m.formato === "9:16" && (m.pede ?? []).length === 0);
}

export type RegraDaArte = { usa: true; modelo: string } | { usa: false; motivo: string };

/**
 * A regra do PROJETO: trava ligada, modelo do curso escolhido e que serve às
 * artes, e o estilo dos posts não foi trocado pelo próprio do cliente
 * (`estiloProprio`: o "Meu estilo" confirmado que não veio do modelo).
 */
export function decidirArtePeloModelo(o: { ligada: boolean; modelo: string | null | undefined; estiloProprio: boolean; lista?: ModeloDoCatalogo[] }): RegraDaArte {
  if (!o.ligada) return { usa: false, motivo: "ARTE_PELO_MODELO desligada" };
  if (!o.modelo) return { usa: false, motivo: "o projeto não tem modelo do curso" };
  if (!modeloServeParaArte(o.modelo, o.lista)) return { usa: false, motivo: `o modelo ${o.modelo} pede entradas de fora ou não serve às artes` };
  if (o.estiloProprio) return { usa: false, motivo: "o cliente criou o próprio estilo dos posts" };
  return { usa: true, modelo: o.modelo };
}

/**
 * A regra do DIA: foto e carrossel no estilo mestre (a escolha do dia; sem
 * escolha, o padrão do projeto), o infográfico quando o projeto segue o mestre.
 * O dia com fotos escolhidas pela pessoa (material próprio) fica no caminho de
 * hoje: o lote do modelo leva uma foto só, e a escolha dela manda.
 */
export function diaVaiPeloModelo(o: { formato: string; modeloDoDia?: ModeloDoPost | null; modo: "mestre" | "por-post"; fotosDoDia: number }): boolean {
  if (o.fotosDoDia > 0) return false;
  if (o.formato === "image" || o.formato === "carousel") return o.modeloDoDia ? o.modeloDoDia.mestre === true : o.modo === "mestre";
  if (o.formato === "infographic") return o.modo === "mestre";
  return false;
}

/**
 * O formato da peça no modelo, pela especificação da rede
 * (lib/media/formatos-das-redes.ts): o feed do Instagram em 4:5, o carrossel em
 * 4:5 em todas as redes, story e reels em 9:16, e as redes de paisagem
 * (LinkedIn, Facebook, X) no quadrado 1:1, que todas aceitam: o template do
 * modelo é vertical e não tem versão deitada para post.
 */
export function formatoNoModelo(platform: string, tipo: string): FormatoNoModelo {
  if (tipo === "carousel") return "4:5";
  const t = tipo === "stories" || tipo === "reels" || tipo === "story" ? "stories" : tipo === "infographic" ? "infographic" : "image";
  const f = formatoDaPeca(platform, t);
  if (f.proporcao === "4:5") return "4:5";
  if (f.proporcao === "9:16") return "9:16";
  return "1:1";
}

/**
 * O texto do infográfico no modelo: o título, o destaque e os títulos dos
 * cartões, em frases fechadas, até `maxPalavras` (o título entra sempre). O
 * template mostra o texto inteiro parado; parágrafos inteiros não caberiam. Puro.
 */
export function textoDoInfograficoNoModelo(c: Pick<ConteudoDoInfografico, "title" | "highlight" | "sections">, maxPalavras = 32): string {
  const fechar = (s: string) => {
    const t = s.replace(/\s+/g, " ").replace(TRACOS, ",").trim();
    return t && !/[.!?…:]$/.test(t) ? `${t}.` : t;
  };
  const palavras = (s: string) => s.split(/\s+/).filter(Boolean).length;
  const partes = [fechar(c.title ?? "")].filter(Boolean);
  const extras = [
    c.highlight?.value ? fechar(`${c.highlight.value} ${c.highlight.label ?? ""}`) : "",
    ...(c.sections ?? []).map((s) => fechar(s.heading ?? "")),
  ].filter(Boolean);
  let total = partes.reduce((s, p) => s + palavras(p), 0);
  for (const e of extras) {
    if (total + palavras(e) > maxPalavras) continue;
    partes.push(e);
    total += palavras(e);
  }
  return partes.join(" ");
}

/**
 * As peças de um dia no modelo e o formato de cada rede do dia. A foto e o
 * infográfico são UMA peça com um formato por proporção das redes (o quadro sai
 * uma vez e o worker recompõe em cada formato); o carrossel é a capa e as
 * lâminas, todas em 4:5. Puro.
 */
export function pecasDoDiaNoModelo(o: {
  formato: "image" | "carousel" | "infographic";
  redes: string[];
  frase?: string | null;
  slides?: string[] | null;
  infografico?: Pick<ConteudoDoInfografico, "title" | "highlight" | "sections"> | null;
}): { pecas: PecaDoLote[]; formatoDaRede: Record<string, FormatoNoModelo> } {
  const formatoDaRede = Object.fromEntries(o.redes.map((r) => [r, formatoNoModelo(r, o.formato)])) as Record<string, FormatoNoModelo>;
  const formatos = [...new Set(Object.values(formatoDaRede))];
  if (o.formato === "carousel") {
    const slides = (o.slides ?? []).map((s) => s.trim()).filter(Boolean);
    if (!slides.length) throw new Error("o carrossel não tem as frases das lâminas");
    return { pecas: slides.map((texto, i) => ({ tipo: i === 0 ? "capa" : "lamina", texto, formatos: ["4:5"] })), formatoDaRede };
  }
  if (o.formato === "infographic") {
    if (!o.infografico) throw new Error("o infográfico não tem o conteúdo extraído");
    return { pecas: [{ tipo: "infografico", texto: textoDoInfograficoNoModelo(o.infografico), formatos }], formatoDaRede };
  }
  const frase = (o.frase ?? "").trim();
  if (!frase) throw new Error("a foto do dia não tem a frase");
  return { pecas: [{ tipo: "post", texto: frase, formatos }], formatoDaRede };
}

// ─────────────────────────── a coleta da execução ───────────────────────────

export type LoteDoModelo = { chave: string; pecas: PecaDoLote[] };
export type ColetaDoModelo = { base: string; maximo: number; lotes: LoteDoModelo[] };

/** O teto de peças por pedido ao worker (o mesmo do validarPedido de lá). */
export const PECAS_POR_PEDIDO = 10;

export function novaColeta(base: string, maximo = PECAS_POR_PEDIDO): ColetaDoModelo {
  return { base, maximo, lotes: [] };
}

/**
 * Junta as peças de um dia à coleta e devolve o lote e os índices delas
 * (1, 2, 3... na ordem do pedido, como o worker numera). As peças de um dia
 * nunca se separam (o carrossel sai inteiro de um render); quando não cabem no
 * lote atual, abrem o próximo. Síncrono: os dias que correm em paralelo não
 * se atropelam.
 */
export function adicionarPecas(c: ColetaDoModelo, pecas: PecaDoLote[]): { lote: string; indices: number[] } {
  if (!pecas.length) throw new Error("nenhuma peça para o lote");
  if (pecas.length > c.maximo) throw new Error(`o dia tem ${pecas.length} peças, acima do teto de ${c.maximo} por pedido`);
  let atual = c.lotes[c.lotes.length - 1];
  if (!atual || atual.pecas.length + pecas.length > c.maximo) {
    atual = { chave: `${c.base}-${c.lotes.length + 1}`, pecas: [] };
    c.lotes.push(atual);
  }
  const inicio = atual.pecas.length;
  atual.pecas.push(...pecas);
  return { lote: atual.chave, indices: pecas.map((_, i) => inicio + i + 1) };
}

/**
 * O teto de IA de um lote: a régua das peças medida no protótipo (US$ 0,05 a
 * 0,08 por peça, mais a volta de conserto), com piso de US$ 0,50 e teto de
 * US$ 2. ARTE_PELO_MODELO_TETO_USD troca a conta inteira.
 */
export function tetoDoLoteUsd(pecas: number, env: Record<string, string | undefined> = process.env): number {
  const fixo = Number(env.ARTE_PELO_MODELO_TETO_USD);
  if (fixo > 0) return fixo;
  return +Math.min(2, Math.max(0.5, 0.3 + 0.15 * pecas)).toFixed(2);
}

// ─────────────────────────── a marca no post ───────────────────────────

/**
 * Quanto o "fazendo" vale num post que espera a arte do modelo: o lote entra
 * na fila do worker abaixo dos cortes, e a semana sai junto com eles. Passado
 * isto sem callback, o vigia (lib/media/editor-do-curso/arte-pelo-modelo-servidor.ts)
 * pergunta ao worker e, sem trabalho vivo, desenha pelo caminho de hoje.
 */
export const PRAZO_DA_ARTE_NO_MODELO_MS = 2 * 60 * 60 * 1000;

export type ArteNoModeloDoPost = {
  lote: string;
  /** As peças do lote que fazem a arte deste post (o carrossel, todas as lâminas na ordem). */
  indices: number[];
  formato: FormatoNoModelo;
  modelo: string;
  /** true enquanto o callback não chegou; o vigia e o callback só mexem no que está pendente. */
  pendente: boolean;
  origem: "semana" | "refazer";
  desde: string;
  /** Preenchidos no fim: quando a arte do modelo entrou, ou o motivo de ter ido para a reserva. */
  feitoEm?: string;
  reserva?: string | null;
  custoUsd?: number;
};

/**
 * As marcas de um post cuja arte sai pelo modelo: a espera "gerando" de
 * sempre (lib/modelos-de-arte/espera-da-identidade.ts), com o prazo próprio
 * do lote, e o `arteNoModelo` com o lote e as peças. Puro.
 */
export function marcasDoModelo(
  meta: unknown,
  m: { lote: string; indices: number[]; formato: FormatoNoModelo; modelo: string; origem?: "semana" | "refazer" },
  agora: Date = new Date()
): Record<string, unknown> {
  const arte: ArteNoModeloDoPost = { lote: m.lote, indices: m.indices, formato: m.formato, modelo: m.modelo, pendente: true, origem: m.origem ?? "semana", desde: agora.toISOString() };
  return { ...marcarGerando(meta, agora, { prazoMs: PRAZO_DA_ARTE_NO_MODELO_MS }), arteNoModelo: arte };
}

/** O `arteNoModelo` de um metadata, quando é válido. Puro. */
export function arteNoModeloDe(meta: unknown): ArteNoModeloDoPost | null {
  const a = (meta && typeof meta === "object" ? (meta as { arteNoModelo?: unknown }).arteNoModelo : null) as Partial<ArteNoModeloDoPost> | null | undefined;
  if (!a || typeof a !== "object" || typeof a.lote !== "string" || !Array.isArray(a.indices) || !a.indices.length) return null;
  if (!a.indices.every((i) => Number.isInteger(i) && i > 0) || !FORMATOS.has(String(a.formato))) return null;
  return a as ArteNoModeloDoPost;
}

// ─────────────────────────── o callback ───────────────────────────

export type SaidaDoModelo = { indice: number; url: string; formato: FormatoNoModelo; creditos: string[] };

export type CallbackDaArte = {
  ok: boolean;
  reiniciado: boolean;
  erro: string | null;
  lote: string;
  projectId: string | null;
  pecas: SaidaDoModelo[];
  custoUsd: number;
  avisos: string[];
};

/**
 * O corpo do callback do worker, conferido. Null quando não serve (sem o lote
 * de volta em `retorno`): o callback responde 400. `ok` só com pelo menos uma
 * peça válida; peça com URL que não é https, índice torto ou formato
 * desconhecido é descartada (e o post dela vai para a reserva). Puro.
 */
export function lerCallbackDaArte(bruto: unknown): CallbackDaArte | null {
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return null;
  const b = bruto as Record<string, unknown>;
  const retorno = (b.retorno && typeof b.retorno === "object" ? b.retorno : {}) as Record<string, unknown>;
  const lote = typeof retorno.lote === "string" && retorno.lote.trim() ? retorno.lote.trim() : null;
  if (!lote) return null;
  const pecas: SaidaDoModelo[] = (Array.isArray(b.pecas) ? b.pecas : [])
    .map((p) => p as Record<string, unknown>)
    .filter((p) => p && Number.isInteger(p.indice) && (p.indice as number) > 0 && typeof p.url === "string" && /^https:\/\//.test(p.url) && FORMATOS.has(String(p.formato)))
    .map((p) => ({
      indice: p.indice as number,
      url: p.url as string,
      formato: p.formato as FormatoNoModelo,
      creditos: Array.isArray(p.creditos) ? (p.creditos as unknown[]).filter((c): c is string => typeof c === "string" && c.trim().length > 0).map((c) => c.trim()) : [],
    }));
  const reiniciado = b.reiniciado === true;
  const ok = b.ok === true && !reiniciado && pecas.length > 0;
  const erro = ok ? null : typeof b.erro === "string" && b.erro.trim() ? b.erro.trim().slice(0, 500) : reiniciado ? "o worker reiniciou com o lote na fila" : "o worker não devolveu nenhuma peça";
  return {
    ok,
    reiniciado,
    erro,
    lote,
    projectId: typeof retorno.projectId === "string" ? retorno.projectId : null,
    pecas,
    custoUsd: Number(b.custoUsd) > 0 ? +Number(b.custoUsd).toFixed(4) : 0,
    avisos: Array.isArray(b.avisos) ? (b.avisos as unknown[]).filter((a): a is string => typeof a === "string").slice(0, 20) : [],
  };
}

export type PostDoLote = { id: string; platform: string; mediaType: string | null; imageUrl: string | null; runId: string | null; dayOfWeek: number | null; metadata: unknown };

export type PlanoDoCallback = {
  /** Os posts que recebem a arte do modelo: a imagem (o carrossel, as lâminas juntas por "|") e os créditos. */
  preencher: Array<{ postId: string; imageUrl: string; creditos: string[] }>;
  /** Os grupos (as redes do mesmo dia) que vão para o caminho de hoje, com o motivo. */
  reserva: Array<{ postIds: string[]; motivo: string }>;
  /** Posts do lote que não esperam mais (já têm arte, ou outro caminho já os preencheu). */
  ignorados: string[];
};

/**
 * Do callback às mudanças nos posts, SEM banco: cada post pendente do lote
 * recebe as imagens dos seus índices no seu formato. A decisão da reserva é por
 * GRUPO (as redes do mesmo dia): faltou uma peça de qualquer post do grupo, o
 * grupo inteiro vai para o caminho de hoje, para o dia não sair com duas caras
 * (e o carrossel nunca sai com lâminas de dois desenhos). Puro.
 */
export function planoDoCallback(posts: PostDoLote[], cb: CallbackDaArte): PlanoDoCallback {
  const plano: PlanoDoCallback = { preencher: [], reserva: [], ignorados: [] };
  const grupos = new Map<string, Array<{ post: PostDoLote; arte: ArteNoModeloDoPost }>>();
  for (const post of posts) {
    const arte = arteNoModeloDe(post.metadata);
    // Já na reserva (um callback repetido): o caminho de hoje está com ele, não vai de novo.
    if (!arte || arte.lote !== cb.lote || !arte.pendente || arte.reserva || post.imageUrl) {
      plano.ignorados.push(post.id);
      continue;
    }
    const chave = chaveDoGrupo({ postId: post.id, runId: post.runId, dayOfWeek: post.dayOfWeek, mediaType: post.mediaType ?? "image" });
    grupos.set(chave, [...(grupos.get(chave) ?? []), { post, arte }]);
  }
  for (const grupo of grupos.values()) {
    const ids = grupo.map((g) => g.post.id);
    if (!cb.ok) {
      plano.reserva.push({ postIds: ids, motivo: cb.erro ?? "o lote falhou" });
      continue;
    }
    const prontos: PlanoDoCallback["preencher"] = [];
    let falta: string | null = null;
    for (const { post, arte } of grupo) {
      const saidas = arte.indices.map((i) => cb.pecas.find((p) => p.indice === i && p.formato === arte.formato));
      const sem = arte.indices.filter((_, k) => !saidas[k]);
      if (sem.length) {
        falta = `faltou a peça ${sem.join(", ")} em ${arte.formato}`;
        break;
      }
      prontos.push({ postId: post.id, imageUrl: saidas.map((s) => s!.url).join("|"), creditos: [...new Set(saidas.flatMap((s) => s!.creditos))] });
    }
    if (falta) plano.reserva.push({ postIds: ids, motivo: falta });
    else plano.preencher.push(...prontos);
  }
  return plano;
}

/**
 * A legenda com os créditos das fotos de banco (Pexels, Pixabay, Openverse e
 * as de licença que pede atribuição), como o curso manda ("cole na legenda do
 * post"). Linha que a legenda já tem não se repete; no X, onde o texto é curto,
 * os créditos vão compactos (o link, ou o nome quando não há link). Puro.
 */
export function legendaComCreditos(conteudo: string, linhas: string[], rede: string): string {
  const texto = conteudo ?? "";
  // A linha sem o "Imagem: " do worker é o que vai para a legenda (e o que se procura nela).
  const corpo = (l: string) => l.replace(/^Imagem:\s*/, "");
  const curto = (l: string) => /https?:\/\/\S+/.exec(l)?.[0] ?? corpo(l).slice(0, 80);
  const x = rede === "twitter" || rede === "x";
  const novas = [...new Set(linhas.map((l) => l.replace(TRACOS, ",").trim()).filter(Boolean))].filter((l) => !texto.includes(x ? curto(l) : corpo(l)));
  if (!novas.length) return texto;
  if (x) return `${texto.trimEnd()}\n\nCréditos: ${novas.map(curto).join(" ")}`;
  const bloco = novas.length === 1 ? `Crédito da imagem: ${corpo(novas[0])}` : `Créditos das imagens:\n${novas.map((l) => `- ${corpo(l)}`).join("\n")}`;
  return `${texto.trimEnd()}\n\n${bloco}`;
}
