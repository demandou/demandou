// Confere se o plano é uma edição de verdade, e não "legenda e mais nada".
//
// Uso:  node scripts/conferir.mjs            (de dentro da pasta do projeto)
//       node scripts/conferir.mjs --mapa     (também lista cada momento com o trecho falado)
//
// O render.mjs roda esta conferência antes de renderizar e para se o plano for reprovado.
// Os limites vêm de `modelo.json` → "conferir" (cada modelo pode ajustar) ou dos padrões abaixo.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PADRAO = {
  // fração do vídeo coberta por momentos (o resto é só pessoa + legenda)
  cobertura: 0.7,
  // maior trecho seguido só com legenda, em segundos
  vao: 3.5,
  // maior tempo sem nada novo dentro de um momento (item que entra, palavra do título, troca)
  parado: 4.5,
  // no mínimo um momento a cada N segundos de vídeo
  segundosPorMomento: 8,
};

// Tipos que se montam palavra por palavra na fala: cada palavra conta como novidade na tela.
const PALAVRA_POR_PALAVRA = ["abertura", "gancho", "frase", "cta", "citacao", "pergunta", "manchete", "titulo", "fala", "letreiro", "cartaz"];

const ler = (arquivo) => JSON.parse(readFileSync(arquivo, "utf8"));
const s = (t) => `${t.toFixed(1).replace(".", ",")} s`;

// todos os instantes "em"/"…Em" dentro de um momento (itens, etapas, opções, grifos…)
const instantes = (obj, de, ate, saida = []) => {
  if (Array.isArray(obj)) obj.forEach((v) => instantes(v, de, ate, saida));
  else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if ((k === "em" || /Em$/.test(k)) && typeof v === "number") {
        if (v >= de - 0.5 && v <= ate + 0.5) saida.push(v);
      } else if (v && typeof v === "object") instantes(v, de, ate, saida);
    }
  }
  return saida;
};

export const tiposDoModelo = () => {
  if (!existsSync("src/plano.ts")) return null;
  const fonte = readFileSync("src/plano.ts", "utf8");
  const achados = [...fonte.matchAll(/tipo\s*:\s*"([a-zA-Z0-9_-]+)"/g)].map((m) => m[1]);
  return achados.length ? new Set(achados) : null;
};

const trecho = (palavras, de, ate) =>
  palavras
    .filter((p) => p.em >= de - 0.05 && p.em < ate)
    .map((p) => p.w)
    .join(" ");

// Os 11 blocos universais (motor/BLOCOS.md) têm os mesmos campos em todos os modelos.
const num = (v) => typeof v === "number" && Number.isFinite(v);
const txt = (v) => typeof v === "string" && v.trim().length > 0;
const camposUniversais = (m) => {
  const itens = (lista, min, max) =>
    !Array.isArray(lista) || lista.length < min || lista.length > max
      ? `precisa de ${min} a ${max} itens`
      : lista.some((i) => !txt(i.texto) || !num(i.em))
        ? "todo item precisa de \"texto\" e \"em\""
        : null;
  switch (m.tipo) {
    case "abertura":
    case "frase":
      return txt(m.texto) ? null : "falta \"texto\"";
    case "pergunta":
      if (!txt(m.texto)) return "falta \"texto\"";
      return m.opcoes && (m.opcoes.length < 2 || m.opcoes.length > 4 || m.opcoes.some((o) => !txt(o.texto) || !num(o.em)))
        ? "\"opcoes\" precisa de 2 a 4 itens, cada um com \"texto\" e \"em\""
        : null;
    case "cta":
      if (!txt(m.texto)) return "falta \"texto\"";
      return m.icone && !["salvar", "seguir", "comentar", "link"].includes(m.icone) ? "\"icone\" tem que ser salvar, seguir, comentar ou link" : null;
    case "topicos":
    case "passos":
      return itens(m.itens, 2, 5);
    case "numero":
      return num(m.valor) && num(m.em) && txt(m.rotulo) ? null : "precisa de \"valor\" (número), \"em\" e \"rotulo\"";
    case "comparacao":
      return Array.isArray(m.lados) && m.lados.length === 2 && m.lados.every((l) => txt(l.rotulo) && txt(l.texto) && num(l.em))
        ? null
        : "precisa de \"lados\" com 2 itens, cada um com \"rotulo\", \"texto\" e \"em\"";
    case "grafico":
      if (!["barras", "linha", "pizza"].includes(m.forma)) return "\"forma\" tem que ser barras, linha ou pizza";
      if (m.dados?.length) {
        if (m.dados.length < 2 || m.dados.length > 6) return "\"dados\" precisa de 2 a 6 números ditos (com 1 só, use o bloco numero)";
        return m.dados.some((d) => !txt(d.rotulo) || !num(d.valor) || !num(d.em)) ? "todo dado precisa de \"rotulo\", \"valor\" e \"em\"" : null;
      }
      return m.tendencia ? (m.ilustrativo ? null : "gráfico sem números ditos precisa de \"ilustrativo\": true") : "precisa de \"dados\" (números ditos) ou de \"tendencia\"";
    case "destaque":
      return txt(m.texto) && num(m.em) ? null : "precisa de \"texto\" e \"em\"";
    case "definicao":
      return txt(m.termo) && num(m.em) && txt(m.significado) && num(m.significadoEm) ? null : "precisa de \"termo\", \"em\", \"significado\" e \"significadoEm\"";
    default:
      return null;
  }
};

export const conferirPlano = (plano, modelo = {}, tiposValidos = null) => {
  const lim = { ...PADRAO, ...(modelo.conferir ?? {}) };
  const palavraPorPalavra = new Set([...(modelo.palavraPorPalavra ?? []), ...PALAVRA_POR_PALAVRA]);
  const dur = plano.duracao;
  const palavras = plano.palavras ?? [];
  const momentos = [...(plano.momentos ?? [])].sort((a, b) => a.de - b.de);
  const erros = [];
  const avisos = [];

  // 1. tipos que o modelo conhece
  if (tiposValidos) {
    for (const m of momentos) {
      if (!tiposValidos.has(m.tipo)) erros.push(`O momento em ${s(m.de)} usa o tipo "${m.tipo}", que este modelo não tem (veja references/plano.md).`);
    }
  }
  for (const m of momentos) {
    if (!(m.ate > m.de)) erros.push(`O momento "${m.tipo}" em ${s(m.de)} termina antes de começar.`);
    const falta = camposUniversais(m);
    if (falta) erros.push(`O momento "${m.tipo}" em ${s(m.de)}: ${falta} (veja references/plano.md).`);
  }

  // 2. cobertura e trechos só com legenda
  const blocos = momentos.map((m) => [Math.max(0, m.de), Math.min(dur, m.ate)]).filter(([a, b]) => b > a);
  const uniao = [];
  for (const [a, b] of blocos) {
    const u = uniao[uniao.length - 1];
    if (u && a <= u[1] + 0.05) u[1] = Math.max(u[1], b);
    else uniao.push([a, b]);
  }
  const coberto = uniao.reduce((soma, [a, b]) => soma + (b - a), 0);
  const cobertura = dur > 0 ? coberto / dur : 0;
  const vaos = [];
  let cursor = 0;
  for (const [a, b] of uniao) {
    if (a - cursor > 0.05) vaos.push([cursor, a]);
    cursor = Math.max(cursor, b);
  }
  if (dur - cursor > 0.05) vaos.push([cursor, dur]);
  const vaosLongos = vaos.filter(([a, b]) => b - a > lim.vao);

  if (cobertura < lim.cobertura) {
    erros.push(`Só ${Math.round(cobertura * 100)}% do vídeo tem momento na tela (mínimo ${Math.round(lim.cobertura * 100)}%). Transforme mais trechos da fala em blocos.`);
  }
  for (const [a, b] of vaosLongos) {
    const fala = trecho(palavras, a, b);
    erros.push(`De ${s(a)} a ${s(b)} (${s(b - a)}) só tem a pessoa e a legenda: "${fala.slice(0, 140)}${fala.length > 140 ? "…" : ""}". Escolha um bloco para esse trecho (references/adaptar.md, passo A).`);
  }

  // 3. quantidade e variedade
  const minimo = Math.max(2, Math.ceil(dur / lim.segundosPorMomento));
  if (momentos.length < minimo) erros.push(`${momentos.length} momentos para ${s(dur)} de vídeo; o mínimo é ${minimo} (um a cada ${lim.segundosPorMomento} s).`);
  const tipos = new Set(momentos.map((m) => m.tipo));
  const variedade = dur > 40 ? 4 : dur > 20 ? 3 : 2;
  if (tipos.size < variedade) erros.push(`Só ${tipos.size} tipo(s) de bloco (${[...tipos].join(", ")}); use pelo menos ${variedade} diferentes para o vídeo não ficar repetitivo.`);
  for (let i = 2; i < momentos.length; i++) {
    if (momentos[i].tipo === momentos[i - 1].tipo && momentos[i].tipo === momentos[i - 2].tipo) {
      avisos.push(`Três "${momentos[i].tipo}" seguidos (a partir de ${s(momentos[i - 2].de)}). Varie, se a fala permitir.`);
    }
  }

  // 4. a assinatura do modelo aparece
  const assinatura = modelo.blocos?.assinatura ?? [];
  if (assinatura.length && dur > 15 && !momentos.some((m) => assinatura.includes(m.tipo))) {
    erros.push(`A assinatura do modelo (${assinatura.join(" ou ")}) não aparece. Ela é o que faz o vídeo ter a cara deste modelo: use-a pelo menos uma vez, de forma metafórica se o assunto for outro (veja "A assinatura em qualquer assunto" no SKILL.md).`);
  }

  // 4b. o estilo inteiro, não só um pedaço: efeitos próprios do modelo (além dos blocos universais)
  if (tiposValidos && dur > 20) {
    const UNIVERSAIS = new Set(["abertura", "topicos", "passos", "numero", "comparacao", "grafico", "destaque", "definicao", "frase", "pergunta", "cta", "gancho", "capa", "titulo"]);
    const proprios = [...new Set([...[...tiposValidos].filter((t) => !UNIVERSAIS.has(t)), ...assinatura])];
    const usados = new Set(momentos.map((m) => m.tipo).filter((t) => proprios.includes(t)));
    const minimo = Math.min(2, proprios.length);
    if (usados.size < minimo) {
      erros.push(`Só ${usados.size} efeito(s) próprio(s) do modelo; use pelo menos ${minimo} diferentes para o vídeo ter o estilo inteiro, não só um pedaço. Os efeitos deste modelo: ${proprios.join(", ")}. Veja como o exemplo usa cada um em references/exemplo/quadros.jpg e plano-comentado.md.`);
    }
  }

  // 5. nada parado dentro de um momento
  for (const m of momentos) {
    const marcas = [m.de, m.ate, ...instantes(m, m.de, m.ate)];
    if (palavraPorPalavra.has(m.tipo)) marcas.push(...palavras.filter((p) => p.em >= m.de && p.em < m.ate).map((p) => p.em));
    marcas.sort((a, b) => a - b);
    let maior = 0;
    let onde = m.de;
    for (let i = 1; i < marcas.length; i++) {
      if (marcas[i] - marcas[i - 1] > maior) {
        maior = marcas[i] - marcas[i - 1];
        onde = marcas[i - 1];
      }
    }
    if (maior > lim.parado) {
      erros.push(`O momento "${m.tipo}" (${s(m.de)}–${s(m.ate)}) fica ${s(maior)} sem nada novo a partir de ${s(onde)}. Divida em dois momentos ou acrescente itens com "em" nas palavras ditas.`);
    }
  }

  // 6. o que entra na tela entra quando é dito
  const inicios = palavras.map((p) => p.em);
  let fora = 0;
  const exemplos = [];
  for (const m of momentos) {
    for (const t of instantes(m, m.de, m.ate)) {
      const perto = inicios.some((w) => Math.abs(w - t) <= 0.35);
      if (!perto) {
        fora++;
        if (exemplos.length < 3) exemplos.push(`${m.tipo} ${s(t)}`);
      }
    }
  }
  if (fora) avisos.push(`${fora} instante(s) "em" não caem no começo de nenhuma palavra (ex.: ${exemplos.join("; ")}). Use o "em" da palavra que nomeia o item em work/palavras.json.`);

  return { ok: erros.length === 0, erros, avisos, cobertura, vaos, momentos: momentos.length, tipos: [...tipos], minimo };
};

const principal = () => {
  if (!existsSync("src/plano.json")) {
    console.error("Rode de dentro da pasta do projeto (onde está src/plano.json).");
    process.exit(2);
  }
  const plano = ler("src/plano.json");
  const modelo = existsSync("modelo.json") ? ler("modelo.json") : {};
  const r = conferirPlano(plano, modelo, tiposDoModelo());
  console.log(`Conferência do plano (${s(plano.duracao)}):`);
  console.log(`  momentos: ${r.momentos} (mínimo ${r.minimo}) · tipos: ${r.tipos.join(", ") || "nenhum"}`);
  console.log(`  cobertura: ${Math.round(r.cobertura * 100)}% · maior trecho só com legenda: ${s(Math.max(0, ...r.vaos.map(([a, b]) => b - a)))}`);
  if (process.argv.includes("--mapa")) {
    console.log("\nMapa:");
    for (const m of [...plano.momentos].sort((a, b) => a.de - b.de)) {
      console.log(`  ${s(m.de).padStart(7)}–${s(m.ate).padEnd(7)} ${m.tipo.padEnd(12)} "${trecho(plano.palavras ?? [], m.de, m.ate).slice(0, 90)}"`);
    }
  }
  for (const a of r.avisos) console.log(`  aviso: ${a}`);
  if (r.ok) {
    console.log("\nAPROVADO.");
    return;
  }
  console.log("\nREPROVADO. Corrija o plano antes de renderizar:");
  r.erros.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  process.exitCode = 1;
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) principal();
