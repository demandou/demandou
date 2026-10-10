import { Easing } from "remotion";
import { limitar, prog, saindo, Traco } from "../anim";
import type { Areas } from "../layout";
import { encaixar, larguraTexto, numeroBR } from "../medida";
import type { Grafico as GraficoT, Layout, Palavra } from "../plano";
import { caber, cor, sans } from "../tema";
import { Cabecalho } from "./Cabecalho";
import { arco, Ilustrativo } from "./Dial";

// Gráfico como um traçado de exame: papel milimetrado azul-claro, eixo cinza e o traço azul que se
// desenha na fala. Linha: cada ponto entra na palavra do número, com o valor como rótulo de atlas.
// Barras: cada barra cresce na sua palavra. Pizza: um anel (como o aro da lupa) que se divide parte
// a parte, com a legenda embaixo. Sem números ditos: a curva da tendência (sobe, cai, oscila), uma
// lupa de detalhe no ponto final e a etiqueta "ilustrativo".
export const Grafico: React.FC<{ m: GraficoT; t: number; fim: number; areas: Areas; layout: Layout; palavras: Palavra[] }> = ({
  m,
  t,
  fim,
  areas,
  layout,
  palavras,
}) => {
  const sai = saindo(t, fim, 0.3);
  if (sai >= 1) return null;
  const dados = (m.dados ?? []).slice(0, 6);
  const temDados = dados.length >= 2;
  const temTitulo = !!m.titulo;
  // sem título, embaixo da lupa grande o traçado ocupa também o lugar do cabeçalho
  const area =
    !temTitulo && layout === "topo"
      ? { ...areas.corpo, y: areas.cabecalho.y, h: areas.corpo.y + areas.corpo.h - areas.cabecalho.y }
      : areas.corpo;
  const ilustrativo = m.ilustrativo || !temDados;

  return (
    <>
      {temTitulo ? (
        <Cabecalho
          area={areas.cabecalho}
          numero={m.numero}
          titulo={m.titulo as string}
          palavras={palavras}
          de={m.de}
          ate={m.ate}
          t={t}
          fim={fim}
          alinhar={layout === "topo" ? "centro" : "esquerda"}
          maxLinhas={layout === "topo" ? 2 : 3}
        />
      ) : null}
      {m.forma === "pizza" && temDados ? (
        <Pizza m={m} t={t} sai={sai} area={area} />
      ) : (
        <Papel m={m} t={t} sai={sai} area={area} temDados={temDados} />
      )}
      {ilustrativo ? <Ilustrativo x={area.x + area.w - 10} y={area.y + 4} p={prog(t, m.de + 0.2, 0.4) * (1 - sai)} alinhar="direita" /> : null}
    </>
  );
};

type Regiao = { x: number; y: number; w: number; h: number };

// curva da tendência sem números (0–1 em x e em y, y para cima)
const curva = (tendencia: "sobe" | "cai" | "oscila", x: number) => {
  if (tendencia === "sobe") return 0.12 + 0.72 * Math.pow(x, 1.6) + 0.05 * Math.sin(x * Math.PI * 5);
  if (tendencia === "cai") return 0.86 - 0.7 * Math.pow(x, 1.4) + 0.05 * Math.sin(x * Math.PI * 5);
  return 0.5 + 0.28 * Math.sin(x * Math.PI * 3.2) * (0.75 + 0.25 * x);
};

const Papel: React.FC<{ m: GraficoT; t: number; sai: number; area: Regiao; temDados: boolean }> = ({ m, t, sai, area, temDados }) => {
  const dados = (m.dados ?? []).slice(0, 6);
  const n = dados.length;
  const barras = m.forma === "barras" && temDados;
  const unidade = m.unidade ? ` ${m.unidade}` : "";
  // área do traçado: espaço em cima para a etiqueta e os valores, embaixo para os rótulos
  const rotuloTam = temDados ? Math.min(...dados.map((d) => caber(d.rotulo, area.w / n - 16, 40, 30, 600))) : 0;
  const plot = { x: area.x + 14, y: area.y + 120, w: area.w - 28, h: area.h - 120 - (temDados ? rotuloTam * 2.4 + 30 : 40) };
  const grade = prog(t, m.de, 0.35);
  const moldura = prog(t, m.de - 0.02, 0.25);
  const passo = 44;
  const linhasV = Math.floor(plot.w / passo);
  const linhasH = Math.floor(plot.h / passo);
  const base = plot.y + plot.h;

  // valores → altura (o maior valor ocupa 82% da altura; base no zero)
  const maior = Math.max(1e-9, ...dados.map((d) => d.valor));
  const menor = Math.min(0, ...dados.map((d) => d.valor));
  const yDe = (v: number) => base - ((v - menor) / (maior - menor)) * plot.h * 0.82;
  const xDe = (i: number) => (barras ? plot.x + (plot.w / n) * (i + 0.5) : plot.x + 40 + ((plot.w - 80) * i) / Math.max(1, n - 1));
  const valorTam = temDados ? Math.min(52, ...dados.map((d) => caber(`${numeroBR(d.valor, Number.isInteger(d.valor) ? 0 : 1)}${unidade}`, (plot.w / n) * 0.96, 52, 32, 700))) : 0;

  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - sai }}>
      <defs>
        <clipPath id={`grade-${Math.round(m.de * 100)}`}>
          <rect x={plot.x} y={plot.y} width={plot.w * grade} height={plot.h} />
        </clipPath>
      </defs>
      {/* papel milimetrado de exame */}
      <g clipPath={`url(#grade-${Math.round(m.de * 100)})`}>
        <rect x={plot.x} y={plot.y} width={plot.w} height={plot.h} fill={cor.branco} />
        {Array.from({ length: linhasV + 1 }, (_, i) => (
          <line key={`v${i}`} x1={plot.x + i * passo} y1={plot.y} x2={plot.x + i * passo} y2={base} stroke={cor.azul} strokeOpacity={i % 5 === 0 ? 0.14 : 0.06} strokeWidth={i % 5 === 0 ? 2 : 1.5} />
        ))}
        {Array.from({ length: linhasH + 1 }, (_, i) => (
          <line key={`h${i}`} x1={plot.x} y1={base - i * passo} x2={plot.x + plot.w} y2={base - i * passo} stroke={cor.azul} strokeOpacity={i % 5 === 0 ? 0.14 : 0.06} strokeWidth={i % 5 === 0 ? 2 : 1.5} />
        ))}
      </g>
      {/* a folha do exame: moldura fina que aparece já na troca, antes do traçado */}
      <rect x={plot.x} y={plot.y} width={plot.w} height={plot.h} rx={6} fill="none" stroke={cor.cinzaClaro} strokeWidth={3} opacity={moldura} />
      <Traco d={`M ${plot.x} ${base} L ${plot.x + plot.w} ${base}`} p={grade} cor={cor.cinzaLinha} largura={4} />

      {!temDados ? <Tendencia m={m} t={t} plot={plot} /> : null}

      {temDados && barras
        ? dados.map((d, i) => {
            const cresce = prog(t, d.em - 0.05, 0.6, Easing.bezier(0.2, 0.7, 0.3, 1));
            const lw = Math.min(150, (plot.w / n) * 0.56);
            const topo = base - (base - yDe(d.valor)) * cresce;
            const x = xDe(i) - lw / 2;
            const lugar = prog(t, m.de + 0.2 + i * 0.08, 0.4);
            return (
              <g key={i}>
                {/* a lápis: o lugar da barra */}
                <rect x={x} y={base - 70} width={lw} height={70} rx={10} fill="none" stroke={cor.cinzaLinha} strokeWidth={3} strokeDasharray="3 10" opacity={lugar * (1 - limitar(cresce * 3))} />
                {cresce > 0 ? (
                  <path
                    d={`M ${x} ${base} L ${x} ${topo + 14} Q ${x} ${topo} ${x + 14} ${topo} L ${x + lw - 14} ${topo} Q ${x + lw} ${topo} ${x + lw} ${topo + 14} L ${x + lw} ${base}`}
                    fill={cor.azulClaro}
                    stroke={cor.azul}
                    strokeWidth={4.5}
                  />
                ) : null}
                <text x={xDe(i)} y={topo - 26} textAnchor="middle" opacity={prog(t, d.em + 0.3, 0.3)} style={{ fontFamily: sans, fontWeight: 700, fontSize: valorTam, fill: cor.tinta, fontVariantNumeric: "tabular-nums" }}>
                  {`${numeroBR(d.valor * Math.min(1, cresce * 1.05), Number.isInteger(d.valor) ? 0 : 1)}${unidade}`}
                </text>
                <text x={xDe(i)} y={base + rotuloTam * 1.3} textAnchor="middle" opacity={prog(t, d.em, 0.3)} style={{ fontFamily: sans, fontWeight: 600, fontSize: rotuloTam, fill: cor.cinza }}>
                  {d.rotulo}
                </text>
              </g>
            );
          })
        : null}

      {temDados && !barras ? (
        <g>
          {dados.map((d, i) => {
            if (i === 0) return null;
            const a = { x: xDe(i - 1), y: yDe(dados[i - 1].valor) };
            const b = { x: xDe(i), y: yDe(d.valor) };
            return <Traco key={`s${i}`} d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} p={prog(t, d.em - 0.35, 0.5)} cor={cor.azul} largura={6} />;
          })}
          {dados.map((d, i) => {
            const p = prog(t, d.em - 0.05, 0.3);
            const x = xDe(i);
            const y = yDe(d.valor);
            const lugar = prog(t, m.de + 0.2 + i * 0.08, 0.4);
            const valor = `${numeroBR(d.valor, Number.isInteger(d.valor) ? 0 : 1)}${unidade}`;
            const lw = larguraTexto(valor, valorTam, 700);
            const lx = Math.max(plot.x + lw / 2 + 4, Math.min(plot.x + plot.w - lw / 2 - 4, x));
            return (
              <g key={i}>
                <line x1={x} y1={base} x2={x} y2={base - 16} stroke={cor.cinzaLinha} strokeWidth={3} opacity={lugar} />
                <circle cx={x} cy={y} r={16 * p} fill={cor.branco} />
                <circle cx={x} cy={y} r={10 * p} fill={cor.azul} />
                <Traco d={`M ${x} ${y - 18} L ${x} ${y - 52}`} p={prog(t, d.em + 0.1, 0.25)} cor={cor.azul} largura={3.5} />
                <text x={lx} y={y - 66} textAnchor="middle" opacity={prog(t, d.em + 0.2, 0.3)} style={{ fontFamily: sans, fontWeight: 700, fontSize: valorTam, fill: cor.tinta, fontVariantNumeric: "tabular-nums" }}>
                  {valor}
                </text>
                <text x={x} y={base + rotuloTam * 1.3} textAnchor="middle" opacity={prog(t, d.em, 0.3)} style={{ fontFamily: sans, fontWeight: 600, fontSize: rotuloTam, fill: cor.cinza }}>
                  {d.rotulo}
                </text>
              </g>
            );
          })}
        </g>
      ) : null}
    </svg>
  );
};

// Tendência sem números: a curva se desenha como um traçado de monitor e uma lupa de detalhe
// fecha no ponto final, com a seta da direção
const Tendencia: React.FC<{ m: GraficoT; t: number; plot: Regiao }> = ({ m, t, plot }) => {
  const tendencia = m.tendencia ?? "sobe";
  const inicio = m.tendenciaEm ?? m.de + 0.25;
  const desenha = prog(t, inicio, 1.6, Easing.bezier(0.45, 0, 0.35, 1));
  const N = 60;
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const x = i / N;
    return { x: plot.x + 50 + (plot.w - 120) * x, y: plot.y + plot.h - plot.h * curva(tendencia, x) * 0.9 };
  });
  const d = pts.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const fimP = pts[N];
  const ant = pts[N - 3];
  const ang = Math.atan2(fimP.y - ant.y, fimP.x - ant.x);
  const lupa = prog(t, inicio + 1.5, 0.5);
  const ponta = pts[Math.min(N, Math.round(desenha * N))];
  // área sob a curva, bem clara
  const area = `${d} L ${fimP.x} ${plot.y + plot.h} L ${pts[0].x} ${plot.y + plot.h} Z`;
  return (
    <g>
      <clipPath id={`tend-${Math.round(m.de * 100)}`}>
        <rect x={plot.x} y={plot.y - 40} width={pts[0].x - plot.x + (fimP.x - pts[0].x) * desenha} height={plot.h + 40} />
      </clipPath>
      <path d={area} fill={cor.azulClaro} opacity={0.55} clipPath={`url(#tend-${Math.round(m.de * 100)})`} />
      <Traco d={d} p={desenha} cor={cor.azul} largura={6} />
      {desenha > 0 && desenha < 1 ? <circle cx={ponta.x} cy={ponta.y} r={11} fill={cor.azul} /> : null}
      {desenha >= 1 ? (
        <g opacity={prog(t, inicio + 1.55, 0.3)}>
          <path
            d={`M ${fimP.x + Math.cos(ang) * 22} ${fimP.y + Math.sin(ang) * 22} L ${fimP.x + Math.cos(ang + 2.5) * 22} ${fimP.y + Math.sin(ang + 2.5) * 22} L ${fimP.x + Math.cos(ang - 2.5) * 22} ${fimP.y + Math.sin(ang - 2.5) * 22} Z`}
            fill={cor.azul}
          />
        </g>
      ) : null}
      {lupa > 0 ? (
        <g>
          <circle cx={fimP.x - 6} cy={fimP.y} r={70 * lupa} fill="none" stroke={cor.azul} strokeWidth={4.5} />
          <circle cx={fimP.x - 6} cy={fimP.y} r={70 * lupa + 13} fill="none" stroke={cor.azul} strokeOpacity={0.22} strokeWidth={2} />
        </g>
      ) : null}
    </g>
  );
};

// Pizza: um anel que se divide parte a parte (cada parte na sua palavra) e a legenda embaixo
const TONS = [cor.azul, "#6E93C8", cor.azulClaro, cor.cinzaLinha, "#3D6DB0", cor.cinzaClaro];
const Pizza: React.FC<{ m: GraficoT; t: number; sai: number; area: Regiao }> = ({ m, t, sai, area }) => {
  const dados = (m.dados ?? []).slice(0, 6);
  const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
  const linhaH = Math.min(96, (area.h * 0.5) / dados.length);
  const legendaH = linhaH * dados.length;
  const R = Math.min(area.w * 0.3, (area.h - legendaH - 80) / 2 - 20);
  const cx = area.x + area.w / 2;
  const cy = area.y + 60 + R + 20;
  const unidade = m.unidade ? ` ${m.unidade}` : "";
  const porcento = !m.unidade && Math.abs(total - 100) < 0.5;
  let acumulado = 0;
  const fatias = dados.map((d) => {
    const f0 = acumulado / total;
    acumulado += Math.max(0, d.valor);
    return { f0, f1: acumulado / total };
  });
  const legY = cy + R + 70;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - sai }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.cinzaClaro} strokeWidth={60} opacity={prog(t, m.de + 0.1, 0.5)} />
        {fatias.map((f, i) => {
          const p = prog(t, dados[i].em - 0.05, 0.6);
          if (p <= 0) return null;
          return <path key={i} d={arco(cx, cy, R, f.f0 + 0.003, f.f0 + (f.f1 - f.f0) * p - 0.003)} fill="none" stroke={TONS[i % TONS.length]} strokeWidth={60} />;
        })}
        <circle cx={cx} cy={cy} r={R - 44} fill="none" stroke={cor.azul} strokeOpacity={0.25} strokeWidth={2} />
        <circle cx={cx} cy={cy} r={R + 44} fill="none" stroke={cor.azul} strokeOpacity={0.25} strokeWidth={2} />
      </svg>
      {dados.map((d, i) => {
        const p = prog(t, d.em, 0.4);
        const valor = porcento ? `${numeroBR(d.valor, Number.isInteger(d.valor) ? 0 : 1)}%` : `${numeroBR(d.valor, Number.isInteger(d.valor) ? 0 : 1)}${unidade}`;
        const e = encaixar(d.rotulo, { largura: area.w - 320, max: 52, min: 36, linhas: 1, peso: 700 });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: area.x + 40,
              top: legY + i * linhaH,
              width: area.w - 80,
              height: linhaH,
              display: "flex",
              alignItems: "center",
              gap: 24,
              borderTop: `2.5px solid ${cor.cinzaClaro}`,
              opacity: (1 - sai) * limitar(p * 1.5),
              translate: `${(1 - p) * -24}px 0`,
              fontFamily: sans,
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: TONS[i % TONS.length], boxShadow: `inset 0 0 0 3px ${cor.azul}` }} />
            <div style={{ flex: 1, fontWeight: 700, fontSize: e.tamanho, color: cor.tinta, whiteSpace: "nowrap" }}>{e.linhas.join(" ")}</div>
            <div style={{ fontWeight: 800, fontSize: 52, color: cor.azul, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{valor}</div>
          </div>
        );
      })}
    </>
  );
};
