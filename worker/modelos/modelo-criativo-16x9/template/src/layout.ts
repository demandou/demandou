// A câmera e os lugares do Criativo no quadro deitado (16:9, 1920×1080), com a composição da aula 9
// do curso (editar uma aula horizontal).
//
// Dois lugares para a pessoa:
//  1. QUADRO CHEIO (a base): a pessoa como foi gravada, com a câmera do vertical: troca de escala em
//     corte seco a cada tomada (100% ↔ 107%, cobre o salto dos cortes e a emenda gancho → corpo),
//     aproxima ~1,5% devagar dentro da tomada e dá um soco curto (+4%) nas palavras de impacto. As
//     placas curtas (manchete, frase, destaque, número sem foto, botão sem cartão) entram no PEITO,
//     entre o queixo e a legenda, quando cabem lá (medidas antes, nunca em cima do rosto).
//  2. MOLDURA À DIREITA: quando um bloco pede apoio visual (herói, prova, listas, comparação, gráfico,
//     definição, pergunta, cartão final, ou uma placa que não coube no peito), a pessoa desliza para um
//     cartão de vidro do lado direito, com o rosto centralizado nele e seguido com suavidade
//     (`rosto.rastro`, pela VideoNaCaixa), e o bloco ocupa o QUADRO do lado esquerdo, que é o palco do
//     vertical (~1040 × 760). Momentos seguidos no quadro mantêm a moldura; quando a ideia termina, a
//     pessoa volta ao quadro cheio.
// A legenda fica sempre no mesmo lugar: na área segura de baixo, centralizada no quadro.
import { Easing, interpolate } from "remotion";
import { medirPlaca } from "./componentes/Assinatura";
import { medirDestaque, medirNumero } from "./componentes/Blocos";
import type { Caixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { BASE_CONTEUDO, LEGENDA_Y, MOLDURA, PALCO_BASE, PALCO_W, PALCO_X, PALCO_Y, PEITO_W, QUADRO, RAIO, SEGURO } from "./tema";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const sobe = Easing.bezier(0.16, 1, 0.3, 1);
const desce = Easing.bezier(0.65, 0, 0.35, 1);

export type Ret = { x: number; y: number; w: number; h: number };

export const ordenar = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

// Num plano de variante, o vídeo da pessoa toca em `trechos` (gancho + corpo): o tempo na tela
// vira o tempo no vídeo cortado. Sem trechos, é o mesmo tempo.
export const tempoNoVideo = (plano: Plano, t: number) => {
  if (!plano.trechos?.length) return t;
  let acc = 0;
  for (const tr of plano.trechos) {
    const d = tr.ate - tr.de;
    if (t < acc + d || tr === plano.trechos[plano.trechos.length - 1]) return tr.de + Math.min(t - acc, d);
    acc += d;
  }
  return t;
};
// instantes de emenda entre trechos (na linha do tempo da variante): contam como cortes
export const emendas = (plano: Plano) => {
  const lista: number[] = [];
  let acc = 0;
  (plano.trechos ?? []).forEach((tr, i) => {
    acc += tr.ate - tr.de;
    if (i < (plano.trechos?.length ?? 0) - 1) lista.push(acc);
  });
  return lista;
};

// palavras de impacto: soco curto de câmera
const impactos = (plano: Plano) =>
  (plano.momentos as Momento[])
    .flatMap((m) => {
      if (m.tipo === "numero") return [m.em];
      if (m.tipo === "selo") return [m.em];
      if (m.tipo === "prova" && m.numero) return [m.numero.em];
      if (m.tipo === "destaque") return [m.em];
      if (m.tipo === "cta") return [m.toqueEm ?? m.em ?? m.de];
      return [];
    })
    .sort((a, b) => a - b);

const pulso = (t: number, e: number) => {
  if (t < e) return 0;
  const d = t - e;
  if (d < 0.14) return sobe(d / 0.14);
  if (d < 0.45) return 1;
  return 1 - desce(clamp((d - 0.45) / 0.8, 0, 1));
};

// O momento que ocupa o palco em cada instante: cada um sai quando o próximo entra.
// `selo` não ocupa o palco (é uma camada por cima do cartão da vez).
export const ocupaPalco = (m: Momento) => m.tipo !== "selo";

// --- onde cada momento fica ---
// "quadro": o cartão no quadro da esquerda, a pessoa na moldura da direita.
// "peito": a placa no peito, a pessoa em quadro cheio; `max` = o maior corpo de letra que coube.
export type Lugar = { modo: "quadro" } | { modo: "peito"; ret: Ret; max?: number };

// O botão do cta: pílula de 126 px de altura (o Botao mede a largura, até 900 px).
export const ALTURA_DO_BOTAO = 126;
// Abaixo do cartão final, o botão ganha esta faixa do quadro.
const FAIXA_DO_BOTAO = ALTURA_DO_BOTAO + 34;

// os menores corpos que ainda mantêm a hierarquia do estilo no peito
const DESTAQUE_NO_PEITO = 84;
const NUMERO_NO_PEITO = 100;

// A placa que cabe no peito: do maior corpo do vertical para baixo, até o mínimo legível.
const caberPlaca = (texto: string, ret: Ret, max: number): number | null => {
  for (let s = max; s >= 52; s -= 4) if (medirPlaca(texto, ret.w, s).altura <= ret.h) return s;
  return null;
};

const lugarNoPeito = (m: Momento, peito: Ret): Lugar | null => {
  if (peito.h < 120) return null;
  switch (m.tipo) {
    case "frase": {
      const s = caberPlaca(m.texto, peito, 84);
      return s ? { modo: "peito", ret: peito, max: s } : null;
    }
    case "gancho":
    case "abertura": {
      // com foto ou etiquetas, o gancho pede o quadro (a foto e as pílulas não cabem no peito)
      if (m.imagem || (m.tipo === "gancho" && m.etiquetas?.length)) return null;
      const s = caberPlaca(m.texto, peito, 88);
      return s ? { modo: "peito", ret: peito, max: s } : null;
    }
    case "destaque": {
      // O adesivo é GRANDE: no peito, só com 84 px ou mais (senão vai para o quadro, até 120 px).
      // + 24 px: ele é inclinado 2° (as pontas descem e sobem um pouco).
      for (let s = 120; s >= DESTAQUE_NO_PEITO; s -= 6) if (medirDestaque(m, peito.w, s).total + 24 <= peito.h) return { modo: "peito", ret: peito, max: s };
      return null;
    }
    case "numero": {
      // o número é ENORME: no peito, só se couber com 100 px ou mais (no quadro ele chega a 210)
      if (m.imagem) return null;
      return medirNumero(m, peito).maxN >= NUMERO_NO_PEITO ? { modo: "peito", ret: peito } : null;
    }
    case "cta":
      // sem produto e sem título, o cta é só o botão: ele fica no peito, logo acima da legenda
      return !m.imagem && !m.titulo && peito.h >= ALTURA_DO_BOTAO + 16 ? { modo: "peito", ret: peito } : null;
    default:
      return null;
  }
};

export type Layout = {
  caixa: (t: number) => Caixa;
  // 0 = quadro cheio, 1 = a pessoa na moldura da direita
  naMoldura: (t: number) => number;
  yLegenda: number;
  // o quadro da esquerda (o palco do vertical) e o mesmo quadro com a faixa do botão embaixo
  palco: Ret;
  palcoCta: Ret;
  // a faixa do peito no quadro cheio (entre o queixo e a legenda)
  peito: Ret;
  moldura: Ret;
  lugar: (m: Momento) => Lugar;
  // centro do botão do cta (no quadro ou no peito)
  botao: (m: Momento) => { x: number; y: number };
  // onde o selo cola: no canto do cartão da vez (quadro) ou no canto de cima oposto ao rosto (quadro cheio)
  selo: (t: number, comBotao: boolean) => { x: number; y: number };
  // janelas de quadro cheio (para a tarja de nome não cair em cima de um cartão)
  janelasCheias: [number, number][];
  queixo: number;
  rostoX: number;
};

const ZOOM_MAX = 1.12;
// Na moldura, o rosto ocupa ~40% da largura dela (a câmera de perto da aula: rosto centralizado,
// ombros visíveis). O rosto fica a 40% da altura da moldura.
const ROSTO_NA_MOLDURA = 0.4;
const ANCORA_MOLDURA = 0.4;
// a moldura de vidro em volta do vídeo (a mesma borda da foto no cartão)
export const BORDA_DA_MOLDURA = 14;
// a pessoa vai para a moldura um pouco antes do cartão entrar e volta logo depois que ele sai
const ABRE_ANTES = 0.3;
const TROCA = 0.45;
// momentos no quadro com menos que isto entre eles mantêm a moldura (nada de vaivém)
const JUNTA_SE_MENOR = 0.8;
// uma placa no peito colada num cartão do quadro precisa de pelo menos isto (senão vai para o quadro)
const MINIMO_NO_PEITO = 1.5;

export const prepararLayout = (plano: Plano): Layout => {
  const rostoX = plano.rosto.x;
  const rostoY = plano.rosto.y;
  const larguraRosto = (plano.rosto as { rastro?: { largura?: number } }).rastro?.largura;
  // no 16:9 o rosto ocupa ~13% da largura do quadro (~250 px)
  const largura = (larguraRosto && larguraRosto > 0.03 ? larguraRosto : 0.13) * QUADRO.w;
  const vh = plano.videoAltura ?? QUADRO.h;
  const escala = Math.max(1, QUADRO.h / vh);
  const yRosto = rostoY * QUADRO.h;
  // o queixo: o cortar.mjs do 16:9 grava a `zona` ~60 px abaixo dele; sem zona, ~0,66 largura de
  // rosto abaixo do centro. Já com a maior aproximação (o zoom cresce em volta do rosto).
  const queixoGravado = plano.zona ? plano.zona.topo - 60 : yRosto + 0.66 * largura * escala;
  const queixo = yRosto + Math.max(0.5 * largura, queixoGravado - yRosto) * ZOOM_MAX * 1.04;
  const yLegenda = LEGENDA_Y;
  const palco: Ret = { x: PALCO_X, y: PALCO_Y, w: PALCO_W, h: PALCO_BASE - PALCO_Y };
  const palcoCta: Ret = { ...palco, h: palco.h - FAIXA_DO_BOTAO };
  // o cartão da moldura (por fora) e o vídeo dentro dele, 14 px para dentro (a borda de vidro)
  const moldura: Ret = { ...MOLDURA };
  const video: Ret = { x: moldura.x + BORDA_DA_MOLDURA, y: moldura.y + BORDA_DA_MOLDURA, w: moldura.w - 2 * BORDA_DA_MOLDURA, h: moldura.h - 2 * BORDA_DA_MOLDURA };
  // o peito: centrado no rosto, abaixo do queixo, até a base do conteúdo (acima da legenda)
  const topoPeito = Math.round(queixo + 28);
  const wPeito = Math.min(PEITO_W, QUADRO.w - 2 * SEGURO.margem);
  const xPeito = Math.round(clamp(rostoX * QUADRO.w - wPeito / 2, SEGURO.margem, QUADRO.w - SEGURO.margem - wPeito));
  const peito: Ret = { x: xPeito, y: topoPeito, w: wPeito, h: Math.max(0, BASE_CONTEUDO - topoPeito) };

  const noPalco = ordenar(plano).filter(ocupaPalco);
  const fimDe = (i: number) => {
    const m = noPalco[i];
    const prox = noPalco[i + 1];
    if (!prox) return m.tipo === "cta" || m.ate >= plano.duracao - 0.5 ? plano.duracao + 1 : m.ate;
    return Math.min(m.ate, prox.de);
  };
  // Onde cada momento do palco fica. Uma placa do peito espremida entre dois cartões do quadro, ou
  // colada num deles e curta demais para a pessoa ir e voltar, vai para o quadro também: a moldura
  // não fica abrindo e fechando.
  const lugares = new Map<Momento, Lugar>();
  noPalco.forEach((m) => lugares.set(m, lugarNoPeito(m, peito) ?? { modo: "quadro" }));
  noPalco.forEach((m, i) => {
    if (lugares.get(m)?.modo !== "peito") return;
    const ant = noPalco[i - 1];
    const prox = noPalco[i + 1];
    const quadroAntes = !!ant && lugares.get(ant)?.modo === "quadro" && m.de - fimDe(i - 1) < JUNTA_SE_MENOR;
    const quadroDepois = !!prox && lugares.get(prox)?.modo === "quadro" && prox.de - fimDe(i) < JUNTA_SE_MENOR;
    const curto = fimDe(i) - m.de < MINIMO_NO_PEITO;
    if ((quadroAntes && quadroDepois) || ((quadroAntes || quadroDepois) && curto)) lugares.set(m, { modo: "quadro" });
  });
  const lugar = (m: Momento): Lugar => lugares.get(m) ?? lugarNoPeito(m, peito) ?? { modo: "quadro" };

  // os trechos com a pessoa na moldura: os momentos do quadro, até o próximo momento do palco
  const trechos: [number, number][] = [];
  noPalco.forEach((m, i) => {
    if (lugar(m).modo !== "quadro") return;
    const de = m.de;
    const ate = fimDe(i);
    const u = trechos[trechos.length - 1];
    if (u && de - u[1] < JUNTA_SE_MENOR) u[1] = Math.max(u[1], ate);
    else trechos.push([de, ate]);
  });
  const naMoldura = (t: number) => {
    let p = 0;
    for (const [a, b] of trechos) {
      // o 1º momento do vídeo já está montado no quadro 0 (nada de pessoa deslizando no começo)
      const entra = a <= 0.05 ? 1 : interpolate(t, [a - ABRE_ANTES, a - ABRE_ANTES + TROCA], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: desce });
      const sai = interpolate(t, [b, b + TROCA], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: desce });
      p = Math.max(p, entra * (1 - sai));
    }
    return p;
  };
  // as janelas de quadro cheio (entre os trechos na moldura, com a troca de cada lado)
  const janelasCheias: [number, number][] = [];
  let livre = 0;
  for (const [a, b] of trechos) {
    if (a <= 0.05) {
      livre = b + TROCA;
      continue;
    }
    if (a - ABRE_ANTES - livre > 0) janelasCheias.push([livre, a - ABRE_ANTES]);
    livre = b + TROCA;
  }
  if (livre < plano.duracao) janelasCheias.push([livre, plano.duracao]);

  // a pessoa na moldura: o rosto em ~40% da largura dela (o zoom que dá isso, entre 1 e 1,6)
  const escalaMoldura = (ROSTO_NA_MOLDURA * video.w) / largura;
  const zoomMoldura = clamp(escalaMoldura / Math.max(video.w / QUADRO.w, video.h / vh), 1, 1.6);

  const tomadas = [0, ...(plano.cortesEm ?? []), ...emendas(plano)].sort((a, b) => a - b).filter((c, i, l) => i === 0 || c - l[i - 1] > 0.3);
  const socos = impactos(plano);
  const caixa = (t: number): Caixa => {
    const k = tomadas.filter((c) => c <= t + 1e-4).length - 1;
    const inicio = tomadas[Math.max(0, k)] ?? 0;
    let z = k % 2 === 1 ? 1.07 : 1.0;
    // aproxima devagar dentro da tomada (1,5% a cada 3 s, no máximo 3%)
    z += Math.min(0.03, ((t - inicio) / 3) * 0.015);
    for (const e of socos) z += 0.04 * pulso(t, e);
    z = Math.min(ZOOM_MAX, z);
    // quadro cheio: o zoom cresce em volta do rosto (ele fica onde foi gravado)
    const cheio: Caixa = { x: 0, y: 0, w: QUADRO.w, h: QUADRO.h, raio: 0, zoom: z, ancoraX: rostoX, ancoraY: rostoY };
    const p = naMoldura(t);
    if (p <= 0) return cheio;
    const mix = (a: number, b: number) => a + (b - a) * p;
    return {
      x: mix(0, video.x),
      y: mix(0, video.y),
      w: mix(QUADRO.w, video.w),
      h: mix(QUADRO.h, video.h),
      // o canto do vídeo dentro da borda de vidro (por fora, o raio dos cartões)
      raio: mix(0, RAIO - BORDA_DA_MOLDURA),
      // a mesma dinâmica de câmera (tomadas e socos) também na moldura
      zoom: mix(z, zoomMoldura * z),
      ancoraX: mix(rostoX, 0.5),
      ancoraY: mix(rostoY, ANCORA_MOLDURA),
    };
  };

  const botao = (m: Momento) => {
    const l = lugar(m);
    if (l.modo === "peito") return { x: l.ret.x + l.ret.w / 2, y: l.ret.y + l.ret.h - ALTURA_DO_BOTAO / 2 - 8 };
    // no quadro: embaixo do cartão final; sem cartão (nem produto nem título), no meio do quadro
    const semCartao = m.tipo === "cta" && !m.imagem && !m.titulo;
    return { x: palco.x + palco.w / 2, y: semCartao ? palco.y + palco.h / 2 : palco.y + palco.h - ALTURA_DO_BOTAO / 2 };
  };

  // o selo: d = 276 px; no quadro, no canto de cima à direita do cartão; no quadro cheio, no canto de
  // cima do lado oposto ao rosto
  const RAIO_SELO = 138;
  const selo = (t: number, comBotao: boolean) => {
    if (naMoldura(t) > 0.5) {
      const r = comBotao ? palcoCta : palco;
      return { x: r.x + r.w - 150, y: r.y + 150 };
    }
    const y = SEGURO.topo + RAIO_SELO + 16;
    return rostoX <= 0.5 ? { x: QUADRO.w - SEGURO.margem - RAIO_SELO - 16, y } : { x: SEGURO.margem + RAIO_SELO + 16, y };
  };

  return { caixa, naMoldura, yLegenda, palco, palcoCta, peito, moldura, lugar, botao, selo, janelasCheias, queixo, rostoX: rostoX * QUADRO.w };
};
