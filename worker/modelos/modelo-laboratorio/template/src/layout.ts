// Gramática de layout do Laboratório: onde fica a janela de observação (a pessoa) e onde ficam
// o cabeçalho e o desenho de cada figura; e a rolagem da página do caderno entre as figuras.
import { prog, vaiVem } from "./anim";
import type { Caixa, EstadoDaCaixa, Rosto } from "./motor/caixa";
import type { Layout, Momento, Plano } from "./plano";
import { BASE_FIGURA, H, MARGEM, NOME_DO_BLOCO, W } from "./tema";

export type Regiao = { x: number; y: number; w: number; h: number };
export type Areas = { cabecalho: Regiao | null; corpo: Regiao };

// Lugar padrão de cada figura (o plano pode trocar com `layout`)
export const LAYOUT_PADRAO: Record<Momento["tipo"], Layout> = {
  titulo: "topo",
  espectro: "direita",
  particulas: "esquerda",
  ondas: "direita",
  observador: "baixo",
  trajeto: "esquerda",
  anotacoes: "direita",
  grafico: "esquerda",
  cta: "topo",
  abertura: "topo",
  topicos: "direita",
  passos: "esquerda",
  numero: "direita",
  comparacao: "esquerda",
  destaque: "topo",
  definicao: "topo",
  frase: "topo",
  pergunta: "direita",
};

const LADOS: Layout[] = ["direita", "esquerda"];

// O lugar de cada momento (na ordem do tempo). Quando duas folhas seguidas cairiam no mesmo lugar e
// o plano não pediu um `layout`, a segunda troca de lado sozinha: a foto que muda de lugar a cada
// folha é a assinatura do modelo. Só o `observador` usa o "baixo".
const guardados = new WeakMap<Momento[], Layout[]>();
export const layoutsDoPlano = (momentos: Momento[]): Layout[] => {
  const guardado = guardados.get(momentos);
  if (guardado) return guardado;
  const ordem = [...momentos].sort((a, b) => a.de - b.de);
  const saida: Layout[] = [];
  let ultimoLado: Layout = "esquerda";
  ordem.forEach((m, i) => {
    let l: Layout = m.tipo === "observador" ? "baixo" : (m.layout ?? LAYOUT_PADRAO[m.tipo]);
    if (l === "baixo" && m.tipo !== "observador") l = LAYOUT_PADRAO[m.tipo] === "baixo" ? "direita" : LAYOUT_PADRAO[m.tipo];
    const anterior = saida[i - 1];
    const pedido = m.layout !== undefined || m.tipo === "observador";
    if (!pedido && anterior === l) {
      if (LADOS.includes(l)) l = l === "direita" ? "esquerda" : "direita";
      else if (l === "topo" && m.tipo !== "titulo" && m.tipo !== "abertura" && m.tipo !== "cta") l = ultimoLado === "direita" ? "esquerda" : "direita";
    }
    if (LADOS.includes(l)) ultimoLado = l;
    saida.push(l);
  });
  // a lista guardada segue a ordem de `momentos` (que já vem ordenada no Edicao e no layout)
  const porMomento = momentos.map((m) => saida[ordem.indexOf(m)]);
  guardados.set(momentos, porMomento);
  return porMomento;
};

// O lugar de um momento do plano
export const layoutDe = (m: Momento, momentos?: Momento[]): Layout => {
  if (momentos) {
    const i = momentos.indexOf(m);
    if (i >= 0) return layoutsDoPlano(momentos)[i];
  }
  if (m.tipo === "observador") return "baixo";
  const pedido = m.layout ?? LAYOUT_PADRAO[m.tipo];
  return pedido === "baixo" ? LAYOUT_PADRAO[m.tipo] : pedido;
};

// A janela redonda em cada lugar: centro, diâmetro e enquadramento padrão (gravação sentada, do
// peito para cima: cabeça inteira, um pouco de ombro, rosto um pouco acima do centro)
export const JANELAS: Record<Layout, { cx: number; cy: number; d: number; zoom: number; ancoraY: number }> = {
  topo: { cx: 540, cy: 490, d: 640, zoom: 1.32, ancoraY: 0.46 },
  direita: { cx: 800, cy: 410, d: 430, zoom: 1.62, ancoraY: 0.47 },
  esquerda: { cx: 280, cy: 410, d: 430, zoom: 1.62, ancoraY: 0.47 },
  baixo: { cx: 540, cy: 1150, d: 420, zoom: 1.62, ancoraY: 0.47 },
};

// O horizonte do "baixo": a janela fica em pé nele
export const HORIZONTE = 1190;

export const areasDoLayout = (layout: Layout): Areas => {
  const largura = W - 2 * MARGEM;
  switch (layout) {
    case "topo": {
      const { cy, d } = JANELAS.topo;
      const y = cy + d / 2 + 44;
      return { cabecalho: null, corpo: { x: MARGEM, y, w: largura, h: BASE_FIGURA - y } };
    }
    case "direita":
    case "esquerda": {
      const j = JANELAS[layout];
      const ladoW = W - 2 * MARGEM - j.d - 40;
      const x = layout === "direita" ? MARGEM : j.cx + j.d / 2 + 40;
      const yCorpo = j.cy + j.d / 2 + 50;
      return {
        cabecalho: { x, y: j.cy - j.d / 2 + 10, w: ladoW, h: j.d - 20 },
        corpo: { x: MARGEM, y: yCorpo, w: largura, h: BASE_FIGURA - yCorpo },
      };
    }
    case "baixo":
      // o céu em cima da pessoa, até o horizonte
      return { cabecalho: null, corpo: { x: MARGEM, y: 170, w: largura, h: HORIZONTE - 170 } };
  }
};

export const caixaDoLayout = (layout: Layout | "cheio", plano: Plano, zoomCheio = 1): Caixa => {
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const ajuste = plano.caixas?.[layout] ?? {};
  if (layout === "cheio") {
    return {
      x: 0,
      y: 0,
      w: W,
      h: videoAltura,
      raio: 0,
      zoom: (ajuste.zoom ?? 1) * zoomCheio,
      // o rosto fica onde está (na linha do centro): o zoom parte dele
      ancoraY: ajuste.ancoraY ?? (plano.rosto.y * 1920) / videoAltura,
    };
  }
  const j = JANELAS[layout];
  // com o rastro do rosto, o zoom da foto se ajusta à gravação: o rosto fica do mesmo tamanho na
  // foto redonda esteja a pessoa perto (selfie) ou longe da câmera (o demo foi medido com rosto ≈ 0,25)
  const larguraRosto = (plano.rosto as Rosto).rastro?.largura;
  const zoomAuto = larguraRosto ? Math.max(1, Math.min(2.6, (0.25 * j.zoom) / larguraRosto)) : j.zoom;
  return {
    x: j.cx - j.d / 2,
    y: j.cy - j.d / 2,
    w: j.d,
    h: j.d,
    raio: j.d / 2,
    zoom: ajuste.zoom ?? zoomAuto,
    ancoraY: ajuste.ancoraY ?? j.ancoraY,
  };
};

// Duração da viagem da janela (saindo/voltando da tela cheia) e da subida da folha nova
export const VIAGEM = 0.62;
export const ROLAGEM = 0.7;

export type Trecho = { de: number; layout: Layout | "cheio"; momento?: number };

// Trechos: cada momento abre um trecho com o lugar dele; respiros longos voltam à tela cheia.
// A troca começa no corte mais próximo (o movimento esconde o pulo do corte).
export const trechosDaJanela = (plano: Plano): Trecho[] => {
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const trechos: Trecho[] = [{ de: 0, layout: "cheio" }];
  const empurrar = (de: number, layout: Layout | "cheio", momento?: number) => {
    const ultimo = trechos[trechos.length - 1];
    if (Math.abs(ultimo.de - de) < 0.02) Object.assign(ultimo, { layout, momento });
    else trechos.push({ de, layout, momento });
  };
  momentos.forEach((m, i) => {
    empurrar(Math.max(0, m.de), layoutDe(m, plano.momentos), i);
    const prox = momentos[i + 1];
    if (!prox || prox.de - m.ate > 0.3) {
      // o último momento fica até o fim
      if (prox) empurrar(m.ate, "cheio");
    }
  });
  const cortes = plano.cortesEm ?? [];
  for (const tr of trechos) {
    const perto = cortes.find((c) => c - tr.de > -0.16 && c - tr.de < 0.12);
    if (perto !== undefined && tr.de > 0) tr.de = perto;
  }
  return trechos;
};

export const estadosDaCaixa = (plano: Plano): EstadoDaCaixa[] => {
  const trechos = trechosDaJanela(plano);
  const cortes = plano.cortesEm ?? [];
  const estados: EstadoDaCaixa[] = [];
  let anterior: Layout | "cheio" | null = null;
  let zoom = 1;
  trechos.forEach((tr, i) => {
    const fim = trechos[i + 1]?.de ?? plano.duracao + 1;
    const mudou = anterior !== null && anterior !== tr.layout;
    if (tr.layout === "cheio") {
      if (anterior !== null) zoom = zoom === 1 ? 1.06 : 1;
      estados.push({ de: tr.de, caixa: caixaDoLayout("cheio", plano, zoom), dur: mudou ? VIAGEM : 0.001 });
      // em tela cheia, o enquadramento troca seco a cada corte (×1 ↔ ×1,06) para disfarçar o pulo
      let ultimo = tr.de;
      for (const c of cortes) {
        if (c <= tr.de + 0.5 || c >= fim - 0.4 || c - ultimo < 1) continue;
        zoom = zoom === 1 ? 1.06 : 1;
        estados.push({ de: c, caixa: caixaDoLayout("cheio", plano, zoom), dur: 0.001 });
        ultimo = c;
      }
    } else {
      estados.push({ de: tr.de, caixa: caixaDoLayout(tr.layout, plano), dur: mudou ? VIAGEM : 0.001 });
    }
    anterior = tr.layout;
  });
  return estados;
};

// ---------- as folhas do caderno ----------
//
// Cada momento é uma FOLHA do caderno, com a foto da pessoa colada no lugar dela (a arte da
// folha é diagramada em volta desse lugar, então a foto nunca fica por cima de um desenho).
// Entre duas figuras coladas, a folha nova sobe de baixo por cima da anterior, já com o esboço a
// lápis à vista, e a anterior sobe um pouco até a foto dela sair pelo alto (nenhum papel vazio,
// nenhum rosto coberto). Saindo da tela cheia, a folha sobe colada na borda de baixo da pessoa,
// que encolhe até o lugar da foto; voltando para a tela cheia, o contrário.

// Instante em que cada momento "chega" (o começo do trecho dele, já encostado no corte)
export const chegadas = (plano: Plano): number[] => {
  const trechos = trechosDaJanela(plano);
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  return momentos.map((_, i) => trechos.find((tr) => tr.momento === i)?.de ?? momentos[i].de);
};

// borda da foto (papel em volta) e o círculo a tinta riscado em volta dela
export const BORDA_FOTO = 11;
export const FOLGA_ANEL = 16;

// a base da foto de cada lugar (com a borda e o círculo a tinta)
export const baseDaFoto = (layout: Layout) => JANELAS[layout].cy + JANELAS[layout].d / 2 + BORDA_FOTO + FOLGA_ANEL + 6;

export type Folha = {
  i: number;
  // deslocamento vertical da folha (px; 0 = no lugar)
  offset: number;
  // a foto é desenhada na folha (false = a pessoa está na janela grande, saindo ou voltando da tela cheia)
  foto: boolean;
  // sombra na borda de cima (folha que sobe por cima de outra)
  sombra: boolean;
  // quando o círculo a tinta é riscado em volta da foto
  anelEm: number;
};

export const folhasNoTempo = (t: number, plano: Plano, inicios: number[], fundoDaJanela: number): Folha[] => {
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const trechos = trechosDaJanela(plano);
  const indice = (i: number) => trechos.findIndex((tr) => tr.momento === i);
  // a figura i vem colada na anterior (sem tela cheia no meio)?
  const colada = (i: number) => {
    const k = indice(i);
    return i > 0 && k > 0 && trechos[k - 1].momento === i - 1 && trechos[k - 1].layout !== "cheio";
  };
  const folhas: Folha[] = [];
  momentos.forEach((m, i) => {
    const layout = layoutDe(m, plano.momentos);
    const T = inicios[i];
    if (t < T) return;
    const k = indice(i);
    const depois = trechos[k + 1];
    const proxColada = i + 1 < momentos.length && colada(i + 1);
    // saindo ou voltando da tela cheia, o desenho (embaixo do lugar da foto) acompanha a borda de
    // baixo da pessoa e nunca fica por baixo dela; no "baixo" (céu em cima da pessoa) a folha fica
    // parada e o desenho só aparece quando ela já encolheu
    // (só no "topo": nos cantos, a folha já está no lugar e a pessoa, encolhendo para o canto, revela
    // o cabeçalho e o desenho, que já estão esboçados; nenhum quadro de papel vazio)
    const seguindo = layout !== "topo" ? 0 : Math.max(0, fundoDaJanela - (areasDoLayout(layout).corpo.y - 24));
    let offset = 0;
    let foto = true;
    let sombra = false;
    if (colada(i) && t < T + ROLAGEM) {
      offset = H * (1 - prog(t, T, ROLAGEM, vaiVem));
      sombra = true;
    } else if (!colada(i) && t < T + VIAGEM) {
      offset = seguindo;
      foto = false;
    }
    if (proxColada) {
      const T2 = inicios[i + 1];
      if (t >= T2 + ROLAGEM) return;
      if (t >= T2) offset = -(baseDaFoto(layout) + 60) * prog(t, T2, ROLAGEM, vaiVem);
    } else if (depois && depois.layout === "cheio") {
      if (t >= depois.de + VIAGEM) return;
      if (t >= depois.de) {
        offset = seguindo;
        foto = false;
      }
    }
    folhas.push({ i, offset, foto, sombra, anelEm: colada(i) ? T + ROLAGEM - 0.05 : T + VIAGEM });
  });
  return folhas;
};

// ---------- a linha impressa de cada folha ----------

// Desenhos contam "Fig. 1, Fig. 2…"; blocos de texto contam "Nota 1, Nota 2…"
const NOTAS = new Set(["topicos", "anotacoes", "destaque", "definicao", "frase", "pergunta"]);
export const rotuloDe = (momentos: Momento[], i: number): string => {
  const m = momentos[i];
  const proprio = m.tipo === "numero" ? m.impresso : m.rotulo;
  if (proprio) return proprio;
  const nome = NOME_DO_BLOCO[m.tipo] ?? "";
  if (m.tipo === "titulo" || m.tipo === "abertura" || m.tipo === "cta") return nome;
  const nota = NOTAS.has(m.tipo);
  const n = momentos.slice(0, i + 1).filter((x) => x.tipo !== "titulo" && x.tipo !== "abertura" && x.tipo !== "cta" && NOTAS.has(x.tipo) === nota).length;
  return `${nota ? "Nota" : "Fig."} ${n} · ${nome}`;
};
