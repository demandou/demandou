// A chamada do fechamento (player/cta): o texto falado embaixo do player, com o verbo num botão.
// Fica aqui (e não no componente) porque o tamanho dela decide o tamanho da capa do player.
import { ESPACO, medir } from "./medidas";
import type { Cta, Momento, Player } from "./plano";

export type Fechamento = Player | Cta;
export const ehFechamento = (m?: Momento): m is Fechamento => m?.tipo === "player" || m?.tipo === "cta";

// o texto da chamada: `texto` (cta) ou `chamada` (player, nome antigo)
export const textoDaChamada = (m: Fechamento) => (m.tipo === "cta" ? m.texto : (m.chamada ?? m.texto ?? "")) ?? "";

// A palavra do botão: `botao` do plano, senão o primeiro verbo de chamada conhecido, senão a primeira
const VERBOS =
  /^(segue|siga|seguir|salva|salve|salvar|comenta|comente|comentar|compartilha|compartilhe|manda|mande|ouve|ouça|ouca|escuta|escute|clica|clique|toca|toque|inscreve|inscreva|assina|assine|baixa|baixe|chama|chame|entra|entre|acessa|acesse|assiste|assista|garante|garanta|pega|pegue|vem|vai|aproveita|aproveite|agenda|agende|marca|marque|chama|fala|fale|responde|responda|escreve|escreva|testa|teste|confere|confira|baixa|cadastra|cadastre|participa|participe|reserva|reserve|compra|compre|leia|lê|le|olha|veja|vê|ve)$/i;
const limpa = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

// As peças da chamada: as palavras, com o botão como uma peça só (o `botao` pode ter mais de uma
// palavra: "Saiba Mais"). `origem[k]` = índice, no texto, da primeira palavra da peça k.
export const partesDaChamada = (m: Fechamento) => {
  const ws = textoDaChamada(m).split(/\s+/).filter(Boolean);
  let indice = -1;
  let n = 1;
  if (m.botao) {
    const alvo = m.botao.split(/\s+/).filter(Boolean).map(limpa);
    indice = ws.findIndex((_, i) => alvo.length > 0 && alvo.every((a, k) => limpa(ws[i + k] ?? "") === a));
    if (indice >= 0) n = alvo.length;
  }
  if (indice < 0) indice = ws.findIndex((w) => VERBOS.test(limpa(w)));
  if (indice < 0) indice = 0;
  const palavras = ws.length ? [...ws.slice(0, indice), ws.slice(indice, indice + n).join(" "), ...ws.slice(indice + n)] : [];
  const origem = palavras.map((_, k) => (k <= indice ? k : k + n - 1));
  return { palavras, antes: palavras.slice(0, indice), botao: palavras[indice], depois: palavras.slice(indice + 1), indice, origem };
};

// Tamanho do texto e do botão
export const ALTURA_BOTAO = 72;
export const PASSO_LINHA = 84;
const MAX = 58;
const MIN = 44;

// largura de cada "peça" da chamada (palavra ou botão) num corpo
const larguras = (m: Fechamento, tam: number) => {
  const { palavras, indice } = partesDaChamada(m);
  const icone = m.icone ? tam * 0.78 + 14 : 0;
  return palavras.map((w, i) => (i === indice ? medir(w, tam, 800) + 56 + icone : medir(w, tam, 800)));
};
// o vão entre duas peças vizinhas: maior ao lado do botão
const vaoEntre = (a: number, b: number, indice: number, tam: number) => (a === indice || b === indice ? tam * 0.3 : tam * ESPACO);

// Quebra em até `maxLinhas` linhas equilibradas (a mais larga o menor possível; nada de palavra
// sozinha na última linha), o botão como uma peça só.
const quebrarChamada = (m: Fechamento, tam: number, largura: number, maxLinhas: number) => {
  const { indice } = partesDaChamada(m);
  const ls = larguras(m, tam);
  const n = ls.length;
  const larguraDa = (de: number, ate: number) => {
    let soma = 0;
    for (let i = de; i < ate; i++) soma += ls[i] + (i > de ? vaoEntre(i - 1, i, indice, tam) : 0);
    return soma;
  };
  let melhor: number[][] = [Array.from({ length: n }, (_, i) => i)];
  let melhorMaior = larguraDa(0, n);
  const busca = (inicio: number, resto: number, atual: number[][]) => {
    if (resto === 1) {
      const linhas = [...atual, Array.from({ length: n - inicio }, (_, k) => inicio + k)];
      const maior = Math.max(...linhas.map((l) => larguraDa(l[0], l[l.length - 1] + 1)));
      if (maior < melhorMaior - 0.5) {
        melhorMaior = maior;
        melhor = linhas;
      }
      return;
    }
    for (let k = inicio + 1; k <= n - resto + 1; k++) busca(k, resto - 1, [...atual, Array.from({ length: k - inicio }, (_, j) => inicio + j)]);
  };
  for (let linhas = 2; linhas <= Math.min(maxLinhas, n); linhas++) {
    if (melhorMaior <= largura) break;
    busca(0, linhas, []);
  }
  return { linhas: melhor, cabe: melhorMaior <= largura };
};

// Quebra a chamada em até 3 linhas (de 58 a 44 px), o botão no meio do texto como uma palavra.
// Devolve as linhas como listas de índices de palavras.
export const diagramarChamada = (m: Fechamento, largura: number) => {
  const { palavras } = partesDaChamada(m);
  if (!palavras.length) return { linhas: [] as number[][], tam: MAX };
  // uma linha só se ela couber grande (≥ 52 px); senão, duas ou três linhas no maior corpo
  for (const n of [1, 2, 3]) {
    for (let tam = MAX; tam >= (n === 1 ? 52 : MIN); tam -= 2) {
      const r = quebrarChamada(m, tam, largura, n);
      if (r.cabe) return { linhas: r.linhas, tam };
    }
  }
  // texto muito longo: 3 linhas no menor corpo (a última pode passar; encurte a chamada)
  return { linhas: quebrarChamada(m, MIN, largura, 3).linhas, tam: MIN };
};
