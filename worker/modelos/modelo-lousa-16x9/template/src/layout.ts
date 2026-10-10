// Gramática de layout da Lousa no quadro deitado (16:9, 1920×1080): onde fica a janela da pessoa
// e onde fica a conta em cada momento.
//
// A regra é a da aula 9 do curso (editar uma aula horizontal): a pessoa em tela cheia é a base;
// quando a fala pede a lousa, a pessoa vai para uma MOLDURA do lado DIREITO, com o rosto
// centralizado nela e acompanhado com ajuste suave (o rastro do cortar.mjs), e a lousa ocupa o
// lado ESQUERDO. Os dois lugares do vertical continuam, recompostos em colunas:
//
//   "alto"  (janela grande): moldura larga à direita, a lousa à esquerda, o conteúdo centrado
//           [        lousa (944 × 784)        |   moldura grande (720 × 784)   ]
//   canto   (janela retrato): moldura estreita à direita; na lousa, o cabeçalho em cima (o título
//           amarelo, ao lado da janela) e o conteúdo embaixo, na largura toda da lousa
//           [ cabeçalho (1124 × 196)                   |                       ]
//           [ conteúdo (1124 × 552, 642 sem legenda)   | moldura (540 × 784)   ]
//
// A pessoa fica sempre do lado direito (a aula 9 fixa a moldura à direita): "direita" e
// "esquerda" do plano são o mesmo canto. Na troca de página a janela muda de tamanho e de lugar
// (~0,6 s) entre o alto e o canto, e volta à tela cheia nos respiros.
import { CHEIO_16x9, type Caixa, type EstadoDaCaixa, type Rosto } from "./motor/caixa";
import type { Layout, Momento, Plano } from "./plano";
import { BASE_LOUSA, BASE_SEM_LEGENDA, H, MARGEM, TOPO_LOUSA, W } from "./tema";

export type Regiao = { x: number; y: number; w: number; h: number };

// Lugar padrão de cada bloco: "alto" (janela grande) ou "canto" (janela retrato, com o cabeçalho
// ao lado dela). Blocos com título opcional só vão para o canto quando têm o que escrever ao
// lado da janela.
export const lugarPadrao = (m: Momento): "alto" | "canto" => {
  switch (m.tipo) {
    case "titulo":
    case "abertura":
    case "frase":
    case "destaque":
    case "cta":
      return "alto";
    case "pergunta":
      return m.opcoes?.length ? "canto" : "alto";
    case "topicos":
    case "passos":
    case "comparacao":
    case "grafico":
      return m.titulo || m.passo ? "canto" : "alto";
    default:
      return "canto";
  }
};

// No quadro deitado o canto é um só, do lado direito: "esquerda" vale como "direita".
const noQuadroDeitado = (l: Layout): Layout => (l === "alto" ? "alto" : "direita");

// Põe o lugar de cada momento no plano (o que o plano já diz fica; o resto segue o padrão).
// Chamado uma vez, antes de montar as páginas.
export const resolverLugares = <M extends Momento>(momentos: M[]): M[] =>
  momentos.map((m) => ({ ...m, layout: layoutDe(m) }));

export const layoutDe = (m: Momento): Layout => noQuadroDeitado(m.layout ?? (lugarPadrao(m) === "alto" ? "alto" : "direita"));

// as duas molduras, presas à margem direita, do topo da lousa até a linha da legenda
const ALTURA_MOLDURA = BASE_LOUSA - TOPO_LOUSA;
// janela grande (o "alto" do vertical): o rosto com os ombros, a lousa ao lado
const ALTO = { x: W - MARGEM - 720, y: TOPO_LOUSA, w: 720, h: ALTURA_MOLDURA };
// janela retrato (o canto do vertical): mais estreita, para a lousa ganhar largura
const JANELA = { x: W - MARGEM - 540, y: TOPO_LOUSA, w: 540, h: ALTURA_MOLDURA };
// vão entre a lousa e a moldura
const VAO = 64;
// altura do cabeçalho (rótulo + título amarelo) no topo da lousa, no canto
const CABECALHO_H = 196;
// vão entre o cabeçalho e o conteúdo
const VAO_CABECALHO = 36;

// O rosto na moldura: a fração da largura da moldura que o rosto ocupa (o vídeo aproxima até
// chegar nela, sem nunca deixar borda). Na janela retrato o rosto é maior (meio corpo apertado);
// na janela grande aparecem mais os ombros. O rosto gravado em 16:9 tem ~13% da largura do quadro.
const ROSTO_NA_JANELA = 0.5;
const ROSTO_NO_ALTO = 0.36;
const ROSTO_PADRAO_16x9 = 0.13;
// teto da aproximação (acima disso a imagem perde nitidez)
const ZOOM_MAX = 2.2;

const larguraDoRosto = (plano: Plano) => {
  const l = (plano.rosto as Rosto).rastro?.largura;
  return l && l > 0.03 ? l : ROSTO_PADRAO_16x9;
};
const alturaDoVideo = (plano: Plano) => Math.min(H, plano.videoAltura ?? H);

// Zoom que deixa o rosto com `fracao` da largura da moldura. Gravação muito perto da câmera (rosto
// largo no quadro) aproxima menos sozinha: o zoom nunca fica abaixo de 1 (o vídeo cobre a moldura).
const zoomPara = (plano: Plano, caixa: { w: number; h: number }, fracao: number) => {
  const base = Math.max(caixa.w / W, caixa.h / alturaDoVideo(plano));
  const rostoPx = larguraDoRosto(plano) * W * base;
  return Math.min(ZOOM_MAX, Math.max(1, (fracao * caixa.w) / rostoPx));
};

export const caixaDoLayout = (layout: Layout | "cheio", plano: Plano, zoomExtra = 1): Caixa => {
  const videoAltura = alturaDoVideo(plano);
  const ajuste = plano.caixas?.[layout] ?? {};
  switch (layout) {
    case "cheio":
      return {
        ...CHEIO_16x9,
        h: videoAltura,
        zoom: (ajuste.zoom ?? 1) * zoomExtra,
        // o rosto fica onde está: o zoom (×1,07 nos cortes) parte dele
        ancoraX: plano.rosto.x,
        ancoraY: ajuste.ancoraY ?? (plano.rosto.y * H) / videoAltura,
      };
    case "alto":
      return { ...ALTO, raio: 0, zoom: (ajuste.zoom ?? zoomPara(plano, ALTO, ROSTO_NO_ALTO)) * zoomExtra, ancoraX: 0.5, ancoraY: ajuste.ancoraY ?? 0.42 };
    case "direita":
    case "esquerda":
      return { ...JANELA, raio: 0, zoom: (ajuste.zoom ?? zoomPara(plano, JANELA, ROSTO_NA_JANELA)) * zoomExtra, ancoraX: 0.5, ancoraY: ajuste.ancoraY ?? 0.42 };
  }
};

// Onde a lousa escreve em cada layout: a lousa é a coluna da esquerda, até o vão antes da moldura.
// No canto, o cabeçalho fica no topo dela (ao lado da janela) e a conta embaixo. Com legenda, a
// lousa para acima dela; sem legenda, pode descer até perto dos controles do player.
export const regioesDoLayout = (layout: Layout, legenda = true): { cabecalho: Regiao | null; principal: Regiao } => {
  const base = legenda ? BASE_LOUSA : BASE_SEM_LEGENDA;
  if (layout === "alto") {
    const largura = ALTO.x - VAO - MARGEM;
    return { cabecalho: null, principal: { x: MARGEM, y: TOPO_LOUSA, w: largura, h: base - TOPO_LOUSA } };
  }
  const largura = JANELA.x - VAO - MARGEM;
  const topo = TOPO_LOUSA + CABECALHO_H + VAO_CABECALHO;
  return {
    cabecalho: { x: MARGEM, y: TOPO_LOUSA, w: largura, h: CABECALHO_H },
    principal: { x: MARGEM, y: topo, w: largura, h: base - topo },
  };
};

export const TROCA = 0.6;
// quanto a janela sai antes da página nova quando troca de lugar
export const ANTECIPA = 0.25;

// Sequência de estados da janela ao longo do vídeo. Entre momentos com respiro, tela cheia.
// Em cada corte dentro de um mesmo lugar, o enquadramento troca seco (×1 ↔ ×1,07) para disfarçar o pulo.
// Trechos da janela: cada momento abre um trecho (com o lugar dele); respiros longos voltam à tela cheia.
type Trecho = { de: number; layout: Layout | "cheio"; adiantado?: boolean; momento?: number };
export const trechosDaJanela = (plano: Plano): Trecho[] => {
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const trechos: Trecho[] = [{ de: 0, layout: "cheio" }];
  const empurrar = (de: number, layout: Layout | "cheio", adiantado = false, momento?: number) => {
    const ultimo = trechos[trechos.length - 1];
    if (Math.abs(ultimo.de - de) < 0.02) Object.assign(ultimo, { layout, momento });
    else trechos.push({ de, layout, adiantado, momento });
  };
  momentos.forEach((m, i) => {
    // de uma janela para outra, a janela sai um pouco antes da página nova: assim o que nasce onde
    // a janela estava já está livre quando a palavra dele é dita
    const ultimo = trechos[trechos.length - 1];
    const troca = ultimo.layout !== "cheio" && ultimo.layout !== layoutDe(m);
    const antecipa = troca ? Math.min(ANTECIPA, Math.max(0, m.de - ultimo.de - 0.8)) : 0;
    empurrar(Math.max(0, m.de - antecipa), layoutDe(m), antecipa > 0, i);
    const prox = momentos[i + 1];
    if (!prox || prox.de - m.ate > 0.3) empurrar(m.ate, "cheio");
  });
  // a troca começa no corte mais próximo (o movimento esconde o pulo do corte);
  // a troca adiantada só encosta num corte muito perto (senão o corte cai no meio do movimento, que também o esconde)
  const cortes = plano.cortesEm ?? [];
  for (const tr of trechos) {
    const perto = cortes.find((c) => (tr.adiantado ? Math.abs(c - tr.de) < 0.08 : c - tr.de > -0.16 && c - tr.de < 0.1));
    if (perto !== undefined && tr.de > 0) tr.de = perto;
  }
  return trechos;
};

export const estadosDaCaixa = (plano: Plano): EstadoDaCaixa[] => {
  const trechos = trechosDaJanela(plano);
  const cortes = plano.cortesEm ?? [];
  const estados: EstadoDaCaixa[] = [];
  let anterior: Layout | "cheio" | null = null;
  trechos.forEach((tr, i) => {
    const fim = trechos[i + 1]?.de ?? plano.duracao + 1;
    const mudou = anterior !== null && anterior !== tr.layout;
    let zoom = 1;
    estados.push({ de: tr.de, caixa: caixaDoLayout(tr.layout, plano, zoom), dur: mudou ? TROCA : 0.001 });
    let ultimo = tr.de;
    for (const c of cortes) {
      if (c <= tr.de + (mudou ? TROCA + 0.1 : 0.3) || c >= fim - 0.3 || c - ultimo < 1) continue;
      zoom = zoom === 1 ? 1.07 : 1;
      estados.push({ de: c, caixa: caixaDoLayout(tr.layout, plano, zoom), dur: 0.001 });
      ultimo = c;
    }
    anterior = tr.layout;
  });
  return estados;
};
