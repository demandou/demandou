// Gramática de layout do modelo Herbário no quadro DEITADO (16:9, 1920×1080), a versão do vídeo
// completo do YouTube.
//
// A pessoa vive numa moldura OVAL de herbário que muda de tamanho e de lugar; o resto da tela é uma
// prancha botânica. Cada momento ganha uma prancha nova, ao lado da anterior, e a câmera corre pelo
// papel até ela (o que sai cruza com o que entra). Um detalhe da terra logo depois de um vaso não
// corre: a câmera mergulha no mesmo vaso. No fechamento (e nas notas) o oval se abre em tela cheia.
//
// A regra da composição é a da aula 9 do curso (editar uma aula horizontal): a tela cheia é a base;
// quando o momento pede a prancha, a pessoa vai para o OVAL na coluna da DIREITA, com o rosto no meio
// dele e acompanhado de leve pelo rastro do cortar.mjs, e o desenho ocupa o QUADRO da esquerda:
//
//   [ QUADRO: o desenho (x 86–986, y 100–1004)  |  oval em cima, cabeçalho embaixo ("canto") ]
//   [                                           |  ou cabeçalho em cima, oval embaixo ("lado") ]
//
// No vertical o oval troca de canto (direita/esquerda) a cada prancha; aqui ele fica sempre na coluna
// da direita e troca de altura (em cima/embaixo), com o cabeçalho no outro pedaço da coluna. No
// frontispício o oval é grande, na mesma coluna, e o título fica no quadro da esquerda.
//
// O desenho, os blocos e os cabeçalhos ficam numa camada com as medidas do vertical (tema.ts:
// PRANCHA): por isso TOPO_DESENHO, TOPO_CONTEUDO, FUNDO_CONTEUDO e CABECALHO estão em px da camada.
// Os ovais estão em px da tela.
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import type { Momento, Plano, Vista } from "./plano";
import { naCamada, QUADRO } from "./tema";

export type Layout = "capa" | "canto" | "lado" | "cheio";

// Os ovais em cada layout (px no quadro 1920×1080), todos com o centro na coluna da direita
// (x = 1460). `alvo`: a largura do rosto em fração da largura do oval (o zoom sai dela e do rastro).
const CENTRO_DA_COLUNA = 1460;
const OVAIS: Record<Exclude<Layout, "cheio">, Caixa & { alvo: number }> = {
  // frontispício: oval grande na coluna da direita; título e espécime no quadro da esquerda
  capa: { x: CENTRO_DA_COLUNA - 300, y: 140, w: 600, h: 800, ancoraY: 0.4, alvo: 0.35 },
  // oval em cima na coluna da direita; o cabeçalho embaixo dele
  canto: { x: CENTRO_DA_COLUNA - 186, y: 106, w: 372, h: 460, ancoraY: 0.46, alvo: 0.48 },
  // oval embaixo na coluna da direita; o cabeçalho em cima dele
  lado: { x: CENTRO_DA_COLUNA - 186, y: 530, w: 372, h: 460, ancoraY: 0.46, alvo: 0.48 },
};

export type Regiao = { x: number; y: number; w: number; h: number };

// Cabeçalho (rótulo + título) de cada layout de figura: o pedaço da coluna da direita que o oval não
// ocupa (px da tela convertidos para a camada da prancha). O texto encolhe até caber na altura.
const COLUNA_DO_CABECALHO = { x: 1080, w: 760 };
export const CABECALHO: Record<"canto" | "lado", Regiao> = {
  canto: naCamada({ x: COLUNA_DO_CABECALHO.x, y: 604, w: COLUNA_DO_CABECALHO.w, h: 386 }),
  lado: naCamada({ x: COLUNA_DO_CABECALHO.x, y: 104, w: COLUNA_DO_CABECALHO.w, h: 390 }),
};

// Topo da área do desenho (px da camada; o vaso e a janela são os do vertical)
export const TOPO_DESENHO = 640;

// Topo do conteúdo dos blocos universais de prancha (px da camada). No quadro deitado o cabeçalho
// está na coluna da direita: o corpo do bloco começa mais alto que no vertical (700).
export const TOPO_CONTEUDO = 620;
// Limite de baixo de todo texto (px da camada: acima dos controles do player)
export const FUNDO_CONTEUDO = 1530;

export const vistaDe = (m: Momento): Vista => (m.tipo === "figura" ? (m.vista ?? "vaso") : "vaso");

// Momentos em tela cheia: o oval se abre e um cartão (ou a etiqueta de campo) sobe na faixa de baixo
export const TELA_CHEIA = new Set<Momento["tipo"]>(["nota", "cta", "destaque", "frase", "pergunta"]);
export const ehCheio = (m: Momento) => TELA_CHEIA.has(m.tipo);
// Frontispício: o oval grande na coluna da direita
export const ehCapa = (m: Momento) => m.tipo === "capa" || m.tipo === "abertura";

// O layout de cada momento, na ordem. Figuras: vaso/janela com o oval em cima, o detalhe da terra
// com o oval embaixo. Os blocos universais de prancha alternam o oval entre em cima e embaixo (a
// pessoa muda de lugar a cada prancha), começando por cima.
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

const alturaDoVideo = (plano: Plano) => Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
// a largura do rosto (fração da largura do quadro), do rastro do cortar.mjs ou o padrão do 16:9
const larguraDoRosto = (plano: Plano) => {
  const l = plano.rosto.rastro?.largura;
  return l && l > 0.03 ? l : 0.13;
};

export const caixaDoLayout = (layout: Layout, plano: Plano): Caixa => {
  const videoAltura = alturaDoVideo(plano);
  if (layout === "cheio") {
    // âncoras = o rosto: o zoom lento parte do rosto e ele não sai do lugar
    return { x: 0, y: 0, w: QUADRO.w, h: videoAltura, raio: 0, zoom: 1, ancoraY: (plano.rosto.y * QUADRO.h) / videoAltura, ancoraX: plano.rosto.x };
  }
  const { alvo, ...o } = OVAIS[layout];
  // o zoom em que o rosto ocupa `alvo` da largura do oval, seja a pessoa perto ou longe da câmera
  // (zoom 1 = o menor enquadramento que cobre o oval); o `oval.zoom` do plano continua valendo por cima
  const cobre = Math.max(o.w / QUADRO.w, o.h / videoAltura);
  const automatico = Math.min(3, Math.max(1, (alvo * o.w) / (larguraDoRosto(plano) * QUADRO.w * cobre)));
  return {
    ...o,
    zoom: Math.max(1, automatico * (plano.oval?.zoom ?? 1)),
    ancoraY: plano.oval?.ancoraY ?? o.ancoraY,
    // o rosto no meio do oval
    ancoraX: 0.5,
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
