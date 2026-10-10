import { loadFont as carregarGeist } from "@remotion/google-fonts/Geist";
import { loadFont as carregarMono } from "@remotion/google-fonts/GeistMono";

// Duas fontes: Geist para texto, Geist Mono para todo número (dígitos de largura igual:
// um contador não "dança" enquanto conta).
export const sans = carregarGeist("normal", { weights: ["500", "600"], subsets: ["latin"] }).fontFamily;
export const mono = carregarMono("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;

export const cor = {
  // fundo do painel: grafite quase preto, puxado para o verde
  fundo: "#0A120F",
  // cartões e janelas sobre o vídeo
  cartao: "rgba(10,18,15,0.9)",
  linha: "rgba(226,238,231,0.14)",
  linhaForte: "rgba(226,238,231,0.3)",
  texto: "#EDF3EF",
  suave: "rgba(237,243,239,0.62)",
  apagado: "rgba(237,243,239,0.36)",
  // o acento positivo (juros, ganho, crescimento)
  positivo: "#5FDDA4",
  // o secundário: rótulos e marcações
  ambar: "#F0B64E",
  // só quando algo é negativo (perda, queda)
  negativo: "#EE7766",
  // série neutra dos gráficos (o "seu dinheiro", a base)
  neutro: "#C4D0CA",
};

export const rotulo: React.CSSProperties = {
  fontFamily: mono,
  fontWeight: 500,
  fontSize: 32,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  color: cor.ambar,
};

// ——— números em português do Brasil ———

const milhar = (n: number) => n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// 99932 → "99.932"; com casas: 3.5 → "3,5"
export const formatar = (n: number, casas = 0) => {
  if (casas <= 0) return milhar(Math.round(n));
  const [i, d] = Math.abs(n).toFixed(casas).split(".");
  return `${n < 0 ? "-" : ""}${milhar(Number(i))},${d}`;
};

// forma curta para eixos: 25000 → "25 mil", 1500000 → "1,5 mi"
export const curto = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e9) return `${formatar(n / 1e9, n % 1e9 === 0 ? 0 : 1)} bi`;
  if (a >= 1e6) return `${formatar(n / 1e6, n % 1e6 === 0 ? 0 : 1)} mi`;
  if (a >= 1e3) return `${formatar(n / 1e3, n % 1e3 === 0 ? 0 : 1)} mil`;
  return formatar(n, a < 10 && n % 1 !== 0 ? 1 : 0);
};

// Escala "redonda" para eixos: 99932 → { max: 100000, passo: 25000 }
export const escalaRedonda = (maximo: number, divisoes = 4) => {
  const bruto = Math.max(maximo, 1e-9) / divisoes;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((k) => k * potencia).find((p) => p >= bruto) ?? 10 * potencia;
  return { max: passo * Math.ceil(maximo / passo - 1e-9), passo };
};

// `unidade` do plano → prefixo ou sufixo do número: "R$"/"US$" vão antes; "%", "mil", "kg"… depois.
export const separarUnidade = (unidade?: string) => {
  const u = (unidade ?? "").trim();
  if (!u) return { prefixo: "", sufixo: "" };
  if (/^(R\$|US\$|U\$|\$|€|£|¥|BRL|USD)$/i.test(u)) return { prefixo: `${u} `, sufixo: "" };
  if (u === "%") return { prefixo: "", sufixo: "%" };
  return { prefixo: "", sufixo: ` ${u}` };
};

// casas decimais que uma lista de números pede (0, 1 ou 2)
export const casasDe = (valores: number[]) =>
  Math.min(2, Math.max(0, ...valores.map((v) => (Number.isInteger(v) ? 0 : (String(v).split(".")[1] ?? "").length))));

// --- Medidas do quadro deitado (16:9, 1920×1080) ---
// A versão deitada do Painel, para o vídeo completo do YouTube. O estilo é o mesmo do vertical
// (as cores, as fontes, os blocos, o movimento); muda só a diagramação, pela regra da aula 9 do
// curso (editar uma aula horizontal): a pessoa em tela cheia é a base e, nos momentos de painel,
// ela vai para uma MOLDURA do lado direito e o painel ocupa o QUADRO do lado esquerdo.
export const QUADRO = { w: 1920, h: 1080 };
// margens seguras do YouTube: 96 px nas laterais
export const MARGEM = 96;
// abaixo desta linha ficam os controles do player (barra de tempo, botões)
export const LIMITE_PLAYER = 984;
// Os tamanhos do vertical (pensados para 1080 de largura num quadro de 1920 de altura) valem
// multiplicados por isto no quadro deitado, que é bem mais baixo. Os painéis e os cartões são
// desenhados numa camada "lógica" com as medidas do vertical e encolhidos por esta escala: a
// tipografia, as proporções e a conta de medir e encolher texto continuam as mesmas.
export const ESCALA = 0.84;
// a camada lógica que cobre o quadro inteiro (px antes da escala)
export const PLANO = { w: QUADRO.w / ESCALA, h: QUADRO.h / ESCALA };
// px do quadro → px da camada lógica
export const logico = (px: number) => px / ESCALA;
// a legenda fica sempre na área segura de baixo, acima dos controles do player
export const LEGENDA_Y = 884;
