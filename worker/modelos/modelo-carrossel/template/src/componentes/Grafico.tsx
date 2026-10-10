// Página de gráfico, como um slide de infográfico de carrossel: título que se monta na fala e,
// embaixo, barras, linha ou pizza desenhadas com o mesmo traço dos desenhos (petróleo, pontas
// redondas, cor chapada que acende depois). Cada dado entra na palavra dele e o número conta.
// Sem números ditos, uma curva de tendência (sobe, cai, oscila) com a etiqueta "ilustrativo".
import { Easing, interpolate } from "remotion";
import { prog, temposDoTexto, TextoFalado, Traco } from "../anim";
import { casasDe, encaixar, larguraLinha, numeroBR } from "../medida";
import { AVATAR } from "../paginas";
import type { Grafico as TGrafico, Palavra } from "../plano";
import { BASE_CONTEUDO, BASE_SEM_LEGENDA, cor, fonte, MARGEM, rotulo, W } from "../tema";
import { Ilustrativo } from "./CartoesUniversais";

const LARGURA = W - 2 * MARGEM;
const TOPO_CONTEUDO = AVATAR.y + AVATAR.lado + 44;
// cores das fatias da pizza, na ordem (o primeiro dado é o coral)
const FATIAS = [cor.coral, cor.petroleo, cor.areiaFunda, "#7FA3AB", "#F2B4A5", "#B9A58C"];
const MOEDAS = ["R$", "US$", "U$", "€", "£", "$"];

// valor com a unidade: moeda vai antes ("R$ 1.200"), o resto depois ("40%", "3 mil")
const comUnidade = (valor: string, unidade?: string) => {
  const u = unidade?.trim();
  if (!u) return valor;
  if (MOEDAS.includes(u)) return `${u} ${valor}`;
  return u === "%" ? `${valor}%` : `${valor} ${u}`;
};

// curva suave que passa pelos pontos (Catmull-Rom → Bézier)
const curva = (pts: [number, number][]) => {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};

// formas ilustrativas (frações da altura, de baixo para cima)
const TENDENCIAS = {
  sobe: [0.12, 0.3, 0.24, 0.5, 0.44, 0.72, 0.9],
  cai: [0.9, 0.7, 0.76, 0.5, 0.56, 0.3, 0.12],
  oscila: [0.42, 0.72, 0.34, 0.78, 0.38, 0.7, 0.5],
};

// o número conta até o valor (a partir de `inicio`: zero nas barras, o ponto anterior na linha)
const contar = (t: number, em: number, valor: number, inicio = 0) =>
  inicio + (valor - inicio) * interpolate(t, [em - 0.05, em + 0.75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

export const Grafico: React.FC<{ m: TGrafico; palavras: Palavra[]; t: number; chegada: number }> = ({ m, palavras, t, chegada }) => {
  const base = m.legenda ? BASE_CONTEUDO : BASE_SEM_LEGENDA;
  const dados = (m.dados ?? []).slice(0, 6);
  const temDados = dados.length >= 2;
  const ilustrativo = m.ilustrativo || !temDados;
  const titulo = m.titulo?.trim()
    ? encaixar(m.titulo, { largura: LARGURA, max: 92, min: 64, linhas: 2, fonte: { peso: 800, espacamento: -0.03 }, preferirMenos: 0.85 })
    : null;
  const tempos = m.titulo ? temposDoTexto(m.titulo, palavras, m.de, (dados[0]?.em ?? m.tendenciaEm ?? m.ate) + 0.3, m.de + 0.1) : [];
  const alturaRotulo = m.rotulo || ilustrativo ? 64 : 0;
  const alturaTitulo = alturaRotulo + (titulo ? titulo.linhas.length * titulo.tamanho * 1.02 : 0);
  const topoArea = TOPO_CONTEUDO + alturaTitulo + 60;
  const fundoArea = base - 24;
  // cada valor com as casas dele (1.200 e 850,5 lado a lado, sem "1.200,0")
  const casasDo = (v: number) => casasDe(v);
  const forma = m.forma === "pizza" && !temDados ? "linha" : m.forma;
  const pRegua = prog(t, chegada - 0.2, 0.8, Easing.inOut(Easing.cubic));

  let grafico: React.ReactNode = null;

  if (!temDados) {
    // ——— tendência sem números: a curva (ou as barras) desenha o movimento ———
    const inicio = m.tendenciaEm ?? Math.max(m.de + 0.3, chegada - 0.1);
    const fr = TENDENCIAS[m.tendencia ?? "sobe"] ?? TENDENCIAS.sobe;
    const h = fundoArea - topoArea - 30;
    const yDe = (f: number) => topoArea + 20 + h * (1 - f);
    if (forma === "barras") {
      const n = fr.length;
      const vao = 26;
      const larguraBarra = (LARGURA - vao * (n - 1)) / n;
      grafico = (
        <>
          {fr.map((f, i) => {
            const pb = prog(t, inicio + i * 0.16, 0.5);
            const alto = (fundoArea - yDe(f)) * pb;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: MARGEM + i * (larguraBarra + vao),
                  top: fundoArea - alto,
                  width: larguraBarra,
                  height: alto,
                  borderRadius: "22px 22px 6px 6px",
                  background: i === n - 1 ? cor.coral : cor.areia,
                  boxShadow: `inset 0 0 0 5px ${cor.petroleo}`,
                }}
              />
            );
          })}
        </>
      );
    } else {
      const pts = fr.map((f, i) => [MARGEM + 20 + ((LARGURA - 60) * i) / (fr.length - 1), yDe(f)] as [number, number]);
      const d = curva(pts);
      const pCurva = prog(t, inicio, 1.4, Easing.inOut(Easing.cubic));
      const pArea = prog(t, inicio + 1.0, 0.6);
      const fim = pts[pts.length - 1];
      grafico = (
        <svg width={W} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1={MARGEM} x2={MARGEM + LARGURA * pRegua} y1={yDe(g)} y2={yDe(g)} stroke={cor.petroleo} strokeOpacity={0.12} strokeWidth={3} strokeDasharray="2 14" strokeLinecap="round" />
          ))}
          <path d={`${d} L${fim[0]} ${fundoArea} L${pts[0][0]} ${fundoArea} Z`} fill={cor.areia} opacity={pArea} />
          <line x1={MARGEM} x2={MARGEM + LARGURA * pRegua} y1={fundoArea} y2={fundoArea} stroke={cor.petroleo} strokeWidth={5} strokeLinecap="round" />
          <Traco d={d} p={pCurva} cor={cor.petroleo} largura={10} />
          {pCurva > 0.98 ? <circle cx={fim[0]} cy={fim[1]} r={20} fill={cor.coral} stroke={cor.creme} strokeWidth={8} /> : null}
        </svg>
      );
    }
  } else if (forma === "barras") {
    // ——— barras: cada uma cresce na palavra dela; a maior fica coral ———
    const n = dados.length;
    const vao = n >= 5 ? 22 : 34;
    const larguraBarra = Math.min(200, (LARGURA - vao * (n - 1)) / n);
    const inicioX = MARGEM + (LARGURA - (larguraBarra * n + vao * (n - 1))) / 2;
    const maximo = Math.max(...dados.map((d) => Math.abs(d.valor)), 1e-9);
    const corpoValor = Math.min(54, ...dados.map((d) => Math.floor((54 * (larguraBarra + vao - 8)) / Math.max(1, larguraLinha(comUnidade(numeroBR(d.valor, casasDo(d.valor)), m.unidade), 54, { peso: 800 })))));
    const rotulos = dados.map((d) => encaixar(d.rotulo, { largura: larguraBarra + vao - 10, max: 36, min: 30, linhas: 2, fonte: { peso: 600 }, preferirMenos: 1 }));
    const alturaRotulos = Math.max(...rotulos.map((r) => r.linhas.length * r.tamanho * 1.1)) + 16;
    const baseBarras = fundoArea - alturaRotulos;
    const alturaMax = baseBarras - topoArea - corpoValor - 24;
    const maior = dados.reduce((a, d, i) => (Math.abs(d.valor) > Math.abs(dados[a].valor) ? i : a), 0);
    grafico = (
      <>
        <svg width={W} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <line x1={MARGEM} x2={MARGEM + LARGURA * pRegua} y1={baseBarras} y2={baseBarras} stroke={cor.petroleo} strokeWidth={5} strokeLinecap="round" />
        </svg>
        {dados.map((d, i) => {
          const pb = prog(t, d.em - 0.1, 0.6);
          const alto = Math.max(10, (Math.abs(d.valor) / maximo) * alturaMax) * pb;
          const x = inicioX + i * (larguraBarra + vao);
          const valor = comUnidade(numeroBR(contar(t, d.em, d.valor), casasDo(d.valor)), m.unidade);
          return (
            <div key={`${d.rotulo}-${i}`}>
              {/* vaga a lápis da barra */}
              <div
                style={{
                  position: "absolute",
                  left: x,
                  top: baseBarras - 120,
                  width: larguraBarra,
                  height: 120,
                  borderRadius: "22px 22px 6px 6px",
                  border: `3px dashed rgba(15,75,90,${0.25 * (1 - pb)})`,
                  boxSizing: "border-box",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: x,
                  top: baseBarras - alto,
                  width: larguraBarra,
                  height: alto,
                  borderRadius: "22px 22px 6px 6px",
                  background: i === maior ? cor.coral : cor.areia,
                  boxShadow: `inset 0 0 0 5px ${cor.petroleo}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: x - vao / 2,
                  width: larguraBarra + vao,
                  top: baseBarras - alto - corpoValor - 14,
                  textAlign: "center",
                  fontFamily: fonte,
                  fontWeight: 800,
                  fontSize: corpoValor,
                  lineHeight: 1,
                  color: cor.petroleo,
                  opacity: pb,
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {valor}
              </div>
              <div style={{ position: "absolute", left: x - vao / 2, width: larguraBarra + vao, top: baseBarras + 16, opacity: 0.45 + 0.55 * pb }}>
                {rotulos[i].linhas.map((l, k) => (
                  <div key={k} style={{ textAlign: "center", fontFamily: fonte, fontWeight: 600, fontSize: rotulos[i].tamanho, lineHeight: 1.1, color: cor.petroleo, whiteSpace: "nowrap" }}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  } else if (forma === "linha") {
    // ——— linha: o traço anda de um ponto ao outro, na palavra de cada dado ———
    const n = dados.length;
    // embaixo de cada ponto: o valor (que conta) e o rótulo; nada de número em cima da linha
    const larguraColuna = Math.min(300, LARGURA / n);
    const rotulos = dados.map((d) => encaixar(d.rotulo, { largura: larguraColuna - 12, max: 36, min: 30, linhas: 2, fonte: { peso: 600 }, preferirMenos: 1 }));
    const corpoValor = Math.min(48, ...dados.map((d) => Math.floor((48 * (larguraColuna - 12)) / Math.max(1, larguraLinha(comUnidade(numeroBR(d.valor, casasDo(d.valor)), m.unidade), 48, { peso: 800 })))));
    const alturaRotulos = Math.max(...rotulos.map((r) => r.linhas.length * r.tamanho * 1.1)) + corpoValor + 34;
    const baseLinha = fundoArea - alturaRotulos;
    // a escala acompanha os dados (a variação aparece), com folga em cima e embaixo; não cruza o zero
    const valores = dados.map((d) => d.valor);
    const menor = Math.min(...valores);
    const maior = Math.max(...valores);
    const folga = (maior - menor) * 0.2 || Math.abs(maior) * 0.1 || 1;
    const minimo = menor >= 0 ? Math.max(0, menor - folga) : menor - folga;
    const maximo = maior + folga * 0.5;
    const faixa = maximo - minimo || 1;
    const topoPontos = topoArea + 80;
    const yDe = (v: number) => baseLinha - 30 - ((v - minimo) / faixa) * (baseLinha - 30 - topoPontos);
    const margemX = Math.max(70, larguraColuna / 2 - 10);
    const xDe = (i: number) => MARGEM + margemX + ((LARGURA - 2 * margemX) * i) / (n - 1);
    const pts = dados.map((d, i) => [xDe(i), yDe(d.valor)] as [number, number]);
    // quanto da linha já foi desenhado: segmento i→i+1 entre o dado i e o i+1
    const segmento = (i: number) => prog(t, dados[i + 1].em - 0.45, 0.5, Easing.inOut(Easing.cubic));
    grafico = (
      <svg width={W} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {[0.33, 0.66].map((g) => (
          <line key={g} x1={MARGEM} x2={MARGEM + LARGURA * pRegua} y1={baseLinha - (baseLinha - topoPontos) * g} y2={baseLinha - (baseLinha - topoPontos) * g} stroke={cor.petroleo} strokeOpacity={0.12} strokeWidth={3} strokeDasharray="2 14" strokeLinecap="round" />
        ))}
        <line x1={MARGEM} x2={MARGEM + LARGURA * pRegua} y1={baseLinha} y2={baseLinha} stroke={cor.petroleo} strokeWidth={5} strokeLinecap="round" />
        {pts.slice(0, -1).map((p, i) => (
          <Traco key={`s${i}`} d={`M${p[0]} ${p[1]} L${pts[i + 1][0]} ${pts[i + 1][1]}`} p={segmento(i)} cor={cor.petroleo} largura={9} />
        ))}
        {dados.map((d, i) => {
          const pp = prog(t, d.em - 0.08, 0.35);
          const ultimo = i === n - 1;
          const valor = comUnidade(numeroBR(contar(t, d.em, d.valor, i ? dados[i - 1].valor : d.valor), casasDo(d.valor)), m.unidade);
          return (
            <g key={`p${i}`} opacity={0.35 + 0.65 * pp}>
              <circle cx={pts[i][0]} cy={pts[i][1]} r={pp > 0 ? 18 : 14} fill={pp > 0.5 ? (ultimo ? cor.coral : cor.creme) : "none"} stroke={cor.petroleo} strokeWidth={6} strokeDasharray={pp > 0 ? undefined : "3 8"} />
              {/* fio pontilhado do ponto até o eixo, para ler o valor embaixo */}
              {pp > 0 ? <line x1={pts[i][0]} x2={pts[i][0]} y1={pts[i][1] + 26} y2={baseLinha - 8} stroke={cor.petroleo} strokeOpacity={0.25 * pp} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" /> : null}
              {pp > 0 ? (
                <text x={pts[i][0]} y={baseLinha + 18 + corpoValor * 0.86} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={corpoValor} fill={ultimo ? cor.coral : cor.petroleo} opacity={pp}>
                  {valor}
                </text>
              ) : null}
              {rotulos[i].linhas.map((l, k) => (
                <text key={k} x={pts[i][0]} y={baseLinha + 28 + corpoValor + rotulos[i].tamanho * (k + 0.9) * 1.1} textAnchor="middle" fontFamily={fonte} fontWeight={600} fontSize={rotulos[i].tamanho} fill={cor.petroleoSuave}>
                  {l}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    );
  } else {
    // ——— pizza: a rosca se completa fatia a fatia; a legenda acende junto ———
    const n = dados.length;
    const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
    const colunas = n > 3 ? 2 : 1;
    const linhasLegenda = Math.ceil(n / colunas);
    const alturaLegenda = linhasLegenda * 84;
    const diametro = Math.min(640, fundoArea - topoArea - alturaLegenda - 60);
    // o conjunto (rosca + legenda) fica no meio da área
    const sobra = Math.max(0, fundoArea - topoArea - (diametro + 50 + alturaLegenda));
    const topoRosca = topoArea + sobra / 2;
    const r = diametro / 2 - 46;
    const cx = W / 2;
    const cy = topoRosca + diametro / 2;
    const circ = 2 * Math.PI * r;
    let acumulado = 0;
    const larguraColuna = LARGURA / colunas;
    grafico = (
      <>
        <svg width={W} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={cor.areia} strokeWidth={84} />
          {dados.map((d, i) => {
            const fracao = Math.max(0, d.valor) / total;
            const inicio = acumulado;
            acumulado += fracao;
            const pf = prog(t, d.em - 0.1, 0.7, Easing.inOut(Easing.cubic));
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={FATIAS[i % FATIAS.length]}
                strokeWidth={84}
                strokeDasharray={`${Math.max(0, circ * fracao * pf - 6)} ${circ}`}
                strokeDashoffset={-circ * inicio}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
          })}
        </svg>
        {dados.map((d, i) => {
          const pf = prog(t, d.em - 0.1, 0.4);
          const col = i % colunas;
          const lin = Math.floor(i / colunas);
          const valor = comUnidade(numeroBR(contar(t, d.em, d.valor), casasDo(d.valor)), m.unidade);
          const larguraTexto = larguraColuna - 60;
          const corpo = Math.max(32, Math.min(48, Math.floor((48 * larguraTexto) / Math.max(1, larguraLinha(`${d.rotulo} ${valor}`, 48, { peso: 600 })))));
          return (
            <div
              key={`l${i}`}
              style={{
                position: "absolute",
                left: MARGEM + col * larguraColuna,
                top: topoRosca + diametro + 50 + lin * 84,
                width: larguraColuna - 20,
                display: "flex",
                alignItems: "center",
                gap: 16,
                opacity: 0.35 + 0.65 * pf,
                whiteSpace: "nowrap",
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 10, background: FATIAS[i % FATIAS.length], flexShrink: 0 }} />
              <div style={{ fontFamily: fonte, fontWeight: 600, fontSize: corpo, color: cor.petroleo }}>{d.rotulo}</div>
              <div style={{ fontFamily: fonte, fontWeight: 800, fontSize: corpo, color: cor.petroleo, opacity: pf }}>{valor}</div>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <>
      <div style={{ position: "absolute", left: MARGEM, top: TOPO_CONTEUDO, width: LARGURA }}>
        {alturaRotulo ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 40, marginBottom: 24 }}>
            <div style={{ ...rotulo, color: cor.coral, opacity: prog(t, chegada, 0.4), whiteSpace: "nowrap" }}>{m.rotulo ?? ""}</div>
            {ilustrativo ? <Ilustrativo p={prog(t, chegada, 0.4)} /> : null}
          </div>
        ) : null}
        {titulo ? (
          <TextoFalado linhas={titulo.linhas} tempos={tempos} t={t} tamanho={titulo.tamanho} peso={800} cor={cor.petroleo} entrelinha={1.02} espacamento="-0.03em" />
        ) : null}
      </div>
      {grafico}
    </>
  );
};
