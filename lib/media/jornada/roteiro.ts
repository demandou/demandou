import { lerParaAJornada } from "@/lib/media/jornada/leitura";
import { planejarJornada } from "@/lib/media/jornada/planejar";
import { contextoDoProjeto, jevDaJornada, redatorDaJornada } from "@/lib/media/jornada/servidor";
import type { Palavra, Pedaco } from "@/lib/media/jornada/linha-do-tempo";
import { requisitosDaJornada, type EstadoDaJornada } from "@/lib/media/jornada/estado";
import { CaixaDaEdicao, tetoDaEdicaoUsd } from "@/lib/media/teto-da-edicao";

/**
 * Os passos 3 e 4 da jornada no roteiro (antes do cliente ver a tela): a
 * leitura do vídeo original levada ao tempo editado e o plano por elemento.
 * Devolve o que vai para `roteiro.jornada`.
 */
export async function prepararPlanoDaJornada(p: {
  videoId: string;
  projectId: string;
  url: string;
  palavrasOriginais: Palavra[];
  duracaoOriginal: number;
  manter: Pedaco[];
  fala: { palavras: Palavra[]; duracao: number };
  formato: "9:16" | "16:9";
}): Promise<Pick<EstadoDaJornada, "edicaoId" | "leitura" | "amostras" | "plano" | "avisos" | "custoUsd" | "custoDoPlanoUsd" | "tempos" | "erro">> {
  const faltam = requisitosDaJornada();
  if (faltam.length) throw new Error(`a jornada do editor está ligada mas faltam: ${faltam.join("; ")}`);
  const contexto = await contextoDoProjeto(p.projectId, p.formato, p.fala.duracao);
  // A CAIXA DO TETO (08/10): o que o plano gasta em ideias (Sonnet) e decisões (JEV) já conta no teto de
  // US$ 1 por minuto da edição; a montagem recebe este gasto como ponto de partida (`custoUsd`).
  const caixa = new CaixaDaEdicao(tetoDaEdicaoUsd(p.fala.duracao));
  const feito = await planejarJornada(
    { palavras: p.fala.palavras, contexto },
    {
      ler: () => lerParaAJornada({ url: p.url, palavras: p.palavrasOriginais, duracao: p.duracaoOriginal, manter: p.manter, projectId: p.projectId }),
      redator: redatorDaJornada(p.projectId, "jornada-ideias", caixa),
      jev: jevDaJornada(caixa),
      projectId: p.projectId,
    }
  );
  return {
    edicaoId: feito.plano.edicaoId,
    leitura: feito.leitura,
    amostras: feito.amostras,
    plano: feito.plano,
    avisos: feito.avisos.slice(0, 30),
    // A leitura do vídeo é custo fora da edição (não entra no teto); o plano (ideias e JEV) entra.
    custoUsd: +(feito.custoLeituraUsd + caixa.gasto).toFixed(4),
    custoDoPlanoUsd: caixa.gasto,
    tempos: feito.tempos,
    erro: feito.plano.elementos.length ? null : "o plano saiu sem elemento",
  };
}
