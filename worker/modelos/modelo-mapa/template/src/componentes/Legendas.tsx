// Legenda de caderno: uma linha em tinta sobre o papel, a palavra da vez com marca-texto.
// Só aparece nos trechos sem momento (estação "fala", logo abaixo do cartão grande) e nos momentos
// com `legenda: true` (faixa de baixo).
import { prog, saindo } from "../anim";
import { assentado, type Estacao, estacaoAtual } from "../layout";
import type { Frase } from "../motor/frases";
import { CARTAO, cor, DIREITA_BAIXO, MARGEM, sans } from "../tema";

export const LEGENDA_FALA = CARTAO.fala.y + CARTAO.fala.h + 62;
export const LEGENDA_BAIXO = 1424;

export const Legendas: React.FC<{ frases: Frase[]; estacoes: Estacao[]; t: number }> = ({ frases, estacoes, t }) => {
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const e = estacaoAtual(t, estacoes);
  const y = e.tipo === "fala" ? LEGENDA_FALA : LEGENDA_BAIXO;
  // espera a câmera assentar na estação (a legenda não cai em cima da estação que está saindo)
  const pEntra = prog(t, atual.de - 0.08, 0.2) * assentado(t, e);
  const s = saindo(t, atual.ate, 0.12);
  return (
    <div style={{ position: "absolute", left: MARGEM, width: DIREITA_BAIXO - MARGEM, top: y, display: "flex", justifyContent: "center", opacity: pEntra * (1 - s) }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          fontFamily: sans,
          fontWeight: 600,
          fontSize: 50,
          lineHeight: 1.2,
          color: cor.tinta,
        }}
      >
        {atual.palavras.map((p, i) => {
          const falando = t >= p.em - 0.04 && t < p.ate + 0.04;
          const dita = t >= p.em - 0.04;
          return (
            <span
              key={`${p.w}-${i}`}
              style={{
                position: "relative",
                marginRight: i < atual.palavras.length - 1 ? 13 : 0,
                color: dita ? cor.tinta : cor.lapis,
                background: falando ? cor.marca : "transparent",
                borderRadius: 6,
                padding: "0 4px",
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
