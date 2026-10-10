// O quadro de giz dos blocos universais na prancheta: gramado com faixas de corte, moldura de giz e,
// por cima, fichas, setas tracejadas, a bola e tarjas de TV com o conteúdo. Lista = fichas com
// rótulos; passos = fichas ligadas por passes (a bola rola); comparação = o campo dividido ao meio;
// gráfico = barras, rota e círculo central de giz. Tudo na fala: o esboço já está em giz apagado.
import { Linhas, prog, temposDoTexto, Traco, varredura, conteudoDaTarja, entra as easeEntra } from "../anim";
import { diagramar, medir } from "../medidas";
import type { Comparacao, Grafico, Item, Palavra, Universal } from "../plano";
import { cor, fonte, H, larga, normal, rotulo, W } from "../tema";
import { BolaSvg, Ficha } from "./Pecas";

const X0 = 60;
const X1 = 1020;
const Y0 = 720;
const Y1 = 1520;
const CENTRO = { x: 540, y: 1120 };

const suave = (x: number) => 1 - Math.pow(1 - x, 3);

// ---------- peças ----------

// Tarja de TV alinhada à esquerda: varre na fala; antes disso, só o contorno de giz apagado e o texto fantasma
const Tarja: React.FC<{ x: number; y: number; w: number; h: number; em: number; t: number; children: React.ReactNode; destaque?: boolean }> = ({ x, y, w, h, em, t, children, destaque }) => {
  const p = prog(t, em - 0.08, 0.4);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      {p < 0.98 ? <div style={{ position: "absolute", inset: 0, borderRadius: 8, outline: `3px dashed ${cor.gizApagado}`, outlineOffset: -3, opacity: 1 - p }} /> : null}
      <div style={{ position: "absolute", inset: 0, clipPath: varredura(p, 8), background: destaque ? cor.placar : cor.tv, borderRadius: 8, boxShadow: "0 10px 24px rgba(0,0,0,0.28)" }}>
        {!destaque ? <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 10, background: cor.placar }} /> : null}
      </div>
      <div style={{ position: "absolute", inset: 0, ...conteudoDaTarja(Math.max(p, 0.5)) }}>{children}</div>
    </div>
  );
};

const Seta: React.FC<{ de: { x: number; y: number }; para: { x: number; y: number }; p: number; cor?: string }> = ({ de, para, p, cor: tinta = cor.giz }) => {
  if (p <= 0.001) return null;
  const ang = Math.atan2(para.y - de.y, para.x - de.x);
  const fim = { x: de.x + (para.x - de.x) * p, y: de.y + (para.y - de.y) * p };
  const ponta = 30;
  const base = { x: fim.x - Math.cos(ang) * ponta * 0.75, y: fim.y - Math.sin(ang) * ponta * 0.75 };
  const asa = (s: number) => `${base.x + Math.cos(ang + (s * Math.PI) / 2) * ponta * 0.55},${base.y + Math.sin(ang + (s * Math.PI) / 2) * ponta * 0.55}`;
  return (
    <g>
      <line x1={de.x} y1={de.y} x2={base.x} y2={base.y} stroke={tinta} strokeWidth={7} strokeDasharray="22 15" />
      <polygon points={`${fim.x},${fim.y} ${asa(1)} ${asa(-1)}`} fill={tinta} stroke={tinta} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
};

const Fundo: React.FC<{ t: number; entra: number }> = ({ t, entra }) => {
  const p = prog(t, entra + 0.05, 0.6);
  const faixas = Array.from({ length: 16 }, (_, i) => i);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <rect x={0} y={0} width={W} height={H} fill={cor.foraDoCampo} />
      {faixas.map((i) => (
        <rect key={i} x={0} y={660 + i * 100} width={W} height={100.5} fill={i % 2 ? cor.grama : cor.gramaClara} />
      ))}
      <rect x={0} y={0} width={W} height={660} fill={cor.foraDoCampo} />
      <Traco d={`M ${X0} ${Y0 - 20} H ${X1} V ${Y1 + 20} H ${X0} Z`} p={p} cor={cor.giz} largura={6} opacity={0.9} />
    </svg>
  );
};

const temposDe = (texto: string, palavras: Palavra[], m: { de: number; ate: number }, em: number) => temposDoTexto(texto, palavras, m.de, m.ate, em);

// ---------- lista e passos ----------

const Lista: React.FC<{ m: Extract<Universal, { tipo: "topicos" | "passos" }>; palavras: Palavra[]; t: number; entra: number }> = ({ m, palavras, t, entra }) => {
  const ordenada = m.tipo === "passos";
  const itens = m.itens;
  const n = itens.length;
  const linha = Math.min(210, (Y1 - Y0 - 40) / n);
  const topo = Y0 + 10 + ((Y1 - Y0 - 40) - linha * n) / 2;
  const r = n >= 5 ? 46 : n >= 4 ? 56 : 66;
  const xF = X0 + 30 + r + 16;
  const xT = xF + r + 34;
  const wT = X1 - 24 - xT;
  const yc = (i: number) => topo + linha * (i + 0.5);
  const alturaTarja = Math.min(linha - 24, 150);
  // a bola: parada na primeira ficha; rola de uma ficha à seguinte quando o próximo passo é dito
  const bola = (() => {
    if (!ordenada) return null;
    let pos = { x: xF + r + 18, y: yc(0) + r * 0.5 };
    let giro = 0;
    for (let i = 1; i < n; i++) {
      const u = prog(t, itens[i].em - 0.5, 0.5, (x) => x * x * (3 - 2 * x));
      const de = { x: xF + r + 18, y: yc(i - 1) + r * 0.5 };
      const para = { x: xF + r + 18, y: yc(i) + r * 0.5 };
      if (u > 0) {
        pos = { x: de.x + (para.x - de.x) * u, y: de.y + (para.y - de.y) * u };
        giro = (i - 1 + u) * 360;
      }
    }
    return { ...pos, giro };
  })();
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {ordenada
          ? itens.slice(1).map((it, i) => {
              const de = { x: xF, y: yc(i) + r * 0.5 + 12 };
              const para = { x: xF, y: yc(i + 1) - r * 1.1 - 8 };
              return <Seta key={i} de={de} para={para} p={prog(t, it.em - 0.5, 0.45)} />;
            })
          : null}
        {itens.map((it, i) => {
          const p = prog(t, it.em - 0.1, 0.4);
          return (
            <g key={i}>
              {p < 0.98 ? <circle cx={xF} cy={yc(i)} r={r} fill="none" stroke={cor.gizApagado} strokeWidth={4} strokeDasharray="10 9" opacity={1 - p} /> : null}
              <Ficha x={xF} y={yc(i) + r * 0.62} r={r} time="nosso" numero={ordenada ? String(i + 1) : undefined} p={p} fonte={fonte} />
            </g>
          );
        })}
        {bola ? <BolaSvg x={bola.x} y={bola.y} r={24} giro={bola.giro} sombra={false} opacidade={prog(t, itens[0].em - 0.1, 0.3)} /> : null}
      </svg>
      {itens.map((it, i) => {
        const comDetalhe = !!it.detalhe && alturaTarja >= 120;
        const cabe = diagramar(it.texto.toUpperCase(), { largura: wT - 70, maximo: 72, minimo: 34, linhas: 2, altura: alturaTarja - 20 - (comDetalhe ? 38 : 0), entrelinha: 1.04 });
        const tempos = temposDe(it.texto, palavras, m, it.em);
        const det = comDetalhe ? diagramar(it.detalhe!, { largura: wT - 70, maximo: 34, minimo: 26, linhas: 1, corte: "normal600" }) : null;
        const alturaTexto = cabe.linhas.length * cabe.tam * 1.04 + (det ? 8 + det.tam * 1.16 : 0);
        return (
          <Tarja key={i} x={xT} y={yc(i) - alturaTarja / 2} w={wT} h={alturaTarja} em={it.em} t={t}>
            <div style={{ position: "absolute", left: 40, right: 24, top: (alturaTarja - alturaTexto) / 2 }}>
              <Linhas linhas={cabe.linhas} tempos={tempos} t={t} fantasma={0.22} style={{ ...larga, fontSize: cabe.tam, color: cor.giz, gap: cabe.tam * 0.04 }} />
              {det ? <div style={{ ...normal, fontSize: det.tam, color: cor.tvTexto, marginTop: 8, whiteSpace: "nowrap", opacity: prog(t, it.em + 0.2, 0.3) }}>{det.linhas.join(" ")}</div> : null}
            </div>
          </Tarja>
        );
      })}
    </>
  );
};

// ---------- comparação ----------

const SELO = { "errado-certo": ["Errado", "Certo"], "antes-depois": ["Antes", "Agora"], contra: ["", "Melhor"] } as const;

const Comparar: React.FC<{ m: Comparacao; palavras: Palavra[]; t: number; entra: number }> = ({ m, palavras, t, entra }) => {
  const modo = m.modo ?? "contra";
  const venc = m.vencedor !== undefined && m.vencedorEm !== undefined ? prog(t, m.vencedorEm - 0.05, 0.5) : 0;
  const larg = (X1 - X0 - 30) / 2;
  const xs = [X0 + 6, X0 + 6 + larg + 18];
  const centros = xs.map((x) => x + larg / 2);
  const pLinha = prog(t, entra + 0.15, 0.5);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Traco d={`M ${CENTRO.x} ${Y0 - 20} V ${Y1 + 20}`} p={pLinha} cor={cor.giz} largura={5} opacity={0.8} />
        {m.vencedor !== undefined ? <rect x={xs[m.vencedor] - 6} y={Y0 - 16} width={larg + 12} height={Y1 - Y0 + 32} fill={cor.placarFundo} opacity={venc} /> : null}
        {m.vencedor !== undefined ? <rect x={xs[1 - m.vencedor] - 6} y={Y0 - 16} width={larg + 12} height={Y1 - Y0 + 32} fill="rgba(6,22,13,0.45)" opacity={venc} /> : null}
        {m.lados.map((lado, i) => {
          const p = prog(t, lado.em - 0.1, 0.42);
          const time = modo === "errado-certo" ? (i === 0 ? "adversario" : "nosso") : i === 0 ? "nosso" : "adversario";
          const ganha = m.vencedor === i ? venc : 0;
          const cy = 872;
          const r = 76;
          return (
            <g key={i}>
              {p < 0.98 ? <circle cx={centros[i]} cy={cy} r={r} fill="none" stroke={cor.gizApagado} strokeWidth={4} strokeDasharray="10 9" opacity={1 - p} /> : null}
              {ganha > 0 ? <circle cx={centros[i]} cy={cy} r={(r + 14) * (1 + 0.4 * (1 - ganha))} fill="none" stroke={cor.placar} strokeWidth={7} opacity={ganha} /> : null}
              <Ficha x={centros[i]} y={cy + r * 0.62} r={r} time={time} numero={modo === "errado-certo" && i === 0 ? "×" : undefined} p={p} fonte={fonte} />
              {modo === "errado-certo" && i === 1 ? <g transform={`translate(${centros[i] - 34} ${cy - 30})`}><Traco d="M 4 34 L 26 56 L 66 8" p={prog(t, lado.em + 0.05, 0.4)} cor={cor.tv} largura={11} /></g> : null}
            </g>
          );
        })}
        {modo === "antes-depois" ? <Seta de={{ x: centros[0] + 100, y: 872 }} para={{ x: centros[1] - 110, y: 872 }} p={prog(t, m.lados[1].em - 0.35, 0.4)} /> : null}
      </svg>
      {m.lados.map((lado, i) => {
        const rot = lado.rotulo || SELO[modo][i];
        const rotTam = diagramar(rot.toUpperCase(), { largura: larg - 70, maximo: 50, minimo: 28, linhas: 1, corte: "rotulo", espacamento: 0.07 });
        const tx = diagramar(lado.texto.toUpperCase(), { largura: larg - 64, maximo: 72, minimo: 32, linhas: 3, linhasMax: 5, altura: Y1 - 1100 - 40, entrelinha: 1.05 });
        const tempos = temposDe(lado.texto, palavras, m, lado.em);
        const alturaTexto = Math.min(Y1 - 1100 - 30, tx.linhas.length * tx.tam * 1.05 + 54);
        return (
          <div key={i}>
            <Tarja x={xs[i]} y={988} w={larg} h={78} em={lado.em} t={t} destaque={i === 1 && modo !== "contra" ? false : false}>
              <div style={{ position: "absolute", left: 34, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
                <span style={{ ...rotulo, fontSize: rotTam.tam, color: cor.placar, whiteSpace: "nowrap" }}>{rot}</span>
              </div>
            </Tarja>
            <Tarja x={xs[i]} y={1086} w={larg} h={alturaTexto} em={lado.em + 0.1} t={t}>
              <div style={{ position: "absolute", left: 34, right: 20, top: 26 }}>
                <Linhas linhas={tx.linhas} tempos={tempos} t={t} fantasma={0.22} style={{ ...larga, fontSize: tx.tam, color: cor.giz, gap: tx.tam * 0.05 }} />
              </div>
            </Tarja>
          </div>
        );
      })}
      {m.vencedor !== undefined && m.vencedorEm !== undefined && venc > 0 ? (
        <div style={{ position: "absolute", left: centros[m.vencedor] - 110, top: 742, width: 220, display: "flex", justifyContent: "center", opacity: venc, translate: `0 ${(1 - venc) * -14}px` }}>
          <div style={{ background: cor.placar, borderRadius: 8, padding: "10px 26px" }}>
            <span style={{ ...rotulo, fontSize: 38, color: cor.tv }}>{SELO[modo][1]}</span>
          </div>
        </div>
      ) : null}
    </>
  );
};

// ---------- gráfico ----------

const fmt = (v: number, unidade?: string) => {
  const casas = Math.min(2, (String(v).split(".")[1] ?? "").length);
  const [i, f] = Math.abs(v).toFixed(casas).split(".");
  const n = `${v < 0 ? "−" : ""}${i.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${f ? `,${f}` : ""}`;
  if (!unidade) return n;
  if (/^(r\$|us\$|€|\$)/i.test(unidade)) return `${unidade} ${n}`;
  return unidade === "%" ? `${n}%` : `${n} ${unidade}`;
};
const fmtAnim = (v: number, p: number, unidade?: string) => {
  const casas = Math.min(2, (String(v).split(".")[1] ?? "").length);
  return fmt(p >= 0.999 ? v : Math.round(v * p * 10 ** casas) / 10 ** casas, unidade);
};
const FATIAS = [cor.placar, cor.giz, "#5BC088", "#2C8A5A", "#E8B43A", cor.tv];

const perfil = (tendencia: "sobe" | "cai" | "oscila") => {
  const base = tendencia === "sobe" ? [0.9, 0.78, 0.8, 0.58, 0.46, 0.3, 0.12] : tendencia === "cai" ? [0.12, 0.26, 0.22, 0.46, 0.58, 0.78, 0.9] : [0.5, 0.24, 0.62, 0.2, 0.7, 0.3, 0.5];
  return base.map((y, i) => ({ x: i / (base.length - 1), y }));
};
const suavizarCurva = (pts: { x: number; y: number }[], amostras = 14) => {
  const saida: { x: number; y: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < amostras; k++) {
      const f = k / amostras;
      const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
      saida.push({ x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  saida.push(pts[pts.length - 1]);
  return saida;
};

const Grafica: React.FC<{ m: Grafico; palavras: Palavra[]; t: number; entra: number }> = ({ m, t }) => {
  const dados = m.dados?.length ? m.dados : null;
  const ilustrativo = m.ilustrativo || !dados;
  const area = { x: X0 + 50, y: Y0 + 90, w: X1 - X0 - 100, h: Y1 - Y0 - 150 };
  const chip = ilustrativo ? (
    <div style={{ position: "absolute", right: X0 + 30, top: Y0 + 14, background: cor.tv, borderRadius: 6, padding: "8px 18px" }}>
      <span style={{ ...rotulo, fontSize: 30, color: cor.placar }}>Ilustrativo</span>
    </div>
  ) : null;
  let conteudo: React.ReactNode;
  if (dados && m.forma === "barras") {
    const n = dados.length;
    const gap = 30;
    const largBarra = Math.min(170, (area.w - gap * (n - 1)) / n);
    const x0 = area.x + (area.w - (n * largBarra + (n - 1) * gap)) / 2;
    const base = area.y + area.h - 90;
    const maxH = base - area.y - 70;
    const maximo = Math.max(...dados.map((d) => Math.abs(d.valor)), 1e-9);
    conteudo = (
      <>
        <div style={{ position: "absolute", left: area.x, top: base + 2, width: area.w, height: 5, borderRadius: 3, background: cor.giz, opacity: 0.8 }} />
        {dados.map((d, i) => {
          const p = suave(prog(t, d.em - 0.05, 0.65, (x) => x));
          const h = Math.max(8, (Math.abs(d.valor) / maximo) * maxH) * p;
          const x = x0 + i * (largBarra + gap);
          const val = diagramar(fmt(d.valor, m.unidade).toUpperCase(), { largura: largBarra + gap, maximo: 48, minimo: 26, linhas: 1 });
          const rot = diagramar(d.rotulo.toUpperCase(), { largura: largBarra + gap - 6, maximo: 32, minimo: 22, linhas: 2, corte: "rotulo", espacamento: 0.05 });
          return (
            <div key={i}>
              <div style={{ position: "absolute", left: x, top: base - h, width: largBarra, height: h, background: cor.placar, borderRadius: "8px 8px 0 0", opacity: p > 0 ? 1 : 0 }} />
              {p <= 0 ? <div style={{ position: "absolute", left: x, top: base - 14, width: largBarra, height: 14, border: `3px dashed ${cor.gizApagado}`, borderRadius: 4, boxSizing: "border-box" }} /> : null}
              <div style={{ position: "absolute", left: x - gap / 2, width: largBarra + gap, top: base - h - 14 - val.tam, textAlign: "center", ...larga, fontSize: val.tam, color: cor.giz, whiteSpace: "nowrap", opacity: p > 0.05 ? 1 : 0 }}>{fmtAnim(d.valor, p, m.unidade)}</div>
              <div style={{ position: "absolute", left: x - gap / 2 + 3, width: largBarra + gap - 6, top: base + 20, textAlign: "center", ...rotulo, letterSpacing: "0.05em", fontSize: rot.tam, lineHeight: 1.1, color: cor.giz }}>
                {rot.linhas.map((l, k) => (
                  <div key={k} style={{ whiteSpace: "nowrap" }}>{l}</div>
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  } else if (dados && m.forma === "pizza") {
    const R = 240;
    const cx = X0 + 60 + R;
    const cy = CENTRO.y;
    const soma = dados.reduce((s, d) => s + Math.abs(d.valor), 0) || 1;
    let acc = 0;
    const fatias = dados.map((d, i) => {
      const a0 = (acc / soma) * Math.PI * 2 - Math.PI / 2;
      acc += Math.abs(d.valor);
      return { d, i, a0, a1: (acc / soma) * Math.PI * 2 - Math.PI / 2 };
    });
    const xLeg = cx + R + 50;
    const wLeg = X1 - 20 - xLeg;
    const linhaH = Math.min(96, 520 / dados.length);
    conteudo = (
      <>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.gizApagado} strokeWidth={5} strokeDasharray="10 9" />
          {fatias.map(({ d, i, a0, a1 }) => {
            const p = suave(prog(t, d.em - 0.05, 0.6, (x) => x));
            if (p <= 0.001) return null;
            const fim = a0 + (a1 - a0) * p;
            const grande = fim - a0 > Math.PI ? 1 : 0;
            const pt = (a: number) => `${(cx + Math.cos(a) * R).toFixed(1)} ${(cy + Math.sin(a) * R).toFixed(1)}`;
            const dd = a1 - a0 >= Math.PI * 2 - 1e-3 ? `M${cx - R} ${cy} A${R} ${R} 0 1 1 ${cx + R} ${cy} A${R} ${R} 0 1 1 ${cx - R} ${cy} Z` : `M${cx} ${cy} L${pt(a0)} A${R} ${R} 0 ${grande} 1 ${pt(fim)} Z`;
            return <path key={i} d={dd} fill={FATIAS[i % FATIAS.length]} stroke={cor.giz} strokeWidth={5} strokeLinejoin="round" />;
          })}
          <circle cx={cx} cy={cy} r={R * 0.22} fill={cor.grama} stroke={cor.giz} strokeWidth={5} />
        </svg>
        {dados.map((d, i) => {
          const a = prog(t, d.em - 0.08, 0.35);
          const rot = diagramar(d.rotulo.toUpperCase(), { largura: wLeg - 150, maximo: 40, minimo: 24, linhas: 1, corte: "rotulo", espacamento: 0.05 });
          return (
            <div key={i} style={{ position: "absolute", left: xLeg, top: cy - (dados.length * linhaH) / 2 + i * linhaH, width: wLeg, height: linhaH - 12, display: "flex", alignItems: "center", gap: 14, background: cor.tv, borderRadius: 8, padding: "0 20px", opacity: 0.35 + 0.65 * a }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: FATIAS[i % FATIAS.length], border: `2px solid ${cor.giz}`, flex: "none" }} />
              <span style={{ ...rotulo, letterSpacing: "0.05em", fontSize: rot.tam, color: cor.giz, whiteSpace: "nowrap" }}>{rot.linhas.join(" ")}</span>
              <span style={{ ...larga, marginLeft: "auto", fontSize: Math.min(44, rot.tam + 6), color: cor.placar, whiteSpace: "nowrap" }}>{fmt(d.valor, m.unidade).toUpperCase()}</span>
            </div>
          );
        })}
      </>
    );
  } else {
    // linha (com números) ou perfil qualitativo (sobe, cai, oscila)
    const mx = 40;
    const aw = area.w - 2 * mx;
    const topoPlot = area.y + 70;
    const ah = area.h - 70 - 110;
    const baseY = topoPlot + ah + 26;
    let pontos: { x: number; y: number }[];
    let marcados: { x: number; y: number; em: number; rotulo: string; valor: number }[] = [];
    if (dados) {
      const vs = dados.map((d) => d.valor);
      const mn = Math.min(...vs);
      const faixa = Math.max(...vs) - mn || 1;
      marcados = dados.map((d, i) => ({ x: area.x + mx + (dados.length === 1 ? aw / 2 : (i / (dados.length - 1)) * aw), y: topoPlot + ah * (1 - (0.08 + 0.84 * ((d.valor - mn) / faixa))), em: d.em, rotulo: d.rotulo, valor: d.valor }));
      pontos = marcados;
    } else pontos = suavizarCurva(perfil(m.tendencia ?? "sobe")).map((q) => ({ x: area.x + mx + q.x * aw, y: topoPlot + q.y * ah }));
    const caminho = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const inicio = m.tendenciaEm ?? m.de + 0.6;
    const u = prog(t, inicio - 0.1, 1.8, (x) => x);
    const ate = Math.max(2, Math.round(pontos.length * u));
    const ponta = pontos[Math.min(pontos.length - 1, ate - 1)];
    conteudo = (
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={`M ${area.x + 10} ${topoPlot - 10} V ${baseY} H ${area.x + area.w}`} fill="none" stroke={cor.giz} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
        <path d={caminho(pontos)} fill="none" stroke={cor.gizApagado} strokeWidth={6} strokeDasharray="10 14" strokeLinecap="round" />
        {dados ? (
          <>
            {marcados.slice(1).map((q, i) => {
              const a = marcados[i];
              const p = prog(t, q.em - 0.5, 0.5);
              return p > 0 ? <line key={i} x1={a.x} y1={a.y} x2={a.x + (q.x - a.x) * p} y2={a.y + (q.y - a.y) * p} stroke={cor.giz} strokeWidth={8} strokeDasharray="22 15" /> : null;
            })}
            {marcados.map((q, i) => {
              const p = prog(t, q.em - 0.12, 0.4);
              const val = diagramar(fmt(q.valor, m.unidade).toUpperCase(), { largura: 220, maximo: 46, minimo: 26, linhas: 1 });
              const rot = diagramar(q.rotulo.toUpperCase(), { largura: Math.min(190, aw / Math.max(1, marcados.length - 1) + 10), maximo: 30, minimo: 20, linhas: 2, corte: "rotulo", espacamento: 0.05 });
              const ancora = i === 0 ? "start" : i === marcados.length - 1 ? "end" : "middle";
              return (
                <g key={i}>
                  <Ficha x={q.x} y={q.y + 14} r={30} time="nosso" p={p} fonte={fonte} />
                  <text x={q.x} y={q.y - 52} textAnchor={ancora} fill={cor.giz} opacity={p > 0.05 ? 1 : 0} style={{ ...larga, fontSize: val.tam, fontFamily: fonte, fontWeight: 900, fontStretch: "125%" }}>
                    {fmtAnim(q.valor, p, m.unidade).toUpperCase()}
                  </text>
                  {rot.linhas.map((l, k) => (
                    <text key={k} x={q.x} y={baseY + 44 + k * rot.tam * 1.1} textAnchor={ancora} fill={cor.giz} style={{ fontFamily: fonte, fontWeight: 800, fontStretch: "112.5%", fontSize: rot.tam, letterSpacing: "0.05em" }}>
                      {l}
                    </text>
                  ))}
                </g>
              );
            })}
          </>
        ) : u > 0 ? (
          <g>
            <path d={caminho(pontos.slice(0, ate))} fill="none" stroke={cor.placar} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
            <BolaSvg x={ponta.x} y={ponta.y - 22} r={26} giro={u * 900} sombra={false} />
          </g>
        ) : null}
      </svg>
    );
  }
  return (
    <>
      {conteudo}
      {chip}
    </>
  );
};

// ---------- o quadro ----------

export const Quadro: React.FC<{ universal: Universal; palavras: Palavra[]; t: number; entra: number }> = ({ universal, palavras, t, entra }) => {
  const p = prog(t, entra, 0.5, easeEntra);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, overflow: "hidden", background: cor.foraDoCampo }}>
      <Fundo t={t} entra={entra} />
      <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, p * 2) }}>
        {universal.tipo === "topicos" || universal.tipo === "passos" ? <Lista m={universal} palavras={palavras} t={t} entra={entra} /> : null}
        {universal.tipo === "comparacao" ? <Comparar m={universal} palavras={palavras} t={t} entra={entra} /> : null}
        {universal.tipo === "grafico" ? <Grafica m={universal} palavras={palavras} t={t} entra={entra} /> : null}
      </div>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 85% 70% at 50% 58%, rgba(0,0,0,0) 55%, rgba(4,20,10,0.42) 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 720, background: "linear-gradient(to bottom, rgba(6,22,13,0.55) 0%, rgba(6,22,13,0.35) 55%, rgba(6,22,13,0) 100%)" }} />
    </div>
  );
};

export type { Item };
void medir;
