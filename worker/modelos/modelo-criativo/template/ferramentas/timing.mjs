// Gate de timing do Criativo: cada coisa que entra no palco entra na palavra que a nomeia (±0,15 s).
//
//   node ferramentas/timing.mjs                                     confere src/plano.json
//   node ferramentas/timing.mjs --plano out/variantes/plano-B.json  confere um plano de variante
//
// Sai com erro se algo passar de 0,15 s. Confere, contra a fala (palavras do plano):
//   gancho    → `em` na 1ª palavra da manchete; `iconeEm` na palavra do ícone (gelo, sol…);
//               etiquetas na 1ª palavra delas. Um gancho no começo do vídeo já está montado no
//               1º quadro: o que vale é a palavra acender quando é dita.
//   heroi     → `em` na `palavra` que nomeia o produto; `tituloEm` na 1ª palavra do título.
//   prova     → `em` (a foto) na `palavra`; `textoEm` na 1ª palavra do benefício; `numero.em` no número dito.
//   selo      → `em` na 1ª palavra do texto ("frete").
//   cta       → `em` na 1ª palavra do botão ("Saiba"); `toqueEm` numa palavra do botão; `tituloEm`.
//   blocos universais → o `em` de cada item/lado/dado na 1ª palavra do texto dele.
// Palavra que não foi dita igual (resumo, sinônimo) vira "confira no quadro" (aviso, não erro).
import { existsSync, readFileSync } from "node:fs";

const LIMITE = 0.15;
const args = process.argv.slice(2);
const arquivo = args.includes("--plano") ? args[args.indexOf("--plano") + 1] : "src/plano.json";
const NUMEROS = { 0: ["zero"], 1: ["um", "uma"], 2: ["dois", "duas"], 3: ["tres"], 4: ["quatro"], 5: ["cinco"], 6: ["seis"], 7: ["sete"], 8: ["oito"], 9: ["nove"], 10: ["dez"] };
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const plano = JSON.parse(readFileSync(arquivo, "utf8"));
const palavras = plano.palavras?.length ? plano.palavras : existsSync("work/palavras.json") ? JSON.parse(readFileSync("work/palavras.json", "utf8")) : [];
const f = (v) => (v >= 0 ? "+" : "") + v.toFixed(2).replace(".", ",");

const formas = (w) => {
  const n = norm(w);
  const lista = new Set([n]);
  for (const [num, ext] of Object.entries(NUMEROS)) {
    if (n === num || ext.includes(n)) {
      lista.add(num);
      ext.forEach((e) => lista.add(e));
    }
  }
  return lista;
};
const VAZIAS = new Set(["o", "a", "os", "as", "um", "uma", "de", "do", "da", "dos", "das", "e", "no", "na", "em", "por", "pra", "para", "que", "se", "seu", "sua"]);
const primeira = (texto) => {
  const ws = String(texto ?? "").split(/\s+/).filter((w) => norm(w).length);
  return ws.find((w) => !VAZIAS.has(norm(w))) ?? ws[0] ?? "";
};
// a primeira palavra do texto, como foi dita (com artigo): "No carro…" → "No"
const literal = (texto) => String(texto ?? "").split(/\s+/).find((w) => norm(w).length) ?? "";

const linhas = [];
let ruins = 0;
let avisos = 0;
const conferir = (item, instante, esperadas) => {
  if (typeof instante !== "number") return;
  const aceitas = new Set(esperadas.flatMap((w) => [...formas(w)]).filter(Boolean));
  const candidatas = palavras.filter((p) => aceitas.has(norm(p.w)) && Math.abs(p.em - instante) <= 1.5);
  if (!candidatas.length) {
    avisos++;
    linhas.push([item, `"${esperadas.join("/")}"`, "-", "confira no quadro"]);
    return;
  }
  const p = candidatas.sort((a, b) => Math.abs(a.em - instante) - Math.abs(b.em - instante))[0];
  const d = instante - p.em;
  const ok = Math.abs(d) <= LIMITE + 1e-6;
  if (!ok) ruins++;
  linhas.push([item, `"${p.w}" ${p.em.toFixed(2)} s`, f(d), ok ? "ok" : "FORA"]);
};
const etiquetas = (nome, lista) => (lista ?? []).forEach((e, i) => conferir(`${nome} etiqueta ${i + 1}`, e.em, [primeira(e.texto)]));

for (const m of [...plano.momentos].sort((a, b) => a.de - b.de)) {
  const nome = `${m.tipo} ${m.de.toFixed(1)}`;
  switch (m.tipo) {
    case "gancho":
    case "abertura":
      conferir(`${nome} manchete`, m.em ?? m.de, [primeira(m.texto), literal(m.texto)]);
      if (m.icone && m.iconeEm !== undefined) conferir(`${nome} ícone ${m.icone}`, m.iconeEm, [m.icone]);
      etiquetas(nome, m.etiquetas);
      break;
    case "heroi":
      conferir(`${nome} produto`, m.em, [m.palavra ?? "?"]);
      if (m.titulo) conferir(`${nome} título`, m.tituloEm ?? m.em, [primeira(m.titulo)]);
      etiquetas(nome, m.etiquetas);
      break;
    case "prova":
      conferir(`${nome} foto`, m.em, [m.palavra ?? "?"]);
      conferir(`${nome} benefício`, m.textoEm ?? m.em, [primeira(m.texto), literal(m.texto)]);
      if (m.numero) conferir(`${nome} número`, m.numero.em, [String(m.numero.valor)]);
      etiquetas(nome, m.etiquetas);
      break;
    case "selo":
      conferir(`${nome}`, m.em, [primeira(m.texto)]);
      break;
    case "cta":
      conferir(`${nome} botão`, m.em ?? m.de, [primeira(m.texto)]);
      if (m.toqueEm !== undefined) conferir(`${nome} toque`, m.toqueEm, String(m.texto).split(/\s+/));
      if (m.titulo) conferir(`${nome} título`, m.tituloEm ?? m.de, [primeira(m.titulo)]);
      break;
    case "frase":
    case "pergunta":
      conferir(`${nome}`, m.em ?? m.de, [primeira(m.texto), literal(m.texto)]);
      (m.opcoes ?? []).forEach((o, i) => conferir(`${nome} opção ${i + 1}`, o.em, [primeira(o.texto)]));
      break;
    case "topicos":
    case "passos":
      m.itens.forEach((it, i) => conferir(`${nome} item ${i + 1}`, it.em, [primeira(it.texto)]));
      break;
    case "comparacao":
      m.lados.forEach((l, i) => conferir(`${nome} lado ${i + 1}`, l.em, [primeira(l.texto), primeira(l.rotulo)]));
      break;
    case "grafico":
      (m.dados ?? []).forEach((d) => conferir(`${nome} ${d.rotulo}`, d.em, [String(d.valor), primeira(d.rotulo)]));
      break;
    case "numero":
      conferir(`${nome}`, m.em, [String(m.valor)]);
      break;
    case "destaque":
      conferir(`${nome}`, m.em, [primeira(m.texto)]);
      break;
    case "definicao":
      conferir(`${nome} termo`, m.em, [primeira(m.termo)]);
      break;
  }
}
let maior = 0;
for (const l of linhas) if (l[2] !== "-") maior = Math.max(maior, Math.abs(Number(l[2].replace(",", "."))));
const w = (s, n) => String(s).padEnd(n);
console.log(`Timing de ${arquivo}\n`);
console.log(`${w("item", 34)}${w("palavra", 26)}${w("desvio", 9)}`);
for (const l of linhas) console.log(`${w(l[0], 34)}${w(l[1], 26)}${w(l[2], 9)}${l[3]}`);
console.log(`\nMaior desvio: ${maior.toFixed(2).replace(".", ",")} s (limite ${LIMITE.toFixed(2).replace(".", ",")} s)${avisos ? ` · ${avisos} item(ns) para conferir no quadro` : ""}`);
if (ruins) {
  console.log(`REPROVADO: ${ruins} entrada(s) fora da palavra. Use o "em" da palavra em src/plano.json → palavras.`);
  process.exit(1);
}
console.log("APROVADO.");
