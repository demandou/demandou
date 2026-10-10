// Os 11 blocos universais (motor/BLOCOS.md) escritos a giz. Cada bloco vira uma página da lousa,
// com as mesmas peças da conta (escrita, traço, rótulo): o apagador, a janela que muda de lugar,
// a espera pelo lugar limpo e os números que passam de uma página para a outra vêm prontos de paginas.ts.
//
// A linguagem é a de um professor no quadro: o título do bloco fica ao lado da janela, em giz amarelo;
// o resto é escrito embaixo, na palavra em que é dito. No quadro deitado (16:9) a janela é a moldura
// da direita e a lousa é a coluna da esquerda (layout.ts): o título no topo dela, o resto embaixo.
// Lista = traços de giz; passos = algarismos
// circulados ligados por setas; comparação = o quadro dividido em T; gráfico = eixos riscados à mão;
// definição = verbete "termo = significado"; frase = citação entre aspas; pergunta = questão de prova.
// O giz amarelo é o assunto do instante; o giz rosa, só o erro/alerta.
import { duracaoDaEscrita, molduraDeGiz, montarLinha, setaReta, sublinhadoDeGiz, circuloDeGiz } from "./giz/Escrita";
import type { Regiao } from "./layout";
import {
  ajustarTexto,
  cabecalho,
  ENTRELINHA,
  escrita,
  esquerdaDe,
  fimDe,
  indicesDoDestaque,
  juntasDoDestaque,
  largura,
  type Montado,
  numeroBR,
  type Peca,
  type PecaEscrita,
  type PecaTraco,
  quebrar,
  rotulo,
  type Som,
  sublinhadoDuplo,
  temposFalados,
  textoEmLinhas,
  type TextoAjustado,
} from "./pecas";
import type {
  Abertura,
  Comparacao,
  Definicao,
  Destaque,
  Frase,
  Grafico,
  ItemDeLista,
  Layout,
  Numero,
  Palavra,
  Passos,
  Pergunta,
  Topicos,
  Universal,
} from "./plano";
import { cor, MIN } from "./tema";

export type Contexto = { layout: Layout; C: Regiao | null; R: Regiao; palavras: Palavra[] };

// giz branco mais fraco, para detalhes e hachuras
const GIZ_FRACO = "rgba(238,237,230,0.62)";
const GIZ_MEIO = "rgba(238,237,230,0.8)";

const traco = (id: string, d: string[], larguraTraco: number, corTraco: string, em: number, dur: number, extra: Partial<PecaTraco> = {}): PecaTraco => ({
  tipo: "traco",
  id,
  d,
  largura: larguraTraco,
  cor: corTraco,
  em,
  dur,
  ...extra,
});

const linhaReta = (x1: number, y1: number, x2: number, y2: number) => `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;

const maior = (ns: number[]) => (ns.length ? Math.max(...ns) : 0);

// sons: um tom por batida importante (as notas da conta: sol, lá, si, ré)
const NOTAS = ["sfx/giz-1.wav", "sfx/giz-2.wav", "sfx/giz-3.wav", "sfx/giz-4.wav"];

// ---------- cabeçalho falado (ao lado da janela) ----------

// Texto escrito ao lado da janela palavra por palavra, no ritmo da fala (rótulo do número, termo da
// definição, a pergunta da questão). Mede e quebra em até `linhas` linhas.
const cabecalhoFalado = (
  id: string,
  texto: string,
  C: Regiao,
  tempos: number[],
  o: { cor: string; maximo: number; minimo: number; linhas: number; amarelas?: Set<number>; corDestaque?: string },
) => {
  const aj = ajustarTexto(texto, { largura: C.w, altura: C.h, maximo: o.maximo, minimo: o.minimo, linhas: o.linhas });
  const topo = C.y + Math.max(0, (C.h - aj.altura) / 2) - aj.tamanho * 0.1;
  const r = textoEmLinhas(id, aj, tempos, C.x, topo, "esq", o.amarelas ?? new Set(), { base: o.cor, destaque: o.corDestaque });
  return { ...r, aj };
};

// Título opcional de um bloco quando a pessoa está na janela grande ("alto"; não há cabeçalho ao lado da janela):
// uma linha a giz amarelo no topo da lousa, esboçada e escrita no `tituloEm`. Devolve a altura usada.
const tituloNoTopo = (m: { titulo?: string; tituloEm?: number }, R: Regiao, de: number): { pecas: Peca[]; altura: number } => {
  if (!m.titulo) return { pecas: [], altura: 0 };
  const aj = ajustarTexto(m.titulo, { largura: R.w * 0.94, altura: 150, maximo: 92, minimo: 52, linhas: 2 });
  const pecas: Peca[] = [];
  let y = R.y;
  aj.linhas.forEach((l, i) => {
    y += aj.tamanho + (i ? aj.tamanho * ENTRELINHA : 0);
    pecas.push(escrita(`titulo-${i}`, l.join(" "), R.x + R.w / 2, y, aj.tamanho, (m.tituloEm ?? de + 0.3) + i * 0.3, { alinhar: "centro", cor: cor.amarelo, esboco: true }));
  });
  return { pecas, altura: aj.altura + aj.tamanho * 0.75 };
};

// quando termina de ser escrito o que foi escrito por último numa lista de peças
const fimDasPecas = (pecas: PecaEscrita[]) => maior(pecas.map(fimDe));

// ---------- abertura ----------

const paginaAbertura = (m: Abertura, { R, palavras }: Contexto): Montado => {
  const pecas: Peca[] = [];
  const topoRotulo = m.rotulo ? 66 : 0;
  if (m.rotulo) pecas.push(rotulo("rotulo", m.rotulo, R.x + R.w / 2, R.y + MIN.rotulo, m.de + 0.15, "centro"));
  const sub = 48;
  const aj = ajustarTexto(m.texto, { largura: R.w * 0.94, altura: R.h - topoRotulo - sub - 10, maximo: 170, minimo: 64, linhas: 4, juntas: juntasDoDestaque(m.texto, m.destaque) });
  const inicio = m.em ?? m.de;
  const tempos = temposFalados(m.texto, palavras, inicio, m.ate);
  const amarelas = indicesDoDestaque(aj.linhas.flat(), m.destaque);
  const topo = R.y + topoRotulo + Math.max(0, (R.h - topoRotulo - sub - aj.altura) / 2);
  const { pecas: ps, bases } = textoEmLinhas("t", aj, tempos, R.x + R.w / 2, topo, "centro", amarelas);
  pecas.push(...ps);
  // sublinhado amarelo: debaixo do destaque (na última linha dele) ou da última linha
  const alvo = amarelas.size ? ps.filter((_, i) => amarelas.has(i)) : ps.filter((p) => p.y === bases[bases.length - 1]);
  const base = maior(alvo.map((p) => p.y));
  const naLinha = alvo.filter((p) => p.y === base);
  const ultimo = naLinha[naLinha.length - 1];
  const fim = fimDasPecas(alvo);
  pecas.push(
    traco("sublinhado", [sublinhadoDeGiz(naLinha[0].x - 8, ultimo.x + largura(ultimo.texto, ultimo.tamanho) + 8, base + aj.tamanho * 0.34, 5)], Math.max(8, aj.tamanho * 0.07), cor.amarelo, fim + 0.12, 0.32, {
      depois: ultimo.id,
    }),
  );
  return { pecas, sons: [{ em: fim + 0.3, arquivo: "sfx/giz-1.wav", volume: 0.26 }], marcos: [...tempos.filter((_, i) => i % 3 === 2), fim + 0.6] };
};

// ---------- listas (tópicos e passos) ----------

type ItemMedido = { linhas: string[][]; detalhe: string[][] | null };

// Acha o maior tamanho comum em que todos os itens cabem (até 2 linhas cada; detalhe menor, até 2)
const medirLista = (itens: ItemDeLista[], larguraTexto: (s: number) => number, alturaMax: number, gapPor: number, maximo: number, minimo: number) => {
  const tentativa = (s: number, maxLinhas: number) => {
    const ds = Math.max(40, s * 0.6);
    const medidos: ItemMedido[] = [];
    let h = 0;
    for (const it of itens) {
      const linhas = quebrar(it.texto, s, larguraTexto(s), maxLinhas);
      if (!linhas) return null;
      const det = it.detalhe ? quebrar(it.detalhe, ds, larguraTexto(s), 2) : null;
      if (it.detalhe && !det) return null;
      h += linhas.length * s + (linhas.length - 1) * s * ENTRELINHA;
      if (det) h += s * 0.42 + det.length * ds + (det.length - 1) * ds * ENTRELINHA;
      medidos.push({ linhas, detalhe: det });
    }
    h += (itens.length - 1) * s * gapPor;
    return h <= alturaMax ? { s, ds, medidos, h } : null;
  };
  for (let s = maximo; s >= minimo - 0.01; s *= 0.96) {
    const r = tentativa(s, 2);
    if (r) return r;
  }
  for (let s = minimo; s >= 30; s *= 0.95) {
    const r = tentativa(s, 3);
    if (r) return r;
  }
  // último recurso: quebra à força num tamanho pequeno
  const s = 30;
  return {
    s,
    ds: 30,
    medidos: itens.map((it) => ({ linhas: [it.texto.split(/\s+/)], detalhe: it.detalhe ? [it.detalhe.split(/\s+/)] : null })),
    h: alturaMax,
  };
};

const paginaLista = (m: Topicos | Passos, ctx: Contexto, numerada: boolean): Montado => {
  const { R, palavras } = ctx;
  const pecas: Peca[] = [];
  const sons: Som[] = [];
  const marcos: number[] = [];
  let A = R;
  if (ctx.layout === "alto" || !ctx.C) {
    const t = tituloNoTopo(m, R, m.de);
    pecas.push(...t.pecas);
    A = { ...R, y: R.y + t.altura, h: R.h - t.altura };
  } else pecas.push(...cabecalho(m, ctx.C, m.de));
  const itens = m.itens.slice(0, 5);
  const marca = (s: number) => (numerada ? s * 1.5 : s * 0.95);
  const gapPor = numerada ? 0.95 : 0.62;
  const med = medirLista(itens, (s) => A.w - marca(s) - 10, A.h - 10, gapPor, numerada ? 104 : 100, 52);
  const { s, ds } = med;
  const larguraBloco = maior(med.medidos.map((it) => maior([...it.linhas, ...(it.detalhe ?? [])].map((l, k) => largura(l.join(" "), k < it.linhas.length ? s : ds)))));
  const x0 = A.x + Math.max(0, (A.w - marca(s) - larguraBloco) / 2);
  const xTexto = x0 + marca(s);
  let y = A.y + Math.max(0, (A.h - med.h) / 2);
  let fimUltimo = m.de;
  let anterior: { x: number; base: number } | null = null;
  itens.forEach((it, i) => {
    const medido = med.medidos[i];
    const ate = itens[i + 1]?.em ?? m.ate;
    const tempos = temposFalados(it.texto, palavras, it.em, ate);
    const aj: TextoAjustado = { linhas: medido.linhas, tamanho: s, larguras: [], altura: 0 };
    const { pecas: ps, bases } = textoEmLinhas(`item${i}`, aj, tempos, xTexto, y, "esq");
    pecas.push(...ps);
    const primeira = bases[0];
    if (numerada) {
      // o algarismo do passo (giz amarelo, esboçado antes), circulado quando é dito,
      // e uma seta do passo anterior até ele
      const n = escrita(`num${i}`, String(i + 1), x0 + s * 0.12, primeira, s, it.em - 0.08, { cor: cor.amarelo, esboco: true, dur: 0.2 });
      pecas.push(n);
      const c = { ...((): PecaTraco => {
        const w = largura(n.texto, n.tamanho);
        return traco(`circ${i}`, [circuloDeGiz(n.x + w / 2, n.y - s * 0.5, w / 2 + s * 0.3, s * 0.72, i + 3)], Math.max(6, s * 0.05), cor.amarelo, it.em + 0.12, 0.28, { depois: n.id });
      })() };
      pecas.push(c);
      const cx = n.x + largura(n.texto, n.tamanho) / 2;
      if (anterior) {
        const seta = setaReta(cx, anterior.base + s * 0.42, cx, primeira - s * 1.36, i + 7);
        pecas.push(traco(`seta${i}`, [seta.linha, seta.ponta], Math.max(5, s * 0.045), GIZ_MEIO, it.em - 0.3, 0.26, { esboco: true }));
      }
      sons.push({ em: it.em + 0.35, arquivo: NOTAS[Math.min(i, 3)], volume: 0.24 });
    } else {
      // traço amarelo na frente do item (esboçado antes, riscado na palavra)
      const yTraco = primeira - s * 0.4;
      pecas.push(traco(`marca${i}`, [sublinhadoDeGiz(x0 + s * 0.05, x0 + s * 0.6, yTraco, i + 2)], Math.max(7, s * 0.075), cor.amarelo, it.em - 0.1, 0.18, { esboco: true }));
    }
    y = bases[bases.length - 1];
    if (medido.detalhe) {
      // o detalhe vem depois do item (mesmo quando a transcrição não acha as palavras dele)
      const tDet = temposFalados(it.detalhe as string, palavras, Math.max(it.em + 0.2, maior(tempos) + 0.1), ate);
      const r = textoEmLinhas(`det${i}`, { linhas: medido.detalhe, tamanho: ds, larguras: [], altura: 0 }, tDet, xTexto, y + s * 0.42 - ds * 0.1, "esq", new Set(), {
        base: GIZ_FRACO,
      });
      pecas.push(...r.pecas);
      y = r.bases[r.bases.length - 1];
    }
    anterior = { x: x0, base: y };
    fimUltimo = Math.max(fimUltimo, fimDasPecas(ps));
    marcos.push(it.em + 0.6);
    y += s * gapPor;
  });
  if (!numerada) {
    sons.push({ em: itens[itens.length - 1].em + 0.3, arquivo: "sfx/giz-3.wav", volume: 0.24 });
    // a lista fecha: uma moldura de giz em volta dela, se ainda houver tempo
    if (m.ate - fimUltimo > 1.7) {
      const pad = s * 0.45;
      const topo = A.y + Math.max(0, (A.h - med.h) / 2) - s * 0.15;
      pecas.push(traco("moldura", molduraDeGiz(x0 - pad, topo - pad * 0.6, marca(s) + larguraBloco + 2 * pad, med.h + pad * 1.4, 9), Math.max(6, s * 0.05), GIZ_MEIO, fimUltimo + 0.7, 0.45));
      marcos.push(fimUltimo + 1.3);
    }
  }
  return { pecas, sons, marcos };
};

// ---------- número ----------

const paginaNumero = (m: Numero, ctx: Contexto): Montado => {
  const { R, palavras } = ctx;
  const pecas: Peca[] = [];
  const sons: Som[] = [];
  const marcos: number[] = [m.em + 0.9];
  const tRotulo = temposFalados(m.rotulo, palavras, m.rotuloEm ?? m.de, Math.max(m.em + 1.5, m.ate));
  let A = R;
  if (ctx.layout !== "alto" && ctx.C) {
    pecas.push(...cabecalhoFalado("rot", m.rotulo, ctx.C, tRotulo, { cor: cor.giz, maximo: 120, minimo: 52, linhas: 3 }).pecas);
  } else {
    const aj = ajustarTexto(m.rotulo, { largura: R.w * 0.9, altura: 190, maximo: 84, minimo: 50, linhas: 2 });
    const r = textoEmLinhas("rot", aj, tRotulo, R.x + R.w / 2, R.y, "centro");
    pecas.push(...r.pecas);
    A = { ...R, y: R.y + aj.altura + aj.tamanho * 0.6, h: R.h - aj.altura - aj.tamanho * 0.6 };
  }
  // ≈ prefixo número sufixo, numa linha só
  const numero = numeroBR(m.valor, m.casas);
  const sufixo = (m.sufixo ?? "").trim();
  const sufixoColado = /^[%‰]$/.test(sufixo);
  const textoNumero = numero + (sufixoColado ? sufixo : "");
  const prefixo = (m.prefixo ?? "").trim();
  const medida = (S: number) =>
    (m.ilustrativo ? largura("≈", S * 0.7) + S * 0.16 : 0) +
    (prefixo ? largura(prefixo, S * 0.6) + S * 0.18 : 0) +
    largura(textoNumero, S) +
    (sufixo && !sufixoColado ? S * 0.16 + largura(sufixo, S * 0.5) : 0);
  const S = Math.max(40, Math.min(240, (A.h - 120) / 1.75, (A.w * 0.92 * 100) / medida(100)));
  const wTotal = medida(S);
  let x = A.x + (A.w - wTotal) / 2;
  const y = A.y + (A.h - S * 1.75) / 2 + S * 1.05;
  let em = m.em - 0.06;
  if (m.ilustrativo) {
    pecas.push(escrita("aprox", "≈", x, y - S * 0.12, S * 0.7, em, { cor: cor.giz }));
    x += largura("≈", S * 0.7) + S * 0.16;
  }
  if (prefixo) {
    const p = escrita("prefixo", prefixo, x, y, S * 0.6, em, { cor: cor.amarelo });
    pecas.push(p);
    x += largura(prefixo, S * 0.6) + S * 0.18;
    em = fimDe(p) - 0.04;
  }
  const n = escrita("numero", textoNumero, x, y, S, em, { cor: cor.amarelo, chave: textoNumero, dur: Math.min(1.0, duracaoDaEscrita(montarLinha(textoNumero, S))) });
  pecas.push(n);
  x += largura(textoNumero, S);
  let ultimo: PecaEscrita = n;
  if (sufixo && !sufixoColado) {
    ultimo = escrita("sufixo", sufixo, x + S * 0.16, y, S * 0.5, fimDe(n) + 0.02, { cor: cor.amarelo });
    pecas.push(ultimo);
  }
  const inteiro: PecaEscrita = { ...n, id: ultimo.id, x: A.x + (A.w - wTotal) / 2, alinhar: "esq" };
  pecas.push(...sublinhadoDuplo("duplo", inteiro, fimDe(ultimo) + 0.06, wTotal));
  sons.push({ em: fimDe(ultimo) + 0.1, arquivo: "sfx/giz-2.wav", volume: 0.34 });
  if (m.ilustrativo) pecas.push(rotulo("ilustrativo", "Ilustrativo", A.x + A.w / 2, y + S * 0.62 + 56, fimDe(ultimo) + 0.3, "centro"));
  marcos.push(fimDe(ultimo) + 0.6);
  return { pecas, sons, marcos };
};

// ---------- comparação (a lousa dividida em T) ----------

const paginaComparacao = (m: Comparacao, ctx: Contexto): Montado => {
  const { R, palavras } = ctx;
  const pecas: Peca[] = [];
  const sons: Som[] = [];
  const marcos: number[] = [];
  let A = R;
  if (ctx.layout === "alto" || !ctx.C) {
    const t = tituloNoTopo(m, R, m.de);
    pecas.push(...t.pecas);
    A = { ...R, y: R.y + t.altura, h: R.h - t.altura };
  } else pecas.push(...cabecalho(m, ctx.C, m.de));
  // no "antes-depois" o meio do T é mais largo: a seta atravessa sem encostar nos textos
  const gap = m.modo === "antes-depois" ? 130 : 56;
  const cw = (A.w - gap) / 2;
  const centros = [A.x + cw / 2, A.x + cw + gap + cw / 2];
  const lados = m.lados;
  // rótulos (amarelos; no "errado-certo", o errado em rosa) e textos (brancos), tamanhos comuns
  const marcaModo = m.modo === "errado-certo";
  const larguraRotulo = cw * (marcaModo ? 0.74 : 0.92);
  let rs = Math.min(...lados.map((l) => ajustarTexto(l.rotulo, { largura: larguraRotulo, altura: 230, maximo: 100, minimo: 54, linhas: 2 }).tamanho));
  const linhasRot = lados.map((l) => quebrar(l.rotulo, rs, larguraRotulo, 2) ?? [l.rotulo.split(/\s+/)]);
  const hRot = maior(linhasRot.map((ls) => ls.length * rs + (ls.length - 1) * rs * ENTRELINHA));
  const alturaTextos = A.h - hRot - 110;
  const ts = Math.min(...lados.map((l) => ajustarTexto(l.texto, { largura: cw * 0.92, altura: alturaTextos, maximo: 84, minimo: 46, linhas: 4 }).tamanho));
  const linhasTxt = lados.map((l) => quebrar(l.texto, ts, cw * 0.92, 5) ?? ajustarTexto(l.texto, { largura: cw * 0.92, altura: alturaTextos, maximo: ts, minimo: ts, linhas: 5 }).linhas);
  const hTxt = maior(linhasTxt.map((ls) => ls.length * ts + (ls.length - 1) * ts * ENTRELINHA));
  const bloco = hRot + 70 + hTxt;
  const topo = A.y + Math.max(10, (A.h - bloco) / 2);
  const yLinha = topo + hRot + 34;
  const primeiro = lados[0].em;
  // o T: risco horizontal embaixo dos rótulos e o vertical no meio (esboçados antes)
  pecas.push(traco("t-h", [sublinhadoDeGiz(A.x + 6, A.x + A.w - 6, yLinha, 31)], 7, GIZ_MEIO, primeiro - 0.35, 0.3, { esboco: true }));
  pecas.push(traco("t-v", [linhaReta(A.x + A.w / 2, topo - 16, A.x + A.w / 2 + 3, yLinha + 36 + hTxt + 20)], 7, GIZ_MEIO, primeiro - 0.12, 0.3, { esboco: true }));
  const coresRot = marcaModo ? [cor.rosa, cor.amarelo] : [cor.amarelo, cor.amarelo];
  const rotulos: PecaEscrita[][] = [];
  const textos: PecaEscrita[][] = [];
  lados.forEach((l, i) => {
    const ate = i === 0 ? lados[1].em : m.ate;
    const ls = linhasRot[i];
    const hEste = ls.length * rs + (ls.length - 1) * rs * ENTRELINHA;
    let y = topo + (hRot - hEste);
    const deslocaMarca = marcaModo ? rs * 0.55 : 0;
    const rp: PecaEscrita[] = [];
    ls.forEach((linha, k) => {
      y += rs + (k ? rs * ENTRELINHA : 0);
      rp.push(escrita(`rot${i}-${k}`, linha.join(" "), centros[i] + deslocaMarca, y, rs, l.em - 0.05 + k * 0.22, { alinhar: "centro", cor: coresRot[i] }));
    });
    pecas.push(...rp);
    rotulos.push(rp);
    if (marcaModo) {
      // ✗ rosa no errado, ✓ amarelo no certo, na frente do rótulo
      const w0 = largura(rp[0].texto, rs);
      const mx = centros[i] + deslocaMarca - w0 / 2 - rs * 0.95;
      const my = rp[0].y - rs * 0.5;
      const t = rs * 0.36;
      const d = i === 0 ? [linhaReta(mx - t, my - t, mx + t, my + t), linhaReta(mx + t, my - t, mx - t, my + t)] : [`M ${mx - t} ${my} L ${mx - t * 0.2} ${my + t * 0.8} L ${mx + t * 1.1} ${my - t * 1.1}`];
      pecas.push(traco(`marca${i}`, d, Math.max(7, rs * 0.07), coresRot[i], l.em + 0.1, 0.25));
    }
    const tempos = temposFalados(l.texto, palavras, l.em, ate);
    const r = textoEmLinhas(`txt${i}`, { linhas: linhasTxt[i], tamanho: ts, larguras: [], altura: 0 }, tempos, centros[i], yLinha + 30, "centro");
    pecas.push(...r.pecas);
    textos.push(r.pecas);
    marcos.push(l.em + 0.7);
    sons.push({ em: l.em + 0.15, arquivo: NOTAS[i + 1], volume: 0.24 });
  });
  if (m.modo === "antes-depois") {
    // uma seta atravessa o meio do T, do antes para o depois
    const ya = yLinha + 36 + hTxt / 2;
    const seta = setaReta(A.x + A.w / 2 - 46, ya, A.x + A.w / 2 + 46, ya, 5);
    pecas.push(traco("seta", [seta.linha, seta.ponta], 7, cor.amarelo, lados[1].em - 0.15, 0.25));
  }
  if (m.vencedor !== undefined) {
    const v = m.vencedor;
    const alvo = rotulos[v][rotulos[v].length - 1];
    const em = m.vencedorEm ?? fimDasPecas(textos[v]) + 0.3;
    pecas.push({ ...circuloEmPeca(alvo, em), respira: false });
    sons.push({ em: em + 0.2, arquivo: "sfx/giz-4.wav", volume: 0.3 });
    marcos.push(em + 0.6);
  }
  return { pecas, sons, marcos };
};

const circuloEmPeca = (p: PecaEscrita, em: number): PecaTraco => {
  const w = largura(p.texto, p.tamanho);
  const x = esquerdaDe(p.x, w, p.alinhar);
  return traco(`circ-${p.id}`, [circuloDeGiz(x + w / 2, p.y - p.tamanho * 0.5, w / 2 + p.tamanho * 0.3, p.tamanho * 0.78, p.tamanho + w)], Math.max(7, p.tamanho * 0.06), cor.amarelo, em, 0.32, {
    depois: p.id,
  });
};

// ---------- gráfico (eixos riscados à mão) ----------

// caminho suave por pontos (Catmull-Rom → curvas)
const curvaPor = (pts: [number, number][]) => {
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};

// hachura diagonal dentro de um retângulo (o "preenchimento" de giz da barra)
const hachura = (x1: number, y1: number, x2: number, y2: number, passo = 26) => {
  const d: string[] = [];
  const w = x2 - x1;
  for (let c = y1 + passo * 0.6; c < y2 + w; c += passo) {
    // reta y = c − (x − x1), recortada no retângulo
    let xa = x1;
    let ya = c;
    if (ya > y2) {
      xa = x1 + (ya - y2);
      ya = y2;
    }
    let xb = x1 + (c - y1);
    let yb = y1;
    if (xb > x2) {
      yb = c - w;
      xb = x2;
    }
    if (xa < x2 && yb < y2 && xb > xa) d.push(linhaReta(xa, ya, xb, yb));
  }
  return d;
};

const paginaGrafico = (m: Grafico, ctx: Contexto): Montado => {
  const { R, palavras } = ctx;
  const pecas: Peca[] = [];
  const sons: Som[] = [];
  const marcos: number[] = [];
  let A = R;
  if (ctx.layout === "alto" || !ctx.C) {
    const t = tituloNoTopo(m, R, m.de);
    pecas.push(...t.pecas);
    A = { ...R, y: R.y + t.altura, h: R.h - t.altura };
  } else pecas.push(...cabecalho(m, ctx.C, m.de));
  const dados = (m.dados ?? []).slice(0, 6);
  const temDados = dados.length >= 2;
  const inicio = temDados ? dados[0].em : (m.tendenciaEm ?? m.de + 0.35);
  const ilustrativo = !temDados || !!m.ilustrativo;
  const unidade = (m.unidade ?? "").trim();
  const unidadeColada = /^[%‰]$/.test(unidade);
  const valorTexto = (v: number) => numeroBR(v) + (unidadeColada ? unidade : "");

  if (temDados && m.forma === "pizza") return pizza(m, dados, A, pecas, ilustrativo, valorTexto);

  // rótulos embaixo do eixo (até 2 linhas, tamanho comum)
  const n = temDados ? dados.length : 0;
  const x0 = A.x + 24;
  const xFim = A.x + A.w - 16;
  const slot = n ? (xFim - x0 - 20) / n : 0;
  let ls = 0;
  let linhasRot: string[][][] = [];
  if (n) {
    for (ls = 56; ls >= 30; ls *= 0.95) {
      const tentativa = dados.map((d) => quebrar(d.rotulo, ls, slot * 0.94, 2));
      if (tentativa.every(Boolean)) {
        linhasRot = tentativa as string[][][];
        break;
      }
    }
    if (!linhasRot.length) {
      // rótulos longos para tantas barras: uma palavra por linha (até 3), no tamanho em que a
      // palavra mais longa cabe na coluna dela (nunca invade a coluna vizinha)
      const maisLonga = Math.max(...dados.flatMap((d) => d.rotulo.split(/\s+/).map((w) => largura(w, 100))));
      ls = Math.max(18, Math.min(30, (slot * 0.94 * 100) / maisLonga));
      linhasRot = dados.map((d) => quebrar(d.rotulo, ls, slot * 0.94, 3) ?? d.rotulo.split(/\s+/).map((w) => [w]));
    }
  }
  const hRot = n ? maior(linhasRot.map((l) => l.length)) * ls * (1 + ENTRELINHA) + 18 : 0;
  const yTopo = A.y + 64;
  const yBase = A.y + A.h - hRot - 14;
  // os eixos (esboçados antes)
  const eixoY = linhaReta(x0, yBase + 6, x0 - 2, yTopo - 6);
  const pontaY = `M ${x0 - 16} ${yTopo + 14} L ${x0 - 2} ${yTopo - 8} L ${x0 + 13} ${yTopo + 13}`;
  const eixoX = linhaReta(x0 - 6, yBase, xFim, yBase + 3);
  const pontaX = `M ${xFim - 20} ${yBase - 13} L ${xFim + 2} ${yBase + 3} L ${xFim - 19} ${yBase + 17}`;
  pecas.push(traco("eixos", [eixoY, pontaY, eixoX, pontaX], 7, GIZ_MEIO, inicio - 0.45, 0.4, { esboco: true }));
  if (unidade && !unidadeColada) pecas.push(escrita("unidade", unidade, x0 + 28, yTopo + 6, 40, inicio - 0.2, { cor: GIZ_FRACO }));
  if (ilustrativo) pecas.push(rotulo("ilustrativo", "Ilustrativo", xFim, yTopo - 24, inicio - 0.1, "dir"));

  if (!temDados) {
    // a tendência: uma curva de giz amarelo desenhada devagar, com a ponta de seta
    const w = xFim - x0 - 70;
    const h = yBase - yTopo - 60;
    const pts: [number, number][] = Array.from({ length: 8 }, (_, k) => {
      const f = k / 7;
      const x = x0 + 34 + w * f;
      const onda = Math.sin(f * Math.PI * 3.2 + 0.6) * 0.07;
      let v: number;
      if (m.tendencia === "cai") v = 0.92 - Math.pow(f, 1.25) * 0.82 + onda;
      else if (m.tendencia === "oscila") v = 0.5 + Math.sin(f * Math.PI * 3) * 0.3;
      else v = 0.08 + Math.pow(f, 1.25) * 0.82 + onda;
      return [x, yBase - 30 - v * h];
    });
    const dur = Math.max(0.9, Math.min(2.6, m.ate - inicio - 1.0));
    pecas.push(traco("curva", [curvaPor(pts)], 10, cor.amarelo, inicio, dur));
    const [xa, ya] = pts[pts.length - 2];
    const [xb, yb] = pts[pts.length - 1];
    const ang = Math.atan2(yb - ya, xb - xa);
    const t = 30;
    const ponta = `M ${(xb - Math.cos(ang - 0.5) * t).toFixed(1)} ${(yb - Math.sin(ang - 0.5) * t).toFixed(1)} L ${xb.toFixed(1)} ${yb.toFixed(1)} L ${(xb - Math.cos(ang + 0.5) * t).toFixed(1)} ${(yb - Math.sin(ang + 0.5) * t).toFixed(1)}`;
    pecas.push(traco("ponta", [ponta], 10, cor.amarelo, inicio + dur, 0.2));
    sons.push({ em: inicio + dur, arquivo: "sfx/giz-1.wav", volume: 0.28 });
    marcos.push(inicio + dur * 0.5, inicio + dur + 0.4);
    return { pecas, sons, marcos };
  }

  const maxV = Math.max(...dados.map((d) => d.valor), 1e-6);
  const maiorI = dados.findIndex((d) => d.valor === maxV);
  const vs = Math.max(34, Math.min(64, ...dados.map((d) => ((slot * 0.92) / Math.max(1, largura(valorTexto(d.valor), 100))) * 100)));
  const alturaUtil = yBase - yTopo - vs * 1.5;
  let anterior: [number, number] | null = null;
  dados.forEach((d, i) => {
    const cx = x0 + 20 + slot * (i + 0.5);
    const h = Math.max(6, (Math.max(0, d.valor) / maxV) * alturaUtil);
    const yv = yBase - h;
    const destaque = i === maiorI;
    if (m.forma === "linha") {
      if (anterior) pecas.push(traco(`seg${i}`, [linhaReta(anterior[0], anterior[1], cx, yv)], 8, GIZ_MEIO, d.em - 0.08, 0.32));
      pecas.push(traco(`ponto${i}`, [circuloDeGiz(cx, yv, 12, 12, i + 4)], 8, cor.amarelo, d.em + 0.18, 0.2));
      anterior = [cx, yv];
    } else {
      const bw = Math.min(170, slot * 0.6);
      const xl = cx - bw / 2;
      const xr = cx + bw / 2;
      pecas.push(traco(`barra${i}`, [`M ${xl.toFixed(1)} ${yBase} L ${(xl + 1).toFixed(1)} ${yv.toFixed(1)} L ${(xr - 1).toFixed(1)} ${(yv + 1).toFixed(1)} L ${xr.toFixed(1)} ${yBase}`], 7, cor.giz, d.em - 0.08, 0.42));
      pecas.push(traco(`hach${i}`, hachura(xl + 6, yv + 6, xr - 6, yBase - 4), 4, destaque ? cor.amarelo : GIZ_FRACO, d.em + 0.3, 0.4));
    }
    const valor = escrita(`valor${i}`, valorTexto(d.valor), cx, yv - vs * 0.42, vs, d.em + 0.28, { alinhar: "centro", cor: destaque ? cor.amarelo : cor.giz });
    pecas.push(valor);
    linhasRot[i].forEach((l, k) => {
      pecas.push(escrita(`rot${i}-${k}`, l.join(" "), cx, yBase + 22 + ls + k * ls * (1 + ENTRELINHA), ls, d.em - 0.05 + k * 0.2, { alinhar: "centro", cor: cor.giz }));
    });
    sons.push({ em: d.em + 0.3, arquivo: NOTAS[Math.min(i, 3)], volume: 0.22 });
    marcos.push(d.em + 0.8);
  });
  void palavras;
  return { pecas, sons, marcos };
};

const pizza = (
  m: Grafico,
  dados: NonNullable<Grafico["dados"]>,
  A: Regiao,
  pecas: Peca[],
  ilustrativo: boolean,
  valorTexto: (v: number) => string,
): Montado => {
  const sons: Som[] = [];
  const marcos: number[] = [];
  const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
  const r = Math.min(A.w * 0.24, (A.h - 70) / 2);
  const cx = A.x + r + 30;
  const cy = A.y + 40 + (A.h - 40) / 2;
  pecas.push(traco("circulo", [circuloDeGiz(cx, cy, r, r, 11)], 7, GIZ_MEIO, dados[0].em - 0.4, 0.45, { esboco: true }));
  if (ilustrativo) pecas.push(rotulo("ilustrativo", "Ilustrativo", A.x + A.w, A.y + 30, dados[0].em - 0.2, "dir"));
  // legenda à direita: rótulo (giz) e valor (amarelo), uma linha por fatia
  const xLeg = cx + r + 56;
  const wLeg = A.x + A.w - xLeg;
  const linhaLeg = (d: { rotulo: string; valor: number }, i: number, s: number) => largura(`${i + 1} ${d.rotulo}`, s) + s * 0.4 + largura(valorTexto(d.valor), s);
  let ls = 64;
  for (; ls > 34; ls *= 0.95) {
    const ok = dados.every((d, i) => linhaLeg(d, i, ls) <= wLeg);
    const h = dados.length * ls * 1.75;
    if (ok && h <= A.h - 40) break;
  }
  const passoLeg = ls * 1.75;
  const yLeg0 = cy - (dados.length * passoLeg) / 2 + ls * 1.1;
  const maiorI = dados.reduce((k, d, i) => (d.valor > dados[k].valor ? i : k), 0);
  let ang = -Math.PI / 2;
  dados.forEach((d, i) => {
    const fatia = (Math.max(0, d.valor) / total) * Math.PI * 2;
    const a1 = ang + fatia;
    // o raio que fecha a fatia e o arco amarelo dela
    if (i === 0) pecas.push(traco("raio0", [linhaReta(cx, cy, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r)], 6, GIZ_MEIO, d.em - 0.1, 0.2));
    if (i < dados.length - 1) pecas.push(traco(`raio${i + 1}`, [linhaReta(cx, cy, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r)], 6, GIZ_MEIO, d.em + 0.05, 0.22));
    const passos = Math.max(4, Math.round(fatia * 12));
    const arco = Array.from({ length: passos + 1 }, (_, k) => {
      const a = ang + (fatia * k) / passos;
      return `${k ? "L" : "M"} ${(cx + Math.cos(a) * (r + 16)).toFixed(1)} ${(cy + Math.sin(a) * (r + 16)).toFixed(1)}`;
    }).join(" ");
    pecas.push(traco(`arco${i}`, [arco], 10, i === maiorI ? cor.amarelo : GIZ_MEIO, d.em + 0.15, 0.35));
    // o número da fatia dentro dela (se couber) e na legenda: "1 Mercado 50%"
    if (fatia > 0.45) {
      const am = ang + fatia / 2;
      pecas.push(escrita(`dentro${i}`, String(i + 1), cx + Math.cos(am) * r * 0.58, cy + Math.sin(am) * r * 0.58 + 24, 50, d.em + 0.2, { alinhar: "centro", cor: i === maiorI ? cor.amarelo : cor.giz }));
    }
    const y = yLeg0 + i * passoLeg;
    const rot = escrita(`leg${i}`, `${i + 1} ${d.rotulo}`, xLeg, y, ls, d.em - 0.05, { cor: cor.giz });
    pecas.push(rot);
    pecas.push(escrita(`legv${i}`, valorTexto(d.valor), xLeg + largura(rot.texto, ls) + ls * 0.4, y, ls, fimDe(rot) + 0.05, { cor: cor.amarelo }));
    sons.push({ em: d.em + 0.3, arquivo: NOTAS[Math.min(i, 3)], volume: 0.22 });
    marcos.push(d.em + 0.7);
    ang = a1;
  });
  void m;
  return { pecas, sons, marcos };
};

// ---------- destaque ----------

const paginaDestaque = (m: Destaque, { R, palavras }: Contexto): Montado => {
  const pecas: Peca[] = [];
  const sons: Som[] = [];
  const alerta = m.nivel === "alerta";
  const corTexto = alerta ? cor.rosa : cor.amarelo;
  const tri = alerta ? Math.min(124, R.h * 0.2) : 0;
  const gapTri = alerta ? 44 : 0;
  const temDetalhe = !!m.detalhe;
  const ajDet = temDetalhe ? ajustarTexto(m.detalhe as string, { largura: R.w * 0.86, altura: 150, maximo: 64, minimo: 44, linhas: 2 }) : null;
  const hDet = ajDet ? ajDet.altura + 60 : 0;
  const sub = alerta ? 0 : 54;
  const aj = ajustarTexto(m.texto, { largura: R.w * 0.92, altura: R.h - tri - gapTri - hDet - sub - 10, maximo: 170, minimo: 72, linhas: 3 });
  const bloco = tri + gapTri + aj.altura + sub + hDet;
  let y = R.y + Math.max(0, (R.h - bloco) / 2);
  const tempos = temposFalados(m.texto, palavras, m.em, m.ate);
  if (alerta) {
    // o sinal de atenção a giz rosa: triângulo e "!"
    const cx = R.x + R.w / 2;
    const w = tri * 1.12;
    const d = [
      `M ${cx} ${y} L ${cx + w / 2} ${y + tri} L ${cx - w / 2} ${y + tri} L ${cx + 2} ${y - 2}`,
      linhaReta(cx, y + tri * 0.32, cx + 1, y + tri * 0.66),
      linhaReta(cx, y + tri * 0.8, cx + 0.6, y + tri * 0.86),
    ];
    pecas.push(traco("sinal", d, Math.max(7, tri * 0.075), cor.rosa, m.em - 0.15, 0.4));
    y += tri + gapTri - aj.tamanho * 0.15;
    sons.push({ em: m.em, arquivo: "sfx/alerta.wav", volume: 0.34 });
  }
  const todas = new Set(aj.linhas.flat().map((_, i) => i));
  const { pecas: ps, bases } = textoEmLinhas("t", aj, tempos, R.x + R.w / 2, y, "centro", todas, { destaque: corTexto });
  pecas.push(...ps);
  const fim = fimDasPecas(ps);
  const ultimaLinha = ps.filter((p) => p.y === bases[bases.length - 1]);
  if (!alerta) {
    const x1 = ultimaLinha[0].x;
    const ult = ultimaLinha[ultimaLinha.length - 1];
    const w = ult.x + largura(ult.texto, ult.tamanho) - x1;
    pecas.push(...sublinhadoDuplo("duplo", { ...ult, x: x1, alinhar: "esq" }, fim + 0.08, w));
    sons.push({ em: fim + 0.1, arquivo: "sfx/giz-2.wav", volume: 0.32 });
  }
  y = bases[bases.length - 1] + sub;
  if (ajDet) {
    const tDet = temposFalados(m.detalhe as string, palavras, m.detalheEm ?? fim + 0.2, m.ate);
    const r = textoEmLinhas("det", ajDet, tDet, R.x + R.w / 2, y + 30, "centro", new Set(), { base: GIZ_MEIO });
    pecas.push(...r.pecas);
  }
  return { pecas, sons, marcos: [m.em + 0.5, fim + 0.6] };
};

// ---------- definição (verbete: termo = significado) ----------

const paginaDefinicao = (m: Definicao, ctx: Contexto): Montado => {
  const { R, palavras } = ctx;
  const pecas: Peca[] = [];
  const tTermo = temposFalados(m.termo, palavras, m.em, Math.max(m.significadoEm, m.em + 0.6));
  let A = R;
  let termo: PecaEscrita[];
  if (ctx.layout !== "alto" && ctx.C) {
    termo = cabecalhoFalado("termo", m.termo, ctx.C, tTermo, { cor: cor.amarelo, maximo: 140, minimo: 56, linhas: 3 }).pecas;
  } else {
    const aj = ajustarTexto(m.termo, { largura: R.w * 0.9, altura: 210, maximo: 120, minimo: 60, linhas: 2 });
    termo = textoEmLinhas("termo", aj, tTermo, R.x + R.w / 2, R.y, "centro", new Set(), { base: cor.amarelo }).pecas;
    A = { ...R, y: R.y + aj.altura + aj.tamanho * 0.7, h: R.h - aj.altura - aj.tamanho * 0.7 };
  }
  pecas.push(...termo);
  // sublinhado amarelo embaixo do termo
  const baseTermo = maior(termo.map((p) => p.y));
  const ultimaTermo = termo.filter((p) => p.y === baseTermo);
  const ult = ultimaTermo[ultimaTermo.length - 1];
  const fimTermo = fimDasPecas(termo);
  pecas.push(
    traco("sub-termo", [sublinhadoDeGiz(ultimaTermo[0].x - 6, ult.x + largura(ult.texto, ult.tamanho) + 6, baseTermo + ult.tamanho * 0.3, 3)], Math.max(7, ult.tamanho * 0.06), cor.amarelo, fimTermo + 0.08, 0.28, {
      depois: ult.id,
    }),
  );
  // "= significado": o "=" do tamanho da letra, esboçado antes
  const wEqDe = (t: number) => largura("=", t) + t * 0.4;
  let aj = ajustarTexto(m.significado, { largura: A.w - wEqDe(100) - 10, altura: A.h - 30, maximo: 104, minimo: 52, linhas: 4 });
  aj = ajustarTexto(m.significado, { largura: A.w - wEqDe(aj.tamanho) - 10, altura: A.h - 30, maximo: 104, minimo: 52, linhas: 4 });
  const wEq = wEqDe(aj.tamanho);
  const larguraBloco = wEq + maior(aj.larguras);
  const x0 = A.x + Math.max(0, (A.w - larguraBloco) / 2);
  const topo = A.y + Math.max(10, (A.h - aj.altura) * 0.38);
  const yEq = topo + aj.tamanho;
  pecas.push(escrita("igual", "=", x0, yEq, aj.tamanho, m.significadoEm - 0.15, { esboco: true, dur: 0.16, cor: cor.amarelo }));
  const tSig = temposFalados(m.significado, palavras, m.significadoEm, m.ate);
  const r = textoEmLinhas("sig", aj, tSig, x0 + wEq, topo, "esq");
  pecas.push(...r.pecas);
  const fim = fimDasPecas(r.pecas);
  return {
    pecas,
    sons: [{ em: m.significadoEm + 0.1, arquivo: "sfx/giz-3.wav", volume: 0.28 }],
    marcos: [fimTermo + 0.4, m.significadoEm + 0.6, fim + 0.5],
  };
};

// ---------- frase (citação entre aspas) ----------

const aspas = (x: number, y: number, s: number, abre: boolean) => {
  // duas marcas grossas e curvas, como na mão: “ (abre) ou ” (fecha). Caixa: largura ~0,6 s, altura ~0,5 s
  const f = (v: number) => v.toFixed(1);
  const um = (cx: number) =>
    abre
      ? `M ${f(cx + s * 0.16)} ${f(y)} C ${f(cx - s * 0.04)} ${f(y + s * 0.1)}, ${f(cx - s * 0.08)} ${f(y + s * 0.3)}, ${f(cx + s * 0.02)} ${f(y + s * 0.46)}`
      : `M ${f(cx - s * 0.02)} ${f(y)} C ${f(cx + s * 0.08)} ${f(y + s * 0.16)}, ${f(cx + s * 0.04)} ${f(y + s * 0.36)}, ${f(cx - s * 0.16)} ${f(y + s * 0.46)}`;
  return [um(x), um(x + s * 0.3)];
};

const paginaFrase = (m: Frase, { R, palavras }: Contexto): Montado => {
  const pecas: Peca[] = [];
  const sons: Som[] = [];
  const aj = ajustarTexto(m.texto, { largura: R.w * 0.82, altura: R.h - 40, maximo: 116, minimo: 60, linhas: 4, juntas: juntasDoDestaque(m.texto, m.destaque) });
  const inicio = m.em ?? m.de;
  const tempos = temposFalados(m.texto, palavras, inicio, m.ate);
  const todas = aj.linhas.flat();
  const amarelas = indicesDoDestaque(todas, m.destaque);
  const topo = R.y + Math.max(0, (R.h - aj.altura) / 2);
  const { pecas: ps } = textoEmLinhas("t", aj, tempos, R.x + R.w / 2, topo, "centro", amarelas);
  pecas.push(...ps);
  const s = aj.tamanho;
  const esq = Math.min(...ps.map((p) => p.x));
  const aspaS = Math.max(90, s * 1.3);
  const grossura = Math.max(11, aspaS * 0.13);
  pecas.push(traco("abre", aspas(esq - aspaS * 0.62, topo + s * 0.02, aspaS, true), grossura, cor.amarelo, inicio - 0.12, 0.22));
  const fim = fimDasPecas(ps);
  const ultima = ps[ps.length - 1];
  const xFim = ultima.x + largura(ultima.texto, ultima.tamanho);
  pecas.push(traco("fecha", aspas(xFim + aspaS * 0.22, ultima.y - s * 1.05, aspaS, false), grossura, cor.amarelo, fim + 0.06, 0.2, { depois: ultima.id }));
  const marcos = [...tempos.filter((_, i) => i % 3 === 2), fim + 0.5];
  if (m.risco) {
    // o trecho riscado a giz rosa, linha por linha, quando é dito
    const riscadas = [...indicesDoDestaque(todas, m.risco)].sort((a, b) => a - b);
    if (riscadas.length) {
      const pr = riscadas.map((i) => ps[i]);
      const linhas = [...new Set(pr.map((p) => p.y))];
      let primeiro = Infinity;
      linhas.forEach((yl, k) => {
        // cada linha é riscada assim que a última palavra dela é escrita (e não antes do `riscoEm`)
        const naLinha = pr.filter((p) => p.y === yl);
        const x1 = naLinha[0].x - 12;
        const u = naLinha[naLinha.length - 1];
        const x2 = u.x + largura(u.texto, u.tamanho) + 12;
        const em = Math.max(m.riscoEm ?? 0, fimDasPecas(naLinha)) + 0.03;
        primeiro = Math.min(primeiro, em);
        pecas.push(traco(`risco${k}`, [sublinhadoDeGiz(x1, x2, yl - s * 0.42, 13 + k)], Math.max(9, s * 0.11), cor.rosa, em, 0.24, { respira: true, depois: u.id }));
      });
      sons.push({ em: primeiro + 0.1, arquivo: "sfx/giz-1.wav", volume: 0.3 });
      marcos.push(primeiro + 0.5);
    }
  }
  return { pecas, sons, marcos };
};

// ---------- pergunta ----------

// "?" grande a giz (caixa: altura 100, largura ~64)
const interrogacao = (x: number, y: number, h: number) => {
  const s = h / 100;
  const p = (a: number, b: number) => `${(x + a * s).toFixed(1)} ${(y + b * s).toFixed(1)}`;
  return [
    `M ${p(4, 26)} C ${p(4, 9)}, ${p(17, 0)}, ${p(32, 0)} C ${p(48, 0)}, ${p(60, 11)}, ${p(60, 26)} C ${p(60, 41)}, ${p(48, 48)}, ${p(39, 55)} C ${p(33, 60)}, ${p(31, 65)}, ${p(31, 74)}`,
    `M ${p(31, 92)} L ${p(31.6, 98)}`,
  ];
};

const paginaPergunta = (m: Pergunta, ctx: Contexto): Montado => {
  const { R, palavras } = ctx;
  const pecas: Peca[] = [];
  const sons: Som[] = [];
  const marcos: number[] = [];
  const inicio = m.em ?? m.de;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const fimPergunta = opcoes[0]?.em ?? m.ate;
  const tempos = temposFalados(m.texto, palavras, inicio, Math.max(fimPergunta, inicio + 0.6));
  if (!opcoes.length || ctx.layout === "alto" || !ctx.C) {
    // um "?" grande a giz amarelo em cima (esboçado; fecha quando a pergunta termina) e a pergunta embaixo
    const hOpc = opcoes.length ? Math.min(R.h * 0.6, opcoes.length * 150) : 0;
    const A = { ...R, h: R.h - hOpc };
    const qh = Math.min(opcoes.length ? 110 : 170, A.h * 0.3);
    const gap = 34;
    const aj = ajustarTexto(m.texto, { largura: A.w * 0.92, altura: A.h - qh - gap - 10, maximo: 116, minimo: 56, linhas: 4 });
    const bloco = qh + gap + aj.altura;
    const topo = A.y + Math.max(0, (A.h - bloco) / 2);
    const { pecas: ps } = textoEmLinhas("t", aj, tempos, A.x + A.w / 2, topo + qh + gap - aj.tamanho * 0.1, "centro");
    pecas.push(...ps);
    const fim = fimDasPecas(ps);
    pecas.push(traco("interrogacao", interrogacao(A.x + A.w / 2 - qh * 0.32, topo, qh), Math.max(9, qh * 0.065), cor.amarelo, Math.max(inicio + 0.3, fim - 0.1), 0.45, { esboco: true }));
    sons.push({ em: fim + 0.2, arquivo: "sfx/giz-2.wav", volume: 0.28 });
    marcos.push(...tempos.filter((_, i) => i % 3 === 2), fim + 0.6);
    if (opcoes.length) pecas.push(...opcoesDeProva(opcoes, { ...R, y: R.y + R.h - hOpc, h: hOpc }, palavras, m.ate, marcos, sons));
    return { pecas, sons, marcos };
  }
  // questão de prova: a pergunta ao lado da janela; as opções a) b) c) embaixo
  const r = cabecalhoFalado("t", m.texto, ctx.C, tempos, { cor: cor.giz, maximo: 104, minimo: 46, linhas: 5 });
  pecas.push(...r.pecas);
  marcos.push(fimDasPecas(r.pecas) + 0.4);
  pecas.push(...opcoesDeProva(opcoes, R, palavras, m.ate, marcos, sons));
  return { pecas, sons, marcos };
};

const opcoesDeProva = (opcoes: { texto: string; em: number }[], A: Regiao, palavras: Palavra[], ate: number, marcos: number[], sons: Som[]): Peca[] => {
  const pecas: Peca[] = [];
  const itens = opcoes.map((o) => ({ texto: o.texto, em: o.em }));
  const marca = (s: number) => s * 1.5 + largura("b)", s);
  const med = medirLista(itens, (s) => A.w - marca(s) - 10, A.h - 10, 0.75, 92, 48);
  const { s } = med;
  const larguraBloco = maior(med.medidos.map((it) => maior(it.linhas.map((l) => largura(l.join(" "), s)))));
  const x0 = A.x + Math.max(0, (A.w - marca(s) - larguraBloco) / 2);
  let y = A.y + Math.max(0, (A.h - med.h) / 2);
  opcoes.forEach((o, i) => {
    const tempos = temposFalados(o.texto, palavras, o.em, opcoes[i + 1]?.em ?? ate);
    const aj: TextoAjustado = { linhas: med.medidos[i].linhas, tamanho: s, larguras: [], altura: 0 };
    const r = textoEmLinhas(`op${i}`, aj, tempos, x0 + marca(s), y, "esq");
    const b = r.bases[0];
    // quadradinho de marcar (giz, esboçado antes) e a letra da opção em amarelo
    const q = s * 0.82;
    const qx = x0;
    const qy = b - q * 0.95;
    pecas.push(traco(`caixa${i}`, [`M ${qx} ${qy} L ${qx + q} ${qy + 2} L ${qx + q - 2} ${qy + q} L ${qx + 1} ${qy + q - 1} L ${qx + 2} ${qy - 3}`], Math.max(5, s * 0.05), GIZ_MEIO, o.em - 0.2, 0.25, { esboco: true }));
    pecas.push(escrita(`letra${i}`, `${String.fromCharCode(97 + i)})`, qx + q + s * 0.28, b, s, o.em - 0.05, { cor: cor.amarelo, dur: 0.2 }));
    pecas.push(...r.pecas);
    y = r.bases[r.bases.length - 1] + s * 0.75;
    marcos.push(o.em + 0.6);
    sons.push({ em: o.em + 0.1, arquivo: NOTAS[Math.min(i + 1, 3)], volume: 0.22 });
  });
  return pecas;
};

// ---------- todos ----------

export const montarBloco = (m: Universal, ctx: Contexto): Montado | null => {
  switch (m.tipo) {
    case "abertura":
      return paginaAbertura(m, ctx);
    case "topicos":
      return paginaLista(m, ctx, false);
    case "passos":
      return paginaLista(m, ctx, true);
    case "numero":
      return paginaNumero(m, ctx);
    case "comparacao":
      return paginaComparacao(m, ctx);
    case "grafico":
      return paginaGrafico(m, ctx);
    case "destaque":
      return paginaDestaque(m, ctx);
    case "definicao":
      return paginaDefinicao(m, ctx);
    case "frase":
      return paginaFrase(m, ctx);
    case "pergunta":
      return paginaPergunta(m, ctx);
    default:
      return null;
  }
};
