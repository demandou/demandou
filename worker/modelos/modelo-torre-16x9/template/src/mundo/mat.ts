import * as THREE from "three";
import { random } from "remotion";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// Texturas procedurais (canvas, determinísticas) e geometrias compartilhadas do mundo 3D da Torre.

export const col = (h: string) => new THREE.Color(h);
const cache: Record<string, THREE.Texture> = {};
const canvas = (w: number, h: number) => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  return { cv, g: cv.getContext("2d")! };
};
const finish = (key: string, cv: HTMLCanvasElement, srgb = true, wrap = true) => {
  const tx = new THREE.CanvasTexture(cv);
  if (srgb) tx.colorSpace = THREE.SRGBColorSpace;
  if (wrap) tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.anisotropy = 8;
  cache[key] = tx;
  return tx;
};
const R = (s: string) => random(s);
/** PRNG rápido para ruído por pixel */
const prng = (seed: string) => {
  let a = Math.floor(random(seed) * 4294967296) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** piso de madeira (tábuas corridas). 1 repetição = 2,4 m. hue/light para carvalho, cumaru etc. */
export const woodTex = (seed: string, base: [number, number, number], plankPx = 52) => {
  const key = `wood-${seed}`;
  if (cache[key]) return cache[key];
  const S = 1024;
  const { cv, g } = canvas(S, S);
  const [hh, ss, ll] = base;
  for (let x = 0, row = 0; x < S; x += plankPx, row++) {
    let y = -R(`${seed}o${row}`) * 400;
    let k = 0;
    while (y < S) {
      const len = 260 + R(`${seed}l${row}_${k}`) * 380;
      const dl = (R(`${seed}c${row}_${k}`) - 0.5) * 9;
      const dh = (R(`${seed}h${row}_${k}`) - 0.5) * 5;
      g.fillStyle = `hsl(${hh + dh}, ${ss}%, ${ll + dl}%)`;
      g.fillRect(x, y, plankPx, len);
      // veios
      for (let v = 0; v < 7; v++) {
        const vx = x + 4 + R(`${seed}v${row}_${k}_${v}`) * (plankPx - 8);
        g.strokeStyle = `hsla(${hh - 4}, ${ss + 6}%, ${ll + dl - 14}%, ${0.07 + R(`${seed}va${row}_${k}_${v}`) * 0.1})`;
        g.lineWidth = 1 + R(`${seed}vw${row}_${k}_${v}`) * 1.5;
        g.beginPath();
        g.moveTo(vx, y);
        const amp = 1.5 + R(`${seed}vv${row}_${k}_${v}`) * 3;
        for (let yy = y; yy < y + len; yy += 24) g.lineTo(vx + Math.sin(yy * 0.02 + v) * amp, yy);
        g.stroke();
      }
      g.fillStyle = "rgba(30,18,10,0.55)";
      g.fillRect(x, y, plankPx, 2);
      y += len;
      k++;
    }
    g.fillStyle = "rgba(30,18,10,0.5)";
    g.fillRect(x, 0, 1.5, S);
  }
  return finish(key, cv);
};

/** porcelanato (placas grandes, rejunte fino, manchas suaves). 1 repetição = 4 placas */
export const tileTex = (seed: string, base: string, grout: string, n = 4, veins = false) => {
  const key = `tile-${seed}`;
  if (cache[key]) return cache[key];
  const S = 1024;
  const { cv, g } = canvas(S, S);
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) {
    const x = R(`${seed}x${i}`) * S;
    const y = R(`${seed}y${i}`) * S;
    const r = 20 + R(`${seed}r${i}`) * 90;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const d = R(`${seed}d${i}`) < 0.5;
    gr.addColorStop(0, d ? "rgba(0,0,0,0.035)" : "rgba(255,255,255,0.05)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  if (veins)
    for (let v = 0; v < 9; v++) {
      g.strokeStyle = `rgba(120,115,110,${0.08 + R(`${seed}vo${v}`) * 0.1})`;
      g.lineWidth = 1 + R(`${seed}vw${v}`) * 2;
      g.beginPath();
      let x = R(`${seed}vx${v}`) * S;
      let y = 0;
      g.moveTo(x, y);
      while (y < S) {
        x += (R(`${seed}vs${v}_${y}`) - 0.5) * 60;
        y += 40;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  const step = S / n;
  g.fillStyle = grout;
  for (let i = 0; i <= n; i++) {
    g.fillRect(i * step - 1.5, 0, 3, S);
    g.fillRect(0, i * step - 1.5, S, 3);
  }
  return finish(key, cv);
};

/** trama de tecido sutil (sofá, cama, tapete) */
export const fabricTex = (seed: string, base: string, strength = 0.06) => {
  const key = `fab-${seed}`;
  if (cache[key]) return cache[key];
  const S = 256;
  const { cv, g } = canvas(S, S);
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  const img = g.getImageData(0, 0, S, S);
  const rnd = prng(seed);
  for (let i = 0; i < S * S; i++) {
    const x = i % S;
    const y = Math.floor(i / S);
    const n = (rnd() - 0.5) * 2 * strength + (x % 4 < 2 ? 0.015 : -0.015) + (y % 4 < 2 ? 0.015 : -0.015);
    for (let c = 0; c < 3; c++) img.data[i * 4 + c] = Math.max(0, Math.min(255, img.data[i * 4 + c] * (1 + n)));
  }
  g.putImageData(img, 0, 0);
  return finish(key, cv);
};

/** tapete: miolo com trama + barra mais escura */
export const rugTex = (seed: string, base: string, border: string) => {
  const key = `rug-${seed}`;
  if (cache[key]) return cache[key];
  const S = 512;
  const { cv, g } = canvas(S, S);
  g.fillStyle = border;
  g.fillRect(0, 0, S, S);
  g.fillStyle = base;
  g.fillRect(26, 26, S - 52, S - 52);
  const img = g.getImageData(0, 0, S, S);
  const rnd = prng(seed);
  for (let i = 0; i < S * S; i += 1) {
    const n = (rnd() - 0.5) * 0.12;
    for (let c = 0; c < 3; c++) img.data[i * 4 + c] = Math.max(0, Math.min(255, img.data[i * 4 + c] * (1 + n)));
  }
  g.putImageData(img, 0, 0);
  return finish(key, cv, true, false);
};

/** sombra de contato (AO falso): retângulo preto com borda bem desfocada; usar como alphaMap */
export const softRect = () => {
  const key = "soft-rect";
  if (cache[key]) return cache[key];
  const S = 256;
  const { cv, g } = canvas(S, S);
  g.fillStyle = "#000";
  g.fillRect(0, 0, S, S);
  g.filter = "blur(18px)";
  g.fillStyle = "#fff";
  g.fillRect(44, 44, S - 88, S - 88);
  return finish(key, cv, false, false);
};
/** sombra radial (vasos, banquetas, mesa redonda) */
export const softDisc = () => {
  const key = "soft-disc";
  if (cache[key]) return cache[key];
  const S = 256;
  const { cv, g } = canvas(S, S);
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, "#fff");
  gr.addColorStop(0.45, "#bbb");
  gr.addColorStop(1, "#000");
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  return finish(key, cv, false, false);
};
/** faixa de AO junto à parede (gradiente: escuro na parede → transparente) */
export const wallAO = () => {
  const key = "wall-ao";
  if (cache[key]) return cache[key];
  const { cv, g } = canvas(4, 128);
  const gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, "#fff");
  gr.addColorStop(0.35, "#777");
  gr.addColorStop(1, "#000");
  g.fillStyle = gr;
  g.fillRect(0, 0, 4, 128);
  return finish(key, cv, false, false);
};

/** janelas emissivas em grade (fachadas): cols × rows por repetição */
export const windowsTex = (seed: string, lit: number, cols: number, rows: number, warm = 0.82) => {
  const key = `win-${seed}-${lit}-${cols}-${rows}`;
  if (cache[key]) return cache[key];
  const S = 512;
  const { cv, g } = canvas(S, S);
  g.fillStyle = "#000";
  g.fillRect(0, 0, S, S);
  const pw = S / cols;
  const ph = S / rows;
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const id = `${key}-${i}-${j}`;
      if (R(id) >= lit) continue;
      const b = 0.4 + 0.6 * R(`${id}b`);
      g.fillStyle = R(`${id}w`) < warm ? `rgba(255,${Math.round(190 + 36 * b)},${Math.round(120 + 50 * b)},${b})` : `rgba(205,222,255,${b * 0.75})`;
      g.fillRect(i * pw + pw * 0.16, j * ph + ph * 0.2, pw * 0.68, ph * 0.62);
      if (R(`${id}c`) < 0.3) {
        g.fillStyle = "rgba(0,0,0,0.6)";
        g.fillRect(i * pw + pw * 0.16, j * ph + ph * 0.2, pw * 0.68, ph * 0.3);
      }
    }
  return finish(key, cv);
};

/** interior de um andar da torre (faixa horizontal): salas iluminadas atrás do vidro */
export const floorInteriorTex = (seed: string, lit: number) => {
  const key = `fi-${seed}-${lit}`;
  if (cache[key]) return cache[key];
  const W0 = 1024;
  const H0 = 96;
  const { cv, g } = canvas(W0, H0);
  g.fillStyle = "#000";
  g.fillRect(0, 0, W0, H0);
  let x = 0;
  let k = 0;
  while (x < W0) {
    const w0 = 90 + R(`${seed}w${k}`) * 160;
    if (R(`${seed}l${k}`) < lit) {
      const b = 0.55 + 0.45 * R(`${seed}b${k}`);
      const gr = g.createLinearGradient(0, 0, 0, H0);
      gr.addColorStop(0, `rgba(255,${Math.round(205 + 25 * b)},${Math.round(150 + 40 * b)},${b})`);
      gr.addColorStop(1, `rgba(255,${Math.round(170 + 30 * b)},${Math.round(110 + 30 * b)},${b * 0.7})`);
      g.fillStyle = gr;
      g.fillRect(x + 2, 6, w0 - 4, H0 - 10);
      // cortina / móveis em silhueta
      g.fillStyle = "rgba(0,0,0,0.5)";
      if (R(`${seed}s${k}`) < 0.5) g.fillRect(x + 2, 6, w0 * 0.28, H0 - 10);
      g.fillRect(x + w0 * (0.4 + 0.3 * R(`${seed}f${k}`)), H0 * 0.62, w0 * 0.22, H0 * 0.3);
    } else {
      g.fillStyle = `rgba(40,60,90,${0.25 + 0.2 * R(`${seed}d${k}`)})`;
      g.fillRect(x + 2, 6, w0 - 4, H0 - 10);
    }
    x += w0;
    k++;
  }
  // caixilhos verticais
  g.fillStyle = "rgba(0,0,0,0.85)";
  for (let m = 0; m < W0; m += 64) g.fillRect(m, 0, 3, H0);
  return finish(key, cv);
};

/* ---------- geometria arredondada (cache por medidas) ---------- */
const rbCache: Record<string, THREE.BufferGeometry> = {};
export const rbox = (w: number, h: number, d: number, r = 0.03, seg = 3) => {
  const key = `${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}_${r}_${seg}`;
  if (!rbCache[key]) rbCache[key] = new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
  return rbCache[key];
};
