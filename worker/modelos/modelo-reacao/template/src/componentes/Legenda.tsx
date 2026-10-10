// Legenda do Reação: uma linha curta numa pílula escura, logo acima da moldura da pessoa;
// a palavra dita ganha o marca-texto amarelo (o mesmo gesto dos cartões).
import { prog, desliza } from "../anim";
import { larguraTexto } from "../medida";
import type { Frase } from "../motor/frases";
import { cor, fonte } from "../tema";

const S_MAX = 50;
const LARGURA = 960;
const F = { peso: 700 as const };

export const Legenda: React.FC<{ t: number; frases: Frase[]; y: number; bloqueios?: number[] }> = ({ t, frases, y, bloqueios = [] }) => {
  const f = frases.find((x, i) => {
    const fim = Math.min(x.ate + 0.25, frases[i + 1] ? frases[i + 1].de - 0.02 : Infinity);
    const corte = bloqueios.filter((b) => b > x.de + 0.05).sort((a, b) => a - b)[0];
    return t >= x.de - 0.05 && t < (corte !== undefined && corte < fim ? corte : fim);
  });
  if (!f) return null;
  const ws = f.palavras.map((p) => p.w);
  let S = S_MAX;
  const larg = (s: number) => ws.reduce((a, w) => a + larguraTexto(w, s, F), 0) + (ws.length - 1) * s * 0.28;
  while (S > 34 && larg(S) > LARGURA - 90) S -= 2;
  const padX = S * 0.55;
  const total = larg(S) + padX * 2;
  const altura = S * 1.55;
  const espaco = S * 0.28;
  const entrada = prog(t, f.de - 0.05, 0.16, desliza);
  let x = padX;
  const itens = f.palavras.map((p) => {
    const lg = larguraTexto(p.w, S, F);
    const it = { p, x, lg };
    x += lg + espaco;
    return it;
  });
  let atual = -1;
  f.palavras.forEach((p, k) => {
    if (t >= p.em - 0.02) atual = k;
  });
  return (
    <div style={{ position: "absolute", left: (1080 - total) / 2, top: y - altura / 2, width: total, height: altura, opacity: Math.min(1, entrada * 2), transform: `translateY(${(1 - entrada) * 14}px)` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: altura / 2, background: "rgba(12,20,34,0.86)", boxShadow: "0 8px 26px rgba(0,0,0,0.35)" }} />
      {itens.map((it, k) => (
        <div key={k} style={{ position: "absolute", left: it.x - S * 0.14, top: altura * 0.14, width: it.lg + S * 0.28, height: altura * 0.72, borderRadius: S * 0.3, background: cor.marca, opacity: k === atual ? 1 : 0, transform: "skewX(-6deg)" }} />
      ))}
      {itens.map((it, k) => (
        <span key={k} style={{ position: "absolute", left: it.x, top: 0, lineHeight: `${altura}px`, fontFamily: fonte, fontWeight: 700, fontSize: S, color: k === atual ? cor.tinta : "#fff", whiteSpace: "nowrap" }}>
          {it.p.w}
        </span>
      ))}
    </div>
  );
};
