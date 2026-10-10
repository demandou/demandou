// Abertura: o gancho se monta palavra por palavra embaixo do quadro, no ritmo da fala.
import { indicesDoTrecho, Linhas, saindo, temposDoTexto } from "../anim";
import { abaixoDoQuadro, FIM_DO_RECUO } from "../layout";
import { caber } from "../medidas";
import type { Abertura as AberturaT, Palavra } from "../plano";
import { cor, FUNDO, MARGEM, titulo, W } from "../tema";

export const Abertura: React.FC<{ m: AberturaT; palavras: Palavra[]; t: number; fim: number }> = ({ m, palavras, t, fim }) => {
  const topo = abaixoDoQuadro("abertura");
  const largura = W - 2 * MARGEM;
  // `texto` (universal) ou `titulo` (nome antigo)
  const texto = m.texto ?? m.titulo ?? "";
  const { linhas, tam } = caber(texto, { largura, maximo: 108, minimo: 64, linhas: 3, altura: FUNDO - topo, entrelinha: 1.04, piso: 48 });
  const tempos = temposDoTexto(texto, palavras, m.de, m.ate, Math.max(m.em ?? m.de + 0.1, FIM_DO_RECUO));
  const destaque = indicesDoTrecho(texto, m.destaque);
  const s = saindo(t, fim + 0.05, 0.25);
  return (
    <div style={{ position: "absolute", left: MARGEM, top: topo, width: largura, opacity: 1 - s, translate: `0 ${24 * s}px` }}>
      <Linhas
        linhas={linhas}
        tempos={tempos}
        t={t}
        tam={tam}
        modo="monta"
        entrelinha={1.04}
        estilo={{ ...titulo, fontSize: tam }}
        corDe={(i) => (destaque.has(i) ? cor.acento : undefined)}
      />
    </div>
  );
};
