// Aula — confere o tempo: cada coisa entra na palavra que a nomeia (±0,15 s) e mostra o que foi dito.
//
// Uso:  node ferramentas/timing.mjs        (de dentro da pasta do projeto)
//
// Para cada momento, compara cada instante marcado (`em`, `…Em`, o `em` de cada item, termo da
// fórmula, série, opção) com o começo da palavra dita mais perto. Também confere o conteúdo:
// - título do slide, capítulo, palavra-chave, notas e rótulos do gráfico, etiqueta do número:
//   alguma palavra do texto foi dita ali perto (rótulo sem lógica com a fala é proibido);
// - número: o valor (e o `desde`) foi dito ali perto (números escritos ou por extenso);
// - fórmula: cada termo é a palavra dita no instante dele ("=" ↔ "igual", "·" ↔ "vezes", "+" ↔
//   "mais", a letra ↔ a letra; o expoente pode ser o "elevado");
// - resumo: cada frase do cartão de resumo repete o que JÁ foi dito antes dele.
// Sai com código 1 se houver problema, e mostra o desvio máximo.
import { existsSync } from "node:fs";
import { lerJson } from "../scripts/comum.mjs";

if (!existsSync("src/plano.json")) {
  console.error("Rode de dentro da pasta do projeto.");
  process.exit(2);
}
const plano = lerJson("src/plano.json");
const LIM = 0.15;
const nucleo = (w) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}]/gu, "");
// as correções valem para a conferência (palavra que a transcrição errou)
const correcoes = Object.fromEntries(Object.entries(plano.correcoes ?? {}).filter(([de]) => !de.includes(" ")).map(([de, para]) => [nucleo(de), para]));
const palavras = plano.palavras.map((p) => {
  const w = correcoes[nucleo(p.w)] ?? p.w;
  return { ...p, w, n: nucleo(w) };
});
const s = (t) => t.toFixed(2).replace(".", ",");
const maisPerto = (t) => palavras.reduce((a, p) => (Math.abs(p.em - t) < Math.abs(a.em - t) ? p : a), palavras[0]);
const EXTENSO = { 0: "zero", 1: "um", 2: "dois", 3: "tres", 4: "quatro", 5: "cinco", 6: "seis", 7: "sete", 8: "oito", 9: "nove", 10: "dez", 100: "cem", 1000: "mil" };
// número escrito em pt-BR ("1.000,00", "1%", "R$1.127") → valor
const numeroDe = (w) => {
  const m = String(w).replace(/[R$%\s]/g, "").match(/^-?[\d.]+(,\d+)?$/);
  return m ? Number(m[0].replace(/\./g, "").replace(",", ".")) : null;
};
const OPERADORES = { "=": ["igual", "e"], "·": ["vezes"], "×": ["vezes"], "+": ["mais"], "−": ["menos"], "-": ["menos"], "/": ["dividido", "sobre"], "÷": ["dividido"], "<": ["menor"], ">": ["maior"], "√": ["raiz"] };

let erros = 0;
let maior = 0;
const erro = (msg) => {
  erros++;
  console.log(`  ERRO ${msg}`);
};
const ver = (nome, t) => {
  const p = maisPerto(t);
  const d = t - p.em;
  maior = Math.max(maior, Math.abs(d));
  const ok = Math.abs(d) <= LIM;
  if (!ok) erros++;
  console.log(`  ${ok ? "ok  " : "ERRO"} ${nome}: ${s(t)} s, palavra "${p.w}" em ${s(p.em)} s (${d >= 0 ? "+" : ""}${s(d)})`);
};
// o texto foi dito perto de `t`? (alguma palavra com mais de 2 letras, ou um número)
const dito = (texto, t, nome, janela = 1.2) => {
  const alvos = texto
    .split(/\s+/)
    .map(nucleo)
    .flatMap((a) => (EXTENSO[a] ? [a, EXTENSO[a]] : [a]))
    .filter((a) => a.length > 2 || /^\d+$/.test(a));
  const achou = palavras.some((p) => Math.abs(p.em - t) <= janela && alvos.some((a) => p.n === a || (a.length > 3 && p.n.startsWith(a)) || (p.n.length > 3 && a.startsWith(p.n))));
  if (!achou) erro(`${nome} "${texto}": nada disso é dito perto de ${s(t)} s (rótulo sem lógica com a fala)`);
};
const valorDito = (v, t, nome) => {
  const achou = palavras.some((p) => Math.abs(p.em - t) <= 0.6 && (numeroDe(p.w) === v || p.n === EXTENSO[v]));
  if (!achou) erro(`${nome} ${v}: esse número não é dito perto de ${s(t)} s (nunca mostre um número que não foi falado)`);
};
const termoDito = (k, nome) => {
  const p = maisPerto(k.em);
  const limpo = k.texto.replace(/[()[\]\s]/g, "");
  const okLetra = [...limpo].some((c) => /[\p{L}\p{N}]/u.test(c) && (p.n === nucleo(c) || numeroDe(p.w) === Number(c) || p.n === EXTENSO[Number(c)]));
  const okOp = [...limpo].some((c) => (OPERADORES[c] ?? []).includes(p.n));
  // termo que é uma palavra ("peso", "verbo") ou um número inteiro ("35 ml" ↔ "35")
  const okPalavra = nucleo(limpo).length > 1 && (p.n === nucleo(limpo) || nucleo(limpo).startsWith(p.n) || p.n.startsWith(nucleo(limpo)));
  const n = numeroDe(limpo.replace(/[^\d.,]/g, ""));
  const okNumero = n !== null && palavras.some((q) => Math.abs(q.em - k.em) <= 0.2 && numeroDe(q.w) === n);
  const okExpoente = k.sup && palavras.some((q) => Math.abs(q.em - k.em) <= 0.8 && q.n === "elevado");
  if (!okLetra && !okOp && !okExpoente && !okPalavra && !okNumero) erro(`${nome} "${k.texto}": a palavra dita em ${s(p.em)} s é "${p.w}" (o termo não é o que está sendo dito)`);
};
const jaDito = (texto, em, nome) => {
  const antes = palavras.filter((p) => p.em < em + 0.05);
  const alvos = texto.split(/[\s:→]+/).filter(Boolean);
  const sig = alvos.filter((a) => nucleo(a).length > 3 || numeroDe(a) !== null);
  const ditos = sig.filter((a) => {
    const v = numeroDe(a);
    if (v !== null) return antes.some((p) => numeroDe(p.w) === v || p.n === EXTENSO[v]);
    const n = nucleo(a);
    return antes.some((p) => p.n === n || (n.length > 4 && p.n.startsWith(n.slice(0, -1))) || (p.n.length > 4 && n.startsWith(p.n.slice(0, -1))));
  });
  if (sig.length && ditos.length / sig.length < 0.6) erro(`${nome} "${texto}": o resumo só repete o que já foi dito (dito: ${ditos.join(", ") || "nada"})`);
};

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

for (const m of [...plano.momentos].sort((a, b) => a.de - b.de)) {
  console.log(`${s(m.de)}–${s(m.ate)} s  ${m.tipo}`);
  for (const [k, t] of instantes(m)) ver(k, t);
  if (m.tipo === "slide") {
    dito(m.titulo, m.em ?? m.de, "título");
    (m.itens ?? []).forEach((it, i) => dito(it.texto, it.em, `itens[${i}]`));
    (m.formula ?? []).forEach((k, i) => termoDito(k, `formula[${i}]`));
    (m.resumo?.itens ?? []).forEach((it, i) => jaDito(it, m.resumo.em, `resumo[${i}]`));
  }
  if (m.tipo === "capitulo") dito(m.texto, m.em ?? m.de, "título");
  if (m.tipo === "destaque") dito(m.texto, m.em, "texto");
  if (m.tipo === "topicos" || m.tipo === "passos") m.itens.forEach((it, i) => dito(it.texto, it.em, `itens[${i}]`));
  if (m.tipo === "numero") {
    valorDito(m.valor, m.em, "valor");
    if (m.desde !== undefined) valorDito(m.desde, m.desdeEm ?? m.de, "desde");
    if (m.via) dito(m.via, m.viaEm ?? m.em, "via");
    dito(m.rotulo, m.rotuloEm ?? m.em, "rótulo", 1.6);
  }
  if (m.tipo === "grafico") {
    (m.series ?? []).forEach((x, i) => {
      dito(x.rotulo, x.em, `series[${i}].rotulo`, 1.5);
      if (x.nota) dito(x.nota, x.notaEm ?? x.em, `series[${i}].nota`);
    });
    if (m.base) dito(m.base.rotulo, m.base.em, "base");
    (m.dados ?? []).forEach((d, i) => valorDito(d.valor, d.em, `dados[${i}]`));
  }
}
console.log(`\nDesvio máximo: ${s(maior)} s (limite ${s(LIM)} s).`);
console.log(erros ? `${erros} problema(s). Ajuste o tempo ou o texto.` : "Tempo OK.");
process.exit(erros ? 1 : 0);
