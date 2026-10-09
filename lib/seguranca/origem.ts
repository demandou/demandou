/**
 * AS ORIGENS QUE PODEM ESCREVER NA API (08/10/2026). Módulo puro, sem Node:
 * roda na borda (proxy.ts) e nos testes.
 *
 * O projeto não manda cabeçalho CORS nenhum, e isso é o certo: sem
 * Access-Control-Allow-Origin, o navegador não deixa outro site LER a nossa
 * resposta. O que o CORS não impede é o ENVIO: um site de golpe pode disparar
 * um POST com o cookie da pessoa (o cookie é SameSite=Lax, que já barra a
 * maioria, mas não é a única trava que queremos). O navegador sempre carimba
 * o `Origin` nesse envio, e aqui a lista é fechada: ou é a própria Demandou,
 * ou é o próprio host da requisição (Preview da Vercel, localhost), ou não
 * escreve.
 *
 * Requisição SEM `Origin` passa: é servidor falando com servidor (worker,
 * Stripe, Meta, cron), que prova quem é por assinatura, não por origem.
 */

export const ORIGENS_DA_DEMANDOU: ReadonlySet<string> = new Set([
  "https://demandou.com",
  "https://www.demandou.com",
  "https://dev.demandou.com",
]);

function hostDe(origem: string): string | null {
  try {
    return new URL(origem).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Pode escrever? `origin` é o cabeçalho Origin (null quando ausente) e `host`
 * é o host desta requisição (com porta, quando houver).
 */
export function origemPermitida(origin: string | null, host: string | null): boolean {
  if (origin === null || origin === "") return true;
  // "null" é o que o navegador manda de uma página sandbox ou de um arquivo
  // local: não é ninguém que conhecemos.
  if (origin === "null") return false;
  const o = origin.toLowerCase().replace(/\/$/, "");
  if (ORIGENS_DA_DEMANDOU.has(o)) return true;
  const h = hostDe(o);
  if (!h) return false;
  return Boolean(host) && h === host!.toLowerCase();
}

const METODOS_QUE_LEEM: ReadonlySet<string> = new Set(["GET", "HEAD", "OPTIONS"]);

/** Só escrita passa pela lista; leitura o CORS já protege sozinho. */
export function metodoEscreve(metodo: string): boolean {
  return !METODOS_QUE_LEEM.has(metodo.toUpperCase());
}
