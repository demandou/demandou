// Bloco "grafico" (modo tela grande): o histórico do computador de bordo (como o gráfico de consumo).
// barras = colunas que sobem quando cada número é dito; linha = pontos ligados por um traço que se
// desenha de ponto em ponto; pizza = um anel (como o de um mostrador) dividido em fatias de marfim em
// tons diferentes. Sem números ditos: a curva da tendência (sobe, cai, oscila) se desenha com a
// etiqueta "ilustrativo". Tudo em marfim: o vermelho continua só nas luzes.
import { Acende, prog, saindo, temposDoTexto, troca } from "../anim";
import { formatar } from "../formato";
import { diagramar, medir } from "../medidas";
import type { Grafico, Palavra } from "../plano";
import { cor, fonte, rotulo, texto } from "../tema";
import type { Parte } from "./Painel";
import { Etiqueta } from "./TelaNumero";

const TELA = { x: 60, y: 792, w: 960, h: 480 };
// área do desenho (abaixo do título) e a faixa dos rótulos embaixo
const PLOT = { x: 120, y: 900, w: 840, h: 262 };
const ROTULOS_Y = 1184;
const TONS = [1, 0.62, 0.4, 0.26, 0.17, 0.11];

const casasDe = (v: number) => (Number.isInteger(v) ? 0 : 1);

export const TelaGrafico: React.FC<{ m: Grafico; palavras: Palavra[]; t: number; inicio: number; fim: number; parte: Parte }> = ({ m, palavras, t, inicio, fim, parte }) => {
  if (parte !== "tela") return null;
  const entrada = prog(t, inicio, 0.12);
  const s = saindo(t, fim, 0.2);
  const dados = [...(m.dados ?? [])].sort((a, b) => a.em - b.em).slice(0, 6);
  const comDados = dados.length >= 2;
  const ilustrativo = !comDados || !!m.ilustrativo;
  const larguraTitulo = TELA.w - 80 - (ilustrativo ? 230 : 0);
  const titulo = m.titulo ? diagramar(m.titulo, { largura: larguraTitulo, maximo: 48, minimo: 36, linhas: 1, peso: 700 }) : null;
  const tTitulo = m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.ate) : [];
  const unidade = m.unidade?.trim() ?? "";

  const cabecalho = (
    <>
      {titulo ? (
        <div style={{ position: "absolute", left: TELA.x + 40, top: TELA.y + 30, width: larguraTitulo }}>
          <Acende linhas={titulo.linhas} tempos={tTitulo} t={t} style={texto(700, titulo.tam, { textTransform: "uppercase" })} />
        </div>
      ) : null}
      {ilustrativo ? <Etiqueta style={{ position: "absolute", right: 1080 - (TELA.x + TELA.w - 36), top: TELA.y + 34 }} /> : null}
    </>
  );

  // ---------- sem números: a tendência ----------
  if (!comDados) {
    const forma = m.tendencia ?? "sobe";
    const comeca = m.tendenciaEm ?? m.de + 0.15;
    const p = prog(t, comeca - 0.05, Math.max(1.4, Math.min(2.6, (m.ate - comeca) * 0.7)), troca);
    const pontos: { x: number; y: number }[] = [];
    for (let k = 0; k <= 60; k++) {
      const u = k / 60;
      let v: number;
      if (forma === "sobe") v = 0.12 + 0.72 * Math.pow(u, 1.35) + 0.06 * Math.sin(u * 9.5);
      else if (forma === "cai") v = 0.86 - 0.7 * Math.pow(u, 1.2) + 0.05 * Math.sin(u * 9);
      else v = 0.5 + 0.28 * Math.sin(u * Math.PI * 3.2) * (0.7 + 0.3 * u);
      pontos.push({ x: PLOT.x + u * PLOT.w, y: PLOT.y + PLOT.h - v * PLOT.h });
    }
    const d = pontos.map((q, k) => `${k ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" ");
    const pontaK = Math.max(0, Math.min(60, Math.round(p * 60)));
    const ponta = pontos[pontaK];
    return (
      <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
        {cabecalho}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {[0, 0.5, 1].map((g) => (
            <line key={g} x1={PLOT.x} x2={PLOT.x + PLOT.w} y1={PLOT.y + g * PLOT.h} y2={PLOT.y + g * PLOT.h} stroke={cor.linha} strokeWidth={2} />
          ))}
          <path d={d} fill="none" stroke={cor.apagado} strokeWidth={6} strokeDasharray="10 12" />
          {p > 0.002 ? <path d={d} fill="none" stroke={cor.marfim} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={p < 0.999 ? `${p} 1` : undefined} /> : null}
          {p > 0.002 ? (
            <g>
              <circle cx={ponta.x} cy={ponta.y} r={22 + 4 * Math.sin(t * 4)} fill="none" stroke={cor.marfimFraco} strokeWidth={3} />
              <circle cx={ponta.x} cy={ponta.y} r={11} fill={cor.marfim} />
            </g>
          ) : null}
        </svg>
      </div>
    );
  }

  // ---------- com números ditos ----------
  const max = Math.max(...dados.map((x) => x.valor)) * 1.12 || 1;
  const slot = PLOT.w / dados.length;
  const rotulos = dados.map((x) => diagramar(x.rotulo, { largura: slot - 12, maximo: 32, minimo: 30, linhas: 2, peso: 600, espacamento: 0.06 }));
  const valorTxt = (v: number) => `${formatar(v, casasDe(v))}${unidade ? (unidade === "%" ? "%" : ` ${unidade}`) : ""}`;
  const tamValor = Math.max(32, Math.min(46, ...dados.map((x) => (slot - 8) / Math.max(1, medir(valorTxt(x.valor), 1, 700, false)))));

  if (m.forma === "pizza") {
    const total = dados.reduce((a, x) => a + Math.max(0, x.valor), 0) || 1;
    const C = { cx: 300, cy: 1062, r: 152 };
    const larg = 52;
    let acumulado = 0;
    const fatias = dados.map((x, i) => {
      const de = acumulado / total;
      acumulado += Math.max(0, x.valor);
      const ate = acumulado / total;
      const p = prog(t, x.em - 0.05, 0.6, troca);
      return { de, ate: de + (ate - de) * p, i, p };
    });
    const arco = (a: number, b: number) => {
      const ang = (f: number) => -Math.PI / 2 + f * 2 * Math.PI;
      const pa = { x: C.cx + C.r * Math.cos(ang(a)), y: C.cy + C.r * Math.sin(ang(a)) };
      const pb = { x: C.cx + C.r * Math.cos(ang(b)), y: C.cy + C.r * Math.sin(ang(b)) };
      return `M${pa.x.toFixed(2)} ${pa.y.toFixed(2)} A${C.r} ${C.r} 0 ${b - a > 0.5 ? 1 : 0} 1 ${pb.x.toFixed(2)} ${pb.y.toFixed(2)}`;
    };
    const legenda = { x: 540, y: TELA.y + (titulo ? 110 : 60), w: 440 };
    const linhaH = Math.min(84, (TELA.y + TELA.h - 30 - legenda.y) / dados.length);
    return (
      <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
        {cabecalho}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <circle cx={C.cx} cy={C.cy} r={C.r} fill="none" stroke="rgba(241,237,228,0.1)" strokeWidth={larg} />
          {fatias.map((f) =>
            f.ate - f.de > 0.002 ? (
              <path key={f.i} d={arco(f.de + 0.004, Math.max(f.de + 0.005, f.ate - 0.004))} fill="none" stroke={`rgba(241,237,228,${TONS[f.i]})`} strokeWidth={larg} />
            ) : null,
          )}
        </svg>
        {dados.map((x, i) => {
          const aceso = prog(t, x.em - 0.05, 0.25);
          const r = diagramar(x.rotulo, { largura: legenda.w - 190, maximo: 40, minimo: 30, linhas: 1, peso: 700 });
          return (
            <div key={i} style={{ position: "absolute", left: legenda.x, top: legenda.y + i * linhaH, width: legenda.w, height: linhaH, display: "flex", alignItems: "center", opacity: 0.25 + 0.75 * aceso }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: `rgba(241,237,228,${TONS[i]})`, boxShadow: "inset 0 0 0 2px rgba(241,237,228,0.5)", flexShrink: 0 }} />
              <div style={texto(700, r.tam, { textTransform: "uppercase", marginLeft: 18, whiteSpace: "nowrap", flex: 1 })}>{r.linhas[0]}</div>
              <div style={texto(700, 40, { color: cor.marfimSuave, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" })}>{valorTxt(x.valor)}</div>
            </div>
          );
        })}
      </div>
    );
  }

  const base = PLOT.y + PLOT.h;
  const cx = (i: number) => PLOT.x + slot * (i + 0.5);
  const alturaDe = (v: number) => (Math.max(0, v) / max) * (PLOT.h - tamValor - 16);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
      {cabecalho}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={PLOT.x} x2={PLOT.x + PLOT.w} y1={base} y2={base} stroke={cor.marfimFraco} strokeWidth={3} />
        {m.forma === "linha"
          ? (() => {
              const pts = dados.map((x, i) => ({ x: cx(i), y: base - alturaDe(x.valor) }));
              const fantasma = pts.map((q, i) => `${i ? "L" : "M"}${q.x} ${q.y}`).join(" ");
              return (
                <g>
                  <path d={fantasma} fill="none" stroke={cor.apagado} strokeWidth={5} strokeDasharray="10 12" />
                  {pts.slice(1).map((q, i) => {
                    const a = pts[i];
                    const p = prog(t, dados[i + 1].em - 0.1, 0.45, troca);
                    return p > 0.002 ? <line key={i} x1={a.x} y1={a.y} x2={a.x + (q.x - a.x) * p} y2={a.y + (q.y - a.y) * p} stroke={cor.marfim} strokeWidth={8} strokeLinecap="round" /> : null;
                  })}
                  {pts.map((q, i) => {
                    const p = prog(t, dados[i].em - 0.05, 0.25);
                    return <circle key={`p${i}`} cx={q.x} cy={q.y} r={10 + 3 * p} fill={p > 0.02 ? cor.marfim : cor.vidro} stroke={p > 0.02 ? cor.marfim : cor.apagado} strokeWidth={4} />;
                  })}
                </g>
              );
            })()
          : dados.map((x, i) => {
              const w = Math.min(120, slot * 0.56);
              const h = alturaDe(x.valor);
              const p = prog(t, x.em - 0.05, 0.6, troca);
              return (
                <g key={i}>
                  <rect x={cx(i) - w / 2} y={base - h} width={w} height={h} rx={8} fill="none" stroke={cor.apagado} strokeWidth={3} strokeDasharray="10 9" />
                  {p > 0.002 ? <rect x={cx(i) - w / 2} y={base - h * p} width={w} height={h * p} rx={8} fill={cor.marfim} /> : null}
                </g>
              );
            })}
      </svg>
      {/* valores em cima e rótulos embaixo de cada coluna/ponto */}
      {dados.map((x, i) => {
        const p = prog(t, x.em - 0.05, m.forma === "linha" ? 0.25 : 0.6, troca);
        const y = base - alturaDe(x.valor) * (m.forma === "linha" ? 1 : p);
        const v = x.valor * (m.forma === "linha" ? 1 : p);
        return (
          <div key={`v${i}`}>
            <div
              style={{
                position: "absolute",
                left: cx(i) - slot / 2,
                width: slot,
                top: y - tamValor - (m.forma === "linha" ? 22 : 12),
                textAlign: "center",
                opacity: p > 0.02 ? 1 : 0,
                ...texto(700, tamValor, { lineHeight: 1, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }),
              }}
            >
              {valorTxt(m.forma === "linha" ? x.valor : Number(v.toFixed(casasDe(x.valor))))}
            </div>
            <div style={{ position: "absolute", left: cx(i) - slot / 2 + 6, width: slot - 12, top: ROTULOS_Y, display: "flex", flexDirection: "column", alignItems: "center" }}>
              {rotulos[i].linhas.map((l, k) => (
                <div key={k} style={rotulo(rotulos[i].tam, { color: t >= x.em - 0.05 ? cor.marfim : cor.apagado, letterSpacing: "0.06em", marginTop: k ? 6 : 0, whiteSpace: "nowrap", fontFamily: fonte })}>
                  {l}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
