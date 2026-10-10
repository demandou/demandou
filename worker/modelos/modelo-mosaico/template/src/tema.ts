import { loadFont as carregarBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as carregarInstrument } from "@remotion/google-fonts/InstrumentSans";

// Bricolage Grotesque: títulos, frações e números (editorial, com personalidade, sem ser condensada).
// Instrument Sans: rótulos, itens, legenda e assinatura.
export const display = carregarBricolage("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] }).fontFamily;
export const sans = carregarInstrument("normal", { weights: ["500", "600", "700"], subsets: ["latin"] }).fontFamily;

// Cores de comida, refinadas e pouco saturadas. A página (o "rejunte" do mosaico) é aveia;
// cada bloco tem UMA cor de fundo.
export const cor = {
  pagina: "#E7DFCF",
  creme: "#F8F3E9",
  folha: "#4F6B3C",
  folhaEscura: "#34482A",
  tomate: "#C4553B",
  gema: "#E1A73F",
  tinta: "#262821",
  // texto secundário sobre o creme
  cinza: "#7C7766",
  // fio de azeite: dourado claro que aparece sobre as três cores do prato
  azeite: "#F4D98A",
};

// "pagina" = sem fundo próprio: o bloco desenha os próprios ladrilhos (comparação, definição)
export type NomeCor = "folha" | "tomate" | "gema" | "creme" | "tinta" | "pagina";

// Fundo, texto, texto secundário e destaque de cada cor de bloco
export const paleta: Record<NomeCor, { fundo: string; texto: string; suave: string; acento: string; traco: string }> = {
  folha: { fundo: cor.folha, texto: cor.creme, suave: "rgba(248,243,233,0.72)", acento: cor.gema, traco: cor.creme },
  tomate: { fundo: cor.tomate, texto: cor.creme, suave: "rgba(248,243,233,0.78)", acento: "#FBE3B0", traco: cor.creme },
  gema: { fundo: cor.gema, texto: cor.tinta, suave: "rgba(38,40,33,0.7)", acento: cor.folha, traco: cor.tinta },
  creme: { fundo: cor.creme, texto: cor.tinta, suave: cor.cinza, acento: cor.folha, traco: cor.folha },
  tinta: { fundo: cor.tinta, texto: cor.creme, suave: "rgba(248,243,233,0.66)", acento: cor.gema, traco: cor.creme },
  pagina: { fundo: cor.pagina, texto: cor.tinta, suave: cor.cinza, acento: cor.folha, traco: cor.tinta },
};

// Cores das partes de um todo, das barras e das pastilhas, na ordem (nunca duas iguais lado a lado)
export const CORES_DAS_PARTES: NomeCor[] = ["folha", "tomate", "gema", "tinta", "creme"];

// A grade: margem externa, rejunte entre blocos e arredondamento dos cantos (px no quadro 1080×1920)
export const MARGEM = 24;
export const REJUNTE = 16;
export const RAIO = 34;

// A grade vai do topo até BASE_GRADE; embaixo fica o rodapé da página (nome e o índice dos momentos),
// que cai sob a interface do app. Assim nenhum bloco tem parte útil escondida pela interface.
export const BASE_GRADE = 1690;

// Tempo de uma remontagem do mosaico (s)
export const REMONTA = 0.72;

// Abaixo desta linha fica a interface do app: nenhum texto importante passa dela
export const LIMITE_APP = 1545;

// Rótulo pequeno em caixa alta (o "chapéu" do bloco)
export const rotulo: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 700,
  fontSize: 28,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  lineHeight: 1,
};
