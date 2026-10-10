// A gramática da Constelação em números: o céu projetado (estrelas, Via Láctea, grade, estrelinhas de
// fundo), os blocos de carta, a ocular da pessoa, a câmera da carta e o localizador vermelho.
// Tudo calculado a partir do plano; os componentes só desenham.
import { entra, gira, limitar, mistura, prog, ruido } from "./anim";
import { CATALOGO } from "./catalogo";
import { enquadrar as enquadrarPessoa, pontoDoRosto, type Rosto } from "./motor/caixa";
import type { Carta, Ceu, Momento, Passo, Plano, PosicaoOcular } from "./plano";
import { H, QUADRO, W } from "./tema";

export type P = { x: number; y: number };
type Retangulo = { x: number; y: number; w: number; h: number };

const RAD = Math.PI / 180;

// ---------------------------------------------------------------- projeção

// Estereográfica (preserva a forma das figuras), centrada em (ar0, dec0), norte para cima e LESTE À
// ESQUERDA — como o céu visto de baixo. Unidades: ~1 = 57° perto do centro.
const projetor = (ar0: number, dec0: number) => {
  const a0 = ar0 * 15 * RAD;
  const d0 = dec0 * RAD;
  return (ar: number, dec: number): P | null => {
    const a = ar * 15 * RAD;
    const d = dec * RAD;
    const cosc = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(a - a0);
    if (cosc < -0.6) return null;
    const k = 2 / (1 + cosc);
    const leste = k * Math.cos(d) * Math.sin(a - a0);
    const norte = k * (Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(a - a0));
    return { x: -leste, y: -norte };
  };
};

// Galáctica → equatorial (J2000): a Via Láctea segue b = 0.
const galacticaParaEquatorial = (l: number, b: number) => {
  const aNGP = 192.85948 * RAD;
  const dNGP = 27.12825 * RAD;
  const lNCP = 122.93192 * RAD;
  const L = l * RAD;
  const B = b * RAD;
  const sd = Math.sin(B) * Math.sin(dNGP) + Math.cos(B) * Math.cos(dNGP) * Math.cos(lNCP - L);
  const dec = Math.asin(sd);
  const ar = aNGP + Math.atan2(Math.cos(B) * Math.sin(lNCP - L), Math.sin(B) * Math.cos(dNGP) - Math.cos(B) * Math.sin(dNGP) * Math.cos(lNCP - L));
  return { ar: (((ar / RAD) % 360) + 360) % 360 / 15, dec: dec / RAD };
};

// regiões escuras conhecidas da Via Láctea (o Saco de Carvão, colado ao Cruzeiro)
const NEBULOSAS_ESCURAS = [{ ar: 12.85, dec: -62.6, raio: 3.1 }];

// ---------------------------------------------------------------- o mundo

export type AstroNoMundo = { id: string; x: number; y: number; mag: number; nome: string; ponto: boolean };
export type EstrelaDeFundo = { x: number; y: number; r: number; a: number; fase: number };

export type Mundo = {
  astros: Record<string, AstroNoMundo>;
  fundo: EstrelaDeFundo[];
  // faixas da Via Láctea, da mais larga para a mais estreita (desenhadas sobrepostas = borda macia)
  via: { faixas: P[][]; escuras: { x: number; y: number; r: number }[] } | null;
  grade: P[][];
  // anéis de declinação em volta de um polo (para a marca do polo)
  aneis: Record<string, { r: number; rotulo: string }[]>;
  // tamanho de referência do céu (a maior dimensão das estrelas do plano)
  vao: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  // true = céu real (estrelas com ascensão reta e declinação): a carta desenha o próprio fundo
  celeste: boolean;
};

const CEU_VAZIO: Ceu = { estrelas: [] };

export const montarMundo = (plano: Plano): Mundo => {
  const ceu = plano.ceu ?? CEU_VAZIO;
  const todos = [...(ceu.estrelas ?? []).map((a) => ({ ...a, ponto: false })), ...(ceu.pontos ?? []).map((a) => ({ ...a, ponto: true }))];
  const resolvidos = todos.map((a) => {
    const c = CATALOGO[a.id];
    return { ...a, ar: a.ar ?? c?.ar, dec: a.dec ?? c?.dec, mag: a.mag ?? c?.mag ?? 2.5, nome: a.nome ?? c?.nome ?? a.id };
  });
  const celeste = resolvidos.some((a) => a.ar !== undefined && a.dec !== undefined && a.x === undefined);

  // centro da projeção: o pedido ou o meio das estrelas (média de vetores)
  let projetar: ((ar: number, dec: number) => P | null) | null = null;
  if (celeste) {
    let centro = ceu.centro;
    if (!centro) {
      const vs = resolvidos.filter((a) => a.ar !== undefined && !a.ponto);
      const v = vs.reduce(
        (s, a) => {
          const ar = a.ar! * 15 * RAD;
          const d = a.dec! * RAD;
          return { x: s.x + Math.cos(d) * Math.cos(ar), y: s.y + Math.cos(d) * Math.sin(ar), z: s.z + Math.sin(d) };
        },
        { x: 0, y: 0, z: 0 },
      );
      const n = Math.hypot(v.x, v.y, v.z) || 1;
      centro = { ar: (((Math.atan2(v.y, v.x) / RAD + 360) % 360) / 15), dec: Math.asin(v.z / n) / RAD };
    }
    projetar = projetor(centro.ar, centro.dec);
  }

  const astros: Record<string, AstroNoMundo> = {};
  for (const a of resolvidos) {
    let p: P | null = null;
    if (a.x !== undefined && a.y !== undefined) p = { x: a.x, y: a.y };
    else if (projetar && a.ar !== undefined && a.dec !== undefined) p = projetar(a.ar, a.dec);
    if (!p) continue;
    astros[a.id] = { id: a.id, x: p.x, y: p.y, mag: a.mag, nome: a.nome, ponto: a.ponto };
  }

  const lista = Object.values(astros);
  const bbox = lista.length
    ? {
        x0: Math.min(...lista.map((a) => a.x)),
        y0: Math.min(...lista.map((a) => a.y)),
        x1: Math.max(...lista.map((a) => a.x)),
        y1: Math.max(...lista.map((a) => a.y)),
      }
    : { x0: 0, y0: 0, x1: 1, y1: 1 };
  const vao = Math.max(bbox.x1 - bbox.x0, bbox.y1 - bbox.y0, 0.02);
  const margem = vao * 0.9;
  const regiao = { x0: bbox.x0 - margem, y0: bbox.y0 - margem, x1: bbox.x1 + margem, y1: bbox.y1 + margem };
  const dentro = (p: P) => p.x >= regiao.x0 && p.x <= regiao.x1 && p.y >= regiao.y0 && p.y <= regiao.y1;
  // no quadro deitado aparece mais céu dos lados: a faixa da Via Láctea vai bem além da região das
  // estrelas (senão a ponta dela aparece cortada no meio da carta)
  const largo = vao * 2.6;
  const dentroDaVia = (p: P) => p.x >= bbox.x0 - largo && p.x <= bbox.x1 + largo && p.y >= bbox.y0 - largo && p.y <= bbox.y1 + largo;

  // Via Láctea: faixa de ±7° em volta do equador galáctico
  let via: Mundo["via"] = null;
  const pontosDaVia: { p: P; b: number }[] = [];
  if (projetar && ceu.viaLactea) {
    const borda = (b: number) => {
      const pts: P[] = [];
      for (let l = 0; l <= 360; l += 1.5) {
        const e = galacticaParaEquatorial(l, b);
        const p = projetar!(e.ar, e.dec);
        if (p && Math.abs(p.x) < 6 && Math.abs(p.y) < 6) pts.push(p);
        else pts.push({ x: NaN, y: NaN });
      }
      return pts;
    };
    // só o trecho contínuo que passa pela região
    const larguras = [10, 8.6, 7.2, 5.8, 4.4, 3, 1.6];
    const bordas = larguras.map((w) => ({ cima: borda(w), baixo: borda(-w) }));
    const { cima, baixo } = bordas[0];
    const ok = (i: number) => Number.isFinite(cima[i].x) && Number.isFinite(baixo[i].x) && (dentroDaVia(cima[i]) || dentroDaVia(baixo[i]));
    const idx = cima.map((_, i) => i).filter(ok);
    if (idx.length > 2) {
      const i0 = Math.max(0, idx[0] - 3);
      const i1 = Math.min(cima.length - 1, idx[idx.length - 1] + 3);
      const faixas = bordas.map((f) => [...f.cima.slice(i0, i1 + 1), ...f.baixo.slice(i0, i1 + 1).reverse()].filter((p) => Number.isFinite(p.x)));
      const escuras = NEBULOSAS_ESCURAS.map((n) => {
        const c = projetar!(n.ar, n.dec);
        const borda1 = projetar!(n.ar, n.dec + n.raio);
        return c && borda1 ? { x: c.x, y: c.y, r: Math.hypot(borda1.x - c.x, borda1.y - c.y) } : null;
      }).filter((x): x is { x: number; y: number; r: number } => !!x && dentro(x));
      via = { faixas, escuras };
      // pontilhado da faixa: mais denso no meio, só no trecho de longitude que passa pela região
      const lMin = i0 * 1.5;
      const lMax = i1 * 1.5;
      for (let i = 0; i < 1700; i++) {
        const l = lMin + ruido(i * 3.1 + 11) * (lMax - lMin);
        const u = ruido(i * 7.7 + 3) + ruido(i * 1.9 + 5) + ruido(i * 5.3 + 9) - 1.5;
        const b = u * 6.5;
        const e = galacticaParaEquatorial(l, b);
        const p = projetar(e.ar, e.dec);
        if (p && dentroDaVia(p)) pontosDaVia.push({ p, b });
      }
    }
  }

  // estrelinhas de fundo, fixas no céu (semente do plano)
  const semente = ceu.semente ?? 7;
  const area = (regiao.x1 - regiao.x0) * (regiao.y1 - regiao.y0);
  const quantas = Math.round(Math.min(2200, Math.max(700, (area / (vao * vao)) * 420)));
  const fundo: EstrelaDeFundo[] = [];
  for (let i = 0; i < quantas; i++) {
    const p = { x: regiao.x0 + ruido(i * 1.37 + semente * 17.1) * (regiao.x1 - regiao.x0), y: regiao.y0 + ruido(i * 2.71 + semente * 5.3) * (regiao.y1 - regiao.y0) };
    const q = ruido(i * 9.13 + semente);
    fundo.push({ ...p, r: q < 0.72 ? 1.1 + q * 0.7 : q < 0.95 ? 1.7 + (q - 0.72) * 3 : 2.6 + (q - 0.95) * 14, a: q < 0.72 ? 0.32 + q * 0.3 : q < 0.95 ? 0.55 + (q - 0.72) : 0.8, fase: ruido(i * 4.4) * 6.28 });
  }
  for (const [i, { p, b }] of pontosDaVia.entries()) {
    const q = ruido(i * 3.3 + 1);
    fundo.push({ ...p, r: 0.9 + q * 0.8 + (q > 0.97 ? 1.2 : 0), a: (0.22 + 0.3 * q) * (1 - Math.min(1, Math.abs(b) / 9)), fase: ruido(i * 1.1) * 6.28 });
  }
  // dentro das nebulosas escuras quase não se veem estrelas
  const fundoFinal = via?.escuras.length
    ? fundo.filter((s, i) => !via!.escuras.some((n) => Math.hypot(s.x - n.x, s.y - n.y) < n.r * 0.9) || ruido(i * 0.77) > 0.85)
    : fundo;

  // grade de coordenadas (declinação a cada 10°, ascensão reta a cada 1 h)
  const grade: P[][] = [];
  const aneis: Mundo["aneis"] = {};
  if (projetar) {
    for (let dec = -80; dec <= 80; dec += 10) {
      const pts: P[] = [];
      for (let h = 0; h <= 24.001; h += 0.1) {
        const p = projetar(h, dec);
        if (p && dentro(p)) pts.push(p);
        else if (pts.length) {
          grade.push([...pts]);
          pts.length = 0;
        }
      }
      if (pts.length > 1) grade.push(pts);
    }
    for (let h = 0; h < 24; h += 1) {
      const pts: P[] = [];
      for (let dec = -89; dec <= 89; dec += 1) {
        const p = projetar(h, dec);
        if (p && dentro(p)) pts.push(p);
        else if (pts.length) {
          grade.push([...pts]);
          pts.length = 0;
        }
      }
      if (pts.length > 1) grade.push(pts);
    }
    for (const a of resolvidos) {
      if (a.dec === undefined || Math.abs(Math.abs(a.dec) - 90) > 0.01 || !astros[a.id]) continue;
      const sinal = a.dec < 0 ? -1 : 1;
      aneis[a.id] = [80, 70].map((d) => {
        const p = projetar!(0, sinal * d);
        const c = astros[a.id];
        return { r: p ? Math.hypot(p.x - c.x, p.y - c.y) : 0, rotulo: `${sinal < 0 ? "−" : "+"}${d}°` };
      });
    }
  }

  return { astros, fundo: fundoFinal, via, grade, aneis, vao, bbox, celeste: !!projetar && Object.keys(astros).length > 0 };
};

// ---------------------------------------------------------------- ocular (a pessoa)

export type Ocular = { cx: number; cy: number; R: number; palco: Retangulo; livre: Retangulo };

// No quadro deitado (aula 9 do curso), a ocular é a MOLDURA do lado direito, com o rosto
// centralizado nela, e a carta (o palco) é o QUADRO do lado esquerdo. A ocular sobe e desce na
// coluna da direita a cada ideia; o `livre` (contador da carta de céu real) é o pedaço da coluna que
// sobra em cima ou embaixo dela.
const PALCO: Retangulo = { ...QUADRO };
type Deitada = "topo-direita" | "meio-direita" | "baixo-direita";
const DEITADAS: Record<Deitada, Ocular> = {
  "topo-direita": { cx: 1472, cy: 380, R: 240, palco: PALCO, livre: { x: 1136, y: 684, w: 682, h: 192 } },
  "meio-direita": { cx: 1472, cy: 488, R: 282, palco: PALCO, livre: { x: QUADRO.x + 10, y: 664, w: 420, h: 210 } },
  "baixo-direita": { cx: 1472, cy: 606, R: 240, palco: PALCO, livre: { x: 1136, y: 88, w: 682, h: 186 } },
};
// as posições do vertical que não existem no quadro deitado viram as da direita na mesma altura
// ("baixo-centro", a pessoa embaixo e o céu inteiro em cima, vira a ocular grande no meio)
export const posicaoDeitada = (p: PosicaoOcular): Deitada =>
  p.startsWith("topo") ? "topo-direita" : p === "baixo-direita" || p === "baixo-esquerda" ? "baixo-direita" : "meio-direita";
export const OCULARES: Record<PosicaoOcular, Ocular> = {
  "topo-direita": DEITADAS["topo-direita"],
  "topo-esquerda": DEITADAS["topo-direita"],
  "meio-direita": DEITADAS["meio-direita"],
  "meio-esquerda": DEITADAS["meio-direita"],
  "baixo-direita": DEITADAS["baixo-direita"],
  "baixo-esquerda": DEITADAS["baixo-direita"],
  "baixo-centro": DEITADAS["meio-direita"],
};
// a carta de céu real alterna no alto e embaixo (o contador fica na coluna da ocular)
const ALTERNANCIA: PosicaoOcular[] = ["topo-direita", "baixo-direita", "meio-direita"];
// nos blocos universais a ocular grande no meio alterna com o alto e o baixo (o título ao lado dela)
const ALTERNANCIA_BLOCOS: PosicaoOcular[] = ["meio-direita", "topo-direita", "meio-direita", "baixo-direita"];

// ---------------------------------------------------------------- blocos e passos

export const ehCarta = (m: Momento): m is Carta => m.tipo === "carta";

// Momentos que acontecem NA CARTA (a pessoa na ocular). Os outros são de tela cheia.
export type MomentoCarta = Extract<Momento, { tipo: "carta" | "topicos" | "passos" | "numero" | "comparacao" | "grafico" | "definicao" | "constelacao" }>;
export const naCarta = (m: Momento): m is MomentoCarta =>
  m.tipo === "carta" ||
  m.tipo === "topicos" ||
  m.tipo === "passos" ||
  m.tipo === "comparacao" ||
  m.tipo === "grafico" ||
  m.tipo === "definicao" ||
  m.tipo === "constelacao" ||
  (m.tipo === "numero" && m.tela !== "cheia");

export type Entrada = { m: MomentoCarta; ocular: Ocular; posicao: PosicaoOcular; inicio: number; pan: P };
export type Bloco = { de: number; ate: number; cartas: Entrada[] };

// troca de layout: se há um corte logo antes (até 0,3 s), a troca começa nele (disfarça o pulo)
const noCorte = (t: number, cortes: number[]) => {
  const c = cortes.filter((x) => x <= t + 0.05 && x >= t - 0.3).sort((a, b) => b - a)[0];
  return c ?? t;
};

export const elementosDoPasso = (p: Passo): string[] => {
  switch (p.acao) {
    case "acender":
    case "brilhar":
      return p.estrelas;
    case "ligar":
      return p.linhas.flat();
    case "destacar":
      return [p.de, p.ate];
    case "prolongar":
      return [p.ate, p.alvo];
    case "nomear":
      return [p.estrela];
    case "apontar":
      return [p.de, p.por, p.alvo];
    default:
      return [];
  }
};

export type Vista = { cx: number; cy: number; s: number; ax: number; ay: number };
export const naTela = (p: P, v: Vista): P => ({ x: v.ax + (p.x - v.cx) * v.s, y: v.ay + (p.y - v.cy) * v.s });

type Chave = { em: number; dur: number; alvo: Vista };
type Alvo = { em: number; ids: string[]; ponta?: { de: number; ate: number; a: string; b: string } };

export type Cena = {
  mundo: Mundo;
  blocos: Bloco[];
  chaves: Chave[];
  focos: Alvo[];
  passos: { p: Passo; m: Carta; ocular: Ocular; fim: number }[];
  ajusteOcular: { zoom: number; alturaRosto: number; largura: number };
  // todas as entradas de carta, em ordem (cada uma com a posição da luneta no céu de fundo)
  entradas: Entrada[];
};

const PAD = 90;
// zoom máximo: uma figura pequena não vira um close absurdo
const ZOOM_MAX = 520 / 0.18;

// Enquadra os ids no palco da ocular. `empurrar`: direção (no céu) de um alvo que ainda vai entrar —
// a figura começa encostada no lado oposto, deixando espaço para a reta que vai sair dela.
const enquadrar = (mundo: Mundo, ids: string[], ocular: Ocular, fator = 1, empurrar?: P, folgas: Record<string, number> = {}): Vista => {
  const pts = ids.map((id) => mundo.astros[id]).filter(Boolean);
  const b = pts.length
    ? { x0: Math.min(...pts.map((p) => p.x)), x1: Math.max(...pts.map((p) => p.x)), y0: Math.min(...pts.map((p) => p.y)), y1: Math.max(...pts.map((p) => p.y)) }
    : mundo.bbox;
  const bw = Math.max(b.x1 - b.x0, mundo.vao * 0.02);
  const bh = Math.max(b.y1 - b.y0, mundo.vao * 0.02);
  // folga extra (px) do lado em que fica um ponto com desenho grande (a rosa do polo)
  const extra = { cima: 0, baixo: 0, esq: 0, dir: 0 };
  for (const p of pts) {
    const f = folgas[p.id];
    if (!f) continue;
    if (p.y >= b.y1 - 1e-9) extra.baixo = Math.max(extra.baixo, f);
    if (p.y <= b.y0 + 1e-9) extra.cima = Math.max(extra.cima, f);
    if (p.x >= b.x1 - 1e-9) extra.dir = Math.max(extra.dir, f);
    if (p.x <= b.x0 + 1e-9) extra.esq = Math.max(extra.esq, f);
  }
  const pal = ocular.palco;
  const s = Math.min((pal.w - 2 * PAD - extra.esq - extra.dir) / bw, (pal.h - 2 * PAD - extra.cima - extra.baixo) / bh, ZOOM_MAX / mundo.vao) * fator;
  let ax = pal.x + pal.w / 2 + (extra.esq - extra.dir) / 2;
  let ay = pal.y + pal.h / 2 + (extra.cima - extra.baixo) / 2;
  if (empurrar) {
    ax -= empurrar.x * Math.max(0, pal.w / 2 - PAD - (bw * s) / 2);
    ay -= empurrar.y * Math.max(0, pal.h / 2 - PAD - (bh * s) / 2);
  }
  return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, s, ax, ay };
};

// direção (unitária, no céu) do centro dos ids até o alvo da primeira reta do momento
const direcaoDoAlvo = (mundo: Mundo, ids: string[], passos: Passo[]): P | undefined => {
  const reta = passos.find((p) => p.acao === "prolongar") as Extract<Passo, { acao: "prolongar" }> | undefined;
  const alvo = reta ? mundo.astros[reta.alvo] : undefined;
  const pts = ids.map((id) => mundo.astros[id]).filter(Boolean);
  if (!alvo || !pts.length) return undefined;
  const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
  const d = Math.hypot(alvo.x - cx, alvo.y - cy) || 1;
  return { x: (alvo.x - cx) / d, y: (alvo.y - cy) / d };
};

export const montarCena = (plano: Plano): Cena => {
  const mundo = montarMundo(plano);
  const cortes = plano.cortesEm ?? [];
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const cartas = momentos.filter(naCarta);

  // blocos: cartas coladas (ou com respiro curto) formam um bloco só
  const blocos: Bloco[] = [];
  const entradas: Entrada[] = [];
  let k = 0;
  let ultimoAlto: PosicaoOcular = "baixo-direita";
  let pan: P = { x: 0, y: 0 };
  for (const m of cartas) {
    let padrao = ehCarta(m) ? ALTERNANCIA[k % ALTERNANCIA.length] : ALTERNANCIA_BLOCOS[k % ALTERNANCIA_BLOCOS.length];
    // a constelação de ideias pede o quadro inteiro para a figura: a ocular vai para o alto ou para
    // baixo e o título fica ao lado dela, na coluna da direita
    if (m.tipo === "constelacao" && padrao === "meio-direita") padrao = ultimoAlto === "topo-direita" ? "baixo-direita" : "topo-direita";
    // nunca a mesma posição duas vezes seguidas dentro de um bloco: a pessoa sempre muda de lugar
    const anterior = entradas[entradas.length - 1];
    if (!m.ocular && anterior && m.de - anterior.m.ate < 1.5 && anterior.posicao === padrao)
      padrao = padrao === "topo-direita" ? "baixo-direita" : padrao === "baixo-direita" ? "topo-direita" : ultimoAlto === "topo-direita" ? "baixo-direita" : "topo-direita";
    if (padrao !== "meio-direita") ultimoAlto = padrao;
    k++;
    const posicao: PosicaoOcular = m.ocular && OCULARES[m.ocular] ? posicaoDeitada(m.ocular) : padrao;
    const ocular = OCULARES[posicao];
    // a luneta anda pelo céu de fundo a cada entrada (alternando para baixo e para cima)
    if (entradas.length) pan = { x: pan.x + 300, y: pan.y + (entradas.length % 2 ? 1700 : -1700) };
    const ultimo = blocos[blocos.length - 1];
    const inicio = noCorte(m.de, cortes);
    const entrada: Entrada = { m, ocular, posicao, inicio, pan };
    entradas.push(entrada);
    if (ultimo && m.de - ultimo.ate < 1.5) {
      ultimo.ate = Math.max(ultimo.ate, m.ate);
      ultimo.cartas.push(entrada);
    } else blocos.push({ de: inicio, ate: m.ate, cartas: [entrada] });
  }
  for (const b of blocos) b.ate = noCorte(b.ate, cortes);

  const chaves: Chave[] = [];
  const focos: Alvo[] = [];
  const passos: Cena["passos"] = [];
  for (const b of blocos) {
    b.cartas.forEach(({ m: mc, ocular, inicio }, i) => {
      if (!ehCarta(mc)) return;
      const m = mc;
      const ordem = [...m.passos].sort((a, c) => a.em - c.em);
      let ids = m.enquadrar?.length ? [...m.enquadrar] : elementosDoPasso(ordem[0] ?? ({ acao: "afastar", em: 0 } as Passo));
      let fator = 1;
      // alvos com rosa dos ventos precisam de espaço em volta
      const folgas: Record<string, number> = {};
      for (const p of ordem) if (p.acao === "prolongar" && p.marca?.rosa) folgas[p.alvo] = 120;
      const empurrar = direcaoDoAlvo(mundo, ids, ordem);
      chaves.push({ em: i === 0 ? b.de - 5 : inicio, dur: i === 0 ? 0.01 : 0.7, alvo: enquadrar(mundo, ids, ocular, fator, empurrar) });
      let ultimo = chaves[chaves.length - 1].alvo;
      for (const p of ordem) {
        passos.push({ p, m, ocular, fim: m.ate });
        const novos = elementosDoPasso(p).filter((id) => !ids.includes(id));
        if (p.acao === "afastar") fator *= p.fator ?? 0.62;
        ids = [...ids, ...novos];
        const alvo = enquadrar(mundo, ids, ocular, fator, ids.some((id) => ordem.some((x) => x.acao === "prolongar" && x.alvo === id)) ? undefined : empurrar, folgas);
        const mudou = Math.abs(Math.log(alvo.s / ultimo.s)) > 0.04 || Math.hypot(alvo.cx - ultimo.cx, alvo.cy - ultimo.cy) * alvo.s > 24;
        if (mudou) {
          const dur = p.acao === "prolongar" ? Math.max(0.6, (p.chegaEm ?? p.em + 1.2) - p.em) : p.acao === "afastar" ? 1.1 : 0.9;
          chaves.push({ em: p.em, dur, alvo });
          ultimo = alvo;
        }
        // o localizador vai para o que acabou de ser dito
        if (p.acao === "prolongar") {
          focos.push({ em: p.em, ids: [p.ate], ponta: { de: p.em, ate: p.chegaEm ?? p.em + 1.2, a: p.ate, b: p.alvo } });
          focos.push({ em: p.chegaEm ?? p.em + 1.2, ids: [p.alvo] });
        } else if (p.acao === "apontar") {
          focos.push({ em: p.em, ids: [p.de, p.por] });
          focos.push({ em: p.textoEm ?? p.em + 0.8, ids: [p.alvo] });
        } else if (p.acao === "acender") {
          p.estrelas.forEach((_, j) => focos.push({ em: p.em + j * (p.ritmo ?? 0.45), ids: p.estrelas.slice(0, j + 1) }));
        } else if (p.acao === "ligar") {
          focos.push({ em: p.em, ids: p.linhas.flat() });
        } else if (p.acao === "destacar") {
          focos.push({ em: p.em, ids: [] });
        } else if (p.acao !== "afastar" && p.acao !== "rumo") {
          focos.push({ em: p.em, ids: elementosDoPasso(p) });
        }
      }
    });
  }
  chaves.sort((a, b) => a.em - b.em);
  focos.sort((a, b) => a.em - b.em);
  return {
    mundo,
    blocos,
    chaves,
    focos,
    passos,
    ajusteOcular: ajusteDaOcular(plano),
    entradas,
  };
};

// Enquadramento da pessoa na ocular. No quadro deitado o `zoom` diz quanto o rosto ocupa do círculo
// (0,5 = o rosto com ~45% da largura da ocular; 0,3 a 0,7), medido pela largura do rosto no rastreio
// (fração da largura do quadro; ~13% numa gravação deitada comum): gravação de perto afasta, de longe
// aproxima, e a cabeça sempre cabe no círculo.
const ajusteDaOcular = (plano: Plano) => {
  const medida = (plano.rosto as { rastro?: { largura?: number } }).rastro?.largura;
  const largura = medida && medida > 0.03 ? medida : 0.13;
  return { zoom: limitar(plano.ocular?.zoom ?? 0.5, 0.2, 0.8), alturaRosto: plano.ocular?.alturaRosto ?? 0.45, largura };
};

// ---------------------------------------------------------------- a luneta no céu de fundo

const DUR_TROCA = 0.7;
// deriva lenta da câmera (px/s): nada fica parado
const DERIVA = 2.2;

// Onde a luneta está apontada (px no céu de fundo): anda junto com cada troca de entrada dentro de um
// bloco; entre blocos (pessoa em tela cheia, o céu escondido) já pula para o lugar.
export const panNoTempo = (cena: Cena, t: number): P => {
  let p: P = { x: 0, y: 0 };
  for (const b of cena.blocos) {
    if (t < b.de - 0.05) break;
    b.cartas.forEach((c, i) => {
      if (i === 0) p = c.pan;
      else if (t >= c.inicio) {
        const u = prog(t, c.inicio, DUR_TROCA, gira);
        p = { x: mistura(p.x, c.pan.x, u), y: mistura(p.y, c.pan.y, u) };
      }
    });
  }
  return { x: p.x, y: p.y + DERIVA * t };
};

// Deslocamento (px) do conteúdo de uma entrada na tela: zero quando a luneta está apontada para ela;
// durante a troca, o que sai e o que entra deslizam juntos com o céu.
export const deslocamento = (cena: Cena, e: Entrada, t: number): P => {
  const agora = panNoTempo(cena, t);
  const assenta = e.inicio + DUR_TROCA;
  return { x: e.pan.x - agora.x, y: e.pan.y + DERIVA * assenta - agora.y };
};

// o fim de cada entrada (a próxima do mesmo bloco, ou o fim do bloco)
export const fimDaEntrada = (cena: Cena, e: Entrada) => {
  for (const b of cena.blocos) {
    const i = b.cartas.indexOf(e);
    if (i >= 0) return b.cartas[i + 1]?.inicio ?? b.ate;
  }
  return e.m.ate;
};
export const blocoDaEntrada = (cena: Cena, e: Entrada) => cena.blocos.find((b) => b.cartas.includes(e))!;

// a entrada vigente (a última que já começou), para a carta saber se é a vez dela
export const entradaNoTempo = (cena: Cena, t: number): Entrada | null => {
  let e: Entrada | null = null;
  for (const x of cena.entradas) if (t >= x.inicio - 0.05) e = x;
  return e;
};

// ---------------------------------------------------------------- câmera da carta

const misturarVista = (a: Vista, b: Vista, u: number): Vista => ({
  cx: mistura(a.cx, b.cx, u),
  cy: mistura(a.cy, b.cy, u),
  s: Math.exp(mistura(Math.log(a.s), Math.log(b.s), u)),
  ax: mistura(a.ax, b.ax, u),
  ay: mistura(a.ay, b.ay, u),
});

export const vistaNoTempo = (cena: Cena, t: number): Vista => {
  const { chaves } = cena;
  if (!chaves.length) return { cx: 0.5, cy: 0.5, s: 600, ax: QUADRO.x + QUADRO.w / 2, ay: QUADRO.y + QUADRO.h / 2 };
  let atual = chaves[0].alvo;
  let fimUltima = chaves[0].em;
  for (let i = 1; i < chaves.length; i++) {
    const c = chaves[i];
    if (t < c.em) break;
    atual = misturarVista(atual, c.alvo, prog(t, c.em, c.dur, gira));
    fimUltima = c.em + c.dur;
  }
  // deriva lenta enquanto a câmera "descansa" (nada fica parado)
  const deriva = 1 + 0.035 * limitar((t - fimUltima) / 6);
  return { ...atual, s: atual.s * deriva };
};

// ---------------------------------------------------------------- localizador (círculo vermelho)

const pontoMedio = (mundo: Mundo, ids: string[]) => {
  const pts = ids.map((id) => mundo.astros[id]).filter(Boolean);
  if (!pts.length) return null;
  const x0 = Math.min(...pts.map((p) => p.x));
  const x1 = Math.max(...pts.map((p) => p.x));
  const y0 = Math.min(...pts.map((p) => p.y));
  const y1 = Math.max(...pts.map((p) => p.y));
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, raio: Math.hypot(x1 - x0, y1 - y0) / 2 };
};

// Centro (no mundo) e raio (px) do localizador no instante t
export const localizadorNoTempo = (cena: Cena, t: number, v: Vista): { x: number; y: number; r: number; vis: number } | null => {
  const { focos, mundo } = cena;
  const ativos = focos.filter((f) => f.em <= t);
  if (!ativos.length) return null;
  const alvoDe = (f: Alvo, tt: number) => {
    if (f.ponta && tt < f.ponta.ate) {
      const a = mundo.astros[f.ponta.a];
      const b = mundo.astros[f.ponta.b];
      if (a && b) {
        const u = prog(tt, f.ponta.de, f.ponta.ate - f.ponta.de, gira);
        return { x: mistura(a.x, b.x, u), y: mistura(a.y, b.y, u), r: 62 };
      }
    }
    const m = pontoMedio(mundo, f.ids);
    if (!m) return null;
    return { x: m.x, y: m.y, r: Math.max(64, m.raio * v.s + 52) };
  };
  // foco sem ids = o localizador sai de cena (o destaque já é o próprio desenho)
  let estado = alvoDe(ativos[0], t);
  let vis = estado ? 1 : 0;
  for (let i = 1; i < ativos.length; i++) {
    const alvo = alvoDe(ativos[i], t);
    const u = prog(t, ativos[i].em, 0.55, gira);
    if (!alvo) {
      vis = mistura(vis, 0, prog(t, ativos[i].em, 0.35));
      continue;
    }
    if (!estado || vis < 0.05) {
      estado = alvo;
      vis = mistura(vis, 1, prog(t, ativos[i].em, 0.35));
      continue;
    }
    estado = { x: mistura(estado.x, alvo.x, u), y: mistura(estado.y, alvo.y, u), r: mistura(estado.r, alvo.r, u) };
    vis = mistura(vis, 1, prog(t, ativos[i].em, 0.35));
  }
  return estado ? { ...estado, vis } : null;
};

// ---------------------------------------------------------------- estado da ocular

export type EstadoOcular = {
  // círculo de recorte (px, tela)
  cx: number;
  cy: number;
  R: number;
  // escala do vídeo e onde o rosto cai na tela
  z: number;
  rx: number;
  ry: number;
  // 0 = tela cheia, 1 = janela com anel
  janela: number;
  // true = quadro cheio de verdade (nenhuma troca acontecendo)
  cheio: boolean;
  // giro do anel graduado (graus)
  giro: number;
  // o raio do círculo em tela cheia (passa raspando no canto mais longe do rosto)
  Rcheio: number;
};

type Janela = { cx: number; cy: number; R: number; z: number; rx: number; ry: number };

// O rosto do plano, sempre dizendo em que quadro foi medido (o motor precisa: no 16:9 o cortar grava
// `rosto.quadro`; um plano sem ele vale para o quadro deitado deste modelo).
export const rostoNoQuadro = (plano: Plano): Rosto => {
  const r = plano.rosto as Rosto;
  return r.quadro ? r : { ...r, quadro: { largura: W, altura: H } };
};

export const estadoDaOcular = (cena: Cena, plano: Plano, t: number): EstadoOcular => {
  // o rosto agora (o motor segue a pessoa quando ela se mexe): é em volta dele que a íris fecha e
  // é ele que a janela redonda centraliza
  const rostoPlano = rostoNoQuadro(plano);
  const rosto = pontoDoRosto(rostoPlano, t);
  const altura = plano.videoAltura ?? H;
  // tela cheia: o enquadramento do motor (parado, é o vídeo inteiro; com a pessoa se mexendo,
  // reenquadra de leve) e onde o rosto cai na tela
  const e = enquadrarPessoa({ x: 0, y: 0, w: W, h: altura, zoom: 1, ancoraY: (plano.rosto.y * H) / altura }, rostoPlano, altura, t);
  const rostoX = e.esquerda + rosto.x * e.lv;
  const rostoY = e.topo + ((rosto.y * H) / altura) * e.av;
  // em tela cheia o círculo passa raspando no canto mais longe do rosto: a íris começa a fechar já no
  // primeiro quadro da troca
  const raioCheio = Math.max(...[[0, 0], [W, 0], [0, altura], [W, altura]].map(([x, y]) => Math.hypot(x - rostoX, y - rostoY))) + 4;
  const cheio: Janela = { cx: rostoX, cy: rostoY, R: raioCheio, z: e.escala, rx: rostoX, ry: rostoY };
  const { zoom, alturaRosto, largura } = cena.ajusteOcular;
  const janelaDe = (o: Ocular): Janela => {
    // o rosto com ~0,9 × zoom da largura do círculo, sem nunca deixar borda vazia na ocular
    const z = Math.max((1.8 * zoom * o.R) / (largura * W), (2 * o.R) / W + 0.02, (2 * o.R) / altura + 0.02);
    return { cx: o.cx, cy: o.cy, R: o.R, z, rx: o.cx, ry: o.cy - o.R + 2 * o.R * alturaRosto };
  };
  // fecha a íris em volta do rosto (vídeo parado), depois leva o círculo e o vídeo para a janela
  const iris = (de: Janela, para: Janela, u: number): Janela => {
    const uA = prog(u, 0, 0.5, entra);
    const uB = prog(u, 0.32, 0.68, gira);
    const meio = 330;
    const rA = Math.exp(mistura(Math.log(de.R), Math.log(meio), uA));
    return {
      cx: mistura(de.cx, para.cx, uB),
      cy: mistura(de.cy, para.cy, uB),
      R: mistura(rA, para.R, uB),
      z: mistura(de.z, para.z, uB),
      rx: mistura(de.rx, para.rx, uB),
      ry: mistura(de.ry, para.ry, uB),
    };
  };
  const mover = (a: Janela, b: Janela, u: number): Janela => ({
    cx: mistura(a.cx, b.cx, u),
    cy: mistura(a.cy, b.cy, u),
    R: mistura(a.R, b.R, u),
    z: mistura(a.z, b.z, u),
    rx: mistura(a.rx, b.rx, u),
    ry: mistura(a.ry, b.ry, u),
  });

  let estado = cheio;
  let janela = 0;
  let giro = t * 3;
  for (const b of cena.blocos) {
    if (t < b.de) break;
    const DUR_IRIS = 0.72;
    const u0 = limitar((t - b.de) / DUR_IRIS);
    estado = iris(cheio, janelaDe(b.cartas[0].ocular), u0);
    janela = prog(u0, 0.45, 0.55);
    giro += 40 * prog(t, b.de, 1.2, gira);
    for (const c of b.cartas.slice(1)) {
      if (t < c.inicio) break;
      estado = mover(estado, janelaDe(c.ocular), prog(t, c.inicio, 0.7, gira));
      giro += 30 * prog(t, c.inicio, 0.9, gira);
    }
    if (t >= b.ate) {
      const u1 = limitar((t - b.ate) / 0.7);
      // abre: o caminho inverso da íris
      const ultima = estado;
      estado = iris(cheio, ultima, 1 - u1);
      janela = 1 - prog(u1, 0, 0.5);
    }
  }
  // o vídeo sempre cobre o círculo (sem borda vazia)
  const vw = W * estado.z;
  const vh = altura * estado.z;
  const esquerda = estado.rx - rosto.x * vw;
  const topo = estado.ry - ((rosto.y * H) / altura) * vh;
  const R = estado.R;
  const esquerdaOk = janela > 0 ? Math.min(estado.cx - Math.min(R, W / 2), Math.max(estado.cx + Math.min(R, W / 2) - vw, esquerda)) : esquerda;
  const topoOk = janela > 0 ? Math.min(estado.cy - Math.min(R, H / 2), Math.max(estado.cy + Math.min(R, H / 2) - vh, topo)) : topo;
  return {
    cx: estado.cx,
    cy: estado.cy,
    R,
    z: estado.z,
    rx: esquerdaOk + rosto.x * vw,
    ry: topoOk + ((rosto.y * H) / altura) * vh,
    janela,
    cheio: estado.R >= raioCheio - 1,
    giro,
    Rcheio: raioCheio,
  };
};

// a ocular vigente (para posicionar contador, rosa, legenda)
export const ocularVigente = (cena: Cena, t: number): Ocular | null => {
  for (const b of cena.blocos) {
    if (t < b.de - 0.05 || t > b.ate + 0.9) continue;
    let o = b.cartas[0].ocular;
    for (const c of b.cartas) if (t >= c.inicio) o = c.ocular;
    return o;
  }
  return null;
};

export const blocoNoTempo = (cena: Cena, t: number) => cena.blocos.find((b) => t >= b.de - 0.05 && t < b.ate + 0.9) ?? null;
