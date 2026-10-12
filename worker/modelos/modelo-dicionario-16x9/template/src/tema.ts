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

// --- Medidas do quadro (16:9, 1920×1080) ---
// A versão deitada do Dicionário, para o vídeo completo do YouTube. A regra da aula 9 do curso
// (editar uma aula horizontal): a pessoa em tela cheia é a base; quando um bloco pede apoio visual,
// ela vai para uma MOLDURA do lado direito (o rosto centralizado e acompanhado) e a página do
// dicionário ocupa o QUADRO do lado esquerdo. O que no vertical era uma pilha alta (pessoa em cima,
// conteúdo embaixo) vira colunas lado a lado (layout.ts divide as colunas).
export const W = 1920;
export const H = 1080;

// Grade da página (px no quadro 1920×1080): margem da esquerda (lombada) e a borda útil da direita;
// depois dela ficam as abas do índice de dedo
export const MARGEM = 80;
export const LARGURA_UTIL = 1740; // de 80 a 1820; à direita ficam as abas
// cabeçalho da página (palavras-guia) e onde o conteúdo começa
export const CABECALHO_Y = 46;
export const TOPO = 132;
// base do conteúdo: acima dos controles do player; com legenda, acima dela
export const BASE = 964;
export const BASE_COM_LEGENDA = 866;
export const LEGENDA_Y = 890;
// abaixo desta linha ficam os controles do player do YouTube (barra de tempo, botões)
export const LIMITE_APP = 984;

// Frontispício (abertura, fechamento, pergunta, destaque, frase): a folha é uma coluna de papel do
// lado esquerdo, da altura do quadro, e a pessoa fica em tela cheia ao lado (o vídeo desliza para o
// rosto cair à direita da folha). O conteúdo da folha começa em `topo` (px) e tem a largura útil dela.
export const FOLHA = { w: 1040 };
export const LARGURA_FOLHA = FOLHA.w - MARGEM - 56; // 904
export const zona = { esquerda: MARGEM, direita: 56, topo: 220, altura: BASE - 220 };

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
