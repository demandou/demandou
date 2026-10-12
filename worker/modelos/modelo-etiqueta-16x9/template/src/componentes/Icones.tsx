// Ícones em traço grosso, desenhados aqui (nada de fonte de ícones). `cor` = cor do traço.
export type NomeIcone = "salvar" | "seguir" | "comentar" | "link" | "certo" | "errado" | "seta";

export const Icone: React.FC<{ nome: NomeIcone; tamanho: number; cor: string; traco?: number }> = ({ nome, tamanho, cor, traco = 2.6 }) => {
  const comum = { fill: "none", stroke: cor, strokeWidth: traco, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      {nome === "salvar" ? <path d="M6 3.5h12v17l-6-4.2-6 4.2z" {...comum} /> : null}
      {nome === "seguir" ? (
        <>
          <circle cx="9.5" cy="8" r="3.6" {...comum} />
          <path d="M3 20c.6-3.6 3.2-5.6 6.5-5.6s5.9 2 6.5 5.6M18.5 7v6M15.5 10h6" {...comum} />
        </>
      ) : null}
      {nome === "comentar" ? <path d="M4 5.5h16v10.5h-9.5l-4.5 3.8V16H4z" {...comum} /> : null}
      {nome === "link" ? (
        <path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1.2 1.2M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1.2-1.2" {...comum} />
      ) : null}
      {nome === "certo" ? <path d="M5 12.5l4.5 4.5L19 7.5" {...comum} /> : null}
      {nome === "errado" ? <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...comum} /> : null}
      {nome === "seta" ? <path d="M4 12h15M13 6l6 6-6 6" {...comum} /> : null}
    </svg>
  );
};
