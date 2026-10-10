// Números como aparecem na tela ("5%", "R$ 105", "10,5%", "R$ 1.412", "3 milhões"):
// separa prefixo, número e sufixo para contar e rolar sem perder o formato brasileiro.

export type Valor = { prefixo: string; numero: number; decimais: number; milhar: boolean; sufixo: string };

export const lerValor = (texto: string): Valor | null => {
  const m = texto.match(/^(.*?)(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?(.*)$/);
  if (!m) return null;
  const [, prefixo, inteiro, frac, sufixo] = m;
  const numero = Number(inteiro.replace(/\./g, "")) + (frac ? Number(`0.${frac}`) : 0);
  return { prefixo, numero, decimais: frac?.length ?? 0, milhar: inteiro.includes("."), sufixo };
};

export const escreverValor = (v: Valor, n: number) => {
  const fixo = n.toFixed(v.decimais);
  const [int, dec] = fixo.split(".");
  const inteiro = v.milhar || Math.abs(n) >= 10000 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : int;
  return `${v.prefixo}${inteiro}${dec ? `,${dec}` : ""}${v.sufixo}`;
};

// O texto de um valor contando de 0 até ele (p de 0 a 1)
export const contando = (texto: string, p: number) => {
  const v = lerValor(texto);
  if (!v) return texto;
  if (p >= 1) return texto;
  return escreverValor(v, v.numero * p);
};

// Um número do bloco `numero` escrito no formato brasileiro: 83000 → "83.000"; 1.5 → "1,5";
// prefixo "US$" → "US$ 83.000"; sufixo "%" → "5%"; sufixo "mil" → "83 mil". Anos (1900–2100, sem
// prefixo nem sufixo) ficam sem ponto: "2026".
export const numeroBr = (n: number, casas = 0, semMilhar = false) => {
  const fixo = Math.abs(n).toFixed(Math.max(0, casas));
  const [int, dec] = fixo.split(".");
  const inteiro = semMilhar ? int : int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${n < 0 ? "−" : ""}${inteiro}${dec ? `,${dec}` : ""}`;
};

export const comPrefixo = (prefixo?: string) => (prefixo ? (/[\p{L}$€£¥]$/u.test(prefixo) ? `${prefixo} ` : prefixo) : "");
export const comSufixo = (sufixo?: string) => (sufixo ? (/^[\p{L}]/u.test(sufixo) ? ` ${sufixo}` : sufixo) : "");

export const escreverNumero = (valor: number, { prefixo, sufixo, casas }: { prefixo?: string; sufixo?: string; casas?: number }, atual = valor) => {
  const ano = !prefixo && !sufixo && !casas && Number.isInteger(valor) && valor >= 1900 && valor <= 2100;
  const c = casas ?? (Number.isInteger(valor) ? 0 : Math.min(2, (String(valor).split(".")[1] ?? "").length));
  return `${comPrefixo(prefixo)}${numeroBr(atual, c, ano)}${comSufixo(sufixo)}`;
};
