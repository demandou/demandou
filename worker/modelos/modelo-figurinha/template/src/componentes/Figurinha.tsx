// Peças de papel do álbum: a figurinha (recorte com borda branca, que descola pelo canto),
// a etiqueta (rótulo de papel colado) e o selo redondo de número.
import { mistura, prog, saindo } from "../anim";
import { cor, titulo } from "../tema";

// Sombra de papel: curta quando colada, longa quando a figurinha está no ar.
export const sombraDePapel = (levanta: number) =>
  `drop-shadow(0 ${(2 + 18 * levanta).toFixed(1)}px ${(3 + 22 * levanta).toFixed(1)}px rgba(58,40,24,${(0.2 + 0.08 * levanta).toFixed(3)}))`;

export const Figurinha: React.FC<{
  w: number;
  h: number;
  fundo: string;
  raio?: number;
  // espessura da borda branca do recorte
  borda?: number;
  // 0 = colada na página, 1 = no ar
  levanta?: number;
  // 0–1: o canto de baixo descolando (à direita, ou à esquerda com `cantoEsquerdo`)
  canto?: number;
  cantoEsquerdo?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ w, h, fundo, raio = 24, borda = 14, levanta = 0, canto = 0, cantoEsquerdo = false, children, style }) => {
  const c = Math.max(0, canto) * Math.min(w, h) * 0.36;
  const recorte =
    c > 0.5
      ? cantoEsquerdo
        ? `polygon(0 0, 100% 0, 100% 100%, ${c}px 100%, 0 ${h - c}px)`
        : `polygon(0 0, 100% 0, 100% ${h - c}px, ${w - c}px 100%, 0 100%)`
      : undefined;
  return (
    <div style={{ position: "absolute", width: w, height: h, filter: sombraDePapel(levanta), ...style }}>
      <div style={{ position: "absolute", inset: 0, background: cor.branco, borderRadius: raio, clipPath: recorte }}>
        <div
          style={{
            position: "absolute",
            inset: borda,
            backgroundColor: fundo,
            // retícula de impressão bem fina, como figurinha de verdade
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1.5px, transparent 1.9px)",
            backgroundSize: "16px 16px",
            borderRadius: Math.max(4, raio - borda * 0.6),
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      </div>
      {c > 0.5 ? (
        // a aba dobrada: o verso da figurinha (papel liso), refletido na linha da dobra
        <svg width={c} height={c} style={{ position: "absolute", left: cantoEsquerdo ? 0 : w - c, top: h - c, overflow: "visible" }}>
          {cantoEsquerdo ? (
            <>
              <path d={`M${c} ${c} L0 0 L${c * 0.94} ${c * 0.06} Z`} fill="#EEE8DC" stroke="#D9D0C0" strokeWidth={1.5} strokeLinejoin="round" />
              <path d={`M${c} ${c} L0 0`} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d={`M0 ${c} L${c} 0 L${c * 0.06} ${c * 0.06} Z`} fill="#EEE8DC" stroke="#D9D0C0" strokeWidth={1.5} strokeLinejoin="round" />
              <path d={`M0 ${c} L${c} 0`} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
            </>
          )}
        </svg>
      ) : null}
    </div>
  );
};

// Entrada de papel colado: chega um pouco maior e inclinado e assenta no lugar (sem quique).
export const colando = (t: number, em: number, dur = 0.42) => {
  const p = prog(t, em, dur);
  return {
    p,
    style: {
      opacity: Math.min(1, p * 2.2),
      scale: String(mistura(1.08, 1, p)),
      translate: `0 ${mistura(26, 0, p)}px`,
    } as React.CSSProperties,
    giro: mistura(3, 0, p),
  };
};

// Saída: o papel é puxado para BAIXO (para longe do rosto), girando um pouco — fica opaco quase
// até sair, para não virar uma transparência suja por cima da pessoa.
export const descolando = (t: number, ate: number, dur = 0.3) => {
  const s = saindo(t, ate, dur);
  const fora = 1 - s ** 4;
  return {
    s,
    fora,
    dx: 40 * s,
    dy: 620 * s,
    giro: 5 * s,
    style: { opacity: fora, translate: `${40 * s}px ${620 * s}px`, rotate: `${5 * s}deg` } as React.CSSProperties,
  };
};

// Etiqueta: rótulo de papel creme colado na página (ou sobre a pessoa, na altura do peito).
export const Etiqueta: React.FC<{
  x: number;
  y: number;
  w: number;
  t: number;
  entra: number;
  sai: number;
  inclinacao?: number;
  fundo?: string;
  padding?: string;
  children: React.ReactNode;
  // algo que fica atrás da etiqueta e espia por cima (o cachorro)
  atras?: React.ReactNode;
  // algo colado por cima (selo de número, figurinha pequena)
  frente?: React.ReactNode;
}> = ({ x, y, w, t, entra, sai, inclinacao = -1.5, fundo = cor.cartela, padding = "34px 42px 38px", children, atras, frente }) => {
  if (t < entra - 0.02 || t > sai + 0.05) return null;
  const e = colando(t, entra);
  const d = descolando(t, sai);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        rotate: `${inclinacao + e.giro + d.giro}deg`,
        ...e.style,
        opacity: (e.style.opacity as number) * d.fora,
        translate: `${d.dx}px ${mistura(26, 0, e.p) + d.dy}px`,
      }}
    >
      {atras}
      <div style={{ position: "relative", filter: sombraDePapel(0.12) }}>
        <div style={{ background: cor.branco, borderRadius: 30, padding: 12 }}>
          <div style={{ background: fundo, borderRadius: 22, padding }}>{children}</div>
        </div>
      </div>
      {frente}
    </div>
  );
};

// Selo redondo de número (figurinha redonda), colado no canto de uma etiqueta.
export const Selo: React.FC<{ texto: string; diametro: number; t: number; em: number; fundo?: string; style?: React.CSSProperties }> = ({
  texto,
  diametro,
  t,
  em,
  fundo = cor.carimbo,
  style,
}) => {
  if (t < em - 0.02) return null;
  const e = colando(t, em, 0.36);
  return (
    <div style={{ position: "absolute", width: diametro, height: diametro, rotate: `${-9 + e.giro * 2}deg`, ...e.style, filter: sombraDePapel(0.15), ...style }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: cor.branco }} />
      <div
        style={{
          position: "absolute",
          inset: 10,
          borderRadius: "50%",
          background: fundo,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...titulo(Math.round(diametro * (texto.length > 2 ? 0.34 : 0.56))),
          color: cor.cartela,
          paddingBottom: diametro * 0.04,
        }}
      >
        {texto}
      </div>
    </div>
  );
};
