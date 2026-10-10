import { cor } from "../tema";

export const Icone: React.FC<{ nome: "salvar" | "seguir" | "comentar" | "link"; tamanho?: number; cor?: string }> = ({ nome, tamanho = 64, cor: c = "#fff" }) => {
  const p = { fill: "none", stroke: c, strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      {nome === "salvar" ? <path d="M6 3.5h12v17l-6-4.4-6 4.4z" {...p} /> : null}
      {nome === "seguir" ? (
        <>
          <circle cx="10" cy="8" r="3.6" {...p} />
          <path d="M3.5 20c.6-3.7 3.2-5.6 6.5-5.6s5.9 1.9 6.5 5.6M19 7v6M16 10h6" {...p} />
        </>
      ) : null}
      {nome === "comentar" ? <path d="M4 5.5h16v10.5H10l-4.5 3.8V16H4z" {...p} /> : null}
      {nome === "link" ? <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" {...p} /> : null}
    </svg>
  );
};
export const corIcone = cor.cobalto;
