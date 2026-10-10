import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// Movimento editorial: entra decidido e assenta, sem quicar.
export const suave = Easing.bezier(0.16, 1, 0.3, 1);
// para deslocamentos longos (rolagem, troca de lugar): acelera e freia
export const viagem = Easing.bezier(0.65, 0, 0.35, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = suave) =>
  interpolate(t, [inicio, inicio + Math.max(0.001, dur)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso da saída (0 = na tela, 1 = saiu), terminando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.24) => prog(t, ate - dur, dur, saida);

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

// Mistura duas cores #RRGGBB
export const mixCor = (a: string, b: string, p: number) => {
  const pa = parseInt(a.slice(1, 7), 16);
  const pb = parseInt(b.slice(1, 7), 16);
  const c = [16, 8, 0].map((s) => Math.round(mix((pa >> s) & 255, (pb >> s) & 255, p)));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

// Palavra de wireframe: nasce como uma barra cinza do tamanho da palavra ("texto fictício")
// e vira a palavra de verdade no instante `em`. Margem fixa entre palavras (não confia no espaço).
export const PalavraWire: React.FC<{
  t: number;
  em: number;
  texto: string;
  barra: string;
  cor?: string;
  margem?: number;
  style?: React.CSSProperties;
}> = ({ t, em, texto, barra, cor, margem = 0.26, style }) => {
  const p = prog(t, em - 0.04, 0.32);
  return (
    <span style={{ position: "relative", display: "inline-block", marginRight: `${margem}em`, whiteSpace: "nowrap", ...style }}>
      <span
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "26%",
          bottom: "20%",
          borderRadius: 999,
          background: barra,
          opacity: 1 - prog(t, em, 0.22),
          transform: `scaleX(${1 - 0.15 * p})`,
          transformOrigin: "left center",
        }}
      />
      <span style={{ position: "relative", display: "inline-block", opacity: p, translate: `0 ${(1 - p) * 0.22}em`, color: cor }}>
        {texto}
      </span>
    </span>
  );
};
