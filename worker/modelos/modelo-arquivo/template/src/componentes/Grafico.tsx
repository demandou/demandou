import { Datilo, mistura, preciso, prog } from "../anim";
import { partesDaRegiao, type Regiao } from "../layout";
import { encaixar, formatarNumero, larguraTexto } from "../medida";
import type { Grafico as TGrafico, Layout } from "../plano";
import { cor, mono, rotulo as estiloRotulo, sans, sombraPapel } from "../tema";
import { Cabeca, medirCabeca } from "./Cabeca";
import { Carimbo } from "./Carimbo";
import { Deslizar } from "./Papel";

const CRESCE = 0.8;

// formas qualitativas (fração da altura, 0 = embaixo): só a tendência, sem números
const FORMAS: Record<NonNullable<TGrafico["tendencia"]>, number[]> = {
  sobe: [0.14, 0.24, 0.2, 0.38, 0.46, 0.62, 0.72, 0.88],
  cai: [0.88, 0.76, 0.8, 0.6, 0.52, 0.36, 0.28, 0.12],
  oscila: [0.42, 0.7, 0.36, 0.66, 0.3, 0.74, 0.4, 0.58],
};

// caminho suave (Catmull-Rom) pelos pontos
const suave = (pts: { x: number; y: number }[]) => {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6} ${p2.x} ${p2.y}`;
  }
  return d;
};

// Gráfico impresso em papel quadriculado, como um anexo de relatório: barras com hachura vermelha,
// linha a tinta com pontos vermelhos, pizza em fatias de hachura e tinta. Cada dado entra quando
// é dito, com o valor datilografado. Sem números ditos, a tendência (uma curva a tinta ou barras
// que sobem/caem) e o carimbo ILUSTRATIVO.
export const Grafico: React.FC<{ m: TGrafico; t: number; fim: number; regiao: Regiao; layout: Layout }> = ({ m, t, fim, regiao, layout }) => {
  const larguraTitulo = layout === "canto" ? partesDaRegiao(layout, regiao, 0).cabeca.w : regiao.w;
  // no canto, o título enche o pedaço ao lado da foto
  const cab = layout === "canto" ? medirCabeca(m.titulo, larguraTitulo - 8, 96, 3) : medirCabeca(m.titulo, larguraTitulo - 8);
  const { cabeca, corpo } = partesDaRegiao(layout, regiao, cab.altura);
  const papel = { x: corpo.x, y: corpo.y + 6, w: corpo.w, h: corpo.h - 14 };
  const dados = (m.dados ?? []).slice(0, 6);
  const qualitativo = dados.length < 2;
  const ilustrativo = m.ilustrativo || qualitativo;
  const grade = prog(t, m.de + 0.1, 0.7, preciso);
  const PASSO = 54;
  const id = `hachura-graf-${Math.round(m.de * 100)}`;
  // área do desenho dentro do papel (espaço para valores em cima e rótulos embaixo)
  const plot = { x: 60, y: 96, w: papel.w - 120, h: papel.h - 96 - 120 };
  const inicioTend = m.tendenciaEm ?? m.de + 0.4;
  const unidade = m.unidade ? ` ${m.unidade}` : "";
  const casasDe = (v: number) => (Number.isInteger(v) ? 0 : Math.abs(v) < 10 ? 2 : 1);
  const carimboEm = (qualitativo ? inicioTend + 1.3 : Math.max(...dados.map((d) => d.em)) + 0.9);

  const desenho = () => {
    // ——— pizza ———
    if (m.forma === "pizza") {
      const r = Math.min(plot.h, plot.w * 0.5) / 2;
      const cx = plot.x + r + 10;
      const cy = plot.y + plot.h / 2;
      const valores = qualitativo ? [m.tendencia === "cai" ? 0.28 : 0.72, m.tendencia === "cai" ? 0.72 : 0.28] : dados.map((d) => Math.max(0, d.valor));
      const soma = valores.reduce((a, b) => a + b, 0) || 1;
      const ems = qualitativo ? [inicioTend, inicioTend + 0.6] : dados.map((d) => d.em);
      const preenchimentos = [`url(#${id})`, cor.tinta, cor.concreto, cor.grafite, cor.pedra[0], cor.cartao];
      let acumulado = 0;
      const fatias = valores.map((v, i) => {
        const a0 = (acumulado / soma) * Math.PI * 2 - Math.PI / 2;
        acumulado += v;
        const a1full = (acumulado / soma) * Math.PI * 2 - Math.PI / 2;
        const p = prog(t, ems[i], 0.6, preciso);
        const a1 = mistura(a0, a1full, p);
        const grande = a1 - a0 > Math.PI ? 1 : 0;
        const d =
          p <= 0.001
            ? ""
            : p >= 0.999 && valores.length === 1
              ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
              : `M ${cx} ${cy} L ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${grande} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`;
        return { d, fill: preenchimentos[i % preenchimentos.length], i };
      });
      const legendaX = cx + r + 50;
      const larguraLegenda = papel.w - legendaX - 40;
      return (
        <>
          <svg width={papel.w} height={papel.h} style={{ position: "absolute", left: 0, top: 0 }}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={cor.tinta} strokeOpacity={0.35} strokeWidth={3} strokeDasharray="10 8" />
            {fatias.map((f) => (f.d ? <path key={f.i} d={f.d} fill={f.fill} stroke={cor.cartao} strokeWidth={4} /> : null))}
            {fatias.map((f) => (f.d && f.i === 0 ? <path key={`c-${f.i}`} d={f.d} fill="none" stroke={cor.vermelho} strokeWidth={4} /> : null))}
          </svg>
          {qualitativo ? null : (
            <div style={{ position: "absolute", left: legendaX, top: plot.y, width: larguraLegenda, display: "flex", flexDirection: "column", gap: 22 }}>
              {dados.map((d, i) => {
                const pct = m.unidade === "%" ? d.valor : (d.valor / soma) * 100;
                const valor = `${formatarNumero(pct, Number.isInteger(pct) ? 0 : 1)}%`;
                const rot = encaixar(d.rotulo, { largura: larguraLegenda - 50, max: 36, min: 30, linhas: 2, fonte: { mono: true } });
                return (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", opacity: t >= d.em - 0.05 ? 1 : 0.25 }}>
                    <svg width={34} height={34} style={{ flexShrink: 0, marginTop: 6 }}>
                      <rect x={2} y={2} width={30} height={30} fill={preenchimentos[i % preenchimentos.length]} stroke={i === 0 ? cor.vermelho : cor.tinta} strokeWidth={3} />
                    </svg>
                    <div>
                      <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 52, lineHeight: 1, color: i === 0 ? cor.vermelho : cor.tinta }}>
                        <Datilo texto={valor} em={d.em} t={t} semente={500 + i} cursor={false} />
                      </div>
                      <div style={{ fontFamily: mono, fontWeight: 700, fontSize: rot.tamanho, lineHeight: 1.15, color: cor.grafite, marginTop: 6 }}>
                        {rot.linhas.map((l, k) => (
                          <div key={k} style={{ whiteSpace: "nowrap" }}>
                            <Datilo texto={l} em={d.em + 0.2} t={t} semente={510 + i * 3 + k} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      );
    }

    // ——— barras e linha ———
    const valores = qualitativo ? FORMAS[m.tendencia ?? "sobe"] : dados.map((d) => d.valor);
    const max = Math.max(...valores, 0) || 1;
    const minimo = Math.min(0, ...valores);
    const yDe = (v: number) => plot.y + plot.h - ((v - minimo) / (max - minimo)) * plot.h;
    const nBarras = m.forma === "barras" && qualitativo ? 6 : valores.length;
    const serie = m.forma === "barras" && qualitativo ? Array.from({ length: 6 }, (_, k) => FORMAS[m.tendencia ?? "sobe"][Math.round((k * 7) / 5)]) : valores;
    const fatia = plot.w / nBarras;
    const ems = qualitativo ? serie.map((_, k) => inicioTend + k * 0.22) : dados.map((d) => d.em);

    if (m.forma === "barras") {
      const larguraBarra = Math.min(160, fatia * 0.58);
      // um corpo só para os valores e um para os rótulos
      const textosValor = dados.map((d) => `${formatarNumero(d.valor, casasDe(d.valor))}${unidade}`);
      const corpoValor = qualitativo ? 0 : Math.max(30, Math.min(52, ...textosValor.map((s) => Math.floor((fatia - 10) / (larguraTexto(s, 1, { peso: 800 }) || 1)))));
      return (
        <>
          <svg width={papel.w} height={papel.h} style={{ position: "absolute", left: 0, top: 0 }}>
            <line x1={plot.x - 20} x2={plot.x + plot.w + 20} y1={plot.y + plot.h} y2={plot.y + plot.h} stroke={cor.tinta} strokeWidth={4} />
            {serie.map((v, k) => {
              const p = prog(t, ems[k], CRESCE, preciso);
              const x = plot.x + fatia * k + (fatia - larguraBarra) / 2;
              const base = yDe(0);
              const topo = yDe(v);
              const hh = (base - topo) * p;
              return (
                <g key={k}>
                  <rect x={x} y={topo} width={larguraBarra} height={base - topo} fill="none" stroke={cor.tinta} strokeOpacity={0.3} strokeWidth={2.5} strokeDasharray="10 8" />
                  {hh > 0.5 ? <rect x={x} y={base - hh} width={larguraBarra} height={hh} fill={`url(#${id})`} stroke={cor.vermelho} strokeWidth={4} /> : null}
                </g>
              );
            })}
          </svg>
          {qualitativo
            ? null
            : dados.map((d, k) => {
                const x = plot.x + fatia * k;
                const rot = encaixar(d.rotulo, { largura: fatia - 12, max: 34, min: 30, linhas: 2, fonte: { mono: true } });
                return (
                  <div key={k}>
                    <div
                      style={{
                        position: "absolute",
                        left: x,
                        width: fatia,
                        top: yDe(d.valor) - corpoValor - 14,
                        textAlign: "center",
                        fontFamily: sans,
                        fontWeight: 800,
                        fontSize: corpoValor,
                        lineHeight: 1,
                        color: cor.tinta,
                        opacity: t >= d.em + CRESCE * 0.6 ? 1 : 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Datilo texto={textosValor[k]} em={d.em + CRESCE * 0.6} t={t} semente={530 + k} cursor={false} />
                    </div>
                    <div style={{ position: "absolute", left: x + 6, width: fatia - 12, top: plot.y + plot.h + 16, textAlign: "center", fontFamily: mono, fontWeight: 700, fontSize: rot.tamanho, lineHeight: 1.12, color: cor.tinta }}>
                      {rot.linhas.map((l, j) => (
                        <div key={j} style={{ whiteSpace: "nowrap" }}>
                          <Datilo texto={l} em={d.em} t={t} semente={540 + k * 3 + j} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
        </>
      );
    }

    // linha
    const pts = serie.map((v, k) => ({ x: plot.x + (serie.length === 1 ? plot.w / 2 : (plot.w * k) / (serie.length - 1)), y: yDe(v) }));
    // quanto do traço já foi desenhado: até o ponto k no seu `em` (a curva qualitativa corre direto)
    let alcance = 0;
    if (qualitativo) alcance = prog(t, inicioTend, 1.7, preciso) * (pts.length - 1);
    else {
      for (let k = 0; k < pts.length; k++) {
        if (k === 0) alcance = prog(t, ems[0], 0.3) > 0 ? 0 : -1;
        else alcance += prog(t, ems[k] - 0.05, 0.55, preciso);
      }
    }
    const desenhados = Math.max(0, Math.floor(alcance));
    const parcial = alcance - desenhados;
    const visiveis = pts.slice(0, desenhados + 1);
    if (desenhados < pts.length - 1 && parcial > 0) {
      const a = pts[desenhados];
      const b = pts[desenhados + 1];
      visiveis.push({ x: mistura(a.x, b.x, parcial), y: mistura(a.y, b.y, parcial) });
    }
    const ponta = visiveis[visiveis.length - 1];
    const textos = dados.map((d) => `${formatarNumero(d.valor, casasDe(d.valor))}${unidade}`);
    const corpoValor = qualitativo ? 0 : Math.max(30, Math.min(48, ...textos.map((s) => Math.floor((plot.w / Math.max(1, pts.length - 1) - 8) / (larguraTexto(s, 1, { peso: 800 }) || 1)))));
    const fimSeta = qualitativo && alcance >= pts.length - 1.01;
    return (
      <>
        <svg width={papel.w} height={papel.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <line x1={plot.x - 20} x2={plot.x + plot.w + 20} y1={plot.y + plot.h} y2={plot.y + plot.h} stroke={cor.tinta} strokeWidth={4} />
          <path d={suave(pts)} fill="none" stroke={cor.tinta} strokeOpacity={0.22} strokeWidth={3} strokeDasharray="10 9" />
          {alcance >= 0 && visiveis.length > 1 ? <path d={qualitativo ? suave(visiveis) : visiveis.map((p, k) => `${k ? "L" : "M"} ${p.x} ${p.y}`).join(" ")} fill="none" stroke={cor.tinta} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" /> : null}
          {!qualitativo
            ? pts.map((p, k) => (k <= alcance + 0.001 && alcance >= 0 ? <circle key={k} cx={p.x} cy={p.y} r={12} fill={cor.vermelho} stroke={cor.cartao} strokeWidth={4} /> : null))
            : alcance > 0 && ponta
              ? fimSeta
                ? (() => {
                    const a = pts[pts.length - 2];
                    const b = pts[pts.length - 1];
                    const ang = Math.atan2(b.y - a.y, b.x - a.x);
                    const s = 34;
                    const p1 = { x: b.x - s * Math.cos(ang - 0.45), y: b.y - s * Math.sin(ang - 0.45) };
                    const p2 = { x: b.x - s * Math.cos(ang + 0.45), y: b.y - s * Math.sin(ang + 0.45) };
                    return <path d={`M ${p1.x} ${p1.y} L ${b.x} ${b.y} L ${p2.x} ${p2.y}`} fill="none" stroke={cor.vermelho} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />;
                  })()
                : <circle cx={ponta.x} cy={ponta.y} r={12} fill={cor.vermelho} />
              : null}
        </svg>
        {qualitativo
          ? null
          : dados.map((d, k) => {
              const p = pts[k];
              const larguraSlot = plot.w / Math.max(1, pts.length - 1);
              const rot = encaixar(d.rotulo, { largura: Math.min(260, larguraSlot - 10), max: 34, min: 30, linhas: 2, fonte: { mono: true } });
              const esquerda = Math.max(-40, Math.min(papel.w - 260 + 40, p.x - 130));
              return (
                <div key={k}>
                  <div
                    style={{
                      position: "absolute",
                      left: esquerda,
                      width: 260,
                      top: p.y - corpoValor - 28,
                      textAlign: "center",
                      fontFamily: sans,
                      fontWeight: 800,
                      fontSize: corpoValor,
                      lineHeight: 1,
                      color: cor.tinta,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Datilo texto={textos[k]} em={d.em + 0.25} t={t} semente={560 + k} cursor={false} />
                  </div>
                  <div style={{ position: "absolute", left: esquerda, width: 260, top: plot.y + plot.h + 16, textAlign: "center", fontFamily: mono, fontWeight: 700, fontSize: rot.tamanho, lineHeight: 1.12, color: cor.tinta }}>
                    {rot.linhas.map((l, j) => (
                      <div key={j} style={{ whiteSpace: "nowrap" }}>
                        <Datilo texto={l} em={d.em} t={t} semente={570 + k * 3 + j} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
      </>
    );
  };

  return (
    <Deslizar t={t} de={m.de} fim={fim}>
      <Cabeca fit={cab.fit} x={cabeca.x} y={cabeca.y + (layout === "canto" ? 30 : 4)} em={m.de + 0.2} t={t} semente={590} />
      <div style={{ position: "absolute", left: papel.x, top: papel.y, width: papel.w, height: papel.h, background: cor.cartao, boxShadow: sombraPapel, rotate: "0.4deg", overflow: "hidden" }}>
        <svg width={papel.w} height={papel.h} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="16" height="16" fill={cor.cartao} />
              <line x1="0" y1="0" x2="0" y2="16" stroke={cor.vermelho} strokeWidth="4" />
            </pattern>
          </defs>
          {Array.from({ length: Math.ceil(papel.w / PASSO) }, (_, k) => (
            <line key={`v${k}`} x1={(k + 0.5) * PASSO} x2={(k + 0.5) * PASSO} y1={0} y2={papel.h * grade} stroke={cor.tinta} strokeOpacity={k % 2 ? 0.08 : 0.14} strokeWidth={2} />
          ))}
          {Array.from({ length: Math.ceil(papel.h / PASSO) }, (_, k) => (
            <line key={`h${k}`} y1={(k + 0.5) * PASSO} y2={(k + 0.5) * PASSO} x1={0} x2={papel.w * grade} stroke={cor.tinta} strokeOpacity={k % 2 ? 0.08 : 0.14} strokeWidth={2} />
          ))}
          <rect width={papel.w} height={papel.h} fill="none" stroke={cor.tinta} strokeWidth={3} />
        </svg>
        <div style={{ position: "absolute", left: 30, top: 26, ...estiloRotulo, fontSize: 30, color: cor.grafite }}>
          {m.unidade && m.forma !== "pizza" ? `${m.unidade}` : ""}
        </div>
        {desenho()}
        {ilustrativo ? (
          <div style={{ position: "absolute", right: 34, top: 22 }}>
            <Carimbo texto="Ilustrativo" em={carimboEm} t={t} rot={-5} semente={9} tamanho={0.62} />
          </div>
        ) : null}
      </div>
    </Deslizar>
  );
};
