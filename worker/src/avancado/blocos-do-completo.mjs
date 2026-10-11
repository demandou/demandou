import { segundosDaAncora } from "./portao.mjs";

/**
 * O COMPLETO SOB MEDIDA EM BLOCOS (11/10/2026): as contas puras (testadas) do
 * completo-avancado.mjs. O vídeo inteiro (a fala limpa) é dividido em blocos de
 * cerca de 60 s, cortados na MAIOR PAUSA perto dos 60 s (a emenda cai no
 * silêncio, sem salto de áudio), cada bloco é um corte do editor avançado no
 * quadro do formato da gravação, e os blocos são emendados sem recodificar.
 *
 * A continuidade entre blocos não depende de escrever um depois do outro: o
 * primeiro bloco define o ENQUADRAMENTO BASE (o último quadro do apresentador
 * nele) e a faixa da legenda; todo bloco começa e termina nesse enquadramento,
 * e o worker fixa isso no roteiro (fixarContinuidade). Assim os outros blocos
 * são escritos em paralelo, logo depois do primeiro.
 */
export const BLOCO_ALVO_SEG = 60;
export const BLOCO_MINIMO_SEG = 40;
export const JANELA_DA_PAUSA_SEG = 15;
/** O teto de IA do completo sob medida: US$ 2 por minuto (aprovado pelo Bruno em 11/10), dividido pelos blocos. */
export const USD_POR_MINUTO_DO_COMPLETO = 2;
/** O piso do teto de um bloco: a escrita e um conserto de código cabem sempre (só pesa em vídeo de menos de 40 s). */
export const PISO_DO_BLOCO_USD = 1.3;
const FPS = 30;

const naGrade = (s, fps = FPS) => Math.round(s * fps) / fps;
const r3 = (x) => +Number(x).toFixed(3);

/**
 * Onde cortar: a maior pausa entre duas palavras com o meio dentro de [de, ate]
 * (frase que termina em ponto ganha um pouco; perto do alvo desempata). Sem
 * pausa na janela, o vão entre palavras mais perto do alvo. Devolve o segundo do
 * corte (o meio da pausa) ou null.
 */
export function melhorPausa(palavras, de, ate, alvo) {
  let melhor = null;
  for (let i = 0; i + 1 < palavras.length; i++) {
    const a = palavras[i];
    const b = palavras[i + 1];
    const vao = Math.max(0, b.de - a.ate);
    const meio = (a.ate + b.de) / 2;
    if (meio <= de || meio >= ate) continue;
    const ponto = /[.!?…]["')\]]?$/.test(String(a.w).trim()) ? 0.25 : 0;
    const perto = 1 - Math.min(1, Math.abs(meio - alvo) / Math.max(1, (ate - de) / 2));
    const nota = vao + ponto + 0.05 * perto;
    if (!melhor || nota > melhor.nota) melhor = { nota, meio, vao };
  }
  return melhor;
}

/**
 * Os blocos do completo: [{ indice, de, ate }] na grade de quadros, cobrindo
 * [0, duracao] sem buraco. Cada bloco tem de ~45 a ~75 s; o resto de até 80 s
 * fica num bloco só; entre 80 e 120 s, o resto é dividido ao meio (nenhum bloco
 * abaixo de 40 s). Puro (testado).
 */
export function blocosPelaPausa(palavras, duracao, { alvo = BLOCO_ALVO_SEG, janela = JANELA_DA_PAUSA_SEG, minimo = BLOCO_MINIMO_SEG, fps = FPS } = {}) {
  const total = Math.floor(Number(duracao) * fps) / fps;
  if (!(total > 0)) return [];
  const fala = (palavras ?? []).map((p) => ({ de: Number(p.de ?? p.em), ate: Number(p.ate), w: String(p.w ?? "") })).filter((p) => Number.isFinite(p.de) && Number.isFinite(p.ate)).sort((a, b) => a.de - b.de);
  const cortes = [];
  let inicio = 0;
  for (;;) {
    const resto = total - inicio;
    if (resto <= alvo + 20) break;
    // entre 80 e 120 s: dois blocos parecidos, nenhum pequeno demais
    const meta = resto < 2 * alvo ? inicio + resto / 2 : inicio + alvo;
    const de = Math.max(inicio + minimo, meta - janela);
    const ate = Math.min(total - minimo, meta + janela);
    let corte = de < ate ? melhorPausa(fala, de, ate, meta)?.meio ?? null : null;
    if (corte === null) corte = Math.min(total - minimo, Math.max(inicio + minimo, meta));
    corte = naGrade(corte, fps);
    if (corte <= inicio + 1 / fps || corte >= total - 1 / fps) break;
    cortes.push(corte);
    inicio = corte;
  }
  // as bordas em quadros inteiros (o segundo é quadro / fps, sem arredondar: a emenda conta quadro a quadro)
  const bordas = [0, ...cortes, total].map((x) => Math.round(x * fps));
  return bordas.slice(0, -1).map((q, i) => ({ indice: i, de: q / fps, ate: bordas[i + 1] / fps, quadros: bordas[i + 1] - q }));
}

/** A fala de um bloco, no tempo do bloco ({ em, ate, w }, o formato do pedido): só as palavras que começam dentro dele. Puro (testado). */
export function palavrasDoBloco(palavras, bloco) {
  const dur = bloco.ate - bloco.de;
  return (palavras ?? [])
    .map((p) => ({ de: Number(p.de ?? p.em), ate: Number(p.ate), w: String(p.w ?? "") }))
    .filter((p) => p.w.trim() && p.de >= bloco.de - 1e-6 && p.de < bloco.ate - 1e-6)
    .map((p) => ({ em: r3(Math.max(0, p.de - bloco.de)), ate: r3(Math.min(dur, Math.max(p.ate, p.de + 0.05) - bloco.de)), w: p.w }));
}

/** O teto de IA de cada bloco: US$ 2 por minuto do vídeo, na proporção da duração do bloco, com o piso. Puro (testado). */
export function tetoDoBloco(bloco, { usdPorMinuto = USD_POR_MINUTO_DO_COMPLETO, piso = PISO_DO_BLOCO_USD } = {}) {
  return +Math.max(piso, ((bloco.ate - bloco.de) / 60) * usdPorMinuto).toFixed(2);
}

const CAMPOS_DO_ENQUADRAMENTO = ["caixa", "forma", "borda", "recorte", "cabecaPorFora", "escala", "rosto", "base", "acompanhar", "inclinacao"];

/** O enquadramento de um quadro do apresentador, sem o instante e a transição. */
export function enquadramento(q) {
  const e = {};
  for (const k of CAMPOS_DO_ENQUADRAMENTO) if (q?.[k] !== undefined) e[k] = q[k];
  return e;
}

const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Os quadros do apresentador em ordem de tempo, com o segundo de cada um (âncora fora da fala vai para o fim). */
function emOrdem(roteiro, palavras, duracao) {
  return (roteiro.apresentador ?? [])
    .map((q, i) => ({ q, i, s: segundosDaAncora(q.em ?? "inicio", palavras, duracao) ?? duracao }))
    .sort((a, b) => a.s - b.s || a.i - b.i);
}

/**
 * A continuidade que o primeiro bloco deixa para os outros: o enquadramento
 * base (o do último quadro do apresentador), a faixa da legenda, as cenas (o
 * que cada uma explicou) e o comum.tsx. Puro (testado).
 */
export function continuidadeDoPrimeiro(arquivos, palavras, duracao) {
  const roteiro = JSON.parse(arquivos["roteiro.json"]);
  const lista = emOrdem(roteiro, palavras, duracao);
  const ultimo = lista.length ? lista[lista.length - 1].q : {};
  return {
    apresentador: enquadramento(ultimo),
    legenda: roteiro.legenda ?? null,
    cenas: (roteiro.cenas ?? []).map((c) => ({ arquivo: String(c.arquivo), oQue: String(c.oQue ?? "") })),
    comum: typeof arquivos["comum.tsx"] === "string" ? arquivos["comum.tsx"] : null,
  };
}

/**
 * FIXA A EMENDA no roteiro de um bloco (o worker faz, não a IA): com
 * `fixarInicio`, o primeiro quadro do apresentador é o enquadramento base em
 * "inicio"; o bloco termina no enquadramento base, estável (nenhuma transição
 * passa do fim; se o último quadro é outro, um quadro base entra a 1,5 s do
 * fim); a legenda é a faixa do vídeo. Devolve os arquivos com o roteiro novo
 * (o mesmo objeto quando nada muda, ou o roteiro não é JSON). Puro (testado).
 */
export function fixarContinuidade(arquivos, { base, legenda = null, fixarInicio = false }, palavras, duracao) {
  if (!base || !arquivos?.["roteiro.json"]) return arquivos;
  let roteiro;
  try {
    roteiro = JSON.parse(arquivos["roteiro.json"]);
  } catch {
    return arquivos;
  }
  if (!roteiro || typeof roteiro !== "object") return arquivos;
  const antes = JSON.stringify(roteiro);
  let lista = emOrdem(roteiro, palavras, duracao);
  if (fixarInicio) {
    // o começo: o enquadramento base em "inicio" (o que a IA pôs no instante 0 sai)
    lista = lista.filter((x) => x.s > 0.05);
    lista.unshift({ q: { em: "inicio", ...base }, i: -1, s: 0 });
  }
  // o fim: nada começa a menos de 1 s do fim (a transição não terminaria no bloco)
  lista = lista.filter((x, k) => k === 0 || x.s < duracao - 1.0);
  if (!lista.length) return arquivos;
  const ultimo = lista[lista.length - 1];
  const fimDoUltimo = ultimo.s + Number(ultimo.q.transicao ?? 0.9);
  if (!igual(enquadramento(ultimo.q), base)) {
    const em = r3(Math.max(fimDoUltimo + 0.05, duracao - 1.5));
    const transicao = r3(Math.max(0.05, Math.min(0.9, duracao - 0.1 - em)));
    if (em < duracao - 0.1) lista.push({ q: { em, transicao, ...base }, i: 999, s: em });
    else ultimo.q = { ...ultimo.q, ...base };
  } else if (ultimo.s > 0 && fimDoUltimo > duracao - 0.1) {
    ultimo.q = { ...ultimo.q, transicao: r3(Math.max(0.05, duracao - 0.1 - ultimo.s)) };
  }
  roteiro.apresentador = lista.map((x) => x.q);
  if (legenda) roteiro.legenda = legenda;
  if (JSON.stringify(roteiro) === antes) return arquivos;
  return { ...arquivos, "roteiro.json": JSON.stringify(roteiro, null, 1) };
}

/**
 * O prazo do worker para o completo sob medida (o app usa a mesma conta, mais a
 * fila): 30 min fixos, 10 min de IA por bloco de 60 s (a escrita em paralelo
 * folga, o conserto e a revisão não) e 15 s de portões e render por segundo de
 * vídeo (o render da cena própria leva ~10 s por segundo no i3). Puro (testado).
 */
export function prazoDoCompletoAvancadoMs(duracaoSeg) {
  const dur = Number(duracaoSeg) > 0 ? Number(duracaoSeg) : 1200;
  return Math.round((30 * 60 + Math.ceil(dur / 60) * 10 * 60 + dur * 15) * 1000);
}
