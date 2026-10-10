// Identidade do Dossiê: um quadro de investigação. Em cima, a cortiça escura onde as provas ficam
// presas com pinos e ligadas por um fio vermelho; embaixo, a pessoa numa moldura larga.
// Papel manila e papel de relatório, tinta quase preta e um único vermelho-sangue, que só aparece
// no fio e no carimbo. Títulos em Sora; a máquina de escrever (Special Elite) só em rótulos curtos.
import { loadFont as carregarSora } from "@remotion/google-fonts/Sora";
import { loadFont as carregarElite } from "@remotion/google-fonts/SpecialElite";
import { loadFont as carregarMarcador } from "@remotion/google-fonts/PermanentMarker";

export const SORA = carregarSora("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const ELITE = carregarElite("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
// caneta: só o "?" do post-it
export const MARCADOR = carregarMarcador("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;

export const COR = {
  // embaixo da pessoa e o trilho que separa o quadro
  fundo: "#120E0B",
  trilho: "#0A0806",
  borda: "#2A2119",
  // papéis
  manila: "#CDAA6C",
  manilaEscuro: "#B48F55",
  manilaClaro: "#E0C68D",
  papel: "#F1EBDD",
  ficha: "#F6F1E4",
  jornal: "#E2DAC4",
  postit: "#E8D46A",
  foto: "#F7F5F0",
  // tinta
  tinta: "#1C1915",
  grafite: "#5E574D",
  linha: "rgba(28,25,21,0.17)",
  // o vermelho-sangue: SÓ o fio e o carimbo
  sangue: "#A3141C",
  fio: "#8E1218",
  fioLuz: "#C9363D",
  // pino de metal
  pino: "#C7CACD",
  // texto claro (legenda, tela do celular)
  claro: "#F4EFE6",
  destaqueLegenda: "#E6C987",
};

// ——— a grade do quadro 1080×1920 ———
// o quadro de investigação (a janela por onde a câmera passa)
export const QUADRO_H = 1040;
// o ponto da tela onde a câmera centra a prova (meio da área segura do quadro)
export const FOCO = { x: 540, y: 572 };
// área segura do conteúdo dentro do quadro: margem lateral 64, topo 130
export const SEGURO = { x0: 64, x1: 1016, y0: 130, y1: 1006 };
// a moldura da pessoa: larga, embaixo, passa da borda de baixo (sem canto visível)
export const PESSOA = { x: 30, y: 1064, w: 1020, h: 1920 - 1064 + 40, raio: 34 };
// nada importante abaixo disto (interface do app)
export const LIMITE_APP = 1700;

// Sombra de papel sobre a cortiça (não é brilho: é a folha fora da superfície)
export const SOMBRA = "0 3px 5px rgba(0,0,0,0.45), 0 18px 34px rgba(0,0,0,0.5)";
export const SOMBRA_LEVE = "0 2px 4px rgba(0,0,0,0.4), 0 10px 20px rgba(0,0,0,0.38)";

// Rótulo datilografado (Special Elite, caixa alta, espaçado): só textos curtos
export const rotulo = (tamanho = 30): React.CSSProperties => ({
  fontFamily: ELITE,
  fontSize: tamanho,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  lineHeight: 1,
  color: "#3B352D",
});
