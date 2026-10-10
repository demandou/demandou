// Geometria da planilha (px no quadro 1080×1920). Toda célula — a da pessoa, a de destaque,
// as da tabela, as dos blocos — encaixa nas linhas e colunas daqui, para a grade nunca "mentir".
import type { Caixa, Rosto } from "./motor/caixa";
import { ehDeFaixa, type Linha, type Lugar, type Momento, type Plano } from "./plano";
import { COL, FAIXA, FUNDO_UTIL, GRADE_Y, LETRAS, LINHA, TAB, TABELA_Y } from "./tema";

export type Ret = { x: number; y: number; w: number; h: number };

// ---------- a tabela das `linha` ----------

export const linhasDaTabela = (plano: Plano): Linha[] =>
  [...plano.momentos].filter((m): m is Linha => m.tipo === "linha").sort((a, b) => a.de - b.de).slice(0, 4);

// altura das linhas da tabela: 128 px até 3 linhas; com 4, encolhe para caber acima das abas
export const alturaDaLinha = (n: number) =>
  n <= 3 ? TAB.linha : Math.floor((FUNDO_UTIL - TABELA_Y - TAB.cabecalho - TAB.sub - TAB.total) / n);

// Bordas fixas das linhas da grade abaixo da faixa de cima, com as sub-linhas fechadas
// (é nelas que a célula da pessoa encaixa nos lugares "cheia", "grande" e "alto").
export const bordasFixas = (plano: Plano) => {
  const n = Math.max(3, linhasDaTabela(plano).length);
  const h = alturaDaLinha(n);
  const bordas = [TABELA_Y, TABELA_Y + TAB.cabecalho];
  for (let i = 0; i < n; i++) bordas.push(bordas[bordas.length - 1] + h);
  bordas.push(bordas[bordas.length - 1] + TAB.total);
  while (bordas[bordas.length - 1] + LINHA <= 1920 + LINHA) bordas.push(bordas[bordas.length - 1] + LINHA);
  return bordas;
};

const ultimaBordaAte = (bordas: number[], limite: number) => [...bordas].reverse().find((b) => b <= limite) ?? limite;

// ---------- a cabeça da pessoa ----------

// Medidas da cabeça a partir do rastro do motor (largura do rosto): do alto do cabelo ao queixo,
// em px do vídeo de trabalho (1080 de largura). Sem rastro, null (vale o enquadramento padrão).
const cabeca = (plano: Plano) => {
  const r = (plano.rosto as Rosto).rastro;
  if (!r || !(r.largura > 0.05)) return null;
  const W = r.largura * 1080;
  const y = plano.rosto.y * 1920;
  return { topo: y - 0.69 * W, queixo: y + 0.58 * W, altura: 1.27 * W };
};

// A gravação está tão perto da câmera que a cabeça não cabe numa célula larga e baixa: o lugar
// "alto" ganha duas linhas a mais (e a célula larga embaixo fica do tamanho da de cima).
export const pertoDaCamera = (plano: Plano) => {
  const c = cabeca(plano);
  if (!c) return false;
  const bordas = bordasFixas(plano);
  const h = bordas[2] - GRADE_Y;
  const w = COL[3] - COL[0];
  const H0 = Math.min(1920, plano.videoAltura ?? 1920);
  const s = Math.max(w / 1080, h / H0);
  return c.altura * s > 0.96 * h;
};

// ---------- lugares da pessoa ----------

export type CaixaPessoa = Required<Caixa>;

// Enquadramento padrão de cada lugar: o zoom e a altura do rosto foram escolhidos para mostrar
// cabeça e ombros sem cortar o cabelo (gravação com o rosto a ~30% da altura). Com o rastro do
// motor, o template confere a cabeça inteira e abre o quadro ou desce o rosto quando precisa.
const ENQUADRAMENTO: Record<Lugar, { zoom: number; ancoraY: number }> = {
  cheia: { zoom: 1, ancoraY: 0.33 },
  grande: { zoom: 1, ancoraY: 0.42 },
  alto: { zoom: 1.02, ancoraY: 0.5 },
  esquerda: { zoom: 1.24, ancoraY: 0.47 },
  direita: { zoom: 1.08, ancoraY: 0.47 },
  estreita: { zoom: 1.45, ancoraY: 0.45 },
};

export const retDoLugar = (plano: Plano, lugar: Lugar): Ret => {
  const bordas = bordasFixas(plano);
  const fundo = ultimaBordaAte(bordas, FUNDO_UTIL);
  const larguraToda = { x: COL[0], w: COL[3] - COL[0] };
  switch (lugar) {
    case "cheia":
      return { ...larguraToda, y: GRADE_Y, h: fundo - GRADE_Y };
    case "grande": {
      const topo = GRADE_Y + 3 * LINHA;
      return { ...larguraToda, y: topo, h: fundo - topo };
    }
    case "alto":
      return { ...larguraToda, y: GRADE_Y, h: bordas[pertoDaCamera(plano) ? 3 : 2] - GRADE_Y };
    case "esquerda":
      return { x: COL[0], w: COL[2] - COL[0], y: FAIXA.y, h: FAIXA.h };
    case "direita":
      return { x: COL[1], w: COL[3] - COL[1], y: FAIXA.y, h: FAIXA.h };
    case "estreita":
      return { x: COL[2], w: COL[3] - COL[2], y: FAIXA.y, h: FAIXA.h };
  }
};

const memoCaixa = new WeakMap<Plano, Map<Lugar, CaixaPessoa>>();

export const caixaDoLugar = (plano: Plano, lugar: Lugar): CaixaPessoa => {
  let porLugar = memoCaixa.get(plano);
  if (!porLugar) {
    porLugar = new Map();
    memoCaixa.set(plano, porLugar);
  }
  const guardada = porLugar.get(lugar);
  if (guardada) return guardada;
  const r = retDoLugar(plano, lugar);
  const e = ENQUADRAMENTO[lugar];
  const aj = plano.enquadramento ?? {};
  // o zoom nunca fica abaixo de 1 (abaixo disso sobraria borda vazia na célula)
  let zoom = Math.max(1, e.zoom * (aj.zoom ?? 1));
  let ancoraY = e.ancoraY;
  const c = cabeca(plano);
  if (c) {
    const H0 = Math.min(1920, plano.videoAltura ?? 1920);
    const cobre = Math.max(r.w / 1080, r.h / H0);
    // o maior zoom em que a cabeça inteira cabe com folga (4% em cima e embaixo)
    const zoomMax = (0.9 * r.h) / (c.altura * cobre);
    if (zoom > zoomMax && aj.zoom === undefined) zoom = Math.max(1, zoomMax);
    const s = cobre * zoom;
    const rostoPx = (plano.rosto.y * 1920 - c.topo) * s; // do alto da cabeça ao centro do rosto
    const queixoPx = (c.queixo - plano.rosto.y * 1920) * s;
    const centro = e.ancoraY * r.h;
    if (c.altura * s <= 0.96 * r.h) {
      // cabe: o alto da cabeça fica dentro da célula, e o queixo também
      if (centro - rostoPx < 0.04 * r.h) ancoraY = (0.04 * r.h + rostoPx) / r.h;
      else if (centro + queixoPx > 0.97 * r.h) ancoraY = (0.97 * r.h - queixoPx) / r.h;
    } else {
      // não cabe inteira: o rosto inteiro fica (o corte vai para o alto do cabelo)
      ancoraY = (0.97 * r.h - queixoPx) / r.h;
    }
  }
  const caixa = { ...r, raio: 0, zoom, ancoraY: ancoraY + (aj.ancoraY ?? 0) };
  porLugar.set(lugar, caixa);
  return caixa;
};

// ---------- as células de conteúdo ----------

// A célula de destaque, ao lado da pessoa na faixa de cima
export const retDoDestaque = (lugar: Lugar): Ret | null => {
  if (lugar === "esquerda") return { x: COL[2], w: COL[3] - COL[2], y: FAIXA.y, h: FAIXA.h };
  if (lugar === "direita") return { x: COL[0], w: COL[1] - COL[0], y: FAIXA.y, h: FAIXA.h };
  if (lugar === "estreita") return { x: COL[0], w: COL[2] - COL[0], y: FAIXA.y, h: FAIXA.h };
  return null;
};

// A célula do título da abertura (linhas 1–3, em cima da pessoa "grande")
export const RET_TITULO: Ret = { x: COL[0], w: COL[3] - COL[0], y: GRADE_Y, h: 3 * LINHA };

// A célula larga embaixo da pessoa "alta" (fechamento e blocos de uma célula)
export const retCelulaLarga = (plano: Plano): Ret => {
  const bordas = bordasFixas(plano);
  const fundo = ultimaBordaAte(bordas, FUNDO_UTIL);
  const topo = bordas[pertoDaCamera(plano) ? 3 : 2];
  return { x: COL[0], w: COL[3] - COL[0], y: topo, h: fundo - topo };
};

// A área de baixo nos lugares da faixa (tabela, lista, gráfico): linhas 6 em diante
export const RET_BAIXO: Ret = { x: COL[0], w: COL[3] - COL[0], y: TABELA_Y, h: FUNDO_UTIL - TABELA_Y };

// Onde entra o conteúdo de um momento, conforme o lugar da pessoa
export type Regioes = { topo?: Ret; larga?: Ret; lado?: Ret; baixo?: Ret };
export const regioesDoMomento = (plano: Plano, m: Momento, lugar: Lugar): Regioes => {
  if (ehDeFaixa(m)) {
    const lado = retDoDestaque(lugar) ?? undefined;
    return { lado, baixo: RET_BAIXO };
  }
  if (lugar === "grande") return { topo: RET_TITULO };
  return { larga: retCelulaLarga(plano) };
};

// ---------- o lugar de cada momento ----------

const LUGARES_DE_FAIXA: Lugar[] = ["esquerda", "direita", "estreita"];
const LUGARES_DE_CELULA: Lugar[] = ["grande", "alto"];

// Lugar padrão de cada momento:
// - abertura: "grande" (o texto em cima);
// - blocos da faixa (linha, tabela, topicos, passos, preencher, grafico): alternam esquerda/direita;
//   a linha com pizza e o gráfico deixam a pessoa "estreita" (o desenho precisa de largura);
// - blocos de uma célula: numero e destaque em cima da pessoa ("grande"), os outros embaixo dela
//   ("alto"); dois seguidos no mesmo lugar trocam, para a pessoa sempre mudar de lugar.
export const lugaresDosMomentos = (plano: Plano): Map<Momento, Lugar> => {
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  const mapa = new Map<Momento, Lugar>();
  let lado = 0;
  let anterior: { m: Momento; l: Lugar } | null = null;
  for (const m of ordem) {
    let l: Lugar;
    const faixa = ehDeFaixa(m);
    if (m.tipo === "abertura") l = "grande";
    else if (faixa) {
      if ((m.tipo === "linha" && m.destaque?.tipo === "pizza") || m.tipo === "grafico") l = "estreita";
      else l = lado % 2 === 0 ? "esquerda" : "direita";
    } else {
      l = m.tipo === "numero" || m.tipo === "destaque" ? "grande" : "alto";
      const colado = anterior && m.de - anterior.m.ate < 0.15;
      // o fechamento fica sempre embaixo da pessoa; os outros trocam com o anterior
      if (colado && anterior && anterior.l === l && !m.pessoa && m.tipo !== "cta") l = l === "grande" ? "alto" : "grande";
    }
    if (m.pessoa) {
      const valido = m.tipo === "abertura" ? true : faixa ? LUGARES_DE_FAIXA.includes(m.pessoa) : LUGARES_DE_CELULA.includes(m.pessoa);
      if (valido) l = m.pessoa;
    }
    if (faixa) {
      // a próxima vai para o outro lado do que esta ocupou
      lado = l === "esquerda" ? 1 : 0;
    }
    mapa.set(m, l);
    anterior = { m, l };
  }
  return mapa;
};

// ---------- endereço das células ----------

export const colunaEm = (x: number) => {
  for (let c = 0; c < 3; c++) if (x < COL[c + 1] - 1) return c;
  return 2;
};
export const endereco = (col: number, linha: number) => `${LETRAS[col] ?? "A"}${linha}`;
// endereço de um retângulo da grade (canto de cima à esquerda; com `ate`, o intervalo)
export const enderecoDoRet = (r: Ret, ate = false) => {
  const linhaDe = (y: number) => 1 + Math.max(0, Math.round((y - GRADE_Y) / LINHA));
  const a = endereco(colunaEm(r.x + 2), linhaDe(r.y));
  if (!ate) return a;
  const b = endereco(colunaEm(r.x + r.w - 4), linhaDe(r.y + r.h - 4));
  return a === b ? a : `${a}:${b}`;
};
