// A faixa-rótulo (a `abertura`): uma faixa verde sólida, texto branco em negrito, duas linhas,
// colada na emenda do split e centrada. Só aparece no gancho (em corte seco, sem animação de
// entrada) e some no corte seguinte. Só existe no layout split.
import type { Plano } from "../plano";
import { layoutNoTempo } from "../camera";
import { larguraTexto } from "../medida";
import { COR, FONTE, LARGURA, ROTULO } from "../tema";

export const Rotulo: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const m = plano.momentos.find((x) => x.tipo === "abertura" && t >= x.de && t < x.ate);
  if (!m || m.tipo !== "abertura") return null;
  if (layoutNoTempo(plano, t) !== "split") return null;
  // sempre 2 linhas, equilibradas pelas palavras (como no Reel)
  const ws = m.texto.toUpperCase().split(/\s+/);
  let melhor = 1;
  let dif = 1e9;
  for (let k = 1; k < ws.length; k++) {
    const d = Math.abs(ws.slice(0, k).join(" ").length - ws.slice(k).join(" ").length);
    if (d < dif) [dif, melhor] = [d, k];
  }
  const linhas = ws.length > 1 ? [ws.slice(0, melhor).join(" "), ws.slice(melhor).join(" ")] : [ws[0]];
  const maxL = Math.round(LARGURA * 0.7);
  const tamanho = Math.min(58, Math.floor((maxL - 72) / (Math.max(...linhas.map((l) => l.length)) * 0.66)));
  const fit = { linhas, tamanho };
  const texto = Math.max(...fit.linhas.map((l) => larguraTexto(l, fit.tamanho, { peso: 800 })));
  const largura = Math.min(maxL, Math.round(texto + 72));
  const lh = Math.round(fit.tamanho * 1.12);
  const altura = fit.linhas.length * lh + 40;
  return (
    <div
      style={{
        position: "absolute",
        left: (LARGURA - largura) / 2,
        top: ROTULO.y - altura / 2,
        width: largura,
        height: altura,
        borderRadius: 14,
        background: COR.rotulo,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: fit.tamanho, lineHeight: `${lh}px`, color: COR.branco, textAlign: "center", letterSpacing: "-0.005em" }}>
        {fit.linhas.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};
