// A pessoa: o vídeo dela numa caixa que vai do quadro cheio à moldura do espaço, seguindo o rosto.
// A voz vem deste vídeo: ele fica montado o vídeo inteiro (as cópias são mudas).
//
// A virada: uma linha de luz desce pela tela. Com `virada.video` (a mesma gravação com a roupa
// trocada por uma IA de vídeo), acima da linha já é a roupa nova e abaixo ainda a antiga, no mesmo
// instante da fala. Sem ele, acima da linha já é o enquadramento novo (o punch da virada).
import React from "react";
import { Sequence, getStaticFiles, useVideoConfig } from "remotion";
import { VideoNaCaixa, type Caixa } from "./motor/caixa";
import type { Plano } from "./plano";
import { caixaAntesDaVirada, caixaDaPessoa, progLinha, rostoDesde, viradaDo } from "./layout";
import { COR } from "./tema";

const existe = (arquivo?: string) => !!arquivo && getStaticFiles().some((f) => f.name === arquivo.replace(/^\/+/, ""));
export const DUR_LINHA = 0.6;

// a linha de luz da virada (com o brilho que desce na frente dela)
export const LinhaDeLuz: React.FC<{ t: number; de: number; cor?: string }> = ({ t, de, cor = COR.sol }) => {
  if (t < de - 0.001 || t > de + DUR_LINHA + 0.05) return null;
  const p = progLinha(t, de, DUR_LINHA);
  const y = p * 1920;
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: y - 140, width: 1080, height: 140, background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${cor}22 70%, ${cor}55 100%)`, mixBlendMode: "screen", opacity: 1 - p * 0.3 }} />
      <div style={{ position: "absolute", left: 0, top: y - 3, width: 1080, height: 6, background: `linear-gradient(90deg, ${cor}00, ${cor} 18%, #fff 50%, ${cor} 82%, ${cor}00)`, boxShadow: `0 0 24px 6px ${cor}AA, 0 0 70px 14px ${cor}55` }} />
    </>
  );
};

const Recortada: React.FC<{ y0: number; y1: number; children: React.ReactNode }> = ({ y0, y1, children }) => (
  <div style={{ position: "absolute", inset: 0, clipPath: `inset(${Math.max(0, y0)}px 0 ${Math.max(0, 1920 - y1)}px 0)` }}>{children}</div>
);

export const Pessoa: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const { fps } = useVideoConfig();
  const { caixa, p } = caixaDaPessoa(plano, t);
  const vh = plano.videoAltura ?? 1920;
  const v = viradaDo(plano);
  const comVideo = v && existe(v.video) ? v : null;
  const recorte = plano.recorte && existe(plano.recorte.video) ? plano.recorte : null;
  const moldura = recorte ? 0 : p;
  const linha = v ? progLinha(t, v.trocaEm, DUR_LINHA) : 0;
  const naLinha = v ? t >= v.trocaEm - 0.001 && t <= v.trocaEm + DUR_LINHA + 0.02 : false;
  const yLinha = linha * 1920;

  // com recorte: o fundo natural some de cima para baixo quando o espaço entra
  const varre = recorte ? Math.min(1, p / 0.55) : 0;
  const topo = -60 + varre * 2400;
  const mascara = recorte && p > 0 ? `linear-gradient(180deg, rgba(0,0,0,0) ${topo - 420}px, rgba(0,0,0,1) ${topo}px)` : undefined;
  const someFundo = recorte && varre >= 1;

  const estiloCaixa: React.CSSProperties = {
    boxShadow: moldura > 0 ? `0 30px 80px rgba(0,0,0,${0.6 * moldura}), 0 6px 18px rgba(0,0,0,${0.35 * moldura})` : undefined,
    ...(mascara ? { WebkitMaskImage: mascara, maskImage: mascara } : {}),
    opacity: someFundo ? 0 : 1,
  };

  const viradaDe = comVideo ? (comVideo.videoDe ?? 0) : 0;
  const viradaAte = comVideo ? (comVideo.videoAte ?? plano.duracao) : 0;
  const mostraVirada = comVideo && t >= comVideo.trocaEm - 0.001 && t < viradaAte;
  const antes = !comVideo && v && naLinha ? caixaAntesDaVirada(plano) : null;

  const video = (src: string, cx: Caixa, mudo: boolean, de = 0) => {
    const el = <VideoNaCaixa src={src} caixa={cx} rosto={rostoDesde(plano.rosto, de)} videoAltura={vh} mudo={mudo} estilo={estiloCaixa} />;
    if (de <= 0) return el;
    return (
      <Sequence from={Math.round(de * fps)} layout="none">
        {el}
      </Sequence>
    );
  };

  return (
    <>
      {/* o vídeo da pessoa (com a voz): sempre montado */}
      {video(plano.video, caixa, false)}
      {/* a roupa trocada: acima da linha durante a virada, inteira depois */}
      {mostraVirada && comVideo?.video ? (naLinha ? <Recortada y0={0} y1={yLinha}>{video(comVideo.video, caixa, true, viradaDe)}</Recortada> : video(comVideo.video, caixa, true, viradaDe)) : null}
      {/* sem vídeo trocado: abaixo da linha ainda é o enquadramento de antes */}
      {antes ? <Recortada y0={yLinha} y1={1920}>{video(plano.video, antes, true)}</Recortada> : null}
      {/* a moldura: borda fina clara por cima do vídeo */}
      {moldura > 0 ? (
        <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, borderRadius: caixa.raio ?? 0, boxShadow: `inset 0 0 0 ${1.5 * moldura}px rgba(255,250,240,${0.5 * moldura})`, pointerEvents: "none" }} />
      ) : null}
      {/* a pessoa recortada (vídeo com transparência) na frente das estrelas */}
      {recorte && p > 0 ? (
        <Sequence from={Math.round((recorte.de ?? 0) * fps)} layout="none">
          <VideoNaCaixa src={recorte.video} caixa={caixa} rosto={rostoDesde(plano.rosto, recorte.de ?? 0)} videoAltura={vh} mudo />
        </Sequence>
      ) : null}
      {v ? <LinhaDeLuz t={t} de={v.trocaEm} /> : null}
    </>
  );
};
