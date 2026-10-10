// Diagramação dos blocos universais no estilo Manifesto.
//
// Todo bloco universal de pôster vira uma PILHA centralizada sobre o campo de cor: unidades de texto
// (que se montam palavra por palavra), letreiros pequenos, a palavra-janela (ou o contador, o "VS",
// o círculo) e, no gráfico, a área do desenho. A pilha é montada em volta do rosto: a janela fica
// na altura dele; se não couber, a pilha desce ou sobe e o vídeo desliza junto (aproximando só o
// necessário). Todo texto é medido com as larguras da fonte e reduzido até caber (nunca vaza).
import { temposPorConteudo } from "./anim";
import { acharTrecho, candidatas, limpar, linhasDaJanela } from "./janela";
import { type Desenho, type JanelaPosta, medidasDaJanela, vaoEntre, zoomQueCobre } from "./layout";
import type { Grafico, Palavra, Plano, Universal } from "./plano";
import {
  APERTO,
  BASE_COM_ASSINATURA,
  BASE_UTIL,
  caber,
  encaixar,
  LARGURA_JANELA,
  LARGURA_TEXTO,
  MAIUSCULA,
  QUADRO,
  quebrarMono,
  TOPO_UTIL,
} from "./tema";

export type Tinta = "texto" | "acento" | "letreiro";
export type IconeB = "comentar" | "salvar" | "seguir" | "enviar" | "link";

// Uma linha já posta no pôster.
export type LinhaB = {
  palavras: string[];
  tempos: number[];
  y: number;
  tamanho: number;
  peso: 500 | 700 | 900;
  // letreiro em DM Mono (rótulos, "OU", "ILUSTRATIVO")
  mono?: boolean;
  tinta: Tinta;
  // comparação: 0 = campo de cima, 1 = campo de baixo
  lado?: 0 | 1;
  // instante em que um risco passa por cima da linha
  risco?: number;
  // a partir daqui a linha vira tom secundário (o item que já passou)
  apagaEm?: number;
  icone?: IconeB;
};

export type Seta = { y1: number; y2: number; em: number };

export type GraficoPosto = {
  x: number;
  y: number;
  w: number;
  h: number;
  forma: Grafico["forma"];
  dados?: Grafico["dados"];
  tendencia?: Grafico["tendencia"];
  tendenciaEm: number;
  unidade?: string;
  ilustrativo: boolean;
  de: number;
  ate: number;
};

export type DesenhoB = Desenho & {
  bloco: true;
  linhasB: LinhaB[];
  setas: Seta[];
  // comparação: y da emenda entre os dois campos
  divisao?: number;
  grafico?: GraficoPosto;
  assinatura: boolean;
  icone?: IconeB;
};

// ——— As unidades da pilha ———
type Papel = "titulo" | "grande" | "corpo" | "item" | "lado" | "rotulo" | "detalhe" | "risco" | "opcao" | "igual";
const PAPEIS: Record<Papel, { max: number; min: number; linhas: number; peso: 700 | 900 }> = {
  titulo: { max: 104, min: 60, linhas: 3, peso: 900 },
  grande: { max: 150, min: 72, linhas: 3, peso: 900 },
  corpo: { max: 100, min: 56, linhas: 3, peso: 900 },
  item: { max: 88, min: 56, linhas: 2, peso: 900 },
  lado: { max: 104, min: 60, linhas: 3, peso: 900 },
  rotulo: { max: 56, min: 44, linhas: 2, peso: 700 },
  detalhe: { max: 46, min: 44, linhas: 2, peso: 700 },
  risco: { max: 128, min: 60, linhas: 2, peso: 900 },
  opcao: { max: 80, min: 56, linhas: 2, peso: 900 },
  igual: { max: 120, min: 72, linhas: 1, peso: 900 },
};

type UTexto = {
  tipo: "texto";
  palavras: string[];
  tempos: number[];
  papel: Papel;
  tinta?: Tinta;
  lado?: 0 | 1;
  risco?: number;
  apagaEm?: number;
  icone?: IconeB;
};
type UMono = { tipo: "mono"; texto: string; em: number; lado?: 0 | 1; tinta?: Tinta };
type UJanela = { tipo: "janela"; linhas: string[]; em: number; batidas?: number[]; trocas?: { em: number; linhas: string[] }[]; lado?: 0 | 1 };
type UCirculo = { tipo: "circulo"; em: number };
type UGrafico = { tipo: "grafico"; ideal: number; minimo: number };
type USeta = { tipo: "seta"; em: number };
type Unidade = UTexto | UMono | UJanela | UCirculo | UGrafico | USeta;

const MONO = 32;
const VAO = 38; // entre unidades
const VAO_JANELA = 40;
const VAO_ROTULO = 14; // letreiro → texto dele
const VAO_ITEM = 26;
const SETA = 70;
const JANELA_MAX = 640;
const JANELA_BOA = 300;
const CIRCULO_MAX = 270;
const CIRCULO_MIN = 150;

// palavras do texto com o tempo de cada uma (a k-ésima escrita bate na k-ésima falada a partir de `em`)
const comTempos = (texto: string, em: number, palavras: Palavra[], limite: number) => {
  const ws = texto.trim().split(/\s+/).filter(Boolean);
  return { ws, ts: temposPorConteudo(texto, em, palavras, limite) };
};

// ——— Medida de cada unidade num fator de escala ———
type Medida =
  | { u: UTexto; altura: number; linhas: string[][]; tamanho: number; peso: 500 | 700 | 900 }
  | { u: UMono; altura: number; linhas: string[] }
  | { u: UJanela; altura: number; tamanho: number }
  | { u: UCirculo; altura: number; r: number }
  | { u: UGrafico; altura: number }
  | { u: USeta; altura: number };

const alturaDasLinhas = (linhas: string[][], tamanho: number) =>
  linhas.reduce((h, l, i) => h + (i > 0 ? vaoEntre({ texto: linhas[i - 1].join(" "), tamanho }, { texto: l.join(" "), tamanho }) : 0) + tamanho, 0);

const medirTexto = (u: UTexto, fator: number) => {
  const p = PAPEIS[u.papel];
  const max = Math.max(p.min, Math.round(p.max * fator));
  const e = encaixar(u.palavras, LARGURA_TEXTO, max, p.min, p.linhas, p.peso);
  // com ícone, a primeira linha perde a largura dele
  if (u.icone) {
    const e2 = encaixar(u.palavras, LARGURA_TEXTO - 1.3 * e.tamanho, max, p.min, p.linhas, p.peso);
    return { u, linhas: e2.linhas, tamanho: e2.tamanho, peso: e2.peso, altura: alturaDasLinhas(e2.linhas, e2.tamanho) };
  }
  return { u, linhas: e.linhas, tamanho: e.tamanho, peso: e.peso, altura: alturaDasLinhas(e.linhas, e.tamanho) };
};

const vaoDepois = (a: Medida, b: Medida) => {
  if (a.u.tipo === "seta" || b.u.tipo === "seta") return 0;
  if (a.u.tipo === "janela" || b.u.tipo === "janela" || a.u.tipo === "circulo" || b.u.tipo === "circulo") return VAO_JANELA;
  if (a.u.tipo === "mono" && b.u.tipo === "texto") return VAO_ROTULO;
  if (a.u.tipo === "texto" && a.u.papel === "rotulo" && b.u.tipo === "texto") return VAO_ROTULO;
  if (a.u.tipo === "texto" && b.u.tipo === "texto" && a.u.papel === "item" && b.u.papel === "detalhe") return 10;
  if (a.u.tipo === "texto" && (a.u.papel === "item" || a.u.papel === "detalhe") && b.u.tipo === "texto" && b.u.papel === "item") return VAO_ITEM;
  if (a.u.tipo === "texto" && b.u.tipo === "mono") return VAO_ITEM;
  return VAO;
};

type Pilha = { medidas: Medida[]; total: number; janela: number; ok: boolean };

// `acima` e `abaixo`: a escala do texto antes e depois da janela (o de cima decide a altura do rosto;
// o de baixo, se o pôster fica cheio)
const medirPilha = (unidades: Unidade[], acima: number, abaixo: number, disponivel: number): Pilha => {
  const iJanela = unidades.findIndex((u) => u.tipo === "janela" || u.tipo === "circulo");
  const fixas: Medida[] = unidades.map((u, i) => {
    if (u.tipo === "texto") return medirTexto(u, iJanela >= 0 && i < iJanela ? acima : abaixo);
    if (u.tipo === "mono") {
      const linhas = quebrarMono(u.texto, LARGURA_TEXTO, MONO);
      return { u, linhas, altura: linhas.length * MONO + (linhas.length - 1) * 10 };
    }
    if (u.tipo === "seta") return { u, altura: SETA };
    if (u.tipo === "grafico") return { u, altura: u.ideal };
    if (u.tipo === "circulo") return { u, altura: 0, r: 0 };
    return { u, altura: 0, tamanho: 0 };
  });
  const vaos = fixas.reduce((s, m, i) => s + (i > 0 ? vaoDepois(fixas[i - 1], m) : 0), 0);
  let resto = disponivel - vaos - fixas.reduce((s, m) => s + m.altura, 0);
  // o gráfico cede espaço para a janela até o mínimo dele
  const g = fixas.find((m) => m.u.tipo === "grafico");
  const jIdx = fixas.findIndex((m) => m.u.tipo === "janela" || m.u.tipo === "circulo");
  let tamJanela = 0;
  if (jIdx >= 0) {
    const m = fixas[jIdx];
    if (m.u.tipo === "janela") {
      const medidas = medidasDaJanela(m.u.linhas);
      const todas = [m.u.linhas, ...(m.u.trocas ?? []).map((t) => t.linhas)];
      const pelaLargura = Math.min(...todas.flatMap((ls) => ls.map((l) => caber(l, LARGURA_JANELA, JANELA_MAX, 900, APERTO))));
      const quer = Math.min(pelaLargura, JANELA_BOA / MAIUSCULA);
      if (g && resto / medidas.altura < quer) {
        const cede = Math.min(g.altura - (g.u as UGrafico).minimo, quer * medidas.altura - resto);
        g.altura -= Math.max(0, cede);
        resto += Math.max(0, cede);
      }
      const tam = Math.max(0, Math.min(pelaLargura, Math.floor(resto / medidas.altura)));
      // a "força" da janela é a altura da maiúscula: é nela que o rosto aparece
      tamJanela = tam * MAIUSCULA;
      fixas[jIdx] = { u: m.u, tamanho: tam, altura: tam * medidas.altura };
    } else if (m.u.tipo === "circulo") {
      if (g && resto < 2 * CIRCULO_MAX) {
        const cede = Math.min(g.altura - (g.u as UGrafico).minimo, 2 * CIRCULO_MAX - resto);
        g.altura -= Math.max(0, cede);
        resto += Math.max(0, cede);
      }
      const r = Math.max(0, Math.min(CIRCULO_MAX, Math.floor(resto / 2)));
      tamJanela = r * 1.1; // equivalente, para comparar com a janela de letras
      fixas[jIdx] = { u: m.u, r, altura: 2 * r };
    }
  }
  const total = vaos + fixas.reduce((s, m) => s + m.altura, 0);
  const janelaOk =
    jIdx < 0 ||
    (fixas[jIdx].u.tipo === "janela" ? (fixas[jIdx] as { tamanho: number }).tamanho * MAIUSCULA >= 150 : (fixas[jIdx] as { r: number }).r >= CIRCULO_MIN);
  return { medidas: fixas, total, janela: tamJanela, ok: total <= disponivel + 0.5 && janelaOk };
};

// (JANELA_BOA: altura da maiúscula da janela, em px, a partir da qual o rosto lê bem)
// Os tamanhos possíveis da pilha: do texto maior (pôster com pouco texto, para não sobrar vazio)
// ao menor (muito texto, ou para subir a janela até o rosto). Quem escolhe é o custo, em `escolher`.
const FATORES = [1.3, 1.15, 1, 0.9, 0.8, 0.7, 0.6, 0.52];
const pilhas = (unidades: Unidade[], disponivel: number) => {
  const temJanela = unidades.some((u) => u.tipo === "janela" || u.tipo === "circulo");
  const temAcima = temJanela && unidades.findIndex((u) => u.tipo === "janela" || u.tipo === "circulo") > 0;
  const saida: { acima: number; abaixo: number; p: Pilha }[] = [];
  for (const acima of temAcima ? FATORES : [1])
    for (const abaixo of FATORES) saida.push({ acima, abaixo, p: medirPilha(unidades, acima, abaixo, disponivel) });
  return saida;
};
// o quanto encolher ou crescer o texto custa (encolher o de baixo pesa mais: é o conteúdo)
const custoDoFator = (f: number, peso: number) => (f < 1 ? (1 - f) * peso : (f - 1) * 0.4);

// ——— Pôr a pilha na tela ———
const porNaTela = (plano: Plano, pilha: Pilha, limiteBaixo: number, de: number) => {
  const rostoY = plano.rosto.y * QUADRO.h;
  const ms = pilha.medidas;
  // deslocamento do centro da janela a partir do topo da pilha
  let off = 0;
  let centro = -1;
  ms.forEach((m, i) => {
    if (i > 0) off += vaoDepois(ms[i - 1], m);
    if ((m.u.tipo === "janela" || m.u.tipo === "circulo") && centro < 0) {
      centro = m.u.tipo === "janela" ? off + (medidasDaJanela(m.u.linhas).capas[0] + MAIUSCULA * 0.5) * (m as { tamanho: number }).tamanho : off + m.altura / 2;
    }
    off += m.altura;
  });
  const ideal = centro >= 0 ? rostoY - centro : TOPO_UTIL + (limiteBaixo - TOPO_UTIL - pilha.total) / 2;
  const y0 = Math.max(TOPO_UTIL, Math.min(limiteBaixo - pilha.total, ideal));

  const linhas: LinhaB[] = [];
  const setas: Seta[] = [];
  let janela: JanelaPosta | undefined;
  let grafico: { y: number; h: number } | undefined;
  let y = y0;
  ms.forEach((m, i) => {
    if (i > 0) y += vaoDepois(ms[i - 1], m);
    const u = m.u;
    if (u.tipo === "texto" && "linhas" in m) {
      const mm = m as { linhas: string[][]; tamanho: number; peso: 500 | 700 | 900 };
      let k = 0;
      let yy = y;
      mm.linhas.forEach((l, j) => {
        if (j > 0) yy += vaoEntre({ texto: mm.linhas[j - 1].join(" "), tamanho: mm.tamanho }, { texto: l.join(" "), tamanho: mm.tamanho });
        linhas.push({
          palavras: l,
          tempos: u.tempos.slice(k, k + l.length),
          y: yy,
          tamanho: mm.tamanho,
          peso: mm.peso,
          tinta: u.tinta ?? (u.papel === "detalhe" ? "letreiro" : "texto"),
          lado: u.lado,
          risco: u.risco,
          apagaEm: u.apagaEm,
          icone: j === 0 ? u.icone : undefined,
        });
        k += l.length;
        yy += mm.tamanho;
      });
    } else if (u.tipo === "mono" && "linhas" in m) {
      (m.linhas as string[]).forEach((l, j) =>
        linhas.push({ palavras: [l], tempos: [u.em], y: y + j * (MONO + 10), tamanho: MONO, peso: 500, mono: true, tinta: u.tinta ?? "letreiro", lado: u.lado }),
      );
    } else if (u.tipo === "janela") {
      const tam = (m as { tamanho: number }).tamanho;
      const med = medidasDaJanela(u.linhas);
      janela = {
        linhas: u.linhas.map((texto, k) => ({ texto, base: y + (med.capas[k] + MAIUSCULA) * tam })),
        tamanho: tam,
        topo: y,
        altura: m.altura,
        em: Math.max(u.em, de + 0.15),
        batidas: u.batidas ?? [],
        trocas: u.trocas,
      };
    } else if (u.tipo === "circulo") {
      const r = (m as { r: number }).r;
      janela = { linhas: [], tamanho: 0, topo: y, altura: 2 * r, em: Math.max(u.em, de + 0.15), batidas: [], circulo: { cx: QUADRO.w / 2, cy: y + r, r } };
    } else if (u.tipo === "seta") {
      setas.push({ y1: y + 8, y2: y + m.altura - 8, em: u.em });
    } else if (u.tipo === "grafico") {
      grafico = { y, h: m.altura };
    }
    y += m.altura;
  });

  const alvoY = janela ? (janela.circulo ? janela.circulo.cy : janela.topo + (medidasDaJanela(janela.linhas.map((l) => l.texto)).capas[0] + MAIUSCULA * 0.5) * janela.tamanho) : rostoY;
  const alvo = { x: QUADRO.w / 2, y: alvoY };
  const escala = zoomQueCobre(plano, alvo.x, alvo.y);
  return { linhas, setas, janela, grafico, alvo, escala, y0 };
};

// ——— O texto falado de um bloco, dividido em trechos (normal, destaque, risco) e a janela ———
type Fluxo = { unidades: Unidade[]; janelaIdx: number };

const fluxo = (
  ws: string[],
  ts: number[],
  opcoes: { destaque?: string; risco?: string; riscoEm?: number; janela: number | "circulo" | { linhas: string[]; em: number } | null; papel?: Papel; icone?: IconeB; lado?: 0 | 1 },
): Fluxo => {
  const dst = acharTrecho(ws, opcoes.destaque);
  const rsc = acharTrecho(ws, opcoes.risco);
  const papelNormal: Papel = opcoes.papel ?? (dst ? "corpo" : "titulo");
  const papelDe = (i: number): { papel: Papel; tinta?: Tinta; risco?: number } => {
    if (rsc && i >= rsc.de && i < rsc.ate) return { papel: "risco", risco: opcoes.riscoEm ?? ts[rsc.ate - 1] + 0.25 };
    if (dst && i >= dst.de && i < dst.ate) return { papel: "grande", tinta: "acento" };
    return { papel: papelNormal };
  };
  const unidades: Unidade[] = [];
  let janelaIdx = -1;
  let atual: UTexto | null = null;
  let chave = "";
  const fechar = () => {
    if (atual && atual.palavras.length) unidades.push(atual);
    atual = null;
    chave = "";
  };
  ws.forEach((w, i) => {
    if (typeof opcoes.janela === "number" && i === opcoes.janela) {
      fechar();
      janelaIdx = unidades.length;
      unidades.push({ tipo: "janela", linhas: linhasDaJanela(w), em: ts[i], lado: opcoes.lado });
      return;
    }
    const p = papelDe(i);
    const k = `${p.papel}-${p.tinta ?? ""}`;
    if (!atual || k !== chave) {
      fechar();
      atual = { tipo: "texto", palavras: [], tempos: [], papel: p.papel, tinta: p.tinta, risco: p.risco, lado: opcoes.lado, icone: unidades.length === 0 ? opcoes.icone : undefined };
      chave = k;
    }
    const a = atual as UTexto;
    a.palavras.push(w);
    a.tempos.push(ts[i]);
  });
  fechar();
  if (opcoes.janela === "circulo") {
    janelaIdx = unidades.length;
    unidades.push({ tipo: "circulo", em: ts[0] ?? 0 });
  } else if (opcoes.janela && typeof opcoes.janela === "object") {
    janelaIdx = unidades.length;
    unidades.push({ tipo: "janela", linhas: opcoes.janela.linhas, em: opcoes.janela.em, lado: opcoes.lado });
  }
  return { unidades, janelaIdx };
};

// A janela pedida no plano: "" = círculo; uma palavra do texto = ela; outra palavra = no fim.
const janelaPedida = (pedido: string | undefined, ws: string[], ts: number[], emPadrao: number) => {
  if (pedido === undefined) return undefined;
  if (pedido.trim() === "") return "circulo" as const;
  const alvo = limpar(pedido.replace(/\//g, ""));
  const i = ws.findIndex((w) => limpar(w) === alvo);
  if (i >= 0) return { indice: i, linhas: linhasDaJanela(pedido.includes("/") ? pedido : ws[i]) };
  return { indice: -1, linhas: linhasDaJanela(pedido), em: ts[0] ?? emPadrao };
};

// ——— Escolhe a melhor janela: a que deixa o rosto mais perto do lugar dele, com a pilha cabendo ———
type Opcao = { unidades: Unidade[]; preferencia: number };

const escolher = (plano: Plano, opcoes: Opcao[], limiteBaixo: number, de: number) => {
  const disponivel = limiteBaixo - TOPO_UTIL;
  // o zoom que o quadro cheio já pede (rosto fora do centro): não conta como afastar o rosto
  const base = zoomQueCobre(plano, QUADRO.w / 2, plano.rosto.y * QUADRO.h);
  let melhor: { custo: number; r: ReturnType<typeof porNaTela> } | null = null;
  for (const o of opcoes) {
    for (const { acima, abaixo, p: pilha } of pilhas(o.unidades, disponivel)) {
      const r = porNaTela(plano, pilha, limiteBaixo, de);
      // o rosto longe do lugar dele pede zoom (e a pessoa vira um pedaço de rosto nas letras)
      const zoom = Math.max(0, r.escala / base - 1.04) * 10;
      const pequena = Math.max(0, JANELA_BOA - pilha.janela) / 90;
      const vazio = Math.max(0, (disponivel - pilha.total) / disponivel - 0.1) * 5;
      const texto = custoDoFator(acima, 1.5) + custoDoFator(abaixo, 3);
      const custo = zoom + o.preferencia + pequena + vazio + texto + (pilha.ok ? 0 : 50);
      if (!melhor || custo < melhor.custo) melhor = { custo, r };
    }
  }
  return melhor!.r;
};

// As opções de janela de um texto: a pedida, ou as candidatas (até 4) e o círculo.
const opcoesDeTexto = (
  ws: string[],
  ts: number[],
  m: { janela?: string; destaque?: string; risco?: string; riscoEm?: number },
  extra: (f: Fluxo) => Unidade[],
  base: { papel?: Papel; icone?: IconeB; emPadrao: number },
): Opcao[] => {
  const pedida = janelaPedida(m.janela, ws, ts, base.emPadrao);
  const montar = (janela: Parameters<typeof fluxo>[2]["janela"]) => {
    const f = fluxo(ws, ts, { destaque: m.destaque, risco: m.risco, riscoEm: m.riscoEm, janela, papel: base.papel, icone: base.icone });
    return extra(f);
  };
  if (pedida === "circulo") return [{ unidades: montar("circulo"), preferencia: 0 }];
  if (pedida) return [{ unidades: montar(pedida.indice >= 0 ? pedida.indice : { linhas: pedida.linhas, em: pedida.em ?? base.emPadrao }), preferencia: 0 }];
  const rsc = acharTrecho(ws, m.risco);
  const cands = candidatas(ws, acharTrecho(ws, m.destaque)).filter((i) => !rsc || i < rsc.de || i >= rsc.ate).slice(0, 4);
  return [...cands.map((i, k) => ({ unidades: montar(i), preferencia: k * 0.5 })), { unidades: montar("circulo"), preferencia: 2.5 }];
};

const juntar = (f: Fluxo) => f.unidades;

// ——— Cada bloco universal ———
export const desenhoDoBloco = (plano: Plano, m: Universal, palavras: Palavra[], ate: number): DesenhoB => {
  const limite = m.tipo === "cta" && plano.marca?.nome ? BASE_COM_ASSINATURA : BASE_UTIL;
  const fim = ate;
  const emTexto = "em" in m && typeof m.em === "number" ? m.em : m.de;
  let r: ReturnType<typeof porNaTela>;
  let divisao: number | undefined;
  let grafico: GraficoPosto | undefined;

  switch (m.tipo) {
    case "abertura":
    case "frase":
    case "cta": {
      const { ws, ts } = comTempos(m.texto, emTexto, palavras, fim);
      const icone = m.tipo === "cta" ? (m.icone ?? "link") : undefined;
      r = escolher(plano, opcoesDeTexto(ws, ts, m, juntar, { icone, emPadrao: emTexto }), limite, m.de);
      break;
    }
    case "pergunta": {
      const { ws, ts } = comTempos(m.texto, emTexto, palavras, m.opcoes?.[0]?.em ?? fim);
      const opcoes = [...(m.opcoes ?? [])].sort((a, b) => a.em - b.em);
      const extra = (f: Fluxo): Unidade[] => {
        const us = [...f.unidades];
        opcoes.forEach((o, k) => {
          const prox = opcoes[k + 1]?.em ?? fim;
          const t = comTempos(o.texto, o.em, palavras, prox);
          if (k > 0) us.push({ tipo: "mono", texto: "ou", em: o.em - 0.05, tinta: "acento" });
          us.push({ tipo: "texto", palavras: t.ws, tempos: t.ts, papel: "opcao" });
        });
        return us;
      };
      r = escolher(plano, opcoesDeTexto(ws, ts, m, extra, { papel: opcoes.length ? "corpo" : undefined, emPadrao: emTexto }), limite, m.de);
      break;
    }
    case "definicao": {
      const termo = comTempos(m.termo, m.em, palavras, m.significadoEm);
      const sig = comTempos(m.significado, m.significadoEm, palavras, fim);
      const igual: UTexto = { tipo: "texto", palavras: ["="], tempos: [m.significadoEm], papel: "igual", tinta: "acento" };
      const opcoes: Opcao[] = [];
      const pedida = janelaPedida(m.janela, [...termo.ws, ...sig.ws], [...termo.ts, ...sig.ts], m.em);
      const comJanela = (lado: "termo" | "sig" | null, i: number | "circulo") => {
        const a = fluxo(termo.ws, termo.ts, { janela: lado === "termo" ? i : null, papel: "grande" });
        const b = fluxo(sig.ws, sig.ts, { janela: lado === "sig" ? i : null, papel: "corpo" });
        const us = [...a.unidades, igual, ...b.unidades];
        if (i === "circulo") us.splice(a.unidades.length, 0, { tipo: "circulo", em: m.em });
        return us;
      };
      if (pedida === "circulo") opcoes.push({ unidades: comJanela(null, "circulo"), preferencia: 0 });
      else if (pedida && pedida.indice >= 0) {
        const noTermo = pedida.indice < termo.ws.length;
        opcoes.push({ unidades: comJanela(noTermo ? "termo" : "sig", noTermo ? pedida.indice : pedida.indice - termo.ws.length), preferencia: 0 });
      } else if (pedida) {
        opcoes.push({ unidades: [{ tipo: "janela", linhas: pedida.linhas, em: m.em }, ...comJanela(null, 0).filter((u) => u.tipo !== "circulo")], preferencia: 0 });
      } else {
        candidatas(termo.ws).slice(0, 2).forEach((i, k) => opcoes.push({ unidades: comJanela("termo", i), preferencia: k * 0.5 }));
        candidatas(sig.ws).slice(0, 3).forEach((i, k) => opcoes.push({ unidades: comJanela("sig", i), preferencia: 0.8 + k * 0.5 }));
        opcoes.push({ unidades: comJanela(null, "circulo"), preferencia: 2.5 });
      }
      r = escolher(plano, opcoes, limite, m.de);
      break;
    }
    case "topicos":
    case "passos": {
      const itens = [...m.itens].sort((a, b) => a.em - b.em).slice(0, 5);
      const us: Unidade[] = [];
      if (m.titulo) {
        const t = comTempos(m.titulo, m.de, palavras, itens[0]?.em ?? fim);
        us.push({ tipo: "texto", palavras: t.ws, tempos: t.ts, papel: "titulo" });
      }
      const contador = (k: number) => String(k + 1).padStart(2, "0");
      const pedida = m.janela !== undefined ? m.janela : null;
      if (pedida === "") us.push({ tipo: "circulo", em: itens[0]?.em ?? m.de });
      else if (pedida) us.push({ tipo: "janela", linhas: linhasDaJanela(pedida), em: itens[0]?.em ?? m.de });
      else
        us.push({
          tipo: "janela",
          linhas: [contador(0)],
          // o contador é numeração, não fala: abre logo que o pôster entra
          em: Math.min(itens[0]?.em ?? m.de, m.de + 0.3),
          trocas: itens.slice(1).map((it, k) => ({ em: it.em, linhas: [contador(k + 1)] })),
        });
      itens.forEach((it, k) => {
        const prox = itens[k + 1]?.em ?? fim;
        const t = comTempos(it.texto, it.em, palavras, prox);
        if (k > 0 && m.tipo === "passos") us.push({ tipo: "seta", em: it.em });
        us.push({ tipo: "texto", palavras: t.ws, tempos: t.ts, papel: "item", apagaEm: itens[k + 1]?.em });
        if (it.detalhe) {
          const d = comTempos(it.detalhe, (t.ts[t.ts.length - 1] ?? it.em) + 0.12, palavras, prox);
          us.push({ tipo: "texto", palavras: d.ws, tempos: d.ts, papel: "detalhe", apagaEm: itens[k + 1]?.em });
        }
      });
      r = escolher(plano, [{ unidades: us, preferencia: 0 }], limite, m.de);
      break;
    }
    case "comparacao": {
      const lados = m.lados;
      const vencedor = m.vencedor ?? (m.modo === "errado-certo" ? 1 : undefined);
      const perdedor = vencedor === undefined ? undefined : ((1 - vencedor) as 0 | 1);
      const riscoEm = m.vencedorEm ?? (vencedor !== undefined ? lados[vencedor].em + 0.35 : undefined);
      const us: Unidade[] = [];
      if (m.titulo) {
        const t = comTempos(m.titulo, m.de, palavras, lados[0].em);
        us.push({ tipo: "texto", palavras: t.ws, tempos: t.ts, papel: "titulo", lado: 0 });
      }
      lados.forEach((l, k) => {
        const lado = k as 0 | 1;
        const prox = k === 0 ? lados[1].em : fim;
        const t = comTempos(l.texto, l.em, palavras, prox);
        if (k === 1) {
          const pedida = m.janela;
          if (pedida === "") us.push({ tipo: "circulo", em: lados[0].em });
          else us.push({ tipo: "janela", linhas: linhasDaJanela(pedida || "VS"), em: lados[0].em, lado: 0 });
        }
        const rot = comTempos(l.rotulo, l.em, palavras, prox);
        us.push({ tipo: "texto", palavras: rot.ws, tempos: rot.ts, papel: "rotulo", lado, tinta: "letreiro" });
        us.push({
          tipo: "texto",
          palavras: t.ws,
          tempos: t.ts,
          papel: "lado",
          lado,
          tinta: vencedor === lado || (vencedor === undefined && m.modo === "antes-depois" && lado === 1) ? "acento" : "texto",
          risco: perdedor === lado ? riscoEm : undefined,
        });
      });
      r = escolher(plano, [{ unidades: us, preferencia: 0 }], limite, m.de);
      if (r.janela) divisao = r.janela.circulo ? r.janela.circulo.cy : r.alvo.y;
      break;
    }
    case "grafico": {
      const titulo = m.titulo ? comTempos(m.titulo, m.de, palavras, m.dados?.[0]?.em ?? m.tendenciaEm ?? fim) : null;
      const graficoU: UGrafico = { tipo: "grafico", ideal: 560, minimo: 400 };
      const extra = (f: Fluxo): Unidade[] => [...f.unidades, graficoU];
      let opcoes: Opcao[];
      if (titulo) opcoes = opcoesDeTexto(titulo.ws, titulo.ts, { janela: m.janela }, extra, { papel: "titulo", emPadrao: m.de });
      else {
        const em = m.dados?.[0]?.em ?? m.tendenciaEm ?? m.de;
        const pedida = m.janela;
        opcoes = [{ unidades: [pedida ? { tipo: "janela", linhas: linhasDaJanela(pedida), em } : { tipo: "circulo", em }, graficoU], preferencia: 0 }];
      }
      r = escolher(plano, opcoes, limite, m.de);
      if (r.grafico)
        grafico = {
          x: (QUADRO.w - LARGURA_TEXTO) / 2,
          y: r.grafico.y,
          w: LARGURA_TEXTO,
          h: r.grafico.h,
          forma: m.forma,
          dados: m.dados?.length ? [...m.dados].sort((a, b) => a.em - b.em).slice(0, 6) : undefined,
          tendencia: m.dados?.length ? undefined : (m.tendencia ?? "sobe"),
          tendenciaEm: m.tendenciaEm ?? m.de + 0.2,
          unidade: m.unidade,
          ilustrativo: !!m.ilustrativo || !m.dados?.length,
          de: m.de,
          ate: fim,
        };
      break;
    }
  }

  return {
    bloco: true,
    topo: [],
    negacoes: [],
    base: [],
    janela: r.janela,
    alvo: r.alvo,
    escala: r.escala,
    linhasB: r.linhas,
    setas: r.setas,
    divisao,
    grafico,
    assinatura: m.tipo === "cta" && !!plano.marca?.nome,
    icone: m.tipo === "cta" ? (m.icone ?? "link") : undefined,
  };
};

export const ehBloco = (d: Desenho): d is DesenhoB => (d as DesenhoB).bloco === true;
