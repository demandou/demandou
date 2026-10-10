import { prog } from "../anim";
import { encaixar } from "../medida";
import type { Selo as TSelo } from "../plano";
import { display, sans } from "../tema";
import { F_APOIO, F_TITULO, respiro, TextoFalado, type PropsBloco } from "./comum";
import { Icone } from "./Icones";

// Selo de referência: ícone numa peça redonda, título falado e uma linha de apoio (também falada).
export const Selo: React.FC<PropsBloco<TSelo>> = ({ b, t, w, h, util, pal, palavras, janela }) => {
  const pad = respiro(w, h);
  const alto = Math.min(h, util);
  const largo = w > alto * 1.5;
  const disponivel = alto - 2 * pad;
  let tamIcone = b.icone ? Math.min(largo ? alto * 0.5 : w * 0.3, 190) : 0;
  const largTexto = largo ? w - 2 * pad - (tamIcone ? tamIcone + 44 : 0) : w - 2 * pad;
  // bloco grande (o selo é o bloco principal da página): título e apoio maiores
  const grande = w >= 900 && alto >= 600;
  const medirTexto = (altura: number) => (b.texto ? encaixar(b.texto, { largura: largTexto, altura, max: grande ? 60 : 46, min: 36, linhas: 3, fonte: F_APOIO, entrelinha: 1.18, equilibrado: false }) : null);
  let apoio = medirTexto(disponivel * 0.45);
  const altApoio = () => (apoio ? 24 + apoio.altura : 0);
  const medirTitulo = () => encaixar(b.titulo, { largura: largTexto, altura: disponivel - altApoio() - (largo || !tamIcone ? 0 : tamIcone + 36), max: grande ? 136 : 104, min: 56, linhas: 3, fonte: F_TITULO, entrelinha: 1.04 });
  let tit = medirTitulo();
  // empilhado: se não couber, tira o ícone
  if (!largo && tamIcone && (tamIcone + 36 + tit.altura + altApoio() > disponivel || tit.tamanho < 64)) {
    tamIcone = 0;
    tit = medirTitulo();
    apoio = medirTexto(disponivel - tit.altura - 24);
  }
  const pIcone = prog(t, janela.de + 0.1, 0.8);
  const icone = b.icone && tamIcone ? (
    <div
      style={{
        width: tamIcone,
        height: tamIcone,
        borderRadius: tamIcone / 2,
        background: pal.acento,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        scale: String(0.7 + 0.3 * prog(t, janela.de, 0.5)),
        opacity: prog(t, janela.de, 0.3),
      }}
    >
      <Icone nome={b.icone} tamanho={tamIcone * 0.58} cor={pal.fundo} p={pIcone} peso={6} />
    </div>
  ) : null;
  const textos = (
    <div style={{ width: largTexto, display: "flex", flexDirection: "column", gap: 24 }}>
      <TextoFalado
        linhas={tit.linhas}
        t={t}
        palavras={palavras}
        janela={janela}
        tamanho={tit.tamanho}
        cor={pal.texto}
        estilo={{ fontFamily: display, fontWeight: 700, letterSpacing: "-0.02em" }}
      />
      {apoio && apoio.linhas.length ? (
        <TextoFalado
          linhas={apoio.linhas}
          t={t}
          palavras={palavras}
          janela={janela}
          tamanho={apoio.tamanho}
          cor={pal.suave}
          estilo={{ fontFamily: sans, fontWeight: 600, lineHeight: 1.18 }}
          entrelinha={1.18}
          entrada={0.35}
        />
      ) : null}
    </div>
  );
  return (
    <div
      style={{
        position: "absolute",
        left: pad,
        top: pad,
        width: w - 2 * pad,
        height: alto - 2 * pad,
        display: "flex",
        flexDirection: largo ? "row" : "column",
        alignItems: largo ? "center" : "flex-start",
        justifyContent: largo ? "flex-start" : "center",
        gap: largo ? 44 : 36,
      }}
    >
      {icone}
      {textos}
    </div>
  );
};
