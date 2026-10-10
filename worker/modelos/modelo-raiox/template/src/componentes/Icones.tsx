// Ícones a traço do fechamento (salvar, seguir, comentar, link, compartilhar). `cheio` de 0 a 1 preenche
// o ícone de ciano quando a palavra é dita.
import { cor } from "../tema";

export type NomeIcone = "salvar" | "seguir" | "comentar" | "link" | "compartilhar";

export const Icone: React.FC<{ nome: NomeIcone; tamanho: number; cheio: number }> = ({ nome, tamanho, cheio }) => {
  const traco = cheio > 0 ? cor.ciano : cor.osso;
  const preenche = `rgba(92,200,232,${(0.95 * cheio).toFixed(3)})`;
  const comum = { fill: preenche, stroke: traco, strokeWidth: 3.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48">
      {nome === "salvar" ? <path d="M 12 6 H 36 V 42 L 24 33 L 12 42 Z" {...comum} /> : null}
      {nome === "seguir" ? (
        <>
          <circle cx={20} cy={16} r={8} {...comum} />
          <path d="M 5 41 C 6 31 12 27 20 27 C 28 27 34 31 35 41 Z" {...comum} />
          <path d="M 39 14 V 26 M 33 20 H 45" fill="none" stroke={traco} strokeWidth={3.2} strokeLinecap="round" />
        </>
      ) : null}
      {nome === "comentar" ? <path d="M 7 9 H 41 V 33 H 22 L 12 41 V 33 H 7 Z" {...comum} /> : null}
      {nome === "link" ? (
        <>
          <path d="M 21 27 L 27 21" fill="none" stroke={traco} strokeWidth={3.6} strokeLinecap="round" />
          <path d="M 19.5 14.5 L 23.5 10.5 C 27.5 6.5 34 6.5 37.5 10.5 C 41.5 14 41.5 20.5 37.5 24.5 L 33.5 28.5" {...comum} fill="none" />
          <path d="M 28.5 33.5 L 24.5 37.5 C 20.5 41.5 14 41.5 10.5 37.5 C 6.5 34 6.5 27.5 10.5 23.5 L 14.5 19.5" {...comum} fill="none" />
          <circle cx={24} cy={24} r={19} fill={preenche} stroke="none" opacity={0.35} />
        </>
      ) : null}
      {nome === "compartilhar" ? <path d="M 6 22 L 42 7 L 30 42 L 23 27 Z M 23 27 L 42 7" {...comum} /> : null}
    </svg>
  );
};
