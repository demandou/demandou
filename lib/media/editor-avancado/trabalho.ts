import { randomUUID } from "node:crypto";

/**
 * O PEDIDO DA CENA VIRA TRABALHO (11/10/2026). No teste do Bruno (vídeo
 * cmv3tyr0u, Maquete 3D) a escrita da cena passou de 13 minutos e a Vercel
 * matou a rota em 800 s, com o worker esperando a resposta. Agora a rota
 * responde 202 com um id na hora, faz a fase depois da resposta (after(), uma
 * invocação por fase, com o prazo dela) e grava o fim no Blob privado; o
 * worker consulta pelo id até ficar pronto.
 *
 * O id carrega a hora do começo (`<ms>-<uuid>`): sem registro de início, a
 * consulta sabe quando a função morreu no prazo sem gravar nada (passou do
 * prazo da função e o fim não existe).
 */
export const PRAZO_DA_FUNCAO_S = 800;
/** Folga depois do prazo da função antes de declarar o trabalho perdido. */
const FOLGA_S = 40;
const ID = /^(\d{13})-[0-9a-f-]{36}$/;

export type FimDoTrabalho =
  | { estado: "pronto"; resultado: Record<string, unknown>; segundos: number }
  | { estado: "falhou"; erro: string; custoUsd: number; pensou?: boolean; invalido?: boolean; segundos: number };

export type EstadoDoTrabalho = FimDoTrabalho | { estado: "andando"; segundos: number } | { estado: "perdido"; erro: string; segundos: number };

export function novoIdDeTrabalho(agora = Date.now()): string {
  return `${agora}-${randomUUID()}`;
}

/** A hora do começo, ou null se o id não é um id de trabalho (nunca vira caminho no Blob). */
export function inicioDoTrabalho(id: unknown): number | null {
  const m = typeof id === "string" ? id.match(ID) : null;
  return m ? Number(m[1]) : null;
}

/** O estado pela hora do começo e o fim gravado (ou null). Puro (testado). */
export function estadoDoTrabalho(id: string, fim: FimDoTrabalho | null, agora = Date.now()): EstadoDoTrabalho {
  const inicio = inicioDoTrabalho(id) ?? agora;
  const segundos = Math.round((agora - inicio) / 1000);
  if (fim) return fim;
  if (segundos > PRAZO_DA_FUNCAO_S + FOLGA_S) return { estado: "perdido", erro: `a função da fase morreu no prazo de ${PRAZO_DA_FUNCAO_S} s sem gravar o resultado`, segundos };
  return { estado: "andando", segundos };
}

const caminho = (id: string) => `editor-avancado/trabalhos/${id}-fim.json`;
const token = () => process.env.BLOB_READ_WRITE_TOKEN;

export async function gravarFim(id: string, fim: FimDoTrabalho): Promise<void> {
  const { put } = await import("@vercel/blob");
  await put(caminho(id), JSON.stringify(fim), { access: "private", token: token(), addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
}

/**
 * O fim gravado, ou null. O head vai à API do Blob (não ao CDN): um "não existe"
 * nunca fica guardado em cache, e a URL só é lida depois que o arquivo existe.
 */
export async function lerFim(id: string): Promise<FimDoTrabalho | null> {
  const { head, get, BlobNotFoundError } = await import("@vercel/blob");
  let url: string;
  try {
    url = (await head(caminho(id), { token: token() })).url;
  } catch (e) {
    if (e instanceof BlobNotFoundError) return null;
    throw e;
  }
  const b = await get(url, { access: "private", token: token() });
  if (!b || b.statusCode !== 200) return null;
  return JSON.parse(await new Response(b.stream).text()) as FimDoTrabalho;
}

/** Apaga o fim depois de lido (o worker já tem o resultado). Falha calada: o Blob não é a fonte de nada. */
export async function apagarFim(id: string): Promise<void> {
  try {
    const { del } = await import("@vercel/blob");
    await del(caminho(id), { token: token() });
  } catch {
    // sobra um JSON pequeno no store privado
  }
}
