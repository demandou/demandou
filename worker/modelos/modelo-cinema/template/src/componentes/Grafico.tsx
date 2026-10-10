// Gráfico na "cartela alta": a janela da pessoa desce para a base da tela e a barra de cima vira
// uma cartela preta onde o gráfico se desenha a traço âmbar, como os desenhos das cartelas.
// linha = um traço que avança de ponto em ponto (com o "sol" na ponta); barras = colunas a traço
// que sobem do chão; pizza = um mostrador cujos arcos se fecham um a um. Sem números ditos, a
// forma mostra só a tendência (sobe, cai, oscila), com a etiqueta "ilustrativo".
import { interpolate } from "remotion";
import { prog, saindo, travelling, useTempo } from "../anim";
import { CARTELA_ALTA, type Estado } from "../layout";
import { encaixar, formatarNumero } from "../medida";
import type { Grafico as GraficoT } from "../plano";
import { cor, serif } from "../tema";
import { Credito, Ilustrativo, NaBarra } from "./Barras";

const X0 = 110;
const X1 = 970;

// número com a unidade: "83.000", "12%", "3 mil"
const comUnidade = (v: number, unidade?: string) => {
  const casas = Math.abs(v) < 10 && !Number.isInteger(v) ? 1 : 0;
  const n = formatarNumero(v, casas);
  if (!unidade) return n;
  return unidade === "%" ? `${n}%` : /^(R\$|US\$|\$|€)$/.test(unidade) ? `${unidade} ${n}` : `${n} ${unidade}`;
};

// Um rótulo curto que cabe na largura dada (diminui até 34 px; quebra em até 2 linhas).
const Rotulo: React.FC<{ texto: string; largura: number; opacidade: number; x: number; y: number }> = ({ texto, largura, opacidade, x, y }) => {
  const ws = texto.split(/\s+/).filter(Boolean);
  const enc = encaixar(ws, { largura, max: 44, min: 34, linhas: 2, fonteDe: () => "italico" });
  return (
    <div
      style={{
        position: "absolute",
        left: x - largura / 2,
        width: largura,
        top: y,
        textAlign: "center",
        fontFamily: serif,
        fontStyle: "italic",
        fontWeight: 600,
        fontSize: enc.tamanho,
        lineHeight: 1.08,
        color: cor.marfimSuave,
        opacity: opacidade,
      }}
    >
      {enc.linhas.map((l, i) => (
        <div key={i} style={{ whiteSpace: "nowrap" }}>
          {l.map((k) => ws[k]).join(" ")}
        </div>
      ))}
    </div>
  );
};

const Valor: React.FC<{ texto: string; x: number; y: number; tamanho: number; opacidade: number; subida: number }> = ({ texto, x, y, tamanho, opacidade, subida }) => (
  <div
    style={{
      position: "absolute",
      left: x - 300,
      width: 600,
      top: y - tamanho * 1.15 + (1 - subida) * 12,
      textAlign: "center",
      fontFamily: serif,
      fontWeight: 600,
      fontSize: tamanho,
      lineHeight: 1.1,
      color: cor.marfim,
      opacity: opacidade,
      fontVariantNumeric: "lining-nums",
      whiteSpace: "nowrap",
    }}
  >
    {texto}
  </div>
);

export const Grafico: React.FC<{ m: GraficoT; estado: Estado; primeira: boolean }> = ({ m, estado, primeira }) => {
  const t = useTempo();
  const pronto = primeira ? m.de : m.de + 0.15;
  const sai = saindo(t, m.ate, 0.4);
  const dados = m.dados && m.dados.length >= 2 ? m.dados.slice(0, 6) : null;
  const ilustrativo = !dados || m.ilustrativo;
  const area = { topo: CARTELA_ALTA.topo, base: CARTELA_ALTA.base };
  // título e etiqueta no alto; o desenho ocupa o resto
  const alturaTitulo = (m.titulo ? 84 : 0) + (ilustrativo ? 54 : 0);
  const topoDesenho = area.topo + alturaTitulo + 70;
  const chao = area.base - (dados && m.forma !== "pizza" ? 96 : 30);

  let desenho: React.ReactNode = null;

  if (dados && m.forma === "pizza") {
    // mostrador: cada fatia é um arco que se fecha no seu "em"; a legenda ao lado
    const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
    const altura = chao - topoDesenho;
    const r = Math.min(200, altura / 2 - 30);
    const cx = X0 + r + 20;
    const cy = topoDesenho + altura / 2;
    const cores = [cor.ambar, cor.marfim, cor.frio, cor.ambarClaro, cor.marfimSuave, cor.ambar];
    let acumulado = 0;
    const larguraLegenda = X1 - (cx + r + 60);
    const tamanhoLegenda = Math.max(38, Math.min(56, Math.floor((altura - 20) / (dados.length * 1.9))));
    desenho = (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={cor.marfimApagado} strokeWidth={3} opacity={prog(t, pronto, 0.6)} />
          {dados.map((d, i) => {
            const fatia = Math.max(0, d.valor) / total;
            const inicio = acumulado;
            acumulado += fatia;
            const p = prog(t, d.em - 0.05, 0.9, travelling);
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={cores[i % cores.length]}
                strokeWidth={34}
                pathLength={1}
                strokeDasharray={`${Math.max(0, fatia * p - 0.006).toFixed(4)} 1`}
                strokeDashoffset={-inicio}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
          })}
        </svg>
        <div style={{ position: "absolute", left: cx + r + 60, width: larguraLegenda, top: topoDesenho, height: altura, display: "flex", flexDirection: "column", justifyContent: "center", gap: tamanhoLegenda * 0.5 }}>
          {dados.map((d, i) => {
            const p = prog(t, d.em - 0.05, 0.5);
            const ws = d.rotulo.split(/\s+/).filter(Boolean);
            const enc = encaixar(ws, { largura: larguraLegenda - 40, max: tamanhoLegenda * 0.75, min: 34, linhas: 2, fonteDe: () => "italico" });
            return (
              <div key={i} style={{ display: "flex", gap: 18, alignItems: "flex-start", opacity: 0.3 + 0.7 * p }}>
                <div style={{ width: 22, height: 22, marginTop: tamanhoLegenda * 0.32, borderRadius: 11, background: cores[i % cores.length], flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ fontFamily: serif, fontWeight: 600, fontSize: tamanhoLegenda, lineHeight: 1.05, color: cor.marfim, fontVariantNumeric: "lining-nums" }}>{comUnidade(d.valor, m.unidade ?? "%")}</div>
                  <div style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 600, fontSize: enc.tamanho, lineHeight: 1.08, color: cor.marfimSuave }}>
                    {enc.linhas.map((l, k) => (
                      <div key={k}>{l.map((x) => ws[x]).join(" ")}</div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  } else if (dados) {
    // linha ou barras com os números ditos
    const n = dados.length;
    const passo = (X1 - X0) / n;
    const xs = dados.map((_, i) => X0 + passo * (i + 0.5));
    const valores = dados.map((d) => d.valor);
    const max = Math.max(...valores);
    const min = Math.min(...valores);
    // barras começam do zero; a linha usa a faixa dos valores (com folga), para a forma aparecer
    const baixo = m.forma === "barras" ? Math.min(0, min) : min >= 0 && min < max * 0.35 ? 0 : min - (max - min) * 0.25;
    const alto = max + (max - baixo) * 0.08 || 1;
    const tamanhoValor = Math.max(38, Math.min(60, Math.floor(passo / (Math.max(...dados.map((d) => comUnidade(d.valor, m.unidade).length)) * 0.5))));
    const topoValores = topoDesenho + tamanhoValor * 1.2;
    const ys = valores.map((v) => interpolate(v, [baixo, alto], [chao, topoValores]));
    const larguraRotulo = Math.min(300, passo - 16);
    const eixo = prog(t, pronto, 0.9, travelling);
    if (m.forma === "barras") {
      const larguraBarra = Math.min(150, passo * 0.56);
      desenho = (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <line x1={X0 - 20} x2={X0 - 20 + (X1 - X0 + 40) * eixo} y1={chao} y2={chao} stroke={cor.marfimApagado} strokeWidth={3} />
            {dados.map((d, i) => {
              const p = prog(t, d.em - 0.05, 0.9, travelling);
              const topo = interpolate(p, [0, 1], [chao, ys[i]]);
              return (
                <g key={i}>
                  {/* a lápis antes de ser dito */}
                  <rect x={xs[i] - larguraBarra / 2} y={chao - 60} width={larguraBarra} height={60} fill="none" stroke={cor.marfimApagado} strokeWidth={2} strokeDasharray="8 8" opacity={(1 - p) * prog(t, pronto, 0.5)} />
                  <rect x={xs[i] - larguraBarra / 2} y={topo} width={larguraBarra} height={Math.max(0, chao - topo)} fill={cor.ambar} fillOpacity={0.16} stroke={cor.ambar} strokeWidth={4} opacity={p > 0 ? 1 : 0} />
                </g>
              );
            })}
          </svg>
          {dados.map((d, i) => {
            const p = prog(t, d.em - 0.05, 0.9, travelling);
            return (
              <div key={i}>
                <Valor texto={comUnidade(d.valor, m.unidade)} x={xs[i]} y={interpolate(p, [0, 1], [chao, ys[i]]) - 10} tamanho={tamanhoValor} opacidade={prog(t, d.em + 0.2, 0.5)} subida={prog(t, d.em + 0.2, 0.5)} />
                <Rotulo texto={d.rotulo} largura={larguraRotulo} x={xs[i]} y={chao + 16} opacidade={0.35 + 0.65 * prog(t, d.em - 0.05, 0.4)} />
              </div>
            );
          })}
        </>
      );
    } else {
      // linha: o traço avança de um ponto ao outro no tempo dos números ditos
      const caminho = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
      // quanto do traço já foi desenhado (cada trecho vai do ponto anterior ao seguinte)
      let feito = 0;
      for (let i = 1; i < n; i++) feito += prog(t, dados[i].em - 0.4, 0.6, travelling);
      const comprimentos = xs.slice(1).map((x, i) => Math.hypot(x - xs[i], ys[i + 1] - ys[i]));
      const total = comprimentos.reduce((a, b) => a + b, 0) || 1;
      let desenhado = 0;
      for (let i = 0; i < comprimentos.length; i++) desenhado += comprimentos[i] * Math.min(1, Math.max(0, feito - i));
      const fracao = desenhado / total;
      // a ponta do traço (o "sol" que anda)
      let restante = desenhado;
      let ponta = { x: xs[0], y: ys[0] };
      for (let i = 0; i < comprimentos.length; i++) {
        if (restante <= comprimentos[i]) {
          const f = comprimentos[i] ? restante / comprimentos[i] : 0;
          ponta = { x: xs[i] + (xs[i + 1] - xs[i]) * f, y: ys[i] + (ys[i + 1] - ys[i]) * f };
          break;
        }
        restante -= comprimentos[i];
        ponta = { x: xs[i + 1], y: ys[i + 1] };
      }
      desenho = (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <line x1={X0 - 20} x2={X0 - 20 + (X1 - X0 + 40) * eixo} y1={chao} y2={chao} stroke={cor.marfimApagado} strokeWidth={3} />
            {/* o caminho inteiro a lápis, e o traço âmbar por cima */}
            <path d={caminho} fill="none" stroke={cor.marfimApagado} strokeWidth={2} strokeDasharray="8 10" opacity={0.7 * prog(t, pronto, 0.6)} />
            <path d={caminho} fill="none" stroke={cor.ambar} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - fracao} opacity={prog(t, dados[0].em - 0.05, 0.3)} />
            {dados.map((d, i) => (
              <circle key={i} cx={xs[i]} cy={ys[i]} r={9} fill={cor.preto} stroke={cor.ambar} strokeWidth={4} opacity={prog(t, d.em - 0.05, 0.3)} />
            ))}
            <circle cx={ponta.x} cy={ponta.y} r={16} fill="none" stroke={cor.ambarClaro} strokeWidth={3.5} opacity={prog(t, dados[0].em, 0.3) * (1 - prog(t, dados[n - 1].em + 0.5, 0.5))} />
          </svg>
          {dados.map((d, i) => (
            <div key={i}>
              <Valor texto={comUnidade(d.valor, m.unidade)} x={xs[i]} y={ys[i] - 14} tamanho={tamanhoValor} opacidade={prog(t, d.em, 0.45)} subida={prog(t, d.em, 0.45)} />
              <Rotulo texto={d.rotulo} largura={larguraRotulo} x={xs[i]} y={chao + 16} opacidade={0.35 + 0.65 * prog(t, d.em - 0.05, 0.4)} />
            </div>
          ))}
        </>
      );
    }
  } else {
    // sem números ditos: só a forma da tendência, desenhada do começo ao fim do momento
    const inicio = Math.max(pronto, m.tendenciaEm ?? pronto + 0.1);
    const p = interpolate(t, [inicio, Math.max(inicio + 1.2, m.ate - 0.5)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: travelling });
    const tend = m.tendencia ?? "sobe";
    const alto = topoDesenho + 30;
    const amostras = 60;
    const forma = (u: number) => {
      // u de 0 a 1 → altura de 0 (chão) a 1 (topo), com pequenas ondulações de mercado
      const onda = 0.05 * Math.sin(u * Math.PI * 5.2) + 0.03 * Math.sin(u * Math.PI * 11.3 + 1);
      if (tend === "sobe") return 0.1 + 0.78 * Math.pow(u, 1.35) + onda;
      if (tend === "cai") return 0.88 - 0.78 * Math.pow(u, 1.2) + onda;
      return 0.5 + 0.28 * Math.sin(u * Math.PI * 3) + onda * 0.6;
    };
    const ponto = (u: number) => ({ x: X0 + (X1 - X0) * u, y: interpolate(forma(u), [0, 1], [chao - 10, alto]) });
    if (m.forma === "barras") {
      const n = 6;
      const passo = (X1 - X0) / n;
      const lb = passo * 0.52;
      desenho = (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <line x1={X0 - 20} x2={X1 + 20} y1={chao} y2={chao} stroke={cor.marfimApagado} strokeWidth={3} opacity={prog(t, pronto, 0.6)} />
          {Array.from({ length: n }, (_, i) => {
            const u = (i + 0.5) / n;
            const q = Math.min(1, Math.max(0, p * n - i));
            const topo = interpolate(q, [0, 1], [chao, ponto(u).y], { easing: travelling });
            const x = X0 + passo * (i + 0.5);
            return (
              <g key={i}>
                <rect x={x - lb / 2} y={chao - 50} width={lb} height={50} fill="none" stroke={cor.marfimApagado} strokeWidth={2} strokeDasharray="8 8" opacity={1 - q} />
                <rect x={x - lb / 2} y={topo} width={lb} height={Math.max(0, chao - topo)} fill={cor.ambar} fillOpacity={0.16} stroke={cor.ambar} strokeWidth={4} opacity={q > 0 ? 1 : 0} />
              </g>
            );
          })}
        </svg>
      );
    } else {
      const pts = Array.from({ length: amostras + 1 }, (_, i) => ponto(i / amostras));
      const caminho = pts.map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" ");
      const ponta = ponto(p);
      desenho = (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <line x1={X0 - 20} x2={X1 + 20} y1={chao} y2={chao} stroke={cor.marfimApagado} strokeWidth={3} opacity={prog(t, pronto, 0.6)} />
          <path d={caminho} fill="none" stroke={cor.ambar} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
          <circle cx={ponta.x} cy={ponta.y} r={18} fill="none" stroke={cor.ambarClaro} strokeWidth={3.5} opacity={prog(t, inicio, 0.3)} />
        </svg>
      );
    }
  }

  return (
    <NaBarra lado="cima" estado={estado}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - sai, filter: sai > 0.02 ? `blur(${(sai * 6).toFixed(2)}px)` : undefined }}>
        <div style={{ position: "absolute", left: 70, right: 70, top: area.topo, height: alturaTitulo + 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          {m.titulo ? <Credito texto={m.titulo} em={pronto} largura={940} tamanho={34} limite={dados?.[0]?.em ?? m.tendenciaEm} /> : null}
          {ilustrativo ? <Ilustrativo em={pronto + 0.2} /> : null}
        </div>
        {desenho}
      </div>
    </NaBarra>
  );
};
