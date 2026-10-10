// Gate de timing da Torre: tudo que entra na tela entra NA palavra dita (±0,15 s).
//
//   node ferramentas/timing.mjs        tabela; sai com erro se algum instante passar de 0,15 s
//
// Confere cada `em` e cada `…Em` do plano (momentos, itens, cômodos, partes do preço, paradas, a
// virada) contra o começo da palavra mais próxima em src/plano.json → palavras (já corrigidas).
// Um andar que pousa, a rota que chega, o cômodo que acende, o preço que conta: todos têm `em`.
import { readFileSync } from "node:fs";

const LIMITE = 0.15;
const plano = JSON.parse(readFileSync("src/plano.json", "utf8"));
const inicios = (plano.palavras ?? []).map((p) => p);
const f = (v) => (v >= 0 ? "+" : "") + v.toFixed(2).replace(".", ",");
const linhas = [];
let ruins = 0;
let maior = 0;

const conferir = (onde, t) => {
  if (typeof t !== "number" || !inicios.length) return;
  const p = [...inicios].sort((a, b) => Math.abs(a.em - t) - Math.abs(b.em - t))[0];
  const d = t - p.em;
  maior = Math.max(maior, Math.abs(d));
  const ok = Math.abs(d) <= LIMITE + 1e-6;
  if (!ok) ruins++;
  linhas.push([onde, `"${p.w}" ${p.em.toFixed(2)} s`, f(d), ok ? "ok" : "FORA"]);
};
const varrer = (obj, onde) => {
  if (Array.isArray(obj)) return obj.forEach((v, i) => varrer(v, `${onde}[${i + 1}]`));
  if (!obj || typeof obj !== "object") return;
  for (const [k, v] of Object.entries(obj)) {
    if ((k === "em" || /Em$/.test(k)) && typeof v === "number") conferir(`${onde}.${k}`, v);
    else if (v && typeof v === "object") varrer(v, `${onde}.${k}`);
  }
};
if (plano.virada) conferir("virada.em", plano.virada.em);
for (const m of [...plano.momentos].sort((a, b) => a.de - b.de)) varrer(m, `${m.tipo} ${m.de.toFixed(1)}`);

const w = (s, n) => String(s).padEnd(n);
console.log(`${w("instante", 44)}${w("palavra mais perto", 28)}${w("desvio", 9)}`);
for (const l of linhas) console.log(`${w(l[0], 44)}${w(l[1], 28)}${w(l[2], 9)}${l[3]}`);
console.log(`\nMaior desvio: ${maior.toFixed(2).replace(".", ",")} s (limite ${LIMITE.toFixed(2).replace(".", ",")} s)`);
if (ruins) {
  console.log(`REPROVADO: ${ruins} instante(s) fora da palavra. Use o "em" da palavra em src/plano.json → palavras.`);
  process.exit(1);
}
console.log("APROVADO.");
