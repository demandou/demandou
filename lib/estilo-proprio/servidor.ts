import { prisma } from "@/lib/db/prisma";
import { creditar, debitar } from "@/lib/credits";
import { coresDaMarca } from "@/lib/media/capa-composta";
import { lerComandoDoProjeto, paletaDoProjeto, salvarComandoDoProjeto } from "@/lib/media/editor-por-comando";
import { normalizarEscolha } from "@/lib/media/catalogo-de-estilos";
import { lerIdentidadeVisual } from "@/lib/modelos-de-arte/identidade-aprovada";
import { LETRAS } from "@/lib/modelos-de-arte/identidade";
import { lerRelatorio } from "@/lib/referencias/perfil-proprio";
import { registrarPedidoDeDesign } from "@/lib/biblioteca-de-design/registro";
import { fixarDesignMestre, salvarModoDosPosts } from "@/lib/estilo-dos-posts/design-mestre";
import { escreverEstilo, type ContextoDoEstilo } from "@/lib/estilo-proprio/redator";
import { gerarPreviasDoEstilo, type ServicosDasPrevias } from "@/lib/estilo-proprio/previas";
import {
  acertoDaRodada,
  comRodadaNova,
  comRodadaTrocada,
  CREDITOS_RESERVADOS_DA_RODADA,
  ESTADO_VAZIO,
  estadoValido,
  falasDaRodada,
  falaServe,
  fonteDoEstilo,
  pedidoDasFalas,
  pedidoDoDesignDasArtes,
  pedidoDoDesignDeVideo,
  rodadaDe,
  rodadaParaTela,
  textoDoComando,
  type EstadoDoMeuEstilo,
  type PecaDaPrevia,
  type RodadaDoMeuEstilo,
} from "@/lib/estilo-proprio/tipos";

/**
 * O MEU ESTILO NO BANCO (08/10/2026). Ver lib/estilo-proprio/tipos.ts.
 *
 * Sem coluna nova: o histórico das rodadas e o estilo confirmado moram em
 * ProjectMemory (tipo "estilo", chave "meu-estilo"), ao lado do design mestre
 * e do padrão dos posts.
 *
 * ONDE O ESTILO CONFIRMADO FICA GRAVADO (é o que a esteira já lê):
 *   1. projects.config.comandoDoVideo (salvarComandoDoProjeto): o comando do
 *      vídeo, com a letra da marca e as cores da marca. É o que o editor por
 *      comando lê para cada corte e para o completo, e o que estiloMestreDe
 *      usa como ESTILO MESTRE do projeto;
 *   2. a biblioteca de design: um design de VÍDEO (comoEntrou "pedido"), cuja
 *      linguagem o plano pelo JEV lê (linguagemDoDesignAtual) e o vídeo por
 *      IA usa (linguagemDoVideoPorIA), e um design de IMAGEM ligado como
 *      "mestre", com o pedido das artes e do carrossel;
 *   3. ProjectMemory estilo/design-mestre (fixarDesignMestre): o design de
 *      imagem acima vira o design mestre, em dia com a assinatura do comando;
 *      garantirDesignMestre (a arte, a esteira) o devolve sem IA;
 *   4. ProjectMemory estilo/padrao-dos-posts = "mestre": todas as peças
 *      seguem o estilo mestre;
 *   5. videoEstiloEscolha.texto: o resumo, para o estilo valer também onde o
 *      editor por comando está desligado;
 *   6. a memória do cliente: uma preferência duradoura (ProjectMemory
 *      "preference", lida pelo cérebro e pelos agentes).
 *
 * O DINHEIRO: as prévias reservam CREDITOS_RESERVADOS_DA_RODADA antes de
 * gerar (o teto da rodada pela régua) e acertam pelo custo real no fim: o que
 * sobrou volta. Escrever o estilo (o redator) e confirmar não cobram crédito.
 */

const TIPO = "estilo";
const CHAVE = "meu-estilo";
export const OPERACAO_DAS_PREVIAS = "meu_estilo_previas";
export const OPERACAO_DA_DEVOLUCAO = "meu_estilo_previas_devolucao";

export interface DepositoDoMeuEstilo {
  ler(projectId: string): Promise<EstadoDoMeuEstilo>;
  gravar(projectId: string, e: EstadoDoMeuEstilo): Promise<void>;
  contexto(projectId: string): Promise<ContextoDoEstilo & { fonteAtual: string | null; nome: string | null; cores: { acento: string; escuro: string; claro: string } }>;
}

const depositoNoBanco: DepositoDoMeuEstilo = {
  async ler(projectId) {
    const m = await prisma.projectMemory.findUnique({ where: { projectId_type_key: { projectId, type: TIPO, key: CHAVE } }, select: { value: true } }).catch(() => null);
    return estadoValido(m?.value);
  },
  async gravar(projectId, e) {
    await prisma.projectMemory.upsert({
      where: { projectId_type_key: { projectId, type: TIPO, key: CHAVE } },
      create: { projectId, type: TIPO, key: CHAVE, value: e as never },
      update: { value: e as never },
    });
  },
  async contexto(projectId) {
    const [p, identidade, relatorio, comando] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId }, select: { name: true, niche: true, targetAudience: true, colorPalette: true } }),
      lerIdentidadeVisual(projectId).catch(() => null),
      lerRelatorio(projectId).catch(() => null),
      lerComandoDoProjeto(projectId).catch(() => null),
    ]);
    const paleta = paletaDoProjeto(p?.colorPalette);
    const cores = coresDaMarca(p?.colorPalette);
    const q = relatorio?.quemE ?? null;
    const v = relatorio?.visual ?? null;
    return {
      projectId,
      nome: p?.name ?? null,
      nicho: p?.niche ?? null,
      publico: p?.targetAudience ?? null,
      marca: p?.name ?? null,
      paleta: paleta.length ? paleta : [cores.acento, cores.escuro, cores.claro],
      cores,
      letra: identidade?.aprovadaEm && identidade.letra ? LETRAS[identidade.letra]?.nome ?? null : null,
      perfil: q || v ? { pessoa: q?.pessoa ?? null, produto: q?.produto ?? null, linguagem: q?.linguagem ?? null, estiloVisual: v?.estilo ?? null, cores: v?.cores ?? null } : null,
      fonteAtual: comando?.fonte ?? null,
    };
  },
};

export type Servicos = { deposito: DepositoDoMeuEstilo; escrever: typeof escreverEstilo; previas?: ServicosDasPrevias };

const SERVICOS_DE_VERDADE: Servicos = { deposito: depositoNoBanco, escrever: escreverEstilo };

/** O estado para a tela: as rodadas sem o custo em dólar, mais o contexto que a caixa mostra. */
export async function estadoDoMeuEstilo(projectId: string, s: Servicos = SERVICOS_DE_VERDADE) {
  const [estado, ctx] = await Promise.all([s.deposito.ler(projectId), s.deposito.contexto(projectId)]);
  return {
    rodadas: estado.rodadas.map(rodadaParaTela),
    confirmado: estado.confirmado,
    nicho: ctx.nicho ?? null,
    cores: ctx.cores,
    comPerfil: Boolean(ctx.perfil),
    creditosDasPrevias: CREDITOS_RESERVADOS_DA_RODADA,
  };
}

/**
 * ESCREVER: a fala do cliente vira uma rodada nova (o Claude escreve o
 * estilo, nenhuma prévia ainda). `ajuste` continua a conversa da última
 * rodada; sem ele, começa de novo (o histórico fica).
 */
export async function escreverRodada(
  o: { projectId: string; fala: string; ajuste: boolean; origem: "escrito" | "voz" },
  s: Servicos = SERVICOS_DE_VERDADE
): Promise<{ ok: true; rodada: RodadaDoMeuEstilo } | { ok: false; erro: string }> {
  if (!falaServe(o.fala, o.ajuste)) return { ok: false, erro: o.ajuste ? "Diga o que quer mudar, nem que seja uma palavra." : "Conte com pelo menos uma frase como você é e como quer as suas peças." };
  const estado = await s.deposito.ler(o.projectId);
  const anterior = o.ajuste ? rodadaDe(estado) : null;
  const falas = falasDaRodada(anterior?.falas, o.fala, o.ajuste && Boolean(anterior));
  const ctx = await s.deposito.contexto(o.projectId);
  const { estilo, origem: escritoPor, comPerfil } = await s.escrever(pedidoDasFalas(falas), ctx);
  const fonte = fonteDoEstilo({ letraDaMarca: letraId(ctx.letra), fonteAtual: ctx.fonteAtual });
  const { estado: novo, rodada } = comRodadaNova(estado, { falas, origem: o.origem, estilo, escritoPor, comPerfil, fonte, previas: null, em: new Date().toISOString() });
  await s.deposito.gravar(o.projectId, novo);
  return { ok: true, rodada };
}

/** O id da letra pelo nome que o contexto carrega ("Clássica" -> "classica"). */
function letraId(nome: string | null | undefined): string | null {
  if (!nome) return null;
  const achada = Object.values(LETRAS).find((l) => l.nome === nome);
  return achada?.id ?? null;
}

/**
 * AS PRÉVIAS DE UMA RODADA: reserva os créditos, gera e confere, acerta pelo
 * custo real. Lança SaldoInsuficiente antes de gastar. Uma rodada que já tem
 * prévias não gera de novo (devolve as que tem).
 */
export async function gerarPreviasDaRodada(
  o: { projectId: string; userId: string; rodada?: number | null; pecas?: PecaDaPrevia[] | null },
  s: Servicos = SERVICOS_DE_VERDADE,
  dinheiro: { debitar: typeof debitar; creditar: typeof creditar } = { debitar, creditar }
): Promise<{ ok: true; rodada: RodadaDoMeuEstilo; avisos: string[] } | { ok: false; erro: string }> {
  const estado = await s.deposito.ler(o.projectId);
  const rodada = rodadaDe(estado, o.rodada);
  if (!rodada) return { ok: false, erro: "Escreva o seu estilo primeiro." };
  if (rodada.previas?.length) return { ok: true, rodada, avisos: [] };
  const refId = `${o.projectId}:${rodada.n}`;
  await dinheiro.debitar({ userId: o.userId, quantidade: CREDITOS_RESERVADOS_DA_RODADA, operation: OPERACAO_DAS_PREVIAS, projectId: o.projectId, refId, note: `Prévias do meu estilo, rodada ${rodada.n} (reserva; o que sobrar volta)` });
  let r: Awaited<ReturnType<typeof gerarPreviasDoEstilo>>;
  try {
    r = await gerarPreviasDoEstilo({ projectId: o.projectId, rodada: rodada.n, estilo: rodada.estilo, pecas: o.pecas?.length ? o.pecas : undefined }, s.previas);
  } catch (e) {
    await dinheiro.creditar({ userId: o.userId, quantidade: CREDITOS_RESERVADOS_DA_RODADA, operation: OPERACAO_DA_DEVOLUCAO, projectId: o.projectId, refId, unico: true, note: "Nenhuma prévia saiu: a reserva voltou inteira" }).catch(() => undefined);
    return { ok: false, erro: `Não consegui gerar as prévias agora (${e instanceof Error ? e.message.slice(0, 120) : String(e)}). Nada foi cobrado.` };
  }
  const acerto = acertoDaRodada(CREDITOS_RESERVADOS_DA_RODADA, r.custoUsd, r.geradas);
  if (acerto.devolver > 0) {
    await dinheiro.creditar({ userId: o.userId, quantidade: acerto.devolver, operation: OPERACAO_DA_DEVOLUCAO, projectId: o.projectId, refId, unico: true, note: `Prévias do meu estilo, rodada ${rodada.n}: ${acerto.cobrado} crédito(s) usados, o resto voltou` }).catch((e) => console.warn("[meu-estilo] a devolução não saiu:", e instanceof Error ? e.message : e));
  }
  const pronta: RodadaDoMeuEstilo = { ...rodada, previas: r.previas, previasTiradas: r.tiradas, previasEm: new Date().toISOString(), custoUsd: r.custoUsd, creditos: acerto.cobrado };
  await s.deposito.gravar(o.projectId, comRodadaTrocada(await s.deposito.ler(o.projectId), pronta));
  return { ok: true, rodada: pronta, avisos: r.avisos };
}

/**
 * "É ISSO": o estilo da rodada vira o estilo do projeto, nos lugares que a
 * esteira já lê (ver o cabeçalho). Nunca cobra crédito. Devolve o que gravou,
 * para a rota registrar a memória depois da resposta.
 */
export async function confirmarRodada(
  o: { projectId: string; userId: string; rodada?: number | null },
  s: Servicos = SERVICOS_DE_VERDADE
): Promise<{ ok: true; confirmado: EstadoDoMeuEstilo["confirmado"]; preferenciaKey: string } | { ok: false; erro: string }> {
  const estado = await s.deposito.ler(o.projectId);
  const rodada = rodadaDe(estado, o.rodada);
  if (!rodada) return { ok: false, erro: "Escreva o seu estilo primeiro." };
  const e = rodada.estilo;
  const texto = textoDoComando(e);
  // 1. O comando do vídeo (o estilo mestre), nas cores da marca, na letra da marca.
  await salvarComandoDoProjeto(o.projectId, { texto, fonte: rodada.fonte, cores: { tipo: "marca" }, origem: rodada.origem === "voz" ? "voz" : "escrito", referencia: null });
  // 5. O resumo também na escolha antiga, para valer onde o editor por comando está desligado.
  const p = await prisma.project.findUnique({ where: { id: o.projectId }, select: { videoEstiloEscolha: true, videoStyle: true, niche: true, targetAudience: true } });
  if (p) {
    const atual = normalizarEscolha(p.videoEstiloEscolha, p.videoStyle);
    await prisma.project.update({ where: { id: o.projectId }, data: { videoEstiloEscolha: { ...atual, texto: e.resumo.slice(0, 600) } as never } });
  }
  // 2. A biblioteca: o design de vídeo (a linguagem do editor e do vídeo por IA) e o design das artes.
  let designDeVideoId: string | null = null;
  let designDasArtesId: string | null = null;
  try {
    const dv = await registrarPedidoDeDesign({ projectId: o.projectId, userId: o.userId, tipo: "video", pedido: pedidoDoDesignDeVideo(e), nicho: p?.niche, publico: p?.targetAudience, comoEntrou: "pedido" });
    designDeVideoId = dv?.design.id ?? null;
  } catch (err) {
    console.warn("[meu-estilo] o design de vídeo não entrou na biblioteca (o comando ficou gravado):", err instanceof Error ? err.message.slice(0, 160) : err);
  }
  try {
    const da = await registrarPedidoDeDesign({ projectId: o.projectId, userId: o.userId, tipo: "imagem", pedido: pedidoDoDesignDasArtes(e), nicho: p?.niche, publico: p?.targetAudience, comoEntrou: "mestre" });
    if (da) {
      designDasArtesId = da.design.id;
      // 3. O design das artes é o design mestre, em dia com o comando de agora.
      await fixarDesignMestre(o.projectId, da.design);
    }
  } catch (err) {
    console.warn("[meu-estilo] o design das artes não entrou na biblioteca (a arte deriva do comando na primeira peça):", err instanceof Error ? err.message.slice(0, 160) : err);
  }
  // 4. Todas as peças seguem o estilo mestre.
  await salvarModoDosPosts(o.projectId, "mestre");
  // 6. A memória do cliente: a preferência que os agentes leem.
  const preferenciaKey = `meu-estilo-${rodada.n}-${Date.now()}`;
  const instrucao = `Confirmou o seu estilo visual: ${e.resumo}${e.evitar.length ? ` Nunca usar: ${e.evitar.join(", ")}.` : ""}`.slice(0, 900);
  await prisma.projectMemory
    .create({ data: { projectId: o.projectId, type: "preference", key: preferenciaKey, value: { instruction: instrucao, cardType: "estilo", rodada: rodada.n }, metadata: { learnedAt: new Date().toISOString() } } })
    .catch((err) => console.warn("[meu-estilo] a memória não foi gravada:", err instanceof Error ? err.message : err));
  const confirmado = { rodada: rodada.n, em: new Date().toISOString(), resumo: e.resumo, pontos: e.pontos, falas: rodada.falas, designDeVideoId, designDasArtesId };
  await s.deposito.gravar(o.projectId, { ...(await s.deposito.ler(o.projectId)), confirmado });
  return { ok: true, confirmado, preferenciaKey };
}

export { ESTADO_VAZIO };
