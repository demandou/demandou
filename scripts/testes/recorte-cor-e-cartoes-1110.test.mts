// Recorte com letreiro, ajustes da prova de 11/10: (1) a palavra grande é
// inteira numa cor (PRODUTIVIDADE saiu com "OD", "I" e "I" em vermelho, que
// parecia defeito), pedido no prompt e conferido em código na camada da IA;
// (2) os cartões nunca cruzam a palavra nem o rosto (a ampulheta encostou no
// fim da palavra), pela mesma geometria que cola a pessoa.
// Gerador e conferência falsos: nada aqui toca banco, rede ou imagem paga.
// Rodar: npx tsx --test scripts/testes/recorte-cor-e-cartoes-1110.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

const CORES = { fundo: "#1e1f22", titulo: "#dbdee1", destaque: "#e3001b" };
const MARCA = { familia: "editorial", cores: { acento: "#e3001b", escuro: "#1e1f22", claro: "#dbdee1", papeis: CORES } } as never;

/**
 * Uma camada falsa da IA: fundo escuro e a "palavra" como blocos (letras) na
 * faixa da geometria; `vermelhas` diz quais letras saem na cor da marca, e
 * `sublinhado` põe um filete da marca embaixo da palavra.
 */
async function camada(o: { w: number; h: number; vermelhas?: number[]; todas?: "titulo" | "marca"; sublinhado?: boolean }): Promise<Buffer> {
  const { geometriaDoRecorte } = await import("@/lib/media/editor-do-curso/arte-pela-ia");
  const g = geometriaDoRecorte(o.w / o.h);
  const topo = Math.round(g.faixa.topo * o.h);
  const alto = Math.round((g.faixa.base - g.faixa.topo) * o.h);
  const letras = 10;
  const passo = Math.floor((o.w * 0.8) / letras);
  const pecas: sharp.OverlayOptions[] = [];
  for (let i = 0; i < letras; i++) {
    const marca = o.todas === "marca" || (o.todas !== "titulo" && (o.vermelhas ?? []).includes(i));
    const bloco = await sharp({ create: { width: Math.floor(passo * 0.8), height: alto, channels: 3, background: marca ? CORES.destaque : CORES.titulo } }).png().toBuffer();
    pecas.push({ input: bloco, left: Math.round(o.w * 0.1) + i * passo, top: topo });
  }
  if (o.sublinhado) {
    const filete = await sharp({ create: { width: Math.round(o.w * 0.8), height: Math.max(3, Math.round(alto * 0.06)), channels: 3, background: CORES.destaque } }).png().toBuffer();
    pecas.push({ input: filete, left: Math.round(o.w * 0.1), top: topo + alto - Math.max(3, Math.round(alto * 0.06)) });
  }
  return sharp({ create: { width: o.w, height: o.h, channels: 3, background: CORES.fundo } }).composite(pecas).png().toBuffer();
}
const uri = (b: Buffer) => `data:image/png;base64,${b.toString("base64")}`;

test("cor por letra: letras avulsas na cor da marca reprovam; palavra inteira numa cor e sublinhado da marca passam", async () => {
  const { corPorLetraNaPalavra } = await import("@/lib/media/editor-do-curso/recorte-com-letreiro");
  for (const [w, h] of [[1600, 900], [800, 1000], [720, 1280]]) {
    assert.match((await corPorLetraNaPalavra(uri(await camada({ w, h, vermelhas: [2, 3, 6, 8] })), CORES))!, /letras avulsas na cor da marca/, `${w}x${h}`);
    assert.equal(await corPorLetraNaPalavra(uri(await camada({ w, h, todas: "titulo" })), CORES), null, `${w}x${h} toda na cor da letra`);
    assert.equal(await corPorLetraNaPalavra(uri(await camada({ w, h, todas: "marca" })), CORES), null, `${w}x${h} toda na cor da marca`);
    assert.equal(await corPorLetraNaPalavra(uri(await camada({ w, h, todas: "titulo", sublinhado: true })), CORES), null, `${w}x${h} com sublinhado`);
  }
});

test("o prompt pede a palavra inteira numa cor, nunca letras avulsas na cor da marca", async () => {
  const { promptDoFundoDoRecorte, promptDeEstiloDoModelo } = await import("@/lib/media/editor-do-curso/arte-pela-ia");
  const estilo = promptDeEstiloDoModelo("sob-medida-recorte")!;
  const p = promptDoFundoDoRecorte({ estilo, frase: "Produtividade bíblica é remir o tempo", palavra: "PRODUTIVIDADE", tipo: "thumb", cores: CORES, composicao: estilo.composicoes[1] });
  assert.match(p, /the giant word ENTIRELY in #dbdee1, every letter the same color/);
  assert.match(p, /never single letters or pairs of letters in another color/);
  assert.doesNotMatch(p, /a few of its letters|last letters in the accent|part in the accent|few letters in the accent/);
  assert.doesNotMatch(JSON.stringify(estilo), /a few letters in the accent|last letters in the accent|part in the accent/);
});

test("os cartões ficam em áreas fora da palavra, do rosto e da frase; na deitada não há cartão", async () => {
  const { geometriaDoRecorte, layoutDoFundoDoRecorte } = await import("@/lib/media/editor-do-curso/arte-pela-ia");
  for (const r of [0.8, 1, 9 / 16]) {
    const g = geometriaDoRecorte(r);
    assert.equal(g.cartoes.length, 2, String(r));
    const rosto = { x0: 0.5 - g.cabecaMaxima / 2, x1: 0.5 + g.cabecaMaxima / 2 };
    for (const a of g.cartoes) {
      assert.ok(a.y0 >= g.faixa.base + 0.04, `cartão na faixa da palavra (${r})`);
      assert.ok(a.y1 <= g.frase.y - 0.04, `cartão na frase (${r})`);
      assert.ok(a.x1 <= rosto.x0 || a.x0 >= rosto.x1, `cartão no rosto (${r})`);
      assert.ok(a.x0 >= 0.1 && a.x1 <= 0.9, `cartão na borda (${r})`);
    }
  }
  assert.deepEqual(geometriaDoRecorte(16 / 9).cartoes, []);
  assert.match(layoutDoFundoDoRecorte("4:5", true), /CARD AREAS: .*left card area \(from 10% to 26% of the width and from 38% to 60% of the height\)/);
  assert.match(layoutDoFundoDoRecorte("4:5", true), /never touches or overlaps the giant word, never enters the central stage where the face goes/);
  assert.match(layoutDoFundoDoRecorte("16:9", true), /NO CARDS in this image/);
});

test("a camada da IA com letras avulsas na cor da marca é reprovada e a peça cai na reserva do mesmo estilo", async () => {
  const { desenharPelaIa } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
  const prompts: string[] = [];
  const porRede = await desenharPelaIa(
    { projectId: "p", modelo: "sob-medida-recorte", mediaType: "image", redes: ["youtube"], frase: "Produtividade bíblica é remir o tempo", marca: MARCA },
    {
      gerar: async (modelo, prompt, proporcao) => {
        prompts.push(prompt);
        const [w, h] = proporcao === "16:9" ? [1600, 900] : [800, 1000];
        // Com a palavra, a IA "erra" a cor por letra; sem a palavra, o fundo liso.
        const img = /write EXACTLY/.test(prompt) ? await camada({ w, h, vermelhas: [1, 2, 5, 8] }) : await sharp({ create: { width: w, height: h, channels: 3, background: CORES.fundo } }).png().toBuffer();
        return { dataUrl: uri(img), modelo, custoUsd: 0.134 };
      },
      conferir: async () => ({ aprovada: true, motivo: "ok", medida: { cortado: false, resumo: "ok", lados: {} } }) as never,
    }
  );
  // Três tentativas com a palavra (todas reprovadas pela cor), depois o fundo sem texto: o mesmo estilo.
  assert.equal(prompts.length, 4);
  assert.match(prompts[1], /letras avulsas na cor da marca/);
  for (const p of prompts) assert.match(p, /Cutout with Lettering/);
  assert.match(prompts[3], /ABSOLUTELY NO TEXT/);
  assert.ok(porRede.youtube.startsWith("data:image/jpeg"));
});

test("a camada com a palavra inteira numa cor passa de primeira", async () => {
  const { desenharPelaIa } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
  let geracoes = 0;
  await desenharPelaIa(
    { projectId: "p", modelo: "sob-medida-recorte", mediaType: "image", redes: ["instagram"], frase: "Produtividade bíblica é remir o tempo", marca: MARCA },
    {
      gerar: async (modelo, _p, proporcao) => {
        geracoes++;
        return { dataUrl: uri(await camada({ w: 800, h: 1000, todas: "titulo", sublinhado: true })), modelo, custoUsd: 0.134 };
      },
      conferir: async () => ({ aprovada: true, motivo: "ok", medida: { cortado: false, resumo: "ok", lados: {} } }) as never,
    }
  );
  assert.equal(geracoes, 1);
});
