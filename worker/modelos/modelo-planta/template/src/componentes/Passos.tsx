import { limitar, preciso, prog, Revela, Traco } from "../anim";
import { circ, lin, poli } from "../desenho/geometria";
import type { Regiao } from "../layout";
import type { Layout, Palavra, Passos as TPassos } from "../plano";
import { cor, mono, sans, traco } from "../tema";
import { Folha } from "./Folha";
import { IconeTraco } from "./Icones";
import { medirLista } from "./Notas";

const R = 36;
const COL = 2 * R + 34;

// Passos como um percurso: círculos numerados numa coluna, ligados pela circulação tracejada em
// terracota, que chega em cada passo quando ele é dito (com a seta). O passo da vez fica em terracota,
// os anteriores voltam ao grafite; os que ainda virão já estão esboçados a lápis.
export const Passos: React.FC<{
  m: TPassos;
  t: number;
  regiao: Regiao;
  layout: Layout;
  palavras: Palavra[];
}> = ({ m, t, regiao, layout, palavras }) => (
  <Folha t={t} de={m.de} ate={m.ate} palavras={palavras} layout={layout} regiao={regiao} numero={m.numero} titulo={m.titulo} subtitulo={m.subtitulo}>
    {(corpo) => <Percurso m={m} t={t} corpo={corpo} />}
  </Folha>
);

const Percurso: React.FC<{ m: TPassos; t: number; corpo: Regiao }> = ({ m, t, corpo }) => {
  const itens = m.itens;
  const temIcone = itens.some((it) => it.icone);
  const tamIcone = 76;
  const xTexto = corpo.x + COL + (temIcone ? tamIcone + 26 : 0);
  const largura = corpo.x + corpo.w - xTexto;
  const { linhas, total } = medirLista(itens, largura, corpo.h, 68);
  const folga = Math.max(0, corpo.h - total);
  const extra = Math.min(folga / itens.length, 60);
  const y0 = corpo.y + Math.max(0, (corpo.h - total - extra * itens.length) * 0.4);
  const tops: number[] = [];
  let y = y0;
  linhas.forEach((l) => {
    tops.push(y);
    y += l.h + extra;
  });
  const cx = corpo.x + R + 4;
  const cy = (i: number) => tops[i] + 26 + Math.max(R, linhas[i].tx.tamanho * 0.58);
  const ativo = itens.reduce((a, it, i) => (t >= it.em - 0.05 ? i : a), -1);
  const pLapis = prog(t, m.de - 0.2, 0.25);

  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {itens.map((it, i) => {
          const y1 = cy(i);
          const pCirc = prog(t, it.em - 0.05, 0.5, preciso);
          const corC = i === ativo ? cor.acento : cor.grafite;
          // trecho da circulação que chega neste passo (do círculo anterior até este)
          const trecho =
            i > 0
              ? (() => {
                  const ya = cy(i - 1) + R + 8;
                  const yb = y1 - R - 10;
                  const p = prog(t, it.em - 0.35, 0.45, preciso);
                  const yf = ya + (yb - ya) * p;
                  return (
                    <g>
                      <path d={lin(cx, ya, cx, yb)} stroke={cor.cinzaClaro} strokeWidth={traco.fino} strokeDasharray="6 8" opacity={pLapis * (1 - p)} />
                      {p > 0 ? <path d={lin(cx, ya, cx, yf)} stroke={cor.acento} strokeWidth={5.5} strokeDasharray="16 11" /> : null}
                      {p > 0.15 && i === ativo ? (
                        <path d={poli([[cx - 15, yf - 22], [cx, yf], [cx + 15, yf - 22]])} fill="none" stroke={cor.acento} strokeWidth={6} opacity={limitar((p - 0.15) * 3)} />
                      ) : null}
                    </g>
                  );
                })()
              : null;
          return (
            <g key={i}>
              {trecho}
              {/* esboço a lápis do círculo */}
              <path d={circ(cx, y1, R)} fill="none" stroke={cor.cinzaClaro} strokeWidth={traco.fino} strokeDasharray="6 6" opacity={pLapis * (1 - pCirc)} />
              {pCirc > 0 ? <circle cx={cx} cy={y1} r={R} fill={cor.papel} opacity={limitar(pCirc * 3)} /> : null}
              <Traco d={circ(cx, y1, R)} p={pCirc} cor={corC} largura={traco.medio} />
              <text
                x={cx}
                y={y1 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily={mono}
                fontWeight={500}
                fontSize={32}
                fill={pCirc > 0.3 ? corC : cor.cinzaClaro}
                opacity={pCirc > 0.3 ? limitar((pCirc - 0.3) * 2.5) : pLapis}
              >
                {String(i + 1).padStart(2, "0")}
              </text>
              {/* régua fina sob o passo */}
              <Traco
                d={lin(corpo.x + COL, tops[i] + linhas[i].h + extra / 2, corpo.x + corpo.w, tops[i] + linhas[i].h + extra / 2)}
                p={prog(t, it.em + 0.1, 0.7, preciso)}
                cor={cor.cinzaClaro}
                largura={traco.fino}
              />
            </g>
          );
        })}
      </svg>
      {itens.map((it, i) => {
        const l = linhas[i];
        const p = prog(t, it.em - 0.03, 0.45);
        const pd = prog(t, it.em + 0.35, 0.45);
        return (
          <div key={i}>
            {it.icone ? (
              <div style={{ position: "absolute", left: corpo.x + COL, top: cy(i) - tamIcone / 2 }}>
                <IconeTraco nome={it.icone} p={prog(t, it.em, 0.8, preciso)} tamanho={tamIcone} cor={i === ativo ? cor.acento : cor.grafite} />
              </div>
            ) : null}
            <div style={{ position: "absolute", left: xTexto, top: cy(i) - l.tx.tamanho * 0.58, width: largura }}>
              <Revela p={p} style={{ fontFamily: sans, fontWeight: 400, fontSize: l.tx.tamanho, lineHeight: 1.12, color: cor.grafite }}>
                {l.tx.linhas.map((x, k) => (
                  <div key={k}>{x}</div>
                ))}
              </Revela>
              {l.dt ? (
                <div style={{ marginTop: 10, opacity: pd, translate: `${(1 - pd) * -20}px 0`, fontFamily: sans, fontWeight: 300, fontSize: l.dt.tamanho, lineHeight: 1.2, color: cor.cinza }}>
                  {l.dt.linhas.map((x, k) => (
                    <div key={k}>{x}</div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
};
