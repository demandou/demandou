// O rótulo impresso: papel, filetes, moldura do camafeu e os campos da ficha técnica fictícia.
// É desenhado duas vezes: atrás da pessoa (o rótulo de verdade) e ampliado dentro da lupa.
import { type Bloco, layoutDoRotulo, rotuloLivre } from "../layout";
import type { Medidor } from "../medida";
import type { Plano } from "../plano";
import { CAMAFEU, CARTUCHO, caixaAlta, cor, LINHA, numerosAlinhados, PAPEL, TAM, texto } from "../tema";

// Retângulo com os cantos recortados para dentro (o formato clássico de etiqueta)
export const contornoConcavo = (x: number, y: number, w: number, h: number, c: number) =>
  [
    `M ${x + c} ${y}`,
    `L ${x + w - c} ${y}`,
    `A ${c} ${c} 0 0 0 ${x + w} ${y + c}`,
    `L ${x + w} ${y + h - c}`,
    `A ${c} ${c} 0 0 0 ${x + w - c} ${y + h}`,
    `L ${x + c} ${y + h}`,
    `A ${c} ${c} 0 0 0 ${x} ${y + h - c}`,
    `L ${x} ${y + c}`,
    `A ${c} ${c} 0 0 0 ${x + c} ${y}`,
    "Z",
  ].join(" ");

const Centro: React.FC<{ x: number; y: number; children: React.ReactNode; estilo?: React.CSSProperties }> = ({ x, y, children, estilo }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      translate: "-50% -50%",
      whiteSpace: "nowrap",
      lineHeight: 1,
      display: "flex",
      alignItems: "baseline",
      ...estilo,
    }}
  >
    {children}
  </div>
);

const Losango: React.FC<{ x: number; y: number; r: number; fill: string }> = ({ x, y, r, fill }) => (
  <path d={`M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z`} fill={fill} />
);

const TOM = { tinta: cor.tinta, suave: cor.tintaSuave, vinho: cor.vinho };

// Um bloco impresso (linhas empilhadas, centradas)
const BlocoImpresso: React.FC<{ b: Bloco }> = ({ b }) => (
  <>
    {b.linhas.map((l, i) => (
      <Centro
        key={i}
        x={b.x}
        y={b.y + l.dy}
        estilo={{
          fontFamily: `"${l.fonte.familia}"`,
          fontSize: l.fonte.tamanho,
          fontStyle: l.fonte.italico ? "italic" : "normal",
          letterSpacing: `${l.fonte.espaco ?? 0}em`,
          textTransform: l.fonte.caixaAlta ? "uppercase" : "none",
          color: TOM[l.tom],
          ...numerosAlinhados,
        }}
      >
        {l.texto}
      </Centro>
    ))}
  </>
);

// filete curto duplo sob um cartucho
const Filete: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <line x1={x - 58} x2={x + 58} y1={y} y2={y} stroke={cor.tinta} strokeWidth={2.5} />
    <line x1={x - 36} x2={x + 36} y1={y + 8} y2={y + 8} stroke={cor.vinho} strokeWidth={2} />
  </g>
);

// Vaga sem campo: um ornamento de filetes e losangos, para o rótulo nunca parecer incompleto
const Ornamento: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <line x1={x - 70} x2={x - 22} y1={y} y2={y} stroke={cor.tinta} strokeWidth={2.5} />
    <line x1={x + 22} x2={x + 70} y1={y} y2={y} stroke={cor.tinta} strokeWidth={2.5} />
    <Losango x={x} y={y} r={11} fill={cor.vinho} />
    <Losango x={x - 84} y={y} r={5} fill={cor.tinta} />
    <Losango x={x + 84} y={y} r={5} fill={cor.tinta} />
    <line x1={x - 40} x2={x + 40} y1={y + 22} y2={y + 22} stroke={cor.vinho} strokeWidth={2} />
    <line x1={x - 40} x2={x + 40} y1={y - 22} y2={y - 22} stroke={cor.vinho} strokeWidth={2} />
  </g>
);

export const ImpressaoDoRotulo: React.FC<{ plano: Plano; medir: Medidor; papel?: boolean }> = ({ plano, medir, papel = true }) => {
  const r = plano.rotulo;
  const L = layoutDoRotulo(r, medir);
  const { x, y, w, h, canto } = PAPEL;
  const { cx, cy, rx, ry } = CAMAFEU;
  const marca = [plano.marca.nome, plano.marca.area].filter(Boolean).join(" · ");
  const vagas = [L.c1, L.c2, L.c3, L.c4];
  const lugares = [
    { x: CARTUCHO.esqX, y: CARTUCHO.cimaY },
    { x: CARTUCHO.dirX, y: CARTUCHO.cimaY },
    { x: CARTUCHO.esqX, y: CARTUCHO.baixoY },
    { x: CARTUCHO.dirX, y: CARTUCHO.baixoY },
  ];
  // a linha do pé, acima da marca: "Engarrafado por" no rótulo de bebida; "Uma leitura de" nos outros
  const pe = r.pe ?? (rotuloLivre(r) ? "Uma leitura de" : "Engarrafado por");
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {papel ? <path d={contornoConcavo(x, y, w, h, canto)} fill={cor.papel} /> : null}
        {/* filetes da borda */}
        <path d={contornoConcavo(x + 18, y + 18, w - 36, h - 36, canto)} fill="none" stroke={cor.tinta} strokeWidth={3.5} />
        <path d={contornoConcavo(x + 30, y + 30, w - 60, h - 60, canto - 4)} fill="none" stroke={cor.vinho} strokeWidth={2} />
        {/* moldura do camafeu */}
        <ellipse cx={cx} cy={cy} rx={rx + 12} ry={ry + 12} fill="none" stroke={cor.tinta} strokeWidth={4} />
        <ellipse cx={cx} cy={cy} rx={rx + 24} ry={ry + 24} fill="none" stroke={cor.vinho} strokeWidth={2.2} />
        <Losango x={cx} y={cy - ry - 24} r={10} fill={cor.vinho} />
        <Losango x={cx} y={cy + ry + 24} r={10} fill={cor.vinho} />
        <Losango x={cx - rx - 24} y={cy} r={8} fill={cor.tinta} />
        <Losango x={cx + rx + 24} y={cy} r={8} fill={cor.tinta} />
        {/* filetes dos cartuchos; vaga vazia vira ornamento */}
        {vagas.map((b, i) => (b ? <Filete key={i} x={b.x} y={b.y + b.meia + 20} /> : <Ornamento key={i} x={lugares[i].x} y={lugares[i].y} />))}
        {/* filete com losango entre o nome e a linha larga */}
        <line x1={250} x2={512} y1={LINHA.regra} y2={LINHA.regra} stroke={cor.tinta} strokeWidth={2.5} />
        <line x1={568} x2={830} y1={LINHA.regra} y2={LINHA.regra} stroke={cor.tinta} strokeWidth={2.5} />
        <Losango x={540} y={LINHA.regra} r={9} fill={cor.vinho} />
        {L.linha ? null : <Ornamento x={540} y={LINHA.origem} />}
        {/* letras miúdas do pé (ficam sob a interface do app; só enfeitam) */}
        <line x1={160} x2={920} y1={1604} y2={1604} stroke={cor.tinta} strokeWidth={2} />
        <line x1={160} x2={920} y1={1786} y2={1786} stroke={cor.tinta} strokeWidth={2} />
      </svg>

      {[...vagas, L.nome, L.linha].map((b, i) => (b ? <BlocoImpresso key={i} b={b} /> : null))}

      <Centro x={540} y={1646} estilo={{ ...caixaAlta(TAM.rotuloMiudo, 0.2), color: cor.tintaSuave }}>
        {pe}
      </Centro>
      <Centro x={540} y={1700} estilo={{ fontFamily: texto, fontStyle: "italic", fontSize: 44, color: cor.tinta }}>
        {marca || r.nome}
      </Centro>
      {r.volume ? (
        <Centro x={540} y={1754} estilo={{ ...caixaAlta(TAM.rotuloMiudo, 0.2), color: cor.tintaSuave }}>
          {r.volume}
        </Centro>
      ) : null}
    </div>
  );
};
