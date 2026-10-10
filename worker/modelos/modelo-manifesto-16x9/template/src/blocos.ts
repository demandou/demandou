// Diagramação dos blocos universais no estilo Manifesto, no quadro deitado (16:9).
//
// Todo bloco universal de pôster vira unidades de texto (que se montam palavra por palavra),
// letreiros pequenos, a palavra-janela (ou o contador, o "VS", o círculo) e, no gráfico, a área do
// desenho. A FILEIRA (src/fileira.ts) põe a janela de um lado, com o rosto dentro da primeira
// linha, e o texto ao lado dela, encostado nela; o que vem antes da janela fica à esquerda, o que
// vem depois, à direita (ou tudo numa coluna ao lado, quando a frase é longa). Todo texto é medido
// com as larguras da fonte e reduzido até caber (nunca vaza).
import { temposPorConteudo } from "./anim";
import {
  type Caixa,
  type Fileira,
  type IconeB,
  type JanelaPosta,
  montarFileira,
  type Opcao,
  type Papel,
  type Tinta,
  type UGrafico,
  type Unidade,
  type UTexto,
  vaoEntre,
} from "./fileira";
import { acharTrecho, candidatas, limpar, linhasDaJanela } from "./janela";
import { type Desenho, ENTRADA } from "./layout";
import type { Grafico, Palavra, Plano, Universal } from "./plano";
import { BASE_COM_ASSINATURA, BASE_UTIL } from "./tema";

export type { IconeB, Tinta } from "./fileira";

// Uma linha já posta no pôster.
export type LinhaB = {
  palavras: string[];
  tempos: number[];
  y: number;
  // a coluna da linha: onde começa, a largura e para que lado o texto encosta
  caixa: Caixa;
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

// a seta dos passos: desce de um passo ao outro, na borda da coluna onde o texto encosta
export type Seta = { x: number; y1: number; y2: number; em: number };

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

const MONO = 28;

// palavras do texto com o tempo de cada uma (a k-ésima escrita bate na k-ésima falada a partir de `em`)
const comTempos = (texto: string, em: number, palavras: Palavra[], limite: number) => {
  const ws = texto.trim().split(/\s+/).filter(Boolean);
  return { ws, ts: temposPorConteudo(texto, em, palavras, limite) };
};

// --- Das unidades postas pela fileira para as linhas que o Bloco desenha ---
const linhasDaFileira = (f: Fileira) => {
  const linhas: LinhaB[] = [];
  const setas: Seta[] = [];
  let grafico: { x: number; y: number; w: number; h: number } | undefined;
  for (const p of f.postas) {
    const u = p.u;
    const m = p.m;
    if (u.tipo === "texto" && m.tipo === "texto") {
      let k = 0;
      let yy = p.y;
      m.linhas.forEach((l, j) => {
        if (j > 0) yy += vaoEntre({ texto: m.linhas[j - 1].join(" "), tamanho: m.tamanho }, { texto: l.join(" "), tamanho: m.tamanho });
        linhas.push({
          palavras: l,
          tempos: u.tempos.slice(k, k + l.length),
          y: yy,
          caixa: p.caixa,
          tamanho: m.tamanho,
          peso: m.peso,
          tinta: u.tinta ?? (u.papel === "detalhe" ? "letreiro" : "texto"),
          lado: u.lado,
          risco: u.risco,
          apagaEm: u.apagaEm,
          icone: j === 0 ? u.icone : undefined,
        });
        k += l.length;
        yy += m.tamanho;
      });
    } else if (u.tipo === "mono" && m.tipo === "mono") {
      m.linhas.forEach((l, j) =>
        linhas.push({ palavras: [l], tempos: [u.em], y: p.y + j * (MONO + 10), caixa: p.caixa, tamanho: MONO, peso: 500, mono: true, tinta: u.tinta ?? "letreiro", lado: u.lado }),
      );
    } else if (u.tipo === "seta") {
      const c = p.caixa;
      const x = c.alinhar === "esquerda" ? c.x + 26 : c.alinhar === "direita" ? c.x + c.largura - 26 : c.x + c.largura / 2;
      setas.push({ x, y1: p.y + 6, y2: p.y + m.altura - 6, em: u.em });
    } else if (u.tipo === "grafico") {
      grafico = { x: p.caixa.x, y: p.y, w: p.caixa.largura, h: m.altura };
    }
  }
  return { linhas, setas, grafico };
};

// --- O texto falado de um bloco, dividido em trechos (normal, destaque, risco) e a janela ---
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
  if (pedida) {
    // a pedida que está ao pé da letra no texto ("VO/CÊ" = "você") sai do lugar dela na frase;
    // outra palavra entra no fim
    const u = pedida.indice >= 0 ? montar(pedida.indice) : montar({ linhas: pedida.linhas, em: pedida.em ?? base.emPadrao });
    if (pedida.indice >= 0) {
      const j = u.findIndex((x) => x.tipo === "janela");
      if (j >= 0 && u[j].tipo === "janela") u[j] = { ...u[j], linhas: pedida.linhas } as Unidade;
    }
    return [{ unidades: u, preferencia: 0 }];
  }
  const rsc = acharTrecho(ws, m.risco);
  const cands = candidatas(ws, acharTrecho(ws, m.destaque)).filter((i) => !rsc || i < rsc.de || i >= rsc.ate).slice(0, 4);
  return [...cands.map((i, k) => ({ unidades: montar(i), preferencia: k * 0.5 })), { unidades: montar("circulo"), preferencia: 2.5 }];
};

const juntar = (f: Fluxo) => f.unidades;

// --- Cada bloco universal ---
export const desenhoDoBloco = (plano: Plano, m: Universal, palavras: Palavra[], ate: number): DesenhoB => {
  const limiteBaixo = m.tipo === "cta" && plano.marca?.nome ? BASE_COM_ASSINATURA : BASE_UTIL;
  const cfg = { limiteBaixo, de: m.de, entrada: ENTRADA };
  const fim = ate;
  const emTexto = "em" in m && typeof m.em === "number" ? m.em : m.de;
  let r: Fileira;
  let grafico: GraficoPosto | undefined;

  switch (m.tipo) {
    case "abertura":
    case "frase":
    case "cta": {
      const { ws, ts } = comTempos(m.texto, emTexto, palavras, fim);
      const icone = m.tipo === "cta" ? (m.icone ?? "link") : undefined;
      r = montarFileira(plano, opcoesDeTexto(ws, ts, m, juntar, { icone, emPadrao: emTexto }), cfg);
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
      r = montarFileira(plano, opcoesDeTexto(ws, ts, m, extra, { papel: opcoes.length ? "corpo" : undefined, emPadrao: emTexto }), cfg);
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
      r = montarFileira(plano, opcoes, cfg);
      break;
    }
    case "topicos":
    case "passos": {
      const itens = [...m.itens].sort((a, b) => a.em - b.em).slice(0, 5);
      const us: Unidade[] = [];
      const contador = (k: number) => String(k + 1).padStart(2, "0");
      const pedida = m.janela !== undefined ? m.janela : null;
      // nas listas a janela (o contador) vem primeiro: ela numera, o título e os itens vêm ao lado
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
      if (m.titulo) {
        const t = comTempos(m.titulo, m.de, palavras, itens[0]?.em ?? fim);
        us.push({ tipo: "texto", palavras: t.ws, tempos: t.ts, papel: "titulo" });
      }
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
      r = montarFileira(plano, [{ unidades: us, preferencia: 0 }], cfg);
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
        us.push({ tipo: "texto", palavras: t.ws, tempos: t.ts, papel: "rotulo", lado: 0, tinta: "letreiro" });
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
      // o quadro dividido na altura do rosto: lado 1 em cima, lado 2 embaixo, o "VS" na emenda
      r = montarFileira(plano, [{ unidades: us, preferencia: 0 }], { ...cfg, dividida: true });
      break;
    }
    case "grafico": {
      const titulo = m.titulo ? comTempos(m.titulo, m.de, palavras, m.dados?.[0]?.em ?? m.tendenciaEm ?? fim) : null;
      const graficoU: UGrafico = { tipo: "grafico", ideal: 560, minimo: 380 };
      const extra = (f: Fluxo): Unidade[] => [...f.unidades, graficoU];
      let opcoes: Opcao[];
      if (titulo) opcoes = opcoesDeTexto(titulo.ws, titulo.ts, { janela: m.janela }, extra, { papel: "titulo", emPadrao: m.de });
      else {
        const em = m.dados?.[0]?.em ?? m.tendenciaEm ?? m.de;
        const pedida = m.janela;
        opcoes = [{ unidades: [pedida ? { tipo: "janela", linhas: linhasDaJanela(pedida), em } : { tipo: "circulo", em }, graficoU], preferencia: 0 }];
      }
      r = montarFileira(plano, opcoes, cfg);
      break;
    }
  }

  const { linhas, setas, grafico: g } = linhasDaFileira(r);
  if (m.tipo === "grafico" && g)
    grafico = {
      ...g,
      forma: m.forma,
      dados: m.dados?.length ? [...m.dados].sort((a, b) => a.em - b.em).slice(0, 6) : undefined,
      tendencia: m.dados?.length ? undefined : (m.tendencia ?? "sobe"),
      tendenciaEm: m.tendenciaEm ?? m.de + 0.2,
      unidade: m.unidade,
      ilustrativo: !!m.ilustrativo || !m.dados?.length,
      de: m.de,
      ate: fim,
    };

  return {
    bloco: true,
    topo: [],
    negacoes: [],
    base: [],
    janela: r.janela as JanelaPosta | undefined,
    alvo: r.alvo,
    escala: r.escala,
    linhasB: linhas,
    setas,
    divisao: r.divisao,
    grafico,
    assinatura: m.tipo === "cta" && !!plano.marca?.nome,
    icone: m.tipo === "cta" ? (m.icone ?? "link") : undefined,
  };
};

export const ehBloco = (d: Desenho): d is DesenhoB => (d as DesenhoB).bloco === true;
