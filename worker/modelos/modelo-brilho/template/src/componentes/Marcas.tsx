// Anotações sobre o próprio rosto: formas suaves na cor do produto (o triângulo do corretivo,
// a diagonal do blush, os pontos de iluminador), traços finos creme, setas de direção,
// etiquetas com linha-guia. Tudo acompanha o rosto (rastro) e escala com o tamanho dele.
import { Pontilhado, entra, limitar, mistura, prog, saindo, Traco, vaiVem } from "../anim";
import type { Marca, Plano, Ponto } from "../plano";
import { lados, type RostoNaTela, uv } from "../rosto";
import { cor, fonte } from "../tema";

type P = { x: number; y: number };
const soma = (a: P, b: P): P => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: P, b: P): P => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a: P, k: number): P => ({ x: a.x * k, y: a.y * k });
const lerp = (a: P, b: P, k: number): P => ({ x: mistura(a.x, b.x, k), y: mistura(a.y, b.y, k) });
const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
const f = (n: number) => n.toFixed(1);

// Polígono com cantos arredondados (raio r em px)
const poligonoArredondado = (pts: P[], r: number) => {
  const n = pts.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const ant = pts[(i - 1 + n) % n];
    const atual = pts[i];
    const prox = pts[(i + 1) % n];
    const a = lerp(atual, ant, Math.min(0.45, r / dist(atual, ant)));
    const b = lerp(atual, prox, Math.min(0.45, r / dist(atual, prox)));
    d += `${i === 0 ? "M" : "L"}${f(a.x)},${f(a.y)} Q${f(atual.x)},${f(atual.y)} ${f(b.x)},${f(b.y)} `;
  }
  return `${d}Z`;
};

// Seta pequena (ponta em V) no fim de um segmento
const ponta = (de: P, ate: P, tamanho: number) => {
  const ang = Math.atan2(ate.y - de.y, ate.x - de.x);
  const a1 = { x: ate.x - tamanho * Math.cos(ang - 0.55), y: ate.y - tamanho * Math.sin(ang - 0.55) };
  const a2 = { x: ate.x - tamanho * Math.cos(ang + 0.55), y: ate.y - tamanho * Math.sin(ang + 0.55) };
  return `M${f(a1.x)},${f(a1.y)} L${f(ate.x)},${f(ate.y)} L${f(a2.x)},${f(a2.y)}`;
};

// Estrela de quatro pontas (o brilho do iluminador)
const estrela = (c: P, R: number, r: number) => {
  const pts: string[] = [];
  for (let k = 0; k < 8; k++) {
    const ang = -Math.PI / 2 + (k * Math.PI) / 4;
    const raio = k % 2 === 0 ? R : r;
    pts.push(`${f(c.x + raio * Math.cos(ang))},${f(c.y + raio * Math.sin(ang))}`);
  }
  // pontas côncavas: curva passando perto do centro entre as pontas
  let d = `M${pts[0]}`;
  for (let k = 1; k <= 8; k += 2) {
    d += ` Q${pts[k % 8]} ${pts[(k + 1) % 8]}`;
  }
  return `${d}Z`;
};

// ---------- geometria de cada forma (em px na tela) ----------

const pt = (p: Ponto, s: 1 | -1, rosto: RostoNaTela, plano: Plano) => rosto.ponto(uv(p, s, plano));

// `altura`: do meio da base até a ponta, em larguras de rosto (padrão 0,23). Com óculos a base
// desce para baixo da armação; um triângulo mais curto evita que a ponta chegue no canto da boca.
export const geometriaTriangulo = (s: 1 | -1, rosto: RostoNaTela, plano: Plano, altura = 0.23) => {
  const O = uv("olhos", s, plano);
  const A = rosto.ponto({ u: O.u - 0.115 * s, v: O.v + 0.008 });
  const B = rosto.ponto({ u: O.u + 0.118 * s, v: O.v - 0.006 });
  const C = rosto.ponto({ u: O.u - 0.03 * s, v: O.v + altura });
  return { A, B, C, base: lerp(A, B, 0.5) };
};

export const geometriaEsfumado = (m: Extract<Marca, { forma: "esfumado" }>, s: 1 | -1, rosto: RostoNaTela, plano: Plano, t: number) => {
  const A = pt(m.de ?? "maca", s, rosto, plano);
  const B = pt(m.ate ?? "tempora", s, rosto, plano);
  const dir = mul(sub(B, A), 1 / Math.max(1, dist(A, B)));
  const final = {
    c: lerp(A, B, 0.3),
    rx: dist(A, B) * 0.36,
    ry: rosto.W * 0.068,
    ang: (Math.atan2(dir.y, dir.x) * 180) / Math.PI,
  };
  // antes de subir: redonda e mais baixa, na maçã
  const baixo = { c: soma(A, { x: 0, y: rosto.W * 0.06 }), rx: rosto.W * 0.095, ry: rosto.W * 0.08, ang: final.ang };
  const pSobe = m.sobeEm === undefined ? 1 : prog(t, m.sobeEm, 0.75, vaiVem);
  const atual = {
    c: lerp(baixo.c, final.c, pSobe),
    rx: mistura(baixo.rx, final.rx, pSobe),
    ry: mistura(baixo.ry, final.ry, pSobe),
    ang: final.ang,
  };
  const pontaFinal = soma(final.c, mul(dir, final.rx));
  return { A, B, dir, final, baixo, atual, pSobe, pontaFinal };
};

// Ponto de onde sai a linha-guia de uma marca (no lado s)
export const ancoraDaMarca = (m: Marca, s: 1 | -1, rosto: RostoNaTela, plano: Plano, t: number): P => {
  switch (m.forma) {
    case "triangulo": {
      const g = geometriaTriangulo(s, rosto, plano, m.altura);
      return lerp(g.base, g.C, 0.4);
    }
    case "esfumado": {
      const g = geometriaEsfumado(m, s, rosto, plano, t);
      return m.setaEm !== undefined && t >= m.setaEm ? g.B : g.atual.c;
    }
    case "brilho":
    case "circulo":
      return pt(m.onde, s, rosto, plano);
    case "seta":
      return pt(m.ate, s, rosto, plano);
  }
};

// Lado preferido para a etiqueta/ligação de uma marca: o lado pedido, ou o do painel
export const ladoDaMarca = (m: Marca, preferido: 1 | -1): 1 | -1 => {
  const onde = m.forma === "brilho" || m.forma === "circulo" ? m.onde : undefined;
  const disponiveis = lados(m.lados, onde);
  return disponiveis.includes(preferido) ? preferido : disponiveis[0];
};

// ---------- desenho ----------

export type Desenho = {
  chave: string;
  marca: Marca;
  cor: string;
  // até quando fica na tela (some suave antes)
  fim: number;
  // no resumo (momento "resultado"): forma final, sem setas nem estado "antes"
  resumo?: boolean;
};

const claro = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.72;
};

const visivel = (t: number, d: Desenho) => 1 - saindo(t, d.fim, 0.35);

// Camada das formas coloridas (o "produto" no rosto): cores claras clareiam a pele (screen),
// cores médias e escuras tingem (multiply). Desfocadas nas bordas, como produto esfumado.
type Recorte = { x: number; y: number; w: number; h: number };

export const CamadaDeCor: React.FC<{ desenhos: Desenho[]; t: number; rosto: RostoNaTela; plano: Plano; id: string; recorte: Recorte }> = ({
  desenhos,
  t,
  rosto,
  plano,
  id,
  recorte,
}) => {
  const grupos: Record<"screen" | "multiply", React.ReactNode[]> = { screen: [], multiply: [] };
  const desfoque = Math.max(3, rosto.W * 0.022);
  for (const d of desenhos) {
    const m = d.marca;
    const op = visivel(t, d);
    if (op <= 0.001 || t < m.em - 0.05) continue;
    const modo = claro(d.cor) ? "screen" : "multiply";
    // no resumo (resultado) o produto fica um pouco mais marcado: é o "look" pronto
    const forca = (modo === "screen" ? 0.85 : 0.72) * (d.resumo ? 1.15 : 1);
    const onde = m.forma === "brilho" || m.forma === "circulo" ? m.onde : undefined;
    for (const s of lados(m.lados, onde)) {
      const k = `${d.chave}-${s}`;
      switch (m.forma) {
        case "triangulo": {
          const g = geometriaTriangulo(s, rosto, plano, m.altura);
          const p = d.resumo ? prog(t, m.em, 0.5) : prog(t, m.em + 0.35, 0.6);
          // "puxando pra cima": o produto sobe um pouco
          const sobe = !d.resumo && m.setaEm !== undefined ? prog(t, m.setaEm, 0.9, vaiVem) * rosto.W * 0.025 : 0;
          const pts = [g.A, g.B, g.C].map((q) => ({ x: q.x, y: q.y - sobe }));
          grupos[modo].push(
            <path key={k} d={poligonoArredondado(pts, rosto.W * 0.03)} fill={d.cor} opacity={p * op * forca} filter={`url(#${id}-${modo}-desfoque)`} />,
          );
          break;
        }
        case "esfumado": {
          const g = geometriaEsfumado(m, s, rosto, plano, d.resumo ? Infinity : t);
          const p = d.resumo ? prog(t, m.em, 0.5) : prog(t, m.em, 0.5);
          const e = g.atual;
          grupos[modo].push(
            <ellipse
              key={k}
              cx={e.c.x}
              cy={e.c.y}
              rx={e.rx}
              ry={e.ry}
              transform={`rotate(${e.ang} ${e.c.x} ${e.c.y})`}
              fill={d.cor}
              opacity={p * op * (d.resumo ? 1 : mistura(0.55, 1, g.pSobe)) * forca}
              filter={`url(#${id}-${modo}-desfoque-forte)`}
            />,
          );
          break;
        }
        case "brilho": {
          const c = pt(m.onde, s, rosto, plano);
          const p = prog(t, m.em, 0.5);
          grupos.screen.push(<circle key={k} cx={c.x} cy={c.y} r={rosto.W * 0.07} fill={`url(#${id}-screen-perola)`} opacity={p * op * 0.9} />);
          break;
        }
        case "circulo": {
          const c = pt(m.onde, s, rosto, plano);
          const p = prog(t, m.em + 0.3, 0.5);
          grupos[modo].push(
            <circle key={k} cx={c.x} cy={c.y} r={(m.raio ?? 0.09) * rosto.W} fill={d.cor} opacity={p * op * 0.4} filter={`url(#${id}-${modo}-desfoque)`} />,
          );
          break;
        }
        case "seta":
          break;
      }
    }
  }
  const defs = (modo: "screen" | "multiply") => (
    <defs>
      <filter id={`${id}-${modo}-desfoque`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={desfoque} />
      </filter>
      <filter id={`${id}-${modo}-desfoque-forte`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={desfoque * 1.7} />
      </filter>
      <clipPath id={`${id}-${modo}-rec`}>
        <rect x={recorte.x} y={recorte.y} width={recorte.w} height={recorte.h} />
      </clipPath>
      <radialGradient id={`${id}-${modo}-perola`}>
        <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
        <stop offset="0.35" stopColor="#FFF3E0" stopOpacity={0.6} />
        <stop offset="1" stopColor="#FFF3E0" stopOpacity={0} />
      </radialGradient>
    </defs>
  );
  const camada = (modo: "screen" | "multiply") =>
    grupos[modo].length ? (
      <svg key={modo} width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, mixBlendMode: modo, pointerEvents: "none" }}>
        {defs(modo)}
        <g clipPath={`url(#${id}-${modo}-rec)`}>{grupos[modo]}</g>
      </svg>
    ) : null;
  return (
    <>
      {camada("multiply")}
      {camada("screen")}
    </>
  );
};

// Camada dos traços (contornos, setas, estrelas de brilho, etiquetas)
export const CamadaDeTraco: React.FC<{
  desenhos: Desenho[];
  t: number;
  rosto: RostoNaTela;
  plano: Plano;
  id: string;
  recorte: Recorte;
  ladoEtiqueta?: 1 | -1;
}> = ({ desenhos, t, rosto, plano, id, recorte, ladoEtiqueta = 1 }) => {
  const lw = Math.max(3, rosto.W * 0.0068);
  const itens: React.ReactNode[] = [];
  const etiquetas: React.ReactNode[] = [];
  for (const d of desenhos) {
    const m = d.marca;
    const op = visivel(t, d);
    if (op <= 0.001 || t < m.em - 0.05) continue;
    const onde = m.forma === "brilho" || m.forma === "circulo" ? m.onde : undefined;
    for (const s of lados(m.lados, onde)) {
      const k = `${d.chave}-${s}`;
      switch (m.forma) {
        case "triangulo": {
          const g = geometriaTriangulo(s, rosto, plano, m.altura);
          const p = d.resumo ? prog(t, m.em, 0.6) : prog(t, m.em, 0.75, vaiVem);
          itens.push(
            <Traco key={k} d={poligonoArredondado([g.A, g.B, g.C], rosto.W * 0.03)} p={p} cor={cor.traco} largura={lw} opacidade={op * (d.resumo ? 0.35 : 1)} />,
          );
          if (!d.resumo && m.setaEm !== undefined) {
            // três setas curtas subindo por dentro do triângulo
            [0, 1, 2].forEach((i) => {
              const pa = prog(t, m.setaEm! + i * 0.12, 0.45);
              if (pa <= 0) return;
              const baseX = mistura(g.A.x, g.B.x, 0.3 + i * 0.2);
              const topo = mistura(g.A.y, g.B.y, 0.3 + i * 0.2) + rosto.W * 0.045;
              const fundo = mistura(topo, g.C.y, 0.55 - Math.abs(i - 1) * 0.12);
              const de = { x: mistura(baseX, g.C.x, 0.35), y: fundo };
              const ate = { x: baseX, y: topo };
              const atual = lerp(de, ate, pa);
              itens.push(
                <g key={`${k}-s${i}`} opacity={op}>
                  <path d={`M${f(de.x)},${f(de.y)} L${f(atual.x)},${f(atual.y)}`} stroke={cor.traco} strokeWidth={lw * 0.85} strokeLinecap="round" fill="none" />
                  <path d={ponta(de, atual, rosto.W * 0.03)} stroke={cor.traco} strokeWidth={lw * 0.85} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </g>,
              );
            });
          }
          break;
        }
        case "esfumado": {
          const g = geometriaEsfumado(m, s, rosto, plano, d.resumo ? Infinity : t);
          const e = g.atual;
          const p = d.resumo ? prog(t, m.em, 0.6) : prog(t, m.em, 0.7, vaiVem);
          // contorno fino da mancha (pontilhado enquanto está "no lugar errado", cheio depois de subir)
          const rx = e.rx + rosto.W * 0.02;
          const ry = e.ry + rosto.W * 0.02;
          const cosA = Math.cos((e.ang * Math.PI) / 180);
          const sinA = Math.sin((e.ang * Math.PI) / 180);
          const pontoElipse = (a: number) => ({
            x: e.c.x + rx * Math.cos(a) * cosA - ry * Math.sin(a) * sinA,
            y: e.c.y + rx * Math.cos(a) * sinA + ry * Math.sin(a) * cosA,
          });
          let dE = "";
          for (let k2 = 0; k2 <= 48; k2++) {
            const q = pontoElipse((k2 / 48) * Math.PI * 2 + Math.PI);
            dE += `${k2 === 0 ? "M" : "L"}${f(q.x)},${f(q.y)} `;
          }
          const antes = !d.resumo && m.sobeEm !== undefined && g.pSobe < 0.999;
          if (antes && g.pSobe < 0.02) {
            itens.push(<Pontilhado key={k} id={`${id}-${k}-e`} d={dE} p={p} cor={cor.traco} largura={lw} opacidade={op} />);
          } else {
            itens.push(<Traco key={k} d={dE} p={d.resumo ? p : Math.max(p, g.pSobe)} cor={cor.traco} largura={lw} opacidade={op * (d.resumo ? 0.35 : 1)} />);
          }
          if (!d.resumo && m.sobeEm !== undefined) {
            // "mais alto": uma seta curta sobe junto com a mancha
            const pa = prog(t, m.sobeEm - 0.1, 0.4) * (1 - prog(t, m.sobeEm + 1.1, 0.4));
            if (pa > 0) {
              const de = soma(g.baixo.c, { x: 0, y: g.baixo.ry + rosto.W * 0.1 });
              const ate = soma(g.final.c, { x: 0, y: g.final.ry + rosto.W * 0.07 });
              itens.push(
                <g key={`${k}-sobe`} opacity={pa * op}>
                  <path d={`M${f(de.x)},${f(de.y)} L${f(ate.x)},${f(ate.y)}`} stroke={cor.traco} strokeWidth={lw} strokeLinecap="round" fill="none" />
                  <path d={ponta(de, ate, rosto.W * 0.035)} stroke={cor.traco} strokeWidth={lw} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </g>,
              );
            }
          }
          if (!d.resumo && m.setaEm !== undefined) {
            const pa = prog(t, m.setaEm, 0.7, vaiVem);
            const de = g.pontaFinal;
            const ate = lerp(g.pontaFinal, g.B, 0.86);
            itens.push(<Pontilhado key={`${k}-seta`} id={`${id}-${k}-s`} d={`M${f(de.x)},${f(de.y)} L${f(ate.x)},${f(ate.y)}`} p={pa} cor={cor.traco} largura={lw * 1.1} opacidade={op} />);
            const pp = prog(t, m.setaEm + 0.55, 0.3);
            if (pp > 0) {
              itens.push(
                <g key={`${k}-alvo`} opacity={op * pp}>
                  <path d={ponta(de, ate, rosto.W * 0.04)} stroke={cor.traco} strokeWidth={lw * 1.1} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <circle cx={g.B.x} cy={g.B.y} r={rosto.W * 0.022 * (0.6 + 0.4 * pp)} fill="none" stroke={cor.traco} strokeWidth={lw} />
                </g>,
              );
            }
          }
          if (!d.resumo && m.levantaEm !== undefined) {
            // "levanta o rosto": linha de elevação que sobe da mandíbula até a maçã, dos dois lados
            const pl = prog(t, m.levantaEm, 0.8, vaiVem);
            const de = rosto.ponto({ u: 0.4 * s, v: 0.44 });
            const meio = rosto.ponto({ u: 0.5 * s, v: 0.22 });
            const ate = rosto.ponto({ u: 0.47 * s, v: 0.04 });
            const dL = `M${f(de.x)},${f(de.y)} Q${f(meio.x)},${f(meio.y)} ${f(ate.x)},${f(ate.y)}`;
            itens.push(<Traco key={`${k}-lev`} d={dL} p={pl} cor={cor.traco} largura={lw * 1.1} opacidade={op} />);
            if (pl > 0.85) {
              const quase = { x: mistura(meio.x, ate.x, 0.8), y: mistura(meio.y, ate.y, 0.8) };
              itens.push(
                <path
                  key={`${k}-levp`}
                  d={ponta(quase, ate, rosto.W * 0.04)}
                  stroke={cor.traco}
                  strokeWidth={lw * 1.1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity={op * limitar((pl - 0.85) / 0.15)}
                />,
              );
            }
          }
          break;
        }
        case "brilho": {
          const c = pt(m.onde, s, rosto, plano);
          const p = prog(t, m.em, 0.55);
          const fase = (s === 1 ? 0 : 1.7) + c.x * 0.01;
          const cintila = 0.82 + 0.18 * Math.sin(t * 5.2 + fase);
          const R = rosto.W * 0.085 * p * cintila;
          const giro = 8 * Math.sin(t * 1.6 + fase);
          const R2 = rosto.W * 0.04 * p * (0.75 + 0.25 * Math.sin(t * 6.3 + fase + 2));
          const c2 = { x: c.x + rosto.W * 0.075 * (s === 1 ? 1 : -1), y: c.y - rosto.W * 0.07 };
          itens.push(
            <g key={k} opacity={op}>
              <path d={estrela(c, R, R * 0.2)} fill={cor.traco} transform={`rotate(${giro} ${c.x} ${c.y})`} />
              <path d={estrela(c2, R2, R2 * 0.22)} fill={cor.traco} opacity={0.9} />
            </g>,
          );
          break;
        }
        case "circulo": {
          const c = pt(m.onde, s, rosto, plano);
          const r = (m.raio ?? 0.09) * rosto.W;
          const p = prog(t, m.em, 0.7, vaiVem);
          const dC = `M${f(c.x - r)},${f(c.y)} a${f(r)},${f(r)} 0 1,1 ${f(2 * r)},0 a${f(r)},${f(r)} 0 1,1 ${f(-2 * r)},0`;
          itens.push(<Traco key={k} d={dC} p={p} cor={cor.traco} largura={lw} opacidade={op} />);
          break;
        }
        case "seta": {
          const a = pt(m.de, s, rosto, plano);
          const b = pt(m.ate, s, rosto, plano);
          const meio = lerp(a, b, 0.5);
          const normal = { x: -(b.y - a.y), y: b.x - a.x };
          const k2 = (rosto.W * 0.08) / Math.max(1, Math.hypot(normal.x, normal.y));
          const ctrl = soma(meio, mul(normal, k2 * s));
          const p = prog(t, m.em, 0.7, vaiVem);
          itens.push(
            <Pontilhado key={k} id={`${id}-${k}-sl`} d={`M${f(a.x)},${f(a.y)} Q${f(ctrl.x)},${f(ctrl.y)} ${f(b.x)},${f(b.y)}`} p={p} cor={cor.traco} largura={lw * 1.1} opacidade={op} />,
          );
          if (p > 0.9) {
            const quase = lerp(ctrl, b, 0.85);
            itens.push(
              <path key={`${k}-p`} d={ponta(quase, b, rosto.W * 0.04)} stroke={cor.traco} strokeWidth={lw * 1.1} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={op} />,
            );
          }
          break;
        }
      }
    }
    // etiqueta presa à marca (só uma, no lado preferido)
    if (m.rotulo && !d.resumo) {
      const s = ladoDaMarca(m, ladoEtiqueta);
      const em = m.rotulo.em ?? m.em + 0.4;
      const pe = prog(t, em, 0.5);
      if (pe > 0) {
        const a = ancoraDaMarca(m, s, rosto, plano, t);
        const tamanho = 42;
        const largura = m.rotulo.texto.length * tamanho * 0.56 + 44;
        const xBorda = Math.max(24 + (s === 1 ? 0 : largura), Math.min(1056 - (s === 1 ? largura : 0), rosto.cx + s * rosto.W * 0.66));
        const y = a.y + rosto.W * 0.2;
        const fimLinha = { x: xBorda, y };
        itens.push(
          <g key={`${d.chave}-rot`} opacity={op}>
            <circle cx={a.x} cy={a.y} r={lw * 1.6} fill={cor.traco} opacity={pe} />
            <Traco d={`M${f(a.x)},${f(a.y)} L${f(fimLinha.x)},${f(fimLinha.y)}`} p={pe} cor={cor.traco} largura={lw * 0.8} />
          </g>,
        );
        etiquetas.push(
          <div
            key={`${d.chave}-et`}
            style={{
              position: "absolute",
              left: s === 1 ? xBorda : xBorda - largura,
              top: y - 36,
              height: 72,
              width: largura,
              borderRadius: 36,
              background: cor.creme,
              color: cor.tinta,
              fontFamily: fonte,
              fontWeight: 600,
              fontSize: tamanho,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(40,20,30,0.18)",
              opacity: op * limitar((pe - 0.5) * 2),
              scale: String(mistura(0.92, 1, pe)),
              transformOrigin: s === 1 ? "left center" : "right center",
            }}
          >
            {m.rotulo.texto}
          </div>,
        );
      }
    }
  }
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: `drop-shadow(0 1px 2.5px ${cor.sombraTraco})` }}>
        <defs>
          <clipPath id={`${id}-rec`}>
            <rect x={recorte.x} y={recorte.y} width={recorte.w} height={recorte.h} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-rec)`}>{itens}</g>
      </svg>
      {etiquetas}
    </>
  );
};

// Ponto numerado no rosto (abertura): o mapa dos truques
export const PontoNumerado: React.FC<{ c: P; n: number; t: number; em: number; fim: number; W: number }> = ({ c, n, t, em, fim, W }) => {
  const p = prog(t, em, 0.5, entra);
  const op = 1 - saindo(t, fim, 0.3);
  if (p <= 0 || op <= 0) return null;
  const r = Math.max(30, W * 0.072);
  const onda = prog(t, em, 1.1);
  return (
    <div style={{ position: "absolute", left: c.x - r, top: c.y - r, width: 2 * r, height: 2 * r, opacity: op }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `2.5px solid ${cor.traco}`,
          scale: String(1 + onda * 0.9),
          opacity: (1 - onda) * 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: cor.berry,
          border: `2.5px solid ${cor.traco}`,
          color: cor.creme,
          fontFamily: fonte,
          fontWeight: 700,
          fontSize: r * 1.1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          scale: String(p),
          boxShadow: "0 4px 14px rgba(40,20,30,0.3)",
        }}
      >
        {n}
      </div>
    </div>
  );
};
