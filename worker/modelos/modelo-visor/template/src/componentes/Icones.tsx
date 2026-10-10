// Ícones de traço da interface (viewBox 48×48). `p` desenha o ícone de 0 a 1.
import { Traco } from "../anim";
import type { NomeIcone } from "../plano";

type Nome = NomeIcone | "virar" | "foto" | "quadro" | "raio" | "alvo";

const TRACOS: Record<Nome, string[]> = {
  grade: ["M8 8 H40 V40 H8 Z", "M18.7 8 V40", "M29.3 8 V40", "M8 18.7 H40", "M8 29.3 H40"],
  sol: [
    "M24 17 A7 7 0 1 1 23.99 17",
    "M24 5 V10",
    "M24 38 V43",
    "M5 24 H10",
    "M38 24 H43",
    "M10.6 10.6 L14.1 14.1",
    "M33.9 33.9 L37.4 37.4",
    "M37.4 10.6 L33.9 14.1",
    "M14.1 33.9 L10.6 37.4",
  ],
  digital: [
    "M15 36 C12 30 12 22 16 17 C20 12 28 12 32 17 C35 21 35 27 34 31",
    "M19 39 C16 33 16 25 19 21 C22 17 27 17 29.5 21 C31.5 24 31 29 30 33",
    "M23 41 C21 36 20 29 22 25 C23.5 22 26.5 22 27 26 C27.5 30 27 34 26 37",
    "M11 30 C10 22 12 15 18 11 C24 7 32 8 36 14",
  ],
  xis: ["M13 13 L35 35", "M35 13 L13 35"],
  camiseta: ["M17 8 L8 13 L11 21 L15 19 V40 H33 V19 L37 21 L40 13 L31 8 C29 11 27 12.5 24 12.5 C21 12.5 19 11 17 8 Z"],
  check: ["M11 25 L20 34 L37 15"],
  nivel: ["M6 24 H16", "M32 24 H42", "M16 24 H32", "M24 16 V20"],
  lupa: ["M21 9 A12 12 0 1 1 20.99 9", "M30 30 L40 40"],
  seguir: ["M19 9 A7 7 0 1 1 18.99 9", "M6 39 C6 31 12 27 19 27 C23 27 26 28 28 30", "M36 26 V38", "M30 32 H42"],
  salvar: ["M13 7 H35 V41 L24 33 L13 41 Z"],
  comentar: ["M8 10 H40 V33 H21 L12 41 V33 H8 Z", "M16 19 H32", "M16 25 H27"],
  link: ["M21 17 L25 13 C28 10 33 10 36 13 C39 16 39 21 36 24 L32 28", "M27 31 L23 35 C20 38 15 38 12 35 C9 32 9 27 12 24 L16 20", "M19 29 L29 19"],
  virar: [
    "M10 22 C11 15 17 10 24 10 C29 10 33 12.5 35.5 16.5",
    "M36.5 9.5 V17 H29",
    "M38 26 C37 33 31 38 24 38 C19 38 15 35.5 12.5 31.5",
    "M11.5 38.5 V31 H19",
  ],
  foto: ["M7 11 H41 V37 H7 Z", "M7 33 L18 22 L27 31 L32 26 L41 35", "M33 17 A3 3 0 1 1 32.99 17"],
  quadro: ["M8 12 H40 V36 H8 Z", "M14 12 V8 H34 V12"],
  raio: ["M26 5 L12 27 H23 L21 43 L36 20 H25 Z"],
  alvo: ["M8 17 V8 H17", "M31 8 H40 V17", "M40 31 V40 H31", "M17 40 H8 V31", "M24 21 A3 3 0 1 1 23.99 21"],
};

export const Icone: React.FC<{ nome: Nome; tamanho: number; cor: string; p?: number; espessura?: number; style?: React.CSSProperties }> = ({
  nome,
  tamanho,
  cor,
  p = 1,
  espessura = 3,
  style,
}) => {
  const tracos = TRACOS[nome];
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" style={{ overflow: "visible", ...style }}>
      {tracos.map((d, i) => {
        const pi = Math.max(0, Math.min(1, p * tracos.length - i));
        return <Traco key={d} d={d} p={pi} cor={cor} largura={espessura} />;
      })}
    </svg>
  );
};
