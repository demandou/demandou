// A conta dos planos de 08/10 (decisão do Bruno): o crédito é a moeda única na
// régua de R$ 0,027 de IA por crédito, o minuto de vídeo editado respeita a
// régua com o teto de US$ 1 por minuto na edição, os saldos deixam cada plano
// em até 30% do líquido no uso máximo, todo texto de minutos sai do mesmo
// número (só minutos, nunca "N gravações de X min"), e a duração de cada
// gravação depende de quem envia (5 min para membro e conta ligada ao
// contrato; vídeo longo só o titular; podcast de 3 h só o titular do
// Enterprise). Nada aqui toca banco, IA ou rede.
// Rodar: npx tsx --test scripts/testes/planos-margem-0810.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PLANOS_PUBLICOS, planoPublico } from "@/lib/planos";
import { ENTREGAS, comoContamos, fraseDoAcessoExtra, horasDeTrabalhoDoStarter, itensDoCartao, linhaDosMinutos, listaDoCartao, minutosDaConta, minutosDosCreditosExtras, minutosPorMesDoPlano, numerosDoCartao } from "@/lib/entregas-do-plano";
import { DOLAR_POR_CREDITO, REAIS_POR_CREDITO, REAIS_POR_DOLAR } from "@/lib/credits/higgsfield-tabela";
import { CREDITOS_DE_VIDEO } from "@/lib/credits/video-tabela";
import { ACESSO_EXTRA } from "@/lib/equipe/regras";
import { PACOTES_DE_CREDITO } from "@/lib/credits/pacotes-de-credito";
import { creditosDaGravacao } from "@/lib/credits/o-que-rende";
import {
  CREDITOS_DA_ABERTURA_DO_COMPLETO,
  CREDITOS_DA_MONTAGEM_DO_CORTE,
  CREDITOS_DO_COMPLETO_FIXOS,
  CREDITOS_DO_COMPLETO_POR_MINUTO,
  CREDITOS_DO_ROTEIRO_FIXOS,
  CREDITOS_DO_ROTEIRO_POR_MINUTO,
  CREDITOS_FIXOS_DA_EDICAO,
  CREDITOS_POR_CORTE_APROVADO,
  CREDITOS_POR_MINUTO,
  CREDITOS_POR_MINUTO_DE_VIDEO,
  CORTES_SUGERIDOS,
  LIMITES_SEM_PLANO,
  MINUTOS_POR_GRAVACAO_DO_MEMBRO,
  creditosEmDuasPartes,
  duracaoMaximaDaGravacaoMin,
  duracaoMaximaDoEnvioSeg,
  fraseDoVideoLongoDoMembro,
  validarVideo,
  type LimitesDoEnvio,
} from "@/lib/media/limits";
import {
  CaixaDaEdicao,
  CREDITOS_MINIMOS_POR_MINUTO_DE_VIDEO,
  CUSTO_FORA_DA_EDICAO_USD_POR_MINUTO,
  TETO_USD_DO_CORTE,
  TETO_USD_POR_MINUTO_DE_EDICAO,
  estimativaDaMidiaUsd,
  tetoDaEdicaoUsd,
  tetoDasMidiasUsd,
} from "@/lib/media/teto-da-edicao";
import { tetoDoVideoUsd } from "@/lib/media/jornada/decisoes";
import { tetoUsdPorMinuto } from "@/lib/media/editor-por-comando/plano-pelo-jev";
import { gerarTodos, ordemDaGeracao, type DependenciasDaGeracao } from "@/lib/media/jornada/geracao";
import { montarPelaJornada } from "@/lib/media/jornada/montar-servidor";
import type { ElementoAprovado } from "@/lib/media/jornada/estado";
import type { EntradaDoPrompt } from "@/lib/media/jornada/prompts";

const { fraseDoEstouro } = await import("@/lib/limites-do-plano");

// ─── as premissas da conta (as mesmas do HANDOFF de 08/10) ───
const DOLAR_DA_CONTA = 5.6;
const IMPOSTO = 0.06;
const STRIPE_PCT = 0.0469;
const STRIPE_FIXO = 0.39;
const TETO_DE_CUSTO = 0.3;
/** O crédito de vídeo por IA custa o que a geração custa: US$ 3,20 por 520 (cheio) e US$ 1,20 por 195 (rápido). */
const DOLAR_POR_CREDITO_DE_VIDEO = Math.max(3.2 / CREDITOS_DE_VIDEO.cheio_8s, 1.2 / CREDITOS_DE_VIDEO.rapido_8s);
const liquido = (mensal: number) => mensal * (1 - IMPOSTO - STRIPE_PCT) - STRIPE_FIXO;
const SEM_TRAVESSAO = (t: string) => assert.ok(!t.includes(String.fromCharCode(0x2014)), `travessão em "${t}"`);

test("a régua: R$ 0,027 a R$ 5,36 são US$ 0,005037 por crédito", () => {
  assert.equal(REAIS_POR_CREDITO, 0.027);
  assert.equal(REAIS_POR_DOLAR, 5.36);
  assert.ok(Math.abs(DOLAR_POR_CREDITO - 0.027 / 5.36) < 1e-12);
});

test("o minuto de vídeo editado respeita a régua: 230 créditos pagam o teto de US$ 1 mais o que roda fora da edição", () => {
  assert.equal(TETO_USD_POR_MINUTO_DE_EDICAO, 1);
  assert.equal(CUSTO_FORA_DA_EDICAO_USD_POR_MINUTO, 0.15);
  assert.ok(CREDITOS_MINIMOS_POR_MINUTO_DE_VIDEO > 228 && CREDITOS_MINIMOS_POR_MINUTO_DE_VIDEO < 229, `mínimo ${CREDITOS_MINIMOS_POR_MINUTO_DE_VIDEO}`);
  assert.equal(CREDITOS_POR_MINUTO_DE_VIDEO, 230);
  assert.equal(CREDITOS_POR_MINUTO_DE_VIDEO, CREDITOS_DO_ROTEIRO_POR_MINUTO + CREDITOS_DO_COMPLETO_POR_MINUTO);
  assert.ok(CREDITOS_POR_MINUTO_DE_VIDEO >= CREDITOS_MINIMOS_POR_MINUTO_DE_VIDEO, "abaixo da régua");
  // A parte do completo paga sozinha o teto da edição (o roteiro paga o que roda antes de aprovar).
  assert.ok(CREDITOS_DO_COMPLETO_POR_MINUTO * DOLAR_POR_CREDITO >= TETO_USD_POR_MINUTO_DE_EDICAO);
  // Os atalhos da cobrança única continuam iguais às partes.
  assert.equal(CREDITOS_POR_MINUTO, CREDITOS_POR_MINUTO_DE_VIDEO);
  assert.equal(CREDITOS_FIXOS_DA_EDICAO, CREDITOS_DO_ROTEIRO_FIXOS + CREDITOS_DO_COMPLETO_FIXOS + CORTES_SUGERIDOS * CREDITOS_POR_CORTE_APROVADO);
});

test("corte e completo seguem a mesma lógica: cada um cobra o que pode custar na régua", () => {
  // O corte gera sozinho no máximo US$ 1 (TETO_USD_DO_CORTE) e ainda paga textos, capa, redação e revisão (~US$ 0,2).
  assert.equal(TETO_USD_DO_CORTE, 1);
  assert.ok(CREDITOS_POR_CORTE_APROVADO * DOLAR_POR_CREDITO >= TETO_USD_DO_CORTE + 0.2, `corte paga US$ ${(CREDITOS_POR_CORTE_APROVADO * DOLAR_POR_CREDITO).toFixed(2)}`);
  assert.ok(CREDITOS_DA_MONTAGEM_DO_CORTE < CREDITOS_POR_CORTE_APROVADO && CREDITOS_DA_MONTAGEM_DO_CORTE * DOLAR_POR_CREDITO >= TETO_USD_DO_CORTE);
  // O piso de US$ 1 por vídeo: a duração cobrada é arredondada para cima, então 1 minuto cobrado paga o piso.
  assert.ok(CREDITOS_DO_COMPLETO_POR_MINUTO * DOLAR_POR_CREDITO >= tetoDaEdicaoUsd(20));
  // A abertura dos melhores momentos (Sonnet, ~US$ 0,05) e o fixo do completo (capas, enquadramento, redação, ~US$ 0,3).
  assert.ok(CREDITOS_DA_ABERTURA_DO_COMPLETO * DOLAR_POR_CREDITO >= 0.05);
  assert.ok(CREDITOS_DO_COMPLETO_FIXOS * DOLAR_POR_CREDITO >= 0.3);
  // A gravação de referência: 1.450 fixos mais 230 por minuto, nas duas partes.
  const p = creditosEmDuasPartes(30 * 60);
  assert.equal(p.total, CREDITOS_FIXOS_DA_EDICAO + CREDITOS_DA_ABERTURA_DO_COMPLETO + 30 * CREDITOS_POR_MINUTO_DE_VIDEO);
  assert.equal(p.total, 8350);
  assert.equal(creditosDaGravacao(0), 1450);
});

test("cada plano, gastando TUDO (saldo na régua mais a carteira de vídeo por IA ao custo dela), fica em até 30% do líquido", () => {
  const linhas: string[] = [];
  for (const p of PLANOS_PUBLICOS) {
    const liq = liquido(p.mensal);
    const custoUsd = p.creditosPorMes * DOLAR_POR_CREDITO + p.creditosDeVideoPorMes * DOLAR_POR_CREDITO_DE_VIDEO;
    const custo = custoUsd * DOLAR_DA_CONTA;
    const fracao = custo / liq;
    linhas.push(`${p.nome}: R$ ${custo.toFixed(0)} de R$ ${liq.toFixed(0)} = ${(fracao * 100).toFixed(1)}%`);
    assert.ok(fracao <= TETO_DE_CUSTO + 1e-9, `${p.nome} passa de 30%: ${(fracao * 100).toFixed(1)}%`);
    // E não fica folgado demais: acima de 25%, senão o saldo está pequeno para o preço.
    assert.ok(fracao >= 0.25, `${p.nome} com folga demais: ${(fracao * 100).toFixed(1)}%`);
  }
  assert.deepEqual(
    PLANOS_PUBLICOS.map((p) => [p.id, p.creditosPorMes, p.creditosDeVideoPorMes]),
    [
      ["pro", 20000, 4160],
      ["business", 32000, 4160],
      ["studio", 48000, 4160],
    ],
    linhas.join("; ")
  );
});

test("os minutos de cada plano saem do saldo (o que ele paga numa gravação só, a 230 por minuto depois da parte fixa): 80, 132 e 202", () => {
  assert.equal(minutosPorMesDoPlano("pro"), 80);
  assert.equal(minutosPorMesDoPlano("business"), 132);
  assert.equal(minutosPorMesDoPlano("studio"), 202);
  for (const p of PLANOS_PUBLICOS) {
    const min = minutosPorMesDoPlano(p.id);
    assert.equal(min, ENTREGAS[p.id].minutosDeVideo);
    assert.equal(min, Math.floor((p.creditosPorMes - creditosDaGravacao(0)) / CREDITOS_POR_MINUTO_DE_VIDEO));
    // Uma gravação só com esses minutos cabe no saldo; com um minuto a mais, não.
    assert.ok(creditosDaGravacao(min) <= p.creditosPorMes);
    assert.ok(creditosDaGravacao(min + 1) > p.creditosPorMes);
    // O titular consegue enviar a gravação mais longa do plano dentro dos minutos do mês (o podcast de 3 h no Enterprise).
    assert.ok(p.duracaoMaximaMin <= min, `${p.nome}: duração máxima ${p.duracaoMaximaMin} acima dos ${min} minutos do mês`);
  }
  // 10/10, noite (Bruno): por vídeo, Starter até 7 min, Pro até 22 min, Enterprise até 2 h.
  assert.equal(planoPublico("studio").duracaoMaximaMin, 120, "o vídeo do Enterprise é de até 2 horas");
  // O que é pago a mais vira minutos na mesma régua: o acesso extra (1.800) são 7 minutos; um pacote de 4.700, 20.
  assert.equal(minutosDosCreditosExtras(ACESSO_EXTRA.creditosPorMes), 7);
  assert.equal(minutosDosCreditosExtras(4700), 20);
  // A conta soma os créditos pagos a mais antes de converter: 2 x 1.800 + 4.700 = 8.300 créditos = 36 minutos.
  assert.equal(minutosDaConta("pro", 2, 4700), 80 + 36);
  assert.equal(minutosDaConta("business"), 132);
});

test("os textos mostram SÓ MINUTOS, nunca 'N gravações de X min': cartão, aba Plano, ajuda, landing e contrato", () => {
  for (const p of PLANOS_PUBLICOS) {
    const min = minutosPorMesDoPlano(p.id);
    const esperado = min % 60 === 0 ? `${min / 60} hora${min / 60 > 1 ? "s" : ""}` : `${min} minutos`;
    assert.equal(listaDoCartao(p)[0], linhaDosMinutos(p));
    assert.equal(linhaDosMinutos(p), `${esperado} de vídeo editado por mês, numa gravação só ou em várias`);
    assert.ok(itensDoCartao(p).some((t) => t.startsWith(`${min} minutos de vídeo editado por mês`)), itensDoCartao(p)[0]);
    const numeros = numerosDoCartao(p);
    assert.equal(numeros[0].valor, `${min} min`);
    for (const t of [...listaDoCartao(p), ...itensDoCartao(p), ...p.features, ...numeros.flatMap((n) => [n.valor, n.rotulo, n.detalhe])]) {
      assert.doesNotMatch(t, /gravaç(ão|ões) de até|Gravações longas|podcast|\d+ gravaç(ão|ões) por mês|em \d+ gravaç/i, t);
      SEM_TRAVESSAO(t);
    }
  }
  const ajuda = comoContamos();
  for (const l of ajuda.linhas) {
    assert.doesNotMatch(l, /\d+ x \d+ min|gravações do mês com a mesma duração/, l);
    SEM_TRAVESSAO(l);
  }
  assert.deepEqual(ajuda.tabela.map((t) => t.minutos), ["80 min", "132 min", "202 min"]);
  assert.doesNotMatch(fraseDoAcessoExtra(), /gravaç/);
  assert.match(fraseDoAcessoExtra(), /saldo para mais 7 minutos de vídeo editado ou 6 cortes/);
  // A landing: as horas de trabalho do Starter (os minutos do plano mais a hora de aprovação), na hero, na faixa e em "A conta do mês".
  assert.equal(horasDeTrabalhoDoStarter(), Math.round(minutosPorMesDoPlano("pro") / 60) + 1);
  for (const f of ["components/landing/hero.tsx", "components/landing/faixa-de-prova.tsx", "components/landing/valor.tsx"]) {
    const s = readFileSync(f, "utf8");
    assert.match(s, /horasDeTrabalhoDoStarter\(\)/, `${f} não lê as horas do plano`);
    assert.doesNotMatch(s, /em 3 horas|3 horas suas|de até 30 minutos|gravações de até/, `${f} ainda tem o número antigo escrito à mão`);
  }
  // O contrato (modelo do dia) traz os mesmos minutos, por plano, o crédito do minuto, e não promete gravações por ciclo.
  const md = readFileSync("lib/contratos/modelos/condicoes-gerais.md", "utf8");
  assert.match(md, new RegExp(`\\| Minutos de vídeo editado por Ciclo [^|]*${CREDITOS_POR_MINUTO_DE_VIDEO} Créditos\\) \\| ${minutosPorMesDoPlano("pro")} minutos \\| ${minutosPorMesDoPlano("business")} minutos \\| ${minutosPorMesDoPlano("studio")} minutos \\|`));
  assert.match(md, new RegExp(`\\| Créditos por Ciclo \\| ${planoPublico("pro").creditosPorMes.toLocaleString("pt-BR")} \\| ${planoPublico("business").creditosPorMes.toLocaleString("pt-BR")} \\| ${planoPublico("studio").creditosPorMes.toLocaleString("pt-BR")} \\|`));
  assert.match(md, new RegExp(`soma ${ACESSO_EXTRA.creditosPorMes.toLocaleString("pt-BR")} Créditos e 1 marca por Ciclo`));
  assert.doesNotMatch(md, /\| Gravações ou campanhas por Ciclo \|/);
  assert.doesNotMatch(md, /Duração máxima de cada Gravação \| 1 hora/);
  assert.match(md, /\| Duração máxima de cada Gravação enviada pelo Titular da Conta \| 1 hora \| 2 horas \| 3 horas \|/);
  assert.match(md, new RegExp(`\\| Duração máxima de cada Gravação enviada por Membro ou conta ligada ao contrato \\| ${MINUTOS_POR_GRAVACAO_DO_MEMBRO} minutos \\| ${MINUTOS_POR_GRAVACAO_DO_MEMBRO} minutos \\| ${MINUTOS_POR_GRAVACAO_DO_MEMBRO} minutos \\|`));
});

test("acesso extra e pacotes avulsos respeitam a régua com o crédito de vídeo novo (até 30% do líquido)", () => {
  const custo = (creditos: number) => creditos * DOLAR_POR_CREDITO * DOLAR_DA_CONTA;
  assert.equal(ACESSO_EXTRA.creditosPorMes, 1800);
  assert.ok(custo(ACESSO_EXTRA.creditosPorMes) / liquido(ACESSO_EXTRA.precoMensal) <= TETO_DE_CUSTO);
  for (const p of PACOTES_DE_CREDITO) assert.ok(custo(p.creditos) / liquido(p.reais) <= TETO_DE_CUSTO, p.id);
});

// ─── a duração de cada gravação por papel ───

test("quem envia pela equipe ou pelo contrato sobe até 5 minutos; o titular sobe a duração do plano (7 min, 22 min, 2 h)", () => {
  assert.equal(MINUTOS_POR_GRAVACAO_DO_MEMBRO, 5);
  for (const p of PLANOS_PUBLICOS) {
    assert.equal(duracaoMaximaDaGravacaoMin("membro", p.duracaoMaximaMin), 5, p.nome);
    assert.equal(duracaoMaximaDaGravacaoMin("titular", p.duracaoMaximaMin), p.duracaoMaximaMin, p.nome);
  }
  assert.deepEqual(PLANOS_PUBLICOS.map((p) => duracaoMaximaDaGravacaoMin("titular", p.duracaoMaximaMin)), [7, 22, 120]);
  // O envio: o teto é o menor entre o papel e o que sobra no mês.
  assert.equal(duracaoMaximaDoEnvioSeg(duracaoMaximaDaGravacaoMin("membro", 180), 150), 5 * 60);
  assert.equal(duracaoMaximaDoEnvioSeg(duracaoMaximaDaGravacaoMin("titular", 180), 150), 150 * 60);
  assert.equal(duracaoMaximaDoEnvioSeg(duracaoMaximaDaGravacaoMin("titular", 180), 202), 180 * 60);
});

const limitesDe = (o: Partial<LimitesDoEnvio>): LimitesDoEnvio => ({
  duracaoMaximaSeg: 60 * 60,
  bytesMaximo: 4 * 1024 ** 3,
  plano: "Starter",
  proximo: { nome: "Pro", duracaoMaximaMin: 120, arquivoMaximoGb: 8, minutosPorMes: 132 },
  minutos: { porMes: 80, usados: 10, restantes: 70 },
  papel: { tipo: "titular", duracaoMaximaMin: 60, dono: null, contrato: false },
  ...o,
});

test("a tela de envio avisa antes de subir, com a mensagem clara de cada caso", () => {
  const mb = 500 * 1024 * 1024;
  // 1. Conta ligada ao contrato (vendedor): 6 minutos não sobem; a frase diz quem envia o longo.
  const contrato = limitesDe({ duracaoMaximaSeg: duracaoMaximaDoEnvioSeg(5, 70), proximo: null, papel: { tipo: "membro", duracaoMaximaMin: 5, dono: "contrato SEED (titular Matheus)", contrato: true } });
  const r1 = validarVideo(mb, 6 * 60, contrato);
  assert.equal(r1.ok, false);
  if (!r1.ok) {
    assert.equal(r1.motivo, "Esse vídeo tem 6 minutos. Vídeos acima de 5 minutos só a titular do contrato envia.");
    assert.match(String(r1.dica), /peça a titular do contrato para enviar o vídeo inteiro/);
  }
  assert.equal(validarVideo(mb, 4 * 60 + 50, contrato).ok, true);
  // 2. Membro da equipe (convite): a mesma trava, com o nome de quem administra a conta.
  const equipe = limitesDe({ duracaoMaximaSeg: duracaoMaximaDoEnvioSeg(5, 70), proximo: null, papel: { tipo: "membro", duracaoMaximaMin: 5, dono: "Ana Lima", contrato: false } });
  const r2 = validarVideo(mb, 12 * 60, equipe);
  assert.equal(r2.ok, false);
  if (!r2.ok) assert.equal(r2.motivo, "Esse vídeo tem 12 minutos. Vídeos acima de 5 minutos só Ana Lima, que administra a conta, envia.");
  assert.equal(fraseDoVideoLongoDoMembro(5, false, null), "Vídeos acima de 5 minutos só quem administra a conta envia.");
  // 3. Titular do Starter com 61 minutos: a duração do plano, e o plano de cima que resolve.
  const titular = limitesDe({ duracaoMaximaSeg: duracaoMaximaDoEnvioSeg(60, 70), minutos: { porMes: 80, usados: 10, restantes: 70 } });
  const r3 = validarVideo(mb, 61 * 60, titular);
  assert.equal(r3.ok, false);
  if (!r3.ok) {
    assert.match(r3.motivo, /Esse vídeo tem 61 minutos, e o limite no Starter é de 1 hora\./);
    assert.match(String(r3.dica), /O Pro aceita até 2 horas\./);
  }
  assert.equal(validarVideo(mb, 60 * 60, titular).ok, true);
  // 4. Titular do Enterprise: o podcast de 3 horas sobe; 3 h e 1 min não.
  const enterprise = limitesDe({ duracaoMaximaSeg: duracaoMaximaDoEnvioSeg(180, 202), plano: "Enterprise", proximo: null, minutos: { porMes: 202, usados: 0, restantes: 202 }, papel: { tipo: "titular", duracaoMaximaMin: 180, dono: null, contrato: false } });
  assert.equal(validarVideo(mb, 180 * 60, enterprise).ok, true);
  assert.equal(validarVideo(mb, 181 * 60, enterprise).ok, false);
  // 5. Os minutos do mês: o que barra é o total do ciclo, e a frase fala dos minutos do cartão.
  const quaseNoFim = limitesDe({ duracaoMaximaSeg: duracaoMaximaDoEnvioSeg(60, 20), minutos: { porMes: 80, usados: 60, restantes: 20 } });
  const r5 = validarVideo(mb, 25 * 60, quaseNoFim);
  assert.equal(r5.ok, false);
  if (!r5.ok) {
    assert.match(r5.motivo, /o Starter inclui 80 minutos de vídeo editado por mês, e ainda cabem 20 minutos este mês/);
    assert.match(String(r5.dica), /O Pro tem 132 minutos por mês/);
  }
  assert.equal(validarVideo(mb, 18 * 60, quaseNoFim).ok, true);
  // 6. Acesso interno: só a duração técnica, como antes.
  assert.equal(validarVideo(mb, 25 * 60, LIMITES_SEM_PLANO).ok, true);
});

test("a recusa do servidor diz a mesma coisa que a tela, para cada papel", () => {
  const base = { usado: 12, limite: 5, plano: "Pro", sugestao: null, renovaEm: null } as const;
  assert.equal(fraseDoEstouro({ ...base, recurso: "duracao", equipe: "contrato", dono: "contrato SEED (titular Matheus)" }), "Esse vídeo tem 12 minutos. Vídeos acima de 5 minutos só a titular do contrato envia.");
  assert.equal(fraseDoEstouro({ ...base, recurso: "duracao", equipe: "cota", dono: "Ana Lima" }), "Esse vídeo tem 12 minutos. Vídeos acima de 5 minutos só Ana Lima, que administra a conta, envia.");
  assert.equal(
    fraseDoEstouro({ recurso: "duracao", usado: 150, limite: 120, plano: "Pro", renovaEm: null, sugestao: { planoId: "studio", nome: "Enterprise", marcas: 5, gravacoesPorMes: 16, armazenamentoGb: 192, minutosPorMes: 202, duracaoMaximaMin: 180 } }),
    "Esse vídeo tem 150 minutos, e o Pro aceita gravações de até 2 horas. O Enterprise aceita até 3 horas."
  );
  assert.equal(fraseDoEstouro({ recurso: "duracao", usado: 200, limite: 180, plano: "Enterprise", renovaEm: null, sugestao: null }), "Esse vídeo tem 200 minutos, e o Enterprise aceita gravações de até 3 horas.");
  assert.match(fraseDoEstouro({ recurso: "minutos", usado: 95.5, limite: 80, plano: "Starter", renovaEm: null, sugestao: null }), /O Starter inclui 80 minutos de vídeo editado por mês, e com esta gravação você passaria de 96 minutos\./);
  assert.match(fraseDoEstouro({ recurso: "minutos", usado: 140, limite: 132, plano: "Pro", renovaEm: null, sugestao: null, equipe: "contrato", dono: "contrato SEED (titular Matheus)" }), /O time do contrato SEED \(titular Matheus\) já usou os 132 minutos de vídeo editado deste mês.*fale com a titular do contrato\./);
  for (const t of [fraseDoEstouro({ ...base, recurso: "duracao", equipe: "cota", dono: "Ana" })]) SEM_TRAVESSAO(t);
});

// ─── o teto da edição no código ───

test("o teto é um só, US$ 1 por minuto com piso de US$ 1, nas duas esteiras; o plano orça as mídias com a reserva do diretor", () => {
  assert.equal(tetoDaEdicaoUsd(60), 1);
  assert.equal(tetoDaEdicaoUsd(20), 1);
  assert.equal(tetoDaEdicaoUsd(22 * 60), 22);
  assert.ok(tetoDasMidiasUsd(22 * 60) < 22 && tetoDasMidiasUsd(22 * 60) >= 19);
  assert.ok(tetoDasMidiasUsd(60) < 1);
  delete process.env.JORNADA_TETO_USD_POR_MINUTO;
  delete process.env.EDITOR_TETO_USD_POR_MINUTO;
  assert.equal(tetoDoVideoUsd(22 * 60), tetoDasMidiasUsd(22 * 60));
  assert.equal(tetoUsdPorMinuto(), 1);
  assert.ok(estimativaDaMidiaUsd("video") > estimativaDaMidiaUsd("recorte") && estimativaDaMidiaUsd("recorte") > estimativaDaMidiaUsd("imagem") && estimativaDaMidiaUsd("grafico") === 0);
});

test("a caixa soma o diretor: redator, JEV e mídias entram no mesmo teto, e o que não cabe fica de fora sem falhar", () => {
  const caixa = new CaixaDaEdicao(1, 0.2);
  assert.equal(caixa.gasto, 0.2);
  caixa.gastar(0.3, "jornada-prompts");
  assert.equal(caixa.sobra, 0.5);
  assert.ok(caixa.cabe(0.5) && !caixa.cabe(0.51));
  caixa.gastar(0.4, "reserva el1");
  caixa.devolver(0.1, "acerto el1");
  assert.equal(caixa.gasto, 0.8);
  assert.ok(!caixa.estourou);
  caixa.recusar(0.336, "B-roll el2");
  assert.match(caixa.resumo(), /teto da edição US\$ 1\.00, gasto US\$ 0\.80, 1 de fora \(B-roll el2\)/);
});

const entrada = (id: string, midia: EntradaDoPrompt["midia"], t: number): EntradaDoPrompt & { t: number } => ({
  id, descricao: `elemento ${id}`, pedidos: [], textoNaImagem: null, fala: "fala", cena: null, formato: midia === "video" ? "broll" : midia === "recorte" ? "recorte-sobre" : "janela", midia, proporcao: "1:1", papel: "elemento", t,
});

function deps(caixa: CaixaDaEdicao | null, gerados: string[]): DependenciasDaGeracao {
  return {
    caixa,
    concorrencia: 1,
    imagem: async () => { gerados.push("imagem"); return { dados: Buffer.from("x"), custoUsd: 0.168, modelo: "img" }; },
    imagemReserva: async () => ({ dados: Buffer.from("x"), custoUsd: 0.134, modelo: "reserva" }),
    video: async () => { gerados.push("video"); return { dados: Buffer.from("x"), custoUsd: 0.336, modelo: "kling" }; },
    recortar: async (p) => ({ png: p, custoUsd: 0.003 }),
    lerTexto: async () => ({ texto: "", custoUsd: 0 }),
    gravar: async (_d, id) => `https://blob/${id}.webp`,
    medir: async () => 1,
    avisarAdmin: () => {},
  };
}

test("a geração sob o teto: imagens primeiro, B-roll por último; ao bater o teto, entrega o que já tem pago e nunca joga fora o gerado", async () => {
  const entradas = [entrada("el1", "video", 2), entrada("el2", "imagem", 5), entrada("el3", "imagem", 9), entrada("el4", "video", 12), entrada("el5", "imagem", 15)];
  assert.deepEqual(ordemDaGeracao(entradas).map((e) => e.id), ["el2", "el3", "el5", "el1", "el4"]);
  const prompts = Object.fromEntries(entradas.map((e) => [e.id, `prompt for ${e.id} long enough to count as a prompt here`]));
  // Teto de US$ 1 com US$ 0,15 já gastos no plano e no diretor: cabem as três imagens (0,504) e um B-roll (0,336 = 0,99); o segundo B-roll fica de fora.
  const caixa = new CaixaDaEdicao(1, 0.15);
  const gerados: string[] = [];
  const g = await gerarTodos(entradas, prompts, deps(caixa, gerados));
  assert.deepEqual(gerados, ["imagem", "imagem", "imagem", "video"]);
  const porId = Object.fromEntries(g.gerados.map((x) => [x.id, x]));
  assert.ok(porId.el2.url && porId.el3.url && porId.el5.url && porId.el1.url, "o pago fica");
  assert.equal(porId.el4.url, null);
  assert.equal(porId.el4.foraDoTeto, true);
  assert.equal(porId.el4.custoUsd, 0);
  assert.match(String(porId.el4.avisoAdmin), /teto de US\$ 1\.00/);
  assert.ok(!caixa.estourou, `gasto ${caixa.gasto}`);
  assert.ok(Math.abs(caixa.gasto - (0.15 + 3 * 0.168 + 0.336)) < 1e-6);
  // Sem caixa (prova local), nada é recusado.
  const todos = await gerarTodos(entradas, prompts, deps(null, []));
  assert.ok(todos.gerados.every((x) => x.url));
});

test("a montagem pela jornada nunca falha por teto: com a caixa cheia, sai com o que há e avisa o admin", async () => {
  const palavras = "a pressão de doze por oito é o normal para um adulto saudável".split(" ").map((w, i) => ({ texto: w, inicio: i * 0.5, fim: i * 0.5 + 0.4 }));
  const el = (id: string, midia: ElementoAprovado["midia"], indice: number): ElementoAprovado => ({
    id, momento: { indice: 0, de: 0, ate: 6, frase: palavras.map((p) => p.texto).join(" ") }, gatilho: { palavra: palavras[indice].texto, indice, t: palavras[indice].inicio },
    descricao: `elemento ${id}`, textoNaImagem: null, midia, formato: midia === "video" ? "broll" : "janela", porque: "", custoUsd: 0.17, origem: "ia", papel: "elemento", pedidos: [],
  });
  const aprovados = [el("el1", "imagem", 1), el("el2", "video", 5), el("el3", "video", 9)];
  // A caixa já quase cheia pelo diretor: cabe a imagem, os dois B-rolls ficam de fora, e cada chamada do redator entra na conta.
  const caixa = new CaixaDaEdicao(1, 0.6);
  const gerados: string[] = [];
  const redator = async () => {
    caixa.gastar(0.01, "jornada-prompts");
    return JSON.stringify({ prompts: Object.fromEntries(aprovados.map((a) => [a.id, `A clean illustration for ${a.id}, studio light, isolated`])), textos: {} });
  };
  const m = await montarPelaJornada({
    estado: { aprovado: { em: new Date().toISOString(), elementos: aprovados }, leitura: null, midiasMantidas: null },
    falaDoPlano: palavras, falaDoRender: palavras, duracao: 7, formato: "9:16", W: 1080, H: 1920, fps: 30, amostras: [],
    contexto: { marca: "x", nicho: "y", perfil: null, cores: { acento: "#f00", escuro: "#000", claro: "#fff" }, estiloDoCliente: "", formato: "9:16", duracao: 7, destino: "curto" },
    legenda: { mostrar: false }, temTrilha: false, jev: null, geracao: deps(caixa, gerados), redator, direcao: null, caixa,
  });
  assert.deepEqual(gerados, ["imagem"]);
  assert.deepEqual(m.foraDoTeto.sort(), ["el2", "el3"]);
  assert.ok(m.avisosDoAdmin.some((a) => /teto da edição: 2 elemento\(s\) de fora/.test(a)), m.avisosDoAdmin.join(" | "));
  assert.equal(m.custoUsd.tetoUsd, 1);
  assert.ok(m.custoUsd.edicao !== null && m.custoUsd.edicao > 0.6 && m.custoUsd.edicao <= 1, `edição US$ ${m.custoUsd.edicao}`);
  assert.ok(m.custoUsd.geracao > 0, "a imagem foi paga e ficou");
});
