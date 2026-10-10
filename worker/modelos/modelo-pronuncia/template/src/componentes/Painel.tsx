import { prog, temposDasPalavras, usePalavras, useRotulos } from "../anim";
import { encaixar, largura as medir } from "../medida";
import { Foto, imagemDoPlano, temImagem } from "../motor/imagem";
import type { Comparacao, Grafico, Passos, Plano, Topicos } from "../plano";
import { cor, formatar, rotulo, sans } from "../tema";
import { type Alvo, Ponto, Traco } from "./Ponto";

// Os blocos de painel: ficam em cima, no mesmo painel violeta da ficha de som, com a pessoa na
// moldura larga embaixo. A linguagem é a da ficha: linhas grandes, o ponto coral pulando para o
// que está sendo dito, o risco no que está errado e o traço desenhado no que está certo.

const L = 960;
const TOPO = 92;

const Cabecalho: React.FC<{ rotulo?: string; titulo?: string; t: number; de: number; ate: number }> = ({ rotulo: r, titulo, t, de, ate }) => {
  const palavras = usePalavras();
  const R = useRotulos();
  const fit = titulo ? encaixar(titulo, L, 70, 44, 2, { peso: 800 }) : null;
  const tempos = titulo ? temposDasPalavras(palavras, de, titulo.split(/\s+/).length, ate) : [];
  let i = 0;
  return (
    <div style={{ position: "absolute", left: 0, top: TOPO, width: L }}>
      <div style={{ ...rotulo, opacity: prog(t, de - 0.05, 0.3) }}>{r ?? R.pronuncia}</div>
      {fit ? (
        <div style={{ marginTop: 14 }}>
          {fit.linhas.map((linha, k) => (
            <div key={k} style={{ fontFamily: sans, fontWeight: 800, fontSize: fit.tamanho, lineHeight: 1.12, color: cor.tinta, whiteSpace: "nowrap", letterSpacing: "-0.015em" }}>
              {linha.map((w) => {
                const p = prog(t, tempos[i++] - 0.05, 0.22);
                return (
                  <span key={`${w}-${i}`} style={{ opacity: p }}>
                    {w}{" "}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const alturaCabecalho = (titulo?: string) => (titulo ? 64 + encaixar(titulo, L, 70, 44, 2, { peso: 800 }).linhas.length * 80 : 50);

// ——— topicos e passos: linhas que entram na fala ———

export const Lista: React.FC<{ m: Topicos | Passos; t: number; plano: Plano }> = ({ m, t, plano }) => {
  const numerada = m.tipo === "passos";
  const topo = TOPO + alturaCabecalho(m.titulo) + 40;
  const espaco = 1000 - topo;
  const n = m.itens.length;
  const recuo = numerada ? 96 : 64;
  // corpo único para todas as linhas: o maior que deixa cada item em até 2 linhas e cabe na altura
  let tam = 76;
  const medidas = () =>
    m.itens.map((it) => {
      const img = temImagem(imagemDoPlano(plano, it.imagem));
      const larg = L - recuo - (img ? 150 : 0);
      const fit = encaixar(it.texto, larg, tam, tam, 2, { peso: 800 });
      const h = fit.linhas.length * tam * 1.12 + (it.detalhe ? 52 : 0);
      return { fit, larg, img, h: Math.max(h, img ? 130 : 0) };
    });
  let ms = medidas();
  while (tam > 40 && ms.reduce((s, x) => s + x.h, 0) + (n - 1) * 34 > espaco) {
    tam -= 2;
    ms = medidas();
  }
  const ys: number[] = [];
  let y = 0;
  ms.forEach((x) => {
    ys.push(y);
    y += x.h + 34;
  });
  const alvos: Alvo[] = m.itens.map((it, i) => ({ t: it.em, x: numerada ? 34 : 18, y: ys[i] + (numerada ? -6 : tam * 0.58) }));
  const atual = m.itens.reduce((k, it, i) => (t >= it.em - 0.1 ? i : k), -1);
  return (
    <>
      <Cabecalho rotulo={m.rotulo} titulo={m.titulo} t={t} de={m.de} ate={m.itens[0]?.em ?? m.ate} />
      <div style={{ position: "absolute", left: 0, top: topo, width: L, height: espaco }}>
        {numerada && n > 1 ? (
          <div
            style={{
              position: "absolute",
              left: 32,
              top: tam * 0.6,
              width: 4,
              borderRadius: 2,
              background: cor.linha,
              height: Math.max(0, ys[n - 1]),
            }}
          >
            <div style={{ width: 4, borderRadius: 2, background: cor.coral, height: atual > 0 ? ys[atual] * prog(t, m.itens[atual].em - 0.1, 0.3) + (atual > 1 ? 0 : 0) : 0 }} />
          </div>
        ) : null}
        {m.itens.map((it, i) => {
          const p = prog(t, it.em - 0.06, 0.26);
          const pd = prog(t, it.em + 0.35, 0.3);
          const x = ms[i];
          const aceso = i === atual;
          return (
            <div key={i} style={{ position: "absolute", left: 0, top: ys[i], width: L, ...(p >= 1 ? {} : { opacity: p, translate: `0 ${(1 - p) * 18}px` }) }}>
              {numerada ? (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: tam * 0.1,
                    width: 68,
                    height: 68,
                    borderRadius: 34,
                    background: aceso ? cor.coral : cor.fundo2,
                    color: aceso ? cor.fundo : cor.tinta,
                    fontFamily: sans,
                    fontWeight: 800,
                    fontSize: 40,
                    lineHeight: "68px",
                    textAlign: "center",
                  }}
                >
                  {i + 1}
                </div>
              ) : null}
              <div style={{ position: "absolute", left: recuo, top: 0, width: x.larg }}>
                {x.fit.linhas.map((linha, k) => (
                  <div key={k} style={{ fontFamily: sans, fontWeight: 800, fontSize: tam, lineHeight: 1.12, whiteSpace: "nowrap", color: aceso || atual < 0 ? cor.tinta : "rgba(251,246,238,0.62)" }}>
                    {linha.join(" ")}
                  </div>
                ))}
                {it.detalhe ? <div style={{ marginTop: 6, fontFamily: sans, fontWeight: 600, fontSize: 40, color: cor.lilas, opacity: pd, whiteSpace: "nowrap" }}>{it.detalhe}</div> : null}
              </div>
              {x.img ? (
                <Foto
                  imagem={imagemDoPlano(plano, it.imagem)}
                  foco={it.imagem?.foco}
                  de={it.em}
                  t={t}
                  entrada="escala"
                  largura={124}
                  altura={124}
                  style={{ position: "absolute", left: L - 124, top: 0, borderRadius: 22, border: `4px solid ${cor.tinta}` }}
                />
              ) : null}
            </div>
          );
        })}
        {numerada ? null : <Ponto alvos={alvos} t={t} raio={13} />}
        {numerada ? <Ponto alvos={alvos} t={t} raio={9} cor={cor.tinta} /> : null}
      </div>
    </>
  );
};

// ——— comparacao: dois lados; o que perde é riscado (errado-certo) e o que ganha leva o traço ———

export const LadoALado: React.FC<{ m: Comparacao; t: number }> = ({ m, t }) => {
  const R = useRotulos();
  const modo = m.modo ?? "contra";
  const topo = TOPO + alturaCabecalho(m.titulo) + 50;
  const venc = m.vencedor;
  const tV = m.vencedorEm ?? (venc !== undefined ? m.lados[venc].em + 0.6 : Infinity);
  const pV = prog(t, tV, 0.35);
  const fits = m.lados.map((l) => encaixar(l.texto, L - 40, 80, 46, 2, { peso: 800 }));
  const tam = Math.min(...fits.map((f) => f.tamanho));
  const blocos = m.lados.map((l) => encaixar(l.texto, L - 40, tam, tam, 2, { peso: 800 }));
  const h0 = 50 + blocos[0].linhas.length * tam * 1.12;
  const sepH = 110;
  const ys = [0, h0 + sepH];
  const simbolo = modo === "antes-depois" ? "→" : modo === "errado-certo" ? R.naoEE : "vs";
  const alvos: Alvo[] = m.lados.map((l, i) => ({ t: l.em, x: 10, y: ys[i] + 12 }));
  if (venc !== undefined) {
    const lw = Math.max(...blocos[venc].linhas.map((ln) => medir(ln.join(" "), tam, { peso: 800 })));
    alvos.push({ t: tV, x: Math.min(L - 40, lw) / 2, y: ys[venc] + 46 });
  }
  return (
    <>
      <Cabecalho rotulo={m.rotulo ?? (modo === "errado-certo" ? R.certo : R.compare)} titulo={m.titulo} t={t} de={m.de} ate={m.lados[0].em} />
      <div style={{ position: "absolute", left: 0, top: topo, width: L }}>
        {m.lados.map((l, i) => {
          const p = prog(t, l.em - 0.06, 0.26);
          const perdeu = venc !== undefined && venc !== i;
          const riscado = modo === "errado-certo" && (venc !== undefined ? perdeu : i === 0);
          const pR = riscado ? prog(t, venc !== undefined ? tV : m.lados[1].em, 0.3) : 0;
          const lw = Math.max(...blocos[i].linhas.map((ln) => medir(ln.join(" "), tam, { peso: 800 })));
          return (
            <div key={i} style={{ position: "absolute", left: 0, top: ys[i], width: L, ...(p >= 1 ? {} : { opacity: p, translate: `0 ${(1 - p) * 16}px` }) }}>
              <div style={{ ...rotulo, color: venc === i && pV > 0 ? cor.coral : cor.lilas }}>{l.rotulo}</div>
              <div style={{ position: "relative", marginTop: 10 }}>
                {blocos[i].linhas.map((ln, k) => (
                  <div key={k} style={{ fontFamily: sans, fontWeight: 800, fontSize: tam, lineHeight: 1.12, whiteSpace: "nowrap", color: (perdeu && pV > 0) || pR > 0 ? cor.apagado : cor.tinta }}>
                    {ln.join(" ")}
                  </div>
                ))}
                {pR > 0 ? <div style={{ position: "absolute", left: -6, top: tam * 0.56, height: 7, borderRadius: 4, width: (lw + 12) * pR, background: cor.coral }} /> : null}
                {venc === i && pV > 0 ? <Traco largura={Math.min(L - 40, lw)} p={pV} style={{ left: 0, top: blocos[i].linhas.length * tam * 1.12 + 2 }} /> : null}
              </div>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, top: h0 + 30, width: L, display: "flex", alignItems: "center", gap: 20, opacity: prog(t, m.lados[1].em - 0.3, 0.3) }}>
          <div style={{ flex: 1, height: 3, background: cor.linha }} />
          <div style={{ ...rotulo, color: cor.lilas }}>{simbolo}</div>
          <div style={{ flex: 1, height: 3, background: cor.linha }} />
        </div>
        <Ponto alvos={alvos} t={t} raio={12} />
      </div>
    </>
  );
};

// ——— grafico: barras como medidores de som, linha, pizza (anel) ou a onda da tendência ———

export const GraficoSom: React.FC<{ m: Grafico; t: number }> = ({ m, t }) => {
  const R = useRotulos();
  const topo = TOPO + alturaCabecalho(m.titulo) + 40;
  const H = Math.min(560, 990 - topo - 70);
  const dados = m.dados ?? [];
  const max = Math.max(1, ...dados.map((d) => d.valor));
  const un = m.unidade ?? "";
  const fmt = (v: number) => {
    const casas = dados.some((d) => d.valor % 1 !== 0) ? 1 : 0;
    const prefixo = /^(R\$|US\$|€|\$)$/.test(un) ? `${un} ` : "";
    const sufixo = prefixo ? "" : un;
    return `${prefixo}${formatar(v, casas)}${sufixo}`;
  };
  const ilustrativo = m.ilustrativo || !dados.length;
  const etiqueta = ilustrativo ? (
    <div style={{ position: "absolute", right: 0, top: TOPO, ...rotulo, color: cor.coral }}>{R.ilustrativo}</div>
  ) : null;
  const cab = <Cabecalho rotulo={m.rotulo ?? R.numeros} titulo={m.titulo} t={t} de={m.de} ate={dados[0]?.em ?? m.tendenciaEm ?? m.ate} />;

  if (!dados.length || m.forma === "linha") {
    // pontos: os dados ditos, ou uma onda de tendência (sobe, cai, oscila)
    const N = dados.length || 7;
    const pontos = dados.length
      ? dados.map((d, i) => ({ x: (i / Math.max(1, N - 1)) * (L - 80) + 40, y: H - 60 - (d.valor / max) * (H - 140), em: d.em }))
      : Array.from({ length: N }, (_, i) => {
          const f = i / (N - 1);
          const base = m.tendencia === "cai" ? 1 - f : m.tendencia === "oscila" ? 0.5 + 0.32 * Math.sin(f * Math.PI * 3) : f;
          const ruido = m.tendencia === "oscila" ? 0 : 0.06 * Math.sin(f * 11);
          return { x: f * (L - 80) + 40, y: H - 60 - (0.12 + 0.76 * Math.min(1, Math.max(0, base + ruido))) * (H - 140), em: (m.tendenciaEm ?? m.de + 0.3) + f * 1.2 };
        });
    const d = pontos.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
    const desenho = prog(t, pontos[0].em - 0.05, Math.max(0.6, pontos[pontos.length - 1].em - pontos[0].em + 0.3));
    const alvos: Alvo[] = pontos.map((p) => ({ t: p.em, x: p.x, y: p.y - 20 }));
    return (
      <>
        {cab}
        {etiqueta}
        <div style={{ position: "absolute", left: 0, top: topo, width: L, height: H }}>
          <div style={{ position: "absolute", left: 40, right: 40, top: H - 60, height: 3, background: cor.linha }} />
          <svg width={L} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <path d={d} fill="none" stroke={cor.coral} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - desenho} />
          </svg>
          {dados.map((dd, i) => (
            <div key={i} style={{ opacity: prog(t, dd.em - 0.05, 0.25) }}>
              <div style={{ position: "absolute", left: pontos[i].x - 120, width: 240, top: pontos[i].y - 86, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 44, color: cor.tinta }}>{fmt(dd.valor)}</div>
              <div style={{ position: "absolute", left: pontos[i].x - 120, width: 240, top: H - 44, textAlign: "center", fontFamily: sans, fontWeight: 700, fontSize: 34, color: cor.lilas, whiteSpace: "nowrap" }}>{dd.rotulo}</div>
            </div>
          ))}
          <Ponto alvos={alvos} t={t} raio={12} cor={cor.tinta} />
        </div>
      </>
    );
  }

  if (m.forma === "pizza") {
    // anel: cada fatia entra quando é dita; a legenda ao lado
    const soma = dados.reduce((s, d) => s + d.valor, 0) || 1;
    const R = Math.min(200, H / 2 - 20);
    const cx = R + 20;
    const cy = H / 2;
    let acc = 0;
    const tons = [cor.coral, cor.tinta, cor.lilas, "#7E6FD8", "#FFB3C1", "#5B4BB0"];
    return (
      <>
        {cab}
        {etiqueta}
        <div style={{ position: "absolute", left: 0, top: topo, width: L, height: H }}>
          <svg width={2 * R + 40} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
            {dados.map((dd, i) => {
              const frac = dd.valor / soma;
              const ini = acc;
              acc += frac;
              const p = prog(t, dd.em - 0.05, 0.45);
              const circ = 2 * Math.PI * (R - 34);
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={R - 34}
                  fill="none"
                  stroke={tons[i % tons.length]}
                  strokeWidth={60}
                  strokeDasharray={`${circ * frac * p} ${circ}`}
                  strokeDashoffset={-circ * ini}
                  transform={`rotate(-90 ${cx} ${cy})`}
                />
              );
            })}
          </svg>
          {dados.map((dd, i) => (
            <div key={i} style={{ position: "absolute", left: 2 * R + 80, top: cy - (dados.length * 92) / 2 + i * 92, display: "flex", alignItems: "center", gap: 18, opacity: prog(t, dd.em - 0.05, 0.25) }}>
              <div style={{ width: 26, height: 26, borderRadius: 13, background: tons[i % tons.length] }} />
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 46, color: cor.tinta, whiteSpace: "nowrap" }}>{fmt(dd.valor)}</div>
              <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 34, color: cor.lilas, whiteSpace: "nowrap" }}>{dd.rotulo}</div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // barras: medidores de som que sobem quando o número é dito; a maior fica coral
  const n = dados.length;
  const vao = 36;
  const lb = Math.min(180, (L - vao * (n - 1)) / n);
  const x0 = (L - (lb * n + vao * (n - 1))) / 2;
  const iMax = dados.findIndex((d) => d.valor === max);
  const alvos: Alvo[] = dados.map((d, i) => ({ t: d.em + 0.35, x: x0 + i * (lb + vao) + lb / 2, y: H - 70 - (d.valor / max) * (H - 170) - 64 }));
  return (
    <>
      {cab}
      {etiqueta}
      <div style={{ position: "absolute", left: 0, top: topo, width: L, height: H }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: H - 66, height: 3, background: cor.linha }} />
        {dados.map((d, i) => {
          const p = prog(t, d.em - 0.05, 0.5);
          const h = (d.valor / max) * (H - 170) * p;
          const x = x0 + i * (lb + vao);
          return (
            <div key={i} style={{ opacity: prog(t, d.em - 0.08, 0.15) }}>
              <div style={{ position: "absolute", left: x, width: lb, top: H - 70 - h, height: h, borderRadius: 18, background: i === iMax ? cor.coral : cor.tinta }} />
              <div style={{ position: "absolute", left: x - 30, width: lb + 60, top: H - 70 - h - 58, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 42, color: cor.tinta, whiteSpace: "nowrap" }}>{fmt(d.valor * p)}</div>
              <div style={{ position: "absolute", left: x - 30, width: lb + 60, top: H - 52, textAlign: "center", fontFamily: sans, fontWeight: 700, fontSize: 34, color: cor.lilas, whiteSpace: "nowrap" }}>{d.rotulo}</div>
            </div>
          );
        })}
        <Ponto alvos={alvos} t={t} raio={11} />
      </div>
    </>
  );
};
