/**
 * O story na dimensão certa (08/10): a arte do feed vira 1080x1920 inteira, na área segura.
 *   npx tsx --test scripts/testes/story-0810.test.mts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { arteParaStory, caixaDaArte, jaEhStory, STORY } from "../../lib/media/arte-do-story.ts";

const ler = (f: string) => readFileSync(new URL(`../../${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("arte 4:5 vira 1080x1920 inteira, dentro da área segura", async () => {
  const feed = await sharp({ create: { width: 1080, height: 1350, channels: 3, background: { r: 200, g: 80, b: 20 } } }).jpeg().toBuffer();
  const r = await arteParaStory(feed);
  assert.equal(r.ajustada, true);
  const m = await sharp(r.buffer).metadata();
  assert.equal(m.width, STORY.largura);
  assert.equal(m.height, STORY.altura);
  const c = caixaDaArte(1080, 1350);
  assert.ok(c.y >= STORY.faixaSegura && c.y + c.h <= STORY.altura - STORY.faixaSegura, "a arte fica fora das faixas do nome e da resposta");
  assert.ok(Math.abs(c.w / c.h - 1080 / 1350) < 0.01, "sem esticar");
});

test("paisagem e quadrado também cabem inteiros", () => {
  for (const [w, h] of [[1200, 630], [1080, 1080]]) {
    const c = caixaDaArte(w, h);
    assert.ok(c.w <= STORY.largura && c.y >= STORY.faixaSegura);
  }
});

test("arte que já é 9:16 passa como está", async () => {
  assert.ok(jaEhStory(1080, 1920));
  const pronta = await sharp({ create: { width: 1080, height: 1920, channels: 3, background: "#000" } }).jpeg().toBuffer();
  assert.equal((await arteParaStory(pronta)).ajustada, false);
});

test("a rota da Meta ajusta só o story de imagem, e o story do Facebook passa por ela", () => {
  const rota = ler("app/api/media/ig/[token]/route.ts");
  assert.ok(rota.includes('formato === "story"') && rota.includes("arteParaStory"));
  assert.ok(rota.includes('ehStory && midia.mimeType.startsWith("image/")'), "vídeo passa como está");
  const pub = ler("lib/publish/oauth-post.ts");
  assert.ok(pub.includes("publishFacebookPhotoStory(accessToken, platformUserId, buildIgMediaPublicUrl(post.id, 0))"));
});
