// O modelo Demo: a pessoa fala corrida e a edição é o que ela mostra. Três layouts em corte seco:
// split (insert em cima, 44%, a pessoa embaixo olhando a tela), cheio (o insert na tela inteira) e
// eu (a pessoa em tela cheia, mais fechada). A faixa verde só no gancho; a legenda laranja-ouro
// sempre a 80%. Sem transição, sem zoom animado, sem logo, sem som de efeito. Nada mexe na cor do vídeo.
import { AbsoluteFill } from "remotion";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { layoutNoTempo } from "./camera";
import { Legenda } from "./componentes/Legenda";
import { Palco } from "./componentes/Palco";
import { Rotulo } from "./componentes/Rotulo";
import { VideoNaCaixa, rostoNaTela } from "./motor/caixa";
import type { Plano } from "./plano";
import { ALT_SPLIT, COR, FONTE, LEGENDA_Y, UI_BASE, UI_DIREITA, caixaDaPessoa, medidas } from "./tema";

// Guias de conferência (só nos stills com --guias): rosto, topo da cabeça, queixo, linha da
// legenda, emenda do split e os limites da interface do app.
const Guias: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const m = medidas(plano);
  const vh = plano.videoAltura ?? 1920;
  const modo = layoutNoTempo(plano, t);
  const r = rostoNaTela(caixaDaPessoa(plano, modo), plano.rosto, vh, t);
  const linha = (y: number, cor: string, rotulo: string) => (
    <div style={{ position: "absolute", left: 0, top: y, width: 1080, borderTop: `3px dashed ${cor}` }}>
      <span style={{ position: "absolute", left: 12, top: 4, fontFamily: FONTE, fontSize: 24, fontWeight: 700, color: cor, textShadow: "0 1px 3px #000" }}>{rotulo}</span>
    </div>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.62, width: r.largura, height: r.largura * 1.32, border: "4px solid #4BE3FF", borderRadius: "45%" }} />
      {linha(ALT_SPLIT, "#FFFFFF", "emenda do split")}
      {modo === "split" ? linha(m.topoCabeca, "#7CFF8A", "topo da cabeça") : null}
      {linha(modo === "split" ? m.queixo : m.queixoEu, "#4BE3FF", "queixo")}
      {linha(LEGENDA_Y, "#FFD84B", "legenda (centro, 80%)")}
      {linha(UI_BASE, "#FF6B6B", "interface do app")}
      <div style={{ position: "absolute", left: UI_DIREITA, top: 1100, width: 1080 - UI_DIREITA, height: 820, background: "rgba(255,107,107,0.25)" }} />
    </AbsoluteFill>
  );
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const caixa = caixaDaPessoa(plano, layoutNoTempo(plano, t));
  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo }}>
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} />
      <Palco plano={plano} t={t} />
      <Rotulo plano={plano} t={t} />
      <Legenda plano={plano} />
      {guias ? <Guias plano={plano} t={t} /> : null}
    </AbsoluteFill>
  );
};
