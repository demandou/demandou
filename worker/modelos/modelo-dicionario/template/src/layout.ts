// Gramática de layout do modelo Dicionário: o vídeo vira um dicionário bem impresso, sobre qualquer assunto.
// A abertura, o fechamento, as perguntas, os destaques e as frases são frontispícios (a pessoa em cima, em tela
// cheia, e uma folha cobrindo a parte de baixo). Os outros blocos são PÁGINAS: a pessoa num quadro grande no
// alto da página (a assinatura também pode ocupar uma coluna larga), mudando de lado a cada página.
// Entre uma página e outra, a página VIRA — para a frente ou para trás, conforme a ordem alfabética das
// palavras-guia (como num dicionário de verdade).
import { prog, quebrarPalavra, silabasDe } from "./anim";
import type { Caixa, EstadoDaCaixa, Rosto } from "./motor/caixa";
import type { Layout, Momento, Plano, Vizinho } from "./plano";
import { BASE, BASE_COM_LEGENDA, LARGURA_UTIL, MARGEM, TOPO, zona as zonaPadrao } from "./tema";

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

// Medidas da página (px no quadro 1080×1920). A pessoa é grande; a coluna de vizinhos é estreita (é textura).
// quadro: a pessoa num quadro no alto da página, ao lado de uma coluna estreita de vizinhos
export const QUADRO = { w: 560, h: 700 };
// coluna: a pessoa ocupa uma coluna larga da página inteira; o verbete fica na coluna estreita
export const COLUNA_PESSOA = 520;
const VAO = 36;
export const LARGURA_ESTREITA = LARGURA_UTIL - VAO - COLUNA_PESSOA; // 392
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
    const layout = pedido ?? escolherLayout(m, k, folhas[folhas.length - 1]?.layout ?? null);
    k = ROTACAO.indexOf(layout) + 1;
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

// Topo da página do frontispício: logo abaixo do queixo, sem passar do meio do peito
export const topoDoFrontispicio = (plano: Plano) => Math.min(1120, Math.max(940, plano.zona?.topo ?? zonaPadrao.topo));

// Onde vai o conteúdo de um bloco no frontispício (coordenadas dentro da folha, que começa em `topo`):
// abaixo do letreiro, até a base (ou até a legenda, quando ela continua aparecendo)
export const TOPO_NA_FOLHA = 112;
export const areaDoFrontispicio = (topo: number, comLegenda = false): Regiao => ({
  x: MARGEM,
  y: TOPO_NA_FOLHA,
  w: LARGURA_UTIL,
  h: base(comLegenda) - topo - TOPO_NA_FOLHA,
});

// Onde a pessoa fica: um layout de página, "topo" (frontispício: a parte de cima do quadro, com o rosto
// exatamente onde está na tela cheia) ou "cheio" (tela cheia, nos respiros entre momentos)
export type LugarDaPessoa = Layout | "topo" | "cheio";

// Caixa da pessoa (sem a moldura) em cada lugar
export const caixaDoLayout = (layout: LugarDaPessoa, plano: Plano, comLegenda = false): Caixa => {
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const b = base(comLegenda);
  if (layout === "cheio") {
    return { x: 0, y: 0, w: 1080, h: 1920, raio: 0, zoom: 1, ancoraY: Math.min(0.5, (plano.rosto.y * 1920) / videoAltura) };
  }
  if (layout === "topo") {
    const h = topoDoFrontispicio(plano);
    return { x: 0, y: 0, w: 1080, h, raio: 0, zoom: 1, ancoraY: Math.min(0.9, (plano.rosto.y * 1920) / h) };
  }
  const ajuste = plano.caixas?.[layout] ?? {};
  // gravação perto da câmera (rosto largo, medido pelo rastreio): menos zoom, para a cabeça caber no quadro
  const largura = (plano.rosto as Rosto).rastro?.largura;
  const zoomQuadro = largura ? Math.min(1.55, Math.max(1, 0.47 / largura)) : 1.55;
  const zoomColuna = largura ? Math.min(1.2, Math.max(1, 0.36 / largura)) : 1.2;
  switch (layout) {
    case "quadro-direita":
    case "quadro-esquerda":
      return {
        x: layout === "quadro-direita" ? MARGEM + LARGURA_UTIL - QUADRO.w : MARGEM,
        y: TOPO,
        w: QUADRO.w,
        h: QUADRO.h,
        raio: 0,
        zoom: ajuste.zoom ?? zoomQuadro,
        ancoraY: ajuste.ancoraY ?? 0.42,
      };
    case "coluna-esquerda":
    case "coluna-direita":
      return {
        x: layout === "coluna-direita" ? MARGEM + LARGURA_UTIL - COLUNA_PESSOA : MARGEM,
        y: TOPO,
        w: COLUNA_PESSOA,
        h: b - TOPO,
        raio: 0,
        zoom: ajuste.zoom ?? zoomColuna,
        ancoraY: ajuste.ancoraY ?? 0.3,
      };
  }
};

// Onde vai o conteúdo do momento (o verbete) e onde vão os vizinhos de fundo
export type Areas = { conteudo: Regiao; vizinhos: Regiao | null; largo: boolean };

export const areasDoLayout = (layout: Layout, comLegenda = false): Areas => {
  const b = base(comLegenda);
  const estreita = LARGURA_UTIL - VAO - QUADRO.w;
  switch (layout) {
    case "quadro-direita":
    case "quadro-esquerda": {
      const y = TOPO + QUADRO.h + 34;
      return {
        conteudo: { x: MARGEM, y, w: LARGURA_UTIL, h: b - y },
        vizinhos: { x: layout === "quadro-direita" ? MARGEM : MARGEM + QUADRO.w + VAO, y: TOPO, w: estreita, h: QUADRO.h },
        largo: true,
      };
    }
    case "coluna-esquerda":
    case "coluna-direita":
      return {
        conteudo: { x: layout === "coluna-esquerda" ? MARGEM + COLUNA_PESSOA + VAO : MARGEM, y: TOPO, w: LARGURA_ESTREITA, h: b - TOPO },
        vizinhos: null,
        largo: false,
      };
  }
};

// O fio entre as colunas: no vão entre a pessoa e a coluna estreita
export const fioDoLayout = (layout: Layout, comLegenda = false) => {
  switch (layout) {
    case "quadro-direita":
      return { x: MARGEM + LARGURA_UTIL - QUADRO.w - VAO / 2, de: TOPO, ate: TOPO + QUADRO.h };
    case "quadro-esquerda":
      return { x: MARGEM + QUADRO.w + VAO / 2, de: TOPO, ate: TOPO + QUADRO.h };
    case "coluna-esquerda":
      return { x: MARGEM + COLUNA_PESSOA + VAO / 2, de: TOPO, ate: base(comLegenda) };
    case "coluna-direita":
      return { x: MARGEM + LARGURA_ESTREITA + VAO / 2, de: TOPO, ate: base(comLegenda) };
  }
};

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
