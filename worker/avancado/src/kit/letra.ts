import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { DADOS, type LetraId } from "./dados";

/**
 * A LETRA DA MARCA, dos arquivos do próprio worker (worker/fontes/marca, OFL),
 * copiados para public/fontes do trabalho: o render nunca busca fonte no
 * Google na hora. São as quatro letras que o cliente escolhe na identidade
 * (lib/modelos-de-arte/identidade.ts). A cena usa LETRA.titulo e LETRA.texto
 * e nunca escreve o nome de uma fonte.
 *
 * Cada arquivo é registrado para uma FAIXA de peso: pedir 900 a um arquivo
 * 800 usa o próprio desenho, sem o negrito falso que o navegador inventa.
 */
type Arquivo = { arquivo: string; pesos: string };
const LETRAS: Record<LetraId, { titulo: Arquivo[]; texto: Arquivo[]; caixaAlta: boolean; condensada: boolean }> = {
  moderna: {
    titulo: [{ arquivo: "Montserrat-800.ttf", pesos: "100 1000" }],
    texto: [
      { arquivo: "Montserrat-500.ttf", pesos: "100 649" },
      { arquivo: "Montserrat-800.ttf", pesos: "650 1000" },
    ],
    caixaAlta: true,
    condensada: false,
  },
  impacto: {
    titulo: [{ arquivo: "Anton-400.ttf", pesos: "100 1000" }],
    texto: [
      { arquivo: "Inter-400.ttf", pesos: "100 599" },
      { arquivo: "Inter-700.ttf", pesos: "600 1000" },
    ],
    caixaAlta: true,
    condensada: true,
  },
  classica: {
    titulo: [{ arquivo: "PlayfairDisplay-700.ttf", pesos: "100 1000" }],
    texto: [
      { arquivo: "Inter-400.ttf", pesos: "100 599" },
      { arquivo: "Inter-700.ttf", pesos: "600 1000" },
    ],
    caixaAlta: false,
    condensada: false,
  },
  amigavel: {
    titulo: [{ arquivo: "Poppins-700.ttf", pesos: "100 1000" }],
    texto: [
      { arquivo: "Poppins-400.ttf", pesos: "100 599" },
      { arquivo: "Poppins-700.ttf", pesos: "600 1000" },
    ],
    caixaAlta: false,
    condensada: false,
  },
};

const escolhida = LETRAS[DADOS.letra] ?? LETRAS.moderna;

/** Os arquivos que o trabalho precisa copiar para public/fontes (o worker lê daqui). */
export const ARQUIVOS_DA_LETRA = [...new Set([...escolhida.titulo, ...escolhida.texto].map((a) => a.arquivo))];

for (const a of escolhida.titulo) void loadFont({ family: "MarcaTitulo", url: staticFile(`fontes/${a.arquivo}`), weight: a.pesos });
for (const a of escolhida.texto) void loadFont({ family: "MarcaTexto", url: staticFile(`fontes/${a.arquivo}`), weight: a.pesos });

export const LETRA = {
  /** Títulos, palavras grandes, letreiros. */
  titulo: "MarcaTitulo, sans-serif",
  /** Legenda, rótulos, texto de apoio. */
  texto: "MarcaTexto, sans-serif",
  /** A letra pede caixa alta nos títulos (moderna e impacto). */
  caixaAlta: escolhida.caixaAlta,
  /** O título já é condensado (impacto): cabe mais letra por linha. */
  condensada: escolhida.condensada,
  /** Largura média de uma letra MAIÚSCULA do título, em fração do tamanho (para caber). */
  larguraDaLetra: escolhida.condensada ? 0.5 : DADOS.letra === "classica" ? 0.66 : 0.78,
};

/** O texto do título como a letra pede (caixa alta nas que pedem), sem perder acento. */
export const comoTitulo = (s: string) => (LETRA.caixaAlta ? s.toLocaleUpperCase("pt-BR") : s);
