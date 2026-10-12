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

// ---------- O quadro deitado (16:9, 1920×1080) ----------
//
// A versão deitada da Agenda, para o vídeo completo do YouTube. O estilo é o mesmo do vertical;
// muda a diagramação, pela aula 9 do curso (editar uma aula horizontal):
// - tela cheia é a base: a pessoa como foi gravada; os cartões que no vertical ficam no peito vão
//   numa COLUNA LIVRE ao lado do corpo, na altura do peito (src/agenda.ts, colunaDoPeito), e a
//   legenda fica na área segura de baixo;
// - quando o momento pede apoio visual, a folha da agenda ocupa a tela, a pessoa vira o compromisso
//   de vídeo numa MOLDURA do lado direito (com o rosto centralizado e acompanhado) e o conteúdo
//   ocupa o QUADRO à esquerda (a régua, os blocos, os blocos universais).
//
// O desenho é feito numa tela virtual de 2400×1350 "unidades", reduzida a 0,8 (ESCALA) por cima do
// vídeo: os tamanhos do vertical (títulos de 56 a 104, itens de 40 a 72, nada abaixo de 30) valem
// como estão, em unidades, e saem a 80% no quadro deitado, que é bem mais baixo. Só o vídeo da
// pessoa é posto em px de verdade do quadro (QUADRO), para não ser reamostrado duas vezes.
export const QUADRO = { w: 1920, h: 1080 };
export const ESCALA = 0.8;
export const W = QUADRO.w / ESCALA;
export const H = QUADRO.h / ESCALA;
// px do quadro → unidades, e o contrário
export const emUnidades = (px: number) => px / ESCALA;
export const emPx = (u: number) => u * ESCALA;
// margens seguras do YouTube: 96 px nas laterais
export const MARGEM = emUnidades(96);
// abaixo desta linha (984 px) ficam os controles do player: nada importante ali
export const LIMITE_APP = emUnidades(984);
// os cartões ao lado do peito ficam entre estas linhas (abaixo da etiqueta da câmera, acima do player)
export const TOPO_PEITO = 176;
export const LIMITE_PEITO = LIMITE_APP - 8;

// A folha da agenda (o "app"): ocupa a tela inteira, de 52 a 1252 unidades, com cabeçalho, régua de
// horas à esquerda e a raia dos blocos; a moldura da pessoa fica dentro dela, na direita
export const FOLHA = { x: 60, y: 52, w: W - 120, h: 1200, raio: 44 };
// acima daqui só passa o fundo do app
export const TOPO = FOLHA.y;
export const CABECALHO = 88;
export const MARGEM_INTERNA = 24;
// a régua começa na margem segura (o texto dela encosta à direita da coluna)
export const REGUA = { x: MARGEM, w: 116 };
export const RAIA = { x: MARGEM + REGUA.w + 14, direita: FOLHA.x + FOLHA.w - MARGEM_INTERNA };
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
