// Ícones de traço, desenhados como a tinta da impressora (num quadrado de 48). Cada um se desenha
// (p de 0 a 1) quando a palavra é dita. Poucos e óbvios: um ícone que confunde é pior que nenhum.
import { Traco } from "../anim";
import type { Icone as Nome } from "../plano";

const circulo = (cx: number, cy: number, r: number) => `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`;

export const TRACOS: Record<Nome, string[]> = {
  // xícara com pires e vapor
  xicara: [
    "M 10 19 H 34 V 27 C 34 33.5 29 37 22 37 C 15 37 10 33.5 10 27 Z",
    "M 34 21.5 C 40.5 21.5 40.5 29.5 34 29.5",
    "M 6 41.5 H 40",
    "M 17 7 C 15 10 19 11.5 17 14.5",
    "M 24.5 7 C 22.5 10 26.5 11.5 24.5 14.5",
  ],
  // tesoura apontando para a direita, como na linha de corte
  tesoura: [circulo(11, 14, 5.5), circulo(11, 34, 5.5), "M 15.5 17.5 L 43 31", "M 15.5 30.5 L 43 17"],
  lapis: ["M 10 38 L 12.5 29.5 L 32 10 L 38 16 L 18.5 35.5 Z", "M 28 14 L 34 20", "M 12.5 29.5 L 18.5 35.5"],
  // balão de comentário
  balao: ["M 12 9 H 36 Q 41 9 41 14 V 28 Q 41 33 36 33 H 22 L 13.5 40 V 33 H 12 Q 7 33 7 28 V 14 Q 7 9 12 9 Z", "M 16.5 21 H 16.6", "M 24 21 H 24.1", "M 31.5 21 H 31.6"],
  calendario: ["M 8 12 H 40 V 40 H 8 Z", "M 8 20 H 40", "M 16 7 V 15", "M 32 7 V 15", "M 15 28 H 19", "M 22 28 H 26", "M 29 28 H 33", "M 15 34 H 19"],
  carrinho: ["M 5 9 H 10.5 L 16 31 H 36 L 41 15 H 12.5", circulo(18.5, 37.5, 2.6), circulo(33.5, 37.5, 2.6)],
  casa: ["M 7 23 L 24 9 L 41 23", "M 12 19 V 39 H 36 V 19", "M 20 39 V 29 H 28 V 39"],
  celular: ["M 16 5 H 32 Q 36 5 36 9 V 39 Q 36 43 32 43 H 16 Q 12 43 12 39 V 9 Q 12 5 16 5 Z", "M 21 37.5 H 27"],
  cartao: ["M 6 12 H 42 V 36 H 6 Z", "M 6 18.5 H 42", "M 11 29.5 H 21"],
  moeda: [circulo(24, 24, 16), "M 24 14.5 V 33.5", "M 29.5 19 Q 24 15.5 19.5 19 Q 17.5 23.5 24 24 Q 30.5 24.5 28.5 29 Q 24 32.5 18.5 29"],
  // marcador de salvar (fita com o corte em V)
  salvar: ["M 13 6 H 35 V 42 L 24 33 L 13 42 Z"],
  // pessoa com o "+" de seguir
  seguir: [circulo(19, 16, 7), "M 6 40 C 6 31 11.5 27 19 27 C 26.5 27 32 31 32 40", "M 38 16 V 28", "M 32 22 H 44"],
  // dois elos de corrente
  link: ["M 21 27 L 27 21", "M 18.5 22 L 13.5 27 Q 9 31.5 13.5 36 Q 18 40.5 22.5 36 L 27.5 31", "M 29.5 26 L 34.5 21 Q 39 16.5 34.5 12 Q 30 7.5 25.5 12 L 20.5 17"],
  comentar: ["M 12 9 H 36 Q 41 9 41 14 V 28 Q 41 33 36 33 H 22 L 13.5 40 V 33 H 12 Q 7 33 7 28 V 14 Q 7 9 12 9 Z", "M 16.5 21 H 16.6", "M 24 21 H 24.1", "M 31.5 21 H 31.6"],
  relogio: [circulo(24, 24, 17), "M 24 13 V 24 L 31 28"],
  coracao: ["M 24 40 C 12 31 6 25 6 17.5 C 6 11.5 10.5 8 15.5 8 C 19.5 8 22.5 10.5 24 13.5 C 25.5 10.5 28.5 8 32.5 8 C 37.5 8 42 11.5 42 17.5 C 42 25 36 31 24 40 Z"],
  alerta: ["M 24 7 L 43 40 H 5 Z", "M 24 18 V 29", "M 24 34.5 V 34.6"],
  grafico: ["M 6 41 H 42", "M 8 33 L 18 23 L 26 29 L 40 13", "M 31 13 H 40 V 22"],
};

export const Icone: React.FC<{ nome: Nome; p?: number; tamanho: number; cor: string; largura?: number; style?: React.CSSProperties }> = ({
  nome,
  p = 1,
  tamanho,
  cor,
  largura = 3.4,
  style,
}) => {
  const tracos = TRACOS[nome] ?? [];
  const n = tracos.length;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" style={{ overflow: "visible", ...style }}>
      {tracos.map((d, i) => {
        // os traços se desenham um depois do outro, sobrepostos um pouco
        const pi = Math.min(1, Math.max(0, p * (n * 0.6 + 0.4) - i * 0.6));
        return <Traco key={i} d={d} p={pi} cor={cor} largura={largura} />;
      })}
    </svg>
  );
};
