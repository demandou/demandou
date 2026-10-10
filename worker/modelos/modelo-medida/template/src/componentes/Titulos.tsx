import React from "react";
import { rostoNaTelaAgora } from "../layout";
import type { Abertura, Palavra, Plano, Virada } from "../plano";
import { indicesDoTrecho, temposDoTexto } from "../tempo";
import { EASE_IN, EASE_OUT, P, SERIF, SORA, caber, prog, quebrar, useTempo } from "../tema";

/* Títulos sobre a pessoa em tela cheia, acima da cabeça: a pergunta da virada ("E se eu fosse" +
   NOME) e a abertura palavra por palavra. Texto claro sobre o vídeo, sem caixa, sem luz atrás da
   pessoa; a cor de destaque é a menta. */

/** centro vertical do bloco de título: acima da cabeça, nunca acima de y 120 */
const yAcimaDaCabeca = (plano: Plano, t: number, altura: number) => {
  const r = rostoNaTelaAgora(plano, t);
  const topoCabeca = r.y - r.largura * 0.8;
  return Math.max(120 + altura / 2, Math.min(330, topoCabeca - 36 - altura / 2));
};

export const TituloVirada: React.FC<{ m: Virada; plano: Plano }> = ({ m, plano }) => {
  const t = useTempo();
  const tLead = m.em ?? m.de;
  const out = m.trocaEm;
  if (t < tLead - 0.2 || t > out + 0.35) return null;
  const cor = m.cor ?? P.menta;
  const a = prog(t, tLead - 0.08, tLead + 0.3);
  const ex = prog(t, out - 0.05, out + 0.3, EASE_IN);
  const letras = Array.from(m.nome);
  const px = caber(m.nome, 952, m.nome.length > 12 ? 92 : 124, 56, SORA, 800);
  const y = yAcimaDaCabeca(plano, Math.min(t, out), 64 + 6 + px);
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: y, transform: `translateY(-50%) scale(${1 + ex * 0.08})`, opacity: 1 - ex, textAlign: "center", filter: ex > 0 ? `blur(${ex * 10}px)` : undefined }}>
      {m.texto ? (
        <div style={{ overflow: "hidden", height: 64 }}>
          <div style={{ transform: `translateY(${(1 - a) * 100}%)`, fontFamily: SORA, fontWeight: 600, fontSize: 46, letterSpacing: "0.01em", color: "rgba(255,248,242,0.82)" }}>{m.texto}</div>
        </div>
      ) : null}
      <div style={{ marginTop: 6, fontFamily: SORA, fontWeight: 800, fontSize: px, letterSpacing: "-0.02em", lineHeight: 1, color: cor, textShadow: `0 6px 40px ${cor}55`, whiteSpace: "nowrap" }}>
        {letras.map((ch, i) => {
          const q = prog(t, m.nomeEm - 0.06 + i * 0.022, m.nomeEm + 0.24 + i * 0.022, EASE_OUT);
          return (
            <span key={i} style={{ display: "inline-block", opacity: q, transform: q >= 1 ? undefined : `translateY(${(1 - q) * 40}px)`, filter: q >= 1 ? undefined : `blur(${(1 - q) * 8}px)`, whiteSpace: "pre" }}>
              {ch}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** abertura em tela cheia: o título se monta palavra por palavra acima da cabeça */
export const AberturaCheia: React.FC<{ m: Abertura; plano: Plano; palavras: Palavra[]; fim: number }> = ({ m, plano, palavras, fim }) => {
  const t = useTempo();
  const em = m.em ?? m.de;
  if (t < m.de - 0.1 || t > fim + 0.35) return null;
  const tempos = temposDoTexto(m.texto, em, palavras, fim);
  const dest = indicesDoTrecho(m.texto, m.destaque);
  const r = rostoNaTelaAgora(plano, t);
  const espaco = Math.max(150, r.y - r.largura * 0.8 - 36 - 120 - (m.rotulo ? 56 : 0));
  const q = quebrar(m.texto, 952, 104, 52, SORA, 800, false, 3, espaco, 1.04);
  const altura = q.linhas.length * q.px * 1.04 + (m.rotulo ? 56 : 0);
  const y = yAcimaDaCabeca(plano, t, altura);
  const ex = prog(t, fim, fim + 0.3, EASE_IN);
  let k = 0;
  return (
    <div style={{ position: "absolute", left: 64, width: 952, top: y, transform: "translateY(-50%)", textAlign: "center", opacity: 1 - ex, filter: ex > 0 ? `blur(${ex * 8}px)` : undefined }}>
      {m.rotulo ? (
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 44, color: "rgba(255,248,242,0.86)", marginBottom: 12, opacity: prog(t, m.de - 0.05, m.de + 0.3) }}>{m.rotulo}</div>
      ) : null}
      {q.linhas.map((linha, li) => (
        <div key={li} style={{ fontFamily: SORA, fontWeight: 800, fontSize: q.px, lineHeight: 1.04, letterSpacing: "-0.025em", whiteSpace: "nowrap", textShadow: "0 4px 26px rgba(0,0,0,0.45)" }}>
          {linha.split(" ").map((w, wi) => {
            const i = k++;
            const p = prog(t, tempos[i] - 0.06, tempos[i] + 0.3, EASE_OUT);
            const cor = dest.has(i) ? P.menta : P.branco;
            return (
              <span key={wi} style={{ display: "inline-block", marginRight: "0.24em", color: cor, opacity: p, transform: p >= 1 ? undefined : `translateY(${(1 - p) * 40}px)`, filter: p >= 1 ? undefined : `blur(${(1 - p) * 8}px)` }}>
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** tarja de nome (marca): nome ≥ 36 px + área em itálico, nos primeiros segundos */
export const Tarja: React.FC<{ plano: Plano }> = ({ plano }) => {
  const t = useTempo();
  const { nome, area } = plano.marca ?? { nome: "", area: "" };
  if (!nome) return null;
  const a = prog(t, 0.25, 0.7, EASE_OUT);
  const x = prog(t, 3.6, 3.95, EASE_IN);
  if (a <= 0 || x >= 1) return null;
  return (
    <div style={{ position: "absolute", left: 64, top: 1560, opacity: a * (1 - x), transform: `translateX(${(1 - a) * -30 - x * 20}px)` }}>
      <div style={{ display: "inline-flex", flexDirection: "column", padding: "16px 26px 18px", borderRadius: 22, background: "rgba(243,238,228,0.94)", boxShadow: "0 10px 30px rgba(20,28,22,0.25)" }}>
        <div style={{ fontFamily: SORA, fontWeight: 800, fontSize: caber(nome, 560, 40, 36, SORA, 800), color: P.tinta, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{nome}</div>
        {area ? <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 32, color: P.fundo, marginTop: 2, whiteSpace: "nowrap" }}>{area}</div> : null}
      </div>
    </div>
  );
};
