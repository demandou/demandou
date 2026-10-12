// Números em pt-BR (83.000; 1,5) e a escala "redonda" de um mostrador para um valor dito.
export const formatar = (n: number, casas = 0) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

// rótulo curto da escala: 100.000 → "100 mil", 2.500.000 → "2,5 mi"
export const curto = (n: number) => {
  const a = Math.abs(n);
  const limpo = (v: number) => formatar(v, Number.isInteger(Math.round(v * 10) / 10) && Math.round(v * 10) % 10 === 0 ? 0 : 1);
  if (a >= 1e9) return `${limpo(n / 1e9)} bi`;
  if (a >= 1e6) return `${limpo(n / 1e6)} mi`;
  if (a >= 1e4) return `${limpo(n / 1e3)} mil`;
  return formatar(n, Number.isInteger(n) ? 0 : 1);
};

// o menor fim de escala "redondo" acima do valor (com folga), para o ponteiro não bater no fim
export const fimDaEscala = (valor: number, sufixo?: string) => {
  const v = Math.abs(valor);
  if (sufixo?.trim() === "%" && v <= 100) return 100;
  if (v <= 0) return 10;
  const base = Math.pow(10, Math.floor(Math.log10(v * 1.08)));
  for (const k of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (k * base >= v * 1.08) return k * base;
  return 10 * base;
};
