// Onde cada bloco da página limpa fica (unidades de 390 de largura), a partir do texto do plano.
import { PG } from "./cena";
import type { Pagina } from "./plano";

// quebra gulosa por número de caracteres (estimativa conservadora da largura da fonte)
export const quebrar = (texto: string, porLinha: number) => {
  const linhas: string[] = [];
  let atual = "";
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const tentativa = atual ? `${atual} ${w}` : w;
    if (tentativa.length > porLinha && atual) {
      linhas.push(atual);
      atual = w;
    } else atual = tentativa;
  }
  if (atual) linhas.push(atual);
  return linhas;
};

export type LayoutLimpo = {
  promessa: { linhas: string[]; tamanho: number; entrelinha: number; y: number; h: number };
  botao: { y: number; h: number };
  imagem: { y: number; h: number };
  apoio: { y: number };
  // medidas de espaçamento (px da página)
  vao1: number;
  vao2: number;
};

const LARGURA_TEXTO = 390 - 2 * PG.margem;

export const layoutLimpo = (pagina: Required<Pagina>): LayoutLimpo => {
  // Young Serif é larga: ~0,6 da altura por caractere
  let tamanho = 40;
  let linhas = quebrar(pagina.promessa, Math.floor(LARGURA_TEXTO / (tamanho * 0.6)));
  while (linhas.length > 3 && tamanho > 30) {
    tamanho -= 2;
    linhas = quebrar(pagina.promessa, Math.floor(LARGURA_TEXTO / (tamanho * 0.6)));
  }
  const entrelinha = Math.round(tamanho * 1.12);
  const y = PG.promessa.y;
  const h = linhas.length * entrelinha;
  const vao1 = 24;
  const vao2 = 32;
  const botao = { y: y + h + vao1, h: PG.vaga.h };
  const imagemY = botao.y + botao.h + vao2;
  const imagemH = Math.max(220, Math.min(300, 690 - imagemY));
  return {
    promessa: { linhas, tamanho, entrelinha, y, h },
    botao,
    imagem: { y: imagemY, h: imagemH },
    apoio: { y: imagemY + imagemH + 24 },
    vao1,
    vao2,
  };
};
