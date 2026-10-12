// Colagem (a assinatura do fechamento): a foto da pessoa vira uma impressão levemente girada
// (Edicao.tsx) e os itens se juntam em volta, como recortes numa página de revista: amostras de
// tecido emolduradas, o recorte do detalhe num círculo, ou o nome do item escrito no recorte
// (qualquer assunto: "O mercado", "Os riscos"…). O título se monta palavra por palavra.
// No 16:9 a página é recomposta em fileira: o título na coluna da esquerda, a impressão no meio e
// os recortes em volta dela, para a direita.
import { mix, prog, saida, Sobe } from "../anim";
import type { Colagem, Peca, Plano } from "../plano";
import { separar, temposDoTexto } from "../palavras";
import { resolverPonto } from "../pessoa";
import { BASE_CARTAO, corDe, cor, MARGEM, rotulo, serifa } from "../tema";
import { encaixar, quebrar, umaLinha } from "../medida";
import { marcarTrecho } from "./comum";
import { Amostra } from "./Amostra";
import { Detalhe } from "./Detalhe";

type Lugar = { x: number; y: number; w: number; h: number; rot: number; de: { x: number; y: number } };

// lugares dos recortes em volta da impressão (px lógicos; a impressão fica em x 1000–1620,
// y 196–1056, pessoa.ts): três à direita dela, um embaixo e o círculo encostado no canto de baixo
// à esquerda. Nada passa da base da página (acima dos controles do player) nem da margem direita.
const RETANGULOS: Lugar[] = [
  { x: 1560, y: 214, w: 350, h: 256, rot: 3.5, de: { x: 260, y: -80 } },
  { x: 1600, y: 548, w: 330, h: 250, rot: -3, de: { x: 260, y: 0 } },
  { x: 1520, y: 878, w: 520, h: 214, rot: 1.6, de: { x: 0, y: 260 } },
  { x: 1950, y: 330, w: 280, h: 200, rot: -2.5, de: { x: 260, y: -60 } },
];
// (a legenda do círculo fica abaixo da borda da impressão, nunca por cima dela)
const CIRCULO: Lugar = { x: 830, y: 770, w: 300, h: 300, rot: 0, de: { x: -260, y: 0 } };
// a coluna do título, à esquerda da impressão e do círculo
const COLUNA_TITULO = { x: MARGEM, w: CIRCULO.x - 44 - MARGEM };
// o meio da impressão (o título fica centrado na altura dela)
const MEIO_DA_IMPRESSAO = 196 + 860 / 2;
const BORDA = 14;

// Recorte com o nome do item escrito (item sem amostra nem recorte do vídeo): papel areia,
// numeral índigo pequeno e o nome em itálico, que sobe quando o recorte chega.
const RecorteDeTexto: React.FC<{ nome: string; numero: number; w: number; h: number; p: number }> = ({ nome, numero, w, h, p }) => {
  const e = encaixar(nome, { largura: w - 44, max: 74, min: 40, linhas: h > 200 ? 3 : 2, estilo: "italico", entrelinha: 1.08 });
  return (
    <div style={{ position: "relative", width: w, height: h, background: cor.papel }}>
      <div style={{ position: "absolute", left: 20, top: 14, ...rotulo, fontSize: 30, letterSpacing: "0.12em", color: cor.indigo }}>{String(numero).padStart(2, "0")}</div>
      <div style={{ position: "absolute", left: 22, right: 22, top: 50, bottom: 10, display: "flex", flexDirection: "column", justifyContent: "center", fontFamily: serifa, fontStyle: "italic", fontSize: e.tamanho, lineHeight: 1.08, color: cor.tinta, whiteSpace: "nowrap" }}>
        {e.linhas.map((l, i) => (
          <Sobe key={i} p={p}>
            {l}
          </Sobe>
        ))}
      </div>
    </div>
  );
};
const LEGENDA = 54;

export const ColagemDoLook: React.FC<{ m: Colagem; t: number; plano: Plano; fim: number; id: string; camada: "papel" | "sobre" }> = ({ m, t, plano, fim, id, camada }) => {
  const fora = saida(t, fim);
  const pecas = plano.momentos.filter((x): x is Peca => x.tipo === "peca");

  // distribui os itens: o que tem detalhe (e não tem amostra) vai para o círculo
  let r = 0;
  let circuloUsado = false;
  const itens = m.itens.map((item) => {
    const peca = item.peca !== undefined ? pecas.find((p) => p.numero === item.peca) : undefined;
    const nome = item.nome ?? peca?.nome ?? "";
    // no recorte de texto vai o nome completo do item (com o complemento)
    const nomeCompleto = item.nome ?? (peca ? [peca.nome, peca.complemento].filter(Boolean).join(" ") : "");
    const amostra = item.cor ? { cor: item.cor, tecido: item.tecido } : peca?.amostra;
    const detalhe = !amostra && peca?.detalhe ? peca.detalhe : undefined;
    let lugar: Lugar;
    if (detalhe && !circuloUsado) {
      lugar = CIRCULO;
      circuloUsado = true;
    } else lugar = RETANGULOS[r++ % RETANGULOS.length];
    return { item, peca, nome, nomeCompleto, amostra, detalhe, lugar };
  });

  const palavras = separar(m.titulo);
  const doSub = m.subtitulo ? separar(m.subtitulo) : [];
  const todos = temposDoTexto([...doSub, ...palavras], plano, m.em ?? m.de, m.ate + 0.3);
  const temposSub = todos.slice(0, doSub.length);
  const tempos = todos.slice(doSub.length);
  const enfase = marcarTrecho(palavras, m.enfase);
  // título: uma linha grande (até 150 px); longo demais, duas linhas; o subtítulo fica acima
  const LARG = COLUNA_TITULO.w;
  let tamTitulo = Math.min(Math.min(150, Math.floor(LARG / (m.titulo.length * 0.47))), umaLinha(m.titulo, LARG, 150, 84, { estilo: "serifa" }));
  let linhasTitulo = [palavras];
  if (umaLinha(m.titulo, LARG, 150, 84, { estilo: "serifa" }) <= 84) {
    const e = encaixar(m.titulo, { largura: LARG, max: 110, min: 64, linhas: 2, estilo: "serifa", entrelinha: 1.05 });
    tamTitulo = e.tamanho;
    linhasTitulo = e.linhas.map(separar);
  }
  const tamSub = doSub.length ? umaLinha(m.subtitulo!, LARG, 62, 44, { estilo: "italico" }) : 0;
  const alturaTitulo = linhasTitulo.length * tamTitulo * 1.05;
  // subtítulo e título centrados na altura da impressão, sem passar da base da página
  // (subtítulo longo para a coluna: quebra em mais de uma linha, nunca vaza)
  const linhasSub = doSub.length ? quebrar(m.subtitulo!, LARG, tamSub, { estilo: "italico" }).length : 0;
  const alturaSub = linhasSub * tamSub * 1.1;
  const topoTitulo = Math.min(BASE_CARTAO - alturaTitulo, MEIO_DA_IMPRESSAO - (alturaTitulo + alturaSub) / 2 + alturaSub);
  const topoSub = topoTitulo - alturaSub;

  return (
    <>
      {camada === (t > m.ate ? "papel" : "sobre") ? itens.map(({ item, peca, nome, nomeCompleto, amostra, detalhe, lugar }, i) => {
        const p = prog(t, item.em - 0.04, 0.6);
        const redondo = lugar === CIRCULO;
        const dx = (1 - p) * lugar.de.x;
        const dy = (1 - p) * lugar.de.y + fora * 40;
        const rot = lugar.rot + (1 - p) * (lugar.rot >= 0 ? 7 : -7);
        const numero = peca?.numero ? `${String(peca.numero).padStart(2, "0")} · ` : "";
        const corpoW = lugar.w - BORDA * 2;
        const corpoH = lugar.h - BORDA - LEGENDA;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: lugar.x,
              top: lugar.y,
              width: lugar.w,
              height: redondo ? lugar.h + LEGENDA : lugar.h,
              translate: `${dx}px ${dy}px`,
              rotate: `${rot}deg`,
              opacity: Math.min(1, p * 1.8) * (1 - fora),
            }}
          >
            {redondo && detalhe ? (
              <>
                <div style={{ position: "absolute", left: 0, top: 0, width: lugar.w, height: lugar.h, borderRadius: "50%", background: cor.folha, boxShadow: "0 18px 40px rgba(30,24,16,0.22)" }} />
                <Detalhe
                  plano={plano}
                  ponto={resolverPonto(detalhe.ponto, plano, "pulsoDir")}
                  em={item.em - 0.2}
                  de={item.em - 0.8}
                  t={t}
                  x={BORDA}
                  y={BORDA}
                  w={lugar.w - BORDA * 2}
                  h={lugar.h - BORDA * 2}
                  zoom={(detalhe.zoom ?? 3.2) * 0.85}
                  fora={0}
                  redondo
                />
                <div style={{ position: "absolute", left: 0, right: 0, top: lugar.h + 14, textAlign: "center", ...rotulo, letterSpacing: "0.12em", color: cor.tinta }}>
                  {numero}
                  {nome}
                </div>
              </>
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: cor.folha,
                  padding: BORDA,
                  boxSizing: "border-box",
                  boxShadow: "0 18px 40px rgba(30,24,16,0.22), 0 2px 5px rgba(30,24,16,0.12)",
                }}
              >
                {amostra ? (
                  <Amostra id={`${id}-item-${i}`} w={corpoW} h={corpoH} base={corDe(amostra.cor)} tecido={amostra.tecido} p={prog(t, item.em + 0.05, 0.5)} />
                ) : detalhe ? (
                  <div style={{ position: "relative", width: corpoW, height: corpoH }}>
                    <Detalhe plano={plano} ponto={resolverPonto(detalhe.ponto, plano, "pulsoDir")} em={item.em - 0.2} de={item.em - 0.8} t={t} x={0} y={0} w={corpoW} h={corpoH} zoom={detalhe.zoom} fora={0} />
                  </div>
                ) : (
                  <RecorteDeTexto nome={nomeCompleto} numero={peca?.numero ?? i + 1} w={corpoW} h={lugar.h - BORDA * 2} p={prog(t, item.em + 0.05, 0.45)} />
                )}
                {amostra || detalhe ? (
                  <div style={{ ...rotulo, letterSpacing: "0.12em", color: cor.tinta, marginTop: 12, whiteSpace: "nowrap", overflow: "hidden" }}>
                    {numero}
                    {nome}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      }) : null}

      {/* linha de cima e título que se montam embaixo */}
      {camada === "papel" ? (
      <>
      {doSub.length ? (
        <div
          style={{
            position: "absolute",
            left: COLUNA_TITULO.x,
            width: COLUNA_TITULO.w,
            top: topoSub,
            display: "flex",
            flexWrap: "wrap",
            fontFamily: serifa,
            fontStyle: "italic",
            fontSize: tamSub,
            lineHeight: 1.1,
            color: cor.grafite,
            opacity: prog(t, m.de + 0.15, 0.4) * (1 - fora),
          }}
        >
          {doSub.map((w, i) => {
            const p = prog(t, temposSub[i] - 0.05, 0.3);
            return (
              <span key={i} style={{ marginRight: i < doSub.length - 1 ? "0.24em" : 0, color: p > 0.35 ? cor.grafite : cor.lapisClaro, translate: p >= 1 ? undefined : `0 ${mix(0.06, 0, p)}em` }}>
                {w}
              </span>
            );
          })}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: COLUNA_TITULO.x,
          width: COLUNA_TITULO.w,
          top: topoTitulo,
          fontFamily: serifa,
          fontSize: tamTitulo,
          lineHeight: 1.05,
          color: cor.tinta,
          opacity: prog(t, m.de + 0.2, 0.4) * (1 - fora),
        }}
      >
        {(() => {
          let k = 0;
          return linhasTitulo.map((ws, li) => (
            <div key={li} style={{ display: "flex", whiteSpace: "nowrap" }}>
              {ws.map((w, j) => {
                const idx = k++;
                const destaque = enfase.has(idx);
                const p = prog(t, tempos[idx] - 0.05, 0.3);
                return (
                  <span key={j} style={{ position: "relative", marginRight: j < ws.length - 1 ? "0.24em" : 0 }}>
                    <span
                      style={{
                        display: "inline-block",
                        fontStyle: destaque ? "italic" : "normal",
                        color: p > 0.35 ? (destaque ? cor.indigo : cor.tinta) : cor.lapisClaro,
                        translate: p >= 1 ? undefined : `0 ${mix(0.06, 0, p)}em`,
                      }}
                    >
                      {w}
                    </span>
                    {destaque ? (
                      <span style={{ position: "absolute", left: 0, bottom: "0.04em", height: 6, width: `${prog(t, tempos[idx] + 0.2, 0.5) * 100}%`, background: cor.indigo }} />
                    ) : null}
                  </span>
                );
              })}
            </div>
          ));
        })()}
      </div>
      </>
      ) : null}
    </>
  );
};
