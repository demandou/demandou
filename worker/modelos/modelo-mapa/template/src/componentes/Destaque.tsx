// Destaque: o cartão da pessoa no alto, no centro, e a palavra (ou frase curta) enorme embaixo,
// centrada, ligada a ele por um ramo que desce. `chave`: a tinta escreve e o marca-texto passa por
// baixo de cada palavra. `alerta`: um bloco de tinta se enche por trás e a palavra sai em branco, com
// um selo "!" no canto — o mesmo "cheio de tinta" do nó central do mapa. O `detalhe` se escreve
// menor, embaixo.
import { Escrita, prog, temposDoTexto } from "../anim";
import { diagramar, medir } from "../medidas";
import type { Destaque as TDestaque, Palavra } from "../plano";
import { cor, sans, serifa, titulo as estiloTitulo } from "../tema";

const FAIXA = { topo: 790, base: 1490, centro: 540, largura: 900 };

export const geometriaDoDestaque = (m: TDestaque) => {
  const alerta = m.nivel === "alerta";
  const largura = FAIXA.largura - (alerta ? 100 : 0);
  const d = diagramar(m.texto, { equilibrar: true, largura, maximo: 170, minimo: 84, linhas: 3, altura: 520, entrelinha: 1.04 });
  const altTexto = d.linhas.length * d.tamanho * 1.04;
  const dd = m.detalhe ? diagramar(m.detalhe, { equilibrar: true, largura: 860, maximo: 64, minimo: 44, linhas: 2, corte: "texto600", entrelinha: 1.2 }) : null;
  const altDetalhe = dd ? 40 + dd.linhas.length * dd.tamanho * 1.2 : 0;
  const folga = alerta ? 34 : 0;
  const total = altTexto + altDetalhe + 2 * folga;
  // o bloco fica um pouco acima do meio da faixa (perto do cartão, de onde o ramo desce)
  const topo = FAIXA.topo + Math.max(0, (FAIXA.base - FAIXA.topo - total) * 0.4) + folga;
  const larguraTexto = Math.max(...d.linhas.map((l) => medir(l, d.tamanho, "titulo")));
  const caixa = { x: FAIXA.centro - larguraTexto / 2 - 50, y: topo - folga, w: larguraTexto + 100, h: altTexto + 2 * folga - d.tamanho * 0.04 };
  // onde o ramo da pessoa chega: logo acima do texto (ou do bloco de tinta)
  const chegada = { x: FAIXA.centro, y: topo - folga - 26 };
  return { d, dd, topo, altTexto, caixa, chegada, alerta };
};

export const Destaque: React.FC<{ m: TDestaque; palavras: Palavra[]; t: number }> = ({ m, palavras, t }) => {
  const g = geometriaDoDestaque(m);
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.em);
  const todas = new Set(tempos.map((_, i) => i));
  const temposDetalhe = m.detalhe ? temposDoTexto(m.detalhe, palavras, m.de, m.ate, m.detalheEm ?? (tempos[tempos.length - 1] ?? m.em) + 0.2) : [];
  const pBloco = prog(t, m.em - 0.14, 0.34);
  const pSelo = prog(t, m.em + 0.1, 0.3);
  const { caixa } = g;
  return (
    <>
      {g.alerta ? (
        <>
          {/* esboço do bloco a lápis e o bloco de tinta que se enche da esquerda para a direita */}
          <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, borderRadius: 30, border: `4px dashed ${cor.lapis}`, opacity: 1 - pBloco }} />
          <div
            style={{
              position: "absolute",
              left: caixa.x,
              top: caixa.y,
              width: caixa.w,
              height: caixa.h,
              borderRadius: 30,
              background: cor.tinta,
              boxShadow: cor.sombra,
              transformOrigin: "left center",
              transform: `scaleX(${pBloco.toFixed(4)})`,
              opacity: pBloco > 0 ? 1 : 0,
            }}
          />
        </>
      ) : null}
      <div style={{ position: "absolute", left: 0, width: 1080, top: g.topo, display: "flex", justifyContent: "center" }}>
        <Escrita
          linhas={g.d.linhas}
          tempos={tempos}
          t={t}
          estilo={{ ...estiloTitulo, color: g.alerta ? cor.cartao : cor.tinta }}
          tamanho={g.d.tamanho}
          alinhar="center"
          destaque={g.alerta ? undefined : todas}
          esboco={g.alerta ? 1 - pBloco : 1}
          entrelinha={1.04}
        />
      </div>
      {g.alerta ? (
        <div
          style={{
            position: "absolute",
            left: caixa.x - 30,
            top: caixa.y - 30,
            width: 76,
            height: 76,
            borderRadius: 999,
            background: cor.marca,
            border: `6px solid ${cor.tinta}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: serifa,
            fontWeight: 800,
            fontSize: 50,
            color: cor.tinta,
            scale: `${0.6 + 0.4 * pSelo}`,
            opacity: pSelo,
          }}
        >
          !
        </div>
      ) : null}
      {g.dd ? (
        <div style={{ position: "absolute", left: 0, width: 1080, top: g.topo + g.altTexto + (g.alerta ? 34 : 0) + 40, display: "flex", justifyContent: "center" }}>
          <Escrita linhas={g.dd.linhas} tempos={temposDetalhe} t={t} estilo={{ fontFamily: sans, fontWeight: 600, color: cor.tinta }} tamanho={g.dd.tamanho} alinhar="center" entrelinha={1.2} />
        </div>
      ) : null}
    </>
  );
};
