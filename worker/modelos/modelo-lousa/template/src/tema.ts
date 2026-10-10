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
// Menores tamanhos permitidos (px no quadro 1080×1920), para ler no celular
export const MIN = { conta: 120, texto: 44, rotulo: 34 };

export const W = 1080;
export const H = 1920;
export const MARGEM = 64;
// Legenda: a tarja assenta a base aqui (cresce para cima), logo acima da interface do app
export const LEGENDA_BASE = 1548;
export const LEGENDA_CORPO = 60;
export const LIMITE_APP = 1560;
// Nada da lousa passa daqui quando a legenda pode aparecer
export const BASE_LOUSA = 1432;
// …e quando o momento não tem legenda, até aqui (acima da interface do app)
export const BASE_SEM_LEGENDA = 1490;

// Rótulo em caixa-alta espaçada (sans)
export const estiloRotulo: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 700,
  fontSize: 34,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};
