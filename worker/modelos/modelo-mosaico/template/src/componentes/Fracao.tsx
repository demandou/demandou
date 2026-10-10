import { prog } from "../anim";
import { larguraTexto } from "../medida";
import { display } from "../tema";
import { F_NUMERO } from "./comum";

// Fração tipográfica (numerador em cima, barra inclinada, denominador embaixo), que se monta:
// o numerador cai no lugar, a barra se desenha, o denominador sobe. Texto sem "/" vira número simples.
// `altura` = altura total da fração em px.
export const Fracao: React.FC<{ texto: string; altura: number; cor: string; t: number; de: number; largura?: number }> = ({ texto, altura, cor, t, de, largura }) => {
  const partes = texto.split("/");
  if (partes.length !== 2) {
    const p = prog(t, de, 0.5);
    // número curto ("3x", "80%"): o maior corpo que cabe na largura reservada
    const corpo = Math.min(altura * 0.95, largura ? largura / Math.max(larguraTexto(texto, 1, F_NUMERO), 0.01) : Infinity);
    return (
      <div
        style={{
          fontFamily: display,
          fontWeight: 800,
          fontSize: corpo,
          lineHeight: 0.9,
          letterSpacing: "-0.04em",
          color: cor,
          opacity: p,
          translate: `0 ${(1 - p) * 30}px`,
          whiteSpace: "nowrap",
        }}
      >
        {texto}
      </div>
    );
  }
  const [num, den] = partes;
  const s = altura * 0.66; // corpo dos algarismos
  const larg = altura * 0.98;
  const pNum = prog(t, de, 0.5);
  const pBarra = prog(t, de + 0.12, 0.45);
  const pDen = prog(t, de + 0.22, 0.5);
  const digito: React.CSSProperties = {
    position: "absolute",
    fontFamily: display,
    fontWeight: 800,
    fontSize: s,
    lineHeight: 1,
    letterSpacing: "-0.04em",
    color: cor,
  };
  const x1 = larg * 0.24;
  const y1 = altura * 0.97;
  const x2 = larg * 0.78;
  const y2 = altura * 0.05;
  return (
    <div style={{ position: "relative", width: larg, height: altura }}>
      <div style={{ ...digito, left: 0, top: -s * 0.06, opacity: pNum, translate: `0 ${(1 - pNum) * -26}px` }}>{num}</div>
      <svg width={larg} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <line
          x1={x1}
          y1={y1}
          x2={x1 + (x2 - x1) * pBarra}
          y2={y1 + (y2 - y1) * pBarra}
          stroke={cor}
          strokeWidth={Math.max(4, altura * 0.055)}
          strokeLinecap="round"
          opacity={pBarra > 0.01 ? 1 : 0}
        />
      </svg>
      <div style={{ ...digito, right: 0, bottom: -s * 0.16, opacity: pDen, translate: `0 ${(1 - pDen) * 26}px` }}>{den}</div>
    </div>
  );
};
