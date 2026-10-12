// A moldura do quadro deitado (16:9), pela aula 9 do curso (editar uma aula horizontal):
// a pessoa em tela cheia é a base; quando um bloco pede apoio visual (listas, comparação, gráfico,
// definição, pergunta), ela desliza para a MOLDURA da direita, com o rosto centralizado nela e
// acompanhado (rosto.rastro), e o painel do bloco ocupa o QUADRO da esquerda. Quando o bloco
// termina, ela volta para a tela cheia. A mesa de corte (camera.ts) continua trocando de câmera
// dentro da moldura: o corte segue escondendo o pulo.
import { Easing, interpolate } from "remotion";
import { zoomNoTempo } from "./camera";
import type { Caixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { ancoraDo, caixaCheia, MOLDURA, QUADRO } from "./tema";

// os blocos que levam a pessoa para a moldura (os outros ficam no terço de baixo, por cima dela)
export const TIPOS_NA_MOLDURA = ["topicos", "passos", "comparacao", "grafico", "definicao", "pergunta"] as const;
export const pessoaNaMoldura = (m: Momento) => (TIPOS_NA_MOLDURA as readonly string[]).includes(m.tipo);

const suave = Easing.bezier(0.65, 0, 0.35, 1);
// a pessoa leva 0,38 s para ir até a moldura e 0,34 s para voltar
export const ENTRADA_NA_MOLDURA = 0.38;
const SAIDA_DA_MOLDURA = 0.34;

// trechos com a pessoa na moldura (blocos seguidos com menos de 0,4 s entre eles viram um trecho só)
const guardados = new WeakMap<object, [number, number][]>();
export const trechosNaMoldura = (plano: Plano) => {
  const salvo = guardados.get(plano);
  if (salvo) return salvo;
  const lista: [number, number][] = [];
  for (const m of [...plano.momentos].filter(pessoaNaMoldura).sort((a, b) => a.de - b.de)) {
    const u = lista[lista.length - 1];
    if (u && m.de - u[1] < 0.4) u[1] = Math.max(u[1], m.ate);
    else lista.push([m.de, m.ate]);
  }
  guardados.set(plano, lista);
  return lista;
};

// 0 = tela cheia, 1 = pessoa na moldura da direita
export const naMoldura = (plano: Plano, t: number) => {
  let p = 0;
  for (const [a, b] of trechosNaMoldura(plano)) {
    const entra = interpolate(t, [a, a + ENTRADA_NA_MOLDURA], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
    const sai = interpolate(t, [b - 0.02, b + SAIDA_DA_MOLDURA], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
    p = Math.max(p, entra * (1 - sai));
  }
  return p;
};

// a caixa do vídeo: da tela cheia (rosto onde foi gravado) até a moldura (rosto no meio dela)
export const caixaDaPessoa = (plano: Plano, t: number): Caixa => {
  const zoom = zoomNoTempo(plano, t);
  const cheio = caixaCheia(plano, zoom);
  const p = naMoldura(plano, t);
  if (p <= 0) return cheio;
  const mix = (a: number, b: number) => a + (b - a) * p;
  return {
    x: mix(0, MOLDURA.x),
    y: 0,
    w: mix(QUADRO.w, MOLDURA.w),
    h: QUADRO.h,
    raio: 0,
    zoom,
    ancoraX: mix(plano.rosto.x, 0.5),
    ancoraY: ancoraDo(plano),
  };
};

// a legenda: centrada no quadro na tela cheia; com a pessoa na moldura, centrada nela
export const LEGENDA_CHEIO = 1200;
const LEGENDA_MOLDURA = MOLDURA.w - 80;
export const lugarDaLegenda = (plano: Plano, t: number) => {
  const p = naMoldura(plano, t);
  return { cx: QUADRO.w / 2 + (MOLDURA.x + MOLDURA.w / 2 - QUADRO.w / 2) * p, largura: LEGENDA_CHEIO + (LEGENDA_MOLDURA - LEGENDA_CHEIO) * p };
};
