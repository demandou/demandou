// A gramática do Chave, em tempo: onde a pessoa está (a "porta") em cada momento, quando o quadro
// de chaves aparece e quanto o batente engrossa. Tudo sai dos momentos do plano.
import type { Caixa, EstadoDaCaixa, Rosto } from "./motor/caixa";
import type { Item, Momento, Plano } from "./plano";
import { AREA, H, MARGEM_HALL, PISO_Y, PORTA_BAIXO, PORTA_FAIXA, PORTA_FAIXA_LARGURA, PORTA_LATERAL, W } from "./tema";

// duração da troca de lugar da pessoa
export const TROCA = 0.52;
// a troca começa um pouco antes da fronteira: o corte que costuma ficar nela cai no meio do movimento
export const ANTES = 0.14;

// cheio: a tela é o vão da porta · esquerda/direita: porta estreita ao lado do painel (demo) ·
// faixa: porta larga no alto, sob o quadro de chaves (chaveiro) · deslocado: a pessoa à direita, a
// coluna do "N×" à esquerda · embaixo: porta larga apoiada no piso, a parede em cima com o conteúdo
export type Arranjo = "cheio" | "esquerda" | "direita" | "faixa" | "deslocado" | "embaixo";

// Blocos que vão para a parede (a pessoa na porta de baixo)
export const TIPOS_DE_PAREDE = ["topicos", "passos", "numero", "comparacao", "grafico"] as const;
export type TipoDeParede = (typeof TIPOS_DE_PAREDE)[number];
export const ehParede = (m: Momento): m is Extract<Momento, { tipo: TipoDeParede }> => (TIPOS_DE_PAREDE as readonly string[]).includes(m.tipo);

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

export const ehItem = (m: Momento): m is Item => m.tipo === "item";
// O arranjo de cada momento. O chaveiro abre a faixa larga embaixo da pessoa (que fica no alto);
// prancheta e conta com `lado` põem a pessoa numa porta estreita ao lado (o demo); sem `lado`, a
// pessoa vai para a porta de baixo e o painel ocupa a parede. Os blocos de parede também usam a
// porta de baixo; o resto é quadro cheio, com a arte no peito.
export const arranjos = (plano: Plano): Map<Momento, Arranjo> => {
  const mapa = new Map<Momento, Arranjo>();
  // gravação de perto (rosto largo): a porta estreita e a coluna do "N×" cortariam o rosto
  const perto = rostoGrande(plano);
  for (const m of plano.momentos) {
    if (ehItem(m)) {
      if (m.painel.tipo === "chaveiro") mapa.set(m, "faixa");
      else mapa.set(m, m.lado && !perto ? m.lado : "embaixo");
    } else if (m.tipo === "vezes") mapa.set(m, perto ? "embaixo" : "deslocado");
    else if (ehParede(m)) mapa.set(m, "embaixo");
    else mapa.set(m, "cheio");
  }
  return mapa;
};

// ---------- o tamanho da cabeça na gravação ----------
// Quanto da gravação (px, na largura de 1080) uma porta precisa mostrar para a cabeça caber inteira,
// do alto do cabelo até um pouco abaixo do queixo. Gravação de perto (selfie) pede uma porta mais
// quadrada; gravação de longe aceita a porta bem larga.
export const cabecaNaGravacao = (plano: Plano) => {
  const rosto = plano.rosto as Rosto;
  const ry = rosto.y * H;
  const largura = rosto.rastro?.largura;
  // o queixo: pela largura do rosto (o rastreio mede) ou pela zona (170 px abaixo do queixo)
  const queixo = largura ? ry + 0.66 * largura * W : (plano.zona?.topo ?? 996) - 170;
  const d = Math.max(80, queixo - ry);
  const cabelo = ry - 1.3 * d;
  const topo = Math.max(0, cabelo - 0.25 * d);
  const base = queixo + 0.55 * d;
  return { ry, queixo, d, topo, precisa: base - topo };
};

// Largura do rosto na gravação (fração da largura do quadro): o rastreio mede; sem ele, estima pelo queixo
export const larguraDoRosto = (plano: Plano) => (plano.rosto as Rosto).rastro?.largura ?? cabecaNaGravacao(plano).d / 0.66 / W;
export const rostoGrande = (plano: Plano) => larguraDoRosto(plano) > 0.46;

// A porta de baixo: apoiada no piso, centrada. A largura se ajusta para a cabeça caber.
export const portaDeBaixo = (plano: Plano): Caixa => {
  const c = cabecaNaGravacao(plano);
  const h = PORTA_BAIXO.altura;
  const w = Math.round(Math.min(PORTA_BAIXO.larguraMax, Math.max(PORTA_BAIXO.larguraMin, (h * W) / c.precisa)));
  const mostra = (h * W) / w;
  const sobra = Math.max(0, mostra - c.precisa);
  const ancora = Math.min(0.56, Math.max(0.3, (c.ry - c.topo + sobra / 2) / mostra));
  return {
    x: Math.round((W - w) / 2),
    y: PISO_Y - h,
    w,
    h,
    raio: 0,
    zoom: Math.max(1, plano.pessoa?.zoom ?? 1),
    ancoraY: plano.pessoa?.ancoraY ?? ancora,
  };
};

// Onde termina a parede (o conteúdo dos blocos de parede para aqui, acima da porta de baixo)
export const fimDaParede = (plano: Plano) => portaDeBaixo(plano).y - 30;

// Quadro cheio: o menor zoom que deixa o rosto na linha do centro sem borda vazia (até 1,25)
export const caixaCheia = (plano: Plano, zoomExtra = 1): Caixa => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const fx = plano.rosto.x;
  const zoom = Math.min(1.25, Math.max(1, 0.5 / Math.max(0.01, Math.min(fx, 1 - fx))));
  return { x: 0, y: 0, w: W, h: videoAltura, raio: 0, zoom: zoom * zoomExtra, ancoraY: (plano.rosto.y * H) / videoAltura };
};

// A caixa da pessoa (já com o batente, que é desenhado por dentro dela) em cada arranjo
export const caixaDo = (arranjo: Arranjo, plano: Plano): Caixa => {
  const z = plano.pessoa?.zoom ?? 1;
  const a = plano.pessoa?.ancoraY;
  // a porta lateral vai do quadro de chaves até o piso, como uma porta de verdade
  const altura = PISO_Y - AREA.topo;
  switch (arranjo) {
    case "esquerda":
      return { x: MARGEM_HALL, y: AREA.topo, w: PORTA_LATERAL, h: altura, raio: 0, zoom: Math.max(1, 1.42 * z), ancoraY: a ?? 0.24 };
    case "direita":
      return { x: W - MARGEM_HALL - PORTA_LATERAL, y: AREA.topo, w: PORTA_LATERAL, h: altura, raio: 0, zoom: Math.max(1, 1.42 * z), ancoraY: a ?? 0.24 };
    case "faixa": {
      // gravação de perto: a porta fica mais estreita para a cabeça caber (gravação de longe: a larga)
      const c = cabecaNaGravacao(plano);
      const larga = c.precisa <= 820;
      const w = larga ? PORTA_FAIXA_LARGURA : Math.round(Math.max(600, (PORTA_FAIXA * W) / c.precisa));
      const ancora = larga ? 0.42 : Math.min(0.56, Math.max(0.3, (c.ry - c.topo) / ((PORTA_FAIXA * W) / w)));
      return { x: (W - w) / 2, y: AREA.topo, w, h: PORTA_FAIXA, raio: 0, zoom: Math.max(1, (larga ? 1.06 : 1) * z), ancoraY: a ?? ancora };
    }
    case "embaixo":
      return portaDeBaixo(plano);
    case "deslocado":
      return { x: 412, y: 0, w: W - 412, h: H, raio: 0, zoom: 1, ancoraY: plano.rosto.y };
    default:
      return caixaCheia(plano);
  }
};

// O arranjo que vale num instante (trecho sem momento = quadro cheio)
export const arranjoNoTempo = (t: number, plano: Plano, mapa: Map<Momento, Arranjo>): Arranjo => {
  let atual: Arranjo = "cheio";
  for (const m of plano.momentos) if (t >= m.de - ANTES && t < m.ate - ANTES) atual = mapa.get(m) ?? "cheio";
  return atual;
};

// Estados da caixa da pessoa ao longo do vídeo. Cada fronteira em que o arranjo muda vira uma troca.
// Corte no meio de um trecho em quadro cheio (longe de uma troca) ganha uma troca seca de
// enquadramento (1 ↔ 1,07) para disfarçar o pulo.
export const estadosDaPessoa = (plano: Plano, mapa: Map<Momento, Arranjo>): EstadoDaCaixa[] => {
  const estados: EstadoDaCaixa[] = [{ de: 0, caixa: caixaCheia(plano), dur: 0.001 }];
  const trocas: number[] = [];
  let anterior: Arranjo = "cheio";
  // fronteiras: começo e fim de cada momento
  const fronteiras = [...new Set(plano.momentos.flatMap((m) => [m.de, m.ate]))].sort((a, b) => a - b);
  for (const f of fronteiras) {
    if (f <= 0.05 || f >= plano.duracao - 0.1) continue;
    const arr = arranjoNoTempo(f, plano, mapa);
    if (arr === anterior) continue;
    estados.push({ de: Math.max(0, f - ANTES), caixa: caixaDo(arr, plano), dur: TROCA });
    trocas.push(f - ANTES);
    anterior = arr;
  }
  // primeiro momento que já começa num arranjo diferente do cheio
  const primeiro = plano.momentos[0];
  if (primeiro && primeiro.de <= 0.05 && (mapa.get(primeiro) ?? "cheio") !== "cheio") {
    estados[0] = { de: 0, caixa: caixaDo(mapa.get(primeiro) as Arranjo, plano), dur: 0.001 };
  }
  for (const c of plano.cortesEm ?? []) {
    if (trocas.some((tr) => Math.abs(c - tr) < 0.8)) continue;
    if (arranjoNoTempo(c, plano, mapa) !== "cheio") continue;
    const antes = [...estados].sort((a, b) => a.de - b.de).filter((e) => e.de <= c).pop();
    const base = caixaCheia(plano);
    const aproximado = (antes?.caixa.zoom ?? 1) > (base.zoom ?? 1) + 0.001;
    estados.push({ de: c, caixa: caixaCheia(plano, aproximado ? 1 : 1.07), dur: 0.001 });
  }
  return estados.sort((a, b) => a.de - b.de);
};

// Quanto o quadro de chaves está na tela (0 = fora, 1 = no lugar), e se está entrando ou saindo
export const presencaDoQuadro = (t: number, plano: Plano) => {
  const itens = plano.momentos.filter(ehItem);
  let v = 0;
  for (const m of itens) {
    // blocos contínuos de itens: o quadro só sai quando o próximo momento não é item
    const inicio = m.de - ANTES;
    const proximo = plano.momentos.find((o) => o.de >= m.ate - 0.01 && o !== m);
    const continua = proximo && ehItem(proximo) && proximo.de - m.ate < 0.3;
    const fim = continua ? m.ate + 1 : m.ate - ANTES;
    const anterior = [...plano.momentos].reverse().find((o) => o.ate <= m.de + 0.01 && o !== m);
    const veioDeItem = anterior && ehItem(anterior) && m.de - anterior.ate < 0.3;
    const entrada = veioDeItem ? 1 : Math.min(1, Math.max(0, (t - inicio) / TROCA));
    const saida = continua ? 0 : Math.min(1, Math.max(0, (t - fim) / (TROCA * 0.8)));
    if (t >= inicio - 0.01 && t <= fim + TROCA) v = Math.max(v, Math.max(0, Math.min(entrada, 1 - saida)));
  }
  return v;
};

// Espessura do batente (a moldura de porta em volta da pessoa) para uma caixa
export const espessuraDoBatente = (c: Caixa) => {
  const p = Math.min(1, Math.max(0, (c.w - PORTA_LATERAL) / (W - PORTA_LATERAL)));
  return 22 + 12 * p;
};

// ---------- como os painéis entram e saem ----------
// Painel que sai e painel que entra na mesma fronteira andam juntos, na mesma direção, com a mesma
// curva e a mesma duração da troca da pessoa: é um movimento de câmera pelo hall. O que entra vem
// inteiro de fora da tela, logo atrás do que sai — os dois nunca se sobrepõem e nenhum esmaece.
export type Movimento = "esquerda" | "direita";
type Lugar = "esquerda" | "direita" | "cheia";

// onde fica o painel de um momento (não onde fica a pessoa)
const lugarDoPainel = (m: Momento, mapa: Map<Momento, Arranjo>): Lugar | null => {
  if (m.tipo === "vezes") return mapa.get(m) === "embaixo" ? "cheia" : "esquerda";
  if (ehParede(m)) return "cheia";
  if (!ehItem(m)) return null;
  const arr = mapa.get(m);
  if (arr === "faixa" || arr === "embaixo") return "cheia";
  return arr === "esquerda" ? "direita" : "esquerda";
};

const movimentoDaFronteira = (sai: Lugar, entra: Lugar): Movimento => {
  if (entra === "esquerda") return "direita";
  if (entra === "direita") return "esquerda";
  return sai === "direita" ? "direita" : "esquerda";
};

export const deslizes = (plano: Plano, mapa: Map<Momento, Arranjo>) => {
  const mapaMov = new Map<Momento, { entra: Movimento; sai: Movimento }>();
  const ms = plano.momentos;
  ms.forEach((m, i) => {
    const lugar = lugarDoPainel(m, mapa);
    if (!lugar) return;
    const antes = ms[i - 1];
    const depois = ms[i + 1];
    const lugarAntes = antes && m.de - antes.ate < 0.3 ? lugarDoPainel(antes, mapa) : null;
    const lugarDepois = depois && depois.de - m.ate < 0.3 ? lugarDoPainel(depois, mapa) : null;
    // sem vizinho com painel: entra e sai pela própria borda (o cheio, pela direita)
    const entra = lugarAntes ? movimentoDaFronteira(lugarAntes, lugar) : lugar === "esquerda" ? "direita" : "esquerda";
    const sai = lugarDepois ? movimentoDaFronteira(lugar, lugarDepois) : lugar === "esquerda" ? "esquerda" : "direita";
    mapaMov.set(m, { entra, sai });
  });
  return mapaMov;
};

// deslocamento horizontal de um retângulo para ficar inteiro fora da tela, de cada lado
export const foraDaTela = (r: { x: number; w: number }) => ({ esquerda: -(r.x + r.w + 40), direita: W - r.x + 40 });
