// O apresentador: um recorte sem fundo (public/pessoa.webm), posicionado pela pose do momento e
// seguindo o rosto. A voz vem do vídeo original, que fica montado o tempo todo (invisível).
import { OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { VideoNaCaixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { geometriaDaPessoa, poseNoTempo, type Troca } from "../poses";

export const Voz: React.FC<{ plano: Plano }> = ({ plano }) => (
  <VideoNaCaixa src={plano.video} caixa={{ x: 0, y: 0, w: 2, h: 2, raio: 0, zoom: 1, ancoraY: 0.3 }} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} estilo={{ opacity: 0, pointerEvents: "none" }} />
);

export const Pessoa: React.FC<{ plano: Plano; trocas: Troca[]; z: number }> = ({ plano, trocas, z }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pose = poseNoTempo(trocas, t);
  const g = geometriaDaPessoa(plano, pose, t);
  const recorte = plano.recorte !== false;
  return (
    <div style={{ position: "absolute", left: g.left, top: g.top, width: g.w, height: g.h, transformOrigin: `${g.ox}px ${g.oy}px`, transform: g.rot ? `rotate(${g.rot}deg)` : undefined, zIndex: z }}>
      {recorte ? (
        <OffthreadVideo src={staticFile("pessoa.webm")} transparent muted style={{ width: "100%", height: "100%" }} />
      ) : (
        <OffthreadVideo src={staticFile(plano.video)} muted style={{ width: "100%", height: "100%", borderRadius: 24 }} />
      )}
    </div>
  );
};
