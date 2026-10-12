// Gramática de layout do modelo Dicionário, na versão DEITADA (16:9, 1920×1080, o vídeo completo do YouTube).
// O vídeo vira um dicionário bem impresso, sobre qualquer assunto. A regra da aula 9 do curso (editar uma aula
// horizontal) decide a composição: a pessoa em tela cheia é a base; quando um bloco pede apoio visual, ela vai
// para uma MOLDURA do lado direito (rosto centralizado e acompanhado) e a página ocupa o QUADRO da esquerda.
//
//   PÁGINA:        [ coluna estreita (cabeça + abonação, ou vizinhos) | corpo do bloco | MOLDURA com a pessoa ]
//   FRONTISPÍCIO:  [ folha de papel (letreiro + bloco), da altura do quadro | a pessoa em tela cheia ao lado ]
//
// A abertura, o fechamento, as perguntas, os destaques e as frases são frontispícios: no vertical a folha cobria a
// parte de baixo (pilha alta); aqui ela é uma coluna à esquerda que sobe por baixo e, no fim, vira na lombada.
// Os outros blocos são PÁGINAS. A moldura fica sempre à direita (aula 9): o `layout` do plano (quadro ou coluna,
// direita ou esquerda) continua aceito, mas no quadro deitado todos dão a mesma página.
// Entre uma página e outra, a página VIRA, para a frente ou para trás, conforme a ordem alfabética das
// palavras-guia (como num dicionário de verdade).
import { prog, quebrarPalavra, silabasDe } from "./anim";
import type { Caixa, EstadoDaCaixa, Rosto } from "./motor/caixa";
import type { Layout, Momento, Plano, Vizinho } from "./plano";
import { CHEIO_16x9 } from "./motor/caixa";
import { BASE, BASE_COM_LEGENDA, FOLHA, H, LARGURA_FOLHA, LARGURA_UTIL, MARGEM, TOPO, W, zona as zonaPadrao } from "./tema";

export type Regiao = { x: number; y: number; w: number; h: number };

const ROTACAO: Layout[] = ["quadro-direita", "coluna-esquerda", "quadro-esquerda", "coluna-direita"];
const lado = (l: Layout) => (l.endsWith("direita") ? "d" : "e");

// Frontispício = a pessoa grande em cima e a folha cobrindo a parte de baixo.
// Abertura e fechamento são sempre frontispício; pergunta, destaque e frase (sem tradução) também,
// a não ser que o plano peça uma página; qualquer outro bloco vira frontispício com "layout": "frontispicio".
const FRONTISPICIO_PADRAO = new Set<Momento["tipo"]>(["abertura", "cta", "pergunta", "destaque"]);
export const ehFrontispicio = (m: Momento) => {
  if (m.tipo === "abertura" || m.tipo === "cta") return true;
  if (m.layout === "frontispicio") return true;
  if (m.layout) return false;
  if (m.tipo === "frase") return !m.traducao;
  return FRONTISPICIO_PADRAO.has(m.tipo);
};

// A assinatura (verbete e remissão) pode usar a coluna larga; os outros blocos usam o quadro no alto.
export const ehAssinatura = (m: Momento) => m.tipo === "verbete" || m.tipo === "remissao";

// Medidas da página (px no quadro 1920×1080). A pessoa é grande; a coluna de vizinhos é estreita (é textura).
// a moldura da pessoa: do lado direito, da altura da página (do topo do conteúdo até a base)
export const QUADRO = { w: 520, h: BASE - TOPO };
export const COLUNA_PESSOA = QUADRO.w;
// a coluna estreita da esquerda (cabeça do verbete e abonação, ou verbetes vizinhos)
export const LARGURA_ESTREITA = 310;
// vão da coluna estreita ao corpo (o fio passa no meio) e do corpo à moldura
const VAO = 40;
const VAO_PESSOA = 44;
// o corpo do bloco: entre a coluna estreita e a moldura, com a altura do corpo do vertical (centrado na página)
const X_PESSOA = MARGEM + LARGURA_UTIL - QUADRO.w; // 1300
const X_CORPO = MARGEM + LARGURA_ESTREITA + VAO; // 430
export const LARGURA_CORPO = X_PESSOA - VAO_PESSOA - X_CORPO; // 826
const ALTURA_CORPO = 620;
// a palavra-título precisa caber na coluna estreita neste corpo (senão o layout automático usa um quadro)
export const CORPO_MINIMO_TITULO = 120;

// Tempo de virar a página e de a pessoa mudar de lugar
export const VIRADA = 0.62;
export const TROCA = 0.6;

export type Folha = {
  m: Momento;
  de: number;
  ate: number;
  layout: Layout;
  // 1 = vira para a frente (a página de cima sai para a esquerda); -1 = volta (a nova chega por cima)
  direcao: 1 | -1;
  // a folha anterior está colada (sem respiro): a troca é uma virada de página
  colada: boolean;
  numero: number;
  // palavras-guia do cabeçalho (a frase de exemplo herda as da página anterior)
  guia: { primeira: string; ultima: string } | null;
};

// Palavras curtas que não servem de palavra-guia
const PARADAS = new Set(
  "a o os as um uma uns umas de do da dos das em no na nos nas num numa por pelo pela pelos pelas para pra pro com sem e ou que se ao aos à às é são foi ser mais muito".split(" "),
);
const limparPalavra = (w: string) => w.replace(/[^\p{L}\p{N}-]/gu, "");
// A palavra principal de um texto: a primeira que não é curta/função (em minúsculas, salvo sigla ou nome)
export const palavraPrincipal = (texto: string, ultima = false) => {
  const ws = texto.split(/\s+/).map(limparPalavra).filter(Boolean);
  const ordem = ultima ? [...ws].reverse() : ws;
  const w = ordem.find((x) => !PARADAS.has(x.toLowerCase()) && x.length > 1) ?? ordem[0] ?? "";
  const nome = /\p{Lu}/u.test(w.slice(1)) || (w === w.toUpperCase() && w.length > 1);
  return nome ? w : w.toLowerCase();
};

// As palavras-guia de uma página (a primeira e a última "entrada" dela), tiradas do próprio conteúdo
export const chavesDaPagina = (m: Momento): [string, string] => {
  switch (m.tipo) {
    case "verbete":
    case "remissao":
      return [m.palavra.texto, m.palavra.texto];
    case "definicao":
      return [m.termo, m.termo];
    case "topicos":
    case "passos":
      return [palavraPrincipal(m.itens[0]?.texto ?? ""), palavraPrincipal(m.itens[m.itens.length - 1]?.texto ?? "")];
    case "comparacao":
      return [palavraPrincipal(m.lados[0].rotulo), palavraPrincipal(m.lados[1].rotulo)];
    case "grafico":
      return m.dados?.length
        ? [palavraPrincipal(m.dados[0].rotulo), palavraPrincipal(m.dados[m.dados.length - 1].rotulo)]
        : [palavraPrincipal(m.titulo ?? ""), palavraPrincipal(m.titulo ?? "", true)];
    case "numero":
      return [palavraPrincipal(m.rotulo), palavraPrincipal(m.rotulo, true)];
    case "frase":
    case "destaque":
    case "pergunta":
      return [palavraPrincipal(m.texto), palavraPrincipal(m.texto, true)];
    default:
      return ["", ""];
  }
};

const palavraDe = (m: Momento) => chavesDaPagina(m)[0];

const colacao = new Intl.Collator("es", { sensitivity: "base" });

// Número de página plausível a partir das três primeiras letras (só enfeite do cabeçalho)
const numeroDaPagina = (palavra: string) => {
  const alfabeto = "abcdefghijklmnñopqrstuvwxyz";
  const w = palavra.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ñ/g, "ñ");
  let f = 0;
  for (let i = 0; i < 3; i++) {
    const k = Math.max(0, alfabeto.indexOf(w[i] ?? "a"));
    f += k / Math.pow(alfabeto.length, i + 1);
  }
  return 12 + Math.round(f * 980);
};

// A palavra cabe na coluna estreita em até duas linhas, no corpo mínimo? (só a assinatura usa a coluna,
// e só quando tem verbetes vizinhos de verdade para encher a coluna estreita)
// (no quadro deitado a coluna dá a mesma página que o quadro; a regra fica para o plano continuar valendo)
export const cabeNaColuna = (m: Momento) => {
  if (m.tipo !== "verbete" && m.tipo !== "remissao") return false;
  const temVizinhos = (m.vizinhos?.antes?.length ?? 0) + (m.vizinhos?.depois?.length ?? 0) >= 4;
  if (!temVizinhos) return false;
  return quebrarPalavra(silabasDe(m.palavra.texto, m.palavra.silabas), LARGURA_ESTREITA, 124, 2).corpo >= CORPO_MINIMO_TITULO;
};

// Layout automático: segue a rotação, troca a pessoa de lado a cada página e só usa coluna
// quando a palavra-título cabe grande na coluna estreita.
const escolherLayout = (m: Momento, k: number, anterior: Layout | null): Layout => {
  const ordem = ROTACAO.map((_, i) => ROTACAO[(k + i) % ROTACAO.length]);
  const serve = (l: Layout) => l.startsWith("quadro") || cabeNaColuna(m);
  return (
    ordem.find((l) => serve(l) && (!anterior || (lado(l) !== lado(anterior) && l !== anterior))) ??
    ordem.find((l) => serve(l) && l !== anterior) ??
    "quadro-direita"
  );
};

// As páginas do vídeo, na ordem, com layout (automático, alternando) e direção da virada.
export const folhasDo = (plano: Plano): Folha[] => {
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const folhas: Folha[] = [];
  let anterior: Folha | null = null;
  let k = 0;
  let ultimoAte = -1;
  for (const m of momentos) {
    if (ehFrontispicio(m)) {
      ultimoAte = -1;
      anterior = null;
      continue;
    }
    // pedido do plano; a coluna larga só serve à assinatura (os outros blocos usam o quadro do mesmo lado)
    let pedido = m.layout && m.layout !== "frontispicio" ? m.layout : null;
    if (pedido && pedido.startsWith("coluna") && !ehAssinatura(m)) pedido = pedido === "coluna-esquerda" ? "quadro-esquerda" : "quadro-direita";
    const escolhido = pedido ?? escolherLayout(m, k, folhas[folhas.length - 1]?.layout ?? null);
    k = ROTACAO.indexOf(escolhido) + 1;
    // no quadro deitado a moldura fica sempre à direita (aula 9): todo layout de página vira o mesmo
    const layout: Layout = "quadro-direita";
    const colada = anterior !== null && m.de - ultimoAte < 0.3;
    let direcao: 1 | -1 = 1;
    if (colada && anterior) {
      const a = palavraDe(anterior.m);
      const b = palavraDe(m);
      if (a && b && colacao.compare(b, a) < 0) direcao = -1;
    }
    const anteriorQualquer = folhas[folhas.length - 1];
    // o exemplo bilíngue herda as palavras-guia da página anterior (é a continuação do verbete)
    const herda = m.tipo === "frase" && !!m.traducao && !!anteriorQualquer;
    const guia = herda ? (anteriorQualquer?.guia ?? null) : palavrasGuia(m, "vizinhos" in m ? m.vizinhos : undefined);
    const numero = herda && anteriorQualquer ? anteriorQualquer.numero : numeroDaPagina(palavraDe(m) || "m");
    const folha: Folha = { m, de: m.de, ate: m.ate, layout, direcao, colada, numero, guia };
    folhas.push(folha);
    anterior = folha;
    ultimoAte = m.ate;
  }
  return folhas;
};

// ---------- regiões de cada layout ----------

const base = (comLegenda: boolean) => (comLegenda ? BASE_COM_LEGENDA : BASE);

// Topo do conteúdo dentro da folha do frontispício (px no quadro). A folha é uma coluna da altura do quadro; o
// conteúdo começa aqui para ficar no meio da altura (no vertical era o topo da folha, logo abaixo do queixo).
export const topoDoFrontispicio = (_plano: Plano) => zonaPadrao.topo;

// Onde vai o conteúdo de um bloco no frontispício (coordenadas a partir de `topo`, dentro da folha):
// abaixo do letreiro, até a base (ou até a legenda, quando ela continua aparecendo), no máximo a altura do
// corpo, para o bloco ficar no meio da folha e não esticado
export const TOPO_NA_FOLHA = 112;
export const areaDoFrontispicio = (topo: number, comLegenda = false): Regiao => ({
  x: MARGEM,
  y: TOPO_NA_FOLHA,
  w: LARGURA_FOLHA,
  h: Math.min(ALTURA_CORPO, base(comLegenda) - topo - TOPO_NA_FOLHA),
});

// A pessoa ao lado da folha do frontispício: o vídeo aproxima o mínimo e desliza até o rosto cair à direita
// da folha (sem nunca deixar borda vazia; se a gravação não deixa ir tão longe, o rosto para antes)
const ALVO_FRONTISPICIO = (FOLHA.w + W) / 2 / W; // ~0,77
const caixaDoFrontispicio = (plano: Plano): Caixa => {
  const rx = Math.min(0.95, Math.max(0.05, plano.rosto.x));
  // com zoom z e o vídeo encostado na borda da esquerda, o rosto fica em rx·z da largura
  const zoom = Math.min(1.42, Math.max(1, (ALVO_FRONTISPICIO - 0.07) / rx));
  return { x: 0, y: 0, w: W, h: H, raio: 0, zoom, ancoraX: ALVO_FRONTISPICIO, ancoraY: Math.min(0.55, Math.max(0.3, plano.rosto.y)) };
};

// Onde a pessoa fica: um layout de página (a moldura da direita), "topo" (frontispício: tela cheia, com o
// rosto à direita da folha) ou "cheio" (tela cheia, nos respiros entre momentos: a base da aula 9)
export type LugarDaPessoa = Layout | "topo" | "cheio";

// Caixa da pessoa (sem a moldura) em cada lugar
export const caixaDoLayout = (layout: LugarDaPessoa, plano: Plano, comLegenda = false): Caixa => {
  const b = base(comLegenda);
  if (layout === "cheio") return { ...CHEIO_16x9, ancoraY: Math.min(0.55, Math.max(0.3, plano.rosto.y)) };
  if (layout === "topo") return caixaDoFrontispicio(plano);
  const ajuste = plano.caixas?.[layout] ?? {};
  // a moldura: da altura da página, rosto centralizado na horizontal e no terço de cima.
  // Zoom pelo tamanho do rosto (medido pelo rastreio): o rosto ocupa ~42% da largura da moldura.
  const h = b - TOPO;
  const escala = Math.max(QUADRO.w / W, h / H);
  const largura = (plano.rosto as Rosto).rastro?.largura;
  const zoomQuadro = largura ? Math.min(1.6, Math.max(1, (0.42 * QUADRO.w) / (largura * W * escala))) : 1.3;
  return {
    x: X_PESSOA,
    y: TOPO,
    w: QUADRO.w,
    h,
    raio: 0,
    zoom: ajuste.zoom ?? zoomQuadro,
    ancoraY: ajuste.ancoraY ?? 0.36,
  };
};

// Onde vai o conteúdo do momento (o verbete) e onde vão os vizinhos de fundo
export type Areas = { conteudo: Regiao; vizinhos: Regiao | null; largo: boolean };

export const areasDoLayout = (_layout: Layout, comLegenda = false): Areas => {
  const b = base(comLegenda);
  const altura = b - TOPO;
  const h = Math.min(ALTURA_CORPO, altura);
  return {
    // o corpo: entre a coluna estreita e a moldura, centrado na altura da página
    conteudo: { x: X_CORPO, y: TOPO + Math.round((altura - h) / 2), w: LARGURA_CORPO, h },
    // a coluna estreita: da altura da página, encostada na margem da esquerda
    vizinhos: { x: MARGEM, y: TOPO, w: LARGURA_ESTREITA, h: altura },
    largo: true,
  };
};

// O fio entre as colunas: no vão entre a coluna estreita e o corpo
export const fioDoLayout = (_layout: Layout, comLegenda = false) => ({ x: MARGEM + LARGURA_ESTREITA + VAO / 2, de: TOPO, ate: base(comLegenda) });

// ---------- a pessoa ao longo do tempo ----------

export type EstadoPessoa = EstadoDaCaixa & { moldura: number };

export const estadosDaPessoa = (plano: Plano): EstadoPessoa[] => {
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const folhas = folhasDo(plano);
  type Trecho = { de: number; layout: LugarDaPessoa; legenda: boolean; semEncaixe?: boolean };
  const trechos: Trecho[] = [{ de: 0, layout: "cheio", legenda: false }];
  const empurrar = (de: number, layout: LugarDaPessoa, legenda: boolean, semEncaixe = false) => {
    const ultimo = trechos[trechos.length - 1];
    if (Math.abs(ultimo.de - de) < 0.02) {
      ultimo.layout = layout;
      ultimo.legenda = legenda;
    } else if (ultimo.layout !== layout || ultimo.legenda !== legenda) trechos.push({ de, layout, legenda, semEncaixe });
  };
  momentos.forEach((m, i) => {
    const folha = folhas.find((f) => f.m === m);
    const antes = momentos[i - 1];
    // depois do frontispício, a página dele vira primeiro e só então a pessoa encolhe para a página
    const esperaVirada = !!folha && !!antes && ehFrontispicio(antes) && m.de - antes.ate < 0.3;
    const lugar: LugarDaPessoa = folha ? folha.layout : ehFrontispicio(m) ? "topo" : "cheio";
    empurrar(Math.max(0, m.de + (esperaVirada ? VIRADA : 0)), lugar, !!m.legenda && !!folha, esperaVirada);
    const prox = momentos[i + 1];
    if (!prox || prox.de - m.ate > 0.3) empurrar(m.ate, "cheio", false);
  });

  // a troca começa no corte mais próximo (o movimento esconde o pulo do corte)
  const cortes = plano.cortesEm ?? [];
  for (const tr of trechos) {
    const perto = cortes.find((c) => c - tr.de > -0.16 && c - tr.de < 0.1);
    if (perto !== undefined && tr.de > 0 && !tr.semEncaixe) tr.de = perto;
  }

  const estados: EstadoPessoa[] = [];
  trechos.forEach((tr, i) => {
    const fim = trechos[i + 1]?.de ?? plano.duracao + 1;
    const caixa = caixaDoLayout(tr.layout, plano, tr.legenda);
    const moldura = tr.layout === "cheio" || tr.layout === "topo" ? 0 : 1;
    estados.push({ de: tr.de, caixa, dur: i === 0 ? 0.001 : TROCA, moldura });
    // cortes dentro do trecho: troca seca de zoom (6 %), disfarça o pulo do corte
    let ultimo = tr.de;
    for (const c of cortes) {
      if (c <= tr.de + 0.8 || c >= fim - 0.5 || c - ultimo < 1.2) continue;
      const atual = estados[estados.length - 1];
      const z = atual.caixa.zoom ?? 1;
      const inicial = caixa.zoom ?? 1;
      estados.push({ ...atual, de: c, caixa: { ...atual.caixa, zoom: Math.abs(z - inicial) < 0.01 ? inicial * 1.06 : inicial }, dur: 0.001 });
      ultimo = c;
    }
  });
  return estados;
};

// Espessura da moldura (0 em tela cheia, 1 num quadro/coluna) no instante t
export const molduraNoTempo = (t: number, estados: EstadoPessoa[]) => {
  let i = -1;
  for (let k = 0; k < estados.length; k++) if (estados[k].de <= t) i = k;
  if (i <= 0) return estados[0]?.moldura ?? 0;
  const a = estados[i - 1];
  const b = estados[i];
  const p = prog(t, b.de, b.dur ?? TROCA);
  return a.moldura + (b.moldura - a.moldura) * p;
};

// ---------- vizinhos de fundo ----------

// Palavras-guia do cabeçalho: o primeiro e o último verbete da página
export const palavrasGuia = (m: Momento, vizinhos?: { antes?: Vizinho[]; depois?: Vizinho[] }) => {
  const [a, b] = chavesDaPagina(m);
  const propriaA = ehAssinatura(m) || m.tipo === "definicao" ? (a.split(/\s+/)[0] ?? "") : a;
  const propriaB = ehAssinatura(m) || m.tipo === "definicao" ? (b.split(/\s+/)[0] ?? "") : b;
  const primeira = vizinhos?.antes?.[0]?.palavra ?? propriaA;
  const ultima = vizinhos?.depois?.[vizinhos.depois.length - 1]?.palavra ?? propriaB;
  return { primeira, ultima };
};
