import { loadFont as carregarBai } from "@remotion/google-fonts/BaiJamjuree";
import { loadFont as carregarReddit } from "@remotion/google-fonts/RedditSans";

// Bai Jamjuree: letra de mostrador esportivo (números firmes, cantos retos, largura normal — nada
// condensado) para títulos e leituras. Reddit Sans: sans limpa para rótulos e textos. As duas têm o
// l minúsculo com cauda: "Il1", "IPTU" e "Inglês" nunca se confundem.
const bai = carregarBai("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin", "latin-ext"],
});
const reddit = carregarReddit("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
});
export const mostrador = bai.fontFamily;
export const sans = reddit.fontFamily;

// Resolve quando as duas famílias carregaram: só então dá para medir o texto de verdade
// (o <Edicao> espera por isto antes de desenhar).
export const fontesCarregadas = Promise.all([bai.waitUntilDone(), reddit.waitUntilDone()]);

// Um app de treino claro, ao ar livre: fundo giz com curvas de nível bem leves, cartões brancos,
// o relógio em preto fosco e as cinco cores das zonas como as únicas cores fortes.
export const cor = {
  fundo: "#ECEEEA",
  curva: "#DADED7",
  cartao: "#FFFFFF",
  tinta: "#0F1113",
  tintaSuave: "#565C63",
  tintaFraca: "#8A9097",
  // esboço "a lápis": o que ainda vai ser preenchido
  esboco: "#C2C7C1",
  esbocoTexto: "#A3A9A3",
  // o relógio
  caixa: "#141619",
  caixaBorda: "#2C3036",
  visor: "#07080A",
  numeral: "#E9ECEF",
  // mapa
  mapa: "#E4E8E1",
  parque: "#D3E2CC",
  agua: "#CFE0EC",
  rua: "#FFFFFF",
  ruaBorda: "#D3D8D0",
  // divisórias finas dentro dos cartões
  fio: "#DDE1DA",
};

// As cinco zonas (convenção dos relógios esportivos: cinza, azul, verde, laranja, vermelho).
// `texto` = versão mais escura para letras sobre branco; `fundo` = tinta bem clara (faixas).
// Papéis em qualquer assunto: 2 (azul) = a cor da marca, o neutro/chave; 3 (verde) = o certo, o que
// funciona; 4 (laranja) = atenção, o problema; 5 (vermelho) = alerta, o risco; 1 (cinza) = o que
// ficou para trás.
export const ZONAS = [
  { cor: "#9AA6B2", texto: "#5E6B78", fundo: "#E3E7EA", nome: "Zona 1" },
  { cor: "#2D7FF9", texto: "#1B63D6", fundo: "#DCE8FB", nome: "Zona 2" },
  { cor: "#1FAE6B", texto: "#14824F", fundo: "#D8EFE2", nome: "Zona 3" },
  { cor: "#FF8A1F", texto: "#D9660A", fundo: "#FCE8D5", nome: "Zona 4" },
  { cor: "#EE3D2F", texto: "#C92C20", fundo: "#FADAD6", nome: "Zona 5" },
];
export const zonaCor = (z: number | undefined, padrao = 2) => ZONAS[Math.min(5, Math.max(1, Math.round(z ?? padrao))) - 1];

export const W = 1080;
export const H = 1920;
// abas do app em cima e interface do app embaixo; nada a menos de 120 px da borda direita
export const TOPO = 110;
export const LIMITE_APP = 1540;
export const MARGEM = { esquerda: 120, direita: 120 };
// a área de conteúdo termina 20 px acima da interface do app
export const CONTEUDO = { x: 120, w: 840, topo: 240, base: 1520 };

// Sombras baixas e macias (nunca brilho)
export const sombraCartao = "0 18px 44px rgba(16,20,18,0.12), 0 3px 10px rgba(16,20,18,0.06)";
export const sombraAlta = "0 26px 60px rgba(16,20,18,0.22), 0 4px 14px rgba(16,20,18,0.10)";

export const numeros: React.CSSProperties = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1' };

// Letreiro em caixa alta espaçada ("ZONA 2", "SEUS TREINOS")
export const letreiro: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 800,
  fontSize: 32,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  lineHeight: 1,
};
