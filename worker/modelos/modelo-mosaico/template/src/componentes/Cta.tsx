import { mistura, prog } from "../anim";
import { encaixar, larguraTexto } from "../medida";
import type { Cta as TCta } from "../plano";
import { display } from "../tema";
import { F_TITULO, quebraManual, respiro, TextoFalado, type PropsBloco } from "./comum";
import { Icone } from "./Icones";

// Fechamento: o ícone da ação (salvar, seguir, comentar, link) se desenha quando o bloco entra e se
// preenche quando a ação é dita; o texto se monta na fala, com o `destaque` na cor de ênfase.
export const Cta: React.FC<PropsBloco<TCta>> = ({ b, t, w, h, util, pal, palavras, janela }) => {
  const pad = respiro(w, h);
  const alto = Math.min(h, util);
  const interna = w - 2 * pad;
  const tamIcone = Math.min(interna * 0.3, (alto - 2 * pad) * 0.3, 180);
  const disponivel = alto - 2 * pad - tamIcone - 30;
  let linhas: string[];
  let tam: number;
  const manual = quebraManual(b);
  if (manual) {
    linhas = manual;
    const maior = Math.max(...linhas.map((l) => larguraTexto(l, 1, F_TITULO)));
    tam = Math.max(56, Math.floor(Math.min(100, interna / Math.max(maior, 0.01), ((alto - 2 * pad) * 0.62) / (linhas.length * 1.06))));
  } else {
    const e = encaixar(b.texto ?? "", { largura: interna, altura: disponivel, max: 104, min: 52, linhas: 4, fonte: F_TITULO, entrelinha: 1.06 });
    linhas = e.linhas;
    tam = e.tamanho;
  }
  const em = b.em ?? janela.de + 0.1;
  const pDesenho = prog(t, janela.de, 0.7);
  const pCheio = prog(t, em + 0.15, 0.45);
  const salto = 1 + 0.08 * Math.sin(Math.PI * prog(t, em + 0.15, 0.35));
  const icone = b.icone ?? "salvar";
  return (
    <div style={{ position: "absolute", left: pad, top: pad, width: interna, height: alto - 2 * pad, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ scale: String(salto), transformOrigin: "left top", translate: `0 ${mistura(-12, 0, pDesenho)}px` }}>
        <Icone nome={icone} tamanho={tamIcone} cor={pal.traco} p={pDesenho} peso={6.5} cheio={icone === "link" ? 0 : pCheio} corCheio={pal.traco} />
      </div>
      <TextoFalado
        linhas={linhas}
        t={t}
        palavras={palavras}
        janela={janela}
        inicio={b.em}
        tamanho={tam}
        cor={pal.texto}
        corEnfase={pal.acento}
        enfase={b.destaque}
        estilo={{ fontFamily: display, fontWeight: 700, letterSpacing: "-0.02em" }}
      />
    </div>
  );
};
