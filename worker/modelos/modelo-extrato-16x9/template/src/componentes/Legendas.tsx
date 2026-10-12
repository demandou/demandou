// Legenda numa tira de papel térmico: uma linha (no cartão, até duas), tinta escura, e a palavra da
// vez sublinhada em magenta. Só aparece onde o cupom não está imprimindo o que é dito (a abertura,
// as pausas e os momentos com `legenda: true`).
import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, sans } from "../tema";

export const Legendas: React.FC<{ frases: Frase[]; y: number; esquerda: number; largura: number; tamanho: number }> = ({ frases, y, esquerda, largura, tamanho }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const pEntra = prog(t, atual.de - 0.08, 0.2);
  const s = saindo(t, atual.ate, 0.12);
  return (
    <div style={{ position: "absolute", left: esquerda, width: largura, top: y, display: "flex", justifyContent: "center", opacity: pEntra * (1 - s), translate: `0 ${(1 - pEntra) * 10}px` }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          background: cor.papel,
          borderRadius: 6,
          padding: "10px 24px 12px",
          boxShadow: "0 10px 26px rgba(0,0,0,0.30)",
          fontFamily: sans,
          fontWeight: 600,
          fontSize: tamanho,
          lineHeight: 1.22,
          color: cor.legendaTexto,
        }}
      >
        {atual.palavras.map((p, i) => {
          const falando = t >= p.em - 0.04 && t < p.ate + 0.04;
          const dita = t >= p.em - 0.04;
          return (
            <span
              key={`${p.w}-${i}`}
              style={{
                marginRight: i < atual.palavras.length - 1 ? "0.27em" : 0,
                opacity: dita ? 1 : 0.38,
                boxShadow: falando ? `inset 0 -0.16em 0 ${cor.magentaVeu}` : undefined,
              }}
            >
              {p.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
