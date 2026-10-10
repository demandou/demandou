import { loadFont as carregarArchivo } from "@remotion/google-fonts/Archivo";
import { loadFont as carregarCourier } from "@remotion/google-fonts/CourierPrime";

// Archivo: grotesca jornalística (títulos, nomes, supers, legenda).
// Courier Prime: máquina de escrever (tudo que é "registro": campos, datas, coordenadas, rótulos).
export const sans = carregarArchivo("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] }).fontFamily;
export const mono = carregarCourier("normal", { weights: ["400", "700"], subsets: ["latin"] }).fontFamily;

// Três cores e seus tons: papel de arquivo, tinta preta e o vermelho de carimbo/"gravando".
export const cor = {
  papel: "#ECE8DF",
  // ficha e cartão: um papel um pouco mais claro que a folha, para destacar da mesa
  cartao: "#F7F5EF",
  // borda da foto impressa
  foto: "#FAF8F3",
  tinta: "#151515",
  grafite: "#5A5750",
  // linhas pré-impressas do formulário e réguas finas
  linha: "rgba(21,21,21,0.16)",
  vermelho: "#C92A1F",
  // texto claro sobre o vídeo
  claro: "#F4F1EA",
  // pedra-sabão: cinza-esverdeado de material, só nas peças do mosaico
  pedra: ["#A9AD9E", "#B7BAAC", "#9DA293", "#C3C5B8", "#8F9587"],
  concreto: "#C8C4BA",
};

// Margens e alturas fixas do quadro 1080×1920
export const MARGEM = 56;
// cabeçalho da folha (abaixo da interface do topo do app)
export const CABECALHO_Y = 142;
// legenda: sempre nesta altura (abaixo do conteúdo, acima da interface de baixo do app)
export const LEGENDA_Y = 1452;
export const LIMITE_APP = 1560;
// base da área de conteúdo nas folhas: quase até a interface do app; com legenda, acima dela
export const BASE_CONTEUDO = 1545;
export const BASE_COM_LEGENDA = 1432;

// Área dos supers em tela cheia (crédito, linha do tempo, assinatura): abaixo do queixo.
// O plano pode mover com `zona` (o cortar.mjs calcula a partir do queixo).
export const zona = { esquerda: 72, direita: 72, topo: 1100, altura: 408 };

// Largura média de um caractere, em frações do tamanho da fonte (para caber texto sem medir o DOM)
export const LARGURA_SANS = 0.6;
export const LARGURA_SANS_CAIXA_ALTA = 0.7;

export const caber = (texto: string, largura: number, maximo: number, fator = LARGURA_SANS, minimo = 28) =>
  Math.max(minimo, Math.min(maximo, Math.floor(largura / (Math.max(texto.length, 1) * fator))));

// Rótulo pré-impresso de formulário (mono, caixa alta, espaçado)
export const rotulo: React.CSSProperties = {
  fontFamily: mono,
  fontWeight: 700,
  fontSize: 28,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  lineHeight: 1,
};

// Sombra de papel sobre papel (não é brilho: é a folha fora da mesa)
export const sombraPapel = "0 2px 3px rgba(21,21,21,0.10), 0 14px 34px rgba(21,21,21,0.16)";
// Sombra suave para texto claro continuar legível sobre o vídeo (não é contorno)
export const sombraTexto = "0 2px 18px rgba(0,0,0,0.55)";
