/**
 * O TETO DE IA DE UM CORTE no editor avançado: max(US$ 2, US$ 1 por minuto)
 * (decisão do Bruno, o mesmo tetoDoPlanoUsd do editor do curso, que o app
 * manda em `tetoUsd`). Antes de cada chamada paga, o worker confere se o
 * gasto até aqui MAIS a estimativa da próxima cabe no teto: a escrita que não
 * cabe derruba o corte (vale a reserva), o conserto que não cabe é pulado
 * (vale a versão que passou nos portões).
 *
 * Estimativas medidas no Sonnet 5 (US$ 2 / US$ 10 por milhão), por fase, já
 * com folga; a revisão é o Gemini descrevendo e o JEV decidindo.
 */
export const ESTIMATIVA_USD = { tecnica: 0.001, escrever: 0.6, "consertar-codigo": 0.3, revisar: 0.03, consertar: 0.35 };

export function cabeNoTeto(gasto, teto, fase) {
  const t = Number(teto) > 0 ? Number(teto) : 2;
  return Number(gasto) + (ESTIMATIVA_USD[fase] ?? 0.3) <= t + 1e-9;
}

/** O teto que vale para um corte de `duracao` segundos quando o pedido não diz (o mesmo número do app). */
export function tetoPadraoUsd(duracao) {
  return +Math.max(2, (Number(duracao) / 60) * 1).toFixed(2);
}
