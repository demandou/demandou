import type { Caixa, Rosto } from "../motor/caixa";
import { VideoNaCaixa } from "../motor/caixa";
import { cor } from "../tema";

// A pessoa: em tela cheia (respiros e frontispício) ou na moldura da direita da página, com fio de tinta em volta.
// Nunca recortada do fundo, nunca esticada: é o próprio vídeo reenquadrado pelo motor.
export const Pessoa: React.FC<{
  src: string;
  caixa: Caixa;
  moldura: number;
  rosto: Rosto;
  videoAltura: number;
}> = ({ src, caixa, moldura, rosto, videoAltura }) => {
  const fio = 3 * moldura;
  return (
    <>
      <VideoNaCaixa src={src} caixa={caixa} rosto={rosto} videoAltura={videoAltura} />
      {moldura > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: caixa.x - fio,
            top: caixa.y - fio,
            width: caixa.w + 2 * fio,
            height: caixa.h + 2 * fio,
            border: `${fio}px solid ${cor.tinta}`,
            opacity: moldura,
            pointerEvents: "none",
          }}
        />
      ) : null}
    </>
  );
};
