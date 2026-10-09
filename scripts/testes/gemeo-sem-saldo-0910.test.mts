/**
 * Sem saldo não é tentativa do cliente (09/10): o gêmeo do Vitor ficou "falhou"
 * de vez depois de três 402 da HeyGen, e a recarga não o destravava.
 *   npx tsx --test scripts/testes/gemeo-sem-saldo-0910.test.mts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ler = (f: string) => readFileSync(new URL(`../../${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("gêmeo de foto e gêmeo treinado devolvem a tentativa quando o erro é falta de saldo", () => {
  const src = ler("lib/media/gemeo-passo.ts");
  const devolve = src.match(/semSaldo \? \{ tentativas: Math\.max\(0, \(x\.(avatarFoto|avatar)\.tentativas \?\? 1\) - 1\) \}/g) ?? [];
  assert.equal(devolve.length, 2, "os dois caminhos devolvem a tentativa");
  assert.equal((src.match(/O seu gêmeo está na fila do gerador/g) ?? []).length, 2, "a pessoa lê fila, não falha");
});

test("a falta de saldo continua sendo classificada como sem-saldo no 402 da HeyGen", () => {
  const src = ler("lib/media/gemeo-geradores.ts");
  assert.match(src, /r\.status === 402/);
  assert.match(src, /"sem-saldo"/);
});
