/**
 * A MOLDURA EDITORIAL ASSIMÉTRICA da aula 8.2: um canto arredondado grande
 * (em cima, à esquerda) e o canto oposto chanfrado (embaixo, à direita); os
 * outros dois com raio pequeno. A mesma forma, recuada, é a máscara do
 * apresentador dentro dela; o complemento (acima da borda de cima) é a
 * máscara da cabeça e dos ombros que passam por fora. As duas máscaras são da
 * MESMA camada de vídeo, no MESMO quadro: nada se duplica.
 */
export type Caixa = { x: number; y: number; l: number; a: number };

export function caminhoAssimetrico(c: Caixa, raioGrande: number, chanfro: number, raioPequeno: number): string {
  const { x, y, l, a } = c;
  const R = Math.max(0, Math.min(raioGrande, a / 2, l / 2));
  const C = Math.max(0, Math.min(chanfro, a / 2, l / 2));
  const r = Math.max(0, Math.min(raioPequeno, a / 2, l / 2));
  return [
    `M ${x} ${y + R}`,
    `A ${R} ${R} 0 0 1 ${x + R} ${y}`,
    `L ${x + l - r} ${y}`,
    `A ${r} ${r} 0 0 1 ${x + l} ${y + r}`,
    `L ${x + l} ${y + a - C}`,
    `L ${x + l - C} ${y + a}`,
    `L ${x + r} ${y + a}`,
    `A ${r} ${r} 0 0 1 ${x} ${y + a - r}`,
    "Z",
  ].join(" ");
}

/** A mesma forma recuada `d` px para dentro (o chanfro de 45° encolhe d·(2 − √2)). */
export function recuar(c: Caixa, raioGrande: number, chanfro: number, raioPequeno: number, d: number) {
  return {
    caixa: { x: c.x + d, y: c.y + d, l: c.l - 2 * d, a: c.a - 2 * d },
    raioGrande: Math.max(0, raioGrande - d),
    chanfro: Math.max(0, chanfro - d * (2 - Math.SQRT2)),
    raioPequeno: Math.max(0, raioPequeno - d),
  };
}

/** A moldura chanfrada da aula 8.1 (janela de prancha): os quatro cantos cortados a 45°. */
export function caminhoChanfrado(c: Caixa, chanfro: number): string {
  const { x, y, l, a } = c;
  const C = Math.max(0, Math.min(chanfro, a / 2, l / 2));
  return `M ${x + C} ${y} L ${x + l - C} ${y} L ${x + l} ${y + C} L ${x + l} ${y + a - C} L ${x + l - C} ${y + a} L ${x + C} ${y + a} L ${x} ${y + a - C} L ${x} ${y + C} Z`;
}
