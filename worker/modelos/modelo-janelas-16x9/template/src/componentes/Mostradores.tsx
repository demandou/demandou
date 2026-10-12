// Número e gráfico: janelas de "painel" do desktop.
// Número = um mostrador que conta até o valor dito, com a barra de progresso enchendo junto.
// Gráfico = uma janela de gráfico: barras, linha ou pizza que crescem dado a dado; sem números
// ditos, uma curva de tendência que se desenha, com a etiqueta "ilustrativo".
import { Easing } from "remotion";
import { janelaAberta, limitar, mistura, prog, Traco, temposDoTexto } from "../anim";
import { areaDoMomento, ICONES_DOCK, iconeDoTipo, posDock } from "../geometria";
import { corpoQueCabe, encaixar, formatarNumero, larguraTexto } from "../medida";
import type { Grafico, Numero, Palavra, Plano } from "../plano";
import { TextoFalado } from "../texto";
import { BARRA_JANELA, cor, mono, rotuloCaixaAlta, sans } from "../tema";
import { Janela } from "./Janela";

const origemDe = (tipo: "numero" | "grafico") => posDock(Math.max(0, ICONES_DOCK.indexOf(iconeDoTipo[tipo] ?? "prancheta")));
const conta = Easing.bezier(0.2, 0.7, 0.2, 1);

// Etiqueta "ILUSTRATIVO" na barra de título: o desenho não vem de números ditos
export const Ilustrativo: React.FC<{ p?: number }> = ({ p = 1 }) => (
  <div
    style={{
      ...rotuloCaixaAlta,
      fontSize: 30,
      letterSpacing: "0.1em",
      color: cor.tintaSuave,
      border: `3px dashed ${cor.esboco}`,
      borderRadius: 14,
      padding: "6px 14px 7px",
      whiteSpace: "nowrap",
      opacity: p,
    }}
  >
    ilustrativo
  </div>
);

const moeda = (s?: string) => !!s && /(R\$|US\$|\$|€|£)/.test(s);

export const BlocoNumero: React.FC<{ m: Numero; plano: Plano; palavras: Palavra[]; t: number; fim: number }> = ({ m, plano, palavras, t, fim }) => {
  const a = areaDoMomento(plano, m);
  const aberta = janelaAberta(t, m.de, fim);
  const largura = a.w - 88;
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
  const final = formatarNumero(m.valor, casas);
  const prefixo = m.prefixo?.trim() ?? "";
  const sufixo = m.sufixo?.trim() ?? "";
  // corpo do número: o valor final inteiro cabe na largura (prefixo e sufixo com metade do corpo)
  const medida = (F: number) =>
    larguraTexto(final, F, { mono: true }) + (prefixo ? larguraTexto(prefixo, F * 0.46, { mono: true }) + F * 0.16 : 0) + (sufixo ? larguraTexto(sufixo, F * 0.46, { mono: true }) + F * 0.16 : 0);
  let F = 180;
  while (F > 76 && medida(F) > largura) F -= 4;
  const rotulo = encaixar(m.rotulo, { largura, max: 52, min: 38, linhas: 1, fonte: { peso: 700 } });
  const tRotulo = temposDoTexto(m.rotulo, palavras, Math.min(m.de, m.rotuloEm ?? m.de), m.ate, m.rotuloEm ?? m.de + 0.3);
  const c = prog(t, m.em, 1.35, conta);
  const valor = mistura(m.inicio ?? 0, m.valor, c);
  const texto = c <= 0 ? formatarNumero(m.inicio ?? 0, casas) : formatarNumero(valor, casas);
  const pronto = prog(t, m.em + 1.35, 0.25);
  const alturaCorpo = a.h - BARRA_JANELA;
  const bloco = rotulo.tamanho * 1.15 + 18 + F * 1.0 + 34 + 16;
  const topo = Math.max(22, (alturaCorpo - bloco) / 2);
  return (
    <Janela
      x={a.x}
      y={a.y}
      w={a.w}
      h={a.h}
      titulo="Painel"
      icone={moeda(prefixo) || moeda(sufixo) ? "dinheiro" : "grafico"}
      aberta={aberta}
      origem={origemDe("numero")}
      extra={m.ilustrativo ? <Ilustrativo /> : undefined}
    >
      <div style={{ position: "absolute", left: 44, right: 44, top: topo }}>
        <TextoFalado enc={rotulo} tempos={tRotulo} t={t} cor={cor.tintaSuave} esboco={cor.esbocoClaro} fonte={{ peso: 700 }} alturaLinha={1.15} />
        <div style={{ display: "flex", alignItems: "baseline", gap: F * 0.16, marginTop: 18, fontFamily: mono, fontWeight: 800, lineHeight: 1, whiteSpace: "nowrap" }}>
          {prefixo ? <span style={{ fontSize: F * 0.46, color: c > 0 ? cor.tintaSuave : cor.esboco }}>{prefixo}</span> : null}
          <span style={{ fontSize: F, color: c > 0 ? (pronto > 0.5 ? cor.violeta : cor.tinta) : cor.esboco, letterSpacing: "-0.02em" }}>{texto}</span>
          {sufixo ? <span style={{ fontSize: F * 0.46, color: c > 0 ? cor.tintaSuave : cor.esboco }}>{sufixo}</span> : null}
        </div>
        {/* a barra enche junto com a contagem e fecha com um ponto */}
        <div style={{ position: "relative", marginTop: 34, height: 16, borderRadius: 8, background: cor.esbocoClaro }}>
          <div style={{ width: `${c * 100}%`, height: "100%", borderRadius: 8, background: cor.violeta }} />
          <div
            style={{
              position: "absolute",
              left: `calc(${c * 100}% - 17px)`,
              top: -9,
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: cor.janela,
              border: `6px solid ${cor.violeta}`,
              opacity: limitar(c * 4),
            }}
          />
        </div>
      </div>
    </Janela>
  );
};

// ——— gráfico ———

const TONS = [cor.tecla, "#5F5A72", "#8F89A6", "#B8B3C8", "#3A3548"];

const curvaDaTendencia = (tendencia: "sobe" | "cai" | "oscila", n = 48) =>
  Array.from({ length: n + 1 }, (_, k) => {
    const x = k / n;
    const onda = 0.05 * Math.sin(x * Math.PI * 5.2);
    const y = tendencia === "sobe" ? 0.08 + 0.78 * Math.pow(x, 1.6) + onda : tendencia === "cai" ? 0.86 - 0.74 * Math.pow(x, 1.3) + onda : 0.45 + 0.24 * Math.sin(x * Math.PI * 3.1) * (1 - 0.3 * x);
    return { x, y: limitar(y, 0.02, 0.98) };
  });

export const BlocoGrafico: React.FC<{ m: Grafico; plano: Plano; palavras: Palavra[]; t: number; fim: number }> = ({ m, plano, palavras, t, fim }) => {
  const a = areaDoMomento(plano, m);
  const aberta = janelaAberta(t, m.de, fim);
  const dados = (m.dados ?? []).slice(0, 6);
  const comDados = dados.length >= 2;
  const unidade = m.unidade?.trim() ?? "";
  const rotuloValor = (v: number) => {
    const n = formatarNumero(v, Number.isInteger(v) ? 0 : 1);
    if (!unidade) return n;
    return /^(R\$|US\$|\$|€|£)$/.test(unidade) ? `${unidade} ${n}` : unidade === "%" ? `${n}%` : `${n} ${unidade}`;
  };
  const corpoH = a.h - BARRA_JANELA;
  const titulo = m.titulo ? encaixar(m.titulo, { largura: a.w - 88, max: 52, min: 38, linhas: 1 }) : null;
  const tTitulo = m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.3) : [];
  const topoGrafico = titulo ? 26 + titulo.tamanho * 1.1 + 18 : 30;
  // área do desenho (coordenadas dentro do corpo da janela)
  const G = { x: 54, y: topoGrafico + 58, w: a.w - 108, h: corpoH - topoGrafico - 58 - 92 };
  const ilustrativo = m.ilustrativo || !comDados;
  const atual = dados.reduce((k, d, i) => (t >= d.em - 0.05 ? i : k), -1);

  let desenho: React.ReactNode = null;
  if (comDados && m.forma === "pizza") {
    const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
    const r = Math.min(G.h + 70, 360) / 2;
    const cx = G.x + r + 10;
    const cy = G.y - 30 + (G.h + 60) / 2;
    let acum = 0;
    const fatias = dados.map((d, i) => {
      const frac = Math.max(0, d.valor) / total;
      const ini = acum;
      acum += frac;
      const p = prog(t, d.em - 0.05, 0.5);
      return { d, i, ini, frac: frac * p, p };
    });
    const arco = (ini: number, frac: number) => {
      if (frac <= 0.0005) return "";
      const a0 = ini * Math.PI * 2 - Math.PI / 2;
      const a1 = (ini + Math.min(frac, 0.9999)) * Math.PI * 2 - Math.PI / 2;
      const big = frac > 0.5 ? 1 : 0;
      return `M${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A${r} ${r} 0 ${big} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`;
    };
    const legendaX = cx + r + 60;
    const legendaW = a.w - legendaX - 40;
    const linhaH = Math.min(84, (G.h + 60) / dados.length);
    desenho = (
      <>
        <svg width={a.w} height={corpoH} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={cor.esbocoClaro} strokeWidth={r * 0.42} strokeDasharray="10 12" />
          {fatias.map((f) => (
            <path key={f.i} d={arco(f.ini, f.frac)} fill="none" stroke={f.i === atual ? cor.violeta : TONS[f.i % TONS.length]} strokeWidth={r * 0.42} />
          ))}
        </svg>
        {fatias.map((f) => {
          const encLegenda = encaixar(f.d.rotulo, { largura: legendaW - 190, max: 42, min: 30, linhas: 2, fonte: { peso: 700 } });
          return (
            <div
              key={`l${f.i}`}
              style={{
                position: "absolute",
                left: legendaX,
                top: cy - (dados.length * linhaH) / 2 + f.i * linhaH,
                width: legendaW,
                height: linhaH,
                display: "flex",
                alignItems: "center",
                gap: 16,
                opacity: mistura(0.25, 1, f.p),
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: f.p > 0.05 ? (f.i === atual ? cor.violeta : TONS[f.i % TONS.length]) : cor.esbocoClaro }} />
              <div style={{ flex: 1, minWidth: 0 }}>{f.p > 0.05 ? <TextoFalado enc={encLegenda} t={t} cor={cor.tinta} fonte={{ peso: 700 }} alturaLinha={1.05} /> : null}</div>
              <div style={{ fontFamily: mono, fontWeight: 800, fontSize: 40, color: f.i === atual ? cor.violeta : cor.tinta, whiteSpace: "nowrap" }}>
                {f.p > 0.05 ? (unidade ? rotuloValor(f.d.valor) : `${formatarNumero(Math.round((Math.max(0, f.d.valor) / total) * 100))}%`) : ""}
              </div>
            </div>
          );
        })}
      </>
    );
  } else if (comDados) {
    const max = Math.max(...dados.map((d) => d.valor), 0.0001);
    const n = dados.length;
    const slot = G.w / n;
    const base = G.y + G.h;
    const alturaDe = (v: number) => Math.max(6, (Math.max(0, v) / max) * (G.h - 20));
    const pontos = dados.map((d, i) => ({ x: G.x + slot * (i + 0.5), y: base - alturaDe(d.valor) }));
    desenho = (
      <>
        <svg width={a.w} height={corpoH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={G.x} x2={G.x + G.w} y1={base - f * (G.h - 20)} y2={base - f * (G.h - 20)} stroke={cor.linha} strokeWidth={2} strokeDasharray="8 10" />
          ))}
          <line x1={G.x} x2={G.x + G.w} y1={base} y2={base} stroke={cor.tinta} strokeWidth={4} strokeLinecap="round" />
          {m.forma === "linha"
            ? pontos.slice(1).map((p, i) => {
                const pr = prog(t, dados[i + 1].em - 0.05, 0.45);
                return <Traco key={i} d={`M${pontos[i].x} ${pontos[i].y} L${p.x} ${p.y}`} p={pr} cor={cor.tinta} largura={6} />;
              })
            : null}
          {m.forma === "linha"
            ? pontos.map((p, i) => {
                const pr = prog(t, dados[i].em - 0.05, 0.3);
                return pr > 0.01 ? <circle key={`c${i}`} cx={p.x} cy={p.y} r={mistura(4, i === atual ? 15 : 11, pr)} fill={i === atual ? cor.violeta : cor.janela} stroke={i === atual ? cor.violeta : cor.tinta} strokeWidth={5} /> : null;
              })
            : null}
        </svg>
        {dados.map((d, i) => {
          const pr = prog(t, d.em - 0.05, 0.5);
          const h = alturaDe(d.valor);
          const larg = Math.min(150, slot * 0.58);
          const encRotulo = encaixar(d.rotulo, { largura: slot - 10, max: 40, min: 30, linhas: 2, fonte: { peso: 700 } });
          const tamValor = corpoQueCabe(rotuloValor(d.valor), slot - 6, 44, 30, { mono: true });
          return (
            <div key={i}>
              {m.forma !== "linha" ? (
                <>
                  {/* a coluna espera a lápis e cresce na palavra */}
                  <div style={{ position: "absolute", left: pontos[i].x - larg / 2, top: base - 40, width: larg, height: 40, borderRadius: "14px 14px 0 0", border: `3px dashed ${cor.esboco}`, borderBottom: "none", opacity: 1 - pr }} />
                  <div
                    style={{
                      position: "absolute",
                      left: pontos[i].x - larg / 2,
                      top: base - h * pr,
                      width: larg,
                      height: h * pr,
                      borderRadius: "14px 14px 0 0",
                      background: i === atual ? cor.violeta : cor.tecla,
                    }}
                  />
                </>
              ) : null}
              <div
                style={{
                  position: "absolute",
                  left: pontos[i].x - slot / 2,
                  width: slot,
                  top: (m.forma === "linha" ? pontos[i].y : base - h * pr) - tamValor * 1.5,
                  textAlign: "center",
                  fontFamily: mono,
                  fontWeight: 800,
                  fontSize: tamValor,
                  color: i === atual ? cor.violeta : cor.tinta,
                  opacity: prog(t, d.em + 0.15, 0.25),
                  whiteSpace: "nowrap",
                }}
              >
                <span style={m.forma === "linha" ? { background: cor.janela, borderRadius: 10, padding: "0 8px" } : undefined}>{rotuloValor(d.valor)}</span>
              </div>
              <div style={{ position: "absolute", left: pontos[i].x - slot / 2, width: slot, top: base + 14, display: "flex", justifyContent: "center" }}>
                {pr > 0.05 ? (
                  <TextoFalado enc={encRotulo} t={t} cor={cor.tinta} fonte={{ peso: 700 }} alinhar="center" alturaLinha={1.05} />
                ) : (
                  <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 34, color: cor.esboco }}>· · ·</div>
                )}
              </div>
            </div>
          );
        })}
      </>
    );
  } else {
    // sem números ditos: a tendência se desenha (ilustrativa)
    const tendencia = m.tendencia ?? "sobe";
    const inicio = m.tendenciaEm ?? m.de + 0.5;
    const pr = prog(t, inicio, 1.7, Easing.inOut(Easing.cubic));
    const pts = curvaDaTendencia(tendencia).map((p) => ({ x: G.x + p.x * G.w, y: G.y + (1 - p.y) * G.h }));
    const d = pts.map((p, k) => `${k ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const k = Math.min(pts.length - 1, Math.floor(pr * (pts.length - 1)));
    const ponta = pts[k];
    const barras = m.forma === "barras";
    const area = `${d} L${G.x + G.w} ${G.y + G.h} L${G.x} ${G.y + G.h} Z`;
    const leitura = m.leitura ? encaixar(m.leitura, { largura: G.w * 0.6, max: 52, min: 38, linhas: 1 }) : null;
    const tLeitura = m.leitura ? temposDoTexto(m.leitura, palavras, m.de, m.ate, inicio + 0.6) : [];
    desenho = (
      <>
        <svg width={a.w} height={corpoH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <clipPath id={`rev-${m.de}`}>
              <rect x={G.x - 20} y={G.y - 40} width={(G.w + 40) * pr} height={G.h + 60} />
            </clipPath>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={G.x} x2={G.x + G.w} y1={G.y + G.h * f} y2={G.y + G.h * f} stroke={cor.linha} strokeWidth={2} strokeDasharray="8 10" />
          ))}
          <line x1={G.x} x2={G.x + G.w} y1={G.y + G.h} y2={G.y + G.h} stroke={cor.tinta} strokeWidth={4} strokeLinecap="round" />
          {/* esboço da curva a lápis antes da fala */}
          {!barras ? <path d={d} fill="none" stroke={cor.esbocoClaro} strokeWidth={6} strokeDasharray="10 14" strokeLinecap="round" /> : null}
          {barras ? (
            Array.from({ length: 7 }, (_, i) => {
              const p = pts[Math.round(((i + 0.5) / 7) * (pts.length - 1))];
              const h = G.y + G.h - p.y;
              const pb = limitar(pr * 7 - i);
              const w = (G.w / 7) * 0.56;
              return (
                <g key={i}>
                  <rect x={p.x - w / 2} y={G.y + G.h - 40} width={w} height={40} fill="none" stroke={cor.esboco} strokeWidth={3} strokeDasharray="8 8" opacity={1 - pb} />
                  <rect x={p.x - w / 2} y={G.y + G.h - h * pb} width={w} height={h * pb} rx={10} fill={i === 6 ? cor.violeta : cor.tecla} />
                </g>
              );
            })
          ) : (
            <g clipPath={`url(#rev-${m.de})`}>
              <path d={area} fill={cor.violetaFundo} opacity={0.8} />
              <path d={d} fill="none" stroke={cor.violeta} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
          {!barras && pr > 0.01 ? <circle cx={ponta.x} cy={ponta.y} r={15} fill={cor.janela} stroke={cor.violeta} strokeWidth={7} /> : null}
        </svg>
        {leitura ? (
          <div style={{ position: "absolute", left: G.x, top: G.y + G.h + 22 }}>
            <TextoFalado enc={leitura} tempos={tLeitura} t={t} cor={cor.tinta} esboco={cor.esbocoClaro} />
          </div>
        ) : null}
      </>
    );
  }

  return (
    <Janela
      x={a.x}
      y={a.y}
      w={a.w}
      h={a.h}
      titulo="Gráfico"
      icone="grafico"
      aberta={aberta}
      origem={origemDe("grafico")}
      extra={ilustrativo ? <Ilustrativo /> : undefined}
    >
      {titulo && m.titulo ? (
        <div style={{ position: "absolute", left: 44, top: 26 }}>
          <TextoFalado enc={titulo} tempos={tTitulo} t={t} cor={cor.tinta} esboco={cor.esbocoClaro} />
        </div>
      ) : null}
      {desenho}
    </Janela>
  );
};
