import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { PALCO } from "../layout";
import { Ambiente, Anel, Luzes, Sombra, materialDeVidro } from "../palco/Palco3D";
import { BASE_IN, PERFIL, PITCH, PXU, toWorld } from "../palco/cena";
import { Selo, Sobe, num, serif } from "../palco/Rotulos";
import { useTexturas, type Texturas } from "../palco/texturas";
import type { Grafico } from "../plano";
import { EASE_INOUT, EASE_OUT, P, SERIF, SORA, caber, clamp01, numeroBR, prog, quebrar, useTempo } from "../tema";

/* Gráfico no estilo Medida.
   - barras: uma fileira de copos de vidro (3D) que enchem até o valor dito; o maior ganha o anel
     tracejado. Sem números (tendência): os copos enchem na forma da tendência, com o selo.
   - linha: papel graduado, a linha se desenha ponto a ponto na fala.
   - pizza: um prato visto de cima, com as porções entrando uma a uma. */

type Dado = { rotulo: string; valor: number; em: number };
const X0 = PALCO.x;
const LARG = PALCO.w;
const Y0 = PALCO.y;
const ALT = PALCO.h;
const BASE_Y = Y0 + ALT - 120;

const dadosDo = (m: Grafico): { dados: Dado[]; ilustrativo: boolean } => {
  if (m.dados?.length) return { dados: m.dados, ilustrativo: !!m.ilustrativo };
  const t0 = m.tendenciaEm ?? m.de + 0.2;
  const forma = m.tendencia === "cai" ? [0.92, 0.7, 0.48, 0.28] : m.tendencia === "oscila" ? [0.5, 0.86, 0.38, 0.72] : [0.28, 0.5, 0.72, 0.94];
  return { dados: forma.map((v, i) => ({ rotulo: "", valor: v, em: t0 + i * 0.28 })), ilustrativo: true };
};

const LIQ = new THREE.Color("#cfe5c4");
const CoposCena: React.FC<{ dados: Dado[]; max: number; xs: number[]; s: number; tex: Texturas | null }> = ({ dados, max, xs, s, tex }) => {
  const t = useTempo();
  const perfil = PERFIL.copo;
  const geo = useMemo(() => new THREE.LatheGeometry(perfil.pontos.map(([x, y]) => new THREE.Vector2(x, y)), 120), [perfil]);
  const fades = useMemo(() => dados.map(() => ({ value: 0 })), [dados]);
  const mats = useMemo(() => fades.map((f) => materialDeVidro(f)), [fades]);
  const liq = useMemo(() => new THREE.MeshPhysicalMaterial({ color: LIQ, transparent: true, opacity: 0.5, roughness: 0.06, clearcoat: 0.6, envMapIntensity: 1.1, depthWrite: false }), []);
  const topo = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#e6f3dd", transparent: true, opacity: 0.6, roughness: 0.06, clearcoat: 0.6, depthWrite: false }), []);
  const imax = dados.reduce((k, d, i) => (d.valor > dados[k].valor ? i : k), 0);
  if (!tex) return null;
  return (
    <>
      {dados.map((d, i) => {
        const a = prog(t, d.em - 0.25, d.em + 0.1, EASE_OUT);
        fades[i].value = a;
        if (a <= 0.001) return null;
        const enche = prog(t, d.em - 0.05, d.em + 0.75, EASE_INOUT);
        const alvo = BASE_IN + 1.3 * clamp01(d.valor / max);
        const lv = BASE_IN + (alvo - BASE_IN) * enche + 0.015 * Math.sin(t * 9 + i) * Math.exp(-3 * Math.max(0, t - d.em - 0.6));
        const h = lv - BASE_IN;
        const w = toWorld(xs[i], BASE_Y);
        return (
          <group key={i} position={[w.x, w.y - (1 - a) * 0.3, 0]} rotation={[PITCH, 0, 0]} scale={s * (0.94 + 0.06 * a)}>
            <Sombra tex={tex.sombra} w={2.3} d={2.3} o={0.3 * a} />
            {h > 0.01 ? (
              <>
                <mesh position={[0, BASE_IN + h / 2, 0]} renderOrder={1} material={liq}>
                  <cylinderGeometry args={[perfil.interno(lv) - 0.006, perfil.interno(BASE_IN + 0.05) - 0.03, h, 64, 1, true]} />
                </mesh>
                <mesh position={[0, lv, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} material={topo}>
                  <circleGeometry args={[perfil.interno(lv) - 0.006, 64]} />
                </mesh>
              </>
            ) : null}
            {i === imax && dados.length > 1 ? <Anel altura={alvo} raio={perfil.externo(alvo)} em={d.em + 0.6} vermelho={0} guia={false} /> : null}
            <mesh geometry={geo} material={mats[i]} renderOrder={5} />
          </group>
        );
      })}
    </>
  );
};

const Barras: React.FC<{ m: Grafico }> = ({ m }) => {
  const t = useTempo();
  const tex = useTexturas(undefined, {});
  const { dados, ilustrativo } = useMemo(() => dadosDo(m), [m]);
  const n = dados.length;
  const max = Math.max(...dados.map((d) => d.valor), 0.0001);
  const slot = (LARG - 40) / n;
  const s = Math.min(0.95, (slot * 0.74) / (2 * 0.8 * PXU));
  const xs = dados.map((_, i) => X0 + 20 + slot * (i + 0.5));
  const alturaCopo = 1.62 * PXU * s;
  // um tamanho só para todos os valores (o maior que cabe na vaga de cada copo)
  const pxVal = Math.min(...dados.map((d) => caber(`${numeroBR(d.valor)}${m.unidade ? ` ${m.unidade}` : ""}`, slot - 16, 64, 30, SORA, 800)));
  return (
    <>
      {m.titulo ? (
        <Sobe em={m.de} style={{ left: X0 + 8, top: Y0 + 10 }}>
          <div style={{ ...serif, fontSize: caber(m.titulo, LARG - 40, 56, 34, SERIF, 400, true), color: P.tinta }}>{m.titulo}</div>
        </Sobe>
      ) : null}
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 22, position: [0, 0, 24.7], near: 0.1, far: 100 }} dpr={1} style={{ position: "absolute", left: 0, top: 0 }}>
        <Ambiente />
        <Luzes />
        <CoposCena dados={dados} max={max} xs={xs} s={s} tex={tex} />
      </ThreeCanvas>
      {dados.map((d, i) => {
        const enche = prog(t, d.em - 0.05, d.em + 0.75, EASE_OUT);
        if (enche <= 0) return null;
        const val = ilustrativo && !m.dados?.length ? null : `${numeroBR(d.valor * enche, Number.isInteger(d.valor) ? 0 : 1)}${m.unidade ? ` ${m.unidade}` : ""}`;
        return (
          <React.Fragment key={i}>
            {val ? (
              <div style={{ position: "absolute", left: xs[i] - slot / 2, width: slot, top: BASE_Y - alturaCopo - 32 * s - 22 - pxVal, textAlign: "center", ...num, fontSize: pxVal, color: P.tinta, opacity: enche }}>
                {val}
              </div>
            ) : null}
            {d.rotulo ? (
              <div style={{ position: "absolute", left: xs[i] - slot / 2, width: slot, top: BASE_Y + 26, textAlign: "center", opacity: enche }}>
                {(() => {
                  const q = quebrar(d.rotulo, slot - 16, 40, 24, SERIF, 400, true, 2);
                  return (
                    <div style={{ ...serif, fontSize: q.px, color: P.tinta, textAlign: "center" }}>
                      {q.linhas.map((l, k) => (
                        <div key={k}>{l}</div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
      {ilustrativo ? <Selo texto="ilustrativo" em={dados[0].em} /> : null}
    </>
  );
};

const Linha: React.FC<{ m: Grafico }> = ({ m }) => {
  const t = useTempo();
  const { dados, ilustrativo } = dadosDo(m);
  const n = dados.length;
  const max = Math.max(...dados.map((d) => d.valor));
  const min = Math.min(0, ...dados.map((d) => d.valor));
  const x0 = X0 + 60;
  const x1 = X0 + LARG - 60;
  const yTop = Y0 + (m.titulo ? 150 : 90);
  const yBase = Y0 + ALT - 110;
  const px = (i: number) => (n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (n - 1));
  const py = (v: number) => yBase - ((v - min) / Math.max(0.0001, max - min)) * (yBase - yTop) * 0.86;
  // quanto da linha já foi desenhado: do ponto i-1 ao i entre (em - 0,35) e em
  let pts = "";
  dados.forEach((d, i) => {
    const p = i === 0 ? prog(t, d.em - 0.1, d.em + 0.2) : prog(t, d.em - 0.35, d.em + 0.05, EASE_INOUT);
    if (p <= 0) return;
    if (i === 0) pts += `${px(0)},${py(d.valor)}`;
    else {
      const a = dados[i - 1];
      const x = px(i - 1) + (px(i) - px(i - 1)) * p;
      const y = py(a.valor) + (py(d.valor) - py(a.valor)) * p;
      pts += ` ${x},${y}`;
    }
  });
  const grade = prog(t, m.de - 0.05, m.de + 0.5, EASE_OUT);
  return (
    <>
      {m.titulo ? (
        <Sobe em={m.de} style={{ left: X0 + 8, top: Y0 + 10 }}>
          <div style={{ ...serif, fontSize: caber(m.titulo, LARG - 40, 56, 34, SERIF, 400, true), color: P.tinta }}>{m.titulo}</div>
        </Sobe>
      ) : null}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 5 }, (_, k) => {
          const y = yBase - ((yBase - yTop) * k) / 4;
          return <line key={k} x1={x0} x2={x0 + (x1 - x0) * grade} y1={y} y2={y} stroke={P.tinta} strokeOpacity={k === 0 ? 0.5 : 0.14} strokeWidth={k === 0 ? 3 : 2} strokeDasharray={k === 0 ? undefined : "12 10"} />;
        })}
        {pts ? <polyline points={pts} fill="none" stroke={P.fundo} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {dados.map((d, i) => {
          const p = prog(t, d.em - 0.05, d.em + 0.25, EASE_OUT);
          if (p <= 0) return null;
          return <circle key={i} cx={px(i)} cy={py(d.valor)} r={13 * p} fill={i === n - 1 ? P.fundo : P.sache} stroke={P.fundo} strokeWidth={5} />;
        })}
      </svg>
      {dados.map((d, i) => {
        const p = prog(t, d.em - 0.05, d.em + 0.3, EASE_OUT);
        if (p <= 0) return null;
        const w = Math.min(260, (x1 - x0) / Math.max(1, n - 1) + 40);
        return (
          <React.Fragment key={i}>
            {!ilustrativo || m.dados?.length ? (
              <div style={{ position: "absolute", left: px(i) - w / 2, width: w, top: py(d.valor) - 78, textAlign: "center", ...num, fontSize: caber(`${numeroBR(d.valor)}${m.unidade ? ` ${m.unidade}` : ""}`, w - 10, 50, 26, SORA, 800), color: P.tinta, opacity: p }}>
                {numeroBR(d.valor, Number.isInteger(d.valor) ? 0 : 1)}
                {m.unidade ? ` ${m.unidade}` : ""}
              </div>
            ) : null}
            {d.rotulo ? (
              <div style={{ position: "absolute", left: px(i) - w / 2, width: w, top: yBase + 18, textAlign: "center", ...serif, fontSize: caber(d.rotulo, w - 10, 36, 22, SERIF, 400, true), color: P.tinta, opacity: p }}>{d.rotulo}</div>
            ) : null}
          </React.Fragment>
        );
      })}
      {ilustrativo ? <Selo texto="ilustrativo" em={dados[0].em} /> : null}
    </>
  );
};

const CORES_PRATO = [P.fundo, P.salvia, P.menta, "#C9B98F", "#8C6F4E", "#5E8C73"];
const Pizza: React.FC<{ m: Grafico }> = ({ m }) => {
  const t = useTempo();
  if (!m.dados?.length) return <Barras m={m} />;
  const dados = m.dados;
  const total = dados.reduce((s, d) => s + d.valor, 0) || 1;
  const cx = X0 + 270;
  const cy = Y0 + ALT / 2 + (m.titulo ? 30 : 0);
  const R = Math.min(250, ALT / 2 - 40);
  let ang = -Math.PI / 2;
  const fatias = dados.map((d, i) => {
    const a0 = ang;
    const span = (d.valor / total) * Math.PI * 2;
    ang += span;
    return { d, i, a0, span };
  });
  const prato = prog(t, m.de - 0.05, m.de + 0.4, EASE_OUT);
  return (
    <>
      {m.titulo ? (
        <Sobe em={m.de} style={{ left: X0 + 8, top: Y0 + 10 }}>
          <div style={{ ...serif, fontSize: caber(m.titulo, LARG - 40, 56, 34, SERIF, 400, true), color: P.tinta }}>{m.titulo}</div>
        </Sobe>
      ) : null}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: prato }}>
        <defs>
          <radialGradient id="prato" cx="0.45" cy="0.4" r="0.7">
            <stop offset="0" stopColor="#FFFDF8" />
            <stop offset="1" stopColor="#ECE5D7" />
          </radialGradient>
        </defs>
        <ellipse cx={cx + 10} cy={cy + 22} rx={R + 46} ry={R + 40} fill="rgba(28,36,26,0.16)" style={{ filter: "blur(14px)" }} />
        <circle cx={cx} cy={cy} r={R + 44} fill="url(#prato)" stroke="rgba(28,42,34,0.14)" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={R + 8} fill="none" stroke="rgba(28,42,34,0.1)" strokeWidth={3} />
        {fatias.map(({ d, i, a0, span }) => {
          const p = prog(t, d.em - 0.05, d.em + 0.5, EASE_OUT);
          if (p <= 0) return null;
          const a1 = a0 + span * p;
          const meio = (a0 + a1) / 2;
          const sep = 6;
          const ox = Math.cos(meio) * sep;
          const oy = Math.sin(meio) * sep;
          const large = a1 - a0 > Math.PI ? 1 : 0;
          const path = `M ${cx + ox} ${cy + oy} L ${cx + ox + R * Math.cos(a0)} ${cy + oy + R * Math.sin(a0)} A ${R} ${R} 0 ${large} 1 ${cx + ox + R * Math.cos(a1)} ${cy + oy + R * Math.sin(a1)} Z`;
          return <path key={i} d={path} fill={CORES_PRATO[i % CORES_PRATO.length]} stroke={P.sache} strokeWidth={3} />;
        })}
      </svg>
      {fatias.map(({ d, i }) => {
        const p = prog(t, d.em - 0.05, d.em + 0.4, EASE_OUT);
        if (p <= 0) return null;
        const y = Y0 + (m.titulo ? 130 : 70) + i * Math.min(120, (ALT - 120) / dados.length);
        const pct = Math.round((d.valor / total) * 100);
        const valor = m.unidade === "%" || !m.unidade ? `${numeroBR(d.valor)}${m.unidade ?? ""}` : `${numeroBR(d.valor)} ${m.unidade}`;
        return (
          <div key={i} style={{ position: "absolute", left: X0 + 600, top: y, width: 330, opacity: p, transform: p < 1 ? `translateX(${(1 - p) * 30}px)` : undefined }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: CORES_PRATO[i % CORES_PRATO.length] }} />
              <div style={{ ...num, fontSize: caber(valor, 290, 54, 30, SORA, 800), color: P.tinta }}>{valor}</div>
            </div>
            <div style={{ ...serif, fontSize: caber(d.rotulo, 320, 36, 22, SERIF, 400, true), color: P.tintaSuave, marginTop: 4, marginLeft: 36 }} title={`${pct}%`}>
              {d.rotulo}
            </div>
          </div>
        );
      })}
    </>
  );
};

export const BlocoGrafico: React.FC<{ m: Grafico }> = ({ m }) => {
  if (m.forma === "linha") return <Linha m={m} />;
  if (m.forma === "pizza") return <Pizza m={m} />;
  return <Barras m={m} />;
};
