// Geometria dos blocos universais na página do espelho (no vertical, a faixa de cima, acima da linha
// dourada; no deitado, a mesma página de 1080 px de largura, posta no quadro da esquerda, ao lado
// da moldura da pessoa: layout.ts, paginaNoQuadro).
// Cada função mede o texto de verdade (medida.ts), escolhe os corpos que cabem e devolve a altura
// da linha do espelho para aquele momento e onde fica cada coisa. Funções puras, usadas pelo
// layout (a linha e a moldura da pessoa) e pelos componentes.
//
// Dois tipos de faixa:
// - TEXTO (abertura, frase, pergunta, destaque, definição, número): o conteúdo fica centrado e a
//   linha desce só o necessário (no mínimo 430 px), como na manchete;
// - PAINEL (tópicos, passos, comparação, gráfico): o conteúdo ocupa a largura toda, alinhado à
//   esquerda, e a linha fica entre 640 e 880 px conforme a quantidade de coisas.
import { encaixar, larguraTexto, lembrar, type Encaixe } from "./medida";
import type { Comparacao, Definicao, Destaque, Frase, Grafico, Item, Numero, Passos, Pergunta, Topicos } from "./plano";
import { FOLGA_DA_LINHA, FONTE_ITALICO, FONTE_ROTULO, FONTE_TITULO, LIMITE_DIREITO, MARGEM_ESQUERDA, TOPO_SEGURO } from "./tema";

export const LARGURA_TEXTO = 840;
export const X_TEXTO = (1080 - LARGURA_TEXTO) / 2;
const RESPIRO = 46;
export const LINHA_MIN_TEXTO = 430;
export const LINHA_MIN_PAINEL_LIVRE = 640;
export const LINHA_PAINEL_MAX = 880;
export const LARGURA_PAINEL = LIMITE_DIREITO - MARGEM_ESQUERDA;

const mistura = (a: number, b: number, k: number) => Math.round(a + (b - a) * k);
const linhaDoTexto = (altura: number) => Math.round(Math.max(LINHA_MIN_TEXTO, TOPO_SEGURO + 2 * RESPIRO + altura + FOLGA_DA_LINHA));
const topoDoTexto = (linha: number, altura: number) => TOPO_SEGURO + Math.max(0, (linha - FOLGA_DA_LINHA - TOPO_SEGURO - altura) / 2);
const chave = (nome: string, m: object, extra: number) => `${nome}|${extra}|${JSON.stringify(m)}`;

// procura, do maior corpo (k = 1) para o menor (k = 0), o primeiro conjunto em que a faixa cabe
// até a linha máxima; se nenhum couber, fica com o menor e a linha desce
const escolher = <G extends { altura: number }>(medir: (k: number) => G, cabe: (g: G) => boolean) => {
  for (const k of [1, 0.85, 0.7, 0.55, 0.4, 0.25, 0.1, 0]) {
    const g = medir(k);
    if (cabe(g)) return g;
  }
  return medir(0);
};

const alturaLinhas = (e: Encaixe, entre: number) => e.linhas.length * e.tamanho * entre;

// ---------------------------------------------------------------- frase (citação)
export const geometriaDaFrase = (m: Frase, linhaMaxima: number) =>
  lembrar(chave("frase", m, linhaMaxima), () => {
    const g = escolher(
      (k) => {
        const texto = encaixar(m.texto, { largura: LARGURA_TEXTO, max: mistura(64, 92, k), min: 56, linhas: 3, fonte: FONTE_ITALICO });
        const aspas = Math.round(texto.tamanho * 1.5);
        const alturaAspas = aspas * 0.5;
        const altura = alturaAspas + 18 + alturaLinhas(texto, 1.14) + 30;
        return { texto, aspas, alturaAspas, altura };
      },
      (g) => linhaDoTexto(g.altura) <= linhaMaxima,
    );
    const linha = linhaDoTexto(g.altura);
    return { ...g, linha, topo: topoDoTexto(linha, g.altura) };
  });

// ---------------------------------------------------------------- pergunta
export const geometriaDaPergunta = (m: Pergunta, linhaMaxima: number) =>
  lembrar(chave("pergunta", m, linhaMaxima), () => {
    const opcoes = (m.opcoes ?? []).slice(0, 4);
    const g = escolher(
      (k) => {
        const texto = encaixar(m.texto, { largura: LARGURA_TEXTO, max: mistura(64, 92, k), min: 56, linhas: 3, fonte: FONTE_TITULO });
        const sinal = Math.round(texto.tamanho * 1.35);
        const circulo = 50;
        // as opções ficam numa coluna centrada: círculo com a letra + texto em itálico
        const larguraOpcao = LARGURA_TEXTO - circulo - 22;
        const corpoOpcoes = opcoes.length
          ? Math.min(...opcoes.map((o) => encaixar(o.texto, { largura: larguraOpcao, max: mistura(46, 56, k), min: 42, linhas: 1, fonte: FONTE_ITALICO }).tamanho))
          : 0;
        const larguraColuna = opcoes.length
          ? Math.min(LARGURA_TEXTO, circulo + 22 + Math.max(...opcoes.map((o) => larguraTexto(o.texto, corpoOpcoes, FONTE_ITALICO))))
          : 0;
        const alturaOpcao = Math.max(circulo, corpoOpcoes * 1.15);
        const vaoOpcoes = 16;
        const alturaOpcoes = opcoes.length ? 36 + opcoes.length * alturaOpcao + (opcoes.length - 1) * vaoOpcoes : 0;
        const altura = sinal * 0.72 + 14 + alturaLinhas(texto, 1.08) + alturaOpcoes;
        return { texto, sinal, circulo, corpoOpcoes, larguraColuna, alturaOpcao, vaoOpcoes, alturaOpcoes, altura };
      },
      (g) => linhaDoTexto(g.altura) <= linhaMaxima,
    );
    const linha = linhaDoTexto(g.altura);
    return { ...g, opcoes, linha, topo: topoDoTexto(linha, g.altura) };
  });

// ---------------------------------------------------------------- destaque
export const geometriaDoDestaque = (m: Destaque, linhaMaxima: number) =>
  lembrar(chave("destaque", m, linhaMaxima), () => {
    const fonte = m.nivel === "chave" ? { ...FONTE_TITULO, italico: true } : FONTE_TITULO;
    const g = escolher(
      (k) => {
        const texto = encaixar(m.texto, { largura: LARGURA_TEXTO - 40, max: mistura(80, 132, k), min: 72, linhas: 2, fonte });
        const detalhe = m.detalhe ? encaixar(m.detalhe, { largura: LARGURA_TEXTO, max: mistura(46, 58, k), min: 44, linhas: 2, fonte: FONTE_ITALICO }) : null;
        const altura = 30 + alturaLinhas(texto, 1.04) + 30 + (detalhe ? 34 + alturaLinhas(detalhe, 1.14) : 0);
        return { texto, detalhe, altura };
      },
      (g) => linhaDoTexto(g.altura) <= linhaMaxima,
    );
    const larguraTexto0 = Math.max(...g.texto.linhas.map((l) => larguraTexto(l, g.texto.tamanho, fonte)));
    const linha = linhaDoTexto(g.altura);
    return { ...g, fonte, linha, topo: topoDoTexto(linha, g.altura), larguraFios: Math.min(LARGURA_TEXTO, Math.max(360, larguraTexto0 + 80)) };
  });

// ---------------------------------------------------------------- definição
export const geometriaDaDefinicao = (m: Definicao, linhaMaxima: number) =>
  lembrar(chave("definicao", m, linhaMaxima), () => {
    const g = escolher(
      (k) => {
        const termo = encaixar(m.termo, { largura: LARGURA_TEXTO, max: mistura(80, 112, k), min: 72, linhas: 2, fonte: FONTE_TITULO });
        const significado = encaixar(m.significado, { largura: LARGURA_TEXTO, max: mistura(52, 70, k), min: 46, linhas: 2, fonte: FONTE_ITALICO });
        const altura = alturaLinhas(termo, 1.04) + 34 + 18 + 30 + alturaLinhas(significado, 1.14);
        return { termo, significado, altura };
      },
      (g) => linhaDoTexto(g.altura) <= linhaMaxima,
    );
    const largura = Math.max(...g.termo.linhas.map((l) => larguraTexto(l, g.termo.tamanho, FONTE_TITULO)));
    const linha = linhaDoTexto(g.altura);
    const topo = topoDoTexto(linha, g.altura);
    const yFio = topo + alturaLinhas(g.termo, 1.04) + 34 + 9;
    return { ...g, linha, topo, yFio, larguraFio: Math.min(LARGURA_TEXTO, Math.max(320, largura + 60)) };
  });

// ---------------------------------------------------------------- número
export const formatarNumero = (v: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);

export const geometriaDoNumero = (m: Numero, linhaMaxima: number) =>
  lembrar(chave("numero", m, linhaMaxima), () => {
    const final = formatarNumero(m.valor, m.casas ?? 0);
    const g = escolher(
      (k) => {
        // número + prefixo e sufixo menores na mesma linha, o maior corpo que cabe em 840 px
        let corpo = mistura(120, 210, k);
        const largura = (c: number) =>
          larguraTexto(final, c, FONTE_TITULO) +
          (m.prefixo ? larguraTexto(m.prefixo, c * 0.42, { familia: "serif", peso: 400 }) + c * 0.12 : 0) +
          (m.sufixo ? larguraTexto(m.sufixo, c * 0.42, { familia: "serif", peso: 400 }) + c * 0.12 : 0);
        while (corpo > 84 && largura(corpo) > LARGURA_TEXTO) corpo -= 4;
        const rotulo = encaixar(m.rotulo, { largura: LARGURA_TEXTO, max: mistura(48, 62, k), min: 44, linhas: 2, fonte: FONTE_ITALICO });
        const etiqueta = m.ilustrativo ? 30 + 22 : 0;
        const altura = etiqueta + corpo * 0.86 + 34 + 26 + 30 + alturaLinhas(rotulo, 1.14);
        return { corpo, larguraNumero: largura(corpo), rotulo, etiqueta, altura };
      },
      (g) => linhaDoTexto(g.altura) <= linhaMaxima,
    );
    const linha = linhaDoTexto(g.altura);
    const topo = topoDoTexto(linha, g.altura);
    const topoNumero = topo + g.etiqueta;
    const yRegua = topoNumero + g.corpo * 0.86 + 34 + 13;
    return { ...g, final, linha, topo, topoNumero, yRegua, topoRotulo: yRegua + 13 + 30 };
  });

// ---------------------------------------------------------------- painéis: título + itens
const tituloDoPainel = (titulo: string | undefined, k: number) =>
  titulo ? encaixar(titulo, { largura: LARGURA_PAINEL, max: mistura(66, 84, k), min: 60, linhas: 2, fonte: FONTE_TITULO }) : null;
const alturaDoTitulo = (e: Encaixe | null) => (e ? alturaLinhas(e, 1.04) + 22 + 30 : 0);

const linhaDoPainel = (altura: number) => Math.round(Math.min(LINHA_PAINEL_MAX + 120, Math.max(LINHA_MIN_PAINEL_LIVRE, TOPO_SEGURO + altura + 24 + FOLGA_DA_LINHA)));

export type ItemMedido = { texto: Encaixe; detalhe: Encaixe | null; altura: number };

// Tópicos e passos: coluna do marcador (losango ou círculo numerado) + texto com até 2 linhas
export const geometriaDaLista = (m: Topicos | Passos, linhaMaxima: number) =>
  lembrar(chave("lista", m, linhaMaxima), () => {
    const itens = m.itens.slice(0, 5);
    const n = Math.max(1, itens.length);
    const coluna = m.tipo === "passos" ? 82 : 62;
    const largura = LARGURA_PAINEL - coluna;
    const maior = n <= 2 ? 80 : n === 3 ? 72 : n === 4 ? 64 : 58;
    const limite = Math.min(LINHA_PAINEL_MAX, Math.max(LINHA_MIN_PAINEL_LIVRE + 150, linhaMaxima));
    const g = escolher(
      (k) => {
        const titulo = tituloDoPainel(m.titulo, k);
        const corpo = Math.min(
          ...itens.map((it: Item) => encaixar(it.texto, { largura, max: mistura(48, maior, k), min: 44, linhas: 2, fonte: FONTE_TITULO }).tamanho),
        );
        const medidos: ItemMedido[] = itens.map((it) => {
          const texto = encaixar(it.texto, { largura, max: corpo, min: Math.min(corpo, 44), linhas: 2, fonte: FONTE_TITULO });
          const detalhe = it.detalhe ? encaixar(it.detalhe, { largura, max: Math.max(40, Math.round(corpo * 0.74)), min: 38, linhas: 2, fonte: FONTE_ITALICO }) : null;
          const altura = Math.max(m.tipo === "passos" ? 56 : 0, alturaLinhas(texto, 1.06)) + (detalhe ? 6 + alturaLinhas(detalhe, 1.12) : 0);
          return { texto, detalhe, altura };
        });
        const vaoMin = 30;
        const altura = alturaDoTitulo(titulo) + medidos.reduce((s, it) => s + it.altura, 0) + vaoMin * (n - 1);
        return { titulo, corpo, medidos, altura };
      },
      (g) => linhaDoPainel(g.altura) <= limite,
    );
    const linha = Math.min(Math.max(linhaDoPainel(g.altura), LINHA_MIN_PAINEL_LIVRE), Math.max(limite, linhaDoPainel(g.altura)));
    // os itens se espalham pela faixa (vão de 30 a 76 px), o bloco fica centrado no espaço livre
    const base = linha - FOLGA_DA_LINHA;
    const topoItens = TOPO_SEGURO + alturaDoTitulo(g.titulo);
    const somaItens = g.medidos.reduce((s, it) => s + it.altura, 0);
    const vao = n > 1 ? Math.max(30, Math.min(76, (base - 20 - topoItens - somaItens) / (n - 1))) : 0;
    const usado = somaItens + vao * (n - 1);
    let y = topoItens + Math.max(0, (base - 20 - topoItens - usado) / 2);
    const posicoes = g.medidos.map((it) => {
      const topo = y;
      y += it.altura + vao;
      return topo;
    });
    return { ...g, itens, coluna, largura, linha, topoItens, vao, posicoes };
  });

// ---------------------------------------------------------------- comparação (forma universal)
export const geometriaDaComparacaoUniversal = (m: Comparacao, linhaMaxima: number) =>
  lembrar(chave("comparacaoU", m, linhaMaxima), () => {
    const lados = m.lados ?? [
      { rotulo: "", texto: "", em: m.de },
      { rotulo: "", texto: "", em: m.de },
    ];
    const limite = Math.min(LINHA_PAINEL_MAX, Math.max(LINHA_MIN_PAINEL_LIVRE + 150, linhaMaxima));
    const g = escolher(
      (k) => {
        const titulo = m.titulo ? encaixar(m.titulo, { largura: LARGURA_PAINEL, max: 36, min: 30, linhas: 2, fonte: FONTE_ROTULO }) : null;
        const alturaTitulo = titulo ? alturaLinhas(titulo, 1.2) + 30 : 0;
        // o selo do vencedor ocupa ~1,1 corpo no fim do texto
        const textos = lados.map((l) => encaixar(l.texto, { largura: LARGURA_PAINEL - 110, max: mistura(64, 96, k), min: 56, linhas: 2, fonte: FONTE_TITULO }));
        const corpo = Math.min(...textos.map((e) => e.tamanho));
        const textosIguais = lados.map((l) => encaixar(l.texto, { largura: LARGURA_PAINEL - 110, max: corpo, min: Math.min(56, corpo), linhas: 2, fonte: FONTE_TITULO }));
        const rotulos = lados.map((l) => (l.rotulo ? encaixar(l.rotulo, { largura: LARGURA_PAINEL, max: 34, min: 30, linhas: 1, fonte: FONTE_ROTULO }) : null));
        const alturaLado = (i: number) => (rotulos[i] ? 34 + 16 : 0) + alturaLinhas(textosIguais[i], 1.04);
        const meio = 92;
        const altura = alturaTitulo + alturaLado(0) + meio + alturaLado(1);
        return { titulo, alturaTitulo, textos: textosIguais, corpo, rotulos, alturas: [alturaLado(0), alturaLado(1)], meio, altura };
      },
      (g) => linhaDoPainel(g.altura) <= limite,
    );
    const linha = Math.max(linhaDoPainel(g.altura), LINHA_MIN_PAINEL_LIVRE);
    const base = linha - FOLGA_DA_LINHA;
    const livre = Math.max(0, base - 10 - TOPO_SEGURO - g.altura);
    const meio = g.meio + Math.min(livre, 120);
    const topo = TOPO_SEGURO + Math.max(0, (livre - Math.min(livre, 120)) / 2);
    const topoLado0 = topo + g.alturaTitulo;
    const yMeio = topoLado0 + g.alturas[0] + meio / 2;
    const topoLado1 = topoLado0 + g.alturas[0] + meio;
    return { ...g, lados, linha, topo, topoLado0, yMeio, topoLado1 };
  });

// ---------------------------------------------------------------- gráfico
export const geometriaDoGrafico = (m: Grafico, linhaMaxima: number) =>
  lembrar(chave("grafico", m, linhaMaxima), () => {
    const dados = (m.dados ?? []).slice(0, 6);
    const limite = Math.min(LINHA_PAINEL_MAX, Math.max(LINHA_MIN_PAINEL_LIVRE + 150, linhaMaxima));
    const linha = limite;
    const base = linha - FOLGA_DA_LINHA;
    const titulo = tituloDoPainel(m.titulo, dados.length > 4 ? 0.4 : 1);
    const etiqueta = !dados.length || m.ilustrativo;
    const topoTitulo = TOPO_SEGURO + (etiqueta && titulo ? 0 : 0);
    const topoArea = TOPO_SEGURO + (titulo ? alturaDoTitulo(titulo) : etiqueta ? 56 : 10);
    // barras: uma linha por dado (nome e valor em cima, trilho embaixo)
    const corpoBarras = dados.length
      ? Math.max(40, Math.min(56, Math.floor((base - topoArea - 10) / dados.length / 1.1) - 40))
      : 0;
    return { dados, linha, base, titulo, etiqueta, topoTitulo, topoArea, corpoBarras };
  });

export const xDaRegua = (v: number, max: number) => MARGEM_ESQUERDA + (LARGURA_PAINEL * Math.max(0, v)) / Math.max(1e-6, max);
