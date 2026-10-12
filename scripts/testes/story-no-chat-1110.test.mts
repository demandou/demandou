// O story pedido no chat do card (11/10, pedido do Bruno: "pedi no card para
// postar também no story, e não ajustou o tamanho e nem postou"). O chat não
// tinha a ação; a leitura por palavra (sem o modelo) tem de achar o story sem
// abrir uma reescrita de legenda que ninguém pediu. Nada toca banco nem IA.
// Rodar: npx tsx --test scripts/testes/story-no-chat-1110.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { entenderNaUnha } from "@/lib/media/pedido-do-card";

test("'posta também no story' vira só a ação de story, sem mexer na legenda", () => {
  assert.deepEqual(entenderNaUnha("posta também no story").map((a) => a.tipo), ["story"]);
  assert.deepEqual(entenderNaUnha("Quero nos stories também").map((a) => a.tipo), ["story"]);
});

test("pedido composto: story e texto juntos", () => {
  const tipos = entenderNaUnha("tira a palavra incrível da legenda e posta no story").map((a) => a.tipo);
  assert.ok(tipos.includes("story") && tipos.includes("texto"));
});

test("'história' não é story", () => {
  assert.ok(!entenderNaUnha("conta a história do cliente na legenda").some((a) => a.tipo === "story"));
});
