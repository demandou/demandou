// O mapa ilustrado: chão de areia, água com ondinhas, morros em curvas de nível, bairros como manchas de
// quarteirões, parques e pontes — tudo desenhado aqui, sem mapa da internet. A geometria vive em
// coordenadas do mapa (0–1) sob a câmera; rota, pinos e rótulos são desenhados na tela, com tamanho fixo.
import { useMemo } from "react";
import { limitar, prog, saindo } from "../anim";
import type { Mapa as TipoMapa, Ponto } from "../plano";
import { naTela, pontoNaPerna, progressoDaPerna, type Roteiro, type Vista } from "../roteiro";
import { CARTOES, cor, display, sans, W } from "../tema";
import { Desenho } from "./Desenhos";

// pseudo-aleatório estável a partir de números (o mapa não "treme" entre quadros)
const acaso = (...n: number[]) => {
  let h = 2166136261;
  for (const v of n) {
    h ^= Math.round(v * 100000);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
};

const suavizar = (pts: Ponto[], amostras = 12): Ponto[] => {
  if (pts.length < 3) return pts;
  const saida: Ponto[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < amostras; k++) {
      const f = k / amostras;
      const cr = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
      saida.push({ x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  saida.push(pts[pts.length - 1]);
  return saida;
};

const LONGE = 3;
const poligonoDaAgua = (agua: NonNullable<TipoMapa["agua"]>): Ponto[] => {
  const m = suavizar(agua.margem);
  if (m.length < 2) return [];
  const a = m[0];
  const b = m[m.length - 1];
  const o = agua.outraMargem && agua.outraMargem.length >= 2 ? suavizar(agua.outraMargem) : null;
  if (o) {
    // rio: entre as duas margens, esticadas até fora do mapa
    const oa = o[0];
    const ob = o[o.length - 1];
    const horizontal = agua.lado === "sul" || agua.lado === "norte";
    return horizontal
      ? [{ x: -LONGE, y: a.y }, ...m, { x: 1 + LONGE, y: b.y }, { x: 1 + LONGE, y: ob.y }, ...[...o].reverse(), { x: -LONGE, y: oa.y }]
      : [{ x: a.x, y: -LONGE }, ...m, { x: b.x, y: 1 + LONGE }, { x: ob.x, y: 1 + LONGE }, ...[...o].reverse(), { x: oa.x, y: -LONGE }];
  }
  switch (agua.lado) {
    case "sul":
      return [{ x: -LONGE, y: a.y }, ...m, { x: 1 + LONGE, y: b.y }, { x: 1 + LONGE, y: 1 + LONGE }, { x: -LONGE, y: 1 + LONGE }];
    case "norte":
      return [{ x: -LONGE, y: a.y }, ...m, { x: 1 + LONGE, y: b.y }, { x: 1 + LONGE, y: -LONGE }, { x: -LONGE, y: -LONGE }];
    case "leste":
      return [{ x: a.x, y: -LONGE }, ...m, { x: b.x, y: 1 + LONGE }, { x: 1 + LONGE, y: 1 + LONGE }, { x: 1 + LONGE, y: -LONGE }];
    case "oeste":
      return [{ x: a.x, y: -LONGE }, ...m, { x: b.x, y: 1 + LONGE }, { x: -LONGE, y: 1 + LONGE }, { x: -LONGE, y: -LONGE }];
  }
};

const dentro = (p: Ponto, poli: Ponto[]) => {
  let d = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const a = poli[i];
    const b = poli[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) d = !d;
  }
  return d;
};

const caminho = (pts: Ponto[], fechar = false) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join(" ") + (fechar ? " Z" : "");
const caminhoTela = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

// mancha irregular (morro, parque) ao redor de um centro
const mancha = (cx: number, cy: number, r: number, semente: number) => {
  const pts: Ponto[] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 0.82 + 0.3 * acaso(semente, i);
    pts.push({ x: cx + Math.cos(a) * r * k * 1.15, y: cy + Math.sin(a) * r * k * 0.9 });
  }
  return suavizar([...pts, pts[0], pts[1], pts[2]], 8).slice(0, n * 8 + 1);
};

type Geometria = {
  agua: Ponto[];
  margens: Ponto[][];
  ruas: Ponto[][];
  manchas: { x: number; y: number; r: number }[];
  quarteiroes: { x: number; y: number; w: number; h: number; giro: number; tom: number }[];
  morros: Ponto[][][];
  parques: { contorno: Ponto[]; arvores: Ponto[] }[];
};

const montarGeometria = (mapa: TipoMapa): Geometria => {
  const agua = mapa.agua ? poligonoDaAgua(mapa.agua) : [];
  const naAgua = (p: Ponto) => agua.length > 0 && dentro(p, agua);
  const quarteiroes: Geometria["quarteiroes"] = [];
  (mapa.bairros ?? []).forEach((b, bi) => {
    const r = b.tamanho ?? 0.045;
    const giro = (acaso(bi, 7) - 0.5) * 0.7;
    const passo = 0.0125;
    const n = Math.ceil(r / passo) + 1;
    for (let i = -n; i <= n; i++) {
      for (let j = -n; j <= n; j++) {
        const lx = i * passo;
        const ly = j * passo;
        const x = b.x + lx * Math.cos(giro) - ly * Math.sin(giro);
        const y = b.y + lx * Math.sin(giro) + ly * Math.cos(giro);
        const dist = Math.hypot(x - b.x, y - b.y) / r;
        if (dist > 0.75 + 0.35 * acaso(bi, i, j) || naAgua({ x, y })) continue;
        const largo = acaso(i, j, bi) > 0.82;
        quarteiroes.push({ x, y, w: passo * (largo ? 1.7 : 0.74), h: passo * 0.74, giro, tom: acaso(j, i, bi * 3) });
        if (largo) i += 0;
      }
    }
  });
  const morros = (mapa.morros ?? []).map((m, i) => [1, 0.68, 0.38].map((k, a) => mancha(m.x, m.y, m.r * k, i * 10 + a)));
  const parques = (mapa.parques ?? []).map((p, i) => {
    const contorno = mancha(p.x, p.y, p.r, 100 + i);
    const arvores: Ponto[] = [];
    for (let k = 0; k < 26; k++) {
      const a = acaso(i, k, 1) * Math.PI * 2;
      const d = Math.sqrt(acaso(i, k, 2)) * p.r * 0.75;
      arvores.push({ x: p.x + Math.cos(a) * d * 1.1, y: p.y + Math.sin(a) * d * 0.85 });
    }
    return { contorno, arvores };
  });
  // as margens desenhadas continuam além das pontas (a água também continua)
  const horizontal = mapa.agua?.lado === "sul" || mapa.agua?.lado === "norte";
  const esticar = (pts: Ponto[]) => {
    const a = pts[0];
    const b = pts[pts.length - 1];
    return horizontal ? [{ x: -LONGE, y: a.y }, ...pts, { x: 1 + LONGE, y: b.y }] : [{ x: a.x, y: -LONGE }, ...pts, { x: b.x, y: 1 + LONGE }];
  };
  const margens = mapa.agua
    ? [esticar(suavizar(mapa.agua.margem)), ...(mapa.agua.outraMargem?.length ? [esticar(suavizar(mapa.agua.outraMargem))] : [])]
    : [];
  // ruas: uma árvore mínima ligando os bairros em terra (sem atravessar a água)
  const nos = (mapa.bairros ?? []).filter((b) => !naAgua(b));
  const ruas: Ponto[][] = [];
  if (nos.length > 1) {
    const dentroDaArvore = new Set([0]);
    while (dentroDaArvore.size < nos.length) {
      let melhor: { a: number; b: number; d: number } | null = null;
      for (const a of dentroDaArvore) {
        nos.forEach((nb, b) => {
          if (dentroDaArvore.has(b)) return;
          const na = nos[a];
          const meio = { x: (na.x + nb.x) / 2, y: (na.y + nb.y) / 2 };
          const d = Math.hypot(na.x - nb.x, na.y - nb.y) * (naAgua(meio) ? 50 : 1);
          if (!melhor || d < melhor.d) melhor = { a, b, d };
        });
      }
      if (!melhor) break;
      const { a, b } = melhor;
      dentroDaArvore.add(b);
      const na = nos[a];
      const nb = nos[b];
      const meio = { x: (na.x + nb.x) / 2, y: (na.y + nb.y) / 2 };
      if (naAgua(meio)) continue;
      const curva = 0.12 * (acaso(a, b) - 0.5);
      ruas.push(
        suavizar([na, { x: meio.x - (nb.y - na.y) * curva, y: meio.y + (nb.x - na.x) * curva }, nb], 10),
      );
    }
  }
  const manchas = (mapa.bairros ?? []).map((b) => ({ x: b.x, y: b.y, r: (b.tamanho ?? 0.045) * 1.1 }));
  return { agua, margens, ruas, manchas, quarteiroes, morros, parques };
};

// ---------- pino ----------

const Pino: React.FC<{ x: number; y: number; numero: number; marca?: "numero" | "ponto"; lapis: number; tinta: number; visitado: number }> = ({ x, y, numero, marca = "numero", lapis, tinta, visitado }) => {
  const forma = "M32 84 C 26 68, 5 54, 5 31 A 27 27 0 1 1 59 31 C 59 54, 38 68, 32 84 Z";
  const queda = (1 - tinta) * -40;
  return (
    <g transform={`translate(${x - 32 * 1.22} ${y - 84 * 1.22}) scale(1.22)`}>
      {lapis > 0 && tinta < 1 ? (
        <g opacity={lapis * (1 - tinta)}>
          <path d={forma} fill="rgba(251,246,236,0.55)" stroke={cor.lapis} strokeWidth={3} strokeDasharray="7 7" />
          {marca === "ponto" ? (
            <circle cx={32} cy={31} r={8} fill={cor.lapis} />
          ) : (
            <text x={32} y={42} textAnchor="middle" fontFamily={sans} fontWeight={700} fontSize={30} fill={cor.lapis}>
              {numero}
            </text>
          )}
        </g>
      ) : null}
      {tinta > 0 ? (
        <g opacity={limitar(tinta * 1.6)}>
          <ellipse cx={32} cy={84} rx={15 * tinta} ry={5 * tinta} fill="rgba(60,44,20,0.28)" />
          <g transform={`translate(0 ${queda})`}>
            <path d={forma} fill={cor.azulejo} stroke={cor.papel} strokeWidth={4} />
            {marca === "ponto" ? (
              <circle cx={32} cy={31} r={8} fill={cor.papel} opacity={1 - visitado} />
            ) : (
              <text x={32} y={42} textAnchor="middle" fontFamily={sans} fontWeight={700} fontSize={30} fill={cor.papel} opacity={1 - visitado}>
                {numero}
              </text>
            )}
            <path d="M20 31 l8 8 l16 -17" fill="none" stroke={cor.sol} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - visitado} />
          </g>
        </g>
      ) : null}
    </g>
  );
};

// ---------- o mapa ----------

export const Mapa: React.FC<{
  mapa: TipoMapa;
  roteiro: Roteiro;
  vista: Vista;
  t: number;
  // 0 = manhã … 1 = fim do dia (aquece a luz do mapa)
  calor: number;
  // o bloco de mapa em que estamos (para os traços "a lápis" entrarem e saírem)
  bloco: { de: number; ate: number };
  // onde está o postal da pessoa (os rótulos que ficariam embaixo dele somem)
  postal: { x: number; y: number; w: number; h: number };
}> = ({ mapa, roteiro, vista, t, calor, bloco, postal }) => {
  const geo = useMemo(() => montarGeometria(mapa), [mapa]);
  const v = vista;
  const transf = `translate(${v.ax - v.cx * v.s} ${v.ay - v.cy * v.s}) scale(${v.s})`;
  // janela visível em coordenadas do mapa (para as ondinhas)
  const vis = { x0: v.cx - v.ax / v.s, x1: v.cx + (W - v.ax) / v.s, y0: v.cy - v.ay / v.s, y1: v.cy + (1920 - v.ay) / v.s };
  const ondas: Ponto[] = [];
  if (geo.agua.length) {
    const px = 0.034;
    const py = 0.026;
    for (let j = Math.floor(vis.y0 / py); j <= Math.ceil(vis.y1 / py); j++) {
      for (let i = Math.floor(vis.x0 / px); i <= Math.ceil(vis.x1 / px); i++) {
        const p = { x: i * px + (j % 2 ? px / 2 : 0) + (acaso(i, j) - 0.5) * 0.01, y: j * py };
        if (acaso(j, i, 5) < 0.55 && dentro(p, geo.agua)) ondas.push(p);
      }
    }
  }
  const fundo: { x: number; y: number; w: number; h: number }[] = [];
  {
    const passo = 0.021;
    for (let j = Math.floor(vis.y0 / passo) - 1; j <= Math.ceil(vis.y1 / passo); j++) {
      for (let i = Math.floor(vis.x0 / passo) - 1; i <= Math.ceil(vis.x1 / passo); i++) {
        if (acaso(i, j, 11) > 0.34) continue;
        const p = { x: i * passo + acaso(i, j, 12) * 0.006, y: j * passo + acaso(i, j, 13) * 0.006 };
        if (geo.agua.length && dentro(p, geo.agua)) continue;
        if (geo.manchas.some((m) => Math.hypot(m.x - p.x, m.y - p.y) < m.r)) continue;
        fundo.push({ ...p, w: 0.007 + 0.006 * acaso(i, j, 14), h: 0.0065 });
      }
    }
  }
  const lapis = prog(t, bloco.de - 0.1, 0.6) * (1 - saindo(t, bloco.ate + 0.5, 0.4));
  // posições dos pinos na tela, para os rótulos se afastarem deles
  const pinosNaTela = roteiro.pinos.map((p) => naTela(p.lugar, v));
  // rótulo (centro x, linha de base y) coberto pelo postal ou pela faixa dos cartões
  const coberto = (x: number, y: number, largura: number) =>
    (x + largura / 2 > postal.x - 12 && x - largura / 2 < postal.x + postal.w + 12 && y > postal.y - 12 && y - 40 < postal.y + postal.h + 12) ||
    y > CARTOES.topo - 8;
  const afastar = (x: number, y: number, largura: number) => {
    let nx = x;
    for (const q of pinosNaTela) {
      const sobrepoe = Math.abs(q.x - nx) < largura / 2 + 46 && y > q.y - 120 && y - 34 < q.y + 10;
      if (sobrepoe) nx = q.x + (nx >= q.x ? 1 : -1) * (largura / 2 + 50);
    }
    return nx;
  };
  const nc = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const, vectorEffect: "non-scaling-stroke" as const };

  return (
    <svg width={W} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <rect x={0} y={0} width={W} height={1920} fill={cor.areia} />
      <g transform={transf}>
        {/* tecido da cidade: quarteirões soltos em todo o chão visível (o mapa nunca fica vazio) */}
        {fundo.map((q, i) => (
          <rect key={`f-${i}`} x={q.x} y={q.y} width={q.w} height={q.h} rx={0.0015} fill={cor.areiaFunda} opacity={0.55} />
        ))}
        {geo.ruas.map((r, i) => (
          <g key={`rua-${i}`}>
            <path d={caminho(r)} fill="none" stroke={cor.areiaTraco} strokeOpacity={0.55} strokeWidth={12} {...nc} />
            <path d={caminho(r)} fill="none" stroke={cor.papel} strokeWidth={8} {...nc} />
          </g>
        ))}
        {geo.parques.map((p, i) => (
          <g key={`parque-${i}`}>
            <path d={caminho(p.contorno, true)} fill="#E8DDBE" stroke={cor.areiaTraco} strokeWidth={1.8} strokeDasharray="2 7" {...nc} />
            {p.arvores.map((a, k) => (
              <circle key={k} cx={a.x} cy={a.y} r={0.0032} fill={cor.areiaTraco} opacity={0.75} />
            ))}
          </g>
        ))}
        {geo.morros.map((aneis, i) => (
          <g key={`morro-${i}`}>
            {aneis.map((a, k) => (
              <path
                key={k}
                d={caminho(a, true)}
                fill={k === 0 ? "rgba(214,192,150,0.22)" : k === 2 ? "rgba(214,192,150,0.25)" : "none"}
                stroke={cor.areiaTraco}
                strokeOpacity={0.8}
                strokeWidth={1.6}
                {...nc}
              />
            ))}
          </g>
        ))}
        {geo.quarteiroes.map((q, i) => (
          <rect
            key={`q-${i}`}
            x={q.x - q.w / 2}
            y={q.y - q.h / 2}
            width={q.w}
            height={q.h}
            rx={0.0018}
            transform={`rotate(${(q.giro * 180) / Math.PI} ${q.x} ${q.y})`}
            fill={q.tom > 0.78 ? "#EADDC4" : cor.areiaFunda}
          />
        ))}
        {geo.agua.length ? (
          <>
            <path d={caminho(geo.agua, true)} fill={cor.ceu} />
            {/* margens em linha dupla, como nos mapas antigos (a segunda linha fica na água) */}
            {geo.margens.map((mg, k) => {
              const passo = 0.006 * (k === 0 ? 1 : -1) * (mapa.agua?.lado === "norte" || mapa.agua?.lado === "oeste" ? -1 : 1);
              const horizontal = mapa.agua?.lado === "sul" || mapa.agua?.lado === "norte";
              return (
                <g key={`margem-${k}`}>
                  <path d={caminho(mg)} fill="none" stroke={cor.azulejo} strokeOpacity={0.55} strokeWidth={2.6} {...nc} />
                  <path
                    d={caminho(mg.map((p) => (horizontal ? { x: p.x, y: p.y + passo } : { x: p.x + passo, y: p.y })))}
                    fill="none"
                    stroke={cor.azulejo}
                    strokeOpacity={0.25}
                    strokeWidth={1.6}
                    {...nc}
                  />
                </g>
              );
            })}
            {ondas.map((o, i) => (
              <path
                key={`o-${i}`}
                d={`M${o.x - 0.008} ${o.y} q0.004 -0.004 0.008 0 t0.008 0`}
                fill="none"
                stroke={cor.azulejo}
                strokeOpacity={0.32}
                strokeWidth={2.2}
                {...nc}
              />
            ))}
          </>
        ) : null}
        {(mapa.pontes ?? []).map((p, i) => (
          <g key={`ponte-${i}`}>
            <path d={caminho([p.de, p.ate])} stroke={cor.papel} strokeWidth={12} {...nc} />
            <path d={caminho([p.de, p.ate])} stroke={cor.tinta} strokeOpacity={0.55} strokeWidth={2} strokeDasharray="14 6" {...nc} />
            {[0.3, 0.7].map((f) => (
              <circle key={f} cx={p.de.x + (p.ate.x - p.de.x) * f} cy={p.de.y + (p.ate.y - p.de.y) * f} r={0.004} fill={cor.azulejo} />
            ))}
          </g>
        ))}
      </g>

      {/* luz do dia: o mapa esquenta da manhã para o fim do dia */}
      <rect x={0} y={0} width={W} height={1920} fill="#F0A35C" opacity={0.15 * calor} style={{ mixBlendMode: "multiply" }} />

      {/* rótulos: tamanho fixo na tela */}
      {mapa.agua?.nome && mapa.agua.nomeEm && !coberto(naTela(mapa.agua.nomeEm, v).x, naTela(mapa.agua.nomeEm, v).y, mapa.agua.nome.length * 52 * 0.5) ? (
        <text
          {...naTela(mapa.agua.nomeEm, v)}
          textAnchor="middle"
          fontFamily={display}
          fontStyle="italic"
          fontWeight={500}
          fontSize={52}
          fill={cor.azulejo}
          fillOpacity={0.7}
          stroke={cor.ceu}
          strokeWidth={8}
          strokeOpacity={0.8}
          paintOrder="stroke"
        >
          {mapa.agua.nome}
        </text>
      ) : null}
      {(mapa.bairros ?? [])
        .filter((b) => b.nome)
        .map((b, i) => {
          const p = naTela(b, v);
          const nome = b.nome!.toUpperCase();
          const largura = nome.length * 36 * 0.84;
          const x = afastar(p.x, p.y + 12, largura);
          if (coberto(x, p.y + 12, largura)) return null;
          return (
            <text
              key={`b-${i}`}
              x={x}
              y={p.y + 12}
              textAnchor="middle"
              fontFamily={sans}
              fontWeight={600}
              fontSize={36}
              letterSpacing="0.18em"
              fill={cor.tinta}
              fillOpacity={0.64}
              stroke={cor.areia}
              strokeWidth={8}
              strokeOpacity={0.8}
              paintOrder="stroke"
            >
              {nome}
            </text>
          );
        })}

      {/* o roteiro inteiro, a lápis: o que ainda vai acontecer */}
      {roteiro.pernas.filter((p) => p.ate >= bloco.de - 1.2 && p.ate <= bloco.ate + 0.5 && (!p.universal || t >= p.de - 0.9)).map((p, i) => (
        <path
          key={`lapis-${i}`}
          d={caminhoTela(p.pontos.map((q) => naTela(q, v)))}
          fill="none"
          stroke={cor.lapis}
          strokeWidth={3.5}
          strokeDasharray="4 12"
          strokeLinecap="round"
          opacity={0.9 * lapis}
        />
      ))}

      {/* a rota passada a tinta: pontilhado de azulejo que cresce com a fala */}
      {roteiro.pernas.map((p, i) => {
        const u = progressoDaPerna(p, t);
        if (u <= 0.001) return null;
        const fim = pontoNaPerna(p, u);
        const total = p.acumulado[p.acumulado.length - 1];
        const ate = p.pontos.filter((_, k) => p.acumulado[k] <= u * total);
        const pts = [...ate, fim].map((q) => naTela(q, v));
        return (
          <g key={`tinta-${i}`} opacity={1 - saindo(t, bloco.ate + 0.6, 0.4)}>
            <path d={caminhoTela(pts)} fill="none" stroke={cor.papel} strokeOpacity={0.75} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" />
            <path d={caminhoTela(pts)} fill="none" stroke={cor.azulejo} strokeWidth={10} strokeDasharray="0.1 20" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}

      {/* pinos */}
      {roteiro.pinos.map((p) => {
        const q = naTela(p.lugar, v);
        const tinta = prog(t, p.lugar.em - 0.14, 0.42);
        const visitado = p.carimboEm !== undefined ? prog(t, p.carimboEm + 0.05, 0.35) : 0;
        const noBloco = p.lugar.em >= bloco.de - 0.5 && p.lugar.em <= bloco.ate + 0.5;
        return <Pino key={`pino-${p.parada}-${p.lugar.em}`} x={q.x} y={q.y} numero={p.numero} marca={p.marca} lapis={noBloco && (!p.universal || t >= (p.de ?? 0) - 0.6) ? lapis : 0} tinta={tinta} visitado={visitado} />;
      })}

      {/* chips das ligações curtas ("pertinho dali") */}
      {roteiro.pernas
        .filter((p) => p.tipo === "ligacao" && p.texto)
        .map((p, i) => {
          const meio = naTela(pontoNaPerna(p, 0.5), v);
          const a = prog(t, (p.textoEm ?? p.de) - 0.05, 0.4) * (1 - prog(t, p.textoAte ?? Infinity, 0.35));
          if (a <= 0) return null;
          const texto = p.texto!;
          const largura = texto.length * 40 * 0.5 + 52;
          // o chip fica logo abaixo da ponta do pino mais baixo (os pinos sobem a partir da ponta)
          const ini = naTela(p.pontos[0], v);
          const fimTela = naTela(p.pontos[p.pontos.length - 1], v);
          const x = Math.min(W - 40 - largura, Math.max(40, meio.x - largura / 2));
          const y = Math.max(ini.y, fimTela.y) + 22;
          return (
            <g key={`chip-${i}`} opacity={a} transform={`translate(${x} ${y + (1 - a) * 14})`}>
              <rect x={0} y={0} width={largura} height={66} rx={33} fill={cor.papel} stroke={cor.azulejo} strokeWidth={3} />
              <text x={largura / 2} y={46} textAnchor="middle" fontFamily={sans} fontWeight={600} fontSize={40} fill={cor.tinta}>
                {texto}
              </text>
            </g>
          );
        })}

      {/* quem viaja: o veículo (ou um ponto) na ponta da rota */}
      {roteiro.pernas
        .filter((p) => p.tipo === "trajeto")
        .map((p, i) => {
          const u = progressoDaPerna(p, t);
          const some = prog(t, p.ate - 0.05, 0.3);
          if (u <= 0.001 || some >= 1) return null;
          const q = naTela(pontoNaPerna(p, u), v);
          const aparece = prog(t, p.de, 0.3);
          // com embarque no meio do caminho, o veículo só aparece no ponto de embarque
          const usaIcone = p.transporte && p.transporte !== "a-pe" && (!p.embarque || t >= p.embarque.em - 0.15);
          const nome = p.transporte === "bonde" ? "bonde" : (p.transporte as Parameters<typeof Desenho>[0]["nome"]);
          return (
            <g key={`viajante-${i}`} opacity={aparece * (1 - some)}>
              {usaIcone ? (
                <g transform={`translate(${q.x} ${q.y})`}>
                  <circle r={58} fill={cor.papel} stroke={cor.azulejo} strokeWidth={4} />
                  <foreignObject x={-46} y={-36} width={92} height={70}>
                    <Desenho nome={nome} largura={92} traco={3.4} />
                  </foreignObject>
                </g>
              ) : (
                <g transform={`translate(${q.x} ${q.y})`}>
                  <circle r={17} fill={cor.azulejo} stroke={cor.papel} strokeWidth={6} />
                </g>
              )}
            </g>
          );
        })}
    </svg>
  );
};
