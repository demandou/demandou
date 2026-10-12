// As seções da folha dos blocos universais: tudo é tinta que chega quando a palavra é dita e
// marca de caneta vermelha (visto, número circulado, seta, sublinhado, risco, caixa, gráfico à mão).
import { interpolateColors } from "remotion";
import {
  acaso,
  CirculoSobre,
  caminhoSeta,
  caminhoVisto,
  entra,
  gesto,
  LinhasAMao,
  limitar,
  PalavraAMao,
  prog,
  RiscoSobre,
  SublinhadoPalavra,
  Traco,
} from "../anim";
import { alturaDe, CORPO, type LinhaFolha, type Mao, type SecaoFolha, X0 } from "../documento";
import { corpoQueCabe, ESPACO_PALAVRA, formatarNumero } from "../medida";
import type { Comparacao, Definicao, Frase, Grafico, Momento, Numero, Passos, Pergunta, Topicos } from "../plano";
import { cor, mao, sans, serifa } from "../tema";
import { LinhaNaFolha, LinhaTinta } from "./Tinta";

type P = { s: SecaoFolha; m: Momento; t: number; dy: number };

// texto à mão posicionado na folha
const MaoNaFolha: React.FC<{ mao: Mao; t: number; dy: number }> = ({ mao: m, t, dy }) => (
  <div style={{ position: "absolute", left: m.x, top: m.y + dy }}>
    <LinhasAMao linhas={m.linhas} tempos={m.tempos} t={t} tamanho={m.tamanho} alturaLinha={1.22} />
  </div>
);

const centroDaLinha = (l: LinhaFolha) => l.y + alturaDe(l.tamanho ?? CORPO) / 2;

// ——— topicos: marcador a lápis que vira um visto de caneta; passos: números à mão ligados por um traço ———
export const SecaoItens: React.FC<P> = ({ s, m, t, dy }) => {
  const r = m as Topicos | Passos;
  const itens = s.itens ?? [];
  const passos = r.tipo === "passos";
  const el: React.ReactNode[] = [];
  itens.forEach((it, k) => {
    const l0 = it.linhas[0];
    const cy = centroDaLinha(l0) + dy;
    if (passos) {
      const cx = X0 + 24;
      const p = prog(t, it.em - 0.05, 0.35, gesto);
      // o traço que liga este número ao próximo: a lápis, depois a caneta chega quando o próximo é dito
      const prox = itens[k + 1];
      if (prox) {
        const y1 = cy + 26;
        const y2 = centroDaLinha(prox.linhas[0]) + dy - 26;
        const pl = prog(t, prox.em - 0.42, 0.38, gesto);
        el.push(
          <svg key={`l${k}`} width={20} height={Math.max(1, y2 - y1)} style={{ position: "absolute", left: cx - 10, top: y1, overflow: "visible" }}>
            <line x1={10} y1={0} x2={10} y2={y2 - y1} stroke={cor.lapis} strokeWidth={3} strokeDasharray="6 8" strokeLinecap="round" />
            <Traco d={`M 10 0 L 10 ${Math.max(1, y2 - y1)}`} p={pl} largura={4.5} />
          </svg>,
        );
      }
      el.push(
        <div
          key={`n${k}`}
          style={{
            position: "absolute",
            left: cx - 24,
            top: cy - 24,
            width: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: mao,
            fontWeight: 700,
            fontSize: 34,
            lineHeight: 1,
            color: p >= 1 ? cor.vermelho : interpolateColors(p, [0, 1], [cor.lapis, cor.vermelho]),
          }}
        >
          {k + 1}
          <svg width={48} height={48} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <circle cx={24} cy={24} r={22} fill="none" stroke={cor.lapis} strokeWidth={2.5} opacity={1 - p} />
          </svg>
          <CirculoSobre em={it.em - 0.05} t={t} w={30} h={30} largura={4.5} semente={k + 5} dur={0.35} />
        </div>,
      );
    } else {
      // marcador a lápis → visto de caneta no instante do item
      const p = prog(t, it.em - 0.02, 0.26, gesto);
      el.push(
        <div key={`b${k}`} style={{ position: "absolute", left: X0 + 4, top: cy - 9, width: 10, height: 10, borderRadius: 5, background: cor.lapis, opacity: 1 - p }} />,
        <svg key={`v${k}`} width={30} height={24} style={{ position: "absolute", left: X0 - 6, top: cy - 16, overflow: "visible" }}>
          <Traco d={caminhoVisto(28, 22)} p={p} largura={5} />
        </svg>,
      );
    }
    it.linhas.forEach((l, li) =>
      el.push(
        <LinhaNaFolha key={`t${k}-${li}`} linha={l} dy={dy}>
          <LinhaTinta linha={l} t={t} />
        </LinhaNaFolha>,
      ),
    );
    if (it.detalhe) el.push(<MaoNaFolha key={`d${k}`} mao={it.detalhe} t={t} dy={dy} />);
  });
  return <>{el}</>;
};

// ——— definicao: o termo em tinta, sublinhado; uma seta de caneta e o significado à mão ———
export const SecaoDefinicao: React.FC<P> = ({ s, m, t, dy }) => {
  const r = m as Definicao;
  const termo = s.termo ?? [];
  const sig = s.significado;
  const ultima = termo[termo.length - 1];
  const el: React.ReactNode[] = termo.map((l, li) => (
    <LinhaNaFolha key={`t${li}`} linha={l} dy={dy}>
      <LinhaTinta linha={l} t={t} />
    </LinhaNaFolha>
  ));
  if (ultima) {
    const tam = ultima.tamanho ?? 52;
    el.push(
      <svg key="sub" width={ultima.w ?? 100} height={20} style={{ position: "absolute", left: ultima.x ?? X0, top: ultima.y + dy + respiroLinha(ultima) + tam * 1.12, overflow: "visible" }}>
        <Traco d={`M -4 6 Q ${(ultima.w ?? 100) * 0.5} 13 ${(ultima.w ?? 100) + 8} 2`} p={prog(t, r.significadoEm - 0.25, 0.3, gesto)} largura={5} />
      </svg>,
    );
  }
  if (sig) {
    const [a, b] = caminhoSeta(52, 0);
    const meio = sig.tamanho * 0.62;
    el.push(
      <svg key="seta" width={60} height={30} style={{ position: "absolute", left: X0 + 4, top: sig.y + dy + meio, overflow: "visible" }}>
        <Traco d={a} p={prog(t, r.significadoEm - 0.22, 0.2, gesto)} largura={5} />
        <Traco d={b} p={prog(t, r.significadoEm - 0.04, 0.12, gesto)} largura={5} />
      </svg>,
      <MaoNaFolha key="sig" mao={sig} t={t} dy={dy} />,
    );
  }
  return <>{el}</>;
};

const respiroLinha = (l: LinhaFolha) => Math.round((l.tamanho ?? CORPO) * 0.145);

// ——— frase: a citação ganha tinta palavra por palavra; o destaque é sublinhado e o risco riscado ———
export const SecaoFrase: React.FC<P> = ({ s, m, t, dy }) => {
  const r = m as Frase;
  const linhas = s.linhas;
  const tempos = linhas.flatMap((l) => l.tempos ?? []);
  const [d0, d1] = s.destaque ?? [-1, -2];
  const [r0, r1] = s.risco ?? [-1, -2];
  const primeira = linhas[0];
  const tam0 = primeira?.tamanho ?? 48;
  const el: React.ReactNode[] = [];
  if (primeira) {
    // aspas de caneta na margem, no começo da fala
    const p = prog(t, (tempos[0] ?? r.de) - 0.12, 0.22, gesto);
    el.push(
      <div key="aspas" style={{ position: "absolute", left: X0 - 40, top: primeira.y + dy - 6, fontFamily: mao, fontWeight: 700, fontSize: 76, lineHeight: 1, color: cor.vermelho }}>
        <span style={{ display: "inline-block", clipPath: p >= 1 ? undefined : `inset(-20% ${(1 - p) * 100}% -20% -4%)` }}>“</span>
      </div>,
    );
  }
  linhas.forEach((l, li) => {
    const n = l.texto.split(/\s+/).length;
    const ini = l.i0 ?? 0;
    const tam = l.tamanho ?? tam0;
    el.push(
      <LinhaNaFolha key={`l${li}`} linha={l} dy={dy}>
        <LinhaTinta
          linha={l}
          t={t}
          extra={(i, _w, ultima) => {
            const fimDaLinha = i === ini + n - 1;
            const gap = ESPACO_PALAVRA * tam;
            if (i >= d0 && i <= d1) {
              return <SublinhadoPalavra p={prog(t, (tempos[i] ?? 0) + 0.12, 0.2, gesto)} estender={!ultima && !fimDaLinha && i < d1 ? gap : 0} largura={5} semente={i + 3} />;
            }
            if (i >= r0 && i <= r1 && s.riscoEm !== undefined) {
              return (
                <span style={{ position: "absolute", left: 0, top: 0, width: `calc(100% + ${!fimDaLinha && i < r1 ? gap : 0}px)`, height: "100%" }}>
                  <RiscoSobre p={prog(t, s.riscoEm + (i - r0) * 0.06, 0.16, gesto)} alturaPx={tam * 1.2} largura={6} semente={i + 4} />
                </span>
              );
            }
            return null;
          }}
        />
      </LinhaNaFolha>,
    );
  });
  return <>{el}</>;
};

// ——— pergunta: a pergunta em tinta forte e as opções em caixinhas desenhadas a caneta ———
export const SecaoPergunta: React.FC<P> = ({ s, t, dy }) => {
  const el: React.ReactNode[] = s.linhas.map((l, li) => (
    <LinhaNaFolha key={`q${li}`} linha={l} dy={dy}>
      <LinhaTinta linha={l} t={t} />
    </LinhaNaFolha>
  ));
  (s.itens ?? []).forEach((it, k) => {
    const cy = centroDaLinha(it.linhas[0]) + dy;
    const p = prog(t, it.em - 0.08, 0.3, gesto);
    const lado = 30;
    el.push(
      <svg key={`c${k}`} width={lado} height={lado} style={{ position: "absolute", left: X0 + 8, top: cy - lado / 2 - 2, overflow: "visible" }}>
        <rect x={0} y={0} width={lado} height={lado} rx={3} fill="none" stroke={cor.lapis} strokeWidth={3} opacity={1 - p} />
        <Traco d={`M 1 2 L ${lado - 1} 0 L ${lado + 1} ${lado - 1} L 0 ${lado + 1} Z`} p={p} largura={4.5} />
      </svg>,
    );
    it.linhas.forEach((l, li) =>
      el.push(
        <LinhaNaFolha key={`o${k}-${li}`} linha={l} dy={dy}>
          <LinhaTinta linha={l} t={t} />
        </LinhaNaFolha>,
      ),
    );
  });
  return <>{el}</>;
};

// ——— numero: o rótulo em tinta e o número grande que conta; a caneta circula no fim ———
export const SecaoNumero: React.FC<P> = ({ s, m, t, dy }) => {
  const r = m as Numero;
  const g = s.numero;
  if (!g) return null;
  const el: React.ReactNode[] = s.linhas.map((l, li) => (
    <LinhaNaFolha key={`r${li}`} linha={l} dy={dy}>
      <LinhaTinta linha={l} t={t} />
    </LinhaNaFolha>
  ));
  const conta = prog(t, r.em, 0.95, entra);
  const chegou = t >= r.em - 0.02;
  const valor = formatarNumero(r.valor * conta, r.casas ?? 0);
  const tinta = prog(t, r.em - 0.05, 0.2);
  const corTexto = tinta >= 1 ? cor.tinta : interpolateColors(tinta, [0, 1], [cor.lapis, cor.tinta]);
  const fimConta = r.em + 0.95;
  el.push(
    <div key="n" style={{ position: "absolute", left: X0, top: g.y + dy, display: "flex", alignItems: "baseline", whiteSpace: "nowrap", color: corTexto }}>
      {g.prefixo ? (
        <span style={{ fontFamily: serifa, fontWeight: 600, fontSize: g.tamPrefixo, lineHeight: 1, marginRight: g.tamanho * 0.2 }}>{g.prefixo}</span>
      ) : null}
      <span
        style={{
          position: "relative",
          display: "inline-block",
          width: g.wNumero,
          fontFamily: serifa,
          fontWeight: 700,
          fontSize: g.tamanho,
          lineHeight: 1.04,
          fontVariantNumeric: "tabular-nums",
          // os algarismos crescem na direção do texto que acompanha (prefixo à esquerda, sufixo à direita)
          textAlign: g.sufixo && !g.prefixo ? "right" : "left",
        }}
      >
        {chegou ? (
          valor
        ) : (
          // antes de ser dito: o lugar do número riscado a lápis
          <>
            <span style={{ color: "transparent" }}>{g.final}</span>
            <span style={{ position: "absolute", left: "8%", right: "8%", top: "52%", height: 16, borderRadius: 8, background: cor.lapis }} />
          </>
        )}
        <CirculoSobre em={fimConta + 0.05} t={t} w={g.wNumero} h={g.tamanho * 0.8} largura={7} semente={9} dur={0.45} folga={0.05} dy={-g.tamanho * 0.05} />
      </span>
      {g.sufixo ? (
        <span
          style={{
            fontFamily: serifa,
            fontWeight: 600,
            fontSize: g.tamSufixo,
            lineHeight: 1,
            marginLeft: g.sufixo.trim().length <= 2 ? g.tamanho * 0.04 : g.tamanho * 0.12,
          }}
        >
          {g.sufixo}
        </span>
      ) : null}
    </div>,
  );
  if (r.ilustrativo) {
    el.push(
      <div key="il" style={{ position: "absolute", left: X0 + 4, top: g.notaY + dy, fontFamily: mao, fontWeight: 600, fontSize: 34, color: cor.vermelho }}>
        <PalavraAMao w="ilustrativo" em={fimConta + 0.3} t={t} />
      </div>,
    );
  }
  return <>{el}</>;
};

// ——— comparacao: duas colunas; o lado que perde é riscado, o que ganha leva caixa e visto ———
export const SecaoComparacao: React.FC<P> = ({ s, m, t, dy }) => {
  const r = m as Comparacao;
  const cols = s.colunas ?? [];
  if (cols.length < 2) return null;
  const modo = r.modo ?? "contra";
  const vencedor = r.vencedor ?? (modo === "errado-certo" ? 1 : undefined);
  const ultimaPalavra = (k: number) => {
    const ls = cols[k].linhas;
    const ts = ls[ls.length - 1]?.tempos ?? [];
    return ts[ts.length - 1] ?? cols[k].em;
  };
  const vEm = r.vencedorEm ?? Math.max(ultimaPalavra(0), ultimaPalavra(1)) + 0.35;
  const topo = cols[0].topo + dy;
  const base = Math.max(cols[0].base, cols[1].base) + dy;
  const xm = cols[0].x + cols[0].w + (cols[1].x - cols[0].x - cols[0].w) / 2;
  const el: React.ReactNode[] = [];
  // o fio do meio: a lápis, depois a tinta quando o segundo lado é dito
  const fio = prog(t, cols[1].em - 0.35, 0.45, gesto);
  el.push(
    <svg key="fio" width={20} height={base - topo} style={{ position: "absolute", left: xm - 10, top: topo, overflow: "visible" }}>
      <line x1={10} y1={4} x2={10} y2={base - topo - 4} stroke={cor.lapis} strokeWidth={3} />
      <Traco d={`M 10 4 L 10 ${base - topo - 4}`} p={fio} largura={3.5} cor={cor.tinta} />
    </svg>,
  );
  // a marca do meio: × (contra) ou → (antes-depois)
  const meioY = topo + (base - topo) / 2;
  if (modo === "contra") {
    const pm = prog(t, cols[1].em - 0.15, 0.2, gesto);
    el.push(
      <svg key="x" width={40} height={40} style={{ position: "absolute", left: xm - 20, top: meioY - 20, overflow: "visible" }}>
        <circle cx={20} cy={20} r={24} fill={cor.papel} opacity={pm > 0 ? 1 : 0} />
        <Traco d="M 8 8 L 32 32" p={pm} largura={5} />
        <Traco d="M 32 8 L 8 32" p={prog(t, cols[1].em - 0.02, 0.16, gesto)} largura={5} />
      </svg>,
    );
  } else if (modo === "antes-depois") {
    const [a, b] = caminhoSeta(40, 20);
    el.push(
      <svg key="seta" width={44} height={40} style={{ position: "absolute", left: xm - 22, top: meioY - 20, overflow: "visible" }}>
        <rect x={-4} y={4} width={52} height={32} fill={cor.papel} opacity={prog(t, cols[1].em - 0.2, 0.05)} />
        <Traco d={a} p={prog(t, cols[1].em - 0.2, 0.2, gesto)} largura={5} />
        <Traco d={b} p={prog(t, cols[1].em - 0.02, 0.12, gesto)} largura={5} />
      </svg>,
    );
  }
  cols.forEach((c, k) => {
    const rot = prog(t, c.em - 0.1, 0.25);
    el.push(
      <div
        key={`r${k}`}
        style={{
          position: "absolute",
          left: c.x,
          top: c.topo + dy + 4,
          fontFamily: sans,
          fontWeight: 700,
          fontSize: c.rotuloTam,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          lineHeight: 1,
          whiteSpace: "nowrap",
          color: rot >= 1 ? cor.cinza : interpolateColors(rot, [0, 1], [cor.lapis, cor.cinza]),
        }}
      >
        {c.rotulo}
      </div>,
    );
    const perde = vencedor !== undefined && k !== vencedor;
    c.linhas.forEach((l, li) =>
      el.push(
        <LinhaNaFolha key={`l${k}-${li}`} linha={l} dy={dy}>
          <LinhaTinta linha={l} t={t} risco={perde ? prog(t, vEm + li * 0.12, 0.3, gesto) : undefined} />
        </LinhaNaFolha>,
      ),
    );
    if (vencedor === k) {
      // caixa de caneta em volta do texto que ganha e um visto no canto
      const x0 = c.x - 12;
      const y0 = c.linhas[0].y + dy - 4;
      const larg = Math.max(...c.linhas.map((l) => l.w ?? 100)) + 24;
      const alt = c.linhas.length * alturaDe(c.linhas[0].tamanho ?? CORPO) + 8;
      const j = (n: number) => (acaso(n + k * 7) - 0.5) * 6;
      el.push(
        <svg key={`cx${k}`} width={larg} height={alt} style={{ position: "absolute", left: x0, top: y0, overflow: "visible" }}>
          <Traco d={`M ${j(1)} ${j(2)} L ${larg + j(3)} ${j(4)} L ${larg + j(5)} ${alt + j(6)} L ${j(7)} ${alt + j(8)} Z`} p={prog(t, vEm, 0.5, gesto)} largura={5} />
        </svg>,
        <svg key={`vi${k}`} width={44} height={34} style={{ position: "absolute", left: c.x + c.w - 40, top: c.topo + dy - 6, overflow: "visible" }}>
          <Traco d={caminhoVisto(40, 30)} p={prog(t, vEm + 0.45, 0.25, gesto)} largura={6} />
        </svg>,
      );
    }
  });
  return <>{el}</>;
};

// ——— grafico: desenhado a caneta na folha ———
const CURVAS: Record<"sobe" | "cai" | "oscila", [number, number][]> = {
  sobe: [
    [0, 0.86],
    [0.16, 0.72],
    [0.3, 0.77],
    [0.47, 0.52],
    [0.6, 0.57],
    [0.8, 0.3],
    [1, 0.1],
  ],
  cai: [
    [0, 0.12],
    [0.16, 0.28],
    [0.3, 0.22],
    [0.47, 0.5],
    [0.6, 0.45],
    [0.8, 0.72],
    [1, 0.88],
  ],
  oscila: [
    [0, 0.5],
    [0.15, 0.24],
    [0.32, 0.7],
    [0.5, 0.3],
    [0.68, 0.72],
    [0.85, 0.34],
    [1, 0.55],
  ],
};

const suave = (pts: [number, number][]) => {
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C ${mx.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
};

const tonsDaPizza = [0.92, 0.55, 0.3, 0.16, 0.08, 0.04];

export const SecaoGrafico: React.FC<P> = ({ s, m, t, dy }) => {
  const r = m as Grafico;
  const g = s.grafico;
  if (!g) return null;
  const dados = r.dados ?? [];
  const casas = (v: number) => (Number.isInteger(v) ? 0 : 1);
  const comUnidade = (v: number) => {
    const n = formatarNumero(v, casas(v));
    const u = r.unidade?.trim();
    return !u ? n : u === "%" ? `${n}%` : `${n} ${u}`;
  };
  const y = g.y + dy;
  const eixos = prog(t, r.de + 0.15, 0.45, gesto);
  const el: React.ReactNode[] = [];
  const ilustrativo = r.ilustrativo || !dados.length;

  if (g.pizza) {
    const { cx, cy: cy0, r: raio } = g.pizza;
    const cy = cy0 + dy;
    const total = dados.reduce((a, d) => a + Math.max(0, d.valor), 0) || 1;
    let a0 = -Math.PI / 2;
    const fatias: React.ReactNode[] = [];
    dados.forEach((d, k) => {
      const ang = (Math.max(0, d.valor) / total) * Math.PI * 2;
      const p = prog(t, d.em - 0.05, 0.55, entra);
      const a1 = a0 + ang * p;
      if (p > 0) {
        const grande = a1 - a0 > Math.PI ? 1 : 0;
        const x0 = cx + Math.cos(a0) * raio;
        const yy0 = cy + Math.sin(a0) * raio;
        const x1 = cx + Math.cos(a1) * raio;
        const yy1 = cy + Math.sin(a1) * raio;
        fatias.push(
          <path
            key={`f${k}`}
            d={ang * p >= Math.PI * 2 - 0.001 ? `M ${cx} ${cy - raio} A ${raio} ${raio} 0 1 1 ${cx - 0.01} ${cy - raio} Z` : `M ${cx} ${cy} L ${x0} ${yy0} A ${raio} ${raio} 0 ${grande} 1 ${x1} ${yy1} Z`}
            fill={cor.vermelho}
            fillOpacity={tonsDaPizza[k % tonsDaPizza.length]}
          />,
          <path key={`r${k}`} d={`M ${cx} ${cy} L ${x0} ${yy0}`} stroke={cor.vermelho} strokeWidth={4} strokeLinecap="round" />,
        );
      }
      a0 += ang;
    });
    el.push(
      <svg key="pizza" width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={raio} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="8 8" opacity={1 - eixos} />
        <Traco d={`M ${cx} ${cy - raio} A ${raio} ${raio} 0 1 1 ${cx - 0.01} ${cy - raio}`} p={eixos} largura={4} cor={cor.tinta} />
        {fatias}
      </svg>,
    );
    dados.forEach((d, k) => {
      const rr = g.rotulos[k];
      if (!rr) return;
      const p = prog(t, d.em - 0.05, 0.25);
      el.push(
        <div key={`lg${k}`} style={{ position: "absolute", left: rr.x, top: rr.y - 52 + dy, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 22, height: 22, background: cor.vermelho, opacity: tonsDaPizza[k % tonsDaPizza.length] * p, outline: `2px solid ${cor.lapis}` }} />
          <div style={{ fontFamily: mao, fontWeight: 700, fontSize: 42, lineHeight: 1, color: cor.vermelho }}>
            <PalavraAMao w={comUnidade(d.valor)} em={d.em + 0.05} t={t} />
          </div>
        </div>,
        <div key={`lr${k}`} style={{ position: "absolute", left: rr.x, top: rr.y + dy, fontFamily: serifa, fontWeight: 500, fontSize: rr.tamanho, lineHeight: 1.2 }}>
          {rr.linhas.map((ws, li) => (
            <div key={li} style={{ whiteSpace: "nowrap", color: p >= 1 ? cor.tinta : interpolateColors(p, [0, 1], [cor.lapis, cor.tinta]) }}>
              {ws.join(" ")}
            </div>
          ))}
        </div>,
      );
    });
  } else {
    // eixos: a lápis, depois a tinta
    const base = y + g.h;
    el.push(
      <svg key="eixos" width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={g.x} y1={y + g.h * f} x2={g.x + g.w} y2={y + g.h * f} stroke={cor.lapis} strokeWidth={2} strokeDasharray="4 10" opacity={0.8} />
        ))}
        <line x1={g.x} y1={y} x2={g.x} y2={base} stroke={cor.lapis} strokeWidth={3} opacity={1 - eixos} />
        <line x1={g.x} y1={base} x2={g.x + g.w} y2={base} stroke={cor.lapis} strokeWidth={3} opacity={1 - eixos} />
        <Traco d={`M ${g.x} ${y} L ${g.x} ${base} L ${g.x + g.w} ${base}`} p={eixos} largura={4} cor={cor.tinta} />
      </svg>,
    );
    if (dados.length) {
      const n = dados.length;
      const slot = g.w / n;
      // os valores escritos à mão cabem na largura de cada coluna
      const tamValor = Math.min(38, ...dados.map((d) => corpoQueCabe(comUnidade(d.valor), slot - 8, 38, 22, { fonte: "mao", peso: 700 })));
      const maior = Math.max(...dados.map((d) => d.valor), 0.0001);
      const altura = (v: number) => (Math.max(0, v) / maior) * (g.h - 78);
      if (r.forma === "linha") {
        const pts = dados.map((d, k) => ({ x: g.x + slot * (k + 0.5), y: base - altura(d.valor) - 6 }));
        el.push(
          <svg key="linha" width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {pts.slice(1).map((p, k) => (
              <Traco key={k} d={`M ${pts[k].x} ${pts[k].y} L ${p.x} ${p.y}`} p={prog(t, dados[k + 1].em - 0.35, 0.35, gesto)} largura={6} />
            ))}
            {pts.map((p, k) => {
              const a = prog(t, dados[k].em - 0.05, 0.18);
              return a > 0 ? <circle key={`p${k}`} cx={p.x} cy={p.y} r={10 * a} fill={cor.vermelho} /> : <circle key={`p${k}`} cx={p.x} cy={p.y} r={8} fill="none" stroke={cor.lapis} strokeWidth={3} />;
            })}
          </svg>,
        );
        pts.forEach((p, k) =>
          el.push(
            <div key={`v${k}`} style={{ position: "absolute", left: p.x - slot / 2, width: slot, top: p.y - 22 - tamValor * 1.15, display: "flex", justifyContent: "center", fontFamily: mao, fontWeight: 700, fontSize: tamValor, color: cor.vermelho }}>
              <PalavraAMao w={comUnidade(dados[k].valor)} em={dados[k].em + 0.1} t={t} />
            </div>,
          ),
        );
      } else {
        dados.forEach((d, k) => {
          const bw = Math.min(104, slot * 0.58);
          const bx = g.x + k * slot + (slot - bw) / 2;
          const hf = altura(d.valor);
          const p = prog(t, d.em - 0.05, 0.55, entra);
          const h = hf * p;
          el.push(
            <svg key={`b${k}`} width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <rect x={bx} y={base - hf} width={bw} height={hf} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="7 8" opacity={1 - limitar(p * 3)} />
              {h > 0.5 ? <rect x={bx} y={base - h} width={bw} height={h} fill={cor.vermelhoClaro} stroke={cor.vermelho} strokeWidth={4.5} strokeLinejoin="round" /> : null}
            </svg>,
            <div key={`v${k}`} style={{ position: "absolute", left: g.x + k * slot, width: slot, top: base - hf - 14 - tamValor * 1.2, display: "flex", justifyContent: "center", fontFamily: mao, fontWeight: 700, fontSize: tamValor, color: cor.vermelho }}>
              <PalavraAMao w={comUnidade(d.valor)} em={d.em + 0.3} t={t} />
            </div>,
          );
        });
      }
      // rótulos embaixo do eixo
      dados.forEach((d, k) => {
        const rr = g.rotulos[k];
        if (!rr) return;
        const p = prog(t, d.em - 0.05, 0.25);
        el.push(
          <div
            key={`rt${k}`}
            style={{ position: "absolute", left: rr.x, width: rr.w, top: rr.y + dy, fontFamily: serifa, fontWeight: 500, fontSize: rr.tamanho, lineHeight: 1.2, textAlign: "center" }}
          >
            {rr.linhas.map((ws, li) => (
              <div key={li} style={{ whiteSpace: "nowrap", color: p >= 1 ? cor.tinta : interpolateColors(p, [0, 1], [cor.lapis, cor.tinta]) }}>
                {ws.join(" ")}
              </div>
            ))}
          </div>,
        );
      });
    } else {
      // sem números ditos: a tendência desenhada a caneta, com a seta no fim
      const forma = CURVAS[r.tendencia ?? "sobe"];
      const pts: [number, number][] = forma.map(([fx, fy]) => [g.x + 24 + fx * (g.w - 60), y + 20 + fy * (g.h - 40)]);
      const inicio = r.tendenciaEm ?? r.de + 0.45;
      const p = prog(t, inicio, 1.4, gesto);
      const [ux, uy] = pts[pts.length - 1];
      const [vx, vy] = pts[pts.length - 2];
      const ang = Math.atan2(uy - vy, ux - vx);
      const ponta = (da: number) => `${ux - Math.cos(ang + da) * 26} ${uy - Math.sin(ang + da) * 26}`;
      el.push(
        <svg key="curva" width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={suave(pts)} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="6 10" opacity={1 - limitar(p * 4)} />
          <Traco d={suave(pts)} p={p} largura={7} />
          <Traco d={`M ${ponta(0.5)} L ${ux} ${uy} L ${ponta(-0.5)}`} p={prog(t, inicio + 1.38, 0.18, gesto)} largura={7} />
        </svg>,
      );
    }
  }
  if (ilustrativo) {
    el.push(
      <div
        key="il"
        style={{ position: "absolute", left: g.nota.x - 260, width: 260, top: g.nota.y + dy - 50, display: "flex", justifyContent: "flex-end", fontFamily: mao, fontWeight: 600, fontSize: 34, color: cor.vermelho }}
      >
        <PalavraAMao w="ilustrativo" em={r.de + 0.6} t={t} />
      </div>,
    );
  }
  return <>{el}</>;
};

export const SECOES: Partial<Record<Momento["tipo"], React.FC<P>>> = {
  topicos: SecaoItens,
  passos: SecaoItens,
  definicao: SecaoDefinicao,
  frase: SecaoFrase,
  pergunta: SecaoPergunta,
  numero: SecaoNumero,
  comparacao: SecaoComparacao,
  grafico: SecaoGrafico,
};
