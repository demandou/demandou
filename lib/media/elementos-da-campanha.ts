import { prisma } from "@/lib/db/prisma";
import { askClaude } from "@/lib/claude";
import { elementoRepetidoPeloJev } from "@/lib/squad/coerencia-da-arte";
import {
  ElementosDaCampanha,
  elementosDoMetadata,
  lerCenaComElemento,
  pedidoDeReescrita,
  registrarElementoDaPeca,
  semDuplicados,
  type CenaComElemento,
  type DecisorDeRepeticao,
  type ElementoUsado,
  type Repeticao,
} from "@/lib/media/elemento-sem-repeticao";

/**
 * Os elementos de cada campanha no servidor (08/10/2026): a instância da
 * guarda (lib/media/elemento-sem-repeticao.ts) de cada execução, semeada com
 * o que o banco já tem (as peças desta execução já gravadas e as das últimas
 * campanhas do projeto, pelo `metadata.elementoDaArte` e
 * `metadata.elementosDasLaminas` dos posts), o JEV como juiz e o redator que
 * reescreve só o campo vetado.
 *
 * Os dias de uma campanha podem rodar em processos diferentes (cada dia da
 * esteira é um trabalho da fila): o que o outro processo já gravou chega pelo
 * banco; o que está sendo escrito ao mesmo tempo, no mesmo processo, pela fila
 * da instância. Só leitura no banco: a gravação é o metadata do post, feita
 * por quem cria o post.
 */

/** Quantas campanhas anteriores do projeto entram na conta. */
export const CAMPANHAS_ANTERIORES = 4;
const VALIDADE_MS = 3 * 60 * 60_000;

const instancias = new Map<string, { em: number; valor: Promise<ElementosDaCampanha> }>();

function rotuloDaCampanha(d: Date): string {
  return `campanha de ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const DIAS = ["", "segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

/** O que o banco já tem de elementos: esta campanha e as últimas do projeto. Nunca lança. */
export async function elementosNoBanco(projectId: string, runId: string): Promise<ElementoUsado[]> {
  try {
    const anteriores = await prisma.pipelineRun.findMany({
      where: { projectId, id: { not: runId } },
      orderBy: { startedAt: "desc" },
      take: CAMPANHAS_ANTERIORES,
      select: { id: true, startedAt: true },
    });
    const quando = new Map(anteriores.map((r) => [r.id, r.startedAt] as const));
    const posts = await prisma.post.findMany({
      where: { projectId, runId: { in: [runId, ...anteriores.map((r) => r.id)] } },
      orderBy: { createdAt: "asc" },
      take: 500,
      select: { runId: true, dayOfWeek: true, metadata: true },
    });
    const usados: ElementoUsado[] = [];
    for (const p of posts) {
      const peca = p.runId === runId ? `esta campanha, ${DIAS[p.dayOfWeek ?? 0] || "outro dia"}` : rotuloDaCampanha(quando.get(p.runId ?? "") ?? new Date());
      usados.push(...elementosDoMetadata(p.metadata, peca));
    }
    return semDuplicados(usados);
  } catch (e) {
    console.warn(`[elementos-da-campanha] ${runId}: o banco não respondeu, a guarda segue só com esta execução:`, e instanceof Error ? e.message : e);
    return [];
  }
}

/** O JEV como juiz da guarda. */
export function decisorPeloJev(projectId: string): DecisorDeRepeticao {
  return async (nova, usados) => {
    const r = await elementoRepetidoPeloJev({ projectId, nova, usados });
    if (r === undefined) return undefined;
    if (r === null) return null;
    return { campo: r.campo, usado: r.indice !== undefined ? usados[r.indice] : undefined };
  };
}

/** A guarda desta execução (uma por run neste processo), semeada com o banco na primeira vez. */
export function elementosDaCampanha(runId: string, projectId: string): Promise<ElementosDaCampanha> {
  const agora = Date.now();
  for (const [k, v] of instancias) if (agora - v.em > VALIDADE_MS) instancias.delete(k);
  const guardada = instancias.get(runId);
  if (guardada) return guardada.valor;
  const valor = elementosNoBanco(projectId, runId).then((iniciais) => new ElementosDaCampanha(iniciais, decisorPeloJev(projectId)));
  instancias.set(runId, { em: agora, valor });
  valor.catch(() => instancias.delete(runId));
  return valor;
}

/** Esquece a guarda de uma execução (a prova e os testes). */
export function esquecerElementosDaCampanha(runId: string): void {
  instancias.delete(runId);
}

/** O redator da reescrita: só o campo vetado muda, sabendo o que já foi usado. */
export const SISTEMA_DA_REESCRITA =
  'You are an advertising art director fixing ONE thing in a photo brief. Another piece of the same campaign already used this central element or this setting, and a campaign cannot show the same object or the same place twice. Change only what you are told to change, keep the rest of the brief (the idea, light, lens, mood, the visual language), and take the new element from what the sentence itself talks about, never from the list of what was already used. At most 45 words. Answer ONLY with JSON: {"cena":"the brief","elemento":"the central element, 2 to 5 English words","cenario":"the setting, 2 to 5 English words"}';

export async function reescreverCena(o: {
  atual: CenaComElemento;
  veto: Repeticao;
  usados: ElementoUsado[];
  /** A frase (ou a manchete) que a cena precisa evocar, em português. */
  frase: string;
  usage?: { projectId?: string; runId?: string };
}): Promise<CenaComElemento> {
  const bruto = await askClaude(
    SISTEMA_DA_REESCRITA,
    `${pedidoDeReescrita(o.atual, o.veto, o.usados)}\nThe Portuguese sentence the scene must evoke (do NOT write it in the scene): "${o.frase}"`,
    { maxTokens: 4000, effort: "low", usage: { operation: "cena_sem_repetir", ...o.usage } }
  );
  const lida = lerCenaComElemento(bruto);
  if (!lida) throw new Error("a reescrita da cena veio vazia");
  return lida;
}

/** A linha do log de uma guarda que agiu, em português, para o cliente. Null quando não houve veto. */
export function avisoDaGuarda(rotulo: string, r: { veto: Repeticao | null; reescrita: boolean; seguiuRepetida: boolean; cena: CenaComElemento }): string | null {
  if (!r.veto) return null;
  const oQue = r.veto.campo === "elemento" ? "o elemento central" : "o cenário";
  if (r.seguiuRepetida) return `${rotulo}: ${oQue} ainda lembra "${r.veto.usado.peca}" depois da reescrita; a arte segue assim, confira antes de aprovar.`;
  return `${rotulo}: ${oQue} repetia "${r.veto.usado.peca}" (${r.veto.usado.elemento || r.veto.usado.cenario}); a cena foi reescrita com ${r.cena.elemento || "outro elemento"}.`;
}

/**
 * UMA CENA JÁ ESCRITA passa pela guarda da campanha: se repete, é reescrita
 * uma vez (só o campo vetado); o resultado é registrado pela frase para o
 * metadata do post. Nunca lança por causa da guarda: sem banco ou sem JEV,
 * a cena volta como veio. `peca` é a chave da peça nesta execução. Com
 * `escrever` no lugar de `cena`, a escrita acontece DENTRO da guarda: a mesma
 * peça pedida duas vezes (uma por proporção) paga uma escrita só, e o redator
 * já recebe o que a campanha usou. Erro de `escrever` sobe, como antes.
 */
export async function cenaGarantida(o: {
  runId: string;
  projectId: string;
  peca: string;
  rotulo: string;
  frase: string;
  cena?: CenaComElemento;
  escrever?: (usados: ElementoUsado[]) => Promise<CenaComElemento>;
  avisos?: string[];
}): Promise<CenaComElemento> {
  const escrever = o.escrever ?? (async () => o.cena!);
  let guarda: ElementosDaCampanha;
  try {
    guarda = await elementosDaCampanha(o.runId, o.projectId);
  } catch (e) {
    console.warn(`[elementos-da-campanha] a guarda de "${o.rotulo}" não abriu; a cena segue sem ela:`, e instanceof Error ? e.message : e);
    const cena = await escrever([]);
    registrarElementoDaPeca(o.frase, cena);
    return cena;
  }
  try {
    const r = await guarda.garantir(
      o.peca,
      escrever,
      (atual, veto, usados) => reescreverCena({ atual, veto, usados, frase: o.frase, usage: { projectId: o.projectId, runId: o.runId } })
    );
    const aviso = avisoDaGuarda(o.rotulo, r);
    if (aviso) o.avisos?.push(aviso);
    registrarElementoDaPeca(o.frase, r.cena);
    return r.cena;
  } catch (e) {
    if (!o.cena) throw e;
    console.warn(`[elementos-da-campanha] a guarda de "${o.rotulo}" falhou; a cena segue como veio:`, e instanceof Error ? e.message : e);
    registrarElementoDaPeca(o.frase, o.cena);
    return o.cena;
  }
}

/** O que a guarda já tem como usado para esta execução (para o redator saber antes de escrever). Nunca lança. */
export async function usadosDaCampanha(runId: string, projectId: string, excluirPeca?: string): Promise<ElementoUsado[]> {
  try {
    return (await elementosDaCampanha(runId, projectId)).usados(excluirPeca);
  } catch {
    return [];
  }
}

/** O roteiro de um carrossel pela guarda, lâmina a lâmina (cada uma é uma peça). */
export async function roteiroGarantido<L extends { frase: string; visual: string; elemento?: string; cenario?: string }>(o: {
  runId: string;
  projectId: string;
  dia: string;
  roteiro: L[];
  avisos?: string[];
}): Promise<L[]> {
  const saida: L[] = [];
  for (let i = 0; i < o.roteiro.length; i++) {
    const l = o.roteiro[i];
    const cena = await cenaGarantida({
      runId: o.runId,
      projectId: o.projectId,
      peca: `${o.dia}, lâmina ${i + 1}`,
      rotulo: `${o.dia}, lâmina ${i + 1}`,
      frase: l.frase,
      cena: { cena: l.visual, elemento: l.elemento ?? "", cenario: l.cenario ?? "" },
      avisos: o.avisos,
    });
    saida.push({ ...l, visual: cena.cena, elemento: cena.elemento, cenario: cena.cenario });
  }
  return saida;
}
