import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ESPACO } from "./medidas";
import type { Palavra } from "./plano";
import { cor } from "./tema";

// Movimento de estúdio: entra decidido e assenta, sem quique nem elástico.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
// a troca de quadro da pessoa: macia nas duas pontas
export const troca = Easing.bezier(0.65, 0, 0.35, 1);
const sai = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos. Um instante que não existe
// (Infinity: um campo opcional que ficou de fora) nunca acontece.
export const prog = (t: number, inicio: number, dur: number, easing = entra) =>
  !Number.isFinite(inicio) ? 0 : interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso de uma saída (0 = na tela, 1 = saiu), terminando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.25) => prog(t, ate - dur, dur, sai);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// "MM:SS" ou "H:MM:SS" → segundos (e de volta)
export const segundos = (txt?: string) => {
  if (!txt) return 0;
  return txt
    .split(":")
    .map(Number)
    .reduce((s, n) => s * 60 + (Number.isFinite(n) ? n : 0), 0);
};
export const relogio = (s: number) => {
  const total = Math.max(0, Math.floor(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const ss = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${String(m).padStart(2, "0")}:${ss}`;
};

// ---------- texto falado ----------

// Números escritos em algarismos casam com o número falado por extenso ("300" ↔ "trezentos",
// "83" ↔ "oitenta"), e ordinais ("1º" ↔ "primeiro"). Vale para qualquer número.
const UNIDADES = ["zero", "um", "dois", "tres", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
const ORDINAIS = ["", "primeiro", "segundo", "terceiro", "quarto", "quinto", "sexto", "setimo", "oitavo", "nono", "decimo"];
const ate999 = (n: number): string[] => {
  if (n < 20) return [UNIDADES[n]];
  if (n < 100) return n % 10 ? [DEZENAS[Math.floor(n / 10)], UNIDADES[n % 10]] : [DEZENAS[n / 10]];
  if (n === 100) return ["cem"];
  return n % 100 ? [CENTENAS[Math.floor(n / 100)], ...ate999(n % 100)] : [CENTENAS[n / 100]];
};
// as palavras que podem ser ditas para um número (com as formas femininas)
export const porExtenso = (n: number): string[] => {
  if (!Number.isFinite(n) || n < 0 || n > 999999999) return [];
  let ws: string[];
  if (n >= 1000000) ws = [...ate999(Math.floor(n / 1000000)), "milhao", "milhoes", ...(n % 1000000 ? porExtenso(n % 1000000) : [])];
  else if (n >= 1000) ws = [...(Math.floor(n / 1000) === 1 ? [] : ate999(Math.floor(n / 1000))), "mil", ...(n % 1000 ? ate999(n % 1000) : [])];
  else ws = ate999(n);
  const fem = ws.map((w) => (w === "um" ? "uma" : w === "dois" ? "duas" : w.endsWith("entos") ? w.replace(/entos$/, "entas") : w));
  return [...new Set([...ws, ...fem, ...(ws.includes("quatorze") ? ["catorze"] : [])])];
};

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/º/g, "o")
    .replace(/ª/g, "a")
    .replace(/[^a-z0-9]/g, "");

const numeroOuOrdinal = (w: string): string[] => {
  const ordinal = w.match(/^(\d+)[oa]$/);
  if (ordinal) {
    const n = Number(ordinal[1]);
    const o = ORDINAIS[n];
    return o ? [o, o.replace(/o$/, "a")] : [];
  }
  return /^\d+$/.test(w) ? porExtenso(Number(w)) : [];
};

// a palavra escrita na tela corresponde à falada? ("300" ↔ "trezentos", "pra" ↔ "para", "1º" ↔ "primeiro")
const casa = (escrita: string, falada: string) => {
  const a = normalizar(escrita);
  const b = normalizar(falada);
  if (!a) return false;
  if (a === b) return true;
  if (numeroOuOrdinal(a).includes(b) || numeroOuOrdinal(b).includes(a)) return true;
  const pra = ["pra", "para"];
  return pra.includes(a) && pra.includes(b);
};

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas do trecho.
// Palavra não achada entra logo depois da anterior (texto enxugado continua no ritmo).
// Nada entra antes de `inicio`.
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const achou = faladas.findIndex((p, k) => k >= cursor && casa(w, p.w));
    const anterior = tempos[tempos.length - 1] ?? inicio - 0.12;
    // a primeira palavra pode estar em qualquer ponto do trecho (o texto pode começar no meio da
    // fala); as seguintes, no máximo 6 palavras depois da anterior
    const perto = tempos.length === 0 || achou - cursor <= 6;
    if (achou >= 0 && perto) {
      tempos.push(Math.max(anterior + 0.04, inicio, faladas[achou].em - 0.04));
      cursor = achou + 1;
    } else tempos.push(Math.max(inicio, anterior + 0.12));
  }
  return tempos;
};

// índices (na sequência de palavras do texto) que pertencem a um trecho
export const indicesDoTrecho = (texto: string, trecho?: string) => {
  if (!trecho) return new Set<number>();
  const ws = texto.split(/\s+/).filter(Boolean).map(normalizar);
  const alvo = trecho.split(/\s+/).filter(Boolean).map(normalizar);
  for (let i = 0; i + alvo.length <= ws.length; i++) {
    if (alvo.every((a, k) => ws[i + k] === a)) return new Set(alvo.map((_, k) => i + k));
  }
  return new Set<number>();
};

// Linhas já quebradas, cada palavra no seu tempo.
// modo "acende": a frase inteira já está na tela a lápis e cada palavra acende quando é dita
//                (os cartões de pergunta, resposta e citação);
// modo "monta":  cada palavra entra subindo no seu tempo (o título da abertura, a chamada final).
// O espaço entre palavras é uma margem fixa (nunca o caractere de espaço dentro do span animado).
export const Linhas: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  tam: number;
  modo: "acende" | "monta";
  estilo?: React.CSSProperties;
  // cor final de cada palavra (índice na frase toda); padrão: texto claro
  corDe?: (i: number) => string | undefined;
  // opacidade final de cada palavra (ex.: palavra riscada fica apagada)
  opacidadeDe?: (i: number) => number;
  // algo desenhado por cima de uma palavra (risco, sublinhado), já posicionado dentro dela
  sobre?: (i: number) => React.ReactNode;
  alinhar?: "left" | "center";
  entrelinha?: number;
}> = ({ linhas, tempos, t, tam, modo, estilo, corDe, opacidadeDe, sobre, alinhar = "left", entrelinha = 1.06 }) => {
  let k = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: alinhar === "center" ? "center" : "flex-start", ...estilo }}>
      {linhas.map((linha, li) => {
        const ws = linha.split(/\s+/).filter(Boolean);
        const inicio = k;
        k += ws.length;
        return (
          <div key={`${linha}-${li}`} style={{ display: "flex", height: tam * entrelinha, alignItems: "center", whiteSpace: "nowrap" }}>
            {ws.map((w, j) => {
              const i = inicio + j;
              const p = prog(t, tempos[i] ?? 0, modo === "acende" ? 0.2 : 0.34);
              const final = corDe?.(i) ?? cor.texto;
              const opaca = opacidadeDe?.(i) ?? 1;
              const margem = j < ws.length - 1 ? tam * ESPACO : 0;
              // terminada a animação, a palavra é desenhada uma vez só, simples (sem a camada a lápis
              // por baixo nem deslocamento): nenhum quadro capturado mostra duas camadas
              if (p >= 0.999) {
                // a palavra apagada (riscada) mantém o tom que tinha sobre o lápis
                const tom = modo === "acende" && opaca < 1 ? 1 - 0.76 * (1 - opaca) : opaca;
                return (
                  <span key={`${w}-${j}`} style={{ position: "relative", display: "inline-block", marginRight: margem, color: final, opacity: tom }}>
                    {w}
                    {sobre?.(i)}
                  </span>
                );
              }
              if (modo === "acende") {
                if (p <= 0.001)
                  return (
                    <span key={`${w}-${j}`} style={{ position: "relative", display: "inline-block", marginRight: margem, color: cor.apagado }}>
                      {w}
                      {sobre?.(i)}
                    </span>
                  );
                return (
                  <span key={`${w}-${j}`} style={{ position: "relative", display: "inline-block", marginRight: margem }}>
                    <span style={{ color: cor.apagado }}>{w}</span>
                    <span style={{ position: "absolute", left: 0, top: 0, color: final, opacity: p * opaca }}>{w}</span>
                    {sobre?.(i)}
                  </span>
                );
              }
              return (
                <span
                  key={`${w}-${j}`}
                  style={{
                    position: "relative",
                    display: "inline-block",
                    marginRight: margem,
                    color: final,
                    opacity: p * opaca,
                    translate: `0 ${(1 - p) * 0.32 * tam}px`,
                  }}
                >
                  {w}
                  {sobre?.(i)}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Traço SVG que se desenha (p de 0 a 1 ao longo do caminho).
export const Traco: React.FC<
  { d: string; p?: number; cor: string; largura: number } & Omit<React.SVGProps<SVGPathElement>, "d" | "stroke" | "strokeWidth">
> = ({ d, p = 1, cor: c, largura, ...resto }) => {
  if (p <= 0.002) return null;
  const parcial = p < 0.999;
  return (
    <path
      d={d}
      fill="none"
      stroke={c}
      strokeWidth={largura}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={parcial ? 1 : undefined}
      strokeDasharray={parcial ? `${p} 1` : undefined}
      {...resto}
    />
  );
};

// ---------- números ----------

// Número em pt-BR: 83000 → "83.000"; 1.5 → "1,5" (com `casas`)
export const formatarNumero = (v: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);

// O valor de um contador no instante t: conta de 0 até `valor` a partir de `em`, desacelerando no fim.
export const contando = (t: number, em: number, valor: number, dur = 1.1) => valor * prog(t, em, dur, Easing.out(Easing.cubic));
