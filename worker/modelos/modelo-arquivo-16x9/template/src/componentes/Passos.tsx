import { Datilo, entra as entraEasing, preciso, prog } from "../anim";
import { partesDaRegiao, type Regiao } from "../layout";
import { encaixar } from "../medida";
import type { Layout, Passos as TPassos } from "../plano";
import { cor, mono, QUADRO, rotulo, sans, sombraPapel } from "../tema";
import { Cabeca, medirCabeca } from "./Cabeca";
import { Deslizar, Tachinha } from "./Papel";

type Ponto = { x: number; y: number };

// Passos em ordem: fichas de arquivo presas com tachinhas, em zigue-zague, e o fio vermelho que
// liga uma à outra na ordem. Antes de ser dita, cada ficha espera a lápis (contorno tracejado com
// o número); quando o passo é dito, a ficha cai no lugar, a tachinha prende e o fio se estica
// desde a ficha anterior.
// No quadro deitado, quando o corpo do documento é largo e baixo (o canto: a folha inteira embaixo
// da foto), as fichas ficam numa FILEIRA, da esquerda para a direita, em zigue-zague de altura, e o
// fio corre em arco por cima delas; no quadro da esquerda (mais alto), continuam empilhadas.
export const Passos: React.FC<{ m: TPassos; t: number; fim: number; regiao: Regiao; layout: Layout }> = ({ m, t, fim, regiao, layout }) => {
  const itens = m.itens.slice(0, 5);
  const n = itens.length;
  const larguraTitulo = layout === "canto" ? partesDaRegiao(layout, regiao, 0).cabeca.w : regiao.w;
  // no canto, o título enche o pedaço ao lado da foto
  const cab = layout === "canto" ? medirCabeca(m.titulo, larguraTitulo - 8, 96, 3) : medirCabeca(m.titulo, larguraTitulo - 8);
  const { cabeca, corpo } = partesDaRegiao(layout, regiao, cab.altura);
  const NUM = 96;
  const comDetalhe = itens.some((i) => i.detalhe);
  const fileira = corpo.w / Math.max(1, corpo.h) > 1.8;

  // --- geometria das fichas ---
  let largura: number;
  let alturaFicha: number;
  let larguraTexto: number;
  let linhasTexto: number;
  let maxCorpo: number;
  let pos: (i: number) => Ponto & { rot: number };
  let tachaSai: (i: number) => Ponto;
  let tachaChega: (i: number) => Ponto;
  // fileira: a ficha tem o número em cima e o texto embaixo (até 3 linhas)
  const DESNIVEL = 46;
  if (fileira) {
    const VAO = n > 4 ? 30 : 44;
    largura = Math.min(520, (corpo.w - VAO * (n - 1)) / Math.max(1, n));
    const sobra = corpo.w - (largura * n + VAO * (n - 1));
    alturaFicha = Math.min(330, corpo.h - DESNIVEL - 14);
    larguraTexto = largura - 2 * 28;
    linhasTexto = 3;
    maxCorpo = Math.max(40, Math.min(66, Math.floor((alturaFicha - 28 - 64 - 18 - (comDetalhe ? 44 : 0) - 24) / (3 * 1.06))));
    pos = (i) => ({ x: corpo.x + sobra / 2 + i * (largura + VAO), y: corpo.y + 14 + (i % 2 === 0 ? 0 : DESNIVEL), rot: i % 2 === 0 ? -0.7 : 0.6 });
    // o fio sai do canto de cima à direita de uma ficha e chega ao canto de cima à esquerda da outra
    tachaSai = (i) => ({ x: pos(i).x + largura - 40, y: pos(i).y + 12 });
    tachaChega = (i) => ({ x: pos(i).x + 40, y: pos(i).y + 12 });
  } else {
    const VAO = n > 4 ? 30 : 44;
    alturaFicha = Math.min(230, (corpo.h - 10 - VAO * (n - 1)) / Math.max(1, n));
    largura = corpo.w * 0.82;
    const deslocamento = corpo.w - largura;
    larguraTexto = largura - NUM - 30 - 36 - 24;
    linhasTexto = 2;
    maxCorpo = Math.max(42, Math.min(74, Math.floor((alturaFicha - 40 - (comDetalhe ? 44 : 0)) / 2.2)));
    pos = (i) => ({ x: corpo.x + (i % 2 === 0 ? 0 : deslocamento), y: corpo.y + i * (alturaFicha + VAO), rot: i % 2 === 0 ? -0.7 : 0.6 });
    // tachinhas: no pé de cada ficha (menos a última) e no alto de cada uma (menos a primeira);
    // o fio desce pelo vão entre as fichas, nunca por cima do texto. Nas fichas deslocadas, a
    // tachinha fica entre o número e o texto (as fichas do quadro deitado são baixas: no canto do
    // número ela encostaria no quadradinho dele)
    const xDaTacha = (i: number) => pos(i).x + (i % 2 === 0 ? largura - 70 : 30 + NUM + 15);
    tachaSai = (i) => ({ x: xDaTacha(i), y: pos(i).y + alturaFicha - 16 });
    tachaChega = (i) => ({ x: xDaTacha(i), y: pos(i).y + 16 });
  }
  const corpoItem = Math.min(...itens.map((i) => encaixar(i.texto, { largura: larguraTexto, max: maxCorpo, min: 40, linhas: linhasTexto, fonte: { peso: 800 } }).tamanho));
  const numero = (i: number) => (
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
  );
  return (
    <Deslizar t={t} de={m.de} fim={fim}>
      <Cabeca fit={cab.fit} x={cabeca.x} y={cabeca.y + (layout === "canto" ? 30 : 4)} em={m.de + 0.2} t={t} semente={300} />
      {itens.map((it, i) => {
        const p = pos(i);
        const cai = prog(t, it.em - 0.08, 0.4, entraEasing);
        const fit = encaixar(it.texto, { largura: larguraTexto, max: corpoItem, min: corpoItem, linhas: linhasTexto, fonte: { peso: 800 } });
        const det = it.detalhe ? encaixar(it.detalhe, { largura: larguraTexto, max: 36, min: 30, linhas: 1, fonte: { mono: true } }) : null;
        const texto = (
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
        );
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
                <div style={{ ...rotulo, fontSize: 34, color: cor.grafite, position: "absolute", left: 30, top: fileira ? 34 : alturaFicha / 2 - 17 }}>{String(i + 1).padStart(2, "0")}</div>
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
                  translate: fileira ? `${(1 - cai) * -24}px ${(1 - cai) * (i % 2 === 0 ? -50 : 50)}px` : `${(1 - cai) * (i % 2 === 0 ? -50 : 50)}px ${(1 - cai) * -24}px`,
                  display: "flex",
                  flexDirection: fileira ? "column" : "row",
                  alignItems: fileira ? "flex-start" : "center",
                  gap: fileira ? 18 : 30,
                  padding: fileira ? "28px 28px 24px" : "0 36px 0 30px",
                  boxSizing: "border-box",
                }}
              >
                {numero(i)}
                {texto}
              </div>
            ) : null}
          </div>
        );
      })}
      {/* o fio vermelho, por cima das fichas, e as tachinhas */}
      <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {itens.slice(1).map((it, k) => {
          const a = tachaSai(k);
          const b = tachaChega(k + 1);
          const fio = prog(t, it.em - 0.05, 0.5, preciso);
          if (fio <= 0.001) return null;
          // na fileira o fio faz um arco por cima do vão; empilhado, desce pelo vão
          const meio = fileira ? { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 34 } : { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + 26 };
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
          {i < n - 1 ? <Tachinha x={tachaSai(i).x} y={tachaSai(i).y} p={prog(t, (itens[i + 1]?.em ?? it.em) - 0.15, 0.2)} /> : null}
          {i > 0 ? <Tachinha x={tachaChega(i).x} y={tachaChega(i).y} p={prog(t, it.em + 0.35, 0.2)} /> : null}
        </div>
      ))}
    </Deslizar>
  );
};
