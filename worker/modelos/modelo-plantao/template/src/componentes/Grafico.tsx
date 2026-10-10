// Gráfico de linhas no painel de baixo (tela dividida), como nas telas de economia do telejornal:
// cada série é uma linha que se desenha quando é dita — a primeira em branco, a segunda em
// azul-claro —, com o rótulo à direita e o triângulo de alta/baixa. Antes de ser dita, cada linha
// já aparece tracejada "a lápis" e o rótulo apagado. Um feixe de linhas finas ao lado da primeira
// mostra "de forma geral" (várias coisas subindo juntas). Serve para qualquer "isto sobe e aquilo
// cai" (é o modo `series` do bloco `grafico`); sem números, com o selo "ilustrativo".
import { indicesDoDestaque, limitar, Linhas, Palavras, prog, temposDoTexto } from "../anim";
import type { Area } from "../layout";
import { diagramar } from "../medidas";
import type { Grafico as G, Palavra } from "../plano";
import { cor, manchete, rotulo } from "../tema";
import { Seta } from "./Icones";
import { Ilustrativo } from "./Selos";

const MARGEM = 60;

// caminho de uma série: começa embaixo (sobe) ou em cima (desce), com uma curva suave
const caminho = (x0: number, x1: number, yTopo: number, yBase: number, sentido: "sobe" | "desce", desvio = 0, curva = 0) => {
  const ya = sentido === "sobe" ? yBase - 24 + desvio : yTopo + 30 + desvio * 0.6;
  const yb = sentido === "sobe" ? yTopo + 22 + desvio * 0.5 : yBase - 26 + desvio;
  const dx = x1 - x0;
  return `M ${x0} ${ya} C ${x0 + dx * (0.42 + curva)} ${ya}, ${x0 + dx * (0.55 - curva)} ${yb}, ${x1} ${yb}`;
};

export const Grafico: React.FC<{ m: G; palavras: Palavra[]; t: number; area: Area; entra: number }> = ({ m, palavras, t, area, entra }) => {
  // a entrada e a saída são da troca de quadro (a pessoa cobre/descobre o painel, ou a cortina azul
  // passa): aqui o painel só desenha
  if (t < entra) return null;

  // cabeçalho: a palavra-tema numa tarja branca + o resto do título
  const titulo = m.titulo ?? "";
  const ws = titulo.split(/\s+/).filter(Boolean);
  const temposTitulo = titulo ? temposDoTexto(titulo, palavras, m.de, m.ate, m.de) : [];
  const noDestaque = indicesDoDestaque(titulo, m.destaque);
  const ix = [...noDestaque];
  const destaqueWs = ws.filter((_, i) => noDestaque.has(i));
  const restoWs = ws.filter((_, i) => !noDestaque.has(i));
  const temposResto = temposTitulo.filter((_, i) => !noDestaque.has(i));
  const pDestaque = ix.length ? prog(t, Math.max(entra + 0.1, temposTitulo[ix[0]] - 0.1), 0.34) : 0;

  // área do gráfico
  // o gráfico ocupa o painel inteiro, do cabeçalho até logo acima do letreiro
  const yCab = area.y + 26;
  const yTopo = area.y + 120;
  const yBase = area.y + area.h - 76;
  const x0 = MARGEM + 22;
  const x1 = 600;
  const colunaRotulo = { x: 632, w: 1080 - MARGEM - 632 };

  const series = (m.series ?? []).slice(0, 2);
  const corDa = (i: number) => (i === 0 ? cor.branco : cor.celeste);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {m.ilustrativo ? <Ilustrativo style={{ position: "absolute", right: MARGEM, top: yCab + 7 }} /> : null}
      {/* cabeçalho */}
      <div style={{ position: "absolute", left: MARGEM, top: yCab, height: 60, display: "flex", alignItems: "center", gap: 18 }}>
        {destaqueWs.length ? (
          <div style={{ background: cor.papel, height: 60, display: "flex", alignItems: "center", padding: "0 18px", clipPath: `inset(0 ${(1 - pDestaque) * 100}% 0 0)` }}>
            <div style={{ ...manchete, fontSize: 44, color: cor.tinta, opacity: limitar((pDestaque - 0.4) / 0.4), translate: "0 2px" }}>{destaqueWs.join(" ")}</div>
          </div>
        ) : null}
        {restoWs.length ? (
          <Palavras palavras={restoWs} tempos={temposResto} t={t} esboco={cor.apagadoNoAzul} corDe={() => cor.celeste} style={{ ...rotulo, fontSize: 42, translate: "0 2px" }} />
        ) : null}
      </div>

      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* eixos e grade */}
        {[0, 1, 2].map((k) => {
          const y = yTopo + ((yBase - yTopo) * k) / 3;
          return <line key={k} x1={x0} x2={x1 + 10} y1={y} y2={y} stroke="rgba(169,195,255,0.14)" strokeWidth={2} />;
        })}
        <line x1={x0} x2={x0} y1={yTopo - 10} y2={yBase} stroke="rgba(169,195,255,0.5)" strokeWidth={4} />
        <line x1={x0} x2={x1 + 10} y1={yBase} y2={yBase} stroke="rgba(169,195,255,0.5)" strokeWidth={4} />
        {series.map((sr, i) => {
          const d = caminho(x0 + 8, x1, yTopo, yBase, sr.sentido);
          const p = prog(t, sr.em - 0.04, 0.8);
          const feixe = sr.detalhe?.feixe ? prog(t, sr.detalhe.em - 0.04, 0.7) : 0;
          return (
            <g key={i}>
              {/* esboço a lápis */}
              <path d={d} fill="none" stroke={cor.apagadoNoAzul} strokeWidth={6} strokeDasharray="14 16" strokeLinecap="round" opacity={1 - p} />
              {sr.detalhe?.feixe
                ? [-34, 30, 58].map((desvio, k) => (
                    <path
                      key={k}
                      d={caminho(x0 + 8, x1 - 30 + k * 12, yTopo, yBase, sr.sentido, desvio, (k - 1) * 0.06)}
                      fill="none"
                      stroke={cor.celeste}
                      strokeOpacity={0.55}
                      strokeWidth={5}
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1 - limitar(feixe * 1.15 - k * 0.08)}
                    />
                  ))
                : null}
              <path d={d} fill="none" stroke={corDa(i)} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
            </g>
          );
        })}
      </svg>
      {/* a ponta de cada linha: um ponto que corre junto com o traço */}
      {series.map((sr, i) => {
        const p = prog(t, sr.em - 0.04, 0.8);
        if (p <= 0.01) return null;
        return <Ponta key={i} d={caminho(x0 + 8, x1, yTopo, yBase, sr.sentido)} p={p} cor={corDa(i)} />;
      })}
      {m.eixo !== "" ? (
        <div style={{ position: "absolute", left: x1 - 290, top: yBase + 12, width: 300, textAlign: "right", ...rotulo, fontSize: 36, color: cor.celeste, opacity: 0.9 }}>{m.eixo ?? "Tempo"}</div>
      ) : null}

      {/* rótulos à direita: o da série que sobe em cima, o da que desce embaixo */}
      {series.map((sr, i) => {
        const corte = { peso: 900 as const, alta: true, espacamento: -0.01 };
        const larguraTexto = colunaRotulo.w - 58;
        const { linhas, tam } = diagramar(sr.rotulo, { largura: larguraTexto, maximo: 56, minimo: 38, linhas: 3, corte });
        const tempos = temposDoTexto(sr.rotulo, palavras, m.de, m.ate, Math.max(entra + 0.2, sr.em - 0.06));
        const tDetalhe = sr.detalhe ? temposDoTexto(sr.detalhe.texto, palavras, m.de, m.ate, sr.detalhe.em - 0.06) : [];
        const pSeta = prog(t, sr.em, 0.3);
        const emCima = sr.sentido === "sobe" ? series.filter((o) => o.sentido === "sobe").indexOf(sr) === 0 : false;
        const topo = emCima || (series.length === 1 && sr.sentido === "sobe") ? yTopo - 16 : undefined;
        const altura = linhas.length * tam * 1.04 + (sr.detalhe ? 56 : 0);
        const y = topo ?? yBase - altura + 10;
        return (
          <div key={i} style={{ position: "absolute", left: colunaRotulo.x, top: y, width: colunaRotulo.w, display: "flex", gap: 14 }}>
            <Seta sentido={sr.sentido} tamanho={44} cor={corDa(i)} style={{ marginTop: tam * 0.12, opacity: 0.25 + 0.75 * pSeta, translate: `0 ${(1 - pSeta) * (sr.sentido === "sobe" ? 10 : -10)}px` }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Linhas linhas={linhas} tempos={tempos} t={t} esboco={cor.apagadoNoAzul} corDe={() => corDa(i)} entrelinha={Math.round(tam * 0.04)} style={{ ...manchete, fontSize: tam }} />
              {sr.detalhe ? (
                <Palavras
                  palavras={sr.detalhe.texto.split(/\s+/).filter(Boolean)}
                  tempos={tDetalhe}
                  t={t}
                  esboco={cor.apagadoNoAzul}
                  corDe={() => cor.celeste}
                  style={{ ...rotulo, fontSize: 36, letterSpacing: "0.04em", flexWrap: "wrap", rowGap: 6 }}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// O ponto na ponta do traço (medido no próprio caminho SVG)
const Ponta: React.FC<{ d: string; p: number; cor: string }> = ({ d, p, cor: c }) => {
  // amostra a curva de Bézier cúbica do caminho (M x y C x1 y1, x2 y2, x y)
  const n = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  if (n.length < 8) return null;
  const [ax, ay, b1x, b1y, b2x, b2y, bx, by] = n;
  // o traço anda pelo comprimento; aproxima o parâmetro pelo comprimento acumulado
  const pts: { x: number; y: number; l: number }[] = [];
  let l = 0;
  for (let k = 0; k <= 60; k++) {
    const u = k / 60;
    const x = (1 - u) ** 3 * ax + 3 * (1 - u) ** 2 * u * b1x + 3 * (1 - u) * u ** 2 * b2x + u ** 3 * bx;
    const y = (1 - u) ** 3 * ay + 3 * (1 - u) ** 2 * u * b1y + 3 * (1 - u) * u ** 2 * b2y + u ** 3 * by;
    if (pts.length) l += Math.hypot(x - pts[pts.length - 1].x, y - pts[pts.length - 1].y);
    pts.push({ x, y, l });
  }
  const alvo = p * l;
  const q = pts.find((x) => x.l >= alvo) ?? pts[pts.length - 1];
  return <div style={{ position: "absolute", left: q.x - 16, top: q.y - 16, width: 32, height: 32, borderRadius: 16, background: c, boxShadow: `0 0 0 7px ${cor.estudio}` }} />;
};
