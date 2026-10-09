import { readFileSync } from "node:fs";
import type { GuardadoDaConta } from "@/lib/analytics/tipos-da-conta";

/**
 * A PROVA LOCAL DAS ESTATÍSTICAS DA CONTA (09/10/2026), só fora de produção.
 *
 * A tela logada se prova no `next dev` local, que usa o banco compartilhado, e
 * nesse banco nada pode ser gravado. Para fotografar os estados da tela sem
 * gravar, o dev lê os registros de um arquivo JSON apontado por
 * ESTATISTICAS_LOCAIS, no formato { [projectId]: { [chave]: registro } }:
 *
 *   - leituras de verdade da API, feitas sem gravar (a leitura e o registro
 *     são separados em lerUmaConta e gravarLeitura);
 *   - números de exemplo marcados com `simulado: true`, que a tela mostra com
 *     o selo "simulação" (nunca como número lido).
 *
 * Em produção esta função devolve sempre `undefined` (não há arquivo, não há
 * variável, e o NODE_ENV fecha a porta mesmo que alguém a crie).
 *
 * `undefined`: o arquivo não fala desta conta, vale o banco. `null`: o arquivo
 * diz que a conta não tem registro.
 */
export function leituraLocalDeEstatisticas(projectId: string, chave: string): GuardadoDaConta | null | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  const arquivo = process.env.ESTATISTICAS_LOCAIS;
  if (!arquivo) return undefined;
  try {
    const dados = JSON.parse(readFileSync(arquivo, "utf8")) as Record<string, Record<string, GuardadoDaConta | null>>;
    const doProjeto = dados?.[projectId];
    if (!doProjeto || !(chave in doProjeto)) return undefined;
    return doProjeto[chave];
  } catch {
    return undefined;
  }
}
