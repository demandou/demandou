/**
 * AS REGRAS DO ACESSO DE EQUIPE (01/10/2026), num arquivo SEM banco.
 *
 * Sem banco de propósito: a tela de Configurações (componente de cliente)
 * mostra os mesmos números que o servidor aplica, e componente de cliente não
 * importa módulo que toca o banco. Quando cada lado tinha a sua cópia de uma
 * tabela, as cópias divergiram (a lição da tabela de planos de 02/09).
 *
 * Decisão do Bruno de 01/10, com o simulador de acessos na mão:
 * - todos os acessos gastam da cota do DONO (créditos, gravações e carteira de
 *   vídeo); quando ela acaba, ninguém gera até renovar ou recarregar. É isso
 *   que segura a margem: o gasto nunca passa do que o plano paga;
 * - acessos inclusos, contando o dono: Starter 2, Pro 5, Enterprise 10;
 * - acesso extra a R$ 197 por mês, que soma créditos e 1 gravação por mês à
 *   cota. Eram 2.000 créditos até 08/10 (R$ 54 de IA contra R$ 197 brutos,
 *   72,6%); com a régua conferida sobre o LÍQUIDO (R$ 175,55 depois de 6% de
 *   imposto e do Stripe) e o dólar a R$ 5,60, 2.000 davam 32% de custo, e
 *   1.800 dão 28,9% (margem de 71%). O número vale para a cota e para a
 *   frase do cartão; o contrato (Anexo I) cita o mesmo.
 */

/** Acessos inclusos por plano, CONTANDO o dono. Chaves são o `User.plan`. */
export const ACESSOS_INCLUSOS: Record<string, number> = {
  pro: 2, // Starter
  business: 5, // Pro
  studio: 10, // Enterprise
};

export const ACESSO_EXTRA = {
  precoMensal: 197,
  // Até 08/10: 2000.
  creditosPorMes: 1800,
  gravacoesPorMes: 1,
} as const;

/** Acessos que a conta pode ter ao todo (dono incluso). Sem plano: só o dono. */
export function acessosDaConta(plan: string | null | undefined, extras: number, admin = false): number {
  // Acesso interno não tem cobrança nem cota; o teto aqui é só para a tela
  // não prometer infinito.
  if (admin) return 50;
  const inclusos = plan ? (ACESSOS_INCLUSOS[plan] ?? 1) : 1;
  return inclusos + Math.max(0, extras);
}

/**
 * Quantas MARCAS (projetos) a conta pode ter com a equipe (01/10, aprovado):
 * a maior entre as marcas do plano e os acessos inclusos, mais uma por acesso
 * extra. Sem isso, o Enterprise venderia 10 acessos e só 5 marcas, e o dono que
 * cria um projeto por vendedor esbarraria na sexta. Marca não tem custo próprio:
 * o custo vem de créditos e gravações, que continuam travados na cota.
 */
export function marcasDaConta(marcasDoPlano: number, plan: string | null | undefined, extras: number): number {
  const inclusos = plan ? (ACESSOS_INCLUSOS[plan] ?? 0) : 0;
  return Math.max(marcasDoPlano, inclusos) + Math.max(0, extras);
}

/** Créditos por ciclo da conta: os do plano mais os dos acessos extras. */
export function creditosDoCiclo(creditosDoPlano: number, extras: number): number {
  return creditosDoPlano + Math.max(0, extras) * ACESSO_EXTRA.creditosPorMes;
}

/** Gravações por ciclo da conta: as do plano mais as dos acessos extras. */
export function gravacoesDoCiclo(gravacoesDoPlano: number, extras: number): number {
  return gravacoesDoPlano + Math.max(0, extras) * ACESSO_EXTRA.gravacoesPorMes;
}

function plural(n: number, um: string, varios: string): string {
  return n === 1 ? um : varios;
}

/**
 * A UNIDADE DO TETO DE GRAVAÇÕES, escrita uma vez só (06/10).
 *
 * O que o servidor conta, conferido no código antes de escrever a frase: cada
 * envio aceito grava UMA linha `gravacao_enviada` no extrato da conta, com o
 * membro como autor (`registrarGravacao` em lib/limites-do-plano.ts), e o teto
 * do membro conta essas linhas no ciclo (`consumoDoMembro`). Então:
 *  - cada vídeo que a pessoa sobe conta 1, de qualquer duração (a duração tem
 *    teto próprio, o do plano, e pesa nos créditos, não aqui);
 *  - os cortes que saem do vídeo não contam: eles são créditos;
 *  - vídeo cancelado depois de enviado continua contando: a linha do extrato
 *    não é apagada, e é de propósito (a esteira já rodou o caro);
 *  - o vídeo do gêmeo digital não conta no teto do membro: ele entra na esteira
 *    sem passar por `registrarGravacao` e é pago em créditos.
 */
export const TETO_DE_GRAVACOES = {
  rotulo: "Vídeos gravados por mês (envios)",
  ajuda: "Cada vídeo que a pessoa sobe conta 1, de qualquer duração. Os cortes que saem dele não contam, e um vídeo cancelado depois de enviado continua contando.",
  /** O nome curto da coluna e do consumo: "vídeos enviados". */
  curto: "Vídeos enviados",
} as const;

export const TETO_DE_CREDITOS = {
  rotulo: "Créditos por mês",
  curto: "Créditos usados",
} as const;

/** A frase do teto de gravações do membro, aprovada no pedido de 01/10 e com a unidade de 06/10. */
export function fraseDoTetoDeGravacoes(usadas: number, teto: number): string {
  const u = Math.min(usadas, teto);
  return `Você já enviou ${u} de ${teto} ${plural(teto, "vídeo gravado", "vídeos gravados")} que a sua equipe liberou para você este mês. Cada vídeo enviado conta 1, de qualquer duração.`;
}

/** A frase do teto de créditos do membro, no mesmo molde. */
export function fraseDoTetoDeCreditos(usados: number, teto: number, precisa?: number): string {
  const n = (v: number) => v.toLocaleString("pt-BR");
  const u = Math.min(usados, teto);
  const pedido = precisa ? ` Este trabalho precisa de ${n(precisa)}.` : "";
  return `Você já usou ${n(u)} de ${n(teto)} créditos que a sua equipe liberou para você este mês.${pedido}`;
}

/**
 * A frase de quando a cota DA CONTA acabou, para quem é membro: ele não vê
 * cobrança nem pode comprar, então "faça upgrade" seria um botão sem porta.
 */
export function fraseDaCotaDaEquipe(args: { usadas: number; limite: number; renovaEm: string | null; diaEMes: (iso: string) => string; dono?: string | null }): string {
  const u = Math.min(args.usadas, args.limite);
  const libera = args.renovaEm ? ` A próxima libera em ${args.diaEMes(args.renovaEm)}.` : "";
  return `A sua equipe já usou ${u} de ${args.limite} ${plural(args.limite, "gravação", "gravações")} deste mês.${libera} Para liberar mais, fale com ${quem(args.dono)}.`;
}

/*
 * AS FRASES DO MEMBRO (01/10, acabamento do acesso de equipe). Moram aqui, sem
 * banco, porque o servidor (erro de débito, recusa de rota) e a tela (faixa do
 * topo, janela da campanha) precisam dizer a MESMA coisa. Quando cada lado
 * escrevia a sua, o membro lia "compre mais créditos" num lugar e "fale com
 * quem administra" no outro, e nenhuma das duas dizia com QUEM falar.
 */

/** Quem não sabe o nome do dono ainda precisa de uma frase que funcione. */
function quem(dono: string | null | undefined): string {
  return dono && dono.trim() ? dono.trim() : "quem administra a conta";
}

/**
 * Os créditos da conta não cobrem o que o membro pediu. Sem botão de compra:
 * membro não vê cobrança, e quem resolve é o dono. Com o número quando há,
 * porque "acabaram" é mentira quando ainda sobram 50 e o trabalho custa 120.
 */
export function fraseDosCreditosDaEquipe(dono: string | null | undefined, conta?: { necessario: number; disponivel: number }): string {
  const n = (v: number) => v.toLocaleString("pt-BR");
  if (conta && conta.disponivel > 0) {
    return `Os créditos da equipe não cobrem este trabalho: ele custa ${n(conta.necessario)} e a conta tem ${n(conta.disponivel)}. Peça a ${quem(dono)} para adicionar mais.`;
  }
  return `Os créditos da equipe acabaram. Peça a ${quem(dono)} para adicionar mais.`;
}

/** O que o membro faz num projeto liberado. A recusa e a tela repetem a lista. */
export const O_QUE_O_MEMBRO_FAZ =
  "Como membro da equipe, você sobe vídeos, aprova roteiros, gera campanhas e edita e agenda os posts deste projeto.";

/** A recusa de quando o membro tenta mexer no que é configuração do projeto. */
export function fraseSoODono(dono: string | null | undefined, oQue = "mudar as configurações deste projeto"): string {
  return `Só ${quem(dono)}, que administra a conta, pode ${oQue}. ${O_QUE_O_MEMBRO_FAZ}`;
}

/**
 * A tela do membro quando a assinatura do dono caiu (sem preço, sem plano).
 * A conta não guarda nome de empresa, então a equipe é chamada pelo nome do
 * dono, e a segunda menção usa o primeiro nome para a frase não repetir.
 */
export function fraseDaAssinaturaPausada(dono: string | null | undefined): string {
  const nome = dono?.trim();
  if (!nome) return "A assinatura da sua equipe está pausada. Fale com quem administra a conta para reativar.";
  const primeiro = nome.includes("@") ? nome : nome.split(/\s+/)[0];
  return `A assinatura da equipe de ${nome} está pausada. Fale com ${primeiro} para reativar.`;
}

/*
 * A CONTA LIGADA AO CONTRATO (08/10/2026), o contrato guarda-chuva. Pedido do
 * Bruno: "o contrato do Matheus é guarda-chuva. Ele tem usuários debaixo dele,
 * mas os créditos vêm todos do mesmo lugar. Os vendedores dele disputam os
 * créditos e nunca pode exceder a nossa margem. Tem que ficar bem claro que
 * eles estão consumindo esses créditos."
 *
 * A conta própria que o admin liga ao contrato (contas_do_contrato) passa a
 * ler plano, saldo, carteira de vídeo e cota da conta TITULAR do contrato, como
 * o membro da equipe lê as do dono (lib/equipe/conta.ts resolve, uma vez, para
 * todo débito, estorno e conferência). As regras sem banco moram aqui.
 */

/** Quantos projetos cada pessoa ligada a um contrato pode ter (decisão do Bruno, 08/10). */
export const PROJETOS_POR_PESSOA_DO_CONTRATO = 1;

/** O contrato de onde a conta ligada tira os créditos. */
export type CarteiraDoContrato = {
  /** O nome (ou o e-mail) da titular do contrato. */
  titular: string;
  empresa: string | null;
  numero: number | null;
};

/** "contrato SEED SOLUCOES FINANCEIRAS (titular Matheus Garbelini)". */
export function nomeDaCarteiraDoContrato(c: CarteiraDoContrato): string {
  const empresa = c.empresa?.trim();
  const contrato = empresa ? `contrato ${empresa}` : c.numero ? `contrato nº ${c.numero}` : "contrato";
  return `${contrato} (titular ${c.titular.trim() || "do contrato"})`;
}

/**
 * Os créditos do contrato não cobrem o trabalho. Sem botão de compra: quem
 * repõe é a titular. Com o número quando há, como a frase da equipe.
 * `carteira` é o nome por extenso (nomeDaCarteiraDoContrato), que já diz a
 * titular: a tela recebe só ele, e as duas pontas dizem a mesma coisa.
 */
export function fraseDosCreditosDoContrato(carteira: string, conta?: { necessario: number; disponivel: number }): string {
  const n = (v: number) => v.toLocaleString("pt-BR");
  if (conta && conta.disponivel > 0) {
    return `Os créditos do ${carteira} não cobrem este trabalho: ele custa ${n(conta.necessario)} e o contrato tem ${n(conta.disponivel)}. Peça à titular do contrato para adicionar mais.`;
  }
  return `Os créditos do ${carteira} acabaram. Peça à titular do contrato para adicionar mais.`;
}

/** A frase de sem saldo para quem usa a carteira de outra conta, da equipe ou do contrato. */
export function fraseSemCreditosDaCarteira(e: { dono: string; contrato?: boolean | null }, conta?: { necessario: number; disponivel: number }): string {
  return e.contrato ? fraseDosCreditosDoContrato(e.dono, conta) : fraseDosCreditosDaEquipe(e.dono, conta);
}

/** O rótulo do saldo para quem usa a carteira de outra conta. */
export function rotuloDosCreditosDaCarteira(e: { dono: string; contrato?: boolean | null }): string {
  return e.contrato ? `Créditos do ${e.dono}` : `Créditos da equipe, na conta de ${e.dono}`;
}

/**
 * A recusa de projeto novo para quem já tem o projeto que o contrato dá.
 * `carteira` é o nome por extenso (nomeDaCarteiraDoContrato), que já diz a titular.
 */
export function fraseDoProjetoDoContrato(carteira: string, usados: number, limite = PROJETOS_POR_PESSOA_DO_CONTRATO): string {
  return `Pelo ${carteira}, cada pessoa tem ${limite} projeto${limite > 1 ? "s" : ""}, e você já tem ${usados}. Para outro, fale com a titular do contrato.`;
}

/** A cota de gravações do contrato acabou, para quem está ligado a ele. */
export function fraseDaCotaDoContrato(args: { carteira: string; usadas: number; limite: number; renovaEm: string | null; diaEMes: (iso: string) => string }): string {
  const u = Math.min(args.usadas, args.limite);
  const libera = args.renovaEm ? ` A próxima libera em ${args.diaEMes(args.renovaEm)}.` : "";
  return `O time do ${args.carteira} já usou ${u} de ${args.limite} ${plural(args.limite, "gravação", "gravações")} deste mês.${libera} Para liberar mais, fale com a titular do contrato.`;
}

/**
 * O PLANO E O PAPEL QUE VALEM nos limites (gravações, armazenamento, envio,
 * teste, referências, vídeos do dia), a partir da conta que paga.
 *
 * Sem ligação: o de sempre (o plano e o papel da conta). Com ligação ao
 * contrato: a pessoa NUNCA herda o acesso interno da titular (titular admin não
 * vira "sem limite" para o time: é a margem), e o plano é o da titular quando
 * ela tem um; quando não tem (a titular admin não recebe plano na ativação do
 * contrato), vale o plano do próprio contrato, com os acessos extras dele.
 */
export function planoQueValeNaConta(
  conta: { plan: string | null | undefined; role: string | null | undefined; acessosExtras?: number | null },
  ligacao: { plano: string | null; acessosExtras: number } | null | undefined
): { plan: string | null; admin: boolean; acessosExtras: number } {
  if (!ligacao) return { plan: conta.plan ?? null, admin: conta.role === "admin", acessosExtras: conta.acessosExtras ?? 0 };
  const temPlano = Boolean(conta.plan && conta.plan !== "free");
  return {
    plan: temPlano ? (conta.plan as string) : (ligacao.plano ?? null),
    admin: false,
    acessosExtras: temPlano ? (conta.acessosExtras ?? 0) : Math.max(conta.acessosExtras ?? 0, ligacao.acessosExtras ?? 0),
  };
}

export type PapelNaEquipe = "dono" | "membro";

/*
 * O QUE A TELA DA EQUIPE RECEBE (01/10). Os tipos moram aqui, sem banco, para
 * a aba Equipe (componente de cliente) poder usá-los; quem monta é
 * lib/equipe/convites.ts, no servidor.
 */
export type MembroNoPainel = {
  id: string;
  email: string;
  nome: string | null;
  status: "convidado" | "ativo";
  convitevencido: boolean;
  todosOsProjetos: boolean;
  projetos: string[];
  tetoGravacoes: number | null;
  tetoCreditos: number | null;
  consumo: { creditos: number; gravacoes: number; minutos: number };
};

export type PainelDaEquipe = {
  papel: "dono";
  plano: string | null;
  acessos: { inclusos: number; extras: number; total: number; ocupados: number };
  conta: {
    nome: string;
    creditos: number;
    creditosDoCiclo: number;
    creditosDeVideo: number;
    gravacoesUsadas: number;
    gravacoesDoCiclo: number;
    renovaEm: string | null;
    /** O dono também gasta: o consumo dele no ciclo, para o painel fechar. */
    consumoDoDono: { creditos: number; gravacoes: number; minutos: number };
    /** O que membros que já saíram gastaram neste ciclo. */
    consumoDeQuemSaiu: { creditos: number; gravacoes: number; minutos: number };
  };
  projetos: { id: string; nome: string }[];
  membros: MembroNoPainel[];
  /**
   * As contas próprias que o admin ligou ao contrato desta conta (08/10): usam
   * o saldo dela, cada uma no próprio projeto. A titular vê o uso de cada uma.
   */
  ligadas?: Array<{ id: string; email: string; nome: string | null; consumo: { creditos: number; gravacoes: number; minutos: number } }>;
};

export type EquipeNaTela =
  | PainelDaEquipe
  | {
      papel: "membro";
      dono: string;
      tetoGravacoes: number | null;
      tetoCreditos: number | null;
      consumo: { creditos: number; gravacoes: number; minutos: number };
      /** Conta ligada ao contrato (08/10): `dono` é o contrato por extenso, com a titular. */
      contrato?: boolean;
    };


