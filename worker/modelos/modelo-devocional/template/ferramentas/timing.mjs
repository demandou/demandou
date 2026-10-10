// Gate de timing do Devocional: tudo que entra na página entra na palavra que o nomeia (±0,15 s).
//
//   node ferramentas/timing.mjs        tabela de desvios; sai com erro se algo passar de 0,15 s
//
// Confere, contra a fala (src/plano.json → palavras, já corrigidas; ou work/palavras.json):
//   versiculo → `chamadaEm` na 1ª palavra da chamada; `em` na 1ª palavra do texto; `destaqueEm` na
//               palavra que acende; cada parte da referência na palavra dela ("11" ↔ "onze");
//               `referenciaEm` / `obraEm` na 1ª palavra.
//   luz       → `em` na 1ª palavra da frase; `palavraEm` na palavra que acende.
//   blocos universais → o `em` de cada item/lado/dado/opção na 1ª palavra do texto dele.
//   desenhoEm → mostra a palavra mais perto (confira se é a palavra que o desenho mostra).
// Palavra que não foi dita igual (resumo, sinônimo) vira "confira no quadro" (aviso, não erro).
import { existsSync, readFileSync } from "node:fs";

const LIMITE = 0.15;
const NUMEROS = {
  0: ["zero"], 1: ["um", "uma", "primeiro"], 2: ["dois", "duas", "segundo"], 3: ["tres", "terceiro"], 4: ["quatro"], 5: ["cinco"], 6: ["seis"], 7: ["sete"], 8: ["oito"], 9: ["nove"], 10: ["dez"],
  11: ["onze"], 12: ["doze"], 13: ["treze"], 14: ["quatorze", "catorze"], 15: ["quinze"], 16: ["dezesseis"], 17: ["dezessete"], 18: ["dezoito"], 19: ["dezenove"], 20: ["vinte"],
  21: ["vinte"], 22: ["vinte"], 23: ["vinte"], 24: ["vinte"], 25: ["vinte"], 26: ["vinte"], 27: ["vinte"], 28: ["vinte"], 29: ["vinte"], 30: ["trinta"],
};
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const plano = JSON.parse(readFileSync("src/plano.json", "utf8"));
const palavras = plano.palavras?.length ? plano.palavras : existsSync("work/palavras.json") ? JSON.parse(readFileSync("work/palavras.json", "utf8")) : [];
const f = (v) => (v >= 0 ? "+" : "") + v.toFixed(2).replace(".", ",");

// formas aceitas de uma palavra esperada (número escrito ↔ por extenso)
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
// a primeira palavra que importa (pula artigo e preposição: "Os riscos" → "riscos")
const VAZIAS = new Set(["o", "a", "os", "as", "um", "uma", "de", "do", "da", "dos", "das", "e", "no", "na", "em", "por", "pra", "para", "que", "se", "seu", "sua"]);
const primeira = (texto) => {
  const ws = String(texto ?? "").split(/\s+/).filter((w) => norm(w).length);
  return ws.find((w) => !VAZIAS.has(norm(w))) ?? ws[0] ?? "";
};
const inicio = (texto) => String(texto ?? "").split(/\s+/).filter((w) => norm(w).length)[0] ?? "";

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
// desenho: a palavra mais perto (informativo: confira se é a palavra que ele mostra)
const perto = (item, instante) => {
  if (typeof instante !== "number" || !palavras.length) return;
  const p = [...palavras].sort((a, b) => Math.abs(a.em - instante) - Math.abs(b.em - instante))[0];
  const d = instante - p.em;
  const ok = Math.abs(d) <= LIMITE + 1e-6;
  if (!ok) ruins++;
  linhas.push([item, `"${p.w}" ${p.em.toFixed(2)} s`, f(d), ok ? "ok (é a palavra do desenho?)" : "FORA"]);
};

for (const m of [...plano.momentos].sort((a, b) => a.de - b.de)) {
  const nome = `${m.tipo} ${m.de.toFixed(1)}`;
  if (m.desenho) perto(`${nome} desenho ${m.desenho}`, m.desenhoEm ?? m.em ?? m.de);
  switch (m.tipo) {
    case "versiculo": {
      if (m.chamada) conferir(`${nome} chamada`, m.chamadaEm ?? m.de, [inicio(m.chamada)]);
      conferir(`${nome} texto`, m.em ?? m.de, [inicio(m.texto)]);
      if (m.destaqueEm !== undefined && m.destaque) conferir(`${nome} acende`, m.destaqueEm, [primeira(m.destaque)]);
      (m.referenciaPartes ?? []).forEach((p, i) => conferir(`${nome} referência ${i + 1}`, p.em, [primeira(p.texto.replace(/[:.,;]/g, " "))]));
      if (!m.referenciaPartes?.length && m.referencia && m.referenciaEm !== undefined) conferir(`${nome} referência`, m.referenciaEm, [primeira(m.referencia)]);
      if (m.obra && m.obraEm !== undefined) conferir(`${nome} obra`, m.obraEm, [primeira(m.obra)]);
      break;
    }
    case "luz":
      conferir(`${nome} frase`, m.em ?? m.de, [inicio(m.texto)]);
      conferir(`${nome} acende`, m.palavraEm, [primeira(m.palavra)]);
      break;
    case "abertura":
    case "frase":
    case "cta":
      conferir(`${nome}`, m.em ?? m.de, [inicio(m.texto)]);
      if (m.tipo === "frase" && m.risco && m.riscoEm !== undefined) conferir(`${nome} risco`, m.riscoEm, [primeira(m.risco)]);
      break;
    case "pergunta":
      conferir(`${nome}`, m.em ?? m.de, [inicio(m.texto)]);
      (m.opcoes ?? []).forEach((o, i) => conferir(`${nome} opção ${i + 1}`, o.em, [inicio(o.texto), primeira(o.texto)]));
      break;
    case "topicos":
    case "passos":
      m.itens.forEach((it, i) => conferir(`${nome} item ${i + 1}`, it.em, [inicio(it.texto), primeira(it.texto)]));
      break;
    case "comparacao":
      m.lados.forEach((l, i) => conferir(`${nome} lado ${i + 1}`, l.em, [inicio(l.texto), primeira(l.texto), primeira(l.rotulo)]));
      break;
    case "grafico":
      (m.dados ?? []).forEach((d) => conferir(`${nome} ${d.rotulo}`, d.em, [String(d.valor), primeira(d.rotulo)]));
      break;
    case "numero":
      conferir(`${nome}`, m.em, [String(m.valor)]);
      break;
    case "destaque":
      conferir(`${nome}`, m.em, [inicio(m.texto), primeira(m.texto)]);
      break;
    case "definicao":
      conferir(`${nome} termo`, m.em, [inicio(m.termo), primeira(m.termo)]);
      conferir(`${nome} significado`, m.significadoEm, [inicio(m.significado), primeira(m.significado)]);
      break;
  }
}
let maior = 0;
for (const l of linhas) if (l[2] !== "-") maior = Math.max(maior, Math.abs(Number(l[2].replace(",", "."))));
const w = (s, n) => String(s).padEnd(n);
console.log(`${w("item", 40)}${w("palavra", 26)}${w("desvio", 9)}`);
for (const l of linhas) console.log(`${w(l[0], 40)}${w(l[1], 26)}${w(l[2], 9)}${l[3]}`);
console.log(`\nMaior desvio: ${maior.toFixed(2).replace(".", ",")} s (limite ${LIMITE.toFixed(2).replace(".", ",")} s)${avisos ? ` · ${avisos} item(ns) para conferir no quadro` : ""}`);
if (ruins) {
  console.log(`REPROVADO: ${ruins} entrada(s) fora da palavra. Use o "em" da palavra em src/plano.json → palavras.`);
  process.exit(1);
}
console.log("APROVADO.");
