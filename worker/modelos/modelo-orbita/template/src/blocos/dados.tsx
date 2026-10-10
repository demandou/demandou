// Dados na linguagem da Órbita.
// - numero: o relógio da Órbita. Um corpo grande à esquerda (como o Sol da cena original) e o número
//   em mono à direita, contando até o valor dito, com o rótulo espaçado em cima e a barra embaixo.
// - comparacao: dois corpos lado a lado com a cota entre eles; no veredito o vencedor ACENDE (calor
//   em volta, nome no laranja) e o outro APAGA (escurece), a mesma gramática do Sol que apaga.
// - grafico: barras são colunas de luz; linha é uma constelação desenhada ponto a ponto; pizza é um
//   anel de órbita dividido; sem números, a curva da tendência com a luz na ponta e "ilustrativo".
import React from "react";
import * as THREE from "three";
import type { BlocoDoEspaco } from "./registro";
import type { Comparacao, Grafico, Numero } from "../plano";
import { COR, EASE_INOUT, EASE_OUT, MONO, SORA, clamp01, numeroBR, prog } from "../tema";
import { caberNumaLinha, encaixar } from "../medida";
import { deslocamento } from "../espaco/deslocamento";
import { projetar } from "../espaco/camera";
import { CORPOS_PADRAO, Ilustrativo, NumeroMono, Rotulo, corpoNaTela, larguraNumero, luzDeCima } from "./pecas";
import { valorDoRelogio } from "./Orbita";

const K0 = 179.15;
const bump = (t: number, c: number, l: number) => Math.max(0, 1 - Math.abs(t - c) / l);
const Corona: React.FC<{ x: number; y: number; r: number; a: number }> = ({ x, y, r, a }) =>
  a > 0.01 ? (
    <div style={{ position: "absolute", inset: 0, opacity: a, background: `radial-gradient(circle at ${x}px ${y}px, rgba(244,160,118,0.5) ${r * 0.96}px, rgba(226,128,90,0.2) ${r * 1.2}px, rgba(217,119,87,0.07) ${r * 1.9}px, rgba(217,119,87,0) ${r * 4}px)` }} />
  ) : null;
const naTela = (plano: Parameters<typeof projetar>[0], e: { base: THREE.Vector3 }, x: number, y: number, t: number) =>
  projetar(plano, e.base.clone().add(new THREE.Vector3((x - 540) / K0, (960 - y) / K0, 0)), t);

// ——— número ———
const DUR_CONTA = 1.3;
const textoDoNumero = (m: Numero, u: number) => {
  if (m.relogio) return valorDoRelogio(m.valor, "s", 0, u).numero;
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
  return numeroBR(m.valor * u, casas);
};
const layoutNumero = (m: Numero) => {
  const final = textoDoNumero(m, 1);
  const larg = 1016 - 470;
  let tam = 190;
  while (tam > 70 && larguraNumero(final, tam, m.prefixo, m.sufixo) > larg) tam -= 4;
  // número largo demais para o lado: o corpo sobe e o número ocupa a largura toda
  if (tam < 100) {
    let t2 = 170;
    while (t2 > 64 && larguraNumero(final, t2, m.prefixo, m.sufixo) > 952) t2 -= 4;
    return { lado: false, tam: t2, corpo: { x: 540, y: 262, r: 84 } };
  }
  return { lado: true, tam, corpo: { x: 250, y: 470, r: 140 } };
};
const numero: BlocoDoEspaco = {
  corpos: (_p, e) => {
    const m = e.m as Numero;
    const L = layoutNumero(m);
    const b = m.corpo ? { corpo: m.corpo, cor: undefined, anel: false } : { corpo: "planeta" as const, cor: COR.solClaro, anel: true };
    return [
      corpoNaTela(e, "nm", b.corpo, L.corpo.x, L.corpo.y, L.corpo.r, (t) => ({ vis: prog(t, m.de, m.de + 0.55), off: 0, flash: 0.25 * bump(t, m.em + DUR_CONTA, 0.3) }), { cor: b.cor, anel: b.anel, luz: luzDeCima(e) }),
    ];
  },
  Fundo: ({ plano, e, t }) => {
    const m = e.m as Numero;
    if (m.corpo !== "sol" && m.corpo !== "estrela") return null;
    const L = layoutNumero(m);
    const p = naTela(plano, e, L.corpo.x, L.corpo.y, t);
    return <Corona x={p.x} y={p.y} r={L.corpo.r * (p.k / K0)} a={prog(t, m.de, m.de + 0.55)} />;
  },
  Frente: ({ plano, e, t }) => {
    const m = e.m as Numero;
    const L = layoutNumero(m);
    const d = deslocamento(plano, e, t);
    const u = prog(t, m.em, m.em + DUR_CONTA, EASE_OUT);
    const pronto = t >= m.em + DUR_CONTA;
    const acerto = pronto ? prog(t, m.em + DUR_CONTA - 0.02, m.em + DUR_CONTA + 0.25) : 0;
    const rotEm = m.rotuloEm ?? m.em;
    const r = prog(t, rotEm - 0.08, rotEm + 0.3);
    const a = prog(t, m.em - 0.08, m.em + 0.3);
    const p = naTela(plano, e, L.corpo.x, L.corpo.y, t);
    const ping = clamp01((t - m.em - DUR_CONTA) / 0.8);
    const rot = encaixar(m.rotulo, L.lado ? 546 : 952, 30, 24, 2, 600);
    const cor = acerto > 0 ? `rgba(255,${Math.round(248 - 60 * acerto)},${Math.round(242 - 110 * acerto)},1)` : COR.branco;
    const bloco: React.CSSProperties = L.lado
      ? { position: "absolute", right: 64, top: 322, width: 546, textAlign: "right" }
      : { position: "absolute", left: 64, width: 952, top: 420, textAlign: "center" };
    return (
      <>
        {ping > 0 && ping < 1 ? (
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
            <circle cx={p.x} cy={p.y} r={L.corpo.r * (p.k / K0) * (1.1 + 0.8 * EASE_OUT(ping))} fill="none" stroke={COR.quente} strokeWidth={2.5} opacity={(1 - ping) * 0.8} />
          </svg>
        ) : null}
        <div style={{ ...bloco, transform: `translate(${d.dx.toFixed(2)}px, ${d.dy.toFixed(2)}px)` }}>
          <div style={{ opacity: r, transform: `translateY(${(1 - r) * 16}px)`, fontFamily: SORA, fontWeight: 600, fontSize: rot.tamanho, letterSpacing: "0.12em", textTransform: "uppercase", color: COR.mudo, lineHeight: 1.25 }}>
            {rot.linhas.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
          <div style={{ marginTop: 6, opacity: a, transform: a < 1 ? `translateY(${(1 - a) * 18}px)` : undefined, lineHeight: 1.0, textShadow: "0 6px 30px rgba(0,0,0,0.5)" }}>
            <NumeroMono numero={textoDoNumero(m, u)} prefixo={m.prefixo} sufixo={m.sufixo} tamanho={L.tam} cor={cor} />
          </div>
          <div style={{ marginTop: 10, height: 3, width: L.lado ? 400 : 520, marginLeft: L.lado ? "auto" : "auto", marginRight: L.lado ? 0 : "auto", background: "rgba(255,248,242,0.14)", borderRadius: 2, overflow: "hidden", opacity: a }}>
            <div style={{ height: 3, width: `${u * 100}%`, background: COR.quente, borderRadius: 2 }} />
          </div>
          {m.ilustrativo ? <Ilustrativo style={{ marginTop: 16, opacity: a }} /> : null}
        </div>
      </>
    );
  },
  sons: (m) => [{ t: (m as Numero).em + DUR_CONTA - 0.05, src: "sfx/numero.wav", vol: 0.16 }],
};

// ——— comparação ———
const LADOS = [
  { x: 300, y: 360 },
  { x: 780, y: 360 },
];
const RC = 104;
const comparacao: BlocoDoEspaco = {
  corpos: (_p, e) => {
    const m = e.m as Comparacao;
    return m.lados.map((l, i) => {
      const b = l.corpo ? { corpo: l.corpo, cor: l.cor, anel: false } : CORPOS_PADRAO[i === 0 ? 2 : 0];
      return corpoNaTela(
        e,
        `cp${i}`,
        b.corpo,
        LADOS[i].x,
        LADOS[i].y + (m.titulo ? 40 : 0),
        RC,
        (t) => {
          const v = m.vencedor !== undefined && m.vencedorEm !== undefined ? prog(t, m.vencedorEm - 0.05, m.vencedorEm + 0.6, EASE_OUT) : 0;
          const ganhou = m.vencedor === i;
          return { vis: prog(t, l.em - 0.1, l.em + 0.45), off: m.vencedor !== undefined && !ganhou ? 0.85 * v : 0, flash: ganhou ? 0.22 * bump(t, (m.vencedorEm ?? 0) + 0.1, 0.3) : 0, inchar: ganhou ? 1 + 0.06 * v : 1 - 0.06 * v * (m.vencedor !== undefined ? 1 : 0) };
        },
        { cor: l.cor ?? b.cor, anel: b.anel, luz: luzDeCima(e) },
      );
    });
  },
  Fundo: ({ plano, e, t }) => {
    const m = e.m as Comparacao;
    if (m.vencedor === undefined || m.vencedorEm === undefined) return null;
    const L = LADOS[m.vencedor];
    const p = naTela(plano, e, L.x, L.y + (m.titulo ? 40 : 0), t);
    return <Corona x={p.x} y={p.y} r={RC * (p.k / K0)} a={prog(t, m.vencedorEm - 0.05, m.vencedorEm + 0.6)} />;
  },
  Frente: ({ plano, e, t }) => {
    const m = e.m as Comparacao;
    const d = deslocamento(plano, e, t);
    const dy = m.titulo ? 40 : 0;
    const segundo = m.lados[1].em;
    const cota = prog(t, segundo - 0.05, segundo + 0.5, EASE_OUT);
    const v = m.vencedor !== undefined && m.vencedorEm !== undefined ? prog(t, m.vencedorEm - 0.05, m.vencedorEm + 0.5, EASE_OUT) : 0;
    const modo = m.modo ?? "contra";
    const meio = modo === "antes-depois" ? "→" : "vs";
    const y = LADOS[0].y + dy;
    const x0 = LADOS[0].x + RC + 26;
    const x1 = LADOS[1].x - RC - 26;
    const tit = m.titulo ? encaixar(m.titulo, 952, 44, 30, 1, 700) : null;
    return (
      <div style={{ position: "absolute", inset: 0, transform: `translate(${d.dx.toFixed(2)}px, ${d.dy.toFixed(2)}px)` }}>
        {tit ? <div style={{ position: "absolute", left: 64, width: 952, top: 160, textAlign: "center", opacity: prog(t, m.de, m.de + 0.4), fontFamily: SORA, fontWeight: 700, fontSize: tit.tamanho, color: COR.branco, whiteSpace: "nowrap" }}>{m.titulo}</div> : null}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          {cota > 0 ? (
            <>
              <line x1={540 - ((540 - x0) * cota)} y1={y} x2={540 + (x1 - 540) * cota} y2={y} stroke={COR.linha} strokeWidth={2.5} strokeDasharray={modo === "antes-depois" ? undefined : "4 10"} />
              {cota > 0.98 ? (
                <>
                  <line x1={x0} y1={y - 12} x2={x0} y2={y + 12} stroke={COR.linha} strokeWidth={2.5} />
                  <line x1={x1} y1={y - 12} x2={x1} y2={y + 12} stroke={COR.linha} strokeWidth={2.5} />
                </>
              ) : null}
            </>
          ) : null}
        </svg>
        <div style={{ position: "absolute", left: 490, width: 100, top: y - 58, textAlign: "center", opacity: cota, fontFamily: SORA, fontWeight: 700, fontSize: 40, color: COR.mudo }}>{meio}</div>
        {m.lados.map((l, i) => {
          const q = prog(t, l.em - 0.05, l.em + 0.4, EASE_OUT);
          const ganhou = m.vencedor === i;
          const perdeu = m.vencedor !== undefined && !ganhou;
          const { tamanho, linhas } = encaixar(l.texto, 430, 44, 30, 3, 700);
          const risca = modo === "errado-certo" && perdeu ? v : 0;
          return (
            <div key={i} style={{ position: "absolute", left: LADOS[i].x - 215, width: 430, top: y + RC + 34, textAlign: "center", opacity: q * (perdeu ? 1 - 0.5 * v : 1), transform: `translateY(${(1 - q) * 16}px)` }}>
              <Rotulo texto={l.rotulo} tamanho={26} cor={ganhou && v > 0 ? COR.solClaro : COR.mudo} style={{ whiteSpace: "normal" }} />
              <div style={{ position: "relative", display: "inline-block", marginTop: 8, fontFamily: SORA, fontWeight: 700, fontSize: tamanho, lineHeight: 1.1, color: ganhou && v > 0 ? `rgba(255,${Math.round(248 - 20 * v)},${Math.round(242 - 50 * v)},1)` : COR.branco }}>
                {linhas.map((x, k) => (
                  <div key={k} style={{ whiteSpace: "nowrap" }}>
                    {x}
                  </div>
                ))}
                {risca > 0 ? <div style={{ position: "absolute", left: -6, top: "50%", height: 5, width: `calc(${risca * 100}% + 12px)`, background: COR.alerta, borderRadius: 3, boxShadow: `0 0 12px ${COR.alerta}` }} /> : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  },
  sons: (m) => {
    const c = m as Comparacao;
    const s = c.lados.map((l, i) => ({ t: l.em - 0.02, src: i ? "sfx/tom2.wav" : "sfx/tom.wav", vol: 0.15 }));
    if (c.vencedorEm !== undefined) s.push({ t: c.vencedorEm - 0.05, src: "sfx/numero.wav", vol: 0.18 });
    return s;
  },
};

// ——— gráfico ———
const G = { x0: 110, x1: 970, topo: 270, base: 668 };
const fmt = (v: number, unidade?: string) => `${numeroBR(v, Number.isInteger(v) ? 0 : 1)}${unidade ? (unidade.length <= 2 ? unidade : ` ${unidade}`) : ""}`;
const grafico: BlocoDoEspaco = {
  Frente: ({ plano, e, t }) => {
    const m = e.m as Grafico;
    const d = deslocamento(plano, e, t);
    const a = prog(t, m.de, m.de + 0.45);
    const dados = (m.dados ?? []).slice(0, 6);
    const tit = m.titulo ? encaixar(m.titulo, 952, 44, 30, 1, 700) : null;
    const max = Math.max(1e-9, ...dados.map((x) => Math.abs(x.valor)));
    let corpo: React.ReactNode = null;
    if (dados.length >= 2 && m.forma === "barras") {
      const n = dados.length;
      const passo = (G.x1 - G.x0) / n;
      const lb = Math.min(118, passo * 0.56);
      corpo = (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
            <defs>
              <linearGradient id="gr-barra" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={COR.quente} stopOpacity={0.95} />
                <stop offset="0.25" stopColor={COR.solClaro} stopOpacity={0.75} />
                <stop offset="1" stopColor={COR.sol} stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <line x1={G.x0 - 20} y1={G.base} x2={G.x1 + 20} y2={G.base} stroke={COR.linha} strokeWidth={2} opacity={a} />
            {dados.map((x, i) => {
              const q = prog(t, x.em - 0.05, x.em + 0.6, EASE_OUT);
              const h = ((G.base - G.topo - 60) * Math.abs(x.valor)) / max * q;
              const cx = G.x0 + passo * (i + 0.5);
              return (
                <g key={i}>
                  <rect x={cx - lb / 2} y={G.base - h} width={lb} height={h} fill="url(#gr-barra)" rx={6} />
                  {q > 0 ? <circle cx={cx} cy={G.base - h} r={lb * 0.18} fill="#FFFFFF" opacity={0.9 * q} /> : null}
                  {q > 0 ? <circle cx={cx} cy={G.base - h} r={lb * 0.5} fill={COR.quente} opacity={0.18 * q} /> : null}
                </g>
              );
            })}
          </svg>
          {dados.map((x, i) => {
            const q = prog(t, x.em - 0.05, x.em + 0.6, EASE_OUT);
            const h = ((G.base - G.topo - 60) * Math.abs(x.valor)) / max * q;
            const cx = G.x0 + passo * (i + 0.5);
            const tv = caberNumaLinha(fmt(x.valor, m.unidade), passo - 8, 40, 22, 500, true);
            const tr = encaixar(x.rotulo, passo - 8, 30, 20, 2, 600);
            return (
              <React.Fragment key={i}>
                <div style={{ position: "absolute", left: cx - passo / 2, width: passo, top: G.base - h - tv * 1.45 - lb * 0.24, textAlign: "center", opacity: q, fontFamily: MONO, fontWeight: 500, fontSize: tv, color: COR.branco, whiteSpace: "nowrap" }}>{fmt(x.valor * q, m.unidade)}</div>
                <div style={{ position: "absolute", left: cx - passo / 2, width: passo, top: G.base + 12, textAlign: "center", opacity: prog(t, x.em - 0.05, x.em + 0.3), fontFamily: SORA, fontWeight: 600, fontSize: tr.tamanho, lineHeight: 1.1, color: COR.mudo }}>
                  {tr.linhas.map((l, k) => (
                    <div key={k}>{l}</div>
                  ))}
                </div>
              </React.Fragment>
            );
          })}
        </>
      );
    } else if (dados.length >= 2 && m.forma === "linha") {
      const n = dados.length;
      const min = Math.min(0, ...dados.map((x) => x.valor));
      const pts = dados.map((x, i) => ({ x: G.x0 + 30 + ((G.x1 - G.x0 - 60) * i) / (n - 1), y: G.base - 30 - ((G.base - G.topo - 90) * (x.valor - min)) / Math.max(1e-9, max - min) }));
      corpo = (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
            <line x1={G.x0 - 20} y1={G.base} x2={G.x1 + 20} y2={G.base} stroke={COR.linha} strokeWidth={2} opacity={a} />
            {pts.slice(1).map((p, i) => {
              const q = prog(t, dados[i + 1].em - 0.35, dados[i + 1].em + 0.05, EASE_INOUT);
              const A = pts[i];
              return q > 0 ? <line key={i} x1={A.x} y1={A.y} x2={A.x + (p.x - A.x) * q} y2={A.y + (p.y - A.y) * q} stroke={COR.solClaro} strokeWidth={3} strokeLinecap="round" /> : null;
            })}
            {pts.map((p, i) => {
              const q = prog(t, dados[i].em - 0.05, dados[i].em + 0.35, EASE_OUT);
              return q > 0 ? (
                <g key={i} opacity={q}>
                  <circle cx={p.x} cy={p.y} r={22} fill={COR.quente} opacity={0.2} />
                  <circle cx={p.x} cy={p.y} r={7} fill="#FFFFFF" />
                  <line x1={p.x - 18} y1={p.y} x2={p.x + 18} y2={p.y} stroke="#FFFFFF" strokeWidth={1.5} opacity={0.7} />
                  <line x1={p.x} y1={p.y - 18} x2={p.x} y2={p.y + 18} stroke="#FFFFFF" strokeWidth={1.5} opacity={0.7} />
                </g>
              ) : null;
            })}
          </svg>
          {pts.map((p, i) => {
            const q = prog(t, dados[i].em - 0.05, dados[i].em + 0.35, EASE_OUT);
            const w = (G.x1 - G.x0) / n + 40;
            const tv = caberNumaLinha(fmt(dados[i].valor, m.unidade), w - 10, 38, 22, 500, true);
            const tr = encaixar(dados[i].rotulo, w - 10, 28, 20, 2, 600);
            return (
              <React.Fragment key={i}>
                <div style={{ position: "absolute", left: p.x - w / 2, width: w, top: p.y - 30 - tv * 1.25, textAlign: "center", opacity: q, fontFamily: MONO, fontWeight: 500, fontSize: tv, color: COR.branco, whiteSpace: "nowrap" }}>{fmt(dados[i].valor, m.unidade)}</div>
                <div style={{ position: "absolute", left: p.x - w / 2, width: w, top: G.base + 12, textAlign: "center", opacity: q, fontFamily: SORA, fontWeight: 600, fontSize: tr.tamanho, lineHeight: 1.1, color: COR.mudo }}>
                  {tr.linhas.map((l, k) => (
                    <div key={k}>{l}</div>
                  ))}
                </div>
              </React.Fragment>
            );
          })}
        </>
      );
    } else if (dados.length >= 2 && m.forma === "pizza") {
      const total = dados.reduce((s, x) => s + Math.max(0, x.valor), 0) || 1;
      const C = { x: 540, y: 470 };
      const R = 168;
      const cores = [COR.sol, COR.solClaro, COR.frio, COR.quente, "#8FB0D6", "#CDB38C"];
      let ac = -Math.PI / 2;
      const fatias = dados.map((x, i) => {
        const ang = (Math.max(0, x.valor) / total) * Math.PI * 2;
        const f = { a0: ac, a1: ac + ang, i };
        ac += ang;
        return f;
      });
      corpo = (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
            <circle cx={C.x} cy={C.y} r={R} fill="none" stroke="rgba(255,240,228,0.12)" strokeWidth={64} opacity={a} />
            {fatias.map((f) => {
              const q = prog(t, dados[f.i].em - 0.05, dados[f.i].em + 0.55, EASE_OUT);
              if (q <= 0) return null;
              const a1 = f.a0 + (f.a1 - f.a0) * q;
              const big = a1 - f.a0 > Math.PI ? 1 : 0;
              return <path key={f.i} d={`M ${C.x + R * Math.cos(f.a0)} ${C.y + R * Math.sin(f.a0)} A ${R} ${R} 0 ${big} 1 ${C.x + R * Math.cos(a1)} ${C.y + R * Math.sin(a1)}`} fill="none" stroke={cores[f.i % cores.length]} strokeWidth={60} />;
            })}
            <circle cx={C.x + R * Math.cos(-Math.PI / 2 + t * 0.9)} cy={C.y + R * Math.sin(-Math.PI / 2 + t * 0.9)} r={6} fill="#FFFFFF" opacity={a * 0.9} />
          </svg>
          {fatias.map((f) => {
            const q = prog(t, dados[f.i].em + 0.1, dados[f.i].em + 0.5, EASE_OUT);
            const mid = (f.a0 + f.a1) / 2;
            const lx = C.x + (R + 92) * Math.cos(mid);
            const ly = C.y + (R + 72) * Math.sin(mid);
            const dir = Math.cos(mid) >= 0;
            const pct = Math.round((Math.max(0, dados[f.i].valor) / total) * 100);
            const w = 300;
            return (
              <div key={f.i} style={{ position: "absolute", left: dir ? Math.min(lx - 20, 1016 - w) : Math.max(64, lx - w + 20), width: w, top: ly - 34, textAlign: dir ? "left" : "right", opacity: q }}>
                <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 38, color: COR.branco }}>{m.unidade ? fmt(dados[f.i].valor, m.unidade) : `${pct}%`}</div>
                <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: encaixar(dados[f.i].rotulo, w, 28, 20, 1, 600).tamanho, color: COR.mudo, whiteSpace: "nowrap" }}>{dados[f.i].rotulo}</div>
              </div>
            );
          })}
        </>
      );
    } else {
      // sem números ditos: a forma da tendência, com a luz na ponta
      const ini = m.tendenciaEm ?? m.de + 0.3;
      const q = prog(t, ini - 0.05, ini + 1.3, EASE_INOUT);
      const N = 60;
      const fy = (u: number) => {
        if (m.tendencia === "cai") return 0.15 + 0.7 * u + 0.05 * Math.sin(u * 11);
        if (m.tendencia === "oscila") return 0.5 + 0.28 * Math.sin(u * Math.PI * 3.2);
        return 0.85 - 0.7 * u + 0.05 * Math.sin(u * 11);
      };
      const pts = Array.from({ length: N + 1 }, (_, k) => ({ x: G.x0 + ((G.x1 - G.x0) * k) / N, y: G.topo + 40 + (G.base - G.topo - 80) * fy(k / N) }));
      const k = Math.max(1, Math.round(q * N));
      const vis = pts.slice(0, k + 1);
      const ponta = vis[vis.length - 1];
      corpo = (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
            <line x1={G.x0 - 20} y1={G.base} x2={G.x1 + 20} y2={G.base} stroke={COR.linha} strokeWidth={2} opacity={a} />
            <polyline points={vis.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={COR.sol} strokeOpacity={0.3} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={vis.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={COR.solClaro} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
            {q > 0 ? (
              <>
                <circle cx={ponta.x} cy={ponta.y} r={26} fill={COR.quente} opacity={0.3} />
                <circle cx={ponta.x} cy={ponta.y} r={7} fill="#FFFFFF" />
              </>
            ) : null}
          </svg>
          <div style={{ position: "absolute", right: 64, top: G.topo - 30, opacity: a }}>
            <Ilustrativo />
          </div>
        </>
      );
    }
    return (
      <div style={{ position: "absolute", inset: 0, transform: `translate(${d.dx.toFixed(2)}px, ${d.dy.toFixed(2)}px)` }}>
        {tit ? <div style={{ position: "absolute", left: 64, width: 952, top: 156, textAlign: "center", opacity: a, fontFamily: SORA, fontWeight: 700, fontSize: tit.tamanho, color: COR.branco, whiteSpace: "nowrap" }}>{m.titulo}</div> : null}
        {dados.length >= 2 && m.ilustrativo ? (
          <div style={{ position: "absolute", right: 64, top: G.topo - 30, opacity: a }}>
            <Ilustrativo />
          </div>
        ) : null}
        {corpo}
      </div>
    );
  },
  sons: (m) => ((m as Grafico).dados ?? []).slice(0, 6).map((x, i) => ({ t: x.em - 0.02, src: i % 2 ? "sfx/tom2.wav" : "sfx/tom.wav", vol: 0.14 })),
};

export const BLOCOS_DE_DADOS: Record<string, BlocoDoEspaco> = { numero, comparacao, grafico };
