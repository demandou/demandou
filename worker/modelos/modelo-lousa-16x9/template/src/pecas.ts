// As peças de uma página da lousa (o que é escrito, onde e quando) e as medidas de texto.
// Compartilhado pelos blocos universais (blocos.ts) e pela conta na lousa (paginas.ts).
import { temposDoTexto } from "./anim";
import { circuloDeGiz, duracaoDaEscrita, montarLinha, sublinhadoDeGiz } from "./giz/Escrita";
import { GLIFOS } from "./giz/glifos";
import type { Regiao } from "./layout";
import type { Palavra } from "./plano";
import { cor, MIN } from "./tema";

export type Alinhar = "esq" | "centro" | "dir";

export type PecaEscrita = {
  tipo: "escrita";
  id: string;
  texto: string;
  x: number;
  // linha de base
  y: number;
  // altura do algarismo/maiúscula, em px
  tamanho: number;
  alinhar: Alinhar;
  cor: string;
  em: number;
  dur: number;
  // já aparece fraco ("a giz apagado") desde o começo da página e é escrito por cima no `em`
  esboco?: boolean;
  // o esboço só aparece a partir daqui (quando o apagador e a janela já liberaram o lugar)
  aparece?: number;
  // some neste instante (o "?" que dá lugar ao resultado)
  some?: number;
  // fica fraco a partir deste instante (o zero que não importa depois que a vírgula andou)
  esmaece?: number;
  // anda (desliza) entre `de` e `ate`
  desloca?: { dx: number; dy: number; de: number; ate: number };
  // anda sobre um caminho (a vírgula que pula casas); x,y é o começo do caminho
  trajeto?: { d: string; de: number; ate: number };
  // vem da página anterior (a peça de lá com esta chave desliza até aqui)
  herda?: string;
  // para a página seguinte herdar
  chave?: string;
  // some neste instante porque a janela da página seguinte vem para cima dela (sem deixar pedaço aparecendo)
  cobertaEm?: number;
};

export type PecaTraco = {
  tipo: "traco";
  id: string;
  d: string[];
  largura: number;
  cor: string;
  em: number;
  dur: number;
  esboco?: boolean;
  aparece?: number;
  // começa só depois que esta peça (id) terminar de ser escrita
  depois?: string;
  // destaque de resultado (círculo, sublinhado): fica inteiro na lousa ao menos RESPIRO s antes de ser apagado
  respira?: boolean;
  cobertaEm?: number;
};

export type PecaRotulo = {
  tipo: "rotulo";
  id: string;
  texto: string;
  x: number;
  y: number;
  tamanho: number;
  alinhar: Alinhar;
  cor: string;
  peso?: number;
  em: number;
  // sem caixa-alta espaçada (assinatura)
  natural?: boolean;
  cobertaEm?: number;
};

export type Peca = PecaEscrita | PecaTraco | PecaRotulo;

export type Som = { em: number; arquivo: string; volume: number };

// O que cada página devolve: as peças, os sons e os instantes importantes (para conferir)
export type Montado = { pecas: Peca[]; sons: Som[]; marcos: number[] };

// ---------- medidas ----------

export const largura = (texto: string, tamanho: number) => montarLinha(texto, tamanho).largura;

// maior tamanho (até `maximo`) em que o texto cabe na largura
export const caber = (texto: string, larguraMax: number, maximo: number, minimo = 40) => {
  const w100 = largura(texto, 100);
  return Math.max(minimo, Math.min(maximo, (larguraMax / Math.max(w100, 1)) * 100));
};

export const esquerdaDe = (x: number, w: number, alinhar: Alinhar) => (alinhar === "esq" ? x : alinhar === "centro" ? x - w / 2 : x - w);

// espaço entre as linhas de um texto de várias linhas, em fração do tamanho
export const ENTRELINHA = 0.42;

export type TextoAjustado = { linhas: string[][]; tamanho: number; larguras: number[]; altura: number };

// Quebra um texto em até `linhas` linhas equilibradas e acha o maior tamanho em que ele cabe na
// largura e na altura. Medido com a letra de verdade (a fonte já carregou). Se nem no `minimo`
// couber, continua diminuindo até o `piso`: o texto nunca vaza.
export const ajustarTexto = (
  texto: string,
  o: { largura: number; altura: number; maximo: number; minimo: number; linhas: number; piso?: number; entrelinha?: number; juntas?: Set<number> },
): TextoAjustado => {
  const ws = texto.split(/\s+/).filter(Boolean);
  // `juntas`: índices i em que a palavra i não se separa da i+1 (um destaque não quebra no meio)
  const podeCortar = (k: number) => !o.juntas?.has(k - 1);
  if (!ws.length) return { linhas: [], tamanho: o.minimo, larguras: [], altura: 0 };
  const entre = o.entrelinha ?? ENTRELINHA;
  const w100 = ws.map((w) => largura(w, 100));
  const espaco = GLIFOS[" "].a;
  const larguraDe = (a: number, b: number) => w100.slice(a, b).reduce((s, v) => s + v, 0) + espaco * Math.max(0, b - a - 1);
  // melhor divisão em n linhas: a que deixa a linha mais larga o mais curta possível
  const dividir = (n: number): { cortes: number[]; maior: number } => {
    if (n <= 1 || ws.length <= 1) return { cortes: [ws.length], maior: larguraDe(0, ws.length) };
    let melhor = { cortes: [ws.length], maior: Infinity };
    const tentar = (inicio: number, resta: number, cortes: number[], maior: number) => {
      if (maior >= melhor.maior) return;
      if (resta === 1) {
        const m = Math.max(maior, larguraDe(inicio, ws.length));
        if (m < melhor.maior) melhor = { cortes: [...cortes, ws.length], maior: m };
        return;
      }
      for (let k = inicio + 1; k <= ws.length - resta + 1; k++) if (podeCortar(k)) tentar(k, resta - 1, [...cortes, k], Math.max(maior, larguraDe(inicio, k)));
    };
    tentar(0, Math.min(n, ws.length), [], 0);
    return melhor;
  };
  const piso = Math.min(o.piso ?? 34, o.minimo);
  const opcoes = Array.from({ length: Math.min(o.linhas, ws.length) }, (_, i) => ({ n: i + 1, ...dividir(i + 1) })).filter((op) => op.maior < Infinity);
  // linha "órfã" (bem mais curta que a maior, como um "A" sozinho) lê mal: conta contra
  const orfa = (op: { cortes: number[]; maior: number }) => {
    let ini = 0;
    let menor = Infinity;
    for (const c of op.cortes) {
      menor = Math.min(menor, larguraDe(ini, c));
      ini = c;
    }
    return op.cortes.length > 1 && menor < op.maior * 0.34;
  };
  const altura = (n: number, s: number) => s * n + s * entre * (n - 1);
  // o maior tamanho de cada número de linhas; uma linha a mais só vale se o texto crescer ~14%
  // (menos linhas leem melhor)
  let escolha = opcoes[opcoes.length - 1];
  let tamanho = piso;
  let melhorNota = -1;
  for (const op of opcoes) {
    const s = Math.min(o.maximo, (o.largura * 100) / Math.max(1, op.maior), o.altura / (op.n + entre * (op.n - 1)));
    if (s < piso) continue;
    const nota = s * Math.pow(0.86, op.n - 1) * (s < o.minimo ? 0.7 : 1) * (orfa(op) ? 0.8 : 1);
    if (nota > melhorNota) {
      melhorNota = nota;
      escolha = op;
      tamanho = s;
    }
  }
  if (melhorNota < 0) {
    // nem no piso: a menor altura possível, com o tamanho que a largura permitir
    escolha = opcoes.reduce((a, b) => (b.maior < a.maior ? b : a));
    tamanho = Math.max(24, Math.min(piso, (o.largura / Math.max(1, escolha.maior)) * 100, o.altura / (escolha.n + entre * (escolha.n - 1))));
  }
  const linhas: string[][] = [];
  let ini = 0;
  for (const c of escolha.cortes) {
    linhas.push(ws.slice(ini, c));
    ini = c;
  }
  return {
    linhas,
    tamanho,
    larguras: linhas.map((l) => largura(l.join(" "), tamanho)),
    altura: altura(linhas.length, tamanho),
  };
};

// ---------- peças ----------

export const escrita = (
  id: string,
  texto: string,
  x: number,
  y: number,
  tamanho: number,
  em: number,
  extra: Partial<PecaEscrita> = {},
): PecaEscrita => ({
  tipo: "escrita",
  id,
  texto,
  x,
  y,
  tamanho,
  alinhar: "esq",
  cor: cor.giz,
  em,
  dur: duracaoDaEscrita(montarLinha(texto, tamanho)),
  ...extra,
});

export const rotulo = (id: string, texto: string, x: number, y: number, em: number, alinhar: Alinhar = "esq"): PecaRotulo => ({
  tipo: "rotulo",
  id,
  texto,
  x,
  y,
  tamanho: MIN.rotulo,
  alinhar,
  cor: cor.rotulo,
  em,
});

// palavras de uma linha, cada uma com seu tempo (fala) e sua cor (destaque em amarelo)
export const palavrasEmLinha = (
  id: string,
  palavras: string[],
  tempos: number[],
  x: number,
  y: number,
  tamanho: number,
  alinhar: Alinhar,
  amarelas: Set<number>,
  indiceInicial = 0,
  cores: { base?: string; destaque?: string } = {},
): PecaEscrita[] => {
  const espaco = (GLIFOS[" "].a * tamanho) / 100;
  const ws = palavras.map((w) => largura(w, tamanho));
  const total = ws.reduce((a, b) => a + b, 0) + espaco * Math.max(0, palavras.length - 1);
  let cx = esquerdaDe(x, total, alinhar);
  return palavras.map((w, k) => {
    const i = indiceInicial + k;
    const p = escrita(`${id}-${i}`, w, cx, y, tamanho, tempos[i] ?? 0, {
      cor: amarelas.has(i) ? (cores.destaque ?? cor.amarelo) : (cores.base ?? cor.giz),
    });
    // a palavra não pode demorar mais que o intervalo até a próxima
    const prox = tempos[i + 1];
    if (prox !== undefined && prox > p.em) p.dur = Math.min(p.dur, Math.max(0.16, prox - p.em + 0.05));
    cx += ws[k] + espaco;
    return p;
  });
};

const semPontuacao = (w: string) => w.replace(/[.,!?;:…"“”]+$/, "").replace(/^["“”]+/, "");

// índices das palavras que formam o trecho em destaque
export const indicesDoDestaque = (palavras: string[], destaque?: string) => {
  const marcadas = new Set<number>();
  if (!destaque) return marcadas;
  const alvo = destaque.split(/\s+/).filter(Boolean);
  for (let i = 0; i + alvo.length <= palavras.length; i++) {
    if (alvo.every((a, k) => semPontuacao(palavras[i + k]) === semPontuacao(a))) {
      alvo.forEach((_, k) => marcadas.add(i + k));
      break;
    }
  }
  if (!marcadas.size) {
    // sem diferença de maiúscula e acento
    const n = (w: string) => semPontuacao(w).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    for (let i = 0; i + alvo.length <= palavras.length; i++) {
      if (alvo.every((a, k) => n(palavras[i + k]) === n(a))) {
        alvo.forEach((_, k) => marcadas.add(i + k));
        break;
      }
    }
  }
  return marcadas;
};

// uma linha escrita de uma vez (sem casar com a fala), com as palavras em sequência
export const linhaCorrida = (
  id: string,
  texto: string,
  x: number,
  y: number,
  tamanho: number,
  alinhar: Alinhar,
  em: number,
  destaque?: string,
  durMax = 1.3,
): PecaEscrita[] => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const tintas = palavras.map((w) => montarLinha(w, tamanho).tinta);
  const total = tintas.reduce((a, b) => a + b, 0);
  const dur = Math.min(durMax, Math.max(0.3, total / 2900));
  const tempos: number[] = [];
  let acum = 0;
  tintas.forEach((ti) => {
    tempos.push(em + (acum / total) * dur);
    acum += ti;
  });
  const pecas = palavrasEmLinha(id, palavras, tempos, x, y, tamanho, alinhar, indicesDoDestaque(palavras, destaque));
  pecas.forEach((p, k) => (p.dur = Math.max(0.12, (tintas[k] / total) * dur)));
  return pecas;
};

export const circuloEm = (id: string, p: PecaEscrita, em: number, corCirculo: string = cor.amarelo): PecaTraco => {
  const w = largura(p.texto, p.tamanho);
  const x = esquerdaDe(p.x, w, p.alinhar);
  return {
    tipo: "traco",
    id,
    d: [circuloDeGiz(x + w / 2, p.y - p.tamanho * 0.5, w / 2 + p.tamanho * (w > p.tamanho ? 0.14 : 0.22), p.tamanho * 0.68, p.tamanho + w)],
    largura: Math.max(7, p.tamanho * 0.055),
    cor: corCirculo,
    em,
    dur: 0.28,
    depois: p.id,
    respira: true,
  };
};

export const fimDe = (p: PecaEscrita) => p.em + p.dur;

export const sublinhadoDuplo = (id: string, p: PecaEscrita, em: number, larguraFixa?: number, corTraco: string = cor.amarelo): PecaTraco[] => {
  const w = larguraFixa ?? largura(p.texto, p.tamanho);
  const x = esquerdaDe(p.x, w, p.alinhar);
  const l = Math.max(8, p.tamanho * 0.055);
  return [
    { tipo: "traco", id: `${id}-1`, d: [sublinhadoDeGiz(x - 10, x + w + 14, p.y + p.tamanho * 0.2, 11)], largura: l, cor: corTraco, em, dur: 0.2, depois: p.id },
    { tipo: "traco", id: `${id}-2`, d: [sublinhadoDeGiz(x + 4, x + w + 24, p.y + p.tamanho * 0.34, 12)], largura: l, cor: corTraco, em: em + 0.18, dur: 0.2, depois: `${id}-1`, respira: true },
  ];
};

// ---------- texto falado em várias linhas ----------

// Escreve um texto já quebrado em linhas, cada palavra no instante em que é dita.
// `topo` = onde começa o bloco (a primeira linha de base fica um tamanho abaixo).
export const textoEmLinhas = (
  id: string,
  ajuste: TextoAjustado,
  tempos: number[],
  x: number,
  topo: number,
  alinhar: Alinhar,
  amarelas: Set<number> = new Set(),
  cores: { base?: string; destaque?: string } = {},
): { pecas: PecaEscrita[]; bases: number[] } => {
  const pecas: PecaEscrita[] = [];
  const bases: number[] = [];
  let y = topo;
  let indice = 0;
  ajuste.linhas.forEach((l, i) => {
    y += ajuste.tamanho + (i ? ajuste.tamanho * ENTRELINHA : 0);
    bases.push(y);
    pecas.push(...palavrasEmLinha(id, l, tempos, x, y, ajuste.tamanho, alinhar, amarelas, indice, cores));
    indice += l.length;
  });
  return { pecas, bases };
};

// tempos das palavras de um texto dito a partir de `inicio` (até `ate`)
export const temposFalados = (texto: string, palavras: Palavra[], inicio: number, ate: number) =>
  temposDoTexto(texto, palavras, inicio, ate, inicio);

// a caixa ocupada por um conjunto de peças de escrita
export const caixaDoTexto = (pecas: PecaEscrita[]): Regiao => {
  if (!pecas.length) return { x: 0, y: 0, w: 0, h: 0 };
  const xs = pecas.map((p) => esquerdaDe(p.x, largura(p.texto, p.tamanho), p.alinhar));
  const x2 = pecas.map((p, i) => xs[i] + largura(p.texto, p.tamanho));
  const y1 = pecas.map((p) => p.y - p.tamanho);
  const y2 = pecas.map((p) => p.y + p.tamanho * 0.3);
  const x = Math.min(...xs);
  const y = Math.min(...y1);
  return { x, y, w: Math.max(...x2) - x, h: Math.max(...y2) - y };
};

// ---------- cabeçalho de passo (ao lado da janela) ----------

// Rótulo pequeno ("Passo 1") e título a giz amarelo, grande. O título aparece esboçado (giz fraco)
// assim que o lugar fica livre e é escrito por cima no `tituloEm`. Uma linha; se não couber num
// tamanho bom, quebra em duas; título longo quebra em até três e diminui até caber.
export const cabecalho = (m: { passo?: string; titulo?: string; tituloEm?: number }, C: Regiao | null, de: number): Peca[] => {
  if (!C || (!m.passo && !m.titulo)) return [];
  const pecas: Peca[] = [];
  const temRotulo = !!m.passo;
  let linhas: string[] = m.titulo ? [m.titulo] : [];
  let tamanhos = linhas.map((l) => caber(l, C.w, 190, 60));
  if (m.titulo && tamanhos[0] < 100 && m.titulo.includes(" ")) {
    const ws = m.titulo.split(" ");
    let melhor = 1;
    let menorDif = Infinity;
    for (let k = 1; k < ws.length; k++) {
      const dif = Math.abs(ws.slice(0, k).join(" ").length - ws.slice(k).join(" ").length);
      if (dif < menorDif) [menorDif, melhor] = [dif, k];
    }
    linhas = [ws.slice(0, melhor).join(" "), ws.slice(melhor).join(" ")];
    const t = Math.min(...linhas.map((l) => caber(l, C.w, 150, 60)));
    tamanhos = [t, t];
  }
  const alturaLivre = C.h - (temRotulo ? 74 : 0);
  const altura0 = tamanhos.reduce((a, t, i) => a + t + (i ? t * 0.42 : 0), 0);
  if (m.titulo && (linhas.some((l, i) => largura(l, tamanhos[i]) > C.w + 1) || altura0 > alturaLivre)) {
    const aj = ajustarTexto(m.titulo, { largura: C.w, altura: alturaLivre, maximo: 150, minimo: 56, linhas: 3 });
    linhas = aj.linhas.map((l) => l.join(" "));
    tamanhos = linhas.map(() => aj.tamanho);
  }
  const altura = (temRotulo ? 74 : 0) + tamanhos.reduce((a, t, i) => a + t + (i ? t * 0.42 : 0), 0);
  let y = C.y + Math.max(0, (C.h - altura) / 2);
  if (temRotulo) {
    pecas.push(rotulo("passo", m.passo as string, C.x, y + MIN.rotulo, de + 0.12));
    y += 74;
  }
  const em = m.tituloEm ?? de + 0.3;
  linhas.forEach((l, i) => {
    y += tamanhos[i] + (i ? tamanhos[i] * 0.42 : 0);
    pecas.push(escrita(`titulo-${i}`, l, C.x, y, tamanhos[i], em + i * 0.35, { cor: cor.amarelo, esboco: true }));
  });
  return pecas;
};

// Quebra um texto num tamanho fixo: o menor número de linhas (até `maxLinhas`) em que cada linha
// cabe na largura, com as linhas equilibradas. Devolve null se não couber.
export const quebrar = (texto: string, tamanho: number, larguraMax: number, maxLinhas: number): string[][] | null => {
  const ws = texto.split(/\s+/).filter(Boolean);
  if (!ws.length) return [];
  const w = ws.map((p) => largura(p, tamanho));
  const espaco = (GLIFOS[" "].a * tamanho) / 100;
  const larguraDe = (a: number, b: number) => w.slice(a, b).reduce((s, v) => s + v, 0) + espaco * Math.max(0, b - a - 1);
  if (Math.max(...w) > larguraMax) return null;
  for (let n = 1; n <= Math.min(maxLinhas, ws.length); n++) {
    // equilibrado: procura a divisão em n linhas com a linha mais larga menor
    let melhor: { cortes: number[]; maior: number } | null = null;
    const tentar = (inicio: number, resta: number, cortes: number[], maior: number) => {
      if (melhor && maior >= melhor.maior) return;
      if (resta === 1) {
        const m = Math.max(maior, larguraDe(inicio, ws.length));
        if (!melhor || m < melhor.maior) melhor = { cortes: [...cortes, ws.length], maior: m };
        return;
      }
      for (let k = inicio + 1; k <= ws.length - resta + 1; k++) tentar(k, resta - 1, [...cortes, k], Math.max(maior, larguraDe(inicio, k)));
    };
    tentar(0, n, [], 0);
    const achado = melhor as { cortes: number[]; maior: number } | null;
    if (achado && achado.maior <= larguraMax) {
      const linhas: string[][] = [];
      let ini = 0;
      for (const c of achado.cortes) {
        linhas.push(ws.slice(ini, c));
        ini = c;
      }
      return linhas;
    }
  }
  return null;
};

// Formata um número em pt-BR: 83000 → "83.000"; 1.5 → "1,5"
export const numeroBR = (valor: number, casas?: number) => {
  const decimais = casas ?? Math.min(2, (String(valor).split(".")[1] ?? "").length);
  const fixo = Math.abs(valor).toFixed(decimais);
  const [inteiro, dec] = fixo.split(".");
  const milhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (valor < 0 ? "−" : "") + milhar + (dec ? `,${dec}` : "");
};

// pares de palavras que não se separam numa quebra de linha: as do trecho em destaque
export const juntasDoDestaque = (texto: string, destaque?: string) => {
  const marcadas = [...indicesDoDestaque(texto.split(/\s+/).filter(Boolean), destaque)].sort((a, b) => a - b);
  return new Set(marcadas.filter((i) => marcadas.includes(i + 1)));
};
