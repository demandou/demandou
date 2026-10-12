// As peças fixas do painel: a carcaça (fundo), o vidro da tela central, as molduras da pessoa
// (tela central, retrovisor de dentro, retrovisor da direita) e a fileira de luzes-espia.
// No quadro deitado (16:9) tudo recebe px do QUADRO (1920×1080): a geometria do layout.ts já vem
// deslocada para o lugar do modo.
import { AbsoluteFill } from "remotion";
import type { Retangulo } from "../layout";
import type { Caixa } from "../motor/caixa";
import type { CorDaLuz, Lampada } from "../plano";
import { cor, H, rotulo, W } from "../tema";
import { Luz } from "./Icones";

// Carcaça: preto fosco com a curva do "capô" do painel e um veio de luz muito discreto no alto
export const Fundo: React.FC<{ luz: number }> = ({ luz }) => (
  <AbsoluteFill style={{ backgroundColor: cor.carcaca }}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 60% at 50% 72%, rgba(255,255,255,${0.035 + 0.02 * luz}) 0%, rgba(255,255,255,0) 60%)`,
      }}
    />
    {/* textura fina de plástico injetado: linhas horizontais quase invisíveis */}
    <AbsoluteFill
      style={{
        backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 5px)",
      }}
    />
  </AbsoluteFill>
);

// Vidro da tela central: preto profundo, aro fino de metal e sombra de profundidade
export const Vidro: React.FC<{ r: Retangulo; raio?: number; children?: React.ReactNode; opacidade?: number }> = ({ r, raio = 28, children, opacidade = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: r.x,
      top: r.y,
      width: r.w,
      height: r.h,
      borderRadius: raio,
      background: `linear-gradient(180deg, #0D0F12 0%, ${cor.vidro} 55%)`,
      boxShadow: `0 0 0 2px #23262B, 0 0 0 6px #0A0B0D, 0 0 0 7.5px #2E3238, 0 24px 50px rgba(0,0,0,0.55)`,
      overflow: "hidden",
      opacity: opacidade,
    }}
  >
    {/* reflexo de vidro: uma faixa diagonal quase invisível no alto */}
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0) 32%)" }} />
    {children}
  </div>
);

// Moldura da tela central (a pessoa como a "câmera do motorista" no meio do painel)
export const MolduraTela: React.FC<{ c: Caixa; peso: number }> = ({ c, peso }) =>
  peso < 0.01 ? null : (
    <div
      style={{
        position: "absolute",
        left: c.x,
        top: c.y,
        width: c.w,
        height: c.h,
        borderRadius: c.raio,
        boxShadow: `0 0 0 2px #23262B, 0 0 0 7px #0A0B0D, 0 0 0 8.5px #3A3F45, 0 26px 60px rgba(0,0,0,0.6)`,
        opacity: peso,
        pointerEvents: "none",
      }}
    />
  );

// Moldura do retrovisor de dentro: aro preto grosso, filete de luz na borda e a haste até o teto
export const MolduraEspelho: React.FC<{ c: Caixa; peso: number }> = ({ c, peso }) => {
  if (peso < 0.01) return null;
  const aro = 16;
  const r = (c.raio ?? 0) + aro;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: peso, pointerEvents: "none" }}>
      {/* haste */}
      <div
        style={{
          position: "absolute",
          left: c.x + c.w / 2 - 22,
          top: c.y - aro - 64,
          width: 44,
          height: 68,
          borderRadius: 10,
          background: "linear-gradient(90deg, #121316, #26292E 50%, #111215)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: c.x - aro,
          top: c.y - aro,
          width: c.w + 2 * aro,
          height: c.h + 2 * aro,
          borderRadius: r,
          // aro por dentro (a caixa da pessoa fica por cima, no vazio do meio)
          boxShadow: `inset 0 0 0 ${aro}px #060708, inset 0 0 0 ${aro + 1.5}px #2A2D32, 0 0 0 1.5px #3C4046, 0 22px 44px rgba(0,0,0,0.6)`,
        }}
      />
    </div>
  );
};

// Moldura do retrovisor da direita: a carcaça do espelho, mais larga do lado de fora, e o braço que
// prende na porta (sai pela esquerda)
export const MolduraLateral: React.FC<{ c: Caixa; peso: number }> = ({ c, peso }) => {
  if (peso < 0.01) return null;
  const t = 22;
  const fora = 30;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: peso, pointerEvents: "none" }}>
      {/* braço */}
      <div
        style={{
          position: "absolute",
          left: c.x - 64,
          top: c.y + c.h * 0.58,
          width: 90,
          height: 58,
          borderRadius: "14px 0 0 14px",
          background: "linear-gradient(180deg, #24272C, #121316)",
          boxShadow: "0 12px 24px rgba(0,0,0,0.5)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: c.x - t,
          top: c.y - t,
          width: c.w + t + fora,
          height: c.h + 2 * t,
          borderRadius: `${(c.raio ?? 0) + t}px ${(c.raio ?? 0) + fora + 26}px ${(c.raio ?? 0) + fora + 26}px ${(c.raio ?? 0) + t}px`,
          background: "linear-gradient(170deg, #2A2E33 0%, #16181B 40%, #0E0F11 100%)",
          boxShadow: "0 0 0 1.5px #3C4046, 0 26px 50px rgba(0,0,0,0.6)",
        }}
      />
    </div>
  );
};

// Filete por cima da caixa da pessoa (o vidro do espelho ou da tela): borda fina e reflexo
export const BrilhoDoVidro: React.FC<{ c: Caixa; reflexo: number }> = ({ c, reflexo }) => (
  <div
    style={{
      position: "absolute",
      left: c.x,
      top: c.y,
      width: c.w,
      height: c.h,
      borderRadius: c.raio,
      boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.10)",
      background: `linear-gradient(155deg, rgba(255,255,255,${0.07 * reflexo}) 0%, rgba(255,255,255,0) 26%)`,
      pointerEvents: "none",
    }}
  />
);

// Fileira de luzes-espia: sempre no painel, muda de lugar e de tamanho com o modo. Com até 3 luzes,
// elas ocupam de x1 a x2; com 4, cabem no mesmo espaço (as luzes diminuem se precisar), para não
// encostarem umas nas outras, nos mostradores nem na borda do painel da condição.
export const posicaoNaFileira = (g: { x1: number; x2: number; tam: number }, n: number, i: number) => {
  if (n <= 1) return { x: (g.x1 + g.x2) / 2, tam: g.tam };
  if (n <= 3) return { x: g.x1 + ((g.x2 - g.x1) * i) / (n - 1), tam: g.tam };
  const disponivel = g.x2 - g.x1 + g.tam;
  const tam = Math.min(g.tam, disponivel / (n * 1.12));
  const passo = (disponivel - tam) / (n - 1);
  return { x: (g.x1 + g.x2) / 2 + (i - (n - 1) / 2) * passo, tam };
};

export const FaixaDeLuzes: React.FC<{
  icones: Lampada[];
  g: { x1: number; x2: number; y: number; tam: number };
  acesa: (i: Lampada) => number;
  corDe: (i: Lampada) => CorDaLuz | undefined;
  opacidade?: number;
}> = ({ icones, g, acesa, corDe, opacidade = 1 }) => {
  const n = icones.length;
  return (
    <>
      {icones.map((ic, i) => {
        const { x, tam } = posicaoNaFileira(g, n, i);
        return (
          <Luz
            key={ic}
            icone={ic}
            acesa={acesa(ic)}
            corLuz={corDe(ic)}
            tamanho={tam}
            style={{ position: "absolute", left: x - tam / 2, top: g.y - tam / 2, opacity: opacidade }}
          />
        );
      })}
    </>
  );
};

// "Perfil do motorista" (nome e área) no canto da tela central
export const Perfil: React.FC<{ nome: string; area: string; x: number; y: number; p: number }> = ({ nome, area, x, y, p }) =>
  !nome && !area ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 22px 12px 16px",
        borderRadius: 999,
        background: "rgba(7,8,10,0.78)",
        boxShadow: "inset 0 0 0 1.5px rgba(241,237,228,0.14)",
        opacity: p,
        translate: `${(1 - p) * -18}px 0`,
      }}
    >
      <svg width={34} height={34} viewBox="0 0 34 34">
        <circle cx={17} cy={12} r={6} fill="none" stroke={cor.marfim} strokeWidth={2.6} />
        <path d="M6 30 Q6 20 17 20 Q28 20 28 30" fill="none" stroke={cor.marfim} strokeWidth={2.6} strokeLinecap="round" />
      </svg>
      <span style={rotulo(32, { color: cor.marfim, letterSpacing: "0.1em" })}>{nome}</span>
      {area ? <span style={rotulo(32, { letterSpacing: "0.1em" })}>· {area}</span> : null}
    </div>
  );

// O alto do volante, embaixo dos mostradores (no quadro deitado, na base do painel da esquerda): só
// a curva do aro em couro escuro e a faixa de centro, que mostra quando o volante gira (ao encostar).
// `cx` é o meio do painel e `topo`, o alto do aro (px do quadro).
export const Volante: React.FC<{ giro: number; cx: number; topo: number }> = ({ giro, cx, topo }) => {
  const r = 900;
  const cy = topo + 42 + r;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <linearGradient id="couro" x1="0" y1={topo + 22} x2="0" y2={topo + 362} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1C1E22" />
          <stop offset="0.5" stopColor="#111215" />
          <stop offset="1" stopColor="#0A0B0C" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#couro)" strokeWidth={84} style={{ filter: "drop-shadow(0 -10px 24px rgba(0,0,0,0.55))" }} />
      <circle cx={cx} cy={cy} r={r + 41} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={r - 41} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={2} />
      <g transform={`rotate(${giro} ${cx} ${cy})`}>
        {/* costura e a faixa de centro */}
        <circle cx={cx} cy={cy} r={r + 22} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={2} strokeDasharray="7 9" />
        <circle cx={cx} cy={cy} r={r - 22} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={2} strokeDasharray="7 9" />
        <rect x={cx - 13} y={cy - r - 42} width={26} height={84} rx={3} fill="#8C9198" opacity={0.75} />
      </g>
    </svg>
  );
};

// o conteúdo de um momento tem duas partes: o que fica DENTRO da tela central (recortado pelo vidro,
// então aparece e some junto com a tela quando ela cresce ou encolhe) e o que fica fora dela
export type Parte = "tela" | "fora";

export const NaTela: React.FC<{ r: Retangulo; raio?: number; children: React.ReactNode }> = ({ r, raio = 26, children }) => (
  <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, overflow: "hidden", borderRadius: raio }}>
    <div style={{ position: "absolute", left: -r.x, top: -r.y, width: W, height: H }}>{children}</div>
  </div>
);
