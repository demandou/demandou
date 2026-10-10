// Exemplo de uso: a frase no idioma (itálico, como nos dicionários) e a tradução embaixo.
// As palavras entram no ritmo da fala; a palavra do verbete fica em ameixa nas duas.
import { impressao, prog, temposDoTexto, TextoFalado } from "../anim";
import type { Areas } from "../layout";
import type { Frase as FraseT, Palavra } from "../plano";
import { encaixar, type Fonte } from "../medida";
import { caber, cor, rotulo, sans, serif } from "../tema";
import { ColunaDeVizinhos } from "./Pagina";

const Chip: React.FC<{ texto: string; cheio: boolean }> = ({ texto, cheio }) => (
  <span
    style={{
      fontFamily: sans,
      fontWeight: 700,
      fontSize: 32,
      letterSpacing: "0.08em",
      padding: "8px 12px 7px",
      borderRadius: 8,
      border: `3px solid ${cheio ? cor.ameixa : cor.tinta}`,
      background: cheio ? cor.ameixa : "transparent",
      color: cheio ? cor.claro : cor.tinta,
      marginRight: 16,
      lineHeight: 1,
      textTransform: "uppercase",
    }}
  >
    {texto}
  </span>
);

// Exemplo de uso bilíngue (frase com `traducao`): a frase no idioma em itálico e a tradução embaixo
export const Frase: React.FC<{ m: FraseT; t: number; areas: Areas; palavras: Palavra[] }> = ({ m, t, areas, palavras }) => {
  const R = areas.conteudo;
  const original = { texto: m.texto, em: m.em ?? m.de, idioma: m.idioma };
  const traducao = m.traducao ?? { texto: "", em: m.ate };
  const temposOriginal = temposDoTexto(original.texto, palavras, original.em, m.ate, original.em);
  const temposTraducao = temposDoTexto(traducao.texto, palavras, traducao.em, m.ate, traducao.em);
  const n = original.texto.length;
  // corpo pelo comprimento: frases curtas maiores; mínimo legível no celular (medido para não vazar)
  const larguraLinha = (k: number) => R.w * k;
  const corpoOriginal0 = areas.largo ? caber("x".repeat(Math.ceil(n / 2.2)), R.w, 84, 0.5, 52) : caber("x".repeat(Math.ceil(n / 3.4)), R.w, 70, 0.5, 46);
  const fOriginal: Fonte = { familia: "italico", peso: 400 };
  const corpoOriginal = encaixar(original.texto, { largura: larguraLinha(1), max: corpoOriginal0, min: 44, linhas: areas.largo ? 3 : 5, fonte: fOriginal }).corpo;
  const corpoTraducao = Math.max(44, Math.round(corpoOriginal * 0.74));
  const pFio = prog(t, traducao.em - 0.2, 0.4);
  return (
    <>
      {areas.vizinhos ? <ColunaDeVizinhos regiao={areas.vizinhos} lista={m.vizinhos?.antes} doFim fala={{ palavras, de: m.de, ate: m.ate, t }} /> : null}
      <div style={{ position: "absolute", left: R.x, top: R.y, width: R.w, height: R.h, display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
        <div style={{ display: "flex", alignItems: "center", ...impressao(t, m.de + 0.1) }}>
          {original.idioma ? <Chip texto={original.idioma} cheio /> : null}
          <span style={{ ...rotulo, color: cor.ameixa }}>{m.rotulo ?? "Exemplo"}</span>
        </div>
        <TextoFalado
          texto={original.texto}
          tempos={temposOriginal}
          t={t}
          enfase={m.destaque}
          estiloEnfase={{ color: cor.ameixa, fontWeight: 700 }}
          esboco
          corEsboco={cor.lapis}
          style={{ fontFamily: serif, fontStyle: "italic", fontSize: corpoOriginal, lineHeight: 1.18, color: cor.tinta }}
        />
        <div style={{ width: `${pFio * 100}%`, height: 2.5, background: cor.fio }} />
        <div style={{ display: "flex", alignItems: "center", ...impressao(t, traducao.em - 0.15) }}>
          <Chip texto="PT" cheio={false} />
          <span style={{ ...rotulo, color: cor.cinza }}>Tradução</span>
        </div>
        <TextoFalado
          texto={traducao.texto}
          tempos={temposTraducao}
          t={t}
          enfase={m.destaqueTraducao}
          estiloEnfase={{ textDecoration: `underline ${cor.ameixa}`, textDecorationThickness: 4, textUnderlineOffset: 8 }}
          esboco
          corEsboco={cor.lapis}
          style={{ fontFamily: serif, fontSize: corpoTraducao, lineHeight: 1.2, color: cor.cinza }}
        />
      </div>
    </>
  );
};
