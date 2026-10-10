// Gate de timing do Quiz: cada coisa que entra no painel entra na palavra que a nomeia (±0,15 s).
//
//   node ferramentas/timing.mjs        tabela de desvios; sai com erro se algo passar de 0,15 s
//
// Confere, contra a fala (src/plano.json → palavras, já corrigidas; ou work/palavras.json):
//   quiz      → `em` na 1ª palavra da pergunta; cada alternativa: `em` na LETRA ("A", "B"…) e
//               `textoEm` na 1ª palavra dela; cada número da `contagem` no número dito; `revelaEm`
//               numa palavra da alternativa certa.
//   fato      → `em` na 1ª palavra do texto; `destaqueEm` na 1ª palavra do destaque.
//   revelacao → `revelaEm` numa palavra da resposta; contagem como no quiz.
//   blocos universais → o `em` de cada item/lado/dado na 1ª palavra do texto dele.
// Palavra que não foi dita igual (resumo, sinônimo) vira "confira no quadro" (aviso, não erro).
import { existsSync, readFileSync } from "node:fs";

const LIMITE = 0.15;
const NUMEROS = { 0: ["zero"], 1: ["um", "uma"], 2: ["dois", "duas"], 3: ["tres"], 4: ["quatro"], 5: ["cinco"], 6: ["seis"], 7: ["sete"], 8: ["oito"], 9: ["nove"], 10: ["dez"] };
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

const LETRAS = ["A", "B", "C", "D"];
let maior = 0;
for (const m of [...plano.momentos].sort((a, b) => a.de - b.de)) {
  const nome = `${m.tipo} ${m.de.toFixed(1)}`;
  switch (m.tipo) {
    case "quiz":
    case "pergunta":
      conferir(`${nome} pergunta`, m.em ?? m.de, [primeira(m.texto)]);
      (m.opcoes ?? []).forEach((o, i) => {
        const letra = o.letra ?? (m.modo === "vf" ? null : LETRAS[i]);
        if (letra && o.textoEm !== undefined) conferir(`${nome} opção ${letra} (letra)`, o.em, [letra]);
        conferir(`${nome} opção ${letra ?? i + 1} (nome)`, o.textoEm ?? o.em, [primeira(o.texto)]);
      });
      (m.contagem ?? []).forEach((c) => conferir(`${nome} contagem ${c.numero}`, c.em, [String(c.numero)]));
      if (m.tipo === "quiz") conferir(`${nome} revelação`, m.revelaEm, String(m.opcoes[m.certa]?.texto ?? "").split(/\s+/));
      break;
    case "revelacao":
      if (m.texto) conferir(`${nome} provocação`, m.em ?? m.de, [primeira(m.texto)]);
      (m.contagem ?? []).forEach((c) => conferir(`${nome} contagem ${c.numero}`, c.em, [String(c.numero)]));
      conferir(`${nome} revelação`, m.revelaEm, String(m.resposta).split(/\s+/));
      break;
    case "fato": {
      // logo depois de um quiz, o cartão do fato só aparece quando a faixa da resposta assenta
      const quiz = plano.momentos.find((q) => q.tipo === "quiz" && Math.abs(q.ate - m.de) <= 0.25);
      const assenta = quiz ? Math.max(quiz.revelaEm + 0.25, m.de - 0.26) + 0.36 : -Infinity;
      conferir(`${nome} texto${quiz ? " (aparece após a faixa)" : ""}`, Math.max(m.em ?? m.de, assenta), [primeira(m.texto)]);
      if (m.destaque) conferir(`${nome} destaque`, m.destaqueEm, [primeira(m.destaque)]);
      break;
    }
    case "abertura":
    case "frase":
    case "cta":
      conferir(`${nome}`, m.em ?? m.de, [primeira(m.texto)]);
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
