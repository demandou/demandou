// Identidade do modelo Convite: papelaria fina sobre linho azul-pó.
// Poucas cores: linho azul-pó, papel algodão, tinta chocolate, fita de cetim chocolate, o lacre de
// cera azul e, só para alerta e risco, uma tinta vermelha apagada. Nada de dourado, nada de brilho
// atrás da pessoa.
import { loadFont as carregarCinzel } from "@remotion/google-fonts/Cinzel";
import { loadFont as carregarGaramond } from "@remotion/google-fonts/EBGaramond";
import { loadFont as carregarVibes } from "@remotion/google-fonts/GreatVibes";

const fVibes = carregarVibes("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
const fCinzel = carregarCinzel("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] });
const fGaramond = carregarGaramond("normal", { weights: ["500", "600"], subsets: ["latin", "latin-ext"] });
const fGaramondItalico = carregarGaramond("italic", { weights: ["500"], subsets: ["latin", "latin-ext"] });

// caligrafia: só para palavras curtas de destaque ("Vai casar?", "Doze meses", "Salva")
export const caligrafia = fVibes.fontFamily;
// letreiro gravado: rótulos em caixa-alta espaçada e os números
export const gravado = fCinzel.fontFamily;
// texto: itens, frases e legenda (I maiúsculo, l minúsculo e 1 bem diferentes)
export const texto = fGaramond.fontFamily;
export const textoItalico = fGaramondItalico.fontFamily;

// todas as fontes carregadas: o texto só é medido depois disso (ver medida.ts)
export const fontesProntas = () =>
  Promise.all([fVibes.waitUntilDone(), fCinzel.waitUntilDone(), fGaramond.waitUntilDone(), fGaramondItalico.waitUntilDone()]).then(() => undefined);

export const cor = {
  // mesa: linho azul-pó
  linho: "#BCC9D5",
  linhoClaro: "#C9D4DE",
  linhoSombra: "#8A9AAB",
  // risco "a lápis" sobre o linho (o caminho da fita antes de ela chegar)
  linhoLapis: "#6E8094",
  // papéis da suíte (algodão, levemente quente e levemente frio)
  papel: "#FBF8F3",
  papelQuente: "#F6F0E7",
  papelFrio: "#F1F3F4",
  // tinta chocolate
  tinta: "#3A2A22",
  tintaSuave: "#76675D",
  // esboço "a lápis"
  lapis: "#C7BDB3",
  // fita de cetim chocolate
  fita: "#5B3B2F",
  fitaBrilho: "#86604F",
  fitaSombra: "#3B251D",
  // lacre de cera azul
  cera: "#40618A",
  ceraBrilho: "#6D8DB4",
  ceraSombra: "#2A4364",
  // tinta vermelha apagada: só alerta, risco e o lado errado de uma comparação
  alerta: "#9A3B32",
  alertaSuave: "#C98F86",
};

export const W = 1080;
export const H = 1920;
// abaixo daqui fica a interface do aplicativo (legenda do post, botões)
export const LIMITE_APP = 1560;

// Tamanhos mínimos para ler no celular (quadro de 1080 de largura).
export const TAM = {
  tituloCaligrafia: 156,
  rotulo: 34,
  // unidade da contagem ("MESES" / "ANTES"), uma palavra por linha
  unidade: 36,
  item: 60,
  cabecalhoCartao: 92,
  numeroContagem: 138,
  numeroFita: 40,
  legenda: 60,
  frase: 58,
  assinatura: 34,
  // menores corpos aceitos quando um texto longo precisa encolher
  minCaligrafia: 72,
  minTexto: 44,
  minRotulo: 30,
};

// ---------- geometria ----------
export type Rect = { x: number; y: number; w: number; h: number };

// O convite grande (abertura, frase, trechos livres): o cartão quase do tamanho da tela, com a foto
// em arco no alto.
export const CONVITE: Rect = { x: 92, y: 96, w: 896, h: 1424 };
export const ARCO_CONVITE: Rect = { x: 222, y: 186, w: 636, h: 852 };
// foto um pouco menor, quando o bloco tem mais texto (pergunta com opções, frase longa)
export const ARCO_MEDIO: Rect = { x: 262, y: 186, w: 556, h: 712 };

// No fechamento o convite fica um pouco mais estreito (os cartões da pilha aparecem atrás dele).
export const CONVITE_FINAL: Rect = { x: 128, y: 104, w: 824, h: 1408 };
export const ARCO_FINAL: Rect = { x: 248, y: 190, w: 584, h: 790 };

// Cronograma e mesa: um convite pequeno num lado do alto, o mostrador no outro, a fita e a pilha embaixo.
export const MINI = { w: 560, h: 820, y: 92, margem: 84 };
export const ARCO_MINI = { dx: 30, dy: 52, w: 500, h: 624 };
// a fita corre no meio da tela (y = linha do meio da fita); ondula de leve, como cetim solto
export const FITA = { y: 962, altura: 58, x0: 150, x1: 930, onda: 12, inicio: 34 };
export const PILHA = { cx: 540, y: 1018, w: 820, h: 502 };
export const CONTAGEM = { r: 128, cy: 436 };
// área útil dentro de um cartão da pilha (descontada a moldura dupla)
export const MIOLO = { x: 64, y: 40, w: 692, h: 426 };

// ---------- números em pt-BR ----------
const milhar = (n: number) => Math.round(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// 83000 → "83.000"; 2.5 (casas 1) → "2,5"
export const formatar = (n: number, casas = 0) => {
  if (casas <= 0) return `${n < 0 ? "-" : ""}${milhar(Math.abs(n))}`;
  const [i, d] = Math.abs(n).toFixed(casas).split(".");
  return `${n < 0 ? "-" : ""}${milhar(Number(i))},${d}`;
};

// casas decimais de um número dito (1.5 → 1; 83000 → 0)
export const casasDe = (v: number) => {
  const s = String(v);
  const k = s.indexOf(".");
  return k < 0 ? 0 : Math.min(2, s.length - k - 1);
};

const ROMANOS: [number, string][] = [
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];
export const romano = (n: number) => {
  let r = "";
  let v = Math.max(1, Math.round(n));
  for (const [k, s] of ROMANOS) {
    while (v >= k) {
      r += s;
      v -= k;
    }
  }
  return r;
};
