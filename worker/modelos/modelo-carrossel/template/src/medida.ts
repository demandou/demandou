// Medir e encaixar texto: qualquer texto que o plano mandar cabe na caixa dele.
// Mede com as larguras reais da Parkinsans (larguras.ts), quebra em linhas equilibradas e reduz o
// corpo até um mínimo legível. Nunca corta nem vaza: no pior caso aceita uma linha a mais, e uma
// palavra única maior que a caixa ganha um corpo menor ainda.
//
// O texto que se monta na fala (Palavras, em anim.tsx) põe cada palavra num bloco próprio com uma
// margem fixa de 0,24em entre elas (não o caractere de espaço): a medida faz a mesma conta.
import { CARACTERES, PARKINSANS_500, PARKINSANS_600, PARKINSANS_700, PARKINSANS_800 } from "./larguras";

export type Peso = 500 | 600 | 700 | 800;
export type Fonte = { peso?: Peso; espacamento?: number; caixaAlta?: boolean; vao?: number };

const TABELAS: Record<Peso, number[]> = { 500: PARKINSANS_500, 600: PARKINSANS_600, 700: PARKINSANS_700, 800: PARKINSANS_800 };
const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
// vão entre palavras usado pelos componentes (margem fixa, em frações do corpo)
export const VAO_PALAVRAS = 0.24;

// Largura de uma palavra (sem espaços) em px, num corpo `tamanho`.
export const larguraPalavra = (palavra: string, tamanho: number, fonte: Fonte = {}) => {
  const tabela = TABELAS[fonte.peso ?? 700];
  const letras = [...(fonte.caixaAlta ? palavra.toUpperCase() : palavra)];
  let soma = 0;
  for (const c of letras) {
    const i = indice.get(c);
    const w = i === undefined ? -1 : tabela[i];
    // caractere fora da tabela: uma largura média, generosa
    soma += w < 0 ? 680 : w;
  }
  // o letter-spacing entra depois de cada letra; 2% de folga para arredondamentos do navegador
  return ((soma / 1000) * tamanho + (fonte.espacamento ?? 0) * tamanho * letras.length) * 1.02;
};

// Largura de uma linha (palavras separadas pela margem fixa).
export const larguraLinha = (linha: string, tamanho: number, fonte: Fonte = {}) => {
  const ws = linha.split(/\s+/).filter(Boolean);
  if (!ws.length) return 0;
  const vao = (fonte.vao ?? VAO_PALAVRAS) * tamanho;
  return ws.reduce((s, w) => s + larguraPalavra(w, tamanho, fonte), 0) + vao * (ws.length - 1);
};

// Divide as palavras em exatamente `n` linhas, com a linha mais larga o mais estreita possível
// (linhas equilibradas, como um editor faria num slide).
const equilibrar = (ws: string[], n: number, tamanho: number, fonte: Fonte): string[] => {
  if (n <= 1 || ws.length <= 1) return [ws.join(" ")];
  if (n >= ws.length) return [...ws];
  const largura = ws.map((w) => larguraPalavra(w, tamanho, fonte));
  const vao = (fonte.vao ?? VAO_PALAVRAS) * tamanho;
  const faixa = (a: number, b: number) => largura.slice(a, b).reduce((s, x) => s + x, 0) + vao * (b - a - 1);
  // programação dinâmica: melhor[k][i] = menor "linha mais larga" para pôr as palavras i.. em k linhas
  const memo = new Map<string, { max: number; cortes: number[] }>();
  const resolver = (i: number, k: number): { max: number; cortes: number[] } => {
    const chave = `${i}-${k}`;
    const pronto = memo.get(chave);
    if (pronto) return pronto;
    let melhor: { max: number; cortes: number[] } = { max: Infinity, cortes: [] };
    if (k === 1) melhor = { max: faixa(i, ws.length), cortes: [] };
    else {
      for (let j = i + 1; j <= ws.length - (k - 1); j++) {
        const resto = resolver(j, k - 1);
        const max = Math.max(faixa(i, j), resto.max);
        // empate: prefira a primeira linha mais curta (título "escada" para baixo fica feio)
        if (max < melhor.max - 0.5) melhor = { max, cortes: [j, ...resto.cortes] };
      }
    }
    memo.set(chave, melhor);
    return melhor;
  };
  const { cortes } = resolver(0, n);
  const linhas: string[] = [];
  let a = 0;
  for (const c of [...cortes, ws.length]) {
    linhas.push(ws.slice(a, c).join(" "));
    a = c;
  }
  return linhas;
};

// Quebra em até `max` linhas que cabem em `largura` (o menor número de linhas que cabe, equilibradas).
// Se nem com `max` linhas couber, devolve `max` linhas equilibradas (quem chama reduz o corpo).
export const quebrarLinhas = (texto: string, largura: number, tamanho: number, fonte: Fonte = {}, max = 3) => {
  const ws = texto.trim().split(/\s+/).filter(Boolean);
  if (!ws.length) return [""];
  const teto = Math.min(max, ws.length);
  for (let n = 1; n <= teto; n++) {
    const linhas = equilibrar(ws, n, tamanho, fonte);
    if (linhas.every((l) => larguraLinha(l, tamanho, fonte) <= largura)) return linhas;
  }
  return equilibrar(ws, teto, tamanho, fonte);
};

export type Encaixe = { tamanho: number; linhas: string[] };

// O maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em até `linhas` linhas da
// `largura`. Menos linhas vale a pena se custar pouco corpo (até ~15% menor). Se nem no mínimo
// couber, usa o mínimo com uma linha a mais; uma palavra única maior que a caixa ganha corpo menor.
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = {}, preferirMenos = 0.85 }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte; preferirMenos?: number },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  if (!limpo) return { tamanho: max, linhas: [""] };
  const melhorEm = (k: number): Encaixe | null => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const quebra = quebrarLinhas(limpo, largura, tamanho, fonte, k);
      if (quebra.length <= k && quebra.every((l) => larguraLinha(l, tamanho, fonte) <= largura)) return { tamanho, linhas: quebra };
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.tamanho >= melhor.tamanho * preferirMenos) return menos;
    }
    return melhor;
  }
  // nem no mínimo: uma linha a mais
  const extra = melhorEm(linhas + 1);
  if (extra) return extra;
  // palavra única enorme: reduz até caber na largura
  let tamanho = min;
  const ws = limpo.split(" ");
  const maior = ws.reduce((a, b) => (larguraPalavra(b, 1, fonte) > larguraPalavra(a, 1, fonte) ? b : a), "");
  while (tamanho > 26 && larguraPalavra(maior, tamanho, fonte) > largura) tamanho -= 2;
  return { tamanho, linhas: quebrarLinhas(limpo, largura, tamanho, fonte, linhas + 1) };
};

// ---------- números em pt-BR ----------

// 83000 → "83.000"; 1.5 → "1,5" (com `casas`); arredonda para as casas pedidas
export const numeroBR = (valor: number, casas = 0) => {
  const fixo = Math.abs(valor).toFixed(Math.max(0, casas));
  const [inteira, decimal] = fixo.split(".");
  const milhar = inteira.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${valor < 0 ? "−" : ""}${milhar}${decimal ? `,${decimal}` : ""}`;
};

// casas decimais de um número escrito no plano (1.5 → 1; 83000 → 0)
export const casasDe = (valor: number) => {
  if (Number.isInteger(valor)) return 0;
  const s = String(valor);
  return Math.min(2, s.includes(".") ? s.split(".")[1].length : 0);
};
