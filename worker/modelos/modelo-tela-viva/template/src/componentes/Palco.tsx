// A MOLDURA DA TELA: o retângulo de cima (89% × 30% do quadro, cantos arredondados). Mostra o
// momento atual (a `tela`, ou um bloco universal quando o vídeo pede) e troca em CORTE SECO: sem
// cortina, sem deslize. A `abertura` não entra aqui: ela é o rótulo branco (Rotulo.tsx).
import { AbsoluteFill } from "remotion";
import type { Momento, Plano } from "../plano";
import { COR, ESCALA_PALCO, LARGURA, PALCO_H, TELA } from "../tema";
import { Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Numero, Passos, Pergunta, Topicos } from "./Blocos";
import { Tela } from "./Tela";

const Bloco: React.FC<{ plano: Plano; m: Momento; t: number; fim: number }> = ({ plano, m, t, fim }) => {
  switch (m.tipo) {
    case "tela":
      return <Tela m={m} t={t} />;
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
  const momentos = [...plano.momentos].filter((m) => m.tipo !== "abertura").sort((a, b) => a.de - b.de);
  let i = -1;
  momentos.forEach((m, k) => {
    if (t >= m.de) i = k;
  });
  // antes do primeiro momento (ou se começar depois do quadro 0): o primeiro já está lá
  const atual = momentos[Math.max(0, i)];
  const fim = momentos[Math.max(0, i) + 1]?.de ?? plano.duracao + 1;
  return (
    <div style={{ position: "absolute", left: TELA.x, top: TELA.y, width: TELA.w, height: TELA.h, borderRadius: TELA.raio, overflow: "hidden", background: COR.palco, boxShadow: "0 14px 44px rgba(0,0,0,0.45), 0 3px 10px rgba(0,0,0,0.3)" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: LARGURA, height: PALCO_H, transform: `scale(${ESCALA_PALCO})`, transformOrigin: "0 0" }}>
        {atual ? (
          <AbsoluteFill>
            <Bloco plano={plano} m={atual} t={t} fim={fim} />
          </AbsoluteFill>
        ) : null}
      </div>
    </div>
  );
};
