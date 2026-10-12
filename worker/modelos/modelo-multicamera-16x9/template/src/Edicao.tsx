// O modelo Multicâmera no quadro deitado (16:9, 1920×1080): a pessoa em tela cheia, cortada entre
// duas câmeras virtuais (aberta e fechada) em cada corte e em cada capítulo, sempre seguindo o
// rosto; a "câmera C" com a imagem do que é citado em tela cheia; títulos de capítulo em tarja; o
// pacote gráfico grafite no terço de baixo; legenda mínima. Pela aula 9 do curso, os blocos que
// pedem apoio visual levam a pessoa para a moldura da direita e abrem o painel no quadro da
// esquerda (moldura.ts). Nada mexe na cor do vídeo.
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Capitulo, Cena, Marca } from "./componentes/Assinatura";
import { Abertura, Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Lista, Numero, Pergunta } from "./componentes/Blocos";
import { Legenda } from "./componentes/Legenda";
import { caixaDaPessoa, lugarDaLegenda, naMoldura, pessoaNaMoldura } from "./moldura";
import { VideoNaCaixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { AREA_QUADRO, COR, FONTE, LARGURA_UTIL, LEG_BASE, MARGEM, MOLDURA, QUADRO, UI_BASE, UI_DIREITA, medidas, rostoDeitado } from "./tema";

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
// tarjas, legenda, a moldura e o quadro da esquerda, e os limites do player.
const Guias: React.FC<{ plano: Plano }> = ({ plano }) => {
  const m = medidas(plano);
  const linha = (y: number, cor: string, rotulo: string) => (
    <div style={{ position: "absolute", left: 0, top: y, width: QUADRO.w, borderTop: `3px dashed ${cor}` }}>
      <span style={{ position: "absolute", left: 12, top: 4, fontFamily: FONTE, fontSize: 22, fontWeight: 700, color: cor }}>{rotulo}</span>
    </div>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: m.rostoX - m.rostoL / 2, top: m.rostoY - m.rostoL * 0.62, width: m.rostoL, height: m.rostoL * 1.32, border: "4px solid #4BE3FF", borderRadius: "45%" }} />
      {linha(m.queixo, "#4BE3FF", "queixo (plano fechado)")}
      {linha(m.zonaTopo, "#7CFF8A", "tarjas e painéis")}
      {linha(m.baseComLegenda, "#7CFF8A", "base das tarjas (com legenda)")}
      {linha(LEG_BASE - 112, "#FFD84B", "legenda")}
      {linha(UI_BASE, "#FF6B6B", "controles do player")}
      <div style={{ position: "absolute", left: MARGEM, top: 0, width: LARGURA_UTIL, height: QUADRO.h, borderLeft: "2px dashed #7CFF8A", borderRight: "2px dashed #7CFF8A" }} />
      <div style={{ position: "absolute", left: AREA_QUADRO.x, top: AREA_QUADRO.y, width: AREA_QUADRO.w, height: AREA_QUADRO.base - AREA_QUADRO.y, border: "3px dashed #C08BFF" }} />
      <div style={{ position: "absolute", left: MOLDURA.x, top: 0, width: MOLDURA.w, height: QUADRO.h, border: "3px dashed #4BE3FF" }} />
      <div style={{ position: "absolute", left: UI_DIREITA, top: 0, width: QUADRO.w - UI_DIREITA, height: QUADRO.h, background: "rgba(255,107,107,0.18)" }} />
    </AbsoluteFill>
  );
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  // a pessoa: a câmera do trecho atual, em tela cheia ou na moldura da direita
  const caixa = caixaDaPessoa(plano, t);
  const p = naMoldura(plano, t);
  const cenas = momentos.filter((m) => m.tipo === "cena");
  const noQuadro = momentos.filter((m) => m.tipo !== "cena" && pessoaNaMoldura(m));
  const noTerco = momentos.filter((m) => m.tipo !== "cena" && !pessoaNaMoldura(m));
  const sons = plano.sfx === false ? [] : cenas;
  const legenda = lugarDaLegenda(plano, t);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* o quadro da esquerda fica embaixo da pessoa: ela desliza para a moldura revelando o painel
          e volta para a tela cheia cobrindo. O fundo e o painel andam junto com a emenda. */}
      {p > 0 ? (
        <div style={{ position: "absolute", inset: 0, transform: p < 1 ? `translateX(${caixa.x - MOLDURA.x}px)` : undefined }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: MOLDURA.x, height: QUADRO.h, background: COR.trilho }} />
          {noQuadro.map((m, i) => (
            <Bloco key={`q${i}`} plano={plano} m={m} t={t} />
          ))}
        </div>
      ) : null}
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={rostoDeitado(plano)} videoAltura={plano.videoAltura ?? QUADRO.h} />
      {/* a emenda entre o quadro e a moldura: a luz vermelha de "no ar", na vertical */}
      {p > 0.01 ? <div style={{ position: "absolute", left: caixa.x - 3, top: 0, width: 6, height: QUADRO.h, background: COR.tally, opacity: Math.min(1, p * 2) }} /> : null}
      {cenas.map((m, i) => (
        <Bloco key={`c${i}`} plano={plano} m={m} t={t} />
      ))}
      {noTerco.map((m, i) => (
        <Bloco key={`p${i}`} plano={plano} m={m} t={t} />
      ))}
      <Legenda plano={plano} cx={legenda.cx} largura={legenda.largura} />
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
