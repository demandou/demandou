// O corte de custo das imagens (12/10, aprovado pelo Bruno): uma arte chegava a 9 imagens no Google
// (um formato por rede, 3 tentativas, e o ciclo repetido no mesmo estilo). Agora: uma geração só (o 4:5),
// os outros formatos saem da mesma arte sem cortar, e no máximo 2 tentativas. Nada toca rede nem IA.
// Rodar: npx tsx --test scripts/testes/custo-da-arte-1210.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { grupoPrincipal, produzirArtePorRede } from "@/lib/media/arte-por-rede";

const imagem = async (w: number, h: number) => `data:image/png;base64,${(await sharp({ create: { width: w, height: h, channels: 3, background: "#204060" } }).png().toBuffer()).toString("base64")}`;

test("o grupo que vai à IA é o 4:5 quando houver", () => {
  assert.equal(grupoPrincipal([{ proporcao: "16:9" }, { proporcao: "4:5" }]).proporcao, "4:5");
  assert.equal(grupoPrincipal([{ proporcao: "16:9" }]).proporcao, "16:9");
});

test("Instagram, LinkedIn e Facebook: UMA chamada à IA, e o LinkedIn sai da mesma arte no tamanho dele", async () => {
  delete process.env.ARTE_UMA_GERACAO;
  delete process.env.ARTE_TENTATIVAS;
  const pedidas: string[] = [];
  const arte = await produzirArtePorRede({
    redes: ["instagram", "linkedin", "facebook"],
    contentType: "image",
    promptBase: "teste",
    desenhar: async (_p, proporcao) => {
      pedidas.push(proporcao);
      return imagem(800, 1000);
    },
    conferir: async () => ({ aprovada: true, motivo: "ok" }) as never,
  });
  assert.deepEqual(pedidas, ["4:5"]);
  const li = await sharp(Buffer.from(arte.porRede.linkedin.split(",")[1], "base64")).metadata();
  assert.equal(li.width, 1200);
  assert.equal(li.height, 627);
});

test("no máximo 2 tentativas por arte", async () => {
  let n = 0;
  await produzirArtePorRede({
    redes: ["instagram"],
    contentType: "image",
    promptBase: "teste",
    desenhar: async () => {
      n++;
      return imagem(800, 1000);
    },
    conferir: async () => ({ aprovada: false, motivo: "texto encostado na margem", medida: { cortado: false, resumo: "ok", lados: {} } }) as never,
  });
  assert.equal(n, 2);
});
