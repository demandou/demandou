// A mesa de corte do Multicâmera: duas câmeras virtuais na pessoa, plano aberto (1,0) e fechado
// (1,3), sempre seguindo o rosto (a VideoNaCaixa faz isso). Cada trecho entre cortes fica numa
// câmera só, e a câmera troca:
// - em cada corte do motor (nunca a mesma câmera duas vezes seguidas: é isso que esconde o pulo);
// - em cada mudança de assunto (`capitulo`): o capítulo abre no plano aberto;
// - na volta de uma `cena` (a câmera C), para uma câmera diferente da de antes da cena;
// - nos itens de `plano.camera`.
// O gancho começa no fechado. Quando a alternância cairia na mesma câmera de um capítulo logo
// adiante, o trecho do meio vai para um plano médio (1,15). Nas ênfases (`destaque`, `frase` e
// `camera.aproximar`) a câmera aproxima devagar até o próximo corte (no máximo ~6% em 2 s).
import { ABERTO, FECHADO, MEDIO } from "./tema";
import type { Plano } from "./plano";

export type Trecho = { de: number; ate: number; zoom: number; oculto: boolean };
type Ponto = { t: number; forca?: number };

const ZOOM_DO_PLANO = { aberto: ABERTO, fechado: FECHADO, medio: MEDIO } as const;
const igual = (a?: number, b?: number) => a !== undefined && b !== undefined && Math.abs(a - b) < 0.01;

const guardados = new WeakMap<object, Trecho[]>();

export const trechosDaCamera = (plano: Plano): Trecho[] => {
  const salvo = guardados.get(plano);
  if (salvo) return salvo;
  const dur = plano.duracao;
  const extras = plano.camera ?? [];
  const cenas = plano.momentos.filter((m) => m.tipo === "cena");
  const capitulos = plano.momentos.filter((m) => m.tipo === "capitulo");
  const brutos: Ponto[] = [
    { t: 0 },
    ...(plano.cortesEm ?? []).map((t) => ({ t })),
    ...cenas.map((m) => ({ t: m.ate })),
    ...capitulos.map((m) => ({ t: m.de, forca: ABERTO })),
    ...extras.map((c) => ({ t: c.em, forca: c.zoom ?? (c.plano ? ZOOM_DO_PLANO[c.plano] : undefined) })),
  ].filter((p) => p.t >= 0 && p.t < dur - 0.2);
  brutos.sort((a, b) => a.t - b.t);
  // pontos a menos de 0,25 s viram um só (vale o primeiro tempo; o pedido de câmera mais específico)
  const pontos: Ponto[] = [];
  for (const p of brutos) {
    const u = pontos[pontos.length - 1];
    if (u && p.t - u.t <= 0.25) {
      if (p.forca !== undefined) u.forca = p.forca;
    } else pontos.push({ ...p });
  }
  const dentroDeCena = (t: number) => cenas.some((c) => t >= c.de - 0.05 && t < c.ate - 0.05);
  const trechos: Trecho[] = [];
  let ultimo: number | undefined;
  let ultimoAB: number | undefined;
  pontos.forEach((p, i) => {
    const de = i === 0 ? 0 : p.t;
    const ate = pontos[i + 1]?.t ?? dur;
    if (dentroDeCena(p.t)) {
      // a câmera C está no ar: este trecho não aparece e não conta na alternância
      trechos.push({ de, ate, zoom: ultimo ?? FECHADO, oculto: true });
      return;
    }
    let zoom: number;
    if (p.forca !== undefined) zoom = p.forca;
    else if (ultimo === undefined) zoom = FECHADO;
    else {
      zoom = igual(ultimoAB, FECHADO) ? ABERTO : FECHADO;
      // o próximo trecho visível pede a mesma câmera (capítulo): este vai para o médio
      // (só quando a troca aparece: se uma cena cobre o fim deste trecho, o corte fica escondido)
      const prox = pontos.slice(i + 1).find((q) => !dentroDeCena(q.t));
      const trocaVisivel = prox && !dentroDeCena(prox.t - 0.06);
      if (trocaVisivel && prox.forca !== undefined && igual(prox.forca, zoom) && !igual(ultimo, MEDIO)) zoom = MEDIO;
    }
    trechos.push({ de, ate, zoom, oculto: false });
    ultimo = zoom;
    if (!igual(zoom, MEDIO)) ultimoAB = zoom;
  });
  guardados.set(plano, trechos);
  return trechos;
};

// Ênfases: a câmera aproxima devagar de `de` até o fim do trecho em que a ênfase começa.
type Empurrao = { de: number; ate: number; quanto: number };
const empurroesGuardados = new WeakMap<object, Empurrao[]>();
const empurroes = (plano: Plano): Empurrao[] => {
  const salvo = empurroesGuardados.get(plano);
  if (salvo) return salvo;
  const trechos = trechosDaCamera(plano);
  const inicios = [
    ...plano.momentos.filter((m) => m.tipo === "destaque" || m.tipo === "frase").map((m) => m.de),
    ...(plano.camera ?? []).filter((c) => c.aproximar).map((c) => c.em),
  ];
  const lista = inicios.flatMap((de) => {
    const tr = trechos.find((x) => de >= x.de - 0.01 && de < x.ate);
    if (!tr || tr.oculto) return [];
    const dur = tr.ate - de;
    if (dur < 0.6) return [];
    // no máximo ~6% em 2 s e 5% no total
    return [{ de, ate: tr.ate, quanto: Math.min(0.05, 0.03 * dur) }];
  });
  empurroesGuardados.set(plano, lista);
  return lista;
};

export const zoomNoTempo = (plano: Plano, t: number) => {
  const trechos = trechosDaCamera(plano);
  const tr = trechos.find((x) => t >= x.de && t < x.ate) ?? trechos[trechos.length - 1];
  if (!tr) return 1;
  let zoom = tr.zoom;
  for (const e of empurroes(plano)) {
    if (t < e.de || t >= e.ate) continue;
    const p = (t - e.de) / Math.max(0.01, e.ate - e.de);
    // seno: começa e termina macio
    zoom *= 1 + e.quanto * (0.5 - Math.cos(Math.PI * p) / 2);
  }
  return zoom;
};
