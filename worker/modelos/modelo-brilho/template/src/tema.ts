import { loadFont } from "@remotion/google-fonts/Quicksand";
import { larguraLinha, type Peso, quebrarLinhas } from "./medida";

// Quicksand: sans arredondada, leve e elegante (300 nos números grandes, 500–700 no texto).
export const fonte = loadFont("normal", {
  weights: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;

// Paleta de camarim: creme, tons de produto (pêssego, blush, pérola) e UM acento vinho/berry.
export const cor = {
  creme: "#F8F0EA",
  // filete e divisões dentro do painel
  cremeEscuro: "#E9D9CF",
  // texto sobre o creme
  tinta: "#3A2330",
  tintaSuave: "#7A6570",
  // "a lápis": produto e amostra aparecem assim quando o cartão entra e ganham cor quando são ditos
  lapis: "#C9B9BD",
  // acento: números, setas no painel, pontos de ligação
  berry: "#8E2A4E",
  blush: "#E8A3A3",
  // traços das anotações por cima do vídeo (creme quase branco)
  traco: "#FFF6EF",
  // sombra fina que separa o traço claro da pele clara (não é contorno de texto)
  sombraTraco: "rgba(58,35,48,0.45)",
};

// Cores de produto (amostras). No plano, `cor` aceita um destes nomes ou um hexadecimal "#RRGGBB".
export const PRODUTOS: Record<string, string> = {
  corretivo: "#F2C6A4",
  base: "#E0AE8C",
  po: "#E8C3A6",
  blush: "#E48F96",
  rosado: "#E7A2B2",
  pessego: "#F1AE8A",
  iluminador: "#F6E3C3",
  bronzer: "#B98463",
  contorno: "#A07560",
  sombra: "#9C7C6E",
  batom: "#A52F52",
  nude: "#D6A28A",
  vinho: "#6E1F38",
  gloss: "#F0B7BF",
  delineador: "#2B2024",
  mascara: "#2B2024",
  // o acento da interface, para quando o item é o "problema" (alerta, erro)
  berry: "#8E2A4E",
};

// tons da paleta para itens sem cor própria (listas, gráficos, comparações): a ordem alterna
// claro e médio para dois itens vizinhos nunca parecerem iguais
export const TONS = ["#E48F96", "#F1AE8A", "#A52F52", "#E7A2B2", "#B98463", "#D6A28A"];
export const tom = (i: number) => TONS[((i % TONS.length) + TONS.length) % TONS.length];

export const corDoProduto = (c: string | undefined, padrao = PRODUTOS.blush) => {
  if (!c) return padrao;
  if (c.startsWith("#")) return c;
  return PRODUTOS[c.toLowerCase()] ?? padrao;
};

// Medidas do quadro 1080×1920
export const MARGEM = 56;
// abaixo daqui fica a interface do aplicativo (legenda do post, botões)
export const LIMITE_APP = 1560;
// base dos cartões que sobem de baixo
export const BASE_CARTAO = 1530;
// base dos cartões quando o momento também mostra a legenda (o cartão sobe e a legenda fica embaixo)
export const BASE_COM_LEGENDA = 1372;
// linha da legenda (topo)
export const LEGENDA_Y = 1404;
export const baseDoCartao = (m: { legenda?: boolean }) => (m.legenda ? BASE_COM_LEGENDA : BASE_CARTAO);
// largura da pessoa quando ela desliza para um lado (o resto é o painel)
export const LARGURA_LADO = 600;

// Largura média de um caractere da Quicksand, em frações do tamanho da fonte (estimativa rápida).
// As duas funções abaixo conferem o resultado com a MEDIDA real da fonte (src/medida.ts): o texto
// nunca passa da largura, seja qual for o assunto ("criptomoedas", "posicionamento", "WWW").
export const LARGURA_CARACTERE = 0.53;
export const caber = (texto: string, largura: number, maximo: number, fator = LARGURA_CARACTERE, peso: Peso = 600) => {
  let tamanho = Math.min(maximo, Math.floor(largura / (Math.max(texto.length, 1) * fator)));
  while (tamanho > 20 && larguraLinha(texto, tamanho, { peso }) > largura) tamanho -= 1;
  return tamanho;
};

// Quebra um texto em linhas que cabem na largura, equilibrando as linhas para não sobrar palavra
// sozinha. Começa pela estimativa e confere cada linha com a medida real; se alguma passar, quebra
// pela medida.
export const quebrar = (texto: string, largura: number, tamanho: number, fator = LARGURA_CARACTERE, peso: Peso = 600): string[] => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const cabe = Math.max(4, Math.floor(largura / (tamanho * fator)));
  const guloso = (limite: number) => {
    const linhas: string[] = [];
    let atual = "";
    for (const p of palavras) {
      const tentativa = atual ? `${atual} ${p}` : p;
      if (tentativa.length > limite && atual) {
        linhas.push(atual);
        atual = p;
      } else atual = tentativa;
    }
    if (atual) linhas.push(atual);
    return linhas;
  };
  const base = guloso(cabe);
  // equilibra: tenta limites menores mantendo o mesmo número de linhas
  let melhor = base;
  for (let limite = cabe - 1; limite >= Math.ceil(cabe * 0.55); limite--) {
    const l = guloso(limite);
    if (l.length !== base.length) break;
    melhor = l;
  }
  if (melhor.every((l) => larguraLinha(l, tamanho, { peso }) <= largura)) return melhor;
  return quebrarLinhas(texto, largura, tamanho, { peso });
};

// Rótulo pequeno em caixa alta espaçada
export const rotulo: React.CSSProperties = {
  fontFamily: fonte,
  fontWeight: 700,
  fontSize: 30,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  lineHeight: 1,
};

// Sombra suave para texto claro sobre o vídeo (não é contorno)
export const sombraTexto = "0 2px 18px rgba(20,10,16,0.55)";
