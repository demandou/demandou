// Os cartões dos blocos universais que acontecem no mapa: lista (topicos e passos), comparação e gráfico.
// Todos de papel, na faixa alta de baixo do mapa: nascem "a lápis" e ganham tinta no instante em que cada
// item é dito, com a rota, os pinos e os carimbos do Roteiro.
import { limitar, misturarCor, prog } from "../anim";
import { alturaDe, encaixar, encaixarNaCaixa, numeroBR } from "../medida";
import { cor, display, sans } from "../tema";
import { Carimbo } from "./Carimbo";
import { type Caixa, Papel, Rotulo } from "./Papel";

export type ItemLista = { texto: string; em: number; detalhe?: string };
export type FichaLista = { tipo: "lista"; em: number; ordenada: boolean; titulo?: string; itens: ItemLista[] };
export type FichaComparacao = {
  tipo: "comparacao";
  em: number;
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};
export type FichaGrafico = {
  tipo: "grafico";
  em: number;
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
};

const PAD = 30;
const suave = (x: number) => 1 - Math.pow(1 - x, 3);

// Título do cartão (quando o bloco não tem a cartela de título no alto da tela)
const Titulo: React.FC<{ texto: string; largura: number; tinta: number }> = ({ texto, largura, tinta }) => {
  const e = encaixar(texto, { largura, max: 54, min: 34, linhas: 1, fonte: { italico: true, peso: 600 } });
  return (
    <div style={{ position: "absolute", left: PAD + 4, top: PAD - 4, height: 66, display: "flex", alignItems: "center", fontFamily: display, fontStyle: "italic", fontWeight: 600, fontSize: e.tamanho, color: misturarCor(cor.lapis, cor.azulejo, tinta), whiteSpace: "nowrap" }}>
      {e.linhas.join(" ")}
    </div>
  );
};

// ---------- lista: topicos (marcadores) e passos (rota numerada) ----------

export const CartaoLista: React.FC<{ f: FichaLista; caixa: Caixa; t: number }> = ({ f, caixa: caixaFaixa, t }) => {
  let caixa = caixaFaixa;
  const n = f.itens.length;
  const tinta = prog(t, f.itens[0].em - 0.2, 0.45);
  const temTitulo = !!f.titulo;
  const topo = PAD + (temTitulo ? 76 : 4);
  const area = caixa.h - PAD - topo;
  const rh = Math.min(150, area / n);
  // o cartão acompanha o conteúdo: poucos itens, cartão mais baixo
  const altura = Math.min(caixa.h, topo + n * rh + PAD);
  caixa = { ...caixa, h: altura };
  const marcador = n >= 4 ? 56 : 64;
  const xTexto = PAD + 8 + marcador + 26;
  const larguraTexto = caixa.w - xTexto - PAD - 4;
  const yLinha = (i: number) => topo + i * rh + rh / 2;
  return (
    <Papel caixa={caixa} tinta={tinta} giro={-0.5}>
      {temTitulo ? <Titulo texto={f.titulo!} largura={caixa.w - 2 * PAD - 10} tinta={tinta} /> : null}
      {f.ordenada ? (
        <svg width={caixa.w} height={caixa.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {f.itens.slice(1).map((it, k) => {
            const x = PAD + 8 + marcador / 2;
            const y0 = yLinha(k) + marcador / 2 + 4;
            const y1 = yLinha(k + 1) - marcador / 2 - 4;
            const p = prog(t, it.em - 0.5, 0.5);
            return (
              <g key={k}>
                <line x1={x} y1={y0} x2={x} y2={y1} stroke={cor.lapis} strokeWidth={4} strokeDasharray="1 11" strokeLinecap="round" opacity={0.8} />
                {p > 0 ? <line x1={x} y1={y0} x2={x} y2={y0 + (y1 - y0) * p} stroke={cor.azulejo} strokeWidth={7} strokeDasharray="0.1 14" strokeLinecap="round" /> : null}
              </g>
            );
          })}
        </svg>
      ) : null}
      {f.itens.map((it, i) => {
        const a = prog(t, it.em - 0.1, 0.35);
        const barra = prog(t, it.em - 0.05, 0.5);
        const pop = 1 + 0.16 * Math.sin(Math.PI * limitar(prog(t, it.em - 0.1, 0.4)));
        const comDetalhe = !!it.detalhe && rh >= 112;
        const enc = encaixarNaCaixa(it.texto, { largura: larguraTexto - 20, altura: rh - 14 - (comDetalhe ? 44 : 0), max: 64, min: 36, linhas: 2, fonte: { peso: 600 }, entrelinha: 1.05 });
        const det = comDetalhe ? encaixar(it.detalhe!, { largura: larguraTexto - 20, max: 34, min: 24, linhas: 1, fonte: { familia: "sans", peso: 500 } }) : null;
        const y = yLinha(i);
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: xTexto - 14,
                top: y - (rh - 12) / 2,
                width: larguraTexto,
                height: rh - 12,
                borderRadius: 16,
                background: cor.azulejoVeu,
                opacity: 0.85,
                transformOrigin: "left center",
                scale: `${suave(barra)} 1`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: PAD + 8,
                top: y - marcador / 2,
                width: marcador,
                height: marcador,
                borderRadius: marcador / 2,
                background: misturarCor(cor.papel, cor.azulejo, a),
                border: `3px ${a > 0.5 ? "solid" : "dashed"} ${misturarCor(cor.lapis, cor.azulejo, a)}`,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                scale: String(pop),
              }}
            >
              {f.ordenada ? (
                <span style={{ fontFamily: sans, fontWeight: 700, fontSize: marcador * 0.56, color: misturarCor(cor.lapis, cor.papel, a) }}>{i + 1}</span>
              ) : (
                <svg width={marcador * 0.5} height={marcador * 0.5} viewBox="-10 -10 20 20">
                  <path d="M0 -9 L9 0 L0 9 L-9 0 Z" fill={misturarCor(cor.lapis, cor.papel, a)} />
                  <circle r={2.6} fill={misturarCor(cor.lapis, cor.sol, a)} />
                </svg>
              )}
            </div>
            <div
              style={{
                position: "absolute",
                left: xTexto,
                top: y - (enc.linhas.length * enc.tamanho * 1.05 + (det ? 40 : 0)) / 2,
                width: larguraTexto - 20,
                fontFamily: display,
                fontWeight: 600,
                fontSize: enc.tamanho,
                lineHeight: 1.05,
                color: misturarCor(cor.lapis, cor.tinta, a),
                translate: `${(1 - a) * -10}px 0`,
              }}
            >
              {enc.linhas.map((l, k) => (
                <div key={k} style={{ whiteSpace: "nowrap" }}>
                  {l}
                </div>
              ))}
              {det ? (
                <div style={{ fontFamily: sans, fontWeight: 500, fontSize: det.tamanho, lineHeight: 1.2, marginTop: 4, color: misturarCor(cor.lapis, "#4B5160", a), whiteSpace: "nowrap" }}>
                  {det.linhas.join(" ")}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </Papel>
  );
};

// ---------- comparação: dois cartões-postais lado a lado ----------

const ROTULO_PADRAO = { "errado-certo": ["Errado", "Certo"], "antes-depois": ["Antes", "Depois"], contra: ["", ""] } as const;
const CARIMBO_DO_MODO = { "errado-certo": "Certo", "antes-depois": "Agora", contra: "Melhor" } as const;

const Selinho: React.FC<{ certo: boolean; p: number }> = ({ certo, p }) => (
  <svg width={64} height={64} viewBox="0 0 64 64" style={{ scale: String(0.7 + 0.3 * p), opacity: limitar(p * 1.5) }}>
    <circle cx={32} cy={32} r={28} fill={certo ? cor.azulejo : cor.telha} />
    {certo ? (
      <path d="M18 33 l10 10 l19 -21" fill="none" stroke={cor.papel} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d="M20 20 L44 44 M44 20 L20 44" stroke={cor.papel} strokeWidth={7} strokeLinecap="round" />
    )}
  </svg>
);

export const CartaoComparacao: React.FC<{ f: FichaComparacao; caixa: Caixa; t: number }> = ({ f, caixa: caixaFaixa, t }) => {
  let caixa = caixaFaixa;
  const modo = f.modo ?? "contra";
  const espaco = 14;
  const w = (caixa.w - espaco) / 2;
  const venc = f.vencedorEm !== undefined && f.vencedor !== undefined ? prog(t, f.vencedorEm - 0.05, 0.5) : 0;
  const giros = [-0.9, 0.8];
  const topoTexto = PAD + 72;
  const encs = f.lados.map((lado) =>
    encaixarNaCaixa(lado.texto, { largura: w - 2 * PAD - 8, altura: caixa.h - topoTexto - PAD - 10, max: 74, min: 38, linhas: 5, fonte: { peso: 600 }, entrelinha: 1.06 }),
  );
  // os cartões acompanham o texto (nunca mais baixos que 300 px)
  const altura = Math.min(caixa.h, Math.max(300, topoTexto + Math.max(...encs.map((e) => alturaDe(e, 1.06))) + PAD + 14));
  caixa = { ...caixa, h: altura };
  return (
    <>
      {f.lados.map((lado, i) => {
        const c: Caixa = { x: caixa.x + i * (w + espaco), y: caixa.y, w, h: caixa.h };
        const tinta = prog(t, lado.em - 0.15, 0.45);
        const errado = modo === "errado-certo" && i === 0;
        const tom = errado ? cor.telha : cor.azulejo;
        const perdedor = f.vencedor !== undefined && f.vencedor !== i ? venc : 0;
        const rotulo = lado.rotulo || ROTULO_PADRAO[modo][i];
        const enc = encs[i];
        return (
          <div key={i} style={{ position: "absolute", inset: 0, opacity: 1 - 0.34 * perdedor }}>
            <Papel caixa={c} tinta={tinta} giro={giros[i]}>
              <div style={{ position: "absolute", left: PAD, top: PAD - 2, width: w - 2 * PAD - 80 }}>
                <Rotulo texto={rotulo} tinta={tinta} largura={w - 2 * PAD - 90} />
              </div>
              {modo === "errado-certo" ? (
                <div style={{ position: "absolute", right: PAD - 4, top: PAD - 8 }}>
                  <Selinho certo={!errado} p={prog(t, lado.em, 0.35)} />
                </div>
              ) : null}
              <div style={{ position: "absolute", left: PAD + 4, top: topoTexto, width: w - 2 * PAD - 8, fontFamily: display, fontWeight: 600, fontSize: enc.tamanho, lineHeight: 1.06, color: misturarCor(cor.lapis, errado ? cor.telha : cor.tinta, tinta) }}>
                {enc.linhas.map((l, k) => (
                  <div key={k} style={{ whiteSpace: "nowrap" }}>
                    {l}
                  </div>
                ))}
              </div>
            </Papel>
          </div>
        );
      })}
      {modo === "antes-depois" ? (
        <svg width={90} height={90} viewBox="0 0 90 90" style={{ position: "absolute", left: caixa.x + w + espaco / 2 - 45, top: caixa.y + 40, opacity: prog(t, f.lados[1].em - 0.2, 0.3) }}>
          <circle cx={45} cy={45} r={38} fill={cor.papel} stroke={cor.azulejo} strokeWidth={4} />
          <path d="M24 45 H64 M50 29 L66 45 L50 61" fill="none" stroke={cor.azulejo} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
      {f.vencedor !== undefined && f.vencedorEm !== undefined ? (
        <Carimbo
          x={caixa.x + f.vencedor * (w + espaco) + w - 104}
          y={caixa.y + caixa.h - 106}
          r={92}
          em={f.vencedorEm}
          t={t}
          topo={CARIMBO_DO_MODO[modo]}
          giro={f.vencedor === 0 ? -12 : 10}
          ondas={false}
        />
      ) : null}
    </>
  );
};

// ---------- gráfico ----------

const fmt = (v: number, unidade?: string) => {
  const casas = Math.min(2, (String(v).split(".")[1] ?? "").length);
  const n = numeroBR(v, casas);
  if (!unidade) return n;
  if (/^(r\$|us\$|€|\$)/i.test(unidade)) return `${unidade} ${n}`;
  return unidade === "%" ? `${n}%` : `${n} ${unidade}`;
};
const fmtAnim = (v: number, p: number, unidade?: string) => {
  const casas = Math.min(2, (String(v).split(".")[1] ?? "").length);
  const parcial = Math.round(v * p * 10 ** casas) / 10 ** casas;
  return fmt(p >= 0.999 ? v : parcial, unidade);
};

const FATIAS = [cor.azulejo, cor.sol, cor.telha, "#6FA6C9", "#9A8C73", cor.solFundo];

// curva qualitativa: sobe, cai ou oscila (pontos 0–1 em x e y, y = 0 em cima)
const perfil = (tendencia: "sobe" | "cai" | "oscila") => {
  const base =
    tendencia === "sobe"
      ? [0.9, 0.78, 0.8, 0.58, 0.46, 0.3, 0.12]
      : tendencia === "cai"
        ? [0.12, 0.26, 0.22, 0.46, 0.58, 0.78, 0.9]
        : [0.5, 0.24, 0.62, 0.2, 0.7, 0.3, 0.5];
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
const caminho = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

const Pinzinho: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) => (
  <g opacity={limitar(p * 1.6)} transform={`translate(${x} ${y - (1 - p) * 26})`}>
    <ellipse cx={0} cy={0} rx={11 * p} ry={4 * p} fill="rgba(60,44,20,0.25)" />
    <circle cx={0} cy={0} r={12} fill={cor.azulejo} stroke={cor.papel} strokeWidth={4} />
  </g>
);

export const CartaoGrafico: React.FC<{ f: FichaGrafico; caixa: Caixa; t: number }> = ({ f, caixa, t }) => {
  const dados = f.dados?.length ? f.dados : null;
  const ilustrativo = f.ilustrativo || !dados;
  const primeiro = dados ? dados[0].em : (f.tendenciaEm ?? f.em);
  const tinta = prog(t, primeiro - 0.25, 0.45);
  const temTitulo = !!f.titulo;
  const topo = PAD + (temTitulo ? 76 : 8);
  const area = { x: PAD + 14, y: topo, w: caixa.w - 2 * PAD - 28, h: caixa.h - topo - PAD - 6 };
  let corpo: React.ReactNode = null;

  if (dados && f.forma === "barras") {
    const n = dados.length;
    const gap = 26;
    const largBarra = Math.min(170, (area.w - gap * (n - 1)) / n);
    const largTotal = n * largBarra + (n - 1) * gap;
    const x0 = area.x + (area.w - largTotal) / 2;
    const rotuloH = 66;
    const valorH = 58;
    const base = area.y + area.h - rotuloH;
    const maxH = base - area.y - valorH;
    const maximo = Math.max(...dados.map((d) => Math.abs(d.valor)), 1e-9);
    corpo = (
      <>
        <div style={{ position: "absolute", left: area.x, top: base + 2, width: area.w, height: 4, borderRadius: 2, background: cor.areiaTraco }} />
        {dados.map((d, i) => {
          const p = suave(prog(t, d.em - 0.05, 0.65, (x) => x));
          const h = Math.max(6, (Math.abs(d.valor) / maximo) * maxH) * p;
          const x = x0 + i * (largBarra + gap);
          const rot = encaixar(d.rotulo, { largura: largBarra + gap - 6, max: 32, min: 22, linhas: 2, fonte: { familia: "sans", peso: 600 } });
          const val = encaixar(fmt(d.valor, f.unidade), { largura: largBarra + gap - 4, max: 46, min: 28, linhas: 1, fonte: { peso: 700 } });
          return (
            <div key={i}>
              <div
                style={{
                  position: "absolute",
                  left: x,
                  top: base - h,
                  width: largBarra,
                  height: h,
                  borderRadius: "10px 10px 2px 2px",
                  background: `repeating-linear-gradient(to top, transparent 0 22px, rgba(251,246,236,0.32) 22px 26px), ${cor.azulejo}`,
                  boxShadow: `inset 0 8px 0 ${cor.sol}`,
                  opacity: p > 0 ? 1 : 0,
                }}
              />
              {p <= 0 ? <div style={{ position: "absolute", left: x, top: base - 12, width: largBarra, height: 12, borderRadius: 4, border: `3px dashed ${cor.lapis}`, boxSizing: "border-box" }} /> : null}
              <div style={{ position: "absolute", left: x - gap / 2, width: largBarra + gap, top: base - h - 8 - val.tamanho * 1.1, textAlign: "center", fontFamily: display, fontWeight: 700, fontSize: val.tamanho, lineHeight: 1.1, color: misturarCor(cor.lapis, cor.tinta, p), whiteSpace: "nowrap", opacity: p > 0.05 ? 1 : 0 }}>
                {fmtAnim(d.valor, p, f.unidade)}
              </div>
              <div style={{ position: "absolute", left: x - gap / 2 + 3, width: largBarra + gap - 6, top: base + 12, textAlign: "center", fontFamily: sans, fontWeight: 600, fontSize: rot.tamanho, lineHeight: 1.08, color: misturarCor(cor.lapis, cor.tinta, p) }}>
                {rot.linhas.map((l, k) => (
                  <div key={k} style={{ whiteSpace: "nowrap" }}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  } else if (dados && f.forma === "pizza") {
    const R = Math.min(150, area.h / 2 - 8);
    const cx = area.x + R + 24;
    const cy = area.y + area.h / 2;
    const soma = dados.reduce((s, d) => s + Math.abs(d.valor), 0) || 1;
    let acc = 0;
    const fatias = dados.map((d, i) => {
      const a0 = (acc / soma) * Math.PI * 2 - Math.PI / 2;
      acc += Math.abs(d.valor);
      const a1 = (acc / soma) * Math.PI * 2 - Math.PI / 2;
      return { d, i, a0, a1 };
    });
    const xLeg = cx + R + 56;
    const larguraLeg = area.x + area.w - xLeg;
    const linhaH = Math.min(78, area.h / dados.length);
    corpo = (
      <>
        <svg width={caixa.w} height={caixa.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <circle cx={cx} cy={cy} r={R + 16} fill="none" stroke={cor.azulejo} strokeOpacity={0.4} strokeWidth={3} strokeDasharray="3 10" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" opacity={0.8} />
          {fatias.map(({ d, i, a0, a1 }) => {
            const p = suave(prog(t, d.em - 0.05, 0.6, (x) => x));
            if (p <= 0.001) return null;
            const fim = a0 + (a1 - a0) * p;
            const grande = fim - a0 > Math.PI ? 1 : 0;
            const pt = (a: number, r: number) => `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
            const dd = a1 - a0 >= Math.PI * 2 - 1e-3 ? `M${cx - R} ${cy} A${R} ${R} 0 1 1 ${cx + R} ${cy} A${R} ${R} 0 1 1 ${cx - R} ${cy} Z` : `M${cx} ${cy} L${pt(a0, R)} A${R} ${R} 0 ${grande} 1 ${pt(fim, R)} Z`;
            return <path key={i} d={dd} fill={FATIAS[i % FATIAS.length]} stroke={cor.papel} strokeWidth={5} strokeLinejoin="round" />;
          })}
          <circle cx={cx} cy={cy} r={R * 0.34} fill={cor.papel} />
        </svg>
        {dados.map((d, i) => {
          const a = prog(t, d.em - 0.08, 0.35);
          const val = fmt(d.valor, f.unidade);
          const rot = encaixar(d.rotulo, { largura: larguraLeg - 60, max: 40, min: 24, linhas: 1, fonte: { familia: "sans", peso: 600 } });
          return (
            <div key={i} style={{ position: "absolute", left: xLeg, top: cy - (dados.length * linhaH) / 2 + i * linhaH, width: larguraLeg, height: linhaH, display: "flex", alignItems: "center", gap: 14, opacity: 0.35 + 0.65 * a }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: a > 0.3 ? FATIAS[i % FATIAS.length] : "transparent", border: `3px ${a > 0.3 ? "solid" : "dashed"} ${a > 0.3 ? FATIAS[i % FATIAS.length] : cor.lapis}`, boxSizing: "border-box", flex: "none" }} />
              <div style={{ fontFamily: sans, fontWeight: 600, fontSize: rot.tamanho, color: misturarCor(cor.lapis, cor.tinta, a), whiteSpace: "nowrap" }}>{rot.linhas.join(" ")}</div>
              <div style={{ marginLeft: "auto", fontFamily: display, fontWeight: 700, fontSize: Math.min(46, rot.tamanho + 8), color: misturarCor(cor.lapis, cor.azulejo, a), whiteSpace: "nowrap" }}>{val}</div>
            </div>
          );
        })}
      </>
    );
  } else {
    // linha (com números ditos) ou forma qualitativa (tendência): a rota que sobe, cai ou oscila
    const margemX = 44;
    const aw = area.w - 2 * margemX;
    const topoPlot = area.y + 62;
    const ah = area.h - 62 - 62;
    let pontos: { x: number; y: number }[];
    let marcados: { x: number; y: number; em: number; rotulo: string; valor: number }[] = [];
    if (dados) {
      const vs = dados.map((d) => d.valor);
      const mn = Math.min(...vs);
      const mx = Math.max(...vs);
      const faixa = mx - mn || 1;
      marcados = dados.map((d, i) => ({
        x: area.x + margemX + (dados.length === 1 ? aw / 2 : (i / (dados.length - 1)) * aw),
        y: topoPlot + ah * (1 - (0.08 + 0.84 * ((d.valor - mn) / faixa))),
        em: d.em,
        rotulo: d.rotulo,
        valor: d.valor,
      }));
      pontos = marcados;
    } else {
      pontos = suavizarCurva(perfil(f.tendencia ?? "sobe")).map((q) => ({ x: area.x + margemX + q.x * aw, y: topoPlot + q.y * ah }));
    }
    const baseY = topoPlot + ah + 20;
    corpo = (
      <svg width={caixa.w} height={caixa.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <line x1={area.x + 10} y1={baseY} x2={area.x + area.w - 6} y2={baseY} stroke={cor.areiaTraco} strokeWidth={4} strokeLinecap="round" />
        <line x1={area.x + 10} y1={topoPlot - 10} x2={area.x + 10} y2={baseY} stroke={cor.areiaTraco} strokeWidth={4} strokeLinecap="round" />
        <path d={caminho(pontos)} fill="none" stroke={cor.lapis} strokeWidth={4} strokeDasharray="1 12" strokeLinecap="round" opacity={0.85} />
        {dados ? (
          <>
            {marcados.slice(1).map((q, i) => {
              const a = marcados[i];
              const p = prog(t, q.em - 0.5, 0.5);
              if (p <= 0) return null;
              return <line key={i} x1={a.x} y1={a.y} x2={a.x + (q.x - a.x) * p} y2={a.y + (q.y - a.y) * p} stroke={cor.azulejo} strokeWidth={9} strokeDasharray="0.1 18" strokeLinecap="round" />;
            })}
            {marcados.map((q, i) => {
              const p = prog(t, q.em - 0.12, 0.4);
              const rot = encaixar(q.rotulo, { largura: Math.min(180, aw / Math.max(1, marcados.length - 1) + 10), max: 30, min: 20, linhas: 2, fonte: { familia: "sans", peso: 600 } });
              const val = encaixar(fmt(q.valor, f.unidade), { largura: 200, max: 44, min: 26, linhas: 1, fonte: { peso: 700 } });
              const ancora = i === 0 ? "start" : i === marcados.length - 1 ? "end" : "middle";
              return (
                <g key={i}>
                  {p > 0 ? <Pinzinho x={q.x} y={q.y} p={p} /> : <circle cx={q.x} cy={q.y} r={11} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="5 5" />}
                  <text x={q.x} y={q.y - 28} textAnchor={ancora} fontFamily={display} fontWeight={700} fontSize={val.tamanho} fill={misturarCor(cor.lapis, cor.tinta, p)} opacity={p > 0.05 ? 1 : 0}>
                    {fmtAnim(q.valor, p, f.unidade)}
                  </text>
                  {rot.linhas.map((l, k) => (
                    <text key={k} x={q.x} y={baseY + 38 + k * rot.tamanho * 1.05} textAnchor={ancora} fontFamily={sans} fontWeight={600} fontSize={rot.tamanho} fill={misturarCor(cor.lapis, cor.tinta, p)}>
                      {l}
                    </text>
                  ))}
                </g>
              );
            })}
          </>
        ) : (
          (() => {
            const inicio = f.tendenciaEm ?? f.em;
            const u = prog(t, inicio - 0.1, 1.8, (x) => x);
            if (u <= 0) return null;
            const ate = Math.max(2, Math.round(pontos.length * u));
            const parte = pontos.slice(0, ate);
            const ponta = parte[parte.length - 1];
            return (
              <g>
                <path d={caminho(parte)} fill="none" stroke={cor.papel} strokeOpacity={0.8} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
                <path d={caminho(parte)} fill="none" stroke={cor.azulejo} strokeWidth={10} strokeDasharray="0.1 19" strokeLinecap="round" strokeLinejoin="round" />
                <Pinzinho x={ponta.x} y={ponta.y} p={1} />
              </g>
            );
          })()
        )}
      </svg>
    );
  }

  return (
    <Papel caixa={caixa} tinta={tinta} giro={0.5}>
      {temTitulo ? <Titulo texto={f.titulo!} largura={caixa.w - 2 * PAD - (ilustrativo ? 260 : 10)} tinta={tinta} /> : null}
      {ilustrativo ? (
        <div style={{ position: "absolute", right: PAD, top: PAD + 2, padding: "2px 18px", borderRadius: 24, border: `3px dashed ${cor.lapis}`, fontFamily: sans, fontWeight: 600, fontSize: 28, letterSpacing: "0.14em", textTransform: "uppercase", color: "#7C6F58", opacity: 0.4 + 0.6 * tinta }}>
          ilustrativo
        </div>
      ) : null}
      {corpo}
    </Papel>
  );
};
