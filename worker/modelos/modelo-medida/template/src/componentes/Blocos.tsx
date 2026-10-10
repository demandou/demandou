import React from "react";
import { PALCO } from "../layout";
import type { Comparacao, Cta, Definicao, Destaque, Frase, ItemFalado, Numero, Palavra, Pergunta, Abertura } from "../plano";
import { Selo, Sobe, num, serif } from "../palco/Rotulos";
import { indicesDoTrecho, temposDoTexto } from "../tempo";
import { EASE_IN, EASE_INOUT, EASE_OUT, P, SERIF, SORA, caber, clamp01, lerp, numeroBR, prog, quebrar, useTempo } from "../tema";

/* Os 11 blocos universais na linguagem do Medida (laboratório de cozinha): papel creme, tinta
   verde-escura, rótulos em Fraunces itálica, números em Sora, linhas tracejadas de medida,
   pílulas de rótulo, sachês de papel, proveta graduada, rótulo nutricional; vermelho só no alerta.
   Tudo desenha no papel, acima da moldura da pessoa (PALCO: x 72–1008, y 150–820). */

const X0 = PALCO.x;
const LARG = PALCO.w;
const Y0 = PALCO.y;
const ALT = PALCO.h;

/** cair e assentar (como o sachê que pousa): desce, passa 4 px do ponto e volta */
const pousa = (t: number, em: number) => {
  const p = prog(t, em - 0.05, em + 0.38, EASE_OUT);
  const b = Math.exp(-14 * Math.max(0, t - em - 0.22)) * Math.sin(Math.max(0, t - em - 0.22) * 26) * 4;
  return { o: prog(t, em - 0.05, em + 0.12), y: (1 - p) * -90 + (t > em + 0.22 ? b : 0), r: (1 - p) * 4, feito: t > em + 0.75 };
};

/** título do bloco: Fraunces itálica com um filete sálvia */
const Titulo: React.FC<{ texto?: string; em: number; y?: number }> = ({ texto, em, y = Y0 + 10 }) => {
  const t = useTempo();
  if (!texto) return null;
  const q = quebrar(texto, LARG - 40, 56, 34, SERIF, 400, true, 2);
  const linha = prog(t, em + 0.1, em + 0.6, EASE_OUT);
  return (
    <>
      <Sobe em={em} style={{ left: X0 + 8, top: y }}>
        <div style={{ ...serif, fontSize: q.px, color: P.tinta }}>
          {q.linhas.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </Sobe>
      <div style={{ position: "absolute", left: X0 + 10, top: y + q.linhas.length * q.px * 1.05 + 14, width: 140 * linha, height: 3, background: P.fundo, opacity: 0.45 }} />
    </>
  );
};
const alturaTitulo = (texto?: string) => (texto ? quebrar(texto, LARG - 40, 56, 34, SERIF, 400, true, 2).linhas.length * 60 + 44 : 0);

/** linha tracejada que se desenha da esquerda para a direita */
const Tracejado: React.FC<{ x: number; y: number; w: number; em: number; cor?: string; grossura?: number; dur?: number }> = ({ x, y, w, em, cor = P.fundo, grossura = 4, dur = 0.55 }) => {
  const t = useTempo();
  const p = prog(t, em, em + dur, EASE_OUT);
  if (p <= 0) return null;
  return <div style={{ position: "absolute", left: x, top: y - grossura / 2, width: w * p, height: grossura, backgroundImage: `repeating-linear-gradient(90deg, ${cor} 0 14px, transparent 14px 24px)` }} />;
};

/** serrilhado do sachê (bordas esquerda e direita) */
const serrilha = (w: number, h: number, dente = 10) => {
  const pts: string[] = [];
  const n = Math.max(4, Math.round(h / dente));
  for (let i = 0; i <= n; i++) pts.push(`${i % 2 ? 7 : 0}px ${(i / n) * h}px`);
  for (let i = n; i >= 0; i--) pts.push(`${w - (i % 2 ? 7 : 0)}px ${(i / n) * h}px`);
  return `polygon(${pts.join(",")})`;
};

// ---------------- tópicos: sachês de papel que caem e se empilham ----------------
const Saches: React.FC<{ titulo?: string; itens: ItemFalado[]; de: number; numerado: boolean }> = ({ titulo, itens, de, numerado }) => {
  const t = useTempo();
  const top = Y0 + alturaTitulo(titulo);
  const n = itens.length;
  const gap = 18;
  const hRow = Math.min(132, (ALT - (top - Y0) - gap * (n - 1)) / n);
  const atual = itens.reduce((k, it, i) => (t >= it.em - 0.05 ? i : k), -1);
  const larguraTexto = LARG - 130 - 40;
  return (
    <>
      <Titulo texto={titulo} em={de} />
      {itens.map((it, i) => {
        const a = pousa(t, it.em);
        if (a.o <= 0) return null;
        const temDet = !!it.detalhe;
        const q = quebrar(it.texto, larguraTexto, temDet ? 46 : 52, 28, SORA, 700, false, temDet ? 1 : 2, hRow - (temDet ? 54 : 26), 1.05);
        const ativo = i === atual;
        const y = top + i * (hRow + gap);
        return (
          <div key={i} style={{ position: "absolute", left: X0, top: y, width: LARG, height: hRow, opacity: a.o, transform: a.feito ? undefined : `translateY(${a.y}px) rotate(${a.r}deg)` }}>
            <div style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 8px 14px rgba(28,36,26,0.16))" }}>
              <div style={{ position: "absolute", inset: 0, background: P.sache, clipPath: serrilha(LARG, hRow) }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 110, background: ativo ? P.fundo : P.salvia, transition: "none" }} />
                <div style={{ position: "absolute", left: 110, right: 0, top: 10, height: 2, background: "rgba(28,42,34,0.07)" }} />
                <div style={{ position: "absolute", left: 110, right: 0, bottom: 10, height: 2, background: "rgba(28,42,34,0.07)" }} />
              </div>
            </div>
            <div style={{ position: "absolute", left: 0, width: 110, top: 0, height: hRow, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {numerado ? (
                <div style={{ ...num, fontSize: Math.min(58, hRow * 0.5), color: P.sache }}>{i + 1}</div>
              ) : (
                <div style={{ width: 18, height: 18, borderRadius: 99, background: P.menta }} />
              )}
            </div>
            <div style={{ position: "absolute", left: 140, width: larguraTexto, top: 0, height: hRow, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: q.px, lineHeight: 1.05, letterSpacing: "-0.02em", color: P.tinta }}>
                {q.linhas.map((l, k) => (
                  <div key={k} style={{ whiteSpace: "nowrap" }}>{l}</div>
                ))}
              </div>
              {temDet ? <div style={{ ...serif, fontSize: caber(it.detalhe!, larguraTexto, 34, 24, SERIF, 400, true), color: P.tintaSuave, marginTop: 6 }}>{it.detalhe}</div> : null}
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------------- passos: a proveta graduada que enche a cada passo ----------------
const Proveta: React.FC<{ titulo?: string; itens: ItemFalado[]; de: number }> = ({ titulo, itens, de }) => {
  const t = useTempo();
  const n = itens.length;
  const top = Y0 + alturaTitulo(titulo) + 30;
  const base = Y0 + ALT - 10;
  const H = base - top;
  const cx = X0 + 70;
  const larg = 104;
  const nivelDe = (k: number) => base - 18 - ((H - 50) * k) / n;
  // quantos passos já foram ditos (com subida suave)
  let alvo = base - 18;
  itens.forEach((it, i) => {
    const p = prog(t, it.em - 0.05, it.em + 0.55, EASE_INOUT);
    alvo = lerp(alvo, nivelDe(i + 1), p);
  });
  const ond = Math.sin(t * 7) * 2.2 * Math.exp(-2 * ((t - (itens.find((it) => t >= it.em)?.em ?? 0)) % 1.6));
  const entra = prog(t, de - 0.05, de + 0.35, EASE_OUT);
  const larguraTexto = LARG - (cx - X0) - larg / 2 - 110;
  return (
    <>
      <Titulo texto={titulo} em={de} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: entra }}>
        <defs>
          <linearGradient id="liq" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#cfe5c4" stopOpacity="0.95" />
            <stop offset="1" stopColor={P.menta} stopOpacity="0.95" />
          </linearGradient>
          <clipPath id="tubo">
            <rect x={cx - larg / 2 + 5} y={top} width={larg - 10} height={H - 5} rx={larg / 2 - 5} />
          </clipPath>
        </defs>
        <g clipPath="url(#tubo)">
          <rect x={cx - larg / 2} y={alvo + ond} width={larg} height={base - alvo + 20} fill="url(#liq)" />
          <rect x={cx - larg / 2} y={alvo + ond - 3} width={larg} height={6} fill="#e6f3dd" opacity={0.9} />
        </g>
        <rect x={cx - larg / 2} y={top - 12} width={larg} height={H + 12} rx={larg / 2} fill="rgba(255,255,255,0.22)" stroke={P.tinta} strokeOpacity={0.55} strokeWidth={3} />
        <rect x={cx - larg / 2 - 12} y={top - 16} width={larg + 24} height={10} rx={5} fill={P.papel} stroke={P.tinta} strokeOpacity={0.55} strokeWidth={3} />
        <rect x={cx - larg / 2 + 14} y={top + 10} width={10} height={H - 60} rx={5} fill="#ffffff" opacity={0.55} />
        {Array.from({ length: n * 4 + 1 }, (_, k) => {
          const y = base - 18 - ((H - 50) * k) / (n * 4);
          const longo = k % 4 === 0;
          return <line key={k} x1={cx + larg / 2 - (longo ? 34 : 18)} x2={cx + larg / 2 - 4} y1={y} y2={y} stroke={P.tinta} strokeOpacity={longo ? 0.6 : 0.3} strokeWidth={longo ? 3 : 2} />;
        })}
      </svg>
      {itens.map((it, i) => {
        const y = nivelDe(i + 1);
        const a = prog(t, it.em - 0.05, it.em + 0.4, EASE_OUT);
        if (a <= 0) return null;
        const q = quebrar(it.texto, larguraTexto, 50, 28, SORA, 700, false, 2, Math.max(70, (H - 50) / n - 10), 1.05);
        const ativo = t >= it.em - 0.05 && (i === n - 1 || t < itens[i + 1].em - 0.05);
        return (
          <React.Fragment key={i}>
            <Tracejado x={cx + larg / 2 + 8} y={y} w={56} em={it.em} cor={ativo ? P.fundo : P.tintaFraca} grossura={3} dur={0.3} />
            <div style={{ position: "absolute", left: cx + larg / 2 + 76, top: y, transform: `translateY(-50%) translateX(${(1 - a) * 30}px)`, opacity: a, display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ width: 54, height: 54, borderRadius: 99, flex: "0 0 54px", background: ativo ? P.fundo : "transparent", border: `2.5px solid ${P.fundo}`, display: "flex", alignItems: "center", justifyContent: "center", ...num, fontSize: 30, color: ativo ? P.sache : P.fundo }}>{i + 1}</div>
              <div>
                <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: q.px, lineHeight: 1.05, letterSpacing: "-0.02em", color: ativo ? P.tinta : P.tintaSuave }}>
                  {q.linhas.map((l, k) => (
                    <div key={k} style={{ whiteSpace: "nowrap" }}>{l}</div>
                  ))}
                </div>
                {it.detalhe ? <div style={{ ...serif, fontSize: caber(it.detalhe, larguraTexto - 72, 32, 22, SERIF, 400, true), color: P.tintaSuave, marginTop: 4 }}>{it.detalhe}</div> : null}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

export const BlocoTopicos: React.FC<{ titulo?: string; itens: ItemFalado[]; de: number }> = (p) => <Saches {...p} numerado={false} />;
export const BlocoPassos: React.FC<{ titulo?: string; itens: ItemFalado[]; de: number }> = (p) => <Proveta {...p} />;

// ---------------- número: conta, com a fita métrica que corre embaixo ----------------
export const BlocoNumero: React.FC<{ m: Numero }> = ({ m }) => {
  const t = useTempo();
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
  const p = prog(t, m.em - 0.02, m.em + 0.9, EASE_OUT);
  const final = numeroBR(m.valor, casas);
  const atual = numeroBR(m.valor * p, casas);
  const px = caber(`${m.prefixo ?? ""}${final}${m.sufixo ?? ""}`, LARG - 60, 260, 110, SORA, 800);
  const a = prog(t, m.em - 0.06, m.em + 0.3, EASE_OUT);
  const fita = prog(t, m.em - 0.1, m.ate, (x) => x);
  const desl = 900 * EASE_OUT(p) + 60 * fita;
  return (
    <>
      <div style={{ position: "absolute", left: X0, width: LARG, top: Y0 + 150, textAlign: "center", opacity: a, filter: a < 1 ? `blur(${(1 - a) * 10}px)` : undefined }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", ...num, fontSize: px, color: P.tinta }}>
          {m.prefixo ? <span style={{ fontSize: px * 0.42, fontWeight: 700, color: P.fundo, marginRight: px * 0.06 }}>{m.prefixo}</span> : null}
          <span style={{ display: "inline-block", minWidth: `${final.length * 0.6}em`, textAlign: "center" }}>{atual}</span>
          {m.sufixo ? <span style={{ fontSize: px * 0.42, fontWeight: 700, color: P.fundo, marginLeft: px * 0.06 }}>{m.sufixo}</span> : null}
        </div>
      </div>
      <Sobe em={m.rotuloEm ?? m.em + 0.35} style={{ left: X0, width: LARG, top: Y0 + 190 + px, textAlign: "center" }}>
        {(() => {
          const q = quebrar(m.rotulo, LARG - 80, 60, 34, SERIF, 400, true, 2);
          return (
            <div style={{ ...serif, fontSize: q.px, color: P.tinta, textAlign: "center" }}>
              {q.linhas.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          );
        })()}
      </Sobe>
      {/* fita métrica: corre enquanto o número conta; o marcador fica parado no meio */}
      <div style={{ position: "absolute", left: X0 + 40, width: LARG - 80, top: Y0 + ALT - 120, height: 84, overflow: "hidden", opacity: a, maskImage: "linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)" }}>
        <div style={{ position: "absolute", left: -desl % 200, top: 30, width: LARG + 400, height: 54, background: P.sache, borderTop: `2px solid ${P.fio}`, borderBottom: `2px solid ${P.fio}` }}>
          {Array.from({ length: Math.ceil((LARG + 400) / 20) }, (_, k) => (
            <div key={k} style={{ position: "absolute", left: k * 20, top: 0, width: 2, height: k % 10 === 0 ? 30 : k % 5 === 0 ? 20 : 11, background: P.tinta, opacity: k % 10 === 0 ? 0.6 : 0.3 }} />
          ))}
        </div>
        <div style={{ position: "absolute", left: (LARG - 80) / 2 - 12, top: 6, width: 0, height: 0, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderTop: `18px solid ${P.fundo}` }} />
      </div>
      {m.ilustrativo ? <Selo texto="ilustrativo" em={m.em + 0.3} /> : null}
    </>
  );
};

// ---------------- comparação: duas fichas de amostra, lado a lado ----------------
export const BlocoComparacao: React.FC<{ m: Comparacao }> = ({ m }) => {
  const t = useTempo();
  const top = Y0 + alturaTitulo(m.titulo) + 20;
  const h = Y0 + ALT - 20 - top;
  const w = (LARG - 60) / 2;
  const modo = m.modo ?? "contra";
  const vencedor = m.vencedor ?? (modo === "contra" ? undefined : 1);
  const tV = m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7;
  const v = vencedor === undefined ? 0 : prog(t, tV - 0.05, tV + 0.35, EASE_OUT);
  const meio = X0 + w + 30;
  const divisor = prog(t, Math.min(m.lados[0].em, m.lados[1].em), Math.min(m.lados[0].em, m.lados[1].em) + 0.6, EASE_OUT);
  return (
    <>
      <Titulo texto={m.titulo} em={m.de} />
      <div style={{ position: "absolute", left: meio - 1.5, top: top + 10, width: 3, height: (h - 20) * divisor, backgroundImage: `repeating-linear-gradient(180deg, ${P.tintaFraca} 0 12px, transparent 12px 22px)` }} />
      {divisor > 0.4 ? (
        <div style={{ position: "absolute", left: meio - 40, top: top + h / 2 - 40, width: 80, height: 80, borderRadius: 99, background: P.papel, border: `2px solid ${P.tintaFraca}`, display: "flex", alignItems: "center", justifyContent: "center", ...serif, fontSize: 40, color: P.fundo, opacity: prog(t, Math.min(m.lados[0].em, m.lados[1].em) + 0.2, Math.min(m.lados[0].em, m.lados[1].em) + 0.5) }}>
          {modo === "antes-depois" ? "→" : "vs"}
        </div>
      ) : null}
      {m.lados.map((l, i) => {
        const a = pousa(t, l.em);
        if (a.o <= 0) return null;
        const x = i === 0 ? X0 : X0 + w + 60;
        const ganha = vencedor === i;
        const perde = vencedor !== undefined && vencedor !== i;
        const errado = modo === "errado-certo" && i === 0;
        const q = quebrar(l.texto, w - 60, 56, 30, SORA, 800, false, 4, h - 170, 1.06);
        const risco = errado ? prog(t, l.em + 0.5, l.em + 0.9, EASE_OUT) : 0;
        return (
          <div key={i} style={{ position: "absolute", left: x, top, width: w, height: h, opacity: a.o * (perde ? 1 - 0.4 * v : 1), transform: a.feito ? (ganha ? `scale(${1 + 0.03 * v})` : undefined) : `translateY(${a.y}px) rotate(${(i ? 1 : -1) * a.r}deg)` }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: P.sache, border: ganha ? `${1.5 + 2.5 * v}px solid ${v > 0.5 ? P.fundo : P.fio}` : `1.5px solid ${P.fio}`, boxShadow: "0 14px 30px rgba(28,36,26,0.14)" }} />
            <div style={{ position: "absolute", left: 30, top: 30 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 16px 6px 12px", borderRadius: 999, border: `2px solid ${errado ? P.vermelho : P.fundo}`, fontFamily: SORA, fontWeight: 700, fontSize: caber(l.rotulo.toUpperCase(), w - 110, 26, 18, SORA, 700, false, 0.12), letterSpacing: "0.12em", color: errado ? P.vermelho : P.fundo, whiteSpace: "nowrap" }}>
                <span style={{ width: 10, height: 10, borderRadius: 99, background: errado ? P.vermelho : P.fundo, display: "inline-block" }} />
                {l.rotulo.toUpperCase()}
              </div>
            </div>
            <div style={{ position: "absolute", left: 30, right: 30, top: 110, bottom: 30, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ position: "relative", fontFamily: SORA, fontWeight: 800, fontSize: q.px, lineHeight: 1.06, letterSpacing: "-0.025em", color: errado ? P.tintaSuave : P.tinta }}>
                {q.linhas.map((ln, k) => (
                  <div key={k} style={{ position: "relative", whiteSpace: "nowrap", display: "table" }}>
                    {ln}
                    {risco > 0 ? <div style={{ position: "absolute", left: 0, top: "52%", height: 5, borderRadius: 3, width: `${risco * 100}%`, background: P.vermelho }} /> : null}
                  </div>
                ))}
              </div>
            </div>
            {(ganha && v > 0) || (errado && risco > 0) ? (
              <div style={{ position: "absolute", right: -18, top: -18, width: 64, height: 64, borderRadius: 99, background: errado ? P.vermelho : P.fundo, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${errado ? risco : v})`, boxShadow: "0 6px 14px rgba(0,0,0,0.18)" }}>
                <svg width={34} height={34} viewBox="0 0 34 34">
                  {errado ? <path d="M9 9 L25 25 M25 9 L9 25" stroke="#fff" strokeWidth={5} strokeLinecap="round" /> : <path d="M7 18 L14 25 L27 10" stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
                </svg>
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

// ---------------- destaque: palavra grande sobre a linha tracejada (vermelha no alerta) ----------------
export const BlocoDestaque: React.FC<{ m: Destaque; palavras: Palavra[] }> = ({ m, palavras }) => {
  const t = useTempo();
  const alerta = m.nivel === "alerta";
  const cor = alerta ? P.vermelho : P.tinta;
  const q = quebrar(m.texto, LARG - (alerta ? 120 : 40), 132, 58, SORA, 800, false, 3, 360, 1.02);
  const tempos = temposDoTexto(m.texto, m.em, palavras, m.ate);
  const altura = q.linhas.length * q.px * 1.02;
  const y = Y0 + 70 + (360 - altura) / 2;
  const soco = 1 + 0.06 * Math.exp(-9 * Math.max(0, t - m.em - 0.2)) * (t > m.em + 0.2 ? 1 : 0);
  let k = 0;
  return (
    <>
      <div style={{ position: "absolute", left: X0 + 20, width: LARG - 40, top: y, transform: `scale(${soco})`, transformOrigin: "left center" }}>
        {alerta ? (
          <div style={{ position: "absolute", left: 0, top: q.px * 0.28, width: 0, height: 0, borderLeft: "26px solid transparent", borderRight: "26px solid transparent", borderBottom: `40px solid ${P.vermelho}`, opacity: prog(t, m.em - 0.05, m.em + 0.25) }} />
        ) : null}
        <div style={{ marginLeft: alerta ? 80 : 0 }}>
          {q.linhas.map((l, li) => (
            <div key={li} style={{ fontFamily: SORA, fontWeight: 800, fontSize: q.px, lineHeight: 1.02, letterSpacing: "-0.03em", color: cor, whiteSpace: "nowrap" }}>
              {l.split(" ").map((w, wi) => {
                const i = k++;
                const p = prog(t, tempos[i] - 0.06, tempos[i] + 0.3, EASE_OUT);
                return (
                  <span key={wi} style={{ display: "inline-block", marginRight: "0.22em", opacity: p, transform: p >= 1 ? undefined : `translateY(${(1 - p) * 50}px)`, filter: p >= 1 ? undefined : `blur(${(1 - p) * 8}px)` }}>
                    {w}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <Tracejado x={X0 + 20} y={y + altura + 34} w={LARG - 40} em={m.em + 0.25} cor={alerta ? P.vermelho : P.fundo} grossura={6} />
      {m.detalhe ? (
        <Sobe em={m.detalheEm ?? m.em + 0.6} style={{ left: X0 + 20, top: y + altura + 66 }}>
          {(() => {
            const d = quebrar(m.detalhe!, LARG - 40, 52, 32, SERIF, 400, true, 2);
            return (
              <div style={{ ...serif, fontSize: d.px, color: P.tintaSuave }}>
                {d.linhas.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            );
          })()}
        </Sobe>
      ) : null}
    </>
  );
};

// ---------------- definição: o rótulo nutricional ----------------
export const BlocoDefinicao: React.FC<{ m: Definicao }> = ({ m }) => {
  const t = useTempo();
  const a = pousa(t, m.em);
  if (a.o <= 0) return null;
  const x = X0 + 20;
  const w = LARG - 40;
  const termo = quebrar(m.termo, w - 72, 92, 48, SORA, 800, false, 2);
  const sig = quebrar(m.significado, w - 72, 56, 30, SORA, 600, false, 6, 360, 1.25);
  const regua = prog(t, m.em + 0.15, m.em + 0.55, EASE_OUT);
  const h = 36 + termo.linhas.length * termo.px * 1.02 + 34 + sig.linhas.length * sig.px * 1.25 + 46;
  const top = Y0 + (ALT - h) / 2;
  return (
    <div style={{ position: "absolute", left: x, top, width: w, height: h, opacity: a.o, transform: a.feito ? undefined : `translateY(${a.y}px) rotate(${-a.r * 0.5}deg)` }}>
      <div style={{ position: "absolute", inset: 0, background: "#FFFDF8", border: `3px solid ${P.tinta}`, borderRadius: 8, boxShadow: "0 16px 34px rgba(28,36,26,0.16)" }} />
      <div style={{ position: "absolute", left: 36, right: 36, top: 30 }}>
        {termo.linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: SORA, fontWeight: 800, fontSize: termo.px, lineHeight: 1.02, letterSpacing: "-0.025em", color: P.tinta, whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
        <div style={{ height: 12, background: P.tinta, marginTop: 14, width: `${regua * 100}%` }} />
        <div style={{ marginTop: 14 }}>
          {sig.linhas.map((l, i) => {
            const p = prog(t, m.significadoEm - 0.05 + i * 0.14, m.significadoEm + 0.3 + i * 0.14, EASE_OUT);
            return (
              <div key={i} style={{ borderBottom: i < sig.linhas.length - 1 ? `2px solid ${P.fio}` : undefined, paddingTop: 2, overflow: "hidden" }}>
                <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: sig.px, lineHeight: 1.2, color: P.tinta, whiteSpace: "nowrap", opacity: p, transform: p >= 1 ? undefined : `translateY(${(1 - p) * 60}%)` }}>{l}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------------- frase: palavra por palavra, destaque em itálico sálvia, risco vermelho ----------------
export const BlocoFrase: React.FC<{ m: Frase | Abertura; palavras: Palavra[]; risco?: string; riscoEm?: number }> = ({ m, palavras, risco, riscoEm }) => {
  const t = useTempo();
  const em = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, em, palavras, m.ate);
  const dest = indicesDoTrecho(m.texto, m.destaque);
  const risc = indicesDoTrecho(m.texto, risco);
  const q = quebrar(m.texto, LARG - 120, 84, 44, SORA, 700, false, 5, ALT - 160, 1.12);
  const aspas = prog(t, m.de - 0.05, m.de + 0.4, EASE_OUT);
  const tRisco = riscoEm ?? (risc.size ? tempos[Math.max(...risc)] + 0.2 : 0);
  const pr = prog(t, tRisco, tRisco + 0.35, EASE_OUT);
  const altura = q.linhas.length * q.px * 1.12;
  let k = 0;
  return (
    <>
      <div style={{ position: "absolute", left: X0 + 4, top: Y0 - 30, fontFamily: SERIF, fontStyle: "italic", fontSize: 230, lineHeight: 1, color: P.menta, opacity: aspas, transform: aspas < 1 ? `translateY(${(1 - aspas) * 30}px)` : undefined }}>“</div>
      <div style={{ position: "absolute", left: X0 + 60, width: LARG - 120, top: Y0 + 130 + (ALT - 160 - altura) / 2 }}>
        {q.linhas.map((l, li) => (
          <div key={li} style={{ fontFamily: SORA, fontWeight: 700, fontSize: q.px, lineHeight: 1.12, letterSpacing: "-0.025em", color: P.tinta, whiteSpace: "nowrap" }}>
            {l.split(" ").map((w, wi) => {
              const i = k++;
              const p = prog(t, tempos[i] - 0.06, tempos[i] + 0.3, EASE_OUT);
              const d = dest.has(i);
              const r = risc.has(i);
              return (
                <span key={wi} style={{ position: "relative", display: "inline-block", marginRight: "0.24em", opacity: p * (r ? 1 - 0.45 * pr : 1), transform: p >= 1 ? undefined : `translateY(${(1 - p) * 40}px)`, filter: p >= 1 ? undefined : `blur(${(1 - p) * 8}px)`, fontFamily: d ? SERIF : SORA, fontStyle: d ? "italic" : "normal", fontWeight: d ? 500 : 700, color: d ? P.fundo : P.tinta }}>
                  {w}
                  {r && pr > 0 ? <span style={{ position: "absolute", left: -4, top: "54%", height: 6, borderRadius: 3, width: `calc(${pr * 100}% + 8px)`, background: P.vermelho }} /> : null}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
};

// ---------------- pergunta: a pergunta e as opções em pílulas de rótulo ----------------
export const BlocoPergunta: React.FC<{ m: Pergunta; palavras: Palavra[] }> = ({ m, palavras }) => {
  const t = useTempo();
  const em = m.em ?? m.de;
  const ops = m.opcoes ?? [];
  const tempos = temposDoTexto(m.texto, em, palavras, ops[0]?.em ?? m.ate);
  const espaco = ops.length ? ALT - ops.length * 118 - 60 : ALT - 40;
  const q = quebrar(m.texto, LARG - 40, 80, 44, SORA, 800, false, 4, Math.max(160, espaco), 1.06);
  const altura = q.linhas.length * q.px * 1.06;
  const top = ops.length ? Y0 + 20 : Y0 + (ALT - altura) / 2;
  const atual = ops.reduce((k, o, i) => (t >= o.em - 0.05 ? i : k), -1);
  let k = 0;
  return (
    <>
      <div style={{ position: "absolute", left: X0 + 20, width: LARG - 40, top }}>
        {q.linhas.map((l, li) => (
          <div key={li} style={{ fontFamily: SORA, fontWeight: 800, fontSize: q.px, lineHeight: 1.06, letterSpacing: "-0.025em", color: P.tinta, whiteSpace: "nowrap" }}>
            {l.split(" ").map((w, wi) => {
              const i = k++;
              const p = prog(t, tempos[i] - 0.06, tempos[i] + 0.3, EASE_OUT);
              return (
                <span key={wi} style={{ display: "inline-block", marginRight: "0.22em", opacity: p, transform: p >= 1 ? undefined : `translateY(${(1 - p) * 40}px)`, filter: p >= 1 ? undefined : `blur(${(1 - p) * 8}px)` }}>
                  {w}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      {ops.map((o, i) => {
        const a = pousa(t, o.em);
        if (a.o <= 0) return null;
        const ativo = i === atual;
        const y = top + altura + 50 + i * 118;
        return (
          <div key={i} style={{ position: "absolute", left: X0 + 20, top: y, opacity: a.o, transform: a.feito ? undefined : `translateY(${a.y}px)` }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "16px 38px 16px 26px", borderRadius: 999, border: `3px solid ${P.fundo}`, background: ativo ? P.fundo : "rgba(255,255,255,0.4)", fontFamily: SORA, fontWeight: 700, fontSize: caber(o.texto, LARG - 150, 52, 30, SORA, 700), color: ativo ? P.sache : P.fundo, whiteSpace: "nowrap" }}>
              <span style={{ width: 16, height: 16, borderRadius: 99, background: ativo ? P.menta : P.fundo, display: "inline-block" }} />
              {o.texto}
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------------- cta: o texto e o botão redondo que aperta ----------------
const IconeCta: React.FC<{ tipo: Cta["icone"] }> = ({ tipo }) => {
  const s = { stroke: "#fff", strokeWidth: 6, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (tipo === "seguir")
    return (
      <svg width={76} height={76} viewBox="0 0 76 76">
        <circle cx={32} cy={26} r={12} {...s} />
        <path d="M10 62c2-12 11-19 22-19s20 7 22 19" {...s} />
        <path d="M60 22v20M50 32h20" {...s} />
      </svg>
    );
  if (tipo === "comentar")
    return (
      <svg width={76} height={76} viewBox="0 0 76 76">
        <path d="M14 18h48a6 6 0 0 1 6 6v26a6 6 0 0 1-6 6H34l-14 12V56h-6a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z" {...s} />
      </svg>
    );
  if (tipo === "link")
    return (
      <svg width={76} height={76} viewBox="0 0 76 76">
        <path d="M32 44l12-12" {...s} />
        <path d="M28 34l-8 8a10 10 0 0 0 14 14l8-8" {...s} />
        <path d="M48 42l8-8a10 10 0 0 0-14-14l-8 8" {...s} />
      </svg>
    );
  return (
    <svg width={76} height={76} viewBox="0 0 76 76">
      <path d="M20 12h36v54L38 52 20 66z" {...s} />
    </svg>
  );
};

export const BlocoCta: React.FC<{ m: Cta; palavras: Palavra[]; fim: number }> = ({ m, palavras, fim }) => {
  const t = useTempo();
  const em = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, em, palavras, fim);
  const dest = indicesDoTrecho(m.texto, m.destaque);
  const q = quebrar(m.texto, LARG - 60, 92, 48, SORA, 800, false, 3, 330, 1.04);
  const altura = q.linhas.length * q.px * 1.04;
  const top = Y0 + 40;
  const b = prog(t, m.de + 0.35, m.de + 0.75, EASE_OUT);
  const ciclo = Math.max(0, t - m.de - 0.9) % 1.1;
  const aperta = 1 - 0.08 * Math.sin(Math.PI * clamp01(ciclo / 0.28));
  let k = 0;
  return (
    <>
      <div style={{ position: "absolute", left: X0 + 30, width: LARG - 60, top, textAlign: "center" }}>
        {q.linhas.map((l, li) => (
          <div key={li} style={{ fontFamily: SORA, fontWeight: 800, fontSize: q.px, lineHeight: 1.04, letterSpacing: "-0.025em", color: P.tinta, whiteSpace: "nowrap" }}>
            {l.split(" ").map((w, wi) => {
              const i = k++;
              const p = prog(t, tempos[i] - 0.06, tempos[i] + 0.3, EASE_OUT);
              return (
                <span key={wi} style={{ display: "inline-block", marginRight: "0.22em", color: dest.has(i) ? P.fundo : P.tinta, opacity: p, transform: p >= 1 ? undefined : `translateY(${(1 - p) * 40}px)`, filter: p >= 1 ? undefined : `blur(${(1 - p) * 8}px)` }}>
                  {w}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <Tracejado x={X0 + 200} y={top + altura + 40} w={LARG - 400} em={m.de + 0.3} />
      <div style={{ position: "absolute", left: 540 - 88, top: top + altura + 90, width: 176, height: 176, borderRadius: 99, background: P.fundo, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${b * aperta})`, boxShadow: "0 16px 30px rgba(28,52,40,0.28)" }}>
        <div style={{ position: "absolute", inset: -14, borderRadius: 99, border: `3px solid ${P.menta}`, opacity: 0.7 * (1 - clamp01(ciclo / 1.1)), transform: `scale(${1 + 0.25 * clamp01(ciclo / 1.1)})` }} />
        <IconeCta tipo={m.icone} />
      </div>
    </>
  );
};

/** abertura no papel (quando não cabe acima da cabeça): frase grande, destaque em itálico sálvia */
export const BlocoAberturaPapel: React.FC<{ m: Abertura; palavras: Palavra[] }> = ({ m, palavras }) => <BlocoFrase m={m} palavras={palavras} />;

export { EASE_IN, lerp };
