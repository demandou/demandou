import { mistura, prog } from "../anim";
import type { Trecho } from "../layout";
import type { Plano } from "../plano";
import { cor, fonte, RODAPE, TAM, texto, X0, X1 } from "../tema";

// O índice da receita no pé da ficha: "Ingredientes" e os números dos passos ligados por um fio;
// o fio pistache avança até a parte da receita que está sendo falada.
export const Rodape: React.FC<{ plano: Plano; trechos: Trecho[]; t: number; fichaY: number }> = ({ plano, trechos, t, fichaY }) => {
  const secoes = trechos
    .map((tr) => ({ tr, m: tr.indice >= 0 ? plano.momentos[tr.indice] : null }))
    .filter((x) => x.m && (x.m.tipo === "ingredientes" || x.m.tipo === "passo"));
  if (secoes.length < 2) return null;
  const y = fichaY + RODAPE;
  const nomeDaPilula = secoes[0].m?.tipo === "ingredientes" ? (secoes[0].m.rotulo ?? "Ingredientes") : "";
  // a pílula cresce com o rótulo
  const larguraPilula = Math.max(300, Math.ceil(nomeDaPilula.length * TAM.indice * 0.47 + 64));
  const D = 88;
  const xs = secoes.map((s, i) => {
    if (i === 0 && s.m?.tipo === "ingredientes") return X0 + larguraPilula / 2;
    const primeiro = secoes[0].m?.tipo === "ingredientes" ? X0 + larguraPilula + 30 + D / 2 : X0 + D / 2;
    const n = secoes.length - (secoes[0].m?.tipo === "ingredientes" ? 1 : 0);
    const k = i - (secoes[0].m?.tipo === "ingredientes" ? 1 : 0);
    return n <= 1 ? primeiro : mistura(primeiro, X1 - D / 2, k / (n - 1));
  });
  // posição do avanço: interpolada entre as seções na hora de cada troca
  const avanco = secoes.reduce((soma, s) => soma + prog(t, s.tr.troca, 0.6), -1);
  const iAtual = Math.max(0, Math.floor(avanco + 0.001));
  const xAvanco = avanco < 0 ? xs[0] : mistura(xs[iAtual], xs[Math.min(xs.length - 1, iAtual + 1)], avanco - iAtual);
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: texto, color: cor.cacau }}>
      <div style={{ position: "absolute", left: xs[0], width: xs[xs.length - 1] - xs[0], top: y - 3, height: 6, background: cor.lapis, borderRadius: 3 }} />
      <div style={{ position: "absolute", left: xs[0], width: Math.max(0, xAvanco - xs[0]), top: y - 4, height: 8, background: cor.pistache, borderRadius: 4 }} />
      {secoes.map((s, i) => {
        const feito = avanco >= i - 0.02;
        const atual = iAtual === i;
        const m = s.m;
        if (m?.tipo === "ingredientes") {
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: X0,
                top: y - D / 2,
                width: larguraPilula,
                height: D,
                borderRadius: D / 2,
                background: feito ? (atual ? cor.pistache : cor.pistacheClaro) : cor.creme,
                border: `3px solid ${feito ? cor.cacau : cor.lapis}`,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: TAM.indice,
                fontStyle: "italic",
                lineHeight: 1,
                color: feito ? cor.cacau : cor.lapis,
              }}
            >
              {m.rotulo ?? "Ingredientes"}
            </div>
          );
        }
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: xs[i] - D / 2,
              top: y - D / 2,
              width: D,
              height: D,
              borderRadius: D / 2,
              background: feito ? (atual ? cor.pistache : cor.pistacheClaro) : cor.creme,
              border: `3px solid ${feito ? cor.cacau : cor.lapis}`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonte,
              fontSize: TAM.indice,
              lineHeight: 1,
              color: feito ? cor.cacau : cor.lapis,
              scale: String(atual ? 1.08 : 1),
            }}
          >
            <span style={{ translate: "0 0.05em" }}>{m?.tipo === "passo" ? m.numero : i + 1}</span>
          </div>
        );
      })}
    </div>
  );
};
