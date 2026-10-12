import { loadFont as carregarSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as carregarSans } from "@remotion/google-fonts/Inter";

const serifItalico = carregarSerif("italic", { weights: ["400"], subsets: ["latin"] });
const serifNormal = carregarSerif("normal", { weights: ["400"], subsets: ["latin"] });
const sansNormal = carregarSans("normal", { weights: ["500", "600"], subsets: ["latin"] });

export const serif = serifNormal.fontFamily;
export const sans = sansNormal.fontFamily;

// Resolve quando as três faces estão carregadas: só então dá para medir o texto de verdade.
export const fontesCarregadas = Promise.all([
  serifItalico.waitUntilDone(),
  serifNormal.waitUntilDone(),
  sansNormal.waitUntilDone(),
]);

export const cor = {
  tinta: "#0E1726",
  papel: "#F2ECDF",
  latao: "#B9975B",
  // latão mais claro: lê melhor como texto sobre fundo escuro
  lataoClaro: "#D6B57C",
  // lacre (vermelho de cera de selo): SÓ o alerta e o risco. Nunca em texto corrido.
  lacre: "#C8664E",
  // texto de papel um pouco apagado (o que já passou, rótulos)
  papelSuave: "rgba(242,236,223,0.62)",
  // traço fino sobre o fundo escuro
  fio: "rgba(242,236,223,0.3)",
  // tinta apagada sobre o papel
  tintaSuave: "rgba(14,23,38,0.62)",
  fioTinta: "rgba(14,23,38,0.2)",
};

// --- Medidas do quadro deitado (16:9, 1920×1080) ---
// A versão deitada do Autoridade, para o vídeo completo do YouTube. A composição segue a aula 9
// do curso (editar uma aula horizontal): a pessoa em TELA CHEIA é a base, com o destaque na altura
// do peito; quando o bloco pede apoio visual (documento, lista, gráfico, comparação), a pessoa vai
// para uma MOLDURA do lado direito, com o rosto centralizado, e o bloco ocupa o QUADRO do lado
// esquerdo. A gramática está em src/layout.ts.
export const QUADRO = { w: 1920, h: 1080 };
// margens seguras do YouTube: 96 px nas laterais; nada abaixo de y 984 (controles do player)
export const MARGEM = 96;
export const LIMITE_APP = 984;
// a legenda (uma linha, 45 px) e a base do conteúdo com e sem ela
export const LEGENDA_Y = 912;
export const BASE = 960;
export const BASE_COM_LEGENDA = 888;
// topo do conteúdo (nada colado em cima)
export const TOPO = 112;
// a moldura da pessoa (lado direito, retrato 3:4 alto) e o quadro do bloco (lado esquerdo),
// com um vão de 80 px entre os dois
export const MOLDURA = { x: 1248, y: TOPO, w: 576, h: 776 };
export const QUADRO_ESQUERDO = { x: MARGEM, y: TOPO, w: 1072, h: 776 };

// Área padrão dos componentes na tela cheia: a altura do peito, abaixo do queixo, acima da
// legenda e dos controles do player. O plano pode mover (campo `zona`; o cortar.mjs calcula a
// partir do queixo).
export const zona = { esquerda: MARGEM, direita: MARGEM, topo: 640, altura: 368 };
export const LARGURA_UTIL = QUADRO.w - zona.esquerda - zona.direita;
// largura máxima da faixa do peito (centrada no rosto) e a altura mínima para um bloco caber nela
export const LARGURA_PEITO = 1400;
export const PEITO_MINIMO = 220;

// Largura média de um caractere da serifada, em frações do tamanho da fonte.
// Usada pelo contraste (componente do exemplo); os blocos novos (e o gancho, no quadro deitado) medem
// o texto de verdade (src/medida.ts).
const LARGURA_CARACTERE = 0.45;

export const caberNaLargura = (linhas: string[], largura: number, maximo: number) => {
  const maior = Math.max(...linhas.map((l) => l.length), 1);
  return Math.min(maximo, Math.floor(largura / (maior * LARGURA_CARACTERE)));
};

// Sombra suave para o texto claro continuar legível sobre roupa ou fundo claros (não é contorno).
export const sombra = "0 2px 16px rgba(8,12,20,0.55)";

// Letreiro em caixa alta espaçada (rótulos, fonte do documento). Nunca abaixo de 30 px.
export const ESPACO_ROTULO = 0.22;
export const rotulo: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 600,
  fontSize: 30,
  letterSpacing: `${ESPACO_ROTULO}em`,
  textTransform: "uppercase",
};

// Tamanhos mínimos (os mesmos do vertical: no quadro deitado, 1080 é a altura)
export const minimo = {
  titulo: 72,
  corpo: 44,
  detalhe: 40,
  rotulo: 30,
  grafico: 30,
};

// ——— números em português do Brasil ———

const milhar = (n: number) => Math.round(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// 83000 → "83.000"; 1.5 (casas 1) → "1,5"; -2 → "-2"
export const formatar = (n: number, casas = 0) => {
  const sinal = n < 0 ? "-" : "";
  if (casas <= 0) return sinal + milhar(Math.abs(n));
  const [i, d] = Math.abs(n).toFixed(casas).split(".");
  return `${sinal}${milhar(Number(i))},${d}`;
};

// casas decimais de um valor dado sem `casas` (1.5 → 1; 83000 → 0; 0.25 → 2)
export const casasDe = (n: number) => {
  if (Number.isInteger(n)) return 0;
  const s = String(n).split(".")[1] ?? "";
  return Math.min(2, s.length);
};
