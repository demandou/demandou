// Legenda de redes sociais: uma linha por vez, abaixo do queixo e acima da interface do app.
// A palavra falada ganha a faixa blush por trás (como uma amostra passada), as outras ficam creme.
import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, fonte, LEGENDA_Y, sombraTexto } from "../tema";

// `area`: faixa horizontal onde a legenda cabe (no layout "lado", só em cima da pessoa)
export const Legendas: React.FC<{ frases: Frase[]; area?: { x: number; w: number } }> = ({ frases, area }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const entra = prog(t, atual.de - 0.05, 0.2);
  const sai = saindo(t, atual.ate, 0.14);
  const falando = atual.palavras.reduce((k, p, i) => (t >= p.em - 0.03 ? i : k), -1);
  return (
    <div style={{ position: "absolute", left: area?.x ?? 0, width: area?.w ?? 1080, top: LEGENDA_Y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: (area?.w ?? 1080) - 120,
          fontFamily: fonte,
          fontWeight: 600,
          fontSize: (area?.w ?? 1080) < 900 ? 48 : 54,
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
