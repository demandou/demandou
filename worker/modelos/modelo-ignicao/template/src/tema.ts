import { loadFont } from "@remotion/google-fonts/Tomorrow";

// Tomorrow: a letra de painel de carro — desenho técnico, cantos retos e curvas abertas, sem ser
// condensada. Escolhida também porque o I maiúsculo tem serifa ("Iogurte", "IPTU", "Il1" não
// confundem I com l) e os acentos do português ficam inteiros. Três pesos: 500 (texto), 600 (rótulos
// e números do mostrador) e 700 (títulos).
export const fonte = loadFont("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;

// Painel de instrumentos à noite: carcaça escura, a luz de fundo marfim dos ponteiros e números,
// e cor só onde um painel de verdade tem cor: o vermelho das luzes de alerta e o verde da seta.
export const cor = {
  // a carcaça do painel e o vidro das telas
  carcaca: "#0B0C0E",
  carcacaAlta: "#121417",
  vidro: "#07080A",
  painel: "#101215",
  // aros de metal escovado
  aro: "#2B2E33",
  aroClaro: "#5A6067",
  aroEscuro: "#17191C",
  // a luz de fundo dos instrumentos (ponteiros, números, texto)
  marfim: "#F1EDE4",
  marfimSuave: "rgba(241,237,228,0.66)",
  marfimFraco: "rgba(241,237,228,0.34)",
  // "esboço": o que ainda não acendeu (luz apagada atrás do vidro fumê)
  apagado: "rgba(241,237,228,0.17)",
  linha: "rgba(241,237,228,0.12)",
  // texto secundário
  aco: "#9AA0A7",
  // SÓ nas luzes de alerta
  alerta: "#FF3B2F",
  alertaFundo: "rgba(255,59,47,0.13)",
  // luz de atenção (ex.: injeção) — opcional no plano
  ambar: "#FFB020",
  ambarFundo: "rgba(255,176,32,0.13)",
  // SÓ na seta de direção (o "manda" do fechamento)
  seta: "#2FD46E",
};

// Geometria do quadro (px, 1080×1920)
export const W = 1080;
export const H = 1920;
export const MARGEM = 60;
// topo seguro (abaixo das abas do app) e começo da interface do app (legenda do post, botões)
export const TOPO = 170;
export const LIMITE_APP = 1560;

export const texto = (peso: 500 | 600 | 700, tamanho: number, extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: fonte,
  fontWeight: peso,
  fontSize: tamanho,
  lineHeight: 1.08,
  color: cor.marfim,
  ...extra,
});

// rótulo em caixa-alta espaçada (unidades, nomes de seção)
export const rotulo = (tamanho: number, extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: fonte,
  fontWeight: 600,
  fontSize: tamanho,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  lineHeight: 1,
  color: cor.aco,
  ...extra,
});

// sombra de profundidade (nunca brilho): separa uma peça do fundo
export const sombra = "0 18px 40px rgba(0,0,0,0.55)";
