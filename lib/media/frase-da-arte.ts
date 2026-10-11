/**
 * A FRASE DA ARTE NUNCA SAI TRUNCADA (05/10/2026).
 *
 * O post de Fé & Gestão de 05/10 foi ao quadro com "Você defende que cada
 * avanço precisa ser 'fincado como estaca' (relações, valores." escrito na
 * arte: a tese do Roberto era longa, e o corte antigo (`fraseDaArte`) cortava
 * na última vírgula e pregava um ponto. Regra nova:
 *
 *   1. a frase inteira cabe no teto? vai inteira;
 *   2. não cabe? fica a maior sequência de FRASES COMPLETAS (até o ponto
 *      final, interrogação ou exclamação) que cabe;
 *   3. nenhuma frase completa cabe? `fraseCompleta` devolve null, e quem chama
 *      pede ao redator uma MANCHETE CURTA (`mancheteCurta`), dentro do teto
 *      do modelo. Nunca mais um pedaço de frase com reticências.
 *
 * O teto vem do modelo do book (`maxPalavras`) e do tamanho da peça; a
 * checagem de que o texto cabe (`textoCabe`) roda ANTES de compor.
 */

/** O teto padrão de caracteres de uma frase escrita na arte. */
export const TETO_DA_FRASE = 140;

/** O texto só com espaços simples. */
function limpar(t: string): string {
  return t.replace(/\s+/g, " ").trim();
}

/** Parte um texto em frases completas (terminadas em . ? ! ou …). */
export function frasesCompletas(texto: string): string[] {
  const t = limpar(texto);
  const saida: string[] = [];
  const re = /[^.!?…]+[.!?…]+["”')\]]?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const f = m[0].trim();
    if (f.length > 1) saida.push(f);
  }
  return saida;
}

/** O texto cabe no teto de caracteres e, quando dado, no teto de palavras? */
export function textoCabe(texto: string, teto: { caracteres?: number; palavras?: number }): boolean {
  const t = limpar(texto);
  if (!t) return false;
  if (teto.caracteres && t.length > teto.caracteres) return false;
  if (teto.palavras && t.split(" ").length > teto.palavras) return false;
  return true;
}

/**
 * A frase da arte, inteira ou em frases completas. Null quando nem a primeira
 * frase completa cabe: quem chama pede a manchete curta ao redator.
 */
export function fraseCompleta(bruta: string, teto: { caracteres?: number; palavras?: number } = { caracteres: TETO_DA_FRASE }): string | null {
  const t = limpar(bruta);
  if (!t) return null;
  if (textoCabe(t, teto)) return t;
  const frases = frasesCompletas(t);
  // A maior sequência de frases completas, do começo, que cabe.
  let acumulado = "";
  let melhor: string | null = null;
  for (const f of frases) {
    const tentativa = acumulado ? `${acumulado} ${f}` : f;
    if (!textoCabe(tentativa, teto)) break;
    acumulado = tentativa;
    melhor = tentativa;
  }
  return melhor;
}

/** A frase parece truncada (termina sem pontuação de fim, ou com reticências, ou com parêntese aberto)? */
export function pareceTruncada(frase: string): boolean {
  const t = limpar(frase);
  if (!t) return true;
  if (/[…]$/.test(t)) return true;
  const abertos = (t.match(/\(/g) ?? []).length;
  const fechados = (t.match(/\)/g) ?? []).length;
  if (abertos > fechados) return true;
  // Termina em vírgula, dois-pontos ou ponto e vírgula: pedaço de frase.
  if (/[,;:]\.?$/.test(t)) return true;
  // "(relações, valores." : ponto pregado depois de uma lista que não fechou.
  if (/\([^)]*\.$/.test(t)) return true;
  // Termina numa palavra que nunca fecha frase (artigo, preposição, conjunção,
  // "o que"): "é fazer certo com o que você" (11/10) é pedaço, não frase.
  const semPonto = t.replace(/[.!?…"”')\]]+$/, "").trim();
  const ultimas = semPonto.toLowerCase().split(/\s+/);
  if (NUNCA_FECHA.has(ultimas[ultimas.length - 1] ?? "")) return true;
  if (/\bo que (voc[eê]|a gente|n[oó]s|eles?|elas?)$/i.test(semPonto)) return true;
  return false;
}

/** Palavras que nunca terminam uma frase em português. */
const NUNCA_FECHA = new Set(
  "o a os as um uma uns umas de do da dos das em no na nos nas com sem para pra por pelo pela pelos pelas ao aos e ou mas que se seu sua seus suas meu minha nosso nossa cujo cuja entre sobre até porque quando como".split(" ")
);

const VAZIAS = new Set("o a os as um uma de do da dos das em no na nos nas com e ou que se é não para pra por".split(" "));
const normal = (w: string) => w.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/**
 * A FRASE QUE REPETE A SI MESMA (11/10): "Marta se ocupava fazendo tarefa boa
 * atrás de tarefa boa" saiu na lâmina, e o destaque da arte caiu no "tarefa
 * boa" repetido; lida na arte, parece erro. Devolve o trecho repetido (duas ou
 * mais palavras seguidas que voltam na mesma frase, com pelo menos uma palavra
 * de conteúdo), ou null. Puro.
 */
export function trechoRepetido(frase: string): string | null {
  const ws = limpar(frase).split(" ").map(normal).filter(Boolean);
  for (let n = Math.min(4, Math.floor(ws.length / 2)); n >= 2; n--) {
    const vistos = new Map<string, number>();
    for (let i = 0; i + n <= ws.length; i++) {
      const pedaco = ws.slice(i, i + n);
      if (pedaco.every((w) => VAZIAS.has(w))) continue;
      const k = pedaco.join(" ");
      const antes = vistos.get(k);
      // Sobreposto ("a a a") não conta como volta; tem de reaparecer depois de terminar.
      if (antes !== undefined && i >= antes + n) return k;
      if (antes === undefined) vistos.set(k, i);
    }
  }
  return null;
}

/** O que impede a frase de ir para a arte: truncada ou repetindo um trecho. Null quando serve. Puro. */
export function problemaDaFrase(frase: string): string | null {
  if (pareceTruncada(frase)) return "a frase não fecha (termina no meio de uma ideia)";
  const rep = trechoRepetido(frase);
  if (rep) return `a frase repete "${rep}"`;
  return null;
}

/**
 * A MANCHETE CURTA pelo redator: quando nenhuma frase completa cabe no teto.
 * É escrita (texto), então é do Claude; a decisão de pedir é do código.
 */
/** Quem escreve a manchete (o Claude, só texto). Parâmetro para o teste trocar por um falso. */
export type RedatorDaManchete = (sistema: string, pedido: string) => Promise<string>;

const redatorPadrao = (usage?: { projectId?: string; runId?: string }): RedatorDaManchete => async (sistema, pedido) => {
  const { askClaude } = await import("@/lib/claude");
  return askClaude(sistema, pedido, { maxTokens: 400, effort: "low", usage: { operation: "manchete_curta", ...usage } });
};

/** Quantas vezes o redator é chamado antes de desistir da manchete. */
export const TENTATIVAS_DA_MANCHETE = 3;

/**
 * A MANCHETE CURTA pelo redator: quando nenhuma frase completa cabe no teto,
 * ou quando a frase não serve (`porque`: repete um trecho, não fecha). É
 * escrita (texto), então é do Claude; a decisão de pedir é do código.
 *
 * NUNCA CORTA POR PALAVRA (11/10): o corte na última palavra inteira que cabia
 * pôs na arte "Excelência não é ter o mais caro, é fazer certo com o que você"
 * (a manchete tinha uma palavra a mais que o teto, e o "tem" ficou de fora).
 * Agora a manchete que não cabe ou não fecha volta ao redator dizendo o que
 * errou, até três vezes; sem nenhuma que sirva, fica a manchete INTEIRA mais
 * curta que fecha e cabe nos caracteres (passar umas palavras do teto não
 * quebra a arte; frase cortada quebra), e sem nenhuma, lança: quem chama não
 * põe frase pela metade na arte.
 */
export async function mancheteCurta(o: {
  fraseLonga: string;
  maxPalavras: number;
  maxCaracteres?: number;
  contexto?: string;
  usage?: { projectId?: string; runId?: string };
  /** O motivo de reescrever quando não é o tamanho (a frase repete um trecho, não fecha). */
  porque?: string;
  redator?: RedatorDaManchete;
}): Promise<string> {
  const redator = o.redator ?? redatorPadrao(o.usage);
  const maxCaracteres = o.maxCaracteres ?? TETO_DA_FRASE;
  const teto = { caracteres: maxCaracteres, palavras: o.maxPalavras };
  const sistema = "Você escreve a manchete de uma arte de rede social em português do Brasil. Devolva SÓ a manchete, sem aspas, sem comentário. Nunca use travessão. Nunca invente número, nome ou dado que não esteja no texto.";
  const candidatas: string[] = [];
  let erro = "";
  for (let t = 0; t < TENTATIVAS_DA_MANCHETE; t++) {
    const motivo = o.porque && t === 0 ? `A frase abaixo não serve para a arte: ${o.porque}.` : "A frase abaixo é longa demais para caber na arte.";
    const bruto = await redator(
      sistema,
      `${motivo} Reescreva-a como UMA manchete completa, com sentido fechado, de no máximo ${o.maxPalavras} palavras e ${maxCaracteres} caracteres, mantendo a ideia e as palavras fortes dela. Nunca uma frase cortada pela metade; nunca repita a mesma palavra ou expressão dentro da manchete.${erro ? `\n\nA SUA TENTATIVA ANTERIOR NÃO SERVIU: ${erro}. Escreva outra.` : ""}

FRASE:
${o.fraseLonga}
${o.contexto ? `\nCONTEXTO (de onde a frase veio):\n${o.contexto.slice(0, 1500)}` : ""}`
    );
    const manchete = limpar(bruto.split("\n")[0]).replace(/^["“]|["”]$/g, "").replace(/\s*[—–]\s*/g, ", ");
    if (!manchete) {
      erro = "veio vazia";
      continue;
    }
    const problema = problemaDaFrase(manchete);
    if (problema) {
      erro = `"${manchete}": ${problema}`;
      continue;
    }
    if (textoCabe(manchete, teto)) return manchete;
    // A primeira frase completa dela que cabe (inteira, nunca um pedaço).
    const completa = fraseCompleta(manchete, teto);
    if (completa && !problemaDaFrase(completa)) return completa;
    candidatas.push(manchete);
    erro = `"${manchete}" tem ${manchete.split(" ").length} palavras e ${manchete.length} caracteres, acima do teto`;
  }
  const inteira = candidatas.filter((c) => c.length <= maxCaracteres).sort((a, b) => a.length - b.length)[0];
  if (inteira) return inteira;
  throw new Error(`a manchete da arte não saiu inteira dentro do teto (${erro})`);
}

/**
 * A frase da arte, garantida: inteira, em frases completas, ou a manchete
 * curta do redator. Nunca truncada.
 */
export async function fraseGarantida(o: {
  bruta: string;
  maxPalavras?: number;
  maxCaracteres?: number;
  contexto?: string;
  usage?: { projectId?: string; runId?: string };
  redator?: RedatorDaManchete;
}): Promise<string> {
  const teto = { caracteres: o.maxCaracteres ?? TETO_DA_FRASE, palavras: o.maxPalavras };
  const pronta = fraseCompleta(o.bruta, teto);
  const problema = pronta ? problemaDaFrase(pronta) : null;
  if (pronta && !problema) return pronta;
  return mancheteCurta({ fraseLonga: o.bruta, maxPalavras: o.maxPalavras ?? 12, maxCaracteres: teto.caracteres, contexto: o.contexto, usage: o.usage, porque: problema ?? undefined, redator: o.redator });
}
