// O painel de um item, na parede da esquerda, embaixo do quadro de chaves (prancheta, conta ou
// chaveiro). No quadro deitado a pessoa está na porta da direita (a moldura da aula 9) e o painel
// ocupa o quadro da esquerda, largo e baixo.
// Entra e sai deslizando de fora da tela, junto com a troca da pessoa (mesma curva, mesma duração):
// o que sai e o que entra andam para o mesmo lado, como a câmera passando pelo hall. Nada esmaece.
import { prog, troca } from "../anim";
import { foraDaTela, type Movimento, retanguloDoPainel, TROCA } from "../layout";
import type { Item, Palavra } from "../plano";
import { Chaveiro } from "./Chaveiro";
import { Conta } from "./Conta";
import { Prancheta } from "./Prancheta";

export { retanguloDoPainel };

export const Painel: React.FC<{
  m: Item;
  palavras: Palavra[];
  t: number;
  // quando a troca de entrada e a de saída começam, e para que lado a câmera anda em cada uma
  entra: number;
  sai: number;
  movimento: { entra: Movimento; sai: Movimento };
  numero: number;
  total: number;
}> = ({ m, palavras, t, entra, sai, movimento, numero, total }) => {
  const pEntra = prog(t, entra, TROCA, troca);
  const s = prog(t, sai, TROCA, troca);
  if (t < entra - 0.01 || s >= 1) return null;
  const r = retanguloDoPainel();
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
      }}
    >
      {m.painel.tipo === "prancheta" ? <Prancheta {...props} painel={m.painel} /> : null}
      {m.painel.tipo === "conta" ? <Conta {...props} painel={m.painel} /> : null}
      {m.painel.tipo === "chaveiro" ? <Chaveiro {...props} painel={m.painel} /> : null}
    </div>
  );
};
