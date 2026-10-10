// A gramática de layout do Cinema: a imagem da pessoa vive numa janela entre duas barras pretas.
// As barras abrem e fecham conforme a intensidade da fala (plano.intensidade); os blocos de barra
// (letreiro, abertura, número, destaque, definição, comparação, pergunta, créditos) apertam as
// barras e escrevem nelas; os blocos de cartela alta (tópicos, passos, gráfico) descem a janela
// para a base da tela e usam a barra de cima como cartela; as cartelas fecham a tela até o preto.
// Em todos os níveis a câmera aproxima devagar e sem parar.
import { interpolate } from "remotion";
import { travelling } from "./anim";
import type { Caixa, Rosto } from "./motor/caixa";
import type { Momento, Nivel, Plano } from "./plano";

// Onde as barras se encontram quando fecham (px no quadro 1080×1920): um pouco acima do meio,
// porque os ~320 px de baixo ficam sob a interface do aplicativo.
export const COSTURA = 860;
// Abaixo daqui fica a interface do app (legenda do post, botões): texto nunca passa desta linha.
export const LIMITE_APP = 1560;
// A faixa de cima que o app cobre (nome do perfil, câmera): nada de conteúdo aqui.
export const TOPO_DO_APP = 200;

// Os estados da janela: os níveis da curva (0 a 4) e o 5, a "cartela alta" — a janela desce para a
// base da tela (uma faixa de cinemascope) e a barra de cima vira uma cartela para listas e gráficos.
export type Alvo = Nivel | 5;

export type Estado = {
  // janela da imagem: de `topo` a `base` (px)
  topo: number;
  base: number;
  // aproximação da câmera (1 = o menor enquadramento que cobre a janela)
  zoom: number;
  // altura do rosto dentro da janela (0 = topo, 1 = base)
  ancora: number;
  // velocidade da aproximação lenta, em fração por segundo
  empurra: number;
};

// A janela sempre cobre a largura toda; o que muda é a altura (e, na cartela alta, o lugar).
const NIVEIS: Record<Exclude<Alvo, 4>, Estado> = {
  // aberto: tela cheia, rosto onde a gravação o pôs (âncora = rosto.y)
  0: { topo: 0, base: 1920, zoom: 1.0, ancora: -1, empurra: 0.004 },
  // respiro: barras finas (a de baixo guarda duas linhas de narração acima da interface do app)
  1: { topo: 230, base: 1360, zoom: 1.03, ancora: 0.38, empurra: 0.008 },
  // tensão: janela larga (~1,4:1), rosto e ombros
  2: { topo: 470, base: 1250, zoom: 1.12, ancora: 0.44, empurra: 0.014 },
  // clímax: cinemascope (~2:1), rosto em close
  3: { topo: 600, base: 1120, zoom: 1.24, ancora: 0.48, empurra: 0.022 },
  // cartela alta: faixa de cinemascope na base, cartela preta em cima (listas, passos, gráficos)
  5: { topo: 990, base: 1560, zoom: 1.0, ancora: 0.5, empurra: 0.012 },
};
// a aproximação lenta nunca passa disto (fração sobre o zoom do nível)
const EMPURRA_MAX = 0.12;

// Onde fica o conteúdo da cartela alta (px): da faixa do app até um pouco acima da janela.
export const CARTELA_ALTA = { topo: TOPO_DO_APP + 30, base: NIVEIS[5].topo - 44 };

// O estado que cada bloco impõe às barras enquanto dura (null = segue a curva de intensidade).
export const alvoDoBloco = (m: Momento): Alvo | null => {
  switch (m.tipo) {
    case "cartela":
      return 4;
    case "letreiro":
    case "abertura":
      return m.nivel ?? 3;
    case "creditos":
    case "cta":
      return m.nivel ?? 2;
    case "numero":
    case "comparacao":
    case "pergunta":
      return 3;
    case "destaque":
      return m.nivel === "chave" ? 2 : 3;
    case "definicao":
      return 2;
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
  return { topo: m(a.topo, b.topo), base: m(a.base, b.base), zoom: m(a.zoom, b.zoom), ancora: m(a.ancora, b.ancora), empurra: m(a.empurra, b.empurra) };
};

// Devolve uma função que dá o estado da janela em qualquer instante. Cada troca parte de onde a
// anterior estava naquele instante (nunca salta), e dentro de cada nível a câmera aproxima devagar.
export const linhaDaJanela = (plano: Plano) => {
  const chaves = chavesDaJanela(plano);
  const rostoY = Math.min(0.42, Math.max(0.28, plano.rosto.y));
  // Gravação muito perto da câmera (o rosto ocupa mais da metade da largura): as janelas não
  // aproximam mais (o rosto já está em close) e o rosto sobe um pouco na janela, para caberem os
  // olhos e a boca. Com o rosto em tamanho normal (ou sem rastro), nada muda.
  const larguraDoRosto = (plano.rosto as Rosto).rastro?.largura ?? 0.36;
  const perto = Math.min(1, Math.max(0, (larguraDoRosto - 0.44) / 0.18));
  const alvoDe = (nivel: Alvo, anterior: Estado): Estado => {
    if (nivel === 4) return { ...anterior, topo: COSTURA, base: COSTURA, empurra: 0 };
    const n = NIVEIS[nivel];
    const ancora = n.ancora < 0 ? rostoY : n.ancora + (Math.min(n.ancora, 0.4) - n.ancora) * perto;
    return { ...n, zoom: 1 + (n.zoom - 1) * (1 - perto), ancora };
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
  x: 0,
  y: e.topo,
  w: 1080,
  h: Math.max(0, e.base - e.topo),
  raio: 0,
  zoom: e.zoom,
  ancoraY: e.ancora,
});

// Onde uma altura do vídeo (fração da altura do vídeo de trabalho) cai na tela, com a mesma
// conta do VideoNaCaixa do motor.
export const naTela = (e: Estado, fracao: number, plano: Plano) => {
  const H0 = Math.min(1920, plano.videoAltura ?? 1920);
  const h = Math.max(1, e.base - e.topo);
  const escala = Math.max(1, h / H0) * e.zoom;
  const av = H0 * escala;
  const fy = (plano.rosto.y * 1920) / H0;
  const topo = Math.min(0, Math.max(h - av, h * e.ancora - fy * av));
  return e.topo + topo + fracao * av;
};

// Altura do queixo na tela: o cortar.mjs põe a zona 170 px abaixo do queixo.
export const queixoNaTela = (e: Estado, plano: Plano) => {
  const H0 = Math.min(1920, plano.videoAltura ?? 1920);
  const queixo = plano.zona ? plano.zona.topo - 170 : plano.rosto.y * 1920 + 210;
  return naTela(e, queixo / H0, plano);
};

// Centro vertical da narração: no meio da barra de baixo (acima da interface do app);
// com a tela aberta, sobre a base da imagem.
// (o teto de 1466 deixa duas linhas de 66 px acima do limite do app)
export const centroDaNarracao = (e: Estado) => Math.min(1466, Math.max(1160, (e.base + LIMITE_APP) / 2));

// Onde a frase-chave fica: na barra de baixo, se ela tem altura para o texto; senão, sobre a
// imagem escurecida, entre o queixo e a borda da janela. Nunca atravessa a borda da janela.
export type LugarDaFrase = { topo: number; altura: number; naBarra: boolean };
export const lugarDaFrase = (plano: Plano, estadoEm: (t: number) => Estado, de: number, ate: number, alturaIdeal: number): LugarDaFrase => {
  // as barras já assentadas; o queixo medido no fim, com a câmera mais perto
  const e = estadoEm(Math.min(ate, de + 1.3));
  const queixo = queixoNaTela(estadoEm(ate), plano);
  const barra = { topo: e.base + 44, altura: LIMITE_APP - (e.base + 44) };
  const topoImagem = Math.max(900, queixo + 56);
  const fimImagem = e.base >= 1880 ? LIMITE_APP : e.base - 40;
  const imagem = { topo: topoImagem, altura: fimImagem - topoImagem };
  if (barra.altura >= alturaIdeal * 0.82 || barra.altura >= imagem.altura) return { ...barra, naBarra: true };
  return { ...imagem, naBarra: false };
};

// Quanto a tela está "aberta" (1) ou com barras (0), para dosar o degradê da base.
export const abertura = (e: Estado) =>
  interpolate(e.base, [1380, 1880], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// As duas barras de um bloco já assentado (onde o texto dele mora), em px, sem a faixa do app.
export type Faixas = { cima: { topo: number; base: number }; baixo: { topo: number; base: number } };
export const faixasDoEstado = (e: Estado): Faixas => ({
  cima: { topo: TOPO_DO_APP + 18, base: e.topo - 22 },
  baixo: { topo: e.base + 26, base: LIMITE_APP - 14 },
});

// Quando o cabeçalho de capítulo aparece: depois de uma cartela/letreiro que devolve a tela com a
// barra de cima grossa, e a cada vez que a CURVA aperta para o nível 2 ou 3 (os blocos de barra
// escrevem na barra de cima, então não levam cabeçalho). Fica ~3 s e some.
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
  // créditos não levam cabeçalho (a barra de cima é da assinatura)
  const creditos = plano.momentos.filter((m) => m.tipo === "creditos" || m.tipo === "cta");
  return [...new Set(gatilhos)].filter((g) => !creditos.some((c) => g >= c.de - 0.05)).sort((a, b) => a - b);
};
