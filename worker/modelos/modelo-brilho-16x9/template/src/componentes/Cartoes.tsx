// Blocos universais no cartão creme que sobe de baixo (layout "cheio" ou "perto"): a mesma peça do
// truque e do fechamento — cantos de 48, sombra suave, o rosto livre em cima.
//   comparacao → dois godês lado a lado (o que perde volta "a lápis"; o que ganha leva o check)
//   grafico    → barras = amostras passadas no comprimento do valor; linha = traço de pincel;
//                pizza = um godê dividido; sem números, uma pincelada que sobe/cai/oscila
//   pergunta   → "?" grande vinho, a pergunta palavra por palavra e as opções em pílulas
import { formatar, mistura, prog, saindo, Traco, vaiVem } from "../anim";
import { larguraLinha } from "../medida";
import type { Comparacao, Grafico, Palavra, Pergunta } from "../plano";
import { baseDoCartao, cor, fonte, rotulo, tom } from "../tema";
import { Gode, Passada } from "./Amostra";
import { Icone } from "./Icones";
import { alturaDe, type Medida, medir, TextoFalado, temposFalados } from "./Texto";

export const CARTAO = { x: 40, w: 1000, pad: 44 };
const INTERNA = CARTAO.w - 2 * CARTAO.pad;

// O cartão: sobe de baixo, assenta, desce no fim. `h` = altura total.
export const Cartao: React.FC<{ t: number; de: number; fim: number; h: number; legenda?: boolean; children: React.ReactNode }> = ({
  t,
  de,
  fim,
  h,
  legenda,
  children,
}) => {
  const entra = prog(t, Math.max(0, de) + 0.02, 0.55);
  const sai = saindo(t, fim, 0.35);
  if (entra <= 0 || sai >= 1) return null;
  const y = baseDoCartao({ legenda }) - h;
  const desloc = (1 - entra) * (h + 140) + sai * (h + 140);
  return (
    <div
      style={{
        position: "absolute",
        left: CARTAO.x,
        top: y + desloc,
        width: CARTAO.w,
        height: h,
        background: cor.creme,
        borderRadius: 48,
        boxShadow: "0 18px 50px rgba(30,14,22,0.28)",
        overflow: "hidden",
        fontFamily: fonte,
        color: cor.tinta,
      }}
    >
      {children}
    </div>
  );
};

// Pílula "ilustrativo": para gráfico e número que não vieram de dados ditos
export const Ilustrativo: React.FC<{ p: number; claro?: boolean; style?: React.CSSProperties }> = ({ p, claro, style }) => (
  <div
    style={{
      ...rotulo,
      fontSize: 30,
      letterSpacing: "0.14em",
      color: claro ? cor.creme : cor.tintaSuave,
      border: `2.5px dashed ${claro ? "rgba(248,240,234,0.75)" : cor.lapis}`,
      borderRadius: 26,
      padding: "10px 18px 9px",
      opacity: p,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    ilustrativo
  </div>
);

// Altura máxima do cartão para não cobrir o queixo (o rosto fica livre)
export const alturaMaxima = (limiteTopo: number, legenda?: boolean) => baseDoCartao({ legenda }) - limiteTopo;

// ---------- comparação ----------

const medirComparacao = (m: Comparacao, escala: number) => {
  const col = (INTERNA - 70) / 2;
  const gode = Math.round(124 * escala);
  const titulo = m.titulo ? medir(m.titulo, INTERNA, Math.round(54 * escala), 38, 2) : null;
  const rotulos = m.lados.map((l) => medir(l.rotulo.toUpperCase(), col - gode - 22, 30, 30, 2, 700));
  const textos = m.lados.map((l) => medir(l.texto, col, Math.round(72 * escala), 44, 3));
  const hCol = Math.max(...m.lados.map((_, i) => Math.max(gode, alturaDe(rotulos[i], 1.2)) + 20 + alturaDe(textos[i], 1.12)));
  const h = CARTAO.pad + (titulo ? alturaDe(titulo, 1.12) + 26 : 0) + hCol + CARTAO.pad * 0.8;
  return { col, gode, titulo, rotulos, textos, hCol, h };
};

export const CartaoComparacao: React.FC<{ m: Comparacao; t: number; fim: number; palavras: Palavra[]; limiteTopo: number }> = ({ m, t, fim, palavras, limiteTopo }) => {
  const maximo = alturaMaxima(limiteTopo, m.legenda);
  let g = medirComparacao(m, 1);
  for (const e of [0.92, 0.84, 0.76, 0.68, 0.62]) if (g.h > maximo) g = medirComparacao(m, e);
  const inicio = Math.max(0, m.de);
  const modo = m.modo ?? "contra";
  const corDe = (i: number) => (modo === "errado-certo" ? (i === 0 ? cor.berry : "#E48F96") : tom(i === 0 ? 0 : 1));
  const iconeDe = (i: number) => (modo === "errado-certo" ? (i === 0 ? "x" : "check") : null);
  const pVence = m.vencedor !== undefined ? prog(t, m.vencedorEm ?? Math.max(...m.lados.map((l) => l.em)) + 0.8, 0.5) : 0;
  const topoCols = CARTAO.pad + (g.titulo ? alturaDe(g.titulo, 1.12) + 26 : 0);
  const temposTitulo = m.titulo ? temposFalados(m.titulo, palavras, inicio, m.lados[0].em) : [];
  return (
    <Cartao t={t} de={m.de} fim={fim} h={g.h} legenda={m.legenda}>
      {m.titulo && g.titulo ? (
        <TextoFalado texto={m.titulo} medida={g.titulo} tempos={temposTitulo} t={t} entrelinha={1.12} style={{ position: "absolute", left: CARTAO.pad, top: CARTAO.pad - 4 }} />
      ) : null}
      {/* divisória que se desenha entre os dois lados, com o sinal do modo no meio */}
      <svg width={4} height={g.hCol} style={{ position: "absolute", left: CARTAO.w / 2 - 2, top: topoCols }}>
        <Traco d={`M2,2 L2,${g.hCol - 2}`} p={prog(t, inicio + 0.25, 0.6, vaiVem)} cor={cor.cremeEscuro} largura={3} />
      </svg>
      {modo !== "errado-certo" ? (
        <div
          style={{
            position: "absolute",
            left: CARTAO.w / 2 - 30,
            top: topoCols + g.gode / 2 - 30,
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: cor.creme,
            border: `3.5px solid ${cor.berry}`,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: prog(t, m.lados[1].em - 0.15, 0.35),
          }}
        >
          <Icone nome={modo === "antes-depois" ? "seta" : "x"} p={prog(t, m.lados[1].em - 0.1, 0.5)} tamanho={30} cor={cor.berry} largura={11} />
        </div>
      ) : null}
      {m.lados.map((l, i) => {
        const x = i === 0 ? CARTAO.pad : CARTAO.w - CARTAO.pad - g.col;
        const perde = m.vencedor !== undefined && m.vencedor !== i;
        const ganha = m.vencedor === i;
        const tempos = temposFalados(l.texto, palavras, l.em, i === 0 ? m.lados[1].em : m.ate + 0.3);
        const ic = iconeDe(i);
        const pr = prog(t, l.em, 0.4);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: topoCols, width: g.col, opacity: 1 - pVence * (perde ? 0.5 : 0) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22, height: Math.max(g.gode, alturaDe(g.rotulos[i], 1.2)) }}>
              <div style={{ position: "relative", width: g.gode, height: g.gode, flexShrink: 0, filter: perde && pVence > 0 ? `grayscale(${pVence})` : undefined }}>
                <Gode cor={corDe(i)} t={t} em={l.em} tamanho={g.gode} id={`cmp-${m.de}-${i}`} rascunho={inicio + 0.1 + i * 0.1} />
                {ic || ganha ? (
                  <div
                    style={{
                      position: "absolute",
                      right: -10,
                      bottom: -6,
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      background: cor.berry,
                      border: `3px solid ${cor.creme}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      scale: String(ganha ? pVence : prog(t, l.em + 0.35, 0.4)),
                    }}
                  >
                    <Icone nome={ganha ? "check" : (ic as "x" | "check")} p={ganha ? pVence : prog(t, l.em + 0.4, 0.5)} tamanho={24} cor={cor.creme} largura={12} />
                  </div>
                ) : null}
              </div>
              <div style={{ ...rotulo, color: cor.berry, lineHeight: 1.2, opacity: pr, translate: `0 ${(1 - pr) * 12}px` }}>
                {g.rotulos[i].linhas.map((ln, k) => (
                  <div key={k}>{ln}</div>
                ))}
              </div>
            </div>
            <TextoFalado texto={l.texto} medida={g.textos[i]} tempos={tempos} t={t} entrelinha={1.12} style={{ marginTop: 20 }} />
          </div>
        );
      })}
    </Cartao>
  );
};

// ---------- gráfico ----------

const valorComUnidade = (v: number, unidade?: string, casas?: number) => {
  const c = casas ?? (Number.isInteger(v) ? 0 : 1);
  const n = formatar(v, c);
  if (!unidade) return n;
  if (unidade === "%") return `${n}%`;
  if (/^(R\$|US\$|€|\$)$/.test(unidade)) return `${unidade} ${n}`;
  return `${n} ${unidade}`;
};

// caminho suave por pontos (Catmull-Rom → Bézier)
const suave = (pts: { x: number; y: number }[]) => {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
};

// forma qualitativa da tendência, em frações (x 0→1, y 0 = embaixo, 1 = em cima)
const FORMAS: Record<"sobe" | "cai" | "oscila", [number, number][]> = {
  sobe: [
    [0, 0.12],
    [0.18, 0.2],
    [0.32, 0.16],
    [0.5, 0.38],
    [0.64, 0.34],
    [0.8, 0.62],
    [1, 0.9],
  ],
  cai: [
    [0, 0.88],
    [0.18, 0.8],
    [0.32, 0.84],
    [0.5, 0.6],
    [0.64, 0.64],
    [0.8, 0.36],
    [1, 0.1],
  ],
  oscila: [
    [0, 0.45],
    [0.16, 0.78],
    [0.33, 0.28],
    [0.5, 0.74],
    [0.67, 0.22],
    [0.84, 0.7],
    [1, 0.4],
  ],
};

export const CartaoGrafico: React.FC<{ m: Grafico; t: number; fim: number; palavras: Palavra[]; limiteTopo: number }> = ({ m, t, fim, palavras, limiteTopo }) => {
  const inicio = Math.max(0, m.de);
  const maximo = alturaMaxima(limiteTopo, m.legenda);
  const dados = m.dados?.length ? m.dados : null;
  const ilustrativo = m.ilustrativo || !dados;
  const larguraPilula = ilustrativo ? 250 : 0;
  const titulo = m.titulo ? medir(m.titulo, INTERNA - larguraPilula - 20, 54, 38, 2) : null;
  const hTitulo = titulo ? alturaDe(titulo, 1.12) + 30 : ilustrativo ? 74 : 0;
  // área do desenho: o que sobra até a altura máxima, entre 260 e 460 px
  const natural = dados && m.forma === "barras" ? dados.length * 112 : 400;
  const hArea = Math.max(240, Math.min(460, natural, maximo - CARTAO.pad * 1.8 - hTitulo));
  const h = CARTAO.pad + hTitulo + hArea + CARTAO.pad * 0.8;
  const topoArea = CARTAO.pad + hTitulo;
  const temposTitulo = m.titulo ? temposFalados(m.titulo, palavras, inicio, dados?.[0]?.em ?? m.tendenciaEm ?? m.ate) : [];
  const unidade = m.unidade;

  let desenho: React.ReactNode = null;
  if (!dados) {
    // pincelada qualitativa: se desenha durante boa parte do momento (nada fica parado)
    const forma = FORMAS[m.tendencia ?? "sobe"];
    const comeca = m.tendenciaEm ?? inicio + 0.35;
    const dur = Math.max(1.2, Math.min(2.6, (m.ate - comeca) * 0.7));
    const p = prog(t, comeca, dur, vaiVem);
    const W = INTERNA - 30;
    const pts = forma.map(([x, y]) => ({ x: 15 + x * W, y: 24 + (1 - y) * (hArea - 70) }));
    const d = suave(pts);
    // ponta: o ponto da curva no progresso p (aproximado pelos segmentos)
    const idx = Math.min(pts.length - 2, Math.floor(p * (pts.length - 1)));
    const f = p * (pts.length - 1) - idx;
    const ponta = { x: mistura(pts[idx].x, pts[idx + 1].x, f), y: mistura(pts[idx].y, pts[idx + 1].y, f) };
    desenho = (
      <svg width={INTERNA} height={hArea} style={{ position: "absolute", left: CARTAO.pad, top: topoArea, overflow: "visible" }}>
        <path d={`M8,${hArea - 30} L${INTERNA - 8},${hArea - 30}`} stroke={cor.cremeEscuro} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />
        <Traco d={d} p={p} cor={tom(0)} largura={22} opacidade={0.5} />
        <Traco d={d} p={p} cor={cor.berry} largura={5} />
        {p > 0 ? <circle cx={ponta.x} cy={ponta.y} r={13} fill={cor.berry} stroke={cor.creme} strokeWidth={4} /> : null}
      </svg>
    );
  } else if (m.forma === "barras") {
    const n = dados.length;
    const linha = hArea / n;
    const alturaBarra = Math.min(70, linha * 0.62);
    const fonteRot = Math.min(46, Math.max(34, linha * 0.42));
    const larguraRotulo = Math.min(320, Math.max(...dados.map((d) => larguraLinha(d.rotulo, fonteRot))) + 10);
    const rotulos = dados.map((d) => medir(d.rotulo, larguraRotulo, fonteRot, 30, 2));
    const max = Math.max(...dados.map((d) => Math.abs(d.valor)), 1e-9);
    const larguraValor = Math.max(...dados.map((d) => larguraLinha(valorComUnidade(d.valor, unidade), 44))) + 16;
    const areaBarra = INTERNA - larguraRotulo - 24 - larguraValor;
    desenho = (
      <div style={{ position: "absolute", left: CARTAO.pad, top: topoArea, width: INTERNA, height: hArea }}>
        {dados.map((d, i) => {
          const comp = Math.max(areaBarra * 0.1, (Math.abs(d.valor) / max) * areaBarra);
          const pv = prog(t, d.em + 0.45, 0.4);
          return (
            <div key={i} style={{ position: "absolute", left: 0, top: i * linha + (linha - Math.max(alturaBarra, alturaDe(rotulos[i], 1.05))) / 2, width: INTERNA, display: "flex", alignItems: "center" }}>
              <div style={{ width: larguraRotulo, marginRight: 24, opacity: mistura(0.45, 1, prog(t, d.em - 0.1, 0.3)) }}>
                {rotulos[i].linhas.map((l, k) => (
                  <div key={k} style={{ fontSize: rotulos[i].tamanho, fontWeight: 600, lineHeight: 1.05, textAlign: "right" }}>
                    {l}
                  </div>
                ))}
              </div>
              <Passada cor={tom(i)} t={t} em={d.em} largura={comp} altura={alturaBarra} id={`bar-${m.de}-${i}`} rascunho={inicio + 0.1 + i * 0.08} />
              <div style={{ marginLeft: 14, fontSize: 44, fontWeight: 600, color: cor.berry, opacity: pv, translate: `${(1 - pv) * -12}px 0`, whiteSpace: "nowrap" }}>
                {valorComUnidade(d.valor * prog(t, d.em, 0.7), unidade, Number.isInteger(d.valor) ? 0 : 1)}
              </div>
            </div>
          );
        })}
      </div>
    );
  } else if (m.forma === "linha") {
    const n = dados.length;
    const fonteX = 34;
    const colX = (INTERNA - 40) / Math.max(1, n - 1);
    const vals = dados.map((d) => d.valor);
    const vmin = Math.min(0, ...vals);
    const vmax = Math.max(...vals, vmin + 1e-9);
    const topoGraf = 70;
    const baseGraf = hArea - 66;
    const pts = dados.map((d, i) => ({ x: 20 + i * colX, y: baseGraf - ((d.valor - vmin) / (vmax - vmin)) * (baseGraf - topoGraf) }));
    desenho = (
      <svg width={INTERNA} height={hArea} style={{ position: "absolute", left: CARTAO.pad, top: topoArea, overflow: "visible", fontFamily: fonte }}>
        <path d={`M0,${baseGraf + 16} L${INTERNA},${baseGraf + 16}`} stroke={cor.cremeEscuro} strokeWidth={3} />
        {pts.slice(1).map((q, i) => {
          const a = pts[i];
          const p = prog(t, dados[i + 1].em - 0.15, 0.55, vaiVem);
          const d = `M${a.x},${a.y} L${q.x},${q.y}`;
          return (
            <g key={i}>
              <Traco d={d} p={p} cor={tom(0)} largura={20} opacidade={0.5} />
              <Traco d={d} p={p} cor={cor.berry} largura={5} />
            </g>
          );
        })}
        {pts.map((q, i) => {
          const p = prog(t, dados[i].em - 0.05, 0.4);
          const texto = valorComUnidade(dados[i].valor, unidade);
          const tam = Math.min(42, (colX * 0.95) / Math.max(1, larguraLinha(texto, 1)));
          const rot = dados[i].rotulo;
          const tamX = Math.min(fonteX, (colX * 0.95) / Math.max(1, larguraLinha(rot, 1)));
          const anchor = i === 0 ? "start" : i === n - 1 ? "end" : "middle";
          return (
            <g key={`p${i}`} opacity={p}>
              <circle cx={q.x} cy={q.y} r={12 * p} fill={cor.berry} stroke={cor.creme} strokeWidth={4} />
              <text x={q.x} y={q.y - 26} fontSize={Math.max(26, tam)} fontWeight={600} fill={cor.berry} textAnchor={anchor}>
                {texto}
              </text>
              <text x={q.x} y={baseGraf + 60} fontSize={Math.max(26, tamX)} fontWeight={600} fill={cor.tintaSuave} textAnchor={anchor}>
                {rot}
              </text>
            </g>
          );
        })}
      </svg>
    );
  } else {
    // pizza: um godê dividido em fatias, cada uma no seu tom, abrindo quando é dita
    const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
    const D = Math.min(hArea - 10, 380);
    const r = D / 2;
    let ang = -Math.PI / 2;
    const fatias = dados.map((d, i) => {
      const a0 = ang;
      const a1 = ang + (Math.max(0, d.valor) / total) * Math.PI * 2;
      ang = a1;
      return { a0, a1, i };
    });
    const larguraLeg = INTERNA - D - 50;
    const fonteLeg = Math.min(44, Math.max(32, (hArea / dados.length) * 0.36));
    desenho = (
      <div style={{ position: "absolute", left: CARTAO.pad, top: topoArea, width: INTERNA, height: hArea }}>
        <svg width={D} height={D} style={{ position: "absolute", left: 0, top: (hArea - D) / 2, overflow: "visible" }}>
          <circle cx={r} cy={r} r={r} fill="none" stroke={cor.lapis} strokeWidth={3.5} strokeDasharray="7 9" opacity={prog(t, inicio + 0.1, 0.4)} />
          {fatias.map(({ a0, a1, i }) => {
            const p = prog(t, dados[i].em, 0.6, vaiVem);
            if (p <= 0) return null;
            const a = a0 + (a1 - a0) * p;
            const grande = a - a0 > Math.PI ? 1 : 0;
            const d = `M${r},${r} L${r + r * Math.cos(a0)},${r + r * Math.sin(a0)} A${r},${r} 0 ${grande} 1 ${r + r * Math.cos(a)},${r + r * Math.sin(a)} Z`;
            return <path key={i} d={d} fill={tom(i)} stroke={cor.creme} strokeWidth={4} />;
          })}
        </svg>
        <div style={{ position: "absolute", left: D + 50, top: 0, width: larguraLeg, height: hArea, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
          {dados.map((d, i) => {
            const p = prog(t, d.em - 0.05, 0.4);
            const pct = valorComUnidade(d.valor, unidade);
            const med = medir(`${d.rotulo}`, larguraLeg - 50 - larguraLinha(pct, fonteLeg) - 16, fonteLeg, 30, 2);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, opacity: mistura(0.35, 1, p) }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: p > 0 ? tom(i) : "transparent", border: `3px ${p > 0 ? "solid" : "dashed"} ${p > 0 ? tom(i) : cor.lapis}`, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: med.tamanho, fontWeight: 600, lineHeight: 1.08 }}>
                  {med.linhas.map((l, k) => (
                    <div key={k}>{l}</div>
                  ))}
                </div>
                <div style={{ fontSize: fonteLeg, fontWeight: 600, color: cor.berry }}>{pct}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Cartao t={t} de={m.de} fim={fim} h={h} legenda={m.legenda}>
      {m.titulo && titulo ? (
        <TextoFalado texto={m.titulo} medida={titulo} tempos={temposTitulo} t={t} entrelinha={1.12} style={{ position: "absolute", left: CARTAO.pad, top: CARTAO.pad - 4 }} />
      ) : null}
      {ilustrativo ? <Ilustrativo p={prog(t, inicio + 0.15, 0.4)} style={{ position: "absolute", right: CARTAO.pad, top: CARTAO.pad - 6 }} /> : null}
      {desenho}
    </Cartao>
  );
};

// ---------- pergunta ----------

const medirPergunta = (m: Pergunta, escala: number) => {
  const xTexto = 196;
  const texto = medir(m.texto, INTERNA - xTexto, Math.round(72 * escala), 44, 3);
  const fonteOp = Math.round(44 * escala);
  // pílulas em linhas: mede cada uma e vai quebrando
  const ops = (m.opcoes ?? []).map((o) => {
    const tam = Math.max(30, Math.min(fonteOp, ((INTERNA - 110) / Math.max(1, larguraLinha(o.texto, 1))) | 0));
    return { tam, w: Math.min(INTERNA, larguraLinha(o.texto, tam) + 110) };
  });
  const linhasOp: number[][] = [];
  let atual: number[] = [];
  let usado = 0;
  ops.forEach((o, i) => {
    if (atual.length && usado + 18 + o.w > INTERNA) {
      linhasOp.push(atual);
      atual = [];
      usado = 0;
    }
    usado += (atual.length ? 18 : 0) + o.w;
    atual.push(i);
  });
  if (atual.length) linhasOp.push(atual);
  const hPilula = Math.round(84 * Math.max(0.85, escala));
  const hTexto = Math.max(150, alturaDe(texto, 1.1));
  const hOps = linhasOp.length ? 34 + linhasOp.length * hPilula + (linhasOp.length - 1) * 18 : 0;
  return { xTexto, texto, ops, linhasOp, hPilula, hTexto, h: CARTAO.pad + hTexto + hOps + CARTAO.pad * 0.85 };
};

export const CartaoPergunta: React.FC<{ m: Pergunta; t: number; fim: number; palavras: Palavra[]; limiteTopo: number }> = ({ m, t, fim, palavras, limiteTopo }) => {
  const maximo = alturaMaxima(limiteTopo, m.legenda);
  let g = medirPergunta(m, 1);
  for (const e of [0.92, 0.84, 0.76]) if (g.h > maximo) g = medirPergunta(m, e);
  const inicio = Math.max(0, m.de);
  const em = m.em ?? inicio;
  const tempos = temposFalados(m.texto, palavras, em, m.opcoes?.[0]?.em ?? m.ate + 0.3);
  const pQ = prog(t, inicio + 0.08, 0.55);
  const topoOps = CARTAO.pad + g.hTexto + 34;
  return (
    <Cartao t={t} de={m.de} fim={fim} h={g.h} legenda={m.legenda}>
      <div style={{ position: "absolute", left: CARTAO.pad - 4, top: CARTAO.pad - 18, height: 172, overflow: "hidden" }}>
        <div style={{ fontSize: 168, fontWeight: 400, lineHeight: 1, color: cor.berry, translate: `0 ${(1 - pQ) * 100}%` }}>?</div>
      </div>
      <svg width={4} height={132} style={{ position: "absolute", left: CARTAO.pad + 124, top: CARTAO.pad + 8 }}>
        <Traco d="M2,2 L2,130" p={prog(t, inicio + 0.2, 0.5, vaiVem)} cor={cor.cremeEscuro} largura={3} />
      </svg>
      <TextoFalado
        texto={m.texto}
        medida={g.texto}
        tempos={tempos}
        t={t}
        entrelinha={1.1}
        style={{ position: "absolute", left: CARTAO.pad + g.xTexto - 30, top: CARTAO.pad + Math.max(0, (Math.min(150, g.hTexto) - alturaDe(g.texto, 1.1)) / 2), width: INTERNA - g.xTexto + 30 }}
      />
      {g.linhasOp.map((linha, j) => {
        let x = 0;
        return linha.map((i) => {
          const o = (m.opcoes ?? [])[i];
          const med = g.ops[i];
          const xi = x;
          x += med.w + 18;
          const r = prog(t, inicio + 0.12 + i * 0.08, 0.4);
          const p = prog(t, o.em - 0.08, 0.45);
          const tempoOp = temposFalados(o.texto, palavras, o.em, (m.opcoes ?? [])[i + 1]?.em ?? m.ate + 0.3);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: CARTAO.pad + xi,
                top: topoOps + j * (g.hPilula + 18),
                width: med.w,
                height: g.hPilula,
                borderRadius: g.hPilula / 2,
                border: `3.5px ${p > 0 ? "solid" : "dashed"} ${p > 0 ? cor.berry : cor.lapis}`,
                background: p > 0 ? `rgba(232,163,163,${0.28 * p})` : "transparent",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: 18,
                paddingLeft: 22,
                opacity: Math.max(r * 0.8, p),
              }}
            >
              <div style={{ width: 40, height: 40, flexShrink: 0 }}>
                <Gode cor={tom(i)} t={t} em={o.em} tamanho={40} id={`op-${m.de}-${i}`} />
              </div>
              <TextoFalado texto={o.texto} medida={{ tamanho: med.tam, linhas: [o.texto] }} tempos={tempoOp} t={t} entrelinha={1.1} />
            </div>
          );
        });
      })}
    </Cartao>
  );
};
