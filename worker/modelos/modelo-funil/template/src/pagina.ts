// A página de papel dos blocos universais (listas, passos, comparações, gráficos, definições):
// a mesma gramática da tela do funil. O conteúdo fica numa coluna à esquerda, de cima para baixo;
// a pessoa fica no bloco à direita e acompanha o item da vez (desce quando a fala desce).
//
// Tudo aqui é geometria pura (px no quadro 1080×1920), usada pelos componentes e pelo layout do bloco.
import type { Comparacao, Definicao, Grafico, Item, Momento, Passos, Topicos } from "./plano";
import { caber, H, medir, W } from "./tema";

// o bloco da pessoa nas páginas: retrato à direita da coluna
export const BLOCO_PAGINA = { w: 380, proporcao: 1.24, margem: 36, margemBaixo: 120, zonaDosBotoes: 1250, topoMin: 130 };
const ALTURA_BLOCO = Math.round(BLOCO_PAGINA.w * BLOCO_PAGINA.proporcao);
const FOLGA = 34;

export const PAGINA = {
  esquerda: 60,
  // a coluna termina antes do bloco (o bloco das páginas nunca desce até a zona dos botões do app)
  direita: W - BLOCO_PAGINA.margem - BLOCO_PAGINA.w - FOLGA,
  // abaixo da posição mais baixa do bloco, a linha pode ir quase até a borda (longe dos botões)
  linhaLivre: BLOCO_PAGINA.zonaDosBotoes + 20,
  direitaLivre: 940,
  base: 1480,
  etiquetaY: 136,
};

// direita da coluna para uma linha que começa em `topo`
export const direitaDaLinha = (topo: number) => (topo >= PAGINA.linhaLivre ? PAGINA.direitaLivre : PAGINA.direita);

// ——— cabeçalho: etiqueta ("ILUSTRATIVO") e título, na largura toda ———

export type Cabecalho = { etiqueta: boolean; titulo?: { y: number; tamanho: number; linhas: string[][] }; fundo: number };

export const cabecalho = (titulo: string | undefined, etiqueta: boolean): Cabecalho => {
  const yTitulo = etiqueta ? 214 : 150;
  if (!titulo?.trim()) return { etiqueta, fundo: etiqueta ? 200 : 150 };
  const { tamanho, linhas } = caber(titulo, W - 120, 80, 56, 2);
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
  // centro da primeira linha de texto (onde o marcador e o bloco miram)
  yTexto: number;
  // centro do conteúdo da linha
  centro: number;
};

const ENTRELINHA = 1.06;

// Distribui 2 a 5 itens na coluna, do fim do cabeçalho até a base: o maior corpo que cabe.
// A largura de cada linha depende de onde ela termina (embaixo a coluna é mais estreita), então a
// conta se repete até as larguras pararem de mudar.
export const linhasDaColuna = (itens: Item[], topo: number, x: number, maximo = 96, minimo = 52): Linha[] => {
  const n = Math.max(1, itens.length);
  const disponivel = PAGINA.base - topo;
  const montar = (corpo: number, larguras: number[], maxLinhas: number): Linha[] | null => {
    const conteudos = itens.map((it, k) => {
      const principal = caber(it.texto, larguras[k], corpo, Math.min(corpo, minimo), maxLinhas);
      const det = it.detalhe ? caber(it.detalhe, larguras[k], 44, 36, 2, 600) : undefined;
      const altura = principal.linhas.length * principal.tamanho * ENTRELINHA + (det ? 14 + det.linhas.length * det.tamanho * 1.12 : 0);
      return { principal, det, altura };
    });
    const soma = conteudos.reduce((s, c) => s + c.altura, 0);
    const folga = (disponivel - soma) / n;
    if (folga < 56) return null;
    const passo = Math.min(folga, 230);
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
  // houver, em até 3
  for (const maxLinhas of [2, 3]) {
    for (let corpo = maximo; corpo >= minimo; corpo -= 4) {
      let larguras = itens.map(() => PAGINA.direita - x);
      for (let volta = 0; volta < 4; volta++) {
        const linhas = montar(corpo, larguras, maxLinhas);
        if (!linhas) break;
        const certas = linhas.map((l) => direitaDaLinha(l.topo) - x);
        const cabe = linhas.every((l, k) => l.linhas.every((ws) => medir(ws.join(" "), l.tamanho) <= certas[k] + 1));
        if (cabe && linhas.every((l) => l.tamanho === corpo && l.linhas.length <= maxLinhas)) return linhas;
        larguras = certas.map((w, k) => Math.min(w, larguras[k]));
      }
    }
  }
  // último recurso: corpo mínimo, linhas iguais (nunca corta: o texto quebra em mais linhas)
  const altura = disponivel / n;
  return itens.map((it, k) => {
    const topoLinha = topo + k * altura;
    const p = caber(it.texto, direitaDaLinha(topoLinha) - x, 44, 40, 4);
    return {
      topo: topoLinha,
      fundo: topoLinha + altura,
      x,
      tamanho: p.tamanho,
      linhas: p.linhas,
      yTexto: topoLinha + 24 + (p.tamanho * ENTRELINHA) / 2,
      centro: topoLinha + altura / 2,
    };
  });
};

// ——— tópicos e passos ———

export const PONTO_TOPICO = 44;
export const X_TEXTO_TOPICOS = PAGINA.esquerda + PONTO_TOPICO + 30;
export const TUBO = { x: 60, largura: 100 };
export const X_TEXTO_PASSOS = TUBO.x + TUBO.largura + 34;

// gráfico com etiqueta "Ilustrativo" ou com a nota da unidade dos pontos (barras): o título desce
const temEtiqueta = (m: Momento) => m.tipo === "grafico" && (!!m.ilustrativo || !m.dados?.length || m.forma === "barras");

export const layoutTopicos = (m: Topicos) => {
  const cab = cabecalho(m.titulo, false);
  return { cab, linhas: linhasDaColuna(m.itens, cab.fundo + 40, X_TEXTO_TOPICOS) };
};

export const layoutPassos = (m: Passos) => {
  const cab = cabecalho(m.titulo, false);
  return { cab, linhas: linhasDaColuna(m.itens, cab.fundo + 40, X_TEXTO_PASSOS, 88, 50) };
};

// ——— comparação: dois lados, um embaixo do outro ———

export type Lado = { topo: number; rotuloY: number; textoY: number; tamanho: number; linhas: string[][]; fundo: number; centro: number };

export const layoutComparacao = (m: Comparacao) => {
  const cab = cabecalho(m.titulo, false);
  const topo = cab.fundo + 50;
  const separador = 250;
  const ROTULO = 64;
  const medir2 = (maximo: number) =>
    m.lados.map((l, k) => {
      const largura = PAGINA.direita - PAGINA.esquerda;
      const p = caber(l.texto, largura, maximo, 60, 3);
      return { ...p, altura: ROTULO + 22 + p.linhas.length * p.tamanho * ENTRELINHA };
    });
  // os dois lados com o mesmo corpo (o menor dos dois), o maior que cabe na altura
  let medidas = medir2(140);
  for (let maximo = 140; maximo >= 60; maximo -= 4) {
    medidas = medir2(maximo);
    const corpo = Math.min(...medidas.map((x) => x.tamanho));
    medidas = medir2(corpo);
    const total = medidas[0].altura + separador + medidas[1].altura;
    if (total <= PAGINA.base - topo - 40) break;
  }
  const total = medidas[0].altura + separador + medidas[1].altura;
  let y = topo + Math.max(0, (PAGINA.base - topo - total) * 0.45);
  const lados: Lado[] = medidas.map((med) => {
    const topoLado = y;
    const lado = {
      topo: topoLado,
      rotuloY: topoLado,
      textoY: topoLado + ROTULO + 22,
      tamanho: med.tamanho,
      linhas: med.linhas,
      fundo: topoLado + med.altura,
      centro: topoLado + med.altura / 2,
    };
    y += med.altura + separador;
    return lado;
  });
  return { cab, lados, separadorY: lados[0].fundo + separador / 2 };
};

// ——— definição: o termo, um funil pequeno e o significado ———

export const layoutDefinicao = (m: Definicao) => {
  const largura = PAGINA.direita - PAGINA.esquerda;
  const termo = caber(m.termo, largura, 150, 72, 2);
  const significado = caber(m.significado, largura, 92, 54, 3, 700);
  const termoAltura = termo.linhas.length * termo.tamanho * 1.02;
  const sigAltura = significado.linhas.length * significado.tamanho * ENTRELINHA;
  // o funil pequeno cresce para a composição ocupar a página de cima a baixo
  const livre = PAGINA.base - 20 - 180 - termoAltura - sigAltura - 100;
  const funilAltura = Math.round(Math.max(300, Math.min(640, livre)));
  const total = termoAltura + 50 + funilAltura + 50 + sigAltura;
  const topo = Math.max(170, 180 + (PAGINA.base - 20 - 180 - total) * 0.5);
  const termoY = topo;
  const funilY = termoY + termoAltura + 50;
  const sigY = funilY + funilAltura + 50;
  return {
    termo: { y: termoY, ...termo, centro: termoY + termoAltura / 2 },
    funil: { y: funilY, altura: funilAltura, x: PAGINA.esquerda, largura: Math.min(560, largura) },
    significado: { y: sigY, ...significado, centro: sigY + sigAltura / 2 },
  };
};

// ——— gráfico ———

export const layoutGrafico = (m: Grafico) => {
  const cab = cabecalho(m.titulo, temEtiqueta(m));
  const topo = cab.fundo + 60;
  return { cab, topo, base: PAGINA.base - 30, esquerda: PAGINA.esquerda, direita: PAGINA.direita };
};

// ——— onde o bloco da pessoa mira em cada página (o centro do rosto, em px) ———

export type FocoDaPagina = { em: number; y: number; topoMin?: number };

const posicoesDoGrafico = (m: Grafico): FocoDaPagina[] => {
  const l = layoutGrafico(m);
  const meio = (l.topo + l.base) / 2;
  if (m.dados?.length) {
    if (m.forma === "linha") {
      const ys = yDosPontosDaLinha(m);
      return m.dados.map((d, k) => ({ em: d.em, y: ys[k] }));
    }
    if (m.forma === "pizza") {
      const legenda = legendaDaPizza(m);
      return m.dados.map((d, k) => ({ em: d.em, y: legenda[k] ?? meio }));
    }
    const fileiras = fileirasDasBarras(m);
    return m.dados.map((d, k) => ({ em: d.em, y: fileiras[k]?.centro ?? meio }));
  }
  // tendência: o bloco acompanha a ponta da curva (sobe junto, desce junto)
  const fim = m.tendencia === "sobe" ? l.topo + 120 : m.tendencia === "cai" ? l.base - 120 : meio;
  const inicio = m.tendencia === "sobe" ? l.base - 160 : m.tendencia === "cai" ? l.topo + 160 : meio;
  return [
    { em: m.de, y: inicio },
    { em: m.tendenciaEm ?? m.de + (m.ate - m.de) * 0.5, y: fim },
  ];
};

const topoDoBloco = (cab: Cabecalho) => (cab.titulo ? cab.fundo + 28 : BLOCO_PAGINA.topoMin);

export const focosDaPagina = (m: Momento): FocoDaPagina[] => {
  switch (m.tipo) {
    case "topicos": {
      const l = layoutTopicos(m);
      return l.linhas.map((x, k) => ({ em: k === 0 ? m.de : m.itens[k].em - 0.1, y: x.yTexto + 40, topoMin: topoDoBloco(l.cab) }));
    }
    case "passos": {
      const l = layoutPassos(m);
      return l.linhas.map((x, k) => ({ em: k === 0 ? m.de : m.itens[k].em - 0.1, y: x.yTexto + 40, topoMin: topoDoBloco(l.cab) }));
    }
    case "comparacao": {
      const c = layoutComparacao(m);
      return [
        { em: m.de, y: c.lados[0].centro, topoMin: topoDoBloco(c.cab) },
        { em: m.lados[1].em - 0.1, y: c.lados[1].centro, topoMin: topoDoBloco(c.cab) },
      ];
    }
    case "definicao": {
      const d = layoutDefinicao(m);
      return [
        { em: m.de, y: d.termo.centro + 40 },
        { em: m.significadoEm - 0.1, y: d.significado.centro },
      ];
    }
    case "grafico": {
      const topoMin = topoDoBloco(layoutGrafico(m).cab);
      return posicoesDoGrafico(m).map((f) => ({ ...f, topoMin }));
    }
    default:
      return [];
  }
};

// a caixa do bloco com o rosto mais ou menos na altura `y`; nas páginas ele não desce até a zona
// dos botões do app (fica sempre a 36 px da borda direita)
export const caixaDaPagina = (y: number, zoom: number, ancoraY: number, topoMin: number = BLOCO_PAGINA.topoMin) => {
  const alt = ALTURA_BLOCO;
  const topo = Math.min(BLOCO_PAGINA.zonaDosBotoes - alt, Math.max(topoMin, y - alt * ancoraY));
  return { x: W - BLOCO_PAGINA.margem - BLOCO_PAGINA.w, y: topo, w: BLOCO_PAGINA.w, h: alt, raio: 24, zoom, ancoraY };
};

// ——— gráfico: as peças que o layout do bloco também precisa ———

// barras: uma fileira de pontos por dado; cada ponto vale um número redondo
export const REDONDOS = [0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1e6, 2e6, 5e6, 1e7, 1e8, 1e9];
export const PONTO_BARRA = { d: 32, passo: 42 };

export const unidadeDasBarras = (maior: number, cabem: number) => REDONDOS.find((u) => maior / u <= cabem) ?? maior / cabem;

export const fileirasDasBarras = (m: Grafico) => {
  const l = layoutGrafico(m);
  const dados = m.dados ?? [];
  const n = Math.max(1, dados.length);
  const alturaFileira = Math.min(230, (l.base - l.topo) / n);
  const total = alturaFileira * n;
  const topo = l.topo + Math.max(0, (l.base - l.topo - total) * 0.4);
  return dados.map((d, k) => {
    const y = topo + k * alturaFileira;
    const fundo = y + alturaFileira;
    const largura = direitaDaLinha(y) - l.esquerda;
    const rotulo = caber(d.rotulo, largura, 44, 34, 1, 700);
    return { topo: y, rotuloY: y + 20, pontosY: y + 20 + rotulo.tamanho * 1.1 + 30, rotulo, largura, centro: y + alturaFileira / 2 };
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

export const legendaDaPizza = (m: Grafico) => {
  const l = layoutGrafico(m);
  const lado = 10 * 46;
  const inicio = l.topo + lado + 70;
  return (m.dados ?? []).map((_, k) => inicio + k * 84 + 30);
};

export { H };
