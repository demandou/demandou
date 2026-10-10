// O modelo Etapas: três modos de tela em corte seco (A: rosto grande + cabeçalho; B: tela dividida
// na horizontal com a gravação de tela em cima, a pílula da etapa na junção, a legenda logo abaixo
// dela e o rosto embaixo; C: rosto grande sem nada). O modo vem do momento ativo. A câmera dá saltos
// de escala nos cortes. Nada mexe na cor do vídeo e nada cobre o rosto.
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { multNoTempo } from "./camera";
import { Cabecalho, Pilula, TelaEtapa, TelaGrade, TelaProva } from "./componentes/Assinatura";
import * as B from "./componentes/Blocos";
import { Legenda } from "./componentes/Legenda";
import { VideoNaCaixa, rostoNaTela } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { COR, FONTE, PILULA, TELA, UI_BASE, UI_DIREITA, caixaDaPessoa, legendaTopo, momentoEm, modoDe, queixoDe } from "./tema";

// o que cada momento mostra na tela do topo (modo B)
const Conteudo: React.FC<{ plano: Plano; m: Momento; t: number }> = ({ plano, m, t }) => {
  const fim = m.ate;
  switch (m.tipo) {
    case "etapa":
      return <TelaEtapa plano={plano} m={m} t={t} />;
    case "grade":
      return <TelaGrade plano={plano} m={m} t={t} />;
    case "prova":
      return <TelaProva plano={plano} m={m} t={t} />;
    case "topicos":
      return <B.Topicos plano={plano} m={m} t={t} fim={fim} />;
    case "passos":
      return <B.Passos plano={plano} m={m} t={t} fim={fim} />;
    case "numero":
      return <B.Numero plano={plano} m={m} t={t} fim={fim} />;
    case "comparacao":
      return <B.Comparacao plano={plano} m={m} t={t} fim={fim} />;
    case "grafico":
      return <B.Grafico plano={plano} m={m} t={t} fim={fim} />;
    case "destaque":
      return <B.Destaque plano={plano} m={m} t={t} fim={fim} />;
    case "definicao":
      return <B.Definicao plano={plano} m={m} t={t} fim={fim} />;
    case "frase":
      return <B.Frase plano={plano} m={m} t={t} fim={fim} />;
    case "pergunta":
      return <B.Pergunta plano={plano} m={m} t={t} fim={fim} />;
    default:
      return null;
  }
};

const rotuloDa = (m: Momento): string | undefined => (m.tipo === "etapa" ? m.rotulo : m.tipo === "prova" ? (m.rotulo ?? m.pilula) : m.pilula);
const iconeDe = (m: Momento) => (m.tipo === "etapa" || m.tipo === "prova" ? m.icone : undefined);
const COM_FUNDO_ESCURO = new Set(["topicos", "passos", "numero", "comparacao", "grafico", "destaque", "definicao", "frase", "pergunta"]);

// Guias de conferência (só nos stills com --guias).
const Guias: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const modo = modoDe(momentoEm(plano, t));
  const mult = multNoTempo(plano, t);
  const vh = plano.videoAltura ?? 1920;
  const r = rostoNaTela(caixaDaPessoa(plano, modo, mult), plano.rosto, vh, t);
  const linha = (y: number, cor: string, rotulo: string) => (
    <div style={{ position: "absolute", left: 0, top: y, width: 1080, borderTop: `3px dashed ${cor}` }}>
      <span style={{ position: "absolute", left: 12, top: 4, fontFamily: FONTE, fontSize: 24, fontWeight: 700, color: cor, textShadow: "0 1px 3px #000" }}>{rotulo}</span>
    </div>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.62, width: r.largura, height: r.largura * 1.32, border: "4px solid #4BE3FF", borderRadius: "45%" }} />
      {modo === "B" ? linha(TELA.y + TELA.h, "#FFFFFF", "base da tela") : null}
      {modo === "B" ? linha(PILULA.cy + PILULA.h / 2, "#FF9A4B", "base da pílula") : null}
      {linha(legendaTopo(plano, modo, mult), "#FFD84B", "legenda")}
      {linha(queixoDe(plano, modo, mult), "#4BE3FF", "queixo")}
      {linha(UI_BASE, "#FF6B6B", "interface do app")}
      <div style={{ position: "absolute", left: UI_DIREITA, top: 1100, width: 1080 - UI_DIREITA, height: 820, background: "rgba(255,107,107,0.25)" }} />
    </AbsoluteFill>
  );
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const m = momentoEm(plano, t);
  const modo = modoDe(m);
  // a pessoa: em A e C quadro cheio; em B, a metade de baixo. O salto de escala vem da câmera.
  const caixa = caixaDaPessoa(plano, modo, multNoTempo(plano, t));
  const pilula = modo === "B" && m ? rotuloDa(m) : undefined;
  return (
    <AbsoluteFill style={{ backgroundColor: COR.preto }}>
      {/* cópia muda em quadro cheio atrás de tudo: preenche a margem em volta da tela no modo B */}
      <VideoNaCaixa src={plano.video} caixa={caixaDaPessoa(plano, "C", multNoTempo(plano, t))} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} mudo />
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} />
      {modo === "A" && m?.tipo === "abertura" ? <Cabecalho m={m} t={t} /> : null}
      {modo === "B" && m ? (
        <div style={{ position: "absolute", left: TELA.x, top: TELA.y, width: TELA.w, height: TELA.h, overflow: "hidden", background: COM_FUNDO_ESCURO.has(m.tipo) ? COR.palco : "#FFFFFF" }}>
          <Conteudo plano={plano} m={m} t={t} />
        </div>
      ) : null}
      {pilula ? <Pilula texto={pilula} icone={m ? iconeDe(m) : undefined} t={t} /> : null}
      <Legenda plano={plano} />
      {guias ? <Guias plano={plano} t={t} /> : null}
    </AbsoluteFill>
  );
};
