import { prog, useTempo } from "../anim";
import { encaixar } from "../medida";
import { cor, sans } from "../tema";
import { Valor } from "./Valor";

export type TipoDeTendencia = "sobe" | "cai" | "oscila" | "estavel";

export const corDaTendencia = (tipo: TipoDeTendencia) =>
  tipo === "sobe" ? cor.positivo : tipo === "cai" ? cor.negativo : tipo === "oscila" ? cor.ambar : cor.neutro;

// Forma ilustrativa de uma tendência (valores de 0 a 1), com uma oscilação leve para parecer
// um dado de verdade e não uma curva de livro. Sempre a mesma para o mesmo `n`.
const RUIDO = [0, 0.055, -0.035, 0.045, -0.05, 0.03, -0.02, 0.05, -0.04, 0.025, -0.03, 0.04];
export const formaDaTendencia = (tipo: TipoDeTendencia, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const x = n > 1 ? i / (n - 1) : 1;
    const ruido = i === 0 || i === n - 1 ? 0 : RUIDO[i % RUIDO.length];
    const crescer = (Math.exp(1.7 * x) - 1) / (Math.exp(1.7) - 1);
    if (tipo === "sobe") return 0.12 + 0.78 * crescer + ruido;
    if (tipo === "cai") return 0.9 - 0.74 * (1 - (1 - x) ** 1.6) + ruido;
    if (tipo === "oscila") return 0.5 + 0.26 * Math.sin(x * Math.PI * 3.2) + ruido * 0.6;
    return 0.5 + ruido * 0.6;
  });

const SETAS: Record<TipoDeTendencia, string> = {
  sobe: "M28,84 L84,28 M50,28 L84,28 L84,62",
  cai: "M28,28 L84,84 M84,50 L84,84 L50,84",
  oscila: "M20,62 C34,30 46,30 56,56 S78,86 92,48",
  estavel: "M22,56 L90,56 M70,38 L90,56 L70,74",
};

// Indicador de tendência do cabeçalho: um selo com a seta que se desenha e, ao lado, a leitura
// ("em alta", "caindo"), quando o plano dá uma. Serve no lugar do contador quando não há número.
export const IndicadorDeTendencia: React.FC<{ tipo: TipoDeTendencia; em: number; leitura?: string; leituraEm?: number; largura: number; cor?: string }> = ({
  tipo,
  em,
  leitura,
  leituraEm,
  largura,
  cor: corDada,
}) => {
  const t = useTempo();
  const c = corDada ?? corDaTendencia(tipo);
  const p = prog(t, em, 0.5);
  const pSeta = prog(t, em + 0.15, 0.7);
  const lado = leitura ? 112 : 132;
  const medida = leitura ? encaixar(leitura, { largura: largura - lado - 26, max: 58, min: 40, linhas: 2, fonte: { peso: 600, espacamento: -0.015 } }) : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 26, opacity: Math.min(1, p * 2) }}>
      <svg width={lado} height={lado} viewBox="0 0 112 112" style={{ flexShrink: 0 }}>
        <rect x={2} y={2} width={108} height={108} rx={24} fill={c} fillOpacity={0.12 * p} stroke={c} strokeOpacity={0.55} strokeWidth={2.5} />
        <path
          d={SETAS[tipo]}
          fill="none"
          stroke={c}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - pSeta}
        />
      </svg>
      {medida ? (
        <div
          style={{
            fontFamily: sans,
            fontWeight: 600,
            fontSize: medida.tamanho,
            lineHeight: 1.08,
            letterSpacing: "-0.015em",
            color: c,
            opacity: prog(t, Math.max(em + 0.25, (leituraEm ?? 0) - 0.1), 0.4),
          }}
        >
          {medida.linhas.map((l) => (
            <div key={l} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

// Progresso "n de total" do cabeçalho (listas, etapas, indicadores): o número conta conforme os
// itens entram ("02/03"); embaixo, uma barra em segmentos que se acendem um a um.
export const IndicadorDeProgresso: React.FC<{ tempos: number[]; largura: number; cor?: string }> = ({
  tempos,
  largura,
  cor: corDoProgresso = cor.positivo,
}) => {
  const t = useTempo();
  const n = tempos.length;
  const feitos = tempos.filter((e) => t >= e - 0.05).length;
  const dois = (k: number) => String(k).padStart(2, "0");
  const gap = 10;
  const w = (largura - gap * (n - 1)) / n;
  return (
    <div style={{ opacity: prog(t, (tempos[0] ?? 0) - 0.5, 0.4) }}>
      <Valor v={{ numero: dois(feitos), sufixo: `/${dois(n)}` }} tamanho={124} cor={feitos > 0 ? corDoProgresso : cor.apagado} />
      <div style={{ display: "flex", gap, marginTop: 22 }}>
        {tempos.map((e, i) => {
          const p = prog(t, e - 0.05, 0.4);
          return (
            <div key={i} style={{ position: "relative", width: w, height: 12, borderRadius: 6, background: "rgba(226,238,231,0.1)" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: w * p, borderRadius: 6, background: corDoProgresso }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
