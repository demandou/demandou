// Compara o `em` de cada entrada (cursor/clique, itens, números) com o começo da palavra dita e
// lista os desvios. Regra: toda inserção entra na palavra que a nomeia, ±0,15 s.
// Uso: node ferramentas/conferir-tempos.mjs        (de dentro da pasta do projeto)
import { readFileSync } from "node:fs";
const plano = JSON.parse(readFileSync("src/plano.json", "utf8"));
const palavras = plano.palavras;
const achados = [];
const varre = (o, m, caminho) => {
  if (Array.isArray(o)) return o.forEach((v, i) => varre(v, m, `${caminho}[${i}]`));
  if (o && typeof o === "object") {
    for (const [k, v] of Object.entries(o)) {
      if ((k === "em" || /Em$/.test(k)) && typeof v === "number" && !(m.tipo === "abertura")) {
        let w = palavras[0];
        for (const p of palavras) if (Math.abs(p.em - v) < Math.abs(w.em - v)) w = p;
        achados.push({ de: m.de, tipo: m.tipo, campo: `${caminho}.${k}`, em: v, palavra: w.w, em_palavra: w.em, desvio: +(v - w.em).toFixed(2) });
      } else if (v && typeof v === "object") varre(v, m, `${caminho}.${k}`);
    }
  }
};
plano.momentos.forEach((m) => varre(m, m, m.tipo));
let ruins = 0;
for (const a of achados) {
  const ok = Math.abs(a.desvio) <= 0.15;
  if (!ok) ruins++;
  console.log(`${ok ? "ok  " : "FORA"} ${String(a.em).padStart(6)} s  ${a.campo.padEnd(22)} palavra "${a.palavra}" (${a.em_palavra} s)  desvio ${a.desvio} s`);
}
console.log(ruins ? `\n${ruins} entrada(s) fora de ±0,15 s: ajuste o "em" para o começo da palavra que nomeia a coisa.` : "\nTodas as entradas caem na palavra dita (±0,15 s).");
process.exitCode = ruins ? 1 : 0;
