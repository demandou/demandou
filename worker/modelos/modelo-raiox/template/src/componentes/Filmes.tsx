// O que vai dentro do filme no negatoscópio, para os blocos universais: lista (achados com a janela
// de leitura), passos (a régua que se enche), comparação (duas chapas lado a lado) e gráfico
// (desenhado em traço de osso, com as medidas em ciano). Mesma linguagem das chapas de postura:
// traço luminoso, ciano de medida, vermelho só para tensão, marcação de filme em Reddit Mono.
import { interpolateColors } from "remotion";
import { casasDe, formatarNumero, Linhas, prog, temposDoTexto, troca } from "../anim";
import { PontoDeTensao } from "../esqueleto/Cena";
import { diagramar, medir } from "../medidas";
import type { Comparacao, Grafico, Item, Palavra, Passos, Topicos } from "../plano";
import { apoio as estiloApoio, cor, marcacao, titulo as estiloTitulo } from "../tema";
import { Chapa } from "./Chapa";

// nenhum texto passa daqui dentro do filme (no quadro: x 960, a coluna de botões do app)
const folgaDireita = 54;

const Brilho: React.FC<{ id: string; largura: number; altura: number }> = ({ id, largura, altura }) => (
  <defs>
    <filter id={`luz-${id}`} filterUnits="userSpaceOnUse" x={-60} y={-60} width={largura + 120} height={altura + 120}>
      <feGaussianBlur stdDeviation={3.2} result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// tempos das palavras de um item: do instante dele até o próximo item (ou o fim do momento)
const temposDoItem = (texto: string, palavras: Palavra[], em: number, ate: number) => temposDoTexto(texto, palavras, em - 0.3, ate, em - 0.05);

// um corpo único para todos os itens de uma lista (o maior em que todos cabem em até 2 linhas)
const corpoComum = (textos: string[], largura: number, maximo: number, minimo: number, linhas: number) => {
  const tam = Math.min(...textos.map((x) => diagramar(x, largura, maximo, minimo, linhas, "sans700").tamanho));
  return { tamanho: tam, linhas: textos.map((x) => diagramar(x, largura, tam, tam, linhas, "sans700").linhas) };
};

// ---------- lista: achados ----------

export const FilmeTopicos: React.FC<{ m: Topicos | Passos; t: number; largura: number; altura: number; id: string; palavras: Palavra[]; ordem?: boolean }> = ({
  m,
  t,
  largura,
  altura,
  id,
  palavras,
  ordem,
}) => {
  const itens: Item[] = m.itens.slice(0, 5);
  const n = Math.max(1, itens.length);
  const topo = 30;
  const base = altura - 26;
  const H = (base - topo) / n;
  const xMarca = ordem ? 84 : 78;
  const raio = n >= 5 ? 26 : 31;
  const xTexto = ordem ? 168 : 150;
  const wTexto = largura - folgaDireita - xTexto;
  const maximo = n <= 2 ? 76 : n === 3 ? 70 : n === 4 ? 62 : 54;
  const corpo = corpoComum(
    itens.map((i) => i.texto),
    wTexto,
    maximo,
    44,
    2,
  );
  const detalhes = itens.map((i) => (i.detalhe ? diagramar(i.detalhe, wTexto, 44, 40, 2, "sans500") : null));
  // qual item é o da vez (o último já dito) e o quanto a janela/régua já andou
  let atual = -1;
  itens.forEach((it, i) => {
    if (t >= it.em - 0.05) atual = i;
  });
  const centro = (i: number) => topo + H * (i + 0.5);
  let yJanela = centro(Math.max(0, atual));
  if (atual > 0) yJanela = centro(atual - 1) + (centro(atual) - centro(atual - 1)) * prog(t, itens[atual].em - 0.05, 0.4, troca);
  const janela = atual >= 0 ? prog(t, itens[0].em - 0.05, 0.3) : 0;
  const yPrimeiro = centro(0);
  const yUltimo = centro(n - 1);
  return (
    <>
    <svg width={largura} height={altura} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <Brilho id={id} largura={largura} altura={altura} />
      {ordem ? (
        <g>
          {/* a régua: tracejada a lápis, com marcas; enche de ciano até o passo da vez */}
          <line x1={xMarca} y1={yPrimeiro} x2={xMarca} y2={yUltimo} stroke={cor.esbocoTraco} strokeWidth={4} strokeDasharray="10 10" />
          {Array.from({ length: Math.floor((yUltimo - yPrimeiro) / 24) + 1 }, (_, k) => {
            const y = yPrimeiro + k * 24;
            const passou = atual >= 0 && y <= yJanela + 1;
            return <line key={k} x1={xMarca - 52} y1={y} x2={xMarca - 40} y2={y} stroke={passou ? cor.ciano : cor.esbocoTraco} strokeWidth={3} strokeLinecap="round" opacity={passou ? 0.9 : 1} />;
          })}
          {atual >= 0 ? <line x1={xMarca} y1={yPrimeiro} x2={xMarca} y2={yJanela} stroke={cor.ciano} strokeWidth={5} filter={`url(#luz-${id})`} /> : null}
          {atual >= 0 ? (
            <path d={`M ${xMarca - raio - 30} ${yJanela - 12} L ${xMarca - raio - 12} ${yJanela} L ${xMarca - raio - 30} ${yJanela + 12}`} fill="none" stroke={cor.ciano} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={janela} />
          ) : null}
        </g>
      ) : (
        // a janela de leitura: uma faixa ciano bem fraca que desce até o item da vez
        <g opacity={janela}>
          <rect x={22} y={yJanela - H / 2 + 6} width={largura - 44} height={H - 12} rx={8} fill="rgba(92,200,232,0.07)" />
          <line x1={22} y1={yJanela - H / 2 + 6} x2={largura - 22} y2={yJanela - H / 2 + 6} stroke={cor.ciano} strokeWidth={2} opacity={0.55} />
          <line x1={22} y1={yJanela + H / 2 - 6} x2={largura - 22} y2={yJanela + H / 2 - 6} stroke={cor.ciano} strokeWidth={2} opacity={0.55} />
          <rect x={22} y={yJanela - H / 2 + 6} width={6} height={H - 12} fill={cor.ciano} filter={`url(#luz-${id})`} />
        </g>
      )}
      {itens.map((it, i) => {
        const y = centro(i);
        const aceso = prog(t, it.em - 0.05, 0.4);
        const desenha = prog(t, it.em - 0.05, 0.45);
        const feito = ordem && atual > i;
        return (
          <g key={i}>
            {!ordem && i > 0 ? <line x1={xTexto} y1={topo + H * i} x2={largura - folgaDireita} y2={topo + H * i} stroke={cor.esbocoTraco} strokeWidth={1.5} strokeDasharray="4 8" /> : null}
            <circle cx={xMarca} cy={y} r={raio} fill={ordem && aceso > 0 ? interpolateColors(aceso, [0, 1], ["rgba(3,8,13,0.86)", cor.ciano]) : "rgba(3,8,13,0.86)"} stroke={cor.esbocoTraco} strokeWidth={2.5} strokeDasharray={aceso > 0 ? undefined : "6 6"} />
            {aceso > 0 ? (
              <circle
                cx={xMarca}
                cy={y}
                r={raio}
                fill="none"
                stroke={cor.ciano}
                strokeWidth={3.5}
                pathLength={1}
                strokeDasharray={`${desenha} 1`}
                transform={`rotate(-90 ${xMarca} ${y})`}
                filter={feito || !ordem ? undefined : `url(#luz-${id})`}
              />
            ) : null}
            <text
              x={xMarca}
              y={y + raio * 0.38}
              textAnchor="middle"
              fill={ordem && aceso > 0.5 ? cor.sala : aceso > 0 ? cor.ciano : cor.texto}
              opacity={aceso > 0 ? 1 : 0.3}
              style={{ ...marcacao, fontSize: raio * 1.05, fontWeight: 700, letterSpacing: 0 }}
            >
              {ordem ? String(i + 1) : String(i + 1).padStart(2, "0")}
            </text>
          </g>
        );
      })}
    </svg>
        <div style={{ position: "absolute", left: 0, top: 0, width: largura, height: altura }}>
          {itens.map((it, i) => {
            const proximo = itens[i + 1]?.em ?? m.ate;
            const linhas = corpo.linhas[i];
            const det = detalhes[i];
            const altTexto = linhas.length * corpo.tamanho * 1.06 + (det ? 10 + det.linhas.length * det.tamanho * 1.16 : 0);
            const tempos = temposDoItem(it.texto, palavras, it.em, proximo);
            const tDet = det && it.detalhe ? temposDoTexto(it.detalhe, palavras, it.em, proximo, it.em + 0.2) : [];
            return (
              <div key={i} style={{ position: "absolute", left: xTexto, top: centro(i) - altTexto / 2, width: wTexto }}>
                <Linhas linhas={linhas} tempos={tempos} t={t} style={{ ...estiloTitulo, fontSize: corpo.tamanho }} />
                {det ? <Linhas linhas={det.linhas} tempos={tDet} t={t} fantasma={0.14} style={{ ...estiloApoio, fontSize: det.tamanho, marginTop: 10 }} /> : null}
              </div>
            );
          })}
        </div>
    </>
  );
};

// ---------- comparação: duas chapas lado a lado ----------

export const IDENTIFICACAO_DO_MODO = { contra: ["A", "B"], "antes-depois": ["Antes", "Depois"], "errado-certo": ["Errado", "Certo"] } as const;

export const FilmeComparacao: React.FC<{ m: Comparacao; t: number; largura: number; altura: number; id: string; palavras: Palavra[]; numero: string }> = ({
  m,
  t,
  largura,
  altura,
  id,
  palavras,
  numero,
}) => {
  const modo = m.modo ?? "contra";
  const gap = 22;
  const wh = (largura - gap) / 2;
  const pad = 36;
  const wTexto = wh - pad - folgaDireita + 18;
  const corpo = corpoComum(
    m.lados.map((l) => l.texto),
    wTexto,
    74,
    46,
    4,
  );
  const vencedorEm = m.vencedor !== undefined ? (m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7) : undefined;
  const ganha = vencedorEm !== undefined ? prog(t, vencedorEm, 0.45) : 0;
  const meio = prog(t, m.lados[1].em - 0.25, 0.4);
  const glifo = modo === "contra" ? "×" : "→";
  return (
    <>
      {m.lados.map((lado, i) => {
        const aceso = prog(t, lado.em - 0.05, 0.4);
        const errado = modo === "errado-certo" && i === 0;
        const certo = modo === "errado-certo" && i === 1;
        const corLado = errado ? cor.tensao : cor.ciano;
        const perde = m.vencedor !== undefined && m.vencedor !== i ? ganha : 0;
        const venceu = m.vencedor === i ? ganha : 0;
        const proximo = i === 0 ? m.lados[1].em : m.ate;
        const tempos = temposDoItem(lado.texto, palavras, lado.em, proximo);
        const tag = lado.rotulo.toUpperCase();
        const tamTag = Math.min(34, Math.max(30, Math.floor((wTexto - 30) / (Math.max(1, tag.length) * 0.563 * 1.04))));
        const marca = errado || certo ? prog(t, lado.em + 0.35, 0.4) : venceu;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * (wh + gap),
              top: 0,
              width: wh,
              height: altura,
              // o lado da vez acende; antes de ser dito, a chapa fica apagada (já no painel)
              filter: `brightness(${(0.5 + 0.5 * aceso - 0.4 * perde).toFixed(3)})`,
              boxShadow: venceu > 0 ? `0 0 0 ${(3 * venceu).toFixed(1)}px ${cor.ciano}` : "-10px 0 24px rgba(0,0,0,0.35)",
              borderRadius: 6,
            }}
          >
            <Chapa largura={wh} altura={altura} id={`${id}-${i}`} identificacao={IDENTIFICACAO_DO_MODO[modo][i]} numero={`${numero}${"AB"[i]}`}>
              <div style={{ position: "absolute", left: pad, top: 40, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: aceso > 0 ? corLado : cor.esbocoTraco }} />
                <div style={{ ...marcacao, fontSize: tamTag, color: aceso > 0 ? corLado : cor.esboco, maxWidth: wTexto - 26, overflow: "hidden", whiteSpace: "nowrap" }}>{tag}</div>
              </div>
              <div style={{ position: "absolute", left: pad, top: 118, width: wTexto }}>
                <Linhas linhas={corpo.linhas[i]} tempos={tempos} t={t} style={{ ...estiloTitulo, fontSize: corpo.tamanho }} />
              </div>
              {/* o selo de baixo: ✕ vermelho no errado, ✓ ciano no certo ou no vencedor */}
              {marca > 0 ? (
                <svg width={wh} height={altura} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                  <Brilho id={`${id}-${i}`} largura={wh} altura={altura} />
                  {errado ? <PontoDeTensao c={{ x: pad + 36, y: altura - 58 - 70 }} t={t} em={lado.em + 0.35} raio={12} id={`${id}-${i}`} /> : null}
                  <g opacity={marca}>
                    <circle cx={pad + 36} cy={altura - 58 - 70} r={34} fill="none" stroke={errado ? cor.tensao : cor.ciano} strokeWidth={4} opacity={errado ? 0 : 1} />
                    {errado ? null : (
                      <path
                        d={`M ${pad + 21} ${altura - 128} l 11 11 l 21 -24`}
                        fill="none"
                        stroke={cor.ciano}
                        strokeWidth={5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        pathLength={1}
                        strokeDasharray={`${marca} 1`}
                      />
                    )}
                  </g>
                </svg>
              ) : null}
            </Chapa>
          </div>
        );
      })}
      {/* o sinal entre as duas chapas */}
      {meio > 0 ? (
        <div
          style={{
            position: "absolute",
            left: largura / 2 - 40,
            top: (altura - 58) / 2 - 40,
            width: 80,
            height: 80,
            borderRadius: 40,
            background: cor.sala,
            border: `3px solid ${cor.ciano}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: meio,
            scale: `${(0.8 + 0.2 * meio).toFixed(3)}`,
            zIndex: 5,
          }}
        >
          <div style={{ ...marcacao, fontSize: 50, fontWeight: 700, color: cor.ciano, letterSpacing: 0, marginTop: -4 }}>{glifo}</div>
        </div>
      ) : null}
    </>
  );
};

// ---------- gráfico ----------

const CORES_PIZZA = [cor.ciano, cor.osso, "rgba(92,200,232,0.5)", "rgba(228,244,251,0.45)", "rgba(92,200,232,0.28)", "rgba(228,244,251,0.22)"];

const valorComUnidade = (valor: number, casas: number, unidade?: string) => `${formatarNumero(valor, casas)}${unidade === "%" ? "%" : ""}`;

// curva qualitativa (0–1) de uma tendência
const curva = (tendencia: "sobe" | "cai" | "oscila", u: number) => {
  if (tendencia === "oscila") return 0.5 + 0.28 * Math.sin(u * Math.PI * 5) * (0.8 + 0.2 * Math.cos(u * 7));
  const base = 0.12 + 0.76 * (u * u * 0.55 + u * 0.45);
  const onda = 0.05 * Math.sin(u * Math.PI * 4.2);
  const y = base + onda;
  return tendencia === "sobe" ? y : 1 - y;
};

export const FilmeGrafico: React.FC<{ m: Grafico; t: number; largura: number; altura: number; id: string }> = ({ m, t, largura, altura, id }) => {
  const dados = (m.dados ?? []).slice(0, 6);
  const esquerda = 74;
  const direita = largura - folgaDireita - 6;
  const topo = 110;
  const baseY = dados.length && m.forma !== "pizza" ? altura - 132 : altura - 70;
  const plotW = direita - esquerda;
  const plotH = baseY - topo;
  const mostraIlustrativo = m.ilustrativo || !dados.length;
  const unidadeTopo = m.unidade && m.unidade !== "%" ? m.unidade.toUpperCase() : "";
  const casas = Math.max(0, ...dados.map((d) => casasDe(d.valor)));
  const etiquetas = (
    <>
      {unidadeTopo ? (
        <div style={{ position: "absolute", left: esquerda, top: 32, ...marcacao, fontSize: 32, color: cor.textoSuave }}>{unidadeTopo}</div>
      ) : null}
      {mostraIlustrativo ? (
        <div style={{ position: "absolute", right: folgaDireita, top: 26, ...marcacao, fontSize: 32, color: cor.ciano, padding: "8px 14px", borderRadius: 6, border: `2px solid ${cor.cianoSuave}`, background: "rgba(3,8,13,0.7)" }}>Ilustrativo</div>
      ) : null}
    </>
  );

  // sem números ditos: a curva da tendência
  if (!dados.length) {
    const tend = m.tendencia ?? "sobe";
    const inicio = m.tendenciaEm ?? m.de + 0.25;
    const p = prog(t, inicio, 1.5, (x) => 1 - (1 - x) * (1 - x));
    const N = 90;
    const pts = Array.from({ length: N + 1 }, (_, k) => {
      const u = k / N;
      return { x: esquerda + u * plotW, y: baseY - curva(tend, u) * (plotH - 20) };
    });
    const ate = Math.max(1, Math.round(p * N));
    const d = pts
      .slice(0, ate + 1)
      .map((q, k) => `${k ? "L" : "M"} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`)
      .join(" ");
    const ponta = pts[ate];
    const pulso = p >= 1 ? ((t - inicio - 1.5) % 1.1) / 1.1 : 0;
    return (
      <>
        <svg width={largura} height={altura} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Brilho id={id} largura={largura} altura={altura} />
          <Eixos esquerda={esquerda} direita={direita} topo={topo} baseY={baseY} />
          {p > 0 ? (
            <>
              <path d={`${d} L ${ponta.x.toFixed(1)} ${baseY} L ${esquerda} ${baseY} Z`} fill="rgba(228,244,251,0.06)" />
              <path d={d} fill="none" stroke={cor.osso} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" filter={`url(#luz-${id})`} />
              {/* a medida: linha ciano da ponta até o eixo */}
              <line x1={esquerda} y1={ponta.y} x2={ponta.x} y2={ponta.y} stroke={cor.ciano} strokeWidth={2.5} strokeDasharray="10 9" opacity={0.8 * p} />
              <circle cx={ponta.x} cy={ponta.y} r={11} fill={cor.ciano} filter={`url(#luz-${id})`} />
              {p >= 1 ? <circle cx={ponta.x} cy={ponta.y} r={11 * (1 + 2.2 * pulso)} fill="none" stroke={cor.ciano} strokeWidth={2.5} opacity={1 - pulso} /> : null}
            </>
          ) : (
            <path d={pts.map((q, k) => `${k ? "L" : "M"} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" ")} fill="none" stroke={cor.esbocoTraco} strokeWidth={3} strokeDasharray="8 10" />
          )}
        </svg>
        {etiquetas}
      </>
    );
  }

  const max = Math.max(...dados.map((d) => d.valor), 0.0001);
  let atual = -1;
  dados.forEach((d, i) => {
    if (t >= d.em - 0.05) atual = i;
  });

  if (m.forma === "pizza") {
    const total = dados.reduce((a, d) => a + Math.max(0, d.valor), 0) || 1;
    const R = Math.min(210, (altura - 120) / 2);
    const cx = esquerda + R + 10;
    const cy = (altura - 58) / 2 + 16;
    const esp = 62;
    let acumulado = 0;
    const xLeg = cx + R + 70;
    const wLeg = direita - xLeg;
    const linhaH = Math.min(110, (altura - 140) / dados.length);
    const yLeg0 = cy - (linhaH * dados.length) / 2;
    return (
      <>
        <svg width={largura} height={altura} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Brilho id={id} largura={largura} altura={altura} />
          <circle cx={cx} cy={cy} r={R - esp / 2} fill="none" stroke={cor.esbocoTraco} strokeWidth={esp} opacity={0.35} />
          {dados.map((d, i) => {
            const frac = Math.max(0, d.valor) / total;
            const a0 = acumulado * 360;
            acumulado += frac;
            const q = prog(t, d.em - 0.05, 0.6);
            if (q <= 0) return null;
            const r = R - esp / 2;
            const comp = 2 * Math.PI * r;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={CORES_PIZZA[i % CORES_PIZZA.length]}
                strokeWidth={esp - 6}
                strokeDasharray={`${(comp * frac * q).toFixed(1)} ${comp.toFixed(1)}`}
                transform={`rotate(${(a0 - 90).toFixed(2)} ${cx} ${cy})`}
                filter={i === atual ? `url(#luz-${id})` : undefined}
              />
            );
          })}
          {dados.map((d, i) => {
            const q = prog(t, d.em - 0.05, 0.4);
            const y = yLeg0 + linhaH * (i + 0.5);
            return <rect key={i} x={xLeg} y={y - 14} width={28} height={28} rx={4} fill={q > 0 ? CORES_PIZZA[i % CORES_PIZZA.length] : "none"} stroke={cor.esbocoTraco} strokeWidth={2} opacity={0.3 + 0.7 * q} />;
          })}
        </svg>
        {dados.map((d, i) => {
          const q = prog(t, d.em - 0.05, 0.4);
          const y = yLeg0 + linhaH * (i + 0.5);
          const conta = prog(t, d.em - 0.05, 0.8);
          const valor = valorComUnidade(d.valor * conta, casas, m.unidade);
          const rot = diagramar(d.rotulo, wLeg - 50 - medir(valorComUnidade(d.valor, casas, m.unidade), 40, "mono") - 16, 40, 34, 2, "sans600");
          return (
            <div key={i} style={{ position: "absolute", left: xLeg + 46, top: y - linhaH / 2, width: wLeg - 46, height: linhaH, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, opacity: 0.25 + 0.75 * q }}>
              <div style={{ ...estiloTitulo, fontWeight: 600, fontSize: rot.tamanho, lineHeight: 1.08 }}>
                {rot.linhas.map((l, k) => (
                  <div key={k}>{l}</div>
                ))}
              </div>
              <div style={{ ...marcacao, fontSize: 40, color: i === atual ? cor.ciano : cor.texto, letterSpacing: 0 }}>{q > 0 ? valor : ""}</div>
            </div>
          );
        })}
        {etiquetas}
      </>
    );
  }

  // barras ou linha: uma fatia por dado
  const fatia = plotW / dados.length;
  const xDe = (i: number) => esquerda + fatia * (i + 0.5);
  const yDe = (valor: number) => baseY - (Math.max(0, valor) / max) * (plotH - 70);
  const rotulos = dados.map((d) => diagramar(d.rotulo, fatia - 14, 40, 34, 2, "sans600"));
  const tamRot = Math.min(...rotulos.map((r) => r.tamanho));
  const barraW = Math.min(132, fatia * 0.56);
  const pts = dados.map((d, i) => ({ x: xDe(i), y: yDe(d.valor) }));
  const ultimo = atual >= 0 ? dados[atual] : null;
  const subida = ultimo ? prog(t, ultimo.em - 0.05, 0.7) : 0;
  const yMedida = ultimo ? (m.forma === "barras" ? baseY - (baseY - yDe(ultimo.valor)) * subida : pts[atual].y) : 0;
  return (
    <>
      <svg width={largura} height={altura} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Brilho id={id} largura={largura} altura={altura} />
        <Eixos esquerda={esquerda} direita={direita} topo={topo} baseY={baseY} />
        {ultimo && subida > 0.98 ? <line x1={esquerda} y1={yMedida} x2={xDe(atual) - (m.forma === "barras" ? barraW / 2 : 0)} y2={yMedida} stroke={cor.ciano} strokeWidth={2.5} strokeDasharray="10 9" opacity={0.85} /> : null}
        {m.forma === "barras"
          ? dados.map((d, i) => {
              const q = prog(t, d.em - 0.05, 0.7);
              const x = xDe(i) - barraW / 2;
              if (q <= 0) {
                return <rect key={i} x={x} y={baseY - plotH * 0.3} width={barraW} height={plotH * 0.3} rx={8} fill="none" stroke={cor.esbocoTraco} strokeWidth={2.5} strokeDasharray="8 8" />;
              }
              const h = (baseY - yDe(d.valor)) * q;
              return <rect key={i} x={x} y={baseY - h} width={barraW} height={Math.max(2, h)} rx={8} fill="rgba(228,244,251,0.12)" stroke={i === atual ? cor.ciano : cor.osso} strokeWidth={4} filter={`url(#luz-${id})`} />;
            })
          : (
            <g>
              <path d={pts.map((q, k) => `${k ? "L" : "M"} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" ")} fill="none" stroke={cor.esbocoTraco} strokeWidth={3} strokeDasharray="8 10" />
              {pts.map((q, i) => {
                if (i === 0) return null;
                const s = prog(t, dados[i].em - 0.05, 0.5);
                if (s <= 0) return null;
                const a = pts[i - 1];
                return <line key={i} x1={a.x} y1={a.y} x2={a.x + (q.x - a.x) * s} y2={a.y + (q.y - a.y) * s} stroke={cor.osso} strokeWidth={5} strokeLinecap="round" filter={`url(#luz-${id})`} />;
              })}
              {pts.map((q, i) => {
                const s = prog(t, dados[i].em - 0.05, 0.35);
                return s > 0 ? <circle key={`p${i}`} cx={q.x} cy={q.y} r={11} fill={i === atual ? cor.ciano : cor.osso} opacity={s} filter={`url(#luz-${id})`} /> : <circle key={`p${i}`} cx={q.x} cy={q.y} r={9} fill="none" stroke={cor.esbocoTraco} strokeWidth={2.5} />;
              })}
            </g>
          )}
      </svg>
      {dados.map((d, i) => {
        const q = prog(t, d.em - 0.05, 0.4);
        const conta = prog(t, d.em - 0.05, 0.75);
        const yTopo = m.forma === "barras" ? baseY - (baseY - yDe(d.valor)) * prog(t, d.em - 0.05, 0.7) : pts[i].y;
        return (
          <div key={i}>
            {q > 0 ? (
              <div style={{ position: "absolute", left: xDe(i) - fatia / 2, width: fatia, top: yTopo - 64, textAlign: "center", ...marcacao, fontSize: 40, letterSpacing: 0, color: i === atual ? cor.ciano : cor.texto, opacity: q }}>
                {valorComUnidade(d.valor * conta, casas, m.unidade)}
              </div>
            ) : null}
            <div style={{ position: "absolute", left: xDe(i) - fatia / 2 + 7, width: fatia - 14, top: baseY + 20, textAlign: "center", ...estiloTitulo, fontWeight: 600, fontSize: tamRot, lineHeight: 1.08, opacity: 0.25 + 0.75 * q }}>
              {rotulos[i].linhas.map((l, k) => (
                <div key={k}>{l}</div>
              ))}
            </div>
          </div>
        );
      })}
      {etiquetas}
    </>
  );
};

const Eixos: React.FC<{ esquerda: number; direita: number; topo: number; baseY: number }> = ({ esquerda, direita, topo, baseY }) => (
  <g>
    <line x1={esquerda} y1={topo - 10} x2={esquerda} y2={baseY} stroke={cor.objeto} strokeWidth={2.5} />
    <line x1={esquerda} y1={baseY} x2={direita} y2={baseY} stroke={cor.ciano} strokeWidth={3} strokeDasharray="14 10" opacity={0.75} />
    {Array.from({ length: 6 }, (_, k) => {
      const y = baseY - ((baseY - topo) * (k + 1)) / 6;
      return <line key={k} x1={esquerda - 12} y1={y} x2={esquerda} y2={y} stroke={cor.objeto} strokeWidth={2.5} />;
    })}
  </g>
);
