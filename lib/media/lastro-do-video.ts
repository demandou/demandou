import { numerosDoTexto } from "@/lib/media/numeros-falados";
import { LINHA_DO_ELO } from "@/lib/media/elo-da-campanha";
import { dadoDoNumero, dadosComFonte, rodapeDasFontes, type DadoDePesquisa, type FonteDoNumero, type LastroDaArte } from "@/lib/media/dados-da-arte";

/**
 * O LASTRO DOS NÚMEROS E DAS FONTES NAS PEÇAS DO VÍDEO (08/10/2026).
 *
 * Regra do Bruno: "não pode inventar nada, nem fontes, nem dados". Todo
 * número de um texto tem que vir da transcrição, da pesquisa com fonte do
 * Roberto ou do material do cliente; toda fonte citada tem que existir na
 * pesquisa (ou na fala).
 *
 * A campanha de texto já mede isso por código (`afirmacoesSemLastro`, em
 * lib/pipeline/executar.ts) contra a pesquisa bruta. A semana do vídeo
 * (lib/media/pecas-da-semana.ts) só tinha a regra no prompt: "nenhum dado que
 * não esteja na transcrição ou no briefing". Prompt não é garantia; isto é a
 * conferência entre o redator e o banco, do mesmo jeito:
 *
 *   - NÚMERO: cada número que AFIRMA algo (decimal, 100 ou mais, dinheiro,
 *     porcentagem, "vezes", ou número numa frase de pesquisa, estudo, dado)
 *     tem que aparecer no lastro, por algarismo ou por extenso (a fala vem
 *     escrita como se fala: "vinte e três vezes"). Contagem pequena de uma
 *     instrução ("3 passos") fica, como na campanha;
 *   - FONTE: o nome depois de "segundo", "de acordo com", "pesquisa da",
 *     "dado da", "citado em" ou antes de "apontou", "mostrou", "revelou" tem
 *     que aparecer no lastro.
 *
 * A frase que não passa sai do texto (quem tira é quem chama, com o aviso no
 * log da Vera). Preferimos um post com menos números a um número inventado em
 * nome do cliente. Puro.
 */

const semAcento = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const comparavel = (t: string) => semAcento(t).toLowerCase();

/** O lastro de uma peça do vídeo: a fala, o briefing do Roberto e o material do cliente, num texto só. */
export function lastroDoVideo(p: { transcricao?: string | null; radar?: string | null; material?: Array<string | null | undefined> }): string {
  return [p.transcricao ?? "", p.radar ?? "", ...(p.material ?? []).map((m) => m ?? "")].filter(Boolean).join("\n");
}

const MARCA_DE_TWEET = /^\d+[/)]\s+/;
const ABRE_BLOCO_DE_LINKS = /^(?:Links|Minhas redes):\s*$/;

/** As frases do texto que a conferência olha (fora o bloco de links e as chamadas do elo). */
function frasesConferiveis(texto: string): string[] {
  const frases: string[] = [];
  let noBloco = false;
  for (const linha of texto.split("\n")) {
    const l = linha.trim();
    if (!l) {
      noBloco = false;
      continue;
    }
    if (ABRE_BLOCO_DE_LINKS.test(l)) noBloco = true;
    if (noBloco || LINHA_DO_ELO.test(l)) continue;
    const corpo = l.replace(MARCA_DE_TWEET, "");
    for (const f of corpo.split(/(?<=[.!?…])\s+/)) if (f.trim()) frases.push(f.trim());
  }
  return frases;
}

const FRASE_DE_PESQUISA =
  /pesquisa|estudo|segundo|de acordo|conforme|relat[óo]rio|levantamento|\bdados?\b|m[ée]dia|taxa|cresc|instituto|universidade|ranking|apont|revel|indic|estimativa/i;

/** O número afirma algo sobre o mundo (precisa de lastro) ou é contagem de instrução? */
function afirma(numero: string, frase: string): boolean {
  if (numero.includes(".")) return true;
  if (Number(numero) >= 100) return true;
  const n = numero.replace(".", "\\.");
  if (new RegExp(`(?:R\\$|US\\$|€)\\s*${n}|${n}\\s*(?:%|por cento|mil\\b|milh|bilh|x\\b|vezes)`, "i").test(frase)) return true;
  return FRASE_DE_PESQUISA.test(frase);
}

/** O que tem número mas não é dado: ano, hora, data, referência bíblica ("João 3:16"), numeração. */
function semNumerosQueNaoSaoDado(frase: string): string {
  return frase
    .replace(/(?:[1-3]\s?)?\p{Lu}\p{Ll}+\.?\s+\d{1,3}[:.,]\d{1,3}(?:\s?[-\u2013]\s?\d{1,3})?/gu, " ")
    .replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g, " ")
    .replace(/\b(?:janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*(?:\/|de\s+)?\s*(?:19|20)\d{2}\b/gi, " ")
    .replace(/\b(?:19|20)\d{2}\b/g, " ")
    .replace(/\b\d{1,2}\s*h(?:\d{2})?\b/gi, " ")
    .replace(/\b\d{1,2}:\d{2}\b/g, " ");
}

/**
 * As frases com número que afirma algo e que não está no lastro. Puro.
 * O lastro é lido por algarismo e por extenso.
 */
export function frasesComNumeroSemLastro(texto: string, lastro: string): string[] {
  const doLastro = new Set(numerosDoTexto(lastro));
  const saida: string[] = [];
  for (const frase of frasesConferiveis(texto)) {
    const limpa = semNumerosQueNaoSaoDado(frase);
    const suspeitos = numerosDoTexto(limpa).filter((n) => afirma(n, limpa) && !doLastro.has(n));
    if (suspeitos.length) saida.push(frase);
  }
  return saida;
}

/** Palavra de nome: começa com maiúscula, é um @ ou tem maiúscula no meio ("iFood"). */
function ehNomeProprio(w: string): boolean {
  return /^\p{Lu}/u.test(w) || /^@[\w.]{2,}/.test(w) || /^\p{Ll}+\p{Lu}/u.test(w);
}

/** As palavras de um nome que a conferência procura no lastro. */
function palavrasDoNome(nome: string): string[] {
  return nome
    .split(/[\s,;()/]+/)
    .filter(ehNomeProprio)
    .map((w) => comparavel(w.replace(/[^\p{L}\p{N}&]/gu, "")))
    .filter((w) => w.length >= 3 && !NAO_E_FONTE.has(w));
}

/** Palavras com maiúscula que não são nome de fonte. */
const NAO_E_FONTE = new Set(
  ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro", "voce", "eu", "ele", "ela", "isso", "esse", "essa", "este", "esta", "brasil", "segundo"].map(comparavel)
);

const NOME = "((?:\\p{Lu}[\\p{L}\\p{N}&'.-]*)(?:\\s+(?:d[aoe]s?\\s+|e\\s+|&\\s+)?(?:\\p{Lu}[\\p{L}\\p{N}&'.-]*)){0,4})";
const DEPOIS_DE = new RegExp(
  `(?:segundo|de acordo com|conforme|citad[oa]s?\\s+(?:em|por|pel[oa]s?)|publicad[oa]s?\\s+(?:em|por|pel[oa]s?)|divulgad[oa]s?\\s+(?:em|por|pel[oa]s?)|(?:pesquisa|estudo|levantamento|relat[óo]rio|dados?|an[áa]lise|ranking|censo|report)\\s+(?:d[aoe]s?\\s+)?)\\s*(?:(?:a|o|as|os)\\s+)?${NOME}`,
  "giu"
);
const ANTES_DE = new RegExp(
  `(?:^|[\\s(,;:])(?:[Aa]s?|[Oo]s?)\\s+${NOME}\\s+(?:apontou|aponta|mostrou|mostra|revelou|revela|indica|indicou|afirma|afirmou|estima|estimou|divulgou|publicou|concluiu|descobriu|constatou)`,
  "gu"
);

/** Os nomes de fonte que uma frase cita. Puro, exportado para o teste. */
export function fontesCitadas(frase: string): string[] {
  const nomes: string[] = [];
  for (const re of [DEPOIS_DE, ANTES_DE]) {
    re.lastIndex = 0;
    for (const m of frase.matchAll(re)) {
      // Com a bandeira i, o padrão pega palavra minúscula também ("pesquisa
      // Sprout Social"): o nome começa na primeira palavra com maiúscula.
      const palavras = (m[1] ?? "").trim().replace(/[.,;:]+$/, "").split(/\s+/);
      const i = palavras.findIndex(ehNomeProprio);
      if (i >= 0) nomes.push(palavras.slice(i).join(" "));
    }
  }
  return [...new Set(nomes)];
}

/**
 * As frases que citam uma fonte que não existe no lastro. Cada palavra do
 * nome (com maiúscula e 3 letras ou mais) tem que aparecer no lastro. Puro.
 */
export function frasesComFonteSemLastro(texto: string, lastro: string): string[] {
  const base = comparavel(lastro);
  const saida: string[] = [];
  for (const frase of frasesConferiveis(texto)) {
    const faltou = fontesCitadas(frase).some((nome) => {
      const conferir = palavrasDoNome(nome);
      return conferir.length > 0 && conferir.some((w) => !base.includes(w));
    });
    if (faltou) saida.push(frase);
  }
  return saida;
}

/** Os números de um valor que precisam de lastro (sem ano, data e hora). */
function numerosQueAfirmam(valor: string): string[] {
  return numerosDoTexto(semNumerosQueNaoSaoDado(valor));
}

/**
 * O INFOGRÁFICO SÓ COM NÚMERO QUE TEM LASTRO (08/10). O conteúdo do
 * infográfico é extraído por outro modelo a partir do briefing e da legenda, e
 * vira número grande desenhado na arte: o destaque, o número de cada cartão e
 * os do rodapé que não aparecem no lastro saem antes do desenho. O texto dos
 * cartões fica (a legenda que o alimentou já passou pela conferência). Puro.
 */
export function infograficoComLastro<
  C extends { sections?: Array<{ heading: string; body: string; stat?: string }>; highlight?: { value: string; label: string }; keyNumbers?: Array<{ value: string; label: string }> },
>(c: C, lastro: string): { conteudo: C; tirados: string[] } {
  const doLastro = new Set(numerosDoTexto(lastro));
  const tem = (valor: string | undefined | null) => {
    const ns = numerosQueAfirmam(valor ?? "");
    return ns.every((n) => doLastro.has(n));
  };
  const tirados: string[] = [];
  const conteudo = { ...c };
  if (c.highlight && !tem(c.highlight.value)) {
    tirados.push(`destaque ${c.highlight.value}`);
    delete conteudo.highlight;
  }
  if (c.sections) {
    conteudo.sections = c.sections.map((s) => {
      if (!s.stat || tem(s.stat)) return s;
      tirados.push(`cartão ${s.stat}`);
      const semStat = { ...s };
      delete semStat.stat;
      return semStat;
    });
  }
  if (c.keyNumbers) {
    conteudo.keyNumbers = c.keyNumbers.filter((n) => {
      if (tem(n.value)) return true;
      tirados.push(`rodapé ${n.value}`);
      return false;
    });
  }
  return { conteudo, tirados };
}

/**
 * O LASTRO DA ARTE (11/10, revisto na mesma noite pelo Bruno): "Números das
 * artes podem usar pesquisa, desde que não seja inventado, e tenha fonte
 * rastreável. O mais importante é ter relação com o tema do vídeo." O lastro
 * é a fala e o material do cliente (texto) e os dados da pesquisa do Roberto
 * que têm fonte rastreável E que o JEV disse que complementam o tema
 * (lib/media/dados-da-arte.ts e lib/squad/coerencia-da-arte.ts). O teste de
 * ponta a ponta de 11/10 desenhou "40% redução amarguras nos relacionamentos"
 * num vídeo sobre produtividade bíblica: com fonte, mas fora do tema, não
 * entra; sem fonte, não entra; inventado, nunca. Puro.
 */
export function lastroDaArte(p: { transcricao?: string | null; material?: Array<string | null | undefined>; dados?: DadoDePesquisa[] | null }): LastroDaArte {
  return { texto: lastroDoVideo({ transcricao: p.transcricao, radar: null, material: p.material }), dados: dadosComFonte(p.dados ?? []) };
}

/** O lastro de uma arte já gravada: a fala e as fontes que o post guardou em `fontesDosNumeros`. Puro. */
export function lastroComAsFontesDoPost(p: { transcricao?: string | null; material?: Array<string | null | undefined>; fontes?: FonteDoNumero[] | null }): LastroDaArte {
  const dados = (p.fontes ?? []).map((f) => ({ valor: f.numero, oQueMede: "", fonte: f.fonte, url: f.url ?? null }));
  return lastroDaArte({ transcricao: p.transcricao, material: p.material, dados });
}

/** As fontes gravadas num metadata de post (`fontesDosNumeros`), válidas. Puro. */
export function fontesDoPost(meta: unknown): FonteDoNumero[] {
  const l = (meta && typeof meta === "object" ? (meta as { fontesDosNumeros?: unknown }).fontesDosNumeros : null) as unknown;
  if (!Array.isArray(l)) return [];
  return l
    .filter((f): f is FonteDoNumero => Boolean(f && typeof f === "object" && typeof (f as FonteDoNumero).numero === "string" && typeof (f as FonteDoNumero).fonte === "string"))
    .map((f) => ({ numero: f.numero, fonte: f.fonte, ...(f.url ? { url: f.url } : {}) }));
}

type ConteudoComNumeros = {
  title: string;
  subtitle?: string;
  sections?: Array<{ heading: string; body: string; stat?: string }>;
  highlight?: { value: string; label: string };
  keyNumbers?: Array<{ value: string; label: string }>;
  fonte?: string;
};

/**
 * O INFOGRÁFICO SÓ COM NÚMERO QUE TEM LASTRO DE ARTE (11/10). Vale para o que é
 * DESENHADO: todo número de todo campo (título, subtítulo, destaque, cartões,
 * rodapé) está na fala ou no material, ou num dado de pesquisa com fonte e no
 * tema. O destaque, o número do cartão e o rodapé sem lastro saem; o cartão
 * cujo título tem número sem lastro sai inteiro; no texto do cartão e no
 * subtítulo sai a frase com o número. O número de pesquisa que fica volta em
 * `fontes` e o conteúdo ganha `fonte` ("Fonte: Robert Half, 2026"), o rodapé
 * discreto que a arte escreve. `refazer` quando nem o título se salva. Puro.
 */
export function infograficoSoComAFala<C extends ConteudoComNumeros>(c: C, lastro: LastroDaArte | string): { conteudo: C & { fonte?: string }; tirados: string[]; refazer: boolean; fontes: FonteDoNumero[] } {
  const l: LastroDaArte = typeof lastro === "string" ? { texto: lastro, dados: [] } : lastro;
  const daFala = new Set(numerosDoTexto(l.texto));
  const fontes = new Map<string, FonteDoNumero>();
  // O valor tem número sem lastro? O de pesquisa com fonte vale, e a fonte fica anotada.
  const fora = (v: string | null | undefined) => numerosQueAfirmam(v ?? "").some((n) => !daFala.has(n) && !dadoDoNumero(n, l.dados));
  const anotar = (v: string | null | undefined) => {
    for (const n of numerosQueAfirmam(v ?? "")) {
      if (daFala.has(n)) continue;
      const d = dadoDoNumero(n, l.dados);
      if (d && !fontes.has(n)) fontes.set(n, { numero: n, fonte: d.fonte.trim(), ...(d.url ? { url: d.url } : {}) });
    }
  };
  const tirados: string[] = [];
  const conteudo: C & { fonte?: string } = { ...c };
  delete conteudo.fonte;
  if (c.highlight) {
    if (fora(c.highlight.value) || fora(c.highlight.label)) {
      tirados.push(`destaque ${c.highlight.value} ${c.highlight.label ?? ""}`.trim());
      delete conteudo.highlight;
    } else {
      anotar(c.highlight.value);
      anotar(c.highlight.label);
    }
  }
  if (c.keyNumbers) {
    conteudo.keyNumbers = c.keyNumbers.filter((n) => {
      if (!fora(n.value) && !fora(n.label)) {
        anotar(n.value);
        anotar(n.label);
        return true;
      }
      tirados.push(`rodapé ${n.value} ${n.label ?? ""}`.trim());
      return false;
    });
  }
  if (c.sections) {
    conteudo.sections = c.sections
      .filter((s) => {
        if (!fora(s.heading)) return true;
        tirados.push(`cartão "${s.heading}"`);
        return false;
      })
      .map((s) => {
        const novo = { ...s };
        anotar(s.heading);
        if (s.stat && fora(s.stat)) {
          tirados.push(`número do cartão ${s.stat}`);
          delete novo.stat;
        } else anotar(s.stat);
        if (fora(s.body)) {
          tirados.push(`texto do cartão "${s.body}"`);
          novo.body = semFrasesForaDoLastro(s.body, fora);
        }
        anotar(novo.body);
        return novo;
      });
  }
  if (c.subtitle && fora(c.subtitle)) {
    tirados.push(`subtítulo "${c.subtitle}"`);
    conteudo.subtitle = semFrasesForaDoLastro(c.subtitle, fora);
  }
  anotar(conteudo.subtitle);
  let refazer = false;
  if (fora(c.title)) {
    tirados.push(`título "${c.title}"`);
    const titulo = semFrasesForaDoLastro(c.title, fora);
    if (titulo) conteudo.title = titulo;
    else refazer = true;
  }
  anotar(conteudo.title);
  const lista = [...fontes.values()];
  const rodape = rodapeDasFontes(lista);
  if (rodape) conteudo.fonte = rodape;
  return { conteudo, tirados, refazer, fontes: lista };
}

/** O texto sem as frases que têm número fora do lastro (a frase sai inteira, nunca um pedaço). */
function semFrasesForaDoLastro(texto: string, fora: (v: string) => boolean): string {
  return (texto ?? "")
    .split(/(?<=[.!?…])\s+/)
    .filter((f) => !fora(f))
    .join(" ")
    .trim();
}

/** O infográfico tem algum número desenhado fora do lastro da arte? Puro. */
export function infograficoTemNumeroDeFora(c: ConteudoComNumeros, lastro: LastroDaArte | string): boolean {
  return infograficoSoComAFala(c, lastro).tirados.length > 0;
}

/**
 * O BRIEFING DO ROBERTO SÓ COM DADO QUE EXISTE NA PESQUISA (08/10). O pedido
 * dizia "SOMENTE se estiverem no resultado da pesquisa", mas nada conferia:
 * um dado cujo número não aparece no resultado da busca, ou um achado cuja
 * fonte não aparece nela, sai antes de virar briefing. Puro.
 */
export function briefingComLastro<D extends { valor: string; fonte: string }, A extends { fonte: string }>(
  p: { dados: D[]; achados: A[] },
  pesquisa: string
): { dados: D[]; achados: A[]; tirados: string[] } {
  const numeros = new Set(numerosDoTexto(pesquisa));
  const base = comparavel(pesquisa);
  const fonteExiste = (fonte: string) => {
    const palavras = palavrasDoNome(fonte);
    // Fonte sem nome próprio ("pesquisa de mercado") não tem como ser conferida: sai.
    return palavras.length > 0 && palavras.some((w) => base.includes(w));
  };
  const tirados: string[] = [];
  const dados = p.dados.filter((d) => {
    const ns = numerosDoTexto(semNumerosQueNaoSaoDado(d.valor));
    const ok = ns.length > 0 && ns.every((n) => numeros.has(n)) && fonteExiste(d.fonte);
    if (!ok) tirados.push(`dado "${d.valor}" (${d.fonte})`);
    return ok;
  });
  const achados = p.achados.filter((a) => {
    const ok = fonteExiste(a.fonte);
    if (!ok) tirados.push(`achado de "${a.fonte}"`);
    return ok;
  });
  return { dados, achados, tirados };
}
