import React from "react";
import { Composition } from "remotion";
import { DADOS } from "./kit/dados";
import { Palco } from "./kit/Palco";
import { CENAS, ROTEIRO } from "./cenas/indice";

/** O corte inteiro: o palco do kit com o roteiro e as cenas escritas para esta fala. */
const Corte: React.FC = () => <Palco roteiro={ROTEIRO} cenas={CENAS} />;

export const Raiz: React.FC = () => (
  <Composition id="Corte" component={Corte} durationInFrames={DADOS.quadros} fps={DADOS.fps} width={DADOS.largura} height={DADOS.altura} />
);
