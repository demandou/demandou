// Onde cada acorde fica na grade do momento `acordes` e em cada compasso do momento `compasso`.
// As duas medidas ficam juntas porque, quando um `compasso` vem logo depois de um `acordes` com os
// mesmos acordes, os diagramas não somem: eles viajam da grade para a linha de compassos.
import type { Area } from "./componentes/Cena";
import { medidasDoDiagrama } from "./componentes/Diagrama";

// um acorde desenhado: centro da cifra (x), topo da cifra, canto do diagrama e escala (px absolutos)
export type Lugar = { cx: number; topoCifra: number; dx: number; dy: number; escala: number };

// cifra 58 px + nome 34–36 px ao lado
export const TAMANHO_CIFRA = 58;
export const CABECALHO_ACORDE = 64;
export const CABECALHO_METRONOMO = 200;
// a cifra dentro do compasso: maior na linha dupla (sobra a coluna da esquerda)
export const cifraDoCompasso = (duasLinhas: boolean) => (duasLinhas ? 72 : 64);

// células da grade: 1 grande; 2 lado a lado; 3 = 2 em cima + 1 embaixo; 4 = 2 × 2 (na ordem de leitura,
// a mesma da linha de compassos em duas linhas: cada acorde viaja para o seu canto, sem cruzar)
export const celulasDosAcordes = (n: number, area: Area) => {
  const gap = 10;
  if (n <= 1) return [{ x: 0, y: 0, w: area.w, h: area.h }];
  const w = (area.w - gap) / 2;
  if (n === 2) return [0, 1].map((i) => ({ x: i * (w + gap), y: 0, w, h: area.h }));
  const h = (area.h - gap) / 2;
  return Array.from({ length: n }, (_, i) => {
    const sozinho = n === 3 && i === 2;
    return { x: sozinho ? (area.w - w) / 2 : (i % 2) * (w + gap), y: Math.floor(i / 2) * (h + gap), w, h };
  });
};

export const lugaresDosAcordes = (n: number, area: Area) =>
  celulasDosAcordes(n, area).map((c) => {
    const base = medidasDoDiagrama(1);
    // a maior escala que cabe na célula (com o cabeçalho), sem passar de 1,5
    const escala = Math.min(1.5, (c.h - CABECALHO_ACORDE - 2) / base.altura, (c.w - 20) / base.largura);
    const medida = medidasDoDiagrama(escala);
    const bloco = CABECALHO_ACORDE + medida.altura;
    const topo = area.y + c.y + (c.h - bloco) / 2;
    const esquerda = area.x + c.x + (c.w - medida.largura) / 2;
    const lugar: Lugar = { cx: esquerda + medida.largura / 2, topoCifra: topo, dx: esquerda, dy: topo + CABECALHO_ACORDE, escala };
    return { ...lugar, celula: { x: area.x + c.x, y: area.y + c.y, w: c.w, h: c.h }, medida };
  });

// A faixa de compassos. Com 4 compassos ela vira duas linhas (‖: G | D | / | Em | C :‖), com a cifra
// à esquerda e o diagrama à direita de cada compasso; com 2 ou 3, uma linha só, cifra em cima do diagrama.
// Sem a coluna ao lado da janela, o metrônomo pequeno e o andamento vão numa faixa em cima.
export const geometriaDoCompasso = (n: number, area: Area, comLado: boolean, comDiagrama = true) => {
  const REPETE = 46;
  const VAO = 56; // entre as duas linhas (a seta de troca da 1ª linha fica aqui)
  const ARCO = 50; // a seta de troca embaixo da última linha
  const duasLinhas = n >= 4;
  const porLinha = duasLinhas ? 2 : n;
  const cabecalho = comLado ? 0 : CABECALHO_METRONOMO;
  const larguraCompasso = (area.w - 2 * REPETE) / porLinha;
  const base = medidasDoDiagrama(1);
  const disponivel = area.h - cabecalho - ARCO - (duasLinhas ? VAO : 0);
  let alturaLinha: number;
  let escalaMini = 0;
  if (duasLinhas) {
    alturaLinha = Math.min(300, disponivel / 2);
    if (comDiagrama) escalaMini = Math.min(0.8, (alturaLinha - 44) / base.altura, (larguraCompasso - 170) / base.largura);
  } else {
    if (comDiagrama) escalaMini = Math.min(0.8, (larguraCompasso - 30) / base.largura, (disponivel - 50 - 70 - 48) / base.altura);
    alturaLinha = 50 + 70 + (comDiagrama ? medidasDoDiagrama(escalaMini).altura + 14 : 0) + 40;
  }
  const mini = medidasDoDiagrama(escalaMini);
  const linhas = duasLinhas ? Math.ceil(n / 2) : 1;
  const blocoTotal = linhas * alturaLinha + (linhas - 1) * VAO + ARCO;
  const topoFaixa = cabecalho + Math.max(0, (area.h - cabecalho - blocoTotal) / 2);
  // posição de cada compasso (relativa à área)
  const caixas = Array.from({ length: n }, (_, i) => {
    const linha = duasLinhas ? Math.floor(i / 2) : 0;
    const coluna = duasLinhas ? i % 2 : i;
    return { x: REPETE + coluna * larguraCompasso, y: topoFaixa + linha * (alturaLinha + VAO), w: larguraCompasso, h: alturaLinha, linha, coluna };
  });
  // cifra e diagrama de cada compasso (absolutos, para a passagem)
  const colunaCifra = duasLinhas ? larguraCompasso - (comDiagrama ? mini.largura + 24 : 0) : larguraCompasso;
  const lugares: Lugar[] = caixas.map((c) =>
    duasLinhas
      ? {
          cx: area.x + c.x + 14 + colunaCifra / 2,
          topoCifra: area.y + c.y + (comDiagrama ? 58 : c.h / 2 - 38),
          dx: area.x + c.x + c.w - mini.largura - 12,
          dy: area.y + c.y + (c.h - mini.altura) / 2 + 2,
          escala: escalaMini,
        }
      : {
          cx: area.x + c.x + c.w / 2,
          topoCifra: area.y + c.y + 50,
          dx: area.x + c.x + (c.w - mini.largura) / 2,
          dy: area.y + c.y + 50 + 76,
          escala: escalaMini,
        },
  );
  return { REPETE, VAO, ARCO, duasLinhas, larguraCompasso, alturaLinha, escalaMini, mini, topoFaixa, caixas, lugares, linhas };
};
