// Parte do motor: o vídeo da pessoa dentro de uma caixa que pode mudar de tamanho e lugar
// (quadro cheio, metade da tela, janelinha no canto…), sempre com o rosto enquadrado.
// Funciona com qualquer gravação: não recorta a pessoa do fundo, só reenquadra o vídeo.
//
// Quando o plano tem `rosto.rastro` (o cortar.mjs grava sozinho), a caixa segue o rosto: se a
// pessoa se inclina ou muda de lugar, o vídeo desliza para o rosto continuar onde o layout o pôs.
// Caixas em que o rosto é grande (janela, círculo) seguem de perto; caixas grandes (quadro cheio)
// só fazem reenquadramentos suaves, sem parecer que a câmera está passeando. Para uma caixa que
// precisa do recorte fixo, use `seguirRosto={false}`.
import { Video } from "@remotion/media";
import { Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export type Caixa = {
  // posição e tamanho no quadro 1080×1920, em px
  x: number;
  y: number;
  w: number;
  h: number;
  // arredondamento dos cantos, em px
  raio?: number;
  // 1 = o menor enquadramento que cobre a caixa; mais que isso aproxima no rosto
  zoom?: number;
  // onde o centro do rosto fica dentro da caixa, de 0 (topo) a 1 (base); 0.42 deixa respiro em cima
  ancoraY?: number;
};

export const CHEIO: Caixa = { x: 0, y: 0, w: 1080, h: 1920, raio: 0, zoom: 1, ancoraY: 0.3 };

const suave = Easing.bezier(0.65, 0, 0.35, 1);

// Estados da caixa ao longo do tempo: cada um vale a partir de `de` e a troca leva `dur` segundos.
export type EstadoDaCaixa = { de: number; caixa: Caixa; dur?: number };

export const caixaNoTempo = (t: number, estados: EstadoDaCaixa[]): Caixa => {
  const ordem = [...estados].sort((a, b) => a.de - b.de);
  let i = -1;
  for (let k = 0; k < ordem.length; k++) if (ordem[k].de <= t) i = k;
  if (i <= 0) return { ...CHEIO, ...(ordem[0]?.caixa ?? {}) };
  const antes = { ...CHEIO, ...ordem[i - 1].caixa };
  const agora = { ...CHEIO, ...ordem[i].caixa };
  const p = interpolate(t, [ordem[i].de, ordem[i].de + (ordem[i].dur ?? 0.55)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: suave,
  });
  const mix = (a: number, b: number) => a + (b - a) * p;
  return {
    x: mix(antes.x, agora.x),
    y: mix(antes.y, agora.y),
    w: mix(antes.w, agora.w),
    h: mix(antes.h, agora.h),
    raio: mix(antes.raio ?? 0, agora.raio ?? 0),
    zoom: mix(antes.zoom ?? 1, agora.zoom ?? 1),
    ancoraY: mix(antes.ancoraY ?? 0.3, agora.ancoraY ?? 0.3),
  };
};

// ---------- o rosto ao longo do tempo ----------

// Gravado pelo cortar.mjs (scripts/rastrear.mjs) dentro de `rosto`. Frações do quadro 1080×1920.
export type Rastro = {
  // segundos entre amostras (1 quadro do vídeo de trabalho)
  passo: number;
  // largura do rosto, em fração da largura do quadro
  largura: number;
  // o `rosto` fixo de quando o rastro foi feito
  ref: { x: number; y: number };
  // centro do rosto em cada quadro
  x: number[];
  y: number[];
  // caminho da câmera: o mesmo centro sem os balanços (zona morta) e com reenquadramentos suaves
  cx: number[];
  cy: number[];
};
export type Rosto = { x: number; y: number; rastro?: Rastro };

const valido = (r: Rastro | undefined): r is Rastro =>
  !!r &&
  r.passo > 0 &&
  !!r.ref &&
  Array.isArray(r.x) &&
  r.x.length > 1 &&
  r.y?.length === r.x.length &&
  r.cx?.length === r.x.length &&
  r.cy?.length === r.x.length;

const naPosicao = (v: number[], pos: number) => {
  const p = Math.max(0, Math.min(v.length - 1, pos));
  const i = Math.floor(p);
  const j = Math.min(v.length - 1, i + 1);
  return v[i] + (v[j] - v[i]) * (p - i);
};

// média gaussiana em volta de `pos` (σ em amostras): tira o tremor fino sem atrasar
const suavizado = (v: number[], pos: number, sigma: number) => {
  const c = Math.round(Math.max(0, Math.min(v.length - 1, pos)));
  const r = Math.ceil(sigma * 2.5);
  let a = 0;
  let p = 0;
  for (let k = -r; k <= r; k++) {
    const j = c + k;
    if (j < 0 || j >= v.length) continue;
    const w = Math.exp(-((j - pos) ** 2) / (2 * sigma * sigma));
    a += v[j] * w;
    p += w;
  }
  return p > 0 ? a / p : naPosicao(v, pos);
};

// Centro do rosto no instante t (segundos do vídeo de trabalho), em frações do quadro 1080×1920 —
// a mesma convenção de `rosto`. Sem rastro, devolve o rosto fixo. Se `rosto` não é o do plano
// (um ponto deslocado a partir dele), o ponto anda junto com o rosto.
export const rostoNoTempo = (rosto: Rosto, t: number): { x: number; y: number } => {
  const r = rosto.rastro;
  if (!valido(r)) return { x: rosto.x, y: rosto.y };
  const pos = t / r.passo;
  return { x: naPosicao(r.x, pos) + rosto.x - r.ref.x, y: naPosicao(r.y, pos) + rosto.y - r.ref.y };
};

// O ponto que uma câmera deve seguir no instante t (frações do quadro 1080×1920). `aperto` vai de
// 0 (câmera calma: parada nos balanços, reenquadra quando a pessoa muda de lugar) a 1 (de perto:
// acompanha o rosto, só sem o tremor fino). Para quem posiciona o vídeo com conta própria em vez
// do VideoNaCaixa (ex.: uma janela redonda): ponha este ponto onde o rosto deve ficar.
export const pontoDoRosto = (rosto: Rosto, t: number, aperto = 1): { x: number; y: number } => {
  const r = rosto.rastro;
  if (!valido(r)) return { x: rosto.x, y: rosto.y };
  const pos = t / r.passo;
  const sigma = 0.2 / r.passo;
  const k = Math.min(1, Math.max(0, aperto));
  const camX = naPosicao(r.cx, pos);
  const camY = naPosicao(r.cy, pos);
  return {
    x: camX + k * (suavizado(r.x, pos, sigma) - camX) + rosto.x - r.ref.x,
    y: camY + k * (suavizado(r.y, pos, sigma) - camY) + rosto.y - r.ref.y,
  };
};

// ---------- o enquadramento ----------

const entre = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const suave01 = (v: number) => {
  const p = entre(v, 0, 1);
  return p * p * (3 - 2 * p);
};
// Desloca `d` a partir da posição fixa sem passar da borda do vídeo, freando antes (sem tranco).
// `baixo` e `cima` são quanto dá para andar em cada sentido (≥ 0).
const freado = (d: number, baixo: number, cima: number) => {
  if (d >= 0) return cima > 0.5 ? cima * Math.tanh(d / cima) : 0;
  return baixo > 0.5 ? -baixo * Math.tanh(-d / baixo) : 0;
};

// Faixa (2% a 98%) do caminho da câmera e do caminho fino: quanto de folga a caixa precisa
type Faixas = { cx: [number, number]; cy: [number, number]; x: [number, number]; y: [number, number] };
const faixasGuardadas = new WeakMap<Rastro, Faixas>();
const faixa = (v: number[]): [number, number] => {
  const o = Float64Array.from(v).sort();
  return [o[Math.floor((o.length - 1) * 0.02)], o[Math.ceil((o.length - 1) * 0.98)]];
};
const faixasDo = (r: Rastro) => {
  let f = faixasGuardadas.get(r);
  if (!f) {
    f = { cx: faixa(r.cx), cy: faixa(r.cy), x: faixa(r.x), y: faixa(r.y) };
    faixasGuardadas.set(r, f);
  }
  return f;
};

// Quanto a caixa pode aproximar além do zoom dela para ter folga de seguir o rosto. Em quadro
// cheio é pouco (8%): a câmera só corrige, não passeia. Em janela onde o rosto é grande, até 25%.
// A folga vale para o vídeo inteiro (o zoom não "respira" enquanto a pessoa se mexe).
const FOLGA_CHEIO = 1.08;
const FOLGA_JANELA = 1.25;

export type Enquadramento = {
  // escala do vídeo (1 = 1080 px de largura) e o tamanho dele na tela, em px
  escala: number;
  lv: number;
  av: number;
  // canto do vídeo em relação ao canto da caixa, em px (sempre ≤ 0: o vídeo cobre a caixa)
  esquerda: number;
  topo: number;
};

// Onde o vídeo cai dentro da caixa no instante t (segundos do vídeo de trabalho). É a conta do
// VideoNaCaixa: use para desenhar por cima da pessoa no lugar certo. t = null (ou seguir = false)
// dá o enquadramento fixo, igual ao de quando não há rastro.
export const enquadrar = (caixa: Caixa, rosto: Rosto, videoAltura: number, t: number | null, seguir = true): Enquadramento => {
  const W0 = 1080;
  const H0 = videoAltura;
  const fx = rosto.x;
  const fy = (rosto.y * 1920) / H0;
  const s0 = Math.max(caixa.w / W0, caixa.h / H0) * (caixa.zoom ?? 1);
  const lv0 = W0 * s0;
  const av0 = H0 * s0;
  // fixo: rosto no centro da caixa (na horizontal) e na altura `ancoraY`, sem borda vazia
  const e0 = entre(caixa.w / 2 - fx * lv0, caixa.w - lv0, 0);
  const t0 = entre(caixa.h * (caixa.ancoraY ?? 0.3) - fy * av0, caixa.h - av0, 0);
  const r = rosto.rastro;
  if (!seguir || t === null || !valido(r) || caixa.w < 2 || caixa.h < 2) return { escala: s0, lv: lv0, av: av0, esquerda: e0, topo: t0 };

  // onde o layout põe o rosto (px dentro da caixa): é ali que ele fica enquanto a pessoa se mexe
  const X = e0 + fx * lv0;
  const Y = t0 + fy * av0;
  // caixa em que o rosto é grande (janela, círculo) segue de perto; caixa grande só reenquadra
  const rostoPx = r.largura * W0 * s0;
  const kx = suave01((rostoPx / caixa.w - 0.42) / 0.33);
  const ky = suave01(((rostoPx * 1.35) / caixa.h - 0.42) / 0.33);
  const alvoX = pontoDoRosto(rosto, t, kx).x;
  const alvoY = (pontoDoRosto(rosto, t, ky).y * 1920) / H0;

  // folga: o menor zoom extra que deixa segurar o rosto em (X, Y) no caminho todo
  const f = faixasDo(r);
  const mix = (a: [number, number], b: [number, number], k: number) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const [x1, x2] = mix(f.cx, f.x, kx).map((v) => v + fx - r.ref.x);
  const [y1, y2] = mix(f.cy, f.y, ky).map((v) => ((v + rosto.y - r.ref.y) * 1920) / H0);
  const precisaL = Math.max(X / Math.max(0.05, x1), (caixa.w - X) / Math.max(0.05, 1 - x2));
  const precisaA = Math.max(Y / Math.max(0.05, y1), (caixa.h - Y) / Math.max(0.05, 1 - y2));
  // cada direção pede a folga dela, até o limite dela (quadro cheio pede pouco; janela, mais)
  const limite = (k: number) => FOLGA_CHEIO + (FOLGA_JANELA - FOLGA_CHEIO) * k;
  const folga = Math.max(1, Math.min(precisaL / lv0, limite(kx)), Math.min(precisaA / av0, limite(ky)));
  const escala = s0 * folga;
  const lv = W0 * escala;
  const av = H0 * escala;

  // o fixo na escala nova (aproxima em volta do rosto) e o deslocamento que segue o rosto,
  // freado antes da borda do vídeo
  const eF = entre(X - fx * lv, caixa.w - lv, 0);
  const tF = entre(Y - fy * av, caixa.h - av, 0);
  const esquerda = eF + freado(X - alvoX * lv - eF, eF - (caixa.w - lv), -eF);
  const topo = tF + freado(Y - alvoY * av - tF, tF - (caixa.h - av), -tF);
  return { escala, lv, av, esquerda, topo };
};

// Onde o rosto está na tela no instante t (px no quadro 1080×1920), já com a caixa seguindo:
// use para desenhar algo preso ao rosto (moldura, seta, etiqueta). `largura` = largura do rosto em px.
export const rostoNaTela = (caixa: Caixa, rosto: Rosto, videoAltura: number, t: number, seguir = true) => {
  const e = enquadrar(caixa, rosto, videoAltura, t, seguir);
  const r = seguir ? rostoNoTempo(rosto, t) : { x: rosto.x, y: rosto.y };
  return {
    x: caixa.x + e.esquerda + r.x * e.lv,
    y: caixa.y + e.topo + ((r.y * 1920) / videoAltura) * e.av,
    escala: e.escala,
    largura: (rosto.rastro?.largura ?? 0.36) * e.lv,
  };
};

// `rosto` vem do plano (frações do quadro 1080×1920, com o `rastro` quando houver);
// `videoAltura` é a altura do vídeo de trabalho.
export const VideoNaCaixa: React.FC<{
  src: string;
  caixa: Caixa;
  rosto: Rosto;
  videoAltura: number;
  filtro?: string;
  estilo?: React.CSSProperties;
  // true numa segunda cópia da pessoa (ex.: miniatura) para a voz não sair dobrada
  mudo?: boolean;
  // false: recorte fixo, sem seguir o rosto (padrão: segue quando o plano tem rastro)
  seguirRosto?: boolean;
}> = ({ src, caixa, rosto, videoAltura, filtro, estilo, mudo, seguirRosto = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // o tempo do vídeo que está na tela (dentro de uma Sequence, o vídeo também recomeça nela)
  const e = enquadrar(caixa, rosto, videoAltura, frame / fps, seguirRosto);

  return (
    <div
      style={{
        position: "absolute",
        left: caixa.x,
        top: caixa.y,
        width: caixa.w,
        height: caixa.h,
        overflow: "hidden",
        borderRadius: caixa.raio ?? 0,
        ...estilo,
      }}
    >
      <Video
        src={staticFile(src)}
        objectFit="fill"
        muted={mudo}
        style={{ position: "absolute", left: e.esquerda, top: e.topo, width: e.lv, height: e.av, filter: filtro }}
      />
    </div>
  );
};
