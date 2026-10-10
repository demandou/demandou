// O modelo Manchete: tela dividida na horizontal, como num Reel de notícia comentada. Em cima, a faixa
// do B-roll (0–1080 × 0–600, preenchida pela imagem), sempre ocupada, trocando em corte seco. Embaixo, a pessoa em plano
// fixo (o rosto na linha central, seguido quando se mexe) e a legenda palavra a palavra no peito.
// No começo, a tarja de pergunta. Nada mexe na cor do vídeo; nenhuma transição.
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Legenda } from "./componentes/Legenda";
import { Palco } from "./componentes/Palco";
import { Tarja } from "./componentes/Tarja";
import { VideoNaCaixa, rostoNaTela } from "./motor/caixa";
import type { Plano } from "./plano";
import { BANDA, FONTE, UI_BASE, UI_DIREITA, caixaDaPessoa, medidas, topoDaCabeca } from "./tema";

// Guias de conferência (só nos stills com --guias): rosto, topo da cabeça, queixo no zoom mais
// fechado, faixa da legenda e os limites da interface do app.
const Guias: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const m = medidas(plano);
  const vh = plano.videoAltura ?? 1920;
  const r = rostoNaTela(caixaDaPessoa(plano), plano.rosto, vh, t);
  const linha = (y: number, cor: string, rotulo: string) => (
    <div style={{ position: "absolute", left: 0, top: y, width: 1080, borderTop: `3px dashed ${cor}` }}>
      <span style={{ position: "absolute", left: 12, top: 4, fontFamily: FONTE, fontSize: 24, fontWeight: 700, color: cor, textShadow: "0 1px 3px #000" }}>{rotulo}</span>
    </div>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.62, width: r.largura, height: r.largura * 1.32, border: "4px solid #4BE3FF", borderRadius: "45%" }} />
      {linha(BANDA.y, "#FFFFFF", "topo da faixa do B-roll")}
      {linha(BANDA.y + BANDA.h, "#FFFFFF", "base da faixa (a tarja começa aqui)")}
      {linha(topoDaCabeca(plano), "#7CFF8A", "topo da cabeça")}
      {linha(m.queixo, "#4BE3FF", `queixo (zoom ${m.zoomMax.toFixed(2).replace(".", ",")})`)}
      {linha(m.legTopo, "#FFD84B", "legenda")}
      {linha(UI_BASE, "#FF6B6B", "interface do app")}
      <div style={{ position: "absolute", left: UI_DIREITA, top: 1100, width: 1080 - UI_DIREITA, height: 820, background: "rgba(255,107,107,0.25)" }} />
    </AbsoluteFill>
  );
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // a pessoa: plano fixo, abaixo da faixa do B-roll
  const caixa = caixaDaPessoa(plano);
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} />
      <Legenda plano={plano} />
      <Palco plano={plano} t={t} />
      <Tarja plano={plano} t={t} />
      {guias ? <Guias plano={plano} t={t} /> : null}
    </AbsoluteFill>
  );
};
