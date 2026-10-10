// A mesa de corte do Canal: a pessoa em quadro cheio, com câmeras virtuais que seguem o rosto (a
// VideoNaCaixa faz isso). Cada trecho entre cortes fica numa câmera só, e a câmera troca:
// - em cada corte do motor: aberto (1,0) ↔ fechado (1,3), nunca a mesma duas vezes seguidas (é o
//   que esconde o pulo do jump cut); quando cairia na mesma de um capítulo logo adiante, médio (1,15);
// - no capítulo: abre (aberto); no lembrete de inscrição: médio;
// - no REFRAME (a assinatura e os blocos de informação): a câmera aproxima e empurra a pessoa para o
//   lado oposto ao da informação. Num corte o reframe entra seco; no meio da frase, num movimento de
//   0,5 s. Cortes dentro de um reframe alternam o aperto (×1,06);
// - na volta de uma `cena` (B-roll), para uma câmera diferente da de antes;
// - nos itens de `plano.camera` (um item com `plano`/`zoom` é uma troca de câmera: seca, como um corte).
// Nas ênfases (abertura, destaque, frase, reframe e `camera.aproximar`) a câmera aproxima devagar
// até o próximo corte (no máximo ~4%). `aproximar: 0.06` é um punch-in de ênfase: 6% em até 0,8 s.
import { CHEIO_16x9, caixaNoTempo, type Caixa, type EstadoDaCaixa } from "./motor/caixa";
import { noReframe, type Plano } from "./plano";
import { ABERTO, FECHADO, MEDIO, ancoraDo, ladoLivre, reframe, type Lado } from "./tema";

export type Tomada = { de: number; ate: number; zoom: number; lado: Lado | null; oculto: boolean; seco: boolean };
type Ponto = { t: number; forca?: number; seco?: boolean };

const ZOOM_DO_PLANO = { aberto: ABERTO, fechado: FECHADO, medio: MEDIO } as const;
const igual = (a?: number, b?: number) => a !== undefined && b !== undefined && Math.abs(a - b) < 0.01;
const DUR_MOVIMENTO = 0.5;

// trechos de reframe: momentos de informação seguidos (menos de 0,6 s entre eles) viram um só
export const trechosDeReframe = (plano: Plano): { de: number; ate: number; lado: Lado }[] => {
  const lista = plano.momentos.filter(noReframe).sort((a, b) => a.de - b.de);
  const saida: { de: number; ate: number; lado: Lado }[] = [];
  for (const m of lista) {
    const lado = ladoLivre(plano, m.lado);
    const u = saida[saida.length - 1];
    if (u && m.de - u.ate < 0.6 && u.lado === lado) u.ate = Math.max(u.ate, m.ate);
    else saida.push({ de: m.de, ate: m.ate, lado });
  }
  return saida;
};

const guardadas = new WeakMap<object, Tomada[]>();

export const tomadas = (plano: Plano): Tomada[] => {
  const salvo = guardadas.get(plano);
  if (salvo) return salvo;
  const dur = plano.duracao;
  const cortes = plano.cortesEm ?? [];
  const cenas = plano.momentos.filter((m) => m.tipo === "cena");
  const reframes = trechosDeReframe(plano);
  const abre = plano.momentos.filter((m) => m.tipo === "capitulo");
  const medio = plano.momentos.filter((m) => m.tipo === "inscricao" || (m.tipo === "cta" && m.icone === "seguir"));
  const extras = plano.camera ?? [];
  const brutos: Ponto[] = [
    { t: 0 },
    ...cortes.map((t) => ({ t })),
    ...cenas.map((m) => ({ t: m.ate })),
    ...reframes.flatMap((r) => [{ t: r.de }, { t: r.ate }]),
    ...abre.map((m) => ({ t: m.de, forca: ABERTO })),
    ...medio.map((m) => ({ t: m.de, forca: MEDIO })),
    ...extras.map((c) => {
      const forca = c.zoom ?? (c.plano ? ZOOM_DO_PLANO[c.plano] : undefined);
      return { t: c.em, forca, seco: forca !== undefined };
    }),
  ].filter((p) => p.t >= 0 && p.t < dur - 0.2);
  brutos.sort((a, b) => a.t - b.t);
  // pontos a menos de 0,25 s viram um só (vale o primeiro tempo; o pedido de câmera mais específico)
  const pontos: Ponto[] = [];
  for (const p of brutos) {
    const u = pontos[pontos.length - 1];
    if (u && p.t - u.t <= 0.25) {
      if (p.forca !== undefined) u.forca = p.forca;
      if (p.seco) u.seco = true;
    } else pontos.push({ ...p });
  }
  const dentroDeCena = (t: number) => cenas.some((c) => t >= c.de - 0.05 && t < c.ate - 0.05);
  const reframeEm = (t: number) => reframes.find((r) => t >= r.de - 0.26 && t < r.ate - 0.05) ?? null;
  const ehCorte = (t: number) => cortes.some((c) => Math.abs(c - t) < 0.12);

  const lista: Tomada[] = [];
  let ultimo: number | undefined;
  let ultimoAB: number | undefined;
  let ultimoOculto = false;
  pontos.forEach((p, i) => {
    const de = i === 0 ? 0 : p.t;
    const ate = pontos[i + 1]?.t ?? dur;
    const seco = i === 0 || ehCorte(p.t) || ultimoOculto || !!p.seco;
    if (dentroDeCena(p.t)) {
      lista.push({ de, ate, zoom: ultimo ?? ABERTO, lado: null, oculto: true, seco: true });
      ultimoOculto = true;
      return;
    }
    ultimoOculto = false;
    const r = reframeEm(p.t + 0.01);
    if (r) {
      const base = reframe(plano, r.lado).zoom;
      const anterior = lista[lista.length - 1];
      // corte dentro do mesmo reframe: alterna o aperto
      const zoom = anterior && anterior.lado === r.lado && !anterior.oculto && igual(anterior.zoom, base) && seco ? base * 1.06 : base;
      lista.push({ de, ate, zoom, lado: r.lado, oculto: false, seco });
      return;
    }
    let zoom: number;
    const saiDoReframe = !!lista[lista.length - 1]?.lado;
    if (p.forca !== undefined) zoom = p.forca;
    // a volta do reframe abre (a câmera recua para o plano aberto); o próximo corte fecha
    else if (ultimo === undefined || saiDoReframe) zoom = ABERTO;
    else {
      zoom = igual(ultimoAB, FECHADO) ? ABERTO : FECHADO;
      const prox = pontos.slice(i + 1).find((q) => !dentroDeCena(q.t) && !reframeEm(q.t + 0.01));
      if (prox && prox.forca !== undefined && igual(prox.forca, zoom) && !igual(ultimo, MEDIO)) zoom = MEDIO;
    }
    lista.push({ de, ate, zoom, lado: null, oculto: false, seco });
    ultimo = zoom;
    if (!igual(zoom, MEDIO)) ultimoAB = zoom;
  });
  guardadas.set(plano, lista);
  return lista;
};

// Ênfases: a câmera aproxima devagar de `de` até o fim da tomada em que a ênfase começa.
type Empurrao = { de: number; ate: number; quanto: number; rampa: number };
const empurroesGuardados = new WeakMap<object, Empurrao[]>();
const empurroes = (plano: Plano): Empurrao[] => {
  const salvo = empurroesGuardados.get(plano);
  if (salvo) return salvo;
  const ts = tomadas(plano);
  const pedidos = new Map<number, number | undefined>();
  for (const m of plano.momentos) if (m.tipo === "abertura" || m.tipo === "destaque" || m.tipo === "frase") pedidos.set(m.de, undefined);
  for (const x of ts) if (x.lado && !x.oculto) pedidos.set(x.de, undefined);
  // `aproximar: 0.06` (número) vale por cima: é o punch-in pedido
  for (const c of plano.camera ?? []) if (c.aproximar) pedidos.set(c.em, typeof c.aproximar === "number" ? Math.min(0.1, Math.max(0.01, c.aproximar)) : pedidos.get(c.em));
  const lista = [...pedidos.entries()].flatMap(([de, pedido]) => {
    const tr = ts.find((x) => de >= x.de - 0.01 && de < x.ate);
    if (!tr || tr.oculto) return [];
    const d = tr.ate - de;
    if (d < 0.6 && pedido === undefined) return [];
    if (pedido !== undefined) return [{ de, ate: tr.ate, quanto: pedido, rampa: Math.min(d, 0.8) }];
    return [{ de, ate: tr.ate, quanto: Math.min(0.04, 0.018 * d), rampa: d }];
  });
  empurroesGuardados.set(plano, lista);
  return lista;
};

const estadosGuardados = new WeakMap<object, EstadoDaCaixa[]>();

// A caixa da pessoa no instante t (sempre o quadro cheio; muda o zoom e para onde o rosto vai).
export const caixaDaPessoa = (plano: Plano, t: number): Caixa => {
  let estados = estadosGuardados.get(plano);
  if (!estados) {
    const ay = ancoraDo(plano);
    estados = tomadas(plano).map((x) => {
      const caixa: Partial<Caixa> = x.lado ? { ...reframe(plano, x.lado), zoom: x.zoom } : { zoom: x.zoom, ancoraY: ay, ancoraX: 0.5 };
      // num corte (ou na volta do B-roll) a câmera muda seca; no meio da frase, num movimento
      return x.seco ? { de: Math.max(0, x.de - 0.001), dur: 0.001, caixa: caixa as Caixa } : { de: x.de, dur: DUR_MOVIMENTO, caixa: caixa as Caixa };
    });
    estadosGuardados.set(plano, estados);
  }
  const c = caixaNoTempo(t, estados, CHEIO_16x9);
  let z = c.zoom ?? 1;
  for (const e of empurroes(plano)) {
    if (t < e.de || t >= e.ate) continue;
    const p = Math.min(1, (t - e.de) / Math.max(0.01, e.rampa));
    z *= 1 + e.quanto * (0.5 - Math.cos(Math.PI * p) / 2);
  }
  return { ...c, zoom: z };
};

// O lado do reframe no instante t (null = quadro cheio), para o resto da tela saber onde está livre.
export const ladoNoTempo = (plano: Plano, t: number): Lado | null => {
  const x = tomadas(plano).find((y) => t >= y.de && t < y.ate);
  return x?.lado ?? null;
};
