// Peças do cartaz de luta: a placa inclinada (paralelogramo) com o texto reto por dentro,
// o fundo da arena (os dois cantos) e a costura entre a arena e a pessoa.
import type { CSSProperties } from "react";
import { COSTURA } from "../layout";
import { encaixar, type Fonte } from "../medida";
import { cor, fonte, INCLINA } from "../tema";

export type Peso = 600 | 700 | 800 | 900;

// 800/900 = itálico (títulos, nomes, placar); 600/700 = reto (texto corrido)
export const estiloFonte = (peso: Peso, tamanho: number, caixaAlta = peso >= 800): CSSProperties => ({
  fontFamily: fonte,
  fontWeight: peso,
  fontStyle: peso >= 800 ? "italic" : "normal",
  fontSize: tamanho,
  lineHeight: 1.04,
  letterSpacing: peso >= 800 ? "0.005em" : "0",
  textTransform: caixaAlta ? "uppercase" : "none",
  whiteSpace: "nowrap",
});

// mede e encaixa: devolve o corpo e as linhas
export const caber = (texto: string, largura: number, max: number, min: number, linhas: number, peso: Peso, caixaAlta = peso >= 800) =>
  encaixar(caixaAlta ? texto.toLocaleUpperCase("pt-BR") : texto, { largura, max, min, linhas, fonte: { peso, caixaAlta } as Fonte });

export const Linhas: React.FC<{ linhas: string[]; tamanho: number; peso: Peso; cor: string; alinhar?: "left" | "center" | "right"; caixaAlta?: boolean }> = ({
  linhas,
  tamanho,
  peso,
  cor: c,
  alinhar = "center",
  caixaAlta,
}) => (
  <div style={{ textAlign: alinhar, color: c }}>
    {linhas.map((l, i) => (
      <div key={i} style={estiloFonte(peso, tamanho, caixaAlta)}>
        {l}
      </div>
    ))}
  </div>
);

// placa inclinada: o fundo é um paralelogramo, o texto fica reto (o itálico já dá o ângulo)
export const Placa: React.FC<{
  fundo: string;
  children: React.ReactNode;
  padX?: number;
  padY?: number;
  sombra?: string;
  borda?: string;
  style?: CSSProperties;
}> = ({ fundo, children, padX = 26, padY = 10, sombra, borda, style }) => (
  <div style={{ position: "relative", display: "inline-block", padding: `${padY}px ${padX}px`, ...style }}>
    <div style={{ position: "absolute", inset: 0, background: fundo, transform: `skewX(${INCLINA}deg)`, boxShadow: sombra, border: borda, borderRadius: 4 }} />
    <div style={{ position: "relative" }}>{children}</div>
  </div>
);

// ——— o fundo da arena: dois cantos (vermelho à esquerda, azul à direita), linhas de velocidade ———

export const FundoArena: React.FC<{ t: number; forcaA?: number; forcaB?: number }> = ({ t, forcaA = 0.5, forcaB = 0.5 }) => {
  // a linha que divide os cantos anda para o lado de quem está mais forte (de leve)
  const meio = 540 + (forcaA - forcaB) * 70;
  const deriva = (t * 26) % 64;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: COSTURA, overflow: "hidden", background: cor.fundo }}>
      <svg width={1080} height={COSTURA} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="va" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={cor.a} stopOpacity={0.42} />
            <stop offset="1" stopColor={cor.a} stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="vb" x1="1" x2="0" y1="0" y2="0">
            <stop offset="0" stopColor={cor.b} stopOpacity={0.4} />
            <stop offset="1" stopColor={cor.b} stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="sombraTopo" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity={0.55} />
            <stop offset="0.25" stopColor="#000" stopOpacity={0} />
            <stop offset="0.85" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.35} />
          </linearGradient>
        </defs>
        <polygon points={`0,0 ${meio + 80},0 ${meio - 80},${COSTURA} 0,${COSTURA}`} fill="url(#va)" />
        <polygon points={`${meio + 80},0 1080,0 1080,${COSTURA} ${meio - 80},${COSTURA}`} fill="url(#vb)" />
        <line x1={meio + 80} y1={0} x2={meio - 80} y2={COSTURA} stroke={cor.papel} strokeOpacity={0.22} strokeWidth={3} />
        <rect width={1080} height={COSTURA} fill="url(#sombraTopo)" />
      </svg>
      {/* linhas de velocidade inclinadas, andando devagar: a arena nunca fica parada */}
      <div
        style={{
          position: "absolute",
          inset: -80,
          backgroundImage: `repeating-linear-gradient(${90 + INCLINA}deg, rgba(255,247,236,0.045) 0px, rgba(255,247,236,0.045) 3px, transparent 3px, transparent 32px)`,
          backgroundPosition: `${deriva}px 0px`,
        }}
      />
    </div>
  );
};

// a costura: uma faixa vermelha e azul, cortada em diagonal no meio
export const Costura: React.FC = () => (
  <svg width={1080} height={16} style={{ position: "absolute", left: 0, top: COSTURA - 8 }}>
    <polygon points="0,0 552,0 528,16 0,16" fill={cor.a} />
    <polygon points="560,0 1080,0 1080,16 536,16" fill={cor.b} />
  </svg>
);
