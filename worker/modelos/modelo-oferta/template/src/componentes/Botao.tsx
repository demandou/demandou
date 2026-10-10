// O botão da oferta (o bloco `cta`): uma pílula verde profunda com o ícone num círculo marfim e o
// texto dito ("Link na bio"). Entra macio na palavra; um dedo (mão de traço, sem marca) chega e
// TOCA no `toqueEm` (padrão: a última palavra): o botão afunda, uma onda marfim se espalha e
// depois ele pulsa de leve. Sozinho, fica no meio da página; na doca, embaixo do prazo.
import { Easing, interpolate } from "remotion";
import { entrada, prog, saindo, suave, temposDoTexto } from "../anim";
import { larguraTexto } from "../medida";
import type { Cta as TCta, Plano } from "../plano";
import { cor, fonte, PAINEL } from "../tema";
import { AREA_DOCA, type Doca } from "./Oferta";
import { caber, Icone, Texto } from "./Pecas";
import { ALTURA_PRAZO } from "./Prazo";

const ALTURA = 156;

// a mão que toca: traço verde profundo, preenchida de marfim
const Mao: React.FC<{ tamanho: number }> = ({ tamanho }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" style={{ display: "block", overflow: "visible", filter: "drop-shadow(0 8px 14px rgba(15,51,40,0.3))" }}>
    <path
      d="M24 30V10.5a4.5 4.5 0 0 1 9 0V27l.2-3.6a4.4 4.4 0 0 1 8.8.4V29l.3-2.3a4.3 4.3 0 0 1 8.5.9v3.3l.4-1.4a4 4 0 0 1 7.8 1.6V43c0 9.5-6.8 17-16.5 17h-4.2c-6 0-10.4-2.6-13.7-7.6L15.2 41a4.6 4.6 0 0 1 7.2-5.6L24 37.4z"
      fill={cor.cartao}
      stroke={cor.acentoEscuro}
      strokeWidth={2.6}
      strokeLinejoin="round"
    />
  </svg>
);

export const lugarDoBotao = (doca: Doca | null, comPrazo: boolean, temTexto: number) => {
  if (!doca) return { y: (PAINEL.y + PAINEL.base) / 2 - ALTURA / 2 + temTexto / 2 };
  if (comPrazo) return { y: AREA_DOCA.y + ALTURA_PRAZO + 38 };
  return { y: (AREA_DOCA.y + AREA_DOCA.base) / 2 - ALTURA / 2 };
};

export const Botao: React.FC<{ t: number; plano: Plano; m: TCta; fim: number; doca: Doca | null; comPrazo: boolean }> = ({ t, plano, m, fim, doca, comPrazo }) => {
  const fimTotal = doca ? doca.fim : fim;
  const em = m.em ?? m.de;
  if (t < em - 0.12 || t > fimTotal + 0.3) return null;
  const sai = saindo(t, fimTotal, 0.22);
  const tempos = temposDoTexto(m.texto, em, plano.palavras, fimTotal);
  const toqueEm = m.toqueEm ?? Math.max(em + 0.25, tempos[tempos.length - 1] ?? em);
  const icone = m.icone ?? "link";
  // o texto cabe no botão (até 2 linhas)
  const W = Math.min(PAINEL.w, 820);
  const xTexto = 150;
  const fit = caber(m.texto, W - xTexto - 150, 62, 34, 2, 800);
  const larguraUsada = Math.max(...fit.linhas.map((l) => larguraTexto(l, fit.tamanho, { peso: 800 })));
  const Wb = Math.min(W, Math.max(660, xTexto + larguraUsada + 150));
  const { y } = lugarDoBotao(doca, comPrazo, 0);
  const x = 540 - Wb / 2;
  const e = entrada(t, em - 0.06, { de: 0.82, dur: 0.36 });
  // o toque
  const chega = prog(t, toqueEm - 0.42, 0.38, Easing.out(Easing.cubic));
  const aperta = t >= toqueEm ? Math.sin(Math.PI * Math.min(1, (t - toqueEm) / 0.22)) : 0;
  const onda = t >= toqueEm ? Math.min(1, (t - toqueEm) / 0.6) : 0;
  const pulso = t > toqueEm + 0.6 ? ((t - toqueEm - 0.6) % 1.2) / 1.2 : 0;
  // o dedo toca a seta, na ponta direita (longe do texto)
  const ponto = { x: x + Wb - 78, y: y + ALTURA * 0.55 };
  const maoX = interpolate(chega, [0, 1], [ponto.x + 200, ponto.x]);
  const maoY = interpolate(chega, [0, 1], [ponto.y + 230, ponto.y]);
  const respira = t > toqueEm + 0.3 ? 1 + 0.012 * Math.sin((t - toqueEm) * 4) : 1;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      <div style={{ position: "absolute", left: x, top: y, width: Wb, height: ALTURA, opacity: e.opacity, transform: [e.transform, `scale(${(1 - 0.05 * aperta) * respira})`].filter(Boolean).join(" ") }}>
        {pulso > 0 ? <div style={{ position: "absolute", inset: 0, borderRadius: ALTURA / 2, border: `5px solid ${cor.acento}`, opacity: (1 - pulso) * 0.5, transform: `scale(${1 + pulso * 0.14}, ${1 + pulso * 0.3})` }} /> : null}
        <div style={{ position: "absolute", inset: 0, borderRadius: ALTURA / 2, background: cor.acento, boxShadow: `0 ${16 - 10 * aperta}px ${34 - 16 * aperta}px rgba(11,61,44,0.32)`, overflow: "hidden" }}>
          {/* a onda do toque */}
          {onda > 0 && onda < 1 ? (
            <div
              style={{
                position: "absolute",
                left: ponto.x - x - 420 * onda,
                top: ponto.y - y - 420 * onda,
                width: 840 * onda,
                height: 840 * onda,
                borderRadius: "50%",
                background: cor.cartao,
                opacity: 0.28 * (1 - onda),
              }}
            />
          ) : null}
          {/* um brilho fino que atravessa uma vez quando o botão entra */}
          {(() => {
            const b = prog(t, em + 0.25, 0.8, suave);
            return b > 0 && b < 1 ? (
              <div style={{ position: "absolute", top: -20, bottom: -20, left: -160 + b * (Wb + 320), width: 110, transform: "skewX(-18deg)", background: "linear-gradient(90deg, rgba(255,252,246,0), rgba(255,252,246,0.22), rgba(255,252,246,0))" }} />
            ) : null;
          })()}
        </div>
        <div style={{ position: "absolute", left: 24, top: (ALTURA - 108) / 2, width: 108, height: 108, borderRadius: 54, background: cor.cartao, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icone nome={icone} tamanho={58} cor={cor.acento} traco={2.2} />
        </div>
        <div style={{ position: "absolute", right: 34, top: (ALTURA - 88) / 2, width: 88, height: 88, borderRadius: 44, border: `3px solid rgba(255,252,246,0.55)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icone nome="seta" tamanho={46} cor={cor.cartao} traco={2.4} />
        </div>
        <div style={{ position: "absolute", left: xTexto, top: (ALTURA - fit.linhas.length * fit.tamanho * 1.14) / 2 }}>
          <Texto t={t} linhas={fit.linhas} tamanho={fit.tamanho} cor={cor.cartao} alinhar="left" tempos={tempos} />
        </div>
      </div>
      {chega > 0 ? (
        <div style={{ position: "absolute", left: maoX - 67, top: maoY - 14, opacity: Math.min(1, chega * 3), transform: `scale(${1 - 0.1 * aperta})`, transformOrigin: "67px 14px" }}>
          <Mao tamanho={150} />
        </div>
      ) : null}
    </div>
  );
};
