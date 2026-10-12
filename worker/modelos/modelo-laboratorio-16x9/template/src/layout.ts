// Gramática de layout do Laboratório no quadro deitado (16:9, 1920×1080): onde fica a janela de
// observação (a pessoa) e onde ficam o cabeçalho e o desenho de cada figura; e a rolagem da página
// do caderno entre as figuras.
//
// A regra é a da aula 9 do curso (editar uma aula horizontal): a pessoa em tela cheia é a base;
// quando a fala pede uma figura, a pessoa vira a foto redonda colada no caderno do lado DIREITO,
// com o rosto centralizado nela e acompanhado com ajuste suave (o rastro do cortar.mjs), e a
// figura ocupa a coluna da ESQUERDA. Os lugares do vertical continuam, recompostos em colunas:
//
//   "topo"   (foto grande): [ linha impressa + texto (958 × 804)       |  foto grande (Ø 660) ]
//   canto    (foto menor):  [ cabeçalho: rótulo + título (1038 × 240)  |                      ]
//                           [ desenho da figura (1038 × 528)           |  foto (Ø 580)        ]
//   "baixo"  (observador): o céu na largura toda, a pessoa em pé no horizonte, no meio
//
// A foto fica sempre do lado direito (a aula 9 fixa a moldura à direita): "direita" e "esquerda"
// do plano são o mesmo canto. Entre figuras coladas, a folha nova sobe por cima da anterior (a
// foto muda de tamanho entre o "topo" e o canto), e a pessoa volta à tela cheia nos respiros.
import { prog, vaiVem } from "./anim";
import { CHEIO_16x9, type Caixa, type EstadoDaCaixa, type Rosto } from "./motor/caixa";
import type { Layout, Momento, Plano } from "./plano";
import { BASE_FIGURA, H, MARGEM, NOME_DO_BLOCO, TOPO_FIGURA, W } from "./tema";

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
// o plano não pediu um `layout`, a segunda troca de lado sozinha (no vertical, a foto que muda de
// lugar a cada folha é a assinatura do modelo; no quadro deitado os dois lados são o mesmo canto à
// direita, e a troca de folha continua: a folha nova sobe por cima). Um bloco de texto no "topo"
// logo depois de outro "topo" vai para o canto (a foto muda de tamanho). Só o `observador` usa o "baixo".
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

// borda da foto (papel em volta) e o círculo a tinta riscado em volta dela
export const BORDA_FOTO = 11;
export const FOLGA_ANEL = 16;
// do centro da foto até o fim do círculo a tinta, além do raio
const ANEL = BORDA_FOTO + FOLGA_ANEL;
// vão entre a coluna da figura e o círculo a tinta da foto
const VAO = 56;
// o meio da altura útil (entre o topo das figuras e a base acima da legenda)
const MEIO_Y = Math.round((TOPO_FIGURA + BASE_FIGURA) / 2);
// o centro de uma foto de diâmetro d presa à margem direita
const presaADireita = (d: number) => W - MARGEM - ANEL - d / 2;

// O horizonte do "baixo": a janela fica em pé nele (alto o bastante para a foto, com o círculo a
// tinta, terminar acima da faixa da legenda)
export const HORIZONTE = 660;

// A janela redonda em cada lugar: centro, diâmetro, a fração da largura da foto que o rosto ocupa
// (gravação sentada, do peito para cima: cabeça inteira, um pouco de ombro) e a altura do rosto
// na foto (um pouco acima do centro). Tudo do lado direito; no "baixo", no meio, em pé no horizonte.
export const JANELAS: Record<Layout, { cx: number; cy: number; d: number; rosto: number; ancoraY: number }> = {
  topo: { cx: presaADireita(660), cy: MEIO_Y, d: 660, rosto: 0.33, ancoraY: 0.46 },
  direita: { cx: presaADireita(580), cy: MEIO_Y, d: 580, rosto: 0.4, ancoraY: 0.47 },
  esquerda: { cx: presaADireita(580), cy: MEIO_Y, d: 580, rosto: 0.4, ancoraY: 0.47 },
  baixo: { cx: W / 2, cy: HORIZONTE - 40, d: 360, rosto: 0.4, ancoraY: 0.47 },
};

// altura do cabeçalho do canto (rótulo impresso + até 2 linhas de título) e o vão até o desenho
const CABECALHO_H = 240;
const VAO_CABECALHO = 36;

export const areasDoLayout = (layout: Layout): Areas => {
  switch (layout) {
    case "topo": {
      const j = JANELAS.topo;
      const largura = j.cx - j.d / 2 - ANEL - VAO - MARGEM;
      return { cabecalho: null, corpo: { x: MARGEM, y: TOPO_FIGURA, w: largura, h: BASE_FIGURA - TOPO_FIGURA } };
    }
    case "direita":
    case "esquerda": {
      const j = JANELAS[layout];
      const largura = j.cx - j.d / 2 - ANEL - VAO - MARGEM;
      const yCorpo = TOPO_FIGURA + CABECALHO_H + VAO_CABECALHO;
      return {
        cabecalho: { x: MARGEM, y: TOPO_FIGURA, w: largura, h: CABECALHO_H },
        corpo: { x: MARGEM, y: yCorpo, w: largura, h: BASE_FIGURA - yCorpo },
      };
    }
    case "baixo":
      // o céu na largura toda, em cima da pessoa, até o horizonte
      return { cabecalho: null, corpo: { x: MARGEM, y: TOPO_FIGURA, w: W - 2 * MARGEM, h: HORIZONTE - TOPO_FIGURA } };
  }
};

// O rosto gravado em 16:9 tem ~13% da largura do quadro (quando o plano não tem o rastro)
const ROSTO_PADRAO_16x9 = 0.13;
// teto da aproximação (acima disso a imagem perde nitidez)
const ZOOM_MAX = 2.6;
const alturaDoVideo = (plano: Plano) => Math.min(H, plano.videoAltura ?? H);
const larguraDoRosto = (plano: Plano) => {
  const l = (plano.rosto as Rosto).rastro?.largura;
  return l && l > 0.03 ? l : ROSTO_PADRAO_16x9;
};
// Zoom que deixa o rosto com `fracao` da largura da foto: o rosto fica do mesmo tamanho na foto
// redonda esteja a pessoa perto ou longe da câmera. Nunca abaixo de 1 (o vídeo cobre a foto).
const zoomPara = (plano: Plano, d: number, fracao: number) => {
  const base = Math.max(d / W, d / alturaDoVideo(plano));
  const rostoPx = larguraDoRosto(plano) * W * base;
  return Math.min(ZOOM_MAX, Math.max(1, (fracao * d) / rostoPx));
};

export const caixaDoLayout = (layout: Layout | "cheio", plano: Plano, zoomCheio = 1): Caixa => {
  const videoAltura = alturaDoVideo(plano);
  const ajuste = plano.caixas?.[layout] ?? {};
  if (layout === "cheio") {
    return {
      ...CHEIO_16x9,
      h: videoAltura,
      zoom: (ajuste.zoom ?? 1) * zoomCheio,
      // o rosto fica onde está: o zoom (×1,06 nos cortes) parte dele
      ancoraX: plano.rosto.x,
      ancoraY: ajuste.ancoraY ?? (plano.rosto.y * H) / videoAltura,
    };
  }
  const j = JANELAS[layout];
  return {
    x: j.cx - j.d / 2,
    y: j.cy - j.d / 2,
    w: j.d,
    h: j.d,
    raio: j.d / 2,
    zoom: ajuste.zoom ?? zoomPara(plano, j.d, j.rosto),
    // o rosto no meio da foto (na horizontal) e um pouco acima do centro
    ancoraX: 0.5,
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
// nenhum rosto coberto). Saindo da tela cheia, a pessoa encolhe para a direita até o lugar da
// foto e revela a folha, que já está no lugar; voltando para a tela cheia, o contrário.

// Instante em que cada momento "chega" (o começo do trecho dele, já encostado no corte)
export const chegadas = (plano: Plano): number[] => {
  const trechos = trechosDaJanela(plano);
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  return momentos.map((_, i) => trechos.find((tr) => tr.momento === i)?.de ?? momentos[i].de);
};

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
    // saindo ou voltando da tela cheia, a folha já está no lugar: no quadro deitado a figura fica
    // ao lado da foto (nunca embaixo dela), e a pessoa, encolhendo para a direita, revela a coluna
    // da esquerda, que já está esboçada (nenhum quadro de papel vazio); no "baixo" (céu em cima da
    // pessoa) o desenho só aparece quando ela já encolheu. (`fundoDaJanela` só serve ao vertical.)
    void fundoDaJanela;
    const seguindo = 0;
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
