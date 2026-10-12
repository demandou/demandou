// O apresentador no quadro deitado. Um vídeo só (com a voz): em tela cheia fora dos momentos e na
// moldura da direita durante uma tela de aula, sempre com o rosto acompanhado pelo rastro. Com o
// recorte sem fundo (public/pessoa.webm), a pessoa fica sem moldura no lugar dela (o vídeo continua
// montado, invisível, só pela voz).
import { OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { alturaDoVideo, caixaCheia, caixaDaMoldura, geometriaDoRecorte } from "../layout";
import { VideoNaCaixa } from "../motor/caixa";
import type { Plano } from "../plano";

export const Pessoa: React.FC<{ plano: Plano; naTela: boolean; recorte: boolean }> = ({ plano, naTela, recorte }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const caixa = naTela ? caixaDaMoldura(plano) : caixaCheia(plano);
  const comRecorte = naTela && recorte;
  const g = comRecorte ? geometriaDoRecorte(plano, t) : null;
  return (
    <>
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={alturaDoVideo(plano)} estilo={comRecorte ? { opacity: 0, zIndex: 1 } : { zIndex: 1 }} />
      {g ? (
        <div style={{ position: "absolute", left: g.left, top: g.top, width: g.w, height: g.h, zIndex: 1 }}>
          <OffthreadVideo src={staticFile("pessoa.webm")} transparent muted style={{ width: "100%", height: "100%" }} />
        </div>
      ) : null}
    </>
  );
};
