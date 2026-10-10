// Os 11 blocos universais na linguagem do Devocional: tudo é escrito na página, em serifada grande e
// bem espaçada, palavra por palavra na fala; os títulos são versalete oliva com um ornamento; o que
// importa acende (luz creme por trás + oliva); o que é errado leva um risco de tinta. Nada de cartão
// branco, caixa ou ícone de aplicativo: é uma página de livro.
import { interpolateColors } from "remotion";
import { abrir, abrirEm, formatar, prog, respira, suave, temposDoTexto, tinta } from "../anim";
import type { Area } from "../layout";
import { caberLinha, encaixar, larguraLinha, separar, trechoNoTexto } from "../medida";
import type {
  Abertura as TAbertura,
  Comparacao as TComparacao,
  Cta as TCta,
  Definicao as TDefinicao,
  Destaque as TDestaque,
  Frase as TFrase,
  Grafico as TGrafico,
  Numero as TNumero,
  Passos as TPassos,
  Pergunta as TPergunta,
  Plano,
  Topicos as TTopicos,
} from "../plano";
import { cor, serif } from "../tema";
import { Desenho, type NomeIcone } from "./Desenhos";
import { alturaDe, Escrita, estiloDaFonte, larguraVersalete, Ornamento, Versalete } from "./Escrita";

type Comum = { t: number; plano: Plano; area: Area };
const SERIF = { familia: "serif" as const, peso: 500 };
const ITALICO = { familia: "serif" as const, peso: 500, italico: true };

// título de bloco: versalete oliva centrado + ornamento embaixo
const ALT_TITULO = 116;
const Titulo: React.FC<{ t: number; texto?: string; em: number; area: Area; y: number }> = ({ t, texto, em, area, y }) => {
  if (!texto) return null;
  const tam = Math.max(28, Math.min(42, Math.floor(42 * Math.min(1, (area.w - 40) / Math.max(1, larguraVersalete(texto, 42))))));
  const cabe = larguraVersalete(texto, tam) <= area.w - 20;
  return (
    <>
      <div style={{ position: "absolute", left: area.x, width: area.w, top: y, textAlign: "center", ...tinta(t, abrirEm(em, area.abre), 0.5, 8) }}>
        {cabe ? (
          <Versalete texto={texto} tamanho={tam} />
        ) : (
          <span style={{ ...estiloDaFonte(ITALICO, caberLinha(texto, area.w, 44, 28, ITALICO)), color: cor.oliva, whiteSpace: "nowrap" }}>{texto}</span>
        )}
      </div>
      <Ornamento t={t} em={em + 0.15} cx={area.x + area.w / 2} y={y + 74} largura={380} />
    </>
  );
};

// texto falado encaixado e escrito palavra por palavra
const texto = (
  plano: Plano,
  txt: string,
  em: number,
  ate: number,
  o: { largura: number; max: number; min: number; linhas?: number; altura?: number; fonte?: typeof SERIF; entrelinha?: number; frases?: boolean; abre?: boolean },
) => {
  const enc = encaixar(txt, { largura: o.largura, max: o.max, min: o.min, linhas: o.linhas ?? 3, altura: o.altura, entrelinha: o.entrelinha ?? 1.2, fonte: o.fonte ?? SERIF, equilibrar: true, frases: o.frases ?? true });
  return { enc, tempos: abrir(temposDoTexto(txt, em, plano.palavras, ate), o.abre), altura: alturaDe(enc, o.entrelinha ?? 1.2) };
};

// ——— abertura ———
export const Abertura: React.FC<Comum & { m: TAbertura }> = ({ t, plano, m, area }) => {
  const em = m.em ?? m.de;
  const altDesenho = m.desenho ? Math.min(260, (area.base - area.y) * 0.36) : 0;
  const tx = texto(plano, m.texto, em, m.ate, { largura: area.w, max: 96, min: 56, linhas: 4, altura: area.base - area.y - altDesenho - 30, abre: area.abre });
  const total = altDesenho + (altDesenho ? 30 : 0) + tx.altura;
  const y0 = area.y + Math.max(0, (area.base - area.y - total) / 2);
  const trecho = trechoNoTexto(m.texto, m.destaque);
  return (
    <>
      {m.desenho ? <Desenho nome={m.desenho} t={t} em={m.desenhoEm ?? em} x={area.x + area.w / 2 - altDesenho / 2} y={y0} tamanho={altDesenho} /> : null}
      <Escrita
        t={t}
        encaixe={tx.enc}
        tempos={tx.tempos}
        x={area.x}
        y={y0 + altDesenho + (altDesenho ? 30 : 0)}
        largura={area.w}
        fonte={SERIF}
        luz={trecho ? { trecho, em: tx.tempos[trecho[0]] } : null}
      />
    </>
  );
};

// ——— tópicos e passos ———
export const Lista: React.FC<Comum & { m: TTopicos | TPassos }> = ({ t, plano, m, area }) => {
  const passos = m.tipo === "passos";
  const altT = m.titulo ? ALT_TITULO : 0;
  const recuo = 84;
  const W = area.w - recuo;
  const n = m.itens.length;
  const livre = area.base - area.y - altT - 20;
  const maxCorpo = n <= 2 ? 66 : n === 3 ? 60 : n === 4 ? 54 : 48;
  const itens = m.itens.map((it, i) => {
    const prox = m.itens[i + 1]?.em ?? m.ate;
    const tx = texto(plano, it.texto, it.em, prox, { largura: W, max: maxCorpo, min: 40, linhas: 2, altura: (livre / n) * 0.9 });
    const det = it.detalhe ? encaixar(it.detalhe, { largura: W, max: 38, min: 28, linhas: 1, fonte: ITALICO, frases: false }) : null;
    return { it, tx, det, alt: tx.altura + (det ? det.tamanho * 1.3 : 0) };
  });
  // corpo comum (o menor entre os itens) para a lista ficar homogênea
  const corpo = Math.min(...itens.map((x) => x.tx.enc.tamanho));
  const iguais = itens.map((x) => {
    const tx = texto(plano, x.it.texto, x.it.em, m.ate, { largura: W, max: corpo, min: corpo, linhas: 3 });
    return { ...x, tx, alt: tx.altura + (x.det ? x.det.tamanho * 1.3 : 0) };
  });
  const vao = Math.min(44, Math.max(18, (livre - iguais.reduce((s, x) => s + x.alt, 0)) / Math.max(1, n + 1)));
  const total = altT + iguais.reduce((s, x) => s + x.alt, 0) + vao * (n - 1);
  const y0 = area.y + Math.max(0, (area.base - area.y - total) / 2);
  let y = y0 + altT;
  const pos = iguais.map((x) => {
    const yy = y;
    y += x.alt + vao;
    return yy;
  });
  const atual = iguais.reduce((k, x, i) => (t >= x.it.em ? i : k), -1);
  const cxMarca = area.x + 30;
  const L = corpo * 1.2;
  return (
    <>
      <Titulo t={t} texto={m.titulo} em={m.de + 0.05} area={area} y={y0} />
      {passos && atual >= 0 ? (
        // o fio que liga os passos desce até o passo da vez
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {iguais.slice(1).map((x, i) => {
            const a = pos[i] + L / 2 + 16;
            const b = pos[i + 1] + L / 2 - 16;
            const k = prog(t, x.it.em - 0.35, 0.45, suave);
            return k > 0 ? <line key={i} x1={cxMarca} y1={a} x2={cxMarca} y2={a + (b - a) * k} stroke={cor.oliva} strokeWidth={3} strokeLinecap="round" opacity={0.8} /> : null;
          })}
        </svg>
      ) : null}
      {iguais.map((x, i) => {
        const visivel = t >= x.it.em;
        const da_vez = i === atual;
        const yc = pos[i] + L / 2;
        const k = prog(t, x.it.em, 0.5, suave);
        return (
          <div key={i}>
            {visivel ? (
              passos ? (
                <svg width={44} height={44} style={{ position: "absolute", left: cxMarca - 22, top: yc - 22, overflow: "visible" }}>
                  {da_vez ? <circle cx={22} cy={22} r={30 + 3 * respira(t, 2.4)} fill={cor.luz} opacity={0.9 * k} /> : null}
                  <circle cx={22} cy={22} r={13} fill={i <= atual ? cor.oliva : "none"} stroke={cor.oliva} strokeWidth={3} opacity={k} />
                </svg>
              ) : (
                <svg width={60} height={40} viewBox="-30 -20 60 40" style={{ position: "absolute", left: cxMarca - 30, top: yc - 20, overflow: "visible" }}>
                  {da_vez ? <circle cx={0} cy={0} r={30 + 3 * respira(t, 2.4)} fill={cor.luz} opacity={0.9 * k} /> : null}
                  <g opacity={k} transform={`rotate(${-30 + 30 * k}) scale(${0.6 + 0.4 * k})`}>
                    <path d="M-16 0 C-10 -10 6 -12 18 -2 C8 8 -8 8 -16 0 Z" fill={cor.oliva} />
                    <path d="M-16 0 L10 -2" stroke={cor.olivaClara} strokeWidth={1.6} />
                  </g>
                </svg>
              )
            ) : null}
            <div style={{ opacity: da_vez || atual < 0 ? 1 : 0.78 }}>
              <Escrita t={t} encaixe={x.tx.enc} tempos={x.tx.tempos} x={area.x + recuo} y={pos[i]} largura={W} fonte={SERIF} alinhar="left" />
            </div>
            {x.det ? (
              <div
                style={{
                  position: "absolute",
                  left: area.x + recuo,
                  top: pos[i] + x.tx.altura,
                  ...estiloDaFonte(ITALICO, x.det.tamanho),
                  color: cor.tintaSuave,
                  whiteSpace: "nowrap",
                  ...tinta(t, x.it.em + 0.4, 0.5, 6),
                }}
              >
                {x.it.detalhe}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

// ——— número ———
export const Numero: React.FC<Comum & { m: TNumero }> = ({ t, plano, m, area }) => {
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
  const fmt = (v: number) => `${m.prefixo ?? ""}${formatar(v, casas)}${m.sufixo ?? ""}`;
  const final = fmt(m.valor);
  const tam = caberLinha(final, area.w * 0.94, 260, 90, SERIF);
  const k = prog(t, m.em, 1.1, suave);
  const v = m.valor * k;
  const rotEm = m.rotuloEm ?? m.em + 0.3;
  const rot = texto(plano, m.rotulo, rotEm, m.ate, { largura: area.w, max: 60, min: 40, linhas: 2, fonte: ITALICO, frases: false, abre: area.abre });
  const altIl = m.ilustrativo ? 50 : 0;
  const total = tam * 1.1 + 50 + rot.altura + altIl;
  const y0 = area.y + Math.max(0, (area.base - area.y - total) / 2);
  const brilho = prog(t, m.em + 1.0, 0.6, suave);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: area.x + area.w / 2 - 380,
          width: 760,
          top: y0 + tam * 0.55 - 260,
          height: 520,
          background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,251,239,0.9) 0%, rgba(255,251,239,0) 70%)",
          opacity: brilho * (0.8 + 0.2 * respira(t, 3)),
        }}
      />
      {t >= m.em ? (
        <div
          style={{
            position: "absolute",
            left: area.x,
            width: area.w,
            top: y0,
            height: tam * 1.1,
            lineHeight: `${tam * 1.1}px`,
            textAlign: "center",
            whiteSpace: "nowrap",
            ...estiloDaFonte(SERIF, tam),
            fontVariantNumeric: "lining-nums tabular-nums",
            color: interpolateColors(brilho, [0, 1], [cor.tinta, cor.oliva]),
            ...tinta(t, m.em, 0.4, 10),
          }}
        >
          {k >= 1 ? final : fmt(v)}
        </div>
      ) : null}
      <Ornamento t={t} em={m.em + 0.3} cx={area.x + area.w / 2} y={y0 + tam * 1.1 + 22} largura={340} />
      <Escrita t={t} encaixe={rot.enc} tempos={rot.tempos} x={area.x} y={y0 + tam * 1.1 + 50} largura={area.w} fonte={ITALICO} cor={cor.tintaSuave} />
      {m.ilustrativo ? (
        <div style={{ position: "absolute", left: area.x, width: area.w, top: y0 + tam * 1.1 + 50 + rot.altura + 10, textAlign: "center", ...tinta(t, m.em + 0.4, 0.5, 4) }}>
          <Versalete texto="ilustrativo" tamanho={28} cor={cor.tintaSuave} />
        </div>
      ) : null}
    </>
  );
};

// ——— comparação: um livro aberto, uma ideia em cada página ———
export const Comparacao: React.FC<Comum & { m: TComparacao }> = ({ t, plano, m, area }) => {
  const altT = m.titulo ? ALT_TITULO : 0;
  const meio = area.x + area.w / 2;
  const col = area.w / 2 - 40;
  const livre = area.base - area.y - altT - 30;
  const lados = m.lados.map((l, i) => {
    const prox = i === 0 ? m.lados[1].em : m.ate;
    const tx = texto(plano, l.texto, l.em, Math.max(prox, l.em + 0.5), { largura: col, max: 58, min: 38, linhas: 4, altura: livre - 90 });
    return { l, tx };
  });
  const corpo = Math.min(...lados.map((x) => x.tx.enc.tamanho));
  const lad = lados.map((x) => {
    const tx = texto(plano, x.l.texto, x.l.em, m.ate, { largura: col, max: corpo, min: corpo, linhas: 5 });
    return { ...x, tx };
  });
  const alt = 90 + Math.max(...lad.map((x) => x.tx.altura));
  const total = altT + alt;
  const y0 = area.y + Math.max(0, (area.base - area.y - total) / 2);
  const yC = y0 + altT;
  const vencEm = m.vencedorEm ?? (m.vencedor !== undefined ? Math.max(m.lados[0].em, m.lados[1].em) + 0.8 : Infinity);
  const decide = m.vencedor !== undefined ? prog(t, vencEm, 0.6, suave) : 0;
  const fio = prog(t, m.de + 0.1, 0.7, suave);
  const errado = m.modo === "errado-certo";
  return (
    <>
      <Titulo t={t} texto={m.titulo} em={m.de + 0.05} area={area} y={y0} />
      {/* a dobra do livro */}
      <div style={{ position: "absolute", left: meio - 1.5, top: yC, width: 3, height: alt * fio, borderRadius: 2, background: cor.filete }} />
      {m.modo === "antes-depois" ? (
        <svg width={56} height={40} viewBox="0 0 56 40" style={{ position: "absolute", left: meio - 28, top: yC + alt / 2 - 20, opacity: prog(t, m.lados[1].em, 0.4) }}>
          <rect x={0} y={0} width={56} height={40} fill={cor.papel} />
          <path d="M8 20 H44 M34 10 L46 20 L34 30" stroke={cor.oliva} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
      {lad.map((x, i) => {
        const left = i === 0 ? area.x : meio + 40;
        const vence = m.vencedor === i;
        const perde = m.vencedor !== undefined && !vence;
        const trecho: [number, number] = [0, separar(x.l.texto).length - 1];
        return (
          <div key={i} style={{ opacity: 1 - 0.4 * (perde ? decide : 0) }}>
            <div style={{ position: "absolute", left, width: col, top: yC + 6, textAlign: "center", ...tinta(t, x.l.em, 0.45, 6) }}>
              <Versalete texto={x.l.rotulo} tamanho={Math.max(24, Math.min(36, Math.floor(36 * Math.min(1, (col - 10) / Math.max(1, larguraVersalete(x.l.rotulo, 36))))))} cor={perde && errado ? cor.alerta : cor.oliva} />
            </div>
            <Escrita
              t={t}
              encaixe={x.tx.enc}
              tempos={x.tx.tempos}
              x={left}
              y={yC + 90}
              largura={col}
              fonte={SERIF}
              luz={vence ? { trecho, em: vencEm } : null}
              risco={perde && errado ? { trecho, em: vencEm } : null}
            />
          </div>
        );
      })}
    </>
  );
};

// ——— gráfico: desenhado a tinta na página ———
export const Grafico: React.FC<Comum & { m: TGrafico }> = ({ t, m, area }) => {
  const altT = m.titulo ? ALT_TITULO : 0;
  const dados = m.dados ?? [];
  const un = m.unidade ?? "";
  const fmt = (v: number) => {
    const casas = Number.isInteger(v) ? 0 : 1;
    return un.trim().startsWith("R$") || un.trim().startsWith("US$") ? `${un.trim()} ${formatar(v, casas)}` : `${formatar(v, casas)}${un}`;
  };
  const top = area.y + altT;
  const H = Math.min(560, area.base - top - 20);
  const y0 = top + Math.max(0, (area.base - top - H) / 2);
  const W = area.w;
  let corpo: React.ReactNode = null;
  if (dados.length && m.forma === "pizza") {
    const total = dados.reduce((a, d) => a + d.valor, 0) || 1;
    const R = Math.min(H * 0.42, W * 0.22);
    const cx = area.x + R + 20;
    const cy = y0 + H / 2;
    const tons = [cor.oliva, cor.aurora, cor.tinta, cor.olivaClara, cor.auroraClara, cor.tintaSuave];
    let acum = 0;
    corpo = (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.filete} strokeWidth={2} />
          {dados.map((d, i) => {
            const frac = (d.valor / total) * prog(t, d.em, 0.6, suave);
            const r = R * 0.7;
            const c = 2 * Math.PI * r;
            const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={tons[i % tons.length]} strokeWidth={R * 0.6} strokeDasharray={`${c * frac} ${c}`} strokeDashoffset={-c * acum} transform={`rotate(-90 ${cx} ${cy})`} />;
            acum += d.valor / total;
            return el;
          })}
        </svg>
        {dados.map((d, i) => {
          const tx = `${d.rotulo} · ${fmt(d.valor)}`;
          const yy = cy - (dados.length * 64) / 2 + i * 64;
          return (
            <div key={i} style={{ position: "absolute", left: cx + R + 50, top: yy, display: "flex", alignItems: "center", gap: 16, height: 64, ...tinta(t, d.em, 0.4, 6) }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: tons[i % tons.length], flexShrink: 0 }} />
              <span style={{ ...estiloDaFonte(SERIF, caberLinha(tx, area.x + W - (cx + R + 90), 44, 26, SERIF)), color: cor.tinta, whiteSpace: "nowrap" }}>{tx}</span>
            </div>
          );
        })}
      </>
    );
  } else if (dados.length) {
    const max = Math.max(...dados.map((d) => d.valor)) || 1;
    const n = dados.length;
    const passo = W / n;
    const base = y0 + H - 70;
    const topoUtil = y0 + 70;
    const pts = dados.map((d, i) => ({ x: area.x + passo * (i + 0.5), y: base - (d.valor / max) * (base - topoUtil), d }));
    const tamR = Math.min(34, ...dados.map((d) => Math.floor(34 * Math.min(1, (passo - 16) / Math.max(1, larguraVersalete(d.rotulo, 34))))));
    const maior = dados.reduce((k, d, i) => (d.valor > dados[k].valor ? i : k), 0);
    corpo = (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <pattern id="hachura" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1={0} y1={0} x2={0} y2={14} stroke={cor.tinta} strokeWidth={3} opacity={0.32} />
            </pattern>
          </defs>
          <line x1={area.x + 10} y1={base} x2={area.x + 10 + (W - 20) * prog(t, m.de + 0.05, 0.6, suave)} y2={base} stroke={cor.tinta} strokeWidth={3} strokeLinecap="round" />
          {m.forma === "linha"
            ? pts.slice(1).map((p, i) => {
                const a = pts[i];
                const k = prog(t, p.d.em - 0.1, 0.5, suave);
                return k > 0 ? <line key={i} x1={a.x} y1={a.y} x2={a.x + (p.x - a.x) * k} y2={a.y + (p.y - a.y) * k} stroke={cor.oliva} strokeWidth={6} strokeLinecap="round" /> : null;
              })
            : pts.map((p, i) => {
                const k = prog(t, p.d.em, 0.6, suave);
                const h = (base - p.y) * k;
                const w = Math.min(160, passo * 0.56);
                return k > 0 ? (
                  <g key={i}>
                    <rect x={p.x - w / 2} y={base - h} width={w} height={h} fill={i === maior ? cor.olivaClara : "url(#hachura)"} />
                    <rect x={p.x - w / 2} y={base - h} width={w} height={h} fill="none" stroke={i === maior ? cor.oliva : cor.tinta} strokeWidth={3} />
                  </g>
                ) : null;
              })}
          {m.forma === "linha" ? pts.map((p, i) => (t >= p.d.em ? <circle key={i} cx={p.x} cy={p.y} r={11 * prog(t, p.d.em, 0.3)} fill={cor.papel} stroke={cor.oliva} strokeWidth={5} /> : null)) : null}
        </svg>
        {pts.map((p, i) => {
          const k = m.forma === "linha" ? 1 : prog(t, p.d.em, 0.6, suave);
          const yv = (m.forma === "linha" ? p.y : base - (base - p.y) * k) - 66;
          return t >= p.d.em ? (
            <div key={i}>
              <div style={{ position: "absolute", left: p.x - passo / 2, width: passo, top: yv, textAlign: "center", ...tinta(t, p.d.em + 0.15, 0.4, 6) }}>
                <span style={{ ...estiloDaFonte(SERIF, caberLinha(fmt(p.d.valor), passo - 12, 50, 26, SERIF)), color: i === maior ? cor.oliva : cor.tinta, whiteSpace: "nowrap" }}>{fmt(p.d.valor)}</span>
              </div>
              <div style={{ position: "absolute", left: p.x - passo / 2, width: passo, top: base + 16, textAlign: "center", ...tinta(t, p.d.em, 0.4, 4) }}>
                <Versalete texto={p.d.rotulo} tamanho={Math.max(20, tamR)} cor={cor.tintaSuave} />
              </div>
            </div>
          ) : null;
        })}
      </>
    );
  } else {
    // sem números ditos: a curva da tendência, desenhada a tinta, com "ilustrativo"
    const em = m.tendenciaEm ?? m.de + 0.3;
    const k = prog(t, em, 1.4, suave);
    const n = 48;
    const pts = Array.from({ length: n + 1 }, (_, i) => {
      const x = i / n;
      const y = m.tendencia === "cai" ? 0.15 + 0.7 * x * x : m.tendencia === "oscila" ? 0.5 + 0.28 * Math.sin(x * Math.PI * 3.2) : 0.85 - 0.7 * x * x;
      return { x: area.x + 40 + x * (W - 80), y: y0 + 40 + y * (H - 110) };
    });
    const vis = pts.slice(0, Math.max(2, Math.round(n * k) + 1));
    const ponta = vis[vis.length - 1];
    corpo = (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <line x1={area.x + 20} y1={y0 + H - 50} x2={area.x + W - 20} y2={y0 + H - 50} stroke={cor.filete} strokeWidth={3} strokeLinecap="round" />
          <polyline points={vis.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={cor.oliva} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          {t >= em ? <circle cx={ponta.x} cy={ponta.y} r={12} fill={cor.papel} stroke={cor.oliva} strokeWidth={5} /> : null}
        </svg>
        <div style={{ position: "absolute", left: area.x, width: W, top: y0 + H - 34, textAlign: "center", ...tinta(t, em + 0.4, 0.5, 4) }}>
          <Versalete texto="ilustrativo" tamanho={28} cor={cor.tintaSuave} />
        </div>
      </>
    );
  }
  return (
    <>
      <Titulo t={t} texto={m.titulo} em={m.de + 0.05} area={area} y={area.y} />
      {corpo}
      {m.ilustrativo && dados.length ? (
        <div style={{ position: "absolute", left: area.x, width: W, top: y0 + H + 4, textAlign: "center", ...tinta(t, m.de + 0.4, 0.5, 4) }}>
          <Versalete texto="ilustrativo" tamanho={26} cor={cor.tintaSuave} />
        </div>
      ) : null}
    </>
  );
};

// ——— destaque: a frase curta que acende inteira ———
export const Destaque: React.FC<Comum & { m: TDestaque }> = ({ t, plano, m, area }) => {
  const alerta = m.nivel === "alerta";
  const altDesenho = m.desenho ? Math.min(220, (area.base - area.y) * 0.3) : 0;
  const altDet = m.detalhe ? 80 : 0;
  const tx = texto(plano, m.texto, m.em, m.ate, { largura: area.w, max: 124, min: 60, linhas: 3, altura: area.base - area.y - altDesenho - altDet - 60, fonte: { familia: "serif", peso: 600 }, abre: area.abre });
  const total = altDesenho + (altDesenho ? 24 : 0) + tx.altura + 50 + altDet;
  const y0 = area.y + Math.max(0, (area.base - area.y - total) / 2);
  const yT = y0 + altDesenho + (altDesenho ? 24 : 0);
  const ws = separar(m.texto);
  const det = m.detalhe ? caberLinha(m.detalhe, area.w, 46, 30, ITALICO) : 0;
  return (
    <>
      {m.desenho ? <Desenho nome={m.desenho} t={t} em={m.desenhoEm ?? m.em} x={area.x + area.w / 2 - altDesenho / 2} y={y0} tamanho={altDesenho} /> : null}
      <Escrita
        t={t}
        encaixe={tx.enc}
        tempos={tx.tempos}
        x={area.x}
        y={yT}
        largura={area.w}
        fonte={{ familia: "serif", peso: 600 }}
        cor={alerta ? cor.alerta : cor.tinta}
        luz={alerta ? null : { trecho: [0, ws.length - 1], em: tx.tempos[0] + 0.15 }}
      />
      <Ornamento t={t} em={m.em + 0.4} cx={area.x + area.w / 2} y={yT + tx.altura + 26} largura={360} cor={alerta ? cor.alerta : cor.oliva} />
      {m.detalhe ? (
        <div style={{ position: "absolute", left: area.x, width: area.w, top: yT + tx.altura + 56, textAlign: "center", ...estiloDaFonte(ITALICO, det), color: cor.tintaSuave, whiteSpace: "nowrap", ...tinta(t, m.detalheEm ?? m.em + 0.6, 0.5, 6) }}>
          {m.detalhe}
        </div>
      ) : null}
    </>
  );
};

// ——— definição: um verbete de glossário ———
export const Definicao: React.FC<Comum & { m: TDefinicao }> = ({ t, plano, m, area }) => {
  const tamT = caberLinha(m.termo, area.w * 0.94, 112, 56, { familia: "serif", peso: 600 });
  const sig = texto(plano, m.significado, m.significadoEm, m.ate, { largura: area.w - 40, max: 60, min: 40, linhas: 4, fonte: ITALICO, frases: false });
  const total = tamT * 1.15 + 70 + sig.altura;
  const y0 = area.y + Math.max(0, (area.base - area.y - total) / 2);
  const fio = prog(t, m.em + 0.3, 0.6, suave);
  const larguraTermo = Math.min(area.w, larguraLinha(separar(m.termo), tamT, { familia: "serif", peso: 600 }));
  return (
    <>
      <div style={{ position: "absolute", left: area.x, width: area.w, top: y0, height: tamT * 1.15, lineHeight: `${tamT * 1.15}px`, textAlign: "center", whiteSpace: "nowrap", ...estiloDaFonte({ familia: "serif", peso: 600 }, tamT), color: cor.tinta, ...tinta(t, abrirEm(m.em, area.abre), 0.5, 10) }}>
        {m.termo}
      </div>
      <div style={{ position: "absolute", left: area.x + area.w / 2 - (larguraTermo * fio) / 2, top: y0 + tamT * 1.15 + 14, width: larguraTermo * fio, height: 3, borderRadius: 2, background: cor.oliva, opacity: 0.8 }} />
      <Escrita t={t} encaixe={sig.enc} tempos={sig.tempos} x={area.x + 20} y={y0 + tamT * 1.15 + 50} largura={area.w - 40} fonte={ITALICO} cor={cor.tintaSuave} />
    </>
  );
};

// ——— frase: citação com aspas grandes ———
export const Frase: React.FC<Comum & { m: TFrase }> = ({ t, plano, m, area }) => {
  const em = m.em ?? m.de;
  const altDesenho = m.desenho ? Math.min(200, (area.base - area.y) * 0.26) : 0;
  const altAspas = 110;
  const tx = texto(plano, m.texto, em, m.ate, { largura: area.w, max: 90, min: 52, linhas: 5, altura: area.base - area.y - altDesenho - altAspas - 20, abre: area.abre });
  const total = altDesenho + altAspas + tx.altura;
  const y0 = area.y + Math.max(0, (area.base - area.y - total) / 2);
  const destaque = trechoNoTexto(m.texto, m.destaque);
  const risco = trechoNoTexto(m.texto, m.risco);
  return (
    <>
      {m.desenho ? <Desenho nome={m.desenho} t={t} em={m.desenhoEm ?? em} x={area.x + area.w / 2 - altDesenho / 2} y={y0} tamanho={altDesenho} /> : null}
      <div style={{ position: "absolute", left: area.x, width: area.w, top: y0 + altDesenho - 40, height: 160, textAlign: "center", fontFamily: serif, fontWeight: 500, fontSize: 210, lineHeight: "210px", color: cor.oliva, ...tinta(t, em - 0.05, 0.5, 6) }}>
        “
      </div>
      <Escrita
        t={t}
        encaixe={tx.enc}
        tempos={tx.tempos}
        x={area.x}
        y={y0 + altDesenho + altAspas}
        largura={area.w}
        fonte={SERIF}
        luz={destaque ? { trecho: destaque, em: tx.tempos[destaque[0]] } : null}
        risco={risco ? { trecho: risco, em: m.riscoEm ?? tx.tempos[risco[0]] + 0.2 } : null}
      />
    </>
  );
};

// ——— pergunta: a pergunta grande sobre um "?" de luz ———
export const Pergunta: React.FC<Comum & { m: TPergunta }> = ({ t, plano, m, area }) => {
  const em = m.em ?? m.de;
  const ops = m.opcoes ?? [];
  const altOps = ops.length ? ops.length * 84 + 30 : 0;
  const tx = texto(plano, m.texto, em, ops[0]?.em ?? m.ate, { largura: area.w, max: 92, min: 54, linhas: 4, altura: area.base - area.y - altOps - 40, abre: area.abre });
  const total = tx.altura + altOps;
  const y0 = area.y + Math.max(0, (area.base - area.y - total) / 2);
  const k = prog(t, em, 0.9, suave);
  const tamOp = Math.min(54, ...ops.map((o) => caberLinha(o.texto, area.w - 140, 54, 34, SERIF)));
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: area.x,
          width: area.w,
          top: y0 + tx.altura / 2 - 330,
          height: 600,
          textAlign: "center",
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 560,
          lineHeight: "600px",
          color: cor.oliva,
          opacity: 0.11 * k,
          transform: `translateY(${(1 - k) * 30 + 8 * respira(t, 4.2)}px)`,
        }}
      >
        ?
      </div>
      <Escrita t={t} encaixe={tx.enc} tempos={tx.tempos} x={area.x} y={y0} largura={area.w} fonte={SERIF} />
      {ops.map((o, i) => {
        const y = y0 + tx.altura + 40 + i * 84;
        const p = prog(t, o.em, 0.45, suave);
        return t >= o.em ? (
          <div key={i} style={{ position: "absolute", left: area.x + 60, top: y, height: 84, display: "flex", alignItems: "center", gap: 26 }}>
            <svg width={34} height={34} viewBox="0 0 34 34" style={{ flexShrink: 0 }}>
              <circle cx={17} cy={17} r={13} fill="none" stroke={cor.oliva} strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
            </svg>
            <span style={{ ...estiloDaFonte(SERIF, tamOp), color: cor.tinta, whiteSpace: "nowrap", ...tinta(t, o.em, 0.45, 8) }}>{o.texto}</span>
          </div>
        ) : null;
      })}
    </>
  );
};

// ——— fechamento: um ícone de traço fino e o convite em itálico ———
export const iconeDoCta = (m: TCta): NomeIcone => {
  if (m.icone === "salvar") return "marcador";
  if (m.icone === "comentar") return "balao";
  if (m.icone === "seguir") return "mais";
  if (m.icone === "link") return "elo";
  const tx = m.texto.toLowerCase();
  if (/\b(manda|mande|envia|envie|compartilha|compartilhe|marca|marque|encaminha)\b/.test(tx)) return "carta";
  if (/\b(salva|salve|guarda|guarde)\b/.test(tx)) return "marcador";
  if (/\b(segue|siga|seguir)\b/.test(tx)) return "mais";
  if (/\b(link|clica|clique|toca|toque|acessa|acesse)\b/.test(tx)) return "elo";
  return "balao";
};

export const Cta: React.FC<Comum & { m: TCta }> = ({ t, plano, m, area }) => {
  const em = m.em ?? m.de;
  const icone = iconeDoCta(m);
  const tamI = Math.min(230, (area.base - area.y) * 0.3);
  const tx = texto(plano, m.texto, em, m.ate, { largura: area.w, max: 80, min: 50, linhas: 3, altura: area.base - area.y - tamI - 90, fonte: ITALICO, frases: false, abre: area.abre });
  const total = tamI + 30 + tx.altura + 60;
  const y0 = area.y + Math.max(0, (area.base - area.y - total) / 2);
  const destaque = trechoNoTexto(m.texto, m.destaque);
  const ultimo = tx.tempos[tx.tempos.length - 1] ?? em;
  return (
    <>
      <Desenho nome={icone} t={t} em={em} x={area.x + area.w / 2 - tamI / 2} y={y0} tamanho={tamI} />
      <Escrita
        t={t}
        encaixe={tx.enc}
        tempos={tx.tempos}
        x={area.x}
        y={y0 + tamI + 30}
        largura={area.w}
        fonte={ITALICO}
        luz={destaque ? { trecho: destaque, em: tx.tempos[destaque[0]] } : null}
      />
      <Ornamento t={t} em={Math.min(ultimo, em + 1.2)} cx={area.x + area.w / 2} y={y0 + tamI + 30 + tx.altura + 34} largura={300} />
    </>
  );
};
