// Medir e encaixar texto: qualquer texto que o plano mandar cabe no lugar dele.
// Mede com as larguras reais da Schibsted Grotesk (larguras.ts, tiradas da fonte), quebra em linhas
// e reduz o corpo até um mínimo legível. Nunca corta nem vaza: no limite, aceita uma linha a mais.
import { CARACTERES, PESO_600, PESO_700, PESO_800, PESO_900 } from "./larguras";

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
const tabela = (peso: number) => (peso >= 900 ? PESO_900 : peso >= 800 ? PESO_800 : peso >= 700 ? PESO_700 : PESO_600);

export type Estilo = {
  // 600, 700, 800 ou 900
  peso?: number;
  // espaçamento entre letras, em fração do corpo (os títulos usam −0,02)
  espacamento?: number;
  caixaAlta?: boolean;
};

// Largura do texto em px num corpo `tamanho` (com 2% de folga para arredondamento e kerning).
export const largura = (texto: string, tamanho: number, estilo: Estilo = {}) => {
  const t = estilo.caixaAlta ? texto.toUpperCase() : texto;
  const tab = tabela(estilo.peso ?? 800);
  let soma = 0;
  const letras = [...t];
  for (const c of letras) {
    const i = indice.get(c);
    const v = i === undefined ? -1 : tab[i];
    // caractere fora da tabela (♯, ♭, símbolos): uma largura generosa
    soma += v < 0 ? 640 : v;
  }
  return ((soma / 1000) * tamanho + (estilo.espacamento ?? 0) * tamanho * letras.length) * 1.02;
};

// Largura do espaço entre palavras (as palavras ficam em caixas separadas: o espaço vira margem fixa)
export const espaco = (tamanho: number, estilo: Estilo = {}) => Math.max(8, largura(" ", tamanho, estilo) + (estilo.espacamento ?? 0) * tamanho);

const palavrasDe = (texto: string) => texto.trim().split(/\s+/).filter(Boolean);

// Quebra em linhas (listas de índices das palavras) que cabem em `larguras[k]` (a k-ésima linha;
// a última largura vale para as seguintes). Gulosa e depois equilibrada (sem viúva curta no fim).
export const quebrar = (ws: string[], larguras: number | number[], tamanho: number, estilo: Estilo = {}): number[][] => {
  const lista = Array.isArray(larguras) ? larguras : [larguras];
  const limiteDa = (k: number) => lista[Math.min(k, lista.length - 1)];
  const sp = espaco(tamanho, estilo);
  const guloso = (encolhe: number) => {
    const linhas: number[][] = [[]];
    let usado = 0;
    ws.forEach((w, i) => {
      const atual = linhas[linhas.length - 1];
      const lw = largura(w, tamanho, estilo);
      const limite = limiteDa(linhas.length - 1) - encolhe;
      if (atual.length && usado + sp + lw > limite) {
        linhas.push([i]);
        usado = lw;
      } else {
        usado += (atual.length ? sp : 0) + lw;
        atual.push(i);
      }
    });
    return linhas.filter((l) => l.length);
  };
  const base = guloso(0);
  if (base.length < 2) return base;
  // equilibra: encolhe o limite enquanto o número de linhas não muda
  let melhor = base;
  const maior = Math.max(...lista);
  for (let e = 20; e < maior * 0.45; e += 20) {
    const tentativa = guloso(e);
    if (tentativa.length > base.length) break;
    melhor = tentativa;
  }
  return melhor;
};

export const larguraDaLinha = (ws: string[], linha: number[], tamanho: number, estilo: Estilo = {}) =>
  linha.reduce((s, i, k) => s + largura(ws[i], tamanho, estilo) + (k ? espaco(tamanho, estilo) : 0), 0);

export type Encaixe = { tamanho: number; palavras: string[]; linhas: number[][] };

// O maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em até `linhas` linhas.
// Prefere menos linhas quando isso custa pouco corpo (até ~12%). Se nem no mínimo cabe, deixa quebrar
// em mais linhas; palavra única maior que a largura ("criptomoedas" num lugar estreito) ganha um corpo
// menor ainda (até 0,7 do mínimo), para nunca vazar.
export const caber = (
  texto: string,
  { largura: larg, max, min, linhas = 2, estilo = {} }: { largura: number | number[]; max: number; min: number; linhas?: number; estilo?: Estilo },
): Encaixe => {
  const ws = palavrasDe(texto);
  const lista = Array.isArray(larg) ? larg : [larg];
  const menor = Math.min(...lista);
  const tenta = (k: number) => {
    for (let t = max; t >= min; t -= 2) {
      const maiorPalavra = Math.max(0, ...ws.map((w) => largura(w, t, estilo)));
      if (maiorPalavra > menor) continue;
      const q = quebrar(ws, lista, t, estilo);
      if (q.length <= k) return { tamanho: t, palavras: ws, linhas: q };
    }
    return null;
  };
  const melhor = tenta(linhas);
  if (melhor) {
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = tenta(k);
      if (menos && menos.tamanho >= melhor.tamanho * 0.88) return menos;
    }
    return melhor;
  }
  let t = min;
  while (t > min * 0.7 && Math.max(0, ...ws.map((w) => largura(w, t, estilo))) > menor) t -= 2;
  return { tamanho: t, palavras: ws, linhas: quebrar(ws, lista, t, estilo) };
};

// ——— trechos dentro de um texto (destaque, risco) ———

export const nucleo = (w: string) =>
  w
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}%$]/gu, "");

// Índices (na lista de palavras) do trecho `alvo`, ou um conjunto vazio se não achar.
export const indicesDoTrecho = (ws: string[], alvo?: string): Set<number> => {
  const saida = new Set<number>();
  if (!alvo?.trim()) return saida;
  const as = palavrasDe(alvo).map(nucleo);
  const ns = ws.map(nucleo);
  for (let i = 0; i + as.length <= ns.length; i++) {
    if (as.every((a, k) => ns[i + k] === a)) {
      as.forEach((_, k) => saida.add(i + k));
      return saida;
    }
  }
  return saida;
};

// ——— números em português do Brasil ———

const milhar = (n: number) =>
  Math.round(Math.abs(n))
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// 83000 → "83.000"; 1.5 com casas 1 → "1,5"; −3 → "−3"
export const numeroPtBr = (n: number, casas = 0) => {
  const sinal = n < 0 ? "−" : "";
  if (casas <= 0) return `${sinal}${milhar(n)}`;
  const [i, d] = Math.abs(n).toFixed(casas).split(".");
  return `${sinal}${milhar(Number(i))},${d}`;
};

// casas decimais de um valor dito (2.5 → 1), até 2
export const casasDe = (v: number) => {
  const s = String(v);
  const k = s.includes(".") ? s.split(".")[1].length : 0;
  return Math.min(2, k);
};
