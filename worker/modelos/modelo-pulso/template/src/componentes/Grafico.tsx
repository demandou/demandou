// Gráfico no painel do app.
// - barras: colunas feitas de casas (a mesma casa da divisão) que enchem de baixo para cima quando o
//   número é dito, com o valor contando em cima;
// - linha: o gráfico de frequência do app — as cinco faixas das zonas ao fundo e a linha que a caneta
//   desenha ponto a ponto (ou a forma da tendência, com a ponta batendo);
// - pizza: o anel do relógio dividido nas proporções (relogio.ts) e a legenda embaixo.
// Sem números ditos, a forma mostra só a tendência, com a etiqueta "ilustrativo".
import { Linhas, limitar, mistura, prog, temposDoTexto, trava } from "../anim";
import type { Geo } from "../layout";
import { encaixar, formatar, LETREIRO, larguraTexto, SANS } from "../medida";
import type { Grafico as GraficoT, Palavra } from "../plano";
import { CORES_FATIAS } from "../relogio";
import { cor, letreiro, mostrador, sans, ZONAS, zonaCor } from "../tema";
import { topoDaZona } from "./Zona";

type Dado = { rotulo: string; valor: number; em: number };

const casasDe = (v: number) => (Number.isInteger(v) ? 0 : 1);
const valorTexto = (v: number, unidade?: string) => `${formatar(v, casasDe(v))}${unidade ? (/^[%]/.test(unidade) ? unidade : ` ${unidade}`) : ""}`;

// etiqueta "ilustrativo" (ou outra), contornada, discreta
export const Etiqueta: React.FC<{ texto: string; x: number; y: number; alinhar?: "esquerda" | "direita" }> = ({ texto, x, y, alinhar = "direita" }) => (
  <div
    style={{
      ...letreiro,
      fontSize: 28,
      position: "absolute",
      top: y,
      ...(alinhar === "direita" ? { right: 1080 - x } : { left: x }),
      color: cor.tintaFraca,
      border: `3px solid ${cor.esboco}`,
      borderRadius: 999,
      padding: "8px 18px 7px",
      whiteSpace: "nowrap",
      background: "rgba(255,255,255,0.6)",
    }}
  >
    {texto}
  </div>
);

// título do gráfico (opcional), à esquerda, e a etiqueta à direita na mesma linha
const Cabecalho: React.FC<{ titulo?: string; etiqueta?: string; t: number; de: number; ate: number; palavras: Palavra[]; topo: number }> = ({
  titulo,
  etiqueta,
  t,
  de,
  ate,
  palavras,
  topo,
}) => {
  const largEtiqueta = etiqueta ? larguraTexto(etiqueta, 28, LETREIRO) + 50 : 0;
  const enc = titulo ? encaixar(titulo, { largura: 840 - largEtiqueta - (largEtiqueta ? 20 : 0), max: 56, min: 40, linhas: 2 }) : null;
  const tempos = titulo ? temposDoTexto(titulo, palavras, de, ate, de + 0.15) : [];
  return (
    <>
      {enc ? (
        <Linhas
          linhas={enc.linhas}
          tempos={tempos}
          t={t}
          x={120}
          y={topo}
          largura={840}
          alturaLinha={Math.round(enc.tamanho * 1.1)}
          estilo={{ fontFamily: mostrador, fontWeight: 700, fontSize: enc.tamanho, color: cor.tinta, letterSpacing: "-0.01em" }}
          esboco={cor.esboco}
        />
      ) : null}
      {etiqueta ? <Etiqueta texto={etiqueta} x={960} y={topo + 4} /> : null}
    </>
  );
};

export const alturaDoCabecalho = (titulo: string | undefined, etiqueta: boolean) => {
  if (!titulo) return etiqueta ? 64 : 0;
  const larg = 840 - (etiqueta ? larguraTexto("ilustrativo", 28, LETREIRO) + 70 : 0);
  const enc = encaixar(titulo, { largura: larg, max: 56, min: 40, linhas: 2 });
  return enc.linhas.length * Math.round(enc.tamanho * 1.1) + 24;
};

export const Grafico: React.FC<{ m: GraficoT; t: number; palavras: Palavra[]; geo: Geo; fim: number }> = ({ m, t, palavras, geo, fim }) => {
  const dados = (m.dados ?? []).slice(0, 6);
  const temDados = dados.length >= 2;
  if (m.forma === "pizza" && temDados) return <Pizza m={m} dados={dados} t={t} palavras={palavras} />;
  const ilustrativo = !temDados || m.ilustrativo;
  const topo = geo.abaixoCartao;
  const altCab = alturaDoCabecalho(m.titulo, !!ilustrativo);
  const area = { x: 120, y: topo + altCab, w: 840, h: 1520 - topo - altCab };
  const z = zonaCor(m.zona, m.tendencia === "cai" ? 4 : 2);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Cabecalho titulo={m.titulo} etiqueta={ilustrativo ? "ilustrativo" : undefined} t={t} de={m.de} ate={m.ate} palavras={palavras} topo={topo} />
      {m.forma === "barras" ? (
        <Barras dados={temDados ? dados : null} m={m} t={t} area={area} z={z} />
      ) : (
        <LinhaDoTempo dados={temDados ? dados : null} m={m} t={t} area={area} z={z} fim={fim} />
      )}
    </div>
  );
};

type Area = { x: number; y: number; w: number; h: number };
type Z = { cor: string; texto: string; fundo: string };

// formas da tendência, de 0 a 1 (5 colunas ou pontos)
const FORMAS: Record<NonNullable<GraficoT["tendencia"]>, number[]> = {
  sobe: [0.22, 0.36, 0.5, 0.7, 0.95],
  cai: [0.95, 0.72, 0.52, 0.36, 0.2],
  oscila: [0.45, 0.8, 0.35, 0.85, 0.55],
};

const Barras: React.FC<{ dados: Dado[] | null; m: GraficoT; t: number; area: Area; z: Z }> = ({ dados, m, t, area, z }) => {
  const forma = FORMAS[m.tendencia ?? "sobe"];
  const n = dados ? dados.length : forma.length;
  const gap = n > 4 ? 22 : 34;
  const colW = (area.w - gap * (n - 1)) / n;
  // rótulos embaixo (só com dados): até 2 linhas, mesmo corpo em todas as colunas
  const encs = dados ? dados.map((d) => encaixar(d.rotulo, { largura: colW, max: 38, min: 30, linhas: 2, fonte: SANS })) : [];
  const tamRot = encs.length ? Math.min(...encs.map((e) => e.tamanho)) : 0;
  const lhRot = Math.round(tamRot * 1.15);
  const linhasRot = dados ? dados.map((d) => encaixar(d.rotulo, { largura: colW, max: tamRot, min: tamRot, linhas: 2, fonte: SANS }).linhas) : [];
  const altRot = dados ? Math.max(...linhasRot.map((l) => l.length)) * lhRot + 14 : 20;
  // valores em cima: o mesmo corpo para todos, cabendo na coluna
  const textos = dados ? dados.map((d) => valorTexto(d.valor, m.unidade)) : [];
  let tamValor = 56;
  while (tamValor > 30 && textos.some((tx) => larguraTexto(tx, tamValor) > colW + gap * 0.6)) tamValor -= 2;
  const altValor = dados ? Math.round(tamValor * 1.15) + 6 : 0;
  const base = area.y + area.h - altRot;
  const alturaMax = base - (area.y + altValor + 10);
  const celH = 30;
  const celGap = 8;
  const nCel = Math.max(4, Math.floor((alturaMax + celGap) / (celH + celGap)));
  const maior = dados ? Math.max(...dados.map((d) => d.valor), 0.0001) : 1;
  const cels = dados ? dados.map((d) => Math.max(d.valor > 0 ? 1 : 0, Math.round((d.valor / maior) * nCel))) : forma.map((f) => Math.max(1, Math.round(f * nCel)));
  // quando cada coluna enche: com dados, no `em` de cada número; sem dados, em cascata a partir da tendência
  const inicioTendencia = m.tendenciaEm ?? m.de + 0.3;
  const emDe = (i: number) => (dados ? dados[i].em - 0.25 : inicioTendencia + i * 0.28);
  return (
    <>
      {/* linha de base */}
      <div style={{ position: "absolute", left: area.x, top: base + 4, width: area.w, height: 4, borderRadius: 2, background: cor.esboco }} />
      {cels.map((nc, i) => {
        const x = area.x + i * (colW + gap);
        const inicio = emDe(i);
        const passo = Math.min(0.06, 0.45 / Math.max(1, nc));
        const cheias = Array.from({ length: nc }, (_, k) => prog(t, inicio + k * passo, 0.2));
        const contagem = dados ? limitar(cheias.filter((c) => c > 0.5).length / nc) : 0;
        const topoCol = base - nc * (celH + celGap) + celGap;
        const dito = dados ? t >= dados[i].em - 0.3 : t >= inicio;
        return (
          <div key={i}>
            {/* casas a lápis (a altura que a coluna vai ter) e casas cheias */}
            {Array.from({ length: nc }, (_, k) => {
              const y = base - (k + 1) * (celH + celGap) + celGap;
              return (
                <div key={k} style={{ position: "absolute", left: x, top: y, width: colW, height: celH }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: 10, border: `3px dashed ${cor.esboco}`, opacity: 1 - cheias[k] }} />
                  <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: z.cor, opacity: cheias[k], scale: `1 ${0.5 + 0.5 * cheias[k]}`, transformOrigin: "bottom" }} />
                </div>
              );
            })}
            {dados ? (
              <>
                <div
                  style={{
                    position: "absolute",
                    left: x - gap * 0.3,
                    width: colW + gap * 0.6,
                    top: topoCol - altValor - 4,
                    textAlign: "center",
                    fontFamily: mostrador,
                    fontWeight: 700,
                    fontSize: tamValor,
                    lineHeight: `${Math.round(tamValor * 1.15)}px`,
                    color: dito ? z.texto : cor.esboco,
                    whiteSpace: "nowrap",
                  }}
                >
                  {dito ? valorTexto(contagem >= 1 ? dados[i].valor : dados[i].valor * contagem, m.unidade) : "–"}
                </div>
                {linhasRot[i].map((l, k) => (
                  <div
                    key={k}
                    style={{
                      position: "absolute",
                      left: x - 6,
                      width: colW + 12,
                      top: base + 18 + k * lhRot,
                      textAlign: "center",
                      fontFamily: sans,
                      fontWeight: 700,
                      fontSize: tamRot,
                      lineHeight: `${lhRot}px`,
                      color: dito ? cor.tinta : cor.esbocoTexto,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {l}
                  </div>
                ))}
              </>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

// curva suave (Catmull-Rom → Bézier) pelos pontos
const curva = (ps: [number, number][]) => {
  if (ps.length < 2) return "";
  let d = `M${ps[0][0].toFixed(1)} ${ps[0][1].toFixed(1)}`;
  for (let i = 0; i < ps.length - 1; i++) {
    const p0 = ps[Math.max(0, i - 1)];
    const p1 = ps[i];
    const p2 = ps[i + 1];
    const p3 = ps[Math.min(ps.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)},${c2[0].toFixed(1)} ${c2[1].toFixed(1)},${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};

const LinhaDoTempo: React.FC<{ dados: Dado[] | null; m: GraficoT; t: number; area: Area; z: Z; fim: number }> = ({ dados, m, t, area, z, fim }) => {
  const encs = dados ? dados.map((d) => encaixar(d.rotulo, { largura: area.w / dados.length - 8, max: 36, min: 28, linhas: 2, fonte: SANS })) : [];
  const tamRot = encs.length ? Math.min(...encs.map((e) => e.tamanho)) : 0;
  const lhRot = Math.round(tamRot * 1.15);
  const linhasRot = dados ? dados.map((d) => encaixar(d.rotulo, { largura: area.w / dados.length - 8, max: tamRot, min: tamRot, linhas: 2, fonte: SANS }).linhas) : [];
  const altRot = dados ? Math.max(...linhasRot.map((l) => l.length)) * lhRot + 16 : 10;
  const plot = { x: area.x, y: area.y + (dados ? 70 : 20), w: area.w, h: area.h - altRot - (dados ? 70 : 20) };
  // pontos
  const forma = FORMAS[m.tendencia ?? "sobe"];
  const valores = dados ? dados.map((d) => d.valor) : forma;
  const max = Math.max(...valores);
  const min = Math.min(...valores, 0);
  const faixa = max - min || 1;
  const n = valores.length;
  const xDe = (i: number) => plot.x + 40 + ((plot.w - 80) * i) / Math.max(1, n - 1);
  const yDe = (v: number) => plot.y + plot.h - 24 - ((v - min) / faixa) * (plot.h - 60);
  const pontos: [number, number][] = valores.map((v, i) => [xDe(i), yDe(v)]);
  // a caneta: com dados, chega a cada ponto no `em` dele; sem dados, desenha em ~1,6 s
  const inicio = m.tendenciaEm ?? m.de + 0.3;
  const tempos = dados ? dados.map((d) => d.em) : forma.map((_, i) => inicio + (i * 1.6) / (n - 1));
  let caneta = 0;
  for (let i = 0; i < n - 1; i++) caneta += prog(t, tempos[i], Math.max(0.2, tempos[i + 1] - tempos[i]), (x) => x);
  const p = dados ? (t < tempos[0] - 0.02 ? 0 : caneta / Math.max(1, n - 1)) : caneta / (n - 1);
  const d = curva(pontos);
  // a ponta: onde a caneta está (aproximado pelo segmento atual)
  const seg = Math.min(n - 2, Math.floor(p * (n - 1)));
  const fr = p * (n - 1) - seg;
  const ponta: [number, number] = [mistura(pontos[seg][0], pontos[seg + 1][0], fr), mistura(pontos[seg][1], pontos[seg + 1][1], fr)];
  // depois de desenhada, a ponta continua batendo (um anel que abre a cada ~0,8 s)
  const fase = (((t - (tempos[n - 1] ?? 0)) % 0.8) + 0.8) % 0.8;
  const anel = p >= 0.999 ? fase / 0.8 : 0;
  return (
    <>
      {/* as faixas das zonas ao fundo, de baixo (1) para cima (5) */}
      {ZONAS.map((zz, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: plot.x,
            width: plot.w,
            top: plot.y + (plot.h * (4 - i)) / 5,
            height: plot.h / 5 - 4,
            borderRadius: 14,
            background: zz.fundo,
            opacity: prog(t, m.de - 0.1 + i * 0.06, 0.3),
          }}
        />
      ))}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* a lápis: o caminho inteiro, tracejado */}
        <path d={d} fill="none" stroke={cor.esboco} strokeWidth={5} strokeDasharray="12 12" strokeLinecap="round" opacity={1 - p} />
        {p > 0.002 ? (
          <path d={d} fill="none" stroke={z.cor} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} />
        ) : null}
        {/* pontos ditos */}
        {dados
          ? pontos.map((pt, i) => {
              const a = prog(t, tempos[i] - 0.02, 0.25);
              return a > 0.01 ? <circle key={i} cx={pt[0]} cy={pt[1]} r={12 * a} fill="#FFFFFF" stroke={z.cor} strokeWidth={6} /> : null;
            })
          : null}
        {p > 0.002 ? (
          <>
            {anel > 0 ? <circle cx={ponta[0]} cy={ponta[1]} r={14 + 26 * anel} fill="none" stroke={z.cor} strokeWidth={4} opacity={(1 - anel) * 0.7} /> : null}
            <circle cx={ponta[0]} cy={ponta[1]} r={15} fill={z.cor} stroke="#FFFFFF" strokeWidth={5} />
          </>
        ) : null}
      </svg>
      {/* valores em cima dos pontos e rótulos embaixo */}
      {dados
        ? dados.map((dd, i) => {
            const a = prog(t, dd.em - 0.02, 0.25);
            const conta = prog(t, dd.em, 0.6, trava);
            const v = valorTexto(conta >= 1 ? dd.valor : dd.valor * conta, m.unidade);
            return (
              <div key={i}>
                <div
                  style={{
                    position: "absolute",
                    left: pontos[i][0] - 160,
                    width: 320,
                    top: pontos[i][1] - 82,
                    textAlign: "center",
                    fontFamily: mostrador,
                    fontWeight: 700,
                    fontSize: 48,
                    lineHeight: "56px",
                    color: z.texto,
                    opacity: a,
                    whiteSpace: "nowrap",
                  }}
                >
                  {v}
                </div>
                {linhasRot[i].map((l, k) => (
                  <div
                    key={k}
                    style={{
                      position: "absolute",
                      left: pontos[i][0] - area.w / n / 2,
                      width: area.w / n,
                      top: plot.y + plot.h + 14 + k * lhRot,
                      textAlign: "center",
                      fontFamily: sans,
                      fontWeight: 700,
                      fontSize: tamRot,
                      lineHeight: `${lhRot}px`,
                      color: a > 0.5 ? cor.tinta : cor.esbocoTexto,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {l}
                  </div>
                ))}
              </div>
            );
          })
        : null}
    </>
  );
};

// Pizza: o anel do relógio já mostra as fatias; embaixo, a legenda (cor, rótulo e valor contando)
const Pizza: React.FC<{ m: GraficoT; dados: Dado[]; t: number; palavras: Palavra[] }> = ({ m, dados, t, palavras }) => {
  const topo = topoDaZona();
  const altCab = m.titulo ? alturaDoCabecalho(m.titulo, false) : 0;
  const n = dados.length;
  const disponivel = 1520 - topo - altCab;
  const altLinha = Math.min(96, Math.floor(disponivel / n));
  const tam = Math.min(46, Math.round(altLinha * 0.52));
  const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
  const mostrarPct = !m.unidade;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Cabecalho titulo={m.titulo} t={t} de={m.de} ate={m.ate} palavras={palavras} topo={topo} />
      {dados.map((d, i) => {
        const y = topo + altCab + i * altLinha;
        const a = prog(t, d.em - 0.05, 0.3);
        const conta = prog(t, d.em, 0.6, trava);
        const valor = mostrarPct ? (d.valor / total) * 100 : d.valor;
        const texto = mostrarPct ? `${formatar(Math.round(valor * conta))}%` : valorTexto(conta >= 1 ? valor : valor * conta, m.unidade);
        const largValor = larguraTexto(mostrarPct ? "100%" : valorTexto(valor, m.unidade), tam * 1.12) + 10;
        const encR = encaixar(d.rotulo, { largura: 840 - 60 - largValor - 20, max: tam, min: 30, linhas: 1, fonte: SANS });
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: 120, top: y + altLinha / 2 - 18, width: 36, height: 36, borderRadius: 10, border: `3px dashed ${cor.esboco}`, opacity: 1 - a }} />
            <div style={{ position: "absolute", left: 120, top: y + altLinha / 2 - 18, width: 36, height: 36, borderRadius: 10, background: CORES_FATIAS[i], opacity: a, scale: String(0.7 + 0.3 * a) }} />
            <div
              style={{
                position: "absolute",
                left: 180,
                top: y + (altLinha - encR.tamanho * 1.2) / 2,
                fontFamily: sans,
                fontWeight: 700,
                fontSize: encR.tamanho,
                lineHeight: `${Math.round(encR.tamanho * 1.2)}px`,
                color: a > 0.5 ? cor.tinta : cor.esbocoTexto,
                whiteSpace: "nowrap",
              }}
            >
              {d.rotulo}
            </div>
            <div
              style={{
                position: "absolute",
                right: 120,
                top: y + (altLinha - tam * 1.3) / 2,
                fontFamily: mostrador,
                fontWeight: 700,
                fontSize: tam * 1.12,
                lineHeight: `${Math.round(tam * 1.3)}px`,
                color: a > 0.5 ? zonaCor(2).texto : cor.esbocoTexto,
                whiteSpace: "nowrap",
              }}
            >
              {a > 0.01 ? texto : "–"}
            </div>
            {i < n - 1 ? <div style={{ position: "absolute", left: 120, width: 840, top: y + altLinha - 1, height: 2, background: cor.fio }} /> : null}
          </div>
        );
      })}
    </div>
  );
};
