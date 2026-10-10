import { loadFont as carregarParkinsans } from "@remotion/google-fonts/Parkinsans";

// Parkinsans: sans geométrica, aberta e legível no celular. Uma família só, em vários pesos.
// Escolhida também porque o I maiúsculo tem serifa: "Iogurte", "Inglês", "IPTU" não viram "l".
export const fonte = carregarParkinsans("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;

// Fresco e alegre sem ser infantil: creme de papel, areia, azul-petróleo e UM acento coral.
export const cor = {
  creme: "#F4ECE1",
  areia: "#E8DAC7",
  // areia mais escura: trilhos vazios, células por preencher
  areiaFunda: "#D9C7B0",
  petroleo: "#0F4B5A",
  // o "tampo da mesa" onde as páginas deslizam, e o cartão ENTRA
  petroleoFundo: "#0A3440",
  coral: "#E9684C",
  // texto secundário sobre creme
  petroleoSuave: "rgba(15,75,90,0.66)",
  // texto riscado / o que sai
  apagado: "rgba(15,75,90,0.42)",
};

// Geometria do quadro (px, 1080×1920)
export const W = 1080;
export const H = 1920;
// espaço entre as páginas no trilho (aparece como uma faixa petróleo durante o deslize)
export const VAO = 34;
export const MARGEM = 60;
// topo seguro (abaixo das abas do TikTok e do título "Reels")
export const TOPO = 176;
// canto reservado ao contador "3/7" (nenhuma página põe conteúdo aqui)
export const CONTADOR = { direita: MARGEM, topo: TOPO + 8, largura: 150, altura: 68 };
export const ABAIXO_DO_CONTADOR = CONTADOR.topo + CONTADOR.altura + 20;
// faixa da legenda e do indicador de páginas: acima da interface do app (y < 1560)
export const LEGENDA_Y = 1414;
export const PONTOS_Y = 1520;
export const PONTOS_ALTURA = 40;
export const LIMITE_APP = 1560;
// base útil do conteúdo de uma página (acima da faixa da legenda)
export const BASE_CONTEUDO = 1392;
// páginas de conteúdo sem legenda descem até logo acima dos pontinhos
export const BASE_SEM_LEGENDA = 1490;

// Zona padrão dos cartões nas páginas da pessoa (abaixo do queixo). O plano pode mover (campo `zona`).
export const zona = { topo: 985, altura: 420 };

// Largura média de um caractere da Parkinsans, em frações do tamanho (medida: 0,55–0,56 nos pesos
// 500–800; 0,60 dá folga). Serve para caber texto sem medir o DOM.
export const LARGURA_FONTE = 0.6;

// quantos caracteres cabem numa linha desta largura, neste corpo
export const cabem = (largura: number, tamanho: number) => Math.max(4, Math.floor(largura / (tamanho * LARGURA_FONTE)));

// o maior corpo (até `maximo`) em que o texto cabe numa linha desta largura
export const caber = (texto: string, largura: number, maximo: number, minimo = 30) =>
  Math.max(minimo, Math.min(maximo, Math.floor(largura / (Math.max(texto.length, 1) * LARGURA_FONTE))));

// Quebra um texto no menor número de linhas (até `max`) em que cada linha cabe em `limite`
// caracteres, com as linhas equilibradas. Se nem com `max` linhas couber, usa `max` linhas.
export const quebrar = (texto: string, limite: number, max = 2): string[] => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.length <= 1) return [palavras.join(" ")];
  // todas as divisões possíveis em n linhas (textos curtos: busca completa é barata)
  const divisoes = (n: number): string[][] => {
    const cortes = (inicio: number, resto: number): number[][] => {
      if (resto === 1) return [[palavras.length]];
      const saida: number[][] = [];
      for (let k = inicio + 1; k <= palavras.length - resto + 1; k++) for (const c of cortes(k, resto - 1)) saida.push([k, ...c]);
      return saida;
    };
    return cortes(0, n).map((c) => {
      let a = 0;
      return c.map((fim) => {
        const l = palavras.slice(a, fim).join(" ");
        a = fim;
        return l;
      });
    });
  };
  const maior = (ls: string[]) => Math.max(...ls.map((l) => l.length));
  const teto = Math.min(max, palavras.length);
  for (let n = 1; n <= teto; n++) {
    const melhores = divisoes(n).sort((a, b) => maior(a) - maior(b));
    if (maior(melhores[0]) <= limite || n === teto) return melhores[0];
  }
  return [texto];
};

// Rótulo em caixa alta, espaçado (acima dos títulos, "SAI", "ENTRA")
export const rotulo: React.CSSProperties = {
  fontFamily: fonte,
  fontWeight: 700,
  fontSize: 34,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  lineHeight: 1,
};

// Sombra de cartão sobre a pessoa: macia e baixa (não é brilho nem contorno)
export const sombraCartao = "0 18px 50px rgba(10,52,64,0.22), 0 2px 6px rgba(10,52,64,0.10)";
