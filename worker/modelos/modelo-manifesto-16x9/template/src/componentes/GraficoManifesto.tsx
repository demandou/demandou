import { firme, prog } from "../anim";
import type { GraficoPosto } from "../blocos";
import type { Campo as CampoT } from "../plano";
import { APERTO, caber, CAMPOS, display, letreiro, numeroBR, QUADRO, quebrarMono } from "../tema";

type Cores = (typeof CAMPOS)[CampoT];

// O gráfico do Manifesto: chapado, grosso, sem grade nem sombra. Colunas sólidas, uma linha grossa
// de acento, um anel. O maior valor (ou o fim da tendência) vai na cor de acento. Cada coluna,
// ponto ou fatia entra quando o dado é dito; antes disso, já está "a lápis" no lugar.
const MONO = 28;
const BASE = 6;

const casasDe = (vs: number[]) => Math.min(2, Math.max(0, ...vs.map((v) => (String(v).split(".")[1] ?? "").length)));
// unidade curta vai colada no valor ("40%", "60 MIL", "3 KG"); longa vira letreiro no alto
const unidadeCurta = (u?: string) => !!u && u.trim().length <= 4;
const comUnidade = (v: string, u?: string) => {
  if (!unidadeCurta(u)) return v;
  const x = u!.trim();
  return /^[%x×]/i.test(x) ? `${v}${x}` : `${v} ${x.toLocaleUpperCase("pt-BR")}`;
};

// formas da tendência (frações da altura, da esquerda para a direita)
const FORMAS: Record<"sobe" | "cai" | "oscila", number[]> = {
  sobe: [0.12, 0.3, 0.22, 0.48, 0.4, 0.7, 0.62, 0.95],
  cai: [0.95, 0.72, 0.8, 0.52, 0.6, 0.32, 0.38, 0.1],
  oscila: [0.45, 0.8, 0.35, 0.75, 0.3, 0.85, 0.4, 0.7],
};

export const GraficoManifesto: React.FC<{ g: GraficoPosto; t: number; c: Cores }> = ({ g, t, c }) => {
  const cabeca = 50;
  const temRotulos = !!g.dados?.length && g.forma !== "pizza";
  const rotulosH = temRotulos ? 2 * MONO + 18 : 0;
  const area = { x: g.x, y: g.y + cabeca, w: g.w, h: g.h - cabeca - rotulosH - (temRotulos ? 14 : 0) };
  const base = area.y + area.h;
  const linhaBase = prog(t, g.de + 0.1, 0.4);
  const cab = (
    <>
      {g.unidade && !unidadeCurta(g.unidade) ? (
        <div style={{ ...letreiro, position: "absolute", left: g.x, top: g.y, color: c.letreiro }}>{g.unidade}</div>
      ) : null}
      {g.ilustrativo ? (
        <div style={{ ...letreiro, position: "absolute", right: QUADRO.w - g.x - g.w, top: g.y, color: c.letreiro, border: `3px solid ${c.letreiro}`, padding: "6px 12px 4px" }}>
          ilustrativo
        </div>
      ) : null}
    </>
  );

  // ——— com números ditos ———
  if (g.dados?.length) {
    const dados = g.dados;
    const n = dados.length;
    const vmax = Math.max(...dados.map((d) => d.valor), 0.0001);
    const imax = dados.findIndex((d) => d.valor === vmax);
    // cada valor com as casas dele ("6,17%", "12%"); contando, mantém as casas do valor final
    const casasDoValor = (v: number) => casasDe([v]);
    const valorTexto = (v: number, final = v) => comUnidade(numeroBR(v, casasDoValor(final)), g.unidade);

    if (g.forma === "pizza") {
      const total = dados.reduce((s, d) => s + d.valor, 0) || 1;
      const R = Math.min(area.h / 2 - 6, area.w * 0.27);
      const cx = area.x + R + 6;
      const cy = area.y + area.h / 2;
      const esp = Math.max(70, R * 0.45);
      const coresFatia = [c.acento, c.texto, c.riscada, c.letreiro, c.acento, c.texto];
      let acum = 0;
      const legX = cx + R + 56;
      const legW = area.x + area.w - legX;
      return (
        <>
          {cab}
          <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", inset: 0 }}>
            <circle cx={cx} cy={cy} r={R - esp / 2} fill="none" stroke={c.lapis} strokeWidth={esp} />
            {dados.map((d, k) => {
              const frac = d.valor / total;
              const ini = acum;
              acum += frac;
              const p = prog(t, d.em - 0.05, 0.5, firme);
              const comp = 2 * Math.PI * (R - esp / 2);
              return p > 0 ? (
                <circle
                  key={k}
                  cx={cx}
                  cy={cy}
                  r={R - esp / 2}
                  fill="none"
                  stroke={coresFatia[k % coresFatia.length]}
                  strokeWidth={esp}
                  strokeDasharray={`${comp * frac * p} ${comp}`}
                  strokeDashoffset={-comp * ini}
                  transform={`rotate(-90 ${cx} ${cy})`}
                />
              ) : null;
            })}
          </svg>
          {(() => {
            // legenda ao lado do anel: valor grande e o nome em letreiro, centrada na altura do anel
            const tamValor = Math.max(44, Math.min(84, ...dados.map((d) => caber(valorTexto(d.valor), legW - 50, 84, 900, APERTO))));
            const nomes = dados.map((d) => quebrarMono(d.rotulo, legW - 50, MONO).slice(0, 2));
            const alturas = nomes.map((n) => tamValor + n.length * (MONO + 8) + 24);
            const total = alturas.reduce((a, b) => a + b, 0);
            let y = cy - total / 2;
            return dados.map((d, k) => {
              const p = prog(t, d.em - 0.05, 0.6);
              const topo = y;
              y += alturas[k];
              return (
                <div key={k} style={{ position: "absolute", left: legX, top: topo, width: legW }}>
                  <div style={{ position: "absolute", left: 0, top: tamValor * 0.12, width: 32, height: 32, background: p > 0 ? coresFatia[k % coresFatia.length] : c.lapis }} />
                  <div style={{ marginLeft: 50 }}>
                    <div style={{ fontFamily: display, fontWeight: 900, fontSize: tamValor, lineHeight: 1, letterSpacing: `${APERTO}em`, color: p > 0 ? c.texto : c.lapis }}>
                      {valorTexto(p > 0 ? d.valor * p : d.valor, d.valor)}
                    </div>
                    {nomes[k].map((l, j) => (
                      <div key={j} style={{ ...letreiro, color: p > 0 ? c.letreiro : c.lapis, marginTop: 8 }}>
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </>
      );
    }

    const gap = n > 4 ? 22 : 34;
    const cw = (area.w - gap * (n - 1)) / n;
    const valorTam = Math.max(30, Math.min(64, ...dados.map((d) => caber(valorTexto(d.valor), cw + gap - 10, 64, 900, APERTO))));
    const topoUtil = area.y + valorTam + 16;
    const altura = (v: number) => Math.max(BASE, ((base - topoUtil) * v) / vmax);
    const xs = dados.map((_, k) => area.x + k * (cw + gap));
    const rotulos = dados.map((d) => quebrarMono(d.rotulo, cw + gap - 8, MONO).slice(0, 2));

    if (g.forma === "linha") {
      const pts = dados.map((d, k) => ({ x: xs[k] + cw / 2, y: base - altura(d.valor) }));
      const seg = dados.map((d, k) => (k === 0 ? 1 : prog(t, d.em - 0.1, 0.45, firme)));
      let caminho = "";
      pts.forEach((p, k) => {
        if (k === 0) {
          if (t >= dados[0].em - 0.05) caminho = `M${p.x} ${p.y}`;
          return;
        }
        if (seg[k] <= 0) return;
        const a = pts[k - 1];
        caminho += ` L${a.x + (p.x - a.x) * seg[k]} ${a.y + (p.y - a.y) * seg[k]}`;
      });
      return (
        <>
          {cab}
          <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", inset: 0 }}>
            <rect x={area.x} y={base} width={area.w * linhaBase} height={BASE} fill={c.texto} />
            <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={c.lapis} strokeWidth={14} strokeLinejoin="miter" />
            {caminho ? <path d={caminho} fill="none" stroke={c.acento} strokeWidth={14} strokeLinejoin="miter" strokeLinecap="square" /> : null}
            {pts.map((p, k) =>
              t >= dados[k].em - 0.05 ? <rect key={k} x={p.x - 17} y={p.y - 17} width={34} height={34} fill={c.texto} /> : null,
            )}
          </svg>
          {dados.map((d, k) => {
            const p = prog(t, d.em - 0.05, 0.6);
            return (
              <div key={k}>
                <div
                  style={{
                    position: "absolute",
                    left: xs[k] - gap / 2,
                    width: cw + gap,
                    top: pts[k].y - valorTam - 26,
                    textAlign: "center",
                    fontFamily: display,
                    fontWeight: 900,
                    fontSize: valorTam,
                    lineHeight: 1,
                    letterSpacing: `${APERTO}em`,
                    color: p > 0 ? c.texto : c.lapis,
                  }}
                >
                  {valorTexto(p > 0 ? d.valor * p : d.valor, d.valor)}
                </div>
                {rotulos[k].map((l, j) => (
                  <div key={j} style={{ ...letreiro, position: "absolute", left: xs[k] - gap / 2, width: cw + gap, top: base + 24 + j * (MONO + 10), textAlign: "center", color: p > 0 ? c.letreiro : c.lapis }}>
                    {l}
                  </div>
                ))}
              </div>
            );
          })}
        </>
      );
    }

    // barras: colunas sólidas que sobem quando o dado é dito; o valor conta junto
    return (
      <>
        {cab}
        {dados.map((d, k) => {
          const p = prog(t, d.em - 0.05, 0.5, firme);
          const h = altura(d.valor);
          const cor = k === imax ? c.acento : c.texto;
          return (
            <div key={k}>
              <div style={{ position: "absolute", left: xs[k], width: cw, top: base - h, height: h, background: c.lapis }} />
              <div style={{ position: "absolute", left: xs[k], width: cw, top: base - h * p, height: h * p, background: cor }} />
              <div
                style={{
                  position: "absolute",
                  left: xs[k] - gap / 2,
                  width: cw + gap,
                  top: base - h * Math.max(p, 0) - valorTam - 14,
                  textAlign: "center",
                  fontFamily: display,
                  fontWeight: 900,
                  fontSize: valorTam,
                  lineHeight: 1,
                  letterSpacing: `${APERTO}em`,
                  color: p > 0 ? c.texto : c.lapis,
                }}
              >
                {valorTexto(p > 0 ? d.valor * p : d.valor, d.valor)}
              </div>
              {rotulos[k].map((l, j) => (
                <div key={j} style={{ ...letreiro, position: "absolute", left: xs[k] - gap / 2, width: cw + gap, top: base + 24 + j * (MONO + 10), textAlign: "center", color: p > 0 ? c.letreiro : c.lapis }}>
                  {l}
                </div>
              ))}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: area.x, top: base, width: area.w * linhaBase, height: BASE, background: c.texto }} />
      </>
    );
  }

  // ——— sem números: a forma da tendência, ilustrativa ———
  const forma = FORMAS[g.tendencia ?? "sobe"];
  const t0 = g.tendenciaEm;
  if (g.forma === "barras") {
    const n = 5;
    const alturas = [0, 2, 4, 5, 7].map((i) => forma[i]);
    const gap = 30;
    const cw = (area.w - gap * (n - 1)) / n;
    return (
      <>
        {cab}
        {alturas.map((a, k) => {
          const p = prog(t, t0 + k * 0.22, 0.45, firme);
          const h = Math.max(BASE, area.h * 0.92 * a);
          const x = area.x + k * (cw + gap);
          const ultima = (g.tendencia ?? "sobe") === "cai" ? k === 0 : k === n - 1;
          return (
            <div key={k}>
              <div style={{ position: "absolute", left: x, width: cw, top: base - h, height: h, background: c.lapis }} />
              <div style={{ position: "absolute", left: x, width: cw, top: base - h * p, height: h * p, background: ultima ? c.acento : c.texto }} />
            </div>
          );
        })}
        <div style={{ position: "absolute", left: area.x, top: base, width: area.w * linhaBase, height: BASE, background: c.texto }} />
      </>
    );
  }
  // linha grossa de acento que se desenha da esquerda para a direita, com a ponta da seta no fim
  const pts = forma.map((f, k) => ({ x: area.x + 20 + (k * (area.w - 70)) / (forma.length - 1), y: area.y + 20 + (area.h - 40) * (1 - f) }));
  const p = prog(t, t0, 1.5, firme);
  const total = pts.length - 1;
  const ate = p * total;
  let caminho = `M${pts[0].x} ${pts[0].y}`;
  let ponta = pts[0];
  let antes = pts[0];
  for (let k = 1; k <= total; k++) {
    if (ate >= k) {
      caminho += ` L${pts[k].x} ${pts[k].y}`;
      antes = pts[k - 1];
      ponta = pts[k];
    } else if (ate > k - 1) {
      const f = ate - (k - 1);
      ponta = { x: pts[k - 1].x + (pts[k].x - pts[k - 1].x) * f, y: pts[k - 1].y + (pts[k].y - pts[k - 1].y) * f };
      antes = pts[k - 1];
      caminho += ` L${ponta.x} ${ponta.y}`;
      break;
    } else break;
  }
  const ang = Math.atan2(ponta.y - antes.y, ponta.x - antes.x);
  const seta = 40;
  const asa = (s: number) => `${ponta.x - seta * Math.cos(ang + s)},${ponta.y - seta * Math.sin(ang + s)}`;
  return (
    <>
      {cab}
      <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", inset: 0 }}>
        {[0.25, 0.5, 0.75].map((f) => (
          <rect key={f} x={area.x} y={area.y + area.h * f} width={area.w} height={3} fill={c.lapis} />
        ))}
        <polyline points={pts.map((q) => `${q.x},${q.y}`).join(" ")} fill="none" stroke={c.lapis} strokeWidth={22} strokeLinejoin="miter" />
        {p > 0 ? <path d={caminho} fill="none" stroke={c.acento} strokeWidth={22} strokeLinejoin="miter" strokeLinecap="butt" /> : null}
        {p > 0.02 && (g.tendencia ?? "sobe") !== "oscila" ? <polygon points={`${ponta.x},${ponta.y} ${asa(0.55)} ${asa(-0.55)}`} fill={c.acento} /> : null}
        <rect x={area.x} y={base} width={area.w * linhaBase} height={BASE} fill={c.texto} />
      </svg>
    </>
  );
};
