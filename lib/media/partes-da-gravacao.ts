/**
 * A GRAVAÇÃO EM PARTES (08/10/2026), a regra pura: a tela, as rotas e os
 * testes leem daqui, e nada aqui importa o banco.
 *
 * O pedido do Bruno: "alguns usuários vão subir mais de um arquivo de vídeo
 * para edição, às vezes eles gravam em 2, 3 vezes, arquivos separados; a
 * plataforma deve deixar isso, porém a própria plataforma deve pedir para o
 * usuário selecionar a ordem dos vídeos, 1, 2, 3, para ficar mais fácil a
 * edição."
 *
 * O desenho:
 *
 * 1. A tela sugere a ordem (pela data de gravação do arquivo, quando o
 *    navegador dá uma que diga alguma coisa; senão pelo nome) e a pessoa
 *    CONFIRMA antes de enviar. Um arquivo só segue exatamente como antes.
 * 2. Cada parte sobe pelo mesmo caminho de sempre (Blob privado). O registro
 *    é UM vídeo, com `blobUrl` na primeira parte e a lista na ordem
 *    confirmada na coluna `partes` (fora do schema do Prisma, lida e gravada
 *    por SQL cru, como `retomadas`; ver lib/media/partes-servidor.ts).
 * 3. Antes da transcrição, o worker junta as partes (passo "juntar",
 *    worker/src/juntar-partes.mjs). O vídeo juntado vira o `blobUrl` e a
 *    esteira segue igual; a duração cobrada é a dele, medida na transcrição.
 */

/** Quantas partes uma gravação aceita. Mais que isso é edição, e não gravação. */
export const MAX_PARTES = 10;

/** O que a tela sabe de cada arquivo escolhido para sugerir a ordem. */
export type ParteParaOrdenar = {
  nome: string;
  /** `File.lastModified` (ms). Alguns celulares mandam a hora da escolha, e não a da gravação. */
  modificadoEm?: number | null;
};

export type CriterioDaOrdem = "data" | "nome";

/** Nome como gente lê: "parte 2" antes de "parte 10", sem caixa nem acento decidir. */
export function compararNomes(a: string, b: string): number {
  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });
}

/**
 * A data do arquivo diz alguma coisa? Só quando todas existem e estão a pelo
 * menos um segundo umas das outras. Arquivo do celular escolhido pela galeria
 * às vezes chega com a hora da ESCOLHA (milissegundos de diferença entre as
 * partes), e aí a data ordenaria pelo clique, e não pela gravação.
 */
export function datasInformativas(partes: ParteParaOrdenar[]): boolean {
  const datas = partes.map((p) => p.modificadoEm);
  if (datas.some((d) => typeof d !== "number" || !Number.isFinite(d) || d <= 0)) return false;
  const ordenadas = [...(datas as number[])].sort((a, b) => a - b);
  for (let i = 1; i < ordenadas.length; i++) if (ordenadas[i] - ordenadas[i - 1] < 1000) return false;
  return true;
}

/**
 * A ORDEM SUGERIDA: os índices de `partes`, do primeiro trecho ao último.
 * Pela data quando ela informa (o arquivo que terminou de gravar primeiro vem
 * primeiro), senão pelo nome (IMG_0012 antes de IMG_0013, "parte 2" antes de
 * "parte 10"). É sugestão: a tela pede a confirmação da pessoa.
 */
export function sugerirOrdem(partes: ParteParaOrdenar[]): { ordem: number[]; criterio: CriterioDaOrdem } {
  const indices = partes.map((_, i) => i);
  if (partes.length > 1 && datasInformativas(partes)) {
    indices.sort((a, b) => (partes[a].modificadoEm as number) - (partes[b].modificadoEm as number) || compararNomes(partes[a].nome, partes[b].nome));
    return { ordem: indices, criterio: "data" };
  }
  indices.sort((a, b) => compararNomes(partes[a].nome, partes[b].nome) || a - b);
  return { ordem: indices, criterio: "nome" };
}

/** Sobe ou desce uma parte na lista (as setas da tela). Devolve uma lista nova. */
export function moverParte<T>(lista: T[], de: number, para: number): T[] {
  if (de < 0 || de >= lista.length || para < 0 || para >= lista.length || de === para) return lista;
  const nova = [...lista];
  const [item] = nova.splice(de, 1);
  nova.splice(para, 0, item);
  return nova;
}

/** Uma parte já no storage, como o vídeo guarda (na ordem confirmada). */
export type ParteRegistrada = {
  url: string;
  nome: string;
  bytes: number;
  /** A duração que o navegador leu. A que vale é a do vídeo juntado. */
  duracaoSeg: number | null;
};

/** O que o worker devolve quando junta, guardado em `partes.juntado`. */
export type JuntadoDaGravacao = {
  url: string;
  bytes: number;
  duracaoSeg: number;
  somaSeg: number;
  diferencaSeg: number;
  largura: number;
  altura: number;
  orientacao: string;
  em: string;
};

/** A coluna `partes` do vídeo. */
export type PartesDaGravacao = {
  versao: 1;
  /** Na ordem que a pessoa confirmou: o índice 0 é o primeiro trecho do vídeo. */
  itens: ParteRegistrada[];
  /** Como a tela sugeriu a ordem que a pessoa confirmou (ou mudou). */
  criterio: CriterioDaOrdem | "manual";
  confirmadaEm: string;
  /** Preenchido quando o worker juntou: o vídeo juntado já é o `blobUrl`. */
  juntado?: JuntadoDaGravacao | null;
};

/** Ainda falta juntar? Só com mais de uma parte e sem o juntado gravado. */
export function partesPorJuntar(p: PartesDaGravacao | null | undefined): boolean {
  return Boolean(p && Array.isArray(p.itens) && p.itens.length > 1 && !p.juntado);
}

/** O resumo que a faixa do Gestor recebe (sem URL nenhuma). */
export type ResumoDasPartes = { quantas: number; juntadas: boolean };
export function resumoDasPartes(p: PartesDaGravacao | null | undefined): ResumoDasPartes | null {
  if (!p || !Array.isArray(p.itens) || p.itens.length < 2) return null;
  return { quantas: p.itens.length, juntadas: Boolean(p.juntado) };
}

/** "aula, em 3 partes": o nome que o vídeo leva no Gestor e nos avisos. */
export function nomeDaGravacaoEmPartes(nomes: string[]): string {
  const primeiro = (nomes[0] ?? "Gravação").replace(/\.[^.]+$/, "").trim() || "Gravação";
  return nomes.length > 1 ? `${primeiro}, em ${nomes.length} partes` : primeiro;
}

export function somaDosBytes(itens: Array<{ bytes: number }>): number {
  return itens.reduce((t, p) => t + (Number.isFinite(p.bytes) ? p.bytes : 0), 0);
}

export function somaDasDuracoes(itens: Array<{ duracaoSeg: number | null }>): number {
  return itens.reduce((t, p) => t + (p.duracaoSeg && Number.isFinite(p.duracaoSeg) ? p.duracaoSeg : 0), 0);
}

/**
 * A URL é uma gravação deste projeto no NOSSO storage? A lista de partes vem
 * do navegador, e sem esta conferência alguém registraria como parte dele o
 * arquivo de outro cliente. O token do upload só grava em `videos/<projeto>/`.
 */
export function urlDaParteValida(url: unknown, projectId: string): url is string {
  if (typeof url !== "string") return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || !u.hostname.endsWith(".blob.vercel-storage.com")) return false;
    return decodeURIComponent(u.pathname).startsWith(`/videos/${projectId}/`);
  } catch {
    return false;
  }
}

/**
 * Confere a lista que o navegador mandou e devolve a versão limpa, na ordem
 * recebida (que é a ordem confirmada). Nunca reordena: a ordem é da pessoa.
 */
export function validarPartes(
  bruto: unknown,
  projectId: string
): { ok: true; itens: ParteRegistrada[] } | { ok: false; erro: string } {
  if (!Array.isArray(bruto)) return { ok: false, erro: "A lista de partes não veio." };
  if (bruto.length < 2) return { ok: false, erro: "Gravação em partes pede pelo menos duas partes." };
  if (bruto.length > MAX_PARTES) return { ok: false, erro: `Uma gravação aceita até ${MAX_PARTES} partes.` };
  const itens: ParteRegistrada[] = [];
  const vistas = new Set<string>();
  for (let i = 0; i < bruto.length; i++) {
    const p = bruto[i] as Record<string, unknown> | null;
    if (!p || !urlDaParteValida(p.url, projectId)) return { ok: false, erro: `A parte ${i + 1} não é uma gravação enviada para este projeto.` };
    if (vistas.has(p.url as string)) return { ok: false, erro: `A parte ${i + 1} está repetida na lista.` };
    vistas.add(p.url as string);
    const bytes = Number(p.bytes);
    const duracao = p.duracaoSeg === null || p.duracaoSeg === undefined ? null : Number(p.duracaoSeg);
    itens.push({
      url: p.url as string,
      nome: (typeof p.nome === "string" && p.nome.trim() ? p.nome.trim() : `Parte ${i + 1}`).slice(0, 200),
      bytes: Number.isFinite(bytes) && bytes > 0 ? Math.round(bytes) : 0,
      duracaoSeg: duracao !== null && Number.isFinite(duracao) && duracao > 0 ? Number(duracao.toFixed(3)) : null,
    });
  }
  return { ok: true, itens };
}

/** O registro que vai para a coluna `partes`, na ordem confirmada. */
export function registroDasPartes(itens: ParteRegistrada[], criterio: unknown, agora = new Date()): PartesDaGravacao {
  return {
    versao: 1,
    itens,
    criterio: criterio === "data" || criterio === "nome" ? criterio : "manual",
    confirmadaEm: agora.toISOString(),
    juntado: null,
  };
}

/**
 * O PEDIDO DE UMA PARTE ao token do upload (`clientPayload`). A lista vai
 * inteira, na ordem confirmada, com a URL das partes que já subiram: quando
 * sobe a ÚLTIMA que faltava, o aviso do storage tem tudo para registrar o
 * vídeo sozinho, como faz com o arquivo único (a aba pode ter fechado).
 */
export type PedidoDaParte = {
  indice: number;
  criterio: string;
  partes: Array<{ url: string | null; nome: string; bytes: number; duracaoSeg: number | null }>;
};

/** Confere o pedido de uma parte (o que vem do navegador). Null quando não serve. */
export function lerPedidoDaParte(bruto: unknown, projectId: string): PedidoDaParte | null {
  const p = bruto as Partial<PedidoDaParte> | null;
  if (!p || !Array.isArray(p.partes) || p.partes.length < 2 || p.partes.length > MAX_PARTES) return null;
  const indice = Number(p.indice);
  if (!Number.isInteger(indice) || indice < 0 || indice >= p.partes.length) return null;
  const partes: PedidoDaParte["partes"] = [];
  for (const [i, x] of p.partes.entries()) {
    if (!x || typeof x !== "object") return null;
    // A URL das que já subiram precisa ser deste projeto; a da parte que está
    // subindo agora ainda não existe.
    if (i !== indice && x.url !== null && x.url !== undefined && !urlDaParteValida(x.url, projectId)) return null;
    partes.push({
      url: i === indice ? null : (x.url as string | null) ?? null,
      // 120 e não 200: a lista inteira viaja dentro do token do upload.
      nome: typeof x.nome === "string" ? x.nome.slice(0, 120) : `Parte ${i + 1}`,
      bytes: Number.isFinite(Number(x.bytes)) ? Number(x.bytes) : 0,
      duracaoSeg: Number.isFinite(Number(x.duracaoSeg)) && Number(x.duracaoSeg) > 0 ? Number(x.duracaoSeg) : null,
    });
  }
  return { indice, criterio: typeof p.criterio === "string" ? p.criterio : "manual", partes };
}

/**
 * No aviso do storage: a parte que chegou fecha a lista? Devolve a lista
 * completa (na ordem confirmada) para registrar, ou null quando ainda falta
 * parte subir (o vídeo nasce no aviso da última).
 */
export function listaCompletaNoAviso(pedido: PedidoDaParte, urlQueChegou: string): ParteRegistrada[] | null {
  const itens = pedido.partes.map((p, i) => ({ ...p, url: i === pedido.indice ? urlQueChegou : p.url }));
  if (itens.some((p) => !p.url)) return null;
  return itens.map((p) => ({ url: p.url as string, nome: p.nome, bytes: p.bytes, duracaoSeg: p.duracaoSeg }));
}

/** O que o cliente lê quando a junção falha. Sem termo técnico; o código vem da etapa (VID-JUN). */
export const MENSAGEM_DA_JUNCAO_FALHOU =
  "Não consegui juntar as partes da sua gravação desta vez. Nada se perdeu: as partes continuam guardadas e vamos tentar de novo.";
