// A gramática de layout do Cinema no QUADRO DEITADO (16:9, 1920×1080): a versão do vídeo completo
// do YouTube, no mesmo estilo do corte vertical. A imagem da pessoa continua vivendo numa janela
// cercada de preto, as barras continuam abrindo e fechando com a intensidade da fala
// (plano.intensidade) e a câmera continua aproximando devagar e sem parar. O que muda é a
// composição, que segue a aula 9 do curso (editar uma aula horizontal):
//
// - a BASE é a pessoa em tela cheia (o vídeo deitado inteiro, sem recorte vertical): nos níveis da
//   curva a janela tem a largura toda, entre uma barra fina em cima e a barra de baixo, onde mora a
//   narração (a legenda);
// - quando um bloco pede apoio visual (os blocos de barra: letreiro, abertura, número, destaque,
//   definição, comparação, pergunta, créditos; e os de cartela alta: tópicos, passos, gráfico), a
//   pessoa vai para uma MOLDURA do lado direito, com o rosto centralizado nela e acompanhado com
//   ajuste suave (o rastro do motor), e o bloco ocupa o QUADRO preto do lado esquerdo. O que no
//   vertical ia na barra de cima fica em cima no quadro; o que ia na de baixo, embaixo:
//
//     [ quadro: crédito / título / número ...  |  MOLDURA com o rosto ]
//
//   Na cartela alta a moldura desce (fica na base, mais baixa), como a janela que desce no vertical;
// - a cartela fecha a tela até o preto e a frase-chave cresce sobre a imagem escurecida, como no
//   vertical, recompostas para o quadro deitado (colunas e fileiras em vez de pilha alta).
import { interpolate } from "remotion";
import { travelling } from "./anim";
import type { Caixa, Rosto } from "./motor/caixa";
import type { Momento, Nivel, Plano } from "./plano";

// --- medidas do quadro deitado ---
export const QUADRO = { w: 1920, h: 1080 };
// margens seguras do YouTube: 96 px nas laterais
export const MARGEM = 96;
// a faixa de cima que fica livre (nada de conteúdo colado na borda)
export const TOPO_DO_APP = 60;
// abaixo daqui ficam os controles do player (barra de tempo, botões): texto nunca passa desta linha
export const LIMITE_APP = 984;
// onde as barras se encontram quando fecham (px): um pouco acima do meio
export const COSTURA = 480;

// A moldura da pessoa nos blocos (aula 9): do lado direito, com a margem preta em volta.
export const MOLDURA = { esq: 1056, dir: QUADRO.w - MARGEM, topo: 96, base: LIMITE_APP };
// Na cartela alta (listas, passos, gráficos) a moldura desce para a base, mais baixa.
export const MOLDURA_BAIXA = { ...MOLDURA, topo: 404 };
// vão entre o quadro do texto e a moldura
export const VAO_MOLDURA = 64;
// O quadro do texto: da margem esquerda até o vão antes da moldura (896 px de largura).
export const QUADRO_TEXTO = { x: MARGEM, largura: MOLDURA.esq - VAO_MOLDURA - MARGEM, topo: 104, base: 976 };
export const LARGURA_TEXTO = QUADRO_TEXTO.largura;
export const ALTURA_QUADRO = QUADRO_TEXTO.base - QUADRO_TEXTO.topo;
// vão entre o que no vertical ia na barra de cima e o que ia na de baixo
export const VAO_DO_QUADRO = 44;

// As alturas do que vai em cima e embaixo no quadro: `cima` é a reserva do que no vertical ia na
// barra de cima (0 = nada); o resto, menos o vão, é do que ia na de baixo.
export const divisaoDoQuadro = (cima: number) => {
  const c = Math.max(0, Math.round(cima));
  return { cima: c, baixo: ALTURA_QUADRO - c - (c > 0 ? VAO_DO_QUADRO : 0) };
};

// Os estados da janela: os níveis da curva (0 a 4, a largura toda) e os da moldura:
// 5 = a moldura baixa da cartela alta (listas, passos, gráficos);
// 6 = a moldura em close (o nível 3 do vertical); 7 = a moldura larga (o nível 2 do vertical).
export type Alvo = Nivel | 5 | 6 | 7;

export type Estado = {
  // janela da imagem: de `esq` a `dir` e de `topo` a `base` (px)
  esq: number;
  dir: number;
  topo: number;
  base: number;
  // aproximação da câmera (1 = o menor enquadramento que cobre a janela)
  zoom: number;
  // altura do rosto dentro da janela (0 = topo, 1 = base)
  ancora: number;
  // lugar do rosto na largura da janela (0 = esquerda, 1 = direita); na moldura, 0,5 (centralizado)
  ancoraX: number;
  // velocidade da aproximação lenta, em fração por segundo
  empurra: number;
};

// ancora/ancoraX negativos = onde a gravação pôs o rosto (rosto.y / rosto.x)
const CHEIA = { esq: 0, dir: QUADRO.w, ancoraX: -1 };
const NIVEIS: Record<Exclude<Alvo, 4>, Estado> = {
  // aberto: tela cheia, sem barras, rosto onde a gravação o pôs
  0: { ...CHEIA, topo: 0, base: QUADRO.h, zoom: 1.0, ancora: -1, empurra: 0.004 },
  // respiro: barra fina em cima; a de baixo guarda a narração acima dos controles do player
  1: { ...CHEIA, topo: 50, base: 850, zoom: 1.04, ancora: 0.4, empurra: 0.008 },
  // tensão: janela larga (~2,7:1), rosto e ombros; a barra de baixo cresce (frase-chave, fala)
  2: { ...CHEIA, topo: 80, base: 790, zoom: 1.12, ancora: 0.44, empurra: 0.014 },
  // clímax: cinemascope apertado (~3,2:1), rosto em close; a barra de baixo mais alta
  3: { ...CHEIA, topo: 120, base: 720, zoom: 1.26, ancora: 0.48, empurra: 0.022 },
  // cartela alta: a moldura desce para a base, do lado direito; o quadro à esquerda leva a lista
  5: { ...MOLDURA_BAIXA, zoom: 1, ancora: 0.45, ancoraX: 0.5, empurra: 0.012 },
  // moldura em close (os blocos que apertam no nível 3 do vertical)
  6: { ...MOLDURA, zoom: 1, ancora: 0.42, ancoraX: 0.5, empurra: 0.02 },
  // moldura larga (os blocos de janela larga do vertical)
  7: { ...MOLDURA, zoom: 1, ancora: 0.42, ancoraX: 0.5, empurra: 0.012 },
};
// Na moldura, a largura do rosto em fração da largura da moldura (o zoom sai do tamanho do rosto
// gravado, medido pelo rastro): close, larga e a da cartela alta.
const ROSTO_NA_MOLDURA: Record<5 | 6 | 7, number> = { 5: 0.36, 6: 0.42, 7: 0.33 };
// a moldura nunca amplia o vídeo de trabalho mais que isto (fica mole)
const AMPLIACAO_MAX = 1.4;
// a aproximação lenta nunca passa disto (fração sobre o zoom do nível)
const EMPURRA_MAX = 0.12;

const naMoldura = (n: number): Alvo => (n >= 3 ? 6 : 7);

// Onde fica o conteúdo da cartela alta (px): o quadro do lado esquerdo da moldura.
export const CARTELA_ALTA = { topo: QUADRO_TEXTO.topo, base: QUADRO_TEXTO.base };

// O estado que cada bloco impõe às barras enquanto dura (null = segue a curva de intensidade).
export const alvoDoBloco = (m: Momento): Alvo | null => {
  switch (m.tipo) {
    case "cartela":
      return 4;
    case "letreiro":
    case "abertura":
      return naMoldura(m.nivel ?? 3);
    case "creditos":
    case "cta":
      return naMoldura(m.nivel ?? 2);
    case "numero":
    case "comparacao":
    case "pergunta":
      return 6;
    case "destaque":
      return m.nivel === "chave" ? 7 : 6;
    case "definicao":
      return 7;
    case "topicos":
    case "passos":
    case "grafico":
      return 5;
    default:
      return null;
  }
};

// Uma mudança de estado: a partir de `de`, leva `dur` segundos para chegar.
type Chave = { de: number; dur: number; nivel: Alvo; daCurva?: boolean };

const ordenar = (ms: Momento[]) => [...ms].sort((a, b) => a.de - b.de);

// Curva de intensidade: a do plano, ou uma automática (1 na narração, 2 nas frases, 3 nas falas).
export const curvaDeIntensidade = (plano: Plano) => {
  if (plano.intensidade?.length) return [...plano.intensidade].sort((a, b) => a.de - b.de);
  const curva: { de: number; nivel: Nivel }[] = [{ de: 0, nivel: 1 }];
  for (const m of ordenar(plano.momentos)) {
    if (m.tipo === "frase") curva.push({ de: m.de, nivel: 2 }, { de: m.ate, nivel: 1 });
    if (m.tipo === "fala") curva.push({ de: m.de - 0.3, nivel: 3 }, { de: m.ate, nivel: 1 });
  }
  return curva.sort((a, b) => a.de - b.de);
};

// O nível que a curva manda num instante (sem contar os blocos).
export const nivelDaCurva = (curva: { de: number; nivel: Nivel }[], t: number): Nivel => {
  let n: Nivel = 1;
  for (const c of curva) if (c.de <= t + 0.001) n = c.nivel;
  return n;
};

export const chavesDaJanela = (plano: Plano): Chave[] => {
  const ordem = ordenar(plano.momentos);
  const curva = curvaDeIntensidade(plano);
  const nivelEm = (t: number) => nivelDaCurva(curva, t);
  // os blocos que mandam nas barras enquanto duram
  const fixos = ordem.filter((m) => alvoDoBloco(m) !== null);
  const dentroDeFixo = (t: number) => fixos.some((m) => t >= m.de - 0.01 && t < m.ate - 0.01);
  const primeiro = ordem[0] && ordem[0].de <= 0.15 ? ordem[0] : undefined;
  const alvoInicial = primeiro ? alvoDoBloco(primeiro) : null;
  const nivelInicial: Alvo = alvoInicial ?? nivelEm(0);

  const chaves: Chave[] = [{ de: -100, dur: 0.01, nivel: nivelInicial }];
  for (const c of curva) {
    if (c.de <= 0.001 || dentroDeFixo(c.de)) continue;
    chaves.push({ de: c.de, dur: c.nivel === 4 ? 0.8 : 1.2, nivel: c.nivel, daCurva: true });
  }
  ordem.forEach((m, i) => {
    const alvo = alvoDoBloco(m);
    if (alvo === null) return;
    const anterior = ordem[i - 1];
    const proximo = ordem[i + 1];
    // o bloco anterior termina colado neste e já deixa as barras no mesmo estado: nada se mexe
    const mesmoEstado = anterior && m.de - anterior.ate < 0.15 && alvoDoBloco(anterior) === alvo;
    if (m.de > 0.15 && !mesmoEstado) {
      const dur = alvo === 4 ? 0.55 : m.tipo === "creditos" || m.tipo === "cta" ? 1.1 : 1.0;
      chaves.push({ de: m.de, dur, nivel: alvo });
    }
    // no fim, as barras voltam à curva — a não ser que outro bloco comece colado
    const emenda = proximo && proximo.de - m.ate < 0.15 && alvoDoBloco(proximo) !== null;
    const ultimo = (m.tipo === "creditos" || m.tipo === "cta") && m.ate >= plano.duracao - 0.3;
    // uma frase ou fala colada logo depois: as barras chegam mais rápido, para ela aparecer inteira
    const colada = proximo && proximo.de - m.ate < 0.3 && alvoDoBloco(proximo) === null;
    const dur = alvo === 4 ? 1.0 : colada ? 0.7 : 1.2;
    if (!emenda && !ultimo) chaves.push({ de: m.ate, dur, nivel: nivelEm(m.ate) });
  });
  return chaves.sort((a, b) => a.de - b.de);
};

const misturar = (a: Estado, b: Estado, p: number): Estado => {
  const m = (x: number, y: number) => x + (y - x) * p;
  return {
    esq: m(a.esq, b.esq),
    dir: m(a.dir, b.dir),
    topo: m(a.topo, b.topo),
    base: m(a.base, b.base),
    zoom: m(a.zoom, b.zoom),
    ancora: m(a.ancora, b.ancora),
    ancoraX: m(a.ancoraX, b.ancoraX),
    empurra: m(a.empurra, b.empurra),
  };
};

// a altura do vídeo de trabalho (no 16:9, 1080: o quadro inteiro)
const alturaDoVideo = (plano: Plano) => Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
// a largura média do rosto (fração da largura do quadro), do rastro do cortar.mjs ou o padrão do 16:9
export const larguraDoRosto = (plano: Plano) => {
  const r = (plano.rosto as Rosto).rastro?.largura;
  return r && r > 0.03 ? r : 0.13;
};

// Devolve uma função que dá o estado da janela em qualquer instante. Cada troca parte de onde a
// anterior estava naquele instante (nunca salta), e dentro de cada nível a câmera aproxima devagar.
export const linhaDaJanela = (plano: Plano) => {
  const chaves = chavesDaJanela(plano);
  const rostoY = Math.min(0.45, Math.max(0.28, plano.rosto.y));
  const rostoX = Math.min(0.85, Math.max(0.15, plano.rosto.x));
  const H0 = alturaDoVideo(plano);
  const largura = larguraDoRosto(plano);
  // Gravação muito perto da câmera (o rosto ocupa mais de ~1/4 da largura do quadro deitado): as
  // janelas da largura toda não aproximam mais (o rosto já está em close) e o rosto sobe um pouco.
  const perto = Math.min(1, Math.max(0, (largura - 0.25) / 0.12));
  // na moldura: o zoom que deixa o rosto do tamanho certo nela (nunca menos que cobrir a moldura)
  const zoomNaMoldura = (n: Estado, fracao: number) => {
    const w = n.dir - n.esq;
    const cobre = Math.max(w / QUADRO.w, (n.base - n.topo) / H0);
    const rostoPx = largura * QUADRO.w * cobre;
    const desejado = (fracao * w) / Math.max(1, rostoPx);
    return Math.min(Math.max(1, AMPLIACAO_MAX / cobre), Math.max(1, desejado));
  };
  const alvoDe = (nivel: Alvo, anterior: Estado): Estado => {
    // fechado: as barras se encontram na costura, na largura toda (vindo da moldura, a janela se
    // achata numa linha que atravessa a tela; reabre dela, como as barras do vertical)
    if (nivel === 4) return { ...anterior, esq: 0, dir: QUADRO.w, ancoraX: rostoX, topo: COSTURA, base: COSTURA, empurra: 0 };
    const n = NIVEIS[nivel];
    if (nivel === 5 || nivel === 6 || nivel === 7) return { ...n, zoom: zoomNaMoldura(n, ROSTO_NA_MOLDURA[nivel]) };
    const ancora = n.ancora < 0 ? rostoY : n.ancora + (Math.min(n.ancora, 0.4) - n.ancora) * perto;
    return { ...n, zoom: 1 + (n.zoom - 1) * (1 - perto), ancora, ancoraX: n.ancoraX < 0 ? rostoX : n.ancoraX };
  };
  const inicios: Estado[] = [];
  const alvos: Estado[] = [];
  const avaliar = (t: number, k: number): Estado => {
    const c = chaves[k];
    const alvo = alvos[k];
    const p = interpolate(t, [c.de, c.de + c.dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: travelling });
    const empurrado = { ...alvo, zoom: alvo.zoom * (1 + Math.min(EMPURRA_MAX, alvo.empurra * Math.max(0, t - c.de))) };
    return misturar(inicios[k], empurrado, p);
  };
  chaves.forEach((c, k) => {
    const inicio = k === 0 ? alvoDe(c.nivel === 4 ? 1 : c.nivel, NIVEIS[1]) : avaliar(c.de, k - 1);
    inicios.push(k === 0 ? alvoDe(c.nivel, inicio) : inicio);
    alvos.push(alvoDe(c.nivel, inicios[k]));
  });
  return (t: number): Estado => {
    let k = 0;
    for (let i = 0; i < chaves.length; i++) if (chaves[i].de <= t) k = i;
    return avaliar(t, k);
  };
};

export const caixaDoEstado = (e: Estado): Caixa => ({
  x: e.esq,
  y: e.topo,
  w: Math.max(0, e.dir - e.esq),
  h: Math.max(0, e.base - e.topo),
  raio: 0,
  zoom: e.zoom,
  ancoraY: e.ancora,
  ancoraX: e.ancoraX,
});

// Onde uma altura do vídeo (fração da altura do vídeo de trabalho) cai na tela, com a mesma
// conta do VideoNaCaixa do motor.
export const naTela = (e: Estado, fracao: number, plano: Plano) => {
  const H0 = alturaDoVideo(plano);
  const w = Math.max(1, e.dir - e.esq);
  const h = Math.max(1, e.base - e.topo);
  const escala = Math.max(w / QUADRO.w, h / H0) * e.zoom;
  const av = H0 * escala;
  const fy = (plano.rosto.y * QUADRO.h) / H0;
  const topo = Math.min(0, Math.max(h - av, h * e.ancora - fy * av));
  return e.topo + topo + fracao * av;
};

// Altura do queixo na tela: o cortar.mjs do 16:9 põe a zona 60 px abaixo do queixo.
export const queixoNaTela = (e: Estado, plano: Plano) => {
  const H0 = alturaDoVideo(plano);
  const queixo = plano.zona ? plano.zona.topo - 60 : plano.rosto.y * QUADRO.h + 0.66 * larguraDoRosto(plano) * QUADRO.w;
  return naTela(e, queixo / H0, plano);
};

// Centro vertical da narração: no meio da barra de baixo (acima dos controles do player);
// com a tela aberta, sobre a base da imagem (o teto de 930 deixa uma linha acima de y 984).
export const centroDaNarracao = (e: Estado) => Math.min(930, Math.max(860, (e.base + LIMITE_APP) / 2));

// Onde a frase-chave fica: na barra de baixo, se ela tem altura para o texto; senão, sobre a
// imagem escurecida, entre o queixo e a borda da janela. Nunca atravessa a borda da janela.
export type LugarDaFrase = { topo: number; altura: number; naBarra: boolean };
export const lugarDaFrase = (plano: Plano, estadoEm: (t: number) => Estado, de: number, ate: number, alturaIdeal: number): LugarDaFrase => {
  // as barras já assentadas; o queixo medido no fim, com a câmera mais perto
  const e = estadoEm(Math.min(ate, de + 1.3));
  const queixo = queixoNaTela(estadoEm(ate), plano);
  const barra = { topo: e.base + 22, altura: LIMITE_APP - 6 - (e.base + 22) };
  const topoImagem = Math.max(QUADRO.h * 0.44, queixo + 40);
  const fimImagem = e.base >= 1040 ? LIMITE_APP - 6 : e.base - 30;
  const imagem = { topo: topoImagem, altura: fimImagem - topoImagem };
  if (barra.altura >= alturaIdeal * 0.82 || barra.altura >= imagem.altura) return { ...barra, naBarra: true };
  return { ...imagem, naBarra: false };
};

// Quanto a tela está "aberta" (1) ou com barras (0), para dosar o degradê da base. Só na janela da
// largura toda (na moldura não há narração sobre a imagem).
export const abertura = (e: Estado) =>
  interpolate(e.base, [900, 1060], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
  interpolate(e.esq, [0, 160], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Quando o cabeçalho de capítulo aparece: depois de uma cartela/letreiro que devolve a tela com a
// barra de cima grossa, e a cada vez que a CURVA aperta para o nível 2 ou 3 (os blocos escrevem no
// quadro, então não levam cabeçalho). Fica ~3 s e some.
export const gatilhosDoCabecalho = (plano: Plano) => {
  const curva = curvaDeIntensidade(plano);
  const chaves = chavesDaJanela(plano);
  const gatilhos = chaves.filter((c) => c.daCurva && c.de > 0 && (c.nivel === 2 || c.nivel === 3)).map((c) => c.de);
  for (const m of plano.momentos) {
    if ((m.tipo === "cartela" || m.tipo === "letreiro") && nivelDaCurva(curva, m.ate) >= 2 && nivelDaCurva(curva, m.ate) <= 3) {
      // só se nenhum bloco começa colado (ele manda nas barras)
      const colado = plano.momentos.some((o) => o !== m && Math.abs(o.de - m.ate) < 0.15 && alvoDoBloco(o) !== null);
      if (!colado) gatilhos.push(m.ate);
    }
  }
  // créditos não levam cabeçalho (o quadro é da assinatura)
  const creditos = plano.momentos.filter((m) => m.tipo === "creditos" || m.tipo === "cta");
  return [...new Set(gatilhos)].filter((g) => !creditos.some((c) => g >= c.de - 0.05)).sort((a, b) => a - b);
};
