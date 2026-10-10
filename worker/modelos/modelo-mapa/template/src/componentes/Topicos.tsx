// Tópicos: um tronco de tinta desce do cartão da pessoa e cada item é um nó (pílula) que nasce dele
// na palavra que o nomeia — um mapa mental em forma de lista. O item da vez ganha marca-texto e o
// marca-texto passa para o seguinte quando ele é dito. O título se escreve ao lado do cartão.
import { caneta, Escrita, prog, temposDoTexto, Traco } from "../anim";
import { diagramar, medir } from "../medidas";
import type { Item, Palavra, Topicos as TTopicos } from "../plano";
import { BASE, CARTAO, cor, DIREITA_BAIXO, sans, titulo as estiloTitulo } from "../tema";
import { alturaDoNo, enchimentoDoNo, No } from "./No";

export const TRONCO = { x: 104, topo: 704 };
const X_NO = 172;
const TOPO_ITENS = 724;

// cabe um item num nó: uma linha (50 → 36 px) ou, se não couber, duas linhas
export const diagramarItem = (texto: string, largura: number, maximo = 50, minimo = 38) => {
  for (let s = maximo; s >= minimo; s -= 2) {
    const e = enchimentoDoNo(s);
    if (medir(texto, s, "texto600") + 2 * e.x + 2 * e.borda <= largura) return { tamanho: s, linhas: [texto] };
  }
  const e = enchimentoDoNo(minimo + 4);
  const d = diagramar(texto, { equilibrar: true, largura: largura - 2 * e.x - 2 * e.borda, maximo: minimo + 4, minimo: 34, linhas: 2, corte: "texto600" });
  return d;
};

export const geometriaDosItens = (itens: Item[], xNo: number, topo: number, base: number) => {
  const largura = DIREITA_BAIXO - xNo;
  const medidos = itens.slice(0, 5).map((it) => {
    const d = diagramarItem(it.texto, largura, itens.length > 4 ? 46 : itens.length > 3 ? 52 : 60);
    const dd = it.detalhe ? diagramar(it.detalhe, { equilibrar: true, largura: largura - 24, maximo: 40, minimo: 34, linhas: 2, corte: "texto500", entrelinha: 1.2 }) : null;
    const hNo = alturaDoNo(d.tamanho, d.linhas.length);
    const h = hNo + (dd ? 10 + dd.linhas.length * dd.tamanho * 1.2 : 0);
    return { ...it, d, dd, hNo, h };
  });
  const soma = medidos.reduce((s, i) => s + i.h, 0);
  const livre = base - topo - soma;
  const vao = Math.max(16, Math.min(110, livre / Math.max(1, medidos.length)));
  let y = topo + Math.max(Math.min(vao, 40) / 2, (livre - vao * (medidos.length - 1)) * 0.35);
  return medidos.map((i) => {
    const r = { ...i, y, cy: y + i.hNo / 2 };
    y += i.h + vao;
    return r;
  });
};

export const geometriaDosTopicos = (m: TTopicos) => {
  const C = CARTAO.topicos;
  const xCol = C.x + C.w + 60;
  const larguraCol = 1020 - xCol;
  const titulo = m.titulo ? diagramar(m.titulo, { equilibrar: true, largura: larguraCol, maximo: 76, minimo: 48, linhas: 4, altura: 450, entrelinha: 1.04 }) : null;
  const itens = geometriaDosItens(m.itens, X_NO, TOPO_ITENS, BASE - 24);
  return { titulo, xCol, itens, chegada: { x: TRONCO.x, y: TRONCO.topo } };
};

export const Topicos: React.FC<{ m: TTopicos; palavras: Palavra[]; t: number }> = ({ m, palavras, t }) => {
  const g = geometriaDosTopicos(m);
  const temposTitulo = m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.ate) : [];
  const ultimo = g.itens[g.itens.length - 1];
  // o item da vez: o último já dito
  const atual = g.itens.reduce((k, it, i) => (t >= it.em ? i : k), -1);
  const ramoDo = (cy: number) => `M ${TRONCO.x} ${cy - 46} Q ${TRONCO.x} ${cy} ${X_NO - 4} ${cy}`;
  return (
    <>
      {g.titulo ? (
        <div style={{ position: "absolute", left: g.xCol, top: 182 }}>
          <Escrita linhas={g.titulo.linhas} tempos={temposTitulo} t={t} estilo={estiloTitulo} tamanho={g.titulo.tamanho} entrelinha={1.04} />
        </div>
      ) : null}
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        {/* o tronco a lápis, e a tinta descendo até o item da vez */}
        <path d={`M ${TRONCO.x} ${TRONCO.topo} L ${TRONCO.x} ${ultimo.cy - 46}`} fill="none" stroke={cor.lapisClaro} strokeWidth={5} strokeDasharray="2 12" strokeLinecap="round" />
        {g.itens.map((it, i) => {
          const y0 = i === 0 ? TRONCO.topo : g.itens[i - 1].cy - 46;
          const pTronco = prog(t, it.em - 0.12, 0.3, caneta);
          const pRamo = prog(t, it.em, 0.3, caneta);
          return (
            <g key={`t-${i}`}>
              <Traco d={`M ${TRONCO.x} ${y0} L ${TRONCO.x} ${it.cy - 46}`} p={pTronco} cor={cor.tinta} largura={6} />
              <path d={ramoDo(it.cy)} fill="none" stroke={cor.lapisClaro} strokeWidth={4} strokeDasharray="2 10" strokeLinecap="round" />
              <Traco d={ramoDo(it.cy)} p={pRamo} cor={cor.tinta} largura={6} />
            </g>
          );
        })}
      </svg>
      {g.itens.map((it, i) => {
        const pTinta = prog(t, it.em + 0.1, 0.3);
        const entra = prog(t, it.em + 0.18, 0.32, caneta);
        const sai = i < atual ? prog(t, g.itens[i + 1].em + 0.1, 0.3) : 0;
        const temposDetalhe = it.dd && it.detalhe ? temposDoTexto(it.detalhe, palavras, m.de, m.ate, it.em + 0.2) : [];
        return (
          <div key={`n-${i}`}>
            <No x={X_NO} y={it.cy} ancora="esquerda" texto={it.d.linhas.join("\n")} tamanho={it.d.tamanho} estado={{ tinta: pTinta, marca: i <= atual ? entra * (1 - sai) : 0 }} />
            {it.dd ? (
              <div style={{ position: "absolute", left: X_NO + 24, top: it.y + it.hNo + 10 }}>
                <Escrita linhas={it.dd.linhas} tempos={temposDetalhe} t={t} estilo={{ fontFamily: sans, fontWeight: 500, color: cor.tintaSuave }} tamanho={it.dd.tamanho} entrelinha={1.2} />
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};
