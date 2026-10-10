import { loadFont } from "@remotion/google-fonts/SchibstedGrotesk";

// Uma família só: Schibsted Grotesk, uma grotesca de jornal. O I maiúsculo tem serifa (não se
// confunde com l) e os algarismos são firmes, bons para contadores.
export const fonte = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] }).fontFamily;

export const W = 1080;
export const H = 1920;

// Gráfico de dados impresso: papel cinza-quente, grafite, e duas cores com função fixa.
export const cor = {
  // o papel da tela do funil
  papel: "#E8E6E1",
  // o miolo do funil, um tom acima do papel
  miolo: "#F7F6F2",
  // grafite: as pessoas (pontos), o contorno do funil, os números e os cartões
  grafite: "#1F2023",
  grafiteSuave: "rgba(31,32,35,0.66)",
  // esboço "a lápis": o que ainda vai ser preenchido
  lapis: "rgba(31,32,35,0.34)",
  // pessoa que ficou pelo caminho
  apagado: "rgba(31,32,35,0.17)",
  // linhas finas (divisões entre as etapas, grade do papel)
  fio: "rgba(31,32,35,0.22)",
  branco: "#FFFFFF",
  // texto claro sobre o grafite (cartões)
  claroSuave: "rgba(255,255,255,0.72)",
  // laranja de sinal: SÓ o problema (o vazamento, o que não vende, o que é riscado)
  alerta: "#FF5A1F",
  // verde: SÓ o fluxo consertado (o que passa a mais depois do conserto)
  conserto: "#12A37A",
};

// Tamanhos (quadro de 1080 de largura, lido num celular)
export const tipo = {
  titulo: 78,
  numero: 76,
  rotulo: 42,
  rotuloDuasLinhas: 40,
  chip: 36,
  tag: 32,
};

// Faixa padrão dos cartões de quadro cheio: abaixo do queixo, acima da interface do app.
// O plano pode mover (campo `zona`).
export const zona = { esquerda: 60, direita: 60, topo: 986, altura: 470 };

// Abaixo desta linha fica a interface do aplicativo (legenda do post, botões)
export const LIMITE_APP = 1560;

// Largura média de um caractere, em frações do tamanho da fonte (para caber texto sem medir o DOM)
export const LARGURA = { negrito: 0.56, medio: 0.52, numero: 0.6, caixaAlta: 0.66 };

export const larguraTexto = (texto: string, tamanho: number, fator = LARGURA.medio) => texto.length * tamanho * fator;

// ——— números em português do Brasil ———

const milhar = (n: number) => Math.round(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// 1000 → "1.000"; 2.5 → "2,5"
export const formatar = (n: number, casas = 0) => {
  if (casas <= 0) return milhar(n);
  const [i, d] = Math.abs(n).toFixed(casas).split(".");
  return `${n < 0 ? "-" : ""}${milhar(Number(i))},${d}`;
};

// taxa em %: 10 → "10%", 2.5 → "2,5%", 0.25 → "0,25%"
export const porcento = (p: number) => {
  if (p >= 10 || Number.isInteger(p)) return `${formatar(p)}%`;
  if (p >= 1) return `${formatar(p, 1).replace(/,0$/, "")}%`;
  return `${formatar(p, 2).replace(/0$/, "")}%`;
};

// ——— texto que cabe (sem medir o DOM) ———

// Largura de um caractere da Schibsted Grotesk, em frações do corpo (aproximada, um pouco folgada).
const larguraDoCaractere = (c: string) => {
  if (c === " ") return 0.27;
  if ("iljtfrI.,:;!'|()[]".includes(c)) return 0.33;
  if ("mwMW".includes(c)) return 0.9;
  if (/[0-9]/.test(c)) return 0.6;
  if (/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(c)) return 0.7;
  if ("$%&@#".includes(c)) return 0.72;
  return 0.57;
};

// Largura estimada de um texto em px (peso 800; um pouco menos nos pesos menores)
// (calibrada nos quadros renderizados: a tabela acima subestima ~7%)
export const medir = (texto: string, tamanho: number, peso = 800) =>
  [...texto].reduce((s, c) => s + larguraDoCaractere(c), 0) * tamanho * (peso >= 700 ? 1.07 : 1.02);

// Quebra as palavras em linhas que cabem na largura (guloso, depois equilibrado)
export const quebrarLinhas = (texto: string, tamanho: number, largura: number, peso = 800): string[][] => {
  const ws = texto.split(/\s+/).filter(Boolean);
  const guloso = (limite: number) => {
    const linhas: string[][] = [[]];
    for (const w of ws) {
      const atual = linhas[linhas.length - 1];
      if (atual.length && medir([...atual, w].join(" "), tamanho, peso) > limite) linhas.push([w]);
      else atual.push(w);
    }
    return linhas;
  };
  const base = guloso(largura);
  if (base.length < 2) return base;
  // equilibra: a menor largura que ainda dá o mesmo número de linhas
  let melhor = base;
  for (let l = largura - 20; l > largura * 0.5; l -= 20) {
    const tentativa = guloso(l);
    if (tentativa.length > base.length) break;
    melhor = tentativa;
  }
  return melhor;
};

// O maior corpo (entre `minimo` e `maximo`) em que o texto cabe em até `maxLinhas` linhas, sem
// nenhuma palavra maior que a largura. Nunca corta: no mínimo, quebra em mais linhas.
export const caber = (texto: string, largura: number, maximo: number, minimo: number, maxLinhas = 3, peso = 800) => {
  const ws = texto.split(/\s+/).filter(Boolean);
  for (let tamanho = maximo; tamanho >= minimo; tamanho -= 2) {
    const maior = Math.max(0, ...ws.map((w) => medir(w, tamanho, peso)));
    if (maior > largura) continue;
    const linhas = quebrarLinhas(texto, tamanho, largura, peso);
    if (linhas.length <= maxLinhas) return { tamanho, linhas };
  }
  // palavra comprida demais: o corpo desce até ela caber (sem passar de 0,75 do mínimo)
  let tamanho = minimo;
  while (tamanho > minimo * 0.75 && Math.max(0, ...ws.map((w) => medir(w, tamanho, peso))) > largura) tamanho -= 2;
  return { tamanho, linhas: quebrarLinhas(texto, tamanho, largura, peso) };
};

// Número com prefixo/sufixo em pt-BR: 83000 → "83.000"; 1.5 com casas 1 → "1,5"
export const numeroPtBr = (valor: number, casas = 0) => formatar(valor, casas);
