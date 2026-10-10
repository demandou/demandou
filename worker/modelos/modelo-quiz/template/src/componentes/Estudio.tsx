// O estúdio: o fundo claro do painel (com o cenário de anéis girando devagar, sempre vivo), a
// moldura da pessoa e a tarja de apresentador. Nada disso toca na pessoa: a cor do vídeo não muda.
import { prog, saindo } from "../anim";
import type { Plano } from "../plano";
import { COSTURA, cor, fonte, MOLDURA } from "../tema";
import { caber } from "./Pecas";

export const Cenario: React.FC<{ t: number }> = ({ t }) => {
  const giro = t * 6;
  const cx = 540;
  const cy = 560;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: COSTURA + 80, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 90% 70% at 50% 38%, #FFFFFF 0%, ${cor.estudio} 58%, ${cor.estudioFundo} 100%)` }} />
      <svg width={1080} height={COSTURA + 80} style={{ position: "absolute", inset: 0 }}>
        {[260, 400, 560, 740].map((r, i) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={cor.cenario}
            strokeWidth={i % 2 ? 3 : 10}
            strokeDasharray={i % 2 ? "2 26" : "120 60"}
            transform={`rotate(${(i % 2 ? -1 : 1) * giro * (1 + i * 0.25)} ${cx} ${cy})`}
          />
        ))}
      </svg>
    </div>
  );
};

// sombra suave em volta da moldura (só fora dela) + o fundo do estúdio que aparece nas laterais
export const SombraDaMoldura: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: MOLDURA.x,
      top: MOLDURA.y,
      width: MOLDURA.w,
      height: MOLDURA.h,
      borderRadius: MOLDURA.raio,
      boxShadow: "0 -10px 34px rgba(19,24,58,0.16)",
      background: "#20243F",
    }}
  />
);

// A tarja de apresentador: logo acima da moldura (20 px de folga), à esquerda, longe do rosto, nos
// primeiros segundos. Nome em Sora 800 (44 px, nunca menos de 34) e área em 600 (30 px, nunca menos de 24).
export const ALTURA_TARJA = 112;
export const Tarja: React.FC<{ t: number; plano: Plano; de: number; ate: number }> = ({ t, plano, de, ate }) => {
  const nome = plano.marca?.nome?.trim();
  if (!nome || ate <= de || t < de || t > ate + 0.3) return null;
  const area = plano.marca?.area?.trim();
  const p = prog(t, de, 0.4);
  const s = saindo(t, ate, 0.3);
  const larg = 952 - 96 - 22 - 40;
  const fN = caber(nome, larg, 44, 34, 1, 800);
  const fA = area ? caber(area, larg, 30, 24, 1, 600) : null;
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: COSTURA - 20 - ALTURA_TARJA,
        height: ALTURA_TARJA,
        maxWidth: 952,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 40px 0 14px",
        borderRadius: ALTURA_TARJA / 2,
        background: cor.cartao,
        boxShadow: "0 10px 26px rgba(19,24,58,0.16)",
        opacity: p * (1 - s),
        transform: `translateX(${(1 - p) * -40 + s * -40}px)`,
      }}
    >
      <div style={{ width: 84, height: 84, borderRadius: 42, flexShrink: 0, background: cor.acento, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonte, fontWeight: 800, fontSize: 40, color: cor.cartao }}>
        {nome.replace(/^(prof\.?|dr\.?|dra\.?)\s+/i, "").slice(0, 1).toUpperCase()}
      </div>
      <div>
        <div style={{ fontFamily: fonte, fontWeight: 800, fontSize: fN.tamanho, color: cor.tinta, lineHeight: 1.1, letterSpacing: "-0.015em", whiteSpace: "nowrap" }}>{fN.linhas.join(" ")}</div>
        {fA ? <div style={{ fontFamily: fonte, fontWeight: 600, fontSize: fA.tamanho, color: cor.tintaSuave, lineHeight: 1.25, whiteSpace: "nowrap" }}>{fA.linhas.join(" ")}</div> : null}
      </div>
    </div>
  );
};
