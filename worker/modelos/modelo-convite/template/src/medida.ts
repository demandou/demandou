// Medir e encaixar texto: qualquer texto que o plano mandar cabe na caixa dele.
// Mede com a fonte de verdade (canvas do navegador do render, depois de as fontes carregarem),
// quebra em linhas e reduz o corpo até um mínimo legível. Nunca corta nem vaza: no mínimo, aceita
// uma linha a mais; uma palavra única maior que a caixa ganha um corpo menor.
import { caligrafia, gravado, texto, textoItalico } from "./tema";

export type Estilo = {
  familia: string;
  peso: number;
  italico?: boolean;
  caixaAlta?: boolean;
  // espaçamento entre letras, em em
  espacamento?: number;
  // tamanho relativo ao corpo da linha (destaque em caligrafia = 1,45)
  escala?: number;
  // altura da linha, em em (do maior corpo da linha)
  entrelinha?: number;
};

export const E = {
  caligrafia: { familia: caligrafia, peso: 400, entrelinha: 1.16 } as Estilo,
  gravado: { familia: gravado, peso: 600, caixaAlta: true, espacamento: 0.14, entrelinha: 1.25 } as Estilo,
  numero: { familia: gravado, peso: 600, entrelinha: 1.12 } as Estilo,
  texto: { familia: texto, peso: 600, entrelinha: 1.14 } as Estilo,
  italico: { familia: textoItalico, peso: 500, italico: true, entrelinha: 1.18 } as Estilo,
};

const REF = 100;
const cache = new Map<string, number>();
let contexto: CanvasRenderingContext2D | null = null;
// só guarda medidas depois que as fontes carregaram (a Edicao avisa; antes disso, mede sem guardar)
let fontesOk = false;
export const avisarFontesProntas = () => {
  fontesOk = true;
};

const fonteCss = (e: Estilo, tamanho: number) => `${e.italico ? "italic " : ""}${e.peso} ${tamanho}px "${e.familia}"`;

const estimar = (t: string, e: Estilo) => {
  // sem canvas (ou fonte ainda não carregada): largura média generosa
  const media = e.familia === caligrafia ? 0.42 : e.caixaAlta ? 0.72 : 0.5;
  return [...t].length * media * REF;
};

const larguraRef = (t: string, e: Estilo) => {
  const chave = `${fonteCss(e, REF)}|${t}`;
  const guardada = cache.get(chave);
  if (guardada !== undefined) return guardada;
  if (typeof document === "undefined") return estimar(t, e);
  if (!contexto) contexto = document.createElement("canvas").getContext("2d");
  if (!contexto) return estimar(t, e);
  const fonte = fonteCss(e, REF);
  const pronta = fontesOk && (typeof document.fonts?.check === "function" ? document.fonts.check(fonte, t) : true);
  contexto.font = fonte;
  const medida = contexto.measureText(t);
  // a caligrafia tem floreios que passam da largura de avanço: conta a tinta de verdade
  const tinta = Math.max(medida.width, (medida.actualBoundingBoxLeft ?? 0) + (medida.actualBoundingBoxRight ?? 0));
  if (pronta) cache.set(chave, tinta);
  return pronta ? tinta : Math.max(tinta, estimar(t, e));
};

// Largura em px de um texto num corpo `tamanho` (já com a escala e o espaçamento do estilo).
export const largura = (txt: string, tamanho: number, e: Estilo) => {
  const t = e.caixaAlta ? txt.toUpperCase() : txt;
  const corpo = tamanho * (e.escala ?? 1);
  const esp = (e.espacamento ?? 0) * corpo * [...t].length;
  return (larguraRef(t, e) / REF) * corpo + esp;
};

export type Pedaco = { w: string; e: Estilo };

// largura de uma linha de palavras com a margem fixa entre elas (`gap` em em do corpo)
export const larguraLinha = (ps: Pedaco[], tamanho: number, gap: number) =>
  ps.reduce((s, p) => s + largura(p.w, tamanho, p.e), 0) + Math.max(0, ps.length - 1) * gap * tamanho;

export const alturaLinha = (ps: Pedaco[], tamanho: number) =>
  Math.max(...ps.map((p) => tamanho * (p.e.escala ?? 1) * (p.e.entrelinha ?? 1.15)), tamanho);

// Quebra gulosa e depois equilibrada (a menor largura que dá o mesmo número de linhas).
// `equilibrar: false` deixa a quebra gulosa (igual à do navegador).
export const quebrar = (ps: Pedaco[], tamanho: number, max: number, gap: number, equilibrar = true): number[][] => {
  // um símbolo solto ("+", "=", "·") fica preso às palavras dos dois lados: "Command + Shift + 4"
  // nunca quebra em "Command +" / "Shift"
  const solto = (k: number) => k >= 0 && k < ps.length && /^[+=&·×/–—-]+$/.test(ps[k].w);
  const podeQuebrarAntes = (k: number) => !solto(k) && !solto(k - 1);
  const guloso = (limite: number) => {
    const linhas: number[][] = [[]];
    ps.forEach((_, i) => {
      const atual = linhas[linhas.length - 1];
      const tentativa = [...atual, i].map((k) => ps[k]);
      if (atual.length && larguraLinha(tentativa, tamanho, gap) > limite) {
        // volta até o último ponto em que a quebra é permitida (se houver um nesta linha)
        let corte = atual.length;
        while (corte > 0 && !podeQuebrarAntes(corte < atual.length ? atual[corte] : i)) corte--;
        if (corte > 0 && corte < atual.length) {
          linhas[linhas.length - 1] = atual.slice(0, corte);
          linhas.push([...atual.slice(corte), i]);
        } else linhas.push([i]);
      } else atual.push(i);
    });
    return linhas.filter((l) => l.length);
  };
  const base = guloso(max);
  if (base.length < 2 || !equilibrar) return base;
  let melhor = base;
  for (let l = max - 16; l > max * 0.5; l -= 16) {
    const tentativa = guloso(l);
    if (tentativa.length > base.length) break;
    melhor = tentativa;
  }
  return melhor;
};

export type Encaixe = { tamanho: number; linhas: number[][]; altura: number; largura: number };

// O maior corpo (de `max` a `min`, de 2 em 2 px) em que as palavras cabem em `linhas` linhas,
// na largura e (se dada) na altura. Menos linhas vale se custar pouco corpo.
export const encaixar = (
  ps: Pedaco[],
  {
    largura: L,
    max,
    min,
    linhas = 2,
    altura,
    gap = 0.26,
    equilibrar = true,
  }: { largura: number; max: number; min: number; linhas?: number; altura?: number; gap?: number; equilibrar?: boolean },
): Encaixe => {
  const medir = (tamanho: number, quebra: number[][]): Encaixe => ({
    tamanho,
    linhas: quebra,
    altura: quebra.reduce((s, l) => s + alturaLinha(l.map((k) => ps[k]), tamanho), 0),
    largura: Math.max(0, ...quebra.map((l) => larguraLinha(l.map((k) => ps[k]), tamanho, gap))),
  });
  if (ps.length === 0) return { tamanho: max, linhas: [], altura: 0, largura: 0 };
  const melhorEm = (k: number) => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const q = quebrar(ps, tamanho, L, gap, equilibrar);
      const r = medir(tamanho, q);
      if (q.length <= k && r.largura <= L + 0.5 && (altura === undefined || r.altura <= altura)) return r;
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.tamanho >= melhor.tamanho * 0.86) return menos;
    }
    return melhor;
  }
  // não coube nem no mínimo: desce mais um pouco (até 75% do mínimo) até caber na largura e na altura
  let tamanho = min;
  let r = medir(tamanho, quebrar(ps, tamanho, L, gap, equilibrar));
  while (tamanho > min * 0.75 && (r.largura > L + 0.5 || (altura !== undefined && r.altura > altura))) {
    tamanho -= 2;
    r = medir(tamanho, quebrar(ps, tamanho, L, gap, equilibrar));
  }
  return r;
};

// ——— trechos dentro de um texto (destaque, risco) ———

const nucleo = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^[^\p{L}\p{N}$%]+|[^\p{L}\p{N}%]+$/gu, "");

// índices das palavras de `palavras` que formam `alvo` (primeira ocorrência)
export const indicesDe = (palavras: string[], alvo?: string): Set<number> => {
  const marcadas = new Set<number>();
  if (!alvo?.trim()) return marcadas;
  const ws = palavras.map(nucleo);
  const as = alvo.split(/\s+/).filter(Boolean).map(nucleo);
  for (let i = 0; i + as.length <= ws.length; i++) {
    if (as.every((a, k) => ws[i + k] === a)) {
      as.forEach((_, k) => marcadas.add(i + k));
      break;
    }
  }
  return marcadas;
};

// texto com algarismo ou símbolo ("Ctrl + T", "R$ 500", "3x"): letra gravada em vez de caligrafia
export const pedeGravado = (t: string) => /[0-9+=&@#/\\%$€£×*<>_|]/.test(t);

export const separar = (t: string) => t.split(/\s+/).filter(Boolean);
