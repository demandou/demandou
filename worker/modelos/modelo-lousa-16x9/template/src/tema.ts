import { loadFont as carregarAtkinson } from "@remotion/google-fonts/AtkinsonHyperlegibleNext";
import { loadFont as carregarMali } from "@remotion/google-fonts/Mali";

// Mali: a letra de quem escreve na lousa (redonda, larga, I e l bem diferentes).
// Os algarismos e sinais da conta não usam fonte: são traços de giz (giz/glifos.ts).
// Atkinson Hyperlegible Next: rótulos, legenda e assinatura (feita para leitura fácil).
const fonteMali = carregarMali("normal", { weights: ["600"], subsets: ["latin"] });
const fonteAtkinson = carregarAtkinson("normal", { weights: ["500", "700"], subsets: ["latin"] });
export const mao = fonteMali.fontFamily;
export const sans = fonteAtkinson.fontFamily;
export const esperarFontes = () => Promise.all([fonteMali.waitUntilDone(), fonteAtkinson.waitUntilDone()]);

// Lousa verde quase preta, giz branco e UM giz amarelo para o que é o assunto naquele instante.
export const cor = {
  lousa: "#17211C",
  lousaEscura: "#101813",
  giz: "#EEEDE6",
  amarelo: "#F3D66B",
  // giz rosa: só para o erro e o alerta (o que dá errado, o que é riscado, o lado errado)
  rosa: "#F29B8D",
  // giz bem fraco: esboço do que ainda vai ser escrito e restos do que foi apagado
  fantasma: "rgba(238,237,230,0.17)",
  rotulo: "rgba(238,237,230,0.62)",
};

// Espessura do traço de giz, em fração da altura do algarismo
export const TRACO = 0.112;
// Menores tamanhos permitidos (px no quadro deitado 1920×1080). No vertical a conta não descia de
// 120 px (leitura no celular em pé); o quadro deitado é visto maior (o mesmo celular deitado, o
// computador, a TV), e 100 px aqui têm o tamanho de ~120 px lá. Texto e rótulo continuam iguais.
export const MIN = { conta: 100, texto: 44, rotulo: 34 };

// --- Medidas do quadro (16:9, 1920×1080) ---
// A versão deitada da Lousa, para o vídeo completo do YouTube. A regra é a da aula 9 do curso
// (editar uma aula horizontal): a pessoa em tela cheia é a base; quando a fala pede a lousa, a
// pessoa vai para uma MOLDURA do lado direito (rosto centralizado nela) e a lousa ocupa o lado
// esquerdo. As posições de cada lugar estão em src/layout.ts.
export const W = 1920;
export const H = 1080;
// margens seguras do YouTube: 96 px nas laterais
export const MARGEM = 96;
// topo da lousa e das molduras (no YouTube não há interface por cima do vídeo no alto)
export const TOPO_LOUSA = 76;
// Legenda: a tarja assenta a base aqui (cresce para cima), na área segura de baixo, logo acima
// dos controles do player
export const LEGENDA_BASE = 976;
export const LEGENDA_CORPO = 54;
// abaixo desta linha ficam os controles do player (barra de tempo, botões)
export const LIMITE_APP = 984;
// Nada da lousa (nem a moldura da pessoa) passa daqui quando a legenda pode aparecer
export const BASE_LOUSA = 860;
// …e quando o momento não tem legenda, até aqui (acima dos controles do player)
export const BASE_SEM_LEGENDA = 950;

// Rótulo em caixa-alta espaçada (sans)
export const estiloRotulo: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 700,
  fontSize: 34,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};
