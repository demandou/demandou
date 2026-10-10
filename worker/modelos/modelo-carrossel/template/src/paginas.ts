// A gramática do Carrossel: o vídeo é um trilho de páginas que desliza na horizontal.
// - Cada momento de conteúdo (troca, lista, calendario) é uma página própria.
// - Os momentos da pessoa (capa, frase, cta) e os trechos sem momento são páginas da pessoa;
//   trechos da pessoa colados viram uma página só (o cartão troca, a página fica).
// - Toda troca de página é um deslize da direita para a esquerda, casado com o corte mais próximo.
import type { Caixa } from "./motor/caixa";
import { deslize } from "./anim";
import type { Momento, Plano } from "./plano";
import { H, MARGEM, TOPO, VAO, W } from "./tema";

export type TipoPagina = "pessoa" | "conteudo";
// onde a pessoa fica dentro da página
export type LugarPessoa = "cheia" | "avatar" | "cartao";

export type Pagina = {
  indice: number;
  de: number;
  ate: number;
  tipo: TipoPagina;
  pessoa: LugarPessoa;
  momentos: Momento[];
};

// Páginas de conteúdo (slides desenhados). O resto (abertura, capa, numero, destaque, frase,
// pergunta, cta) é página da pessoa, com o cartão na altura do peito.
export const TIPOS_DE_CONTEUDO = ["troca", "lista", "calendario", "topicos", "passos", "comparacao", "grafico", "definicao"] as const;

export const tipoDoMomento = (m: Momento): TipoPagina => ((TIPOS_DE_CONTEUDO as readonly string[]).includes(m.tipo) ? "conteudo" : "pessoa");

export const lugarDaPessoa = (m: Momento | undefined): LugarPessoa =>
  !m || tipoDoMomento(m) === "pessoa" ? "cheia" : m.tipo === "calendario" ? "cartao" : "avatar";

// trecho sem momento mais curto que isto não vira página: fica com a página vizinha
const LACUNA = 0.4;

export const montarPaginas = (plano: Plano): Pagina[] => {
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  type Trecho = { de: number; ate: number; tipo: TipoPagina; momentos: Momento[] };
  const trechos: Trecho[] = [];
  let cursor = 0;
  for (const m of momentos) {
    const de = Math.max(cursor, m.de);
    if (de - cursor > LACUNA) trechos.push({ de: cursor, ate: de, tipo: "pessoa", momentos: [] });
    else if (trechos.length) trechos[trechos.length - 1].ate = de;
    trechos.push({ de: trechos.length ? de : 0, ate: Math.max(de + 0.1, m.ate), tipo: tipoDoMomento(m), momentos: [m] });
    cursor = Math.max(de + 0.1, m.ate);
  }
  if (plano.duracao - cursor > LACUNA || trechos.length === 0) trechos.push({ de: cursor, ate: plano.duracao, tipo: "pessoa", momentos: [] });
  else trechos[trechos.length - 1].ate = plano.duracao;

  // trechos da pessoa colados viram uma página só
  const unidos: Trecho[] = [];
  for (const tr of trechos) {
    const ultimo = unidos[unidos.length - 1];
    if (ultimo && ultimo.tipo === "pessoa" && tr.tipo === "pessoa") {
      ultimo.ate = tr.ate;
      ultimo.momentos.push(...tr.momentos);
    } else unidos.push({ ...tr, momentos: [...tr.momentos] });
  }
  return unidos.map((tr, indice) => ({
    ...tr,
    indice,
    pessoa: tr.tipo === "pessoa" ? "cheia" : lugarDaPessoa(tr.momentos[0]),
  }));
};

// ---------- deslizes ----------

export const DESLIZE = 0.62;

export type Deslize = { para: number; inicio: number };

// O deslize para a página k começa um pouco antes do corte (ou da fronteira), para o pulo do
// corte acontecer com a página já correndo, e termina com a nova frase começando.
export const montarDeslizes = (paginas: Pagina[], plano: Plano): Deslize[] =>
  paginas.slice(1).map((pg) => {
    const corte = (plano.cortesEm ?? []).find((c) => Math.abs(c - pg.de) < 0.2);
    const ancora = corte ?? pg.de;
    return { para: pg.indice, inicio: Math.max(0, ancora - 0.2) };
  });

// posição do trilho: 0 = primeira página centrada; 2,5 = no meio do caminho entre a 3ª e a 4ª
export const camera = (t: number, deslizes: Deslize[]) =>
  deslizes.reduce((soma, d) => soma + deslize(Math.min(1, Math.max(0, (t - d.inicio) / DESLIZE))), 0);

// quando cada página termina de chegar (o conteúdo que já estava no ar espera o deslize)
export const chegadaDaPagina = (indice: number, deslizes: Deslize[]) => {
  const d = deslizes.find((x) => x.para === indice);
  return d ? d.inicio + DESLIZE : 0;
};
export const saidaDaPagina = (indice: number, deslizes: Deslize[]) => {
  const d = deslizes.find((x) => x.para === indice + 1);
  return d ? d.inicio : Infinity;
};

// ---------- geometria de cada página na tela ----------

// deslocamento extra do conteúdo em relação à página (paralaxe): o conteúdo chega depois da borda
export const PARALAXE = 120;

export type Transformacao = {
  // quanto a página está fora do centro (0 = centrada, 1 = uma página à direita)
  desvio: number;
  // escala e cantos: durante o deslize as páginas recuam um pouco e viram cartões
  escala: number;
  raio: number;
  // canto superior esquerdo da página na tela
  x: number;
  y: number;
};

export const transformacao = (indice: number, cam: number): Transformacao => {
  const frac = cam - Math.floor(cam);
  const emMovimento = frac > 0.0005 && frac < 0.9995;
  const dip = emMovimento ? Math.sin(Math.PI * frac) : 0;
  const escala = 1 - 0.055 * dip;
  const raio = 52 * dip;
  const desvio = indice - cam;
  const larguraPasso = W * escala + VAO;
  const cx = W / 2 + desvio * larguraPasso;
  return { desvio, escala, raio, x: cx - (W * escala) / 2, y: H / 2 - (H * escala) / 2 };
};

// Caixa da pessoa dentro da página (coordenadas da página, 1080×1920)
export const AVATAR = { x: MARGEM, y: TOPO, lado: 112 };
export const CARTAO_PESSOA = { x: MARGEM, y: TOPO, w: 452, h: 620, raio: 40 };

export const caixaNaPagina = (pg: Pagina, plano: Plano): Caixa => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  switch (pg.pessoa) {
    case "cheia": {
      // rosto na linha do centro: o menor zoom que deixa centralizar sem borda vazia (até 1,25)
      const fx = plano.rosto.x;
      const zoom = Math.min(1.25, Math.max(1, 0.5 / Math.max(0.01, Math.min(fx, 1 - fx))));
      // e na altura em que o corte o colocou (o `ancoraY` é a altura dele no vídeo).
      // Vídeo 3:4 (videoAltura 1440): fica no tamanho dele, no alto da página creme — como um
      // slide de foto em cima e texto embaixo; assim o queixo continua acima da zona dos cartões.
      return { x: 0, y: 0, w: W, h: videoAltura, raio: 0, zoom, ancoraY: (plano.rosto.y * H) / videoAltura };
    }
    case "avatar":
      // a cabeça inteira no círculo (cabelo e queixo), com o rosto um pouco abaixo do centro
      return { x: AVATAR.x, y: AVATAR.y, w: AVATAR.lado, h: AVATAR.lado, raio: AVATAR.lado / 2, zoom: 1.9, ancoraY: 0.55 };
    case "cartao":
      return { x: CARTAO_PESSOA.x, y: CARTAO_PESSOA.y, w: CARTAO_PESSOA.w, h: CARTAO_PESSOA.h, raio: CARTAO_PESSOA.raio, zoom: 1.45, ancoraY: 0.4 };
  }
};

// A caixa da pessoa na TELA: a da página, levada pela transformação (e pela paralaxe, se é conteúdo)
export const caixaNaTela = (c: Caixa, tr: Transformacao, cheia: boolean): Caixa => {
  const dx = cheia ? 0 : tr.desvio * PARALAXE;
  return {
    ...c,
    x: tr.x + (c.x + dx) * tr.escala,
    y: tr.y + c.y * tr.escala,
    w: c.w * tr.escala,
    h: c.h * tr.escala,
    raio: cheia ? tr.raio : (c.raio ?? 0) * tr.escala,
  };
};
