import { Bloco, Linha, Palavras, prog, temposDoTexto, useTempo } from "../anim";
import { encaixarNaCaixa, encaixarTodos, SERIF } from "../medida";
import type { Palavra, Pergunta as TPergunta } from "../plano";
import { cor, minimo, serif, sombra } from "../tema";
import { Ajuste, type Folga } from "./Pecas";

// Pergunta: a pergunta se monta em serifada marfim, palavra por palavra. Com opções, elas ficam
// em cartões de contorno fino (como no exemplo) e cada um se enche de papel quando é dito.
// Sem opções, um fio de latão se desenha embaixo quando a pergunta termina.
export const Pergunta: React.FC<{ m: TPergunta; palavras: Palavra[]; largura: number; altura: number; folga?: Folga }> = ({
  m,
  palavras,
  largura,
  altura: alturaMax,
  folga,
}) => {
  const t = useTempo();
  const inicio = Math.max(0, m.em ?? m.de);
  const opcoes = m.opcoes && m.opcoes.length >= 2 ? m.opcoes.slice(0, 4) : [];
  const n = opcoes.length;
  const gap = 16;
  const pad = 22;

  // arranjo das opções: 2 lado a lado; 3 lado a lado se couberem, senão empilhadas; 4 em grade 2×2
  const arranjo = (colunas: number) => {
    const larguraCartao = (largura - (colunas - 1) * gap) / colunas;
    const r = encaixarTodos(
      opcoes.map((o) => o.texto),
      { largura: larguraCartao - 2 * pad, max: 60, min: minimo.corpo, linhas: 2, estilo: () => SERIF },
    );
    const linhas = Math.max(1, ...r.quebras.map((q) => q.linhas.length));
    return { colunas, larguraCartao, ...r, alturaCartao: Math.max(118, linhas * r.tamanho * 1.06 + 2 * pad + 8) };
  };
  let a = n ? arranjo(n === 4 ? 2 : n) : null;
  if (a && n === 3 && (a.tamanho < 50 || a.quebras.some((q) => q.linhas.length > 2))) a = arranjo(1);
  const filas = a ? Math.ceil(n / a.colunas) : 0;
  const alturaOpcoes = a ? filas * a.alturaCartao + (filas - 1) * gap + 40 : 70;
  // a folga acima da zona só entra quando as opções não cabem
  const altura = folga && alturaOpcoes + minimo.titulo * 1.1 > folga.zona ? alturaMax : (folga?.zona ?? alturaMax);

  const q = encaixarNaCaixa(m.texto, {
    largura,
    altura: Math.max(minimo.titulo * 1.1, altura - alturaOpcoes),
    max: n ? 96 : 112,
    min: minimo.titulo,
    linhas: n ? 2 : 3,
    alturaLinha: 1.02,
  });
  const tempos = temposDoTexto(m.texto, palavras, inicio, m.ate);
  const fimTexto = tempos[tempos.length - 1] ?? inicio;
  const escalaOpcoes = a ? Math.min(1, (altura - q.linhas.length * q.tamanho * 1.02 - 40) / (alturaOpcoes - 40)) : 1;
  const H = q.linhas.length * q.tamanho * 1.02 + (a ? 40 + (alturaOpcoes - 40) * escalaOpcoes : 29);

  return (
    <Ajuste h={H} folga={folga}>
    <Bloco t={t} ate={m.ate} style={{ width: "100%" }}>
      <div style={{ textShadow: sombra }}>
        <Palavras linhas={q.linhas} tempos={tempos} t={t} tamanho={q.tamanho} alturaLinha={1.02} estilo={() => SERIF} cor={() => cor.papel} />
      </div>
      {!a ? (
        <div style={{ height: 3, marginTop: 26, width: 420 * prog(t, fimTexto + 0.25, 0.8), background: cor.latao }} />
      ) : (
        <div style={{ height: (alturaOpcoes - 40) * escalaOpcoes, marginTop: 40, width: largura }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${a.colunas}, ${a.larguraCartao}px)`,
              gap,
              width: largura,
              scale: String(escalaOpcoes),
              transformOrigin: "center top",
            }}
          >
            {opcoes.map((op, i) => {
              const aceso = prog(t, op.em, 0.45);
              return (
                <div
                  key={`${op.texto}-${i}`}
                  style={{
                    height: a.alturaCartao,
                    position: "relative",
                    border: "1.5px solid rgba(242,236,223,0.5)",
                    opacity: prog(t, inicio + 0.35 + i * 0.1, 0.4),
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ position: "absolute", inset: 0, background: cor.papel, translate: `0 ${(1 - aceso) * 101}%` }} />
                  <div style={{ position: "relative", padding: `0 ${pad}px`, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {a.quebras[i].linhas.map((l, j) => (
                      <Linha
                        key={j}
                        p={1}
                        style={{
                          fontFamily: serif,
                          fontSize: a.tamanho,
                          lineHeight: 1.06,
                          whiteSpace: "nowrap",
                          color: aceso > 0.5 ? cor.tinta : "rgba(242,236,223,0.55)",
                          textShadow: aceso > 0.5 ? "none" : sombra,
                        }}
                      >
                        {l.map((p) => p.w).join(" ")}
                      </Linha>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Bloco>
    </Ajuste>
  );
};
