// Movimento do Anatomia: a palavra sobe por máscara com leve desfoque (como um rótulo de prancha que
// se revela); os traços se desenham; nada quica.
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";
import { clamp01, EASE_IN, EASE_OUT, K, prog } from "./tema";

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/** palavra que sobe por máscara com leve desfoque; terminada a entrada, vira texto simples */
export const Rise: React.FC<{ at: number; t: number; out?: number; children: React.ReactNode; style?: React.CSSProperties; dur?: number }> = ({ at, t, out, children, style, dur = 0.42 }) => {
  const p = prog(t, at - 0.06, at - 0.06 + dur, EASE_OUT);
  const o = out !== undefined ? prog(t, out, out + 0.3, EASE_IN) : 0;
  if (p >= 1 && o <= 0) return <span style={{ display: "inline-block", ...style }}>{children}</span>;
  return (
    <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", padding: "0.06em 0.04em 0.14em", margin: "-0.06em -0.04em -0.14em", ...style }}>
      <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 105 - o * 30}%)`, filter: `blur(${(1 - p) * 6 + o * 6}px)`, opacity: (0.2 + 0.8 * p) * (1 - o) }}>{children}</span>
    </span>
  );
};

// ---------- texto falado ----------

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto reescrito continua no ritmo).
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const alvo = normalizar(w);
    const achou = alvo ? faladas.findIndex((p, k) => k >= cursor && normalizar(p.w) === alvo) : -1;
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, inicio - 0.1);
    const curta = alvo.length <= 2;
    if (achou >= 0 && achou - cursor <= 6 && faladas[achou].em - anterior < (curta ? 0.8 : 2.2)) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.03));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.12);
  }
  return tempos.map((x) => Math.max(x, inicio - 0.05));
};

// Texto falado em Sora, palavra por palavra (cada palavra sobe na sua vez).
// `enfase` = índices [de, até] das palavras em azul clínico, com um traço fino que se desenha embaixo;
// `risco` = palavras riscadas a tinta em `riscoEm`. Terminada a entrada, fica o texto simples.
export const Falado: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  tamanho: number;
  peso?: number;
  cor?: string;
  entrelinha?: number;
  alinhar?: "left" | "center" | "right";
  enfase?: [number, number] | null;
  corEnfase?: string;
  risco?: [number, number] | null;
  riscoEm?: number;
}> = ({ linhas, tempos, t, tamanho, peso = 700, cor = K.ink, entrelinha = 1.12, alinhar = "left", enfase, corEnfase = K.acc, risco, riscoEm = 0 }) => {
  const ultimo = Math.max(0, ...tempos);
  const pronto = t >= ultimo + 0.5;
  let indice = 0;
  return (
    <div style={{ fontSize: tamanho, fontWeight: peso, lineHeight: entrelinha, color: cor, textAlign: alinhar, letterSpacing: "-0.015em" }}>
      {linhas.map((linha, k) => {
        const ws = linha.split(/\s+/).filter(Boolean);
        const inicio = indice;
        indice += ws.length;
        return (
          <div key={k} style={{ whiteSpace: "nowrap" }}>
            {ws.map((w, j) => {
              const i = inicio + j;
              const at = tempos[i] ?? 0;
              const p = pronto ? 1 : prog(t, at - 0.04, at + 0.34);
              const azul = enfase && i >= enfase[0] && i <= enfase[1];
              const traco = azul ? prog(t, (tempos[enfase[0]] ?? at) + 0.15 + (i - enfase[0]) * 0.08, (tempos[enfase[0]] ?? at) + 0.5 + (i - enfase[0]) * 0.08) : 0;
              const riscada = risco && i >= risco[0] && i <= risco[1];
              const pr = riscada ? prog(t, riscoEm + (i - risco[0]) * 0.1, riscoEm + 0.3 + (i - risco[0]) * 0.1) : 0;
              const ultima = j === ws.length - 1;
              return (
                <span key={j} style={{ display: "inline-block", position: "relative", marginRight: ultima ? 0 : "0.26em", color: azul ? corEnfase : undefined }}>
                  {p >= 1 ? (
                    w
                  ) : (
                    <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", padding: "0.06em 0.04em 0.14em", margin: "-0.06em -0.04em -0.14em" }}>
                      <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 100}%)`, filter: `blur(${(1 - p) * 5}px)`, opacity: 0.2 + 0.8 * p }}>{w}</span>
                    </span>
                  )}
                  {azul && traco > 0 ? (
                    <span style={{ position: "absolute", left: 0, bottom: "-0.02em", height: Math.max(3, tamanho * 0.05), width: `calc(${clamp01(traco) * 100}% + ${ultima || (enfase && i === enfase[1]) ? 0 : 0.26 * clamp01(traco)}em)`, background: corEnfase, borderRadius: 4 }} />
                  ) : null}
                  {riscada && pr > 0 && p > 0.5 ? (
                    <span style={{ position: "absolute", left: "-0.05em", top: "54%", height: Math.max(4, tamanho * 0.075), width: `calc(${pr * 100}% + ${pr * 0.1}em)`, background: K.ink, borderRadius: 4 }} />
                  ) : null}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

/** saída padrão de um bloco: some com desfoque leve nos últimos 0,3 s */
export const saida = (t: number, ate: number) => {
  const o = prog(t, ate - 0.3, ate, EASE_IN);
  return { opacity: 1 - o, filter: o > 0 ? `blur(${o * 6}px)` : undefined, transform: o > 0 ? `translateY(${-o * 18}px)` : undefined } as React.CSSProperties;
};
