import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// Movimento editorial: entra decidido e assenta, sem quique.
export const assenta = Easing.bezier(0.22, 1, 0.36, 1);
// troca de página: acelera e desacelera
export const cruza = Easing.bezier(0.65, 0, 0.35, 1);
// a saída some rápido e por igual: quando o conteúdo novo aparece, o velho já saiu inteiro
const recolhe = Easing.inOut(Easing.quad);

// quanto dura a saída de um momento (ela cruza com a entrada do próximo)
export const SAIDA = 0.22;
// o conteúdo de um momento só aparece depois que o anterior saiu (a foto já está deslizando)
export const ENTRADA = 0.1;

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = assenta) =>
  interpolate(t, [inicio, inicio + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Saída de um momento: começa no `ate` (0 = na tela, 1 = saiu)
export const saida = (t: number, ate: number, dur = SAIDA) => prog(t, ate, dur, recolhe);

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

// Texto que sobe de trás de uma máscara (como uma linha impressa entrando na página)
export const Sobe: React.FC<{
  p: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  inline?: boolean;
}> = ({ p, children, style, inline }) => {
  // terminada a subida, o texto é desenhado simples (sem a máscara nem o deslocamento)
  if (p >= 1)
    return (
      <span style={{ display: inline ? "inline-block" : "block", verticalAlign: "bottom" }}>
        <span style={{ display: "block", ...style }}>{children}</span>
      </span>
    );
  return (
    <span
      style={{
        display: inline ? "inline-block" : "block",
        overflow: "hidden",
        paddingBottom: "0.14em",
        marginBottom: "-0.14em",
        paddingTop: "0.06em",
        marginTop: "-0.06em",
        verticalAlign: "bottom",
      }}
    >
      <span style={{ display: "block", translate: `0 ${(1 - p) * 108}%`, ...style }}>{children}</span>
    </span>
  );
};

// Uma palavra do texto: troca de "a lápis" para tinta quando é dita
export const tinta = (t: number, em: number, dur = 0.28) => prog(t, em - 0.04, dur);
