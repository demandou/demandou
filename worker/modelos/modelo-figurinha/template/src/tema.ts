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

// Geometria do quadro (px, 1080×1920)
export const W = 1080;
export const H = 1920;
export const MARGEM = 56;
// topo seguro (abaixo das abas do app) e base segura (acima da interface do app)
export const TOPO = 188;
export const LIMITE_APP = 1560;

// Página do álbum (durante as figurinhas), ocupando a página até a linha da interface do app:
// - no alto, a figurinha especial da pessoa (de um lado) e o cachorro (do outro), sentado ATRÁS
//   da figurinha da vez (as patas ficam escondidas pela borda de cima dela);
// - no meio, a figurinha da vez, grande;
// - embaixo, a fileira do álbum.
export const MARGEM_ALBUM = 44;
// medida de fora da figurinha especial da pessoa (com a borda)
export const PESSOA_ALBUM = { y: 128, w: 560, h: 690 };
// o cachorro: largura do desenho e quanto dele fica escondido atrás da figurinha da vez
export const CAO_ALBUM = { largura: 456, escondido: 74 };
export const HEROI = { x: 44, y: 792, w: 992, h: 530 };
export const FILEIRA = { y: 1346, h: 210, gap: 22 };

// Página do álbum nos blocos de página (topicos, passos, comparacao, grafico, definicao):
// - a figurinha especial da pessoa no alto, de um lado (troca de lado a cada página);
// - o título na coluna do outro lado (e o cachorro, se sobrar lugar);
// - o conteúdo colado embaixo, de margem a margem, até acima da interface do app.
export const PESSOA_PAGINA = { y: 150, w: 440, h: 540 };
export const COLUNA = { y: 168, h: 520, gap: 40 };
export const CONTEUDO = { x: 44, y: 734, w: 992, h: 806 };

// Moldura especial: a borda fica por fora da caixa do vídeo
export const BORDA_ESPECIAL = 20;

// Zona padrão das artes de quadro cheio (abaixo do queixo). O plano pode mover (campo `zona`).
export const zona = { topo: 985, altura: 460 };
