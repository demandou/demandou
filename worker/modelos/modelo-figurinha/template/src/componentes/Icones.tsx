// Ícones das figurinhas de chamada (traço creme, viewBox 48×48)
export type NomeIcone = "salvar" | "enviar" | "seguir" | "comentar" | "link";

const TRACOS: Record<NomeIcone, string> = {
  salvar: "M14 8 H34 Q37 8 37 11 V40 L24 31 L11 40 V11 Q11 8 14 8 Z",
  enviar: "M42 6 L6 21 L20 27 L42 6 Z M42 6 L27 42 L20 27",
  seguir: "M19 22 A7 7 0 1 0 19 8 A7 7 0 1 0 19 22 Z M6 40 C 6 31, 12 27, 19 27 C 26 27, 32 31, 32 40 M38 15 V29 M31 22 H45",
  comentar: "M8 12 Q8 7 13 7 H35 Q40 7 40 12 V28 Q40 33 35 33 H20 L11 41 V33 Q8 33 8 28 Z",
  link: "M21 27 L27 21 M19 31 L15 35 Q10 40 6 35 Q2 31 7 26 L13 20 M29 17 L33 13 Q38 8 42 13 Q46 17 41 22 L35 28",
};

export const Icone: React.FC<{ nome: NomeIcone; tamanho: number; cor: string }> = ({ nome, tamanho, cor: c }) => (
  <svg viewBox="0 0 48 48" width={tamanho} height={tamanho}>
    <path d={TRACOS[nome]} fill="none" stroke={c} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
