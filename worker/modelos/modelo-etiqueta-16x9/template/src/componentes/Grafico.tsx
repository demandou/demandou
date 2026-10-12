// Gráfico no quadro da esquerda (a pessoa na moldura da direita), no traço do Viral: barras e linha
// em branco e tarja, números grandes.
// Sem números ditos, uma curva de tendência com a etiqueta "ILUSTRATIVO".
import { AbsoluteFill, Easing } from "remotion";
import { formatar, prog, rapido, salto } from "../anim";
import { AREA as TOPO, QUADRO } from "../layout";
import { encaixar } from "../medida";
import type { Grafico as TGrafico } from "../plano";
import { cor, fonte, sombraDura } from "../tema";
import { alturaDoTitulo, saidaDoTopo, Titulo, type PropsTopo } from "./Topo";

const CORES = [cor.tarja, cor.papel, cor.alerta, cor.certo, "#8C7BFF", "#4CC9F0"];
const casasDe = (v: number) => (Number.isInteger(v) ? 0 : Math.abs(v) < 10 ? 1 : 0);
const comUnidade = (v: number, unidade?: string) => {
  const n = formatar(v, casasDe(v));
  if (!unidade) return n;
  return /^(R\$|US\$|€|£)$/.test(unidade) ? `${unidade} ${n}` : unidade === "%" ? `${n}%` : `${n} ${unidade}`;
};

const Ilustrativo: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, padding: "5px 14px", borderRadius: 10, background: "rgba(255,255,255,0.12)", fontFamily: fonte, fontWeight: 800, fontSize: 24, letterSpacing: "0.08em", color: cor.suave }}>
    ILUSTRATIVO
  </div>
);

export const Grafico: React.FC<PropsTopo & { m: TGrafico }> = ({ m, t, plano, t0, saiCruzando }) => {
  const hTitulo = alturaDoTitulo(m.titulo);
  const yArea = TOPO.y + hTitulo + (m.titulo ? 20 : 0);
  const area = { x: TOPO.x, y: yArea, w: TOPO.w, h: TOPO.base - yArea };
  const dados = m.dados ?? [];
  return (
    <AbsoluteFill style={{ opacity: 1 - saidaDoTopo(t, m.ate, saiCruzando) }}>
      {m.titulo ? <Titulo t={t} texto={m.titulo} em={t0} plano={plano} ate={m.ate} /> : null}
      {dados.length >= 2 ? (
        m.forma === "pizza" ? (
          <Pizza m={m} t={t} t0={t0} area={area} />
        ) : m.forma === "linha" ? (
          <Linha m={m} t={t} t0={t0} area={area} />
        ) : (
          <Barras m={m} t={t} t0={t0} area={area} />
        )
      ) : (
        <Tendencia m={m} t={t} t0={t0} area={area} />
      )}
      {(m.ilustrativo || dados.length < 2) && t >= t0 ? <Ilustrativo x={TOPO.x + TOPO.w - 190} y={TOPO.y - 52 + (m.titulo ? 0 : 40)} /> : null}
    </AbsoluteFill>
  );
};

type Area = { x: number; y: number; w: number; h: number };
type PropsForma = { m: TGrafico; t: number; t0: number; area: Area };

const Barras: React.FC<PropsForma> = ({ m, t, t0, area }) => {
  const dados = m.dados ?? [];
  const n = dados.length;
  const vao = 26;
  const bw = Math.min(170, (area.w - vao * (n - 1)) / n);
  const x0 = area.x + (area.w - (bw * n + vao * (n - 1))) / 2;
  const max = Math.max(...dados.map((d) => Math.abs(d.valor)), 1e-6);
  const alturaRotulo = 78;
  const alturaValor = 70;
  const hMax = area.h - alturaRotulo - alturaValor;
  const maiorIdx = dados.reduce((b, d, i) => (Math.abs(d.valor) > Math.abs(dados[b].valor) ? i : b), 0);
  return (
    <>
      <div style={{ position: "absolute", left: area.x, top: area.y + alturaValor + hMax, width: area.w, height: 4, background: cor.linha }} />
      {dados.map((d, i) => {
        const em = Math.max(t0, d.em);
        if (t < em) return null;
        const p = prog(t, em, 0.5, Easing.out(Easing.cubic));
        const h = Math.max(8, (Math.abs(d.valor) / max) * hMax) * p;
        const x = x0 + i * (bw + vao);
        const base = area.y + alturaValor + hMax;
        const valor = comUnidade(d.valor * p, m.unidade);
        const sV = encaixar(comUnidade(d.valor, m.unidade), { largura: bw + vao - 4, max: 46, min: 22, linhas: 1, fonte: { peso: 800 } }).tamanho;
        const r = encaixar(d.rotulo, { largura: bw + vao - 6, max: 28, min: 18, linhas: 2, fonte: { peso: 800, caixaAlta: true } });
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: x, top: base - h, width: bw, height: h, borderRadius: "16px 16px 0 0", background: i === maiorIdx ? cor.tarja : cor.papel }} />
            <div
              style={{
                position: "absolute",
                left: x - vao / 2,
                width: bw + vao,
                top: base - h - sV * 1.3,
                textAlign: "center",
                fontFamily: fonte,
                fontWeight: 800,
                fontSize: sV,
                color: cor.tinta,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {valor}
            </div>
            <div style={{ position: "absolute", left: x - vao / 2, width: bw + vao, top: base + 12, textAlign: "center", fontFamily: fonte, fontWeight: 800, fontSize: r.tamanho, lineHeight: 1.1, color: cor.suave, textTransform: "uppercase" }}>
              {r.linhas.map((l, k) => (
                <div key={k}>{l}</div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

const Linha: React.FC<PropsForma> = ({ m, t, t0, area }) => {
  const dados = m.dados ?? [];
  const n = dados.length;
  const min = Math.min(...dados.map((d) => d.valor));
  const max = Math.max(...dados.map((d) => d.valor));
  const faixa = max - min || 1;
  const topo = area.y + 70;
  const hUtil = area.h - 70 - 70;
  const px = (i: number) => area.x + 50 + (i * (area.w - 100)) / (n - 1);
  const py = (v: number) => topo + hUtil - ((v - min) / faixa) * hUtil;
  const ems = dados.map((d) => Math.max(t0, d.em));
  // o traço anda de um ponto ao outro quando o ponto seguinte é dito
  const pontos: string[] = [];
  for (let i = 0; i < n; i++) {
    if (t < ems[i]) break;
    if (i === 0) pontos.push(`${px(0)},${py(dados[0].valor)}`);
    else {
      const p = prog(t, ems[i], 0.4, rapido);
      const x = px(i - 1) + (px(i) - px(i - 1)) * p;
      const y = py(dados[i - 1].valor) + (py(dados[i].valor) - py(dados[i - 1].valor)) * p;
      pontos.push(`${x},${y}`);
    }
  }
  return (
    <>
      <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={area.x} x2={area.x + area.w} y1={topo + hUtil + 30} y2={topo + hUtil + 30} stroke={cor.linha} strokeWidth={4} />
        {pontos.length >= 2 ? <polyline points={pontos.join(" ")} fill="none" stroke={cor.tarja} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
      {dados.map((d, i) => {
        if (t < ems[i] + (i ? 0.35 : 0)) return null;
        const p = prog(t, ems[i] + (i ? 0.35 : 0), 0.26, salto);
        const sV = encaixar(comUnidade(d.valor, m.unidade), { largura: 230, max: 42, min: 22, linhas: 1, fonte: { peso: 800 } }).tamanho;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: px(i) - 15, top: py(d.valor) - 15, width: 30, height: 30, borderRadius: 15, background: cor.papel, border: `6px solid ${cor.tarja}`, boxSizing: "border-box", transform: `scale(${p})` }} />
            <div style={{ position: "absolute", left: px(i) - 120, width: 240, top: py(d.valor) - sV * 1.6, textAlign: "center", fontFamily: fonte, fontWeight: 800, fontSize: sV, color: cor.tinta, opacity: p }}>
              {comUnidade(d.valor, m.unidade)}
            </div>
            <div style={{ position: "absolute", left: px(i) - 120, width: 240, top: topo + hUtil + 44, textAlign: "center", fontFamily: fonte, fontWeight: 800, fontSize: 24, color: cor.suave, textTransform: "uppercase" }}>
              {d.rotulo}
            </div>
          </div>
        );
      })}
    </>
  );
};

const Pizza: React.FC<PropsForma> = ({ m, t, t0, area }) => {
  const dados = m.dados ?? [];
  const soma = dados.reduce((a, d) => a + Math.max(0, d.valor), 0) || 1;
  const R = Math.min(area.h / 2 - 10, 230);
  const cx = area.x + R + 20;
  const cy = area.y + area.h / 2;
  let acumulado = 0;
  const arcos = dados.map((d, i) => {
    const em = Math.max(t0, d.em);
    const frac = Math.max(0, d.valor) / soma;
    const ini = acumulado;
    acumulado += frac;
    const p = t < em ? 0 : prog(t, em, 0.5, rapido);
    return { ini, frac: frac * p, cor: CORES[i % CORES.length], em, d };
  });
  const circ = 2 * Math.PI * (R * 0.72);
  return (
    <>
      <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={cx} cy={cy} r={R * 0.72} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={R * 0.56} />
        {arcos.map((a, i) =>
          a.frac > 0 ? (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={R * 0.72}
              fill="none"
              stroke={a.cor}
              strokeWidth={R * 0.56}
              strokeDasharray={`${a.frac * circ} ${circ}`}
              strokeDashoffset={-a.ini * circ}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ) : null,
        )}
      </svg>
      {arcos.map((a, i) => {
        if (t < a.em) return null;
        const p = prog(t, a.em, 0.24, salto);
        const y = area.y + 20 + i * Math.min(96, (area.h - 20) / dados.length);
        const r = encaixar(a.d.rotulo, { largura: 360, max: 36, min: 22, linhas: 1, fonte: { peso: 800 } });
        return (
          <div key={i} style={{ position: "absolute", left: cx + R + 40, top: y, display: "flex", alignItems: "center", gap: 16, opacity: Math.min(1, p * 3) }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: a.cor, flexShrink: 0 }} />
            <div style={{ fontFamily: fonte, fontWeight: 800, fontSize: 40, color: cor.tinta, fontVariantNumeric: "tabular-nums" }}>{comUnidade(a.d.valor, m.unidade)}</div>
            <div style={{ fontFamily: fonte, fontWeight: 800, fontSize: r.tamanho, color: cor.suave }}>{a.d.rotulo}</div>
          </div>
        );
      })}
    </>
  );
};

// Sem números: a forma da tendência, desenhada na fala.
const Tendencia: React.FC<PropsForma> = ({ m, t, t0, area }) => {
  const tipo = m.tendencia ?? "sobe";
  const em = Math.max(t0, m.tendenciaEm ?? t0);
  const p = prog(t, em, 1.4, Easing.inOut(Easing.cubic));
  const N = 60;
  const forma = (u: number) => {
    const ruido = 0.05 * Math.sin(u * 19) + 0.03 * Math.sin(u * 41 + 1);
    if (tipo === "sobe") return 0.12 + 0.72 * Math.pow(u, 1.4) + ruido;
    if (tipo === "cai") return 0.86 - 0.72 * Math.pow(u, 1.2) + ruido;
    return 0.5 + 0.28 * Math.sin(u * Math.PI * 3.2) + ruido;
  };
  const corLinha = tipo === "sobe" ? cor.certo : tipo === "cai" ? cor.tarja : cor.alerta;
  const pts: string[] = [];
  const ate = Math.floor(N * p);
  for (let i = 0; i <= ate; i++) {
    const u = i / N;
    pts.push(`${area.x + 30 + u * (area.w - 60)},${area.y + area.h - 30 - forma(u) * (area.h - 60)}`);
  }
  const u = ate / N;
  const xF = area.x + 30 + u * (area.w - 60);
  const yF = area.y + area.h - 30 - forma(u) * (area.h - 60);
  const pulso = 1 + 0.18 * Math.sin(t * 6);
  return (
    <>
      <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={area.x} x2={area.x + area.w} y1={area.y + area.h - 10} y2={area.y + area.h - 10} stroke={cor.linha} strokeWidth={4} />
        {pts.length >= 2 ? <polyline points={pts.join(" ")} fill="none" stroke={corLinha} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
      {t >= em ? (
        <div style={{ position: "absolute", left: xF - 22, top: yF - 22, width: 44, height: 44, borderRadius: 22, background: cor.papel, border: `8px solid ${corLinha}`, boxSizing: "border-box", transform: `scale(${pulso})`, boxShadow: sombraDura("rgba(0,0,0,0.3)", 4) }} />
      ) : null}
    </>
  );
};
