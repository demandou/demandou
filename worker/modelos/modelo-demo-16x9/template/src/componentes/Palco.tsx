// O INSERT, no quadro deitado (16:9): no split, o quadro da esquerda (x 0 a 1180, na altura toda),
// com a pessoa na moldura da direita; no cheio, o quadro inteiro (1920×1080). Sem borda nem cantos
// arredondados. Mostra o momento atual (a `tela`, a `imagem`, ou um bloco universal quando o vídeo
// pede) e troca em CORTE SECO: sem cortina, sem deslize. A `abertura` não entra aqui: ela é a faixa
// verde (Rotulo.tsx). No layout "eu" (e fora dos momentos, a base do vídeo longo) não há insert.
import { AbsoluteFill } from "remotion";
import type { Momento, Plano } from "../plano";
import { layoutDoMomento, momentoNoTempo } from "../camera";
import { ALTURA, COR, LARGURA, PALCO_H, PALCO_W } from "../tema";
import { Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Numero, Passos, Pergunta, Topicos } from "./Blocos";
import { InsertImagem } from "./InsertImagem";
import { Tela } from "./Tela";

const Bloco: React.FC<{ plano: Plano; m: Momento; t: number; fim: number; larg: number; alt: number }> = ({ plano, m, t, fim, larg, alt }) => {
  switch (m.tipo) {
    case "tela":
      return <Tela m={m} t={t} larg={larg} alt={alt} />;
    case "imagem":
      return <InsertImagem plano={plano} m={m} t={t} larg={larg} alt={alt} />;
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
  const layout = layoutDoMomento(atual.m);
  // em "eu" não há insert; em "cheio" o insert ocupa o quadro todo; no split, o quadro da esquerda
  if (layout === "eu") return null;
  const larg = layout === "cheio" ? LARGURA : PALCO_W;
  const alt = layout === "cheio" ? ALTURA : PALCO_H;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: larg, height: alt, overflow: "hidden", background: COR.palco }}>
      <AbsoluteFill>
        <Bloco plano={plano} m={atual.m} t={t} fim={atual.fim} larg={larg} alt={alt} />
      </AbsoluteFill>
    </div>
  );
};
