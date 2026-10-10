// Identidade do modelo Visor: a interface de uma câmera fictícia, sem marca.
// Vidro fumê escuro, traço branco fino e UM acento (água-marinha) para o que trava, liga ou acerta.
import { loadFont as carregarHanken } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as carregarChivoMono } from "@remotion/google-fonts/ChivoMono";

// Hanken Grotesk: o "l" minúsculo tem rabicho, então não se confunde com o "I" maiúsculo.
const hanken = carregarHanken("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] });
export const sans = hanken.fontFamily;
// Chivo Mono: números da câmera (ISO, velocidade, EV, contador)
const chivo = carregarChivoMono("normal", { weights: ["400", "500", "600"], subsets: ["latin", "latin-ext"] });
export const mono = chivo.fontFamily;

// Resolve quando as duas fontes carregaram: só então dá para medir o texto de verdade.
export const fontesCarregadas = Promise.all([hanken.waitUntilDone(), chivo.waitUntilDone()]);

export const cor = {
  // corpo do aplicativo de câmera (aparece atrás dos cartões quando a pessoa sai da tela cheia)
  corpo: "#0A0B0C",
  corpoClaro: "#141618",
  // vidro fumê dos rótulos (com desfoque do que está atrás)
  vidro: "rgba(13,15,16,0.64)",
  vidroForte: "rgba(10,11,12,0.8)",
  branco: "#F3F4F1",
  apagado: "rgba(243,244,241,0.55)",
  // estado "a lápis": o que ainda vai acontecer já aparece em traço cinza
  lapis: "rgba(243,244,241,0.34)",
  // o acento: foco travado, grade ligada, o ajuste que deu certo
  acento: "#3EE0CF",
  acentoTexto: "#062A27",
  // alerta: o vermelho do REC e do aviso de superexposição. SÓ problema, erro e risco.
  alerta: "#FF6B57",
  alertaTexto: "#2B0A05",
  // sombra para traço branco por cima de imagem clara
  sombra: "rgba(0,0,0,0.45)",
};

// Paleta da cena ilustrada (a "foto" que melhora a cada ajuste): neutros quentes, cor só no café.
export const cena = {
  parede: "#D6D1C8",
  paredeEscura: "#C9C3B8",
  luz: "#E8E4DC",
  mesa: "#A69C8E",
  mesaFrente: "#8F8577",
  borda: "#7B7265",
  xicara: "#F7F6F2",
  xicaraSombra: "#D9D5CC",
  cafe: "#5B3E2F",
  pires: "#EDEAE3",
  piresSombra: "#CFCAC0",
  sombra: "rgba(74,64,52,0.30)",
  vapor: "rgba(255,255,255,0.85)",
  tecido: "#1C1E20",
  tecidoFio: "#2E3134",
};

// a mesma cor com transparência (para o acento acompanhar a troca de cor da marca)
export const comAlfa = (hex: string, a: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const W = 1080;
export const H = 1920;
