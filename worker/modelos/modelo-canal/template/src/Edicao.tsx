// O modelo Canal (16:9, YouTube): a pessoa em quadro cheio com punch-ins nos cortes; o reframe (a
// câmera aproxima e empurra a pessoa para um lado, a informação ocupa a metade livre); B-roll em
// tela cheia; tarja de nome, capítulos, palavras-chave e o lembrete de inscrição no lado livre.
// Sem legenda por padrão. Nada mexe na cor do vídeo.
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { caixaDaPessoa, tomadas } from "./camera";
import { Abertura, Capitulo, Cena, Chamada, Cta, Destaque, Inscricao, Marca, cliqueDa } from "./componentes/Faixas";
import { Comparacao, Definicao, Frase, Grafico, Lista, Numero, Pergunta, Reframe } from "./componentes/Lateral";
import { Legenda } from "./componentes/Legenda";
import { VideoNaCaixa, rostoNaTela } from "./motor/caixa";
import type { Cta as Cta_, Inscricao as Inscricao_, Momento, Plano } from "./plano";
import { BASE, FONTE, H, LATERAL, MARGEM_X, MARGEM_Y, W, ladoLivre, xLateral } from "./tema";

const Bloco: React.FC<{ plano: Plano; m: Momento; t: number; zoom: number }> = ({ plano, m, t, zoom }) => {
  switch (m.tipo) {
    case "reframe":
      return <Reframe plano={plano} m={m} t={t} />;
    case "cena":
      return <Cena plano={plano} m={m} t={t} />;
    case "capitulo":
      return <Capitulo plano={plano} m={m} t={t} />;
    case "inscricao":
      return <Inscricao plano={plano} m={m} t={t} />;
    case "chamada":
      return <Chamada plano={plano} m={m} t={t} />;
    case "abertura":
      return <Abertura plano={plano} m={m} t={t} />;
    case "frase":
      return <Frase plano={plano} m={m} t={t} />;
    case "cta":
      return <Cta plano={plano} m={m} t={t} />;
    case "pergunta":
      return <Pergunta plano={plano} m={m} t={t} />;
    case "numero":
      return <Numero plano={plano} m={m} t={t} />;
    case "destaque":
      return <Destaque plano={plano} m={m} t={t} zoom={zoom} />;
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

// Guias de conferência (stills com --guias): margem segura, rosto, lado livre e a linha das tarjas.
const Guias: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const caixa = caixaDaPessoa(plano, t);
  const r = rostoNaTela(caixa, plano.rosto, plano.videoAltura ?? H, t);
  const rotulo = (texto: string, x: number, y: number, cor: string) => (
    <span style={{ position: "absolute", left: x, top: y, fontFamily: FONTE, fontSize: 24, fontWeight: 700, color: cor }}>{texto}</span>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: MARGEM_X, top: MARGEM_Y, width: W - MARGEM_X * 2, height: H - MARGEM_Y * 2, border: "3px dashed #FFD84B", boxSizing: "border-box" }} />
      {rotulo("margem segura", MARGEM_X + 8, MARGEM_Y + 6, "#FFD84B")}
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.62, width: r.largura, height: r.largura * 1.32, border: "4px solid #4BE3FF", borderRadius: "45%" }} />
      <div style={{ position: "absolute", left: xLateral(ladoLivre(plano)), top: LATERAL.topo, width: LATERAL.w, height: LATERAL.base - LATERAL.topo, border: "3px dashed #7CFF8A", boxSizing: "border-box" }} />
      {rotulo("lado livre (informação)", xLateral(ladoLivre(plano)) + 8, LATERAL.topo + 6, "#7CFF8A")}
      <div style={{ position: "absolute", left: 0, top: BASE, width: W, borderTop: "3px dashed #FF6B6B" }} />
      {rotulo("base das tarjas (controles do player abaixo)", MARGEM_X + 8, BASE + 6, "#FF6B6B")}
    </AbsoluteFill>
  );
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const caixa = caixaDaPessoa(plano, t);
  const cenas = momentos.filter((m) => m.tipo === "cena");
  const pecas = momentos.filter((m) => m.tipo !== "cena");
  // sons tonais e baixos: o empurrão do reframe, o corte para o B-roll e o clique da inscrição
  const sfx = plano.sfx !== false;
  const ts = tomadas(plano);
  const entradasDeReframe = sfx ? ts.filter((x, i) => x.lado && !x.oculto && x.de > 0.05 && ts[i - 1]?.lado !== x.lado) : [];
  const cliques = sfx ? momentos.filter((m): m is Inscricao_ | Cta_ => m.tipo === "inscricao" || (m.tipo === "cta" && m.icone === "seguir")) : [];

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? H} />
      {cenas.map((m, i) => (
        <Bloco key={`c${i}`} plano={plano} m={m} t={t} zoom={caixa.zoom ?? 1} />
      ))}
      {pecas.map((m, i) => (
        <Bloco key={`p${i}`} plano={plano} m={m} t={t} zoom={caixa.zoom ?? 1} />
      ))}
      <Marca plano={plano} t={t} />
      <Legenda plano={plano} />
      {entradasDeReframe.map((x, i) => (
        <Sequence key={`e${i}`} from={Math.max(0, Math.round((x.de - 0.02) * fps))} durationInFrames={Math.round(0.6 * fps)} layout="none">
          <Audio src={staticFile("sfx/empurrao.wav")} volume={0.32} />
        </Sequence>
      ))}
      {(sfx ? cenas : []).map((m, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, Math.round((m.de - 0.03) * fps))} durationInFrames={Math.round(0.7 * fps)} layout="none">
          <Audio src={staticFile("sfx/corte.wav")} volume={0.4} />
        </Sequence>
      ))}
      {cliques.map((m, i) => (
        <Sequence key={`k${i}`} from={Math.max(0, Math.round(cliqueDa(m) * fps))} durationInFrames={Math.round(0.3 * fps)} layout="none">
          <Audio src={staticFile("sfx/clique.wav")} volume={0.3} />
        </Sequence>
      ))}
      {guias ? <Guias plano={plano} t={t} /> : null}
    </AbsoluteFill>
  );
};
