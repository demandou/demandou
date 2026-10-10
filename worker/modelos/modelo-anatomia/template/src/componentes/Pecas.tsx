// Peças da linguagem clínica: rótulo de prancha (ponto → linha-guia → nome sublinhado), retícula que
// marca uma região, selo "conteúdo ilustrativo", seringa em traço fino e o mostrador do ponto.
import { Rise } from "../anim";
import { encaixar, larguraTexto, quebrarLinhas } from "../medida";
import { EASE_IN, EASE_INOUT, EASE_OUT, FONT, K, prog, win } from "../tema";

/** rótulo clínico: ponto na âncora → linha-guia → título sublinhado (+ função, + número grande) */
export const Rotulo: React.FC<{
  t: number;
  ax: number;
  ay: number;
  lado: "esquerda" | "direita";
  y: number;
  titulo: string;
  tIn: number;
  sub?: string;
  tSub?: number;
  out: number;
  grande?: string;
  tGrande?: number;
  xBorda?: number;
}> = ({ t, ax, ay, lado, y, titulo, tIn, sub, tSub, out, grande, tGrande, xBorda }) => {
  if (t < tIn - 0.2 || t > out + 0.45) return null;
  const fit = encaixar(titulo, { largura: 430, max: 42, min: 34, linhas: 1, fonte: { peso: 650 } });
  // largura da linha: o título inteiro + folga, entre 262 e 440
  // a função cabe numa linha quando dá (a tabela da Sora 600 mede a 500 um pouco larga: × 0,94)
  const wSub = sub ? larguraTexto(sub, 30, { peso: 500 }) * 0.94 + 4 : 0;
  const w = Math.max(262, Math.min(440, Math.max(medirTitulo(titulo, fit.tamanho) + 10, wSub)));
  const subFit = sub ? (wSub <= w ? [sub] : quebrarLinhas(sub, w, 30, { peso: 500 })) : [];
  const pDot = prog(t, tIn - 0.1, tIn + 0.2, EASE_OUT);
  const pLine = prog(t, tIn - 0.02, tIn + 0.42, EASE_INOUT);
  const o = prog(t, out, out + 0.4, EASE_IN);
  const borda = xBorda ?? (lado === "esquerda" ? 64 : 1016);
  const x0 = lado === "esquerda" ? borda : borda - w;
  const x1 = lado === "esquerda" ? borda + w : borda;
  const near = lado === "esquerda" ? x1 : x0;
  const far = lado === "esquerda" ? x0 : x1;
  const path = `M${ax} ${ay} L${near} ${y} L${far} ${y}`;
  const alinhar = lado === "esquerda" ? "left" : "right";
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - o, filter: o > 0 ? `blur(${o * 6}px)` : undefined }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path d={path} fill="none" stroke={K.ink} strokeWidth={1.8} strokeOpacity={0.7} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - pLine} />
        <circle cx={ax} cy={ay} r={13 * pDot} fill={K.acc} opacity={0.18} />
        <circle cx={ax} cy={ay} r={6.5 * pDot} fill={K.acc} stroke="#fff" strokeWidth={2.5} />
      </svg>
      <div style={{ position: "absolute", left: x0, width: w, top: y - fit.tamanho * 1.32 - 6, textAlign: alinhar, fontFamily: FONT, fontWeight: 650, fontSize: fit.tamanho, letterSpacing: "-0.01em", color: K.ink, lineHeight: 1.25, whiteSpace: "nowrap" }}>
        <Rise t={t} at={tIn + 0.08}>{titulo}</Rise>
      </div>
      {sub && tSub !== undefined ? (
        <div style={{ position: "absolute", left: x0, width: w, top: y + 10, textAlign: alinhar, fontFamily: FONT, fontWeight: 500, fontSize: 30, color: K.ink2, lineHeight: 1.22 }}>
          {subFit.map((l, i) => (
            <div key={i} style={{ whiteSpace: "nowrap" }}>
              <Rise t={t} at={tSub + i * 0.08}>{l}</Rise>
            </div>
          ))}
        </div>
      ) : null}
      {grande && tGrande !== undefined ? (
        <div style={{ position: "absolute", left: lado === "esquerda" ? x0 : x1 - 420, width: 420, top: y + 10 + Math.max(1, subFit.length) * 36, textAlign: alinhar, fontFamily: FONT, fontWeight: 700, fontSize: 150, letterSpacing: "-0.02em", color: K.acc, lineHeight: 1.05 }}>
          <Rise t={t} at={tGrande} dur={0.5}>
            {grande}
          </Rise>
        </div>
      ) : null}
    </div>
  );
};

// largura do título (Sora 650 ≈ 700) em px
const medirTitulo = (texto: string, tamanho: number) => larguraTexto(texto, tamanho, { peso: 650 });

/** retícula clínica: elipse que se desenha + 4 marcas (marca a região dita) */
export const Reticula: React.FC<{ t: number; cx: number; cy: number; rx: number; ry: number; a: number; b: number; cor?: string }> = ({ t, cx, cy, rx, ry, a, b, cor = K.acc }) => {
  const p = win(t, a - 0.05, b, 0.45, 0.35);
  if (p <= 0) return null;
  const RX = rx * (0.9 + 0.1 * p);
  const RY = ry * (0.9 + 0.1 * p);
  const draw = prog(t, a - 0.05, a + 0.5, EASE_INOUT);
  const tick = (ang: number) => {
    const ux = Math.cos(ang);
    const uy = Math.sin(ang);
    return `M${cx + ux * (RX + 6)} ${cy + uy * (RY + 6)} L${cx + ux * (RX + 24)} ${cy + uy * (RY + 24)}`;
  };
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: p, overflow: "visible" }}>
      <path d={`M${cx} ${cy - RY} A${RX} ${RY} 0 1 1 ${cx} ${cy + RY} A${RX} ${RY} 0 1 1 ${cx} ${cy - RY}`} fill={cor} fillOpacity={0.05} stroke={cor} strokeWidth={2.4} pathLength={1} strokeDasharray={`${draw} 1`} />
      <path d={[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map(tick).join("")} stroke={cor} strokeWidth={2.4} strokeLinecap="round" opacity={draw} />
    </svg>
  );
};

/** selo discreto "conteúdo ilustrativo" */
export const Selo: React.FC<{ a: number; x: number; y: number; texto?: string }> = ({ a, x, y, texto = "conteúdo ilustrativo" }) =>
  a <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, opacity: a, transform: `translateY(${(1 - a) * -8}px)`, display: "flex", alignItems: "center", gap: 10, padding: "8px 18px 9px", borderRadius: 999, background: "rgba(255,255,255,0.86)", border: `1.5px solid ${K.line}`, fontFamily: FONT, fontWeight: 500, fontSize: 28, color: K.slate, letterSpacing: "0.005em", whiteSpace: "nowrap" }}>
      <svg width={20} height={20} viewBox="0 0 20 20">
        <circle cx={10} cy={10} r={8.5} fill="none" stroke={K.slate} strokeWidth={1.8} />
        <path d="M10 9 L10 14.5 M10 5.6 L10 6.4" stroke={K.slate} strokeWidth={2} strokeLinecap="round" />
      </svg>
      {texto}
    </div>
  );

/** seringa de preenchimento (traço fino), 430×96. push = êmbolo empurrando, strike = risco */
export const Seringa: React.FC<{ draw: number; push: number; strike: number; label: number; dimmed: number; texto: string }> = ({ draw, push, strike, label, dimmed, texto }) => {
  const SC = 1.1;
  const d = (k = 0) => ({ pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - Math.max(0, Math.min(1, draw * 1.4 - k * 0.12)) });
  const stopX = 108 + push * 70;
  const fit = encaixar(texto.toUpperCase(), { largura: 236, max: 36, min: 22, linhas: 1, fonte: { peso: 800, espacamento: 0.02 } });
  return (
    <svg width={430 * SC} height={96 * SC} viewBox="0 0 430 96" style={{ overflow: "visible" }}>
      <g opacity={1 - dimmed * 0.5}>
        <rect x={stopX + 8} y={27} width={Math.max(0, 352 - stopX - 8)} height={42} rx={4} fill={K.ice} opacity={Math.min(1, draw * 1.5)} />
        <rect x={92} y={22} width={270} height={52} rx={10} fill="none" stroke={K.ink} strokeWidth={2.6} {...d(0)} />
        <path d="M92 8 L92 88" stroke={K.ink} strokeWidth={4} strokeLinecap="round" {...d(1)} />
        <path d={Array.from({ length: 9 }, (_, i) => `M${150 + i * 24} 22 L${150 + i * 24} ${i % 2 ? 30 : 34}`).join("")} stroke={K.ink2} strokeWidth={1.6} opacity={0.6} {...d(2)} />
        <rect x={stopX} y={26} width={10} height={44} rx={3} fill={K.ink2} opacity={Math.min(1, draw * 1.5) * 0.85} />
        <path d={`M${stopX} 48 L${stopX - 92 + 4} 48`} stroke={K.ink} strokeWidth={4} strokeLinecap="round" {...d(2)} />
        <path d={`M${stopX - 88} 26 L${stopX - 88} 70`} stroke={K.ink} strokeWidth={5} strokeLinecap="round" {...d(3)} />
        <path d="M362 36 L384 42 L384 54 L362 60" fill="none" stroke={K.ink} strokeWidth={2.4} strokeLinejoin="round" {...d(3)} />
        <path d="M384 48 L428 48" stroke={K.ink} strokeWidth={1.8} strokeLinecap="round" {...d(4)} />
        <text x={226} y={48 + fit.tamanho * 0.34} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={fit.tamanho} letterSpacing="0.02em" fill={K.ink} opacity={label}>
          {texto.toUpperCase()}
        </text>
      </g>
      <path d="M70 52 L416 44" stroke={K.ink} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - strike} />
    </svg>
  );
};
