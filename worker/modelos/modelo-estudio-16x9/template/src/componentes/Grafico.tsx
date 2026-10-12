// Gráfico. A moldura da pessoa desce para o canto de baixo, à direita, e o gráfico ocupa o quadro da
// esquerda (do alto até o fundo), no traço da onda do Estúdio:
// barras arredondadas, o que já foi dito em branco, o da vez em rosa, o que vem a lápis.
// - barras: cada barra cresce até o valor quando ele é dito;
// - linha: os pontos se ligam um a um, na fala;
// - pizza: um anel que se divide fatia a fatia, com a legenda ao lado;
// - sem números ditos (`tendencia`): uma onda de barras que sobe, cai ou oscila, com a agulha
//   varrendo e a etiqueta ILUSTRATIVO.
import { Easing, interpolate } from "remotion";
import { formatarNumero, limitar, prog, saindo } from "../anim";
import { ANTES, FIM_DO_RECUO, quadroDe, TROCA } from "../layout";
import { caber, medir } from "../medidas";
import type { Grafico as GraficoT } from "../plano";
import { comAlfa, cor, mono, rotulo, sans, titulo } from "../tema";
import { Ilustrativo, Rotulo } from "./comum";

const AREA = quadroDe("baixo");
const LARGURA = AREA.w;
const cresce = Easing.out(Easing.cubic);

type Dado = { rotulo: string; valor: number; em: number };

// formato do valor: pt-BR, casas só quando o número tem; unidade curta junto ("45%", "3 kg")
const casasDe = (v: number) => (Number.isInteger(v) ? 0 : Math.abs(v * 10 - Math.round(v * 10)) < 1e-6 ? 1 : 2);
const curta = (u?: string) => !!u && u.trim().length <= 3;
const valorComUnidade = (v: number, unidade?: string, casas = casasDe(v)) => {
  const n = formatarNumero(v, casas);
  if (!curta(unidade)) return n;
  const u = (unidade ?? "").trim();
  return u === "%" ? `${n}%` : `${n} ${u}`;
};

// a cor de cada dado: o da vez em rosa, os já ditos em branco, os que vêm a lápis
const corDoDado = (i: number, atual: number) => (i === atual ? cor.acento : i < atual ? comAlfa(cor.texto, 0.86) : cor.apagado);

const Barras: React.FC<{ dados: Dado[]; unidade?: string; t: number; largura: number; altura: number }> = ({ dados, unidade, t, largura, altura }) => {
  const n = dados.length;
  const slot = largura / n;
  const wBarra = Math.min(150, slot * 0.56);
  const max = Math.max(...dados.map((d) => Math.abs(d.valor)), 1e-6);
  const tamValor = Math.min(64, ...dados.map((d) => (slot * 0.92) / Math.max(0.1, medir(valorComUnidade(d.valor, unidade), 1, 800))));
  const rotulos = dados.map((d) => caber(d.rotulo, { largura: slot - 16, maximo: 40, minimo: 34, linhas: 2, peso: 700, entrelinha: 1.1, piso: 30 }));
  const alturaRotulo = Math.max(...rotulos.map((r) => r.linhas.length * r.tam * 1.1));
  const hMax = altura - tamValor * 1.2 - 16 - alturaRotulo - 20;
  const base = tamValor * 1.2 + 16 + hMax;
  const atual = dados.reduce((k, d, i) => (t >= d.em - 0.05 ? i : k), -1);
  return (
    <div style={{ position: "relative", width: largura, height: altura }}>
      <div style={{ position: "absolute", left: 0, top: base, width: largura, height: 3, borderRadius: 2, background: cor.apagadoForte }} />
      {dados.map((d, i) => {
        const p = prog(t, d.em - 0.04, 0.55, cresce);
        const h = Math.max(14, (hMax * Math.abs(d.valor) * p) / max);
        const cx = slot * (i + 0.5);
        const c = p > 0 ? corDoDado(i, atual) : cor.apagado;
        const r = rotulos[i];
        return (
          <div key={`${d.rotulo}-${i}`}>
            <div style={{ position: "absolute", left: cx - wBarra / 2, top: base - h, width: wBarra, height: h, borderRadius: Math.min(18, wBarra / 2), background: c }} />
            <div
              style={{
                position: "absolute",
                left: cx - slot / 2,
                width: slot,
                top: base - h - tamValor * 1.2 - 8,
                textAlign: "center",
                ...titulo,
                fontSize: tamValor,
                lineHeight: 1.2,
                fontVariantNumeric: "tabular-nums",
                color: p > 0.05 ? cor.texto : "transparent",
                whiteSpace: "nowrap",
              }}
            >
              {valorComUnidade(d.valor * p, unidade, casasDe(d.valor))}
            </div>
            <div style={{ position: "absolute", left: cx - slot / 2 + 8, width: slot - 16, top: base + 18, display: "flex", flexDirection: "column", alignItems: "center" }}>
              {r.linhas.map((l) => (
                <div key={l} style={{ fontFamily: sans, fontWeight: 700, fontSize: r.tam, lineHeight: 1.1, whiteSpace: "nowrap", color: p > 0.5 ? cor.texto : cor.apagadoForte }}>
                  {l}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Linha: React.FC<{ dados: Dado[]; unidade?: string; t: number; largura: number; altura: number }> = ({ dados, unidade, t, largura, altura }) => {
  const n = dados.length;
  const slot = largura / n;
  const valores = dados.map((d) => d.valor);
  const max = Math.max(...valores);
  const min = Math.min(...valores);
  // valores próximos (92,4 → 88,5): a escala começa perto do menor, para a variação aparecer
  const piso = min > 0 && min > max * 0.5 ? min - Math.max(max - min, max * 0.02) * 0.9 : Math.min(0, min);
  const tamValor = Math.min(56, ...dados.map((d) => (slot * 0.92) / Math.max(0.1, medir(valorComUnidade(d.valor, unidade), 1, 800))));
  const rotulos = dados.map((d) => caber(d.rotulo, { largura: slot - 16, maximo: 40, minimo: 34, linhas: 2, peso: 700, entrelinha: 1.1, piso: 30 }));
  const alturaRotulo = Math.max(...rotulos.map((r) => r.linhas.length * r.tam * 1.1));
  const topo = tamValor * 1.3 + 14;
  const base = altura - alturaRotulo - 26;
  const y = (v: number) => base - ((v - piso) / Math.max(1e-6, max - piso)) * (base - topo);
  const pts = dados.map((d, i) => ({ x: slot * (i + 0.5), y: y(d.valor) }));
  const atual = dados.reduce((k, d, i) => (t >= d.em - 0.05 ? i : k), -1);
  return (
    <div style={{ position: "relative", width: largura, height: altura }}>
      <svg width={largura} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <line x1={0} x2={largura} y1={base} y2={base} stroke={cor.apagadoForte} strokeWidth={3} strokeLinecap="round" />
        {/* o caminho inteiro a lápis, tracejado */}
        <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={cor.apagado} strokeWidth={4} strokeDasharray="8 12" strokeLinecap="round" />
        {pts.slice(1).map((p, k) => {
          const a = pts[k];
          const q = prog(t, dados[k + 1].em - 0.04, 0.5);
          if (q <= 0) return null;
          return <line key={k} x1={a.x} y1={a.y} x2={a.x + (p.x - a.x) * q} y2={a.y + (p.y - a.y) * q} stroke={k + 1 === atual ? cor.acento : comAlfa(cor.texto, 0.86)} strokeWidth={7} strokeLinecap="round" />;
        })}
        {pts.map((p, i) => {
          const q = prog(t, dados[i].em - 0.04, 0.25);
          return <circle key={i} cx={p.x} cy={p.y} r={10 + 4 * q} fill={q > 0.5 ? corDoDado(i, atual) : cor.fundo} stroke={q > 0.5 ? corDoDado(i, atual) : cor.apagadoForte} strokeWidth={4} />;
        })}
      </svg>
      {dados.map((d, i) => {
        const q = prog(t, d.em - 0.04, 0.25);
        const r = rotulos[i];
        return (
          <div key={`${d.rotulo}-${i}`}>
            <div style={{ position: "absolute", left: pts[i].x - slot / 2, width: slot, top: pts[i].y - tamValor * 1.3 - 10, textAlign: "center", ...titulo, fontSize: tamValor, lineHeight: 1.3, color: q > 0.5 ? cor.texto : "transparent", whiteSpace: "nowrap" }}>
              {valorComUnidade(d.valor, unidade)}
            </div>
            <div style={{ position: "absolute", left: pts[i].x - slot / 2 + 8, width: slot - 16, top: base + 18, display: "flex", flexDirection: "column", alignItems: "center" }}>
              {r.linhas.map((l) => (
                <div key={l} style={{ fontFamily: sans, fontWeight: 700, fontSize: r.tam, lineHeight: 1.1, whiteSpace: "nowrap", color: q > 0.5 ? cor.texto : cor.apagadoForte }}>
                  {l}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const arco = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p0 = { x: cx + r * Math.cos(a0), y: cy + r * Math.sin(a0) };
  const p1 = { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) };
  const grande = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${grande} 1 ${p1.x} ${p1.y}`;
};

const Pizza: React.FC<{ dados: Dado[]; unidade?: string; t: number; largura: number; altura: number }> = ({ dados, unidade, t, largura, altura }) => {
  // em %, o anel inteiro é 100 (fatias ainda não ditas ficam a lápis); senão, a soma dos valores
  const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
  const soma = unidade?.trim() === "%" ? Math.max(100, total) : total;
  const r = Math.min(170, altura / 2 - 50);
  const traco = Math.min(70, r * 0.42);
  const cx = r + traco / 2 + 6;
  const cy = altura / 2;
  const atual = dados.reduce((k, d, i) => (t >= d.em - 0.05 ? i : k), -1);
  const xLegenda = cx * 2 + 40;
  const wLegenda = largura - xLegenda;
  const emPorcento = unidade?.trim() === "%" || Math.abs(total - 100) < 0.5;
  const textoDe = (d: Dado) => (emPorcento ? `${formatarNumero(d.valor, casasDe(d.valor))}%` : valorComUnidade(d.valor, unidade));
  const colValor = Math.max(...dados.map((d) => textoDe(d).length)) * 0.72 * 38 + 16;
  const wRotulo = wLegenda - 26 - 18 - colValor;
  // um corpo só para os rótulos, em até 2 linhas
  const rotulos = dados.map((d) => caber(d.rotulo, { largura: wRotulo, maximo: 44, minimo: 34, linhas: 2, peso: 700, entrelinha: 1.08, piso: 30 }));
  const tamRotulo = Math.min(...rotulos.map((x) => x.tam));
  const linhasDe = (d: Dado) => caber(d.rotulo, { largura: wRotulo, maximo: tamRotulo, minimo: tamRotulo, linhas: 3, peso: 700, entrelinha: 1.08, piso: 30 }).linhas;
  const alturaLinha = Math.min(150, Math.max(...dados.map((d) => linhasDe(d).length * tamRotulo * 1.08)) + 26);
  const yLegenda = cy - (alturaLinha * dados.length) / 2;
  let angulo = -Math.PI / 2;
  return (
    <div style={{ position: "relative", width: largura, height: altura }}>
      <svg width={cx * 2} height={altura} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={cor.apagado} strokeWidth={traco} />
        {dados.map((d, i) => {
          const fracao = Math.max(0, d.valor) / soma;
          const a0 = angulo;
          angulo += fracao * Math.PI * 2;
          const q = prog(t, d.em - 0.04, 0.55, cresce);
          if (q <= 0) return null;
          const a1 = a0 + Math.max(0.001, (fracao * Math.PI * 2 - 0.05) * q);
          return <path key={i} d={arco(cx, cy, r, a0 + 0.025, a1)} fill="none" stroke={corDoDado(i, atual)} strokeWidth={traco} />;
        })}
      </svg>
      {dados.map((d, i) => {
        const q = prog(t, d.em - 0.04, 0.25);
        const ls = linhasDe(d);
        return (
          <div key={`${d.rotulo}-${i}`} style={{ position: "absolute", left: xLegenda, top: yLegenda + i * alturaLinha, width: wLegenda, height: alturaLinha, display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: q > 0.5 ? corDoDado(i, atual) : "transparent", boxShadow: q > 0.5 ? "none" : `inset 0 0 0 2px ${cor.apagado}` }} />
            <div style={{ width: wRotulo, fontFamily: sans, fontWeight: 700, fontSize: tamRotulo, lineHeight: 1.08, color: q > 0.5 ? cor.texto : cor.apagadoForte }}>
              {ls.map((l) => (
                <div key={l} style={{ whiteSpace: "nowrap" }}>
                  {l}
                </div>
              ))}
            </div>
            <span style={{ fontFamily: mono, fontWeight: 500, fontSize: 38, width: colValor, textAlign: "right", color: q > 0.5 ? (i === atual ? cor.acento : cor.texto) : cor.apagado, whiteSpace: "nowrap" }}>
              {q > 0.05 ? textoDe(d) : "--"}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const BARRAS_TENDENCIA = 36;
const ruido = (i: number) => {
  const x = Math.sin(i * 57.3 + 4.1) * 15731.743;
  return x - Math.floor(x);
};
const formaDa = (tendencia: GraficoT["tendencia"], i: number) => {
  const x = i / (BARRAS_TENDENCIA - 1);
  const v = (ruido(i) - 0.5) * 0.14;
  if (tendencia === "cai") return limitar(0.95 - 0.78 * Math.pow(x, 0.85) + v, 0.08, 1);
  if (tendencia === "oscila") return limitar(0.52 + 0.34 * Math.sin(x * Math.PI * 3.2 - 0.5) + v, 0.08, 1);
  return limitar(0.1 + 0.86 * Math.pow(x, 1.4) + v, 0.08, 1);
};

const Tendencia: React.FC<{ m: GraficoT; t: number; largura: number; altura: number }> = ({ m, t, largura, altura }) => {
  const inicio = m.tendenciaEm ?? m.de + 0.3;
  const varre = interpolate(t, [inicio, inicio + 1.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const n = BARRAS_TENDENCIA;
  const passo = largura / n;
  const wBarra = Math.min(16, passo * 0.56);
  const hMax = altura - 70;
  const frente = varre * n;
  return (
    <div style={{ position: "relative", width: largura, height: altura }}>
      <svg width={largura} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <line x1={0} x2={largura} y1={hMax + 6} y2={hMax + 6} stroke={cor.apagadoForte} strokeWidth={3} strokeLinecap="round" />
        {Array.from({ length: n }, (_, i) => {
          const h = Math.max(14, formaDa(m.tendencia, i) * hMax);
          const x = passo * (i + 0.5) - wBarra / 2;
          const cheio = limitar(frente - i);
          return (
            <g key={i}>
              <rect x={x} y={hMax - h} width={wBarra} height={h} rx={wBarra / 2} fill={cor.apagado} />
              {cheio > 0 ? <rect x={x} y={hMax - h} width={wBarra} height={h} rx={wBarra / 2} fill={comAlfa(cor.acento, cheio)} /> : null}
            </g>
          );
        })}
        {varre > 0 && varre < 1 ? <line x1={frente * passo} x2={frente * passo} y1={-6} y2={hMax + 14} stroke={cor.texto} strokeWidth={3} strokeLinecap="round" /> : null}
      </svg>
      {m.unidade ? (
        <div style={{ position: "absolute", left: 0, top: hMax + 22, ...rotulo, fontSize: 32, color: cor.textoSuave }}>{m.unidade}</div>
      ) : null}
    </div>
  );
};

export const Grafico: React.FC<{ m: GraficoT; t: number; fim: number }> = ({ m, t, fim }) => {
  const topo = AREA.y;
  const base = AREA.y + AREA.h;
  // o conteúdo do alto só aparece quando o quadro já desceu e sai inteiro antes do fim
  const entra = prog(t, Math.max(m.de - ANTES + TROCA * 0.2, FIM_DO_RECUO), 0.4);
  const s = saindo(t, fim + 0.02, 0.2);
  const dados = (m.dados ?? []).slice(0, 6);
  const comDados = dados.length >= 2;
  const ilustrativo = m.ilustrativo || !comDados;
  const cabecalho = 40 + 24;
  const area = base - topo - cabecalho;
  const nome = m.titulo ?? (comDados ? "Em números" : "Tendência");
  return (
    <div style={{ position: "absolute", left: AREA.x, top: topo, width: LARGURA, height: base - topo, opacity: entra * (1 - s), translate: `0 ${(1 - entra) * -30 - 20 * s}px` }}>
      <Rotulo nome={nome} direita={ilustrativo ? <Ilustrativo /> : !curta(m.unidade) && m.unidade ? <span style={{ ...rotulo, fontSize: 30, color: cor.textoSuave }}>{m.unidade}</span> : null} />
      <div style={{ position: "absolute", left: 0, top: cabecalho }}>
        {!comDados ? (
          <Tendencia m={m} t={t} largura={LARGURA} altura={area} />
        ) : m.forma === "linha" ? (
          <Linha dados={dados} unidade={m.unidade} t={t} largura={LARGURA} altura={area} />
        ) : m.forma === "pizza" ? (
          <Pizza dados={dados} unidade={m.unidade} t={t} largura={LARGURA} altura={area} />
        ) : (
          <Barras dados={dados} unidade={m.unidade} t={t} largura={LARGURA} altura={area} />
        )}
      </div>
    </div>
  );
};
