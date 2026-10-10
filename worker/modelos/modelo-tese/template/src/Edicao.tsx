// O modelo Tese: o Reel de opinião em tela dividida do começo ao fim: a informação na faixa de cima
// (45% da altura), a pessoa bem centralizada embaixo; rosto fechado em tela cheia nas viradas.
// A mesma câmera reenquadrada, sempre seguindo o rosto.
// Legenda minúscula branca com contorno, fixa em y 1610. Sem transição, sem efeito sonoro,
// sem filtro: a cor do vídeo nunca muda.
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Cena } from "./componentes/Assinatura";
import { Abertura, Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Lista, Numero, Pergunta } from "./componentes/Blocos";
import { Legenda } from "./componentes/Legenda";
import { layoutEm } from "./layout";
import { CHEIO, VideoNaCaixa, type Caixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { ANCORA_FECHADO, ANCORA_SPLIT, FONTE, LEG_Y, PESSOA_H, PESSOA_Y, TOPO_H, zoomFechado, zoomSplit } from "./tema";

const Bloco: React.FC<{ plano: Plano; m: Momento; t: number }> = ({ plano, m, t }) => {
  switch (m.tipo) {
    case "cena":
      return <Cena plano={plano} m={m} t={t} />;
    case "abertura":
      return <Abertura plano={plano} m={m} t={t} />;
    case "frase":
      return <Frase plano={plano} m={m} t={t} />;
    case "cta":
      return <Cta plano={plano} m={m} t={t} />;
    case "pergunta":
      return <Pergunta plano={plano} m={m} t={t} />;
    case "numero":
      return <Numero plano={plano} m={m} t={t} />;
    case "destaque":
      return <Destaque plano={plano} m={m} t={t} />;
    case "definicao":
      return <Definicao plano={plano} m={m} t={t} />;
    case "comparacao":
      return <Comparacao plano={plano} m={m} t={t} />;
    case "topicos":
    case "passos":
      return <Lista plano={plano} m={m} t={t} />;
    case "grafico":
      return <Grafico plano={plano} m={m} t={t} />;
    default:
      return null;
  }
};

// Guias de conferência (só nos stills com --guias): a divisão 50/50, o rosto e a legenda.
const Guias: React.FC<{ plano: Plano }> = ({ plano }) => {
  const linha = (y: number, cor: string, rotulo: string) => (
    <div style={{ position: "absolute", left: 0, top: y, width: 1080, borderTop: `3px dashed ${cor}` }}>
      <span style={{ position: "absolute", left: 12, top: 4, fontFamily: FONTE, fontSize: 24, fontWeight: 700, color: cor }}>{rotulo}</span>
    </div>
  );
  return (
    <AbsoluteFill>
      {linha(TOPO_H, "#4BE3FF", "base da faixa de cima (45%)")}
      {linha(120, "#7CFF8A", "topo seguro (120)")}
      {linha(1700, "#FF6B6B", "rodapé do app (1700)")}
      <div style={{ position: "absolute", left: 64, top: 0, width: 2, height: 1920, background: "rgba(124,255,138,0.6)" }} />
      <div style={{ position: "absolute", left: 1016, top: 0, width: 2, height: 1920, background: "rgba(124,255,138,0.6)" }} />
      {linha(LEG_Y, "#FFD84B", "centro da legenda (y 1610)")}
      <div style={{ position: "absolute", left: 539, top: 0, width: 2, height: 1920, background: "rgba(75,227,255,0.6)" }} />
    </AbsoluteFill>
  );
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const layout = layoutEm(plano, t);
  // a pessoa: o enquadramento muda no corte, nunca durante (sem zoom animado)
  const caixa: Caixa =
    layout === "split"
      ? { x: 0, y: PESSOA_Y, w: 1080, h: PESSOA_H, zoom: zoomSplit(plano), ancoraY: ANCORA_SPLIT }
      : { ...CHEIO, zoom: zoomFechado(plano), ancoraY: ANCORA_FECHADO };
  const vh = plano.videoAltura ?? 1920;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={vh} />
      {momentos.map((m, i) => (
        <Bloco key={i} plano={plano} m={m} t={t} />
      ))}
      <Legenda plano={plano} />
      {guias ? <Guias plano={plano} /> : null}
    </AbsoluteFill>
  );
};
