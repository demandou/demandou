// Onde cada coisa fica no quadro 1080×1920 e onde a pessoa está em cada instante.
// Regras do quadro: nada à direita de 960 px (botões do app), nada acima de 176 px (abas do app),
// conteúdo até ~1500 px, e o rosto nunca coberto.
import type { Ret } from "./anim";
import { type Caixa, caixaNoTempo, CHEIO, type EstadoDaCaixa } from "./motor/caixa";
import { ehBancada, ehPeito, type Momento, type Plano } from "./plano";
import { BASE, DIR, ESQ, TOPO } from "./tema";

// ---------- os lugares da pessoa ----------
// cheio: tela cheia, rosto na linha do centro (cartões no peito e trechos sem momento)
// alto: janela larga no alto (título da montagem; comparação com os cartões embaixo)
// canto / cantoE: janela no canto de cima, à direita / à esquerda, ao lado de um cabeçalho
// lado: janelinha no alto à esquerda, ao lado de um cartão (resposta, passos)
export type NomeDoLugar = "cheio" | "alto" | "canto" | "cantoE" | "lado";
export const LUGAR: Record<NomeDoLugar, Caixa> = {
  cheio: CHEIO,
  alto: { x: ESQ, y: TOPO, w: DIR - ESQ, h: 690, raio: 40, zoom: 1, ancoraY: 0.42 },
  canto: { x: 590, y: TOPO, w: DIR - 590, h: 430, raio: 34, zoom: 1.6, ancoraY: 0.47 },
  cantoE: { x: ESQ, y: TOPO, w: DIR - 590, h: 430, raio: 34, zoom: 1.6, ancoraY: 0.47 },
  lado: { x: ESQ, y: TOPO, w: 300, h: 392, raio: 32, zoom: 1.75, ancoraY: 0.47 },
};

// duração da troca de lugar (s) e quanto ela começa antes da primeira peça
export const TROCA = 0.6;
export const ANTES_DA_PECA = 0.3;

// ---------- os quadros da bancada (blocos universais com a pessoa numa janela) ----------
// cabeçalho = ao lado da janela; corpo = embaixo, até a base do conteúdo
export type Quadro = { lugar: NomeDoLugar; cabecalho: Ret; corpo: Ret };
export const QUADRO: Record<"canto" | "cantoE" | "lado" | "alto", Quadro> = {
  canto: {
    lugar: "canto",
    cabecalho: { x: ESQ, y: TOPO + 14, w: LUGAR.canto.x - ESQ - 34, h: LUGAR.canto.h - 14 },
    corpo: { x: ESQ, y: TOPO + LUGAR.canto.h + 30, w: DIR - ESQ, h: 1490 - (TOPO + LUGAR.canto.h + 30) },
  },
  cantoE: {
    lugar: "cantoE",
    cabecalho: { x: LUGAR.cantoE.x + LUGAR.cantoE.w + 34, y: TOPO + 14, w: DIR - (LUGAR.cantoE.x + LUGAR.cantoE.w + 34), h: LUGAR.cantoE.h - 14 },
    corpo: { x: ESQ, y: TOPO + LUGAR.cantoE.h + 30, w: DIR - ESQ, h: 1490 - (TOPO + LUGAR.cantoE.h + 30) },
  },
  lado: {
    lugar: "lado",
    cabecalho: { x: LUGAR.lado.x + LUGAR.lado.w + 22, y: TOPO, w: DIR - (LUGAR.lado.x + LUGAR.lado.w + 22), h: LUGAR.lado.h },
    corpo: { x: ESQ, y: TOPO + LUGAR.lado.h + 26, w: DIR - ESQ, h: 1490 - (TOPO + LUGAR.lado.h + 26) },
  },
  alto: {
    lugar: "alto",
    cabecalho: { x: ESQ, y: LUGAR.alto.y + LUGAR.alto.h + 28, w: DIR - ESQ, h: 150 },
    corpo: { x: ESQ, y: LUGAR.alto.y + LUGAR.alto.h + 28, w: DIR - ESQ, h: 1490 - (LUGAR.alto.y + LUGAR.alto.h + 28) },
  },
};

const ordenar = (ms: Momento[]) => [...ms].sort((a, b) => a.de - b.de);

// encostados: o segundo começa onde o primeiro acaba
export const encostados = (a: Momento | undefined, b: Momento | undefined) => !!a && !!b && Math.abs(b.de - a.ate) < 0.12;

// O lugar de cada bloco da bancada. Cada tipo tem um lugar preferido; se o bloco anterior (encostado)
// deixou a pessoa no mesmo lugar, o bloco usa o espelho, para a pessoa sempre mudar de lugar.
const PREFERIDO: Record<string, "canto" | "cantoE" | "lado" | "alto"> = {
  topicos: "canto",
  grafico: "cantoE",
  passos: "lado",
  comparacao: "alto",
};
const ESPELHO: Record<NomeDoLugar, "canto" | "cantoE" | "lado" | "alto"> = {
  canto: "cantoE",
  cantoE: "canto",
  lado: "canto",
  alto: "canto",
  cheio: "canto",
};
// onde a pessoa termina cada momento
const lugarFinal = (m: Momento, quadros: Map<Momento, Quadro>): NomeDoLugar => {
  if (m.tipo === "montagem") return m.itens.length ? "canto" : m.titulo ? "alto" : "canto";
  if (m.tipo === "resposta") return "lado";
  const q = quadros.get(m);
  return q ? q.lugar : "cheio";
};

export const quadrosDaBancada = (plano: Plano): Map<Momento, Quadro> => {
  const quadros = new Map<Momento, Quadro>();
  const ms = ordenar(plano.momentos);
  ms.forEach((m, i) => {
    const pref = PREFERIDO[m.tipo];
    if (!pref) return;
    const antes = ms[i - 1];
    let escolha = pref;
    if (antes && encostados(antes, m) && lugarFinal(antes, quadros) === pref) escolha = ESPELHO[pref];
    quadros.set(m, QUADRO[escolha]);
  });
  return quadros;
};

export const estadosDaPessoa = (plano: Plano, quadros: Map<Momento, Quadro>): EstadoDaCaixa[] => {
  const est: EstadoDaCaixa[] = [{ de: -10, caixa: CHEIO }];
  const ajuste = plano.ajusteJanela ?? 0;
  let atual: Caixa = CHEIO;
  const poe = (de: number, c: Caixa) => {
    if (c === atual) return;
    atual = c;
    est.push({ de, caixa: c === CHEIO ? c : { ...c, ancoraY: (c.ancoraY ?? 0.3) + ajuste / c.h }, dur: TROCA });
  };
  let cursor = 0;
  for (const m of ordenar(plano.momentos)) {
    if (m.de > cursor + 0.05) poe(cursor, CHEIO);
    if (ehPeito(m)) poe(m.de, CHEIO);
    if (m.tipo === "montagem") {
      if (m.titulo) poe(m.de, LUGAR.alto);
      if (m.itens.length) poe(m.titulo ? Math.max(m.de + 0.8, m.itens[0].em - ANTES_DA_PECA) : m.de, LUGAR.canto);
    }
    if (m.tipo === "resposta") poe(m.de, LUGAR.lado);
    const q = quadros.get(m);
    if (q) poe(m.de, LUGAR[q.lugar]);
    cursor = m.ate;
  }
  if (cursor < plano.duracao - 0.05) poe(cursor, CHEIO);
  return est;
};

export const caixaDaPessoa = (t: number, estados: EstadoDaCaixa[]) => caixaNoTempo(t, estados);

// 0 = pessoa em tela cheia, 1 = pessoa numa janela (para a moldura e a etiqueta)
export const emJanela = (c: Caixa) => Math.min(1, Math.max(0, (1080 - c.w) / 120));

export { ehBancada, ehPeito };

// ---------- a bancada da montagem ----------
// título digitado embaixo da janela "alto"
export const TITULO_BANCADA = { x: ESQ, y: LUGAR.alto.y + LUGAR.alto.h + 34, w: DIR - ESQ };
// vagas a lápis embaixo do título, enquanto a pessoa está no alto
export const VAGAS = { topo: 1124, base: 1490 };
// cabeçalho ao lado da janela "canto": "Peça 1 de 4", o nome grande e a fila de peças
export const CABECALHO = { x: ESQ, y: TOPO + 14, w: LUGAR.canto.x - ESQ - 34, h: LUGAR.canto.h - 14 };
// a pilha de peças
export const PILHA = { x: ESQ, w: DIR - ESQ, topo: TOPO + LUGAR.canto.h + 30, base: 1490 };

export const alturaDaPeca = (n: number) => Math.min(300, (PILHA.base - PILHA.topo) / Math.max(1, n));
export const retDaPeca = (i: number, n: number): Ret => {
  const h = alturaDaPeca(n);
  return { x: PILHA.x, y: PILHA.topo + i * h, w: PILHA.w, h };
};
export const retDaVaga = (i: number, n: number): Ret => {
  const h = Math.min(92, (VAGAS.base - VAGAS.topo) / Math.max(1, n));
  const sobra = VAGAS.base - VAGAS.topo - h * n;
  return { x: PILHA.x, y: VAGAS.topo + sobra / 2 + i * h, w: PILHA.w, h };
};

// ---------- a resposta ----------
export const CAIXA_PROMPT = { x: LUGAR.lado.x + LUGAR.lado.w + 22, y: TOPO, w: DIR - (LUGAR.lado.x + LUGAR.lado.w + 22), h: LUGAR.lado.h };
export const CARTAO_RESPOSTA = { x: ESQ, y: TOPO + LUGAR.lado.h + 26, w: DIR - ESQ, h: BASE - (TOPO + LUGAR.lado.h + 26) };
// as peças dentro da caixa do prompt
export const retNaCaixa = (i: number, n: number): Ret => {
  const topo = CAIXA_PROMPT.y + 82;
  const base = CAIXA_PROMPT.y + CAIXA_PROMPT.h - 26;
  const h = Math.min(74, (base - topo) / Math.max(1, n));
  return { x: CAIXA_PROMPT.x + 24, y: topo + i * h, w: CAIXA_PROMPT.w - 24 - 112, h };
};

// ---------- cartões no peito (pessoa em tela cheia) ----------
// centrados no rosto (x 540), sem passar de 960 px; a base fica em 1484 e o topo nunca sobe acima
// da zona calculada pelo motor (logo abaixo do queixo)
export const CARTAO_PEITO = { x: 120, w: 840, base: 1484 };
export const alturaLivreNoPeito = (plano: Plano) => {
  const topo = plano.zona?.topo ?? 976;
  return Math.max(300, CARTAO_PEITO.base - topo + 12);
};
