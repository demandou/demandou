import { loadFont as carregarBodoni } from "@remotion/google-fonts/BodoniModa";
import { loadFont as carregarJost } from "@remotion/google-fonts/Jost";

// Bodoni Moda (didone de revista de beleza): títulos, números, nomes. Jost (sans geométrica fina):
// rótulos em caixa alta espaçada, legenda, números pequenos. As duas gratuitas, pelo Google Fonts.
carregarBodoni("italic", { weights: ["400", "500"], subsets: ["latin", "latin-ext"] });
export const serif = carregarBodoni("normal", { weights: ["400", "500", "600"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const sans = carregarJost("normal", { weights: ["300", "400", "500"], subsets: ["latin", "latin-ext"] }).fontFamily;

// Luxo discreto: champanhe, café (espresso), um dourado sóbrio. Nada além disso.
export const cor = {
  champanhe: "#EFE6DA",
  // champanhe um tom abaixo: áreas de apoio, fundo do mapa atrás do rosto
  nude: "#E4D5C3",
  cafe: "#2B1E17",
  // café diluído: traços secundários, rótulos apagados
  cafeSuave: "rgba(43,30,23,0.5)",
  cafeLinha: "rgba(43,30,23,0.24)",
  ouro: "#A68A5B",
  // ouro mais escuro: texto dourado sobre champanhe (contraste para ler no celular)
  ouroTexto: "#86683D",
  // ouro bem diluído: preenchimento das áreas que acendem (nunca texto)
  ouroVeu: "rgba(166,138,91,0.20)",
  // bordô queimado: só o alerta (destaque de alerta, o que é riscado, o lado errado). Nunca enfeite.
  alerta: "#8C3B33",
};

// Fontes para medir o texto (medida.ts): as mesmas dos componentes
export const FONTE_TITULO = { familia: "serif", peso: 500 } as const;
export const FONTE_ITALICO = { familia: "serif", peso: 400, italico: true } as const;
export const FONTE_ITALICO_500 = { familia: "serif", peso: 500, italico: true } as const;
// rótulo em caixa alta: Jost 500, espaçamento 0,2em, meia letra entre as palavras
export const FONTE_ROTULO = { familia: "sans", peso: 500, caixaAlta: true, espacamento: 0.2, vao: 0.5 } as const;

// Espessuras de traço (px no quadro 1080×1920), pensadas para a tela do celular
export const traco = { contorno: 3.6, detalhe: 2.6, fino: 1.8 };

// Legenda em tela cheia e limite da interface dos apps
export const LEGENDA_Y = 1436;
export const LIMITE_APP = 1560;
// No alto da tela, a interface do app (nome do Reels, abas do TikTok) ocupa até ~150 px
export const TOPO_SEGURO = 168;
// Margens da faixa de cima: nada encosta na borda esquerda, e nada passa de x 960 (os botões do
// app ficam nos 120 px da direita)
export const MARGEM_ESQUERDA = 60;
export const LIMITE_DIREITO = 960;
// Respiro entre o conteúdo da faixa de cima e a linha do espelho
export const FOLGA_DA_LINHA = 40;

// Largura média de um caractere, em frações do tamanho da fonte (para caber texto sem medir o DOM)
export const LARGURA_BODONI = 0.5;
export const LARGURA_JOST = 0.56;
// caixa alta com espaçamento largo ocupa mais
export const LARGURA_ROTULO = 0.84;

export const caber = (texto: string, largura: number, maximo: number, fator = LARGURA_BODONI) =>
  Math.min(maximo, Math.floor(largura / (Math.max(texto.length, 1) * fator)));

// Maior corpo em que o texto cabe em uma linha; se ficar pequeno demais, em duas linhas equilibradas
export const tamanhoEmAteDuasLinhas = (texto: string, largura: number, maximo: number, minimo: number, fator = LARGURA_BODONI) => {
  const umaLinha = caber(texto, largura, maximo, fator);
  if (umaLinha >= Math.min(maximo, minimo + 6)) return umaLinha;
  const palavras = texto.split(/\s+/);
  let melhor = texto.length;
  for (let i = 1; i < palavras.length; i++) {
    const a = palavras.slice(0, i).join(" ").length;
    const b = palavras.slice(i).join(" ").length;
    melhor = Math.min(melhor, Math.max(a, b));
  }
  return Math.max(minimo, Math.min(maximo, Math.floor(largura / (Math.max(melhor, 1) * fator))));
};

// Quantas linhas um texto ocupa numa largura, com quebra por palavra
export const contarLinhas = (texto: string, largura: number, tamanho: number, fator = LARGURA_BODONI) => {
  let linhas = 1;
  let atual = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const lw = w.length * tamanho * fator;
    const espaco = atual > 0 ? 0.26 * tamanho : 0;
    if (atual > 0 && atual + espaco + lw > largura) {
      linhas++;
      atual = lw;
    } else atual += espaco + lw;
  }
  return linhas;
};

// Rótulo: Jost em caixa alta, espaçado, em ouro escuro
export const rotulo: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 500,
  fontSize: 34,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  lineHeight: 1,
  color: cor.ouroTexto,
};
