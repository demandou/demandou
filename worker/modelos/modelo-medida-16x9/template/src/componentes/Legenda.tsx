import React from "react";
import { LEGENDA_CORPO, type CaixaDaLegenda } from "../layout";
import type { Frase } from "../motor/frases";
import type { Palavra } from "../plano";
import { EASE_OUT, P, SORA, caber, prog, useTempo } from "../tema";

/* Legenda do Medida: Sora 800 TODA BRANCA com contorno preto e sombra leve (sem palavra colorida).
   Cada palavra sobe por máscara quando é falada. As linhas vêm do motor (montarFrases); dentro de
   cada linha, a tela mostra blocos de até 3 palavras / ~18 caracteres, como no exemplo.
   No quadro deitado: 60 px na área segura de baixo (tela cheia) e, na moldura da direita, logo
   abaixo do queixo; o bloco encolhe (até 40 px) para caber numa linha só na largura da faixa. */

type Bloco = { de: number; ate: number; palavras: Palavra[] };
const cache = new WeakMap<Frase[], Bloco[]>();

const blocosDe = (frases: Frase[], quebras: number[]): Bloco[] => {
  const g = cache.get(frases);
  if (g) return g;
  const out: Bloco[] = [];
  for (const f of frases) {
    let atual: Palavra[] = [];
    const fechar = () => {
      if (atual.length) out.push({ de: atual[0].em, ate: atual[atual.length - 1].ate, palavras: atual });
      atual = [];
    };
    f.palavras.forEach((w, i) => {
      const len = atual.reduce((s, x) => s + x.w.length + 1, 0) + w.w.length;
      if (atual.length && quebras.some((q) => Math.abs(q - w.em) < 0.06)) fechar();
      if (atual.length && (atual.length >= 3 || len > 18)) fechar();
      atual.push(w);
      const nx = f.palavras[i + 1];
      if (/[.,?!:]$/.test(w.w) || (nx && nx.em - w.ate > 0.35)) fechar();
    });
    fechar();
    // cada bloco fica até o próximo começar (dentro da linha) e o último até o fim da linha
    const ultimos = out.filter((b) => b.de >= f.de - 0.001);
    ultimos.forEach((b, k) => {
      b.ate = k < ultimos.length - 1 ? Math.min(b.ate + 0.3, ultimos[k + 1].de) : f.ate;
    });
  }
  cache.set(frases, out);
  return out;
};

// quebras: instantes em que a legenda sempre começa um bloco novo (quando o layout muda)
// caixa: o centro vertical e a faixa horizontal da legenda naquele instante (layout.legendaNoTempo)
export const Legenda: React.FC<{ frases: Frase[]; caixa: CaixaDaLegenda; quebras?: number[] }> = ({ frases, caixa, quebras = [] }) => {
  const t = useTempo();
  const blocos = blocosDe(frases, quebras);
  const b = blocos.find((x) => t >= x.de - 0.05 && t < x.ate);
  if (!b) return null;
  // o contorno (10 px) e o espaço entre as palavras também ocupam a faixa
  const texto = b.palavras.map((w) => w.w).join(" ");
  const corpo = caber(texto, caixa.w - 24 - 0.2 * LEGENDA_CORPO * b.palavras.length, LEGENDA_CORPO, 40, SORA, 800, false, -0.015);
  return (
    <div
      style={{
        position: "absolute",
        left: caixa.x,
        width: caixa.w,
        top: caixa.y,
        transform: "translateY(-50%)",
        textAlign: "center",
        whiteSpace: "nowrap",
        fontFamily: SORA,
        fontWeight: 800,
        fontSize: corpo,
        lineHeight: 1.12,
        letterSpacing: "-0.015em",
        color: P.branco,
        WebkitTextStroke: "10px #000",
        paintOrder: "stroke fill",
        filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.45))",
      }}
    >
      {b.palavras.map((w, k) => {
        const p = prog(t, w.em - 0.06, w.em + 0.12, EASE_OUT);
        const ativa = t >= w.em - 0.04 && t < w.ate + 0.02;
        const pronta = p >= 1 && !ativa;
        return (
          <span key={k} style={{ display: "inline-block", clipPath: pronta ? undefined : "inset(-0.6em -0.35em 0 -0.35em)", verticalAlign: "bottom", padding: "0.04em 0.02em 0.1em", marginRight: "0.2em" }}>
            <span style={{ display: "inline-block", transform: pronta ? undefined : `translateY(${(1 - p) * 110}%) scale(${ativa ? 1.04 : 1})`, opacity: 0.15 + 0.85 * p }}>{w.w}</span>
          </span>
        );
      })}
    </div>
  );
};
