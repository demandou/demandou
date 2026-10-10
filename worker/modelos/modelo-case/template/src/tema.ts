// Identidade do Case: um relatório de consultoria impresso. Papel claro e frio sobre uma mesa cinza,
// tinta quase preta, filetes finos e UM acento: coral (o que importa, o resultado, a palavra-chave).
// Inter para tudo o que se lê (números com dígitos de largura igual); Fragment Mono só nas etiquetas
// curtas do relatório (ANTES, DEPOIS, rótulos das métricas). Nada mexe na pessoa: a cor do vídeo não muda.
import { loadFont as carregarInter } from "@remotion/google-fonts/Inter";
import { loadFont as carregarMono } from "@remotion/google-fonts/FragmentMono";

export const fonte = carregarInter("normal", { weights: ["500", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const mono = carregarMono("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const cor = {
  // a mesa (fundo atrás da folha e da moldura)
  mesa: "#DFE2E6",
  mesaEscura: "#CDD2D8",
  // a folha do relatório
  papel: "#FAFAF7",
  papelSombra: "#F1F0EB",
  // tinta
  tinta: "#121722",
  tintaSuave: "#5E6573",
  tintaFraca: "#9AA0AB",
  filete: "#DEDCD5",
  esqueleto: "#E9E7E1",
  // o acento único: coral
  acento: "#FF5A36",
  acentoEscuro: "#D9401F",
  acentoClaro: "#FFE6DE",
  acentoFundo: "#FFF3EF",
  // cartões dentro da folha (conversa, caixa de comentário)
  cartao: "#FFFFFF",
  conversa: "#F2F1EC",
};

export const sombraFolha = "0 24px 50px rgba(18,23,34,0.16), 0 3px 10px rgba(18,23,34,0.08)";
export const sombraCartao = "0 14px 32px rgba(18,23,34,0.12), 0 2px 6px rgba(18,23,34,0.06)";

// ——— o palco (px, quadro 1080×1920) ———
// A folha do relatório fica em cima; a moldura da pessoa começa na COSTURA e vai até embaixo.
export const COSTURA = 1000;
export const FOLHA = { x: 40, y: 92, w: 1000, h: COSTURA - 20 - 92, raio: 18 };
// conteúdo da folha: margem de 44 px dentro dela (= 84 px da borda da tela)
export const CONTEUDO = { x: 84, w: 912 };
// cabeçalho fixo da folha (título do relatório + pontos das seções)
export const CABECALHO = { y: 122, h: 64 };
// a janela por onde a "câmera" desce pelo relatório (cada página do relatório tem esta altura)
export const VISOR = { x: CONTEUDO.x, y: 206, w: CONTEUDO.w, h: COSTURA - 20 - 206 - 16 };
// distância entre duas páginas do relatório
export const VAO_PAGINAS = 64;
export const MOLDURA = { x: 40, y: COSTURA, w: 1000, h: 1920 - COSTURA + 60, raio: 18 };
// nada importante abaixo disto (interface do app)
export const UI_BASE = 1700;
