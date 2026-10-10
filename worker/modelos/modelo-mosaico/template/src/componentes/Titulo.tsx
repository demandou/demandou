import { prog } from "../anim";
import { encaixar, larguraTexto } from "../medida";
import type { Abertura, Titulo as TTitulo } from "../plano";
import { display, rotulo } from "../tema";
import { F_TITULO, quebraManual, respiro, TextoFalado, type PropsBloco } from "./comum";

// Título de revista (também a `abertura`): chapéu em cima, texto grande assentado embaixo, montado palavra
// por palavra na fala. Com `linhas`, a quebra é a escrita no plano; com `texto`, o bloco mede e quebra
// sozinho (linhas equilibradas, o maior corpo que cabe).
export const Titulo: React.FC<PropsBloco<TTitulo | Abertura>> = ({ b, t, w, h, util, pal, palavras, janela }) => {
  const pad = respiro(w, h);
  const interna = w - 2 * pad;
  const alto = Math.min(h, util);
  const alturaRotulo = b.rotulo ? 70 : 0;
  const disponivel = alto - 2 * pad - alturaRotulo;
  const enfase = b.tipo === "abertura" ? b.destaque : b.enfase;
  let linhas: string[];
  let tamanho: number;
  const manual = quebraManual(b);
  if (manual) {
    linhas = manual;
    const maior = Math.max(...linhas.map((l) => larguraTexto(l, 1, F_TITULO)));
    tamanho = Math.max(40, Math.floor(Math.min(128, interna / Math.max(maior, 0.01), disponivel / (linhas.length * 1.06))));
  } else {
    const e = encaixar(b.texto ?? "", { largura: interna, altura: disponivel, max: 128, min: 44, linhas: 4, fonte: F_TITULO, entrelinha: 1.06 });
    linhas = e.linhas;
    tamanho = e.tamanho;
  }
  const alturaTexto = linhas.length * tamanho * 1.04;
  const pRotulo = prog(t, janela.de, 0.6);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {b.rotulo ? (
        <div style={{ position: "absolute", left: pad, top: pad, right: pad }}>
          <div style={{ ...rotulo, color: pal.acento, opacity: pRotulo, translate: `${(1 - pRotulo) * -20}px 0`, whiteSpace: "nowrap", overflow: "hidden" }}>{b.rotulo}</div>
          <div style={{ marginTop: 18, height: 3, width: `${pRotulo * 100}%`, background: pal.suave, opacity: 0.5 }} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: pad, top: Math.max(pad + alturaRotulo, alto - pad - alturaTexto), width: interna }}>
        <TextoFalado
          linhas={linhas}
          t={t}
          palavras={palavras}
          janela={janela}
          inicio={b.em}
          tamanho={tamanho}
          cor={pal.texto}
          corEnfase={pal.acento}
          enfase={enfase}
          estilo={{ fontFamily: display, fontWeight: 700, letterSpacing: "-0.025em" }}
        />
      </div>
    </div>
  );
};
