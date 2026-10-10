// A gramática do Roteiro em números: blocos de mapa, pernas da rota, pinos, câmera do mapa,
// o postal da pessoa e o sol da barra do dia. Tudo calculado a partir do plano.
import { limitar, mistura, prog, viaja } from "./anim";
import type { Caixa } from "./motor/caixa";
import { type Dica, ehMapa, type Lugar, type Mapa, type Momento, type Parada, type Plano, type Ponto, type Transporte } from "./plano";
import { ANCORA_Y, POSTAL, POSTAL_DICA, W } from "./tema";

export { ehMapa };

// Um lugar com posição no mapa (a do plano ou a que o template escolheu).
export type LugarFixo = Lugar & { x: number; y: number };

// Mapa genérico, para quando o plano não desenha um: orla ao sul, bairros, morros e parques em volta
// do caminho onde as paradas sem posição caem. Serve para qualquer assunto.
export const MAPA_PADRAO: Mapa = {
  agua: {
    lado: "sul",
    margem: [
      { x: 0, y: 0.86 },
      { x: 0.2, y: 0.83 },
      { x: 0.4, y: 0.855 },
      { x: 0.6, y: 0.82 },
      { x: 0.8, y: 0.84 },
      { x: 1, y: 0.8 },
    ],
  },
  bairros: [
    { x: 0.22, y: 0.62, tamanho: 0.06 },
    { x: 0.36, y: 0.55, tamanho: 0.05 },
    { x: 0.5, y: 0.64, tamanho: 0.06 },
    { x: 0.64, y: 0.56, tamanho: 0.055 },
    { x: 0.78, y: 0.64, tamanho: 0.06 },
    { x: 0.3, y: 0.42, tamanho: 0.05 },
    { x: 0.46, y: 0.4, tamanho: 0.055 },
    { x: 0.62, y: 0.38, tamanho: 0.05 },
    { x: 0.76, y: 0.45, tamanho: 0.05 },
    { x: 0.2, y: 0.76, tamanho: 0.045 },
    { x: 0.55, y: 0.76, tamanho: 0.05 },
    { x: 0.82, y: 0.76, tamanho: 0.04 },
    { x: 0.14, y: 0.45, tamanho: 0.04 },
    { x: 0.88, y: 0.55, tamanho: 0.04 },
  ],
  morros: [
    { x: 0.42, y: 0.5, r: 0.06 },
    { x: 0.7, y: 0.47, r: 0.05 },
    { x: 0.25, y: 0.52, r: 0.045 },
  ],
  parques: [
    { x: 0.56, y: 0.5, r: 0.045 },
    { x: 0.34, y: 0.7, r: 0.04 },
  ],
};

export const mapaDoPlano = (plano: Plano): Mapa => {
  const m = plano.mapa;
  const vazio = !m || (!m.agua && !m.bairros?.length && !m.morros?.length && !m.parques?.length && !m.pontes?.length);
  return vazio ? MAPA_PADRAO : m;
};

// Vista da câmera: o ponto do mundo (cx, cy em frações do mapa) que fica na âncora da tela (ax, ay),
// com `s` px por unidade do mapa.
export type Vista = { cx: number; cy: number; s: number; ax: number; ay: number };
export const naTela = (p: Ponto, v: Vista) => ({ x: v.ax + (p.x - v.cx) * v.s, y: v.ay + (p.y - v.cy) * v.s });

// O postal da pessoa: retângulo da moldura (px) e inclinação (graus)
export type Postal = { x: number; y: number; w: number; h: number; borda: number; rodape: number; giro: number };

export type Perna = {
  de: number;
  ate: number;
  pontos: Ponto[];
  // comprimento acumulado de cada ponto (frações do mapa)
  acumulado: number[];
  tipo: "trajeto" | "ligacao";
  transporte?: Transporte;
  numero?: string;
  // ligação: o texto do chip ("pertinho dali") e até quando ele fica (o fim da parada)
  texto?: string;
  textoEm?: number;
  textoAte?: number;
  // embarque no meio do caminho: fração do comprimento onde o veículo entra, e quando
  embarque?: { u: number; em: number };
  // perna de uma lista, passos ou comparação: o traço a lápis só aparece pouco antes
  universal?: boolean;
};

// `origem` = o Lugar do plano (para achar o pino de um cartão); `marca` = o que vai dentro do pino
export type Pino = { lugar: LugarFixo; origem: Lugar; numero: number; marca: "numero" | "ponto"; carimboEm?: number; parada: number; universal?: boolean; de?: number };

// Uma estação com pinos: parada, lista (topicos, passos) ou comparação. Cada uma é um ponto da viagem.
export type ParadaNoRoteiro = {
  m: Momento;
  indice: number;
  lado: "esq" | "dir";
  vista: Vista;
  chegada: number;
  primeiroPino: number;
  lugares: LugarFixo[];
};

// `perna`: a câmera acompanha o andamento da rota (que pode parar no embarque) em vez do relógio
type Chave = { inicio: number; chega: number; vista: Vista; postal: Postal; mergulho?: boolean; perna?: Perna };

export type Roteiro = {
  // `dia`: o bloco tem uma parada com hora do dia (a barra do dia aparece nele)
  blocos: { de: number; ate: number; dia: boolean }[];
  paradas: ParadaNoRoteiro[];
  pernas: Perna[];
  pinos: Pino[];
  visaoGeral: Vista;
  chaves: Chave[];
  periodos: { em: number; indice: number }[];
  ultimoPeriodo: { em: number; ate: number } | null;
};

const S_PARADA = 2400;
// pinos do lado direito quando o postal fica à esquerda, e vice-versa
const ANCORA_X = { esq: 776, dir: 304 };
const giroDoLado = { esq: -2.4, dir: 2.2 };

export const postalDoLado = (lado: "esq" | "dir"): Postal => ({
  x: lado === "esq" ? 52 : W - 52 - POSTAL.w,
  y: POSTAL.y,
  w: POSTAL.w,
  h: POSTAL.h,
  borda: POSTAL.borda,
  rodape: POSTAL.rodape,
  giro: giroDoLado[lado],
});
const postalDaDica = (lado: "esq" | "dir"): Postal => ({
  x: lado === "esq" ? 52 : W - 52 - POSTAL_DICA.w,
  y: POSTAL_DICA.y,
  w: POSTAL_DICA.w,
  h: POSTAL_DICA.h,
  borda: POSTAL_DICA.borda,
  rodape: POSTAL_DICA.rodape,
  giro: lado === "esq" ? -1.6 : 1.6,
});

// curva suave por pontos (Catmull-Rom); sem pontos de passagem, um arco leve
const curva = (pontos: Ponto[], lado: number, amostras = 90): Ponto[] => {
  let ctrl = pontos;
  if (pontos.length === 2) {
    const [a, b] = pontos;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    ctrl = [a, { x: (a.x + b.x) / 2 - dy * 0.14 * lado, y: (a.y + b.y) / 2 + dx * 0.14 * lado }, b];
  }
  const saida: Ponto[] = [];
  const n = ctrl.length - 1;
  for (let k = 0; k <= amostras; k++) {
    const u = (k / amostras) * n;
    const i = Math.min(n - 1, Math.floor(u));
    const f = u - i;
    const p0 = ctrl[Math.max(0, i - 1)];
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p3 = ctrl[Math.min(n, i + 2)];
    const cr = (a: number, b: number, c: number, d: number) =>
      0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
    saida.push({ x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y) });
  }
  return saida;
};

const acumular = (pontos: Ponto[]) => {
  const acc = [0];
  for (let i = 1; i < pontos.length; i++) acc.push(acc[i - 1] + Math.hypot(pontos[i].x - pontos[i - 1].x, pontos[i].y - pontos[i - 1].y));
  return acc;
};

// ponto a uma fração `u` do comprimento da perna
export const pontoNaPerna = (perna: Perna, u: number): Ponto & { angulo: number } => {
  const total = perna.acumulado[perna.acumulado.length - 1] || 1;
  const alvo = limitar(u) * total;
  let i = perna.acumulado.findIndex((a) => a >= alvo);
  if (i <= 0) i = 1;
  const a = perna.pontos[i - 1];
  const b = perna.pontos[i];
  const seg = perna.acumulado[i] - perna.acumulado[i - 1] || 1;
  const f = (alvo - perna.acumulado[i - 1]) / seg;
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, angulo: Math.atan2(b.y - a.y, b.x - a.x) };
};

// quanto da perna já foi desenhado no instante t (0–1); com embarque, a rota para no ponto de embarque
// e segue quando o transporte é dito
export const progressoDaPerna = (perna: Perna, t: number) => {
  const e = perna.embarque;
  if (!e) return prog(t, perna.de, perna.ate - perna.de, viaja);
  if (t < e.em) return e.u * prog(t, perna.de, e.em - perna.de, viaja);
  return e.u + (1 - e.u) * prog(t, e.em, perna.ate - e.em, viaja);
};

const vistaDaParada = (lugares: LugarFixo[], lado: "esq" | "dir"): Vista => {
  const xs = lugares.map((l) => l.x);
  const ys = lugares.map((l) => l.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const espalho = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 0.001);
  return { cx, cy, s: Math.min(S_PARADA, 250 / espalho), ax: ANCORA_X[lado], ay: ANCORA_Y };
};

// Onde caem as paradas sem posição: uma trilha em serpentina pelo mapa (sempre "seguindo em frente").
const caminhante = (k: number): Ponto => {
  const col = k % 6;
  const linha = Math.floor(k / 6);
  return { x: linha % 2 === 0 ? 0.2 + 0.12 * col : 0.8 - 0.12 * col, y: 0.66 - 0.07 * (linha % 4) + 0.025 * Math.sin(k * 2.1) };
};

// Pinos das listas e da comparação, em px em volta do centro da estação (S_PARADA px por unidade do mapa).
const compactos = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ dx: (i % 2 ? 1 : -1) * 95, dy: n === 1 ? 0 : (i - (n - 1) / 2) * Math.min(120, 330 / (n - 1)) }));
const FORQUILHA = { fork: { dx: 20, dy: -130 }, lados: [{ dx: -215, dy: 80 }, { dx: 215, dy: 80 }] };
const LISTA_ANCORA = { esq: { ax: 760, ay: 770 }, dir: { ax: 320, ay: 770 } };

export const montarRoteiro = (plano: Plano): Roteiro => {
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const doMapa = momentos.filter(ehMapa);
  // blocos de mapa: momentos de mapa colados (ou com respiro curto) formam um bloco só
  const blocos: { de: number; ate: number; dia: boolean }[] = [];
  for (const m of doMapa) {
    const ultimo = blocos[blocos.length - 1];
    if (ultimo && m.de - ultimo.ate < 1.5) ultimo.ate = Math.max(ultimo.ate, m.ate);
    else blocos.push({ de: m.de, ate: m.ate, dia: false });
  }
  for (const b of blocos) b.dia = doMapa.some((m) => m.tipo === "parada" && !!m.periodo && m.de >= b.de - 0.01 && m.de < b.ate);

  const paradas: ParadaNoRoteiro[] = [];
  const pernas: Perna[] = [];
  const pinos: Pino[] = [];
  const chaves: Chave[] = [];
  let numero = 1;
  let livre = 0;
  let ultimo: LugarFixo | Ponto | undefined;
  let ladoAnterior: "esq" | "dir" = "dir";

  const perna = (de: number, ate: number, pontos: Ponto[], extra: Partial<Perna> = {}): Perna => {
    const p: Perna = { de, ate, pontos, acumulado: acumular(pontos), tipo: "ligacao", ...extra };
    pernas.push(p);
    return p;
  };

  doMapa.forEach((m) => {
    const primeiraDoVideo = m === doMapa[0];
    if (m.tipo === "parada" && m.lugares.length > 0) {
      const indice = paradas.length;
      const fixos: LugarFixo[] = m.lugares.map((l) => {
        if (l.x !== undefined && l.y !== undefined) return l as LugarFixo;
        const a = caminhante(livre++);
        return { ...l, x: a.x, y: a.y };
      });
      const deOnde = ultimo;
      const primeiro = fixos[0];
      // o postal fica do lado de onde a rota veio (a pessoa "vem atrás" da rota)
      let lado: "esq" | "dir" = "esq";
      if (deOnde) lado = deOnde.x < primeiro.x - 0.01 ? "esq" : deOnde.x > primeiro.x + 0.01 ? "dir" : ladoAnterior === "esq" ? "dir" : "esq";
      const vista = vistaDaParada(fixos, lado);
      paradas.push({ m, indice, lado, vista, chegada: primeiro.em, primeiroPino: numero, lugares: fixos });
      let pernaChegada: Perna | undefined;
      if (deOnde) {
        const ate = primeiro.em;
        const tr = m.trajeto;
        const embarque = tr?.embarque;
        // com embarque, o caminho começa logo no início da parada e espera o transporte no ponto
        const comeco = embarque ? Math.min(m.de + 0.15, tr!.em - 0.5) : (tr?.em ?? m.de + 0.2);
        const de = Math.min(comeco, ate - 0.6);
        const pontos = curva([deOnde, ...(tr?.via ?? []), ...(embarque ? [embarque] : []), primeiro], indice % 2 === 0 ? 1 : -1);
        const acumulado = acumular(pontos);
        let embarqueU: Perna["embarque"];
        if (embarque && tr) {
          let melhor = 0;
          pontos.forEach((q, k) => {
            if (Math.hypot(q.x - embarque.x, q.y - embarque.y) < Math.hypot(pontos[melhor].x - embarque.x, pontos[melhor].y - embarque.y)) melhor = k;
          });
          embarqueU = { u: acumulado[melhor] / acumulado[acumulado.length - 1], em: Math.min(Math.max(tr.em, de + 0.3), ate - 0.5) };
        }
        pernaChegada = perna(de, ate, pontos, { tipo: "trajeto", transporte: tr?.transporte, numero: tr?.numero, embarque: embarqueU });
      }
      fixos.forEach((l, k) => {
        if (k > 0) {
          const de = l.ligacao?.em ?? l.em - 0.35;
          perna(de, de + 0.7, curva([fixos[k - 1], l], 1, 30), { texto: l.ligacao?.texto, textoEm: l.ligacao?.em, textoAte: m.ate });
        }
        pinos.push({ lugar: l, origem: m.lugares[k], numero: numero++, marca: "numero", carimboEm: m.carimboEm, parada: indice });
      });
      ultimo = fixos[fixos.length - 1];
      ladoAnterior = lado;
      if (primeiraDoVideo) {
        chaves.push({ inicio: m.de - 1, chega: m.de - 0.99, vista: { ...vista, s: vista.s * 0.5 }, postal: postalDoLado(lado) });
        chaves.push({ inicio: m.de, chega: Math.max(m.de + 0.6, primeiro.em + 0.1), vista, postal: postalDoLado(lado) });
      } else chaves.push({ inicio: pernaChegada?.de ?? m.de, chega: primeiro.em, vista, postal: postalDoLado(lado), mergulho: true, perna: pernaChegada });
      return;
    }

    if (m.tipo === "topicos" || m.tipo === "passos" || m.tipo === "comparacao") {
      const indice = paradas.length;
      const lado: "esq" | "dir" = ladoAnterior === "esq" ? "dir" : "esq";
      const C = caminhante(livre++);
      const noPx = (dx: number, dy: number): Ponto => ({ x: C.x + dx / S_PARADA, y: C.y + dy / S_PARADA });
      const deOnde = ultimo;
      let fixos: LugarFixo[];
      let vista: Vista;
      let pernaChegada: Perna | undefined;
      if (m.tipo === "comparacao") {
        const fork = noPx(FORQUILHA.fork.dx, FORQUILHA.fork.dy);
        fixos = m.lados.map((l, i) => ({ em: l.em, nome: l.rotulo, ...noPx(FORQUILHA.lados[i].dx, FORQUILHA.lados[i].dy) }));
        vista = { cx: C.x, cy: C.y, s: S_PARADA, ax: 540, ay: 900 };
        const forkEm = fixos[0].em - 0.55;
        if (deOnde) {
          const de = Math.min(m.de + 0.2, forkEm - 0.6);
          pernaChegada = perna(de, forkEm, curva([deOnde, fork], indice % 2 === 0 ? 1 : -1), { tipo: "trajeto", universal: true });
        }
        fixos.forEach((l, i) => perna(l.em - 0.5, l.em + 0.15, curva([fork, l], i === 0 ? -1 : 1, 30), { universal: true }));
      } else {
        const itens = m.itens;
        const desl = compactos(itens.length);
        fixos = itens.map((it, i) => ({ em: it.em, nome: it.texto, ...noPx(desl[i].dx, desl[i].dy) }));
        vista = { cx: C.x, cy: C.y, s: S_PARADA, ...LISTA_ANCORA[lado] };
        const ate = fixos[0].em;
        if (deOnde) pernaChegada = perna(Math.min(m.de + 0.2, ate - 0.6), ate, curva([deOnde, fixos[0]], indice % 2 === 0 ? 1 : -1), { tipo: "trajeto", universal: true });
        if (m.tipo === "passos") fixos.forEach((l, k) => k > 0 && perna(l.em - 0.5, l.em + 0.2, curva([fixos[k - 1], l], k % 2 ? 1 : -1, 30), { universal: true }));
      }
      paradas.push({ m, indice, lado, vista, chegada: fixos[0].em, primeiroPino: numero, lugares: fixos });
      fixos.forEach((l, k) => {
        const vence = m.tipo === "comparacao" && m.vencedor === k ? m.vencedorEm : undefined;
        pinos.push({
          lugar: l,
          origem: l,
          numero: k + 1,
          marca: m.tipo === "passos" ? "numero" : "ponto",
          carimboEm: vence,
          parada: indice,
          universal: true,
          de: m.de,
        });
      });
      ultimo = fixos[fixos.length - 1];
      ladoAnterior = lado;
      const postal = postalDaDica(lado);
      if (primeiraDoVideo) {
        chaves.push({ inicio: m.de - 1, chega: m.de - 0.99, vista: { ...vista, s: vista.s * 0.5 }, postal });
        chaves.push({ inicio: m.de, chega: Math.max(m.de + 0.6, fixos[0].em + 0.1), vista, postal });
      } else chaves.push({ inicio: pernaChegada?.de ?? m.de, chega: fixos[0].em, vista, postal, mergulho: true, perna: pernaChegada });
      return;
    }

    if (m.tipo === "grafico") {
      const lado: "esq" | "dir" = ladoAnterior === "esq" ? "dir" : "esq";
      const C = caminhante(livre++);
      const vista: Vista = { cx: C.x, cy: C.y, s: 900, ax: 540, ay: 780 };
      const postal = postalDaDica(lado);
      if (primeiraDoVideo) {
        chaves.push({ inicio: m.de - 1, chega: m.de - 0.99, vista: { ...vista, s: vista.s * 0.5 }, postal });
        chaves.push({ inicio: m.de, chega: m.de + 1.0, vista, postal });
      } else chaves.push({ inicio: m.de, chega: m.de + 1.0, vista, postal });
      ladoAnterior = lado;
    }
  });

  // visão geral (a dica): todos os pinos, na área livre abaixo do postal pequeno
  const todos = pinos.map((p) => p.lugar);
  const minX = Math.min(...todos.map((l) => l.x), 1);
  const maxX = Math.max(...todos.map((l) => l.x), 0);
  const minY = Math.min(...todos.map((l) => l.y), 1);
  const maxY = Math.max(...todos.map((l) => l.y), 0);
  const area = { x: 130, y: 700, w: 820, h: 380 };
  const sGeral = todos.length
    ? Math.min(area.w / Math.max(maxX - minX, 0.05), area.h / Math.max(maxY - minY, 0.05), S_PARADA * 0.8)
    : 900;
  const visaoGeral: Vista = todos.length
    ? { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, s: sGeral, ax: area.x + area.w / 2, ay: area.y + area.h / 2 }
    : { cx: 0.5, cy: 0.55, s: 900, ax: area.x + area.w / 2, ay: area.y + area.h / 2 };

  // na visão geral o postal vai para o canto de cima que não tem pino
  const livreLado = (lado: "esq" | "dir") => {
    const p = postalDaDica(lado);
    return pinos.every((pino) => {
      const q = naTela(pino.lugar, visaoGeral);
      return q.x + 44 < p.x - 8 || q.x - 44 > p.x + p.w + 8 || q.y - 106 > p.y + p.h + 8 || q.y + 6 < p.y - 8;
    });
  };
  const ladoDaDica: "esq" | "dir" = livreLado("esq") || !livreLado("dir") ? "esq" : "dir";
  momentos
    .filter((m): m is Dica => m.tipo === "dica")
    .forEach((m) => chaves.push({ inicio: m.de, chega: m.de + 1.0, vista: visaoGeral, postal: postalDaDica(ladoDaDica) }));
  chaves.sort((a, b) => a.inicio - b.inicio);

  const periodos = momentos
    .filter((m): m is Parada => m.tipo === "parada" && !!m.periodo)
    .map((m) => ({ em: m.periodo!.em, indice: m.periodo!.indice }));
  const dia = plano.dia ?? DIA_PADRAO;
  const fim = momentos.find((m) => m.tipo === "parada" && m.periodo?.indice === dia.length - 1) as Parada | undefined;
  const ultimoPeriodo = fim?.periodo ? { em: fim.periodo.em, ate: fim.ate } : null;

  return { blocos, paradas, pernas, pinos, visaoGeral, chaves, periodos, ultimoPeriodo };
};

export const DIA_PADRAO = ["Manhã", "Tarde", "Fim do dia"];

// deriva lenta enquanto a câmera "descansa" numa parada (nada fica parado)
const derivar = (v: Vista, desde: number, t: number): Vista => ({ ...v, s: v.s * (1 + 0.05 * limitar((t - desde) / 6)) });

const misturarVista = (a: Vista, b: Vista, u: number, mergulho: boolean): Vista => {
  const distancia = Math.hypot(b.cx - a.cx, b.cy - a.cy);
  // interpola o "campo de visão" (1/s), com um afastamento no meio das viagens longas
  const inv = mistura(1 / a.s, 1 / b.s, u);
  const sMeio = Math.min(a.s, b.s, 820 / Math.max(distancia, 0.001));
  const extra = mergulho ? Math.max(0, 1 / sMeio - inv) * Math.sin(Math.PI * u) : 0;
  return {
    cx: mistura(a.cx, b.cx, u),
    cy: mistura(a.cy, b.cy, u),
    s: 1 / (inv + extra),
    ax: mistura(a.ax, b.ax, u),
    ay: mistura(a.ay, b.ay, u),
  };
};

const misturarPostal = (a: Postal, b: Postal, u: number): Postal => {
  // trocando de lado, o postal encolhe um pouco e sobe no meio do caminho (passa por cima da rota sem
  // esconder a ponta dela); do mesmo lado, só balança de leve
  const atravessa = Math.abs(a.x - b.x) > 40 ? Math.sin(Math.PI * u) : 0;
  const encolhe = 1 - 0.24 * atravessa;
  const w = mistura(a.w, b.w, u) * encolhe;
  const h = mistura(a.h, b.h, u) * encolhe;
  const cx = mistura(a.x + a.w / 2, b.x + b.w / 2, u);
  return {
    x: cx - w / 2,
    y: mistura(a.y, b.y, u) - 30 * atravessa,
    w,
    h,
    borda: mistura(a.borda, b.borda, u),
    rodape: mistura(a.rodape, b.rodape, u) * encolhe,
    giro: mistura(a.giro, b.giro, u) + (atravessa === 0 && a.w === b.w ? 1.4 * Math.sin(Math.PI * u) : 0),
  };
};

const estadoNaChave = (chaves: Chave[], i: number, t: number): { vista: Vista; postal: Postal } => {
  const k = chaves[i];
  if (i === 0 || t >= k.chega) return { vista: derivar(k.vista, k.chega, t), postal: k.postal };
  const antes = estadoNaChave(chaves, i - 1, k.inicio);
  const u = k.perna ? progressoDaPerna(k.perna, t) : prog(t, k.inicio, k.chega - k.inicio, viaja);
  return { vista: misturarVista(antes.vista, k.vista, u, !!k.mergulho), postal: misturarPostal(antes.postal, k.postal, u) };
};

export const estadoNoTempo = (r: Roteiro, t: number) => {
  let i = 0;
  r.chaves.forEach((k, j) => {
    if (k.inicio <= t) i = j;
  });
  return estadoNaChave(r.chaves, i, t);
};

// o vídeo dentro da moldura do postal
export const fotoDoPostal = (p: Postal, ajuste?: { zoom?: number; ancoraY?: number }): Caixa => ({
  x: p.x + p.borda,
  y: p.y + p.borda,
  w: p.w - 2 * p.borda,
  h: p.h - 2 * p.borda - p.rodape,
  raio: 4,
  zoom: ajuste?.zoom ?? 2.15,
  ancoraY: ajuste?.ancoraY ?? 0.42,
});

// Sol: posição contínua na barra (0 = primeiro rótulo) e o quanto já se pôs (0–1)
export const solNoTempo = (r: Roteiro, t: number) => {
  if (!r.periodos.length) return { posicao: 0, etiqueta: 0, poente: 0, aceso: 0 };
  let posicao = r.periodos[0].indice;
  // a etiqueta do rótulo ativo desliza rápido (0,45 s); o sol atravessa o céu com calma (1,1 s)
  let etiqueta = posicao;
  for (const p of r.periodos) {
    if (t >= p.em - 0.1) posicao = mistura(posicao, p.indice, prog(t, p.em - 0.1, 1.1, viaja));
    if (t >= p.em - 0.1) etiqueta = mistura(etiqueta, p.indice, prog(t, p.em - 0.1, 0.45, viaja));
  }
  const poente = r.ultimoPeriodo ? prog(t, r.ultimoPeriodo.em + 1.0, Math.max(0.8, r.ultimoPeriodo.ate - r.ultimoPeriodo.em - 1.4), viaja) : 0;
  const aceso = prog(t, r.periodos[0].em - 0.1, 0.6);
  return { posicao, etiqueta, poente, aceso };
};
