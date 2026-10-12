import type { Palavra, Plano } from "../plano";
import type { Geometria } from "../tema";

// O que todo componente recebe do Edicao: onde desenhar e o tempo das palavras.
export type Contexto = {
  // coluna livre (quando a pessoa está de lado)
  coluna: { x: number; w: number };
  // altura do centro do bloco de texto
  yc: number;
  // faixa vertical que o bloco pode ocupar na coluna (do topo da tela até acima da assinatura)
  topo: number;
  base: number;
  // lado de onde as palavras vêm (o lado da pessoa)
  vemDe: "esquerda" | "direita";
  palavras: Palavra[];
  // quando o momento termina (o último pode ir até o fim do vídeo)
  fim: number;
  // quando o conteúdo já saiu de vez (a borda da caixa cobre o texto; isto é só a garantia)
  saida: number;
  marca: Plano["marca"];
  // medidas que dependem do enquadramento (largura da coluna da pessoa, janela)
  geo: Geometria;
};
