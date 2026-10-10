// Identidade da Tese: o Reel de opinião sem pacote gráfico. O vídeo é sempre uma tela dividida:
// em cima, 45% da altura, a informação inserida (imagem que preenche a moldura ou texto
// branco no palco escuro); embaixo, a pessoa bem centralizada. Nas viradas, o rosto fechado em tela
// cheia. Legenda branca minúscula com contorno preto, sempre no mesmo lugar. Sem cor de destaque.
// Nada mexe na cor do vídeo.
import { loadFont } from "@remotion/google-fonts/Onest";
import { Easing, interpolate } from "remotion";
import type { Plano } from "./plano";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
export const FONTE = fontFamily;

export const COR = {
  // o palco de texto da metade de cima (quase preto, levemente frio)
  grafite: "#0C0B12",
  trilho: "#2B2A35",
  branco: "#FFFFFF",
  apoio: "#9C9AA8",
  // sem cor de destaque: a ênfase é o branco puro (o nome `tally` vem do motor de blocos)
  tally: "#FFFFFF",
};

export const RAIO = 0;
export const SOMBRA = "none";
export const SOMBRA_TEXTO = "0 2px 12px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.5)";

// ——— a grade dos três enquadramentos (quadro 1080×1920) ———
export const TOPO_H = 864; // faixa de cima: imagem ou texto (45% da altura)
export const PESSOA_Y = 864; // no split, a pessoa ocupa daqui até o fim (1080×1056)
export const PESSOA_H = 1056;
// o texto do palco fica entre y 130 (topo seguro ≥ 120) e y 834
export const CENTRO_PALCO = 482;

// A legenda: centro fixo em y 1610 (83,9%), em qualquer enquadramento
export const LEG_Y = 1610;
export const LEG_TAMANHO = 56;

// largura útil dos textos no palco de cima
// margem segura: ≥ 64 px de cada lado, topo ≥ 120, nada importante abaixo de y 1700
export const MARGEM = 64;
export const LARGURA_UTIL = 952;
export const ALTURA_PALCO = 640;

// Largura do rosto no quadro (fração). Sem rastro, um valor típico de gravação vertical.
export const larguraDoRosto = (plano: Plano) => plano.rosto.rastro?.largura ?? 0.3;
// Split: rosto em ~38% da largura (bem centralizado, cabeça inteira com folga na caixa de 1056 px). Fechado: ~74% (limite 2,0× para a imagem não amolecer).
export const zoomSplit = (plano: Plano) => Math.min(2, Math.max(1, 0.38 / larguraDoRosto(plano)));
export const zoomFechado = (plano: Plano) => Math.min(2.0, Math.max(zoomSplit(plano) * 1.25, 0.74 / larguraDoRosto(plano)));
// altura do centro do rosto dentro da caixa: no fechado os olhos ficam em ~36% da altura
export const ANCORA_FECHADO = 0.4;
// no split, o centro do rosto a 34% da caixa: cabeça inteira com ~80 px de folga e o queixo acima da legenda
export const ANCORA_SPLIT = 0.34;

// ——— animação ———
export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const suave = Easing.bezier(0.45, 0, 0.55, 1);
export const prog = (t: number, de: number, dur: number, easing = saida) =>
  dur <= 0 ? (t >= de ? 1 : 0) : interpolate(t, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// Formato pt-BR (83.000; 1,5)
export const formatar = (v: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);
