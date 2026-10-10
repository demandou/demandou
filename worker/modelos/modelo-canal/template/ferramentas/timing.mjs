// Canal — confere o tempo: cada inserção entra na palavra que a nomeia (±0,15 s).
//
// Uso:  node ferramentas/timing.mjs        (de dentro da pasta do projeto)
//
// Para cada momento, compara cada instante marcado (`em`, `…Em`, o `em` de cada item, lado, dado,
// opção) com o começo da palavra dita mais perto. Nos cartões do reframe, na palavra-chave, no
// capítulo e no B-roll também confere se o texto (ou a palavra da imagem) foi mesmo dito ali perto:
// rótulo sem lógica com a fala é proibido (a chamada também). O `cliqueEm` da inscrição é um gesto (não uma palavra) e
// fica de fora. Sai com código 1 se houver desvio, e mostra o desvio máximo.
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
const s = (t) => t.toFixed(2).replace(".", ",");
const maisPerto = (t) => palavras.reduce((a, p) => (Math.abs(p.em - t) < Math.abs(a.em - t) ? p : a), palavras[0]);
// números escritos por extenso na fala ("três" ↔ "3")
const EXTENSO = { 1: "um", 2: "dois", 3: "tres", 4: "quatro", 5: "cinco", 6: "seis", 7: "sete", 8: "oito", 9: "nove", 10: "dez" };

let erros = 0;
let maior = 0;
const ver = (nome, t) => {
  const p = maisPerto(t);
  const d = t - p.em;
  maior = Math.max(maior, Math.abs(d));
  const ok = Math.abs(d) <= LIM;
  if (!ok) erros++;
  console.log(`  ${ok ? "ok  " : "ERRO"} ${nome}: ${s(t)} s, palavra "${p.w}" em ${s(p.em)} s (${d >= 0 ? "+" : ""}${s(d)})`);
};
// o texto foi dito perto de `t`? (alguma palavra com mais de 2 letras, ou o número por extenso)
const dito = (texto, t, nome) => {
  const alvos = texto
    .split(/\s+/)
    .map(nucleo)
    .flatMap((a) => (EXTENSO[a] ? [a, EXTENSO[a]] : [a]))
    .filter((a) => a.length > 2 || /^\d+$/.test(a));
  const corr = Object.values(plano.correcoes ?? {}).map(nucleo);
  const achou = palavras.some((p) => Math.abs(p.em - t) <= 1.2 && alvos.some((a) => p.n === a || (a.length > 3 && p.n.startsWith(a)) || (p.n.length > 3 && a.startsWith(p.n))));
  if (!achou && !corr.some((c) => alvos.includes(c))) {
    erros++;
    console.log(`  ERRO ${nome} "${texto}": nada disso é dito perto de ${s(t)} s (rótulo sem lógica com a fala)`);
  }
};

const instantes = (obj, saida = [], caminho = "") => {
  if (Array.isArray(obj)) obj.forEach((v, i) => instantes(v, saida, `${caminho}[${i}]`));
  else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if (k === "cliqueEm") continue;
      if ((k === "em" || /Em$/.test(k)) && typeof v === "number") saida.push([`${caminho}${caminho ? "." : ""}${k}`, v]);
      else if (v && typeof v === "object") instantes(v, saida, `${caminho}${caminho ? "." : ""}${k}`);
    }
  }
  return saida;
};

for (const m of [...plano.momentos].sort((a, b) => a.de - b.de)) {
  console.log(`${s(m.de)}–${s(m.ate)} s  ${m.tipo}`);
  for (const [k, t] of instantes(m)) ver(k, t);
  if (m.tipo === "reframe") m.itens.forEach((it, i) => dito(it.texto, it.em, `itens[${i}]`));
  if (m.tipo === "destaque") dito(m.texto, m.em, "texto");
  if (m.tipo === "capitulo") dito(m.texto, m.em ?? m.de, "título");
  if (m.tipo === "chamada") dito(m.texto, m.em, "chamada");
  if (m.tipo === "cena") {
    const palavra = m.rotulo ?? plano.imagens?.[m.imagem.id]?.palavra;
    if (palavra) dito(palavra, m.em ?? m.de, "imagem");
  }
}
console.log(`\nDesvio máximo: ${s(maior)} s (limite ${s(LIM)} s).`);
console.log(erros ? `${erros} problema(s). Ajuste o tempo ou o texto.` : "Tempo OK.");
process.exit(erros ? 1 : 0);
