// Abonação: o trecho falado do momento, como a citação em itálico de um verbete, na coluna estreita
// ao lado do quadro da pessoa. Cada palavra sai do lápis para a tinta quando é dita (a da vez em
// ameixa). Quando o trecho é maior que a coluna, ela rola devagar para a linha da vez ficar à vista.
// É o que enche a coluna dos blocos que não têm verbetes vizinhos — sempre com a fala de verdade.
import { prog } from "../anim";
import type { Regiao } from "../layout";
import { type Fonte, larguraTexto, quebrarLinhas } from "../medida";
import type { Palavra } from "../plano";
import { cor } from "../tema";
import { familiaCss } from "./Texto";

const FONTE: Fonte = { familia: "italico", peso: 400 };
export const CORPO_ABONACAO = 40;
const ENTRELINHA = 1.28;

export const palavrasDoMomento = (palavras: Palavra[], de: number, ate: number) =>
  palavras.filter((p) => p.em >= de - 0.05 && p.em < ate - 0.02 && p.w.trim());

export const Abonacao: React.FC<{ regiao: Regiao; palavras: Palavra[]; de: number; ate: number; t: number }> = ({
  regiao,
  palavras,
  de,
  ate,
  t,
}) => {
  const faladas = palavrasDoMomento(palavras, de, ate);
  if (!faladas.length || regiao.h < CORPO_ABONACAO * 1.5) return null;
  const corpo = CORPO_ABONACAO;
  const textos = faladas.map((p, i) => `${i === 0 ? "«" : ""}${p.w}${i === faladas.length - 1 ? "»" : ""}`);
  // quebra medida (cada palavra vira um "token" sem espaço dentro)
  const linhas = quebrarLinhas(textos.join(" "), regiao.w, corpo, FONTE);
  const alturaLinha = corpo * ENTRELINHA;
  const visiveis = Math.max(1, Math.floor(regiao.h / alturaLinha));
  // em que linha está cada palavra, e quando cada linha começa
  const linhaDe: number[] = [];
  const inicioDaLinha: number[] = [];
  let k = 0;
  linhas.forEach((l, li) => {
    const n = l.split(" ").length;
    inicioDaLinha.push(faladas[k]?.em ?? de);
    for (let j = 0; j < n; j++) linhaDe.push(li);
    k += n;
  });
  // rola uma linha de cada vez quando a fala chega perto do pé da coluna
  let rolagem = 0;
  for (let li = visiveis - 1; li < linhas.length; li++) rolagem += prog(t, inicioDaLinha[li] - 0.2, 0.35);
  const espaco = larguraTexto(" ", corpo, FONTE) / 1.03;
  let w = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: regiao.x,
        top: regiao.y,
        width: regiao.w,
        height: visiveis * alturaLinha,
        overflow: "hidden",
      }}
    >
      <div style={{ ...familiaCss(FONTE), fontSize: corpo, lineHeight: `${alturaLinha}px`, transform: `translateY(${-rolagem * alturaLinha}px)` }}>
        {linhas.map((linha, li) => {
          const ws = linha.split(" ");
          return (
            <div key={li} style={{ height: alturaLinha, display: "flex", whiteSpace: "nowrap" }}>
              {ws.map((texto, j) => {
                const i = w++;
                const p = faladas[i];
                const dita = prog(t, p.em - 0.04, 0.16);
                const falando = t >= p.em - 0.04 && t < Math.max(p.ate, p.em + 0.12);
                const estilo: React.CSSProperties = {
                  position: "relative",
                  display: "inline-block",
                  marginRight: j < ws.length - 1 ? espaco : 0,
                  color: falando ? cor.ameixa : cor.cinza,
                };
                if (dita >= 1)
                  return (
                    <span key={j} style={estilo}>
                      {texto}
                    </span>
                  );
                return (
                  <span key={j} style={estilo}>
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: alturaLinha * 0.46,
                        height: 11,
                        borderRadius: 6,
                        background: cor.lapis,
                        opacity: 0.5 * (1 - dita),
                      }}
                    />
                    <span style={{ opacity: dita }}>{texto}</span>
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
      {/* a borda de cima some no papel quando a coluna rola */}
      {rolagem > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: alturaLinha * 0.9,
            background: `linear-gradient(180deg, ${cor.papel} 15%, rgba(243,239,230,0))`,
            opacity: Math.min(1, rolagem),
          }}
        />
      ) : null}
    </div>
  );
};
