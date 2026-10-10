import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento clínico: entra decidido e assenta, sem quique. Trocas de lugar com a mesma curva simétrica.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
export const preciso = Easing.bezier(0.65, 0, 0.35, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = entra) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso da saída (0 = na tela, 1 = saiu).
export const saindo = (t: number, ate: number, dur = 0.28) => prog(t, ate - dur, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Mistura duas cores #RRGGBB
export const misturarCor = (a: string, b: string, p: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * limitar(p)));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

// Traço que se desenha sozinho (p de 0 a 1 ao longo do caminho), pontas arredondadas.
export const Traco: React.FC<
  { d: string; p?: number; cor: string; largura: number; tracejado?: string } & Omit<
    React.SVGProps<SVGPathElement>,
    "d" | "stroke" | "strokeWidth"
  >
> = ({ d, p = 1, cor, largura, tracejado, ...resto }) => {
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
      pathLength={parcial && !tracejado ? 1 : undefined}
      strokeDasharray={tracejado ?? (parcial ? `${p} 1` : undefined)}
      {...resto}
    />
  );
};

// ---------- texto falado ----------

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// equivalências comuns entre o que se escreve na tela e o que a transcrição devolve
const EXTENSO: Record<string, string> = {
  um: "1", uma: "1", dois: "2", duas: "2", tres: "3", quatro: "4", cinco: "5",
  seis: "6", sete: "7", oito: "8", nove: "9", dez: "10", pra: "para", pro: "para", primeiro: "1o",
};
const forma = (w: string) => EXTENSO[w] ?? w;
const MESMA = (a: string, b: string) => a === b || forma(a) === forma(b);

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto reescrito continua no ritmo).
// Palavras ditas antes de `inicio` (o componente ainda não estava na tela) entram em cascata a partir dele.
// `busca` = desde quando procurar as palavras na fala (padrão: 0,8 s antes de `de`).
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de, busca = de - 0.8) => {
  const faladas = palavras.filter((p) => p.em >= busca && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const alvo = normalizar(w);
    const achou = alvo ? faladas.findIndex((p, k) => k >= cursor && MESMA(alvo, normalizar(p.w))) : -1;
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, inicio - 0.12);
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.06));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.12);
  }
  return tempos.map((x, i) => Math.max(x, inicio + i * 0.06));
};

// índices das palavras de `texto` que formam o trecho `enfase` (primeira ocorrência)
export const indicesDaEnfase = (palavras: string[], enfase?: string) => {
  const marcadas = new Set<number>();
  const alvo = enfase ? enfase.split(/\s+/).filter(Boolean).map(normalizar) : [];
  if (!alvo.length) return marcadas;
  for (let i = 0; i + alvo.length <= palavras.length; i++) {
    if (alvo.every((a, k) => normalizar(palavras[i + k]) === a)) {
      alvo.forEach((_, k) => marcadas.add(i + k));
      break;
    }
  }
  return marcadas;
};

// Texto que se monta palavra por palavra: cada palavra sobe de trás de uma régua invisível, no seu tempo.
// Espaço entre palavras é margem fixa (não depende do caractere de espaço dentro de spans animados).
export const Palavras: React.FC<{
  texto: string;
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  enfase?: string;
  corEnfase?: string;
  // quebra de linha forçada: índices das palavras que começam uma linha nova
  quebras?: number[];
  // a partir deste instante, as palavras ainda não ditas aparecem como um traço cinza ("a lápis")
  lapisEm?: number;
  corLapis?: string;
}> = ({ texto, tempos, t, style, enfase, corEnfase, quebras = [], lapisEm, corLapis = "#CCD4DF" }) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const marcadas = indicesDaEnfase(palavras, enfase);
  return (
    <div style={{ textWrap: "balance", ...style }}>
      {palavras.map((w, i) => {
        const p = prog(t, tempos[i] ?? 0, 0.42);
        const destaque = marcadas.has(i);
        // terminada a entrada, a palavra fica como texto simples (sem a máscara nem o deslocamento)
        const pronta = p >= 1;
        return (
          <span key={`${w}-${i}`}>
            {quebras.includes(i) && i > 0 ? <br /> : null}
            <span
              style={{
                display: "inline-block",
                overflow: pronta ? "visible" : "hidden",
                paddingBottom: "0.16em",
                marginBottom: "-0.16em",
                paddingTop: "0.04em",
                marginRight: i < palavras.length - 1 ? "0.24em" : 0,
                verticalAlign: "top",
              }}
            >
              {p <= 0 && lapisEm !== undefined && t >= lapisEm ? (
                <span style={{ position: "relative", display: "inline-block", color: "transparent", opacity: prog(t, lapisEm, 0.25) }}>
                  {w}
                  <span style={{ position: "absolute", left: "0.02em", right: "0.02em", top: "0.4em", height: "0.16em", borderRadius: 999, background: corLapis }} />
                </span>
              ) : null}
              <span
                style={
                  p <= 0 && lapisEm !== undefined && t >= lapisEm
                    ? { display: "none" }
                    : pronta
                    ? { display: "inline-block", color: destaque ? corEnfase : undefined }
                    : {
                        display: "inline-block",
                        translate: `0 ${(1 - p) * 104}%`,
                        opacity: 0.2 + 0.8 * p,
                        color: destaque ? corEnfase : undefined,
                      }
                }
              >
                {w}
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
};

// Número com vírgula decimal
export const formatar = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
