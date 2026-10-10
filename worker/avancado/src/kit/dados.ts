import pedido from "../dados/pedido.json";

/**
 * OS DADOS DO CORTE, gravados pelo worker em src/dados/pedido.json antes de a
 * cena ser escrita (worker/src/avancado/editar-avancado.mjs). Nada aqui é
 * inventado: a fala é a da transcrição (no tempo do corte já limpo), o rosto
 * é o rastro do Face Landmarker quadro a quadro, a cor e a letra são as da
 * identidade aprovada do projeto, e o recorte é o do RVM.
 */
export type Palavra = { de: number; ate: number; w: string };
export type PontoDoRosto = { x: number; y: number; queixo: number };
export type Tecnica = "maquete-3d" | "recorte-letreiro" | "graficos" | "moldura-explicativa";
export type LetraId = "impacto" | "moderna" | "classica" | "amigavel";

export type DadosDoCorte = {
  fps: number;
  largura: number;
  altura: number;
  /** Segundos do corte (a fala limpa emendada). */
  duracao: number;
  quadros: number;
  cores: { fundo: string; titulo: string; destaque: string };
  letra: LetraId;
  palavras: Palavra[];
  /** O tamanho da gravação em px (normalmente 1920 × 1080, deitada). */
  gravacao: { largura: number; altura: number };
  /** O rosto em px da gravação, um ponto por quadro do corte (suavizado). */
  rosto: PontoDoRosto[];
  /** O recorte com alfa (public/alfa.webm), quando a técnica pede. */
  recorte: null | {
    /** A região da gravação que está no WebM: x, y, largura, altura (px da gravação). */
    caixa: [number, number, number, number];
    /** O topo da cabeça e o centro dela por quadro, no sistema da caixa (null onde não achou). */
    cabeca: ({ topo: number; x: number } | null)[];
  };
  tecnica: Tecnica;
};

export const DADOS = pedido as unknown as DadosDoCorte;
export const FPS = DADOS.fps;
export const LARGURA = DADOS.largura;
export const ALTURA = DADOS.altura;
export const DURACAO = DADOS.duracao;
