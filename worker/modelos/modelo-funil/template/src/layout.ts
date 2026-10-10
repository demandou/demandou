// A gramática do Funil, em tempo: quando a pessoa ocupa a tela e quando vira o bloco ao lado da
// página (o funil ou os outros gráficos), e para onde o bloco vai (ele acompanha o item da vez:
// desce junto com o fluxo). Tudo sai dos momentos do plano.
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import { FUNIL, type Historia, larguraNaAltura } from "./funil";
import { caixaDaPagina, focosDaPagina } from "./pagina";
import { ehTelaDoFunil, type Momento, naPagina, type Plano } from "./plano";
import { H, LIMITE_APP, W } from "./tema";

// o bloco da pessoa na tela do funil: à direita do funil, retrato (cabeça e ombros), com pelo
// menos 36% da largura do quadro. Ele desce junto com o fluxo e acompanha a inclinação do funil:
// fica ao lado das etapas onde o funil já afinou. Embaixo, mantém 120 px de folga da borda
// direita (os botões do Reels/TikTok ficam ali).
export const BLOCO = { w: 390, min: 390, max: 440, proporcao: 1.24, margem: 36, margemBaixo: 120, raio: 24, zoom: 2.15, ancoraY: 0.42 };
const TOPO_MIN = 130;
const FOLGA = 46; // entre a parede do funil e o bloco (cabe o traço do caminho)
// a partir desta altura (base do bloco), a borda direita respeita os botões do app
const ZONA_DOS_BOTOES = 1250;

export const TROCA = 0.55; // quadro cheio ⇄ bloco
const MOVE = 0.5; // o bloco descendo/subindo

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

// Quadro cheio: o menor zoom que deixa o rosto na linha do centro sem borda vazia (até 1,25)
export const caixaCheia = (plano: Plano): Caixa => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const fx = plano.rosto.x;
  const zoom = Math.min(1.25, Math.max(1, 0.5 / Math.max(0.01, Math.min(fx, 1 - fx))));
  return { x: 0, y: 0, w: W, h: videoAltura, raio: 0, zoom, ancoraY: (plano.rosto.y * H) / videoAltura };
};

// até onde o funil vai, à direita, numa faixa de altura (na maior largura que ele chega a ter)
export const bordaDoFunil = (h: Historia, topo: number, base: number) => {
  let borda = h.geo.centro;
  for (let y = topo; y <= base; y += 8) {
    if (y < h.geo.y[0] - 10 || y > h.geo.y[h.geo.n]) continue;
    borda = Math.max(borda, h.geo.centro + larguraNaAltura(h.geo, h.geo.larguraMax, y) / 2);
  }
  return borda;
};

// o bloco com o centro do rosto mais ou menos na altura `y` (px): o maior que cabe ao lado do
// funil; se ali o funil ainda é largo demais, o bloco desce até caber
export const caixaDoBloco = (plano: Plano, y: number, h?: Historia): Caixa => {
  const lugar = (w: number, topoDesejado: number) => {
    const alt = Math.round(w * BLOCO.proporcao);
    const topo = Math.min(LIMITE_APP - 15 - alt, Math.max(TOPO_MIN, topoDesejado));
    const margem = topo + alt > ZONA_DOS_BOTOES ? BLOCO.margemBaixo : BLOCO.margem;
    return { w, alt, topo, margem };
  };
  const largo = (topoDesejado: number) => {
    let w = BLOCO.max;
    let l = lugar(w, topoDesejado);
    for (let i = 0; i < 3; i++) {
      l = lugar(w, topoDesejado);
      const livre = W - l.margem - (h ? bordaDoFunil(h, l.topo, l.topo + l.alt) + FOLGA : W - BLOCO.w);
      w = Math.max(BLOCO.min, Math.min(BLOCO.max, livre));
    }
    l = lugar(w, topoDesejado);
    const livre = W - l.margem - (h ? bordaDoFunil(h, l.topo, l.topo + l.alt) + FOLGA : 0);
    return { ...l, cabe: livre >= BLOCO.min - 0.5 };
  };
  let topoDesejado = y - Math.round(BLOCO.max * BLOCO.proporcao) * 0.4;
  let l = largo(topoDesejado);
  while (!l.cabe && l.topo + l.alt < LIMITE_APP - 16) {
    topoDesejado = l.topo + 8;
    l = largo(topoDesejado);
  }
  return {
    x: W - l.margem - l.w,
    y: l.topo,
    w: l.w,
    h: l.alt,
    raio: BLOCO.raio,
    zoom: plano.retrato?.zoom ?? BLOCO.zoom,
    ancoraY: plano.retrato?.ancoraY ?? BLOCO.ancoraY,
  };
};

// Para onde o bloco olha: uma etapa ou um passo (a divisa entre duas etapas).
export type Foco = { em: number; y: number; alvo: { etapa: number } | { passo: number } };

const yDaEtapa = (h: Historia, k: number) => (h.geo.y[k] + h.geo.y[k + 1]) / 2;
const yDoPasso = (h: Historia, k: number) => h.geo.y[k];

// Focos de um momento da tela do funil, em ordem.
export const focosDoMomento = (m: Momento, h: Historia): Foco[] => {
  const n = h.geo.n;
  if (m.tipo === "funil") {
    return m.etapas.map((e, k) => ({ em: k === 0 ? m.de : e.em, y: yDaEtapa(h, k), alvo: { etapa: k } }));
  }
  if (m.tipo !== "conserto") return [];
  // com o traço do caminho (que corre pela parede direita, com o texto no alto), o bloco começa
  // embaixo; sem ele, começa perto da primeira etapa
  const focos: Foco[] = [{ em: m.de, y: m.caminho ? yDaEtapa(h, n - 1) : yDaEtapa(h, 0), alvo: { etapa: m.caminho ? n - 1 : 0 } }];
  for (const c of m.consertos ?? []) {
    if (c.etapa >= 1 && c.etapa < n) focos.push({ em: c.em - 0.12, y: yDoPasso(h, c.etapa), alvo: { passo: c.etapa } });
  }
  // o botão "depois" fica no alto, à direita: o bloco desce para a última etapa
  if (m.depois) focos.push({ em: m.depois.em - 0.4, y: yDaEtapa(h, n - 1), alvo: { etapa: n - 1 } });
  return focos.sort((a, b) => a.em - b.em);
};

// Trechos em que a página está aberta: momentos de página seguidos viram um trecho só (a pessoa
// continua no bloco, que só muda de altura).
export const trechosDaPagina = (plano: Plano) => {
  const trechos: { de: number; ate: number; momentos: Momento[] }[] = [];
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

type FocoComCaixa = { em: number; y: number; caixa: Caixa; funil: boolean; troca?: boolean };

// o bloco começa a ir para a página nova este tempo antes da troca (enquanto a de saída some)
const BLOCO_ANTES = 0.35;

// Estados da caixa da pessoa ao longo do vídeo.
export const estadosDaPessoa = (plano: Plano, historiaDe: (m: Momento) => Historia | undefined): EstadoDaCaixa[] => {
  const cheia = caixaCheia(plano);
  const estados: EstadoDaCaixa[] = [{ de: -10, caixa: cheia, dur: 0.001 }];
  const cortes = plano.cortesEm ?? [];
  const zoom = plano.retrato?.zoom ?? BLOCO.zoom;
  const ancoraY = plano.retrato?.ancoraY ?? BLOCO.ancoraY;
  for (const trecho of trechosDaPagina(plano)) {
    const focos: FocoComCaixa[] = trecho.momentos.flatMap((m, i): FocoComCaixa[] => {
      // troca de página dentro do trecho (não o funil voltando para o seu conserto)
      const anterior = trecho.momentos[i - 1];
      const troca = !!anterior && !(ehTelaDoFunil(anterior) && ehTelaDoFunil(m) && historiaDe(anterior) === historiaDe(m));
      const marcar = (lista: FocoComCaixa[]) => lista.map((f, k) => (k === 0 && troca ? { ...f, em: f.em - BLOCO_ANTES, troca } : f));
      if (ehTelaDoFunil(m)) {
        const h = historiaDe(m);
        if (!h) return [];
        return marcar(focosDoMomento(m, h).map((f) => ({ em: f.em, y: f.y, caixa: caixaDoBloco(plano, f.y, h), funil: true })));
      }
      return marcar(focosDaPagina(m).map((f) => ({ em: f.em, y: f.y, caixa: caixaDaPagina(f.y, zoom, ancoraY, f.topoMin), funil: false })));
    });
    if (focos.length === 0) continue;
    focos.sort((a, b) => a.em - b.em);
    // a pessoa encolhe um instante antes do momento (um corte na fronteira cai no meio do movimento)
    const entra = trecho.de - 0.12;
    estados.push({ de: entra, caixa: focos[0].caixa, dur: TROCA });
    let ultima = focos[0].caixa;
    let ultimoY = focos[0].y;
    let ultimoEm = entra + TROCA;
    for (const f of focos.slice(1)) {
      // no funil, o alvo é a altura desejada; nas outras páginas, a caixa (que já vem limitada)
      const igual = f.funil && !f.troca
        ? Math.abs(f.y - ultimoY) < 30
        : Math.abs(f.caixa.y - ultima.y) < 30 && Math.abs(f.caixa.x - ultima.x) < 30 && Math.abs(f.caixa.w - ultima.w) < 20;
      if (igual) continue;
      // um corte logo antes do movimento: o bloco já se move no corte (esconde o pulo)
      const corte = cortes.find((c) => c > ultimoEm - 0.05 && c <= f.em && f.em - c < 0.6);
      // (nunca antes de o movimento anterior terminar: a caixa não pode pular)
      const em = Math.max(ultimoEm, corte !== undefined && !f.troca ? corte - 0.06 : f.em);
      estados.push({ de: em, caixa: f.caixa, dur: MOVE });
      ultima = f.caixa;
      ultimoY = f.y;
      ultimoEm = em + MOVE;
    }
    // volta ao quadro cheio no fim do trecho (a não ser que o vídeo acabe nele)
    if (trecho.ate < plano.duracao - 0.3) estados.push({ de: Math.max(ultimoEm, trecho.ate - 0.15), caixa: cheia, dur: TROCA });
  }
  return estados.sort((a, b) => a.de - b.de);
};

// 0 = quadro cheio, 1 = bloco (pela largura da caixa), para dosar moldura e etiqueta
export const noBloco = (caixa: Caixa) => Math.min(1, Math.max(0, (W - caixa.w) / (W - BLOCO.max)));

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
