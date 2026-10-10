import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { corrigirPalavras } from "./motor/frases";
import type { Palavra, Plano } from "./plano";

// Movimento de camarim: entra macio e decidido, assenta sem quique; nada gira à toa.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
export const vaiVem = Easing.bezier(0.65, 0, 0.35, 1);
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
export const saindo = (t: number, ate: number, dur = 0.3) => prog(t, ate - dur, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Traço que se desenha ao longo do caminho (p de 0 a 1).
export const Traco: React.FC<
  { d: string; p?: number; cor: string; largura: number; opacidade?: number } & Omit<
    React.SVGProps<SVGPathElement>,
    "d" | "stroke" | "strokeWidth"
  >
> = ({ d, p = 1, cor, largura, opacidade = 1, ...resto }) => {
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
      opacity={opacidade}
      pathLength={parcial ? 1 : undefined}
      strokeDasharray={parcial ? `${p} 1` : undefined}
      {...resto}
    />
  );
};

// Traço pontilhado que se desenha (a máscara revela o pontilhado aos poucos).
export const Pontilhado: React.FC<{
  d: string;
  p: number;
  cor: string;
  largura: number;
  id: string;
  passo?: number;
  opacidade?: number;
}> = ({ d, p, cor, largura, id, passo, opacidade = 1 }) => {
  if (p <= 0.002) return null;
  const intervalo = passo ?? largura * 3.2;
  return (
    <g opacity={opacidade}>
      <mask id={id} maskUnits="userSpaceOnUse">
        <path d={d} fill="none" stroke="#fff" strokeWidth={largura * 4} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1`} />
      </mask>
      <path
        d={d}
        fill="none"
        stroke={cor}
        strokeWidth={largura}
        strokeLinecap="round"
        strokeDasharray={`0.1 ${intervalo}`}
        mask={`url(#${id})`}
      />
    </g>
  );
};

// ---------- texto falado ----------

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// palavras já com as correções do plano (o "2." que a transcrição escreveu vira "Dois.")
export const palavrasCorrigidas = (plano: Plano) => corrigirPalavras(plano.palavras, plano.correcoes);

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto reescrito continua no ritmo).
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const alvo = normalizar(w);
    const achou = alvo ? faladas.findIndex((p, k) => k >= cursor && normalizar(p.w) === alvo) : -1;
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, inicio - 0.12);
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.06));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.12);
  }
  return tempos;
};

// Texto que se monta palavra por palavra: cada palavra sobe de trás de uma máscara no seu tempo.
// A `enfase` ganha uma faixa de cor passada por trás (como uma amostra de produto) e muda de cor.
// `marcadas` (índices das palavras) faz o mesmo sem procurar o trecho. `risco`: um traço passa por
// cima das palavras `de`…`ate` (índices) a partir de `em`, da esquerda para a direita.
// Quando a palavra termina de entrar, ela é desenhada como texto simples, sem a máscara (nada de
// camada escondida que possa "apagar" uma palavra já dita num quadro capturado).
export const Palavras: React.FC<{
  texto: string;
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  enfase?: string;
  marcadas?: number[];
  faixa?: { cor: string; texto: string };
  risco?: { de: number; ate: number; em: number; cor: string; dur?: number };
}> = ({ texto, tempos, t, style, enfase, marcadas: indices, faixa, risco }) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const alvo = enfase ? enfase.split(/\s+/).filter(Boolean).map(normalizar) : [];
  const marcadas = new Set<number>(indices ?? []);
  if (alvo.length) {
    for (let i = 0; i + alvo.length <= palavras.length; i++) {
      if (alvo.every((a, k) => normalizar(palavras[i + k]) === a)) {
        alvo.forEach((_, k) => marcadas.add(i + k));
        break;
      }
    }
  }
  const nRisco = risco ? risco.ate - risco.de + 1 : 0;
  return (
    <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "baseline", ...style }}>
      {palavras.map((w, i) => {
        const p = prog(t, tempos[i] ?? 0, 0.42);
        const destaque = marcadas.has(i) && faixa;
        const pf = destaque ? prog(t, (tempos[i] ?? 0) + 0.08, 0.36, vaiVem) : 0;
        const pronta = p >= 0.999;
        const riscada = risco && i >= risco.de && i <= risco.ate;
        // o traço do risco anda palavra a palavra (cada uma é uma fatia do tempo total)
        const pr = riscada ? limitar((t - risco.em) / (risco.dur ?? 0.5) * nRisco - (i - risco.de)) : 0;
        const caixa: React.CSSProperties = {
          position: "relative",
          display: "inline-block",
          paddingBottom: "0.12em",
          marginBottom: "-0.12em",
          // espaço fixo entre palavras (não depende do caractere de espaço)
          marginRight: i < palavras.length - 1 ? "0.26em" : 0,
        };
        const corTexto = destaque && pf > 0.5 ? faixa.texto : undefined;
        return (
          <span key={`${w}-${i}`} style={{ ...caixa, overflow: destaque || pronta ? "visible" : "hidden" }}>
            {destaque ? (
              <span
                style={{
                  position: "absolute",
                  // palavras vizinhas marcadas formam uma faixa só (sem cantos no meio)
                  left: marcadas.has(i - 1) ? "-0.01em" : "-0.16em",
                  right: marcadas.has(i + 1) ? "-0.27em" : "-0.16em",
                  top: "0.1em",
                  bottom: "0.02em",
                  background: faixa.cor,
                  borderTopLeftRadius: marcadas.has(i - 1) ? 0 : "0.28em",
                  borderBottomLeftRadius: marcadas.has(i - 1) ? 0 : "0.28em",
                  borderTopRightRadius: marcadas.has(i + 1) ? 0 : "0.28em",
                  borderBottomRightRadius: marcadas.has(i + 1) ? 0 : "0.28em",
                  transformOrigin: "left center",
                  scale: `${pf} 1`,
                  opacity: pf > 0 ? 1 : 0,
                }}
              />
            ) : null}
            {pronta ? (
              <span style={{ position: "relative", color: corTexto }}>{w}</span>
            ) : (
              <span
                style={{
                  position: "relative",
                  display: "inline-block",
                  translate: `0 ${(1 - p) * 105}%`,
                  opacity: destaque ? p : undefined,
                  color: corTexto,
                }}
              >
                {w}
              </span>
            )}
            {riscada && pr > 0 ? (
              <span
                style={{
                  position: "absolute",
                  left: i === risco.de ? "-0.06em" : "-0.27em",
                  width: `calc((100% + ${i === risco.de ? 0.06 : 0.27}em) * ${pr} + ${i === risco.ate ? 0.06 * pr : 0}em)`,
                  top: "0.5em",
                  height: "0.085em",
                  minHeight: 4,
                  borderRadius: 4,
                  background: risco.cor,
                }}
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
};

// Mistura duas cores "#RRGGBB" (p = 0 → a, 1 → b)
export const misturarCor = (a: string, b: string, p: number) => {
  const h = (x: string) => parseInt(x.replace("#", ""), 16);
  const [ca, cb] = [h(a), h(b)];
  const canal = (n: number, s: number) => Math.round(((n >> s) & 255) * (1 - p) + ((cb >> s) & 255) * p);
  return `rgb(${canal(ca, 16)},${canal(ca, 8)},${canal(ca, 0)})`;
};

// Número com vírgula decimal
export const formatar = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
