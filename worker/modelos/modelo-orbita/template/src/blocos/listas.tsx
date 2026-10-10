// Listas na linguagem da Órbita.
// - topicos: corpos em órbita. Cada item é um planeta que entra num grande arco de órbita (de um Sol
//   fora do quadro, à esquerda) na palavra dita, com o nome ao lado; os planetas andam devagar no arco
//   e a luz percorre o arco até o item da vez.
// - passos: a trajetória. A luz sai de um pequeno Sol e salta de parada em parada (numeradas) até o
//   planeta de chegada; o passo da vez aparece grande embaixo do caminho.
import React from "react";
import type { BlocoDoEspaco } from "./registro";
import type { Passos, Topicos } from "../plano";
import { COR, EASE_INOUT, EASE_OUT, MONO, SORA, clamp01, prog } from "../tema";
import { encaixar } from "../medida";
import { deslocamento } from "../espaco/deslocamento";
import { daTela, projetar } from "../espaco/camera";
import { CORPOS_PADRAO, TextoNaFala, corpoNaTela, luzDaEsquerda } from "./pecas";

// ——— tópicos ———
const ARCO = { cx: -560, cy: 470, R: 720 };
const pontoDoArco = (a: number) => ({ x: ARCO.cx + ARCO.R * Math.cos(a), y: ARCO.cy + ARCO.R * Math.sin(a) });
const angDe = (y: number) => Math.asin(Math.max(-1, Math.min(1, (y - ARCO.cy) / ARCO.R)));
const DERIVA = 0.012;
const layoutTopicos = (m: Topicos) => {
  const n = Math.max(1, Math.min(5, m.itens.length));
  const y0 = m.titulo ? 300 : 240;
  const y1 = 700;
  const ys = n === 1 ? [470] : Array.from({ length: n }, (_, i) => y0 + (i * (y1 - y0)) / (n - 1));
  const r = n <= 3 ? 44 : n === 4 ? 38 : 33;
  const fonte = n <= 3 ? { max: 52, min: 36 } : n === 4 ? { max: 46, min: 32 } : { max: 40, min: 30 };
  return { n, ys, r, fonte };
};
const angItem = (m: Topicos, i: number, t: number) => angDe(layoutTopicos(m).ys[i]) + DERIVA * Math.max(0, t - m.de);
const naTelaLocal = (x: number, y: number) => daTela(x, y, 0);

const topicos: BlocoDoEspaco = {
  corpos: (_p, e) => {
    const m = e.m as Topicos;
    const L = layoutTopicos(m);
    return m.itens.slice(0, 5).map((it, i) => {
      const b = it.corpo ? { corpo: it.corpo, cor: it.cor, anel: false } : CORPOS_PADRAO[i % CORPOS_PADRAO.length];
      const p0 = pontoDoArco(angItem(m, i, m.de));
      const base0 = naTelaLocal(p0.x, p0.y);
      return corpoNaTela(e, `tp${i}`, b.corpo, p0.x, p0.y, L.r, (t) => ({ vis: prog(t, it.em - 0.1, it.em + 0.4), off: 0, flash: 0 }), {
        cor: it.cor ?? b.cor,
        anel: b.anel,
        luz: luzDaEsquerda(e),
        mover: (t) => {
          const p = pontoDoArco(angItem(m, i, t));
          return naTelaLocal(p.x, p.y).sub(base0);
        },
      });
    });
  },
  Fundo: ({ plano, e, t }) => {
    const m = e.m as Topicos;
    const c = projetar(plano, e.base.clone().add(naTelaLocal(ARCO.cx, ARCO.cy)), t);
    const k = c.k / 179.15;
    const R = ARCO.R * k;
    const a = prog(t, m.de, m.de + 0.6);
    const ativos = m.itens.filter((it) => it.em <= t + 0.05).length;
    const aTop = angDe(150);
    const aFim = ativos > 0 ? angItem(m, ativos - 1, t) : aTop;
    const luz = prog(t, (m.itens[Math.max(0, ativos - 1)]?.em ?? m.de) - 0.2, (m.itens[Math.max(0, ativos - 1)]?.em ?? m.de) + 0.3, EASE_OUT);
    const aLuz = aTop + (aFim - aTop) * (ativos > 1 ? 1 : luz);
    const arco = (a0: number, a1: number) => `M ${c.x + R * Math.cos(a0)} ${c.y + R * Math.sin(a0)} A ${R} ${R} 0 0 1 ${c.x + R * Math.cos(a1)} ${c.y + R * Math.sin(a1)}`;
    return (
      <>
        <div style={{ position: "absolute", inset: 0, opacity: a, background: `radial-gradient(circle at ${c.x + R * 0.62}px ${c.y}px, rgba(244,160,118,0.28) 0px, rgba(217,119,87,0.08) 320px, rgba(217,119,87,0) 620px)` }} />
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: a }}>
          <path d={arco(angDe(110), angDe(790))} stroke="rgba(255,240,228,0.24)" strokeWidth={2} strokeDasharray="4 12" fill="none" />
          {ativos > 0 ? (
            <>
              <path d={arco(aTop, aLuz)} stroke={COR.sol} strokeOpacity={0.3} strokeWidth={10} fill="none" strokeLinecap="round" />
              <path d={arco(aTop, aLuz)} stroke={COR.quente} strokeOpacity={0.9} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeDasharray="22 40" strokeDashoffset={-(t * 160) % 1000} />
            </>
          ) : null}
        </svg>
      </>
    );
  },
  Frente: ({ plano, e, t }) => {
    const m = e.m as Topicos;
    const L = layoutTopicos(m);
    const d = deslocamento(plano, e, t);
    const ativos = m.itens.filter((it) => it.em <= t + 0.05).length;
    const tit = m.titulo ? prog(t, m.de, m.de + 0.45) : 0;
    return (
      <>
        {m.titulo ? (
          <div style={{ position: "absolute", left: 64, width: 952, top: 168 + d.dy, transform: `translateX(${d.dx}px)`, textAlign: "center", opacity: tit, fontFamily: SORA, fontWeight: 700, fontSize: encaixar(m.titulo, 952, 46, 32, 1, 700).tamanho, letterSpacing: "-0.01em", color: COR.branco, whiteSpace: "nowrap", textShadow: "0 3px 18px rgba(0,0,0,0.6)" }}>
            {m.titulo}
          </div>
        ) : null}
        {m.itens.slice(0, 5).map((it, i) => {
          const q = prog(t, it.em - 0.05, it.em + 0.38, EASE_OUT);
          if (q <= 0) return null;
          const pa = pontoDoArco(angItem(m, i, t));
          const p = projetar(plano, e.base.clone().add(naTelaLocal(pa.x, pa.y)), t);
          const r = L.r * (p.k / 179.15);
          const x = p.x + r + 32;
          const w = 1016 - x;
          const { tamanho, linhas } = encaixar(it.texto, w, L.fonte.max, L.fonte.min, 2, 700);
          const atual = i === ativos - 1;
          const ping = clamp01((t - it.em) / 0.8);
          const h = linhas.length * tamanho * 1.08 + (it.detalhe ? 38 : 0);
          return (
            <React.Fragment key={i}>
              {ping < 1 ? (
                <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
                  <circle cx={p.x} cy={p.y} r={r * (1.15 + 1.0 * EASE_OUT(ping))} fill="none" stroke={COR.quente} strokeWidth={2.5} opacity={(1 - ping) * 0.85} />
                </svg>
              ) : null}
              <div style={{ position: "absolute", left: x, width: w, top: p.y - h / 2, opacity: q * (atual || ativos === 0 ? 1 : 0.58), transform: q < 1 ? `translateX(${(1 - q) * -18}px)` : undefined, filter: q < 1 ? `blur(${(1 - q) * 6}px)` : undefined }}>
                <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: tamanho, lineHeight: 1.08, letterSpacing: "-0.015em", color: COR.branco, textShadow: "0 3px 18px rgba(0,0,0,0.6)" }}>
                  {linhas.map((l, k) => (
                    <div key={k} style={{ whiteSpace: "nowrap" }}>
                      {l}
                    </div>
                  ))}
                </div>
                {it.detalhe ? <div style={{ marginTop: 4, fontFamily: SORA, fontWeight: 500, fontSize: encaixar(it.detalhe, w, 30, 24, 1, 500).tamanho, color: COR.mudo, whiteSpace: "nowrap" }}>{it.detalhe}</div> : null}
              </div>
            </React.Fragment>
          );
        })}
      </>
    );
  },
  sons: (m) => (m as Topicos).itens.map((it, i) => ({ t: it.em - 0.02, src: i % 2 ? "sfx/tom2.wav" : "sfx/tom.wav", vol: 0.15 })),
};

// ——— passos ———
type V = { x: number; y: number };
const caminho = (m: Passos) => {
  const dy = m.titulo ? 46 : 0;
  return [
    { x: 120, y: 262 + dy },
    { x: 400, y: 172 + dy },
    { x: 690, y: 438 + dy },
    { x: 960, y: 330 + dy },
  ];
};
const bezier = (P: V[], u: number): V => {
  const a = 1 - u;
  return {
    x: a * a * a * P[0].x + 3 * a * a * u * P[1].x + 3 * a * u * u * P[2].x + u * u * u * P[3].x,
    y: a * a * a * P[0].y + 3 * a * a * u * P[1].y + 3 * a * u * u * P[2].y + u * u * u * P[3].y,
  };
};
const nPassos = (m: Passos) => Math.max(1, Math.min(5, m.itens.length));
const uDo = (m: Passos, i: number) => (i + 1) / nPassos(m);
// onde a luz está (parâmetro u no caminho): sai do Sol e chega em cada parada na palavra
const uDaLuz = (m: Passos, t: number) => {
  let u = 0;
  m.itens.slice(0, 5).forEach((it, i) => {
    const a = i === 0 ? 0 : uDo(m, i - 1);
    const p = EASE_INOUT(clamp01((t - (it.em - 0.45)) / 0.5));
    if (p > 0) u = a + (uDo(m, i) - a) * p;
  });
  return u;
};

const passos: BlocoDoEspaco = {
  corpos: (_p, e) => {
    const m = e.m as Passos;
    const P = caminho(m);
    const ult = m.itens[nPassos(m) - 1];
    const fim = P[3];
    const b = ult?.corpo ? { corpo: ult.corpo, cor: ult.cor, anel: false } : CORPOS_PADRAO[1];
    const vis = (t: number) => prog(t, m.de, m.de + 0.5);
    return [
      corpoNaTela(e, "ps-sol", "sol", P[0].x, P[0].y, 28, (t) => ({ vis: vis(t), off: 0, flash: 0 })),
      corpoNaTela(e, "ps-fim", b.corpo, fim.x, fim.y, 36, (t) => ({ vis: vis(t), off: 0.55 * (1 - prog(t, (ult?.em ?? m.ate) - 0.05, (ult?.em ?? m.ate) + 0.4)), flash: 0 }), { cor: b.cor, anel: b.anel, luz: e.base.clone().add(daTela(P[0].x, P[0].y, 0)) }),
    ];
  },
  Fundo: ({ plano, e, t }) => {
    const m = e.m as Passos;
    const d = deslocamento(plano, e, t);
    const P = caminho(m).map((p) => ({ x: p.x + d.dx, y: p.y + d.dy }));
    return (
      <div style={{ position: "absolute", inset: 0, opacity: prog(t, m.de, m.de + 0.5), background: `radial-gradient(circle at ${P[0].x}px ${P[0].y}px, rgba(244,160,118,0.5) 26px, rgba(226,128,90,0.16) 40px, rgba(217,119,87,0) 130px)` }} />
    );
  },
  Frente: ({ plano, e, t }) => {
    const m = e.m as Passos;
    const d = deslocamento(plano, e, t);
    const n = nPassos(m);
    const P = caminho(m);
    const a = prog(t, m.de, m.de + 0.5);
    const u = uDaLuz(m, t);
    const N = 48;
    const pts = Array.from({ length: N + 1 }, (_, k) => bezier(P, k / N));
    const tudo = pts.map((p) => `${p.x},${p.y}`).join(" ");
    const kLuz = Math.round(u * N);
    const aceso = pts.slice(0, kLuz + 1).map((p) => `${p.x},${p.y}`).join(" ");
    const cabeca = bezier(P, u);
    const ativos = m.itens.slice(0, 5).filter((it) => it.em <= t + 0.05).length;
    const atual = ativos - 1;
    const tit = m.titulo ? encaixar(m.titulo, 952, 44, 30, 1, 700) : null;
    return (
      <div style={{ position: "absolute", inset: 0, transform: `translate(${d.dx.toFixed(2)}px, ${d.dy.toFixed(2)}px)` }}>
        {tit ? (
          <div style={{ position: "absolute", left: 64, width: 952, top: 156, textAlign: "center", opacity: a, fontFamily: SORA, fontWeight: 700, fontSize: tit.tamanho, color: COR.branco, whiteSpace: "nowrap", textShadow: "0 3px 18px rgba(0,0,0,0.6)" }}>{m.titulo}</div>
        ) : null}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: a }}>
          <polyline points={tudo} fill="none" stroke="rgba(255,240,228,0.24)" strokeWidth={2} strokeDasharray="4 12" />
          {kLuz > 0 ? (
            <>
              <polyline points={aceso} fill="none" stroke={COR.sol} strokeOpacity={0.3} strokeWidth={10} strokeLinecap="round" />
              <polyline points={aceso} fill="none" stroke={COR.quente} strokeOpacity={0.9} strokeWidth={2.6} strokeLinecap="round" strokeDasharray="22 40" strokeDashoffset={-(t * 160) % 1000} />
            </>
          ) : null}
          {m.itens.slice(0, 5).map((it, i) => {
            const p = bezier(P, uDo(m, i));
            const chegou = prog(t, it.em - 0.05, it.em + 0.25);
            const ping = clamp01((t - it.em) / 0.7);
            const ultimo = i === n - 1;
            return (
              <g key={i}>
                {!ultimo ? <circle cx={p.x} cy={p.y} r={20} fill={chegou > 0 ? `rgba(217,119,87,${0.9 * chegou})` : "rgba(4,5,10,0.6)"} stroke={chegou > 0 ? COR.quente : "rgba(255,240,228,0.45)"} strokeWidth={2.5} /> : null}
                {ping > 0 && ping < 1 ? <circle cx={p.x} cy={p.y} r={(ultimo ? 44 : 22) * (1.1 + 1.2 * EASE_OUT(ping))} fill="none" stroke={COR.quente} strokeWidth={2.5} opacity={(1 - ping) * 0.85} /> : null}
                <text x={p.x} y={p.y - (ultimo ? 58 : 34)} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={28} fill={chegou > 0 ? COR.solClaro : COR.mudo}>
                  {String(i + 1).padStart(2, "0")}
                </text>
              </g>
            );
          })}
          {u > 0.001 && u < uDo(m, Math.max(0, atual)) + 0.001 ? (
            <>
              <circle cx={cabeca.x} cy={cabeca.y} r={26} fill={COR.quente} opacity={0.35} />
              <circle cx={cabeca.x} cy={cabeca.y} r={7} fill="#FFFFFF" />
            </>
          ) : null}
        </svg>
        {m.itens.slice(0, 5).map((it, i) => {
          const q = prog(t, it.em - 0.05, it.em + 0.35, EASE_OUT);
          const prox = m.itens[i + 1];
          const sai = prox ? prog(t, prox.em - 0.1, prox.em + 0.12) : 0;
          if (q <= 0 || sai >= 1) return null;
          const yTopo = m.titulo ? 520 : 500;
          return (
            <div key={i} style={{ position: "absolute", left: 64, width: 952, top: yTopo, textAlign: "center", opacity: q * (1 - sai), transform: `translateY(${(1 - q) * 22 - sai * 16}px)`, filter: q < 1 || sai > 0 ? `blur(${(1 - q) * 8 + sai * 6}px)` : undefined }}>
              <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 34, color: COR.solClaro, letterSpacing: "0.04em" }}>
                {String(i + 1).padStart(2, "0")}
                <span style={{ color: COR.fraco }}> / {String(n).padStart(2, "0")}</span>
              </div>
              <div style={{ marginTop: 8 }}>
                <TextoNaFala plano={plano} texto={it.texto} em={it.em} ate={prox ? prox.em : m.ate} t={t} largura={952} max={64} min={40} linhas={2} />
              </div>
              {it.detalhe ? <div style={{ marginTop: 10, fontFamily: SORA, fontWeight: 500, fontSize: encaixar(it.detalhe, 952, 32, 24, 1, 500).tamanho, color: COR.mudo, whiteSpace: "nowrap" }}>{it.detalhe}</div> : null}
            </div>
          );
        })}
      </div>
    );
  },
  sons: (m) => (m as Passos).itens.map((it, i) => ({ t: it.em - 0.02, src: i % 2 ? "sfx/tom2.wav" : "sfx/tom.wav", vol: 0.15 })),
};

export const BLOCOS_DE_LISTA: Record<string, BlocoDoEspaco> = { topicos, passos };
