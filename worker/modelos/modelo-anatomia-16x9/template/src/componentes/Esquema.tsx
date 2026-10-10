// O esquema em traço fino: a assinatura do Anatomia para qualquer assunto (e para partes do corpo fora
// do rosto). Um corpo 2.5D desenhado como prancha de anatomia, dividido em regiões (as estruturas da
// fala). Cada região tem fibras na textura do seu material; quando é dita, o pulso de luz corre pelo
// eixo até ela, a retícula marca, as fibras correm em luz e o rótulo entra ao lado (os rótulos ficam:
// a prancha se completa). Cripto, rotina, carreira: "a anatomia de" qualquer coisa.
import { Rise } from "../anim";
import { encaixar, quebrarLinhas } from "../medida";
import type { Anatomia as TAnatomia, Estrutura, Material } from "../plano";
import { type Cam, type P3, type Pt, outline, proj, smoothPath } from "../rosto/geom";
import { EASE_IN, EASE_INOUT, EASE_OUT, FONT, K, lerp, MUS, mix, prog, win } from "../tema";
import { Reticula, Selo } from "./Pecas";

// cor do fundo, cor da fibra e padrão de cada material
export const MATERIAL: Record<Material, { fill: string; fibra: string; borda: string; padrao: "vertical" | "horizontal" | "anel" | "diagonal" | "pontos" | "celulas" }> = {
  pele: { fill: "#F7E3DA", fibra: "#E2B4A6", borda: "#C9958A", padrao: "horizontal" },
  derme: { fill: "#F8E9E2", fibra: "#E2B4A6", borda: "#C9958A", padrao: "diagonal" },
  gordura: { fill: "#FBF3E1", fibra: "#E5D2A6", borda: "#CDB47E", padrao: "celulas" },
  musculo: { fill: MUS.base, fibra: MUS.light, borda: MUS.edge, padrao: "vertical" },
  tendao: { fill: "#F5EAE5", fibra: "#D9C5BE", borda: "#B9A39B", padrao: "horizontal" },
  osso: { fill: "#F3EDDC", fibra: "#D9CBA6", borda: "#B7A57A", padrao: "pontos" },
  disco: { fill: "#DDE8F2", fibra: "#9FB6CC", borda: "#7D97B0", padrao: "anel" },
  esmalte: { fill: "#F7F9FB", fibra: "#C9D3DE", borda: "#9AA8B8", padrao: "vertical" },
  dentina: { fill: "#F1E6CF", fibra: "#D8C49A", borda: "#B9A274", padrao: "diagonal" },
  polpa: { fill: "#F2B8AE", fibra: "#C98B83", borda: "#A86A62", padrao: "anel" },
  gengiva: { fill: "#F0B3B0", fibra: "#D98C8A", borda: "#B56B69", padrao: "diagonal" },
  nervo: { fill: "#F6E6B4", fibra: "#D3B05E", borda: "#B8954A", padrao: "horizontal" },
  neutro: { fill: "#E9EFF6", fibra: "#9EB0C4", borda: "#6A7C92", padrao: "vertical" },
};
const PADROES_NEUTROS = ["vertical", "horizontal", "anel", "diagonal"] as const;

// o corpo: cápsula de superelipse (coroa −0,72, base 0,62)
const Y0 = -0.72;
const Y1 = 0.62;
const YC = (Y0 + Y1) / 2;
const HY = (Y1 - Y0) / 2;
const LARG = 0.42;
const perfil = (y: number) => {
  const u = Math.min(0.999, Math.abs((y - YC) / HY));
  return LARG * Math.pow(Math.max(0, 1 - Math.pow(u, 4)), 1 / 4);
};

type Regiao = { e: Estrutura; ya: number; yb: number; mat: (typeof MATERIAL)[Material]; padrao: (typeof MATERIAL)[Material]["padrao"]; lado: "esquerda" | "direita" };

const regioesDe = (m: TAnatomia): Regiao[] => {
  const n = Math.max(1, m.estruturas.length);
  const a = Y0 + 0.07;
  const b = Y1 - 0.07;
  const gap = 0.022;
  const bh = (b - a - gap * (n - 1)) / n;
  // na ordem da fala (de cima para baixo), salvo quando o plano já pôs na ordem do corpo
  return m.estruturas.map((e, i) => {
    const material = e.material ?? "neutro";
    const mat = MATERIAL[material];
    const padrao = material === "neutro" || material === "musculo" ? (material === "musculo" ? (i % 2 ? "diagonal" : "vertical") : PADROES_NEUTROS[i % PADROES_NEUTROS.length]) : mat.padrao;
    return { e, ya: a + i * (bh + gap), yb: a + i * (bh + gap) + bh, mat, padrao, lado: e.lado ?? (i % 2 ? "direita" : "esquerda") };
  });
};

const fibrasDe = (r: Regiao): P3[][] => {
  const { ya, yb, padrao } = r;
  const ym = (ya + yb) / 2;
  const w = (y: number) => perfil(y) * 0.9;
  const borda = (y: number, k: number, n = 14): P3[] => Array.from({ length: n }, (_, j) => [-w(y) + (2 * w(y) * j) / (n - 1), y + k, 0] as P3);
  const out: P3[][] = [];
  if (padrao === "horizontal") {
    const n = Math.max(4, Math.round((yb - ya) / 0.022));
    for (let k = 0; k < n; k++) out.push(borda(lerp(ya + 0.012, yb - 0.012, k / (n - 1)), 0.003 * Math.sin(k * 1.7)));
  } else if (padrao === "vertical" || padrao === "diagonal") {
    const n = 15;
    const inc = padrao === "diagonal" ? 0.18 : 0;
    for (let k = 0; k < n; k++) {
      const u = -1 + (2 * k) / (n - 1);
      const pts: P3[] = [];
      for (let j = 0; j <= 8; j++) {
        const y = lerp(ya + 0.01, yb - 0.01, j / 8);
        const x = (u + inc * (j / 8 - 0.5)) * w(y);
        if (Math.abs(x) <= w(y)) pts.push([x, y, 0]);
      }
      if (pts.length > 1) out.push(pts);
    }
  } else if (padrao === "anel") {
    const n = 6;
    for (let k = 0; k < n; k++) {
      const rx = w(ym) * (0.25 + 0.72 * (k / (n - 1)));
      const ry = ((yb - ya) / 2) * (0.25 + 0.66 * (k / (n - 1)));
      const pts: P3[] = [];
      for (let j = 0; j <= 40; j++) pts.push([rx * Math.cos((j / 40) * Math.PI * 2), ym + ry * Math.sin((j / 40) * Math.PI * 2), 0]);
      out.push(pts);
    }
  }
  return out;
};

// células (gordura) e pontos (osso): pequenas elipses espalhadas na região
const pontosDe = (r: Regiao): Array<[number, number, number]> => {
  if (r.padrao !== "pontos" && r.padrao !== "celulas") return [];
  const o: Array<[number, number, number]> = [];
  const linhas = Math.max(2, Math.round((r.yb - r.ya) / 0.06));
  for (let i = 0; i < linhas; i++) {
    const y = lerp(r.ya + 0.03, r.yb - 0.03, linhas === 1 ? 0.5 : i / (linhas - 1));
    const w = perfil(y) * 0.82;
    const cols = r.padrao === "celulas" ? 6 : 10;
    for (let j = 0; j < cols; j++) o.push([-w + (2 * w * (j + (i % 2) * 0.5)) / cols, y, r.padrao === "celulas" ? 0.03 : 0.008]);
  }
  return o;
};

export const Esquema: React.FC<{ m: TAnatomia; t: number; fundo: number }> = ({ m, t, fundo }) => {
  if (t < m.de - 0.05 || t > m.ate + 0.05) return null;
  const regs = regioesDe(m);
  const ordem = [...regs].sort((a, b) => (a.e.regiaoEm ?? a.e.em) - (b.e.regiaoEm ?? b.e.em));
  const de = m.de;
  const comTitulo = !!m.titulo;
  const S0 = comTitulo ? 418 : 455;
  const cy = comTitulo ? (fundo + 190) / 2 + 8 : (fundo + 110) / 2;
  const draw = prog(t, de + 0.02, de + 0.7, EASE_INOUT);
  const ghost = 1 - prog(t, de + 0.3, de + 0.85);
  const alpha = prog(t, de - 0.02, de + 0.12) * (1 - prog(t, m.ate - 0.3, m.ate, EASE_IN));
  // a região "atual": a última que foi dita
  let atual = -1;
  ordem.forEach((r, i) => {
    if (t >= (r.e.regiaoEm ?? r.e.em) - 0.05) atual = i;
  });
  // câmera: gira devagar de 3/4 para frente e respira; aproxima 4% na região atual
  const yaw = 0.34 * (1 - prog(t, de, de + 1.1, EASE_INOUT)) + 0.07 * Math.sin(t * 0.8);
  const foco = atual >= 0 ? (ordem[atual].ya + ordem[atual].yb) / 2 : YC;
  const fy = lerp(YC, foco, 0.18 * (atual >= 0 ? prog(t, (ordem[atual].e.regiaoEm ?? ordem[atual].e.em) - 0.3, (ordem[atual].e.regiaoEm ?? ordem[atual].e.em) + 0.5, EASE_INOUT) : 0));
  const S = S0 * (1 + 0.04 * (atual >= 0 ? 1 : 0) * prog(t, de + 1, de + 1.6)) * (1 + 0.006 * Math.sin(t * 0.9)) * lerp(0.86, 1, prog(t, de, de + 0.7, EASE_OUT));
  const pitch = -0.04;
  const c: Cam = { yaw, pitch, S, ox: 540, oy: cy - (fy - YC) * S * 0.6 - YC * S };
  const P = (pts: P3[], dz = 0.005): Pt[] => pts.map(([x, y, z]) => proj(x, y, (z ?? 0) + dz, c, perfil));
  const ol = outline(c, perfil, Y0, Y1);
  const corpo = smoothPath(ol.poly, true);
  const ink = mix(K.ink, K.acc, ghost);
  const sw = 2.2;
  const dash = (d: number) => ({ pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - d });

  // eixo central (o "nervo" do esquema) e o pulso que corre até a região dita
  const eixo = P([[0, Y0 + 0.04, 0], [0, YC, 0], [0, Y1 - 0.04, 0]], 0.02);
  const pulsoY = (() => {
    let y = Y0 + 0.04;
    let ativo = 0;
    ordem.forEach((r, i) => {
      const at = r.e.regiaoEm ?? r.e.em;
      const p = prog(t, at - 0.15, at + 0.45, EASE_INOUT);
      if (p > 0) {
        const prev = i > 0 ? (ordem[i - 1].ya + ordem[i - 1].yb) / 2 : Y0 + 0.04;
        y = lerp(prev, (r.ya + r.yb) / 2, p);
        ativo = p < 1 ? 1 : Math.max(0, 1 - (t - (at + 0.45)) / 0.6);
      }
    });
    return { y, ativo };
  })();
  const pulsoPt = proj(0, pulsoY.y, 0.03, c, perfil);

  const rotulos: React.ReactNode[] = [];
  const corpos = regs.map((r, i) => {
    const k = ordem.indexOf(r);
    const at = r.e.regiaoEm ?? r.e.em;
    const nomeada = prog(t, r.e.em - 0.05, r.e.em + 0.3);
    const ativa = k === atual ? win(t, at - 0.05, 1e9, 0.4) : 0;
    const entra = prog(t, de + 0.25 + i * 0.09, de + 0.75 + i * 0.09, EASE_OUT);
    const w = (y: number) => perfil(y) * 0.9;
    const N = 16;
    const topo: P3[] = Array.from({ length: N }, (_, j) => [-w(r.ya) + (2 * w(r.ya) * j) / (N - 1), r.ya, 0]);
    const base: P3[] = Array.from({ length: N }, (_, j) => [w(r.yb) - (2 * w(r.yb) * j) / (N - 1), r.yb, 0]);
    const dir: P3[] = Array.from({ length: 8 }, (_, j) => {
      const y = lerp(r.ya, r.yb, j / 7);
      return [w(y), y, 0];
    });
    const esq: P3[] = dir.map(([x, y]) => [-x, y, 0] as P3).reverse();
    const forma = smoothPath(P([...topo, ...dir, ...base, ...esq]).map((p) => ({ ...p, v: true })), true);
    const fibras = fibrasDe(r).map((f) => smoothPath(P(f)));
    const pontos = pontosDe(r).map(([x, y, rr]) => ({ p: proj(x, y, 0.006, c, perfil), r: rr * S }));
    const op = entra * (0.5 + 0.5 * Math.max(nomeada, ativa));
    const ym = (r.ya + r.yb) / 2;
    const ladoSg = r.lado === "esquerda" ? -1 : 1;
    const anc = proj(ladoSg * w(ym) * 0.96, ym, 0.01, c, perfil);
    const centro = proj(0, ym, 0.01, c, perfil);
    rotulos.push(
      <RotuloEsquema key={`r${i}`} t={t} r={r} anc={anc} atual={k === atual} fim={m.ate} />,
      <Reticula key={`ret${i}`} t={t} cx={centro.x} cy={centro.y} rx={w(ym) * S * 1.08} ry={((r.yb - r.ya) / 2) * S * 1.25} a={at} b={r.e.em + 0.9} />,
    );
    return (
      <g key={i} opacity={op}>
        <path d={forma} fill={r.mat.fill} opacity={r.e.material && r.e.material !== "neutro" ? 0.95 : 0.85} />
        {pontos.map((q, j) => (
          <ellipse key={j} cx={q.p.x} cy={q.p.y} rx={q.r * 1.1} ry={q.r * 0.75} fill={r.padrao === "celulas" ? "#FFF9EC" : r.mat.fibra} stroke={r.mat.borda} strokeWidth={r.padrao === "celulas" ? 1.2 : 0} opacity={0.9} />
        ))}
        <path d={fibras.join("")} fill="none" stroke={r.mat.fibra} strokeWidth={r.padrao === "anel" ? 2.4 : 2} strokeLinecap="round" opacity={0.95} />
        <path d={forma} fill="none" stroke={r.mat.borda} strokeWidth={1.3} opacity={0.8} />
        {ativa > 0.01 ? (
          <g opacity={ativa}>
            <path d={forma} fill="none" stroke={K.acc} strokeWidth={9} strokeOpacity={0.14} />
            <path d={forma} fill="none" stroke={K.acc} strokeWidth={2.6} />
            {fibras.map((d, j) => (
              <path key={j} d={d} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" pathLength={1} strokeDasharray="0.1 0.9" strokeDashoffset={-((t * 0.7 + j * 0.137) % 1)} opacity={0.65} />
            ))}
          </g>
        ) : null}
      </g>
    );
  });

  const tituloFit = m.titulo ? encaixar(m.titulo.toUpperCase(), { largura: 900, max: 36, min: 28, linhas: 1, fonte: { peso: 600, espacamento: 0.06 } }) : null;
  const selo = m.ilustrativo === false ? 0 : win(t, de + 0.9, m.ate - 0.3, 0.5, 0.3);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: alpha }}>
      {tituloFit ? (
        <div style={{ position: "absolute", left: 0, width: 1080, top: 150, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: tituloFit.tamanho, letterSpacing: "0.06em", color: K.slate }}>
          <Rise t={t} at={m.tituloEm ?? de + 0.1}>{tituloFit.linhas[0]}</Rise>
        </div>
      ) : null}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <radialGradient id="esq-pulso">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.35" stopColor={K.accHi} stopOpacity={0.9} />
            <stop offset="1" stopColor={K.acc} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="esq-corpo" cx="0.42" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.7" stopColor="#F1F5FA" />
            <stop offset="1" stopColor="#DCE5EE" />
          </radialGradient>
        </defs>
        <path d={corpo} fill="url(#esq-corpo)" opacity={Math.min(1, draw * 1.4) * (1 - 0.6 * ghost)} />
        {corpos}
        <path d={smoothPath(eixo)} fill="none" stroke={ink} strokeWidth={1.4} strokeDasharray="3 7" opacity={0.55 * draw} />
        <path d={corpo} fill="none" stroke={ink} strokeWidth={sw * 1.2} strokeLinejoin="round" {...dash(draw)} />
        {pulsoY.ativo > 0.01 ? <circle cx={pulsoPt.x} cy={pulsoPt.y} r={20} fill="url(#esq-pulso)" opacity={pulsoY.ativo} /> : null}
      </svg>
      {rotulos}
      <Selo a={selo} x={64} y={fundo - 74} />
    </div>
  );
};

// rótulo do esquema: fica ao lado da região (a prancha se completa), na altura dela
const RotuloEsquema: React.FC<{ t: number; r: Regiao; anc: { x: number; y: number }; atual: boolean; fim: number }> = ({ t, r, anc, atual, fim }) => {
  const e = r.e;
  if (t < e.em - 0.2) return null;
  const esq = r.lado === "esquerda";
  const largura = esq ? Math.max(200, anc.x - 64 - 40) : Math.max(200, 1016 - anc.x - 40);
  const w = Math.min(330, largura);
  const fit = encaixar(e.rotulo, { largura: w, max: 40, min: 28, linhas: 2, fonte: { peso: 650 } });
  const sub = e.funcao ? quebrarLinhas(e.funcao, w, 27, { peso: 500 }).slice(0, 2) : [];
  const x0 = esq ? 64 : 1016 - w;
  const hTit = fit.linhas.length * fit.tamanho * 1.18;
  const yLinha = anc.y;
  const pDot = prog(t, e.em - 0.1, e.em + 0.2, EASE_OUT);
  const pLine = prog(t, e.em - 0.02, e.em + 0.42, EASE_INOUT);
  const o = prog(t, fim - 0.3, fim, EASE_IN);
  const near = esq ? x0 + w : x0;
  const far = esq ? x0 : x0 + w;
  const dimm = atual ? 1 : 0.62;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: (1 - o) * lerp(1, dimm, prog(t, e.em + 0.6, e.em + 1.2)) }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path d={`M${anc.x} ${anc.y} L${near} ${yLinha} L${far} ${yLinha}`} fill="none" stroke={K.ink} strokeWidth={1.8} strokeOpacity={0.7} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - pLine} />
        <circle cx={anc.x} cy={anc.y} r={6.5 * pDot} fill={K.acc} stroke="#fff" strokeWidth={2.5} />
      </svg>
      <div style={{ position: "absolute", left: x0, width: w, top: yLinha - hTit - 8, textAlign: esq ? "left" : "right", fontFamily: FONT, fontWeight: 650, fontSize: fit.tamanho, lineHeight: 1.18, color: K.ink, letterSpacing: "-0.01em" }}>
        {fit.linhas.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            <Rise t={t} at={e.em + 0.08 + i * 0.06}>{l}</Rise>
          </div>
        ))}
      </div>
      {sub.length ? (
        <div style={{ position: "absolute", left: x0, width: w, top: yLinha + 8, textAlign: esq ? "left" : "right", fontFamily: FONT, fontWeight: 500, fontSize: 27, lineHeight: 1.2, color: K.ink2 }}>
          {sub.map((l, i) => (
            <div key={i} style={{ whiteSpace: "nowrap" }}>
              <Rise t={t} at={(e.funcaoEm ?? e.em + 0.4) + i * 0.08}>{l}</Rise>
            </div>
          ))}
        </div>
      ) : null}
      {e.grande ? (
        <div style={{ position: "absolute", left: x0, width: w, top: yLinha + 8 + sub.length * 33, textAlign: esq ? "left" : "right", fontFamily: FONT, fontWeight: 700, fontSize: 96, lineHeight: 1.02, color: K.acc, letterSpacing: "-0.03em" }}>
          <Rise t={t} at={e.grandeEm ?? e.em + 0.6} dur={0.5}>{e.grande}</Rise>
        </div>
      ) : null}
    </div>
  );
};
