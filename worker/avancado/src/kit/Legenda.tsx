import React from "react";
import { interpolate } from "remotion";
import type { Palavra } from "./dados";
import { LETRA } from "./letra";
import { MARCA } from "./marca";
import { useTempo } from "./tempo";

/**
 * A LEGENDA SIMPLES (aulas 7 a 8.2): até duas linhas, a fala real palavra por
 * palavra, a palavra dita no destaque da marca, numa faixa livre que o roteiro
 * define (longe da borda de baixo, sem cobrir rosto nem gráfico). A página
 * fecha no fim de frase ou quando as duas linhas enchem. Desenhada pelo Palco.
 */
type Pagina = { de: number; ate: number; linhas: Palavra[][] };

// palavras curtas que não terminam linha ("com o | que você tem" vira "com o que você tem")
const LIGADAS = new Set(["o", "a", "os", "as", "e", "é", "de", "da", "do", "das", "dos", "com", "que", "em", "no", "na", "um", "uma", "pra", "para", "se", "por", "ao", "à"]);

export function paginar(palavras: Palavra[], maxLetras: number): Pagina[] {
  const paginas: Pagina[] = [];
  let linhas: Palavra[][] = [[]];
  const fechar = () => {
    const todas = linhas.flat();
    if (todas.length) paginas.push({ de: todas[0].de, ate: todas[todas.length - 1].ate, linhas: linhas.filter((l) => l.length) });
    linhas = [[]];
  };
  for (const p of palavras) {
    const atual = linhas[linhas.length - 1];
    const tamanho = atual.map((x) => x.w).join(" ").length;
    if (atual.length && tamanho + 1 + p.w.length > maxLetras) {
      const levar: Palavra[] = [];
      while (atual.length > 1 && LIGADAS.has(atual[atual.length - 1].w.toLowerCase())) levar.unshift(atual.pop()!);
      if (linhas.length >= 2) fechar();
      else linhas.push([]);
      linhas[linhas.length - 1].push(...levar);
    }
    linhas[linhas.length - 1].push(p);
    if (/[.!?]$/.test(p.w)) fechar();
  }
  fechar();
  // cada página fica até a próxima começar (sem buraco entre frases curtas)
  return paginas.map((pg, i) => ({ ...pg, ate: Math.max(pg.ate + 0.35, paginas[i + 1] ? Math.min(paginas[i + 1].de, pg.ate + 1.2) : pg.ate + 0.6) }));
}

export const Legenda: React.FC<{
  palavras: Palavra[];
  topo: number;
  esquerda: number;
  largura: number;
  tamanho?: number;
  alinhar?: "center" | "left";
  maxLetras?: number;
}> = ({ palavras, topo, esquerda, largura, tamanho = 48, alinhar = "center", maxLetras }) => {
  const { t } = useTempo();
  const letras = maxLetras ?? Math.max(10, Math.floor(largura / (tamanho * 0.56)));
  const paginas = React.useMemo(() => paginar(palavras, letras), [palavras, letras]);
  const pg = paginas.find((p) => t >= p.de - 0.06 && t < p.ate);
  if (!pg) return null;
  const entrada = interpolate(t, [pg.de - 0.06, pg.de + 0.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        top: topo,
        left: esquerda,
        width: largura,
        textAlign: alinhar,
        fontFamily: LETRA.texto,
        fontWeight: 700,
        fontSize: tamanho,
        lineHeight: 1.2,
        color: MARCA.titulo,
        opacity: entrada,
        translate: `0px ${(1 - entrada) * 10}px`,
        textShadow: MARCA.escuro ? "0 2px 12px rgba(0,0,0,0.6)" : "none",
      }}
    >
      {pg.linhas.map((linha, i) => (
        <div key={i}>
          {linha.map((p, j) => {
            const dita = t >= p.de && t < p.ate + 0.08;
            return (
              <span key={j} style={{ color: dita ? MARCA.destaque : MARCA.titulo }}>
                {p.w}
                {j < linha.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
