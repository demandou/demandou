// Gráfico à mão no papel milimetrado (bloco universal `grafico`): os eixos se riscam e o gráfico se
// desenha na fala.
// - Com `dados` (números ditos): `barras` hachuradas a lápis de cor que crescem cada uma na sua
//   palavra; `linha` que vai de ponto em ponto; `pizza` fatiada fatia por fatia. Valores em pt-BR.
// - Sem `dados`: a forma da `tendencia` (sobe, cai, oscila) como curva ou barras, com o carimbo
//   "ilustrativo". Os pontos marcados (`pontos`) acendem cada um na sua palavra.
import { caneta, limitar, prog } from "../anim";
import { ajustar } from "../medir";
import type { Dado, Grafico as GraficoT } from "../plano";
import { corDe, duracaoEscrita, PalavraAMao } from "../tinta/Escrita";
import { circulo, Definicoes, Esboco, pontaDeSeta, Traco } from "../tinta/Tinta";
import { cor, corDasPartes, formatar, H, mono, W } from "../tema";
import type { PropsFigura } from "./comum";
import { Carimbo } from "./Medida";
import { cabecalhoDoBloco } from "./Topo";

const FORMAS: Record<NonNullable<GraficoT["curva"]> | "oscila", (x: number) => number> = {
  sobe: (x) => 0.1 + 0.8 * x,
  desce: (x) => 0.9 - 0.8 * x,
  "cai-rapido": (x) => 0.06 + 0.9 / Math.pow(1 + 3.2 * x, 2.2),
  "sobe-rapido": (x) => 0.06 + 0.88 * ((Math.exp(3 * x) - 1) / (Math.exp(3) - 1)),
  pico: (x) => 0.08 + 0.84 * Math.pow(Math.sin(Math.PI * x), 1.6),
  satura: (x) => 0.06 + 0.86 * (1 - Math.exp(-4.2 * x)),
  oscila: (x) => 0.5 + 0.3 * Math.sin(x * Math.PI * 3.2) * (0.7 + 0.3 * x),
};
// tendência qualitativa: uma subida/queda com cara de dado (não uma reta)
const TENDENCIA: Record<"sobe" | "cai" | "oscila", (x: number) => number> = {
  sobe: (x) => 0.1 + 0.78 * Math.pow(x, 1.35) + 0.05 * Math.sin(x * 9),
  cai: (x) => 0.9 - 0.78 * Math.pow(x, 1.35) + 0.05 * Math.sin(x * 9),
  oscila: FORMAS.oscila,
};
const BARRAS: Record<"sobe" | "cai" | "oscila", number[]> = {
  sobe: [0.24, 0.38, 0.55, 0.72, 0.92],
  cai: [0.92, 0.72, 0.55, 0.38, 0.24],
  oscila: [0.5, 0.82, 0.38, 0.86, 0.52],
};

const casasDe = (dados: Dado[]) => (dados.every((d) => Number.isInteger(d.valor)) ? 0 : 1);
const valorComUnidade = (v: number, casas: number, unidade?: string) => {
  const u = unidade?.trim() ?? "";
  if (!u) return formatar(v, casas);
  return u === "%" ? `${formatar(v, casas)}%` : /^(R\$|US\$|€|\$)/.test(u) ? `${u} ${formatar(v, casas)}` : `${formatar(v, casas)} ${u}`;
};

// o contorno de uma fatia (ângulos em radianos, 0 = para cima, sentido horário)
const fatia = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => ({ x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) });
  const ini = p(a0);
  const fim = p(a1);
  return `M ${cx} ${cy} L ${ini.x} ${ini.y} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${fim.x} ${fim.y} Z`;
};

export const Grafico: React.FC<PropsFigura<GraficoT>> = ({ m, t, areas, palavras, chegada, id, opCabecalho, revela, rotulo }) => {
  const cab = cabecalhoDoBloco({ areas, t, de: m.de, ate: m.ate, palavras, chegada, revela, rotulo: m.rotulo ?? rotulo, titulo: m.titulo, opacidade: opCabecalho });
  const a = cab.corpo;
  const c = corDe(m.cor ?? "azul");
  const dados = (m.dados ?? []).slice(0, 6);
  const comDados = dados.length >= 2;
  const forma = m.forma ?? "linha";
  const pizza = comDados && forma === "pizza";
  // origem e tamanho do gráfico, com espaço para os rótulos dos eixos
  const ox = a.x + 70;
  const oy = a.y + a.h - (comDados ? 130 : 110);
  const gw = a.w - 120;
  const gh = a.h - (comDados ? 250 : 200);
  const eixosEm = m.eixosEm ?? chegada + 0.5;
  const pEixos = prog(t, eixosEm, 0.5, caneta);
  const eixoY = `M ${ox} ${oy} L ${ox} ${oy - gh - 30}`;
  const eixoX = `M ${ox} ${oy} L ${ox + gw} ${oy}`;
  const ilustrativo = !comDados || m.ilustrativo === true;
  const curvaEm = m.tendenciaEm ?? m.curvaEm ?? chegada + 0.8;
  const casas = casasDe(dados);

  // ---- qualitativo: curva ----
  const f = m.curva ? FORMAS[m.curva] : TENDENCIA[m.tendencia ?? "sobe"];
  const ponto = (x: number) => ({ x: ox + 20 + x * (gw - 40), y: oy - limitar(f(x), 0.03, 0.97) * gh });
  const passos = 80;
  const dCurva = Array.from({ length: passos + 1 }, (_, i) => {
    const q = ponto(i / passos);
    return `${i === 0 ? "M" : "L"} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  }).join(" ");
  const pCurva = prog(t, curvaEm, 0.9, caneta);

  // ---- com dados: escala ----
  const maximo = Math.max(...dados.map((d) => d.valor), 0) || 1;
  const topoEscala = maximo * 1.12;
  const n = dados.length;
  const passoX = (gw - 40) / Math.max(1, n);
  const xDado = (i: number) => ox + 20 + passoX * (i + 0.5);
  const yDado = (v: number) => oy - (Math.max(0, v) / topoEscala) * gh;
  const corpoRotulo = comDados ? Math.min(...dados.map((d) => ajustar(d.rotulo, passoX - 14, 46, 30, 2).corpo)) : 46;
  const pDado = (d: Dado) => prog(t, Math.max(d.em, chegada + 0.4), 0.55, caneta);
  const coresPizza = corDasPartes(n);
  const somaPizza = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;

  const desenhoQualitativo = !comDados && forma === "barras" ? (
    BARRAS[m.tendencia ?? "sobe"].map((alt, i) => {
      const bw = (gw - 40) / 5;
      const x = ox + 20 + bw * i + bw * 0.18;
      const p = prog(t, curvaEm + i * 0.18, 0.45, caneta);
      const hh = alt * gh * p;
      return (
        <g key={i}>
          <rect x={x} y={oy - alt * gh} width={bw * 0.64} height={alt * gh} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="8 7" opacity={1 - p} />
          {p > 0 ? (
            <>
              <rect x={x} y={oy - hh} width={bw * 0.64} height={hh} fill={c} opacity={0.78} />
              <rect x={x} y={oy - hh} width={bw * 0.64} height={hh} fill={`url(#${id}-lapis)`} />
              <rect x={x} y={oy - hh} width={bw * 0.64} height={hh} fill="none" stroke={cor.tinta} strokeWidth={4} />
            </>
          ) : null}
        </g>
      );
    })
  ) : !comDados ? (
    <>
      <Esboco d={dCurva} opacidade={1 - pCurva} />
      <g filter={`url(#${id}-mao)`}>
        <Traco d={dCurva} p={pCurva} cor={c} largura={9} />
      </g>
      {pCurva > 0.98 ? (
        <path d={pontaDeSeta(ponto(0.97), ponto(1), 26)} stroke={c} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </>
  ) : null;

  return (
    <>
      {cab.elemento}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Definicoes id={id} />
        {pizza ? null : (
          <g filter={`url(#${id}-mao)`}>
            <Traco d={eixoY} p={pEixos} largura={5} />
            <Traco d={eixoX} p={pEixos} largura={5} />
            {pEixos > 0.95 ? (
              <>
                <path d={pontaDeSeta({ x: ox, y: oy }, { x: ox, y: oy - gh - 30 }, 20)} stroke={cor.tinta} strokeWidth={5} fill="none" strokeLinecap="round" />
                <path d={pontaDeSeta({ x: ox, y: oy }, { x: ox + gw, y: oy }, 20)} stroke={cor.tinta} strokeWidth={5} fill="none" strokeLinecap="round" />
              </>
            ) : null}
          </g>
        )}
        {desenhoQualitativo}
        {/* barras com os números ditos */}
        {comDados && forma === "barras"
          ? dados.map((d, i) => {
              const p = pDado(d);
              const bw = passoX * 0.56;
              const x = xDado(i) - bw / 2;
              const y = yDado(d.valor);
              const hh = (oy - y) * p;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={bw} height={oy - y} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="8 7" opacity={1 - p} />
                  {p > 0 ? (
                    <>
                      <rect x={x} y={oy - hh} width={bw} height={hh} fill={c} opacity={0.78} />
                      <rect x={x} y={oy - hh} width={bw} height={hh} fill={`url(#${id}-lapis)`} />
                      <rect x={x} y={oy - hh} width={bw} height={hh} fill="none" stroke={cor.tinta} strokeWidth={4} />
                    </>
                  ) : null}
                </g>
              );
            })
          : null}
        {/* linha de ponto em ponto */}
        {comDados && forma === "linha"
          ? dados.map((d, i) => {
              const q = { x: xDado(i), y: yDado(d.valor) };
              const p = pDado(d);
              const ant = i > 0 ? { x: xDado(i - 1), y: yDado(dados[i - 1].valor) } : null;
              return (
                <g key={i}>
                  {ant ? <Esboco d={`M ${ant.x} ${ant.y} L ${q.x} ${q.y}`} opacidade={1 - p} /> : null}
                  {ant ? (
                    <g filter={`url(#${id}-mao)`}>
                      <Traco d={`M ${ant.x} ${ant.y} L ${q.x} ${q.y}`} p={p} cor={c} largura={8} />
                    </g>
                  ) : null}
                  <path d={`M ${q.x} ${q.y} L ${q.x} ${oy}`} stroke={cor.tinta} strokeWidth={2.5} strokeDasharray="6 7" opacity={0.5 * prog(t, d.em + 0.35, 0.3)} />
                  <circle cx={q.x} cy={q.y} r={14 * (0.5 + 0.5 * prog(t, d.em + (ant ? 0.4 : 0), 0.3))} fill={prog(t, d.em + (ant ? 0.4 : 0), 0.2) > 0 ? c : "none"} stroke={cor.tinta} strokeWidth={4} />
                </g>
              );
            })
          : null}
        {/* pizza fatiada */}
        {pizza
          ? (() => {
              const r = Math.min(a.h * 0.36, a.w * 0.3);
              const cx = a.x + r + 30;
              const cy = a.y + a.h / 2;
              let acum = 0;
              return (
                <g>
                  <Esboco d={circulo(cx, cy, r)} opacidade={1 - pEixos} />
                  {dados.map((d, i) => {
                    const a0 = (acum / somaPizza) * Math.PI * 2;
                    acum += Math.max(0, d.valor);
                    const a1 = (acum / somaPizza) * Math.PI * 2;
                    const p = pDado(d);
                    return p > 0 ? (
                      <g key={i}>
                        <path d={fatia(cx, cy, r, a0, a0 + (a1 - a0) * p)} fill={coresPizza[i]} opacity={0.8} />
                        <path d={fatia(cx, cy, r, a0, a0 + (a1 - a0) * p)} fill={`url(#${id}-lapis)`} />
                        <path d={fatia(cx, cy, r, a0, a0 + (a1 - a0) * p)} fill="none" stroke={cor.tinta} strokeWidth={4} />
                      </g>
                    ) : null;
                  })}
                  <g filter={`url(#${id}-mao)`}>
                    <Traco d={circulo(cx, cy, r, -90)} p={pEixos} largura={5} />
                  </g>
                </g>
              );
            })()
          : null}
        {/* pontos marcados na curva qualitativa */}
        {!comDados
          ? (m.pontos ?? []).slice(0, 3).map((pt, i) => {
              const q = ponto(limitar(pt.x));
              const p = prog(t, pt.em, 0.35);
              const cp = corDe(pt.cor ?? m.cor ?? "azul");
              return p > 0 ? (
                <g key={i}>
                  <path d={`M ${q.x} ${q.y} L ${q.x} ${oy}`} stroke={cor.tinta} strokeWidth={2.5} strokeDasharray="6 7" opacity={0.6 * p} />
                  <circle cx={q.x} cy={q.y} r={13 * (0.5 + 0.5 * p)} fill={cp} stroke={cor.tinta} strokeWidth={4} />
                </g>
              ) : null;
            })
          : null}
      </svg>
      {/* eixos à mão (opcionais) */}
      {m.eixoY && !pizza ? (
        <div style={{ position: "absolute", left: ox + 26, top: oy - gh - 74 }}>
          <PalavraAMao texto={m.eixoY} corpo={48} p={prog(t, eixosEm + 0.3, duracaoEscrita(m.eixoY), caneta)} />
        </div>
      ) : null}
      {m.eixoX && !pizza && !comDados ? (
        <div style={{ position: "absolute", left: ox, top: oy + 14, width: gw, textAlign: "right" }}>
          <PalavraAMao texto={m.eixoX} corpo={48} p={prog(t, eixosEm + 0.5, duracaoEscrita(m.eixoX), caneta)} />
        </div>
      ) : null}
      {/* rótulos e valores dos dados */}
      {comDados && !pizza
        ? dados.map((d, i) => {
            const p = pDado(d);
            const q = ajustar(d.rotulo, passoX - 14, corpoRotulo, Math.min(corpoRotulo, 30), 2);
            // na linha, o valor de um vale vai embaixo do ponto (em cima, ele cruzaria os traços)
            const vale = forma === "linha" && i > 0 && i < n - 1 && d.valor < dados[i - 1].valor && d.valor < dados[i + 1].valor;
            const yV = forma === "linha" ? (vale ? yDado(d.valor) + 26 : yDado(d.valor) - 74) : yDado(d.valor) - 58;
            return (
              <div key={i}>
                <div style={{ position: "absolute", left: xDado(i) - passoX / 2, top: oy + 16, width: passoX, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {q.linhas.map((l, k) => (
                    <PalavraAMao key={k} texto={l} corpo={q.corpo} p={prog(t, d.em, duracaoEscrita(l), caneta)} />
                  ))}
                </div>
                <div style={{ position: "absolute", left: xDado(i) - 160, top: yV, width: 320, textAlign: "center", fontFamily: mono, fontWeight: 700, fontSize: n > 4 ? 34 : 40, color: cor.tinta, opacity: prog(t, d.em + 0.35, 0.3), whiteSpace: "nowrap" }}>
                  {valorComUnidade(d.valor, casas, m.unidade)}
                </div>
              </div>
            );
          })
        : null}
      {pizza
        ? (() => {
            const r = Math.min(a.h * 0.36, a.w * 0.3);
            const xL = a.x + 2 * r + 100;
            const larguraL = a.x + a.w - xL;
            const alturaL = Math.min(130, (a.h - 40) / n);
            const y0 = a.y + a.h / 2 - (alturaL * n) / 2;
            return dados.map((d, i) => {
              const p = pDado(d);
              const q = ajustar(d.rotulo, larguraL - 10, 54, 34, 2);
              const pct = (Math.max(0, d.valor) / somaPizza) * 100;
              const valor = m.unidade?.trim() === "%" || !m.unidade ? `${formatar(pct, pct < 10 && !Number.isInteger(pct) ? 1 : 0)}%` : valorComUnidade(d.valor, casas, m.unidade);
              return (
                <div key={i} style={{ position: "absolute", left: xL, top: y0 + alturaL * i, width: larguraL, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 4, background: coresPizza[i], border: `3px solid ${cor.tinta}`, opacity: 0.3 + 0.7 * p }} />
                    <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 36, color: cor.tinta, opacity: prog(t, d.em + 0.35, 0.3) }}>{valor}</span>
                  </div>
                  {q.linhas.map((l, k) => (
                    <PalavraAMao key={k} texto={l} corpo={q.corpo} p={prog(t, d.em, duracaoEscrita(l), caneta)} cor={coresPizza[i]} />
                  ))}
                </div>
              );
            });
          })()
        : null}
      {!comDados
        ? (m.pontos ?? []).slice(0, 3).map((pt, i) => {
            const q = ponto(limitar(pt.x));
            const cp = corDe(pt.cor ?? m.cor ?? "azul");
            const direita = pt.x < 0.6;
            const larg = direita ? Math.min(400, ox + gw - q.x - 26) : Math.min(400, q.x - ox - 26);
            const corpo = ajustar(pt.rotulo, Math.max(160, larg), 50, 34, 1).corpo;
            return (
              <div key={i} style={{ position: "absolute", left: direita ? q.x + 26 : q.x - 26 - larg, top: q.y - 104, width: larg, textAlign: direita ? "left" : "right" }}>
                <PalavraAMao texto={pt.rotulo} corpo={corpo} p={prog(t, pt.em, duracaoEscrita(pt.rotulo), caneta)} cor={cp} />
              </div>
            );
          })
        : null}
      {ilustrativo ? <Carimbo x={a.x + a.w} alinhar="direita" y={pizza ? a.y + 4 : oy - gh - 36} opacidade={prog(t, Math.max(eixosEm, curvaEm) + 0.3, 0.3)} /> : null}
    </>
  );
};
