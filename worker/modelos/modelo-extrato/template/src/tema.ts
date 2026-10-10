import { loadFont as carregarPlex } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as carregarMono } from "@remotion/google-fonts/SplineSansMono";

// Spline Sans Mono: a "fonte de cupom". Monoespaçada de desenho limpo, larga o bastante para ler no
// celular, com I serifado, l com cauda e 1 com bandeira ("Il1" nunca confunde). Todo caractere
// ocupa 0,6 do corpo, então o template mede o texto sem DOM e nada estoura a largura do papel.
const fonteMono = carregarMono("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"] });
export const mono = fonteMono.fontFamily;
// IBM Plex Sans: a sans legível da legenda e do carimbo (I com serifa, também passa no "Il1").
const fontePlex = carregarPlex("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] });
export const sans = fontePlex.fontFamily;
// as duas fontes carregadas: o carimbo é medido na fonte de verdade, e todo quadro do render usa a
// mesma medida (a Edicao segura o render até aqui)
export const esperarFontes = () => Promise.all([fonteMono.waitUntilDone(), fontePlex.waitUntilDone()]);

// avanço de cada caractere da mono, em frações do corpo
export const AVANCO = 0.6;

// Papel térmico sobre um balcão grafite, tinta de impressão térmica e UM acento: o magenta da
// tinta de carimbo (também o marca-texto e o sinal de vezes).
export const cor = {
  // fundo: o balcão onde o cupom está
  balcao: "#1C1D20",
  // o papel térmico (branco levemente quente) e a sombra da curvatura nas bordas
  papel: "#F7F4EE",
  papelBorda: "rgba(60,48,30,0.07)",
  // tinta térmica: quase preta, e o cinza das informações secundárias
  tinta: "#222120",
  cinza: "#7E7A72",
  // esboço "a lápis": o que ainda vai ser preenchido (casas vazias, campos em branco)
  lapis: "#BDB8AE",
  // o acento: tinta de carimbo magenta
  magenta: "#D81E6C",
  magentaVeu: "rgba(216,30,108,0.26)",
  // legenda
  legendaTexto: "#222120",
};

// Geometria do quadro (px, 1080×1920)
export const W = 1080;
export const H = 1920;
// topo seguro (abaixo das abas do app) e limite de baixo (acima da interface do app)
export const TOPO = 170;
export const LIMITE_APP = 1560;

// Tela dividida: o cupom (56% da largura) de um lado, a pessoa num cartão (40%) do outro,
// com respiros estreitos para os dois lerem grandes no celular
export const MARGEM = 16;
export const VAO = 16;
export const PAPEL = 605; // largura do cupom em escala 1
export const CARTAO = { w: W - 2 * MARGEM - VAO - PAPEL, y: 150, h: 1270, raio: 24 };
// altura (na tela) da última linha impressa do cupom na tela dividida: enquanto o cupom é curto, o
// papel fica preso em TOPO_DO_PAPEL e a impressão desce; quando chega aqui, o cupom passa a rolar
export const LINHA_DE_IMPRESSAO = 1400;
export const TOPO_DO_PAPEL = 120;

// Abertura (quadro cheio): um cupom curto no canto de baixo à esquerda, um pouco menor (86%), com
// só um pouco de papel abaixo da última linha (`rabo`, px); ele cresce para cima a cada linha
export const CUPOM_ABERTURA = { x: 30, linha: 1440, escala: 0.86, rabo: 44 };

// Layout "cima" (o padrão para vídeos de aluno): a pessoa numa moldura larga embaixo (cabeça
// inteira, folga para se mexer) e o rolo do cupom em cima, saindo de trás dela. O papel é maior
// (escala 1,25) e fica centrado; a última linha impressa fica logo acima da moldura.
export const MOLDURA = { x: 16, y: 960, w: W - 32, h: H - 960 - 16, raio: 24, ancoraY: 0.24 };
export const CIMA = { escala: 1.25, folga: 30, topo: 112, passo: 30 };

// A tira (quadro cheio): um pedaço curto de cupom na altura do peito, alternando de lado, como o
// cupom da abertura do exemplo (só `rabo` px de papel abaixo da última linha). A última linha
// impressa fica em `linha`; o papel nunca sobe acima do queixo (`zona.topo` + `respiro`): se não
// couber, ele diminui até `escalaMin`.
export const TIRA = { margem: 28, linha: 1470, escala: 1.15, escalaMin: 0.72, respiro: 18, rabo: 44 };

// Zona padrão (o cortar.mjs calcula a do vídeo: topo = logo abaixo do queixo + respiro)
export const zona = { topo: 996, altura: 465 };

// Estilos de texto do cupom
export const fonteCupom = (tamanho: number, peso = 500): React.CSSProperties => ({
  fontFamily: mono,
  fontSize: tamanho,
  fontWeight: peso,
  lineHeight: 1.12,
  color: cor.tinta,
  whiteSpace: "pre",
});

// largura de um texto na sans (px): medida de verdade no navegador do render, com a fonte já
// carregada; antes disso (ou fora do navegador), uma estimativa generosa da caixa-alta da Plex.
let contexto: CanvasRenderingContext2D | null | undefined;
export const larguraSans = (texto: string, tamanho: number, peso = 700, espacamento = 0) => {
  const estimativa = texto.length * tamanho * (0.7 + espacamento);
  if (typeof document === "undefined") return estimativa;
  if (contexto === undefined) contexto = document.createElement("canvas").getContext("2d");
  const fonte = `${peso} ${tamanho}px "${sans}"`;
  if (!contexto || !document.fonts?.check(fonte)) return estimativa;
  contexto.font = fonte;
  return contexto.measureText(texto).width + espacamento * tamanho * texto.length;
};

// largura de um texto na mono (px)
export const larguraMono = (texto: string, tamanho: number, espacamento = 0) => texto.length * tamanho * (AVANCO + espacamento);
