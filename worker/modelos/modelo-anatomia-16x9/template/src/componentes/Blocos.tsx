// Os 11 blocos universais na linguagem do Anatomia: tudo na prancha clínica (papel branco-
// azulado, traço fino de tinta, um azul clínico), com as peças da assinatura: régua de medida,
// rótulos de prancha com linha-guia, retícula, nervo com pulso de luz, mostrador, curva do efeito.
// A pessoa continua na moldura da direita. Cada item entra na palavra; nada fica parado.
// No quadro deitado (16:9) a prancha é o quadro da esquerda: os blocos usam a grade do vertical
// (1080 de largura, até `fundo`) e o Edicao.tsx a amplia para lá (tema.ts, PRANCHA_NA_TELA).
import { Falado, Rise, saida, temposDoTexto } from "../anim";
import { encaixar, encaixarBloco, formatarNumero, larguraTexto, trechoNoTexto } from "../medida";
import type { Abertura, Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Numero, Palavra, Passos, Pergunta, Topicos } from "../plano";
import { clamp01, EASE_INOUT, EASE_OUT, FONT, K, keys, lerp, prog } from "../tema";
import { Reticula, Selo } from "./Pecas";

type P = { t: number; palavras: Palavra[]; fundo: number };

// título pequeno de prancha (caixa alta, espaçado)
const Titulo: React.FC<{ texto?: string; t: number; em: number; y?: number }> = ({ texto, t, em, y = 140 }) => {
  if (!texto) return null;
  const fit = encaixar(texto.toUpperCase(), { largura: 900, max: 34, min: 26, linhas: 1, fonte: { peso: 600, espacamento: 0.06 } });
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: y, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: fit.tamanho, letterSpacing: "0.06em", color: K.slate, whiteSpace: "nowrap" }}>
      <Rise t={t} at={em}>{fit.linhas[0]}</Rise>
    </div>
  );
};

// régua clínica: traço com marcas que se desenha; um ponto de leitura corre devagar por ela
const Regua: React.FC<{ t: number; de: number; x0: number; x1: number; y: number }> = ({ t, de, x0, x1, y }) => {
  const d = prog(t, de, de + 0.6, EASE_INOUT);
  const xe = lerp(x0, x1, d);
  const marcas: string[] = [];
  for (let x = x0, i = 0; x <= xe; x += 24, i++) marcas.push(`M${x} ${y} L${x} ${y + (i % 5 === 0 ? 16 : 8)}`);
  const leitura = x0 + ((((t - de) * 90) % (x1 - x0)) + (x1 - x0)) % (x1 - x0);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <path d={`M${x0} ${y} L${xe} ${y}`} stroke={K.ink} strokeWidth={2} strokeLinecap="round" />
      <path d={marcas.join("")} stroke={K.ink} strokeWidth={1.4} opacity={0.55} />
      {d >= 1 ? <circle cx={leitura} cy={y} r={6} fill={K.acc} stroke="#fff" strokeWidth={2} /> : null}
    </svg>
  );
};

// ——— abertura: régua + título palavra por palavra ———
export const BlocoAbertura: React.FC<P & { m: Abertura }> = ({ m, t, palavras, fundo }) => {
  const em = m.em ?? m.de;
  const fit = encaixarBloco(m.texto, { largura: 880, altura: fundo - 330, max: 116, min: 50, maxLinhas: 4, entrelinha: 1.1, fonte: { peso: 700 } });
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, em);
  const alto = fit.linhas.length * fit.tamanho * 1.1;
  const yTexto = Math.max(250, 250 + (fundo - 330 - alto) / 2);
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, ...saida(t, m.ate) }}>
      <Regua t={t} de={m.de} x0={100} x1={980} y={196} />
      <Mira t={t} de={m.de} x={980} y={150} />
      <div style={{ position: "absolute", left: 100, top: yTexto }}>
        <Falado linhas={fit.linhas} tempos={tempos} t={t} tamanho={fit.tamanho} entrelinha={1.1} enfase={trechoNoTexto(m.texto, m.destaque)} />
      </div>
    </div>
  );
};
// mira clínica (cruz fina num círculo), girando devagar
const Mira: React.FC<{ t: number; de: number; x: number; y: number }> = ({ t, de, x, y }) => {
  const d = prog(t, de + 0.15, de + 0.7, EASE_INOUT);
  const r = 22;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g transform={`rotate(${(t - de) * 18} ${x} ${y})`} opacity={d}>
        <circle cx={x} cy={y} r={r} fill="none" stroke={K.acc} strokeWidth={2.2} pathLength={1} strokeDasharray={`${d} 1`} />
        <path d={`M${x - r - 10} ${y} L${x - r + 8} ${y} M${x + r - 8} ${y} L${x + r + 10} ${y} M${x} ${y - r - 10} L${x} ${y - r + 8} M${x} ${y + r - 8} L${x} ${y + r + 10}`} stroke={K.acc} strokeWidth={2.2} strokeLinecap="round" />
      </g>
    </svg>
  );
};

// layout vertical de itens (tópicos e passos): onde cada um fica
const pilha = (n: number, comTitulo: boolean, fundo: number) => {
  const y0 = comTitulo ? 220 : 160;
  const y1 = fundo - 50;
  const passo = (y1 - y0) / n;
  return { y0, passo, centro: (i: number) => y0 + passo * (i + 0.5) };
};

// ——— tópicos: rótulos de prancha num eixo; a retícula anda até o item dito ———
export const BlocoTopicos: React.FC<P & { m: Topicos }> = ({ m, t, fundo }) => {
  const itens = m.itens.slice(0, 5);
  const L = pilha(itens.length, !!m.titulo, fundo);
  const tamanhoMax = Math.min(58, L.passo * 0.42);
  let atual = 0;
  itens.forEach((it, i) => {
    if (t >= it.em - 0.1) atual = i;
  });
  const yRet = keys(t, itens.map((it, i) => [it.em, L.centro(i)] as [number, number]), EASE_INOUT);
  const primeiro = itens[0]?.em ?? m.de;
  const eixo = prog(t, m.de, primeiro + 0.3, EASE_INOUT);
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, ...saida(t, m.ate) }}>
      <Titulo texto={m.titulo} t={t} em={m.de + 0.05} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={`M112 ${L.centro(0) - 30} L112 ${lerp(L.centro(0) - 30, L.centro(itens.length - 1) + 30, eixo)}`} stroke={K.line} strokeWidth={2} strokeDasharray="3 7" />
        {itens.map((it, i) => {
          const p = prog(t, it.em - 0.08, it.em + 0.3, EASE_OUT);
          const pl = prog(t, it.em - 0.02, it.em + 0.4, EASE_INOUT);
          const y = L.centro(i);
          return (
            <g key={i}>
              <path d={`M112 ${y} L${112 + 40 * pl} ${y}`} stroke={K.ink} strokeWidth={1.8} opacity={0.7} />
              <circle cx={112} cy={y} r={13 * p} fill={K.acc} opacity={0.18} />
              <circle cx={112} cy={y} r={7 * p} fill={i === atual ? K.acc : K.ink2} stroke="#fff" strokeWidth={2.5} />
            </g>
          );
        })}
        {t >= primeiro - 0.1 ? <ellipse cx={112} cy={yRet} rx={26} ry={26} fill="none" stroke={K.acc} strokeWidth={2.4} opacity={prog(t, primeiro - 0.1, primeiro + 0.3)} /> : null}
      </svg>
      {itens.map((it, i) => {
        const fit = encaixar(it.texto, { largura: 830, max: tamanhoMax, min: 32, linhas: 2, fonte: { peso: 650 } });
        const det = it.detalhe ? encaixar(it.detalhe, { largura: 830, max: 30, min: 24, linhas: 1, fonte: { peso: 500 } }) : null;
        const h = fit.linhas.length * fit.tamanho * 1.12 + (det ? det.tamanho * 1.3 : 0);
        return (
          <div key={i} style={{ position: "absolute", left: 172, top: L.centro(i) - h / 2, width: 830, opacity: i === atual || t < it.em ? 1 : 0.62 + 0.38 * (1 - prog(t, it.em + 0.8, it.em + 1.2)) }}>
            <div style={{ fontWeight: 650, fontSize: fit.tamanho, lineHeight: 1.12, color: K.ink, letterSpacing: "-0.01em" }}>
              {fit.linhas.map((l, j) => (
                <div key={j} style={{ whiteSpace: "nowrap" }}>
                  <Rise t={t} at={it.em + j * 0.08}>{l}</Rise>
                </div>
              ))}
            </div>
            {det ? (
              <div style={{ fontWeight: 500, fontSize: det.tamanho, color: K.ink2, marginTop: 4, whiteSpace: "nowrap" }}>
                <Rise t={t} at={it.em + 0.35}>{det.linhas[0]}</Rise>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

// ——— passos: nós numerados ligados por um nervo; o pulso de luz corre até o passo dito ———
export const BlocoPassos: React.FC<P & { m: Passos }> = ({ m, t, fundo }) => {
  const itens = m.itens.slice(0, 5);
  const L = pilha(itens.length, !!m.titulo, fundo);
  const tamanhoMax = Math.min(56, L.passo * 0.4);
  const X = 124;
  const R = Math.min(30, L.passo * 0.3);
  // até onde o nervo já se desenhou
  const yNervo = keys(t, [[m.de, L.centro(0) - R], ...itens.map((it, i) => [it.em + 0.3, L.centro(i)] as [number, number])], EASE_INOUT);
  let ativo = -1;
  let pulso: { y: number; a: number } | null = null;
  itens.forEach((it, i) => {
    if (t >= it.em - 0.1) ativo = i;
    const p = prog(t, it.em - 0.15, it.em + 0.3, EASE_INOUT);
    if (p > 0 && p < 1) pulso = { y: lerp(i ? L.centro(i - 1) : L.centro(0) - 60, L.centro(i), p), a: 1 };
  });
  const pul = pulso as { y: number; a: number } | null;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, ...saida(t, m.ate) }}>
      <Titulo texto={m.titulo} t={t} em={m.de + 0.05} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <radialGradient id="ps-pulso">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.35" stopColor={K.accHi} stopOpacity={0.9} />
            <stop offset="1" stopColor={K.acc} stopOpacity={0} />
          </radialGradient>
        </defs>
        <path d={`M${X} ${L.centro(0) - R} L${X} ${L.centro(itens.length - 1)}`} stroke={K.line} strokeWidth={2} strokeDasharray="3 7" />
        <path d={`M${X} ${L.centro(0) - R} L${X} ${yNervo}`} stroke={K.acc} strokeWidth={4} strokeLinecap="round" />
        {itens.map((it, i) => {
          const p = prog(t, it.em - 0.1, it.em + 0.3, EASE_OUT);
          const y = L.centro(i);
          return (
            <g key={i}>
              <circle cx={X} cy={y} r={R} fill="#fff" stroke={p > 0 ? K.acc : K.line} strokeWidth={2.4} />
              <circle cx={X} cy={y} r={R} fill={K.acc} opacity={i === ativo ? 0.12 : 0} />
              <text x={X} y={y + R * 0.32} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={R * 0.9} fill={p > 0 ? K.acc : K.slate}>
                {String(i + 1).padStart(2, "0")}
              </text>
            </g>
          );
        })}
        {pul ? <circle cx={X} cy={pul.y} r={22} fill="url(#ps-pulso)" /> : null}
        {ativo >= 0 ? <circle cx={X} cy={L.centro(ativo)} r={R + 8 + 3 * Math.sin(t * 4)} fill="none" stroke={K.acc} strokeWidth={1.6} opacity={0.5} /> : null}
      </svg>
      {itens.map((it, i) => {
        const fit = encaixar(it.texto, { largura: 820, max: tamanhoMax, min: 32, linhas: 2, fonte: { peso: 650 } });
        const det = it.detalhe ? encaixar(it.detalhe, { largura: 820, max: 30, min: 24, linhas: 1, fonte: { peso: 500 } }) : null;
        const h = fit.linhas.length * fit.tamanho * 1.12 + (det ? det.tamanho * 1.3 : 0);
        return (
          <div key={i} style={{ position: "absolute", left: 184, top: L.centro(i) - h / 2, width: 820, opacity: i === ativo || t < it.em ? 1 : 0.7 }}>
            <div style={{ fontWeight: 650, fontSize: fit.tamanho, lineHeight: 1.12, color: K.ink, letterSpacing: "-0.01em" }}>
              {fit.linhas.map((l, j) => (
                <div key={j} style={{ whiteSpace: "nowrap" }}>
                  <Rise t={t} at={it.em + j * 0.08}>{l}</Rise>
                </div>
              ))}
            </div>
            {det ? (
              <div style={{ fontWeight: 500, fontSize: det.tamanho, color: K.ink2, marginTop: 4, whiteSpace: "nowrap" }}>
                <Rise t={t} at={it.em + 0.35}>{det.linhas[0]}</Rise>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

// ——— número: mostrador clínico (arco com marcas) e o número contando dentro ———
export const BlocoNumero: React.FC<P & { m: Numero }> = ({ m, t, fundo }) => {
  const cx = 540;
  const cy = Math.min(450, fundo - 360);
  const r = 230;
  const a0 = (150 * Math.PI) / 180;
  const a1 = (390 * Math.PI) / 180;
  const p = prog(t, m.em - 0.05, m.em + 1.1, EASE_OUT);
  const arco = prog(t, m.de, m.de + 0.5, EASE_INOUT);
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
  const v = m.valor * p;
  const texto = `${m.prefixo ?? ""}${formatarNumero(casas ? v : Math.round(v), casas)}${m.sufixo ?? ""}`;
  const final = `${m.prefixo ?? ""}${formatarNumero(m.valor, casas)}${m.sufixo ?? ""}`;
  const fit = encaixar(final.replace(/\s+/g, "\u00a0"), { largura: 520, max: 170, min: 56, linhas: 1, fonte: { peso: 700 } });
  const pt = (a: number, rr: number) => `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`;
  const enche = 0.8 * p;
  const aE = a0 + (a1 - a0) * enche;
  const marcas: string[] = [];
  for (let k = 0; k <= 20; k++) {
    const a = a0 + ((a1 - a0) * k) / 20;
    if (k / 20 > arco) break;
    marcas.push(`M${pt(a, r + 14)} L${pt(a, r + (k % 5 === 0 ? 32 : 24))}`);
  }
  const rot = encaixar(m.rotulo, { largura: 860, max: 44, min: 30, linhas: 2, fonte: { peso: 650 } });
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, ...saida(t, m.ate) }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {arco > 0.001 ? <path d={`M${pt(a0, r)} A${r} ${r} 0 ${(a1 - a0) * arco > Math.PI ? 1 : 0} 1 ${pt(a0 + (a1 - a0) * arco, r)}`} fill="none" stroke={K.line} strokeWidth={2} /> : null}
        <path d={marcas.join("")} stroke={K.ink} strokeWidth={1.6} opacity={0.6} />
        {enche > 0.001 ? <path d={`M${pt(a0, r)} A${r} ${r} 0 ${aE - a0 > Math.PI ? 1 : 0} 1 ${pt(aE, r)}`} fill="none" stroke={K.acc} strokeWidth={7} strokeLinecap="round" /> : null}
        {p > 0 ? <circle cx={cx + Math.cos(aE + 0.02 * Math.sin(t * 3)) * r} cy={cy + Math.sin(aE + 0.02 * Math.sin(t * 3)) * r} r={11} fill="#fff" stroke={K.acc} strokeWidth={4} /> : null}
      </svg>
      <div style={{ position: "absolute", left: cx - 300, width: 600, top: cy - fit.tamanho * 0.62, textAlign: "center", fontWeight: 700, fontSize: fit.tamanho, color: K.acc, letterSpacing: "-0.04em", lineHeight: 1.1, opacity: prog(t, m.em - 0.1, m.em + 0.2), whiteSpace: "nowrap" }}>{texto}</div>
      <div style={{ position: "absolute", left: 110, width: 860, top: cy + r * 0.62, textAlign: "center", fontWeight: 650, fontSize: rot.tamanho, lineHeight: 1.15, color: K.ink }}>
        {rot.linhas.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            <Rise t={t} at={(m.rotuloEm ?? m.em + 0.3) + i * 0.08}>{l}</Rise>
          </div>
        ))}
      </div>
      {m.ilustrativo ? <Selo a={prog(t, m.em, m.em + 0.4)} x={64} y={fundo - 74} texto="ilustrativo" /> : null}
    </div>
  );
};

// ——— comparação: duas pranchas lado a lado; o lado certo ganha o anel azul ———
export const BlocoComparacao: React.FC<P & { m: Comparacao }> = ({ m, t, palavras, fundo }) => {
  const y0 = m.titulo ? 210 : 150;
  const y1 = fundo - 44;
  const venc = m.vencedor;
  const vEm = m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.8;
  const pv = venc !== undefined ? prog(t, vEm - 0.05, vEm + 0.35, EASE_OUT) : 0;
  const modo = m.modo ?? "contra";
  const simbolo = modo === "antes-depois" ? "→" : modo === "contra" ? "≠" : "";
  // as duas pranchas com a mesma altura, do tamanho do texto, no meio da área
  const fits = m.lados.map((lado) => encaixarBloco(lado.texto, { largura: 460 - 64, altura: y1 - y0 - 150, max: 54, min: 30, maxLinhas: 5, entrelinha: 1.14, fonte: { peso: 650 } }));
  const hTexto = Math.max(...fits.map((f) => f.linhas.length * f.tamanho * 1.14));
  const hPrancha = Math.min(y1 - y0, Math.max(300, 110 + hTexto + 64));
  const yP = y0 + (y1 - y0 - hPrancha) / 2;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, ...saida(t, m.ate) }}>
      <Titulo texto={m.titulo} t={t} em={m.de + 0.05} />
      {m.lados.map((lado, i) => {
        const x = i === 0 ? 64 : 556;
        const w = 460;
        const entra = prog(t, lado.em - 0.15, lado.em + 0.3, EASE_OUT);
        const ganhou = venc === i;
        const perdeu = venc !== undefined && venc !== i;
        const fit = fits[i];
        const tempos = temposDoTexto(lado.texto, palavras, lado.em - 0.1, Math.max(lado.em + 2.5, m.ate), lado.em);
        const errado = modo === "errado-certo" && perdeu;
        const rot = encaixar(lado.rotulo.toUpperCase(), { largura: w - 64, max: 30, min: 22, linhas: 1, fonte: { peso: 600, espacamento: 0.06 } });
        return (
          <div key={i} style={{ position: "absolute", left: x, top: yP, width: w, height: hPrancha, opacity: entra * (perdeu ? lerp(1, 0.55, pv) : 1), transform: `translateY(${(1 - entra) * 24}px)` }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: "rgba(255,255,255,0.92)", boxShadow: `inset 0 0 0 ${lerp(1.5, ganhou ? 3.5 : 1.5, pv)}px ${ganhou && pv > 0 ? K.acc : K.line}, 0 14px 34px rgba(19,32,47,0.08)` }} />
            <div style={{ position: "absolute", left: 32, top: 30, fontWeight: 600, fontSize: rot.tamanho, letterSpacing: "0.06em", color: ganhou && pv > 0.5 ? K.acc : K.slate, whiteSpace: "nowrap" }}>{rot.linhas[0]}</div>
            <div style={{ position: "absolute", left: 32, right: 32, top: 82, height: 1.5, background: K.line }} />
            <div style={{ position: "absolute", left: 32, top: 110 }}>
              <Falado linhas={fit.linhas} tempos={tempos} t={t} tamanho={fit.tamanho} peso={650} entrelinha={1.14} risco={errado ? [0, lado.texto.split(/\s+/).length - 1] : null} riscoEm={vEm} />
            </div>
            {ganhou && pv > 0 ? (
              <svg width={72} height={72} style={{ position: "absolute", right: 22, top: 14 }} viewBox="0 0 72 72">
                <circle cx={36} cy={36} r={26} fill="#fff" stroke={K.acc} strokeWidth={3} pathLength={1} strokeDasharray={`${pv} 1`} />
                <path d="M24 37 L33 46 L49 28" fill="none" stroke={K.acc} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - prog(t, vEm + 0.15, vEm + 0.45)} />
              </svg>
            ) : null}
            {errado && pv > 0 ? (
              <svg width={72} height={72} style={{ position: "absolute", right: 22, top: 14 }} viewBox="0 0 72 72">
                <circle cx={36} cy={36} r={26} fill="#fff" stroke={K.alerta} strokeWidth={3} pathLength={1} strokeDasharray={`${pv} 1`} />
                <path d="M27 27 L45 45 M45 27 L27 45" stroke={K.alerta} strokeWidth={4.5} strokeLinecap="round" opacity={pv} />
              </svg>
            ) : null}
          </div>
        );
      })}
      {simbolo ? (
        <div style={{ position: "absolute", left: 540 - 34, top: yP + hPrancha / 2 - 34, width: 68, height: 68, borderRadius: 34, background: "#fff", boxShadow: `inset 0 0 0 2px ${K.acc}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 40, color: K.acc, opacity: prog(t, m.lados[1].em - 0.2, m.lados[1].em + 0.2), transform: `rotate(${simbolo === "≠" ? 0 : 0}deg) scale(${0.9 + 0.1 * Math.sin(t * 2.2)})` }}>
          {simbolo}
        </div>
      ) : null}
    </div>
  );
};

// ——— gráfico: barras de traço fino, curva do efeito ou anel; sem números, a tendência ilustrativa ———
export const BlocoGrafico: React.FC<P & { m: Grafico }> = ({ m, t, fundo }) => {
  const dados = (m.dados ?? []).slice(0, 6);
  const x0 = 112;
  const x1 = 968;
  const base = fundo - 120;
  const topo = m.titulo ? 290 : 230;
  const un = m.unidade ?? "";
  const fmt = (v: number) => `${formatarNumero(v, Number.isInteger(v) ? 0 : 1)}${un}`;
  const ilustr = !dados.length || m.ilustrativo;
  const eixo = prog(t, m.de, m.de + 0.5, EASE_INOUT);
  let corpo: React.ReactNode = null;
  if (!dados.length || m.forma === "linha") {
    // curva: pelos dados ditos ou pela tendência
    const n = dados.length;
    const max = n ? Math.max(...dados.map((d) => d.valor)) || 1 : 1;
    const min = n ? Math.min(0, ...dados.map((d) => d.valor)) : 0;
    const forma = (u: number) => (m.tendencia === "cai" ? 0.9 - 0.75 * u * u * (3 - 2 * u) : m.tendencia === "oscila" ? 0.5 + 0.28 * Math.sin(u * Math.PI * 3.2) : 0.12 + 0.78 * u * u * (3 - 2 * u));
    const pontos = n ? dados.map((d, i) => ({ x: lerp(x0 + 40, x1 - 40, n === 1 ? 0.5 : i / (n - 1)), y: base - ((d.valor - min) / (max - min || 1)) * (base - topo - 40), em: d.em, d })) : [];
    const ks: Array<[number, number]> = n ? [[m.de + 0.1, pontos[0].x], ...pontos.map((p) => [p.em + 0.3, p.x] as [number, number])] : [[m.tendenciaEm ?? m.de + 0.3, x0], [(m.tendenciaEm ?? m.de + 0.3) + 1.6, x1]];
    const xh = keys(t, ks, EASE_INOUT);
    const yAt = (x: number) => {
      if (!n) return base - forma((x - x0) / (x1 - x0)) * (base - topo);
      for (let i = 1; i < pontos.length; i++)
        if (x <= pontos[i].x) {
          const u = (x - pontos[i - 1].x) / (pontos[i].x - pontos[i - 1].x);
          const s = u * u * (3 - 2 * u);
          return lerp(pontos[i - 1].y, pontos[i].y, s);
        }
      return pontos[pontos.length - 1]?.y ?? base;
    };
    const xIni = n ? pontos[0].x : x0;
    const pts: string[] = [];
    for (let x = xIni; x <= xh; x += 4) pts.push(`${x.toFixed(1)},${yAt(x).toFixed(1)}`);
    pts.push(`${xh.toFixed(1)},${yAt(xh).toFixed(1)}`);
    const curva = `M ${pts.join(" L ")}`;
    corpo = (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <linearGradient id={`gr-area${Math.round(m.de * 10)}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={K.acc} stopOpacity={0.22} />
              <stop offset="1" stopColor={K.acc} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {[0.33, 0.66, 1].map((k, i) => (
            <path key={i} d={`M ${x0} ${base - (base - topo) * k} L ${x1} ${base - (base - topo) * k}`} stroke={K.line} strokeWidth={1} strokeDasharray="2 8" opacity={0.6} />
          ))}
          <path d={`M ${x0 - 20} ${base} L ${lerp(x0 - 20, x1 + 20, eixo)} ${base}`} stroke={K.ink} strokeWidth={2.6} strokeLinecap="round" />
          <path d={`${curva} L ${xh.toFixed(1)},${base} L ${xIni},${base} Z`} fill={`url(#gr-area${Math.round(m.de * 10)})`} />
          <path d={curva} fill="none" stroke={K.acc} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={xh} cy={yAt(xh)} r={12 + 1.5 * Math.sin(t * 4)} fill="#fff" stroke={K.acc} strokeWidth={5} />
          {pontos.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={9 * prog(t, p.em + 0.2, p.em + 0.45)} fill={K.acc} stroke="#fff" strokeWidth={3} />
          ))}
        </svg>
        {pontos.map((p, i) => (
          <div key={`v${i}`}>
            <div style={{ position: "absolute", left: p.x - 120, width: 240, top: p.y - 70, textAlign: "center", fontWeight: 700, fontSize: 38, color: K.ink, whiteSpace: "nowrap" }}>
              <Rise t={t} at={p.em + 0.2}>{fmt(p.d.valor)}</Rise>
            </div>
            <div style={{ position: "absolute", left: p.x - 110, width: 220, top: base + 18, textAlign: "center", fontWeight: 500, fontSize: encaixar(p.d.rotulo, { largura: 210, max: 28, min: 20, linhas: 1 }).tamanho, color: K.slate, whiteSpace: "nowrap" }}>
              <Rise t={t} at={p.em}>{p.d.rotulo}</Rise>
            </div>
          </div>
        ))}
      </>
    );
  } else if (m.forma === "barras") {
    const n = dados.length;
    const max = Math.max(...dados.map((d) => d.valor)) || 1;
    const passo = (x1 - x0) / n;
    const bw = Math.min(140, passo * 0.56);
    corpo = (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <linearGradient id={`gr-bar${Math.round(m.de * 10)}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={K.accHi} stopOpacity={0.55} />
              <stop offset="1" stopColor={K.acc} stopOpacity={0.12} />
            </linearGradient>
          </defs>
          <path d={`M ${x0 - 20} ${base} L ${lerp(x0 - 20, x1 + 20, eixo)} ${base}`} stroke={K.ink} strokeWidth={2.6} strokeLinecap="round" />
          {dados.map((d, i) => {
            const p = prog(t, d.em - 0.05, d.em + 0.55, EASE_OUT);
            const h = (d.valor / max) * (base - topo - 60) * p;
            const cx = x0 + passo * (i + 0.5);
            return (
              <g key={i}>
                <rect x={cx - bw / 2} y={base - h} width={bw} height={h} rx={10} fill={`url(#gr-bar${Math.round(m.de * 10)})`} stroke={K.acc} strokeWidth={2.5} />
                {Array.from({ length: Math.floor(h / 22) }, (_, k) => (
                  <path key={k} d={`M ${cx - bw / 2 + 8} ${base - 11 - k * 22} L ${cx + bw / 2 - 8} ${base - 11 - k * 22}`} stroke="#fff" strokeWidth={1.4} opacity={0.5} />
                ))}
              </g>
            );
          })}
        </svg>
        {dados.map((d, i) => {
          const p = prog(t, d.em - 0.05, d.em + 0.55, EASE_OUT);
          const h = (d.valor / max) * (base - topo - 60) * p;
          const cx = x0 + passo * (i + 0.5);
          return (
            <div key={i}>
              <div style={{ position: "absolute", left: cx - 120, width: 240, top: base - h - 58, textAlign: "center", fontWeight: 700, fontSize: encaixar(fmt(d.valor), { largura: Math.max(120, passo - 10), max: 40, min: 24, linhas: 1, fonte: { peso: 700 } }).tamanho, color: K.ink, opacity: p, whiteSpace: "nowrap" }}>{fmt(Math.round(d.valor * p * 10) / 10)}</div>
              <div style={{ position: "absolute", left: cx - passo / 2, width: passo, top: base + 16, textAlign: "center", fontWeight: 500, fontSize: encaixar(d.rotulo, { largura: passo - 12, max: 28, min: 20, linhas: 1 }).tamanho, color: K.slate, whiteSpace: "nowrap" }}>
                <Rise t={t} at={d.em}>{d.rotulo}</Rise>
              </div>
            </div>
          );
        })}
      </>
    );
  } else {
    // pizza: anel de traço fino, fatias que se desenham na palavra
    const soma = dados.reduce((a, d) => a + d.valor, 0) || 1;
    const cx = 540;
    const cy = (topo + base) / 2 + 10;
    const r = Math.min(190, (base - topo) / 2 - 20);
    let acc = -Math.PI / 2;
    const tons = [K.acc, K.accHi, "#8FB4F0", "#B9CFF5", "#6A7C92", "#3E4E62"];
    corpo = (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={K.ice} strokeWidth={54} />
          {dados.map((d, i) => {
            const frac = d.valor / soma;
            const a0 = acc;
            acc += frac * Math.PI * 2;
            const p = prog(t, d.em - 0.05, d.em + 0.5, EASE_INOUT);
            const a1 = a0 + frac * Math.PI * 2 * p;
            if (p <= 0) return null;
            const large = a1 - a0 > Math.PI ? 1 : 0;
            return <path key={i} d={`M ${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} A ${r} ${r} 0 ${large} 1 ${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r}`} fill="none" stroke={tons[i % tons.length]} strokeWidth={54} />;
          })}
          <circle cx={cx} cy={cy} r={r - 27} fill="none" stroke="#fff" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={r + 27} fill="none" stroke="#fff" strokeWidth={2} />
        </svg>
        {(() => {
          let a = -Math.PI / 2;
          return dados.map((d, i) => {
            const frac = d.valor / soma;
            const meio = a + frac * Math.PI;
            a += frac * Math.PI * 2;
            const lx = cx + Math.cos(meio) * (r + 70);
            const ly = cy + Math.sin(meio) * (r + 56);
            const direita = Math.cos(meio) >= 0;
            return (
              <div key={i} style={{ position: "absolute", ...(direita ? { left: Math.min(lx, 1016 - 230) } : { right: Math.min(1080 - lx, 1080 - 64 - 230) }), top: ly - 34, width: 230, textAlign: direita ? "left" : "right" }}>
                <div style={{ fontWeight: 700, fontSize: 36, color: K.ink, whiteSpace: "nowrap" }}>
                  <Rise t={t} at={d.em + 0.2}>{fmt(d.valor)}</Rise>
                </div>
                <div style={{ fontWeight: 500, fontSize: encaixar(d.rotulo, { largura: 230, max: 26, min: 20, linhas: 1 }).tamanho, color: K.slate, whiteSpace: "nowrap" }}>
                  <Rise t={t} at={d.em}>{d.rotulo}</Rise>
                </div>
              </div>
            );
          });
        })()}
      </>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, ...saida(t, m.ate) }}>
      <Titulo texto={m.titulo} t={t} em={m.de + 0.05} />
      {corpo}
      {ilustr ? <Selo a={prog(t, m.de + 0.4, m.de + 0.8)} x={64} y={fundo - 66} texto="ilustrativo" /> : null}
    </div>
  );
};

// ——— destaque: a palavra que bate forte, marcada pela retícula (vermelho clínico no alerta) ———
export const BlocoDestaque: React.FC<P & { m: Destaque }> = ({ m, t, palavras, fundo }) => {
  const cor = m.nivel === "alerta" ? K.alerta : K.acc;
  const fit = encaixarBloco(m.texto, { largura: 800, altura: 330, max: 120, min: 56, maxLinhas: 3, entrelinha: 1.06, fonte: { peso: 700 } });
  const alto = fit.linhas.length * fit.tamanho * 1.06;
  const largo = Math.max(...fit.linhas.map((l) => larguraTexto(l, fit.tamanho, { peso: 700 })));
  const cy = Math.min(430, (fundo + 130) / 2 - (m.detalhe ? 40 : 0));
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.em);
  const det = m.detalhe ? encaixar(m.detalhe, { largura: 860, max: 38, min: 28, linhas: 2, fonte: { peso: 500 } }) : null;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, ...saida(t, m.ate) }}>
      <Reticula t={t} cx={540} cy={cy} rx={largo / 2 + 70 + 4 * Math.sin(t * 2)} ry={alto / 2 + 64 + 3 * Math.sin(t * 2)} a={m.em} b={m.ate + 5} cor={cor} />
      <div style={{ position: "absolute", left: 0, width: 1080, top: cy - alto / 2 }}>
        <Falado linhas={fit.linhas} tempos={tempos} t={t} tamanho={fit.tamanho} entrelinha={1.06} alinhar="center" cor={m.nivel === "alerta" ? K.alerta : K.ink} />
      </div>
      {det ? (
        <div style={{ position: "absolute", left: 110, width: 860, top: cy + alto / 2 + 92, textAlign: "center", fontWeight: 500, fontSize: det.tamanho, lineHeight: 1.2, color: K.ink2 }}>
          {det.linhas.map((l, i) => (
            <div key={i} style={{ whiteSpace: "nowrap" }}>
              <Rise t={t} at={(m.detalheEm ?? m.em + 0.6) + i * 0.08}>{l}</Rise>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

// ——— definição: o termo com a lupa, a régua e o significado palavra por palavra ———
export const BlocoDefinicao: React.FC<P & { m: Definicao }> = ({ m, t, palavras, fundo }) => {
  const termo = encaixar(m.termo, { largura: 760, max: 100, min: 56, linhas: 2, fonte: { peso: 700 } });
  const altoT = termo.linhas.length * termo.tamanho * 1.08;
  const sig = encaixarBloco(m.significado, { largura: 860, altura: fundo - 200 - altoT - 120, max: 48, min: 30, maxLinhas: 5, entrelinha: 1.22, fonte: { peso: 600 } });
  const tempos = temposDoTexto(m.significado, palavras, m.significadoEm - 0.2, m.ate, m.significadoEm);
  // o bloco inteiro (termo + régua + significado) centrado na prancha
  const altoS = sig.linhas.length * sig.tamanho * 1.22;
  const yT = Math.max(170, (130 + fundo) / 2 - (altoT + 80 + altoS) / 2);
  const yR = yT + altoT + 34;
  const lupa = prog(t, m.em, m.em + 0.5, EASE_INOUT);
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, ...saida(t, m.ate) }}>
      <div style={{ position: "absolute", left: 100, top: yT, fontWeight: 700, fontSize: termo.tamanho, lineHeight: 1.08, color: K.ink, letterSpacing: "-0.02em" }}>
        {termo.linhas.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            <Rise t={t} at={m.em + i * 0.1}>{l}</Rise>
          </div>
        ))}
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <g opacity={lupa} transform={`translate(930 ${yT + 40}) rotate(${8 * Math.sin(t * 1.3)})`}>
          <circle cx={0} cy={0} r={30} fill="rgba(47,111,228,0.06)" stroke={K.acc} strokeWidth={3} pathLength={1} strokeDasharray={`${lupa} 1`} />
          <path d="M22 22 L44 44" stroke={K.acc} strokeWidth={5} strokeLinecap="round" />
        </g>
      </svg>
      <Regua t={t} de={m.em + 0.2} x0={100} x1={980} y={yR} />
      <div style={{ position: "absolute", left: 100, top: yR + 46 }}>
        <Falado linhas={sig.linhas} tempos={tempos} t={t} tamanho={sig.tamanho} peso={600} entrelinha={1.22} cor={K.ink2} />
      </div>
    </div>
  );
};

// ——— frase: aspas de traço fino, a frase palavra por palavra (azul no destaque, risco no trecho) ———
export const BlocoFrase: React.FC<P & { m: Frase }> = ({ m, t, palavras, fundo }) => {
  const em = m.em ?? m.de;
  const fit = encaixarBloco(m.texto, { largura: 860, altura: fundo - 330, max: 84, min: 44, maxLinhas: 5, entrelinha: 1.14, fonte: { peso: 650 } });
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, em);
  const alto = fit.linhas.length * fit.tamanho * 1.14;
  const y = Math.max(250, (fundo + 200) / 2 - alto / 2);
  const risco = trechoNoTexto(m.texto, m.risco);
  const riscoEm = m.riscoEm ?? (risco ? tempos[risco[1]] + 0.3 : 0);
  const asp = prog(t, m.de, m.de + 0.5, EASE_INOUT);
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, ...saida(t, m.ate) }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <text x={96} y={y + 26} fontFamily={FONT} fontWeight={700} fontSize={170} fill={K.acc} opacity={asp} transform={`translate(0 ${(1 - asp) * 16})`}>
          “
        </text>
        <path d={`M100 ${y + alto + 30} L${lerp(100, 400, prog(t, em + 0.2, em + 1.2, EASE_INOUT))} ${y + alto + 30}`} stroke={K.line} strokeWidth={2} />
      </svg>
      <div style={{ position: "absolute", left: 100, top: y }}>
        <Falado linhas={fit.linhas} tempos={tempos} t={t} tamanho={fit.tamanho} peso={650} entrelinha={1.14} enfase={trechoNoTexto(m.texto, m.destaque)} risco={risco} riscoEm={riscoEm} />
      </div>
    </div>
  );
};

// ——— pergunta: o "?" numa retícula, a pergunta e as opções em caixinhas de traço fino ———
export const BlocoPergunta: React.FC<P & { m: Pergunta }> = ({ m, t, palavras, fundo }) => {
  const em = m.em ?? m.de;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const temOp = opcoes.length > 0;
  const fit = encaixarBloco(m.texto, { largura: 860, altura: temOp ? 210 : 300, max: temOp ? 64 : 84, min: 40, maxLinhas: 3, entrelinha: 1.1, fonte: { peso: 700 } });
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, em);
  const yQ = temOp ? 200 : 230;
  const alto = fit.linhas.length * fit.tamanho * 1.1;
  const yT = yQ + 120;
  const q = prog(t, m.de, m.de + 0.5, EASE_INOUT);
  let atual = -1;
  opcoes.forEach((o, i) => {
    if (t >= o.em - 0.1) atual = i;
  });
  const yOp = yT + alto + 40;
  const hOp = Math.min(96, (fundo - 40 - yOp) / Math.max(1, opcoes.length));
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, ...saida(t, m.ate) }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={540} cy={yQ + 30} r={54} fill="rgba(47,111,228,0.06)" stroke={K.acc} strokeWidth={2.6} pathLength={1} strokeDasharray={`${q} 1`} />
        {[0, 1, 2, 3].map((k) => {
          const a = (k * Math.PI) / 2 + t * 0.4;
          return <path key={k} d={`M${540 + Math.cos(a) * 62} ${yQ + 30 + Math.sin(a) * 62} L${540 + Math.cos(a) * 78} ${yQ + 30 + Math.sin(a) * 78}`} stroke={K.acc} strokeWidth={2.4} strokeLinecap="round" opacity={q} />;
        })}
        <text x={540} y={yQ + 54} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={66} fill={K.acc} opacity={q}>
          ?
        </text>
      </svg>
      <div style={{ position: "absolute", left: 0, width: 1080, top: yT }}>
        <Falado linhas={fit.linhas} tempos={tempos} t={t} tamanho={fit.tamanho} entrelinha={1.1} alinhar="center" />
      </div>
      {opcoes.map((o, i) => {
        const p = prog(t, o.em - 0.1, o.em + 0.3, EASE_OUT);
        const fitO = encaixar(o.texto, { largura: 700, max: Math.min(46, hOp * 0.5), min: 28, linhas: 1, fonte: { peso: 600 } });
        const y = yOp + i * hOp;
        const marcado = i === atual;
        return (
          <div key={i} style={{ position: "absolute", left: 150, top: y, height: hOp, width: 800, display: "flex", alignItems: "center", gap: 26, opacity: p, transform: `translateX(${(1 - p) * -24}px)` }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, boxShadow: `inset 0 0 0 2.4px ${marcado ? K.acc : K.line}`, background: marcado ? "rgba(47,111,228,0.08)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 24, color: marcado ? K.acc : K.slate, flexShrink: 0 }}>{String.fromCharCode(65 + i)}</div>
            <div style={{ fontWeight: 600, fontSize: fitO.tamanho, color: K.ink, whiteSpace: "nowrap" }}>{fitO.linhas[0]}</div>
          </div>
        );
      })}
    </div>
  );
};

// ——— fechamento: o ícone em traço fino dentro de um anel que pulsa; a chamada palavra por palavra ———
export const BlocoCta: React.FC<P & { m: Cta }> = ({ m, t, palavras, fundo }) => {
  const em = m.em ?? m.de;
  const fit = encaixarBloco(m.texto, { largura: 880, altura: fundo - 470, max: 80, min: 44, maxLinhas: 3, entrelinha: 1.1, fonte: { peso: 700 } });
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, em);
  const cy = 300;
  const d = prog(t, m.de, m.de + 0.7, EASE_INOUT);
  const ondas = [0, 0.6].map((k) => clamp01((((t - m.de - k) % 1.2) + 1.2) % 1.2 / 1.2));
  const dash = { pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - d };
  const icone = m.icone ?? "salvar";
  const desenho =
    icone === "seguir" ? (
      <g fill="none" stroke={K.acc} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={-12} cy={-22} r={22} {...dash} />
        <path d="M-52 40 C -48 10, 24 10, 28 40" {...dash} />
        <path d="M44 -14 L44 18 M28 2 L60 2" {...dash} />
      </g>
    ) : icone === "comentar" ? (
      <g fill="none" stroke={K.acc} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M-50 -34 L50 -34 Q60 -34 60 -24 L60 22 Q60 32 50 32 L-10 32 L-34 52 L-30 32 L-50 32 Q-60 32 -60 22 L-60 -24 Q-60 -34 -50 -34 Z" {...dash} />
        <path d="M-32 -6 L32 -6 M-32 12 L12 12" {...dash} />
      </g>
    ) : icone === "link" ? (
      <g fill="none" stroke={K.acc} strokeWidth={5} strokeLinecap="round">
        <path d="M-8 12 L-26 30 Q-40 44 -54 30 Q-68 16 -54 2 L-36 -16" {...dash} />
        <path d="M8 -12 L26 -30 Q40 -44 54 -30 Q68 -16 54 -2 L36 16" {...dash} />
        <path d="M-18 18 L18 -18" {...dash} />
      </g>
    ) : (
      <g fill="none" stroke={K.acc} strokeWidth={5} strokeLinejoin="round">
        <path d="M-34 -50 L34 -50 L34 52 L0 28 L-34 52 Z" {...dash} />
      </g>
    );
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, ...saida(t, m.ate) }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {ondas.map((o, i) => (
          <circle key={i} cx={540} cy={cy} r={110 + o * 70} fill="none" stroke={K.acc} strokeWidth={2} opacity={(1 - o) * 0.45 * d} />
        ))}
        <circle cx={540} cy={cy} r={110} fill="#fff" stroke={K.acc} strokeWidth={2.6} pathLength={1} strokeDasharray={`${d} 1`} />
        <g transform={`translate(540 ${cy})`}>{desenho}</g>
      </svg>
      <div style={{ position: "absolute", left: 0, width: 1080, top: cy + 160 }}>
        <Falado linhas={fit.linhas} tempos={tempos} t={t} tamanho={fit.tamanho} entrelinha={1.1} alinhar="center" enfase={trechoNoTexto(m.texto, m.destaque)} />
      </div>
    </div>
  );
};
