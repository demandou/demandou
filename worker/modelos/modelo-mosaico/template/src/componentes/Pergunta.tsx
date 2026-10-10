import { limitar, mistura, prog } from "../anim";
import { encaixar, encaixarTodos } from "../medida";
import type { Pergunta as TPergunta } from "../plano";
import { display, paleta } from "../tema";
import { F_ITEM, F_TITULO, lapis, respiro, TextoFalado, type PropsBloco } from "./comum";
import { fundoPeca } from "./Grupo";

// Pergunta para quem assiste: uma peça redonda com "?" pousa no canto, a pergunta se monta na fala e as
// opções (se houver) viram faixas — mosaico dentro do mosaico — que nascem a lápis e se acendem cada uma
// na sua palavra, com uma pastilha quadrada de marcador.
export const Pergunta: React.FC<PropsBloco<TPergunta>> = ({ b, t, w, h, util, pal, palavras, janela }) => {
  const pad = respiro(w, h);
  const alto = Math.min(h, util);
  const interna = w - 2 * pad;
  const opcoes = (b.opcoes ?? []).slice(0, 4);
  const n = opcoes.length;
  const tamPeca = Math.min(150, alto * 0.19, w * 0.24);
  const gap = 14;
  // as opções primeiro (até 2 linhas, nunca menores que 40 px); a pergunta fica com o resto
  const marca = 38;
  const ops = encaixarTodos(
    opcoes.map((o) => o.texto),
    { largura: interna - 56 - marca - 22, altura: ((alto - 2 * pad) * 0.58) / Math.max(n, 1) - gap - 36, max: 64, min: 40, linhas: 2, fonte: F_ITEM, entrelinha: 1.06 },
  );
  const altOpcao = n ? limitar(Math.max(...ops.map((o) => o.altura)) + 40, 96, 190) : 0;
  const altOpcoes = n ? n * altOpcao + (n - 1) * gap + 30 : 0;
  const disponivel = alto - 2 * pad - tamPeca - 28 - altOpcoes;
  const tx = encaixar(b.texto, { largura: interna, altura: disponivel, max: 112, min: 48, linhas: 4, fonte: F_TITULO, entrelinha: 1.05 });
  const inicio = b.em ?? janela.de;
  const pPeca = prog(t, inicio - 0.15, 0.5);
  const corPeca = pal.fundo === paleta.gema.fundo ? paleta.tinta : paleta.gema;
  return (
    <div style={{ position: "absolute", left: pad, top: pad, width: interna, height: alto - 2 * pad, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          width: tamPeca,
          height: tamPeca,
          borderRadius: tamPeca / 2,
          background: corPeca.fundo,
          scale: String(mistura(0.5, 1, pPeca)),
          opacity: limitar(pPeca * 2),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: display,
          fontWeight: 800,
          fontSize: tamPeca * 0.66,
          lineHeight: 1,
          color: corPeca.texto,
          flexShrink: 0,
        }}
      >
        ?
      </div>
      <div style={{ marginTop: 28, flex: 1, display: "flex", flexDirection: "column", justifyContent: n ? "flex-start" : "flex-end" }}>
        <TextoFalado
          linhas={tx.linhas}
          t={t}
          palavras={palavras}
          janela={janela}
          inicio={inicio}
          tamanho={tx.tamanho}
          cor={pal.texto}
          entrelinha={1.05}
          estilo={{ fontFamily: display, fontWeight: 700, letterSpacing: "-0.025em" }}
        />
      </div>
      {n ? (
        <div style={{ display: "flex", flexDirection: "column", gap, marginTop: 30 }}>
          {opcoes.map((o, i) => {
            const pCasa = prog(t, janela.de + 0.2 + i * 0.06, 0.4);
            const p = prog(t, o.em - 0.06, 0.5);
            const op = ops[i];
            return (
              <div
                key={i}
                style={{
                  height: altOpcao,
                  borderRadius: 22,
                  background: p > 0 ? fundoPeca(pal, 0.6 * p) : "transparent",
                  outline: p < 0.999 ? `2.5px dashed ${lapis(pal, p)}` : undefined,
                  outlineOffset: -2,
                  opacity: pCasa,
                  scale: String(p > 0 ? mistura(0.97, 1, p) : 1),
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  padding: "0 28px",
                }}
              >
                <div style={{ width: marca, height: marca, borderRadius: marca * 0.26, flexShrink: 0, background: p > 0 ? pal.acento : "transparent", outline: p < 0.999 ? `2.5px dashed ${lapis(pal, p)}` : undefined, outlineOffset: -2, scale: String(mistura(0.6, 1, p)) }} />
                <div style={{ fontFamily: display, fontWeight: 700, fontSize: op.tamanho, lineHeight: 1.06, letterSpacing: "-0.015em", color: pal.texto, opacity: p <= 0.001 ? 0 : 1, clipPath: p < 0.999 ? `inset(-0.2em ${((1 - p) * 104).toFixed(2)}% -0.2em -0.1em)` : undefined }}>
                  {op.linhas.map((l, k) => (
                    <div key={k} style={{ whiteSpace: "nowrap" }}>
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
