import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { limitar, prog, useTempo } from "./anim";
import { ehFechamento, partesDaChamada } from "./chamada";
import { Abertura } from "./componentes/Abertura";
import { Capitulos } from "./componentes/Capitulos";
import { Citacao } from "./componentes/Citacao";
import { Comparacao } from "./componentes/Comparacao";
import { Definicao } from "./componentes/Definicao";
import { Destaque } from "./componentes/Destaque";
import { Entrevista } from "./componentes/Entrevista";
import { Grafico } from "./componentes/Grafico";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { Numero } from "./componentes/Numero";
import { FaixaDaOnda } from "./componentes/Onda";
import { Pauta } from "./componentes/Pauta";
import { FundoDoPlayer, Player } from "./componentes/Player";
import { Quadro } from "./componentes/Quadro";
import { Regua } from "./componentes/Regua";
import { Trilha } from "./componentes/Trilha";
import {
  alturaDaOnda,
  CAMERAS,
  cameraEm,
  camerasAuto,
  type Capitulo,
  capitulos,
  cartoesVizinhos,
  chegada,
  estadosDoQuadro,
  fimDe,
  type Layout,
  ordenar,
  quadroDe,
  semCortarCabeca,
  type Trecho,
  trechoEm,
  trechos,
  VAO_ONDA,
} from "./layout";
import { caixaNoTempo, CHEIO_16x9, VideoNaCaixa } from "./motor/caixa";
import { corrigirPalavras, montarFrases } from "./motor/frases";
import { ondaDoPlano } from "./onda";
import type { Momento, Pergunta, Plano, Resposta } from "./plano";
import { comAlfa, cor, H, LEGENDA_BASE, TOPO, W } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Som raro e tonal: um tom grave quando o quadro recua para o estúdio, uma nota por capítulo novo
// (subindo de altura), uma nota mais aguda e curta no marco da trilha e na placa de alerta, e duas
// notas no botão do fechamento. Nada em cima de outro som (mínimo de 0,45 s entre eles).
const sons = (plano: Plano, caps: Capitulo[]): Som[] => {
  const lista: Som[] = [{ em: 0.1, arquivo: "sfx/abre.wav", volume: 0.42 }];
  caps.slice(1).forEach((c, i) => lista.push({ em: Math.max(0, c.de - 0.08), arquivo: `sfx/capitulo-${(i % 3) + 1}.wav`, volume: 0.36 }));
  for (const m of plano.momentos) {
    if (m.tipo === "trilha" && m.marco) lista.push({ em: m.marco.em, arquivo: "sfx/marco.wav", volume: 0.34 });
    if (m.tipo === "destaque" && m.nivel === "alerta") lista.push({ em: m.em, arquivo: "sfx/marco.wav", volume: 0.3 });
    if (ehFechamento(m)) {
      const { botao } = partesDaChamada(m);
      const alvo = (botao ?? "").split(/\s+/)[0].replace(/[^\p{L}]/gu, "").toLowerCase();
      const em = m.seguirEm ?? plano.palavras.find((p) => p.em >= m.de && p.w.replace(/[^\p{L}]/gu, "").toLowerCase() === alvo)?.em;
      if (em !== undefined && alvo) lista.push({ em, arquivo: "sfx/seguir.wav", volume: 0.4 });
    }
  }
  const saida: Som[] = [];
  for (const s of lista.sort((a, b) => a.em - b.em)) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

// Onde fica a legenda em cada layout (null = o layout já mostra a fala, sem legenda). Ancorada pela
// base, na área segura de baixo: na tela cheia, centrada e mais estreita que o quadro (linha que o
// olho lê sem atravessar a tela); na trilha, na largura do quadro da esquerda, embaixo da trilha.
export type LugarDaLegenda = { x: number; w: number; base: number };
const LARGURA_LEGENDA = 1480;
const legendaEm = (layout: Layout): LugarDaLegenda | null => {
  if (layout === "palco") return { x: (W - LARGURA_LEGENDA) / 2, w: LARGURA_LEGENDA, base: LEGENDA_BASE };
  if (layout === "trilha") {
    const a = quadroDe("trilha");
    return { x: a.x, w: a.w, base: LEGENDA_BASE };
  }
  return null;
};

const ehEntrevista = (m?: Momento): m is Pergunta | Resposta => m?.tipo === "pergunta" || m?.tipo === "resposta";

// perguntas e respostas coladas dividem um cartão só
const gruposDeEntrevista = (plano: Plano) => {
  const grupos: (Pergunta | Resposta)[][] = [];
  let anterior: Momento | undefined;
  for (const m of plano.momentos) {
    if (ehEntrevista(m)) {
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && anterior === ultimo[ultimo.length - 1] && Math.abs(m.de - anterior.ate) < 0.35) ultimo.push(m);
      else grupos.push([m]);
    }
    anterior = m;
  }
  return grupos;
};

// camadas: o que fica em volta do quadro (2) < cartões opacos que cobrem o que sai (3) < textos do
// player (4) < o quadro da pessoa (5) < a onda e a régua do episódio (6) < a legenda (7)
const camada = (z: number, children: React.ReactNode, chave: string) => (
  <div key={chave} style={{ position: "absolute", inset: 0, zIndex: z }}>
    {children}
  </div>
);

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => ordenar(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const palavras = useMemo(() => corrigirPalavras(plano.palavras, plano.correcoes), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const lista = useMemo(() => trechos(plano), [plano]);
  const estados = useMemo(() => estadosDoQuadro(plano, lista), [plano, lista]);
  const cams = useMemo(() => (plano.cameras?.length ? [...plano.cameras].sort((a, b) => a.em - b.em) : camerasAuto(plano, lista)), [plano, lista]);
  const caps = useMemo(() => capitulos(plano), [plano]);
  const onda = useMemo(() => ondaDoPlano(plano), [plano]);
  const listaSons = useMemo(() => sons(plano, caps), [plano, caps]);

  // o quadro da pessoa agora: lugar do layout × câmera (a capa do player não troca de câmera)
  const trecho: Trecho = trechoEm(t, lista);
  const pesoPlayer = trecho.layout === "player" ? chegada(t, estados) : 0;
  const camera = cameraEm(t, cams);
  const c = CAMERAS[camera];
  const base = caixaNoTempo(t, estados, CHEIO_16x9);
  // depois de recuar para o estúdio, o cabelo e o queixo nunca saem do quadro
  const comCamera = {
    ...base,
    zoom: (base.zoom ?? 1) * (1 + (c.zoom - 1) * (1 - pesoPlayer)),
    ancoraY: (base.ancoraY ?? 0.3) + c.ancora * (1 - pesoPlayer),
  };
  const caixa = t < 0.04 ? comCamera : semCortarCabeca(comCamera, plano, base.zoom ?? 1);
  // instante da última troca de câmera (a luz de "no ar" pisca)
  let trocouEm = -10;
  cams.forEach((k, i) => {
    if (k.em <= t && i > 0 && k.plano !== cameraEm(k.em - 0.001, cams)) trocouEm = k.em;
  });
  // a etiqueta da câmera aparece depois que o quadro recua para o estúdio e some na capa do player
  const etiqueta = prog(t, 0.5, 0.3) * (1 - pesoPlayer);
  const onda_h = alturaDaOnda(t, estados);

  const ativos = plano.momentos.filter((m) => t >= m.de - 0.35 && t <= fimDe(m, plano) + 0.7);
  const grupos = useMemo(() => gruposDeEntrevista(plano), [plano]);

  const lugarLegenda = legendaEm(trecho.layout);
  // a legenda espera o quadro (e o cartão que sai) terminarem de trocar de lugar
  const visLegenda = lugarLegenda === null ? 0 : Math.min(1, Math.max(0, (chegada(t, estados) - 0.7) / 0.3));
  // quanto a pessoa está em tela cheia (1 = o vídeo cobre o alto da tela): a régua e a legenda ganham
  // uma sombra suave por baixo, para ler sobre o vídeo; na moldura, o estúdio escuro já basta
  const telaCheia = limitar(1 - caixa.y / TOPO);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${cor.fundo} 0%, ${cor.fundo} 55%, ${cor.fundoBaixo} 100%)` }}>
      {/* 2. o que fica ao redor do quadro: aparece por trás dele quando ele muda de lugar */}
      {ativos.map((m) => {
        const fim = fimDe(m, plano);
        const chave = `${m.tipo}-${m.de}`;
        // o quadro que sobe do pé da tela passa pela faixa de texto: o texto espera ele passar
        const k = lista.findIndex((tr) => tr.momento === m);
        const atraso = k > 0 && lista[k - 1].layout === "baixo" ? 0.22 : 0.04;
        switch (m.tipo) {
          case "abertura":
            return camada(2, <Abertura m={m} palavras={palavras} t={t} fim={fim} />, chave);
          case "trilha":
            return camada(2, <Trilha m={m} palavras={palavras} t={t} fim={fim} />, chave);
          case "citacao":
          case "frase":
            return camada(2, <Citacao m={m} palavras={palavras} t={t} fim={fim} atraso={atraso} />, chave);
          case "destaque":
            return camada(2, <Destaque m={m} palavras={palavras} t={t} fim={fim} atraso={atraso} />, chave);
          case "definicao":
            return camada(2, <Definicao m={m} palavras={palavras} t={t} fim={fim} atraso={atraso} />, chave);
          case "numero":
            return camada(2, <Numero m={m} palavras={palavras} t={t} fim={fim} />, chave);
          case "passos":
            return camada(2, <Capitulos m={m} palavras={palavras} t={t} fim={fim} />, chave);
          case "grafico":
            return camada(2, <Grafico m={m} t={t} fim={fim} />, chave);
          case "topicos":
            return camada(3, <Pauta m={m} plano={plano} palavras={palavras} t={t} fim={fim} {...cartoesVizinhos(plano, m.de, fim)} />, chave);
          case "comparacao":
            return camada(3, <Comparacao m={m} palavras={palavras} t={t} fim={fim} {...cartoesVizinhos(plano, m.de, fim)} />, chave);
          case "player":
          case "cta":
            return (
              <div key={chave}>
                {camada(3, <FundoDoPlayer m={m} t={t} fim={fim} />, "fundo")}
                {camada(4, <Player m={m} plano={plano} palavras={palavras} t={t} fim={fim} />, "player")}
              </div>
            );
          default:
            return null;
        }
      })}
      {grupos.map((g) => {
        const ultimo = g[g.length - 1];
        const fim = fimDe(ultimo, plano);
        if (t < g[0].de - 0.4 || t > fim + 0.7) return null;
        const antes = plano.momentos.filter((o) => o.de < g[0].de && o.tipo === "pergunta").pop();
        return camada(
          3,
          <Entrevista
            grupo={g}
            perguntaAntes={antes?.tipo === "pergunta" ? antes.texto : undefined}
            palavras={palavras}
            t={t}
            fim={fim}
            {...cartoesVizinhos(plano, g[0].de, fim)}
          />,
          `entrevista-${g[0].de}`,
        );
      })}

      {/* 3. a pessoa: um quadro só, montado o vídeo inteiro (é ele que carrega a voz) */}
      {camada(
        5,
        <>
          <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(0.97)" />
          <Quadro caixa={caixa} camera={camera} trocouEm={trocouEm} t={t} etiqueta={etiqueta} />
        </>,
        "pessoa",
      )}

      {/* 4. a onda do áudio, presa embaixo do quadro (na tela cheia ela recolhe) */}
      {camada(6, <FaixaDaOnda onda={onda} t={t} x={caixa.x} y={caixa.y + caixa.h + VAO_ONDA} w={caixa.w} h={onda_h} opacidade={prog(t, 0.3, 0.4)} />, "onda")}

      {/* 5. a régua do episódio, no alto, por cima de tudo: na moldura ela fica no estúdio escuro; na
          tela cheia, sobre uma sombra suave que desce do alto */}
      {camada(
        6,
        <>
          {telaCheia > 0.01 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: W,
                height: 250,
                background: `linear-gradient(to bottom, ${comAlfa(cor.fundo, 0.74)} 0%, ${comAlfa(cor.fundo, 0.42)} 52%, ${comAlfa(cor.fundo, 0)} 100%)`,
                opacity: telaCheia,
              }}
            />
          ) : null}
          <div style={{ position: "absolute", inset: 0, opacity: prog(t, 0.1, 0.4) }}>
            <Regua plano={plano} capitulos={caps} t={t} />
          </div>
        </>,
        "regua",
      )}

      {/* 6. legenda (só na tela cheia e na trilha), na área segura de baixo */}
      {lugarLegenda !== null ? (
        camada(
          7,
          <>
            {telaCheia > 0.01 ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: H - 320,
                  width: W,
                  height: 320,
                  background: `linear-gradient(to top, ${comAlfa(cor.fundo, 0.78)} 0%, ${comAlfa(cor.fundo, 0.46)} 48%, ${comAlfa(cor.fundo, 0)} 100%)`,
                  opacity: telaCheia * visLegenda,
                }}
              />
            ) : null}
            <Legendas frases={frases} t={t} x={lugarLegenda.x} largura={lugarLegenda.w} base={lugarLegenda.base} visivel={visLegenda} />
          </>,
          "legenda",
        )
      ) : null}

      {guias ? camada(8, <Guias plano={plano} caixa={caixa} legenda={lugarLegenda} />, "guias") : null}

      {plano.sfx === false
        ? null
        : listaSons.map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.max(0, Math.round(s.em * fps))} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
