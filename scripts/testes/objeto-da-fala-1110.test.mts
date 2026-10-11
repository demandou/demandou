// A maquete é a coisa que a fala nomeia (11/10, crítica do Bruno: "o que a casa tem a ver com o que está sendo dito?").
import { test } from "node:test";
import assert from "node:assert/strict";
import { conferirRoteiro } from "../../worker/src/avancado/portao.mjs";

const fala = "Marta queria fazer monte de coisa e Maria ficou aos pés de Jesus com a melhor parte".split(" ").map((w, i) => ({ w, s: i * 0.4, e: i * 0.4 + 0.35 }));
const base = {
  tecnica: "maquete-3d",
  apresentador: [{ em: "inicio" }],
  legenda: { topo: 1500, esquerda: 60, largura: 960 },
  cenas: [{ arquivo: "cena-01.tsx", de: { palavra: "Marta" }, ate: { palavra: "parte" }, oQue: "Marta e Maria" }],
};
const conferir = (roteiro: object) =>
  (conferirRoteiro(roteiro, { palavras: fala, duracao: 8, temRecorte: false, arquivos: ["cena-01.tsx"] }) as { motivo: string }[]).map((p) => p.motivo).filter((m) => m.startsWith("maquete-3d"));

test("maquete sem objeto declarado reprova", () => {
  assert.equal(conferir(base).length, 1);
});

test("objeto com palavra que não foi dita reprova (a casa que ninguém falou)", () => {
  const r = conferir({ ...base, objeto: { nome: "casa", palavra: "casa" } });
  assert.match(r[0] ?? "", /não foi nomeado na fala/);
});

test("objeto nomeado na fala passa", () => {
  assert.deepEqual(conferir({ ...base, objeto: { nome: "Maria aos pés de Jesus", palavra: "pés" } }), []);
});
