import { type CalculateMetadataFunction, Composition } from "remotion";
import { Edicao } from "./Edicao";
import { Medir } from "./motor/Medir";
import type { Plano } from "./plano";
import planoPadrao from "./plano.json";

// Tamanho, fps e duração vêm do plano: o template se adapta ao vídeo do aluno. Esta é a versão
// deitada do Ignição (16:9, 1920×1080), para o vídeo completo do YouTube.
const metadados: CalculateMetadataFunction<{ plano: Plano; guias?: boolean }> = ({ props }) => ({
  fps: props.plano.fps,
  width: props.plano.largura,
  height: props.plano.altura,
  durationInFrames: Math.round(props.plano.duracao * props.plano.fps),
});

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Edicao"
      component={Edicao}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ plano: planoPadrao as unknown as Plano }}
      calculateMetadata={metadados}
    />
    {/* do motor: grade para medir o rosto na gravação original (usada pelo preparar.mjs) */}
    <Composition
      id="Medir"
      component={Medir}
      durationInFrames={1}
      fps={30}
      width={540}
      height={960}
      defaultProps={{ imagem: "medir/quadro-1.jpg", largura: 540, altura: 960 }}
      calculateMetadata={({ props }) => ({ width: props.largura, height: props.altura })}
    />
  </>
);
