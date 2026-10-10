// Identidade do modelo Rótulo: papel de rótulo, tinta de impressão, vinho e vidro de garrafa.
// O assunto do vídeo pode ser qualquer um: o rótulo vira a ficha técnica do que a pessoa explica.
import { loadFont as carregarDisplay } from "@remotion/google-fonts/LibreCaslonDisplay";
import { loadFont as carregarTexto } from "@remotion/google-fonts/LibreCaslonText";
import type { Rotulo } from "./plano";

// Libre Caslon: a tipografia clássica de rótulo. Display (contraste alto) para o nome do vinho e os
// números grandes; Text (robusta, olho grande) para tudo o que precisa ser lido no celular.
export const display = carregarDisplay("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const texto = carregarTexto("normal", { weights: ["400", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;
carregarTexto("italic", { weights: ["400"], subsets: ["latin", "latin-ext"] });

export const cor = {
  // papel do rótulo (e da ficha)
  papel: "#F4EEE3",
  // um tom abaixo: faixa do cabeçalho da ficha, trilho do medidor
  papelEscuro: "#E9E0D0",
  // tinta de impressão: todo texto e todo traço
  tinta: "#211B18",
  tintaSuave: "#62574F",
  // o que ainda não foi dito: impresso "a lápis"
  lapis: "#C9BFB1",
  // a cor de destaque: vinho (a uva, o número, o medidor, a taça)
  vinho: "#701C2E",
  vinhoClaro: "#E7D3D0",
  // vidro da garrafa, em volta do rótulo
  vidro: "#0D1310",
  vidroBrilho: "#1C2722",
};

// Cores do líquido na taça (do mais claro ao mais escuro conforme o corpo)
export const LIQUIDOS = {
  tinto: { claro: "#B8434F", escuro: "#4E0F1D" },
  rose: { claro: "#F0A6A0", escuro: "#D9646A" },
  branco: { claro: "#F1E2A0", escuro: "#D8B54E" },
  cerveja: { claro: "#F2C25A", escuro: "#9A4E14" },
  cafe: { claro: "#A0714D", escuro: "#2E1A10" },
} as const;

// Tamanhos (px num quadro de 1080 de largura). Nada abaixo de 30.
export const TAM = {
  // impressão do rótulo (legível sem a lupa; a câmera ainda aproxima 6–12%)
  rotuloNome: 72,
  rotuloDestaque: 56,
  rotuloCaixa: 36,
  rotuloGrande: 64,
  rotuloMiudo: 32,
  // ficha
  cabecalho: 34,
  titulo: 84,
  tituloMin: 66,
  valor: 68,
  nota: 50,
  notaMin: 44,
  numeroGrande: 156,
  legendaDesenho: 34,
  assinatura: 40,
  legenda: 52,
};

// Rótulo de reserva, usado só enquanto o plano ainda não tem `rotulo` (logo depois do cortar)
export const ROTULO_PADRAO: Rotulo = {
  nome: "Ficha técnica",
  linha: "Escreva o rótulo no plano",
  campos: [],
};

// ---------- geometria (quadro 1080×1920) ----------

// o papel do rótulo (com o vidro aparecendo em volta)
export const PAPEL = { x: 40, y: 96, w: 1000, h: 1728, canto: 36 };

// o camafeu: a pessoa como emblema do rótulo (rosto de ~280 px de largura já sem a câmera)
export const CAMAFEU = { cx: 540, cy: 410, rx: 200, ry: 250 };
// aproximação padrão da pessoa dentro do camafeu (rosto e um pouco do pescoço)
export const ZOOM_CAMAFEU = 2.5;
// altura do rosto dentro do camafeu (0 = topo, 1 = base)
export const ANCORA_CAMAFEU = 0.62;

// os quatro cartuchos dos lados do camafeu (centro de cada bloco) e as duas linhas de baixo
export const CARTUCHO = { esqX: 190, dirX: 890, cimaY: 268, baixoY: 540, largura: 228 };
export const LINHA = { nome: 768, regra: 862, origem: 962 };

// a lupa: raio para as linhas largas (origem), para os cartuchos e para o nome (colado no camafeu)
export const LUPA = { r: 165, rCartucho: 112, rNome: 100, cabo: 200, angulo: 42 };

// a ficha (o painel de explicação, na altura do peito): da borda esquerda à direita
export const FICHA = { x: 72, w: 936, base: 1556 };
// topo da ficha: logo abaixo do queixo na abertura, e abaixo da última linha do rótulo
export const fichaTopo = (zonaTopo: number) => Math.round(Math.min(1100, Math.max(1076, zonaTopo + 110)));

// abaixo daqui fica a interface do app (nenhum texto que precise ser lido)
export const LIMITE_APP = 1560;

export const caixaAlta = (tamanho: number, espaco = 0.16): React.CSSProperties => ({
  fontFamily: texto,
  fontWeight: 400,
  fontSize: tamanho,
  letterSpacing: `${espaco}em`,
  textTransform: "uppercase",
});

// números sempre alinhados (a Caslon tem algarismos de texto por padrão)
export const numerosAlinhados: React.CSSProperties = { fontVariantNumeric: "lining-nums tabular-nums" };
