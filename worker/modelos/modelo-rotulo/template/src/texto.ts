// Quebra e encaixe de texto, medindo com a fonte de verdade.
import type { Fonte, Medidor } from "./medida";

// Largura de uma linha como a Escrita desenha: palavras separadas por margem fixa (0,26 do corpo),
// com 3% de folga (algarismos alinhados e itálico saem um pouco mais largos que a medida).
export const larguraDaLinha = (linha: string, medir: Medidor, fonte: Fonte) => {
  const ws = linha.split(/\s+/).filter(Boolean);
  return (ws.reduce((s, w) => s + medir(w, fonte), 0) + Math.max(0, ws.length - 1) * fonte.tamanho * 0.26) * 1.03;
};

// Quebra `frase` em linhas que caibam em `largura` (sem partir palavra).
export const quebrar = (frase: string, largura: number, medir: Medidor, fonte: Fonte): string[] => {
  const palavras = frase.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";
  for (const w of palavras) {
    const tentativa = atual ? `${atual} ${w}` : w;
    if (atual && larguraDaLinha(tentativa, medir, fonte) > largura) {
      linhas.push(atual);
      atual = w;
    } else atual = tentativa;
  }
  if (atual) linhas.push(atual);
  // palavra curta ("o", "de", "um"…) não fica pendurada no fim da linha: desce para a próxima
  // (várias seguidas descem juntas: "e pensar no seu | posicionamento" vira "e pensar | no seu posicionamento")
  for (let i = 0; i < linhas.length - 1; i++) {
    const ws = linhas[i].split(" ");
    const desce: string[] = [];
    // número também desce junto com o que vem depois ("10 | segundos")
    while (ws.length > 1 && (CURTAS.has(ws[ws.length - 1].toLowerCase()) || /^\d+([.,]\d+)?%?$/.test(ws[ws.length - 1]))) desce.unshift(ws.pop() as string);
    if (desce.length) {
      linhas[i] = ws.join(" ");
      linhas[i + 1] = `${desce.join(" ")} ${linhas[i + 1]}`;
    }
  }
  return linhas;
};

const CURTAS = new Set("a o as os e é um uma de do da dos das em no na nos nas ao à que se com por pra pro para sem sua seu ou".split(" "));

// Maior tamanho (entre `min` e `max`) em que todas as linhas cabem em `largura`.
export const tamanhoQueCabe = (linhas: string[], largura: number, medir: Medidor, fonte: Omit<Fonte, "tamanho">, max: number, min: number) => {
  let tam = max;
  while (tam > min && linhas.some((l) => larguraDaLinha(l, medir, { ...fonte, tamanho: tam }) > largura)) tam -= 2;
  return tam;
};

// A melhor quebra em exatamente `k` linhas que cabem em `largura`: linhas de larguras parecidas, sem
// linha terminando em palavra curta ("de", "para", "o"…) e sem palavra curta sozinha numa linha.
// Devolve null se não houver quebra em `k` linhas que caiba.
type Quebra = { linhas: string[]; limpa: boolean };
const melhorQuebra = (ws: string[], k: number, largura: number, medir: Medidor, fonte: Fonte): Quebra | null => {
  const n = ws.length;
  if (k < 1 || k > n) return null;
  const lw = ws.map((w) => medir(w, fonte));
  const gap = fonte.tamanho * 0.26;
  // largura da linha com as palavras [a, b)
  const larg = (a: number, b: number) => {
    let soma = 0;
    for (let i = a; i < b; i++) soma += lw[i];
    return (soma + Math.max(0, b - a - 1) * gap) * 1.03;
  };
  if (k === 1) return larg(0, n) <= largura ? { linhas: [ws.join(" ")], limpa: true } : null;
  if (n > 26) return null;
  let melhor: number[] | null = null;
  let custo = Infinity;
  const cortes: number[] = [];
  const multa = largura * largura;
  const visitar = (inicio: number, resta: number) => {
    if (resta === 1) {
      if (larg(inicio, n) > largura) return;
      const limites = [0, ...cortes, n];
      const larguras: number[] = [];
      let c = 0;
      for (let i = 0; i < limites.length - 1; i++) {
        const a = limites[i];
        const b = limites[i + 1];
        larguras.push(larg(a, b));
        const ultima = ws[b - 1].toLowerCase();
        if (i < limites.length - 2 && b - a > 1 && (CURTAS.has(ultima) || /^\d+([.,]\d+)?%?$/.test(ultima))) c += multa;
        if (b - a === 1 && ws[a].length <= 3) c += multa;
      }
      const media = larguras.reduce((x, y) => x + y, 0) / larguras.length;
      c += larguras.reduce((x, w) => x + (w - media) * (w - media), 0);
      // a última linha um pouco menor que as outras fica natural; maior, não
      if (larguras[larguras.length - 1] > media * 1.15) c += (larguras[larguras.length - 1] - media) ** 2;
      if (c < custo) {
        custo = c;
        melhor = [...cortes];
      }
      return;
    }
    for (let fim = inicio + 1; fim <= n - (resta - 1); fim++) {
      if (larg(inicio, fim) > largura) break;
      cortes.push(fim);
      visitar(fim, resta - 1);
      cortes.pop();
    }
  };
  visitar(0, k);
  if (!melhor) return null;
  const limites = [0, ...(melhor as number[]), n];
  return { linhas: limites.slice(0, -1).map((a, i) => ws.slice(a, limites[i + 1]).join(" ")), limpa: custo < multa };
};

// Quebra e encolhe: o maior tamanho (entre `max` e `min`) em que o texto cabe em até `maxLinhas`,
// com o menor número de linhas possível e as linhas equilibradas. Se um tamanho até ~12% menor tira
// uma linha, fica com ele (o bloco fica mais limpo).
export const encaixar = (frase: string, largura: number, medir: Medidor, fonte: Omit<Fonte, "tamanho">, max: number, min: number, maxLinhas: number) => {
  const ws = frase.split(/\s+/).filter(Boolean);
  // a quebra limpa com menos linhas nesse tamanho (ou, se não houver limpa, a melhor possível)
  const tentar = (tam: number): Quebra | null => {
    let suja: Quebra | null = null;
    for (let k = 1; k <= maxLinhas; k++) {
      const q = melhorQuebra(ws, k, largura, medir, { ...fonte, tamanho: tam });
      if (q?.limpa) return q;
      if (q && !suja) suja = q;
    }
    return suja;
  };
  for (let tam = max; tam >= min; tam -= 2) {
    const primeira = tentar(tam);
    if (!primeira) continue;
    let linhas = primeira.linhas;
    let escolhido = tam;
    // sem quebra limpa aqui: um tamanho até ~22% menor com quebra limpa é melhor
    if (!primeira.limpa) {
      for (let t2 = tam - 2; t2 >= Math.max(min, tam * 0.78); t2 -= 2) {
        const q = tentar(t2);
        if (q?.limpa) {
          linhas = q.linhas;
          escolhido = t2;
          break;
        }
      }
    }
    for (let t2 = escolhido - 2; t2 >= Math.max(min, escolhido * 0.88) && linhas.length > 1; t2 -= 2) {
      const menos = tentar(t2);
      if (menos?.limpa && menos.linhas.length < linhas.length) {
        linhas = menos.linhas;
        escolhido = t2;
        break;
      }
    }
    return { linhas, tamanho: escolhido };
  }
  return { linhas: quebrar(frase, largura, medir, { ...fonte, tamanho: min }), tamanho: min };
};

// Mantém as quebras escritas no plano quando cabem; senão, quebra o texto de novo (até `maxLinhas`).
export const linhasQueCabem = (
  linhas: string[],
  largura: number,
  medir: Medidor,
  fonte: Omit<Fonte, "tamanho">,
  max: number,
  min: number,
  maxLinhas: number,
) => {
  const tam = tamanhoQueCabe(linhas, largura, medir, fonte, max, min);
  if (linhas.every((l) => larguraDaLinha(l, medir, { ...fonte, tamanho: tam }) <= largura)) return { linhas, tamanho: tam };
  return encaixar(linhas.join(" "), largura, medir, fonte, max, min, maxLinhas);
};
