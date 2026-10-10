// A cena da pausa: o esqueleto sentado (postura certa, sem mesa) se levanta e caminha pela chapa,
// deixando um rastro tracejado no chão.
import { prog } from "../anim";
import { cor } from "../tema";
import { Cadeira, Chao, camera, Ossos, Porta, Tecido } from "./Desenho";
import { juntas, OSSO, posturaPausa, v } from "./pose";

export const RECORTE_PAUSA = { x0: -40, x1: 240, y0: -5, y1: 190 };

export const CenaPausa: React.FC<{
  t: number;
  levantaEm?: number;
  caminhaEm?: number;
  largura: number;
  altura: number;
  id: string;
}> = ({ t, levantaEm, caminhaEm, largura, altura, id }) => {
  const { s, proj, cena } = camera(RECORTE_PAUSA, largura, altura);
  const levanta = levantaEm === undefined ? 0 : prog(t, levantaEm, 0.62, (x) => x);
  const anda = caminhaEm === undefined ? -1 : t - caminhaEm;
  const j = juntas(posturaPausa(levanta, levanta >= 1 ? anda : -1));
  // a régua do caminho: nasce em esboço no chão, à frente da cadeira, e acende enquanto ele anda
  const inicio = OSSO.coxa;
  const fimRegua = 196;
  const fim = Math.min(fimRegua, Math.max(inicio, j.quadril.x + 6));
  const a = proj(v(inicio, -1.8));
  const b = proj(v(fim, -1.8));
  const z = proj(v(fimRegua, -1.8));
  const marcas = Array.from({ length: Math.floor((fimRegua - inicio) / 20) + 1 }, (_, i) => inicio + i * 20);
  const regua = prog(t, levantaEm ?? 0, 0.5);
  const esq = cena(v(0, 0)).x;
  const dir = cena(v(largura, 0)).x;
  return (
    <svg width={largura} height={altura} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id={`luz-${id}`} filterUnits="userSpaceOnUse" x={-60} y={-60} width={largura + 120} height={altura + 120}>
          <feGaussianBlur stdDeviation={3} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <Chao proj={proj} x0={esq - 5} x1={dir + 5} s={s} id={id} />
      <Cadeira proj={proj} s={s} />
      <Porta proj={proj} s={s} x={fimRegua + 8} />
      <g opacity={0.65 + 0.35 * regua}>
        <line x1={a.x} y1={a.y} x2={z.x} y2={z.y} stroke={cor.objeto} strokeWidth={3} strokeDasharray="16 12" />
        {marcas.map((mx) => {
          const p = proj(v(mx, -1.8));
          const passou = mx <= fim;
          return <line key={mx} x1={p.x} y1={p.y - 9} x2={p.x} y2={p.y + 9} stroke={passou && fim - inicio > 4 ? cor.ciano : cor.objeto} strokeWidth={3} strokeLinecap="round" />;
        })}
        <circle cx={z.x} cy={z.y} r={9} fill="none" stroke={fim >= fimRegua - 1 ? cor.ciano : cor.objeto} strokeWidth={3} />
      </g>
      {fim - inicio > 4 ? (
        <g filter={`url(#luz-${id})`}>
          <line x1={a.x} y1={a.y} x2={b.x - 14} y2={b.y} stroke={cor.ciano} strokeWidth={4} strokeDasharray="16 12" />
          <path d={`M ${b.x - 26} ${b.y - 11} L ${b.x - 10} ${b.y} L ${b.x - 26} ${b.y + 11}`} fill="none" stroke={cor.ciano} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : null}
      <Tecido j={j} proj={proj} s={s} id={id} />
      <Ossos j={j} proj={proj} s={s} id={id} />
    </svg>
  );
};
