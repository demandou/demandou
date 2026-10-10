import React from "react";
import type { Medida, ObjetoMomento } from "../plano";
import { EASE_IN, EASE_INOUT, EASE_OUT, P, SERIF, SORA, caber, lerp, numeroBR, prog, quebrar, useTempo } from "../tema";
import { PALCO, W } from "../layout";
import { GLASS_S, GLASS_X, PXU, TRANSFORMA_CENA, copoPx, nivelAt, nivelValor, perfilDe, pousadas, telaNaCena, type Cena } from "./cena";

/* Tipografia do palco (2D por cima do 3D): números em Sora, rótulos em Fraunces itálica, tudo no
   papel creme. Posições fixas do layout do Medida; os textos vêm do plano e encolhem para caber.
   Versão deitada (16:9): as posições continuam as do desenho do vertical (a CENA, ver cena.ts) e o
   conjunto vai inteiro para o quadro da esquerda pela TRANSFORMA_CENA; o que vem do 3D (a linha, o
   nível) chega em px de tela e volta para a cena com telaNaCena. */

/** um ponto do recipiente (local) em px da cena */
const copoNaCena = (c: Cena, lx: number, ly: number) => {
  const p = copoPx(c, lx, ly);
  return telaNaCena(p.x, p.y);
};

/** revelação editorial: sobe por máscara com desfoque. Terminada a entrada, o texto fica limpo. */
export const Sobe: React.FC<{ em: number; sai?: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties; dy?: number }> = ({ em, sai, dur = 0.42, children, style, dy = 100 }) => {
  const t = useTempo();
  const p = prog(t, em - 0.04, em - 0.04 + dur, EASE_OUT);
  const x = sai === undefined ? 0 : prog(t, sai, sai + 0.24, EASE_IN);
  if (p <= 0 || x >= 1) return null;
  if (p >= 1 && x <= 0) return <div style={{ position: "absolute", ...style }}>{children}</div>;
  return (
    <div style={{ position: "absolute", overflow: "hidden", padding: "0.06em 0.1em 0.12em", margin: "-0.06em -0.1em -0.12em", ...style }}>
      <div style={{ transform: `translateY(${(1 - p) * dy - x * 30}%)`, filter: `blur(${(1 - p) * 10 + x * 8}px)`, opacity: Math.min(1, p * 1.4) * (1 - x) }}>{children}</div>
    </div>
  );
};

export const num: React.CSSProperties = { fontFamily: SORA, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };
export const serif: React.CSSProperties = { fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.05, whiteSpace: "nowrap" };

const Glifo: React.FC<{ em: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ em, children, style }) => {
  const t = useTempo();
  const p = prog(t, em - 0.04, em + 0.32, EASE_OUT);
  return <span style={{ display: "inline-block", opacity: p, transform: p >= 1 ? undefined : `translateY(${(1 - p) * 40}px)`, filter: p >= 1 ? undefined : `blur(${(1 - p) * 8}px)`, ...style }}>{children}</span>;
};

/** rótulo em itálico que quebra em até 2 linhas e encolhe para caber */
const Itálico: React.FC<{ texto: string; largura: number; max: number; min?: number; cor?: string }> = ({ texto, largura, max, min = 30, cor = P.tinta }) => {
  const q = quebrar(texto, largura, max, min, SERIF, 400, true, 2);
  return (
    <div style={{ ...serif, fontSize: q.px, color: cor }}>
      {q.linhas.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
};

/** a quantidade ao lado do objeto; quando as unidades caem, encolhe e vira a etiqueta em cima do objeto */
const Quantidade: React.FC<{ cena: Cena; m: Medida }> = ({ cena, m }) => {
  const t = useTempo();
  const q = m.quantidade;
  if (!q) return null;
  const T = cena.T;
  const a = prog(t, T.trinta - 0.06, T.trinta + 0.3, EASE_OUT);
  if (a <= 0) return null;
  const casas = q.casas ?? 0;
  const n = q.valor * EASE_OUT(prog(t, T.trinta - 0.02, T.contaFim + 0.22, (x) => x));
  const txt = numeroBR(casas ? n : Math.round(n), casas);
  const final = numeroBR(q.valor, casas);
  const g = q.sufixo ? prog(t, T.gramas - 0.04, T.gramas + 0.3, EASE_OUT) : 0;
  const mv = cena.temCopo ? prog(t, T.copo - 0.34, T.copo + 0.12, EASE_INOUT) : 0;
  const some = cena.despeja ? prog(t, T.uma2 - 0.05, T.uma2 + 0.2) : 0;
  // tamanho: o número final + sufixo cabe entre o objeto e a margem (≈ 456 px)
  const px = caber(`${q.prefixo ?? ""}${final}${q.sufixo ? ` ${q.sufixo}` : ""}`, 440, 210, 96, SORA, 800);
  const destinoY = cena.objeto ? 438 : 600;
  const cx = lerp(778, 170, mv);
  const cy = lerp(424, destinoY, mv) - Math.sin(mv * Math.PI) * 150;
  const k = lerp(1, Math.min(58.8 / px, 0.42), mv);
  return (
    <>
      <div style={{ position: "absolute", left: cx, top: cy, transform: `translate(-50%,-50%) scale(${k})`, opacity: a * (1 - some), filter: a < 1 ? `blur(${(1 - a) * 12}px)` : undefined }}>
        <div style={{ display: "flex", alignItems: "baseline", ...num, fontSize: px, color: P.tinta }}>
          {q.prefixo ? <span style={{ fontSize: px * 0.5, fontWeight: 700, color: P.fundo, marginRight: px * 0.06 }}>{q.prefixo}</span> : null}
          <span style={{ display: "inline-block", minWidth: `${final.length * 0.62}em`, textAlign: "right" }}>{txt}</span>
          {q.sufixo ? (
            <span style={{ fontSize: px * 0.495, fontWeight: 700, color: P.fundo, marginLeft: px * 0.076, opacity: Math.max(g, mv), transform: `translateY(${(1 - Math.max(g, mv)) * 30}px)`, display: "inline-block" }}>{q.sufixo}</span>
          ) : null}
        </div>
      </div>
      {q.rotulo ? (
        <Sobe em={T.acucar} sai={cena.temCopo ? T.copo - 0.42 : undefined} style={{ left: 600, top: 528 }}>
          <Itálico texto={q.rotulo} largura={410} max={64} />
        </Sobe>
      ) : null}
    </>
  );
};

/** o número de unidades grande + o nome delas + o contador que soma a cada unidade que pousa */
const Unidades: React.FC<{ cena: Cena; m: Medida }> = ({ cena, m }) => {
  const t = useTempo();
  const T = cena.T;
  const u = m.unidades;
  const sai = (m.referencia && T.ideal > T.sete ? T.ideal : m.ate) - 0.12;
  const k = pousadas(cena, t);
  const ultimo = k > 0 ? cena.unidades[k - 1].tl : 0;
  const roll = k > 0 ? prog(t, ultimo, ultimo + 0.1, EASE_OUT) : 0;
  const x = prog(t, sai, sai + 0.24, EASE_IN);
  const porUnidade = m.quantidade ? m.quantidade.valor / Math.max(1, cena.unidades.length) : 0;
  const suf = m.quantidade?.sufixo ? ` ${m.quantidade.sufixo}` : "";
  const casas = Number.isInteger(porUnidade) ? 0 : 1;
  const mostraGrande = u.numeroGrande ?? !m.ilustrativo;
  return (
    <>
      {mostraGrande ? (
        <Sobe em={T.sete} sai={sai} style={{ left: 722, top: 180 }}>
          <div style={{ ...num, fontSize: u.numero >= 10 ? 210 : 250, color: P.fundo }}>{numeroBR(u.numero)}</div>
        </Sobe>
      ) : null}
      {u.rotulo ? (
        <Sobe em={T.saches} sai={sai} style={{ left: 726, top: mostraGrande ? 438 : 300 }}>
          <Itálico texto={u.rotulo} largura={290} max={66} />
        </Sobe>
      ) : null}
      {u.detalhe ? (
        <Sobe em={T.detalhe} sai={sai} style={{ left: 728, top: mostraGrande ? 520 : 382 }}>
          <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: caber(u.detalhe, 288, 34, 24, SORA, 600), color: P.tintaSuave, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>{u.detalhe}</div>
        </Sobe>
      ) : null}
      {u.contador && porUnidade > 0 && k > 0 && x < 1 ? (
        <div style={{ position: "absolute", left: 726, top: 584, opacity: 1 - x, filter: x > 0 ? `blur(${x * 8}px)` : undefined }}>
          <div style={{ width: 250, height: 3, background: P.fundo, opacity: 0.25, marginBottom: 12, transformOrigin: "left", transform: `scaleX(${prog(t, cena.unidades[0].tl - 0.1, cena.unidades[0].tl + 0.3, EASE_OUT)})` }} />
          <div style={{ position: "relative", height: 86, width: 290, overflow: "hidden" }}>
            {k > 1 && roll < 1 ? (
              <div style={{ position: "absolute", ...num, fontSize: 80, color: P.tinta, transform: `translateY(${-roll * 100}%)`, opacity: 1 - roll }}>
                {numeroBR(porUnidade * (k - 1), casas)}
                {suf}
              </div>
            ) : null}
            <div style={{ position: "absolute", ...num, fontSize: 80, color: P.tinta, transform: roll < 1 ? `translateY(${(1 - roll) * 100}%)` : undefined, opacity: roll }}>
              {numeroBR(porUnidade * k, casas)}
              {suf}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

/** rótulo da linha: nome · fonte (pílula) · valor (abaixo da linha) */
const Referencia: React.FC<{ cena: Cena; m: Medida }> = ({ cena, m }) => {
  const t = useTempo();
  const r = m.referencia;
  if (!r || cena.LINE_H === null) return null;
  const T = cena.T;
  const ly = copoNaCena(cena, 0, cena.LINE_H).y;
  const pill = prog(t, T.oms - 0.04, T.oms + 0.3, EASE_OUT);
  const suf = r.sufixo ?? m.quantidade?.sufixo;
  const valor = r.valor !== undefined && !m.ilustrativo ? numeroBR(r.valor) : null;
  const pxValor = valor ? caber(`${r.prefixo ?? ""} ${valor} ${suf ?? ""}`, 300, 100, 56, SORA, 800) : 100;
  // o rótulo pode quebrar em 2 linhas: a pílula e o valor descem junto
  const rot = quebrar(r.rotulo, 300, 50, 30, SERIF, 400, true, 2);
  const extra = (rot.linhas.length - 1) * rot.px * 1.05;
  return (
    <>
      <Sobe em={(r.rotuloEm ?? T.ideal) + 0.14} style={{ left: 712, top: ly + 14 }}>
        <Itálico texto={r.rotulo} largura={300} max={50} min={30} />
      </Sobe>
      {r.fonte && pill > 0 ? (
        <div style={{ position: "absolute", left: 714, top: ly + 80 + extra, opacity: pill, transform: pill < 1 ? `translateY(${(1 - pill) * 14}px)` : undefined, filter: pill < 1 ? `blur(${(1 - pill) * 6}px)` : undefined }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 16px 6px 12px", borderRadius: 999, border: `2px solid ${P.fundo}`, fontFamily: SORA, fontWeight: 700, fontSize: caber(r.fonte, 240, 28, 20, SORA, 700), letterSpacing: "0.12em", color: P.fundo, whiteSpace: "nowrap" }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: P.fundo, display: "inline-block" }} />
            {r.fonte.toUpperCase()}
          </div>
        </div>
      ) : null}
      {valor ? (
        <div style={{ position: "absolute", left: 708, top: ly + extra + (r.fonte ? 128 : 76), display: "flex", alignItems: "baseline", ...num, fontSize: pxValor, color: P.tinta }}>
          {r.prefixo ? <Glifo em={T.menos} style={{ fontWeight: 600, color: P.fundo, marginRight: pxValor * 0.14 }}>{r.prefixo}</Glifo> : null}
          <Glifo em={T.vinte}>{valor}</Glifo>
          {suf ? <Glifo em={T.vinte + 0.08} style={{ fontSize: pxValor * 0.62, fontWeight: 700, color: P.fundo, marginLeft: pxValor * 0.12 }}>{suf}</Glifo> : null}
        </div>
      ) : null}
    </>
  );
};

/** o nível vermelho que sobe da linha até o topo: a quantidade conta até o total */
const Nivel: React.FC<{ cena: Cena; m: Medida }> = ({ cena, m }) => {
  const t = useTempo();
  if (!cena.passa || !m.passou) return null;
  const a = prog(t, cena.T.ultra - 0.04, cena.T.ultra + 0.24, EASE_OUT);
  if (a <= 0) return null;
  const lv = nivelAt(cena, t);
  const y = copoNaCena(cena, 0, lv).y;
  const edge = telaNaCena(GLASS_X + perfilDe(cena).externo(lv) * PXU * GLASS_S, 0).x;
  const comNumero = !!m.quantidade && !m.ilustrativo;
  const v = numeroBR(Math.round(nivelValor(cena, t)));
  const suf = m.quantidade?.sufixo;
  return (
    <>
      <div style={{ position: "absolute", left: edge + 6, top: y - 2, width: (700 - edge) * a, height: 4, borderRadius: 2, background: P.vermelho }} />
      <div style={{ position: "absolute", left: 712, top: y - 8, transform: `translateY(-100%) translateY(${(1 - a) * 20}px)`, opacity: a, filter: a < 1 ? `blur(${(1 - a) * 8}px)` : undefined, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderBottom: `24px solid ${P.vermelho}` }} />
        {comNumero ? (
          <div style={{ ...num, fontSize: caber(`${v} ${suf ?? ""}`, 260, 84, 50, SORA, 800), color: P.vermelho }}>
            {v}
            {suf ? <span style={{ fontSize: "0.62em", fontWeight: 700, marginLeft: 10 }}>{suf}</span> : null}
          </div>
        ) : (
          <div style={{ fontFamily: SORA, fontWeight: 800, fontSize: caber(m.passou.rotulo ?? "passou", 260, 52, 30, SORA, 800), color: P.vermelho, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{m.passou.rotulo ?? "passou"}</div>
        )}
      </div>
    </>
  );
};

/** fatos do objeto (tipo "objeto"): até 3 linhas que sobem à direita do objeto, uma por fala */
const Fatos: React.FC<{ m: ObjetoMomento }> = ({ m }) => {
  const fatos = m.fatos.slice(0, 3);
  const passo = fatos.length >= 3 ? 190 : 230;
  const y0 = fatos.length >= 3 ? 230 : 300;
  return (
    <>
      {fatos.map((f, i) => {
        const q = quebrar(f.texto, 430, 72, 40, SORA, 800, false, 2);
        return (
          <Sobe key={i} em={f.em} style={{ left: 560, top: y0 + i * passo, width: 450 }}>
            <div style={{ fontFamily: SORA, fontWeight: 800, fontSize: q.px, lineHeight: 1.04, letterSpacing: "-0.025em", color: i === fatos.length - 1 ? P.fundo : P.tinta }}>
              {q.linhas.map((l, k) => (
                <div key={k}>{l}</div>
              ))}
            </div>
            {f.detalhe ? <div style={{ ...serif, fontSize: 40, color: P.tintaSuave, marginTop: 8, whiteSpace: "normal" }}>{f.detalhe}</div> : null}
            <div style={{ width: 120, height: 3, background: P.fundo, opacity: 0.3, marginTop: 14 }} />
          </Sobe>
        );
      })}
    </>
  );
};

export const Selo: React.FC<{ texto: string; em: number }> = ({ texto, em }) => {
  const t = useTempo();
  const a = prog(t, em, em + 0.4, EASE_OUT);
  if (a <= 0) return null;
  return (
    <div style={{ position: "absolute", right: W - (PALCO.x + PALCO.w) - 8, top: PALCO.y + 26, opacity: a * 0.95, transform: a < 1 ? `translateY(${(1 - a) * -10}px)` : undefined }}>
      <div style={{ padding: "8px 18px", borderRadius: 999, border: `1.5px solid ${P.tintaFraca}`, fontFamily: SORA, fontWeight: 500, fontSize: 28, color: P.tintaSuave, letterSpacing: "0.01em", background: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{texto}</div>
    </div>
  );
};

/** a camada dos rótulos: posições da cena (o desenho do vertical) levadas para o quadro da esquerda */
const NaCena: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1080, transformOrigin: "0 0", transform: TRANSFORMA_CENA }}>{children}</div>
);

export const RotulosDoPalco: React.FC<{ cena: Cena }> = ({ cena }) => {
  const t = useTempo();
  const m = cena.m;
  if (m.tipo === "objeto") return t >= cena.T.tem ? <NaCena><Fatos m={m} /></NaCena> : null;
  if (t < Math.min(cena.T.trinta, cena.T.copo) - 0.2) return null;
  return (
    <NaCena>
      <Quantidade cena={cena} m={m} />
      {t >= cena.T.sete - 0.1 ? <Unidades cena={cena} m={m} /> : null}
      {t >= cena.T.ideal - 0.1 ? <Referencia cena={cena} m={m} /> : null}
      <Nivel cena={cena} m={m} />
    </NaCena>
  );
};

/** o selo do momento: aparece logo depois da referência (ou da quantidade) */
export const seloDoMomento = (cena: Cena): { texto: string; em: number } | null => {
  const m = cena.m;
  const texto = m.selo ?? (m.tipo === "medida" && m.ilustrativo ? "ilustrativo" : null);
  if (!texto) return null;
  const em = m.tipo === "medida" && m.referencia ? cena.T.ideal + 0.25 : cena.T.tem + 0.6;
  return { texto, em };
};
