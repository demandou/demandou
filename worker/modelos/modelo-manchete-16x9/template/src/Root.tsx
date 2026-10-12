// Raiz do modelo Manchete: a composição Edicao (o vídeo) e a Medir (usada pelo preparar.mjs).
import { type CalculateMetadataFunction, Composition } from "remotion";
import { Edicao } from "./Edicao";
import { Medir } from "./motor/Medir";
import type { Plano } from "./plano";
import planoPadrao from "./plano.json";

const metadados: CalculateMetadataFunction<{ plano: Plano; guias?: boolean }> = ({ props }) => ({
  fps: props.plano.fps,
  width: props.plano.largura,
  height: props.plano.altura,
  durationInFrames: Math.max(1, Math.round(props.plano.duracao * props.plano.fps)),
});

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Edicao"
      component={Edicao}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ plano: planoPadrao as unknown as Plano }}
      calculateMetadata={metadados}
    />
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
