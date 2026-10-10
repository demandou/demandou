// Gráfico: o mesmo cartão branco da curva, embaixo do cartão da pessoa; o título se escreve ao lado.
// Com números ditos (`dados`): `linha` = a caneta liga os pontos, um a cada palavra; `barras` = barras
// que crescem sobre trilhos a lápis (a maior em marca-texto); `pizza` = fatias que se abrem no
// mostrador. Sem números (`tendencia`): a caneta desenha só a forma (sobe, cai, oscila) sobre o
// esboço a lápis, com o selo "ilustrativo".
import { caneta, casasDe, Escrita, formatarNumero, prog, temposDoTexto, Traco } from "../anim";
import { diagramar } from "../medidas";
import type { Grafico as TGrafico, Palavra } from "../plano";
import { CARTAO, cor, DIREITA_BAIXO, MARGEM, rotulo as estiloRotulo, sans, selo, serifa, titulo as estiloTitulo } from "../tema";

export const PAINEL = { x: MARGEM, y: 700, w: DIREITA_BAIXO - MARGEM, h: 800 };
const X0 = PAINEL.x + 70;
const X1 = PAINEL.x + PAINEL.w - 70;
const Y_TOPO = PAINEL.y + 150;
const Y_BASE = PAINEL.y + 590;

type Dado = { rotulo: string; valor: number; em: number };

// cada número com as casas que ele tem no plano (12 → "12"; 18.5 → "18,5")
const comUnidade = (v: number, _casas: number, unidade?: string) => {
  const n = formatarNumero(v, casasDe(v));
  if (!unidade) return n;
  return /^\s*%/.test(unidade) ? `${n}${unidade.trim()}` : `${n} ${unidade.trim()}`;
};

const forma = (tendencia: "sobe" | "cai" | "oscila", s: number) => {
  if (tendencia === "oscila") return 0.5 + 0.3 * Math.sin(2 * Math.PI * 1.6 * s + 0.35);
  const sobe = 0.12 + 0.72 * s + 0.07 * Math.sin(2.7 * Math.PI * s) * (1 - 0.4 * s);
  return tendencia === "sobe" ? sobe : 1 - sobe;
};

export const geometriaDoGrafico = (m: TGrafico) => {
  const C = CARTAO.grafico;
  const xCol = C.x + C.w + 60;
  const larguraCol = 1020 - xCol;
  const ilustrativo = m.ilustrativo || !m.dados?.length;
  const titulo = m.titulo ? diagramar(m.titulo, { equilibrar: true, largura: larguraCol, maximo: 68, minimo: 46, linhas: ilustrativo ? 3 : 4, altura: ilustrativo ? 330 : 430, entrelinha: 1.04 }) : null;
  return { xCol, larguraCol, titulo, ilustrativo, chegada: { x: 116, y: PAINEL.y } };
};

const Linha: React.FC<{ dados: Dado[]; t: number; unidade?: string }> = ({ dados, t, unidade }) => {
  const n = dados.length;
  const max = Math.max(...dados.map((d) => d.valor), 0);
  const min = Math.min(0, ...dados.map((d) => d.valor));
  const casas = Math.max(...dados.map((d) => casasDe(d.valor)));
  const x = (k: number) => X0 + 40 + (k * (X1 - X0 - 80)) / Math.max(1, n - 1);
  const y = (v: number) => Y_BASE - ((v - min) / Math.max(1e-9, max - min)) * (Y_BASE - Y_TOPO);
  const passo = (X1 - X0 - 80) / Math.max(1, n - 1);
  const atual = dados.reduce((k, d, i) => (t >= d.em ? i : k), -1);
  return (
    <>
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        <line x1={X0} y1={Y_BASE} x2={X1} y2={Y_BASE} stroke={cor.lapisClaro} strokeWidth={4} strokeLinecap="round" />
        <line x1={X0} y1={Y_TOPO} x2={X1} y2={Y_TOPO} stroke={cor.lapisClaro} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />
        {/* esboço a lápis da linha inteira */}
        <path d={dados.map((d, k) => `${k ? "L" : "M"} ${x(k)} ${y(d.valor)}`).join(" ")} fill="none" stroke={cor.lapisClaro} strokeWidth={4} strokeDasharray="2 12" strokeLinecap="round" />
        {dados.slice(1).map((d, k) => (
          <Traco key={`s-${k}`} d={`M ${x(k)} ${y(dados[k].valor)} L ${x(k + 1)} ${y(d.valor)}`} p={prog(t, d.em - 0.3, 0.36, caneta)} cor={cor.tinta} largura={7} />
        ))}
        {dados.map((d, k) => {
          const p = prog(t, d.em - 0.04, 0.25);
          return (
            <g key={`p-${k}`}>
              {k === atual ? <circle cx={x(k)} cy={y(d.valor)} r={26 * prog(t, d.em, 0.3)} fill={cor.marca} /> : null}
              <circle cx={x(k)} cy={y(d.valor)} r={p > 0 ? 11 : 8} fill={p > 0 ? cor.tinta : cor.lapisClaro} />
            </g>
          );
        })}
      </svg>
      {dados.map((d, k) => {
        const p = prog(t, d.em, 0.3);
        const rot = diagramar(d.rotulo, { equilibrar: true, largura: Math.min(240, passo - 12), maximo: 36, minimo: 34, linhas: 2, corte: "texto600", entrelinha: 1.1 });
        return (
          <div key={`r-${k}`}>
            <div
              style={{
                position: "absolute",
                left: x(k),
                top: y(d.valor) - 86,
                translate: "-50% 0",
                fontFamily: serifa,
                fontWeight: 800,
                fontSize: 44,
                color: cor.tinta,
                whiteSpace: "nowrap",
                opacity: p,
              }}
            >
              {comUnidade(d.valor, casas, unidade)}
            </div>
            <div
              style={{
                position: "absolute",
                left: x(k),
                top: Y_BASE + 26,
                translate: "-50% 0",
                fontFamily: sans,
                fontWeight: p > 0.5 ? 700 : 500,
                fontSize: rot.tamanho,
                lineHeight: 1.1,
                color: p > 0.5 ? cor.tinta : cor.lapis,
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              {rot.linhas.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

const Barras: React.FC<{ dados: Dado[]; t: number; unidade?: string }> = ({ dados, t, unidade }) => {
  const n = dados.length;
  const max = Math.max(...dados.map((d) => d.valor), 1e-9);
  const casas = Math.max(...dados.map((d) => casasDe(d.valor)));
  const topo = PAINEL.y + 56;
  const alto = Math.min(150, (PAINEL.h - 100) / n);
  const barra = Math.min(58, alto - 64);
  const xB = PAINEL.x + 44;
  const LB = PAINEL.w - 44 - 190;
  const forte = dados.findIndex((d) => d.valor === max);
  return (
    <>
      {dados.map((d, k) => {
        const y = topo + k * alto + Math.max(0, (alto - (barra + 52)) / 2);
        const p = prog(t, d.em, 0.6, caneta);
        const visto = t >= d.em - 0.05;
        const w = Math.max(0, (d.valor / max) * LB * p);
        const ehForte = k === forte;
        return (
          <div key={`b-${k}`}>
            <div style={{ position: "absolute", left: xB, top: y, fontFamily: sans, fontWeight: ehForte ? 700 : 600, fontSize: 38, lineHeight: 1, color: visto ? cor.tinta : cor.lapis, whiteSpace: "nowrap", maxWidth: PAINEL.w - 88 }}>{d.rotulo}</div>
            <div style={{ position: "absolute", left: xB, top: y + 50, width: LB, height: barra, borderRadius: 12, border: `4px dashed ${cor.lapis}`, opacity: 0.6 }} />
            <div
              style={{
                position: "absolute",
                left: xB,
                top: y + 50,
                width: w,
                height: barra,
                borderRadius: 12,
                background: ehForte ? cor.marca : cor.lapisClaro,
                border: `${ehForte ? 5 : 4}px solid ${ehForte ? cor.tinta : cor.lapis}`,
                opacity: p > 0 ? 1 : 0,
              }}
            />
            <div style={{ position: "absolute", left: xB + w + 18, top: y + 50 + barra / 2 - 24, fontFamily: serifa, fontWeight: 800, fontSize: 44, lineHeight: 1.1, color: cor.tinta, whiteSpace: "nowrap", opacity: prog(t, d.em + 0.4, 0.25) }}>
              {comUnidade(d.valor, casas, unidade)}
            </div>
          </div>
        );
      })}
    </>
  );
};

const PIZZA = { cx: 510, cy: 1000, r: 230 };
const TONS = [cor.tinta, cor.lapis, cor.lapisClaro, "#8C87A6", cor.esboco];

const Pizza: React.FC<{ dados: Dado[]; t: number; unidade?: string; de: number }> = ({ dados, t, unidade, de }) => {
  const soma = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
  const casas = Math.max(...dados.map((d) => casasDe(d.valor)));
  const max = Math.max(...dados.map((d) => d.valor));
  const forte = dados.findIndex((d) => d.valor === max);
  const { cx, cy, r } = PIZZA;
  const ponto = (ang: number, raio: number) => ({ x: cx + raio * Math.cos(((ang - 90) * Math.PI) / 180), y: cy + raio * Math.sin(((ang - 90) * Math.PI) / 180) });
  let inicio = 0;
  let tom = 0;
  const fatias = dados.map((d, k) => {
    const ang = (360 * Math.max(0, d.valor)) / soma;
    const cor0 = k === forte ? cor.marca : TONS[tom++ % TONS.length];
    const f = { ...d, a0: inicio, ang, cor: cor0 };
    inicio += ang;
    return f;
  });
  const pAnel = prog(t, de - 0.2, 0.6, caneta);
  const colunas = dados.length > 3 ? 2 : 1;
  const yLegenda = cy + r + 50;
  return (
    <>
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        <circle cx={cx} cy={cy} r={r} fill={cor.cartao} stroke={cor.lapisClaro} strokeWidth={5} strokeDasharray="3 12" />
        {fatias.map((f, k) => {
          const p = prog(t, f.em, 0.5, caneta);
          if (p <= 0) return null;
          const a1 = f.a0 + f.ang * p;
          const A = ponto(f.a0, r);
          const B = ponto(a1, r);
          const d = f.ang * p >= 359.9 ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z` : `M ${cx} ${cy} L ${A.x} ${A.y} A ${r} ${r} 0 ${f.ang * p > 180 ? 1 : 0} 1 ${B.x} ${B.y} Z`;
          return <path key={`f-${k}`} d={d} fill={f.cor} stroke={cor.cartao} strokeWidth={5} strokeLinejoin="round" />;
        })}
        <Traco d={`M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`} p={pAnel} cor={cor.tinta} largura={6} />
      </svg>
      {fatias.map((f, k) => {
        const col = colunas === 2 ? k % 2 : 0;
        const lin = colunas === 2 ? Math.floor(k / 2) : k;
        const p = prog(t, f.em, 0.3);
        const visto = p > 0.5;
        return (
          <div
            key={`l-${k}`}
            style={{
              position: "absolute",
              left: PAINEL.x + 50 + col * (PAINEL.w / 2 - 20),
              top: yLegenda + lin * 64,
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontFamily: sans,
              fontWeight: visto ? 700 : 500,
              fontSize: 36,
              lineHeight: 1,
              color: visto ? cor.tinta : cor.lapis,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ width: 34, height: 34, borderRadius: 999, background: visto ? f.cor : cor.cartao, border: `4px ${visto ? "solid" : "dashed"} ${visto ? cor.tinta : cor.lapis}`, flex: "0 0 34px" }} />
            <span>{f.rotulo}</span>
            <span style={{ fontFamily: serifa, fontWeight: 800 }}>{comUnidade(f.valor, casas, unidade)}</span>
          </div>
        );
      })}
    </>
  );
};

const Tendencia: React.FC<{ m: TGrafico; t: number }> = ({ m, t }) => {
  const tend = m.tendencia ?? "sobe";
  const inicio = m.tendenciaEm ?? m.de + 0.3;
  const dur = 1.5;
  const x = (s: number) => X0 + 20 + s * (X1 - X0 - 60);
  const y = (v: number) => Y_BASE - v * (Y_BASE - Y_TOPO);
  if (m.forma === "barras") {
    const n = 6;
    const L = (X1 - X0 - 40) / n;
    return (
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        <line x1={X0} y1={Y_BASE} x2={X1} y2={Y_BASE} stroke={cor.lapisClaro} strokeWidth={4} strokeLinecap="round" />
        {Array.from({ length: n }, (_, k) => {
          const v = Math.max(0.12, forma(tend, k / (n - 1)));
          const p = prog(t, inicio + (k * dur) / n, 0.4, caneta);
          const bx = X0 + 20 + k * L + L * 0.16;
          const bw = L * 0.68;
          const h = v * (Y_BASE - Y_TOPO);
          const ultima = k === n - 1;
          return (
            <g key={k}>
              <rect x={bx} y={Y_BASE - h} width={bw} height={h} rx={10} fill="none" stroke={cor.lapis} strokeWidth={4} strokeDasharray="4 8" opacity={0.7} />
              {p > 0 ? <rect x={bx} y={Y_BASE - h * p} width={bw} height={h * p} rx={10} fill={ultima ? cor.marca : cor.lapisClaro} stroke={ultima ? cor.tinta : cor.lapis} strokeWidth={ultima ? 5 : 4} /> : null}
            </g>
          );
        })}
      </svg>
    );
  }
  const amostras = 64;
  const p = prog(t, inicio, dur, (s) => s);
  const pontos = (ate: number) =>
    Array.from({ length: Math.max(2, Math.round(amostras * ate) + 1) }, (_, i) => {
      const s = (i / Math.max(1, Math.round(amostras * ate))) * ate;
      return `${i ? "L" : "M"} ${x(s).toFixed(1)} ${y(forma(tend, s)).toFixed(1)}`;
    }).join(" ");
  const fim = { x: x(p), y: y(forma(tend, p)) };
  const ang = Math.atan2(y(forma(tend, 1)) - y(forma(tend, 0.97)), x(1) - x(0.97));
  const seta = (k: number) => ({ x: x(1) - 26 * Math.cos(ang + k * 0.5), y: y(forma(tend, 1)) - 26 * Math.sin(ang + k * 0.5) });
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
      <line x1={X0} y1={Y_BASE} x2={X1} y2={Y_BASE} stroke={cor.lapisClaro} strokeWidth={4} strokeLinecap="round" />
      <line x1={X0} y1={Y_TOPO} x2={X1} y2={Y_TOPO} stroke={cor.lapisClaro} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />
      <path d={pontos(1)} fill="none" stroke={cor.lapisClaro} strokeWidth={5} strokeDasharray="2 12" strokeLinecap="round" />
      {p > 0 ? <path d={pontos(p)} fill="none" stroke={cor.tinta} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {p > 0 && p < 1 ? <circle cx={fim.x} cy={fim.y} r={12} fill={cor.tinta} /> : null}
      {p >= 1 ? (
        <>
          <circle cx={x(1)} cy={y(forma(tend, 1))} r={26 * prog(t, inicio + dur, 0.3)} fill={cor.marca} />
          <path d={`M ${seta(1).x} ${seta(1).y} L ${x(1)} ${y(forma(tend, 1))} L ${seta(-1).x} ${seta(-1).y}`} fill="none" stroke={cor.tinta} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
    </svg>
  );
};

export const Grafico: React.FC<{ m: TGrafico; palavras: Palavra[]; t: number }> = ({ m, palavras, t }) => {
  const g = geometriaDoGrafico(m);
  const temposTitulo = m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.ate) : [];
  const dados = (m.dados ?? []).slice(0, 6);
  const pPainel = prog(t, m.de - 0.4, 0.4);
  return (
    <>
      <div style={{ position: "absolute", left: g.xCol, top: 182, width: g.larguraCol }}>
        {g.titulo ? <Escrita linhas={g.titulo.linhas} tempos={temposTitulo} t={t} estilo={estiloTitulo} tamanho={g.titulo.tamanho} entrelinha={1.04} /> : null}
        {g.ilustrativo ? <div style={{ ...selo, marginTop: g.titulo ? 24 : 0 }}>ilustrativo</div> : null}
      </div>
      <div style={{ position: "absolute", left: PAINEL.x, top: PAINEL.y, width: PAINEL.w, height: PAINEL.h, borderRadius: 30, background: cor.cartao, boxShadow: cor.sombra, opacity: 0.4 + 0.6 * pPainel }} />
      {!dados.length && m.unidade ? <div style={{ ...estiloRotulo, position: "absolute", left: X0 + 150, top: PAINEL.y + 44, letterSpacing: "0.1em" }}>↑ {m.unidade}</div> : null}
      {dados.length >= 2 ? (
        m.forma === "barras" ? (
          <Barras dados={dados} t={t} unidade={m.unidade} />
        ) : m.forma === "pizza" ? (
          <Pizza dados={dados} t={t} unidade={m.unidade} de={m.de} />
        ) : (
          <Linha dados={dados} t={t} unidade={m.unidade} />
        )
      ) : (
        <Tendencia m={m} t={t} />
      )}
    </>
  );
};
