// O modelo Terço: tela dividida na horizontal. Em cima, o palco (0 a 640 px), sempre ocupado pelo
// que a pessoa está dizendo: a imagem da coisa citada, o capítulo, a lista, o número…, um entrando
// por cima do outro. Embaixo, a pessoa numa moldura larga que segue o rosto (cabeça inteira, com
// folga), reenquadrando em cada corte, e a legenda logo abaixo do queixo. Uma divisória fina com
// a linha de progresso separa os dois. Nada mexe na cor do vídeo.
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { zoomNoTempo } from "./camera";
import { Legenda } from "./componentes/Legenda";
import { Palco, entradaDo } from "./componentes/Palco";
import { VideoNaCaixa, rostoNaTela } from "./motor/caixa";
import type { Plano } from "./plano";
import { COR, FONTE, LARGURA, MARGEM, PALCO_H, PESSOA_Y, SOMBRA_TEXTO, UI_BASE, UI_DIREITA, caixaDaPessoa, medidas, prog, suave } from "./tema";

// Divisória: um fio escuro com a linha de progresso do vídeo em azul.
const Divisoria: React.FC<{ t: number; dur: number }> = ({ t, dur }) => (
  <div style={{ position: "absolute", left: 0, top: PALCO_H - 2, width: LARGURA, height: 5, background: COR.palco }}>
    <div style={{ position: "absolute", left: 0, top: 1, width: LARGURA * Math.min(1, t / Math.max(1, dur)), height: 3, background: COR.cobalto }} />
  </div>
);

// Tarja de nome e área, quando não há abertura no começo (com abertura, o nome vai no chapéu dela).
const Marca: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const { nome, area } = plano.marca ?? { nome: "", area: "" };
  if (!nome) return null;
  if (plano.momentos.some((m) => m.tipo === "abertura" && m.de < 1)) return null;
  const ate = 3.6;
  if (t < 0.2 || t >= ate) return null;
  const e = prog(t, 0.25, 0.4);
  const s = prog(t, ate - 0.25, 0.25, suave);
  return (
    <div style={{ position: "absolute", left: MARGEM - 16, top: PESSOA_Y + 40, display: "flex", opacity: e * (1 - s), transform: `translateX(${(1 - e) * -14}px)` }}>
      <div style={{ width: 6, borderRadius: 3, background: COR.cobalto, marginRight: 14 }} />
      <div style={{ fontFamily: FONTE, color: COR.branco, textShadow: SOMBRA_TEXTO, lineHeight: 1.2 }}>
        <div style={{ fontWeight: 800, fontSize: 32 }}>{nome}</div>
        {area ? <div style={{ fontWeight: 600, fontSize: 24, opacity: 0.9 }}>{area}</div> : null}
      </div>
    </div>
  );
};

// Guias de conferência (só nos stills com --guias): rosto, topo da cabeça, queixo no zoom mais
// fechado, faixa da legenda e os limites da interface do app.
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
      {linha(PALCO_H, "#FFFFFF", "divisória (palco acima)")}
      {linha(PESSOA_Y + 48, "#7CFF8A", "topo da cabeça (qualquer zoom)")}
      {linha(m.queixo, "#4BE3FF", `queixo no zoom ${m.zoomMax.toFixed(2).replace(".", ",")}`)}
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
  // a pessoa: moldura larga nos dois terços de baixo, com o zoom do trecho atual
  const caixa = caixaDaPessoa(plano, zoomNoTempo(plano, t));
  // som tonal baixo quando uma imagem entra no palco
  const sons = plano.sfx === false ? [] : plano.momentos.filter((m) => m.tipo === "insercao" && entradaDo(m) !== "lateral");

  return (
    <AbsoluteFill style={{ backgroundColor: COR.palco }}>
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} />
      <Legenda plano={plano} />
      <Marca plano={plano} t={t} />
      <Palco plano={plano} t={t} />
      <Divisoria t={t} dur={plano.duracao} />
      {sons.map((m, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, Math.round((m.de - 0.04) * fps))} durationInFrames={Math.round(0.7 * fps)} layout="none">
          <Audio src={staticFile("sfx/entrada.wav")} volume={0.5} />
        </Sequence>
      ))}
      {guias ? <Guias plano={plano} t={t} /> : null}
    </AbsoluteFill>
  );
};
