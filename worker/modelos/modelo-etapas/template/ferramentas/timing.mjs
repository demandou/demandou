// Etapas — confere o tempo: cada rótulo e cada item entra na palavra que o nomeia (±0,15 s).
//
// Uso:  node ferramentas/timing.mjs        (de dentro da pasta do projeto)
//
// Lista, para cada momento, o desvio entre o instante marcado e o começo da palavra dita:
//   - `etapa`/`prova` com rótulo: o `de` tem que cair na palavra do rótulo (±0,15 s). Rótulo sem
//     nenhuma palavra parecida na fala (±1,5 s) é erro: "rótulo sem lógica com a fala é proibido".
//   - itens, opções, lados, dados, termo, número… (todo `em` fora de `telas`): na palavra, ±0,15 s.
//   - `telas` de uma etapa (troca de print a cada 0,3 a 1 s) não seguem palavra: não entram.
// Sai com código 1 se houver desvio. Corrija o `em`/`de` (ou o rótulo) e rode de novo.
import { existsSync } from "node:fs";
import { lerJson } from "../scripts/comum.mjs";

if (!existsSync("src/plano.json")) {
  console.error("Rode de dentro da pasta do projeto.");
  process.exit(2);
}
const plano = lerJson("src/plano.json");
const LIM = 0.15;
const nucleo = (w) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}]/gu, "");
const palavras = plano.palavras.map((p) => ({ ...p, n: nucleo(p.w) }));
const maisPerto = (t) => palavras.reduce((a, p) => (Math.abs(p.em - t) < Math.abs(a.em - t) ? p : a), palavras[0]);
const s = (t) => t.toFixed(2).replace(".", ",");

let erros = 0;
const ver = (nome, t, tipo) => {
  const p = maisPerto(t);
  const d = t - p.em;
  const ok = Math.abs(d) <= LIM;
  if (!ok) erros++;
  console.log(`  ${ok ? "ok  " : "ERRO"} ${tipo} ${nome}: ${s(t)} s, palavra "${p.w}" em ${s(p.em)} s (${d >= 0 ? "+" : ""}${s(d)})`);
};

const instantes = (obj, saida = [], chave = "") => {
  if (Array.isArray(obj)) obj.forEach((v) => instantes(v, saida, chave));
  else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if (k === "telas") continue;
      if ((k === "em" || /Em$/.test(k)) && typeof v === "number") saida.push([k, v]);
      else if (v && typeof v === "object") instantes(v, saida, k);
    }
  }
  return saida;
};

for (const m of plano.momentos) {
  console.log(`${s(m.de)}–${s(m.ate)} s  ${m.tipo}${m.rotulo ? ` "${m.rotulo}"` : ""}`);
  const rot = m.tipo === "etapa" || m.tipo === "prova" ? m.rotulo : m.pilula;
  if (rot) {
    const alvos = rot.split(/\s+/).map(nucleo).filter((x) => x.length > 2);
    const achadas = palavras.filter((p) => Math.abs(p.em - m.de) <= 1.5 && alvos.some((a) => p.n.includes(a) || (p.n.length > 2 && a.includes(p.n))));
    const corr = Object.values(plano.correcoes ?? {}).map(nucleo);
    const viaCorrecao = corr.some((c) => alvos.includes(c)) && palavras.some((p) => Math.abs(p.em - m.de) <= 1.5);
    if (achadas.length === 0 && !viaCorrecao) {
      erros++;
      console.log(`  ERRO rótulo "${rot}" não aparece na fala perto de ${s(m.de)} s: rótulo sem lógica com a fala`);
    } else if (achadas.length) {
      const d = m.de - achadas[0].em;
      const ok = Math.abs(d) <= LIM;
      if (!ok) erros++;
      console.log(`  ${ok ? "ok  " : "ERRO"} rótulo "${rot}": entra em ${s(m.de)} s, palavra "${achadas[0].w}" em ${s(achadas[0].em)} s (${d >= 0 ? "+" : ""}${s(d)})`);
    } else console.log(`  ok   rótulo "${rot}" (palavra corrigida em correcoes)`);
  }
  for (const [k, t] of instantes(m)) ver(k, t, "  ");
}
if (m_vazio()) console.log("sem momentos");
console.log(erros ? `\n${erros} desvio(s). Ajuste o tempo ou o rótulo.` : "\nTempo OK.");
process.exit(erros ? 1 : 0);
function m_vazio() {
  return plano.momentos.length === 0;
}
