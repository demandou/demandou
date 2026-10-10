// O chão do caderno de campo: palha com curvas de nível que derivam devagar (sempre vivo), a moldura
// da pessoa e a tarja (nome e área) no terço de baixo da moldura. Nada disso toca na pessoa: a cor
// do vídeo não muda e não há brilho nem luz atrás dela.
import { useMemo } from "react";
import { prog, saindo } from "../anim";
import type { Plano } from "../plano";
import { COSTURA, cor, fonte, mono, MOLDURA } from "../tema";
import { caber, caberMono, Icone } from "./Pecas";

// uma curva de nível: contorno fechado e ondulado em volta de um centro
const curva = (cx: number, cy: number, r: number, semente: number) => {
  const pts: string[] = [];
  const n = 72;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + 0.16 * Math.sin(a * 3 + semente) + 0.08 * Math.sin(a * 5 + semente * 2.3) + 0.05 * Math.cos(a * 2 + semente * 0.7);
    pts.push(`${(cx + Math.cos(a) * r * k * 1.25).toFixed(1)},${(cy + Math.sin(a) * r * k).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
};

export const Fundo: React.FC<{ t: number }> = ({ t }) => {
  const curvas = useMemo(() => {
    const lista: { d: string; forte: boolean }[] = [];
    [
      { cx: 250, cy: 300, s: 0.4 },
      { cx: 860, cy: 760, s: 2.1 },
    ].forEach((c) => {
      for (let k = 1; k <= 9; k++) lista.push({ d: curva(c.cx, c.cy, 46 * k, c.s + k * 0.22), forte: k % 4 === 0 });
    });
    return lista;
  }, []);
  const dx = Math.sin(t * 0.18) * 18;
  const dy = t * -4;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: COSTURA + 80, overflow: "hidden", background: cor.palha }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 85% 65% at 50% 40%, #F6F1E4 0%, ${cor.palha} 60%, ${cor.palhaFundo} 100%)` }} />
      <svg width={1080} height={COSTURA + 80} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${dx} ${dy}) rotate(${t * 0.6} 540 520)`}>
          {curvas.map((c, i) => (
            <path key={i} d={c.d} fill="none" stroke={cor.nivel} strokeWidth={c.forte ? 3.2 : 1.6} />
          ))}
        </g>
      </svg>
    </div>
  );
};

// a borda de papel e a sombra em volta da moldura (só fora dela)
export const SombraDaMoldura: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: MOLDURA.x - 6,
      top: MOLDURA.y - 6,
      width: MOLDURA.w + 12,
      height: MOLDURA.h + 12,
      borderRadius: MOLDURA.raio + 6,
      background: cor.cartao,
      boxShadow: "0 -8px 30px rgba(46,38,20,0.16)",
    }}
  />
);

// A tarja: estaca de campo no terço de baixo da moldura, à esquerda, nos primeiros segundos.
// Nome em Plus Jakarta 800 (46 px, nunca menos de 34) e área em mono (28 px, nunca menos de 22).
export const ALTURA_TARJA = 118;
export const Tarja: React.FC<{ t: number; plano: Plano; de: number; ate: number; y: number }> = ({ t, plano, de, ate, y }) => {
  const nome = plano.marca?.nome?.trim();
  if (!nome || ate <= de || t < de || t > ate + 0.3) return null;
  const area = plano.marca?.area?.trim();
  const p = prog(t, de, 0.4);
  const s = saindo(t, ate, 0.3);
  const larg = 952 - 120;
  const fN = caber(nome, larg, 46, 34, 1, 800);
  const fA = area ? caberMono(area.toLocaleUpperCase("pt-BR"), larg, 28, 22, 1) : null;
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: y,
        height: ALTURA_TARJA,
        maxWidth: 952,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 36px 0 18px",
        borderRadius: 18,
        background: cor.cartao,
        borderLeft: `10px solid ${cor.verde}`,
        boxShadow: "0 10px 26px rgba(30,43,32,0.22)",
        opacity: p * (1 - s),
        transform: `translateX(${(1 - p) * -40 + s * -40}px)`,
      }}
    >
      <div style={{ width: 72, height: 72, borderRadius: 14, flexShrink: 0, background: cor.sinal, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icone nome="broto" tamanho={46} cor={cor.verdeEscuro} traco={2.6} />
      </div>
      <div>
        <div style={{ fontFamily: fonte, fontWeight: 800, fontSize: fN.tamanho, color: cor.tinta, lineHeight: 1.1, letterSpacing: "-0.015em", whiteSpace: "nowrap" }}>{fN.linhas.join(" ")}</div>
        {fA ? (
          <div style={{ fontFamily: mono, fontWeight: 700, fontSize: fA.tamanho, color: cor.verde, lineHeight: 1.3, letterSpacing: "0.03em", whiteSpace: "nowrap" }}>{fA.linhas.join(" ")}</div>
        ) : null}
      </div>
    </div>
  );
};
