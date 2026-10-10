import { loadFont } from "@remotion/google-fonts/Rubik";

// Uma família só: a Rubik, de cantos levemente arredondados, com cara de interface de rede social
// sem ser nenhuma. Larga e aberta (nada condensado); o peso faz a hierarquia.
export const fonte = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const cor = {
  // a "mesa" de cima, onde os cartões do feed passam: azul-ardósia com pontinhos
  fundo: "#1E3350",
  fundoClaro: "#2B4668",
  // os cartões (comentário, post, listas…)
  cartao: "#FFFFFF",
  // cartões escuros (abertura, destaque-chave)
  noite: "#0F1A2B",
  tinta: "#121820",
  cinza: "#687384",
  cinzaClaro: "#E7EBF0",
  linha: "#DCE1E8",
  // o marca-texto: a linha que a pessoa está lendo, o trecho que importa, a palavra falada na legenda
  marca: "#FFE14A",
  // marca-texto de alerta (problema, "não faça")
  marcaAlerta: "#FF9A86",
  // acento: a aba "respondendo", aspas, botão de enviar
  acento: "#FF6A3D",
  // risco (o que foi desmentido) e alerta
  alerta: "#E5383B",
  // o lado certo / o que funciona
  certo: "#1FAA6B",
  // avatares genéricos (a cor sai do nome)
  avatares: ["#5B8DEF", "#9B6BDF", "#2EB5A0", "#F08A4B", "#E25C8A"],
};

export const sombraCartao = "0 22px 48px rgba(6,16,32,0.42)";
export const RAIO = 34;
