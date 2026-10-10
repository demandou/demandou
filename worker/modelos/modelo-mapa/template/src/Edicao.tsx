import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { useTempo } from "./anim";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { Barras } from "./componentes/Barras";
import { Cartoes } from "./componentes/Cartoes";
import { Contador } from "./componentes/Contador";
import { Cta } from "./componentes/Cta";
import { Curva } from "./componentes/Curva";
import { Mapa } from "./componentes/Mapa";
import { Papel } from "./componentes/Papel";
import { Pessoa } from "./componentes/Pessoa";
import { RamoDaPessoa } from "./componentes/RamoDaPessoa";
import { Titulo } from "./componentes/Titulo";
import { Abertura } from "./componentes/Abertura";
import { Comparacao } from "./componentes/Comparacao";
import { Definicao } from "./componentes/Definicao";
import { Destaque } from "./componentes/Destaque";
import { Frase } from "./componentes/Frase";
import { Grafico } from "./componentes/Grafico";
import { Numero } from "./componentes/Numero";
import { Passos } from "./componentes/Passos";
import { Pergunta } from "./componentes/Pergunta";
import { Topicos } from "./componentes/Topicos";
import { camera, type Estacao, estacaoAtual, estacoesDoPlano, estacoesNaTela, estadosDaPessoa, ordenar } from "./layout";
import { caixaNoTempo } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Palavra, Plano } from "./plano";
import { cor, H, W } from "./tema";
import { sons } from "./sons";

// `frente`: o que fica por cima do cartão da pessoa (etiqueta de nome, fita de marcador)
const ConteudoDaEstacao: React.FC<{ e: Estacao; palavras: Palavra[]; t: number; plano: Plano; frente?: boolean }> = ({ e, palavras, t, plano, frente }) => {
  const m = e.m;
  if (!m) return null;
  if (frente && m.tipo !== "cta") return null;
  switch (m.tipo) {
    case "mapa":
      return <Mapa m={m} palavras={palavras} t={t} foco={e.tipo === "mapa-foco"} />;
    case "titulo":
      return <Titulo m={m} palavras={palavras} t={t} />;
    case "curva":
      return <Curva m={m} palavras={palavras} t={t} />;
    case "contador":
      return <Contador m={m} palavras={palavras} t={t} />;
    case "barras":
      return <Barras m={m} palavras={palavras} t={t} />;
    case "cartoes":
      return <Cartoes m={m} palavras={palavras} t={t} />;
    case "cta": {
      // o calendário do fechamento repete os marcos da curva (se houver); sem curva e sem `dias`, não há calendário
      const curva = plano.momentos.find((x) => x.tipo === "curva");
      const dias = m.dias ?? (curva && curva.tipo === "curva" ? curva.revisoes.map((r) => r.dia) : undefined);
      const inicio = curva && curva.tipo === "curva" ? curva.inicio : undefined;
      return <Cta m={m} palavras={palavras} t={t} marca={plano.marca} dias={dias} inicio={inicio} frente={frente} />;
    }
    case "abertura":
      return <Abertura m={m} palavras={palavras} t={t} />;
    case "topicos":
      return <Topicos m={m} palavras={palavras} t={t} />;
    case "passos":
      return <Passos m={m} palavras={palavras} t={t} />;
    case "numero":
      return <Numero m={m} palavras={palavras} t={t} />;
    case "comparacao":
      return <Comparacao m={m} palavras={palavras} t={t} />;
    case "grafico":
      return <Grafico m={m} palavras={palavras} t={t} />;
    case "destaque":
      return <Destaque m={m} palavras={palavras} t={t} />;
    case "definicao":
      return <Definicao m={m} palavras={palavras} t={t} />;
    case "frase":
      return <Frase m={m} palavras={palavras} t={t} />;
    case "pergunta":
      return <Pergunta m={m} palavras={palavras} t={t} />;
    default:
      return null;
  }
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => ordenar(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const estacoes = useMemo(() => estacoesDoPlano(plano), [plano]);
  const estados = useMemo(() => estadosDaPessoa(plano, estacoes), [plano, estacoes]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const listaSons = useMemo(() => sons(plano, estacoes), [plano, estacoes]);

  const cam = camera(t, estacoes);
  const atual = estacaoAtual(t, estacoes);
  const caixa = caixaNoTempo(t, estados);
  const naTela = estacoesNaTela(t, estacoes);
  const mundo: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    transformOrigin: "0 0",
    transform: `translate(${(W / 2 - cam.x * cam.zoom).toFixed(2)}px, ${(H / 2 - cam.y * cam.zoom).toFixed(2)}px) scale(${cam.zoom.toFixed(4)})`,
  };
  const estacoesDaCamada = (frente: boolean) =>
    naTela.map(({ e, opacidade }) => (
      <div key={`e-${e.indice}`} style={{ position: "absolute", left: e.origem.x, top: e.origem.y, width: W, height: H, opacity: opacidade }}>
        <ConteudoDaEstacao e={e} palavras={plano.palavras} t={t} plano={plano} frente={frente} />
      </div>
    ));

  return (
    <AbsoluteFill style={{ backgroundColor: cor.papel }}>
      <Papel cx={cam.x} cy={cam.y} zoom={cam.zoom} />
      {/* o papel com as estações; a câmera é uma translação + escala */}
      <div style={mundo}>{estacoesDaCamada(false)}</div>

      {/* a pessoa: um cartão só, montado o vídeo inteiro (é ele que carrega a voz) */}
      <RamoDaPessoa e={atual} caixa={caixa} cam={cam} t={t} />
      <Pessoa caixa={caixa} src={plano.video} rosto={plano.rosto} videoAltura={videoAltura} />
      <div style={mundo}>{estacoesDaCamada(true)}</div>

      <Legendas frases={frases} estacoes={estacoes} t={t} />
      {guias ? <Guias plano={plano} caixa={caixa} /> : null}

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
