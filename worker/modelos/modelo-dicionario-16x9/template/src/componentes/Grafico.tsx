// O gráfico como gravura de dicionário: nanquim, hachuras em 45° e um único acento ameixa
// (o dado da vez). Barras crescem, a linha se desenha ponto a ponto, a pizza se fatia — cada dado
// no instante em que é dito. Sem números ditos, uma curva ilustrativa se desenha com a etiqueta
// ILUSTRATIVO (nenhum número inventado).
import { prog } from "../anim";
import type { Regiao } from "../layout";
import { encaixar, type Fonte, formatarNumero, larguraTexto } from "../medida";
import type { Grafico } from "../plano";
import { cor, H as ALTURA_QUADRO, serif, W as LARGURA_QUADRO } from "../tema";
import { Ilustrativo, Letreiro, LinhasFaladas } from "./Texto";

const ROTULO: Fonte = { familia: "serif", peso: 600 };
const VALOR: Fonte = { familia: "serif", peso: 700 };

const casasDe = (v: number) => {
  const s = String(v);
  const i = s.indexOf(".");
  return i < 0 ? 0 : Math.min(2, s.length - i - 1);
};

// unidade curta vai junto do número ("40%"); longa vira o letreiro do eixo
const unidadeCurta = (u?: string) => !!u && u.trim().length <= 3;
const comUnidade = (v: string, u?: string) => (unidadeCurta(u) ? (u!.trim() === "%" ? `${v}%` : `${v} ${u!.trim()}`) : v);

const Hachuras: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <pattern id={`${id}-tinta`} patternUnits="userSpaceOnUse" width={13} height={13} patternTransform="rotate(45)">
      <line x1={0} y1={0} x2={0} y2={13} stroke={cor.tinta} strokeWidth={3} />
    </pattern>
    <pattern id={`${id}-ameixa`} patternUnits="userSpaceOnUse" width={11} height={11} patternTransform="rotate(45)">
      <line x1={0} y1={0} x2={0} y2={11} stroke={cor.ameixa} strokeWidth={4.5} />
    </pattern>
    <pattern id={`${id}-leve`} patternUnits="userSpaceOnUse" width={16} height={16} patternTransform="rotate(45)">
      <line x1={0} y1={0} x2={0} y2={16} stroke={cor.tinta} strokeWidth={2} opacity={0.35} />
    </pattern>
    <pattern id={`${id}-pontos`} patternUnits="userSpaceOnUse" width={14} height={14}>
      <circle cx={7} cy={7} r={2.6} fill={cor.tinta} />
    </pattern>
    <pattern id={`${id}-cruz`} patternUnits="userSpaceOnUse" width={14} height={14} patternTransform="rotate(45)">
      <line x1={0} y1={0} x2={0} y2={14} stroke={cor.ameixa} strokeWidth={2.5} />
      <line x1={0} y1={7} x2={14} y2={7} stroke={cor.ameixa} strokeWidth={2.5} />
    </pattern>
  </defs>
);

// Rótulo de um dado (embaixo do eixo), medido para caber na fatia dele
const RotuloDado: React.FC<{ texto: string; x: number; y: number; w: number; dito: boolean }> = ({ texto, x, y, w, dito }) => {
  const e = encaixar(texto, { largura: w, max: 38, min: 30, linhas: 2, fonte: ROTULO });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w }}>
      <LinhasFaladas linhas={e.linhas} corpo={e.corpo} entrelinha={1.1} fonte={ROTULO} t={1} cor={dito ? cor.tinta : cor.lapis} alinhar="center" esboco="nada" />
    </div>
  );
};

export const GraficoBloco: React.FC<{ m: Grafico; t: number; R: Regiao }> = ({ m, t, R }) => {
  const id = `g${String(m.de).replace(".", "-")}`;
  const dados = m.dados ?? [];
  const ilustrativo = m.ilustrativo || dados.length === 0;
  const topoRotulo = 58;
  const cabecalho = (
    <div style={{ position: "absolute", left: R.x, top: R.y, width: R.w, height: 46, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>{m.unidade && !unidadeCurta(m.unidade) ? <Letreiro texto={m.unidade} corpo={30} /> : null}</div>
      {ilustrativo ? <Ilustrativo /> : null}
    </div>
  );
  // área do desenho (px absolutos)
  const P = { x: R.x + 8, y: R.y + topoRotulo, w: R.w - 16, h: R.h - topoRotulo };
  const pEixo = prog(t, m.de, 0.5);

  // ---------- sem números: a curva ilustrativa ----------
  if (dados.length === 0 || m.forma === "pizza" && dados.length < 2) {
    const inicio = m.tendenciaEm ?? m.de + 0.1;
    const dur = Math.max(1.2, Math.min(2.4, (m.ate - inicio) * 0.75));
    const p = prog(t, inicio, dur, (x) => x);
    const tendencia = m.tendencia ?? "sobe";
    const H = P.h - 20;
    const N = 60;
    const pontos = Array.from({ length: N + 1 }, (_, i) => {
      const f = i / N;
      const onda = Math.sin(f * Math.PI * 5.2) * 0.07 + Math.sin(f * Math.PI * 11) * 0.025;
      const base = tendencia === "sobe" ? 0.12 + 0.72 * Math.pow(f, 1.25) : tendencia === "cai" ? 0.86 - 0.72 * Math.pow(f, 1.1) : 0.48 + Math.sin(f * Math.PI * 3.1) * 0.24;
      const v = Math.min(0.95, Math.max(0.05, base + onda));
      return [P.x + 30 + f * (P.w - 60), P.y + 10 + H * (1 - v)] as const;
    });
    const d = pontos.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const area = `${d} L ${pontos[N][0]} ${P.y + P.h} L ${pontos[0][0]} ${P.y + P.h} Z`;
    const k = Math.min(N, Math.floor(p * N));
    const cabeca = pontos[k];
    return (
      <>
        {cabecalho}
        <svg width={LARGURA_QUADRO} height={ALTURA_QUADRO} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Hachuras id={id} />
          <clipPath id={`${id}-corte`}>
            <rect x={P.x} y={P.y - 20} width={30 + p * (P.w - 60)} height={P.h + 40} />
          </clipPath>
          {/* eixos a nanquim */}
          <line x1={P.x} y1={P.y + P.h} x2={P.x + P.w * pEixo} y2={P.y + P.h} stroke={cor.tinta} strokeWidth={3.5} />
          <line x1={P.x} y1={P.y + P.h} x2={P.x} y2={P.y + P.h - P.h * pEixo} stroke={cor.tinta} strokeWidth={3.5} />
          {/* o esboço a lápis do caminho, até ser desenhado */}
          <path d={d} fill="none" stroke={cor.lapis} strokeWidth={4} strokeDasharray="10 12" opacity={0.7 * (1 - p)} />
          <g clipPath={`url(#${id}-corte)`}>
            <path d={area} fill={`url(#${id}-leve)`} />
            <path d={d} fill="none" stroke={cor.tinta} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
          </g>
          {p > 0 ? <circle cx={cabeca[0]} cy={cabeca[1]} r={13} fill={cor.ameixa} /> : null}
        </svg>
      </>
    );
  }

  // ---------- pizza ----------
  if (m.forma === "pizza") {
    const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
    const r = Math.min(P.h / 2 - 6, R.w * 0.21);
    const cx = P.x + r + 6;
    const cy = P.y + P.h / 2;
    const fills = [`${cor.ameixa}`, `url(#${id}-tinta)`, `url(#${id}-ameixa)`, `url(#${id}-pontos)`, `url(#${id}-cruz)`, `url(#${id}-leve)`];
    let a0 = -Math.PI / 2;
    const xLegenda = cx + r + 46;
    const wLegenda = R.x + R.w - xLegenda;
    return (
      <>
        {cabecalho}
        <svg width={LARGURA_QUADRO} height={ALTURA_QUADRO} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Hachuras id={id} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={cor.lapis} strokeWidth={4} strokeDasharray="10 12" />
          {dados.map((dado, i) => {
            const frac = Math.max(0, dado.valor) / total;
            const ini = a0;
            a0 += frac * Math.PI * 2;
            const p = prog(t, dado.em - 0.02, 0.5);
            if (p <= 0) return null;
            const fimA = ini + frac * Math.PI * 2 * p;
            const grande = fimA - ini > Math.PI ? 1 : 0;
            const caminho =
              frac >= 0.999 && p >= 1
                ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
                : `M ${cx} ${cy} L ${cx + r * Math.cos(ini)} ${cy + r * Math.sin(ini)} A ${r} ${r} 0 ${grande} 1 ${cx + r * Math.cos(fimA)} ${cy + r * Math.sin(fimA)} Z`;
            return <path key={i} d={caminho} fill={fills[i % fills.length]} stroke={cor.tinta} strokeWidth={3.5} strokeLinejoin="round" />;
          })}
        </svg>
        {(() => {
          // legenda: amostra + valor + rótulo numa linha (o rótulo quebra se precisar), linhas medidas
          const itens = dados.map((dado) => {
            const valor = comUnidade(formatarNumero(dado.valor, casasDe(dado.valor)), m.unidade);
            const larguraValor = larguraTexto(valor, 46, VALOR) + 16;
            const e = encaixar(dado.rotulo, { largura: wLegenda - 66 - larguraValor, max: 42, min: 32, linhas: 2, fonte: ROTULO });
            return { valor, larguraValor, e, h: Math.max(52, e.linhas.length * e.corpo * 1.08) + 16 };
          });
          const alturaTotal = itens.reduce((s, x) => s + x.h, 0);
          let y = P.y + Math.max(0, (P.h - alturaTotal) / 2);
          return dados.map((dado, i) => {
            const dito = t >= dado.em - 0.02;
            const it = itens[i];
            const top = y;
            y += it.h;
            return (
              <div key={i} style={{ position: "absolute", left: xLegenda, top, width: wLegenda, display: "flex", alignItems: "flex-start", gap: 18 }}>
                <svg width={48} height={48} style={{ flex: "none", marginTop: 2 }}>
                  <Hachuras id={`${id}-l${i}`} />
                  <rect
                    x={2}
                    y={2}
                    width={44}
                    height={44}
                    rx={6}
                    fill={dito ? fills[i % fills.length].replace(`#${id}-`, `#${id}-l${i}-`) : "none"}
                    stroke={dito ? cor.tinta : cor.lapis}
                    strokeWidth={3}
                    strokeDasharray={dito ? undefined : "6 6"}
                  />
                </svg>
                <div style={{ width: it.larguraValor, flex: "none", fontFamily: serif, fontWeight: 700, fontSize: 46, lineHeight: "52px", color: dito ? cor.ameixa : cor.lapis, whiteSpace: "nowrap" }}>
                  {dito ? it.valor : "—"}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingTop: Math.max(0, (52 - it.e.corpo * 1.08) / 2) }}>
                  <LinhasFaladas linhas={it.e.linhas} corpo={it.e.corpo} entrelinha={1.08} fonte={ROTULO} t={t} cor={dito ? cor.tinta : cor.lapis} esboco="nada" />
                </div>
              </div>
            );
          });
        })()}
      </>
    );
  }

  // ---------- barras e linha ----------
  const n = dados.length;
  const slot = P.w / n;
  const alturaRotulos = 96;
  const base = P.y + P.h - alturaRotulos;
  const alturaUtil = base - P.y - 70;
  const max = Math.max(...dados.map((d) => d.valor), 0.0001);
  const min = Math.min(...dados.map((d) => d.valor));
  const deZero = m.forma === "barras" || min >= 0 && min < max * 0.4;
  const v0 = deZero ? Math.min(0, min) : min - (max - min) * 0.25;
  const yDe = (v: number) => base - ((v - v0) / (max - v0 || 1)) * alturaUtil;
  // a "da vez": o último dado já dito
  let daVez = -1;
  dados.forEach((d, i) => {
    if (t >= d.em - 0.02) daVez = i;
  });
  const corpoValor = Math.min(54, Math.max(40, Math.floor(slot * 0.32)));
  const valorTexto = (i: number, p: number) => comUnidade(formatarNumero(p >= 1 ? dados[i].valor : dados[i].valor * p, casasDe(dados[i].valor)), m.unidade);
  const larguraBarra = Math.min(150, slot * 0.56);
  const xs = dados.map((_, i) => P.x + slot * (i + 0.5));

  return (
    <>
      {cabecalho}
      <svg width={LARGURA_QUADRO} height={ALTURA_QUADRO} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Hachuras id={id} />
        <line x1={P.x} y1={base} x2={P.x + P.w * pEixo} y2={base} stroke={cor.tinta} strokeWidth={3.5} />
        {m.forma === "barras"
          ? dados.map((d, i) => {
              const p = prog(t, d.em - 0.02, 0.55);
              const y = yDe(d.valor);
              const h = (base - y) * p;
              const x = xs[i] - larguraBarra / 2;
              if (p <= 0)
                return <rect key={i} x={x} y={base - 26} width={larguraBarra} height={26} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="8 8" />;
              const daVezI = i === daVez;
              return (
                <g key={i}>
                  <rect x={x} y={base - h} width={larguraBarra} height={h} fill={`url(#${id}-${daVezI ? "ameixa" : "tinta"})`} />
                  <rect x={x} y={base - h} width={larguraBarra} height={h} fill="none" stroke={daVezI ? cor.ameixa : cor.tinta} strokeWidth={4} />
                </g>
              );
            })
          : (() => {
              const pts = dados.map((d, i) => [xs[i], yDe(d.valor)] as const);
              const segs = pts.slice(1).map((pt, k) => {
                const a = pts[k];
                const p = prog(t, dados[k + 1].em - 0.3, 0.45);
                if (p <= 0) return <line key={`s${k}`} x1={a[0]} y1={a[1]} x2={pt[0]} y2={pt[1]} stroke={cor.lapis} strokeWidth={4} strokeDasharray="10 12" opacity={0.6} />;
                return <line key={`s${k}`} x1={a[0]} y1={a[1]} x2={a[0] + (pt[0] - a[0]) * p} y2={a[1] + (pt[1] - a[1]) * p} stroke={cor.tinta} strokeWidth={6} strokeLinecap="round" />;
              });
              const pontos = pts.map((pt, i) => {
                const p = prog(t, dados[i].em - 0.02, 0.25);
                return p > 0 ? (
                  <circle key={`p${i}`} cx={pt[0]} cy={pt[1]} r={11 + 3 * (i === daVez ? 1 : 0)} fill={i === daVez ? cor.ameixa : cor.tinta} opacity={p} />
                ) : (
                  <circle key={`p${i}`} cx={pt[0]} cy={pt[1]} r={10} fill="none" stroke={cor.lapis} strokeWidth={3} />
                );
              });
              return (
                <>
                  {segs}
                  {pontos}
                </>
              );
            })()}
      </svg>
      {dados.map((d, i) => {
        const p = prog(t, d.em - 0.02, 0.55);
        const y = m.forma === "barras" ? base - (base - yDe(d.valor)) * p : yDe(d.valor);
        const texto = valorTexto(i, p);
        const corpo = Math.min(corpoValor, Math.floor(corpoValor * Math.min(1, (slot - 8) / Math.max(1, larguraTexto(valorTexto(i, 1), corpoValor, VALOR)))));
        return (
          <div key={i}>
            {p > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: xs[i] - slot / 2,
                  top: y - corpo * 1.25 - (m.forma === "linha" ? 10 : 4),
                  width: slot,
                  textAlign: "center",
                  fontFamily: serif,
                  fontWeight: 700,
                  fontSize: corpo,
                  lineHeight: 1.1,
                  color: i === daVez ? cor.ameixa : cor.tinta,
                  fontVariantNumeric: "tabular-nums lining-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {texto}
              </div>
            ) : null}
            <RotuloDado texto={d.rotulo} x={xs[i] - slot / 2 + 4} y={base + 14} w={slot - 8} dito={p > 0} />
          </div>
        );
      })}
    </>
  );
};
