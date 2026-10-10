// Legenda do Transformação: um cartão claro com a frase em telas curtas (até 4 palavras);
// a palavra que está sendo dita fica verde. Fica abaixo do queixo, dentro da área da pessoa.
import { useMemo } from "react";
import { prog, rapido } from "../anim";
import { larguraTexto } from "../medida";
import type { Frase } from "../motor/frases";
import type { Palavra } from "../plano";
import { cor, fonte, sombraLeve } from "../tema";

const S = 58;
const F = { peso: 800 as const };
type Grupo = { de: number; ate: number; palavras: Palavra[] };

export const gruposDaLegenda = (frases: Frase[]): Grupo[] => {
  const grupos: Grupo[] = [];
  frases.forEach((f, fi) => {
    const telas: Palavra[][] = [];
    let atual: Palavra[] = [];
    const fechar = () => {
      if (atual.length) telas.push(atual);
      atual = [];
    };
    f.palavras.forEach((p) => {
      const tentativa = [...atual, p].map((x) => x.w).join(" ");
      if (atual.length && (atual.length >= 4 || larguraTexto(tentativa, S, F) > 860)) fechar();
      atual.push(p);
      if (/[.?!…,;:]$/.test(p.w) && atual.length >= 2) fechar();
    });
    fechar();
    const proxima = frases[fi + 1];
    const fim = Math.min(f.ate + 0.25, proxima ? proxima.de - 0.02 : f.ate + 0.25);
    telas.forEach((ps, k) => grupos.push({ de: ps[0].em, ate: telas[k + 1] ? telas[k + 1][0].em - 0.02 : fim, palavras: ps }));
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
  const w = textos.reduce((a, x) => a + larguraTexto(x, S, F), 0) + (textos.length - 1) * S * 0.28 + S * 1.3;
  const e = prog(t, g.de - 0.04, 0.14, rapido);
  let atual = -1;
  g.palavras.forEach((p, k) => {
    if (t >= p.em - 0.02) atual = k;
  });
  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - w) / 2,
        top: y - S * 0.85,
        width: w,
        height: S * 1.7,
        borderRadius: S * 0.5,
        background: cor.cartaoVidro,
        boxShadow: sombraLeve,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: S * 0.28,
        opacity: Math.min(1, e * 2),
        transform: e < 1 ? `translateY(${(1 - e) * 14}px)` : undefined,
      }}
    >
      {textos.map((x, k) => (
        <span key={k} style={{ fontFamily: fonte, fontWeight: 800, fontSize: S, lineHeight: 1, color: k === atual ? cor.depois : cor.tinta, whiteSpace: "nowrap" }}>
          {x}
        </span>
      ))}
    </div>
  );
};
