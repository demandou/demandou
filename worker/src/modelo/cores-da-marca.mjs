/**
 * AS CORES DA MARCA NO MODELO DO CURSO (10/10/2026). Regra do Bruno, depois do
 * primeiro corte em produção: "as cores do estilo não estão herdando as cores
 * da marca, e precisa herdar". O estilo é do modelo (a letra, o layout, como
 * as imagens entram, o movimento); a cor é da marca.
 *
 * O que muda, na cópia do template de cada trabalho (src/tema.ts): a cor de
 * ASSINATURA do modelo (a primeira cor viva depois do fundo, a mesma conta do
 * importar.mjs: o cobalto do Manifesto, a tarja do Viral, o giz amarelo da
 * Lousa) e as variações dela (a borda mais escura, o fundo mais claro, o rgba
 * com transparência) viram o destaque da marca, na mesma luminosidade. As
 * cores de função (o amarelo do alerta, o verde do "certo", o vermelho do
 * erro) e os neutros ficam: são linguagem do modelo, não da marca.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const paraRgb = (hex) => {
  const x = hex.replace("#", "");
  const f = x.length === 3 ? x.split("").map((c) => c + c).join("") : x.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
};
const paraHex = (rgb) => `#${rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
const croma = (rgb) => (Math.max(...rgb) - Math.min(...rgb)) / 255;
const luz = (rgb) => {
  const l = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * l(rgb[0]) + 0.7152 * l(rgb[1]) + 0.0722 * l(rgb[2]);
};
function matiz([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
const distanciaDeMatiz = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
const misturar = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/** A cor da marca na luminosidade da cor original (a borda escura fica escura, o fundo claro fica claro). */
function naMesmaLuz(marca, original, assinatura) {
  const lo = luz(original);
  const la = luz(assinatura);
  if (Math.abs(lo - la) < 0.02) return marca;
  if (lo > la) return misturar(marca, [255, 255, 255], Math.min(0.9, (lo - la) / Math.max(0.05, 1 - la)));
  return misturar(marca, [0, 0, 0], Math.min(0.9, (la - lo) / Math.max(0.05, la)));
}

/** A assinatura do tema: a primeira cor viva depois da primeira (o fundo). Null sem cor viva. */
export function assinaturaDoTema(texto) {
  const hex = [...texto.matchAll(/["'](#[0-9A-Fa-f]{6})["']/g)].map((m) => m[1]);
  return hex.slice(1).find((h) => croma(paraRgb(h)) >= 0.35) ?? null;
}

/** O tema.ts com a assinatura (e a família dela) na cor da marca. Puro. */
export function temaComACorDaMarca(texto, destaqueDaMarca) {
  const assinatura = assinaturaDoTema(texto);
  if (!assinatura || !/^#[0-9A-Fa-f]{6}$/.test(destaqueDaMarca ?? "")) return { texto, trocadas: 0 };
  const a = paraRgb(assinatura);
  const m = paraRgb(destaqueDaMarca);
  const familia = (rgb) => croma(rgb) >= 0.18 && distanciaDeMatiz(matiz(rgb), matiz(a)) <= 25;
  let trocadas = 0;
  let saida = texto.replace(/(["'])(#[0-9A-Fa-f]{6})\1/g, (todo, aspas, hex) => {
    const rgb = paraRgb(hex);
    if (!familia(rgb)) return todo;
    trocadas++;
    return `${aspas}${paraHex(naMesmaLuz(m, rgb, a))}${aspas}`;
  });
  saida = saida.replace(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(\s*,\s*[\d.]+)?\s*\)/g, (todo, r, g, b, alfa) => {
    const rgb = [Number(r), Number(g), Number(b)];
    if (!familia(rgb)) return todo;
    trocadas++;
    const [nr, ng, nb] = naMesmaLuz(m, rgb, a).map((v) => Math.round(v));
    return alfa ? `rgba(${nr}, ${ng}, ${nb}${alfa})` : `rgb(${nr}, ${ng}, ${nb})`;
  });
  return { texto: saida, trocadas };
}

/** Aplica na cópia do template do trabalho. Nunca lança: sem tema, o modelo segue nas cores dele. */
export function aplicarCoresDaMarca(projeto, cores) {
  try {
    const arquivo = join(projeto, "src", "tema.ts");
    if (!cores?.destaque || !existsSync(arquivo)) return { trocadas: 0 };
    const r = temaComACorDaMarca(readFileSync(arquivo, "utf8"), cores.destaque);
    if (r.trocadas) writeFileSync(arquivo, r.texto);
    return { trocadas: r.trocadas };
  } catch (e) {
    return { trocadas: 0, erro: e instanceof Error ? e.message : String(e) };
  }
}
