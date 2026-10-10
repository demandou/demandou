// O esqueleto em perfil (olhando para a direita), em centímetros, com o chão em y = 0 e y para cima.
// Uma `Postura` descreve ângulos e alvos; `juntas()` calcula onde fica cada osso (cinemática direta
// para coluna e cabeça, inversa de dois ossos para braços e pernas quando há um alvo).

export type V = { x: number; y: number };
export const v = (x: number, y: number): V => ({ x, y });
export const soma = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y });
export const menos = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y });
export const vezes = (a: V, k: number): V => ({ x: a.x * k, y: a.y * k });
export const comp = (a: V) => Math.hypot(a.x, a.y);
export const unit = (a: V): V => {
  const l = comp(a) || 1;
  return { x: a.x / l, y: a.y / l };
};
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const mixV = (a: V, b: V, p: number): V => ({ x: mix(a.x, b.x, p), y: mix(a.y, b.y, p) });
const RAD = Math.PI / 180;
// gira no sentido anti-horário (y para cima)
export const girar = (a: V, graus: number): V => {
  const c = Math.cos(graus * RAD);
  const s = Math.sin(graus * RAD);
  return { x: a.x * c - a.y * s, y: a.x * s + a.y * c };
};
// direção a `graus` da vertical para baixo, girando para a frente (+x): 0 = para baixo, 90 = para a frente
export const deBaixo = (graus: number): V => ({ x: Math.sin(graus * RAD), y: -Math.cos(graus * RAD) });
// direção a `graus` da vertical para cima, inclinando para a frente: 0 = para cima
export const deCima = (graus: number): V => ({ x: Math.sin(graus * RAD), y: Math.cos(graus * RAD) });
// ângulo (graus, 0–180) entre dois vetores
export const anguloEntre = (a: V, b: V) => {
  const c = (a.x * b.x + a.y * b.y) / ((comp(a) || 1) * (comp(b) || 1));
  return Math.acos(Math.max(-1, Math.min(1, c))) / RAD;
};

// Comprimentos (cm)
export const OSSO = {
  coxa: 44,
  canela: 43,
  braco: 29,
  antebraco: 25,
  lombar: 19,
  toracica: 30,
  cervical: 13,
  // altura do tornozelo com o pé no chão
  tornozelo: 6.5,
};

// Pernas: por ângulos (coxa a partir da vertical para baixo, + para a frente; joelho = flexão;
// pe = flexão plantar relativa) ou por alvo (tornozelo num ponto, pé numa direção absoluta).
export type Perna = { coxa: number; joelho: number; pe: number } | { tornozelo: V; peAbs?: number };
// Braços: por alvo do punho (cinemática inversa, cotovelo para baixo) ou por ângulos.
export type Braco = { punho: V; mao?: number } | { braco: number; cotovelo: number; mao?: number };

export type Postura = {
  quadril: V;
  // báscula da pelve (+ = para trás, como quem escorrega na cadeira)
  pelve: number;
  // inclinação de cada trecho da coluna a partir da vertical (+ = para a frente)
  lombar: number;
  toracica: number;
  cervical: number;
  // inclinação da cabeça (+ = queixo para baixo)
  cabeca: number;
  // curvaturas (cm): lordose lombar (+ para a frente), cifose torácica (+ para trás), lordose cervical
  lordose: number;
  cifose: number;
  lordoseCervical: number;
  perna: Perna;
  perna2: Perna;
  braco: Braco;
  braco2: Braco;
};

export type PernaJ = { quadril: V; joelho: V; tornozelo: V; calcanhar: V; planta: V; dedos: V; pe: V };
export type BracoJ = { ombro: V; cotovelo: V; punho: V; mao: V; dedos: V };
export type Vertebra = { p: V; t: V; n: V; nivel: "l" | "t" | "c" };
export type Juntas = {
  quadril: V;
  pelve: number;
  sacro: V;
  l1: V;
  c7: V;
  c1: V;
  curva: V[];
  vertebras: Vertebra[];
  cabeca: number;
  olho: V;
  orelha: V;
  ombro: V;
  // ponto da lombar (L3) e do pescoço (C4), por trás da coluna: onde a tensão acende
  pontoLombar: V;
  pontoPescoco: V;
  pontoOmbro: V;
  perna: PernaJ;
  perna2: PernaJ;
  braco: BracoJ;
  braco2: BracoJ;
  // tronco (para costelas e esterno): eixo torácico
  toracicaDir: V;
};

// ---------- crânio (coordenadas locais em cm: x para a frente, y para cima, origem no atlas) ----------
export const CRANIO = {
  olho: v(7.6, 8.4),
  orelha: v(0.6, 4.6),
};
export const posCranio = (c1: V, cabeca: number, local: V) => soma(c1, girar(local, -cabeca));

// ---------- cinemática ----------

// dois ossos: raiz, alvo, comprimentos; `lado` = 1 dobra para a frente (joelho), -1 para baixo/trás (cotovelo)
const doisOssos = (raiz: V, alvo: V, a: number, b: number, lado: 1 | -1) => {
  const d0 = menos(alvo, raiz);
  const d = Math.min(Math.max(comp(d0), Math.abs(a - b) + 0.01), a + b - 0.01);
  const u = unit(d0);
  const cosA = (a * a + d * d - b * b) / (2 * a * d);
  const ang = (Math.acos(Math.max(-1, Math.min(1, cosA))) / RAD) * lado;
  const meio = soma(raiz, vezes(girar(u, ang), a));
  const fim = soma(meio, vezes(unit(menos(alvo, meio)), b));
  return { meio, fim };
};

// Pé: tornozelo, direção do pé (a partir da vertical para baixo; 90 = reto para a frente).
// O pé nunca entra no chão: se a planta ou o calcanhar descem abaixo dele, o pé gira até encostar.
const montarPe = (tornozelo: V, peAbs: number, chao: number | null) => {
  let a = peAbs;
  const pontos = (ang: number) => {
    const f = deBaixo(ang);
    const up = girar(f, 90);
    return {
      calcanhar: soma(tornozelo, soma(vezes(f, -5), vezes(up, -6.3))),
      planta: soma(tornozelo, soma(vezes(f, 12.5), vezes(up, -6.1))),
    };
  };
  if (chao !== null) {
    for (let i = 0; i < 40; i++) {
      const p = pontos(a);
      if (p.planta.y < chao + 0.15) a += 2;
      else if (p.calcanhar.y < chao + 0.15) a -= 2;
      else break;
    }
  }
  const { calcanhar, planta } = pontos(a);
  // os dedos dobram na planta e nunca apontam para dentro do chão
  const dedos = soma(planta, vezes(deBaixo(Math.max(a, 86)), 5.6));
  return { calcanhar, planta, dedos, pe: deBaixo(a) };
};

const montarPerna = (quadril: V, p: Perna, chao: number | null): PernaJ => {
  if ("tornozelo" in p) {
    const { meio: joelho, fim: tornozelo } = doisOssos(quadril, p.tornozelo, OSSO.coxa, OSSO.canela, 1);
    return { quadril, joelho, tornozelo, ...montarPe(tornozelo, p.peAbs ?? 90, chao) };
  }
  const joelho = soma(quadril, vezes(deBaixo(p.coxa), OSSO.coxa));
  const canela = p.coxa - p.joelho;
  const tornozelo = soma(joelho, vezes(deBaixo(canela), OSSO.canela));
  return { quadril, joelho, tornozelo, ...montarPe(tornozelo, canela + 90 - p.pe, chao) };
};

const montarBraco = (ombro: V, b: Braco): BracoJ => {
  let cotovelo: V;
  let punho: V;
  if ("punho" in b) {
    const r = doisOssos(ombro, b.punho, OSSO.braco, OSSO.antebraco, -1);
    cotovelo = r.meio;
    punho = r.fim;
  } else {
    cotovelo = soma(ombro, vezes(deBaixo(b.braco), OSSO.braco));
    punho = soma(cotovelo, vezes(deBaixo(b.braco + b.cotovelo), OSSO.antebraco));
  }
  // a mão segue o antebraço, um pouco caída (como sobre o teclado)
  const dirAnte = unit(menos(punho, cotovelo));
  const queda = b.mao ?? 14;
  const mao = soma(punho, vezes(girar(dirAnte, -queda), 8));
  const dedos = soma(mao, vezes(girar(dirAnte, -queda - 26), 6.5));
  return { ombro, cotovelo, punho, mao, dedos };
};

// Curva suave (Catmull-Rom) por pontos, amostrada com `n` passos por trecho
const catmull = (pts: V[], n: number) => {
  const saida: V[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      saida.push(v(f(p0.x, p1.x, p2.x, p3.x), f(p0.y, p1.y, p2.y, p3.y)));
    }
  }
  saida.push(pts[pts.length - 1]);
  return saida;
};

// pontos ao longo de um trecho de polilinha, por comprimento de arco
const aoLongo = (linha: V[], fracoes: number[]) => {
  const acum = [0];
  for (let i = 1; i < linha.length; i++) acum.push(acum[i - 1] + comp(menos(linha[i], linha[i - 1])));
  const total = acum[acum.length - 1];
  return fracoes.map((f) => {
    const alvo = f * total;
    let i = 1;
    while (i < linha.length - 1 && acum[i] < alvo) i++;
    const seg = acum[i] - acum[i - 1] || 1;
    const k = (alvo - acum[i - 1]) / seg;
    const p = mixV(linha[i - 1], linha[i], k);
    const t = unit(menos(linha[i], linha[i - 1]));
    // normal anterior: a tangente girada 90° no sentido horário (aponta para a frente do corpo)
    const n = v(t.y, -t.x);
    return { p, t, n };
  });
};

export const juntas = (q: Postura, chao: number | null = 0): Juntas => {
  const sacro = soma(q.quadril, girar(v(-7, 8.1), q.pelve));
  const l1 = soma(sacro, vezes(deCima(q.lombar), OSSO.lombar));
  const c7 = soma(l1, vezes(deCima(q.toracica), OSSO.toracica));
  const c1 = soma(c7, vezes(deCima(q.cervical), OSSO.cervical));
  // pontos médios deslocados pela curvatura de cada trecho
  const anterior = (graus: number) => v(Math.cos(graus * RAD), -Math.sin(graus * RAD));
  const lMeio = soma(mixV(sacro, l1, 0.5), vezes(anterior(q.lombar), q.lordose));
  const tMeio = soma(mixV(l1, c7, 0.5), vezes(anterior(q.toracica), -q.cifose));
  const cMeio = soma(mixV(c7, c1, 0.5), vezes(anterior(q.cervical), q.lordoseCervical));
  const N = 10;
  const curva = catmull([sacro, lMeio, l1, tMeio, c7, cMeio, c1], N);
  const trecho = (a: number, b: number) => curva.slice(a * N, b * N + 1);
  const espalhar = (qtd: number) => Array.from({ length: qtd }, (_, i) => (i + 0.5) / qtd);
  const vertebras: Vertebra[] = [
    ...aoLongo(trecho(0, 2), espalhar(5)).map((x) => ({ ...x, nivel: "l" as const })),
    ...aoLongo(trecho(2, 4), espalhar(12)).map((x) => ({ ...x, nivel: "t" as const })),
    ...aoLongo(trecho(4, 6), espalhar(7)).map((x) => ({ ...x, nivel: "c" as const })),
  ];
  const torac = aoLongo(trecho(2, 4), [0.84])[0];
  const ombro = soma(torac.p, vezes(torac.n, 5.5));
  const lomb = aoLongo(trecho(0, 2), [0.5])[0];
  const cerv = aoLongo(trecho(4, 6), [0.45])[0];

  const perna = montarPerna(q.quadril, q.perna, chao);
  const perna2 = montarPerna(soma(q.quadril, v(1.2, 0.6)), q.perna2, chao);
  const braco = montarBraco(ombro, q.braco);
  const braco2 = montarBraco(soma(ombro, v(-1.4, 0.8)), q.braco2);

  return {
    quadril: q.quadril,
    pelve: q.pelve,
    sacro,
    l1,
    c7,
    c1,
    curva,
    vertebras,
    cabeca: q.cabeca,
    olho: posCranio(c1, q.cabeca, CRANIO.olho),
    orelha: posCranio(c1, q.cabeca, CRANIO.orelha),
    ombro,
    pontoLombar: soma(lomb.p, vezes(lomb.n, -3.2)),
    pontoPescoco: soma(cerv.p, vezes(cerv.n, -2.4)),
    pontoOmbro: soma(ombro, v(-2.5, 3.2)),
    perna,
    perna2,
    braco,
    braco2,
    toracicaDir: unit(menos(c7, l1)),
  };
};

// ---------- a cena da mesa ----------

// Postura certa, sentado: pelve neutra, coluna com as curvas naturais, cabeça no prumo.
const TRONCO_BOM = { pelve: 0, lombar: -6, toracica: 8, lordose: 2.2, cifose: 2.6 };
const TRONCO_RUIM = { pelve: 16, lombar: 15, toracica: 30, lordose: -1.4, cifose: 5.8 };
const PESCOCO_BOM = { cervical: 10, cabeca: 0, lordoseCervical: 1.2 };
const PESCOCO_RUIM = { cervical: 44, cabeca: 27, lordoseCervical: -0.6 };
const PERNAS_BOAS = { coxa: 90, joelho: 90, pe: 0 };
const PERNAS_RUINS = { coxa: 82, joelho: 128, pe: 4 };

export const QUADRIL_SENTADO = v(0, OSSO.canela + OSSO.tornozelo);

// A mesa e o monitor são medidos a partir da postura certa: o antebraço apoia na mesa, o topo da
// tela fica na altura dos olhos.
const referencia = juntas({
  quadril: QUADRIL_SENTADO,
  ...TRONCO_BOM,
  ...PESCOCO_BOM,
  perna: PERNAS_BOAS,
  perna2: PERNAS_BOAS,
  braco: { braco: 4, cotovelo: 88 },
  braco2: { braco: 4, cotovelo: 88 },
});
export const MESA = {
  topo: referencia.ombro.y - 27,
  frente: referencia.ombro.x + 10,
  fundo: referencia.ombro.x + 92,
  espessura: 3,
};
export const MONITOR = {
  x: referencia.ombro.x + 74,
  altura: 34,
  // base da tela: baixa (direto na mesa) e certa (topo na altura dos olhos)
  baseBaixa: MESA.topo + 4,
  baseCerta: referencia.olho.y - 34,
  olhoCerto: referencia.olho.y,
};
export const TECLADO = { perto: referencia.ombro.x + 24, longe: referencia.ombro.x + 44, largura: 14 };
const OMBRO = referencia.ombro;
// o punho "longe" é medido a partir do ombro de agora: com as costas curvadas o ombro desce e vai
// para a frente, e a pessoa fica debruçada, com o cotovelo lá na frente, em cima da mesa
const punhoLonge = (ombro: V) => v(ombro.x + 50, MESA.topo + 3.2);
const PUNHO_APOIADO = v(OMBRO.x + 36, MESA.topo + 2.3);
const PUNHO_PERTO = v(OMBRO.x + 27, MESA.topo + 4.4);

// Progresso de cada parte (0 = errado, 1 = certo)
export type Progresso = Record<"tela" | "pescoco" | "tronco" | "pernas" | "antebraco" | "cotovelo", number>;
export const TUDO_CERTO: Progresso = { tela: 1, pescoco: 1, tronco: 1, pernas: 1, antebraco: 1, cotovelo: 1 };
export const TUDO_ERRADO: Progresso = { tela: 0, pescoco: 0, tronco: 0, pernas: 0, antebraco: 0, cotovelo: 0 };

const mixObj = <T extends Record<string, number>>(a: T, b: T, p: number): T => {
  const r = {} as Record<string, number>;
  for (const k of Object.keys(a)) r[k] = mix(a[k], b[k as keyof T] as number, p);
  return r as T;
};

export const posturaNaMesa = (pr: Progresso): Postura => {
  const tronco = mixObj(TRONCO_RUIM, TRONCO_BOM, pr.tronco);
  const pescoco = mixObj(PESCOCO_RUIM, PESCOCO_BOM, pr.pescoco);
  const pernas = mixObj(PERNAS_RUINS, PERNAS_BOAS, pr.pernas);
  const quadril = soma(QUADRIL_SENTADO, v(-1.5 * (1 - pr.tronco), -0.6 * (1 - pr.tronco)));
  // onde está o ombro com este tronco e este pescoço (os braços partem dele)
  const semBracos = juntas({ quadril, ...tronco, ...pescoco, perna: pernas, perna2: pernas, braco: { braco: 0, cotovelo: 0 }, braco2: { braco: 0, cotovelo: 0 } });
  const punho = mixV(mixV(punhoLonge(semBracos.ombro), PUNHO_APOIADO, pr.antebraco), PUNHO_PERTO, pr.cotovelo);
  return {
    quadril,
    ...tronco,
    ...pescoco,
    perna: pernas,
    perna2: { ...pernas },
    braco: { punho },
    braco2: { punho: soma(punho, v(1.5, 0.6)) },
  };
};

// ---------- a pausa: sentado → em pé → caminhando ----------

const PERNA_SENTADA_PAUSA = { coxa: 90, joelho: 90, pe: 0 };
export const PASSO = { periodo: 1.1, velocidade: 112 };

export const posturaPausa = (tLevanta: number, tCaminha: number): Postura => {
  // tLevanta: 0→1 enquanto se levanta; tCaminha: segundos desde que começou a andar (ou < 0)
  const pe = { x: OSSO.coxa, y: OSSO.tornozelo };
  if (tCaminha <= 0) {
    const p = tLevanta;
    const sobe = p * p * (3 - 2 * p);
    const quadril = v(mix(0, pe.x, Math.sin((sobe * Math.PI) / 2)), mix(QUADRIL_SENTADO.y, 92.6, sobe));
    const inclina = Math.sin(Math.PI * Math.min(1, p * 1.05)) * 34;
    const bracoAng = mix(26, 6, sobe);
    const cotoveloAng = mix(64, 12, sobe);
    const perna: Perna =
      p <= 0 ? PERNA_SENTADA_PAUSA : { tornozelo: v(pe.x, pe.y), peAbs: 90 };
    return {
      quadril,
      pelve: mix(0, -2, sobe),
      lombar: -6 + inclina * 0.9,
      toracica: mix(8, 5, sobe) + inclina * 0.6,
      cervical: mix(10, 8, sobe) + inclina * 0.2,
      cabeca: -inclina * 0.25,
      lordose: 2.2,
      cifose: 2.6,
      lordoseCervical: 1.2,
      perna,
      perna2: p <= 0 ? PERNA_SENTADA_PAUSA : { tornozelo: v(pe.x + 1.4, pe.y), peAbs: 90 },
      braco: { braco: bracoAng, cotovelo: cotoveloAng, mao: 6 },
      braco2: { braco: bracoAng + 3, cotovelo: cotoveloAng, mao: 6 },
    };
  }
  // caminhada: o passo acelera nos primeiros 0,3 s
  const arranque = Math.min(1, tCaminha / 0.35);
  const fase = (2 * Math.PI * tCaminha) / PASSO.periodo;
  const avance = PASSO.velocidade * (tCaminha - 0.175 * (1 - (1 - arranque) * (1 - arranque)));
  const amp = arranque;
  const pernaAng = (f: number): Perna => ({
    coxa: 21 * Math.sin(f) * amp,
    joelho: (5 + 54 * Math.pow(Math.max(0, Math.cos(f + 0.55)), 2)) * amp,
    pe: -4,
  });
  return {
    quadril: v(pe.x + avance, 92.6 + 1.3 * Math.cos(2 * fase) * amp),
    pelve: -2,
    lombar: -3,
    toracica: 5,
    cervical: 8,
    cabeca: -1,
    lordose: 2.2,
    cifose: 2.6,
    lordoseCervical: 1.2,
    perna: pernaAng(fase),
    perna2: pernaAng(fase + Math.PI),
    braco: { braco: -15 * Math.sin(fase) * amp + 6 * (1 - amp), cotovelo: 16 + 10 * Math.max(0, -Math.sin(fase)) * amp, mao: 6 },
    braco2: { braco: 15 * Math.sin(fase) * amp + 6 * (1 - amp), cotovelo: 16 + 10 * Math.max(0, Math.sin(fase)) * amp, mao: 6 },
  };
};
