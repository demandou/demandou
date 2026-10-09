import { contaEhDaEquipe, familiaDaOperacao, NOME_DA_FAMILIA, operacaoEhRecarga, type Familia } from "@/lib/admin/tipos-do-uso-de-ia";

/**
 * CONTRATOS E CONTAS, CASO A CASO (08/10/2026), a parte sem banco.
 *
 * Pedido do Bruno: "como eu sei que o contrato é do Matheus, ele pagou X, e
 * ele e o time dele usaram Y. Preciso dessa análise caso a caso, para
 * entender quais contratos são melhores, quais usuários usam mais ou menos".
 *
 * UM CASO é uma conta TITULAR e o time dela:
 *  - a titular é a conta do contrato (`contratos.userId`); sem contrato, uma
 *    conta com plano vira o próprio caso;
 *  - o time é quem entrou pela equipe da conta (membros_da_equipe, o acesso de
 *    equipe de 01/10) MAIS as contas próprias que o admin ligou ao contrato na
 *    tela (contas_do_contrato, 08/10). A ligação é sempre escolha do admin:
 *    nada aqui adivinha de quem é uma conta pelo e-mail ou pelo nome.
 *
 * AS REGRAS DO DINHEIRO, que mandam em toda linha:
 *  - RECEITA é só pagamento confirmado, lido por lib/admin/receita-real.ts
 *    pela regra pura de lib/admin/regra-da-receita.ts. Este módulo recebe a
 *    lista já confirmada e NUNCA soma valor de contrato, valor registrado no
 *    gestor, mensalidade de tabela ou plano liberado como receita;
 *  - contrato enviado, rascunho ou assinado sem pagamento não é receita: o
 *    valor dele sai como "contratado (projeção)", em coluna própria;
 *  - conta de cortesia, de teste e da equipe aparece MARCADA ("sem receita"),
 *    e o caso diz por que não tem receita;
 *  - CUSTO é o registro de uso dos fornecedores (ai_usage), em dólar, pelo
 *    dono do projeto; convertido pelo dólar do ambiente, dito na tela.
 *
 * O USO de cada pessoa:
 *  - créditos: o extrato pela pessoa que FEZ (autorId; sem ele, a conta que
 *    pagou), líquido de estorno e sem recarga. Conta de admin debita zero e
 *    deixa escrito quanto "custaria": isso entra como uso, separado;
 *  - custo de IA, posts e peças: pelos projetos de que a pessoa é DONA. O
 *    registro de IA não guarda quem clicou, só o projeto; o membro da equipe
 *    que trabalha no projeto do dono aparece com o uso dele no dono, e a tela
 *    diz isso em vez de ratear (rateio seria número inventado);
 *  - gravações e minutos: pela pessoa que enviou o vídeo (video_jobs.userId).
 */

export type MarcaDaConta = "pagante" | "equipe" | "teste" | "cortesia" | "sem_plano";

export const NOME_DA_MARCA: Record<MarcaDaConta, string> = {
  pagante: "Pagante",
  equipe: "Equipe, sem receita",
  teste: "Em teste, sem receita",
  cortesia: "Cortesia, sem receita",
  sem_plano: "Sem plano",
};

export const COR_DA_MARCA: Record<MarcaDaConta, string> = {
  pagante: "var(--badge-success-text)",
  equipe: "var(--text-muted)",
  teste: "var(--badge-warning-text)",
  cortesia: "var(--badge-warning-text)",
  sem_plano: "var(--text-muted)",
};

export type ContaCrua = {
  id: string;
  email: string;
  nome: string | null;
  plano: string;
  papel: string;
  contaInterna: boolean;
  trialEndsAt: string | null;
  cadastroEm: string;
  /** A sessão mais recente (a renovação da sessão é o que marca o acesso). */
  ultimoAcesso: string | null;
};

export type ContratoCru = {
  id: string;
  numero: number;
  userId: string;
  planoNome: string;
  valorCentavos: number;
  /** A situação calculada (lib/contratos/situacao.ts). */
  situacao: string;
  situacaoNome: string;
  /** O grupo do gestor: rascunho, enviado, aguardando_pagamento, ativo, vencido, cancelado. */
  grupo: string;
  empresa: string | null;
  signatarioNome: string | null;
  signatarioEmail: string | null;
  /** O que foi REGISTRADO no gestor (com e sem comprovante): não é receita, é registro. */
  registradoCentavos: number;
  pagoEm: string | null;
  assinadoEm: string | null;
  inicio: string | null;
  fim: string | null;
  criadoEm: string;
  descontoPercentual: number;
};

/** Um pagamento CONFIRMADO, como lib/admin/receita-real.ts devolve. */
export type PagamentoConfirmado = {
  id: string;
  contaId: string | null;
  quando: string;
  reais: number;
  forma: string;
  origem: "stripe" | "por_fora";
  descricao: string;
};

export type LancamentoFora = {
  /** O e-mail da conta (receita-real guarda o rótulo, não o id). */
  conta: string;
  quando: string;
  reais: number;
  motivo: "equipe" | "sem_comprovante" | "sem_conta";
  descricao: string;
};

export type MembroCru = { donoId: string; userId: string | null; status: string; email: string; nome: string | null };

export type VinculoCru = { userId: string; titularId: string; definidoPor: string | null; criadoEm: string; observacao: string | null };

export type ProjetoCru = { id: string; nome: string; donoId: string };

/** Extrato agregado: quem fez, quem pagou, mês (AAAA-MM em São Paulo) e operação. */
export type LinhaDoExtrato = { pessoaId: string; contaId: string; mes: string; operacao: string; creditos: number; custariam: number; n: number };

/** Custo de IA agregado por projeto, mês e operação. */
export type LinhaDeCusto = { projectId: string; mes: string; operacao: string; usd: number; n: number };

export type LinhaDeGravacao = { pessoaId: string; mes: string; n: number; segundos: number };

export type LinhaDePosts = { projectId: string; mes: string; geradas: number; publicadas: number };

export type EntradaDosCasos = {
  agora: Date;
  /** A janela do período: [desde, ate). Os agregados de uso já chegam filtrados nela. */
  desde: Date;
  ate: Date;
  dolar: number;
  contas: ContaCrua[];
  contratos: ContratoCru[];
  /** Pagamentos confirmados DESDE SEMPRE (a janela é aplicada aqui). */
  pagamentos: PagamentoConfirmado[];
  /** O que não entrou na receita, desde sempre, com o motivo. */
  fora: LancamentoFora[];
  membros: MembroCru[];
  vinculos: VinculoCru[];
  projetos: ProjetoCru[];
  extrato: LinhaDoExtrato[];
  custos: LinhaDeCusto[];
  gravacoes: LinhaDeGravacao[];
  posts: LinhaDePosts[];
};

export type Uso = {
  /** Créditos debitados de verdade (plano e vídeo), líquidos de estorno. */
  creditos: number;
  /** Créditos que a conta de admin teria pago (debitou zero). */
  creditosQueCustariam: number;
  chamadasDeIa: number;
  custoUsd: number;
  custoReais: number;
  gravacoes: number;
  minutos: number;
  postsGerados: number;
  postsPublicados: number;
};

export const usoVazio = (): Uso => ({
  creditos: 0,
  creditosQueCustariam: 0,
  chamadasDeIa: 0,
  custoUsd: 0,
  custoReais: 0,
  gravacoes: 0,
  minutos: 0,
  postsGerados: 0,
  postsPublicados: 0,
});

function somarUso(a: Uso, b: Uso): Uso {
  return {
    creditos: a.creditos + b.creditos,
    creditosQueCustariam: a.creditosQueCustariam + b.creditosQueCustariam,
    chamadasDeIa: a.chamadasDeIa + b.chamadasDeIa,
    custoUsd: a.custoUsd + b.custoUsd,
    custoReais: a.custoReais + b.custoReais,
    gravacoes: a.gravacoes + b.gravacoes,
    minutos: a.minutos + b.minutos,
    postsGerados: a.postsGerados + b.postsGerados,
    postsPublicados: a.postsPublicados + b.postsPublicados,
  };
}

/** O uso que mede "quem usa mais": créditos debitados mais os simulados da conta de admin. */
export const creditosDeUso = (u: Uso) => u.creditos + u.creditosQueCustariam;

export type PapelNoCaso = "titular" | "membro" | "ligada";

export const NOME_DO_PAPEL: Record<PapelNoCaso, string> = {
  titular: "Titular do contrato",
  membro: "Membro da equipe da conta",
  ligada: "Conta própria ligada ao contrato",
};

export type UsoPorMes = Uso & { mes: string };
export type CreditosPorOperacao = { operacao: string; creditos: number; custariam: number; lancamentos: number };
export type CustoPorFamilia = { familia: Familia; nome: string; usd: number; reais: number; chamadas: number };

export type PessoaDoCaso = {
  id: string;
  email: string;
  nome: string | null;
  plano: string;
  papel: PapelNoCaso;
  marca: MarcaDaConta;
  ultimoAcesso: string | null;
  cadastroEm: string;
  /** Quem ligou a conta ao contrato e quando (só "ligada"). */
  ligacao: { definidoPor: string | null; criadoEm: string; observacao: string | null } | null;
  /** O status na equipe (só "membro"): ativo ou removido. */
  statusNaEquipe: string | null;
  projetos: Array<{ id: string; nome: string }>;
  uso: Uso;
  porMes: UsoPorMes[];
  creditosPorOperacao: CreditosPorOperacao[];
  custoPorFamilia: CustoPorFamilia[];
  /** Pagamentos confirmados DESTA conta no período. */
  receitaReais: number;
};

export type CasoDeContrato = {
  /** O id da conta titular: a chave do drill down (/admin/contas/[titularId]). */
  titularId: string;
  tipo: "contrato" | "conta";
  titular: { id: string; email: string; nome: string | null; marca: MarcaDaConta };
  empresa: string | null;
  signatario: { nome: string | null; email: string | null } | null;
  /** O contrato que manda: o mais recente que não foi cancelado; sem ele, o mais recente. */
  contratoPrincipal: ContratoCru | null;
  contratos: ContratoCru[];
  plano: string;
  /** PROJEÇÃO: o valor do contrato principal, em reais. Não é receita. */
  contratadoReais: number;
  /** O que foi registrado no gestor de contratos (com e sem comprovante). Não é receita. */
  registradoReais: number;
  /** Pagamentos confirmados das contas do caso, no período. */
  pagamentos: PagamentoConfirmado[];
  receitaReais: number;
  /** Pagamentos confirmados desde sempre (para "ele pagou X"). */
  receitaDesdeSempreReais: number;
  /** O que foi pago ou registrado e ficou fora da receita, no período. */
  fora: LancamentoFora[];
  semReceita: boolean;
  /** Por que o caso não tem receita, na língua do dono. Null quando tem. */
  motivoSemReceita: string | null;
  pessoas: PessoaDoCaso[];
  /** O uso do time inteiro, somado. */
  uso: Uso;
  margemReais: number;
  /** Quanto de IA custou cada real recebido. Null sem receita. */
  custoPorReal: number | null;
  ultimoAcesso: string | null;
  alertas: string[];
};

export type UsuarioNoRanking = {
  pessoaId: string;
  email: string;
  nome: string | null;
  marca: MarcaDaConta;
  titularId: string;
  caso: string;
  uso: Uso;
  ultimoAcesso: string | null;
};

export type ResultadoDosCasos = {
  casos: CasoDeContrato[];
  /** Os casos do melhor para o pior: margem, e entre iguais o menor custo. */
  ranking: CasoDeContrato[];
  /** As pessoas de todos os casos, de quem mais usa para quem menos usa. */
  usuarios: UsuarioNoRanking[];
  totais: {
    receitaReais: number;
    custoReais: number;
    custoUsd: number;
    margemReais: number;
    casos: number;
    contratos: number;
    pessoas: number;
    semReceita: number;
  };
};

const FUSO = "America/Sao_Paulo";
const naJanela = (iso: string, desde: Date, ate: Date) => {
  const t = new Date(iso).getTime();
  return t >= desde.getTime() && t < ate.getTime();
};
const maisRecente = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b);

/** O mês em São Paulo (AAAA-MM), o mesmo recorte do SQL. */
export function mesDe(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: FUSO }).slice(0, 7);
}

/**
 * A MARCA DA CONTA, por ordem: equipe (admin, `contaInterna` ou e-mail da
 * casa) nunca é receita; quem tem pagamento confirmado é pagante; teste em
 * curso é teste; plano liberado sem pagamento é cortesia; o resto é sem plano.
 */
export function marcaDaConta(c: Pick<ContaCrua, "id" | "email" | "papel" | "contaInterna" | "plano" | "trialEndsAt">, jaPagou: Set<string>, agora: Date): MarcaDaConta {
  if (contaEhDaEquipe({ email: c.email, role: c.papel, contaInterna: c.contaInterna })) return "equipe";
  if (jaPagou.has(c.id)) return "pagante";
  if (c.trialEndsAt && new Date(c.trialEndsAt).getTime() > agora.getTime()) return "teste";
  if (c.plano && c.plano !== "free") return "cortesia";
  return "sem_plano";
}

/** O contrato que manda num caso: o mais recente não cancelado; sem ele, o mais recente. */
export function contratoPrincipal(contratos: ContratoCru[]): ContratoCru | null {
  if (!contratos.length) return null;
  const ordenados = [...contratos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm) || b.numero - a.numero);
  return ordenados.find((c) => c.grupo !== "cancelado") ?? ordenados[0];
}

/** Por que um caso não tem receita, olhando o contrato e a marca da titular. */
export function motivoSemReceita(principal: ContratoCru | null, marcaDaTitular: MarcaDaConta, temFora: boolean): string {
  if (marcaDaTitular === "equipe")
    return "a conta titular é da equipe (admin, marcada como da equipe ou e-mail @demandou.com): pagamento dela fica fora da receita";
  if (principal) {
    switch (principal.grupo) {
      case "rascunho":
        return `contrato nº ${principal.numero} em rascunho: não foi enviado nem assinado`;
      case "enviado":
        return `contrato nº ${principal.numero} enviado e não assinado: contrato sem assinatura não é receita`;
      case "aguardando_pagamento":
        return `contrato nº ${principal.numero} assinado e sem pagamento confirmado`;
      case "cancelado":
        return `contrato nº ${principal.numero} cancelado, sem pagamento confirmado`;
      default:
        return temFora
          ? `contrato nº ${principal.numero} com pagamento registrado sem comprovante: fica fora até o comprovante entrar`
          : `contrato nº ${principal.numero} sem pagamento confirmado no período`;
    }
  }
  if (marcaDaTitular === "cortesia") return "plano de cortesia: liberado sem pagamento";
  if (marcaDaTitular === "teste") return "em período de teste: ainda não pagou";
  if (marcaDaTitular === "sem_plano") return "sem plano e sem pagamento";
  return "sem pagamento confirmado no período";
}

type Acumulador = {
  uso: Uso;
  porMes: Map<string, Uso>;
  porOperacao: Map<string, CreditosPorOperacao>;
  porFamilia: Map<Familia, CustoPorFamilia>;
};

const novoAcumulador = (): Acumulador => ({ uso: usoVazio(), porMes: new Map(), porOperacao: new Map(), porFamilia: new Map() });

function noMes(a: Acumulador, mes: string): Uso {
  const atual = a.porMes.get(mes) ?? usoVazio();
  a.porMes.set(mes, atual);
  return atual;
}

/**
 * MONTA OS CASOS. Pura: recebe tudo lido (lib/admin/contas/leitura.ts) e
 * devolve os casos, o ranking dos contratos e o das pessoas.
 */
export function montarCasos(e: EntradaDosCasos): ResultadoDosCasos {
  const contas = new Map(e.contas.map((c) => [c.id, c]));
  const jaPagou = new Set(e.pagamentos.map((p) => p.contaId).filter((x): x is string => Boolean(x)));
  const marca = (id: string) => {
    const c = contas.get(id);
    return c ? marcaDaConta(c, jaPagou, e.agora) : "sem_plano";
  };

  // ── Quem é titular, quem é do time de quem ─────────────────────────────
  const contratosPorTitular = new Map<string, ContratoCru[]>();
  for (const c of e.contratos) contratosPorTitular.set(c.userId, [...(contratosPorTitular.get(c.userId) ?? []), c]);

  /** pessoa -> titular. Uma pessoa entra em UM caso só: titular > membro > ligada. */
  const casoDaPessoa = new Map<string, { titularId: string; papel: PapelNoCaso }>();
  const titulares: string[] = [];
  const virarTitular = (id: string) => {
    if (casoDaPessoa.has(id) || !contas.has(id)) return;
    casoDaPessoa.set(id, { titularId: id, papel: "titular" });
    titulares.push(id);
  };
  for (const id of contratosPorTitular.keys()) virarTitular(id);
  // Quem tem conta ligada é titular mesmo sem contrato (o grupo existe).
  for (const v of e.vinculos) if (!casoDaPessoa.has(v.userId)) virarTitular(v.titularId);

  const membroPorPessoa = new Map<string, MembroCru>();
  for (const m of e.membros) {
    if (!m.userId || (m.status !== "ativo" && m.status !== "removido")) continue;
    if (!casoDaPessoa.has(m.donoId) && contas.has(m.donoId)) {
      const dono = contas.get(m.donoId)!;
      // A dona de uma equipe com plano é um caso, mesmo sem contrato.
      if (dono.plano !== "free" || contratosPorTitular.has(m.donoId)) virarTitular(m.donoId);
    }
    if (casoDaPessoa.has(m.userId) || !casoDaPessoa.has(m.donoId)) continue;
    // O membro ativo vence o removido da mesma pessoa.
    const anterior = membroPorPessoa.get(m.userId);
    if (anterior && anterior.status === "ativo") continue;
    membroPorPessoa.set(m.userId, m);
  }
  for (const [pessoa, m] of membroPorPessoa) {
    const titularId = casoDaPessoa.get(m.donoId)?.titularId ?? m.donoId;
    casoDaPessoa.set(pessoa, { titularId, papel: "membro" });
  }

  const vinculoPorPessoa = new Map<string, VinculoCru>();
  for (const v of e.vinculos) {
    if (casoDaPessoa.has(v.userId) || !contas.has(v.userId) || !casoDaPessoa.has(v.titularId)) continue;
    const titularId = casoDaPessoa.get(v.titularId)!.titularId;
    casoDaPessoa.set(v.userId, { titularId, papel: "ligada" });
    vinculoPorPessoa.set(v.userId, v);
  }

  // Conta com plano que não é de ninguém vira o próprio caso ("conta sem contrato").
  for (const c of e.contas) if (c.plano && c.plano !== "free") virarTitular(c.id);

  // ── O uso, acumulado por pessoa ────────────────────────────────────────
  const acumulado = new Map<string, Acumulador>();
  const de = (pessoa: string) => {
    const a = acumulado.get(pessoa) ?? novoAcumulador();
    acumulado.set(pessoa, a);
    return a;
  };
  const donoDoProjeto = new Map(e.projetos.map((p) => [p.id, p.donoId]));

  for (const l of e.extrato) {
    if (operacaoEhRecarga(l.operacao)) continue;
    if (!casoDaPessoa.has(l.pessoaId)) continue;
    const a = de(l.pessoaId);
    a.uso.creditos += l.creditos;
    a.uso.creditosQueCustariam += l.custariam;
    const m = noMes(a, l.mes);
    m.creditos += l.creditos;
    m.creditosQueCustariam += l.custariam;
    const op = a.porOperacao.get(l.operacao) ?? { operacao: l.operacao, creditos: 0, custariam: 0, lancamentos: 0 };
    op.creditos += l.creditos;
    op.custariam += l.custariam;
    op.lancamentos += l.n;
    a.porOperacao.set(l.operacao, op);
  }
  for (const l of e.custos) {
    const dono = donoDoProjeto.get(l.projectId);
    if (!dono || !casoDaPessoa.has(dono)) continue;
    const a = de(dono);
    const reais = l.usd * e.dolar;
    a.uso.custoUsd += l.usd;
    a.uso.custoReais += reais;
    a.uso.chamadasDeIa += l.n;
    const m = noMes(a, l.mes);
    m.custoUsd += l.usd;
    m.custoReais += reais;
    m.chamadasDeIa += l.n;
    const familia = familiaDaOperacao(l.operacao);
    const f = a.porFamilia.get(familia) ?? { familia, nome: NOME_DA_FAMILIA[familia], usd: 0, reais: 0, chamadas: 0 };
    f.usd += l.usd;
    f.reais += reais;
    f.chamadas += l.n;
    a.porFamilia.set(familia, f);
  }
  for (const l of e.gravacoes) {
    if (!casoDaPessoa.has(l.pessoaId)) continue;
    const a = de(l.pessoaId);
    a.uso.gravacoes += l.n;
    a.uso.minutos += l.segundos / 60;
    const m = noMes(a, l.mes);
    m.gravacoes += l.n;
    m.minutos += l.segundos / 60;
  }
  for (const l of e.posts) {
    const dono = donoDoProjeto.get(l.projectId);
    if (!dono || !casoDaPessoa.has(dono)) continue;
    const a = de(dono);
    a.uso.postsGerados += l.geradas;
    a.uso.postsPublicados += l.publicadas;
    const m = noMes(a, l.mes);
    m.postsGerados += l.geradas;
    m.postsPublicados += l.publicadas;
  }

  // ── A receita: só a confirmada, pela conta que pagou ───────────────────
  const pagamentosNaJanela = e.pagamentos.filter((p) => naJanela(p.quando, e.desde, e.ate));
  const receitaDaConta = new Map<string, number>();
  for (const p of pagamentosNaJanela) if (p.contaId) receitaDaConta.set(p.contaId, (receitaDaConta.get(p.contaId) ?? 0) + p.reais);

  // ── Os casos ───────────────────────────────────────────────────────────
  const pessoasDoTitular = new Map<string, string[]>();
  for (const [pessoa, { titularId }] of casoDaPessoa) pessoasDoTitular.set(titularId, [...(pessoasDoTitular.get(titularId) ?? []), pessoa]);
  const projetosDoDono = new Map<string, Array<{ id: string; nome: string }>>();
  for (const p of e.projetos) projetosDoDono.set(p.donoId, [...(projetosDoDono.get(p.donoId) ?? []), { id: p.id, nome: p.nome }]);

  const ORDEM_DO_PAPEL: Record<PapelNoCaso, number> = { titular: 0, membro: 1, ligada: 2 };

  const casos: CasoDeContrato[] = titulares.map((titularId) => {
    const titular = contas.get(titularId)!;
    const contratos = [...(contratosPorTitular.get(titularId) ?? [])].sort((a, b) => b.numero - a.numero);
    const principal = contratoPrincipal(contratos);
    const ids = pessoasDoTitular.get(titularId) ?? [titularId];
    const emails = new Set(ids.map((id) => contas.get(id)?.email.toLowerCase()).filter(Boolean) as string[]);

    const pessoas: PessoaDoCaso[] = ids
      .map((id) => {
        const c = contas.get(id)!;
        const { papel } = casoDaPessoa.get(id)!;
        const a = acumulado.get(id) ?? novoAcumulador();
        const v = vinculoPorPessoa.get(id);
        return {
          id,
          email: c.email,
          nome: c.nome,
          plano: c.plano,
          papel,
          marca: marca(id),
          ultimoAcesso: c.ultimoAcesso,
          cadastroEm: c.cadastroEm,
          ligacao: v ? { definidoPor: v.definidoPor, criadoEm: v.criadoEm, observacao: v.observacao } : null,
          statusNaEquipe: membroPorPessoa.get(id)?.status ?? null,
          projetos: projetosDoDono.get(id) ?? [],
          uso: a.uso,
          porMes: [...a.porMes.entries()].map(([mes, u]) => ({ mes, ...u })).sort((x, y) => y.mes.localeCompare(x.mes)),
          creditosPorOperacao: [...a.porOperacao.values()].sort((x, y) => y.creditos + y.custariam - (x.creditos + x.custariam)),
          custoPorFamilia: [...a.porFamilia.values()].sort((x, y) => y.usd - x.usd),
          receitaReais: receitaDaConta.get(id) ?? 0,
        };
      })
      .sort((a, b) => ORDEM_DO_PAPEL[a.papel] - ORDEM_DO_PAPEL[b.papel] || creditosDeUso(b.uso) - creditosDeUso(a.uso) || a.email.localeCompare(b.email));

    const pagamentos = pagamentosNaJanela.filter((p) => p.contaId && ids.includes(p.contaId)).sort((a, b) => b.quando.localeCompare(a.quando));
    const receitaReais = pagamentos.reduce((s, p) => s + p.reais, 0);
    const receitaDesdeSempreReais = e.pagamentos.filter((p) => p.contaId && ids.includes(p.contaId)).reduce((s, p) => s + p.reais, 0);
    const fora = e.fora.filter((f) => emails.has(f.conta.toLowerCase()) && naJanela(f.quando, e.desde, e.ate)).sort((a, b) => b.quando.localeCompare(a.quando));
    const uso = pessoas.reduce((s, p) => somarUso(s, p.uso), usoVazio());
    const marcaDaTitular = marca(titularId);
    const semReceita = receitaReais <= 0;
    const alertas: string[] = [];
    if (marcaDaTitular === "equipe" && contratos.some((c) => c.grupo !== "cancelado"))
      alertas.push("Contrato em conta da equipe: se a empresa é cliente, o pagamento dela vai ficar fora da receita até o contrato estar numa conta de cliente.");
    if (semReceita && uso.custoReais > 0) alertas.push("Custo de IA sem pagamento confirmado no período.");
    if (fora.some((f) => f.motivo === "sem_comprovante")) alertas.push("Pagamento registrado sem comprovante: entra na receita quando o comprovante for aceito no gestor.");
    if (principal && principal.grupo === "aguardando_pagamento") alertas.push(`Contrato nº ${principal.numero} assinado e aguardando pagamento.`);

    return {
      titularId,
      tipo: contratos.length ? "contrato" : "conta",
      titular: { id: titular.id, email: titular.email, nome: titular.nome, marca: marcaDaTitular },
      empresa: principal?.empresa ?? null,
      signatario: principal && (principal.signatarioNome || principal.signatarioEmail) ? { nome: principal.signatarioNome, email: principal.signatarioEmail } : null,
      contratoPrincipal: principal,
      contratos,
      plano: principal?.planoNome ?? titular.plano,
      contratadoReais: principal && principal.grupo !== "cancelado" ? principal.valorCentavos / 100 : 0,
      registradoReais: contratos.reduce((s, c) => s + c.registradoCentavos, 0) / 100,
      pagamentos,
      receitaReais,
      receitaDesdeSempreReais,
      fora,
      semReceita,
      motivoSemReceita: semReceita ? motivoSemReceita(principal, marcaDaTitular, fora.length > 0) : null,
      pessoas,
      uso,
      margemReais: receitaReais - uso.custoReais,
      custoPorReal: receitaReais > 0 ? uso.custoReais / receitaReais : null,
      ultimoAcesso: pessoas.reduce<string | null>((s, p) => maisRecente(s, p.ultimoAcesso), null),
      alertas,
    };
  });

  // O ranking: maior margem primeiro; entre margens iguais, quem custa menos
  // e depois quem usa mais (o contrato sem uso nenhum fica atrás do que usa).
  const ranking = [...casos].sort(
    (a, b) => b.margemReais - a.margemReais || a.uso.custoReais - b.uso.custoReais || creditosDeUso(b.uso) - creditosDeUso(a.uso)
  );

  const usuarios: UsuarioNoRanking[] = casos
    .flatMap((c) =>
      c.pessoas.map((p) => ({
        pessoaId: p.id,
        email: p.email,
        nome: p.nome,
        marca: p.marca,
        titularId: c.titularId,
        caso: c.empresa ?? c.titular.nome ?? c.titular.email,
        uso: p.uso,
        ultimoAcesso: p.ultimoAcesso,
      }))
    )
    .sort((a, b) => creditosDeUso(b.uso) - creditosDeUso(a.uso) || b.uso.custoReais - a.uso.custoReais || b.uso.minutos - a.uso.minutos || a.email.localeCompare(b.email));

  const receitaReais = casos.reduce((s, c) => s + c.receitaReais, 0);
  const custoReais = casos.reduce((s, c) => s + c.uso.custoReais, 0);
  return {
    casos,
    ranking,
    usuarios,
    totais: {
      receitaReais,
      custoReais,
      custoUsd: casos.reduce((s, c) => s + c.uso.custoUsd, 0),
      margemReais: receitaReais - custoReais,
      casos: casos.length,
      contratos: e.contratos.length,
      pessoas: usuarios.length,
      semReceita: casos.filter((c) => c.semReceita).length,
    },
  };
}

/** O nome do caso na tela: a empresa do contrato, o nome da titular ou o e-mail. */
export const nomeDoCaso = (c: Pick<CasoDeContrato, "empresa" | "titular">) => c.empresa ?? c.titular.nome ?? c.titular.email;

/** "2026-10" vira "out/2026". */
export function mesPorExtenso(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  if (!a || !m) return mes;
  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${nomes[m - 1]}/${a}`;
}
