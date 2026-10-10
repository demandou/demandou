// Peças de texto do modelo Torre (usadas pela assinatura e pelos blocos universais).
import React from "react";
import { clamp01 } from "../anim";
import type { Palavra } from "../plano";
import { FONTE, K } from "../tema";

export const rotuloCss: React.CSSProperties = { fontFamily: FONTE.sans, fontWeight: 700, fontSize: 30, letterSpacing: "0.3em", textTransform: "uppercase", color: K.ouro, whiteSpace: "nowrap" };
export const serifNum: React.CSSProperties = { fontFamily: FONTE.serifa, fontWeight: 600, color: K.marfim, fontVariantNumeric: "lining-nums tabular-nums", letterSpacing: "-0.01em", lineHeight: 0.86, whiteSpace: "nowrap" };
export const SOMBRA = "drop-shadow(0 6px 24px rgba(3,6,14,0.55))";

/** revelação editorial: sobe por máscara + desfoque; assentada, desenha o conteúdo simples */
export const Rise: React.FC<{ p: number; children: React.ReactNode; dy?: number; style?: React.CSSProperties }> = ({ p, children, dy = 40, style }) =>
  p >= 1 ? (
    <div style={{ paddingBottom: 6, ...style }}>{children}</div>
  ) : (
    <div style={{ overflow: "hidden", paddingBottom: 6, ...style }}>
      <div style={{ transform: `translateY(${(1 - p) * dy}px)`, opacity: clamp01(p * 1.4), filter: `blur(${(1 - p) * 8}px)` }}>{children}</div>
    </div>
  );

/** pílula de vidro-noite com borda champanhe (a etiqueta dos cômodos, dos tópicos, das opções) */
export const Pilula: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; borda?: string }> = ({ children, style, borda = K.ouro }) => (
  <div style={{ display: "inline-flex", alignItems: "baseline", gap: 12, background: K.vidro, border: `1.5px solid ${borda}`, borderRadius: 999, padding: "8px 22px 10px", whiteSpace: "nowrap", ...style }}>{children}</div>
);

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9$%]/g, "");

/** o instante em que cada palavra de `texto` é dita (procura nas palavras do plano a partir de `de`;
    o que não achar fica distribuído entre os vizinhos) */
export const temposDoTexto = (palavras: Palavra[], texto: string, de: number, ate: number): number[] => {
  const toks = texto.split(/\s+/).filter(Boolean);
  const cand = palavras.filter((p) => p.em >= de - 0.35 && p.em <= ate + 0.2);
  const out: Array<number | null> = [];
  let j = 0;
  for (const tk of toks) {
    const n = norm(tk);
    let achou: number | null = null;
    for (let k = j; k < cand.length && k < j + 6; k++) {
      if (norm(cand[k].w) === n && n) {
        achou = cand[k].em;
        j = k + 1;
        break;
      }
    }
    out.push(achou);
  }
  // preenche os que faltaram
  const res: number[] = [];
  for (let i = 0; i < out.length; i++) {
    if (out[i] !== null) {
      res.push(out[i] as number);
      continue;
    }
    const antes = i > 0 ? res[i - 1] : de;
    let k = i + 1;
    while (k < out.length && out[k] === null) k++;
    const depois = k < out.length ? (out[k] as number) : Math.max(antes + 0.2, ate - 0.3);
    res.push(antes + (depois - antes) / (k - i + 1));
  }
  return res;
};

/** ícones de linha (traço champanhe), sem marca nenhuma */
export const Icone: React.FC<{ nome: string; tam?: number; cor?: string }> = ({ nome, tam = 46, cor = K.marfim }) => {
  const sw = 3.4;
  const p = { fill: "none", stroke: cor, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const corpo = (() => {
    switch (nome) {
      case "metro":
        return (
          <>
            <rect x={7} y={3} width={32} height={34} rx={8} {...p} />
            <line x1={7} y1={21} x2={39} y2={21} {...p} />
            <circle cx={15} cy={29} r={1.8} fill={cor} />
            <circle cx={31} cy={29} r={1.8} fill={cor} />
            <path d="M14 38 L8 49 M32 38 L38 49" {...p} />
          </>
        );
      case "onibus":
        return (
          <>
            <rect x={6} y={4} width={34} height={38} rx={6} {...p} />
            <line x1={6} y1={24} x2={40} y2={24} {...p} />
            <line x1={6} y1={12} x2={40} y2={12} {...p} />
            <circle cx={14} cy={33} r={2} fill={cor} />
            <circle cx={32} cy={33} r={2} fill={cor} />
            <path d="M11 42 L11 48 M35 42 L35 48" {...p} />
          </>
        );
      case "escola":
        return (
          <>
            <path d="M3 18 L23 8 L43 18 L23 28 Z" {...p} />
            <path d="M11 22 L11 33 C 16 38, 30 38, 35 33 L35 22" {...p} />
            <path d="M43 18 L43 30" {...p} />
          </>
        );
      case "parque":
        return (
          <>
            <circle cx={23} cy={18} r={13} {...p} />
            <path d="M23 31 L23 48 M23 38 L17 33 M23 36 L29 31" {...p} />
          </>
        );
      case "mercado":
        return (
          <>
            <path d="M3 8 L10 8 L15 33 L38 33 L42 15 L12 15" {...p} />
            <circle cx={18} cy={42} r={3} {...p} />
            <circle cx={35} cy={42} r={3} {...p} />
          </>
        );
      case "praia":
        return (
          <>
            <circle cx={30} cy={14} r={8} {...p} />
            <path d="M3 34 C 9 29, 15 29, 21 34 S 33 39, 43 34 M3 44 C 9 39, 15 39, 21 44 S 33 49, 43 44" {...p} />
          </>
        );
      case "hospital":
        return (
          <>
            <rect x={5} y={5} width={36} height={36} rx={9} {...p} />
            <path d="M23 13 L23 33 M13 23 L33 23" {...p} />
          </>
        );
      case "shopping":
        return (
          <>
            <path d="M8 15 L38 15 L35 45 L11 45 Z" {...p} />
            <path d="M16 19 L16 12 C 16 4, 30 4, 30 12 L30 19" {...p} />
          </>
        );
      case "pe":
        return (
          <>
            <circle cx={15} cy={5} r={3.6} fill={cor} />
            <path d="M14 11 L11 23 L16 30 L18 38 M11 23 L6 38 M13 14 L6 18 L4 24 M14 14 L19 19 L24 20" {...p} />
          </>
        );
      case "carro":
        return (
          <>
            <path d="M4 30 L4 22 L10 12 L34 12 L40 22 L40 30 Z" {...p} />
            <line x1={4} y1={22} x2={40} y2={22} {...p} />
            <circle cx={12} cy={32} r={4} {...p} />
            <circle cx={32} cy={32} r={4} {...p} />
          </>
        );
      case "bicicleta":
        return (
          <>
            <circle cx={10} cy={32} r={8} {...p} />
            <circle cx={36} cy={32} r={8} {...p} />
            <path d="M10 32 L18 16 L30 16 L36 32 M18 16 L24 32 L30 16 M16 12 L22 12" {...p} />
          </>
        );
      case "salvar":
        return <path d="M11 5 L35 5 L35 43 L23 34 L11 43 Z" {...p} />;
      case "seguir":
        return (
          <>
            <circle cx={19} cy={15} r={8} {...p} />
            <path d="M4 42 C 4 30, 34 30, 34 42 M38 14 L38 28 M31 21 L45 21" {...p} />
          </>
        );
      case "comentar":
        return <path d="M6 8 L40 8 L40 32 L20 32 L10 41 L10 32 L6 32 Z" {...p} />;
      case "link":
        return <path d="M20 26 L28 18 M17 21 L12 26 C 8 30, 14 36, 18 32 L23 27 M29 25 L34 20 C 38 16, 32 10, 28 14 L23 19" {...p} />;
      default:
        // pino
        return (
          <>
            <path d="M23 46 C 23 46 8 28 8 18 A 15 15 0 0 1 38 18 C 38 28 23 46 23 46 Z" {...p} />
            <circle cx={23} cy={18} r={5} {...p} />
          </>
        );
    }
  })();
  return (
    <svg width={tam} height={tam * 1.1} viewBox="0 0 46 50" style={{ overflow: "visible" }}>
      {corpo}
    </svg>
  );
};
