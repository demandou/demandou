// Remissão ("ver também"): a palavra certa para a ideia, com o desenho que se faz em tinta ameixa.
// O letreiro (fala) bate palavra por palavra; a palavra-título entra no instante em que é dita.
import { impressao, temposDoTexto, TextoFalado } from "../anim";
import { encaixar } from "../medida";
import { LinhasFaladas } from "./Texto";
import type { Areas } from "../layout";
import type { Palavra, Remissao as RemissaoT } from "../plano";
import { caber, cor, serif } from "../tema";
import { FIGURAS } from "./Figuras";
import { ColunaDeVizinhos, vizinhosQueCabem } from "./Pagina";
import { alturaDaPronuncia, PalavraTituloAnimada, Pronuncia } from "./Verbete";
import { quebrarPalavra, silabasDe } from "../anim";

// Lacunas a lápis (uma por sílaba, com o ponto entre elas): a palavra que ainda vai ser dita
// (numa expressão, a sílaba que fecha uma palavra termina em espaço: ali vai um vão, não o ponto)
export const Lacunas: React.FC<{ silabas: string[]; corpo: number }> = ({ silabas, corpo }) => (
  <div style={{ position: "absolute", left: 0, top: 0, height: corpo, display: "flex", alignItems: "flex-end", gap: corpo * 0.18 }}>
    {silabas.map((s, i) => (
      <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: corpo * 0.18, marginRight: s.endsWith(" ") ? corpo * 0.2 : 0 }}>
        <div style={{ width: Math.max(1.6, s.trimEnd().length) * corpo * 0.5, borderBottom: `5px dashed ${cor.lapis}`, marginBottom: corpo * 0.12 }} />
        {i < silabas.length - 1 && !s.endsWith(" ") ? <div style={{ fontFamily: serif, fontSize: corpo, lineHeight: 1, color: cor.lapis }}>·</div> : null}
      </div>
    ))}
  </div>
);

const Seta: React.FC<{ t: number; em: number }> = ({ t, em }) => (
  <span style={{ fontFamily: serif, fontWeight: 700, color: cor.ameixa, marginRight: 14, ...impressao(t, em) }}>→</span>
);

export const Remissao: React.FC<{ m: RemissaoT; t: number; areas: Areas; palavras: Palavra[] }> = ({ m, t, areas, palavras }) => {
  const R = areas.conteudo;
  const rotuloEm = m.rotulo?.em ?? m.de;
  const tempos = m.rotulo ? temposDoTexto(m.rotulo.texto, palavras, m.de, m.ate, rotuloEm) : [];
  const Desenho = m.figura ? FIGURAS[m.figura.nome] : null;
  const pron = m.pronuncia;

  const Letreiro = m.rotulo ? (
    <div style={{ display: "flex", alignItems: "baseline", fontFamily: serif, fontStyle: "italic", fontSize: 50, lineHeight: 1.15, color: cor.tinta }}>
      <Seta t={t} em={rotuloEm} />
      <TextoFalado texto={m.rotulo.texto} tempos={tempos} t={t} style={{ flex: 1 }} />
    </div>
  ) : null;

  const corpoDefinicao = (largura: number) => (m.definicao ? caber(m.definicao.texto, largura, 54, 0.5, 44) : 0);
  const Definicao = (largura: number) =>
    m.definicao ? (
      <div style={{ fontFamily: serif, fontSize: corpoDefinicao(largura), lineHeight: 1.15, color: cor.tinta, ...impressao(t, m.definicao.em) }}>{m.definicao.texto}</div>
    ) : null;

  if (areas.largo) {
    const lado = Math.min(R.h - 20, 420);
    const xTexto = R.x + (Desenho ? lado + 36 : 0);
    const wTexto = R.w - (Desenho ? lado + 36 : 0);
    return (
      <>
        {areas.vizinhos ? <ColunaDeVizinhos regiao={areas.vizinhos} lista={m.vizinhos?.antes} doFim fala={{ palavras, de: m.de, ate: m.ate, t }} /> : null}
        {Desenho && m.figura ? (
          <div style={{ position: "absolute", left: R.x, top: R.y + (R.h - lado) / 2 }}>
            <Desenho t={t} em={m.figura.em} cor={cor.ameixa} tamanho={lado} />
          </div>
        ) : null}
        <div style={{ position: "absolute", left: xTexto, top: R.y, width: wTexto, height: R.h, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
          {Letreiro}
          <div style={{ position: "relative" }}>
            {t < m.palavra.em - 0.02 ? <Lacunas silabas={silabasDe(m.palavra.texto, m.palavra.silabas)} corpo={quebrarPalavra(silabasDe(m.palavra.texto, m.palavra.silabas), wTexto, 124, 1).corpo} /> : null}
            <PalavraTituloAnimada p={m.palavra} t={t} largura={wTexto} maximo={124} maxLinhas={1} />
          </div>
          {pron || m.classe ? <Pronuncia texto={pron ?? ""} t={t} em={m.palavra.em + 0.36} corpo={44} classe={m.classe} largura={wTexto} /> : null}
          {m.definicao ? (
            // a definição se escreve palavra por palavra na fala (cada item no seu instante)
            (() => {
              const d = m.definicao;
              const e = encaixar(d.texto, { largura: wTexto, max: 58, min: 44, linhas: 2, fonte: { familia: "serif", peso: 400 } });
              return (
                <LinhasFaladas
                  linhas={e.linhas}
                  corpo={e.corpo}
                  entrelinha={1.15}
                  fonte={{ familia: "serif", peso: 400 }}
                  tempos={temposDoTexto(e.linhas.join(" "), palavras, d.em - 0.2, m.ate, d.em)}
                  t={t}
                />
              );
            })()
          ) : null}
        </div>
      </>
    );
  }

  // coluna: vizinhos, letreiro, desenho, palavra, pronúncia, definição, vizinhos
  const silabas = silabasDe(m.palavra.texto, m.palavra.silabas);
  const { corpo, linhas } = quebrarPalavra(silabas, R.w, 124, 2);
  const lado = Desenho ? Math.min(R.w, 440) : 0;
  const alturaPron = alturaDaPronuncia(m.classe, pron, R.w, 42);
  const alturaEntrada = (m.rotulo ? 120 : 0) + (Desenho ? lado + 20 : 0) + linhas.length * corpo * 1.04 + 14 + alturaPron + (m.definicao ? 80 : 0);
  const sobra = Math.max(0, R.h - alturaEntrada);
  const listaAntes = m.vizinhos?.antes;
  const antes = listaAntes?.length ? vizinhosQueCabem(listaAntes, R.w, sobra * 0.6, true) : { lista: [], altura: Math.floor((sobra * 0.5) / 46) * 46 };
  const y0 = R.y + antes.altura + (antes.altura > 0 ? 16 : 0);
  const fimEntrada = y0 + alturaEntrada;
  return (
    <>
      {antes.altura > 0 ? <ColunaDeVizinhos regiao={{ x: R.x, y: R.y, w: R.w, h: antes.altura }} lista={antes.lista} doFim /> : null}
      <div style={{ position: "absolute", left: R.x, top: y0, width: R.w, display: "flex", flexDirection: "column", gap: 0 }}>
        {m.rotulo ? <div style={{ height: 120, display: "flex", alignItems: "flex-start" }}>{Letreiro}</div> : null}
        {Desenho && m.figura ? (
          <div style={{ height: lado + 20, display: "flex", justifyContent: "center" }}>
            <Desenho t={t} em={m.figura.em} cor={cor.ameixa} tamanho={lado} />
          </div>
        ) : null}
        <div style={{ position: "relative" }}>
          {/* lugar da palavra, a lápis, até ela ser dita: uma lacuna por sílaba */}
          {t < m.palavra.em - 0.02 ? <Lacunas silabas={silabas} corpo={corpo} /> : null}
          <PalavraTituloAnimada p={m.palavra} t={t} largura={R.w} maximo={124} maxLinhas={2} />
        </div>
        <div style={{ height: 14 }} />
        {pron || m.classe ? (
          <div style={{ height: alturaPron }}>
            <Pronuncia texto={pron ?? ""} t={t} em={m.palavra.em + 0.36} corpo={42} classe={m.classe} largura={R.w} />
          </div>
        ) : null}
        {m.definicao ? <div style={{ height: 80 }}>{Definicao(R.w)}</div> : null}
      </div>
      {R.y + R.h - fimEntrada > 80 ? (
        <ColunaDeVizinhos regiao={{ x: R.x, y: fimEntrada + 24, w: R.w, h: R.y + R.h - fimEntrada - 24 }} lista={m.vizinhos?.depois} />
      ) : null}
    </>
  );
};
