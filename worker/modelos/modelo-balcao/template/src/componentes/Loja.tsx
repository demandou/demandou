// A fachada da loja: a parede, o toldo listrado com o letreiro, a vitrine (moldura de madeira, vidro
// e o reflexo que passa devagar), o balcão e a moldura da pessoa. É o "layout final" desde o quadro 0.
// Nada disso toca na pessoa: a cor do vídeo não muda.
import { Easing } from "remotion";
import { prog, saindo } from "../anim";
import { encaixar, larguraTexto } from "../medida";
import type { Plano } from "../plano";
import { BALCAO, COSTURA, cor, fonte, fonteLetreiro, JANELA, MOLDURA, TOLDO, VIDRO } from "../tema";
import { caber } from "./Pecas";

const L = 1080;
const ESQ = -40;
const LARG_LISTRA = (L - 2 * ESQ) / TOLDO.listras;

// ——— a parede (atrás de tudo) ———
export const Parede: React.FC = () => (
  <div style={{ position: "absolute", left: 0, top: 0, width: L, height: COSTURA + 40, overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${cor.paredeEscura} 0%, ${cor.parede} 26%, ${cor.parede} 100%)` }} />
    <svg width={L} height={COSTURA + 40} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 14 }, (_, i) => (
        <line key={i} x1={i * 80 + 20} y1={0} x2={i * 80 + 20} y2={COSTURA + 40} stroke={cor.tabua} strokeWidth={3} />
      ))}
    </svg>
  </div>
);

// ——— a vitrine: moldura de madeira e o vidro (o conteúdo dos momentos fica entre o vidro e o reflexo) ———
export const VidroFundo: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        left: JANELA.x,
        top: JANELA.y,
        width: JANELA.w,
        height: JANELA.h,
        borderRadius: JANELA.raio,
        background: cor.madeira,
        boxShadow: "0 18px 30px rgba(59,36,22,0.22)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: VIDRO.x,
        top: VIDRO.y,
        width: VIDRO.w,
        height: VIDRO.h,
        borderRadius: JANELA.raio - 10,
        background: `linear-gradient(180deg, ${cor.vidro} 0%, ${cor.vidro} 55%, ${cor.vidroFundo} 100%)`,
      }}
    />
  </>
);

// o reflexo: duas faixas claras em diagonal que atravessam o vidro devagar (o vidro nunca fica parado)
export const Reflexo: React.FC<{ t: number }> = ({ t }) => {
  const ciclo = 7.5;
  const f = (t % ciclo) / ciclo;
  const x = -420 + f * (VIDRO.w + 840);
  return (
    <div style={{ position: "absolute", left: VIDRO.x, top: VIDRO.y, width: VIDRO.w, height: VIDRO.h, borderRadius: JANELA.raio - 10, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: x, top: -200, width: 70, height: VIDRO.h + 400, background: "rgba(255,255,255,0.22)", transform: "rotate(24deg)" }} />
      <div style={{ position: "absolute", left: x + 110, top: -200, width: 26, height: VIDRO.h + 400, background: "rgba(255,255,255,0.16)", transform: "rotate(24deg)" }} />
      {/* a sombra do toldo no alto do vidro */}
      <div style={{ position: "absolute", left: 0, top: 0, width: VIDRO.w, height: 70, background: "linear-gradient(180deg, rgba(59,36,22,0.13), rgba(59,36,22,0))" }} />
    </div>
  );
};

// a moldura de madeira por cima das bordas do vidro (o conteúdo nunca encosta na madeira)
export const MolduraJanela: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: JANELA.x,
      top: JANELA.y,
      width: JANELA.w,
      height: JANELA.h,
      borderRadius: JANELA.raio,
      boxSizing: "border-box",
      border: `${JANELA.borda}px solid ${cor.madeira}`,
      boxShadow: `inset 0 0 0 3px ${cor.madeiraEscura}, inset 0 6px 0 3px rgba(59,36,22,0.12)`,
      pointerEvents: "none",
    }}
  >
    <div style={{ position: "absolute", inset: -JANELA.borda, borderRadius: JANELA.raio, boxShadow: `inset 0 3px 0 ${cor.madeiraClara}` }} />
  </div>
);

// ——— o toldo listrado e o letreiro ———
export const Toldo: React.FC<{ t: number; plano: Plano }> = ({ t, plano }) => {
  const n = TOLDO.listras;
  const r = LARG_LISTRA / 2;
  const listras = Array.from({ length: n }, (_, i) => i);
  const fator = L / (L - 2 * ESQ);
  const xCima = (x: number) => 540 + (x - 540) * fator;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: L, height: TOLDO.base + r + 60, pointerEvents: "none" }}>
      {/* a sombra do toldo na parede */}
      <div style={{ position: "absolute", left: 0, top: TOLDO.base, width: L, height: 90, background: "linear-gradient(180deg, rgba(59,36,22,0.22), rgba(59,36,22,0))" }} />
      <svg width={L} height={TOLDO.base + r + 40} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="toldo-luz" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(59,36,22,0.28)" />
            <stop offset="1" stopColor="rgba(59,36,22,0)" />
          </linearGradient>
        </defs>
        {/* a inclinação (de longe para perto: mais larga embaixo) */}
        {listras.map((i) => {
          const a = ESQ + i * LARG_LISTRA;
          const b = a + LARG_LISTRA;
          return (
            <polygon
              key={`c${i}`}
              points={`${xCima(a)},0 ${xCima(b)},0 ${b},${TOLDO.saia} ${a},${TOLDO.saia}`}
              fill={i % 2 ? cor.toldoCreme : cor.toldo}
            />
          );
        })}
        <rect x={0} y={0} width={L} height={TOLDO.saia} fill="url(#toldo-luz)" />
        {/* a barra da frente */}
        <rect x={0} y={TOLDO.saia - 6} width={L} height={10} fill={cor.toldoEscuro} />
        {/* a saia com os recortes em meia-lua, que mexe de leve com o vento */}
        {listras.map((i) => {
          const a = ESQ + i * LARG_LISTRA;
          const onda = Math.sin(t * 1.7 - i * 0.55) * 2.6;
          const y0 = TOLDO.saia + 4;
          const y1 = TOLDO.base + onda;
          return (
            <path
              key={`s${i}`}
              d={`M ${a} ${y0} L ${a + LARG_LISTRA} ${y0} L ${a + LARG_LISTRA} ${y1} A ${r} ${r} 0 0 1 ${a} ${y1} Z`}
              fill={i % 2 ? cor.toldoCreme : cor.toldo}
              stroke={i % 2 ? cor.toldoCremeSombra : cor.toldoEscuro}
              strokeWidth={2}
            />
          );
        })}
        <rect x={0} y={TOLDO.saia + 4} width={L} height={5} fill="rgba(59,36,22,0.16)" />
      </svg>
      <Letreiro t={t} plano={plano} />
    </div>
  );
};

// O letreiro: na palavra dita, a placa creme desce do toldo, balança e o nome se pinta da esquerda para a direita.
const Letreiro: React.FC<{ t: number; plano: Plano }> = ({ t, plano }) => {
  const nome = plano.fachada?.nome?.trim();
  if (!nome) return null;
  const em = plano.fachada?.em ?? 0;
  const f = encaixar(nome, { largura: 640, max: 62, min: 36, linhas: 1, fonte: { letreiro: true } });
  const largura = Math.min(760, Math.max(360, larguraTexto(nome, f.tamanho, { letreiro: true }) + 110));
  const h = 92;
  const top = TOLDO.saia - h / 2 + 18;
  if (t < em - 0.02) return null;
  const pinta = prog(t, em + 0.1, 0.5, Easing.bezier(0.45, 0, 0.3, 1));
  const desce = prog(t, em - 0.02, 0.32, Easing.bezier(0.3, 1.4, 0.5, 1));
  const d = Math.max(0, t - em);
  const balanco = Math.sin(t * 1.1) * 0.5 + 5 * Math.exp(-d / 0.45) * Math.cos(d * 9);
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - largura / 2,
        top,
        width: largura,
        height: h,
        borderRadius: 18,
        background: cor.papel,
        border: `5px solid ${cor.tinta}`,
        boxSizing: "border-box",
        boxShadow: "0 10px 20px rgba(59,36,22,0.28)",
        transformOrigin: "50% 0%",
        transform: `rotate(${balanco}deg) scaleY(${Math.max(0.05, desce)})`,
        opacity: Math.min(1, desce * 3),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "absolute", inset: 6, borderRadius: 11, border: `2px solid ${cor.papelBorda}` }} />
      <div
        style={{
          fontFamily: fonteLetreiro,
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: f.tamanho,
          color: cor.tinta,
          lineHeight: 1,
          whiteSpace: "nowrap",
          clipPath: pinta >= 1 ? undefined : `inset(-20% ${100 - pinta * 100}% -20% 0)`,
          marginTop: -4,
        }}
      >
        {nome}
      </div>
    </div>
  );
};

// ——— o balcão de madeira (entre a vitrine e a pessoa) ———
export const Balcao: React.FC = () => (
  <div style={{ position: "absolute", left: 0, top: BALCAO.y - 6, width: L, height: BALCAO.h + 6 }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: L, height: 22, background: `linear-gradient(180deg, ${cor.madeiraClara}, #D49B5E)`, boxShadow: "0 -4px 10px rgba(59,36,22,0.18)" }} />
    <div style={{ position: "absolute", left: 0, top: 22, width: L, height: BALCAO.h - 16, background: cor.madeira }} />
    <svg width={L} height={BALCAO.h + 6} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <line key={i} x1={i * 112 + 40} y1={24} x2={i * 112 + 40} y2={BALCAO.h + 6} stroke={cor.madeiraEscura} strokeWidth={2} opacity={0.35} />
      ))}
      <line x1={0} y1={22} x2={L} y2={22} stroke={cor.madeiraEscura} strokeWidth={3} opacity={0.6} />
    </svg>
  </div>
);

// o fundo atrás da moldura da pessoa (aparece só nas laterais) e a moldura de madeira por cima do vídeo
export const FundoDaMoldura: React.FC = () => (
  <div style={{ position: "absolute", left: MOLDURA.x, top: MOLDURA.y, width: MOLDURA.w, height: MOLDURA.h, borderRadius: MOLDURA.raio, background: cor.tinta }} />
);
export const AroDaMoldura: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: MOLDURA.x,
      top: MOLDURA.y,
      width: MOLDURA.w,
      height: MOLDURA.h,
      borderRadius: MOLDURA.raio,
      boxSizing: "border-box",
      border: `10px solid ${cor.madeira}`,
      pointerEvents: "none",
    }}
  />
);

// O cartão de apresentação: no canto de cima à esquerda da moldura da pessoa, na folga acima da
// cabeça, nos primeiros segundos. Nome em Plus Jakarta 800 (40 px, nunca menos de 34) e área em 600
// (28 px, nunca menos de 24); a largura nunca passa de 460 px (longe do rosto).
export const ALTURA_TARJA = 96;
export const Tarja: React.FC<{ t: number; plano: Plano; de: number; ate: number }> = ({ t, plano, de, ate }) => {
  const nome = plano.marca?.nome?.trim();
  if (!nome || ate <= de || t < de || t > ate + 0.3) return null;
  const area = plano.marca?.area?.trim();
  const p = prog(t, de, 0.4);
  const s = saindo(t, ate, 0.3);
  const larg = 460 - 12 - 70 - 16 - 30;
  const fN = caber(nome, larg, 40, 34, 1, 800);
  const fA = area ? caber(area, larg, 28, 24, 1, 600) : null;
  return (
    <div
      style={{
        position: "absolute",
        left: MOLDURA.x + 34,
        top: COSTURA + 20,
        height: ALTURA_TARJA,
        maxWidth: 460,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 30px 0 12px",
        borderRadius: ALTURA_TARJA / 2,
        background: cor.papel,
        border: `3px solid ${cor.papelBorda}`,
        boxShadow: "0 10px 24px rgba(59,36,22,0.22)",
        opacity: p * (1 - s),
        transform: `translateX(${(1 - p) * -40 + s * -40}px)`,
      }}
    >
      <div style={{ width: 70, height: 70, borderRadius: 35, flexShrink: 0, background: cor.acento, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonte, fontWeight: 800, fontSize: 34, color: cor.papel }}>
        {nome.slice(0, 1).toUpperCase()}
      </div>
      <div>
        <div style={{ fontFamily: fonte, fontWeight: 800, fontSize: fN.tamanho, color: cor.tinta, lineHeight: 1.1, letterSpacing: "-0.015em", whiteSpace: "nowrap" }}>{fN.linhas.join(" ")}</div>
        {fA ? <div style={{ fontFamily: fonte, fontWeight: 600, fontSize: fA.tamanho, color: cor.tintaSuave, lineHeight: 1.25, whiteSpace: "nowrap" }}>{fA.linhas.join(" ")}</div> : null}
      </div>
    </div>
  );
};
