// O modelo Demo, versão deitada (16:9, 1920×1080, o vídeo completo do YouTube): a pessoa fala
// corrida e a edição é o que ela mostra. Três layouts em corte seco, na composição da aula 9 do
// curso: split (o insert no quadro da esquerda e a pessoa na moldura da direita, com o rosto
// centralizado e acompanhado), cheio (o insert no quadro inteiro) e eu (a pessoa em tela cheia, a
// base do vídeo longo). A faixa verde só no gancho; a legenda laranja-ouro sempre no terço de
// baixo. Sem transição, sem zoom animado, sem logo, sem som de efeito. Nada mexe na cor do vídeo.
import { AbsoluteFill } from "remotion";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { layoutNoTempo } from "./camera";
import { Legenda } from "./componentes/Legenda";
import { Palco } from "./componentes/Palco";
import { Rotulo } from "./componentes/Rotulo";
import { VideoNaCaixa, rostoNaTela } from "./motor/caixa";
import type { Plano } from "./plano";
import { ALTURA, COR, COSTURA, FONTE, LARGURA, LEGENDA_Y, MOLDURA, UI_BASE, caixaDaPessoa, larguraDoRosto, medidas, rostoDoPlano } from "./tema";

// Guias de conferência (só nos stills com --guias): rosto, topo da cabeça, queixo, linha da
// legenda, a emenda do split (a linha vertical entre o quadro e a moldura) e o limite dos
// controles do player.
const Guias: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const m = medidas(plano);
  const vh = plano.videoAltura ?? ALTURA;
  const modo = layoutNoTempo(plano, t);
  const r = rostoNaTela(caixaDaPessoa(plano, modo), rostoDoPlano(plano), vh, t);
  const L = larguraDoRosto(plano) * LARGURA * r.escala;
  const naMoldura = modo === "split";
  const x0 = naMoldura ? MOLDURA.x : 0;
  const w = naMoldura ? MOLDURA.w : LARGURA;
  const linha = (y: number, cor: string, rotulo: string, x = x0, largura = w) => (
    <div style={{ position: "absolute", left: x, top: y, width: largura, borderTop: `3px dashed ${cor}` }}>
      <span style={{ position: "absolute", left: 12, top: 4, fontFamily: FONTE, fontSize: 24, fontWeight: 700, color: cor, textShadow: "0 1px 3px #000" }}>{rotulo}</span>
    </div>
  );
  const medida = naMoldura ? m.split : m.eu;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: r.x - L / 2, top: r.y - L * 0.62, width: L, height: L * 1.32, border: "4px solid #4BE3FF", borderRadius: "45%" }} />
      {naMoldura ? (
        <div style={{ position: "absolute", left: COSTURA - 2, top: 0, width: 0, height: ALTURA, borderLeft: "4px dashed #FFFFFF" }}>
          <span style={{ position: "absolute", left: 12, top: 12, fontFamily: FONTE, fontSize: 24, fontWeight: 700, color: "#FFFFFF", textShadow: "0 1px 3px #000", whiteSpace: "nowrap" }}>emenda do split</span>
        </div>
      ) : null}
      {linha(medida.topoCabeca, "#7CFF8A", "topo da cabeça")}
      {linha(medida.queixo, "#4BE3FF", "queixo")}
      {linha(LEGENDA_Y, "#FFD84B", "legenda (centro)", 0, LARGURA)}
      {linha(UI_BASE, "#FF6B6B", "controles do player", 0, LARGURA)}
      <div style={{ position: "absolute", left: 0, top: UI_BASE, width: LARGURA, height: ALTURA - UI_BASE, background: "rgba(255,107,107,0.25)" }} />
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
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={rostoDoPlano(plano)} videoAltura={plano.videoAltura ?? ALTURA} />
      <Palco plano={plano} t={t} />
      <Rotulo plano={plano} t={t} />
      <Legenda plano={plano} />
      {guias ? <Guias plano={plano} t={t} /> : null}
    </AbsoluteFill>
  );
};
