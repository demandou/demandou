import { loadFont as carregarBeVietnam } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as carregarRobotoMono } from "@remotion/google-fonts/RobotoMono";

// Duas fontes:
// - Be Vietnam Pro (sem serifa, redonda e bem legível, com Ã e Ç de verdade) para tudo o que se lê;
// - Roboto Mono para o que é "digitado" (a expressão que aparece letra por letra).
const vietnam = carregarBeVietnam("normal", { weights: ["500", "700", "800", "900"], subsets: ["latin", "latin-ext"] });
const mono = carregarRobotoMono("normal", { weights: ["500", "700"], subsets: ["latin", "latin-ext"] });

export const sans = vietnam.fontFamily;
export const digitada = mono.fontFamily;
export const esperarFontes = () => Promise.all([vietnam.waitUntilDone(), mono.waitUntilDone()]);

// Paleta "correio aéreo": vermelho-carimbo no fundo, papel creme nos cartões, azul-tinta para o
// inglês e tinta quase azul-noite para o texto. O carimbo NÃO é o vermelho do próprio fundo.
// (Os nomes dos tokens são os do motor de blocos; o papel de cada um está ao lado.)
export const cor = {
  // fundo dos painéis (vermelho-carimbo) e a faixa mais escura dele
  fundo: "#E5402A",
  fundo2: "#C3301D",
  // cartão sobre a pessoa: tinta azul-noite
  cartao: "rgba(23,20,48,0.95)",
  // o que se lê sobre fundo escuro ou vermelho: creme
  tinta: "#FFF5E6",
  // apoio (rótulos, detalhes): pêssego claro
  lilas: "#FFD2C2",
  apagado: "rgba(255,245,230,0.42)",
  linha: "rgba(255,245,230,0.22)",
  // ênfase sobre tinta e sobre o vermelho: azul-céu (também é a cor do inglês na legenda)
  coral: "#8DBEFF",
  coralSuave: "rgba(141,190,255,0.20)",
  // sobre papel creme
  papel: "#FFF5E6",
  papel2: "#F3E4CC",
  tintaPapel: "#171430",
  apoioPapel: "#6B5E57",
  azul: "#2355E8",
  carimbo: "#D4261A",
};

// rótulo pequeno em caixa alta (o "sobrenome" de cada bloco)
export const rotulo: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 800,
  fontSize: 32,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: cor.lilas,
  whiteSpace: "nowrap",
};

// ——— números em português do Brasil ———
const milhar = (n: number) => n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// 83000 → "83.000"; com casas: 1.5 → "1,5"
export const formatar = (n: number, casas = 0) => {
  if (casas <= 0) return `${n < 0 ? "-" : ""}${milhar(Math.abs(Math.round(n)))}`;
  const [i, d] = Math.abs(n).toFixed(casas).split(".");
  return `${n < 0 ? "-" : ""}${milhar(Number(i))},${d}`;
};
