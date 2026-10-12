// Biblioteca de figuras do mapa (a assinatura do Espelho). Cada figura é um desenho a traço fino,
// simétrico, construído como um espelho: só a metade esquerda é escrita aqui e o reflexo é feito
// na hora (os dois lados se desenham juntos, do centro para fora). Todas cabem na mesma caixa de
// 400 × 540 do rosto, com o eixo de simetria em x = 200, e "ficam de pé" na linha do espelho.
//
// Além dos traços, cada figura tem:
// - `vagas`: 5 lugares onde um ponto numerado pode acender (de cima para baixo), cada um com a
//   forma do véu pontilhado; `escolha` diz quais vagas usar com 2, 3, 4 ou 5 pontos;
// - `guias`: alturas das linhas de mapeamento em café claro (como os terços do rosto) e `guiaOuro`,
//   a linha tracejada dourada (como a linha dos olhos);
// - `pe`: onde o desenho termina embaixo (dali desce o fio tracejado até o losango da linha).
import type { Figura } from "./plano";

export type Peso = "contorno" | "detalhe" | "fino";
// `espelho: false` = traço no eixo (ou assimétrico), desenhado uma vez só
export type Parte = { d: string; peso: Peso; ordem: number; dur: number; opacidade?: number; espelho?: boolean; ouro?: boolean; tracejado?: string };
export type Vaga = { ponto: [number, number]; forma: string };
export type DefFigura = {
  // até onde o desenho vai na horizontal (x mínimo e máximo na caixa de 400): a figura ocupa só
  // essa largura na faixa de cima e a coluna de textos ganha o resto
  extensao: [number, number];
  partes: Parte[];
  vagas: Vaga[];
  escolha: Record<2 | 3 | 4 | 5, number[]>;
  guias: number[];
  guiaOuro: number;
  pe: number;
};

const f = (n: number) => Number(n.toFixed(1));
export const elipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${f(cx - rx)} ${cy} C ${f(cx - rx)} ${f(cy - ry * 0.552)} ${f(cx - rx * 0.552)} ${f(cy - ry)} ${cx} ${f(cy - ry)} C ${f(cx + rx * 0.552)} ${f(cy - ry)} ${f(cx + rx)} ${f(cy - ry * 0.552)} ${f(cx + rx)} ${cy} C ${f(cx + rx)} ${f(cy + ry * 0.552)} ${f(cx + rx * 0.552)} ${f(cy + ry)} ${cx} ${f(cy + ry)} C ${f(cx - rx * 0.552)} ${f(cy + ry)} ${f(cx - rx)} ${f(cy + ry * 0.552)} ${f(cx - rx)} ${cy} Z`;
// metade esquerda de uma elipse centrada no eixo, de cima para baixo
const meiaElipse = (cy: number, rx: number, ry: number) =>
  `M 200 ${f(cy - ry)} C ${f(200 - rx * 0.552)} ${f(cy - ry)} ${f(200 - rx)} ${f(cy - ry * 0.552)} ${f(200 - rx)} ${cy} C ${f(200 - rx)} ${f(cy + ry * 0.552)} ${f(200 - rx * 0.552)} ${f(cy + ry)} 200 ${f(cy + ry)}`;
const losango = (cx: number, cy: number, r: number) => `M ${cx} ${cy - r} L ${cx + r * 0.78} ${cy} L ${cx} ${cy + r} L ${cx - r * 0.78} ${cy} Z`;
// folha (amêndoa) presa no ponto (x0, y0), com a ponta em (x1, y1)
const folha = (x0: number, y0: number, x1: number, y1: number, largura: number) => {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const n = Math.hypot(dx, dy) || 1;
  const px = (-dy / n) * largura;
  const py = (dx / n) * largura;
  const a = [x0 + dx * 0.3 + px, y0 + dy * 0.3 + py];
  const b = [x0 + dx * 0.7 + px * 0.8, y0 + dy * 0.7 + py * 0.8];
  const c = [x0 + dx * 0.7 - px * 0.8, y0 + dy * 0.7 - py * 0.8];
  const d = [x0 + dx * 0.3 - px, y0 + dy * 0.3 - py];
  return `M ${f(x0)} ${f(y0)} C ${f(a[0])} ${f(a[1])} ${f(b[0])} ${f(b[1])} ${f(x1)} ${f(y1)} C ${f(c[0])} ${f(c[1])} ${f(d[0])} ${f(d[1])} ${f(x0)} ${f(y0)} Z`;
};
const P = (d: string, peso: Peso, ordem: number, dur = 0.5, extra: Partial<Parte> = {}): Parte => ({ d, peso, ordem, dur, ...extra });
const V = (x: number, y: number, rx: number, ry: number): Vaga => ({ ponto: [x, y], forma: elipse(x, y, rx, ry) });

// ---------------------------------------------------------------- espelho de mão (o nome do modelo)
const espelho: DefFigura = {
  extensao: [36, 364],
  partes: [
    P(meiaElipse(212, 156, 190), "contorno", 0, 0.8),
    P(meiaElipse(212, 134, 168), "detalhe", 0.15, 0.7),
    P(losango(200, 12, 12), "detalhe", 0.55, 0.4, { espelho: false, ouro: true }),
    P("M 176 400 C 178 410 181 416 186 421 L 200 421", "detalhe", 0.32, 0.35),
    P("M 186 421 C 182 452 178 492 180 520 C 182 532 190 538 200 538", "contorno", 0.38, 0.55),
    P("M 183 444 L 200 444", "fino", 0.6, 0.3),
    P("M 182 454 L 200 454", "fino", 0.64, 0.3),
    // reflexo no vidro (só de um lado: é a luz)
    P("M 104 172 C 112 134 134 106 164 90", "fino", 0.7, 0.45, { espelho: false, opacidade: 0.55 }),
    P("M 108 218 C 110 204 114 194 120 184", "fino", 0.76, 0.3, { espelho: false, opacidade: 0.45 }),
  ],
  vagas: [V(200, 100, 52, 32), V(126, 176, 38, 34), V(274, 248, 38, 34), V(126, 320, 38, 30), V(200, 476, 26, 44)],
  escolha: { 2: [0, 4], 3: [0, 2, 4], 4: [0, 1, 2, 4], 5: [0, 1, 2, 3, 4] },
  guias: [44, 212, 380, 538],
  guiaOuro: 212,
  pe: 538,
};

// ---------------------------------------------------------------- moeda (dinheiro, valor, finanças)
const tiquesDaMoeda = Array.from({ length: 17 }, (_, i) => {
  const a = ((8 + i * 10.25) * Math.PI) / 180;
  const r0 = 150;
  const r1 = 161;
  return `M ${f(200 - r0 * Math.sin(a))} ${f(196 - r0 * Math.cos(a))} L ${f(200 - r1 * Math.sin(a))} ${f(196 - r1 * Math.cos(a))}`;
}).join(" ");
// ramo de louro: caule em arco por dentro da borda, folhas para fora
const louro = (() => {
  const pontos = Array.from({ length: 6 }, (_, i) => {
    const a = ((178 - i * 22) * Math.PI) / 180;
    return [200 - 104 * Math.sin(a), 196 - 104 * Math.cos(a), a] as const;
  });
  const caule = `M ${f(pontos[0][0])} ${f(pontos[0][1])} ` + pontos.slice(1).map((p) => `L ${f(p[0])} ${f(p[1])}`).join(" ");
  const folhas = pontos.slice(0, 5).map(([x, y, a]) => folha(x, y, x - 30 * Math.cos(a) - 14 * Math.sin(a), y + 30 * Math.sin(a) - 14 * Math.cos(a), 7));
  return { caule, folhas };
})();
const moeda: DefFigura = {
  extensao: [26, 374],
  partes: [
    P(meiaElipse(196, 168, 168), "contorno", 0, 0.8),
    P(meiaElipse(196, 142, 142), "detalhe", 0.15, 0.7),
    P(tiquesDaMoeda, "fino", 0.35, 0.5, { opacidade: 0.75 }),
    P(louro.caule, "fino", 0.45, 0.5),
    ...louro.folhas.map((d, i) => P(d, "fino", 0.5 + i * 0.05, 0.3)),
    P(losango(200, 196, 46), "detalhe", 0.4, 0.5, { espelho: false, ouro: true }),
    P(losango(200, 196, 30), "fino", 0.5, 0.4, { espelho: false, ouro: true }),
    // a pilha de moedas embaixo
    P(meiaElipse(424, 128, 20), "detalhe", 0.3, 0.45),
    P("M 72 424 L 72 492", "detalhe", 0.38, 0.4),
    P("M 72 446 C 72 457 129.3 466 200 466", "fino", 0.44, 0.35),
    P("M 72 468 C 72 479 129.3 488 200 488", "fino", 0.48, 0.35),
    P("M 72 492 C 72 503 129.3 512 200 512", "detalhe", 0.52, 0.35),
  ],
  vagas: [V(200, 96, 54, 30), V(110, 196, 32, 46), V(290, 196, 32, 46), V(200, 300, 54, 30), V(200, 468, 96, 26)],
  escolha: { 2: [0, 4], 3: [1, 2, 4], 4: [0, 1, 2, 4], 5: [0, 1, 2, 3, 4] },
  guias: [28, 196, 364, 512],
  guiaOuro: 196,
  pe: 512,
};

// ---------------------------------------------------------------- microfone (voz, podcast, conversa)
const grade = [44, 62, 80, 98, 116, 134, 152]
  .map((y) => {
    const meia = y < 90 ? Math.sqrt(Math.max(0, 64 * 64 - (90 - y) ** 2)) : 64;
    return `M ${f(200 - meia)} ${y} L 200 ${y}`;
  })
  .join(" ");
const microfone: DefFigura = {
  extensao: [80, 320],
  partes: [
    P("M 200 18 C 160.3 18 128 50.3 128 90 L 128 246 C 128 285.7 160.3 318 200 318", "contorno", 0, 0.8),
    P(grade, "fino", 0.3, 0.5, { opacidade: 0.8 }),
    P("M 128 172 L 200 172", "detalhe", 0.25, 0.35),
    P("M 128 190 L 200 190", "detalhe", 0.28, 0.35),
    P(losango(200, 244, 13), "detalhe", 0.55, 0.35, { espelho: false, ouro: true }),
    // o garfo que segura a cápsula
    P("M 128 214 L 104 214 C 94 214 90 220 90 230 L 90 262 C 90 330 140 368 200 370", "detalhe", 0.35, 0.6),
    P(elipse(96, 222, 7, 7), "fino", 0.6, 0.3),
    // haste e base
    P("M 194 370 L 194 474", "detalhe", 0.5, 0.4),
    P(meiaElipse(494, 104, 22), "contorno", 0.55, 0.45),
    P("M 96 494 L 96 506 C 96 518 142.6 528 200 528", "detalhe", 0.62, 0.35),
  ],
  vagas: [V(200, 92, 52, 40), V(200, 181, 66, 16), V(200, 262, 48, 32), V(102, 300, 22, 40), V(200, 496, 88, 20)],
  escolha: { 2: [0, 4], 3: [0, 2, 4], 4: [0, 1, 2, 4], 5: [0, 1, 2, 3, 4] },
  guias: [18, 190, 318, 494],
  guiaOuro: 246,
  pe: 528,
};

// ---------------------------------------------------------------- pessoa (busto: saúde, carreira, gente)
const pessoa: DefFigura = {
  extensao: [30, 370],
  partes: [
    P("M 200 46 C 150 46 118 88 118 146 C 118 196 146 238 178 252 C 186 255 193 256 200 256", "contorno", 0, 0.7),
    P("M 200 50 C 160 50 130 66 121 104 C 136 86 162 78 200 80", "fino", 0.2, 0.5),
    P("M 119 148 C 107 142 101 158 105 174 C 108 186 115 190 123 188", "detalhe", 0.3, 0.4),
    P("M 168 246 L 164 300", "detalhe", 0.25, 0.35),
    P("M 164 300 C 130 312 84 320 62 346 C 44 368 38 420 36 540", "contorno", 0.32, 0.7),
    P("M 164 300 C 172 330 186 352 200 360", "detalhe", 0.45, 0.4),
    P("M 86 420 C 88 470 90 510 90 540", "fino", 0.55, 0.4, { opacidade: 0.6 }),
    P(losango(200, 400, 10), "fino", 0.7, 0.3, { espelho: false, ouro: true }),
  ],
  vagas: [V(200, 120, 56, 40), V(200, 300, 30, 24), V(112, 380, 38, 30), V(288, 380, 38, 30), V(200, 462, 62, 40)],
  escolha: { 2: [0, 4], 3: [0, 1, 4], 4: [0, 2, 3, 4], 5: [0, 1, 2, 3, 4] },
  guias: [46, 150, 256, 360],
  guiaOuro: 150,
  pe: 540,
};

// ---------------------------------------------------------------- coração (relações, afeto, saúde)
const coracao: DefFigura = {
  extensao: [44, 356],
  partes: [
    P("M 200 476 C 150 428 66 362 52 272 C 40 198 86 128 150 126 C 176 126 194 142 200 164", "contorno", 0, 0.8),
    P("M 200 436 C 160 398 92 342 82 270 C 74 212 108 158 152 156 C 172 156 190 168 200 190", "detalhe", 0.2, 0.7, { opacidade: 0.75 }),
    P("M 100 222 C 110 198 128 184 150 180", "fino", 0.5, 0.35, { opacidade: 0.55 }),
    P("M 98 262 C 102 246 108 236 116 228", "fino", 0.56, 0.3, { opacidade: 0.45 }),
    P("M 200 192 L 200 432", "fino", 0.6, 0.5, { espelho: false, tracejado: "4 8", opacidade: 0.6 }),
    P(losango(200, 150, 9), "fino", 0.7, 0.3, { espelho: false, ouro: true }),
  ],
  vagas: [V(132, 210, 44, 38), V(268, 210, 44, 38), V(200, 296, 50, 34), V(132, 318, 30, 26), V(200, 412, 34, 30)],
  escolha: { 2: [0, 1], 3: [0, 1, 4], 4: [0, 1, 2, 4], 5: [0, 1, 2, 3, 4] },
  guias: [126, 272, 476],
  guiaOuro: 272,
  pe: 476,
};

// ---------------------------------------------------------------- lâmpada (ideia, aprendizado, criação)
const lampada: DefFigura = {
  extensao: [0, 400],
  partes: [
    P("M 200 20 C 124 20 64 78 64 154 C 64 208 92 246 118 278 C 132 296 138 314 138 336", "contorno", 0, 0.8),
    P("M 138 336 L 200 336", "detalhe", 0.3, 0.3),
    P("M 140 336 L 140 438", "detalhe", 0.34, 0.4),
    P("M 140 360 L 200 360 M 140 384 L 200 384 M 140 408 L 200 408", "fino", 0.42, 0.4),
    P("M 140 438 C 148 456 164 466 184 468 L 200 468", "contorno", 0.45, 0.4),
    P("M 184 468 C 188 480 194 484 200 484", "detalhe", 0.5, 0.3),
    P("M 186 336 L 186 238", "fino", 0.5, 0.4),
    P("M 186 238 Q 191 222 196 238 Q 200 252 204 238 Q 209 222 214 238", "detalhe", 0.6, 0.45, { espelho: false, ouro: true }),
    P("M 40 62 L 18 46 M 30 152 L 4 152 M 44 242 L 20 258", "fino", 0.75, 0.4, { ouro: true }),
  ],
  vagas: [V(200, 92, 58, 40), V(118, 172, 34, 40), V(282, 172, 34, 40), V(200, 252, 40, 30), V(200, 398, 56, 40)],
  escolha: { 2: [0, 4], 3: [0, 3, 4], 4: [0, 1, 2, 4], 5: [0, 1, 2, 3, 4] },
  guias: [20, 154, 336, 468],
  guiaOuro: 238,
  pe: 484,
};

// ---------------------------------------------------------------- ampulheta (tempo, prazo, paciência)
const ampulheta: DefFigura = {
  extensao: [50, 350],
  partes: [
    P("M 200 20 L 66 20 C 60 20 58 24 58 30 L 58 36 C 58 42 62 46 68 46 L 200 46", "contorno", 0, 0.5),
    P("M 200 520 L 66 520 C 60 520 58 516 58 510 L 58 504 C 58 498 62 494 68 494 L 200 494", "contorno", 0.05, 0.5),
    P("M 80 46 L 80 494", "detalhe", 0.2, 0.5),
    P("M 73 72 L 87 72 M 73 468 L 87 468", "fino", 0.5, 0.3),
    P("M 112 46 C 112 150 150 222 188 262 L 188 278 C 150 318 112 390 112 494", "contorno", 0.25, 0.7),
    P("M 126 150 L 200 150", "fino", 0.5, 0.3),
    P("M 114 494 C 140 470 170 432 200 428", "detalhe", 0.55, 0.4),
    P("M 200 280 L 200 426", "fino", 0.65, 0.4, { espelho: false, ouro: true, tracejado: "3 7" }),
  ],
  vagas: [V(200, 104, 56, 36), V(200, 204, 34, 30), V(200, 270, 22, 18), V(200, 370, 36, 30), V(200, 466, 64, 24)],
  escolha: { 2: [0, 4], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4] },
  guias: [46, 150, 428, 494],
  guiaOuro: 270,
  pe: 520,
};

// ---------------------------------------------------------------- casa (lar, família, imóveis)
const casa: DefFigura = {
  extensao: [24, 376],
  partes: [
    P("M 200 30 L 34 196 L 62 196", "contorno", 0, 0.6),
    P("M 200 62 L 80 182", "fino", 0.2, 0.45, { opacidade: 0.7 }),
    P("M 62 186 L 62 510", "contorno", 0.25, 0.55),
    P("M 30 510 L 200 510", "detalhe", 0.4, 0.4),
    P(elipse(200, 150, 26, 26), "detalhe", 0.35, 0.4, { espelho: false }),
    P("M 174 150 L 226 150 M 200 124 L 200 176", "fino", 0.5, 0.3, { espelho: false }),
    P("M 92 250 L 152 250 L 152 330 L 92 330 Z", "detalhe", 0.4, 0.5),
    P("M 122 250 L 122 330 M 92 290 L 152 290", "fino", 0.55, 0.3),
    P("M 86 338 L 158 338", "fino", 0.6, 0.25),
    P("M 164 510 L 164 400 C 164 376 180 362 200 362", "detalhe", 0.45, 0.5),
    P(losango(200, 440, 9), "fino", 0.7, 0.3, { espelho: false, ouro: true }),
  ],
  vagas: [V(200, 150, 42, 36), V(122, 290, 42, 48), V(278, 290, 42, 48), V(200, 440, 30, 58), V(200, 524, 120, 12)],
  escolha: { 2: [0, 3], 3: [0, 1, 2], 4: [0, 1, 2, 3], 5: [0, 1, 2, 3, 4] },
  guias: [30, 196, 362, 510],
  guiaOuro: 290,
  pe: 510,
};

// ---------------------------------------------------------------- planta (crescimento, rotina, cuidado)
const folhas = [
  [340, 116],
  [270, 104],
  [200, 88],
  [136, 66],
].map(([y, L]) => ({ y, L, d: folha(200, y, 200 - L, y - L * 0.36, L * 0.2) }));
const planta: DefFigura = {
  extensao: [76, 324],
  partes: [
    P("M 200 384 L 104 384 L 104 404 L 200 404", "contorno", 0, 0.5),
    P("M 114 404 L 134 526 L 200 526", "contorno", 0.08, 0.5),
    P("M 200 384 C 200 300 197 200 200 54", "detalhe", 0.15, 0.6, { espelho: false }),
    ...folhas.map((l, i) => P(l.d, "detalhe", 0.3 + i * 0.08, 0.45)),
    ...folhas.map((l, i) => P(`M 200 ${l.y} L ${f(200 - l.L * 0.78)} ${f(l.y - l.L * 0.28)}`, "fino", 0.42 + i * 0.08, 0.35, { opacidade: 0.6 })),
    P("M 200 54 C 188 36 192 14 200 4 C 208 14 212 36 200 54", "detalhe", 0.62, 0.35, { espelho: false }),
    P(losango(200, 452, 9), "fino", 0.7, 0.3, { espelho: false, ouro: true }),
  ],
  vagas: [V(200, 34, 26, 30), V(130, 196, 40, 24), V(270, 266, 42, 26), V(126, 330, 46, 28), V(200, 458, 56, 40)],
  // a planta cresce: os números vão do vaso (1) até o broto (o último)
  escolha: { 2: [4, 0], 3: [4, 2, 0], 4: [4, 3, 2, 0], 5: [4, 3, 2, 1, 0] },
  guias: [54, 200, 340, 404],
  guiaOuro: 270,
  pe: 526,
};

// ---------------------------------------------------------------- livro (estudo, história, conhecimento)
const linhasDoLivro = [168, 198, 228, 258, 288, 318, 348, 378]
  .map((y) => `M 66 ${y} C 100 ${y - 4} 140 ${y - 1} 176 ${y + 9}`)
  .join(" ");
const livro: DefFigura = {
  extensao: [30, 370],
  partes: [
    P("M 200 128 C 160 102 100 94 36 104 L 36 424 C 100 414 160 422 200 446", "contorno", 0, 0.8),
    P("M 36 424 L 36 438 C 100 428 160 436 200 460", "detalhe", 0.3, 0.4),
    P("M 200 128 L 200 460", "detalhe", 0.2, 0.5, { espelho: false }),
    P(linhasDoLivro, "fino", 0.4, 0.6, { opacidade: 0.55 }),
    P("M 194 446 L 194 524 L 200 514 L 206 524 L 206 446", "fino", 0.6, 0.4, { espelho: false, ouro: true }),
  ],
  vagas: [V(118, 182, 50, 30), V(282, 182, 50, 30), V(118, 318, 50, 30), V(282, 318, 50, 30), V(200, 494, 26, 30)],
  escolha: { 2: [0, 1], 3: [0, 1, 4], 4: [0, 1, 2, 3], 5: [0, 1, 2, 3, 4] },
  guias: [104, 268, 446],
  guiaOuro: 268,
  pe: 524,
};

export const FIGURAS: Record<Exclude<Figura, "rosto">, DefFigura> = {
  espelho,
  moeda,
  microfone,
  pessoa,
  coracao,
  lampada,
  ampulheta,
  casa,
  planta,
  livro,
};

// As vagas usadas por n pontos (de 1 a 5), na ordem em que acendem
export const vagasPara = (def: DefFigura, n: number) => {
  const k = Math.max(2, Math.min(5, n)) as 2 | 3 | 4 | 5;
  return n <= 1 ? [def.escolha[2][0]] : def.escolha[k];
};
