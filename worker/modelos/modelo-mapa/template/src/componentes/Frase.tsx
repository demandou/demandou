// Frase: aspas grandes de tinta à esquerda do cartão da pessoa (o ramo dela chega nelas) e a frase
// enorme embaixo, escrita palavra por palavra; o `destaque` ganha marca-texto e o `risco` leva um
// traço de tinta quando é dito.
import { Escrita, indicesDoTrecho, prog, temposDoTexto } from "../anim";
import { diagramar } from "../medidas";
import type { Frase as TFrase, Palavra } from "../plano";
import { BASE, CARTAO, cor, DIREITA_BAIXO, MARGEM, serifa, titulo as estiloTitulo } from "../tema";

const ASPAS = { x: MARGEM - 6, y: 150, tamanho: 380 };

export const geometriaDaFrase = (m: TFrase) => {
  const C = CARTAO.frase;
  const faixa = C.y + C.h + 64;
  const d = diagramar(m.texto, { equilibrar: true, largura: DIREITA_BAIXO - MARGEM, maximo: 128, minimo: 64, linhas: 4, altura: BASE - 16 - faixa, entrelinha: 1.04 });
  // frase curta desce um pouco para o meio da faixa
  const topo = faixa + Math.max(0, BASE - 16 - faixa - d.linhas.length * d.tamanho * 1.04) * 0.3;
  // onde o ramo da pessoa chega: o pé das aspas
  const chegada = { x: ASPAS.x + ASPAS.tamanho * 0.47, y: ASPAS.y + ASPAS.tamanho * 0.43 };
  return { topo, d, chegada };
};

export const Frase: React.FC<{ m: TFrase; palavras: Palavra[]; t: number }> = ({ m, palavras, t }) => {
  const g = geometriaDaFrase(m);
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.em ?? m.de);
  const destaque = indicesDoTrecho(m.texto, m.destaque);
  const riscado = indicesDoTrecho(m.texto, m.risco);
  // as aspas ganham tinta quando a frase começa a ser dita
  const p = prog(t, (tempos[0] ?? m.de) - 0.1, 0.4);
  const aspas: React.CSSProperties = { position: "absolute", left: ASPAS.x, top: ASPAS.y, fontFamily: serifa, fontWeight: 800, fontSize: ASPAS.tamanho, lineHeight: 1 };
  return (
    <>
      <div style={{ ...aspas, color: cor.esboco, opacity: 1 - p }}>“</div>
      {p > 0 ? <div style={{ ...aspas, color: cor.tinta, clipPath: p < 0.999 ? `inset(-10% ${((1 - p) * 104).toFixed(2)}% -10% -4%)` : undefined }}>“</div> : null}
      <div style={{ position: "absolute", left: MARGEM, top: g.topo }}>
        <Escrita
          linhas={g.d.linhas}
          tempos={tempos}
          t={t}
          estilo={estiloTitulo}
          tamanho={g.d.tamanho}
          destaque={destaque}
          riscado={riscado}
          riscaEm={m.riscoEm ?? (riscado.size ? Math.max(...[...riscado].map((i) => tempos[i] ?? m.de)) + 0.3 : undefined)}
          entrelinha={1.04}
        />
      </div>
    </>
  );
};
