// A CARTEIRA DO CONTRATO GUARDA-CHUVA (08/10/2026, regra do Bruno: "os créditos
// vêm todos do mesmo lugar; os vendedores disputam os créditos e nunca pode
// exceder a nossa margem"). O banco é o em memória (banco-em-memoria.ts), com a
// lista de contas ligadas: nada aqui toca banco real, Stripe ou IA.
//   - débito de conta ligada sai da titular, com a pessoa como autora;
//   - estorno volta à titular; a carteira de vídeo segue a mesma regra;
//   - saldo zero no contrato recusa TODO o time, com o nome do contrato;
//   - a conta ligada nunca herda a isenção de admin da titular;
//   - o saldo próprio da conta ligada fica parado (cortesia não é gasta);
//   - conta sem vínculo segue igual a hoje;
//   - as travas puras da ligação e o plano que vale nos limites.
// Rodar: npx tsx --test scripts/testes/carteira-do-contrato-0810.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { bancoEmMemoria } from "./banco-em-memoria";

const { debitar, creditar, SaldoInsuficiente } = await import("@/lib/credits");
const { contaPagante, membroAtivo } = await import("@/lib/equipe/conta");
const { recusaDaLigacao } = await import("@/lib/admin/contas/vinculos");
const { planoQueValeNaConta, nomeDaCarteiraDoContrato, fraseDosCreditosDoContrato, PROJETOS_POR_PESSOA_DO_CONTRATO } = await import("@/lib/equipe/regras");

type Db = Parameters<typeof debitar>[1];
const comoBanco = (b: ReturnType<typeof bancoEmMemoria>) => b as unknown as NonNullable<Db>;
const TRAVESSAO = /[—–]/;

function seed() {
  return bancoEmMemoria({
    users: [
      { id: "matheus", email: "matheus@seed.com", name: "Matheus Garbelini", role: "admin", plan: "business", creditsBalance: 1000, videoCredits: 50 },
      { id: "ygor", email: "ygor@gmail.com", name: "Ygor", plan: "pro", creditsBalance: 20000, videoCredits: 7 },
      { id: "vitor", email: "vitor@gmail.com", name: "Vitor", plan: "pro", creditsBalance: 20000 },
      { id: "solta", email: "solta@gmail.com", plan: "pro", creditsBalance: 300 },
    ],
    ligacoes: [
      { userId: "ygor", titularId: "matheus", numero: 2, empresa: "SEED SOLUCOES FINANCEIRAS", plano: "pro", acessosExtras: 0 },
      { userId: "vitor", titularId: "matheus", numero: 2, empresa: "SEED SOLUCOES FINANCEIRAS", plano: "pro", acessosExtras: 0 },
    ],
  });
}

const semIsencao = async <T,>(fn: () => Promise<T>) => {
  const antes = process.env.ADMIN_SEM_DEBITO;
  delete process.env.ADMIN_SEM_DEBITO;
  try {
    return await fn();
  } finally {
    if (antes === undefined) delete process.env.ADMIN_SEM_DEBITO;
    else process.env.ADMIN_SEM_DEBITO = antes;
  }
};

test("a conta ligada é vista como membro de origem contrato, pagando pela titular", async () => {
  const db = comoBanco(seed());
  const m = await membroAtivo("ygor", db as never);
  assert.ok(m);
  assert.equal(m.origem, "contrato");
  assert.equal(m.donoId, "matheus");
  assert.equal(m.tetoCreditos, null);
  assert.equal(m.contrato?.empresa, "SEED SOLUCOES FINANCEIRAS");
  const p = await contaPagante("ygor", db as never);
  assert.equal(p.contaId, "matheus");
  assert.equal(p.autorId, "ygor");
  // Conta sem vínculo: paga o próprio, como hoje.
  const s = await contaPagante("solta", db as never);
  assert.equal(s.contaId, "solta");
  assert.equal(s.autorId, null);
  assert.equal(await membroAtivo("solta", db as never), null);
});

test("débito da conta ligada sai da titular; o saldo próprio dela não se move", async () => {
  await semIsencao(async () => {
    const b = seed();
    const db = comoBanco(b);
    const r = await debitar({ userId: "ygor", quantidade: 400, operation: "campanha", projectId: "p-ygor" }, db);
    assert.equal(r.balance, 600);
    assert.equal(b.user.linhas.find((u) => u.id === "matheus")!.creditsBalance, 600);
    assert.equal(b.user.linhas.find((u) => u.id === "ygor")!.creditsBalance, 20000);
    const tx = b.creditTransaction.linhas[0];
    assert.equal(tx.userId, "matheus");
    assert.equal(tx.autorId, "ygor");
    assert.equal(tx.amount, -400);
    // O time disputa o mesmo saldo: o Vitor gasta do que sobrou.
    const r2 = await debitar({ userId: "vitor", quantidade: 500, operation: "campanha" }, db);
    assert.equal(r2.balance, 100);
  });
});

test("estorno volta à titular, marcado com quem fez", async () => {
  await semIsencao(async () => {
    const b = seed();
    const db = comoBanco(b);
    await debitar({ userId: "ygor", quantidade: 400, operation: "campanha", refId: "run1" }, db);
    const r = await creditar({ userId: "ygor", quantidade: 150, operation: "estorno", refId: "run1" }, db);
    assert.equal(r.contaId, "matheus");
    assert.equal(r.balance, 750);
    assert.equal(b.user.linhas.find((u) => u.id === "ygor")!.creditsBalance, 20000);
    const estorno = b.creditTransaction.linhas.find((t) => t.operation === "estorno");
    assert.equal(estorno?.userId, "matheus");
    assert.equal(estorno?.autorId, "ygor");
  });
});

test("saldo zero no contrato recusa todo o time, com o nome do contrato e sem saldo negativo", async () => {
  await semIsencao(async () => {
    const b = seed();
    b.user.linhas.find((u) => u.id === "matheus")!.creditsBalance = 100;
    const db = comoBanco(b);
    for (const quem of ["ygor", "vitor", "matheus"]) {
      await assert.rejects(
        () => debitar({ userId: quem, quantidade: 250, operation: "campanha" }, db),
        (e: unknown) => {
          assert.ok(e instanceof SaldoInsuficiente, `${quem}: erro errado`);
          if (quem !== "matheus") {
            assert.match(e.message, /contrato SEED SOLUCOES FINANCEIRAS \(titular Matheus Garbelini\)/);
            assert.match(e.message, /custa 250 e o contrato tem 100/);
            assert.equal(e.equipe?.dono, "contrato SEED SOLUCOES FINANCEIRAS (titular Matheus Garbelini)");
            assert.doesNotMatch(e.message, TRAVESSAO);
          }
          return true;
        }
      );
    }
    assert.equal(b.user.linhas.find((u) => u.id === "matheus")!.creditsBalance, 100);
    assert.equal(b.creditTransaction.linhas.length, 0);
    // Zerado de vez: a frase curta.
    b.user.linhas.find((u) => u.id === "matheus")!.creditsBalance = 0;
    await assert.rejects(() => debitar({ userId: "ygor", quantidade: 1, operation: "campanha" }, db), (e: unknown) => {
      assert.ok(e instanceof SaldoInsuficiente);
      assert.match(e.message, /acabaram/);
      return true;
    });
  });
});

test("a conta ligada nunca herda a isenção de admin da titular", async () => {
  const antes = process.env.ADMIN_SEM_DEBITO;
  process.env.ADMIN_SEM_DEBITO = "1";
  try {
    const b = seed();
    const db = comoBanco(b);
    // A titular admin, com a isenção ligada, debita zero.
    const r0 = await debitar({ userId: "matheus", quantidade: 400, operation: "campanha" }, db);
    assert.equal(r0.balance, 1000);
    assert.equal(b.creditTransaction.linhas[0].amount, 0);
    // O Ygor, ligado ao contrato dela, debita de verdade.
    const r = await debitar({ userId: "ygor", quantidade: 400, operation: "campanha" }, db);
    assert.equal(r.balance, 600);
    assert.equal(b.creditTransaction.linhas[1].amount, -400);
  } finally {
    if (antes === undefined) delete process.env.ADMIN_SEM_DEBITO;
    else process.env.ADMIN_SEM_DEBITO = antes;
  }
});

test("conta sem vínculo e sem equipe segue igual a hoje", async () => {
  await semIsencao(async () => {
    const b = seed();
    const db = comoBanco(b);
    const r = await debitar({ userId: "solta", quantidade: 100, operation: "campanha" }, db);
    assert.equal(r.balance, 200);
    assert.equal(b.creditTransaction.linhas[0].userId, "solta");
    assert.equal(b.creditTransaction.linhas[0].autorId, null);
    await assert.rejects(() => debitar({ userId: "solta", quantidade: 500, operation: "campanha" }, db), (e: unknown) => {
      assert.ok(e instanceof SaldoInsuficiente);
      assert.equal(e.equipe, null);
      assert.match(e.message, /você tem 200/);
      return true;
    });
  });
});

test("sem a tabela da ligação (migração não rodou), nada muda", async () => {
  await semIsencao(async () => {
    const b = bancoEmMemoria({ users: [{ id: "x", email: "x@a.com", plan: "pro", creditsBalance: 50 }] });
    // A tabela "não existe" só vale quando a resposta guardada não é "existe":
    // aqui o banco em memória responde false de novo e o código segue sem ligação.
    const p = await contaPagante("x", comoBanco(b) as never);
    assert.equal(p.contaId, "x");
  });
});

test("as travas puras da ligação", () => {
  const base = { userId: "a", titularId: "b", titularEstaLigada: false, contaTemLigadas: false, contaTemContrato: false, contaEhMembroAtivo: false };
  assert.equal(recusaDaLigacao(base), null);
  assert.match(recusaDaLigacao({ ...base, titularId: "a" })!, /ela mesma/);
  assert.match(recusaDaLigacao({ ...base, titularEstaLigada: true })!, /já está ligada/);
  assert.match(recusaDaLigacao({ ...base, contaTemContrato: true })!, /contrato próprio/);
  assert.match(recusaDaLigacao({ ...base, contaEhMembroAtivo: true })!, /membro ativo/);
  assert.match(recusaDaLigacao({ ...base, contaTemEquipe: true })!, /equipe própria/);
  assert.match(recusaDaLigacao({ ...base, titularEhMembro: true })!, /membro da equipe de outra/);
  for (const f of Object.values({ a: recusaDaLigacao({ ...base, titularEstaLigada: true }) })) assert.doesNotMatch(f!, TRAVESSAO);
});

test("o plano que vale nos limites: sem acesso interno para a conta ligada, plano do contrato quando a titular não tem", () => {
  const ligacao = { plano: "pro", acessosExtras: 2 };
  // Titular admin sem plano: vale o plano do contrato, nunca o acesso interno.
  assert.deepEqual(planoQueValeNaConta({ plan: "free", role: "admin", acessosExtras: 0 }, ligacao), { plan: "pro", admin: false, acessosExtras: 2 });
  // Titular com plano: o plano dela manda.
  assert.deepEqual(planoQueValeNaConta({ plan: "business", role: "admin", acessosExtras: 1 }, ligacao), { plan: "business", admin: false, acessosExtras: 1 });
  // Sem ligação: o de sempre.
  assert.deepEqual(planoQueValeNaConta({ plan: "free", role: "admin", acessosExtras: 0 }, null), { plan: "free", admin: true, acessosExtras: 0 });
  assert.equal(PROJETOS_POR_PESSOA_DO_CONTRATO, 1);
  const nome = nomeDaCarteiraDoContrato({ titular: "Matheus", empresa: "SEED", numero: 2 });
  assert.equal(nome, "contrato SEED (titular Matheus)");
  assert.equal(nomeDaCarteiraDoContrato({ titular: "Matheus", empresa: null, numero: 2 }), "contrato nº 2 (titular Matheus)");
  assert.doesNotMatch(fraseDosCreditosDoContrato(nome, { necessario: 10, disponivel: 3 }), TRAVESSAO);
});
