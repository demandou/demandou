// Ícones a traço, genéricos (nada que lembre logotipo de app). viewBox 48×48, traço com pontas
// redondas; `cheios` são áreas preenchidas. `p` desenha o traço de 0 a 1.
import { Traco } from "../anim";

type Desenho = { tracos: string[]; cheios?: string[] };

const DESENHOS = {
  coracao: { tracos: ["M24 40C14 33 6 26 6 17.5 6 12 10 8 15 8c4 0 7 2.2 9 5.5C26 10.2 29 8 33 8c5 0 9 4 9 9.5C42 26 34 33 24 40z"] },
  coracaoCheio: {
    tracos: ["M24 40C14 33 6 26 6 17.5 6 12 10 8 15 8c4 0 7 2.2 9 5.5C26 10.2 29 8 33 8c5 0 9 4 9 9.5C42 26 34 33 24 40z"],
    cheios: ["M24 40C14 33 6 26 6 17.5 6 12 10 8 15 8c4 0 7 2.2 9 5.5C26 10.2 29 8 33 8c5 0 9 4 9 9.5C42 26 34 33 24 40z"],
  },
  // balão de fala com três pontinhos
  balao: { tracos: ["M10 9h28a4 4 0 0 1 4 4v17a4 4 0 0 1-4 4H22l-9 7v-7h-3a4 4 0 0 1-4-4V13a4 4 0 0 1 4-4z"], cheios: ["M15 19.5a2.5 2.5 0 1 0 0.01 0z", "M24 19.5a2.5 2.5 0 1 0 0.01 0z", "M33 19.5a2.5 2.5 0 1 0 0.01 0z"] },
  salvar: { tracos: ["M14 7h20v34l-10-8-10 8z"] },
  salvarCheio: { tracos: ["M14 7h20v34l-10-8-10 8z"], cheios: ["M14 7h20v34l-10-8-10 8z"] },
  seguir: { tracos: ["M20 22a7 7 0 1 0 0-14a7 7 0 1 0 0 14z", "M7 40c1-8 6-12 13-12s12 4 13 12", "M38 14v12", "M32 20h12"] },
  comentar: { tracos: ["M24 8c10 0 17 6 17 14s-7 14-17 14c-2 0-4 0-6-1l-9 5 2-8c-3-3-4-6-4-10 0-8 7-14 17-14z"] },
  check: { tracos: ["M10 25l9 9 19-20"] },
  xis: { tracos: ["M13 13l22 22", "M35 13L13 35"] },
  seta: { tracos: ["M8 24h30", "M28 13l11 11-11 11"] },
  // corrente de link
  link: { tracos: ["M21 27a7 7 0 0 0 10 0l7-7a7 7 0 0 0-10-10l-3 3", "M27 21a7 7 0 0 0-10 0l-7 7a7 7 0 0 0 10 10l3-3"] },
  alerta: { tracos: ["M24 7L43 40H5z", "M24 19v10"], cheios: ["M24 33.5a2.2 2.2 0 1 0 0.01 0z"] },
  calendario: { tracos: ["M8 12h32v28H8z", "M8 20h32", "M16 7v8", "M32 7v8"], cheios: ["M14 25h6v5h-6z"] },
  // pino de mapa
  pino: { tracos: ["M24 42s-13-12.5-13-22a13 13 0 0 1 26 0c0 9.5-13 22-13 22z", "M24 15a5 5 0 1 0 0.01 0z"] },
  bandeira: { tracos: ["M12 42V7", "M12 8h24l-5 8 5 8H12"] },
  // tênis de corrida, de lado
  tenis: { tracos: ["M5 31c0-4 2-6 5-6l6-1 5-9 6 4 6 7 8 2c3 1 4 3 4 5v2H5z", "M5 34h40", "M21 19l3 3", "M25 16l3 3"] },
  cronometro: { tracos: ["M24 13a14 14 0 1 0 0 28a14 14 0 1 0 0-28z", "M24 20v8l5 3", "M20 7h8", "M24 7v6"] },
} satisfies Record<string, Desenho>;

export type NomeIcone = keyof typeof DESENHOS;

export const Icone: React.FC<{ nome: NomeIcone; tamanho: number; cor: string; p?: number; peso?: number; style?: React.CSSProperties }> = ({
  nome,
  tamanho,
  cor,
  p = 1,
  peso = 3.6,
  style,
}) => {
  const d: Desenho = DESENHOS[nome] ?? DESENHOS.coracao;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" style={{ display: "block", flexShrink: 0, overflow: "visible", ...style }}>
      {d.cheios?.map((c, i) => <path key={`c${i}`} d={c} fill={cor} stroke={cor} strokeWidth={0.5} opacity={p > 0.6 ? 1 : 0} />)}
      {d.tracos.map((tr, i) => {
        const n = d.tracos.length;
        const pi = Math.min(1, Math.max(0, p * n - i));
        return <Traco key={i} d={tr} p={pi} cor={cor} largura={peso} />;
      })}
    </svg>
  );
};
