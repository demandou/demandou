// A faixa-rótulo (a `abertura`): uma faixa verde sólida, texto branco em negrito, duas linhas,
// centrada na emenda do split. No quadro deitado a emenda é a linha vertical entre o quadro do
// insert e a moldura da pessoa (x 1180): a faixa fica centrada nela, no terço de baixo, entre o
// queixo e a legenda (ou acima da cabeça, se ali não couber), nunca sobre o rosto. Só aparece no
// gancho (em corte seco, sem animação de entrada) e some no corte seguinte. Só existe no layout split.
import type { Plano } from "../plano";
import { layoutNoTempo } from "../camera";
import { larguraTexto } from "../medida";
import { COR, FONTE, LARGURA, ROTULO, topoDoRotulo } from "../tema";

// a faixa medida num corpo: as linhas, a largura e a altura
const medirFaixa = (linhas: string[], tamanho: number) => {
  const texto = Math.max(...linhas.map((l) => larguraTexto(l, tamanho, { peso: 800 })));
  const largura = Math.min(ROTULO.larguraMax, Math.round(texto + 72));
  const lh = Math.round(tamanho * 1.12);
  return { tamanho, largura, lh, altura: linhas.length * lh + 40 };
};

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
  const maxL = ROTULO.larguraMax;
  // o corpo do vertical (até 58 px), que encolhe até a linha caber na faixa
  let tamanho = Math.min(58, Math.floor((maxL - 72) / (Math.max(...linhas.map((l) => l.length)) * 0.66)));
  while (tamanho > 30 && Math.max(...linhas.map((l) => larguraTexto(l, tamanho, { peso: 800 }))) + 72 > maxL) tamanho -= 2;
  // a altura: o maior corpo em que a faixa cabe ao lado do rosto (no terço de baixo ou acima da cabeça)
  let fit = medirFaixa(linhas, tamanho);
  let topo = topoDoRotulo(plano, fit.altura);
  while (topo === null && fit.tamanho > 40) {
    fit = medirFaixa(linhas, fit.tamanho - 2);
    topo = topoDoRotulo(plano, fit.altura);
  }
  // sem lugar livre nem no menor corpo: fica no terço de baixo, colada acima da legenda
  const y = topo ?? Math.round(ROTULO.yReserva - fit.altura);
  const x = Math.max(24, Math.min(LARGURA - 24 - fit.largura, ROTULO.x - fit.largura / 2));
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: fit.largura,
        height: fit.altura,
        borderRadius: 14,
        background: COR.rotulo,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: fit.tamanho, lineHeight: `${fit.lh}px`, color: COR.branco, textAlign: "center", letterSpacing: "-0.005em" }}>
        {linhas.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};
