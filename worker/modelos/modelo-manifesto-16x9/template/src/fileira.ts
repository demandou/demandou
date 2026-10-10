// A FILEIRA: a diagramação do pôster no quadro deitado (16:9, 1920×1080).
//
// No vertical, o pôster é uma pilha centralizada montada em volta do rosto: o que vem antes da
// palavra-janela fica acima dela, o que vem depois fica abaixo. No quadro deitado não cabe uma
// pilha alta. A regra da aula 9 do curso (editar uma aula horizontal) decide a composição: a
// pessoa numa MOLDURA do lado direito, com o rosto centralizado nela, e o QUADRO com a explicação
// do lado esquerdo. No Manifesto a moldura é a palavra-janela (a pessoa dentro das letras) e o
// quadro é o campo do pôster com o texto, que continua centralizado e na ordem da fala:
//
//   [ texto de antes / (lugar da janela) / texto de depois  |  JANELA com o rosto ]
//
// Sem janela, o pôster é uma coluna só, no meio. A comparação divide o quadro na altura do rosto
// (lado 1 em cima, lado 2 embaixo) com o VS na emenda, dentro da moldura.
// O vídeo desliza (e aproxima o mínimo para não sobrar borda) até o rosto cair no meio da primeira
// linha da janela. Entre as palavras-janela candidatas e os tamanhos, vale a de menor custo:
// aproximar demais, janela pequena para o rosto, texto encolhido e espaço vazio.
import type { Plano } from "./plano";
import {
  ACENTO,
  APERTO,
  BASE_UTIL,
  caber,
  CEDILHA,
  encaixar,
  ESCALA_DEITADA,
  LARGURA_JANELA,
  LARGURA_TEXTO,
  LARGURA_UTIL,
  larguraEm,
  larguraMono,
  MAIUSCULA,
  MARGEM,
  QUADRO,
  quebrarMono,
  temAcento,
  temCedilha,
  TOPO_UTIL,
  VAO_COLUNA,
  VAO_PALAVRA,
} from "./tema";

// --- medidas comuns (as mesmas do vertical) ---

// espaço entre duas linhas de texto (o acento da de baixo precisa de lugar)
export const vaoEntre = (de: { texto: string; tamanho: number } | null, para: { texto: string; tamanho: number }) =>
  de ? Math.max(12, (temAcento(para.texto) ? ACENTO + 0.04 : 0.12) * para.tamanho + (temCedilha(de.texto) ? 0.12 * de.tamanho : 0)) : 0;

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
// No 16:9 o vídeo de trabalho tem o tamanho do quadro (1920×1080): zoom 1 = como foi gravado.
export const zoomQueCobre = (plano: Plano, alvoX: number, alvoY: number) => {
  const H0 = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
  const fx = plano.rosto.x;
  const fy = (plano.rosto.y * QUADRO.h) / H0;
  const base = Math.max(1, QUADRO.h / H0);
  const s = Math.max(
    alvoX / (fx * QUADRO.w),
    (QUADRO.w - alvoX) / ((1 - fx) * QUADRO.w),
    alvoY / (fy * H0),
    (QUADRO.h - alvoY) / ((1 - fy) * H0),
  );
  return Math.max(1, (s * 1.002) / base);
};

// --- a moldura do vídeo no pôster (10/10, revisão do Bruno do protótipo deitado) ---
// "O rosto maior que as letras da janela": no 16:9 o rosto gravado tem ~250 px de largura, e para
// cobrir o quadro inteiro com ele levado até a moldura da direita o vídeo precisava aproximar (até
// 1,4x). As letras da janela, presas na altura útil do quadro deitado, ficavam menores que o rosto
// (o "CA/RO" da prova: a cabeça passava da primeira linha). Agora, num pôster com janela, o vídeo
// só precisa cobrir a MOLDURA (a caixa das letras): fora dela o campo do pôster cobre tudo. A escala
// sai do tamanho das letras (o rosto ocupa até ~80% da altura da maiúscula da primeira linha) e
// nunca fica abaixo do que cobre a moldura. Fora do pôster, o vídeo volta ao quadro cheio.
export type Retangulo = { x: number; y: number; w: number; h: number };
export const QUADRO_INTEIRO: Retangulo = { x: 0, y: 0, w: QUADRO.w, h: QUADRO.h };

// A escala do vídeo (1 = na largura do quadro) que cobre o retângulo `r` com o rosto em `alvo`.
export const escalaQueCobre = (plano: Plano, alvo: { x: number; y: number }, r: Retangulo) => {
  const H0 = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
  const fx = plano.rosto.x;
  const fy = (plano.rosto.y * QUADRO.h) / H0;
  const s = Math.max(
    (alvo.x - r.x) / (fx * QUADRO.w),
    (r.x + r.w - alvo.x) / ((1 - fx) * QUADRO.w),
    ((alvo.y - r.y) * (QUADRO.h / H0)) / (fy * QUADRO.h),
    ((r.y + r.h - alvo.y) * (QUADRO.h / H0)) / ((1 - fy) * QUADRO.h),
  );
  return s * 1.002;
};

// quanto o rosto ocupa da altura da maiúscula (ou do círculo) da janela: o alvo e o teto
export const ROSTO_NA_LETRA = 0.8;
const ROSTO_NA_LETRA_MAX = 0.95;
// folga da moldura em volta das letras (px)
const FOLGA_DA_MOLDURA = 24;
// a altura do rosto (testa ao queixo) é ~1,35 vez a largura medida pelo rastro
const ALTURA_DO_ROSTO = 1.35;

// --- as unidades de uma coluna ---
export type Alinhar = "esquerda" | "direita" | "centro";
// a caixa de uma linha na tela: onde a coluna começa, a largura e para que lado o texto encosta
export type Caixa = { x: number; largura: number; alinhar: Alinhar };

export type Papel = "titulo" | "grande" | "corpo" | "item" | "lado" | "rotulo" | "detalhe" | "risco" | "opcao" | "igual";
// os papéis do vertical, já na escala do quadro deitado
export const PAPEIS: Record<Papel, { max: number; min: number; linhas: number; peso: 700 | 900 }> = {
  titulo: { max: 88, min: 50, linhas: 3, peso: 900 },
  grande: { max: 128, min: 60, linhas: 3, peso: 900 },
  corpo: { max: 84, min: 48, linhas: 3, peso: 900 },
  item: { max: 74, min: 46, linhas: 2, peso: 900 },
  lado: { max: 88, min: 50, linhas: 3, peso: 900 },
  rotulo: { max: 46, min: 38, linhas: 2, peso: 700 },
  detalhe: { max: 40, min: 36, linhas: 2, peso: 700 },
  risco: { max: 108, min: 50, linhas: 2, peso: 900 },
  opcao: { max: 68, min: 46, linhas: 2, peso: 900 },
  igual: { max: 100, min: 60, linhas: 1, peso: 900 },
};
export type Tinta = "texto" | "acento" | "letreiro";
export type IconeB = "comentar" | "salvar" | "seguir" | "enviar" | "link";

export type UTexto = {
  tipo: "texto";
  palavras: string[];
  tempos: number[];
  papel: Papel;
  tinta?: Tinta;
  lado?: 0 | 1;
  risco?: number;
  apagaEm?: number;
  icone?: IconeB;
};
export type UMono = { tipo: "mono"; texto: string; em: number; lado?: 0 | 1; tinta?: Tinta };
export type UJanela = { tipo: "janela"; linhas: string[]; em: number; batidas?: number[]; trocas?: { em: number; linhas: string[] }[]; lado?: 0 | 1 };
export type UCirculo = { tipo: "circulo"; em: number };
export type UGrafico = { tipo: "grafico"; ideal: number; minimo: number };
export type USeta = { tipo: "seta"; em: number };
// linha do cartaz: uma linha só, no tamanho que o plano pediu (encolhe se não couber)
export type ULinha = { tipo: "linha"; texto: string; em: number; tamanho: number; acento?: boolean; grupo: "topo" | "base"; indice: number };
// negação do cartaz: o começo pequeno e a palavra negada grande, riscada
export type UNegacao = { tipo: "negacao"; em: number; antes?: string; palavra: string; riscoEm: number; indice: number };
export type Unidade = UTexto | UMono | UJanela | UCirculo | UGrafico | USeta | ULinha | UNegacao;

export type Medida =
  | { tipo: "texto"; altura: number; largura: number; linhas: string[][]; tamanho: number; peso: 500 | 700 | 900 }
  | { tipo: "mono"; altura: number; largura: number; linhas: string[] }
  | { tipo: "linha"; altura: number; largura: number; tamanho: number; peso: 700 | 900 }
  | { tipo: "negacao"; altura: number; largura: number; tamAntes: number; tamPalavra: number }
  | { tipo: "seta"; altura: number; largura: number }
  | { tipo: "grafico"; altura: number; largura: number };

const MONO = 28;
const VAO = 30;
const VAO_ROTULO = 12;
const VAO_ITEM = 22;
const VAO_DOBRA = 44;
const SETA = 58;
const ANTES_NEGACAO = 54;
const PALAVRA_NEGACAO = 150;
const GAP_NEGACAO = 10;
const ENTRE_NEGACOES = 24;
// a janela: maiúscula a partir da qual o rosto lê bem; tamanho máximo; círculo
const JANELA_MAX = 760;
const CIRCULO_MAX = 300;
const CIRCULO_MIN = 150;

// largura de uma linha de palavras (o espaço entre palavras é a margem fixa de 0,3 em)
export const larguraDasPalavras = (ws: string[], peso: 500 | 700 | 900, tam: number) =>
  (ws.reduce((s, w) => s + larguraEm(w, peso, APERTO), 0) + Math.max(0, ws.length - 1) * VAO_PALAVRA) * tam;
// o maior corpo em que uma linha (sem quebrar) cabe em `largura`
const caberLinha = (texto: string, largura: number, maximo: number, peso: 700 | 900) => {
  const ws = texto.trim().split(/\s+/).filter(Boolean);
  return Math.min(maximo, Math.floor(largura / Math.max(0.3, larguraDasPalavras(ws, peso, 1))));
};

const medir = (u: Unidade, W: number, f: number): Medida => {
  switch (u.tipo) {
    case "texto": {
      const p = PAPEIS[u.papel];
      const max = Math.max(p.min, Math.round(p.max * f));
      let e = encaixar(u.palavras, W, max, p.min, p.linhas, p.peso);
      const comIcone = !!u.icone;
      if (comIcone) e = encaixar(u.palavras, W - 1.3 * e.tamanho, max, p.min, p.linhas, p.peso);
      const altura = e.linhas.reduce(
        (h, l, i) => h + (i > 0 ? vaoEntre({ texto: e.linhas[i - 1].join(" "), tamanho: e.tamanho }, { texto: l.join(" "), tamanho: e.tamanho }) : 0) + e.tamanho,
        0,
      );
      const largura = Math.max(...e.linhas.map((l, i) => larguraDasPalavras(l, e.peso, e.tamanho) + (comIcone && i === 0 ? 1.24 * e.tamanho : 0)), 0);
      return { tipo: "texto", altura, largura, linhas: e.linhas, tamanho: e.tamanho, peso: e.peso };
    }
    case "mono": {
      const linhas = quebrarMono(u.texto, W, MONO);
      return { tipo: "mono", linhas, altura: linhas.length * MONO + (linhas.length - 1) * 10, largura: Math.max(...linhas.map((l) => larguraMono(l, MONO)), 0) };
    }
    case "linha": {
      const pedido = Math.round(u.tamanho * ESCALA_DEITADA * f);
      const peso: 700 | 900 = pedido < 70 ? 700 : 900;
      const tam = Math.max(34, Math.min(pedido, caberLinha(u.texto, W, pedido, peso)));
      const pesoFinal: 700 | 900 = tam < 70 ? 700 : 900;
      return { tipo: "linha", altura: tam, largura: larguraDasPalavras(u.texto.trim().split(/\s+/), pesoFinal, tam), tamanho: tam, peso: pesoFinal };
    }
    case "negacao": {
      const tamAntes = u.antes ? Math.max(34, caberLinha(u.antes, W, Math.round(ANTES_NEGACAO * ESCALA_DEITADA * f), 700)) : 0;
      const tamPalavra = Math.max(40, caberLinha(u.palavra, W, Math.round(PALAVRA_NEGACAO * ESCALA_DEITADA * f), 900));
      const largura = Math.max(u.antes ? larguraDasPalavras(u.antes.split(/\s+/), 700, tamAntes) : 0, larguraDasPalavras(u.palavra.split(/\s+/), 900, tamPalavra));
      return { tipo: "negacao", altura: (u.antes ? tamAntes + GAP_NEGACAO : 0) + tamPalavra, largura, tamAntes, tamPalavra };
    }
    case "seta":
      return { tipo: "seta", altura: SETA, largura: 48 };
    case "grafico":
      return { tipo: "grafico", altura: Math.max(u.minimo, Math.min(u.ideal, u.ideal * f)), largura: W };
    default:
      return { tipo: "seta", altura: 0, largura: 0 };
  }
};

const vaoDepois = (a: Unidade, b: Unidade) => {
  if (a.tipo === "seta" || b.tipo === "seta") return 0;
  if (a.tipo === "negacao" && b.tipo === "negacao") return ENTRE_NEGACOES;
  if (a.tipo === "linha" && b.tipo === "linha") return Math.max(12, 0.1 * b.tamanho);
  if (a.tipo === "mono" && b.tipo === "texto") return VAO_ROTULO;
  if (a.tipo === "texto" && a.papel === "rotulo" && b.tipo === "texto") return VAO_ROTULO;
  if (a.tipo === "texto" && b.tipo === "texto" && a.papel === "item" && b.papel === "detalhe") return 8;
  if (a.tipo === "texto" && (a.papel === "item" || a.papel === "detalhe") && b.tipo === "texto" && b.papel === "item") return VAO_ITEM;
  if (a.tipo === "texto" && b.tipo === "mono") return VAO_ITEM;
  return VAO;
};

type Coluna = { us: Unidade[]; ms: Medida[]; altura: number; largura: number; f: number; ok: boolean; vaos: number[] };

// Mede uma coluna (as unidades empilhadas) na largura W e no fator f. `quebra`: índice onde o texto
// de depois da janela começa, numa coluna dobrada (ganha um vão maior, o lugar da janela).
const medirColuna = (us: Unidade[], W: number, f: number, avail: number, quebra: number): Coluna => {
  const ms = us.map((u) => medir(u, W, f));
  const vaos = us.map((u, i) => (i === 0 ? 0 : i === quebra ? VAO_DOBRA : vaoDepois(us[i - 1], u)));
  let altura = ms.reduce((s, m) => s + m.altura, 0) + vaos.reduce((s, v) => s + v, 0);
  // o gráfico cede altura até o mínimo dele
  const g = ms.findIndex((m) => m.tipo === "grafico");
  if (g >= 0 && altura > avail) {
    const u = us[g] as UGrafico;
    const cede = Math.min(ms[g].altura - u.minimo, altura - avail);
    ms[g] = { ...ms[g], altura: ms[g].altura - cede };
    altura -= cede;
  }
  const largura = Math.max(0, ...ms.map((m) => m.largura));
  return { us, ms, altura, largura, f, ok: altura <= avail + 0.5, vaos };
};

const FATORES = [1.3, 1.15, 1, 0.88, 0.76, 0.66, 0.56];
// O fator de uma coluna: o maior até 1 que cabe na altura; texto curto pode crescer (até 1,3) para
// o pôster não ficar com um vazio, sem passar de 3/4 da altura.
const ajustarColuna = (us: Unidade[], W: number, avail: number, quebra: number): Coluna => {
  let escolhida: Coluna | null = null;
  for (const f of FATORES) {
    const c = medirColuna(us, W, f, avail, quebra);
    if (!c.ok) continue;
    if (f > 1 && c.altura > avail * 0.75) continue;
    escolhida = c;
    break;
  }
  return escolhida ?? medirColuna(us, W, FATORES[FATORES.length - 1], avail, quebra);
};
const custoDoFator = (f: number, peso: number) => (f < 1 ? (1 - f) * peso : 0);

// --- a janela ---
export type JanelaPosta = {
  linhas: { texto: string; base: number }[];
  tamanho: number;
  // centro horizontal das letras
  cx: number;
  topo: number;
  altura: number;
  em: number;
  batidas: number[];
  // contador das listas: a partir de cada `em`, a janela mostra outras linhas ("01" → "02")
  trocas?: { em: number; linhas: string[] }[];
  // sem palavra curta: a pessoa aparece num círculo (o mesmo do mergulho de saída)
  circulo?: { cx: number; cy: number; r: number };
};

type JanelaMedida = { u: UJanela | UCirculo; tam: number; largura: number; altura: number; centro: number; capa: number };
const medirJanela = (u: UJanela | UCirculo, tam: number): JanelaMedida => {
  if (u.tipo === "circulo") return { u, tam, largura: 2 * tam, altura: 2 * tam, centro: tam, capa: tam * 1.1 };
  const med = medidasDaJanela(u.linhas);
  const todas = [u.linhas, ...(u.trocas ?? []).map((t) => t.linhas)];
  const largura = Math.max(...todas.flatMap((ls) => ls.map((l) => larguraEm(l, 900, APERTO) * tam)));
  return { u, tam, largura, altura: med.altura * tam, centro: (med.capas[0] + MAIUSCULA * 0.5) * tam, capa: tam * MAIUSCULA };
};
// os tamanhos a testar: do maior que cabe (na largura e na altura) para baixo
const tamanhosDaJanela = (u: UJanela | UCirculo, larguraMax: number, avail: number) => {
  if (u.tipo === "circulo") {
    const r = Math.min(CIRCULO_MAX, Math.floor(avail / 2), Math.floor(larguraMax / 2));
    return [r, r * 0.86, r * 0.74].map(Math.floor).filter((x) => x >= CIRCULO_MIN);
  }
  const med = medidasDaJanela(u.linhas);
  const todas = [u.linhas, ...(u.trocas ?? []).map((t) => t.linhas)];
  const pelaLargura = Math.min(...todas.flatMap((ls) => ls.map((l) => caber(l, larguraMax, JANELA_MAX, 900, APERTO))));
  const pelaAltura = Math.floor(avail / med.altura);
  const max = Math.min(pelaLargura, pelaAltura);
  return [1, 0.88, 0.76, 0.64].map((k) => Math.floor(max * k)).filter((t) => t * MAIUSCULA >= 110);
};

// --- o resultado ---
export type Posta = { u: Unidade; m: Medida; y: number; caixa: Caixa };
export type Fileira = {
  postas: Posta[];
  janela?: JanelaPosta;
  alvo: { x: number; y: number };
  escala: number;
  // comparação: y da emenda entre os dois campos (o de cima e o de baixo), na altura do rosto
  divisao?: number;
  // a caixa que o vídeo precisa cobrir no pôster (as letras da janela); sem ela, o quadro inteiro
  moldura?: Retangulo;
  // a maior escala em que o rosto ainda cabe na letra (o `zoom` do plano não passa dela)
  limiteDoRosto?: number;
  custo: number;
};

export type Opcao = { unidades: Unidade[]; preferencia: number };
export type Config = {
  limiteBaixo?: number;
  // quando a palavra-janela abre (não antes de o pôster terminar de entrar)
  de: number;
  entrada: number;
  // comparação: o quadro dividido na altura do rosto, um lado em cima e o outro embaixo
  dividida?: boolean;
};

// a largura média do rosto no quadro (fração), do rastro do cortar.mjs ou o padrão do 16:9
const larguraDoRosto = (plano: Plano) => {
  const r = (plano.rosto as { rastro?: { largura?: number } }).rastro;
  return r?.largura && r.largura > 0.03 ? r.largura : 0.13;
};

// A AULA 9 DO CURSO (edição horizontal): a pessoa numa moldura do lado DIREITO, com o rosto
// centralizado nela, e o quadro com a explicação do lado ESQUERDO. Aqui a moldura é a palavra-janela
// (a pessoa dentro das letras) e o quadro é o campo do pôster com o texto. O centro da moldura fica
// a ~72% da largura (o mesmo lugar do reframe do modelo Canal); janela larga encosta na margem.
export const X_DA_MOLDURA = 0.72;

const JanelaNoLugar = (jM: JanelaMedida) => Math.min(QUADRO.w - MARGEM - jM.largura / 2, X_DA_MOLDURA * QUADRO.w);

const postarJanela = (jM: JanelaMedida, cx: number, topo: number, cfg: Config): { janela: JanelaPosta; alvo: { x: number; y: number } } => {
  const u = jM.u;
  if (u.tipo === "circulo") {
    return {
      janela: { linhas: [], tamanho: 0, cx, topo, altura: jM.altura, em: Math.max(u.em, cfg.de + cfg.entrada * 0.6), batidas: [], circulo: { cx, cy: topo + jM.tam, r: jM.tam } },
      alvo: { x: cx, y: topo + jM.tam },
    };
  }
  const med = medidasDaJanela(u.linhas);
  return {
    janela: {
      linhas: u.linhas.map((texto, k) => ({ texto, base: topo + (med.capas[k] + MAIUSCULA) * jM.tam })),
      tamanho: jM.tam,
      cx,
      topo,
      altura: jM.altura,
      em: Math.max(u.em, cfg.de + cfg.entrada * 0.6),
      batidas: u.batidas ?? [],
      trocas: u.trocas,
    },
    alvo: { x: cx, y: topo + jM.centro },
  };
};

// empilha uma coluna a partir de y (topo) dentro da caixa
const empilhar = (c: Coluna, y0: number, caixa: Caixa): Posta[] => {
  let y = y0;
  return c.us.map((u, k) => {
    y += c.vaos[k];
    const p = { u, m: c.ms[k], y, caixa };
    y += c.ms[k].altura;
    return p;
  });
};

// a altura que o rosto pode ocupar na janela: a maiúscula da primeira linha, ou o círculo
const alturaParaORosto = (jM: JanelaMedida) => (jM.u.tipo === "circulo" ? jM.tam * 1.25 : jM.capa);
const escalaDoRosto = (plano: Plano, jM: JanelaMedida, fracao: number) =>
  (fracao * alturaParaORosto(jM)) / (larguraDoRosto(plano) * QUADRO.w * ALTURA_DO_ROSTO);

// O vídeo na janela: a escala em que o rosto cabe na letra, sem descobrir a moldura (as letras e
// a folga) nem passar da escala do quadro cheio. Quando o rosto já cabe com o quadro inteiro
// coberto, nada muda em relação a antes (sem moldura).
const videoNaJanela = (plano: Plano, jM: JanelaMedida, janela: JanelaPosta, alvo: { x: number; y: number }) => {
  const cheio = zoomQueCobre(plano, alvo.x, alvo.y);
  const x0 = Math.max(0, janela.cx - jM.largura / 2 - FOLGA_DA_MOLDURA);
  const y0 = Math.max(0, janela.topo - FOLGA_DA_MOLDURA);
  const x1 = Math.min(QUADRO.w, janela.cx + jM.largura / 2 + FOLGA_DA_MOLDURA);
  const y1 = Math.min(QUADRO.h, janela.topo + jM.altura + FOLGA_DA_MOLDURA);
  const moldura: Retangulo = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  const minimo = escalaQueCobre(plano, alvo, moldura);
  const escala = Math.max(minimo, Math.min(cheio, escalaDoRosto(plano, jM, ROSTO_NA_LETRA)));
  return {
    escala,
    moldura: escala < cheio - 0.005 ? moldura : undefined,
    limiteDoRosto: Math.max(escala, Math.min(cheio, escalaDoRosto(plano, jM, ROSTO_NA_LETRA_MAX))),
  };
};

// custo comum: aproximar demais, janela pequena para o rosto, texto encolhido, espaço vazio
const custoBase = (plano: Plano, escala: number, jM: JanelaMedida | null, colunas: Coluna[], largura: number, altura: number, avail: number) => {
  const zoom = Math.max(0, escala - 1.05) * 2.5;
  // o rosto (na escala do pôster) contra a altura da maiúscula da janela: rosto maior que a letra
  // vira um pedaço de rosto nas letras (10/10: medido pela altura do rosto, não pela largura)
  const rostoPx = larguraDoRosto(plano) * QUADRO.w * escala * ALTURA_DO_ROSTO;
  const pequena = jM ? Math.max(0, rostoPx - 0.9 * alturaParaORosto(jM)) / 60 + Math.max(0, 300 - jM.capa) / 80 : 0;
  const texto = colunas.reduce((s, c) => s + custoDoFator(c.f, 3), 0);
  const vazio = Math.max(0, 1 - largura / LARGURA_UTIL - 0.3) * 3 + Math.max(0, 1 - altura / avail - 0.35) * 3;
  const estouro = colunas.some((c) => !c.ok) ? 50 : 0;
  return zoom + pequena + texto + vazio + estouro;
};

// Pôster com janela: o quadro (texto) à esquerda, a moldura (janela) à direita.
const comporComJanela = (plano: Plano, o: Opcao, jM: JanelaMedida, cfg: Config): Fileira | null => {
  const limiteBaixo = cfg.limiteBaixo ?? BASE_UTIL;
  const avail = limiteBaixo - TOPO_UTIL;
  const iJ = o.unidades.findIndex((u) => u.tipo === "janela" || u.tipo === "circulo");
  const antes = o.unidades.slice(0, iJ);
  const depois = o.unidades.slice(iJ + 1);
  const rostoY = plano.rosto.y * QUADRO.h;
  const cx = JanelaNoLugar(jM);
  const larguraQuadro = cx - jM.largura / 2 - VAO_COLUNA - MARGEM;
  if (larguraQuadro < 520) return null;
  const caixa: Caixa = { x: MARGEM, largura: Math.min(LARGURA_TEXTO, larguraQuadro), alinhar: "centro" };
  // o quadro ocupa o espaço inteiro à esquerda da moldura (centrado nele)
  caixa.x = MARGEM + (larguraQuadro - caixa.largura) / 2;
  const todas = [...antes, ...depois];
  const coluna = todas.length ? ajustarColuna(todas, caixa.largura, avail, antes.length && depois.length ? antes.length : -1) : null;
  // A composição (janela e quadro) fica no meio da faixa. Na prova de 10/10 a janela ia para a
  // altura do rosto da gravação (y ~380) e o pôster ficava com a metade de baixo vazia (a revisão
  // do passo 8 apontou em 5 pôsteres). Puxar a janela para a altura do rosto só vale quando poupa
  // aproximação de verdade (pessoa já gravada do lado direito); o desvio do meio também custa.
  const meio = TOPO_UTIL + avail / 2;
  const topos = [...new Set([meio - jM.altura / 2, rostoY - jM.centro].map((y) => Math.round(Math.max(TOPO_UTIL, Math.min(limiteBaixo - jM.altura, y)))))];
  let melhor: Fileira | null = null;
  for (const topo of topos) {
    const { janela, alvo } = postarJanela(jM, cx, topo, cfg);
    // o texto do quadro fica centrado na altura da janela
    const centro = topo + jM.altura / 2;
    const postas = coluna ? empilhar(coluna, Math.round(Math.max(TOPO_UTIL, Math.min(limiteBaixo - coluna.altura, centro - coluna.altura / 2))), caixa) : [];
    const { escala, moldura, limiteDoRosto } = videoNaJanela(plano, jM, janela, alvo);
    const fora = (Math.abs(centro - meio) / avail) * 6;
    const custo =
      custoBase(plano, escala, jM, coluna ? [coluna] : [], (coluna?.largura ?? 0) + jM.largura + VAO_COLUNA, Math.max(jM.altura, coluna?.altura ?? 0), avail) + fora + o.preferencia;
    if (!melhor || custo < melhor.custo) melhor = { postas, janela, alvo, escala, moldura, limiteDoRosto, custo };
  }
  return melhor;
};

// Comparação: o quadro dividido na altura do rosto (lado 1 no campo de cima, lado 2 no de baixo,
// como no vertical) e a janela "VS" na emenda, na moldura da direita.
const comporDividida = (plano: Plano, o: Opcao, jM: JanelaMedida, cfg: Config): Fileira | null => {
  const limiteBaixo = cfg.limiteBaixo ?? BASE_UTIL;
  const iJ = o.unidades.findIndex((u) => u.tipo === "janela" || u.tipo === "circulo");
  const cima = o.unidades.slice(0, iJ);
  const baixo = o.unidades.slice(iJ + 1);
  const cx = JanelaNoLugar(jM);
  const larguraQuadro = cx - jM.largura / 2 - VAO_COLUNA - MARGEM;
  if (larguraQuadro < 520) return null;
  const caixa: Caixa = { x: MARGEM, largura: Math.min(LARGURA_TEXTO, larguraQuadro), alinhar: "centro" };
  caixa.x = MARGEM + (larguraQuadro - caixa.largura) / 2;
  // a emenda no meio da faixa (no quadro deitado não há altura sobrando acima do rosto): os dois
  // lados com o mesmo espaço, e o vídeo desliza até o rosto cair nela
  const VAO_EMENDA = 34;
  const emenda = Math.round((TOPO_UTIL + limiteBaixo) / 2);
  const colCima = ajustarColuna(cima, caixa.largura, emenda - VAO_EMENDA - TOPO_UTIL, -1);
  const colBaixo = ajustarColuna(baixo, caixa.largura, limiteBaixo - emenda - VAO_EMENDA, -1);
  const topo = Math.round(Math.max(TOPO_UTIL, Math.min(limiteBaixo - jM.altura, emenda - jM.centro)));
  const { janela, alvo } = postarJanela(jM, cx, topo, cfg);
  const postas = [...empilhar(colCima, emenda - VAO_EMENDA - colCima.altura, caixa), ...empilhar(colBaixo, emenda + VAO_EMENDA, caixa)];
  const { escala, moldura, limiteDoRosto } = videoNaJanela(plano, jM, janela, alvo);
  const avail = limiteBaixo - TOPO_UTIL;
  const custo = custoBase(plano, escala, jM, [colCima, colBaixo], Math.max(colCima.largura, colBaixo.largura) + jM.largura + VAO_COLUNA, colCima.altura + colBaixo.altura + 2 * VAO_EMENDA, avail) + o.preferencia;
  return { postas, janela, alvo, escala, moldura, limiteDoRosto, custo, divisao: alvo.y };
};

// Pôster sem janela (cartaz sem palavra-janela): o texto numa coluna só, no meio do quadro.
const comporSemJanela = (plano: Plano, unidades: Unidade[], cfg: Config): Fileira => {
  const limiteBaixo = cfg.limiteBaixo ?? BASE_UTIL;
  const avail = limiteBaixo - TOPO_UTIL;
  const caixa: Caixa = { x: (QUADRO.w - LARGURA_TEXTO) / 2, largura: LARGURA_TEXTO, alinhar: "centro" };
  const coluna = ajustarColuna(unidades, caixa.largura, avail, -1);
  const postas = empilhar(coluna, Math.round(TOPO_UTIL + Math.max(0, (avail - coluna.altura) / 2)), caixa);
  const alvo = { x: plano.rosto.x * QUADRO.w, y: plano.rosto.y * QUADRO.h };
  return { postas, alvo, escala: zoomQueCobre(plano, alvo.x, alvo.y), custo: coluna.ok ? 0 : 50 };
};

// A melhor fileira entre as opções (palavras-janela candidatas) e os tamanhos de janela.
export const montarFileira = (plano: Plano, opcoes: Opcao[], cfg: Config): Fileira => {
  const avail = (cfg.limiteBaixo ?? BASE_UTIL) - TOPO_UTIL;
  const achado: { r: Fileira | null } = { r: null };
  const guardar = (r: Fileira | null) => {
    if (r && (!achado.r || r.custo < achado.r.custo)) achado.r = r;
  };
  for (const o of opcoes) {
    const iJ = o.unidades.findIndex((u) => u.tipo === "janela" || u.tipo === "circulo");
    if (iJ < 0) {
      guardar(comporSemJanela(plano, o.unidades, cfg));
      continue;
    }
    const j = o.unidades[iJ] as UJanela | UCirculo;
    // a moldura nunca passa de ~44% da largura: o quadro do texto precisa de lugar. O "VS" da
    // comparação ia até 720 px e saía apertado em volta do rosto (revisão de 10/10): 860.
    const larguraMax = cfg.dividida ? 860 : Math.min(LARGURA_JANELA, 2 * (QUADRO.w - MARGEM - X_DA_MOLDURA * QUADRO.w) + 140);
    for (const tam of tamanhosDaJanela(j, larguraMax, avail)) {
      const jM = medirJanela(j, tam);
      guardar(cfg.dividida ? comporDividida(plano, o, jM, cfg) : comporComJanela(plano, o, jM, cfg));
    }
  }
  if (!achado.r) {
    // nada coube nem no menor tamanho: uma coluna só, centrada, sem janela (nunca vaza)
    const so = opcoes[0]?.unidades.filter((u) => u.tipo !== "janela" && u.tipo !== "circulo") ?? [];
    return comporSemJanela(plano, so, cfg);
  }
  return achado.r;
};
