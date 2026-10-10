import type { Areas } from "../layout";
import type { Palavra } from "../plano";

export type PropsFigura<M> = {
  m: M;
  t: number;
  areas: Areas;
  palavras: Palavra[];
  // instante em que a página desta figura começa a chegar
  chegada: number;
  id: string;
  // quando o papel embaixo da figura fica à vista (a pessoa saindo da tela cheia por cima dela)
  revela: number;
  // opacidade do cabeçalho (some enquanto a pessoa saindo/voltando da tela cheia passa por ele)
  opCabecalho?: number;
  // a linha impressa da folha, já resolvida ("Fig. 2 · Medida" quando o plano não deu `rotulo`)
  rotulo?: string;
  // nome e área de quem fala
  marca?: { nome: string; area: string };
};

// Desloca um caminho/ponto para dentro da área (coordenadas locais → coordenadas da página)
export const emArea = (a: { x: number; y: number }) => (x: number, y: number) => ({ x: a.x + x, y: a.y + y });
