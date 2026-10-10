import { limitar, prog } from "../anim";
import type { Veredito as VereditoT } from "../plano";
import { ajustarTitulo, cor, linhasDoTexto, sans } from "../tema";
import { pSelo, Selo } from "./Selo";

// Linha de conclusão: selo ✓/✗ e uma frase curta, centralizados. A frase se revela da esquerda para a direita.
export const Veredito: React.FC<{ v: VereditoT; t: number; saida: number; x: number; y: number; w: number }> = ({ v, t, saida, x, y, w }) => {
  const p = pSelo(t, v.em);
  if (p <= 0) return null;
  // uma linha; se não cabe nem em 46 px, até duas linhas menores
  const duas = linhasDoTexto(v.texto, w - 150, 46) > 1;
  const tamanho = duas ? ajustarTitulo(v.texto, w - 150, 2, 44, 36) : ajustarTitulo(v.texto, w - 150, 1, 62, 46);
  const revela = prog(t, v.em + 0.12, 0.35);
  const errado = v.tipo === "errado";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: 96,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        opacity: 1 - saida,
      }}
    >
      <svg width={92} height={92} style={{ overflow: "visible", flexShrink: 0 }}>
        <Selo cx={46} cy={46} r={44} tipo={v.tipo} p={p} />
      </svg>
      <div
        style={{
          fontFamily: sans,
          fontWeight: 700,
          fontSize: tamanho,
          letterSpacing: "-0.01em",
          color: errado ? cor.vermelho : cor.azul,
          clipPath: `inset(-10% ${(1 - limitar(revela)) * 100}% -10% 0)`,
          whiteSpace: duas ? "normal" : "nowrap",
          lineHeight: 1.05,
          maxWidth: w - 150,
        }}
      >
        {v.texto}
      </div>
    </div>
  );
};
