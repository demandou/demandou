// A gramática do Raio-X, em tempo: quando a pessoa está em quadro cheio, quando vira a chapa
// iluminada no alto (à esquerda ou à direita) com o negatoscópio aceso embaixo, e quando vai para o
// centro (pausa). Tudo sai dos momentos do plano.
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import { type Ajuste, ehDeChapa, type ItemDoRaioX, type Momento, type MomentoDeChapa, type Pausa, type Plano } from "./plano";
import { H, PESSOA_CENTRO, PESSOA_DIREITA, PESSOA_ESQUERDA, W } from "./tema";

// duração da troca de lugar da pessoa
export const TROCA = 0.55;
// a troca começa um instante antes do momento: o corte da fala, que costuma ficar na fronteira,
// cai no meio do movimento
export const ANTES = 0.06;
// a chapa nova desliza sobre a anterior
export const DESLIZA = 0.5;

// `numero`/`total`: a posição desta chapa entre as chapas do vídeo (os quadradinhos do título);
// `ajuste`/`ajustes`: a posição entre os ajustes (a etiqueta "AJUSTE 1/3")
export type Trecho =
  | { tipo: "cheio"; de: number; ate: number; momento?: Momento }
  | { tipo: "chapa"; de: number; ate: number; momento: MomentoDeChapa; lado: "esquerda" | "direita"; numero: number; total: number; ajuste: number; ajustes: number }
  | { tipo: "pausa"; de: number; ate: number; momento: Pausa };

// um momento nunca invade o seguinte
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

export const trechosDoPlano = (plano: Plano): Trecho[] => {
  const chapas = plano.momentos.filter(ehDeChapa);
  const ajustes = chapas.filter((m) => m.tipo === "ajuste");
  const trechos: Trecho[] = [];
  let cursor = 0;
  let ladoAnterior: "esquerda" | "direita" = "direita";
  let n = 0;
  let k = 0;
  for (const m of plano.momentos) {
    if (m.de > cursor + 0.05) trechos.push({ tipo: "cheio", de: cursor, ate: m.de });
    const ate = m.ate >= plano.duracao - 0.3 && m === plano.momentos[plano.momentos.length - 1] ? plano.duracao + 1 : m.ate;
    if (ehDeChapa(m)) {
      const lado: "esquerda" | "direita" = (m.tipo === "ajuste" ? m.lado : undefined) ?? (ladoAnterior === "esquerda" ? "direita" : "esquerda");
      ladoAnterior = lado;
      n++;
      if (m.tipo === "ajuste") k++;
      trechos.push({ tipo: "chapa", de: m.de, ate, momento: m, lado, numero: n, total: chapas.length, ajuste: k, ajustes: ajustes.length });
    } else if (m.tipo === "pausa") {
      trechos.push({ tipo: "pausa", de: m.de, ate, momento: m });
    } else trechos.push({ tipo: "cheio", de: m.de, ate, momento: m });
    cursor = ate;
  }
  if (cursor < plano.duracao) trechos.push({ tipo: "cheio", de: cursor, ate: plano.duracao + 1 });
  // trechos cheios seguidos viram um só trecho de pessoa (mantém o momento de cada um)
  return trechos;
};

// Quadro cheio: o menor zoom que deixa o rosto na linha do centro sem borda vazia (até 1,25)
export const caixaCheia = (plano: Plano): Caixa => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const fx = plano.rosto.x;
  const zoom = Math.min(1.25, Math.max(1, 0.5 / Math.max(0.01, Math.min(fx, 1 - fx))));
  return { x: 0, y: 0, w: W, h: videoAltura, raio: 0, zoom, ancoraY: (plano.rosto.y * H) / videoAltura };
};

// Enquadramento da pessoa nas chapas do alto. O demo (rosto pequeno no quadro) usa zoom 1,55;
// numa gravação de selfie, com o rosto enorme, o zoom cai até 1 para a cabeça caber inteira.
export const retratoDoPlano = (plano: Plano) => {
  const largura = (plano.rosto as { rastro?: { largura?: number } }).rastro?.largura;
  const base = PESSOA_ESQUERDA.zoom;
  // o rosto ocupa ~38% da largura da chapa (372 px), como no demo
  const auto = largura ? Math.min(base, Math.max(1, (0.38 * PESSOA_ESQUERDA.w) / (largura * PESSOA_ESQUERDA.w))) : base;
  const zoom = Math.min(1.7, Math.max(1, plano.retrato?.zoom ?? auto));
  // rosto grande: o centro desce um pouco, para sobrar testa e cabelo
  const ancoraY = Math.min(0.75, Math.max(0.25, plano.retrato?.ancoraY ?? (zoom < base - 0.2 ? 0.5 : PESSOA_ESQUERDA.ancoraY)));
  return { zoom, ancoraY };
};

export const caixaDoTrecho = (tr: Trecho, plano: Plano): Caixa => {
  const r = retratoDoPlano(plano);
  if (tr.tipo === "chapa") return { ...(tr.lado === "esquerda" ? PESSOA_ESQUERDA : PESSOA_DIREITA), ...r };
  if (tr.tipo === "pausa") return { ...PESSOA_CENTRO, ...r };
  return caixaCheia(plano);
};

export const estadosDaPessoa = (plano: Plano, trechos: Trecho[]): EstadoDaCaixa[] => {
  const cheia = caixaCheia(plano);
  const estados: EstadoDaCaixa[] = [];
  let anterior: Trecho["tipo"] | null = null;
  let ladoAnterior = "";
  for (const tr of trechos) {
    const lado = tr.tipo === "chapa" ? tr.lado : "";
    const muda = anterior === null || tr.tipo !== anterior || lado !== ladoAnterior;
    if (muda) estados.push({ de: anterior === null ? 0 : Math.max(0, tr.de - ANTES), caixa: caixaDoTrecho(tr, plano), dur: anterior === null ? 0.001 : TROCA });
    anterior = tr.tipo;
    ladoAnterior = lado;
  }
  // corte no meio de um trecho em quadro cheio (longe de uma troca) ganha uma troca seca de
  // enquadramento (1 ↔ 1,06) para disfarçar o pulo
  const trocas = estados.map((e) => e.de);
  const emCheio = (c: number) => trechos.some((tr) => tr.tipo === "cheio" && c > tr.de + 0.6 && c < tr.ate - 0.6);
  for (const c of plano.cortesEm ?? []) {
    if (!emCheio(c) || trocas.some((x) => Math.abs(x - c) < 0.8)) continue;
    const antes = [...estados].sort((a, b) => a.de - b.de).filter((e) => e.de <= c).pop();
    const aproximado = (antes?.caixa.zoom ?? cheia.zoom ?? 1) > (cheia.zoom ?? 1) + 0.001;
    estados.push({ de: c, caixa: { ...cheia, zoom: (cheia.zoom ?? 1) * (aproximado ? 1 : 1.06) }, dur: 0.001 });
  }
  return estados.sort((a, b) => a.de - b.de);
};

// 0 = pessoa em quadro cheio, 1 = pessoa na chapa pequena (deriva da largura atual da caixa)
export const presencaDaMoldura = (caixa: Caixa) => Math.min(1, Math.max(0, (W - caixa.w) / (W - PESSOA_ESQUERDA.w)));

// ---------- negatoscópio e chapas ----------

export type Filme = { trecho: Extract<Trecho, { tipo: "chapa" | "pausa" }>; entra: number; sai: number; indice: number };

// O negatoscópio fica aceso durante cada sequência de ajustes/pausa. Cada trecho traz a sua chapa,
// que desliza sobre a anterior; a anterior só sai quando a nova já cobriu o painel.
export const filmesDoPlano = (trechos: Trecho[]): { filmes: Filme[]; acesas: { de: number; ate: number }[] } => {
  const filmes: Filme[] = [];
  const acesas: { de: number; ate: number }[] = [];
  let indice = 0;
  trechos.forEach((tr, i) => {
    if (tr.tipo !== "chapa" && tr.tipo !== "pausa") return;
    const anterior = trechos[i - 1];
    const proximo = trechos[i + 1];
    const comecaSequencia = !anterior || anterior.tipo === "cheio";
    const entra = Math.max(0, tr.de - ANTES);
    const fimSequencia = !proximo || proximo.tipo === "cheio";
    const sai = fimSequencia ? tr.ate + TROCA + 0.05 : proximo.de - ANTES + DESLIZA + 0.05;
    filmes.push({ trecho: tr, entra, sai, indice: indice++ });
    if (comecaSequencia) acesas.push({ de: Math.max(0, tr.de - ANTES), ate: sai });
    else acesas[acesas.length - 1].ate = sai;
  });
  return { filmes, acesas };
};

// Quando uma arte de quadro cheio pode começar: se a pessoa ainda está crescendo de volta, espera
// ela quase cobrir a tela, para a arte não cair em cima do negatoscópio.
export const inicioDaArte = (de: number, trechos: Trecho[]) => {
  const vemDeChapa = trechos.some((tr) => (tr.tipo === "chapa" || tr.tipo === "pausa") && Math.abs(tr.ate - de) < 0.05);
  return vemDeChapa ? de - ANTES + TROCA * 0.7 : de;
};

// ---------- o raio-x de qualquer assunto, de chapa em chapa ----------

// Ajustes de itens encostados (um logo depois do outro) formam um grupo: todas as chapas do grupo
// mostram a mesma coluna com os itens do grupo inteiro (os já ditos acesos, os que ainda vêm a lápis),
// como a postura que vai sendo corrigida de chapa em chapa. O `alinha` de qualquer um vale para todos.
export type GrupoDoRaioX = { itens: ItemDoRaioX[]; alinha?: { em: number; texto?: string }; indice: number; tamanho: number };

export const gruposDoRaioX = (plano: Plano): Map<Ajuste, GrupoDoRaioX> => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  const mapa = new Map<Ajuste, GrupoDoRaioX>();
  let atual: Ajuste[] = [];
  const fecha = () => {
    if (!atual.length) return;
    const itens = atual.flatMap((a) => a.itens ?? []).slice(0, 5);
    const alinha = [...atual].reverse().find((a) => a.alinha)?.alinha;
    atual.forEach((a, i) => mapa.set(a, { itens, alinha, indice: i, tamanho: atual.length }));
    atual = [];
  };
  ordenados.forEach((m: Momento, i) => {
    const ehItens = m.tipo === "ajuste" && !!m.itens?.length;
    const anterior = ordenados[i - 1];
    const encosta = !!anterior && atual.includes(anterior as Ajuste) && m.de - anterior.ate < 0.3;
    if (!ehItens || !encosta) fecha();
    if (ehItens) atual.push(m as Ajuste);
  });
  fecha();
  return mapa;
};
