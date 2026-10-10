// A assinatura: a cena de escala. A câmera recua (ou mergulha) até mostrar a origem no alto à
// esquerda e o destino à direita, acima da moldura. A luz (ou o que viaja) vai de um ao outro com o
// relógio contando o tempo dito; a cota mostra a distância dita; no evento a origem apaga, acende
// ou explode, e a última frente de luz viaja até o destino, que continua aceso (ou acende) até ela
// chegar. Porte do G5 do Reel "Conteúdo 2.0" (professor de ciências), com tudo virando campo.
import React from "react";
import * as THREE from "three";
import { Easing } from "remotion";
import type { CorpoNaCena, EstadoDoCorpo } from "../espaco/Corpos";
import { LUMINOSOS } from "../espaco/Corpos";
import { DESTINO, ORIGEM, R_DESTINO, R_ORIGEM, type Estacao, projetar } from "../espaco/camera";
import type { Orbita, Plano } from "../plano";
import { COR, EASE_IN, EASE_INOUT, EASE_OUT, MONO, SORA, clamp01, inOut, numeroBR, prog } from "../tema";

// ——— tempos (todos saem das palavras do plano) ———
export const temposDaOrbita = (m: Orbita) => {
  const ev = m.evento ? (m.evento.gestoEm ?? m.evento.em) : null;
  return {
    A: m.de,
    // fóton: sai da origem na palavra de saída e chega no destino na palavra de chegada
    phA: m.viagem ? m.viagem.em + 0.03 : null,
    phB: m.viagem ? m.viagem.chegaEm + 0.1 : null,
    ev,
    // a última frente de luz chega no destino
    frenteB: m.evento?.chegaEm !== undefined && ev !== null ? Math.max(ev + 0.4, m.evento.chegaEm + 0.12) : null,
  };
};

const RESPIRA = Easing.bezier(0.3, 0.7, 0.4, 1);
const bump = (t: number, c: number, larg: number) => Math.max(0, 1 - Math.abs(t - c) / larg);

export const estadoOrigem = (m: Orbita, t: number): EstadoDoCorpo => {
  const T = temposDaOrbita(m);
  const vis = 1;
  if (T.ev === null || !m.evento) return { vis, off: 0, flash: 0, boost: 1 };
  const ev = T.ev;
  if (m.evento.efeito === "acende") {
    return { vis, off: 1 - prog(t, ev - 0.04, ev + 0.6, RESPIRA), flash: 0.35 * bump(t, ev + 0.1, 0.3), boost: 1 + 0.1 * bump(t, ev + 0.3, 0.6) };
  }
  if (m.evento.efeito === "explode") {
    return {
      vis,
      off: prog(t, ev + 0.3, ev + 1.3, RESPIRA),
      flash: bump(t, ev + 0.08, 0.3),
      inchar: 1 + 0.45 * prog(t, ev, ev + 0.35, EASE_OUT),
      boost: 1 + 0.12 * prog(t, ev - 0.75, ev, EASE_INOUT),
    };
  }
  // apaga: respira levemente antes (a pessoa "segura" o Sol) e apaga em brasa
  return { vis, off: prog(t, ev - 0.04, ev + 0.7, RESPIRA), flash: 0, boost: 1 + 0.08 * prog(t, ev - 0.75, ev, EASE_INOUT) };
};

export const estadoDestino = (m: Orbita, t: number): EstadoDoCorpo => {
  const T = temposDaOrbita(m);
  const flashFoton = T.phB !== null ? bump(t, T.phB, 0.35) * prog(t, T.phB - 0.3, T.phB) : 0;
  let dia = 1;
  let flash = flashFoton;
  if (m.evento && T.frenteB !== null) {
    if (m.evento.efeito === "apaga") dia = 1 - prog(t, T.frenteB - 0.05, T.frenteB + 0.45, EASE_INOUT);
    else if (m.evento.efeito === "acende") dia = prog(t, T.frenteB - 0.05, T.frenteB + 0.45, EASE_INOUT);
    else flash = Math.max(flash, bump(t, T.frenteB, 0.4));
  } else if (m.evento?.efeito === "acende" && T.ev !== null) {
    dia = prog(t, T.ev, T.ev + 0.6);
  }
  // um corpo não luminoso como destino escurece ("apaga") junto com o dia
  return { vis: 1, off: 1 - dia, flash, dia };
};

export const corposDaOrbita = (e: Estacao): CorpoNaCena[] => {
  const m = e.m as Orbita;
  const pO = ORIGEM.clone().add(e.base);
  const pD = DESTINO.clone().add(e.base);
  const origem: CorpoNaCena = {
    id: `o${m.de}`,
    corpo: m.origem.corpo,
    pos: pO,
    r: m.origem.corpo === "galaxia" ? R_ORIGEM * 1.6 : R_ORIGEM,
    cor: m.origem.cor,
    simbolo: m.origem.simbolo,
    anel: m.origem.anel,
    estado: (t) => estadoOrigem(m, t),
  };
  const destino: CorpoNaCena = {
    id: `d${m.de}`,
    corpo: m.destino.corpo,
    pos: pD,
    r: R_DESTINO,
    cor: m.destino.cor,
    simbolo: m.destino.simbolo,
    anel: m.destino.anel,
    luz: LUMINOSOS.has(m.origem.corpo) ? pO : undefined,
    estado: (t) => estadoDestino(m, t),
  };
  return [origem, destino];
};

// ——— 2D presos ao 3D ———
type V = { x: number; y: number };
const at = (A: V, B: V, u: number) => ({ x: A.x + (B.x - A.x) * u, y: A.y + (B.y - A.y) * u });

const geometria = (plano: Plano, e: Estacao, t: number) => {
  const s = projetar(plano, ORIGEM.clone().add(e.base), t);
  const d = projetar(plano, DESTINO.clone().add(e.base), t);
  const rS = R_ORIGEM * s.k;
  const rE = R_DESTINO * d.k;
  const dx = d.x - s.x;
  const dy = d.y - s.y;
  const L = Math.max(1, Math.hypot(dx, dy));
  const u = { x: dx / L, y: dy / L };
  const A = { x: s.x + u.x * rS * 1.03, y: s.y + u.y * rS * 1.03 };
  const B = { x: d.x - u.x * rE * 1.18, y: d.y - u.y * rE * 1.18 };
  return { s, d, rS, rE, u, A, B, n: { x: u.y, y: -u.x } };
};

// o calor em volta da origem luminosa (fica atrás do 3D, no fundo)
export const CoronaDaOrbita: React.FC<{ plano: Plano; e: Estacao; t: number; ceuEm: number | null }> = ({ plano, e, t, ceuEm }) => {
  const m = e.m as Orbita;
  if (!LUMINOSOS.has(m.origem.corpo)) return null;
  const g = geometria(plano, e, t);
  const st = estadoOrigem(m, t);
  const quente = (1 - st.off) * (ceuEm !== null ? 1 - prog(t, ceuEm, ceuEm + 0.8, EASE_INOUT) : 1);
  if (quente <= 0.01) return null;
  const r = g.rS * (st.inchar ?? 1);
  const fria = m.origem.corpo === "estrela";
  const c = fria ? ["rgba(200,220,255,0.5)", "rgba(170,195,255,0.2)", "rgba(150,180,255,0.07)", "rgba(150,180,255,0.02)", "rgba(150,180,255,0)"] : ["rgba(244,160,118,0.55)", "rgba(226,128,90,0.22)", "rgba(217,119,87,0.08)", "rgba(217,119,87,0.025)", "rgba(217,119,87,0)"];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: quente * (1 + 0.6 * st.flash),
        background: `radial-gradient(circle at ${g.s.x}px ${g.s.y}px, ${c[0]} ${r * 0.96}px, ${c[1]} ${r * 1.18}px, ${c[2]} ${r * 1.8}px, ${c[3]} ${r * 3}px, ${c[4]} ${r * 4.4}px)`,
      }}
    />
  );
};

// atrás da pessoa: o feixe origem → destino, o fóton e a última frente de luz
export const CaminhoDaLuz: React.FC<{ plano: Plano; e: Estacao; t: number; ceuEm: number | null }> = ({ plano, e, t, ceuEm }) => {
  const m = e.m as Orbita;
  const T = temposDaOrbita(m);
  if (T.phA === null && T.ev === null) return null;
  const inicio = Math.min(T.phA ?? Infinity, T.ev ?? Infinity) - 0.05;
  const fimCeu = ceuEm !== null ? ceuEm + 0.5 : Infinity;
  if (t < inicio || t > Math.min(fimCeu, e.fim)) return null;
  const g = geometria(plano, e, t);
  const { A, B, u } = g;
  const fade = (ceuEm !== null ? 1 - prog(t, ceuEm, ceuEm + 0.4, EASE_IN) : 1) * (1 - prog(t, e.ate, e.ate + 0.4, EASE_IN));
  const flui = -(t * 220) % 1000;
  const u1 = T.phA !== null && T.phB !== null ? clamp01((t - T.phA) / Math.max(0.2, T.phB - T.phA)) : 0;
  const ev = T.ev;
  const efeito = m.evento?.efeito;
  const u2 = ev !== null && T.frenteB !== null ? clamp01((t - ev) / Math.max(0.2, T.frenteB - ev)) : ev !== null && t >= ev ? 1 : 0;
  const head = at(A, B, u1);
  const cauda = at(A, B, Math.max(0, u1 - 0.32));
  const frente = at(A, B, u2);
  // trecho com luz
  let lit0 = 0;
  let lit1 = u1;
  if (ev !== null && t >= ev && efeito === "apaga") lit0 = u2;
  if (ev !== null && efeito !== "apaga") {
    if (t >= ev) {
      lit0 = 0;
      lit1 = Math.max(u1, u2);
    } else if (T.phA === null) lit1 = 0;
  }
  const litA = at(A, B, lit0);
  const litB = at(A, B, lit1);
  const pulsoEm = m.aviso ? m.aviso.em + 0.9 : (ev ?? 0) + 2.1;
  const brilhando = m.evento ? inOut(t, pulsoEm, pulsoEm + 0.6, 0.25, 0.4) : 0;
  const pulso = 1 + 0.35 * brilhando;
  const temLuz = lit1 > lit0 + 0.001 && (efeito !== "apaga" || T.frenteB === null || t < T.frenteB + 0.05);
  const ping = T.phB !== null ? clamp01((t - T.phB) / 0.7) : 0;
  const pingFrente = T.frenteB !== null && efeito !== "apaga" ? clamp01((t - T.frenteB) / 0.7) : 0;
  // frente de onda (arco centrado na origem)
  const R = Math.hypot(frente.x - g.s.x, frente.y - g.s.y);
  const base = Math.atan2(u.y, u.x);
  const arcos: React.ReactNode[] = [];
  if (ev !== null && t >= ev && (T.frenteB === null || t < T.frenteB + 0.35)) {
    const fa = prog(t, ev, ev + 0.25) * (T.frenteB !== null ? 1 - prog(t, T.frenteB, T.frenteB + 0.3) : 1 - prog(t, ev + 1.2, ev + 1.6));
    const span = 0.8;
    for (let k = -10; k < 10; k++) {
      const a0 = base + (k / 10) * span;
      const a1 = base + ((k + 1) / 10) * span;
      const o = Math.pow(1 - Math.abs(k + 0.5) / 10, 1.3);
      const dp = `M ${g.s.x + Math.cos(a0) * R} ${g.s.y + Math.sin(a0) * R} A ${R} ${R} 0 0 1 ${g.s.x + Math.cos(a1) * R} ${g.s.y + Math.sin(a1) * R}`;
      arcos.push(<path key={`g${k}`} d={dp} stroke={COR.sol} strokeWidth={14} fill="none" opacity={o * 0.18 * fa} />);
      arcos.push(<path key={k} d={dp} stroke={COR.quente} strokeWidth={3.5} fill="none" opacity={o * 0.95 * fa} />);
    }
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: fade }}>
      <defs>
        <linearGradient id="orb-cauda" gradientUnits="userSpaceOnUse" x1={cauda.x} y1={cauda.y} x2={head.x} y2={head.y}>
          <stop offset="0" stopColor={COR.sol} stopOpacity={0} />
          <stop offset="1" stopColor={COR.quente} stopOpacity={0.95} />
        </linearGradient>
        <radialGradient id="orb-foton">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.25" stopColor={COR.quente} stopOpacity={0.85} />
          <stop offset="1" stopColor={COR.sol} stopOpacity={0} />
        </radialGradient>
      </defs>
      {ev !== null && t >= ev && efeito === "apaga" && <line x1={A.x} y1={A.y} x2={frente.x} y2={frente.y} stroke="rgba(255,240,228,0.20)" strokeWidth={2} strokeDasharray="4 12" />}
      {temLuz && (
        <>
          <line x1={litA.x} y1={litA.y} x2={litB.x} y2={litB.y} stroke={COR.sol} strokeOpacity={0.28 * pulso} strokeWidth={10} strokeLinecap="round" />
          <line x1={litA.x} y1={litA.y} x2={litB.x} y2={litB.y} stroke={COR.solClaro} strokeOpacity={0.85} strokeWidth={2.4} strokeLinecap="round" />
          <line x1={litA.x} y1={litA.y} x2={litB.x} y2={litB.y} stroke={COR.quente} strokeOpacity={0.9 * Math.min(1, pulso)} strokeWidth={3.2} strokeDasharray="22 46" strokeDashoffset={flui} strokeLinecap="round" />
        </>
      )}
      {arcos}
      {ev !== null && t >= ev && (T.frenteB === null || t < T.frenteB + 0.05) && <circle cx={frente.x} cy={frente.y} r={7} fill={COR.quente} opacity={prog(t, ev, ev + 0.2)} />}
      {u1 > 0 && u1 < 1 && (
        <>
          <line x1={cauda.x} y1={cauda.y} x2={head.x} y2={head.y} stroke="url(#orb-cauda)" strokeWidth={5} strokeLinecap="round" />
          <circle cx={head.x} cy={head.y} r={30} fill="url(#orb-foton)" />
          <circle cx={head.x} cy={head.y} r={6.5} fill="#FFFFFF" />
        </>
      )}
      {ping > 0 && ping < 1 && <circle cx={g.d.x} cy={g.d.y} r={g.rE * (1.15 + 1.1 * EASE_OUT(ping))} fill="none" stroke={COR.quente} strokeWidth={2.5} opacity={(1 - ping) * 0.8} />}
      {pingFrente > 0 && pingFrente < 1 && <circle cx={g.d.x} cy={g.d.y} r={g.rE * (1.15 + 1.1 * EASE_OUT(pingFrente))} fill="none" stroke={COR.quente} strokeWidth={2.5} opacity={(1 - pingFrente) * 0.8} />}
    </svg>
  );
};

// a explosão: onda de choque e fragmentos (2D, em cima do 3D)
export const Explosao: React.FC<{ plano: Plano; e: Estacao; t: number }> = ({ plano, e, t }) => {
  const m = e.m as Orbita;
  const T = temposDaOrbita(m);
  if (m.evento?.efeito !== "explode" || T.ev === null || t < T.ev || t > T.ev + 2.2) return null;
  const g = geometria(plano, e, t);
  const p = clamp01((t - T.ev) / 1.6);
  const q = EASE_OUT(p);
  const frags = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2 + Math.sin(i * 12.9898) * 0.4;
    const v = 0.6 + 0.4 * Math.abs(Math.sin(i * 78.233));
    const d = g.rS * (1.1 + 1.4 * q * v);
    return { x: g.s.x + Math.cos(a) * d, y: g.s.y + Math.sin(a) * d, r: 2 + 3 * Math.abs(Math.sin(i * 3.1)) };
  });
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "screen" }}>
      <circle cx={g.s.x} cy={g.s.y} r={g.rS * (1.1 + 1.5 * q)} fill="none" stroke={COR.quente} strokeWidth={4 + 10 * (1 - p)} opacity={(1 - p) * (1 - p) * 0.9} />
      <circle cx={g.s.x} cy={g.s.y} r={g.rS * (1.0 + 1.1 * q)} fill="none" stroke={COR.sol} strokeWidth={18} opacity={(1 - p) * (1 - p) * 0.35} />
      {frags.map((f, i) => (
        <circle key={i} cx={f.x} cy={f.y} r={f.r} fill={i % 3 ? COR.solClaro : COR.quente} opacity={(1 - p) * 0.9} />
      ))}
    </svg>
  );
};

const relogio = (seg: number) => {
  const s = Math.max(0, Math.floor(seg));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
export const valorDoRelogio = (valor: number, unidade: string | undefined, casas: number | undefined, u: number) => {
  const un = (unidade ?? "s").trim();
  if ((un === "s" || un === "seg" || un === "segundos") && valor < 6000) return { numero: relogio(u * valor), sufixo: "" };
  const c = casas ?? (Number.isInteger(valor) ? 0 : 1);
  return { numero: numeroBR(u * valor, c), sufixo: un };
};

// a cota com a distância: o número em mono, o resto em Sora
const Cota: React.FC<{ texto: string }> = ({ texto }) => {
  const mm = texto.match(/^([\d.,]+)(.*)$/);
  return mm ? (
    <>
      <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 44, color: COR.branco, letterSpacing: "-0.01em" }}>{mm[1]}</span>
      <span style={{ fontFamily: SORA, fontWeight: 600, fontSize: 36, color: COR.branco }}>{mm[2]}</span>
    </>
  ) : (
    <span style={{ fontFamily: SORA, fontWeight: 600, fontSize: 36, color: COR.branco }}>{texto}</span>
  );
};

// na frente: relógio, cota, nomes e o aviso no destino
export const RotulosDaOrbita: React.FC<{ plano: Plano; e: Estacao; t: number; ceuEm: number | null }> = ({ plano, e, t, ceuEm }) => {
  const m = e.m as Orbita;
  const T = temposDaOrbita(m);
  if (t < m.de || t > e.fim) return null;
  const g = geometria(plano, e, t);
  const fade = (ceuEm !== null ? 1 - prog(t, ceuEm - 0.02, ceuEm + 0.35, EASE_IN) : 1) * (1 - prog(t, e.ate, e.ate + 0.35, EASE_IN));
  if (fade <= 0) return null;
  // relógio
  const v = m.viagem;
  const temFase2 = T.ev !== null && T.frenteB !== null;
  const inicio1 = v ? v.em - 0.08 : null;
  const inicio2 = temFase2 ? (T.ev as number) + 0.12 : null;
  const cA = prog(t, inicio1 ?? (inicio2 as number) - 0.2, (inicio1 ?? (inicio2 as number) - 0.2) + 0.38);
  const fase2 = inicio2 !== null && t >= inicio2;
  const u = fase2
    ? clamp01((t - (inicio2 as number)) / Math.max(0.2, (T.frenteB as number) - (inicio2 as number)))
    : T.phA !== null && T.phB !== null
      ? clamp01((t - T.phA) / Math.max(0.2, T.phB - T.phA))
      : 0;
  const troca = fase2 && v ? prog(t, inicio2 as number, (inicio2 as number) + 0.28) : 1;
  const chegou = fase2 ? t >= (T.frenteB as number) : T.phB !== null && t >= T.phB;
  const acerto = chegou ? prog(t, (fase2 ? (T.frenteB as number) : (T.phB as number)) - 0.02, (fase2 ? (T.frenteB as number) : (T.phB as number)) + 0.25) : 0;
  const rotulo = fase2 ? (m.evento?.rotulo ?? v?.rotulo ?? "") : (v?.rotulo ?? "");
  const valor = v?.valor;
  const mostra = v !== undefined || temFase2;
  const num = valor !== undefined ? valorDoRelogio(valor, v?.unidade, v?.casas, u) : null;
  // cota
  const off = 74;
  const dA = { x: g.A.x + g.n.x * off, y: g.A.y + g.n.y * off };
  const dB = { x: g.B.x + g.n.x * off, y: g.B.y + g.n.y * off };
  const meio = at(dA, dB, 0.5);
  const di = m.distancia;
  const dl = di ? prog(t, di.em - 0.1, di.em + 0.5, EASE_OUT) : 0;
  const dlab = di ? prog(t, di.em + 0.05, di.em + 0.45) : 0;
  const apagado = T.ev !== null ? 1 - 0.45 * prog(t, T.ev, T.ev + 0.4) : 1;
  const ang = (Math.atan2(g.u.y, g.u.x) * 180) / Math.PI;
  const p0 = at(meio, dA, dl);
  const p1 = at(meio, dB, dl);
  const tick = (p: V) => <line x1={p.x - g.n.x * 14} y1={p.y - g.n.y * 14} x2={p.x + g.n.x * 14} y2={p.y + g.n.y * 14} stroke={COR.linha} strokeWidth={2.5} />;
  // aviso no destino e nomes
  const fimAviso = T.frenteB !== null && m.evento?.efeito === "apaga" ? T.frenteB : e.ate;
  const ai = m.aviso ? prog(t, m.aviso.em - 0.1, m.aviso.em + 0.3) * (1 - prog(t, fimAviso, fimAviso + 0.3)) : 0;
  const nD = m.destino.nome && m.destino.nomeEm !== undefined ? prog(t, m.destino.nomeEm - 0.1, m.destino.nomeEm + 0.3) * (1 - ai) : 0;
  const nO = m.origem.nome && m.origem.nomeEm !== undefined ? prog(t, m.origem.nomeEm - 0.1, m.origem.nomeEm + 0.3) : 0;
  const yAviso = Math.min(g.d.y + g.rE + 22, 680);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      {mostra && (
        <div style={{ position: "absolute", right: 64, top: 150, textAlign: "right", opacity: cA, filter: cA < 1 ? `blur(${(1 - cA) * 8}px)` : undefined, transform: `translateY(${(1 - cA) * 18}px)` }}>
          <div style={{ height: 40, overflow: "hidden" }}>
            <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: 30, letterSpacing: "0.14em", color: fase2 ? COR.solClaro : COR.mudo, opacity: troca, transform: `translateY(${(1 - troca) * 40}px)`, whiteSpace: "nowrap", textTransform: "uppercase" }}>{rotulo}</div>
          </div>
          {num && (
            <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: num.sufixo ? 112 : 132, lineHeight: 1.0, letterSpacing: "-0.02em", color: acerto > 0 ? `rgba(255,${Math.round(248 - 60 * acerto)},${Math.round(242 - 110 * acerto)},1)` : COR.branco, fontVariantNumeric: "tabular-nums", textShadow: "0 6px 30px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>
              {num.numero}
              {num.sufixo ? <span style={{ fontFamily: SORA, fontWeight: 600, fontSize: 46, letterSpacing: "0", marginLeft: 14 }}>{num.sufixo}</span> : null}
            </div>
          )}
          <div style={{ marginTop: num ? 6 : 10, height: 3, width: 330, marginLeft: "auto", background: "rgba(255,248,242,0.14)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: 3, width: `${u * 100}%`, background: fase2 ? COR.solClaro : COR.quente, borderRadius: 2 }} />
          </div>
        </div>
      )}
      {di && (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: apagado }}>
            {dl > 0 && (
              <>
                <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={COR.linha} strokeWidth={2.5} />
                {dl > 0.98 && tick(dA)}
                {dl > 0.98 && tick(dB)}
              </>
            )}
          </svg>
          <div style={{ position: "absolute", left: meio.x, top: meio.y, transform: `translate(-50%, -100%) rotate(${ang}deg) translateY(-14px)`, transformOrigin: "50% 100%", whiteSpace: "nowrap", opacity: dlab * apagado, filter: dlab < 1 ? `blur(${(1 - dlab) * 6}px)` : undefined }}>
            <Cota texto={di.texto} />
          </div>
        </>
      )}
      {nO > 0 && m.origem.nome && (
        <div style={{ position: "absolute", left: Math.max(64, g.s.x - g.rS * 0.35), top: Math.min(712, g.s.y + g.rS * (estadoOrigem(m, t).inchar ?? 1) + 34), whiteSpace: "nowrap", opacity: nO, transform: `translateY(${(1 - nO) * 14}px)` }}>
          <span style={{ fontFamily: SORA, fontWeight: 700, fontSize: 40, color: COR.branco, textShadow: "0 3px 18px rgba(0,0,0,0.6)" }}>{m.origem.nome}</span>
        </div>
      )}
      {nD > 0 && m.destino.nome && (
        <div style={{ position: "absolute", right: 64, top: yAviso, textAlign: "right", whiteSpace: "nowrap", opacity: nD, transform: `translateY(${(1 - nD) * 14}px)` }}>
          <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 42, color: COR.branco }}>{m.destino.nome}</div>
        </div>
      )}
      {ai > 0 && m.aviso && (
        <div style={{ position: "absolute", right: 64, top: yAviso, textAlign: "right", opacity: ai, filter: ai < 1 ? `blur(${(1 - ai) * 6}px)` : undefined, whiteSpace: "nowrap" }}>
          <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 42, color: COR.branco }}>{m.aviso.texto}</div>
          {m.aviso.detalhe ? <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: 38, color: COR.solClaro }}>{m.aviso.detalhe}</div> : null}
        </div>
      )}
    </div>
  );
};

export const pontoDaOrigem = (e: Estacao) => new THREE.Vector3().copy(ORIGEM).add(e.base);
