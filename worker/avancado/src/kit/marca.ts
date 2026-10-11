import { DADOS } from "./dados";

/**
 * AS CORES DA MARCA (regra do Bruno, 10/10: "o estilo é do modelo, a cor é da
 * marca"). Só três cores entram: fundo, título e destaque, os papéis da
 * identidade aprovada do projeto. Os tons de apoio (painel, linha, sombra)
 * saem só da MISTURA delas entre si e com preto, para nunca aparecer um matiz
 * que não é da marca. A cena nunca escreve cor em hexadecimal: usa MARCA.
 */

function rgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [0, 0, 0];
}

function hex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
}

/** Mistura duas cores (0 = a, 1 = b). */
export function misturar(a: string, b: string, p: number): string {
  const x = rgb(a);
  const y = rgb(b);
  return hex([x[0] + (y[0] - x[0]) * p, x[1] + (y[1] - x[1]) * p, x[2] + (y[2] - x[2]) * p]);
}

/** A cor com transparência, em rgba(). */
export function comAlfa(cor: string, a: number): string {
  const [r, g, b] = rgb(cor);
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, a))})`;
}

/** Luminância relativa (0 escuro, 1 claro). */
export function luminancia(cor: string): number {
  const c = rgb(cor).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

const { fundo, titulo, destaque } = DADOS.cores;

/** Contraste entre duas cores (1 a 21), pela luminância relativa. */
export function contraste(a: string, b: string): number {
  const x = luminancia(a);
  const y = luminancia(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/**
 * O destaque que dá para LER sobre o fundo (11/10, teste de ponta a ponta da
 * Maquete 3D: o vermelho-escuro da marca na legenda sobre o preto sumia). O mesmo
 * matiz, puxado para o título só o quanto falta para 4,5:1; se a cor já lê, fica.
 */
export function legivelSobre(cor: string, base: string, alvo = 4.5, rumo = titulo): string {
  if (contraste(cor, base) >= alvo) return cor;
  for (let p = 0.05; p <= 1; p += 0.05) {
    const c = misturar(cor, rumo, p);
    if (contraste(c, base) >= alvo) return c;
  }
  return rumo;
}
const escuro = luminancia(fundo) < 0.35;

export const MARCA = {
  /** O fundo da marca. */
  fundo,
  /** A cor do texto e das superfícies claras (alto contraste com o fundo). */
  titulo,
  /** O destaque: a palavra dita, o detalhe, a linha de chamada. Pouco e com função. */
  destaque,
  /** O destaque em TEXTO (legenda, rótulo, palavra-chave): o mesmo matiz com contraste de leitura sobre o fundo. */
  destaqueTexto: legivelSobre(destaque, fundo),
  /** O fundo é escuro? (decide sombra e brilho). */
  escuro,
  /** Painéis e cartões: o fundo puxado um pouco para o título. */
  painel: misturar(fundo, titulo, 0.07),
  painelClaro: misturar(fundo, titulo, 0.13),
  /** O fundo mais fundo (vinheta, borda do estúdio). */
  fundoProfundo: escuro ? misturar(fundo, "#000000", 0.35) : misturar(fundo, titulo, 0.05),
  /** Texto de apoio, menos forte que o título. */
  apoio: misturar(titulo, fundo, 0.32),
  linha: comAlfa(titulo, 0.16),
  linhaForte: comAlfa(titulo, 0.55),
  sombra: escuro ? "rgba(0, 0, 0, 0.55)" : comAlfa(misturar(fundo, "#000000", 0.6), 0.35),
} as const;
