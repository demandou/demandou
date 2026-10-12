import { prog, useTempo } from "../anim";
import { largura } from "../medir";
import type { Frase } from "../motor/frases";
import { cor, H, LEGENDA_BASE, LEGENDA_CORPO, sans } from "../tema";

// no quadro deitado a frase da legenda é mais longa (até ~42 caracteres numa linha)
const LARGURA_TEXTO = 1500;
const ESPACO = 0.3;

// Legenda numa tira de papel presa no caderno, numa linha só, com a base sempre na mesma altura
// (na área segura de baixo, logo acima dos controles do player). Corpo 54; frase longa encolhe até 46 para não quebrar.
// Cada palavra é passada a tinta quando é falada.
export const Legendas: React.FC<{ frases: Frase[]; opacidade?: number }> = ({ frases, opacidade = 1 }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual || opacidade <= 0.01) return null;
  const texto = atual.palavras.map((p) => p.w).join(" ");
  const w100 = largura(texto, 100, "sans", 600) + (ESPACO - 0.25) * 100 * Math.max(0, atual.palavras.length - 1);
  const corpo = Math.max(46, Math.min(LEGENDA_CORPO, (LARGURA_TEXTO / Math.max(1, w100)) * 100));
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
          padding: "12px 30px 16px",
          borderRadius: 6,
          background: cor.papelClaro,
          boxShadow: "0 6px 16px rgba(29,41,53,0.16), 0 1px 3px rgba(29,41,53,0.16)",
          fontFamily: sans,
          fontWeight: 600,
          fontSize: corpo,
          lineHeight: 1.15,
          color: cor.tinta,
          opacity: Math.min(entra, 1 - sai) * opacidade,
          translate: `0 ${(1 - entra) * 8}px`,
          rotate: "-0.6deg",
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ opacity: 0.32 + 0.68 * prog(t, p.em - 0.04, 0.12) }}>
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
