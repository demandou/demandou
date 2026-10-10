// Legenda de redes sociais (só nos trechos sem momento, ou com `legenda: true`): uma etiqueta
// branca de agenda abaixo do queixo; a palavra da vez ganha um traço de tomate embaixo.
import { limitar, prog, saindo } from "../anim";
import type { Caixa } from "../motor/caixa";
import type { Frase } from "../motor/frases";
import { cor, sans, W } from "../tema";

export const fraseNoTempo = (frases: Frase[], t: number) => frases.find((f) => t >= f.de - 0.05 && t <= f.ate);

export const Legendas: React.FC<{ frases: Frase[]; t: number; pessoa: Caixa }> = ({ frases, t, pessoa }) => {
  const atual = fraseNoTempo(frases, t);
  if (!atual) return null;
  const cheia = limitar((pessoa.w - (W - 90)) / 90);
  // caixa estreita (raia ao lado, canto): não há lugar para legenda sem cobrir a agenda
  if (cheia < 0.5 && pessoa.w < 600) return null;
  // tela cheia: abaixo do queixo; na caixa: no pé do vídeo
  const y = cheia > 0.5 ? 1300 : pessoa.y + pessoa.h - 130;
  const largura = cheia > 0.5 ? 960 : Math.max(380, pessoa.w - 48);
  const x = cheia > 0.5 ? 60 : pessoa.x + 24;
  const entra = prog(t, atual.de - 0.05, 0.18);
  const sai = saindo(t, atual.ate, 0.12);
  return (
    <div style={{ position: "absolute", left: x, width: largura, top: y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.26em",
          padding: "12px 28px 16px",
          borderRadius: 22,
          background: "rgba(255,255,255,0.96)",
          boxShadow: "0 10px 26px rgba(20,26,40,0.18)",
          fontFamily: sans,
          fontWeight: 700,
          fontSize: pessoa.w < 600 && cheia < 0.5 ? 40 : 50,
          lineHeight: 1.18,
          color: cor.tinta,
          opacity: Math.min(entra, 1 - sai),
          translate: `0 ${(1 - entra) * 10}px`,
        }}
      >
        {atual.palavras.map((p, i) => {
          const proxima = atual.palavras[i + 1];
          const daVez = t >= p.em - 0.04 && (!proxima || t < proxima.em - 0.04);
          return (
            <span key={`${p.w}-${i}`} style={{ position: "relative", opacity: t >= p.em - 0.04 ? 1 : 0.38 }}>
              {p.w}
              <span style={{ position: "absolute", left: 0, right: 0, bottom: -2, height: 6, borderRadius: 3, background: cor.foco, opacity: daVez ? 1 : 0 }} />
            </span>
          );
        })}
      </div>
    </div>
  );
};
