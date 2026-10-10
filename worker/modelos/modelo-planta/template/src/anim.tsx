import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { misturarCor } from "./desenho/geometria";
import type { Palavra } from "./plano";

// Movimento de prancheta: preciso, ao longo dos eixos, sem quique nem giro.
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

// Progresso da saída de um momento (0 = na tela, 1 = saiu).
export const saindo = (t: number, ate: number, dur = 0.25) => prog(t, ate - dur, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Traço que se desenha sozinho (progresso p de 0 a 1 ao longo do caminho).
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
      strokeLinecap="butt"
      strokeLinejoin="miter"
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

// Texto que se monta palavra por palavra: cada palavra sobe de trás de uma régua, no seu tempo.
// Terminada a subida, a palavra é desenhada como texto simples (sem a máscara nem o deslocamento).
// Com `rascunho`, o texto inteiro já aparece "a lápis" (cinza claro) a partir de `rascunho.de`
// e cada palavra é passada a nanquim (grafite) quando é falada: sempre há o que ler.
// `risco`: o trecho é riscado em terracota a partir de `risco.em` (palavra por palavra) e recua para o cinza.
export const Palavras: React.FC<{
  texto: string;
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  // trecho exato que fica na cor de acento
  enfase?: string;
  corEnfase?: string;
  pesoEnfase?: number;
  rascunho?: { de: number; corLapis: string; corTinta: string };
  risco?: { trecho: string; em: number; cor: string; corDepois: string };
}> = ({ texto, tempos, t, style, enfase, corEnfase, pesoEnfase, rascunho, risco }) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const marcadas = indicesDoTrecho(palavras, enfase);
  const riscadas = indicesDoTrecho(palavras, risco?.trecho);
  const listaRisco = [...riscadas].sort((a, b) => a - b);
  return (
    // bloco de texto comum (não flex) para o navegador equilibrar as linhas e não deixar palavra sozinha
    <div style={{ textWrap: "balance", ...style }}>
      {agrupar(palavras.map((w, i) => {
        const ultima = i === palavras.length - 1;
        if (rascunho) {
          const tinta = prog(t, (tempos[i] ?? 0) - 0.02, 0.22);
          return (
            <span key={`${w}-${i}`} style={{ color: misturarCor(rascunho.corLapis, rascunho.corTinta, tinta), opacity: prog(t, rascunho.de, 0.35) }}>
              {w}
              {!ultima ? " " : ""}
            </span>
          );
        }
        const p = prog(t, tempos[i] ?? 0, 0.38);
        if (p <= 0) {
          // ainda não dita: ocupa o lugar (as linhas não pulam) sem aparecer
          return (
            <span
              key={`${w}-${i}`}
              style={{ display: "inline-block", paddingBottom: "0.14em", marginBottom: "-0.14em", marginRight: !ultima ? "0.26em" : 0, verticalAlign: "top", visibility: "hidden" }}
            >
              {w}
            </span>
          );
        }
        const destaque = marcadas.has(i);
        const k = listaRisco.indexOf(i);
        const pRisco = risco && k >= 0 ? prog(t, risco.em + k * 0.09, 0.22) : 0;
        const corPalavra = pRisco > 0 && risco ? misturarCor(destaque && corEnfase ? corEnfase : "#1F1F1D", risco.corDepois, pRisco) : destaque ? corEnfase : undefined;
        const conteudo = (
          <span
            style={{
              display: "inline-block",
              position: "relative",
              translate: p < 0.999 ? `0 ${(1 - p) * 105}%` : undefined,
              color: corPalavra,
              fontWeight: destaque ? pesoEnfase : undefined,
            }}
          >
            {w}
            {pRisco > 0 && risco ? (
              <span
                style={{
                  position: "absolute",
                  left: k > 0 ? "-0.27em" : 0,
                  top: "54%",
                  height: "0.07em",
                  minHeight: 4,
                  width: `calc(${pRisco * 100}% + ${k > 0 ? 0.27 * pRisco : 0}em)`,
                  background: risco.cor,
                }}
              />
            ) : null}
          </span>
        );
        // durante a subida, a palavra fica numa máscara; depois, texto simples
        return p < 0.999 ? (
          <span
            key={`${w}-${i}`}
            style={{
              display: "inline-block",
              overflow: "hidden",
              paddingBottom: "0.14em",
              marginBottom: "-0.14em",
              marginRight: !ultima ? "0.26em" : 0,
              verticalAlign: "top",
            }}
          >
            {conteudo}
          </span>
        ) : (
          <span
            key={`${w}-${i}`}
            style={{ display: "inline-block", paddingBottom: "0.14em", marginBottom: "-0.14em", marginRight: !ultima ? "0.26em" : 0, verticalAlign: "top" }}
          >
            {conteudo}
          </span>
        );
      }), marcadas)}
    </div>
  );
};

// O trecho em destaque fica junto numa linha só (não quebra no meio de "Saiba Mais")
const agrupar = (els: React.ReactNode[], grupo: Set<number>) => {
  if (grupo.size < 2) return els;
  const ini = Math.min(...grupo);
  const fim = Math.max(...grupo);
  return [
    ...els.slice(0, ini),
    <span key="grupo" style={{ display: "inline-block", whiteSpace: "nowrap" }}>
      {els.slice(ini, fim + 1)}
    </span>,
    ...els.slice(fim + 1),
  ];
};

// índices das palavras do trecho (a primeira ocorrência da sequência), comparando sem acento e pontuação
export const indicesDoTrecho = (palavras: string[], trecho?: string) => {
  const marcadas = new Set<number>();
  const alvo = trecho ? trecho.split(/\s+/).filter(Boolean).map(normalizar) : [];
  if (!alvo.length) return marcadas;
  for (let i = 0; i + alvo.length <= palavras.length; i++) {
    if (alvo.every((a, k) => normalizar(palavras[i + k]) === a)) {
      alvo.forEach((_, k) => marcadas.add(i + k));
      break;
    }
  }
  return marcadas;
};

// Número que conta de 0 até `valor`, com vírgula decimal
export const formatar = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

// Bloco de texto que sobe de trás de uma régua (máscara) quando `p` vai de 0 a 1.
// Terminada a subida, fica como texto simples, sem a máscara.
export const Revela: React.FC<{ p: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ p, children, style }) => {
  if (p <= 0) return <div style={{ ...style, visibility: "hidden" }}>{children}</div>;
  if (p >= 0.999) return <div style={style}>{children}</div>;
  return (
    <div style={{ ...style, overflow: "hidden", paddingBottom: "0.12em", marginBottom: "-0.12em" }}>
      <div style={{ translate: `0 ${(1 - p) * 105}%` }}>{children}</div>
    </div>
  );
};
