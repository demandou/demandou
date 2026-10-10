// Medir e encaixar texto com as larguras reais das fontes (larguras.ts): qualquer texto que o plano
// mandar cabe na caixa dele. Quebra em linhas e reduz o corpo até um mínimo legível; nunca corta
// nem vaza (no mínimo, aceita uma linha a mais).
import { CARACTERES, SANS400, SANS500, SANS600, SERIFA, SERIFAITALICO } from "./larguras";

export type Estilo = "serifa" | "italico" | "sans400" | "sans500" | "sans600";

const TABELAS: Record<Estilo, number[]> = {
  serifa: SERIFA,
  italico: SERIFAITALICO,
  sans400: SANS400,
  sans500: SANS500,
  sans600: SANS600,
};
const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));

// Largura em px de `texto` no corpo `tamanho`. `espacamento` em em (letter-spacing).
export const largura = (texto: string, tamanho: number, estilo: Estilo = "serifa", espacamento = 0, caixaAlta = false) => {
  const t = (caixaAlta ? texto.toUpperCase() : texto).replace(/\u00A0/g, " ");
  const tabela = TABELAS[estilo];
  let soma = 0;
  const letras = [...t];
  for (const c of letras) {
    const i = indice.get(c);
    // caractere fora da tabela: uma largura generosa
    soma += i === undefined ? 640 : tabela[i];
  }
  // 3% de folga: o navegador arredonda e aplica kerning
  return ((soma / 1000) * tamanho + espacamento * tamanho * letras.length) * 1.03;
};

// `juntos`: um trecho que não pode ser quebrado entre linhas (ex.: o destaque "Saiba Mais")
export type Fonte = { estilo?: Estilo; espacamento?: number; caixaAlta?: boolean; juntos?: string };
const NBSP = "\u00A0";
const colar = (texto: string, juntos?: string) => {
  if (!juntos) return texto;
  const alvo = juntos.trim().replace(/\s+/g, " ");
  const i = texto.toLowerCase().indexOf(alvo.toLowerCase());
  if (i < 0 || !alvo.includes(" ")) return texto;
  return texto.slice(0, i) + texto.slice(i, i + alvo.length).replace(/ /g, NBSP) + texto.slice(i + alvo.length);
};
const soltar = (l: string) => l.replace(/\u00A0/g, " ");
const medir = (texto: string, tamanho: number, f: Fonte) => largura(texto, tamanho, f.estilo, f.espacamento, f.caixaAlta);

// Quebra em linhas que cabem em `max` px (gulosa, depois equilibrada: a menor largura que dá o
// mesmo número de linhas, para não sobrar uma palavra sozinha embaixo).
export const quebrar = (texto: string, max: number, tamanho: number, f: Fonte = {}): string[] => {
  const ws = texto.split(/[ \t\n]+/).filter(Boolean);
  const guloso = (limite: number) => {
    const linhas: string[] = [];
    let atual = "";
    for (const w of ws) {
      const tentativa = atual ? `${atual} ${w}` : w;
      if (!atual || medir(tentativa, tamanho, f) <= limite) atual = tentativa;
      else {
        linhas.push(atual);
        atual = w;
      }
    }
    if (atual) linhas.push(atual);
    return linhas;
  };
  const base = guloso(max);
  if (base.length < 2) return base;
  // entre as larguras que dão o mesmo número de linhas, a de linhas mais parecidas (sem órfã)
  const desigual = (ls: string[]) => {
    const ws2 = ls.map((l) => medir(l, tamanho, f));
    return Math.max(...ws2) - Math.min(...ws2);
  };
  let melhor = base;
  let nota = desigual(base);
  for (let l = max - 12; l > max * 0.4; l -= 12) {
    const t = guloso(l);
    if (t.length > base.length) continue;
    const n = desigual(t);
    if (n < nota - 1) {
      melhor = t;
      nota = n;
    }
  }
  return melhor;
};

export type Encaixe = { tamanho: number; linhas: string[]; largura: number; altura: number };

// O maior corpo (de `max` até `min`) em que o texto cabe em até `linhas` linhas de `largura` px.
// Palavra maior que a linha: o corpo desce até ela caber (até 0,7 do mínimo). `entrelinha` em
// múltiplos do corpo, para a altura.
export const encaixar = (
  texto: string,
  { largura: L, max, min, linhas = 2, entrelinha = 1.12, ...f }: { largura: number; max: number; min: number; linhas?: number; entrelinha?: number } & Fonte,
): Encaixe => {
  const limpo = colar(texto.trim().replace(/\s+/g, " "), f.juntos);
  const ws = limpo.split(" ");
  const pronto = (tamanho: number, ls: string[]): Encaixe => ({
    tamanho,
    linhas: ls.map(soltar),
    largura: Math.max(0, ...ls.map((l) => medir(l, tamanho, f))),
    altura: ls.length * tamanho * entrelinha,
  });
  // última linha com uma palavra só (órfã): aceita até 12% de corpo a menos para evitá-la
  const orfa = (ls: string[]) => ls.length >= 2 && !ls[ls.length - 1].includes(" ");
  for (let tamanho = max; tamanho >= min; tamanho -= 2) {
    if (Math.max(0, ...ws.map((w) => medir(w, tamanho, f))) > L) continue;
    const ls = quebrar(limpo, L, tamanho, f);
    if (ls.length <= linhas) {
      if (orfa(ls)) {
        for (let t2 = tamanho - 2; t2 >= Math.max(min, tamanho * 0.88); t2 -= 2) {
          const l2 = quebrar(limpo, L, t2, f);
          if (l2.length <= ls.length && !orfa(l2)) return pronto(t2, l2);
        }
      }
      return pronto(tamanho, ls);
    }
  }
  let tamanho = min;
  while (tamanho > min * 0.7 && Math.max(0, ...ws.map((w) => medir(w, tamanho, f))) > L) tamanho -= 2;
  return pronto(tamanho, quebrar(limpo, L, tamanho, f));
};

// Uma linha só: o maior corpo até `max` em que o texto cabe em `L` (sem passar de `min` para baixo).
export const umaLinha = (texto: string, L: number, max: number, min: number, f: Fonte = {}) => {
  for (let tamanho = max; tamanho > min; tamanho -= 2) if (medir(texto, tamanho, f) <= L) return tamanho;
  return min;
};

// ——— números em pt-BR ———
const milhar = (n: number) => Math.round(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
// 83000 → "83.000"; 1.5 (casas 1) → "1,5"
export const numeroPtBr = (n: number, casas = 0) => {
  if (casas <= 0) return `${n < 0 ? "-" : ""}${milhar(Math.abs(n))}`;
  const [i, d] = Math.abs(n).toFixed(casas).split(".");
  return `${n < 0 ? "-" : ""}${milhar(Number(i))},${d}`;
};

// Um teto "redondo" acima de `v` para réguas e escalas (83000 → 100000; 15 → 20; 0,5 → 1)
export const tetoRedondo = (v: number) => {
  if (!(v > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const k of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (k * p >= v * 1.08) return k * p;
  return 10 * p;
};
