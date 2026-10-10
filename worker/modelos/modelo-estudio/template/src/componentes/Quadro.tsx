// O quadro de estúdio por cima do vídeo da pessoa: o filete da borda e a etiqueta da câmera
// ("● CAM 3 · CLOSE") no canto de cima, que troca seco a cada corte de câmera.
import { prog } from "../anim";
import { CAMERAS } from "../layout";
import type { Caixa } from "../motor/caixa";
import type { Enquadramento } from "../plano";
import { cor, rotulo } from "../tema";

export const Quadro: React.FC<{ caixa: Caixa; camera: Enquadramento; trocouEm: number; t: number; etiqueta: number }> = ({
  caixa,
  camera,
  trocouEm,
  t,
  etiqueta,
}) => {
  const c = CAMERAS[camera];
  // a luz de "no ar" pisca forte no instante da troca e assenta
  const pisca = 1 - prog(t, trocouEm, 0.35);
  const curta = caixa.w < 600;
  return (
    <div
      style={{
        position: "absolute",
        left: caixa.x,
        top: caixa.y,
        width: caixa.w,
        height: caixa.h,
        borderRadius: caixa.raio ?? 0,
        boxShadow: `inset 0 0 0 2px ${cor.borda}`,
        pointerEvents: "none",
      }}
    >
      {etiqueta > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: 22,
            top: 22,
            height: 54,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 18px 0 16px",
            borderRadius: 12,
            background: "rgba(12,11,14,0.74)",
            opacity: etiqueta,
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: 7, background: cor.acento, scale: String(1 + 0.45 * pisca) }} />
          <span style={{ ...rotulo, fontSize: 32, color: cor.texto }}>CAM {c.numero}</span>
          {curta ? null : <span style={{ ...rotulo, fontSize: 32, color: cor.textoSuave }}>· {c.nome}</span>}
        </div>
      ) : null}
    </div>
  );
};
