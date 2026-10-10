// A pergunta da virada: "E se eu fosse" (pequeno, sobe da máscara), o ícone e o NOME grande no
// laranja do Sol, letra por letra, e o complemento ("de ciências"). Sai com desfoque quando a linha
// de luz desce. Porte do `Pergunta` + `IntroTop` do Reel "Conteúdo 2.0".
// No quadro deitado (16:9) não há altura em cima da cabeça: a pergunta vira uma coluna AO LADO da
// cabeça, no lado livre do quadro (o lado oposto ao rosto), centrada na altura do rosto. A pessoa
// continua em quadro cheio; nada cobre o rosto.
import React from "react";
import type { Plano, Virada as ViradaM } from "../plano";
import { COR, EASE_IN, EASE_OUT, H, MARGEM, SORA, W, prog } from "../tema";
import { caberNumaLinha } from "../medida";
import { rostoNaTela } from "../motor/caixa";
import { alturaDoVideo, caixaDaPessoa, rostoDo } from "../layout";

export const Icone: React.FC<{ tipo?: string; tamanho?: number; cor?: string }> = ({ tipo = "orbita", tamanho = 108, cor = COR.sol }) => {
  const s = tamanho;
  if (tipo === "atomo")
    return (
      <svg width={s} height={s} viewBox="-46 -46 92 92">
        {[0, 60, -60].map((r) => (
          <ellipse key={r} rx={40} ry={14} fill="none" stroke={cor} strokeWidth={3.5} transform={`rotate(${r})`} />
        ))}
        <circle r={8.5} fill={COR.branco} />
      </svg>
    );
  if (tipo === "celula")
    return (
      <svg width={s} height={s} viewBox="-46 -46 92 92">
        <circle r={38} fill="none" stroke={cor} strokeWidth={4} />
        <circle cx={6} cy={-2} r={14} fill={cor} />
        <circle cx={-18} cy={14} r={3.5} fill={COR.branco} />
        <circle cx={-12} cy={-20} r={2.8} fill={COR.branco} />
      </svg>
    );
  if (tipo === "moeda")
    return (
      <svg width={s} height={s} viewBox="-46 -46 92 92">
        <circle r={36} fill="none" stroke={cor} strokeWidth={5} />
        <circle r={27} fill="none" stroke={cor} strokeWidth={2} />
        <text y={12} textAnchor="middle" fontFamily={SORA} fontWeight={800} fontSize={34} fill={COR.branco}>
          $
        </text>
      </svg>
    );
  if (tipo === "terra" || tipo === "lua" || tipo === "planeta" || tipo === "rochoso")
    return (
      <svg width={s} height={s} viewBox="-46 -46 92 92">
        <circle r={22} fill={cor} />
        <ellipse rx={40} ry={11} fill="none" stroke={COR.branco} strokeWidth={3.5} transform="rotate(-18)" />
      </svg>
    );
  return (
    <svg width={s} height={s} viewBox="-46 -46 92 92">
      <ellipse rx={40} ry={15} fill="none" stroke={cor} strokeWidth={4} transform="rotate(-24)" />
      <circle r={13} fill={cor} />
      <circle cx={36} cy={-16} r={5.5} fill={COR.branco} />
    </svg>
  );
};

// A coluna da pergunta: no lado livre do quadro (oposto ao rosto), da margem até perto da cabeça,
// centrada na altura do rosto (medido no começo da virada, para a coluna não andar).
const COLUNA_MIN = 560;
const COLUNA_MAX = 900;
export const colunaDaVirada = (plano: Plano, m: ViradaM) => {
  const em = m.em ?? m.de;
  const { caixa } = caixaDaPessoa(plano, em);
  const r = rostoNaTela(caixa, rostoDo(plano), alturaDoVideo(plano), em);
  const folga = 1.1 * r.largura + 32;
  const esquerda = r.x >= W / 2;
  const livre = esquerda ? r.x - folga - MARGEM : W - MARGEM - (r.x + folga);
  const largura = Math.max(COLUNA_MIN, Math.min(COLUNA_MAX, livre));
  const sobra = Math.max(0, livre - largura) / 2;
  const x = esquerda ? MARGEM + sobra : W - MARGEM - largura - sobra;
  const y = Math.max(220, Math.min(H - 300, r.y));
  return { x, y, largura };
};

export const ViradaTitulo: React.FC<{ plano: Plano; m: ViradaM; t: number }> = ({ plano, m, t }) => {
  const tLead = m.em ?? m.de;
  const out = m.trocaEm;
  if (t < tLead - 0.2 || t > out + 0.4) return null;
  const a = prog(t, tLead - 0.08, tLead + 0.3);
  const ex = prog(t, out - 0.05, out + 0.3, EASE_IN);
  const col = colunaDaVirada(plano, m);
  const nome = m.nome.toUpperCase();
  const letras = Array.from(nome);
  const tamNome = caberNumaLinha(nome, col.largura - 130, 124, 60, 800, false, -0.02);
  const tamLead = caberNumaLinha(m.texto, col.largura, 46, 34, 600);
  const comp = m.complemento ?? "";
  const tamComp = comp ? caberNumaLinha(comp, col.largura, 50, 34, 600, false, 0.02) : 50;
  const cA = m.complementoEm !== undefined ? prog(t, m.complementoEm - 0.06, m.complementoEm + 0.3) : prog(t, m.nomeEm + 0.3, m.nomeEm + 0.6);
  return (
    <div style={{ position: "absolute", left: col.x, width: col.largura, top: col.y, transform: "translateY(-50%)", textAlign: "center" }}>
      <div style={{ transform: `scale(${1 + ex * 0.08})`, opacity: 1 - ex, filter: ex > 0 ? `blur(${ex * 10}px)` : undefined }}>
        <div style={{ overflow: "hidden", height: Math.round(tamLead * 1.4) }}>
          <div style={{ transform: `translateY(${(1 - a) * 100}%)`, fontFamily: SORA, fontWeight: 600, fontSize: tamLead, letterSpacing: "0.01em", color: "rgba(255,248,242,0.82)", textShadow: "0 3px 18px rgba(0,0,0,0.5)" }}>{m.texto}</div>
        </div>
        <div style={{ marginTop: 6, display: "flex", justifyContent: "center", alignItems: "center", gap: 22 }}>
          <div style={{ opacity: prog(t, m.nomeEm - 0.05, m.nomeEm + 0.25), transform: `scale(${0.6 + 0.4 * prog(t, m.nomeEm - 0.05, m.nomeEm + 0.35)})` }}>
            <Icone tipo={m.icone} tamanho={Math.round(tamNome * 0.87)} />
          </div>
          <div style={{ fontFamily: SORA, fontWeight: 800, fontSize: tamNome, letterSpacing: "-0.02em", lineHeight: 1, color: COR.sol, textShadow: `0 6px 40px ${COR.sol}55`, whiteSpace: "nowrap" }}>
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
      </div>
      {comp ? (
        <div style={{ marginTop: 12, textAlign: "center", opacity: cA * (1 - ex), filter: cA < 1 || ex > 0 ? `blur(${(1 - cA) * 8 + ex * 10}px)` : undefined, transform: `translateY(${(1 - cA) * 24}px)` }}>
          <span style={{ fontFamily: SORA, fontWeight: 600, fontSize: tamComp, letterSpacing: "0.02em", color: "rgba(255,248,242,0.9)", textShadow: "0 4px 24px rgba(0,0,0,0.55)" }}>{comp}</span>
        </div>
      ) : null}
    </div>
  );
};
