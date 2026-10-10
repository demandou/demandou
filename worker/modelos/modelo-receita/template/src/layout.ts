// A gramática do modelo: a ficha de receita e a janela da pessoa.
// - "peito": a pessoa em quadro cheio e a ficha baixa, na altura do peito (abertura, dica, fechamento);
// - "ficha": a ficha sobe e ocupa a tela; a pessoa fica numa janela arredondada num canto
//   (ingredientes, passo, topicos, passos, comparacao, grafico), e muda de canto a cada momento;
// - "livre": trecho sem momento — a pessoa em quadro cheio, a ficha fora da tela, com legenda.
import { mistura, prog, troca } from "./anim";
import type { Canto, Momento, Plano } from "./plano";
import { FICHA, H, JANELA, LARGURA_UTIL, LIMITE_APP, TOPO, W, X0, X1 } from "./tema";

export type Rect = { x: number; y: number; w: number; h: number };
export type Modo = "livre" | "peito" | "ficha";

// os blocos que precisam de espaço sobem a ficha; os de uma frase ficam no peito
const NA_FICHA = new Set(["ingredientes", "passo", "topicos", "passos", "comparacao", "grafico"]);
export const naFicha = (m: Momento | null): m is Extract<Momento, { tipo: "ingredientes" | "passo" | "topicos" | "passos" | "comparacao" | "grafico" }> =>
  !!m && NA_FICHA.has(m.tipo);

export const modoDo = (m: Momento | null): Modo => (!m ? "livre" : naFicha(m) ? "ficha" : "peito");

// Ajuste de segurança antes de desenhar: um momento nunca invade o seguinte.
export const comCapa = (plano: Plano): Plano => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  return {
    ...plano,
    momentos: ordenados.map((m, i) => {
      const proximo = ordenados[i + 1];
      return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
    }),
  };
};

// Um trecho da linha do tempo: um momento ou um respiro sem momento (índice -1).
export type Trecho = {
  indice: number;
  de: number;
  ate: number;
  // quando a troca de layout que leva a este trecho começa
  troca: number;
  // quanto dura essa troca
  dur: number;
  canto: Canto | null;
};

// buraco menor que isto entre dois momentos não vira respiro: o momento anterior se estende
const BURACO_MINIMO = 1.2;

export const montarTrechos = (plano: Plano): Trecho[] => {
  const ms = plano.momentos;
  const brutos: { indice: number; de: number; ate: number }[] = [];
  let cursor = 0;
  ms.forEach((m, i) => {
    if (m.de - cursor >= BURACO_MINIMO || (i === 0 && m.de > 0.05 && m.de - cursor >= BURACO_MINIMO)) {
      brutos.push({ indice: -1, de: cursor, ate: m.de });
    } else if (brutos.length) brutos[brutos.length - 1].ate = m.de;
    brutos.push({ indice: i, de: m.de, ate: m.ate });
    cursor = m.ate;
  });
  if (plano.duracao - cursor >= BURACO_MINIMO) brutos.push({ indice: -1, de: cursor, ate: plano.duracao + 1 });
  else if (brutos.length) brutos[brutos.length - 1].ate = plano.duracao + 1;
  if (brutos.length === 0) brutos.push({ indice: -1, de: 0, ate: plano.duracao + 1 });
  if (brutos[0].de > 0) brutos[0].de = 0;

  // canto da janela: o escolhido no plano ou alternando a partir do último canto usado
  let ultimo: Canto | null = null;
  const cortes = plano.cortesEm ?? [];
  return brutos.map((b, k) => {
    const m = b.indice >= 0 ? ms[b.indice] : null;
    let canto: Canto | null = null;
    if (naFicha(m)) {
      const alternado: Canto = ultimo === "sup-dir" ? "sup-esq" : "sup-dir";
      canto = m.pessoa === "sup-esq" || m.pessoa === "sup-dir" ? m.pessoa : alternado;
      ultimo = canto;
    }
    const anterior = k > 0 ? brutos[k - 1] : null;
    const modoAntes = anterior ? modoDo(anterior.indice >= 0 ? ms[anterior.indice] : null) : null;
    const modoAgora = modoDo(m);
    const dur = modoAntes === modoAgora ? 0.62 : 0.72;
    // a troca começa um pouco antes do corte: o pulo do corte some no meio do movimento
    const corte = cortes.find((c) => Math.abs(c - b.de) < 0.3);
    let inicio = corte !== undefined ? corte - 0.16 : b.de - 0.08;
    if (anterior) inicio = Math.max(inicio, anterior.de + 0.3);
    return { indice: b.indice, de: b.de, ate: b.ate, troca: k === 0 ? -10 : Math.max(0, inicio), dur, canto };
  });
};

// ---------- geometria de cada estado ----------

export type Janela = Rect & { raio: number; zoom: number; ancoraY: number };

export type Quadro = {
  modo: Modo;
  // topo da ficha (px)
  fichaY: number;
  // caixa da pessoa
  janela: Janela;
  // área do cabeçalho (ao lado da janela) e do corpo (abaixo), nos momentos da ficha
  cabecalho: Rect;
  corpo: Rect;
  canto: Canto | null;
};

// altura da ficha no peito: logo abaixo do queixo
// (o motor põe o topo da zona ~170 px abaixo do queixo; a ficha sobe um pouco mais, para caber o texto grande)
export const fichaNoPeito = (plano: Plano) => Math.round(Math.min(1080, Math.max(900, (plano.zona?.topo ?? 985) - 10)));

export const retDaJanela = (canto: Canto): Rect => ({ x: canto === "sup-esq" ? X0 : X1 - JANELA.w, y: TOPO, w: JANELA.w, h: JANELA.h });

export const quadroDe = (trecho: Trecho, plano: Plano): Quadro => {
  const m = trecho.indice >= 0 ? plano.momentos[trecho.indice] : null;
  const modo = modoDo(m);
  const vH = Math.min(H, plano.videoAltura ?? H);
  // altura do rosto no vídeo de trabalho, em px do quadro
  const rostoPx = plano.rosto.y * H;
  const corpoPadrao: Rect = { x: X0, y: TOPO + JANELA.h + 28, w: LARGURA_UTIL, h: LIMITE_APP - 12 - (TOPO + JANELA.h + 28) };
  if (modo === "ficha" && trecho.canto) {
    const r = retDaJanela(trecho.canto);
    const esq = trecho.canto === "sup-esq";
    const larguraCab = LARGURA_UTIL - JANELA.w - 40;
    // o cabeçalho fica ao lado da janela; o corpo, abaixo dos dois
    const cabecalho: Rect = { x: esq ? X0 + JANELA.w + 40 : X0, y: TOPO, w: larguraCab, h: JANELA.h };
    const corpo: Rect = corpoPadrao;
    return {
      modo,
      fichaY: FICHA.topoCheio,
      janela: { ...r, raio: JANELA.raio, zoom: 2.15 * (plano.pessoa?.zoom ?? 1), ancoraY: plano.pessoa?.ancoraY ?? 0.42 },
      cabecalho,
      corpo,
      canto: trecho.canto,
    };
  }
  const fichaY = modo === "peito" ? fichaNoPeito(plano) : H + 60;
  // a pessoa ocupa o quadro acima da ficha, com o mesmo enquadramento do quadro cheio
  const h = modo === "peito" ? Math.min(H, fichaY + FICHA.raio) : H;
  // mesma conta do VideoNaCaixa: com esta âncora o vídeo fica preso no topo, como no quadro cheio
  const escala = Math.max(1, h / vH);
  const ancoraY = Math.min(0.9, (rostoPx * escala) / h + 0.0001);
  // cabeçalho e corpo andam presos à ficha (descem com ela)
  const desce = fichaY - FICHA.topoCheio;
  return {
    modo,
    fichaY,
    janela: { x: 0, y: 0, w: W, h, raio: 0, zoom: 1, ancoraY },
    cabecalho: { x: X0, y: TOPO + desce, w: LARGURA_UTIL - JANELA.w - 40, h: JANELA.h },
    // o corpo vem um pouco mais baixo que a ficha: ao subir, ele assenta por último (não encosta no título)
    corpo: { ...corpoPadrao, y: corpoPadrao.y + desce + (modo === "peito" ? 90 : 0) },
    canto: null,
  };
};

const misturarRet = <T extends Rect>(a: T, b: T, p: number): Rect => ({
  x: mistura(a.x, b.x, p),
  y: mistura(a.y, b.y, p),
  w: mistura(a.w, b.w, p),
  h: mistura(a.h, b.h, p),
});

// O estado no instante t, com a troca suave entre o trecho anterior e o atual.
export type Estado = {
  quadro: Quadro;
  // trecho atual e o anterior, e o progresso da troca entre eles (0 → 1)
  atual: number;
  anterior: number;
  p: number;
};

export const indiceDoTrecho = (t: number, trechos: Trecho[]) => {
  let k = 0;
  trechos.forEach((tr, i) => {
    if (t >= tr.troca) k = i;
  });
  return k;
};

export const estadoNoTempo = (t: number, trechos: Trecho[], quadros: Quadro[]): Estado => {
  const k = indiceDoTrecho(t, trechos);
  const tr = trechos[k];
  const p = k === 0 ? 1 : prog(t, tr.troca, tr.dur, troca);
  const a = quadros[Math.max(0, k - 1)];
  const b = quadros[k];
  if (p >= 1 || k === 0) return { quadro: b, atual: k, anterior: k - 1, p: 1 };
  // a janela muda de tamanho um pouco antes de chegar (a ficha sobe "levando" a pessoa)
  const pj = p;
  const janela: Janela = {
    ...misturarRet(a.janela, b.janela, pj),
    raio: mistura(a.janela.raio, b.janela.raio, Math.min(1, pj * 1.6)),
    zoom: mistura(a.janela.zoom, b.janela.zoom, pj),
    ancoraY: mistura(a.janela.ancoraY, b.janela.ancoraY, pj),
  };
  return {
    quadro: {
      modo: b.modo,
      fichaY: mistura(a.fichaY, b.fichaY, p),
      janela,
      cabecalho: misturarRet(a.cabecalho, b.cabecalho, p),
      corpo: misturarRet(a.corpo, b.corpo, p),
      canto: b.canto,
    },
    atual: k,
    anterior: k - 1,
    p,
  };
};
