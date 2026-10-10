// O papel milimetrado do caderno. A grade anda junto com a página quando ela rola.
import { AbsoluteFill } from "remotion";
import { cor, QUADRO, W } from "../tema";

export const Papel: React.FC<{ rolagem: number }> = ({ rolagem }) => {
  const forte = QUADRO * 5;
  const y = -(((rolagem % forte) + forte) % forte);
  const x = ((W % forte) / 2) % forte;
  const linhaH = (c: string, e: number) => `linear-gradient(to bottom, ${c} 0, ${c} ${e}px, transparent ${e}px)`;
  const linhaV = (c: string, e: number) => `linear-gradient(to right, ${c} 0, ${c} ${e}px, transparent ${e}px)`;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: cor.papel,
        backgroundImage: [linhaH(cor.gradeForte, 2), linhaV(cor.gradeForte, 2), linhaH(cor.grade, 1.4), linhaV(cor.grade, 1.4)].join(", "),
        backgroundSize: `100% ${forte}px, ${forte}px 100%, 100% ${QUADRO}px, ${QUADRO}px 100%`,
        backgroundPosition: `0 ${y}px, ${x}px 0, 0 ${y}px, ${x}px 0`,
      }}
    />
  );
};
