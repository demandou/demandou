/**
 * O PEDIDO DE AJUSTE NO CARD, COM MOTIVO E CRÉDITO (decisão do Bruno em
 * 09/10/2026). Módulo PURO: sem banco, sem rede, sem JEV. A tela, a rota do
 * chat e a prova leem a mesma conta daqui.
 *
 * ## O furo que isto fecha
 *
 * O Bruno pediu no chat do card de um post da programação um ajuste da arte. A
 * arte nova ficou ótima, e foi gerada sem motivo e sem cobrança: na prática ele
 * reprovou uma arte e ganhou outra de graça. Com clientes pedindo ajustes à
 * vontade por ali, a Demandou roda no prejuízo.
 *
 * ## A regra (a mesma da reprovação com motivo, 08/10)
 *
 * Nenhum pedido do chat gera arte, texto pago ou vídeo de novo sem antes passar
 * por aqui:
 *
 *   1. a pessoa escreve ou fala o ajuste e clica em "Pedir ajuste";
 *   2. o servidor entende o pedido, calcula o custo (esta conta) e GUARDA o
 *      pedido no card, sem gerar nada; o agente pergunta o motivo no chat, com
 *      os botões das mesmas categorias da reprovação;
 *   3. escolhido o motivo, a regra de lib/credits/reprovacao.ts decide: gosto
 *      e "pedi diferente" cobram; erro da plataforma vai para a conferência do
 *      JEV (confirmado: os créditos da peça voltam e o ajuste sai grátis; não
 *      confirmado: cobra agora e o admin decide, devolvendo tudo se reconhecer
 *      o erro);
 *   4. sem saldo para o que cobra, nada é refeito e a resposta diz o que fazer.
 *
 * O que não gera nada (mudar a data, salvar a regra de "nunca cite", tirar uma
 * rede) continua direto pelo chat, sem motivo: não há o que cobrar.
 */
import { CREDIT_COSTS } from "@/lib/credits/tabela";
import { custoDaMidia } from "@/lib/credits/estimativa";
import { gruposDeFormato } from "@/lib/media/formatos-das-redes";
import { CATEGORIAS_DE_REPROVACAO, NOME_DA_CATEGORIA, classeDaCategoria, type CategoriaDeReprovacao, type SituacaoDaReprovacao } from "@/lib/credits/reprovacao";

/**
 * De onde o ajuste sai:
 *   - "dia": o pedido composto do dia da campanha (texto, arte, data, rede),
 *     feito por lib/media/pedido-do-card.ts com as ações já entendidas;
 *   - "midia": a arte de um card de mídia sem dia de campanha;
 *   - "texto": o texto de um card de redator sem dia;
 *   - "texto_do_dia": os textos do dia pelo card do Paulo de um dia de vídeo;
 *   - "nao_citar": tirar dos rascunhos da campanha a menção que o cliente proibiu;
 *   - "video_ia": o vídeo do dia gerado de novo (carteira de vídeo);
 *   - "video_cenas": imagem, cena ou capa nova do vídeo gravado, pelo Vitor
 *     (lib/media/ajuste-pelo-chat.ts): o pedido dele espera o motivo daqui, e
 *     ele mesmo cobra quando gera.
 */
export type TipoDoAjuste = "dia" | "midia" | "texto" | "texto_do_dia" | "nao_citar" | "video_ia" | "video_cenas";

/** De qual carteira sai o custo: a de créditos do plano ou a de vídeo por IA. */
export type CarteiraDoAjuste = "plano" | "video";

/**
 * Uma parte do custo. No "dia", a chave é a MESMA da etapa do pedido
 * (lib/media/pedido-do-card.ts: "texto", "arte", "lamina-0"...): é assim que a
 * parte que não saiu volta sem ninguém precisar adivinhar.
 */
export type ParteDoAjuste = { chave: string; rotulo: string; creditos: number };

/** O motivo já gravado (a reprovação com motivo), para um segundo clique não gravar outro. */
export type MotivoRegistrado = {
  reprovacaoId: string;
  categoria: CategoriaDeReprovacao;
  situacao: SituacaoDaReprovacao;
  /** O motivo da cortesia quando o ajuste sai grátis; null quando cobra. */
  cortesia: string | null;
  creditosDevolvidos: number;
};

/** O pedido guardado no card (metadata.pedidoDeAjuste), esperando o motivo. */
export type PedidoDeAjuste = {
  id: string;
  tipo: TipoDoAjuste;
  /** O que a pessoa pediu, como escreveu ou falou. */
  mensagem: string;
  /** A lâmina selecionada na tela, quando o pedido veio de um carrossel. */
  slideIndex: number | null;
  /** As ações já entendidas (só no "dia"): o pedido aprovado roda exatamente o que foi cotado. */
  acoes?: unknown[];
  /** Os nomes da regra "nunca cite" (só em "nao_citar"). */
  nomes?: string[];
  /** A peça de referência: é nela que o motivo é gravado e conferido. */
  postId: string | null;
  carteira: CarteiraDoAjuste;
  /**
   * Quem cobra é outro caminho, na hora de gerar: a fila do vídeo por IA, ou o
   * Vitor no vídeo gravado. Aqui fica só a decisão (cobra ou é cortesia).
   */
  cobradoFora?: boolean;
  /** O custo quando cobra, em créditos da carteira. */
  creditos: number;
  partes: ParteDoAjuste[];
  /** O que vai ser refeito, em português: "o texto em 2 redes e a arte". */
  resumo: string;
  /** O que é cobrado à parte por outro caminho (levar a peça para outra rede). */
  aParte?: { creditos: number; oQue: string } | null;
  criadoEm: string;
  motivoRegistrado?: MotivoRegistrado | null;
};

export const CHAVE_DO_PEDIDO_DE_AJUSTE = "pedidoDeAjuste";

/** Pedido mais velho que isto não vale mais: a peça pode ter mudado, e o custo com ela. */
export const PEDIDO_DE_AJUSTE_VALE_MS = 24 * 60 * 60_000;

export function lerPedidoDeAjuste(metadata: unknown): PedidoDeAjuste | null {
  const p = ((metadata ?? {}) as Record<string, unknown>)[CHAVE_DO_PEDIDO_DE_AJUSTE] as PedidoDeAjuste | undefined;
  if (!p || typeof p !== "object" || typeof p.id !== "string" || typeof p.tipo !== "string" || !Array.isArray(p.partes)) return null;
  return p;
}

export function pedidoVelho(p: Pick<PedidoDeAjuste, "criadoEm">, agora = Date.now()): boolean {
  const idade = agora - new Date(p.criadoEm).getTime();
  return !Number.isFinite(idade) || idade > PEDIDO_DE_AJUSTE_VALE_MS;
}

// ── A conta ─────────────────────────────────────────────────────────────────

const soma = (partes: ParteDoAjuste[]) => partes.reduce((s, p) => s + Math.max(0, Math.floor(p.creditos)), 0);

/** "o texto", "o texto em 2 redes e a arte", "as lâminas 1 e 3". */
export function resumoDasPartes(partes: ParteDoAjuste[]): string {
  const laminas = partes.filter((p) => p.chave.startsWith("lamina-")).map((p) => Number(p.chave.slice(7)) + 1);
  const outras = partes.filter((p) => !p.chave.startsWith("lamina-")).map((p) => p.rotulo);
  if (laminas.length) outras.push(laminas.length === 1 ? `a lâmina ${laminas[0]}` : `as lâminas ${laminas.slice(0, -1).join(", ")} e ${laminas.at(-1)}`);
  if (!outras.length) return "";
  return outras.length === 1 ? outras[0] : `${outras.slice(0, -1).join(", ")} e ${outras.at(-1)}`;
}

/**
 * QUANTO CUSTA O AJUSTE DE UM DIA DA CAMPANHA, pela tabela de sempre (a mesma
 * de `custoDeRefazerPeca`): cada texto reescrito é um `post_text`; a arte é
 * uma geração por PROPORÇÃO (o recorte das outras redes não paga); no
 * carrossel, cada lâmina refeita é uma geração. Data e rede tirada não geram
 * nada. Levar para uma rede nova já cobra no caminho dele (levar-para-outra-rede),
 * então entra só como aviso "à parte".
 */
export function custoDoAjusteDoDia(p: {
  acoes: Array<{ tipo: string; incluir?: unknown }>;
  /** Quantos textos distintos (rede e conteúdo) o pedido reescreve. */
  textosDistintos: number;
  /** O formato da arte do dia: "carousel", "image", "infographic", "text". */
  formato: string;
  redes: string[];
  /** As lâminas que o pedido refaz (índices), quando é carrossel. */
  laminasAlvo: number[];
  /** O dia tem arte para refazer? Sem arte, o pedido de arte responde "não tem imagem" e não gera nada. */
  temArte: boolean;
  /** Quantas redes novas o pedido inclui (já tirando as que o dia tem). */
  redesNovas?: number;
}): { creditos: number; partes: ParteDoAjuste[]; aParte: { creditos: number; oQue: string } | null } {
  const partes: ParteDoAjuste[] = [];
  const temTexto = p.acoes.some((a) => a.tipo === "texto");
  const temArteNoPedido = p.acoes.some((a) => a.tipo === "arte");
  if (temTexto && p.textosDistintos > 0) {
    partes.push({ chave: "texto", rotulo: p.textosDistintos === 1 ? "o texto" : `o texto em ${p.textosDistintos} redes`, creditos: CREDIT_COSTS.post_text * p.textosDistintos });
  }
  if (temArteNoPedido && p.temArte) {
    if (p.formato === "carousel" || p.laminasAlvo.length > 1) {
      for (const i of p.laminasAlvo) partes.push({ chave: `lamina-${i}`, rotulo: `a lâmina ${i + 1}`, creditos: CREDIT_COSTS.carousel_lamina });
    } else {
      const tipo = p.formato === "infographic" ? "infographic" : "image";
      const geracoes = Math.max(1, gruposDeFormato(p.redes.length ? p.redes : ["instagram"], tipo).length);
      partes.push({ chave: "arte", rotulo: tipo === "infographic" ? "o infográfico" : "a arte", creditos: custoDaMidia(tipo) * geracoes });
    }
  }
  const novas = Math.max(0, Math.floor(p.redesNovas ?? 0));
  const aParte = novas > 0 ? { creditos: CREDIT_COSTS.post_text * novas, oQue: novas === 1 ? "levar a peça para a rede nova" : `levar a peça para ${novas} redes novas` } : null;
  return { creditos: soma(partes), partes, aParte };
}

/** A arte de um card de mídia sem dia: uma geração por proporção, ou uma lâmina quando o pedido é de uma lâmina só. */
export function custoDaArteAvulsa(p: { formato: string; redes: string[]; laminaAlvo: number | null }): { creditos: number; partes: ParteDoAjuste[] } {
  const partes: ParteDoAjuste[] =
    p.laminaAlvo !== null
      ? [{ chave: `lamina-${p.laminaAlvo}`, rotulo: `a lâmina ${p.laminaAlvo + 1}`, creditos: CREDIT_COSTS.carousel_lamina }]
      : [
          {
            chave: "arte",
            rotulo: p.formato === "infographic" ? "o infográfico" : "a arte",
            creditos: custoDaMidia(p.formato === "infographic" ? "infographic" : "image") * Math.max(1, gruposDeFormato(p.redes.length ? p.redes : ["instagram"], p.formato === "infographic" ? "infographic" : "image").length),
          },
        ];
  return { creditos: soma(partes), partes };
}

/** N textos reescritos (o card do redator, o Paulo do dia de vídeo, a regra de "nunca cite"). */
export function custoDosTextos(textos: number, rotulo?: string): { creditos: number; partes: ParteDoAjuste[] } {
  const n = Math.max(0, Math.floor(textos));
  const partes: ParteDoAjuste[] = n > 0 ? [{ chave: "texto", rotulo: rotulo ?? (n === 1 ? "o texto" : `${n} textos`), creditos: CREDIT_COSTS.post_text * n }] : [];
  return { creditos: soma(partes), partes };
}

/** O pedido gera algo pago? Só então pede motivo e cobra. */
export function geraAlgoPago(partes: ParteDoAjuste[]): boolean {
  return partes.some((p) => p.creditos > 0);
}

/**
 * AS AÇÕES QUE O CHAT FAZ DIRETO, SEM MOTIVO: só data e rede. Texto e arte
 * nunca passam por esta porta, nem quando a cotação deu zero (a arte pedida num
 * dia sem imagem): quem filtra é esta função, e não a conta.
 */
export function acoesSemCusto<A extends { tipo: string }>(acoes: A[]): A[] {
  return acoes.filter((a) => a.tipo === "data" || a.tipo === "rede");
}

/**
 * O QUE NÃO SAIU VOLTA. As etapas do pedido (lib/media/pedido-do-card.ts)
 * dizem o que foi feito; a parte cotada cuja etapa falhou, ficou igual ou nem
 * rodou é devolvida. "Já estava assim" e "saiu igual" também voltam: o cliente
 * pagou por uma mudança que não aconteceu.
 */
export function creditosNaoEntregues(partes: ParteDoAjuste[], etapas: Array<{ chave: string; estado: string; detalhe?: string }>): number {
  let volta = 0;
  for (const parte of partes) {
    const e = etapas.find((x) => x.chave === parte.chave);
    const entregue = e && e.estado === "feito" && !/já estava assim|saiu igual/i.test(e.detalhe ?? "");
    if (!entregue) volta += Math.max(0, Math.floor(parte.creditos));
  }
  return volta;
}

// ── O motivo ────────────────────────────────────────────────────────────────

/** Os botões do chat: as MESMAS categorias da janela de reprovação, com o rótulo curto. */
export const BOTOES_DO_MOTIVO: Array<{ id: CategoriaDeReprovacao; rotulo: string; classe: "gosto" | "erro" }> = CATEGORIAS_DE_REPROVACAO.map((c) => ({
  id: c.id,
  rotulo: c.nome,
  classe: c.classe,
}));

/** O saldo cobre o custo? Acesso interno (sem débito) sempre cobre. */
export function saldoCobre(p: { creditos: number; saldo: number; interno?: boolean }): boolean {
  return Boolean(p.interno) || p.creditos <= 0 || p.saldo >= p.creditos;
}

const n = (x: number) => x.toLocaleString("pt-BR");
const creditosPorExtenso = (x: number, carteira: CarteiraDoAjuste = "plano") => `${n(x)} ${x === 1 ? "crédito" : "créditos"}${carteira === "video" ? " de vídeo" : ""}`;

/**
 * A PERGUNTA DO MOTIVO, no chat, com o custo e o saldo ANTES de qualquer
 * geração. Sem travessão.
 */
export function perguntaDoMotivo(p: { resumo: string; creditos: number; carteira: CarteiraDoAjuste; saldo: number | null; interno?: boolean; aParte?: { creditos: number; oQue: string } | null; aindaGratis?: boolean }): string {
  const oQue = p.resumo ? `refazer ${p.resumo}` : "fazer esse ajuste";
  const custo = p.aindaGratis
    ? `Esta peça ainda tem um refazer grátis por erro confirmado: este ajuste não cobra.`
    : `Se for gosto ou pedido diferente, ${oQue} custa ${creditosPorExtenso(p.creditos, p.carteira)}${p.interno ? " (acesso interno: fica no extrato e não sai do saldo)" : p.saldo !== null ? `, e o seu saldo é de ${creditosPorExtenso(p.saldo, p.carteira)}` : ""}.`;
  const erro = "Se for erro da plataforma, eu confiro com as provas automáticas: confirmado, os créditos da peça voltam e o ajuste sai de graça; se não confirmar, cobro agora e um admin olha o caso, devolvendo se reconhecer o erro.";
  const aParte = p.aParte ? ` ${p.aParte.oQue.charAt(0).toUpperCase()}${p.aParte.oQue.slice(1)} cobra à parte, ${creditosPorExtenso(p.aParte.creditos)}, quando a peça chegar lá.` : "";
  return `Antes de ${oQue}, me diga o motivo do ajuste nos botões abaixo. ${custo} ${erro}${aParte}`;
}

/** Sem saldo: nada foi refeito, e o que fazer. Membro da equipe recebe a frase do dono (vem pronta do servidor). */
export function fraseSemSaldo(p: { creditos: number; saldo: number; carteira: CarteiraDoAjuste; doMembro?: string | null }): string {
  if (p.doMembro) return `Não refiz nada: ${p.doMembro}`;
  const falta = Math.max(0, p.creditos - p.saldo);
  return p.carteira === "video"
    ? `Não refiz nada: o ajuste custa ${creditosPorExtenso(p.creditos, "video")} e você tem ${creditosPorExtenso(p.saldo, "video")}. Compre um pacote de vídeo em Planos e créditos, ou peça uma duração menor.`
    : `Não refiz nada: o ajuste custa ${creditosPorExtenso(p.creditos)} e você tem ${creditosPorExtenso(p.saldo)} (faltam ${n(falta)}). Compre mais créditos em Planos e créditos e escolha o motivo de novo; o pedido fica guardado aqui.`;
}

/** A resposta depois do motivo, antes de o trabalho terminar. */
export function fraseDoMotivoRecebido(p: {
  categoria: CategoriaDeReprovacao;
  situacao: SituacaoDaReprovacao;
  cobrado: number;
  carteira: CarteiraDoAjuste;
  cortesia: string | null;
  creditosDevolvidos: number;
  saldoDepois: number | null;
  /** Quem cobra é outro caminho (o vídeo); a frase não diz número cobrado. */
  cobradoDepois?: boolean;
}): string {
  const motivo = `Motivo: ${NOME_DA_CATEGORIA[p.categoria].toLowerCase()}.`;
  const saldo = p.saldoDepois !== null ? ` Seu saldo agora: ${creditosPorExtenso(p.saldoDepois, p.carteira)}.` : "";
  if (p.cortesia) {
    const devolvido = p.creditosDevolvidos > 0 ? ` Os ${creditosPorExtenso(p.creditosDevolvidos)} da peça voltaram ao seu saldo.` : "";
    return `${motivo} ${p.situacao === "devolvido" ? "O erro foi confirmado pelas provas" : "Esta peça tinha um refazer grátis"}: o ajuste sai sem cobrança.${devolvido}${saldo} Estou refazendo agora.`;
  }
  const cobranca = p.cobradoDepois ? "O custo sai da carteira quando o trabalho começar." : `Cobrei ${creditosPorExtenso(p.cobrado, p.carteira)}.${saldo}`;
  if (classeDaCategoria(p.categoria) === "gosto") return `${motivo} ${cobranca} Estou refazendo agora; o que não sair volta para o seu saldo.`;
  return `${motivo} As provas automáticas não confirmaram sozinhas o erro, então um admin vai olhar o caso. ${cobranca} Estou refazendo agora; se o admin reconhecer o erro, os créditos voltam.`;
}

/** A frase da devolução do que não saiu, para o chat. */
export function fraseDaDevolucao(creditos: number): string {
  return creditos > 0 ? `O que não saiu voltou para o seu saldo: ${creditosPorExtenso(creditos)}.` : "";
}

/** A chave do refId do débito do ajuste (o `cobradoDaPeca` soma por `<post>:`). */
export const refDoAjuste = (postId: string, pedidoId: string) => `${postId}:ajuste:${pedidoId}`;
/** O que não saiu volta com esta chave, uma vez só. */
export const refDaSobraDoAjuste = (postId: string, pedidoId: string) => `${postId}:ajuste:${pedidoId}:sobra`;
/** A devolução do ajuste cobrado quando o admin reconhece o erro depois. */
export const refDoAjustePeloAdmin = (postId: string, reprovacaoId: string) => `${postId}:${reprovacaoId}:ajuste`;

/** O evento da tela quando o saldo muda por um ajuste: a faixa do plano relê na hora. */
export const EVENTO_DO_SALDO = "demandou:saldo-mudou";

export const OPERACAO_DO_AJUSTE = "refazer_peca";
export const OPERACAO_DA_SOBRA_DO_AJUSTE = "ajuste_devolucao";
