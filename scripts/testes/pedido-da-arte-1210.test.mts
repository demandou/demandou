// O ajuste da arte pelo chat no mesmo estilo (12/10, o pedido do Bruno: "troca a minha foto pela que
// acabei de subir, diminui um pouco, efeito de luz, e um recorte de papel com o globo no canto de cima
// à direita"). A leitura da reescrita e a escala da pessoa. Nada toca banco, rede ou IA.
// Rodar: npx tsx --test scripts/testes/pedido-da-arte-1210.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { lerPedidoReescrito } from "@/lib/media/editor-do-curso/pedido-da-arte";
import { escalarPelaBase } from "@/lib/media/editor-do-curso/recorte-com-letreiro";

test("a reescrita do pedido do Bruno: direção em inglês, a pessoa menor e com luz, a foto nova e o que conferir", () => {
  const r = lerPedidoReescrito(
    '```json\n{"direcao":"A torn paper cutout with a small globe, top right corner, soft drop shadow.","pessoa":{"escala":0.85,"luz":true},"fotoNovaDosMateriais":true,"itens":["um globo dentro de um recorte de papel no canto superior direito"]}\n```'
  );
  assert.ok(r);
  assert.match(r!.direcao, /paper cutout/);
  assert.deepEqual(r!.pessoa, { escala: 0.85, luz: true });
  assert.equal(r!.fotoNovaDosMateriais, true);
  assert.equal(r!.itens.length, 1);
});

test("a reescrita fora do formato não passa, e a escala fica entre 0,55 e 1,25", () => {
  assert.equal(lerPedidoReescrito("não é json"), null);
  assert.equal(lerPedidoReescrito('{"direcao":""}'), null);
  assert.equal(lerPedidoReescrito('{"direcao":"x","pessoa":{"escala":0.1}}')!.pessoa.escala, 0.55);
  assert.equal(lerPedidoReescrito('{"direcao":"x","pessoa":{"escala":3}}')!.pessoa.escala, 1.25);
  assert.equal(lerPedidoReescrito('{"direcao":"x","itens":["a1234","b1234","c1234","d1234","e1234","f1234"]}')!.itens.length, 5);
});

test("a pessoa menor fica presa pela base e pelo centro; sem pedido, o lugar de sempre", () => {
  const lugar = { left: 100, top: 400, width: 600, height: 900 };
  assert.deepEqual(escalarPelaBase(lugar, null), lugar);
  const menor = escalarPelaBase(lugar, 0.8);
  assert.equal(menor.width, 480);
  assert.equal(menor.height, 720);
  assert.equal(menor.top + menor.height, lugar.top + lugar.height, "os pés no mesmo lugar");
  assert.equal(menor.left + menor.width / 2, lugar.left + lugar.width / 2, "no mesmo centro");
});
