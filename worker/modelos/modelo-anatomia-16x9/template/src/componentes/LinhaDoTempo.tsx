// A linha do tempo do efeito: números-herói em cima (só os ditos), a curva desenhada no ritmo da fala
// embaixo, com os marcos no eixo. Na prancha (o quadro da esquerda, com a pessoa na moldura da direita)
// ou na tela inteira. No quadro deitado a tela inteira é recomposta em FILEIRAS: os números-herói numa
// fileira em cima, a curva larga embaixo (no vertical era uma pilha alta, de y 214 a 1330).
import { Rise } from "../anim";
import { encaixar } from "../medida";
import type { LinhaDoTempo as TLinha, Marco } from "../plano";
import { EASE_INOUT, EASE_OUT, FONT, K, keys, prog } from "../tema";
import { Selo } from "./Pecas";

const sm = (a: number, b: number, x: number) => {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
// forma da curva (0 → 1 ao longo do eixo)
const forma = (curva: TLinha["curva"], u: number) => {
  switch (curva) {
    case "sobe":
      return 0.06 + 0.94 * Math.pow(sm(0, 1, u), 0.85);
    case "cai":
      return 1 - 0.92 * sm(0, 1, u);
    case "estavel":
      return 0.62 + 0.05 * Math.sin(u * Math.PI * 3);
    default: {
      const r = Math.max(0, Math.min(1, (u - 0.03) / 0.32));
      return (1 - Math.pow(1 - r, 2.3)) * (1 - 0.94 * sm(0.74, 1, u));
    }
  }
};

// As medidas de cada lugar. A prancha usa a grade do vertical (1080 de largura); a tela inteira do
// quadro deitado usa a tela (1920×1080), terminando acima da legenda (y 894) e dos controles do player.
export type GeoDaLinha = {
  w: number;
  h: number;
  xIni: number;
  xFim: number;
  eixo: [number, number];
  G: { tit: number; heroi: number; num: number; top: number; base: number };
  colunas: { duas: [number, number]; uma: number; larguraDuas: number; larguraUma: number };
  titulo: { x: number; largura: number };
  // as anotações ao lado do ponto ficam entre min e max; os pontos antes de "meio" anotam à direita
  anotacao: { min: number; max: number; meio: number };
  selo: { x: number; y: number };
  fontes: { texto: number; prefixo: number; sufixo: number };
  // tela inteira: o papel cobre tudo (a pessoa sai)
  papel: boolean;
};
export const NA_PRANCHA: GeoDaLinha = {
  w: 1080,
  h: 1920,
  xIni: 112,
  xFim: 1000,
  eixo: [92, 1004],
  G: { tit: 132, heroi: 178, num: 160, top: 512, base: 708 },
  colunas: { duas: [300, 780], uma: 540, larguraDuas: 440, larguraUma: 760 },
  titulo: { x: 540, largura: 900 },
  anotacao: { min: 64, max: 1016, meio: 640 },
  selo: { x: 64, y: 708 + 64 },
  fontes: { texto: 40, prefixo: 40, sufixo: 44 },
  papel: false,
};
export const TELA_DEITADA: GeoDaLinha = {
  w: 1920,
  h: 1080,
  xIni: 200,
  xFim: 1720,
  eixo: [176, 1744],
  // título, a fileira dos heróis (até y ~430 com a guia), a curva (510 a 766), o eixo com os marcos
  // (até ~818) e o selo (832 a ~884), tudo acima da faixa da legenda (y 894)
  G: { tit: 64, heroi: 140, num: 170, top: 510, base: 766 },
  colunas: { duas: [600, 1320], uma: 960, larguraDuas: 640, larguraUma: 1000 },
  titulo: { x: 960, largura: 1400 },
  anotacao: { min: 96, max: 1824, meio: 1100 },
  selo: { x: 96, y: 832 },
  fontes: { texto: 44, prefixo: 48, sufixo: 52 },
  papel: true,
};

export const LinhaDoTempo: React.FC<{ m: TLinha; t: number; geo?: GeoDaLinha }> = ({ m, t, geo = NA_PRANCHA }) => {
  if (t < m.de - 0.05 || t > m.ate + 0.05) return null;
  const { G, xIni: X_INI, xFim: X_FIM } = geo;
  const marcos = [...m.marcos].sort((a, b) => a.em - b.em).slice(0, 5);
  const n = marcos.length;
  const posDe = (mc: Marco, i: number) => mc.posicao ?? (n === 1 ? 0.5 : 0.12 + (0.8 * i) / (n - 1));
  const xOf = (u: number) => X_INI + u * (X_FIM - X_INI);
  const yOf = (u: number) => G.base - forma(m.curva, u) * (G.base - G.top);
  const a = prog(t, m.de, m.de + 0.4, EASE_OUT);
  const sai = prog(t, m.ate - 0.3, m.ate);
  const axis = prog(t, m.de + 0.1, m.de + 0.65, EASE_INOUT);
  const ks: Array<[number, number]> = [[m.de + 0.15, X_INI]];
  marcos.forEach((mc, i) => ks.push([Math.max(ks[ks.length - 1][0] + 0.15, mc.em + 0.1), xOf(posDe(mc, i))]));
  ks.push([ks[ks.length - 1][0] + 0.35, X_FIM]);
  const xh = keys(t, ks, EASE_INOUT);
  const uh = (xh - X_INI) / (X_FIM - X_INI);
  const ptsC: string[] = [];
  for (let x = X_INI; x <= xh; x += 4) ptsC.push(`${x.toFixed(1)},${yOf((x - X_INI) / (X_FIM - X_INI)).toFixed(1)}`);
  ptsC.push(`${xh.toFixed(1)},${yOf(uh).toFixed(1)}`);
  const curve = `M ${ptsC.join(" L ")}`;
  const area = `${curve} L ${xh.toFixed(1)},${G.base} L ${X_INI},${G.base} Z`;
  // até 2 heróis (os marcos com `valor`): colunas da esquerda e da direita
  const herois = marcos.map((mc, i) => ({ mc, i })).filter((x) => x.mc.valor).slice(0, 2);
  const colunas = herois.length === 2 ? geo.colunas.duas : [geo.colunas.uma];
  const fimCurva = ks[ks.length - 1][0];
  const pulso = t > fimCurva ? (t - fimCurva) % 1.4 : -1;
  const tituloFit = m.titulo ? encaixar(m.titulo.toUpperCase(), { largura: geo.titulo.largura, max: 36, min: 28, linhas: 1, fonte: { peso: 600, espacamento: 0.06 } }) : null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: a * (1 - sai), fontFamily: FONT, filter: sai > 0 ? `blur(${sai * 6}px)` : undefined }}>
      {geo.papel ? <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${K.paper} 0%, #EEF3F8 100%)` }} /> : null}
      <svg width={geo.w} height={geo.h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id={`lt-area${Math.round(m.de * 10)}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={K.acc} stopOpacity={0.24} />
            <stop offset="1" stopColor={K.acc} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {[0.33, 0.66, 1].map((k, i) => (
          <path key={i} d={`M ${X_INI} ${G.base - (G.base - G.top) * k} L ${X_FIM} ${G.base - (G.base - G.top) * k}`} stroke={K.line} strokeWidth={1} strokeDasharray="2 8" opacity={0.6 * axis} />
        ))}
        <path d={`M ${geo.eixo[0]} ${G.base} L ${geo.eixo[0] + (geo.eixo[1] - geo.eixo[0]) * axis} ${G.base}`} stroke={K.ink} strokeWidth={2.6} strokeLinecap="round" />
        {marcos.map((mc, i) => {
          const x = xOf(posDe(mc, i));
          const p = prog(t, mc.em - 0.05, mc.em + 0.3);
          return <path key={`tk${i}`} d={`M ${x} ${G.base} L ${x} ${G.base + 14}`} stroke={K.ink} strokeWidth={2.2} opacity={p} />;
        })}
        {herois.map(({ mc, i }, k) => {
          const x = xOf(posDe(mc, i));
          const p = prog(t, (mc.valorEm ?? mc.em) - 0.05, (mc.valorEm ?? mc.em) + 0.35, EASE_OUT);
          const yTopo = G.heroi + (mc.texto ? 58 : 0) + G.num * 0.98 + (mc.sufixo ? 58 : 0) + 8;
          return <path key={`g${k}`} d={`M ${x} ${yOf(posDe(mc, i)) - 14} L ${x} ${yTopo}`} stroke={K.acc} strokeWidth={2} strokeDasharray="5 7" opacity={p * 0.9} />;
        })}
        <path d={area} fill={`url(#lt-area${Math.round(m.de * 10)})`} />
        <path d={curve} fill="none" stroke={K.acc} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={xh} cy={yOf(uh)} r={13} fill="#fff" stroke={K.acc} strokeWidth={5} opacity={t > m.de + 0.1 ? 1 : 0} />
        {pulso >= 0 ? <circle cx={xh} cy={yOf(uh)} r={13 + pulso * 30} fill="none" stroke={K.acc} strokeWidth={2.5} opacity={Math.max(0, 0.7 - pulso * 0.6)} /> : null}
        {marcos.map((mc, i) => {
          const u = posDe(mc, i);
          const p = prog(t, mc.em, mc.em + 0.35, EASE_OUT);
          return <circle key={`d${i}`} cx={xOf(u)} cy={yOf(u)} r={10 * p} fill={K.acc} stroke="#fff" strokeWidth={3.5} />;
        })}
      </svg>
      {marcos.map((mc, i) => {
        const x = xOf(posDe(mc, i));
        const fit = encaixar(mc.quando, { largura: 190, max: 28, min: 22, linhas: 1, fonte: { peso: 500 } });
        return (
          <div key={`q${i}`} style={{ position: "absolute", left: x - 100, width: 200, top: G.base + 22, textAlign: "center", fontWeight: 500, fontSize: fit.tamanho, color: K.slate, whiteSpace: "nowrap" }}>
            <Rise t={t} at={mc.em}>{mc.quando}</Rise>
          </div>
        );
      })}
      {tituloFit ? (
        <div style={{ position: "absolute", left: geo.titulo.x - geo.titulo.largura / 2, width: geo.titulo.largura, top: G.tit, textAlign: "center", fontWeight: 600, fontSize: tituloFit.tamanho, color: K.slate, letterSpacing: "0.06em" }}>
          <Rise t={t} at={m.tituloEm ?? m.de}>{tituloFit.linhas[0]}</Rise>
        </div>
      ) : null}
      {herois.map(({ mc }, k) => {
        const cx = colunas[k];
        const largura = herois.length === 2 ? geo.colunas.larguraDuas : geo.colunas.larguraUma;
        const vEm = mc.valorEm ?? mc.em;
        const num = encaixar(mc.valor ?? "", { largura: largura - (mc.prefixo ? 120 : 0), max: G.num, min: 90, linhas: 1, fonte: { peso: 700 } });
        return (
          <div key={`h${k}`} style={{ position: "absolute", left: cx - largura / 2, width: largura, top: G.heroi, textAlign: "center", lineHeight: 1.05 }}>
            {mc.texto ? (
              <div style={{ fontWeight: 650, fontSize: encaixar(mc.texto, { largura, max: geo.fontes.texto, min: 28, linhas: 1, fonte: { peso: 650 } }).tamanho, color: K.ink, whiteSpace: "nowrap" }}>
                <Rise t={t} at={mc.textoEm ?? mc.em}>{mc.texto}</Rise>
              </div>
            ) : null}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 16, marginTop: 8 }}>
              {mc.prefixo ? (
                <span style={{ fontWeight: 600, fontSize: geo.fontes.prefixo, color: K.ink2 }}>
                  <Rise t={t} at={vEm - 0.06}>{mc.prefixo}</Rise>
                </span>
              ) : null}
              <span style={{ fontWeight: 700, fontSize: num.tamanho, color: K.acc, letterSpacing: "-0.04em", lineHeight: 1 }}>
                <Rise t={t} at={vEm} dur={0.5}>
                  {mc.valor}
                </Rise>
              </span>
            </div>
            {mc.sufixo ? (
              <div style={{ fontWeight: 600, fontSize: geo.fontes.sufixo, color: K.ink2, marginTop: -6 }}>
                <Rise t={t} at={vEm + 0.25}>{mc.sufixo}</Rise>
              </div>
            ) : null}
          </div>
        );
      })}
      {marcos.map((mc, i) => {
        if (mc.valor || !mc.texto) return null;
        const u = posDe(mc, i);
        const x = xOf(u);
        const direita = x < geo.anotacao.meio;
        const fit = encaixar(mc.texto, { largura: 360, max: 36, min: 26, linhas: 2, fonte: { peso: 650 } });
        // no alto da curva (platô), a anotação vai embaixo do ponto, centrada; senão, ao lado e acima
        const embaixo = yOf(u) < G.top + 70;
        const pos: React.CSSProperties = embaixo
          ? { left: Math.max(geo.anotacao.min, Math.min(geo.anotacao.max - 360, x - 180)), width: 360, textAlign: "center" }
          : direita
            ? { left: x + 18, textAlign: "left" }
            : { right: geo.w - x + 18, textAlign: "right" };
        return (
          <div key={`a${i}`} style={{ position: "absolute", ...pos, top: embaixo ? yOf(u) + 24 : yOf(u) - 34 - fit.linhas.length * fit.tamanho * 1.15, fontWeight: 650, fontSize: fit.tamanho, lineHeight: 1.15, color: K.ink }}>
            {fit.linhas.map((l, j) => (
              <div key={j} style={{ whiteSpace: "nowrap" }}>
                <Rise t={t} at={(mc.textoEm ?? mc.em) + j * 0.08}>{l}</Rise>
              </div>
            ))}
          </div>
        );
      })}
      {m.ilustrativo ? <Selo a={prog(t, m.de + 0.6, m.de + 1.1)} x={geo.selo.x} y={geo.selo.y} /> : null}
    </div>
  );
};
