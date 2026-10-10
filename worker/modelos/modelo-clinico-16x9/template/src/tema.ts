import { loadFont as carregarFigtree } from "@remotion/google-fonts/Figtree";
import { larguraPalavra, larguraTexto, type Peso, quebrarLinhas } from "./medida";

// Figtree: sans humanista, aberta e legível no celular. Uma família só, em pesos diferentes.
export const sans = carregarFigtree("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;

// Consultório: branco, um azul clínico profundo, cinzas suaves. O vermelho só aparece no que está errado.
export const cor = {
  // fundo da área de exame (branco levemente frio) e branco puro dos cartões e da névoa
  fundo: "#F3F6FA",
  branco: "#FFFFFF",
  // texto principal (azul quase preto) e o azul clínico dos traços, números e acertos
  tinta: "#0E2445",
  azul: "#1A4E9A",
  // azul diluído: preenchimentos dos desenhos (dentina, polpa) e anéis de fundo
  azulClaro: "#DCE6F4",
  azulVeu: "rgba(26,78,154,0.07)",
  // cinzas: texto secundário, linhas de apoio, tecidos neutros (gengiva, osso)
  cinza: "#6E7B8F",
  cinzaLinha: "#AEB8C6",
  cinzaClaro: "#DDE3EA",
  tecido: "#E8ECF2",
  // "a lápis": o lugar de algo que ainda vai ser dito
  lapis: "#CCD4DF",
  // o erro: marca ✗, gengiva machucada, o que a escova não alcança
  vermelho: "#CC3F36",
  vermelhoVeu: "#F7DCD8",
};

// Espessuras de traço (px no quadro deitado 1920×1080), as mesmas do vertical
export const traco = { forte: 5, medio: 3.5, fino: 2.5 };

// Corpo dos rótulos de atlas dentro dos desenhos
export const ROTULO = 52;

// --- Medidas do quadro deitado (16:9, 1920×1080): a versão do vídeo completo do YouTube ---
// A composição segue a aula 9 do curso (editar uma aula horizontal): a tela cheia é a base; quando
// um bloco pede apoio visual, a pessoa vai para a LUPA na moldura da direita (rosto centralizado,
// acompanhado de leve) e o exame ocupa o QUADRO da esquerda. Ver src/layout.ts.
export const QUADRO = { w: 1920, h: 1080 };
// margens seguras do YouTube: 96 px nas laterais; nada importante abaixo de y 984 (controles do player)
export const MARGEM = 96;
// topo útil do conteúdo da lupa
export const TOPO_UTIL = 84;
// Legenda (quando aparece), no terço de baixo, e o limite dos controles do player
export const LEGENDA_Y = 890;
export const LIMITE_APP = 984;

// Área padrão do texto em tela cheia (abaixo do queixo, na névoa). O plano pode mover com `zona`
// (o cortar.mjs do 16:9 grava o topo 60 px abaixo do queixo, entre 640 e 860).
export const zona = { esquerda: 96, direita: 96, topo: 680, altura: 300 };
// Em tela cheia o texto fica numa FAIXA larga na base do quadro (fileiras e colunas, não uma pilha
// alta): do topo da zona até BASE_CHEIO. A faixa nunca começa abaixo de TOPO_MAX_CHEIO, para ter
// altura para o texto mesmo quando a pessoa foi gravada baixa no quadro.
export const BASE_CHEIO = 980;
export const TOPO_MAX_CHEIO = 670;

// Medidas de texto com as larguras reais da Figtree (medida.ts): o corpo que cabe e o número de linhas.
// `peso` padrão 700 (títulos da lupa, listas); a abertura usa 800.
export const caber = (texto: string, largura: number, maximo: number, minimo = 0, peso: Peso = 800) => {
  for (let s = maximo; s > minimo; s -= 2) if (larguraTexto(texto, s, peso, -0.02) <= largura) return s;
  return minimo;
};

// Quantas linhas um texto ocupa numa largura, quebrando nas palavras
export const linhasDoTexto = (texto: string, largura: number, tamanho: number, peso: Peso = 700) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.some((w) => larguraPalavra(w, tamanho, peso, -0.015) > largura)) return 99;
  return quebrarLinhas(texto, largura, tamanho, peso, -0.015).length;
};

// Maior corpo (entre `minimo` e `maximo`) em que o texto cabe em `maxLinhas` linhas
export const ajustarTitulo = (texto: string, largura: number, maxLinhas: number, maximo: number, minimo: number, peso: Peso = 700) => {
  for (let s = maximo; s > minimo; s -= 2) if (linhasDoTexto(texto, largura, s, peso) <= maxLinhas) return s;
  return minimo;
};
