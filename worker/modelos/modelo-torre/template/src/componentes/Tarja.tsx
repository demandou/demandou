// Tarja de nome (opcional): vidro-noite com filete champanhe junto da moldura, nos primeiros
// segundos. Nome em Manrope 800 (≥ 34 px), área em caixa alta espaçada.
import { EASE_IN, prog } from "../anim";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { divideK, type Roteiro } from "../roteiro";
import { encaixar } from "../texto";
import { FONTE, K, LEG_COSTURA } from "../tema";

export const Tarja: React.FC<{ t: number; plano: Plano; caixa: Caixa; R: Roteiro; yLegenda: number }> = ({ t, plano, caixa, R, yLegenda }) => {
  const nome = plano.marca?.nome?.trim();
  if (!nome) return null;
  const de = 0.3;
  const primeiro = [...plano.momentos].sort((a, b) => a.de - b.de).find((m) => m.de > de + 0.5 && m.tipo !== "abertura");
  const ate = Math.min(3.8, primeiro ? primeiro.de - 0.1 : 3.8);
  const p = prog(t, de, de + 0.45) * (1 - prog(t, ate - 0.3, ate, EASE_IN));
  if (p <= 0) return null;
  const fn = encaixar(nome, 640, 44, 34, 1, FONTE.sans, 800);
  // na ponte: no peito, dentro da moldura (acima de y 1700); no palco: logo acima da moldura de baixo,
  // ou acima da legenda quando ela está na costura
  const noPeito = Math.min(caixa.y + caixa.h - 150, 1590);
  const legendaNaCostura = Math.abs(yLegenda - LEG_COSTURA) < 30;
  const top = divideK(R, t) < 0.5 ? noPeito : legendaNaCostura ? LEG_COSTURA - 160 : caixa.y - 128;
  return (
    <div style={{ position: "absolute", left: caixa.x + 32, top, opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
      <div style={{ background: K.vidro, border: `1.5px solid ${K.ouro}`, borderRadius: 18, padding: "14px 26px 16px", boxShadow: "0 12px 30px rgba(0,0,0,0.45)" }}>
        <div style={{ fontFamily: FONTE.sans, fontWeight: 800, fontSize: fn.tamanho, color: K.marfim, whiteSpace: "nowrap" }}>{fn.linhas[0]}</div>
        {plano.marca.area ? <div style={{ fontFamily: FONTE.sans, fontWeight: 700, fontSize: 24, letterSpacing: "0.24em", textTransform: "uppercase", color: K.ouro, marginTop: 4, whiteSpace: "nowrap" }}>{plano.marca.area}</div> : null}
      </div>
    </div>
  );
};
