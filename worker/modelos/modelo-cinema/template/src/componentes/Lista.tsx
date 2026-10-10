// Tópicos e passos na "cartela alta": a janela da pessoa desce para a base da tela (uma faixa de
// cinemascope) e a barra de cima vira uma cartela preta, como os créditos de um filme. Cada item
// entra em foco na sua palavra; o da vez fica aceso e os anteriores recuam. Nos passos, algarismos
// âmbar ligados por um fio que desce até o passo da vez.
import { interpolate } from "remotion";
import { prog, saindo, travelling, useTempo } from "../anim";
import { CARTELA_ALTA, type Estado } from "../layout";
import { encaixar, larguraPalavra } from "../medida";
import type { Passos as PassosT, Topicos as TopicosT } from "../plano";
import { cor, serif } from "../tema";
import { Credito, NaBarra } from "./Barras";
import { TextoEmFoco } from "./Foco";

const LARGURA = 900;
const ENTRE = 1.08;

type Medidas = { tamanho: number; detalhe: number; linhas: number[]; alturas: number[]; titulo: number; total: number; larguraBloco: number };

// O maior corpo comum em que todos os itens cabem (até 2 linhas cada) na largura e na altura.
const medir = (itens: { texto: string; detalhe?: string }[], comTitulo: boolean, marcador: number, altura: number): Medidas => {
  const titulo = comTitulo ? 92 : 0;
  const tentar = (T: number): Medidas | null => {
    const largura = LARGURA - marcador * T;
    const detalhe = Math.max(48, Math.round(T * 0.6));
    const linhas: number[] = [];
    const alturas: number[] = [];
    let larguraBloco = 0;
    for (const it of itens) {
      const ws = it.texto.split(/\s+/).filter(Boolean);
      const enc = encaixar(ws, { largura, max: T, min: T, linhas: 2 });
      if (enc.tamanho !== T || enc.linhas.length > 2) return null;
      const larguraDasLinhas = Math.max(
        ...enc.linhas.map((l) => l.reduce((s, i) => s + larguraPalavra(ws[i], T), 0) + 0.26 * T * Math.max(0, l.length - 1)),
      );
      let h = enc.linhas.length * T * ENTRE;
      if (it.detalhe) {
        const dws = it.detalhe.split(/\s+/).filter(Boolean);
        const dEnc = encaixar(dws, { largura, max: detalhe, min: detalhe, linhas: 2, fonteDe: () => "italico500" });
        if (dEnc.tamanho !== detalhe) return null;
        h += dEnc.linhas.length * detalhe * 1.1 + 6;
      }
      linhas.push(enc.linhas.length);
      alturas.push(h);
      larguraBloco = Math.max(larguraBloco, larguraDasLinhas + marcador * T);
    }
    const vao = T * 0.42;
    const total = titulo + alturas.reduce((a, b) => a + b, 0) + vao * Math.max(0, itens.length - 1);
    if (total > altura) return null;
    return { tamanho: T, detalhe, linhas, alturas, titulo, total, larguraBloco };
  };
  for (let T = 96; T >= 46; T -= 2) {
    const r = tentar(T);
    if (r) return r;
  }
  // nada coube: o menor corpo, deixando as linhas quebrarem (nunca vaza na largura)
  return tentar(46) ?? { tamanho: 46, detalhe: 48, linhas: itens.map(() => 2), alturas: itens.map(() => 2 * 46 * ENTRE), titulo, total: altura, larguraBloco: LARGURA };
};

export const Lista: React.FC<{ m: TopicosT | PassosT; estado: Estado; primeira: boolean }> = ({ m, estado, primeira }) => {
  const t = useTempo();
  const itens = m.itens;
  const numerado = m.tipo === "passos";
  // o marcador ocupa uma coluna à esquerda (em frações do corpo)
  const marcador = numerado ? 0.95 : 0.82;
  const area = { topo: CARTELA_ALTA.topo, base: CARTELA_ALTA.base };
  const md = medir(itens, !!m.titulo, marcador, area.base - area.topo);
  const T = md.tamanho;
  const pronto = primeira ? m.de : m.de + 0.15;
  const sai = saindo(t, m.ate, 0.4);
  const vao = T * 0.42;
  // o item da vez: o último já dito
  let atual = -1;
  itens.forEach((it, i) => {
    if (t >= it.em - 0.06) atual = i;
  });
  // posições verticais (centro do marcador de cada item), para o fio dos passos
  const topoItens = area.topo + (area.base - area.topo - md.total) / 2 + md.titulo;
  const centros: number[] = [];
  let y = topoItens;
  itens.forEach((_, i) => {
    centros.push(y + (T * ENTRE) / 2);
    y += md.alturas[i] + vao;
  });
  // o fio desce do primeiro algarismo até o da vez, no ritmo dos itens
  const fio = (() => {
    if (!numerado || itens.length < 2) return 0;
    let alvo = centros[0];
    for (let i = 1; i < itens.length; i++) {
      const p = prog(t, itens[i].em - 0.35, 0.6, travelling);
      alvo = interpolate(p, [0, 1], [alvo, centros[i]]);
    }
    return alvo - centros[0];
  })();
  const esquerda = (1080 - Math.min(LARGURA, md.larguraBloco)) / 2;

  return (
    <NaBarra lado="cima" estado={estado}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: area.topo,
          height: area.base - area.topo,
          opacity: 1 - sai,
          filter: sai > 0.02 ? `blur(${(sai * 6).toFixed(2)}px)` : undefined,
        }}
      >
        {m.titulo ? (
          <div style={{ position: "absolute", left: 70, right: 70, top: topoItens - area.topo - md.titulo, height: md.titulo - 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Credito texto={m.titulo} em={pronto} largura={940} tamanho={34} limite={itens[0]?.em} />
          </div>
        ) : null}
        {numerado && itens.length > 1 ? (
          <>
            {/* o trilho a lápis e o fio âmbar que desce até o passo da vez (passa por trás dos algarismos) */}
            <div style={{ position: "absolute", left: esquerda + T * 0.27 - 1, top: centros[0] - area.topo, width: 2, height: centros[itens.length - 1] - centros[0], background: cor.marfimApagado, opacity: 0.6 * prog(t, pronto, 0.6) }} />
            <div style={{ position: "absolute", left: esquerda + T * 0.27 - 1.5, top: centros[0] - area.topo, width: 3, height: Math.max(0, fio), background: cor.ambar, opacity: prog(t, itens[0].em, 0.4) }} />
          </>
        ) : null}
        {itens.map((it, i) => {
          const dito = t >= it.em - 0.06;
          const daVez = i === atual;
          // os anteriores recuam quando o seguinte é dito
          const recua = i < atual ? prog(t, itens[i + 1].em - 0.1, 0.5) : 0;
          const acende = prog(t, it.em - 0.06, 0.4);
          const topo = centros[i] - (T * ENTRE) / 2 - area.topo;
          return (
            <div key={i} style={{ position: "absolute", left: esquerda, width: LARGURA, top: topo, display: "flex", alignItems: "flex-start", opacity: 1 - 0.4 * recua }}>
              <div
                style={{
                  width: marcador * T,
                  flexShrink: 0,
                  fontFamily: serif,
                  fontWeight: numerado ? 600 : 500,
                  fontStyle: numerado ? "italic" : undefined,
                  fontSize: numerado ? T * 0.86 : T,
                  lineHeight: `${(T * ENTRE).toFixed(1)}px`,
                  color: dito ? cor.ambar : cor.marfimApagado,
                  opacity: dito ? (daVez ? 1 : 0.75) : 0.6 * prog(t, pronto, 0.5),
                  fontVariantNumeric: "lining-nums",
                }}
              >
                {numerado ? (
                  // o algarismo fica sobre um disco preto, para o fio passar por trás
                  <span style={{ display: "inline-block", minWidth: T * 0.54, textAlign: "center", background: cor.preto, borderRadius: T, scale: String(1 + 0.08 * (1 - acende) * (dito ? 1 : 0)) }}>{i + 1}</span>
                ) : (
                  // travessão desenhado: se estica quando o item é dito
                  <div style={{ height: T * ENTRE, display: "flex", alignItems: "center" }}>
                    <div style={{ height: Math.max(3, T * 0.045), width: T * 0.44 * (0.45 + 0.55 * acende), background: "currentColor", borderRadius: 2, translate: `0 ${(T * 0.06).toFixed(1)}px` }} />
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                <TextoEmFoco
                  texto={it.texto}
                  em={it.em}
                  entrada={pronto}
                  limite={itens[i + 1]?.em ?? m.ate + 0.3}
                  largura={LARGURA - marcador * T}
                  max={T}
                  min={T}
                  linhas={2}
                  entrelinha={ENTRE}
                  alinhar="flex-start"
                />
                {it.detalhe ? (
                  <TextoEmFoco
                    texto={it.detalhe}
                    em={it.em + 0.4}
                    entrada={pronto}
                    limite={itens[i + 1]?.em ?? m.ate + 0.3}
                    largura={LARGURA - marcador * T}
                    max={md.detalhe}
                    min={md.detalhe}
                    linhas={2}
                    entrelinha={1.1}
                    italico
                    cor={cor.marfimSuave}
                    alinhar="flex-start"
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </NaBarra>
  );
};
