// O interior ilustrado da loja, atrás das letras da `abertura` com `cena` (o gancho do quadro 0):
// parede de azulejos, uma prateleira com ilustrações, um expositor (prato com pé e cúpula de vidro)
// com a peça principal e uma plaquinha pendurada num prego. Tudo em vetor, na paleta da fachada.
// Sempre vivo: a plaquinha balança, um brilho passa na cúpula, o vapor sobe da xícara.
import type { NomeIlustracao } from "../plano";
import { cor, fonte, VIDRO } from "../tema";
import { Ilustracao } from "./Ilustracoes";
import { caber } from "./Pecas";

export type Cena = { expositor?: NomeIlustracao; itens?: NomeIlustracao[]; placa?: string };

const PRAT = { x: VIDRO.x + 36, y: 612, w: 500 };
const EXP = { cx: VIDRO.x + VIDRO.w - 205, base: VIDRO.y + VIDRO.h - 22 };

export const Interior: React.FC<{ t: number; cena: Cena }> = ({ t, cena }) => {
  const itens = (cena.itens ?? []).slice(0, 4);
  const lado = 122;
  const vao = itens.length ? (PRAT.w - itens.length * lado) / (itens.length + 1) : 0;
  const giro = Math.sin(t * 2.1) * 5 + Math.sin(t * 0.9) * 2;
  const brilho = ((t % 3.2) / 3.2) * 2 - 0.5;
  const placa = cena.placa?.trim();
  const fP = placa ? caber(placa.toLocaleUpperCase("pt-BR"), 190, 36, 22, 1, 800) : null;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* azulejos da parede, bem claros */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 20 }, (_, r) => {
          const y = VIDRO.y + 230 + r * 34;
          if (y > VIDRO.y + VIDRO.h) return null;
          return (
            <g key={r}>
              <line x1={VIDRO.x} y1={y} x2={VIDRO.x + VIDRO.w} y2={y} stroke="rgba(122,74,38,0.09)" strokeWidth={2} />
              {Array.from({ length: 14 }, (_, c) => {
                const x = VIDRO.x + c * 72 + (r % 2 ? 36 : 0);
                return <line key={c} x1={x} y1={y} x2={x} y2={y + 34} stroke="rgba(122,74,38,0.07)" strokeWidth={2} />;
              })}
            </g>
          );
        })}
      </svg>
      {/* a prateleira com as ilustrações */}
      {itens.length ? (
        <>
          {itens.map((n, i) => (
            <div key={i} style={{ position: "absolute", left: PRAT.x + vao + i * (lado + vao), top: PRAT.y - lado + 4, width: lado, height: lado }}>
              <Ilustracao nome={n} tamanho={lado} />
              {n === "cafe" ? (
                <svg width={lado} height={60} style={{ position: "absolute", left: 0, top: -36, overflow: "visible" }}>
                  {[0, 1].map((k) => {
                    const f = ((t * 0.6 + k * 0.5) % 1);
                    return (
                      <path
                        key={k}
                        d={`M ${lado * (0.36 + k * 0.16)} ${44 - f * 30} q -8 -10 0 -20 q 8 -10 0 -20`}
                        fill="none"
                        stroke={cor.tintaSuave}
                        strokeWidth={3}
                        strokeLinecap="round"
                        opacity={0.5 * Math.sin(f * Math.PI)}
                      />
                    );
                  })}
                </svg>
              ) : null}
            </div>
          ))}
          <div style={{ position: "absolute", left: PRAT.x, top: PRAT.y, width: PRAT.w, height: 14, borderRadius: 4, background: cor.madeiraClara }} />
          <div style={{ position: "absolute", left: PRAT.x, top: PRAT.y + 14, width: PRAT.w, height: 12, borderRadius: "0 0 5px 5px", background: cor.madeira, boxShadow: "0 8px 10px rgba(59,36,22,0.16)" }} />
          {[0.12, 0.88].map((f) => (
            <div key={f} style={{ position: "absolute", left: PRAT.x + PRAT.w * f - 6, top: PRAT.y + 26, width: 12, height: 26, borderRadius: "0 0 6px 6px", background: cor.madeiraEscura }} />
          ))}
        </>
      ) : null}
      {/* a plaquinha pendurada no prego, balançando */}
      {fP ? (
        <div style={{ position: "absolute", left: PRAT.x + PRAT.w / 2 - 125, top: PRAT.y + 66, width: 250, height: 150, transformOrigin: "125px 0px", transform: `rotate(${giro}deg) scale(1.15)` }}>
          <svg width={250} height={46} style={{ position: "absolute", left: 0, top: 0 }}>
            <path d="M 125 4 L 40 44 M 125 4 L 210 44" stroke={cor.tinta} strokeWidth={3.5} strokeLinecap="round" />
            <circle cx={125} cy={5} r={7} fill={cor.madeiraEscura} />
          </svg>
          <div style={{ position: "absolute", left: 10, top: 40, width: 230, height: 92, borderRadius: 16, background: cor.tinta, boxShadow: "0 10px 18px rgba(59,36,22,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 8, borderRadius: 10, border: "2px solid rgba(255,242,222,0.5)" }} />
            <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: fP.tamanho, letterSpacing: "0.12em", color: cor.adesivo, whiteSpace: "nowrap" }}>{fP.linhas[0]}</span>
          </div>
        </div>
      ) : null}
      {/* o expositor: prato com pé, a peça principal e a cúpula de vidro com um brilho que passa */}
      {cena.expositor ? (
        <div style={{ position: "absolute", left: EXP.cx - 150, top: EXP.base - 330, width: 300, height: 330, transformOrigin: "50% 100%", transform: "scale(1.2)" }}>
          <div style={{ position: "absolute", left: 30, top: 70, width: 240, height: 186, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <Ilustracao nome={cena.expositor} tamanho={196} />
          </div>
          <div style={{ position: "absolute", left: 20, top: 248, width: 260, height: 18, borderRadius: 9, background: cor.papel, border: `3px solid ${cor.tinta}`, boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: 136, top: 264, width: 28, height: 46, background: cor.papel, border: `3px solid ${cor.tinta}`, borderTop: "none", boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: 90, top: 306, width: 120, height: 18, borderRadius: 9, background: cor.papel, border: `3px solid ${cor.tinta}`, boxSizing: "border-box" }} />
          {/* a cúpula */}
          <div style={{ position: "absolute", left: 22, top: 20, width: 256, height: 236, borderRadius: "128px 128px 10px 10px", border: "4px solid rgba(122,90,69,0.45)", background: "rgba(255,255,255,0.22)", boxSizing: "border-box", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: `${brilho * 100}%`, top: -40, width: 34, height: 320, background: "rgba(255,255,255,0.5)", transform: "rotate(22deg)" }} />
          </div>
          <div style={{ position: "absolute", left: 136, top: 4, width: 28, height: 22, borderRadius: "14px 14px 4px 4px", background: cor.madeiraClara, border: `3px solid ${cor.tinta}`, boxSizing: "border-box" }} />
        </div>
      ) : null}
    </div>
  );
};
