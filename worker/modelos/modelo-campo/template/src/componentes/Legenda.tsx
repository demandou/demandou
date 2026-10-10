// Legenda do Campo: abaixo do queixo, dentro da moldura da pessoa. Pílula creme, até 4 palavras
// por vez (nunca junta duas frases), a palavra dita ganha o grifo amarelo. Some quando o painel já
// mostra a fala (o motor tira a legenda durante os momentos, salvo `legenda: true`).
import { useMemo } from "react";
import { prog } from "../anim";
import { larguraTexto } from "../medida";
import type { Frase } from "../motor/frases";
import type { Palavra } from "../plano";
import { cor, fonte } from "../tema";

const S_MAX = 54;
const LARGURA = 900;

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
      if (atual.length && (atual.length >= 4 || larguraTexto(tentativa, S_MAX, { peso: 800 }) > LARGURA - 60)) fechar();
      atual.push(p);
      if (/[.?!…]$/.test(p.w)) fechar();
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
  const textos = g.palavras.map((p) => p.w);
  let S = S_MAX;
  const largura = (s: number) => larguraTexto(textos.join(" "), s, { peso: 800 });
  while (S > 36 && largura(S) > LARGURA - 60) S -= 2;
  let atual = -1;
  g.palavras.forEach((p, k) => {
    if (t >= p.em - 0.02) atual = k;
  });
  const p = prog(t, g.de - 0.04, 0.14);
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: y - S * 0.85, display: "flex", justifyContent: "center", opacity: p }}>
      <div
        style={{
          padding: `${S * 0.22}px ${S * 0.5}px`,
          borderRadius: S * 0.3,
          background: cor.cartao,
          boxShadow: "0 8px 22px rgba(30,43,32,0.25)",
          fontFamily: fonte,
          fontWeight: 800,
          fontSize: S,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          color: cor.tinta,
          transform: p >= 1 ? undefined : `scale(${0.92 + 0.08 * p})`,
        }}
      >
        {textos.map((w, k) => (
          <span key={k}>
            <span style={{ background: k === atual ? cor.sinal : undefined, borderRadius: S * 0.1, padding: k === atual ? `0 ${S * 0.08}px` : undefined, margin: k === atual ? `0 ${-S * 0.08}px` : undefined }}>{w}</span>
            {k < textos.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};
