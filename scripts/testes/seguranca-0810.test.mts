// A AUDITORIA DE SEGURANÇA DE 08/10/2026, na parte que se prova sem banco:
// o contador de limite de taxa, o bloqueio progressivo do login, a lista de
// origens que podem escrever na API, a ausência de CORS aberto, os cabeçalhos
// de segurança e as frases genéricas (que não ensinam quem tem conta).
//
// Rodar: npx tsx --test scripts/testes/seguranca-0810.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  consumir, depositoEmMemoria, usarDepositoDoLimite, armazemDoBetterAuth, conferirCustoPorConta, LimiteExcedido, CUSTO_POR_CONTA,
} from "@/lib/seguranca/limite";
import {
  duracaoDoBloqueioMs, estadoDoBloqueio, mensagemDoBloqueio, conferirBloqueio, registrarResultadoDoLogin, usarDepositoDoBloqueio,
  FALHAS_PARA_BLOQUEAR, type DepositoDoBloqueio, type Historico,
} from "@/lib/seguranca/bloqueio-de-login";
import { origemPermitida, metodoEscreve } from "@/lib/seguranca/origem";

const MINUTO = 60_000;

// ---------------------------------------------------------------------------
// 1. O contador compartilhado
// ---------------------------------------------------------------------------

test("limite: conta na janela, recusa depois do teto e abre de novo quando a janela vira", async () => {
  const dep = depositoEmMemoria();
  usarDepositoDoLimite(dep);
  try {
    const regra = { janelaMs: MINUTO, max: 3 };
    const t0 = 1_000_000;
    assert.equal((await consumir("ip:x", regra, t0)).ok, true);
    assert.equal((await consumir("ip:x", regra, t0 + 1)).ok, true);
    assert.equal((await consumir("ip:x", regra, t0 + 2)).ok, true);
    const quarta = await consumir("ip:x", regra, t0 + 3);
    assert.equal(quarta.ok, false);
    assert.equal(quarta.contagem, 4);
    assert.ok(quarta.esperarS >= 59 && quarta.esperarS <= 60, `esperarS=${quarta.esperarS}`);
    // Martelar a porta fechada não adianta a abertura: a janela é fixa.
    assert.equal((await consumir("ip:x", regra, t0 + 30_000)).ok, false);
    // Outra chave não sofre.
    assert.equal((await consumir("ip:y", regra, t0 + 30_000)).ok, true);
    // Janela virou: conta do zero.
    const depois = await consumir("ip:x", regra, t0 + MINUTO + 1);
    assert.equal(depois.ok, true);
    assert.equal(depois.contagem, 1);
  } finally {
    usarDepositoDoLimite(null);
  }
});

test("limite: o armazém do better-auth traduz a regra em segundos e devolve retryAfter", async () => {
  const dep = depositoEmMemoria();
  usarDepositoDoLimite(dep);
  try {
    const armazem = armazemDoBetterAuth();
    const rule = { window: 60, max: 2 };
    assert.deepEqual(await armazem.consume("1.2.3.4/sign-in/email", rule), { allowed: true, retryAfter: null });
    assert.deepEqual(await armazem.consume("1.2.3.4/sign-in/email", rule), { allowed: true, retryAfter: null });
    const r = await armazem.consume("1.2.3.4/sign-in/email", rule);
    assert.equal(r.allowed, false);
    assert.ok(typeof r.retryAfter === "number" && r.retryAfter > 0);
    // A chave do better-auth ganha o prefixo "auth:" na tabela.
    assert.ok([...dep.linhas.keys()].every((k) => k.startsWith("auth:")));
  } finally {
    usarDepositoDoLimite(null);
  }
});

test("limite: o teto de IA por conta lança LimiteExcedido com 429 quando o minuto estoura", async () => {
  const dep = depositoEmMemoria();
  usarDepositoDoLimite(dep);
  try {
    for (let i = 0; i < CUSTO_POR_CONTA.minuto.max; i++) await conferirCustoPorConta("u1", "teste");
    await assert.rejects(() => conferirCustoPorConta("u1", "teste"), (e: unknown) => e instanceof LimiteExcedido && e.status === 429);
    // Outra conta segue livre.
    await conferirCustoPorConta("u2", "teste");
  } finally {
    usarDepositoDoLimite(null);
  }
});

// ---------------------------------------------------------------------------
// 2. O bloqueio progressivo do login
// ---------------------------------------------------------------------------

test("bloqueio: a espera começa em 5 falhas e cresce até um dia", () => {
  assert.equal(duracaoDoBloqueioMs(0), 0);
  assert.equal(duracaoDoBloqueioMs(FALHAS_PARA_BLOQUEAR - 1), 0);
  assert.equal(duracaoDoBloqueioMs(5), MINUTO);
  assert.equal(duracaoDoBloqueioMs(8), 5 * MINUTO);
  assert.equal(duracaoDoBloqueioMs(10), 15 * MINUTO);
  assert.equal(duracaoDoBloqueioMs(15), 60 * MINUTO);
  assert.equal(duracaoDoBloqueioMs(20), 6 * 60 * MINUTO);
  assert.equal(duracaoDoBloqueioMs(30), 24 * 60 * MINUTO);
  assert.equal(duracaoDoBloqueioMs(500), 24 * 60 * MINUTO);
  // Monótona: mais falhas nunca esperam menos.
  for (let n = 1; n < 100; n++) assert.ok(duracaoDoBloqueioMs(n) >= duracaoDoBloqueioMs(n - 1));
});

test("bloqueio: o estado olha a última falha e libera quando a espera passou", () => {
  const agora = new Date("2026-10-08T12:00:00Z");
  const h = (falhas: number, haMs: number): Historico => ({ falhas, ultimaFalhaEm: new Date(agora.getTime() - haMs) });
  assert.deepEqual(estadoDoBloqueio(h(4, 0), agora), { bloqueado: false });
  const b = estadoDoBloqueio(h(5, 10_000), agora);
  assert.equal(b.bloqueado, true);
  if (b.bloqueado) assert.equal(b.esperarS, 50);
  assert.deepEqual(estadoDoBloqueio(h(5, MINUTO + 1), agora), { bloqueado: false });
  assert.deepEqual(estadoDoBloqueio({ falhas: 50, ultimaFalhaEm: null }, agora), { bloqueado: false });
});

test("bloqueio: a frase é a mesma para e-mail com e sem conta, e nunca diz qual é o caso", () => {
  const frase = mensagemDoBloqueio(90);
  assert.match(frase, /Muitas tentativas de entrar com este e-mail/);
  assert.match(frase, /Esqueci a senha/);
  assert.doesNotMatch(frase, /não existe|não encontrad|cadastrad|inválid/i);
  assert.equal(mensagemDoBloqueio(30), mensagemDoBloqueio(59));
  assert.match(mensagemDoBloqueio(3 * 60 * 60), /horas/);
});

function depositoDoBloqueioEmMemoria() {
  const linhas: Array<{ emailHash: string; falhou: boolean; em: Date }> = [];
  const avisos: Array<{ email: string; falhas: number }> = [];
  let relogio = new Date("2026-10-08T12:00:00Z").getTime();
  const dep: DepositoDoBloqueio & { avisos: typeof avisos; avancar(ms: number): void; agora(): Date } = {
    avisos,
    avancar(ms) {
      relogio += ms;
    },
    agora: () => new Date(relogio),
    async historico(emailHash, agora) {
      const minhas = linhas.filter((l) => l.emailHash === emailHash && l.em.getTime() > agora.getTime() - 24 * 60 * MINUTO);
      const ultimoOk = [...minhas].reverse().find((l) => !l.falhou)?.em.getTime() ?? -Infinity;
      const falhas = minhas.filter((l) => l.falhou && l.em.getTime() > ultimoOk);
      return { falhas: falhas.length, ultimaFalhaEm: falhas.at(-1)?.em ?? null };
    },
    async registrar(a) {
      linhas.push({ emailHash: a.emailHash, falhou: a.falhou, em: new Date(relogio++) });
    },
    async avisarDono(a) {
      avisos.push({ email: a.email, falhas: a.falhas });
      return 1;
    },
  };
  return dep;
}

test("bloqueio: 20 senhas erradas seguidas bloqueiam a partir da 5a, avisam o dono em 10 e 20, e um acerto zera", async () => {
  const dep = depositoDoBloqueioEmMemoria();
  usarDepositoDoBloqueio(dep);
  try {
    const base = { email: "ninguem@exemplo.com", emailHash: "h1", ipHash: "ip1", agente: "teste" };
    const bloqueios: number[] = [];
    for (let i = 1; i <= 20; i++) {
      const antes = await conferirBloqueio("h1", dep.agora());
      if (antes.bloqueado) bloqueios.push(i);
      await registrarResultadoDoLogin({ ...base, falhou: true, agora: dep.agora() });
    }
    // Da 6a tentativa em diante (5 falhas já gravadas), toda tentativa acha a porta fechada.
    assert.deepEqual(bloqueios, [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    assert.deepEqual(dep.avisos, [
      { email: "ninguem@exemplo.com", falhas: 10 },
      { email: "ninguem@exemplo.com", falhas: 20 },
    ]);
    // Depois de 20 falhas: seis horas.
    const estado = await conferirBloqueio("h1", dep.agora());
    assert.equal(estado.bloqueado, true);
    if (estado.bloqueado) assert.ok(estado.esperarS > 5 * 60 * 60 && estado.esperarS <= 6 * 60 * 60);
    // Um acerto (a pessoa entrou) zera a conta.
    await registrarResultadoDoLogin({ ...base, falhou: false, agora: dep.agora() });
    assert.deepEqual(await conferirBloqueio("h1", dep.agora()), { bloqueado: false });
    // Outro e-mail nunca foi afetado.
    assert.deepEqual(await conferirBloqueio("h2", dep.agora()), { bloqueado: false });
  } finally {
    usarDepositoDoBloqueio(null);
  }
});

// ---------------------------------------------------------------------------
// 3. CORS e a lista de origens
// ---------------------------------------------------------------------------

test("origem: só a Demandou e o próprio host escrevem; sem Origin é servidor e passa", () => {
  assert.equal(origemPermitida(null, "demandou.com"), true);
  assert.equal(origemPermitida("https://demandou.com", "demandou.com"), true);
  assert.equal(origemPermitida("https://www.demandou.com", "demandou.com"), true);
  assert.equal(origemPermitida("https://dev.demandou.com", "demandou.com"), true);
  assert.equal(origemPermitida("https://DEMANDOU.COM/", "demandou.com"), true);
  // Preview da Vercel e localhost: o Origin é o próprio host da requisição.
  assert.equal(origemPermitida("https://opensquad-abc123.vercel.app", "opensquad-abc123.vercel.app"), true);
  assert.equal(origemPermitida("http://localhost:3101", "localhost:3101"), true);
  // Outro site, página sandbox, lixo: não.
  assert.equal(origemPermitida("https://golpe.com", "demandou.com"), false);
  assert.equal(origemPermitida("https://demandou.com.golpe.com", "demandou.com"), false);
  assert.equal(origemPermitida("null", "demandou.com"), false);
  assert.equal(origemPermitida("lixo", "demandou.com"), false);
  assert.equal(origemPermitida("http://localhost:3101", "demandou.com"), false);
  assert.equal(metodoEscreve("GET"), false);
  assert.equal(metodoEscreve("head"), false);
  assert.equal(metodoEscreve("OPTIONS"), false);
  assert.equal(metodoEscreve("POST"), true);
  assert.equal(metodoEscreve("DELETE"), true);
});

function arquivosDeCodigo(dir: string, saida: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome === ".next" || nome.startsWith(".")) continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) arquivosDeCodigo(p, saida);
    else if (/\.(ts|tsx|mjs|js)$/.test(nome)) saida.push(p);
  }
  return saida;
}

test("cors: nenhum arquivo do app, do proxy ou da configuração manda Access-Control-Allow-Origin", () => {
  const arquivos = [...arquivosDeCodigo("app"), ...arquivosDeCodigo("lib"), "proxy.ts", "next.config.ts", "vercel.json"];
  // Entre aspas: o cabeçalho sendo ESCRITO, e não citado num comentário.
  const culpados = arquivos.filter((p) => /["'`]access-control-allow-origin["'`]/i.test(readFileSync(p, "utf8")));
  assert.deepEqual(culpados, [], `CORS aberto em: ${culpados.join(", ")}`);
});

test("proxy: a escrita na API passa pela lista de origens antes das rotas públicas", () => {
  const fonte = readFileSync("proxy.ts", "utf8");
  assert.match(fonte, /origemPermitida\(req\.headers\.get\("origin"\), req\.headers\.get\("host"\)\)/);
  assert.ok(fonte.indexOf("origemPermitida(") < fonte.indexOf("PUBLIC_ROUTES.some("), "a conferência de origem vem antes do gate das rotas públicas");
});

// ---------------------------------------------------------------------------
// 4. Cabeçalhos de segurança
// ---------------------------------------------------------------------------

test("cabeçalhos: HSTS, nosniff, X-Frame-Options, CSP com frame-ancestors/base-uri/object-src e Referrer-Policy em todo caminho", async () => {
  const { default: config } = await import("../../next.config");
  const regras = await config.headers!();
  const geral = regras.find((r) => r.source === "/:path*");
  assert.ok(geral, "sem regra para /:path*");
  const mapa = Object.fromEntries(geral!.headers.map((h) => [h.key, h.value]));
  assert.equal(mapa["X-Content-Type-Options"], "nosniff");
  assert.equal(mapa["X-Frame-Options"], "DENY");
  assert.match(mapa["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.match(mapa["Content-Security-Policy"], /base-uri 'self'/);
  assert.match(mapa["Content-Security-Policy"], /object-src 'none'/);
  assert.equal(mapa["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.match(mapa["Strict-Transport-Security"], /max-age=63072000; includeSubDomains/);
  assert.match(mapa["Permissions-Policy"], /camera=\(self\)/);
});

// ---------------------------------------------------------------------------
// 5. O que a configuração do better-auth promete
// ---------------------------------------------------------------------------

test("auth: o limitador nativo está ligado em todo ambiente, no banco, com regras nas rotas sensíveis", () => {
  const fonte = readFileSync("lib/auth/index.ts", "utf8");
  const bloco = fonte.slice(fonte.indexOf("rateLimit: {"), fonte.indexOf("hooks: {"));
  assert.match(bloco, /enabled: true/);
  assert.match(bloco, /customStorage: armazemDoBetterAuth\(\)/);
  for (const rota of ["/sign-in/email", "/sign-up/email", "/request-password-reset", "/reset-password", "/verify-email", "/change-password", "/change-email", "/callback/*"]) {
    assert.ok(bloco.includes(`"${rota}"`), `sem regra para ${rota}`);
  }
  // O bloqueio progressivo e o registro do resultado estão amarrados ao login.
  assert.match(fonte, /conferirBloqueio\(hashDoEmail\(email\)\)/);
  assert.match(fonte, /registrarResultadoDoLogin\(/);
  // O cadastro repetido avisa a pessoa por e-mail, sem mudar a resposta.
  assert.match(fonte, /onExistingUserSignUp/);
});

test("segredos: nenhuma assinatura interna cai mais no segredo público \"demandou\"", () => {
  const arquivos = [
    "lib/media/callback-token.ts", "lib/media/piloto-do-servidor.ts", "lib/fila/trabalhos.ts", "lib/referencias/analise.ts", "lib/seguranca/segredo.ts",
  ];
  for (const p of arquivos) {
    const fonte = readFileSync(p, "utf8");
    assert.doesNotMatch(fonte, /\?\? "demandou"/, `${p} ainda cai em "demandou"`);
  }
  for (const p of ["app/api/cron/annual-credits/route.ts", "app/api/cron/pipeline/route.ts"]) {
    assert.match(readFileSync(p, "utf8"), /!segredoDoCron \|\|/, `${p} aceita cron sem CRON_SECRET`);
  }
});
