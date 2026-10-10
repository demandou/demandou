import React from "react";
import { VideoNaCaixa, type Rosto } from "../motor/caixa";
import { caixaDaPessoa } from "../layout";
import type { Plano, Virada } from "../plano";
import { EASE_INOUT, GRAO_PAPEL, P, clamp01, useTempo } from "../tema";

/* A pessoa: tela cheia ou moldura sobre o papel (cantos arredondados, borda fina, sombra suave,
   fundo natural, sem recorte). A virada: uma linha de luz desce pela tela; acima dela já é o vídeo
   da virada (roupa trocada) — ou, sem esse vídeo, o novo enquadramento. A voz vem SEMPRE do vídeo
   principal, montado o vídeo inteiro. */

const DUR_VIRADA = 0.6;

/** papel creme de tela cheia (aparece em volta da moldura quando ela se recolhe) */
export const Papel: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 60% at 30% 12%, ${P.papelClaro} 0%, ${P.papel} 50%, ${P.papel2} 100%)` }}>
    <div style={{ position: "absolute", inset: 0, backgroundImage: GRAO_PAPEL, opacity: 0.16, mixBlendMode: "multiply" }} />
  </div>
);

export const Pessoa: React.FC<{ plano: Plano }> = ({ plano }) => {
  const t = useTempo();
  const videoAltura = plano.videoAltura ?? 1920;
  const c = caixaDaPessoa(plano, t);
  const rosto = plano.rosto as Rosto;
  const virada = plano.momentos.find((m): m is Virada => m.tipo === "virada");
  const at = virada?.trocaEm ?? Infinity;
  const pv = EASE_INOUT(clamp01((t - at) / DUR_VIRADA));
  const naVirada = t >= at - 0.001 && t <= at + DUR_VIRADA + 0.05;
  const depois = t > at + DUR_VIRADA;
  // a linha (px de tela) que desce durante a virada
  const linha = pv * 1920;
  // sem vídeo de virada: abaixo da linha fica o enquadramento de antes da troca
  const cAntes = !plano.videoVirada && naVirada ? caixaDaPessoa(plano, t, at - 0.001) : c;
  const corVirada = virada?.cor ?? P.menta;
  const fonteDepois = plano.videoVirada ?? plano.video;
  const mostraDepois = naVirada || depois;
  // a camada "depois" fica montada desde um pouco antes (pré-carrega) e só aparece acima da linha
  const montaDepois = !!virada && t >= at - 0.5;
  const recorteDepois = depois ? undefined : `inset(0px 0px ${Math.max(0, c.y + c.h - linha)}px 0px)`;
  return (
    <>
      {c.p > 0 ? <Papel /> : null}
      <div
        style={{
          position: "absolute",
          left: c.x,
          top: c.y,
          width: c.w,
          height: c.h,
          borderRadius: c.raio,
          boxShadow: c.p > 0 ? `0 ${26 * c.p}px ${60 * c.p}px rgba(28,36,26,${0.3 * c.p}), 0 ${4 * c.p}px ${12 * c.p}px rgba(28,36,26,${0.18 * c.p})` : undefined,
          background: "#000",
        }}
      />
      {/* vídeo principal: a voz vem dele, sempre montado */}
      <VideoNaCaixa src={plano.video} caixa={cAntes} rosto={rosto} videoAltura={videoAltura} />
      {montaDepois ? (
        <VideoNaCaixa
          src={fonteDepois}
          caixa={c}
          rosto={rosto}
          videoAltura={videoAltura}
          mudo
          estilo={{ clipPath: mostraDepois ? recorteDepois : "inset(0px 0px 100% 0px)", opacity: mostraDepois ? 1 : 0 }}
        />
      ) : null}
      {naVirada ? (
        <div style={{ position: "absolute", left: c.x, top: c.y, width: c.w, height: c.h, borderRadius: c.raio, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: -c.x, top: linha - 140 - c.y, width: 1080, height: 140, background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${corVirada}22 70%, ${corVirada}55 100%)`, mixBlendMode: "screen", opacity: 1 - pv * 0.3 }} />
          <div style={{ position: "absolute", left: -c.x, top: linha - 3 - c.y, width: 1080, height: 6, background: `linear-gradient(90deg, ${corVirada}00, ${corVirada} 18%, #fff 50%, ${corVirada} 82%, ${corVirada}00)`, boxShadow: `0 0 24px 6px ${corVirada}AA, 0 0 70px 14px ${corVirada}55` }} />
        </div>
      ) : null}
      {c.p > 0 ? (
        <>
          <div style={{ position: "absolute", left: c.x, top: c.y, width: c.w, height: c.h, borderRadius: c.raio, boxShadow: `inset 0 0 0 ${1.5 * c.p}px rgba(255,250,240,0.55)`, pointerEvents: "none" }} />
          <div style={{ position: "absolute", left: c.x - 1, top: c.y - 1, width: c.w + 2, height: c.h + 2, borderRadius: (c.raio ?? 0) + 1, border: `1px solid rgba(28,42,34,${0.22 * c.p})`, pointerEvents: "none" }} />
        </>
      ) : null}
    </>
  );
};
