import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";
import { larguraTexto } from "./medida";
import { LARGURA_SERIF_NEGRITO } from "./tema";

// Movimento de livro: entra decidido e assenta; nada quica.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
export const preciso = Easing.bezier(0.65, 0, 0.35, 1);
// o carimbo desce acelerando e bate
export const bate = Easing.bezier(0.55, 0, 0.9, 0.45);
const saida = Easing.bezier(0.45, 0, 0.8, 0.4);

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

// Saída (0 = na tela, 1 = saiu), começando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.3) => prog(t, ate, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Número pseudoaleatório estável a partir de um inteiro.
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
    .replace(/[^a-z0-9ñ]/g, "");

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto reescrito continua no ritmo).
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    if (w === "/") {
      tempos.push(tempos[tempos.length - 1] ?? inicio);
      continue;
    }
    const alvo = normalizar(w);
    const achou = alvo ? faladas.findIndex((p, k) => k >= cursor && normalizar(p.w) === alvo) : -1;
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, inicio - 0.12);
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.04));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.16);
  }
  return tempos;
};

// "Impressão": a palavra chega com a tinta — sobe 12 px, ganha opacidade e assenta o espaçamento.
// Antes do `em`, fica como um esboço a lápis (se `esboco`), para o lugar nunca ficar vazio.
export const impressao = (t: number, em: number, dur = 0.22) => {
  const p = prog(t, em - 0.02, dur);
  // terminada a entrada, o texto fica simples (sem camada de opacidade nem deslocamento)
  if (p >= 1) return {} as React.CSSProperties;
  return { opacity: p, translate: `0 ${(1 - p) * 12}px` } as React.CSSProperties;
};

// Texto falado: cada palavra entra no instante em que é dita. Espaço entre palavras com margem fixa
// (nunca o caractere de espaço dentro de spans animados).
export const TextoFalado: React.FC<{
  texto: string;
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  enfase?: string;
  estiloEnfase?: React.CSSProperties;
  // palavras ainda não ditas aparecem em lápis (true) ou somem (false)
  esboco?: boolean;
  corEsboco?: string;
}> = ({ texto, tempos, t, style, enfase, estiloEnfase, esboco = false, corEsboco }) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const alvo = enfase ? enfase.split(/\s+/).filter(Boolean).map(normalizar) : [];
  const marcadas = new Set<number>();
  if (alvo.length) {
    for (let i = 0; i + alvo.length <= palavras.length; i++) {
      if (alvo.every((a, k) => normalizar(palavras[i + k]) === a)) {
        alvo.forEach((_, k) => marcadas.add(i + k));
        break;
      }
    }
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", ...style }}>
      {palavras.map((w, i) => {
        // "/" no texto = quebra de linha
        if (w === "/") return <div key={`q-${i}`} style={{ flexBasis: "100%", height: 0 }} />;
        const em = tempos[i] ?? 0;
        const p = prog(t, em - 0.02, 0.22);
        const ultima = i === palavras.length - 1 || palavras[i + 1] === "/";
        const estilo: React.CSSProperties = {
          position: "relative",
          display: "inline-block",
          marginRight: ultima ? 0 : "0.25em",
          ...(marcadas.has(i) ? estiloEnfase : {}),
        };
        // palavra já impressa: só o texto, sem as camadas da entrada (esboço, opacidade, deslocamento)
        if (p >= 1)
          return (
            <span key={`${w}-${i}`} style={estilo}>
              {w}
            </span>
          );
        return (
          <span key={`${w}-${i}`} style={estilo}>
            {esboco ? (
              <span style={{ position: "absolute", left: 0, top: 0, color: corEsboco, opacity: 1 - p, whiteSpace: "nowrap" }}>{w}</span>
            ) : null}
            <span style={{ display: "inline-block", opacity: p, translate: `0 ${(1 - p) * 12}px` }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

// Divide a palavra em sílabas pelo "·" (ex·qui·si·to). Sem pontos, a palavra inteira é uma sílaba.
// Expressão de várias palavras ("bull mar·ket"): cada palavra é uma unidade (a última sílaba de cada
// palavra leva um espaço no fim), e a quebra de linha pode cair entre as palavras.
export const silabasDe = (texto: string, silabas?: string) => {
  const fonte = (silabas && silabas.replace(/·/g, "") === texto.replace(/·/g, "") ? silabas : texto).trim();
  const palavras = fonte.split(/\s+/);
  return palavras.flatMap((w, wi) => {
    const sil = w.split("·");
    return sil.map((x, si) => (si === sil.length - 1 && wi < palavras.length - 1 ? `${x} ` : x));
  });
};

const PONTO = 0.32; // largura do "·" em frações do corpo
const ESPACO = 0.26; // largura do espaço entre palavras, em frações do corpo

// Quebra a palavra por sílabas em até `maxLinhas` linhas que caibam na largura, no maior corpo possível.
// As linhas saem da estimativa por caracteres (a que deu os tamanhos do exemplo aprovado); depois a
// largura real de cada linha (medida na fonte) é conferida, com 6% de tolerância: palavra larga
// demais (muitos "m", "w", maiúsculas) desce de corpo e nunca vaza.
export const quebrarPalavra = (silabas: string[], largura: number, maximo: number, maxLinhas: number, minimo = 60) => {
  const est = (s: string, corpo: number) => s.length * LARGURA_SERIF_NEGRITO * corpo;
  const real = (s: string, corpo: number) => larguraTexto(s, corpo, { peso: 700 }) / 1.03;
  const sep = (i: number, corpo: number) => (silabas[i].endsWith(" ") ? ESPACO * corpo : i < silabas.length - 1 ? PONTO * corpo : 0);
  for (let corpo = maximo; corpo >= minimo; corpo -= 4) {
    const linhas: number[][] = [[]];
    let usado = 0;
    let ok = true;
    silabas.forEach((s, i) => {
      const w = est(s.trimEnd(), corpo) + sep(i, corpo);
      if (usado + w > largura && linhas[linhas.length - 1].length > 0) {
        linhas.push([]);
        usado = 0;
      }
      if (w > largura) ok = false;
      linhas[linhas.length - 1].push(i);
      usado += w;
    });
    if (!ok || linhas.length > maxLinhas) continue;
    const larguraReal = (idx: number[]) => idx.reduce((a, i, k) => a + real(silabas[i].trimEnd(), corpo) + (k < idx.length - 1 ? sep(i, corpo) : 0), 0);
    if (linhas.every((idx) => larguraReal(idx) <= largura * 1.06)) return { corpo, linhas };
  }
  return { corpo: minimo, linhas: [silabas.map((_, i) => i)] };
};
