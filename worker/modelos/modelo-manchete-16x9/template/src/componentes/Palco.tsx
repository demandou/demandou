// O QUADRO DA ESQUERDA (o B-roll, a "faixa de cima" do vertical), no quadro deitado (16:9): x 0 a
// 1180, na altura toda, com a pessoa na moldura da direita. Cada momento entra em corte seco e fica
// do `de` ao `ate` (emendado ao próximo quando o vão é curto); fora dos momentos não há quadro e a
// pessoa fica em tela cheia (a base do vídeo longo, pela aula 9 do curso).
import { momentoNoTempo } from "../camera";
import type { Momento, Plano } from "../plano";
import { BANDA, COR, PALCO_H, PALCO_W } from "../tema";
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
  const atual = momentoNoTempo(plano, t);
  if (!atual) return null;
  return (
    <div style={{ position: "absolute", left: BANDA.x, top: BANDA.y, width: BANDA.w, height: BANDA.h, overflow: "hidden", background: COR.palco }}>
      {/* os blocos são desenhados em PALCO_W × PALCO_H (o quadro inteiro) */}
      <div style={{ position: "absolute", left: 0, top: 0, width: PALCO_W, height: PALCO_H }}>
        <Bloco plano={plano} m={atual.m} t={t} fim={atual.fim} />
      </div>
    </div>
  );
};
