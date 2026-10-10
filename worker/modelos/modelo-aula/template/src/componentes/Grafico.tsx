// O gráfico da Aula, desenhado na folha do slide enquanto a fala explica:
// - `series` (sem números): 1 a 3 linhas qualitativas (reta, curva, queda, plana), cada uma se
//   desenha quando é dita; a legenda no alto à esquerda com a nota palavra por palavra; a linha de
//   base tracejada (`base`) e o sombreado entre as duas primeiras (`diferencaEm`). Etiqueta
//   "ilustrativo" sempre visível.
// - `dados` (números ditos): barras que crescem, linha ponto a ponto ou rosca, cada valor no `em`.
// - só `tendencia`: uma linha qualitativa (sobe, cai, oscila), com "ilustrativo".
import { encaixar } from "../medida";
import type { Grafico as TGrafico, Plano, Serie } from "../plano";
import { COR, FONTE, PAD, formatar, prog, suave } from "../tema";
import { UTIL, cabecalho } from "./Folha";
import { TextoFalado, disporTexto } from "./Texto";

const formaDa = (s: Serie["forma"], u: number) => {
  if (s === "reta") return u * 0.42;
  // a curva cresce cada vez mais e fica sempre acima da reta (juros sobre juros, bola de neve…)
  if (s === "curva") return 0.42 * u + 0.44 * Math.pow(u, 2.4);
  if (s === "queda") return -0.5 * (1 - Math.exp(-2.2 * u)) / (1 - Math.exp(-2.2));
  return 0;
};
const formaDaTendencia = (t?: string): Serie["forma"] => (t === "cai" ? "queda" : t === "oscila" ? "plana" : "curva");

const Etiqueta: React.FC<{ x: number; y: number; t: number; de: number; alinhar?: "dir" }> = ({ x, y, t, de, alinhar }) => (
  <div style={{ position: "absolute", left: alinhar === "dir" ? undefined : x, right: alinhar === "dir" ? x : undefined, top: y, padding: "6px 14px", borderRadius: 10, background: "#F4F2EC", fontFamily: FONTE, fontWeight: 800, fontSize: 22, letterSpacing: "0.1em", textTransform: "uppercase", color: COR.apoio, opacity: prog(t, de, 0.4) }}>
    ilustrativo
  </div>
);

export const Grafico: React.FC<{ plano: Plano; m: TGrafico; t: number; h: number }> = ({ plano, m, t, h }) => {
  const cab = cabecalho(plano, { titulo: m.titulo, em: m.de, ate: m.ate }, t);
  const topo = m.titulo ? cab.altura : PAD + 20;
  const dados = m.dados ?? [];
  if (dados.length >= 2 && !m.series?.length) {
    if (m.forma === "pizza") return <Rosca plano={plano} m={m} t={t} h={h} topo={topo} cab={cab.elemento} />;
    return <Barras plano={plano} m={m} t={t} h={h} topo={topo} cab={cab.elemento} />;
  }
  const series: Serie[] = m.series?.length ? m.series : [{ rotulo: m.titulo ?? "", em: m.tendenciaEm ?? m.de + 0.3, forma: formaDaTendencia(m.tendencia), destaque: true }];
  const comLegenda = !!m.series?.length;
  // a área do gráfico
  const px0 = PAD + 70;
  const px1 = PAD + UTIL - 40;
  const py0 = topo + 20;
  const py1 = h - PAD - 50;
  const temQueda = series.some((s) => s.forma === "queda");
  const yBase = temQueda ? (py0 + py1) / 2 : py1 - 0.16 * (py1 - py0);
  const alcance = yBase - py0 - 20;
  const xFim = px1 - 110;
  const ponto = (s: Serie, u: number) => ({ x: px0 + u * (xFim - px0), y: yBase - formaDa(s.forma, u) * alcance * (temQueda ? 0.9 : 1) });
  const N = 60;
  const eixos = prog(t, m.de, 0.5, suave);
  // quanto tempo cada série leva para se desenhar: até a próxima ser dita (0,8 a 1,4 s)
  const durDe = (i: number) => {
    const prox = series[i + 1]?.em;
    // a segunda série termina de se desenhar quando o sombreado da diferença entra
    const ate = prox ?? (i === 1 && m.diferencaEm !== undefined ? m.diferencaEm + 0.05 : undefined);
    return Math.max(0.8, Math.min(1.4, ate !== undefined ? ate - series[i].em - 0.1 : 1.3));
  };
  const corDe = (s: Serie, i: number) => (s.destaque || (series.length > 1 && i === 1) ? COR.violeta : COR.tinta);
  const caminho = (s: Serie) => Array.from({ length: N + 1 }, (_, k) => ponto(s, k / N)).map((q, k) => `${k ? "L" : "M"}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
  // o sombreado entre as duas primeiras séries (o que uma ganha a mais que a outra)
  const dif = m.diferencaEm !== undefined && series.length >= 2 ? prog(t, m.diferencaEm, 0.6) : 0;
  const area =
    dif > 0
      ? [...Array.from({ length: N + 1 }, (_, k) => ponto(series[1], k / N)), ...Array.from({ length: N + 1 }, (_, k) => ponto(series[0], 1 - k / N))]
          .map((q, k) => `${k ? "L" : "M"}${q.x.toFixed(1)},${q.y.toFixed(1)}`)
          .join(" ") + " Z"
      : "";
  const base = m.base ? prog(t, m.base.em - 0.03, 0.6, suave) : 0;
  const eBase = m.base ? prog(t, m.base.em + 0.2, 0.3) : 0;
  // a legenda: no alto à esquerda (onde as linhas ainda estão baixas)
  const xL = px0 + 34;
  let yL = py0 + 6;
  const legenda = comLegenda
    ? series.map((s, i) => {
        const e = prog(t, s.em - 0.03, 0.3);
        const nota = s.nota ? disporTexto(s.nota, { largura: 560, max: 32, min: 26, linhas: 2, peso: 600, fala: plano.palavras, de: s.notaEm ?? s.em, ate: m.ate, entrelinha: 1.25 }) : null;
        const tamR = encaixar(s.rotulo, { largura: 500, max: 36, min: 28, linhas: 1, fonte: { peso: 800 } }).tamanho;
        const y = yL;
        yL += Math.round(tamR * 1.3) + (nota ? nota.altura + 8 : 0) + 22;
        if (e <= 0) return null;
        return (
          <div key={`l${i}`} style={{ position: "absolute", left: xL, top: y, width: 600, opacity: e >= 1 ? 1 : e, transform: e >= 1 ? undefined : `translateY(${(1 - e) * 10}px)` }}>
            <div style={{ position: "absolute", left: 0, top: tamR * 0.62, width: 40, height: 7, borderRadius: 4, background: corDe(s, i) }} />
            <div style={{ position: "absolute", left: 56, top: 0, fontFamily: FONTE, fontWeight: 800, fontSize: tamR, lineHeight: 1.3, color: COR.tinta, whiteSpace: "nowrap" }}>{s.rotulo}</div>
            {nota ? <TextoFalado d={nota} x={56} y={Math.round(tamR * 1.3) + 4} t={t} peso={600} cor={COR.apoio} /> : null}
          </div>
        );
      })
    : null;
  const tamEixo = 26;
  return (
    <>
      {cab.elemento}
      <svg width={1176} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* eixos */}
        <path d={`M${px0},${py0 - 10} L${px0},${py1}`} stroke={COR.linha} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - eixos} fill="none" />
        <path d={`M${px0},${py1} L${px1},${py1}`} stroke={COR.linha} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - eixos} fill="none" />
        {eixos >= 1 ? (
          <>
            <path d={`M${px0 - 9},${py0 + 4} L${px0},${py0 - 12} L${px0 + 9},${py0 + 4}`} stroke={COR.linha} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M${px1 - 14},${py1 - 9} L${px1 + 2},${py1} L${px1 - 14},${py1 + 9}`} stroke={COR.linha} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : null}
        {dif > 0 ? <path d={area} fill={COR.marcaTexto} opacity={0.85 * dif} /> : null}
        {base > 0 ? <path d={`M${px0},${yBase} L${xFim},${yBase}`} stroke={COR.apoio} strokeWidth={3} strokeDasharray="12 10" fill="none" opacity={0.9} clipPath={undefined} style={{ clipPath: `inset(0 ${((1 - base) * 100).toFixed(1)}% 0 0)` }} /> : null}
        {series.map((s, i) => {
          const p = prog(t, s.em - 0.03, durDe(i), suave);
          if (p <= 0) return null;
          const fim = ponto(s, p);
          return (
            <g key={i}>
              <path d={caminho(s)} fill="none" stroke={corDe(s, i)} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
              <circle cx={fim.x} cy={fim.y} r={p >= 1 ? 11 + 2 * Math.sin((t - s.em) * 4 + i) : 9} fill={corDe(s, i)} stroke={COR.folha} strokeWidth={4} />
            </g>
          );
        })}
        <circle cx={px0} cy={yBase} r={9 * eixos} fill={COR.tinta} />
      </svg>
      {/* rótulos dos eixos e da base */}
      {m.eixos ? (
        <>
          <div style={{ position: "absolute", left: px0 - 40, top: (py0 + py1) / 2, width: 0, height: 0, opacity: eixos }}>
            <div style={{ position: "absolute", left: 0, top: 0, transform: "translate(-50%, -50%) rotate(-90deg)", fontFamily: FONTE, fontWeight: 700, fontSize: tamEixo, color: COR.apoio, whiteSpace: "nowrap" }}>{m.eixos.y}</div>
          </div>
          <div style={{ position: "absolute", left: px1 - 160, width: 160, textAlign: "right", top: py1 + 14, fontFamily: FONTE, fontWeight: 700, fontSize: tamEixo, color: COR.apoio, opacity: eixos, whiteSpace: "nowrap" }}>{m.eixos.x}</div>
        </>
      ) : null}
      {m.base ? (
        <div style={{ position: "absolute", left: px0 + 24, top: yBase + 12, fontFamily: FONTE, fontWeight: 700, fontSize: 28, color: COR.apoio, whiteSpace: "nowrap", opacity: eBase, transform: eBase >= 1 ? undefined : `translateY(${(1 - eBase) * 8}px)` }}>{m.base.rotulo}</div>
      ) : null}
      {legenda}
      {m.ilustrativo !== false ? <Etiqueta x={PAD + 0} y={py0 - 4} t={t} de={m.de + 0.2} alinhar="dir" /> : null}
    </>
  );
};

// ——— dados ditos: barras (ou linha) ———
const Barras: React.FC<{ plano: Plano; m: TGrafico; t: number; h: number; topo: number; cab: React.ReactNode }> = ({ m, t, h, topo, cab }) => {
  const dados = m.dados ?? [];
  const n = dados.length;
  const max = Math.max(...dados.map((d) => d.valor), 1);
  const x0 = PAD + 20;
  const larg = UTIL - 40;
  const yTopo = topo + 60;
  const yChao = h - PAD - 64;
  const alt = yChao - yTopo;
  const slot = larg / n;
  const wB = Math.min(150, slot * 0.56);
  const fmt = (v: number) => `${formatar(v, Number.isInteger(v) ? 0 : 1)}${m.unidade ? ` ${m.unidade}` : ""}`;
  const tamR = Math.min(...dados.map((d) => encaixar(d.rotulo, { largura: slot - 16, max: 28, min: 18, linhas: 1, fonte: { peso: 700 } }).tamanho));
  const linha = m.forma === "linha";
  const pts = dados.map((d, i) => ({ x: x0 + slot * (i + 0.5), y: yChao - (d.valor / max) * alt * 0.9 }));
  return (
    <>
      {cab}
      <div style={{ position: "absolute", left: x0, top: yChao, width: larg, height: 4, borderRadius: 2, background: COR.linha }} />
      {linha ? (
        <svg width={1176} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {pts.slice(1).map((q, i) => {
            const p = prog(t, dados[i + 1].em - 0.03, 0.4, suave);
            const a = pts[i];
            return p > 0 ? <line key={i} x1={a.x} y1={a.y} x2={a.x + (q.x - a.x) * p} y2={a.y + (q.y - a.y) * p} stroke={COR.violeta} strokeWidth={7} strokeLinecap="round" /> : null;
          })}
          {pts.map((q, i) => (prog(t, dados[i].em - 0.03, 0.3) > 0 ? <circle key={`c${i}`} cx={q.x} cy={q.y} r={12} fill={i === n - 1 ? COR.violeta : COR.tinta} stroke={COR.folha} strokeWidth={4} /> : null))}
        </svg>
      ) : null}
      {dados.map((d, i) => {
        const p = prog(t, d.em - 0.03, 0.5, suave);
        if (p <= 0) return null;
        const hB = (d.valor / max) * alt * 0.9 * p;
        const xc = x0 + slot * (i + 0.5);
        const ultimo = i === n - 1;
        return (
          <div key={i}>
            {linha ? null : <div style={{ position: "absolute", left: xc - wB / 2, top: yChao - hB, width: wB, height: hB, borderRadius: "12px 12px 0 0", background: ultimo ? COR.violeta : COR.tinta }} />}
            <div style={{ position: "absolute", left: xc - slot / 2, width: slot, textAlign: "center", top: (linha ? pts[i].y : yChao - hB) - 54, fontFamily: FONTE, fontWeight: 800, fontSize: 36, color: ultimo ? COR.violetaEscuro : COR.tinta, opacity: p, whiteSpace: "nowrap" }}>
              {fmt(d.valor * (p >= 1 ? 1 : p))}
            </div>
            <div style={{ position: "absolute", left: xc - slot / 2, width: slot, textAlign: "center", top: yChao + 16, fontFamily: FONTE, fontWeight: 700, fontSize: tamR, color: COR.apoio, opacity: p, whiteSpace: "nowrap" }}>{d.rotulo}</div>
          </div>
        );
      })}
    </>
  );
};

// ——— dados ditos: rosca ———
const Rosca: React.FC<{ plano: Plano; m: TGrafico; t: number; h: number; topo: number; cab: React.ReactNode }> = ({ m, t, h, topo, cab }) => {
  const dados = m.dados ?? [];
  const total = dados.reduce((a, d) => a + d.valor, 0) || 1;
  const r = Math.min(230, (h - topo - PAD - 20) / 2);
  const cx = PAD + r + 30;
  const cy = topo + 10 + r;
  const cores = [COR.violeta, COR.tinta, "#9C8BE8", COR.apoio, "#C9BEF7", COR.linha];
  let acc = 0;
  const C = 2 * Math.PI * (r - 30);
  return (
    <>
      {cab}
      <svg width={1176} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={cx} cy={cy} r={r - 30} fill="none" stroke={COR.trilho} strokeWidth={60} />
        {dados.map((d, i) => {
          const p = prog(t, d.em - 0.03, 0.6, suave);
          const frac = d.valor / total;
          const ini = acc;
          acc += frac;
          return p > 0 ? <circle key={i} cx={cx} cy={cy} r={r - 30} fill="none" stroke={cores[i % cores.length]} strokeWidth={60} strokeDasharray={`${C * frac * p} ${C}`} strokeDashoffset={-C * ini} transform={`rotate(-90 ${cx} ${cy})`} /> : null;
        })}
      </svg>
      {dados.map((d, i) => {
        const e = prog(t, d.em - 0.03, 0.3);
        if (e <= 0) return null;
        return (
          <div key={i} style={{ position: "absolute", left: cx + r + 70, top: topo + 30 + i * 74, display: "flex", alignItems: "center", gap: 18, opacity: e }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: cores[i % cores.length] }} />
            <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: 36, color: COR.tinta, whiteSpace: "nowrap" }}>{`${formatar(d.valor, Number.isInteger(d.valor) ? 0 : 1)}${m.unidade ?? ""}`}</div>
            <div style={{ fontFamily: FONTE, fontWeight: 600, fontSize: 28, color: COR.apoio, whiteSpace: "nowrap" }}>{d.rotulo}</div>
          </div>
        );
      })}
    </>
  );
};
