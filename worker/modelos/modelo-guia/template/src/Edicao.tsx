// O modelo Guia: o apresentador é um recorte sem fundo, sempre na metade de baixo (ou encolhido
// no topo), sobre uma tela clara que troca com corte seco a cada 3 a 6 s: o infográfico-estrada com
// zoom na etapa, o print com seta vermelha, pílulas de arquivo, números, diagramas, o CTA.
// Sem legenda, sem transição, sem filtro na pessoa.
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Pessoa, Voz } from "./componentes/Pessoa";
import { TelaMapa } from "./componentes/Mapa";
import { TelaPrint } from "./componentes/Print";
import { TelaAbertura, TelaComparacao, TelaCta, TelaDefinicao, TelaDestaque, TelaFrase, TelaGrafico, TelaNumero, TelaPassos, TelaPergunta, TelaTopicos } from "./componentes/Telas";
import type { Momento, Plano } from "./plano";
import { poseNoTempo, trocasDePose } from "./poses";
import { COR, UI_BASE, UI_DIREITA } from "./tema";

const Tela: React.FC<{ plano: Plano; m: Momento; t: number; topo: boolean }> = ({ plano, m, t, topo }) => {
  switch (m.tipo) {
    case "mapa":
      return plano.mapa ? <TelaMapa mapa={plano.mapa} m={m} t={t} /> : null;
    case "print":
      return <TelaPrint plano={plano} m={m} t={t} topo={topo} />;
    case "abertura":
      return <TelaAbertura plano={plano} m={m} t={t} />;
    case "topicos":
      return <TelaTopicos plano={plano} m={m} t={t} />;
    case "passos":
      return <TelaPassos plano={plano} m={m} t={t} />;
    case "numero":
      return <TelaNumero plano={plano} m={m} t={t} />;
    case "comparacao":
      return <TelaComparacao plano={plano} m={m} t={t} />;
    case "grafico":
      return <TelaGrafico plano={plano} m={m} t={t} />;
    case "destaque":
      return <TelaDestaque plano={plano} m={m} t={t} />;
    case "definicao":
      return <TelaDefinicao plano={plano} m={m} t={t} />;
    case "frase":
      return <TelaFrase plano={plano} m={m} t={t} />;
    case "pergunta":
      return <TelaPergunta plano={plano} m={m} t={t} />;
    case "cta":
      return <TelaCta plano={plano} m={m} t={t} />;
    default:
      return null;
  }
};

// Guias de conferência (só nos stills com --guias): a cabeça fica entre 50% e 70% da altura.
const Guias: React.FC = () => (
  <AbsoluteFill style={{ zIndex: 9 }}>
    {[
      [0.5, "#4BE3FF", "cabeça 50%"],
      [0.7, "#4BE3FF", "cabeça 70%"],
      [UI_BASE / 1920, "#FF6B6B", "interface do app"],
    ].map(([f, cor, r]) => (
      <div key={String(r)} style={{ position: "absolute", left: 0, top: Number(f) * 1920, width: 1080, borderTop: `3px dashed ${cor}` }}>
        <span style={{ position: "absolute", left: 12, top: 4, fontSize: 24, fontWeight: 700, color: String(cor) }}>{String(r)}</span>
      </div>
    ))}
    {[64, 1016].map((x) => (
      <div key={x} style={{ position: "absolute", top: 0, left: x, height: 1920, borderLeft: "3px dashed #FFB84B" }} />
    ))}
    <div style={{ position: "absolute", left: 0, top: 120, width: 1080, borderTop: "3px dashed #FFB84B" }} />
    <div style={{ position: "absolute", left: UI_DIREITA, top: 1100, width: 1080 - UI_DIREITA, height: 820, background: "rgba(255,107,107,0.25)" }} />
  </AbsoluteFill>
);

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const trocas = trocasDePose(plano);
  const pose = poseNoTempo(trocas, t);
  const ativos = momentos.filter((m) => t >= m.de - 1e-6 && t < m.ate);
  const sons = plano.sfx === false ? [] : momentos.filter((m) => m.tipo === "mapa" && m.foco !== undefined);

  return (
    <AbsoluteFill style={{ backgroundColor: COR.papel }}>
      {/* a voz vem do vídeo original, montado o tempo todo e invisível */}
      <Voz plano={plano} />
      <AbsoluteFill style={{ zIndex: pose.frente ? 2 : 0 }}>
        {ativos.map((m, i) => (
          <Tela key={`${m.tipo}-${m.de}-${i}`} plano={plano} m={m} t={t} topo={pose.frente} />
        ))}
      </AbsoluteFill>
      <Pessoa plano={plano} trocas={trocas} z={1} />
      {sons.map((m, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, Math.round((m.de - 0.02) * fps))} durationInFrames={Math.round(0.6 * fps)} layout="none">
          <Audio src={staticFile("sfx/entrada.wav")} volume={0.3} />
        </Sequence>
      ))}
      {guias ? <Guias /> : null}
    </AbsoluteFill>
  );
};
