// Movimento do Case: o relatório se preenche como um documento sendo escrito. As peças deslizam
// pouco (14–24 px) e assentam sem passar do ponto; filetes e sublinhados se desenham; valores e
// rótulos são datilografados; a "câmera" desce de página em página. Nada de giro, tremida ou flash.
import { Easing, interpolate } from "remotion";
import { nucleo } from "./medida";
import type { Palavra } from "./plano";

export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const salto = Easing.bezier(0.3, 1.25, 0.5, 1);
export const suave = Easing.bezier(0.65, 0, 0.35, 1);
export const queda = Easing.bezier(0.5, 0, 0.2, 1);

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = saida) => {
  // instante "nunca" (Infinity) = ainda não começou; "-Infinity" = já terminou
  if (!Number.isFinite(inicio)) return inicio > 0 ? 0 : 1;
  return interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
};

// Saída (0 = na tela, 1 = saiu), começando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.2) => prog(t, ate, dur, Easing.in(Easing.cubic));

// Entrada de peça: desliza para cima e acende. Terminada a entrada, o transform some (texto final limpo).
export const entrada = (t: number, em: number, { dur = 0.32, sobe = 18, de = 1 } = {}) => {
  if (t >= em + dur) return { opacity: 1, transform: undefined as string | undefined, visivel: true };
  const p = prog(t, em, dur);
  const o = prog(t, em, Math.min(0.14, dur));
  const escala = de === 1 ? "" : ` scale(${de + (1 - de) * p})`;
  return { opacity: o, transform: `translateY(${(1 - p) * sobe}px)${escala}`, visivel: t >= em };
};

// Soco curto de escala (resultado que bate, estrela que acende): 0 fora, sobe e volta.
export const soco = (t: number, em: number, dur = 0.32) => {
  if (t < em || t > em + dur) return 0;
  const p = (t - em) / dur;
  return Math.sin(Math.PI * Math.min(1, p * 1.15)) * (1 - p * 0.3);
};

// Quantos caracteres de `texto` já foram datilografados (ritmo de ~26 caracteres por segundo,
// e no máximo `dur` segundos para o texto inteiro).
export const datilografado = (t: number, em: number, texto: string, dur = 0.5) => {
  if (t < em) return 0;
  const n = [...texto].length;
  const porCaractere = Math.min(1 / 26, dur / Math.max(1, n));
  return Math.min(n, Math.floor((t - em) / porCaractere) + 1);
};

// número escrito ↔ por extenso ("3" casa com "três")
const EXTENSO: Record<string, string[]> = {
  "1": ["um", "uma"], "2": ["dois", "duas"], "3": ["tres"], "4": ["quatro"], "5": ["cinco"], "6": ["seis"], "7": ["sete"], "8": ["oito"], "9": ["nove"], "10": ["dez"],
};
export const mesmaPalavra = (a: string, b: string) => {
  const x = nucleo(a);
  const y = nucleo(b);
  return x === y || (EXTENSO[x]?.includes(y) ?? false) || (EXTENSO[y]?.includes(x) ?? false);
};

// Instante de cada palavra de `texto`: procura a mesma sequência na fala a partir de `em`;
// palavra que não foi dita igual entra logo depois da anterior (ritmo de 0,12 s).
export const temposDoTexto = (texto: string, em: number, palavras: Palavra[], ate = Infinity): number[] => {
  const ws = texto.split(/\s+/).filter(Boolean);
  const fala = palavras.filter((p) => p.em >= em - 0.3 && p.em < ate + 0.3);
  const tempos: number[] = [];
  let cursor = 0;
  let ultimo = em;
  for (const w of ws) {
    let achou = -1;
    for (let k = cursor; k < Math.min(fala.length, cursor + 4); k++) {
      if (mesmaPalavra(fala[k].w, w)) {
        achou = k;
        break;
      }
    }
    if (achou >= 0) {
      ultimo = Math.max(ultimo, fala[achou].em);
      cursor = achou + 1;
    } else ultimo = tempos.length ? ultimo + 0.12 : em;
    tempos.push(ultimo);
  }
  return tempos;
};

// Número em pt-BR (83.000; 1,5)
export const formatar = (v: number, casas = 0) => v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
