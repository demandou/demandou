import * as THREE from "three";
import { useEffect, useState } from "react";
import { useDelayRender } from "remotion";
import type { Objeto } from "../plano";
import { P, SERIF, SORA } from "../tema";

/* Texturas desenhadas em canvas (sem imagem externa, sem marca): rótulo do objeto, sachê de papel,
   face da moeda, açúcar em cubo, sombra de contato. Tudo a partir dos campos do plano. */
const cv = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
};
const textura = (c: HTMLCanvasElement, srgb = true, repetir = false) => {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repetir) t.wrapS = THREE.RepeatWrapping;
  return t;
};

/** cor mais escura/clara (hex) */
const tom = (hex: string, k: number) => {
  const c = new THREE.Color(hex);
  if (k < 0) c.lerp(new THREE.Color("#000000"), -k);
  else c.lerp(new THREE.Color("#ffffff"), k);
  return `#${c.getHexString()}`;
};

/** ícone em traço (cor do papel) centrado em (cx, cy), raio ~r */
const icone = (g: CanvasRenderingContext2D, tipo: Objeto["icone"], cx: number, cy: number, r: number, cor: string) => {
  if (!tipo || tipo === "nenhum") return;
  g.save();
  g.strokeStyle = cor;
  g.fillStyle = cor;
  g.lineCap = "round";
  g.lineJoin = "round";
  const lw = r * 0.087;
  g.lineWidth = lw;
  const circ = (rr: number, w = lw) => {
    g.lineWidth = w;
    g.beginPath();
    g.arc(cx, cy, rr, 0, Math.PI * 2);
    g.stroke();
  };
  if (tipo === "limao") {
    circ(r);
    circ(r * 0.79, r * 0.048);
    g.lineWidth = r * 0.048;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r * 0.13, cy + Math.sin(a) * r * 0.13);
      g.lineTo(cx + Math.cos(a) * r * 0.73, cy + Math.sin(a) * r * 0.73);
      g.stroke();
    }
  } else if (tipo === "folha") {
    g.beginPath();
    g.moveTo(cx - r * 0.75, cy + r * 0.75);
    g.quadraticCurveTo(cx - r * 0.85, cy - r * 0.85, cx + r * 0.8, cy - r * 0.8);
    g.quadraticCurveTo(cx + r * 0.85, cy + r * 0.85, cx - r * 0.75, cy + r * 0.75);
    g.stroke();
    g.lineWidth = r * 0.05;
    g.beginPath();
    g.moveTo(cx - r * 0.95, cy + r * 0.95);
    g.lineTo(cx + r * 0.5, cy - r * 0.5);
    g.stroke();
  } else if (tipo === "gota") {
    g.beginPath();
    g.moveTo(cx, cy - r);
    g.bezierCurveTo(cx + r * 0.2, cy - r * 0.55, cx + r * 0.75, cy - r * 0.05, cx + r * 0.75, cy + r * 0.32);
    g.arc(cx, cy + r * 0.32, r * 0.75, 0, Math.PI);
    g.bezierCurveTo(cx - r * 0.75, cy - r * 0.05, cx - r * 0.2, cy - r * 0.55, cx, cy - r);
    g.stroke();
  } else if (tipo === "chama") {
    g.beginPath();
    g.moveTo(cx, cy - r);
    g.bezierCurveTo(cx + r * 0.9, cy - r * 0.2, cx + r * 0.75, cy + r * 0.9, cx, cy + r * 0.95);
    g.bezierCurveTo(cx - r * 0.75, cy + r * 0.9, cx - r * 0.85, cy + r * 0.1, cx - r * 0.3, cy - r * 0.35);
    g.bezierCurveTo(cx - r * 0.25, cy + r * 0.05, cx - r * 0.05, cy + r * 0.1, cx, cy - r);
    g.stroke();
  } else if (tipo === "estrela") {
    g.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const rr = k % 2 ? r * 0.42 : r;
      g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    g.closePath();
    g.stroke();
  } else if (tipo === "cruz") {
    circ(r);
    g.lineWidth = r * 0.16;
    g.beginPath();
    g.moveTo(cx, cy - r * 0.5);
    g.lineTo(cx, cy + r * 0.5);
    g.moveTo(cx - r * 0.5, cy);
    g.lineTo(cx + r * 0.5, cy);
    g.stroke();
  } else if (tipo === "moeda") {
    circ(r);
    circ(r * 0.78, r * 0.04);
    g.font = `800 ${Math.round(r * 0.95)}px ${SORA}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("$", cx, cy + r * 0.04);
  }
  g.restore();
};

/** texto em maiúsculas espaçadas que cabe em `largura` */
const letreiro = (g: CanvasRenderingContext2D, texto: string, cx: number, cy: number, largura: number, px: number, cor: string, espaco = 0.19) => {
  let tam = px;
  const medir = (t: number) => {
    g.font = `700 ${t}px ${SORA}`;
    (g as unknown as { letterSpacing: string }).letterSpacing = `${Math.round(t * espaco)}px`;
    return g.measureText(texto).width;
  };
  while (tam > px * 0.45 && medir(tam) > largura) tam -= 2;
  medir(tam);
  g.fillStyle = cor;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(texto, cx + tam * espaco * 0.5, cy);
  (g as unknown as { letterSpacing: string }).letterSpacing = "0px";
};

/** rótulo cilíndrico (lata, garrafa, pote): cor do plano, bolhas tom sobre tom, faixa creme, ícone e nome */
const rotuloCilindro = (o: Objeto, alto: number, bordas: boolean) => {
  const W = 2048;
  const H = alto;
  const [c, g] = cv(W, H);
  const base = o.cor ?? "#24503C";
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "rgba(255,255,255,0.06)");
  gr.addColorStop(0.5, "rgba(0,0,0,0)");
  gr.addColorStop(1, "rgba(0,0,0,0.10)");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const bolha = tom(base, 0.62);
  for (let i = 0; i < 70; i++) {
    const x = rnd() * W;
    const y = H * 0.13 + rnd() * H * 0.42;
    const rr = 6 + rnd() * 26;
    g.beginPath();
    g.arc(x, y, rr, 0, Math.PI * 2);
    g.strokeStyle = bolha;
    g.globalAlpha = 0.16;
    g.lineWidth = 4;
    g.stroke();
    g.globalAlpha = 1;
  }
  g.fillStyle = P.papel;
  g.fillRect(0, H * 0.7, W, H * 0.11);
  g.fillStyle = base;
  g.fillRect(0, H * 0.7 + 18, W, 4);
  g.fillRect(0, H * 0.81 - 22, W, 4);
  if (bordas) {
    g.fillStyle = "#cfd3d1";
    g.fillRect(0, 0, W, 34);
    g.fillRect(0, H - 34, W, 34);
  }
  const nome = o.rotulo.toUpperCase();
  const marca = (cx: number) => {
    letreiro(g, nome, cx, H * 0.585, W * 0.42, Math.round(H * 0.07), P.papel);
    icone(g, o.icone ?? "nenhum", cx, H * 0.3, H * 0.114, P.papel);
  };
  marca(W * 0.5);
  marca(0);
  marca(W);
  return textura(c, true, true);
};

/** G = rugosidade, B = metalicidade: tinta + alumínio nu nas bordas */
const rmLata = () => {
  const W = 512;
  const H = 228;
  const [c, g] = cv(W, H);
  g.fillStyle = "rgb(0,92,70)";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "rgb(0,60,255)";
  g.fillRect(0, 0, W, 9);
  g.fillRect(0, H - 9, W, 9);
  return textura(c, false, true);
};

/** frente da caixa (pacote, maço, caixa de remédio) */
const frenteCaixa = (o: Objeto) => {
  const W = 1024;
  const H = 1366;
  const [c, g] = cv(W, H);
  const base = o.cor ?? "#24503C";
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, "rgba(255,255,255,0.08)");
  gr.addColorStop(1, "rgba(0,0,0,0.10)");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,0.18)";
  g.lineWidth = 6;
  g.strokeRect(40, 40, W - 80, H - 80);
  g.fillStyle = P.papel;
  g.fillRect(0, H * 0.62, W, H * 0.13);
  g.fillStyle = base;
  g.fillRect(0, H * 0.62 + 16, W, 4);
  g.fillRect(0, H * 0.75 - 20, W, 4);
  icone(g, o.icone ?? "nenhum", W / 2, H * 0.34, 150, P.papel);
  letreiro(g, o.rotulo.toUpperCase(), W / 2, H * 0.685, W * 0.8, 74, base);
  return textura(c);
};
const ladoCaixa = (o: Objeto) => {
  const [c, g] = cv(256, 512);
  g.fillStyle = tom(o.cor ?? "#24503C", -0.12);
  g.fillRect(0, 0, 256, 512);
  g.fillStyle = P.papel;
  g.fillRect(0, 512 * 0.62, 256, 512 * 0.13);
  return textura(c);
};

/** sachê: papel creme, faixa sálvia, até 3 linhas impressas, serrilhado nas pontas */
const sache = (et: { topo?: string; meio?: string; base?: string }) => {
  const W = 512;
  const H = 336;
  const [c, g] = cv(W, H);
  g.fillStyle = P.sache;
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#E8E1D2";
  for (let x = 0; x < W; x += 12) {
    g.fillRect(x, 0, 6, 26);
    g.fillRect(x + 6, H - 26, 6, 26);
  }
  g.fillStyle = P.fundo;
  g.fillRect(0, H * 0.3, W, H * 0.4);
  g.textAlign = "center";
  g.textBaseline = "middle";
  if (et.meio) {
    let px = 76;
    g.font = `700 ${px}px ${SORA}`;
    while (px > 34 && g.measureText(et.meio).width > W * 0.86) g.font = `700 ${(px -= 2)}px ${SORA}`;
    g.fillStyle = P.sache;
    g.fillText(et.meio, W / 2, H * 0.5 + 2);
  }
  if (et.base) {
    g.fillStyle = P.tinta;
    g.font = `700 46px ${SORA}`;
    g.fillText(et.base, W / 2, H * 0.84);
  }
  if (et.topo) {
    g.font = `italic 500 40px ${SERIF}`;
    g.fillStyle = P.fundo;
    g.fillText(et.topo, W / 2, H * 0.17);
  }
  return textura(c);
};

/** face da moeda: metal escovado com anel e o texto do meio */
const moeda = (meio?: string) => {
  const S = 512;
  const [c, g] = cv(S, S);
  const gr = g.createRadialGradient(S * 0.4, S * 0.35, 10, S / 2, S / 2, S * 0.55);
  gr.addColorStop(0, "#e9ece9");
  gr.addColorStop(1, "#b9bfbb");
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  g.strokeStyle = "rgba(60,70,64,0.45)";
  g.lineWidth = 10;
  g.beginPath();
  g.arc(S / 2, S / 2, S * 0.42, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 4;
  g.beginPath();
  g.arc(S / 2, S / 2, S * 0.36, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "rgba(48,58,52,0.75)";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const t = meio ?? "$";
  let px = t.length <= 2 ? 190 : 120;
  g.font = `800 ${px}px ${SORA}`;
  while (px > 40 && g.measureText(t).width > S * 0.6) g.font = `800 ${(px -= 4)}px ${SORA}`;
  g.fillText(t, S / 2, S / 2 + 6);
  return textura(c);
};

/** açúcar em cubo: branco com grão */
const cubo = () => {
  const S = 256;
  const [c, g] = cv(S, S);
  g.fillStyle = "#fbfaf6";
  g.fillRect(0, 0, S, S);
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 2600; i++) {
    const v = 200 + Math.floor(rnd() * 55);
    g.fillStyle = `rgba(${v},${v - 4},${v - 12},${0.35 + rnd() * 0.4})`;
    g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2.4, 1 + rnd() * 2.4);
  }
  return textura(c);
};

const sombra = () => {
  const [c, g] = cv(256, 256);
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(0,0,0,0.85)");
  gr.addColorStop(0.35, "rgba(0,0,0,0.45)");
  gr.addColorStop(0.7, "rgba(0,0,0,0.12)");
  gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
};

export type Texturas = {
  rotulo: THREE.Texture | null;
  rm: THREE.Texture;
  frente: THREE.Texture | null;
  lado: THREE.Texture | null;
  sache: THREE.Texture;
  moeda: THREE.Texture;
  cubo: THREE.Texture;
  sombra: THREE.Texture;
};

const CACHE = new Map<string, Texturas>();
const PENDENTE = new Map<string, Promise<Texturas>>();
const chave = (o: Objeto | undefined, et: { topo?: string; meio?: string; base?: string }) => JSON.stringify([o?.forma, o?.rotulo, o?.cor, o?.icone, et]);

const construir = (o: Objeto | undefined, et: { topo?: string; meio?: string; base?: string }) => {
  const k = chave(o, et);
  let p = PENDENTE.get(k);
  if (!p) {
    p = Promise.all([document.fonts.load(`700 64px ${SORA}`), document.fonts.load(`800 64px ${SORA}`), document.fonts.load(`italic 500 40px ${SERIF}`)])
      .catch(() => null)
      .then(() => {
        const alto = o?.forma === "garrafa" ? 700 : o?.forma === "pote" ? 760 : 912;
        const t: Texturas = {
          rotulo: o && o.forma !== "caixa" ? rotuloCilindro(o, alto, o.forma === "lata") : null,
          rm: rmLata(),
          frente: o?.forma === "caixa" ? frenteCaixa(o) : null,
          lado: o?.forma === "caixa" ? ladoCaixa(o) : null,
          sache: sache(et),
          moeda: moeda(et.meio),
          cubo: cubo(),
          sombra: sombra(),
        };
        CACHE.set(k, t);
        return t;
      });
    PENDENTE.set(k, p);
  }
  return p;
};

/** espera as fontes e desenha as texturas uma vez por aba */
export const useTexturas = (o: Objeto | undefined, et: { topo?: string; meio?: string; base?: string } = {}): Texturas | null => {
  const { delayRender, continueRender } = useDelayRender();
  const k = chave(o, et);
  const [tex, setTex] = useState<Texturas | null>(CACHE.get(k) ?? null);
  useEffect(() => {
    if (tex) return;
    const h = delayRender("texturas do palco");
    let feito = false;
    const fim = () => {
      if (!feito) {
        feito = true;
        continueRender(h);
      }
    };
    construir(o, et).then((t) => {
      setTex(t);
      fim();
    });
    return fim;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex, k, delayRender, continueRender]);
  return tex;
};
