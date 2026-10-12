// Detalhe: um recorte aproximado do próprio vídeo num ponto da roupa (o relógio no pulso,
// um botão, a trama do tecido), como a foto de detalhe de um lookbook. Antes da palavra é um
// quadro tracejado a lápis; no `em` a foto abre do centro para fora.
import { prog } from "../anim";
import { VideoNaCaixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { rostoDo } from "../pessoa";
import { cor, QUADRO, rotulo } from "../tema";

export const Detalhe: React.FC<{
  plano: Plano;
  ponto: { x: number; y: number };
  em: number;
  t: number;
  x: number;
  y: number;
  w: number;
  h: number;
  zoom?: number;
  rotulo?: string;
  fora: number;
  // quando o quadro tracejado aparece
  de: number;
  redondo?: boolean;
}> = ({ plano, ponto, em, t, x, y, w, h, zoom = 3.2, rotulo: texto, fora, de, redondo }) => {
  const H0 = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
  const chega = prog(t, de + 0.22, 0.55);
  const abre = prog(t, em - 0.04, 0.6);
  // o VideoNaCaixa centraliza no "rosto": aqui o centro é o ponto da roupa. Levando o rastro do
  // rosto junto (o `...plano.rosto`), o ponto anda com a pessoa quando ela se mexe
  const centro = { ...rostoDo(plano), x: ponto.x, y: (ponto.y * H0) / QUADRO.h };
  const raio = redondo ? w / 2 : 0;
  const clip = redondo
    ? `circle(${(abre * 75).toFixed(1)}% at 50% 50%)`
    : `inset(${((1 - abre) * 50).toFixed(2)}% ${((1 - abre) * 50).toFixed(2)}% ${((1 - abre) * 50).toFixed(2)}% ${((1 - abre) * 50).toFixed(2)}%)`;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        opacity: chega * (1 - fora),
        translate: `0 ${(1 - chega) * 50 + fora * 30}px`,
      }}
    >
      {/* esboço a lápis */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: `3px dashed ${cor.lapis}`,
          borderRadius: raio,
          opacity: 1 - abre,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...rotulo,
          color: cor.lapis,
        }}
      >
        {texto ?? "detalhe"}
      </div>
      <div style={{ position: "absolute", inset: 0, clipPath: clip, borderRadius: raio, overflow: "hidden" }}>
        <VideoNaCaixa
          src={plano.video}
          caixa={{ x: 0, y: 0, w, h, zoom, ancoraY: 0.5, raio }}
          rosto={centro}
          videoAltura={H0}
          mudo
        />
      </div>
      {/* moldura de tinta */}
      <div style={{ position: "absolute", inset: 0, border: `3px solid ${cor.tinta}`, borderRadius: raio, opacity: abre }} />
    </div>
  );
};
