// Movimento do Balcão: as coisas são POSTAS na vitrine (descem e assentam com um leve passar do
// ponto), o adesivo é colado (bate e assenta), o carimbo bate uma vez, a placa balança no gancho.
// Sai rápido. Nada de giro solto, tremida ou flash.
import { Easing, interpolate } from "remotion";
import { nucleo } from "./medida";
import type { Palavra } from "./plano";

export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const salto = Easing.bezier(0.34, 1.4, 0.5, 1);
export const suave = Easing.bezier(0.65, 0, 0.35, 1);

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = saida) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// Saída (0 = na tela, 1 = saiu), começando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.2) => prog(t, ate, dur, Easing.in(Easing.cubic));

// Entrada de cartão: escala + opacidade. Terminada a entrada, o transform some (texto final limpo).
export const entrada = (t: number, em: number, { dur = 0.34, de = 0.86, sobe = 0 } = {}) => {
  if (t >= em + dur) return { opacity: 1, transform: undefined as string | undefined, visivel: true };
  const p = prog(t, em, dur, salto);
  const o = prog(t, em, Math.min(0.12, dur));
  return { opacity: o, transform: `translateY(${(1 - p) * sobe}px) scale(${de + (1 - de) * p})`, visivel: t >= em };
};

// Soco curto de escala (número que troca, resposta que acende): 0 fora, sobe e volta.
export const soco = (t: number, em: number, dur = 0.32) => {
  if (t < em || t > em + dur) return 0;
  const p = (t - em) / dur;
  return Math.sin(Math.PI * Math.min(1, p * 1.15)) * (1 - p * 0.3);
};

// Números escritos ↔ por extenso ("3" = "três"; "20h" = "oito" da noite = "vinte")
const EXTENSO: Record<string, string[]> = {
  "1": ["um", "uma"], "2": ["dois", "duas"], "3": ["tres"], "4": ["quatro"], "5": ["cinco"], "6": ["seis"], "7": ["sete"],
  "8": ["oito"], "9": ["nove"], "10": ["dez"], "11": ["onze"], "12": ["doze"], "15": ["quinze"], "20": ["vinte"], "30": ["trinta"],
  "40": ["quarenta"], "50": ["cinquenta"], "100": ["cem"],
};
export const formasDaPalavra = (w: string) => {
  const n = nucleo(w).replace(/^r\$/, "");
  const lista = new Set([n]);
  const hora = n.match(/^(\d{1,2})h(\d{2})?$/);
  const base = hora ? [hora[1], String(Number(hora[1]) - 12)] : [n];
  for (const b of base) {
    lista.add(b);
    (EXTENSO[b] ?? []).forEach((e) => lista.add(e));
  }
  for (const [num, ext] of Object.entries(EXTENSO)) if (ext.includes(n)) lista.add(num);
  return lista;
};
export const mesmaPalavra = (dita: string, alvo: string) => {
  const a = formasDaPalavra(alvo);
  return [...formasDaPalavra(dita)].some((f) => a.has(f));
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
    const alvo = nucleo(w);
    let achou = -1;
    for (let k = cursor; k < Math.min(fala.length, cursor + 4); k++) {
      if (mesmaPalavra(fala[k].w, alvo)) {
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
