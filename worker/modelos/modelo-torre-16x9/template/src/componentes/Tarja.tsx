// Tarja de nome (opcional): vidro-noite com filete champanhe junto da pessoa, nos primeiros
// segundos. Nome em Manrope 800 (≥ 34 px), área em caixa alta espaçada. No quadro deitado: em tela
// cheia, no terço de baixo à esquerda (acima da legenda); com a pessoa na moldura da direita, no
// canto de baixo da moldura.
import { EASE_IN, prog } from "../anim";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import type { Roteiro } from "../roteiro";
import { encaixar } from "../texto";
import { FONTE, K, MARGEM_X } from "../tema";

// altura da tarja (nome 44 px + área 24 px + respiro) e o vão até a legenda
const ALTURA_DA_TARJA = 112;
const VAO_DA_LEGENDA = 52;

export const Tarja: React.FC<{ t: number; plano: Plano; caixa: Caixa; R: Roteiro; yLegenda: number }> = ({ t, plano, caixa, yLegenda }) => {
  const nome = plano.marca?.nome?.trim();
  if (!nome) return null;
  const de = 0.3;
  const primeiro = [...plano.momentos].sort((a, b) => a.de - b.de).find((m) => m.de > de + 0.5 && m.tipo !== "abertura");
  const ate = Math.min(3.8, primeiro ? primeiro.de - 0.1 : 3.8);
  const p = prog(t, de, de + 0.45) * (1 - prog(t, ate - 0.3, ate, EASE_IN));
  if (p <= 0) return null;
  // cabe na moldura da direita (728 px menos o respiro e o vidro)
  const fn = encaixar(nome, 600, 44, 34, 1, FONTE.sans, 800);
  // junto da pessoa: no pé da caixa dela (tela cheia ou moldura), sempre acima da legenda
  const top = Math.min(caixa.y + caixa.h - 150, yLegenda - VAO_DA_LEGENDA - ALTURA_DA_TARJA);
  const left = Math.max(MARGEM_X, caixa.x + 32);
  return (
    <div style={{ position: "absolute", left, top, opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
      <div style={{ background: K.vidro, border: `1.5px solid ${K.ouro}`, borderRadius: 18, padding: "14px 26px 16px", boxShadow: "0 12px 30px rgba(0,0,0,0.45)" }}>
        <div style={{ fontFamily: FONTE.sans, fontWeight: 800, fontSize: fn.tamanho, color: K.marfim, whiteSpace: "nowrap" }}>{fn.linhas[0]}</div>
        {plano.marca.area ? <div style={{ fontFamily: FONTE.sans, fontWeight: 700, fontSize: 24, letterSpacing: "0.24em", textTransform: "uppercase", color: K.ouro, marginTop: 4, whiteSpace: "nowrap" }}>{plano.marca.area}</div> : null}
      </div>
    </div>
  );
};
