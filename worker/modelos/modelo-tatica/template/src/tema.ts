import { loadVariableFont } from "@remotion/google-fonts/HubotSans";

// Hubot Sans, variável: largura de 75% a 125% e peso de 200 a 900. Uma família só, em dois "cortes":
// - LARGA (125%, pesada, caixa-alta): placar, títulos, números — a cara de pacote gráfico de TV esportiva;
// - NORMAL (100%): textos de apoio e legenda.
// Escolhida também porque o I maiúsculo tem serifa: "Iogurte", "IPTU" e "Il1" não confundem I com l.
// Nada de condensada.
export const fonte = loadVariableFont("normal", { subsets: ["latin", "latin-ext"] }).fontFamily;

// Prancheta de TV: grama, linha de giz, amarelo de placar e o escuro das artes de transmissão.
export const cor = {
  // o campo: verde de gramado com faixas de corte (clara/escura) e o fundo fora do campo
  grama: "#1C6A3D",
  gramaClara: "#21774A",
  gramaEscura: "#165A33",
  foraDoCampo: "#124B2B",
  // linhas de giz, texto claro
  giz: "#F3F6EF",
  gizSuave: "rgba(243,246,239,0.62)",
  // esboço "a lápis": o que ainda vai acender
  gizApagado: "rgba(243,246,239,0.30)",
  // o acento: placar, chute, zona acesa, nosso time
  placar: "#FFCB2E",
  placarFundo: "rgba(255,203,46,0.30)",
  // as artes de TV (placar, tarjas, rótulos) e o adversário
  tv: "#0B1016",
  tvClaro: "#18202A",
  tvTexto: "rgba(243,246,239,0.74)",
};

// Geometria do quadro (px, 1080×1920)
export const W = 1080;
export const H = 1920;
export const MARGEM = 60;
// topo seguro (abaixo das abas do app)
export const TOPO = 170;
// abaixo disto: interface do app (legenda do post, botões)
export const LIMITE_APP = 1560;

// O placar de dicas ("DICA 1/3"), sempre no canto de cima à esquerda, como o placar de uma transmissão
export const PLACAR = { x: MARGEM, y: TOPO, altura: 84 };

// A caixa de transmissão da pessoa durante a prancheta (canto de cima à direita, como um comentarista)
export const CAIXA_TV = { x: 636, y: TOPO, w: 384, h: 486, raio: 26, zoom: 1.8, ancoraY: 0.45 };

// O cabeçalho da dica na prancheta (à esquerda da caixa, abaixo do placar)
export const CABECALHO = { x: MARGEM, y: TOPO + 104, largura: CAIXA_TV.x - MARGEM - 36 };

// Zona padrão das artes de quadro cheio (abaixo do queixo). O plano pode mover (campo `zona`).
export const zona = { topo: 985, altura: 460 };

// Estilos de texto
export const larga: React.CSSProperties = {
  fontFamily: fonte,
  fontWeight: 900,
  fontStretch: "125%",
  textTransform: "uppercase",
  lineHeight: 0.98,
  letterSpacing: "-0.005em",
};
export const normal: React.CSSProperties = {
  fontFamily: fonte,
  fontWeight: 600,
  fontStretch: "100%",
  lineHeight: 1.16,
};
// rótulo em caixa-alta espaçada (tarjas, etiquetas do campo)
export const rotulo: React.CSSProperties = {
  fontFamily: fonte,
  fontWeight: 800,
  fontStretch: "112.5%",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  lineHeight: 1,
};
