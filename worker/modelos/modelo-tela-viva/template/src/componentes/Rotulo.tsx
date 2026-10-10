// O rótulo branco da junção (a `abertura`): caixa de cantos arredondados, ~58% da largura, texto
// preto em negrito. Está pronto desde o primeiro quadro e some em corte seco (nada de entrada).
import type { Plano } from "../plano";
import { encaixar, larguraTexto } from "../medida";
import { COR, FONTE, LARGURA, ROTULO } from "../tema";

export const Rotulo: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const m = plano.momentos.find((x) => x.tipo === "abertura" && t >= x.de && t < x.ate);
  if (!m || m.tipo !== "abertura") return null;
  // largura base de 58%; cresce até 80% quando o texto é longo; passa de 2 linhas só em último caso
  const base = Math.round(LARGURA * ROTULO.wFrac);
  const maxL = Math.round(LARGURA * 0.8);
  const uma = encaixar(m.texto, { largura: maxL - 80, max: 56, min: 38, linhas: 1, fonte: { peso: 800 } });
  const fit = uma.linhas.length === 1 ? uma : encaixar(m.texto, { largura: maxL - 80, max: 40, min: 30, linhas: 2, fonte: { peso: 800 } });
  const texto = Math.max(...fit.linhas.map((l) => larguraTexto(l, fit.tamanho, { peso: 800 })));
  const largura = Math.min(maxL, Math.max(base, Math.round(texto + 96)));
  const lh = Math.round(fit.tamanho * 1.12);
  return (
    <div
      style={{
        position: "absolute",
        left: (LARGURA - largura) / 2,
        top: ROTULO.y,
        width: largura,
        height: ROTULO.h,
        borderRadius: 26,
        background: COR.claro,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 22px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: fit.tamanho, lineHeight: `${lh}px`, color: COR.tinta, textAlign: "center", letterSpacing: "-0.01em" }}>
        {fit.linhas.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};
