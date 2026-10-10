// Movimento do Devocional: calmo, mas sempre vivo. Tudo entra devagar (tinta que aparece, sem
// salto), assenta e respira; nada gira, treme ou pisca. A página vira entre os blocos.
import { Easing, interpolate } from "remotion";
import { nucleo } from "./medida";
import type { Palavra } from "./plano";

export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const suave = Easing.bezier(0.65, 0, 0.35, 1);
export const calma = Easing.bezier(0.33, 0, 0.2, 1);

export const limitar = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = saida) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// Respiração lenta (−1…1), para nada ficar parado: período em segundos e fase própria.
export const respira = (t: number, periodo = 5, fase = 0) => Math.sin(((t / periodo) * 2 + fase) * Math.PI);

// Tinta que aparece: opacidade + desfoque + leve subida. Terminada a entrada, nada de filtro ou
// transform (o texto final fica desenhado simples).
export const tinta = (t: number, em: number, dur = 0.42, sobe = 10) => {
  if (t >= em + dur) return { opacity: 1 } as React.CSSProperties;
  const p = prog(t, em, dur, calma);
  if (p <= 0) return { opacity: 0 } as React.CSSProperties;
  return { opacity: p, filter: `blur(${(1 - p) * 5}px)`, transform: `translateY(${(1 - p) * sobe}px)` } as React.CSSProperties;
};

// Instante de cada palavra de `texto`: procura a mesma sequência na fala a partir de `em`;
// palavra que não foi dita igual entra logo depois da anterior (ritmo de 0,14 s).
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
    } else ultimo = tempos.length ? ultimo + 0.14 : em;
    tempos.push(ultimo);
  }
  return tempos;
};

// No primeiro bloco (que começa no quadro 0) a primeira palavra já está na página no quadro 0
export const abrir = (tempos: number[], abre?: boolean) => (abre && tempos.length && tempos[0] <= 0.3 ? [-1, ...tempos.slice(1)] : tempos);
export const abrirEm = (em: number, abre?: boolean) => (abre && em <= 0.3 ? -1 : em);

// Número em pt-BR (83.000; 1,5)
export const formatar = (v: number, casas = 0) => v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

// gerador determinístico (poeira, partículas): o mesmo vídeo sempre igual
export const semente = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
