// As trocas da página, sem nunca dois textos um sobre o outro.
//
// - Quadro cheio → página: o cartão termina de sair no `de` da página; só então a página aparece
//   (apagada → acesa, 0,3 s), por trás da pessoa que encolhe.
// - Página → quadro cheio: a página apaga enquanto a pessoa cresce (0,3 s a partir de `ate` − 0,1);
//   o cartão seguinte só entra depois (`de` + 0,32).
// - Página → página: uma régua grafite desce pela tela (uma cortina de 0,4 s, centrada na troca):
//   acima dela já é a página nova, abaixo ainda é a velha. As duas nunca aparecem no mesmo lugar e
//   nenhum quadro fica vazio. O bloco da pessoa começa a ir para o item novo um pouco antes.
// - Funil → o seu conserto (a mesma tela): nada some.
import { Easing } from "remotion";
import { prog, troca } from "./anim";
import { type Momento, naPagina, type Plano } from "./plano";

export type Janela = {
  entra: number;
  sai: number;
  entrada: "fundo" | "cortina" | "continua";
  saida: "fundo" | "cortina" | "continua";
};

export const FUNDO = 0.3;
export const CORTINA = 0.4;
// a cortina começa este tempo antes da troca (e termina o mesmo tempo depois)
export const MEIA_CORTINA = CORTINA / 2;

// O último momento fica até o fim do vídeo quando é um fechamento ou quando termina colado no fim.
export const fimDe = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

const encostados = (a: Momento | undefined, b: Momento | undefined) => !!a && !!b && b.de - a.ate < 0.4;

// `mesmaTela(a, b)`: os dois momentos são a mesma tela (o funil e o conserto dele)
export const janelasDaPagina = (plano: Plano, mesmaTela: (a: Momento, b: Momento) => boolean) => {
  const ordem = plano.momentos;
  const mapa = new Map<Momento, Janela>();
  ordem.forEach((m, i) => {
    if (!naPagina(m)) return;
    const antes = ordem[i - 1];
    const depois = ordem[i + 1];
    const paginaAntes = encostados(antes, m) && naPagina(antes as Momento);
    const paginaDepois = encostados(m, depois) && naPagina(depois as Momento);
    const continuaAntes = paginaAntes && mesmaTela(antes as Momento, m);
    const continuaDepois = paginaDepois && mesmaTela(m, depois as Momento);
    const entrada: Janela["entrada"] = continuaAntes ? "continua" : paginaAntes ? "cortina" : "fundo";
    const saida: Janela["saida"] = continuaDepois ? "continua" : paginaDepois ? "cortina" : "fundo";
    mapa.set(m, {
      entrada,
      saida,
      entra: entrada === "continua" ? m.de - 1 : m.de - (entrada === "cortina" ? MEIA_CORTINA : 0),
      sai:
        saida === "continua"
          ? (depois as Momento).de + 1
          : saida === "cortina"
            ? (depois as Momento).de + MEIA_CORTINA
            : fimDe(m, plano) + 0.3,
    });
  });
  return mapa;
};

export type Estilo = { opacidade: number; desloca: number; corteEmCima?: number; corteEmbaixo?: number; regua?: number };

// altura da régua da cortina, de 0 a 1 de progresso
const alturaDaCortina = (p: number) => 110 + p * (1650 - 110);

// Como a página aparece no instante t (null = invisível)
export const estiloDaJanela = (t: number, j: Janela): Estilo | null => {
  if (t < j.entra - 0.001 || t > j.sai + 0.001) return null;
  let opacidade = 1;
  let corteEmCima: number | undefined;
  let corteEmbaixo: number | undefined;
  let regua: number | undefined;
  if (j.entrada === "fundo") opacidade *= prog(t, j.entra, FUNDO);
  if (j.entrada === "cortina") {
    const p = prog(t, j.entra, CORTINA, troca);
    if (p <= 0) return null;
    if (p < 1) {
      const y = alturaDaCortina(p);
      corteEmbaixo = Math.max(0, 1920 - y);
      regua = y;
    }
  }
  // indo para o quadro cheio: a página fica enquanto a pessoa cresce por cima dela e apaga quando ela
  // já cobre quase tudo (de `ate` + 0,08 a `ate` + 0,3), antes de o cartão seguinte entrar
  if (j.saida === "fundo") opacidade *= 1 - prog(t, j.sai - 0.22, 0.22, Easing.linear);
  if (j.saida === "cortina") {
    const p = prog(t, j.sai - CORTINA, CORTINA, troca);
    if (p >= 1) return null;
    if (p > 0) corteEmCima = alturaDaCortina(p);
  }
  if (opacidade <= 0.001) return null;
  return { opacidade, desloca: 0, corteEmCima, corteEmbaixo, regua };
};

// Quando os cartões de quadro cheio entram e saem, para nunca cruzarem com o texto da página
export const tempoDoCartao = (m: Momento, plano: Plano, trechos: { de: number; ate: number }[]) => {
  const vemDaPagina = trechos.some((x) => Math.abs(x.ate - m.de) < 0.4);
  const vaiParaPagina = trechos.find((x) => Math.abs(x.de - fimDe(m, plano)) < 0.4);
  return {
    // vindo da página, espera a página apagar e a pessoa quase cobrir a tela
    entra: vemDaPagina ? m.de + 0.32 : m.de,
    // indo para a página, termina de sair no começo dela (a página só aparece depois)
    fim: vaiParaPagina ? vaiParaPagina.de : fimDe(m, plano),
    vemDaPagina,
  };
};
