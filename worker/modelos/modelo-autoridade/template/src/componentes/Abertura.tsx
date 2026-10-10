import { Bloco, indicesDoTrecho, marcaNoGrupo, Palavras, prog, temposDoTexto, useTempo } from "../anim";
import { encaixarNaCaixa, ITALICO, larguraTexto, SERIF } from "../medida";
import type { Abertura as TAbertura, Palavra } from "../plano";
import { cor, minimo, sombra } from "../tema";
import { Letreiro } from "./Pecas";

// Título de abertura: serifada grande que se monta palavra por palavra na fala, centralizada no peito.
// O trecho em destaque fica em itálico latão e ganha um traço de latão quando termina de ser dito.
export const Abertura: React.FC<{ m: TAbertura; palavras: Palavra[]; largura: number; altura: number }> = ({
  m,
  palavras,
  largura,
  altura,
}) => {
  const t = useTempo();
  const inicio = Math.max(0, m.em ?? m.de);
  const destaque = indicesDoTrecho(m.texto, m.destaque);
  const estilo = (i: number) => (destaque.has(i) ? ITALICO : SERIF);
  const alturaRotulo = m.rotulo ? 62 : 0;
  const q = encaixarNaCaixa(m.texto, {
    largura,
    altura: altura - alturaRotulo,
    max: 132,
    min: minimo.titulo + 4,
    linhas: 3,
    alturaLinha: 1.02,
    estilo,
  });
  const tempos = temposDoTexto(m.texto, palavras, inicio, m.ate);
  const ws = m.texto.split(/\s+/).filter(Boolean);
  const larguras = ws.map((w, i) => larguraTexto(w, q.tamanho, estilo(i)));
  const grupo = [...destaque].sort((a, b) => a - b);
  const fimDestaque = grupo.length ? tempos[grupo[grupo.length - 1]] : 0;
  const traco = marcaNoGrupo(grupo, larguras, prog(t, fimDestaque + 0.15, 0.6));

  return (
    <Bloco t={t} ate={m.ate} style={{ width: "100%", textShadow: sombra }}>
      {m.rotulo ? (
        <div style={{ marginBottom: 26 }}>
          <Letreiro texto={m.rotulo} t={t} inicio={Math.max(0, m.de)} largura={largura} />
        </div>
      ) : null}
      <Palavras
        linhas={q.linhas}
        tempos={tempos}
        t={t}
        tamanho={q.tamanho}
        alturaLinha={1.02}
        estilo={estilo}
        cor={(i) => (destaque.has(i) ? cor.lataoClaro : cor.papel)}
        marca={(i) =>
          destaque.has(i) ? { tipo: "sublinhado", cor: cor.latao, p: traco.get(i) ?? 0, liga: destaque.has(i + 1) } : null
        }
      />
    </Bloco>
  );
};
