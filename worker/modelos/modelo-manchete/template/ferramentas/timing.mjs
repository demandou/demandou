// Confere o tempo de cada B-roll/inserção com a fala: compara o `em` de cada momento (e de cada
// `angulos[]`) com o início da palavra mais próxima em work/palavras.json (ou plano.palavras) e
// lista os desvios. Entrar na palavra que nomeia a coisa, com no máximo 0,15 s de diferença.
//
// Uso:  node ferramentas/timing.mjs
import { existsSync, readFileSync } from "node:fs";

const plano = JSON.parse(readFileSync("src/plano.json", "utf8"));
const palavras = plano.palavras ?? (existsSync("work/palavras.json") ? JSON.parse(readFileSync("work/palavras.json", "utf8")) : []);
const perto = (t) => palavras.reduce((a, p) => (Math.abs(p.em - t) < Math.abs(a.em - t) ? p : a), palavras[0]);
let ruins = 0;
const ver = (rotulo, t) => {
  if (typeof t !== "number") return;
  const p = perto(t);
  const d = t - p.em;
  const ok = Math.abs(d) <= 0.15;
  if (!ok) ruins++;
  console.log(`${ok ? "ok " : "!! "} ${rotulo.padEnd(34)} em ${t.toFixed(2)} s · palavra "${p.w}" ${p.em.toFixed(2)} s · desvio ${d >= 0 ? "+" : ""}${d.toFixed(2)} s`);
};
for (const m of plano.momentos ?? []) {
  ver(`${m.tipo} ${m.de.toFixed(1)}–${m.ate.toFixed(1)}`, m.em);
  for (const a of m.angulos ?? []) ver("  ângulo", a.em);
}
console.log(ruins ? `\n${ruins} desvio(s) acima de 0,15 s: ajuste o "em" para o início da palavra.` : "\nTudo dentro de ±0,15 s.");
process.exitCode = ruins ? 1 : 0;
