// Dossiê — confere o tempo: cada prova, item, campo, carimbo e foto entra na palavra que o nomeia (±0,15 s).
//
// Uso:  node ferramentas/timing.mjs        (de dentro da pasta do projeto)
//
// Lista, para cada momento, o desvio entre cada instante marcado (`em` e todo campo `…Em`) e o começo
// da palavra dita mais próxima. Sai com código 1 se algum desvio passar de 0,15 s: corrija o instante
// com o `em` da palavra em work/palavras.json e rode de novo.
import { existsSync } from "node:fs";
import { lerJson } from "../scripts/comum.mjs";

if (!existsSync("src/plano.json")) {
  console.error("Rode de dentro da pasta do projeto.");
  process.exit(2);
}
const plano = lerJson("src/plano.json");
const LIM = 0.15;
const palavras = plano.palavras;
const maisPerto = (t) => palavras.reduce((a, p) => (Math.abs(p.em - t) < Math.abs(a.em - t) ? p : a), palavras[0]);
const s = (t) => t.toFixed(2).replace(".", ",");

const instantes = (obj, saida = [], caminho = "") => {
  if (Array.isArray(obj)) obj.forEach((v, i) => instantes(v, saida, `${caminho}[${i}]`));
  else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if ((k === "em" || /Em$/.test(k)) && typeof v === "number") saida.push([`${caminho}${caminho ? "." : ""}${k}`, v]);
      else if (v && typeof v === "object") instantes(v, saida, `${caminho}${caminho ? "." : ""}${k}`);
    }
  }
  return saida;
};

let erros = 0;
let maior = 0;
for (const m of [...plano.momentos].sort((a, b) => a.de - b.de)) {
  console.log(`${s(m.de)}–${s(m.ate)} s  ${m.tipo}`);
  for (const [nome, t] of instantes(m)) {
    const p = maisPerto(t);
    const d = t - p.em;
    maior = Math.max(maior, Math.abs(d));
    const ok = Math.abs(d) <= LIM;
    if (!ok) erros++;
    console.log(`  ${ok ? "ok  " : "ERRO"} ${nome}: ${s(t)} s, palavra "${p.w}" em ${s(p.em)} s (${d >= 0 ? "+" : ""}${s(d)})`);
  }
}
console.log(`\nMaior desvio: ${s(maior)} s.`);
console.log(erros ? `${erros} desvio(s) acima de 0,15 s. Ajuste o tempo.` : "Tempo OK.");
process.exit(erros ? 1 : 0);
