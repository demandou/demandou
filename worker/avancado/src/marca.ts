import { loadFont } from "@remotion/google-fonts/Montserrat";

/**
 * A MARCA DA DEMANDOU nas amostras das aulas 8.1 e 8.2.
 *
 * Lida (somente leitura, 10/10/2026) com estadoDaIdentidade("cmu7hmu0j000004jrh2yc5udb")
 * de lib/modelos-de-arte/identidade-aprovada.ts: identidade aprovada, letra
 * "moderna" (Montserrat 800 no título, 500 no texto), papéis fundo, título e
 * destaque. As paletas das aulas (azul-marinho e laranja; grafite e terracota)
 * NÃO entram: o estilo é da aula, a cor é da marca.
 *
 * Os tons derivados (painel, linha, sombra) saem só do fundo e do título,
 * misturados, para não aparecer cor que não é da marca.
 */
export const MARCA = {
  fundo: "#1e1f22",
  titulo: "#dbdee1",
  destaque: "#f97316",
  // derivados do fundo e do título
  painel: "#2a2c30",
  painelClaro: "#33363b",
  fundoProfundo: "#141517",
  linha: "rgba(219, 222, 225, 0.16)",
  linhaForte: "rgba(219, 222, 225, 0.55)",
  sombra: "rgba(0, 0, 0, 0.55)",
} as const;

const { fontFamily } = loadFont("normal", { weights: ["500", "700", "800", "900"], subsets: ["latin", "latin-ext"] });
export const LETRA = fontFamily;
