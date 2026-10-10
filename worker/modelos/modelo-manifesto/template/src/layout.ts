// A gramática do Manifesto: PÔSTER × QUADRO CHEIO.
// - Fora dos momentos, a pessoa ocupa o quadro cheio (rosto no centro), com legenda.
// - Num pôster, um campo de cor sólido cobre a pessoa (entra num corte, ou sobe rápido como uma
//   folha). O campo é vazado nas letras da palavra-janela: o vídeo aparece em cor dentro delas.
// - O pôster é montado em volta do rosto: a primeira linha da janela fica na altura do rosto. Se
//   não houver espaço, o vídeo inteiro desliza (e aproxima o mínimo para não sobrar borda).
// - Na saída, o pôster "mergulha" na janela: cresce em volta do rosto enquanto um círculo de borda
//   seca abre a partir do rosto, e a pessoa volta cheia, limpa.
// - Selos ficam fora disso: são pequenos, na altura do peito, por cima do quadro cheio.
import { type Cartaz, type Escalada, ehPlaca, type Linha, type Palavra, type Placa, type Plano, type Poster } from "./plano";
import {
  ACENTO,
  APERTO,
  BASE_COM_ASSINATURA,
  BASE_UTIL,
  caber,
  CEDILHA,
  LARGURA_JANELA,
  LARGURA_TEXTO,
  MAIUSCULA,
  QUADRO,
  temAcento,
  temCedilha,
  TOPO_UTIL,
} from "./tema";

// quanto dura a subida do pôster (quando não entra num corte) e o mergulho de saída
export const ENTRADA = 0.22;
export const MERGULHO = 0.34;
// zoom do quadro cheio: alterna entre estes dois a cada corte, frase longa ou volta de um pôster
const ZOOM_CHEIO = [1, 1.1];

// Pôsteres em ordem, sem sobreposição (um termina quando o próximo começa).
export const ordenar = (plano: Plano): Poster[] => {
  const ordem = plano.momentos.filter((m): m is Poster => !ehPlaca(m)).sort((a, b) => a.de - b.de);
  return ordem.map((m, i) => {
    const prox = ordem[i + 1];
    return prox && m.ate > prox.de ? { ...m, ate: prox.de } : m;
  });
};

// Placas: o selo do demo, o número e o destaque (no quadro cheio, na altura do peito).
export const placas = (plano: Plano): Placa[] => plano.momentos.filter(ehPlaca).sort((a, b) => a.de - b.de);

// Fundo de cada pôster: o do plano ou, sem ele, alternando cobalto / papel. A comparação usa os
// dois (o de cima é o dela). Dois pôsteres colados nunca repetem a cor sozinhos.
export const campos = (momentos: Poster[]) => momentos.map((m, i) => m.campo ?? (i % 2 === 0 ? "cobalto" : "papel"));

// Último pôster colado no fim (ou um fecho) fica até o último quadro.
export const fimDoMomento = (m: Poster, momentos: Poster[], duracao: number) => {
  const temProximo = momentos.some((o) => o.de > m.de);
  const fecho = (m.tipo === "cartaz" && !!m.fecho) || m.tipo === "cta";
  if (!temProximo && (fecho || m.ate >= duracao - 0.3)) return duracao + 1;
  return m.ate;
};

// O próximo pôster começa colado neste? (aí não há mergulho: o próximo entra no lugar)
export const colado = (m: Poster, momentos: Poster[]) => momentos.some((o) => o.de > m.de && o.de - m.ate < 0.08);

// O pôster entra seco (de uma vez)? Sim quando começa num corte do vídeo (o corte esconde a troca)
// ou colado no pôster anterior. Fora disso, sobe rápido como uma folha (ENTRADA).
export const entraSeco = (m: Poster, momentos: Poster[], plano: Plano) =>
  m.de <= 0.05 ||
  (plano.cortesEm ?? []).some((c) => Math.abs(c - m.de) <= 0.12) ||
  momentos.some((o) => o.de < m.de && m.de - o.ate < 0.08);

// ——— Diagramação de um pôster ———

export type LinhaPosta = { texto: string; em: number; y: number; tamanho: number; acento: boolean };
export type JanelaPosta = {
  linhas: { texto: string; base: number }[];
  tamanho: number;
  topo: number;
  altura: number;
  em: number;
  batidas: number[];
  // contador das listas: a partir de cada `em`, a janela mostra outras linhas ("01" → "02")
  trocas?: { em: number; linhas: string[] }[];
  // sem palavra curta: a pessoa aparece num círculo (o mesmo do mergulho de saída)
  circulo?: { cx: number; cy: number; r: number };
};
export type NegacaoPosta = { em: number; antes?: { texto: string; y: number; tamanho: number }; palavra: { texto: string; y: number; tamanho: number }; riscoEm: number };
export type Desenho = {
  topo: LinhaPosta[];
  janela?: JanelaPosta;
  negacoes: NegacaoPosta[];
  base: LinhaPosta[];
  // onde o centro do rosto fica no quadro durante o pôster, e o zoom do vídeo
  alvo: { x: number; y: number };
  escala: number;
};

const ESPACO_BLOCOS = 40;
const TAMANHO_PADRAO = 96;
const ANTES_NEGACAO = 54;
const PALAVRA_NEGACAO = 150;
const GAP_NEGACAO = 12;
const ENTRE_NEGACOES = 30;

const tamanhoDaLinha = (l: Linha) => caber(l.texto, LARGURA_TEXTO, l.tamanho ?? TAMANHO_PADRAO, l.tamanho && l.tamanho < 70 ? 700 : 900, APERTO);
// espaço entre duas linhas de texto (o acento da de baixo precisa de lugar)
export const vaoEntre = (de: { texto: string; tamanho: number } | null, para: { texto: string; tamanho: number }) =>
  de ? Math.max(14, (temAcento(para.texto) ? ACENTO + 0.04 : 0.12) * para.tamanho + (temCedilha(de.texto) ? 0.12 * de.tamanho : 0)) : 0;

// Altura da palavra-janela em "em" (multiplique pelo tamanho): maiúsculas + vãos para acento/cedilha.
export const medidasDaJanela = (linhas: string[]) => {
  const topo = temAcento(linhas[0]) ? ACENTO + 0.02 : 0.02;
  const capas: number[] = [];
  let y = topo;
  linhas.forEach((l, i) => {
    if (i > 0) y += 0.07 + (temAcento(l) ? ACENTO : 0) + (temCedilha(linhas[i - 1]) ? CEDILHA : 0);
    capas.push(y);
    y += MAIUSCULA;
  });
  y += temCedilha(linhas[linhas.length - 1]) ? CEDILHA : 0.02;
  return { capas, altura: y };
};

// Zoom mínimo para o vídeo cobrir o quadro inteiro com o rosto em (alvoX, alvoY).
export const zoomQueCobre = (plano: Plano, alvoX: number, alvoY: number) => {
  const H0 = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
  const fx = plano.rosto.x;
  const fy = (plano.rosto.y * QUADRO.h) / H0;
  // a escala-base do VideoNaCaixa (o menor tamanho que cobre o quadro)
  const base = Math.max(1, QUADRO.h / H0);
  const s = Math.max(
    alvoX / (fx * QUADRO.w),
    (QUADRO.w - alvoX) / ((1 - fx) * QUADRO.w),
    alvoY / (fy * H0),
    (QUADRO.h - alvoY) / ((1 - fy) * H0),
  );
  return Math.max(1, (s * 1.002) / base);
};

export const diagramar = (
  plano: Plano,
  c: { de?: number; topo?: Linha[]; janela?: { em: number; linhas: string[]; batidas?: number[]; zoom?: number }; negacoes?: Cartaz["negacoes"]; base?: Linha[] },
  limiteBaixo = BASE_UTIL,
): Desenho => {
  const disponivel = limiteBaixo - TOPO_UTIL;
  const topo = (c.topo ?? []).map((l) => ({ ...l, tamanho: tamanhoDaLinha(l) }));
  const base = (c.base ?? []).map((l) => ({ ...l, tamanho: tamanhoDaLinha(l) }));
  const negacoes = (c.negacoes ?? []).map((n) => ({
    ...n,
    tamAntes: n.antes ? caber(n.antes, LARGURA_TEXTO, ANTES_NEGACAO, 700) : 0,
    tamPalavra: caber(n.palavra, LARGURA_TEXTO, PALAVRA_NEGACAO, 900, APERTO),
  }));

  // altura de cada pilha de texto
  const alturaPilha = (ls: { texto: string; tamanho: number }[]) =>
    ls.reduce((h, l, i) => h + vaoEntre(i > 0 ? ls[i - 1] : null, l) + l.tamanho, 0);
  const hTopo = alturaPilha(topo);
  const hBase = alturaPilha(base);
  const hNeg = negacoes.reduce((h, n, i) => h + (i > 0 ? ENTRE_NEGACOES : 0) + (n.antes ? n.tamAntes + GAP_NEGACAO : 0) + n.tamPalavra, 0);
  const blocos = [hTopo, c.janela ? 1 : 0, hNeg, hBase].filter((h) => h > 0).length;
  const outros = hTopo + hBase + hNeg + Math.max(0, blocos - 1) * ESPACO_BLOCOS;

  // tamanho da janela: o maior que cabe na largura e na altura que sobra
  let janela: JanelaPosta | undefined;
  let alturaJanela = 0;
  let centroRostoNaJanela = 0;
  let medidas = { capas: [0], altura: 0 };
  let tamJanela = 0;
  if (c.janela) {
    medidas = medidasDaJanela(c.janela.linhas);
    const pelaLargura = Math.min(...c.janela.linhas.map((l) => caber(l, LARGURA_JANELA, 640, 900, APERTO)));
    const pelaAltura = Math.floor((disponivel - outros) / medidas.altura);
    tamJanela = Math.max(120, Math.min(pelaLargura, pelaAltura));
    alturaJanela = medidas.altura * tamJanela;
    // o rosto fica no meio da maiúscula da primeira linha
    centroRostoNaJanela = (medidas.capas[0] + MAIUSCULA * 0.5) * tamJanela;
  }

  const total = outros + alturaJanela;
  const rostoY = plano.rosto.y * QUADRO.h;
  // onde o bloco começa: com janela, o rosto manda; sem janela, centrado na faixa útil
  const offRosto = (hTopo > 0 ? hTopo + ESPACO_BLOCOS : 0) + centroRostoNaJanela;
  const ideal = c.janela ? rostoY - offRosto : TOPO_UTIL + (disponivel - total) / 2;
  const y0 = Math.max(TOPO_UTIL, Math.min(limiteBaixo - total, ideal));

  // empilha
  let y = y0;
  const pilha = (ls: (Linha & { tamanho: number })[]) =>
    ls.map((l, i) => {
      y += vaoEntre(i > 0 ? ls[i - 1] : null, l);
      const posta: LinhaPosta = { texto: l.texto, em: l.em, y, tamanho: l.tamanho, acento: !!l.acento };
      y += l.tamanho;
      return posta;
    });
  const topoPosto = pilha(topo);
  if (topo.length) y += ESPACO_BLOCOS;
  if (c.janela) {
    janela = {
      linhas: c.janela.linhas.map((texto, i) => ({ texto, base: y + (medidas.capas[i] + MAIUSCULA) * tamJanela })),
      tamanho: tamJanela,
      topo: y,
      altura: alturaJanela,
      // a palavra abre quando é falada, mas não antes de o pôster terminar de entrar
      em: Math.max(c.janela.em, (c.de ?? -1) + ENTRADA * 0.6),
      batidas: c.janela.batidas ?? [],
    };
    y += alturaJanela + ESPACO_BLOCOS;
  }
  const negPostas: NegacaoPosta[] = negacoes.map((n, i) => {
    if (i > 0) y += ENTRE_NEGACOES;
    const antes = n.antes ? { texto: n.antes, y, tamanho: n.tamAntes } : undefined;
    if (n.antes) y += n.tamAntes + GAP_NEGACAO;
    const palavra = { texto: n.palavra, y, tamanho: n.tamPalavra };
    y += n.tamPalavra;
    return { em: n.em, antes, palavra, riscoEm: n.riscoEm };
  });
  if (negacoes.length) y += ESPACO_BLOCOS;
  const basePosta = pilha(base);

  const alvoY = c.janela ? y0 + offRosto : rostoY;
  const alvo = { x: QUADRO.w / 2, y: alvoY };
  const escala = Math.max(c.janela?.zoom ?? 1, zoomQueCobre(plano, alvo.x, alvo.y));
  return { topo: topoPosto, janela, negacoes: negPostas, base: basePosta, alvo, escala };
};

export const desenhoDoCartaz = (plano: Plano, m: Cartaz) =>
  diagramar(plano, m, m.fecho ? BASE_COM_ASSINATURA : BASE_UTIL);

// A escalada termina como um cartaz: a palavra curta ("MAS") em cima e a janela gigante.
export const desenhoFinalDaEscalada = (plano: Plano, m: Escalada) =>
  diagramar(plano, {
    de: m.de,
    topo: m.final.antes ? [{ em: m.final.antesEm ?? m.final.em - 0.2, texto: m.final.antes, tamanho: 64 }] : [],
    janela: { em: m.final.em, linhas: m.final.linhas, zoom: m.final.zoom },
  });

export const desenhoDoMomento = (plano: Plano, m: Cartaz | Escalada) =>
  m.tipo === "cartaz" ? desenhoDoCartaz(plano, m) : desenhoFinalDaEscalada(plano, m);

// ——— O vídeo da pessoa ao longo do tempo ———
// Um estado vale a partir de `de`; a troca leva `dur` segundos.
export type EstadoDoVideo = { de: number; escala: number; alvoY: number; dur: number };

export const estadosDoVideo = (
  plano: Plano,
  momentos: Poster[],
  desenhos: Desenho[],
  inicioDasFrases: number[],
  palavras: Palavra[],
): EstadoDoVideo[] => {
  const rostoY = plano.rosto.y * QUADRO.h;
  const cheioBase = zoomQueCobre(plano, QUADRO.w / 2, rostoY);
  // estados de quadro cheio recebem o zoom no fim, em ordem de tempo (alternando)
  const estados: (EstadoDoVideo & { cheio?: boolean })[] = [{ de: 0, escala: 1, alvoY: rostoY, dur: 0, cheio: true }];
  const livres: { de: number; ate: number }[] = [];
  let cursor = 0;
  momentos.forEach((m, i) => {
    if (m.de - cursor > 0.05) livres.push({ de: cursor, ate: m.de });
    const d = desenhos[i];
    // atrás de um pôster que entra seco o vídeo já pula para o lugar (o campo cobre tudo)
    estados.push({ de: Math.max(0, m.de), escala: d.escala, alvoY: d.alvo.y, dur: entraSeco(m, momentos, plano) ? 0.02 : ENTRADA });
    const fim = fimDoMomento(m, momentos, plano.duracao);
    if (fim < plano.duracao && !colado(m, momentos)) {
      estados.push({ de: fim - 0.08, escala: 1, alvoY: rostoY, dur: MERGULHO, cheio: true });
      cursor = fim;
    } else cursor = Math.max(cursor, fim);
  });
  if (plano.duracao - cursor > 0.05) livres.push({ de: cursor, ate: plano.duracao });

  // no quadro cheio, cortes, frases novas e pausas curtas trocam o zoom (seco): disfarça o pulo e dá ritmo
  const pontos = [
    ...(plano.cortesEm ?? []).map((t) => ({ t, minimo: 1.0 })),
    ...inicioDasFrases.map((t) => ({ t, minimo: 1.0 })),
    // palavra que vem depois de uma pausa curta ("É você, | hoje")
    ...palavras.filter((p, i) => i > 0 && p.em - palavras[i - 1].ate >= 0.2).map((p) => ({ t: p.em, minimo: 1.2 })),
  ].sort((a, b) => a.t - b.t);
  for (const livre of livres) {
    let ultimo = livre.de;
    for (const p of pontos) {
      if (p.t < livre.de + 0.6 || p.t > livre.ate - 0.6) continue;
      if (p.t - ultimo < p.minimo) continue;
      estados.push({ de: p.t, escala: 1, alvoY: rostoY, dur: 0.04, cheio: true });
      ultimo = p.t;
    }
  }
  estados.sort((a, b) => a.de - b.de);
  let z = 0;
  for (const e of estados) {
    if (!e.cheio) continue;
    e.escala = Math.max(cheioBase, ZOOM_CHEIO[z % 2]);
    z += 1;
  }
  return estados.map(({ de, escala, alvoY, dur }) => ({ de, escala, alvoY, dur }));
};

export const videoNoTempo = (t: number, estados: EstadoDoVideo[]) => {
  let i = 0;
  for (let k = 0; k < estados.length; k++) if (estados[k].de <= t) i = k;
  const agora = estados[i];
  const antes = estados[Math.max(0, i - 1)];
  if (i === 0 || agora.dur <= 0) return { escala: agora.escala, alvoY: agora.alvoY };
  const x = Math.min(1, Math.max(0, (t - agora.de) / agora.dur));
  const p = x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
  return { escala: antes.escala + (agora.escala - antes.escala) * p, alvoY: antes.alvoY + (agora.alvoY - antes.alvoY) * p };
};
