/**
 * A REGRA DA RECEITA, sem banco e sem Stripe (08/10/2026).
 *
 * A regra do Bruno de 05/10 ("receita é só dinheiro confirmado") morava
 * dentro do laço de lib/admin/receita-real.ts, que lê o banco e o Stripe, e
 * por isso não tinha teste. Aqui ela fica pura: o painel, a análise caso a
 * caso dos contratos e a prova usam a MESMA conta.
 *
 *  - cobrança do Stripe só entra paga (`paid`) e concluída (`succeeded`), e
 *    pelo líquido de devolução; líquido zero ou negativo não é receita;
 *  - pagamento de contrato registrado por fora (Pix, boleto, transferência)
 *    só entra com o comprovante aceito; sem comprovante fica fora, com motivo;
 *  - conta da equipe nunca gera receita, pague o que pagar (é teste);
 *  - valor de contrato, mensalidade de tabela e plano liberado NÃO passam por
 *    aqui: são projeção, e projeção não vira receita em lugar nenhum.
 */

export type CobrancaDoStripeCrua = {
  paid: boolean;
  status: string;
  amount_captured: number;
  amount_refunded: number;
};

/** O líquido da cobrança, em unidades da moeda (centavos / 100), sem converter. */
export function liquidoDaCobranca(c: CobrancaDoStripeCrua): number {
  return (c.amount_captured - c.amount_refunded) / 100;
}

/** A cobrança do Stripe conta como pagamento confirmado? */
export function cobrancaConfirmada(c: CobrancaDoStripeCrua): boolean {
  return c.paid === true && c.status === "succeeded" && liquidoDaCobranca(c) > 0;
}

/** O pagamento por fora (Pix, boleto, transferência) conta? Só com comprovante. */
export function pagamentoPorForaConfirmado(p: { comprovanteUrl: string | null | undefined }): boolean {
  return typeof p.comprovanteUrl === "string" && p.comprovanteUrl.trim().length > 0;
}

export type MotivoForaDaReceita = "equipe" | "sem_comprovante" | "sem_conta";

/**
 * Onde um pagamento cai: na receita, ou fora dela com o motivo. `null` é
 * "nem entra na conta" (cobrança não concluída ou devolvida inteira).
 */
export function destinoDoPagamento(p: {
  origem: "stripe" | "por_fora";
  contaDaEquipe: boolean;
  cobranca?: CobrancaDoStripeCrua;
  comprovanteUrl?: string | null;
}): { receita: true } | { receita: false; motivo: MotivoForaDaReceita } | null {
  if (p.origem === "stripe") {
    if (!p.cobranca || !cobrancaConfirmada(p.cobranca)) return null;
    if (p.contaDaEquipe) return { receita: false, motivo: "equipe" };
    return { receita: true };
  }
  if (p.contaDaEquipe) return { receita: false, motivo: "equipe" };
  if (!pagamentoPorForaConfirmado({ comprovanteUrl: p.comprovanteUrl })) return { receita: false, motivo: "sem_comprovante" };
  return { receita: true };
}

export const NOME_DO_MOTIVO_FORA: Record<MotivoForaDaReceita, string> = {
  equipe: "conta da equipe",
  sem_comprovante: "por fora, sem comprovante",
  sem_conta: "sem conta ligada",
};
