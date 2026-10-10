import { loadFont as carregarSans } from "@remotion/google-fonts/SourceSans3";
import { staticFile } from "remotion";
import { type Fonte, larguraTexto } from "./medida";
import { loadFont as carregarSerif } from "@remotion/google-fonts/SourceSerif4";

// Source Serif 4: a serifada de dicionário (verbetes, definições, títulos, legenda).
// Source Sans 3: rótulos em caixa-alta espaçada, pronúncia e chips de idioma.
carregarSerif("italic", { weights: ["400", "600", "700"], subsets: ["latin", "latin-ext"] });
export const serif = carregarSerif("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const sans = carregarSans("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;

// Papel-bíblia, tinta preta-fria e um único acento: a cor de capa do dicionário (ameixa).
export const cor = {
  papel: "#F3EFE6",
  // cartão de nota (um tom mais claro que a página)
  cartao: "#FAF8F2",
  tinta: "#1B1A1F",
  // tinta secundária: classe gramatical, glosas, vizinhos
  cinza: "#625D66",
  // esboço "a lápis": o que ainda vai ser dito
  lapis: "#B4AEB6",
  // fio de coluna e réguas finas
  fio: "rgba(27,26,31,0.22)",
  ameixa: "#5C2750",
  // véu da ameixa: marca-texto, aba apagada, fundo do chip
  ameixaVeu: "rgba(92,39,80,0.16)",
  ameixaClara: "#D9C6D3",
  // texto claro sobre a ameixa
  claro: "#F7F2EA",
};

export const W = 1080;
export const H = 1920;

// Grade da página (px no quadro 1080×1920): margens; à direita ficam as abas do índice (layout.ts divide as colunas)
export const MARGEM = 56;
export const LARGURA_UTIL = 948; // de 56 a 1004; à direita ficam as abas
// cabeçalho da página (palavras-guia) e onde o conteúdo começa
export const CABECALHO_Y = 150;
export const TOPO = 246;
// base do conteúdo: acima da interface do app; com legenda, acima dela
export const BASE = 1540;
export const BASE_COM_LEGENDA = 1420;
export const LEGENDA_Y = 1446;
export const LIMITE_APP = 1560;

// Frontispício (abertura e fechamento): a página cobre a parte de baixo, a pessoa fica em cima.
// O plano pode mover (campo `zona`, calculado pelo cortar a partir do queixo).
export const zona = { esquerda: MARGEM, direita: 70, topo: 1060, altura: 480 };

// Largura média dos caracteres (frações do corpo) para caber texto sem medir o DOM
export const LARGURA_SERIF = 0.5;
export const LARGURA_SERIF_NEGRITO = 0.56;
export const LARGURA_SANS_CAIXA_ALTA = 0.68;

// (a estimativa por caracteres deu os tamanhos do exemplo aprovado; a medida real garante que nunca vaza)
export const caber = (texto: string, largura: number, maximo: number, fator = LARGURA_SERIF, minimo = 34, fonte: Fonte = {}) => {
  const estimado = Math.max(minimo, Math.min(maximo, Math.floor(largura / (Math.max(texto.length, 1) * fator))));
  let corpo = estimado;
  while (corpo > 24 && larguraTexto(texto, corpo, fonte) / 1.03 > largura) corpo -= 2;
  return corpo;
};

// Rótulo em caixa-alta espaçada (letreiro de seção do dicionário)
export const rotulo: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 700,
  fontSize: 32,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  lineHeight: 1,
};

// Sombra de papel sobre papel/vídeo (não é brilho)
export const sombraPapel = "0 2px 4px rgba(27,26,31,0.10), 0 18px 40px rgba(27,26,31,0.16)";

// Textura do papel (ladrilho 512×512 em public/papel.png)
export const staticPapel = () => `url(${staticFile("papel.png")})`;
