// Medir e encaixar texto: qualquer texto que o plano mandar cabe na caixa dele.
// Mede com a própria fonte no navegador do render (canvas.measureText, depois que as fontes
// carregaram: o <Edicao> só desenha quando `fontesCarregadas` resolve), quebra em linhas
// equilibradas e reduz o corpo até um mínimo legível. Nunca corta nem vaza: se nem no mínimo
// couber, aceita uma linha a mais (e uma palavra enorme sozinha ganha um corpo menor).
import { mostrador, sans } from "./tema";

export type Fonte = {
  familia: "mostrador" | "sans";
  peso: 500 | 600 | 700 | 800;
  // espaçamento entre letras, em frações do corpo
  espacamento?: number;
  caixaAlta?: boolean;
};

export const MOSTRADOR: Fonte = { familia: "mostrador", peso: 700, espacamento: -0.01 };
export const MOSTRADOR_600: Fonte = { familia: "mostrador", peso: 600 };
export const SANS: Fonte = { familia: "sans", peso: 700 };
export const SANS_600: Fonte = { familia: "sans", peso: 600 };
export const LETREIRO: Fonte = { familia: "sans", peso: 800, espacamento: 0.14, caixaAlta: true };

// espaço entre palavras (margem fixa nos componentes, em frações do corpo)
export const ESPACO = 0.24;

let contexto: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

// reserva sem navegador: média generosa por caractere
const estimativa = (texto: string, f: Fonte) => [...texto].length * (f.familia === "sans" ? 0.56 : 0.6) * 100;

// Largura do texto em px num corpo `tamanho`.
export const larguraTexto = (texto: string, tamanho: number, f: Fonte = MOSTRADOR) => {
  const t = f.caixaAlta ? texto.toUpperCase() : texto;
  const familia = f.familia === "sans" ? sans : mostrador;
  const chave = `${familia}|${f.peso}|${t}`;
  let a100 = cache.get(chave);
  if (a100 === undefined) {
    if (!contexto && typeof document !== "undefined") contexto = document.createElement("canvas").getContext("2d");
    const fonte = `${f.peso} 100px "${familia}"`;
    if (contexto && (typeof document === "undefined" || !document.fonts || document.fonts.check(fonte))) {
      contexto.font = fonte;
      a100 = contexto.measureText(t).width;
      cache.set(chave, a100);
    } else a100 = estimativa(t, f);
  }
  const letras = [...t].length;
  // 3% de folga: o navegador arredonda e aplica kerning
  return ((a100 / 100) * tamanho + (f.espacamento ?? 0) * tamanho * Math.max(0, letras - 1)) * 1.03;
};

const larguraLinha = (palavras: string[], tamanho: number, f: Fonte) =>
  palavras.reduce((s, w, k) => s + larguraTexto(w, tamanho, f) + (k > 0 ? ESPACO * tamanho : 0), 0);

// palavras curtas que não ficam penduradas no fim de uma linha
const CURTAS = new Set("a o e é de da do das dos na no nas nos em um uma pra para se que com por ao à".split(" "));

// Quebra em linhas que cabem em `largura` (guloso, depois equilibrado: linhas de largura parecida,
// sem palavra curta no fim de uma linha e sem palavra sozinha na última).
export const quebrarLinhas = (texto: string, largura: number, tamanho: number, f: Fonte = MOSTRADOR): string[] => {
  const ws = texto.split(/\s+/).filter(Boolean);
  if (!ws.length) return [""];
  const guloso = (limite: number) => {
    const linhas: string[][] = [[]];
    for (const w of ws) {
      const atual = linhas[linhas.length - 1];
      if (atual.length && larguraLinha([...atual, w], tamanho, f) > limite) linhas.push([w]);
      else atual.push(w);
    }
    return linhas;
  };
  const base = guloso(largura);
  if (base.length < 2) return base.map((l) => l.join(" "));
  // equilibra: aperta a largura enquanto o número de linhas não aumenta
  let melhor = base;
  for (let l = largura - 12; l > largura * 0.5; l -= 12) {
    const tentativa = guloso(l);
    if (tentativa.length > base.length) break;
    melhor = tentativa;
  }
  // tira palavra curta do fim de uma linha (desce para a próxima), se ainda couber
  for (let i = 0; i < melhor.length - 1; i++) {
    const linha = melhor[i];
    const ultima = linha[linha.length - 1];
    if (linha.length > 1 && CURTAS.has(ultima.toLowerCase()) && larguraLinha([ultima, ...melhor[i + 1]], tamanho, f) <= largura) {
      melhor[i] = linha.slice(0, -1);
      melhor[i + 1] = [ultima, ...melhor[i + 1]];
    }
  }
  return melhor.filter((l) => l.length).map((l) => l.join(" "));
};

export type Encaixe = { tamanho: number; linhas: string[]; largura: number };

// Maior corpo (de `max` até `min`) em que o texto cabe em até `linhas` linhas.
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = MOSTRADOR }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  const medir = (ls: string[], tamanho: number) => Math.max(...ls.map((l) => larguraLinha(l.split(" "), tamanho, fonte)));
  const melhorEm = (k: number) => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const q = quebrarLinhas(limpo, largura, tamanho, fonte);
      if (q.length <= k && medir(q, tamanho) <= largura) return { tamanho, linhas: q, largura: medir(q, tamanho) };
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    // menos linhas vale a pena se custar pouco corpo (até ~12% menor): o bloco fica mais limpo
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.tamanho >= melhor.tamanho * 0.88) return menos;
    }
    return melhor;
  }
  // não coube nem no mínimo: uma palavra enorme reduz até caber; senão, aceita mais linhas
  let tamanho = min;
  const maior = limpo.split(" ").reduce((a, b) => (larguraTexto(b, 1, fonte) > larguraTexto(a, 1, fonte) ? b : a), "");
  while (tamanho > 30 && larguraTexto(maior, tamanho, fonte) > largura) tamanho -= 2;
  const q = quebrarLinhas(limpo, largura, tamanho, fonte);
  return { tamanho, linhas: q, largura: medir(q, tamanho) };
};

// ——— trechos dentro de um texto (destaque, risco) ———

const nucleo = (w: string) => w.toLowerCase().replace(/^[^\p{L}\p{N}$%]+|[^\p{L}\p{N}%]+$/gu, "");

// Índices (na lista de palavras de `texto`) do trecho `alvo`, ou null se não achar.
export const trechoNoTexto = (texto: string, alvo?: string): Set<number> => {
  const achados = new Set<number>();
  if (!alvo?.trim()) return achados;
  const ws = texto.split(/\s+/).filter(Boolean).map(nucleo);
  const as = alvo.split(/\s+/).filter(Boolean).map(nucleo);
  for (let i = 0; i + as.length <= ws.length; i++) {
    if (as.every((a, k) => ws[i + k] === a)) {
      as.forEach((_, k) => achados.add(i + k));
      break;
    }
  }
  return achados;
};

// ——— números em pt-BR ———

// 83000 → "83.000"; 1.5 com 1 casa → "1,5" (sem depender do idioma do navegador)
export const formatar = (valor: number, casas = 0) => {
  const negativo = valor < 0;
  const [inteiro, fracao] = Math.abs(valor).toFixed(Math.max(0, casas)).split(".");
  const milhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negativo ? "−" : ""}${milhar}${fracao ? `,${fracao}` : ""}`;
};
