// Medir e encaixar texto: qualquer texto que o plano mandar cabe no lugar dele.
// Mede com a própria fonte no navegador do render (canvas.measureText, no corpo de verdade, depois
// que as fontes carregaram: o <Edicao> só desenha quando `fontesCarregadas` resolve), quebra em
// linhas e reduz o corpo até um mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
import { mao, sans, serifa } from "./tema";

export type Fonte = "serifa" | "sans" | "mao";

// espaço entre palavras (margem fixa, em frações do corpo) — o mesmo que os componentes desenham
export const ESPACO_PALAVRA = 0.27;

let contexto: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

const familia = (f: Fonte) => (f === "serifa" ? serifa : f === "sans" ? sans : mao);
// reserva sem navegador: média generosa por caractere
const media: Record<Fonte, number> = { serifa: 0.56, sans: 0.58, mao: 0.62 };

// Largura (px) de um texto num corpo `tamanho`. `espacamento` = entre letras, em frações do corpo.
export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = "serifa", peso = 400, espacamento = 0, caixaAlta = false) => {
  const t = caixaAlta ? texto.toUpperCase() : texto;
  const chave = `${fonte}|${peso}|${tamanho}|${t}`;
  let w = cache.get(chave);
  if (w === undefined) {
    if (!contexto && typeof document !== "undefined") contexto = document.createElement("canvas").getContext("2d");
    if (contexto) {
      contexto.font = `${peso} ${tamanho}px "${familia(fonte)}"`;
      w = contexto.measureText(t).width;
    } else w = [...t].length * tamanho * media[fonte];
    cache.set(chave, w);
  }
  // 3% de folga: o navegador arredonda e aplica kerning
  return (w + espacamento * tamanho * Math.max(0, [...t].length - 1)) * 1.03;
};

export type Estilo = { fonte?: Fonte; peso?: number; espacamento?: number; caixaAlta?: boolean };

// Largura de uma linha de palavras desenhadas uma a uma (cada palavra + a margem fixa entre elas).
export const larguraLinha = (palavras: string[], tamanho: number, e: Estilo = {}) =>
  palavras.reduce(
    (soma, w, k) => soma + larguraTexto(w, tamanho, e.fonte, e.peso, e.espacamento, e.caixaAlta) + (k > 0 ? ESPACO_PALAVRA * tamanho : 0),
    0,
  );

// Quebra em linhas que cabem em `largura` (guloso, depois equilibrado: linhas de larguras parecidas,
// sem palavra sozinha no fim). Palavra maior que a linha fica sozinha.
export const quebrar = (texto: string, largura: number, tamanho: number, e: Estilo = {}): string[][] => {
  const ws = texto.split(/\s+/).filter(Boolean);
  const guloso = (limite: number) => {
    const linhas: string[][] = [[]];
    for (const w of ws) {
      const atual = linhas[linhas.length - 1];
      if (atual.length && larguraLinha([...atual, w], tamanho, e) > limite) linhas.push([w]);
      else atual.push(w);
    }
    return linhas.filter((l) => l.length);
  };
  const base = guloso(largura);
  if (base.length < 2) return base;
  // equilibra: aperta o limite enquanto o número de linhas não muda
  let melhor = base;
  for (let l = largura - 12; l > largura * 0.4; l -= 12) {
    const tentativa = guloso(l);
    if (tentativa.length > base.length) break;
    melhor = tentativa;
  }
  return melhor;
};

export type Encaixe = { tamanho: number; linhas: string[][] };

// Maior corpo (de `max` até `min`) em que o texto cabe em até `linhas` linhas de `largura`.
// Menos linhas vale a pena se custar pouco corpo (até ~12% menor). Se nem no mínimo cabe, usa o
// mínimo e deixa quebrar em mais linhas; uma palavra única maior que a caixa ganha um corpo menor.
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, ...e }: { largura: number; max: number; min: number; linhas?: number } & Estilo,
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  const cabe = (tamanho: number, k: number) => {
    const q = quebrar(limpo, largura, tamanho, e);
    return q.length <= k && q.every((l) => larguraLinha(l, tamanho, e) <= largura) ? q : null;
  };
  const melhorEm = (k: number): Encaixe | null => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const q = cabe(tamanho, k);
      if (q) return { tamanho, linhas: q };
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.tamanho >= melhor.tamanho * 0.88) return menos;
    }
    return melhor;
  }
  let tamanho = min;
  const ws = limpo.split(" ");
  const maior = ws.reduce((a, b) => (larguraTexto(b, 10, e.fonte, e.peso, e.espacamento, e.caixaAlta) > larguraTexto(a, 10, e.fonte, e.peso, e.espacamento, e.caixaAlta) ? b : a), "");
  while (tamanho > 20 && larguraTexto(maior, tamanho, e.fonte, e.peso, e.espacamento, e.caixaAlta) > largura) tamanho -= 2;
  return { tamanho, linhas: quebrar(limpo, largura, tamanho, e) };
};

// Um corpo só (uma linha): o maior entre max e min que cabe; abaixo do mínimo só se for preciso.
export const corpoQueCabe = (texto: string, largura: number, max: number, min: number, e: Estilo = {}) => {
  const ws = texto.split(/\s+/).filter(Boolean);
  let tamanho = max;
  while (tamanho > min && larguraLinha(ws, tamanho, e) > largura) tamanho -= 1;
  while (tamanho > 18 && larguraLinha(ws, tamanho, e) > largura) tamanho -= 1;
  return tamanho;
};

// ——— números em pt-BR ———

// 83000 → "83.000"; 1.5 (casas 1) → "1,5"
export const formatarNumero = (valor: number, casas = 0) => {
  const negativo = valor < 0;
  const fixo = Math.abs(valor).toFixed(Math.max(0, casas));
  const [inteiro, dec] = fixo.split(".");
  const milhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negativo ? "−" : ""}${milhar}${dec ? `,${dec}` : ""}`;
};

// ——— trechos dentro de um texto (destaque, risco) ———

const nucleo = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9%$]/g, "");

// Índices [primeiro, último] (na lista de palavras de `texto`) do trecho `alvo`, ou null.
export const trechoNoTexto = (texto: string, alvo?: string): [number, number] | null => {
  if (!alvo?.trim()) return null;
  const ws = texto.split(/\s+/).filter(Boolean).map(nucleo);
  const as = alvo.split(/\s+/).filter(Boolean).map(nucleo).filter(Boolean);
  if (!as.length) return null;
  for (let i = 0; i + as.length <= ws.length; i++) {
    if (as.every((a, k) => ws[i + k] === a)) return [i, i + as.length - 1];
  }
  return null;
};

// ——— rótulos em caixa alta espaçada (títulos de seção, subtítulos) ———
// Medidos como uma linha inteira (o espaço também recebe o espaçamento entre letras).
export const larguraRotulo = (texto: string, tamanho: number, espacamento = 0.16, peso = 700) =>
  larguraTexto(texto, tamanho, "sans", peso, espacamento, true);

// Maior corpo (max → min) em que o rótulo cabe em até `linhas` linhas; abaixo do mínimo só se uma
// palavra sozinha não couber.
export const encaixarRotulo = (texto: string, largura: number, max: number, min: number, linhas = 2, espacamento = 0.16, peso = 700) => {
  const ws = texto.trim().split(/\s+/).filter(Boolean);
  const quebra = (tam: number) => {
    const ls: string[] = [];
    for (const w of ws) {
      const atual = ls[ls.length - 1];
      if (atual && larguraRotulo(`${atual} ${w}`, tam, espacamento, peso) <= largura) ls[ls.length - 1] = `${atual} ${w}`;
      else ls.push(w);
    }
    return ls;
  };
  for (let k = 1; k <= linhas; k++) {
    for (let tam = max; tam >= min; tam -= 1) {
      const ls = quebra(tam);
      if (ls.length <= k && ls.every((l) => larguraRotulo(l, tam, espacamento, peso) <= largura)) return { tamanho: tam, linhas: ls };
    }
  }
  // não coube: aceita um corpo um pouco menor antes de uma linha a mais
  for (let tam = min - 1; tam >= Math.max(16, min - 4); tam -= 1) {
    const ls = quebra(tam);
    if (ls.length <= linhas && ls.every((l) => larguraRotulo(l, tam, espacamento, peso) <= largura)) return { tamanho: tam, linhas: ls };
  }
  let tam = min;
  while (tam > 16 && quebra(tam).some((l) => larguraRotulo(l, tam, espacamento, peso) > largura)) tam -= 1;
  return { tamanho: tam, linhas: quebra(tam) };
};

// Palavra comprida demais para a largura: quebra no hífen que já existe ou com um hífen novo.
export const hifenizar = (texto: string, largura: number, tamanho: number, e: Estilo = {}) =>
  texto
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => {
      if (larguraTexto(w, tamanho, e.fonte, e.peso) <= largura) return [w];
      const partes: string[] = [];
      let resto = w;
      while (resto.length > 3 && larguraTexto(resto, tamanho, e.fonte, e.peso) > largura) {
        const hifen = resto.indexOf("-");
        if (hifen > 1 && larguraTexto(resto.slice(0, hifen + 1), tamanho, e.fonte, e.peso) <= largura) {
          partes.push(resto.slice(0, hifen + 1));
          resto = resto.slice(hifen + 1);
          continue;
        }
        let k = resto.length - 1;
        while (k > 2 && larguraTexto(`${resto.slice(0, k)}-`, tamanho, e.fonte, e.peso) > largura) k--;
        partes.push(`${resto.slice(0, k)}-`);
        resto = resto.slice(k);
      }
      return [...partes, resto];
    })
    .join(" ");
