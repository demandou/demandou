// Curva do esquecimento (ilustrativa): um cartão grande com o gráfico. A caneta desenha a memória
// caindo desde "hoje"; em cada revisão dita, a curva sobe de volta (com marca-texto no degrau) e passa
// a cair mais devagar. O eixo é um calendário de pontos, um por dia, que vão sendo riscados conforme
// a caneta passa. Ao lado do cartão da pessoa, o contador "dia N" acompanha a caneta.
import { caneta, Escrita, prog, temposDoTexto } from "../anim";
import { diagramar } from "../medidas";
import type { Curva as TCurva, Palavra } from "../plano";
import { cor, DIREITA_BAIXO, MARGEM, rotulo, sans, serifa, titulo as estiloTitulo } from "../tema";

export const PAINEL = { x: MARGEM, y: 700, w: DIREITA_BAIXO - MARGEM, h: 800 };
const X0 = PAINEL.x + 56;
const X1 = PAINEL.x + PAINEL.w - 56;
const Y_TOPO = PAINEL.y + 130;
const Y_BASE = PAINEL.y + 590;
const Y_PONTOS = PAINEL.y + 660;
// onde fica o último dia de revisão no eixo (o resto é a cauda: "e depois")
const FIM_DOS_DIAS = 0.86;

const forma = (s: number, alvo: number) => alvo + (1 - alvo) * ((Math.exp(-3.2 * s) - Math.exp(-3.2)) / (1 - Math.exp(-3.2)));

export const geometriaDaCurva = (m: TCurva) => {
  const revisoes = [...m.revisoes].sort((a, b) => a.dia - b.dia);
  const nos = [0, ...revisoes.map((r) => r.dia)];
  const n = revisoes.length;
  const uDoNo = (k: number) => (n === 0 ? 0 : (FIM_DOS_DIAS * k) / n);
  const uDoDia = (d: number) => {
    for (let k = 0; k < nos.length - 1; k++) {
      if (d <= nos[k + 1]) return uDoNo(k) + ((d - nos[k]) / Math.max(1e-6, nos[k + 1] - nos[k])) * (uDoNo(k + 1) - uDoNo(k));
    }
    return uDoNo(nos.length - 1);
  };
  // quanto a memória cai em cada trecho (cada vez menos): só a forma importa, sem números
  const alvos = revisoes.map((_, k) => 0.34 + (n > 1 ? (0.42 * k) / (n - 1) : 0));
  const x = (u: number) => X0 + u * (X1 - X0);
  const y = (v: number) => Y_BASE - v * (Y_BASE - Y_TOPO);
  return { revisoes, nos, n, uDoNo, uDoDia, alvos, x, y };
};

export const Curva: React.FC<{ m: TCurva; palavras: Palavra[]; t: number }> = ({ m, palavras, t }) => {
  const g = geometriaDaCurva(m);
  const { revisoes, nos, n, uDoNo, uDoDia, alvos, x, y } = g;
  const SUBIDA = 0.2;
  // trechos no tempo: [quando começa a cair, quando chega no próximo nó]
  const trechos = nos.map((_, k) => {
    const comeca = k === 0 ? m.estudoEm + 0.35 : revisoes[k - 1].em + SUBIDA;
    const termina = k < n ? revisoes[k].em : comeca + 0.85;
    return { k, comeca, termina: Math.max(comeca + 0.2, termina) };
  });

  // pontos da curva já desenhados (tinta) e a posição da caneta
  const pontos: [number, number][] = [[x(0), y(1)]];
  let uCaneta = 0;
  let vCaneta = 1;
  for (const tr of trechos) {
    const k = tr.k;
    const u0 = uDoNo(k);
    const u1 = k < n ? uDoNo(k + 1) : 1;
    const alvo = k < n ? alvos[k] : 0.9;
    const p = prog(t, tr.comeca, tr.termina - tr.comeca, (s) => s);
    if (p <= 0) break;
    // a subida (revisão) antes deste trecho
    if (k > 0) {
      const ps = prog(t, revisoes[k - 1].em, SUBIDA, caneta);
      const vBaixo = alvos[k - 1];
      pontos.push([x(u0), y(vBaixo + (1 - vBaixo) * ps)]);
      vCaneta = vBaixo + (1 - vBaixo) * ps;
    }
    const passos = 28;
    for (let i = 1; i <= passos; i++) {
      const s = (i / passos) * p;
      pontos.push([x(u0 + s * (u1 - u0)), y(forma(s, alvo))]);
    }
    uCaneta = u0 + p * (u1 - u0);
    vCaneta = forma(p, alvo);
    if (p < 1) break;
  }
  // a última subida quando a caneta já parou no nó (antes do trecho seguinte começar)
  revisoes.forEach((r, k) => {
    const ps = prog(t, r.em, SUBIDA, caneta);
    if (ps > 0 && t < trechos[k + 1].comeca) {
      pontos.push([x(uDoNo(k + 1)), y(alvos[k] + (1 - alvos[k]) * ps)]);
      vCaneta = alvos[k] + (1 - alvos[k]) * ps;
      uCaneta = uDoNo(k + 1);
    }
  });
  const desenhando = t >= m.estudoEm;
  const caminho = pontos.map(([a, b], i) => `${i ? "L" : "M"} ${a.toFixed(1)} ${b.toFixed(1)}`).join(" ");

  // sem revisão: a queda continua, a lápis, a partir do primeiro nó
  const semRevisao = m.semRevisao !== false && n > 0;
  const pFantasma = semRevisao ? prog(t, revisoes[0].em + 0.1, 1.0, caneta) : 0;
  const fantasma = (() => {
    if (pFantasma <= 0) return "";
    const u0 = uDoNo(1);
    const v0 = alvos[0];
    const pts: string[] = [];
    for (let i = 0; i <= 40; i++) {
      const s = (i / 40) * pFantasma;
      const u = u0 + s * (1 - u0);
      pts.push(`${i ? "L" : "M"} ${x(u).toFixed(1)} ${y(0.07 + (v0 - 0.07) * Math.exp(-2.6 * s)).toFixed(1)}`);
    }
    return pts.join(" ");
  })();

  // contador de dias: o dia em que a caneta está
  const diaDaCaneta = (() => {
    for (let k = 0; k < nos.length - 1; k++) {
      const u0 = uDoNo(k);
      const u1 = uDoNo(k + 1);
      if (uCaneta <= u1 + 1e-6) return Math.round(nos[k] + ((uCaneta - u0) / Math.max(1e-6, u1 - u0)) * (nos[k + 1] - nos[k]));
    }
    return nos[nos.length - 1];
  })();
  const ultimoDia = nos[nos.length - 1];
  const temposTitulo = m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.ate) : [];
  // a frase ao lado do cartão cabe em 500 px: até 2 linhas, de 64 a 46 px
  const dTitulo = m.titulo ? diagramar(m.titulo, { largura: 496, maximo: 64, minimo: 46, linhas: 2 }) : null;
  const pPainel = prog(t, m.de - 0.4, 0.4);
  // rótulos livres: o marco zero, a unidade dos marcos ("1 dia", "7 dias"; "1 semana"…)
  const unidade = m.unidade?.trim();
  const unidades = m.unidades?.trim() ?? unidade;
  const rotuloDia = (d: number) => (d === 0 ? (m.inicio ?? "0") : unidade ? `${d} ${d === 1 ? unidade : unidades}` : `${d}`);

  return (
    <>
      {/* bloco ao lado do cartão: letreiro, "ilustrativo", frase falada e o contador de dias */}
      <div style={{ position: "absolute", left: 520, top: 178, width: 500 }}>
        {m.rotulo ? <div style={{ ...rotulo, lineHeight: 1.25 }}>{m.rotulo}</div> : null}
        <div
          style={{
            display: "inline-block",
            marginTop: 16,
            padding: "6px 18px 8px",
            borderRadius: 999,
            border: `3px solid ${cor.lapis}`,
            fontFamily: sans,
            fontWeight: 500,
            fontSize: 34,
            color: cor.tintaSuave,
            lineHeight: 1,
          }}
        >
          ilustrativo
        </div>
        {dTitulo ? (
          <div style={{ marginTop: 22 }}>
            <Escrita linhas={dTitulo.linhas} tempos={temposTitulo} t={t} estilo={estiloTitulo} tamanho={dTitulo.tamanho} />
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 8 }}>
          {unidade ? <span style={{ fontFamily: sans, fontWeight: 600, fontSize: 46, color: desenhando ? cor.tintaSuave : cor.lapis }}>{unidade}</span> : null}
          <span style={{ fontFamily: serifa, fontWeight: 800, fontSize: dTitulo && dTitulo.linhas.length > 1 ? 140 : 176, lineHeight: 0.9, color: desenhando ? cor.tinta : cor.lapisClaro, fontVariantNumeric: "tabular-nums" }}>
            {desenhando ? diaDaCaneta : 0}
          </span>
        </div>
      </div>

      {/* o cartão do gráfico */}
      <div
        style={{
          position: "absolute",
          left: PAINEL.x,
          top: PAINEL.y,
          width: PAINEL.w,
          height: PAINEL.h,
          borderRadius: 30,
          background: cor.cartao,
          boxShadow: cor.sombra,
          opacity: 0.4 + 0.6 * pPainel,
        }}
      />
      {m.eixo ? <div style={{ ...rotulo, position: "absolute", left: X0 + 150, top: PAINEL.y + 44, color: cor.tintaSuave, letterSpacing: "0.1em" }}>↑ {m.eixo}</div> : null}
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        {/* grade leve do gráfico: base e topo */}
        <line x1={X0} y1={Y_BASE} x2={X1} y2={Y_BASE} stroke={cor.lapisClaro} strokeWidth={4} strokeLinecap="round" />
        <line x1={X0} y1={Y_TOPO} x2={X1} y2={Y_TOPO} stroke={cor.lapisClaro} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />
        {/* degraus da revisão: marca-texto vertical, de baixo para cima */}
        {revisoes.map((r, k) => {
          const ps = prog(t, r.em, SUBIDA + 0.1, caneta);
          if (ps <= 0) return null;
          const xx = x(uDoNo(k + 1));
          const yb = y(alvos[k]);
          return <rect key={`d-${k}`} x={xx - 14} y={yb - (yb - y(1)) * ps} width={28} height={(yb - y(1)) * ps} rx={6} fill={cor.marca} />;
        })}
        {fantasma ? <path d={fantasma} fill="none" stroke={cor.lapis} strokeWidth={5} strokeDasharray="3 13" strokeLinecap="round" /> : null}
        {desenhando ? <path d={caminho} fill="none" stroke={cor.tinta} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {/* topo de cada revisão: um anel */}
        {revisoes.map((r, k) => {
          const ps = prog(t, r.em + 0.12, 0.2);
          if (ps <= 0) return null;
          return <circle key={`a-${k}`} cx={x(uDoNo(k + 1))} cy={y(1)} r={13 * ps} fill={cor.cartao} stroke={cor.tinta} strokeWidth={5} />;
        })}
        {desenhando ? <circle cx={x(uCaneta)} cy={y(vCaneta)} r={10} fill={cor.tinta} /> : <circle cx={x(0)} cy={y(1)} r={10} fill={cor.lapisClaro} />}
        {/* calendário de pontos: um por dia; a caneta risca os dias por onde passa */}
        {Array.from({ length: ultimoDia + 1 }, (_, d) => {
          const u = uDoDia(d);
          const passou = desenhando && uCaneta >= u - 1e-6;
          const k = nos.indexOf(d);
          if (k >= 0) return null;
          // dias muito juntos (intervalos longos) ganham pontos menores
          const vizinho = Math.abs(x(uDoDia(Math.min(ultimoDia, d + 1))) - x(u)) || 40;
          const raio = Math.max(2.6, Math.min(5.5, vizinho * 0.28));
          return <circle key={`p-${d}`} cx={x(u)} cy={Y_PONTOS} r={passou ? raio + 0.6 : raio} fill={passou ? cor.tinta : cor.lapis} />;
        })}
        {nos.map((d, k) => {
          const quando = k === 0 ? m.estudoEm : revisoes[k - 1].em;
          const p = prog(t, quando, 0.3);
          return (
            <g key={`n-${d}`}>
              <circle cx={x(uDoNo(k))} cy={Y_PONTOS} r={19} fill={cor.cartao} stroke={cor.lapis} strokeWidth={4} strokeDasharray="4 6" />
              {p > 0 ? <circle cx={x(uDoNo(k))} cy={Y_PONTOS} r={19 * (0.6 + 0.4 * p)} fill={k === 0 ? cor.tinta : cor.marca} stroke={cor.tinta} strokeWidth={5} opacity={p} /> : null}
            </g>
          );
        })}
        {/* a cauda do gráfico continua: seta */}
        {trechos[n] && t > trechos[n].comeca + 0.6 ? <path d={`M ${X1 - 18} ${y(0.9) - 14} L ${X1} ${y(0.9)} L ${X1 - 18} ${y(0.9) + 14}`} fill="none" stroke={cor.tinta} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
      {nos.map((d, k) => {
        const quando = k === 0 ? m.estudoEm : revisoes[k - 1].em;
        const feito = t >= quando;
        return (
          <div
            key={`r-${d}`}
            style={{
              position: "absolute",
              left: x(uDoNo(k)),
              top: Y_PONTOS + 36,
              translate: k === 0 ? "-28% 0" : "-50% 0",
              fontFamily: sans,
              fontWeight: feito ? 700 : 500,
              fontSize: 36,
              color: feito ? cor.tinta : cor.lapis,
              whiteSpace: "nowrap",
            }}
          >
            {rotuloDia(d)}
          </div>
        );
      })}
      {pFantasma > 0.5 && m.sem ? (
        <div style={{ position: "absolute", right: 1080 - X1, top: y(0.07) - 66, fontFamily: sans, fontWeight: 600, fontSize: 34, color: cor.lapis, opacity: prog(pFantasma, 0.5, 0.3) }}>{m.sem}</div>
      ) : null}
      {trechos[n] && t > trechos[n].comeca + 0.2 && m.com ? (
        <div style={{ position: "absolute", right: 1080 - X1, top: PAINEL.y + 40, fontFamily: sans, fontWeight: 700, fontSize: 34, color: cor.tinta, opacity: prog(t, trechos[n].comeca + 0.2, 0.3) }}>{m.com}</div>
      ) : null}
    </>
  );
};
