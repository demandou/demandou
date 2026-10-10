// Cartões de pergunta: flashcards empilhados que viram (pergunta → resposta) no tempo da fala; ao
// lado do cartão da pessoa, a frase falada; embaixo, uma frase com um trecho que é riscado.
import { Escrita, entra, indicesDoTrecho, prog, temposDoTexto } from "../anim";
import { diagramar, medir } from "../medidas";
import type { Cartoes as TCartoes, Palavra } from "../plano";
import { CARTAO, cor, DIREITA_BAIXO, MARGEM, rotulo, sans, serifa, titulo as estiloTitulo } from "../tema";

export const PILHA = { x: MARGEM, y: 690, w: DIREITA_BAIXO - MARGEM, h: 600 };

const Selo: React.FC<{ letra: string; cheio: boolean }> = ({ letra, cheio }) => (
  <div
    style={{
      width: 68,
      height: 68,
      flex: "0 0 68px",
      borderRadius: 999,
      border: `4px solid ${cheio ? cor.tinta : cor.lapis}`,
      background: cheio ? cor.marca : cor.cartao,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: sans,
      fontWeight: 700,
      fontSize: 36,
      color: cheio ? cor.tinta : cor.lapis,
    }}
  >
    {letra}
  </div>
);

const Face: React.FC<{ verso: boolean; children: React.ReactNode }> = ({ verso, children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: 22,
      background: cor.cartao,
      border: `3px solid ${verso ? cor.tinta : "rgba(30,26,60,0.14)"}`,
      boxShadow: "0 10px 24px rgba(30,26,60,0.12)",
      backfaceVisibility: "hidden",
      transform: verso ? "rotateX(180deg)" : undefined,
      display: "flex",
      alignItems: "center",
      gap: 30,
      padding: "0 40px",
    }}
  >
    {children}
  </div>
);

export const Cartoes: React.FC<{ m: TCartoes; palavras: Palavra[]; t: number }> = ({ m, palavras, t }) => {
  // a frase fica à direita do cartão da pessoa
  const xTexto = CARTAO.cartoes.x + CARTAO.cartoes.w + 56;
  const largura = 1020 - xTexto;
  const d = m.texto ? diagramar(m.texto, { largura, maximo: 84, minimo: 60, linhas: 3, altura: 300 }) : null;
  const tempos = m.texto ? temposDoTexto(m.texto, palavras, m.de, m.ate) : [];
  const n = Math.max(1, Math.min(3, m.cartoes.length));
  const vao = 22;
  const h = (PILHA.h - (n - 1) * vao) / n;
  const rod = m.rodape ? diagramar(m.rodape, { largura: PILHA.w, maximo: 76, minimo: 56, linhas: 2, altura: 190 }) : null;
  const temposRod = m.rodape ? temposDoTexto(m.rodape, palavras, m.de, m.ate) : [];
  const riscado = m.rodape ? indicesDoTrecho(m.rodape, m.riscado) : new Set<number>();

  return (
    <>
      <div style={{ position: "absolute", left: xTexto, top: 178, width: largura }}>
        {m.rotulo ? <div style={{ ...rotulo, marginBottom: 26 }}>{m.rotulo}</div> : null}
        {d ? <Escrita linhas={d.linhas} tempos={tempos} t={t} estilo={estiloTitulo} tamanho={d.tamanho} /> : null}
      </div>
      {m.cartoes.slice(0, 3).map((c, i) => {
        const p = prog(t, c.em, 0.5, entra);
        const ang = 180 * p;
        const chega = prog(t, m.de - 0.35 + i * 0.08, 0.4);
        // corpo da pergunta e da resposta cabendo na largura do cartão
        let tp = 46;
        while (tp > 36 && medir(c.pergunta, tp, "texto600") > PILHA.w - 180) tp -= 2;
        let tr = 54;
        while (tr > 40 && medir(c.resposta, tr, "titulo") > PILHA.w - 180) tr -= 2;
        return (
          <div
            key={`c-${i}`}
            style={{
              position: "absolute",
              left: PILHA.x,
              top: PILHA.y + i * (h + vao),
              width: PILHA.w,
              height: h,
              perspective: 1800,
              opacity: 0.35 + 0.65 * chega,
              translate: `0 ${((1 - chega) * 30).toFixed(1)}px`,
            }}
          >
            <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateX(${ang.toFixed(2)}deg)` }}>
              <Face verso={false}>
                <Selo letra="P" cheio={false} />
                <div style={{ fontFamily: sans, fontWeight: 600, fontSize: tp, color: cor.tinta, whiteSpace: "nowrap" }}>{c.pergunta}</div>
              </Face>
              <Face verso>
                <Selo letra="R" cheio />
                <div style={{ position: "relative", fontFamily: serifa, fontWeight: 800, fontSize: tr, color: cor.tinta, whiteSpace: "nowrap" }}>{c.resposta}</div>
              </Face>
            </div>
          </div>
        );
      })}
      {rod ? (
        <div style={{ position: "absolute", left: MARGEM, top: PILHA.y + PILHA.h + 44 }}>
          <Escrita linhas={rod.linhas} tempos={temposRod} t={t} estilo={estiloTitulo} tamanho={rod.tamanho} riscado={riscado} riscaEm={m.riscaEm} />
        </div>
      ) : null}
    </>
  );
};
