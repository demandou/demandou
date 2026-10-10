import { loadFont as carregarMono } from "@remotion/google-fonts/DMMono";
import { loadFont as carregarUnbounded } from "@remotion/google-fonts/Unbounded";
import type { Campo } from "./plano";

// Duas famílias. Unbounded (larga e pesada) para tudo que é grande: as palavras-janela, os
// pôsteres e a legenda (sempre em CAIXA-ALTA: em caixa-baixa o "I" dela parece um "l").
// DM Mono para os letreiros pequenos (número do pôster, assinatura): o I tem serifa e o l tem rabo.
export const display = carregarUnbounded("normal", {
  weights: ["500", "700", "900"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;
export const mono = carregarMono("normal", { weights: ["500"], subsets: ["latin", "latin-ext"] }).fontFamily;

// Preto, um azul-cobalto elétrico e um branco frio. Nada de degradê.
export const cor = {
  preto: "#0A0A0C",
  cobalto: "#2A3CFF",
  // branco frio (fundo "papel" dos pôsteres claros e texto sobre o cobalto)
  gelo: "#EEEFF1",
  // palavra riscada: perde a força
  riscada: "#9A9CA6",
};

// Os dois fundos de pôster. Em cada um: a cor do campo, a do texto, a do acento (risco, destaque),
// a do "lápis" (o esboço apagado do que ainda vai ser dito) e a força da `luz`: uma janela suave só
// em volta do rosto, que aparece quando as letras se abrem, para o rosto continuar inteiro onde um
// vão ou miolo de letra passa por ele. Fora das letras e da luz, o campo é sólido.
export const CAMPOS: Record<
  Campo,
  { fundo: string; texto: string; acento: string; letreiro: string; riscada: string; lapis: string; luz: number }
> = {
  cobalto: {
    fundo: cor.cobalto,
    texto: cor.gelo,
    acento: cor.preto,
    letreiro: "rgba(238,239,241,0.82)",
    riscada: "rgba(238,239,241,0.45)",
    lapis: "rgba(238,239,241,0.11)",
    luz: 0.42,
  },
  papel: {
    fundo: cor.gelo,
    texto: cor.preto,
    acento: cor.cobalto,
    letreiro: "rgba(10,10,12,0.72)",
    riscada: cor.riscada,
    lapis: "rgba(10,10,12,0.075)",
    luz: 0.4,
  },
  // o terceiro campo: preto, para o alerta (o que dá errado, o risco). Texto gelo, acento cobalto.
  preto: {
    fundo: cor.preto,
    texto: cor.gelo,
    acento: cor.cobalto,
    letreiro: "rgba(238,239,241,0.72)",
    riscada: "rgba(238,239,241,0.42)",
    lapis: "rgba(238,239,241,0.12)",
    luz: 0.4,
  },
};
// tamanho da luz em volta do rosto (px, no vídeo sem zoom): meia largura e meia altura do rosto, com folga
export const LUZ = { rx: 230, ry: 300 };

// ——— Medidas do quadro (1080×1920) ———
export const QUADRO = { w: 1080, h: 1920 };
// faixa útil dos pôsteres: abaixo dos letreiros do topo, acima da interface do app
export const TOPO_UTIL = 210;
export const BASE_UTIL = 1500;
// com a assinatura (último pôster), o conteúdo para antes dela
export const BASE_COM_ASSINATURA = 1420;
// abaixo desta linha fica a interface do Instagram/TikTok
export const LIMITE_APP = 1600;
// largura máxima da palavra-janela e das linhas de texto
export const LARGURA_JANELA = 1000;
export const LARGURA_TEXTO = 960;
// letreiros fixos do topo (número do pôster e área)
export const LETREIRO_Y = 136;
export const MARGEM = 60;

// ——— Métricas da Unbounded (tiradas da própria fonte) ———
// altura da maiúscula, do acento acima dela e da cedilha abaixo da linha, em "em"
export const MAIUSCULA = 0.768;
export const ACENTO = 0.23;
export const CEDILHA = 0.27;
// numa caixa de linha com line-height 1, a maiúscula começa 0,107 em abaixo do topo da caixa
export const TOPO_DA_MAIUSCULA = 0.107;

const CARACTERES = "ABCDEFGHIJKLMNOPQRSTUVWXYZÁÀÂÃÉÊÍÓÔÕÚÇÜ0123456789 .,:;!?%/-–—×+'\"()&@#$º…=→<>*€£ª";
const AVANCO: Record<500 | 700 | 900, number[]> = {
  900: [
    996, 907, 949, 946, 812, 791, 976, 956, 378, 824, 895, 781, 1275, 995, 976, 837, 977, 876, 870, 840, 889, 968, 1390, 922, 957, 830,
    996, 996, 996, 996, 812, 812, 378, 976, 976, 976, 889, 949, 889, 946, 552, 865, 862, 899, 828, 878, 785, 918, 878, 236, 328, 330,
    350, 350, 352, 739, 1349, 485, 384, 670, 1230, 620, 620, 306, 562, 430, 430, 982, 1066, 877,
    843, 624, 950, 620, 890, 620, 620, 548, 883, 842, 671,
  ],
  700: [
    957, 883, 934, 926, 794, 771, 964, 938, 347, 806, 870, 764, 1236, 972, 965, 814, 965, 850, 843, 818, 878, 935, 1360, 870, 923, 808,
    957, 957, 957, 957, 794, 794, 347, 965, 965, 965, 878, 934, 878, 925, 520, 835, 839, 861, 807, 857, 753, 892, 857, 248, 300, 302,
    328, 330, 323, 705, 1294, 459, 371, 660, 1203, 620, 620, 275, 506, 390, 390, 940, 1046, 857,
    812, 609, 854, 620, 876, 620, 620, 536, 872, 816, 645,
  ],
  500: [
    928, 865, 923, 911, 780, 755, 955, 924, 323, 792, 851, 751, 1206, 954, 956, 796, 957, 830, 823, 801, 870, 910, 1338, 832, 897, 791,
    928, 928, 928, 928, 780, 780, 323, 956, 956, 956, 870, 923, 870, 909, 495, 812, 821, 832, 791, 841, 728, 873, 841, 256, 279, 282,
    311, 316, 302, 679, 1252, 440, 361, 652, 1182, 620, 620, 252, 464, 361, 361, 909, 1031, 842,
    788, 597, 783, 620, 866, 620, 620, 528, 864, 796, 625,
  ],
};

export const caixaAlta = (s: string) => s.toLocaleUpperCase("pt-BR");

// Largura de um texto (já em caixa-alta) em "em", com o espaçamento entre letras em em.
export const larguraEm = (texto: string, peso: 500 | 700 | 900 = 900, espacamento = 0) => {
  const tabela = AVANCO[peso];
  let soma = 0;
  const letras = [...caixaAlta(texto)];
  for (const c of letras) {
    const i = CARACTERES.indexOf(c);
    soma += i >= 0 ? tabela[i] / 1000 : 0.9;
  }
  return soma + Math.max(0, letras.length - 1) * espacamento;
};

// Tamanho que faz o texto caber em `largura` px, sem passar de `maximo`.
export const caber = (texto: string, largura: number, maximo: number, peso: 500 | 700 | 900 = 900, espacamento = 0) =>
  Math.min(maximo, Math.floor(largura / Math.max(0.5, larguraEm(texto, peso, espacamento))));

// a linha tem acento acima da maiúscula? tem cedilha (ou rabo do Q, vírgula) abaixo da linha?
export const temAcento = (s: string) => /[ÁÀÂÃÉÊÍÓÔÕÚÜ]/.test(caixaAlta(s));
export const temCedilha = (s: string) => /[ÇQ,;]/.test(caixaAlta(s));

// Espaçamento entre letras das palavras grandes (a Unbounded é larga; junta um pouco).
export const APERTO = -0.02;

export const letreiro: React.CSSProperties = {
  fontFamily: mono,
  fontWeight: 500,
  fontSize: 32,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  lineHeight: 1,
};

// ——— Encaixe de texto (qualquer texto cabe: mede, quebra e reduz até um mínimo legível) ———
// O espaço entre palavras nas linhas animadas é uma margem fixa de 0,3 em (ver Texto.tsx).
export const VAO_PALAVRA = 0.3;
const larguraDaLinha = (larguras: number[], i: number, j: number) => {
  let soma = 0;
  for (let k = i; k < j; k++) soma += larguras[k];
  return soma + Math.max(0, j - i - 1) * VAO_PALAVRA;
};

// Divide as palavras em `k` linhas que cabem em `limite` (em), as mais parecidas possível entre si
// (menor soma das sobras ao quadrado): "CICLO DE / ALTA DAS / CRIPTOMOEDAS", e não "CICLO / DE ALTA DAS".
const dividir = (larguras: number[], k: number, limite: number): number[] | null => {
  const n = larguras.length;
  if (k > n) return null;
  const memo = new Map<string, { cortes: number[]; custo: number } | null>();
  const resolver = (i: number, resta: number): { cortes: number[]; custo: number } | null => {
    if (resta === 1) {
      const w = larguraDaLinha(larguras, i, n);
      return w <= limite ? { cortes: [], custo: (limite - w) ** 2 } : null;
    }
    const chave = `${i}:${resta}`;
    if (memo.has(chave)) return memo.get(chave)!;
    let melhor: { cortes: number[]; custo: number } | null = null;
    for (let j = i + 1; j <= n - resta + 1; j++) {
      const w = larguraDaLinha(larguras, i, j);
      if (w > limite) break;
      const resto = resolver(j, resta - 1);
      if (!resto) continue;
      const custo = (limite - w) ** 2 + resto.custo;
      if (!melhor || custo < melhor.custo) melhor = { cortes: [j, ...resto.cortes], custo };
    }
    memo.set(chave, melhor);
    return melhor;
  };
  return resolver(0, k)?.cortes ?? null;
};

export type Encaixe = { linhas: string[][]; tamanho: number; peso: 500 | 700 | 900 };

// Palavras que não se separam numa quebra de linha: moeda + número + "mil/mi/bi" ("R$ 100 MIL"),
// número + "%" solto.
const MOEDA = /^(R\$|US\$|U\$|€|£|\$)$/;
const ESCALA = /^(MIL|MI|BI|MILHÃO|MILHÕES|BILHÃO|BILHÕES|%)[.,;:!?…]*$/;
const NUMERO = /^[\d.,]+$/;
const blocosInquebraveis = (ws: string[]) => {
  const blocos: string[][] = [];
  ws.forEach((w, i) => {
    const ultimo = blocos[blocos.length - 1];
    const ant = ws[i - 1];
    const cola = ant !== undefined && ((MOEDA.test(ant) && NUMERO.test(w.replace(/[.,;:!?…]+$/, ""))) || (NUMERO.test(ant) && ESCALA.test(w)));
    if (cola && ultimo) ultimo.push(w);
    else blocos.push([w]);
  });
  return blocos;
};

// O maior corpo (de `maximo` a `minimo`) em que o texto cabe em até `maxLinhas` linhas de `largura` px.
// Mais linhas só ganham de menos linhas se deixarem a letra bem maior (uma ideia por linha,
// sem picar a frase). Se nem no mínimo cabe, aceita mais linhas; uma palavra sozinha maior que a
// linha ganha um corpo menor ainda (nunca vaza). Abaixo de 70 px o peso cai para 700.
const encaixesFeitos = new Map<string, Encaixe>();
export const encaixar = (
  palavras: string[],
  largura: number,
  maximo: number,
  minimo: number,
  maxLinhas = 2,
  pesoGrande: 700 | 900 = 900,
): Encaixe => {
  // a diagramação testa muitas escalas: o mesmo encaixe é calculado uma vez só
  const chave = `${palavras.join(" ")}|${largura}|${Math.round(maximo)}|${minimo}|${maxLinhas}|${pesoGrande}`;
  const feito = encaixesFeitos.get(chave);
  if (feito) return feito;
  const r = encaixarSemGuardar(palavras, largura, maximo, minimo, maxLinhas, pesoGrande);
  encaixesFeitos.set(chave, r);
  return r;
};

const encaixarSemGuardar = (
  palavras: string[],
  largura: number,
  maximo: number,
  minimo: number,
  maxLinhas: number,
  pesoGrande: 700 | 900,
): Encaixe => {
  const ws = palavras.map(caixaAlta).filter(Boolean);
  if (ws.length === 0) return { linhas: [], tamanho: minimo, peso: pesoGrande };
  const blocos = blocosInquebraveis(ws);
  const pesoDe = (tam: number): 500 | 700 | 900 => (tam < 70 ? 700 : pesoGrande);
  const largurasDe = (peso: 500 | 700 | 900) =>
    blocos.map((b) => b.reduce((soma, w) => soma + larguraEm(w, peso, APERTO), 0) + (b.length - 1) * VAO_PALAVRA);
  const montar = (cortes: number[]) => {
    const bordas = [0, ...cortes, blocos.length];
    return bordas.slice(0, -1).map((b, i) => blocos.slice(b, bordas[i + 1]).flat());
  };
  // para cada número de linhas, o maior corpo em que cabe
  let melhor: { k: number; tam: number; cortes: number[]; nota: number } | null = null;
  for (let k = 1; k <= Math.min(maxLinhas, blocos.length); k++) {
    for (let tam = Math.round(maximo); tam >= minimo; tam -= 2) {
      const cortes = dividir(largurasDe(pesoDe(tam)), k, largura / tam);
      if (cortes) {
        const nota = tam * (1 - 0.2 * (k - 1));
        if (!melhor || nota > melhor.nota) melhor = { k, tam, cortes, nota };
        break;
      }
    }
  }
  if (melhor) return { linhas: montar(melhor.cortes), tamanho: melhor.tam, peso: pesoDe(melhor.tam) };
  // no mínimo: quantas linhas precisar, e a palavra mais larga manda no corpo
  const peso = pesoDe(minimo);
  const larguras = largurasDe(peso);
  const tam = Math.min(minimo, Math.floor(largura / Math.max(...larguras)));
  const limite = largura / tam;
  const linhas: string[][] = [];
  let atual: string[] = [];
  let soma = 0;
  blocos.forEach((b, i) => {
    const extra = (atual.length ? VAO_PALAVRA : 0) + larguras[i];
    if (atual.length && soma + extra > limite) {
      linhas.push(atual);
      atual = [];
      soma = 0;
    }
    soma += (atual.length ? VAO_PALAVRA : 0) + larguras[i];
    atual.push(...b);
  });
  if (atual.length) linhas.push(atual);
  return { linhas, tamanho: tam, peso };
};

// DM Mono (letreiros): todas as letras têm 0,6 em.
export const larguraMono = (texto: string, tamanho = 32, espacamento = 0.14) => {
  const n = [...texto].length;
  return (n * 0.6 + Math.max(0, n - 1) * espacamento) * tamanho;
};

// Quebra um letreiro (DM Mono) em linhas que cabem em `largura`.
export const quebrarMono = (texto: string, largura: number, tamanho = 32) => {
  const linhas: string[] = [];
  let atual = "";
  for (const w of caixaAlta(texto).split(/\s+/).filter(Boolean)) {
    const tentativa = atual ? `${atual} ${w}` : w;
    if (!atual || larguraMono(tentativa, tamanho) <= largura) atual = tentativa;
    else {
      linhas.push(atual);
      atual = w;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
};

// Números em pt-BR: 83.000 · 1,5 · 12,75
export const numeroBR = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
