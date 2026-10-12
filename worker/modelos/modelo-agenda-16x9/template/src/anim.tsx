import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";
import { ESCALA, H, W } from "./tema";

// A tela virtual do quadro deitado (2400×1350 unidades, reduzida a ESCALA): tudo o que é desenho da
// agenda fica dentro dela; só o vídeo da pessoa vai em px de verdade do quadro.
export const Tela: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `scale(${ESCALA})`, transformOrigin: "0 0", ...style }}>{children}</div>
);

// Movimento de agenda: o bloco cai decidido e assenta no horário, sem quique.
export const assenta = Easing.bezier(0.18, 0.9, 0.22, 1);
// trocas de layout: arranca e freia (mesma família da caixa da pessoa no motor)
export const troca = Easing.bezier(0.65, 0, 0.35, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = assenta) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso de uma saída (0 = na tela, 1 = saiu), terminando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.25) => prog(t, ate - dur, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export type Ret = { x: number; y: number; w: number; h: number };
export const misturaRet = (a: Ret, b: Ret, p: number): Ret => ({
  x: mistura(a.x, b.x, p),
  y: mistura(a.y, b.y, p),
  w: mistura(a.w, b.w, p),
  h: mistura(a.h, b.h, p),
});

// Mistura duas cores #RRGGBB
export const misturaCor = (a: string, b: string, p: number) => {
  const c = (s: string, i: number) => parseInt(s.slice(1 + i * 2, 3 + i * 2), 16);
  const v = [0, 1, 2].map((i) => Math.round(mistura(c(a, i), c(b, i), limitar(p))));
  return `#${v.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
};

// ---------- horários ----------

// "09:00" → minutos desde 00:00
export const lerHora = (h?: string) => {
  const m = (h ?? "").match(/^(\d{1,2})[:h](\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
export const escreverHora = (minutos: number) => {
  const total = ((Math.round(minutos) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

// ---------- texto falado ----------

const NUMEROS: Record<string, string[]> = {
  "1": ["um", "uma", "primeiro", "primeira"],
  "2": ["dois", "duas", "segundo", "segunda"],
  "3": ["tres", "terceiro", "terceira"],
  "4": ["quatro", "quarto", "quarta"],
  "5": ["cinco", "quinto", "quinta"],
  "10": ["dez"],
  "15": ["quinze"],
  "20": ["vinte"],
  "25": ["vinte", "vinteecinco"],
  "30": ["trinta"],
  "45": ["quarentaecinco"],
  "60": ["sessenta"],
};

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

const casa = (escrita: string, falada: string) => {
  const a = normalizar(escrita);
  const b = normalizar(falada);
  if (!a) return false;
  if (a === b) return true;
  if (NUMEROS[a]?.includes(b) || NUMEROS[b]?.includes(a)) return true;
  const pra = ["pra", "para"];
  return pra.includes(a) && pra.includes(b);
};

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto enxugado continua no ritmo).
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const achou = faladas.findIndex((p, k) => k >= cursor && casa(w, p.w));
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, inicio - 0.12);
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.04));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.14);
  }
  return tempos;
};

// Texto que se monta palavra por palavra: cada palavra sobe de trás de uma régua, no seu tempo.
// Antes disso ela espera "a lápis" na cor `esboco`; na hora, a palavra a lápis rola para cima e a
// palavra cheia entra por baixo (como um contador de agenda) — as duas nunca se sobrepõem.
// Fora da animação, só uma camada é desenhada (a lápis antes, o texto final limpo depois).
// O espaço entre palavras é margem fixa. `base` = índice da primeira palavra em `tempos`.
export const Palavras: React.FC<{
  texto: string;
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  corDe?: (i: number) => string | undefined;
  alinhar?: "left" | "center";
  esboco?: string;
  // some palavra por palavra a partir deste instante (opcional)
  saiEm?: number;
  base?: number;
}> = ({ texto, tempos, t, style, corDe, alinhar = "left", esboco, saiEm, base = 0 }) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: alinhar === "center" ? "center" : "flex-start", ...style }}>
      {palavras.map((w, j) => {
        const i = base + j;
        const p = prog(t, tempos[i] ?? 0, 0.34);
        const s = saiEm === undefined ? 0 : prog(t, saiEm + j * 0.03, 0.22, saida);
        const caixa: React.CSSProperties = {
          position: "relative",
          display: "inline-block",
          overflow: "hidden",
          paddingBottom: "0.12em",
          marginBottom: "-0.12em",
          marginRight: j < palavras.length - 1 ? "0.24em" : 0,
        };
        // parado: uma camada só
        if (s === 0 && (p >= 1 || (p <= 0 && esboco))) {
          return (
            <span key={`${w}-${j}`} style={caixa}>
              <span style={{ display: "inline-block", color: p >= 1 ? corDe?.(i) : esboco }}>{w}</span>
            </span>
          );
        }
        if (s >= 1) return <span key={`${w}-${j}`} style={{ ...caixa, color: "transparent" }}>{w}</span>;
        return (
          <span key={`${w}-${j}`} style={caixa}>
            {esboco ? (
              <span style={{ display: "inline-block", color: esboco, opacity: 1 - s, translate: `0 ${-p * 105}%` }}>{w}</span>
            ) : null}
            <span
              style={{
                display: "inline-block",
                position: esboco ? "absolute" : undefined,
                left: 0,
                top: 0,
                translate: `0 ${(1 - p) * 105 - s * 105}%`,
                color: corDe?.(i),
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

// O mesmo, com as linhas já quebradas pela medida (cada linha numa fileira que não quebra de novo)
export const Linhas: React.FC<{
  linhas: string[][];
  tempos: number[];
  t: number;
  tamanho: number;
  entrelinha?: number;
  peso?: number;
  cor?: string;
  corDe?: (i: number) => string | undefined;
  alinhar?: "left" | "center";
  esboco?: string;
  saiEm?: number;
  espacamento?: string;
  style?: React.CSSProperties;
}> = ({ linhas, tempos, t, tamanho, entrelinha = 1.06, peso = 800, cor, corDe, alinhar = "left", esboco, saiEm, espacamento = "-0.02em", style }) => {
  let base = 0;
  return (
    <div style={{ fontSize: tamanho, fontWeight: peso, lineHeight: entrelinha, letterSpacing: espacamento, color: cor, ...style }}>
      {linhas.map((l, k) => {
        const b = base;
        base += l.length;
        return (
          <Palavras
            key={k}
            texto={l.join(" ")}
            tempos={tempos}
            base={b}
            t={t}
            corDe={corDe}
            alinhar={alinhar}
            esboco={esboco}
            saiEm={saiEm}
            style={{ flexWrap: "nowrap", whiteSpace: "nowrap" }}
          />
        );
      })}
    </div>
  );
};

// Traço SVG que se desenha (p de 0 a 1 ao longo do caminho).
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
