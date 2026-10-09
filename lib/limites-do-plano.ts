import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { PLANOS_PUBLICOS, planoPublico, referenciasDoPlano, type LimiteDeReferencias, type PlanoId } from "@/lib/planos";
import {
  CAMPANHAS_NO_TESTE,
  DIAS_DE_CAMPANHA_NO_TESTE,
  SEGUNDOS_DE_VIDEO_NO_TESTE,
  VIDEOS_NO_TESTE,
  SEM_TESTE,
  type LimiteDoTeste,
} from "@/lib/teste-gratis";
import { LIMITES_SEM_PLANO, duracaoMaximaDaGravacaoMin, duracaoMaximaDoEnvioSeg, duracaoPorExtenso, fraseDoVideoLongoDoMembro, type LimitesDoEnvio, type PapelDoEnvio } from "@/lib/media/limits";
import { minutosDaConta, minutosPorMesDoPlano } from "@/lib/entregas-do-plano";
import { OPERACAO_DA_COMPRA as OPERACAO_DA_COMPRA_DE_CREDITOS } from "@/lib/credits/pacotes-de-credito-servidor";
import { fraseDaCotaDeGravacoes } from "@/lib/frase-da-cota";
import { apagarMidias } from "@/lib/media/faxina";
import { cicloAtual } from "@/lib/ciclo-de-credito";
import { contaPagante, consumoDoMembro, contasLigadasA, membroAtivo, nomeDoDono, regraDaConta, type MembroDaConta } from "@/lib/equipe/conta";
import {
  PROJETOS_POR_PESSOA_DO_CONTRATO,
  fraseDaCotaDaEquipe,
  fraseDaCotaDoContrato,
  fraseDoProjetoDoContrato,
  fraseDoTetoDeGravacoes,
  gravacoesDoCiclo as gravacoesComExtras,
  marcasDaConta,
  nomeDaCarteiraDoContrato,
  planoQueValeNaConta,
} from "@/lib/equipe/regras";
import { diaEMes } from "@/lib/frase-da-cota";
import type { PartesDaGravacao } from "@/lib/media/partes-da-gravacao";

/**
 * Os limites do plano, aplicados de verdade.
 *
 * ## Por que este modulo nasceu em 18/09/2026
 *
 * `gravacoesPorMes` e `marcas` existiam em `lib/planos.ts` desde 02/09, eram
 * copiados para `PLANS` em `lib/stripe/index.ts` e **morriam ali**: nenhum outro
 * arquivo lia. A criacao de projeto nao contava marcas, o upload de video nao
 * contava gravacoes. O proprio codigo confessava, no comentario de PLANS: "nao
 * e um limite aplicado por codigo". Eram vitrine.
 *
 * Vender "4 gravacoes por mes" e entregar infinitas nao e generosidade: e a
 * unidade de venda perdendo o sentido. Se o Essencial de R$ 397 entrega o mesmo
 * que o Estudio de R$ 1.997, o cartao do meio nao argumenta nada, e ninguem
 * sobe de plano por um numero que nao existe.
 *
 * ## Por que aqui e nao em lib/planos.ts
 *
 * `lib/planos.ts` e importado por componentes de CLIENTE (a landing, /planos, a
 * aba de cobranca). Trazer o prisma para la arrastaria o cliente do banco para
 * o bundle do navegador, que e a armadilha ja paga com o SDK do Stripe.
 *
 * ## "free" nao tem cota, e isso e deliberado
 *
 * "free" e ausencia de plano, nao plano gratuito: `creditsBalance` nasce em 0 e
 * o portao de entrada (lib/onboarding/portao.ts) manda essa pessoa para /planos
 * antes de ela ver o app. As ROTAS DE API, porem, nao passam pelo layout que
 * aplica o portao, entao a conferencia precisa existir aqui tambem.
 *
 * ## O ciclo e o do CREDITO, nao o do calendario
 *
 * "Por mes" quer dizer "por ciclo de cobranca", e quem marca o ciclo e
 * `creditsResetAt`, reposto pelo webhook do Stripe a cada renovacao. Usar o mes
 * do calendario daria a quem assina dia 28 um ciclo de tres dias, e o cliente
 * estaria certo em reclamar.
 */

export type Cota = { marcas: number; gravacoesPorMes: number; armazenamentoGb: number };

export type Estouro = {
  /**
   * "minutos" (08/10): os minutos de vídeo editado do mês, o mesmo número do
   * cartão do plano. "duracao" (08/10): a duração de UMA gravação passou do
   * que o papel permite (5 min para membro e conta ligada ao contrato; a do
   * plano para o titular).
   */
  recurso: "marcas" | "gravacoes" | "armazenamento" | "minutos" | "duracao";
  usado: number;
  limite: number;
  /** O nome que o cliente ve do plano ATUAL. Null quando nao ha plano. */
  plano: string | null;
  /** Para onde subir, e o que muda. Null quando ja esta no maior plano. */
  sugestao: { planoId: PlanoId; nome: string; marcas: number; gravacoesPorMes: number; armazenamentoGb: number; minutosPorMes: number; duracaoMaximaMin: number } | null;
  /**
   * ISO da proxima reposicao, so para gravacoes.
   *
   * **E o que impede a tela de virar uma parede.** Quem sabe que volta dia 14
   * espera; quem nao sabe acha que o produto acabou.
   *
   * A data sai de `creditsResetAt + 30 dias`, que e a MESMA regra que o cron de
   * reposicao usa (app/api/cron/annual-credits). Ela e aproximada de proposito
   * no mensal, onde quem vira o ciclo e o webhook do Stripe e o mes tem de 28 a
   * 31 dias. Por isso a tela diz "por volta de": prometer dia exato e errar por
   * dois e pior que dizer aproximadamente e acertar sempre.
   */
  renovaEm: string | null;
  /**
   * ESTOURO DE QUEM É MEMBRO DA EQUIPE (01/10). "teto": o limite que o dono
   * deu a este membro acabou. "cota": a cota da conta acabou. Nos dois casos a
   * tela não oferece upgrade (membro não vê cobrança) e manda falar com quem
   * administra a conta; `sugestao` vem null.
   */
  equipe?: "teto" | "cota" | "contrato";
  /**
   * O nome de quem administra a conta, quando `equipe` vem (01/10, acabamento).
   * Em "contrato" (08/10, conta ligada ao contrato): o contrato por extenso,
   * com a titular ("contrato SEED (titular Matheus)").
   */
  dono?: string;
};

/** Quantas gravacoes ainda cabem, para avisar ANTES de esbarrar. */
export type UsoDeGravacoes = {
  usadas: number;
  limite: number;
  restantes: number;
  renovaEm: string | null;
  /** Sem plano, ou plano fora da tabela: nao ha cota para mostrar. */
  semPlano: boolean;
  /** Acesso interno: sem cota, e sem oferta na tela. */
  admin: boolean;
  /**
   * Para MEMBRO da equipe (01/10): o que ele mesmo usou no mês e o teto que o
   * dono deu (null: sem teto próprio). `restantes` já é o menor entre o que
   * sobra na conta e o que sobra no teto dele.
   */
  membro?: { usadas: number; teto: number | null };
};

// O ciclo de créditos mora em lib/ciclo-de-credito.ts desde 01/10: o teto de
// cada membro da equipe conta no MESMO ciclo, e lib/credits precisa dele.
export { cicloAtual };

/**
 * A MARCA DE GRAVAÇÃO no extrato: uma linha de valor zero por gravação aceita.
 *
 * Por que no extrato, e não só contando `VideoJob` (30/09): `VideoJob` morre
 * em cascata quando o projeto é apagado. Medido no schema: apagar a marca e
 * criar outra devolvia as 4 gravações do Starter na hora, quantas vezes o
 * cliente quisesse, e cada gravação editada custa de R$ 87 a R$ 112. O extrato
 * só morre com o usuário, então a marca sobrevive à faxina do projeto. E dá
 * ao cliente a resposta escrita de "por que diz que usei 4", no mesmo lugar
 * onde ele já confere os créditos. Não exige coluna nova no banco.
 */
export const OPERACAO_DA_GRAVACAO = "gravacao_enviada";

/**
 * Quem consulta: o cliente do banco de sempre, ou a transação de
 * `registrarGravacao`. Dentro da transação a leitura PRECISA ir pela mesma
 * conexão: medido em 30/09, três envios juntos seguravam cada um uma conexão
 * esperando a trava e pediam outra para contar, e o pool acabava antes da fila.
 */
type Leitor = typeof prisma | Prisma.TransactionClient;

/**
 * Quantas gravações entraram neste ciclo: a UNIÃO das gravações que ainda
 * existem com as marcas do extrato. As duas fontes porque as gravações de
 * antes de 30/09 não têm marca, e as apagadas depois de 30/09 só têm a marca.
 */
async function gravacoesDoCiclo(userId: string, desde: Date, db: Leitor = prisma): Promise<number> {
  const [vivas, marcas] = await Promise.all([
    // Pelo DONO do projeto também (01/10): a gravação de um membro da equipe
    // tem `userId` do membro, mas conta na cota da conta, que é a do dono.
    db.videoJob.findMany({
      where: { createdAt: { gte: desde }, OR: [{ userId }, { project: { userId } }] },
      select: { id: true },
    }),
    db.creditTransaction.findMany({
      where: { userId, operation: OPERACAO_DA_GRAVACAO, createdAt: { gte: desde } },
      select: { refId: true },
    }),
  ]);
  const ids = new Set<string>(vivas.map((v) => v.id));
  for (const m of marcas) if (m.refId) ids.add(m.refId);
  return ids.size;
}

/**
 * A cota do plano, ou null para quem nao tem plano ("free").
 *
 * Com os ACESSOS EXTRAS da equipe (01/10): cada um soma 1 gravação por mês, e
 * as marcas passam a ser a maior entre as do plano e os acessos inclusos, mais
 * uma por acesso extra (ver lib/equipe/regras.ts).
 */
export function cotaDoPlano(plan: string | null | undefined, acessosExtras = 0): Cota | null {
  if (!plan || plan === "free") return null;
  const publico = PLANOS_PUBLICOS.find((p) => p.id === plan);
  if (!publico) return null;
  return {
    marcas: marcasDaConta(publico.marcas, plan, acessosExtras),
    gravacoesPorMes: gravacoesComExtras(publico.gravacoesPorMes, acessosExtras),
    armazenamentoGb: publico.armazenamentoGb,
  };
}

/**
 * O proximo plano que resolve o aperto, e nao simplesmente "o plano de cima".
 *
 * A diferenca importa: Essencial e Autoridade tem **1 marca os dois**. Oferecer
 * o Autoridade a quem esbarrou no limite de MARCAS venderia uma mudanca que nao
 * resolve o problema dela, e isso queima a confianca no pedido de upgrade
 * inteiro. **Pedido de upgrade que nao resolve o aperto e propaganda, nao
 * ajuda.**
 */
function proximoQueResolve(
  atual: string | null | undefined,
  recurso: Estouro["recurso"],
  precisa: number
): Estouro["sugestao"] {
  const ordem = PLANOS_PUBLICOS;
  const indiceAtual = ordem.findIndex((p) => p.id === atual);
  const candidatos = ordem.slice(indiceAtual + 1);
  const achado = candidatos.find((p) =>
    recurso === "marcas"
      ? p.marcas >= precisa
      : recurso === "gravacoes"
        ? p.gravacoesPorMes >= precisa
        : recurso === "minutos"
          ? minutosPorMesDoPlano(p.id) >= precisa
          : recurso === "duracao"
            ? p.duracaoMaximaMin >= precisa
            : p.armazenamentoGb >= precisa
  );
  if (!achado) return null;
  return {
    planoId: achado.id,
    nome: achado.nome,
    marcas: achado.marcas,
    gravacoesPorMes: achado.gravacoesPorMes,
    armazenamentoGb: achado.armazenamentoGb,
    minutosPorMes: minutosPorMesDoPlano(achado.id),
    duracaoMaximaMin: achado.duracaoMaximaMin,
  };
}

/**
 * Pode criar mais uma marca (projeto)?
 *
 * Devolve `null` quando pode. Quando nao pode, devolve o que a tela precisa para
 * pedir o upgrade com numeros de verdade.
 *
 * **Nao mexe em quem ja esta acima do limite.** Medido em 18/09 antes de
 * escrever: ninguem esta. Mas a regra fica escrita porque um dia alguem vai
 * estar, por mudanca de tabela ou por downgrade, e apagar projeto de cliente
 * para caber num plano novo e o tipo de coisa que nunca se desfaz.
 */
export async function conferirMarca(userIdDeQuemPede: string): Promise<Estouro | null> {
  // A marca é da CONTA (01/10): para membro da equipe vale a do dono. Quem cria
  // projeto é o dono; a rota recusa o membro antes, isto é só a mesma régua.
  const { contaId: userId, membro } = await regraDaConta(userIdDeQuemPede);
  // A CONTA LIGADA AO CONTRATO (08/10): um projeto por pessoa do time, contado
  // nos projetos dela (o que ela cria é dela; o contrato paga o uso).
  if (membro?.origem === "contrato" && membro.contrato) {
    const meus = await prisma.project.count({ where: { userId: userIdDeQuemPede } });
    if (meus < PROJETOS_POR_PESSOA_DO_CONTRATO) return null;
    return {
      recurso: "marcas",
      usado: meus,
      limite: PROJETOS_POR_PESSOA_DO_CONTRATO,
      plano: null,
      sugestao: null,
      renovaEm: null,
      equipe: "contrato",
      dono: nomeDaCarteiraDoContrato(membro.contrato),
    };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true, acessosExtras: true },
  });
  if (!user) return null;
  // Acesso interno nao tem cobranca e nao tem cota: cobrar plano de quem opera
  // a plataforma e o produto pedindo dinheiro ao dono.
  if (user.role === "admin") return null;

  const cota = cotaDoPlano(user.plan, user.acessosExtras);
  const projetos = await prisma.project.count({ where: { userId } });

  if (!cota) {
    return {
      recurso: "marcas",
      usado: projetos,
      limite: 0,
      plano: null,
      sugestao: proximoQueResolve(null, "marcas", projetos + 1),
      renovaEm: null,
    };
  }
  if (projetos < cota.marcas) return null;

  return {
    recurso: "marcas",
    usado: projetos,
    limite: cota.marcas,
    plano: planoPublico(user.plan as PlanoId).nome,
    sugestao: proximoQueResolve(user.plan, "marcas", projetos + 1),
    // Marca nao "renova": ela nao e consumo do ciclo, e capacidade do plano. A
    // unica saida e subir de plano ou apagar uma marca, e a tela nao pode
    // sugerir uma espera que nunca vai terminar.
    renovaEm: null,
  };
}

/** Quantas gravacoes ja foram e quantas faltam neste ciclo. */
export async function usoDeGravacoes(userIdDeQuemPede: string): Promise<UsoDeGravacoes> {
  // A cota é da CONTA (01/10): membro da equipe vê a do dono, limitada pelo
  // teto que o dono deu a ele.
  const membro = await membroAtivo(userIdDeQuemPede);
  const userId = membro?.donoId ?? userIdDeQuemPede;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true, creditsResetAt: true, acessosExtras: true },
  });
  const vazio = { usadas: 0, limite: 0, restantes: 0, renovaEm: null, semPlano: true, admin: false };
  if (!user) return vazio;
  // A conta ligada ao contrato nunca herda o acesso interno da titular (08/10).
  const vale = planoQueValeNaConta(user, membro?.contrato);
  if (vale.admin) return { ...vazio, semPlano: false, admin: true };

  const cota = cotaDoPlano(vale.plan, vale.acessosExtras);
  const ciclo = cicloAtual(user.creditsResetAt);
  const usadas = await gravacoesDoCiclo(userId, ciclo.inicio);
  if (!cota) return { ...vazio, usadas };

  let restantes = Math.max(0, cota.gravacoesPorMes - usadas);
  let doMembro: UsoDeGravacoes["membro"];
  if (membro) {
    const consumo = await consumoDoMembro(userId, userIdDeQuemPede, ciclo.inicio);
    doMembro = { usadas: consumo.gravacoes, teto: membro.tetoGravacoes };
    if (membro.tetoGravacoes !== null) restantes = Math.min(restantes, Math.max(0, membro.tetoGravacoes - consumo.gravacoes));
  }

  return {
    usadas,
    limite: cota.gravacoesPorMes,
    restantes,
    renovaEm: ciclo.renovaEm,
    semPlano: false,
    admin: false,
    ...(doMembro ? { membro: doMembro } : {}),
  };
}

/** O que a conferência de gravação sabe, para quem precisa do número além do sim ou não. */
type AvaliacaoDaGravacao = { estouro: Estouro | null; usadas: number; limite: number | null; admin: boolean };

/**
 * Com a EQUIPE (01/10): `userId` aqui é sempre a CONTA (o dono), e `membro`
 * vem quando quem pediu é membro dela. A conta é conferida primeiro (a cota
 * que o plano paga), e depois o teto que o dono deu ao membro.
 */
async function avaliarGravacao(
  userId: string,
  db: Leitor = prisma,
  membro: { autorId: string; dados: MembroDaConta } | null = null
): Promise<AvaliacaoDaGravacao | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true, creditsResetAt: true, acessosExtras: true, name: true, email: true },
  });
  if (!user) return null;
  // O nome do dono vai no estouro de quem é membro (01/10, acabamento): a tela
  // diz com QUEM falar, em vez de "quem administra a conta". Para a conta
  // ligada ao contrato (08/10), o contrato por extenso, com a titular.
  const contrato = membro?.dados.contrato ?? null;
  const dono = contrato ? nomeDaCarteiraDoContrato(contrato) : user.name?.trim() || user.email;
  // A conta ligada nunca herda o acesso interno da titular, e sem plano na
  // titular vale o plano do contrato (planoQueValeNaConta, 08/10).
  const vale = planoQueValeNaConta(user, contrato);

  const cota = cotaDoPlano(vale.plan, vale.acessosExtras);
  const ciclo = cicloAtual(user.creditsResetAt);
  const gravacoes = await gravacoesDoCiclo(userId, ciclo.inicio, db);

  // Acesso interno nao tem cota (30/09, regra do Bruno: "admin nao tem
  // limite"). Conta mesmo assim, para a marca do extrato dizer quantas foram.
  if (vale.admin) return { estouro: null, usadas: gravacoes, limite: null, admin: true };

  if (!cota) {
    return {
      estouro: {
        recurso: "gravacoes",
        usado: gravacoes,
        limite: 0,
        plano: null,
        // A conta ligada ao contrato não compra plano: a saída é a titular.
        sugestao: contrato ? null : proximoQueResolve(null, "gravacoes", gravacoes + 1),
        renovaEm: null,
        ...(contrato ? { equipe: "contrato" as const, dono } : {}),
      },
      usadas: gravacoes,
      limite: 0,
      admin: false,
    };
  }
  if (gravacoes < cota.gravacoesPorMes) {
    // A conta tem gravação; o membro ainda tem no teto dele?
    const teto = membro?.dados.tetoGravacoes;
    if (membro && teto !== null && teto !== undefined) {
      const { gravacoes: dele } = await consumoDoMembro(userId, membro.autorId, ciclo.inicio, db);
      if (dele >= teto) {
        return {
          estouro: {
            recurso: "gravacoes",
            usado: dele,
            limite: teto,
            plano: planoPublico(vale.plan as PlanoId).nome,
            sugestao: null,
            renovaEm: ciclo.renovaEm,
            equipe: "teto",
            dono,
          },
          usadas: gravacoes,
          limite: cota.gravacoesPorMes,
          admin: false,
        };
      }
    }
    return { estouro: null, usadas: gravacoes, limite: cota.gravacoesPorMes, admin: false };
  }

  return {
    estouro: {
      recurso: "gravacoes",
      usado: gravacoes,
      limite: cota.gravacoesPorMes,
      plano: planoPublico(vale.plan as PlanoId).nome,
      // Membro não compra nem troca de plano: a saída dele é o dono.
      sugestao: membro ? null : proximoQueResolve(vale.plan, "gravacoes", gravacoes + 1),
      renovaEm: ciclo.renovaEm,
      ...(membro ? { equipe: contrato ? ("contrato" as const) : ("cota" as const), dono } : {}),
    },
    usadas: gravacoes,
    limite: cota.gravacoesPorMes,
    admin: false,
  };
}

/** Pode subir mais uma gravacao neste ciclo? Mesmo contrato de `conferirMarca`. */
export async function conferirGravacao(userId: string): Promise<Estouro | null> {
  // Membro da equipe: confere a cota da conta e o teto dele (01/10).
  const membro = await membroAtivo(userId);
  if (membro) return (await avaliarGravacao(membro.donoId, prisma, { autorId: userId, dados: membro }))?.estouro ?? null;
  return (await avaliarGravacao(userId))?.estouro ?? null;
}

export type RegistroDaGravacao =
  | { ok: true; video: { id: string; status: string } }
  | { ok: false; estouro: Estouro };

/**
 * REGISTRA UMA GRAVAÇÃO SÓ SE ELA CABE NA COTA (30/09). É a trava de verdade.
 *
 * Até 30/09 a cota era conferida só ao emitir o token do upload, e isso deixava
 * três portas abertas, achadas no estudo de custos de 30/09 (no pior caso um
 * Starter custaria perto de R$ 3.100 num plano de R$ 2.997):
 *
 * 1. a rota POST /api/videos registrava qualquer arquivo, sem cota nenhuma: um
 *    upload feito com um token antigo, ou uma chamada direta, virava gravação
 *    e a esteira cara rodava;
 * 2. duas abas pedindo token juntas, com 3 de 4 usadas, recebiam as duas,
 *    porque nenhuma gravação existia ainda no momento da conferência;
 * 3. apagar o projeto apagava as gravações em cascata e devolvia a cota (ver
 *    `OPERACAO_DA_GRAVACAO`).
 *
 * As duas rotas que registram (o aviso do storage e o registro do navegador)
 * passam por aqui. A trava de conselho do Postgres, por usuário e só durante a
 * transação, faz a conferência e a criação acontecerem uma de cada vez: a
 * segunda aba espera a primeira terminar e já enxerga a gravação dela.
 */
export async function registrarGravacao(args: {
  userId: string;
  projectId: string;
  blobUrl: string;
  originalName?: string | null;
  sizeBytes?: number | null;
  /**
   * A DURAÇÃO lida pelo navegador (08/10), para a trava dos minutos do mês
   * valer já no registro. Ela é conferida de novo na aprovação do roteiro,
   * com a duração medida pelo worker (quem manda é a medida).
   */
  duracaoSeg?: number | null;
  /**
   * A GRAVAÇÃO EM PARTES (08/10): a lista na ordem confirmada, gravada na
   * mesma transação da criação. `blobUrl` é a primeira parte, e é ela que
   * resolve a corrida entre o aviso do storage e o registro do navegador.
   * Continua sendo UMA gravação na cota.
   */
  partes?: PartesDaGravacao | null;
}): Promise<RegistroDaGravacao> {
  const { userId, projectId, blobUrl } = args;
  // Quem PAGA a gravação (01/10): a conta do dono quando quem envia é membro.
  // A trava, a cota e a marca do extrato são da conta; o VideoJob continua com
  // o `userId` de quem enviou, que é quem recebe os avisos da esteira.
  const pagante = await contaPagante(userId);
  const contaId = pagante.contaId;
  const membroQueEnvia = pagante.membro && pagante.autorId ? { autorId: pagante.autorId, dados: pagante.membro } : null;
  const chave = { projectId_blobUrl: { projectId, blobUrl } };
  const campos = { id: true, status: true } as const;

  // O mesmo arquivo chega pelas duas rotas quase juntas: quem chegar depois
  // encontra o registro pronto e não conta de novo.
  const existente = await prisma.videoJob.findUnique({ where: chave, select: campos });
  if (existente) return { ok: true, video: existente };

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`select 1 as ok from (select pg_advisory_xact_lock(hashtext(${`gravacao:${contaId}`}))) as trava`;

      const ja = await tx.videoJob.findUnique({ where: chave, select: campos });
      if (ja) return { ok: true as const, video: ja };

      // A leitura da cota vê o que a transação anterior gravou: a trava só é
      // solta no commit dela. E vai pela mesma conexão (ver `Leitor`).
      const avaliacao = await avaliarGravacao(contaId, tx, membroQueEnvia);
      if (!avaliacao) throw new Error("Usuário não encontrado");
      if (avaliacao.estouro) return { ok: false as const, estouro: avaliacao.estouro };
      // OS MINUTOS DO MÊS e a DURAÇÃO POR PAPEL (08/10): com a duração que o navegador leu, a gravação só
      // entra se couber no mês e se quem envia puder enviar um vídeo desse tamanho (5 min para membro e conta
      // ligada ao contrato). A aprovação do roteiro confere de novo com a duração medida pelo worker.
      if (args.duracaoSeg && args.duracaoSeg > 0) {
        const estouroDeDuracao = await conferirDuracaoDaGravacao(userId, args.duracaoSeg, tx);
        if (estouroDeDuracao) return { ok: false as const, estouro: estouroDeDuracao };
        const estouroDeMinutos = await conferirMinutos(userId, { duracaoSegNova: args.duracaoSeg }, tx);
        if (estouroDeMinutos) return { ok: false as const, estouro: estouroDeMinutos };
      }

      const video = await tx.videoJob.create({
        data: {
          projectId,
          userId,
          status: "uploaded",
          blobUrl,
          originalName: args.originalName ?? null,
          sizeBytes: args.sizeBytes ? BigInt(args.sizeBytes) : null,
        },
        select: campos,
      });
      // A coluna `partes` fica fora do schema do Prisma (lib/media/partes-servidor.ts):
      // SQL cru, na mesma transação. Sem a coluna, lança e o registro inteiro desfaz.
      if (args.partes) await tx.$executeRaw`UPDATE video_jobs SET partes = ${JSON.stringify(args.partes)}::jsonb WHERE id = ${video.id}`;

      const dono = await tx.user.findUniqueOrThrow({ where: { id: contaId }, select: { creditsBalance: true } });
      const numero = avaliacao.usadas + 1;
      await tx.creditTransaction.create({
        data: {
          userId: contaId,
          autorId: pagante.autorId,
          projectId,
          amount: 0,
          operation: OPERACAO_DA_GRAVACAO,
          carteira: "plano",
          refId: video.id,
          balance: dono.creditsBalance,
          note: avaliacao.admin
            ? `${numero}ª gravação do mês, acesso interno sem limite`
            : `${numero} de ${avaliacao.limite} gravações deste mês`,
        },
      });
      return { ok: true as const, video };
      // O prazo padrão do Prisma (5 s) conta também a espera na trava: medido
      // em 30/09 no dev local, três envios juntos estouravam os 5 s e os três
      // falhavam, inclusive o que cabia. Com 30 s a fila anda; a trava é só
      // deste usuário, então ninguém mais espera por ela.
    }, { maxWait: 15_000, timeout: 30_000 });
  } catch (e) {
    // Restrição única: alguém registrou o mesmo arquivo por fora da trava.
    // Vale o registro que já existe, como antes do upsert de 22/08.
    const ja = await prisma.videoJob.findUnique({ where: chave, select: campos });
    if (ja) return { ok: true, video: ja };
    throw e;
  }
}

/**
 * Apaga o arquivo de uma gravação RECUSADA pela cota, para ele não ficar
 * cobrando armazenamento sem registro nenhum que aponte para ele.
 *
 * SÓ APAGA o que está na pasta do projeto, `videos/<projectId>/`, que é onde o
 * token do upload grava. A rota POST /api/videos recebe a URL do navegador, e
 * sem esta conferência quem já esgotou a cota poderia mandar a URL da gravação
 * de outro cliente e vê-la apagada pela recusa. `apagarMidias` ainda confere
 * que a URL é do nosso storage.
 */
export async function descartarGravacaoRecusada(blobUrl: string, projectId: string): Promise<void> {
  let caminho = "";
  try {
    caminho = decodeURIComponent(new URL(blobUrl).pathname);
  } catch {
    return;
  }
  if (!caminho.startsWith(`/videos/${projectId}/`)) return;
  await apagarMidias([blobUrl], "gravacao-recusada-pela-cota");
}

/**
 * A frase que a pessoa le, montada aqui e nao em cada tela.
 *
 * Mora junto com a regra pelo mesmo motivo que a tabela de planos mora num
 * arquivo so: quando cada tela escrevia a sua copia, as copias divergiram.
 */
export function fraseDoEstouro(e: Estouro): string {
  // A DURAÇÃO POR PAPEL (08/10): o membro e a conta ligada leem quem pode enviar o vídeo longo.
  if (e.recurso === "duracao") {
    if (e.equipe) return `Esse vídeo tem ${e.usado} minutos. ${fraseDoVideoLongoDoMembro(e.limite, e.equipe === "contrato", e.dono ?? null)}`;
    const sobe = e.sugestao ? ` O ${e.sugestao.nome} aceita até ${duracaoPorExtenso(e.sugestao.duracaoMaximaMin * 60)}.` : "";
    return `Esse vídeo tem ${e.usado} minutos, e o ${e.plano ?? "plano"} aceita gravações de até ${duracaoPorExtenso(e.limite * 60)}.${sobe}`;
  }
  // OS MINUTOS DO MÊS de quem é membro ou conta ligada (08/10): sem upgrade, a saída é quem paga.
  if (e.recurso === "minutos" && e.equipe) {
    const libera = e.renovaEm ? ` A próxima reposição é em ${diaEMes(e.renovaEm)}.` : "";
    const quem = e.equipe === "contrato" ? "a titular do contrato" : e.dono?.trim() || "quem administra a conta";
    const de = e.equipe === "contrato" ? `O time do ${e.dono ?? "contrato"}` : "A sua equipe";
    return `${de} já usou os ${duracaoPorExtenso(e.limite * 60)} de vídeo editado deste mês, e com esta gravação passaria de ${Math.round(e.usado)} minutos.${libera} Para liberar mais, fale com ${quem}.`;
  }
  // Membro da equipe (01/10): a frase aprovada do teto, ou a da cota da conta.
  if (e.equipe === "teto") return fraseDoTetoDeGravacoes(e.usado, e.limite);
  if (e.equipe === "cota") return fraseDaCotaDaEquipe({ usadas: e.usado, limite: e.limite, renovaEm: e.renovaEm, diaEMes, dono: e.dono });
  // A conta ligada ao contrato (08/10): o projeto por pessoa e a cota do contrato.
  if (e.equipe === "contrato") {
    const carteira = e.dono ?? "contrato";
    if (e.recurso === "marcas") return fraseDoProjetoDoContrato(carteira, e.usado, e.limite);
    if (e.recurso === "gravacoes" && e.limite > 0) return fraseDaCotaDoContrato({ carteira, usadas: e.usado, limite: e.limite, renovaEm: e.renovaEm, diaEMes });
    if (e.recurso === "gravacoes") return `O ${carteira} ainda não tem plano com gravações. Fale com a titular do contrato.`;
    return `O ${carteira} guarda até ${e.limite} GB de gravações, e o time já usa ${e.usado} GB. Fale com a titular do contrato.`;
  }
  if (!e.plano) {
    return e.recurso === "marcas"
      ? "Escolha um plano para criar a sua marca."
      : "Escolha um plano para enviar a sua primeira gravação.";
  }
  if (e.recurso === "marcas") {
    return `O ${e.plano} inclui ${e.limite} marca${e.limite > 1 ? "s" : ""}, e você já tem ${e.usado}.`;
  }
  if (e.recurso === "armazenamento") {
    const sobe = e.sugestao ? ` O ${e.sugestao.nome} sobe para ${e.sugestao.armazenamentoGb} GB.` : " Apague uma gravação antiga para liberar espaço.";
    return `O ${e.plano} guarda ${e.limite} GB de gravações, e você já usa ${e.usado} GB.${sobe}`;
  }
  if (e.recurso === "minutos") {
    // O número é o do cartão do plano (08/10): "60 minutos de vídeo editado por mês".
    const libera = e.renovaEm ? ` A próxima reposição é em ${diaEMes(e.renovaEm)}.` : "";
    const sobe = e.sugestao ? ` O ${e.sugestao.nome} tem ${duracaoPorExtenso(e.sugestao.minutosPorMes * 60)} por mês.` : "";
    return `O ${e.plano} inclui ${duracaoPorExtenso(e.limite * 60)} de vídeo editado por mês, e com esta gravação você passaria de ${Math.round(e.usado)} minutos.${libera}${sobe}`;
  }
  // A frase aprovada em 30/09, a mesma que a tela mostra antes do envio.
  return fraseDaCotaDeGravacoes({ usado: e.usado, limite: e.limite, renovaEm: e.renovaEm, sugestao: e.sugestao });
}

/** Quanto o cliente ja guarda, e quanto o plano dele deixa guardar. */
export type UsoDeArmazenamento = {
  /** Bytes guardados hoje, somando as gravacoes de todos os projetos dele. */
  bytes: number;
  /** O teto do plano, em gigabytes. 0 quando nao ha plano. */
  limiteGb: number;
  usadoGb: number;
  restanteGb: number;
  /** De 0 a 100, para a barra. 0 quando nao ha teto. */
  percentual: number;
  semPlano: boolean;
  admin: boolean;
};

const BYTES_POR_GB = 1024 * 1024 * 1024;

/**
 * O ARMAZENAMENTO, somado das GRAVACOES, e por que so delas.
 *
 * MEDIDO em 22/09 antes de escrever qualquer teto, que e o que o card 470
 * exigia: o Blob inteiro tinha 10,75 GB em 19 arquivos, e catorze das quinze
 * pastas de topo eram gravacao bruta, de 0,8 a 1,8 GB cada. Arte, capa e
 * musica somadas nao chegavam a 8 MB. Entao somar `VideoJob.sizeBytes` mede o
 * que importa sem listar o Blob inteiro a cada conferencia, que seria uma
 * chamada de rede cara num caminho quente.
 *
 * A imprecisao e conhecida e e para o lado seguro: o que fica de fora (arte,
 * mp4 de video por IA, capa) e ruido perto de uma gravacao. Se um dia deixar
 * de ser, o numero a corrigir esta aqui e so aqui.
 */
export async function usoDeArmazenamento(userIdDeQuemPede: string): Promise<UsoDeArmazenamento> {
  // O armazenamento é da CONTA (01/10): soma as gravações de todos os
  // projetos do dono, inclusive as que os membros da equipe enviaram.
  const { contaId: userId, membro } = await regraDaConta(userIdDeQuemPede);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true, acessosExtras: true },
  });
  const vazio = { bytes: 0, limiteGb: 0, usadoGb: 0, restanteGb: 0, percentual: 0, semPlano: true, admin: false };
  if (!user) return vazio;

  // O CONTRATO GUARDA-CHUVA (08/10): as contas ligadas à titular somam no
  // armazenamento do contrato, como as gravações dos membros somam no do dono.
  // Conta sem ligação: a lista é só ela, e a soma é a de sempre.
  const grupo = [userId, ...(await contasLigadasA(userId))];
  const soma = await prisma.videoJob.aggregate({
    where: grupo.length > 1 ? { OR: [{ userId: { in: grupo } }, { project: { userId: { in: grupo } } }] } : { OR: [{ userId }, { project: { userId } }] },
    _sum: { sizeBytes: true },
  });
  // A biblioteca de materiais (03/10) entra na mesma conta: vídeo de celular
  // pesa como gravação, e foto soma pouco.
  const materiais = await prisma.materialDoCliente
    .aggregate({ where: grupo.length > 1 ? { project: { userId: { in: grupo } } } : { project: { userId } }, _sum: { sizeBytes: true } })
    .catch(() => ({ _sum: { sizeBytes: null } }));
  const bytes = Number(soma._sum.sizeBytes ?? 0) + Number(materiais._sum.sizeBytes ?? 0);
  const usadoGb = bytes / BYTES_POR_GB;

  const vale = planoQueValeNaConta(user, membro?.contrato);
  if (vale.admin) return { ...vazio, bytes, usadoGb, semPlano: false, admin: true };

  const cota = cotaDoPlano(vale.plan);
  if (!cota) return { ...vazio, bytes, usadoGb };

  return {
    bytes,
    limiteGb: cota.armazenamentoGb,
    usadoGb,
    restanteGb: Math.max(0, cota.armazenamentoGb - usadoGb),
    percentual: Math.min(100, Math.round((usadoGb / cota.armazenamentoGb) * 100)),
    semPlano: false,
    admin: false,
  };
}

/**
 * Cabe mais um arquivo deste tamanho?
 *
 * Mesmo contrato das outras conferencias: `null` quando cabe. **Nunca apaga
 * nada**, e isso e deliberado: o card 470 pergunta o que fazer com o que ja
 * esta la, e a resposta da casa e a mesma da cota de marcas, bloquear o novo
 * sem tocar no antigo. Apagar gravacao de cliente para caber num teto e o tipo
 * de coisa que nao se desfaz, e o cliente nem sempre tem outra copia.
 */
export async function conferirArmazenamento(
  userId: string,
  bytesNovos = 0
): Promise<Estouro | null> {
  const uso = await usoDeArmazenamento(userId);
  if (uso.admin) return null;

  const { contaId, membro } = await regraDaConta(userId);
  const conta = await prisma.user.findUnique({ where: { id: contaId }, select: { plan: true, role: true, acessosExtras: true } });
  const plano = conta ? planoQueValeNaConta(conta, membro?.contrato).plan : null;
  const contrato = membro?.contrato ?? null;
  const precisaGb = Math.ceil(uso.usadoGb + bytesNovos / BYTES_POR_GB);

  if (uso.semPlano) {
    return {
      recurso: "armazenamento",
      usado: Math.round(uso.usadoGb),
      limite: 0,
      plano: null,
      sugestao: contrato ? null : proximoQueResolve(null, "armazenamento", precisaGb),
      renovaEm: null,
      ...(contrato ? { equipe: "contrato" as const, dono: nomeDaCarteiraDoContrato(contrato) } : {}),
    };
  }
  if (uso.usadoGb + bytesNovos / BYTES_POR_GB <= uso.limiteGb) return null;

  return {
    recurso: "armazenamento",
    usado: Math.round(uso.usadoGb),
    limite: uso.limiteGb,
    plano: planoPublico(plano as PlanoId).nome,
    ...(contrato ? { equipe: "contrato" as const, dono: nomeDaCarteiraDoContrato(contrato) } : {}),
    sugestao: contrato ? null : proximoQueResolve(plano, "armazenamento", precisaGb),
    // Armazenamento nao "renova" sozinho: ele so desce se alguem apagar. Dizer
    // uma data aqui seria prometer uma espera que nunca termina.
    renovaEm: null,
  };
}

/**
 * OS MINUTOS DE VÍDEO DO CICLO (08/10, decisão do Bruno: "limitar os minutos
 * dos planos" e "o usuário administra os minutos"). O teto por plano é o
 * MESMO número do cartão (lib/entregas-do-plano.ts, `minutosPorMesDoPlano`):
 * os minutos que o saldo paga, a 230 créditos por minuto. Aqui ele vira trava
 * de segurança: na emissão do token, no registro da gravação (com a duração
 * que o navegador leu) e na aprovação do roteiro (com a duração medida).
 *
 * O que conta: a duração medida de cada gravação da conta no ciclo
 * (`VideoJob.durationSec`, inclusive as dos membros e das contas ligadas ao
 * contrato) mais, para as gravações de projeto apagado, os minutos da linha
 * `video_roteiro` do extrato ("N min: transcrição..."), que sobrevive à
 * faxina do projeto como a marca da cota. Gravação ainda sem medida (subindo,
 * transcrevendo) conta zero aqui; a aprovação dela confere de novo com a
 * medida.
 *
 * O teto da conta cresce com o que foi pago a mais: cada acesso extra e cada
 * pacote de créditos comprado no ciclo somam minutos (230 créditos por
 * minuto, `minutosDaConta`). A cota por quantidade de gravações continua
 * como trava interna; o cliente só vê minutos.
 */
export type UsoDeMinutos = {
  porMes: number;
  usados: number;
  restantes: number;
  renovaEm: string | null;
  semPlano: boolean;
  admin: boolean;
};

async function minutosDoCiclo(userId: string, desde: Date, db: Leitor = prisma): Promise<number> {
  const [vivas, roteiros] = await Promise.all([
    db.videoJob.findMany({
      where: { createdAt: { gte: desde }, OR: [{ userId }, { project: { userId } }] },
      select: { id: true, durationSec: true },
    }),
    db.creditTransaction.findMany({
      where: { userId, operation: "video_roteiro", createdAt: { gte: desde }, amount: { lt: 0 } },
      select: { refId: true, note: true },
    }),
  ]);
  const vivos = new Set(vivas.map((v) => v.id));
  let segundos = vivas.reduce((s, v) => s + (v.durationSec ?? 0), 0);
  for (const r of roteiros) {
    if (r.refId && vivos.has(r.refId)) continue;
    const min = Number(String(r.note ?? "").match(/^(\d+) min/)?.[1] ?? 0);
    segundos += min * 60;
  }
  return segundos / 60;
}

/** Os créditos comprados à parte neste ciclo (pacotes): viram minutos a mais na conta. */
async function creditosCompradosNoCiclo(userId: string, desde: Date, db: Leitor = prisma): Promise<number> {
  const soma = await db.creditTransaction.aggregate({
    where: { userId, operation: OPERACAO_DA_COMPRA_DE_CREDITOS, createdAt: { gte: desde }, amount: { gt: 0 } },
    _sum: { amount: true },
  });
  return soma._sum.amount ?? 0;
}

/** Quantos minutos de vídeo a conta já usou neste ciclo, e quantos faltam. */
export async function usoDeMinutos(userIdDeQuemPede: string, db: Leitor = prisma): Promise<UsoDeMinutos> {
  // A conta que paga (o dono da equipe ou a titular do contrato), sem herdar o acesso interno (08/10).
  const { contaId: userId, membro } = await regraDaConta(userIdDeQuemPede, db);
  const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true, role: true, creditsResetAt: true, acessosExtras: true } });
  const vazio: UsoDeMinutos = { porMes: 0, usados: 0, restantes: 0, renovaEm: null, semPlano: true, admin: false };
  if (!user) return vazio;
  const vale = planoQueValeNaConta(user, membro?.contrato);
  if (vale.admin) return { ...vazio, semPlano: false, admin: true };
  const ciclo = cicloAtual(user.creditsResetAt);
  const [usados, comprados] = await Promise.all([minutosDoCiclo(userId, ciclo.inicio, db), creditosCompradosNoCiclo(userId, ciclo.inicio, db)]);
  const publico = PLANOS_PUBLICOS.find((p) => p.id === vale.plan);
  if (!publico) return { ...vazio, usados };
  const porMes = minutosDaConta(publico.id, vale.acessosExtras, comprados);
  return { porMes, usados, restantes: Math.max(0, porMes - usados), renovaEm: ciclo.renovaEm, semPlano: false, admin: false };
}

/** Quem paga e como a frase chama essa pessoa (o dono da equipe ou o contrato com a titular). */
async function quemPagaParaAFrase(userIdDeQuemPede: string, db: Leitor = prisma): Promise<{ contaId: string; membro: MembroDaConta | null; dono: string | null; contrato: boolean }> {
  const { contaId, membro } = await regraDaConta(userIdDeQuemPede, db);
  if (!membro) return { contaId, membro: null, dono: null, contrato: false };
  if (membro.contrato) return { contaId, membro, dono: nomeDaCarteiraDoContrato(membro.contrato), contrato: true };
  return { contaId, membro, dono: await nomeDoDono(contaId, db), contrato: false };
}

/**
 * Cabe mais esta duração nos minutos do mês? `null` quando cabe (ou quando
 * não há plano: aí quem recusa é a cota de gravações). Com `duracaoSegNova`
 * zero, confere só o que já está medido (a aprovação do roteiro, em que a
 * gravação já conta com a duração medida).
 */
export async function conferirMinutos(userIdDeQuemPede: string, o: { duracaoSegNova?: number } = {}, db: Leitor = prisma): Promise<Estouro | null> {
  const uso = await usoDeMinutos(userIdDeQuemPede, db);
  if (uso.admin || uso.semPlano) return null;
  const nova = Math.max(0, o.duracaoSegNova ?? 0) / 60;
  if (uso.usados + nova <= uso.porMes + 1e-9) return null;
  const quem = await quemPagaParaAFrase(userIdDeQuemPede, db);
  const user = await db.user.findUnique({ where: { id: quem.contaId }, select: { plan: true, role: true, acessosExtras: true } });
  const vale = user ? planoQueValeNaConta(user, quem.membro?.contrato) : null;
  const publico = PLANOS_PUBLICOS.find((p) => p.id === vale?.plan);
  return {
    recurso: "minutos",
    usado: Math.round((uso.usados + nova) * 10) / 10,
    limite: uso.porMes,
    plano: publico?.nome ?? null,
    // Membro e conta ligada não compram plano: a saída é quem paga.
    sugestao: quem.membro ? null : proximoQueResolve(vale?.plan, "minutos", Math.ceil(uso.usados + nova)),
    renovaEm: uso.renovaEm,
    ...(quem.membro ? { equipe: quem.contrato ? ("contrato" as const) : ("cota" as const), dono: quem.dono ?? undefined } : {}),
  };
}

/**
 * A DURAÇÃO DE CADA GRAVAÇÃO POR PAPEL (08/10, decisão do Bruno): quem envia
 * pela equipe ou pelo contrato (vendedor, consultor) só sobe vídeo de até 5
 * minutos; o vídeo longo é do titular da conta, até a duração máxima do
 * plano dela (1 h, 2 h, e o podcast de 3 h só no Enterprise). A regra sem
 * banco mora em lib/media/limits.ts (`duracaoMaximaDaGravacaoMin`); aqui se
 * resolve quem é quem. `null` quando cabe; acesso interno não tem teto.
 */
export async function conferirDuracaoDaGravacao(userIdDeQuemEnvia: string, duracaoSeg: number, db: Leitor = prisma): Promise<Estouro | null> {
  if (!(duracaoSeg > 0)) return null;
  const quem = await quemPagaParaAFrase(userIdDeQuemEnvia, db);
  const user = await db.user.findUnique({ where: { id: quem.contaId }, select: { plan: true, role: true, acessosExtras: true } });
  if (!user) return null;
  const vale = planoQueValeNaConta(user, quem.membro?.contrato);
  if (vale.admin) return null;
  const publico = PLANOS_PUBLICOS.find((p) => p.id === vale.plan) ?? PLANOS_PUBLICOS[0];
  const papel: PapelDoEnvio = quem.membro ? "membro" : "titular";
  const teto = duracaoMaximaDaGravacaoMin(papel, publico.duracaoMaximaMin);
  // Um segundo de folga: a medida do worker e a do navegador diferem por arredondamento.
  if (duracaoSeg <= teto * 60 + 1) return null;
  const precisa = Math.ceil(duracaoSeg / 60);
  return {
    recurso: "duracao",
    usado: Math.round(duracaoSeg / 60),
    limite: teto,
    plano: PLANOS_PUBLICOS.some((p) => p.id === vale.plan) ? publico.nome : null,
    sugestao: papel === "titular" ? proximoQueResolve(vale.plan, "duracao", precisa) : null,
    renovaEm: null,
    ...(quem.membro ? { equipe: quem.contrato ? ("contrato" as const) : ("cota" as const), dono: quem.dono ?? undefined } : {}),
  };
}

/**
 * O QUE UM ENVIO PODE TER no plano desta pessoa (duração e tamanho do arquivo).
 *
 * Nasceu em 29/09 com os tetos de 1, 2 e 5 horas. Devolve também o plano de
 * cima, para a recusa na tela dizer o que resolve. Sem plano, vale o menor teto
 * (o do Starter): o portão de entrada já manda essa pessoa escolher um plano, e
 * o menor teto é o lado seguro de errar numa rota que emite token de upload.
 * Acesso interno recebe o maior teto e nenhuma oferta.
 *
 * Desde 08/10 a duração máxima do envio é o menor entre a duração que o PAPEL
 * permite (5 minutos para membro e conta ligada ao contrato; a do plano para
 * o titular) e os MINUTOS QUE SOBRAM NO MÊS (`usoDeMinutos`): o navegador
 * recusa antes de subir um byte, com a frase certa para cada caso.
 */
export async function limitesDoEnvio(userIdDeQuemPede: string): Promise<LimitesDoEnvio> {
  // O teto do envio é o do plano da CONTA (01/10, acesso de equipe); para a
  // conta ligada ao contrato, o do contrato, sem o acesso interno (08/10).
  const quem = await quemPagaParaAFrase(userIdDeQuemPede);
  const { contaId: userId, membro } = quem;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, role: true, acessosExtras: true } });
  const vale = user ? planoQueValeNaConta(user, membro?.contrato) : null;
  if (vale?.admin) return LIMITES_SEM_PLANO;

  const indice = PLANOS_PUBLICOS.findIndex((p) => p.id === vale?.plan);
  const plano = PLANOS_PUBLICOS[indice] ?? PLANOS_PUBLICOS[0];
  const proximo = indice >= 0 ? PLANOS_PUBLICOS[indice + 1] : PLANOS_PUBLICOS[1];
  const uso = indice >= 0 ? await usoDeMinutos(userIdDeQuemPede) : null;
  const minutos = uso && !uso.semPlano ? { porMes: uso.porMes, usados: Math.round(uso.usados * 10) / 10, restantes: Math.round(uso.restantes * 10) / 10 } : null;
  const papel: PapelDoEnvio = membro ? "membro" : "titular";
  const tetoDoPapelMin = duracaoMaximaDaGravacaoMin(papel, plano.duracaoMaximaMin);
  return {
    duracaoMaximaSeg: duracaoMaximaDoEnvioSeg(tetoDoPapelMin, minutos?.restantes ?? null),
    bytesMaximo: plano.arquivoMaximoGb * BYTES_POR_GB,
    plano: indice >= 0 ? plano.nome : null,
    // Membro e conta ligada não trocam de plano: a tela não oferece o de cima.
    proximo:
      proximo && !membro
        ? { nome: proximo.nome, duracaoMaximaMin: proximo.duracaoMaximaMin, arquivoMaximoGb: proximo.arquivoMaximoGb, minutosPorMes: minutosPorMesDoPlano(proximo.id) }
        : null,
    minutos,
    papel: { tipo: papel, duracaoMaximaMin: tetoDoPapelMin, dono: quem.dono, contrato: quem.contrato },
  };
}

/**
 * O ESTADO DO TESTE DESTA CONTA, lido do banco.
 *
 * `trialEndsAt` é escrito pelo webhook do Stripe quando a assinatura chega
 * como `trialing` e apagado quando ela vira `active`. Ler daqui em vez de
 * perguntar ao Stripe é decisão de latência: esta função roda no caminho de
 * criar campanha, e chamada de rede ali é o cliente esperando por uma
 * pergunta cuja resposta já está no nosso banco.
 *
 * A DATA AINDA É CONFERIDA, e não só a presença do campo: se um webhook de
 * `active` se perder, a conta ficaria presa no teto do teste para sempre. Data
 * vencida vale como fora do teste, que é o lado seguro de errar.
 */
export async function limiteDoTeste(userIdDeQuemPede: string, agora = new Date()): Promise<LimiteDoTeste> {
  // O teste é da CONTA (01/10, acesso de equipe).
  const { contaId: userId, membro } = await regraDaConta(userIdDeQuemPede);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trialEndsAt: true, role: true, plan: true },
  });
  if (!user) return SEM_TESTE;
  // Acesso interno nao tem teste nem teto: e a casa usando a propria casa. A
  // conta ligada ao contrato não herda o acesso interno da titular (08/10),
  // mas a titular admin também não tem teste: o resultado é o mesmo.
  if (planoQueValeNaConta(user, membro?.contrato).admin) return SEM_TESTE;
  if (!user.trialEndsAt || user.trialEndsAt <= agora) return SEM_TESTE;

  // Campanha conta por EXECUCAO, e nao por post: e a unidade que o cliente
  // pede e a unidade que custa (pesquisa, redacao, arte e video de varios dias).
  const campanhasUsadas = await prisma.pipelineRun.count({
    where: { project: { userId }, archived: false },
  });

  return {
    emTeste: true,
    terminaEm: user.trialEndsAt.toISOString(),
    campanhasUsadas,
    campanhas: CAMPANHAS_NO_TESTE,
    dias: DIAS_DE_CAMPANHA_NO_TESTE,
    segundosDeVideo: SEGUNDOS_DE_VIDEO_NO_TESTE,
    videos: VIDEOS_NO_TESTE,
  };
}

/**
 * O LIMITE DE REFERÊNCIAS desta conta (06/10/2026): por projeto e somando os
 * projetos. A regra (os números, o teste, o admin, o teto da conta) mora em
 * referenciasDoPlano, sem banco; aqui só se lê quem é a conta.
 *
 * Membro da equipe usa o plano do DONO (contaDoPlano). As rotas chamam com o
 * dono do projeto, que é o mesmo dono, mas a conversão fica aqui para valer
 * em qualquer caminho.
 */
export async function limiteDeReferencias(userIdDeQuemPede: string, agora = new Date()): Promise<LimiteDeReferencias> {
  const { contaId: userId, membro } = await regraDaConta(userIdDeQuemPede);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true, trialEndsAt: true, acessosExtras: true },
  });
  if (!user) return referenciasDoPlano({ plan: null });
  // Conta ligada ao contrato: o plano do contrato, sem o acesso interno (08/10).
  const vale = planoQueValeNaConta(user, membro?.contrato);
  return referenciasDoPlano({
    plan: vale.plan,
    admin: vale.admin,
    // A mesma régua de limiteDoTeste: data vencida vale como fora do teste.
    emTeste: Boolean(user.trialEndsAt && user.trialEndsAt > agora),
    acessosExtras: vale.acessosExtras,
  });
}
