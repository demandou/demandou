import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de app: chega decidido e assenta, sem quique nem elástico.
export const chega = Easing.bezier(0.2, 0.9, 0.25, 1);
// a rolagem da conversa: como o dedo soltando a tela
export const rola = Easing.bezier(0.33, 0, 0.12, 1);
const sai = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = chega) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso de uma saída (0 = na tela, 1 = saiu), terminando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.25) => prog(t, ate - dur, dur, sai);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Mistura de duas cores hex (#RRGGBB) — para o balão que "esfria"
export const misturaCor = (a: string, b: string, p: number) => {
  const ca = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const cb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = ca.map((v, i) => Math.round(mistura(v, cb[i], limitar(p))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

// ---------- texto falado ----------

const NUMEROS: Record<string, string[]> = {
  "1": ["um", "uma", "primeiro", "primeira"],
  "2": ["dois", "duas", "segundo", "segunda"],
  "3": ["tres", "terceiro", "terceira"],
  "4": ["quatro", "quarto"],
  "5": ["cinco", "quinto"],
  "6": ["seis", "sexto"],
  "7": ["sete", "setimo"],
  "8": ["oito", "oitavo"],
  "9": ["nove", "nono"],
  "10": ["dez", "decimo"],
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
  if (NUMEROS[a]?.includes(b)) return true;
  const pra = ["pra", "para"];
  return pra.includes(a) && pra.includes(b);
};

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas do trecho.
// Palavra não achada entra logo depois da anterior (texto reescrito continua no ritmo da fala).
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.4 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const achou = faladas.findIndex((p, k) => k >= cursor && casa(w, p.w));
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, inicio - 0.1);
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.04));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.1);
  }
  return tempos;
};

// Linhas de texto que se escrevem palavra por palavra (como quem digita), cada palavra no seu tempo.
// As linhas já vêm quebradas (a altura é conhecida); o espaço entre palavras é uma margem fixa.
export const Digitado: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  // cor por palavra (índice global), opcional
  corDe?: (i: number) => string | undefined;
  style?: React.CSSProperties;
  alinhar?: "left" | "center" | "right";
  // palavras ainda não ditas ficam apagadas (true) ou invisíveis (false)
  rascunho?: boolean;
}> = ({ linhas, tempos, t, corDe, style, alinhar = "left", rascunho = false }) => {
  let k = 0;
  return (
    <div style={{ ...style }}>
      {linhas.map((linha, li) => (
        <div
          key={`${linha}-${li}`}
          style={{ display: "flex", whiteSpace: "nowrap", justifyContent: alinhar === "center" ? "center" : alinhar === "right" ? "flex-end" : "flex-start" }}
        >
          {linha.split(" ").map((w, wi, arr) => {
            const i = k++;
            const p = prog(t, tempos[i] ?? 0, 0.22);
            // palavra que já terminou de entrar: texto simples, sem opacidade nem deslocamento
            const pronta = p >= 1;
            return (
              <span
                key={`${w}-${wi}`}
                style={{
                  display: "inline-block",
                  marginRight: wi < arr.length - 1 ? "0.26em" : 0,
                  opacity: pronta ? undefined : rascunho ? 0.22 + 0.78 * p : p,
                  translate: pronta ? undefined : `0 ${(1 - p) * 0.18}em`,
                  color: corDe?.(i),
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Traço SVG que se desenha (p de 0 a 1 ao longo do caminho)
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

// Os índices (na ordem das palavras do texto) de um trecho exato ("Saiba Mais" em "Toca em Saiba Mais")
export const indicesDoTrecho = (texto: string, trecho?: string): Set<number> => {
  const saida = new Set<number>();
  if (!trecho) return saida;
  const ws = texto.split(/\s+/).filter(Boolean).map(normalizar);
  const alvo = trecho.split(/\s+/).filter(Boolean).map(normalizar);
  if (!alvo.length) return saida;
  for (let i = 0; i + alvo.length <= ws.length; i++) {
    if (alvo.every((a, k) => ws[i + k] === a)) {
      for (let k = 0; k < alvo.length; k++) saida.add(i + k);
      return saida;
    }
  }
  return saida;
};

// Texto de balão que se escreve na fala (cada palavra no seu tempo), com:
// - `trava`: palavras que "travam" quando ditas (fundo escuro, letra no acento) — o destaque;
// - `risco`: palavras riscadas por um traço que corre a partir de `em`.
// Terminada a entrada de todas as palavras, desenha o texto simples (sem camadas de animação).
export const TextoVivo: React.FC<{
  linhas: string[];
  // null = texto já pronto (sem digitar)
  tempos: number[] | null;
  t: number;
  linhaH: number;
  trava?: { indices: Set<number>; fundo: string; cor: string };
  risco?: { indices: Set<number>; em: number; cor: string };
  // palavras ainda não ditas ficam apagadas (true) em vez de invisíveis
  rascunho?: boolean;
  style?: React.CSSProperties;
}> = ({ linhas, tempos, t, linhaH, trava, risco, rascunho, style }) => {
  const total = linhas.reduce((n, l) => n + l.split(" ").length, 0);
  const ultimo = tempos ? Math.max(...tempos.slice(0, total), 0) : -1;
  const semEfeito = (!trava || trava.indices.size === 0) && (!risco || risco.indices.size === 0);
  if (semEfeito && (!tempos || t >= ultimo + 0.25)) {
    return (
      <div style={style}>
        {linhas.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap", height: linhaH, lineHeight: `${linhaH}px` }}>
            {l}
          </div>
        ))}
      </div>
    );
  }
  const riscadas = risco ? [...risco.indices].sort((a, b) => a - b) : [];
  let k = 0;
  return (
    <div style={style}>
      {linhas.map((linha, li) => (
        <div key={`${linha}-${li}`} style={{ display: "flex", whiteSpace: "nowrap", height: linhaH, alignItems: "center" }}>
          {linha.split(" ").map((w, wi, arr) => {
            const i = k++;
            const p = tempos ? prog(t, tempos[i] ?? 0, 0.22) : 1;
            const pronta = p >= 1;
            const travada = trava?.indices.has(i) ? prog(t, (tempos?.[i] ?? 0) + 0.08, 0.28) : 0;
            const r = riscadas.indexOf(i);
            const pr = risco && r >= 0 ? limitar(prog(t, risco.em, 0.45, (x) => x) * riscadas.length - r) : 0;
            const continua = r >= 0 && riscadas.includes(i + 1) && wi < arr.length - 1;
            return (
              <span
                key={`${w}-${wi}`}
                style={{
                  position: "relative",
                  display: "inline-block",
                  marginRight: wi < arr.length - 1 ? "0.26em" : 0,
                  opacity: pronta ? undefined : rascunho ? 0.3 + 0.7 * p : p,
                  translate: pronta ? undefined : `0 ${(1 - p) * 0.18}em`,
                }}
              >
                {travada > 0 && trava ? (
                  <span
                    style={{
                      position: "absolute",
                      left: "-0.14em",
                      right: "-0.14em",
                      top: "0.02em",
                      bottom: "-0.04em",
                      borderRadius: "0.16em",
                      background: trava.fundo,
                      opacity: travada,
                    }}
                  />
                ) : null}
                <span style={{ position: "relative", color: travada > 0.5 && trava ? trava.cor : undefined, opacity: pr > 0 ? 1 - 0.45 * pr : undefined }}>{w}</span>
                {pr > 0 && risco ? (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "54%",
                      height: "0.09em",
                      borderRadius: "0.05em",
                      width: `calc((100% + ${continua ? "0.26em" : "0em"}) * ${pr})`,
                      background: risco.cor,
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
};
