// Ícones de traço, no tamanho da letra (1em) e na cor do texto.
export type Icone = "comentar" | "salvar" | "seguir" | "enviar" | "link";

export const IconeChamada: React.FC<{ icone: Icone; cor: string }> = ({ icone, cor }) => {
  const traco = { fill: "none", stroke: cor, strokeWidth: 8, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 100 100" style={{ width: "0.92em", height: "0.92em", display: "block", marginTop: "0.02em" }}>
      {icone === "comentar" ? (
        <>
          <path d="M14 18 H86 V68 H44 L24 86 V68 H14 Z" {...traco} />
          <path d="M32 38 H68 M32 52 H56" {...traco} />
        </>
      ) : null}
      {icone === "salvar" ? <path d="M24 12 H76 V88 L50 68 L24 88 Z" {...traco} /> : null}
      {icone === "seguir" ? (
        <>
          <circle cx={42} cy={34} r={18} {...traco} />
          <path d="M10 88 C12 66 26 58 42 58 C58 58 72 66 74 88" {...traco} />
          <path d="M84 30 V58 M70 44 H98" {...traco} />
        </>
      ) : null}
      {icone === "enviar" ? <path d="M10 46 L90 12 L62 90 L48 56 Z M48 56 L90 12" {...traco} /> : null}
      {icone === "link" ? (
        <>
          {/* dois elos de corrente, inclinados */}
          <path d="M44 34 L56 22 C64 14 78 14 86 22 C94 30 94 44 86 52 L72 66" {...traco} />
          <path d="M56 66 L44 78 C36 86 22 86 14 78 C6 70 6 56 14 48 L28 34" {...traco} />
          <path d="M38 62 L62 38" {...traco} />
        </>
      ) : null}
    </svg>
  );
};
