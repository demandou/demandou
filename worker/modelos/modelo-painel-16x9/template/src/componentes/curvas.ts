// Curva monotônica (Fritsch–Carlson): passa por todos os pontos sem "inventar" subidas
// ou descidas entre eles. Serve para desenhar o caminho e para achar o valor em qualquer x.

export type Ponto = { x: number; y: number };

const tangentes = (p: Ponto[]) => {
  const n = p.length;
  const d = p.slice(0, -1).map((a, i) => (p[i + 1].y - a.y) / (p[i + 1].x - a.x || 1));
  const m = p.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  return m;
};

// Caminho SVG ("M … C …") pela curva. `continuar` = sem o "M" inicial (para emendar áreas).
export const caminho = (p: Ponto[], continuar = false) => {
  if (p.length === 0) return "";
  if (p.length === 1) return `${continuar ? "L" : "M"}${p[0].x},${p[0].y}`;
  const m = tangentes(p);
  let s = `${continuar ? "L" : "M"}${p[0].x},${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const h = p[i + 1].x - p[i].x;
    s += ` C${p[i].x + h / 3},${p[i].y + (m[i] * h) / 3} ${p[i + 1].x - h / 3},${p[i + 1].y - (m[i + 1] * h) / 3} ${p[i + 1].x},${p[i + 1].y}`;
  }
  return s;
};

// Valor da curva em x (mesma curva do caminho).
export const valorEm = (p: Ponto[], x: number) => {
  if (p.length === 1) return p[0].y;
  if (x <= p[0].x) return p[0].y;
  if (x >= p[p.length - 1].x) return p[p.length - 1].y;
  const m = tangentes(p);
  let k = 0;
  while (k < p.length - 2 && x > p[k + 1].x) k++;
  const h = p[k + 1].x - p[k].x;
  const s = (x - p[k].x) / h;
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1;
  const h10 = s ** 3 - 2 * s ** 2 + s;
  const h01 = -2 * s ** 3 + 3 * s ** 2;
  const h11 = s ** 3 - s ** 2;
  return h00 * p[k].y + h10 * h * m[k] + h01 * p[k + 1].y + h11 * h * m[k + 1];
};

// Pontos de uma curva de crescimento composto, para miniaturas (0→1 em x e y).
export const curvaComposta = (n = 24, forca = 2.6) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const x = i / n;
    return { x, y: (Math.exp(forca * x) - 1) / (Math.exp(forca) - 1) };
  });
