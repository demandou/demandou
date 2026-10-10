// Gramática de layout do Respiro: onde ficam a janela em arco (a pessoa), a forma do respiro,
// as notas à mão e o mapa do respiro em cada momento — e como tudo flui de um lugar para o outro.
import { liquido, limitar, mistura, prog } from "./anim";
import { encaixar } from "./medida";
import type { Layout, Momento, Plano } from "./plano";
import { LIMITE_APP } from "./tema";

export type Retangulo = { x: number; y: number; w: number; h: number };
export type Janela = Retangulo & { raioTopo: number; raioBase: number; zoom: number; ancoraY: number };
export type Orbe = { cx: number; cy: number; rMin: number; rMax: number };
// `grande` = 1 no mapa grande da abertura (números grandes em cima), 0 no mapa pequeno das notas
export type RetMapa = Retangulo & { grande: number };
export type Cena = { janela: Janela; orbe: Orbe; mapa: RetMapa };
export type NomeDaCena = Layout | "cheio" | "respiro";

export const LAYOUTS: Layout[] = ["janela", "pagina", "esquerda", "direita", "embaixo", "centro", "dupla", "fecho"];

// Lugar padrão de cada bloco (o `prepararPlano` ainda alterna para dois momentos seguidos não
// ficarem no mesmo lugar)
export const LAYOUT_PADRAO: Record<Momento["tipo"], Layout> = {
  abertura: "janela",
  topicos: "janela",
  passos: "pagina",
  numero: "esquerda",
  comparacao: "dupla",
  grafico: "pagina",
  destaque: "centro",
  definicao: "janela",
  frase: "janela",
  pergunta: "janela",
  cta: "fecho",
  fase: "esquerda",
  ciclos: "embaixo",
  nota: "janela",
  lista: "janela",
};
const DA_FASE = { inspira: "esquerda", enche: "esquerda", segura: "direita", fica: "direita", solta: "embaixo", esvazia: "embaixo" } as const;

// Lugares com a forma grande (o texto fica na coluna ao lado da pessoa ou dentro da forma)
export const COM_FORMA: Layout[] = ["esquerda", "direita", "embaixo", "centro"];
// Lugares com o papel embaixo da janela
export const NO_PAPEL: Layout[] = ["janela", "pagina"];

export const layoutDe = (m: Momento): Layout => m.layout ?? (m.tipo === "fase" ? DA_FASE[m.fase] ?? "esquerda" : LAYOUT_PADRAO[m.tipo]);

// Áreas das notas e do texto em cada layout (px no quadro 1080×1920)
export const AREAS: Record<Layout, Retangulo> = {
  janela: { x: 76, y: 1010, w: 928, h: LIMITE_APP - 22 - 1010 },
  pagina: { x: 76, y: 738, w: 928, h: LIMITE_APP - 22 - 738 },
  esquerda: { x: 682, y: 130, w: 356, h: 740 },
  direita: { x: 42, y: 130, w: 356, h: 740 },
  embaixo: { x: 682, y: 872, w: 356, h: LIMITE_APP - 16 - 872 },
  // dentro da forma grande
  centro: { x: 200, y: 830, w: 680, h: 620 },
  // a faixa de cima, com as duas formas
  dupla: { x: 30, y: 36, w: 1020, h: 836 },
  fecho: { x: 76, y: 1026, w: 928, h: LIMITE_APP - 20 - 1026 },
};

const MAPA_ESCONDIDO: RetMapa = { x: 540, y: 1300, w: 0, h: 0, grande: 0 };

export const cenaDoLayout = (nome: NomeDaCena, plano: Plano): Cena => {
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const ancoraCheia = (plano.rosto.y * 1920) / videoAltura;
  const zoomPequena = plano.janela?.zoom ?? 1.25;
  const ancoraPequena = plano.janela?.ancoraY ?? 0.42;
  // a janela média (pagina, centro, dupla) fica entre a grande e as pequenas
  const zoomMedia = 1 + (zoomPequena - 1) * 0.4;
  const arco = (x: number, y: number, w: number, h: number, zoom: number, ancoraY: number, raioBase = 48): Janela => ({
    x,
    y,
    w,
    h,
    raioTopo: w / 2,
    raioBase,
    zoom,
    ancoraY,
  });
  switch (nome) {
    case "cheio":
      return {
        janela: { x: 0, y: 0, w: 1080, h: videoAltura, raioTopo: 0, raioBase: 0, zoom: 1, ancoraY: ancoraCheia },
        orbe: { cx: 540, cy: 1380, rMin: 0, rMax: 0 },
        mapa: MAPA_ESCONDIDO,
      };
    case "respiro":
      return {
        janela: arco(44, 44, 992, 1296, 1, Math.min(0.4, ancoraCheia + 0.03), 56),
        orbe: { cx: 540, cy: 1460, rMin: 0, rMax: 0 },
        mapa: MAPA_ESCONDIDO,
      };
    case "janela":
      return {
        janela: arco(60, 58, 960, 920, 1, 0.42, 56),
        // a forma "estaciona" no começo do mapa (e da onda da nota): é dali que ela nasce quando a
        // primeira fase começa, e é para lá que ela volta, virando o ponto da onda
        orbe: { cx: 100, cy: 1470, rMin: 0, rMax: 0 },
        mapa: { x: 104, y: 1358, w: 856, h: 76, grande: 1 },
      };
    case "pagina":
      return {
        janela: arco(190, 56, 700, 640, zoomMedia, ancoraPequena, 52),
        orbe: { cx: 112, cy: 1480, rMin: 0, rMax: 0 },
        mapa: MAPA_ESCONDIDO,
      };
    case "centro":
      return {
        janela: arco(190, 56, 700, 640, zoomMedia, ancoraPequena, 52),
        orbe: { cx: 540, cy: 1132, rMin: 180, rMax: 286 },
        mapa: MAPA_ESCONDIDO,
      };
    case "dupla":
      return {
        janela: arco(190, 898, 700, 640, zoomMedia, ancoraPequena, 52),
        orbe: { cx: 540, cy: 440, rMin: 0, rMax: 0 },
        mapa: MAPA_ESCONDIDO,
      };
    case "esquerda":
      return {
        janela: arco(44, 96, 604, 770, zoomPequena, ancoraPequena),
        orbe: { cx: 540, cy: 1236, rMin: 160, rMax: 268 },
        mapa: { x: 704, y: 606, w: 312, h: 92, grande: 0 },
      };
    case "direita":
      return {
        janela: arco(432, 96, 604, 770, zoomPequena, ancoraPequena),
        orbe: { cx: 540, cy: 1236, rMin: 160, rMax: 268 },
        mapa: { x: 64, y: 606, w: 312, h: 92, grande: 0 },
      };
    case "embaixo":
      return {
        janela: arco(44, 842, 604, 712, zoomPequena, ancoraPequena),
        orbe: { cx: 540, cy: 460, rMin: 156, rMax: 270 },
        mapa: { x: 704, y: 1318, w: 312, h: 92, grande: 0 },
      };
    case "fecho":
      return {
        janela: arco(130, 50, 820, 940, 1.06, 0.42, 56),
        orbe: { cx: 132, cy: 1434, rMin: 30, rMax: 36 },
        // o mapa volta pequeno, como uma assinatura do respiro, à direita da assinatura
        mapa: { x: 640, y: 1386, w: 330, h: 70, grande: 0 },
      };
  }
};

// Duração das trocas de lugar: lentas e líquidas
export const VIAGEM = 1.15;

export type Trecho = { de: number; nome: NomeDaCena; dur: number };

// ---------- preparar o plano: tempos seguros e o lugar de cada momento ----------

// Altura aproximada do conteúdo de uma lista/pergunta no papel (para escolher janela ou página)
const alturaNoPapel = (m: Momento, largura: number) => {
  const alt = (texto: string | undefined, familia: "serif" | "mao", max: number, min: number, linhas: number, entre = 1.1) => {
    if (!texto) return 0;
    const e = encaixar(texto, { largura, max, min, linhas, fonte: { familia, peso: familia === "mao" ? 600 : 400 } });
    return e.linhas.length * e.tamanho * entre;
  };
  if (m.tipo === "topicos" || m.tipo === "lista") {
    const itens = m.itens.slice(0, 5);
    return (
      alt(m.titulo, "serif", 96, 64, 2) +
      24 +
      itens.reduce((s, it) => s + Math.max(84, alt(it.texto, "mao", 88, 56, 2, 1.06)) + (it.detalhe ? alt(it.detalhe, "mao", 52, 44, 2, 1.04) + 4 : 0) + 18, 0)
    );
  }
  if (m.tipo === "pergunta") {
    return alt(m.texto, "serif", 100, 64, 3) + (m.opcoes ?? []).reduce((s, o) => s + Math.max(84, alt(o.texto, "mao", 80, 56, 2)) + 14, 30);
  }
  return 0;
};

const cabeNaJanela = (m: Momento) => alturaNoPapel(m, AREAS.janela.w - 110) <= AREAS.janela.h - 30;

// Ajuste de segurança (um momento nunca invade o seguinte) e o lugar de cada momento: o padrão do
// bloco, com alternância para dois momentos seguidos não repetirem o mesmo lugar.
export const prepararPlano = (plano: Plano): Plano => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  const saida: Momento[] = [];
  ordenados.forEach((m0, i) => {
    const proximo = ordenados[i + 1];
    const m: Momento = proximo && m0.ate > proximo.de ? { ...m0, ate: proximo.de } : { ...m0 };
    if (m.layout && !LAYOUTS.includes(m.layout)) delete m.layout;
    if (!m.layout) {
      let l = layoutDe(m);
      if ((m.tipo === "topicos" || m.tipo === "lista" || m.tipo === "pergunta") && !cabeNaJanela(m)) l = "pagina";
      const anterior = saida[saida.length - 1];
      const colado = anterior && m.de - anterior.ate < 0.4;
      if (colado && m.tipo !== "fase" && m.tipo !== "ciclos" && m.tipo !== "cta") {
        const la = anterior.layout as Layout;
        if (l === la) {
          if (l === "esquerda") l = "direita";
          else if (l === "direita") l = "esquerda";
          else if (l === "janela") l = "pagina";
          else if (l === "pagina" && (m.tipo === "topicos" || m.tipo === "lista" || m.tipo === "pergunta" ? cabeNaJanela(m) : NO_PAPEL.includes(LAYOUT_PADRAO[m.tipo]))) l = "janela";
          else if (l === "centro") l = anterior.tipo === "numero" || anterior.tipo === "destaque" ? "embaixo" : "esquerda";
          else if (l === "embaixo") l = "esquerda";
        } else if (COM_FORMA.includes(l) && COM_FORMA.includes(la) && l !== "centro" && la !== "centro" && l !== "embaixo") {
          // forma depois de forma: a pessoa troca de lado
          l = la === "esquerda" ? "direita" : "esquerda";
        }
      }
      m.layout = l;
    }
    saida.push(m);
  });
  return { ...plano, momentos: saida };
};

// Sequência de lugares ao longo do vídeo. Começa em tela cheia e vira janela em arco logo no
// primeiro segundo; entre momentos com respiro (> 0,4 s), a janela cresce ("respiro") e a legenda aparece.
export const trechosDeLayout = (plano: Plano): Trecho[] => {
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const trechos: Trecho[] = [{ de: 0, nome: "cheio", dur: 0 }];
  const empurrar = (de: number, nome: NomeDaCena, dur = VIAGEM) => {
    const ultimo = trechos[trechos.length - 1];
    if (ultimo.nome === nome) return;
    if (Math.abs(ultimo.de - de) < 0.05 && trechos.length > 1) {
      ultimo.nome = nome;
      return;
    }
    trechos.push({ de, nome, dur });
  };
  const primeiro = momentos[0];
  // a abertura se recolhe em ~1 s: o papel embaixo aparece logo
  if (!primeiro || primeiro.de > 0.4) empurrar(0.08, "respiro", 1.0);
  momentos.forEach((m, i) => {
    empurrar(Math.max(0.08, m.de), layoutDe(m), m.de < 0.4 ? 1.0 : VIAGEM);
    const prox = momentos[i + 1];
    if (!prox ? m.ate < plano.duracao - 0.6 : prox.de - m.ate > 0.4) empurrar(m.ate, "respiro");
  });
  return trechos;
};

const lerp = <T extends Record<string, number>>(a: T, b: T, p: number): T => {
  const saida = { ...a };
  for (const k of Object.keys(a) as (keyof T)[]) (saida as Record<keyof T, number>)[k] = mistura(a[k], b[k], p);
  return saida;
};

export type CenaNoTempo = Cena & {
  // progresso da troca em andamento (1 = parado no lugar)
  troca: number;
  // aperto da forma durante uma viagem longa (0–1): ela encolhe um pouco no caminho, como líquido
  aperto: number;
};

export const cenaNoTempo = (t: number, trechos: Trecho[], plano: Plano): CenaNoTempo => {
  let i = 0;
  for (let k = 0; k < trechos.length; k++) if (trechos[k].de <= t) i = k;
  const alvo = cenaDoLayout(trechos[i].nome, plano);
  if (i === 0) return { ...alvo, troca: 1, aperto: 0 };
  // de onde vem: o estado (possivelmente no meio de outra troca) no instante em que esta começou
  const origem = cenaNoTempo(trechos[i].de, trechos.slice(0, i), plano);
  const p = prog(t, trechos[i].de, trechos[i].dur, liquido);
  const janela = lerp(origem.janela, alvo.janela, p);
  const orbe = lerp(origem.orbe, alvo.orbe, p);
  const mapa = lerp(origem.mapa, alvo.mapa, p);
  // a forma que vai sumir (o lugar novo não tem forma) encolhe mais depressa: não fica por baixo
  // do texto que chega
  if (alvo.orbe.rMax === 0 && origem.orbe.rMax > 0) {
    const pr = prog(t, trechos[i].de, trechos[i].dur * 0.55, liquido);
    orbe.rMin = mistura(origem.orbe.rMin, 0, pr);
    orbe.rMax = mistura(origem.orbe.rMax, 0, pr);
  }

  // Troca de andar (a janela desce enquanto a forma sobe, ou o contrário): cada uma contorna
  // a outra por um lado, para nunca passarem uma por cima da outra no meio do caminho.
  const dyJ = alvo.janela.y - origem.janela.y;
  const dyO = alvo.orbe.cy - origem.orbe.cy;
  const curva = Math.sin(Math.PI * p);
  let aperto = 0;
  const formaFica = Math.min(origem.orbe.rMax, alvo.orbe.rMax) > 40;
  const trocaDeAndar = Math.abs(dyJ) > 300 && Math.abs(dyO) > 300 && Math.sign(dyJ) !== Math.sign(dyO);
  if (trocaDeAndar) {
    // cada uma fica no seu andar por mais tempo e as duas se cruzam rápido no fim: a tela nunca
    // fica com uma metade vazia no meio da troca
    const pv = p * p;
    janela.y = mistura(origem.janela.y, alvo.janela.y, pv);
    orbe.cy = mistura(origem.orbe.cy, alvo.orbe.cy, pv);
  }
  if (formaFica && trocaDeAndar) {
    // a janela desce (ou sobe) pelo lado de onde saiu e a forma pelo outro: as notas que estavam
    // do outro lado continuam no lugar até a forma chegar
    const origemX = origem.janela.x + origem.janela.w / 2 - 540;
    const lado = origemX === 0 ? -1 : Math.sign(origemX);
    janela.x += lado * 180 * curva;
    orbe.cx -= lado * 190 * curva;
    aperto = curva;
  } else if (Math.hypot(alvo.orbe.cx - origem.orbe.cx, dyO) > 300) aperto = curva * 0.6;
  return { janela, orbe, mapa, troca: p, aperto: limitar(aperto) };
};

// Retângulo em volta da forma (com o anel), para saber o que ocupa o mesmo lugar
export const retDaOrbe = (o: Orbe): Retangulo => {
  const r = o.rMax + 60;
  return { x: o.cx - r, y: o.cy - r, w: 2 * r, h: 2 * r };
};

export const cruzam = (a: Retangulo, b: Retangulo, folga = 20) =>
  a.w > 0 && b.w > 0 && a.x < b.x + b.w - folga && a.x + a.w > b.x + folga && a.y < b.y + b.h - folga && a.y + a.h > b.y + folga;
