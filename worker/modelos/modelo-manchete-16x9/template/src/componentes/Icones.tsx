// Ícones de traço do Manchete (desenho próprio em grade 24×24, traço redondo). Entram se desenhando
// (o traço corre do começo ao fim em 0,7 s) e depois "respiram" devagar: nunca ficam parados.
// A lista de nomes é a do tipo `Icone` em plano.ts (+ os 4 do cta).
import type { Icone as NomeIcone } from "../plano";
import { prog } from "../tema";

type Forma = string[];

// cada item é um caminho SVG (círculos e retângulos escritos como caminhos, para o traço correr)
const circulo = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;

export const FORMAS: Record<NomeIcone | "salvar" | "seguir" | "comentar" | "link", Forma> = {
  carrinho: ["M2 3h2.6l2.5 11.2a1.6 1.6 0 0 0 1.6 1.3h8.8a1.6 1.6 0 0 0 1.6-1.2L21 7H5.4", circulo(9, 20, 1.4), circulo(17.5, 20, 1.4)],
  etiqueta: ["M3 4.5v6.2a1.5 1.5 0 0 0 .44 1.06l8.8 8.8a1.5 1.5 0 0 0 2.12 0l6.2-6.2a1.5 1.5 0 0 0 0-2.12l-8.8-8.8A1.5 1.5 0 0 0 10.7 3H4.5A1.5 1.5 0 0 0 3 4.5z", circulo(7.6, 7.6, 1.2)],
  relogio: [circulo(12, 12, 9), "M12 7v5.2l3.4 2"],
  alerta: ["M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z", "M12 9.2v4.3", "M12 17.2h.01"],
  certo: [circulo(12, 12, 9), "M8 12.3l2.7 2.7L16.2 9.4"],
  errado: [circulo(12, 12, 9), "M9 9l6 6", "M15 9l-6 6"],
  dinheiro: ["M3.5 6.5h17a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z", circulo(12, 12, 2.4), "M6 12h.01", "M18 12h.01"],
  casa: ["M3.5 10.2 12 3.5l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z", "M9.5 20.5v-6h5v6"],
  coracao: ["M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"],
  ideia: ["M9 17.5h6", "M10 21h4", "M8.6 14.6A6 6 0 1 1 15.4 14.6c-.7.6-1.1 1.4-1.2 2.2H9.8c-.1-.8-.5-1.6-1.2-2.2z"],
  calendario: ["M4.5 5h15a1 1 0 0 1 1 1v13.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z", "M3.5 10h17", "M8 3v4", "M16 3v4"],
  seta: ["M4 12h16", "M13.5 5.5 20 12l-6.5 6.5"],
  estrela: ["M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"],
  lupa: [circulo(10.5, 10.5, 6.5), "M15.3 15.3 21 21"],
  sobe: ["M3 17.5l6-6 4 4L21 7.5", "M15 7.5h6v6"],
  cai: ["M3 6.5l6 6 4-4 8 8", "M15 16.5h6v-6"],
  pessoa: [circulo(12, 8, 4), "M4.5 20.5a7.5 7.5 0 0 1 15 0"],
  raio: ["M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z"],
  salvar: ["M6.5 3.5h11a1 1 0 0 1 1 1v16L12 16.5l-6.5 4v-16a1 1 0 0 1 1-1z"],
  seguir: [circulo(9.5, 8, 3.8), "M3 20a6.5 6.5 0 0 1 13 0", "M19 8v6", "M16 11h6"],
  comentar: ["M4 5.5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 3.5v-3.5H4a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1z", "M7.5 10.5h9", "M7.5 13.5h5"],
  link: ["M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4l-1.4 1.4", "M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.4-1.4"],
};

export const IconeTraco: React.FC<{
  nome: keyof typeof FORMAS;
  tamanho: number;
  cor: string;
  t: number;
  em: number;
  // espessura do traço na grade 24×24
  traco?: number;
}> = ({ nome, tamanho, cor, t, em, traco = 1.6 }) => {
  const formas = FORMAS[nome] ?? FORMAS.seta;
  const p = prog(t, em, 0.75);
  if (p <= 0) return null;
  // depois de desenhado, respira devagar (±3%)
  const respiro = 1 + 0.03 * Math.sin(Math.max(0, t - em - 0.75) * 2.2);
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ overflow: "visible", transform: `scale(${respiro})` }}>
      {formas.map((d, i) => {
        // os traços entram um depois do outro
        const n = formas.length;
        const passo = Math.min(0.25, 0.5 / n);
        const pi = Math.min(1, Math.max(0, (p - i * passo) / (1 - (n - 1) * passo)));
        if (pi <= 0) return null;
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={cor}
            strokeWidth={traco}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={pi >= 1 ? undefined : 1}
            strokeDashoffset={pi >= 1 ? undefined : 1 - pi}
          />
        );
      })}
    </svg>
  );
};
