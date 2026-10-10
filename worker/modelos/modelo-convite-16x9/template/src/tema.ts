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

// --- O quadro deitado (16:9, 1920×1080) ---
// A versão deitada do Convite, para o vídeo completo do YouTube. A suíte de papelaria é a mesma
// (linho, papel algodão, tinta chocolate, fita de cetim, lacre de cera, mostrador e pilha), mas a
// composição segue a aula 9 do curso (editar uma aula horizontal): a pessoa em TELA CHEIA como base
// (o vídeo deitado inteiro, com a legenda num cartão de papel embaixo) e, quando um bloco pede apoio
// visual, a pessoa vai para a foto em arco do convite, que fica sempre do lado DIREITO (a moldura,
// com o rosto centralizado e acompanhado), e o bloco ocupa o lado ESQUERDO (o quadro).
export const W = 1920;
export const H = 1080;
// margens seguras do YouTube: 96 px nas laterais
export const MARGEM = 96;
// abaixo daqui ficam os controles do player (barra de tempo, botões)
export const LIMITE_APP = 984;

// Tamanhos mínimos para ler (os do vertical, pensados para 1080 de largura, valem no quadro deitado:
// ele é visto numa tela maior e as áreas de texto aqui são mais largas que no vertical).
export const TAM = {
  tituloCaligrafia: 156,
  rotulo: 34,
  // unidade da contagem ("MESES" / "ANTES"), uma palavra por linha
  unidade: 36,
  item: 60,
  cabecalhoCartao: 92,
  numeroContagem: 138,
  numeroFita: 40,
  legenda: 54,
  frase: 58,
  assinatura: 34,
  // menores corpos aceitos quando um texto longo precisa encolher
  minCaligrafia: 72,
  minTexto: 44,
  minRotulo: 30,
};

// ---------- geometria ----------
export type Rect = { x: number; y: number; w: number; h: number };

// A tela cheia: o vídeo deitado inteiro (a base da aula 9).
export const CHEIO: Rect = { x: 0, y: 0, w: W, h: H };

// O convite grande (abertura, número, definição, destaque, frase, pergunta): o cartão quase do
// tamanho da tela, deitado, com a foto em arco do lado direito (a moldura) e o texto do lado esquerdo
// (o quadro). O lacre fica na base da foto.
export const CONVITE: Rect = { x: 96, y: 56, w: 1728, h: 968 };
export const ARCO_CONVITE: Rect = { x: 1190, y: 146, w: 538, h: 720 };
// foto um pouco menor, quando o bloco tem mais texto (pergunta com opções, frase longa): encostada na
// mesma margem da direita, deixa o quadro do texto mais largo
export const ARCO_MEDIO: Rect = { x: 1240, y: 146, w: 488, h: 654 };

// No fechamento o convite fica um pouco mais estreito (os cartões da pilha aparecem atrás dele, dos lados).
export const CONVITE_FINAL: Rect = { x: 168, y: 72, w: 1584, h: 936 };
export const ARCO_FINAL: Rect = { x: 1156, y: 162, w: 500, h: 668 };

// Cronograma e mesa: o convite pequeno no lado direito (a moldura, sempre do mesmo lado no quadro
// deitado), e no quadro da esquerda a fita no alto, o mostrador e a pilha embaixo dela.
export const MINI = { w: 528, h: 780, y: 150, margem: 96 };
export const ARCO_MINI = { dx: 28, dy: 46, w: 472, h: 590 };
// a fita corre no alto do quadro da esquerda (y = linha do meio da fita); ondula de leve, como cetim
// solto. Ela nasce na borda esquerda da tela e, no fim da sequência, corre por baixo do convite.
export const FITA = { y: 214, altura: 58, x0: 210, x1: 1130, onda: 12, inicio: 34 };
// a pilha no quadro da esquerda, entre o mostrador e o convite pequeno
export const PILHA = { cx: 820, y: 374, w: 820, h: 502 };
// o mostrador à esquerda da pilha, na altura do meio dela
export const CONTAGEM = { r: 116, cx: 214, cy: 584 };
// área útil dentro de um cartão da pilha (descontada a moldura dupla)
export const MIOLO = { x: 64, y: 40, w: 692, h: 426 };

// A legenda da tela cheia: um cartão de papel algodão no terço de baixo, centrado, terminando acima
// dos controles do player. Até 2 linhas.
export const LEGENDA = { base: 958, largura: 1240, linhas: 2 };

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
