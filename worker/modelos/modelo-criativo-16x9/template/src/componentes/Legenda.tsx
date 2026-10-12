// Legenda do Criativo: SEMPRE ligada (anúncio é visto sem som), numa pílula de vidro fumê. Até 4
// palavras por vez, nunca junta duas frases; a palavra dita acende na cor da marca e as palavras
// sobem de leve quando são ditas. No quadro deitado (16:9) ela fica na área segura de baixo,
// centralizada no quadro, no mesmo lugar com a pessoa em quadro cheio ou na moldura.
import { useMemo } from "react";
import { prog } from "../anim";
import { larguraTexto } from "../medida";
import type { Frase } from "../motor/frases";
import type { Palavra } from "../plano";
import { fonte, QUADRO, vidroEscuro, type Tons } from "../tema";

const S_MAX = 58;
// a pílula mais larga (no 16:9 cabe mais que os 940 px do vertical; a regra das 4 palavras continua)
const LARGURA = 1100;

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
      if (atual.length && (atual.length >= 4 || larguraTexto(tentativa, S_MAX, { peso: 800 }) > LARGURA - 90)) fechar();
      atual.push(p);
      if (/[.?!…,]$/.test(p.w) && atual.length >= 2) fechar();
    });
    fechar();
    const proxima = frases[fi + 1];
    const fimDaFrase = Math.min(f.ate + 0.3, proxima ? proxima.de - 0.02 : f.ate + 0.3);
    daFrase.forEach((ps, k) => {
      const seguinte = daFrase[k + 1];
      grupos.push({ de: ps[0].em, ate: seguinte ? seguinte[0].em - 0.02 : fimDaFrase, palavras: ps });
    });
  });
  return grupos;
};

export const Legenda: React.FC<{ t: number; frases: Frase[]; y: number; tons: Tons }> = ({ t, frases, y, tons }) => {
  const grupos = useMemo(() => gruposDaLegenda(frases), [frases]);
  // o 1º grupo já está na tela no 1º quadro (o anúncio começa montado)
  const g = grupos.find((x, i) => t >= (i === 0 && x.de < 0.4 ? 0 : x.de - 0.04) && t < x.ate);
  if (!g) return null;
  const textos = g.palavras.map((p) => p.w);
  let S = S_MAX;
  const largura = (s: number) => larguraTexto(textos.join(" "), s, { peso: 800 });
  while (S > 38 && largura(S) > LARGURA - 90) S -= 2;
  let atual = -1;
  g.palavras.forEach((p, k) => {
    if (t >= p.em - 0.02) atual = k;
  });
  const p = g === grupos[0] && g.de < 0.4 ? 1 : prog(t, g.de - 0.04, 0.12);
  return (
    <div style={{ position: "absolute", left: 0, width: QUADRO.w, top: y - S * 0.62 - 16, display: "flex", justifyContent: "center", opacity: p }}>
      <div
        style={{
          ...vidroEscuro,
          padding: `16px ${S * 0.5}px`,
          borderRadius: S,
          fontFamily: fonte,
          fontWeight: 800,
          fontSize: S,
          lineHeight: 1.24,
          letterSpacing: "-0.012em",
          whiteSpace: "nowrap",
          transform: p >= 1 ? undefined : `scale(${0.94 + 0.06 * p})`,
        }}
      >
        {textos.map((w, k) => {
          const pk = g === grupos[0] && g.de < 0.4 && k === 0 ? 1 : prog(t, g.palavras[k].em - 0.05, 0.14);
          return (
            <span
              key={k}
              style={{
                display: "inline-block",
                color: k === atual ? tons.destaque : "#FFFFFF",
                opacity: pk >= 1 ? 1 : 0.35 + 0.65 * pk,
                transform: pk >= 1 ? undefined : `translateY(${(1 - pk) * 10}px)`,
                marginRight: k < textos.length - 1 ? "0.26em" : 0,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
