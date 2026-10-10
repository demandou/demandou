// O piso do hall: rodapé claro e porcelanato acinzentado com juntas. Fica embaixo de tudo e só
// aparece quando a pessoa sai da tela cheia (a porta da direita desce até ele). No quadro deitado ele
// fica sob os controles do player (de y 996 para baixo).
import { cor, H, PISO_Y, W } from "../tema";

export const Piso: React.FC = () => {
  const altura = H - PISO_Y;
  return (
    <svg width={W} height={altura + 20} style={{ position: "absolute", left: 0, top: PISO_Y - 20 }}>
      <defs>
        <linearGradient id="piso-sombra" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(30,22,14,0.32)" />
          <stop offset="1" stopColor="rgba(30,22,14,0)" />
        </linearGradient>
      </defs>
      {/* porcelanato */}
      <rect x={0} y={20} width={W} height={altura} fill="#A0988C" />
      {[1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={(i * W) / 6} y={20} width={3} height={altura} fill="rgba(30,22,14,0.16)" />
      ))}
      <rect x={0} y={20} width={W} height={46} fill="url(#piso-sombra)" />
      {/* rodapé */}
      <rect x={0} y={0} width={W} height={22} fill={cor.papelEscuro} />
      <rect x={0} y={0} width={W} height={3} fill="rgba(255,255,255,0.5)" />
      <rect x={0} y={19} width={W} height={3} fill="rgba(30,22,14,0.25)" />
    </svg>
  );
};
