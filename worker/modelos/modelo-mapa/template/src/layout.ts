// A gramática do Mapa, em tempo e espaço: cada momento é uma estação do papel; a câmera desliza de
// uma estação para a próxima e o cartão da pessoa muda de lugar junto. Tudo sai dos momentos do plano.
import { desliza, prog } from "./anim";
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { CARTAO, H, W } from "./tema";

// duração do deslize da câmera (e da troca de lugar do cartão)
export const PASSEIO = 0.64;
// o deslize começa um pouco antes da fronteira: o corte que costuma cair ali fica no meio do movimento
const ANTES = 0.16;
// distância entre estações no papel. Na horizontal, uma tela e uma folga curta; na vertical, a
// próxima estação começa logo abaixo do conteúdo da anterior (o conteúdo vai de y 150 a 1520), para
// que o meio do deslize nunca seja só papel vazio. Como as estações vizinhas se encostam, só a atual
// fica montada com a câmera parada; a anterior só aparece enquanto a câmera desliza.
const PASSO_X = W + 40;
// faixa vertical ocupada pelo conteúdo próprio de cada tipo de estação (sem contar o cartão da pessoa)
const FAIXA: Record<string, { topo: number; base: number }> = {
  mapa: { topo: 980, base: 1500 },
  titulo: { topo: 230, base: 1480 },
  curva: { topo: 170, base: 1500 },
  contador: { topo: 170, base: 1440 },
  barras: { topo: 170, base: 1440 },
  cartoes: { topo: 170, base: 1500 },
  cta: { topo: 980, base: 1500 },
  fala: { topo: 1150, base: 1400 },
  abertura: { topo: 990, base: 1500 },
  frase: { topo: 180, base: 1490 },
  destaque: { topo: 760, base: 1490 },
  pergunta: { topo: 230, base: 1490 },
  numero: { topo: 178, base: 1420 },
  comparacao: { topo: 178, base: 1440 },
  definicao: { topo: 178, base: 1460 },
  topicos: { topo: 178, base: 1490 },
  passos: { topo: 178, base: 1490 },
  grafico: { topo: 178, base: 1500 },
  "mapa-foco": { topo: 178, base: 1490 },
};
// descendo, a próxima estação começa ~110 px abaixo do fim do conteúdo da anterior
const passoY = (de: string, para: string) => {
  const a = FAIXA[de] ?? FAIXA.fala;
  const b = FAIXA[para] ?? FAIXA.fala;
  return Math.min(1450, Math.max(560, a.base - b.topo + 110));
};
// trecho sem momento menor que isto é absorvido pelo momento anterior (não vira estação)
const LACUNA_MINIMA = 0.6;

export type Tipo = Momento["tipo"] | "fala" | "mapa-foco";

// O mapa que abre o vídeo mostra a pessoa grande; no meio do vídeo e com título (que vai para o
// lado do cartão pequeno), o mapa é o herói (`foco`).
export const tipoDaEstacao = (m: Momento, primeiro: boolean): Tipo => {
  if (m.tipo !== "mapa") return m.tipo;
  const foco = m.foco ?? (primeiro || !m.titulo ? "pessoa" : "mapa");
  return foco === "mapa" ? "mapa-foco" : "mapa";
};
export type Direcao = "direita" | "baixo" | "esquerda";

export type Estacao = {
  indice: number;
  tipo: Tipo;
  m?: Momento;
  de: number;
  ate: number;
  // canto de cima à esquerda da estação no papel (px)
  origem: { x: number; y: number };
  // de onde a câmera veio para chegar aqui
  direcao: Direcao;
  // quando a câmera começa a deslizar para cá (−1 na primeira)
  chega: number;
};

export const ordenar = (plano: Plano): Plano => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  return {
    ...plano,
    momentos: ordenados.map((m, i) => {
      const proximo = ordenados[i + 1];
      return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
    }),
  };
};

// Direita, baixo, esquerda, baixo…: o mapa desce em zigue-zague pelo papel.
const CICLO: Direcao[] = ["direita", "baixo", "esquerda", "baixo"];

export const estacoesDoPlano = (plano: Plano): Estacao[] => {
  // fatias de tempo: momentos e os trechos sem momento entre eles (viram estações "fala")
  const fatias: { tipo: Tipo; m?: Momento; de: number; ate: number }[] = [];
  let cursor = 0;
  for (const m of plano.momentos) {
    if (m.de - cursor >= LACUNA_MINIMA) fatias.push({ tipo: "fala", de: cursor, ate: m.de });
    else if (fatias.length) fatias[fatias.length - 1].ate = m.de;
    fatias.push({ tipo: tipoDaEstacao(m, m === plano.momentos[0] && m.de < LACUNA_MINIMA), m, de: fatias.length ? m.de : 0, ate: m.ate });
    cursor = m.ate;
  }
  if (plano.duracao - cursor >= LACUNA_MINIMA || fatias.length === 0) fatias.push({ tipo: "fala", de: cursor, ate: plano.duracao + 1 });
  else fatias[fatias.length - 1].ate = plano.duracao + 1;

  const estacoes: Estacao[] = [];
  let origem = { x: 0, y: 0 };
  fatias.forEach((f, i) => {
    const direcao = i === 0 ? "baixo" : CICLO[(i - 1) % CICLO.length];
    if (i > 0) {
      if (direcao === "direita") origem = { x: origem.x + PASSO_X, y: origem.y };
      if (direcao === "esquerda") origem = { x: origem.x - PASSO_X, y: origem.y };
      if (direcao === "baixo") origem = { x: origem.x, y: origem.y + passoY(fatias[i - 1].tipo, f.tipo) };
    }
    const anterior = estacoes[i - 1];
    const chega = i === 0 ? -1 : Math.max(anterior.de + 0.3, f.de - ANTES);
    estacoes.push({ indice: i, tipo: f.tipo, m: f.m, de: f.de, ate: f.ate, origem: { ...origem }, direcao, chega });
  });
  return estacoes;
};

// A estação em que a câmera está (ou para a qual está indo)
export const estacaoAtual = (t: number, estacoes: Estacao[]) => {
  let atual = estacoes[0];
  for (const e of estacoes) if (t >= e.chega) atual = e;
  return atual;
};

// Câmera: centro (no papel) e zoom. No meio do deslize ela se afasta um pouco (vê mais papel).
export const camera = (t: number, estacoes: Estacao[]) => {
  const atual = estacaoAtual(t, estacoes);
  const anterior = estacoes[atual.indice - 1];
  const centro = (e: Estacao) => ({ x: e.origem.x + W / 2, y: e.origem.y + H / 2 });
  if (!anterior) return { ...centro(atual), zoom: 1, p: 1 };
  const p = prog(t, atual.chega, PASSEIO, desliza);
  const a = centro(anterior);
  const b = centro(atual);
  return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, zoom: 1 - 0.05 * Math.sin(Math.PI * p), p };
};

// Estações montadas agora e a opacidade de cada uma: a atual entra no começo do deslize e a
// anterior sai no fim dele (sem pulo na borda da tela)
export const estacoesNaTela = (t: number, estacoes: Estacao[]) => {
  const atual = estacaoAtual(t, estacoes);
  const anterior = estacoes[atual.indice - 1];
  const lista: { e: Estacao; opacidade: number }[] = [];
  if (anterior && t < atual.chega + PASSEIO) lista.push({ e: anterior, opacidade: 1 - prog(t, atual.chega + PASSEIO * 0.7, PASSEIO * 0.3) });
  lista.push({ e: atual, opacidade: anterior ? prog(t, atual.chega, PASSEIO * 0.25) : 1 });
  return lista;
};

// O cartão de cada tipo, ajustado à gravação. Numa gravação bem perto da câmera (selfie), o rosto
// fica enorme nos cartões e a cabeça não cabe: o zoom do cartão desce (até 1, o menor que cobre o
// cartão) para a cabeça caber, e, quando nem assim cabe, o rosto vai para o meio do cartão.
// `plano.retrato` ajusta à mão (zoom multiplica; ancoraY fixa a altura do rosto).
export const ajustarCartao = (c: Caixa, plano: Plano): Caixa => {
  const r = plano.retrato ?? {};
  let zoom = (c.zoom ?? 1) * (r.zoom ?? 1);
  let ancoraY = r.ancoraY ?? c.ancoraY;
  const largura = plano.rosto.rastro?.largura;
  const vh = Math.min(H, plano.videoAltura ?? H);
  if (largura && c.w < W) {
    const capa = Math.max(c.w / W, c.h / vh);
    const rosto = largura * W;
    // a cabeça inteira (cabelo ao queixo) tem ~1,5 largura de rosto
    const maximo = Math.min((0.84 * c.h) / (1.5 * rosto * capa), (0.62 * c.w) / (rosto * capa));
    if (maximo < zoom) {
      zoom = maximo;
      if (r.ancoraY === undefined && maximo < 1) ancoraY = 0.5;
    }
  }
  return { ...c, zoom: Math.max(1, zoom), ancoraY };
};

// Onde fica o cartão da pessoa em cada estação
export const cartaoDa = (e: Estacao, plano?: Plano): Caixa => {
  const c = { ...(CARTAO[e.tipo] ?? CARTAO.fala) };
  return plano ? ajustarCartao(c, plano) : c;
};

// Estados do cartão ao longo do vídeo (para caixaNoTempo do motor)
export const estadosDaPessoa = (plano: Plano, estacoes: Estacao[]): EstadoDaCaixa[] => {
  const estados: EstadoDaCaixa[] = [];
  const primeiro = cartaoDa(estacoes[0], plano);
  if (plano.abreCheio === false) estados.push({ de: 0, caixa: primeiro, dur: 0.001 });
  else {
    // abre em quadro cheio e recua para o cartão: a primeira coisa que se vê é o rosto, grande
    estados.push({ de: 0, caixa: { ...CARTAO.cheio, ancoraY: plano.rosto.y }, dur: 0.001 });
    estados.push({ de: 0.14, caixa: primeiro, dur: 0.62 });
  }
  for (const e of estacoes.slice(1)) estados.push({ de: e.chega, caixa: cartaoDa(e, plano), dur: PASSEIO });
  return estados;
};

export const pontoDoLado = (c: Caixa, lado: "baixo" | "esquerda" | "direita" | "cima") => {
  if (lado === "baixo") return { x: c.x + c.w / 2, y: c.y + c.h };
  if (lado === "cima") return { x: c.x + c.w / 2, y: c.y };
  if (lado === "esquerda") return { x: c.x, y: c.y + c.h * 0.5 };
  return { x: c.x + c.w, y: c.y + c.h * 0.5 };
};

// Quanto o cartão está "assentado" na estação atual (0 = viajando, 1 = parado), para o ramo da pessoa
export const assentado = (t: number, e: Estacao) => (e.chega < 0 ? prog(t, 0.7, 0.35) : prog(t, e.chega + PASSEIO - 0.05, 0.35));
