// O ramo que liga o cartão da pessoa ao mapa: sai de um lado do cartão e chega num nó da estação.
// É o que faz a pessoa ser um nó do mapa, e não um vídeo por cima dele. Só aparece com o cartão parado.
import { caneta, prog, ramo, Traco } from "../anim";
import { assentado, type Estacao, pontoDoLado } from "../layout";
import type { Caixa } from "../motor/caixa";
import { cor, H, W } from "../tema";
import { geometriaDoMapa, larguraDoNo } from "./Mapa";
import { MARGEM } from "../tema";
import { geometriaDaAbertura } from "./Abertura";
import { geometriaDaComparacao } from "./Comparacao";
import { geometriaDaDefinicao } from "./Definicao";
import { geometriaDoDestaque } from "./Destaque";
import { geometriaDaFrase } from "./Frase";
import { geometriaDoGrafico } from "./Grafico";
import { geometriaDoNumero } from "./Numero";
import { geometriaDosPassos } from "./Passos";
import { geometriaDaPergunta } from "./Pergunta";
import { geometriaDosTopicos } from "./Topicos";

type Ligacao = { lado: "baixo" | "esquerda" | "direita" | "cima"; ate: { x: number; y: number }; vertical?: boolean; x?: number };

// ponto de chegada em coordenadas da estação (iguais às da tela com a câmera parada)
export const ligacaoDa = (e: Estacao): Ligacao | null => {
  const m = e.m;
  if (!m) return null;
  switch (m.tipo) {
    case "mapa": {
      const foco = e.tipo === "mapa-foco";
      const g = geometriaDoMapa(m, foco);
      // com foco no mapa, o ramo sai do pé do cartão pequeno e desce até o nó central
      return { lado: "baixo", x: foco ? undefined : g.centro.x, ate: { x: g.centro.x, y: g.centro.y - g.centro.h / 2 }, vertical: true };
    }
    case "titulo":
      return m.origem ? { lado: "esquerda", ate: { x: MARGEM + 10 + larguraDoNo(m.origem, 44, "texto700") + 2, y: 470 } } : null;
    case "curva":
      return { lado: "baixo", ate: { x: 116, y: 830 }, vertical: true };
    case "contador":
      return { lado: "baixo", ate: { x: 722, y: 918 }, vertical: true };
    case "barras":
      return m.no ? { lado: "direita", ate: { x: 566, y: 1240 } } : null;
    case "cartoes":
      return { lado: "baixo", ate: { x: 250, y: 702 }, vertical: true };
    // blocos universais
    case "abertura": {
      const g = geometriaDaAbertura(m);
      return { lado: "baixo", x: g.chegada.x, ate: g.chegada, vertical: true };
    }
    case "frase":
      return { lado: "esquerda", ate: geometriaDaFrase(m).chegada };
    case "destaque":
      return { lado: "baixo", ate: geometriaDoDestaque(m).chegada, vertical: true };
    case "pergunta":
      return { lado: "direita", ate: geometriaDaPergunta(m).chegada };
    case "numero":
      return { lado: "baixo", ate: geometriaDoNumero(m).chegada, vertical: true };
    case "comparacao": {
      const g = geometriaDaComparacao(m);
      return { lado: "baixo", x: g.chegada.x, ate: g.chegada, vertical: true };
    }
    case "definicao":
      return { lado: "esquerda", ate: geometriaDaDefinicao(m).chegada };
    case "topicos": {
      const g = geometriaDosTopicos(m);
      return { lado: "baixo", x: g.chegada.x, ate: g.chegada, vertical: true };
    }
    case "passos":
      return { lado: "baixo", ate: geometriaDosPassos(m).chegada, vertical: true };
    case "grafico": {
      const g = geometriaDoGrafico(m);
      return { lado: "baixo", x: g.chegada.x, ate: g.chegada, vertical: true };
    }
    default:
      return null;
  }
};

export const RamoDaPessoa: React.FC<{ e: Estacao; caixa: Caixa; cam: { x: number; y: number; zoom: number }; t: number }> = ({ e, caixa, cam, t }) => {
  const l = ligacaoDa(e);
  if (!l) return null;
  const a = assentado(t, e);
  if (a <= 0.001) return null;
  const de = pontoDoLado(caixa, l.lado);
  if (l.x !== undefined) de.x = l.x;
  // da estação para a tela
  const ate = { x: (e.origem.x + l.ate.x - cam.x) * cam.zoom + W / 2, y: (e.origem.y + l.ate.y - cam.y) * cam.zoom + H / 2 };
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={W} height={H}>
      <circle cx={ate.x} cy={ate.y} r={9 * a} fill={cor.tinta} />
      <Traco d={ramo(de.x, de.y, ate.x, ate.y, l.vertical)} p={prog(a, 0, 1, caneta)} cor={cor.tinta} largura={6} />
    </svg>
  );
};
