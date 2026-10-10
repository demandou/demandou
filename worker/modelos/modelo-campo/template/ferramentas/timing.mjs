// Gate de timing do Campo: cada coisa que entra no painel entra na palavra que a nomeia (±0,15 s).
//
//   node ferramentas/timing.mjs        tabela de desvios; sai com erro se algo passar de 0,15 s
//
// Confere, contra a fala (src/plano.json → palavras, já corrigidas; ou work/palavras.json):
//   talhao   → `em` na 1ª palavra do título; `contornoEm` numa palavra; cada `marcar[].em` na 1ª
//              palavra do rótulo (sem rótulo: na palavra mais perto).
//   cotacao  → `em` na 1ª palavra do rótulo; `sobeEm` numa palavra; `valorEm` no número dito;
//              `periodoEm` na 1ª palavra do período.
//   medidor  → `em` na 1ª palavra do título; `mudaEm` numa palavra; `fracaoEm` na 1ª palavra do
//              destaque (ou do texto); `textoEm` na 1ª palavra do texto.
//   previsao → `em` na 1ª palavra do texto; `chegaEm` na palavra do clima (chuva, sol…);
//              `quandoEm` na 1ª palavra do `quando`.
//   cta      → `em` na 1ª palavra da chamada; `material.em` na 1ª palavra do material.
//   blocos universais → o `em` de cada item/lado/dado na 1ª palavra do texto dele.
// Palavra que não foi dita igual (resumo, sinônimo) vira "confira no quadro" (aviso, não erro).
import { existsSync, readFileSync } from "node:fs";

const LIMITE = 0.15;
const NUMEROS = {
  0: ["zero"], 1: ["um", "uma"], 2: ["dois", "duas"], 3: ["tres"], 4: ["quatro"], 5: ["cinco"], 6: ["seis"], 7: ["sete"], 8: ["oito"], 9: ["nove"], 10: ["dez"],
  20: ["vinte"], 30: ["trinta"], 40: ["quarenta"], 50: ["cinquenta"], 60: ["sessenta"], 70: ["setenta"], 80: ["oitenta"], 90: ["noventa"], 100: ["cem", "cento"],
};
const CLIMA = { chuva: ["chuva", "chover", "chuvas"], sol: ["sol", "seca", "estiagem"], nuvem: ["nuvem", "nublado"], tempestade: ["tempestade", "temporal"], vento: ["vento", "ventania"], geada: ["geada", "frio"] };
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const plano = JSON.parse(readFileSync("src/plano.json", "utf8"));
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

const linhas = [];
let ruins = 0;
let avisos = 0;
// `esperadas` = null: basta cair no começo de alguma palavra
const conferir = (item, instante, esperadas) => {
  if (typeof instante !== "number") return;
  let candidatas;
  if (esperadas) {
    const aceitas = new Set(esperadas.flatMap((w) => [...formas(w)]).filter(Boolean));
    candidatas = palavras.filter((p) => aceitas.has(norm(p.w)) && Math.abs(p.em - instante) <= 1.5);
  } else candidatas = palavras.filter((p) => Math.abs(p.em - instante) <= 1.5);
  if (!candidatas.length) {
    avisos++;
    linhas.push([item, `"${(esperadas ?? ["?"]).join("/")}"`, "-", "confira no quadro"]);
    return;
  }
  const p = candidatas.sort((a, b) => Math.abs(a.em - instante) - Math.abs(b.em - instante))[0];
  const d = instante - p.em;
  const ok = Math.abs(d) <= LIMITE + 1e-6;
  if (!ok) ruins++;
  linhas.push([item, `"${p.w}" ${p.em.toFixed(2)} s`, f(d), ok ? "ok" : "FORA"]);
};

let maior = 0;
for (const m of [...plano.momentos].sort((a, b) => a.de - b.de)) {
  const nome = `${m.tipo} ${m.de.toFixed(1)}`;
  switch (m.tipo) {
    case "talhao":
      if (m.texto) conferir(`${nome} título`, m.em ?? m.de, [primeira(m.texto)]);
      conferir(`${nome} contornos`, m.contornoEm ?? m.em, null);
      (m.marcar ?? []).forEach((k, i) => conferir(`${nome} talhão ${i + 1}`, k.em, k.texto ? [primeira(k.texto)] : null));
      break;
    case "cotacao":
      conferir(`${nome} rótulo`, m.em, [primeira(m.rotulo)]);
      conferir(`${nome} gráfico anda`, m.sobeEm, null);
      if (m.valor !== undefined) conferir(`${nome} valor`, m.valorEm, [String(m.valor)]);
      if (m.periodo) conferir(`${nome} período`, m.periodoEm, [primeira(m.periodo)]);
      break;
    case "medidor":
      if (m.titulo) conferir(`${nome} título`, m.em, [primeira(m.titulo)]);
      conferir(`${nome} nível muda`, m.mudaEm, null);
      conferir(`${nome} nível dito`, m.fracaoEm, [primeira(m.destaque ?? m.texto)]);
      if (m.textoEm !== undefined) conferir(`${nome} texto`, m.textoEm, [primeira(m.texto)]);
      break;
    case "previsao":
      if (m.texto) conferir(`${nome} texto`, m.em ?? m.de, [primeira(m.texto)]);
      conferir(`${nome} chegada`, m.chegaEm, CLIMA[m.chegada] ?? null);
      if (m.quando) conferir(`${nome} quando`, m.quandoEm, [primeira(m.quando)]);
      break;
    case "abertura":
    case "frase":
    case "pergunta":
      conferir(`${nome}`, m.em ?? m.de, [primeira(m.texto)]);
      (m.opcoes ?? []).forEach((o, i) => conferir(`${nome} opção ${i + 1}`, o.em, [primeira(o.texto)]));
      break;
    case "cta":
      conferir(`${nome} chamada`, m.em ?? m.de, [primeira(m.texto)]);
      if (m.material) conferir(`${nome} material`, m.material.em, [primeira(m.material.texto)]);
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
      if (!m.dados?.length) conferir(`${nome} tendência`, m.tendenciaEm, null);
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
for (const l of linhas) if (l[2] !== "-") maior = Math.max(maior, Math.abs(Number(l[2].replace(",", "."))));
const w = (s, n) => String(s).padEnd(n);
console.log(`${w("item", 34)}${w("palavra", 26)}${w("desvio", 9)}`);
for (const l of linhas) console.log(`${w(l[0], 34)}${w(l[1], 26)}${w(l[2], 9)}${l[3]}`);
console.log(`\nMaior desvio: ${maior.toFixed(2).replace(".", ",")} s (limite ${LIMITE.toFixed(2).replace(".", ",")} s)${avisos ? ` · ${avisos} item(ns) para conferir no quadro` : ""}`);
if (ruins) {
  console.log(`REPROVADO: ${ruins} entrada(s) fora da palavra. Use o "em" da palavra em src/plano.json → palavras.`);
  process.exit(1);
}
console.log("APROVADO.");
