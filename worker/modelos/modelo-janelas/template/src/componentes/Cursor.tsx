// O mouse: seta genérica (preta com contorno branco) que arrasta, clica e, no recorte, vira mira.
// Clique = um anel violeta que se abre e some.
import { limitar, mistura, prog } from "../anim";
import { chaveNoTempo, type Mouse, posicaoDoMouse } from "../cena";
import { cor, mono } from "../tema";

const SETA = "M0 0 L0 33 L8.6 25.4 L14 37.6 L19.6 35.2 L14.4 23.4 L25.6 23.4 Z";

export const Cursor: React.FC<{ t: number; mouse: Mouse }> = ({ t, mouse }) => {
  const vis = chaveNoTempo(t, mouse.visivel, 0.2);
  const mira = chaveNoTempo(t, mouse.mira, 0.12);
  const p = posicaoDoMouse(t, mouse.quadros);
  const segurando = mouse.segura.some((s) => t >= s.de && t <= s.ate);
  const apertando = mouse.cliques.some((c) => t >= c.t - 0.03 && t <= c.t + 0.09);
  const escala = (apertando ? 0.86 : segurando ? 0.92 : 1) * 1.9;

  return (
    <>
      {mouse.cliques.map((c, i) => {
        const a = prog(t, c.t, 0.42);
        if (t < c.t || a >= 0.999) return null;
        const r = mistura(10, 52, a);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x - r,
              top: c.y - r,
              width: 2 * r,
              height: 2 * r,
              borderRadius: "50%",
              border: `5px solid ${cor.violeta}`,
              opacity: (1 - a) * 0.8 * Math.max(vis, 0.6),
            }}
          />
        );
      })}
      {vis > 0.01 ? (
        <>
          {/* seta */}
          <svg
            width={60}
            height={80}
            viewBox="-3 -3 32 44"
            style={{
              position: "absolute",
              left: p.x - 3 * escala,
              top: p.y - 3 * escala,
              width: 32 * escala,
              height: 44 * escala,
              opacity: vis * (1 - mira),
              overflow: "visible",
              filter: "drop-shadow(0 4px 6px rgba(20,14,40,0.35))",
            }}
          >
            <path d={SETA} fill={cor.tinta} stroke="#FFFFFF" strokeWidth={2.4} strokeLinejoin="round" />
          </svg>
          {/* mira do recorte, com a posição em px */}
          {mira > 0.01 ? (
            <div style={{ position: "absolute", left: p.x, top: p.y, opacity: vis * mira }}>
              {[
                { l: -46, t: -2.5, w: 32, h: 5 },
                { l: 14, t: -2.5, w: 32, h: 5 },
                { l: -2.5, t: -46, w: 5, h: 32 },
                { l: -2.5, t: 14, w: 5, h: 32 },
              ].map((b, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: b.l,
                    top: b.t,
                    width: b.w,
                    height: b.h,
                    background: "#FFFFFF",
                    boxShadow: "0 0 0 1.5px rgba(23,20,31,0.8)",
                  }}
                />
              ))}
              <div
                style={{
                  position: "absolute",
                  // perto da borda, a medida vai para o outro lado da mira (nunca sai do quadro)
                  left: p.x > 1080 - 270 ? undefined : 30,
                  right: p.x > 1080 - 270 ? 30 : undefined,
                  top: p.y > 1500 ? -76 : 30,
                  fontFamily: mono,
                  fontWeight: 700,
                  fontSize: 32,
                  color: "#FFFFFF",
                  background: "rgba(23,20,31,0.82)",
                  padding: "4px 12px",
                  borderRadius: 10,
                  whiteSpace: "nowrap",
                  opacity: limitar(mira * 2 - 1),
                }}
              >
                {Math.round(p.x)} · {Math.round(p.y)}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
};
