// Legenda do Devocional: abaixo do queixo, dentro da moldura da pessoa. Pílula de papel claro, até 4
// palavras por vez (nunca junta duas frases), a palavra dita em oliva. Some quando a página já mostra
// a fala (todo momento, salvo `legenda: true`).
import { useMemo } from "react";
import { prog } from "../anim";
import { larguraLinha } from "../medida";
import type { Frase } from "../motor/frases";
import type { Palavra } from "../plano";
import { cor, sans } from "../tema";

const S_MAX = 50;
const LARGURA = 900;
const F = { familia: "sans" as const, peso: 800 };

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
      const tentativa = [...atual, p].map((x) => x.w);
      if (atual.length && (atual.length >= 4 || larguraLinha(tentativa, S_MAX, F) > LARGURA - 60)) fechar();
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
  while (S > 36 && larguraLinha(textos, S, F) > LARGURA - 60) S -= 2;
  let atual = -1;
  g.palavras.forEach((p, k) => {
    if (t >= p.em - 0.02) atual = k;
  });
  const p = prog(t, g.de - 0.04, 0.16);
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: y - S * 0.85, display: "flex", justifyContent: "center", opacity: p }}>
      <div
        style={{
          padding: `${S * 0.2}px ${S * 0.55}px`,
          borderRadius: S,
          background: "#FBF7EC",
          boxShadow: "0 8px 22px rgba(30,41,69,0.22)",
          fontFamily: sans,
          fontWeight: 800,
          fontSize: S,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
        }}
      >
        {textos.map((w, k) => (
          <span key={k} style={{ color: k === atual ? cor.oliva : cor.tinta }}>
            {w}
            {k < textos.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};
