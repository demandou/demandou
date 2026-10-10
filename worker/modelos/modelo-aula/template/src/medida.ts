// Medir e encaixar texto: qualquer texto que o plano mandar cabe na caixa dele.
// Mede com as larguras reais da Plus Jakarta Sans (larguras.ts), quebra em linhas e reduz o corpo
// até um mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
import { CARACTERES, PJS_600, PJS_700, PJS_800 } from "./larguras";

export type Peso = 500 | 600 | 700 | 800;
// `exato`: sem a folga de 3% (para posicionar palavra por palavra; a folga é só para caber)
export type Fonte = { peso?: Peso; espacamento?: number; caixaAlta?: boolean; exato?: boolean };

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
// a Plus Jakarta 500 mede quase igual à 600 (usa a tabela da 600)
const tabela = (peso: Peso = 700) => (peso >= 800 ? PJS_800 : peso >= 700 ? PJS_700 : PJS_600);

// Largura do texto em px num corpo `tamanho`.
export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = {}) => {
  const t = fonte.caixaAlta ? texto.toUpperCase() : texto;
  const letras = [...t];
  const tab = tabela(fonte.peso);
  let soma = 0;
  for (const c of letras) {
    const i = indice.get(c);
    soma += i === undefined ? 640 : tab[i];
  }
  // 3% de folga: o navegador arredonda e aplica kerning
  return ((soma / 1000) * tamanho + (fonte.espacamento ?? 0) * tamanho * Math.max(0, letras.length - 1)) * (fonte.exato ? 1 : 1.03);
};

// Quebra em linhas que cabem em `largura` (palavra por palavra). Palavra maior que a linha fica sozinha.
export const quebrarLinhas = (texto: string, largura: number, tamanho: number, fonte: Fonte = {}) => {
  // o símbolo da moeda nunca fica sozinho no fim da linha ("R$ 1.127" anda junto)
  const palavras = texto
    .split(/\s+/)
    .filter(Boolean)
    .reduce<string[]>((a, w) => {
      const u = a[a.length - 1];
      if (u && /^(R\$|US\$|€|£|\$)$/.test(u)) a[a.length - 1] = `${u} ${w}`;
      else a.push(w);
      return a;
    }, []);
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const tentativa = atual ? `${atual} ${p}` : p;
    if (!atual || larguraTexto(tentativa, tamanho, fonte) <= largura) atual = tentativa;
    else {
      linhas.push(atual);
      atual = p;
    }
  }
  if (atual) linhas.push(atual);
  // não deixa uma palavra sozinha no fim se der para equilibrar com a linha anterior
  if (linhas.length >= 2) {
    const ultima = linhas[linhas.length - 1];
    const penultima = linhas[linhas.length - 2].split(" ");
    if (!ultima.includes(" ") && penultima.length > 2) {
      const moveu = `${penultima[penultima.length - 1]} ${ultima}`;
      if (larguraTexto(moveu, tamanho, fonte) <= largura) {
        linhas[linhas.length - 2] = penultima.slice(0, -1).join(" ");
        linhas[linhas.length - 1] = moveu;
      }
    }
  }
  return linhas;
};

// Maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em `linhas` linhas.
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = {} }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte },
) => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  const melhorEm = (k: number) => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const quebra = quebrarLinhas(limpo, largura, tamanho, fonte);
      if (quebra.length <= k && quebra.every((l) => larguraTexto(l, tamanho, fonte) <= largura)) return { tamanho, linhas: quebra };
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    // menos linhas vale a pena se custar pouco corpo (até ~15% menor)
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.tamanho >= melhor.tamanho * 0.85) return menos;
    }
    return melhor;
  }
  // palavra única enorme: reduz até caber na largura
  let tamanho = min;
  const maiorPalavra = limpo.split(" ").reduce((a, b) => (larguraTexto(b, 1, fonte) > larguraTexto(a, 1, fonte) ? b : a), "");
  while (tamanho > 22 && larguraTexto(maiorPalavra, tamanho, fonte) > largura) tamanho -= 2;
  return { tamanho, linhas: quebrarLinhas(limpo, largura, tamanho, fonte) };
};

// ——— palavras do texto × palavras ditas ———

export const nucleo = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^[^\p{L}\p{N}$%]+|[^\p{L}\p{N}%]+$/gu, "");

// Índices (na lista de palavras de `texto`) do trecho `alvo`, ou null se não achar.
export const trechoNoTexto = (texto: string, alvo?: string): [number, number] | null => {
  if (!alvo?.trim()) return null;
  const ws = texto.split(/\s+/).filter(Boolean).map(nucleo);
  const as = alvo.split(/\s+/).filter(Boolean).map(nucleo);
  for (let i = 0; i + as.length <= ws.length; i++) {
    if (as.every((a, k) => ws[i + k] === a)) return [i, i + as.length - 1];
  }
  return null;
};

// Para cada palavra de `texto`, o instante em que ela é dita: procura, em ordem, a mesma palavra
// na fala a partir de `inicio`. Palavra que não foi dita igual (sinônimo, número escrito) herda o
// tempo da anterior. Assim o título se monta no ritmo da fala, mesmo resumido.
export const temposDasPalavras = (texto: string, palavras: { em: number; w: string }[], inicio: number, fim: number) => {
  const ws = texto.split(/\s+/).filter(Boolean);
  const fala = palavras.filter((p) => p.em >= inicio - 0.05 && p.em < fim);
  let cursor = 0;
  let ultimo = inicio;
  return ws.map((w, i) => {
    const alvo = nucleo(w);
    for (let k = cursor; k < Math.min(fala.length, cursor + 6); k++) {
      if (nucleo(fala[k].w) === alvo) {
        cursor = k + 1;
        ultimo = Math.max(ultimo, fala[k].em);
        return ultimo;
      }
    }
    // a primeira palavra entra no começo; as outras não encontradas, logo depois da anterior
    if (i > 0) ultimo += 0.06;
    return ultimo;
  });
};
