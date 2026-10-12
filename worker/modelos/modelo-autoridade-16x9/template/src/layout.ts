// A gramática do Autoridade no quadro deitado (16:9, 1920×1080), a versão do vídeo completo do
// YouTube: onde a pessoa está em cada momento e onde cada bloco entra. Tudo sai dos momentos do plano.
//
// A regra é a da aula 9 do curso (editar uma aula horizontal):
// - TELA CHEIA é a base: a pessoa como foi gravada e, como no vertical, um destaque por vez na
//   altura do peito, abaixo do queixo (abertura, número, destaque, frase, pergunta sem opções,
//   fechamento). No quadro deitado a faixa do peito é larga e baixa: os blocos se arrumam em
//   fileira (ícone ao lado do texto, assinatura ao lado da chamada) em vez de uma pilha alta;
// - quando o bloco pede apoio visual (o cartão-documento, a definição, o gráfico, tópicos, passos,
//   comparação, pergunta com opções), a pessoa vai para a MOLDURA do lado direito, com o rosto
//   centralizado e acompanhado suavemente (o rastro do cortar.mjs), e o bloco ocupa o QUADRO do
//   lado esquerdo, sobre o fundo tinta;
// - terminada a ideia, a pessoa volta à tela cheia.
//
//   tela cheia:  [          a pessoa           ]     moldura:  [ o bloco (quadro) |  PESSOA  ]
//                [  destaque na altura do peito ]               [                  | (rosto)  ]
import type { Caixa, EstadoDaCaixa, Rosto } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { BASE, BASE_COM_LEGENDA, LARGURA_PEITO, MARGEM, MOLDURA, PEITO_MINIMO, QUADRO, QUADRO_ESQUERDO, TOPO, zona as zonaPadrao } from "./tema";

export type Regiao = { x: number; y: number; w: number; h: number };
export type Arranjo = "peito" | "quadro";

// A troca de lugar da pessoa: a ida começa um pouco antes do bloco (o vídeo encolhe para a direita
// e revela o quadro, então o bloco nunca passa por cima do rosto); a volta começa um instante antes
// do fim, quando o bloco já está apagando.
export const TROCA = 0.5;
export const ANTES = 0.3;
export const DEPOIS = 0.1;
// dois blocos de quadro com menos que isto entre eles: a pessoa fica na moldura (sem vaivém)
const JUNTA = 1.2;
// bloco de peito mais curto que isto entre dois de quadro vai para o quadro também
const CURTO_ENTRE_QUADROS = 1.6;

// os blocos que pedem apoio visual (vão para o quadro da esquerda)
const TIPOS_DO_QUADRO = ["citacao", "definicao", "grafico", "topicos", "passos", "comparacao", "lista", "contraste"];

export const alturaDoVideo = (plano: Plano) => Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);

// A largura do rosto (fração da largura do quadro): o rastreio mede; sem ele, o padrão do 16:9
// (o rosto gravado ocupa ~13% da largura).
export const larguraDoRosto = (plano: Plano) => {
  const r = (plano.rosto as Rosto).rastro;
  return r?.largura && r.largura > 0.03 ? r.largura : 0.13;
};

// ---------- a tela cheia: a faixa do peito ----------

// A faixa do peito: logo abaixo do queixo até a base (acima da legenda, quando ela aparece), centrada
// no rosto. Gravação com o queixo baixo (sobra menos de PEITO_MINIMO): o lado livre da pessoa, sem
// cobrir os ombros. Sem lugar nenhum: null (o bloco vai para o quadro, e a pessoa para a moldura).
export type Peito = Regiao & { lado: "baixo" | "esquerda" | "direita" };
export const lugarDoPeito = (plano: Plano, comLegenda = false): Peito | null => {
  const base = comLegenda ? BASE_COM_LEGENDA : BASE;
  const W = QUADRO.w;
  const ry = plano.rosto.y * QUADRO.h;
  const rw = larguraDoRosto(plano) * W;
  const queixo = ry + 0.66 * rw;
  const topo = Math.round(Math.max(plano.zona?.topo ?? zonaPadrao.topo, queixo + 40));
  if (base - topo >= PEITO_MINIMO) {
    const w = Math.min(LARGURA_PEITO, W - 2 * MARGEM);
    const cx = Math.min(W - MARGEM - w / 2, Math.max(MARGEM + w / 2, plano.rosto.x * W));
    return { x: Math.round(cx - w / 2), y: topo, w, h: base - topo, lado: "baixo" };
  }
  const meio = 1.5 * rw + 40;
  const rx = plano.rosto.x * W;
  const esquerda = rx - meio - MARGEM;
  const direita = W - MARGEM - (rx + meio);
  const largura = Math.min(860, Math.max(esquerda, direita));
  if (largura < 560) return null;
  return esquerda >= direita
    ? { x: MARGEM, y: TOPO, w: largura, h: base - TOPO, lado: "esquerda" }
    : { x: W - MARGEM - largura, y: TOPO, w: largura, h: base - TOPO, lado: "direita" };
};

// O arranjo de cada momento: os blocos de apoio visual vão para o quadro; os de tela cheia ficam no
// peito, a não ser que a gravação não deixe lugar (nada cobre a pessoa) ou que sejam um respiro curto
// entre dois blocos de quadro (a pessoa não vai e volta da moldura em menos de 1,6 s).
export const arranjos = (plano: Plano): Map<Momento, Arranjo> => {
  const ms = [...plano.momentos].sort((a, b) => a.de - b.de);
  const mapa = new Map<Momento, Arranjo>();
  for (const m of ms) {
    const doQuadro =
      TIPOS_DO_QUADRO.includes(m.tipo) || (m.tipo === "pergunta" && (m.opcoes?.length ?? 0) >= 2) || lugarDoPeito(plano, !!m.legenda) === null;
    mapa.set(m, doQuadro ? "quadro" : "peito");
  }
  ms.forEach((m, i) => {
    if (mapa.get(m) !== "peito") return;
    const a = ms[i - 1];
    const b = ms[i + 1];
    if (a && b && mapa.get(a) === "quadro" && mapa.get(b) === "quadro" && b.de - a.ate < CURTO_ENTRE_QUADROS) mapa.set(m, "quadro");
  });
  return mapa;
};

// Onde o bloco é desenhado
export const regiaoDo = (m: Momento, plano: Plano, mapa: Map<Momento, Arranjo>): Regiao & { lado?: Peito["lado"] } => {
  if (mapa.get(m) === "quadro") return { ...QUADRO_ESQUERDO };
  return lugarDoPeito(plano, !!m.legenda) ?? { ...QUADRO_ESQUERDO };
};

// ---------- a pessoa ----------

// Tela cheia: a pessoa como foi gravada; o zoom (troca seca) parte do rosto, que não sai do lugar.
export const caixaCheia = (plano: Plano, zoom = 1): Caixa => ({
  x: 0,
  y: 0,
  w: QUADRO.w,
  h: QUADRO.h,
  raio: 0,
  zoom,
  ancoraX: plano.rosto.x,
  ancoraY: Math.min(1, (plano.rosto.y * QUADRO.h) / alturaDoVideo(plano)),
});

// A MOLDURA da direita: o rosto ocupa ~36% da largura dela (gravação de longe aproxima até 1,8×;
// de perto, nada), centralizado na horizontal, com a cabeça inteira e respiro em cima. O motor
// segue o rosto dentro dela (reenquadra devagar quando a pessoa muda de lugar, sem saltos).
export const caixaDaMoldura = (plano: Plano, extra = 1): Caixa => {
  const { x, y, w, h } = MOLDURA;
  const cobre = Math.max(w / QUADRO.w, h / alturaDoVideo(plano));
  const rostoPx = larguraDoRosto(plano) * QUADRO.w * cobre;
  const zoom = Math.min(1.8, Math.max(1, (0.36 * w) / Math.max(1, rostoPx)));
  const naTela = rostoPx * zoom;
  const ancoraY = Math.min(0.45, Math.max(0.34, (40 + 0.85 * naTela) / h));
  return { x, y, w, h, raio: 0, zoom: zoom * extra, ancoraX: 0.5, ancoraY };
};

// Os trechos em que a pessoa fica na moldura: blocos de quadro seguidos (sem bloco de peito entre
// eles e com menos de JUNTA s de intervalo) viram um trecho só.
export const trechosDaMoldura = (plano: Plano, mapa: Map<Momento, Arranjo>) => {
  const ms = [...plano.momentos].sort((a, b) => a.de - b.de);
  const trechos: { de: number; ate: number }[] = [];
  let anteriorNoQuadro = false;
  for (const m of ms) {
    const q = mapa.get(m) === "quadro";
    if (q) {
      const u = trechos[trechos.length - 1];
      if (u && anteriorNoQuadro && m.de - u.ate < JUNTA) u.ate = Math.max(u.ate, m.ate);
      else trechos.push({ de: m.de, ate: m.ate });
    }
    anteriorNoQuadro = q;
  }
  return trechos;
};

// Zoom da tela cheia: troca seca (1 ↔ 1,05) em cada corte (disfarça o pulo) e na entrada dos
// momentos (dá ritmo), como no vertical. `enquadramentos` do plano substitui o automático.
export const zoomsDaTelaCheia = (plano: Plano) => {
  if (plano.enquadramentos?.length) return [...plano.enquadramentos].sort((a, b) => a.de - b.de);
  const pontos = [
    ...(plano.cortesEm ?? []).map((t) => ({ t, corte: true })),
    ...plano.momentos.map((m) => ({ t: Math.max(0, m.de), corte: false })),
  ].sort((a, b) => a.t - b.t);
  const trechos = [{ de: 0, zoom: 1 }];
  for (const p of pontos) {
    const ultimo = trechos[trechos.length - 1];
    if (p.t - ultimo.de < (p.corte ? 1.2 : 2.5)) continue;
    trechos.push({ de: p.t, zoom: ultimo.zoom === 1 ? 1.05 : 1 });
  }
  return trechos;
};
const zoomEm = (lista: { de: number; zoom: number }[], t: number) => {
  let z = lista[0]?.zoom ?? 1;
  for (const e of lista) if (e.de <= t + 1e-6) z = e.zoom;
  return z;
};

// Estados da caixa da pessoa ao longo do vídeo (o motor interpola as trocas): tela cheia com as
// trocas secas de zoom; a ida e a volta da moldura; dentro da moldura, corte vira uma troca seca de
// enquadramento (1 ↔ 1,06).
export const estadosDaPessoa = (plano: Plano, mapa: Map<Momento, Arranjo>): EstadoDaCaixa[] => {
  const zooms = zoomsDaTelaCheia(plano);
  const trechos = trechosDaMoldura(plano, mapa);
  const cortes = plano.cortesEm ?? [];
  const janelas: [number, number][] = [];
  const estados: EstadoDaCaixa[] = [];
  const comecaNaMoldura = !!trechos[0] && trechos[0].de - ANTES <= 0.05;
  estados.push({ de: 0, caixa: comecaNaMoldura ? caixaDaMoldura(plano) : caixaCheia(plano, zoomEm(zooms, 0)), dur: 0.001 });
  for (const tr of trechos) {
    const entra = Math.max(0, tr.de - ANTES);
    const fica = tr.ate >= plano.duracao - 0.3;
    const sai = fica ? plano.duracao + 1 : Math.max(entra + TROCA, tr.ate - DEPOIS);
    janelas.push([entra, sai + TROCA]);
    if (entra > 0.05) estados.push({ de: entra, caixa: caixaDaMoldura(plano), dur: TROCA });
    let ultimo = entra + TROCA;
    let perto = false;
    for (const c of cortes) {
      if (c < ultimo + 1.2 || c > sai - 0.8) continue;
      perto = !perto;
      estados.push({ de: c, caixa: caixaDaMoldura(plano, perto ? 1.06 : 1), dur: 0.001 });
      ultimo = c;
    }
    if (!fica) estados.push({ de: sai, caixa: caixaCheia(plano, zoomEm(zooms, sai)), dur: TROCA });
  }
  for (const z of zooms) {
    if (z.de <= 0.05) continue;
    if (janelas.some(([a, b]) => z.de >= a - 0.05 && z.de <= b)) continue;
    estados.push({ de: z.de, caixa: caixaCheia(plano, z.zoom), dur: 0.001 });
  }
  return estados.sort((a, b) => a.de - b.de);
};
