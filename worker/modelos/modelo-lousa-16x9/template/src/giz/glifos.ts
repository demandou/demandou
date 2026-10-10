// Algarismos e sinais "de giz": cada caractere é desenhado com traços de uma linha só,
// na ordem em que uma mão escreveria. Assim a conta aparece traço a traço (não surge pronta).
// Caixa de desenho: altura 100 (topo 0, linha de base 100); `a` é o avanço horizontal.
// Letras que não estão aqui são escritas com a fonte manuscrita (ver Escrita.tsx).

type Glifo = { a: number; t: string[] };

const circulo = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx + 2} ${cy - ry} C ${cx - rx * 0.62} ${cy - ry - 1}, ${cx - rx} ${cy - ry * 0.5}, ${cx - rx} ${cy} ` +
  `C ${cx - rx} ${cy + ry * 0.55}, ${cx - rx * 0.55} ${cy + ry}, ${cx} ${cy + ry} ` +
  `C ${cx + rx * 0.55} ${cy + ry}, ${cx + rx} ${cy + ry * 0.55}, ${cx + rx} ${cy} ` +
  `C ${cx + rx} ${cy - ry * 0.55}, ${cx + rx * 0.5} ${cy - ry}, ${cx - 3} ${cy - ry + 1}`;

const ponto = (cx: number, cy: number) => `M ${cx} ${cy - 3} L ${cx + 0.5} ${cy + 3}`;

export const GLIFOS: Record<string, Glifo> = {
  "0": { a: 74, t: [circulo(36, 50, 29, 49)] },
  "1": { a: 56, t: ["M 12 24 C 20 18, 28 10, 34 1 L 34 99"] },
  "2": { a: 74, t: ["M 9 25 C 11 10, 22 1, 36 1 C 51 1, 61 12, 61 26 C 61 44, 44 60, 9 99 L 66 99"] },
  "3": {
    a: 72,
    t: ["M 10 15 C 17 6, 27 1, 37 1 C 51 1, 60 11, 60 24 C 60 38, 48 47, 32 47 C 50 47, 63 58, 63 73 C 63 89, 51 99, 34 99 C 22 99, 12 94, 6 86"],
  },
  "4": { a: 76, t: ["M 47 2 L 6 67 L 69 67", "M 49 31 L 49 99"] },
  "5": {
    a: 72,
    t: ["M 16 3 L 11 47 C 20 40, 29 37, 38 37 C 54 37, 64 50, 64 67 C 64 86, 51 99, 34 99 C 22 99, 12 94, 6 86", "M 16 3 L 60 3"],
  },
  "6": {
    a: 74,
    t: ["M 57 7 C 50 3, 44 1, 38 1 C 19 1, 8 24, 8 55 C 8 82, 20 99, 37 99 C 54 99, 65 86, 65 69 C 65 52, 53 42, 38 42 C 24 42, 13 51, 9 62"],
  },
  "7": { a: 70, t: ["M 6 3 L 64 3 L 26 99"] },
  "8": {
    a: 74,
    t: [
      "M 57 15 C 53 6, 45 1, 36 1 C 22 1, 12 9, 12 22 C 12 36, 25 42, 36 48 C 51 55, 63 63, 63 77 C 63 91, 51 99, 36 99 C 21 99, 9 91, 9 77 C 9 63, 22 55, 36 48 C 47 42, 60 36, 60 22 C 60 19, 59 17, 57 15",
    ],
  },
  "9": {
    a: 74,
    t: ["M 62 31 C 62 14, 50 1, 36 1 C 21 1, 10 12, 10 28 C 10 44, 21 55, 35 55 C 49 55, 62 45, 62 31 L 62 56 C 62 82, 51 99, 30 99 C 22 99, 15 97, 11 93"],
  },
  "%": { a: 92, t: [circulo(21, 21, 15, 19), "M 74 2 L 18 99", circulo(70, 80, 15, 19)] },
  ",": { a: 26, t: ["M 13 86 C 16 89, 17 95, 15 101 C 13 107, 9 112, 4 116"] },
  ".": { a: 24, t: [ponto(12, 94)] },
  "+": { a: 76, t: ["M 38 30 L 38 88", "M 9 59 L 67 59"] },
  "-": { a: 66, t: ["M 9 58 L 57 58"] },
  "−": { a: 76, t: ["M 9 59 L 67 59"] },
  "=": { a: 76, t: ["M 9 44 L 67 44", "M 9 72 L 67 72"] },
  "÷": { a: 76, t: ["M 9 59 L 67 59", ponto(38, 33), ponto(38, 85)] },
  "×": { a: 70, t: ["M 12 36 L 58 84", "M 58 36 L 12 84"] },
  "/": { a: 54, t: ["M 46 0 L 8 100"] },
  ":": { a: 26, t: [ponto(13, 46), ponto(13, 90)] },
  "(": { a: 38, t: ["M 30 -4 C 12 18, 8 38, 8 50 C 8 64, 12 82, 30 104"] },
  ")": { a: 38, t: ["M 8 -4 C 26 18, 30 38, 30 50 C 30 64, 26 82, 8 104"] },
  R: { a: 70, t: ["M 10 99 L 10 3 C 30 1, 55 5, 55 27 C 55 47, 33 52, 12 51", "M 30 51 L 61 99"] },
  // "U" e "S" a traço só no "US$" (nas palavras são letras da fonte)
  U: { a: 74, t: ["M 10 3 L 10 64 C 10 87, 21 99, 37 99 C 53 99, 64 87, 64 64 L 64 3"] },
  S: {
    a: 68,
    t: ["M 57 17 C 53 8, 45 2, 34 2 C 21 2, 11 10, 11 23 C 11 38, 24 44, 35 49 C 48 55, 59 62, 59 76 C 59 90, 48 98, 34 98 C 22 98, 12 92, 7 82"],
  },
  $: {
    a: 66,
    t: [
      "M 54 20 C 50 10, 42 5, 33 5 C 21 5, 12 13, 12 25 C 12 39, 25 45, 35 50 C 47 56, 57 63, 57 76 C 57 89, 47 97, 34 97 C 22 97, 13 91, 9 82",
      "M 34 -7 L 34 108",
    ],
  },
  "≈": { a: 78, t: ["M 9 50 C 19 39, 29 39, 38 47 C 47 55, 57 55, 68 44", "M 9 76 C 19 65, 29 65, 38 73 C 47 81, 57 81, 68 70"] },
  "→": { a: 92, t: ["M 8 59 L 80 59", "M 58 39 L 82 59 L 58 79"] },
  " ": { a: 34, t: [] },
};

export const temGlifo = (c: string) => c in GLIFOS;

// ---------- geometria dos caminhos (só M, L e C absolutos) ----------

type Seg = { tipo: "M" | "L" | "C"; p: number[] };

const lerCaminho = (d: string): Seg[] => {
  const partes = d.match(/[MLC]|-?\d*\.?\d+/g) ?? [];
  const segs: Seg[] = [];
  let tipo: Seg["tipo"] = "M";
  let nums: number[] = [];
  const fechar = () => {
    const n = tipo === "C" ? 6 : 2;
    for (let i = 0; i + n <= nums.length; i += n) segs.push({ tipo: i === 0 || tipo !== "M" ? tipo : "L", p: nums.slice(i, i + n) });
    nums = [];
  };
  for (const x of partes) {
    if (x === "M" || x === "L" || x === "C") {
      fechar();
      tipo = x;
    } else nums.push(Number(x));
  }
  fechar();
  return segs;
};

const bezier = (a: number, b: number, c: number, d: number, t: number) =>
  (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d;

// comprimento aproximado de um caminho (nas unidades do próprio caminho)
export const comprimento = (d: string) => {
  let x = 0;
  let y = 0;
  let total = 0;
  for (const s of lerCaminho(d)) {
    if (s.tipo === "M") [x, y] = s.p;
    else if (s.tipo === "L") {
      total += Math.hypot(s.p[0] - x, s.p[1] - y);
      [x, y] = s.p;
    } else {
      let px = x;
      let py = y;
      for (let k = 1; k <= 16; k++) {
        const t = k / 16;
        const nx = bezier(x, s.p[0], s.p[2], s.p[4], t);
        const ny = bezier(y, s.p[1], s.p[3], s.p[5], t);
        total += Math.hypot(nx - px, ny - py);
        px = nx;
        py = ny;
      }
      [x, y] = [s.p[4], s.p[5]];
    }
  }
  return total;
};

// ponto num caminho a uma fração do comprimento (para algo que anda sobre uma seta)
export const pontoNoCaminho = (d: string, f: number): [number, number] => {
  const pontos: [number, number][] = [];
  let x = 0;
  let y = 0;
  for (const s of lerCaminho(d)) {
    if (s.tipo === "M") {
      [x, y] = s.p;
      pontos.push([x, y]);
    } else if (s.tipo === "L") {
      for (let k = 1; k <= 8; k++) pontos.push([x + ((s.p[0] - x) * k) / 8, y + ((s.p[1] - y) * k) / 8]);
      [x, y] = s.p;
    } else {
      for (let k = 1; k <= 24; k++) {
        const t = k / 24;
        pontos.push([bezier(x, s.p[0], s.p[2], s.p[4], t), bezier(y, s.p[1], s.p[3], s.p[5], t)]);
      }
      [x, y] = [s.p[4], s.p[5]];
    }
  }
  if (pontos.length < 2) return pontos[0] ?? [0, 0];
  const acum = [0];
  for (let i = 1; i < pontos.length; i++) acum.push(acum[i - 1] + Math.hypot(pontos[i][0] - pontos[i - 1][0], pontos[i][1] - pontos[i - 1][1]));
  const alvo = Math.min(1, Math.max(0, f)) * acum[acum.length - 1];
  for (let i = 1; i < pontos.length; i++) {
    if (acum[i] >= alvo) {
      const q = (alvo - acum[i - 1]) / Math.max(1e-6, acum[i] - acum[i - 1]);
      return [pontos[i - 1][0] + (pontos[i][0] - pontos[i - 1][0]) * q, pontos[i - 1][1] + (pontos[i][1] - pontos[i - 1][1]) * q];
    }
  }
  return pontos[pontos.length - 1];
};

// leva um caminho da caixa do glifo para a tela: escala e desloca
export const transformar = (d: string, escala: number, dx: number, dy: number) =>
  lerCaminho(d)
    .map((s) => {
      const p = s.p.map((v, i) => (i % 2 === 0 ? v * escala + dx : v * escala + dy).toFixed(1));
      return `${s.tipo} ${p.join(" ")}`;
    })
    .join(" ");
