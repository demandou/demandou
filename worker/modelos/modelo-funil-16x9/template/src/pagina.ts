// A página de papel dos blocos universais (listas, passos, comparações, gráficos, definições):
// a mesma gramática da tela do funil, no quadro deitado (16:9). A página é o QUADRO do lado
// esquerdo e a pessoa fica na MOLDURA do lado direito (aula 9 do curso). Como o quadro é largo e
// baixo, o que no vertical era uma pilha alta vira fileiras e colunas: os itens ganham a largura
// toda da página (menos linhas), a comparação põe os dois lados lado a lado, a definição põe o
// funil pequeno à esquerda com o termo e o significado ao lado, e a pizza põe a legenda ao lado
// da grade.
//
// Tudo aqui é geometria pura em px LÓGICOS (a camada da página é encolhida pela ESCALA de tema.ts).
import type { Comparacao, Definicao, Grafico, Item, Momento, Passos, Topicos } from "./plano";
import { AREA_DA_PAGINA, caber, logico, medir } from "./tema";

export const PAGINA = {
  esquerda: Math.round(logico(AREA_DA_PAGINA.esquerda)),
  direita: Math.round(logico(AREA_DA_PAGINA.direita)),
  topo: Math.round(logico(AREA_DA_PAGINA.topo)),
  base: Math.round(logico(AREA_DA_PAGINA.base)) - 14,
  // a etiqueta ("ILUSTRATIVO") no alto, à esquerda
  etiquetaY: Math.round(logico(AREA_DA_PAGINA.topo)) + 10,
};

// direita da coluna para uma linha que começa em `topo` (no quadro deitado não há botões do app
// do lado da página: a coluna tem a mesma largura de cima a baixo)
export const direitaDaLinha = (_topo: number) => PAGINA.direita;

// ——— cabeçalho: etiqueta ("ILUSTRATIVO") e título, na largura toda ———

export type Cabecalho = { etiqueta: boolean; titulo?: { y: number; tamanho: number; linhas: string[][] }; fundo: number };

export const cabecalho = (titulo: string | undefined, etiqueta: boolean): Cabecalho => {
  const yTitulo = etiqueta ? PAGINA.etiquetaY + 78 : PAGINA.topo + 14;
  if (!titulo?.trim()) return { etiqueta, fundo: etiqueta ? PAGINA.etiquetaY + 64 : PAGINA.topo + 14 };
  const { tamanho, linhas } = caber(titulo, PAGINA.direita - PAGINA.esquerda, 80, 56, 2);
  return { etiqueta, titulo: { y: yTitulo, tamanho, linhas }, fundo: yTitulo + linhas.length * tamanho * 1.06 };
};

// ——— linhas da coluna (tópicos, passos) ———

export type Linha = {
  topo: number;
  fundo: number;
  // texto principal: corpo, linhas e onde começa
  x: number;
  tamanho: number;
  linhas: string[][];
  // detalhe (opcional), menor
  detalhe?: { tamanho: number; linhas: string[][]; y: number };
  // centro da primeira linha de texto (onde o marcador mira)
  yTexto: number;
  // centro do conteúdo da linha
  centro: number;
};

const ENTRELINHA = 1.06;

// Distribui 2 a 5 itens na coluna, do fim do cabeçalho até a base: o maior corpo que cabe.
export const linhasDaColuna = (itens: Item[], topo: number, x: number, maximo = 96, minimo = 52): Linha[] => {
  const n = Math.max(1, itens.length);
  const disponivel = PAGINA.base - topo;
  const largura = PAGINA.direita - x;
  const montar = (corpo: number, maxLinhas: number, folgaMin: number): Linha[] | null => {
    const conteudos = itens.map((it) => {
      const principal = caber(it.texto, largura, corpo, Math.min(corpo, minimo), maxLinhas);
      const det = it.detalhe ? caber(it.detalhe, largura, 44, 36, 2, 600) : undefined;
      const altura = principal.linhas.length * principal.tamanho * ENTRELINHA + (det ? 14 + det.linhas.length * det.tamanho * 1.12 : 0);
      return { principal, det, altura };
    });
    const soma = conteudos.reduce((s, c) => s + c.altura, 0);
    const folga = (disponivel - soma) / n;
    if (folga < folgaMin) return null;
    const passo = Math.min(folga, 200);
    // o grupo fica centrado na altura disponível (um pouco acima do centro)
    let y = topo + Math.max(0, (disponivel - soma - passo * n) * 0.45);
    return conteudos.map((c) => {
      const topoLinha = y;
      y += c.altura + passo;
      return {
        topo: topoLinha,
        fundo: topoLinha + c.altura + passo,
        x,
        tamanho: c.principal.tamanho,
        linhas: c.principal.linhas,
        detalhe: c.det ? { ...c.det, y: topoLinha + passo / 2 + c.principal.linhas.length * c.principal.tamanho * ENTRELINHA + 14 } : undefined,
        yTexto: topoLinha + passo / 2 + (c.principal.tamanho * ENTRELINHA) / 2,
        centro: topoLinha + passo / 2 + c.altura / 2,
      };
    });
  };
  // todos os itens com o mesmo corpo (hierarquia limpa): o maior que cabe em até 2 linhas; se não
  // houver, em até 3; por fim, com menos respiro entre as linhas
  for (const [maxLinhas, folgaMin] of [
    [2, 56],
    [3, 56],
    [3, 34],
  ]) {
    for (let corpo = maximo; corpo >= minimo; corpo -= 4) {
      const linhas = montar(corpo, maxLinhas, folgaMin);
      if (linhas && linhas.every((l) => l.tamanho === corpo && l.linhas.length <= maxLinhas && l.linhas.every((ws) => medir(ws.join(" "), l.tamanho) <= largura + 1)))
        return linhas;
    }
  }
  // último recurso: corpo mínimo, linhas iguais (nunca corta: o texto quebra em mais linhas)
  const altura = disponivel / n;
  return itens.map((it, k) => {
    const topoLinha = topo + k * altura;
    const p = caber(it.texto, largura, 44, 36, Math.max(1, Math.floor((altura - 16) / (44 * ENTRELINHA))));
    return {
      topo: topoLinha,
      fundo: topoLinha + altura,
      x,
      tamanho: p.tamanho,
      linhas: p.linhas,
      yTexto: topoLinha + 12 + (p.tamanho * ENTRELINHA) / 2,
      centro: topoLinha + altura / 2,
    };
  });
};

// ——— tópicos e passos ———

export const PONTO_TOPICO = 44;
export const X_TEXTO_TOPICOS = PAGINA.esquerda + PONTO_TOPICO + 30;
export const TUBO = { x: PAGINA.esquerda, largura: 100 };
export const X_TEXTO_PASSOS = TUBO.x + TUBO.largura + 34;

// gráfico com etiqueta "Ilustrativo" ou com a nota da unidade dos pontos (barras): o título desce
const temEtiqueta = (m: Momento) => m.tipo === "grafico" && (!!m.ilustrativo || !m.dados?.length || m.forma === "barras");

export const layoutTopicos = (m: Topicos) => {
  const cab = cabecalho(m.titulo, false);
  return { cab, linhas: linhasDaColuna(m.itens, cab.fundo + 30, X_TEXTO_TOPICOS) };
};

export const layoutPassos = (m: Passos) => {
  const cab = cabecalho(m.titulo, false);
  return { cab, linhas: linhasDaColuna(m.itens, cab.fundo + 30, X_TEXTO_PASSOS, 88, 50) };
};

// ——— comparação: dois lados, lado a lado (duas colunas), com a divisa em pé entre eles ———

export type Lado = { x: number; largura: number; topo: number; rotuloY: number; textoY: number; tamanho: number; linhas: string[][]; fundo: number; centro: number };

// o vão entre as duas colunas (a divisa e o símbolo ficam no meio dele)
const VAO_COMPARACAO = 150;

export const layoutComparacao = (m: Comparacao) => {
  const cab = cabecalho(m.titulo, false);
  const topo = cab.fundo + 50;
  const ROTULO = 64;
  const largura = Math.floor((PAGINA.direita - PAGINA.esquerda - VAO_COMPARACAO) / 2);
  const disponivel = PAGINA.base - topo - 30;
  const medir2 = (maximo: number) =>
    m.lados.map((l) => {
      const p = caber(l.texto, largura, maximo, 56, 4);
      return { ...p, altura: ROTULO + 22 + p.linhas.length * p.tamanho * ENTRELINHA };
    });
  // os dois lados com o mesmo corpo (o menor dos dois), o maior que cabe na altura
  let medidas = medir2(120);
  for (let maximo = 120; maximo >= 56; maximo -= 4) {
    medidas = medir2(maximo);
    const corpo = Math.min(...medidas.map((x) => x.tamanho));
    medidas = medir2(corpo);
    if (Math.max(...medidas.map((x) => x.altura)) <= disponivel) break;
  }
  const altura = Math.max(...medidas.map((x) => x.altura));
  const y = topo + Math.max(0, (disponivel - altura) * 0.4);
  const lados: Lado[] = medidas.map((med, k) => {
    const x = PAGINA.esquerda + k * (largura + VAO_COMPARACAO);
    return {
      x,
      largura,
      topo: y,
      rotuloY: y,
      textoY: y + ROTULO + 22,
      tamanho: med.tamanho,
      linhas: med.linhas,
      fundo: y + med.altura,
      centro: y + med.altura / 2,
    };
  });
  return { cab, lados, separadorX: PAGINA.esquerda + largura + VAO_COMPARACAO / 2, separadorTopo: y - 10, separadorBase: y + altura + 10 };
};

// ——— definição: o funil pequeno à esquerda; o termo ao lado da boca e o significado ao lado do bico ———

export const layoutDefinicao = (m: Definicao) => {
  const larguraFunil = 440;
  const xTexto = PAGINA.esquerda + larguraFunil + 70;
  const largura = PAGINA.direita - xTexto;
  const termo = caber(m.termo, largura, 140, 72, 2);
  const significado = caber(m.significado, largura, 88, 52, 3, 700);
  const termoAltura = termo.linhas.length * termo.tamanho * 1.02;
  const sigAltura = significado.linhas.length * significado.tamanho * ENTRELINHA;
  const disponivel = PAGINA.base - PAGINA.topo - 40;
  // o funil vai da altura do termo até a do significado (com um vão entre os dois textos)
  const funilAltura = Math.round(Math.min(disponivel, Math.max(460, termoAltura + 140 + sigAltura)));
  const topo = PAGINA.topo + 20 + Math.max(0, (disponivel - funilAltura) * 0.45);
  return {
    termo: { x: xTexto, y: topo, ...termo, centro: topo + termoAltura / 2 },
    funil: { y: topo, altura: funilAltura, x: PAGINA.esquerda, largura: larguraFunil },
    significado: { x: xTexto, y: topo + funilAltura - sigAltura, ...significado, centro: topo + funilAltura - sigAltura / 2 },
  };
};

// ——— gráfico ———

export const layoutGrafico = (m: Grafico) => {
  const cab = cabecalho(m.titulo, temEtiqueta(m));
  const topo = cab.fundo + 50;
  return { cab, topo, base: PAGINA.base - 20, esquerda: PAGINA.esquerda, direita: PAGINA.direita };
};

// ——— gráfico: as peças que os componentes precisam ———

// barras: uma fileira de pontos por dado; cada ponto vale um número redondo
export const REDONDOS = [0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1e6, 2e6, 5e6, 1e7, 1e8, 1e9];
export const PONTO_BARRA = { d: 32, passo: 42 };

export const unidadeDasBarras = (maior: number, cabem: number) => REDONDOS.find((u) => maior / u <= cabem) ?? maior / cabem;

export const fileirasDasBarras = (m: Grafico) => {
  const l = layoutGrafico(m);
  const dados = m.dados ?? [];
  const n = Math.max(1, dados.length);
  const alturaFileira = Math.min(200, (l.base - l.topo) / n);
  const total = alturaFileira * n;
  const topo = l.topo + Math.max(0, (l.base - l.topo - total) * 0.4);
  return dados.map((d, k) => {
    const y = topo + k * alturaFileira;
    const largura = direitaDaLinha(y) - l.esquerda;
    // rótulo menor quando a fileira é baixa (muitos dados): rótulo + pontos sempre cabem nela
    const rotulo = caber(d.rotulo, largura - 220, Math.min(44, Math.max(30, alturaFileira * 0.34)), 30, 1, 700);
    const pontosY = y + 14 + rotulo.tamanho * 1.1 + Math.min(30, alturaFileira * 0.18) + PONTO_BARRA.d / 2;
    return { topo: y, rotuloY: y + 14, pontosY, rotulo, largura, centro: y + alturaFileira / 2 };
  });
};

export const yDosPontosDaLinha = (m: Grafico) => {
  const l = layoutGrafico(m);
  const dados = m.dados ?? [];
  const valores = dados.map((d) => d.valor);
  const maior = Math.max(...valores, 0);
  const menor = Math.min(...valores, 0);
  const topo = l.topo + 90;
  const base = l.base - 110;
  return valores.map((v) => base - ((v - menor) / Math.max(1e-6, maior - menor)) * (base - topo));
};

// pizza: a grade de 100 pontos à esquerda e a legenda ao lado dela (colunas, não pilha)
export const PIZZA = { passo: 46, r: 16 };
export const gradeDaPizza = (m: Grafico) => {
  const l = layoutGrafico(m);
  const passo = Math.min(PIZZA.passo, Math.floor((l.base - l.topo) / 10));
  const lado = 10 * passo;
  const topo = l.topo + Math.max(0, (l.base - l.topo - lado) * 0.4);
  return { x: l.esquerda, topo, passo, r: Math.min(PIZZA.r, Math.round(passo * 0.35)), lado };
};
export const legendaDaPizza = (m: Grafico) => {
  const g = gradeDaPizza(m);
  const n = Math.max(1, (m.dados ?? []).length);
  const passo = Math.min(96, g.lado / n);
  const inicio = g.topo + (g.lado - passo * n) / 2 + passo / 2;
  return { x: g.x + g.lado + 70, ys: (m.dados ?? []).map((_, k) => inicio + k * passo) };
};
