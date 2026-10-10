import React from "react";
import { Composition, Folder } from "remotion";
import { Aula81 } from "./aula81/Aula81";
import { Aula82 } from "./aula82/Aula82";

export const RemotionRoot: React.FC = () => (
  <Folder name="Aulas-avancadas">
    <Composition id="Aula82Recorte" component={Aula82} durationInFrames={450} fps={30} width={1080} height={1920} />
    <Composition id="Aula81Maquete" component={Aula81} durationInFrames={360} fps={30} width={1080} height={1920} />
  </Folder>
);
