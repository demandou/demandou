// Desenhos a traço da ficha: cacho de uva, lúpulo, grão de café, espiga, taça e ícones do fechamento.
// Todos se desenham com o tempo (p de 0 a 1) e passam de lápis a tinta (`tinta` de 0 a 1).
import { misturaCor, prog, tracado } from "../anim";
import type { Desenho } from "../plano";
import { cor, display } from "../tema";

const traco = (tinta: number) => misturaCor(cor.lapis, cor.tinta, tinta);
const comum = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, pathLength: 1 };

// Um traço que se desenha a partir de `de` (fração do progresso total) durante `dur`.
const Traco: React.FC<{ d: string; p: number; de: number; dur: number; tinta: number; largura?: number; tracejado?: boolean }> = ({
  d,
  p,
  de,
  dur,
  tinta,
  largura = 4,
  tracejado,
}) => {
  const q = Math.max(0, Math.min(1, (p - de) / dur));
  // antes de desenhar, o traço já está esboçado a lápis (tracejado claro)
  return (
    <g>
      <path d={d} {...comum} stroke={cor.lapis} strokeWidth={largura * 0.7} strokeDasharray={tracejado === false ? undefined : "0.012 0.018"} opacity={1 - q} />
      {q > 0 ? <path d={d} {...comum} stroke={traco(tinta)} strokeWidth={largura} {...tracado(q)} /> : null}
    </g>
  );
};

// ---------- cacho de uva (viewBox 0 0 320 300) ----------
const UVAS: { x: number; y: number }[] = (() => {
  const linhas = [
    { y: 112, n: 3 },
    { y: 148, n: 4 },
    { y: 184, n: 3 },
    { y: 220, n: 2 },
    { y: 256, n: 1 },
  ];
  return linhas.flatMap(({ y, n }) => Array.from({ length: n }, (_, j) => ({ x: 164 + (j - (n - 1) / 2) * 42, y })));
})();

const Cacho: React.FC<{ p: number; tinta: number; cheio: number }> = ({ p, tinta, cheio }) => (
  <g>
    <Traco d="M156 20 C 158 44 162 64 164 90" p={p} de={0} dur={0.18} tinta={tinta} largura={5} />
    <Traco
      d="M158 60 C 142 40 122 30 100 34 C 94 22 80 18 68 26 C 64 40 68 48 74 52 C 58 54 48 64 48 78 C 60 86 72 86 82 82 C 80 96 86 108 98 112 C 108 104 112 94 112 86 C 128 92 144 82 158 60 Z"
      p={p}
      de={0.1}
      dur={0.3}
      tinta={tinta}
    />
    <Traco d="M156 60 L 100 52 M 124 56 L 82 80 M 128 62 L 106 102" p={p} de={0.3} dur={0.15} tinta={tinta} largura={3} />
    <Traco d="M163 70 C 188 58 206 70 202 88 C 199 100 184 99 185 88 C 186 80 196 82 194 90" p={p} de={0.25} dur={0.2} tinta={tinta} largura={3.5} />
    {UVAS.map((u, i) => {
      const de = 0.36 + i * 0.045;
      const q = Math.max(0, Math.min(1, (p - de) / 0.12));
      const fill = misturaCor(cor.papel, cor.vinho, cheio * 0.9);
      return (
        <g key={i}>
          <circle cx={u.x} cy={u.y} r={20} fill={q > 0 ? fill : "none"} fillOpacity={q} stroke={cor.lapis} strokeWidth={2.6} strokeDasharray="4 6" opacity={1 - q} />
          {q > 0 ? (
            <>
              <circle cx={u.x} cy={u.y} r={20} {...comum} fill={fill} fillOpacity={q} stroke={traco(tinta)} strokeWidth={4} {...tracado(q)} />
              <path
                d={`M ${u.x - 10} ${u.y - 4} A 11 11 0 0 1 ${u.x - 3} ${u.y - 11}`}
                fill="none"
                stroke={misturaCor(cor.tinta, cor.papel, 0.25 + cheio * 0.6)}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={q}
              />
            </>
          ) : null}
        </g>
      );
    })}
  </g>
);

// ---------- lúpulo (viewBox 0 0 320 300) ----------
const Lupulo: React.FC<{ p: number; tinta: number; cheio: number }> = ({ p, tinta, cheio }) => {
  const escamas = [
    { y: 96, n: 2 },
    { y: 136, n: 3 },
    { y: 176, n: 3 },
    { y: 216, n: 2 },
    { y: 252, n: 1 },
  ].flatMap(({ y, n }) => Array.from({ length: n }, (_, j) => ({ x: 164 + (j - (n - 1) / 2) * 44, y })));
  return (
    <g>
      <Traco d="M164 18 C 166 40 166 56 164 72" p={p} de={0} dur={0.15} tinta={tinta} largura={5} />
      <Traco d="M166 44 C 196 26 230 30 246 50 C 222 64 192 62 166 44 Z" p={p} de={0.1} dur={0.25} tinta={tinta} />
      {escamas.map((e, i) => {
        const de = 0.3 + i * 0.06;
        const q = Math.max(0, Math.min(1, (p - de) / 0.14));
        return (
          <g key={i} opacity={Math.max(0.35, q)}>
            <path
              d={`M ${e.x - 26} ${e.y - 18} C ${e.x - 26} ${e.y + 14} ${e.x - 12} ${e.y + 30} ${e.x} ${e.y + 32} C ${e.x + 12} ${e.y + 30} ${e.x + 26} ${e.y + 14} ${e.x + 26} ${e.y - 18}`}
              {...comum}
              fill={misturaCor(cor.papel, "#8FA45A", cheio * 0.8)}
              fillOpacity={q}
              stroke={q > 0 ? traco(tinta) : cor.lapis}
              strokeWidth={4}
              {...(q > 0 ? tracado(q) : {})}
            />
          </g>
        );
      })}
    </g>
  );
};

// ---------- grãos de café (viewBox 0 0 320 300) ----------
const Grao: React.FC<{ p: number; tinta: number; cheio: number }> = ({ p, tinta, cheio }) => {
  const graos = [
    { x: 120, y: 120, a: -24 },
    { x: 206, y: 176, a: 18 },
  ];
  return (
    <g>
      {graos.map((g, i) => {
        const de = i * 0.35;
        const q = Math.max(0, Math.min(1, (p - de) / 0.35));
        return (
          <g key={i} transform={`rotate(${g.a} ${g.x} ${g.y})`}>
            <ellipse
              cx={g.x}
              cy={g.y}
              rx={62}
              ry={84}
              {...comum}
              fill={misturaCor(cor.papel, "#5A3A26", cheio * 0.85)}
              fillOpacity={q}
              stroke={q > 0 ? traco(tinta) : cor.lapis}
              strokeWidth={4.5}
              {...(q > 0 ? tracado(q) : { strokeDasharray: "0.012 0.018" })}
            />
            <Traco d={`M ${g.x} ${g.y - 74} C ${g.x - 26} ${g.y - 30} ${g.x + 26} ${g.y + 30} ${g.x} ${g.y + 74}`} p={p} de={de + 0.2} dur={0.2} tinta={tinta} largura={4} />
          </g>
        );
      })}
    </g>
  );
};

// ---------- espiga (cevada/trigo) (viewBox 0 0 320 300) ----------
const Espiga: React.FC<{ p: number; tinta: number; cheio: number }> = ({ p, tinta, cheio }) => {
  const graos = Array.from({ length: 6 }, (_, i) => ({ y: 70 + i * 32, lado: i % 2 === 0 ? -1 : 1 }));
  return (
    <g>
      <Traco d="M164 290 C 164 220 164 120 164 40" p={p} de={0} dur={0.2} tinta={tinta} largura={5} />
      {graos.flatMap((g, i) =>
        [-1, 1].map((lado) => {
          const de = 0.2 + i * 0.07;
          const q = Math.max(0, Math.min(1, (p - de) / 0.14));
          const cx = 164 + lado * 22;
          return (
            <g key={`${i}-${lado}`} transform={`rotate(${lado * 28} ${cx} ${g.y})`}>
              <ellipse
                cx={cx}
                cy={g.y}
                rx={14}
                ry={26}
                {...comum}
                fill={misturaCor(cor.papel, "#C9A04E", cheio * 0.8)}
                fillOpacity={q}
                stroke={q > 0 ? traco(tinta) : cor.lapis}
                strokeWidth={3.5}
                {...(q > 0 ? tracado(q) : { strokeDasharray: "0.02 0.03" })}
              />
              <Traco d={`M ${cx} ${g.y - 26} L ${cx + lado * 6} ${g.y - 70}`} p={p} de={de + 0.08} dur={0.12} tinta={tinta} largura={2.5} />
            </g>
          );
        }),
      )}
    </g>
  );
};

export const DesenhoDaVariedade: React.FC<{ desenho: Desenho; p: number; tinta: number; cheio: number; largura: number }> = ({
  desenho,
  p,
  tinta,
  cheio,
  largura,
}) => (
  <svg width={largura} height={(largura * 300) / 320} viewBox="0 0 320 300" style={{ overflow: "visible" }}>
    {desenho === "lupulo" ? (
      <Lupulo p={p} tinta={tinta} cheio={cheio} />
    ) : desenho === "grao" ? (
      <Grao p={p} tinta={tinta} cheio={cheio} />
    ) : desenho === "espiga" ? (
      <Espiga p={p} tinta={tinta} cheio={cheio} />
    ) : (
      <Cacho p={p} tinta={tinta} cheio={cheio} />
    )}
  </svg>
);

// Cachinho pequeno (marca da colheita na régua de anos)
export const CachoPequeno: React.FC<{ x: number; y: number; escala: number; opacidade: number }> = ({ x, y, escala, opacidade }) => (
  <g transform={`translate(${x} ${y}) scale(${escala})`} opacity={opacidade}>
    <path d="M0 -40 C 1 -32 2 -26 2 -20" stroke={cor.tinta} strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d="M2 -30 C 10 -40 22 -40 26 -32 C 18 -26 8 -26 2 -30 Z" fill={cor.papel} stroke={cor.tinta} strokeWidth={2.5} />
    {[
      [-12, -10],
      [0, -10],
      [12, -10],
      [-6, 2],
      [6, 2],
      [0, 14],
    ].map(([gx, gy], i) => (
      <circle key={i} cx={gx} cy={gy} r={7} fill={cor.vinho} stroke={cor.tinta} strokeWidth={2} />
    ))}
  </g>
);

// ---------- taça (viewBox 0 0 260 400) ----------
// `nivel`: 0 a 1 do bojo; `liquido`: cor; `p`: o desenho do contorno
const BOJO = "M 40 30 C 32 110 40 190 130 214 C 220 190 228 110 220 30";
export const Taca: React.FC<{ p: number; tinta: number; nivel: number; liquido: string; largura: number; onda: number; id?: string }> = ({
  p,
  tinta,
  nivel,
  liquido,
  largura,
  onda,
  id = "bojo-da-taca",
}) => {
  const topoDoBojo = 30;
  const fundo = 214;
  const yNivel = fundo - (fundo - topoDoBojo) * nivel;
  const q = (de: number, dur: number) => Math.max(0, Math.min(1, (p - de) / dur));
  return (
    <svg width={largura} height={(largura * 400) / 260} viewBox="0 0 260 400" style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={id}>
          <path d={`${BOJO} Z`} />
        </clipPath>
      </defs>
      {nivel > 0.001 ? (
        <g clipPath={`url(#${id})`}>
          <path
            d={`M 20 ${yNivel} C 80 ${yNivel - 8 * onda} 180 ${yNivel + 8 * onda} 240 ${yNivel} L 240 240 L 20 240 Z`}
            fill={liquido}
          />
          {/* reflexo do vidro por cima do líquido */}
          <path d="M 62 60 C 58 110 66 150 92 176" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={6} strokeLinecap="round" />
        </g>
      ) : null}
      <Traco d={BOJO} p={q(0, 0.5)} de={0} dur={1} tinta={tinta} largura={5} />
      <Traco d="M 40 30 L 220 30" p={q(0.3, 0.2)} de={0} dur={1} tinta={tinta} largura={3} />
      <Traco d="M 130 214 L 130 340" p={q(0.45, 0.25)} de={0} dur={1} tinta={tinta} largura={5} />
      <Traco d="M 64 352 C 90 338 170 338 196 352 C 170 362 90 362 64 352 Z" p={q(0.65, 0.35)} de={0} dur={1} tinta={tinta} largura={5} />
    </svg>
  );
};

// ---------- ícones do fechamento ----------
export const IconeFechamento: React.FC<{ icone: "salvar" | "seguir" | "comentar" | "link"; p: number; t: number; em: number }> = ({ icone, p, t, em }) => {
  if (icone === "link") {
    // etiqueta de pendurar (tag) com a seta: o "saiba mais" do rótulo
    const seta = prog(t, em + 0.45, 0.4);
    return (
      <svg width={160} height={170} viewBox="0 0 160 170" style={{ overflow: "visible" }}>
        <path d="M 80 0 C 80 18 74 26 70 34" {...comum} stroke={cor.tinta} strokeWidth={3} {...tracado(Math.min(1, p * 2))} />
        <path d="M 40 52 L 80 30 L 120 52 L 120 160 L 40 160 Z" {...comum} fill={p > 0.6 ? cor.papel : "none"} stroke={cor.vinho} strokeWidth={6} {...tracado(p)} />
        <circle cx={80} cy={54} r={8} fill="none" stroke={cor.vinho} strokeWidth={4} opacity={p} />
        <path d="M 56 112 L 104 112 M 88 94 L 106 112 L 88 130" {...comum} stroke={cor.vinho} strokeWidth={7} {...tracado(seta)} />
      </svg>
    );
  }
  if (icone === "salvar") {
    // fita marcadora que desce da borda da ficha
    const h = 40 + 150 * p;
    return (
      <svg width={120} height={220} viewBox="0 0 120 220" style={{ overflow: "visible" }}>
        <path d={`M 20 0 L 100 0 L 100 ${h} L 60 ${h - 34} L 20 ${h} Z`} fill={cor.vinho} />
        <path d={`M 32 0 L 32 ${h - 12}`} stroke="rgba(244,238,227,0.35)" strokeWidth={3} />
      </svg>
    );
  }
  if (icone === "seguir") {
    const v = prog(t, em + 0.5, 0.35);
    return (
      <svg width={150} height={150} viewBox="0 0 150 150">
        <circle cx={75} cy={75} r={62} {...comum} stroke={cor.vinho} strokeWidth={6} {...tracado(p)} />
        <path d="M 75 45 L 75 105 M 45 75 L 105 75" stroke={cor.vinho} strokeWidth={7} strokeLinecap="round" opacity={1 - v} />
        <path d="M 48 78 L 68 98 L 104 56" {...comum} stroke={cor.vinho} strokeWidth={8} {...tracado(v)} />
      </svg>
    );
  }
  return (
    <svg width={160} height={150} viewBox="0 0 160 150">
      <path d="M 20 20 L 140 20 L 140 100 L 70 100 L 40 130 L 44 100 L 20 100 Z" {...comum} stroke={cor.vinho} strokeWidth={6} {...tracado(p)} />
      {[52, 80, 108].map((x, i) => (
        <circle key={x} cx={x} cy={60} r={7} fill={cor.vinho} opacity={prog(t, em + 0.4 + i * 0.12, 0.2)} />
      ))}
    </svg>
  );
};

// ---------- o brinde do fechamento: duas taças se encontram na última palavra ----------
// `p` vai de 0 (paradas, afastadas) a 1 (de volta ao lugar, depois do toque); o toque é em p = 0,4.
export const Brinde: React.FC<{ p: number; tinta: number; nivel: number; liquido: string; largura: number }> = ({ p, tinta, nivel, liquido, largura }) => {
  // aproxima e inclina até o toque, depois volta devagar a uma inclinação leve
  const ida = Math.min(1, p / 0.4);
  const volta = Math.max(0, (p - 0.4) / 0.6);
  const suaveIda = 1 - (1 - ida) * (1 - ida) * (1 - ida);
  const suaveVolta = 1 - (1 - volta) * (1 - volta);
  const inclina = 17 * suaveIda - 11 * suaveVolta;
  const chega = 30 * suaveIda - 18 * suaveVolta;
  const brilho = p > 0.36 && p < 0.75 ? 1 - Math.abs((p - 0.42) / 0.33) : 0;
  const alt = (largura * 400) / 260;
  const W = largura * 2 + 40;
  return (
    <div style={{ position: "relative", width: W, height: alt + 30 }}>
      <div style={{ position: "absolute", left: chega, top: 30, transformOrigin: `${largura * 0.5}px ${alt * 0.88}px`, rotate: `${inclina}deg` }}>
        <Taca p={1} tinta={tinta} nivel={nivel} liquido={liquido} largura={largura} onda={0} id="brinde-a" />
      </div>
      <div style={{ position: "absolute", left: largura + 40 - chega, top: 30, transformOrigin: `${largura * 0.5}px ${alt * 0.88}px`, rotate: `${-inclina}deg` }}>
        <Taca p={1} tinta={tinta} nivel={nivel} liquido={liquido} largura={largura} onda={0} id="brinde-b" />
      </div>
      {brilho > 0 ? (
        <svg width={W} height={60} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {[-50, -90, -130].map((g) => {
            const a = (g * Math.PI) / 180;
            const cx = W / 2;
            const cy = 40;
            return (
              <line
                key={g}
                x1={cx + Math.cos(a) * 14}
                y1={cy + Math.sin(a) * 14}
                x2={cx + Math.cos(a) * (14 + 22 * brilho)}
                y2={cy + Math.sin(a) * (14 + 22 * brilho)}
                stroke={cor.vinho}
                strokeWidth={4}
                strokeLinecap="round"
                opacity={brilho}
              />
            );
          })}
        </svg>
      ) : null}
    </div>
  );
};

// ---------- o lacre: o selo de cera que carimba o rótulo no fechamento ----------
// `p` 0→1: o carimbo desce e assenta; antes dele, o contorno a lápis já está lá.
export const Lacre: React.FC<{ p: number; tinta: number; iniciais: string; tamanho: number }> = ({ p, tinta, iniciais, tamanho }) => {
  const R = 78;
  // borda de cera: ondulada e um pouco irregular
  const pontos = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    const r = R * (1 + 0.045 * Math.sin(a * 13) + 0.02 * Math.sin(a * 5 + 1.3));
    return `${i ? "L" : "M"} ${(100 + Math.cos(a) * r).toFixed(1)} ${(100 + Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");
  const escala = 1 + 0.22 * (1 - p);
  const letra = iniciais || "✓";
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
      {/* a lápis: o lugar do selo */}
      <circle cx={100} cy={100} r={R} fill="none" stroke={misturaCor(cor.lapis, cor.tintaSuave, tinta * 0.5)} strokeWidth={3} strokeDasharray="5 8" opacity={1 - p} />
      <text x={100} y={122} textAnchor="middle" fontFamily={display} fontSize={64} fill={cor.lapis} opacity={1 - p}>
        {letra}
      </text>
      {p > 0 ? (
        <g transform={`translate(100 100) scale(${escala}) translate(-100 -100)`} opacity={Math.min(1, p * 1.6)}>
          <path d={`${pontos} Z`} fill={cor.vinho} />
          <circle cx={100} cy={100} r={R - 16} fill="none" stroke="rgba(244,238,227,0.55)" strokeWidth={2.5} />
          <circle cx={100} cy={100} r={R - 24} fill="none" stroke="rgba(244,238,227,0.3)" strokeWidth={1.5} />
          <text x={100} y={122} textAnchor="middle" fontFamily={display} fontSize={64} fill={cor.papel}>
            {letra}
          </text>
        </g>
      ) : null}
    </svg>
  );
};

// ---------- o mostrador: meia-lua com marcas e um ponteiro (qualquer escala) ----------
// `nivel` 0→1 leva o ponteiro da esquerda para a direita; `tinta` passa o desenho de lápis a tinta.
export const Mostrador: React.FC<{ largura: number; tinta: number; nivel: number }> = ({ largura, tinta, nivel }) => {
  const cx = 130;
  const cy = 138;
  const R = 112;
  const ang = (v: number) => Math.PI + v * Math.PI;
  const ponto = (v: number, r: number) => ({ x: cx + Math.cos(ang(v)) * r, y: cy + Math.sin(ang(v)) * r });
  const arco = (v0: number, v1: number, r: number) => {
    const a = ponto(v0, r);
    const b = ponto(v1, r);
    return `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`;
  };
  const traco = misturaCor(cor.lapis, cor.tinta, tinta);
  const ponta = ponto(nivel, R - 22);
  return (
    <svg width={largura} height={(largura * 170) / 260} viewBox="0 0 260 170" style={{ overflow: "visible" }}>
      <path d={arco(0, 1, R)} fill="none" stroke={traco} strokeWidth={4} strokeDasharray={tinta > 0.5 ? undefined : "6 8"} />
      {nivel > 0.005 ? <path d={arco(0, Math.min(1, nivel), R - 12)} fill="none" stroke={cor.vinho} strokeWidth={12} /> : null}
      {Array.from({ length: 11 }, (_, i) => {
        const v = i / 10;
        const a = ponto(v, R + 4);
        const b = ponto(v, R + (i % 5 === 0 ? 24 : 15));
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={traco} strokeWidth={i % 5 === 0 ? 4 : 2.5} strokeLinecap="round" />;
      })}
      <line x1={cx} y1={cy} x2={ponta.x} y2={ponta.y} stroke={misturaCor(cor.lapis, cor.tinta, tinta)} strokeWidth={5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={11} fill={misturaCor(cor.lapis, cor.vinho, tinta)} />
      <line x1={cx - R - 10} x2={cx + R + 10} y1={cy + 18} y2={cy + 18} stroke={traco} strokeWidth={3} />
    </svg>
  );
};
