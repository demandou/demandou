// Os defeitos das artes que o teste de ponta a ponta de 11/10 achou (Maquete 3D,
// projeto de teste cmtmym5bo): o post com arte e o lote pendente para sempre (a
// escrita velha da correção da Vera), o número da pesquisa desenhado no
// infográfico, o infográfico fora da linguagem da Maquete, a frase cortada por
// palavra, a frase que repete um trecho e o destaque ilegível. Nada aqui toca
// banco, rede ou imagem paga: gerador, conferência e redator são falsos.
// Rodar: npx tsx --test scripts/testes/artes-do-e2e-1110.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  marcasDoModelo,
  metadataComMudancas,
  prazoDaArte,
  PRAZO_DA_ARTE_NO_MODELO_MS,
  PRAZO_DA_ARTE_PELA_IA_MS,
} from "@/lib/media/editor-do-curso/arte-pelo-modelo";
import { infograficoSoComAFala, lastroDaArte } from "@/lib/media/lastro-do-video";
import { regraDosNumerosDaFala } from "@/lib/media/infographic";
import { linguagemDoInfografico, promptDaArteNoModelo, promptDeEstiloDoModelo, composicaoDaPeca } from "@/lib/media/editor-do-curso/arte-pela-ia";
import { promptDoInfografico } from "@/lib/media/infografico-pelo-modelo";
import { fraseGarantida, mancheteCurta, pareceTruncada, problemaDaFrase, trechoRepetido } from "@/lib/media/frase-da-arte";
import { contraste, destaqueLegivel, medidaDaCor } from "@/lib/media/papeis-da-paleta";

const MAQUETE = promptDeEstiloDoModelo("sob-medida-3d")!;

// ───────────── 1. o post com arte e o lote pendente para sempre ─────────────

/** O metadata do post de segunda (cmv422x5f) como a semana o criou: lote pela IA, "fazendo". */
function criadoPelaSemana() {
  return {
    origem: "video",
    videoJobId: "v",
    frase: "A frase do dia",
    ...marcasDoModelo({}, { lote: "arte-run-x-1", indices: [2], formato: "4:5", modelo: "sob-medida-3d", pelaIa: true }, new Date("2026-10-11T16:47:02Z")),
  } as Record<string, unknown>;
}

/** O que a arte pela IA grava quando sai (desenharGrupoNoEstilo: semEspera + fecharArte). */
function fechadoPelaArte(m: Record<string, unknown>) {
  const { aguardandoIdentidade: _a, gerandoArte: _g, ...resto } = m;
  void _a;
  void _g;
  return { ...resto, arteNoModelo: { ...(m.arteNoModelo as object), pendente: false, feitoEm: "2026-10-11T16:48:07Z", pelaIa: true } };
}

test("a correção da Vera que grava depois da arte não desfaz a arte (o pendente para sempre de 11/10)", () => {
  const lidoPelaVera = criadoPelaSemana();
  const noBancoAgora = fechadoPelaArte(lidoPelaVera);
  // O jeito antigo: o metadata lido antes, por cima de tudo. Reproduz o defeito.
  const antigo = { ...lidoPelaVera };
  assert.equal((antigo.arteNoModelo as { pendente: boolean }).pendente, true);
  assert.equal(antigo.aguardandoIdentidade, true);
  // O jeito novo: o metadata lido na hora da gravação, com só o que mudou.
  const novo = metadataComMudancas(noBancoAgora, { frase: "A frase nova da Vera" });
  assert.equal((novo.arteNoModelo as { pendente: boolean }).pendente, false);
  assert.equal(novo.aguardandoIdentidade, undefined);
  assert.equal(novo.gerandoArte, undefined);
  assert.equal(novo.frase, "A frase nova da Vera");
});

test("a arte nova no estilo (a Diana pela Vera) fecha o lote e tira a espera", () => {
  const pendente = { ...criadoPelaSemana(), arteNoModelo: { ...(criadoPelaSemana().arteNoModelo as object), reserva: "a arte do modelo não voltou no prazo" } };
  const m = metadataComMudancas(pendente, { frase: "Outra" }, { arteNovaNoEstilo: true, agora: new Date("2026-10-11T17:00:00Z") });
  const a = m.arteNoModelo as Record<string, unknown>;
  assert.equal(a.pendente, false);
  assert.equal(a.feitoEm, "2026-10-11T17:00:00.000Z");
  assert.equal(a.modelo, "sob-medida-3d");
  assert.equal("reserva" in a, false);
  assert.equal(m.aguardandoIdentidade, undefined);
  assert.equal(m.gerandoArte, undefined);
});

test("pela IA o fazendo vale 25 minutos, não as 2 horas da fila do worker", () => {
  assert.equal(prazoDaArte(true), PRAZO_DA_ARTE_PELA_IA_MS);
  assert.equal(prazoDaArte(false), PRAZO_DA_ARTE_NO_MODELO_MS);
  const m = criadoPelaSemana() as { gerandoArte: { desde: string; ate: string } };
  assert.equal(Date.parse(m.gerandoArte.ate) - Date.parse(m.gerandoArte.desde), 25 * 60_000);
});

// ───────────── 2. número desenhado só da fala ─────────────

/** O conteúdo do infográfico do teste de ponta a ponta (cmv423azt): todos os números são da pesquisa. */
const DO_E2E = {
  title: "Excelência Essencial: A Verdadeira Produtividade Bíblica",
  subtitle: "Descubra como a perspectiva bíblica redefine a produtividade, focando em fazer o essencial com excelência.",
  highlight: { value: "40%", label: "Redução amarguras nos relacionamentos" },
  sections: [
    { heading: "Essencialismo na Fé", body: "Produtividade bíblica não é trabalhar mais, mas fazer o essencial com excelência." },
    { heading: "Remir o Tempo", body: "Ser produtivo é escolher a única coisa necessária, conforme a lição de Maria e Jesus." },
    { heading: "Conexão Vital: Bem-Estar e Performance", stat: "89%", body: "Há uma forte ligação entre o bem-estar dos profissionais e a performance no trabalho." },
    { heading: "Prioridades do Líder", stat: "52%", body: "Líderes enfrentam o dilema de equilibrar a produtividade com o bem-estar." },
  ],
  keyNumbers: [
    { value: "44%", label: "Bem-estar é 4ª preocupação líder" },
    { value: "32%", label: "Redução em problemas com raiva" },
  ],
};
const FALA_SEM_NUMERO =
  "Excelência é você fazer o certo com o que você tem. Lembra Jesus com Marta e Maria? Maria nos pés de Jesus, Marta querendo fazer monte de coisa. Produtividade num conceito bíblico é ter excelência naquilo que deveria ser feito.";

test("o infográfico do teste de ponta a ponta perde todo número que a pessoa não disse", () => {
  const r = infograficoSoComAFala(DO_E2E, lastroDaArte({ transcricao: FALA_SEM_NUMERO, material: ["Fé & Gestão"] }));
  const tudo = JSON.stringify(r.conteudo);
  for (const n of ["40", "89", "52", "44", "32", "4ª"]) assert.ok(!tudo.includes(n), `${n} ficou no infográfico`);
  assert.equal(r.conteudo.highlight, undefined);
  assert.deepEqual(r.conteudo.keyNumbers, []);
  assert.equal(r.refazer, false);
  // As ideias sem número ficam: o infográfico organiza, não inventa.
  assert.equal(r.conteudo.sections?.length, 4);
  assert.equal(r.conteudo.sections?.some((s) => s.stat), false);
  assert.equal(r.conteudo.title, DO_E2E.title);
});

test("número que a pessoa disse (por extenso) fica; o da pesquisa no lastro do texto não vale para a arte", () => {
  const fala = "São três passos. O primeiro é parar, e quarenta por cento do tempo vai embora no que não importa.";
  const c = { title: "Três passos", subtitle: "", highlight: { value: "40%", label: "do tempo no que não importa" }, sections: [{ heading: "Parar", body: "O primeiro passo.", stat: "3" }], keyNumbers: [{ value: "89%", label: "ligam bem-estar e performance" }] };
  const r = infograficoSoComAFala(c, lastroDaArte({ transcricao: fala }));
  assert.equal(r.conteudo.highlight?.value, "40%");
  assert.equal(r.conteudo.sections?.[0].stat, "3");
  assert.deepEqual(r.conteudo.keyNumbers, []);
});

test("título que só se sustenta num número de fora pede outra extração", () => {
  const r = infograficoSoComAFala({ title: "89% dos líderes erram", subtitle: "", sections: [] }, lastroDaArte({ transcricao: FALA_SEM_NUMERO }));
  assert.equal(r.refazer, true);
});

test("a extração recebe a regra: só os números da fala, ou nenhum", () => {
  assert.equal(regraDosNumerosDaFala(undefined), "");
  assert.match(regraDosNumerosDaFala(FALA_SEM_NUMERO), /Não há número permitido/);
  assert.match(regraDosNumerosDaFala("são três passos e quarenta por cento"), /permitidos .*3.*40|permitidos .*40.*3/);
});

async function imagemFalsa(proporcao: string): Promise<string> {
  const [w, h] = proporcao === "4:5" ? [800, 1000] : proporcao === "1:1" ? [900, 900] : [1600, 900];
  const png = await sharp({ create: { width: w, height: h, channels: 3, background: "#111111" } }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

const MARCA_DO_TESTE = { familia: "editorial", cores: { acento: "#B3001B", escuro: "#111111", claro: "#f5f5f5", papeis: { fundo: "#111111", titulo: "#f5f5f5", destaque: "#B3001B" } } } as never;

test("o infográfico da Maquete 3D pela IA: sem número de fora e na linguagem da maquete (gerador falso)", async () => {
  const { desenharPelaIa } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
  const pedidos: string[] = [];
  const porRede = await desenharPelaIa(
    { projectId: "p", runId: "r", modelo: "sob-medida-3d", mediaType: "infographic", redes: ["instagram", "twitter"], infografico: DO_E2E as never, textoDoPost: "legenda", dia: 6, marca: MARCA_DO_TESTE, fala: FALA_SEM_NUMERO },
    {
      gerar: async (modelo, prompt, proporcao) => {
        pedidos.push(prompt);
        return { dataUrl: await imagemFalsa(proporcao), modelo, custoUsd: 0 };
      },
      conferir: async () => ({ aprovada: true, motivo: "ok", medida: { cortado: false, resumo: "ok", lados: {} } }) as never,
    }
  );
  assert.ok(porRede.instagram && porRede.twitter);
  assert.ok(pedidos.length >= 1);
  for (const p of pedidos) {
    for (const n of ["40%", "89%", "52%", "44%", "32%"]) assert.ok(!p.includes(n), `${n} foi ao gerador`);
    assert.match(p, /drawn ENTIRELY in the visual style called Isometric 3D Diorama/);
    assert.match(p, /isometric 3D maquette/);
    assert.match(p, /NO number in this infographic/);
    // O destaque escrito com contraste (o vermelho da marca no preto não se lê).
    assert.match(p, /use #f90025/);
  }
});

test("a linguagem do infográfico leva o elemento visual do estilo, não só a atmosfera", () => {
  const lg = linguagemDoInfografico(MAQUETE);
  assert.equal(lg.nome, "Isometric 3D Diorama");
  assert.match(lg.elemento, /isometric 3D maquette/);
  const p = promptDoInfografico({ conteudo: { title: "T", subtitle: "", sections: [{ heading: "A", body: "b" }] }, proporcao: "4:5", linguagem: lg, estilo: "qualquer" });
  assert.match(p, /never flat icons or clip art/);
  assert.doesNotMatch(p, /ART STYLE \(only HOW/);
  // Sem linguagem, o infográfico de sempre continua igual.
  assert.match(promptDoInfografico({ conteudo: { title: "T", subtitle: "", sections: [] }, proporcao: "4:5", estilo: "x" }), /ART STYLE \(only HOW/);
});

// ───────────── 4 e 5. a frase cortada e a frase que repete ─────────────

test("a frase do teste de ponta a ponta é reconhecida como cortada; as fechadas passam", () => {
  assert.equal(pareceTruncada("Excelência não é ter o mais caro, é fazer certo com o que você"), true);
  assert.equal(pareceTruncada("Excelência não é ter o mais caro, é fazer certo com o que você tem"), false);
  assert.equal(pareceTruncada("A melhor parte é escolher o essencial, não fazer mais"), false);
  assert.equal(pareceTruncada("Deus cuida de você"), false);
  assert.equal(pareceTruncada("O segredo está em escolher com"), true);
});

test("a frase que repete um trecho é pega; repetição de uma palavra só e expressão fixa passam", () => {
  assert.equal(trechoRepetido("Marta se ocupava fazendo tarefa boa atrás de tarefa boa"), "tarefa boa");
  assert.equal(trechoRepetido("Maria escolheu uma coisa só e isso bastou"), null);
  assert.equal(trechoRepetido("Dia após dia, passo a passo"), null);
  assert.equal(trechoRepetido("Produtividade bíblica é excelência no essencial, o resto pode ser removido"), null);
  assert.match(problemaDaFrase("Marta se ocupava fazendo tarefa boa atrás de tarefa boa") ?? "", /repete "tarefa boa"/);
});

test("a manchete NUNCA sai cortada por palavra: volta ao redator até servir", async () => {
  const respostas = [
    "Excelência não é ter o mais caro, é fazer certo com o que você tem", // 15 palavras, teto 14
    "Excelência é fazer certo com o que você tem",
  ];
  const pedidos: string[] = [];
  const m = await mancheteCurta({ fraseLonga: "Excelência não é ter o produto mais caro, é fazer o certo com o que você já tem.", maxPalavras: 14, redator: async (_s, p) => (pedidos.push(p), respostas.shift() ?? "") });
  assert.equal(m, "Excelência é fazer certo com o que você tem");
  assert.equal(pedidos.length, 2);
  assert.match(pedidos[1], /NÃO SERVIU/);
});

test("sem manchete dentro do teto de palavras, fica a mais curta INTEIRA; cortada ou repetida, nunca", async () => {
  const longa = "Excelência não é ter o mais caro, é fazer certo com o que você tem";
  const m = await mancheteCurta({ fraseLonga: longa, maxPalavras: 10, redator: async () => longa });
  assert.equal(m, longa);
  await assert.rejects(mancheteCurta({ fraseLonga: longa, maxPalavras: 10, redator: async () => "fazendo tarefa boa atrás de tarefa boa" }), /não saiu inteira/);
  await assert.rejects(mancheteCurta({ fraseLonga: longa, maxPalavras: 10, redator: async () => "Excelência é fazer certo com o que você" }), /não saiu inteira/);
});

test("fraseGarantida manda a frase que repete ao redator, com o motivo", async () => {
  const pedidos: string[] = [];
  const f = await fraseGarantida({ bruta: "Marta se ocupava fazendo tarefa boa atrás de tarefa boa", maxPalavras: 12, redator: async (_s, p) => (pedidos.push(p), "Marta fazia muito, Maria escolheu o essencial") });
  assert.equal(f, "Marta fazia muito, Maria escolheu o essencial");
  assert.match(pedidos[0], /repete "tarefa boa"/);
});

// ───────────── 6. o destaque que se lê ─────────────

test("o vermelho-escuro da marca no preto ganha um tom legível do mesmo matiz; a cor legível fica igual", () => {
  assert.ok(contraste("#B3001B", "#111111") < 3);
  const c = destaqueLegivel("#B3001B", "#111111");
  assert.ok(contraste(c, "#111111") >= 4.5, `${c} ainda ilegível`);
  assert.ok(medidaDaCor(c).s > 0.8, "virou cinza: perdeu a cor da marca");
  assert.equal(destaqueLegivel("#f97316", "#1e1f22"), "#f97316");
  // Fundo claro com destaque claro: escurece.
  assert.ok(contraste(destaqueLegivel("#ffee00", "#ffffff"), "#ffffff") >= 4.5);
});

test("o prompt da peça põe a letra em destaque no tom legível e proíbe destacar palavra repetida", () => {
  const p = promptDaArteNoModelo({
    estilo: MAQUETE,
    texto: "Excelência é fazer certo com o que você tem",
    tipo: "post",
    cores: { fundo: "#111111", titulo: "#f5f5f5", destaque: "#B3001B", destaqueNoTexto: destaqueLegivel("#B3001B", "#111111") },
    composicao: composicaoDaPeca(MAQUETE, { dia: 1 }),
  });
  assert.match(p, /Key words written in the accent use #f90025/);
  assert.match(p, /lines and shapes keep #B3001B/);
  assert.match(p, /appear only ONCE in the sentence/);
});

// ───────────── 1. a opção sob medida nunca vai ao worker ─────────────

test("o lote da opção sob medida é recusado antes de qualquer pedido ao worker", async () => {
  const { enviarLoteAoWorker } = await import("@/lib/media/editor-do-curso/arte-pelo-modelo-servidor");
  const antes = process.env.VIDEO_WORKER_URL;
  process.env.VIDEO_WORKER_URL = "https://worker.invalido";
  const fetchOriginal = globalThis.fetch;
  let chamou = false;
  globalThis.fetch = (async () => {
    chamou = true;
    throw new Error("não devia chamar");
  }) as typeof fetch;
  try {
    for (const modelo of ["sob-medida-3d", "sob-medida-recorte", "sob-medida-graficos", "sob-medida"]) {
      const r = await enviarLoteAoWorker({ chave: "k", projectId: "p", runId: null, modelo, pecas: [{ tipo: "post", texto: "x", formatos: ["4:5"] }], base: { cores: null, marca: { nome: "", area: "" }, nicho: null, fotoUrl: null, logo: null } });
      assert.equal(r.ok, false);
    }
    assert.equal(chamou, false);
  } finally {
    globalThis.fetch = fetchOriginal;
    if (antes === undefined) delete process.env.VIDEO_WORKER_URL;
    else process.env.VIDEO_WORKER_URL = antes;
  }
});

test("conferência: numeração de etapa 01 a 09 não é número inventado; porcentagem e valor seguem barrados", async () => {
  const { palavrasForaDoPermitido } = await import("@/lib/media/conferencia-da-arte");
  const permitido = ["Excelência na Essência", "O Foco da Produtividade Real"];
  assert.deepEqual(palavrasForaDoPermitido(["01 Excelência na Essência", "02 O Foco da Produtividade Real"], permitido), []);
  assert.deepEqual(palavrasForaDoPermitido(["40% Excelência"], permitido), ["40%"]);
  assert.deepEqual(palavrasForaDoPermitido(["Excelência 12"], permitido), ["12"]);
});

test("conferência: palavra dobrada que o texto pedido não tem reprova", async () => {
  const { decidirPelaDescricao, palavrasDobradas } = await import("@/lib/media/conferencia-da-arte");
  assert.deepEqual(palavrasDobradas("PRODUTIVIDADE PRODUTIVIDADE BÍBLICA: fazer o essencial"), ["produtividade"]);
  assert.deepEqual(palavrasDobradas("Produtividade bíblica: fazer o essencial"), []);
  const d = decidirPelaDescricao({ textos: [{ texto: "PRODUTIVIDADE PRODUTIVIDADE BÍBLICA: FAZER O ESSENCIAL COM EXCELÊNCIA" }], pessoas: "nenhuma", cortado: "nada" } as never, { textoEsperado: ["Produtividade bíblica: fazer o essencial com excelência"] });
  assert.match(String(d.reprovou), /duplicada/);
});

test("frase da arte: ponto de milhar não corta o número; voz do criador e valor cortado voltam ao redator", async () => {
  const { frasesCompletas, problemaDaFrase, fraseCompleta } = await import("@/lib/media/frase-da-arte");
  assert.deepEqual(frasesCompletas("Pagou 29 meses de R$ 2.645. Depois recebeu R$ 152.638."), ["Pagou 29 meses de R$ 2.645.", "Depois recebeu R$ 152.638."]);
  assert.equal(fraseCompleta("O cliente pagou 29 meses de R$ 2.645 e recebeu R$ 152.638 na contemplação.", { caracteres: 200 }), "O cliente pagou 29 meses de R$ 2.645 e recebeu R$ 152.638 na contemplação.");
  assert.match(String(problemaDaFrase("Você mostra que o cliente sustentou 29 meses de parcelas.")), /PÚBLICO/);
  assert.match(String(problemaDaFrase("O cliente pagou 29 meses de parcelas de R$2")), /cortado|não fecha/);
  assert.equal(problemaDaFrase("Você pode sair do aluguel em 29 meses."), null);
  assert.equal(problemaDaFrase("Ele pagou R$ 2.645 por mês."), null);
});
