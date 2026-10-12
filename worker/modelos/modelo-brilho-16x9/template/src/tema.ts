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

// --- Medidas do quadro deitado (16:9, 1920×1080) ---
// A versão deitada do Brilho, para o vídeo completo do YouTube. A regra é a da aula 9 do curso
// (editar uma aula horizontal): a pessoa em quadro cheio é a base; quando a explicação pede espaço,
// ela vai para uma MOLDURA do lado direito (o rosto centralizado e acompanhado) e o painel creme
// abre do lado esquerdo. O que no vertical é uma pilha alta vira fileira: o texto no peito ganha
// linhas largas na faixa de baixo, o cartão que sobe fica largo e baixo (cabeçalho e itens lado a
// lado) e o painel se divide em colunas. Toda a diagramação deitada mora em src/fileira.ts.
export const QUADRO = { w: 1920, h: 1080 };
// margens seguras do YouTube nas laterais
export const MARGEM = 96;
// abaixo daqui ficam os controles do player (barra de tempo, botões)
export const LIMITE_APP = 984;
// base dos cartões que sobem de baixo
export const BASE_CARTAO = 956;
// base dos cartões quando o momento também mostra a legenda (o cartão sobe e a legenda fica embaixo)
export const BASE_COM_LEGENDA = 870;
// a legenda termina aqui: uma linha começa em LEGENDA_Y; duas linhas (na moldura) crescem para cima
export const LEGENDA_BASE = 964;
export const LEGENDA_Y = 898;
export const baseDoCartao = (m: { legenda?: boolean }) => (m.legenda ? BASE_COM_LEGENDA : BASE_CARTAO);
// o texto no peito termina aqui (acima dos controles do player)
export const BASE_TEXTO = 958;
// largura da MOLDURA da pessoa no layout "lado", sempre do lado direito (o painel creme é o resto)
export const LARGURA_LADO = 760;
// largura útil entre as margens (texto no peito, cartões)
export const LARGURA_UTIL = QUADRO.w - 2 * MARGEM;
// os tamanhos do vertical (pensados para 1080 de largura num quadro de 1920 de altura) valem
// multiplicados por isto no quadro deitado, que é bem mais baixo
export const ESCALA_DEITADA = 0.84;
export const deitado = (px: number) => Math.round(px * ESCALA_DEITADA);

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
