import { loadVariableFont } from "@remotion/google-fonts/SchibstedGrotesk";

// Schibsted Grotesk (variável, peso 400–900): grotesca larga e firme, desenhada para um grupo de
// jornalismo — tem cara de redação e de telejornal sem copiar nenhuma emissora. Uma família só:
// - 900 em caixa-alta: manchetes, vinheta, valores;
// - 800 em caixa-alta espaçada: rótulos, barra "EXPLICANDO", letreiro, tarja;
// - 600–700: textos de apoio e legenda.
// O I maiúsculo tem serifa: "Iogurte", "IPTU" e "Il1" nunca confundem I com l. Nada de condensada.
export const fonte = loadVariableFont("normal", { subsets: ["latin", "latin-ext"] }).fontFamily;

// Azul de telejornal + branco + UM vermelho, só na barra "EXPLICANDO".
export const cor = {
  // o estúdio: fundo dos painéis (azul profundo, saturado) e a faixa escura (letreiro, relógio, tarja de nome)
  estudio: "#0B1D6E",
  estudioClaro: "#11277F",
  noite: "#061247",
  // azul elétrico: o acento do pacote gráfico (aba do chapéu, rótulo do letreiro, faixas da vinheta)
  eletrico: "#2251FF",
  // azul-claro: textos de apoio sobre o azul, a segunda linha dos gráficos
  celeste: "#A9C3FF",
  // branco das tarjas, da etiqueta de preço e da nota
  branco: "#FFFFFF",
  papel: "#F3F5FA",
  // texto sobre o branco: o mesmo azul profundo do estúdio
  tinta: "#0B1D6E",
  // esboço "a lápis": o que ainda vai acender
  apagadoNoAzul: "rgba(169,195,255,0.30)",
  apagadoNoPapel: "rgba(11,29,110,0.16)",
  // o vermelho do plantão: SÓ na barra "EXPLICANDO"
  plantao: "#E3122C",
};

// Geometria do quadro (px, 1080×1920)
export const W = 1080;
export const H = 1920;
export const MARGEM = 60;
// abaixo das abas do app
export const TOPO = 170;
// abaixo disto: interface do app (legenda do post, botões)
export const LIMITE_APP = 1560;

// A barra "EXPLICANDO" com relógio: canto de cima à esquerda, acima da cabeça
export const BARRA = { x: MARGEM, y: TOPO, h: 64 };
// O letreiro (ticker): faixa na base, logo acima da interface do app
export const LETREIRO = { y: 1478, h: 74 };
// A coluna da pessoa no quadro lateral (tela dividida em pé): metade direita
export const COLUNA = 540;

// Zona padrão das artes de quadro cheio (abaixo do queixo). O plano pode mover (campo `zona`).
export const zona = { topo: 980, altura: 460 };

// Estilos de texto
export const manchete: React.CSSProperties = {
  fontFamily: fonte,
  fontWeight: 900,
  textTransform: "uppercase",
  lineHeight: 1,
  letterSpacing: "-0.01em",
};
export const rotulo: React.CSSProperties = {
  fontFamily: fonte,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  lineHeight: 1,
};
export const texto: React.CSSProperties = {
  fontFamily: fonte,
  fontWeight: 600,
  lineHeight: 1.18,
};
export const numeros: React.CSSProperties = {
  fontVariantNumeric: "tabular-nums",
};
