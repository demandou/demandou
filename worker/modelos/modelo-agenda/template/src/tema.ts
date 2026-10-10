import { loadFont as carregarGolos } from "@remotion/google-fonts/GolosText";

// Golos Text: sans de interface, larga e firme, com números tabulares (horários e cronômetro não
// "dançam") e o l minúsculo com cauda — "Il1", "IPTU" e "Inglês" nunca se confundem.
export const sans = carregarGolos("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;

// Agenda limpa: fundo de app cinza-frio, folha branca e cores de categoria com função.
// Foco = tomate (o "pomodoro"), pausa = folha, pausa longa = manjericão, compromisso = ardósia.
export const cor = {
  fundo: "#E9ECF1",
  folha: "#FFFFFF",
  linha: "#E6E9EF",
  linhaForte: "#D5DAE2",
  tinta: "#14161C",
  tintaSuave: "#5B6272",
  tintaFraca: "#8A91A1",
  // esboço "a lápis": o que ainda vai ser preenchido
  esboco: "#BCC3CF",
  esbocoTexto: "#A3AAB8",
  // categorias
  foco: "#EF5A33",
  focoEscuro: "#C8421E",
  focoFundo: "#FDE5DC",
  pausa: "#49A85E",
  pausaFundo: "#DCF0D4",
  pausaTexto: "#1D5530",
  longa: "#2B7746",
  longaFundo: "#BFE2B1",
  longaTexto: "#123D22",
  outro: "#465064",
  outroFundo: "#E2E6ED",
  outroTexto: "#232A38",
};

export type Categoria = "foco" | "pausa" | "longa" | "outro";

// Cores e nome padrão de cada categoria. `solido` = bloco cheio com texto branco (só o foco).
export const CATEGORIAS: Record<Categoria, { forte: string; fundo: string; texto: string; nome: string; solido: boolean }> = {
  foco: { forte: cor.foco, fundo: cor.foco, texto: "#FFFFFF", nome: "Foco", solido: true },
  pausa: { forte: cor.pausa, fundo: cor.pausaFundo, texto: cor.pausaTexto, nome: "Pausa", solido: false },
  longa: { forte: cor.longa, fundo: cor.longaFundo, texto: cor.longaTexto, nome: "Pausa longa", solido: false },
  outro: { forte: cor.outro, fundo: cor.outroFundo, texto: cor.outroTexto, nome: "Compromisso", solido: false },
};

export const W = 1080;
export const H = 1920;
// abas do app em cima (só o cabeçalho da folha passa por ali) e interface do app embaixo
export const TOPO = 110;
export const LIMITE_APP = 1560;
// os cartões no peito terminam aqui (um respiro acima da interface do app)
export const LIMITE_PEITO = 1540;

// A folha da agenda (o "app"): ocupa a tela de 110 a 1540 px — cabeçalho, régua de horas e a raia dos blocos
export const FOLHA = { x: 40, y: 110, w: 1000, h: 1430, raio: 40 };
export const CABECALHO = 88;
export const MARGEM_INTERNA = 24;
export const REGUA = { x: FOLHA.x + MARGEM_INTERNA, w: 116 };
export const RAIA = { x: FOLHA.x + MARGEM_INTERNA + REGUA.w + 14, direita: FOLHA.x + FOLHA.w - MARGEM_INTERNA };
export const CONTEUDO = { topo: FOLHA.y + CABECALHO + 16, base: FOLHA.y + FOLHA.h - MARGEM_INTERNA };

// Sombras macias e baixas (nunca brilho)
export const sombraFolha = "0 24px 60px rgba(20,26,40,0.12), 0 4px 12px rgba(20,26,40,0.06)";
export const sombraCartao = "0 22px 50px rgba(20,26,40,0.22), 0 4px 12px rgba(20,26,40,0.10)";
export const sombraBloco = "0 10px 24px rgba(20,26,40,0.14), 0 2px 5px rgba(20,26,40,0.08)";

export const RAIO_BLOCO = 22;

// Largura média de um caractere em frações do corpo, já com o espaço entre palavras
// (Golos Text em 700–800 mede ~0,52; 0,56 dá folga para não quebrar linha sem querer)
export const LARGURA = 0.56;
export const caber = (texto: string, largura: number, maximo: number, minimo = 34) =>
  Math.max(minimo, Math.min(maximo, Math.floor(largura / (Math.max(texto.length, 1) * LARGURA))));

export const numeros: React.CSSProperties = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1' };

// Rótulo em caixa alta espaçada ("FOCO", "LEMBRETE")
export const rotuloCaixaAlta: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 700,
  fontSize: 32,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  lineHeight: 1,
};
