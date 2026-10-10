// Gramática de layout da Lousa: onde fica a janela da pessoa e onde fica a conta em cada momento.
import type { Caixa, EstadoDaCaixa, Rosto } from "./motor/caixa";
import type { Layout, Momento, Plano } from "./plano";
import { BASE_LOUSA, BASE_SEM_LEGENDA, MARGEM, W } from "./tema";

export type Regiao = { x: number; y: number; w: number; h: number };

// Lugar padrão de cada bloco: "alto" (janela grande no alto) ou "canto" (janela num canto, com o
// cabeçalho ao lado dela). Os cantos se alternam sozinhos: direita, esquerda, direita…
// Blocos com título opcional só vão para o canto quando têm o que escrever ao lado da janela.
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

// Põe o lugar de cada momento no plano (o que o plano já diz fica; o resto segue o padrão,
// alternando os cantos). Chamado uma vez, antes de montar as páginas.
export const resolverLugares = <M extends Momento>(momentos: M[]): M[] => {
  let ultimoCanto: Layout | null = null;
  return momentos.map((m) => {
    let layout: Layout;
    if (m.layout) layout = m.layout;
    else if (lugarPadrao(m) === "alto") layout = "alto";
    else layout = ultimoCanto === "direita" ? "esquerda" : "direita";
    if (layout !== "alto") ultimoCanto = layout;
    return { ...m, layout };
  });
};

export const layoutDe = (m: Momento): Layout => m.layout ?? (lugarPadrao(m) === "alto" ? "alto" : "direita");

// Janela no canto: retrato (ombros e rosto), presa no alto da lousa
const JANELA = { w: 376, h: 470, y: 140 };
// Janela grande no alto
const ALTO = { x: 180, y: 120, w: 720, h: 680 };
// largura do cabeçalho ao lado da janela (metade da lousa, menos um respiro no meio)
const CABECALHO_W = (W - 2 * MARGEM - 16) / 2;

// Gravação muito perto da câmera (rosto largo no quadro, medido pelo rastreio): as janelas
// aproximam menos, para a cabeça caber inteira. Até esta largura de rosto, o zoom padrão vale.
const ROSTO_PADRAO = 0.4;
const zoomPara = (plano: Plano, padrao: number) => {
  const largura = (plano.rosto as Rosto).rastro?.largura;
  if (!largura || largura <= ROSTO_PADRAO) return padrao;
  return Math.max(1, padrao * (ROSTO_PADRAO / largura));
};

export const caixaDoLayout = (layout: Layout | "cheio", plano: Plano, zoomExtra = 1): Caixa => {
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const ajuste = plano.caixas?.[layout] ?? {};
  switch (layout) {
    case "cheio":
      return {
        x: 0,
        y: 0,
        w: W,
        h: videoAltura,
        raio: 0,
        zoom: (ajuste.zoom ?? 1) * zoomExtra,
        // o rosto fica onde está (na linha do centro): o zoom parte dele
        ancoraY: ajuste.ancoraY ?? (plano.rosto.y * 1920) / videoAltura,
      };
    case "alto":
      return { ...ALTO, raio: 0, zoom: (ajuste.zoom ?? zoomPara(plano, 1.12)) * zoomExtra, ancoraY: ajuste.ancoraY ?? 0.4 };
    case "direita":
      return { x: W - MARGEM - JANELA.w, y: JANELA.y, w: JANELA.w, h: JANELA.h, raio: 0, zoom: (ajuste.zoom ?? zoomPara(plano, 1.7)) * zoomExtra, ancoraY: ajuste.ancoraY ?? 0.42 };
    case "esquerda":
      return { x: MARGEM, y: JANELA.y, w: JANELA.w, h: JANELA.h, raio: 0, zoom: (ajuste.zoom ?? zoomPara(plano, 1.7)) * zoomExtra, ancoraY: ajuste.ancoraY ?? 0.42 };
  }
};

// Onde a lousa escreve em cada layout: o cabeçalho fica ao lado da janela; a conta, embaixo.
// Com legenda, a lousa para acima dela; sem legenda, pode descer até perto da interface do app.
export const regioesDoLayout = (layout: Layout, legenda = true): { cabecalho: Regiao | null; principal: Regiao } => {
  const largura = W - 2 * MARGEM;
  const base = legenda ? BASE_LOUSA : BASE_SEM_LEGENDA;
  const baixoDaJanela = JANELA.y + JANELA.h + 60;
  switch (layout) {
    case "alto": {
      const topo = ALTO.y + ALTO.h + 56;
      return { cabecalho: null, principal: { x: MARGEM, y: topo, w: largura, h: base - topo } };
    }
    // os cabeçalhos da direita e da esquerda não se cruzam: o título novo pode ser escrito na hora
    // em que é dito, mesmo com o da página anterior ainda na lousa
    case "direita":
      return {
        cabecalho: { x: MARGEM, y: 150, w: CABECALHO_W, h: JANELA.h - 50 },
        principal: { x: MARGEM, y: baixoDaJanela, w: largura, h: base - baixoDaJanela },
      };
    case "esquerda":
      return {
        cabecalho: { x: W - MARGEM - CABECALHO_W, y: 150, w: CABECALHO_W, h: JANELA.h - 50 },
        principal: { x: MARGEM, y: baixoDaJanela, w: largura, h: base - baixoDaJanela },
      };
  }
};

export const TROCA = 0.6;
// quanto a janela sai antes da página nova quando troca de lado
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
    // de uma janela para outra, a janela sai um pouco antes da página nova: assim o cabeçalho,
    // que nasce onde a janela estava, já está livre quando a palavra dele é dita
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
