import { loadFont as carregarAtkinson } from "@remotion/google-fonts/AtkinsonHyperlegibleNext";
import { LARGURAS } from "./metrica";

// Atkinson Hyperlegible Next: sans de interface feita para leitura (I, l e 1 nunca se confundem;
// "Iogurte", "IPTU" e "Inglês" leem certo). Uma família só, em vários pesos.
export const fonte = carregarAtkinson("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;

// Um app de mensagens noturno e sem marca: tinta azulada, ardósia, porcelana e UM acento tangerina.
// O acento é a cor de quem vende (os balões enviados) e do que dá certo; o que é ignorado esfria para cinza.
export const cor = {
  // fundo do app
  noite: "#0E1116",
  noiteFundo: "#0B0D11",
  // barras (cabeçalho, mensagem fixada, campo de texto)
  barra: "#161A21",
  linha: "#262B34",
  // balão do cliente (recebido)
  recebido: "#232934",
  // texto claro sobre o escuro
  porcelana: "#F2EEE7",
  porcelanaSuave: "rgba(242,238,231,0.62)",
  porcelanaApagada: "rgba(242,238,231,0.34)",
  // balão de quem vende (enviado) = o acento
  acento: "#FF7A33",
  acentoClaro: "#FFB088",
  // texto escuro sobre o acento e sobre os cartões claros
  tinta: "#15110E",
  tintaSuave: "rgba(21,17,14,0.62)",
  // balão ignorado ("esfriou") e o que é frio
  frio: "#353B46",
  frioTexto: "rgba(242,238,231,0.5)",
  // cartões do sistema (pagamento, produto)
  cartao: "#F2EEE7",
  cartaoFundo: "#E6E0D6",
};

// o outro lado da conversa quando o plano não diz (quem assiste)
export const CONTATO_PADRAO = "Você";

// Geometria do quadro (px, 1080×1920)
export const W = 1080;
export const H = 1920;
export const MARGEM = 56;
// abaixo das abas do app (TikTok/Reels) e acima da interface de baixo
export const TOPO_SEGURO = 176;
export const LIMITE_APP = 1560;

// A tela de conversa
export const CABECALHO = { topo: TOPO_SEGURO, altura: 150 };
export const FIXADA = { topo: CABECALHO.topo + CABECALHO.altura, altura: 112 };
export const CONVERSA_TOPO = FIXADA.topo + FIXADA.altura + 14;

// A pessoa como mensagem de vídeo redonda (gravando), centralizada embaixo da conversa e apoiada
// na base da tela do app. O diâmetro se adapta: grande quando a conversa do momento é curta,
// menor quando as mensagens precisam de espaço (entre MIN e MAX).
export const BOLHA = { base: 1544, min: 500, max: 680, zoom: 1.45, ancoraY: 0.44 };
// no contraste a bolha tem tamanho fixo, embaixo das duas faixas
export const BOLHA_CONTRASTE = { diametro: 520, zoom: 1.45, ancoraY: 0.44 };
// na comparação (duas faixas com balões de até duas linhas) ela é um pouco menor
export const BOLHA_COMPARACAO = { diametro: 470, zoom: 1.45, ancoraY: 0.44 };
// espaço entre a última mensagem e o anel da bolha
export const FOLGA_BOLHA = 40;
// a barra de gravação do app (tempo, "deslize para cancelar", enviar): abaixo da bolha
export const BARRA_GRAVACAO = { topo: 1572 };

// Quadro cheio: a pílula do topo, a zona dos balões no peito e o campo de texto (legenda)
export const PILULA = { topo: 188, altura: 100 };
export const zona = { topo: 957, altura: 440 };
export const CAMPO = { base: 1536, alturaLinha: 66 };

// Tamanhos (legíveis num celular, julgados pela altura das maiúsculas: a Atkinson tem maiúscula de
// 0,67 do corpo, então 70 px de corpo = 47 px de letra). Nada abaixo de 30 px.
export const T = {
  balao: 70,
  balaoCheio: 72,
  // cartão de produto no peito (é alto: um corpo um pouco menor para caber acima do campo de texto)
  cartaoCheio: 64,
  meta: 30,
  nome: 60,
  status: 46,
  fixada: 52,
  rotulo: 36,
  preco: 120,
  legenda: 54,
  pilula: 52,
  pilulaApoio: 40,
};

// ---------- medir texto sem o DOM ----------

const media = (peso: number) => {
  const tabela = LARGURAS[peso] ?? LARGURAS[500];
  const v = Object.values(tabela);
  return v.reduce((a, b) => a + b, 0) / v.length;
};

// largura de um texto (px) neste corpo e peso
export const larguraTexto = (texto: string, tamanho: number, peso = 500, espacamento = 0) => {
  const tabela = LARGURAS[peso] ?? LARGURAS[500];
  const m = media(peso);
  let soma = 0;
  for (const ch of texto) soma += tabela[ch] ?? m;
  return soma * tamanho + espacamento * tamanho * Math.max(0, [...texto].length - 1);
};

const LIGACOES = new Set(["e", "de", "da", "do", "das", "dos", "a", "o", "as", "os", "em", "no", "na", "que", "com", "para", "pra", "por", "um", "uma", "se", "ou"]);

// Quebra um texto em linhas que cabem em `largura` (px), palavra por palavra (como o navegador).
export const quebrarLinhas = (texto: string, largura: number, tamanho: number, peso = 500): string[] => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const tentativa = atual ? `${atual} ${p}` : p;
    if (!atual || larguraTexto(tentativa, tamanho, peso) <= largura) atual = tentativa;
    else {
      linhas.push(atual);
      atual = p;
    }
  }
  if (atual) linhas.push(atual);
  // nenhuma linha termina numa palavrinha de ligação ("e", "de", "o"…): ela desce para a linha de baixo
  for (let i = 0; i < linhas.length - 1; i++) {
    const ws = linhas[i].split(" ");
    const ultima = ws[ws.length - 1];
    if (ws.length < 2 || !LIGACOES.has(ultima.toLowerCase())) continue;
    const descida = `${ultima} ${linhas[i + 1]}`;
    if (larguraTexto(descida, tamanho, peso) <= largura) {
      linhas[i] = ws.slice(0, -1).join(" ");
      linhas[i + 1] = descida;
    }
  }
  return linhas.length ? linhas : [""];
};

// Quebra equilibrada: o menor número de linhas, com as linhas de tamanhos parecidos (títulos, pílulas)
export const quebrarEquilibrado = (texto: string, largura: number, tamanho: number, peso = 500, max = 3): string[] => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const base = quebrarLinhas(texto, largura, tamanho, peso);
  const n = Math.min(Math.max(base.length, 1), max);
  if (n <= 1 || palavras.length <= n) return base;
  // procura o menor limite em que o texto ainda cabe em n linhas
  let melhor = base;
  for (let limite = largura; limite > largura * 0.45; limite -= 10) {
    const l = quebrarLinhas(texto, limite, tamanho, peso);
    if (l.length > n) break;
    melhor = l;
  }
  return melhor;
};

// o maior corpo (até `maximo`) em que o texto cabe numa linha desta largura
export const caber = (texto: string, largura: number, maximo: number, minimo: number, peso = 600) => {
  for (let c = maximo; c > minimo; c -= 2) if (larguraTexto(texto, c, peso) <= largura) return c;
  return minimo;
};

// Encaixa um texto numa largura: o maior corpo (de `maximo` até `minimo`) em que ele cabe em até
// `maxLinhas` linhas, sem palavra maior que a linha. Se nem no mínimo couber, fica no mínimo e quebra
// em mais linhas (nunca vaza na largura). Mede com 3% de folga (o navegador arredonda e aplica kerning).
export const ajustarTexto = (texto: string, largura: number, maximo: number, minimo: number, peso = 500, maxLinhas = 3) => {
  const util = largura / 1.03;
  for (let c = maximo; c >= minimo; c -= 2) {
    const linhas = quebrarLinhas(texto, util, c, peso);
    if (linhas.length <= maxLinhas && linhas.every((l) => larguraTexto(l, c, peso) <= util)) return { corpo: c, linhas };
  }
  // palavra única maior que a linha: diminui até caber
  let c = minimo;
  const maior = Math.max(...texto.split(/\s+/).map((p) => larguraTexto(p, 1, peso)), 0.01);
  if (maior * c > util) c = Math.floor(util / maior);
  return { corpo: c, linhas: quebrarLinhas(texto, util, c, peso) };
};

// Número em pt-BR: 83.000 · 1,5 · 12,75
export const formatarNumero = (v: number, casas = 0) => {
  const fixo = Math.abs(v).toFixed(casas);
  const [inteiro, frac] = fixo.split(".");
  const milhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${v < 0 ? "−" : ""}${milhar}${frac ? `,${frac}` : ""}`;
};

// Sombra macia sob cartões e balões sobre o vídeo (não é brilho nem contorno)
export const sombra = "0 14px 40px rgba(5,7,10,0.34), 0 2px 6px rgba(5,7,10,0.18)";
export const sombraLeve = "0 6px 18px rgba(5,7,10,0.22)";
