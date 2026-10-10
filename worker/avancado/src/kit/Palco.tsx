import React, { useMemo } from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile } from "remotion";
import { CamadaDoApresentador, medirApresentador, ProvedorDoApresentador, resolverQuadros } from "./apresentador";
import { DADOS, DURACAO } from "./dados";
import { Fundo } from "./Fundo";
import { Legenda } from "./Legenda";
import { LETRA } from "./letra";
import { MARCA } from "./marca";
import { emSegundos, type Roteiro } from "./roteiro";
import { k, MEIO, mix, useTempo } from "./tempo";

/**
 * O PALCO: a composição do corte, montada pelo kit a partir do roteiro e das
 * cenas. As camadas, de trás para frente (aula 8.2: "fundo de estúdio gráfico,
 * palavras ao fundo, apresentador recortado no meio e pequenos elementos à
 * frente"):
 *
 *   1. fundo da marca                      (paralaxe 0,35)
 *   2. Atras de cada cena ativa            (paralaxe 0,7): o recorte cobre de verdade
 *   3. o apresentador e a moldura          (paralaxe 0,2)
 *   4. Frente de cada cena ativa           (paralaxe 1,0)
 *   5. a legenda                           (parada)
 *   6. a voz
 *
 * A paralaxe é UMA câmera lenta, o mesmo deslocamento multiplicado pela
 * profundidade de cada camada (deslocamentos curtos e coerentes).
 */
export type CenaProps = {
  /** O começo e o fim da cena no corte (segundos), já resolvidos pela fala. */
  de: number;
  ate: number;
};

export type ModuloDeCena = {
  Atras?: React.FC<CenaProps>;
  Frente?: React.FC<CenaProps>;
};

export const Palco: React.FC<{ roteiro: Roteiro; cenas: Record<string, ModuloDeCena> }> = ({ roteiro, cenas }) => {
  const { f, t } = useTempo();
  const quadros = useMemo(() => resolverQuadros(roteiro.apresentador), [roteiro]);
  const lista = useMemo(
    () => roteiro.cenas.map((c) => ({ arquivo: c.arquivo, de: emSegundos(c.de), ate: emSegundos(c.ate, DURACAO) })),
    [roteiro]
  );
  const desenho = medirApresentador(f, t, quadros);
  const forca = roteiro.paralaxe ?? 1;
  const cam = { x: mix(-1, 1, k(t, 0, DURACAO, MEIO)) * 20 * forca, y: Math.sin((t / Math.max(1, DURACAO)) * Math.PI) * -12 * forca };
  const desl = (fator: number) => `${Math.round(cam.x * fator)}px ${Math.round(cam.y * fator)}px`;
  const ativas = lista.filter((c) => t >= c.de && t < c.ate);
  const camada = (lado: "Atras" | "Frente") =>
    ativas.map((c) => {
      const Componente = cenas[c.arquivo]?.[lado];
      return Componente ? (
        <AbsoluteFill key={`${lado}-${c.arquivo}`}>
          <Componente de={c.de} ate={c.ate} />
        </AbsoluteFill>
      ) : null;
    });
  const L = roteiro.legenda;
  return (
    <AbsoluteFill style={{ backgroundColor: MARCA.fundoProfundo, fontFamily: LETRA.texto, overflow: "hidden" }}>
      <ProvedorDoApresentador valor={desenho.apresentador}>
        <AbsoluteFill style={{ translate: desl(0.35) }}>
          <Fundo tipo={roteiro.fundo ?? "estudio"} />
        </AbsoluteFill>
        <AbsoluteFill style={{ translate: desl(0.7) }}>{camada("Atras")}</AbsoluteFill>
        <AbsoluteFill style={{ translate: desl(0.2) }}>
          <CamadaDoApresentador desenho={desenho} />
        </AbsoluteFill>
        <AbsoluteFill style={{ translate: desl(1) }}>{camada("Frente")}</AbsoluteFill>
        <Legenda palavras={DADOS.palavras} topo={L.topo} esquerda={L.esquerda} largura={L.largura} tamanho={L.tamanho} alinhar={L.alinhar} maxLetras={L.maxLetras} />
      </ProvedorDoApresentador>
      <Audio src={staticFile("voz.wav")} />
    </AbsoluteFill>
  );
};
