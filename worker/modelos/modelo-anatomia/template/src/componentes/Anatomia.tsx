// A assinatura do Anatomia: o rosto em ilustração médica 2.5D na prancha de cima. Ele sai do vídeo
// (de um quadro de anatomia na parede, se o plano disser onde) ou se desenha no lugar, gira de 3/4
// para frente, a varredura revela os músculos por baixo da pele e cada estrutura dita acende na
// palavra: a câmera vai até a região, a retícula marca, o músculo pulsa com fibras de luz, o rótulo
// entra com a função e as rugas que ela faz aparecem. No modo "esquema", vira um corpo em traço fino
// (Esquema.tsx).
import type { Anatomia as TAnatomia, Estrutura, Plano } from "../plano";
import { Face, type FaceState, facePoint } from "../rosto/Face";
import { type Rugas, doCatalogo, ehMusculo } from "../rosto/catalogo";
import { projUnit } from "../rosto/geom";
import { EASE_IN, EASE_INOUT, EASE_OUT, lerp, prog, win } from "../tema";
import { Esquema } from "./Esquema";
import { Reticula, Rotulo, Selo } from "./Pecas";

export type NoVideo = (x: number, y: number, t: number) => { x: number; y: number; escala: number };
export type Mergulho = { de: number; regiao?: string };

type Shot = { t: number; S: number; ax: number; ay: number; fx: number; fy: number; yaw: number };
const GERAL = { S: 370, ax: 540, ay: 535, fx: 0, fy: -0.085, yaw: 0 };

type Lado = "esquerda" | "direita";
type Plan = {
  e: Estrutura;
  inicio: number;
  shot0: number;
  out: number;
  lado: Lado;
  // −1 quando uma estrutura lateral vai para o lado esquerdo (espelha)
  sg: number;
  shot: Omit<Shot, "t">;
};

const inicioDe = (e: Estrutura) => Math.min(e.regiaoEm ?? e.em, e.em);

// o roteiro da câmera e dos rótulos de uma anatomia (rosto)
const roteiro = (m: TAnatomia, mergulho?: Mergulho) => {
  const ests = [...m.estruturas].sort((a, b) => inicioDe(a) - inicioDe(b));
  const plans: Plan[] = [];
  let anterior: Lado = "direita";
  ests.forEach((e) => {
    const c = doCatalogo(e.id);
    const lado: Lado = e.lado ?? (c.central ? (anterior === "esquerda" ? "direita" : "esquerda") : "direita");
    const sg = !c.central && lado === "esquerda" ? -1 : 1;
    anterior = lado;
    const ax = c.central ? (lado === "esquerda" ? 650 : 400) : lado === "direita" ? 430 : 650;
    const ay = c.foco.fy < -0.3 ? 400 : 470;
    const inicio = inicioDe(e);
    plans.push({ e, inicio, shot0: inicio - 0.35, out: 0, lado, sg, shot: { S: c.foco.S, ax, ay, fx: c.foco.fx * sg, fy: c.foco.fy, yaw: c.foco.yaw * sg } });
  });
  const fim = mergulho ? mergulho.de - 0.1 : m.ate - 0.35;
  plans.forEach((p, i) => {
    p.out = i + 1 < plans.length ? plans[i + 1].shot0 - 0.05 : fim;
  });
  // câmera: geral → cada estrutura (0,7 s de viagem) → (mergulho na região do corte, ou volta ao geral)
  const SH: Shot[] = [{ t: m.de + 0.68, ...GERAL }];
  plans.forEach((p) => {
    const last = SH[SH.length - 1];
    const t0 = Math.max(last.t + 0.05, p.shot0);
    SH.push({ ...last, t: t0 });
    SH.push({ t: t0 + 0.7, ...p.shot });
  });
  const ultimo = plans[plans.length - 1];
  if (mergulho) {
    const alvo = plans.find((p) => p.e.id === mergulho.regiao) ?? ultimo;
    const last = SH[SH.length - 1];
    const t0 = Math.max(last.t + 0.05, mergulho.de - 0.06);
    SH.push({ ...last, t: t0 });
    SH.push({ t: t0 + 0.58, S: 2400, ax: 540, ay: 470, fx: alvo ? alvo.shot.fx * 0.5 : 0.12, fy: alvo ? alvo.shot.fy : -0.34, yaw: 0 });
  } else if (ultimo) {
    // estrutura final que fica muito tempo na tela: a câmera recua devagar (nada parado)
    const ultimaPalavra = Math.max(ultimo.e.em, ultimo.e.funcaoEm ?? 0, ultimo.e.grandeEm ?? 0);
    if (m.ate - ultimaPalavra > 3.2) {
      const last = SH[SH.length - 1];
      const t0 = Math.max(last.t + 0.05, ultimaPalavra + 1.4);
      SH.push({ ...last, t: t0 });
      SH.push({ t: t0 + 1.2, ...GERAL });
    }
  }
  return { plans, SH };
};

const shotAt = (SH: Shot[], t: number): Shot => {
  if (t <= SH[0].t) return SH[0];
  for (let i = 1; i < SH.length; i++)
    if (t <= SH[i].t) {
      const a = SH[i - 1];
      const b = SH[i];
      const p = EASE_INOUT((t - a.t) / Math.max(1e-6, b.t - a.t));
      return { t, S: Math.exp(lerp(Math.log(a.S), Math.log(b.S), p)), ax: lerp(a.ax, b.ax, p), ay: lerp(a.ay, b.ay, p), fx: lerp(a.fx, b.fx, p), fy: lerp(a.fy, b.fy, p), yaw: lerp(a.yaw, b.yaw, p) };
    }
  return SH[SH.length - 1];
};

export const estadoDoRosto = (m: TAnatomia, t: number, noVideo: NoVideo | null, mergulho?: Mergulho): { s: FaceState; plans: Plan[] } => {
  const { plans, SH } = roteiro(m, mergulho);
  const de = m.de;
  const fly = prog(t, de, de + 0.68, EASE_INOUT);
  let sh = shotAt(SH, t);
  let yaw = sh.yaw + 0.03 * Math.sin(t * 1.25);
  if (t < de + 0.68) {
    // sai do ponto do vídeo (quadro na parede) ou cresce no lugar
    const po = m.origem && noVideo ? (() => {
      const v = noVideo(m.origem.x, m.origem.y, t);
      return { x: v.x, y: v.y, S: (m.origem.tamanho ?? 0.17) * 1080 * v.escala };
    })() : { x: GERAL.ax, y: GERAL.ay + 20, S: GERAL.S * 0.82 };
    sh = { ...SH[0], S: Math.exp(lerp(Math.log(po.S), Math.log(GERAL.S), fly)), ax: lerp(po.x, GERAL.ax, fly), ay: lerp(po.y, GERAL.ay, fly) };
    yaw = 0.42 * Math.sin((Math.PI / 2) * Math.min(1, fly * 1.6)) + 0.03 * Math.sin(t * 1.25);
  } else {
    yaw += 0.42 * (1 - prog(t, de + 0.68, de + 1.43, EASE_INOUT));
  }
  const pitch = -0.04;
  const S = sh.S * (1 + 0.006 * Math.sin(t * 0.9));
  const f = projUnit(sh.fx, sh.fy, 0, yaw, pitch);
  const cam = { yaw, pitch, S, ox: sh.ax - f.x * S, oy: sh.ay - f.y * S };

  const pulse = (k: number) => 0.5 + 0.5 * Math.sin((2 * Math.PI * (t - k)) / 1.05);
  const act: Record<string, number> = {};
  const pull = { fr: 0, co: 0, or: 0 };
  const wr: Partial<Record<Rugas, [number, number]>> = {};
  const tracos: FaceState["tracos"] = {};
  const primeiro = plans[0];
  const contrai = m.contraiEm !== undefined && primeiro ? win(t, m.contraiEm - 0.4, primeiro.shot0, 0.4, 0.3) : 0;
  for (const p of plans) {
    const c = doCatalogo(p.e.id);
    const a = Math.max(p.e.regiaoEm !== undefined ? 0.55 * win(t, p.e.regiaoEm - 0.05, p.out, 0.5) : 0, win(t, p.e.em - 0.05, p.out));
    for (const k of c.musculos) act[k] = Math.max(act[k] ?? 0, a);
    if (c.deform) pull[c.deform] = Math.max(pull[c.deform], contrai * (c.deform === "or" ? 0.7 : 0.8), a * (0.45 + 0.55 * pulse(p.e.em)));
    if (c.traco) tracos[c.traco] = Math.max(tracos[c.traco] ?? 0, a);
    if (c.rugas && p.e.rugas !== false) {
      let v: [number, number];
      if (primeiro && t < primeiro.inicio - 0.08) v = [prog(t, (m.contraiEm ?? -99) - 0.1, (m.contraiEm ?? -99) + 0.45, EASE_OUT), 0.42 * contrai];
      else {
        const tw = p.e.grandeEm ?? p.e.funcaoEm ?? p.e.em + 0.6;
        const main = prog(t, tw - 0.05, tw + 0.3, EASE_OUT);
        const after = lerp(1, 0.42, prog(t, p.out, p.out + 0.5)) * (mergulho && t > mergulho.de ? 1.6 : 1);
        v = [prog(t, tw - 0.08, tw + 0.5, EASE_OUT), main * after];
      }
      const old = wr[c.rugas];
      wr[c.rugas] = old ? [Math.max(old[0], v[0]), Math.max(old[1], v[1])] : v;
    }
  }
  const ultimo = plans[plans.length - 1];
  const temMusculo = m.estruturas.some((e) => ehMusculo(e.id));
  const musculosEm = temMusculo ? m.musculosEm ?? Math.max(de + 0.8, (plans.find((p) => ehMusculo(p.e.id))?.inicio ?? de + 1) - 0.6) : Infinity;
  const fimDaVista = mergulho ? 1 - prog(t, mergulho.de + 0.07, mergulho.de + 0.42, EASE_IN) : 1 - prog(t, m.ate - 0.35, m.ate, EASE_IN);
  return {
    plans,
    s: {
      id: `anat${Math.round(m.de * 100)}`,
      cam,
      draw: prog(t, de + 0.02, de + 0.63, EASE_INOUT),
      ghost: 1 - prog(t, de + 0.28, de + 0.78),
      alpha: prog(t, de - 0.02, de + 0.1) * fimDaVista,
      wipe: Number.isFinite(musculosEm) ? prog(t, musculosEm - 0.06, musculosEm + 0.6, EASE_INOUT) : 0,
      muscles: Number.isFinite(musculosEm) ? prog(t, musculosEm - 0.1, musculosEm + 0.3) : 0,
      act,
      dim: primeiro ? win(t, primeiro.inicio - 0.1, ultimo.out, 0.5, 0.4) : 0,
      pull,
      wr,
      tracos,
      flow: t,
    },
  };
};

const MASK = (fundo: number) => `linear-gradient(180deg, rgba(0,0,0,0) 90px, #000 150px, #000 ${fundo - 70}px, rgba(0,0,0,0) ${fundo - 10}px)`;

export const Anatomia: React.FC<{ m: TAnatomia; t: number; plano: Plano; noVideo: NoVideo | null; mergulho?: Mergulho; fundo: number }> = ({ m, t, noVideo, mergulho, fundo }) => {
  if (m.parte === "esquema") return <Esquema m={m} t={t} fundo={fundo} />;
  const fimVisivel = mergulho ? mergulho.de + 0.45 : m.ate + 0.05;
  if (t < m.de - 0.05 || t > fimVisivel) return null;
  const { s, plans } = estadoDoRosto(m, t, noVideo, mergulho);
  const selo = m.ilustrativo === false ? 0 : win(t, m.de + 0.9, (mergulho ? mergulho.de : m.ate) - 0.3, 0.5, 0.3);
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", WebkitMaskImage: MASK(fundo), maskImage: MASK(fundo) }}>
        <Face s={s} />
      </svg>
      {plans.map((p, i) => {
        const c = doCatalogo(p.e.id);
        const centro = facePoint(s, c.central ? 0 : c.alvo.x * p.sg, c.alvo.y);
        const ancoraX = c.ancora[0] * (c.central ? (p.lado === "esquerda" ? -1 : 1) : p.sg);
        const anc = facePoint(s, ancoraX, c.ancora[1]);
        const a = p.e.regiaoEm ?? p.e.em;
        return (
          <div key={i}>
            <Reticula t={t} cx={centro.x} cy={centro.y} rx={c.alvo.rx * s.cam.S} ry={c.alvo.ry * s.cam.S} a={a} b={(p.e.regiaoEm !== undefined ? p.e.em : p.e.em + 0.5) + 0.35} />
            <Rotulo t={t} ax={anc.x} ay={anc.y} lado={p.lado} y={318} titulo={p.e.rotulo} tIn={p.e.em} sub={p.e.funcao} tSub={p.e.funcaoEm ?? p.e.em + 0.5} grande={p.e.grande} tGrande={p.e.grandeEm ?? p.e.em + 0.8} out={p.out - 0.05} />
          </div>
        );
      })}
      <Selo a={selo} x={64} y={fundo - 74} />
    </>
  );
};
