// A gramática do Chave no quadro deitado (16:9, 1920×1080), em tempo: onde a pessoa está (a
// "porta") em cada momento, quando o quadro de chaves aparece e quanto o batente engrossa. Tudo sai
// dos momentos do plano.
//
// A regra é a da aula 9 do curso (editar uma aula horizontal):
// - TELA CHEIA é a base: a tela é o vão da porta, a pessoa como foi gravada, com a arte no peito
//   (abertura, frase, destaque, definição, pergunta, fechamento) ou com a legenda;
// - quando o bloco pede apoio visual (item, lista, passos, número, comparação, gráfico, "N×"), a
//   pessoa vai para a MOLDURA: uma porta do lado direito, apoiada no piso, com o rosto no meio dela e
//   acompanhado suavemente (o rastro do rosto); o objeto ocupa o QUADRO, a parede do lado esquerdo;
// - terminada a ideia, a pessoa volta à tela cheia.
import type { Caixa, EstadoDaCaixa, Rosto } from "./motor/caixa";
import type { Item, Momento, Plano } from "./plano";
import { AREA, BASE, H, LARGURA_PEITO, MARGEM, PAREDE, PEITO_MINIMO, PISO_Y, PORTA, QUADRO, W, zona as zonaPadrao } from "./tema";

// duração da troca de lugar da pessoa
export const TROCA = 0.52;
// a troca começa um pouco antes da fronteira: o corte que costuma ficar nela cai no meio do movimento
export const ANTES = 0.14;

// cheio: a tela é o vão da porta (arte no peito) · moldura: a pessoa na porta da direita, o objeto
// na parede da esquerda
export type Arranjo = "cheio" | "moldura";

// Blocos que vão para a parede (a pessoa na porta da direita). No quadro deitado o "N×" também vai
// para a parede: a coluna alta do vertical não cabe na altura do quadro.
export const TIPOS_DE_PAREDE = ["topicos", "passos", "numero", "comparacao", "grafico", "vezes"] as const;
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
// O arranjo de cada momento: item e blocos de parede põem a pessoa na moldura da direita (o `lado`
// do item, que no vertical escolhia a porta estreita, não muda nada aqui: a moldura é sempre à
// direita); o resto é tela cheia, com a arte no peito.
export const arranjos = (plano: Plano): Map<Momento, Arranjo> => {
  const mapa = new Map<Momento, Arranjo>();
  for (const m of plano.momentos) mapa.set(m, ehItem(m) || ehParede(m) ? "moldura" : "cheio");
  return mapa;
};

// ---------- o tamanho da cabeça na gravação ----------
// Onde ficam o centro do rosto e o queixo no quadro deitado (px, na tela cheia como foi gravado).
export const cabecaNaGravacao = (plano: Plano) => {
  const rosto = plano.rosto as Rosto;
  const ry = rosto.y * H;
  const largura = rosto.rastro?.largura;
  // o queixo: pela largura do rosto (o rastreio mede) ou pela zona (no 16:9, ~60 px abaixo do queixo)
  const queixo = largura ? ry + 0.66 * largura * W : (plano.zona?.topo ?? zonaPadrao.topo) - 60;
  const d = Math.max(50, queixo - ry);
  const cabelo = ry - 1.3 * d;
  const topo = Math.max(0, cabelo - 0.25 * d);
  const base = queixo + 0.55 * d;
  return { ry, queixo, d, topo, precisa: base - topo };
};

// Largura do rosto na gravação (fração da largura do quadro): o rastreio mede; sem ele, estima pelo
// queixo. No 16:9 o rosto costuma ocupar ~13% da largura.
export const larguraDoRosto = (plano: Plano) => {
  const medida = (plano.rosto as Rosto).rastro?.largura;
  if (medida && medida > 0.03) return medida;
  const estimada = cabecaNaGravacao(plano).d / 0.66 / W;
  return Math.min(0.45, Math.max(0.06, Number.isFinite(estimada) ? estimada : 0.13));
};

// A MOLDURA: a porta da direita, do alto até o piso. O vídeo aproxima até o rosto ocupar ~40% da
// largura da porta (gravação de longe aproxima mais; de perto, nada) e a cabeça fica inteira, com
// folga em cima. O motor segue o rosto dentro dela (ajuste suave, sem saltos).
export const caixaDaPorta = (plano: Plano): Caixa => {
  const h = PISO_Y - PORTA.y;
  const w = PORTA.w;
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const cobre = Math.max(w / W, h / videoAltura);
  const rostoPx = larguraDoRosto(plano) * W;
  const zoom = Math.min(1.8, Math.max(1, (0.4 * w) / (rostoPx * cobre))) * Math.max(0.8, plano.pessoa?.zoom ?? 1);
  const escala = cobre * Math.max(1, zoom);
  // do centro do rosto ao alto do cabelo, na tela (~1,6 vez a distância ao queixo), mais o batente e a folga
  const alturaDaCabeca = 1.6 * 0.66 * rostoPx * escala;
  const ancora = Math.min(0.45, Math.max(0.24, (34 + 26 + alturaDaCabeca) / h));
  return { x: PORTA.x, y: PORTA.y, w, h, raio: 0, zoom: Math.max(1, zoom), ancoraY: plano.pessoa?.ancoraY ?? ancora, ancoraX: 0.5 };
};

// Onde termina a parede (o conteúdo dos blocos de parede para aqui, acima dos controles do player)
export const fimDaParede = (_plano: Plano) => BASE;

// Tela cheia: a pessoa como foi gravada (zoom 1). `zoomExtra` aproxima em volta do rosto (corte
// disfarçado no meio de um trecho).
export const caixaCheia = (plano: Plano, zoomExtra = 1): Caixa => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  return { x: 0, y: 0, w: W, h: H, raio: 0, zoom: zoomExtra, ancoraX: plano.rosto.x, ancoraY: (plano.rosto.y * H) / videoAltura };
};

// A caixa da pessoa (já com o batente, que é desenhado por dentro dela) em cada arranjo
export const caixaDo = (arranjo: Arranjo, plano: Plano): Caixa => (arranjo === "moldura" ? caixaDaPorta(plano) : caixaCheia(plano));

// O arranjo que vale num instante (trecho sem momento = tela cheia)
export const arranjoNoTempo = (t: number, plano: Plano, mapa: Map<Momento, Arranjo>): Arranjo => {
  let atual: Arranjo = "cheio";
  for (const m of plano.momentos) if (t >= m.de - ANTES && t < m.ate - ANTES) atual = mapa.get(m) ?? "cheio";
  return atual;
};

// Estados da caixa da pessoa ao longo do vídeo. Cada fronteira em que o arranjo muda vira uma troca.
// Corte no meio de um trecho em tela cheia (longe de uma troca) ganha uma troca seca de
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
  // primeiro momento que já começa na moldura
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

// Espessura do batente (a moldura de porta em volta da pessoa) para uma caixa: 22 px na porta da
// direita, 34 px na tela cheia
export const espessuraDoBatente = (c: Caixa) => {
  const p = Math.min(1, Math.max(0, (c.w - PORTA.w) / (W - PORTA.w)));
  return 22 + 12 * p;
};

// A plaquinha com o número da porta no alto do batente: aparece quando a porta fica estreita
export const placaDoBatente = (c: Caixa) => Math.min(1, Math.max(0, (W - 220 - c.w) / 300));

// ---------- a arte do peito ----------
// Na tela cheia, a arte do peito fica logo abaixo do queixo, centrada no rosto, numa fileira larga.
// Gravação com o rosto baixo (sobra menos de `PEITO_MINIMO` px embaixo do queixo): a arte vai para o
// lado livre do rosto (o mais largo), do lado da pessoa, sem nunca cobrir o rosto.
export type Peito = { topo: number; centro: number; largura: number; lado: boolean };
export const lugarDoPeito = (plano: Plano): Peito => {
  const zonaTopo = plano.zona?.topo ?? zonaPadrao.topo;
  const c = cabecaNaGravacao(plano);
  const topo = Math.max(zonaTopo, c.queixo + 24);
  const rostoX = plano.rosto.x * W;
  const larguraUtil = W - 2 * MARGEM;
  if (BASE - (topo + 16) >= PEITO_MINIMO) {
    const largura = Math.min(LARGURA_PEITO, larguraUtil);
    return { topo, centro: Math.min(W - MARGEM - largura / 2, Math.max(MARGEM + largura / 2, rostoX)), largura, lado: false };
  }
  const meioRosto = larguraDoRosto(plano) * W * 0.8 + 40;
  const esquerda = rostoX - meioRosto - MARGEM;
  const direita = W - MARGEM - (rostoX + meioRosto);
  const largura = Math.max(560, Math.min(LARGURA_PEITO, Math.max(esquerda, direita)));
  const centro = esquerda >= direita ? MARGEM + largura / 2 : W - MARGEM - largura / 2;
  // no lado livre a arte tem a altura do ombro para baixo: ~520 px até a base
  return { topo: Math.max(c.ry - 40, BASE - 16 - 540), centro, largura, lado: true };
};

// ---------- como os painéis entram e saem ----------
// Painel que sai e painel que entra na mesma fronteira andam juntos, na mesma direção, com a mesma
// curva e a mesma duração da troca da pessoa: é um movimento de câmera pelo hall. O que entra vem
// inteiro de fora da tela, logo atrás do que sai: os dois nunca se sobrepõem e nenhum esmaece.
// No quadro deitado todos os painéis ficam na parede da esquerda: entram pela esquerda (a pessoa vai
// para a porta da direita) e saem pela esquerda (a pessoa volta à tela cheia); entre dois painéis
// seguidos, o que sai anda para a direita, por trás da porta, e o novo chega pela esquerda.
export type Movimento = "esquerda" | "direita";
type Lugar = "esquerda" | "direita" | "cheia";

// onde fica o painel de um momento (não onde fica a pessoa)
const lugarDoPainel = (m: Momento): Lugar | null => (ehItem(m) || ehParede(m) ? "esquerda" : null);

const movimentoDaFronteira = (sai: Lugar, entra: Lugar): Movimento => {
  if (entra === "esquerda") return "direita";
  if (entra === "direita") return "esquerda";
  return sai === "direita" ? "direita" : "esquerda";
};

export const deslizes = (plano: Plano, _mapa: Map<Momento, Arranjo>) => {
  const mapaMov = new Map<Momento, { entra: Movimento; sai: Movimento }>();
  const ms = plano.momentos;
  ms.forEach((m, i) => {
    const lugar = lugarDoPainel(m);
    if (!lugar) return;
    const antes = ms[i - 1];
    const depois = ms[i + 1];
    const lugarAntes = antes && m.de - antes.ate < 0.3 ? lugarDoPainel(antes) : null;
    const lugarDepois = depois && depois.de - m.ate < 0.3 ? lugarDoPainel(depois) : null;
    // sem vizinho com painel: entra e sai pela própria borda (a da esquerda)
    const entra = lugarAntes ? movimentoDaFronteira(lugarAntes, lugar) : lugar === "esquerda" ? "direita" : "esquerda";
    const sai = lugarDepois ? movimentoDaFronteira(lugar, lugarDepois) : lugar === "esquerda" ? "esquerda" : "direita";
    mapaMov.set(m, { entra, sai });
  });
  return mapaMov;
};

// deslocamento horizontal de um retângulo para ficar inteiro fora da tela, de cada lado
export const foraDaTela = (r: { x: number; w: number }) => ({ esquerda: -(r.x + r.w + 40), direita: W - r.x + 40 });

// a área dos painéis dos itens (embaixo do quadro de chaves) e a da parede (blocos de parede)
export const retanguloDoPainel = () => ({ x: PAREDE.x, y: AREA.topo, w: PAREDE.w, h: AREA.base - AREA.topo });
export const areaDaParede = () => ({ x: PAREDE.x, y: PAREDE.topo, w: PAREDE.w, h: BASE - PAREDE.topo });
// o quadro de chaves ocupa a largura da parede, acima dos painéis
export const larguraDoQuadroDeChaves = () => ({ x: PAREDE.x, w: PAREDE.w, fundo: QUADRO.fundo });
