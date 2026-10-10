// Caminhos SVG simples (em px). Tudo ortogonal: retângulos, linhas, círculos.
const n = (v: number) => Math.round(v * 10) / 10;

export const ret = (x: number, y: number, w: number, h: number) =>
  `M${n(x)} ${n(y)}H${n(x + w)}V${n(y + h)}H${n(x)}Z`;

export const retR = (x: number, y: number, w: number, h: number, r: number) => {
  const q = Math.max(0, Math.min(r, w / 2, h / 2));
  if (q < 0.5) return ret(x, y, w, h);
  return `M${n(x + q)} ${n(y)}H${n(x + w - q)}Q${n(x + w)} ${n(y)} ${n(x + w)} ${n(y + q)}V${n(y + h - q)}Q${n(x + w)} ${n(
    y + h,
  )} ${n(x + w - q)} ${n(y + h)}H${n(x + q)}Q${n(x)} ${n(y + h)} ${n(x)} ${n(y + h - q)}V${n(y + q)}Q${n(x)} ${n(y)} ${n(
    x + q,
  )} ${n(y)}Z`;
};

export const lin = (x1: number, y1: number, x2: number, y2: number) => `M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`;

export const circ = (cx: number, cy: number, r: number) =>
  `M${n(cx - r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 1 ${n(cx + r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 1 ${n(cx - r)} ${n(cy)}`;

export const poli = (pontos: [number, number][], fechar = false) =>
  pontos.map(([x, y], i) => `${i ? "L" : "M"}${n(x)} ${n(y)}`).join("") + (fechar ? "Z" : "");

// Onda (cortina vista de cima): ao longo de x, amplitude a, em torno de y0
export const onda = (x0: number, x1: number, y0: number, a: number, passo: number) => {
  const pts: string[] = [`M${n(x0)} ${n(y0)}`];
  let x = x0;
  let lado = 1;
  while (x < x1 - 0.5) {
    const prox = Math.min(x1, x + passo);
    pts.push(`Q${n((x + prox) / 2)} ${n(y0 + a * lado * 2)} ${n(prox)} ${n(y0)}`);
    lado *= -1;
    x = prox;
  }
  return pts.join("");
};

// Trecho inicial de uma polilinha, até a fração p do comprimento (para tracejados que se desenham)
export const polilinhaParcial = (pontos: [number, number][], p: number) => {
  if (pontos.length < 2) return { pontos, fim: pontos[0] ?? [0, 0], direcao: [1, 0] as [number, number] };
  const trechos = pontos.slice(1).map((b, i) => {
    const a = pontos[i];
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
  });
  const total = trechos.reduce((s, v) => s + v, 0);
  let resta = total * Math.max(0, Math.min(1, p));
  const saida: [number, number][] = [pontos[0]];
  let direcao: [number, number] = [1, 0];
  for (let i = 0; i < trechos.length; i++) {
    const a = pontos[i];
    const b = pontos[i + 1];
    const len = trechos[i] || 1;
    direcao = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    if (resta >= trechos[i]) {
      saida.push(b);
      resta -= trechos[i];
    } else {
      const f = resta / len;
      saida.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
      break;
    }
  }
  return { pontos: saida, fim: saida[saida.length - 1], direcao };
};

// Mistura de duas cores hex (para o objeto voltar do acento ao grafite sem salto)
export const misturarCor = (a: string, b: string, p: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const q = Math.max(0, Math.min(1, p));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * q)).join(",")})`;
};
