import { NOME_DA_REDE } from "@/lib/pipeline/redes";

/**
 * O INVENTÁRIO DAS REDES DO CLIENTE (08/10/2026), sem banco: a tela, a guarda
 * e os redatores importam daqui.
 *
 * É a única lista de conteúdo próprio que um texto gerado pode citar. Entra
 * nela só o que está COMPROVADO no ar:
 *   - post nosso com status publicado e endereço externo;
 *   - item visto na varredura das redes do cliente (YouTube pela API oficial,
 *     Instagram, TikTok e Facebook pelo perfil público na mesma leitura que a
 *     medição já paga; ver lib/analytics/inventario-das-redes.ts).
 * Regra do Bruno: "se não sabe, não fala".
 */

export type ItemDoInventario = {
  rede: string;
  /** O título real (YouTube) ou a primeira linha da legenda; nulo quando não há texto. */
  titulo: string | null;
  url: string | null;
  /** ISO, quando se sabe. */
  publicadoEm: string | null;
  formato: string | null;
  /** "demandou": publicado por aqui; "varredura": visto no perfil público do cliente. */
  origem: "demandou" | "varredura";
};

/** Título comparável PALAVRA POR PALAVRA: sem caixa, sem aspas, espaços únicos; acento conta. */
export function tituloComparavel(t: string): string {
  return t
    .normalize("NFC")
    .toLowerCase()
    .replace(/["“”'‘’«»]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s.,;:!?…]+|[\s.,;:!?…]+$/g, "")
    .trim();
}

/** Link comparável: sem www, sem barra final; YouTube pelo id do vídeo (watch, youtu.be ou shorts). */
export function urlComparavel(bruta: string): string {
  const u = bruta.trim().replace(/[).,;:!?]+$/, "");
  try {
    const x = new URL(u);
    const host = x.hostname.replace(/^(?:www|m)\./, "").toLowerCase();
    if (host === "youtu.be") return `youtube.com/watch?v=${x.pathname.slice(1)}`;
    if (host.endsWith("youtube.com")) {
      const v = x.searchParams.get("v") ?? x.pathname.match(/\/shorts\/([\w-]+)/)?.[1];
      if (v) return `youtube.com/watch?v=${v}`;
    }
    let caminho = x.pathname;
    try {
      caminho = decodeURIComponent(caminho);
    } catch {
      // caminho com % solto: fica como veio
    }
    return `${host}${caminho.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return u.toLowerCase();
  }
}

/**
 * O título que o YouTube mostra para um post nosso: a primeira linha do
 * texto, sem < e >, em até 100 caracteres (o mesmo corte da publicação, em
 * lib/oauth/youtube.ts e lib/publish/via-blotato.ts).
 */
export function tituloNoYoutube(conteudo: string | null | undefined): string | null {
  const primeira = (conteudo ?? "").split("\n")[0]?.trim() ?? "";
  const t = primeira.replace(/[<>]/g, "").slice(0, 100).trim();
  return t || null;
}

/** A primeira linha de uma legenda, como "título" de um post que não tem título. */
export function primeiraLinha(conteudo: string | null | undefined, teto = 160): string | null {
  const l = (conteudo ?? "").split("\n").map((x) => x.trim()).find(Boolean) ?? "";
  return l ? l.slice(0, teto) : null;
}

export function rotuloDoItem(i: ItemDoInventario): string {
  const data = i.publicadoEm && !Number.isNaN(new Date(i.publicadoEm).getTime())
    ? new Date(i.publicadoEm).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "data desconhecida";
  const rede = NOME_DA_REDE[i.rede] ?? i.rede;
  return `${rede}, ${data}${i.formato ? `, ${i.formato}` : ""}: ${(i.titulo ?? "(sem texto)").slice(0, 160)}`;
}

/**
 * O inventário como o redator lê: a ÚNICA lista de conteúdo próprio que ele
 * pode citar, com o título exato. Vazia, a regra é não citar nada.
 */
export function listaDoInventarioParaRedator(inventario: ItemDoInventario[], maximo = 15): string {
  const itens = inventario.slice(0, maximo);
  if (!itens.length) {
    return "CONTEÚDO PRÓPRIO COMPROVADO: nenhum. Não cite nenhum vídeo, post, carrossel, live, artigo, canal, link ou peça do cliente: nada dele está comprovado publicado.";
  }
  return [
    "CONTEÚDO PRÓPRIO COMPROVADO (a ÚNICA lista de conteúdo do cliente que pode ser citado; título exatamente como está aqui, palavra por palavra; o que não está aqui não existe):",
    ...itens.map((i) => `- ${rotuloDoItem(i)}${i.url ? ` (${i.url})` : ""}`),
  ].join("\n");
}

/** Junta listas do inventário sem repetir o mesmo endereço; o mais recente primeiro. */
export function juntarInventario(...listas: ItemDoInventario[][]): ItemDoInventario[] {
  const vistos = new Set<string>();
  const saida: ItemDoInventario[] = [];
  for (const i of listas.flat()) {
    const chave = i.url ? urlComparavel(i.url) : `${i.rede}:${i.titulo ?? ""}:${i.publicadoEm ?? ""}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    saida.push(i);
  }
  const quando = (i: ItemDoInventario) => (i.publicadoEm ? new Date(i.publicadoEm).getTime() || 0 : 0);
  return saida.sort((a, b) => quando(b) - quando(a));
}
