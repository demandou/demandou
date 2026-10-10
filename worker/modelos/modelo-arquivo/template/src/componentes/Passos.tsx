import { Datilo, entra as entraEasing, preciso, prog } from "../anim";
import { partesDaRegiao, type Regiao } from "../layout";
import { encaixar } from "../medida";
import type { Layout, Passos as TPassos } from "../plano";
import { cor, mono, rotulo, sans, sombraPapel } from "../tema";
import { Cabeca, medirCabeca } from "./Cabeca";
import { Deslizar, Tachinha } from "./Papel";

// Passos em ordem: fichas de arquivo presas com tachinhas, em zigue-zague, e o fio vermelho que
// liga uma à outra na ordem. Antes de ser dita, cada ficha espera a lápis (contorno tracejado com
// o número); quando o passo é dito, a ficha cai no lugar, a tachinha prende e o fio se estica
// desde a ficha anterior.
export const Passos: React.FC<{ m: TPassos; t: number; fim: number; regiao: Regiao; layout: Layout }> = ({ m, t, fim, regiao, layout }) => {
  const itens = m.itens.slice(0, 5);
  const n = itens.length;
  const larguraTitulo = layout === "canto" ? partesDaRegiao(layout, regiao, 0).cabeca.w : regiao.w;
  // no canto, o título enche o pedaço ao lado da foto
  const cab = layout === "canto" ? medirCabeca(m.titulo, larguraTitulo - 8, 96, 3) : medirCabeca(m.titulo, larguraTitulo - 8);
  const { cabeca, corpo } = partesDaRegiao(layout, regiao, cab.altura);
  const VAO = n > 4 ? 30 : 44;
  const alturaFicha = Math.min(230, (corpo.h - 10 - VAO * (n - 1)) / Math.max(1, n));
  const largura = corpo.w * 0.82;
  const deslocamento = corpo.w - largura;
  const NUM = 96;
  const larguraTexto = largura - NUM - 30 - 36 - 24;
  const comDetalhe = itens.some((i) => i.detalhe);
  const maxCorpo = Math.max(42, Math.min(74, Math.floor((alturaFicha - 40 - (comDetalhe ? 44 : 0)) / 2.2)));
  const corpoItem = Math.min(...itens.map((i) => encaixar(i.texto, { largura: larguraTexto, max: maxCorpo, min: 40, linhas: 2, fonte: { peso: 800 } }).tamanho));
  const pos = (i: number) => ({
    x: corpo.x + (i % 2 === 0 ? 0 : deslocamento),
    y: corpo.y + i * (alturaFicha + VAO),
    rot: i % 2 === 0 ? -0.7 : 0.6,
  });
  // tachinhas: no pé de cada ficha (menos a última) e no alto de cada uma (menos a primeira);
  // o fio desce pelo vão entre as fichas, nunca por cima do texto
  const tachaPe = (i: number) => ({ x: pos(i).x + (i % 2 === 0 ? largura - 70 : 70), y: pos(i).y + alturaFicha - 16 });
  const tachaTopo = (i: number) => ({ x: pos(i).x + (i % 2 === 0 ? largura - 70 : 70), y: pos(i).y + 16 });
  return (
    <Deslizar t={t} de={m.de} fim={fim}>
      <Cabeca fit={cab.fit} x={cabeca.x} y={cabeca.y + (layout === "canto" ? 30 : 4)} em={m.de + 0.2} t={t} semente={300} />
      {itens.map((it, i) => {
        const p = pos(i);
        const cai = prog(t, it.em - 0.08, 0.4, entraEasing);
        const fit = encaixar(it.texto, { largura: larguraTexto, max: corpoItem, min: corpoItem, linhas: 2, fonte: { peso: 800 } });
        const det = it.detalhe ? encaixar(it.detalhe, { largura: larguraTexto, max: 36, min: 30, linhas: 1, fonte: { mono: true } }) : null;
        return (
          <div key={i}>
            {/* a lápis: o lugar da ficha com o número, antes do passo ser dito */}
            {cai < 1 ? (
              <div
                style={{
                  position: "absolute",
                  left: p.x,
                  top: p.y,
                  width: largura,
                  height: alturaFicha,
                  boxSizing: "border-box",
                  border: `3px dashed ${cor.grafite}`,
                  opacity: 0.3 * (1 - cai),
                  rotate: `${p.rot}deg`,
                }}
              >
                <div style={{ ...rotulo, fontSize: 34, color: cor.grafite, position: "absolute", left: 30, top: alturaFicha / 2 - 17 }}>{String(i + 1).padStart(2, "0")}</div>
              </div>
            ) : null}
            {cai > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: p.x,
                  top: p.y,
                  width: largura,
                  height: alturaFicha,
                  background: cor.cartao,
                  boxShadow: sombraPapel,
                  rotate: `${p.rot}deg`,
                  translate: `${(1 - cai) * (i % 2 === 0 ? -50 : 50)}px ${(1 - cai) * -24}px`,
                  display: "flex",
                  alignItems: "center",
                  gap: 30,
                  padding: "0 36px 0 30px",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    ...rotulo,
                    fontSize: 40,
                    color: cor.vermelho,
                    border: `3px solid ${cor.vermelho}`,
                    width: NUM,
                    boxSizing: "border-box",
                    textAlign: "center",
                    padding: "10px 0 8px",
                    flexShrink: 0,
                    letterSpacing: "0.06em",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ width: larguraTexto }}>
                  <div style={{ fontFamily: sans, fontWeight: 800, fontSize: fit.tamanho, lineHeight: 1.06, color: cor.tinta }}>
                    {fit.linhas.map((l, k) => (
                      <div key={k} style={{ whiteSpace: "nowrap" }}>
                        <Datilo texto={l} em={it.em + 0.05 + k * 0.22} t={t} semente={310 + i * 5 + k} />
                      </div>
                    ))}
                  </div>
                  {det ? (
                    <div style={{ marginTop: 8, fontFamily: mono, fontWeight: 700, fontSize: det.tamanho, color: cor.grafite, whiteSpace: "nowrap" }}>
                      <Datilo texto={det.linhas[0]} em={it.em + 0.5} t={t} semente={330 + i} />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
      {/* o fio vermelho, por cima das fichas, e as tachinhas */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {itens.slice(1).map((it, k) => {
          const a = tachaPe(k);
          const b = tachaTopo(k + 1);
          const fio = prog(t, it.em - 0.05, 0.5, preciso);
          if (fio <= 0.001) return null;
          const meio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + 26 };
          return (
            <path
              key={k}
              d={`M ${a.x} ${a.y} Q ${meio.x} ${meio.y} ${b.x} ${b.y}`}
              fill="none"
              stroke={cor.vermelho}
              strokeWidth={4.5}
              pathLength={1}
              strokeDasharray={`${fio} 1`}
            />
          );
        })}
      </svg>
      {itens.map((it, i) => (
        <div key={`t-${i}`}>
          {i < n - 1 ? <Tachinha x={tachaPe(i).x} y={tachaPe(i).y} p={prog(t, (itens[i + 1]?.em ?? it.em) - 0.15, 0.2)} /> : null}
          {i > 0 ? <Tachinha x={tachaTopo(i).x} y={tachaTopo(i).y} p={prog(t, it.em + 0.35, 0.2)} /> : null}
        </div>
      ))}
    </Deslizar>
  );
};
