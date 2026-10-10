// Medida de texto (só depois que as fontes carregaram), para caber cada anotação no seu espaço.
import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { esperarFontes, mao, mono, sans } from "./tema";

let prontas = false;
let contexto: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();
const ctx = () => {
  if (!contexto) contexto = document.createElement("canvas").getContext("2d");
  return contexto as CanvasRenderingContext2D;
};

export type Familia = "mao" | "mono" | "sans";
const FAMILIA: Record<Familia, () => string> = { mao: () => mao, mono: () => mono, sans: () => sans };

export const largura = (texto: string, px: number, familia: Familia = "mao", peso = 700, espacamento = 0) => {
  const chave = `${familia}|${peso}|${px}|${espacamento}|${texto}`;
  const guardada = cache.get(chave);
  if (guardada !== undefined) return guardada;
  const c = ctx();
  c.font = `${peso} ${px}px "${FAMILIA[familia]()}"`;
  const w = c.measureText(texto).width + espacamento * px * texto.length;
  if (prontas) cache.set(chave, w);
  return w;
};

// Maior corpo (entre `min` e `max`) em que o texto cabe na largura
export const caber = (texto: string, larguraMax: number, max: number, min: number, familia: Familia = "mao", peso = 700) => {
  const w100 = largura(texto, 100, familia, peso);
  return Math.max(min, Math.min(max, Math.floor((larguraMax / Math.max(1, w100)) * 100)));
};

// Quebra um texto em até `linhas` linhas que caibam na largura, no maior corpo possível. Para cada
// número de linhas, procura a divisão em que a linha mais larga é a menor (busca completa: os textos
// de tela são curtos); fica com menos linhas quando o corpo não melhora.
export const quebrar = (texto: string, larguraMax: number, max: number, min: number, linhas = 2, peso = 700) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return { corpo: max, linhas: [""] };
  const larg = (de: number, ate: number) => largura(palavras.slice(de, ate).join(" "), 100, "mao", peso);
  let melhor = { corpo: min, linhas: [palavras.join(" ")] };
  let melhorReal = 0;
  for (let n = 1; n <= Math.min(linhas, palavras.length, 4); n++) {
    // todas as divisões em n linhas (cortes crescentes); guarda a de menor linha mais larga
    let melhorCortes: number[] = [];
    let menorMaior = Infinity;
    const tentar = (cortes: number[], de: number, maior: number) => {
      if (maior >= menorMaior) return;
      if (cortes.length === n - 1) {
        const total = Math.max(maior, larg(de, palavras.length));
        if (total < menorMaior) {
          menorMaior = total;
          melhorCortes = [...cortes];
        }
        return;
      }
      for (let c = de + 1; c <= palavras.length - (n - 1 - cortes.length); c++) tentar([...cortes, c], c, Math.max(maior, larg(de, c)));
    };
    tentar([], 0, 0);
    const limites = [0, ...melhorCortes, palavras.length];
    const textos = limites.slice(0, -1).map((de, i) => palavras.slice(de, limites[i + 1]).join(" "));
    // o corpo em que esta divisão cabe de verdade (sem o piso `min`: é ele que decide quantas linhas)
    const real = Math.min(max, Math.floor((larguraMax / Math.max(1, menorMaior)) * 100));
    if (real > melhorReal + 2 || n === 1) {
      melhorReal = real;
      melhor = { corpo: Math.max(min, real), linhas: textos };
    }
  }
  return melhor;
};

// Texto que SEMPRE cabe: o maior corpo entre `min` e `max` em até `linhas` linhas; se nem no
// mínimo couber (palavra enorme), desce abaixo do mínimo só o necessário (nunca vaza).
export const ajustar = (texto: string, larguraMax: number, max: number, min: number, linhas = 2, peso = 700) => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  const q = quebrar(limpo, larguraMax, max, min, linhas, peso);
  const maior = Math.max(...q.linhas.map((l) => largura(l, 100, "mao", peso)));
  const cabe = Math.floor((larguraMax / Math.max(1, maior)) * 100);
  return { corpo: Math.max(Math.min(q.corpo, cabe), Math.round(min * 0.62)), linhas: q.linhas };
};

// Mesmo para o texto impresso (mono, caixa-alta espaçada): corpo de `max` até `min`
export const caberImpresso = (texto: string, larguraMax: number, max = 34, min = 30, espacamento = 0.12) => {
  const w100 = largura(texto.toUpperCase(), 100, "mono", 700, espacamento);
  return Math.max(Math.round(min * 0.8), Math.min(max, Math.floor((larguraMax / Math.max(1, w100)) * 100)));
};

// Segura o render até as fontes carregarem; depois disso as medidas ficam certas.
export const useFontesProntas = () => {
  const [pronto, setPronto] = useState(prontas);
  const [espera] = useState(() => (prontas ? null : delayRender("fontes do caderno")));
  useEffect(() => {
    if (prontas) return;
    esperarFontes().then(() => {
      prontas = true;
      cache.clear();
      setPronto(true);
    });
  }, []);
  useEffect(() => {
    if (pronto && espera !== null) continueRender(espera);
  }, [pronto, espera]);
  return pronto;
};
