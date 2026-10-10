// Tópicos (lista sem ordem) como o cartão de catálogo do modelo: uma linha por item, com o numeral
// índigo à esquerda e um fio fino entre as linhas. O cartão chega com as linhas "a lápis" (numeral
// cinza e um traço tracejado); cada item ganha tinta na palavra dele, e um traço índigo anda até o
// item da vez.
import { prog, saida, Sobe } from "../anim";
import { encaixar, quebrar } from "../medida";
import type { Area } from "../pessoa";
import type { Topicos } from "../plano";
import { cor, serifa } from "../tema";
import { Apoio, folha, quando } from "./comum";

const PAD = 40;
const FIO = 34;
const NUM = 104;

export const Titulo: React.FC<{ texto: string; p: number; largura: number; max?: number }> = ({ texto, p, largura, max = 76 }) => {
  const e = encaixar(texto, { largura, max, min: 50, linhas: 2, estilo: "italico", entrelinha: 1.1 });
  return (
    <div style={{ fontFamily: serifa, fontStyle: "italic", fontSize: e.tamanho, lineHeight: 1.1, color: cor.tinta }}>
      {e.linhas.map((l, i) => (
        <Sobe key={i} p={p}>
          {l}
        </Sobe>
      ))}
    </div>
  );
};
export const alturaTitulo = (texto: string | undefined, largura: number, max = 76) =>
  texto ? encaixar(texto, { largura, max, min: 50, linhas: 2, estilo: "italico", entrelinha: 1.1 }).altura : 0;

type Linha = { linhas: string[]; detalhe: string[]; h: number };

// Corpo único para todas as linhas: o maior (até 76 px) que deixa cada item em até 2 linhas e o
// cartão na área; a sobra vira respiro entre as linhas (o cartão ocupa a página, sem faixa vazia).
const medirLinhas = (m: Topicos, largura: number, altura: number) => {
  const tw = largura - PAD * 2 - NUM;
  let escolha: { tamanho: number; linhas: Linha[]; total: number; fio: number; pad: number } | null = null;
  for (let s = 76; s >= 42; s -= 2) {
    const det = Math.max(36, Math.min(46, Math.round(s * 0.66)));
    const ls = m.itens.map((it) => {
      const linhas = quebrar(it.texto, tw - Math.max(0, s - 56), s, { estilo: "serifa" });
      const detalhe = it.detalhe ? quebrar(it.detalhe, tw, det, { estilo: "sans400" }) : [];
      return { linhas, detalhe, h: linhas.length * s * 1.12 + (detalhe.length ? 8 + detalhe.length * det * 1.22 : 0) };
    });
    const total = ls.reduce((a, l) => a + l.h, 0) + FIO * (ls.length - 1) + PAD * 2;
    const cabe = ls.every((l) => l.linhas.length <= 2) && total <= altura * 0.92;
    escolha = { tamanho: s, linhas: ls, total, fio: FIO, pad: PAD };
    if (cabe) break;
  }
  const e = escolha!;
  // sobra: até 70 px a mais entre as linhas e 24 px de margem interna
  const sobra = Math.max(0, altura * 0.92 - e.total);
  const n = e.linhas.length;
  const extraFio = n > 1 ? Math.min(70, (sobra * 0.75) / (n - 1)) : 0;
  const extraPad = Math.min(24, sobra * 0.25 / 2);
  e.fio = FIO + extraFio;
  e.pad = PAD + extraPad;
  e.total = e.linhas.reduce((a, l) => a + l.h, 0) + e.fio * (n - 1) + e.pad * 2;
  return e;
};

export const ListaDeCatalogo: React.FC<{ m: Topicos; t: number; fim: number; area: Area }> = ({ m, t, fim, area }) => {
  const fora = saida(t, fim);
  const th = alturaTitulo(m.titulo, area.w);
  const gap = th ? 28 : 0;
  const { tamanho, linhas, total, fio, pad } = medirLinhas(m, area.w, area.h - th - gap);
  const det = Math.max(36, Math.min(46, Math.round(tamanho * 0.66)));
  const entra = prog(t, m.de + 0.1, 0.6);
  // título + cartão centralizados na área
  const topo = area.y + Math.max(0, (area.h - th - gap - total) / 2);
  const y0 = topo + th + gap;

  // posição de cada linha dentro do cartão
  const tops: number[] = [];
  let y = pad;
  linhas.forEach((l) => {
    tops.push(y);
    y += l.h + fio;
  });
  // o traço índigo que anda até o item da vez
  const ems = m.itens.map((it) => quando(it.em, m.de));
  let atual = -1;
  ems.forEach((e, i) => {
    if (t >= e - 0.04) atual = i;
  });
  const anda = atual >= 0 ? prog(t, ems[atual] - 0.04, 0.35) : 0;
  const yMarca = atual < 0 ? tops[0] : atual === 0 ? tops[0] : tops[atual - 1] + (tops[atual] - tops[atual - 1]) * anda;

  return (
    <>
      {m.titulo ? (
        <div style={{ position: "absolute", left: area.x, top: topo, width: area.w, opacity: 1 - fora }}>
          <Titulo texto={m.titulo} p={prog(t, m.de + 0.3, 0.45)} largura={area.w} />
        </div>
      ) : null}
      <div
        style={{
          ...folha,
          left: area.x,
          top: y0,
          width: area.w,
          height: total,
          opacity: Math.min(1, entra * 1.6) * (1 - fora),
          translate: `0 ${(1 - entra) * 70 + fora * 40}px`,
        }}
      >
        {linhas.map((l, i) => {
          const em = ems[i];
          const p = prog(t, em - 0.04, 0.42);
          const tintaNum = prog(t, em - 0.04, 0.3);
          return (
            <div key={i} style={{ position: "absolute", left: pad, top: tops[i], width: area.w - pad * 2 }}>
              {i > 0 ? <div style={{ position: "absolute", left: 0, right: 0, top: -fio / 2 - 1, height: 2, background: "rgba(23,22,20,0.14)" }} /> : null}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  fontFamily: serifa,
                  fontSize: tamanho * 0.96,
                  lineHeight: 1.12,
                  color: tintaNum > 0.5 ? cor.indigo : cor.lapis,
                  letterSpacing: "-0.01em",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ position: "absolute", left: NUM + Math.max(0, tamanho - 56), top: 0, width: area.w - pad * 2 - NUM - Math.max(0, tamanho - 56) }}>
                {/* espera a lápis: um traço tracejado onde o texto vai entrar */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: tamanho * 0.7,
                    width: Math.min(area.w - pad * 2 - NUM, 120 + l.linhas[0].length * tamanho * 0.32),
                    borderTop: `3px dashed ${cor.lapis}`,
                    opacity: 1 - prog(p, 0, 0.4),
                  }}
                />
                <div style={{ fontFamily: serifa, fontSize: tamanho, lineHeight: 1.12, color: cor.tinta, whiteSpace: "nowrap" }}>
                  {l.linhas.map((ln, k) => (
                    <Sobe key={k} p={p}>
                      {ln}
                    </Sobe>
                  ))}
                </div>
                {l.detalhe.length ? (
                  <div style={{ marginTop: 8 }}>
                    <Apoio texto={l.detalhe.join(" ")} tamanho={det} p={prog(t, em + 0.25, 0.4)} />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        {/* o marcador do item da vez, embaixo do numeral */}
        {atual >= 0 ? (
          <div style={{ position: "absolute", left: pad, top: yMarca + tamanho * 1.12 + 2, width: tamanho * 1.05, height: 5, background: cor.indigo, opacity: prog(t, ems[0] - 0.04, 0.3) }} />
        ) : null}
      </div>
    </>
  );
};
