import { createContext, useContext } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Contagem, Palavra } from "./plano";

// Movimento de painel de dados: entra rápido e preciso, assenta sem quicar.
export const preciso = Easing.bezier(0.2, 0.8, 0.2, 1);
// para contadores e desenhos de linha: acelera e desacelera como um dado sendo calculado
export const calculo = Easing.bezier(0.45, 0, 0.2, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = preciso) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso da saída (0 = na tela, 1 = saiu), terminando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.26) => prog(t, ate - dur, dur, saida);

// Valor de um contador no tempo t.
export const contar = (t: number, c: Contagem, dur = 1.1) => {
  const de = c.de ?? 0;
  return de + (c.para - de) * prog(t, c.em, dur, calculo);
};

// Revelação horizontal (como um dado sendo impresso na tela): uma máscara abre da esquerda.
export const Revela: React.FC<{
  p: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  deslocamento?: number;
}> = ({ p, children, style, deslocamento = 18 }) =>
  // terminada a revelação, o texto fica desenhado simples, sem máscara nem deslocamento
  p >= 1 ? (
    <div style={style}>{children}</div>
  ) : (
    <div
      style={{
        clipPath: `inset(-20% ${(1 - p) * 100}% -20% 0)`,
        translate: `${(1 - p) * -deslocamento}px 0`,
        opacity: Math.min(1, p * 3),
        ...style,
      }}
    >
      {children}
    </div>
  );

// ——— tempo das palavras faladas, para títulos que se montam no ritmo da fala ———

export const PalavrasCtx = createContext<Palavra[]>([]);
export const usePalavras = () => useContext(PalavrasCtx);

// Para um texto de n palavras que começa a ser falado em `em`: o instante de cada palavra.
// Usa as palavras transcritas a partir de `em`; se o texto tem mais palavras que a fala, as
// que sobram entram logo em seguida.
export const temposDasPalavras = (palavras: Palavra[], em: number, n: number, limite = Infinity) => {
  const faladas = palavras.filter((p) => p.em >= em - 0.12 && p.em < limite);
  const tempos: number[] = [];
  for (let i = 0; i < n; i++) {
    const falada = faladas[i];
    const anterior = tempos[i - 1] ?? em;
    tempos.push(falada ? Math.max(falada.em, anterior) : anterior + 0.12);
  }
  if (tempos.length) tempos[0] = Math.min(tempos[0], em);
  return tempos;
};

// Título que se monta palavra por palavra.
export const PalavraAPalavra: React.FC<{
  texto: string;
  em: number;
  limite?: number;
  style?: React.CSSProperties;
  estiloPalavra?: (palavra: string, i: number) => React.CSSProperties | undefined;
}> = ({ texto, em, limite, style, estiloPalavra }) => {
  const t = useTempo();
  const palavras = usePalavras();
  const lista = texto.split(/\s+/).filter(Boolean);
  const tempos = temposDasPalavras(palavras, em, lista.length, limite);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0 0.26em", ...style }}>
      {lista.map((w, i) => {
        const p = prog(t, tempos[i] - 0.04, 0.24);
        // palavra já assentada: texto simples, sem a camada da entrada
        const entrada = p >= 1 ? {} : { opacity: p, translate: `0 ${(1 - p) * 14}px` };
        return (
          <span key={`${w}-${i}`} style={{ display: "inline-block", ...entrada, ...estiloPalavra?.(w, i) }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};
