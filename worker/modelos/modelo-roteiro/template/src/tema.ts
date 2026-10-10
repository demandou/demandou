import { loadFont as carregarFira } from "@remotion/google-fonts/FiraSans";
import { loadFont as carregarFraunces } from "@remotion/google-fonts/Fraunces";

// Fraunces: serifada de exibição com personalidade (curvas macias, itálico de caneta) para nomes de
// lugares e títulos — dá o ar de cartão-postal. Fira Sans: sans humanista para rótulos, chips e
// textos de apoio. Nas duas o I maiúsculo não se confunde com o l minúsculo (o l da Fira tem cauda).
carregarFraunces("italic", { weights: ["500", "600"], subsets: ["latin", "latin-ext"] });
export const display = carregarFraunces("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const sans = carregarFira("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;

// Luz de viagem: areia (o chão do mapa e o papel dos cartões), céu (água e o céu da barra do dia),
// UM azul de azulejo (rota, pinos, carimbos, ênfases) e o amarelo do sol (só no sol, no bonde e no doce).
export const cor = {
  areia: "#F1E6D1",
  // papel dos cartões, do bilhete e do postal
  papel: "#FBF6EC",
  // quarteirões, morros, papel envelhecido
  areiaFunda: "#E4D3B3",
  // curvas de nível, bordas de quarteirão
  areiaTraco: "#CDB690",
  // traço "a lápis": o que ainda vai acontecer
  lapis: "#B2A389",
  ceu: "#CBE0EC",
  ceuClaro: "#E2EEF4",
  azulejo: "#1F47A6",
  // azulejo bem claro: fundo do painel das ilustrações
  azulejoVeu: "#DCE5F4",
  tinta: "#1C2333",
  tintaSuave: "rgba(28,35,51,0.62)",
  sol: "#F2B23A",
  // telha: o vermelho dos telhados e dos carimbos de alerta. Só para o problema (o alerta, o lado
  // errado, o que é riscado, o carimbo de "evite"); nunca como enfeite.
  telha: "#B4432C",
  telhaVeu: "#F2DDD2",
  // sol baixo do fim do dia, e as manchas do doce
  solFundo: "#DE8A2C",
  branco: "#FFFFFF",
};

// Geometria do quadro (px, 1080×1920)
export const W = 1080;
export const H = 1920;
export const MARGEM = 60;
// barra do dia (céu com o sol que anda) e os rótulos embaixo dela
export const RELOGIO = { x: MARGEM, y: 196, w: W - 2 * MARGEM, h: 96, rotulosY: 306 };
// o postal da pessoa nas telas de mapa: moldura de papel com a foto em cima e a assinatura embaixo
export const POSTAL = { y: 384, w: 512, h: 604, borda: 18, rodape: 76 };
// o postal menor da dica (o mapa inteiro precisa de espaço)
export const POSTAL_DICA = { y: 384, w: 400, h: 460, borda: 14, rodape: 64 };
// onde o pino ativo fica na tela (o mapa anda por baixo dele)
export const ANCORA_Y = 900;
// faixa dos cartões de parada (embaixo) e da legenda
export const CARTOES = { topo: 1104, base: 1532 };
// faixa dos cartões dos blocos universais no mapa (listas, passos, comparação, gráfico): mais alta
export const CARTOES_ALTO = { topo: 1032, base: 1532 };
// cabeçalho das telas de mapa sem barra do dia: o título do bloco numa cartela de papel
export const CABECALHO = { x: 60, y: 168, w: W - 120, h: 186 };
export const LEGENDA_Y = 1444;
export const LIMITE_APP = 1560;

// Sombra de papel sobre a mesa (não é brilho: é escura, curta e para baixo)
export const sombraPapel = (forca = 1) => `0 14px 30px rgba(60,44,20,${(0.22 * forca).toFixed(3)}), 0 2px 6px rgba(60,44,20,${(0.18 * forca).toFixed(3)})`;

// Área padrão dos cartões em tela cheia (embarque e fechamento): altura do peito, abaixo do queixo.
export const zona = { esquerda: MARGEM, direita: MARGEM, topo: 1000, altura: 470 };

// Medir texto: use `encaixar` de ./medida (larguras reais das fontes).
export { encaixar, encaixarNaCaixa, larguraTexto, numeroBR } from "./medida";
