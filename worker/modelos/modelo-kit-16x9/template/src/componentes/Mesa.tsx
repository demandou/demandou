// Peças de mesa: a folha de papel que cai no tampo (com sombra), a fita crepe, o marca-texto,
// o texto que se monta na fala. Todos os blocos do Kit são feitos com elas.
import type { CSSProperties, ReactNode } from "react";
import { prog, queda, rapido } from "../anim";
import { cor, fonte, sombraNoAr } from "../tema";

export const Fita: React.FC<{ x?: string | number; y?: number; w?: number; giro?: number }> = ({ x = "50%", y = -16, w = 124, giro = -3 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: 34,
      marginLeft: -w / 2,
      background: cor.fita,
      border: `1px solid ${cor.fitaBorda}`,
      transform: `rotate(${giro}deg)`,
      boxShadow: "0 2px 3px rgba(60,38,16,0.18)",
    }}
  />
);

// Folha que cai de cima e pousa no instante `em` (centro em x,y, em px do sistema em que estiver).
export const Papel: React.FC<{
  t: number;
  em: number;
  x: number;
  y: number;
  w: number;
  h: number;
  giro?: number;
  fundo?: string;
  fita?: boolean;
  raio?: number;
  children?: ReactNode;
  style?: CSSProperties;
  // 0 = na mesa, 1 = varrida para fora (saída)
  varrida?: number;
}> = ({ t, em, x, y, w, h, giro = 0, fundo = cor.papel, fita = false, raio = 10, children, style, varrida = 0 }) => {
  const q = queda(t, em, giro);
  if (!q.visivel) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        opacity: q.opacity * (1 - varrida),
        transform: `${q.transform ?? ""} translateY(${-varrida * 120}px)`.trim() || undefined,
        background: fundo,
        borderRadius: raio,
        boxShadow: sombraNoAr(Math.max(q.p, varrida)),
        ...style,
      }}
    >
      {fita ? <Fita /> : null}
      {children}
    </div>
  );
};

// O texto que se monta palavra por palavra, no tempo da fala. Palavra ainda não dita fica invisível;
// depois de dita é texto simples (sem camada de animação).
export const TextoNoTempo: React.FC<{
  linhas: string[];
  tamanho: number;
  t: number;
  tempos: number[];
  cor?: string;
  peso?: number;
  alinhar?: "left" | "center";
  destaque?: [number, number] | null;
  risco?: [number, number] | null;
  riscoEm?: number;
  entrelinha?: number;
  caixaAlta?: boolean;
  corMarca?: string;
}> = ({ linhas, tamanho, t, tempos, cor: c = cor.tinta, peso = 800, alinhar = "center", destaque, risco, riscoEm = 0, entrelinha = 1.12, caixaAlta, corMarca = cor.cobaltoClaro }) => {
  let idx = 0;
  return (
    <div style={{ textAlign: alinhar, fontFamily: fonte, fontWeight: peso, fontSize: tamanho, lineHeight: entrelinha, color: c, textTransform: caixaAlta ? "uppercase" : undefined }}>
      {linhas.map((linha, li) => {
        const palavras = linha.split(" ");
        return (
          <div key={li} style={{ whiteSpace: "nowrap" }}>
            {palavras.map((w, k) => {
              const i = idx++;
              const quando = tempos[i] ?? 0;
              const dita = t >= quando;
              const marcada = !!destaque && i >= destaque[0] && i <= destaque[1];
              const riscada = !!risco && i >= risco[0] && i <= risco[1];
              const pm = marcada ? prog(t, quando, 0.32) : 0;
              const pr = riscada ? prog(t, riscoEm + (i - (risco as [number, number])[0]) * 0.07, 0.2) : 0;
              const cola = k < palavras.length - 1 ? " " : "";
              const emEntrada = t < quando + 0.14;
              const entra = emEntrada ? prog(t, quando, 0.14, rapido) : 1;
              return (
                <span
                  key={k}
                  style={{
                    position: "relative",
                    visibility: dita ? "visible" : "hidden",
                    opacity: emEntrada ? entra : undefined,
                    backgroundImage: marcada ? `linear-gradient(${corMarca}, ${corMarca})` : undefined,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "0 88%",
                    backgroundSize: marcada ? `${pm * 100}% 58%` : undefined,
                  }}
                >
                  {w}
                  {cola}
                  {riscada && pr > 0 ? (
                    <i style={{ position: "absolute", left: 0, top: "52%", height: Math.max(5, tamanho * 0.07), width: `${pr * 100}%`, background: cor.alerta, borderRadius: 4 }} />
                  ) : null}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// texto que aparece inteiro (sem palavra a palavra) com uma entrada curta
export const aparece = (t: number, em: number, dur = 0.22): CSSProperties => {
  const p = prog(t, em, dur, rapido);
  if (t >= em + dur) return {};
  return { opacity: p, transform: `translateY(${(1 - p) * 14}px)`, visibility: t >= em ? "visible" : "hidden" };
};

export const Rotulo: React.FC<{ texto: string; fundo?: string; cor?: string; tamanho?: number; style?: CSSProperties }> = ({ texto, fundo = cor.cobalto, cor: c = "#fff", tamanho = 26, style }) => (
  <div
    style={{
      display: "inline-block",
      background: fundo,
      color: c,
      fontFamily: fonte,
      fontWeight: 800,
      fontSize: tamanho,
      letterSpacing: "0.02em",
      padding: `${tamanho * 0.22}px ${tamanho * 0.6}px`,
      borderRadius: 6,
      ...style,
    }}
  >
    {texto}
  </div>
);
