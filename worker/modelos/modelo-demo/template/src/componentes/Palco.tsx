// O INSERT: a parte de cima do quadro (44% no split, 100% no cheio), sem borda nem cantos
// arredondados. Mostra o momento atual (a `tela`, a `imagem`, ou um bloco universal quando o
// vídeo pede) e troca em CORTE SECO: sem cortina, sem deslize. A `abertura` não entra aqui: ela é
// a faixa verde (Rotulo.tsx). No layout "eu" não há insert.
import { AbsoluteFill } from "remotion";
import type { Momento, Plano } from "../plano";
import { layoutDoMomento } from "../camera";
import { COR, LARGURA, PALCO_H } from "../tema";
import { Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Numero, Passos, Pergunta, Topicos } from "./Blocos";
import { InsertImagem } from "./InsertImagem";
import { Tela } from "./Tela";

const Bloco: React.FC<{ plano: Plano; m: Momento; t: number; fim: number; alt: number }> = ({ plano, m, t, fim, alt }) => {
  switch (m.tipo) {
    case "tela":
      return <Tela m={m} t={t} alt={alt} />;
    case "imagem":
      return <InsertImagem plano={plano} m={m} t={t} alt={alt} />;
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
  if (!atual) return null;
  const layout = layoutDoMomento(atual);
  // em "eu" não há insert; em "cheio" o insert ocupa o quadro todo; no split, os 44% de cima
  if (layout === "eu") return null;
  const alt = layout === "cheio" ? 1920 : PALCO_H;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: LARGURA, height: alt, overflow: "hidden", background: COR.palco }}>
      <AbsoluteFill>
        <Bloco plano={plano} m={atual} t={t} fim={fim} alt={alt} />
      </AbsoluteFill>
    </div>
  );
};
