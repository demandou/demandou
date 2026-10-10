// O quadro de investigação como um mundo só: cada momento vira uma peça presa num ponto da cortiça
// (as "estações"). As peças ficam em anel em volta de um centro livre (blocos de 3×3): a primeira no
// canto de cima à esquerda, depois em sentido horário. O centro fica para o `destaque` (o veredito):
// quando ele chega, a câmera recua, revela o quadro inteiro e os fios de todas as provas do bloco
// convergem para o carimbo. A câmera viaja de estação em estação em ≤ 0,35 s quando a peça nova é
// dita e um fio vermelho liga o pino da peça nova ao da anterior. As peças ficam presas.
import type { ReactNode } from "react";
import { acaso, limitar, mistura, viaja } from "./anim";
import type { Abertura, Momento, Plano } from "./plano";

// Uma peça desenhada em coordenadas locais (0..w, 0..h). O pino principal é onde o fio prende.
export type Peca = {
  w: number;
  h: number;
  // o pino de cima (a peça chega presa por ele); `ancoras` troca os pontos onde o fio prende
  pino: { x: number; y: number };
  ancoras?: Partial<Record<Lado, { x: number; y: number }>>;
  // pontos (locais) que a câmera mira depois de chegar, cada um a partir do seu `em`
  focos?: { em: number; x: number; y: number }[];
  // instantes de carimbo (o quadro treme de leve e o som bate)
  batidas?: number[];
  sons?: Som[];
  // multiplica o enquadramento (1 = o padrão)
  zoom?: number;
  desenhar: (t: number) => ReactNode;
};

export type Som = { em: number; arquivo: string; volume: number };
export type Lado = "topo" | "baixo" | "esq" | "dir";

// os pontos onde o fio prende: o pino de cima, a base e os dois cantos de cima
export const ancorasDa = (p: Peca): Record<Lado, { x: number; y: number }> => ({
  topo: p.ancoras?.topo ?? p.pino,
  baixo: p.ancoras?.baixo ?? { x: p.w / 2, y: p.h - 24 },
  esq: p.ancoras?.esq ?? { x: 36, y: p.pino.y },
  dir: p.ancoras?.dir ?? { x: p.w - 36, y: p.pino.y },
});

export type Estacao = {
  chave: string;
  x: number;
  y: number;
  rot: number;
  chegada: number;
  // a peça sai (a pasta do começo é trocada pela pasta do fechamento)
  some?: number;
  // false = já estava no quadro (sem animação de chegada)
  assenta: boolean;
  peca: Peca;
  z: number;
  tipo: Momento["tipo"];
  m: Momento;
  bloco: number;
  // o destaque no centro do bloco: a câmera revela o quadro inteiro
  revela: boolean;
};

export type Parada = {
  estacao: number;
  inicio: number;
  chegada: number;
  fim: number;
  x: number;
  y: number;
  z: number;
  focos: { em: number; x: number; y: number }[];
  // no quadro inteiro, a câmera aproxima devagar do destaque (o centro) enquanto segura
  alvo?: { x: number; y: number };
};
export type Fio = { a: { x: number; y: number }; b: { x: number; y: number }; de: number; ate: number; fino?: boolean };
export type PinoNoMundo = { x: number; y: number; em: number };
export type Roteiro = {
  estacoes: Estacao[];
  paradas: Parada[];
  fios: Fio[];
  pinos: PinoNoMundo[];
  batidas: number[];
  sons: Som[];
  limites: { x0: number; y0: number; x1: number; y1: number };
};

export type Fabrica = {
  peca: (m: Momento, plano: Plano, extra: { letra: number; fim: number; abertura?: Abertura }) => { chegada: number; peca: Peca; chave: string }[];
};

// o anel de 3×3 (sentido horário a partir do canto de cima à esquerda); o centro fica livre
const ANEL: [number, number][] = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
// distância entre as peças: perto o bastante para as vizinhas aparecerem cortadas nas bordas
const PASSO_X = 1040;
const PASSO_Y = 1100;
const BLOCO_X = 3 * PASSO_X + 700;
// a câmera mostra a peça atual a ~80% da área segura (as vizinhas e o fio aparecem em volta)
const ABERTO = 0.8;
// viagem entre peças
const VIAGEM = 0.35;

// área útil do quadro em volta do FOCO (px de tela), já descontada a deriva de 4,5%
const UTIL_W = 904;
const UTIL_H = 806;
const girado = (w: number, h: number, rot: number) => {
  const r = (Math.abs(rot) * Math.PI) / 180;
  return { w: w * Math.cos(r) + h * Math.sin(r), h: h * Math.cos(r) + w * Math.sin(r) };
};
const zoomDaPeca = (p: Peca, rot: number) => {
  const g = girado(p.w, p.h, rot);
  return (limitar(Math.min(UTIL_W / g.w, UTIL_H / g.h) * (p.zoom ?? 1), 0.5, 1.35) / 1.045) * ABERTO;
};

const girar = (x: number, y: number, rot: number) => {
  const r = (rot * Math.PI) / 180;
  return { x: x * Math.cos(r) - y * Math.sin(r), y: x * Math.sin(r) + y * Math.cos(r) };
};
// ponto local da peça → mundo
export const noMundo = (e: Estacao, x: number, y: number) => {
  const g = girar(x - e.peca.w / 2, y - e.peca.h / 2, e.rot);
  return { x: e.x + g.x, y: e.y + g.y };
};

export const montarRoteiro = (plano: Plano, fabrica: Fabrica): Roteiro => {
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const abertura = momentos.find((m) => m.tipo === "abertura") as Abertura | undefined;
  const estacoes: Estacao[] = [];
  const ordem: number[] = []; // índice da estação de cada parada, na ordem do tempo
  let letra = 0;
  // estado do anel
  let bloco = 0;
  let noAnel = 0;
  let centroLivre = true;
  let noBloco = 0;
  let k = 0;
  const lugar = (tipo: Momento["tipo"]) => {
    let cel: [number, number];
    let revela = false;
    if (tipo === "destaque" && centroLivre && noBloco >= 3) {
      cel = [0, 0];
      centroLivre = false;
      revela = true;
    } else if (noAnel < ANEL.length) cel = ANEL[noAnel++];
    else if (centroLivre) {
      cel = [0, 0];
      centroLivre = false;
    } else {
      bloco++;
      noAnel = 0;
      centroLivre = true;
      noBloco = 0;
      cel = ANEL[noAnel++];
    }
    noBloco++;
    k++;
    const jx = revela ? 0 : (acaso(k * 3 + 1) - 0.5) * 70;
    const jy = revela ? 0 : (acaso(k * 3 + 2) - 0.5) * 60;
    return { x: bloco * BLOCO_X + cel[0] * PASSO_X + jx, y: cel[1] * PASSO_Y + jy, rot: (acaso(k * 3 + 3) - 0.5) * (revela ? 2 : 4), revela };
  };

  momentos.forEach((m, i) => {
    const fim = momentos[i + 1]?.de ?? plano.duracao;
    const pecas = fabrica.peca(m, plano, { letra, fim, abertura });
    if (m.tipo === "quadro") letra += m.evidencias.length;
    for (const p of pecas) {
      // o fechamento volta para a pasta do começo (a câmera retorna; a capa fecha)
      const volta = m.tipo === "cta" && abertura && m === momentos[momentos.length - 1];
      const iAbertura = volta ? estacoes.findIndex((e) => e.tipo === "abertura") : -1;
      if (iAbertura >= 0) {
        const base = estacoes[iAbertura];
        base.some = p.chegada;
        estacoes.push({ chave: p.chave, x: base.x, y: base.y, rot: base.rot, chegada: p.chegada, assenta: false, peca: p.peca, z: zoomDaPeca(p.peca, base.rot), tipo: m.tipo, m, bloco: base.bloco, revela: false });
      } else {
        const pos = lugar(m.tipo);
        estacoes.push({ chave: p.chave, x: pos.x, y: pos.y, rot: pos.rot, chegada: p.chegada, assenta: true, peca: p.peca, z: zoomDaPeca(p.peca, pos.rot), tipo: m.tipo, m, bloco, revela: pos.revela });
      }
      ordem.push(estacoes.length - 1);
    }
  });

  // as paradas da câmera
  const paradas: Parada[] = [];
  ordem.forEach((iE, n) => {
    const e = estacoes[iE];
    let x = e.x;
    let y = e.y;
    let z = e.z;
    let focos: Parada["focos"] = [];
    if (e.revela) {
      // o quadro inteiro do bloco (as peças já presas + o destaque), com as bordas de fora podendo cortar
      const doBloco = estacoes.filter((o, j) => o.bloco === e.bloco && o.assenta && (j === iE || o.chegada <= e.chegada));
      const x0 = Math.min(...doBloco.map((o) => o.x - girado(o.peca.w, o.peca.h, o.rot).w / 2));
      const x1 = Math.max(...doBloco.map((o) => o.x + girado(o.peca.w, o.peca.h, o.rot).w / 2));
      const y0 = Math.min(...doBloco.map((o) => o.y - girado(o.peca.w, o.peca.h, o.rot).h / 2));
      const y1 = Math.max(...doBloco.map((o) => o.y + girado(o.peca.w, o.peca.h, o.rot).h / 2));
      x = (x0 + x1) / 2;
      y = (y0 + y1) / 2;
      z = (Math.min(1080 / (x1 - x0), 1040 / (y1 - y0)) * 1.04) / 1.045;
    } else {
      // a câmera só puxa um pouco para o foco, e só o tanto que a peça continua inteira na área segura
      const g = girado(e.peca.w, e.peca.h, e.rot);
      const folgaX = Math.max(0, (952 - g.w * e.z * 1.045) / 2 - 12) / e.z;
      const folgaY = Math.max(0, (876 - g.h * e.z * 1.045) / 2 - 12) / e.z;
      focos = (e.peca.focos ?? []).map((f) => {
        const w = noMundo(e, f.x, f.y);
        return { em: f.em, x: e.x + limitar((w.x - e.x) * 0.32, -folgaX, folgaX), y: e.y + limitar((w.y - e.y) * 0.32, -folgaY, folgaY) };
      });
    }
    // a viagem sai o mais tarde possível (a peça anterior fica mais tempo na tela), dura no máximo
    // 0,35 s e termina logo depois da palavra: a peça nova assenta na palavra
    let inicio = e.chegada;
    let fim = e.chegada;
    if (n > 0) {
      const ant = paradas[n - 1];
      fim = e.chegada + 0.08;
      inicio = Math.max(ant.fim + 0.3, fim - VIAGEM);
      if (fim - inicio < 0.22) inicio = fim - 0.22;
    }
    paradas.push({ estacao: iE, inicio, chegada: e.chegada, fim, x, y, z, focos, alvo: e.revela ? { x: e.x, y: e.y } : undefined });
  });

  // os fios: a peça nova liga à anterior; no destaque do centro, os fios de todas as peças do bloco
  // convergem para ele. O fio prende no pino do lado de onde vem a outra peça (cantos de cima para
  // vizinhas do lado, base/topo para vizinhas de cima e de baixo): ele corre pela cortiça.
  const fios: Fio[] = [];
  const pinos: PinoNoMundo[] = [];
  const ancora = (iE: number, lado: Lado) => {
    const e = estacoes[iE];
    const a = ancorasDa(e.peca)[lado];
    return noMundo(e, a.x, a.y);
  };
  const ladosEntre = (iA: number, iB: number): [Lado, Lado] => {
    const A = estacoes[iA];
    const B = estacoes[iB];
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    if (dy > 0.6 * Math.abs(dx)) return ["baixo", "topo"];
    if (dy < -0.6 * Math.abs(dx)) return ["topo", "baixo"];
    return dx >= 0 ? ["dir", "esq"] : ["esq", "dir"];
  };
  // o segmento passa por cima de alguma outra peça?
  const atravessa = (a: { x: number; y: number }, b: { x: number; y: number }, fora: number[]) =>
    estacoes.some((e, i) => {
      if (fora.includes(i) || !e.assenta) return false;
      const mw = e.peca.w / 2 + 16;
      const mh = e.peca.h / 2 + 16;
      for (let s = 1; s < 24; s++) {
        const x = mistura(a.x, b.x, s / 24);
        const y = mistura(a.y, b.y, s / 24);
        if (Math.abs(x - e.x) < mw && Math.abs(y - e.y) < mh) return true;
      }
      return false;
    });
  const pinoVisto = new Set<string>();
  const cravar = (iE: number, lado: Lado, em: number) => {
    const chave = `${Math.round(estacoes[iE].x)},${Math.round(estacoes[iE].y)}:${lado}`;
    if (pinoVisto.has(chave)) return;
    pinoVisto.add(chave);
    const p = ancora(iE, lado);
    pinos.push({ x: p.x, y: p.y, em });
  };
  // toda peça nova chega presa pelo pino de cima
  estacoes.forEach((e, iE) => {
    if (e.assenta) cravar(iE, "topo", e.chegada);
  });
  paradas.forEach((par, n) => {
    if (n === 0) return;
    const iA = paradas[n - 1].estacao;
    const iB = par.estacao;
    const [la, lb] = ladosEntre(iA, iB);
    // o pino da peça nova é cravado quando a câmera sai; o fio estica até ele e chega na palavra
    cravar(iA, la, par.inicio);
    cravar(iB, lb, par.inicio + 0.03);
    fios.push({ a: ancora(iA, la), b: ancora(iB, lb), de: par.inicio + 0.04, ate: par.chegada });
    const e = estacoes[iB];
    if (e.revela) {
      // todas as peças do bloco já presas mandam fio para o destaque (se o fio não atravessar papel)
      const antes = paradas
        .slice(0, n - 1)
        .map((q) => q.estacao)
        .filter((i) => estacoes[i].bloco === e.bloco && estacoes[i].assenta && i !== iA);
      let j = 0;
      for (const i of antes) {
        const [l1, l2] = ladosEntre(i, iB);
        const a = ancora(i, l1);
        const b = ancora(iB, l2);
        if (atravessa(a, b, [i, iB])) continue;
        cravar(i, l1, par.inicio);
        cravar(iB, l2, par.inicio + 0.03);
        fios.push({ a, b, de: par.inicio + 0.1 + j * 0.07, ate: par.chegada + 0.32 + j * 0.08, fino: true });
        j++;
      }
    }
  });

  // carimbos e sons
  const batidas = estacoes.flatMap((e) => e.peca.batidas ?? []).sort((a, b) => a - b);
  const sons: Som[] = [];
  paradas.forEach((par, n) => {
    if (n > 0) sons.push({ em: par.chegada - 0.05, arquivo: "sfx/fio.wav", volume: 0.26 });
  });
  for (const e of estacoes) sons.push(...(e.peca.sons ?? []));
  for (const b of batidas) sons.push({ em: b, arquivo: "sfx/carimbo.wav", volume: 0.46 });
  const ordenados = sons.sort((a, b) => a.em - b.em);
  const filtrados: Som[] = [];
  for (const s of ordenados) {
    const ultimo = filtrados[filtrados.length - 1];
    if (!ultimo || s.em - ultimo.em > 0.32) filtrados.push(s);
    else if (s.arquivo === "sfx/carimbo.wav") filtrados[filtrados.length - 1] = s; // o carimbo vence
  }

  const xs = estacoes.map((e) => e.x);
  const ys = estacoes.map((e) => e.y);
  const M = 2600;
  return {
    estacoes,
    paradas,
    fios,
    pinos,
    batidas,
    sons: filtrados,
    limites: { x0: Math.min(...xs, 0) - M, y0: Math.min(...ys, 0) - M, x1: Math.max(...xs, 0) + M, y1: Math.max(...ys, 0) + M },
  };
};

// ——— a câmera ———

// Onde a câmera está parada em `par` no instante t: o centro da peça (ou o foco atual) e a deriva lenta
// (aproxima 4,5% ao longo de ~3 s e anda poucos px): nada fica parado.
const parado = (par: Parada, t: number, n: number) => {
  let x = par.x;
  let y = par.y;
  for (const f of par.focos) {
    const p = viaja(limitar((t - f.em + 0.1) / 0.55));
    x = mistura(x, f.x, p);
    y = mistura(y, f.y, p);
  }
  if (par.alvo) {
    // o quadro inteiro: aproxima 22% em ~2,6 s, puxando para o destaque no centro
    const d = viaja(limitar((t - par.fim - 0.15) / 2.6));
    return { x: mistura(x, par.alvo.x, 0.6 * d), y: mistura(y, par.alvo.y, 0.6 * d), z: par.z * (1 + 0.22 * d) };
  }
  const d = limitar((t - par.fim) / 3.2);
  const ang = acaso(n + 17) * Math.PI * 2;
  return { x: x + Math.cos(ang) * 10 * d, y: y + Math.sin(ang) * 8 * d, z: par.z * (1 + 0.045 * d) };
};

export const cameraEm = (r: Roteiro, t: number) => {
  const ps = r.paradas;
  if (!ps.length) return { x: 0, y: 0, z: 1 };
  let n = 0;
  for (let i = 0; i < ps.length; i++) if (t >= ps[i].inicio) n = i;
  const par = ps[n];
  if (n === 0 || t >= par.fim) return parado(par, Math.max(t, par.fim), n);
  // viajando da parada anterior para esta (a escala anda em proporção, sem "respirar")
  const ant = ps[n - 1];
  const A = parado(ant, par.inicio, n - 1);
  const B = parado(par, par.fim, n);
  const p = limitar((t - par.inicio) / Math.max(0.01, par.fim - par.inicio));
  const e = viaja(p);
  const dist = Math.hypot(B.x - A.x, B.y - A.y);
  const mergulho = Math.abs(B.z - A.z) > 0.15 ? 0 : limitar((dist / 1080) * 0.07, 0.02, 0.12);
  return { x: mistura(A.x, B.x, e), y: mistura(A.y, B.y, e), z: Math.exp(mistura(Math.log(A.z), Math.log(B.z), e)) * (1 - mergulho * Math.sin(Math.PI * p)) };
};

// Velocidade da câmera na tela (px por quadro, em x e y) para o desfoque de movimento das viagens.
export const borrao = (r: Roteiro, t: number, fps: number) => {
  const a = cameraEm(r, t - 0.5 / fps);
  const b = cameraEm(r, t + 0.5 / fps);
  const z = (a.z + b.z) / 2;
  const dz = (Math.abs(b.z - a.z) / z) * 260;
  return { x: Math.abs(b.x - a.x) * z + dz, y: Math.abs(b.y - a.y) * z + dz };
};

// Tremor curto do quadro quando o carimbo bate (px de tela).
export const tremor = (r: Roteiro, t: number) => {
  let y = 0;
  for (const b of r.batidas) {
    const d = t - b;
    if (d >= 0 && d < 0.3) y += 7 * Math.exp(-d * 16) * Math.sin(d * 75);
  }
  return y;
};

// Curva do fio (quadrática com barriga de barbante para baixo). Enquanto estica, a barriga é maior;
// quando chega no pino, ela fica a leve curvinha do barbante preso.
export const curvaDoFio = (a: { x: number; y: number }, b: { x: number; y: number }, s = 1) => {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const barriga = Math.min(80, dist * 0.055) * (1.7 - 0.7 * s);
  const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + barriga };
  return { a, c, b };
};
export const pedacoDoFio = (f: { a: { x: number; y: number }; c: { x: number; y: number }; b: { x: number; y: number } }, s: number) => {
  const l = (p: { x: number; y: number }, q: { x: number; y: number }) => ({ x: mistura(p.x, q.x, s), y: mistura(p.y, q.y, s) });
  const c1 = l(f.a, f.c);
  const fim = l(c1, l(f.c, f.b));
  return `M ${f.a.x.toFixed(1)} ${f.a.y.toFixed(1)} Q ${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${fim.x.toFixed(1)} ${fim.y.toFixed(1)}`;
};
