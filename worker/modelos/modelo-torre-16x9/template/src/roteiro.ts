// O roteiro do mundo 3D e da moldura, calculado UMA vez a partir do plano:
// - quando a moldura desce (ponte → palco);
// - (16:9) quando o quadro abre: a pessoa sai da tela cheia para a moldura da direita;
// - os "planos de câmera" (tiros): começo, torre, mapa, planta e ambiente (blocos universais);
// - os tempos de cada peça (andares, rota, paredes, móveis, cômodos, etiqueta).
// Tudo vem das palavras marcadas no plano; nada é fixo do exemplo.
import { clamp01, EASE_IN, EASE_INOUT, EASE_SOFT, keys, lerp, prog } from "./anim";
import type { Momento, Planta, Plano, Preco, Rota, Torre, Passos, NomeComodo } from "./plano";

export type Cena = "inicio" | "torre" | "ambiente" | "mapa" | "planta";
export type Tiro = { de: number; ate: number; cena: Cena; m?: Momento; i: number };

export const ordenar = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

/** o fim de um momento na tela: quando o próximo entra (o último fica até o fim) */
export const fimDoMomento = (ordem: Momento[], i: number, dur: number) => {
  const m = ordem[i];
  const prox = ordem[i + 1];
  if (!prox) return m.ate >= dur - 0.4 || m.tipo === "cta" || m.tipo === "preco" ? dur + 1 : m.ate;
  return Math.min(m.ate, prox.de);
};

// ---------- o quadro (16:9, a regra da aula 9 do curso) ----------
// A tela cheia é a base. Cada momento abre o quadro da esquerda (o mundo 3D e o bloco) e leva a
// pessoa para a moldura da direita, do `de` até o fim dele; com menos de JUNTA_QUADRO s entre dois
// momentos, o quadro fica aberto (a pessoa não vai e volta). Quando a ideia termina, ela volta à
// tela cheia. A troca leva QUADRO_TROCA s e começa QUADRO_ANTES s antes do `de` (a moldura já
// está no lugar quando o bloco entra).
const JUNTA_QUADRO = 1.6;
export const QUADRO_TROCA = 0.55;
const QUADRO_ANTES = 0.4;
export type Aberto = { de: number; ate: number };
const quadrosAbertos = (ordem: Momento[], dur: number): Aberto[] => {
  const abertos: Aberto[] = [];
  ordem.forEach((m, i) => {
    const de = Math.max(0, m.de);
    const ate = fimDoMomento(ordem, i, dur);
    if (ate <= de) return;
    const u = abertos[abertos.length - 1];
    if (u && de - u.ate < JUNTA_QUADRO) u.ate = Math.max(u.ate, ate);
    else abertos.push({ de, ate });
  });
  return abertos;
};

// ---------- a torre ----------
export const FH = 0.32; // altura do andar
export const TW = 2.0; // largura da torre (x)
export const TD = 1.5; // profundidade (z)
export const POD = 0.6; // térreo (pé-direito duplo)
export type InfoTorre = {
  m: Torre | null;
  nf: number; // andares desenhados
  t0: number; // o 1º andar pousa
  dt: number; // intervalo entre andares
  podio: number; // o térreo aparece
  ghostDe: number; // contorno-fantasma aparece
  h: number; // altura total
  k: number; // escala do enquadramento (torre baixa → câmera perto)
  fachada: "residencial" | "comercial";
};
export const andarEm = (T: InfoTorre, k: number) => T.t0 + k * T.dt;
export const andaresEm = (T: InfoTorre, t: number) => Math.max(0, Math.min(T.nf, Math.floor((t - T.t0) / Math.max(1e-3, T.dt)) + 1));

// ---------- a rota ----------
export type InfoRota = {
  m: Rota | Passos;
  tiro: Tiro;
  pino: number;
  // progresso da rota (0..1) por chaves de tempo
  chaves: Array<[number, number]>;
  fim: number;
  // paradas no caminho (fração da rota + tempo + texto)
  paradas: { u: number; em: number; texto: string; detalhe?: string }[];
  destino: { texto: string; em: number; rotulo: string; icone: string } | null;
};

// ---------- a planta ----------
export type InfoPlanta = {
  m: Planta;
  tiro: Tiro;
  on: number; // a planta entra (corte sob o escuro)
  a0: number; // paredes começam a subir / área começa a contar
  a1: number; // paredes em pé / área completa
  moveis: number; // 1º móvel pousa
  luz: number; // abajures acendem
  push: [number, number]; // câmera se aproxima
  portas: number;
  // cômodos acesos: id da peça da planta + tempo + rótulo
  acesos: { id: string; em: number; texto: string; m2?: number }[];
  fimPreco: number | null; // a etiqueta de preço entra (os rótulos se apagam)
};

export type Roteiro = {
  dur: number;
  divide: number | null; // a moldura desce para a metade de baixo
  divideDur: number;
  tiros: Tiro[];
  torre: InfoTorre;
  rotas: InfoRota[];
  plantas: InfoPlanta[];
  precos: Preco[];
  // o cabeçalho (nome do empreendimento) encolhe para o canto
  cabecalho: { m: Torre; encolhe: number } | null;
  // a cidade fica apagada até a virada (sem vídeo trocado)
  acende: number | null;
  // (16:9) os trechos com o quadro aberto (a pessoa na moldura da direita); fora deles, tela cheia
  abertos: Aberto[];
};

const MUNDO_CENA = (m: Momento): Cena | "herda" | "ponte" => {
  switch (m.tipo) {
    case "torre":
      return "torre";
    case "rota":
    case "passos":
      return "mapa";
    case "planta":
      return "planta";
    case "preco":
      return "herda";
    case "abertura":
    case "pergunta":
      return "ponte";
    default:
      return "ambiente";
  }
};

// cômodo dito → peças da planta (ids em mundo/planta.ts)
const PECAS: Record<string, Record<NomeComodo, string[]>> = {
  apartamento: {
    suite: ["s1", "s2"],
    quarto: ["s2", "s1"],
    sala: ["li"],
    cozinha: ["co"],
    varanda: ["va"],
    banheiro: ["b1", "b2"],
    escritorio: ["s2"],
    reuniao: ["li"],
    recepcao: ["li"],
    copa: ["co"],
    quintal: ["va"],
    piscina: ["va"],
    garagem: ["co"],
    frente: ["va"],
    fundos: ["co"],
  },
  casa: {
    suite: ["s1", "s2"],
    quarto: ["s2", "s1"],
    sala: ["li"],
    cozinha: ["co"],
    varanda: ["va"],
    banheiro: ["b1", "b2"],
    escritorio: ["s2"],
    reuniao: ["li"],
    recepcao: ["li"],
    copa: ["co"],
    quintal: ["qt"],
    piscina: ["pi"],
    garagem: ["ga"],
    frente: ["ga"],
    fundos: ["qt"],
  },
  sala: {
    suite: ["s1"],
    quarto: ["s2"],
    sala: ["li", "s2"],
    cozinha: ["co"],
    varanda: ["va"],
    banheiro: ["b1", "b2"],
    escritorio: ["li", "s2"],
    reuniao: ["s1"],
    recepcao: ["va"],
    copa: ["co"],
    quintal: ["va"],
    piscina: ["va"],
    garagem: ["co"],
    frente: ["va"],
    fundos: ["co"],
  },
  terreno: {
    suite: ["z1"],
    quarto: ["z2"],
    sala: ["z3"],
    cozinha: ["z4"],
    varanda: ["z1"],
    banheiro: ["z4"],
    escritorio: ["z3"],
    reuniao: ["z3"],
    recepcao: ["z1"],
    copa: ["z4"],
    quintal: ["z4"],
    piscina: ["z2"],
    garagem: ["z1"],
    frente: ["z1"],
    fundos: ["z4"],
  },
};
const ADIVINHAR: Array<[RegExp, NomeComodo]> = [
  [/su[ií]te/i, "suite"],
  [/quarto|dormit/i, "quarto"],
  [/varanda|terra[cç]o|sacada|gourmet/i, "varanda"],
  [/cozinha/i, "cozinha"],
  [/banh|lavabo/i, "banheiro"],
  [/reuni/i, "reuniao"],
  [/recep/i, "recepcao"],
  [/copa/i, "copa"],
  [/escrit|home|office/i, "escritorio"],
  [/quintal|jardim/i, "quintal"],
  [/piscina/i, "piscina"],
  [/garagem|vaga/i, "garagem"],
  [/fundo/i, "fundos"],
  [/frente/i, "frente"],
  [/sala|estar|living/i, "sala"],
];
const ORDEM_ZONAS = ["z1", "z2", "z3", "z4"];

const infoPlanta = (m: Planta, tiro: Tiro, precos: Preco[]): InfoPlanta => {
  const on = m.em + 0.12;
  const a0 = m.area?.em ?? on + 0.62;
  const a1 = Math.max(a0 + 0.5, m.area?.ateEm ?? a0 + 1.14) + 0.1;
  const moveis = a1 - 0.05;
  const forma = m.forma ?? "apartamento";
  const mapa = PECAS[forma];
  const usados = new Map<string, number>();
  const acesos: InfoPlanta["acesos"] = [];
  let zona = 0;
  for (const c of m.comodos ?? []) {
    const nome: NomeComodo | undefined = c.comodo ?? ADIVINHAR.find(([re]) => re.test(c.texto))?.[1];
    const n = Math.max(1, Math.min(4, c.quantidade ?? 1));
    for (let q = 0; q < n; q++) {
      let ids = nome ? mapa[nome] : [];
      if (forma === "terreno" || !ids.length) ids = [ORDEM_ZONAS[zona++ % 4]];
      const k = usados.get(ids.join()) ?? 0;
      usados.set(ids.join(), k + 1);
      const id = ids[k % ids.length];
      acesos.push({ id, em: c.em + q * 0.22, texto: n > 1 ? `${c.texto} ${q + 1}` : c.texto, m2: n > 1 ? undefined : c.m2 });
    }
  }
  const c0 = acesos.length ? Math.min(...acesos.map((a) => a.em)) : moveis + 1.75;
  const preco = precos.find((p) => p.em > on && p.em <= tiro.ate + 3);
  return {
    m,
    tiro,
    on,
    a0,
    a1,
    moveis,
    luz: moveis + 1.13,
    push: [Math.max(moveis + 0.3, c0 - 0.8), Math.max(moveis + 0.9, c0 - 0.02)],
    portas: a1 + 0.05,
    acesos,
    fimPreco: preco ? preco.em : null,
  };
};

const infoRota = (m: Rota | Passos, tiro: Tiro): InfoRota => {
  if (m.tipo === "passos") {
    const n = m.itens.length;
    const paradas = m.itens.map((it, i) => ({ u: (i + 1) / n, em: it.em, texto: it.texto, detalhe: it.detalhe }));
    const ini = Math.max(tiro.de + 0.5, m.itens[0].em - 0.6);
    return {
      m,
      tiro,
      pino: tiro.de + 0.35,
      chaves: [[ini, 0], ...paradas.map((p) => [p.em + 0.05, p.u] as [number, number])],
      fim: paradas[n - 1].em + 0.05,
      paradas,
      destino: null,
    };
  }
  const ps = m.paradas ?? [];
  const n = ps.length;
  const paradas = ps.map((p, i) => ({ u: (i + 1) / (n + 1), em: p.em, texto: p.texto, detalhe: p.detalhe }));
  const pino = m.pinoEm ?? m.em + 0.45;
  const ini = m.tempo?.em ?? (n ? paradas[0].em - 0.6 : pino + 0.5);
  const fim = m.destino.em + 0.05;
  const rotulo = m.destino.rotulo ?? m.destino.texto.replace(/^(do|da|de|dos|das|ao|à|a|o)\s+/i, "").replace(/^./, (c) => c.toUpperCase());
  return {
    m,
    tiro,
    pino,
    chaves: [[Math.min(ini, fim - 0.3), 0], ...paradas.map((p) => [p.em + 0.05, p.u] as [number, number]), [fim, 1]],
    fim,
    paradas,
    destino: { texto: m.destino.texto, em: m.destino.em, rotulo, icone: m.destino.icone ?? "pino" },
  };
};

export const montarRoteiro = (plano: Plano): Roteiro => {
  const dur = plano.duracao;
  const ordem = ordenar(plano);
  const precos = ordem.filter((m): m is Preco => m.tipo === "preco");

  // 1. quando a moldura desce: o primeiro momento que não é a ponte (abertura/pergunta)
  let divide: number | null = null;
  for (const m of ordem) {
    if (MUNDO_CENA(m) === "ponte") continue;
    if (m.tipo === "torre" && m.nome) divide = Math.max(m.de, (m.nomeEm ?? m.de) + 0.14);
    else divide = m.de;
    break;
  }
  if (divide !== null && divide < 0.3) divide = 0;

  // 2. os tiros de câmera
  const tiros: Tiro[] = [];
  const empurrar = (de: number, cena: Cena, m?: Momento) => {
    const ult = tiros[tiros.length - 1];
    if (ult && ult.cena === cena && cena === "ambiente") return; // ambiente seguido continua a mesma órbita
    if (ult) ult.ate = de;
    tiros.push({ de, ate: dur, cena, m, i: tiros.length });
  };
  tiros.push({ de: 0, ate: dur, cena: "inicio", i: 0 });
  for (const m of ordem) {
    const c = MUNDO_CENA(m);
    if (c === "herda") continue;
    if (c === "ponte") {
      if (divide === null || m.de < divide) continue; // a ponte é o "início"
      empurrar(m.de, "ambiente", m);
      continue;
    }
    empurrar(c === "torre" && divide !== null ? Math.min(m.de, divide) : m.de, c, m);
  }
  tiros.forEach((t, i) => (t.i = i));

  // 2b. (16:9) um tiro termina quando o quadro fecha: no vão em tela cheia o mundo não aparece, e
  // a coluna, a rota e a planta saem junto com o bloco (não reaparecem quando o quadro reabre)
  const abertos = quadrosAbertos(ordem, dur);
  for (const tiro of tiros) {
    const a = abertos.find((x) => tiro.de >= x.de - 0.5 && tiro.de <= x.ate);
    if (a && tiro.ate > a.ate) tiro.ate = Math.max(tiro.de + 0.5, a.ate);
  }

  // 3. a torre (a primeira do plano)
  const tm = ordem.find((m): m is Torre => m.tipo === "torre") ?? null;
  const nf = tm ? Math.round(Math.max(4, Math.min(30, tm.andares ?? tm.valor))) : 0;
  const t0 = tm ? tm.em - 0.02 : 1e9;
  const tFim = tm ? Math.max(tm.em + 0.6, (tm.ateEm ?? tm.em + 1.3) + 0.2) : 1e9;
  const h = POD + nf * FH;
  const primeiro3D = tiros.find((t) => t.cena !== "inicio");
  const podio = tm ? (divide ?? tm.de) + 0.2 : primeiro3D ? primeiro3D.de + 0.2 : 1e9;
  const torre: InfoTorre = {
    m: tm,
    nf,
    t0,
    dt: nf > 1 ? (tFim - t0) / (nf - 1) : 0.5,
    podio,
    ghostDe: tm ? Math.min(tm.nomeEm ?? tm.de, tm.em - 0.3) : 1e9,
    h,
    k: Math.max(0.55, Math.min(1.8, (POD + Math.max(nf, 6) * FH) / (POD + 18 * FH))),
    fachada: tm?.fachada ?? "residencial",
  };

  const rotas = tiros.filter((t) => t.cena === "mapa" && t.m).map((t) => infoRota(t.m as Rota | Passos, t));
  const plantas = tiros.filter((t) => t.cena === "planta" && t.m).map((t) => infoPlanta(t.m as Planta, t, precos));

  const cab = tm && tm.nome ? { m: tm, encolhe: Math.max(tm.de, (tm.nomeEm ?? tm.de) + 0.14) } : null;
  const v = plano.virada;
  const acende = v && !v.video && !v.antes ? v.em : null;

  return { dur, divide, divideDur: 0.58, tiros, torre, rotas, plantas, precos, cabecalho: cab, acende, abertos };
};

/** (16:9) 0 = a pessoa em tela cheia, 1 = o quadro aberto (a pessoa na moldura da direita) */
export const quadroK = (R: Roteiro, t: number) => {
  let k = 0;
  for (const a of R.abertos) {
    const entra = a.de < QUADRO_ANTES + 0.05 ? 1 : EASE_INOUT(clamp01((t - (a.de - QUADRO_ANTES)) / QUADRO_TROCA));
    const sai = a.ate >= R.dur ? 1 : 1 - EASE_INOUT(clamp01((t - (a.ate + 0.02)) / QUADRO_TROCA));
    k = Math.max(k, Math.min(entra, sai));
  }
  return k;
};

// ---------- estados contínuos ----------
export const tiroEm = (R: Roteiro, t: number) => {
  let k = 0;
  for (let i = 0; i < R.tiros.length; i++) if (R.tiros[i].de <= t) k = i;
  return R.tiros[k];
};
/** 0 = ponte (moldura grande), 1 = palco (moldura embaixo) */
export const divideK = (R: Roteiro, t: number) => (R.divide === null ? 0 : R.divide <= 0 ? 1 : EASE_INOUT(clamp01((t - R.divide) / R.divideDur)));

const BLEND = 0.9;
/** modo mapa (0 = cidade, 1 = mapa em relevo) */
export const mapaK = (R: Roteiro, t: number) => {
  const tiro = tiroEm(R, t);
  const ant = R.tiros[tiro.i - 1];
  if (tiro.cena === "mapa") {
    if (ant && ant.cena === "mapa") return 1;
    return EASE_INOUT(clamp01((t - tiro.de) / BLEND));
  }
  if (tiro.cena === "planta") {
    // no mergulho o mapa continua (a cidade só some quando a planta entra)
    return ant && ant.cena === "mapa" ? 1 : 0;
  }
  if (ant && ant.cena === "mapa") return 1 - EASE_INOUT(clamp01((t - tiro.de) / BLEND));
  return 0;
};
export const plantaAgora = (R: Roteiro, t: number) => R.plantas.find((p) => t >= p.on && t < p.tiro.ate + 0.001) ?? null;
/** blocos universais: o mundo vira fundo (desfoca e escurece) */
export const ambienteK = (R: Roteiro, t: number) => {
  const tiro = tiroEm(R, t);
  const ant = R.tiros[tiro.i - 1];
  const prox = R.tiros[tiro.i + 1];
  const dentro = tiro.cena === "ambiente" ? prog(t, tiro.de - 0.1, tiro.de + 0.45) : 0;
  const saindo = tiro.cena === "ambiente" && prox ? 1 - prog(t, prox.de - 0.3, prox.de + 0.1) : 1;
  const vindo = tiro.cena !== "ambiente" && ant?.cena === "ambiente" ? 1 - prog(t, tiro.de - 0.05, tiro.de + 0.45) : 0;
  return Math.max(dentro * saindo, vindo);
};
/** escurecimento no mergulho para dentro (e para fora) da planta */
export const mergulhoK = (R: Roteiro, t: number) => {
  let a = 0;
  for (const p of R.plantas) {
    a = Math.max(a, prog(t, p.on - 0.5, p.on - 0.06, EASE_IN) * (1 - prog(t, p.on, p.on + 0.34)));
    const fim = p.tiro.ate;
    if (fim < R.dur - 0.05) a = Math.max(a, prog(t, fim - 0.32, fim - 0.03) * (1 - prog(t, fim, fim + 0.32)));
  }
  return a;
};

// ---------- câmera ----------
export type V3 = [number, number, number];
export type CamState = { pos: V3; look: V3; fov: number; sx: number; sy: number };
const lv = (a: V3, b: V3, p: number): V3 => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
export const mixCam = (a: CamState, b: CamState, p: number): CamState => ({ pos: lv(a.pos, b.pos, p), look: lv(a.look, b.look, p), fov: lerp(a.fov, b.fov, p), sx: lerp(a.sx, b.sx, p), sy: lerp(a.sy, b.sy, p) });

const orbita = (a: number, R0: number, h: number, ly: number, k: number): CamState => ({ pos: [Math.sin(a) * R0 * k, h * k, Math.cos(a) * R0 * k], look: [0, ly * k, 0], fov: 22, sx: -150, sy: 392 });
const torreFeita = (R: Roteiro, t: number) => R.torre.m !== null && t >= andarEm(R.torre, Math.max(0, R.torre.nf - 1));

const camInicio = (R: Roteiro): CamState => orbita(0.36, 44, 3.4, 1.5, R.torre.k);
const camTorre = (R: Roteiro, tiro: Tiro, t: number): CamState => {
  const ini = Math.max(tiro.de, R.divide ?? tiro.de);
  const fim = Math.max(ini + 1.5, tiro.ate);
  const tFim = andarEm(R.torre, Math.max(0, R.torre.nf - 1));
  const a = keys(t, [[ini, 0.36], [fim, 0.96]], EASE_SOFT);
  const R0 = keys(t, [[ini, 44], [fim, 41]], EASE_SOFT);
  const h = keys(t, [[ini, 3.4], [Math.min(tFim, fim - 0.01), 4.4], [fim, 4.8]], EASE_SOFT);
  const ly = keys(t, [[ini, 1.5], [Math.min(tFim, fim - 0.01), 3.25], [fim, 3.35]], EASE_SOFT);
  return orbita(a, R0, h, ly, R.torre.k);
};
const camAmbiente = (R: Roteiro, tiro: Tiro, t: number): CamState => {
  const feita = torreFeita(R, tiro.de);
  return orbita(0.96 + 0.05 * (t - tiro.de) + 0.35 * tiro.i, 41, feita ? 4.8 : 3.6, feita ? 3.35 : 1.6, R.torre.k);
};
const MAPC: V3 = [2.05, 0, -4.3];
const MAP_PITCH = (60 * Math.PI) / 180;
const camMapa = (tiro: Tiro, t: number): CamState => {
  const p = EASE_SOFT(clamp01((t - (tiro.de + BLEND)) / Math.max(0.5, tiro.ate - tiro.de - BLEND)));
  const d = lerp(124, 116, p);
  const yaw = lerp(0.2, 0.1, p);
  return { pos: [MAPC[0] + Math.sin(yaw) * d * Math.cos(MAP_PITCH), d * Math.sin(MAP_PITCH), MAPC[2] + Math.cos(yaw) * d * Math.cos(MAP_PITCH)], look: MAPC, fov: 24, sx: -130, sy: 352 };
};
export const MAP_TOWER_S = 0.55;
const camMergulho = (R: Roteiro): CamState => {
  const topo = R.torre.h * MAP_TOWER_S;
  return { pos: [0.05, topo + 12, 1.4], look: [0, topo, 0], fov: 26, sx: 0, sy: 430 };
};
const camPlanta = (P: InfoPlanta, t: number): CamState => {
  const pc = (yaw: number, pitch: number, d: number): V3 => [Math.sin(yaw) * Math.cos(pitch) * d, Math.sin(pitch) * d, Math.cos(yaw) * Math.cos(pitch) * d];
  const look: V3 = [0, 0, 0.15];
  const a: CamState = { look, fov: 24, sx: -150, sy: 300, pos: pc(0.0, 1.5, 40) };
  const b: CamState = { look, fov: 24, sx: -150, sy: 300, pos: pc(0.26, 0.98, 36) };
  const c: CamState = { look, fov: 24, sx: 0, sy: 262, pos: pc(0.1, 1.0, 26.2) };
  const d: CamState = { look, fov: 24, sx: 0, sy: 262, pos: pc(-0.15, 1.05, 27.2) };
  const p0 = EASE_INOUT(clamp01((t - P.on) / Math.max(0.3, P.a1 + 0.2 - P.on)));
  const p1 = EASE_INOUT(clamp01((t - P.push[0]) / (P.push[1] - P.push[0])));
  const fim = Math.max(P.push[1] + 1, P.tiro.ate, P.fimPreco ? P.fimPreco + 2 : 0);
  const p2 = EASE_SOFT(clamp01((t - P.push[1]) / (fim - P.push[1])));
  if (t < P.push[0]) return mixCam(a, b, p0);
  if (t < P.push[1]) return mixCam(b, c, p1);
  return mixCam(c, d, p2);
};

const camDoTiro = (R: Roteiro, tiro: Tiro, t: number): CamState => {
  switch (tiro.cena) {
    case "inicio":
      return camInicio(R);
    case "torre":
      return camTorre(R, tiro, t);
    case "ambiente":
      return camAmbiente(R, tiro, t);
    case "mapa":
      return camMapa(tiro, t);
    case "planta": {
      const P = R.plantas.find((p) => p.tiro === tiro)!;
      if (t >= P.on) return camPlanta(P, t);
      return camMergulho(R);
    }
  }
};

/** câmera 3D em função do tempo: cada tiro mistura a partir de onde o anterior estava */
export const camEm = (R: Roteiro, t: number): CamState => {
  const tiro = tiroEm(R, t);
  const alvo = camDoTiro(R, tiro, t);
  const ant = R.tiros[tiro.i - 1];
  if (!ant) return alvo;
  if (tiro.cena === "planta") {
    if (t >= R.plantas.find((p) => p.tiro === tiro)!.on) return alvo;
    const P = R.plantas.find((p) => p.tiro === tiro)!;
    const de = camDoTiro(R, ant, tiro.de);
    return mixCam(de, alvo, EASE_INOUT(clamp01((t - tiro.de) / Math.max(0.15, P.on - 0.12 - tiro.de))));
  }
  if (ant.cena === "planta") return alvo; // sai da planta num corte (sob o escuro)
  const de = camDoTiro(R, ant, tiro.de);
  return mixCam(de, alvo, EASE_INOUT(clamp01((t - tiro.de) / BLEND)));
};
