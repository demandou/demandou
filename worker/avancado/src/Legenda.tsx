import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { LETRA, MARCA } from "./marca";

export type Palavra = { de: number; ate: number; w: string };
type Pagina = { de: number; ate: number; linhas: Palavra[][] };

/**
 * Legenda simples (aulas 5 a 8): até duas linhas, a fala real palavra por
 * palavra, a palavra dita em destaque. Página fecha no fim de frase ou quando
 * as duas linhas enchem.
 */
// palavras curtas que não terminam linha ("com o | que você tem" vira "com o que você tem")
const LIGADAS = new Set(["o", "a", "os", "as", "e", "é", "de", "da", "do", "com", "que", "em", "no", "na", "um", "uma", "pra", "para", "se"]);

export function paginar(palavras: Palavra[], maxLetras: number): Pagina[] {
  const paginas: Pagina[] = [];
  let linhas: Palavra[][] = [[]];
  const fechar = () => {
    const todas = linhas.flat();
    if (todas.length) paginas.push({ de: todas[0].de, ate: todas[todas.length - 1].ate, linhas });
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
  maxLetras: number;
  topo: number;
  esquerda: number;
  largura: number;
  tamanho: number;
  alinhar?: "center" | "left";
}> = ({ palavras, maxLetras, topo, esquerda, largura, tamanho, alinhar = "center" }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const paginas = React.useMemo(() => paginar(palavras, maxLetras), [palavras, maxLetras]);
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
        fontFamily: LETRA,
        fontWeight: 700,
        fontSize: tamanho,
        lineHeight: 1.2,
        color: MARCA.titulo,
        opacity: entrada,
        translate: `0px ${(1 - entrada) * 10}px`,
        textShadow: "0 2px 12px rgba(0,0,0,0.6)",
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
