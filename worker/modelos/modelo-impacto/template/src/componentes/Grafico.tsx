// O gráfico em tela cheia, na linguagem do Impacto: traço grosso, quadrados em vez de bolinhas,
// números em mono que contam, a peça da vez no acento. A pessoa fica na janela do canto.
// Com `dados` (números ditos): barras, linha ou anel (pizza) proporcionais, cada peça no seu `em`.
// Sem `dados`: a tendência (sobe, cai, oscila) se desenha durante o momento, marcada "ilustrativo".
import { Easing } from "remotion";
import { batida, prog, saindo, seco, useTempo } from "../anim";
import type { Grafico as TGrafico } from "../plano";
import { caixaAlta, cor, larguraMonoEm, MARGEM, mono, rotulo, sora, TRACKING } from "../tema";
import { ehMoeda, encaixar, formatarNumero } from "../texto";
import type { Contexto } from "./contexto";

const W = 1080 - 2 * MARGEM - 70;
const X0 = MARGEM;

// casas decimais do próprio número (27,5 fica 27,5; nunca arredonda o que foi dito)
const casasDe = (v: number) => {
  for (let c = 0; c <= 3; c++) if (Math.abs(v * 10 ** c - Math.round(v * 10 ** c)) < 1e-6) return c;
  return 2;
};
const formato = (v: number, unidade?: string, casas = casasDe(v)) => {
  const n = formatarNumero(v, casas);
  if (!unidade) return n;
  if (ehMoeda(unidade)) return `${unidade.trim()} ${n}`;
  return /^[%x×]/.test(unidade.trim()) ? `${n}${unidade.trim()}` : `${n} ${unidade.trim()}`;
};

// Número em mono com a unidade: % e x colados no mesmo corpo; moeda e palavras ("kg", "mil")
// menores, em Sora, para o número continuar sendo o maior da linha.
const Valor: React.FC<{ v: number; unidade?: string; casas?: number; tamanho: number; cor: string }> = ({ v, unidade, casas, tamanho, cor: c }) => {
  const n = formatarNumero(v, casas ?? casasDe(v));
  const u = unidade?.trim() ?? "";
  const colada = /^[%x×]$/.test(u);
  const pequena = (texto: string) => (
    <span style={{ fontFamily: sora, fontWeight: 700, fontSize: Math.round(tamanho * 0.56), letterSpacing: "0", marginLeft: ehMoeda(u) ? 0 : tamanho * 0.12, marginRight: ehMoeda(u) ? tamanho * 0.12 : 0 }}>
      {texto}
    </span>
  );
  return (
    <span style={{ fontFamily: mono, fontWeight: 800, fontSize: tamanho, letterSpacing: "-0.03em", color: c, whiteSpace: "nowrap" }}>
      {u && ehMoeda(u) ? pequena(u) : null}
      {n}
      {u && colada ? u : null}
      {u && !colada && !ehMoeda(u) ? pequena(u) : null}
    </span>
  );
};
// largura (em "em" do corpo) de um valor com a unidade, para caber na vaga
const larguraValor = (v: number, unidade?: string) => {
  const n = formatarNumero(v, casasDe(v));
  const u = unidade?.trim() ?? "";
  const colada = /^[%x×]$/.test(u);
  return larguraMonoEm(n + (colada ? u : "")) - 0.03 * n.length + (u && !colada ? u.length * 0.36 + 0.12 : 0);
};

// formas qualitativas (frações da altura útil, da esquerda para a direita)
const FORMAS: Record<"sobe" | "cai" | "oscila", number[]> = {
  sobe: [0.12, 0.22, 0.16, 0.36, 0.3, 0.52, 0.46, 0.7, 0.63, 0.92],
  cai: [0.9, 0.78, 0.84, 0.62, 0.68, 0.46, 0.52, 0.3, 0.36, 0.1],
  oscila: [0.5, 0.72, 0.38, 0.66, 0.3, 0.62, 0.4, 0.7, 0.45, 0.58],
};

const Seta: React.FC<{ x: number; y: number; tendencia: "sobe" | "cai" | "oscila"; p: number }> = ({ x, y, tendencia, p }) => {
  if (tendencia === "oscila") return null;
  const d = tendencia === "sobe" ? -1 : 1;
  const L = 70;
  return (
    <g opacity={p} stroke={cor.volt} strokeWidth={12} fill="none" strokeLinecap="square">
      <line x1={x} y1={y} x2={x + L} y2={y + d * L} />
      <polyline points={`${x + L - 38},${y + d * L} ${x + L},${y + d * L} ${x + L},${y + d * L - d * 38}`} />
    </g>
  );
};

export const Grafico: React.FC<{ m: TGrafico; ctx: Contexto }> = ({ m, ctx }) => {
  const t = useTempo();
  const JANELA = ctx.geo.janela;
  const s = saindo(t, ctx.saida, 0.12);
  const entrada = prog(t, m.de, 0.3);
  const dados = (m.dados ?? []).slice(0, 6);
  const comDados = dados.length >= 2;
  const ilustrativo = m.ilustrativo || !comDados;
  const tendencia = m.tendencia ?? "sobe";

  // ——— cabeçalho ———
  const larguraCab = JANELA.x - MARGEM - 40;
  const tit = m.titulo
    ? encaixar(caixaAlta(m.titulo), { largura: larguraCab, max: 92, min: 52, maxLinhas: 3, peso: 800, espacamento: TRACKING })
    : null;
  const alturaTit = tit ? tit.linhas.length * tit.tamanho * 0.94 : 0;
  const topoTit = JANELA.y + JANELA.h - alturaTit;

  // ——— área do gráfico ———
  const TOPO = Math.max(760, JANELA.y + Math.max(JANELA.h, alturaTit + 70) + 110);
  const BASE = 1400;
  const H = BASE - TOPO - 110;

  // a peça da vez (a última já dita) fica no acento
  let atual = -1;
  dados.forEach((d, i) => {
    if (t >= d.em - 0.03) atual = i;
  });
  const pBase = prog(t, m.de + 0.05, 0.35);

  const valores = dados.map((d) => d.valor);
  const maxV = Math.max(1e-9, ...valores);
  const minV = Math.min(0, ...valores);

  let corpo: React.ReactNode = null;

  if (comDados && m.forma === "barras") {
    const slot = W / dados.length;
    const larg = Math.min(170, slot * 0.62);
    const tamValor = Math.min(84, ...dados.map((d) => Math.floor((slot - 12) / Math.max(1, larguraValor(d.valor, m.unidade)))));
    corpo = (
      <>
        {dados.map((d, i) => {
          const cx = X0 + slot * (i + 0.5);
          const p = prog(t, d.em - 0.02, 0.5, seco);
          const h = Math.max(0, ((d.valor - minV) / (maxV - minV || 1)) * H) * p;
          const daVez = i === atual;
          const rot = encaixar(caixaAlta(d.rotulo), { largura: slot - 14, max: 40, min: 30, maxLinhas: 2, peso: 700, espacamento: 0.04 });
          return (
            <div key={i}>
              {/* a vaga: um toco no trilho antes de ser dita */}
              <div style={{ position: "absolute", left: cx - larg / 2, top: BASE - 12, width: larg, height: 12, background: cor.trilho, opacity: pBase }} />
              <div style={{ position: "absolute", left: cx - larg / 2, top: BASE - h, width: larg, height: h, background: daVez ? cor.volt : cor.papel }} />
              {p > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    left: cx - slot / 2,
                    width: slot,
                    top: BASE - h - tamValor - 18,
                    textAlign: "center",
                    fontFamily: mono,
                    fontWeight: 800,
                    fontSize: tamValor,
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                    color: daVez ? cor.volt : cor.papel,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Valor v={p > 0.98 ? d.valor : d.valor * p} casas={casasDe(d.valor)} unidade={m.unidade} tamanho={tamValor} cor={daVez ? cor.volt : cor.papel} />
                </div>
              ) : null}
              <div
                style={{
                  position: "absolute",
                  left: cx - slot / 2 + 7,
                  width: slot - 14,
                  top: BASE + 22,
                  textAlign: "center",
                  ...rotulo,
                  fontWeight: 700,
                  fontSize: rot.tamanho,
                  letterSpacing: "0.04em",
                  lineHeight: 1.15,
                  color: daVez ? cor.papel : cor.apagado,
                  ...batida(t, d.em, "baixo"),
                }}
              >
                {rot.linhas.map((l, k) => (
                  <div key={k}>{l}</div>
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  } else if (comDados && m.forma === "linha") {
    const pad = 70;
    const xs = dados.map((_, i) => X0 + pad + ((W - 2 * pad) * i) / Math.max(1, dados.length - 1));
    const lo = Math.min(...valores);
    const hi = Math.max(...valores);
    const ys = dados.map((d) => (hi === lo ? BASE - H / 2 : BASE - 30 - ((d.valor - lo) / (hi - lo)) * (H - 30)));
    const tamValor = Math.min(68, Math.floor(((W - 2 * pad) / Math.max(1, dados.length - 1) - 10) / Math.max(1, ...dados.map((d) => larguraValor(d.valor, m.unidade)))));
    const segs = dados.slice(1).map((d) => prog(t, d.em - 0.25, 0.32, Easing.inOut(Easing.cubic)));
    corpo = (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          {[0.33, 0.66].map((f) => (
            <line key={f} x1={X0} x2={X0 + W} y1={BASE - H * f} y2={BASE - H * f} stroke={cor.trilho} strokeWidth={2} opacity={pBase} />
          ))}
          {segs.map((p, i) =>
            p > 0 ? (
              <line
                key={i}
                x1={xs[i]}
                y1={ys[i]}
                x2={xs[i] + (xs[i + 1] - xs[i]) * p}
                y2={ys[i] + (ys[i + 1] - ys[i]) * p}
                stroke={cor.papel}
                strokeWidth={12}
                strokeLinecap="square"
              />
            ) : null,
          )}
        </svg>
        {dados.map((d, i) => {
          const visto = t >= d.em - 0.03;
          const daVez = i === atual;
          const rot = encaixar(caixaAlta(d.rotulo), { largura: (W - 2 * pad) / Math.max(1, dados.length - 1) - 10, max: 40, min: 30, maxLinhas: 2, peso: 700, espacamento: 0.04 });
          return (
            <div key={i}>
              <div
                style={{
                  position: "absolute",
                  left: xs[i] - 17,
                  top: ys[i] - 17,
                  width: 34,
                  height: 34,
                  background: daVez ? cor.volt : cor.papel,
                  ...batida(t, d.em, "baixo"),
                  opacity: visto ? 1 : 0,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: xs[i] - 200,
                  width: 400,
                  top: ys[i] - tamValor - 40,
                  textAlign: "center",
                  fontFamily: mono,
                  fontWeight: 800,
                  fontSize: tamValor,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  color: daVez ? cor.volt : cor.papel,
                  ...batida(t, d.em, "baixo"),
                }}
              >
                <Valor v={d.valor} unidade={m.unidade} tamanho={tamValor} cor={daVez ? cor.volt : cor.papel} />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: xs[i] - 150,
                  width: 300,
                  top: BASE + 22,
                  textAlign: "center",
                  ...rotulo,
                  fontWeight: 700,
                  fontSize: rot.tamanho,
                  letterSpacing: "0.04em",
                  lineHeight: 1.15,
                  color: daVez ? cor.papel : cor.apagado,
                  ...batida(t, d.em, "baixo"),
                }}
              >
                {rot.linhas.map((l, k) => (
                  <div key={k}>{l}</div>
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  } else if (comDados && m.forma === "pizza") {
    const soma = valores.reduce((a, b) => a + Math.max(0, b), 0) || 1;
    const R = 210;
    const cx = X0 + R + 40;
    const cy = TOPO + (BASE - TOPO) / 2 + 20;
    const ESP = 74;
    let acumulado = 0;
    const fatias = dados.map((d) => {
      const a0 = (acumulado / soma) * 360;
      acumulado += Math.max(0, d.valor);
      return { a0, a1: (acumulado / soma) * 360 };
    });
    const arco = (a0: number, a1: number) => {
      const p = (a: number) => [cx + R * Math.sin((a * Math.PI) / 180), cy - R * Math.cos((a * Math.PI) / 180)];
      const [x0, y0] = p(a0);
      const [x1, y1] = p(Math.max(a0 + 0.01, a1));
      return `M ${x0} ${y0} A ${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
    };
    const opac = (i: number) => (i === atual ? 1 : [1, 0.62, 0.4, 0.26, 0.18, 0.12][Math.min(5, Math.abs(atual - i))]);
    const centro = atual >= 0 ? (m.unidade?.trim() === "%" ? formato(dados[atual].valor, "%") : `${formatarNumero(Math.round((Math.max(0, dados[atual].valor) / soma) * 100))}%`) : "";
    const xLeg = cx + R + ESP / 2 + 60;
    const larguraLeg = X0 + W - xLeg;
    corpo = (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.trilho} strokeWidth={ESP} opacity={pBase} />
          {fatias.map((f, i) => {
            const p = prog(t, dados[i].em - 0.02, 0.45, seco);
            return p > 0 ? (
              <path
                key={i}
                d={arco(f.a0 + 1, f.a0 + 1 + (f.a1 - f.a0 - 2) * p)}
                fill="none"
                stroke={i === atual ? cor.volt : cor.papel}
                strokeOpacity={i === atual ? 1 : opac(i)}
                strokeWidth={ESP}
              />
            ) : null;
          })}
        </svg>
        <div
          style={{
            position: "absolute",
            left: cx - R + ESP / 2,
            width: 2 * R - ESP,
            top: cy - 50,
            textAlign: "center",
            fontFamily: mono,
            fontWeight: 800,
            fontSize: Math.min(100, Math.floor((2 * R - ESP - 30) / Math.max(1, larguraMonoEm(centro)))),
            lineHeight: 1,
            color: cor.volt,
          }}
        >
          {centro}
        </div>
        <div style={{ position: "absolute", left: xLeg, top: cy - (dados.length * 118) / 2, width: larguraLeg }}>
          {dados.map((d, i) => {
            const rot = encaixar(d.rotulo, { largura: larguraLeg - 50, max: 48, min: 40, maxLinhas: 2 });
            return (
              <div key={i} style={{ display: "flex", gap: 18, alignItems: "flex-start", minHeight: 118, ...batida(t, d.em, "baixo") }}>
                <div style={{ width: 32, height: 32, marginTop: 6, flexShrink: 0, background: i === atual ? cor.volt : cor.papel, opacity: i === atual ? 1 : opac(i) }} />
                <div>
                  <div style={{ fontFamily: sora, fontWeight: 700, fontSize: rot.tamanho, lineHeight: 1.1, color: i === atual ? cor.papel : cor.apagado }}>
                    {rot.linhas.map((l, k) => (
                      <div key={k}>{l}</div>
                    ))}
                  </div>
                  <div style={{ lineHeight: 1.2 }}>
                    <Valor v={d.valor} unidade={m.unidade} tamanho={46} cor={i === atual ? cor.volt : cor.apagado} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  } else {
    // ——— tendência qualitativa: a linha se desenha durante o momento ———
    const forma = FORMAS[tendencia];
    const inicio = m.tendenciaEm ?? m.de + 0.25;
    const fim = Math.max(inicio + 1.2, Math.min(ctx.fim, m.ate) - 0.35);
    const p = prog(t, inicio, fim - inicio, Easing.inOut(Easing.quad));
    const xs = forma.map((_, i) => X0 + 20 + ((W - 140) * i) / (forma.length - 1));
    const ys = forma.map((f) => BASE - 30 - f * (H - 30));
    // até onde a caneta já foi
    const pos = p * (forma.length - 1);
    const k = Math.min(forma.length - 2, Math.floor(pos));
    const fr = pos - k;
    const px = xs[k] + (xs[k + 1] - xs[k]) * fr;
    const py = ys[k] + (ys[k + 1] - ys[k]) * fr;
    const pontos = [...xs.slice(0, k + 1).map((x, i) => `${x},${ys[i]}`), `${px},${py}`].join(" ");
    corpo = (
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {[0.33, 0.66].map((f) => (
          <line key={f} x1={X0} x2={X0 + W} y1={BASE - H * f} y2={BASE - H * f} stroke={cor.trilho} strokeWidth={2} opacity={pBase} />
        ))}
        {p > 0 ? <polyline points={pontos} fill="none" stroke={cor.papel} strokeWidth={14} strokeLinejoin="miter" strokeLinecap="square" /> : null}
        {p > 0 ? <rect x={px - 18} y={py - 18} width={36} height={36} fill={cor.volt} /> : null}
        <Seta x={xs[xs.length - 1] + 10} y={ys[ys.length - 1] + (tendencia === "sobe" ? 60 : -60)} tendencia={tendencia} p={prog(t, fim - 0.05, 0.25)} />
      </svg>
    );
  }

  // régua do eixo: o traço de base com marcas, como os marcadores do número
  const marcas = 24;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: (1 - s) * entrada }}>
      {ilustrativo ? (
        <div style={{ position: "absolute", left: MARGEM, top: JANELA.y + 8, ...batida(t, m.de + 0.05, "baixo") }}>
          <span style={{ ...rotulo, fontSize: 30, letterSpacing: "0.14em", color: cor.papel, opacity: 0.72, border: `2px solid ${cor.trilho}`, padding: "7px 12px 5px" }}>
            ilustrativo
          </span>
        </div>
      ) : null}
      {tit ? (
        <div
          style={{
            position: "absolute",
            left: MARGEM,
            top: topoTit,
            fontFamily: sora,
            fontWeight: 800,
            fontSize: tit.tamanho,
            lineHeight: 0.94,
            letterSpacing: `${TRACKING}em`,
            color: cor.papel,
            whiteSpace: "nowrap",
            ...batida(t, m.de + 0.05, "baixo"),
          }}
        >
          {tit.linhas.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      ) : null}
      {m.forma !== "pizza" || !comDados ? (
        <>
          <div style={{ position: "absolute", left: X0, top: BASE, width: W * pBase, height: 4, background: cor.papel }} />
          {Array.from({ length: marcas + 1 }).map((_, i) => (
            <div
              key={i}
              style={{ position: "absolute", left: X0 + (W * i) / marcas - 1, top: BASE + 4, width: 3, height: i % 6 === 0 ? 18 : 10, background: cor.trilho, opacity: prog(t, m.de + 0.05 + i * 0.008, 0.2) }}
            />
          ))}
        </>
      ) : null}
      {corpo}
      {!comDados && m.unidade ? (
        <div style={{ position: "absolute", left: X0, top: TOPO - 40, ...rotulo, fontSize: 32, color: cor.apagado }}>{m.unidade}</div>
      ) : null}
    </div>
  );
};
