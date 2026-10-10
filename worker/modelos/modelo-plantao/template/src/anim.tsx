import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de pacote gráfico de telejornal: entra decidido e assenta, sem quique nem elástico.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
// trocas de quadro (a caixa da pessoa, o painel que abre): macias nas duas pontas
export const troca = Easing.bezier(0.65, 0, 0.35, 1);
const sai = Easing.in(Easing.cubic);

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

// Saída de painel na troca de quadro: some logo no começo do movimento (curva que cai rápido),
// para nunca aparecer "meio painel" enquanto a pessoa muda de lugar.
export const saidaRapida = Easing.out(Easing.quad);

// Progresso de uma saída (0 = na tela, 1 = saiu), terminando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.25) => prog(t, ate - dur, dur, sai);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Varredura de tarja: o FUNDO abre da esquerda para a direita (só ele é recortado); o texto por
// cima aparece inteiro quando o fundo já abriu — texto nunca aparece cortado.
export const varredura = (p: number) => `inset(0 ${((1 - limitar(p)) * 100).toFixed(2)}% 0 0)`;

// ---------- texto falado ----------

const NUMEROS: Record<string, string[]> = {
  "0": ["zero"],
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
  "30": ["trinta"],
  "100": ["cem", "cento"],
};

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// a palavra escrita na tela corresponde à falada? ("3" ↔ "três", "pra" ↔ "para", "perde" ↔ "perder",
// "5%" ↔ "5%,", "R$ 100" ↔ "R$100")
const casa = (escrita: string, falada: string) => {
  const a = normalizar(escrita);
  const b = normalizar(falada);
  if (!a || !b) return false;
  if (a === b) return true;
  if (NUMEROS[a]?.includes(b) || NUMEROS[b]?.includes(a)) return true;
  const pra = ["pra", "para"];
  if (pra.includes(a) && pra.includes(b)) return true;
  // flexão: "perde" × "perder", "sobe" × "sobem" (mesmo começo, até 2 letras de diferença)
  const [curta, longa] = a.length <= b.length ? [a, b] : [b, a];
  return curta.length >= 4 && longa.startsWith(curta) && longa.length - curta.length <= 2;
};

// "R$ 100" na tela é uma palavra só na fala ("R$100"): junta símbolo de moeda ao número
const unidades = (texto: string) => texto.replace(/(R\$|US\$|€)\s+(?=\d)/g, "$1").split(/\s+/).filter(Boolean);

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto enxugado continua no ritmo).
// Nada entra antes de `inicio`, e a busca começa um pouco antes dele (passe em `inicio` um instante
// perto de quando o texto começa a ser dito). Devolve um tempo por palavra do texto.
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= Math.max(de, inicio) - 0.35 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  const separadas = texto.split(/\s+/).filter(Boolean);
  // mapa: palavra da tela → unidade de busca (para "R$ 100", as duas partes buscam "R$100")
  const busca = unidades(texto);
  let u = 0;
  let resto = busca[0] ?? "";
  for (const w of separadas) {
    const alvo = busca[u] ?? w;
    const achou = faladas.findIndex((p, k) => k >= cursor && casa(alvo, p.w));
    const anterior = tempos[tempos.length - 1] ?? inicio - 0.12;
    const valeu = achou >= 0 && achou - cursor <= 6;
    tempos.push(valeu ? Math.max(anterior + 0.04, inicio, faladas[achou].em - 0.06) : Math.max(inicio, anterior + 0.12));
    // "R$" e "100" são uma palavra falada só: o cursor só anda no fim da unidade
    resto = resto.slice(w.length);
    if (!resto) {
      if (valeu) cursor = achou + 1;
      u++;
      resto = busca[u] ?? "";
    }
  }
  return tempos;
};

// O instante em que uma palavra do texto é dita (a primeira que casa), ou `padrao`.
export const quandoDiz = (w: string, palavras: Palavra[], de: number, ate: number, padrao: number) => {
  const p = palavras.find((x) => x.em >= de - 0.35 && x.em < ate + 0.1 && casa(w, x.w));
  return p ? p.em : padrao;
};

// Texto que se monta palavra por palavra: cada palavra sobe de trás de uma régua, no seu tempo.
// Antes de ser dita, a palavra já aparece "a lápis" (apagada) — nada de espaço vazio esperando a fala.
// O espaço entre palavras é uma margem fixa (nunca o caractere de espaço dentro do span animado).
export const Palavras: React.FC<{
  palavras: string[];
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  corDe?: (i: number) => string | undefined;
  // cor do esboço (a palavra antes de ser dita); sem ela, a palavra só aparece quando é dita
  esboco?: string;
  alinhar?: "left" | "center" | "right";
  // índice da primeira palavra (para `corDe` contar no texto todo, quando há várias linhas)
  primeira?: number;
}> = ({ palavras, tempos, t, style, corDe, esboco, alinhar = "left", primeira = 0 }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "nowrap",
      justifyContent: alinhar === "center" ? "center" : alinhar === "right" ? "flex-end" : "flex-start",
      ...style,
    }}
  >
    {palavras.map((w, i) => {
      const p = prog(t, tempos[i] ?? 0, 0.34);
      const margem = i < palavras.length - 1 ? "0.26em" : 0;
      // terminada a animação, a palavra é desenhada simples: uma camada só, sem máscara nem
      // deslocamento (nada de "duas cópias" montadas num quadro capturado)
      if (p >= 1) {
        return (
          <span key={`${w}-${i}`} style={{ display: "inline-block", marginRight: margem, whiteSpace: "pre", color: corDe?.(primeira + i) }}>
            {w}
          </span>
        );
      }
      // com esboço: a palavra apagada já está lá e a cor "varre" por cima dela, da esquerda para a
      // direita, quando é dita (nada de duas cópias desencontradas)
      if (esboco) {
        return (
          <span key={`${w}-${i}`} style={{ position: "relative", display: "inline-block", marginRight: margem, whiteSpace: "pre" }}>
            <span style={{ color: esboco }}>{w}</span>
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                color: corDe?.(primeira + i),
                clipPath: `inset(-0.3em ${((1 - p) * 100).toFixed(2)}% -0.3em -0.1em)`,
              }}
            >
              {w}
            </span>
          </span>
        );
      }
      // sem esboço: a palavra sobe de trás de uma régua
      return (
        <span
          key={`${w}-${i}`}
          style={{
            position: "relative",
            display: "inline-block",
            overflow: "hidden",
            paddingBottom: "0.12em",
            marginBottom: "-0.12em",
            marginRight: margem,
            whiteSpace: "pre",
          }}
        >
          <span style={{ display: "inline-block", translate: `0 ${(1 - p) * 105}%`, color: corDe?.(primeira + i) }}>{w}</span>
        </span>
      );
    })}
  </div>
);

// Linhas já quebradas, cada palavra no seu tempo (os tempos seguem a ordem das palavras no texto)
export const Linhas: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  corDe?: (indiceGlobal: number) => string | undefined;
  esboco?: string;
  alinhar?: "left" | "center" | "right";
  entrelinha?: number;
}> = ({ linhas, tempos, t, style, corDe, esboco, alinhar, entrelinha = 0 }) => {
  let k = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: entrelinha, ...style }}>
      {linhas.map((linha, i) => {
        const ws = linha.split(/\s+/).filter(Boolean);
        const inicio = k;
        k += ws.length;
        return (
          <Palavras
            key={`${linha}-${i}`}
            palavras={ws}
            tempos={tempos.slice(inicio, inicio + ws.length)}
            t={t}
            corDe={corDe}
            esboco={esboco}
            alinhar={alinhar}
            primeira={inicio}
          />
        );
      })}
    </div>
  );
};

// Índices (no texto todo) das palavras que fazem parte do trecho em destaque
export const indicesDoDestaque = (texto: string, destaque?: string) => {
  if (!destaque) return new Set<number>();
  const ws = texto.split(/\s+/).filter(Boolean).map(normalizar);
  const alvo = destaque.split(/\s+/).filter(Boolean).map(normalizar);
  for (let i = 0; i + alvo.length <= ws.length; i++) {
    if (alvo.every((a, k) => ws[i + k] === a)) return new Set(alvo.map((_, k) => i + k));
  }
  return new Set<number>();
};
