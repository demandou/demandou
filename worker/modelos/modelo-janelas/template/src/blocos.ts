// Medidas dos blocos universais (px no quadro 1080×1920). Os componentes desenham com estas contas
// e o mouse (cena.ts) mira nelas: os dois nunca discordam.
import { areaDoMomento, type Area, areaAoLadoDaMini, botoesCta, CARTAO_CTA as CARTAO, lugarDoMomento, topoDoCartaoCta } from "./geometria";
import { temposDoTexto } from "./anim";
import { encaixar, type Encaixe, ESPACO, larguraTexto, trechoNoTexto } from "./medida";
import type { Comparacao, Cta, Definicao, Frase, Passos, Plano, Topicos } from "./plano";
import { BARRA_JANELA, DOCK } from "./tema";

export const ALTURA_LINHA = 1.1;
const alturaDe = (e: Encaixe, lh = ALTURA_LINHA) => e.linhas.length * e.tamanho * lh;

// ——— listas (tópicos e passos) ———

export type Linha = { x: number; y: number; w: number; h: number; marca: number; texto: Encaixe; detalhe: Encaixe | null };
export type GeoLista = { janela: Area; titulo: Encaixe | null; tituloY: number; linhas: Linha[] };

export const geoLista = (plano: Plano, m: Topicos | Passos): GeoLista => {
  const janela = areaDoMomento(plano, m);
  const corpo = janela.y + BARRA_JANELA;
  const pad = 24;
  const itens = m.itens.slice(0, 5);
  const n = Math.max(1, itens.length);
  const titulo = m.titulo ? encaixar(m.titulo, { largura: janela.w - 80, max: 58, min: 40, linhas: n >= 4 ? 1 : 2 }) : null;
  const alturaTitulo = titulo ? alturaDe(titulo, 1.06) + 16 : 0;
  const topo = corpo + pad + alturaTitulo;
  const fundo = janela.y + janela.h - pad;
  const vao = n >= 5 ? 10 : 14;
  const h = Math.min(n <= 3 ? 172 : 136, (fundo - topo - vao * (n - 1)) / n);
  // sobrou espaço: as linhas ficam no meio da área (nada de faixa vazia embaixo)
  const sobra = Math.max(0, fundo - topo - n * h - vao * (n - 1));
  const topoLinhas = topo + Math.min(sobra / 2, 60);
  const marca = Math.round(Math.min(80, h - 24));
  // nos passos o texto fica numa caixa própria, ao lado do número (um pouco mais estreita)
  const larguraTexto = janela.w - 56 - 24 - marca - 22 - 24 - (m.tipo === "passos" ? 34 : 0);
  const linhas = itens.map((it, i) => {
    const comDetalhe = !!it.detalhe;
    // o corpo acompanha a altura da linha: poucos itens, letra maior
    const maxTexto = Math.round(Math.min(n >= 5 ? 46 : 60, (h - (comDetalhe ? 58 : 24)) / (comDetalhe ? 1.1 : 1.2)));
    const texto = encaixar(it.texto, {
      largura: larguraTexto,
      max: Math.max(38, maxTexto),
      min: 36,
      linhas: comDetalhe ? (h >= 140 ? 2 : 1) : h >= 112 ? 2 : 1,
    });
    const detalhe = it.detalhe ? encaixar(it.detalhe, { largura: larguraTexto, max: h >= 120 ? 42 : 36, min: 30, linhas: 1, fonte: { peso: 600 } }) : null;
    return { x: janela.x + 28, y: topoLinhas + i * (h + vao), w: janela.w - 56, h, marca, texto, detalhe };
  });
  return { janela, titulo, tituloY: corpo + pad - 4, linhas };
};

// a barra de progresso dos passos, ao lado da pessoa minimizada (só quando ela está na miniatura)
export const geoProgresso = (plano: Plano, m: Passos) => (lugarDoMomento(m) === "mini" ? areaAoLadoDaMini(plano) : null);

// ——— definição ———

export const geoDefinicao = (plano: Plano, m: Definicao) => {
  const janela = areaDoMomento(plano, m);
  const corpo = janela.y + BARRA_JANELA;
  const livre = janela.h - BARRA_JANELA - 40;
  const grande = livre > 420;
  const termo = encaixar(m.termo, { largura: janela.w - 90, max: grande ? 124 : 100, min: 56, linhas: 2 });
  const hTermo = alturaDe(termo, 1.04);
  const significado = encaixar(m.significado, { largura: janela.w - 140, max: grande ? 60 : 52, min: 38, linhas: livre - hTermo > 230 ? 3 : 2, fonte: { peso: 700 } });
  const hSig = alturaDe(significado, 1.14) + 44;
  // termo e balão centralizados na altura do corpo
  const total = hTermo + 34 + hSig;
  const topo = corpo + Math.max(18, (janela.h - BARRA_JANELA - total) / 2);
  const larguraTermo = termo.largura;
  return {
    janela,
    termo,
    termoX: janela.x + 44,
    termoY: topo,
    termoW: larguraTermo,
    termoH: hTermo,
    significado,
    balao: { x: janela.x + 30, y: topo + hTermo + 34, w: janela.w - 60, h: hSig },
  };
};

// ——— frase (digitada numa nota) ———

export const geoFrase = (plano: Plano, m: Frase) => {
  const janela = areaDoMomento(plano, m);
  const corpo = janela.y + BARRA_JANELA;
  const livre = janela.h - BARRA_JANELA - 48;
  const largura = janela.w - 96;
  const lh = 1.14;
  let texto = encaixar(m.texto, { largura, max: 72, min: 44, linhas: 3 });
  if (alturaDe(texto, lh) > livre) texto = encaixar(m.texto, { largura, max: Math.floor(livre / (2 * lh)), min: 40, linhas: 2 });
  const h = alturaDe(texto, lh);
  const x0 = janela.x + 48;
  const y0 = corpo + (janela.h - BARRA_JANELA - h) / 2;
  // caixa de cada palavra (para a seleção do mouse e o risco)
  const caixas = texto.palavras.map(() => ({ x: 0, y: 0, w: 0, h: 0 }));
  texto.linhas.forEach((linha, k) => {
    let x = x0;
    for (const i of linha) {
      const w = larguraTexto(texto.palavras[i], texto.tamanho);
      caixas[i] = { x, y: y0 + k * texto.tamanho * lh, w, h: texto.tamanho * lh };
      x += w + ESPACO * texto.tamanho;
    }
  });
  const risco = trechoNoTexto(m.texto, m.risco);
  return { janela, texto, lh, x0, y0, caixas, risco };
};

// ——— fechamento universal (um botão) ———

export const geoCtaUniversal = (plano: Plano, m: Cta) => {
  const lugar = lugarDoMomento(m);
  const texto = encaixar(m.texto ?? m.titulo ?? "", { largura: CARTAO.w - 88, max: 74, min: 50, linhas: 2 });
  const hTexto = alturaDe(texto, 1.06);
  const campo = m.icone === "comentar";
  const altura = 34 + hTexto + 30 + (campo ? 112 + 18 : 0) + 116 + 36;
  const topoPadrao = topoDoCartaoCta(plano, m);
  const topo = lugar === "cheia" || lugar === "mini" ? topoPadrao : Math.min(topoPadrao, DOCK.y - 18 - altura);
  const yBotao = topo + 34 + hTexto + 30 + (campo ? 130 : 0);
  return {
    topo,
    altura,
    texto,
    campo: campo ? { x: CARTAO.x + 44, y: topo + 34 + hTexto + 30, w: CARTAO.w - 88, h: 112 } : null,
    botao: { x: CARTAO.x + 44, y: yBotao, w: CARTAO.w - 88, h: 116 },
  };
};

// Forma antiga (salvar e enviar): os mesmos botões de sempre
export { botoesCta };

// O fechamento antigo (salvar e enviar) é o que tem `salvarEm`, `enviarEm` ou `para`, ou só `titulo`
export const ctaAntigo = (m: Cta) => m.salvarEm !== undefined || m.enviarEm !== undefined || !!m.para || (!!m.titulo && !m.texto);

// Os instantes do fechamento universal: as palavras do texto e o clique no botão
export const temposDoCta = (m: Cta, palavras: Plano["palavras"]) => {
  const texto = m.texto ?? m.titulo ?? "";
  const inicio = m.em ?? m.de + 0.15;
  const tempos = temposDoTexto(texto, palavras, inicio - 0.3, m.ate, inicio);
  const d = trechoNoTexto(texto, m.destaque);
  const clique = m.cliqueEm ?? (d ? tempos[d[1]] + 0.3 : (tempos[tempos.length - 1] ?? m.de + 0.8) + 0.3);
  return { tempos, clique, destaque: d };
};

// ——— comparação (duas janelas lado a lado) ———

export const geoComparacao = (plano: Plano, m: Comparacao) => {
  const a = areaDoMomento(plano, m);
  const cabecalho = m.titulo ? 66 : 0;
  const vao = 26;
  const w = (a.w - vao) / 2;
  const y = a.y + cabecalho;
  const h = a.h - cabecalho;
  return { a, cabecalho, janelas: [0, 1].map((i) => ({ x: a.x + i * (w + vao), y, w, h })) };
};

