// O corte ampliado: um BLOCO 3D de tecido em camadas (pele, gordura, músculo, osso, disco, esmalte,
// dentina, polpa…) que abre numa lente redonda e se alarga. Opcional: o nervo no fundo com pulsos de
// luz que contraem o músculo e vincam a pele; a agulha que injeta o agente, que se prende na junção e
// vira barreira (os pulsos param ali); o músculo que relaxa e a pele que alisa.
import { Rise } from "../anim";
import { encaixar } from "../medida";
import type { Camada, Corte as TCorte, Material } from "../plano";
import { clamp01, EASE_IN, EASE_INOUT, EASE_OUT, FONT, K, lerp, mix, MUS, prog } from "../tema";
import { MATERIAL } from "./Esquema";

const X0 = 64;
const Y0 = 196;
const WW = 952;
const HH = 548;
const ORIGEM = { x: 540, y: 470 };
// bloco: face da frente x 230–740, profundidade (170, −95)
const FX0 = 230;
const FX1 = 740;
const DX = 170;
const DY = -95;
const VINCO = 490;
const TOPO = 150;
const BASE = 470;
const LEITO = 66; // espessura do leito do nervo, no fundo

// peso de cada material na espessura do bloco
const PESO: Record<Material, number> = { pele: 1.12, derme: 0.9, gordura: 0.62, musculo: 0.8, tendao: 0.45, osso: 1.0, disco: 0.7, esmalte: 0.62, dentina: 1.0, polpa: 0.8, gengiva: 0.6, nervo: 0.35, neutro: 0.8 };

const pts = (arr: Array<[number, number]>) => arr.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

// curva de Bézier cúbica amostrada (o caminho do nervo), com o ponto a uma distância
type Seg = [number, number, number, number, number, number, number, number];
const amostrar = (segs: Seg[]) => {
  const p: Array<[number, number]> = [];
  for (const [x0, y0, x1, y1, x2, y2, x3, y3] of segs)
    for (let i = p.length ? 1 : 0; i <= 24; i++) {
      const u = i / 24;
      const a = (1 - u) ** 3;
      const b = 3 * (1 - u) ** 2 * u;
      const c = 3 * (1 - u) * u * u;
      const d = u ** 3;
      p.push([a * x0 + b * x1 + c * x2 + d * x3, a * y0 + b * y1 + c * y2 + d * y3]);
    }
  const L = [0];
  for (let i = 1; i < p.length; i++) L.push(L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  const total = L[L.length - 1];
  const em = (s: number) => {
    const v = Math.max(0, Math.min(total, s));
    let i = 1;
    while (i < L.length - 1 && L[i] < v) i++;
    const f = (v - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
    return { x: p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f, y: p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f };
  };
  const d = segs.map(([x0, y0, x1, y1, x2, y2, x3, y3], i) => `${i ? "" : `M ${x0} ${y0} `}C ${x1} ${y1}, ${x2} ${y2}, ${x3} ${y3}`).join(" ");
  return { total, em, d };
};

export const Corte: React.FC<{ m: TCorte; t: number }> = ({ m, t }) => {
  const OPEN: [number, number] = [m.de, m.de + 0.57];
  const FADE: [number, number] = [m.ate - 0.32, m.ate];
  if (t < OPEN[0] || t > FADE[1] + 0.02) return null;
  const k1 = prog(t, OPEN[0], OPEN[0] + 0.32, EASE_INOUT);
  const k2 = prog(t, OPEN[0] + 0.24, OPEN[1], EASE_INOUT);
  const fade = 1 - prog(t, FADE[0], FADE[1], EASE_IN);
  const dia = lerp(40, HH, k1);
  const wd = lerp(dia, WW, k2);
  const L = ORIGEM.x - wd / 2;
  const R = ORIGEM.x + wd / 2;
  const Tp = ORIGEM.y - dia / 2;
  const B = ORIGEM.y + dia / 2;
  const rad = lerp(dia / 2, 36, k2);
  const ring = 1 - prog(t, OPEN[1] - 0.1, OPEN[1] + 0.3);
  const inner = prog(t, OPEN[0] + 0.04, OPEN[0] + 0.3);
  const rise = prog(t, OPEN[0] + 0.15, OPEN[1] + 0.25, EASE_OUT);

  const camadas = m.camadas.slice(0, 5);
  const temSinal = !!m.sinal;
  const fundoCamadas = temSinal ? BASE - LEITO : BASE;
  const pesos = camadas.map((c) => PESO[c.material] ?? 0.8);
  const soma = pesos.reduce((a, b) => a + b, 0) || 1;
  // fronteiras (planas na base): y de cada camada
  const limites: number[] = [TOPO];
  pesos.forEach((p) => limites.push(limites[limites.length - 1] + ((fundoCamadas - TOPO) * p) / soma));
  const iMusc = camadas.findIndex((c) => c.material === "musculo");
  const alvoY = iMusc >= 0 ? (limites[iMusc] + limites[iMusc + 1]) / 2 : (limites[camadas.length - 1] + limites[camadas.length]) / 2;
  const juncao = iMusc >= 0 ? limites[iMusc + 1] : fundoCamadas; // onde o nervo encosta (placas)

  // ——— nervo e pulsos ———
  const bloqueioEm = m.sinal?.bloqueioEm ?? (m.agente ? m.agente.efeitoEm ?? m.agente.em + 0.5 : Infinity);
  const J = juncao;
  const nervo = amostrar([
    [232, J + 48, 300, J + 48, 360, J + 44, 398, J + 27],
    [398, J + 27, 424, J + 15, 440, J + 6, 452, J + 2],
  ]);
  const ramos = [`M 424 ${J + 17} C 418 ${J + 10}, 414 ${J + 6}, 412 ${J + 2}`, `M 452 ${J + 2} C 470 ${J + 1}, 484 ${J + 1}, 494 ${J + 1}`];
  const placas: Array<[number, number]> = [[412, J], [452, J + 1], [494, J]];
  const pulsos: Array<{ t: number; bloqueado: boolean }> = [];
  if (m.sinal) {
    const base = m.sinal.pulsos?.length ? [...m.sinal.pulsos] : [OPEN[0] + 0.17, m.sinal.em - 0.5, m.sinal.em + 0.12];
    // o sinal continua chegando (a cada 1,6 s) até o fim do corte: nada parado
    let ultimo = Math.max(...base);
    while (ultimo + 1.6 < m.ate - 0.7) {
      ultimo += 1.6;
      base.push(ultimo);
    }
    for (const p of base) if (p >= OPEN[0] - 0.01) pulsos.push({ t: p, bloqueado: p >= bloqueioEm - 0.6 });
  }
  const VIAGEM = 0.5;

  // ——— estado: contração, vinco ———
  let twitch = 0;
  for (const p of pulsos) if (!p.bloqueado && t > p.t + VIAGEM) twitch = Math.max(twitch, Math.exp(-(t - (p.t + VIAGEM)) * 4));
  const relax = m.relaxaEm !== undefined ? prog(t, m.relaxaEm - 0.12, m.relaxaEm + 0.7, EASE_INOUT) : 0;
  const c = (0.8 + 0.2 * twitch) * (1 - relax);
  const temVinco = !!m.vinco;
  const alisa = m.vinco?.alisaEm !== undefined ? prog(t, m.vinco.alisaEm - 0.45, m.vinco.alisaEm + 0.25, EASE_INOUT) : 0;
  const skin = temVinco ? (0.8 + 0.2 * twitch) * (1 - alisa) : 0;
  const D = 44 * skin;
  const yS = (x: number) => TOPO + D * Math.exp(-(((x - VINCO) / 34) ** 2)) + 0.3 * D * (Math.exp(-(((x - 380) / 30) ** 2)) + Math.exp(-(((x - 600) / 30) ** 2)));
  // a 1ª fronteira acompanha 35% do vinco; as outras são planas
  const lim = (k: number) => (x: number) => (k === 0 ? yS(x) : k === 1 ? limites[1] + 0.35 * (yS(x) - TOPO) : limites[k]);
  const xs: number[] = [];
  for (let x = FX0; x <= FX1 + 0.1; x += 8.5) xs.push(x);
  const prof = (f: (x: number) => number, dx = 0, dy = 0) => xs.map((x): [number, number] => [x + dx, f(x) + dy]);

  const primeira = camadas[0];
  const corTopo = primeira?.material === "pele" ? { claro: "#FFF7F3", meio: "#F7E3DA", escuro: "#C9958A" } : { claro: "#FFFFFF", meio: MATERIAL[primeira?.material ?? "neutro"].fill, escuro: MATERIAL[primeira?.material ?? "neutro"].borda };
  const topFace = xs.slice(0, -1).map((x, i) => {
    const x2 = xs[i + 1];
    const slope = (yS(x2) - yS(x)) / (x2 - x);
    const shade = Math.max(-1, Math.min(1, slope * 1.6));
    const col = shade > 0 ? mix(corTopo.meio, corTopo.escuro, shade) : mix(corTopo.meio, corTopo.claro, -shade);
    const q: Array<[number, number]> = [[x, yS(x)], [x2, yS(x2)], [x2 + DX, yS(x2) + DY], [x + DX, yS(x) + DY]];
    return <polygon key={i} points={pts(q)} fill={col} stroke={col} strokeWidth={0.6} />;
  });
  const faixaLateral = (y0: number, y1: number, col: string, key: string) => <polygon key={key} points={pts([[FX1, y0], [FX1 + DX, y0 + DY], [FX1 + DX, y1 + DY], [FX1, y1]])} fill={col} />;
  const fh = lerp(8.2, 10.6, c);

  // ——— cada camada na face da frente ———
  const desenhoCamada = (cam: Camada, k: number) => {
    const topoF = lim(k);
    const baseF = lim(k + 1);
    const mat = MATERIAL[cam.material] ?? MATERIAL.neutro;
    const regiao = `M ${pts(prof(topoF))} L ${pts(prof(baseF).reverse())} Z`;
    const yT = limites[k];
    const yB = limites[k + 1];
    const h = yB - yT;
    const elementos: React.ReactNode[] = [];
    // camadas "neutro" (modo ilustrativo) alternam o tom e o sentido da hachura, para se distinguirem
    const fill = cam.material === "musculo" ? "#E7B2A9" : cam.material === "pele" ? "#F8E9E2" : cam.material === "neutro" ? mix("#F1F5FA", "#C9D8EA", (k % 3) * 0.42) : mat.fill;
    elementos.push(<path key="f" d={regiao} fill={fill} />);
    if (cam.material === "pele") {
      elementos.push(<path key="ep" d={`M ${pts(prof(yS))} L ${pts(prof(yS, 0, 14).reverse())} Z`} fill="#E8C0B1" />);
      for (let i = 0; i < 4; i++) {
        const yy = (x: number) => Math.min(baseF(x) - 6, yS(x) + 26 + i * ((h - 30) / 4.2) + 4 * Math.sin(x / 19 + i * 1.3));
        elementos.push(<polyline key={`c${i}`} points={pts(prof(yy))} fill="none" stroke="#E2B4A6" strokeWidth={1.4} opacity={0.6} />);
      }
    } else if (cam.material === "gordura" || cam.material === "gengiva") {
      const n = 12;
      for (let i = 0; i < n; i++) {
        const x = FX0 + 24 + i * 42 + (i % 2) * 10;
        const y = (topoF(x) + baseF(x)) / 2 + (i % 2 ? 4 : -4);
        const hh = (baseF(x) - topoF(x)) * 0.36;
        elementos.push(<ellipse key={`g${i}`} cx={x} cy={y} rx={cam.material === "gengiva" ? 10 : 18} ry={Math.max(5, cam.material === "gengiva" ? hh * 0.5 : hh)} fill={cam.material === "gengiva" ? "#F6C8C5" : "#FFF9EC"} stroke={mat.fibra} strokeWidth={1.2} />);
      }
    } else if (cam.material === "musculo") {
      const n = Math.max(1, Math.min(4, Math.round(h / 24)));
      const fas = Array.from({ length: n }, (_, i) => yT + (h * (i + 0.5)) / n);
      const tick = lerp(10, 6.2, c);
      const fhh = Math.min(fh, (h / n) * 0.48);
      fas.forEach((yc, i) => {
        const up: Array<[number, number]> = [];
        const lo: Array<[number, number]> = [];
        for (let x = FX0; x <= FX1 + 0.1; x += 10) {
          const b = 1 + 0.22 * c * Math.exp(-(((x - VINCO) / 120) ** 2));
          up.push([x, yc - fhh * b]);
          lo.push([x, yc + fhh * b]);
        }
        const d = `M ${pts(up)} L ${pts(lo.reverse())} Z`;
        const tk: string[] = [];
        for (let x = FX0 + 6; x < FX1 - 4; x += tick) tk.push(`M ${x.toFixed(1)} ${yc - fhh * 0.7} L ${x.toFixed(1)} ${yc + fhh * 0.7}`);
        elementos.push(
          <g key={`m${i}`}>
            <path d={d} fill="url(#ct-fas)" stroke={MUS.edge} strokeWidth={1} strokeOpacity={0.6} />
            <path d={d} fill="#FFFFFF" opacity={0.35 * twitch} />
            <path d={tk.join(" ")} stroke="#8E3B35" strokeWidth={1} opacity={0.22} />
            <path d={`M ${FX0} ${yc - fhh * 0.45} L ${FX1} ${yc - fhh * 0.45}`} stroke="#FFFFFF" strokeWidth={1.4} opacity={0.35} />
          </g>,
        );
      });
    } else if (cam.material === "osso") {
      elementos.push(<path key="cort" d={`M ${pts(prof(topoF))} L ${pts(prof(topoF, 0, 10).reverse())} Z`} fill="#E6DCC0" />);
      for (let i = 0; i < 26; i++) {
        const x = FX0 + 18 + ((i * 37) % (FX1 - FX0 - 36));
        const y = yT + 16 + ((i * 23) % Math.max(10, h - 28));
        elementos.push(<ellipse key={`o${i}`} cx={x} cy={y} rx={9 + (i % 3) * 3} ry={5 + (i % 2) * 2} fill="none" stroke={mat.fibra} strokeWidth={1.6} />);
      }
    } else if (cam.material === "disco") {
      for (let i = 0; i < 5; i++) {
        const yy = yT + (h * (i + 0.5)) / 5;
        elementos.push(<path key={`a${i}`} d={`M ${FX0} ${yy} Q ${(FX0 + FX1) / 2} ${yy + (i - 2) * 3} ${FX1} ${yy}`} stroke={mat.fibra} strokeWidth={1.6} fill="none" />);
      }
      elementos.push(<ellipse key="nuc" cx={(FX0 + FX1) / 2} cy={(yT + yB) / 2} rx={90} ry={h * 0.28} fill="#C8D9EA" stroke={mat.borda} strokeWidth={1.2} opacity={0.9} />);
    } else if (cam.material === "esmalte") {
      for (let x = FX0 + 8; x < FX1; x += 12) elementos.push(<path key={`e${x}`} d={`M ${x} ${topoF(x) + 4} L ${x + 3} ${baseF(x) - 3}`} stroke={mat.fibra} strokeWidth={1.4} />);
    } else if (cam.material === "dentina" || cam.material === "derme" || cam.material === "neutro") {
      for (let x = FX0 - h; x < FX1; x += 16) {
        const a = Math.max(FX0, x);
        const b = Math.min(FX1, x + h);
        if (b <= a) continue;
        const sobe = cam.material === "neutro" && k % 2 === 1;
        elementos.push(<path key={`d${x}`} d={sobe ? `M ${a} ${yB - (a - x) - 2} L ${b} ${yB - (b - x) + 2}` : `M ${a} ${yT + (a - x) + 2} L ${b} ${yT + (b - x) - 2}`} stroke={mat.fibra} strokeWidth={1.2} opacity={0.75} />);
      }
    } else if (cam.material === "polpa" || cam.material === "nervo" || cam.material === "tendao") {
      for (let i = 0; i < 3; i++) {
        const yy = yT + (h * (i + 1)) / 4;
        const cor = cam.material === "polpa" ? (i === 1 ? "#8FA8C8" : "#C98B83") : mat.fibra;
        elementos.push(<path key={`v${i}`} d={`M ${FX0} ${yy} C ${FX0 + 120} ${yy - 8}, ${FX0 + 260} ${yy + 8}, ${FX1} ${yy - 2}`} stroke={cor} strokeWidth={cam.material === "tendao" ? 1.4 : 3} fill="none" opacity={0.85} />);
      }
    }
    // lateral (na sombra)
    const corLateral = cam.material === "pele" ? "#E6CFC6" : mix(cam.material === "musculo" ? "#E7B2A9" : fill, "#6F5A55", 0.16);
    const lateral = (
      <g key={`l${k}`}>
        {faixaLateral(topoF(FX1), baseF(FX1), corLateral, `lf${k}`)}
        {cam.material === "pele" ? faixaLateral(yS(FX1), yS(FX1) + 14, "#D9AE9F", `lp${k}`) : null}
        {cam.material === "musculo"
          ? Array.from({ length: Math.max(1, Math.min(4, Math.round(h / 24))) }, (_, i) => yT + (h * (i + 0.5)) / Math.max(1, Math.min(4, Math.round(h / 24)))).map((yc, i) =>
              [0.18, 0.42, 0.66, 0.88].map((q, j) => (
                <ellipse key={`x${i}${j}`} cx={FX1 + DX * q} cy={yc + DY * q} rx={fh * 0.55} ry={fh * 1.0} fill="#C98B83" stroke={MUS.edge} strokeWidth={0.8} strokeOpacity={0.6} />
              )),
            )
          : null}
      </g>
    );
    return { frente: <g key={`c${k}`}>{elementos}</g>, lateral };
  };
  const desenhos = camadas.map(desenhoCamada);

  // ——— agente ———
  const ag = m.agente;
  const tox = ag ? prog(t, ag.em - 0.05, ag.em + 0.3) : 0;
  const efeitoEm = ag ? ag.efeitoEm ?? ag.em + 0.5 : 0;
  const agulha = ag ? prog(t, ag.em - 0.2, ag.em + 0.15, EASE_OUT) * (1 - prog(t, efeitoEm + 0.1, efeitoEm + 0.5, EASE_IN)) : 0;
  const parede = ag && temSinal ? prog(t, efeitoEm - 0.02, efeitoEm + 0.3, EASE_OUT) : 0;
  const PONTA = { x: 556, y: alvoY + 8 };
  const MOL = Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * Math.PI * 2, dx: 400 + (i % 3) * 46 + (i > 5 ? 6 : 0), dy: temSinal ? J - 6 : alvoY + ((i % 3) - 1) * 12, d: i * 0.035 }));

  // ——— rótulos da esquerda (camadas com rótulo) ———
  const comRotulo = camadas.map((cam, k) => ({ cam, k })).filter((x) => x.cam.rotulo);
  const posicoes: number[] = [];
  comRotulo.forEach(({ k }, i) => {
    const meio = k === 0 ? 40 : (limites[k] + limites[k + 1]) / 2 - 50;
    let y = Math.max(24, meio);
    if (i > 0) y = Math.max(y, posicoes[i - 1] + 96);
    posicoes.push(Math.min(y, HH - 120));
  });
  const etiqueta = m.etiqueta ?? "corte ampliado";

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: fade, filter: fade < 1 ? `blur(${(1 - fade) * 6}px)` : undefined, clipPath: `inset(${Tp}px ${1080 - R}px ${1920 - B}px ${L}px round ${rad}px)` }}>
      <div style={{ position: "absolute", left: X0, top: Y0, width: WW, height: HH, background: "linear-gradient(180deg,#FFFFFF 0%, #EEF3F8 100%)", borderRadius: 36, boxShadow: "inset 0 0 0 1.5px rgba(158,176,196,0.9)" }} />
      {ring > 0 ? <div style={{ position: "absolute", left: L, top: Tp, width: R - L, height: B - Tp, borderRadius: rad, boxShadow: `inset 0 0 0 3px ${K.acc}`, opacity: ring }} /> : null}
      <svg width={WW} height={HH} viewBox={`0 0 ${WW} ${HH}`} style={{ position: "absolute", left: X0, top: Y0, opacity: inner, transform: `translateY(${(1 - rise) * 30}px)` }}>
        <defs>
          <radialGradient id="ct-pulse">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.35" stopColor={K.accHi} stopOpacity={0.9} />
            <stop offset="1" stopColor={K.acc} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="ct-fas" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={MUS.light} />
            <stop offset="0.5" stopColor="#CC6C62" />
            <stop offset="1" stopColor="#97403A" />
          </linearGradient>
          <linearGradient id="ct-nerve" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#F6E6B4" />
            <stop offset="1" stopColor="#D3B05E" />
          </linearGradient>
          <radialGradient id="ct-shadow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#13202F" stopOpacity={0.22} />
            <stop offset="1" stopColor="#13202F" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={(FX0 + FX1 + DX) / 2} cy={BASE + 28} rx={360} ry={34} fill="url(#ct-shadow)" />
        {/* lateral */}
        {desenhos.map((d) => d.lateral)}
        {temSinal ? faixaLateral(fundoCamadas, BASE, "#D6DCE3", "leito") : null}
        <polygon points={pts([[FX1, yS(FX1)], [FX1 + DX, yS(FX1) + DY], [FX1 + DX, BASE + DY], [FX1, BASE]])} fill="none" stroke={K.ink2} strokeWidth={1.4} opacity={0.6} />
        {/* superfície (face de cima) */}
        {topFace}
        <path d={`M ${pts(prof(yS))} L ${pts(prof(yS, DX, DY).reverse())} Z`} fill="none" stroke={K.ink2} strokeWidth={1.3} opacity={0.55} />
        {temVinco ? <path d={`M ${VINCO} ${yS(VINCO)} L ${VINCO + DX} ${yS(VINCO) + DY}`} stroke="#7A4A42" strokeWidth={2.2} opacity={0.65 * skin} strokeLinecap="round" /> : null}
        {/* frente: camadas */}
        {desenhos.map((d) => d.frente)}
        {temSinal ? <rect x={FX0} y={fundoCamadas} width={FX1 - FX0} height={BASE - fundoCamadas} fill="#EEF2F6" /> : null}
        {/* nervo */}
        {temSinal ? (
          <g>
            {[nervo.d, ...ramos].map((p, i) => (
              <path key={`no${i}`} d={p} fill="none" stroke="#B8954A" strokeWidth={i ? 9 : 15} strokeLinecap="round" />
            ))}
            {[nervo.d, ...ramos].map((p, i) => (
              <path key={`ni${i}`} d={p} fill="none" stroke="url(#ct-nerve)" strokeWidth={i ? 6.5 : 12} strokeLinecap="round" />
            ))}
            <path d={nervo.d} fill="none" stroke="#FFF8DE" strokeWidth={2} strokeLinecap="round" opacity={0.8} transform="translate(0,-3)" />
            {placas.map(([x, y], i) => (
              <ellipse key={`pl${i}`} cx={x} cy={y} rx={14} ry={5.5} fill="#E9CF86" stroke="#B8954A" strokeWidth={1.4} />
            ))}
          </g>
        ) : null}
        <path d={`M ${pts(prof(yS))} L ${FX1},${BASE} L ${FX0},${BASE} Z`} fill="none" stroke={K.ink2} strokeWidth={1.6} opacity={0.7} />
        <polyline points={pts(prof(yS))} fill="none" stroke={K.ink} strokeWidth={2.4} />
        {/* agulha + agente */}
        {agulha > 0
          ? (() => {
              const dx = 0.42;
              const dy = -0.907;
              const back = (1 - agulha) * 230;
              const tx = PONTA.x + dx * back;
              const ty = PONTA.y + dy * back;
              return (
                <g opacity={Math.min(1, agulha * 2.5)}>
                  <path d={`M ${tx + dx * 26} ${ty + dy * 26} L ${tx + dx * 460} ${ty + dy * 460}`} stroke="#8D99A8" strokeWidth={6} strokeLinecap="round" />
                  <path d={`M ${tx + dx * 26} ${ty + dy * 26} L ${tx + dx * 460} ${ty + dy * 460}`} stroke="#E9EEF3" strokeWidth={2} strokeLinecap="round" transform="translate(-1.5,-1)" />
                  <path d={`M ${tx} ${ty} L ${tx + dx * 28 + 3} ${ty + dy * 28 + 1} L ${tx + dx * 28 - 3} ${ty + dy * 28 - 1} Z`} fill="#6D7A8A" />
                </g>
              );
            })()
          : null}
        {tox > 0 && ag
          ? MOL.map((mo, i) => {
              const p = prog(t, ag.em + 0.05 + mo.d, efeitoEm + 0.05 + mo.d * 0.5, EASE_INOUT);
              const sx = PONTA.x + Math.cos(mo.a) * 14;
              const sy = PONTA.y + Math.sin(mo.a) * 10;
              const x = lerp(sx, mo.dx, p) + Math.sin(Math.PI * p) * 24 * Math.cos(mo.a * 2);
              const y = lerp(sy, mo.dy, p) + Math.sin(Math.PI * p) * 18;
              const hx = Array.from({ length: 6 }, (_, j) => {
                const a = (Math.PI / 3) * j + Math.PI / 6;
                return [x + 9 * Math.cos(a), y + 9 * Math.sin(a)] as [number, number];
              });
              return <polygon key={`t${i}`} points={pts(hx)} fill={K.acc} stroke="#fff" strokeWidth={1.8} opacity={tox} />;
            })
          : null}
        {parede > 0 ? <rect x={388} y={J - 12} width={130 * parede} height={26} rx={13} fill="rgba(47,111,228,0.16)" stroke={K.acc} strokeWidth={2.6} opacity={parede} /> : null}
        {/* pulsos */}
        {pulsos.map((p, i) => {
          const u = (t - p.t) / VIAGEM;
          const stopAt = p.bloqueado && parede > 0.5 ? (nervo.total - 34) / nervo.total : 1;
          if (u < 0 || u > stopAt + 0.7) return null;
          const uu = Math.min(u, stopAt);
          const fd = u > stopAt ? 1 - clamp01((u - stopAt) / (p.bloqueado ? 0.35 : 0.15)) : 1;
          const dots = [];
          for (let j = 7; j >= 0; j--) {
            const q = nervo.em(Math.max(0, uu * nervo.total - j * 10));
            dots.push(<circle key={j} cx={q.x} cy={q.y} r={j === 0 ? 20 : 7.5 - j * 0.6} fill={j === 0 ? "url(#ct-pulse)" : K.accHi} opacity={(j === 0 ? 1 : 0.55 - j * 0.06) * fd} />);
          }
          const hit = p.bloqueado && parede > 0.5 && u > stopAt ? clamp01((u - stopAt) / 0.5) : -1;
          const hp = nervo.em(nervo.total - 34);
          return (
            <g key={`p${i}`}>
              {dots}
              {hit >= 0 ? <circle cx={hp.x} cy={hp.y} r={12 + 36 * EASE_OUT(hit)} fill="none" stroke={K.acc} strokeWidth={3} opacity={1 - hit} /> : null}
            </g>
          );
        })}
        {/* linhas-guia dos rótulos */}
        <g stroke={K.ink} strokeWidth={1.5} opacity={0.6} fill="none">
          {comRotulo.map(({ k, cam }, i) => {
            const alvo = k === 0 ? [300, yS(300) + 4] : [FX0 + 30, (limites[k] + limites[k + 1]) / 2];
            const ap = prog(t, (cam.em ?? OPEN[0] + 0.3 + i * 0.1) - 0.05, (cam.em ?? OPEN[0] + 0.3 + i * 0.1) + 0.3);
            return <path key={i} d={`M 196 ${posicoes[i] + 52} L ${alvo[0]} ${alvo[1]}`} opacity={ap} />;
          })}
          {m.sinal ? <path d={`M 196 ${HH - 80} L ${FX0 + 26} ${J + 48}`} opacity={prog(t, m.sinal.em - 0.05, m.sinal.em + 0.3)} /> : null}
          {ag ? <path d={`M 760 ${HH - 62} L 520 ${(temSinal ? J : alvoY) + 6}`} opacity={prog(t, ag.em - 0.05, ag.em + 0.3)} /> : null}
        </g>
        {comRotulo.map(({ k, cam }, i) => {
          const alvo = k === 0 ? [300, yS(300) + 4] : [FX0 + 30, (limites[k] + limites[k + 1]) / 2];
          return <circle key={`d${i}`} cx={alvo[0]} cy={alvo[1]} r={4.5} fill={K.acc} stroke="#fff" strokeWidth={2} opacity={prog(t, (cam.em ?? OPEN[0] + 0.3) - 0.05, (cam.em ?? OPEN[0] + 0.3) + 0.3)} />;
        })}
        {m.sinal ? <circle cx={FX0 + 26} cy={J + 48} r={4.5} fill={K.acc} stroke="#fff" strokeWidth={2} opacity={prog(t, m.sinal.em - 0.05, m.sinal.em + 0.3)} /> : null}
      </svg>
      {/* rótulos */}
      <div style={{ position: "absolute", left: X0, top: Y0, width: WW, height: HH, opacity: inner, fontFamily: FONT }}>
        {comRotulo.map(({ cam }, i) => (
          <RotuloCamada key={i} x={40} y={posicoes[i]} cam={cam} t={t} tIn={cam.em ?? OPEN[0] + 0.3 + i * 0.1} />
        ))}
        {m.sinal ? (
          <div style={{ position: "absolute", left: 40, top: HH - 108, fontWeight: 650, fontSize: 36, color: K.ink, lineHeight: 1.2 }}>
            <Rise t={t} at={m.sinal.em}>{m.sinal.rotulo ?? "Nervo"}</Rise>
          </div>
        ) : null}
        {ag ? (
          <div style={{ position: "absolute", right: 40, top: HH - 78, textAlign: "right", maxWidth: 420 }}>
            <div style={{ fontWeight: 700, fontSize: encaixar(ag.rotulo, { largura: 400, max: 36, min: 28, linhas: 1, fonte: { peso: 700 } }).tamanho, color: K.acc, lineHeight: 1.2, whiteSpace: "nowrap" }}>
              <Rise t={t} at={ag.em}>{ag.rotulo}</Rise>
            </div>
            {ag.efeito ? (
              <div style={{ fontWeight: 500, fontSize: encaixar(ag.efeito, { largura: 400, max: 30, min: 24, linhas: 1, fonte: { peso: 500 } }).tamanho, color: K.ink2, lineHeight: 1.25, whiteSpace: "nowrap" }}>
                <Rise t={t} at={efeitoEm}>{ag.efeito}</Rise>
              </div>
            ) : null}
          </div>
        ) : null}
        {etiqueta ? (
          <div style={{ position: "absolute", right: 36, top: 26, display: "flex", alignItems: "center", gap: 8, fontWeight: 500, fontSize: 28, color: K.slate, opacity: prog(t, OPEN[1] - 0.1, OPEN[1] + 0.3), whiteSpace: "nowrap" }}>
            <svg width={26} height={26} viewBox="0 0 26 26">
              <circle cx={11} cy={11} r={8} fill="none" stroke={K.slate} strokeWidth={2} />
              <path d="M17 17 L23 23" stroke={K.slate} strokeWidth={2.4} strokeLinecap="round" />
            </svg>
            {etiqueta}
          </div>
        ) : null}
      </div>
    </div>
  );
};

// rótulo de camada: nome + estado (que troca para o novo estado, em azul)
const RotuloCamada: React.FC<{ x: number; y: number; cam: Camada; t: number; tIn: number }> = ({ x, y, cam, t, tIn }) => {
  const sw = cam.novoEstadoEm !== undefined ? prog(t, cam.novoEstadoEm - 0.05, cam.novoEstadoEm + 0.3, EASE_INOUT) : 0;
  const tit = encaixar(cam.rotulo ?? "", { largura: 150, max: 36, min: 26, linhas: 1, fonte: { peso: 650 } });
  return (
    <div style={{ position: "absolute", top: y, left: x, textAlign: "left", width: 170 }}>
      <div style={{ fontWeight: 650, fontSize: tit.tamanho, color: K.ink, lineHeight: 1.2, whiteSpace: "nowrap" }}>
        <Rise t={t} at={tIn}>{cam.rotulo}</Rise>
      </div>
      {cam.estado || cam.novoEstado ? (
        <div style={{ position: "relative", height: 40, fontWeight: 500, fontSize: 30, lineHeight: 1.25, minWidth: 160 }}>
          {cam.estado ? (
            <div style={{ position: "absolute", top: 0, left: 0, whiteSpace: "nowrap", color: K.ink2, opacity: 1 - sw, transform: `translateY(${-sw * 14}px)`, filter: sw > 0 ? `blur(${sw * 5}px)` : undefined }}>
              <Rise t={t} at={tIn + 0.1}>{cam.estado}</Rise>
            </div>
          ) : null}
          {cam.novoEstado ? <div style={{ position: "absolute", top: 0, left: 0, whiteSpace: "nowrap", color: K.acc, fontWeight: 650, opacity: sw, transform: `translateY(${(1 - sw) * 14}px)` }}>{cam.novoEstado}</div> : null}
        </div>
      ) : null}
    </div>
  );
};
