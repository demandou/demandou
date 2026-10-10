import { staticFile, useCurrentFrame } from "remotion";
import { acaso, limitar } from "../anim";
import { BORDA } from "../layout";
import { type Caixa, VideoNaCaixa } from "../motor/caixa";
import { cor } from "../tema";

// Tratamento de "arquivo": preto e branco levemente quente, mais contraste, grão que ferve.
const FILTRO_ARQUIVO = "grayscale(1) sepia(0.16) contrast(1.18) brightness(0.97)";

// Grão de filme: um ladrilho de ruído que muda de posição a cada quadro
export const Grao: React.FC<{ opacidade: number; style?: React.CSSProperties }> = ({ opacidade, style }) => {
  const f = useCurrentFrame();
  if (opacidade <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url(${staticFile("textura/grao.png")})`,
        backgroundSize: "384px 384px",
        backgroundPosition: `${Math.round(acaso(f) * 384)}px ${Math.round(acaso(f + 0.5) * 384)}px`,
        mixBlendMode: "overlay",
        opacity: opacidade,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
};

// A pessoa: vídeo em tela cheia (presente) ou foto impressa com borda, fita e sombra (arquivo).
// `passado` diz que faixa da imagem (0 = topo, 1 = base) está em preto e branco agora.
export const Pessoa: React.FC<{
  src: string;
  caixa: Caixa;
  rot: number;
  borda: number;
  rosto: { x: number; y: number };
  videoAltura: number;
  passado: { de: number; ate: number };
  // true enquanto a foto muda de lugar: fica por cima dos documentos (sem desmontar o vídeo)
  porCima?: boolean;
}> = ({ src, caixa, rot, borda, rosto, videoAltura, passado, porCima = false }) => {
  const impresso = limitar(borda / BORDA);
  const faixa = { de: passado.de * caixa.h, ate: passado.ate * caixa.h };
  const temArquivo = faixa.ate - faixa.de > 0.5;
  const varrendo = temArquivo && (passado.ate < 0.999 || passado.de > 0.001);
  const linhaY = passado.de > 0.001 ? faixa.de : faixa.ate;
  return (
    <div
      style={{
        position: "absolute",
        left: caixa.x - borda,
        top: caixa.y - borda,
        width: caixa.w + 2 * borda,
        height: caixa.h + 2 * borda,
        rotate: `${rot}deg`,
        zIndex: porCima ? 10 : undefined,
        background: cor.foto,
        boxShadow: impresso > 0.01 ? `0 3px 4px rgba(21,21,21,${0.12 * impresso}), 0 22px 44px rgba(21,21,21,${0.22 * impresso})` : undefined,
      }}
    >
      <VideoNaCaixa src={src} caixa={{ ...caixa, x: borda, y: borda }} rosto={rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(1.02)" />
      {/* camada de arquivo: filtra o que está atrás dela, só na faixa que já "virou passado" */}
      <div style={{ position: "absolute", left: borda, top: borda, width: caixa.w, height: caixa.h, overflow: "hidden" }}>
        {temArquivo ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: faixa.de,
              height: faixa.ate - faixa.de,
              backdropFilter: FILTRO_ARQUIVO,
              WebkitBackdropFilter: FILTRO_ARQUIVO,
              overflow: "hidden",
            }}
          >
            <Grao opacidade={0.42} style={{ top: -faixa.de, height: caixa.h, bottom: "auto" }} />
            {/* vinheta de foto antiga */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: -faixa.de,
                height: caixa.h,
                background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 55%, rgba(20,16,10,0.34) 100%)",
              }}
            />
          </div>
        ) : null}
        {varrendo ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: linhaY - 2, height: 4, background: cor.vermelho }} />
        ) : null}
      </div>
      {/* borda fina de impressão por dentro do papel */}
      {impresso > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: borda,
            top: borda,
            width: caixa.w,
            height: caixa.h,
            boxShadow: `inset 0 0 0 1.5px rgba(21,21,21,${0.18 * impresso})`,
          }}
        />
      ) : null}
      {/* fita adesiva segurando a foto na folha */}
      {impresso > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -20,
            width: Math.min(170, caixa.w * 0.42),
            height: 46,
            translate: "-50% 0",
            rotate: `${-3 - rot}deg`,
            background: "rgba(233,226,208,0.78)",
            boxShadow: "0 1px 2px rgba(21,21,21,0.12)",
            opacity: impresso,
          }}
        />
      ) : null}
    </div>
  );
};
