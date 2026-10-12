// O modelo Etapas, versão deitada (16:9, 1920×1080), pela regra da aula 9 do curso: três modos de
// tela em corte seco. A: a pessoa em tela cheia + o cabeçalho numa coluna ao lado do rosto; B: a
// pessoa na moldura da direita (rosto centralizado e acompanhado) e a tela no quadro da esquerda,
// com a pílula da etapa na borda de baixo dela; C: a pessoa em tela cheia, sem nada. O modo vem do
// momento ativo. A câmera dá saltos de escala nos cortes. A legenda fica na área segura de baixo.
// Nada mexe na cor do vídeo e nada cobre o rosto.
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { multNoTempo } from "./camera";
import { Cabecalho, Pilula, TelaEtapa, TelaGrade, TelaProva } from "./componentes/Assinatura";
import * as B from "./componentes/Blocos";
import { Legenda } from "./componentes/Legenda";
import { VideoNaCaixa, rostoNaTela } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { COR, COSTURA, FONTE, MARGEM_SEGURA, MOLDURA, PILULA, QUADRO, TELA, UI_BASE, caixaDaPessoa, colunaDoCabecalho, legendaNaTela, momentoEm, modoDe, queixoDe, rostoDo } from "./tema";

// o que cada momento mostra na tela do quadro da esquerda (modo B)
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
  const vh = plano.videoAltura ?? QUADRO.h;
  const r = rostoNaTela(caixaDaPessoa(plano, modo, mult), rostoDo(plano), vh, t);
  const leg = legendaNaTela(plano, modo, mult);
  const linha = (y: number, cor: string, rotulo: string, x = 0, w = QUADRO.w) => (
    <div style={{ position: "absolute", left: x, top: y, width: w, borderTop: `3px dashed ${cor}` }}>
      <span style={{ position: "absolute", left: 12, top: 4, fontFamily: FONTE, fontSize: 24, fontWeight: 700, color: cor, textShadow: "0 1px 3px #000" }}>{rotulo}</span>
    </div>
  );
  const col = modo === "A" ? colunaDoCabecalho(plano) : null;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.62, width: r.largura, height: r.largura * 1.32, border: "4px solid #4BE3FF", borderRadius: "45%" }} />
      {modo === "B" ? <div style={{ position: "absolute", left: COSTURA - 2, top: 0, width: 4, height: QUADRO.h, background: "#FF6BD5" }} /> : null}
      {modo === "B" ? linha(TELA.y + TELA.h, "#FFFFFF", "base da tela", 0, COSTURA) : null}
      {modo === "B" ? linha(PILULA.cy + PILULA.h / 2, "#FF9A4B", "base da pílula", 0, COSTURA) : null}
      {modo === "B" ? linha(24, "#FF6BD5", "moldura (pessoa)", MOLDURA.x, MOLDURA.w) : null}
      {col ? <div style={{ position: "absolute", left: col.x, top: 0, width: col.w, height: QUADRO.h, background: "rgba(255,154,75,0.18)" }} /> : null}
      {linha(leg.topo, "#FFD84B", "legenda", leg.cx - leg.largura / 2, leg.largura)}
      {linha(queixoDe(plano, modo, mult), "#4BE3FF", "queixo")}
      {linha(UI_BASE, "#FF6B6B", "controles do player")}
      <div style={{ position: "absolute", left: 0, top: 0, width: MARGEM_SEGURA, height: QUADRO.h, background: "rgba(255,107,107,0.18)" }} />
      <div style={{ position: "absolute", left: QUADRO.w - MARGEM_SEGURA, top: 0, width: MARGEM_SEGURA, height: QUADRO.h, background: "rgba(255,107,107,0.18)" }} />
    </AbsoluteFill>
  );
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const m = momentoEm(plano, t);
  const modo = modoDe(m);
  // a pessoa: em A e C tela cheia; em B, a moldura da direita. O salto de escala vem da câmera.
  const caixa = caixaDaPessoa(plano, modo, multNoTempo(plano, t));
  const rosto = rostoDo(plano);
  const vh = plano.videoAltura ?? QUADRO.h;
  const pilula = modo === "B" && m ? rotuloDa(m) : undefined;
  return (
    <AbsoluteFill style={{ backgroundColor: COR.preto }}>
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz). No modo B o quadro da esquerda é o
          fundo preto: a pessoa aparece uma vez só, na moldura */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={rosto} videoAltura={vh} />
      {modo === "A" && m?.tipo === "abertura" ? <Cabecalho m={m} t={t} coluna={colunaDoCabecalho(plano)} /> : null}
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
