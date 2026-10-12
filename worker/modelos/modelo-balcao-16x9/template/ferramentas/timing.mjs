// Gate de timing do Balcão: cada coisa que entra na vitrine entra na palavra que a nomeia (±0,15 s).
//
//   node ferramentas/timing.mjs        tabela de desvios; sai com erro se algo passar de 0,15 s
//
// Confere, contra a fala (src/plano.json → palavras, já corrigidas; ou work/palavras.json):
//   fachada   → `em` do letreiro na palavra do nome ("confeitaria").
//   vitrine   → cada produto no `em` da 1ª palavra do nome; o preço (`preco.em`) no número dito
//               ("doze" = 12); o `detalheEm` na palavra do detalhe ("cada").
//   combo     → `em` na 1ª palavra do texto ("Leva"); `valorEm` na 1ª palavra do valor ("paga").
//   mapa      → `em` na 1ª palavra da rua ("Rua"); `numeroEm` no número ("120" / "cento");
//               horário: `rotuloEm` no rótulo ("aberto"), `em` na hora dita ("20h" = "oito").
//   blocos universais → o `em` de cada item/lado/dado na 1ª palavra do texto dele.
// Palavra que não foi dita igual (resumo, sinônimo) vira "confira no quadro" (aviso, não erro).
import { existsSync, readFileSync } from "node:fs";

const LIMITE = 0.15;
const EXTENSO = {
  1: ["um", "uma"], 2: ["dois", "duas"], 3: ["tres"], 4: ["quatro"], 5: ["cinco"], 6: ["seis"], 7: ["sete"], 8: ["oito"], 9: ["nove"],
  10: ["dez"], 11: ["onze"], 12: ["doze"], 15: ["quinze"], 20: ["vinte"], 30: ["trinta"], 40: ["quarenta"], 50: ["cinquenta"], 100: ["cem", "cento"],
};
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const plano = JSON.parse(readFileSync("src/plano.json", "utf8"));
const palavras = plano.palavras?.length ? plano.palavras : existsSync("work/palavras.json") ? JSON.parse(readFileSync("work/palavras.json", "utf8")) : [];
const f = (v) => (v >= 0 ? "+" : "") + v.toFixed(2).replace(".", ",");

// formas aceitas de uma palavra esperada (número escrito ↔ por extenso; "20h" ↔ "oito"/"vinte";
// "120" ↔ "cento"; "R$ 12" ↔ "doze")
const formas = (w) => {
  const n = norm(w).replace(/^rs/, "");
  const lista = new Set([n]);
  const hora = n.match(/^(\d{1,2})h(\d{2})?$/);
  const bases = hora ? [hora[1], String(Number(hora[1]) - 12)] : [n];
  if (/^\d{3}$/.test(n)) bases.push(String(Math.floor(Number(n) / 100) * 100));
  for (const b of bases) {
    lista.add(b);
    (EXTENSO[b] ?? []).forEach((e) => lista.add(e));
  }
  for (const [num, ext] of Object.entries(EXTENSO)) if (ext.includes(n)) lista.add(num);
  return lista;
};
// a primeira palavra que importa (pula artigo, preposição e "R$")
const VAZIAS = new Set(["o", "a", "os", "as", "um", "uma", "de", "do", "da", "dos", "das", "e", "no", "na", "em", "por", "pra", "para", "que", "se", "seu", "sua", "r", "rs", "ate"]);
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
  const candidatas = palavras.filter((p) => [...formas(p.w)].some((x) => aceitas.has(x)) && Math.abs(p.em - instante) <= 1.5);
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

if (plano.fachada?.nome) conferir("fachada (letreiro)", plano.fachada.em ?? 0, [primeira(plano.fachada.nome)]);
const placa = (nome, pl) => {
  if (!pl) return;
  if (pl.rotulo) conferir(`${nome} placa: rótulo`, pl.rotuloEm ?? pl.em, [primeira(pl.rotulo)]);
  const ws = String(pl.texto).split(/\s+/).filter((w) => !VAZIAS.has(norm(w)));
  conferir(`${nome} placa: texto`, pl.em, ws.length ? ws : [pl.texto]);
};
let maior = 0;
for (const m of [...plano.momentos].sort((a, b) => a.de - b.de)) {
  const nome = `${m.tipo} ${m.de.toFixed(1)}`;
  switch (m.tipo) {
    case "vitrine":
      m.itens.forEach((it, i) => {
        conferir(`${nome} produto ${i + 1}`, it.em, [primeira(it.texto)]);
        if (it.preco) conferir(`${nome} preço ${i + 1}`, it.precoEm ?? it.em + 0.4, String(it.preco).split(/\s+/));
      });
      if (m.preco) {
        conferir(`${nome} preço`, m.preco.em, String(m.preco.texto).split(/\s+/).filter((w) => !VAZIAS.has(norm(w))));
        if (m.preco.detalhe) conferir(`${nome} preço: detalhe`, m.preco.detalheEm, [primeira(m.preco.detalhe)]);
      }
      break;
    case "combo":
      conferir(`${nome} texto`, m.em, [primeira(m.texto)]);
      if (m.valor) conferir(`${nome} carimbo`, m.valorEm, [primeira(m.valor)]);
      break;
    case "mapa":
      conferir(`${nome} rua`, m.em, [String(m.rua).split(/\s+/)[0]]);
      if (m.numero) conferir(`${nome} número (pino)`, m.numeroEm, [m.numero]);
      placa(nome, m.horario);
      break;
    case "abertura":
      conferir(`${nome}`, m.em ?? m.de, [primeira(m.texto)]);
      placa(nome, m.placa);
      break;
    case "frase":
    case "cta":
    case "pergunta":
      conferir(`${nome}`, m.em ?? m.de, [primeira(m.texto)]);
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
