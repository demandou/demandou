import { numerosSemLastro, type PalavraDoPlano } from "@/lib/media/editor-do-curso/escrever-plano";

/**
 * OS ARQUIVOS DA CENA (editor avançado, 10/10/2026): o Claude devolve o
 * roteiro e as cenas em blocos de texto, não em JSON (código dentro de string
 * JSON quebra em aspas e barras). Aqui ficam a leitura desses blocos e a
 * GUARDA DE NÚMERO sobre o texto que aparece na tela. Puro (testado).
 *
 * Formato pedido ao modelo:
 *   === arquivo: roteiro.json ===
 *   { ... }
 *   === arquivo: cena-01.tsx ===
 *   ...
 *   === fim ===
 */
export const NOME_VALIDO = /^(roteiro\.json|comum\.tsx|cena-\d{2}\.tsx)$/;

export function lerArquivosDaResposta(texto: string): Record<string, string> {
  const saida: Record<string, string> = {};
  const re = /^===\s*arquivo:\s*([^\s=]+)\s*===\s*$/gm;
  const marcas = [...texto.matchAll(re)];
  marcas.forEach((m, i) => {
    const nome = m[1].trim();
    const inicio = (m.index ?? 0) + m[0].length;
    const proxima = marcas[i + 1]?.index ?? texto.length;
    let fim = proxima;
    const fecho = texto.slice(inicio, proxima).search(/^===\s*fim\s*===\s*$/m);
    if (fecho >= 0) fim = inicio + fecho;
    let corpo = texto.slice(inicio, fim).replace(/^\s*\n/, "").replace(/\s+$/, "");
    // cerca de código em volta do arquivo (o modelo às vezes põe)
    corpo = corpo.replace(/^```[a-zA-Z]*\s*\n/, "").replace(/\n```\s*$/, "");
    if (NOME_VALIDO.test(nome) && corpo.trim()) saida[nome] = `${corpo}\n`;
  });
  return saida;
}

/** O código sem comentários (para não ler texto de comentário como texto de tela). */
function semComentarios(codigo: string): string {
  let s = "";
  let i = 0;
  let aspa: string | null = null;
  while (i < codigo.length) {
    const c = codigo[i];
    if (aspa) {
      s += c;
      if (c === "\\") {
        s += codigo[i + 1] ?? "";
        i += 2;
        continue;
      }
      if (c === aspa) aspa = null;
      i++;
    } else if (c === "/" && codigo[i + 1] === "/") {
      while (i < codigo.length && codigo[i] !== "\n") i++;
    } else if (c === "/" && codigo[i + 1] === "*") {
      const fim = codigo.indexOf("*/", i + 2);
      i = fim < 0 ? codigo.length : fim + 2;
    } else {
      if (c === '"' || c === "'" || c === "`") aspa = c;
      s += c;
      i++;
    }
  }
  return s;
}

const TECNICO = [
  /^(#|rgba?\(|hsla?\(|url\(|linear-gradient|radial-gradient|path\(|polygon\(|inset\(|blur\(|perspective\(|drop-shadow)/i,
  /\b\d+(\.\d+)?(px|%|em|rem|deg|ms|s|vh|vw|fr)\b/,
  /^[MLHVCSQTAZmlhvcsqtaz0-9.,\s-]+$/,
  /^(\.\.?\/|@?[a-z0-9-]+\/[a-z0-9/-]+$|react$|remotion$|three$)/,
];

/**
 * O texto que pode aparecer na tela: as strings que têm letra e não são
 * técnicas (cor, medida, caminho SVG, import) e o texto solto do JSX.
 */
export function textosNaTela(codigo: string): string[] {
  const limpo = semComentarios(codigo);
  const textos: string[] = [];
  for (const m of limpo.matchAll(/(["'])((?:(?!\1)[^\\\n]|\\.)*)\1|`([^`]*)`/g)) {
    const valor = (m[2] ?? m[3] ?? "").replace(/\$\{[^}]*\}/g, " ");
    if (!/[A-Za-zÀ-ú0-9]/.test(valor)) continue;
    if (TECNICO.some((re) => re.test(valor.trim()))) continue;
    textos.push(valor);
  }
  // texto solto do JSX: depois de uma tag que abre ou fecha, até a próxima
  for (const m of limpo.matchAll(/<\/?[A-Za-z][\w.]*(?:\s[^<>]*?)?>([^<>{}]+)(?=<)/g)) {
    const valor = m[1].trim();
    // texto de JSX não tem cara de código (o que sobra entre duas tags de linhas diferentes)
    if (valor && /[A-Za-zÀ-ú0-9]/.test(valor) && !/[;=()]|\bconst\b|\breturn\b/.test(valor)) textos.push(valor);
  }
  return textos;
}

/**
 * A GUARDA DE NÚMERO sobre o código da cena: todo número da tela precisa ter
 * sido dito (a mesma regra e a mesma conta do editor do curso, numerosSemLastro).
 */
export function numerosSemLastroNaCena(arquivos: Record<string, string>, palavras: PalavraDoPlano[]): string[] {
  const textos: string[] = [];
  for (const [nome, codigo] of Object.entries(arquivos)) {
    if (nome.endsWith(".tsx")) textos.push(...textosNaTela(codigo));
  }
  return numerosSemLastro({ momentos: [{ tipo: "cena", texto: textos.join(" | ") }] }, palavras);
}

/** A fala no formato da guarda ({em, ate, w}) a partir da fala do corte ({de, ate, w}). */
export function falaParaAGuarda(fala: Array<{ de: number; ate: number; w: string }>): PalavraDoPlano[] {
  return fala.map((p) => ({ em: p.de, ate: p.ate, w: p.w }));
}
