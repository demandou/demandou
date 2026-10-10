// O cartão da pessoa: o vídeo dela num cartão branco com cantos arredondados e sombra curta, como um
// nó do mapa. Em quadro cheio (abertura) a borda e a sombra somem.
import type { Caixa } from "../motor/caixa";
import { VideoNaCaixa } from "../motor/caixa";
import { cor, W } from "../tema";

export const BORDA = 10;

// 0 = quadro cheio, 1 = cartão
export const cartaoNess = (c: Caixa) => Math.min(1, Math.max(0, (W - c.w) / 90));

export const Pessoa: React.FC<{ caixa: Caixa; src: string; rosto: { x: number; y: number }; videoAltura: number }> = ({ caixa, src, rosto, videoAltura }) => {
  const k = cartaoNess(caixa);
  const b = BORDA * k;
  const raio = caixa.raio ?? 0;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: caixa.x - b,
          top: caixa.y - b,
          width: caixa.w + 2 * b,
          height: caixa.h + 2 * b,
          borderRadius: raio + b,
          background: cor.cartao,
          boxShadow: k > 0.01 ? cor.sombra : undefined,
          outline: k > 0.01 ? `2px solid rgba(30,26,60,${(0.1 * k).toFixed(3)})` : undefined,
        }}
      />
      <VideoNaCaixa src={src} caixa={caixa} rosto={rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(1.03)" />
    </>
  );
};
