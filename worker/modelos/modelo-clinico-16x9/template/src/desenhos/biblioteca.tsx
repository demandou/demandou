// Biblioteca de desenhos do modelo Clínico. Cada desenho declara a caixa útil (recorte do que aparece),
// os pontos que os rótulos podem apontar e de que lado os rótulos ficam.
import type { Acao, Desenho } from "../plano";
import { ALVOS_CEREBRO, CAIXA_CEREBRO, Cerebro } from "./Cerebro";
import { ALVOS_COLUNA, CAIXA_COLUNA, Coluna, moverAlvoColuna } from "./Coluna";
import { ALVOS_CORPO, CAIXA_CORPO, Corpo } from "./Corpo";
import { ALVOS_DENTE, CAIXA_DENTE, Dente } from "./Dente";
import { ALVOS_DENTES, CAIXA_DENTES, Dentes } from "./Dentes";

export type Alvo = { x: number; y: number; dx: number; dy: number };
type Acoes = { em: number; acao: Acao; alvo?: string }[];

export type DefinicaoDesenho = {
  caixa: { x: number; y: number; w: number; h: number };
  alvos: Record<string, Alvo>;
  // alvos que se mexem com o desenho (a coluna que entorta)
  moverAlvo?: (nome: string, t: number, acoes: Acoes) => Alvo | undefined;
  // espaço reservado na tela para os rótulos (px), à direita do desenho
  reservaDireita: number;
  // false = a frase do veredito fica por cima da base do desenho (que já some em degradê)
  reservaVeredito?: boolean;
  Componente: React.FC<{ t: number; de: number; acoes: Acoes; id: string }>;
};

export const DESENHOS: Record<Desenho, DefinicaoDesenho> = {
  dente: { caixa: CAIXA_DENTE, alvos: ALVOS_DENTE, reservaDireita: 250, reservaVeredito: false, Componente: Dente },
  dentes: { caixa: CAIXA_DENTES, alvos: ALVOS_DENTES, reservaDireita: 0, Componente: Dentes },
  coluna: { caixa: CAIXA_COLUNA, alvos: ALVOS_COLUNA, moverAlvo: moverAlvoColuna, reservaDireita: 0, Componente: Coluna },
  corpo: { caixa: CAIXA_CORPO, alvos: ALVOS_CORPO, reservaDireita: 0, Componente: Corpo },
  cerebro: { caixa: CAIXA_CEREBRO, alvos: ALVOS_CEREBRO, reservaDireita: 0, Componente: Cerebro },
};
