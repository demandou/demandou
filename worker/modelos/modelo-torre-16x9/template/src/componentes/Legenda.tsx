// Legenda da Torre: Sora 800 TODA BRANCA, contorno preto e sombra preta leve (sem palavra colorida).
// Blocos curtos (até 3 palavras / ~18 letras) dentro de cada frase do motor; cada palavra sobe por
// máscara quando é dita. No quadro deitado (16:9) ela fica sempre no terço de baixo, centrada na tela e
// acima dos controles do player: sobre a pessoa em tela cheia, logo abaixo do quadro e da moldura
// quando eles estão abertos (o `posicaoLegenda` do vertical não muda nada aqui).
import { useMemo } from "react";
import { EASE_OUT, prog } from "../anim";
import type { Frase } from "../motor/frases";
import type { Palavra } from "../plano";
import { FONTE, LEGENDA_LARGURA, LEGENDA_Y, W } from "../tema";

type Bloco = { de: number; ate: number; palavras: Palavra[] };

export const blocosDaLegenda = (frases: Frase[]): Bloco[] => {
  const out: Bloco[] = [];
  frases.forEach((f, fi) => {
    const daFrase: Palavra[][] = [];
    let cur: Palavra[] = [];
    const flush = () => {
      if (cur.length) daFrase.push(cur);
      cur = [];
    };
    f.palavras.forEach((w, i) => {
      const len = cur.reduce((s, x) => s + x.w.length + 1, 0) + w.w.length;
      if (cur.length && (cur.length >= 3 || len > 18)) flush();
      cur.push(w);
      const nx = f.palavras[i + 1];
      if (/[.,?!:;…]$/.test(w.w) || (nx && nx.em - w.ate > 0.35)) flush();
    });
    flush();
    const prox = frases[fi + 1];
    daFrase.forEach((ps, k) => {
      const seguinte = daFrase[k + 1];
      const fim = ps[ps.length - 1].ate + 0.3;
      const limite = seguinte ? seguinte[0].em : prox ? prox.de : fim;
      out.push({ de: ps[0].em, ate: Math.min(fim, limite), palavras: ps });
    });
  });
  return out;
};

/** o centro da legenda: fixo no terço de baixo (a legenda não balança com o rosto nem com a moldura) */
export const yDaLegenda = () => LEGENDA_Y;

export const Legenda: React.FC<{ t: number; frases: Frase[]; y: number }> = ({ t, frases, y }) => {
  const blocos = useMemo(() => blocosDaLegenda(frases), [frases]);
  const b = blocos.find((x) => t >= x.de - 0.05 && t < x.ate);
  if (!b) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: (W - LEGENDA_LARGURA) / 2,
        width: LEGENDA_LARGURA,
        top: y,
        transform: "translateY(-50%)",
        textAlign: "center",
        fontFamily: FONTE.sora,
        fontWeight: 800,
        fontSize: 58,
        lineHeight: 1.12,
        letterSpacing: "-0.015em",
        color: "#FFF8F2",
        WebkitTextStroke: "9px #000",
        paintOrder: "stroke fill",
        filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.45))",
      }}
    >
      {b.palavras.map((tk, k) => {
        const p = prog(t, tk.em - 0.06, tk.em + 0.12, EASE_OUT);
        const ativa = t >= tk.em - 0.04 && t < tk.ate + 0.02;
        // depois que a palavra assentou, sai a máscara e o deslocamento da entrada (texto simples)
        const assentou = p >= 1;
        return (
          <span key={k} style={{ display: "inline-block", clipPath: assentou ? undefined : "inset(-0.6em -0.35em 0 -0.35em)", verticalAlign: "bottom", padding: "0.04em 0.02em 0.1em", marginRight: "0.2em" }}>
            <span style={{ display: "inline-block", transform: assentou ? (ativa ? "scale(1.04)" : undefined) : `translateY(${(1 - p) * 110}%) scale(${ativa ? 1.04 : 1})`, opacity: assentou ? 1 : 0.15 + 0.85 * p }}>{tk.w}</span>
          </span>
        );
      })}
    </div>
  );
};
