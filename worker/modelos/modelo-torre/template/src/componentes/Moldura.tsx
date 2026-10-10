// A pessoa SEMPRE numa moldura com o fundo natural dela (cantos arredondados, filete fino, sombra suave).
// Começo: moldura grande (a "ponte", título por cima da cabeça). Depois: a moldura desce e encolhe para a
// metade de baixo e o mundo 3D ocupa a de cima. A cada corte do vídeo, o enquadramento alterna (punch) e
// empurra devagar dentro do trecho. A virada: a linha de luz desce pela moldura (troca a roupa quando há o
// vídeo trocado).
import React from "react";
import { clamp01, EASE_INOUT, lerp, prog } from "../anim";
import { VideoNaCaixa, type Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { divideK, type Roteiro } from "../roteiro";
import { CARTAO, K, PONTE, ROSTO_CARTAO_Y, ROSTO_PONTE_Y } from "../tema";

const DUR_VIRADA = 0.6;
// zoom de cada moldura (1 = o menor enquadramento que cobre a caixa)
const Z_PONTE = 1.143;
const Z_CARTAO = 1.047;
const PUNCH = 1.078;
const EMPURRAO = 0.0165;

const trechoEm = (cortes: number[], t: number, dur: number) => {
  const cs = [...cortes].filter((c) => c > 0.05 && c < dur - 0.05).sort((a, b) => a - b);
  let i = 0;
  for (const c of cs) if (t >= c) i++;
  const de = i === 0 ? 0 : cs[i - 1];
  const ate = i < cs.length ? cs[i] : dur;
  return { i, p: clamp01((t - de) / Math.max(0.5, ate - de)) };
};

// tamanho do rosto na tela que o estilo procura (o do exemplo); rosto maior que isso (gravação de perto)
// não aproxima, e o rosto desce na moldura para a cabeça caber inteira
const ROSTO_PONTE_PX = 408;
const ROSTO_CARTAO_PX = 350;
const larguraDoRosto = (plano: Plano) => (plano.rosto.rastro?.largura ?? 0.36) * 1080;

export const caixaDaPessoa = (plano: Plano, R: Roteiro, t: number): Caixa => {
  const k = divideK(R, t);
  const { i, p } = trechoEm(plano.cortesEm ?? [], t, plano.duracao);
  const mov = (i % 2 ? PUNCH : 1) * (1 + EMPURRAO * EASE_INOUT(p));
  const va = plano.videoAltura ?? 1920;
  const rw = larguraDoRosto(plano);
  const montar = (bx: typeof PONTE, z: number, alvoPx: number, rostoY: number) => {
    const s0 = Math.max(bx.w / 1080, bx.h / va);
    const zoom = Math.max(1, Math.min(z, alvoPx / (rw * s0)) * mov);
    const naTela = rw * s0 * zoom;
    const ancoraY = Math.min(0.62, Math.max((rostoY - bx.y) / bx.h, (0.74 * naTela + 28) / bx.h));
    return { ...bx, zoom, ancoraY };
  };
  const a = montar(PONTE, Z_PONTE, ROSTO_PONTE_PX, ROSTO_PONTE_Y);
  const b = montar(CARTAO, Z_CARTAO, ROSTO_CARTAO_PX, ROSTO_CARTAO_Y);
  return {
    x: lerp(a.x, b.x, k),
    y: lerp(a.y, b.y, k),
    w: lerp(a.w, b.w, k),
    h: lerp(a.h, b.h, k),
    raio: lerp(a.raio, b.raio, k),
    zoom: lerp(a.zoom, b.zoom, k),
    ancoraY: lerp(a.ancoraY, b.ancoraY, k),
  };
};

/** a linha de luz (filete branco no meio, champanhe nas pontas, brilho) */
export const LinhaDeLuz: React.FC<{ y: number; x?: number; w?: number; p: number }> = ({ y, x = 0, w = 1080, p }) => {
  const c = K.ouro;
  return (
    <>
      <div style={{ position: "absolute", left: x, top: y - 140, width: w, height: 140, background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${c}22 70%, ${c}55 100%)`, mixBlendMode: "screen", opacity: 1 - p * 0.3 }} />
      <div style={{ position: "absolute", left: x, top: y - 3, width: w, height: 6, background: `linear-gradient(90deg, ${c}00, ${c} 18%, #fff 50%, ${c} 82%, ${c}00)`, boxShadow: `0 0 24px 6px ${c}AA, 0 0 70px 14px ${c}55` }} />
    </>
  );
};

export const viradaP = (plano: Plano, t: number) => {
  const v = plano.virada;
  if (!v) return null;
  return EASE_INOUT(clamp01((t - v.em) / DUR_VIRADA));
};

export const Moldura: React.FC<{ plano: Plano; R: Roteiro; t: number }> = ({ plano, R, t }) => {
  const c = caixaDaPessoa(plano, R, t);
  const va = plano.videoAltura ?? 1920;
  const v = plano.virada;
  const p = viradaP(plano, t);
  const comVideo = !!v && (!!v.video || !!v.antes);
  const varrendo = v && t >= v.em - 0.001 && t <= v.em + DUR_VIRADA + 0.05;
  const yLinha = p === null ? 0 : lerp(c.y - 4, c.y + c.h + 4, p);
  // sem vídeo trocado, a moldura ganha o filete dourado na virada
  const ouro = !v || comVideo ? 1 : prog(t, v.em + 0.2, v.em + DUR_VIRADA);
  const box: React.CSSProperties = { position: "absolute", left: c.x, top: c.y, width: c.w, height: c.h, borderRadius: c.raio };
  return (
    <>
      <div style={{ ...box, boxShadow: "0 34px 90px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.35)", background: "#000" }} />
      {/* o vídeo principal fica montado o tempo todo: é dele que vem a voz */}
      <VideoNaCaixa src={plano.video} caixa={c} rosto={plano.rosto} videoAltura={va} />
      {v?.video && t >= v.em - 0.001 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: varrendo ? `inset(0 0 ${1920 - yLinha}px 0)` : undefined }}>
          <VideoNaCaixa src={v.video} caixa={c} rosto={plano.rosto} videoAltura={va} mudo />
        </div>
      ) : null}
      {v?.antes && t < v.em + DUR_VIRADA + 0.05 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: t >= v.em ? `inset(${yLinha}px 0 0 0)` : undefined }}>
          <VideoNaCaixa src={v.antes} caixa={c} rosto={plano.rosto} videoAltura={va} mudo />
        </div>
      ) : null}
      {varrendo && comVideo && p !== null ? (
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(${c.y}px ${1080 - c.x - c.w}px ${1920 - c.y - c.h}px ${c.x}px round ${c.raio}px)` }}>
          <LinhaDeLuz y={yLinha} p={p} />
        </div>
      ) : null}
      <div
        style={{
          ...box,
          border: `1.5px solid ${ouro >= 1 ? "rgba(217,190,138,0.55)" : `rgba(${Math.round(lerp(236, 217, ouro))},${Math.round(lerp(240, 190, ouro))},${Math.round(lerp(248, 138, ouro))},${lerp(0.32, 0.55, ouro)})`}`,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
          pointerEvents: "none",
        }}
      />
    </>
  );
};
