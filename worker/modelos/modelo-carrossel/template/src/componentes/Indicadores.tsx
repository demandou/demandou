import { mistura, prog } from "../anim";
import { CONTADOR, cor, fonte, PONTOS_ALTURA, PONTOS_Y } from "../tema";
import { misturarCor } from "./Desenhos";

// Pontinhos do carrossel, sempre visíveis: o ponto da página atual vira uma pílula coral
// que escorrega para o próximo ponto junto com o deslize.
export const Pontos: React.FC<{ total: number; cam: number }> = ({ total, cam }) => {
  const d = 15;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: PONTOS_Y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          height: PONTOS_ALTURA,
          padding: "0 20px",
          borderRadius: PONTOS_ALTURA / 2,
          background: "rgba(10,52,64,0.86)",
        }}
      >
        {Array.from({ length: total }, (_, i) => {
          const a = Math.max(0, 1 - Math.abs(i - cam));
          return (
            <div
              key={i}
              style={{
                width: mistura(d, 44, a),
                height: d,
                borderRadius: d / 2,
                background: misturarCor("rgba(244,236,225,0.42)", cor.coral, a),
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// Contador "3/7" no canto de cima, como o do Instagram: aparece quando a página chega e some
// depois de um instante.
export const Contador: React.FC<{ t: number; total: number; chegadas: number[] }> = ({ t, total, chegadas }) => {
  let atual = 0;
  chegadas.forEach((c, i) => {
    if (t >= c - 0.3) atual = i;
  });
  const c = chegadas[atual];
  const entra = atual === 0 ? 1 : prog(t, c - 0.3, 0.3);
  const sai = prog(t, (atual === 0 ? 1.6 : c + 1.5), 0.4);
  const o = Math.min(entra, 1 - sai);
  if (o <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        right: CONTADOR.direita,
        top: CONTADOR.topo,
        height: CONTADOR.altura,
        minWidth: 118,
        justifyContent: "center",
        padding: "0 24px",
        borderRadius: CONTADOR.altura / 2,
        background: "rgba(10,52,64,0.86)",
        display: "flex",
        alignItems: "center",
        fontFamily: fonte,
        fontWeight: 600,
        fontSize: 40,
        letterSpacing: "0.02em",
        color: cor.creme,
        opacity: o,
        translate: `0 ${(1 - entra) * -12}px`,
      }}
    >
      {atual + 1}/{total}
    </div>
  );
};
