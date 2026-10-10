// A pessoa com o fundo natural dela, no quadro deitado (16:9), pela regra da aula 9 do curso:
// TELA CHEIA é a base (o vídeo como foi gravado, sem borda). Quando um bloco abre o quadro da
// esquerda, a pessoa vai para a MOLDURA da direita (cantos arredondados, filete champanhe, sombra
// suave), com o rosto no meio dela e acompanhado com ajuste suave (o rastro do rosto); quando a
// ideia termina, ela volta à tela cheia. A cada corte do vídeo, o enquadramento alterna (punch) e
// empurra devagar dentro do trecho. A virada: a linha de luz desce pela pessoa (troca a roupa quando
// há o vídeo trocado).
import React from "react";
import { clamp01, EASE_INOUT, lerp, prog } from "../anim";
import { VideoNaCaixa, type Caixa, type Rosto } from "../motor/caixa";
import type { Plano } from "../plano";
import { quadroK, type Roteiro } from "../roteiro";
import { H, K, MOLDURA, ROSTO_MOLDURA_PX, W } from "../tema";

const DUR_VIRADA = 0.6;
// a moldura aproxima no máximo isto (1 = o menor enquadramento que cobre a caixa)
const Z_MOLDURA = 1.5;
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

// O rosto do plano no quadro deitado: o cortar.mjs grava `rosto.quadro` no 16:9; sem ele, vale
// a tela (1920×1080), para o rastro e as contas de posição usarem o quadro certo.
export const rostoDoPlano = (plano: Plano): Rosto => (plano.rosto.quadro ? plano.rosto : { ...plano.rosto, quadro: { largura: W, altura: H } });

// largura do rosto na gravação, em px do quadro (o rastro mede; o padrão é o de uma gravação deitada)
const larguraDoRosto = (plano: Plano) => (plano.rosto.rastro?.largura ?? 0.13) * W;

export const caixaDaPessoa = (plano: Plano, R: Roteiro, t: number): Caixa => {
  const k = quadroK(R, t);
  const { i, p } = trechoEm(plano.cortesEm ?? [], t, plano.duracao);
  const mov = (i % 2 ? PUNCH : 1) * (1 + EMPURRAO * EASE_INOUT(p));
  const va = plano.videoAltura ?? H;
  const rosto = rostoDoPlano(plano);
  // tela cheia: como foi gravado; o punch e o empurrão aproximam em volta do próprio rosto
  const fy = Math.max(0.2, Math.min(0.6, (rosto.y * H) / va));
  const cheio = { x: 0, y: 0, w: W, h: H, raio: 0, zoom: mov, ancoraX: rosto.x, ancoraY: fy };
  // moldura: o rosto no meio, no tamanho que o estilo procura (gravação de perto não aproxima, e o
  // rosto desce para a cabeça caber inteira)
  const rw = larguraDoRosto(plano);
  const s0 = Math.max(MOLDURA.w / W, MOLDURA.h / va);
  const zoom = Math.max(1, Math.min(Z_MOLDURA, ROSTO_MOLDURA_PX / (rw * s0)) * mov);
  const naTela = rw * s0 * zoom;
  const ancoraY = Math.min(0.6, Math.max(0.42, (0.74 * naTela + 28) / MOLDURA.h));
  const mold = { ...MOLDURA, zoom, ancoraX: 0.5, ancoraY };
  return {
    x: lerp(cheio.x, mold.x, k),
    y: lerp(cheio.y, mold.y, k),
    w: lerp(cheio.w, mold.w, k),
    h: lerp(cheio.h, mold.h, k),
    raio: lerp(cheio.raio, mold.raio, k),
    zoom: lerp(cheio.zoom, mold.zoom, k),
    ancoraX: lerp(cheio.ancoraX, mold.ancoraX, k),
    ancoraY: lerp(cheio.ancoraY, mold.ancoraY, k),
  };
};

/** a linha de luz (filete branco no meio, champanhe nas pontas, brilho) */
export const LinhaDeLuz: React.FC<{ y: number; x?: number; w?: number; p: number }> = ({ y, x = 0, w = W, p }) => {
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
  const rosto = rostoDoPlano(plano);
  // a moldura (filete e sombra) aparece quando a pessoa sai da tela cheia
  const k = quadroK(R, t);
  const va = plano.videoAltura ?? H;
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
      <div style={{ ...box, boxShadow: k > 0.01 ? `0 34px 90px rgba(0,0,0,${0.6 * k}), 0 8px 24px rgba(0,0,0,${0.35 * k})` : undefined, background: "#000" }} />
      {/* o vídeo principal fica montado o tempo todo: é dele que vem a voz */}
      <VideoNaCaixa src={plano.video} caixa={c} rosto={rosto} videoAltura={va} />
      {v?.video && t >= v.em - 0.001 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: varrendo ? `inset(0 0 ${H - yLinha}px 0)` : undefined }}>
          <VideoNaCaixa src={v.video} caixa={c} rosto={rosto} videoAltura={va} mudo />
        </div>
      ) : null}
      {v?.antes && t < v.em + DUR_VIRADA + 0.05 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: t >= v.em ? `inset(${yLinha}px 0 0 0)` : undefined }}>
          <VideoNaCaixa src={v.antes} caixa={c} rosto={rosto} videoAltura={va} mudo />
        </div>
      ) : null}
      {varrendo && comVideo && p !== null ? (
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(${c.y}px ${W - c.x - c.w}px ${H - c.y - c.h}px ${c.x}px round ${c.raio}px)` }}>
          <LinhaDeLuz y={yLinha} p={p} />
        </div>
      ) : null}
      {k > 0.01 ? (
        <div
          style={{
            ...box,
            opacity: k,
            border: `1.5px solid ${ouro >= 1 ? "rgba(217,190,138,0.55)" : `rgba(${Math.round(lerp(236, 217, ouro))},${Math.round(lerp(240, 190, ouro))},${Math.round(lerp(248, 138, ouro))},${lerp(0.32, 0.55, ouro)})`}`,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
            pointerEvents: "none",
          }}
        />
      ) : null}
    </>
  );
};
