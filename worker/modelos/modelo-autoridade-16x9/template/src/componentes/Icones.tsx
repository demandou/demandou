import type { Icone } from "../plano";

// Ícones de traço, desenhados conforme `p` vai de 0 a 1.
const tracos: Record<Icone, string[]> = {
  caixa: ["M8 16 24 8l16 8v18l-16 8-16-8Z", "M8 16l16 8 16-8", "M24 24v18", "M16 12l16 8"],
  retorno: ["M38 24a14 14 0 1 1-5-10.7", "M34 5v9h-9", "M24 17v14", "M28 20.5h-5.5a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5H20"],
  documento: ["M13 6h16l8 8v28H13Z", "M29 6v8h8", "M19 23h12", "M19 29h12", "M19 35h7"],
  relogio: ["M24 6a18 18 0 1 0 0 36 18 18 0 0 0 0-36Z", "M24 14v10l7 5"],
  escudo: ["M24 5l15 6v11c0 10-6.5 17-15 21C15.5 39 9 32 9 22V11Z", "M17 23l5 5 9-10"],
  check: ["M24 6a18 18 0 1 0 0 36 18 18 0 0 0 0-36Z", "M15 24l6 6 12-13"],
  seguir: ["M24 6a18 18 0 1 0 0 36 18 18 0 0 0 0-36Z", "M24 15v18", "M15 24h18"],
  comentar: ["M8 9h32v24H23l-9 8v-8H8Z", "M16 18h16", "M16 25h10"],
  link: ["M24 6a18 18 0 1 0 0 36 18 18 0 0 0 0-36Z", "M15 24h17", "M26 17l7 7-7 7"],
  alerta: ["M24 7 42 39H6Z", "M24 19v10", "M24 34v.5"],
  moeda: ["M24 6a18 18 0 1 0 0 36 18 18 0 0 0 0-36Z", "M24 13v22", "M29 18h-7a3.5 3.5 0 0 0 0 7h4a3.5 3.5 0 0 1 0 7h-8"],
  grafico: ["M8 8v32h32", "M14 32l8-9 6 5 10-13", "M32 15h6v6"],
  lupa: ["M21 7a14 14 0 1 0 0 28 14 14 0 0 0 0-28Z", "M31 31l10 10"],
  pessoa: ["M24 8a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z", "M9 41c2-8 8-12 15-12s13 4 15 12"],
  coracao: ["M24 40C12 31 6 24 6 17a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 7-6 14-18 23Z"],
  calendario: ["M8 11h32v29H8Z", "M8 19h32", "M16 6v9", "M32 6v9", "M15 27h4", "M22 27h4", "M29 27h4", "M15 33h4"],
  ideia: ["M24 6a12 12 0 0 0-7 21.7V33h14v-5.3A12 12 0 0 0 24 6Z", "M18 38h12", "M20 42h8"],
};

export const IconeTraco: React.FC<{
  nome: Icone;
  p: number;
  tamanho: number;
  cor: string;
}> = ({ nome, p, tamanho, cor }) => {
  const partes = tracos[nome];
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" fill="none">
      {partes.map((d, i) => {
        // cada traço começa um pouco depois do anterior
        const local = Math.min(1, Math.max(0, p * (1 + 0.25 * (partes.length - 1)) - 0.25 * i));
        return (
          <path
            key={d}
            d={d}
            pathLength={1}
            stroke={cor}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={1}
            strokeDashoffset={1 - local}
          />
        );
      })}
    </svg>
  );
};

// Marcador de "salvar" (o mesmo desenho do botão das redes): traça e depois preenche.
export const Salvar: React.FC<{ traco: number; cheio: number; tamanho: number; cor: string; corCheio: string }> = ({
  traco,
  cheio,
  tamanho,
  cor,
  corCheio,
}) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" fill="none">
    <path d="M12 6h24v36l-12-9-12 9Z" fill={corCheio} opacity={cheio} />
    <path
      d="M12 6h24v36l-12-9-12 9Z"
      pathLength={1}
      stroke={cheio > 0.5 ? corCheio : cor}
      strokeWidth={1.8}
      strokeLinejoin="round"
      strokeDasharray={1}
      strokeDashoffset={1 - traco}
    />
  </svg>
);
