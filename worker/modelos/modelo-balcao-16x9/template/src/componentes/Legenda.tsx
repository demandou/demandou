// Legenda do Balcão: pílula creme com borda de papel, até 4 palavras por vez (nunca junta duas
// frases), a palavra dita em tomate. No quadro deitado (16:9) ela fica na área segura de baixo,
// centrada no quadro: sobre o vídeo em tela cheia e na frente do balcão quando a fachada aparece.
// Some quando a vitrine já mostra a fala (só aparece nos momentos com `legenda: true` e nos trechos
// sem momento).
import { useMemo } from "react";
import { prog } from "../anim";
import { larguraTexto } from "../medida";
import type { Frase } from "../motor/frases";
import type { Palavra } from "../plano";
import { cor, fonte, QUADRO } from "../tema";

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
    <div style={{ position: "absolute", left: 0, width: QUADRO.w, top: y - S * 0.85, display: "flex", justifyContent: "center", opacity: p }}>
      <div
        style={{
          padding: `${S * 0.22}px ${S * 0.55}px`,
          borderRadius: S,
          background: cor.papel,
          border: `3px solid ${cor.papelBorda}`,
          boxShadow: "0 8px 22px rgba(59,36,22,0.24)",
          fontFamily: fonte,
          fontWeight: 800,
          fontSize: S,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          transform: p >= 1 ? undefined : `scale(${0.9 + 0.1 * p})`,
        }}
      >
        {textos.map((w, k) => (
          <span key={k} style={{ color: k === atual ? cor.acento : cor.tinta }}>
            {w}
            {k < textos.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};
