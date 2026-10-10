import { DADOS, DURACAO, type Tecnica } from "./dados";
import type { Caixa, Forma } from "./moldura";
import { dito } from "./tempo";

/**
 * O ROTEIRO (src/cenas/roteiro.json, escrito junto com as cenas): onde o
 * apresentador está em cada momento, onde fica a legenda e quais arquivos de
 * cena entram quando. Todo instante é uma ÂNCORA NA FALA, para a edição
 * sincronizar pela gravação real e nunca por tempo fixo de roteiro escrito.
 */

/** Um instante: a palavra dita (a `vez`-ésima vez, mais `mais` segundos), um número de segundos, "inicio" ou "fim". */
export type Ancora = { palavra: string; vez?: number; mais?: number } | number | "inicio" | "fim";

export type QuadroDoApresentador = {
  /** Quando a transição para este quadro COMEÇA. */
  em: Ancora;
  /** Segundos da transição (padrão 0,9). */
  transicao?: number;
  /** A janela onde o apresentador aparece, em px do quadro 1080 × 1920. Sem ela: a tela inteira. */
  caixa?: Caixa;
  /** O desenho dos cantos da janela (padrão: "reta" na tela inteira, "arredondada" nas outras). */
  forma?: Forma;
  /** Desenha a moldura (borda fina, painel e sombra). Padrão: sim fora da tela inteira. */
  borda?: boolean;
  /** Usa o recorte com alfa (sem o fundo da gravação). Só quando o corte tem recorte. */
  recorte?: boolean;
  /** Com recorte e moldura: cabeça e ombros passam por cima da borda de cima (máscaras complementares). */
  cabecaPorFora?: boolean;
  /** px da gravação → px do quadro. Padrão: cobrir a janela (sem recorte) ou 1,15 (com recorte). */
  escala?: number;
  /** Onde fica o centro do rosto, em px do quadro. Padrão: no meio da janela, a 38% da altura dela. */
  rosto?: { x: number; y: number };
  /** Com recorte: o y (px do quadro) da BASE da gravação, onde o corpo termina. Padrão: a base da janela com moldura, senão 1800. */
  base?: number;
  /** 0 a 1: quanto a janela acompanha o movimento do rosto (padrão 0,6; 1 mantém o rosto sempre no mesmo lugar). */
  acompanhar?: number;
  /** Inclinação em perspectiva, em graus (aula 8.1: discreta, até 8). */
  inclinacao?: number;
};

export type Legenda = {
  topo: number;
  esquerda: number;
  largura: number;
  tamanho?: number;
  alinhar?: "center" | "left";
  /** Letras por linha (padrão: pela largura e o tamanho). */
  maxLetras?: number;
};

export type CenaDoRoteiro = {
  /** O arquivo em src/cenas (ex.: "cena-01.tsx"). */
  arquivo: string;
  de: Ancora;
  ate: Ancora;
  /** Uma frase: o que a cena explica e como (para a revisão ligar quadro e cena). */
  oQue: string;
};

export type Roteiro = {
  tecnica: Tecnica;
  /** O fundo do quadro inteiro (padrão "estudio"). Uma cena pode desenhar o próprio fundo em Atras. */
  fundo?: "estudio" | "liso" | "grade";
  /** Intensidade da paralaxe entre as camadas (0 desliga; padrão 1). */
  paralaxe?: number;
  apresentador: QuadroDoApresentador[];
  legenda: Legenda;
  cenas: CenaDoRoteiro[];
};

/** O instante (s) de uma âncora, preso dentro do corte. */
export function emSegundos(a: Ancora | undefined, padrao = 0): number {
  let s: number;
  if (a === undefined) s = padrao;
  else if (a === "inicio") s = 0;
  else if (a === "fim") s = DURACAO;
  else if (typeof a === "number") s = a;
  else s = dito(a.palavra, a.vez ?? 1) + (a.mais ?? 0);
  return Math.min(DURACAO, Math.max(0, s));
}

export const temRecorte = () => Boolean(DADOS.recorte);
