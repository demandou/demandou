// A gramática do Ignição no quadro deitado (16:9, 1920×1080: o vídeo completo do YouTube), em tempo:
// cada momento é um MODO do painel (como os modos de exibição de um painel digital). Na troca de
// modo todas as peças deslizam juntas para o novo lugar: a pessoa, os dois mostradores, a tela
// central e a fileira de luzes. Tudo sai dos momentos do plano.
//
// A composição segue a regra da aula 9 do curso (editar uma aula horizontal):
// - TELA CHEIA é a base: antes da chave e fora dos momentos, a pessoa ocupa o quadro inteiro, como
//   foi gravada, e a legenda fica na área segura de baixo.
// - Num momento, o painel liga: a pessoa vai para uma MOLDURA do lado DIREITO (a tela da câmera do
//   motorista, o retrovisor de dentro ou o retrovisor da direita, conforme o modo), com o rosto
//   centralizado nela e acompanhado de leve pelo rastro; o painel ocupa o QUADRO do lado esquerdo.
//
//   [ QUADRO: o painel (tela central, mostradores, luzes, volante), x 90–1050 | MOLDURA: x ~1160–1850 ]
//
// O painel é desenhado na CAMADA (tema.ts), nas medidas do painel vertical: cada modo desloca a
// camada inteira para o quadro da esquerda (DESLOCAMENTO), e o conteúdo de cada momento vai junto.
// Só o modo do retrovisor da direita (parada, definição) mudou de arrumação: o painel da condição,
// que no vertical fica ao lado do retrovisor, virou uma faixa larga em cima da tela central (luzes à
// esquerda, texto à direita), e os mostradores ficaram compactos para o painel caber na altura.
import { type Caixa, type Rosto } from "./motor/caixa";
import type { CorDaLuz, Lampada, Momento, Plano } from "./plano";
import { H, W } from "./tema";

// cheio = só a pessoa, em tela cheia (antes da chave e fora dos momentos); central = pessoa na tela
// da câmera, barra de mensagens e mostradores grandes no quadro; espelho = pessoa no retrovisor de
// dentro, luzes no alto da tela grande; lateral = pessoa no retrovisor da direita, a faixa da
// condição em cima da tela; rota = pessoa no retrovisor, tela grande inteira (mapa, listas, números,
// gráficos); comparar = pessoa no retrovisor, os dois mostradores grandes embaixo de cada lado
export type Modo = "cheio" | "central" | "espelho" | "lateral" | "rota" | "comparar";

export type Circulo = { cx: number; cy: number; r: number };
export type Retangulo = { x: number; y: number; w: number; h: number };
export type Ponto = { x: number; y: number };
type Fileira = { x1: number; x2: number; y: number; tam: number };

// A geometria de cada modo, já no quadro 1920×1080 (px).
export type Geometria = {
  // a caixa da pessoa
  pessoa: Caixa;
  // velocímetro (esquerda) e conta-giros (direita)
  vel: Circulo;
  giro: Circulo;
  // a tela central (vidro escuro onde entram os textos e desenhos de cada momento)
  tela: Retangulo;
  // a fileira de luzes-espia: centro da primeira e da última (com 3 luzes), e o tamanho do ícone
  luzes: Fileira;
};

// ---------- a camada do painel (px LÓGICOS: as medidas do painel vertical) ----------

// mostradores grandes embaixo (modo clássico e comparação)
const VEL_BAIXO: Circulo = { cx: 262, cy: 1352, r: 196 };
const GIRO_BAIXO: Circulo = { cx: 818, cy: 1352, r: 196 };
// mostradores compactos nos cantos (modo tela grande)
const VEL_CANTO: Circulo = { cx: 186, cy: 1418, r: 128 };
const GIRO_CANTO: Circulo = { cx: 894, cy: 1418, r: 128 };
// mostradores do modo do retrovisor da direita: compactos, logo abaixo da tela
const VEL_LADO: Circulo = { cx: 230, cy: 1314, r: 140 };
const GIRO_LADO: Circulo = { cx: 850, cy: 1314, r: 140 };

// a barra de mensagens (modo clássico) e a tela grande
export const BARRA_LOGICA: Retangulo = { x: 60, y: 966, w: 960, h: 166 };
const TELA_GRANDE: Retangulo = { x: 60, y: 792, w: 960, h: 480 };

// Onde a camada do painel cai no quadro em cada modo (px): o conteúdo do modo fica centrado na
// altura do quadro, com o alto do volante aparecendo embaixo dos mostradores.
const DX = 30;
export const DESLOCAMENTO: Record<Modo, Ponto> = {
  // na tela cheia o painel espera atrás da pessoa, no lugar do modo clássico
  cheio: { x: DX, y: -764 },
  central: { x: DX, y: -764 },
  espelho: { x: DX, y: -676 },
  rota: { x: DX, y: -676 },
  comparar: { x: DX, y: -676 },
  lateral: { x: DX, y: -458 },
};
// o centro do volante na horizontal (px do quadro): o meio do painel
export const VOLANTE_X = DX + 540;

// ---------- as molduras da pessoa (px do QUADRO, do lado direito, centradas na altura) ----------

// tela da câmera do motorista (modo clássico)
export const CENTRAL: Caixa = { x: 1160, y: 110, w: 690, h: 860, raio: 30, ancoraY: 0.42, ancoraX: 0.5 };
// retrovisor de dentro (a haste sobe até o teto)
export const ESPELHO: Caixa = { x: 1176, y: 190, w: 660, h: 700, raio: 70, ancoraY: 0.45, ancoraX: 0.5 };
// retrovisor da direita (o braço sai pela esquerda, na direção do painel)
export const LATERAL: Caixa = { x: 1206, y: 140, w: 580, h: 800, raio: 48, ancoraY: 0.42, ancoraX: 0.5 };
// quanto da largura da moldura o rosto ocupa (cabeça e ombros)
const ROSTO_NA_MOLDURA = { central: 0.38, espelho: 0.4, lateral: 0.42 };

// a largura do rosto (fração da largura do quadro): a do rastro do cortar.mjs ou a de uma gravação
// deitada comum (pessoa a meio corpo, rosto com ~13% da largura)
export const ROSTO_PADRAO = 0.13;
export const larguraDoRosto = (plano: Plano) => {
  const l = (plano.rosto as Rosto).rastro?.largura;
  return l && l > 0.03 ? l : ROSTO_PADRAO;
};
export const alturaDoVideo = (plano: Plano) => Math.min(H, plano.videoAltura ?? H);

// O enquadramento na moldura: o rosto ocupa `fracao` da largura dela, seja a pessoa perto ou longe
// da câmera (zoom 1 = o menor que cobre a moldura; no máximo 2,6). Rosto grande (gravação perto da
// câmera) sobe na moldura para o queixo ficar acima da faixa do teste de lâmpadas (168 px de baixo).
export const enquadrarMoldura = (c: Caixa, plano: Plano, fracao: number): Caixa => {
  const L = larguraDoRosto(plano);
  const vh = alturaDoVideo(plano);
  const cobre = Math.max(c.w / W, c.h / vh);
  const zoom = Math.min(2.6, Math.max(1, (fracao * c.w) / (L * W * cobre)));
  const rosto = L * W * cobre * zoom;
  // centro do rosto até o queixo ≈ 0,62 da largura do rosto
  const ancora = Math.min(c.ancoraY ?? 0.42, (c.h - 182 - 0.62 * rosto) / c.h);
  return { ...c, zoom, ancoraY: Math.max(0.3, ancora) };
};

// a tela cheia: o vídeo inteiro, como foi gravado (âncoras = o rosto, então o zoom do corte parte dele)
export const cheioDe = (plano: Plano): Caixa => {
  const vh = alturaDoVideo(plano);
  return { x: 0, y: 0, w: W, h: vh, raio: 0, zoom: 1, ancoraY: (plano.rosto.y * H) / vh, ancoraX: plano.rosto.x };
};

const mover = (d: Ponto) => ({
  c: (c: Circulo): Circulo => ({ cx: c.cx + d.x, cy: c.cy + d.y, r: c.r }),
  r: (r: Retangulo): Retangulo => ({ x: r.x + d.x, y: r.y + d.y, w: r.w, h: r.h }),
  l: (l: Fileira): Fileira => ({ x1: l.x1 + d.x, x2: l.x2 + d.x, y: l.y + d.y, tam: l.tam }),
});

export const geometriaDe = (modo: Modo, plano: Plano): Geometria => {
  const m = mover(DESLOCAMENTO[modo]);
  const g = (pessoa: Caixa, vel: Circulo, giro: Circulo, tela: Retangulo, luzes: Fileira): Geometria => ({
    pessoa,
    vel: m.c(vel),
    giro: m.c(giro),
    tela: m.r(tela),
    luzes: m.l(luzes),
  });
  switch (modo) {
    case "cheio":
      return g(cheioDe(plano), VEL_BAIXO, GIRO_BAIXO, BARRA_LOGICA, { x1: 448, x2: 632, y: 1496, tam: 72 });
    case "central":
      // a barra de mensagens em cima dos mostradores grandes; as luzes entre eles
      return g(enquadrarMoldura(CENTRAL, plano, ROSTO_NA_MOLDURA.central), VEL_BAIXO, GIRO_BAIXO, BARRA_LOGICA, { x1: 448, x2: 632, y: 1496, tam: 72 });
    case "espelho":
      return g(enquadrarMoldura(ESPELHO, plano, ROSTO_NA_MOLDURA.espelho), VEL_CANTO, GIRO_CANTO, TELA_GRANDE, { x1: 230, x2: 850, y: 862, tam: 112 });
    case "lateral":
      // as luzes no lado esquerdo da faixa da condição (CONDICAO, em TelaParada)
      return g(enquadrarMoldura(LATERAL, plano, ROSTO_NA_MOLDURA.lateral), VEL_LADO, GIRO_LADO, { x: 60, y: 800, w: 960, h: 352 }, { x1: 145, x2: 375, y: 623, tam: 100 });
    case "rota":
      return g(enquadrarMoldura(ESPELHO, plano, ROSTO_NA_MOLDURA.espelho), VEL_CANTO, GIRO_CANTO, TELA_GRANDE, { x1: 452, x2: 628, y: 1480, tam: 76 });
    case "comparar":
      // a tela fica mais baixa: embaixo dela, um mostrador para cada lado
      return g(enquadrarMoldura(ESPELHO, plano, ROSTO_NA_MOLDURA.espelho), VEL_BAIXO, GIRO_BAIXO, { x: 60, y: 792, w: 960, h: 330 }, { x1: 448, x2: 632, y: 1496, tam: 72 });
  }
};

export const modoDo = (m: Momento): Modo => {
  switch (m.tipo) {
    case "ignicao":
    case "abertura":
    case "frase":
    case "cta":
      return "central";
    case "pergunta":
      return m.opcoes && m.opcoes.length >= 2 ? "rota" : "central";
    case "luzes":
    case "aviso":
    case "destaque":
      return "espelho";
    case "parada":
    case "definicao":
      return "lateral";
    case "rota":
    case "topicos":
    case "passos":
    case "numero":
    case "grafico":
      return "rota";
    case "comparacao":
      return "comparar";
  }
};

// onde a camada do painel cai no quadro durante este momento (o conteúdo dele vai junto)
export const deslocamentoDo = (m: Momento): Ponto => DESLOCAMENTO[modoDo(m)];

// duração da troca de modo; ela começa um pouco antes do momento, para o corte que costuma ficar
// na fronteira cair no meio do movimento
export const TROCA = 0.56;
export const ANTES = 0.3;

const ordenados = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

// O vídeo sempre abre em tela cheia e a chave gira logo na primeira palavra: os ponteiros varrem,
// as luzes fazem o teste e o painel assume. A `ignicao` diz o instante (ignicaoEm); com qualquer
// outro bloco no começo, é a primeira palavra dita.
export const ignicaoDe = (plano: Plano) => {
  const m = ordenados(plano)[0];
  if (m?.tipo === "ignicao") return m.ignicaoEm ?? m.de + 0.3;
  let comeco = 0;
  if (m && m.de < 1.5) {
    comeco = m.de;
    if ((m.tipo === "abertura" || m.tipo === "frase" || m.tipo === "pergunta" || m.tipo === "cta") && typeof m.em === "number") comeco = m.em;
  }
  const w = plano.palavras.find((p) => p.em >= comeco - 0.05);
  return Math.max(0.25, Math.min((w?.em ?? comeco) + 0.12, comeco + 1.2));
};

// o primeiro momento já é o modo da chave? (começa logo no início do vídeo)
export const primeiroNaChave = (plano: Plano) => {
  const m = ordenados(plano)[0];
  return !!m && m.de <= ignicaoDe(plano) + 0.6;
};

export type Troca = { de: number; modo: Modo };

// Sequência de modos ao longo do vídeo: tela cheia até a chave; na chave o painel liga (no modo do
// primeiro momento, ou no clássico); depois o modo de cada momento. Fora dos momentos a pessoa
// volta à tela cheia (a base da aula 9); um buraco curto (até 0,8 s) entre dois momentos não volta.
// Sem momento logo na chave, o painel mostra a partida (varredura e teste de lâmpadas) e devolve a
// tela cheia logo depois (VOLTA_DA_PARTIDA).
export const VOLTA_DA_PARTIDA = 2.4;
export const trocasDe = (plano: Plano): Troca[] => {
  const ms = ordenados(plano);
  const ig = ignicaoDe(plano);
  const lista: Troca[] = [{ de: -10, modo: "cheio" }];
  const naChave = primeiroNaChave(plano);
  const ate = (de: number, modo: Modo) => {
    // nunca antes da troca anterior terminar de começar
    const antes = lista[lista.length - 1];
    lista.push({ de: Math.max(de, antes.de + 0.6), modo });
  };
  if (!naChave) {
    lista.push({ de: ig, modo: "central" });
    const volta = ig + VOLTA_DA_PARTIDA;
    if (!ms[0] || ms[0].de - ANTES - volta > 0.8) ate(volta, "cheio");
  }
  ms.forEach((m, i) => {
    const modo = modoDo(m);
    if (i === 0 && naChave) lista.push({ de: ig, modo });
    else ate(Math.max(ig + 0.75, m.de - ANTES), modo);
    const proximo = ms[i + 1];
    // buraco entre momentos (mais de 0,8 s): volta à tela cheia
    const fim = Math.min(m.ate, plano.duracao);
    if (fim < plano.duracao - 0.3 && (!proximo || proximo.de - fim > 0.8)) ate(fim - ANTES, "cheio");
  });
  // tira trocas para o mesmo modo
  return lista.filter((x, i) => i === 0 || x.modo !== lista[i - 1].modo);
};

// quando começa a troca que leva a este momento (a chave, para o primeiro)
export const trocaDoMomento = (m: Momento, plano: Plano) => {
  if (ordenados(plano)[0] === m && primeiroNaChave(plano)) return ignicaoDe(plano);
  return Math.max(ignicaoDe(plano) + 0.75, m.de - ANTES);
};

const suave = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

// Onde estamos: o modo anterior, o atual e o progresso da troca (0 → 1)
export const estadoDoModo = (t: number, trocas: Troca[]) => {
  let i = 0;
  for (let k = 0; k < trocas.length; k++) if (trocas[k].de <= t) i = k;
  const atual = trocas[i];
  const anterior = trocas[Math.max(0, i - 1)];
  const dur = anterior.modo === "cheio" ? 0.7 : TROCA;
  const p = i === 0 ? 1 : suave(Math.min(1, Math.max(0, (t - atual.de) / dur)));
  return { anterior: anterior.modo, atual: atual.modo, p, desde: atual.de };
};

const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const mixCirculo = (a: Circulo, b: Circulo, p: number): Circulo => ({ cx: mix(a.cx, b.cx, p), cy: mix(a.cy, b.cy, p), r: mix(a.r, b.r, p) });

export const geometriaNoTempo = (t: number, trocas: Troca[], plano: Plano) => {
  const { anterior, atual, p } = estadoDoModo(t, trocas);
  const a = geometriaDe(anterior, plano);
  const b = geometriaDe(atual, plano);
  const pa = a.pessoa;
  const pb = b.pessoa;
  const g: Geometria = {
    pessoa: {
      x: mix(pa.x, pb.x, p),
      y: mix(pa.y, pb.y, p),
      w: mix(pa.w, pb.w, p),
      h: mix(pa.h, pb.h, p),
      raio: mix(pa.raio ?? 0, pb.raio ?? 0, p),
      zoom: mix(pa.zoom ?? 1, pb.zoom ?? 1, p),
      ancoraY: mix(pa.ancoraY ?? 0.3, pb.ancoraY ?? 0.3, p),
      ancoraX: mix(pa.ancoraX ?? 0.5, pb.ancoraX ?? 0.5, p),
    },
    vel: mixCirculo(a.vel, b.vel, p),
    giro: mixCirculo(a.giro, b.giro, p),
    tela: { x: mix(a.tela.x, b.tela.x, p), y: mix(a.tela.y, b.tela.y, p), w: mix(a.tela.w, b.tela.w, p), h: mix(a.tela.h, b.tela.h, p) },
    luzes: { x1: mix(a.luzes.x1, b.luzes.x1, p), x2: mix(a.luzes.x2, b.luzes.x2, p), y: mix(a.luzes.y, b.luzes.y, p), tam: mix(a.luzes.tam, b.luzes.tam, p) },
  };
  // peso de cada modo (para as molduras e os mostradores neutros da comparação)
  const peso = (m: Modo) => (anterior === m ? 1 - p : 0) + (atual === m ? p : 0);
  return { g, peso, anterior, atual, p };
};

// Corte no meio de um modo (longe de uma troca) ganha uma troca seca de enquadramento (1 ↔ 1,05)
// dentro da caixa da pessoa, para disfarçar o pulo (5%: o respiro acima do cabelo continua ≥ 30 px).
// Na tela cheia o salto parte do rosto (âncoras = o rosto).
export const zoomDoCorte = (t: number, plano: Plano, trocas: Troca[]) => {
  const perto = (c: number) => trocas.some((x) => Math.abs(c - x.de) < 0.8);
  let z = 1;
  for (const c of plano.cortesEm ?? []) {
    if (c > t) break;
    if (perto(c)) {
      z = 1;
      continue;
    }
    z = z === 1 ? 1.05 : 1;
  }
  return z;
};

// ---------- luzes-espia ----------

// a luz de um item de `luzes` (sem ícone: a luz numerada da posição dele)
export const lampadaDoItem = (icone: Lampada | undefined, i: number): Lampada => icone ?? (`n${Math.min(5, i + 1)}` as Lampada);
// a luz de um destaque
export const lampadaDoDestaque = (m: { icone?: Lampada; nivel?: "alerta" | "chave" }): Lampada => m.icone ?? (m.nivel === "alerta" ? "alerta" : "info");

// As luzes da fileira: as dos momentos, na ordem em que aparecem pela primeira vez (até 4)
export const luzesDoPlano = (plano: Plano): Lampada[] => {
  const lista: Lampada[] = [];
  const add = (i?: Lampada) => {
    if (i && !lista.includes(i)) lista.push(i);
  };
  for (const m of ordenados(plano)) {
    if (m.tipo === "luzes") m.itens.forEach((x, i) => add(lampadaDoItem(x.icone, i)));
    if (m.tipo === "parada") (m.icones ?? []).forEach(add);
    if (m.tipo === "rota") add(m.icone);
    if (m.tipo === "aviso") add(m.icone);
    if (m.tipo === "destaque") add(lampadaDoDestaque(m));
  }
  // sem nenhuma luz no plano, a fileira mostra três luzes apagadas (o painel nunca fica sem elas)
  if (lista.length === 0) lista.push("alerta", "info", "servico");
  return lista.slice(0, 4);
};

// a cor de cada luz: a do plano (`cor` nos itens de `luzes`) ou a padrão
export const corDasLuzes = (plano: Plano) => {
  const mapa = new Map<Lampada, CorDaLuz | undefined>();
  for (const m of plano.momentos) if (m.tipo === "luzes") m.itens.forEach((x, i) => x.cor && mapa.set(lampadaDoItem(x.icone, i), x.cor));
  return (ic: Lampada) => mapa.get(ic);
};

// ---------- motor: ponteiros e luz de fundo ----------

type Evento = { t: number; alvo: number; dur: number };

// Valor que vai de alvo em alvo (cada evento parte de onde o anterior estava)
const trilha = (eventos: Evento[], inicial: number) => {
  const ord = [...eventos].sort((a, b) => a.t - b.t);
  return (t: number) => {
    let v = inicial;
    for (const e of ord) {
      if (t < e.t) break;
      const p = Math.min(1, (t - e.t) / Math.max(0.001, e.dur));
      const q = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      v = v + (e.alvo - v) * q;
    }
    return v;
  };
};

export const VEL_MAX = 240;
export const GIRO_MAX = 8;
const MARCHA_LENTA = 0.85;

// Na comparação os dois mostradores viram os dois lados: o ponteiro de cada lado sobe quando ele é
// dito; com `vencedor`, o dele vai alto e o do outro cai (e a luz de fundo do outro apaga um pouco).
export const niveisDaComparacao = (m: Extract<Momento, { tipo: "comparacao" }>) => {
  const vencedor = m.vencedor ?? (m.modo === "errado-certo" ? 1 : undefined);
  const final = (i: 0 | 1) => (vencedor === undefined ? 0.6 : vencedor === i ? 0.88 : 0.12);
  // sem vencedorEm, cada ponteiro vai direto ao nível final; com ele, os dois sobem juntos e se separam ali
  const separa = vencedor !== undefined && m.vencedorEm !== undefined ? m.vencedorEm : undefined;
  const perdedor = vencedor === undefined ? undefined : ((1 - vencedor) as 0 | 1);
  const apagaEm = perdedor === undefined ? undefined : (separa ?? m.lados[perdedor].em + 0.7);
  return { vencedor, final, separa, perdedor, apagaEm };
};

// Velocidade (km/h), giro (×1000 rpm) e luz de fundo (0 = apagado, 1 = aceso) ao longo do vídeo:
// a ignição varre os ponteiros até o fim e volta; rodando, o carro anda a ~60; "encostar" leva a
// velocidade a zero; "desligar" leva o giro a zero e escurece o painel; o fechamento estaciona.
export const motorDo = (plano: Plano) => {
  const ig = ignicaoDe(plano);
  // nada do plano mexe nos ponteiros antes de a varredura da partida terminar
  const apos = (t: number) => Math.max(t, ig + 1.45);
  const vel: Evento[] = [];
  const giro: Evento[] = [];
  const luz: Evento[] = [];
  // a varredura da ignição
  luz.push({ t: ig, alvo: 1, dur: 0.35 });
  vel.push({ t: ig + 0.08, alvo: VEL_MAX, dur: 0.62 }, { t: ig + 0.82, alvo: 0, dur: 0.62 });
  giro.push({ t: ig + 0.08, alvo: GIRO_MAX, dur: 0.62 }, { t: ig + 0.82, alvo: 0, dur: 0.5 }, { t: ig + 1.32, alvo: MARCHA_LENTA, dur: 0.35 });
  const ms = ordenados(plano);
  for (const m of ms) {
    if (m.tipo === "ignicao" && m === ms[0]) continue;
    if (m.tipo === "parada") {
      vel.push({ t: apos(m.de), alvo: 64, dur: 0.8 });
      giro.push({ t: apos(m.de), alvo: 2.2, dur: 0.8 });
      luz.push({ t: apos(m.de), alvo: 1, dur: 0.3 });
      for (const p of m.passos) {
        if (p.acao === "encostar") {
          vel.push({ t: apos(p.em), alvo: 0, dur: 1.4 });
          giro.push({ t: apos(p.em), alvo: MARCHA_LENTA, dur: 1.1 });
        }
        if (p.acao === "desligar") {
          vel.push({ t: apos(p.em), alvo: 0, dur: 0.5 });
          giro.push({ t: apos(p.em + 0.1), alvo: 0, dur: 0.7 });
          luz.push({ t: apos(p.em + 0.2), alvo: 0.4, dur: 0.6 });
        }
      }
      continue;
    }
    if (m.tipo === "rota") {
      luz.push({ t: apos(m.de), alvo: 1, dur: 0.3 });
      giro.push({ t: apos(m.de), alvo: 1.9, dur: 0.9 });
      vel.push({ t: apos(m.rotaEm), alvo: 48, dur: 1.4 });
      vel.push({ t: apos(m.chegadaEm + 0.2), alvo: 0, dur: 1 });
      giro.push({ t: apos(m.chegadaEm + 0.2), alvo: MARCHA_LENTA, dur: 0.9 });
      continue;
    }
    if (m.tipo === "cta") {
      luz.push({ t: apos(m.de), alvo: 1, dur: 0.3 });
      vel.push({ t: apos(m.de), alvo: 0, dur: 0.8 });
      giro.push({ t: apos(m.de), alvo: MARCHA_LENTA, dur: 0.6 });
      // fechamento no fim do vídeo: o motor desliga (o par da ignição do começo)
      const fimDaFala = plano.palavras.filter((p) => p.em < plano.duracao).reduce((a, p) => Math.max(a, p.ate), m.de);
      if (m.ate >= plano.duracao - 0.3 && plano.duracao - fimDaFala > 0.25) {
        const desliga = Math.max(fimDaFala, plano.duracao - 0.6);
        giro.push({ t: desliga, alvo: 0, dur: 0.45 });
        luz.push({ t: desliga + 0.1, alvo: 0.45, dur: 0.4 });
      }
      continue;
    }
    if (m.tipo === "comparacao") {
      // os ponteiros descansam na troca e sobem com cada lado
      const n = niveisDaComparacao(m);
      const rep = apos(m.de - ANTES + 0.05);
      luz.push({ t: rep, alvo: 1, dur: 0.3 });
      vel.push({ t: rep, alvo: 0, dur: 0.45 });
      giro.push({ t: rep, alvo: 0, dur: 0.45 });
      const sobe = (i: 0 | 1) => (n.separa !== undefined ? 0.55 : n.final(i));
      vel.push({ t: apos(m.lados[0].em), alvo: sobe(0) * VEL_MAX, dur: 0.9 });
      giro.push({ t: apos(m.lados[1].em), alvo: sobe(1) * GIRO_MAX, dur: 0.9 });
      if (n.separa !== undefined) {
        vel.push({ t: apos(n.separa), alvo: n.final(0) * VEL_MAX, dur: 0.8 });
        giro.push({ t: apos(n.separa), alvo: n.final(1) * GIRO_MAX, dur: 0.8 });
      }
      continue;
    }
    // os outros blocos: o carro roda a ~60 (um número dito acelera um pouco)
    vel.push({ t: apos(m.de), alvo: 62, dur: 1.6 });
    giro.push({ t: apos(m.de), alvo: 2.1, dur: 1.2 });
    luz.push({ t: apos(m.de), alvo: 1, dur: 0.3 });
    if (m.tipo === "numero") {
      vel.push({ t: apos(m.em), alvo: 92, dur: 1.0 });
      giro.push({ t: apos(m.em), alvo: 3.1, dur: 0.8 });
    }
  }
  const fv = trilha(vel, 0);
  const fg = trilha(giro, 0);
  const fl = trilha(luz, 0);
  return (t: number) => {
    const v = fv(t);
    const g = fg(t);
    // rodando, os ponteiros respiram de leve (nunca tremem)
    const rodando = Math.min(1, v / 40);
    return {
      vel: Math.max(0, v + rodando * 2.2 * Math.sin(t * 1.3)),
      giro: Math.max(0, g + rodando * 0.08 * Math.sin(t * 1.3 + 0.6)),
      luz: fl(t),
    };
  };
};
