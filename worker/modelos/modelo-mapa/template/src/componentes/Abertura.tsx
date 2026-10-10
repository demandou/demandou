// Abertura: o cartão grande da pessoa em cima (como no mapa mental) e o título que se escreve embaixo,
// palavra por palavra, com o marca-texto no trecho em destaque. O ramo da pessoa desce do canto do
// cartão até a primeira linha (RamoDaPessoa): o título é o primeiro nó do mapa.
import { Escrita, indicesDoTrecho, temposDoTexto } from "../anim";
import { diagramar } from "../medidas";
import type { Abertura as TAbertura, Palavra } from "../plano";
import { BASE, CARTAO, DIREITA_BAIXO, MARGEM, titulo as estiloTitulo } from "../tema";

export const geometriaDaAbertura = (m: TAbertura) => {
  const C = CARTAO.abertura;
  const faixa = C.y + C.h + 88;
  const x = MARGEM + 46;
  const d = diagramar(m.texto, { equilibrar: true, largura: DIREITA_BAIXO - x, maximo: 132, minimo: 72, linhas: 3, altura: BASE - 16 - faixa, entrelinha: 1.04 });
  const topo = faixa + Math.max(0, BASE - 16 - faixa - d.linhas.length * d.tamanho * 1.04) * 0.25;
  // onde o ramo da pessoa chega: à esquerda do meio da primeira linha
  const chegada = { x: MARGEM + 12, y: topo + d.tamanho * 0.56 };
  return { topo, d, x, chegada };
};

export const Abertura: React.FC<{ m: TAbertura; palavras: Palavra[]; t: number }> = ({ m, palavras, t }) => {
  const g = geometriaDaAbertura(m);
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.em ?? m.de);
  const destaque = indicesDoTrecho(m.texto, m.destaque);
  return (
    <div style={{ position: "absolute", left: g.x, top: g.topo }}>
      <Escrita linhas={g.d.linhas} tempos={tempos} t={t} estilo={estiloTitulo} tamanho={g.d.tamanho} destaque={destaque} entrelinha={1.04} />
    </div>
  );
};
