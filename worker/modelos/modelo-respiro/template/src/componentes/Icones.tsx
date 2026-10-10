import { Traco } from "../anim";
import { cor } from "../tema";

// Ícones do fechamento, desenhados a traço: primeiro a lápis (o lugar já está ali), depois em
// tinta com o miolo de damasco quando a palavra é dita.
const FORMAS: Record<"salvar" | "seguir" | "comentar" | "enviar" | "link", { contorno: string; miolo?: string }> = {
  // marcador de página
  salvar: { contorno: "M 22 12 L 88 12 Q 94 12 94 18 L 94 128 L 55 100 L 16 128 L 16 18 Q 16 12 22 12 Z" },
  // pessoa com um "+"
  seguir: {
    contorno: "M 46 22 A 20 20 0 1 1 45.9 22 M 12 124 Q 14 76 46 76 Q 78 76 80 124 Z",
    miolo: "M 92 40 L 92 76 M 74 58 L 110 58",
  },
  // balão de conversa
  comentar: { contorno: "M 18 20 L 94 20 Q 102 20 102 28 L 102 88 Q 102 96 94 96 L 46 96 L 22 120 L 26 96 L 18 96 Q 10 96 10 88 L 10 28 Q 10 20 18 20 Z" },
  // dois elos de corrente
  link: {
    contorno: "M 35.1 78.2 L 66.2 47.1 A 15 15 0 0 0 44.9 25.8 L 13.8 56.9 A 15 15 0 0 0 35.1 78.2 Z M 67.1 112.2 L 98.2 81.1 A 15 15 0 0 0 76.9 59.8 L 45.8 90.9 A 15 15 0 0 0 67.1 112.2 Z",
    miolo: "M 46 80 L 66 58",
  },
  // avião de papel
  enviar: { contorno: "M 10 66 L 104 18 L 80 120 L 56 84 Z M 56 84 L 104 18", miolo: "M 56 84 L 58 112" },
};

export const Icone: React.FC<{ tipo: keyof typeof FORMAS; t: number; esboco: number; cheio: number }> = ({ tipo, esboco, cheio }) => {
  const f = FORMAS[tipo];
  return (
    <svg width={112} height={140} viewBox="0 0 112 140" style={{ overflow: "visible" }}>
      <path d={f.contorno} fill="none" stroke={cor.lapis} strokeWidth={4} strokeDasharray="3 10" strokeLinecap="round" opacity={esboco * (1 - cheio)} />
      <path d={f.contorno} fill={cor.damasco} opacity={cheio} />
      <Traco d={f.contorno} p={cheio} cor={cor.tinta} largura={5} />
      {f.miolo ? <Traco d={f.miolo} p={cheio} cor={cor.tinta} largura={5} /> : null}
    </svg>
  );
};
