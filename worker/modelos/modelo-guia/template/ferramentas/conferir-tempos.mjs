// Guia — gate de timing: cada tela e cada inserção precisa entrar na palavra que a nomeia (±0,15 s).
//
// Uso:  node ferramentas/conferir-tempos.mjs            (de dentro do projeto)
// Compara o `de` de cada `mapa` com zoom, `print`, `destaque`, `definicao`, `numero` e `cta`, e o `em` de
// cada seta e de cada item, com o início da palavra mais próxima em `plano.palavras`. Lista os desvios.
// Sai com erro (código 1) se houver desvio maior que 0,15 s: corrija o `em`/`de` e rode de novo.
import { exigirProjeto, lerJson } from "../scripts/comum.mjs";

exigirProjeto();
const plano = lerJson("src/plano.json");
const inicios = (plano.palavras ?? []).map((p) => ({ em: p.em, w: p.w }));
const TOL = 0.15;
const s = (t) => t.toFixed(2).replace(".", ",");
const perto = (t) => inicios.reduce((a, b) => (Math.abs(b.em - t) < Math.abs(a.em - t) ? b : a), inicios[0]);
const desvios = [];
let total = 0;
const checar = (rotulo, t) => {
  if (typeof t !== "number") return;
  total++;
  const p = perto(t);
  const d = Math.abs(p.em - t);
  if (d > TOL) desvios.push(`${rotulo} em ${s(t)} s: a palavra mais próxima é "${p.w}" em ${s(p.em)} s (desvio ${s(d)} s)`);
};
const itens = (obj, rotulo) => {
  if (Array.isArray(obj)) obj.forEach((v, i) => itens(v, `${rotulo}[${i + 1}]`));
  else if (obj && typeof obj === "object")
    for (const [k, v] of Object.entries(obj)) {
      if ((k === "em" || /Em$/.test(k)) && typeof v === "number") checar(rotulo + (k === "em" ? "" : `.${k}`), v);
      else if (v && typeof v === "object") itens(v, `${rotulo}.${k}`);
    }
};
for (const m of plano.momentos) {
  const nome = `${m.tipo}${m.foco !== undefined ? ` (placa ${m.foco + 1})` : ""}`;
  // a tela entra na palavra que a nomeia; o mapa inteiro e a abertura começam em 0
  const entraNaPalavra = ["print", "destaque", "definicao", "numero", "cta", "pergunta", "frase"].includes(m.tipo) || (m.tipo === "mapa" && m.foco !== undefined);
  if (entraNaPalavra && m.de > 0.3) checar(nome, m.em ?? m.de);
  itens(m, nome);
}
console.log(`Gate de timing: ${total} entradas conferidas (tolerância ${s(TOL)} s).`);
if (desvios.length) {
  desvios.forEach((d) => console.log(`  - ${d}`));
  console.log("REPROVADO: ajuste o tempo para a palavra que nomeia cada coisa (work/palavras.json).");
  process.exit(1);
}
console.log("APROVADO.");
