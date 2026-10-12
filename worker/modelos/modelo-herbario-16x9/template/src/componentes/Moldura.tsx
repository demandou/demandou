import { Img, staticFile } from "remotion";
import type { Caixa } from "../motor/caixa";
import { cor, QUADRO, traco, versalete } from "../tema";

// Moldura oval de herbário em volta da pessoa: um passe-partout de papel mais escuro entre dois fios de pena.
// Some sozinha quando o oval se abre em tela cheia.
export const Moldura: React.FC<{ caixa: Caixa; oval: number }> = ({ caixa, oval }) => {
  if (oval <= 0.02) return null;
  const cx = caixa.x + caixa.w / 2;
  const cy = caixa.y + caixa.h / 2;
  const rx = caixa.w / 2;
  const ry = caixa.h / 2;
  const folga = 16;
  return (
    <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: Math.min(1, oval * 1.4) }}>
      {/* passe-partout */}
      <ellipse cx={cx} cy={cy} rx={rx + folga / 2 + 1} ry={ry + folga / 2 + 1} fill="none" stroke="#D9DCCD" strokeWidth={folga} />
      <ellipse cx={cx} cy={cy} rx={rx + 1} ry={ry + 1} fill="none" stroke={cor.tinta} strokeWidth={traco.forte} />
      <ellipse cx={cx} cy={cy} rx={rx + folga + 2} ry={ry + folga + 2} fill="none" stroke={cor.tinta} strokeWidth={traco.cabelo + 0.4} />
      {/* pregos de herbário: dois pontos no eixo (como a folha presa na prancha) */}
      <circle cx={cx} cy={cy - ry - folga / 2 - 1} r={5} fill={cor.tinta} />
      <circle cx={cx} cy={cy + ry + folga / 2 + 1} r={5} fill={cor.tinta} />
    </svg>
  );
};

// O papel da prancha: textura, filete duplo nas bordas e o cabeçalho corrido. A textura é a do vertical
// (1080×1920), cobrindo o quadro deitado.
export const Papel: React.FC<{ prancha: string; titulo: string }> = ({ prancha, titulo }) => (
  <>
    <Img src={staticFile("papel.jpg")} style={{ position: "absolute", left: 0, top: 0, width: QUADRO.w, height: QUADRO.h, objectFit: "cover" }} />
    <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0 }}>
      <rect x={26} y={26} width={QUADRO.w - 52} height={QUADRO.h - 52} fill="none" stroke={cor.tinta} strokeWidth={1.4} opacity={0.75} />
      <rect x={36} y={36} width={QUADRO.w - 72} height={QUADRO.h - 72} fill="none" stroke={cor.tinta} strokeWidth={3} opacity={0.8} />
    </svg>
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        top: 50,
        display: "flex",
        justifyContent: "space-between",
        fontFamily: versalete,
        fontWeight: 700,
        fontSize: 30,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: cor.musgo,
        opacity: 0.85,
      }}
    >
      <span>{titulo}</span>
      <span>{prancha}</span>
    </div>
  </>
);
