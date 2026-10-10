import { falaParaAGuarda, numerosSemLastroNaCena, NOME_VALIDO } from "./arquivos";
import { consertarCenas, consertarCodigo, escreverCenas, type ContextoDaCena, type DefeitoDaCena, type KitDoWorker, type PalavraDaCena, type ProblemaDoPortao } from "./escrever-cenas";
import { revisarQuadros, type CenaDoRoteiroResumida, type QuadroParaRevisar } from "./revisao";
import { decidirTecnica } from "./tecnica";
import { usoVazio } from "@/lib/jev/cliente";

/**
 * O QUE O WORKER PEDE AO APP NO EDITOR AVANÇADO (uma chamada por passo, pela
 * `fase`), num lugar só para a rota assinada (/api/editor-avancado/cena) e
 * para a prova local chamarem a MESMA coisa:
 *
 *   tecnica           o JEV escolhe a aula pela fala
 *   escrever          o Claude escreve o roteiro e as cenas
 *   consertar-codigo  o Claude conserta o que os portões recusaram
 *   revisar           o Gemini descreve os quadros e o JEV reprova cenas
 *   consertar         o Claude reescreve só as cenas reprovadas
 *
 * Toda escrita volta com a guarda de número sobre o código já juntado
 * (`numerosSemLastro`): o worker trata como reprovação do portão.
 */
export type PedidoDaCena = {
  fase: "tecnica" | "escrever" | "consertar-codigo" | "revisar" | "consertar";
  kit?: KitDoWorker;
  fala?: PalavraDaCena[];
  duracao?: number;
  nicho?: string | null;
  contexto?: ContextoDaCena & { cores?: unknown };
  arquivos?: Record<string, string>;
  problemas?: ProblemaDoPortao[];
  alvo?: string[];
  defeitos?: DefeitoDaCena[];
  quadros?: QuadroParaRevisar[];
  roteiro?: { cenas: CenaDoRoteiroResumida[] };
  tetoRestanteUsd?: number;
  projectId?: string | null;
  videoJobId?: string | null;
};

export class PedidoInvalido extends Error {}

/** Falhou, mas gastou: o custo da chamada perdida volta junto (a rota responde 502 com ele). */
export class FalhaComCusto extends Error {
  constructor(
    mensagem: string,
    readonly custoUsd: number
  ) {
    super(mensagem);
  }
}

export async function atenderPedidoDaCena(p: PedidoDaCena): Promise<Record<string, unknown> & { custoUsd: number }> {
  let custoUsd = 0;
  const onCusto = (usd: number) => {
    custoUsd += usd;
  };
  const usage = { projectId: p.projectId ?? null, operation: `editor-avancado-${p.fase}` };

  if (p.fase === "tecnica") {
    if (!p.fala?.length) throw new PedidoInvalido("falta a fala do corte");
    const uso = usoVazio();
    const r = await decidirTecnica({ fala: p.fala, duracao: Number(p.duracao) || 0, nicho: p.nicho ?? null, projectId: p.projectId ?? null, uso });
    return { ...r, custoUsd: custoUsd + uso.custoUsd };
  }

  if (p.fase === "revisar") {
    if (!p.quadros?.length) return { reprovadas: [], descritos: [], custoUsd };
    const uso = usoVazio();
    const r = await revisarQuadros({ quadros: p.quadros, cenas: p.roteiro?.cenas ?? [], tecnica: p.contexto?.tecnica, projectId: p.projectId ?? null, onCusto, uso });
    return { ...r, custoUsd: custoUsd + uso.custoUsd };
  }

  if (!p.kit?.api || !p.contexto || !p.fala?.length) throw new PedidoInvalido("faltam o kit, o contexto ou a fala do corte");
  const base = { kit: p.kit, contexto: p.contexto, fala: p.fala, usage, onCusto, tetoRestanteUsd: p.tetoRestanteUsd ?? null };
  let novos: Record<string, string>;
  try {
    if (p.fase === "escrever") {
      novos = await escreverCenas(base);
    } else if (p.fase === "consertar-codigo") {
      if (!p.arquivos || !p.problemas?.length) throw new PedidoInvalido("faltam os arquivos ou os problemas");
      novos = await consertarCodigo({ ...base, arquivos: p.arquivos, problemas: p.problemas });
    } else if (p.fase === "consertar") {
      if (!p.arquivos || !p.alvo?.length || !p.defeitos?.length) throw new PedidoInvalido("faltam os arquivos, o alvo ou os defeitos");
      const alvo = p.alvo.filter((n) => NOME_VALIDO.test(n));
      novos = await consertarCenas({ ...base, arquivos: p.arquivos, alvo, defeitos: p.defeitos });
    } else {
      throw new PedidoInvalido(`fase desconhecida: ${String(p.fase)}`);
    }
  } catch (e) {
    // A chamada que falhou depois de gerar também é cobrada: o custo vai junto com o erro,
    // para o teto do corte no worker contar (a escrita que acabou só pensando custou US$ 0,40).
    if (e instanceof PedidoInvalido) throw e;
    throw new FalhaComCusto(e instanceof Error ? e.message : String(e), custoUsd);
  }
  const juntos = { ...(p.arquivos ?? {}), ...novos };
  return { arquivos: novos, numerosSemLastro: numerosSemLastroNaCena(juntos, falaParaAGuarda(p.fala)), custoUsd };
}
