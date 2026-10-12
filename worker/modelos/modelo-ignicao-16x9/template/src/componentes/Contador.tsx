// O contador do computador de bordo, entre os mostradores: um rótulo em caixa-alta espaçada e o
// número que rola para cima a cada item que acende ("2 / 3"). Usado nas luzes, nas listas e nos passos.
import { prog } from "../anim";
import { diagramar } from "../medidas";
import { cor, rotulo as estiloRotulo, texto } from "../tema";

export const Contador: React.FC<{
  rotulo: string;
  // o instante de cada item (o número vira quando o item acende)
  tempos: number[];
  t: number;
  // topo do bloco e o corpo do número (104 entre os mostradores compactos do modo retrovisor)
  topo?: number;
  tamanho?: number;
}> = ({ rotulo, tempos, t, topo = 1330, tamanho = 104 }) => {
  const total = tempos.length;
  const acesas = tempos.filter((x) => t >= x - 0.05).length;
  const r = diagramar(rotulo, { largura: 400, maximo: 32, minimo: 30, linhas: 2, peso: 600, espacamento: 0.14 });
  const barra = tamanho * 0.54;
  return (
    <div style={{ position: "absolute", left: 330, width: 420, top: topo, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {r.linhas.map((l, i) => (
        <div key={`${l}-${i}`} style={estiloRotulo(r.tam, { marginTop: i ? 6 : 0, whiteSpace: "nowrap" })}>
          {l}
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "baseline", marginTop: tamanho >= 90 ? 14 : 8 }}>
        {/* o número rola para cima a cada item que acende */}
        <span style={{ position: "relative", display: "inline-block", height: tamanho, overflow: "hidden", ...texto(700, tamanho, { lineHeight: 1, fontVariantNumeric: "tabular-nums" }) }}>
          <span style={{ display: "block", visibility: "hidden" }}>{total}</span>
          {[acesas - 1, acesas].map((n, k) => {
            const virou = acesas > 0 ? prog(t, tempos[acesas - 1] - 0.05, 0.3) : 1;
            const y = k === 0 ? -virou * tamanho : (1 - virou) * tamanho;
            return n < 0 ? null : (
              <span key={n} style={{ position: "absolute", left: 0, right: 0, top: 0, textAlign: "center", translate: `0 ${y}px`, color: n > 0 ? cor.marfim : cor.apagado }}>
                {n}
              </span>
            );
          })}
        </span>
        <span style={texto(600, barra, { lineHeight: 1, color: cor.aco, marginLeft: 12 })}>{`/ ${total}`}</span>
      </div>
    </div>
  );
};
