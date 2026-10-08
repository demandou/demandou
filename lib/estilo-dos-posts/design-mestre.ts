import { prisma } from "@/lib/db/prisma";
import { lerDesign, registrarPedidoDeDesign, designsDoProjeto, linguagemDoDesignAtual } from "@/lib/biblioteca-de-design/registro";
import type { DesignDaGaleria } from "@/lib/biblioteca-de-design/tipos";
import { normalizarComando } from "@/lib/media/editor-por-comando/comando";
import { estiloIdDoComando } from "@/lib/media/estilo-do-comando";
import {
  designMestreEmDia,
  designMestreValido,
  estiloMestreDe,
  linguagemDoEstiloDeVideo,
  type DesignMestreGuardado,
  type EstiloMestre,
  type FonteDoMestre,
  type ModoDosPosts,
} from "@/lib/estilo-dos-posts/estilo-mestre";
import type { EstadoDoMestre } from "@/lib/estilo-dos-posts/tipos";

/**
 * O DESIGN MESTRE NO BANCO (08/10/2026). Ver lib/estilo-dos-posts/estilo-mestre.ts.
 *
 * Sem coluna nova: o design mestre gravado mora em ProjectMemory (tipo
 * "estilo", chave "design-mestre"), ao lado da identidade e do último modelo
 * de cada post; o padrão dos posts do projeto (o mestre ou o estilo próprio
 * escolhido em Configurações), na chave "padrao-dos-posts".
 *
 * SEM CUSTO ESCONDIDO: `garantirDesignMestre` só chama a biblioteca (o JEV e
 * o redator) quando a assinatura do estilo do vídeo mudou desde o último
 * design mestre. Enquanto ela bate, devolve o gravado, sem IA, para quantos
 * posts forem. Duas peças do mesmo projeto pedindo ao mesmo tempo esperam a
 * mesma derivação (uma só promessa por projeto e assinatura neste processo).
 *
 * A regra da biblioteca vale igual: o pedido passa pelo mesmo fluxo de quem
 * cria um estilo escrevendo, então só o visual vai para a biblioteca de todos,
 * nunca a marca, o nome, o contato ou a foto de ninguém.
 */

const TIPO = "estilo";
const CHAVE_DO_DESIGN = "design-mestre";
const CHAVE_DO_PADRAO = "padrao-dos-posts";

/** O que o fluxo precisa do banco e da biblioteca, atrás de uma interface (a prova troca por memória). */
export interface DepositoDoMestre {
  /** O estilo do vídeo do projeto, o dono e o nicho (para o pedido à biblioteca). */
  fonte(projectId: string): Promise<(FonteDoMestre & { donoId: string; nicho: string | null; publico: string | null }) | null>;
  lerGuardado(projectId: string): Promise<DesignMestreGuardado | null>;
  gravar(projectId: string, g: DesignMestreGuardado): Promise<void>;
  /** O design, se o projeto ainda o enxerga (ligado a ele, ou público). */
  lerDesign(projectId: string, designId: string): Promise<DesignDaGaleria | null>;
  registrar: typeof registrarPedidoDeDesign;
}

const depositoNoBanco: DepositoDoMestre = {
  async fonte(projectId) {
    const p = await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true, niche: true, targetAudience: true, videoEstiloEscolha: true, videoStyle: true, config: true } });
    if (!p) return null;
    // O comando só manda com o editor por comando ligado (EDITOR_POR_COMANDO=1, a regra de
    // editorPorComandoLigado, lida aqui para não carregar o editor inteiro): a mesma do resumo da edição.
    const comando = process.env.EDITOR_POR_COMANDO === "1" ? normalizarComando((p.config as { comandoDoVideo?: unknown } | null)?.comandoDoVideo ?? null) : null;
    return { comando, escolha: p.videoEstiloEscolha, videoStyle: p.videoStyle, donoId: p.userId, nicho: p.niche, publico: p.targetAudience };
  },
  async lerGuardado(projectId) {
    const m = await prisma.projectMemory.findUnique({ where: { projectId_type_key: { projectId, type: TIPO, key: CHAVE_DO_DESIGN } }, select: { value: true } }).catch(() => null);
    return designMestreValido(m?.value);
  },
  async gravar(projectId, g) {
    await prisma.projectMemory.upsert({
      where: { projectId_type_key: { projectId, type: TIPO, key: CHAVE_DO_DESIGN } },
      create: { projectId, type: TIPO, key: CHAVE_DO_DESIGN, value: g as never },
      update: { value: g as never },
    });
  },
  async lerDesign(projectId, designId) {
    const visivel = await lerDesign(designId, { projectId }).catch(() => null);
    if (visivel) return visivel;
    // Ligado ao projeto, ele vale mesmo se saiu da galeria.
    return (await designsDoProjeto(projectId).catch(() => [])).find((d) => d.id === designId) ?? null;
  },
  registrar: registrarPedidoDeDesign,
};

export type DesignMestrePronto = { mestre: EstiloMestre; design: DesignDaGaleria | null; refeito: boolean; erro?: string };

/** O design mestre em dia, mas ilegível, só é refeito depois desta janela (nunca a cada arte). */
export const JANELA_PARA_REFAZER_MS = 10 * 60_000;

/** Pode refazer o design mestre que está em dia mas não foi lido? Só quando ele tem mais que a janela. Puro. */
export function designMestreParaRefazer(g: Pick<DesignMestreGuardado, "feitoEm">, agoraMs: number): boolean {
  const feito = Date.parse(g.feitoEm);
  return !Number.isFinite(feito) || agoraMs - feito > JANELA_PARA_REFAZER_MS;
}

/** Uma derivação por projeto e assinatura neste processo: duas artes juntas pagam uma vez. */
const EM_ANDAMENTO = new Map<string, Promise<DesignMestrePronto>>();

/**
 * O DESIGN MESTRE DO PROJETO, feito agora só se o estilo do vídeo mudou desde
 * o último. `userId`: quem pediu (o dono ou o membro da equipe); sem ele, o
 * dono do projeto. Nunca lança: sem design (biblioteca fora, pedido curto),
 * devolve `design: null` e a arte segue a linguagem do vídeo pela direção de
 * arte de sempre.
 */
export async function garantirDesignMestre(projectId: string, o: { userId?: string | null; deposito?: DepositoDoMestre } = {}): Promise<DesignMestrePronto> {
  const deposito = o.deposito ?? depositoNoBanco;
  const fonte = await deposito.fonte(projectId);
  const mestre = estiloMestreDe(fonte ?? {});
  if (!fonte) return { mestre, design: null, refeito: false, erro: "projeto não encontrado" };
  const guardado = await deposito.lerGuardado(projectId);
  if (guardado && designMestreEmDia(guardado, mestre)) {
    const design = await deposito.lerDesign(projectId, guardado.designId);
    if (design) return { mestre, design, refeito: false };
    // Em dia, mas ilegível agora (o banco piscou, ou o design foi apagado): sem IA de novo enquanto ele é recente.
    // Uma falha de leitura nunca vira uma derivação paga por arte; o apagado de verdade volta depois da janela.
    if (!designMestreParaRefazer(guardado, Date.now())) return { mestre, design: null, refeito: false, erro: "design mestre ilegível agora" };
  }
  const chave = `${projectId}|${mestre.assinatura}`;
  const andando = EM_ANDAMENTO.get(chave);
  if (andando) return andando;
  const feito = (async (): Promise<DesignMestrePronto> => {
    try {
      const r = await deposito.registrar({ projectId, userId: o.userId || fonte.donoId, tipo: "imagem", pedido: mestre.pedido, nicho: fonte.nicho, publico: fonte.publico, comoEntrou: "mestre" });
      if (!r) return { mestre, design: null, refeito: false, erro: "pedido curto demais" };
      await deposito.gravar(projectId, { designId: r.design.id, nome: r.design.nome, descricao: r.design.descricao, assinatura: mestre.assinatura, estiloId: mestre.estiloId, feitoEm: new Date().toISOString() });
      return { mestre, design: r.design, refeito: true };
    } catch (e) {
      console.warn("[design-mestre] o design mestre não saiu (a arte segue a linguagem do vídeo):", e instanceof Error ? e.message.slice(0, 160) : e);
      return { mestre, design: null, refeito: false, erro: e instanceof Error ? e.message.slice(0, 160) : "falhou" };
    } finally {
      EM_ANDAMENTO.delete(chave);
    }
  })();
  EM_ANDAMENTO.set(chave, feito);
  return feito;
}

/** O estado do mestre para a tela, SEM derivar nada (nenhuma IA numa leitura). */
export async function estadoDoMestre(projectId: string, deposito: DepositoDoMestre = depositoNoBanco): Promise<EstadoDoMestre | null> {
  const fonte = await deposito.fonte(projectId).catch(() => null);
  if (!fonte) return null;
  const mestre = estiloMestreDe(fonte);
  const guardado = await deposito.lerGuardado(projectId).catch(() => null);
  const emDia = designMestreEmDia(guardado, mestre);
  const design = guardado && emDia ? await deposito.lerDesign(projectId, guardado.designId).catch(() => null) : null;
  return {
    nome: mestre.nome,
    referencia: mestre.referencia,
    estiloId: mestre.estiloId,
    design: design ? { id: design.id, nome: design.nome, descricao: design.descricao, previaUrl: design.previaUrl } : null,
    emDia: Boolean(design) && emDia,
  };
}

// ─────────────────────────── o padrão dos posts do projeto ───────────────────────────

/** O padrão dos posts do projeto: o estilo mestre, a não ser que o dono tenha escolhido um estilo próprio em Configurações. */
export async function lerModoDosPosts(projectId: string): Promise<ModoDosPosts> {
  const m = await prisma.projectMemory.findUnique({ where: { projectId_type_key: { projectId, type: TIPO, key: CHAVE_DO_PADRAO } }, select: { value: true } }).catch(() => null);
  return (m?.value as { modo?: unknown } | null)?.modo === "por-post" ? "por-post" : "mestre";
}

export async function salvarModoDosPosts(projectId: string, modo: ModoDosPosts): Promise<void> {
  const value = { modo, em: new Date().toISOString() };
  await prisma.projectMemory.upsert({
    where: { projectId_type_key: { projectId, type: TIPO, key: CHAVE_DO_PADRAO } },
    create: { projectId, type: TIPO, key: CHAVE_DO_PADRAO, value: value as never },
    update: { value: value as never },
  });
}

// ─────────────────────────── o vídeo por IA ───────────────────────────

/**
 * A LINGUAGEM VISUAL DO VÍDEO POR IA DE UM DIA (08/10), pela escolha dele:
 *   - mestre: a do estilo do vídeo do projeto (o design de vídeo que o
 *     comando escrito gerou na biblioteca, quando é desse comando; senão o
 *     bloco do estilo do catálogo que o comando ou a escolha apontam);
 *   - estilo da biblioteca (`estiloId`): o bloco daquele estilo do catálogo;
 *   - criado a partir de uma ideia (`designId`): a linguagem do design de
 *     vídeo que o cliente criou.
 * Null quando não há o que dizer: vale a direção de arte de sempre. Nunca lança.
 */
export async function linguagemDoVideoPorIA(projectId: string, escolha: { mestre?: boolean; estiloId?: string | null; designId?: string | null } | null | undefined): Promise<string | null> {
  if (!escolha) return null;
  try {
    if (escolha.mestre) {
      const fonte = await depositoNoBanco.fonte(projectId);
      if (!fonte) return null;
      const comando = fonte.comando as { texto: string; referencia?: string | null; atualizadoEm?: string } | null | undefined;
      if (comando?.texto) {
        const gravado = await linguagemDoDesignAtual(projectId, "video", comando.atualizadoEm ?? null);
        if (gravado?.linguagem) return gravado.linguagem;
        const doCatalogo = linguagemDoEstiloDeVideo(estiloIdDoComando(comando));
        if (doCatalogo) return doCatalogo;
        return null;
      }
      return linguagemDoEstiloDeVideo(estiloMestreDe(fonte).estiloId);
    }
    if (escolha.estiloId) return linguagemDoEstiloDeVideo(escolha.estiloId);
    if (escolha.designId) {
      const d = await depositoNoBanco.lerDesign(projectId, escolha.designId);
      return d && d.tipo === "video" && d.linguagem?.trim() ? d.linguagem : null;
    }
  } catch (e) {
    console.warn("[design-mestre] a linguagem do vídeo por IA não foi lida (vale a direção de sempre):", e instanceof Error ? e.message.slice(0, 120) : e);
  }
  return null;
}
