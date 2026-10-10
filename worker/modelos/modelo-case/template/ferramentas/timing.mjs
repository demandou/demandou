// Gate de timing do Case: cada peça do relatório entra na palavra que a nomeia (±0,15 s).
//
//   node ferramentas/timing.mjs        tabela de desvios; sai com erro se algo passar de 0,15 s
//
// Confere, contra a fala (src/plano.json → palavras, já corrigidas; ou work/palavras.json):
//   case      → antes: cada métrica (`em` no rótulo, `valorEm` no valor, `detalheEm` no detalhe,
//               `iconeEm` no nome do ícone); mudancas: `em` no título e cada item no texto dele;
//               prazo: `em` no texto ("60"); resultado: `em` no rótulo, `movimentoEm` no verbo
//               ("caiu", "subiu", "dobrou"…), `relacaoEm` na relação ("pela metade").
//   ficha     → como as métricas do antes.
//   depoimento→ `em` na palavra que anuncia (`palavra`, ou "mensagem", "depoimento", "print"…).
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
// a primeira palavra do texto e a primeira que importa (pula artigo, preposição e moeda)
const VAZIAS = new Set(["o", "a", "os", "as", "um", "uma", "de", "do", "da", "dos", "das", "e", "no", "na", "em", "por", "pra", "para", "que", "se", "seu", "sua", "pela", "pelo", "r", "us"]);
const primeiras = (texto) => {
  const ws = String(texto ?? "").split(/\s+/).filter((w) => norm(w).length);
  return [...new Set([ws[0], ws.find((w) => !VAZIAS.has(norm(w)))].filter(Boolean))];
};
const VERBOS = {
  cai: ["caiu", "cai", "cairam", "caindo", "baixou", "diminuiu", "reduziu", "despencou", "abaixou", "derrubou", "derrubamos", "reduzimos", "cortou", "cortamos", "perder", "perde", "perdeu"],
  sobe: ["subiu", "sobe", "subiram", "subindo", "aumentou", "dobrou", "triplicou", "cresceu", "multiplicou", "aumentamos", "dobramos", "triplicamos", "saltou", "pulou"],
};
const ANUNCIO = ["mensagem", "depoimento", "print", "olha", "avaliacao", "feedback", "recado", "escreveu", "mandou"];

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

// cabeça da ficha: o título (0 = gancho no quadro 0, não confere) e o carimbo
const cabecaDaFicha = (nome, a) => {
  if (!a?.titulo) return;
  if ((a.tituloEm ?? a.em) > 0.05) conferir(`${nome} título`, a.tituloEm ?? a.em, primeiras(a.titulo));
  conferir(`${nome} carimbo`, a.carimboEm ?? a.em, primeiras(a.titulo));
};
const metricas = (nome, lista = []) =>
  lista.forEach((x, i) => {
    conferir(`${nome} métrica ${i + 1} (rótulo)`, x.em, primeiras(x.rotulo));
    conferir(`${nome} métrica ${i + 1} (valor)`, x.valorEm, primeiras(x.valor));
    if (x.detalhe) conferir(`${nome} métrica ${i + 1} (detalhe)`, x.detalheEm, primeiras(x.detalhe));
    if (x.icone && x.iconeEm !== undefined) conferir(`${nome} métrica ${i + 1} (ícone)`, x.iconeEm, [x.icone]);
  });

let maior = 0;
for (const m of [...plano.momentos].sort((a, b) => a.de - b.de)) {
  const nome = `${m.tipo} ${m.de.toFixed(1)}`;
  switch (m.tipo) {
    case "case":
      if (m.antes) {
        cabecaDaFicha(`${nome} antes`, m.antes);
        metricas(`${nome} antes`, m.antes.metricas);
      }
      if (m.mudancas) {
        if (m.mudancas.titulo) conferir(`${nome} mudanças (título)`, m.mudancas.em, primeiras(m.mudancas.titulo));
        (m.mudancas.itens ?? []).forEach((it, i) => conferir(`${nome} mudança ${i + 1}`, it.em, primeiras(it.texto)));
      }
      if (m.prazo) conferir(`${nome} prazo`, m.prazo.em, primeiras(m.prazo.texto));
      if (m.resultado) {
        const r = m.resultado;
        conferir(`${nome} resultado (rótulo)`, r.em, primeiras(r.rotulo));
        conferir(`${nome} resultado (movimento)`, r.movimentoEm, VERBOS[r.direcao] ?? []);
        if (r.relacao) conferir(`${nome} resultado (relação)`, r.relacaoEm, primeiras(r.relacao));
      }
      break;
    case "ficha":
      cabecaDaFicha(nome, m);
      metricas(nome, m.metricas);
      break;
    case "depoimento":
      conferir(`${nome} (chamada)`, m.em, m.palavra ? [m.palavra] : ANUNCIO);
      break;
    case "pergunta":
      conferir(`${nome}`, m.em ?? m.de, primeiras(m.texto));
      (m.opcoes ?? []).forEach((o, i) => conferir(`${nome} opção ${i + 1}`, o.em, primeiras(o.texto)));
      break;
    case "abertura":
    case "frase":
      conferir(`${nome}`, m.em ?? m.de, primeiras(m.texto));
      break;
    case "cta":
      conferir(`${nome}`, m.em ?? m.de, primeiras(m.texto));
      if (m.destaque) conferir(`${nome} (palavra-chave)`, m.destaqueEm, primeiras(m.destaque));
      break;
    case "topicos":
    case "passos":
      m.itens.forEach((it, i) => conferir(`${nome} item ${i + 1}`, it.em, primeiras(it.texto)));
      break;
    case "comparacao":
      m.lados.forEach((l, i) => conferir(`${nome} lado ${i + 1}`, l.em, [...primeiras(l.texto), ...primeiras(l.rotulo)]));
      break;
    case "grafico":
      (m.dados ?? []).forEach((d) => conferir(`${nome} ${d.rotulo}`, d.em, [String(d.valor), ...primeiras(d.rotulo)]));
      break;
    case "numero":
      conferir(`${nome}`, m.em, [String(m.valor)]);
      break;
    case "destaque":
      conferir(`${nome}`, m.em, primeiras(m.texto));
      break;
    case "definicao":
      conferir(`${nome} termo`, m.em, primeiras(m.termo));
      break;
  }
}
for (const l of linhas) if (l[2] !== "-") maior = Math.max(maior, Math.abs(Number(l[2].replace(",", "."))));
const w = (s, n) => String(s).padEnd(n);
console.log(`${w("item", 44)}${w("palavra", 26)}${w("desvio", 9)}`);
for (const l of linhas) console.log(`${w(l[0], 44)}${w(l[1], 26)}${w(l[2], 9)}${l[3]}`);
console.log(`\nMaior desvio: ${maior.toFixed(2).replace(".", ",")} s (limite ${LIMITE.toFixed(2).replace(".", ",")} s)${avisos ? ` · ${avisos} item(ns) para conferir no quadro` : ""}`);
if (ruins) {
  console.log(`REPROVADO: ${ruins} entrada(s) fora da palavra. Use o "em" da palavra em src/plano.json → palavras.`);
  process.exit(1);
}
console.log("APROVADO.");
