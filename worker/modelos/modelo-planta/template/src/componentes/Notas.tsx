import { limitar, mistura, preciso, prog, Revela, Traco } from "../anim";
import { lin, poli, ret } from "../desenho/geometria";
import type { Regiao } from "../layout";
import type { Item, Layout, Palavra } from "../plano";
import { cor, sans, traco } from "../tema";
import { encaixar } from "../texto";
import { Folha } from "./Folha";

const COL = 92;

// Mede as linhas de uma lista (texto + detalhe) e escolhe o maior corpo em que todas cabem na altura.
export const medirLista = (itens: Item[], largura: number, altura: number, maximo = 72) => {
  for (let max = maximo; max >= 40; max -= 2) {
    const linhas = itens.map((it) => {
      const tx = encaixar(it.texto, { largura, max, min: 44, linhas: 2, fonte: { peso: 400 } });
      const dt = it.detalhe ? encaixar(it.detalhe, { largura, max: Math.min(42, Math.round(max * 0.72)), min: 34, linhas: 2, fonte: { peso: 300 } }) : null;
      const h = 26 + tx.linhas.length * tx.tamanho * 1.12 + (dt ? 10 + dt.linhas.length * dt.tamanho * 1.2 : 0) + 26;
      return { tx, dt, h };
    });
    const total = linhas.reduce((s, l) => s + l.h, 0);
    if (total <= altura || max === 40) return { linhas, total };
  }
  throw new Error("inalcançável");
};

// Tópicos como as NOTAS de uma prancha: cada item é uma linha com um marcador quadrado que acende em
// terracota quando é dito; um nível ▷ anda até o item da vez. Antes de ser dito, o item já está
// esboçado a lápis (marcador e régua tracejados): a folha nunca fica vazia.
export const Notas: React.FC<{
  m: { de: number; ate: number; titulo?: string; numero?: string; subtitulo?: string; itens: Item[] };
  t: number;
  regiao: Regiao;
  layout: Layout;
  palavras: Palavra[];
}> = ({ m, t, regiao, layout, palavras }) => (
  <Folha t={t} de={m.de} ate={m.ate} palavras={palavras} layout={layout} regiao={regiao} numero={m.numero} titulo={m.titulo} subtitulo={m.subtitulo}>
    {(corpo) => <ListaNotas itens={m.itens} t={t} de={m.de} corpo={corpo} />}
  </Folha>
);

const ListaNotas: React.FC<{ itens: Item[]; t: number; de: number; corpo: Regiao }> = ({ itens, t, de, corpo }) => {
  const largura = corpo.w - COL;
  const { linhas, total } = medirLista(itens, largura, corpo.h);
  const folga = Math.max(0, corpo.h - total);
  const extra = Math.min(folga / itens.length, 60);
  const y0 = corpo.y + Math.max(0, (corpo.h - total - extra * itens.length) * 0.4);
  const tops: number[] = [];
  let y = y0;
  linhas.forEach((l) => {
    tops.push(y);
    y += l.h + extra;
  });
  // o item da vez (o último já dito)
  const ativo = itens.reduce((a, it, i) => (t >= it.em - 0.05 ? i : a), -1);
  const pLapis = prog(t, de - 0.2, 0.25);
  // nível ▷: anda até a linha do item da vez
  const yLinha = (i: number) => tops[i] + 26 + linhas[i].tx.tamanho * 0.58;
  let yNivel = yLinha(0);
  itens.forEach((it, i) => {
    if (i > 0) yNivel = mistura(yNivel, yLinha(i), prog(t, it.em - 0.05, 0.42, preciso));
  });
  const pNivel = ativo >= 0 ? prog(t, itens[0].em - 0.05, 0.3) : 0;

  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {itens.map((it, i) => {
          const yBase = tops[i] + linhas[i].h + extra / 2;
          const yMarca = yLinha(i);
          const xMarca = corpo.x + 40;
          const dito = prog(t, it.em - 0.03, 0.3);
          const corMarca = i === ativo ? cor.acento : cor.grafite;
          return (
            <g key={i}>
              {/* esboço a lápis: régua e marcador tracejados */}
              <path d={lin(xMarca, yBase, corpo.x + corpo.w, yBase)} stroke={cor.cinzaClaro} strokeWidth={traco.fino} strokeDasharray="7 9" opacity={pLapis * (1 - dito)} />
              <path d={ret(xMarca, yMarca - 13, 26, 26)} fill="none" stroke={cor.cinzaClaro} strokeWidth={traco.fino} strokeDasharray="5 5" opacity={pLapis * (1 - dito)} />
              {/* passado a nanquim quando é dito */}
              <Traco d={lin(xMarca, yBase, corpo.x + corpo.w, yBase)} p={prog(t, it.em + 0.05, 0.7, preciso)} cor={cor.cinzaClaro} largura={traco.fino} />
              {dito > 0 ? <rect x={xMarca} y={yMarca - 13} width={26} height={26} fill={corMarca} opacity={limitar(dito * 1.5)} /> : null}
            </g>
          );
        })}
        {pNivel > 0 ? (
          <path d={poli([[corpo.x, yNivel - 13], [corpo.x + 20, yNivel], [corpo.x, yNivel + 13]], true)} fill={cor.acento} opacity={pNivel} />
        ) : null}
      </svg>
      {itens.map((it, i) => {
        const l = linhas[i];
        const p = prog(t, it.em - 0.03, 0.45);
        const pd = prog(t, it.em + 0.35, 0.45);
        return (
          <div key={i} style={{ position: "absolute", left: corpo.x + COL, top: tops[i] + 26, width: largura }}>
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
        );
      })}
    </>
  );
};
