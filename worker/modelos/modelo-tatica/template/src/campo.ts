// Geometria da prancheta: o campo em perspectiva leve (a câmera atrás do lance, olhando para o gol)
// e o gol visto de frente. Tudo em px do quadro 1080×1920.
import type { Ponto, Zona } from "./plano";

// ---------- o campo ----------
// A linha do gol fica em y = 790 (logo abaixo da caixa de transmissão) e o ponto a 19,5 m dela em
// y = 1560 (limite da interface do app). A câmera fica a 55 m da linha do gol (perspectiva leve) e
// fechada na área: a tela mostra uns 26 m de largura na altura da marca do pênalti.
const V0 = 55;
const Y_GOL = 790;
const Y_BASE = 1560;
const V_BASE = 19.5;
const B = 1745;
const A = (Y_BASE - Y_GOL) / (1 / (V0 - V_BASE) - 1 / V0);
const YH = Y_GOL - A / V0;
export const CX = 540;

// metros → tela. `s` = px por metro naquela profundidade (para tamanhos e alturas)
export const projetar = (x: number, y: number, altura = 0) => {
  const z = Math.max(4, V0 - y);
  const s = B / z;
  return { x: CX + x * s, y: YH + A / z - altura * s * 0.9, s };
};

// px por metro na altura `y` da tela (para a bola em movimento, que não tem posição em metros)
export const escalaEm = (y: number) => (B * Math.max(1, y - YH)) / A;

// medidas oficiais (m)
export const MEDIDAS = {
  gol: 7.32,
  alturaGol: 2.44,
  pequenaArea: { largura: 18.32, fundo: 5.5 },
  grandeArea: { largura: 40.32, fundo: 16.5 },
  penalti: 11,
  raioArco: 9.15,
};

// o gol na tela do campo: centro da boca e largura (para casar com a vista de frente)
export const GOL_NO_CAMPO = (() => {
  const base = projetar(0, 0);
  const alto = projetar(0, 0, MEDIDAS.alturaGol);
  return { x: base.x, y: (base.y + alto.y) / 2, largura: MEDIDAS.gol * base.s };
})();

// alvo de um chute no campo (um pouco para dentro da trave, meio metro do chão, já dentro do gol)
export const alvoNoGol = (lado: "esquerda" | "direita" | "centro") => {
  const x = lado === "esquerda" ? -2.9 : lado === "direita" ? 2.9 : 0;
  return projetar(x, -0.4, 0.55);
};

// tamanho das fichas: cresce um pouco quando estão mais perto da câmera
export const raioFicha = (s: number) => 50 * Math.min(1.1, Math.max(0.9, s / 40));

// faixas de corte da grama (a cada 5,5 m), de trás do gol até perto da câmera
export const faixasDoCampo = () => {
  const faixas: { y0: number; y1: number; clara: boolean; fora: boolean }[] = [];
  for (let v = -16.5; v < 60; v += 5.5) {
    const y0 = projetar(0, v + 5.5).y;
    const y1 = projetar(0, v).y;
    faixas.push({ y0: Math.min(y0, y1), y1: Math.max(y0, y1), clara: Math.round(v / 5.5) % 2 === 0, fora: v < 0 });
  }
  return faixas;
};

// curva de um passe/chute: quadrática com uma barriga leve para o lado
export type Curva = { p0: Ponto; p1: Ponto; p2: Ponto };
export const curvar = (a: Ponto, b: Ponto, barriga = 0.08): Curva => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return { p0: a, p1: { x: mx - dy * barriga, y: my + dx * barriga }, p2: b };
};
export const pontoNaCurva = (c: Curva, u: number): Ponto => {
  const a = 1 - u;
  return {
    x: a * a * c.p0.x + 2 * a * u * c.p1.x + u * u * c.p2.x,
    y: a * a * c.p0.y + 2 * a * u * c.p1.y + u * u * c.p2.y,
  };
};
export const tangenteNaCurva = (c: Curva, u: number): Ponto => ({
  x: 2 * (1 - u) * (c.p1.x - c.p0.x) + 2 * u * (c.p2.x - c.p1.x),
  y: 2 * (1 - u) * (c.p1.y - c.p0.y) + 2 * u * (c.p2.y - c.p1.y),
});
// trecho [u0, u1] da curva como path SVG (de Casteljau)
export const trechoDaCurva = (c: Curva, u0: number, u1: number) => {
  const em = (u: number) => pontoNaCurva(c, u);
  const ini = em(u0);
  const fim = em(u1);
  // controle do trecho: interseção das tangentes nas pontas
  const t0 = tangenteNaCurva(c, u0);
  const k = (u1 - u0) / 2;
  const ctrl = { x: ini.x + t0.x * k, y: ini.y + t0.y * k };
  return `M ${ini.x.toFixed(1)} ${ini.y.toFixed(1)} Q ${ctrl.x.toFixed(1)} ${ctrl.y.toFixed(1)} ${fim.x.toFixed(1)} ${fim.y.toFixed(1)}`;
};
// em que fração da curva fica a distância `d` (px) a partir do começo / antes do fim (aproximado)
export const comprimento = (c: Curva) => {
  let total = 0;
  let ant = c.p0;
  for (let i = 1; i <= 24; i++) {
    const p = pontoNaCurva(c, i / 24);
    total += Math.hypot(p.x - ant.x, p.y - ant.y);
    ant = p;
  }
  return total;
};

// ---------- o gol visto de frente ----------
// A boca do gol: 960 px de largura (7,32 m), 320 px de altura (2,44 m)
export const GOL = {
  esquerda: 60,
  direita: 1020,
  travessao: 930,
  chao: 1250,
  trave: 20,
  // o fundo da rede (perspectiva para dentro)
  fundo: { esquerda: 128, direita: 952, topo: 980, chao: 1238 },
  // a linha da pequena área, à frente
  pequenaArea: 1404,
  // quem chuta (perto da câmera) e a bola no pé dele
  atacante: { x: 448, y: 1486, r: 62 },
  bolaInicio: { x: 580, y: 1478, r: 42 },
};
export const CENTRO_GOL = { x: (GOL.esquerda + GOL.direita) / 2, y: (GOL.travessao + GOL.chao) / 2 };
export const PX_POR_METRO = (GOL.direita - GOL.esquerda) / MEDIDAS.gol;

const terco = (GOL.direita - GOL.esquerda) / 3;
const meiaAltura = (GOL.chao - GOL.travessao) / 2;
const colunas = { esquerda: [GOL.esquerda, GOL.esquerda + terco], centro: [GOL.esquerda + terco, GOL.esquerda + 2 * terco], direita: [GOL.esquerda + 2 * terco, GOL.direita] } as const;
const linhas = { alto: [GOL.travessao, GOL.travessao + meiaAltura], baixo: [GOL.travessao + meiaAltura, GOL.chao] } as const;

export const retanguloDaZona = (z: Zona) => {
  const [c, l] = z.split("-") as ["esquerda" | "centro" | "direita", "alto" | "baixo"];
  const [x0, x1] = colunas[c];
  const [y0, y1] = linhas[l];
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, coluna: c, linha: l };
};

// onde a bola para dentro da zona (no canto, para "canto" ler como canto)
export const alvoDaZona = (z: Zona) => {
  const r = retanguloDaZona(z);
  const x = r.coluna === "esquerda" ? r.x + 128 : r.coluna === "direita" ? r.x + r.w - 128 : r.x + r.w / 2;
  const y = r.linha === "baixo" ? GOL.chao - 28 : r.y + 66;
  return { x, y };
};

export const TODAS_AS_ZONAS: Zona[] = ["esquerda-alto", "centro-alto", "direita-alto", "esquerda-baixo", "centro-baixo", "direita-baixo"];
