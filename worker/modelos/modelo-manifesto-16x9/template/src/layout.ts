// A gramática do Manifesto: PÔSTER × QUADRO CHEIO (versão deitada, 16:9).
// - Fora dos momentos, a pessoa ocupa o quadro cheio (rosto no centro), com legenda.
// - Num pôster, um campo de cor sólido cobre a pessoa (entra num corte, ou sobe rápido como uma
//   folha). O campo é vazado nas letras da palavra-janela: o vídeo aparece em cor dentro delas.
// - O pôster é montado em volta do rosto, numa FILEIRA (src/fileira.ts): a janela de um lado, o
//   texto ao lado dela; o rosto cai no meio da primeira linha da janela. O vídeo inteiro desliza
//   (na horizontal e na vertical) e aproxima o mínimo para não sobrar borda.
// - Na saída, o pôster "mergulha" na janela: cresce em volta do rosto enquanto um círculo de borda
//   seca abre a partir do rosto, e a pessoa volta cheia, limpa.
// - Selos ficam fora disso: são pequenos, na altura do peito, por cima do quadro cheio.
import { type Cartaz, type Escalada, ehPlaca, type Linha, type Palavra, type Placa, type Plano, type Poster } from "./plano";
import { type Caixa, type JanelaPosta, montarFileira, type Unidade, zoomQueCobre } from "./fileira";
import { BASE_COM_ASSINATURA, BASE_UTIL, QUADRO } from "./tema";

// as medidas comuns moram na fileira (a diagramação deitada); daqui saem para quem já importava
export { type Caixa, type JanelaPosta, medidasDaJanela, vaoEntre, zoomQueCobre } from "./fileira";

// quanto dura a subida do pôster (quando não entra num corte) e o mergulho de saída
export const ENTRADA = 0.22;
export const MERGULHO = 0.34;
// zoom do quadro cheio: alterna entre estes dois a cada corte, frase longa ou volta de um pôster
const ZOOM_CHEIO = [1, 1.12];

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

// --- Diagramação de um pôster (cartaz e o fim da escalada) ---

export type LinhaPosta = { texto: string; em: number; y: number; tamanho: number; acento: boolean; caixa: Caixa };
export type NegacaoPosta = {
  em: number;
  antes?: { texto: string; y: number; tamanho: number };
  palavra: { texto: string; y: number; tamanho: number };
  riscoEm: number;
  caixa: Caixa;
};
export type Desenho = {
  topo: LinhaPosta[];
  janela?: JanelaPosta;
  negacoes: NegacaoPosta[];
  base: LinhaPosta[];
  // onde o centro do rosto fica no quadro durante o pôster, e o zoom do vídeo
  alvo: { x: number; y: number };
  escala: number;
};

const TAMANHO_PADRAO = 96;
const GAP_NEGACAO = 10;

// O cartaz vira unidades da fileira: o topo antes da janela, as negações e a base depois dela.
export const diagramar = (
  plano: Plano,
  c: { de?: number; topo?: Linha[]; janela?: { em: number; linhas: string[]; batidas?: number[]; zoom?: number }; negacoes?: Cartaz["negacoes"]; base?: Linha[] },
  limiteBaixo = BASE_UTIL,
): Desenho => {
  const unidades: Unidade[] = [
    ...(c.topo ?? []).map((l, i): Unidade => ({ tipo: "linha", texto: l.texto, em: l.em, tamanho: l.tamanho ?? TAMANHO_PADRAO, acento: l.acento, grupo: "topo", indice: i })),
    ...(c.janela ? [{ tipo: "janela" as const, linhas: c.janela.linhas, em: c.janela.em, batidas: c.janela.batidas }] : []),
    ...(c.negacoes ?? []).map((n, i): Unidade => ({ tipo: "negacao", em: n.em, antes: n.antes, palavra: n.palavra, riscoEm: n.riscoEm, indice: i })),
    ...(c.base ?? []).map((l, i): Unidade => ({ tipo: "linha", texto: l.texto, em: l.em, tamanho: l.tamanho ?? TAMANHO_PADRAO, acento: l.acento, grupo: "base", indice: i })),
  ];
  const f = montarFileira(plano, [{ unidades, preferencia: 0 }], { limiteBaixo, de: c.de ?? -1, entrada: ENTRADA });
  const topo: LinhaPosta[] = [];
  const base: LinhaPosta[] = [];
  const negacoes: NegacaoPosta[] = [];
  for (const p of f.postas) {
    if (p.u.tipo === "linha" && p.m.tipo === "linha") {
      const l: LinhaPosta = { texto: p.u.texto, em: p.u.em, y: p.y, tamanho: p.m.tamanho, acento: !!p.u.acento, caixa: p.caixa };
      (p.u.grupo === "topo" ? topo : base).push(l);
    } else if (p.u.tipo === "negacao" && p.m.tipo === "negacao") {
      const antes = p.u.antes ? { texto: p.u.antes, y: p.y, tamanho: p.m.tamAntes } : undefined;
      negacoes.push({
        em: p.u.em,
        antes,
        palavra: { texto: p.u.palavra, y: p.y + (antes ? p.m.tamAntes + GAP_NEGACAO : 0), tamanho: p.m.tamPalavra },
        riscoEm: p.u.riscoEm,
        caixa: p.caixa,
      });
    }
  }
  const escala = Math.max(c.janela?.zoom ?? 1, f.escala);
  return { topo, janela: f.janela, negacoes, base, alvo: f.alvo, escala };
};

export const desenhoDoCartaz = (plano: Plano, m: Cartaz) =>
  diagramar(plano, m, m.fecho ? BASE_COM_ASSINATURA : BASE_UTIL);

// A escalada termina como um cartaz: a palavra curta ("MAS") antes da janela gigante.
export const desenhoFinalDaEscalada = (plano: Plano, m: Escalada) =>
  diagramar(plano, {
    de: m.de,
    topo: m.final.antes ? [{ em: m.final.antesEm ?? m.final.em - 0.2, texto: m.final.antes, tamanho: 76 }] : [],
    janela: { em: m.final.em, linhas: m.final.linhas, zoom: m.final.zoom },
  });

export const desenhoDoMomento = (plano: Plano, m: Cartaz | Escalada) =>
  m.tipo === "cartaz" ? desenhoDoCartaz(plano, m) : desenhoFinalDaEscalada(plano, m);

// ——— O vídeo da pessoa ao longo do tempo ———
// Um estado vale a partir de `de`; a troca leva `dur` segundos.
export type EstadoDoVideo = { de: number; escala: number; alvoX: number; alvoY: number; dur: number };

export const estadosDoVideo = (
  plano: Plano,
  momentos: Poster[],
  desenhos: Desenho[],
  inicioDasFrases: number[],
  palavras: Palavra[],
): EstadoDoVideo[] => {
  const rostoX = plano.rosto.x * QUADRO.w;
  const rostoY = plano.rosto.y * QUADRO.h;
  const cheioBase = zoomQueCobre(plano, rostoX, rostoY);
  // estados de quadro cheio recebem o zoom no fim, em ordem de tempo (alternando)
  const estados: (EstadoDoVideo & { cheio?: boolean })[] = [{ de: 0, escala: 1, alvoX: rostoX, alvoY: rostoY, dur: 0, cheio: true }];
  const livres: { de: number; ate: number }[] = [];
  let cursor = 0;
  momentos.forEach((m, i) => {
    if (m.de - cursor > 0.05) livres.push({ de: cursor, ate: m.de });
    const d = desenhos[i];
    // atrás de um pôster que entra seco o vídeo já pula para o lugar (o campo cobre tudo)
    estados.push({ de: Math.max(0, m.de), escala: d.escala, alvoX: d.alvo.x, alvoY: d.alvo.y, dur: entraSeco(m, momentos, plano) ? 0.02 : ENTRADA });
    const fim = fimDoMomento(m, momentos, plano.duracao);
    if (fim < plano.duracao && !colado(m, momentos)) {
      estados.push({ de: fim - 0.08, escala: 1, alvoX: rostoX, alvoY: rostoY, dur: MERGULHO, cheio: true });
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
      estados.push({ de: p.t, escala: 1, alvoX: rostoX, alvoY: rostoY, dur: 0.04, cheio: true });
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
  return estados.map(({ de, escala, alvoX, alvoY, dur }) => ({ de, escala, alvoX, alvoY, dur }));
};

export const videoNoTempo = (t: number, estados: EstadoDoVideo[]) => {
  let i = 0;
  for (let k = 0; k < estados.length; k++) if (estados[k].de <= t) i = k;
  const agora = estados[i];
  const antes = estados[Math.max(0, i - 1)];
  if (i === 0 || agora.dur <= 0) return { escala: agora.escala, alvoX: agora.alvoX, alvoY: agora.alvoY };
  const x = Math.min(1, Math.max(0, (t - agora.de) / agora.dur));
  const p = x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
  return {
    escala: antes.escala + (agora.escala - antes.escala) * p,
    alvoX: antes.alvoX + (agora.alvoX - antes.alvoX) * p,
    alvoY: antes.alvoY + (agora.alvoY - antes.alvoY) * p,
  };
};
