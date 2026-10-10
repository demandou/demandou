import { limitar, mistura, misturarCor, prog, ruido } from "../anim";
import { DURACAO_QUEDA, type EstadoDaCozinha, type Eventos, type Queda1 } from "../cena";
import type { Plano } from "../plano";
import { cor, tintas } from "../tema";

// A panela vista de cima, o pote e tudo o que acontece com eles. Desenho a traço cacau
// (5 px), cores chapadas e poucas; a chama é o único caramelo do vídeo.

const TRACO = 5;
const OFFSETS = [
  [0, 0],
  [0.24, -0.2],
  [-0.22, 0.2],
  [0.2, 0.24],
  [-0.24, -0.16],
  [0.04, -0.3],
];

// contorno orgânico (poça, massa): um círculo com borda que respira
const bolha = (cx: number, cy: number, r: number, semente: number, variacao = 0.06, n = 12, giro = 0) => {
  if (r <= 0.5) return "";
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + giro;
    const rr = r * (1 + (ruido(semente * 31 + i) - 0.5) * 2 * variacao);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  });
  const meio = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${meio(pts[n - 1], pts[0]).join(" ")}`;
  for (let i = 0; i < n; i++) {
    const m = meio(pts[i], pts[(i + 1) % n]);
    d += ` Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  return `${d} Z`;
};

const espiral = (cx: number, cy: number, r0: number, r1: number, voltas: number, giro: number) => {
  const n = 90;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = giro + u * voltas * Math.PI * 2;
    const r = mistura(r0, r1, u);
    d += `${i ? "L" : "M"}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)} `;
  }
  return d;
};

const arco = (cx: number, cy: number, r: number, a0: number, a1: number, n = 24) => {
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a = mistura(a0, a1, i / n);
    d += `${i ? "L" : "M"}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)} `;
  }
  return d;
};

// uma língua de chama apontando para fora da panela
const chama = (r: number, comp: number, larg: number) =>
  `M${r - 10} ${-larg} C${r + comp * 0.45} ${-larg * 1.25} ${r + comp * 0.92} ${-larg * 0.55} ${r + comp} 0 C${r + comp * 0.92} ${larg * 0.55} ${r + comp * 0.45} ${larg * 1.25} ${r - 10} ${larg} Z`;

const escurecer = (hex: string, p: number) => misturarCor(hex, cor.cacau, p);

// ---------- o que caiu na panela ----------

const Camadas: React.FC<{ quedas: Queda1[]; t: number; cx: number; cy: number; r: number; derrete: number; some: number }> = ({
  quedas,
  t,
  cx,
  cy,
  r,
  derrete,
  some,
}) => (
  <g opacity={1 - some}>
    {quedas.map((q, k) => {
      const pousa = q.em + DURACAO_QUEDA * 0.9;
      if (t < pousa) return null;
      const [ox, oy] = OFFSETS[k % OFFSETS.length];
      const x = cx + ox * r * (k === 0 ? 0 : 1);
      const y = cy + oy * r * (k === 0 ? 0 : 1);
      const tinta = tintas[q.tinta] ?? tintas.creme;
      const p = prog(t, pousa, 0.6);
      if (q.jeito === "despeja") {
        const rp = r * (k === 0 ? 0.62 : 0.34) * (0.25 + 0.75 * p);
        return <path key={k} d={bolha(x, y, rp, k + 3, 0.07)} fill={tinta} stroke={escurecer(tinta, 0.18)} strokeWidth={2.5} />;
      }
      if (q.jeito === "pedaco") {
        const lado = r * 0.27 * (1 - 0.55 * derrete) * mistura(1.35, 1, prog(t, pousa - 0.05, 0.22));
        const raio = mistura(lado * 0.18, lado * 0.5, derrete);
        return (
          <g key={k} opacity={1 - 0.6 * derrete}>
            <rect
              x={x - lado / 2}
              y={y - lado / 2}
              width={lado}
              height={lado}
              rx={raio}
              fill={tinta}
              stroke={escurecer(tinta, 0.35)}
              strokeWidth={3}
              transform={`rotate(${-12 + k * 9} ${x} ${y})`}
            />
          </g>
        );
      }
      // pó: pontinhos espalhados num círculo
      return (
        <g key={k}>
          {Array.from({ length: 46 }, (_, i) => {
            const a = ruido(k * 100 + i) * Math.PI * 2;
            const d = Math.sqrt(ruido(k * 200 + i)) * r * 0.33;
            const pi = prog(t, pousa + ruido(k * 300 + i) * 0.2, 0.25);
            return (
              <circle
                key={i}
                cx={x + Math.cos(a) * d}
                cy={y + Math.sin(a) * d}
                r={r * (0.018 + ruido(k * 400 + i) * 0.02) * (pi > 0 ? 1 : 0)}
                fill={tinta}
                opacity={pi}
              />
            );
          })}
        </g>
      );
    })}
  </g>
);

// ---------- o que está caindo (sai da base do cartão do ingrediente e cai na panela) ----------

export const Quedas: React.FC<{ ev: Eventos; t: number; c: EstadoDaCozinha }> = ({ ev, t, c }) => {
  const { cx, cy, r } = c.geo.panela;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {ev.quedas.map((q, k) => {
        const u = (t - q.em) / DURACAO_QUEDA;
        if (u < 0 || u > 1.8) return null;
        const [ox, oy] = OFFSETS[k % OFFSETS.length];
        const tx = cx + ox * r * (k === 0 ? 0 : 1);
        const ty = cy + oy * r * (k === 0 ? 0 : 1);
        const tinta = tintas[q.tinta] ?? tintas.creme;
        const contorno = escurecer(tinta, 0.3);
        if (q.jeito === "despeja") {
          // uma fita grossa e cremosa que escorre do cartão até o meio da panela
          const cabeca = limitar(u / 0.9);
          const cauda = prog(u, 0.95, 0.75);
          if (cabeca <= cauda) return null;
          const d = `M${q.origem.x} ${q.origem.y} C${q.origem.x} ${q.origem.y + 90} ${tx} ${ty - 160} ${tx} ${ty}`;
          const traco = (largura: number, corT: string) => (
            <path
              d={d}
              fill="none"
              stroke={corT}
              strokeWidth={largura}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={`${(cabeca - cauda).toFixed(3)} 2`}
              strokeDashoffset={-cauda}
            />
          );
          return (
            <g key={k}>
              {traco(30, contorno)}
              {traco(23, tinta)}
            </g>
          );
        }
        if (u > 1) return null;
        if (q.jeito === "pedaco") {
          const x = mistura(q.origem.x, tx, 1 - (1 - u) * (1 - u));
          const y = mistura(q.origem.y, ty, u * u);
          const lado = r * 0.27 * mistura(1.45, 1.3, u);
          return (
            <rect
              key={k}
              x={x - lado / 2}
              y={y - lado / 2}
              width={lado}
              height={lado}
              rx={lado * 0.18}
              fill={tinta}
              stroke={contorno}
              strokeWidth={3.5}
              opacity={Math.min(1, u * 8)}
              transform={`rotate(${-34 + 22 * u + k * 9} ${x} ${y})`}
            />
          );
        }
        // pó: uma cascata de pontinhos, cada um com seu atraso
        return (
          <g key={k}>
            {Array.from({ length: 26 }, (_, i) => {
              const atraso = ruido(k * 50 + i) * 0.45;
              const ui = limitar((u - atraso) / 0.6);
              if (ui <= 0 || ui >= 1) return null;
              const espalha = (ruido(k * 60 + i) - 0.5) * 70;
              const x = mistura(q.origem.x + espalha * 0.4, tx + espalha * 1.6, 1 - (1 - ui) * (1 - ui));
              const y = mistura(q.origem.y, ty + (ruido(k * 80 + i) - 0.5) * 60, ui * ui);
              return <circle key={i} cx={x} cy={y} r={5 + ruido(k * 70 + i) * 4} fill={tinta} />;
            })}
          </g>
        );
      })}
    </svg>
  );
};

// ---------- a panela, o pote e o calor ----------

export const Bancada: React.FC<{ plano: Plano; ev: Eventos; t: number; c: EstadoDaCozinha }> = ({ plano, ev, t, c }) => {
  const { cx, cy, r } = c.geo.panela;
  const tigela = plano.cozinha?.recipiente === "tigela";
  const massaCor = tintas[plano.cozinha?.massa ?? "massa"] ?? tintas.massa;
  const rFundo = r * (tigela ? 0.8 : 0.86);
  const anguloCabo = (c.geo.panela.cabo * Math.PI) / 180;
  const pote = c.geo.pote;

  // derrete o que é pedaço quando o fogo acende
  const tFogo = [...ev.acoes].find((a) => a.acao.startsWith("fogo"))?.em ?? null;
  const derrete = tFogo !== null ? prog(t, tFogo + 0.2, 1.6) : 0;
  const temQueda = ev.quedas.some((q) => t >= q.em + DURACAO_QUEDA * 0.9);

  // a massa: aparece com a mistura, engrossa com o "fundo", esvazia no pote
  const rMassa = r * 0.8 * (1 - 0.13 * c.fundo) * (1 - c.pote);
  const giro = c.angulo;
  const ro = r * 0.42;
  const px = cx + Math.cos(c.angulo) * ro;
  const py = cy + Math.sin(c.angulo) * ro;
  const dirCabo = ((-62 + 14 * Math.sin(c.angulo)) * Math.PI) / 180;
  const clipId = `fundo-${Math.round(cx)}-${Math.round(cy)}`;

  // chamas
  const nChamas = 16;
  const comp = r * (0.07 + 0.05 * c.fogo) * (c.fogo > 0 ? 1 : 0);
  // a trempe do fogão aparece junto com o primeiro fogo e fica até a panela ir para o pote
  const trempe = tFogo !== null ? prog(t, tFogo - 0.15, 0.3) * (1 - c.pote) * c.naFicha : 0;
  const chamas =
    c.fogo > 0.02
      ? Array.from({ length: nChamas }, (_, i) => {
          const a = (i / nChamas) * Math.PI * 2 + 0.1;
          // não desenha chama embaixo do cabo
          if (!tigela && Math.abs(Math.atan2(Math.sin(a - anguloCabo), Math.cos(a - anguloCabo))) < 0.22) return null;
          const tremor = 0.82 + 0.18 * Math.sin(t * 11 + i * 1.7) * Math.sin(t * 7.3 + i);
          const l = comp * tremor * Math.min(1, c.fogo);
          const graus = (a * 180) / Math.PI;
          return (
            <g key={i} transform={`translate(${cx} ${cy}) rotate(${graus.toFixed(2)})`}>
              <path d={chama(r, l, r * 0.085)} fill={cor.caramelo} />
              <path d={chama(r, l * 0.55, r * 0.045)} fill={cor.carameloClaro} />
            </g>
          );
        })
      : null;

  // o pote: enche quando a panela esvazia
  const enche = prog(t, (c.poteDesde ?? 0) + 0.42, 0.95);
  const nivel = Math.max(c.poteDesde !== null && t >= c.poteDesde ? enche * 0.74 : 0, c.geo.cheio * 0.74);
  const pw = pote.w;
  const ph = pote.h;
  const pl = pote.cx - pw / 2;
  const boca = pote.base - ph;
  const corpoTopo = pote.base - ph * 0.86;
  const corpoPote = `M${pl} ${corpoTopo + 18} Q${pl} ${corpoTopo} ${pl + 18} ${corpoTopo} L${pl + pw - 18} ${corpoTopo} Q${pl + pw} ${corpoTopo} ${pl + pw} ${corpoTopo + 18} L${pl + pw} ${pote.base - 26} Q${pl + pw} ${pote.base} ${pl + pw - 26} ${pote.base} L${pl + 26} ${pote.base} Q${pl} ${pote.base} ${pl} ${pote.base - 26} Z`;
  const alturaCheia = pote.base - corpoTopo - 8;
  const topoMassa = pote.base - nivel * alturaCheia / 0.74 * 0.74;

  // fio de massa da panela para o pote
  const tP = c.poteDesde;
  const fioEntra = tP !== null ? prog(t, tP + 0.22, 0.25) : 0;
  const fioSai = tP !== null ? prog(t, tP + 1.3, 0.3) : 0;
  const dirPote = Math.atan2(boca - cy, pote.cx - cx);
  const fio0 = { x: cx + Math.cos(dirPote) * r * 0.92, y: cy + Math.sin(dirPote) * r * 0.92 };
  const fio1 = { x: pote.cx, y: boca + 26 };
  const fioD = `M${fio0.x} ${fio0.y} Q${(fio0.x + fio1.x) / 2} ${Math.min(fio0.y, fio1.y) - 50} ${fio1.x} ${fio1.y}`;

  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={rFundo} />
        </clipPath>
        <clipPath id={`${clipId}-pote`}>
          <path d={corpoPote} />
        </clipPath>
      </defs>

      {/* ---- panela ---- */}
      <g opacity={c.geo.opPanela}>
        <circle cx={cx + 8} cy={cy + 16} r={r * 1.02} fill="rgba(46,30,26,0.14)" />
        {trempe > 0.01
          ? [45, 135, 225, 315].map((g) => (
              <g key={g} transform={`translate(${cx} ${cy}) rotate(${g})`} opacity={trempe}>
                <path d={`M${r * 0.9} 0 L${r * 1.24} 0`} stroke={cor.cacau} strokeWidth={r * 0.07} strokeLinecap="round" />
              </g>
            ))
          : null}
        {chamas}
        {tigela ? null : (
          <g transform={`translate(${cx} ${cy}) rotate(${(anguloCabo * 180) / Math.PI})`}>
            <rect x={r * 0.9} y={-Math.min(r * 0.09, 30)} width={r * c.geo.panela.caboComp} height={Math.min(r * 0.18, 60)} rx={Math.min(r * 0.09, 30)} fill={cor.cacau} />
            <path
              d={`M${r * 1.02} 0 L${r * (0.9 + c.geo.panela.caboComp) - 24} 0`}
              stroke="rgba(246,239,228,0.35)"
              strokeWidth={3}
              strokeLinecap="round"
            />
          </g>
        )}
        <circle cx={cx} cy={cy} r={r} fill={tigela ? cor.cremeFundo : cor.metal} stroke={cor.cacau} strokeWidth={TRACO} />
        <circle cx={cx} cy={cy} r={r * 0.92} fill={tigela ? "#E4D6C1" : cor.metalParede} />
        <circle cx={cx} cy={cy} r={rFundo} fill={cor.metalFundo} stroke="rgba(58,38,33,0.35)" strokeWidth={2.5} />
        <path d={arco(cx, cy, r * 0.96, Math.PI * 1.05, Math.PI * 1.45)} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={4} strokeLinecap="round" />

        <g clipPath={`url(#${clipId})`}>
          {temQueda ? <Camadas quedas={ev.quedas} t={t} cx={cx} cy={cy} r={r} derrete={derrete} some={c.mistura} /> : null}
          {c.mistura > 0 && rMassa > 1 ? (
            <g>
              <path d={bolha(cx, cy, rMassa, 77, 0.035, 14, giro * 0.15)} fill={massaCor} opacity={limitar(c.mistura * 1.3)} />
              {/* enquanto mistura, o creme ainda aparece em espiral; depois, só o brilho girando */}
              <g clipPath={undefined}>
                <path
                  d={espiral(cx, cy, r * 0.06, rMassa * 0.92, 2.3, giro)}
                  fill="none"
                  stroke={tintas.creme}
                  strokeWidth={r * 0.06}
                  strokeLinecap="round"
                  opacity={(1 - c.mistura) * 0.9}
                />
                <path
                  d={espiral(cx, cy, r * 0.08, rMassa * 0.86, 1.8, giro + 1.2)}
                  fill="none"
                  stroke="rgba(255,236,214,0.22)"
                  strokeWidth={r * 0.035}
                  strokeLinecap="round"
                  opacity={c.mistura}
                />
              </g>
            </g>
          ) : null}
          {/* o rastro da colher abre o fundo da panela */}
          {c.fundo > 0 && c.colher > 0 ? (
            <g opacity={c.colher}>
              {Array.from({ length: 16 }, (_, i) => {
                const span = Math.PI * 1.5 * c.fundo;
                const a1 = c.angulo - (span * i) / 16 + 0.02;
                const a0 = c.angulo - (span * (i + 1)) / 16;
                return (
                  <path
                    key={i}
                    d={arco(cx, cy, ro, a0, a1, 4)}
                    fill="none"
                    stroke={cor.metalFundo}
                    strokeWidth={r * 0.2 * (1 - i / 40)}
                    strokeLinecap="butt"
                    opacity={Math.pow(1 - i / 16, 1.3)}
                  />
                );
              })}
              <circle cx={cx + Math.cos(c.angulo) * ro} cy={cy + Math.sin(c.angulo) * ro} r={r * 0.1} fill={cor.metalFundo} />
            </g>
          ) : null}
        </g>

        {/* a espátula (pistache): circula enquanto mexe */}
        {c.colher > 0.01 ? (
          <g opacity={c.colher}>
            <path
              d={`M${px + Math.cos(dirCabo) * r * 0.12} ${py + Math.sin(dirCabo) * r * 0.12} L${px + Math.cos(dirCabo) * r * 0.98} ${py + Math.sin(dirCabo) * r * 0.98}`}
              stroke={cor.cacau}
              strokeWidth={r * 0.085}
              strokeLinecap="round"
            />
            <path
              d={`M${px + Math.cos(dirCabo) * r * 0.16} ${py + Math.sin(dirCabo) * r * 0.16} L${px + Math.cos(dirCabo) * r * 0.94} ${py + Math.sin(dirCabo) * r * 0.94}`}
              stroke={cor.pistache}
              strokeWidth={r * 0.085 - 9}
              strokeLinecap="round"
            />
            <rect
              x={px - r * 0.11}
              y={py - r * 0.16}
              width={r * 0.22}
              height={r * 0.32}
              rx={r * 0.08}
              fill={cor.pistache}
              stroke={cor.cacau}
              strokeWidth={4}
              transform={`rotate(${((dirCabo * 180) / Math.PI + 90).toFixed(2)} ${px} ${py})`}
            />
          </g>
        ) : null}
      </g>

      {/* ---- fio da panela para o pote ---- */}
      {fioEntra > fioSai ? (
        <path
          d={fioD}
          fill="none"
          stroke={massaCor}
          strokeWidth={22}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${(fioEntra - fioSai).toFixed(3)} 2`}
          strokeDashoffset={-fioSai}
        />
      ) : null}

      {/* ---- pote ---- */}
      {c.geo.opPote > 0.01 ? (
        <g opacity={c.geo.opPote}>
          <ellipse cx={pote.cx + 6} cy={pote.base + 4} rx={pw * 0.56} ry={12} fill="rgba(46,30,26,0.14)" />
          <path d={corpoPote} fill="#FBF7EE" />
          <g clipPath={`url(#${clipId}-pote)`}>
            {nivel > 0 ? (
              <>
                <rect x={pl} y={topoMassa} width={pw} height={pote.base - topoMassa + 2} fill={massaCor} />
                <ellipse cx={pote.cx} cy={topoMassa} rx={pw * 0.5} ry={10} fill={misturarCor(massaCor, "#C9A48C", 0.35)} />
              </>
            ) : null}
            <rect x={pl} y={pote.base - ph * 0.5} width={pw} height={ph * 0.2} fill={cor.pistacheClaro} />
            <path d={`M${pl} ${pote.base - ph * 0.5} L${pl + pw} ${pote.base - ph * 0.5} M${pl} ${pote.base - ph * 0.3} L${pl + pw} ${pote.base - ph * 0.3}`} stroke={cor.cacau} strokeWidth={3} />
          </g>
          <path d={corpoPote} fill="none" stroke={cor.cacau} strokeWidth={TRACO} strokeLinejoin="round" />
          <path d={`M${pl + 16} ${corpoTopo + 30} L${pl + 16} ${pote.base - ph * 0.56}`} stroke="rgba(255,255,255,0.8)" strokeWidth={5} strokeLinecap="round" />
          {/* a colher do "brigadeiro de colher": aparece com o pote pronto */}
          {c.geo.cheio > 0.01 ? (
            <g opacity={c.geo.cheio * Math.min(1, c.colherNoPote * 3)} transform={`translate(${(1 - c.colherNoPote) * 26} ${(1 - c.colherNoPote) * -70})`}>
              <path d={`M${pote.cx + pw * 0.05} ${boca + 30} L${pote.cx + pw * 0.38} ${boca - ph * 0.42}`} stroke={cor.cacau} strokeWidth={22} strokeLinecap="round" />
              <path d={`M${pote.cx + pw * 0.05} ${boca + 30} L${pote.cx + pw * 0.38} ${boca - ph * 0.42}`} stroke={cor.pistache} strokeWidth={13} strokeLinecap="round" />
            </g>
          ) : null}
          {/* gargalo e boca */}
          <rect x={pote.cx - pw * 0.4} y={boca} width={pw * 0.8} height={corpoTopo - boca + 4} rx={8} fill="#FBF7EE" stroke={cor.cacau} strokeWidth={TRACO} />

          {/* vapor: fios que sobem enquanto está quente */}
          {c.vapor > 0.01
            ? [-0.2, 0, 0.2].map((dx, i) => {
                const fase = (((t - (c.vaporDesde ?? 0)) * 0.75 + i * 0.33) % 1 + 1) % 1;
                const x0 = pote.cx + dx * pw;
                const d = `M${x0} ${boca - 16} C${x0 - 22} ${boca - 60} ${x0 + 22} ${boca - 104} ${x0} ${boca - 148} C${x0 - 22} ${boca - 186} ${x0 + 18} ${boca - 222} ${x0} ${boca - 250}`;
                const ini = Math.max(0, fase - 0.5);
                return (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={cor.cacau}
                    strokeWidth={10}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={`${(fase - ini).toFixed(3)} 2`}
                    strokeDashoffset={-ini}
                    opacity={c.vapor * 0.8 * (1 - prog(fase, 0.75, 0.25))}
                  />
                );
              })
            : null}

          {/* termômetro: sobe com "quente", desce com "esfriar" */}
          {c.termometro * (1 - c.geo.cheio) > 0.01 ? (
            <g opacity={c.termometro * (1 - c.geo.cheio)}>
              {(() => {
                const tx = pl - 58;
                const tb = pote.base - 34;
                const altura = 180;
                const nivelT = mistura(0.84, 0.22, c.esfriar);
                const corT = misturarCor(cor.caramelo, cor.pistache, c.esfriar);
                return (
                  <>
                    <rect x={tx - 14} y={tb - altura} width={28} height={altura} rx={14} fill="#FBF7EE" stroke={cor.cacau} strokeWidth={4} />
                    <rect x={tx - 6} y={tb - 8 - (altura - 22) * nivelT} width={12} height={(altura - 22) * nivelT + 10} rx={6} fill={corT} />
                    <circle cx={tx} cy={tb + 6} r={24} fill={corT} stroke={cor.cacau} strokeWidth={4} />
                  </>
                );
              })()}
            </g>
          ) : null}
        </g>
      ) : null}
    </svg>
  );
};
