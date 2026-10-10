import { MARCOS_DA_MEDICAO_H, interacoes, rotuloDaFonte, temNumero, type NumerosLidos } from "@/lib/analytics/fontes-da-leitura";
import { chaveDoImpulso } from "@/lib/avisos/chaves";
import type { PerguntaDoJev, RespostaDoJev } from "@/lib/jev/cliente";

/**
 * O AGENTE DE TRÁFEGO, FASE 1 (09/10/2026): quais posts do cliente valem ser
 * impulsionados ("Turbinar") e por quê. Aprovado pelo Bruno em 09/10. Só
 * SUGESTÃO: nada é impulsionado por API (a Marketing API fica para depois).
 *
 * Módulo PURO, sem banco nem rede: o servidor (lib/analytics/impulso.ts), a
 * tela (components/analytics/impulso.tsx), a prova só de leitura e os testes
 * importam daqui. Quem faz o quê:
 *
 *   1. O CÓDIGO MEDE. Para cada post com leitura de 24 h ou mais e idade entre
 *      24 h e 7 dias, os sinais contra a MEDIANA da própria conta (mesma rede e
 *      conta, mesmo formato quando há 5 posts, senão a conta inteira), no mesmo
 *      marco de tempo depois da publicação, nas leituras "ok" dos últimos 90
 *      dias: interações, comentários, visualizações, salvamentos e
 *      compartilhamentos, a velocidade do primeiro dia e a subida entre 24 h e
 *      72 h. Mediana, não média: um post que viraliza distorce a média.
 *   2. O JEV DECIDE (regra do Bruno: "Claude só escreve, JEV decide"). Um
 *      pedido por projeto por passada: `impulsionar_<post>` (sim ou não),
 *      `motivo_<post>` (conversa, alcance, salvamento, velocidade,
 *      fora_da_curva) e `prioridade` (qual primeiro). Sim só com folga
 *      (probabilidade de 0,65 para cima, a margem de "não sei" da casa) e
 *      motivo só com confiança de 0,5 para cima; abaixo disso, nenhuma
 *      sugestão.
 *   3. O HAIKU SÓ ESCREVE uma frase curta com os números que o código passou e
 *      o motivo que o JEV escolheu. Todo número da frase é conferido contra os
 *      números passados; sobrou um que não está lá, a frase é descartada e
 *      vale a frase montada aqui, em código.
 *
 * "Se não sabe, não fala": sem leitura no marco, sem linha de base (menos de
 * 5 posts medidos na conta), sem link do post ou sem número, não há sugestão.
 * Pendente nunca vira zero.
 */

export const TIPO_DA_BASE = "linha_de_base_do_impulso";
export const TIPO_DAS_SUGESTOES = "sugestoes_de_impulso";
export const CHAVE_DAS_SUGESTOES = "projeto";

/** Os marcos que contam para impulsionar (24 h, 3 dias e 7 dias), dentro de MARCOS_DA_MEDICAO_H. */
export const MARCOS_DO_IMPULSO = [24, 72, 168] as const;
export const JANELA_DA_BASE_DIAS = 90;
/** Posts medidos no marco para existir linha de base (no formato, senão na conta). */
export const MINIMO_DE_POSTS = 5;
export const IDADE_MINIMA_H = 24;
export const IDADE_MAXIMA_H = 168;
/** Razão contra a mediana a partir da qual um sinal é destaque. */
export const LIMIAR_DE_DESTAQUE = 1.5;
/** Quando a mediana da conta é zero, o número absoluto que já é destaque. */
export const MINIMO_SEM_MEDIANA = 3;
/** Interações mínimas no marco: abaixo disto a razão é acaso de número pequeno. */
export const MINIMO_DE_INTERACOES = 3;
export const MAXIMO_DE_CANDIDATOS = 10;
export const MAXIMO_NA_PRIMEIRA_TELA = 3;
/** O sim do JEV com folga (a margem de decidirNoul em lib/jev/cliente.ts). */
export const SIM_DO_JEV = 0.65;
/** A confiança mínima da escolha (a régua de 03/10 e 08/10). */
export const CONFIANCA_MINIMA = 0.5;
export const ETAPA_DO_JEV = "impulso";

/** Redes em que o próprio app impulsiona o post. LinkedIn só página (perfil pessoal fica de fora). */
export const REDES_COM_IMPULSO = ["instagram", "facebook", "linkedin", "tiktok", "twitter", "youtube"] as const;

export const NOME_DA_REDE_NO_IMPULSO: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  twitter: "X",
  youtube: "YouTube",
};
const nomeDaRede = (r: string) => NOME_DA_REDE_NO_IMPULSO[r] ?? r;

const HORA = 3600_000;
const DIA = 24 * HORA;

/* ── Formato ──────────────────────────────────────────────────────────── */

export type FormatoDoImpulso = "reel" | "video" | "carrossel" | "imagem" | "texto" | "story" | "outro";

export const ROTULO_DO_FORMATO: Record<FormatoDoImpulso, string> = {
  reel: "reel",
  video: "vídeo",
  carrossel: "carrossel",
  imagem: "imagem",
  texto: "texto",
  story: "story",
  outro: "outro formato",
};

/** O formato do post para a linha de base, pelo mediaType e pelo metadata.formato. */
export function formatoDoPost(mediaType: string | null | undefined, metadata: unknown): FormatoDoImpulso {
  const bruto = metadata && typeof metadata === "object" ? (metadata as { formato?: unknown }).formato : null;
  const f = typeof bruto === "string" ? bruto.toLowerCase() : "";
  const m = (mediaType ?? "").toLowerCase();
  if (f === "story") return "story";
  if (f === "reel" || m === "reel") return "reel";
  if (m === "video" || m === "short") return "video";
  if (m === "carousel" || f === "carousel") return "carrossel";
  if (m === "image" || m === "infographic") return "imagem";
  if (["text", "thread", "poll", "article"].includes(m)) return "texto";
  return "outro";
}

/* ── A leitura em cada marco ──────────────────────────────────────────── */

export type LeituraParaImpulso = NumerosLidos & {
  postId: string;
  fonte: string;
  status: string;
  lidoEm: string | Date;
};

/** A leitura que vale para um marco: a primeira "ok" com número dentro da janela do marco. */
export type FotoDoMarco = { marco: number; idadeH: number; fonte: string; lidoEm: string; numeros: NumerosLidos };

const iso = (d: string | Date) => (typeof d === "string" ? new Date(d).toISOString() : d.toISOString());
const arred = (x: number, casas = 2) => Math.round(x * 10 ** casas) / 10 ** casas;

/**
 * A janela de um marco: de 90% do marco até 1,5 vez o marco, sem passar do
 * marco seguinte. O cron lê logo depois do marco; a sincronização manual fora
 * disso não entra (um post lido com 50 h não vale como "24 h").
 */
export function janelaDoMarco(marco: number): [number, number] {
  const i = MARCOS_DA_MEDICAO_H.indexOf(marco);
  const proximo = i >= 0 && i < MARCOS_DA_MEDICAO_H.length - 1 ? MARCOS_DA_MEDICAO_H[i + 1] : Infinity;
  return [marco * 0.9, Math.min(marco * 1.5, proximo)];
}

const CAMPOS: Array<keyof NumerosLidos> = ["impressoes", "alcance", "visualizacoes", "curtidas", "comentarios", "compartilhamentos", "salvamentos", "cliques"];

export function fotoNoMarco(publicadoEm: string | Date, leituras: LeituraParaImpulso[], marco: number): FotoDoMarco | null {
  const t0 = new Date(publicadoEm).getTime();
  const [ini, fim] = janelaDoMarco(marco);
  const daJanela = leituras
    .filter((l) => l.status === "ok" && temNumero(l))
    .map((l) => ({ l, idadeH: (new Date(l.lidoEm).getTime() - t0) / HORA }))
    .filter((x) => x.idadeH >= ini && x.idadeH < fim)
    .sort((a, b) => a.idadeH - b.idadeH);
  const x = daJanela[0];
  if (!x) return null;
  const numeros: NumerosLidos = {};
  for (const c of CAMPOS) numeros[c] = typeof x.l[c] === "number" ? (x.l[c] as number) : null;
  return { marco, idadeH: arred(x.idadeH, 1), fonte: x.l.fonte, lidoEm: iso(x.l.lidoEm), numeros };
}

/**
 * O número gravado antes do histórico (post_metrics), como uma leitura de
 * fonte "anterior" na hora do `syncedAt`. Só para post SEM nenhuma linha em
 * leituras_de_metrica (o mesmo critério da aba Resultados); entra na base só
 * se o `syncedAt` cair na janela de um marco. Impressão e visualização zero
 * ali são "não veio" (a coluna nasce com zero), como em resultados.ts.
 */
export function leituraDoPostMetric(
  postId: string,
  m: { likes: number; comments: number; shares: number; impressions: number; videoViews: number; clicks: number; syncedAt: Date | string }
): LeituraParaImpulso {
  return {
    postId,
    fonte: "anterior",
    status: "ok",
    lidoEm: m.syncedAt,
    curtidas: m.likes,
    comentarios: m.comments,
    compartilhamentos: m.shares,
    impressoes: m.impressions || null,
    visualizacoes: m.videoViews || null,
    cliques: m.clicks || null,
  };
}

/** Os números que os sinais usam. Nulo é "a fonte não mede", nunca zero. */
export type NumerosDoMarco = { interacoes: number | null; comentarios: number | null; visualizacoes: number | null; salvComp: number | null };

export function numerosDoMarco(n: NumerosLidos): NumerosDoMarco {
  const s = typeof n.salvamentos === "number" ? n.salvamentos : null;
  const c = typeof n.compartilhamentos === "number" ? n.compartilhamentos : null;
  return {
    interacoes: interacoes(n),
    comentarios: typeof n.comentarios === "number" ? n.comentarios : null,
    visualizacoes: typeof n.visualizacoes === "number" ? n.visualizacoes : null,
    salvComp: s === null && c === null ? null : (s ?? 0) + (c ?? 0),
  };
}

/* ── Linha de base ────────────────────────────────────────────────────── */

export function mediana(xs: number[]): number | null {
  if (!xs.length) return null;
  const v = [...xs].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

export type Med = { mediana: number; posts: number };

/** As medianas de um marco. Campo com menos de MINIMO_DE_POSTS posts medidos fica nulo (sem base para ele). */
export type MedianaDoMarco = {
  posts: number;
  interacoes: Med | null;
  comentarios: Med | null;
  visualizacoes: Med | null;
  salvComp: Med | null;
  /** Só no marco de 72 h: a subida relativa entre 24 h e 72 h. */
  crescimento: Med | null;
};

export type Seguidores = { valor: number; fonte: string; lidoEm: string };

export type PostParaImpulso = {
  id: string;
  rede: string;
  /** "<rede>:<socialAccountId>": a linha de base é por conta. */
  conta: string;
  contaRotulo: string | null;
  accountType: string | null;
  formato: FormatoDoImpulso;
  publicadoEm: string;
  link: string | null;
  titulo: string;
  /** A etapa do funil da campanha (tofu, mofu, bofu), quando a campanha gravou. */
  funil: string | null;
  /** O primeiro comentário da própria conta saiu da contagem de comentários. */
  semPrimeiroComentario: boolean;
  leituras: LeituraParaImpulso[];
};

/** O post como o banco devolve (Prisma no servidor, SQL na prova só de leitura). */
export type LinhaDoPost = {
  id: string;
  platform: string;
  mediaType: string | null;
  metadata: unknown;
  publishedAt: Date | string;
  externalUrl: string | null;
  content: string;
  socialAccountId: string | null;
  accountType: string | null;
  username: string | null;
  displayName: string | null;
  /** run.config.funnelStage, quando houver. */
  funil: string | null;
};

/** O nome da conta como a aba Resultados mostra (lib/analytics/resultados.ts). */
export function rotuloDaConta(l: Pick<LinhaDoPost, "accountType" | "username" | "displayName" | "socialAccountId">): string | null {
  if (!l.socialAccountId) return null;
  if (l.accountType === "organization") return `Página ${l.displayName ?? l.username ?? ""}`.trim();
  if (l.username && !l.username.includes("@")) return `@${l.username.replace(/^@/, "")}`;
  return l.displayName ?? "perfil pessoal";
}

export function chaveDaConta(platform: string, socialAccountId: string | null): string {
  return `${platform}:${socialAccountId ?? "sem-conta"}`;
}

/** Quando a Demandou publicou o primeiro comentário (os links) no próprio post, ou null. */
export function primeiroComentarioEm(metadata: unknown): string | null {
  const v = metadata && typeof metadata === "object" ? (metadata as { firstCommentPublishedAt?: unknown }).firstCommentPublishedAt : null;
  if (typeof v !== "string" || Number.isNaN(new Date(v).getTime())) return null;
  return new Date(v).toISOString();
}

/**
 * O PRIMEIRO COMENTÁRIO DA PRÓPRIA CONTA NÃO É CONVERSA. Medido em 09/10: no
 * LinkedIn, os 30 posts com o primeiro comentário da Demandou têm 1 comentário
 * ou mais na última leitura (média 1,03), e os 5 sem ele têm zero. A rede
 * conta o comentário do dono; aqui ele sai da conta, nas leituras feitas
 * depois dele, para "comentários" querer dizer comentário de outra pessoa.
 */
export function semComentarioProprio(leituras: LeituraParaImpulso[], comentarioEm: string | null): LeituraParaImpulso[] {
  if (!comentarioEm) return leituras;
  const t = new Date(comentarioEm).getTime();
  return leituras.map((l) =>
    typeof l.comentarios === "number" && l.comentarios >= 1 && new Date(l.lidoEm).getTime() >= t ? { ...l, comentarios: l.comentarios - 1 } : l
  );
}

export function postParaImpulso(l: LinhaDoPost, leituras: LeituraParaImpulso[]): PostParaImpulso {
  const comentarioEm = primeiroComentarioEm(l.metadata);
  return {
    id: l.id,
    rede: l.platform,
    conta: chaveDaConta(l.platform, l.socialAccountId),
    contaRotulo: rotuloDaConta(l),
    accountType: l.accountType,
    formato: formatoDoPost(l.mediaType, l.metadata),
    publicadoEm: iso(l.publishedAt),
    link: l.externalUrl,
    titulo: (l.content.split("\n").find((x) => x.trim()) ?? "").trim().slice(0, 200),
    funil: l.funil,
    semPrimeiroComentario: Boolean(comentarioEm),
    leituras: semComentarioProprio(
      leituras.filter((x) => x.postId === l.id),
      comentarioEm
    ),
  };
}

/** Um perfil próprio estudado (referencias_perfis, status "proprio"), com a contagem de seguidores do perfil público. */
export type PerfilProprio = { rede: string; perfil: string; seguidores: number | null; em: Date | string };
/** A última leitura de seguidores pela API da Meta (estatisticas_da_conta), por "<rede>:<platformUserId>". */
export type SeguidoresDaMeta = { chave: string; valor: number; lidoEm: string; rede: string };

/** O nome comparável de um perfil: sem @, sem o link (fica o último pedaço), só letras e números. */
export function nomeComparavel(s: string | null | undefined): string {
  const t = (s ?? "").trim().replace(/\/+$/, "");
  const ultimo = t.includes("/") ? t.slice(t.lastIndexOf("/") + 1) : t;
  return ultimo.replace(/^@/, "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]/g, "");
}

/**
 * Os seguidores de uma conta: a API da Meta primeiro (quando a permissão de
 * estatísticas veio), senão o perfil público estudado COM O MESMO NOME (o @
 * ou o fim do link da página). Nome diferente não vale: no projeto Demandou o
 * perfil estudado é @demandou_ e a conta conectada é @demandoupostou. Sem
 * nenhum dos dois, null: a taxa por seguidor não aparece, e a razão contra a
 * mediana continua valendo.
 */
export function seguidoresDaConta(
  conta: { platform: string; platformUserId: string | null; username: string | null; displayName?: string | null },
  meta: SeguidoresDaMeta[],
  proprios: PerfilProprio[]
): Seguidores | null {
  const m = meta.find((x) => x.chave === `${conta.platform}:${conta.platformUserId ?? "sem-id"}`);
  if (m && m.valor > 0) return { valor: m.valor, fonte: `api:${m.rede}`, lidoEm: m.lidoEm };
  const nomes = [nomeComparavel(conta.username), nomeComparavel(conta.displayName)].filter(Boolean);
  const p = proprios.find((x) => x.rede === conta.platform && typeof x.seguidores === "number" && x.seguidores > 0 && nomes.includes(nomeComparavel(x.perfil)));
  if (!p) return null;
  return { valor: p.seguidores!, fonte: `apify:${conta.platform}`, lidoEm: iso(p.em) };
}

export type BaseDaConta = {
  versao: 1;
  conta: string;
  rede: string;
  rotulo: string | null;
  calculadaEm: string;
  desde: string;
  /** Posts com a leitura de 24 h nos últimos 90 dias (stories fora). */
  postsMedidos: number;
  geral: Record<string, MedianaDoMarco>;
  porFormato: Partial<Record<FormatoDoImpulso, Record<string, MedianaDoMarco>>>;
  seguidores: Seguidores | null;
};

function medDe(xs: Array<number | null>): Med | null {
  const v = xs.filter((x): x is number => typeof x === "number");
  if (v.length < MINIMO_DE_POSTS) return null;
  return { mediana: arred(mediana(v)!, 4), posts: v.length };
}

/** A subida relativa entre 24 h e 72 h, ou null sem as duas leituras (ou com zero em 24 h). */
export function crescimentoDoPost(i24: number | null | undefined, i72: number | null | undefined): number | null {
  if (typeof i24 !== "number" || typeof i72 !== "number" || i24 <= 0) return null;
  return arred((i72 - i24) / i24, 4);
}

function medianasDoMarco(posts: PostParaImpulso[], marco: number): MedianaDoMarco {
  const fotos = posts.map((p) => ({ p, f: fotoNoMarco(p.publicadoEm, p.leituras, marco) })).filter((x) => x.f);
  const ns = fotos.map((x) => numerosDoMarco(x.f!.numeros));
  let crescimento: Med | null = null;
  if (marco === 72) {
    crescimento = medDe(
      fotos.map((x) => {
        const f24 = fotoNoMarco(x.p.publicadoEm, x.p.leituras, 24);
        return crescimentoDoPost(f24 ? numerosDoMarco(f24.numeros).interacoes : null, numerosDoMarco(x.f!.numeros).interacoes);
      })
    );
  }
  return {
    posts: fotos.length,
    interacoes: medDe(ns.map((n) => n.interacoes)),
    comentarios: medDe(ns.map((n) => n.comentarios)),
    visualizacoes: medDe(ns.map((n) => n.visualizacoes)),
    salvComp: medDe(ns.map((n) => n.salvComp)),
    crescimento,
  };
}

/** Entra na linha de base: publicado nos últimos 90 dias, não é story. */
function entraNaBase(p: PostParaImpulso, agora: Date): boolean {
  if (p.formato === "story") return false;
  const t = new Date(p.publicadoEm).getTime();
  return t >= agora.getTime() - JANELA_DA_BASE_DIAS * DIA && t <= agora.getTime();
}

/** A linha de base de UMA conta (os posts devem ser todos dela). */
export function calcularBase(posts: PostParaImpulso[], agora: Date, seguidores: Seguidores | null): BaseDaConta {
  const daBase = posts.filter((p) => entraNaBase(p, agora));
  const geral: Record<string, MedianaDoMarco> = {};
  const porFormato: BaseDaConta["porFormato"] = {};
  for (const marco of MARCOS_DO_IMPULSO) geral[String(marco)] = medianasDoMarco(daBase, marco);
  const formatos = [...new Set(daBase.map((p) => p.formato))];
  for (const f of formatos) {
    const doFormato = daBase.filter((p) => p.formato === f);
    porFormato[f] = Object.fromEntries(MARCOS_DO_IMPULSO.map((m) => [String(m), medianasDoMarco(doFormato, m)]));
  }
  const primeiro = posts[0];
  return {
    versao: 1,
    conta: primeiro?.conta ?? "",
    rede: primeiro?.rede ?? "",
    rotulo: primeiro?.contaRotulo ?? null,
    calculadaEm: agora.toISOString(),
    desde: new Date(agora.getTime() - JANELA_DA_BASE_DIAS * DIA).toISOString(),
    postsMedidos: geral["24"].posts,
    geral,
    porFormato,
    seguidores,
  };
}

/** A base que vale para um post: a do formato com 5 posts no marco, senão a da conta inteira. */
export function baseDoPost(base: BaseDaConta, formato: FormatoDoImpulso, marco: number): { m: MedianaDoMarco; escopo: "formato" | "conta" } | null {
  const f = base.porFormato[formato]?.[String(marco)];
  if (f && f.posts >= MINIMO_DE_POSTS) return { m: f, escopo: "formato" };
  const g = base.geral[String(marco)];
  if (g && g.posts >= MINIMO_DE_POSTS) return { m: g, escopo: "conta" };
  return null;
}

/* ── Os sinais de um post ─────────────────────────────────────────────── */

export type NomeDoSinal = "engajamento" | "comentarios" | "visualizacoes" | "salvComp" | "velocidade" | "crescimento";

/**
 * Um sinal contra a mediana. `razao` nula quando a mediana é zero (não existe
 * "x vezes zero"); aí vale o número absoluto.
 */
export type Razao = { valor: number; mediana: number; razao: number | null; posts: number; escopo: "formato" | "conta"; marco: number };

function razaoDe(valor: number | null, med: Med | null, escopo: "formato" | "conta", marco: number): Razao | null {
  if (valor === null || !med) return null;
  return { valor, mediana: med.mediana, razao: med.mediana > 0 ? arred(valor / med.mediana, 2) : null, posts: med.posts, escopo, marco };
}

/** O sinal passou da conta? Razão de 1,5 para cima, ou, com mediana zero, o mínimo absoluto. */
export function acima(r: Razao | null | undefined): boolean {
  if (!r) return false;
  return r.razao !== null ? r.razao >= LIMIAR_DE_DESTAQUE : r.valor >= MINIMO_SEM_MEDIANA;
}

/** A subida entre 24 h e 72 h: valores em fração (0,4 = 40%). */
export type Crescimento = { valor: number; mediana: number | null; razao: number | null; novas: number; posts: number; escopo: "formato" | "conta" };

export function crescimentoAcima(c: Crescimento | null | undefined): boolean {
  if (!c || c.mediana === null) return false;
  if (c.mediana > 0) return c.razao !== null && c.razao >= LIMIAR_DE_DESTAQUE;
  // O normal da conta é parar depois do primeiro dia: subir 20% e ganhar 3 interações já é raro.
  return c.valor >= 0.2 && c.novas >= MINIMO_SEM_MEDIANA;
}

export const MOTIVOS = ["conversa", "alcance", "salvamento", "velocidade", "fora_da_curva"] as const;
export type Motivo = (typeof MOTIVOS)[number];

export const ROTULO_DO_MOTIVO: Record<Motivo, string> = {
  conversa: "puxou conversa",
  alcance: "está sendo visto além do normal",
  salvamento: "está sendo salvo e compartilhado",
  velocidade: "ganhou força rápido",
  fora_da_curva: "está fora da curva",
};

export const CRITERIO_DO_MOTIVO: Record<Motivo, string> = {
  conversa: "conversa: os comentários estão acima da mediana da conta; o post puxou conversa",
  alcance: "alcance: as visualizações estão acima da mediana da conta; o post está sendo visto além do normal",
  salvamento: "salvamento: salvamentos e compartilhamentos acima da mediana; o público guarda o post e manda para outras pessoas",
  velocidade: "velocidade: ganhou interação mais rápido que o normal no primeiro dia, ou continua subindo entre 24 h e 72 h",
  fora_da_curva: "fora da curva: as interações somadas, ou vários sinais ao mesmo tempo, acima da mediana da conta, sem um sinal único que explique",
};

export type SinaisDoPost = {
  postId: string;
  rede: string;
  conta: string;
  contaRotulo: string | null;
  formato: FormatoDoImpulso;
  publicadoEm: string;
  idadeH: number;
  link: string;
  titulo: string;
  funil: string | null;
  /** A leitura do marco mais recente (de onde saem os números, com fonte e data). */
  foto: FotoDoMarco;
  numeros: NumerosDoMarco;
  escopo: "formato" | "conta";
  engajamento: Razao | null;
  comentarios: Razao | null;
  visualizacoes: Razao | null;
  salvComp: Razao | null;
  /** As interações na leitura de 24 h contra a mediana de 24 h. */
  velocidade: Razao | null;
  crescimento: Crescimento | null;
  /** Interações por seguidor (fração), com a contagem de seguidores e a fonte dela. */
  taxa: { valor: number; seguidores: Seguidores } | null;
  semPrimeiroComentario: boolean;
  destaques: NomeDoSinal[];
  pontuacao: number;
  /** Os motivos que os números permitem (o JEV escolhe só entre estes). */
  motivos: Motivo[];
};

/** O peso de cada sinal na ORDEM dos candidatos (a decisão é do JEV). Comentário pesa mais que curtida; salvamento e compartilhamento, mais ainda. */
export const PESO_DO_SINAL: Record<NomeDoSinal, number> = { engajamento: 1, velocidade: 1, visualizacoes: 1, crescimento: 1, comentarios: 2, salvComp: 3 };

function pontuar(s: Pick<SinaisDoPost, NomeDoSinal>): number {
  let soma = 0;
  let pesos = 0;
  for (const nome of Object.keys(PESO_DO_SINAL) as NomeDoSinal[]) {
    const r = s[nome];
    if (!r) continue;
    const ehAcima = nome === "crescimento" ? crescimentoAcima(r as Crescimento) : acima(r as Razao);
    const termo = Math.min(5, r.razao ?? (ehAcima ? LIMIAR_DE_DESTAQUE : 0));
    soma += PESO_DO_SINAL[nome] * termo;
    pesos += PESO_DO_SINAL[nome];
  }
  return pesos ? arred(soma / pesos, 3) : 0;
}

/** Pode ser impulsionado no app da rede? */
export function redeImpulsiona(rede: string, accountType: string | null | undefined): boolean {
  if (!(REDES_COM_IMPULSO as readonly string[]).includes(rede)) return false;
  // No LinkedIn, o "Impulsionar" do próprio post é da página; perfil pessoal fica de fora nesta fase.
  if (rede === "linkedin" && accountType !== "organization") return false;
  return true;
}

/**
 * Os sinais de um post, ou null quando ele não pode ser candidato: rede sem
 * impulso, story, sem link, fora da idade (24 h a 7 dias), sem leitura no
 * marco ou sem linha de base.
 */
export function sinaisDoPost(p: PostParaImpulso, base: BaseDaConta, agora: Date): SinaisDoPost | null {
  if (!redeImpulsiona(p.rede, p.accountType) || p.formato === "story" || !p.link) return null;
  const idadeH = (agora.getTime() - new Date(p.publicadoEm).getTime()) / HORA;
  if (idadeH < IDADE_MINIMA_H || idadeH > IDADE_MAXIMA_H) return null;
  let foto: FotoDoMarco | null = null;
  for (const m of [...MARCOS_DO_IMPULSO].reverse()) {
    if (m > idadeH) continue;
    foto = fotoNoMarco(p.publicadoEm, p.leituras, m);
    if (foto) break;
  }
  if (!foto) return null;
  const b = baseDoPost(base, p.formato, foto.marco);
  if (!b) return null;
  const n = numerosDoMarco(foto.numeros);

  const f24 = fotoNoMarco(p.publicadoEm, p.leituras, 24);
  const b24 = baseDoPost(base, p.formato, 24);
  const n24 = f24 ? numerosDoMarco(f24.numeros) : null;
  const velocidade = n24 && b24 ? razaoDe(n24.interacoes, b24.m.interacoes, b24.escopo, 24) : null;

  let crescimento: Crescimento | null = null;
  const f72 = foto.marco >= 72 ? fotoNoMarco(p.publicadoEm, p.leituras, 72) : null;
  const b72 = baseDoPost(base, p.formato, 72);
  if (f72 && n24 && b72) {
    const i72 = numerosDoMarco(f72.numeros).interacoes;
    const c = crescimentoDoPost(n24.interacoes, i72);
    if (c !== null) {
      const med = b72.m.crescimento;
      crescimento = {
        valor: c,
        mediana: med?.mediana ?? null,
        razao: med && med.mediana > 0 ? arred(c / med.mediana, 2) : null,
        novas: (i72 ?? 0) - (n24.interacoes ?? 0),
        posts: med?.posts ?? 0,
        escopo: b72.escopo,
      };
    }
  }

  const sinais = {
    engajamento: razaoDe(n.interacoes, b.m.interacoes, b.escopo, foto.marco),
    comentarios: razaoDe(n.comentarios, b.m.comentarios, b.escopo, foto.marco),
    visualizacoes: razaoDe(n.visualizacoes, b.m.visualizacoes, b.escopo, foto.marco),
    salvComp: razaoDe(n.salvComp, b.m.salvComp, b.escopo, foto.marco),
    velocidade,
    crescimento,
  };
  const destaques = (Object.keys(sinais) as NomeDoSinal[]).filter((k) => (k === "crescimento" ? crescimentoAcima(sinais.crescimento) : acima(sinais[k] as Razao | null)));
  // O JEV escolhe só entre os motivos que um número acima da conta sustenta.
  const motivos: Motivo[] = [];
  if (destaques.includes("comentarios")) motivos.push("conversa");
  if (destaques.includes("visualizacoes")) motivos.push("alcance");
  if (destaques.includes("salvComp")) motivos.push("salvamento");
  if (destaques.includes("velocidade") || destaques.includes("crescimento")) motivos.push("velocidade");
  if (destaques.includes("engajamento") || destaques.length >= 2) motivos.push("fora_da_curva");
  const seg = base.seguidores;
  return {
    postId: p.id,
    rede: p.rede,
    conta: p.conta,
    contaRotulo: p.contaRotulo,
    formato: p.formato,
    publicadoEm: p.publicadoEm,
    idadeH: arred(idadeH, 1),
    link: p.link,
    titulo: p.titulo,
    funil: p.funil,
    foto,
    numeros: n,
    escopo: b.escopo,
    ...sinais,
    taxa: seg && seg.valor > 0 && typeof n.interacoes === "number" ? { valor: arred(n.interacoes / seg.valor, 4), seguidores: seg } : null,
    semPrimeiroComentario: p.semPrimeiroComentario,
    destaques,
    pontuacao: pontuar(sinais),
    motivos,
  };
}

/** É candidato a ir ao JEV: algum sinal acima da conta e interações que não são acaso. */
export function ehCandidato(s: SinaisDoPost): boolean {
  return s.destaques.length > 0 && s.motivos.length > 0 && (s.numeros.interacoes ?? 0) >= MINIMO_DE_INTERACOES;
}

export type AnaliseDoProjeto = {
  bases: BaseDaConta[];
  /** Todos os posts na idade de impulsionar com sinais medidos (candidatos ou não). */
  medidos: SinaisDoPost[];
  /** Os que vão ao JEV, no máximo MAXIMO_DE_CANDIDATOS, pela pontuação. */
  candidatos: SinaisDoPost[];
  /** As contas com post recente que ainda não têm 5 posts medidos. */
  aprendendo: Array<{ conta: string; rede: string; rotulo: string | null; medidos: number }>;
};

/**
 * A ANÁLISE INTEIRA de um projeto, em código: a base de cada conta e os
 * sinais de cada post na idade de impulsionar. `seguidores` é por conta.
 */
export function analisarPosts(posts: PostParaImpulso[], seguidores: Record<string, Seguidores | null>, agora: Date): AnaliseDoProjeto {
  const porConta = new Map<string, PostParaImpulso[]>();
  // Post de conta desconectada fica de fora: misturaria contas na mesma base,
  // e ninguém sabe onde impulsioná-lo.
  for (const p of posts) if (!p.conta.endsWith(":sem-conta")) porConta.set(p.conta, [...(porConta.get(p.conta) ?? []), p]);
  const bases: BaseDaConta[] = [];
  const medidos: SinaisDoPost[] = [];
  const aprendendo: AnaliseDoProjeto["aprendendo"] = [];
  for (const [conta, lista] of porConta) {
    const base = calcularBase(lista, agora, seguidores[conta] ?? null);
    bases.push(base);
    const recentes = lista.filter((p) => {
      const idade = (agora.getTime() - new Date(p.publicadoEm).getTime()) / HORA;
      return idade >= IDADE_MINIMA_H && idade <= IDADE_MAXIMA_H && p.formato !== "story" && redeImpulsiona(p.rede, p.accountType);
    });
    if (recentes.length && base.postsMedidos < MINIMO_DE_POSTS) aprendendo.push({ conta, rede: base.rede, rotulo: base.rotulo, medidos: base.postsMedidos });
    for (const p of recentes) {
      const s = sinaisDoPost(p, base, agora);
      if (s) medidos.push(s);
    }
  }
  const candidatos = medidos.filter(ehCandidato).sort((a, b) => b.pontuacao - a.pontuacao).slice(0, MAXIMO_DE_CANDIDATOS);
  return { bases, medidos, candidatos, aprendendo };
}

/* ── Os números que sustentam a sugestão ──────────────────────────────── */

export const ROTULO_DO_SINAL: Record<NomeDoSinal, string> = {
  engajamento: "as interações",
  comentarios: "os comentários",
  visualizacoes: "as visualizações",
  salvComp: "os salvamentos e compartilhamentos",
  velocidade: "as interações do primeiro dia",
  crescimento: "a subida depois do primeiro dia",
};

const NOME_CURTO: Record<NomeDoSinal, string> = {
  engajamento: "interações",
  comentarios: "comentários",
  visualizacoes: "visualizações",
  salvComp: "salvamentos e compartilhamentos",
  velocidade: "interações no primeiro dia",
  crescimento: "de subida",
};

export type NumeroQueSustenta = {
  sinal: NomeDoSinal;
  /** "2,3x os comentários da sua média" (o que vai no selo). */
  curto: string;
  /** Com o número cru e a mediana: "7 comentários contra 3 da mediana de 6 posts". */
  detalhe: string;
};

/** Número no jeito brasileiro. */
export function fmt(n: number, casas = 0): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}
const fmtMed = (n: number) => (Number.isInteger(n) ? fmt(n) : fmt(n, 1));
/** A razão com uma casa ("2,3x"), sem a casa quando ela é zero ("6x"). */
const fmtRazao = (r: number) => (Number.isInteger(Math.round(r * 10) / 10) ? fmt(Math.round(r)) : fmt(r, 1));
const pct = (fracao: number) => `${fmt(Math.round(fracao * 100))}%`;

function textoDoSinal(nome: NomeDoSinal, s: SinaisDoPost): NumeroQueSustenta | null {
  if (nome === "crescimento") {
    const c = s.crescimento;
    if (!c) return null;
    const curto = c.razao !== null ? `${fmtRazao(c.razao)}x a subida normal depois do primeiro dia` : `subiu ${pct(c.valor)} entre 24 h e 72 h`;
    const detalhe = `subiu ${pct(c.valor)} entre 24 h e 72 h${c.mediana !== null ? `; o normal da conta é ${pct(c.mediana)} (mediana de ${c.posts} posts)` : ""}`;
    return { sinal: nome, curto, detalhe };
  }
  const r = s[nome] as Razao | null;
  if (!r) return null;
  const quando = r.marco === 24 ? "em 24 h" : r.marco === 72 ? "em 3 dias" : "em 7 dias";
  const deQuem = r.escopo === "formato" ? `de ${ROTULO_DO_FORMATO[s.formato]} da conta` : "da conta";
  const curto = r.razao !== null ? `${fmtRazao(r.razao)}x ${ROTULO_DO_SINAL[nome]} da sua média` : `${fmt(r.valor)} ${NOME_CURTO[nome]}, quando o normal da conta é 0`;
  const detalhe = `${fmt(r.valor)} ${NOME_CURTO[nome]} ${quando}, contra ${fmtMed(r.mediana)} da mediana de ${r.posts} posts ${deQuem}`;
  return { sinal: nome, curto, detalhe };
}

const ORDEM_DO_MOTIVO: Record<Motivo, NomeDoSinal[]> = {
  conversa: ["comentarios", "engajamento"],
  alcance: ["visualizacoes", "engajamento"],
  salvamento: ["salvComp", "engajamento"],
  velocidade: ["velocidade", "crescimento", "engajamento"],
  fora_da_curva: [],
};

/** Os dois números que sustentam o motivo; em "fora da curva", as duas maiores razões. */
export function numerosQueSustentam(s: SinaisDoPost, motivo: Motivo): NumeroQueSustenta[] {
  let ordem = ORDEM_DO_MOTIVO[motivo];
  if (motivo === "fora_da_curva" || !ordem.length) {
    // Os destaques primeiro, pela maior razão; depois o resto.
    const razao = (k: NomeDoSinal) => (s[k] as Razao | Crescimento | null)?.razao ?? 0;
    ordem = (Object.keys(PESO_DO_SINAL) as NomeDoSinal[])
      .filter((k) => s[k])
      .sort((a, b) => Number(s.destaques.includes(b)) - Number(s.destaques.includes(a)) || razao(b) - razao(a));
  }
  const saida: NumeroQueSustenta[] = [];
  for (const nome of ordem) {
    if (saida.length >= 2) break;
    // Na leitura de 24 h, "as interações" e "as interações do primeiro dia" são o mesmo número.
    const repetido = s.foto.marco === 24 && ((nome === "engajamento" && saida.some((x) => x.sinal === "velocidade")) || (nome === "velocidade" && saida.some((x) => x.sinal === "engajamento")));
    if (repetido) continue;
    const t = textoDoSinal(nome, s);
    if (t) saida.push(t);
  }
  return saida;
}

const ABERTURA: Record<Motivo, string> = {
  conversa: "Este post puxou conversa acima do normal",
  alcance: "Este post está sendo visto acima do normal",
  salvamento: "Este post está sendo salvo e compartilhado acima do normal",
  velocidade: "Este post ganhou força mais rápido que o normal",
  fora_da_curva: "Este post está acima da sua média em mais de um sinal",
};

/** A frase montada em código: vale quando o texto do Haiku não passa na conferência (ou não veio). */
export function fraseDoCodigo(motivo: Motivo, numeros: NumeroQueSustenta[]): string {
  return `${ABERTURA[motivo]}: ${numeros.map((n) => n.curto).join("; ")}.`;
}

/* ── Orçamento, público e como fazer (sugestão, rotulada) ─────────────── */

/** Sugestão de partida, em reais. É sugestão da Demandou, não medida: a tela diz isso. */
export const ORCAMENTO_SUGERIDO = { porDiaBrl: 20, dias: 5 } as const;

export function textoDoOrcamento(): string {
  const total = ORCAMENTO_SUGERIDO.porDiaBrl * ORCAMENTO_SUGERIDO.dias;
  return `R$ ${fmt(ORCAMENTO_SUGERIDO.porDiaBrl)} por dia durante ${ORCAMENTO_SUGERIDO.dias} dias (R$ ${fmt(total)} no total). O app da rede mostra o alcance estimado antes de você pagar; ajuste lá.`;
}

export const PUBLICO_POR_MOTIVO: Record<Motivo, string> = {
  conversa: "pessoas parecidas com quem já segue você, que é o público que está conversando",
  alcance: "pessoas parecidas com os seus seguidores, na região onde você atende",
  salvamento: "pessoas com os interesses do seu nicho, parecidas com os seus seguidores",
  velocidade: "os seus seguidores e pessoas parecidas com eles, enquanto o post ainda está subindo",
  fora_da_curva: "pessoas parecidas com os seus seguidores",
};

export function comoImpulsionar(rede: string): string {
  if (rede === "instagram") return "Abra o post no Instagram e toque em Turbinar.";
  if (rede === "facebook") return "Abra o post na página do Facebook e clique em Turbinar publicação.";
  if (rede === "linkedin") return "Abra o post na página do LinkedIn e clique em Impulsionar.";
  return `Abra o post no ${nomeDaRede(rede)} e use a opção de impulsionar do próprio app.`;
}

/* ── O JEV ────────────────────────────────────────────────────────────── */

const corte = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

function sinalNoEstado(r: Razao | null) {
  return r ? { valor: r.valor, mediana_da_conta: r.mediana, razao: r.razao, posts_na_mediana: r.posts, comparado_com: r.escopo === "formato" ? "mesmo formato" : "conta inteira", leitura_de: `${r.marco} h` } : "a fonte não mede";
}

/** O estado que o JEV lê: as contas (base e seguidores) e os candidatos com os sinais medidos. Sem nome nem e-mail do cliente. */
export function estadoDoJev(analise: Pick<AnaliseDoProjeto, "bases" | "candidatos">): Record<string, unknown> {
  const contas = new Set(analise.candidatos.map((c) => c.conta));
  return {
    contexto:
      "Uma plataforma de conteúdo mede os posts de um cliente nas redes sociais e quer sugerir quais vale impulsionar nesta semana (anúncio pago a partir do próprio post, o 'Turbinar' do Instagram). Os números foram medidos em código contra a MEDIANA da própria conta nos últimos 90 dias, na mesma leitura de tempo depois da publicação (24 h, 3 dias ou 7 dias), no mesmo formato quando há 5 posts, senão na conta inteira. Razão 1 é o normal da conta. Impulsionar vale quando o post já provou sozinho que prende o público: conversa acima do normal, alcance acima do normal, salvamentos e compartilhamentos, ou subida que continua depois do primeiro dia. Não vale quando o destaque é acaso de número pequeno ou um sinal fraco.",
    contas: analise.bases
      .filter((b) => contas.has(b.conta))
      .map((b) => ({ conta: b.conta, rede: b.rede, posts_medidos_em_90_dias: b.postsMedidos, seguidores: b.seguidores?.valor ?? "não sabemos" })),
    candidatos: analise.candidatos.map((c) => ({
      id: c.postId,
      conta: c.conta,
      rede: c.rede,
      formato: ROTULO_DO_FORMATO[c.formato],
      idade_em_horas: Math.round(c.idadeH),
      leitura_usada: `${c.foto.marco} h`,
      ...(c.funil ? { etapa_do_funil_da_campanha: c.funil } : {}),
      legenda: corte(c.titulo, 160),
      interacoes: sinalNoEstado(c.engajamento),
      comentarios: sinalNoEstado(c.comentarios),
      visualizacoes: sinalNoEstado(c.visualizacoes),
      salvamentos_e_compartilhamentos: sinalNoEstado(c.salvComp),
      interacoes_no_primeiro_dia: sinalNoEstado(c.velocidade),
      subida_entre_24h_e_72h: c.crescimento
        ? { subida: c.crescimento.valor, mediana_da_conta: c.crescimento.mediana, razao: c.crescimento.razao, interacoes_novas: c.crescimento.novas }
        : "sem as duas leituras",
      ...(c.taxa ? { interacoes_por_seguidor: c.taxa.valor } : {}),
    })),
  };
}

export function perguntasDoJev(candidatos: SinaisDoPost[]): Record<string, PerguntaDoJev> {
  const perguntas: Record<string, PerguntaDoJev> = {};
  for (const c of candidatos) {
    perguntas[`impulsionar_${c.postId}`] = {
      type: "noul",
      instructions: `O candidato de id "${c.postId}" merece ser impulsionado agora? Responda sim só quando os números mostram o post claramente acima do normal da própria conta, com número que não é acaso. Responda não quando o destaque é pequeno, isolado ou frágil.`,
    };
    perguntas[`motivo_${c.postId}`] = {
      type: "choice",
      instructions: `No candidato de id "${c.postId}": qual é o motivo principal para impulsionar, pelos números dele?`,
      criteria: Object.fromEntries(c.motivos.map((m) => [m, CRITERIO_DO_MOTIVO[m]])),
    };
  }
  if (candidatos.length > 1) {
    perguntas.prioridade = {
      type: "choice",
      instructions: "Se o cliente só puder impulsionar um destes posts agora, qual deve vir primeiro?",
      criteria: Object.fromEntries(candidatos.map((c) => [c.postId, `${nomeDaRede(c.rede)}, ${ROTULO_DO_FORMATO[c.formato]}: "${corte(c.titulo, 80)}"`])),
    };
  }
  return perguntas;
}

export type DecisaoDoJev = { postId: string; probabilidade: number; motivo: Motivo; confiancaDoMotivo: number };

/**
 * As respostas do JEV, com a margem de "não sei": sim de 0,65 para cima e
 * motivo com confiança de 0,5 para cima, dentro dos motivos que os números
 * permitem. A prioridade confiante vai primeiro; o resto, pela probabilidade.
 */
export function lerDecisao(respostas: Record<string, RespostaDoJev>, candidatos: SinaisDoPost[]): DecisaoDoJev[] {
  const escolhidos: DecisaoDoJev[] = [];
  for (const c of candidatos) {
    const r = respostas[`impulsionar_${c.postId}`];
    const p = r && r.type === "noul" && typeof r.noul === "number" ? r.noul : null;
    if (p === null || p < SIM_DO_JEV) continue;
    const m = respostas[`motivo_${c.postId}`];
    if (!m || m.type !== "choice" || typeof m.confidence !== "number" || m.confidence < CONFIANCA_MINIMA) continue;
    if (!(c.motivos as string[]).includes(m.choice)) continue;
    escolhidos.push({ postId: c.postId, probabilidade: p, motivo: m.choice as Motivo, confiancaDoMotivo: m.confidence });
  }
  escolhidos.sort((a, b) => b.probabilidade - a.probabilidade);
  const pr = respostas.prioridade;
  if (pr && pr.type === "choice" && typeof pr.confidence === "number" && pr.confidence >= CONFIANCA_MINIMA) {
    const i = escolhidos.findIndex((e) => e.postId === pr.choice);
    if (i > 0) escolhidos.unshift(...escolhidos.splice(i, 1));
  }
  return escolhidos;
}

/* ── A frase do Haiku e a conferência dos números ─────────────────────── */

/** Palavras de número por extenso: a frase usa só algarismos (é o que a conferência lê). */
const NUMERO_POR_EXTENSO = /\b(dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|vinte|trinta|quarenta|cinquenta|cem|cento|mil|milh(?:[aã]o|[oõ]es)|dobro|triplo|qu[aá]druplo|metade)\b/i;

/** O travessão e o meio-traço, montados pelo código do caractere (o arquivo não carrega nenhum dos dois). */
export const TRACOS_LONGOS = new RegExp(`[${String.fromCharCode(0x2014)}${String.fromCharCode(0x2013)}]`);

/** Os números de um texto, normalizados ("2,3" e "2.3" viram 2.3; "1.234" vira 1234). */
export function numerosDoTexto(texto: string): number[] {
  const saida: number[] = [];
  for (const m of texto.matchAll(/\d+(?:[.,]\d+)*/g)) {
    let t = m[0];
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(?:\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
    const n = Number(t);
    if (Number.isFinite(n)) saida.push(n);
  }
  return saida;
}

/**
 * A FRASE PASSA? Sem travessão, sem número por extenso, até 220 caracteres e
 * todo número dela entre os números permitidos (os que o código passou).
 */
export function conferirFrase(frase: string, permitidos: string[]): { ok: true } | { ok: false; motivo: string } {
  const f = frase.trim();
  if (f.length < 12) return { ok: false, motivo: "curta demais" };
  if (f.length > 220) return { ok: false, motivo: "longa demais" };
  if (TRACOS_LONGOS.test(f)) return { ok: false, motivo: "travessão" };
  if (NUMERO_POR_EXTENSO.test(f)) return { ok: false, motivo: "número por extenso" };
  const ok = new Set(permitidos.flatMap(numerosDoTexto));
  const sobra = numerosDoTexto(f).filter((n) => !ok.has(n));
  if (sobra.length) return { ok: false, motivo: `número fora do estado: ${sobra.join(", ")}` };
  return { ok: true };
}

export type PedidoDeFrase = { id: string; rede: string; formato: string; motivo: Motivo; numeros: NumeroQueSustenta[] };

/** Os números que a frase daquele post pode usar: os dos textos que o código montou. */
export function permitidosDo(p: PedidoDeFrase): string[] {
  return p.numeros.flatMap((n) => [n.curto, n.detalhe]);
}

export const SISTEMA_DA_FRASE =
  "Você escreve, em português do Brasil, uma frase curta para o dono de um perfil nas redes sociais explicando por que um post dele vale ser impulsionado. Regras: no máximo 160 caracteres; tom direto e simples, em segunda pessoa (você); use SÓ os números que aparecem nos fatos, exatamente como estão escritos, com vírgula; nunca escreva número por extenso; nunca invente número, porcentagem, valor em reais, prazo ou resultado; não prometa vendas nem seguidores; não use travessão; não use emoji. Responda só com JSON.";

export function pedidoDaFrase(pedidos: PedidoDeFrase[]): string {
  return JSON.stringify({
    tarefa: 'Para cada post, escreva "frase" a partir do motivo e dos fatos. Responda {"frases":[{"id":"...","frase":"..."}]}.',
    posts: pedidos.map((p) => ({
      id: p.id,
      rede: nomeDaRede(p.rede),
      formato: p.formato,
      motivo: ROTULO_DO_MOTIVO[p.motivo],
      fatos: p.numeros.map((n) => n.detalhe),
      resumo_dos_numeros: p.numeros.map((n) => n.curto),
    })),
  });
}

/** Lê o JSON do Haiku e confere cada frase. Devolve só as que passaram. */
export function lerFrases(bruto: string, pedidos: PedidoDeFrase[]): { frases: Record<string, string>; recusadas: Record<string, string> } {
  const frases: Record<string, string> = {};
  const recusadas: Record<string, string> = {};
  let lista: Array<{ id?: unknown; frase?: unknown }> = [];
  try {
    const j = JSON.parse(bruto.slice(bruto.indexOf("{"), bruto.lastIndexOf("}") + 1)) as { frases?: Array<{ id?: unknown; frase?: unknown }> };
    lista = Array.isArray(j.frases) ? j.frases : [];
  } catch {
    for (const p of pedidos) recusadas[p.id] = "resposta sem JSON";
    return { frases, recusadas };
  }
  for (const p of pedidos) {
    const item = lista.find((x) => x && x.id === p.id);
    if (!item || typeof item.frase !== "string") {
      recusadas[p.id] = "não veio";
      continue;
    }
    const c = conferirFrase(item.frase, permitidosDo(p));
    if (c.ok) frases[p.id] = item.frase.trim();
    else recusadas[p.id] = c.motivo;
  }
  return { frases, recusadas };
}

/* ── O que fica guardado e o que a tela recebe ────────────────────────── */

export type SugestaoDeImpulso = {
  postId: string;
  rede: string;
  contaRotulo: string | null;
  formato: FormatoDoImpulso;
  publicadoEm: string;
  marco: number;
  link: string;
  titulo: string;
  motivo: Motivo;
  /** A probabilidade do sim e a confiança do motivo, como o JEV respondeu. */
  probabilidade: number;
  confiancaDoMotivo: number;
  numeros: NumeroQueSustenta[];
  frase: string;
  fraseDe: "haiku" | "codigo";
  /** A leitura de onde saíram os números. */
  fonte: string;
  lidoEm: string;
  escopo: "formato" | "conta";
  /** Interações por seguidor, com a contagem de seguidores, a fonte e a data dela. */
  taxa: { valor: number; seguidores: Seguidores } | null;
  /** O primeiro comentário da própria conta não entrou na contagem. */
  semPrimeiroComentario: boolean;
  publico: string;
  orcamento: string;
  comoFazer: string;
  /** A chave do descarte: impulsionar:<postId>:<marco>. */
  chave: string | null;
};

export type EstadoDoImpulso = "aprendendo" | "sem_candidato" | "desligado" | "jev_falhou" | "decidido";

export type GuardadoDoImpulso = {
  versao: 1;
  calculadoEm: string;
  estado: EstadoDoImpulso;
  /** Resumo dos candidatos (id, marco, pontuação): igual ao da passada anterior, o JEV não é perguntado de novo. */
  marcaDaEntrada: string;
  candidatos: number;
  aprendendo: AnaliseDoProjeto["aprendendo"];
  sugestoes: SugestaoDeImpulso[];
  custoUsd: { jev: number; texto: number };
  motivo: string | null;
  /** Só na prova local: sem JEV e sem Haiku, a tela mostra o selo de simulação. */
  simulado?: boolean;
};

export function marcaDaEntrada(candidatos: SinaisDoPost[]): string {
  return candidatos
    .map((c) => `${c.postId}:${c.foto.marco}:${c.pontuacao}`)
    .sort()
    .join("|");
}

export function montarSugestao(c: SinaisDoPost, d: DecisaoDoJev, frase: { texto: string; de: "haiku" | "codigo" } | null): SugestaoDeImpulso {
  const numeros = numerosQueSustentam(c, d.motivo);
  return {
    postId: c.postId,
    rede: c.rede,
    contaRotulo: c.contaRotulo,
    formato: c.formato,
    publicadoEm: c.publicadoEm,
    marco: c.foto.marco,
    link: c.link,
    titulo: corte(c.titulo, 140),
    motivo: d.motivo,
    probabilidade: Math.round(d.probabilidade * 1000) / 1000,
    confiancaDoMotivo: Math.round(d.confiancaDoMotivo * 1000) / 1000,
    numeros,
    frase: frase?.texto ?? fraseDoCodigo(d.motivo, numeros),
    fraseDe: frase?.de ?? "codigo",
    fonte: c.foto.fonte,
    lidoEm: c.foto.lidoEm,
    escopo: c.escopo,
    taxa: c.taxa,
    semPrimeiroComentario: c.semPrimeiroComentario,
    publico: PUBLICO_POR_MOTIVO[d.motivo],
    orcamento: textoDoOrcamento(),
    comoFazer: comoImpulsionar(c.rede),
    chave: chaveDoImpulso(c.postId, c.foto.marco),
  };
}

/** A sugestão ainda vale? O post não passou de 7 dias. */
export function sugestaoValida(s: SugestaoDeImpulso, agora: Date): boolean {
  const idade = (agora.getTime() - new Date(s.publicadoEm).getTime()) / HORA;
  return idade >= IDADE_MINIMA_H && idade <= IDADE_MAXIMA_H;
}

export type ImpulsosNaTela = {
  estado: EstadoDoImpulso | "sem_leitura";
  calculadoEm: string | null;
  sugestoes: SugestaoDeImpulso[];
  aprendendo: AnaliseDoProjeto["aprendendo"];
  simulado: boolean;
};

export function impulsosNaTela(g: GuardadoDoImpulso | null, agora: Date): ImpulsosNaTela {
  if (!g) return { estado: "sem_leitura", calculadoEm: null, sugestoes: [], aprendendo: [], simulado: false };
  return {
    estado: g.estado,
    calculadoEm: g.calculadoEm,
    sugestoes: (g.sugestoes ?? []).filter((s) => sugestaoValida(s, agora)),
    aprendendo: g.aprendendo ?? [],
    simulado: Boolean(g.simulado),
  };
}

/** "lido pela API do Instagram em 08/10 14:00" (a data no fuso de Brasília). */
export function fonteEData(fonte: string, lidoEm: string): string {
  const quando = new Date(lidoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  return `${rotuloDaFonte(fonte)}, lido em ${quando}`;
}
