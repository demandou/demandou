// Legenda palavra por palavra: Sora 800 toda branca, com contorno preto e sombra leve (o gosto do
// Tiago: sem palavra colorida). Cada palavra sobe pela máscara quando é dita. As linhas vêm do
// motor (`montarFrases`); na tela cada linha aparece em blocos curtos (até 3 palavras, ~18 letras),
// na altura do peito, abaixo do queixo.
import React from "react";
import type { Frase } from "./motor/frases";
import type { Palavra } from "./plano";
import { COR, EASE_OUT, SORA, prog } from "./tema";

type Bloco = { de: number; ate: number; palavras: Palavra[] };

// Re-agrupa as palavras visíveis (as linhas do motor) em blocos curtos, como no Reel original:
// até 3 palavras / ~18 letras; quebra na pontuação, na pausa (> 0,35 s) e onde a legenda some.
const guardados = new WeakMap<Frase[], Bloco[]>();
const todosOsBlocos = (frases: Frase[]) => {
  const pronto = guardados.get(frases);
  if (pronto) return pronto;
  const ws = frases.flatMap((f, fi) => f.palavras.map((p) => ({ p, fi })));
  const bs: (Bloco & { fi: number })[] = [];
  let cur: typeof ws = [];
  const fechar = () => {
    if (cur.length) bs.push({ de: cur[0].p.em, ate: cur[cur.length - 1].p.ate, palavras: cur.map((x) => x.p), fi: cur[cur.length - 1].fi });
    cur = [];
  };
  ws.forEach((w, i) => {
    const ant = cur[cur.length - 1];
    // a legenda sumiu entre as duas linhas (um momento sem legenda no meio): bloco novo
    if (ant && ant.fi !== w.fi && frases[ant.fi].ate < w.p.em - 0.1) fechar();
    const len = cur.reduce((n, x) => n + x.p.w.length + 1, 0) + w.p.w.length;
    if (cur.length && (cur.length >= 3 || len > 18)) fechar();
    cur.push(w);
    const nx = ws[i + 1];
    if (/[.,?!:;…]$/.test(w.p.w) || (nx && nx.p.em - w.p.ate > 0.35)) fechar();
  });
  fechar();
  const out = bs.map((b, k) => ({ de: b.de, palavras: b.palavras, ate: Math.min(b.ate + 0.3, frases[b.fi].ate, bs[k + 1]?.de ?? Infinity) }));
  guardados.set(frases, out);
  return out;
};

export const Legenda: React.FC<{ frases: Frase[]; t: number; y: number }> = ({ frases, t, y }) => {
  const bs = todosOsBlocos(frases);
  const atual = bs.find((b) => t >= b.de - 0.05 && t < b.ate);
  if (!atual) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        width: 940,
        top: y,
        transform: "translateY(-50%)",
        textAlign: "center",
        fontFamily: SORA,
        fontWeight: 800,
        fontSize: 66,
        lineHeight: 1.12,
        letterSpacing: "-0.015em",
        color: COR.branco,
        WebkitTextStroke: "10px #000",
        paintOrder: "stroke fill",
        filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.45))",
      }}
    >
      {atual.palavras.map((p, k) => {
        const q = prog(t, p.em - 0.06, p.em + 0.12, EASE_OUT);
        const ativa = t >= p.em - 0.04 && t < p.ate + 0.02;
        return (
          <span key={k} style={{ display: "inline-block", clipPath: "inset(-0.6em -0.35em 0 -0.35em)", verticalAlign: "bottom", padding: "0.04em 0.02em 0.1em", marginRight: "0.2em" }}>
            <span style={{ display: "inline-block", transform: q < 1 || ativa ? `translateY(${(1 - q) * 110}%) scale(${ativa ? 1.04 : 1})` : undefined, opacity: 0.15 + 0.85 * q }}>{p.w}</span>
          </span>
        );
      })}
    </div>
  );
};
