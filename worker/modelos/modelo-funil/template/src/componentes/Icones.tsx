// Ícones a traço, desenhados aqui (nada de emoji). Traço grosso para ler no celular.
export type NomeIcone = "seta" | "alerta" | "check" | "pausa" | "salvar" | "seguir" | "comentar" | "link";

export const Icone: React.FC<{ nome: NomeIcone; tamanho: number; cor: string; traco?: number; p?: number }> = ({
  nome,
  tamanho,
  cor,
  traco = 2.6,
  p = 1,
}) => {
  const comum = {
    fill: "none",
    stroke: cor,
    strokeWidth: traco,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    pathLength: 1,
    strokeDasharray: p < 0.999 ? `${Math.max(0, p)} 1` : undefined,
  };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
      {nome === "seta" ? <path d="M12 4v15M6 13l6 6 6-6" {...comum} /> : null}
      {nome === "alerta" ? (
        <>
          <path d="M12 3.5 22 20.5H2Z" {...comum} />
          <path d="M12 10v4.6" {...comum} />
          <circle cx="12" cy="17.6" r="0.4" {...comum} strokeDasharray={undefined} pathLength={undefined} />
        </>
      ) : null}
      {nome === "check" ? <path d="M4.5 12.5 10 18 19.5 6.5" {...comum} /> : null}
      {nome === "pausa" ? (
        <>
          <path d="M8.5 5v14" {...comum} />
          <path d="M15.5 5v14" {...comum} />
        </>
      ) : null}
      {nome === "salvar" ? <path d="M6 3.5h12v17l-6-4.6-6 4.6Z" {...comum} /> : null}
      {nome === "seguir" ? (
        <>
          <circle cx="9.5" cy="8" r="4" {...comum} />
          <path d="M2.5 20.5c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" {...comum} />
          <path d="M19 6.5v6M16 9.5h6" {...comum} />
        </>
      ) : null}
      {nome === "comentar" ? <path d="M4 5h16v11H10l-5 4v-4H4Z" {...comum} /> : null}
      {nome === "link" ? (
        <>
          <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" {...comum} />
          <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" {...comum} />
        </>
      ) : null}
    </svg>
  );
};
