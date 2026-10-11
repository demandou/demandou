// O card de corte que nasce depois do começo da montagem já nasce com o estado dela (11/10).
import { test } from "node:test";
import assert from "node:assert/strict";
import { espelhoDaMontagemDoTrecho } from "@/lib/media/sincronizar-quadro";
import { cardEmProducao } from "@/lib/squad/peca-em-producao";

test("trecho em montagem: o card novo nasce como fazendo", () => {
  const meta: Record<string, unknown> = { videoJobId: "v", trechoIndice: 0, ...espelhoDaMontagemDoTrecho({ montagem: { estado: "montando", desde: "2026-10-11T15:44:47Z" } }) };
  assert.deepEqual(meta.montagem, { estado: "montando", desde: "2026-10-11T15:44:47Z", motivo: null, falhaTecnica: false });
  assert.equal(cardEmProducao({ content: "Marta fazia mais.", metadata: meta }), true);
});

test("trecho sem montagem: nada a espelhar", () => {
  assert.deepEqual(espelhoDaMontagemDoTrecho({ montagem: null }), {});
  assert.deepEqual(espelhoDaMontagemDoTrecho({}), {});
});

test("montagem pronta: o card não fica preso em fazendo", () => {
  const meta = espelhoDaMontagemDoTrecho({ montagem: { estado: "pronto", desde: "x" } });
  assert.equal(cardEmProducao({ content: "Marta fazia mais.", metadata: meta }), false);
});
