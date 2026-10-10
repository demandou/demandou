// Legenda de redes sociais (só nos trechos sem momento, ou com `legenda: true`): uma faixa escura
// de notificação de relógio abaixo do queixo; a palavra da vez ganha um traço azul embaixo.
// Só aparece com a pessoa em tela cheia (nas caixas do app não há lugar sem cobrir os dados).
import { limitar, prog, saindo } from "../anim";
import type { Caixa } from "../motor/caixa";
import type { Frase } from "../motor/frases";
import { mostrador, W, ZONAS } from "../tema";

export const fraseNoTempo = (frases: Frase[], t: number) => frases.find((f) => t >= f.de - 0.05 && t <= f.ate);

export const Legendas: React.FC<{ frases: Frase[]; t: number; pessoa: Caixa; y: number }> = ({ frases, t, pessoa, y }) => {
  const atual = fraseNoTempo(frases, t);
  if (!atual) return null;
  const cheia = limitar((pessoa.w - (W - 90)) / 90);
  if (cheia < 0.5) return null;
  const entra = prog(t, atual.de - 0.05, 0.18);
  const sai = saindo(t, atual.ate, 0.12);
  return (
    <div style={{ position: "absolute", left: 120, width: 840, top: y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.26em",
          padding: "14px 30px 18px",
          borderRadius: 26,
          background: "rgba(15,17,19,0.88)",
          fontFamily: mostrador,
          fontWeight: 700,
          fontSize: 52,
          lineHeight: 1.16,
          color: "#FFFFFF",
          opacity: Math.min(entra, 1 - sai) * cheia,
          translate: `0 ${(1 - entra) * 10}px`,
        }}
      >
        {atual.palavras.map((p, i) => {
          const proxima = atual.palavras[i + 1];
          const daVez = t >= p.em - 0.04 && (!proxima || t < proxima.em - 0.04);
          return (
            <span key={`${p.w}-${i}`} style={{ position: "relative", opacity: t >= p.em - 0.04 ? 1 : 0.4 }}>
              {p.w}
              <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, borderRadius: 3, background: ZONAS[1].cor, opacity: daVez ? 1 : 0 }} />
            </span>
          );
        })}
      </div>
    </div>
  );
};
