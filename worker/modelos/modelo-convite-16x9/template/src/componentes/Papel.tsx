import { AbsoluteFill } from "remotion";
import { cor } from "../tema";

// Grão de papel de algodão e trama de linho: texturas estáticas (iguais em todo quadro).
const grao = (frequencia: number, opacidade: number) =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='${frequencia}' numOctaves='2' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.23  0 0 0 0 0.17  0 0 0 0 0.13  0 0 0 ${opacidade} 0'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>`,
  )}")`;

export const GRAO_PAPEL = grao(0.85, 0.07);
const GRAO_LINHO = grao(0.55, 0.06);

// A mesa: linho azul-pó com trama fina e uma luz suave vinda do alto à esquerda.
export const Linho: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: cor.linho }}>
    <AbsoluteFill
      style={{
        backgroundImage: [
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0 1px, rgba(255,255,255,0) 1px 4px)",
          "repeating-linear-gradient(90deg, rgba(58,78,102,0.06) 0 1px, rgba(58,78,102,0) 1px 5px)",
          GRAO_LINHO,
        ].join(", "),
      }}
    />
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(120% 70% at 18% 8%, rgba(255,255,255,0.22), rgba(255,255,255,0) 60%), radial-gradient(90% 60% at 80% 100%, rgba(52,70,92,0.16), rgba(52,70,92,0) 70%)",
      }}
    />
  </AbsoluteFill>
);

// Uma folha de papel algodão com sombra sobre o linho. `filete` desenha a moldura dupla fina.
export const Folha: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  fundo?: string;
  filete?: number;
  sombra?: string;
  rotacao?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ x, y, w, h, fundo = cor.papel, filete = 0, sombra, rotacao = 0, style, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      backgroundColor: fundo,
      backgroundImage: GRAO_PAPEL,
      borderRadius: 4,
      boxShadow: sombra ?? "0 22px 46px rgba(40,56,76,0.24), 0 3px 8px rgba(40,56,76,0.16)",
      rotate: rotacao ? `${rotacao}deg` : undefined,
      ...style,
    }}
  >
    {filete > 0 ? (
      <>
        <div style={{ position: "absolute", inset: filete, border: `2px solid ${cor.tinta}`, opacity: 0.55, borderRadius: 2 }} />
        <div style={{ position: "absolute", inset: filete + 9, border: `1px solid ${cor.tinta}`, opacity: 0.32, borderRadius: 1 }} />
      </>
    ) : null}
    {children}
  </div>
);
