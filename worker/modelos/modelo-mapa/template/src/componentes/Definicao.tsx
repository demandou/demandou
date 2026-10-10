// Definição: o termo é um nó do mapa (cheio de tinta quando é dito), à esquerda do cartão da pessoa;
// dele desce um ramo grosso até um cartão de anotação pautado, onde o significado se escreve
// palavra por palavra. O cartão chega torto e o alfinete o crava quando o significado é dito.
import { caneta, Escrita, prog, ramo, temposDoTexto, Traco } from "../anim";
import { diagramar, medir } from "../medidas";
import type { Definicao as TDefinicao, Palavra } from "../plano";
import { CARTAO, cor, DIREITA_BAIXO, MARGEM, serifa, titulo as estiloTitulo } from "../tema";
import { enchimentoDoNo, No } from "./No";

const NOTA_TOPO = 800;
const NOTA_PAD = { x: 60, cima: 100, baixo: 70 };
const NOTA_MIN = 560;

export const geometriaDaDefinicao = (m: TDefinicao) => {
  const C = CARTAO.definicao;
  const larguraCol = C.x - MARGEM - 60;
  // o termo: até 2 linhas dentro do nó
  let tamanho = 80;
  const e = (s: number) => enchimentoDoNo(s);
  let d = diagramar(m.termo, { equilibrar: true, largura: larguraCol - 2 * e(tamanho).x - 2 * e(tamanho).borda, maximo: 80, minimo: 44, linhas: 2, entrelinha: 1.08 });
  tamanho = d.tamanho;
  d = diagramar(m.termo, { equilibrar: true, largura: larguraCol - 2 * e(tamanho).x - 2 * e(tamanho).borda, maximo: tamanho, minimo: 44, linhas: 2, entrelinha: 1.08 });
  const larguraTexto = Math.max(...d.linhas.map((l) => medir(l, d.tamanho, "titulo")));
  const en = e(d.tamanho);
  const larguraNo = larguraTexto + 2 * en.x + 2 * en.borda;
  const alturaNo = d.tamanho * (d.linhas.length > 1 ? d.linhas.length * 1.08 : 1) + en.cima + en.baixo + 2 * en.borda;
  const no = { x: MARGEM, y: 430, w: larguraNo, h: alturaNo };
  // o cartão de anotação
  const L = DIREITA_BAIXO - MARGEM;
  const s = diagramar(m.significado, { equilibrar: true, largura: L - 2 * NOTA_PAD.x, maximo: 112, minimo: 56, linhas: 4, altura: 1470 - NOTA_TOPO - NOTA_PAD.cima - NOTA_PAD.baixo, entrelinha: 1.12 });
  const altTexto = s.linhas.length * s.tamanho * 1.12;
  const nota = { x: MARGEM, y: NOTA_TOPO, w: L, h: Math.max(NOTA_MIN, NOTA_PAD.cima + altTexto + NOTA_PAD.baixo) };
  // o texto fica no meio do cartão pautado; as linhas da pauta seguem até o pé
  const topoTexto = Math.max(NOTA_PAD.cima, (nota.h - altTexto) / 2 + 10);
  const pautas = Math.floor((nota.h - topoTexto - 30) / (s.tamanho * 1.12));
  return { d, no, s, nota, topoTexto, pautas, chegada: { x: no.x + no.w + 2, y: no.y } };
};

export const Definicao: React.FC<{ m: TDefinicao; palavras: Palavra[]; t: number }> = ({ m, palavras, t }) => {
  const g = geometriaDaDefinicao(m);
  const { no, nota, s } = g;
  const pTermo = prog(t, m.em - 0.05, 0.35);
  const pChega = prog(t, m.de - 0.3, 0.4);
  const pPino = prog(t, m.significadoEm, 0.32, caneta);
  const pRamo = prog(t, m.significadoEm - 0.3, 0.4, caneta);
  const tempos = temposDoTexto(m.significado, palavras, m.de, m.ate, m.significadoEm);
  const xPino = nota.x + nota.w / 2;
  const caminho = ramo(no.x + Math.min(no.w / 2, 140), no.y + no.h / 2, xPino, nota.y - 46, true);
  return (
    <>
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        <path d={caminho} fill="none" stroke={cor.lapisClaro} strokeWidth={5} strokeDasharray="2 14" strokeLinecap="round" />
        <Traco d={caminho} p={pRamo} cor={cor.tinta} largura={9} />
      </svg>
      <No x={no.x} y={no.y} ancora="esquerda" texto={g.d.linhas.join("\n")} tamanho={g.d.tamanho} peso={800} fonte={serifa} estado={{ tinta: pTermo, cheio: pTermo }} />
      {/* o cartão de anotação, pautado */}
      <div
        style={{
          position: "absolute",
          left: nota.x,
          top: nota.y,
          width: nota.w,
          height: nota.h,
          borderRadius: 24,
          background: cor.cartao,
          boxShadow: cor.sombra,
          opacity: 0.35 + 0.65 * pChega,
          rotate: `${(-2.2 * (1 - pPino)).toFixed(2)}deg`,
        }}
      >
        {Array.from({ length: g.pautas }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: NOTA_PAD.x - 10, right: NOTA_PAD.x - 10, top: g.topoTexto + (i + 1) * s.tamanho * 1.12 - s.tamanho * 0.1, height: 4, borderRadius: 2, background: cor.lapisClaro }} />
        ))}
        <div style={{ position: "absolute", left: NOTA_PAD.x, top: g.topoTexto }}>
          <Escrita linhas={s.linhas} tempos={tempos} t={t} estilo={estiloTitulo} tamanho={s.tamanho} entrelinha={1.12} />
        </div>
      </div>
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        <g transform={`translate(0 ${(-70 * (1 - pPino)).toFixed(1)})`} opacity={pPino}>
          <line x1={xPino} y1={nota.y - 10} x2={xPino + 6} y2={nota.y + 26} stroke={cor.tinta} strokeWidth={6} strokeLinecap="round" />
          <circle cx={xPino} cy={nota.y - 22} r={28} fill={cor.marca} stroke={cor.tinta} strokeWidth={6} />
        </g>
      </svg>
    </>
  );
};
