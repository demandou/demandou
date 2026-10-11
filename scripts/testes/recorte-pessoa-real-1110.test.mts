// O RECORTE COM LETREIRO COM A PESSOA REAL (11/10/2026). No teste de ponta a
// ponta a IA de imagem recebia o quadro nítido e redesenhava a pessoa (um
// padre, um homem de óculos), uma arte saiu com "DING" e o carrossel parou.
// Regra nova (aula 8.2): a IA faz só o fundo e a palavra gigante, sem gente; a
// pessoa é o recorte real colado em código, com a cabeça na frente da palavra.
// Gerador e conferência falsos: nada aqui toca banco, rede ou imagem paga.
// Rodar: npx tsx --test scripts/testes/recorte-pessoa-real-1110.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

const MARCA = { familia: "editorial", cores: { acento: "#f97316", escuro: "#1e1f22", claro: "#dbdee1", papeis: { fundo: "#1e1f22", titulo: "#dbdee1", destaque: "#f97316" } } } as never;
const CORES = { fundo: "#1e1f22", titulo: "#dbdee1", destaque: "#f97316" };

async function fundoFalso(proporcao: string): Promise<string> {
  const [w, h] = proporcao === "9:16" ? [720, 1280] : proporcao === "16:9" ? [1600, 900] : proporcao === "4:5" ? [800, 1000] : [900, 900];
  const png = await sharp({ create: { width: w, height: h, channels: 3, background: "#1e1f22" } }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

/** Uma "pessoa" magenta com alfa: cabeça estreita em cima, tronco largo embaixo, como o recorte do worker. */
async function recorteFalso(): Promise<Buffer> {
  const bloco = (w: number, h: number) => sharp({ create: { width: w, height: h, channels: 4, background: { r: 255, g: 0, b: 255, alpha: 1 } } }).png().toBuffer();
  return sharp({ create: { width: 400, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: await bloco(80, 100), left: 160, top: 100 },
      { input: await bloco(200, 400), left: 100, top: 200 },
    ])
    .png()
    .toBuffer();
}
const dataPng = (b: Buffer) => `data:image/png;base64,${b.toString("base64")}`;

/** Quantos pixels magenta (a pessoa real) a imagem final tem. */
async function pixelsDaPessoa(uri: string): Promise<{ magenta: number; largura: number; altura: number }> {
  const { data, info } = await sharp(Buffer.from(uri.slice(uri.indexOf(",") + 1), "base64")).raw().toBuffer({ resolveWithObject: true });
  let magenta = 0;
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * info.channels];
    const g = data[i * info.channels + 1];
    const b = data[i * info.channels + 2];
    if (r > 200 && g < 70 && b > 200) magenta++;
  }
  return { magenta, largura: info.width, altura: info.height };
}

type Opcoes = { textoEsperado?: string[]; textoObrigatorio?: boolean; permitirPessoas?: boolean };

test("a palavra do letreiro é a palavra de conteúdo mais longa, em caixa alta e com acento", async () => {
  const { palavraDoLetreiro } = await import("@/lib/media/editor-do-curso/arte-pela-ia");
  assert.equal(palavraDoLetreiro("Excelência é fazer certo com o que você tem."), "EXCELÊNCIA");
  assert.equal(palavraDoLetreiro("Produtividade bíblica: excelência no essencial, o resto é descartável"), "PRODUTIVIDADE");
  assert.equal(palavraDoLetreiro("Grava uma vez"), "GRAVA");
  assert.equal(palavraDoLetreiro("10 vezes mais"), "VEZES");
  assert.equal(palavraDoLetreiro(""), "");
});

test("o fundo do Recorte é pedido SEM pessoa, com a palavra exata (ou sem texto na reserva) e o palco vazio", async () => {
  const { promptDoFundoDoRecorte, promptDeEstiloDoModelo, layoutDoFundoDoRecorte } = await import("@/lib/media/editor-do-curso/arte-pela-ia");
  const estilo = promptDeEstiloDoModelo("sob-medida-recorte")!;
  const base = { estilo, frase: "Excelência é fazer certo com o que você tem", tipo: "post" as const, cores: CORES, composicao: estilo.composicoes[0], trecho: "eu falei da excelência com o que você tem" };
  const com = promptDoFundoDoRecorte({ ...base, palavra: "EXCELÊNCIA" });
  assert.match(com, /this layer has NO person/);
  assert.match(com, /write EXACTLY "EXCELÊNCIA"/);
  assert.match(com, /It is the ONLY text in the image/);
  assert.match(com, /NEVER draw any person, face, head/);
  assert.doesNotMatch(com, /reference photo/);
  assert.doesNotMatch(com, new RegExp(`${String.fromCharCode(0x2014)}|${String.fromCharCode(0x2013)}`));
  const sem = promptDoFundoDoRecorte({ ...base, palavra: null });
  assert.match(sem, /ABSOLUTELY NO TEXT/);
  assert.doesNotMatch(sem, /write EXACTLY/);
  assert.match(layoutDoFundoDoRecorte("4:5", true), /EMPTY STAGE for the person is the center/);
  assert.match(layoutDoFundoDoRecorte("16:9", true), /EMPTY STAGE for the person is the right half/);
  assert.match(layoutDoFundoDoRecorte("9:16", false), /stays a clean dark gradient/);
});

test("o infográfico do Recorte não tem palco nem pessoa (o padre de 11/10)", async () => {
  const { linguagemDoInfografico, promptDeEstiloDoModelo } = await import("@/lib/media/editor-do-curso/arte-pela-ia");
  const l = linguagemDoInfografico(promptDeEstiloDoModelo("sob-medida-recorte")!);
  assert.doesNotMatch(l.elemento, /real person|empty stage|speaker/i);
  assert.match(l.elemento, /no people/i);
  assert.match(l.evitar, /No people, faces or silhouettes in the infographic/);
});

test("o infográfico reprovado por gente ou texto inventado não sai; reprovado por margem sai como sempre", async () => {
  const { infograficoReprovadoGrave } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
  assert.equal(infograficoReprovadoGrave({ algumaReprovada: false, avisos: [] }), null);
  assert.match(
    infograficoReprovadoGrave({ algumaReprovada: true, avisos: ["A arte 4:5 (instagram) continua com problema depois de 3 tentativas: a arte tem pessoa (um padre de batina), e esta arte não pode ter"] })!,
    /tem pessoa/
  );
  assert.match(infograficoReprovadoGrave({ algumaReprovada: true, avisos: ['A arte 4:5 (instagram) continua com problema depois de 3 tentativas: texto além do permitido: "DING"'] })!, /DING/);
  assert.equal(infograficoReprovadoGrave({ algumaReprovada: true, avisos: ["A arte 4:5 (instagram) continua com problema depois de 3 tentativas: texto encostado na margem"] }), null);
});

test("medidas puras: a caixa do alfa, a cabeça e a faixa do letreiro", async () => {
  const { caixaDoAlfa, cabecaDoRecorte, faixaDoLetreiro, lugarDaPessoa } = await import("@/lib/media/editor-do-curso/recorte-com-letreiro");
  const { geometriaDoRecorte } = await import("@/lib/media/editor-do-curso/arte-pela-ia");
  const w = 40;
  const h = 60;
  const alfa = new Uint8Array(w * h);
  for (let y = 10; y < 20; y++) for (let x = 16; x < 24; x++) alfa[y * w + x] = 255;
  for (let y = 20; y < 60; y++) for (let x = 10; x < 30; x++) alfa[y * w + x] = 255;
  const caixa = caixaDoAlfa(alfa, w, h)!;
  assert.deepEqual(caixa, { x0: 10, y0: 10, x1: 30, y1: 60 });
  const cab = cabecaDoRecorte(alfa, w, caixa);
  assert.equal(cab.topo, 10);
  assert.equal(cab.largura, 8);
  assert.equal(cab.centroX, 19.5);
  assert.equal(caixaDoAlfa(new Uint8Array(16), 4, 4), null);
  // A faixa: linhas com "tinta" clara no terço de cima.
  const cinza = new Uint8Array(100 * 100).fill(30);
  for (let y = 15; y < 32; y++) for (let x = 10; x < 90; x += 2) cinza[y * 100 + x] = 230;
  const faixa = faixaDoLetreiro(cinza, 100, 100)!;
  assert.ok(Math.abs(faixa.topo - 0.15) < 0.02 && Math.abs(faixa.base - 0.32) < 0.02, JSON.stringify(faixa));
  assert.equal(faixaDoLetreiro(new Uint8Array(100 * 100).fill(30), 100, 100), null);
  // A pessoa: base na base da peça, cabeça no alvo, cabeça centrada.
  const g = geometriaDoRecorte(0.8);
  const lugar = lugarDaPessoa({ W: 800, H: 1000, g, topoAlvo: 0.25 }, caixa, cab);
  assert.equal(lugar.top + lugar.height, 1000);
  assert.ok(Math.abs(lugar.top - 250) <= 1, String(lugar.top));
  assert.ok(Math.abs(lugar.left + (cab.centroX - caixa.x0) * lugar.escala - 400) <= 1);
});

test("arte do Recorte: a IA é pedida sem pessoa e sem foto, a conferência lê só a palavra, e a imagem final tem os pixels do recorte real", async () => {
  const { desenharPelaIa } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
  const prompts: Array<{ prompt: string; proporcao: string }> = [];
  const conferidas: Opcoes[] = [];
  const porRede = await desenharPelaIa(
    { projectId: "p", modelo: "sob-medida-recorte", mediaType: "image", redes: ["instagram", "twitter"], frase: "Excelência é fazer certo com o que você tem", marca: MARCA, recorteDaPessoa: dataPng(await recorteFalso()) },
    {
      gerar: async (modelo, prompt, proporcao) => {
        prompts.push({ prompt, proporcao });
        return { dataUrl: await fundoFalso(proporcao), modelo, custoUsd: 0.134 };
      },
      conferir: async (_d, o) => {
        conferidas.push(o as Opcoes);
        return { aprovada: true, motivo: "ok", medida: { cortado: false, resumo: "ok", lados: {} } } as never;
      },
    }
  );
  assert.equal(prompts.length, 2);
  for (const p of prompts) {
    assert.match(p.prompt, /this layer has NO person/);
    assert.match(p.prompt, /write EXACTLY "EXCELÊNCIA"/);
    assert.match(p.prompt, /LAYOUT OF THIS IMAGE/);
    assert.doesNotMatch(p.prompt, /reference photo/);
  }
  for (const o of conferidas) {
    assert.equal(o.permitirPessoas, false);
    assert.deepEqual(o.textoEsperado, ["EXCELÊNCIA"]);
    assert.equal(o.textoObrigatorio, true);
  }
  for (const rede of ["instagram", "twitter"]) {
    const m = await pixelsDaPessoa(porRede[rede]);
    assert.ok(m.magenta > m.largura * m.altura * 0.03, `${rede}: só ${m.magenta} pixels da pessoa`);
  }
  const insta = await pixelsDaPessoa(porRede.instagram);
  assert.ok(insta.altura > insta.largura, "o Instagram sai em pé");
});

test("a palavra pela IA reprovada: a reserva no MESMO estilo pede o fundo sem texto e a palavra entra em código", async () => {
  const { desenharPelaIa } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
  const prompts: string[] = [];
  const conferidas: Opcoes[] = [];
  const porRede = await desenharPelaIa(
    { projectId: "p", modelo: "sob-medida-recorte", mediaType: "image", redes: ["instagram"], frase: "Excelência é fazer certo com o que você tem", marca: MARCA, recorteDaPessoa: dataPng(await recorteFalso()) },
    {
      gerar: async (modelo, prompt, proporcao) => {
        prompts.push(prompt);
        return { dataUrl: await fundoFalso(proporcao), modelo, custoUsd: 0.134 };
      },
      conferir: async (_d, o) => {
        conferidas.push(o as Opcoes);
        const comPalavra = Boolean((o as Opcoes).textoEsperado?.length);
        return (comPalavra
          ? { aprovada: false, motivo: 'O revisor visual reprovou: texto além do permitido: "DING"', medida: { cortado: false, resumo: "ok", lados: {} } }
          : { aprovada: true, motivo: "ok", medida: { cortado: false, resumo: "ok", lados: {} } }) as never;
      },
    }
  );
  // Três tentativas com a palavra, depois o fundo sem texto (o mesmo estilo, nunca outro).
  assert.equal(prompts.length, 4);
  assert.match(prompts[3], /ABSOLUTELY NO TEXT/);
  for (const p of prompts) assert.match(p, /Cutout with Lettering/);
  assert.deepEqual(conferidas[3].textoEsperado, []);
  assert.equal(conferidas[3].permitirPessoas, false);
  const m = await pixelsDaPessoa(porRede.instagram);
  assert.ok(m.magenta > m.largura * m.altura * 0.03);
});

test("nem o fundo sem texto passou: lança (quem chama tenta no mesmo estilo e para com Tentar de novo)", async () => {
  const { desenharPelaIa } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
  await assert.rejects(
    desenharPelaIa(
      { projectId: "p", modelo: "sob-medida-recorte", mediaType: "image", redes: ["instagram"], frase: "Bem feito", marca: MARCA, recorteDaPessoa: dataPng(await recorteFalso()) },
      {
        gerar: async (modelo, _p, proporcao) => ({ dataUrl: await fundoFalso(proporcao), modelo, custoUsd: 0.134 }),
        conferir: async () => ({ aprovada: false, motivo: "O revisor visual reprovou: a arte tem pessoa (um homem de óculos), e esta arte não pode ter", medida: { cortado: false, resumo: "ok", lados: {} } }) as never,
      }
    ),
    /o fundo do Recorte não passou na conferência/
  );
});

test("o carrossel do Recorte (o que parou em 11/10) sai lâmina por lâmina, cada uma com a pessoa real", async () => {
  const { desenharPelaIa } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
  let geracoes = 0;
  const porRede = await desenharPelaIa(
    {
      projectId: "p",
      modelo: "sob-medida-recorte",
      mediaType: "carousel",
      redes: ["instagram"],
      slides: ["Excelência não mora no preço da ferramenta que você usa.", "Produtividade bíblica é remir o tempo, não encher a agenda.", "Faça bem feita a única coisa necessária; remova todo o resto."],
      marca: MARCA,
      recorteDaPessoa: dataPng(await recorteFalso()),
    },
    {
      gerar: async (modelo, _p, proporcao) => {
        geracoes++;
        return { dataUrl: await fundoFalso(proporcao), modelo, custoUsd: 0.134 };
      },
      conferir: async (_d, o) => {
        assert.equal((o as Opcoes).permitirPessoas, false);
        return { aprovada: true, motivo: "ok", medida: { cortado: false, resumo: "ok", lados: {} } } as never;
      },
    }
  );
  const laminas = porRede.instagram.split("|");
  assert.equal(laminas.length, 3);
  assert.equal(geracoes, 3);
  for (const l of laminas) assert.ok((await pixelsDaPessoa(l)).magenta > 1000);
});

test("sem o recorte da pessoa a peça sai sem gente (nunca uma pessoa desenhada)", async () => {
  const { desenharPelaIa } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
  const porRede = await desenharPelaIa(
    { projectId: "p", modelo: "sob-medida-recorte", mediaType: "image", redes: ["instagram"], frase: "Bem feito", marca: MARCA },
    {
      gerar: async (modelo, prompt, proporcao) => {
        assert.match(prompt, /this layer has NO person/);
        return { dataUrl: await fundoFalso(proporcao), modelo, custoUsd: 0.134 };
      },
      conferir: async () => ({ aprovada: true, motivo: "ok", medida: { cortado: false, resumo: "ok", lados: {} } }) as never,
    }
  );
  assert.equal((await pixelsDaPessoa(porRede.instagram)).magenta, 0);
});

test("nenhum caminho de arte ou capa manda a foto da pessoa à IA de imagem", async () => {
  const { readFileSync } = await import("node:fs");
  const ler = (f: string) => readFileSync(new URL(`../../${f}`, import.meta.url), "utf8");
  for (const f of ["lib/media/editor-do-curso/arte-pela-ia-servidor.ts", "lib/media/editor-do-curso/arte-pela-ia.ts", "lib/media/capa-pela-ia.ts", "lib/media/capa-do-corte.ts", "lib/media/capas-do-completo.ts"]) {
    const s = ler(f);
    assert.doesNotMatch(s, /gerarComFoto|fotoDaPessoa|attached reference photo/, f);
  }
});
