// Gráfico na faixa de cima, no traço do Espelho: fios finos, ouro sobre champanhe, o véu dourado
// pontilhado das áreas acesas do mapa e o losango que corre na linha.
// - barras: uma linha por dado (nome e valor em cima, trilho nude embaixo); a barra dourada cresce
//   quando o número é dito (como as faixas da régua do tempo);
// - linha: pontos (losangos) ligados por um fio dourado que se desenha de um dado ao outro;
// - pizza: um anel fino que se fecha por fatias, com a fatia da vez em número grande no centro;
// - sem números (tendência): uma curva dourada que se desenha com o véu pontilhado por baixo
//   (ou colunas, em "barras"), com a etiqueta ILUSTRATIVO.
import { mistura, prog, saindo, temposDoTexto, TextoEmLinhas, Traco } from "../anim";
import { formatarNumero, geometriaDoGrafico, LARGURA_PAINEL } from "../blocos";
import { encaixar } from "../medida";
import type { Grafico, Palavra } from "../plano";
import { cor, FONTE_TITULO, LIMITE_DIREITO, MARGEM_ESQUERDA, rotulo, serif, TOPO_SEGURO } from "../tema";

const titulo: React.CSSProperties = { fontFamily: serif, fontWeight: 500, color: cor.cafe, letterSpacing: "-0.012em" };
const TONS = [cor.ouro, cor.cafe, "#C8B394", cor.ouroTexto, "rgba(43,30,23,0.45)", "#DCCBB4"];

// casas decimais de um valor (até 2)
const casasDe = (v: number) => (Number.isInteger(v) ? 0 : Math.abs(v * 10 - Math.round(v * 10)) < 1e-6 ? 1 : 2);

// a curva da tendência, de 0 a 1 em x, com altura de 0 (embaixo) a 1 (em cima)
const curva = (tendencia: "sobe" | "cai" | "oscila", x: number) => {
  if (tendencia === "sobe") return 0.12 + 0.72 * Math.pow(x, 1.25) + 0.07 * Math.sin(x * Math.PI * 3.2);
  if (tendencia === "cai") return 0.86 - 0.72 * Math.pow(x, 1.1) + 0.06 * Math.sin(x * Math.PI * 3.4);
  return 0.5 + 0.26 * Math.sin(x * Math.PI * 2.6 + 0.4) + 0.06 * Math.sin(x * Math.PI * 7);
};
// caminho suave (Catmull-Rom → Bézier) por pontos
const suave = (pts: [number, number][]) => {
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};

const Losango: React.FC<{ x: number; y: number; r?: number; p?: number; cheio?: boolean }> = ({ x, y, r = 10, p = 1, cheio = true }) =>
  p > 0.01 ? (
    <rect
      x={x - r}
      y={y - r}
      width={2 * r}
      height={2 * r}
      fill={cheio ? cor.ouro : cor.champanhe}
      stroke={cor.ouro}
      strokeWidth={2}
      opacity={p}
      transform={`rotate(45 ${x} ${y}) translate(${x * (1 - p) * 0} 0)`}
    />
  ) : null;

export const BlocoGrafico: React.FC<{ m: Grafico; t: number; fim: number; linhaMaxima: number; palavras: Palavra[] }> = ({ m, t, fim, linhaMaxima, palavras }) => {
  const g = geometriaDoGrafico(m, linhaMaxima);
  const sai = saindo(t, fim, 0.3);
  const temposTitulo = g.titulo ? temposDoTexto(g.titulo.linhas.join(" "), palavras, m.de, m.ate, m.de + 0.1) : [];
  const dados = g.dados;
  const id = `g${Math.round(m.de * 1000)}`;
  const x0 = MARGEM_ESQUERDA;
  const x1 = LIMITE_DIREITO;

  let corpo: React.ReactNode = null;

  if (dados.length && m.forma === "barras") {
    // ---------------- barras com números ditos
    const max = Math.max(...dados.map((d) => d.valor), 1e-6);
    const n = dados.length;
    const disponivel = g.base - 10 - g.topoArea;
    const alturaLinha = disponivel / n;
    const nome = Math.max(40, Math.min(56, Math.round(alturaLinha - 22 - 26)));
    const trilho = Math.max(18, Math.min(26, Math.round(alturaLinha * 0.2)));
    const atual = dados.filter((d) => t >= d.em - 0.05).pop();
    corpo = (
      <>
        {dados.map((d, i) => {
          const topo = g.topoArea + i * alturaLinha + Math.max(0, alturaLinha - (nome * 1.1 + 12 + trilho)) / 2;
          const yTrilho = topo + nome * 1.1 + 12 + trilho / 2;
          const p = prog(t, d.em, 0.9);
          const valor = `${formatarNumero(d.valor * Math.min(1, p * 1.15), casasDe(d.valor))}`;
          const largNome = LARGURA_PAINEL - 260;
          const e = encaixar(d.rotulo, { largura: largNome, max: nome, min: 36, linhas: 1, fonte: FONTE_TITULO });
          const tempos = temposDoTexto(d.rotulo, palavras, d.em - 0.6, d.em + 1.5, d.em - 0.1);
          const apaga = atual && atual !== d && t >= d.em ? 0.55 : 1;
          return (
            <div key={i} style={{ opacity: apaga }}>
              <div style={{ position: "absolute", left: x0, top: topo }}>
                <TextoEmLinhas linhas={e.linhas} tempos={tempos} t={t} tamanho={e.tamanho} entre={1.1} style={titulo} />
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 1080 - x1,
                  top: topo,
                  height: nome * 1.1,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  opacity: prog(t, d.em, 0.3),
                }}
              >
                <span style={{ ...titulo, fontSize: nome, lineHeight: 1.1, fontVariantNumeric: "tabular-nums lining-nums" }}>{valor}</span>
                {m.unidade ? <span style={{ ...rotulo, fontSize: 30 }}>{m.unidade}</span> : null}
              </div>
              <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
                <Traco d={`M ${x0 + trilho / 2} ${yTrilho} L ${x1 - trilho / 2} ${yTrilho}`} p={prog(t, m.de + 0.15 + i * 0.08, 0.7)} cor={cor.nude} largura={trilho} />
                {p > 0 ? (
                  <line x1={x0 + trilho / 2} x2={Math.max(x0 + trilho / 2 + 0.1, x0 + trilho / 2 + (x1 - x0 - trilho) * (d.valor / max) * p)} y1={yTrilho} y2={yTrilho} stroke={cor.ouro} strokeWidth={trilho} strokeLinecap="round" />
                ) : null}
              </svg>
            </div>
          );
        })}
      </>
    );
  } else if (dados.length && m.forma === "linha") {
    // ---------------- linha com números ditos
    const max = Math.max(...dados.map((d) => d.valor), 1e-6);
    const min = Math.min(0, ...dados.map((d) => d.valor));
    const topo = g.topoArea + 70;
    const baseY = g.base - 70;
    const xs = dados.map((_, i) => 110 + (i * (850 - 110)) / Math.max(1, dados.length - 1));
    const ys = dados.map((d) => baseY - ((d.valor - min) / (max - min || 1)) * (baseY - topo));
    let d = `M ${xs[0]} ${ys[0]}`;
    for (let i = 1; i < dados.length; i++) d += ` L ${xs[i]} ${ys[i]}`;
    // o fio vai de um ponto ao outro quando o dado seguinte é dito
    const total = dados.length - 1;
    let feito = 0;
    for (let i = 1; i < dados.length; i++) feito += prog(t, dados[i].em - 0.35, 0.5, (x) => x);
    const pLinha = total > 0 ? feito / total : 1;
    corpo = (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {[0, 0.5, 1].map((f, i) => (
            <Traco key={i} d={`M ${x0} ${mistura(baseY, topo, f)} L ${x1} ${mistura(baseY, topo, f)}`} p={prog(t, m.de + 0.1 + i * 0.08, 0.6)} cor={cor.cafeLinha} largura={1.6} tracejado={i ? "5 8" : undefined} />
          ))}
          {t >= dados[0].em - 0.05 ? <Traco d={d} p={Math.max(0.001, pLinha)} cor={cor.ouro} largura={4} /> : null}
          {dados.map((dd, i) => (
            <g key={i}>
              <line x1={xs[i]} x2={xs[i]} y1={baseY} y2={baseY + 12} stroke={cor.cafeSuave} strokeWidth={2} opacity={prog(t, m.de + 0.2, 0.4)} />
              <Losango x={xs[i]} y={ys[i]} r={11} p={prog(t, dd.em - 0.05, 0.35)} />
            </g>
          ))}
        </svg>
        {dados.map((dd, i) => {
          const p = prog(t, dd.em - 0.05, 0.4);
          const casas = casasDe(dd.valor);
          return (
            <div key={i}>
              <div style={{ position: "absolute", left: xs[i] - 150, width: 300, top: ys[i] - 74, textAlign: "center", opacity: p, ...titulo, fontSize: 48, lineHeight: 1 }}>
                {formatarNumero(dd.valor, casas)}
                {m.unidade ? <span style={{ ...rotulo, fontSize: 28, marginLeft: 8 }}>{m.unidade}</span> : null}
              </div>
              <div style={{ position: "absolute", left: xs[i] - 140, width: 280, top: baseY + 24, textAlign: "center", opacity: p, ...rotulo, fontSize: 30, color: cor.cafe }}>
                {dd.rotulo}
              </div>
            </div>
          );
        })}
      </>
    );
  } else if (dados.length && m.forma === "pizza") {
    // ---------------- pizza (anel) com números ditos
    const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
    const altura = g.base - 10 - g.topoArea;
    const r = Math.max(120, Math.min(190, altura / 2 - 30));
    const cx = x0 + r + 30;
    const cy = g.topoArea + altura / 2;
    const circ = 2 * Math.PI * r;
    let acumulado = 0;
    const atual = dados.filter((d) => t >= d.em - 0.05).pop();
    const xLegenda = cx + r + 80;
    const largLegenda = x1 - xLegenda;
    const alturaItem = Math.min(110, altura / dados.length);
    corpo = (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={cor.cafeLinha} strokeWidth={2} strokeDasharray="5 8" opacity={prog(t, m.de + 0.1, 0.5)} />
          {dados.map((d, i) => {
            const fatia = Math.max(0, d.valor) / total;
            const inicio = acumulado;
            acumulado += fatia;
            const p = prog(t, d.em, 0.8);
            return p > 0 ? (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={TONS[i % TONS.length]}
                strokeWidth={46}
                strokeDasharray={`${circ * fatia * p} ${circ}`}
                strokeDashoffset={-circ * inicio}
                transform={`rotate(-90 ${cx} ${cy})`}
                opacity={atual && atual !== d ? 0.7 : 1}
              />
            ) : null;
          })}
        </svg>
        {atual ? (
          <div style={{ position: "absolute", left: cx - r + 30, width: 2 * r - 60, top: cy - 50, height: 100, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <span style={{ ...titulo, fontSize: Math.min(84, r * 0.5), lineHeight: 1 }}>{formatarNumero(atual.valor, casasDe(atual.valor))}</span>
            {m.unidade ? <span style={{ ...rotulo, fontSize: 30 }}>{m.unidade}</span> : null}
          </div>
        ) : null}
        {dados.map((d, i) => {
          const y = cy - (dados.length * alturaItem) / 2 + i * alturaItem;
          const e = encaixar(d.rotulo, { largura: largLegenda - 50, max: 48, min: 36, linhas: 2, fonte: FONTE_TITULO });
          const tempos = temposDoTexto(d.rotulo, palavras, d.em - 0.6, d.em + 1.5, d.em - 0.1);
          return (
            <div key={i} style={{ position: "absolute", left: xLegenda, top: y, height: alturaItem, display: "flex", alignItems: "center", gap: 18, opacity: atual && atual !== d && t >= d.em ? 0.55 : 1 }}>
              <svg width={26} height={26} style={{ flex: "none", opacity: prog(t, m.de + 0.2 + i * 0.08, 0.4) }}>
                <rect x={6} y={6} width={14} height={14} fill={t >= d.em - 0.05 ? TONS[i % TONS.length] : "none"} stroke={cor.ouro} strokeWidth={1.6} transform="rotate(45 13 13)" />
              </svg>
              <TextoEmLinhas linhas={e.linhas} tempos={tempos} t={t} tamanho={e.tamanho} entre={1.06} style={titulo} />
            </div>
          );
        })}
      </>
    );
  } else {
    // ---------------- tendência sem números (ilustrativa)
    const tendencia = m.tendencia ?? "sobe";
    const em = m.tendenciaEm ?? m.de + 0.3;
    const topo = g.topoArea + 40;
    const baseY = g.base - 30;
    const p = prog(t, em, 1.8, (x) => 1 - Math.pow(1 - x, 2));
    const N = 40;
    const pts: [number, number][] = Array.from({ length: N + 1 }, (_, i) => {
      const x = i / N;
      return [x0 + 20 + x * (x1 - x0 - 40), baseY - curva(tendencia, x) * (baseY - topo)];
    });
    const d = suave(pts);
    const ponta = pts[Math.min(N, Math.round(p * N))];
    const xPonta = x0 + 20 + p * (x1 - x0 - 40);
    const yPonta = baseY - curva(tendencia, p) * (baseY - topo);
    if (m.forma === "barras") {
      const n = 6;
      const largura = (x1 - x0) / n;
      corpo = (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <pattern id={`${id}-p`} width="7" height="7" patternUnits="userSpaceOnUse">
              <circle cx="3.5" cy="3.5" r={1.3} fill={cor.ouro} />
            </pattern>
          </defs>
          <Traco d={`M ${x0} ${baseY} L ${x1} ${baseY}`} p={prog(t, m.de + 0.1, 0.6)} cor={cor.cafeSuave} largura={2} />
          {Array.from({ length: n }, (_, i) => {
            const h = curva(tendencia, (i + 0.5) / n) * (baseY - topo);
            const pb = prog(t, em + i * 0.22, 0.6);
            const x = x0 + i * largura + largura * 0.2;
            const w = largura * 0.6;
            return (
              <g key={i}>
                <rect x={x} y={baseY - h} width={w} height={h} fill="none" stroke={cor.cafeLinha} strokeWidth={1.6} strokeDasharray="5 7" opacity={prog(t, m.de + 0.2 + i * 0.05, 0.4) * (1 - pb)} />
                {pb > 0 ? (
                  <>
                    <rect x={x} y={baseY - h * pb} width={w} height={h * pb} fill={cor.ouroVeu} />
                    <rect x={x} y={baseY - h * pb} width={w} height={h * pb} fill={`url(#${id}-p)`} />
                    <line x1={x} x2={x + w} y1={baseY - h * pb} y2={baseY - h * pb} stroke={cor.ouro} strokeWidth={4} />
                  </>
                ) : null}
              </g>
            );
          })}
        </svg>
      );
    } else {
      corpo = (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <pattern id={`${id}-p`} width="7" height="7" patternUnits="userSpaceOnUse">
              <circle cx="3.5" cy="3.5" r={1.3} fill={cor.ouro} />
            </pattern>
            <clipPath id={`${id}-c`}>
              <rect x={0} y={0} width={xPonta} height={1920} />
            </clipPath>
          </defs>
          {[0, 1, 2, 3].map((i) => {
            const y = mistura(baseY, topo, i / 3);
            return <Traco key={i} d={`M ${x0} ${y} L ${x1} ${y}`} p={prog(t, m.de + 0.1 + i * 0.07, 0.6)} cor={i === 0 ? cor.cafeSuave : cor.cafeLinha} largura={i === 0 ? 2 : 1.5} tracejado={i ? "5 8" : undefined} />;
          })}
          {p > 0 ? (
            <g clipPath={`url(#${id}-c)`}>
              <path d={`${d} L ${x1 - 20} ${baseY} L ${x0 + 20} ${baseY} Z`} fill={cor.ouroVeu} />
              <path d={`${d} L ${x1 - 20} ${baseY} L ${x0 + 20} ${baseY} Z`} fill={`url(#${id}-p)`} opacity={0.8} />
            </g>
          ) : null}
          {p > 0 ? <Traco d={d} p={p} cor={cor.ouro} largura={4.5} /> : null}
          {p > 0 && ponta ? <Losango x={xPonta} y={yPonta} r={11} /> : null}
        </svg>
      );
    }
  }

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      {g.titulo ? (
        <div style={{ position: "absolute", left: x0, top: TOPO_SEGURO }}>
          <TextoEmLinhas linhas={g.titulo.linhas} tempos={temposTitulo} t={t} tamanho={g.titulo.tamanho} entre={1.04} style={titulo} />
        </div>
      ) : null}
      {g.titulo ? (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <Traco
            d={`M ${x0} ${TOPO_SEGURO + g.titulo.linhas.length * g.titulo.tamanho * 1.04 + 22} L ${x0 + 64} ${TOPO_SEGURO + g.titulo.linhas.length * g.titulo.tamanho * 1.04 + 22}`}
            p={prog(t, (temposTitulo.length ? Math.max(...temposTitulo) : m.de) + 0.2, 0.5)}
            cor={cor.ouro}
            largura={2.4}
          />
        </svg>
      ) : null}
      {g.etiqueta ? (
        <div
          style={{
            position: "absolute",
            right: 1080 - x1,
            top: g.titulo ? g.topoArea - 6 : TOPO_SEGURO + 8,
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: prog(t, m.de + 0.3, 0.4),
          }}
        >
          <svg width={14} height={14}>
            <rect x={3} y={3} width={8} height={8} fill={cor.ouro} transform="rotate(45 7 7)" />
          </svg>
          <span style={{ ...rotulo, fontSize: 30 }}>ilustrativo</span>
        </div>
      ) : null}
      {m.unidade && !dados.length ? (
        <div style={{ position: "absolute", left: x0, top: g.titulo ? g.topoArea - 6 : TOPO_SEGURO + 8, ...rotulo, fontSize: 30, opacity: prog(t, m.de + 0.3, 0.4) }}>{m.unidade}</div>
      ) : null}
      {corpo}
    </div>
  );
};

