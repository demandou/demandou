// Legenda: uma linha numa faixa escura de palco, abaixo da arte; cada palavra acende quando é falada.
// No quadro deitado ela fica no terço de baixo, entre as margens do YouTube, acima dos controles do player.
import { prog, saindo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, fonte, MARGEM } from "../tema";

export const Legendas: React.FC<{ frases: Frase[]; t: number; y: number; bloqueios?: { de: number; ate: number }[] }> = ({
  frases,
  t,
  y,
  bloqueios = [],
}) => {
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  // enquanto os diagramas viajam pela tela, a legenda espera (e entra logo depois)
  const bloqueio = bloqueios.find((b) => t >= b.de && t < b.ate + 0.2);
  if (bloqueio && t < bloqueio.ate) return null;
  const entra = Math.min(prog(t, atual.de - 0.08, 0.14), bloqueio ? prog(t, bloqueio.ate, 0.2) : 1);
  return (
    <div style={{ position: "absolute", left: MARGEM, right: MARGEM, top: y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 14px",
          padding: "10px 26px 14px",
          borderRadius: 20,
          background: "rgba(20,17,15,0.84)",
          fontFamily: fonte,
          fontWeight: 600,
          fontSize: 46,
          lineHeight: 1.2,
          color: cor.marfim,
          opacity: entra * (1 - saindo(t, atual.ate, 0.1)),
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ opacity: 0.38 + 0.62 * prog(t, p.em - 0.04, 0.16) }}>
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
