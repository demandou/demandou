// O modelo Dossiê: em cima, o quadro de investigação (cortiça escura, 54% da tela) por onde a câmera
// viaja de pino em pino; embaixo, a pessoa numa moldura larga o vídeo inteiro. Cada momento do plano
// vira uma peça presa no quadro e o fio vermelho liga a peça nova à anterior.
import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { useTempo } from "./anim";
import { pecaAbertura, pecaComparacao, pecaCta, pecaDefinicao, pecaDestaque, pecaFrase, pecaGrafico, pecaLista, pecaNumero, pecaPergunta } from "./componentes/Blocos";
import { pecaEvidencia } from "./componentes/Evidencias";
import { AbaDoNome, caixaDaPessoa, Guias, Legenda } from "./componentes/Pessoa";
import { Quadro, Trilho } from "./componentes/Quadro";
import { rostoNaTela, VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import { montarRoteiro, type Fabrica } from "./mundo";
import type { Momento, Plano } from "./plano";
import { COR, LIMITE_APP } from "./tema";

// Um momento nunca invade o seguinte; a legenda aparece por padrão onde a peça não escreve a fala.
const COM_LEGENDA = new Set<Momento["tipo"]>(["quadro", "numero", "grafico", "comparacao"]);
const preparar = (plano: Plano): Plano => {
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  return {
    ...plano,
    momentos: ordem.map((m, i) => {
      const proximo = ordem[i + 1];
      const cortado = proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
      return cortado.legenda === undefined && COM_LEGENDA.has(cortado.tipo) ? { ...cortado, legenda: true } : cortado;
    }),
  };
};

export const fabrica: Fabrica = {
  peca: (m, plano, { letra, fim, abertura }) => {
    const um = (chegada: number, peca: ReturnType<typeof pecaNumero>) => [{ chegada, peca, chave: `${m.tipo}-${m.de}` }];
    switch (m.tipo) {
      case "quadro":
        return m.evidencias.map((ev, i) => ({
          chegada: ev.em,
          peca: pecaEvidencia(ev, letra + i, plano, m.evidencias[i + 1]?.em ?? fim),
          chave: `prova-${m.de}-${i}`,
        }));
      case "abertura":
        return um(m.de, pecaAbertura(m, plano));
      case "topicos":
      case "passos":
        return um(m.de, pecaLista(m, plano));
      case "numero":
        return um(m.de, pecaNumero(m, plano));
      case "comparacao":
        return um(m.de, pecaComparacao(m));
      case "grafico":
        return um(m.de, pecaGrafico(m, plano));
      case "destaque":
        return um(Math.max(m.de, m.em - 0.22), pecaDestaque(m, plano));
      case "definicao":
        return um(m.de, pecaDefinicao(m, plano));
      case "frase":
        return um(m.de, pecaFrase(m, plano));
      case "pergunta":
        return um(m.de, pecaPergunta(m, plano));
      case "cta":
        return um(m.em ?? m.de, pecaCta(m, plano, abertura));
    }
  },
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: bruto, guias }) => {
  const t = useTempo();
  const { fps } = useVideoConfig();
  const plano = useMemo(() => preparar(bruto), [bruto]);
  const roteiro = useMemo(() => montarRoteiro(plano, fabrica), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const caixa = caixaDaPessoa(plano);
  const videoAltura = plano.videoAltura ?? 1920;
  // a legenda fica abaixo do queixo, dentro da moldura, acima do limite do app
  const rs = rostoNaTela(caixa, plano.rosto, videoAltura, t);
  const yLegenda = Math.min(LIMITE_APP - 52, Math.max(caixa.y + 300, rs.y + rs.largura * 0.86 + 50));

  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo }}>
      <Quadro r={roteiro} t={t} />
      <Trilho />
      {/* a pessoa: a voz vem daqui, o vídeo inteiro; a cor do vídeo não muda */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} estilo={{ boxShadow: `0 0 0 5px ${COR.borda}, 0 18px 40px rgba(0,0,0,0.6)` }} />
      <AbaDoNome plano={plano} t={t} limiteX={rs.x - rs.largura * 0.68 - 18} />
      <Legenda frases={frases} t={t} y={yLegenda} />
      {guias ? <Guias caixa={caixa} rosto={rs} yLegenda={yLegenda} /> : null}
      {plano.sfx === false
        ? null
        : roteiro.sons.map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.max(0, Math.round(s.em * fps))} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
