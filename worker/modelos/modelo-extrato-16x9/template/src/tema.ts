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

// --- Geometria do quadro deitado (16:9, 1920×1080) ---
// A versão deitada do Extrato, para o vídeo completo do YouTube. A diagramação segue a aula 9 do
// curso (editar uma aula horizontal): o apresentador em QUADRO CHEIO é a base (o vídeo 16:9 inteiro);
// quando a fala vira conta, a pessoa vai para uma MOLDURA do lado direito, com o rosto no centro
// dela e acompanhado de leve, e o rolo imprime no QUADRO do lado esquerdo. As tiras do quadro cheio
// sobem do pé do quadro AO LADO do rosto, nunca sobre ele. O papel é o mesmo do vertical (605 px em
// escala 1): só muda onde ele fica e o tamanho com que aparece.
export const W = 1920;
export const H = 1080;
// topo seguro e limite de baixo (abaixo desta linha ficam os controles do player)
export const TOPO = 64;
export const LIMITE_APP = 984;
// margem lateral segura do YouTube: o texto da legenda e o quadro do rolo ficam dentro dela
export const MARGEM = 96;
export const PAPEL = 605; // largura do cupom em escala 1

// Tela dividida (o rolo). A MOLDURA da pessoa à direita (~40% da largura, quase a altura toda), com
// o rosto no centro dela (`ancoraY` = altura do rosto; `zoom` aproxima um pouco para o rosto ler bem).
export const MOLDURA = { x: 1088, y: 72, w: 760, h: 912, raio: 24, zoom: 1.1, zoomMax: 1.5, ancoraY: 0.36 };
// o QUADRO do rolo, à esquerda: da margem até um vão antes da moldura
export const QUADRO = { x: MARGEM, w: MOLDURA.x - 48 - MARGEM };
// o rolo: escala do papel; `linha` = altura (na tela) da última linha impressa (abaixo dela o papel
// segue até o pé do quadro); `topo` = onde fica a borda do papel enquanto o cupom é curto (a impressão
// desce até `linha` e daí o papel passa a rolar para cima); `passo` = quanto o rolo anda para um lado
// ou para o outro, dentro do quadro, a cada etapa (a moldura não sai da direita)
export const ROLO = { escala: 1.2, linha: 900, topo: 64, passo: 36 };

// Abertura do layout "lado" (quadro cheio): um cupom curto no canto de baixo à esquerda, um pouco
// menor, com só um pouco de papel abaixo da última linha (`rabo`, px); ele cresce para cima a cada
// linha e depois vira o rolo. Se o rosto estiver colado na esquerda, o vídeo desliza para abrir lugar.
export const CUPOM_ABERTURA = { margem: 64, linha: 800, escala: 0.9, escalaMin: 0.66, rabo: 44 };

// A tira (quadro cheio): um pedaço curto de cupom subindo do pé do quadro ao lado do rosto, na altura
// do peito, alternando de lado quando os dois lados têm espaço. A última linha impressa fica em
// `linha` (acima da legenda); o papel fica a `respiro` px do rosto e a `margem` px da borda e nunca
// passa de `topo`. Se não couber, ele diminui até `escalaMin`; se nem assim couber, o vídeo desliza
// (aproximando o mínimo, até `zoomMax`) para afastar o rosto do lado da tira.
export const TIRA = { margem: 64, linha: 800, escala: 1.1, escalaMin: 0.66, respiro: 64, rabo: 44, topo: TOPO + 16, zoomMax: 1.4 };

// largura do rosto (fração da largura do quadro) quando o plano não tem `rosto.rastro`
export const LARGURA_DO_ROSTO = 0.15;

// Legenda: no quadro cheio, centrada na área segura de baixo (uma linha, acima dos controles do
// player); na tela dividida, no pé da moldura da pessoa
export const LEGENDA = { y: 884, largura: 1400, tamanho: 46, tamanhoMoldura: 40, peMoldura: 150 };

// Zona padrão (o cortar.mjs calcula a do vídeo: do queixo, com folga, até a margem de baixo)
export const zona = { topo: 700, altura: 308 };

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
