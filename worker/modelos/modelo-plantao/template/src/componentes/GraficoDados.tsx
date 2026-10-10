// Gráfico (bloco universal) no painel do estúdio, como nas telas de economia do telejornal:
// - com `dados` (números ditos): barras que crescem, linha que anda de ponto em ponto ou pizza
//   (anel) que se fatia, cada dado no seu `em`, com o valor contando em cima;
// - sem `dados`: a forma da `tendencia` (sobe, cai, oscila) se desenha na fala, com o triângulo de
//   alta/baixa e o selo "ilustrativo".
// Antes de ser dito, tudo já está "a lápis": contornos tracejados e valores apagados.
import { indicesDoDestaque, limitar, Linhas, Palavras, prog, temposDoTexto, troca } from "../anim";
import type { Area } from "../layout";
import { caber } from "../medidas";
import type { Grafico as G, Palavra } from "../plano";
import { cor, manchete, MARGEM, numeros, rotulo, texto as estiloTexto, W } from "../tema";
import { escreverNumero } from "../valores";
import { Seta } from "./Icones";
import { Ilustrativo } from "./Selos";

const MOEDAS = ["R$", "US$", "€", "$", "£"];
const formatar = (valor: number, unidade: string | undefined, atual = valor) =>
  unidade && MOEDAS.includes(unidade.trim()) ? escreverNumero(valor, { prefixo: unidade.trim() }, atual) : escreverNumero(valor, { sufixo: unidade?.trim() || undefined }, atual);

// Cabeçalho do gráfico: o título em azul-claro, palavra por palavra, com o trecho em `destaque`
// numa tarja branca no lugar dele (a mesma linguagem do gráfico de linhas do vídeo de exemplo).
export const CabecalhoGrafico: React.FC<{ titulo?: string; destaque?: string; palavras: Palavra[]; t: number; de: number; ate: number; entra: number; y: number; largura: number }> = ({
  titulo,
  destaque,
  palavras,
  t,
  de,
  ate,
  entra,
  y,
  largura,
}) => {
  if (!titulo?.trim()) return null;
  const ws = titulo.split(/\s+/).filter(Boolean);
  const tempos = temposDoTexto(titulo, palavras, de, ate, Math.max(de, entra + 0.1));
  const noDestaque = indicesDoDestaque(titulo, destaque);
  // trechos seguidos: [texto comum] [tarja] [texto comum]
  const trechos: { tarja: boolean; ix: number[] }[] = [];
  ws.forEach((_, i) => {
    const tarja = noDestaque.has(i);
    const ultimo = trechos[trechos.length - 1];
    if (ultimo && ultimo.tarja === tarja) ultimo.ix.push(i);
    else trechos.push({ tarja, ix: [i] });
  });
  const corte = { peso: 800 as const, alta: true, espacamento: 0.06 };
  // um corpo só para a linha inteira (a tarja vale ~1,4 letra a mais por causa da margem)
  const tam = caber(`${titulo} xx`, { largura, maximo: 42, minimo: 30, linhas: 1, corte }).tam;
  return (
    <div style={{ position: "absolute", left: MARGEM, top: y, height: 60, display: "flex", alignItems: "center", gap: 16 }}>
      {trechos.map((tr, k) => {
        if (tr.tarja) {
          const p = prog(t, Math.max(entra + 0.1, tempos[tr.ix[0]] - 0.1), 0.34);
          return (
            <div key={k} style={{ background: cor.papel, height: 60, display: "flex", alignItems: "center", padding: "0 16px", clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}>
              <div style={{ ...manchete, fontSize: Math.round(tam * 1.06), color: cor.tinta, opacity: limitar((p - 0.4) / 0.4), translate: "0 2px", whiteSpace: "pre" }}>{tr.ix.map((i) => ws[i]).join(" ")}</div>
            </div>
          );
        }
        return (
          <Palavras
            key={k}
            palavras={tr.ix.map((i) => ws[i])}
            tempos={tr.ix.map((i) => tempos[i])}
            t={t}
            esboco={cor.apagadoNoAzul}
            corDe={() => cor.celeste}
            style={{ ...rotulo, fontSize: tam, translate: "0 2px" }}
          />
        );
      })}
    </div>
  );
};

// o caminho de uma tendência sem números, dentro da caixa do gráfico
const caminhoDaTendencia = (tendencia: "sobe" | "cai" | "oscila", x0: number, x1: number, yTopo: number, yBase: number) => {
  const pts: [number, number][] = [];
  const n = 48;
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    const x = x0 + (x1 - x0) * u;
    let v: number;
    if (tendencia === "oscila") v = 0.5 + 0.34 * Math.sin(u * Math.PI * 3.2 + 0.4);
    else {
      const base = u * u * (3 - 2 * u) * 0.78 + u * 0.12;
      const onda = 0.05 * Math.sin(u * Math.PI * 4.3);
      v = tendencia === "sobe" ? 0.06 + base + onda : 0.94 - base - onda;
    }
    pts.push([x, yBase - (yBase - yTopo) * limitar(v, 0.02, 0.98)]);
  }
  return pts;
};
const comprimento = (pts: [number, number][]) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
const pontoEm = (pts: [number, number][], p: number): [number, number] => {
  const total = comprimento(pts);
  let andou = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (andou + d >= p * total) {
      const f = d ? (p * total - andou) / d : 0;
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
    }
    andou += d;
  }
  return pts[pts.length - 1];
};
const d = (pts: [number, number][]) => pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

// fatias da pizza: papel, azul-claro, azul elétrico, e variações
const CORES_PIZZA = [cor.papel, cor.celeste, cor.eletrico, "#6E8CFF", "#D7E2FF", "#4B63C9"];

export const GraficoDados: React.FC<{ m: G; palavras: Palavra[]; t: number; area: Area; entra: number }> = ({ m, palavras, t, area, entra }) => {
  if (t < entra) return null;
  const dados = (m.dados ?? []).slice(0, 6);
  const comDados = dados.length >= 2;
  const ilustrativo = !comDados || !!m.ilustrativo;
  const forma = m.forma ?? "linha";
  const yCab = area.y + 26;
  const temCab = !!m.titulo?.trim();
  const yTopo = area.y + (temCab ? 116 : 84);
  const yFim = area.y + area.h - 26;
  const largura = W - 2 * MARGEM;
  const sinal = ilustrativo ? <Ilustrativo style={{ position: "absolute", right: MARGEM, top: temCab ? yCab + 7 : area.y + 22 }} /> : null;
  const cab = <CabecalhoGrafico titulo={m.titulo} destaque={m.destaque} palavras={palavras} t={t} de={m.de} ate={m.ate} entra={entra} y={yCab} largura={largura - (ilustrativo ? 250 : 0)} />;

  // ——— sem números: a forma da tendência ———
  if (!comDados) {
    const tendencia = m.tendencia ?? "sobe";
    const em = m.tendenciaEm ?? m.de + 0.4;
    const yBase = yFim - 20;
    const x0 = MARGEM + 22;
    const x1 = W - MARGEM - 110;
    const p = prog(t, em - 0.05, 1.3, troca);
    const pSeta = prog(t, em + 1.0, 0.35);
    const subida = tendencia === "sobe";
    const setaSentido = tendencia === "cai" ? "desce" : "sobe";
    if (forma === "barras") {
      const n = 6;
      const passo = (x1 - x0) / n;
      const pts = caminhoDaTendencia(tendencia, 0, 1, 0, 1);
      return (
        <div style={{ position: "absolute", inset: 0 }}>
          {cab}
          {sinal}
          <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
            <line x1={x0 - 10} x2={x1 + 10} y1={yBase} y2={yBase} stroke="rgba(169,195,255,0.5)" strokeWidth={4} />
            {Array.from({ length: n }, (_, k) => {
              const v = 1 - pts[Math.round(((k + 0.5) / n) * 48)][1];
              const hTotal = (yBase - yTopo) * Math.max(0.12, v);
              const pk = prog(t, em - 0.05 + k * 0.14, 0.45);
              const x = x0 + k * passo + passo * 0.16;
              const w = passo * 0.68;
              return (
                <g key={k}>
                  <rect x={x} y={yBase - hTotal} width={w} height={hTotal} fill="none" stroke={cor.apagadoNoAzul} strokeWidth={4} strokeDasharray="12 10" opacity={1 - pk} />
                  <rect x={x} y={yBase - hTotal * pk} width={w} height={hTotal * pk} fill={k === n - 1 ? cor.eletrico : cor.papel} />
                </g>
              );
            })}
          </svg>
          <Seta sentido={setaSentido} tamanho={64} cor={cor.branco} style={{ position: "absolute", left: x1 + 26, top: subida ? yTopo : yBase - 70, opacity: 0.2 + 0.8 * pSeta, translate: `0 ${(1 - pSeta) * (subida ? 12 : -12)}px` }} />
        </div>
      );
    }
    const pts = caminhoDaTendencia(tendencia, x0, x1, yTopo, yBase);
    const ponta = pontoEm(pts, Math.max(0.001, p));
    // depois de desenhada, a ponta "respira" (dado ao vivo)
    const vivo = p >= 1 ? 1 + 0.18 * (0.5 + 0.5 * Math.sin((t - em) * Math.PI * 1.6)) : 1;
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        {cab}
        {sinal}
        <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
          {[0, 1, 2].map((k) => {
            const y = yTopo + ((yBase - yTopo) * k) / 3;
            return <line key={k} x1={x0} x2={x1 + 10} y1={y} y2={y} stroke="rgba(169,195,255,0.14)" strokeWidth={2} />;
          })}
          <line x1={x0} x2={x0} y1={yTopo - 10} y2={yBase} stroke="rgba(169,195,255,0.5)" strokeWidth={4} />
          <line x1={x0} x2={x1 + 10} y1={yBase} y2={yBase} stroke="rgba(169,195,255,0.5)" strokeWidth={4} />
          <path d={d(pts)} fill="none" stroke={cor.apagadoNoAzul} strokeWidth={6} strokeDasharray="14 16" strokeLinecap="round" opacity={1 - p} />
          <path d={d(pts)} fill="none" stroke={cor.branco} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
        </svg>
        {p > 0.01 ? (
          <div style={{ position: "absolute", left: ponta[0] - 16, top: ponta[1] - 16, width: 32, height: 32, borderRadius: 16, background: cor.branco, boxShadow: `0 0 0 7px ${cor.estudio}`, scale: String(vivo) }} />
        ) : null}
        <Seta sentido={setaSentido} tamanho={64} cor={cor.branco} style={{ position: "absolute", left: x1 + 34, top: tendencia === "cai" ? yBase - 70 : yTopo - 6, opacity: 0.2 + 0.8 * pSeta, translate: `0 ${(1 - pSeta) * (setaSentido === "sobe" ? 12 : -12)}px` }} />
        {m.eixo !== "" ? (
          <div style={{ position: "absolute", left: x1 - 290, top: yBase + 10, width: 300, textAlign: "right", ...rotulo, fontSize: 32, color: cor.celeste, opacity: 0.9 }}>{m.eixo ?? ""}</div>
        ) : null}
      </div>
    );
  }

  // ——— com números ditos ———
  const max = Math.max(...dados.map((x) => Math.abs(x.valor)), 1e-9);
  const corteValor = { peso: 900 as const, alta: true, tabular: true };
  const corteRotulo = { peso: 800 as const, alta: true, espacamento: 0.04 };

  if (forma === "pizza") {
    const total = dados.reduce((s, x) => s + Math.max(0, x.valor), 0) || 1;
    const alturaCorpo = yFim - yTopo;
    const R = Math.min(alturaCorpo / 2 - 6, 200);
    const cx = MARGEM + R + 4;
    const cy = yTopo + alturaCorpo / 2;
    const espessura = R * 0.42;
    const xLegenda = cx + R + 56;
    const larguraLegenda = W - MARGEM - xLegenda;
    const passo = Math.min(96, alturaCorpo / dados.length);
    const yLegenda = cy - (passo * dados.length) / 2;
    let acumulado = 0;
    const fatias = dados.map((x, i) => {
      const a0 = (acumulado / total) * 360;
      acumulado += Math.max(0, x.valor);
      const a1 = (acumulado / total) * 360;
      return { a0, a1, cor: CORES_PIZZA[i % CORES_PIZZA.length], x };
    });
    const arco = (a0: number, a1: number, r: number) => {
      const pol = (a: number) => [cx + r * Math.cos(((a - 90) * Math.PI) / 180), cy + r * Math.sin(((a - 90) * Math.PI) / 180)];
      const [xa, ya] = pol(a0);
      const [xb, yb] = pol(a1);
      return `M ${xa} ${ya} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${xb} ${yb}`;
    };
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        {cab}
        {sinal}
        <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
          <circle cx={cx} cy={cy} r={R - espessura / 2} fill="none" stroke={cor.apagadoNoAzul} strokeWidth={4} strokeDasharray="12 10" />
          {fatias.map((f, i) => {
            const p = prog(t, f.x.em - 0.05, 0.6, troca);
            if (p <= 0) return null;
            const a1 = f.a0 + (f.a1 - f.a0) * p;
            return <path key={i} d={arco(f.a0, Math.max(f.a0 + 0.5, a1 - 0.6), R - espessura / 2)} fill="none" stroke={f.cor} strokeWidth={espessura} />;
          })}
        </svg>
        {fatias.map((f, i) => {
          const p = prog(t, f.x.em - 0.1, 0.34);
          const valor = formatar(f.x.valor, m.unidade);
          const tamValor = caber(valor, { largura: larguraLegenda * 0.42, maximo: 46, minimo: 30, linhas: 1, corte: corteValor }).tam;
          const rot = caber(f.x.rotulo, { largura: larguraLegenda - 52 - tamValor * valor.length * 0.66, maximo: 40, minimo: 30, linhas: 1, corte: corteRotulo });
          return (
            <div key={i} style={{ position: "absolute", left: xLegenda, top: yLegenda + i * passo, width: larguraLegenda, height: passo - 12, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 32, height: 32, flexShrink: 0, background: p > 0.3 ? f.cor : "transparent", border: p > 0.3 ? "none" : `4px dashed ${cor.apagadoNoAzul}` }} />
              <div style={{ ...rotulo, fontSize: rot.tam, color: p > 0.3 ? cor.branco : cor.apagadoNoAzul, flex: 1, whiteSpace: "nowrap" }}>{rot.linhas.join(" ")}</div>
              <div style={{ ...manchete, ...numeros, fontSize: tamValor, color: p > 0.3 ? cor.branco : cor.apagadoNoAzul, letterSpacing: 0, whiteSpace: "pre" }}>{valor}</div>
            </div>
          );
        })}
      </div>
    );
  }

  // barras e linha: eixo embaixo, rótulos sob o eixo, valores em cima
  const n = dados.length;
  const x0 = MARGEM;
  const x1 = W - MARGEM;
  const passo = (x1 - x0) / n;
  const rotulos = dados.map((x) => caber(x.rotulo, { largura: passo - 16, maximo: 34, minimo: 30, linhas: 2, corte: corteRotulo }));
  const altRotulos = Math.max(...rotulos.map((r) => r.linhas.length * r.tam * 1.08));
  const yBase = yFim - altRotulos - 14;
  const valores = dados.map((x) => formatar(x.valor, m.unidade));
  const tamValor = Math.min(...valores.map((v) => caber(v, { largura: passo - 12, maximo: 52, minimo: 30, linhas: 1, corte: corteValor }).tam));
  const yTopoBarras = yTopo + tamValor + 14;
  const alturaUtil = yBase - yTopoBarras;
  const minimo = Math.min(...dados.map((x) => x.valor));
  // a linha usa a faixa entre o menor e o maior valor (com folga); as barras partem do zero
  const maior = Math.max(...dados.map((x) => x.valor));
  const naLinha = (v: number) => {
    // valores todos altos e próximos: a linha usa a faixa deles (com folga), para a variação aparecer
    const lo = minimo >= 0 && minimo > maior * 0.5 ? minimo - (maior - minimo) * 0.6 : Math.min(0, minimo);
    if (maior - lo < 1e-9) return yBase - alturaUtil * 0.5;
    return yBase - ((v - lo) / (maior - lo)) * alturaUtil;
  };
  const centros = dados.map((_, i) => x0 + passo * (i + 0.5));
  const progressos = dados.map((x) => prog(t, x.em - 0.06, 0.6, troca));
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {cab}
      {sinal}
      <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={x0} x2={x1} y1={yBase} y2={yBase} stroke="rgba(169,195,255,0.5)" strokeWidth={4} />
        {forma === "barras"
          ? dados.map((x, i) => {
              const h = (Math.abs(x.valor) / max) * alturaUtil;
              const w = Math.min(150, passo * 0.62);
              const p = progressos[i];
              return (
                <g key={i}>
                  <rect x={centros[i] - w / 2} y={yBase - h} width={w} height={h} fill="none" stroke={cor.apagadoNoAzul} strokeWidth={4} strokeDasharray="12 10" opacity={1 - p} />
                  <rect x={centros[i] - w / 2} y={yBase - h * p} width={w} height={h * p} fill={x.valor === max ? cor.papel : cor.celeste} />
                </g>
              );
            })
          : (() => {
              const pts = dados.map((x, i) => [centros[i], naLinha(x.valor)] as [number, number]);
              // a linha anda de um ponto ao seguinte quando o seguinte é dito
              const feitos: string[] = [];
              for (let i = 1; i < pts.length; i++) {
                const p = progressos[i];
                if (p <= 0) continue;
                const [ax, ay] = pts[i - 1];
                const [bx, by] = pts[i];
                feitos.push(`M ${ax} ${ay} L ${ax + (bx - ax) * p} ${ay + (by - ay) * p}`);
              }
              return (
                <>
                  <path d={d(pts)} fill="none" stroke={cor.apagadoNoAzul} strokeWidth={6} strokeDasharray="14 16" strokeLinecap="round" />
                  {feitos.map((s, k) => (
                    <path key={k} d={s} fill="none" stroke={cor.branco} strokeWidth={12} strokeLinecap="round" />
                  ))}
                  {pts.map((pt, i) => (
                    <circle key={i} cx={pt[0]} cy={pt[1]} r={progressos[i] > 0.05 ? 16 : 12} fill={progressos[i] > 0.05 ? cor.branco : cor.estudio} stroke={progressos[i] > 0.05 ? cor.estudio : cor.apagadoNoAzul} strokeWidth={progressos[i] > 0.05 ? 7 : 4} />
                  ))}
                </>
              );
            })()}
      </svg>
      {dados.map((x, i) => {
        const p = progressos[i];
        const y = forma === "barras" ? yBase - (Math.abs(x.valor) / max) * alturaUtil * Math.max(p, 0) : naLinha(x.valor);
        const texto = p >= 1 ? valores[i] : formatar(x.valor, m.unidade, x.valor * p);
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: centros[i] - passo / 2, width: passo, top: y - tamValor - 16, textAlign: "center", ...manchete, ...numeros, fontSize: tamValor, letterSpacing: 0, color: p > 0.02 ? cor.branco : cor.apagadoNoAzul, whiteSpace: "pre" }}>
              {p > 0.02 ? texto : valores[i]}
            </div>
            <div style={{ position: "absolute", left: centros[i] - passo / 2 + 8, width: passo - 16, top: yBase + 14 }}>
              <Linhas linhas={rotulos[i].linhas} tempos={rotulos[i].linhas.flatMap((l) => l.split(/\s+/).map(() => x.em - 0.1))} t={t} esboco={cor.apagadoNoAzul} corDe={() => cor.celeste} alinhar="center" style={{ ...rotulo, fontSize: rotulos[i].tam, alignItems: "center", lineHeight: 1.08 }} />
            </div>
          </div>
        );
      })}
      {m.unidade && !valores.some((v) => v.includes(m.unidade ?? "")) ? (
        <div style={{ position: "absolute", left: MARGEM, top: yFim - 30, ...estiloTexto, fontSize: 30, color: cor.celeste }}>{m.unidade}</div>
      ) : null}
    </div>
  );
};
