// Tese — confere o TIMING de cada inserção: cada imagem (`cena`) e cada item de bloco precisa
// entrar na palavra que a nomeia (±0,15 s). Lista os desvios e mostra a palavra mais próxima.
//
// Uso:  node ferramentas/conferir-tempo.mjs        (de dentro da pasta do projeto)
// Sai com código 1 se houver desvio maior que 0,15 s.
import { readFileSync } from "node:fs";

const plano = JSON.parse(readFileSync("src/plano.json", "utf8"));
const palavras = plano.palavras ?? [];
const TOL = 0.15;
const achar = (t) => palavras.reduce((a, p) => (Math.abs(p.em - t) < Math.abs(a.em - t) ? p : a), palavras[0]);
const linhas = [];
const checar = (rotulo, t, texto) => {
  if (typeof t !== "number") return;
  const p = achar(t);
  const d = t - p.em;
  linhas.push({ rotulo, t, texto, palavra: p.w, em: p.em, d });
};
// instantes "em"/"…Em" dentro de um momento
const coletar = (obj, nome, saida = []) => {
  if (Array.isArray(obj)) obj.forEach((v, i) => coletar(v, `${nome}[${i + 1}]`, saida));
  else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if ((k === "em" || /Em$/.test(k)) && typeof v === "number") saida.push([`${nome}.${k}`, v, obj.texto ?? obj.rotulo ?? obj.termo ?? ""]);
      else if (v && typeof v === "object") coletar(v, nome, saida);
    }
  }
  return saida;
};
for (const m of plano.momentos) {
  const nome = `${m.tipo} ${m.de.toFixed(2)}`;
  // a imagem entra na palavra que a nomeia: `de` deve cair nela
  if (m.tipo === "cena") checar(`${nome} (entrada da imagem "${m.imagem?.id}")`, m.de, m.imagem?.id);
  for (const [r, t, tx] of coletar(m, nome)) checar(r, t, tx);
}
let ruins = 0;
for (const l of linhas) {
  const ok = Math.abs(l.d) <= TOL;
  if (!ok) ruins++;
  console.log(`${ok ? "ok   " : "DESVIO"} ${l.rotulo}: ${l.t.toFixed(2)} s · palavra mais próxima "${l.palavra}" a ${l.em.toFixed(2)} s (${l.d >= 0 ? "+" : ""}${l.d.toFixed(2)} s)`);
}
console.log(ruins ? `\n${ruins} desvio(s) acima de ${TOL} s: ajuste o "de" da imagem (ou o "em") para a palavra que a nomeia.` : `\nTiming OK: ${linhas.length} inserção(ões) dentro de ±${TOL} s.`);
process.exit(ruins ? 1 : 0);
