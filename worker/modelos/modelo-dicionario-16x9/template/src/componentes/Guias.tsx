import { useVideoConfig } from "remotion";
import type { Caixa } from "../motor/caixa";
import type { Regiao } from "../layout";
import type { Plano } from "../plano";
import { FOLHA, LEGENDA_Y, LIMITE_APP, sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): rosto, caixa da pessoa,
// área do verbete, borda da folha do frontispício, legenda e o limite dos controles do player.
// No quadro deitado (16:9) a folha do frontispício é a coluna da esquerda: a guia azul vertical marca a borda
// dela, e o rosto (a cruz) tem que ficar à direita dessa linha.
export const Guias: React.FC<{ plano: Plano; caixa: Caixa; regiao: Regiao | null; topoFrontispicio: number }> = ({ plano, caixa, regiao, topoFrontispicio }) => {
  const { width, height } = useVideoConfig();
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  const cheia = caixa.w >= width - 1;
  // o rosto como está na tela (com o zoom e o deslize da caixa cheia, aproximado pelo centro do rosto)
  const z = caixa.zoom ?? 1;
  const ax = caixa.ancoraX ?? 0.5;
  const larguraVideo = width * z;
  const borda = Math.min(0, Math.max(width - larguraVideo, width * ax - plano.rosto.x * larguraVideo));
  const x = cheia ? borda + plano.rosto.x * larguraVideo : plano.rosto.x * width;
  const y = plano.rosto.y * height;
  return (
    <>
      {cheia ? (
        <>
          <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
          <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
          <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: FOLHA.w, width: 3, background: "#00E5FF", opacity: 0.8 }} />
          <div style={{ ...etiqueta, left: FOLHA.w + 12, top: 20 }}>borda da folha (frontispício) · conteúdo a partir de y {topoFrontispicio}</div>
        </>
      ) : (
        <>
          <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "4px dashed #3DDC84" }} />
          <div style={{ ...etiqueta, color: "#3DDC84", left: caixa.x + 8, top: caixa.y + 8 }}>pessoa</div>
        </>
      )}
      {regiao ? (
        <>
          <div style={{ position: "absolute", left: regiao.x, top: regiao.y, width: regiao.w, height: regiao.h, border: "3px dashed #FF9F1C" }} />
          <div style={{ ...etiqueta, color: "#FF9F1C", left: regiao.x + 8, top: regiao.y + regiao.h - 44 }}>verbete</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: 340, right: 340, top: LEGENDA_Y, height: 76, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 340, top: LEGENDA_Y - 40 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
