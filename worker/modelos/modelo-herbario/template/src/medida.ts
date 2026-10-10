// Medir e encaixar texto: qualquer texto que o plano mandar cabe no lugar dele.
// Mede com as larguras reais das fontes (larguras.ts), quebra em linhas e reduz o corpo até um
// mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais (e, para uma palavra
// única maior que a caixa, um corpo um pouco menor).
import { CARACTERES, ITALICO_600, SANS_700, SC_700, SERIF_700, SERIF_800 } from "./larguras";

export type Fonte = "serif" | "serif800" | "italico" | "versalete" | "sans";

const TABELAS: Record<Fonte, number[]> = {
  serif: SERIF_700,
  serif800: SERIF_800,
  italico: ITALICO_600,
  versalete: SC_700,
  sans: SANS_700,
};

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));

// O componente Escrita separa as palavras com uma margem de 0,26 do corpo (não com o caractere de espaço).
export const ESPACO = 0.26;

// Largura de uma palavra (sem espaços) em px.
const larguraPalavra = (w: string, tamanho: number, fonte: Fonte, espacamento = 0) => {
  const tabela = TABELAS[fonte];
  let soma = 0;
  const letras = [...w];
  for (const c of letras) {
    const i = indice.get(c);
    // caractere fora da tabela: uma largura média, generosa
    soma += i === undefined ? 600 : tabela[i];
  }
  return (soma / 1000) * tamanho + espacamento * tamanho * Math.max(0, letras.length - 1);
};

// Largura de um texto em px, com as palavras separadas pela margem do Escrita (`espaco`, em frações do corpo).
// `caixaAlta` passa o texto para maiúsculas antes (rótulos em versalete); `espacamento` = letter-spacing em em.
export const larguraTexto = (
  texto: string,
  tamanho: number,
  fonte: Fonte = "serif",
  { espaco = ESPACO, espacamento = 0, caixaAlta = false }: { espaco?: number; espacamento?: number; caixaAlta?: boolean } = {},
) => {
  const t = caixaAlta ? texto.toUpperCase() : texto;
  const ws = t.split(/\s+/).filter(Boolean);
  const soma = ws.reduce((s, w) => s + larguraPalavra(w, tamanho, fonte, espacamento), 0);
  // 3% de folga: o navegador arredonda e aplica kerning
  return (soma + espaco * tamanho * Math.max(0, ws.length - 1)) * 1.03;
};

// palavras que não terminam linha
const SOLTAS = new Set(["o", "a", "os", "as", "e", "é", "de", "da", "do", "das", "dos", "um", "uma", "em", "no", "na", "nos", "nas", "ao", "à", "às", "aos", "se", "ou", "que", "pra", "pro", "por", "com", "×"]);

// Quebra em linhas que cabem em `largura` (palavra por palavra). Palavra maior que a linha fica sozinha.
export const quebrarLinhas = (texto: string, largura: number, tamanho: number, fonte: Fonte = "serif") => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const tentativa = atual ? `${atual} ${p}` : p;
    if (!atual || larguraTexto(tentativa, tamanho, fonte) <= largura) atual = tentativa;
    else {
      linhas.push(atual);
      atual = p;
    }
  }
  if (atual) linhas.push(atual);
  // não termina uma linha com artigo, preposição ou conjunção solta ("o", "a", "de", "e", "que"):
  // ela desce para a próxima, se couber
  for (let i = 0; i < linhas.length - 1; i++) {
    const ws = linhas[i].split(" ");
    const ultima = ws[ws.length - 1];
    if (ws.length > 1 && SOLTAS.has(ultima.toLowerCase())) {
      const proxima = `${ultima} ${linhas[i + 1]}`;
      if (larguraTexto(proxima, tamanho, fonte) <= largura) {
        linhas[i] = ws.slice(0, -1).join(" ");
        linhas[i + 1] = proxima;
      }
    }
  }
  // equilibra: não deixa uma palavra curta sozinha no fim quando dá para descer uma da linha de cima
  if (linhas.length >= 2) {
    const ultima = linhas[linhas.length - 1];
    const penultima = linhas[linhas.length - 2].split(" ");
    if (!ultima.includes(" ") && penultima.length > 2) {
      const moveu = `${penultima[penultima.length - 1]} ${ultima}`;
      if (larguraTexto(moveu, tamanho, fonte) <= largura) {
        linhas[linhas.length - 2] = penultima.slice(0, -1).join(" ");
        linhas[linhas.length - 1] = moveu;
      }
    }
  }
  return linhas;
};

export type Encaixe = { tamanho: number; linhas: string[] };

// Maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em até `linhas` linhas.
// Se nem no mínimo cabe, usa o mínimo e deixa quebrar em mais linhas (nunca vaza na largura,
// a não ser uma palavra única maior que a caixa, que então ganha um corpo menor ainda).
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = "serif" }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  if (!limpo) return { tamanho: max, linhas: [] };
  const melhorEm = (k: number) => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const quebra = quebrarLinhas(limpo, largura, tamanho, fonte);
      if (quebra.length <= k && quebra.every((l) => larguraTexto(l, tamanho, fonte) <= largura)) return { tamanho, linhas: quebra };
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    // menos linhas vale a pena se custar pouco corpo (até ~12% menor): o bloco fica mais limpo.
    // Uma linha com uma palavrinha só ("É / o caminho") aceita até ~25% menor para não sobrar.
    const orfa = melhor.linhas.some((l) => [...l.replace(/\s/g, "")].length <= 2);
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.tamanho >= melhor.tamanho * (orfa ? 0.75 : 0.88)) return menos;
    }
    return melhor;
  }
  let tamanho = min;
  const maiorPalavra = limpo.split(" ").reduce((a, b) => (larguraTexto(b, 1, fonte) > larguraTexto(a, 1, fonte) ? b : a), "");
  while (tamanho > 26 && larguraTexto(maiorPalavra, tamanho, fonte) > largura) tamanho -= 2;
  return { tamanho, linhas: quebrarLinhas(limpo, largura, tamanho, fonte) };
};

// Linhas já quebradas pelo plano (ex.: o título da `figura`): o maior corpo em que cada linha cabe
// inteira. Se uma linha não cabe nem no mínimo, ela é quebrada de novo no mínimo.
export const encaixarLinhas = (linhas: string[], { largura, max, min, fonte = "serif" }: { largura: number; max: number; min: number; fonte?: Fonte }): Encaixe => {
  const limpas = linhas.map((l) => l.trim()).filter(Boolean);
  for (let tamanho = max; tamanho >= min; tamanho -= 2) {
    if (limpas.every((l) => larguraTexto(l, tamanho, fonte) <= largura)) return { tamanho, linhas: limpas };
  }
  return { tamanho: min, linhas: limpas.flatMap((l) => quebrarLinhas(l, largura, min, fonte)) };
};

// Texto dado como lista de linhas (formato antigo) ou como frase única (blocos universais).
export const comoTexto = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(" ") : (v ?? ""));

// ——— números em pt-BR ———

// 83000 → "83.000"; 1.5 → "1,5"; casas fixas quando pedidas (sem depender do idioma do navegador)
export const formatarNumero = (valor: number, casas?: number) => {
  const c = casas ?? (Number.isInteger(valor) ? 0 : Math.min(2, (String(valor).split(".")[1] ?? "").length));
  const fixo = Math.abs(valor).toFixed(c);
  const [inteiro, decimal] = fixo.split(".");
  const agrupado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${valor < 0 ? "−" : ""}${agrupado}${decimal ? `,${decimal}` : ""}`;
};
