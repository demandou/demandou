// Plantas (em METROS) de cada forma: apartamento (o exemplo, 9 × 8 m), casa (com garagem, quintal e
// piscina), sala comercial (as mesmas paredes, outra mobília) e terreno (o lote em quatro áreas).
// Cada forma cabe no mesmo espaço do mundo (a escala `pm` ajusta), então a câmera é a mesma para todas.
export type Piso = "wood" | "tile" | "stone" | "deck" | "grass" | "concrete" | "water";
export type Peca = { id: string; nome: string; x0: number; z0: number; x1: number; z1: number; floor: Piso; ancora?: [number, number] };
/** paredes [x0, z0, x1, z1, tipo]. tipo: 0 alvenaria, 1 janela, 2 guarda-corpo de vidro, 3 porta de correr, 4 muro baixo, 5 cerca */
export type Parede = [number, number, number, number, number];
/** portas: dobradiça (x, z), ângulo da folha aberta (rad, 0 = +x), largura */
export type Porta = [number, number, number, number];
export type Forma = "apartamento" | "casa" | "sala" | "terreno";
export type DadosPlanta = { pecas: Peca[]; paredes: Parede[]; portas: Porta[]; x0: number; z0: number; x1: number; z1: number; externas: (a: Parede) => boolean };

const PECAS_APTO: Peca[] = [
  { id: "s1", nome: "Suíte 1", x0: 5, z0: 4.5, x1: 9, z1: 8, floor: "wood" },
  { id: "s2", nome: "Suíte 2", x0: 5, z0: 0, x1: 9, z1: 3, floor: "wood" },
  { id: "va", nome: "Varanda", x0: 0, z0: 6, x1: 4.5, z1: 8, floor: "deck" },
  { id: "co", nome: "Cozinha", x0: 0, z0: 0, x1: 5, z1: 2.9, floor: "tile" },
  { id: "li", nome: "Estar", x0: 0, z0: 2.9, x1: 5, z1: 6, floor: "wood" },
  { id: "b1", nome: "Banho", x0: 5, z0: 3, x1: 7, z1: 4.5, floor: "stone" },
  { id: "b2", nome: "Banho", x0: 7, z0: 3, x1: 9, z1: 4.5, floor: "stone" },
];
const PAREDES_APTO: Parede[] = [
  // fundo (z = 0)
  [0, 0, 1.2, 0, 0],
  [1.2, 0, 3.4, 0, 1],
  [3.4, 0, 6.1, 0, 0],
  [6.1, 0, 8.4, 0, 1],
  [8.4, 0, 9, 0, 0],
  // lateral esquerda (x = 0)
  [0, 0, 0, 3.3, 0],
  [0, 3.3, 0, 5.4, 1],
  [0, 5.4, 0, 6, 0],
  // lateral direita (x = 9)
  [9, 0, 9, 8, 0],
  // frente (z = 8)
  [5, 8, 5.5, 8, 0],
  [5.5, 8, 8.6, 8, 1],
  [8.6, 8, 9, 8, 0],
  [4.5, 8, 5, 8, 0],
  [4.5, 6, 4.5, 8, 0],
  // internas
  [5, 0, 5, 1.0, 0],
  [5, 1.9, 5, 5.0, 0],
  [5, 5.9, 5, 8, 0],
  [5, 3, 7.85, 3, 0],
  [8.6, 3, 9, 3, 0],
  [5, 4.5, 5.5, 4.5, 0],
  [6.3, 4.5, 9, 4.5, 0],
  [7, 3, 7, 4.5, 0],
  // varanda
  [0, 6, 4.5, 6, 3],
  [0, 6, 0, 8, 2],
  [0, 8, 4.5, 8, 2],
];
const PORTAS_APTO: Porta[] = [
  [5, 1.0, 0, 0.85],
  [5, 5.9, 0, 0.85],
  [5.5, 4.5, -Math.PI / 2, 0.75],
  [7.85, 3, Math.PI / 2, 0.72],
];
const externaApto = ([ax, az, bx, bz]: Parede) => (ax === 0 && bx === 0) || (az === 0 && bz === 0) || (ax === 9 && bx === 9) || (az === 8 && bz === 8);

export const DADOS: Record<Forma, DadosPlanta> = {
  apartamento: { pecas: PECAS_APTO, paredes: PAREDES_APTO, portas: PORTAS_APTO, x0: 0, z0: 0, x1: 9, z1: 8, externas: externaApto },
  sala: {
    pecas: PECAS_APTO.map((p) => ({ ...p, floor: p.id === "co" || p.id === "va" ? "tile" : p.id.startsWith("b") ? "stone" : "wood" })),
    paredes: PAREDES_APTO.map((w) => (w[4] === 2 ? ([w[0], w[1], w[2], w[3], 1] as Parede) : w)),
    portas: PORTAS_APTO,
    x0: 0,
    z0: 0,
    x1: 9,
    z1: 8,
    externas: externaApto,
  },
  casa: {
    pecas: [
      ...PECAS_APTO,
      { id: "ga", nome: "Garagem", x0: -3.4, z0: 0, x1: 0, z1: 6, floor: "concrete", ancora: [-1.7, 4.6] },
      { id: "qt", nome: "Quintal", x0: -3.4, z0: 8, x1: 9, z1: 11, floor: "grass", ancora: [7.0, 9.5] },
      { id: "pi", nome: "Piscina", x0: 0.6, z0: 8.6, x1: 4.6, z1: 10.4, floor: "water" },
    ],
    paredes: [
      ...PAREDES_APTO,
      // muro baixo do lote
      [-3.4, 0, -3.4, 11, 4],
      [-3.4, 11, 9, 11, 4],
      [9, 8, 9, 11, 4],
      [-3.4, 0, 0, 0, 4],
    ],
    portas: PORTAS_APTO,
    x0: -3.4,
    z0: 0,
    x1: 9,
    z1: 11,
    externas: externaApto,
  },
  terreno: {
    pecas: [
      { id: "z1", nome: "Frente", x0: 0, z0: 4.5, x1: 6, z1: 9, floor: "grass" },
      { id: "z2", nome: "Frente", x0: 6, z0: 4.5, x1: 12, z1: 9, floor: "grass" },
      { id: "z3", nome: "Fundos", x0: 0, z0: 0, x1: 6, z1: 4.5, floor: "grass" },
      { id: "z4", nome: "Fundos", x0: 6, z0: 0, x1: 12, z1: 4.5, floor: "grass" },
    ],
    paredes: [
      [0, 0, 12, 0, 5],
      [12, 0, 12, 9, 5],
      [12, 9, 0, 9, 5],
      [0, 9, 0, 0, 5],
    ],
    portas: [],
    x0: 0,
    z0: 0,
    x1: 12,
    z1: 9,
    externas: () => true,
  },
};

/** escala (mundo por metro) e centro de cada forma: todas cabem na área da planta do exemplo (4,5 × 4 u) */
export const escalaDa = (d: DadosPlanta) => {
  const pm = 0.5 * Math.min(9 / (d.x1 - d.x0), 8 / (d.z1 - d.z0));
  return { pm, cx: (d.x0 + d.x1) / 2, cz: (d.z0 + d.z1) / 2 };
};
/** metros da planta → mundo (x, z) */
export const noMundo = (d: DadosPlanta, mx: number, mz: number): [number, number] => {
  const { pm, cx, cz } = escalaDa(d);
  return [(mx - cx) * pm, (mz - cz) * pm];
};
export const PLAN_Y = 0.42; // a planta flutua um pouco acima do chão (sombra suave embaixo)
