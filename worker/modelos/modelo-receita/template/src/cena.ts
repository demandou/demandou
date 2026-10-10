// A cozinha do modelo: a panela vista de cima (e, no fim, o pote) que reage ao que é dito.
// Este arquivo só faz contas: onde ficam a panela, os cartões de ingrediente e o pote em cada
// momento, e o que está acontecendo dentro da panela em cada instante.
import { mistura, prog, troca } from "./anim";
import { estadoNoTempo, naFicha, type Quadro, type Rect, type Trecho } from "./layout";
import { ICONES } from "./componentes/Icones";
import { encaixar, encaixarLinhas, larguraLinha } from "./medida";
import type { Acao, Ingredientes, Passo, Plano, Queda, Tinta } from "./plano";
import { BASE_DESENHO, LARGURA_UTIL, LIMITE_APP, TAM, X0, X1 } from "./tema";

// `cabo`: ângulo do cabo da panela, em graus (0 = para a direita, 90 = para baixo);
// `caboComp`: quanto o cabo passa da borda, em frações do raio (a panela grande tem cabo mais curto
// para não sair da ficha)
export type Circulo = { cx: number; cy: number; r: number; cabo: number; caboComp: number };
export type Pote = { cx: number; base: number; w: number; h: number };
// `cheio`: o pote aparece pronto (abertura e fechamento), sem esperar a ação "pote"
export type Geometria = { panela: Circulo; pote: Pote; opPanela: number; opPote: number; cheio: number };

// a base dos desenhos (panela e pote); o texto fica acima de LIMITE_APP
export const BASE = BASE_DESENHO;
export const BASE_TEXTO = LIMITE_APP - 12;

// o cabo cresce até o limite da ficha (x ≤ 1010) e do índice no pé (y ≤ 1745)
const cabo = (cx: number, cy: number, r: number, graus: number): Circulo => {
  const a = (graus * Math.PI) / 180;
  const limites = [
    Math.cos(a) > 0.05 ? (1010 - cx) / Math.cos(a) : Infinity,
    Math.cos(a) < -0.05 ? (cx - 70) / -Math.cos(a) : Infinity,
    Math.sin(a) > 0.05 ? (1745 - cy) / Math.sin(a) : Infinity,
  ];
  const alcance = Math.min(...limites);
  const caboComp = Math.max(0.45, Math.min(0.95, (alcance - 0.9 * r) / r));
  return { cx, cy, r, cabo: graus, caboComp };
};

// ---------- ingredientes: uma linha por ingrediente ----------

export type LinhaDeIngrediente = {
  ret: Rect;
  icone: { cx: number; cy: number; tamanho: number };
  numero: { x: number; corpo: number };
  // `unidade` e `nome`: as linhas já medidas (a unidade fica em cima do nome quando há espaço)
  texto: { x: number; corpo: number; duasLinhas: boolean; unidade: string[]; nome: string[] };
};

const fonteNome = { familia: "texto" as const };
const fonteUnidade = { familia: "texto" as const, italico: true };

// Até 3 ingredientes: linhas altas (quantidade grande; unidade em cima, nome embaixo, 68 px).
// De 4 a 6: linhas mais baixas; com 5 ou 6, quantidade, unidade e nome numa linha só.
// Sem quantidade dita, a coluna do número some e o texto começa logo depois do ícone.
// O texto é medido com as larguras reais da fonte: diminui até 44 px e, se ainda não couber,
// quebra o nome em duas linhas.
export const linhasDosIngredientes = (m: Ingredientes, corpo: Rect): LinhaDeIngrediente[] => {
  const itens = m.itens.slice(0, 6);
  const n = Math.max(1, itens.length);
  const gap = 14;
  const y0 = corpo.y + TAM.rotulo + 22;
  const h = n <= 3 ? 150 : (560 - gap * (n - 1)) / n;
  const duasLinhas = h >= 126;
  const corpoTexto = duasLinhas ? Math.min(TAM.ingrediente, Math.floor((h - 10) / 2.06)) : Math.min(64, Math.floor(h * 0.6));
  const tamIcone = Math.min(116, h - 18);
  const corpoNumero = duasLinhas ? Math.min(TAM.quantidade, h) : Math.round(corpoTexto * 1.3);
  return itens.map((it, i) => {
    const y = y0 + i * (h + gap);
    const xNumero = X0 + 14 + tamIcone + 18;
    const quantidade = it.quantidade?.trim() ?? "";
    const larguraNumero = quantidade ? larguraLinha(quantidade, corpoNumero) : 0;
    const xTexto = quantidade ? xNumero + larguraNumero + 20 : xNumero;
    const disponivel = X1 - 22 - xTexto;
    const unidade = it.unidade?.trim() ?? "";
    let corpoFinal = corpoTexto;
    let linhasUnidade: string[] = unidade ? [unidade] : [];
    let linhasNome: string[] = [it.nome];
    let largura = 0;
    if (duasLinhas) {
      // unidade em cima, nome embaixo; sem unidade, o nome pode usar as duas linhas
      const nome = encaixar(it.nome, { largura: disponivel, max: corpoTexto, min: 44, linhas: unidade ? 1 : 2, fonte: fonteNome });
      const und = unidade ? encaixar(unidade, { largura: disponivel, max: corpoTexto, min: 44, linhas: 1, fonte: fonteUnidade }) : null;
      corpoFinal = Math.min(nome.corpo, und?.corpo ?? nome.corpo);
      linhasNome = encaixarLinhas([it.nome], { largura: disponivel, max: corpoFinal, min: Math.min(44, corpoFinal), linhas: unidade ? 1 : 2, fonte: fonteNome }).linhas;
      linhasUnidade = unidade ? [unidade] : [];
      if (unidade && linhasNome.length > 1) linhasNome = [linhasNome.join(" ")];
      largura = Math.max(...linhasNome.map((l) => larguraLinha(l, corpoFinal, fonteNome)), unidade ? larguraLinha(unidade, corpoFinal, fonteUnidade) : 0);
    } else {
      // tudo numa linha: a unidade em itálico e o nome
      const junto = `${unidade} ${it.nome}`.trim();
      const fit = encaixar(junto, { largura: disponivel, max: corpoTexto, min: 40, linhas: 1, fonte: fonteNome });
      corpoFinal = fit.corpo;
      largura = larguraLinha(junto, corpoFinal, fonteNome) + corpoFinal * 0.1;
    }
    return {
      // a linha vai até o fim do texto (o visto pousa sobre o ícone)
      ret: { x: X0, y, w: Math.min(LARGURA_UTIL, xTexto + largura + 30 - X0), h },
      icone: { cx: X0 + 14 + tamIcone / 2, cy: y + h / 2, tamanho: tamIcone },
      numero: { x: xNumero, corpo: corpoNumero },
      texto: { x: xTexto, corpo: corpoFinal, duasLinhas: duasLinhas && (unidade !== "" || linhasNome.length > 1), unidade: linhasUnidade, nome: linhasNome },
    };
  });
};

// ---------- passos: título, faixa das anotações e cena ----------

export const ALTURA_LINHA_TITULO = 102;
export const ALTURA_FAIXA = 178;

// As linhas do título de um passo e o corpo delas: o título pode vir como texto (quebra sozinho em
// até 2 linhas) ou como linhas já quebradas. Diminui até 64 px para caber na largura do corpo.
export const tituloDoPasso = (m: Passo, largura = LARGURA_UTIL) => {
  const linhas = Array.isArray(m.titulo) ? m.titulo.filter(Boolean) : [m.titulo];
  const fit = Array.isArray(m.titulo)
    ? encaixarLinhas(linhas.slice(0, 2), { largura, max: TAM.tituloPasso, min: 64, linhas: 2 })
    : encaixar(m.titulo, { largura, max: TAM.tituloPasso, min: 64, linhas: 2 });
  return { linhas: fit.linhas.slice(0, 2), corpo: fit.corpo };
};

export const alturaDoTitulo = (m: Passo) => Math.min(2, Math.max(1, tituloDoPasso(m).linhas.length)) * ALTURA_LINHA_TITULO;

// Faixa das anotações: logo abaixo do título, acima da panela (esquerda e direita)
export const faixaDasAnotacoes = (m: Passo, corpo: Rect): Rect => ({ x: X0, y: corpo.y + alturaDoTitulo(m) + 12, w: LARGURA_UTIL, h: ALTURA_FAIXA });

// Área da cena (abaixo da faixa) num passo
export const retDaCena = (m: Passo, corpo: Rect): Rect => {
  const f = faixaDasAnotacoes(m, corpo);
  const y = f.y + f.h + 8;
  return { x: corpo.x, y, w: corpo.w, h: BASE - y };
};

const PANELA_FORA = (fichaY: number): Circulo => cabo(540, fichaY + 1370, 220, 40);

const poteDoPasso = (cena: Rect): Pote => {
  const h = Math.min(530, cena.h - 70);
  return { cx: 520, base: BASE - 4, w: h * 0.8, h };
};

// o pote pronto da abertura e do fechamento, à direita da ficha no peito
const potePronto = (fichaY: number): Pote => ({ cx: X1 - 196, base: fichaY + 452, w: 224, h: 280 });

// Geometria da cozinha num trecho (sem o efeito da ação "pote", que é aplicado por cima)
export const geometriaDoTrecho = (tr: Trecho, q: Quadro, plano: Plano, poteVisto: boolean): Geometria => {
  const m = tr.indice >= 0 ? plano.momentos[tr.indice] : null;
  if (m && m.tipo === "ingredientes") {
    const linhas = linhasDosIngredientes(m, q.corpo);
    const topo = Math.max(...linhas.map((c) => c.ret.y + c.ret.h)) + 20;
    const r = Math.min(240, (BASE - topo) / 2 - 10);
    return {
      panela: cabo(540, topo + (BASE - topo) / 2, r, 40),
      // o pote da abertura sobe junto com a ficha e some
      pote: potePronto(q.fichaY),
      opPanela: 1,
      opPote: 0,
      cheio: 1,
    };
  }
  if (m && m.tipo === "passo") {
    const cena = retDaCena(m, q.corpo);
    // a panela é a protagonista: ~65% da largura, no centro, com espaço para a chama em volta
    const r = Math.min(350, (BASE + 24 - cena.y - 40) / 2);
    const panela = cabo(520, cena.y + 40 + r, r, 32);
    if (poteVisto) {
      return { panela: cabo(X1 - 124, cena.y + 128, 125, -40), pote: poteDoPasso(cena), opPanela: 1, opPote: 1, cheio: 0 };
    }
    // o pote espera no lugar dele, invisível: na ação "pote" ele aparece ali (não sobe de fora da ficha)
    return { panela, pote: poteDoPasso(cena), opPanela: 1, opPote: 0, cheio: 0 };
  }
  // os outros blocos da ficha em cima (topicos, passos, comparacao, grafico) não usam a panela:
  // ela some depressa (e o pote também), sem deixar a cozinha pela metade embaixo do texto
  if (m && naFicha(m)) {
    return { panela: PANELA_FORA(q.fichaY), pote: { ...potePronto(q.fichaY), base: potePronto(q.fichaY).base + 900 }, opPanela: 0, opPote: 0, cheio: 0 };
  }
  // ficha no peito (abertura, dica, fechamento) ou fora da tela: a panela desce com a ficha;
  // na abertura e no fechamento o pote pronto fica à direita da ficha (a "foto" da receita)
  const pronto = m?.tipo === "cta" || m?.tipo === "abertura";
  const pote = potePronto(q.fichaY);
  const temPote = plano.momentos.some((x) => x.tipo === "passo" && x.itens.some((i) => i.acao === "pote"));
  if (pronto && (poteVisto || temPote)) {
    return { panela: PANELA_FORA(q.fichaY), pote, opPanela: 0, opPote: 1, cheio: 1 };
  }
  if (pronto) return { panela: cabo(X1 - 160, q.fichaY + 300, 120, 40), pote: { ...pote, base: pote.base + 900 }, opPanela: 1, opPote: 0, cheio: 0 };
  return { panela: PANELA_FORA(q.fichaY), pote: { ...pote, base: pote.base + 900 }, opPanela: 1, opPote: 0, cheio: 0 };
};

export const misturarGeo = (a: Geometria, b: Geometria, p: number): Geometria => ({
  panela: {
    cx: mistura(a.panela.cx, b.panela.cx, p),
    cy: mistura(a.panela.cy, b.panela.cy, p),
    r: mistura(a.panela.r, b.panela.r, p),
    cabo: mistura(a.panela.cabo, b.panela.cabo, p),
    caboComp: mistura(a.panela.caboComp, b.panela.caboComp, p),
  },
  pote: { cx: mistura(a.pote.cx, b.pote.cx, p), base: mistura(a.pote.base, b.pote.base, p), w: mistura(a.pote.w, b.pote.w, p), h: mistura(a.pote.h, b.pote.h, p) },
  // o que some, some depressa (não cruza com o que entra); o que aparece, aparece no ritmo da troca
  opPanela: b.opPanela < a.opPanela ? mistura(a.opPanela, b.opPanela, Math.min(1, p * 2.6)) : mistura(a.opPanela, b.opPanela, p),
  opPote: b.opPote < a.opPote ? mistura(a.opPote, b.opPote, Math.min(1, p * 2.6)) : mistura(a.opPote, b.opPote, p),
  cheio: mistura(a.cheio, b.cheio, p),
});

// ---------- eventos ----------

export type Queda1 = { em: number; jeito: Queda; tinta: Tinta; origem: { x: number; y: number }; indice: number };
export type Eventos = { quedas: Queda1[]; acoes: { em: number; acao: Acao }[] };

export const caiEmDe = (m: Ingredientes, i: number) => {
  const it = m.itens[i];
  const proximo = m.itens[i + 1]?.em ?? m.ate;
  return it.cai?.em ?? Math.min(it.em + 1.0, proximo - 0.1, m.ate - 0.55);
};

export const montarEventos = (plano: Plano, trechos: Trecho[], quadros: Quadro[]): Eventos => {
  const quedas: Queda1[] = [];
  const acoes: { em: number; acao: Acao }[] = [];
  trechos.forEach((tr, k) => {
    const m = tr.indice >= 0 ? plano.momentos[tr.indice] : null;
    if (m?.tipo === "ingredientes") {
      const linhas = linhasDosIngredientes(m, quadros[k].corpo);
      const fundo = Math.max(...linhas.map((l) => l.ret.y + l.ret.h));
      const n = Math.min(6, m.itens.length);
      m.itens.slice(0, 6).forEach((it, i) => {
        const def = ICONES[it.icone ?? "tigela"] ?? ICONES.tigela;
        const jeito = it.cai?.jeito ?? def.cai;
        if (jeito === "nenhum") return;
        quedas.push({
          em: caiEmDe(m, i),
          jeito,
          tinta: it.cai?.tinta ?? def.tinta,
          // sai de baixo da pilha de ingredientes (o papel esconde o começo) e cai na panela
          origem: { x: n <= 1 ? 540 : mistura(400, 680, i / (n - 1)), y: fundo - 18 },
          indice: quedas.length,
        });
      });
    }
    if (m?.tipo === "passo") m.itens.forEach((it) => it.acao && acoes.push({ em: it.em, acao: it.acao }));
  });
  acoes.sort((a, b) => a.em - b.em);
  return { quedas, acoes };
};

// ---------- estado da cozinha no instante t ----------

export const DURACAO_QUEDA = 0.55;

export type EstadoDaCozinha = {
  geo: Geometria;
  // 0 → 1: a colher desce para dentro do pote pronto
  colherNoPote: number;
  // 1 com a ficha em cima (a panela está no fogão); 0 com a ficha no peito
  naFicha: number;
  // nível do fogo já suavizado (0 = apagado, 1 baixo, 2 médio, 3 alto)
  fogo: number;
  // quando começou a mexer (ou null) e o ângulo da colher
  mexerDesde: number | null;
  angulo: number;
  // a colher aparece/some (0–1)
  colher: number;
  // 0 → 1: os ingredientes viram uma massa só
  mistura: number;
  // 0 → 1: a massa engrossa e o fundo aparece no rastro da colher
  fundo: number;
  // 0 → 1: a panela esvazia no pote
  pote: number;
  poteDesde: number | null;
  vapor: number;
  vaporDesde: number | null;
  esfriar: number;
  termometro: number;
};

const nivelDe = (a: Acao) => (a === "fogo-baixo" ? 1 : a === "fogo-medio" ? 2 : a === "fogo-alto" ? 3 : 0);

export const VOLTA = 1.6; // segundos por volta da colher

export const estadoDaCozinha = (t: number, plano: Plano, trechos: Trecho[], quadros: Quadro[], ev: Eventos): EstadoDaCozinha => {
  const e = estadoNoTempo(t, trechos, quadros);
  const primeira = (a: Acao) => ev.acoes.find((x) => x.acao === a)?.em ?? null;
  const tPote = primeira("pote");
  // geometria: mistura entre o trecho anterior e o atual; a ação "pote" troca a cena por cima
  const poteAte = (lim: number) => tPote !== null && tPote <= lim;
  const tr = trechos[e.atual];
  const trA = trechos[Math.max(0, e.anterior)];
  const geoAtual = geometriaDoTrecho(tr, quadros[e.atual], plano, poteAte(tr.troca + 0.01));
  // o trecho que está saindo já terminou o que tinha de acontecer: vale o estado de agora
  const geoAnterior = geometriaDoTrecho(trA, quadros[Math.max(0, e.anterior)], plano, poteAte(t));
  let geo = e.p >= 1 ? geoAtual : misturarGeo(geoAnterior, geoAtual, e.p);
  if (tPote !== null && tPote > tr.troca && t >= tPote - 0.05) {
    const depois = geometriaDoTrecho(tr, quadros[e.atual], plano, true);
    geo = misturarGeo(geo, depois, prog(t, tPote - 0.05, 0.55, troca));
    // o pote só aparece quando a panela já saiu do lugar dele
    geo = { ...geo, opPote: depois.opPote * prog(t, tPote + 0.22, 0.3) };
  }

  // fogo: o último comando de fogo antes de t (desligar = 0), com subida e descida suaves
  let fogo = 0;
  const comandos = ev.acoes.filter((a) => a.em <= t && (nivelDe(a.acao) > 0 || a.acao === "desligar" || a.acao === "pote"));
  let nivelAntes = 0;
  for (const c of comandos) {
    const alvo = c.acao === "desligar" || c.acao === "pote" ? 0 : nivelDe(c.acao);
    const p = prog(t, c.em, alvo > nivelAntes ? 0.45 : 0.5);
    fogo = mistura(nivelAntes, alvo, p);
    nivelAntes = alvo;
  }

  const tMexer = primeira("mexer");
  const mexendo = tMexer !== null && t >= tMexer;
  const tFim = tPote;
  const colher = mexendo ? Math.min(prog(t, tMexer, 0.3), tFim !== null ? 1 - prog(t, tFim, 0.35) : 1) : 0;
  const angulo = mexendo ? -Math.PI / 2 + ((t - tMexer) / VOLTA) * Math.PI * 2 : -Math.PI / 2;
  const tFundo = primeira("fundo");
  const tVapor = primeira("quente");
  const tEsfriar = primeira("esfriar");
  const vapor = tVapor !== null ? prog(t, tVapor, 0.5) * (tEsfriar !== null ? 1 - prog(t, tEsfriar, 0.8) : 1) : 0;
  const termometro = tVapor !== null ? prog(t, tVapor, 0.5) : 0;

  // na abertura, a colher mergulha no pote pronto logo no começo (movimento desde o 1º segundo)
  const mAtual = tr.indice >= 0 ? plano.momentos[tr.indice] : null;
  const colherNoPote = mAtual?.tipo === "abertura" ? prog(t, mAtual.de + 0.55, 0.55) : 1;

  // o fogo (e a trempe) só aparecem com a ficha em cima; no peito a panela é só um retrato
  const naFicha = quadros[e.atual].modo === "ficha" ? (quadros[Math.max(0, e.anterior)].modo === "ficha" ? 1 : e.p) : 1 - (e.p >= 1 ? 1 : e.p);
  fogo *= naFicha;

  return {
    geo,
    colherNoPote,
    naFicha,
    fogo,
    mexerDesde: mexendo ? tMexer : null,
    angulo,
    colher,
    mistura: mexendo ? prog(t, tMexer, 1.8) : 0,
    fundo: tFundo !== null ? prog(t, tFundo, 0.7) : 0,
    pote: tPote !== null ? prog(t, tPote + 0.25, 1.0) : 0,
    poteDesde: tPote,
    vapor,
    vaporDesde: tVapor,
    esfriar: tEsfriar !== null ? prog(t, tEsfriar, 0.9) : 0,
    termometro,
  };
};

// Ponto da cena para onde a anotação de cada ação aponta
export const ancoraDaAcao = (acao: Acao | undefined, c: EstadoDaCozinha): { x: number; y: number } | null => {
  const { cx, cy, r } = c.geo.panela;
  const pote = c.geo.pote;
  const boca = pote.base - pote.h;
  switch (acao) {
    case "fogo-baixo":
    case "fogo-medio":
    case "fogo-alto":
    case "desligar": {
      // a chama de cima, à esquerda
      const a = (222 * Math.PI) / 180;
      return { x: cx + Math.cos(a) * (r + 22), y: cy + Math.sin(a) * (r + 22) };
    }
    case "mexer":
      return { x: cx + r * 0.34, y: cy - r * 0.3 };
    case "fundo": {
      const a = (200 * Math.PI) / 180;
      return { x: cx + Math.cos(a) * r * 0.42, y: cy + Math.sin(a) * r * 0.42 };
    }
    case "pote":
      return { x: pote.cx + pote.w * 0.5, y: pote.base - pote.h * 0.45 };
    case "quente":
      return { x: pote.cx + pote.w * 0.1, y: boca - 110 };
    case "esfriar":
      return { x: pote.cx - pote.w * 0.5 - 58, y: pote.base - 130 };
    default:
      return null;
  }
};
