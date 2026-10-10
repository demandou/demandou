// O modelo Tela Viva: layout dividido fixo, o mesmo do primeiro ao último quadro. Em cima, a
// moldura da tela (uma gravação que nunca fica parada: a assinatura `tela`); na junção, o rótulo
// branco com o nome do assunto, que some em corte seco; embaixo, a pessoa em take único (cabeça
// centralizada, reenquadra só nos cortes, segue o rosto) e a legenda minúscula no peito.
// O vídeo da pessoa preenche o quadro inteiro (o cenário aparece em volta da tela, borrado: nunca
// preto); a tela flutua por cima, com cantos arredondados e sombra suave.
// Sem transição, sem som de efeito, sem logo, sem texto de CTA. Nada mexe na cor do vídeo.
import { AbsoluteFill } from "remotion";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { zoomNoTempo } from "./camera";
import { Legenda } from "./componentes/Legenda";
import { Palco } from "./componentes/Palco";
import { Rotulo } from "./componentes/Rotulo";
import { CHEIO, VideoNaCaixa, rostoNaTela } from "./motor/caixa";
import type { Plano } from "./plano";
import { COR, FONTE, LEGENDA_Y, PESSOA_Y, ROTULO, TELA, UI_BASE, UI_DIREITA, caixaDaPessoa, medidas } from "./tema";

// Guias de conferência (só nos stills com --guias): rosto, topo da cabeça, queixo no zoom mais
// fechado, linha da legenda, moldura da tela e os limites da interface do app.
const Guias: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const m = medidas(plano);
  const vh = plano.videoAltura ?? 1920;
  const r = rostoNaTela(caixaDaPessoa(plano, zoomNoTempo(plano, t)), plano.rosto, vh, t);
  const linha = (y: number, cor: string, rotulo: string) => (
    <div style={{ position: "absolute", left: 0, top: y, width: 1080, borderTop: `3px dashed ${cor}` }}>
      <span style={{ position: "absolute", left: 12, top: 4, fontFamily: FONTE, fontSize: 24, fontWeight: 700, color: cor, textShadow: "0 1px 3px #000" }}>{rotulo}</span>
    </div>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.62, width: r.largura, height: r.largura * 1.32, border: "4px solid #4BE3FF", borderRadius: "45%" }} />
      {linha(TELA.y, "#FFFFFF", "topo da moldura da tela (margem segura 120)")}
      {linha(ROTULO.y, "#B678FF", "rótulo (sobre a tela)")}
      {linha(PESSOA_Y + 85, "#7CFF8A", "topo da cabeça (qualquer zoom)")}
      {linha(m.queixo, "#4BE3FF", `queixo no zoom ${m.zoomMax.toFixed(2).replace(".", ",")}`)}
      {linha(LEGENDA_Y, "#FFD84B", "legenda (centro)")}
      {linha(1700, "#FF6B6B", "interface do app (nada importante abaixo)")}
      <div style={{ position: "absolute", left: UI_DIREITA, top: 1100, width: 1080 - UI_DIREITA, height: 820, background: "rgba(255,107,107,0.25)" }} />
    </AbsoluteFill>
  );
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const caixa = caixaDaPessoa(plano, zoomNoTempo(plano, t));
  const fundo = { ...CHEIO, x: 0, y: 0, w: 1080, h: 1920, zoom: 1, ancoraY: 0.5, raio: 0 };
  return (
    <AbsoluteFill style={{ backgroundColor: COR.palco2 }}>
      {/* o cenário da pessoa: o mesmo vídeo, borrado, preenche o quadro inteiro (nunca preto). Mudo. */}
      <AbsoluteFill style={{ filter: "blur(14px) brightness(0.92)", transform: "scale(1.08)" }}>
        <VideoNaCaixa src={plano.video} caixa={fundo} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} mudo seguirRosto={false} />
      </AbsoluteFill>
      {/* a pessoa: o vídeo nítido (é dele que vem a voz); a borda de cima se dissolve no cenário e fica escondida sob a tela */}
      <AbsoluteFill style={{ WebkitMaskImage: `linear-gradient(to bottom, transparent ${TELA.y + TELA.h - 6}px, #000 ${TELA.y + TELA.h + 70}px)`, maskImage: `linear-gradient(to bottom, transparent ${TELA.y + TELA.h - 6}px, #000 ${TELA.y + TELA.h + 70}px)` }}>
        <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} />
      </AbsoluteFill>
      <Palco plano={plano} t={t} />
      <Rotulo plano={plano} t={t} />
      <Legenda plano={plano} />
      {guias ? <Guias plano={plano} t={t} /> : null}
    </AbsoluteFill>
  );
};
