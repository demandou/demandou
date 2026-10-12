// Movimento do Quiz: entra macio com um leve passar do ponto (como um placar de TV que acende),
// assenta e "respira"; sai rápido. Nada de giro, tremida ou flash.
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
      if (nucleo(fala[k].w) === alvo) {
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
