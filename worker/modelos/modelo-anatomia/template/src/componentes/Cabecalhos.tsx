// Os dois textos de cima: a pergunta do personagem ("E se eu fosse" + MÉDICO) antes da virada, e o
// cabeçalho do mito ("Botox ≠ [PREENCHE] → Botox relaxa o músculo").
import { Rise } from "../anim";
import { encaixar, larguraTexto } from "../medida";
import type { Mito as TMito, Virada as TVirada } from "../plano";
import { EASE_IN, EASE_INOUT, EASE_OUT, FONT, K, prog } from "../tema";
import { Seringa } from "./Pecas";

/** "E se eu fosse" (pequeno) + NOME (grande, letra a letra), acima da cabeça; some na troca */
export const Pergunta: React.FC<{ m: TVirada; t: number; troca: number; y?: number }> = ({ m, t, troca, y = 330 }) => {
  const em = m.em ?? m.de;
  if (t < em - 0.2 || t > troca + 0.35) return null;
  const a = prog(t, em - 0.1, em + 0.28);
  const ex = prog(t, troca - 0.05, troca + 0.3, EASE_IN);
  const letras = Array.from(m.nome);
  const lead = encaixar(m.texto, { largura: 900, max: 46, min: 34, linhas: 1, fonte: { peso: 600 } });
  const nome = encaixar(m.nome, { largura: 940, max: 124, min: 64, linhas: 1, fonte: { peso: 800 } });
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: y, transform: `translateY(-50%) scale(${1 + ex * 0.08})`, opacity: 1 - ex, textAlign: "center", filter: ex > 0 ? `blur(${ex * 10}px)` : undefined, fontFamily: FONT }}>
      <div style={{ overflow: "hidden", height: lead.tamanho * 1.4 }}>
        <div style={{ transform: `translateY(${(1 - a) * 100}%)`, fontWeight: 600, fontSize: lead.tamanho, letterSpacing: "0.01em", color: "rgba(255,248,242,0.86)", textShadow: "0 2px 12px rgba(0,0,0,0.35)" }}>{m.texto}</div>
      </div>
      <div style={{ marginTop: 6, fontWeight: 800, fontSize: nome.tamanho, letterSpacing: "-0.02em", lineHeight: 1, color: K.accHi, textShadow: `0 6px 40px ${K.accHi}55`, whiteSpace: "nowrap" }}>
        {letras.map((ch, i) => {
          const q = prog(t, m.nomeEm - 0.06 + i * 0.022, m.nomeEm + 0.24 + i * 0.022, EASE_OUT);
          return (
            <span key={i} style={{ display: "inline-block", opacity: q, transform: `translateY(${(1 - q) * 40}px)`, filter: q < 1 ? `blur(${(1 - q) * 8}px)` : undefined, whiteSpace: "pre" }}>
              {ch}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** a linha de luz que desce na virada (por cima do vídeo) */
export const LinhaDeLuz: React.FC<{ t: number; troca: number; dur?: number; cor?: string }> = ({ t, troca, dur = 0.6, cor = K.acc }) => {
  if (t < troca - 0.001 || t > troca + dur + 0.05) return null;
  const p = EASE_INOUT(Math.max(0, Math.min(1, (t - troca) / dur)));
  const y = p * 1920;
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: y - 140, width: 1080, height: 140, background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${cor}22 70%, ${cor}55 100%)`, mixBlendMode: "screen", opacity: 1 - p * 0.3 }} />
      <div style={{ position: "absolute", left: 0, top: y - 3, width: 1080, height: 6, background: `linear-gradient(90deg, ${cor}00, ${cor} 18%, #fff 50%, ${cor} 82%, ${cor}00)`, boxShadow: `0 0 24px 6px ${cor}AA, 0 0 70px 14px ${cor}55` }} />
    </>
  );
};
export const linhaY = (t: number, troca: number, dur = 0.6) => EASE_INOUT(Math.max(0, Math.min(1, (t - troca) / dur))) * 1920;

/** cabeçalho do mito: [sujeito] [≠ objeto riscado] → [sujeito] [certo complemento] */
export const Mito: React.FC<{ m: TMito; t: number; y: number }> = ({ m, t, y }) => {
  const sujeitoEm = m.sujeitoEm ?? m.de + 0.14;
  if (t < m.de - 0.05 || t > m.ate + 0.05) return null;
  const out = prog(t, m.ate - 0.38, m.ate, EASE_IN);
  const swapP = prog(t, m.certoEm - 0.12, m.certoEm + 0.35, EASE_INOUT);
  const naoEm = m.naoEm ?? m.erradoEm - 0.2;
  const riscoEm = m.riscoEm ?? m.erradoEm + 0.45;
  const neq = prog(t, naoEm - 0.05, naoEm + 0.3, EASE_OUT);
  const seringa = m.objeto === "seringa";
  // larguras: tudo cabe em 952 px (o cabeçalho encolhe junto)
  const F = 66;
  const wSujeito = larguraTexto(m.sujeito, F, { peso: 700 });
  const etiqueta = encaixar(m.errado.toUpperCase(), { largura: 420, max: 40, min: 26, linhas: 1, fonte: { peso: 800, espacamento: 0.02 } });
  const wEtiqueta = larguraTexto(etiqueta.linhas[0] ?? "", etiqueta.tamanho, { peso: 800, espacamento: 0.02 }) + 56;
  const wObj = seringa ? 430 * 1.1 : wEtiqueta;
  const wA0 = 26 + 44 + 22 + wObj;
  const certo = `${m.certo}${m.complemento ? ` ${m.complemento}` : ""}`;
  const wB0 = 20 + larguraTexto(certo, F, { peso: 700 }) + 24;
  const escala = Math.min(1, 952 / (wSujeito + Math.max(wA0, wB0)));
  const wA = wA0 * (1 - swapP);
  const wB = wB0 * swapP;
  const draw = prog(t, sujeitoEm + 0.35, m.erradoEm + 0.1, EASE_INOUT);
  const strike = prog(t, riscoEm - 0.12, riscoEm + 0.18, EASE_INOUT);
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: y, transform: `translateY(-50%) translateY(${-out * 30}px) scale(${escala})`, opacity: 1 - out, filter: out > 0 ? `blur(${out * 8}px)` : undefined, display: "flex", justifyContent: "center", alignItems: "center", height: 110, fontFamily: FONT }}>
      <div style={{ fontWeight: 700, fontSize: F, letterSpacing: "-0.02em", color: K.ink, whiteSpace: "nowrap" }}>
        <Rise t={t} at={sujeitoEm + 0.2}>{m.sujeito}</Rise>
      </div>
      <div style={{ width: wA, overflow: "hidden", display: "flex", alignItems: "center", flexShrink: 0, height: 110 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, paddingLeft: 26, opacity: 1 - swapP, transform: `translateX(${swapP * 60}px)`, filter: swapP > 0 ? `blur(${swapP * 6}px)` : undefined }}>
          <div style={{ fontWeight: 500, fontSize: 70, color: K.acc, opacity: neq * (1 - prog(t, m.certoEm - 0.2, m.certoEm + 0.05)), transform: `scale(${0.6 + 0.4 * neq})`, width: 44, textAlign: "center" }}>≠</div>
          {seringa ? (
            <Seringa texto={m.errado} draw={draw} push={prog(t, m.erradoEm, m.erradoEm + 0.45, EASE_INOUT)} label={prog(t, m.erradoEm - 0.05, m.erradoEm + 0.2)} strike={strike} dimmed={prog(t, riscoEm, riscoEm + 0.3)} />
          ) : (
            <Etiqueta texto={etiqueta.linhas[0] ?? ""} tamanho={etiqueta.tamanho} largura={wEtiqueta} draw={draw} label={prog(t, m.erradoEm - 0.05, m.erradoEm + 0.2)} strike={strike} dimmed={prog(t, riscoEm, riscoEm + 0.3)} />
          )}
        </div>
      </div>
      <div style={{ width: wB, overflow: "hidden", flexShrink: 0, whiteSpace: "nowrap", fontWeight: 700, fontSize: F, letterSpacing: "-0.02em", paddingLeft: 20, height: 110, display: "flex", alignItems: "center" }}>
        <span style={{ color: K.acc }}>
          <Rise t={t} at={m.certoEm}>{m.certo}</Rise>
        </span>
        {m.complemento ? (
          <span style={{ color: K.ink, marginLeft: 18 }}>
            <Rise t={t} at={(m.complementoEm ?? m.certoEm + 0.6) - 0.1}>{m.complemento}</Rise>
          </span>
        ) : null}
      </div>
    </div>
  );
};

// o errado numa etiqueta de traço fino (quando não é um injetável)
const Etiqueta: React.FC<{ texto: string; tamanho: number; largura: number; draw: number; label: number; strike: number; dimmed: number }> = ({ texto, tamanho, largura, draw, label, strike, dimmed }) => {
  const h = tamanho + 34;
  return (
    <svg width={largura} height={h + 8} viewBox={`0 0 ${largura} ${h + 8}`} style={{ overflow: "visible" }}>
      <g opacity={1 - dimmed * 0.5}>
        <rect x={2} y={4} width={largura - 4} height={h} rx={h / 2} fill={K.ice2} opacity={Math.min(1, draw * 1.5)} />
        <rect x={2} y={4} width={largura - 4} height={h} rx={h / 2} fill="none" stroke={K.ink} strokeWidth={2.6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, draw * 1.3)} />
        <text x={largura / 2} y={4 + h / 2 + tamanho * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={tamanho} letterSpacing="0.02em" fill={K.ink} opacity={label}>
          {texto}
        </text>
      </g>
      <path d={`M -14 ${4 + h / 2 + 4} L ${largura + 14} ${4 + h / 2 - 4}`} stroke={K.ink} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - strike} />
    </svg>
  );
};
