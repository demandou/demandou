import { readFileSync } from "node:fs";
import type { GuardadoDoImpulso } from "@/lib/analytics/tipos-do-impulso";

/**
 * A PROVA LOCAL DAS SUGESTÕES DE IMPULSO (09/10/2026), só fora de produção, no
 * mesmo molde de lib/analytics/estatisticas-locais.ts.
 *
 * A tela logada se prova no `next dev` local, que usa o banco compartilhado, e
 * nesse banco nada pode ser gravado. O dev lê o registro de um arquivo JSON
 * apontado por IMPULSOS_LOCAIS, no formato { [projectId]: registro }, que a
 * prova só de leitura monta (scripts/tmp/impulso-amostra-0910.mts --local=...)
 * com `simulado: true`: a tela mostra o selo "simulação" e nunca apresenta
 * aquilo como decisão do JEV.
 *
 * Em produção devolve sempre `undefined` (o NODE_ENV fecha a porta mesmo que
 * alguém crie a variável). `undefined`: o arquivo não fala deste projeto, vale
 * o banco.
 */
export function leituraLocalDeImpulsos(projectId: string): GuardadoDoImpulso | null | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  const arquivo = process.env.IMPULSOS_LOCAIS;
  if (!arquivo) return undefined;
  try {
    const dados = JSON.parse(readFileSync(arquivo, "utf8")) as Record<string, GuardadoDoImpulso | null>;
    if (!dados || !(projectId in dados)) return undefined;
    return dados[projectId];
  } catch {
    return undefined;
  }
}
