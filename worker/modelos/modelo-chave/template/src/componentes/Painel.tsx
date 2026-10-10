// O painel de um item, ao lado da porta (prancheta, conta) ou embaixo dela (chaveiro).
// Entra e sai deslizando de fora da tela, junto com a troca da pessoa (mesma curva, mesma duração):
// o que sai e o que entra andam para o mesmo lado, como a câmera passando pelo hall. Nada esmaece.
import { prog, troca } from "../anim";
import { type Arranjo, foraDaTela, type Movimento, TROCA } from "../layout";
import type { Item, Palavra } from "../plano";
import { AREA, MARGEM_HALL, PORTA_FAIXA, PORTA_LATERAL, VAO_PAINEL, W } from "../tema";
import { Chaveiro } from "./Chaveiro";
import { Conta } from "./Conta";
import { Prancheta } from "./Prancheta";

export const retanguloDoPainel = (arranjo: Arranjo, fimParede = AREA.base) => {
  if (arranjo === "embaixo") {
    // na parede, entre o quadro de chaves e a porta de baixo
    const y = AREA.topo + 14;
    return { x: MARGEM_HALL, y, w: W - 2 * MARGEM_HALL, h: Math.max(300, fimParede - y) };
  }
  if (arranjo === "faixa") {
    const y = AREA.topo + PORTA_FAIXA + 14;
    return { x: MARGEM_HALL, y, w: W - 2 * MARGEM_HALL, h: AREA.base - y };
  }
  const w = W - 2 * MARGEM_HALL - PORTA_LATERAL - VAO_PAINEL;
  const x = arranjo === "esquerda" ? W - MARGEM_HALL - w : MARGEM_HALL;
  return { x, y: AREA.topo + 10, w, h: AREA.papelBase - AREA.topo - 10 };
};

export const Painel: React.FC<{
  m: Item;
  arranjo: Arranjo;
  palavras: Palavra[];
  t: number;
  // quando a troca de entrada e a de saída começam, e para que lado a câmera anda em cada uma
  entra: number;
  sai: number;
  movimento: { entra: Movimento; sai: Movimento };
  numero: number;
  total: number;
  // onde termina a parede (topo da porta de baixo − folga)
  fimParede?: number;
}> = ({ m, arranjo, palavras, t, entra, sai, movimento, numero, total, fimParede }) => {
  const pEntra = prog(t, entra, TROCA, troca);
  const s = prog(t, sai, TROCA, troca);
  if (t < entra - 0.01 || s >= 1) return null;
  const r = retanguloDoPainel(arranjo, fimParede);
  const fora = foraDaTela(r);
  // entra vindo do lado oposto ao movimento; sai para o lado do movimento
  const dxEntra = movimento.entra === "direita" ? fora.esquerda : fora.direita;
  const dxSai = movimento.sai === "direita" ? fora.direita : fora.esquerda;
  const props = { m, palavras, t, largura: r.w, altura: r.h, numero, total };
  return (
    <div
      style={{
        position: "absolute",
        left: r.x,
        top: r.y,
        width: r.w,
        height: r.h,
        translate: `${(1 - pEntra) * dxEntra + s * dxSai}px 0px`,
        rotate: arranjo === "faixa" || arranjo === "embaixo" ? undefined : `${arranjo === "esquerda" ? 0.8 : -0.8}deg`,
      }}
    >
      {m.painel.tipo === "prancheta" ? <Prancheta {...props} painel={m.painel} /> : null}
      {m.painel.tipo === "conta" ? <Conta {...props} painel={m.painel} /> : null}
      {m.painel.tipo === "chaveiro" ? <Chaveiro {...props} painel={m.painel} /> : null}
    </div>
  );
};
