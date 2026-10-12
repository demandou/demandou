// O modelo Guia, versão deitada (16:9, 1920×1080, o vídeo longo do YouTube). A regra da aula 9 do
// curso: a pessoa em TELA CHEIA é a base; quando um bloco pede apoio visual, corte seco para a tela
// clara de aula (o infográfico-estrada com zoom na etapa, o print com seta vermelha, pílulas de
// arquivo, números, diagramas, o CTA) no QUADRO da esquerda, com a pessoa numa MOLDURA do lado
// direito (o rosto centralizado e acompanhado; com o recorte sem fundo, sem moldura). Ao fim da
// ideia, corte seco de volta à tela cheia. Sem legenda, sem transição, sem filtro na pessoa.
import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TelaMapa } from "./componentes/Mapa";
import { Pessoa } from "./componentes/Pessoa";
import { TelaPrint } from "./componentes/Print";
import { TelaAbertura, TelaComparacao, TelaCta, TelaDefinicao, TelaDestaque, TelaFrase, TelaGrafico, TelaNumero, TelaPassos, TelaPergunta, TelaTopicos } from "./componentes/Telas";
import { caixaDaMoldura, momentosNaTela, temRecorte } from "./layout";
import type { Momento, Plano } from "./plano";
import { AREA, BASE_SEGURA, COR, ESCALA, LOGICO, MOLDURA, ORIGEM, QUADRO } from "./tema";

const Tela: React.FC<{ plano: Plano; m: Momento; t: number }> = ({ plano, m, t }) => {
  switch (m.tipo) {
    case "mapa":
      return plano.mapa ? <TelaMapa mapa={plano.mapa} m={m} t={t} /> : null;
    case "print":
      return <TelaPrint plano={plano} m={m} t={t} />;
    case "abertura":
      return <TelaAbertura plano={plano} m={m} t={t} />;
    case "topicos":
      return <TelaTopicos plano={plano} m={m} t={t} />;
    case "passos":
      return <TelaPassos plano={plano} m={m} t={t} />;
    case "numero":
      return <TelaNumero plano={plano} m={m} t={t} />;
    case "comparacao":
      return <TelaComparacao plano={plano} m={m} t={t} />;
    case "grafico":
      return <TelaGrafico plano={plano} m={m} t={t} />;
    case "destaque":
      return <TelaDestaque plano={plano} m={m} t={t} />;
    case "definicao":
      return <TelaDefinicao plano={plano} m={m} t={t} />;
    case "frase":
      return <TelaFrase plano={plano} m={m} t={t} />;
    case "pergunta":
      return <TelaPergunta plano={plano} m={m} t={t} />;
    case "cta":
      return <TelaCta plano={plano} m={m} t={t} />;
    default:
      return null;
  }
};

// Guias de conferência (só nos stills com --guias): margens, área segura de baixo, a área da tela
// de aula e a moldura, com o alvo do rosto.
const Guias: React.FC<{ plano: Plano }> = ({ plano }) => {
  const c = caixaDaMoldura(plano);
  const rostoY = c.y + (c.ancoraY ?? 0.34) * c.h;
  return (
    <AbsoluteFill style={{ zIndex: 9 }}>
      {[64, QUADRO.w - 64].map((x) => (
        <div key={x} style={{ position: "absolute", top: 0, left: x, height: QUADRO.h, borderLeft: "3px dashed #FFB84B" }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: BASE_SEGURA, width: QUADRO.w, borderTop: "3px dashed #FF6B6B" }}>
        <span style={{ position: "absolute", left: 12, top: 4, fontSize: 24, fontWeight: 700, color: "#FF6B6B" }}>controles do player</span>
      </div>
      <div style={{ position: "absolute", left: ORIGEM.x, top: AREA.y, width: LOGICO.w * ESCALA, height: AREA.h, border: "3px dashed #4BE3FF", boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: MOLDURA.x, top: MOLDURA.y, width: MOLDURA.w, height: QUADRO.h - MOLDURA.y, border: "3px dashed #B26BFF", boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: MOLDURA.x, top: rostoY, width: MOLDURA.w, borderTop: "3px dashed #B26BFF" }}>
        <span style={{ position: "absolute", left: 12, top: 4, fontSize: 24, fontWeight: 700, color: "#B26BFF" }}>rosto</span>
      </div>
    </AbsoluteFill>
  );
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const momentos = useMemo(() => momentosNaTela(plano), [plano]);
  const recorte = useMemo(() => temRecorte(plano), [plano]);
  const ativos = momentos.filter((m) => t >= m.de - 1e-6 && t < m.ate);
  const naTela = ativos.length > 0;
  const sons = plano.sfx === false ? [] : plano.momentos.filter((m) => m.tipo === "mapa" && m.foco !== undefined);

  return (
    <AbsoluteFill style={{ backgroundColor: naTela ? COR.papel : COR.tinta }}>
      {/* a tela de aula: camada lógica (medidas do vertical) ampliada pela ESCALA até a área do quadro */}
      {naTela ? (
        <div style={{ position: "absolute", left: ORIGEM.x, top: ORIGEM.y, width: LOGICO.w, height: 1000, transform: `scale(${ESCALA})`, transformOrigin: "0 0", zIndex: 0 }}>
          {ativos.map((m, i) => (
            <Tela key={`${m.tipo}-${m.de}-${i}`} plano={plano} m={m} t={t} />
          ))}
        </div>
      ) : null}
      {/* a pessoa: tela cheia, ou a moldura da direita durante a tela de aula (a voz vem daqui) */}
      <Pessoa plano={plano} naTela={naTela} recorte={recorte} />
      {sons.map((m, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, Math.round((m.de - 0.02) * fps))} durationInFrames={Math.round(0.6 * fps)} layout="none">
          <Audio src={staticFile("sfx/entrada.wav")} volume={0.3} />
        </Sequence>
      ))}
      {guias ? <Guias plano={plano} /> : null}
    </AbsoluteFill>
  );
};
