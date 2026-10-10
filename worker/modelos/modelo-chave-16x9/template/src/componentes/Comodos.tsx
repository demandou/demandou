// Miniaturas de cômodo (200×150). Antes de serem ditas são só o desenho a lápis; quando são ditas,
// a "foto" revela de cima para baixo (cores chapadas da paleta) e o traço escurece.
import type { Comodo } from "../plano";
import { cor } from "../tema";

type Forma = { d?: string; rect?: [number, number, number, number, number?]; circ?: [number, number, number]; ell?: [number, number, number, number]; fill?: string; linha?: boolean };

const P = {
  parede: "#E8E2D7",
  piso: cor.madeiraClara,
  vidro: "#C3D6D8",
  azulejo: "#E6E2DA",
  cimento: "#CFCAC2",
};

const r = (x: number, y: number, w: number, h: number, raio = 0): [number, number, number, number, number] => [x, y, w, h, raio];

const desenhos: Record<Comodo, Forma[]> = {
  sala: [
    { rect: r(0, 0, 200, 112), fill: P.parede, linha: false },
    { rect: r(0, 112, 200, 38), fill: P.piso },
    { ell: [78, 130, 70, 9], fill: cor.papelEscuro },
    { rect: r(128, 14, 56, 64, 2), fill: P.vidro },
    { d: "M156 14 V78 M128 46 H184", linha: true },
    { rect: r(38, 22, 54, 34, 2), fill: cor.verdeClaro },
    { rect: r(24, 64, 108, 30, 8), fill: cor.verde },
    { rect: r(20, 86, 116, 24, 6), fill: "#18594A" },
    { rect: r(12, 74, 18, 40, 6), fill: cor.verde },
    { rect: r(126, 74, 18, 40, 6), fill: cor.verde },
    { d: "M166 112 V60", linha: true },
    { d: "M152 60 H180 L172 42 H160 Z", fill: cor.latao },
  ],
  cozinha: [
    { rect: r(0, 0, 200, 104), fill: P.parede, linha: false },
    { rect: r(0, 104, 200, 46), fill: P.cimento },
    { rect: r(14, 14, 96, 36, 3), fill: cor.madeira },
    { d: "M46 14 V50 M78 14 V50", linha: true },
    { d: "M136 14 H176 L188 46 H124 Z", fill: "#9C978F" },
    { rect: r(8, 86, 184, 46, 3), fill: cor.papel },
    { rect: r(4, 78, 192, 9, 2), fill: cor.preto },
    { d: "M54 86 V132 M100 86 V132 M146 86 V132", linha: true },
    { ell: [142, 76, 14, 3], fill: "#3A3835" },
    { ell: [172, 76, 10, 3], fill: "#3A3835" },
    { d: "M62 78 V62 Q62 56 70 56 H76", linha: true },
  ],
  quarto: [
    { rect: r(0, 0, 200, 106), fill: "#E4DED4", linha: false },
    { rect: r(0, 106, 200, 44), fill: P.piso },
    { rect: r(76, 14, 48, 30, 2), fill: cor.verdeClaro },
    { rect: r(38, 50, 124, 42, 6), fill: cor.madeira },
    { rect: r(30, 84, 140, 28, 6), fill: cor.papel },
    { rect: r(30, 96, 140, 26, 5), fill: cor.verde },
    { rect: r(46, 74, 46, 16, 6), fill: cor.papel },
    { rect: r(108, 74, 46, 16, 6), fill: cor.papel },
    { rect: r(174, 92, 22, 26, 2), fill: cor.madeira },
    { d: "M178 92 L182 76 H190 L194 92 Z", fill: cor.latao },
  ],
  banheiro: [
    { rect: r(0, 0, 200, 150), fill: P.azulejo, linha: false },
    { d: "M0 38 H200 M0 76 H200 M0 114 H200 M50 0 V150 M100 0 V150", linha: true },
    { rect: r(118, 14, 70, 122, 3), fill: P.vidro },
    { d: "M132 30 L150 12 M140 62 L176 26", linha: true },
    { d: "M150 14 V24 M140 24 H160", linha: true },
    { rect: r(26, 16, 60, 48, 22), fill: "#D3E0E2" },
    { rect: r(16, 84, 84, 40, 3), fill: cor.madeira },
    { rect: r(26, 74, 64, 12, 5), fill: cor.papel },
    { d: "M58 74 V66 H66", linha: true },
  ],
  varanda: [
    { rect: r(0, 0, 200, 98), fill: "#D2DFE1", linha: false },
    { rect: r(0, 98, 200, 52), fill: P.piso },
    { d: "M0 70 H200 M14 70 V112 M34 70 V112 M54 70 V112 M74 70 V112 M94 70 V112 M114 70 V112", linha: true },
    { rect: r(146, 96, 34, 30, 3), fill: cor.madeira },
    { ell: [152, 80, 12, 20], fill: cor.verde },
    { ell: [170, 76, 12, 22], fill: "#18594A" },
    { ell: [162, 70, 10, 20], fill: cor.verde },
    { d: "M120 132 V100 H138 V132 M120 112 H138", linha: true },
  ],
  lavanderia: [
    { rect: r(0, 0, 200, 110), fill: P.parede, linha: false },
    { rect: r(0, 110, 200, 40), fill: P.cimento },
    { rect: r(28, 44, 76, 86, 6), fill: cor.papel },
    { circ: [66, 92, 24], fill: P.vidro },
    { d: "M28 60 H104", linha: true },
    { rect: r(118, 40, 72, 7, 2), fill: cor.madeira },
    { rect: r(128, 20, 14, 20, 3), fill: cor.verde },
    { rect: r(150, 24, 12, 16, 3), fill: cor.latao },
    { rect: r(124, 96, 56, 34, 4), fill: cor.madeiraClara },
  ],
  garagem: [
    { rect: r(0, 0, 200, 112), fill: P.cimento, linha: false },
    { d: "M0 22 H200 M0 44 H200 M0 66 H200 M0 88 H200", linha: true },
    { rect: r(0, 112, 200, 38), fill: "#B6B0A6" },
    { d: "M28 112 V96 Q30 84 44 82 L64 66 Q70 62 80 62 H124 Q134 62 142 70 L158 82 Q174 84 176 96 V112 Z", fill: cor.verde },
    { circ: [62, 114, 15], fill: cor.preto },
    { circ: [146, 114, 15], fill: cor.preto },
    { d: "M74 68 H104 V82 H62 Z M112 68 H126 L140 82 H112 Z", fill: P.vidro },
  ],
  escritorio: [
    { rect: r(0, 0, 200, 110), fill: P.parede, linha: false },
    { rect: r(0, 110, 200, 40), fill: P.piso },
    { rect: r(64, 30, 72, 44, 3), fill: cor.preto },
    { rect: r(70, 36, 60, 32, 2), fill: cor.verdeClaro },
    { d: "M100 74 V84 M88 84 H112", linha: true },
    { rect: r(24, 84, 152, 8, 2), fill: cor.madeira },
    { d: "M34 92 V130 M166 92 V130", linha: true },
    { d: "M150 84 L158 56 M150 56 H168", linha: true },
    { rect: r(36, 100, 30, 26, 6), fill: cor.verde },
  ],
};

const Forma: React.FC<{ f: Forma; foto: boolean; traco: string }> = ({ f, foto, traco }) => {
  const preencher = foto && f.fill && !f.linha ? f.fill : "none";
  const contorno = f.linha === false ? (foto ? "none" : "none") : traco;
  const comum = { fill: f.linha ? "none" : preencher, stroke: contorno, strokeWidth: foto ? 2.4 : 2.6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  if (f.rect) return <rect x={f.rect[0]} y={f.rect[1]} width={f.rect[2]} height={f.rect[3]} rx={f.rect[4] ?? 0} {...comum} />;
  if (f.circ) return <circle cx={f.circ[0]} cy={f.circ[1]} r={f.circ[2]} {...comum} />;
  if (f.ell) return <ellipse cx={f.ell[0]} cy={f.ell[1]} rx={f.ell[2]} ry={f.ell[3]} {...comum} />;
  return <path d={f.d} {...comum} />;
};

// `foto` de 0 a 1: quanto da foto já revelou (de cima para baixo)
export const Miniatura: React.FC<{ comodo: Comodo; largura: number; altura: number; foto: number; id: string }> = ({ comodo, largura, altura, foto, id }) => {
  const formas = desenhos[comodo] ?? desenhos.sala;
  return (
    <svg width={largura} height={altura} viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
      <defs>
        <clipPath id={`revela-${id}`}>
          <rect x={0} y={0} width={200} height={150 * foto} />
        </clipPath>
      </defs>
      {/* esboço a lápis */}
      <rect x={0} y={0} width={200} height={150} fill={cor.papel} />
      {formas.map((f, i) => (
        <Forma key={`l-${i}`} f={f} foto={false} traco={cor.lapis} />
      ))}
      {/* a foto, revelando */}
      {foto > 0.001 ? (
        <g clipPath={`url(#revela-${id})`}>
          {formas.map((f, i) => (
            <Forma key={`f-${i}`} f={f} foto traco="rgba(30,29,27,0.75)" />
          ))}
        </g>
      ) : null}
    </svg>
  );
};
