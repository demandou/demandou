// Metrônomo de pêndulo, a traço. O pêndulo chega ao fim do balanço em cada batida; o peso desce
// quando o andamento acelera (como num metrônomo de verdade: peso baixo = mais rápido).
import { mix, prog } from "../anim";
import { cor } from "../tema";

export const Metronomo: React.FC<{
  t: number;
  batidas: { em: number; andamento: number }[];
  // de onde o pêndulo começa a se mexer e até quando ele balança
  fim: number;
  // número de andamentos (para posicionar o peso)
  andamentos: number;
  // quando o desenho se traça (entrada)
  desenhoEm: number;
  altura: number;
}> = ({ t, batidas, fim, andamentos, desenhoEm, altura }) => {
  const A = 24;
  // ângulo do pêndulo
  let angulo = 0;
  if (batidas.length) {
    const primeira = batidas[0].em;
    const k = batidas.reduce((n, b, i) => (t >= b.em ? i : n), -1);
    if (k < 0) {
      angulo = A * prog(t, primeira - 0.4, 0.4);
    } else {
      const agora = batidas[k];
      const proxima = batidas[k + 1]?.em ?? Math.min(fim, agora.em + (agora.em - (batidas[k - 1]?.em ?? agora.em - 0.8)));
      const periodo = Math.max(0.2, proxima - agora.em);
      const u = (t - agora.em) / periodo;
      const lado = k % 2 === 0 ? 1 : -1;
      angulo = A * lado * Math.cos(Math.PI * Math.min(u, 1.5));
    }
  }
  // peso: andamento 0 (mais lento) em cima; cada andamento seguinte desce
  const atual = batidas.filter((b) => b.em <= t).pop()?.andamento ?? 0;
  const anterior = batidas.filter((b) => b.em <= t && b.andamento < atual).pop();
  const desce = anterior ? prog(t, batidas.find((b) => b.andamento === atual)?.em ?? 0, 0.4) : 1;
  const passo = andamentos > 1 ? 120 / (andamentos - 1) : 0;
  const pesoD = 255 - mix(Math.max(0, atual - 1), atual, desce) * passo;

  const traco = prog(t, desenhoEm, 0.6);
  const contorno = 1280;
  const escala = altura / 460;

  return (
    <svg width={300 * escala} height={460 * escala} viewBox="0 0 300 460" style={{ overflow: "visible", display: "block" }}>
      {/* corpo em pirâmide */}
      <path
        d="M 118 22 L 182 22 Q 190 22 192 30 L 268 418 L 32 418 L 108 30 Q 110 22 118 22 Z"
        fill={cor.palcoClaro}
        stroke={cor.marfim}
        strokeWidth={4.5}
        strokeLinejoin="round"
        strokeDasharray={contorno}
        strokeDashoffset={contorno * (1 - traco)}
      />
      {/* escala de andamentos */}
      <g opacity={prog(t, desenhoEm + 0.25, 0.4)}>
        <path d="M 132 70 L 168 70 L 196 330 L 104 330 Z" fill="none" stroke={cor.lapisForte} strokeWidth={3} />
        {Array.from({ length: 10 }, (_, i) => (
          <line key={i} x1={150 - 10 - i * 1.6} y1={86 + i * 24} x2={150 + 10 + i * 1.6} y2={86 + i * 24} stroke={cor.lapisForte} strokeWidth={2.5} />
        ))}
      </g>
      {/* base */}
      <rect x={18} y={418} width={264} height={22} rx={6} fill={cor.marfim} opacity={traco} />
      {/* pêndulo */}
      <g transform={`rotate(${angulo} 150 372)`} opacity={prog(t, desenhoEm + 0.35, 0.35)}>
        <line x1={150} y1={372} x2={150} y2={48} stroke={cor.marfim} strokeWidth={6} strokeLinecap="round" />
        <path
          d={`M ${150 - 30} ${372 - pesoD - 20} L ${150 + 30} ${372 - pesoD - 20} L ${150 + 22} ${372 - pesoD + 20} L ${150 - 22} ${372 - pesoD + 20} Z`}
          fill={cor.azul}
          stroke={cor.azul}
          strokeWidth={4}
          strokeLinejoin="round"
        />
        <circle cx={150} cy={372} r={11} fill={cor.marfim} />
      </g>
      {/* marcas de fim de balanço */}
      <g opacity={0.9 * prog(t, desenhoEm + 0.4, 0.3)} stroke={cor.marfimSuave} strokeWidth={3.5} strokeLinecap="round">
        <line x1={150 + Math.sin((A * Math.PI) / 180) * 340} y1={372 - Math.cos((A * Math.PI) / 180) * 340} x2={150 + Math.sin((A * Math.PI) / 180) * 366} y2={372 - Math.cos((A * Math.PI) / 180) * 366} />
        <line x1={150 - Math.sin((A * Math.PI) / 180) * 340} y1={372 - Math.cos((A * Math.PI) / 180) * 340} x2={150 - Math.sin((A * Math.PI) / 180) * 366} y2={372 - Math.cos((A * Math.PI) / 180) * 366} />
      </g>
    </svg>
  );
};
