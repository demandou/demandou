// A FAIXA DE CIMA (o B-roll): sempre ocupada. Cada momento entra em corte seco e fica até o próximo.
import type { Momento, Plano } from "../plano";
import { BANDA, COR, LARGURA, PALCO_H } from "../tema";
import { Abertura, Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Insercao, Manchete, Numero, Passos, Pergunta, Topicos } from "./Blocos";

// Corte seco: o B-roll troca de um quadro para o outro, sem transição.
export const DUR_TROCA = 0;
const Bloco: React.FC<{ plano: Plano; m: Momento; t: number; fim: number }> = ({ plano, m, t, fim }) => {
  switch (m.tipo) {
    case "insercao":
      return <Insercao plano={plano} m={m} t={t} fim={fim} />;
    case "manchete":
      return <Manchete plano={plano} m={m} t={t} fim={fim} />;
    case "abertura":
      return <Abertura plano={plano} m={m} t={t} fim={fim} />;
    case "topicos":
      return <Topicos plano={plano} m={m} t={t} fim={fim} />;
    case "passos":
      return <Passos plano={plano} m={m} t={t} fim={fim} />;
    case "numero":
      return <Numero plano={plano} m={m} t={t} fim={fim} />;
    case "comparacao":
      return <Comparacao plano={plano} m={m} t={t} fim={fim} />;
    case "grafico":
      return <Grafico plano={plano} m={m} t={t} fim={fim} />;
    case "destaque":
      return <Destaque plano={plano} m={m} t={t} fim={fim} />;
    case "definicao":
      return <Definicao plano={plano} m={m} t={t} fim={fim} />;
    case "frase":
      return <Frase plano={plano} m={m} t={t} fim={fim} />;
    case "pergunta":
      return <Pergunta plano={plano} m={m} t={t} fim={fim} />;
    case "cta":
      return <Cta plano={plano} m={m} t={t} fim={fim} />;
    default:
      return null;
  }
};

export const Palco: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const fimDe = (i: number) => (momentos[i + 1] ? momentos[i + 1].de : plano.duracao + 1);
  let i = -1;
  momentos.forEach((m, k) => {
    if (t >= m.de) i = k;
  });
  return (
    <div style={{ position: "absolute", left: BANDA.x, top: BANDA.y, width: BANDA.w, height: BANDA.h, overflow: "hidden", background: COR.palco }}>
      {/* os blocos são desenhados em 1080×PALCO_H e reduzidos à largura da faixa */}
      <div style={{ position: "absolute", left: 0, top: 0, width: LARGURA, height: PALCO_H, transform: `scale(${BANDA.w / LARGURA})`, transformOrigin: "0 0" }}>
        {i >= 0 ? <Bloco plano={plano} m={momentos[i]} t={t} fim={fimDe(i)} /> : null}
      </div>
    </div>
  );
};
