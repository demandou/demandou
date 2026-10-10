// O modelo Yap: a pessoa em quadro cheio o vídeo inteiro (reenquadrando nos cortes, seguindo o
// rosto), a legenda logo abaixo do queixo com a palavra falada em destaque, e as inserções na
// altura do peito quando ela cita algo concreto. Nada mexe na cor do vídeo.
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { zoomNoTempo } from "./camera";
import { Abertura, Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Lista, Numero, Pergunta } from "./componentes/Blocos";
import { Insercao } from "./componentes/Insercao";
import { Legenda } from "./componentes/Legenda";
import { CHEIO, VideoNaCaixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { COR, FONTE, MARGEM, SOMBRA_TEXTO, UI_BASE, UI_DIREITA, ancoraDo, medidas, prog, suave } from "./tema";

const Bloco: React.FC<{ plano: Plano; m: Momento; t: number }> = ({ plano, m, t }) => {
  switch (m.tipo) {
    case "insercao":
      return <Insercao plano={plano} m={m} t={t} />;
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

// Tarja de nome e área no começo: discreta, no alto à esquerda, acima da cabeça.
const Marca: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const { nome, area } = plano.marca ?? { nome: "", area: "" };
  if (!nome) return null;
  const primeiroCorte = (plano.cortesEm ?? []).find((c) => c > 2.2) ?? 3.6;
  const ate = Math.min(3.6, primeiroCorte);
  if (t < 0.2 || t >= ate) return null;
  const e = prog(t, 0.25, 0.4);
  const s = prog(t, ate - 0.25, 0.25, suave);
  return (
    <div style={{ position: "absolute", left: MARGEM, top: 150, display: "flex", opacity: e * (1 - s), transform: `translateX(${(1 - e) * -14}px)` }}>
      <div style={{ width: 6, borderRadius: 3, background: COR.lima, marginRight: 16 }} />
      <div style={{ fontFamily: FONTE, color: COR.branco, textShadow: SOMBRA_TEXTO, lineHeight: 1.2 }}>
        <div style={{ fontWeight: 800, fontSize: 34 }}>{nome}</div>
        {area ? <div style={{ fontWeight: 600, fontSize: 26, opacity: 0.9 }}>{area}</div> : null}
      </div>
    </div>
  );
};

// Guias de conferência (só nos stills com --guias): rosto, queixo, faixa da legenda, zona dos
// cartões e os limites da interface do app.
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
      {linha(m.queixo, "#4BE3FF", "queixo (zoom máximo)")}
      {linha(m.legTopo, "#FFD84B", "legenda")}
      {linha(m.zonaTopo, "#7CFF8A", "cartões")}
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
  // a pessoa: quadro cheio, o zoom do trecho atual, o rosto na mesma altura em qualquer zoom
  const caixa = { ...CHEIO, zoom: zoomNoTempo(plano, t), ancoraY: ancoraDo(plano) };
  const telas = momentos.filter((m) => m.tipo === "insercao" && m.forma === "tela");
  const cartoes = momentos.filter((m) => !(m.tipo === "insercao" && m.forma === "tela"));
  const sons = plano.sfx === false ? [] : momentos.filter((m) => m.tipo === "insercao");

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} />
      {telas.map((m, i) => (
        <Bloco key={`t${i}`} plano={plano} m={m} t={t} />
      ))}
      {cartoes.map((m, i) => (
        <Bloco key={`c${i}`} plano={plano} m={m} t={t} />
      ))}
      <Legenda plano={plano} />
      <Marca plano={plano} t={t} />
      {sons.map((m, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, Math.round((m.de - 0.06) * fps))} durationInFrames={Math.round(0.6 * fps)} layout="none">
          <Audio src={staticFile("sfx/entrada.wav")} volume={0.55} />
        </Sequence>
      ))}
      {guias ? <Guias plano={plano} /> : null}
    </AbsoluteFill>
  );
};
