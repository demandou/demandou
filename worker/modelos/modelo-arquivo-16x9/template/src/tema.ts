import { loadFont as carregarArchivo } from "@remotion/google-fonts/Archivo";
import { loadFont as carregarCourier } from "@remotion/google-fonts/CourierPrime";

// Archivo: grotesca jornalística (títulos, nomes, supers, legenda).
// Courier Prime: máquina de escrever (tudo que é "registro": campos, datas, coordenadas, rótulos).
export const sans = carregarArchivo("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] }).fontFamily;
export const mono = carregarCourier("normal", { weights: ["400", "700"], subsets: ["latin"] }).fontFamily;

// Três cores e seus tons: papel de arquivo, tinta preta e o vermelho de carimbo/"gravando".
export const cor = {
  papel: "#ECE8DF",
  // ficha e cartão: um papel um pouco mais claro que a folha, para destacar da mesa
  cartao: "#F7F5EF",
  // borda da foto impressa
  foto: "#FAF8F3",
  tinta: "#151515",
  grafite: "#5A5750",
  // linhas pré-impressas do formulário e réguas finas
  linha: "rgba(21,21,21,0.16)",
  vermelho: "#C92A1F",
  // texto claro sobre o vídeo
  claro: "#F4F1EA",
  // pedra-sabão: cinza-esverdeado de material, só nas peças do mosaico
  pedra: ["#A9AD9E", "#B7BAAC", "#9DA293", "#C3C5B8", "#8F9587"],
  concreto: "#C8C4BA",
};

// --- Medidas do quadro DEITADO (16:9, 1920×1080) ---
// A versão deitada do Arquivo, para o vídeo completo do YouTube. O estilo é o mesmo do vertical;
// muda a diagramação, pela regra da aula 9 do curso (editar uma aula horizontal): a tela cheia é a
// base, e quando a fala vira registro a pessoa vai para uma foto impressa numa MOLDURA do lado
// direito da folha (rosto centralizado e acompanhado), com o documento no QUADRO do lado esquerdo.
export const QUADRO = { w: 1920, h: 1080 };
// margens seguras do YouTube: 96 px nas laterais
export const MARGEM = 96;
// cabeçalho da folha ("ARQUIVO · ASSUNTO" e "FL. 02/05"), no alto: não há interface de app em cima
export const CABECALHO_Y = 46;
// topo da área de conteúdo nas folhas (logo abaixo do filete do cabeçalho)
export const TOPO_FOLHA = 124;
// abaixo desta linha ficam os controles do player (barra de tempo, botões)
export const LIMITE_APP = 984;
// legenda: a base dela fica sempre nesta altura (acima dos controles do player); uma linha começa
// em LEGENDA_Y (a legenda é ancorada pela base: duas linhas crescem para cima)
export const LEGENDA_BASE = 962;
export const LEGENDA_Y = 886;
// base da área de conteúdo nas folhas: quase até os controles do player; com legenda, acima dela
export const BASE_CONTEUDO = 958;
export const BASE_COM_LEGENDA = 866;
// base dos supers em tela cheia (sem legenda; com legenda, BASE_COM_LEGENDA)
export const BASE_SUPERS = 940;

// Área dos supers em tela cheia (crédito, linha do tempo, assinatura): abaixo do queixo, no terço
// de baixo. O plano pode mover com `zona` (o cortar.mjs calcula a partir do queixo). No quadro
// deitado a faixa é baixa e larga: os supers se arrumam em fileiras e colunas, não numa pilha alta.
export const zona = { esquerda: 96, direita: 96, topo: 640, altura: 368 };
// largura máxima do texto dos supers (o terço de baixo, da esquerda até ~2/3 do quadro)
export const LARGURA_SUPERS = 1240;

// Largura média de um caractere, em frações do tamanho da fonte (para caber texto sem medir o DOM)
export const LARGURA_SANS = 0.6;
export const LARGURA_SANS_CAIXA_ALTA = 0.7;

export const caber = (texto: string, largura: number, maximo: number, fator = LARGURA_SANS, minimo = 28) =>
  Math.max(minimo, Math.min(maximo, Math.floor(largura / (Math.max(texto.length, 1) * fator))));

// Rótulo pré-impresso de formulário (mono, caixa alta, espaçado)
export const rotulo: React.CSSProperties = {
  fontFamily: mono,
  fontWeight: 700,
  fontSize: 28,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  lineHeight: 1,
};

// Sombra de papel sobre papel (não é brilho: é a folha fora da mesa)
export const sombraPapel = "0 2px 3px rgba(21,21,21,0.10), 0 14px 34px rgba(21,21,21,0.16)";
// Sombra suave para texto claro continuar legível sobre o vídeo (não é contorno)
export const sombraTexto = "0 2px 18px rgba(0,0,0,0.55)";
