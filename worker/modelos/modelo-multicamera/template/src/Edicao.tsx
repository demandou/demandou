// O modelo Multicâmera: a pessoa em quadro cheio, cortada entre duas câmeras virtuais (aberta e
// fechada) em cada corte e em cada capítulo, sempre seguindo o rosto; a "câmera C" com a imagem do
// que é citado em tela cheia; títulos de capítulo em tarja; o pacote gráfico grafite no terço de
// baixo; legenda mínima. Nada mexe na cor do vídeo.
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { zoomNoTempo } from "./camera";
import { Capitulo, Cena, Marca } from "./componentes/Assinatura";
import { Abertura, Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Lista, Numero, Pergunta } from "./componentes/Blocos";
import { Legenda } from "./componentes/Legenda";
import { CHEIO, VideoNaCaixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { FONTE, LEG_BASE, UI_BASE, UI_DIREITA, ancoraDo, medidas } from "./tema";

const Bloco: React.FC<{ plano: Plano; m: Momento; t: number }> = ({ plano, m, t }) => {
  switch (m.tipo) {
    case "cena":
      return <Cena plano={plano} m={m} t={t} />;
    case "capitulo":
      return <Capitulo plano={plano} m={m} t={t} />;
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

// Guias de conferência (só nos stills com --guias): rosto, queixo no plano fechado, zona das
// tarjas, legenda e os limites da interface do app.
const Guias: React.FC<{ plano: Plano }> = ({ plano }) => {
  const m = medidas(plano);
  const linha = (y: number, cor: string, rotulo: string) => (
    <div style={{ position: "absolute", left: 0, top: y, width: 1080, borderTop: `3px dashed ${cor}` }}>
      <span style={{ position: "absolute", left: 12, top: 4, fontFamily: FONTE, fontSize: 24, fontWeight: 700, color: cor }}>{rotulo}</span>
    </div>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: m.rostoX - m.rostoL / 2, top: m.rostoY - m.rostoL * 0.62, width: m.rostoL, height: m.rostoL * 1.32, border: "4px solid #4BE3FF", borderRadius: "45%" }} />
      {linha(m.queixo, "#4BE3FF", "queixo (plano fechado)")}
      {linha(m.zonaTopo, "#7CFF8A", "tarjas e painéis")}
      {linha(m.baseComLegenda, "#7CFF8A", "base das tarjas (com legenda)")}
      {linha(LEG_BASE - 124, "#FFD84B", "legenda")}
      {linha(UI_BASE, "#FF6B6B", "interface do app")}
      <div style={{ position: "absolute", left: UI_DIREITA, top: 1100, width: 1080 - UI_DIREITA, height: 820, background: "rgba(255,107,107,0.25)" }} />
    </AbsoluteFill>
  );
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  // a pessoa: quadro cheio, a câmera do trecho atual, a linha dos olhos na mesma altura
  const caixa = { ...CHEIO, zoom: zoomNoTempo(plano, t), ancoraY: ancoraDo(plano) };
  const cenas = momentos.filter((m) => m.tipo === "cena");
  const pecas = momentos.filter((m) => m.tipo !== "cena");
  const sons = plano.sfx === false ? [] : cenas;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} />
      {cenas.map((m, i) => (
        <Bloco key={`c${i}`} plano={plano} m={m} t={t} />
      ))}
      {pecas.map((m, i) => (
        <Bloco key={`p${i}`} plano={plano} m={m} t={t} />
      ))}
      <Legenda plano={plano} />
      <Marca plano={plano} t={t} />
      {sons.map((m, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, Math.round((m.de - 0.03) * fps))} durationInFrames={Math.round(0.7 * fps)} layout="none">
          <Audio src={staticFile("sfx/corte.wav")} volume={0.5} />
        </Sequence>
      ))}
      {guias ? <Guias plano={plano} /> : null}
    </AbsoluteFill>
  );
};
