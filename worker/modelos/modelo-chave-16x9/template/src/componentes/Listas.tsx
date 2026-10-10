// Os blocos de lista do Chave, na parede acima da porta de baixo:
// - topicos: um quadro de chaves vertical. Cada item é uma etiqueta numerada pendurada num pino da
//   régua de madeira e uma tira de papel com o texto. Nasce a lápis; quando é dito, a etiqueta cai no
//   pino, balança e fica verde, e a tira ganha papel e tinta; quando o próximo é dito, a anterior volta
//   ao papel com o visto.
// - passos: a prancheta de vistoria. Cada passo tem um círculo numerado; quando é dito, o círculo
//   ganha o verde, o texto ganha tinta e o traço desce do passo anterior até ele (a ordem).
import { useMemo } from "react";
import { balanco, Linhas, prog, temposDoTexto } from "../anim";
import { encaixar, larguraLinha, quebrarLinhas, SERIFA_TITULO, type Fonte } from "../medida";
import type { ItemDeLista, Palavra, Passos, Topicos } from "../plano";
import { cor, grotesca, serifa, titulo as estiloTitulo } from "../tema";
import { FundoEtiqueta, misturarCor } from "./Etiqueta";
import { Argola, Carimbo, Pino, ReguaDeMadeira } from "./Pecas";
import { respiro } from "./Parede";

const G600: Fonte = { nome: "g600" };
const G500: Fonte = { nome: "g500" };

// Título do bloco (serifa), medido para caber
export const useTitulo = (titulo: string | undefined, largura: number, palavras: Palavra[], de: number, ate: number, max = 76, min = 54) =>
  useMemo(() => {
    if (!titulo) return null;
    const e = encaixar(titulo, { largura, max, min, linhas: 2, fonte: SERIFA_TITULO });
    const tempos = temposDoTexto(titulo, palavras, de, ate, de + 0.05);
    return { ...e, tempos, altura: e.linhas.length * e.tamanho * 1.06 };
  }, [titulo, largura, palavras, de, ate, max, min]);

// Linhas de cada item num corpo comum: o maior corpo em que a lista inteira cabe na altura.
type Medida = { tamanho: number; dTamanho: number; linhas: string[][]; detalhes: string[][]; alturas: number[] };
const medirItens = (
  itens: ItemDeLista[],
  largura: number,
  altura: number,
  base: (h: number, corpo: number) => number,
  gapMin: number,
  maxCorpo = 58,
  minCorpo = 32,
): Medida => {
  const tentar = (s: number, comDetalhe: boolean): { m: Medida; cabe: boolean } => {
    const d = Math.max(30, Math.round(s * 0.72));
    const linhas = itens.map((i) => quebrarLinhas(i.texto, largura, s, G600));
    const detalhes = itens.map((i) => (i.detalhe && comDetalhe ? quebrarLinhas(i.detalhe, largura, d, G500) : []));
    const alturas = itens.map((_, k) => base(linhas[k].length * s * 1.12 + (detalhes[k].length ? 8 + detalhes[k].length * d * 1.18 : 0), s));
    const total = alturas.reduce((a, b) => a + b, 0) + gapMin * (itens.length - 1);
    const cabe = total <= altura && linhas.every((l) => l.length <= 3 && l.every((x) => larguraLinha(x.split(" "), s, G600) <= largura));
    return { m: { tamanho: s, dTamanho: d, linhas, detalhes, alturas }, cabe };
  };
  for (let s = maxCorpo; s >= minCorpo; s -= 2) {
    const r = tentar(s, true);
    if (r.cabe) return r.m;
  }
  // último recurso: sem os detalhes (o texto principal nunca some nem vaza)
  for (let s = maxCorpo; s >= minCorpo; s -= 2) {
    const r = tentar(s, false);
    if (r.cabe) return r.m;
  }
  return tentar(minCorpo, false).m;
};

// tempos das palavras de um item: a partir do `em` dele, até o próximo item
const temposDoItem = (i: ItemDeLista, proximo: number, palavras: Palavra[]) => temposDoTexto(i.texto, palavras, i.em - 0.1, proximo, i.em - 0.02);

// O detalhe de um item: menor, em cinza, e também ganha tinta palavra por palavra quando é dito
const Detalhe: React.FC<{ item: ItemDeLista; linhas: string[]; tamanho: number; depoisDe: number; ate: number; palavras: Palavra[]; t: number }> = ({ item, linhas, tamanho, depoisDe, ate, palavras, t }) => {
  const tempos = useMemo(() => temposDoTexto(item.detalhe ?? "", palavras, depoisDe - 0.05, ate, depoisDe + 0.1), [item.detalhe, palavras, depoisDe, ate]);
  return <Linhas linhas={linhas} tempos={tempos} t={t} esboco={0.25} style={{ fontFamily: grotesca, fontWeight: 500, fontSize: tamanho, lineHeight: 1.18, color: cor.texto2, marginTop: 8 }} />;
};

// ---------- topicos: o quadro de chaves vertical ----------

export const QuadroVertical: React.FC<{ m: Topicos; palavras: Palavra[]; t: number; w: number; h: number }> = ({ m, palavras, t, w, h }) => {
  const itens = m.itens.slice(0, 5);
  const titulo = useTitulo(m.titulo, w, palavras, m.de, itens[0]?.em ?? m.ate);
  const topoLista = titulo ? titulo.altura + 46 : 0;
  const PLANK = 58;
  const xTira = PLANK + 74;
  const larguraTira = w - xTira;
  const PAD = 26;
  const medida = useMemo(
    () => medirItens(itens, larguraTira - PAD * 2 - 10, h - topoLista - 20, (txt, corpo) => Math.max(Math.max(96, corpo * 1.9), txt + 30), 14, 62),
    [itens, larguraTira, h, topoLista],
  );
  const gap = Math.min(40, Math.max(14, (h - topoLista - 20 - medida.alturas.reduce((a, b) => a + b, 0)) / Math.max(1, itens.length - 1)));
  const alturaLista = medida.alturas.reduce((a, b) => a + b, 0) + gap * (itens.length - 1);
  // o título e a lista formam um bloco só, centrado na parede
  const topoBloco = Math.max(0, (h - topoLista - alturaLista) / 2 - 6);
  const y0 = topoBloco + topoLista;
  const ems = itens.map((i) => i.em);
  const tempos = useMemo(() => itens.map((i, k) => temposDoItem(i, ems[k + 1] ?? m.ate, palavras)), [itens, palavras, m.ate]); // eslint-disable-line react-hooks/exhaustive-deps

  // todas as etiquetas do mesmo tamanho: a que cabe na linha mais apertada (sem passar do pino de baixo)
  const tamanhoEtiqueta = Math.min(124, Math.max(62, Math.min(...medida.alturas.map((a, i) => a + (i === itens.length - 1 ? -10 : gap - 34)))));
  let y = y0;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {titulo ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: topoBloco }}>
          <Linhas linhas={titulo.linhas} tempos={titulo.tempos} t={t} style={{ ...estiloTitulo, fontSize: titulo.tamanho, color: cor.preto }} />
          <div style={{ height: 3, marginTop: 18, background: cor.lapisClaro, borderRadius: 2 }} />
        </div>
      ) : null}
      {/* a régua vertical de madeira, atrás das etiquetas */}
      <ReguaDeMadeira x={6} y={y0 - 26} w={alturaLista + 40} h={PLANK - 12} vertical />
      {itens.map((item, i) => {
        const topo = y;
        const alt = medida.alturas[i];
        y += alt + gap;
        const chega = prog(t, item.em - 0.05, 0.32);
        const proximo = ems[i + 1];
        const feita = proximo !== undefined ? prog(t, proximo - 0.05, 0.4) : 0;
        const acesa = chega * (1 - feita);
        // a etiqueta pendurada no pino não passa do pino da linha de baixo
        const tagH = tamanhoEtiqueta;
        const tagW = Math.round(tagH * 0.74);
        const pinoX = 6 + (PLANK - 12) / 2;
        const anguloT = balanco(t, item.em + 0.08, 9) + respiro(t, i * 1.3, 0.35);
        const tempoFim = tempos[i][tempos[i].length - 1] ?? item.em;
        return (
          <div key={`${item.texto}-${i}`}>
            <Pino x={pinoX} y={topo - 4} escala={0.9} />
            {/* etiqueta numerada: esboço até ser dita */}
            {chega < 0.999 ? (
              <div style={{ position: "absolute", left: pinoX - tagW / 2, top: topo + 22, width: tagW, height: tagH, opacity: 1 - chega }}>
                <FundoEtiqueta w={tagW} h={tagH} esboco={1} />
                <div style={{ position: "absolute", inset: 0, paddingTop: tagH * 0.24, display: "flex", justifyContent: "center", alignItems: "center", fontFamily: serifa, fontSize: tagH * 0.44, color: cor.lapis, fontVariantNumeric: "lining-nums" }}>
                  {i + 1}
                </div>
              </div>
            ) : null}
            {chega > 0.001 ? (
              <div
                style={{
                  position: "absolute",
                  left: pinoX - tagW / 2,
                  top: topo + 22,
                  width: tagW,
                  height: tagH,
                  transformOrigin: `${tagW / 2}px -10px`,
                  rotate: `${anguloT}deg`,
                  translate: `0 ${(1 - chega) * -40}px`,
                  opacity: Math.min(1, chega * 1.7),
                }}
              >
                <FundoEtiqueta w={tagW} h={tagH} acesa={acesa} />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    paddingTop: tagH * 0.24,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontFamily: serifa,
                    fontSize: tagH * 0.44,
                    color: acesa > 0.5 ? cor.papel : cor.preto,
                    fontVariantNumeric: "lining-nums",
                  }}
                >
                  {i + 1}
                </div>
                {feita > 0.01 ? (
                  <div style={{ position: "absolute", right: -16, bottom: -10, opacity: feita, scale: `${1.25 - 0.25 * feita}` }}>
                    <Carimbo tipo="visto" tamanho={42} p={prog(t, (proximo ?? 0) + 0.1, 0.3)} />
                  </div>
                ) : null}
                <Argola x={tagW / 2} y={-6} r={13} />
              </div>
            ) : null}
            {/* a tira de papel com o texto */}
            <div style={{ position: "absolute", left: xTira, top: topo, width: larguraTira, height: alt }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 10,
                  border: `3px dashed ${cor.lapis}`,
                  opacity: 1 - chega,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 10,
                  background: cor.papel,
                  boxShadow: "0 10px 16px rgba(30,20,10,0.20)",
                  opacity: chega,
                  translate: `${(1 - chega) * 18}px 0`,
                }}
              >
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 10, borderRadius: "10px 0 0 10px", background: misturarCor(cor.papelEscuro, cor.verde, acesa) }} />
              </div>
              <div style={{ position: "absolute", left: PAD + 10, right: PAD, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Linhas
                  linhas={medida.linhas[i]}
                  tempos={tempos[i]}
                  t={t}
                  esboco={0.3}
                  style={{ fontFamily: grotesca, fontWeight: 600, fontSize: medida.tamanho, lineHeight: 1.12, color: cor.preto }}
                />
                {medida.detalhes[i].length ? (
                  <Detalhe item={item} linhas={medida.detalhes[i]} tamanho={medida.dTamanho} depoisDe={tempoFim} ate={proximo ?? m.ate} palavras={palavras} t={t} />
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------- passos: a prancheta ----------

export const PranchetaDePassos: React.FC<{ m: Passos; palavras: Palavra[]; t: number; w: number; h: number }> = ({ m, palavras, t, w, h }) => {
  const itens = m.itens.slice(0, 5);
  const folha = { x: 18, y: 54, w: w - 36, h: h - 72 };
  const PADX = 40;
  const titulo = useTitulo(m.titulo, folha.w - PADX * 2, palavras, m.de, itens[0]?.em ?? m.ate, 70, 52);
  const topoLista = 52 + (titulo ? titulo.altura + 40 : 0);
  const CIRC = 70;
  const xTexto = PADX + CIRC + 30;
  const larguraTexto = folha.w - xTexto - PADX;
  const medida = useMemo(
    () => medirItens(itens, larguraTexto, folha.h - topoLista - 40, (txt) => Math.max(CIRC + 8, txt + 18), 18, 62),
    [itens, larguraTexto, folha.h, topoLista],
  );
  const livre = folha.h - topoLista - 40 - medida.alturas.reduce((a, b) => a + b, 0);
  const gap = Math.min(54, Math.max(18, livre / Math.max(1, itens.length - 1)));
  const alturaLista = medida.alturas.reduce((a, b) => a + b, 0) + gap * (itens.length - 1);
  const y0 = topoLista + Math.max(0, (folha.h - topoLista - 40 - alturaLista) / 2);
  const ems = itens.map((i) => i.em);
  const tempos = useMemo(() => itens.map((i, k) => temposDoItem(i, ems[k + 1] ?? m.ate, palavras)), [itens, palavras, m.ate]); // eslint-disable-line react-hooks/exhaustive-deps
  const tops: number[] = [];
  let acc = y0;
  for (const a of medida.alturas) {
    tops.push(acc);
    acc += a + gap;
  }
  const cx = PADX + CIRC / 2;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* a prancheta e a folha */}
      <div style={{ position: "absolute", inset: 0, background: cor.preto, borderRadius: 26, boxShadow: "0 18px 30px rgba(30,20,10,0.28)" }} />
      <div style={{ position: "absolute", left: folha.x, top: folha.y, width: folha.w, height: folha.h, background: cor.papel, borderRadius: 6 }}>
        {titulo ? (
          <div style={{ position: "absolute", left: PADX, right: PADX, top: 48 }}>
            <Linhas linhas={titulo.linhas} tempos={titulo.tempos} t={t} style={{ ...estiloTitulo, fontSize: titulo.tamanho, color: cor.preto }} />
            <div style={{ height: 3, background: cor.lapisClaro, marginTop: 18, borderRadius: 2 }} />
          </div>
        ) : null}
        {/* o traço que liga os passos: a lápis, ganha tinta verde até o passo dito */}
        <svg width={folha.w} height={folha.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {itens.slice(0, -1).map((_, i) => {
            const a = tops[i] + CIRC / 2 + CIRC / 2 + 6;
            const b = tops[i + 1] + CIRC / 2 - CIRC / 2 - 6;
            if (b <= a) return null;
            const p = prog(t, ems[i + 1] - 0.3, 0.32);
            return (
              <g key={i}>
                <path d={`M ${cx} ${a} V ${b}`} stroke={cor.lapis} strokeWidth={3.5} strokeDasharray="9 9" fill="none" />
                {p > 0.001 ? <path d={`M ${cx} ${a} V ${a + (b - a) * p}`} stroke={cor.verde} strokeWidth={6} strokeLinecap="round" fill="none" /> : null}
              </g>
            );
          })}
        </svg>
        {itens.map((item, i) => {
          const topo = tops[i];
          const alt = medida.alturas[i];
          const p = prog(t, item.em - 0.04, 0.3);
          const proximo = ems[i + 1];
          const feita = proximo !== undefined ? prog(t, proximo - 0.05, 0.35) : 0;
          const tempoFim = tempos[i][tempos[i].length - 1] ?? item.em;
            const yCirc = topo + Math.min(alt / 2, medida.tamanho * 0.62 + 4) - CIRC / 2 + (alt > CIRC + 30 ? 0 : 0);
          return (
            <div key={`${item.texto}-${i}`}>
              {/* círculo numerado: tracejado a lápis → verde na palavra → preto quando o próximo é dito */}
              <div style={{ position: "absolute", left: PADX, top: yCirc, width: CIRC, height: CIRC }}>
                <svg width={CIRC} height={CIRC} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                  <circle cx={CIRC / 2} cy={CIRC / 2} r={CIRC / 2 - 2} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="8 7" opacity={1 - p} />
                  <circle
                    cx={CIRC / 2}
                    cy={CIRC / 2}
                    r={(CIRC / 2) * (0.6 + 0.4 * p)}
                    fill={misturarCor(cor.verde, cor.preto, feita)}
                    opacity={p}
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingTop: 4,
                    fontFamily: serifa,
                    fontSize: CIRC * 0.52,
                    color: p > 0.5 ? cor.papel : cor.lapis,
                    fontVariantNumeric: "lining-nums",
                  }}
                >
                  {i + 1}
                </div>
              </div>
              <div style={{ position: "absolute", left: xTexto, width: larguraTexto, top: topo, height: alt, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Linhas
                  linhas={medida.linhas[i]}
                  tempos={tempos[i]}
                  t={t}
                  esboco={0.3}
                  style={{ fontFamily: grotesca, fontWeight: 600, fontSize: medida.tamanho, lineHeight: 1.12, color: cor.preto }}
                />
                {medida.detalhes[i].length ? (
                  <Detalhe item={item} linhas={medida.detalhes[i]} tamanho={medida.dTamanho} depoisDe={tempoFim} ate={proximo ?? m.ate} palavras={palavras} t={t} />
                ) : null}
              </div>
              {feita > 0.01 ? (
                <div style={{ position: "absolute", left: PADX + CIRC - 22, top: yCirc - 12, opacity: feita, scale: `${1.3 - 0.3 * feita}` }}>
                  <Carimbo tipo="visto" tamanho={38} p={prog(t, (proximo ?? 0) + 0.1, 0.28)} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {/* o prendedor de latão */}
      <svg width={220} height={80} style={{ position: "absolute", left: w / 2 - 110, top: -18, overflow: "visible" }}>
        <rect x={0} y={20} width={220} height={52} rx={12} fill={cor.latao} stroke={cor.lataoEscuro} strokeWidth={3} />
        <rect x={45} y={0} width={130} height={36} rx={14} fill="none" stroke={cor.lataoEscuro} strokeWidth={9} />
        <rect x={45} y={0} width={130} height={36} rx={14} fill="none" stroke={cor.latao} strokeWidth={5} />
        <circle cx={28} cy={46} r={6} fill={cor.lataoEscuro} />
        <circle cx={192} cy={46} r={6} fill={cor.lataoEscuro} />
      </svg>
    </div>
  );
};
