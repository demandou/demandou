// A folha do documento: onde fica cada linha (em unidades da página; na escala 1 vale px).
// Cada momento que acontece na folha (riscar, marcar, reescrever e os blocos universais topicos,
// passos, definicao, frase, pergunta, numero, comparacao, grafico) vira uma seção, na ordem do vídeo;
// depois entram as seções extras do plano (texto apagado) e, se sobrar espaço, linhas a lápis.
// Todo texto é medido com a fonte de verdade (src/medida.ts): quebra em linhas e reduz o corpo até
// um mínimo legível, sempre dentro da largura `LARG` (o bilhete da margem nunca cobre texto).
import { normalizar, temposComAchados, temposDesde, temposDoTexto } from "./anim";
import { corpoQueCabe, encaixar, encaixarRotulo, type Estilo, type Fonte, formatarNumero, hifenizar, larguraLinha, larguraRotulo, larguraTexto, trechoNoTexto } from "./medida";
import type { Comparacao, Definicao, Frase, Grafico, Marcar, Momento, Numero, Palavra, Passos, Pergunta, Plano, Reescrever, Riscar, Topicos } from "./plano";
import { FOLHA } from "./tema";

export const CORPO = 42;
export const ALT_LINHA = 64;
export const ALT_TITULO = 60;
export const ALT_SUB = 56;
export const ALT_NOTA = 74;
export const ESPACO = 30;
// recuo das linhas com marcador
export const RECUO = 38;
export const X0 = FOLHA.margem;
export const X1 = FOLHA.w - FOLHA.margem;
// largura do texto da folha: termina antes da faixa do bilhete da margem
export const LARG = 548;
export const XT = X0 + LARG;
// altura de uma linha de texto num corpo
export const alturaDe = (tamanho: number) => Math.round(tamanho * 1.52);
// distância do topo da linha ao topo do texto (centraliza o texto na linha)
export const respiroDe = (tamanho: number) => Math.round(tamanho * 0.145);

// Estilos de texto da folha
export const TITULO_SECAO: Estilo = { fonte: "sans", peso: 700, espacamento: 0.16, caixaAlta: true };
export const SUBTITULO: Estilo = { fonte: "sans", peso: 600, espacamento: 0.14, caixaAlta: true };

export type LinhaFolha = {
  texto: string;
  y: number;
  // quando a tinta chega em cada palavra (sem tempos = impressa desde o começo)
  tempos?: number[];
  marcador?: boolean;
  // corpo, peso e x (padrão: 42, 400 e X0, ou X0 + RECUO com marcador)
  tamanho?: number;
  peso?: number;
  x?: number;
  // índice (no texto inteiro) da primeira palavra desta linha
  i0?: number;
  // largura medida (px na escala 1)
  w?: number;
};

// Texto à mão já quebrado (caneta): linhas de palavras, um tempo por palavra
export type Mao = { linhas: string[][]; tempos: number[]; tamanho: number; x: number; y: number; w: number };

export type ItemFolha = { linhas: LinhaFolha[]; em: number; topo: number; base: number; detalhe?: Mao };

export type Coluna = { x: number; w: number; rotulo: string; rotuloTam: number; linhas: LinhaFolha[]; topo: number; base: number; em: number };

export type GeoGrafico = {
  // caixa do desenho
  x: number;
  y: number;
  w: number;
  h: number;
  // rótulo de cada dado (barras/linha: embaixo do eixo; pizza: na legenda)
  rotulos: { linhas: string[][]; tamanho: number; x: number; y: number; w: number }[];
  // pizza: o círculo
  pizza?: { cx: number; cy: number; r: number };
  // onde vai a nota "ilustrativo" (canto de cima à direita da caixa)
  nota: { x: number; y: number };
};

export type SecaoFolha = {
  chave: string;
  // índice do momento no plano (ordenado); -1 = seção extra
  indice: number;
  tipo: Momento["tipo"] | "extra";
  titulo: string;
  // corpo do título da seção (caixa alta), as linhas dele (1 ou 2) e a altura que ocupa
  tituloTam?: number;
  tituloLinhas?: string[];
  altTitulo: number;
  y: number;
  fim: number;
  sub?: LinhaFolha;
  // linhas a mais do subtítulo, quando ele é longo
  subExtra?: LinhaFolha[];
  linhas: LinhaFolha[];
  // y da linha das notas à mão e o corpo delas
  notaY?: number;
  notaTam?: number;
  // ponto da folha para onde a seta do bilhete aponta
  ancora?: { x: number; y: number };
  // topicos, passos, pergunta (opções)
  itens?: ItemFolha[];
  // definição: o termo (tinta) e o significado (à mão)
  termo?: LinhaFolha[];
  significado?: Mao;
  // frase: trechos marcados (índices de palavras) e o instante do risco
  destaque?: [number, number] | null;
  risco?: [number, number] | null;
  riscoEm?: number;
  // número
  numero?: { y: number; tamanho: number; prefixo?: string; sufixo?: string; final: string; wPrefixo: number; wNumero: number; tamPrefixo: number; tamSufixo: number; notaY: number };
  // comparação
  colunas?: Coluna[];
  // gráfico
  grafico?: GeoGrafico;
};

export type Alvo = { secao: number; linha: number; y: number; marcador: boolean; x: number; tamanho: number };

export type Cabecalho = { linhas: string[][]; tamanho: number; subY: number; subTam: number; subLinhas: string[]; lapisY: number; reguaY: number };

export type Folha = {
  altura: number;
  titulo: string;
  subtitulo?: string;
  cabecalho: Cabecalho;
  secoes: SecaoFolha[];
  // linhas a lápis que completam a página (y e largura em fração)
  lapis: { y: number; w: number }[];
  // a linha que cada `reescrever` reescreve (índice do momento → linha)
  alvos: Record<number, Alvo>;
};

export const ordenar = (plano: Plano): Momento[] => [...plano.momentos].sort((a, b) => a.de - b.de);

// tempos "impressos": todas as palavras chegam quase juntas a partir de `em`
const temposDaLinha = (texto: string, em: number) => texto.split(/\s+/).filter(Boolean).map((_, i) => em + i * 0.05);

// tempos falados quando a fala tem as palavras; senão, impressos a partir de `em`
const temposOuImpresso = (texto: string, palavras: Palavra[], em: number, ate: number) => {
  const n = texto.split(/\s+/).filter(Boolean).length;
  const r = temposComAchados(texto, palavras, em - 0.05, Math.max(ate, em + 0.4), em, 0.05);
  return r.achados >= Math.max(1, n / 2) ? r.tempos.map((x) => Math.max(x, em - 0.05)) : temposDaLinha(texto, em);
};

// Quebra um texto em linhas da folha a partir de `y` e reparte os tempos por linha.
export const montarLinhas = (
  texto: string,
  tempos: number[] | undefined,
  y: number,
  o: { x: number; largura: number; max: number; min: number; linhas: number; fonte?: Fonte; peso?: number; marcador?: boolean },
) => {
  const e: Estilo = { fonte: o.fonte ?? "serifa", peso: o.peso ?? 400 };
  const enc = encaixar(texto, { largura: o.largura, max: o.max, min: o.min, linhas: o.linhas, ...e });
  const alt = alturaDe(enc.tamanho);
  let i0 = 0;
  const linhas: LinhaFolha[] = enc.linhas.map((ws, k) => {
    const l: LinhaFolha = {
      texto: ws.join(" "),
      y: y + k * alt,
      tempos: tempos?.slice(i0, i0 + ws.length),
      tamanho: enc.tamanho,
      peso: e.peso,
      x: o.x,
      i0,
      w: larguraLinha(ws, enc.tamanho, e),
      marcador: o.marcador && k === 0,
    };
    i0 += ws.length;
    return l;
  });
  return { linhas, fim: y + enc.linhas.length * alt, tamanho: enc.tamanho };
};

// Texto à mão (Playpen) quebrado em linhas
const montarMao = (texto: string, tempos: number[], x: number, y: number, largura: number, max: number, min: number, linhas = 2): Mao & { fim: number } => {
  const enc = encaixar(texto, { largura, max, min, linhas, fonte: "mao", peso: 600 });
  const w = Math.max(...enc.linhas.map((l) => larguraLinha(l, enc.tamanho, { fonte: "mao", peso: 600 })));
  return { linhas: enc.linhas, tempos, tamanho: enc.tamanho, x, y, w, fim: y + enc.linhas.length * Math.round(enc.tamanho * 1.22) };
};

const fimDaLinha = (l: LinhaFolha) => (l.x ?? X0) + (l.w ?? 0);

// Título de seção em caixa alta: cabe na largura do texto, em 1 ou 2 linhas, corpo 30 → 24
const tituloDaSecao = (titulo?: string, largura = LARG - 40) => (titulo ? encaixarRotulo(titulo, largura, 30, 24, 2) : { tamanho: 30, linhas: [] as string[] });
export const alturaDoTitulo = (linhas: number, tamanho: number) => (linhas ? ALT_TITULO + (linhas - 1) * Math.round(tamanho * 1.3) : 0);

// Tempos de uma lista de itens: cada item ganha tinta palavra por palavra a partir do seu `em`
const temposDoItem = (texto: string, palavras: Palavra[], em: number, ate: number) => temposDesde(texto, palavras, em, ate, 0.1);

export const montarFolha = (plano: Plano): Folha => {
  const momentos = ordenar(plano);
  const pal = plano.palavras;
  const doc = plano.documento ?? { titulo: plano.marca.nome || "Anotações" };
  const secoes: SecaoFolha[] = [];
  const alvos: Record<number, Alvo> = {};

  // cabeçalho: o título cabe em até 2 linhas; o resto desce junto
  const tit = encaixar(doc.titulo || " ", { largura: LARG, max: 64, min: 44, linhas: 2, fonte: "serifa", peso: 700 });
  const subY = 54 + tit.linhas.length * Math.round(tit.tamanho * 1.1) + 16;
  const sub = doc.subtitulo ? encaixarRotulo(doc.subtitulo, LARG, 30, 24, 2, 0.14, 600) : { tamanho: 30, linhas: [] as string[] };
  const lapisY = subY + 58 + Math.max(0, sub.linhas.length - 1) * Math.round(sub.tamanho * 1.3);
  const reguaY = lapisY + 40;
  let y = reguaY + 38;
  const cabecalho: Cabecalho = { linhas: tit.linhas, tamanho: tit.tamanho, subY, subTam: sub.tamanho, subLinhas: sub.linhas, lapisY, reguaY };

  const novaSecao = (m: Momento, indice: number, titulo = "", largura?: number): SecaoFolha => {
    const tt = tituloDaSecao(titulo, largura);
    return {
      chave: `${m.tipo[0]}${indice}`,
      indice,
      tipo: m.tipo,
      titulo,
      tituloTam: tt.tamanho,
      tituloLinhas: tt.linhas,
      altTitulo: alturaDoTitulo(tt.linhas.length, tt.tamanho),
      y,
      fim: 0,
      linhas: [],
    };
  };
  const fechar = (s: SecaoFolha, fim: number) => {
    s.fim = fim;
    secoes.push(s);
    y = fim + ESPACO;
  };
  // âncora padrão: o fim do título (ou da primeira linha), na altura dele
  const ancoraDoTitulo = (s: SecaoFolha, primeira?: LinhaFolha) =>
    s.titulo
      ? { x: X0 + larguraRotulo(s.tituloLinhas?.[0] ?? s.titulo, s.tituloTam ?? 30) + 26, y: s.y + 30 }
      : primeira
        ? { x: fimDaLinha(primeira) + 26, y: primeira.y + alturaDe(primeira.tamanho ?? CORPO) / 2 }
        : { x: XT, y: s.y + 30 };

  momentos.forEach((m, indice) => {
    const fimDoMomento = momentos[indice + 1]?.de ?? plano.duracao;
    switch (m.tipo) {
      case "riscar": {
        const r = m as Riscar;
        const s = novaSecao(m, indice, r.secao);
        const { linhas, fim } = montarLinhas(r.frase, temposDoTexto(r.frase, pal, r.de, r.ate), y + s.altTitulo, {
          x: X0,
          largura: LARG,
          max: CORPO,
          min: 34,
          linhas: 2,
        });
        s.linhas.push(...linhas);
        let yy = fim;
        if (r.nota) {
          s.notaY = yy;
          s.notaTam = corpoQueCabe(r.nota.texto, LARG - 8, 44, 32, { fonte: "mao", peso: 600 });
          s.ancora = { x: X0 + 4 + larguraLinha(r.nota.texto.split(/\s+/), s.notaTam, { fonte: "mao", peso: 600 }) + 26, y: yy + ALT_NOTA / 2 };
          yy += ALT_NOTA;
        } else s.ancora = { x: fimDaLinha(linhas[0]) + 26, y: linhas[0].y + ALT_LINHA / 2 };
        fechar(s, yy);
        return;
      }
      case "marcar": {
        const r = m as Marcar;
        const s = novaSecao(m, indice, r.secao);
        let yy = y + s.altTitulo;
        if (r.subtitulo) {
          // subtítulo: uma linha (36 → 30 px); longo, quebra em duas
          const enc = encaixar(r.subtitulo, { largura: LARG, max: 36, min: 30, linhas: 2, fonte: "serifa", peso: 600 });
          const tempos = temposOuImpresso(r.subtitulo, pal, r.de + 0.15, r.linhas[0]?.em ?? r.ate);
          let i0 = 0;
          const linhasSub: LinhaFolha[] = enc.linhas.map((ws, k) => {
            const l: LinhaFolha = {
              texto: ws.join(" "),
              y: yy + k * Math.round(enc.tamanho * 1.4),
              tempos: tempos.slice(i0, i0 + ws.length),
              tamanho: enc.tamanho,
              peso: 600,
              i0,
              w: larguraLinha(ws, enc.tamanho, { fonte: "serifa", peso: 600 }),
            };
            i0 += ws.length;
            return l;
          });
          s.sub = linhasSub[0];
          s.subExtra = linhasSub.slice(1);
          yy += ALT_SUB + (linhasSub.length - 1) * Math.round(enc.tamanho * 1.4);
        }
        r.linhas.forEach((l, k) => {
          const ate = r.linhas[k + 1]?.em ?? r.nota?.em ?? r.pergunta?.em ?? r.ate;
          const { linhas, fim } = montarLinhas(l.texto, temposOuImpresso(l.texto, pal, l.em, ate), yy, {
            x: X0 + RECUO,
            largura: LARG - RECUO,
            max: CORPO,
            min: 34,
            linhas: 2,
            marcador: true,
          });
          s.linhas.push(...linhas);
          yy = fim;
        });
        if (r.nota || r.pergunta) {
          s.notaY = yy + 6;
          const larg = (txt?: string, tam = 44) => (txt ? larguraLinha(txt.split(/\s+/), tam, { fonte: "mao", peso: 600 }) : 0);
          const total = (tam: number) => larg(r.nota?.texto, tam) + (r.pergunta ? 96 + larg(r.pergunta.texto, tam) : 0);
          let tam = 44;
          while (tam > 30 && total(tam) > LARG - 8) tam -= 1;
          s.notaTam = tam;
          yy += ALT_NOTA;
        }
        // o comentário aponta para o fim do subtítulo; sem subtítulo, para a linha mais longa
        if (s.sub) s.ancora = { x: X0 + (s.sub.w ?? 0) + 26, y: s.sub.y + ALT_LINHA / 2 };
        else {
          const maior = s.linhas.reduce((a, l) => (fimDaLinha(l) > fimDaLinha(a) ? l : a), s.linhas[0]);
          const ys = s.linhas.map((l) => l.y);
          s.ancora = { x: (maior ? fimDaLinha(maior) : XT) + 26, y: (Math.min(...ys) + Math.max(...ys) + ALT_LINHA) / 2 };
        }
        fechar(s, yy);
        return;
      }
      case "reescrever": {
        const r = m as Reescrever;
        // procura a linha nas seções já montadas
        const alvo = normalizar(r.antes);
        let achou: Alvo | null = null;
        secoes.forEach((s, si) =>
          s.linhas.forEach((l, li) => {
            if (!achou && normalizar(l.texto) === alvo)
              achou = { secao: si, linha: li, y: l.y, marcador: !!l.marcador, x: l.x ?? (l.marcador ? X0 + RECUO : X0), tamanho: l.tamanho ?? CORPO };
          }),
        );
        if (achou) {
          alvos[indice] = achou;
          return;
        }
        const s = novaSecao(m, indice, r.secao ?? "");
        const yy = y + s.altTitulo;
        const tam = corpoQueCabe(r.antes, LARG, CORPO, 30, { fonte: "serifa", peso: 400 });
        s.linhas.push({ texto: r.antes, y: yy, tamanho: tam, x: X0, w: larguraLinha(r.antes.split(/\s+/), tam) });
        alvos[indice] = { secao: secoes.length, linha: 0, y: yy, marcador: false, x: X0, tamanho: tam };
        fechar(s, yy + ALT_LINHA);
        return;
      }
      case "topicos":
      case "passos": {
        const r = m as Topicos | Passos;
        const s = novaSecao(m, indice, r.titulo);
        let yy = y + (r.titulo ? s.altTitulo : 10);
        const x = X0 + (r.tipo === "passos" ? 62 : RECUO);
        s.itens = r.itens.map((it, k) => {
          const ate = r.itens[k + 1]?.em ?? fimDoMomento;
          const topo = yy;
          const { linhas, fim } = montarLinhas(it.texto, temposDoItem(it.texto, pal, it.em, ate), yy, {
            x,
            largura: XT - x,
            max: CORPO,
            min: 34,
            linhas: 2,
            marcador: r.tipo === "topicos",
          });
          let base = fim;
          let detalhe: Mao | undefined;
          if (it.detalhe) {
            const tempos = temposDesde(it.detalhe, pal, it.em + 0.3, ate, 0.18);
            const d = montarMao(it.detalhe, tempos, x, fim - 6, XT - x, 36, 30, 2);
            detalhe = d;
            base = d.fim + 2;
          }
          yy = base + (r.tipo === "passos" ? 14 : 6);
          return { linhas, em: it.em, topo, base, detalhe };
        });
        s.ancora = ancoraDoTitulo(s, s.itens[0]?.linhas[0]);
        fechar(s, yy - 6);
        return;
      }
      case "definicao": {
        const r = m as Definicao;
        const s = novaSecao(m, indice);
        const termo = montarLinhas(r.termo, temposDesde(r.termo, pal, r.em, r.significadoEm, 0.12), y + 10, {
          x: X0,
          largura: LARG,
          max: 56,
          min: 40,
          linhas: 2,
          peso: 700,
        });
        s.termo = termo.linhas;
        const xm = X0 + 74;
        const sig = montarMao(r.significado, temposDesde(r.significado, pal, r.significadoEm, fimDoMomento, 0.2), xm, termo.fim + 8, XT - xm, 46, 34, 3);
        s.significado = sig;
        s.ancora = { x: fimDaLinha(termo.linhas[0]) + 26, y: termo.linhas[0].y + alturaDe(termo.tamanho) / 2 };
        fechar(s, sig.fim + 8);
        return;
      }
      case "frase": {
        const r = m as Frase;
        const s = novaSecao(m, indice);
        const em = r.em ?? r.de;
        const tempos = temposDesde(r.texto, pal, em, fimDoMomento, 0.14);
        const { linhas, fim } = montarLinhas(r.texto, tempos, y + 10, { x: X0, largura: LARG, max: 50, min: 36, linhas: 3, peso: 500 });
        s.linhas = linhas;
        s.destaque = trechoNoTexto(r.texto, r.destaque);
        s.risco = trechoNoTexto(r.texto, r.risco);
        if (s.risco) s.riscoEm = r.riscoEm ?? (tempos[s.risco[1]] ?? em) + 0.15;
        s.ancora = { x: fimDaLinha(linhas[0]) + 26, y: linhas[0].y + alturaDe(linhas[0].tamanho ?? CORPO) / 2 };
        fechar(s, fim + 4);
        return;
      }
      case "pergunta": {
        const r = m as Pergunta;
        const s = novaSecao(m, indice);
        const em = r.em ?? r.de;
        const primeira = r.opcoes?.[0]?.em ?? fimDoMomento;
        const q = montarLinhas(r.texto, temposDesde(r.texto, pal, em, primeira, 0.12), y + 10, { x: X0, largura: LARG, max: 52, min: 38, linhas: 3, peso: 700 });
        s.linhas = q.linhas;
        let yy = q.fim + 14;
        const x = X0 + 58;
        s.itens = (r.opcoes ?? []).map((o, k) => {
          const ate = r.opcoes![k + 1]?.em ?? fimDoMomento;
          const topo = yy;
          const { linhas, fim } = montarLinhas(o.texto, temposDoItem(o.texto, pal, o.em, ate), yy, { x, largura: XT - x, max: CORPO, min: 34, linhas: 2 });
          yy = fim + 10;
          return { linhas, em: o.em, topo, base: fim };
        });
        s.ancora = { x: fimDaLinha(q.linhas[0]) + 26, y: q.linhas[0].y + 36 };
        fechar(s, yy);
        return;
      }
      case "numero": {
        const r = m as Numero;
        const s = novaSecao(m, indice);
        const rotEm = r.rotuloEm ?? r.em;
        const rot = montarLinhas(r.rotulo, temposDesde(r.rotulo, pal, rotEm, Math.max(rotEm + 1.5, r.ate), 0.12), y + 10, {
          x: X0,
          largura: LARG,
          max: 46,
          min: 34,
          linhas: 2,
          peso: 500,
        });
        s.linhas = rot.linhas;
        const final = formatarNumero(r.valor, r.casas ?? 0);
        const sufixoCurto = !!r.sufixo && r.sufixo.trim().length <= 2;
        const largura = (tam: number) => {
          const tp = Math.round(tam * 0.42);
          const ts = Math.round(tam * (sufixoCurto ? 0.62 : 0.42));
          return (
            (r.prefixo ? larguraTexto(r.prefixo, tp, "serifa", 600) + tam * 0.2 : 0) +
            larguraTexto(final, tam, "serifa", 700) * 1.04 +
            (r.sufixo ? (sufixoCurto ? tam * 0.04 : tam * 0.12) + larguraTexto(r.sufixo, ts, "serifa", 600) : 0)
          );
        };
        let tam = 156;
        while (tam > 64 && largura(tam) > LARG) tam -= 2;
        const tamPrefixo = Math.round(tam * 0.42);
        const tamSufixo = Math.round(tam * (sufixoCurto ? 0.62 : 0.42));
        const ny = rot.fim + 4;
        const alt = Math.round(tam * 1.08);
        s.numero = {
          y: ny,
          tamanho: tam,
          prefixo: r.prefixo,
          sufixo: r.sufixo,
          final,
          wPrefixo: r.prefixo ? larguraTexto(r.prefixo, tamPrefixo, "serifa", 600) : 0,
          wNumero: larguraTexto(final, tam, "serifa", 700) * 1.04,
          tamPrefixo,
          tamSufixo,
          notaY: ny + alt + 6,
        };
        s.ancora = { x: fimDaLinha(rot.linhas[0]) + 26, y: rot.linhas[0].y + 30 };
        fechar(s, ny + alt + (r.ilustrativo ? 60 : 10));
        return;
      }
      case "comparacao": {
        const r = m as Comparacao;
        const s = novaSecao(m, indice, r.titulo);
        const topo = y + (r.titulo ? s.altTitulo : 10);
        const meio = 56;
        const w = (LARG - meio) / 2;
        const rotTam = Math.min(...r.lados.map((l) => encaixarRotulo(l.rotulo, w, 30, 22, 1).tamanho));
        s.colunas = r.lados.map((l, k) => {
          const x = X0 + k * (w + meio);
          const ate = k === 0 ? Math.max(r.lados[1].em, l.em + 0.6) : fimDoMomento;
          const { linhas, fim } = montarLinhas(l.texto, temposDesde(l.texto, pal, l.em, ate, 0.12), topo + 48, { x, largura: w, max: 48, min: 32, linhas: 3, peso: 600 });
          return { x, w, rotulo: l.rotulo, rotuloTam: rotTam, linhas, topo, base: fim, em: l.em };
        });
        const base = Math.max(...s.colunas.map((c) => c.base));
        s.ancora = ancoraDoTitulo(s, s.colunas[0].linhas[0]);
        fechar(s, base + 12);
        return;
      }
      case "grafico": {
        const r = m as Grafico;
        const dados = r.dados ?? [];
        const ilustrativo = !!r.ilustrativo || !dados.length;
        // a nota "ilustrativo" fica à direita do título (que fica mais estreito para dar lugar) ou numa linha própria
        const s = novaSecao(m, indice, r.titulo, ilustrativo ? LARG - 250 : undefined);
        const topo = y + (r.titulo ? s.altTitulo : ilustrativo ? 54 : 10);
        const nota = { x: XT, y: r.titulo ? y + 54 : y + 50 };
        let geo: GeoGrafico;
        if (r.forma === "pizza" && dados.length) {
          const raio = 128;
          const cx = X0 + raio + 8;
          const cy = topo + raio + 24;
          const lx = X0 + 2 * raio + 52;
          const lw = XT - lx;
          let ly = topo + 14;
          const rotulos = dados.map((d) => {
            const enc = encaixar(d.rotulo, { largura: lw, max: 34, min: 26, linhas: 2, fonte: "serifa", peso: 500 });
            const item = { linhas: enc.linhas, tamanho: enc.tamanho, x: lx, y: ly + 52, w: lw };
            ly += 52 + enc.linhas.length * Math.round(enc.tamanho * 1.2) + 14;
            return item;
          });
          geo = { x: X0, y: topo, w: LARG, h: Math.max(2 * raio + 48, ly - topo), rotulos, pizza: { cx, cy, r: raio }, nota };
          s.grafico = geo;
          s.ancora = ancoraDoTitulo(s);
          fechar(s, topo + geo.h + 10);
          return;
        }
        const n = Math.max(1, dados.length);
        const h = 290;
        const gx = X0 + 30;
        const gw = LARG - 30;
        const slot = gw / n;
        const estiloRot: Estilo = { fonte: "serifa", peso: 500 };
        // rótulo que não cabe nem em 20 px ganha hífen (no hífen que já tem, se houver)
        const rotuloCabe = (d: { rotulo: string }) => hifenizar(d.rotulo, slot - 10, 20, estiloRot);
        const tamanho = dados.length
          ? Math.min(...dados.map((d) => encaixar(rotuloCabe(d), { largura: slot - 10, max: 32, min: 20, linhas: 2, ...estiloRot }).tamanho))
          : 30;
        const rotulos = dados.map((d, k) => ({
          linhas: encaixar(rotuloCabe(d), { largura: slot - 10, max: tamanho, min: Math.min(tamanho, 20), linhas: 3, ...estiloRot }).linhas,
          tamanho,
          x: gx + k * slot,
          y: topo + 40 + h + 12,
          w: slot,
        }));
        const linhasRot = Math.max(0, ...rotulos.map((rr) => rr.linhas.length));
        s.grafico = { x: gx, y: topo + 40, w: gw, h, rotulos, nota };
        s.ancora = ancoraDoTitulo(s);
        fechar(s, topo + 40 + h + (linhasRot ? 12 + linhasRot * Math.round(tamanho * 1.2) : 0) + 10);
        return;
      }
      default:
        return;
    }
  });

  for (const e of doc.extras ?? []) {
    const tt = tituloDaSecao(e.titulo);
    const s: SecaoFolha = {
      chave: `x${secoes.length}`,
      indice: -1,
      tipo: "extra",
      titulo: e.titulo,
      tituloTam: tt.tamanho,
      tituloLinhas: tt.linhas,
      altTitulo: alturaDoTitulo(tt.linhas.length, tt.tamanho),
      y,
      fim: 0,
      linhas: [],
    };
    let yy = y + Math.max(ALT_TITULO, s.altTitulo);
    for (const l of e.linhas) {
      const tam = corpoQueCabe(l, LARG, CORPO, 30);
      s.linhas.push({ texto: l, y: yy, tamanho: tam, x: X0, w: larguraLinha(l.split(/\s+/), tam) });
      yy += ALT_LINHA;
    }
    s.fim = yy;
    secoes.push(s);
    y = yy + ESPACO;
  }

  // completa a página com linhas a lápis (o resto do documento, fora de foco)
  const lapis: { y: number; w: number }[] = [];
  const larguras = [0.92, 0.78, 0.86, 0.6, 0.9, 0.7, 0.82, 0.55];
  let k = 0;
  // (com o leque de `paginas`, a folha mantém o tamanho de uma página: o leque mostra folhas inteiras)
  const leque = momentos.some((m) => m.tipo === "paginas");
  const ate = Math.max(FOLHA.h - 70, secoes.length && !leque ? y + 1100 : 0);
  while (y + 40 < ate) {
    lapis.push({ y: y + 18, w: larguras[k % larguras.length] });
    y += 52;
    k++;
  }

  return {
    altura: Math.max(FOLHA.h, y + 70),
    titulo: doc.titulo,
    subtitulo: doc.subtitulo,
    cabecalho,
    secoes,
    lapis,
    alvos,
  };
};
