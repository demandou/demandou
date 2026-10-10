import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";
import { COR } from "./tema";

// Movimento do Dossiê: a câmera viaja suave e decidida; o papel assenta sem quicar; o carimbo bate seco.
export const assenta = Easing.bezier(0.16, 1, 0.3, 1);
export const viaja = Easing.bezier(0.62, 0, 0.32, 1);
export const bate = Easing.in(Easing.quad);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

export const prog = (t: number, inicio: number, dur: number, easing = assenta) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

export const limitar = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;

// Número pseudoaleatório estável (mesmo valor em todo quadro).
export const acaso = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
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
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.03));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.12);
  }
  return tempos;
};

// Nenhuma palavra antes de `inicio`, e nunca duas no mesmo instante.
export const aPartirDe = (tempos: number[], inicio: number, passo = 0.08) => {
  const saida: number[] = [];
  tempos.forEach((x, i) => {
    let y = Math.max(x, inicio);
    if (i > 0) y = Math.max(y, saida[i - 1] + passo);
    saida.push(y);
  });
  return saida;
};

// Máquina de escrever (Special Elite, só textos curtos): cada letra bate no seu instante. O texto
// inteiro ocupa o lugar desde o começo (nada pula). Terminado, vira uma camada simples.
export const Datilo: React.FC<{ texto: string; em: number; t: number; dur?: number; style?: React.CSSProperties }> = ({ texto, em, t, dur, style }) => {
  const d = dur ?? Math.min(0.75, Math.max(0.18, texto.length * 0.032));
  if (t >= em + d) return <span style={{ whiteSpace: "pre", ...style }}>{texto}</span>;
  const letras = Array.from(texto);
  const n = t < em ? 0 : Math.ceil(limitar((t - em) / d) * letras.length);
  return (
    <span style={{ whiteSpace: "pre", ...style }}>
      {letras.map((c, i) => (
        <span key={i} style={{ opacity: i < n ? 1 : 0 }}>
          {c}
        </span>
      ))}
    </span>
  );
};

// Texto falado em Sora, palavra por palavra: cada palavra sobe 0,16 em e aparece quando é dita.
// `enfase` = palavras [de, até] que ganham a tarja de tinta (fundo tinta, letra papel), que corre da
// esquerda para a direita em `enfaseEm`; `risco` = palavras riscadas a tinta em `riscoEm`.
// Terminada a entrada, o texto fica desenhado simples (sem camada de animação).
export const Falado: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  tamanho: number;
  peso?: number;
  cor?: string;
  entrelinha?: number;
  alinhar?: "left" | "center";
  enfase?: [number, number] | null;
  enfaseEm?: number;
  corEnfase?: string;
  corTextoEnfase?: string;
  risco?: [number, number] | null;
  riscoEm?: number;
  espacamento?: string;
}> = ({ linhas, tempos, t, tamanho, peso = 800, cor = COR.tinta, entrelinha = 1.08, alinhar = "left", enfase, enfaseEm, corEnfase = COR.tinta, corTextoEnfase = COR.papel, risco, riscoEm = 0, espacamento = "-0.015em" }) => {
  const ultimo = Math.max(0, ...tempos);
  const pronto = t >= ultimo + 0.3;
  let indice = 0;
  return (
    <div style={{ fontFamily: "inherit", fontSize: tamanho, fontWeight: peso, lineHeight: entrelinha, color: cor, textAlign: alinhar, letterSpacing: espacamento }}>
      {linhas.map((linha, k) => {
        const ws = linha.split(/\s+/).filter(Boolean);
        const inicio = indice;
        indice += ws.length;
        return (
          <div key={k} style={{ whiteSpace: "nowrap" }}>
            {ws.map((w, j) => {
              const i = inicio + j;
              const p = pronto ? 1 : prog(t, tempos[i] ?? 0, 0.24);
              const emTarja = enfase && i >= enfase[0] && i <= enfase[1];
              const pt = emTarja ? prog(t, (enfaseEm ?? tempos[enfase[0]] ?? 0) + (i - enfase[0]) * 0.08, 0.26) : 0;
              const ultimaDaLinha = j === ws.length - 1;
              const seguidaDeTarja = emTarja && enfase && i + 1 <= enfase[1] && !ultimaDaLinha;
              const riscada = risco && i >= risco[0] && i <= risco[1];
              const pr = riscada ? prog(t, riscoEm + (i - risco[0]) * 0.1, 0.22) : 0;
              return (
                <span
                  key={j}
                  style={{
                    display: "inline-block",
                    position: "relative",
                    marginRight: ultimaDaLinha ? 0 : seguidaDeTarja ? 0 : "0.26em",
                    paddingRight: seguidaDeTarja ? "0.26em" : undefined,
                    opacity: p,
                    transform: pronto || p >= 1 ? undefined : `translateY(${(1 - p) * 0.16}em)`,
                    color: emTarja && pt > 0.45 ? corTextoEnfase : undefined,
                  }}
                >
                  {emTarja && pt > 0 ? (
                    <span
                      style={{
                        position: "absolute",
                        left: "-0.1em",
                        right: seguidaDeTarja ? 0 : "-0.1em",
                        top: "0.04em",
                        bottom: "-0.02em",
                        background: corEnfase,
                        transformOrigin: "left center",
                        transform: pt < 1 ? `scaleX(${pt})` : undefined,
                        zIndex: 0,
                      }}
                    />
                  ) : null}
                  <span style={{ position: "relative", zIndex: 1 }}>{w}</span>
                  {riscada && pr > 0 ? (
                    <span style={{ position: "absolute", left: "-0.05em", top: "52%", height: "0.1em", width: `calc(${pr * 100}% + ${pr * 0.1}em)`, background: COR.tinta, zIndex: 2 }} />
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
