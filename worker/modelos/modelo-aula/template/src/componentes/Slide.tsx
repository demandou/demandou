// O MODO SLIDE, a assinatura da Aula: a folha branca ocupa ~62% da tela e se monta na fala; o
// professor fica na janela ao lado (Edicao.tsx). Aqui ficam:
// - as páginas: a folha com sombra e a troca entre slides (a página nova cobre a anterior,
//   entrando da direita, opaca, com o fio violeta na borda — nunca duas páginas transparentes);
// - o cabeçalho do slide (sobretítulo + título palavra por palavra com o marca-texto);
// - o conteúdo de cada bloco: `slide` (itens, fórmula termo a termo, resumo), `topicos`, `passos`,
//   `numero`, `comparacao`, `definicao` e `pergunta` (o `grafico` está em Grafico.tsx).
import { Fragment } from "react";
import { encaixar, larguraTexto } from "../medida";
import { paginasEm } from "../modo";
import type { Comparacao as TComparacao, Definicao as TDefinicao, Item, Momento, Numero as TNumero, Pergunta as TPergunta, Plano, Slide as TSlide, TermoDaFormula } from "../plano";
import { COR, FONTE, MATEMATICA, PAD, RAIO, SLIDE_W, SLIDE_Y, SOMBRA, formatar, prog, slideH, slideX, suave } from "../tema";
import { UTIL, cabecalho } from "./Folha";
import { Grafico } from "./Grafico";
import { Icone, Selo, Sobretitulo, Visto } from "./Pecas";
import { TextoFalado, disporTexto } from "./Texto";


// ——— as páginas ———
// A folha fica parada; o conteúdo entra no lugar (aparece e sobe 12 px em 0,22 s) e, na troca para
// outro slide, sai antes (0,16 s). `dx`: o deslocamento da cauda (o último slide indo para o centro).
export const Paginas: React.FC<{ plano: Plano; t: number; dx?: number }> = ({ plano, t, dx = 0 }) => {
  const ps = paginasEm(plano, t);
  if (!ps.length) return null;
  const sx = slideX(plano) + dx;
  const sh = slideH(plano);
  return (
    <>
      <div style={{ position: "absolute", left: sx, top: SLIDE_Y, width: SLIDE_W, height: sh, borderRadius: RAIO, background: COR.folha, boxShadow: SOMBRA }} />
      {ps.map(({ m, opacidade, dy }, i) =>
        opacidade <= 0.001 ? null : (
          <div
            key={`${m.tipo}-${m.de}-${i}`}
            style={{
              position: "absolute",
              left: sx,
              top: SLIDE_Y,
              width: SLIDE_W,
              height: sh,
              borderRadius: RAIO,
              overflow: "hidden",
              opacity: opacidade >= 0.999 ? 1 : opacidade,
              transform: Math.abs(dy) > 0.05 ? `translateY(${dy.toFixed(1)}px)` : undefined,
            }}
          >
            <Conteudo plano={plano} m={m} t={t} h={sh} />
          </div>
        ),
      )}
    </>
  );
};

const Conteudo: React.FC<{ plano: Plano; m: Momento; t: number; h: number }> = ({ plano, m, t, h }) => {
  switch (m.tipo) {
    case "slide":
      return <SlideAula plano={plano} m={m} t={t} h={h} />;
    case "topicos":
    case "passos":
      return <Lista plano={plano} titulo={m.titulo} itens={m.itens} numerar={m.tipo === "passos"} de={m.de} ate={m.ate} t={t} h={h} />;
    case "numero":
      return <Numero plano={plano} m={m} t={t} h={h} />;
    case "comparacao":
      return <Comparacao plano={plano} m={m} t={t} h={h} />;
    case "grafico":
      return <Grafico plano={plano} m={m} t={t} h={h} />;
    case "definicao":
      return <Definicao plano={plano} m={m} t={t} h={h} />;
    case "pergunta":
      return <Pergunta plano={plano} m={m} t={t} h={h} />;
    default:
      return null;
  }
};

// ——— itens (linhas que entram na fala): o da vez em tinta, os anteriores em cinza ———
const Itens: React.FC<{ itens: Item[]; numerar?: boolean; x: number; y: number; largura: number; altura: number; t: number }> = ({ itens, numerar, x, y, largura, altura, t }) => {
  const n = itens.length;
  if (!n) return null;
  const marca = numerar ? 56 : 18;
  const larg = largura - marca - 28;
  const temDetalhe = itens.some((it) => it.detalhe);
  let gap = 20;
  // um corpo só para todos; diminui até caber na altura
  let max = 52;
  let tam = 28;
  let linhas: string[][] = [];
  let lh = 0;
  let hs: number[] = [];
  for (; max >= 26; max -= 2) {
    tam = Math.min(...itens.map((it) => encaixar(it.texto, { largura: larg, max, min: 24, linhas: 2, fonte: { peso: 700 } }).tamanho));
    linhas = itens.map((it) => encaixar(it.texto, { largura: larg, max: tam, min: tam, linhas: 3, fonte: { peso: 700 } }).linhas);
    lh = Math.round(tam * 1.24);
    hs = linhas.map((l, i) => Math.max(marca, l.length * lh) + (itens[i].detalhe ? Math.round(tam * 0.72 * 1.3) + 6 : 0));
    if (hs.reduce((a, b) => a + b, 0) + gap * (n - 1) <= altura) break;
  }
  // sobrando altura, as linhas respiram mais (até 44 px entre elas)
  if (n > 1) gap = Math.max(20, Math.min(44, (altura - hs.reduce((a, b) => a + b, 0)) / (n - 1)));
  let atual = -1;
  itens.forEach((it, i) => {
    if (t >= it.em - 0.03) atual = i;
  });
  const ys: number[] = [];
  let acc = y;
  hs.forEach((hh) => {
    ys.push(acc);
    acc += hh + gap;
  });
  const centro = (i: number) => ys[i] + Math.min(marca, lh) / 2 + (marca > lh ? 0 : 0);
  const fio = numerar && atual > 0 ? centro(atual - 1) + (centro(atual) - centro(atual - 1)) * prog(t, itens[atual].em - 0.03, 0.35) : 0;
  return (
    <>
      {numerar && atual > 0 ? <div style={{ position: "absolute", left: x + marca / 2 - 2, top: centro(0), width: 4, height: Math.max(0, fio - centro(0)), background: COR.violeta }} /> : null}
      {itens.map((it, i) => {
        const e = prog(t, it.em - 0.03, 0.32);
        if (e <= 0) return null;
        const daVez = i === atual;
        const pronto = e >= 1;
        const det = it.detalhe ? encaixar(it.detalhe, { largura: larg, max: Math.round(tam * 0.72), min: 20, linhas: 1, fonte: { peso: 600 } }) : null;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: ys[i], width: largura, height: hs[i], opacity: pronto ? 1 : e, transform: pronto ? undefined : `translateX(${(1 - e) * 24}px)` }}>
            <div style={{ position: "absolute", left: 0, top: numerar ? 0 : lh / 2 - marca / 2 }}>
              {numerar ? (
                <Selo tamanho={marca} apagado={!daVez}>
                  {i + 1}
                </Selo>
              ) : (
                <div style={{ width: marca, height: marca, borderRadius: 5, background: daVez ? COR.violeta : COR.linha }} />
              )}
            </div>
            <div style={{ position: "absolute", left: marca + 28, top: numerar ? Math.max(0, (marca - lh) / 2) : 0 }}>
              {linhas[i].map((l, k) => (
                <div key={k} style={{ fontFamily: FONTE, fontWeight: 700, fontSize: tam, lineHeight: `${lh}px`, color: daVez ? COR.tinta : COR.apoio, whiteSpace: "nowrap" }}>
                  {l}
                </div>
              ))}
              {det ? <div style={{ marginTop: 6, fontFamily: FONTE, fontWeight: 600, fontSize: det.tamanho, lineHeight: 1.3, color: COR.apoio, whiteSpace: "nowrap" }}>{it.detalhe}</div> : null}
            </div>
          </div>
        );
      })}
    </>
  );
};

// ——— a fórmula escrita termo a termo ———
const LARG_GLIFO: Record<string, number> = { M: 0.9, W: 0.92, m: 0.72, w: 0.66, i: 0.3, j: 0.3, l: 0.3, t: 0.33, f: 0.32, r: 0.4, "(": 0.36, ")": 0.36, "[": 0.36, "]": 0.36, "·": 0.32, ",": 0.26, ".": 0.26, " ": 0.25 };
const OPERADOR = /^[=+−\-×·÷<>≤≥≈/]$/;
const larguraTermo = (texto: string, sup?: boolean) => {
  let w = 0;
  for (const c of texto) {
    const base = LARG_GLIFO[c] ?? (/[A-Z]/.test(c) ? 0.68 : /[a-z]/.test(c) ? 0.48 : /\d/.test(c) ? 0.5 : 0.56);
    w += base + (OPERADOR.test(c) ? 0.44 : 0);
  }
  return w * (sup ? 0.62 : 1);
};
const Glifos: React.FC<{ texto: string }> = ({ texto }) => (
  <>
    {[...texto].map((c, i) => {
      const letra = /\p{L}/u.test(c);
      const op = OPERADOR.test(c);
      return (
        <span key={i} style={{ fontStyle: letra ? "italic" : "normal", margin: op ? "0 0.22em" : undefined }}>
          {c}
        </span>
      );
    })}
  </>
);

export const Formula: React.FC<{ termos: TermoDaFormula[]; x: number; y: number; largura: number; altura: number; t: number; de: number }> = ({ termos, x, y, largura, altura, t, de }) => {
  const est = termos.reduce((a, k) => a + larguraTermo(k.texto, k.sup), 0);
  const padX = 64;
  const tam = Math.round(Math.max(56, Math.min(150, (largura - padX * 2) / Math.max(1, est * 1.08), (altura - 60) / 1.45)));
  const wCaixa = Math.min(largura, Math.round(est * tam * 1.08 + padX * 2));
  const hCaixa = Math.min(altura, Math.round(tam * 1.45 + 60));
  const xC = x + (largura - wCaixa) / 2;
  const yC = y + (altura - hCaixa) / 2;
  const ultimo = termos[termos.length - 1];
  const fecha = ultimo ? prog(t, ultimo.em + 0.06, 0.26, suave) : 0;
  const perim = 2 * (wCaixa + hCaixa);
  const aparece = prog(t, de, 0.35);
  return (
    <div style={{ position: "absolute", left: xC, top: yC, width: wCaixa, height: hCaixa, opacity: aparece }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: COR.violetaFundo, border: `2px dashed ${COR.linha}`, boxSizing: "border-box", opacity: 1 - fecha }} />
      {fecha > 0 ? (
        <>
          <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: COR.violetaFundo, opacity: fecha }} />
          <svg width={wCaixa} height={hCaixa} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <rect x={2} y={2} width={wCaixa - 4} height={hCaixa - 4} rx={23} fill="none" stroke={COR.violeta} strokeWidth={4} strokeDasharray={perim} strokeDashoffset={perim * (1 - fecha)} />
          </svg>
        </>
      ) : null}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", fontFamily: MATEMATICA, fontWeight: 500, fontSize: tam, lineHeight: 1, color: COR.tinta }}>
          {termos.map((k, i) => {
            const e = prog(t, k.em - 0.03, 0.26, suave);
            const prox = termos[i + 1];
            // o termo da vez acende (violeta, com o marca-texto); quando o próximo é dito, assenta
            const aceso = t >= k.em - 0.03 && (!prox || t < prox.em - 0.03) && fecha <= 0;
            const marca = aceso ? prog(t, k.em, 0.25) : 0;
            return (
              <span
                key={i}
                style={{
                  position: "relative",
                  zIndex: 0,
                  isolation: "isolate",
                  display: "inline-block",
                  fontSize: k.sup ? "0.62em" : undefined,
                  top: k.sup ? "-0.82em" : undefined,
                  marginLeft: k.sup ? "0.04em" : undefined,
                  padding: "0 0.05em",
                  color: aceso ? COR.violetaEscuro : COR.tinta,
                  visibility: e > 0 ? "visible" : "hidden",
                  clipPath: e > 0 && e < 1 ? `inset(-20% ${((1 - e) * 100).toFixed(1)}% -20% 0)` : undefined,
                }}
              >
                {aceso ? <span style={{ position: "absolute", left: 0, right: 0, top: "8%", bottom: "-6%", borderRadius: 10, background: COR.marcaTexto, opacity: marca, zIndex: -1 }} /> : null}
                <span style={{ position: "relative" }}>
                  <Glifos texto={k.texto} />
                </span>
              </span>
            );
          })}
        </div>
      </div>
      {fecha > 0 ? (
        <div style={{ position: "absolute", right: -22, top: -22, transform: `scale(${0.5 + 0.5 * fecha})`, opacity: fecha }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: COR.violeta, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: SOMBRA }}>
            <Icone nome="lapis" tamanho={30} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

// ——— o resumo da aula: uma lista com visto, linha por linha, em sequência ———
const RES_GAP = 14;
const VISTO = 36;
const medirResumo = (itens: string[], largura: number) => {
  const larg = largura - VISTO - 18;
  const tam = Math.min(...itens.map((it) => encaixar(it, { largura: larg, max: 32, min: 26, linhas: 2, fonte: { peso: 700 } }).tamanho));
  const lh = Math.round(tam * 1.3);
  const linhas = itens.map((it) => encaixar(it, { largura: larg, max: tam, min: tam, linhas: 3, fonte: { peso: 700 } }).linhas);
  const altura = linhas.reduce((a, l) => a + Math.max(VISTO, l.length * lh), 0) + RES_GAP * Math.max(0, itens.length - 1);
  return { tam, lh, linhas, altura };
};
const Resumo: React.FC<{ itens: string[]; em: number; titulo?: string; x: number; y: number; largura: number; t: number }> = ({ itens, em, titulo, x, y, largura, t }) => {
  const r = medirResumo(itens, largura);
  let yi = y + (titulo ? 40 : 0) + 24;
  const fio = prog(t, em - 0.1, 0.4);
  return (
    <>
      <div style={{ position: "absolute", left: x, top: y + (titulo ? 40 : 0), width: largura * fio, height: 2, background: COR.trilho }} />
      {titulo ? <Sobretitulo texto={titulo} x={x} y={y} largura={largura} tamanho={20} t={t} em={em - 0.05} /> : null}
      {itens.map((it, i) => {
        const quando = em + 0.22 * i;
        const e = prog(t, quando - 0.03, 0.35);
        const linhas = r.linhas[i];
        const hLinha = Math.max(VISTO, linhas.length * r.lh);
        const topo = yi;
        yi += hLinha + RES_GAP;
        if (e <= 0) return null;
        const corte = it.indexOf(":");
        let k = 0;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: topo, width: largura, height: hLinha, opacity: e >= 1 ? 1 : e, transform: e >= 1 ? undefined : `translateX(${(1 - e) * 20}px)`, display: "flex", gap: 18, alignItems: "flex-start" }}>
            <div style={{ marginTop: Math.max(0, (r.lh - VISTO) / 2) }}>
              <Visto tamanho={VISTO} e={prog(t, quando + 0.08, 0.3)} />
            </div>
            <div>
              {linhas.map((l, li) => {
                // o trecho antes dos dois-pontos fica em tinta (o assunto); o resto, em cinza
                const ws = l.split(" ");
                return (
                  <div key={li} style={{ fontFamily: FONTE, fontSize: r.tam, lineHeight: `${r.lh}px`, whiteSpace: "nowrap" }}>
                    {ws.map((w2, wi) => {
                      const ini = k;
                      k += w2.length + 1;
                      const forte = corte > 0 && ini < corte;
                      return (
                        <Fragment key={wi}>
                          <span style={{ fontWeight: forte ? 800 : 600, color: forte ? COR.tinta : COR.apoio }}>{w2}</span>
                          {wi < ws.length - 1 ? " " : ""}
                        </Fragment>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
};
const alturaResumo = (itens: string[], titulo?: string) => medirResumo(itens, UTIL).altura + 24 + (titulo ? 40 : 0);

// ——— o slide (a assinatura) ———
const SlideAula: React.FC<{ plano: Plano; m: TSlide; t: number; h: number }> = ({ plano, m, t, h }) => {
  const em = m.em ?? m.de;
  const rotulo = m.rotulo ?? (m.resumo ? "Resumo da aula" : undefined);
  const cab = cabecalho(plano, { titulo: m.titulo, em, ate: m.ate, destaque: m.destaque, rotulo, acender: m.termos }, t);
  const hRes = m.resumo?.itens.length ? alturaResumo(m.resumo.itens, m.resumo.titulo) : 0;
  const yRes = h - PAD - hRes;
  const fimCorpo = (hRes ? yRes - 36 : h - PAD) ;
  const temItens = !!m.itens?.length;
  const temFormula = !!m.formula?.length;
  const hItens = temItens ? (temFormula ? (fimCorpo - cab.altura) * 0.5 : fimCorpo - cab.altura) : 0;
  return (
    <>
      {cab.elemento}
      {temItens ? <Itens itens={m.itens ?? []} numerar={m.numerar} x={PAD} y={cab.altura} largura={UTIL} altura={hItens} t={t} /> : null}
      {temFormula ? <Formula termos={m.formula ?? []} x={PAD} y={cab.altura + hItens} largura={UTIL} altura={fimCorpo - cab.altura - hItens} t={t} de={Math.min(em, m.formula?.[0]?.em ?? em)} /> : null}
      {hRes ? <Resumo itens={m.resumo?.itens ?? []} em={m.resumo?.em ?? em} titulo={m.resumo?.titulo} x={PAD} y={yRes} largura={UTIL} t={t} /> : null}
    </>
  );
};

// ——— topicos e passos ———
const Lista: React.FC<{ plano: Plano; titulo?: string; itens: Item[]; numerar: boolean; de: number; ate: number; t: number; h: number }> = ({ plano, titulo, itens, numerar, de, ate, t, h }) => {
  const cab = cabecalho(plano, { titulo, em: de, ate }, t);
  const y0 = titulo ? cab.altura + 10 : PAD + 20;
  return (
    <>
      {cab.elemento}
      <Itens itens={itens} numerar={numerar} x={PAD} y={y0} largura={UTIL} altura={h - PAD - y0} t={t} />
    </>
  );
};

// ——— numero: o número ocupa a folha inteira ———
// Com `desde`: o valor de partida em cima, a etiqueta do caminho (`via`), a seta que desce e o valor
// final, grande, em violeta; ele conta rápido (0,36 s) a partir de `em` e chega no valor durante a
// própria palavra. Sem `desde`: o número grande conta do zero e a barra enche junto.
const CONTA = 0.36;
const Numero: React.FC<{ plano: Plano; m: TNumero; t: number; h: number }> = ({ m, t, h }) => {
  const casas = m.casas ?? 0;
  const fmt = (v: number) => `${m.prefixo ?? ""}${formatar(casas === 0 ? Math.round(v) : v, casas)}${m.sufixo ?? ""}`;
  const temDesde = m.desde !== undefined;
  const desde = m.desde ?? 0;
  const p = prog(t, m.em, CONTA, suave);
  const atual = fmt(desde + (m.valor - desde) * p);
  const titulo = m.titulo ? <Sobretitulo texto={m.titulo} x={PAD} y={PAD - 4} largura={UTIL} tamanho={26} t={t} em={m.de} /> : null;
  const topo = m.titulo ? PAD + 56 : PAD;
  const fonte = { peso: 800 as const, espacamento: -0.02 };
  const big = encaixar(fmt(Math.max(Math.abs(m.valor), Math.abs(desde))), { largura: UTIL, max: temDesde ? 176 : 220, min: 80, linhas: 1, fonte }).tamanho;
  const tamD = Math.round(big * 0.58);
  const via = m.via ? encaixar(m.via, { largura: UTIL - 160, max: 38, min: 28, linhas: 1, fonte: { peso: 800 } }) : null;
  const rot = encaixar(m.rotulo, { largura: UTIL, max: 48, min: 30, linhas: 2, fonte: { peso: 700 } });
  const hRot = Math.round(rot.linhas.length * rot.tamanho * 1.25);
  const hV = Math.round(big * 1.02);
  const hD = Math.round(tamD * 1.05);
  const hVia = via ? 72 : 0;
  const hSeta = 92;
  const total = temDesde ? hD + 24 + hVia + 12 + hSeta + 14 + hV + 16 + hRot : hV + 28 + 10 + 30 + hRot;
  const y0 = Math.round(topo + Math.max(0, (h - PAD - topo - total) / 2));
  const er = prog(t, m.rotuloEm ?? m.em + CONTA + 0.1, 0.3);
  const centro: React.CSSProperties = { position: "absolute", left: 0, width: SLIDE_W, textAlign: "center", whiteSpace: "nowrap" };
  const numero = (y: number, tam: number, cor: string, texto: string, e: number) => (
    <div style={{ ...centro, top: y, fontFamily: FONTE, fontWeight: 800, fontSize: tam, lineHeight: 1, letterSpacing: "-0.02em", color: cor, fontVariantNumeric: "tabular-nums", opacity: e >= 1 ? 1 : e, transform: e >= 1 ? undefined : `translateY(${(1 - e) * 12}px)` }}>
      {texto}
    </div>
  );
  const rotulo = (y: number) => (
    <div style={{ ...centro, top: y, opacity: er, transform: er >= 1 ? undefined : `translateY(${(1 - er) * 10}px)` }}>
      {rot.linhas.map((l, i) => (
        <div key={i} style={{ fontFamily: FONTE, fontWeight: 700, fontSize: rot.tamanho, lineHeight: 1.25, color: COR.apoio }}>
          {l}
        </div>
      ))}
      {m.ilustrativo ? <div style={{ marginTop: 8, fontFamily: FONTE, fontWeight: 800, fontSize: 22, letterSpacing: "0.1em", textTransform: "uppercase", color: COR.apoio }}>ilustrativo</div> : null}
    </div>
  );
  if (!temDesde) {
    const yBar = y0 + hV + 28;
    const wBar = Math.min(UTIL, 760);
    return (
      <>
        {titulo}
        {numero(y0, big, COR.violetaEscuro, atual, prog(t, m.em - 0.05, 0.2))}
        <div style={{ position: "absolute", left: (SLIDE_W - wBar) / 2, top: yBar, width: wBar, height: 10, borderRadius: 5, background: COR.trilho }} />
        <div style={{ position: "absolute", left: (SLIDE_W - wBar) / 2, top: yBar, width: wBar * p, height: 10, borderRadius: 5, background: COR.violeta }} />
        {rotulo(yBar + 40)}
      </>
    );
  }
  const yVia = y0 + hD + 24;
  const ySeta = yVia + hVia + 12;
  const yV = ySeta + hSeta + 14;
  const eVia = via ? prog(t, (m.viaEm ?? m.em) - 0.03, 0.3) : 0;
  const seta = prog(t, m.em - 0.06, CONTA, suave);
  const cx = SLIDE_W / 2;
  return (
    <>
      {titulo}
      {numero(y0, tamD, COR.tinta, fmt(desde), prog(t, (m.desdeEm ?? m.de) - 0.03, 0.3))}
      {via ? (
        <div style={{ ...centro, top: yVia, opacity: eVia, transform: eVia >= 1 ? undefined : `translateY(${(1 - eVia) * 10}px)` }}>
          <span style={{ display: "inline-block", height: 64, lineHeight: "64px", padding: "0 30px", borderRadius: 32, background: COR.marcaTexto, fontFamily: FONTE, fontWeight: 800, fontSize: via.tamanho, color: COR.violetaEscuro }}>{m.via}</span>
        </div>
      ) : null}
      {seta > 0 ? (
        <>
          <div style={{ position: "absolute", left: cx - 3, top: ySeta, width: 6, height: (hSeta - 14) * seta, borderRadius: 3, background: COR.violeta }} />
          {seta >= 1 ? <div style={{ position: "absolute", left: cx - 15, top: ySeta + hSeta - 20, width: 0, height: 0, borderLeft: "15px solid transparent", borderRight: "15px solid transparent", borderTop: `20px solid ${COR.violeta}` }} /> : null}
        </>
      ) : null}
      {numero(yV, big, COR.violetaEscuro, atual, prog(t, m.em - 0.05, 0.16))}
      {rotulo(yV + hV + 16)}
    </>
  );
};

// ——— comparacao: duas colunas; o vencedor acende, o outro apaga (riscado no errado-certo) ———
const Comparacao: React.FC<{ plano: Plano; m: TComparacao; t: number; h: number }> = ({ plano, m, t, h }) => {
  const cab = cabecalho(plano, { titulo: m.titulo, em: m.de, ate: m.ate }, t);
  const y0 = m.titulo ? cab.altura + 10 : PAD + 10;
  const meio = 92;
  const w = (UTIL - meio) / 2;
  const P = 36;
  const larg = w - P * 2;
  const tam = Math.min(...m.lados.map((l) => encaixar(l.texto, { largura: larg, max: 52, min: 28, linhas: 4, fonte: { peso: 800 } }).tamanho));
  const lhC = Math.round(tam * 1.18);
  const maxLinhas = Math.max(...m.lados.map((l) => encaixar(l.texto, { largura: larg, max: tam, min: tam, linhas: 5, fonte: { peso: 800 } }).linhas.length));
  const hCard = Math.min(h - PAD - y0, Math.max(280, P + 48 + maxLinhas * lhC + P + 20));
  const yC = y0 + Math.max(0, (h - PAD - y0 - hCard) / 2);
  const venceu = m.vencedor !== undefined ? prog(t, m.vencedorEm ?? m.lados[m.vencedor].em + 0.6, 0.35) : 0;
  const simbolo = m.modo === "antes-depois" || m.modo === "errado-certo" ? "→" : "vs";
  const eMeio = prog(t, m.lados[1].em - 0.03, 0.3);
  return (
    <>
      {cab.elemento}
      {m.lados.map((l, i) => {
        const e = prog(t, l.em - 0.03, 0.32);
        if (e <= 0) return null;
        const perdeu = m.vencedor !== undefined && m.vencedor !== i && venceu > 0;
        const ganhou = m.vencedor === i && venceu > 0;
        const riscar = perdeu && m.modo === "errado-certo" ? venceu : 0;
        const linhas = encaixar(l.texto, { largura: larg, max: tam, min: tam, linhas: 5, fonte: { peso: 800 } }).linhas;
        const lh = Math.round(tam * 1.18);
        return (
          <div key={i} style={{ position: "absolute", left: PAD + i * (w + meio), top: yC, width: w, height: hCard, borderRadius: 22, background: ganhou ? COR.violetaFundo : "#F7F6F2", border: `3px solid ${ganhou ? COR.violeta : "transparent"}`, boxSizing: "border-box", opacity: (e >= 1 ? 1 : e) * (perdeu ? 1 - 0.45 * venceu : 1), transform: e >= 1 ? undefined : `translateY(${(1 - e) * 18}px)` }}>
            <div style={{ position: "absolute", left: P, top: P - 4, fontFamily: FONTE, fontWeight: 800, fontSize: 22, letterSpacing: "0.1em", textTransform: "uppercase", color: ganhou ? COR.violeta : COR.apoio, whiteSpace: "nowrap" }}>{l.rotulo}</div>
            <div style={{ position: "absolute", left: P, top: P + 48 }}>
              {linhas.map((x, k) => (
                <div key={k} style={{ position: "relative", fontFamily: FONTE, fontWeight: 800, fontSize: tam, lineHeight: `${lh}px`, letterSpacing: "-0.02em", color: COR.tinta, whiteSpace: "nowrap" }}>
                  {x}
                  {riscar > 0 ? <div style={{ position: "absolute", left: -4, top: lh * 0.52, width: (larguraTexto(x, tam, { peso: 800 }) + 8) * riscar, height: 6, borderRadius: 3, background: COR.alerta }} /> : null}
                </div>
              ))}
            </div>
            {ganhou ? (
              <div style={{ position: "absolute", right: P - 8, top: P - 12 }}>
                <Visto tamanho={48} e={venceu} />
              </div>
            ) : null}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: PAD + w + meio / 2 - 34, top: yC + hCard / 2 - 34, width: 68, height: 68, borderRadius: 34, background: COR.tinta, color: COR.folha, fontFamily: FONTE, fontWeight: 800, fontSize: simbolo === "vs" ? 26 : 34, display: "flex", alignItems: "center", justifyContent: "center", opacity: eMeio, transform: `scale(${0.7 + 0.3 * eMeio})` }}>
        {simbolo}
      </div>
    </>
  );
};

// ——— definicao: o termo grande e o significado palavra por palavra ———
const Definicao: React.FC<{ plano: Plano; m: TDefinicao; t: number; h: number }> = ({ plano, m, t, h }) => {
  const termo = encaixar(m.termo, { largura: UTIL, max: 120, min: 56, linhas: 2, fonte: { peso: 800, espacamento: -0.03 } });
  const lhT = Math.round(termo.tamanho * 1.05);
  const d = disporTexto(m.significado, { largura: UTIL, max: 50, min: 30, linhas: 4, peso: 600, fala: plano.palavras, de: m.significadoEm, ate: m.ate, entrelinha: 1.3 });
  const total = lhT * termo.linhas.length + 50 + d.altura;
  const y0 = Math.max(PAD + 20, Math.round((h - total) / 2));
  const e = prog(t, m.em - 0.03, 0.35);
  const marca = prog(t, m.em + 0.1, 0.5);
  const fio = prog(t, m.significadoEm - 0.2, 0.4);
  return (
    <>
      <Sobretitulo texto="Definição" x={PAD} y={PAD - 4} largura={UTIL} t={t} em={m.de} />
      {termo.linhas.map((l, i) => {
        const wl = larguraTexto(l, termo.tamanho, { peso: 800, espacamento: -0.03 });
        return (
          <div key={i} style={{ position: "absolute", left: PAD, top: y0 + i * lhT, width: wl + 20, height: lhT }}>
            <div style={{ position: "absolute", left: -10, top: lhT * 0.52, width: (wl + 20) * marca, height: lhT * 0.4, borderRadius: 10, background: COR.marcaTexto }} />
            <div style={{ position: "absolute", left: 0, top: 0, fontFamily: FONTE, fontWeight: 800, fontSize: termo.tamanho, lineHeight: `${lhT}px`, letterSpacing: "-0.03em", color: COR.violetaEscuro, whiteSpace: "nowrap", opacity: e }}>{l}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: PAD, top: y0 + lhT * termo.linhas.length + 20, width: 120 * fio, height: 6, borderRadius: 3, background: COR.violeta }} />
      <TextoFalado d={d} x={PAD} y={y0 + lhT * termo.linhas.length + 50} t={t} peso={600} />
    </>
  );
};

// ——— pergunta: a pergunta palavra por palavra e as alternativas com letra ———
const Pergunta: React.FC<{ plano: Plano; m: TPergunta; t: number; h: number }> = ({ plano, m, t, h }) => {
  const cab = cabecalho(plano, { titulo: m.texto, em: m.em ?? m.de, ate: m.ate, rotulo: "Pergunta", max: 60 }, t);
  const ops = m.opcoes ?? [];
  const certa = m.certa !== undefined ? prog(t, m.certaEm ?? (ops[m.certa]?.em ?? m.de) + 0.8, 0.35) : 0;
  if (!ops.length) {
    const e = prog(t, (m.em ?? m.de) + 0.2, 0.4);
    return (
      <>
        {cab.elemento}
        <div style={{ position: "absolute", left: PAD, top: cab.altura + 30, width: 120, height: 120, borderRadius: 60, background: COR.violeta, color: COR.folha, fontFamily: FONTE, fontWeight: 800, fontSize: 76, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.6 + 0.4 * e}) rotate(${(1 - e) * -12}deg)`, opacity: e }}>?</div>
      </>
    );
  }
  const y0 = cab.altura + 10;
  const gap = 18;
  const hOp = Math.min(110, (h - PAD - y0 - gap * (ops.length - 1)) / ops.length);
  const tam = Math.min(...ops.map((o) => encaixar(o.texto, { largura: UTIL - 140, max: 40, min: 24, linhas: 1, fonte: { peso: 700 } }).tamanho));
  return (
    <>
      {cab.elemento}
      {ops.map((o, i) => {
        const e = prog(t, o.em - 0.03, 0.3);
        if (e <= 0) return null;
        const ehCerta = m.certa === i;
        const apaga = m.certa !== undefined && !ehCerta ? certa : 0;
        return (
          <div key={i} style={{ position: "absolute", left: PAD, top: y0 + i * (hOp + gap), width: UTIL, height: hOp, borderRadius: 18, background: ehCerta && certa > 0 ? COR.violetaFundo : "#F7F6F2", border: `3px solid ${ehCerta && certa > 0 ? COR.violeta : "transparent"}`, boxSizing: "border-box", display: "flex", alignItems: "center", padding: "0 26px", gap: 24, opacity: (e >= 1 ? 1 : e) * (1 - 0.5 * apaga), transform: e >= 1 ? undefined : `translateX(${(1 - e) * 24}px)` }}>
            <Selo tamanho={Math.min(60, hOp - 24)} apagado={apaga > 0}>
              {String.fromCharCode(65 + i)}
            </Selo>
            <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: tam, color: COR.tinta, whiteSpace: "nowrap" }}>{o.texto}</div>
            {ehCerta && certa > 0 ? (
              <div style={{ marginLeft: "auto" }}>
                <Visto tamanho={48} e={certa} />
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};
