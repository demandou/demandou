// As capas da edição sob medida e a regra de nunca trocar o estilo sozinho
// (11/10/2026): a thumb 16:9 do completo e a capa 9:16 do corte pela IA no
// estilo da opção, duas tentativas no MESMO estilo, a falha técnica com
// "Tentar de novo", e nunca o modelo de reserva nem o caminho antigo. O
// gerador, a conferência e o lugar onde a capa é guardada são falsos: nada
// aqui toca banco, rede ou imagem paga.
// Rodar: npx tsx --test scripts/testes/capas-sob-medida-1110.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { promptDaArteNoModelo, promptDeEstiloDoModelo } from "@/lib/media/editor-do-curso/arte-pela-ia";

const CORES = { fundo: "#1e1f22", titulo: "#dbdee1", destaque: "#f97316" };
const MARCA = { familia: "editorial", cores: { acento: "#f97316", escuro: "#1e1f22", claro: "#dbdee1", papeis: { fundo: "#1e1f22", titulo: "#dbdee1", destaque: "#f97316" } } } as never;

async function imagemNaProporcao(proporcao: string): Promise<string> {
  const [w, h] = proporcao === "9:16" ? [720, 1280] : proporcao === "16:9" ? [1600, 900] : proporcao === "4:5" ? [800, 1000] : [900, 900];
  const png = await sharp({ create: { width: w, height: h, channels: 3, background: "#1e1f22" } }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}
const APROVA = async () => ({ aprovada: true, motivo: "ok", medida: { cortado: false, resumo: "ok", lados: {} } }) as never;
const REPROVA = async () => ({ aprovada: false, motivo: "O revisor visual reprovou: palavra escrita errada", medida: { cortado: false, resumo: "ok", lados: {} } }) as never;
const FALA = "Hoje eu montei a mesa de edição e mostrei como um vídeo vira dez peças da semana. ".repeat(4) + "Outras coisas da conversa sobre a rotina. ".repeat(10);

test("a edição sob medida vai SEMPRE pela IA (sem template no worker), mesmo com a IA desligada; o modelo do curso segue a trava", async () => {
  const { estiloVaiPelaIa, ehEstiloSobMedida } = await import("@/lib/media/editor-do-curso/arte-pela-ia");
  for (const id of ["sob-medida", "sob-medida-3d", "sob-medida-recorte", "sob-medida-graficos"]) {
    assert.equal(ehEstiloSobMedida(id), true, id);
    assert.equal(estiloVaiPelaIa(id, { ARTE_PELO_MODELO_IA: "0" }), true, id);
  }
  assert.equal(estiloVaiPelaIa("modelo-torre", {}), true);
  assert.equal(estiloVaiPelaIa("modelo-torre", { ARTE_PELO_MODELO_IA: "0" }), false);
  assert.equal(estiloVaiPelaIa("modelo-que-nao-existe", {}), false);
  assert.equal(ehEstiloSobMedida("modelo-anatomia"), false);
});

test("o projeto sob medida nunca usa o modelo de reserva gravado junto (a Maquete 3D que saiu Anatomia em 11/10)", async () => {
  const { estiloDasArtesDoProjeto } = await import("@/lib/media/editor-do-curso/arte-pela-ia");
  // A função não recebe mais a reserva: não há como ela voltar.
  assert.equal(estiloDasArtesDoProjeto.length, 1);
  for (const id of ["sob-medida", "sob-medida-3d", "sob-medida-recorte", "sob-medida-graficos"]) assert.equal(estiloDasArtesDoProjeto(id), id);
});

test("noMesmoEstilo: tenta de novo no mesmo estilo uma vez e, falhando de novo, lança; sem saldo lança na hora", async () => {
  const { noMesmoEstilo, TENTATIVAS_NO_ESTILO } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
  assert.equal(TENTATIVAS_NO_ESTILO, 2);
  let n = 0;
  assert.equal(await noMesmoEstilo(async () => (++n === 1 ? Promise.reject(new Error("caiu")) : "ok"), { semSaldo: () => false }), "ok");
  assert.equal(n, 2);
  n = 0;
  await assert.rejects(
    noMesmoEstilo(async () => {
      n++;
      throw new Error("de novo");
    }, { semSaldo: () => false }),
    /de novo/
  );
  assert.equal(n, 2);
  n = 0;
  await assert.rejects(
    noMesmoEstilo(async () => {
      n++;
      throw new Error("sem saldo");
    }, { semSaldo: () => true }),
    /sem saldo/
  );
  assert.equal(n, 1);
});

test("capa do completo sob medida: 16:9 pela IA no estilo da opção, assunto da fala, JPEG 1280x720 guardado, sem worker", async () => {
  const { capasDoCompletoPelaIa } = await import("@/lib/media/capa-pela-ia");
  const prompts: Array<{ prompt: string; proporcao: string }> = [];
  const guardadas: Array<{ chave: string; w?: number; h?: number }> = [];
  const r = await capasDoCompletoPelaIa({
    projectId: "p",
    videoJobId: "v1",
    modelo: "sob-medida-3d",
    frases: [
      { frase: "Um vídeo vira dez peças", expressao: "confiante" },
      { frase: "Sua semana já está pronta?", expressao: "curioso" },
    ],
    contexto: "Como um vídeo vira a campanha da semana",
    fala: FALA,
    marca: MARCA,
    logo: null,
    inj: {
      gerar: async (modelo, prompt, proporcao) => {
        prompts.push({ prompt, proporcao });
        return { dataUrl: await imagemNaProporcao(proporcao), modelo, custoUsd: 0.134 };
      },
      conferir: APROVA,
    },
    guardar: async (chave, jpeg) => {
      const m = await sharp(jpeg).metadata();
      guardadas.push({ chave, w: m.width, h: m.height });
      return `https://fake/${chave}`;
    },
  });
  assert.equal(r.opcoes.length, 2);
  assert.deepEqual(r.erros, []);
  assert.deepEqual(r.opcoes.map((o) => o.url).sort(), ["https://fake/cortes/v1/capa-completo-0.jpg", "https://fake/cortes/v1/capa-completo-1.jpg"]);
  assert.ok(guardadas.every((g) => g.w === 1280 && g.h === 720), JSON.stringify(guardadas));
  assert.equal(prompts.length, 2);
  for (const p of prompts) {
    assert.equal(p.proporcao, "16:9");
    assert.match(p.prompt, /THUMBNAIL of a YouTube video/);
    assert.match(p.prompt, /Isometric 3D Diorama/);
    assert.match(p.prompt, /Excerpt of the video: ".*mesa de edição/);
    // Nunca o modelo de reserva.
    assert.ok(!p.prompt.includes(promptDeEstiloDoModelo("modelo-anatomia")!.nomeDoEstilo));
  }
});

test("capa do completo que não sai no estilo: duas tentativas, nenhuma opção, o motivo; tudo no mesmo estilo", async () => {
  const { capasDoCompletoPelaIa } = await import("@/lib/media/capa-pela-ia");
  const nomes = new Set<string>();
  let geracoes = 0;
  const r = await capasDoCompletoPelaIa({
    projectId: "p",
    videoJobId: "v1",
    modelo: "sob-medida-graficos",
    frases: [{ frase: "Dez peças por semana", expressao: "confiante" }],
    marca: MARCA,
    logo: null,
    inj: {
      gerar: async (modelo, prompt, proporcao) => {
        geracoes++;
        nomes.add(/visual style called ([^.]+)\./.exec(prompt)?.[1] ?? "?");
        return { dataUrl: await imagemNaProporcao(proporcao), modelo, custoUsd: 0.134 };
      },
      conferir: REPROVA,
    },
    guardar: async () => {
      throw new Error("não devia guardar");
    },
  });
  assert.equal(r.opcoes.length, 0);
  assert.equal(r.erros.length, 1);
  // Duas tentativas, cada uma com três do texto pela IA e três da cena sem texto.
  assert.equal(geracoes, 12);
  assert.deepEqual([...nomes], ["Charts that Draw Themselves"]);
});

test("capa 9:16 do corte no Recorte: a IA faz só o fundo e a palavra, o recorte real entra em código, guardada como capa-arte", async () => {
  const { capaDoCortePelaIa } = await import("@/lib/media/capa-pela-ia");
  const prompts: Array<{ prompt: string; proporcao: string }> = [];
  // Uma "pessoa" magenta com alfa: cabeça estreita em cima, tronco largo embaixo (o quadro da gravação).
  const bloco = (w: number, h: number) => sharp({ create: { width: w, height: h, channels: 4, background: { r: 255, g: 0, b: 255, alpha: 1 } } }).png().toBuffer();
  const recorte = await sharp({ create: { width: 400, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: await bloco(80, 100), left: 160, top: 100 },
      { input: await bloco(200, 400), left: 100, top: 200 },
    ])
    .png()
    .toBuffer();
  let guardado: Buffer | null = null;
  const url = await capaDoCortePelaIa({
    projectId: "p",
    videoJobId: "v2",
    indice: 3,
    modelo: "sob-medida-recorte",
    frase: "Grava uma vez",
    trecho: "eu gravo uma vez só e o agente transforma em sete peças",
    fala: FALA,
    recorteDaPessoa: `data:image/png;base64,${recorte.toString("base64")}`,
    marca: MARCA,
    logo: null,
    inj: {
      gerar: async (modelo, prompt, proporcao) => {
        prompts.push({ prompt, proporcao });
        return { dataUrl: await imagemNaProporcao(proporcao), modelo, custoUsd: 0.134 };
      },
      conferir: APROVA,
    },
    guardar: async (chave, jpeg) => {
      guardado = jpeg;
      return `https://fake/${chave}`;
    },
  });
  assert.equal(url, "https://fake/cortes/v2/capa-arte-3.jpg");
  assert.equal(prompts.length, 1);
  assert.equal(prompts[0].proporcao, "9:16");
  assert.match(prompts[0].prompt, /BACKGROUND LAYER of the COVER of a vertical short video/);
  assert.match(prompts[0].prompt, /this layer has NO person/);
  assert.match(prompts[0].prompt, /write EXACTLY "GRAVA"/);
  assert.doesNotMatch(prompts[0].prompt, /reference photo/);
  assert.match(prompts[0].prompt, /excerpt of the video: ".*sete peças/);
  // A pessoa real está na capa: o magenta do recorte aparece no meio, abaixo da palavra.
  const { data, info } = await sharp(guardado!).raw().toBuffer({ resolveWithObject: true });
  const px = (x: number, y: number) => Array.from(data.subarray((y * info.width + x) * info.channels, (y * info.width + x) * info.channels + 3));
  const [r, g, b] = px(Math.round(info.width / 2), Math.round(info.height * 0.4));
  assert.ok(r > 200 && g < 60 && b > 200, `sem o recorte no meio da capa: ${r},${g},${b}`);
});

test("capa do corte que falha nas duas tentativas lança (quem chama grava capaFalhou com Tentar de novo)", async () => {
  const { capaDoCortePelaIa } = await import("@/lib/media/capa-pela-ia");
  const nomes = new Set<string>();
  let geracoes = 0;
  await assert.rejects(
    capaDoCortePelaIa({
      projectId: "p",
      videoJobId: "v2",
      indice: 0,
      modelo: "sob-medida-3d",
      frase: "Grava uma vez",
      marca: MARCA,
      logo: null,
      inj: {
        gerar: async (modelo, prompt, proporcao) => {
          geracoes++;
          nomes.add(/visual style called ([^.]+)\./.exec(prompt)?.[1] ?? "?");
          return { dataUrl: await imagemNaProporcao(proporcao), modelo, custoUsd: 0.134 };
        },
        conferir: REPROVA,
      },
      guardar: async () => "x",
    })
  );
  assert.equal(geracoes, 12);
  assert.deepEqual([...nomes], ["Isometric 3D Diorama"]);
});

test("a falha técnica da capa diz Tentar de novo e Nada foi cobrado; o trecho do corte sai das palavras dele", async () => {
  const { falhaDaCapa, falaDoCorte, MOTIVO_DA_FALHA_DA_CAPA, caminhoDaCapa } = await import("@/lib/media/capa-pelo-modelo");
  const f = falhaDaCapa("sob-medida-3d", new Error("HTTP 500 \u2014 interno"), new Date("2026-10-11T12:00:00Z"));
  assert.equal(f.motivo, MOTIVO_DA_FALHA_DA_CAPA);
  assert.match(f.motivo, /Tentar de novo/);
  assert.match(f.motivo, /Nada foi cobrado/);
  assert.doesNotMatch(f.motivo + f.detalhe, /[\u2014\u2013]/);
  assert.equal(f.modelo, "sob-medida-3d");
  assert.equal(f.em, "2026-10-11T12:00:00.000Z");
  const palavras = [
    { word: "antes", start: 0, end: 1 },
    { word: "grava", start: 10, end: 10.5 },
    { word: "uma", start: 10.5, end: 11 },
    { word: "vez", start: 11, end: 11.4 },
    { word: "depois", start: 30, end: 31 },
  ];
  assert.equal(falaDoCorte(palavras, 10, 12), "grava uma vez");
  assert.equal(falaDoCorte(palavras, 12, 10), null);
  assert.equal(falaDoCorte([], 0, 5), null);
  // Com estilo escolhido nada vai pelo caminho de hoje; a sob medida vai pela IA.
  assert.equal(caminhoDaCapa({ temRegra: true, pelaIa: true }), "ia");
  assert.equal(caminhoDaCapa({ temRegra: false, pelaIa: true }), "hoje");
});

test("a cena sem texto (a segunda forma do MESMO estilo) diz o papel da capa e nunca pede gente", async () => {
  const { promptDaCenaNoModelo } = await import("@/lib/media/editor-do-curso/arte-pela-ia");
  const recorte = promptDeEstiloDoModelo("sob-medida-recorte")!;
  const thumb = promptDaCenaNoModelo({ estilo: recorte, ideia: "Grava uma vez", tipo: "thumb", cores: CORES, composicao: "x" });
  assert.match(thumb, /THUMBNAIL of a YouTube video/);
  assert.doesNotMatch(thumb, /reference photo/);
  assert.match(thumb, /ABSOLUTELY NO TEXT/);
  assert.match(thumb, /No people/);
  const vertical = promptDaCenaNoModelo({ estilo: promptDeEstiloDoModelo("sob-medida-3d")!, ideia: "Grava uma vez", tipo: "capa-vertical", cores: CORES, composicao: "x" });
  assert.match(vertical, /No people, faces, hands or silhouettes/);
  assert.match(vertical, /COVER of a vertical short video/);
});

test("o ajuste do refazer da capa entra no prompt sem sair do estilo", () => {
  const p = promptDaArteNoModelo({ estilo: promptDeEstiloDoModelo("sob-medida-3d")!, texto: "Grava uma vez", tipo: "capa-vertical", cores: CORES, composicao: "x", ajuste: "deixa a maquete maior \u2014 bem maior" });
  assert.match(p, /CLIENT'S ADJUSTMENT \(apply it without leaving the style/);
  assert.doesNotMatch(p, /[\u2014\u2013]/);
});

test("nenhum caminho com estilo chama o caminho antigo como reserva (capas e artes)", async () => {
  const { readFileSync } = await import("node:fs");
  const ler = (f: string) => readFileSync(new URL(`../../${f}`, import.meta.url), "utf8");
  const servidorDaCapa = ler("lib/media/capa-pelo-modelo-servidor.ts");
  assert.doesNotMatch(servidorDaCapa, /semModelo: true/);
  assert.doesNotMatch(servidorDaCapa, /comporCapasDosCortes/);
  const servidorDaArte = ler("lib/media/editor-do-curso/arte-pelo-modelo-servidor.ts");
  assert.doesNotMatch(servidorDaArte, /desenharPeloCaminhoDeHoje/);
  assert.doesNotMatch(servidorDaArte, /arteDoDia\(/);
  assert.doesNotMatch(servidorDaArte, /direcaoDaPeca/);
  const rota = ler("app/api/videos/[id]/capas/route.ts");
  assert.match(rota, /capasDosCortesNoEstilo/);
});
