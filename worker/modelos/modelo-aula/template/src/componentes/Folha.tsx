// O cabeçalho comum dos slides (sobretítulo + título que se monta na fala) e a largura útil.
import type { Plano } from "../plano";
import { PAD, SLIDE_W } from "../tema";
import { Sobretitulo } from "./Pecas";
import { TextoFalado, disporTexto } from "./Texto";

export const UTIL = SLIDE_W - PAD * 2; // 1064

// ——— cabeçalho do slide: sobretítulo + título que se monta na fala ———
export const cabecalho = (
  plano: Plano,
  o: { titulo?: string; em: number; ate: number; destaque?: string; rotulo?: string; acender?: { texto: string; em: number }[]; max?: number },
  t: number,
) => {
  let y = PAD - 4;
  const partes: React.ReactNode[] = [];
  if (o.rotulo) {
    partes.push(<Sobretitulo key="r" texto={o.rotulo} x={PAD} y={y} largura={UTIL} t={t} em={Math.min(o.em, o.ate) - 0.05} />);
    y += 46;
  }
  if (o.titulo) {
    const d = disporTexto(o.titulo, { largura: UTIL, max: o.max ?? 64, min: 40, linhas: 2, peso: 800, espacamento: -0.025, fala: plano.palavras, de: o.em, ate: o.ate, destaque: o.destaque, entrelinha: 1.1 });
    partes.push(<TextoFalado key="t" d={d} x={PAD} y={y} t={t} peso={800} acender={o.acender} />);
    y += d.altura;
  }
  return { elemento: <>{partes}</>, altura: y + 30 };
};

