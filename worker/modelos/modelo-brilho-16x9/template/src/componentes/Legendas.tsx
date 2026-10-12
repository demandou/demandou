// Legenda do quadro deitado: uma frase por vez, no terço de baixo, terminando acima dos controles
// do player. A palavra falada ganha a faixa blush por trás (como uma amostra passada), as outras
// ficam creme. Na moldura (layout "lado") a legenda fica só em cima da pessoa e, se a frase não
// couber numa linha, cresce para cima (nunca desce para os controles do player).
import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, fonte, LEGENDA_BASE, MARGEM, QUADRO, sombraTexto } from "../tema";

// `area`: faixa horizontal onde a legenda cabe (no layout "lado", só em cima da pessoa)
export const Legendas: React.FC<{ frases: Frase[]; area?: { x: number; w: number } }> = ({ frases, area }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const entra = prog(t, atual.de - 0.05, 0.2);
  const sai = saindo(t, atual.ate, 0.14);
  const falando = atual.palavras.reduce((k, p, i) => (t >= p.em - 0.03 ? i : k), -1);
  const x = area?.x ?? MARGEM;
  const w = area?.w ?? QUADRO.w - 2 * MARGEM;
  const estreita = w < 1000;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        width: w,
        bottom: QUADRO.h - LEGENDA_BASE,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: estreita ? w - 80 : Math.min(w, 1500),
          fontFamily: fonte,
          fontWeight: 600,
          fontSize: estreita ? 46 : 54,
          lineHeight: 1.2,
          color: cor.creme,
          textShadow: sombraTexto,
          opacity: Math.min(entra, 1 - sai),
          translate: `0 ${(1 - entra) * 12}px`,
        }}
      >
        {atual.palavras.map((p, i) => {
          const ativa = i === falando;
          return (
            <span key={`${p.w}-${i}`} style={{ position: "relative", marginRight: i < atual.palavras.length - 1 ? "0.26em" : 0, padding: "0 0.1em" }}>
              {ativa ? (
                <span style={{ position: "absolute", left: 0, right: 0, top: "0.12em", bottom: "0.04em", background: cor.blush, borderRadius: "0.25em" }} />
              ) : null}
              <span style={{ position: "relative", color: ativa ? cor.tinta : undefined, textShadow: ativa ? "none" : undefined, opacity: i <= falando ? 1 : 0.72 }}>
                {p.w}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
