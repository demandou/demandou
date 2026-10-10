import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de planilha: o cursor pula decidido e assenta macio; nada quica.
export const assenta = Easing.bezier(0.2, 0.9, 0.25, 1);
// troca de lugar das células (mesma curva da caixa da pessoa no motor)
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
  "11": ["onze"],
  "12": ["doze"],
  "15": ["quinze"],
  "20": ["vinte"],
  "30": ["trinta"],
  "50": ["cinquenta"],
  "100": ["cem"],
};

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

export const casa = (escrita: string, falada: string) => {
  const a = normalizar(escrita);
  const b = normalizar(falada);
  if (!a) return false;
  if (a === b) return true;
  if (NUMEROS[a]?.includes(b) || NUMEROS[b]?.includes(a)) return true;
  const pra = ["pra", "para"];
  if (pra.includes(a) && pra.includes(b)) return true;
  // nome composto escrito ("RENDA_TRIBUTÁVEL") começando pela palavra falada ("renda")
  if (b.length >= 4 && a.startsWith(b)) return true;
  // "guarde" escrito, "guarda" falado; plural/singular
  return a.length > 4 && b.length > 4 && a.slice(0, -1) === b.slice(0, -1);
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

// O instante em que um texto começa a ser dito no trecho (as duas primeiras palavras em sequência),
// procurando em qualquer distância; undefined se não for dito ali.
export const quandoDito = (texto: string, palavras: Palavra[], de: number, ate: number) => {
  const ws = texto.split(/\s+/).filter(Boolean);
  if (!ws.length) return undefined;
  const faladas = palavras.filter((p) => p.em >= de - 0.05 && p.em < ate + 0.1);
  for (let i = 0; i < faladas.length; i++) {
    if (!casa(ws[0], faladas[i].w)) continue;
    if (ws.length > 1 && faladas[i + 1] && !casa(ws[1], faladas[i + 1].w)) continue;
    return faladas[i].em;
  }
  return undefined;
};

// Quantos caracteres de um texto já foram digitados: cada palavra começa no seu tempo e é teclada
// letra a letra, rápido. Devolve o texto visível.
export const POR_LETRA = 0.032;
// Uma palavra só começa a ser digitada quando a anterior terminou (fala rápida ou texto que não
// está na fala não deixa "buracos" de letras faltando no meio do texto).
export const encadear = (texto: string, tempos: number[], porLetra = POR_LETRA) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const saida: number[] = [];
  palavras.forEach((w, i) => {
    const proprio = tempos[i] ?? (saida[i - 1] ?? 0) + 0.14;
    const livre = i > 0 ? saida[i - 1] + palavras[i - 1].length * porLetra + 0.02 : -Infinity;
    saida.push(Math.max(proprio, livre));
  });
  return saida;
};
export const digitado = (texto: string, temposFalados: number[], t: number, porLetra = POR_LETRA) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const tempos = palavras.length > 1 ? encadear(texto, temposFalados, porLetra) : temposFalados;
  const saida: string[] = [];
  for (let i = 0; i < palavras.length; i++) {
    const inicio = tempos[i] ?? 0;
    if (t < inicio) break;
    const n = Math.min(palavras[i].length, 1 + Math.floor((t - inicio) / porLetra));
    saida.push(palavras[i].slice(0, n));
    if (n < palavras[i].length) break;
  }
  return saida.join(" ");
};

// Instante em que o texto inteiro termina de ser digitado
export const fimDaDigitacao = (texto: string, temposFalados: number[], porLetra = POR_LETRA) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (!palavras.length) return 0;
  const tempos = palavras.length > 1 ? encadear(texto, temposFalados, porLetra) : temposFalados;
  const i = palavras.length - 1;
  return (tempos[i] ?? 0) + palavras[i].length * porLetra;
};

// Cursor de texto piscando (só enquanto a célula está sendo editada)
export const piscando = (t: number) => (Math.floor(t * 2.4) % 2 === 0 ? 1 : 0.15);

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

// Formata um número no padrão brasileiro (1.234,56)
export const formatar = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
