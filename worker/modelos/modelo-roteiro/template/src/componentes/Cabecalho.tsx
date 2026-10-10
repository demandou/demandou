// Título do bloco nas telas de mapa sem barra do dia: uma cartela de papel no alto, com o título
// em azulejo (a mesma ideia da barra do dia: dizer onde estamos na viagem).
import { limitar, misturarCor, prog } from "../anim";
import { encaixar } from "../medida";
import { CABECALHO, cor, display, sombraPapel } from "../tema";

export const Cabecalho: React.FC<{ texto: string; t: number; de: number; ate: number }> = ({ texto, t, de, ate }) => {
  const entrada = prog(t, de + 0.4, 0.5);
  const saida = prog(t, ate - 0.3, 0.3, (x) => x * x);
  if (entrada <= 0 || saida >= 1) return null;
  const pad = 36;
  const e = encaixar(texto, { largura: CABECALHO.w - 2 * pad, max: 78, min: 40, linhas: 2, fonte: { italico: true, peso: 600 } });
  const h = Math.min(CABECALHO.h, e.linhas.length * e.tamanho * 1.05 + 2 * 30);
  return (
    <div
      style={{
        position: "absolute",
        left: CABECALHO.x,
        top: CABECALHO.y + (CABECALHO.h - h) / 2,
        width: CABECALHO.w,
        height: h,
        borderRadius: 18,
        background: cor.papel,
        boxShadow: sombraPapel(0.9),
        opacity: limitar(entrada * 1.6) * (1 - saida),
        translate: `0 ${(1 - entrada) * -50 - saida * 40}px`,
        rotate: "-0.5deg",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: `0 ${pad}px`,
      }}
    >
      <div style={{ position: "absolute", inset: 8, borderRadius: 12, border: `2px solid ${cor.azulejo}`, opacity: 0.22 }} />
      {e.linhas.map((l, i) => (
        <div key={i} style={{ fontFamily: display, fontStyle: "italic", fontWeight: 600, fontSize: e.tamanho, lineHeight: 1.05, color: misturarCor(cor.lapis, cor.azulejo, entrada), whiteSpace: "nowrap" }}>
          {l}
        </div>
      ))}
    </div>
  );
};
