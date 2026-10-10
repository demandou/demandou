import { Escrita, indicesDoTrecho, prog, temposDoTexto } from "../anim";
import { encaixarLinhas, larguraLinha } from "../medida";
import type { Abertura, Palavra, Plano } from "../plano";
import { cor, destaque, fonte, JANELA, LARGURA_UTIL, rotulo, TAM, texto } from "../tema";

const LARGURA_CABECALHO = LARGURA_UTIL - JANELA.w - 40;

// `assinatura`: 1 na ficha no peito (abertura); 0 no cabeçalho, ao lado da janela (não cabe lá)
export type Pose = { x: number; y: number; corpo: number; op: number; largura: number; assinatura: number };

// As linhas do título: quebradas para caberem na largura do cabeçalho (a coluna mais estreita, para
// o título não mudar de forma ao subir); se passar de 3 linhas, o corpo diminui (até 60 px).
// Devolve as linhas e a escala do corpo em relação ao corpo do cabeçalho.
export const tituloDaReceita = (m: Abertura) => {
  const base = m.titulo?.length ? m.titulo : [m.texto ?? ""];
  const fit = encaixarLinhas(base, { largura: LARGURA_CABECALHO, max: TAM.tituloCabecalho, min: 60, linhas: 3 });
  return { linhas: fit.linhas, escala: fit.corpo / TAM.tituloCabecalho, largura1: Math.max(...fit.linhas.map((l) => larguraLinha(l, 1))) };
};

// O título da receita: nasce na ficha baixa (abertura) e sobe com ela para o cabeçalho,
// ao lado da janela da pessoa, durante os ingredientes.
export const Receita: React.FC<{ m: Abertura; pose: Pose; t: number; palavras: Palavra[]; marca: Plano["marca"] }> = ({
  m,
  pose,
  t,
  palavras,
  marca,
}) => {
  if (pose.op <= 0.001) return null;
  const { linhas, escala, largura1 } = tituloDaReceita(m);
  const corpo = Math.min(pose.corpo * escala, Math.floor(pose.largura / Math.max(largura1, 0.01)));
  const todas = linhas.join(" ").split(/\s+/).filter(Boolean);
  const inicio = m.em ?? m.de + 0.2;
  const tempos = temposDoTexto(linhas.join(" "), palavras, Math.min(m.de, inicio - 0.3), m.ate, inicio);
  const grifo = indicesDoTrecho(todas, m.destaque);
  const passos = m.passos;
  const temposPassos = passos ? temposDoTexto(`${passos.total} passos`, palavras, passos.em - 0.6, m.ate, passos.em - 0.2) : [];
  const nome = [marca.nome, marca.area].filter(Boolean).join(" · ");
  return (
    <div style={{ position: "absolute", left: pose.x, top: pose.y, opacity: pose.op, fontFamily: texto, color: cor.cacau }}>
      <div style={{ ...rotulo, marginBottom: 14, opacity: prog(t, m.de - 0.3, 0.4) }}>{m.rotulo ?? "Receita"}</div>
      <Escrita
        linhas={linhas}
        tempos={tempos}
        t={t}
        esboco={cor.lapis}
        style={{ fontFamily: fonte, fontSize: corpo, lineHeight: 1.0 }}
        estiloDe={(i) => (grifo.has(i) ? destaque : undefined)}
      />
      {passos ? (
        <div style={{ display: "flex", alignItems: "center", marginTop: 20, gap: 16 }}>
          <Escrita
            linhas={[`${passos.total} passos`]}
            tempos={temposPassos}
            t={t}
            esboco={cor.lapis}
            style={{ fontSize: TAM.passos, fontStyle: "italic", lineHeight: 1 }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            {Array.from({ length: Math.min(6, passos.total) }, (_, i) => {
              const p = prog(t, passos.em + 0.12 + i * 0.13, 0.32);
              return (
                <div
                  key={i}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    border: `3.5px ${p > 0.02 ? "solid" : "dashed"} ${p > 0.02 ? cor.cacau : cor.lapis}`,
                    boxSizing: "border-box",
                    background: p > 0.02 ? cor.pistacheClaro : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonte,
                    fontSize: 40,
                    lineHeight: 1,
                    color: p > 0.02 ? cor.cacau : cor.lapis,
                    scale: String(0.7 + 0.3 * p),
                    translate: `0 ${(1 - p) * 8}px`,
                  }}
                >
                  <span style={{ translate: "0 0.04em" }}>{i + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {nome && pose.assinatura > 0.01 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 18,
            fontSize: TAM.assinatura,
            fontStyle: "italic",
            color: cor.cacauSuave,
            whiteSpace: "nowrap",
            lineHeight: 1,
            opacity: pose.assinatura,
          }}
        >
          <div style={{ width: 44, height: 4, background: cor.pistache }} />
          {nome}
        </div>
      ) : null}
    </div>
  );
};
