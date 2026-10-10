// A etiqueta de chave: o "papel" de todo texto do modelo. Vertical (pendurada num gancho, furo em
// cima) ou deitada (furo à esquerda). Três estados: esboço a lápis (tracejada, ainda vai acontecer),
// acesa (verde, é a vez dela) e feita (papel, já foi dita).
import { cor } from "../tema";

export type EstadoEtiqueta = { esboco: number; acesa: number };

const misturarCor = (a: string, b: string, p: number) => {
  const ha = a.replace("#", "");
  const hb = b.replace("#", "");
  const ca = [0, 2, 4].map((i) => parseInt(ha.slice(i, i + 2), 16));
  const cb = [0, 2, 4].map((i) => parseInt(hb.slice(i, i + 2), 16));
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * p));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};
export { misturarCor };

// caminho da etiqueta vertical: cantos de cima chanfrados, de baixo arredondados
export const caminhoVertical = (w: number, h: number) => {
  const c = Math.min(w * 0.24, 46);
  const r = 16;
  return `M ${c} 0 H ${w - c} L ${w} ${c} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${c} Z`;
};
// caminho da etiqueta deitada: cantos da esquerda chanfrados
export const caminhoDeitado = (w: number, h: number) => {
  const c = Math.min(h * 0.3, 52);
  const r = 16;
  return `M 0 ${c} L ${c} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${c} L 0 ${h - c} Z`;
};

// Fundo da etiqueta (SVG) com furo e ilhós; o conteúdo vai por cima, em HTML.
export const FundoEtiqueta: React.FC<{
  w: number;
  h: number;
  deitada?: boolean;
  // 0 = papel (feita); 1 = verde (acesa)
  acesa?: number;
  // 1 = só o contorno a lápis; 0 = papel cheio
  esboco?: number;
  sombra?: boolean;
}> = ({ w, h, deitada, acesa = 0, esboco = 0, sombra = true }) => {
  const d = deitada ? caminhoDeitado(w, h) : caminhoVertical(w, h);
  const furo = deitada ? { x: Math.min(h * 0.3, 52) * 0.95, y: h / 2 } : { x: w / 2, y: Math.min(w * 0.24, 46) * 0.95 };
  const fundo = misturarCor(cor.papel, cor.verde, acesa);
  const cheio = 1 - esboco;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: sombra && cheio > 0.5 ? "drop-shadow(0 8px 10px rgba(40,30,20,0.22))" : undefined }}
    >
      <defs>
        <mask id={`furo-${w}-${h}-${deitada ? 1 : 0}`}>
          <rect x={-10} y={-10} width={w + 20} height={h + 20} fill="white" />
          <circle cx={furo.x} cy={furo.y} r={11} fill="black" />
        </mask>
      </defs>
      {/* o esboço: contorno tracejado a lápis */}
      {esboco > 0.01 ? (
        <path d={d} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="12 9" opacity={esboco} />
      ) : null}
      {cheio > 0.01 ? (
        <g opacity={cheio} mask={`url(#furo-${w}-${h}-${deitada ? 1 : 0})`}>
          <path d={d} fill={fundo} />
          {/* filete interno, como a borda impressa de uma etiqueta */}
          <path
            d={d}
            fill="none"
            stroke={acesa > 0.5 ? "rgba(246,242,234,0.35)" : "rgba(30,29,27,0.14)"}
            strokeWidth={2}
            transform={`translate(${w * 0.035} ${h * 0.035}) scale(0.93)`}
          />
        </g>
      ) : null}
      {/* ilhós de metal em volta do furo */}
      <circle cx={furo.x} cy={furo.y} r={14} fill="none" stroke={esboco > 0.5 ? cor.lapis : cor.lataoEscuro} strokeWidth={esboco > 0.5 ? 2.5 : 4.5} opacity={Math.max(esboco, cheio)} />
    </svg>
  );
};
