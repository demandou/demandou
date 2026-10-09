// CONTRATOS E CONTAS, CASO A CASO (08/10/2026), sem banco:
//   - receita só com pagamento confirmado (Stripe pago e concluído, por fora só
//     com comprovante); contrato enviado e não assinado não é receita;
//   - o uso do time (equipe e contas ligadas) soma no contrato;
//   - cortesia, teste e equipe aparecem marcadas e sem receita;
//   - o ranking e o drill down por mês e operação.
// Rodar: npx tsx --test scripts/testes/contas-caso-a-caso-0810.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { cobrancaConfirmada, destinoDoPagamento, pagamentoPorForaConfirmado } from "@/lib/admin/regra-da-receita";
import { montarCasos, marcaDaConta, motivoSemReceita, contratoPrincipal, type EntradaDosCasos, type ContratoCru } from "@/lib/admin/contas/caso-a-caso";

const TRAVESSAO = /[—–]/;
const agora = new Date("2026-10-08T20:00:00Z");
const desde = new Date("2026-01-01T03:00:00Z");

test("a regra da receita: só pagamento confirmado", () => {
  assert.equal(cobrancaConfirmada({ paid: true, status: "succeeded", amount_captured: 1000, amount_refunded: 0 }), true);
  assert.equal(cobrancaConfirmada({ paid: true, status: "pending", amount_captured: 1000, amount_refunded: 0 }), false);
  assert.equal(cobrancaConfirmada({ paid: false, status: "succeeded", amount_captured: 1000, amount_refunded: 0 }), false);
  // Devolvida inteira: líquido zero não é receita.
  assert.equal(cobrancaConfirmada({ paid: true, status: "succeeded", amount_captured: 1000, amount_refunded: 1000 }), false);
  assert.equal(pagamentoPorForaConfirmado({ comprovanteUrl: null }), false);
  assert.equal(pagamentoPorForaConfirmado({ comprovanteUrl: "  " }), false);
  assert.equal(pagamentoPorForaConfirmado({ comprovanteUrl: "https://x/comprovante.pdf" }), true);
  assert.deepEqual(destinoDoPagamento({ origem: "por_fora", contaDaEquipe: false, comprovanteUrl: null }), { receita: false, motivo: "sem_comprovante" });
  assert.deepEqual(destinoDoPagamento({ origem: "por_fora", contaDaEquipe: true, comprovanteUrl: "u" }), { receita: false, motivo: "equipe" });
  assert.deepEqual(destinoDoPagamento({ origem: "por_fora", contaDaEquipe: false, comprovanteUrl: "u" }), { receita: true });
  assert.deepEqual(destinoDoPagamento({ origem: "stripe", contaDaEquipe: true, cobranca: { paid: true, status: "succeeded", amount_captured: 100, amount_refunded: 0 } }), { receita: false, motivo: "equipe" });
  assert.equal(destinoDoPagamento({ origem: "stripe", contaDaEquipe: false, cobranca: { paid: true, status: "failed", amount_captured: 0, amount_refunded: 0 } }), null);
});

const contrato = (x: Partial<ContratoCru> & { numero: number; userId: string; grupo: string }): ContratoCru => ({
  id: `c${x.numero}`,
  planoNome: "Starter",
  valorCentavos: 3596400,
  situacao: x.grupo,
  situacaoNome: x.grupo,
  empresa: "SEED",
  signatarioNome: null,
  signatarioEmail: null,
  registradoCentavos: 0,
  pagoEm: null,
  assinadoEm: null,
  inicio: null,
  fim: null,
  criadoEm: `2026-10-0${x.numero}T10:00:00Z`,
  descontoPercentual: 0,
  ...x,
});

function entrada(extra: Partial<EntradaDosCasos> = {}): EntradaDosCasos {
  return {
    agora,
    desde,
    ate: agora,
    dolar: 5,
    contas: [
      { id: "mat", email: "matheus@seed.com", nome: "Matheus", plano: "business", papel: "user", contaInterna: false, trialEndsAt: null, cadastroEm: "2026-10-01T00:00:00Z", ultimoAcesso: "2026-10-07T00:00:00Z" },
      { id: "ygor", email: "ygor@gmail.com", nome: "Ygor", plano: "pro", papel: "user", contaInterna: false, trialEndsAt: null, cadastroEm: "2026-10-08T00:00:00Z", ultimoAcesso: "2026-10-08T12:00:00Z" },
      { id: "vendedor", email: "vendedor@seed.com", nome: null, plano: "free", papel: "user", contaInterna: false, trialEndsAt: null, cadastroEm: "2026-10-02T00:00:00Z", ultimoAcesso: null },
      { id: "bruno", email: "bruno@demandou.com", nome: "Bruno", plano: "business", papel: "admin", contaInterna: false, trialEndsAt: null, cadastroEm: "2026-08-01T00:00:00Z", ultimoAcesso: "2026-10-08T19:00:00Z" },
      { id: "teste", email: "teste@gmail.com", nome: null, plano: "pro", papel: "user", contaInterna: false, trialEndsAt: "2026-10-20T00:00:00Z", cadastroEm: "2026-10-06T00:00:00Z", ultimoAcesso: null },
    ],
    contratos: [contrato({ numero: 1, userId: "mat", grupo: "cancelado" }), contrato({ numero: 2, userId: "mat", grupo: "enviado" })],
    pagamentos: [],
    fora: [],
    membros: [{ donoId: "mat", userId: "vendedor", status: "ativo", email: "vendedor@seed.com", nome: null }],
    vinculos: [{ userId: "ygor", titularId: "mat", definidoPor: "bruno@demandou.com", criadoEm: "2026-10-08T15:00:00Z", observacao: "time da SEED" }],
    projetos: [
      { id: "p-mat", nome: "SEED", donoId: "mat" },
      { id: "p-ygor", nome: "Ygor Consórcios", donoId: "ygor" },
      { id: "p-bruno", nome: "Demandou", donoId: "bruno" },
    ],
    extrato: [
      { pessoaId: "mat", contaId: "mat", mes: "2026-10", operacao: "campanha", creditos: 300, custariam: 0, n: 1 },
      { pessoaId: "vendedor", contaId: "mat", mes: "2026-10", operacao: "campanha", creditos: 200, custariam: 0, n: 1 },
      { pessoaId: "ygor", contaId: "mat", mes: "2026-10", operacao: "video_roteiro", creditos: 100, custariam: 0, n: 1 },
      { pessoaId: "ygor", contaId: "mat", mes: "2026-09", operacao: "campanha", creditos: 50, custariam: 0, n: 1 },
      { pessoaId: "mat", contaId: "mat", mes: "2026-10", operacao: "renovacao", creditos: -20000, custariam: 0, n: 1 },
      { pessoaId: "bruno", contaId: "bruno", mes: "2026-10", operacao: "campanha", creditos: 0, custariam: 900, n: 2 },
    ],
    custos: [
      { projectId: "p-mat", mes: "2026-10", operacao: "agent", usd: 2, n: 10 },
      { projectId: "p-ygor", mes: "2026-10", operacao: "montagem-diretor", usd: 1, n: 3 },
      { projectId: "p-bruno", mes: "2026-10", operacao: "agent", usd: 40, n: 100 },
    ],
    gravacoes: [{ pessoaId: "ygor", mes: "2026-10", n: 1, segundos: 600 }],
    posts: [{ projectId: "p-ygor", mes: "2026-10", geradas: 6, publicadas: 2 }],
    ...extra,
  };
}

test("contrato enviado e não assinado não é receita; o valor sai como projeção", () => {
  const r = montarCasos(entrada());
  const seed = r.casos.find((c) => c.titularId === "mat")!;
  assert.equal(seed.receitaReais, 0);
  assert.equal(seed.semReceita, true);
  assert.equal(seed.contratadoReais, 35964);
  assert.equal(seed.contratoPrincipal?.numero, 2);
  assert.match(seed.motivoSemReceita!, /enviado e não assinado/);
  assert.doesNotMatch(seed.motivoSemReceita!, TRAVESSAO);
  assert.equal(r.totais.receitaReais, 0);
});

test("o uso do time (equipe e conta ligada) soma no contrato, por pessoa e por mês", () => {
  const r = montarCasos(entrada());
  const seed = r.casos.find((c) => c.titularId === "mat")!;
  assert.deepEqual(seed.pessoas.map((p) => [p.id, p.papel]), [["mat", "titular"], ["vendedor", "membro"], ["ygor", "ligada"]]);
  // Renovação não é consumo: 300 + 200 + 100 + 50.
  assert.equal(seed.uso.creditos, 650);
  assert.equal(seed.uso.custoUsd, 3);
  assert.equal(seed.uso.custoReais, 15);
  assert.equal(seed.uso.gravacoes, 1);
  assert.equal(seed.uso.minutos, 10);
  assert.equal(seed.uso.postsGerados, 6);
  assert.equal(seed.margemReais, -15);
  assert.equal(seed.custoPorReal, null);
  assert.equal(seed.ultimoAcesso, "2026-10-08T12:00:00Z");
  const ygor = seed.pessoas.find((p) => p.id === "ygor")!;
  assert.equal(ygor.uso.creditos, 150);
  assert.deepEqual(ygor.porMes.map((m) => [m.mes, m.creditos]), [["2026-10", 100], ["2026-09", 50]]);
  assert.deepEqual(ygor.creditosPorOperacao.map((o) => o.operacao), ["video_roteiro", "campanha"]);
  assert.equal(ygor.custoPorFamilia[0].familia, "roteiro");
  assert.equal(ygor.ligacao?.observacao, "time da SEED");
  // O membro sem projeto próprio: custo zero (fica no dono), créditos dele.
  const vendedor = seed.pessoas.find((p) => p.id === "vendedor")!;
  assert.equal(vendedor.uso.custoUsd, 0);
  assert.equal(vendedor.uso.creditos, 200);
  // A conta ligada não vira caso próprio.
  assert.equal(r.casos.some((c) => c.titularId === "ygor"), false);
});

test("pagamento confirmado vira receita, margem e custo por real; o registro sem comprovante fica fora", () => {
  const r = montarCasos(
    entrada({
      pagamentos: [
        { id: "pix1", contaId: "mat", quando: "2026-10-05T10:00:00Z", reais: 3000, forma: "pix", origem: "por_fora", descricao: "contrato nº 2" },
        { id: "velho", contaId: "mat", quando: "2025-12-01T10:00:00Z", reais: 500, forma: "pix", origem: "por_fora", descricao: "antes do período" },
      ],
      fora: [{ conta: "matheus@seed.com", quando: "2026-10-06T10:00:00Z", reais: 1000, motivo: "sem_comprovante", descricao: "contrato nº 2" }],
    })
  );
  const seed = r.casos.find((c) => c.titularId === "mat")!;
  assert.equal(seed.receitaReais, 3000);
  assert.equal(seed.receitaDesdeSempreReais, 3500);
  assert.equal(seed.semReceita, false);
  assert.equal(seed.margemReais, 2985);
  assert.equal(seed.custoPorReal, 15 / 3000);
  assert.equal(seed.fora.length, 1);
  assert.ok(seed.alertas.some((a) => /sem comprovante/.test(a)));
  assert.equal(seed.titular.marca, "pagante");
  assert.equal(r.ranking[0].titularId, "mat");
});

test("cortesia, teste e equipe aparecem marcadas e sem receita", () => {
  const r = montarCasos(entrada());
  const jaPagou = new Set<string>();
  assert.equal(marcaDaConta({ id: "x", email: "a@b.com", papel: "user", contaInterna: false, plano: "pro", trialEndsAt: null }, jaPagou, agora), "cortesia");
  assert.equal(marcaDaConta({ id: "x", email: "a@b.com", papel: "user", contaInterna: false, plano: "pro", trialEndsAt: "2026-10-20T00:00:00Z" }, jaPagou, agora), "teste");
  assert.equal(marcaDaConta({ id: "x", email: "a@demandou.com", papel: "user", contaInterna: false, plano: "pro", trialEndsAt: null }, jaPagou, agora), "equipe");
  assert.equal(marcaDaConta({ id: "x", email: "a@b.com", papel: "admin", contaInterna: false, plano: "free", trialEndsAt: null }, jaPagou, agora), "equipe");
  assert.equal(marcaDaConta({ id: "x", email: "a@b.com", papel: "user", contaInterna: false, plano: "free", trialEndsAt: null }, jaPagou, agora), "sem_plano");
  const bruno = r.casos.find((c) => c.titularId === "bruno")!;
  assert.equal(bruno.titular.marca, "equipe");
  assert.match(bruno.motivoSemReceita!, /equipe/);
  assert.equal(bruno.uso.creditosQueCustariam, 900);
  const teste = r.casos.find((c) => c.titularId === "teste")!;
  assert.equal(teste.titular.marca, "teste");
  assert.match(teste.motivoSemReceita!, /teste/);
  assert.equal(teste.tipo, "conta");
  // Um pagamento numa conta da equipe não vira receita nem pagante.
  const r2 = montarCasos(entrada({ pagamentos: [{ id: "x", contaId: "bruno", quando: "2026-10-05T10:00:00Z", reais: 100, forma: "pix", origem: "por_fora", descricao: "teste" }] }));
  assert.equal(r2.casos.find((c) => c.titularId === "bruno")!.titular.marca, "equipe");
  assert.equal(r2.totais.receitaReais, 100);
});

test("o contrato principal e o motivo sem receita", () => {
  const cancelado = contrato({ numero: 3, userId: "mat", grupo: "cancelado", criadoEm: "2026-10-09T00:00:00Z" });
  const enviado = contrato({ numero: 2, userId: "mat", grupo: "enviado" });
  assert.equal(contratoPrincipal([cancelado, enviado])?.numero, 2);
  assert.equal(contratoPrincipal([cancelado])?.numero, 3);
  assert.equal(contratoPrincipal([]), null);
  assert.match(motivoSemReceita(contrato({ numero: 4, userId: "mat", grupo: "aguardando_pagamento" }), "pagante", false), /aguardando pagamento|sem pagamento confirmado/);
  assert.match(motivoSemReceita(null, "cortesia", false), /cortesia/);
  assert.match(motivoSemReceita(null, "equipe", false), /equipe/);
});

test("o ranking dos usuários vai de quem mais usa para quem menos usa", () => {
  const r = montarCasos(entrada());
  assert.equal(r.usuarios[0].pessoaId, "bruno");
  assert.equal(r.usuarios[1].pessoaId, "mat");
  assert.equal(r.usuarios[r.usuarios.length - 1].uso.creditos, 0);
});
