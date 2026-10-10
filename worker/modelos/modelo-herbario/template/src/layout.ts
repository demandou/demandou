// Gramática de layout do modelo Herbário.
//
// A pessoa vive numa moldura OVAL de herbário que muda de tamanho e de lugar; o resto da tela é uma
// prancha botânica. Cada momento ganha uma prancha nova, ao lado da anterior, e a câmera corre pelo
// papel até ela (o que sai cruza com o que entra). Um detalhe da terra logo depois de um vaso não
// corre: a câmera mergulha no mesmo vaso. No fechamento (e nas notas) o oval se abre em tela cheia.
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import type { Momento, Plano, Vista } from "./plano";

export type Layout = "capa" | "canto" | "lado" | "cheio";

// Os ovais em cada layout (px no quadro 1080×1920). zoom/ancoraY: enquadramento do rosto dentro dele.
const OVAIS: Record<Exclude<Layout, "cheio">, Caixa> = {
  // frontispício: oval grande no alto, título embaixo
  capa: { x: 230, y: 130, w: 620, h: 800, zoom: 1.3, ancoraY: 0.4 },
  // figura: oval pequeno no canto de cima à direita; cabeçalho à esquerda; desenho embaixo
  canto: { x: 628, y: 118, w: 392, h: 500, zoom: 1.78, ancoraY: 0.46 },
  // detalhe da terra: oval à esquerda; cabeçalho à direita
  lado: { x: 56, y: 118, w: 428, h: 542, zoom: 1.66, ancoraY: 0.46 },
};

export type Regiao = { x: number; y: number; w: number; h: number };

// Cabeçalho (rótulo + título) de cada layout de figura
export const CABECALHO: Record<"canto" | "lado", Regiao> = {
  canto: { x: 72, y: 146, w: 522, h: 420 },
  lado: { x: 518, y: 146, w: 504, h: 440 },
};

// Topo da área do desenho (abaixo do cabeçalho e do oval)
export const TOPO_DESENHO = 640;

// Topo do conteúdo dos blocos universais de prancha (abaixo do cabeçalho e dos dois ovais)
export const TOPO_CONTEUDO = 700;
// Limite de baixo de todo texto (acima da interface do aplicativo)
export const FUNDO_CONTEUDO = 1530;

export const vistaDe = (m: Momento): Vista => (m.tipo === "figura" ? (m.vista ?? "vaso") : "vaso");

// Momentos em tela cheia: o oval se abre e um cartão (ou a etiqueta de campo) sobe até o peito
export const TELA_CHEIA = new Set<Momento["tipo"]>(["nota", "cta", "destaque", "frase", "pergunta"]);
export const ehCheio = (m: Momento) => TELA_CHEIA.has(m.tipo);
// Frontispício: o oval grande no alto
export const ehCapa = (m: Momento) => m.tipo === "capa" || m.tipo === "abertura";

// O layout de cada momento, na ordem. Figuras: vaso/janela com o oval no canto direito, o detalhe da
// terra com o oval à esquerda. Os blocos universais de prancha alternam o oval entre o canto direito e
// o esquerdo (a pessoa muda de lugar a cada prancha), começando pelo direito.
export const layoutsDosMomentos = (plano: Plano): Map<Momento, Layout> => {
  const ms = ordenar(plano);
  const mapa = new Map<Momento, Layout>();
  let ultimoOval: Layout = "lado";
  ms.forEach((m) => {
    let l: Layout;
    if (ehCapa(m)) l = "capa";
    else if (ehCheio(m)) l = "cheio";
    else if (m.tipo === "figura") l = vistaDe(m) === "terra" ? "lado" : "canto";
    else l = ultimoOval === "canto" ? "lado" : "canto";
    if (l === "canto" || l === "lado") ultimoOval = l;
    mapa.set(m, l);
  });
  return mapa;
};

export const caixaDoLayout = (layout: Layout, plano: Plano): Caixa => {
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  if (layout === "cheio") {
    return { x: 0, y: 0, w: 1080, h: videoAltura, raio: 0, zoom: 1, ancoraY: (plano.rosto.y * 1920) / videoAltura };
  }
  const o = OVAIS[layout];
  // gravação muito perto da câmera (rosto largo no quadro, medido pelo rastreio): o oval afasta
  // sozinho para a cabeça caber; o `oval.zoom` do plano continua valendo por cima
  const largura = plano.rosto.rastro?.largura;
  const afasta = largura ? Math.min(1, Math.max(0.5, 0.27 / largura)) : 1;
  return {
    ...o,
    zoom: Math.max(1, (o.zoom ?? 1) * afasta * (plano.oval?.zoom ?? 1)),
    ancoraY: plano.oval?.ancoraY ?? o.ancoraY,
  };
};

// Duração das viagens (oval e câmera)
export const VIAGEM = 0.72;

const ordenar = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);
const colados = (a?: Momento, b?: Momento) => !!a && !!b && b.de - a.ate < 1.2;

// A troca começa um pouco antes do corte mais próximo (o movimento esconde o pulo do corte)
export const inicioDaTroca = (de: number, plano: Plano) => {
  if (de < 0.05) return 0;
  const perto = (plano.cortesEm ?? []).find((c) => c - de > -0.3 && c - de < 0.15);
  return Math.max(0, (perto ?? de) - 0.14);
};

type Trecho = { de: number; layout: Layout };

// Trechos de layout: cada momento no seu; buraco de 1,2 s ou mais sem momento = tela cheia com legenda
export const trechos = (plano: Plano): Trecho[] => {
  const ms = ordenar(plano);
  const lista: Trecho[] = [];
  const empurrar = (de: number, layout: Layout) => {
    const ultimo = lista[lista.length - 1];
    if (ultimo && Math.abs(ultimo.de - de) < 0.02) ultimo.layout = layout;
    else if (!ultimo || ultimo.layout !== layout) lista.push({ de, layout });
  };
  const layouts = layoutsDosMomentos(plano);
  if (!ms.length || ms[0].de > 0.05) empurrar(0, "cheio");
  ms.forEach((m, i) => {
    empurrar(i === 0 ? Math.max(0, m.de) : inicioDaTroca(m.de, plano), layouts.get(m) ?? "canto");
    const prox = ms[i + 1];
    if (!prox || prox.de - m.ate >= 1.2) {
      if (prox || m.ate < plano.duracao - 0.3) empurrar(inicioDaTroca(m.ate, plano), "cheio");
    }
  });
  return lista;
};

export const estadosDaCaixa = (plano: Plano): EstadoDaCaixa[] => {
  const lista = trechos(plano);
  const estados: EstadoDaCaixa[] = [];
  lista.forEach((tr, i) => {
    estados.push({ de: tr.de, caixa: caixaDoLayout(tr.layout, plano), dur: i === 0 ? 0.001 : VIAGEM });
    // tela cheia depois do oval: a câmera continua chegando devagar (nada fica parado)
    const fim = lista[i + 1]?.de ?? plano.duracao;
    const de = tr.de + (i === 0 ? 0 : VIAGEM) + 0.02;
    if (tr.layout === "cheio" && fim - de > 1.2) {
      estados.push({ de, caixa: { ...caixaDoLayout("cheio", plano), zoom: 1.05 }, dur: Math.min(3, fim - de) });
    }
  });
  return estados;
};

// Quão "oval" é a moldura no instante t (1 = oval, 0 = retângulo de tela cheia). Na abertura do
// oval para a tela cheia, a elipse cresce primeiro e só no fim os cantos se abrem.
export const ovalidade = (t: number, plano: Plano) => {
  const lista = trechos(plano);
  let i = 0;
  for (let k = 0; k < lista.length; k++) if (lista[k].de <= t) i = k;
  const atual = lista[i].layout === "cheio" ? 0 : 1;
  if (i === 0) return atual;
  const antes = lista[i - 1].layout === "cheio" ? 0 : 1;
  const p = Math.min(1, Math.max(0, (t - lista[i].de) / VIAGEM));
  if (antes === atual) return atual;
  // abrindo: os cantos só aparecem no último terço; fechando: vira elipse logo no começo
  const q = atual === 0 ? Math.min(1, Math.max(0, (p - 0.55) / 0.45)) : Math.min(1, p / 0.35);
  const suave = q * q * (3 - 2 * q);
  return antes + (atual - antes) * suave;
};

// ---------- pranchas (o papel com as figuras, lado a lado) ----------

export type Prancha = {
  indice: number;
  // momentos desenhados nesta prancha (1, ou 2 quando o detalhe da terra mergulha no vaso)
  momentos: Momento[];
  vista: Vista | "capa" | "bloco";
  // onde fica o oval nesta prancha (o cabeçalho fica do outro lado)
  layout: Layout;
  // quando a câmera chega (início da troca) e quando mergulha no detalhe (se houver)
  chegada: number;
  mergulho?: number;
  // a pessoa estava em tela cheia antes desta prancha: a câmera chega de uma vez, escondida atrás
  // do vídeo, e a prancha nova aparece em volta do oval que encolhe (nada da prancha velha volta)
  salto?: boolean;
};

export const pranchas = (plano: Plano): Prancha[] => {
  const ms = ordenar(plano);
  const layouts = layoutsDosMomentos(plano);
  const lista: Prancha[] = [];
  ms.forEach((m, i) => {
    const anterior = ms[i - 1];
    const troca = i === 0 ? 0 : inicioDaTroca(m.de, plano);
    if (ehCheio(m)) return;
    // antes desta prancha a pessoa estava em tela cheia (um cartão, ou um trecho só com legenda)
    const vemDoCheio = !anterior || ehCheio(anterior) || m.de - anterior.ate >= 1.2;
    const ultima = lista[lista.length - 1];
    if (
      m.tipo === "figura" &&
      vistaDe(m) === "terra" &&
      ultima &&
      ultima.vista === "vaso" &&
      ultima.momentos.length === 1 &&
      anterior === ultima.momentos[0] &&
      colados(anterior, m)
    ) {
      ultima.momentos.push(m);
      ultima.mergulho = troca;
      return;
    }
    lista.push({
      indice: lista.length,
      momentos: [m],
      vista: ehCapa(m) ? "capa" : m.tipo === "figura" ? vistaDe(m) : "bloco",
      layout: layouts.get(m) ?? "canto",
      chegada: troca,
      salto: lista.length > 0 && vemDoCheio,
    });
  });
  return lista;
};

// Posição da câmera (em pranchas: 0 = a primeira) no instante t
export const cameraEm = (t: number, lista: Prancha[], suave: (p: number) => number) => {
  if (!lista.length) return 0;
  let x = 0;
  for (const p of lista) {
    if (p.indice === 0) continue;
    if (p.salto) {
      x += t >= p.chegada ? 1 : 0;
      continue;
    }
    const q = Math.min(1, Math.max(0, (t - p.chegada) / VIAGEM));
    x += suave(q);
  }
  return x;
};
