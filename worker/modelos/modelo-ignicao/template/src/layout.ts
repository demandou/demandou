// A gramática do Ignição, em tempo: cada momento é um MODO do painel (como os modos de exibição de um
// painel digital). Na troca de modo todas as peças deslizam juntas para o novo lugar: a pessoa, os
// dois mostradores, a tela central e a fileira de luzes. Tudo sai dos momentos do plano.
import type { Caixa, Rosto } from "./motor/caixa";
import type { CorDaLuz, Lampada, Momento, Plano } from "./plano";
import { H, W } from "./tema";

// cheio = só a pessoa (antes da chave); central = pessoa na tela central, barra de mensagens embaixo;
// espelho = pessoa no retrovisor, luzes no alto da tela grande; lateral = pessoa no retrovisor da
// direita; rota = pessoa no retrovisor, tela grande inteira (mapa, listas, números, gráficos);
// comparar = pessoa no retrovisor, os dois mostradores grandes embaixo de cada lado da comparação
export type Modo = "cheio" | "central" | "espelho" | "lateral" | "rota" | "comparar";

export type Circulo = { cx: number; cy: number; r: number };
export type Retangulo = { x: number; y: number; w: number; h: number };

// A geometria de cada modo (px, quadro 1080×1920). Topo seguro 170, interface do app abaixo de 1560.
export type Geometria = {
  // a caixa da pessoa
  pessoa: Caixa;
  // velocímetro (esquerda) e conta-giros (direita)
  vel: Circulo;
  giro: Circulo;
  // a tela central (vidro escuro onde entram os textos e desenhos de cada momento)
  tela: Retangulo;
  // a fileira de luzes-espia: centro da primeira e da última (com 3 luzes), e o tamanho do ícone
  luzes: { x1: number; x2: number; y: number; tam: number };
};

// mostradores grandes embaixo (modo clássico) e um pouco menores no modo do retrovisor da direita
const VEL_BAIXO: Circulo = { cx: 262, cy: 1352, r: 196 };
const GIRO_BAIXO: Circulo = { cx: 818, cy: 1352, r: 196 };
const VEL_MEIO: Circulo = { cx: 252, cy: 1366, r: 182 };
const GIRO_MEIO: Circulo = { cx: 828, cy: 1366, r: 182 };
// mostradores compactos nos cantos (modo tela grande)
const VEL_CANTO: Circulo = { cx: 186, cy: 1418, r: 128 };
const GIRO_CANTO: Circulo = { cx: 894, cy: 1418, r: 128 };

// As três molduras da pessoa. Regra do pack: em janela pequena a cabeça aparece inteira, com respiro
// acima do cabelo (≥ 30 px), e o rosto fica com ≥ 260 px de largura. Com o rosto do plano na altura
// padrão (y ≈ 0,31, cabelo a partir de ≈ 0,135), as três escalam o vídeo a ~0,82 do quadro.
// retrovisor de dentro (topo, no centro)
export const ESPELHO: Caixa = { x: 160, y: 190, w: 760, h: 556, raio: 70, zoom: 1.165, ancoraY: 0.577 };
// retrovisor da direita (topo, à direita)
export const LATERAL: Caixa = { x: 576, y: 190, w: 444, h: 556, raio: 48, zoom: 1.995, ancoraY: 0.577 };
// tela central (modo clássico)
export const CENTRAL: Caixa = { x: 110, y: 200, w: 860, h: 744, raio: 30, zoom: 1.03, ancoraY: 0.441 };

// As molduras foram desenhadas para um rosto com ~36% da largura do quadro. Gravação mais perto da
// câmera (rosto maior, medido pelo rastreio) aproxima menos — até o mínimo que cobre a moldura — e
// sobe o rosto para o queixo caber.
const ROSTO_PADRAO = 0.36;
export const adaptarCaixa = (c: Caixa, plano: Plano): Caixa => {
  const L = (plano.rosto as Rosto).rastro?.largura;
  if (!L || L <= ROSTO_PADRAO) return c;
  const vh = Math.min(H, plano.videoAltura ?? H);
  const zoom = Math.max(1, ((c.zoom ?? 1) * ROSTO_PADRAO) / L);
  const s = Math.max(c.w / W, c.h / vh) * zoom;
  const rosto = L * W * s;
  // centro do rosto até o queixo ≈ 0,62 da largura do rosto (com folga para o rastreio aproximar)
  const ancora = Math.min(c.ancoraY ?? 0.5, (c.h - 14 - 0.72 * rosto) / c.h);
  return { ...c, zoom, ancoraY: Math.max(0.34, ancora) };
};

export const geometriaDe = (modo: Modo, plano: Plano): Geometria => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  switch (modo) {
    case "cheio": {
      // quadro cheio: o menor zoom que deixa o rosto na linha do centro sem borda vazia
      const fx = plano.rosto.x;
      const zoom = Math.min(1.25, Math.max(1, 0.5 / Math.max(0.01, Math.min(fx, 1 - fx))));
      return {
        pessoa: { x: 0, y: 0, w: W, h: videoAltura, raio: 0, zoom, ancoraY: (plano.rosto.y * H) / videoAltura },
        vel: VEL_BAIXO,
        giro: GIRO_BAIXO,
        tela: { x: 60, y: 966, w: 960, h: 166 },
        luzes: { x1: 448, x2: 632, y: 1496, tam: 72 },
      };
    }
    case "central":
      return {
        pessoa: adaptarCaixa(CENTRAL, plano),
        vel: VEL_BAIXO,
        giro: GIRO_BAIXO,
        // a barra de mensagens, entre a tela da pessoa e os mostradores
        tela: { x: 60, y: 966, w: 960, h: 166 },
        luzes: { x1: 448, x2: 632, y: 1496, tam: 72 },
      };
    case "espelho":
      return {
        pessoa: adaptarCaixa(ESPELHO, plano),
        vel: VEL_CANTO,
        giro: GIRO_CANTO,
        tela: { x: 60, y: 792, w: 960, h: 480 },
        luzes: { x1: 230, x2: 850, y: 862, tam: 112 },
      };
    case "lateral":
      return {
        pessoa: adaptarCaixa(LATERAL, plano),
        vel: VEL_MEIO,
        giro: GIRO_MEIO,
        tela: { x: 60, y: 800, w: 960, h: 352 },
        luzes: { x1: 140, x2: 460, y: 290, tam: 112 },
      };
    case "rota":
      return {
        pessoa: adaptarCaixa(ESPELHO, plano),
        vel: VEL_CANTO,
        giro: GIRO_CANTO,
        tela: { x: 60, y: 792, w: 960, h: 480 },
        luzes: { x1: 452, x2: 628, y: 1480, tam: 76 },
      };
    case "comparar":
      return {
        pessoa: adaptarCaixa(ESPELHO, plano),
        vel: VEL_BAIXO,
        giro: GIRO_BAIXO,
        // a tela fica mais baixa: embaixo dela, um mostrador para cada lado
        tela: { x: 60, y: 792, w: 960, h: 330 },
        luzes: { x1: 448, x2: 632, y: 1496, tam: 72 },
      };
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

// duração da troca de modo; ela começa um pouco antes do momento, para o corte que costuma ficar
// na fronteira cair no meio do movimento
export const TROCA = 0.56;
export const ANTES = 0.3;

const ordenados = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

// O vídeo sempre abre em quadro cheio e a chave gira logo na primeira palavra: os ponteiros varrem,
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

// Sequência de modos ao longo do vídeo: quadro cheio até a chave; depois o modo de cada momento;
// fora dos momentos o painel fica no modo clássico (central).
export const trocasDe = (plano: Plano): Troca[] => {
  const ms = ordenados(plano);
  const ig = ignicaoDe(plano);
  const lista: Troca[] = [{ de: -10, modo: "cheio" }];
  const naChave = primeiroNaChave(plano);
  if (!naChave) lista.push({ de: ig, modo: "central" });
  ms.forEach((m, i) => {
    const modo = modoDo(m);
    if (i === 0 && naChave) lista.push({ de: ig, modo });
    else lista.push({ de: Math.max(ig + 0.75, m.de - ANTES), modo });
    const proximo = ms[i + 1];
    // buraco entre momentos (mais de 0,8 s): volta ao clássico
    const fim = Math.min(m.ate, plano.duracao);
    if (modo !== "central" && fim < plano.duracao - 0.3 && (!proximo || proximo.de - fim > 0.8)) lista.push({ de: fim - ANTES, modo: "central" });
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
