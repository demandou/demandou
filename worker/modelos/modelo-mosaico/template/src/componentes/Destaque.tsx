import { prog, temposDoTexto } from "../anim";
import { encaixar } from "../medida";
import type { Destaque as TDestaque } from "../plano";
import { display, sans } from "../tema";
import { F_APOIO, F_NUMERO, respiro, TextoFalado, type PropsBloco } from "./comum";
import { Icone } from "./Icones";

// Destaque: a palavra ou frase curta que bate forte, num ladrilho chapado (gema = chave, tomate = alerta).
// O ícone se desenha no canto (alerta ou chave), o texto entra palavra por palavra em Bricolage 800 e,
// dito o texto, uma barra de base cresce embaixo dele; o `detalhe` entra depois, menor.
export const Destaque: React.FC<PropsBloco<TDestaque>> = ({ b, t, w, h, util, pal, palavras, janela }) => {
  const pad = respiro(w, h);
  const alto = Math.min(h, util);
  const interna = w - 2 * pad;
  const icone = b.nivel === "alerta" ? "alerta" : b.nivel === "chave" ? "chave" : null;
  const tamIcone = icone ? Math.min(118, alto * 0.16, w * 0.2) : 0;
  const det = b.detalhe ? encaixar(b.detalhe, { largura: interna, max: 48, min: 38, linhas: 2, fonte: F_APOIO, entrelinha: 1.15, equilibrado: false }) : null;
  const altDet = det ? det.altura + 28 : 0;
  const disponivel = alto - 2 * pad - (tamIcone ? tamIcone + 30 : 0) - altDet - 30;
  const tx = encaixar(b.texto, { largura: interna, altura: disponivel, max: 156, min: 56, linhas: 4, fonte: F_NUMERO, entrelinha: 1.02 });
  const tempos = temposDoTexto(b.texto, palavras, b.em - 0.05, janela.ate);
  const fimTexto = (tempos[tempos.length - 1] ?? b.em) + 0.35;
  const pBarra = prog(t, fimTexto, 0.6);
  const pIcone = prog(t, b.em - 0.1, 0.7);
  const detalheEm = b.detalheEm ?? fimTexto + 0.2;
  const pDet = prog(t, detalheEm, 0.45);
  const larguraUltima = tx.largura;
  return (
    <div style={{ position: "absolute", left: pad, top: pad, width: interna, height: alto - 2 * pad, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ height: tamIcone }}>{icone ? <Icone nome={icone} tamanho={tamIcone} cor={pal.traco} p={pIcone} peso={6.5} /> : null}</div>
      <div>
        <TextoFalado
          linhas={tx.linhas}
          t={t}
          palavras={palavras}
          janela={janela}
          inicio={b.em - 0.05}
          tamanho={tx.tamanho}
          cor={pal.texto}
          entrelinha={1.02}
          estilo={{ fontFamily: display, fontWeight: 800, letterSpacing: "-0.035em" }}
        />
        <div style={{ marginTop: tx.tamanho * 0.14, height: Math.max(8, tx.tamanho * 0.09), width: larguraUltima * pBarra, background: pal.acento, borderRadius: 4 }} />
        {det ? (
          <div style={{ marginTop: 28, fontFamily: sans, fontWeight: 600, fontSize: det.tamanho, lineHeight: 1.15, color: pal.suave, opacity: pDet, translate: pDet < 0.999 ? `0 ${(1 - pDet) * 12}px` : undefined }}>
            {det.linhas.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
