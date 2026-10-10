// O modelo Narrador: a voz conta e as imagens carregam a história. A pessoa fica montada o vídeo
// inteiro (é dela que vem a voz) e aparece em quadro cheio nas frases-chave, reenquadrando a cada
// corte e a cada volta de uma imagem; as cenas (fotos em tela cheia andando devagar) cobrem de
// 50% a 70% do tempo; datas e lugares entram como letreiros; a legenda segue por cima de tudo.
// Nada mexe na cor do vídeo da pessoa.
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ePrancha, faixasCobertas, zoomNoTempo } from "./camera";
import { Cena } from "./componentes/Cena";
import { Legenda } from "./componentes/Legenda";
import { Letreiro } from "./componentes/Letreiro";
import { Abertura, Cta, Destaque, Frase, Pergunta } from "./componentes/NaPessoa";
import { Comparacao, Definicao, Grafico, Numero, Passos, Topicos } from "./componentes/Pranchas";
import { CHEIO, VideoNaCaixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { COR, FONTE, MARGEM, SERIFA, SOMBRA_TEXTO, UI_BASE, UI_DIREITA, ancoraDo, medidas, prog, suave } from "./tema";

const Prancha: React.FC<{ plano: Plano; m: Momento; t: number }> = ({ plano, m, t }) => {
  switch (m.tipo) {
    case "numero":
      return <Numero plano={plano} m={m} t={t} />;
    case "topicos":
      return <Topicos plano={plano} m={m} t={t} />;
    case "passos":
      return <Passos plano={plano} m={m} t={t} />;
    case "comparacao":
      return <Comparacao plano={plano} m={m} t={t} />;
    case "grafico":
      return <Grafico plano={plano} m={m} t={t} />;
    case "definicao":
      return <Definicao plano={plano} m={m} t={t} />;
    default:
      return null;
  }
};

const NaPessoa: React.FC<{ plano: Plano; m: Momento; t: number }> = ({ plano, m, t }) => {
  switch (m.tipo) {
    case "abertura":
      return <Abertura plano={plano} m={m} t={t} />;
    case "frase":
      return <Frase plano={plano} m={m} t={t} />;
    case "destaque":
      return <Destaque plano={plano} m={m} t={t} />;
    case "pergunta":
      return <Pergunta plano={plano} m={m} t={t} />;
    case "cta":
      return <Cta plano={plano} m={m} t={t} />;
    default:
      return null;
  }
};

// Tarja de nome e área no começo: no alto à esquerda, acima da cabeça, em serifa e versalete.
const Marca: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const { nome, area } = plano.marca ?? { nome: "", area: "" };
  if (!nome) return null;
  const primeiraImagem = faixasCobertas(plano)[0]?.[0] ?? 3.6;
  const ate = Math.max(1.6, Math.min(3.6, primeiraImagem));
  if (t < 0.15 || t >= ate) return null;
  const e = prog(t, 0.2, 0.45);
  const s = prog(t, ate - 0.28, 0.28, suave);
  return (
    <div style={{ position: "absolute", left: MARGEM, top: 120, display: "flex", gap: 18, opacity: e * (1 - s), transform: e >= 1 ? undefined : `translateX(${(1 - e) * -12}px)` }}>
      <div style={{ width: 3, background: COR.vermelhao, height: 84 * prog(t, 0.2, 0.5) }} />
      <div style={{ color: COR.marfim, textShadow: SOMBRA_TEXTO, lineHeight: 1.18 }}>
        <div style={{ fontFamily: SERIFA, fontWeight: 600, fontSize: 40 }}>{nome}</div>
        {area ? <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: 22, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 6 }}>{area}</div> : null}
      </div>
    </div>
  );
};

// Guias de conferência (só nos stills com --guias): rosto, queixo, faixa dos textos sobre a
// pessoa, faixa da legenda, alto dos letreiros e os limites da interface do app.
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
      {linha(300, "#C79BFF", "letreiro (alto)")}
      {linha(m.queixo, "#4BE3FF", "queixo (zoom máximo)")}
      {linha(m.textoTopo, "#7CFF8A", "textos sobre a pessoa")}
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
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const caixa = { ...CHEIO, zoom: zoomNoTempo(plano, t), ancoraY: ancoraDo(plano) };
  const cenas = momentos.filter((m) => m.tipo === "cena");
  const pranchas = momentos.filter(ePrancha);
  const letreiros = momentos.filter((m) => m.tipo === "letreiro");
  const naPessoa = momentos.filter((m) => ["abertura", "frase", "destaque", "pergunta", "cta"].includes(m.tipo));
  // o som entra só quando a pessoa sai e a imagem entra (raro e baixo)
  const sons = plano.sfx === false ? [] : faixasCobertas(plano).map(([a]) => a);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} />
      {cenas.map((m, i) => (m.tipo === "cena" ? <Cena key={`c${i}`} plano={plano} m={m} t={t} /> : null))}
      {pranchas.map((m, i) => (
        <Prancha key={`p${i}`} plano={plano} m={m} t={t} />
      ))}
      {naPessoa.map((m, i) => (
        <NaPessoa key={`n${i}`} plano={plano} m={m} t={t} />
      ))}
      {letreiros.map((m, i) => (m.tipo === "letreiro" ? <Letreiro key={`l${i}`} plano={plano} m={m} t={t} /> : null))}
      <Legenda plano={plano} />
      <Marca plano={plano} t={t} />
      {sons.map((a, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, Math.round((a - 0.12) * fps))} durationInFrames={Math.round(1.1 * fps)} layout="none">
          <Audio src={staticFile("sfx/passagem.wav")} volume={0.4} />
        </Sequence>
      ))}
      {guias ? <Guias plano={plano} /> : null}
    </AbsoluteFill>
  );
};
