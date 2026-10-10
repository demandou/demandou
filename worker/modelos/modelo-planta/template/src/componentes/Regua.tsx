import { cor, traco } from "../tema";

// A régua paralela da prancheta: uma faixa de papel com filete e marcas de escala, que desce pela
// tela na troca de uma folha para outra (acima dela, a folha nova; abaixo, a velha).
export const Regua: React.FC<{ y: number }> = ({ y }) => {
  const marcas: string[] = [];
  for (let x = 30; x < 1080; x += 30) {
    const longa = x % 150 === 0;
    marcas.push(`M${x} ${y + 11}V${y + 11 - (longa ? 12 : 6)}`);
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <rect x={-4} y={y - 11} width={1088} height={22} fill={cor.papel} stroke={cor.grafite} strokeWidth={traco.fino} />
      <path d={marcas.join("")} stroke={cor.grafite} strokeWidth={2} />
    </svg>
  );
};
