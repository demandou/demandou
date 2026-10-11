// Os números das artes com pesquisa (11/10/2026, decisão do Bruno): "podem usar
// pesquisa, desde que não seja inventado, e tenha fonte rastreável. O mais
// importante é ter relação com o tema do vídeo". Número da fala entra; número
// de pesquisa com fonte e no tema (o JEV decide) entra com o rodapé da fonte;
// de pesquisa fora do tema sai; sem fonte sai; inventado sai. Gerador de
// imagem, conferência e JEV são falsos: nada toca banco, rede ou IA paga.
// Rodar: npx tsx --test scripts/testes/numeros-com-fonte-1110.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { dadosComFonte, dadosDaArteNoTema, fonteRastreavel, legendaComAsFontes, rodapeDasFontes, type DadoDePesquisa } from "@/lib/media/dados-da-arte";
import { fontesDoPost, infograficoSoComAFala, lastroComAsFontesDoPost, lastroDaArte } from "@/lib/media/lastro-do-video";
import { regraDosNumerosDaFala } from "@/lib/media/infographic";
import { promptDoInfografico, textosDoInfografico } from "@/lib/media/infografico-pelo-modelo";
import type { PerguntadorDoJev } from "@/lib/squad/coerencia-da-arte";

// O radar do vídeo do teste de ponta a ponta (cmv421pkz): produtividade bíblica e excelência.
const RADAR = {
  tema: "Produtividade bíblica: excelência no essencial",
  resumo: "Ser produtivo não é fazer mais, é fazer o essencial bem feito, como Maria escolheu a melhor parte.",
  teses: [
    { minuto: "00:00", frase: "Excelência não é ter o produto mais caro, é fazer o certo com o que você já tem." },
    { minuto: "00:55", frase: "Ser produtivo não é fazer muitas coisas ou trabalhar muitas horas, é saber qual é a única coisa necessária." },
  ],
  dados: [
    { valor: "89%", oQueMede: "profissionais que conectam bem-estar à performance no trabalho", fonte: "Wellhub, Panorama do Bem-Estar Corporativo 2026" },
    { valor: "52% e 44%", oQueMede: "líderes que apontam produtividade como prioridade (52%) e bem-estar como quarta preocupação (44%)", fonte: "pesquisa Robert Half, 2026" },
    { valor: "30%, 32% e 40%", oQueMede: "redução em solidão (30%), raiva (32%) e amarguras em relacionamentos (40%) entre quem lê a Bíblia 4+ vezes por semana", fonte: "Center for Bible Engagement (CBE), estudos de 2009 e 2012" },
    { valor: "67%", oQueMede: "gestores que trabalham mais de 10 horas por dia", fonte: "pesquisa de mercado" },
  ] as DadoDePesquisa[],
};
const FALA = "Excelência é você fazer o certo com o que você tem. Eu trabalhei doze horas por dia e não era produtivo. Marta querendo fazer monte de coisa, Maria escolheu a melhor parte.";

/**
 * O JEV falso: complementa o tema o dado que fala de produtividade ou de
 * trabalho; o de relacionamentos não. Registra o que foi perguntado.
 */
function jevFalso(perguntas: string[][]): PerguntadorDoJev {
  return (async (ctx, qs) => {
    const state = ctx.state as { dados: Array<{ id: string; o_que_mede: string }> };
    perguntas.push(Object.keys(qs));
    return Object.fromEntries(
      state.dados.map((d) => [d.id, { type: "noul", noul: /produtiv|performance|trabalho/i.test(d.o_que_mede) && !/relacionamento|solid/i.test(d.o_que_mede) ? 0.9 : 0.1 }])
    );
  }) as PerguntadorDoJev;
}

test("fonte rastreável: nome de quem publicou ou link; genérica não", () => {
  assert.equal(fonteRastreavel("pesquisa Robert Half, 2026"), true);
  assert.equal(fonteRastreavel("https://exemplo.org/estudo"), true);
  assert.equal(fonteRastreavel("pesquisa de mercado"), false);
  assert.equal(fonteRastreavel(""), false);
  assert.deepEqual(dadosComFonte(RADAR.dados).map((d) => d.valor), ["89%", "52% e 44%", "30%, 32% e 40%"]);
});

test("o JEV decide o tema: o dado de relacionamentos sai, o de produtividade fica; sem fonte nem chega ao JEV", async () => {
  const perguntas: string[][] = [];
  const dados = await dadosDaArteNoTema({ projectId: "p", radar: RADAR, perguntar: jevFalso(perguntas), ligado: true });
  assert.deepEqual(dados.map((d) => d.valor), ["89%", "52% e 44%"]);
  // Três perguntas (os três com fonte); o "pesquisa de mercado" nunca foi ao JEV.
  assert.equal(perguntas[0].length, 3);
});

test("sem JEV, nenhum dado de pesquisa vai à arte (a fala continua valendo)", async () => {
  const dados = await dadosDaArteNoTema({ projectId: "p", radar: RADAR, ligado: false });
  assert.deepEqual(dados, []);
});

/** O infográfico com um número de cada tipo. */
const CONTEUDO = {
  title: "Excelência no essencial",
  subtitle: "Doze horas por dia não é produtividade.",
  highlight: { value: "89%", label: "ligam bem-estar à performance" },
  sections: [
    { heading: "Fazer o certo", body: "Com o que você tem." },
    { heading: "Prioridade do líder", stat: "52%", body: "Líderes priorizam produtividade." },
    { heading: "Amarguras", stat: "40%", body: "Menos amarguras nos relacionamentos." },
    { heading: "Gestores", stat: "67%", body: "Trabalham mais de 10 horas." },
  ],
  keyNumbers: [{ value: "73%", label: "dos cristãos são produtivos" }],
};

async function lastroDoTeste() {
  const dados = await dadosDaArteNoTema({ projectId: "p", radar: RADAR, perguntar: jevFalso([]), ligado: true });
  return lastroDaArte({ transcricao: FALA, material: ["Fé & Gestão"], dados });
}

test("número da fala entra; de pesquisa com fonte e no tema entra com a fonte; fora do tema, sem fonte e inventado saem", async () => {
  const r = infograficoSoComAFala(CONTEUDO, await lastroDoTeste());
  const c = r.conteudo;
  // Da fala ("doze horas"): fica, sem fonte.
  assert.equal(c.subtitle, "Doze horas por dia não é produtividade.");
  // De pesquisa no tema com fonte: ficam, com a fonte anotada.
  assert.equal(c.highlight?.value, "89%");
  assert.equal(c.sections.find((s) => s.heading === "Prioridade do líder")?.stat, "52%");
  assert.deepEqual(r.fontes.map((f) => f.numero).sort(), ["52", "89"]);
  // Fora do tema (40%, relacionamentos), sem fonte (67%) e inventado (73%): saem.
  assert.equal(c.sections.find((s) => s.heading === "Amarguras")?.stat, undefined);
  assert.equal(c.sections.find((s) => s.heading === "Gestores")?.stat, undefined);
  assert.equal(c.sections.find((s) => s.heading === "Gestores")?.body, "");
  assert.deepEqual(c.keyNumbers, []);
  // O rodapé discreto com as fontes rastreáveis.
  assert.equal(c.fonte, "Fontes: Wellhub, Panorama do Bem-Estar Corporativo 2026; Robert Half, 2026");
  assert.equal(r.refazer, false);
});

test("o rodapé da fonte vai ao prompt e ao texto pedido (a conferência aceita as palavras da fonte)", async () => {
  const { conteudo } = infograficoSoComAFala(CONTEUDO, await lastroDoTeste());
  const p = promptDoInfografico({ conteudo: conteudo as never, proporcao: "4:5" });
  assert.match(p, /SOURCE LINE .*"Fontes: Wellhub, Panorama do Bem-Estar Corporativo 2026; Robert Half, 2026"/);
  assert.match(p, /no step numbers \("01"\), other source line/);
  assert.ok(textosDoInfografico(conteudo as never).includes("Fontes: Wellhub, Panorama do Bem-Estar Corporativo 2026; Robert Half, 2026"));
  // Sem número de pesquisa, nada de rodapé e o "source line" continua proibido.
  const soFala = infograficoSoComAFala({ title: "Doze horas", subtitle: "", sections: [] }, lastroDaArte({ transcricao: FALA }));
  assert.equal(soFala.conteudo.fonte, undefined);
  assert.match(promptDoInfografico({ conteudo: soFala.conteudo as never, proporcao: "4:5" }), /no step numbers \("01"\), source line/);
});

test("a legenda cita a fonte do número de pesquisa que usa (e não repete quando já cita)", () => {
  const fontes = [{ numero: "52", fonte: "pesquisa Robert Half, 2026" }];
  const sem = legendaComAsFontes("Mais da metade dos líderes, 52%, prioriza a produtividade.\n\nLinks:\nhttps://x", fontes);
  assert.match(sem, /prioriza a produtividade\.\n\nFonte: Robert Half, 2026\.\n\nLinks:/);
  const com = "Segundo a Robert Half, 52% dos líderes priorizam a produtividade.";
  assert.equal(legendaComAsFontes(com, fontes), com);
  assert.equal(legendaComAsFontes("Sem número aqui.", fontes), "Sem número aqui.");
  assert.equal(rodapeDasFontes([]), "");
});

test("a extração recebe os números da fala e os dados no tema com a fonte; fora do tema nem aparece", async () => {
  const regra = regraDosNumerosDaFala(await lastroDoTeste());
  assert.ok(regra.includes("disse no vídeo (12)"));
  assert.match(regra, /89% = profissionais que conectam bem-estar/);
  assert.match(regra, /fonte: pesquisa Robert Half, 2026/);
  assert.doesNotMatch(regra, /amarguras/);
  assert.doesNotMatch(regra, /67%/);
});

test("a arte gravada redesenha com as fontes que o post guardou (Tentar de novo, refazer)", () => {
  const meta = { fontesDosNumeros: [{ numero: "89", fonte: "Wellhub, Panorama do Bem-Estar Corporativo 2026" }, { lixo: true }] };
  const fontes = fontesDoPost(meta);
  assert.equal(fontes.length, 1);
  const r = infograficoSoComAFala(CONTEUDO, lastroComAsFontesDoPost({ transcricao: FALA, fontes }));
  assert.equal(r.conteudo.highlight?.value, "89%");
  // O 52% não foi guardado no post: na nova arte ele não entra.
  assert.equal(r.conteudo.sections.find((s) => s.heading === "Prioridade do líder")?.stat, undefined);
  assert.equal(r.conteudo.fonte, "Fonte: Wellhub, Panorama do Bem-Estar Corporativo 2026");
});

async function imagemFalsa(proporcao: string): Promise<string> {
  const [w, h] = proporcao === "4:5" ? [800, 1000] : [900, 900];
  const png = await sharp({ create: { width: w, height: h, channels: 3, background: "#111111" } }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

test("pela IA (gerador falso): o que chega ao gerador tem o número no tema com o rodapé e nada de fora", async () => {
  const { desenharPelaIa } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
  const marca = { familia: "editorial", cores: { acento: "#B3001B", escuro: "#111111", claro: "#f5f5f5", papeis: { fundo: "#111111", titulo: "#f5f5f5", destaque: "#B3001B" } } } as never;
  const pedidos: string[] = [];
  let esperado: string[] = [];
  await desenharPelaIa(
    {
      projectId: "p",
      modelo: "sob-medida-3d",
      mediaType: "infographic",
      redes: ["instagram"],
      infografico: CONTEUDO as never,
      textoDoPost: "legenda",
      marca,
      fala: FALA,
      fontesDosNumeros: [
        { numero: "89", fonte: "Wellhub, Panorama do Bem-Estar Corporativo 2026" },
        { numero: "52", fonte: "pesquisa Robert Half, 2026" },
      ],
    },
    {
      gerar: async (modelo, prompt, proporcao) => {
        pedidos.push(prompt);
        return { dataUrl: await imagemFalsa(proporcao), modelo, custoUsd: 0 };
      },
      conferir: async (_d, o) => {
        esperado = ((o as { textoEsperado?: string[] }).textoEsperado ?? []).slice();
        return { aprovada: true, motivo: "ok", medida: { cortado: false, resumo: "ok", lados: {} } } as never;
      },
    }
  );
  assert.ok(pedidos.length >= 1);
  for (const p of pedidos) {
    assert.match(p, /"89%"/);
    assert.match(p, /"52%"/);
    assert.match(p, /SOURCE LINE .*Wellhub.*Robert Half, 2026/);
    for (const fora of ['"40%"', '"67%"', '"73%"']) assert.ok(!p.includes(fora), `${fora} foi ao gerador`);
  }
  // A conferência da imagem recebe o rodapé como texto pedido.
  assert.ok(esperado.some((t) => t.startsWith("Fontes: Wellhub")), "o rodapé não está no texto pedido");
});
