// A gramática do Funil no quadro deitado (16:9, 1920×1080), em tempo: quando a pessoa ocupa a
// tela e quando vai para a moldura ao lado da página (o funil ou os outros gráficos). Tudo sai dos
// momentos do plano.
//
// A regra é a da aula 9 do curso (editar uma aula horizontal):
// - Tela cheia é a base: a pessoa ocupa o quadro como foi gravada, com a aproximação lenta e o
//   salto seco nos cortes do vertical. Os cartões entram na altura do peito (Cartoes.tsx).
// - Nos momentos de página, a pessoa vai para uma MOLDURA do lado DIREITO (retrato, cabeça e
//   ombros), com o rosto centralizado nela e acompanhado de leve pelo rastro do cortar.mjs; a
//   página ocupa o QUADRO do lado esquerdo. No vertical o bloco descia junto com o fluxo; no quadro
//   deitado a moldura fica parada (a altura é curta) e o funil inteiro cabe ao lado dela.
//
//   [ PÁGINA: x 96–1208, y 72–868 (px do quadro)      | MOLDURA: x 1264–1824, y 96–856 ]
//   [ legenda: y 892, centrada, na área segura de baixo                                ]
import { type Caixa, CHEIO_16x9, type EstadoDaCaixa, type Rosto } from "./motor/caixa";
import { naPagina, type Plano } from "./plano";
import { H, MOLDURA, W } from "./tema";

export const TROCA = 0.55; // quadro cheio ⇄ moldura

// O rosto na moldura: a fração da largura da moldura que o rosto ocupa (o vídeo aproxima até
// chegar nela, sem nunca deixar borda). O rosto gravado em 16:9 tem ~13% da largura do quadro.
const ROSTO_NA_MOLDURA = 0.42;
const ROSTO_PADRAO_16x9 = 0.13;
// teto da aproximação (acima disso a imagem perde nitidez)
const ZOOM_MAX = 2.2;
// o `retrato.zoom` do plano é o do vertical (2 a 2,6; padrão 2,15): aqui ele vale como um ajuste
// proporcional sobre o enquadramento automático (2,15 = automático; 2,4 = 12% mais perto)
const ZOOM_VERTICAL_PADRAO = 2.15;

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

const alturaDoVideo = (plano: Plano) => Math.min(H, plano.videoAltura ?? H);

// Quadro cheio: a pessoa como foi gravada; a aproximação (lenta e nos cortes) parte do rosto
export const caixaCheia = (plano: Plano): Caixa => {
  const videoAltura = alturaDoVideo(plano);
  return {
    ...CHEIO_16x9,
    h: videoAltura,
    zoom: 1,
    ancoraX: plano.rosto.x,
    ancoraY: (plano.rosto.y * H) / videoAltura,
  };
};

const larguraDoRosto = (plano: Plano) => {
  const l = (plano.rosto as Rosto).rastro?.largura;
  return l && l > 0.03 ? l : ROSTO_PADRAO_16x9;
};

// A moldura da pessoa, com o zoom que deixa o rosto com ROSTO_NA_MOLDURA da largura dela.
// Gravação muito perto da câmera aproxima menos sozinha (o zoom nunca fica abaixo de 1).
export const caixaDaMoldura = (plano: Plano, zoomExtra = 1): Caixa => {
  const base = Math.max(MOLDURA.w / W, MOLDURA.h / alturaDoVideo(plano));
  const rostoPx = larguraDoRosto(plano) * W * base;
  const automatico = Math.min(ZOOM_MAX, Math.max(1, (ROSTO_NA_MOLDURA * MOLDURA.w) / rostoPx));
  const ajuste = (plano.retrato?.zoom ?? ZOOM_VERTICAL_PADRAO) / ZOOM_VERTICAL_PADRAO;
  return {
    x: MOLDURA.x,
    y: MOLDURA.y,
    w: MOLDURA.w,
    h: MOLDURA.h,
    raio: MOLDURA.raio,
    zoom: Math.min(ZOOM_MAX * 1.2, Math.max(1, automatico * ajuste)) * zoomExtra,
    ancoraX: 0.5,
    ancoraY: plano.retrato?.ancoraY ?? 0.42,
  };
};

// Trechos em que a página está aberta: momentos de página seguidos viram um trecho só (a pessoa
// continua na moldura).
export const trechosDaPagina = (plano: Plano) => {
  const trechos: { de: number; ate: number; momentos: Plano["momentos"] }[] = [];
  for (const m of plano.momentos) {
    if (!naPagina(m)) continue;
    const ultimo = trechos[trechos.length - 1];
    if (ultimo && m.de - ultimo.ate < 0.4) {
      ultimo.ate = m.ate;
      ultimo.momentos.push(m);
    } else trechos.push({ de: m.de, ate: m.ate, momentos: [m] });
  }
  return trechos;
};
// nome antigo
export const trechosDoFunil = trechosDaPagina;

// Estados da caixa da pessoa ao longo do vídeo: quadro cheio ⇄ moldura. Na moldura, cada corte
// troca seco o enquadramento (×1 ↔ ×1,06): o salto disfarça o pulo do corte (no vertical era o
// bloco que se movia no corte).
export const estadosDaPessoa = (plano: Plano): EstadoDaCaixa[] => {
  const cheia = caixaCheia(plano);
  const estados: EstadoDaCaixa[] = [{ de: -10, caixa: cheia, dur: 0.001 }];
  const cortes = plano.cortesEm ?? [];
  for (const trecho of trechosDaPagina(plano)) {
    // a pessoa encolhe um instante antes do momento (um corte na fronteira cai no meio do movimento)
    const entra = trecho.de - 0.12;
    estados.push({ de: entra, caixa: caixaDaMoldura(plano), dur: TROCA });
    let zoom = 1;
    let ultimo = entra + TROCA;
    for (const c of cortes) {
      if (c <= ultimo + 0.05 || c >= trecho.ate - 0.4 || c - ultimo < 0.8) continue;
      zoom = zoom === 1 ? 1.06 : 1;
      estados.push({ de: c, caixa: caixaDaMoldura(plano, zoom), dur: 0.001 });
      ultimo = c;
    }
    // volta ao quadro cheio no fim do trecho (a não ser que o vídeo acabe nele)
    if (trecho.ate < plano.duracao - 0.3) estados.push({ de: Math.max(ultimo, trecho.ate - 0.15), caixa: cheia, dur: TROCA });
  }
  return estados.sort((a, b) => a.de - b.de);
};

// 0 = quadro cheio, 1 = moldura (pela largura da caixa), para dosar o contorno e a etiqueta
export const noBloco = (caixa: Caixa) => Math.min(1, Math.max(0, (W - caixa.w) / (W - MOLDURA.w)));

// Movimento lento no quadro cheio: aproxima devagar (até 4%) em cada trecho de quadro cheio;
// em cada corte dentro de um trecho cheio, um salto seco de 6% disfarça o pulo.
export const zoomDoQuadroCheio = (t: number, plano: Plano) => {
  const trechos = trechosDoFunil(plano);
  const fronteiras = [0, ...trechos.flatMap((x) => [x.de, x.ate]), plano.duracao].sort((a, b) => a - b);
  let inicio = 0;
  let fim = plano.duracao;
  for (let i = 0; i < fronteiras.length - 1; i++) {
    if (t >= fronteiras[i] && t <= fronteiras[i + 1]) {
      inicio = fronteiras[i];
      fim = fronteiras[i + 1];
    }
  }
  const p = Math.min(1, Math.max(0, (t - inicio) / Math.max(0.5, fim - inicio)));
  const dentroDoFunil = trechos.some((x) => t >= x.de && t <= x.ate);
  const cortes = (plano.cortesEm ?? []).filter((c) => c <= t && c > inicio + 0.3 && !dentroDoFunil).length;
  return (1 + 0.04 * p * p * (3 - 2 * p)) * (cortes % 2 === 1 ? 1.06 : 1);
};
