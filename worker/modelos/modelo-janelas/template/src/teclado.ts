// Medidas das teclas (usadas pelo componente e pela escolha do lugar da pessoa).
// Teclas de verdade têm as larguras de um teclado; uma palavra qualquer ("Mercado", "Sem critério")
// ganha a largura do próprio nome (o nome usa 0,4 da altura da tecla, em fonte mono).
export const unidades = (k: string) => {
  const n = k.trim().toLowerCase();
  if ([...n].length <= 1) return 1;
  if (/^(espaço|espaco|space)$/.test(n)) return 2.8;
  if (/^(shift|enter|return|backspace|apagar)$/.test(n)) return 1.95;
  if ([...n].length <= 4) return 1.5;
  return Math.max(1.75, 0.24 * [...n].length + 0.58);
};

// Uma tecla de verdade (Ctrl, Shift, uma letra…), e não uma palavra qualquer
export const teclaDeVerdade = (k: string) =>
  [...k.trim()].length <= 1 || /^(ctrl|control|shift|alt|option|cmd|command|win|windows|tab|enter|return|esc|espaço|espaco|space|fn|del|backspace|apagar|home|end)$/i.test(k.trim());

// Palavras compridas (3 ou mais teclas que ficariam pequenas numa fila só) quebram em duas filas
export const somaDaFila = (ks: string[]) => ks.reduce((s, k) => s + unidades(k), 0) + 0.42 * Math.max(0, ks.length - 1);
export const duasFilas = (ks: string[], largura = 1000, u = 166) => ks.length >= 3 && Math.min(u, largura / Math.max(1, somaDaFila(ks))) < 105;
