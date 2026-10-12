import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ESPACO, type Fonte } from "./medida";
import type { Palavra } from "./plano";
import { sans, serif } from "./tema";

// Movimento editorial: entra decidido, assenta sem quicar.
export const suave = Easing.bezier(0.16, 1, 0.3, 1);
// contador: acelera e desacelera como um número sendo apurado
export const apuracao = Easing.bezier(0.4, 0, 0.2, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = suave) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso da saída de um momento (0 = na tela, 1 = saiu).
export const saindo = (t: number, ate: number, dur = 0.24) => prog(t, ate - dur, dur, saida);

export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Linha que sobe de trás de uma máscara. Terminada a subida, é desenhada como texto simples,
// sem a camada de máscara (quadros capturados não perdem a linha).
export const Linha: React.FC<{
  p: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ p, children, style }) =>
  p >= 0.999 ? (
    <div style={{ paddingBottom: "0.16em", marginBottom: "-0.16em" }}>
      <div style={style}>{children}</div>
    </div>
  ) : (
    <div style={{ overflow: "hidden", paddingBottom: "0.16em", marginBottom: "-0.16em" }}>
      <div style={{ translate: `0 ${(1 - p) * 110}%`, ...style }}>{children}</div>
    </div>
  );

// Bloco de um momento: some subindo de leve na saída.
export const Bloco: React.FC<{
  t: number;
  ate: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ t, ate, children, style }) => {
  const s = saindo(t, ate);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: 1 - s,
        translate: `0 ${-14 * s}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ---------- a fala: quando cada palavra da tela é dita ----------

const NUMEROS: Record<string, string[]> = {
  "1": ["um", "uma", "primeiro", "primeira"],
  "2": ["dois", "duas", "segundo", "segunda"],
  "3": ["tres", "terceiro", "terceira"],
  "4": ["quatro", "quarto", "quarta"],
  "5": ["cinco", "quinto", "quinta"],
  "6": ["seis", "sexto", "sexta"],
  "7": ["sete", "setimo", "setima"],
  "8": ["oito", "oitavo", "oitava"],
  "9": ["nove", "nono", "nona"],
  "10": ["dez", "decimo", "decima"],
};

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// a palavra escrita na tela corresponde à falada? ("3" ↔ "três", "pra" ↔ "para")
const casa = (escrita: string, falada: string) => {
  const a = normalizar(escrita);
  const b = normalizar(falada);
  if (!a || !b) return false;
  if (a === b) return true;
  if (NUMEROS[a]?.includes(b) || NUMEROS[b]?.includes(a)) return true;
  const pra = ["pra", "para"];
  return pra.includes(a) && pra.includes(b);
};

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas a partir de
// `inicio` (até `ate`). Palavra não achada entra logo depois da anterior (texto enxugado continua no
// ritmo). Nada entra antes de `inicio`.
export const temposDoTexto = (texto: string, palavras: Palavra[], inicio: number, ate: number) => {
  const faladas = palavras.filter((p) => p.em >= inicio - 0.3 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const achou = faladas.findIndex((p, k) => k >= cursor && casa(w, p.w));
    const anterior = tempos[tempos.length - 1] ?? inicio - 0.14;
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior + 0.04, inicio, faladas[achou].em - 0.05));
      cursor = achou + 1;
    } else tempos.push(Math.max(inicio, anterior + 0.14));
  }
  return tempos;
};

// índices (na sequência de palavras do texto) que pertencem a um trecho exato do texto
export const indicesDoTrecho = (texto: string, trecho?: string) => {
  if (!trecho) return new Set<number>();
  const ws = texto.split(/\s+/).filter(Boolean).map(normalizar);
  const alvo = trecho.split(/\s+/).filter(Boolean).map(normalizar);
  if (!alvo.length) return new Set<number>();
  for (let i = 0; i + alvo.length <= ws.length; i++) {
    if (alvo.every((a, k) => ws[i + k] === a)) return new Set(alvo.map((_, k) => i + k));
  }
  return new Set<number>();
};

export const cssDaFonte = (f: Fonte): React.CSSProperties => ({
  fontFamily: f.familia === "sans" ? sans : serif,
  fontStyle: f.italico ? "italic" : "normal",
  fontWeight: f.peso ?? 400,
});

export type Marca = { tipo: "sublinhado" | "risco" | "grifo"; cor: string; p: number; liga?: boolean };

// Preenchimento de uma marca que corre por um grupo de palavras (proporcional à largura de cada uma):
// devolve, para a palavra i, quanto dela já foi marcado quando o grupo inteiro está em `p`.
export const marcaNoGrupo = (indices: number[], larguras: number[], p: number) => {
  const total = indices.reduce((s, i) => s + larguras[i], 0) || 1;
  const fim = p * total;
  const mapa = new Map<number, number>();
  let acumulado = 0;
  for (const i of indices) {
    mapa.set(i, limitar((fim - acumulado) / (larguras[i] || 1)));
    acumulado += larguras[i];
  }
  return mapa;
};

// Texto que se monta palavra por palavra: cada palavra sobe de trás de uma máscara no seu tempo.
// As linhas vêm medidas e quebradas (src/medida.ts), então nada pula de lugar: a palavra ainda
// não dita só reserva o espaço. Terminada a subida, a palavra é texto simples, sem máscara.
// Espaço entre palavras: margem fixa (nunca o caractere de espaço dentro de spans animados).
export const Palavras: React.FC<{
  linhas: { w: string; i: number }[][];
  tempos: number[];
  t: number;
  tamanho: number;
  alturaLinha?: number;
  alinhar?: "left" | "center";
  estilo: (i: number) => Fonte;
  cor: (i: number) => string;
  // marca numa palavra: sublinhado (latão), risco (lacre) ou grifo (marca-texto atrás);
  // `p` = quanto da palavra já foi marcado (0–1); `liga` = a marca segue até a próxima palavra
  marca?: (i: number) => Marca | null;
  // opacidade por palavra (palavra riscada apaga um pouco)
  opacidade?: (i: number) => number;
  style?: React.CSSProperties;
  dur?: number;
}> = ({ linhas, tempos, t, tamanho, alturaLinha = 1.04, alinhar = "center", estilo, cor, marca, opacidade, style, dur = 0.36 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: alinhar === "center" ? "center" : "flex-start", ...style }}>
    {linhas.map((linha, k) => (
      <div
        key={k}
        style={{ position: "relative", display: "flex", whiteSpace: "nowrap", fontSize: tamanho, lineHeight: alturaLinha }}
      >
        {linha.map((p, j) => {
          const progresso = prog(t, tempos[p.i] ?? 0, dur);
          const acesa = progresso >= 0.999;
          const base: React.CSSProperties = {
            ...cssDaFonte(estilo(p.i)),
            color: cor(p.i),
            display: "inline-block",
            // acima do grifo (que é absoluto e vem antes)
            position: "relative",
            opacity: opacidade?.(p.i) ?? 1,
          };
          const mk = marca?.(p.i);
          const ligada = mk?.liga && j < linha.length - 1;
          return (
            <span
              key={`${p.w}-${p.i}`}
              style={{
                position: "relative",
                display: "inline-block",
                marginRight: j < linha.length - 1 ? `${ESPACO}em` : 0,
              }}
            >
              {mk && mk.p > 0.001 && mk.tipo === "grifo" ? (
                <span
                  style={{
                    position: "absolute",
                    left: "-0.04em",
                    top: "0.5em",
                    height: "0.46em",
                    width: `calc((100% + ${ligada ? ESPACO : 0.08}em) * ${mk.p})`,
                    background: mk.cor,
                  }}
                />
              ) : null}
              {/* reserva o lugar da palavra (invisível até ser dita) */}
              <span style={{ ...base, visibility: acesa ? "visible" : "hidden" }}>{p.w}</span>
              {!acesa && progresso > 0.001 ? (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    overflow: "hidden",
                    paddingBottom: "0.16em",
                    marginBottom: "-0.16em",
                    paddingRight: "0.08em",
                  }}
                >
                  <span style={{ ...base, translate: `0 ${(1 - progresso) * 108}%` }}>{p.w}</span>
                </span>
              ) : null}
              {mk && mk.p > 0.001 && mk.tipo !== "grifo" ? (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: mk.tipo === "risco" ? "0.56em" : "1.0em",
                    height: mk.tipo === "risco" ? "max(4px, 0.055em)" : "max(3px, 0.04em)",
                    width: `calc((100% + ${ligada ? ESPACO : 0}em) * ${mk.p})`,
                    background: mk.cor,
                  }}
                />
              ) : null}
            </span>
          );
        })}
      </div>
    ))}
  </div>
);

// Traço SVG que se desenha (p de 0 a 1 ao longo do caminho). Completo, é um traço simples.
export const Traco: React.FC<
  { d: string; p?: number; cor: string; largura: number } & Omit<React.SVGProps<SVGPathElement>, "d" | "stroke" | "strokeWidth">
> = ({ d, p = 1, cor, largura, ...resto }) => {
  if (p <= 0.002) return null;
  const parcial = p < 0.999;
  return (
    <path
      d={d}
      fill="none"
      stroke={cor}
      strokeWidth={largura}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={parcial ? 1 : undefined}
      strokeDasharray={parcial ? `${p} 1` : undefined}
      {...resto}
    />
  );
};
