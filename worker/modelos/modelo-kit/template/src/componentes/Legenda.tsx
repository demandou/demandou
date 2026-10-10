// Legenda do Kit: uma fita crepe colada logo abaixo do queixo, 1 a 3 palavras por vez;
// a palavra dita ganha o marca-texto de cobalto, que desliza de uma palavra para a outra.
import { useMemo } from "react";
import { interpolate } from "remotion";
import { prog, rapido } from "../anim";
import { larguraTexto } from "../medida";
import type { Frase } from "../motor/frases";
import type { Palavra } from "../plano";
import { cor, fonte } from "../tema";

const S_MAX = 64;
const LARGURA = 900;
const F = { peso: 800 as const };

type Grupo = { de: number; ate: number; palavras: Palavra[] };

export const gruposDaLegenda = (frases: Frase[]): Grupo[] => {
  const grupos: Grupo[] = [];
  frases.forEach((f, fi) => {
    const daFrase: Palavra[][] = [];
    let atual: Palavra[] = [];
    const fechar = () => {
      if (atual.length) daFrase.push(atual);
      atual = [];
    };
    f.palavras.forEach((p) => {
      const tentativa = [...atual, p].map((x) => x.w).join(" ");
      if (atual.length && (atual.length >= 3 || larguraTexto(tentativa, S_MAX, F) > LARGURA - 90)) fechar();
      atual.push(p);
      if (/[.?!…,;:]$/.test(p.w) && atual.length >= 2) fechar();
    });
    fechar();
    const proxima = frases[fi + 1];
    const fimDaFrase = Math.min(f.ate + 0.25, proxima ? proxima.de - 0.02 : f.ate + 0.25);
    daFrase.forEach((ps, k) => {
      const seguinte = daFrase[k + 1];
      grupos.push({ de: ps[0].em, ate: seguinte ? seguinte[0].em - 0.02 : fimDaFrase, palavras: ps });
    });
  });
  return grupos;
};

export const Legenda: React.FC<{ t: number; frases: Frase[]; y: number; bloqueios?: number[] }> = ({ t, frases, y, bloqueios = [] }) => {
  const grupos = useMemo(
    () =>
      gruposDaLegenda(frases).map((g) => {
        const corte = bloqueios.filter((b) => b > g.de + 0.05).sort((a, b) => a - b)[0];
        return corte !== undefined && corte < g.ate ? { ...g, ate: corte } : g;
      }),
    [frases, bloqueios],
  );
  const g = grupos.find((x) => t >= x.de - 0.04 && t < x.ate);
  if (!g) return null;
  const textos = g.palavras.map((p) => p.w.replace(/[.,;:!?…]+$/, ""));
  let S = S_MAX;
  const larguraEm = (s: number) => textos.reduce((a, w) => a + larguraTexto(w, s, F) + s * 0.32, 0) + s * 0.6;
  while (S > 40 && larguraEm(S) > LARGURA) S -= 2;
  const padX = S * 0.16;
  const vao = S * 0.18;
  const larguras = textos.map((w) => larguraTexto(w, S, F) + padX * 2);
  const xs: number[] = [];
  let x = S * 0.3;
  larguras.forEach((l) => {
    xs.push(x);
    x += l + vao;
  });
  const total = x - vao + S * 0.3;
  const altura = S * 1.5;
  let atual = -1;
  g.palavras.forEach((p, k) => {
    if (t >= p.em - 0.02) atual = k;
  });
  const entrada = prog(t, g.de - 0.04, 0.12, rapido);
  let tx = atual >= 0 ? xs[atual] : 0;
  let tw = atual >= 0 ? larguras[atual] : 0;
  if (atual > 0) {
    const p = prog(t, g.palavras[atual].em - 0.02, 0.09, rapido);
    tx = interpolate(p, [0, 1], [xs[atual - 1], xs[atual]]);
    tw = interpolate(p, [0, 1], [larguras[atual - 1], larguras[atual]]);
  }
  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - total) / 2,
        top: y - altura / 2,
        width: total,
        height: altura,
        opacity: Math.min(1, entrada * 2),
        transform: entrada >= 1 ? "rotate(-0.6deg)" : `scale(${0.9 + 0.1 * entrada}) rotate(-0.6deg)`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: cor.fita, border: `1px solid ${cor.fitaBorda}`, boxShadow: "0 5px 12px rgba(30,20,10,0.4)", borderRadius: 4 }} />
      {atual >= 0 ? <div style={{ position: "absolute", left: tx, top: altura * 0.2, width: tw, height: altura * 0.6, borderRadius: 6, background: cor.cobalto, opacity: 0.95 }} /> : null}
      {textos.map((w, k) => (
        <span
          key={k}
          style={{
            position: "absolute",
            left: xs[k] + padX,
            top: 0,
            lineHeight: `${altura}px`,
            fontFamily: fonte,
            fontWeight: 800,
            fontSize: S,
            color: k <= atual && k === atual ? "#fff" : cor.tinta,
            whiteSpace: "nowrap",
          }}
        >
          {w}
        </span>
      ))}
    </div>
  );
};
