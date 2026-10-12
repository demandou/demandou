import { loadVariableFont } from "@remotion/google-fonts/Recursive";

// Recursive, variável, no eixo "Casual" (CASL 1): sans de traço macio e robusto, com cara de
// letra feita à mão sem ser infantil. Escolhida também porque o I maiúsculo tem serifa e o l
// minúsculo tem rabicho: "Iogurte", "Il1" e "IPTU" não confundem. Nada de condensada.
export const fonte = loadVariableFont("oblique 0deg 15deg", { subsets: ["latin", "latin-ext"] }).fontFamily;

const eixos = (peso: number) => `"CASL" 1, "wght" ${peso}, "slnt" 0, "MONO" 0, "CRSV" 0.5`;

// Estilos de texto (o peso vai no eixo variável)
export const titulo = (tamanho: number): React.CSSProperties => ({
  fontFamily: fonte,
  fontVariationSettings: eixos(900),
  fontSize: tamanho,
  lineHeight: 1.02,
  letterSpacing: "-0.01em",
});
export const corpo = (tamanho: number, peso = 720): React.CSSProperties => ({
  fontFamily: fonte,
  fontVariationSettings: eixos(peso),
  fontSize: tamanho,
  lineHeight: 1.14,
});
// rótulo em caixa-alta com espaço (número da figurinha, faixa de nome)
export const rotulo = (tamanho: number): React.CSSProperties => ({
  fontFamily: fonte,
  fontVariationSettings: eixos(860),
  fontSize: tamanho,
  lineHeight: 1,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
});

// Álbum de figurinhas: papel creme, tinta índigo, carimbo framboesa e o caramelo do cachorro.
// As figurinhas têm fundos chapados claros (um por figurinha) e ilustração a traço com cor chapada.
export const cor = {
  papel: "#F4ECDD",
  // papel da cartela (o fundo de onde a figurinha descola) e dos rótulos
  cartela: "#FBF7EF",
  // sombra do papel, casa vazia
  papelFundo: "#E7DAC4",
  // esboço "a lápis": o que ainda vai ser colado
  lapis: "#B5A893",
  lapisClaro: "#D3C7B3",
  // tinta: contorno das ilustrações e texto
  tinta: "#262347",
  tintaSuave: "#5A5680",
  // o acento: carimbo NÃO PODE, destaques
  carimbo: "#D2385B",
  // carimbo de "pode" (para listas do que é permitido)
  pode: "#2F7D62",
  // o cachorro
  caramelo: "#D98A3F",
  carameloEscuro: "#B4692B",
  carameloClaro: "#F4DCB6",
  focinho: "#2A2238",
  lingua: "#E57E8E",
  branco: "#FFFFFF",
  // moldura especial da pessoa (o "foil" é só o brilho que passa na borda)
  foil: "#2E2A62",
};

// Fundos chapados das figurinhas
export const fundos = {
  rosa: "#F6CDD1",
  manteiga: "#F6DE9C",
  menta: "#C3E4D3",
  ceu: "#CDDDF0",
  lavanda: "#DDD3F1",
  pessego: "#F7D2B6",
} as const;
export type Fundo = keyof typeof fundos;

// --- Geometria do quadro deitado (16:9, px, 1920×1080) ---
// A versão deitada do Figurinha, para o vídeo completo do YouTube. O álbum é o mesmo (papel creme,
// figurinhas que colam e descolam, carimbo, cachorro), mas a composição segue a aula 9 do curso
// (editar uma aula horizontal): a pessoa em TELA CHEIA é a base (os trechos sem momento, com a
// legenda embaixo, e as etiquetas de quadro cheio coladas no peito, no terço de baixo); quando um
// bloco pede apoio visual (as páginas, o álbum, o especial), ela vira a figurinha especial numa
// MOLDURA do lado DIREITO, com o rosto centralizado e acompanhado, e o bloco ocupa o QUADRO do lado
// ESQUERDO. Nada de pilha alta: o que no vertical era empilhado vira colunas e fileiras.
export const W = 1920;
export const H = 1080;
// margens seguras do YouTube: 96 px nas laterais
export const MARGEM = 96;
// topo seguro (abaixo do título do player)
export const TOPO = 96;
// abaixo desta linha ficam os controles do player (barra de tempo, botões)
export const LIMITE_APP = 984;
// base do conteúdo: etiquetas de quadro cheio, páginas e fileira do álbum terminam aqui
export const BASE_UTIL = 954;

// O QUADRO da esquerda, onde o bloco é colado (x 96 a 1220)
export const QUADRO_ESQ = { x: MARGEM, w: 1124 };
// A MOLDURA da direita: medida de fora da figurinha especial da pessoa (com a borda), a mesma nas
// páginas e no álbum (a pessoa não pula de lugar entre um bloco e outro)
export const MOLDURA = { x: W - MARGEM - 556, y: 104, w: 556, h: 820 };

// Página do álbum (topicos, passos, comparacao, grafico, definicao), no quadro da esquerda:
// - o título no alto (até a ponta da linha, onde o cachorro espia);
// - o conteúdo colado embaixo, de margem a margem do quadro, até a base.
export const COLUNA = { x: QUADRO_ESQ.x, y: 112, w: QUADRO_ESQ.w };
export const CONTEUDO = { x: QUADRO_ESQ.x, y: 310, w: QUADRO_ESQ.w, h: BASE_UTIL - 310 };

// Álbum (a assinatura), no quadro da esquerda:
// - no alto, o cachorro sentado ATRÁS da figurinha da vez (as patas ficam escondidas pela borda
//   de cima dela), na ponta oposta à pessoa;
// - no meio, a figurinha da vez, grande e deitada (texto de um lado, desenho do lado da pessoa);
// - embaixo, a fileira do álbum.
export const CAO_ALBUM = { largura: 210, escondido: 70 };
export const HEROI = { x: QUADRO_ESQ.x, y: 280, w: QUADRO_ESQ.w, h: 478 };
export const FILEIRA = { x: QUADRO_ESQ.x, w: QUADRO_ESQ.w, y: 784, h: 170, gap: 22 };

// Figurinha especial grande (o conselho principal): a moldura da pessoa cresce para a esquerda,
// acima da fileira; a etiqueta do conselho fica no quadro da esquerda, colada na beirada dela.
export const ESPECIAL = { x: 1004, y: 104, w: W - MARGEM - 1004, h: 660 };

// Moldura especial: a borda fica por fora da caixa do vídeo
export const BORDA_ESPECIAL = 20;

// Zona padrão (o cortar.mjs grava a do vídeo: começa ~60 px abaixo do queixo). O plano pode mover.
export const zona = { topo: 700, altura: 308 };
// Etiquetas de quadro cheio: coladas no peito, no terço de baixo, centradas no rosto e terminando
// na base útil. `w` = etiqueta comum; `larga` = pergunta com opções e fechamento (a fileira de
// figurinhas embaixo). O topo da faixa nunca sobe acima de `topoMin` nem desce abaixo de `topoMax`.
export const ETIQUETA = { w: 1360, larga: W - 2 * MARGEM, topoMin: 600, topoMax: 720 };
// Legenda dos trechos sem momento: uma tira de papel no terço de baixo, acima dos controles.
export const LEGENDA = { base: 962, largura: 1400 };
