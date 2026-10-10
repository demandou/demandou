// Os 11 blocos universais na linguagem da Torre: o mundo 3D vira fundo (desfocado, a câmera seguindo em
// órbita lenta) e a informação entra como num material de lançamento — números grandes em serifa,
// rótulos em caixa alta espaçada champanhe, pílulas de vidro-noite com borda dourada (as etiquetas dos
// cômodos), filetes dourados que se desenham, prédios que sobem andar por andar no gráfico e a etiqueta
// dourada no fechamento. No 16:9 eles são medidos no espaço do vertical (a metade de cima, 1080 de
// largura) e desenhados no quadro da esquerda (Edicao.tsx, NoQuadro), com a pessoa na moldura da direita.
import React from "react";
import { EASE_IN, EASE_INOUT, EASE_OUT, lerp, numeroBR, prog } from "../anim";
import type { Abertura as TAbertura, Comparacao as TComparacao, Cta as TCta, Definicao as TDefinicao, Destaque as TDestaque, Frase as TFrase, Grafico as TGrafico, Numero as TNumero, Pergunta as TPergunta, Plano, Topicos as TTopicos } from "../plano";
import type { Roteiro } from "../roteiro";
import { encaixar, larguraTexto } from "../texto";
import { FONTE, K } from "../tema";
import { Icone, Pilula, Rise, rotuloCss, serifNum, SOMBRA, temposDoTexto } from "./comum";

type P<M> = { t: number; m: M; plano: Plano; R: Roteiro; fim: number };
const BASE = 930;
const topoDa = (R: Roteiro, t: number) => (R.cabecalho && t >= R.cabecalho.encolhe ? 300 : 210);
const saida = (t: number, fim: number) => prog(t, fim - 0.05, fim + 0.3, EASE_IN);
const Sai: React.FC<{ t: number; fim: number; children: React.ReactNode }> = ({ t, fim, children }) => {
  const s = saida(t, fim);
  if (s >= 1) return null;
  return <div style={{ position: "absolute", inset: 0, opacity: 1 - s, filter: s > 0 ? `${SOMBRA} blur(${s * 10}px)` : SOMBRA, transform: s > 0 ? `translateY(${-s * 24}px)` : undefined }}>{children}</div>;
};
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
/** índices [i, j) das palavras de `trecho` dentro de `toks` (ou null) */
const acharTrecho = (toks: string[], trecho?: string): [number, number] | null => {
  if (!trecho) return null;
  const alvo = trecho.split(/\s+/).filter(Boolean).map(norm);
  for (let i = 0; i + alvo.length <= toks.length; i++) if (alvo.every((a, k) => norm(toks[i + k]) === a)) return [i, i + alvo.length];
  return null;
};

/** palavra que sobe por máscara no instante dito; assentada, vira texto simples */
const PalavraQueSobe: React.FC<{ t: number; em: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ t, em, children, style }) => {
  const p = prog(t, em - 0.06, em + 0.24, EASE_OUT);
  if (p >= 1) return <span style={{ display: "inline-block", whiteSpace: "pre", ...style }}>{children}</span>;
  return (
    <span style={{ display: "inline-block", whiteSpace: "pre", clipPath: "inset(-0.3em -0.2em -0.15em -0.2em)", ...style }}>
      <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 70}%)`, opacity: 0.1 + 0.9 * p }}>{children}</span>
    </span>
  );
};

/* ---------- abertura: "Se eu fosse um" + DESTAQUE grande champanhe + resto em caixa alta espaçada ---------- */
export const Abertura: React.FC<P<TAbertura>> = ({ t, m, plano, R, fim }) => {
  // 16:9: o título fica no quadro da esquerda, centrado na faixa dos blocos (a pessoa está na
  // moldura da direita, não embaixo: não existe o "por cima da cabeça" da ponte do vertical)
  const em = m.em ?? m.de;
  const toks = m.texto.split(/\s+/).filter(Boolean);
  const tempos = temposDoTexto(plano.palavras, m.texto, em, m.ate);
  const ex = prog(t, fim - 0.05, fim + 0.3, EASE_IN);
  if (ex >= 1) return null;
  const yc = (topoDa(R, t) + BASE) / 2 - 40;
  const tr = acharTrecho(toks, m.destaque);
  const caixa = (filho: React.ReactNode) => (
    <div style={{ position: "absolute", left: 0, width: 1080, top: yc, transform: `translateY(-50%) scale(${1 + ex * 0.08})`, opacity: 1 - ex, textAlign: "center", filter: `blur(${ex * 10}px)` }}>{filho}</div>
  );
  if (!tr) {
    const { tamanho, linhas } = encaixar(m.texto, 952, 104, 48, 4, FONTE.sora, 800);
    let k = 0;
    return caixa(
      <div style={{ fontFamily: FONTE.sora, fontWeight: 800, fontSize: tamanho, lineHeight: 1.08, letterSpacing: "-0.02em", color: K.marfim, textShadow: "0 6px 30px rgba(3,6,14,0.6)" }}>
        {linhas.map((l, li) => (
          <div key={li}>
            {l.split(" ").map((w, wi) => {
              const i = k++;
              return (
                <PalavraQueSobe key={wi} t={t} em={tempos[i] ?? em}>
                  {w}
                  {wi < l.split(" ").length - 1 ? " " : ""}
                </PalavraQueSobe>
              );
            })}
          </div>
        ))}
      </div>,
    );
  }
  const lead = toks.slice(0, tr[0]).join(" ");
  const nome = toks.slice(tr[0], tr[1]).join(" ").toLocaleUpperCase("pt-BR");
  const resto = toks.slice(tr[1]).join(" ");
  const tLead = tempos[0] ?? em;
  const tNome = tempos[tr[0]] ?? em;
  const tResto = tempos[tr[1]] ?? tNome + 0.4;
  const a = prog(t, tLead - 0.08, tLead + 0.3);
  const fsNome = Math.max(64, Math.min(124, (124 * 960) / Math.max(1, larguraTexto(nome, 124, FONTE.sora, 800, -0.02))));
  const leadFit = encaixar(lead, 952, 46, 32, 2, FONTE.sora, 600);
  const pr = prog(t, tResto - 0.08, tResto + 0.3);
  const restoFit = encaixar(resto.toLocaleUpperCase("pt-BR"), 952, 36, 24, 2, FONTE.sans, 700, 0.42);
  const letras = Array.from(nome);
  return (
    <>
      {caixa(
        <>
          {lead ? (
            <div style={{ overflow: a >= 1 ? undefined : "hidden" }}>
              <div style={{ transform: a >= 1 ? undefined : `translateY(${(1 - a) * 100}%)`, fontFamily: FONTE.sora, fontWeight: 600, fontSize: leadFit.tamanho, lineHeight: 1.3, letterSpacing: "0.01em", color: "rgba(255,248,242,0.82)" }}>
                {leadFit.linhas.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            </div>
          ) : null}
          <div style={{ marginTop: 6, fontFamily: FONTE.sora, fontWeight: 800, fontSize: fsNome, letterSpacing: "-0.02em", lineHeight: 1, color: K.ouro, textShadow: `0 6px 40px ${K.ouro}55`, whiteSpace: "nowrap" }}>
            {letras.map((ch, i) => {
              const q = prog(t, tNome - 0.06 + i * 0.022, tNome + 0.24 + i * 0.022, EASE_OUT);
              if (q >= 1) return <span key={i} style={{ whiteSpace: "pre" }}>{ch}</span>;
              return (
                <span key={i} style={{ display: "inline-block", opacity: q, transform: `translateY(${(1 - q) * 40}px)`, filter: `blur(${(1 - q) * 8}px)`, whiteSpace: "pre" }}>
                  {ch}
                </span>
              );
            })}
          </div>
        </>,
      )}
      {resto && pr > 0 ? (
        <div style={{ position: "absolute", left: 0, width: 1080, top: yc + 110, textAlign: "center", opacity: pr * (1 - ex), filter: `blur(${(1 - pr) * 8 + ex * 10}px)`, transform: `translateY(${(1 - pr) * 20}px)` }}>
          {restoFit.linhas.map((l, i) => (
            <div key={i} style={{ fontFamily: FONTE.sans, fontWeight: 700, fontSize: restoFit.tamanho, letterSpacing: "0.42em", marginRight: "-0.42em", color: "rgba(255,248,242,0.86)", textShadow: "0 4px 22px rgba(0,0,0,0.6)", lineHeight: 1.4 }}>
              {l}
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
};

/* ---------- tópicos: etiquetas de vidro-noite com borda champanhe, uma por item ---------- */
export const Topicos: React.FC<P<TTopicos>> = ({ t, m, R, fim }) => {
  const topo = topoDa(R, t);
  const n = m.itens.length;
  const fs = n <= 3 ? 56 : n === 4 ? 50 : 44;
  const alturaUtil = BASE - topo - (m.titulo ? 70 : 0);
  let atual = -1;
  m.itens.forEach((it, i) => {
    if (t >= it.em - 0.1) atual = i;
  });
  const blocos = m.itens.map((it) => {
    const f = encaixar(it.texto, 952 - 110, fs, 32, 2, FONTE.sans, 700);
    const h = f.linhas.length * f.tamanho * 1.18 + (it.detalhe ? 42 : 0) + 34;
    return { f, h };
  });
  const total = blocos.reduce((s, b) => s + b.h, 0) + (n - 1) * 26;
  const esc = Math.min(1, alturaUtil / total);
  let y = topo + (m.titulo ? 70 : 0) + Math.max(0, (alturaUtil - total * esc) / 2) * 0.6;
  return (
    <Sai t={t} fim={fim}>
      {m.titulo ? (
        <div style={{ position: "absolute", left: 64, top: topo, width: 952 }}>
          <Rise p={prog(t, m.de - 0.05, m.de + 0.35)}>
            <div style={{ ...rotuloCss, fontSize: 30, whiteSpace: "normal", lineHeight: 1.35 }}>{m.titulo}</div>
          </Rise>
        </div>
      ) : null}
      {m.itens.map((it, i) => {
        const b = blocos[i];
        const top = y;
        y += (b.h + 26) * esc;
        const q = prog(t, it.em - 0.08, it.em + 0.32);
        if (q <= 0) return null;
        return (
          <div key={i} style={{ position: "absolute", left: 64, top, transformOrigin: "0 0", transform: `scale(${esc}) translateY(${(1 - q) * 18}px)`, opacity: q * (i === atual ? 1 : 0.8), filter: q < 1 ? `blur(${(1 - q) * 6}px)` : undefined }}>
            <Pilula style={{ borderRadius: b.f.linhas.length > 1 || it.detalhe ? 30 : 999, alignItems: "flex-start", padding: "14px 30px 16px 22px", gap: 18 }}>
              <div style={{ width: 16, height: 16, marginTop: b.f.tamanho * 0.42, transform: "rotate(45deg)", background: i === atual ? K.ouro : "transparent", border: `2px solid ${K.ouro}`, flexShrink: 0 }} />
              <div>
                {b.f.linhas.map((l, k) => (
                  <div key={k} style={{ fontFamily: FONTE.sans, fontWeight: 700, fontSize: b.f.tamanho, lineHeight: 1.18, color: K.marfim }}>
                    {l}
                  </div>
                ))}
                {it.detalhe ? <div style={{ fontFamily: FONTE.sans, fontWeight: 500, fontSize: 30, color: K.marfimSuave, marginTop: 6, whiteSpace: "normal", maxWidth: 820 }}>{it.detalhe}</div> : null}
              </div>
            </Pilula>
          </div>
        );
      })}
    </Sai>
  );
};

/* ---------- número: o contador grande em serifa na coluna, com filete e rótulo ---------- */
export const Numero: React.FC<P<TNumero>> = ({ t, m, R, fim }) => {
  const topo = topoDa(R, t) + 30;
  const fimConta = Math.max(m.em + 0.6, Math.min(m.em + 1.0, (m.rotuloEm ?? m.em + 1) + 0.2));
  const v = m.valor * prog(t, m.em - 0.05, fimConta, EASE_INOUT);
  const casas = m.casas ?? 0;
  const txt = numeroBR(t >= fimConta ? m.valor : casas ? v : Math.round(v), casas);
  const pin = prog(t, m.em - 0.1, m.em + 0.25);
  const rEm = m.rotuloEm ?? m.em + 0.3;
  const w = larguraTexto(txt, 230, FONTE.serifa, 600) + (m.prefixo ? larguraTexto(m.prefixo, 97, FONTE.serifa, 600) + 14 : 0) + (m.sufixo ? larguraTexto(m.sufixo, 97, FONTE.serifa, 600) + 14 : 0);
  const fs = Math.min(230, (230 * 900) / Math.max(1, w));
  const rot = encaixar(m.rotulo.toLocaleUpperCase("pt-BR"), 900, 34, 24, 3, FONTE.sans, 700, 0.3);
  return (
    <Sai t={t} fim={fim}>
      <div style={{ position: "absolute", left: 64, top: topo }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
          {m.prefixo ? (
            <Rise p={pin} style={{ paddingBottom: fs * 0.08 }}>
              <div style={{ ...serifNum, fontSize: fs * 0.42, color: K.ouroClaro }}>{m.prefixo}</div>
            </Rise>
          ) : null}
          <Rise p={pin} dy={60}>
            <div style={{ ...serifNum, fontSize: fs }}>{txt}</div>
          </Rise>
          {m.sufixo ? (
            <Rise p={pin} style={{ paddingBottom: fs * 0.08 }}>
              <div style={{ ...serifNum, fontSize: fs * 0.42, color: K.ouroClaro }}>{m.sufixo.trim()}</div>
            </Rise>
          ) : null}
        </div>
        <div style={{ height: 2, width: 260 * prog(t, m.em, fimConta + 0.3), background: K.ouro, marginTop: 8, marginBottom: 18 }} />
        <Rise p={prog(t, rEm - 0.06, rEm + 0.3)}>
          {rot.linhas.map((l, i) => (
            <div key={i} style={{ ...rotuloCss, fontSize: rot.tamanho, lineHeight: 1.4 }}>
              {l}
            </div>
          ))}
        </Rise>
        {m.ilustrativo ? <div style={{ marginTop: 14, fontFamily: FONTE.sans, fontWeight: 600, fontSize: 26, color: K.marfimSuave, opacity: prog(t, rEm + 0.2, rEm + 0.6) }}>• ilustrativo</div> : null}
      </div>
    </Sai>
  );
};

/* ---------- comparação: duas fichas de vidro lado a lado; a vencedora ganha o filete dourado ---------- */
export const Comparacao: React.FC<P<TComparacao>> = ({ t, m, R, fim }) => {
  const topo = topoDa(R, t);
  const y0 = topo + (m.titulo ? 80 : 20);
  const H0 = Math.min(520, BASE - y0 - 10);
  const venceu = m.vencedor !== undefined ? prog(t, (m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7) - 0.05, (m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7) + 0.35) : 0;
  const meio = m.modo === "antes-depois" ? "→" : "×";
  return (
    <Sai t={t} fim={fim}>
      {m.titulo ? (
        <div style={{ position: "absolute", left: 64, top: topo, width: 952 }}>
          <Rise p={prog(t, m.de - 0.05, m.de + 0.35)}>
            <div style={{ ...rotuloCss, fontSize: 30, whiteSpace: "normal", lineHeight: 1.35 }}>{m.titulo}</div>
          </Rise>
        </div>
      ) : null}
      {m.lados.map((l, i) => {
        const q = prog(t, l.em - 0.08, l.em + 0.35);
        if (q <= 0) return null;
        const ganhou = m.vencedor === i;
        const perdeu = m.vencedor !== undefined && !ganhou;
        const ruim = m.modo === "errado-certo" && i === 0;
        const f = encaixar(l.texto, 372, 62, 34, 6, FONTE.sans, 700);
        const rot = encaixar(l.rotulo.toLocaleUpperCase("pt-BR"), 372, 30, 20, 2, FONTE.sans, 700, 0.24);
        return (
          <div key={i} style={{ position: "absolute", left: i === 0 ? 64 : 576, top: y0, width: 440, height: H0, transform: `translateY(${(1 - q) * 30}px) scale(${1 + 0.03 * venceu * (ganhou ? 1 : 0)})`, opacity: q * (perdeu ? lerp(1, 0.5, venceu) : 1), filter: q < 1 ? `blur(${(1 - q) * 6}px)` : undefined }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 28, background: K.vidro, border: `${ganhou ? lerp(1.5, 3, venceu) : 1.5}px solid ${ganhou ? K.ouro : "rgba(217,190,138,0.4)"}`, boxShadow: ganhou ? `0 0 ${40 * venceu}px rgba(217,190,138,${0.25 * venceu})` : undefined }} />
            <div style={{ position: "absolute", left: 34, top: 34, right: 34 }}>
              {rot.linhas.map((x, k) => (
                <div key={k} style={{ ...rotuloCss, fontSize: rot.tamanho, letterSpacing: "0.24em", lineHeight: 1.4, color: ruim ? K.alerta : K.ouro }}>
                  {x}
                </div>
              ))}
              <div style={{ height: 2, width: 120 * prog(t, l.em, l.em + 0.5), background: ruim ? K.alerta : K.ouro, margin: "16px 0 20px" }} />
              {f.linhas.map((x, k) => (
                <div key={k} style={{ fontFamily: FONTE.sans, fontWeight: 700, fontSize: f.tamanho, lineHeight: 1.18, color: K.marfim }}>
                  {x}
                </div>
              ))}
            </div>
            {ganhou && venceu > 0 ? (
              <div style={{ position: "absolute", right: 24, bottom: 24, width: 64, height: 64, borderRadius: 64, background: K.ouro, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.6 + 0.4 * venceu})`, opacity: venceu }}>
                <svg width={34} height={34} viewBox="0 0 34 34">
                  <path d="M7 18 L14 25 L28 9" fill="none" stroke={K.noite} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ) : null}
          </div>
        );
      })}
      {prog(t, m.lados[1].em - 0.1, m.lados[1].em + 0.3) > 0 ? (
        <div style={{ position: "absolute", left: 540 - 36, top: y0 + H0 / 2 - 36, width: 72, height: 72, borderRadius: 72, background: K.noite, border: `2px solid ${K.ouro}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTE.serifa, fontWeight: 600, fontSize: 44, color: K.ouroClaro, opacity: prog(t, m.lados[1].em - 0.1, m.lados[1].em + 0.3) }}>
          {meio}
        </div>
      ) : null}
    </Sai>
  );
};

/* ---------- gráfico: barras = prédios que sobem andar por andar; linha = rota dourada; pizza = anel ---------- */
const Predio: React.FC<{ w: number; h: number; seed: number; cor?: string }> = ({ w, h, seed, cor = K.ouro }) => {
  const cols = Math.max(2, Math.floor(w / 26));
  const andares = Math.max(1, Math.floor(h / 24));
  const jan: React.ReactNode[] = [];
  for (let a = 0; a < andares; a++)
    for (let c = 0; c < cols; c++) {
      const r = Math.sin((a * 31 + c * 17 + seed * 13) * 12.9898) * 43758.5453;
      const on = r - Math.floor(r) < 0.62;
      jan.push(<rect key={`${a}-${c}`} x={6 + (c * (w - 12)) / cols + 3} y={h - (a + 1) * 24 + 7} width={(w - 12) / cols - 6} height={12} fill={on ? "rgba(255,214,160,0.85)" : "rgba(60,80,110,0.5)"} />);
    }
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <rect x={0} y={0} width={w} height={h} fill="#111B30" stroke="rgba(217,190,138,0.55)" strokeWidth={1.5} />
      {jan}
      <rect x={-2} y={-3} width={w + 4} height={4} fill={cor} />
    </svg>
  );
};
export const Grafico: React.FC<P<TGrafico>> = ({ t, m, R, fim }) => {
  const topo = topoDa(R, t);
  const y0 = topo + (m.titulo ? 80 : 20);
  const x0 = 64;
  const W0 = 952;
  const H0 = BASE - y0 - 90;
  const un = m.unidade ? ` ${m.unidade}` : "";
  const dados = m.dados ?? [];
  const max = Math.max(1, ...dados.map((d) => d.valor));
  const titulo = m.titulo ? (
    <div style={{ position: "absolute", left: 64, top: topo, width: 952 }}>
      <Rise p={prog(t, m.de - 0.05, m.de + 0.35)}>
        <div style={{ ...rotuloCss, fontSize: 30, whiteSpace: "normal", lineHeight: 1.35 }}>{m.titulo}</div>
      </Rise>
    </div>
  ) : null;
  const ilustr = m.ilustrativo || !dados.length ? <div style={{ position: "absolute", right: 64, top: topo + 6, fontFamily: FONTE.sans, fontWeight: 600, fontSize: 26, color: K.marfimSuave }}>• ilustrativo</div> : null;
  const valorTxt = (v: number) => `${numeroBR(v, Number.isInteger(v) ? 0 : 1)}${un}`;
  if (!dados.length) {
    // tendência sem números: uma linha do horizonte que sobe, cai ou oscila
    const te = m.tendenciaEm ?? m.de + 0.3;
    const p = prog(t, te - 0.05, te + 1.3, EASE_INOUT);
    const N = 9;
    const ys = new Array(N).fill(0).map((_, i) => {
      const f = i / (N - 1);
      const v = m.tendencia === "cai" ? 1 - f * 0.8 : m.tendencia === "oscila" ? 0.5 + 0.3 * Math.sin(f * Math.PI * 3) : 0.2 + f * 0.8;
      return v;
    });
    const bw = (W0 - (N - 1) * 14) / N;
    return (
      <Sai t={t} fim={fim}>
        {titulo}
        {ilustr}
        {ys.map((v, i) => {
          const q = prog(t, te + i * 0.12, te + i * 0.12 + 0.5, EASE_OUT);
          const hh = Math.max(24, Math.round((v * H0 * q) / 24) * 24);
          return q > 0 ? (
            <div key={i} style={{ position: "absolute", left: x0 + i * (bw + 14), top: y0 + H0 - hh, opacity: q }}>
              <Predio w={bw} h={hh} seed={i} />
            </div>
          ) : null;
        })}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <polyline points={ys.map((v, i) => `${x0 + i * (bw + 14) + bw / 2},${y0 + H0 - v * H0 - 30}`).join(" ")} fill="none" stroke={K.ouroClaro} strokeWidth={4} strokeDasharray={3000} strokeDashoffset={3000 * (1 - p)} strokeLinejoin="round" />
        </svg>
      </Sai>
    );
  }
  const n = dados.length;
  if (m.forma === "pizza") {
    const soma = dados.reduce((s, d) => s + d.valor, 0) || 1;
    const R0 = Math.min(220, H0 / 2 - 20);
    const cx = x0 + R0 + 10;
    const cy = y0 + H0 / 2 + 20;
    let acc = 0;
    const tons = [K.ouroClaro, K.ouro, K.ouroFundo, "#7E6A45", "#5B4E36", "#CFC7B4"];
    return (
      <Sai t={t} fim={fim}>
        {titulo}
        {ilustr}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {dados.map((d, i) => {
            const a0 = (acc / soma) * Math.PI * 2;
            acc += d.valor;
            const a1 = (acc / soma) * Math.PI * 2;
            const q = prog(t, d.em - 0.05, d.em + 0.6, EASE_INOUT);
            const am = a0 + (a1 - a0) * q;
            const r = R0 - 28;
            const p0 = [cx + Math.sin(a0) * r, cy - Math.cos(a0) * r];
            const p1 = [cx + Math.sin(am) * r, cy - Math.cos(am) * r];
            return q > 0 ? <path key={i} d={`M ${p0[0]} ${p0[1]} A ${r} ${r} 0 ${am - a0 > Math.PI ? 1 : 0} 1 ${p1[0]} ${p1[1]}`} fill="none" stroke={tons[i % tons.length]} strokeWidth={56} /> : null;
          })}
        </svg>
        <div style={{ position: "absolute", left: cx + R0 + 40, top: cy - n * 48, width: 1016 - (cx + R0 + 40) }}>
          {dados.map((d, i) => {
            const q = prog(t, d.em - 0.08, d.em + 0.3);
            return (
              <Rise key={i} p={q} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 4, background: tons[i % tons.length] }} />
                  <div style={{ ...serifNum, fontSize: 52 }}>{valorTxt(d.valor)}</div>
                </div>
                <div style={{ ...rotuloCss, fontSize: 22, letterSpacing: "0.18em", whiteSpace: "normal", lineHeight: 1.3, marginTop: 4 }}>{d.rotulo}</div>
              </Rise>
            );
          })}
        </div>
      </Sai>
    );
  }
  const gap = 28;
  const bw = Math.min(170, (W0 - gap * (n - 1)) / n);
  const tot = n * bw + (n - 1) * gap;
  const xs = dados.map((_, i) => x0 + (W0 - tot) / 2 + i * (bw + gap));
  const hMax = H0 - 90;
  if (m.forma === "linha") {
    const pts = dados.map((d, i) => [xs[i] + bw / 2, y0 + 70 + hMax - (d.valor / max) * hMax] as [number, number]);
    let comp = 0;
    const segs = pts.slice(1).map((p, i) => {
      const L = Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]);
      comp += L;
      return L;
    });
    let des = 0;
    for (let i = 0; i < segs.length; i++) des += segs[i] * prog(t, dados[i].em, dados[i + 1].em, EASE_INOUT);
    return (
      <Sai t={t} fim={fim}>
        {titulo}
        {ilustr}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1={x0} x2={x0 + W0} y1={y0 + 70 + hMax * f} y2={y0 + 70 + hMax * f} stroke="rgba(236,242,255,0.12)" strokeWidth={1.5} />
          ))}
          <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={K.ouroClaro} strokeWidth={5} strokeDasharray={comp + 1} strokeDashoffset={comp + 1 - des} strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, i) => (prog(t, dados[i].em - 0.05, dados[i].em + 0.2) > 0 ? <circle key={i} cx={p[0]} cy={p[1]} r={11 * prog(t, dados[i].em - 0.05, dados[i].em + 0.2)} fill={K.ouro} stroke={K.noite} strokeWidth={3} /> : null))}
        </svg>
        {dados.map((d, i) => {
          const q = prog(t, d.em - 0.05, d.em + 0.3);
          return q > 0 ? (
            <React.Fragment key={i}>
              <div style={{ position: "absolute", left: pts[i][0], top: pts[i][1] - 18, transform: "translate(-50%, -100%)", opacity: q, ...serifNum, fontSize: 50 }}>{valorTxt(d.valor)}</div>
              <div style={{ position: "absolute", left: xs[i] - gap / 2, width: bw + gap, top: y0 + 70 + hMax + 22, textAlign: "center", opacity: q, ...rotuloCss, fontSize: 22, letterSpacing: "0.14em", whiteSpace: "normal", lineHeight: 1.3 }}>{d.rotulo}</div>
            </React.Fragment>
          ) : null;
        })}
      </Sai>
    );
  }
  return (
    <Sai t={t} fim={fim}>
      {titulo}
      {ilustr}
      <div style={{ position: "absolute", left: x0, width: W0, top: y0 + 70 + hMax, height: 2, background: "rgba(217,190,138,0.5)" }} />
      {dados.map((d, i) => {
        const q = prog(t, d.em - 0.05, d.em + 0.7, EASE_OUT);
        if (q <= 0) return null;
        const alvo = Math.max(24, (d.valor / max) * hMax);
        const hh = Math.max(24, Math.min(alvo, Math.round((alvo * q) / 24) * 24));
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: xs[i], top: y0 + 70 + hMax - hh }}>
              <Predio w={bw} h={hh} seed={i + 3} />
            </div>
            <div style={{ position: "absolute", left: xs[i] + bw / 2, top: y0 + 70 + hMax - hh - 14, transform: "translate(-50%, -100%)", ...serifNum, fontSize: Math.min(56, (bw * 1.6 * 56) / Math.max(1, larguraTexto(valorTxt(d.valor), 56, FONTE.serifa, 600))), opacity: prog(t, d.em, d.em + 0.3) }}>
              {valorTxt(d.valor)}
            </div>
            <div style={{ position: "absolute", left: xs[i] - gap / 2, width: bw + gap, top: y0 + 70 + hMax + 18, textAlign: "center", opacity: prog(t, d.em, d.em + 0.3), ...rotuloCss, fontSize: 22, letterSpacing: "0.14em", whiteSpace: "normal", lineHeight: 1.3 }}>
              {d.rotulo}
            </div>
          </React.Fragment>
        );
      })}
    </Sai>
  );
};

/* ---------- destaque: a frase curta grande, filete que se desenha ---------- */
export const Destaque: React.FC<P<TDestaque>> = ({ t, m, R, fim }) => {
  const topo = topoDa(R, t);
  const cor = m.nivel === "alerta" ? K.alerta : K.marfim;
  const f = encaixar(m.texto, 952, 116, 56, 3, FONTE.sora, 800);
  const hTxt = f.linhas.length * f.tamanho * 1.06;
  const yc = (topo + BASE) / 2;
  const top = yc - (hTxt + (m.detalhe ? 90 : 40)) / 2;
  const dEm = m.detalheEm ?? m.em + 0.6;
  return (
    <Sai t={t} fim={fim}>
      <div style={{ position: "absolute", left: 64, width: 952, top, textAlign: "center" }}>
        {f.linhas.map((l, i) => (
          <Rise key={i} p={prog(t, m.em - 0.06 + i * 0.12, m.em + 0.34 + i * 0.12)} dy={50} style={{ paddingBottom: 0 }}>
            <div style={{ fontFamily: FONTE.sora, fontWeight: 800, fontSize: f.tamanho, lineHeight: 1.06, letterSpacing: "-0.02em", color: cor }}>{l}</div>
          </Rise>
        ))}
        <div style={{ height: 3, width: 300 * prog(t, m.em + 0.2, m.em + 0.8, EASE_INOUT), background: m.nivel === "alerta" ? K.alerta : K.ouro, margin: "22px auto 18px" }} />
        {m.detalhe ? (
          <Rise p={prog(t, dEm - 0.06, dEm + 0.3)}>
            <div style={{ ...rotuloCss, fontSize: 30, whiteSpace: "normal", lineHeight: 1.4 }}>{m.detalhe}</div>
          </Rise>
        ) : null}
      </div>
    </Sai>
  );
};

/* ---------- definição: o termo em serifa grande, filete, o significado ---------- */
export const Definicao: React.FC<P<TDefinicao>> = ({ t, m, R, fim }) => {
  const topo = topoDa(R, t) + 20;
  const ft = encaixar(m.termo, 952, 150, 72, 2, FONTE.serifa, 600);
  const fsg = encaixar(m.significado, 952, 58, 34, 4, FONTE.sans, 600);
  return (
    <Sai t={t} fim={fim}>
      <div style={{ position: "absolute", left: 64, top: topo, width: 952 }}>
        {ft.linhas.map((l, i) => (
          <Rise key={i} p={prog(t, m.em - 0.06 + i * 0.1, m.em + 0.34 + i * 0.1)} dy={60}>
            <div style={{ ...serifNum, fontSize: ft.tamanho, lineHeight: 1.0, whiteSpace: "nowrap" }}>{l}</div>
          </Rise>
        ))}
        <div style={{ height: 2, width: 260 * prog(t, m.em + 0.2, m.significadoEm + 0.2, EASE_INOUT), background: K.ouro, margin: "20px 0 26px" }} />
        {fsg.linhas.map((l, i) => (
          <Rise key={i} p={prog(t, m.significadoEm - 0.06 + i * 0.1, m.significadoEm + 0.3 + i * 0.1)}>
            <div style={{ fontFamily: FONTE.sans, fontWeight: 600, fontSize: fsg.tamanho, lineHeight: 1.2, color: "rgba(245,240,230,0.9)" }}>{l}</div>
          </Rise>
        ))}
      </div>
    </Sai>
  );
};

/* ---------- frase: palavra por palavra, trecho em champanhe, risco dourado ---------- */
export const Frase: React.FC<P<TFrase>> = ({ t, m, plano, R, fim }) => {
  const topo = topoDa(R, t);
  const em = m.em ?? m.de;
  const toks = m.texto.split(/\s+/).filter(Boolean);
  const tempos = temposDoTexto(plano.palavras, m.texto, em, m.ate);
  const dest = acharTrecho(toks, m.destaque);
  const risco = acharTrecho(toks, m.risco);
  const f = encaixar(m.texto, 900, 74, 44, 5, FONTE.sora, 700);
  const yc = (topo + BASE) / 2;
  const top = yc - (f.linhas.length * f.tamanho * 1.16) / 2;
  const pr = risco ? prog(t, (m.riscoEm ?? tempos[risco[0]]) - 0.05, (m.riscoEm ?? tempos[risco[0]]) + 0.45, EASE_INOUT) : 0;
  let k = 0;
  return (
    <Sai t={t} fim={fim}>
      <div style={{ position: "absolute", left: 56, top: top - 120, fontFamily: FONTE.serifa, fontWeight: 600, fontSize: 200, color: K.ouro, opacity: 0.55 * prog(t, em - 0.1, em + 0.3), lineHeight: 1 }}>“</div>
      <div style={{ position: "absolute", left: 90, width: 900, top, textAlign: "center" }}>
        {f.linhas.map((l, li) => (
          <div key={li} style={{ fontFamily: FONTE.sora, fontWeight: 700, fontSize: f.tamanho, lineHeight: 1.16, letterSpacing: "-0.015em", color: K.marfim }}>
            {l.split(" ").map((w, wi, arr) => {
              const i = k++;
              const emDest = dest && i >= dest[0] && i < dest[1];
              const emRisco = risco && i >= risco[0] && i < risco[1];
              return (
                <span key={wi} style={{ position: "relative", display: "inline-block" }}>
                  <PalavraQueSobe t={t} em={tempos[i] ?? em} style={{ color: emDest ? K.ouroClaro : undefined, opacity: emRisco ? lerp(1, 0.55, pr) : undefined }}>
                    {w}
                    {wi < arr.length - 1 ? " " : ""}
                  </PalavraQueSobe>
                  {emRisco && pr > 0 ? <span style={{ position: "absolute", left: 0, top: "54%", height: 5, width: `${pr * 100}%`, background: K.ouro, borderRadius: 3 }} /> : null}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </Sai>
  );
};

/* ---------- pergunta: o texto palavra por palavra + opções em etiquetas ---------- */
export const Pergunta: React.FC<P<TPergunta>> = ({ t, m, plano, R, fim }) => {
  // 16:9: no quadro da esquerda, como no palco (a pessoa está na moldura da direita)
  const topo = topoDa(R, t) + 10;
  const em = m.em ?? m.de;
  const tempos = temposDoTexto(plano.palavras, m.texto, em, m.ate);
  const ops = m.opcoes ?? [];
  const f = encaixar(m.texto, 952, ops.length ? 72 : 96, 44, ops.length ? 3 : 4, FONTE.sora, 800);
  const hTxt = f.linhas.length * f.tamanho * 1.08;
  const top = ops.length ? topo : (topo + BASE) / 2 - hTxt / 2;
  let k = 0;
  return (
    <Sai t={t} fim={fim}>
      <div style={{ position: "absolute", left: 64, width: 952, top, textAlign: ops.length ? "left" : "center" }}>
        {f.linhas.map((l, li) => (
          <div key={li} style={{ fontFamily: FONTE.sora, fontWeight: 800, fontSize: f.tamanho, lineHeight: 1.08, letterSpacing: "-0.02em", color: K.marfim }}>
            {l.split(" ").map((w, wi, arr) => {
              const i = k++;
              return (
                <PalavraQueSobe key={wi} t={t} em={tempos[i] ?? em}>
                  {w}
                  {wi < arr.length - 1 ? " " : ""}
                </PalavraQueSobe>
              );
            })}
          </div>
        ))}
        <div style={{ height: 3, width: 200 * prog(t, em + 0.2, em + 0.8, EASE_INOUT), background: K.ouro, margin: ops.length ? "22px 0 26px" : "22px auto 0" }} />
      </div>
      {ops.map((o, i) => {
        const q = prog(t, o.em - 0.08, o.em + 0.32);
        if (q <= 0) return null;
        const y = top + hTxt + 70 + i * Math.min(100, (BASE - (top + hTxt + 70)) / Math.max(1, ops.length));
        return (
          <div key={i} style={{ position: "absolute", left: 64, top: y, opacity: q, transform: `translateY(${(1 - q) * 16}px)` }}>
            <Pilula>
              <span style={{ ...serifNum, fontSize: 46, color: K.ouroClaro, lineHeight: 1 }}>{String.fromCharCode(65 + i)}</span>
              <span style={{ fontFamily: FONTE.sans, fontWeight: 700, fontSize: Math.min(42, (42 * 820) / Math.max(1, larguraTexto(o.texto, 42, FONTE.sans, 700))), color: K.marfim }}>{o.texto}</span>
            </Pilula>
          </div>
        );
      })}
    </Sai>
  );
};

/* ---------- fechamento: a etiqueta dourada com o pedido (ícone + texto) ---------- */
export const Cta: React.FC<P<TCta>> = ({ t, m, plano, R, fim }) => {
  const em = m.em ?? m.de;
  const p = prog(t, em - 0.04, em + 0.7, EASE_OUT);
  if (p <= 0) return null;
  const s = saida(t, fim);
  if (s >= 1) return null;
  const toks = m.texto.split(/\s+/).filter(Boolean);
  const tempos = temposDoTexto(plano.palavras, m.texto, em, m.ate);
  const dest = acharTrecho(toks, m.destaque);
  const W0 = 900;
  const tip = 70;
  const f = encaixar(m.texto, W0 - tip - 190, 66, 38, 3, FONTE.sora, 800);
  const H0 = Math.max(250, f.linhas.length * f.tamanho * 1.12 + 110);
  // 16:9: a etiqueta fica no meio da faixa do quadro da esquerda
  const topo = Math.max(topoDa(R, t), (topoDa(R, t) + BASE) / 2 - H0 / 2 - 20);
  const rot = (1 - p) * -11;
  let k = 0;
  return (
    <div style={{ position: "absolute", left: 540 - W0 / 2 + 10, top: topo, width: W0, height: H0, transformOrigin: `${tip * 0.75}px ${H0 / 2}px`, transform: `translateY(${(1 - p) * -90}px) rotate(${rot}deg)`, opacity: prog(t, em - 0.04, em + 0.22) * (1 - s), filter: `drop-shadow(0 22px 40px rgba(0,0,0,0.55))${s > 0 ? ` blur(${s * 8}px)` : ""}` }}>
      <svg width={260} height={500} style={{ position: "absolute", left: tip * 0.75 - 250, top: H0 / 2 - 480, overflow: "visible" }}>
        <path d={`M 250 480 C 230 360, 120 250, ${-60} 0`} fill="none" stroke={K.ouro} strokeWidth={2.4} strokeDasharray="600" strokeDashoffset={600 * (1 - p)} />
      </svg>
      <div style={{ position: "absolute", inset: 0, clipPath: `polygon(${tip}px 0, 100% 0, 100% 100%, ${tip}px 100%, 0 50%)`, background: `linear-gradient(120deg, ${K.ouroFundo}, ${K.ouroClaro} 38%, ${K.ouro} 62%, ${K.ouroFundo})` }} />
      <div style={{ position: "absolute", inset: 3, clipPath: `polygon(${tip - 1}px 0, 100% 0, 100% 100%, ${tip - 1}px 100%, 0 50%)`, background: "linear-gradient(160deg, #111C33, #0A1222 70%)" }} />
      <div style={{ position: "absolute", left: tip * 0.75 - 15, top: H0 / 2 - 15, width: 30, height: 30, borderRadius: 30, background: K.noite, border: `3px solid ${K.ouro}` }} />
      <div style={{ position: "absolute", left: tip + 40, top: H0 / 2 - 44, width: 88, height: 88, borderRadius: 88, border: `2.5px solid ${K.ouro}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: prog(t, em, em + 0.4) }}>
        <Icone nome={m.icone ?? "link"} tam={42} cor={K.ouroClaro} />
      </div>
      <div style={{ position: "absolute", left: tip + 160, right: 34, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {f.linhas.map((l, li) => (
          <div key={li} style={{ fontFamily: FONTE.sora, fontWeight: 800, fontSize: f.tamanho, lineHeight: 1.12, letterSpacing: "-0.015em", color: K.marfim }}>
            {l.split(" ").map((w, wi, arr) => {
              const i = k++;
              const d = dest && i >= dest[0] && i < dest[1];
              return (
                <PalavraQueSobe key={wi} t={t} em={tempos[i] ?? em} style={{ color: d ? K.ouroClaro : undefined }}>
                  {w}
                  {wi < arr.length - 1 ? " " : ""}
                </PalavraQueSobe>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

