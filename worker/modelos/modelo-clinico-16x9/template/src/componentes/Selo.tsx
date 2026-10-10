import { limitar, prog, Traco } from "../anim";
import { cor } from "../tema";

// ✓ e ✗ desenhados: um disco que cresce e a marca que se traça por cima (a segunda perna do ✗ vem depois).
// Uso dentro de um <svg>. `p` vai de 0 a 1 (0,35 do disco, depois a marca).
export const Selo: React.FC<{
  cx: number;
  cy: number;
  r: number;
  tipo: "certo" | "errado";
  p: number;
  // contorno (anel) em vez de disco cheio
  vazado?: boolean;
  corDisco?: string;
}> = ({ cx, cy, r, tipo, p, vazado, corDisco }) => {
  if (p <= 0) return null;
  const c = corDisco ?? (tipo === "certo" ? cor.azul : cor.vermelho);
  const disco = limitar(p / 0.35);
  const marca = limitar((p - 0.3) / 0.7);
  const esc = 0.6 + 0.4 * disco;
  const traco = Math.max(3, r * 0.17);
  const corMarca = vazado ? c : cor.branco;
  const k = r * 0.42;
  return (
    <g transform={`translate(${cx} ${cy})`} opacity={disco}>
      <g transform={`scale(${esc})`}>
        {vazado ? (
          <circle r={r - traco / 2} fill={cor.branco} stroke={c} strokeWidth={traco * 0.7} />
        ) : (
          <circle r={r} fill={c} />
        )}
      </g>
      {tipo === "certo" ? (
        <Traco d={`M ${-k * 1.05} ${k * 0.05} L ${-k * 0.3} ${k * 0.75} L ${k * 1.1} ${-k * 0.7}`} p={marca} cor={corMarca} largura={traco} />
      ) : (
        <>
          <Traco d={`M ${-k * 0.78} ${-k * 0.78} L ${k * 0.78} ${k * 0.78}`} p={limitar(marca / 0.5)} cor={corMarca} largura={traco} />
          <Traco d={`M ${k * 0.78} ${-k * 0.78} L ${-k * 0.78} ${k * 0.78}`} p={limitar((marca - 0.5) / 0.5)} cor={corMarca} largura={traco} />
        </>
      )}
    </g>
  );
};

// Progresso padrão de um selo que entra em `em`
export const pSelo = (t: number, em: number) => prog(t, em, 0.55);
