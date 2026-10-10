import { loadFont as carregarCharis } from "@remotion/google-fonts/CharisSIL";
import { loadFont as carregarManrope } from "@remotion/google-fonts/Manrope";

// Duas fontes:
// - Manrope (sem serifa, larga e legível) para tudo o que se lê: a palavra, os títulos, os itens;
// - Charis SIL para a transcrição fonética (/ˈkʌmf.tɚ.bəl/): é a fonte feita para o alfabeto
//   fonético, com todos os símbolos (ʌ ɚ ə ʒ ˈ). O subconjunto latin-ext traz os símbolos.
const manrope = carregarManrope("normal", { weights: ["500", "700", "800"], subsets: ["latin", "latin-ext"] });
const charis = carregarCharis("normal", { weights: ["400", "700"], subsets: ["latin", "latin-ext"] });

export const sans = manrope.fontFamily;
export const fonetica = charis.fontFamily;
export const esperarFontes = () => Promise.all([manrope.waitUntilDone(), charis.waitUntilDone()]);

// Paleta "estúdio de dicção": violeta profundo, creme quente, um coral que é o som (o ponto da
// sílaba forte, o traço do certo, o risco do errado) e um lilás para o que é apoio.
export const cor = {
  // fundo dos painéis e dos cartões
  fundo: "#1D1550",
  fundo2: "#271D66",
  cartao: "rgba(29,21,80,0.94)",
  // o que se lê
  tinta: "#FBF6EE",
  // rótulos, fonética, o que é apoio
  lilas: "#B3A8EC",
  apagado: "rgba(251,246,238,0.34)",
  linha: "rgba(251,246,238,0.16)",
  // o som: sílaba forte, o certo, a ênfase, o risco do errado
  coral: "#FF5C7A",
  coralSuave: "rgba(255,92,122,0.18)",
};

// rótulo pequeno em caixa alta (o "sobrenome" de cada bloco)
export const rotulo: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 800,
  fontSize: 32,
  letterSpacing: "0.13em",
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
