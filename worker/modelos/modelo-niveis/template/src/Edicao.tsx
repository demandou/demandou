// O modelo Níveis: refrão de comparação em quadro cheio. A pessoa fica no mesmo plano o vídeo todo
// (só corte seco, com variação mínima de escala a cada corte, seguindo o rosto), empurrada para
// baixo para abrir uma faixa preta no topo; na faixa, 3 cartões lado a lado que entram na palavra
// de cada nível, com o rótulo branco embaixo. Sem legenda corrida, sem transição, sem som de
// efeito. Nada mexe na cor do vídeo.
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { zoomNoTempo } from "./camera";
import { Abertura, Comparacao, Definicao, Destaque, Frase, Grafico, Lista, Numero, Pergunta } from "./componentes/Blocos";
import { FechamentoCta, Niveis } from "./componentes/Palco";
import { VideoNaCaixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { CARTAO_X, FONTE, UI_BASE, UI_DIREITA, caixaDaPessoa, medidas } from "./tema";

const Bloco: React.FC<{ plano: Plano; m: Momento; t: number }> = ({ plano, m, t }) => {
  switch (m.tipo) {
    case "niveis":
      return <Niveis plano={plano} m={m} t={t} />;
    case "cta":
      return <FechamentoCta plano={plano} m={m} t={t} />;
    case "abertura":
      return <Abertura plano={plano} m={m} t={t} />;
    case "frase":
      return <Frase plano={plano} m={m} t={t} />;
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

// Guias de conferência (só nos stills com --guias): rosto, queixo, topo da cabeça, palco
// (pílula e linha do item), zona dos blocos de peito e limites da interface do app.
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
      {linha(m.desloca, "#FFD84B", "topo do vídeo (acima é o reflexo)")}
      <div style={{ position: "absolute", left: CARTAO_X[0], top: m.cartaoTopo, width: CARTAO_X[2] + m.cartaoLar - CARTAO_X[0], height: m.cartaoAlt, border: "3px dashed #FFD84B" }} />
      {linha(m.cabeca, "#4BE3FF", "topo da cabeça (zoom máximo)")}
      {linha(m.queixo, "#4BE3FF", "queixo")}
      {linha(m.zonaTopo, "#7CFF8A", "blocos de peito")}
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
  const { desloca, zoomBase, cabeca } = medidas(plano);
  const sH = Math.max(60, Math.min(desloca, Math.round(cabeca - desloca - 110)));
  const caixa = caixaDaPessoa(plano, desloca, zoomBase * zoomNoTempo(plano, t));
  const vh = plano.videoAltura ?? 1920;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={vh} />
      {/* a pessoa desceu para abrir espaço aos cartões: o topo é o reflexo do próprio topo do vídeo */}
      {desloca > 0 ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: desloca, overflow: "hidden" }}>
          {/* só o trecho de fundo acima do cabelo (sH px), refletido e esticado até o topo: nunca mostra a pessoa */}
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: sH, overflow: "hidden", transformOrigin: "0 0", transform: `translateY(${desloca}px) scaleY(${-desloca / sH})` }}>
            <VideoNaCaixa src={plano.video} caixa={{ ...caixa, y: 0 }} rosto={plano.rosto} videoAltura={vh} mudo />
          </div>
        </div>
      ) : null}
      {/* sombra suave atrás dos rótulos (só no alto, acima da cabeça), para ler em fundo claro */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 680, background: "linear-gradient(180deg, rgba(0,0,0,0.26) 0%, rgba(0,0,0,0.26) 62%, rgba(0,0,0,0) 100%)" }} />
      {momentos.map((m, i) => (
        <Bloco key={i} plano={plano} m={m} t={t} />
      ))}
      {guias ? <Guias plano={plano} /> : null}
    </AbsoluteFill>
  );
};
