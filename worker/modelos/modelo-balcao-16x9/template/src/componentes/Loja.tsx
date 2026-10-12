// A fachada da loja: a parede, o toldo listrado com o letreiro, a vitrine (moldura de madeira, vidro
// e o reflexo que passa devagar), o balcão e a moldura da pessoa. Na versão deitada (16:9) a fachada
// aparece quando a pessoa vai para a moldura da direita (aula 9 do curso): o toldo de ponta a ponta,
// a vitrine à esquerda, a moldura à direita e o balcão que sobe na frente das duas.
// Nada disso toca na pessoa: a cor do vídeo não muda.
import { Easing } from "remotion";
import { prog, saindo } from "../anim";
import { encaixar, larguraTexto } from "../medida";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { BALCAO, CENTRO_X, cor, fonte, fonteLetreiro, JANELA, MOLDURA, QUADRO, TOLDO, VIDRO } from "../tema";
import { caber } from "./Pecas";

const L = QUADRO.w;
const ESQ = -40;
const LARG_LISTRA = (L - 2 * ESQ) / TOLDO.listras;

// ——— a parede (atrás de tudo) ———
export const Parede: React.FC = () => (
  <div style={{ position: "absolute", left: 0, top: 0, width: L, height: QUADRO.h, overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${cor.paredeEscura} 0%, ${cor.parede} 26%, ${cor.parede} 100%)` }} />
    <svg width={L} height={QUADRO.h} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: Math.ceil(L / 80) }, (_, i) => (
        <line key={i} x1={i * 80 + 20} y1={0} x2={i * 80 + 20} y2={QUADRO.h} stroke={cor.tabua} strokeWidth={3} />
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
// `em` = quando o letreiro desce (o layout decide: a palavra dita, ou quando a fachada aparece)
export const Toldo: React.FC<{ t: number; plano: Plano; em: number }> = ({ t, plano, em }) => {
  const n = TOLDO.listras;
  const r = LARG_LISTRA / 2;
  const listras = Array.from({ length: n }, (_, i) => i);
  const fator = L / (L - 2 * ESQ);
  const xCima = (x: number) => L / 2 + (x - L / 2) * fator;
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
      <Letreiro t={t} plano={plano} em={em} />
    </div>
  );
};

// O letreiro: na palavra dita, a placa creme desce do toldo, balança e o nome se pinta da esquerda para a direita.
// No quadro deitado ele fica em cima da vitrine, centrado no eixo do vidro (como no vertical).
const Letreiro: React.FC<{ t: number; plano: Plano; em: number }> = ({ t, plano, em }) => {
  const nome = plano.fachada?.nome?.trim();
  if (!nome) return null;
  const f = encaixar(nome, { largura: 640, max: 62, min: 36, linhas: 1, fonte: { letreiro: true } });
  const largura = Math.min(760, Math.max(360, larguraTexto(nome, f.tamanho, { letreiro: true }) + 110));
  const h = 92;
  // um pouco mais baixo que no vertical: o nome fica abaixo do título do player (y ~72)
  const top = TOLDO.saia - h / 2 + 26;
  if (t < em - 0.02) return null;
  const pinta = prog(t, em + 0.1, 0.5, Easing.bezier(0.45, 0, 0.3, 1));
  const desce = prog(t, em - 0.02, 0.32, Easing.bezier(0.3, 1.4, 0.5, 1));
  const d = Math.max(0, t - em);
  const balanco = Math.sin(t * 1.1) * 0.5 + 5 * Math.exp(-d / 0.45) * Math.cos(d * 9);
  return (
    <div
      style={{
        position: "absolute",
        left: CENTRO_X - largura / 2,
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

// ——— o balcão de madeira (na frente da vitrine e da pessoa, até o fim do quadro) ———
// `p` = quanto a fachada está à vista: o balcão sobe de baixo do quadro junto com a ida da pessoa
// para a moldura e desce quando ela volta à tela cheia.
export const Balcao: React.FC<{ p: number }> = ({ p }) => (
  <div style={{ position: "absolute", left: 0, top: BALCAO.y - 6, width: L, height: BALCAO.h + 6, transform: p >= 1 ? undefined : `translateY(${(1 - p) * (BALCAO.h + 30)}px)` }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: L, height: 22, background: `linear-gradient(180deg, ${cor.madeiraClara}, #D49B5E)`, boxShadow: "0 -4px 10px rgba(59,36,22,0.18)" }} />
    <div style={{ position: "absolute", left: 0, top: 22, width: L, height: BALCAO.h - 16, background: cor.madeira }} />
    <svg width={L} height={BALCAO.h + 6} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: Math.ceil(L / 112) }, (_, i) => (
        <line key={i} x1={i * 112 + 40} y1={24} x2={i * 112 + 40} y2={BALCAO.h + 6} stroke={cor.madeiraEscura} strokeWidth={2} opacity={0.35} />
      ))}
      <line x1={0} y1={22} x2={L} y2={22} stroke={cor.madeiraEscura} strokeWidth={3} opacity={0.6} />
    </svg>
  </div>
);

// o fundo atrás da moldura da pessoa e a moldura de madeira por cima do vídeo. No quadro deitado a
// moldura acompanha a caixa do vídeo (que desliza da tela cheia até a MOLDURA da direita) e a madeira
// aparece junto com a fachada (`p`).
export const FundoDaMoldura: React.FC<{ caixa: Caixa }> = ({ caixa }) => (
  <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, borderRadius: caixa.raio ?? MOLDURA.raio, background: cor.tinta }} />
);
export const AroDaMoldura: React.FC<{ caixa: Caixa; p: number }> = ({ caixa, p }) => (
  <div
    style={{
      position: "absolute",
      left: caixa.x,
      top: caixa.y,
      width: caixa.w,
      height: caixa.h,
      borderRadius: caixa.raio ?? MOLDURA.raio,
      boxSizing: "border-box",
      border: `10px solid ${cor.madeira}`,
      opacity: Math.min(1, p * 1.5),
      pointerEvents: "none",
    }}
  />
);

// O cartão de apresentação, nos primeiros segundos. Nome em Plus Jakarta 800 (40 px, nunca menos de
// 34) e área em 600 (28 px, nunca menos de 24); a largura nunca passa de 460 px (longe do rosto).
// No quadro deitado ele fica em dois lugares: com a pessoa na moldura, apoiado no balcão, na frente
// dela (embaixo do rosto); com a pessoa em tela cheia, no canto de cima do lado oposto ao rosto.
// (x, y) = o canto de cima à esquerda do cartão; `lado` = de que lado ele entra (1 = da esquerda).
export const ALTURA_TARJA = 96;
export const LARGURA_TARJA = 460;
// a largura que o cartão vai ter (para centrar no balcão ou encostar na margem da direita)
export const larguraDaTarja = (plano: Plano) => {
  const nome = plano.marca?.nome?.trim();
  if (!nome) return 0;
  const area = plano.marca?.area?.trim();
  const larg = LARGURA_TARJA - 12 - 70 - 16 - 30;
  const fN = caber(nome, larg, 40, 34, 1, 800);
  const fA = area ? caber(area, larg, 28, 24, 1, 600) : null;
  const texto = Math.max(larguraTexto(fN.linhas.join(" "), fN.tamanho, { peso: 800 }), fA ? larguraTexto(fA.linhas.join(" "), fA.tamanho, { peso: 600 }) : 0);
  return Math.min(LARGURA_TARJA, Math.ceil(12 + 70 + 16 + 30 + texto + 6));
};
export const Tarja: React.FC<{ t: number; plano: Plano; de: number; ate: number; x: number; y: number; lado?: 1 | -1 }> = ({ t, plano, de, ate, x, y, lado = 1 }) => {
  const nome = plano.marca?.nome?.trim();
  if (!nome || ate <= de || t < de || t > ate + 0.3) return null;
  const area = plano.marca?.area?.trim();
  const p = prog(t, de, 0.4);
  const s = saindo(t, ate, 0.3);
  const larg = LARGURA_TARJA - 12 - 70 - 16 - 30;
  const fN = caber(nome, larg, 40, 34, 1, 800);
  const fA = area ? caber(area, larg, 28, 24, 1, 600) : null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        height: ALTURA_TARJA,
        maxWidth: LARGURA_TARJA,
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
        transform: `translateX(${lado * ((1 - p) * -40 + s * -40)}px)`,
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
