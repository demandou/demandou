// Texto de qualquer tamanho, de qualquer assunto: casar as palavras escritas com as faladas,
// montar o "cartaz" (linhas justificadas que ocupam a largura toda) e quebrar texto corrido.
// Tudo medido com as larguras reais da Sora (tema.ts), sem estimar por número de letras.
import type { Palavra } from "./plano";
import { caixaAlta, larguraEm, TRACKING } from "./tema";

// ——— Casar palavras escritas com palavras faladas ———

const normal = (w: string) =>
  w
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

const NUMERAIS: Record<string, string> = {
  um: "1", uma: "1", dois: "2", duas: "2", tres: "3", quatro: "4", cinco: "5", seis: "6", sete: "7", oito: "8", nove: "9",
  dez: "10", onze: "11", doze: "12", quinze: "15", vinte: "20", trinta: "30", quarenta: "40", cinquenta: "50", cem: "100",
  primeiro: "1", segundo: "2", terceiro: "3",
};

const distancia = (a: string, b: string) => {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};

// a palavra escrita `e` é a palavra falada `f`? (igual, plural, "pra"/"para", "1"/"um", "83"/"83 mil")
const casa = (e: string, f: string) => {
  const a = normal(e);
  const b = normal(f);
  if (!a || !b) return false;
  if (a === b) return true;
  if ((NUMERAIS[a] ?? a) === (NUMERAIS[b] ?? b)) return true;
  if (a.replace(/\D/g, "") && a.replace(/\D/g, "") === b.replace(/\D/g, "")) return true;
  const curta = Math.min(a.length, b.length);
  if (curta >= 4 && (a.startsWith(b) || b.startsWith(a)) && curta / Math.max(a.length, b.length) >= 0.6) return true;
  return curta >= 3 && distancia(a, b) <= 1;
};

// Tempo de cada palavra escrita: a partir de `inicio`, cada palavra escrita procura a sua palavra
// falada na ordem (pode pular palavras ditas: "Manda pra quem" casa com "Manda esse vídeo para quem").
// Palavras que não casam ficam entre as vizinhas. Nada antes de `inicio`; nada depois de `limite`.
export const alinhar = (texto: string, palavras: Palavra[], inicio: number, limite = Infinity): number[] => {
  const escritas = texto.trim().split(/\s+/).filter(Boolean);
  const ini = palavras.findIndex((p) => p.em >= inicio - 0.08);
  const faladas = ini < 0 ? [] : palavras.slice(ini).filter((p) => p.em < limite);
  if (faladas.length === 0) return escritas.map((_, k) => inicio + k * 0.14);

  const idx: (number | null)[] = [];
  let ptr = 0;
  for (const w of escritas) {
    // palavra curta ("de", "o") só casa logo ali; as de conteúdo podem pular mais
    const alcance = normal(w).length <= 2 ? 2 : 9;
    let achou: number | null = null;
    for (let j = ptr; j < Math.min(faladas.length, ptr + alcance); j++) {
      if (casa(w, faladas[j].w)) {
        achou = j;
        break;
      }
    }
    idx.push(achou);
    if (achou !== null) ptr = achou + 1;
  }

  // nenhuma casou (texto resumido com outras palavras): a k-ésima escrita na k-ésima falada
  if (idx.every((v) => v === null)) return escritas.map((_, k) => Math.max(inicio, faladas[Math.min(k, faladas.length - 1)].em + (k >= faladas.length ? (k - faladas.length + 1) * 0.14 : 0)));

  const tempos: number[] = escritas.map(() => NaN);
  idx.forEach((j, k) => {
    if (j !== null) tempos[k] = faladas[j].em;
  });
  // buracos: se o número de palavras faladas no meio bate, uma para uma; senão, distribui
  let k = 0;
  while (k < escritas.length) {
    if (!Number.isNaN(tempos[k])) {
      k++;
      continue;
    }
    let fim = k;
    while (fim < escritas.length && Number.isNaN(tempos[fim])) fim++;
    const antes = k > 0 ? idx[k - 1] : null;
    const depois = fim < escritas.length ? idx[fim] : null;
    const n = fim - k;
    if (antes !== null && depois !== null) {
      const meio = (depois as number) - (antes as number) - 1;
      for (let q = 0; q < n; q++) {
        if (meio === n) tempos[k + q] = faladas[(antes as number) + 1 + q].em;
        else {
          const a = faladas[antes as number].em;
          const b = faladas[depois as number].em;
          tempos[k + q] = a + ((b - a) * (q + 1)) / (n + 1);
        }
      }
    } else if (depois !== null) {
      // começo sem casar: as palavras faladas logo antes da primeira que casou
      for (let q = 0; q < n; q++) {
        const j = (depois as number) - n + q;
        tempos[k + q] = j >= 0 ? faladas[j].em : faladas[0].em;
      }
    } else if (antes !== null) {
      for (let q = 0; q < n; q++) {
        const j = (antes as number) + 1 + q;
        tempos[k + q] = j < faladas.length ? faladas[j].em : faladas[antes as number].em + (q + 1) * 0.14;
      }
    }
    k = fim;
  }
  // nunca antes de `inicio` e sempre em ordem
  let ultimo = inicio;
  return tempos.map((t) => {
    ultimo = Math.max(ultimo, Number.isFinite(t) ? t : ultimo);
    return ultimo;
  });
};

// Índices das palavras de `texto` que formam o trecho `trecho` (destaque, risco). Vazio se não achar.
export const palavrasDoTrecho = (texto: string, trecho?: string): Set<number> => {
  const res = new Set<number>();
  if (!trecho?.trim()) return res;
  const ws = texto.trim().split(/\s+/).map(normal);
  const alvo = trecho.trim().split(/\s+/).map(normal).filter(Boolean);
  if (!alvo.length) return res;
  for (let i = 0; i + alvo.length <= ws.length; i++) {
    if (alvo.every((a, k) => ws[i + k] === a)) {
      for (let k = 0; k < alvo.length; k++) res.add(i + k);
      return res;
    }
  }
  // sem a sequência exata: cada palavra do trecho que aparecer no texto
  ws.forEach((w, i) => {
    if (alvo.includes(w)) res.add(i);
  });
  return res;
};

// ——— O cartaz: linhas que ocupam a largura toda ———

export type LinhaCartaz = {
  // palavras da linha (já em caixa alta) e o índice de cada uma no texto inteiro
  palavras: string[];
  indices: number[];
  tamanho: number;
};

export const ALTURA_LINHA = 1.0;
export const VAO = 0.06;
const PEQUENAS = new Set([
  "A", "O", "E", "É", "AS", "OS", "DE", "DA", "DO", "DAS", "DOS", "EM", "NA", "NO", "NAS", "NOS", "UM", "UMA", "SE", "OU", "QUE",
  "POR", "PRA", "COM", "AO", "AOS", "À", "ÀS",
]);

// tamanho que faz a linha ocupar a largura toda (sem passar de `maximo`)
export const tamanhoDaLinha = (linha: string, largura: number, maximo: number) =>
  Math.min(maximo, Math.floor(largura / Math.max(0.5, larguraEm(linha, 800, TRACKING))));

// Quebra o texto em 1 a `maxLinhas` linhas de cartaz. Escolhe a quebra que deixa a menor linha o
// maior possível (as curtas ficam enormes, as longas menores), sem passar de `alturaMax`.
// Uma palavra pequena ("de", "a") nunca fica sozinha numa linha.
export const montarCartaz = (
  texto: string,
  largura: number,
  {
    maximo = 230,
    alturaMax = 820,
    maxLinhas = 6,
    compacto = false,
  }: {
    maximo?: number;
    alturaMax?: number;
    maxLinhas?: number;
    // item de lista: prefere menos linhas (o item lê como uma linha da ficha, não como cartaz)
    compacto?: boolean;
  } = {},
): { linhas: LinhaCartaz[]; altura: number } => {
  const ws = caixaAlta(texto.trim()).split(/\s+/).filter(Boolean);
  const n = ws.length;
  if (n === 0) return { linhas: [], altura: 0 };
  const tam = (a: number, b: number) => tamanhoDaLinha(ws.slice(a, b).join(" "), largura, maximo);
  const sozinhaFraca = (a: number, b: number) => b - a === 1 && n > 1 && PEQUENAS.has(ws[a]);

  let melhor: { linhas: LinhaCartaz[]; altura: number; nota: number } | null = null;
  for (let k = 1; k <= Math.min(maxLinhas, n); k++) {
    // programação dinâmica: melhor[i][j] = maior "menor tamanho" quebrando as i primeiras palavras em j linhas
    const nota: number[][] = Array.from({ length: n + 1 }, () => Array(k + 1).fill(-Infinity));
    const de: number[][] = Array.from({ length: n + 1 }, () => Array(k + 1).fill(-1));
    nota[0][0] = Infinity;
    for (let j = 1; j <= k; j++)
      for (let i = j; i <= n; i++)
        for (let a = j - 1; a < i; a++) {
          if (nota[a][j - 1] === -Infinity) continue;
          let s = tam(a, i);
          if (sozinhaFraca(a, i)) s *= 0.4;
          // linhas de mais de 3 palavras perdem o ar de cartaz
          if (i - a > 3) s *= 0.9;
          const v = Math.min(nota[a][j - 1], s);
          // desempate: linhas mais parelhas
          if (v > nota[i][j] + 0.01) {
            nota[i][j] = v;
            de[i][j] = a;
          }
        }
    if (nota[n][k] === -Infinity) continue;
    const cortes: [number, number][] = [];
    let i = n;
    for (let j = k; j >= 1; j--) {
      const a = de[i][j];
      cortes.unshift([a, i]);
      i = a;
    }
    let linhas: LinhaCartaz[] = cortes.map(([a, b]) => ({
      palavras: ws.slice(a, b),
      indices: Array.from({ length: b - a }, (_, q) => a + q),
      tamanho: tam(a, b),
    }));
    let altura = alturaDe(linhas);
    if (altura > alturaMax) {
      const f = alturaMax / altura;
      linhas = linhas.map((l) => ({ ...l, tamanho: Math.floor(l.tamanho * f) }));
      altura = alturaDe(linhas);
    }
    const menor = Math.min(...linhas.map((l) => l.tamanho));
    // com o teto de 2,2× a menor linha (o mesmo aplicado no fim)
    const media = linhas.reduce((soma, l) => soma + Math.min(l.tamanho, menor * 2.2), 0) / linhas.length;
    // nota: o menor corpo manda; o corpo médio desempata a favor do cartaz (palavras curtas enormes)
    const notaFinal = (compacto ? menor * (1 - 0.04 * (k - 1)) : menor + 0.25 * media) * (sozinhaFracaEm(linhas) ? 0.5 : 1);
    if (!melhor || notaFinal > melhor.nota) melhor = { linhas, altura, nota: notaFinal };
  }
  // nenhuma linha passa de 2,2× a menor: uma palavra longa ("posicionamento") não deixa as outras
  // gigantes ao lado dela pequena; o bloco fica parelho e legível
  const menor = Math.min(...melhor!.linhas.map((l) => l.tamanho));
  const linhas = melhor!.linhas.map((l) => ({ ...l, tamanho: Math.min(l.tamanho, Math.floor(menor * 2.2)) }));
  return { linhas, altura: alturaDe(linhas) };
};

const sozinhaFracaEm = (linhas: LinhaCartaz[]) => linhas.length > 1 && linhas.some((l) => l.palavras.length === 1 && PEQUENAS.has(l.palavras[0]));

export const alturaDe = (linhas: { tamanho: number }[]) =>
  linhas.reduce((s, l, i) => s + l.tamanho * ALTURA_LINHA + (i > 0 ? l.tamanho * VAO : 0), 0);

// Reduz um cartaz já montado para caber em `alturaMax` (tudo na mesma proporção).
export const reduzir = (linhas: LinhaCartaz[], alturaMax: number) => {
  const h = alturaDe(linhas);
  if (h <= alturaMax) return linhas;
  const f = alturaMax / h;
  return linhas.map((l) => ({ ...l, tamanho: Math.floor(l.tamanho * f) }));
};

// ——— Texto corrido (detalhes, opções, rótulos) ———

// Quebra em linhas que cabem em `largura` px no corpo `tamanho`. Palavra maior que a linha fica sozinha.
export const quebrar = (texto: string, largura: number, tamanho: number, peso: 700 | 800 = 700, espacamento = 0) => {
  const ws = texto.trim().split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";
  for (const w of ws) {
    const tentativa = atual ? `${atual} ${w}` : w;
    if (!atual || larguraEm(tentativa, peso, espacamento) * tamanho <= largura) atual = tentativa;
    else {
      linhas.push(atual);
      atual = w;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
};

// O maior corpo (de `max` até `min`) em que o texto cabe em até `maxLinhas` linhas. Se nem no mínimo
// cabe, fica no mínimo e quebra em mais linhas; uma palavra maior que a largura ganha corpo menor.
export const encaixar = (
  texto: string,
  { largura, max, min, maxLinhas = 2, peso = 700, espacamento = 0 }: { largura: number; max: number; min: number; maxLinhas?: number; peso?: 700 | 800; espacamento?: number },
) => {
  for (let t = max; t >= min; t -= 2) {
    const linhas = quebrar(texto, largura, t, peso, espacamento);
    if (linhas.length <= maxLinhas && linhas.every((l) => larguraEm(l, peso, espacamento) * t <= largura)) return { tamanho: t, linhas };
  }
  const linhas = quebrar(texto, largura, min, peso, espacamento);
  const maior = Math.max(...linhas.map((l) => larguraEm(l, peso, espacamento)));
  return { tamanho: Math.min(min, Math.floor(largura / Math.max(0.5, maior))), linhas };
};

// ——— Números em pt-BR ———

// 83000 → "83.000"; 1.5 com 1 casa → "1,5" (feito à mão: não depende do idioma do navegador)
export const formatarNumero = (v: number, casas = 0) => {
  const negativo = v < 0;
  const [inteiro, fracao] = Math.abs(v).toFixed(Math.max(0, casas)).split(".");
  const agrupado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negativo ? "−" : ""}${agrupado}${fracao ? `,${fracao}` : ""}`;
};

// Prefixo/sufixo de unidade: moeda vai antes ("R$", "US$", "€"), o resto depois ("%", "mil", "kg").
export const ehMoeda = (u?: string) => !!u && /^(R\$|US\$|U\$|\$|€|£|¥)$/.test(u.trim());
