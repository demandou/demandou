// Amostra de tecido: um retângulo na cor da peça com a trama desenhada por cima.
// Antes da palavra é um contorno tracejado "a lápis"; no `em` o tecido é estendido da esquerda
// para a direita, como um corte de pano sobre a mesa.
import type { Tecido } from "../plano";
import { cor as paleta, escura } from "../tema";

// número pseudoaleatório estável (o mesmo em todos os quadros)
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const Trama: React.FC<{ tecido: Tecido; base: string; w: number; h: number; id: string }> = ({ tecido, base, w, h, id }) => {
  const clara = !escura(base);
  const sombra = clara ? "rgba(40,32,24," : "rgba(0,0,0,";
  const luz = "rgba(255,255,255,";
  switch (tecido) {
    case "algodao":
      // tela fina de algodão: fios miúdos e suaves nas duas direções
      return (
        <>
          <defs>
            <pattern id={`${id}-p`} width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="1.3" fill={`${sombra}0.05)`} />
              <rect width="1.3" height="4" fill={`${sombra}0.04)`} />
            </pattern>
          </defs>
          <rect width={w} height={h} fill={`url(#${id}-p)`} />
        </>
      );
    case "linho":
      return (
        <>
          {Array.from({ length: Math.ceil(h / 5) }, (_, i) => (
            <line key={`h${i}`} x1={0} x2={w} y1={i * 5 + 2} y2={i * 5 + 2} stroke={`${sombra}${(0.04 + rnd(i) * 0.1).toFixed(3)})`} strokeWidth={1 + rnd(i + 9) * 1.4} />
          ))}
          {Array.from({ length: Math.ceil(w / 6) }, (_, i) => (
            <line key={`v${i}`} y1={0} y2={h} x1={i * 6 + 3} x2={i * 6 + 3} stroke={`${sombra}${(0.03 + rnd(i + 50) * 0.06).toFixed(3)})`} strokeWidth={1} />
          ))}
        </>
      );
    case "sarja":
      // sarja: diagonais regulares (gabardine, chino, jaqueta de algodão)
      return (
        <>
          <defs>
            <pattern id={`${id}-p`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
              <rect width="9" height="4" fill={`${sombra}0.1)`} />
              <rect y="4" width="9" height="1.2" fill={`${luz}0.18)`} />
            </pattern>
          </defs>
          <rect width={w} height={h} fill={`url(#${id}-p)`} />
        </>
      );
    case "jeans":
      // jeans: diagonais claras da trama (fio branco) sobre o índigo, com veios verticais
      return (
        <>
          <defs>
            <pattern id={`${id}-p`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-42)">
              <rect width="7" height="2.2" fill={`${luz}0.16)`} />
            </pattern>
          </defs>
          <rect width={w} height={h} fill={`url(#${id}-p)`} />
          {Array.from({ length: Math.ceil(w / 11) }, (_, i) => (
            <rect key={i} x={i * 11 + rnd(i) * 6} y={0} width={2 + rnd(i + 3) * 4} height={h} fill={`${luz}${(rnd(i + 7) * 0.07).toFixed(3)})`} />
          ))}
        </>
      );
    case "malha":
      return (
        <>
          <defs>
            <pattern id={`${id}-p`} width="12" height="10" patternUnits="userSpaceOnUse">
              <path d="M0 2 L6 8 L12 2" fill="none" stroke={`${sombra}0.12)`} strokeWidth="1.6" />
            </pattern>
          </defs>
          <rect width={w} height={h} fill={`url(#${id}-p)`} />
        </>
      );
    case "la":
      return (
        <>
          {Array.from({ length: Math.round((w * h) / 90) }, (_, i) => (
            <circle key={i} cx={rnd(i) * w} cy={rnd(i + 1000) * h} r={0.8 + rnd(i + 2000) * 1.4} fill={rnd(i + 3000) > 0.5 ? `${luz}0.22)` : `${sombra}0.16)`} />
          ))}
        </>
      );
    case "seda":
      return (
        <>
          <defs>
            <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0.6">
              <stop offset="0" stopColor={`${sombra}0.12)`} />
              <stop offset="0.45" stopColor={`${luz}0.32)`} />
              <stop offset="0.6" stopColor={`${luz}0.08)`} />
              <stop offset="1" stopColor={`${sombra}0.16)`} />
            </linearGradient>
          </defs>
          <rect width={w} height={h} fill={`url(#${id}-g)`} />
        </>
      );
    case "couro":
      // couro: poros e manchas suaves + um brilho largo
      return (
        <>
          <defs>
            <radialGradient id={`${id}-g`} cx="0.3" cy="0.25" r="0.9">
              <stop offset="0" stopColor={`${luz}0.16)`} />
              <stop offset="1" stopColor={`${sombra}0.22)`} />
            </radialGradient>
          </defs>
          <rect width={w} height={h} fill={`url(#${id}-g)`} />
          {Array.from({ length: Math.round((w * h) / 60) }, (_, i) => (
            <circle key={i} cx={rnd(i) * w} cy={rnd(i + 500) * h} r={0.7 + rnd(i + 900) * 1.6} fill={`${sombra}${(0.08 + rnd(i + 77) * 0.14).toFixed(3)})`} />
          ))}
        </>
      );
    case "metal":
      // metal escovado: faixas de luz e fios horizontais finos
      return (
        <>
          <defs>
            <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0.2">
              <stop offset="0" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="0.3" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="0.55" stopColor="rgba(60,64,70,0.22)" />
              <stop offset="0.8" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="1" stopColor="rgba(60,64,70,0.25)" />
            </linearGradient>
          </defs>
          <rect width={w} height={h} fill={`url(#${id}-g)`} />
          {Array.from({ length: Math.ceil(h / 3) }, (_, i) => (
            <line key={i} x1={0} x2={w} y1={i * 3 + 1} y2={i * 3 + 1} stroke={rnd(i) > 0.5 ? "rgba(255,255,255,0.25)" : "rgba(40,44,50,0.12)"} strokeWidth={0.8} />
          ))}
        </>
      );
    default:
      return null;
  }
};

// Dobras suaves do pano: faixas largas de luz e sombra na diagonal
const Dobras: React.FC<{ w: number; h: number; id: string; base: string; tecido: Tecido }> = ({ w, h, id, base, tecido }) => {
  if (tecido === "metal" || tecido === "liso") return null;
  const forte = escura(base) ? 1.4 : 1;
  return (
    <>
      <defs>
        <linearGradient id={`${id}-dobra`} x1="0" y1="0" x2="1" y2="0.55">
          <stop offset="0" stopColor={`rgba(255,255,255,${0.18 * forte})`} />
          <stop offset="0.22" stopColor="rgba(255,255,255,0)" />
          <stop offset="0.34" stopColor={`rgba(40,30,20,${0.1 * forte})`} />
          <stop offset="0.44" stopColor="rgba(255,255,255,0)" />
          <stop offset="0.62" stopColor={`rgba(255,255,255,${0.16 * forte})`} />
          <stop offset="0.8" stopColor={`rgba(40,30,20,${0.08 * forte})`} />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${id}-dobra)`} />
    </>
  );
};

export const Amostra: React.FC<{
  id: string;
  w: number;
  h: number;
  base: string;
  tecido?: Tecido;
  // 0 = só o esboço a lápis; 1 = tecido inteiro
  p: number;
  // borda arredondada (0 = recorte reto); círculo = w/2
  raio?: number;
  // contorno de tinta fino em volta (para tecido claro sobre papel claro)
  contorno?: boolean;
  style?: React.CSSProperties;
}> = ({ id, w, h, base, tecido = "liso", p, raio = 0, contorno = true, style }) => {
  const largura = Math.max(0, Math.min(1, p)) * w;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible", ...style }}>
      <defs>
        <clipPath id={`${id}-forma`}>
          <rect width={w} height={h} rx={raio} ry={raio} />
        </clipPath>
        <clipPath id={`${id}-corte`}>
          <rect width={largura} height={h} />
        </clipPath>
      </defs>
      {/* esboço a lápis: contorno tracejado e hachura leve */}
      <g opacity={1 - Math.min(1, p * 1.4)}>
        <rect x={1.5} y={1.5} width={w - 3} height={h - 3} rx={raio} ry={raio} fill="none" stroke={paleta.lapis} strokeWidth={3} strokeDasharray="10 8" />
        <g clipPath={`url(#${id}-forma)`}>
          {Array.from({ length: Math.ceil((w + h) / 26) }, (_, i) => (
            <line key={i} x1={i * 26 - h} y1={h} x2={i * 26} y2={0} stroke={paleta.lapisClaro} strokeWidth={2} />
          ))}
        </g>
      </g>
      <g clipPath={`url(#${id}-forma)`}>
        <g clipPath={`url(#${id}-corte)`}>
          <rect width={w} height={h} fill={base} />
          <Trama tecido={tecido} base={base} w={w} h={h} id={id} />
          <Dobras w={w} h={h} id={id} base={base} tecido={tecido} />
        </g>
      </g>
      {contorno && p > 0 ? (
        <rect x={1} y={1} width={w - 2} height={h - 2} rx={raio} ry={raio} fill="none" stroke="rgba(23,22,20,0.28)" strokeWidth={2} opacity={Math.min(1, p * 2)} />
      ) : null}
    </svg>
  );
};
