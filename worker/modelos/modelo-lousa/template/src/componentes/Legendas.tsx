import { prog, useTempo } from "../anim";
import { larguraSans } from "../giz/medir";
import type { Frase } from "../motor/frases";
import { H, LEGENDA_BASE, LEGENDA_CORPO, sans } from "../tema";

const LARGURA_TEXTO = 940;
const ESPACO = 0.28;

// Legenda numa tarja escura da cor da lousa, numa linha só, com a base sempre na mesma altura
// (logo acima da interface do app). Corpo 60; uma frase longa encolhe até 50 para não quebrar.
// Cada palavra acende quando é falada.
export const Legendas: React.FC<{ frases: Frase[] }> = ({ frases }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const texto = atual.palavras.map((p) => p.w).join(" ");
  const largura100 = larguraSans(texto, 100) + (ESPACO - 0.25) * 100 * Math.max(0, atual.palavras.length - 1);
  const corpo = Math.max(50, Math.min(LEGENDA_CORPO, (LARGURA_TEXTO / Math.max(1, largura100)) * 100));
  const entra = prog(t, atual.de - 0.05, 0.16);
  const sai = prog(t, atual.ate - 0.12, 0.12);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: H - LEGENDA_BASE, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: `0 ${ESPACO}em`,
          whiteSpace: "nowrap",
          padding: "12px 34px 15px",
          borderRadius: 18,
          background: "rgba(14,21,17,0.86)",
          fontFamily: sans,
          fontWeight: 500,
          fontSize: corpo,
          lineHeight: 1.15,
          color: "#EEEDE6",
          opacity: Math.min(entra, 1 - sai),
          translate: `0 ${(1 - entra) * 8}px`,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ opacity: 0.38 + 0.62 * prog(t, p.em - 0.04, 0.12) }}>
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
