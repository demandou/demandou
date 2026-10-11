import type { PecaDoLote } from "@/lib/media/editor-do-curso/arte-pelo-modelo";

/**
 * AS CAPAS PELO TEMPLATE DO MODELO DO CURSO (11/10/2026). Puro: sem banco,
 * sem rede; as decisões e as contas que o teste prova.
 *
 * A queixa do Bruno (10/10, noite): "as thumbs estão ficando horríveis,
 * pegando uma imagem distorcida da pessoa do vídeo; sempre pegar uma imagem
 * nítida ou não colocar foto, e a thumb, assim como os posts, deve seguir o
 * estilo, o design do estilo escolhido".
 *
 * Então, no projeto com modelo do curso (a mesma regra das artes, em
 * arte-pelo-modelo.ts), a capa sai pelo MESMO caminho das artes da campanha
 * (worker/src/modelo/arte-no-modelo.mjs, POST /arte-no-modelo): peças do tipo
 * "capa", o título da capa como texto, nas cores da marca, com o logo.
 *
 * - a capa do vídeo COMPLETO (YouTube) sai em 16:9: o template desenha o texto
 *   sem a pessoa e o worker recompõe deitado, com a pessoa recortada do quadro
 *   nítido ao lado (`pessoaUrl`);
 * - a capa de cada CORTE (reels) sai em 9:16: o quadro nítido entra onde o
 *   modelo põe a pessoa (`fotoUrl`), como nas artes.
 *
 * A foto é o quadro NÍTIDO da gravação (worker/src/quadro-nitido.mjs: olho
 * aberto, rosto inteiro e grande, sem borrão, sem ampliar mais de 2x); sem
 * quadro bom, a foto da pessoa da Biblioteca de materiais; sem as duas, a capa
 * sai só com a tipografia do modelo. Nunca um quadro ruim.
 *
 * NUNCA TROCAR O ESTILO SOZINHO (11/10, regra do Bruno). O caminho de hoje
 * (a composição de lib/media/capa-e-titulo.ts) vale SÓ para o projeto sem
 * estilo escolhido. Com modelo do curso, o worker que recusa, o lote que falha
 * ou não volta no prazo levam a capa à SEGUNDA tentativa no MESMO estilo (o
 * prompt de estilo do modelo pela IA de imagem, lib/media/capa-pela-ia.ts); com
 * a edição sob medida, a capa já vai pela IA no estilo da opção, com duas
 * tentativas. Falhou de novo: a capa para como falha técnica (`FalhaDaCapa`),
 * com "Tentar de novo" e sem cobrança. Nunca o modelo de reserva da edição
 * sob medida, nunca o template genérico.
 */

export const PREFIXO_DO_LOTE_DA_CAPA = "capa-";

export type AlvoDaCapa = "completo" | "cortes";

/** A chave do lote: começa com "capa-" (o callback separa das artes) e é única por pedido. */
export function chaveDoLoteDaCapa(alvo: AlvoDaCapa, videoJobId: string, agora: number = Date.now()): string {
  return `${PREFIXO_DO_LOTE_DA_CAPA}${alvo}-${videoJobId}-${agora.toString(36)}`;
}

export function loteEhDeCapa(lote: string | null | undefined): boolean {
  return typeof lote === "string" && lote.startsWith(PREFIXO_DO_LOTE_DA_CAPA);
}

/** As duas opções da capa do completo, em 16:9, na ordem das frases. Puro. */
export function pecasDaCapaDoCompleto(frases: string[]): PecaDoLote[] {
  const limpas = frases.map((f) => limparTitulo(f)).filter(Boolean);
  if (!limpas.length) throw new Error("a capa do completo não tem título");
  return limpas.slice(0, 2).map((texto) => ({ tipo: "capa", texto, formatos: ["16:9"] }));
}

/**
 * As capas dos cortes, em 9:16: uma peça por corte marcado com a frase da capa,
 * até 10 (o teto por pedido do worker). Devolve as peças e, na mesma ordem, o
 * índice do corte de cada uma. Puro.
 */
export function pecasDasCapasDosCortes(cortes: Array<{ indice: number; frase: string | null | undefined }>, maximo = 10): { pecas: PecaDoLote[]; cortes: number[] } {
  const validos = cortes.map((c) => ({ indice: c.indice, texto: limparTitulo(c.frase ?? "") })).filter((c) => c.texto).slice(0, maximo);
  return { pecas: validos.map((c) => ({ tipo: "capa", texto: c.texto, formatos: ["9:16"] })), cortes: validos.map((c) => c.indice) };
}

/** O título da capa sem travessão nem aspas, numa linha só. Puro. */
export function limparTitulo(t: string): string {
  return String(t ?? "")
    .replace(/[\u2014\u2013]/g, ",")
    .replace(/["“”]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export type RetornoDaCapa = { lote: string; projectId: string | null; videoJobId: string; alvo: AlvoDaCapa; cortes: number[] };

/** O `retorno` de um lote de capa, como o app mandou e o worker devolve. Null quando não é de capa. Puro. */
export function lerRetornoDaCapa(bruto: unknown): RetornoDaCapa | null {
  const b = (bruto && typeof bruto === "object" ? bruto : {}) as Record<string, unknown>;
  const r = (b.retorno && typeof b.retorno === "object" ? b.retorno : {}) as Record<string, unknown>;
  const lote = typeof r.lote === "string" ? r.lote : "";
  if (!loteEhDeCapa(lote)) return null;
  const alvo = r.alvo === "completo" || r.alvo === "cortes" ? r.alvo : null;
  const videoJobId = typeof r.videoJobId === "string" && r.videoJobId ? r.videoJobId : null;
  if (!alvo || !videoJobId) return null;
  const cortes = Array.isArray(r.cortes) ? r.cortes.filter((n): n is number => Number.isInteger(n) && (n as number) >= 0) : [];
  return { lote, projectId: typeof r.projectId === "string" ? r.projectId : null, videoJobId, alvo, cortes };
}

export type CapaPendente = {
  lote: string;
  pendente: boolean;
  desde: string;
  modelo: string;
  /** De onde veio a foto: o quadro nítido da gravação, a Biblioteca, ou nenhuma. */
  foto: "quadro" | "biblioteca" | "nenhuma";
  feitoEm?: string;
  /** Antigo (até 11/10): o motivo de o template não ter entregue. Hoje é `templateFalhou`. */
  reserva?: string | null;
  /** O template do worker não entregou (a segunda tentativa, no mesmo estilo, vem em seguida). */
  templateFalhou?: string | null;
  /** "ia": a capa saiu pela IA no estilo escolhido. */
  caminho?: "template" | "ia";
  tentativaAnterior?: string;
};

/** Quanto o lote da capa pode esperar antes de o vigia mandar à reserva (o mesmo prazo das artes). */
export const PRAZO_DA_CAPA_NO_MODELO_MS = 2 * 60 * 60 * 1000;

/** O pedido de capa ainda está esperando o worker, dentro do prazo? Puro. */
export function capaAindaEspera(p: Pick<CapaPendente, "pendente" | "desde"> | null | undefined, agora: number = Date.now(), prazoMs = PRAZO_DA_CAPA_NO_MODELO_MS): boolean {
  if (!p?.pendente) return false;
  const desde = Date.parse(p.desde);
  return Number.isFinite(desde) && agora - desde < prazoMs;
}

/**
 * As imagens do callback para as capas: no completo, as URLs na ordem das
 * peças (só as 16:9); nos cortes, a URL de cada corte (só as 9:16). O que
 * faltou fica de fora, e quem chama manda à reserva. Puro.
 */
export function capasDoCallback(
  pecas: Array<{ indice: number; url: string; formato: string }>,
  retorno: Pick<RetornoDaCapa, "alvo" | "cortes">,
  quantas: number
): { urls: string[]; porCorte: Map<number, string>; faltam: number[] } {
  const formato = retorno.alvo === "completo" ? "16:9" : "9:16";
  const porIndice = new Map(pecas.filter((p) => p.formato === formato).map((p) => [p.indice, p.url]));
  const urls: string[] = [];
  const porCorte = new Map<number, string>();
  const faltam: number[] = [];
  for (let i = 1; i <= quantas; i++) {
    const url = porIndice.get(i);
    if (!url) {
      faltam.push(i);
      continue;
    }
    urls.push(url);
    if (retorno.alvo === "cortes" && retorno.cortes[i - 1] !== undefined) porCorte.set(retorno.cortes[i - 1], url);
  }
  return { urls, porCorte, faltam };
}

/**
 * Os blocos que o corte do mesmo vídeo usou no modelo (o que ficou bom), em
 * texto curto para o redator das peças: "resposta (3x, ex.: ...)". Puro.
 */
export function referenciaDosCortes(cortes: Array<{ tipos?: Array<{ tipo: string; vezes: number; exemplo?: string }> | null } | null | undefined>, maximo = 12): string | null {
  const soma = new Map<string, { vezes: number; exemplo: string }>();
  for (const c of cortes) {
    for (const t of c?.tipos ?? []) {
      if (!t?.tipo) continue;
      const atual = soma.get(t.tipo) ?? { vezes: 0, exemplo: "" };
      atual.vezes += Number(t.vezes) || 1;
      if (!atual.exemplo && t.exemplo) atual.exemplo = t.exemplo;
      soma.set(t.tipo, atual);
    }
  }
  if (!soma.size) return null;
  return [...soma.entries()]
    .sort((a, b) => b[1].vezes - a[1].vezes)
    .slice(0, maximo)
    .map(([tipo, v]) => `- ${tipo} (${v.vezes}x nos cortes${v.exemplo ? `, ex.: "${limparTitulo(v.exemplo)}"` : ""})`)
    .join("\n");
}

/**
 * Uma foto por peça, sem repetir enquanto houver foto diferente (11/10: as
 * artes do Estúdio saíram com a janela da pessoa igual em todas). Puro.
 */
export function fotosPorPeca(fotos: string[], quantas: number): string[] {
  if (!fotos.length) return [];
  return Array.from({ length: quantas }, (_, i) => fotos[i % fotos.length]);
}

export type FotoDaCapa = {
  /** O quadro nítido da gravação (inteiro), ou a foto da Biblioteca. */
  url: string | null;
  /** A pessoa já recortada do quadro, quando o worker devolveu. */
  recorteUrl: string | null;
  origem: "quadro" | "biblioteca" | "nenhuma";
};

export type TrechoDaCapa = {
  publicar?: boolean;
  inicio?: number;
  fim?: number;
  titulo?: string;
  ideia?: string;
  midia?: { capa?: { url?: string } | null; recorte?: { url?: string } | null; capaArte?: { url?: string } | null; capaFalhou?: FalhaDaCapa | null } | null;
  texto?: { fraseDaCapa?: string; expressao?: string; cenario?: string; titulo?: string; descricao?: string } | null;
};

/**
 * O quadro e o recorte da capa de um corte (o caminho de hoje), pela regra do
 * quadro nítido: o quadro do PRÓPRIO corte só quando veio com o recorte (o
 * worker só recorta quadro que passou no crivo); senão a foto do vídeo (o
 * quadro nítido do vídeo inteiro, ou a da Biblioteca); senão nenhuma. Nunca o
 * quadro fixo do trecho nem o quadro-fonte antigo. Puro.
 */
export function baseDaCapaDoCorte(t: TrechoDaCapa, doVideo: FotoDaCapa | null): { quadroUrl: string | null; recorteUrl: string | null } {
  const recorte = t.midia?.recorte?.url ?? null;
  const quadro = t.midia?.capa?.url ?? null;
  if (recorte && quadro) return { quadroUrl: quadro, recorteUrl: recorte };
  if (doVideo?.url) return { quadroUrl: doVideo.url, recorteUrl: doVideo.recorteUrl };
  return { quadroUrl: null, recorteUrl: null };
}

export type CaminhoDaCapa = "modelo" | "ia" | "esperando" | "hoje";

/**
 * Por onde a capa sai: pelo caminho de hoje só quando o projeto não tem estilo
 * escolhido; pela IA no estilo (`pelaIa`: a edição sob medida, ou a segunda
 * tentativa de um modelo do curso cujo template falhou); "esperando" quando um
 * pedido ao template ainda está no prazo (pedir de novo seria pagar duas
 * vezes); senão pelo template do modelo no worker. Puro.
 */
export function caminhoDaCapa(o: { temRegra: boolean; pelaIa?: boolean; pendente?: Pick<CapaPendente, "pendente" | "desde"> | null; agora?: number }): CaminhoDaCapa {
  if (!o.temRegra) return "hoje";
  if (o.pelaIa) return "ia";
  return capaAindaEspera(o.pendente ?? null, o.agora ?? Date.now()) ? "esperando" : "modelo";
}

/** A capa no estilo escolhido que não saiu nas duas tentativas: a falha técnica que a tela mostra com "Tentar de novo". */
export type FalhaDaCapa = { motivo: string; detalhe: string; em: string; modelo: string };

/** A frase do cliente para a capa que parou (o detalhe técnico fica em `detalhe`, para a equipe). */
export const MOTIVO_DA_FALHA_DA_CAPA = "A capa no estilo que você escolheu não saiu desta vez. Toque em Tentar de novo: ela recomeça no mesmo estilo. Nada foi cobrado.";

/** Monta a falha técnica da capa. Puro. */
export function falhaDaCapa(modelo: string, erro: unknown, agora: Date = new Date()): FalhaDaCapa {
  const detalhe = (erro instanceof Error ? erro.message : String(erro ?? "sem detalhe")).replace(/[\u2014\u2013]/g, ",").slice(0, 300);
  return { motivo: MOTIVO_DA_FALHA_DA_CAPA, detalhe, em: agora.toISOString(), modelo };
}

/**
 * O trecho da fala de um corte (o assunto da capa dele): as palavras da
 * transcrição entre o início e o fim do corte, até `maximo`. Null sem palavras. Puro.
 */
export function falaDoCorte(palavras: Array<{ word: string; start: number; end: number }> | null | undefined, inicio: number | null | undefined, fim: number | null | undefined, maximo = 120): string | null {
  if (!palavras?.length || typeof inicio !== "number" || typeof fim !== "number" || fim <= inicio) return null;
  const dentro = palavras.filter((p) => p.end > inicio && p.start < fim).map((p) => p.word.trim()).filter(Boolean);
  return dentro.length ? dentro.slice(0, maximo).join(" ") : null;
}
