import { semTravessao } from "@/lib/biblioteca-de-design/tipos";
import { pedidoDaConversa } from "@/lib/estilo-dos-posts/tipos";
import { FONTES_DO_COMANDO, type FonteDoComando } from "@/lib/media/editor-por-comando/comando";
import { DOLAR_POR_IMAGEM, REAIS_POR_CREDITO, REAIS_POR_DOLAR } from "@/lib/credits/higgsfield-tabela";

/**
 * O MEU ESTILO (08/10/2026), a caixa de criar o próprio estilo. Pedido do
 * Bruno, testando como cliente: "tem que procurar muito para achar a opção de
 * criar o estilo na voz. Tinha que ser uma caixa igual à do ChatGPT: escreva
 * aqui o seu estilo, como você é, numa das primeiras telas. E aí a própria IA
 * gera uma thumb e aquelas peças, o usuário vê se é mais ou menos aquilo. Se
 * ele falar que é, isso treina o modelo para editar os vídeos daquela forma,
 * gerar os posts daquela forma. O usuário nunca vai descrever um prompt
 * perfeito: a IA tem que captar a ideia dele e ajudar a escrever o prompt que
 * de fato entrega o que ele quer."
 *
 * O CAMINHO:
 *   1. o cliente fala ou escreve do jeito dele ("sou farmacêutica, quero
 *      ambiente claro, muita luz, branco e verde");
 *   2. o Claude ESCREVE o estilo completo (redator.ts): o comando do vídeo,
 *      o pedido das artes, do carrossel e do vídeo curto, os prompts das
 *      prévias, e um RESUMO em linguagem simples, que é o que o cliente lê
 *      (nunca o prompt técnico). Usa o nicho, o público, as cores e a letra
 *      da marca e, quando existe, a leitura do perfil dele nas redes;
 *   3. as PRÉVIAS (previas.ts): uma thumb 16:9, um post 4:5, um quadro do
 *      vídeo vertical 9:16 com o elemento e a capa do carrossel 4:5, pelo
 *      gerador de arte (o melhor modelo de imagem); o Gemini só descreve cada
 *      uma e o JEV decide se ela segue o estilo antes de mostrar;
 *   4. "É isso" grava o estilo onde a esteira já lê (servidor.ts) e alimenta a
 *      memória do cliente; "Ajustar" refaz com a fala nova, e as versões
 *      anteriores ficam guardadas.
 *
 * Módulo PURO: a tela importa daqui (nada de banco, env ou rede).
 */

// ─────────────────────────────── o estilo escrito ───────────────────────────────

/** As quatro prévias de cada rodada, na proporção de cada peça. */
export const PECAS_DA_PREVIA = [
  { id: "thumb", rotulo: "Thumb do vídeo", proporcao: "16:9", largura: 1280, altura: 720, comTitulo: true },
  { id: "post", rotulo: "Post", proporcao: "4:5", largura: 1080, altura: 1350, comTitulo: true },
  { id: "vertical", rotulo: "Vídeo vertical", proporcao: "9:16", largura: 1080, altura: 1920, comTitulo: false },
  { id: "carrossel", rotulo: "Capa do carrossel", proporcao: "4:5", largura: 1080, altura: 1350, comTitulo: true },
] as const;

export type PecaDaPrevia = (typeof PECAS_DA_PREVIA)[number]["id"];
export type FichaDaPeca = (typeof PECAS_DA_PREVIA)[number];

export const fichaDaPeca = (id: PecaDaPrevia): FichaDaPeca => PECAS_DA_PREVIA.find((p) => p.id === id)!;

/**
 * O que o Claude escreve a partir da fala do cliente. Os textos de cada peça
 * vão em português (o editor e a biblioteca recebem pedidos em português);
 * os prompts das prévias, em inglês (o modelo de imagem rende melhor).
 */
export type EstiloEscrito = {
  /** O que o cliente lê: 2 ou 3 frases, linguagem simples, sem jargão. */
  resumo: string;
  /** 3 a 6 itens curtos do que ele vai ver ("Ambiente claro, com muita luz natural"). */
  pontos: string[];
  /** O que o estilo nunca usa (ex.: estúdio escuro, ring light), quando a fala ou o nicho pedem. */
  evitar: string[];
  /** O comando do vídeo, completo, para o editor por comando. */
  video: string;
  /** O pedido de arte dos posts de foto, para a biblioteca de design. */
  artes: string;
  /** Como as lâminas do carrossel ficam (a capa e as de dentro). */
  carrossel: string;
  /** A linguagem das cenas do vídeo por IA e do vídeo curto. */
  videoCurto: string;
  /** Uma manchete de exemplo do nicho, para a tipografia das prévias. */
  titulo: string;
  /** Os prompts das prévias, em inglês, um por peça. */
  previas: Record<PecaDaPrevia, string>;
};

/** Os tetos de cada campo (o que passa é cortado em palavra inteira). */
export const TETO_DO_ESTILO = {
  resumo: 420,
  ponto: 120,
  pontos: 6,
  evitar: 4,
  itemEvitar: 80,
  video: 1500,
  artes: 900,
  carrossel: 700,
  videoCurto: 700,
  titulo: 60,
  palavrasDoTitulo: 8,
  previa: 1400,
} as const;

/** O mínimo de cada campo para o estilo valer (abaixo disso, o texto não diz nada). */
const MINIMO = { resumo: 20, video: 60, artes: 40, carrossel: 30, videoCurto: 30, previa: 40 } as const;

function cortarEmPalavra(t: string, teto: number): string {
  if (t.length <= teto) return t;
  return t.slice(0, teto).replace(/\s+\S*$/, "").replace(/[,;:\s]+$/, "");
}

/** Texto limpo: sem travessão (regra do Bruno), sem espaço repetido, no teto. */
export function textoLimpo(v: unknown, teto: number): string {
  return cortarEmPalavra(semTravessao(String(v ?? "")).replace(/\s+/g, " ").trim(), teto);
}

function listaLimpa(v: unknown, teto: number, tetoDoItem: number): string[] {
  if (!Array.isArray(v)) return [];
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const x of v) {
    const t = textoLimpo(x, tetoDoItem).replace(/[.;]+$/, "");
    const k = t.toLowerCase();
    if (!t || vistos.has(k)) continue;
    vistos.add(k);
    saida.push(t);
    if (saida.length >= teto) break;
  }
  return saida;
}

/** A manchete de exemplo: curta, sem aspas nem ponto final, até 8 palavras. */
export function tituloLimpo(v: unknown): string {
  const t = textoLimpo(v, TETO_DO_ESTILO.titulo).replace(/^["'“”«»]+|["'“”«»]+$/g, "").replace(/[.]+$/, "").trim();
  const palavras = t.split(/\s+/).filter(Boolean);
  return palavras.slice(0, TETO_DO_ESTILO.palavrasDoTitulo).join(" ");
}

/**
 * Lê o que o Claude devolveu e confere em código: todos os campos, sem
 * travessão, nos tetos. Null quando falta o essencial (a tela não mostra
 * meio estilo). Puro.
 */
export function normalizarEstiloEscrito(cru: unknown): EstiloEscrito | null {
  if (!cru || typeof cru !== "object") return null;
  const o = cru as Record<string, unknown>;
  const p = (o.previas && typeof o.previas === "object" ? o.previas : {}) as Record<string, unknown>;
  const estilo: EstiloEscrito = {
    resumo: textoLimpo(o.resumo, TETO_DO_ESTILO.resumo),
    pontos: listaLimpa(o.pontos, TETO_DO_ESTILO.pontos, TETO_DO_ESTILO.ponto),
    evitar: listaLimpa(o.evitar, TETO_DO_ESTILO.evitar, TETO_DO_ESTILO.itemEvitar),
    video: textoLimpo(o.video, TETO_DO_ESTILO.video),
    artes: textoLimpo(o.artes, TETO_DO_ESTILO.artes),
    carrossel: textoLimpo(o.carrossel, TETO_DO_ESTILO.carrossel),
    videoCurto: textoLimpo(o.videoCurto, TETO_DO_ESTILO.videoCurto),
    titulo: tituloLimpo(o.titulo),
    previas: {
      thumb: textoLimpo(p.thumb, TETO_DO_ESTILO.previa),
      post: textoLimpo(p.post, TETO_DO_ESTILO.previa),
      vertical: textoLimpo(p.vertical, TETO_DO_ESTILO.previa),
      carrossel: textoLimpo(p.carrossel, TETO_DO_ESTILO.previa),
    },
  };
  if (estilo.resumo.length < MINIMO.resumo || estilo.video.length < MINIMO.video || estilo.artes.length < MINIMO.artes) return null;
  if (estilo.carrossel.length < MINIMO.carrossel || estilo.videoCurto.length < MINIMO.videoCurto) return null;
  if (PECAS_DA_PREVIA.some((x) => estilo.previas[x.id].length < MINIMO.previa)) return null;
  if (estilo.pontos.length < 2) return null;
  if (!estilo.titulo) estilo.titulo = "O que ninguém te conta";
  return estilo;
}

// ─────────────────────────────── a fala do cliente ───────────────────────────────

/** O tamanho mínimo da primeira fala (uma frase) e de um ajuste ("mais luz"). */
export const MINIMO_DA_FALA = 12;
export const MINIMO_DO_AJUSTE = 3;
/** Quantas falas uma rodada carrega (a primeira e os ajustes mais novos). */
export const TETO_DE_FALAS = 12;

/**
 * As falas da rodada: a primeira é o estilo, as seguintes são ajustes, e o
 * último ajuste manda. Começar de novo (sem `ajuste`) zera a conversa; o
 * histórico das rodadas fica guardado. Puro.
 */
export function falasDaRodada(anteriores: string[] | null | undefined, nova: string, ajuste: boolean): string[] {
  const limpa = String(nova ?? "").replace(/\s+/g, " ").trim();
  const base = ajuste ? (anteriores ?? []).filter(Boolean) : [];
  const todas = [...base, limpa].filter(Boolean);
  if (todas.length <= TETO_DE_FALAS) return todas;
  return [todas[0], ...todas.slice(-(TETO_DE_FALAS - 1))];
}

/** A fala serve? A primeira pede uma frase; o ajuste, poucas letras. Puro. */
export function falaServe(nova: string, ajuste: boolean): boolean {
  const t = String(nova ?? "").replace(/\s+/g, " ").trim();
  return t.length >= (ajuste ? MINIMO_DO_AJUSTE : MINIMO_DA_FALA);
}

/** O pedido inteiro, como o redator e a biblioteca leem (o último ajuste manda). */
export function pedidoDasFalas(falas: string[]): string {
  return pedidoDaConversa(falas);
}

// ─────────────────────────────── as rodadas e o histórico ───────────────────────────────

export type PreviaDaPeca = {
  peca: PecaDaPrevia;
  url: string;
  largura: number;
  altura: number;
  /** O JEV olhou a descrição e disse que segue o estilo (false: a conferência não estava ligada). */
  conferida: boolean;
  /** Foi refeita uma vez pela conferência. */
  refeita: boolean;
};

export type RodadaDoMeuEstilo = {
  n: number;
  falas: string[];
  origem: "escrito" | "voz";
  estilo: EstiloEscrito;
  escritoPor: "redator" | "reserva";
  /** O redator partiu também da leitura do perfil do cliente nas redes. */
  comPerfil: boolean;
  /** A letra dos títulos que o estilo usa (a da marca, quando aprovada). */
  fonte: FonteDoComando;
  previas: PreviaDaPeca[] | null;
  /** O que a conferência tirou (a peça não seguia o estilo nem depois de refeita). */
  previasTiradas?: PecaDaPrevia[];
  previasEm?: string | null;
  /** O custo real da rodada de prévias (só o servidor e o admin leem). */
  custoUsd?: number | null;
  /** Os créditos cobrados no fim da rodada, pela régua. */
  creditos?: number | null;
  em: string;
};

export type ConfirmadoDoMeuEstilo = {
  rodada: number;
  em: string;
  resumo: string;
  pontos: string[];
  falas: string[];
  designDeVideoId: string | null;
  designDasArtesId: string | null;
};

export type EstadoDoMeuEstilo = {
  v: 1;
  rodadas: RodadaDoMeuEstilo[];
  confirmado: ConfirmadoDoMeuEstilo | null;
};

/** Quantas rodadas o histórico guarda (as mais antigas saem; a confirmada fica). */
export const TETO_DE_RODADAS = 12;

export const ESTADO_VAZIO: EstadoDoMeuEstilo = { v: 1, rodadas: [], confirmado: null };

/** Lê o estado gravado; o que não serve vira o vazio. Puro. */
export function estadoValido(bruto: unknown): EstadoDoMeuEstilo {
  if (!bruto || typeof bruto !== "object") return { ...ESTADO_VAZIO, rodadas: [] };
  const b = bruto as Record<string, unknown>;
  const rodadas = Array.isArray(b.rodadas)
    ? (b.rodadas as unknown[]).filter((r): r is RodadaDoMeuEstilo => {
        const x = r as RodadaDoMeuEstilo;
        return Boolean(x && typeof x.n === "number" && Array.isArray(x.falas) && x.estilo && typeof x.estilo.video === "string");
      })
    : [];
  const c = b.confirmado as ConfirmadoDoMeuEstilo | null | undefined;
  return { v: 1, rodadas, confirmado: c && typeof c.rodada === "number" ? c : null };
}

/** Uma rodada nova no fim do histórico, com o teto (a confirmada nunca sai). Puro. */
export function comRodadaNova(estado: EstadoDoMeuEstilo, rodada: Omit<RodadaDoMeuEstilo, "n">): { estado: EstadoDoMeuEstilo; rodada: RodadaDoMeuEstilo } {
  const n = (estado.rodadas.reduce((m, r) => Math.max(m, r.n), 0) || 0) + 1;
  const nova: RodadaDoMeuEstilo = { ...rodada, n };
  let rodadas = [...estado.rodadas, nova];
  while (rodadas.length > TETO_DE_RODADAS) {
    const i = rodadas.findIndex((r) => r.n !== estado.confirmado?.rodada);
    if (i < 0 || i === rodadas.length - 1) break;
    rodadas = [...rodadas.slice(0, i), ...rodadas.slice(i + 1)];
  }
  return { estado: { ...estado, rodadas }, rodada: nova };
}

/** Troca uma rodada (as prévias chegaram). Puro. */
export function comRodadaTrocada(estado: EstadoDoMeuEstilo, rodada: RodadaDoMeuEstilo): EstadoDoMeuEstilo {
  return { ...estado, rodadas: estado.rodadas.map((r) => (r.n === rodada.n ? rodada : r)) };
}

/** A rodada pedida, ou a mais nova. */
export function rodadaDe(estado: EstadoDoMeuEstilo, n?: number | null): RodadaDoMeuEstilo | null {
  if (typeof n === "number") return estado.rodadas.find((r) => r.n === n) ?? null;
  return estado.rodadas[estado.rodadas.length - 1] ?? null;
}

/** O que a tela recebe de uma rodada: sem o custo em dólar (o cliente nunca lê dólar nem fornecedor). Puro. */
export function rodadaParaTela(r: RodadaDoMeuEstilo): Omit<RodadaDoMeuEstilo, "custoUsd"> {
  const { custoUsd: _custo, ...resto } = r;
  void _custo;
  return resto;
}

// ─────────────────────────────── o que vai para a esteira ───────────────────────────────

/**
 * O COMANDO DO VÍDEO que o estilo grava (projects.config.comandoDoVideo): o
 * texto do vídeo, com o que o estilo nunca usa no fim (o editor lê "nunca"
 * como proibição). No teto do comando. Puro.
 */
export function textoDoComando(e: Pick<EstiloEscrito, "video" | "evitar">): string {
  const nunca = e.evitar.length ? ` Nunca usar: ${e.evitar.join(", ")}.` : "";
  const base = e.video.replace(/[.\s]+$/, "");
  return cortarEmPalavra(`${base}.${nunca}`, TETO_DO_ESTILO.video);
}

/** O pedido do design de VÍDEO na biblioteca: a edição e as cenas geradas por IA (o vídeo curto e o vídeo por IA). Puro. */
export function pedidoDoDesignDeVideo(e: Pick<EstiloEscrito, "video" | "videoCurto" | "evitar">): string {
  const nunca = e.evitar.length ? ` Nunca: ${e.evitar.join(", ")}.` : "";
  return cortarEmPalavra(`${e.video.replace(/[.\s]+$/, "")}. Cenas geradas por IA: ${e.videoCurto.replace(/[.\s]+$/, "")}.${nunca}`, 1500);
}

/** O pedido do design das ARTES (foto e carrossel), o design mestre dos posts. Puro. */
export function pedidoDoDesignDasArtes(e: Pick<EstiloEscrito, "artes" | "carrossel" | "evitar">): string {
  const nunca = e.evitar.length ? ` Nunca: ${e.evitar.join(", ")}.` : "";
  return cortarEmPalavra(`${e.artes.replace(/[.\s]+$/, "")}. Carrossel: ${e.carrossel.replace(/[.\s]+$/, "")}.${nunca}`, 1500);
}

/**
 * A letra dos títulos do estilo: a da marca aprovada (a identidade) manda;
 * sem ela, a do comando que o projeto já tem; sem nada, a moderna. É uma
 * tradução da letra da marca para as quatro letras do editor, não uma
 * escolha nova. Puro.
 */
export function fonteDoEstilo(o: { letraDaMarca?: string | null; fonteAtual?: string | null }): FonteDoComando {
  const daMarca: Record<string, FonteDoComando> = { impacto: "archivo", moderna: "geist", classica: "playfair", amigavel: "geist" };
  if (o.letraDaMarca && daMarca[o.letraDaMarca]) return daMarca[o.letraDaMarca];
  const atual = FONTES_DO_COMANDO.find((f) => f.id === o.fonteAtual);
  return atual?.id ?? "geist";
}

// ─────────────────────────────── o custo e os créditos ───────────────────────────────

/**
 * A ESTIMATIVA DE UMA RODADA DE PRÉVIAS, em dólar (só servidor e admin):
 *   - a imagem pelo gerador de arte: US$ 0,045 medido no GPT Image 2 medium
 *     da OpenAI; a conta usa o preço do medium da Higgsfield (US$ 0,06), que
 *     é o maior da cascata da arte, para nunca subestimar;
 *   - a descrição pelo Gemini: as quatro imagens numa chamada (~US$ 0,004);
 *   - o JEV: frações de centavo.
 * Quatro peças e uma olhada: ~US$ 0,25. A conferência pode refazer cada peça
 * reprovada UMA vez, e só enquanto a rodada cabe no teto de US$ 0,40.
 */
export const DOLAR_DA_IMAGEM_DA_PREVIA = DOLAR_POR_IMAGEM["higgsfield-gpt-image-2.5-medium"];
export const DOLAR_DA_OLHADA = 0.004;
export const TETO_DA_RODADA_USD = 0.4;

export function estimativaDaRodadaUsd(pecas = PECAS_DA_PREVIA.length): number {
  return +(pecas * DOLAR_DA_IMAGEM_DA_PREVIA + DOLAR_DA_OLHADA).toFixed(4);
}

/** Dólar em créditos pela régua da casa (R$ 0,027 de IA por crédito, dólar a R$ 5,36), para cima. Puro. */
export function creditosDoCusto(usd: number): number {
  if (!(usd > 0)) return 0;
  return Math.ceil(+((usd * REAIS_POR_DOLAR) / REAIS_POR_CREDITO).toFixed(6));
}

/**
 * O QUE SE RESERVA ANTES DE GERAR: o teto da rodada em créditos (80). A
 * rodada nunca passa do teto em dólar, então a reserva cobre o pior caso, e o
 * que não foi usado volta no fim (acertoDaRodada).
 */
export const CREDITOS_RESERVADOS_DA_RODADA = creditosDoCusto(TETO_DA_RODADA_USD);

/**
 * O ACERTO DO FIM DA RODADA: cobra o custo real pela régua (nunca mais que o
 * reservado) e devolve o resto. Nada gerado: devolve tudo. Puro.
 */
export function acertoDaRodada(reservado: number, custoRealUsd: number, geradas: number): { cobrado: number; devolver: number } {
  if (geradas <= 0) return { cobrado: 0, devolver: reservado };
  const cobrado = Math.min(reservado, creditosDoCusto(custoRealUsd));
  return { cobrado, devolver: Math.max(0, reservado - cobrado) };
}

// ─────────────────────────────── os exemplos da caixa ───────────────────────────────

/** A frase de sempre da caixa, antes dos exemplos. */
export const CONVITE_DA_CAIXA = "Descreva o seu estilo do seu jeito: quem você é, o ambiente, as cores, o que não pode faltar";

const EXEMPLOS: Array<{ nicho: RegExp; texto: string }> = [
  { nicho: /farm|drogaria|medicament/i, texto: "Sou farmacêutica: quero imagens sempre num ambiente claro, com muita luz, em branco e verde" },
  { nicho: /influenc|lifestyle|luxo|carro/i, texto: "Sou influenciador: meu estilo tem carro de luxo, relógio de luxo, preto e dourado" },
  { nicho: /advoga|jur[ií]d|direito/i, texto: "Sou advogado: escritório de madeira, livros, luz quente, nada de banco de imagem" },
  { nicho: /nutri|aliment|dieta|cozinh/i, texto: "Sou nutricionista: cozinha clara, comida colorida de verdade, muita planta" },
  { nicho: /im[oó]v|corret|constru|arquitet/i, texto: "Sou corretor: imóveis com luz de fim de tarde, câmera andando, tom sofisticado" },
  { nicho: /academ|personal|fitness|treino|esporte/i, texto: "Sou personal: academia de verdade, energia alta, cores fortes, nada de estúdio" },
  { nicho: /igreja|pastor|f[ée]\b|crist|minist/i, texto: "Sou pastor: luz suave e quente, simplicidade, pessoas de verdade, nada de exagero" },
  { nicho: /dent|odonto|cl[ií]nica|sa[uú]de|m[eé]dic/i, texto: "Sou dentista: consultório branco e limpo, sorrisos naturais, azul claro" },
  { nicho: /energia|solar|e[oó]lic|el[eé]tric/i, texto: "Falo de energia: usinas de verdade, céu aberto, azul e laranja, nada de clipart" },
  { nicho: /financ|invest|cons[oó]rcio|banco|contab/i, texto: "Sou consultor financeiro: ambiente sóbrio, gráficos limpos, azul escuro e um toque de dourado" },
];

/**
 * Os exemplos curtos do placeholder rotativo: os do nicho do projeto primeiro,
 * depois os outros, cada um com "Ex.:" na frente. Puro.
 */
export function exemplosDaCaixa(nicho: string | null | undefined, quantos = 5): string[] {
  const t = String(nicho ?? "");
  const doNicho = t ? EXEMPLOS.filter((e) => e.nicho.test(t)) : [];
  const outros = EXEMPLOS.filter((e) => !doNicho.includes(e));
  return [...doNicho, ...outros].slice(0, quantos).map((e) => `Ex.: "${e.texto}"`);
}

/** As frases do placeholder, na ordem em que giram: o convite e os exemplos. Puro. */
export function frasesDaCaixa(nicho: string | null | undefined): string[] {
  return [CONVITE_DA_CAIXA, ...exemplosDaCaixa(nicho)];
}

// ─────────────────────────────── a ponte entre as telas ───────────────────────────────

/**
 * O evento que a caixa dispara quando o estilo é confirmado: o comando do
 * vídeo e o estilo dos posts que estão na mesma tela releem o que ficou
 * gravado (sem remontar: remontar o comando gravaria por cima o texto antigo
 * que estava na caixa dele).
 */
export const EVENTO_DO_ESTILO_CONFIRMADO = "demandou:estilo-confirmado";
export type DetalheDoEstiloConfirmado = { projectId: string };

/** A URL que a tela usa para uma prévia: a pública direto; a privada pelo proxy da rota. Puro. */
export function urlDaPreviaNaTela(projectId: string, url: string): string {
  if (/\.public\.blob\.vercel-storage\.com/.test(url)) return url;
  return `/api/projects/${projectId}/meu-estilo?previa=${encodeURIComponent(url)}`;
}
