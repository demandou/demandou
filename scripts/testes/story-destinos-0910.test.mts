/**
 * O story que sumiu (09/10): o lugar nasce em todas as contas da rede, passa para
 * a conta que fica quando uma sai, e o publish do Instagram tenta de novo no
 * "media not found" logo depois do FINISHED.
 *   npx tsx --test scripts/testes/story-destinos-0910.test.mts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const { ehMidiaAindaNaoEncontrada } = await import("@/lib/oauth/instagram");

const ler = (f: string) => readFileSync(new URL(`../../${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("o erro real da Demandou de 09/10 conta como mídia ainda não encontrada", () => {
  const real =
    'Instagram 17841416660962875/media_publish failed (400): {"error":{"message":"The requested resource does not exist","type":"OAuthException","code":24,"error_subcode":2207006,"is_transient":false,"error_user_title":"Media Not Found"}}';
  assert.equal(ehMidiaAindaNaoEncontrada(new Error(real)), true);
});

test("outros erros não ganham nova tentativa", () => {
  assert.equal(ehMidiaAindaNaoEncontrada(new Error('Instagram x/media failed (400): {"error":{"code":9004,"error_subcode":2207052}}')), false);
  assert.equal(ehMidiaAindaNaoEncontrada(new Error('Instagram x/media failed (400): {"error":{"error_subcode":2207006}}')), false, "só no media_publish");
  assert.equal(ehMidiaAindaNaoEncontrada(new Error("Error validating access token")), false);
});

test("todo media_publish passa pela nova tentativa", () => {
  const src = ler("lib/oauth/instagram.ts");
  const diretos = src.match(/igPost\(`\$\{igUserId\}\/media_publish`/g) ?? [];
  assert.equal(diretos.length, 1, "só a função da nova tentativa chama o media_publish");
  assert.ok((src.match(/publicarContainer\(igUserId, accessToken, containerId\)/g) ?? []).length >= 4);
});

test("marcar um lugar cria em cada conta da rede, e tirar a conta não leva o lugar junto", () => {
  const src = ler("components/posts/destinos-do-dia.tsx");
  assert.match(src, /for \(const contaId of new Set\(daRede\.map\(contaDe\)\)\)/, "um lugar por conta do dia");
  assert.match(src, /soDestaConta/, "o lugar que só a conta tirada tinha passa para as que ficam");
  assert.match(src, /aoEscolher\(new Set\(\[\.\.\.escolhidos, \.\.\.novos\]\)\)/, "o lugar novo já sai marcado com a rede");
});
