import { limitar } from "../anim";
import { cor } from "../tema";

export type NomeIcone = "salvar" | "seguir" | "comentar" | "link";

// Ícones a traço (viewBox 48×48). `preenche` (0→1) enche o ícone de vermelho: a ação feita.
export const Icone: React.FC<{ nome: NomeIcone; tamanho?: number; preenche?: number }> = ({ nome, tamanho = 64, preenche = 0 }) => {
  const p = limitar(preenche);
  const traco = p > 0.5 ? cor.vermelho : cor.tinta;
  const comum = { fill: "none", stroke: traco, strokeWidth: 3.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const id = `enche-${nome}`;
  const forma = (() => {
    switch (nome) {
      case "salvar":
        return "M13 6 H35 A2 2 0 0 1 37 8 V42 L24 33 L11 42 V8 A2 2 0 0 1 13 6 Z";
      case "comentar":
        return "M8 10 H40 A2 2 0 0 1 42 12 V32 A2 2 0 0 1 40 34 H20 L11 41 V34 H8 A2 2 0 0 1 6 32 V12 A2 2 0 0 1 8 10 Z";
      case "seguir":
        return "M24 24 A8 8 0 1 0 24 8 A8 8 0 1 0 24 24 Z M9 42 C9 33 16 28 24 28 C32 28 39 33 39 42";
      case "link":
        return "M20 28 L28 20 M17 23 L12 28 A6 6 0 0 0 20 36 L25 31 M31 25 L36 20 A6 6 0 0 0 28 12 L23 17";
    }
  })();
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={48 * (1 - p)} width={48} height={48} />
        </clipPath>
      </defs>
      {nome === "salvar" || nome === "comentar" ? <path d={forma} fill={cor.vermelho} clipPath={`url(#${id})`} /> : null}
      <path d={forma} {...comum} />
    </svg>
  );
};
