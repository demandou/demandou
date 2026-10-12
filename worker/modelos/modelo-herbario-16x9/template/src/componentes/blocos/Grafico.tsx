// `grafico`: um gráfico de prancha científica antiga, a pena e aquarela.
// - barras: colunas com contorno de tinta, aguada e hachura diagonal (como a parede do vaso em corte);
//   cada uma cresce na palavra do seu número, com o valor em cima e o rótulo embaixo;
// - linha: um caule que liga os pontos, com uma folha em cada ponto, desenhado ponto a ponto;
// - pizza: fatias de aquarela com hachura e etiquetas de espécime numeradas ao lado;
// - sem números ditos (`tendencia`): um caule com folhas que sobe, cai (e empalidece) ou oscila pela
//   prancha, com a etiqueta ILUSTRATIVO.
import { romano } from "../Cabecalho";
import { corre, limitar, prog, Traco } from "../../anim";
import { Folha } from "../../desenhos/Ramo";
import { FUNDO_CONTEUDO, TOPO_CONTEUDO } from "../../layout";
import { encaixar, formatarNumero, larguraTexto } from "../../medida";
import type { Grafico as GraficoT } from "../../plano";
import { cor, serif, traco } from "../../tema";
import { CabecalhoDoBloco, type PropsDoBloco } from "../Bloco";
import { EtiquetaDeItem, Ilustrativo, LinhaATinta, medirEtiquetaDeItem } from "../Pecas";

const X0 = 130;
const X1 = 1000;
const Y_TOPO = TOPO_CONTEUDO + 40;
const Y_BASE = 1370;
// cores de aquarela das fatias e colunas (as do desenho do modelo, lavadas)
const AGUADAS = [cor.folha, cor.terra, cor.agua, cor.sol, cor.vaso, cor.raiz];

const valorComUnidade = (v: number, unidade?: string) => {
  const u = unidade?.trim();
  if (!u) return formatarNumero(v);
  if (u === "%") return `${formatarNumero(v)}%`;
  if (/^(R\$|US\$|\$|€|£)$/.test(u)) return `${u} ${formatarNumero(v)}`;
  return `${formatarNumero(v)} ${u}`;
};

// Rótulo embaixo do eixo (itálico, até 2 linhas na largura da coluna)
const RotuloDoEixo: React.FC<{ texto: string; cx: number; largura: number; q: number }> = ({ texto, cx, largura, q }) => {
  const e = encaixar(texto, { largura, max: 46, min: 34, linhas: 2, fonte: "italico" });
  return (
    <div style={{ position: "absolute", left: cx - largura / 2, top: Y_BASE + 22, width: largura, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: serif, fontStyle: "italic", fontWeight: 600, fontSize: e.tamanho, lineHeight: 1.08 }}>
      {e.linhas.map((l, i) => (
        <LinhaATinta key={i} texto={l} q={limitar(q * e.linhas.length - i)} corTinta={cor.tinta} />
      ))}
    </div>
  );
};

const ValorEmCima: React.FC<{ texto: string; cx: number; y: number; largura: number; p: number }> = ({ texto, cx, y, largura, p }) => {
  let tam = 54;
  while (tam > 32 && larguraTexto(texto, tam, "serif800", { espaco: 0.2 }) > largura) tam -= 2;
  if (p <= 0.01) return null;
  return (
    <div style={{ position: "absolute", left: cx - largura / 2, top: y - tam * 1.15, width: largura, textAlign: "center", fontFamily: serif, fontWeight: 800, fontSize: tam, lineHeight: 1, color: cor.tinta, opacity: p, whiteSpace: "nowrap", translate: `0 ${(1 - p) * 12}px` }}>
      {texto}
    </div>
  );
};

const Eixos: React.FC<{ p: number; lapis: number; vertical?: boolean }> = ({ p, lapis, vertical = true }) => (
  <g>
    <path d={`M ${X0} ${Y_TOPO - 30} L ${X0} ${Y_BASE} L ${X1} ${Y_BASE}`} fill="none" stroke={cor.grafite} strokeWidth={traco.fino} opacity={lapis * (1 - p)} />
    {vertical ? <Traco d={`M ${X0} ${Y_BASE} L ${X0} ${Y_TOPO - 30}`} p={p} cor={cor.tinta} largura={traco.medio} /> : null}
    <Traco d={`M ${X0} ${Y_BASE} L ${X1} ${Y_BASE}`} p={p} cor={cor.tinta} largura={traco.medio} />
    {vertical ? <Traco d={`M ${X0 - 10} ${Y_TOPO - 16} L ${X0} ${Y_TOPO - 32} L ${X0 + 10} ${Y_TOPO - 16}`} p={limitar(p * 2 - 1)} cor={cor.tinta} largura={traco.medio} /> : null}
    <Traco d={`M ${X1 - 16} ${Y_BASE - 10} L ${X1 + 2} ${Y_BASE} L ${X1 - 16} ${Y_BASE + 10}`} p={limitar(p * 2 - 1)} cor={cor.tinta} largura={traco.medio} />
  </g>
);

export const Grafico: React.FC<PropsDoBloco & { m: GraficoT }> = ({ m, t, palavras, chegada, layout, numeroFig }) => {
  const lapis = 1;
  const eixos = prog(t, Math.max(chegada + 0.15, m.de - 0.2), 0.7);
  const dados = (m.dados ?? []).slice(0, 6);
  const temDados = dados.length >= 2;
  const cabecalho = (
    <CabecalhoDoBloco
      t={t}
      palavras={palavras}
      chegada={chegada}
      layout={layout}
      numeroFig={numeroFig}
      de={m.de}
      ate={m.ate}
      rotulo={m.titulo || !m.rotulo ? (m.rotulo ?? `Fig. ${romano(numeroFig)}`) : `Fig. ${romano(numeroFig)}`}
      titulo={m.titulo ?? m.rotulo}
    />
  );

  // ——— sem números ditos: o caule que mostra a tendência ———
  if (!temDados) {
    const forma = m.tendencia ?? "sobe";
    const inicio = m.tendenciaEm ?? m.de + 0.3;
    const pena = prog(t, inicio, 2.2, corre);
    const amostras = 60;
    const pontoEm = (s: number) => {
      const x = X0 + 50 + s * (X1 - X0 - 110);
      const h = Y_BASE - Y_TOPO - 60;
      const y =
        forma === "sobe"
          ? Y_BASE - 50 - h * (0.08 + 0.86 * (s * s * 0.55 + s * 0.45)) + Math.sin(s * 9) * 18 * (1 - s)
          : forma === "cai"
            ? Y_TOPO + 40 + h * (0.06 + 0.88 * (s * s * 0.5 + s * 0.5)) + Math.sin(s * 8) * 16 * (1 - s)
            : Y_BASE - 50 - h * (0.45 + 0.3 * Math.sin(s * Math.PI * 3.2) * (0.6 + 0.4 * s));
      return { x, y };
    };
    const pts = Array.from({ length: amostras + 1 }, (_, i) => pontoEm(i / amostras));
    const caminho = pts.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const visiveis = pts.slice(0, Math.max(1, Math.round(pena * amostras)) + 1);
    const area = `${visiveis.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")} L ${visiveis[visiveis.length - 1].x} ${Y_BASE} L ${visiveis[0].x} ${Y_BASE} Z`;
    const folhas = Array.from({ length: 8 }, (_, i) => (i + 0.6) / 8.4);
    return (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Eixos p={eixos} lapis={lapis} />
          {/* esboço a lápis do caminho todo */}
          <path d={caminho} fill="none" stroke={cor.grafite} strokeWidth={traco.fino} strokeDasharray="5 9" opacity={lapis * (1 - pena)} />
          {pena > 0.02 ? <path d={area} fill={forma === "cai" ? cor.folhaPalida : cor.folha} opacity={0.16} filter="url(#aquarela)" style={{ mixBlendMode: "multiply" }} /> : null}
          <Traco d={caminho} p={pena} cor={cor.folhaTinta} largura={traco.forte} />
          {folhas.map((s, i) => {
            const k = Math.round(s * amostras);
            const a = pts[Math.max(0, k - 1)];
            const b = pts[Math.min(amostras, k + 1)];
            const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
            const cima = i % 2 === 0;
            const p = limitar((pena - s) * 7);
            const palido = forma === "cai" ? s : 0;
            return <Folha key={i} x={pts[k].x} y={pts[k].y} ang={ang + (cima ? -58 : 58) + (forma === "cai" ? 25 * s : 0)} c={86} l={34} p={p} palido={palido} lapis={lapis * 0.7} />;
          })}
          {/* a ponta: um botão que se abre (sobe) ou uma folha que cai (cai) */}
          {forma === "cai" && pena > 0.98 ? (
            <Folha x={pts[amostras].x - 30} y={Y_BASE - 40 + 20 * prog(t, inicio + 2.2, 0.8)} ang={160} c={70} l={28} p={1} palido={1} lapis={0} />
          ) : null}
        </svg>
        <Ilustrativo x={X1} y={Y_BASE + 26} p={prog(t, inicio + 0.2, 0.4)} alinhar="fim" />
        {m.unidade ? (
          <div style={{ position: "absolute", left: X0 + 22, top: Y_TOPO - 62, fontFamily: serif, fontStyle: "italic", fontWeight: 600, fontSize: 40, color: eixos > 0.5 ? cor.musgo : cor.grafite }}>{m.unidade}</div>
        ) : null}
        {cabecalho}
      </>
    );
  }

  const max = Math.max(...dados.map((d) => d.valor), 0.0001);
  const n = dados.length;

  // ——— pizza ———
  if (m.forma === "pizza") {
    const soma = dados.reduce((s, d) => s + d.valor, 0) || 1;
    const centro = { x: 318, y: 1090 };
    const r = 236;
    const unidade = m.unidade ?? (Math.abs(soma - 100) < 1.5 ? "%" : undefined);
    let acumulado = 0;
    const fatias = dados.map((d, i) => {
      const a0 = -90 + (acumulado / soma) * 360;
      acumulado += d.valor;
      const a1 = -90 + (acumulado / soma) * 360;
      return { d, i, a0, a1 };
    });
    const legendaX = 600;
    const legendaW = 1010 - legendaX;
    const medidas = dados.map((d) => medirEtiquetaDeItem(d.rotulo, legendaW, { max: 46, min: 34, detalhe: valorComUnidade(d.valor, unidade) }));
    const passo = Math.min(160, (FUNDO_CONTEUDO - TOPO_CONTEUDO - 40) / n);
    const y0 = centro.y - (passo * (n - 1)) / 2;
    const arco = (a0: number, a1: number, rr: number) => {
      const p0 = { x: centro.x + rr * Math.cos((a0 * Math.PI) / 180), y: centro.y + rr * Math.sin((a0 * Math.PI) / 180) };
      const p1 = { x: centro.x + rr * Math.cos((a1 * Math.PI) / 180), y: centro.y + rr * Math.sin((a1 * Math.PI) / 180) };
      return `M ${centro.x} ${centro.y} L ${p0.x} ${p0.y} A ${rr} ${rr} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1.x} ${p1.y} Z`;
    };
    return (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <circle cx={centro.x} cy={centro.y} r={r} fill="none" stroke={cor.grafite} strokeWidth={traco.fino} opacity={lapis} />
          {fatias.map(({ d, i, a0, a1 }) => {
            const p = prog(t, d.em - 0.05, 0.6, corre);
            if (p <= 0.001) return null;
            const fim = a0 + (a1 - a0) * p;
            const meio = ((a0 + a1) / 2) * (Math.PI / 180);
            const alvo = { x: centro.x + r * 0.62 * Math.cos(meio), y: centro.y + r * 0.62 * Math.sin(meio) };
            const yl = y0 + i * passo;
            const fio = prog(t, d.em + 0.3, 0.35);
            return (
              <g key={i}>
                <g filter="url(#aquarela)" style={{ mixBlendMode: "multiply" }}>
                  <path d={arco(a0, Math.max(a0 + 0.5, fim), r)} fill={AGUADAS[i % AGUADAS.length]} opacity={0.72} transform="translate(3 3)" />
                </g>
                <path d={arco(a0, Math.max(a0 + 0.5, fim), r)} fill={`url(#${i % 2 ? "hachuraFolha" : "hachuraTinta"})`} opacity={0.35} />
                <path d={arco(a0, Math.max(a0 + 0.5, fim), r)} fill="none" stroke={cor.tinta} strokeWidth={traco.medio} strokeLinejoin="round" />
                {fio > 0.01 ? (
                  <g>
                    <circle cx={alvo.x} cy={alvo.y} r={10} fill={cor.etiqueta} fillOpacity={0.7} stroke={cor.musgo} strokeWidth={traco.medio} opacity={fio} />
                    <Traco d={`M ${alvo.x} ${alvo.y} L ${legendaX - 30} ${yl} L ${legendaX} ${yl}`} p={fio} cor={cor.tinta} largura={traco.fino} />
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>
        {dados.map((d, i) => (
          <EtiquetaDeItem key={i} x={legendaX} y={y0 + i * passo} medida={medidas[i]} numero={i + 1} em={d.em + 0.35} detalheEm={d.em + 0.45} t={t} />
        ))}
        {cabecalho}
      </>
    );
  }

  // ——— barras e linha ———
  const slot = (X1 - X0 - 40) / n;
  const cxDe = (i: number) => X0 + 40 + slot * (i + 0.5);
  const hUtil = Y_BASE - Y_TOPO - 40;
  const yDe = (v: number) => Y_BASE - (Math.max(0, v) / max) * hUtil;

  if (m.forma === "linha") {
    // a linha mostra a variação: quando os valores ficam longe do zero (ex.: 82 → 78 kg), a escala
    // vai do menor ao maior, com folga; perto do zero, começa no zero
    const min = Math.min(...dados.map((d) => d.valor));
    const base = min > max * 0.45 ? min - (max - min) * 0.35 : 0;
    const teto = max + (max - base) * 0.12;
    const yLinha = (v: number) => Y_BASE - 30 - ((v - base) / Math.max(0.0001, teto - base)) * (hUtil - 90);
    const pts = dados.map((d, i) => ({ x: cxDe(i), y: yLinha(d.valor) }));
    return (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Eixos p={eixos} lapis={lapis} />
          {pts.map((p, i) => (i ? <line key={i} x1={pts[i - 1].x} y1={pts[i - 1].y} x2={p.x} y2={p.y} stroke={cor.grafite} strokeWidth={traco.fino} strokeDasharray="5 9" opacity={lapis} /> : null))}
          {pts.map((p, i) => {
            if (i === 0) return null;
            const q = prog(t, dados[i].em - 0.25, 0.5, corre);
            return <Traco key={i} d={`M ${pts[i - 1].x} ${pts[i - 1].y} L ${p.x} ${p.y}`} p={q} cor={cor.folhaTinta} largura={traco.forte} />;
          })}
          {pts.map((p, i) => {
            const q = prog(t, dados[i].em - 0.05, 0.6);
            return (
              <g key={i}>
                <line x1={p.x} y1={p.y + 14} x2={p.x} y2={Y_BASE} stroke={q > 0.5 ? cor.tinta : cor.grafiteClaro} strokeWidth={traco.cabelo} strokeDasharray="3 7" opacity={0.7} />
                <Folha x={p.x} y={p.y} ang={i % 2 ? 58 : 122} c={66} l={26} p={q} lapis={lapis} />
                <circle cx={p.x} cy={p.y} r={10} fill={cor.etiqueta} stroke={q > 0.2 ? cor.musgo : cor.grafite} strokeWidth={traco.medio} />
              </g>
            );
          })}
        </svg>
        {dados.map((d, i) => (
          <ValorEmCima key={`v${i}`} texto={valorComUnidade(d.valor, m.unidade)} cx={cxDe(i)} y={pts[i].y - 22} largura={slot - 8} p={prog(t, d.em + 0.1, 0.35)} />
        ))}
        {dados.map((d, i) => (
          <RotuloDoEixo key={`r${i}`} texto={d.rotulo} cx={cxDe(i)} largura={slot - 10} q={prog(t, d.em - 0.05, 0.45, (v) => v)} />
        ))}
        {m.ilustrativo ? <Ilustrativo x={X1} y={Y_BASE + 120} p={eixos} alinhar="fim" /> : null}
        {cabecalho}
      </>
    );
  }

  const larguraBarra = Math.min(140, slot * 0.6);
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Eixos p={eixos} lapis={lapis} vertical={false} />
        {dados.map((d, i) => {
          const cx = cxDe(i);
          const hFinal = Y_BASE - yDe(d.valor);
          const q = prog(t, d.em - 0.05, 0.7, corre);
          const h = hFinal * q;
          const x = cx - larguraBarra / 2;
          return (
            <g key={i}>
              {/* esboço da coluna inteira, a lápis */}
              <rect x={x} y={Y_BASE - hFinal} width={larguraBarra} height={hFinal} fill="none" stroke={cor.grafite} strokeWidth={traco.fino} strokeDasharray="6 8" opacity={lapis * (1 - q)} />
              {q > 0.005 ? (
                <g>
                  <g filter="url(#aquarela)" style={{ mixBlendMode: "multiply" }}>
                    <rect x={x + 3} y={Y_BASE - h + 3} width={larguraBarra} height={h} fill={cor.folha} opacity={0.72} />
                  </g>
                  <rect x={x} y={Y_BASE - h} width={larguraBarra} height={h} fill="url(#hachuraFolha)" opacity={0.45} />
                  <path d={`M ${x} ${Y_BASE} L ${x} ${Y_BASE - h} L ${x + larguraBarra} ${Y_BASE - h} L ${x + larguraBarra} ${Y_BASE}`} fill="none" stroke={cor.tinta} strokeWidth={traco.medio} strokeLinejoin="round" />
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
      {dados.map((d, i) => (
        <ValorEmCima key={`v${i}`} texto={valorComUnidade(d.valor, m.unidade)} cx={cxDe(i)} y={yDe(d.valor) - 6} largura={slot - 8} p={prog(t, d.em + 0.35, 0.35)} />
      ))}
      {dados.map((d, i) => (
        <RotuloDoEixo key={`r${i}`} texto={d.rotulo} cx={cxDe(i)} largura={slot - 10} q={prog(t, d.em - 0.05, 0.45, (v) => v)} />
      ))}
      {m.ilustrativo ? <Ilustrativo x={X1} y={Y_BASE + 120} p={eixos} alinhar="fim" /> : null}
      {cabecalho}
    </>
  );
};
