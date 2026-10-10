// A assinatura: o VERSÍCULO (ou citação). A página fica cheia (a pessoa vai para o medalhão de baixo)
// e o texto inteiro já está nela "a lápis"; cada palavra ganha tinta quando é dita. A palavra-chave
// acende. No alto, a chamada em versalete ("Está escrito"); embaixo, a referência em versalete que se
// monta na fala ("Mateus" → "11" → ":28"). Modos: escritura (capitular), livro e autor (aspas +
// travessão), reflexão (sem fonte: um ornamento fecha o texto).
import { abrir, abrirEm, prog, suave, temposDoTexto, tinta } from "../anim";
import type { Area } from "../layout";
import { encaixar, larguraPalavra, trechoNoTexto } from "../medida";
import type { Plano, Versiculo as TVersiculo } from "../plano";
import { cor, serif } from "../tema";
import { alturaDe, capitularDe, Escrita, larguraVersalete, Ornamento, Versalete } from "./Escrita";

const ENTRE = 1.22;

// junta as partes da referência ("Mateus", "11", ":28" → "Mateus 11:28")
const juntar = (partes: string[]) => partes.reduce((s, p, i) => (i === 0 ? p : /^[:.,;)]/.test(p) ? s + p : `${s} ${p}`), "");

export const modoDo = (m: TVersiculo) => m.modo ?? (m.referencia || m.referenciaPartes?.length ? "escritura" : "reflexao");

export const Versiculo: React.FC<{ t: number; plano: Plano; m: TVersiculo; area: Area }> = ({ t, plano, m, area }) => {
  const modo = modoDo(m);
  const em = m.em ?? m.de;
  const palavras = m.texto.trim().split(/\s+/);
  const tempos = abrir(temposDoTexto(m.texto, em, plano.palavras, m.ate), area.abre && !m.chamada);
  const ultimo = tempos[tempos.length - 1] ?? em;

  // a capitular (só na escritura, e se a primeira palavra tiver mais de uma letra)
  const primeira = palavras[0] ?? "";
  const capLetra = modo === "escritura" && /^\p{L}{2,}/u.test(primeira) ? [...primeira][0] : undefined;
  const textoMedido = capLetra ? [primeira.slice(capLetra.length), ...palavras.slice(1)].join(" ") : m.texto;

  // partes da referência
  const partes = m.referenciaPartes?.length
    ? m.referenciaPartes
    : m.referencia
      ? [{ texto: m.referencia, em: m.referenciaEm ?? ultimo + 0.5 }]
      : [];
  const referencia = juntar(partes.map((p) => p.texto));
  const temFonte = modo !== "reflexao" && (referencia || m.obra);

  // alturas: chamada, texto, referência
  const W = area.w;
  const altChamada = m.chamada ? 104 : 0;
  const tamRef = referencia ? Math.min(50, Math.max(30, Math.floor(50 * Math.min(1, (W - 40) / Math.max(1, larguraVersalete(referencia, 50)))))) : 0;
  const altObra = m.obra ? 64 : 0;
  const altFonte = temFonte ? 70 + (referencia ? tamRef * 1.3 : 0) + altObra : modo === "reflexao" ? 70 : 0;
  const altAspas = modo === "livro" || modo === "autor" ? 96 : 0;
  const altTexto = area.base - area.y - altChamada - altFonte - altAspas - 20;
  const fonte = { familia: "serif" as const, peso: 500, italico: modo === "reflexao" };
  const recuo = capLetra ? { linhas: 2, porCorpo: capitularDe(capLetra, 1, ENTRE, fonte).largura } : undefined;
  const enc = encaixar(textoMedido, {
    largura: W,
    max: 108,
    min: 56,
    linhas: 8,
    altura: altTexto,
    entrelinha: ENTRE,
    fonte,
    equilibrar: !capLetra,
    frases: false,
    recuo,
  });
  // com a capitular, o recuo real depende do corpo escolhido
  const encFinal = capLetra
    ? encaixar(textoMedido, { largura: W, max: enc.tamanho, min: enc.tamanho, linhas: 9, entrelinha: ENTRE, fonte, frases: false, recuo: { linhas: 2, porCorpo: capitularDe(capLetra, enc.tamanho, ENTRE, fonte).largura / enc.tamanho } })
    : enc;
  const hTexto = alturaDe(encFinal, ENTRE);
  const total = altChamada + altAspas + hTexto + altFonte;
  const y0 = area.y + Math.max(0, (area.base - area.y - total) / 2);
  const yTexto = y0 + altChamada + altAspas;

  // a palavra que acende
  const trecho = trechoNoTexto(m.texto, m.destaque);
  const luzEm = m.destaqueEm ?? (trecho ? tempos[trecho[0]] : 0);

  // a página entra inteira a lápis logo que vira (o texto "já está escrito")
  const lapisP = area.abre ? 1 : prog(t, m.de + 0.15, 0.6, suave);
  const yFonte = yTexto + hTexto + 34;
  const chamadaEm = abrirEm(m.chamadaEm ?? m.de + 0.1, area.abre);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 }}>
      {m.chamada ? (
        <>
          <div style={{ position: "absolute", left: area.x, width: W, top: y0, textAlign: "center", ...tinta(t, chamadaEm, 0.5, 8) }}>
            <Versalete texto={m.chamada} tamanho={Math.min(44, Math.floor(44 * Math.min(1, (W - 40) / Math.max(1, larguraVersalete(m.chamada, 44)))))} />
          </div>
          <Ornamento t={t} em={chamadaEm + 0.15} cx={area.x + W / 2} y={y0 + 70} largura={420} />
        </>
      ) : null}
      {altAspas ? (
        <div
          style={{
            position: "absolute",
            left: area.x,
            width: W,
            top: y0 + altChamada - 30,
            textAlign: "center",
            fontFamily: serif,
            fontWeight: 500,
            fontSize: 200,
            lineHeight: "200px",
            height: 130,
            color: cor.oliva,
            ...tinta(t, em - 0.1, 0.5, 6),
          }}
        >
          “
        </div>
      ) : null}
      <div style={{ opacity: Math.max(lapisP, t >= em ? 1 : 0) }}>
        <Escrita
          t={t}
          encaixe={encFinal}
          tempos={tempos}
          x={area.x}
          y={yTexto}
          largura={W}
          fonte={fonte}
          alinhar={capLetra ? "left" : "center"}
          entrelinha={ENTRE}
          luz={trecho ? { trecho, em: luzEm } : null}
          lapis
          capitular={capLetra}
          dur={0.5}
        />
      </div>
      {temFonte ? (
        <>
          <Ornamento t={t} em={partes[0]?.em ?? m.obraEm ?? ultimo + 0.3} cx={area.x + W / 2} y={yFonte} largura={300} />
          {referencia ? (
            <div style={{ position: "absolute", left: area.x, width: W, top: yFonte + 34, display: "flex", justifyContent: "center" }}>
              {modo !== "escritura" ? <span style={{ ...tinta(t, partes[0]?.em ?? 0, 0.5, 6), fontFamily: serif, fontSize: tamRef, color: cor.oliva, marginRight: 14 }}>—</span> : null}
              {partes.map((p, i) => {
                const texto = i === 0 || /^[:.,;)]/.test(p.texto) ? p.texto : ` ${p.texto}`;
                return (
                  <span key={i} style={{ display: "inline-block", ...tinta(t, p.em, 0.5, 8) }}>
                    <Versalete texto={texto} tamanho={tamRef} peso={600} espacamento={0.06} />
                  </span>
                );
              })}
            </div>
          ) : null}
          {m.obra ? (
            <div
              style={{
                position: "absolute",
                left: area.x,
                width: W,
                top: yFonte + 34 + (referencia ? tamRef * 1.3 : 0) + 6,
                textAlign: "center",
                fontFamily: serif,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: Math.min(44, Math.floor(44 * Math.min(1, (W - 40) / Math.max(1, larguraPalavra(m.obra, 44, { italico: true, peso: 500 }))))),
                color: cor.tintaSuave,
                whiteSpace: "nowrap",
                ...tinta(t, m.obraEm ?? partes[partes.length - 1]?.em ?? ultimo + 0.3, 0.5, 6),
              }}
            >
              {m.obra}
            </div>
          ) : null}
        </>
      ) : modo === "reflexao" ? (
        <Ornamento t={t} em={ultimo + 0.25} cx={area.x + W / 2} y={yFonte + 6} largura={360} />
      ) : null}
    </div>
  );
};
