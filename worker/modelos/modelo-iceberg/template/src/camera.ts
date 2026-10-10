// A gramática do Iceberg: o vídeo inteiro é um mergulho num mundo só.
// O mundo é uma coluna alta (céu, linha d'água, N níveis de gelo). A câmera desce de nível em nível
// (e se afasta para mostrar o iceberg inteiro); a pessoa fica numa janela larga embaixo, que desce junto.
import { Easing, interpolate } from "remotion";
import type { Iceberg, Momento, Plano } from "./plano";

// medidas do mundo (px de mundo). Yw = linha d'água; L = altura de cada nível; FY = altura da tela onde a câmera mira.
export const G = { Yw: 560, L: 560, FY: 560, W: 1080 };
// área de conteúdo acima da janela da pessoa (a interface do Reels ocupa ~120 px no topo)
export const ZONA = { x: 60, y: 150, w: 960, h: 830 };
export const JANELA = { x: 70, y: 1000, w: 940, h: 560 };

export const ordenar = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

// Um momento nunca invade o seguinte.
export const semSobreposicao = (plano: Plano): Plano => {
  const ordem = ordenar(plano);
  return {
    ...plano,
    momentos: ordem.map((m, i) => {
      const proximo = ordem[i + 1];
      return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
    }),
  };
};

// o Iceberg mostra a legenda por padrão (a foto e o nome apoiam a fala, não a substituem)
export const comLegendaPadrao = (plano: Plano): Plano => ({
  ...plano,
  momentos: plano.momentos.map((m) => (m.tipo === "iceberg" && m.legenda === undefined ? { ...m, legenda: true } : m)),
});

export const icebergs = (plano: Plano): Iceberg[] => ordenar(plano).filter((m): m is Iceberg => m.tipo === "iceberg");
export const numNiveis = (plano: Plano) => Math.max(3, ...icebergs(plano).map((m) => m.niveis.length));
export const centro = (k: number) => G.Yw + k * G.L + G.L / 2;
export const fundo = (plano: Plano) => G.Yw + numNiveis(plano) * G.L;

const PROFUNDIDADES = [0, 100, 300, 1000, 3000, 8000];
export const profundidades = (plano: Plano): number[] => {
  const n = numNiveis(plano);
  return Array.from({ length: n }, (_, k) => {
    for (const m of icebergs(plano)) if (m.niveis[k]?.profundidade !== undefined) return m.niveis[k].profundidade as number;
    return PROFUNDIDADES[k] ?? PROFUNDIDADES[PROFUNDIDADES.length - 1] * (k - 4);
  });
};

export type Cam = { z: number; s: number };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const escalaGeral = (plano: Plano) => clamp(460 / (numNiveis(plano) * G.L), 0.15, 0.4);
export const camGeral = (plano: Plano): Cam => {
  const s = escalaGeral(plano);
  // a linha d'água fica na altura 540 da tela (o título da abertura cabe acima da ponta)
  return { z: G.Yw + (G.FY - 540) / s, s };
};

const suave = Easing.bezier(0.45, 0, 0.2, 1);

type Kf = { t: number; z: number; s: number };

// Quando a câmera sai de cada nível (começa a descer para o próximo): o cartão do nível encolhe nesse instante.
export const saidaDoNivel = (m: Iceberg, k: number): number => {
  const prox = m.niveis[k + 1];
  if (prox) return descida(m, k + 1);
  if (m.resumoEm !== undefined) return m.resumoEm - 1.0;
  return 1e9;
};
export const descida = (m: Iceberg, k: number): number => {
  const n = m.niveis[k];
  const anterior = k > 0 ? Math.max(m.niveis[k - 1].em, m.de) : m.de;
  return n.desceEm ?? Math.max(anterior + 0.3, n.em - 1.1);
};

const cache = new WeakMap<Plano, Kf[] | null>();
const quadros = (plano: Plano): Kf[] | null => {
  if (cache.has(plano)) return cache.get(plano) as Kf[] | null;
  const lista = icebergs(plano);
  let kfs: Kf[] | null = null;
  if (lista.length) {
    const geral = camGeral(plano);
    kfs = [{ t: 0, ...geral }];
    const push = (t: number, c: Cam) => {
      const ultimo = kfs![kfs!.length - 1];
      kfs!.push({ t: Math.max(t, ultimo.t + 0.02), ...c });
    };
    for (const m of lista) {
      m.niveis.forEach((n, k) => {
        const cur = kfs![kfs!.length - 1];
        const d = descida(m, k);
        push(d, { z: cur.z, s: cur.s });
        push(Math.max(n.em, d + 0.7), { z: centro(k), s: 1 });
      });
      if (m.resumoEm !== undefined) {
        const cur = kfs[kfs.length - 1];
        push(m.resumoEm - 1.0, { z: cur.z, s: cur.s });
        push(m.resumoEm, geral);
      }
    }
  }
  cache.set(plano, kfs);
  return kfs;
};

// Onde a câmera está no instante t: `z` = ponto do mundo no centro da área de conteúdo, `s` = escala.
export const camera = (plano: Plano, t: number): Cam => {
  const kfs = quadros(plano);
  if (!kfs) {
    // sem iceberg no plano: o vídeo é um mergulho lento (a água escurece enquanto a pessoa fala)
    const p = clamp(t / Math.max(1, plano.duracao), 0, 1);
    return { z: interpolate(p, [0, 1], [G.Yw + 120, centro(2)]), s: 1 };
  }
  if (t <= kfs[0].t) return { z: kfs[0].z, s: kfs[0].s };
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i];
    const b = kfs[i + 1];
    if (t < b.t) {
      const p = suave(clamp((t - a.t) / (b.t - a.t), 0, 1));
      return { z: a.z + (b.z - a.z) * p, s: Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * p) };
    }
  }
  const u = kfs[kfs.length - 1];
  return { z: u.z, s: u.s };
};

// Velocidade vertical da câmera (0 = parada, 1 = descendo rápido): a janela da pessoa afunda um pouco junto.
export const atividade = (plano: Plano, t: number) => {
  const a = camera(plano, t - 0.04);
  const b = camera(plano, t + 0.04);
  const v = (Math.abs(b.z - a.z) * Math.max(a.s, b.s) + Math.abs(Math.log(b.s / a.s)) * 400) / 0.08;
  return clamp(v / 700, 0, 1);
};

// Número do medidor: segue a câmera; na visão geral marca zero.
export const profundidade = (plano: Plano, c: Cam): number => {
  const so = escalaGeral(plano);
  const mistura = clamp((c.s - so) / (1 - so), 0, 1);
  const z = G.Yw + (c.z - G.Yw) * mistura;
  const d = profundidades(plano);
  if (z <= centro(0)) return d[0] * clamp((z - G.Yw) / (G.L / 2), 0, 1);
  for (let k = 0; k < d.length - 1; k++) {
    if (z <= centro(k + 1)) return d[k] + (d[k + 1] - d[k]) * clamp((z - centro(k)) / G.L, 0, 1);
  }
  return d[d.length - 1];
};

// 0 (superfície) a 1 (fundo): o quanto a água escureceu onde a câmera está
export const escuridao = (plano: Plano, c: Cam) => {
  const so = escalaGeral(plano);
  const mistura = clamp((c.s - so) / (1 - so), 0, 1);
  const z = G.Yw + (c.z - G.Yw) * mistura;
  return clamp((z - G.Yw) / (numNiveis(plano) * G.L), 0, 1);
};

export type { Momento };
