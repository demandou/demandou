/**
 * O SEGREDO DAS ASSINATURAS INTERNAS (08/10/2026): piloto, fila e a
 * continuação das referências assinam com `PILOTO_SECRET` (próprio, para a
 * esteira ser testável sem ler o segredo do login) e, na falta dele, com o
 * `BETTER_AUTH_SECRET`. O que NÃO existe mais é o terceiro degrau, a palavra
 * "demandou" escrita no código: com ela, um ambiente sem variável assinava
 * com um segredo público, e quem lesse o fonte disparava a fila inteira.
 *
 * Vazio conta como ausente (`PILOTO_SECRET=""` não é chave).
 */
export function segredoDeAssinatura(): string {
  const s = (process.env.PILOTO_SECRET || process.env.BETTER_AUTH_SECRET || "").trim();
  if (!s) throw new Error("[seguranca] PILOTO_SECRET ou BETTER_AUTH_SECRET ausente: não dá para assinar");
  return s;
}
