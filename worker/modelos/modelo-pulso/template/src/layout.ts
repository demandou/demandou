// A direção do app: onde a pessoa fica em cada momento, quando o layout troca, como a caixa dela se
// move e como o conteúdo entra e sai nas trocas. Tudo sai do plano — o aluno não escreve posições.
import { Easing } from "remotion";
import { prog, saida, troca } from "./anim";
import type { Caixa, Rosto } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { H, W } from "./tema";

export type Lugar = "cheia" | "relogio" | "relogioAlto" | "relogioLista" | "cartao" | "avatar";
export type CaixaPessoa = Required<Caixa>;

// duração de uma troca de layout; ela começa um pouco antes do `de` (o corte cai no meio do movimento)
export const TROCA = 0.6;
export const ANTES = 0.15;

// Ajuste de segurança: ordena e impede que um momento invada o seguinte.
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

// ---------- os lugares da pessoa ----------

// O relógio grande (zonas, destaque): visor de 600 px com o centro em (540, 760)
export const RELOGIO = { cx: 540, cy: 760, r: 300 };
// O relógio no alto (zona, definição, pergunta, pizza): visor de 480 px com o centro em (540, 600)
export const RELOGIO_ALTO = { cx: 540, cy: 600, r: 240 };
// O relógio menor (lista): visor de 420 px com o centro em (540, 555) — sobra lugar para 5 linhas
export const RELOGIO_LISTA = { cx: 540, cy: 555, r: 210 };
// pé da alça de baixo de um relógio (o conteúdo começa 30–40 px abaixo dele)
export const peDoRelogio = (c: { cy: number; r: number }) => c.cy + c.r * 1.47;
// O mapa da rota e o avatar da pessoa no canto de cima dele
export const MAPA = { x: 120, y: 240, w: 840, h: 840, raio: 40 };
export const AVATAR = { cx: 330, cy: 450, r: 170 };

// Onde a cabeça está na gravação (px do vídeo de trabalho): do topo do cabelo ao queixo, estimado
// pela largura do rosto que o rastreio mediu. Sem rastro, null (vale o enquadramento padrão).
const cabeca = (plano: Plano) => {
  const larg = (plano.rosto as Rosto).rastro?.largura;
  if (!larg) return null;
  const H0 = Math.min(1920, plano.videoAltura ?? 1920);
  const fy = plano.rosto.y * 1920;
  const wf = larg * 1080;
  const topo = Math.max(0, fy - wf);
  const queixo = Math.min(H0, fy + 0.75 * wf);
  return { fy, topo, queixo, H0, altura: (queixo - topo) * 1.18 };
};

// Ajusta o zoom e a altura do rosto numa caixa para a cabeça caber inteira (gravação de perto ou de
// longe): nunca aproxima além do zoom do layout e sobe o enquadramento se o topo da cabeça cortaria.
export const enquadre = (base: CaixaPessoa, plano: Plano): CaixaPessoa => {
  const c = cabeca(plano);
  if (!c) return base;
  const escala1 = Math.max(base.w / 1080, base.h / c.H0);
  const visivel1 = base.h / escala1;
  const zoom = Math.min(base.zoom, Math.max(1, visivel1 / c.altura));
  const visivel = visivel1 / zoom;
  const ancora = (c.fy - (c.topo - 0.06 * visivel)) / visivel;
  return { ...base, zoom, ancoraY: Math.max(base.ancoraY, ancora) };
};

// Tela cheia: o menor zoom que deixa o rosto na linha do centro sem borda vazia (até 1,25)
export const caixaCheia = (plano: Plano): CaixaPessoa => {
  const fx = plano.rosto.x;
  const zoom = Math.min(1.25, Math.max(1, 0.5 / Math.max(0.01, Math.min(fx, 1 - fx))));
  return { x: 0, y: 0, w: W, h: H, raio: 0, zoom, ancoraY: plano.rosto.y };
};

const circulo = (c: { cx: number; cy: number; r: number }, zoom: number, ancoraY: number): CaixaPessoa => ({
  x: c.cx - c.r,
  y: c.cy - c.r,
  w: c.r * 2,
  h: c.r * 2,
  raio: c.r,
  zoom,
  ancoraY,
});

// As medidas que dependem da gravação: o card de cima fica mais alto quando a pessoa grava de perto
// (a cabeça inteira cabe), e o painel embaixo começa logo depois dele.
export type Geo = {
  cartao: { x: number; y: number; w: number; h: number; raio: number };
  // onde o painel embaixo do card começa
  abaixoCartao: number;
  // topo dos cartões no peito (logo abaixo do queixo)
  peito: number;
};

export const geometria = (plano: Plano): Geo => {
  const c = cabeca(plano);
  const h = c ? Math.round(Math.min(720, Math.max(600, c.altura * (840 / 1080)))) : 600;
  const cartao = { x: 120, y: 240, w: 840, h, raio: 40 };
  return {
    cartao,
    abaixoCartao: cartao.y + cartao.h + 40,
    peito: Math.round(Math.min(1060, Math.max(980, (plano.zona?.topo ?? 970) + 40))),
  };
};

export const lugares = (plano: Plano, geo: Geo): Record<Lugar, CaixaPessoa> => ({
  cheia: caixaCheia(plano),
  // no visor redondo, rosto e ombros com folga: a cabeça nunca encosta na borda
  relogio: enquadre(circulo(RELOGIO, 1.12, 0.44), plano),
  relogioAlto: enquadre(circulo(RELOGIO_ALTO, 1.12, 0.44), plano),
  relogioLista: enquadre(circulo(RELOGIO_LISTA, 1.12, 0.44), plano),
  cartao: enquadre({ ...geo.cartao, zoom: 1, ancoraY: 0.45 }, plano),
  // janela pequena: zoom moderado para a cabeça caber inteira
  avatar: enquadre(circulo(AVATAR, 1.55, 0.47), plano),
});

export const lugarDe = (m: Momento): Lugar => {
  switch (m.tipo) {
    case "gancho":
    case "abertura":
    case "numero":
    case "cta":
      return "cheia";
    case "zonas":
    case "destaque":
      return "relogio";
    case "zona":
    case "definicao":
    case "pergunta":
      return "relogioAlto";
    case "grafico":
      return m.forma === "pizza" && m.dados && m.dados.length >= 2 ? "relogioAlto" : "cartao";
    case "topicos":
      return "relogioLista";
    case "divisao":
    case "frase":
    case "comparacao":
      return "cartao";
    case "rota":
    case "passos":
      return "avatar";
  }
};

export const ehRelogio = (l: Lugar | undefined) => l === "relogio" || l === "relogioAlto" || l === "relogioLista";
export const centroDoRelogio = (l: Lugar) => (l === "relogioAlto" ? RELOGIO_ALTO : l === "relogioLista" ? RELOGIO_LISTA : RELOGIO);

// ---------- trechos ----------

// Um trecho por momento; buraco longo entre momentos (ou antes do primeiro) = pessoa em tela cheia
// com legenda.
export type Trecho = { de: number; ate: number; momento: number | null; lugar: Lugar };

export const montarTrechos = (plano: Plano): Trecho[] => {
  const ordem = plano.momentos;
  const trechos: Trecho[] = [];
  if (!ordem.length || ordem[0].de > 0.15) trechos.push({ de: -10, ate: ordem[0]?.de ?? 1e4, momento: null, lugar: "cheia" });
  ordem.forEach((m, i) => {
    const proximo = ordem[i + 1];
    const fimDoVideo = !proximo && m.ate >= plano.duracao - 0.3;
    trechos.push({ de: m.de <= 0.15 ? -10 : m.de, ate: proximo ? proximo.de : fimDoVideo ? 1e4 : m.ate, momento: i, lugar: lugarDe(m) });
    const buraco = (proximo ? proximo.de : plano.duracao) - m.ate;
    if (buraco > 1.2 || (!proximo && !fimDoVideo)) {
      trechos[trechos.length - 1].ate = m.ate;
      trechos.push({ de: m.ate, ate: proximo ? proximo.de : 1e4, momento: null, lugar: "cheia" });
    }
  });
  return trechos;
};

// Qual trecho vale em `t` e quanto a troca para ele já andou (0 = ainda no anterior, 1 = assentou)
export const trechoNoTempo = (t: number, trechos: Trecho[]) => {
  let k = 0;
  for (let i = 0; i < trechos.length; i++) if (trechos[i].de - ANTES <= t) k = i;
  const atual = trechos[k];
  const anterior = trechos[k - 1] ?? atual;
  const p = k === 0 ? 1 : prog(t, atual.de - ANTES, TROCA, troca);
  return { k, atual, anterior, p };
};

// Até quando o momento `i` fica na tela (a troca para o próximo começa ANTES disso)
export const fimDoMomento = (i: number, trechos: Trecho[], duracao: number) =>
  trechos.find((tr) => tr.momento === i)?.ate ?? duracao + 1;

// ---------- entradas e saídas do conteúdo ----------
//
// Nenhum quadro vazio e nenhuma página por cima da outra:
// - saindo da tela cheia, o painel novo já está montado embaixo da pessoa e aparece enquanto ela
//   encolhe (a pessoa é a cortina);
// - voltando para a tela cheia, o painel fica até a pessoa cobrir tudo;
// - de um lugar do app para outro, as páginas deslizam juntas, como no app (a velha sai pela
//   esquerda enquanto a nova entra pela direita, encostadas);
// - os cartões do peito trocam deslizando do mesmo jeito; depois de uma página do app, o cartão sobe
//   quando a pessoa já cresceu.
export type Presenca = { opacidade: number; dx: number; dy: number };
const deslize = (t: number, inicio: number) => prog(t, inicio, TROCA, troca);

export const presencaAbaixo = (i: number, t: number, trechos: Trecho[]): Presenca => {
  const j = trechos.findIndex((tr) => tr.momento === i);
  if (j < 0) return { opacidade: 0, dx: 0, dy: 0 };
  const tr = trechos[j];
  const anterior = trechos[j - 1];
  const proximo = trechos[j + 1];
  let opacidade = 1;
  let dx = 0;
  const inicio = tr.de - ANTES;
  if (anterior && tr.de > 0) {
    // saindo da tela cheia: com um cartão no peito, o painel só aparece depois que o cartão saiu
    if (anterior.lugar === "cheia") opacidade = prog(t, anterior.momento !== null ? inicio + 0.15 : inicio - 0.04, 0.1);
    else {
      dx += (1 - deslize(t, inicio)) * W;
      if (t < inicio) opacidade = 0;
    }
  }
  if (proximo) {
    const fim = proximo.de - ANTES;
    if (proximo.lugar === "cheia") {
      if (t > fim + TROCA + 0.02) opacidade = 0;
    } else dx -= deslize(t, fim) * W;
  }
  return { opacidade, dx, dy: 0 };
};

export const presencaPeito = (i: number, t: number, trechos: Trecho[]): Presenca => {
  const j = trechos.findIndex((tr) => tr.momento === i);
  if (j < 0) return { opacidade: 0, dx: 0, dy: 0 };
  const tr = trechos[j];
  const anterior = trechos[j - 1];
  const proximo = trechos[j + 1];
  let opacidade = 1;
  let dx = 0;
  let dy = 0;
  const inicio = tr.de - ANTES;
  if (anterior && tr.de > 0.15) {
    if (anterior.lugar === "cheia" && anterior.momento !== null) {
      // de um cartão do peito para outro: deslizam juntos
      dx += (1 - deslize(t, inicio)) * W;
      if (t < inicio) opacidade = 0;
    } else {
      // a pessoa já estava (ou está ficando) em tela cheia: o cartão sobe, já opaco (nunca um
      // cartão meio transparente por cima do vídeo)
      const atraso = anterior.lugar === "cheia" ? 0 : 0.12;
      const e = prog(t, inicio + atraso, 0.45);
      opacidade = prog(t, inicio + atraso, 0.12);
      dy += (1 - e) * 110;
    }
  }
  if (proximo) {
    const fim = proximo.de - ANTES;
    if (proximo.lugar === "cheia" && proximo.momento === null) {
      // a pessoa continua em tela cheia, só com a legenda: o cartão desce e some
      const s = prog(t, fim - 0.1, 0.16, (x) => x * x);
      opacidade *= 1 - s;
      dy += s * 70;
    } else if (proximo.lugar === "cheia") {
      // outro cartão do peito: os dois deslizam juntos
      dx -= deslize(t, fim) * W;
    } else {
      // a pessoa vai encolher para um lugar do app: o cartão sai rápido pela esquerda, antes de o
      // painel novo subir (nunca fica por cima dele)
      dx -= prog(t, fim - 0.08, 0.22, (x) => x * x * x) * W;
    }
  }
  return { opacidade, dx, dy };
};

// ---------- a caixa no tempo ----------

// Saindo da tela cheia ou voltando para ela, a caixa arranca rápido e assenta devagar (o app
// embaixo aparece logo); entre dois lugares do app, arranca e freia.
export type EstadoDaPessoa = { de: number; caixa: CaixaPessoa; dur: number; rapido?: boolean };
const arranque = Easing.bezier(0.22, 0.75, 0.25, 1);

export const estadosDaPessoa = (trechos: Trecho[], L: Record<Lugar, CaixaPessoa>, cortesEm: number[] = []): EstadoDaPessoa[] => {
  const estados: EstadoDaPessoa[] = [];
  trechos.forEach((tr, i) => {
    const rapido = i > 0 && (tr.lugar === "cheia") !== (trechos[i - 1].lugar === "cheia");
    estados.push({ de: i === 0 ? -10 : tr.de - ANTES, caixa: L[tr.lugar], dur: i === 0 ? 0.001 : TROCA, rapido });
  });
  // corte no meio de um trecho: troca seca de enquadramento (1 ↔ 1,06) para disfarçar o pulo
  const trocas = trechos.slice(1).map((tr) => tr.de - ANTES);
  for (const c of cortesEm) {
    if (trocas.some((x) => c > x - 0.6 && c < x + TROCA + 0.5)) continue;
    const antes = [...estados].sort((a, b) => a.de - b.de).filter((e) => e.de <= c).pop();
    if (!antes) continue;
    const tr = [...trechos].reverse().find((x) => x.de - ANTES <= c);
    const padrao = L[tr?.lugar ?? "cheia"];
    const aproximado = antes.caixa.zoom > padrao.zoom + 0.001;
    estados.push({ de: c, caixa: { ...padrao, zoom: padrao.zoom * (aproximado ? 1 : 1.06) }, dur: 0.001 });
  }
  return estados.sort((a, b) => a.de - b.de);
};

export const pessoaNoTempo = (t: number, estados: EstadoDaPessoa[]): CaixaPessoa => {
  let i = 0;
  for (let k = 0; k < estados.length; k++) if (estados[k].de <= t) i = k;
  const agora = estados[i].caixa;
  if (i === 0) return agora;
  const antes = estados[i - 1].caixa;
  const e = estados[i];
  const p = prog(t, e.de, e.dur, e.rapido ? arranque : troca);
  const m = (a: number, b: number) => a + (b - a) * p;
  return {
    x: m(antes.x, agora.x),
    y: m(antes.y, agora.y),
    w: m(antes.w, agora.w),
    h: m(antes.h, agora.h),
    raio: m(antes.raio, agora.raio),
    zoom: m(antes.zoom, agora.zoom),
    ancoraY: m(antes.ancoraY, agora.ancoraY),
  };
};

// Quanto a caixa é "redonda" (1 = círculo perfeito): o aro do relógio só aparece em volta de um círculo
export const redondeza = (c: Caixa) => {
  const lado = Math.min(c.w, c.h);
  const quadrado = 1 - Math.min(1, Math.abs(c.w - c.h) / (lado * 0.25));
  const cantos = Math.min(1, (c.raio ?? 0) / (lado / 2));
  return Math.max(0, Math.min(quadrado, cantos));
};

// usado por componentes que somem sozinhos (legado)
export const saidaDe = (t: number, fim: number) => prog(t, fim - ANTES - 0.1, 0.16, (x) => saida(x));
