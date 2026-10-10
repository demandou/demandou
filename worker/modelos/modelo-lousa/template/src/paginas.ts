// Cada momento do plano vira uma "página" da lousa: uma lista de peças (o que é escrito, onde e
// quando). O desenho em si fica em componentes/Lousa.tsx; aqui é só diagramação e tempo.
import { temposDoTexto, vaiVem } from "./anim";
import { montarBloco } from "./blocos";
import { duracaoDaEscrita, molduraDeGiz, montarLinha, setaEmArco, sublinhadoDeGiz } from "./giz/Escrita";
import { GLIFOS, pontoNoCaminho } from "./giz/glifos";
import { caixaDoLayout, layoutDe, type Regiao, regioesDoLayout, trechosDaJanela } from "./layout";
import { caixaNoTempo, type EstadoDaCaixa } from "./motor/caixa";
import {
  ajustarTexto,
  cabecalho,
  caber,
  circuloEm,
  ENTRELINHA,
  escrita,
  esquerdaDe,
  fimDe,
  indicesDoDestaque,
  juntasDoDestaque,
  largura,
  linhaCorrida,
  type Peca,
  quebrar,
  type PecaEscrita,
  palavrasEmLinha,
  rotulo,
  type Som,
  sublinhadoDuplo,
  textoEmLinhas,
} from "./pecas";
import type { Coluna, Cta, Fracao, Layout, LinhaDeRegra, Momento, Plano, Regra, Resultado, Titulo, Virgula } from "./plano";
import { cor, H, MIN, W } from "./tema";

export type { Alinhar, Peca, PecaEscrita, PecaRotulo, PecaTraco, Som } from "./pecas";

export type Pagina = {
  indice: number;
  m: Momento;
  layout: Layout;
  de: number;
  // até quando a página fica na lousa (o apagador da próxima começa aqui)
  ate: number;
  pecas: Peca[];
  // área ocupada (o apagador passa por ela)
  area: Regiao;
  // caixa de cada peça (o apagador passa só onde há giz)
  caixas: Regiao[];
  // quando o apagador começa a limpar esta página (a próxima página define; sem próxima, nunca)
  apagaEm?: number;
  // quando a página anterior terminou de ser apagada: só então se escreve onde ela estava
  // e os números herdados deslizam para o lugar novo
  limpaEm: number;
  sons: Som[];
  // instantes importantes (para os quadros de conferência)
  marcos: number[];
};

export const caixaDaPeca = (p: Peca): Regiao => {
  if (p.tipo === "traco") {
    const nums = p.d.join(" ").match(/-?\d*\.?\d+/g)?.map(Number) ?? [0, 0];
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x: x - p.largura, y: y - p.largura, w: Math.max(...xs) - x + 2 * p.largura, h: Math.max(...ys) - y + 2 * p.largura };
  }
  if (p.tipo === "rotulo") {
    const w = p.texto.length * p.tamanho * 0.68;
    return { x: esquerdaDe(p.x, w, p.alinhar), y: p.y - p.tamanho, w, h: p.tamanho * 1.3 };
  }
  const w = largura(p.texto, p.tamanho);
  const x = esquerdaDe(p.x, w, p.alinhar) + Math.min(0, p.desloca?.dx ?? 0);
  const extra = Math.abs(p.desloca?.dx ?? 0);
  const caixa = { x, y: p.y - p.tamanho * 1.2, w: w + extra, h: p.tamanho * 1.55 };
  if (!p.trajeto) return caixa;
  // o que anda sobre um caminho ocupa o caminho inteiro (mais o próprio desenho)
  const pts = Array.from({ length: 21 }, (_, k) => pontoNoCaminho(p.trajeto!.d, k / 20));
  const [x0, y0] = pontoNoCaminho(p.trajeto.d, 0);
  const xs = pts.map(([px]) => px - x0 + x);
  const ys = pts.map(([, py]) => py - y0 + p.y);
  const xMin = Math.min(x, ...xs);
  const yMin = Math.min(...ys) - p.tamanho * 0.3;
  return { x: xMin, y: yMin, w: Math.max(x + w, ...xs.map((v) => v + w)) - xMin, h: Math.max(p.y, ...ys) + p.tamanho * 0.3 - yMin };
};

const uniao = (caixas: Regiao[]): Regiao => {
  if (!caixas.length) return { x: 0, y: 0, w: 0, h: 0 };
  const x = Math.min(...caixas.map((c) => c.x));
  const y = Math.min(...caixas.map((c) => c.y));
  const x2 = Math.max(...caixas.map((c) => c.x + c.w));
  const y2 = Math.max(...caixas.map((c) => c.y + c.h));
  return { x, y, w: x2 - x, h: y2 - y };
};

// ---------- componentes ----------

const paginaTitulo = (m: Titulo, R: Regiao, palavras: Plano["palavras"]) => {
  const pecas: Peca[] = [];
  const marcos: number[] = [];
  const topoRotulo = m.rotulo ? 66 : 0;
  if (m.rotulo) pecas.push(rotulo("rotulo", m.rotulo, R.x + R.w / 2, R.y + MIN.rotulo, m.de + 0.15, "centro"));
  const linhas = m.linhas.slice(0, 3);
  const curtas = linhas.map((l) => l.replace(/\s/g, "").length <= 6);
  // nunca vaza: se nem no mínimo couber, a linha diminui o que precisar
  let tamanhos = linhas.map((l, i) => Math.min(caber(l, R.w * 0.94, curtas[i] ? 210 : 130, 56), (R.w * 0.94 * 100) / Math.max(1, largura(l, 100))));
  const sub = m.sublinharEm !== undefined ? 44 : 0;
  const altura = () => tamanhos.reduce((a, t, i) => a + t + (i ? t * 0.36 : 0), 0);
  const disponivel = R.h - topoRotulo - sub - 10;
  if (altura() > disponivel) tamanhos = tamanhos.map((t) => t * (disponivel / altura()));
  const todas = linhas.join(" ").split(/\s+/).filter(Boolean);
  const tempos = temposDoTexto(todas.join(" "), palavras, m.de, m.ate, m.de);
  const amarelas = indicesDoDestaque(todas, m.destaque);
  let y = R.y + topoRotulo + Math.max(0, (disponivel - altura()) / 2);
  let indice = 0;
  let ultimas: PecaEscrita[] = [];
  linhas.forEach((l, i) => {
    y += tamanhos[i] + (i ? tamanhos[i] * 0.36 : 0);
    const ws = l.split(/\s+/).filter(Boolean);
    ultimas = palavrasEmLinha("t", ws, tempos, R.x + R.w / 2, y, tamanhos[i], "centro", amarelas, indice);
    pecas.push(...ultimas);
    indice += ws.length;
  });
  marcos.push(...tempos);
  if (m.sublinharEm !== undefined && ultimas.length) {
    const ini = ultimas[0];
    const fim = ultimas[ultimas.length - 1];
    const x2 = fim.x + largura(fim.texto, fim.tamanho);
    pecas.push({
      tipo: "traco",
      id: "sublinhado",
      d: [sublinhadoDeGiz(ini.x - 6, x2 + 6, y + ini.tamanho * 0.34, 5)],
      largura: Math.max(8, ini.tamanho * 0.07),
      cor: cor.amarelo,
      em: m.sublinharEm,
      dur: 0.32,
    });
    marcos.push(m.sublinharEm);
  }
  return { pecas, marcos, sons: [] as Som[] };
};

const paginaVirgula = (m: Virgula, C: Regiao | null, R: Regiao) => {
  const pecas: Peca[] = [...cabecalho(m, C, m.de)];
  const sons: Som[] = [];
  // dígitos, posição da vírgula antes e depois
  let digitos = m.numero.replace(/[^\d]/g, "");
  let ci = m.numero.includes(",") ? m.numero.indexOf(",") : digitos.length;
  let cf = ci - m.casas;
  const zerosEsq = cf < 1 ? 1 - cf : 0;
  digitos = "0".repeat(zerosEsq) + digitos;
  ci += zerosEsq;
  cf += zerosEsq;
  const zerosDir = cf > digitos.length ? cf - digitos.length : 0;
  digitos += "0".repeat(zerosDir);
  const novos = (j: number) => j < zerosEsq || j >= digitos.length - zerosDir;

  const larguraLinha = (s: number) => {
    const pref = m.prefixo ? largura(m.prefixo, s * 0.6) + s * 0.2 : 0;
    return pref + largura(digitos, s) + (GLIFOS[","].a * s) / 100;
  };
  const SA = Math.max(MIN.conta, Math.min(225, (R.h - 20) / 3.2, ((R.w * 0.9) / larguraLinha(100)) * 100));
  const SB = Math.min(SA, 225);
  const larguraA = larguraLinha(SA);
  const x0 = R.x + (R.w - larguraA) / 2;
  const yA = R.y + 20 + SA * 0.55 + SA;
  const vw = (GLIFOS[","].a * SA) / 100;
  let xd = x0;
  if (m.prefixo) {
    pecas.push(escrita("prefixo", m.prefixo, x0, yA, SA * 0.6, m.numeroEm));
    xd += largura(m.prefixo, SA * 0.6) + SA * 0.2;
  }
  const avanco = (j: number) => {
    let x = 0;
    for (let k = 0; k < j; k++) x += (GLIFOS[digitos[k]].a * SA) / 100;
    return x;
  };
  const inicioDigitos = m.numeroEm + (m.prefixo ? 0.22 : 0);
  const porDigito = Math.min(0.26, 0.6 / Math.max(1, digitos.length - zerosEsq - zerosDir));
  const mover = { de: m.moverEm + 0.3, ate: m.moverEm + 0.78 };
  // depois da vírgula, só zeros? então eles esmaecem (8,0 = 8)
  const depois = digitos.slice(cf);
  const zerosNoFim = depois.length > 0 && /^0+$/.test(depois);
  let ordem = 0;
  for (let j = 0; j < digitos.length; j++) {
    const xIni = xd + avanco(j) + (j >= ci ? vw : 0);
    const xFim = xd + avanco(j) + (j >= cf ? vw : 0);
    const em = novos(j) ? mover.ate - 0.05 : inicioDigitos + ordem++ * porDigito;
    pecas.push(
      escrita(`dig-${j}`, digitos[j], xIni, yA, SA, em, {
        dur: novos(j) ? 0.22 : porDigito + 0.05,
        desloca: xFim !== xIni ? { dx: xFim - xIni, dy: 0, de: mover.de, ate: mover.ate } : undefined,
        esmaece: zerosNoFim && j >= cf ? mover.ate + 0.15 : undefined,
      }),
    );
  }
  // a vírgula (amarela) e a seta por onde ela anda
  const xvIni = xd + avanco(ci);
  const xvFim = xd + avanco(cf);
  const temVirgula = m.numero.includes(",");
  const arco = `M ${xvIni.toFixed(1)} ${yA} C ${xvIni.toFixed(1)} ${(yA - SA * 1.55).toFixed(1)}, ${xvFim.toFixed(1)} ${(yA - SA * 1.55).toFixed(1)}, ${xvFim.toFixed(1)} ${yA}`;
  pecas.push(
    escrita("virgula", ",", xvIni, yA, SA, temVirgula ? inicioDigitos + ci * porDigito : m.moverEm, {
      cor: cor.amarelo,
      dur: 0.16,
      trajeto: { d: arco, de: mover.de, ate: mover.ate },
    }),
  );
  const yS = yA - SA * 1.12;
  const seta = setaEmArco(xvIni + vw * 0.5, yS, xvFim + vw * 0.7, yS + SA * 0.06, SA * 0.32);
  pecas.push({ tipo: "traco", id: "seta", d: [seta.arco, seta.ponta], largura: Math.max(7, SA * 0.05), cor: cor.amarelo, em: m.moverEm + 0.05, dur: 0.32 });
  sons.push({ em: mover.ate - 0.05, arquivo: "sfx/giz-1.wav", volume: 0.3 });

  // resultado: "= 8", com o "?" esperando no lugar
  const wEq = largura("=", SB);
  const wR = largura(m.resultado, SB);
  const larguraB = wEq + SB * 0.5 + wR;
  const xB = R.x + (R.w - larguraB) / 2;
  const yB = yA + SA * 0.46 + SB;
  const xR = xB + wEq + SB * 0.5;
  pecas.push(escrita("igual", "=", xB, yB, SB, m.resultadoEm - 0.05, { esboco: true, dur: 0.16 }));
  pecas.push(escrita("espera", "?", xR + wR / 2 - largura("?", SB * 0.9) / 2, yB, SB * 0.9, m.resultadoEm + 0.1, { esboco: true, some: m.resultadoEm + 0.1 }));
  const res = escrita("resultado", m.resultado, xR, yB, SB, m.resultadoEm + 0.1, { cor: cor.amarelo, chave: m.resultado });
  pecas.push(res, circuloEm("circulo", res, fimDe(res) + 0.02));
  sons.push({ em: fimDe(res), arquivo: "sfx/giz-2.wav", volume: 0.36 });
  return { pecas, sons, marcos: [m.numeroEm + 0.6, m.moverEm + 0.9, fimDe(res) + 0.45] };
};

const paginaFracao = (m: Fracao, C: Regiao | null, R: Regiao) => {
  const pecas: Peca[] = [...cabecalho(m, C, m.de)];
  const sons: Som[] = [];
  // a nota ("metade") fica ao lado do traço se a conta continuar grande; senão, vai para cima
  const medidas = (SF: number, notaAoLado: boolean) => {
    const SR = SF * 1.06;
    const SN = Math.max(MIN.texto + 12, Math.min(96, SF * 0.42));
    const wb = Math.max(largura(m.numerador, SF), largura(m.denominador, SF)) + SF * 0.5;
    const wN = m.nota ? largura(m.nota, SN) : 0;
    const conta = wb + SF * 0.36 + largura("=", SR) + SF * 0.48 + largura(m.resultado, SR);
    const total = notaAoLado && m.nota ? wN + SF * 0.32 + conta : Math.max(conta, wN);
    const alturaNota = !notaAoLado && m.nota ? SN + SF * 0.5 : 0;
    return { SR, SN, wb, wN, total, alturaNota };
  };
  const tamanho = (aoLado: boolean) => {
    const m100 = medidas(100, aoLado);
    const porAltura = (R.h - 30) / (2.7 + m100.alturaNota / 100);
    return Math.min(240, porAltura, (R.w * 0.94 * 100) / m100.total);
  };
  const aoLado = !m.nota || tamanho(true) >= 180;
  // palavras no lugar dos números ("poucos" / "todos"): o mínimo é o da letra
  const SF = Math.max([m.numerador, m.denominador, m.resultado].some(temLetra) ? 44 : MIN.conta, tamanho(aoLado));
  const { SR, SN, wb, wN, alturaNota } = medidas(SF, aoLado);
  const conta = wb + SF * 0.36 + largura("=", SR) + SF * 0.48 + largura(m.resultado, SR);
  const larguraBloco = aoLado && m.nota ? wN + SF * 0.32 + conta : conta;
  const x0 = R.x + (R.w - larguraBloco) / 2;
  const topo = R.y + (R.h - (2.7 * SF + alturaNota)) / 2;
  const barY = topo + alturaNota + 1.33 * SF;
  const xb = x0 + (aoLado && m.nota ? wN + SF * 0.32 : 0);
  if (m.nota) {
    const em = m.notaEm ?? m.tracoEm;
    if (aoLado) pecas.push(escrita("nota", m.nota, x0, barY + SN * 0.42, SN, em));
    else pecas.push(escrita("nota", m.nota, xb + wb / 2, topo + SN, SN, em, { alinhar: "centro" }));
  }
  pecas.push(
    escrita("numerador", m.numerador, xb + wb / 2, barY - SF * 0.3, SF, m.numeradorEm ?? m.de + 0.1, {
      alinhar: "centro",
      herda: m.numeradorEm === undefined ? m.numerador : undefined,
      chave: m.numerador,
    }),
  );
  pecas.push({ tipo: "traco", id: "traco", d: [sublinhadoDeGiz(xb, xb + wb, barY, 7)], largura: Math.max(8, SF * 0.06), cor: cor.giz, em: m.tracoEm, dur: 0.3, esboco: true });
  pecas.push(escrita("denominador", m.denominador, xb + wb / 2, barY + SF * 0.3 + SF, SF, m.denominadorEm, { alinhar: "centro" }));
  const xEq = xb + wb + SF * 0.36;
  const yR = barY + SR * 0.5;
  const xR = xEq + largura("=", SR) + SF * 0.48;
  const wR = largura(m.resultado, SR);
  pecas.push(escrita("igual", "=", xEq, yR, SR, m.resultadoEm - 0.05, { esboco: true, dur: 0.16 }));
  pecas.push(escrita("espera", "?", xR + wR / 2 - largura("?", SR * 0.9) / 2, yR, SR * 0.9, m.resultadoEm + 0.1, { esboco: true, some: m.resultadoEm + 0.1 }));
  const res = escrita("resultado", m.resultado, xR, yR, SR, m.resultadoEm + 0.1, { cor: cor.amarelo, chave: m.resultado });
  pecas.push(res, circuloEm("circulo", res, fimDe(res) + 0.02));
  sons.push({ em: fimDe(res), arquivo: "sfx/giz-3.wav", volume: 0.36 });
  return { pecas, sons, marcos: [m.tracoEm + 0.4, m.denominadorEm + 0.4, fimDe(res) + 0.45] };
};

// valor com letras (fora "R$"/"US$"): a conta é de palavras
const temLetra = (v: string) => /[A-Za-zÀ-ÿ]/.test(v.replace(/R\$|US\$/g, ""));

// Conta de palavras: as parcelas escritas uma embaixo da outra, cada uma com o sinal na frente,
// o traço e "= total" circulado ("impulso + sem critério + risco = prejuízo").
const paginaColunaPalavras = (m: Coluna, C: Regiao | null, R: Regiao) => {
  const pecas: Peca[] = [...cabecalho(m, C, m.de)];
  const sons: Som[] = [];
  const itens = m.itens.slice(0, 4);
  const n = itens.length;
  const linhasTodas = [...itens, m.total];
  // colunas: rótulo (opcional, amarelo, à direita) | sinal | palavras
  const colunas = (S: number) => {
    const SL = Math.max(40, S * 0.5);
    const wOp = Math.max(largura(m.operador, S), largura("=", S));
    const maxRot = Math.max(0, ...linhasTodas.map((l) => (l.rotulo ? largura(l.rotulo, SL) : 0)));
    const antes = (maxRot ? maxRot + S * 0.34 : 0) + wOp + S * 0.45;
    return { SL, wOp, maxRot, antes, livre: R.w * 0.94 - antes };
  };
  // cada parcela numa linha; se a mais longa deixar tudo pequeno, ela quebra em duas
  const montar = (S: number, quebra: boolean) => {
    const c = colunas(S);
    const ls: string[][][] = [];
    for (const l of linhasTodas) {
      const q = quebrar(l.valor, S, c.livre, quebra && l !== m.total ? 2 : 1);
      if (!q) return null;
      ls.push(q);
    }
    const nLinhas = ls.slice(0, n).reduce((a, q) => a + q.length, 0);
    const altura = S * (nLinhas + (nLinhas - n) * ENTRELINHA + (n - 1) * 0.45 + 0.4 + 0.3 + 1 + 0.35);
    return altura <= R.h - 20 ? { S, c, ls, altura } : null;
  };
  let escolha: NonNullable<ReturnType<typeof montar>> | null = null;
  for (let S = 130; S >= 34 && !escolha; S *= 0.96) escolha = montar(S, false);
  for (let S = 130; S >= 34; S *= 0.96) {
    const q = montar(S, true);
    if (q) {
      if (!escolha || q.S > escolha.S * 1.18) escolha = q;
      break;
    }
  }
  const { S, c, ls, altura } = escolha ?? { S: 34, c: colunas(34), ls: linhasTodas.map((l) => [l.valor.split(/\s+/)]), altura: R.h - 20 };
  const { SL, wOp, maxRot } = c;
  const larguraTexto = Math.max(...ls.flat().map((l) => largura(l.join(" "), S)));
  const larguraTotal = c.antes + larguraTexto;
  const x0 = R.x + (R.w - larguraTotal) / 2;
  const xRot = x0 + maxRot;
  const xOp = xRot + (maxRot ? S * 0.34 : 0);
  const xTxt = xOp + wOp + S * 0.45;
  let y = R.y + (R.h - altura) / 2 + S;
  const rotuloEm = (p: PecaEscrita, l: { rotulo?: string }, i: number, em: number) => {
    if (!l.rotulo) return;
    pecas.push(escrita(`rot-${i}`, l.rotulo, xRot, p.y - S / 2 + SL / 2, SL, em, { alinhar: "dir", cor: cor.amarelo }));
  };
  itens.forEach((it, i) => {
    const herdado = it.em === undefined;
    const em = it.em ?? m.de + 0.1 + i * 0.12;
    if (i > 0) {
      const emOp = i === 1 ? Math.min(m.operadorEm, em - 0.1) : herdado ? m.operadorEm + i * 0.1 : em - 0.14;
      pecas.push(escrita(`operador-${i}`, m.operador, xOp, y, S, emOp, { dur: 0.2, cor: cor.amarelo }));
    }
    const linhas = ls[i];
    let primeira: PecaEscrita | null = null;
    linhas.forEach((l, k) => {
      const texto = l.join(" ");
      const inteira = linhas.length === 1;
      const p = escrita(`item-${i}-${k}`, texto, xTxt, y, S, em + k * 0.3, {
        herda: herdado && inteira ? it.valor : undefined,
        chave: inteira ? it.valor : undefined,
      });
      pecas.push(p);
      primeira = primeira ?? p;
      if (k < linhas.length - 1) y += S * (1 + ENTRELINHA);
    });
    if (primeira) rotuloEm(primeira, it, i, herdado ? m.de + 0.35 + i * 0.3 : em + 0.1);
    if (i < n - 1) y += S * 1.45;
  });
  const yTraco = y + S * 0.4;
  pecas.push({
    tipo: "traco",
    id: "traco",
    d: [sublinhadoDeGiz(xOp - S * 0.12, xTxt + larguraTexto + S * 0.12, yTraco, 3)],
    largura: Math.max(8, S * 0.06),
    cor: cor.giz,
    em: m.tracoEm,
    dur: 0.3,
    esboco: true,
  });
  const yT = yTraco + S * 0.3 + S;
  pecas.push(escrita("igual", "=", xOp, yT, S, m.total.em - 0.12, { esboco: true, dur: 0.16 }));
  pecas.push(escrita("espera", "?", xTxt, yT, S * 0.9, m.total.em, { esboco: true, some: m.total.em }));
  const tot = escrita("total", ls[n].map((l) => l.join(" ")).join(" "), xTxt, yT, S, m.total.em, { cor: cor.amarelo, chave: m.total.valor });
  pecas.push(tot);
  rotuloEm(tot, m.total, n, fimDe(tot) + 0.02);
  pecas.push(circuloEm("circulo", tot, fimDe(tot) + 0.02));
  sons.push({ em: fimDe(tot), arquivo: "sfx/giz-4.wav", volume: 0.38 });
  return { pecas, sons, marcos: [...itens.filter((it) => it.em !== undefined).map((it) => (it.em as number) + 0.6), m.tracoEm + 0.35, fimDe(tot) + 0.6] };
};

const paginaColuna = (m: Coluna, C: Regiao | null, R: Regiao) => {
  if ([...m.itens, m.total].some((l) => temLetra(l.valor))) return paginaColunaPalavras(m, C, R);
  const pecas: Peca[] = [...cabecalho(m, C, m.de)];
  const sons: Som[] = [];
  const n = m.itens.length;
  const linhasTodas = [...m.itens, m.total];
  const medidas = (SC: number) => {
    const SL = Math.max(MIN.texto + 12, SC * 0.4);
    const maxNum = Math.max(...linhasTodas.map((l) => largura(l.valor, SC)));
    const wOp = largura(m.operador, SC);
    const maxRot = Math.max(0, ...linhasTodas.map((l) => (l.rotulo ? largura(l.rotulo, SL) : 0)));
    const total = (maxRot ? maxRot + SC * 0.34 : 0) + wOp + SC * 0.2 + maxNum;
    return { SL, maxNum, wOp, maxRot, total };
  };
  const alturaPorSC = n + (n - 1) * 0.2 + 0.28 + 0.26 + 1 + 0.16;
  const SC = Math.max(MIN.conta, Math.min(210, (R.h - 16) / alturaPorSC, (R.w * 0.9 * 100) / medidas(100).total));
  const { SL, maxNum, wOp, maxRot } = medidas(SC);
  const larguraTotal = (maxRot ? maxRot + SC * 0.34 : 0) + wOp + SC * 0.2 + maxNum;
  const x0 = R.x + (R.w - larguraTotal) / 2;
  const xDir = x0 + larguraTotal;
  const xOp = xDir - maxNum - SC * 0.2 - wOp;
  const xRot = xOp - SC * 0.34;
  let y = R.y + (R.h - alturaPorSC * SC) / 2 + SC;
  const rotuloEm = (p: PecaEscrita, l: { rotulo?: string }, i: number, em: number) => {
    if (!l.rotulo) return;
    pecas.push(escrita(`rot-${i}`, l.rotulo, xRot, p.y - SC / 2 + SL / 2, SL, em, { alinhar: "dir", cor: cor.amarelo }));
  };
  m.itens.forEach((it, i) => {
    const herdado = it.em === undefined;
    const p = escrita(`item-${i}`, it.valor, xDir, y, SC, it.em ?? m.de + 0.1 + i * 0.12, { alinhar: "dir", herda: herdado ? it.valor : undefined, chave: it.valor });
    pecas.push(p);
    rotuloEm(p, it, i, herdado ? m.de + 0.35 + i * 0.3 : (it.em as number) + 0.1);
    if (i === n - 1) pecas.push(escrita("operador", m.operador, xOp, y, SC, m.operadorEm, { dur: 0.22 }));
    if (i < n - 1) y += SC * 1.2;
  });
  const yTraco = y + SC * 0.28;
  pecas.push({
    tipo: "traco",
    id: "traco",
    d: [sublinhadoDeGiz(xOp - SC * 0.12, xDir + SC * 0.1, yTraco, 3)],
    largura: Math.max(8, SC * 0.06),
    cor: cor.giz,
    em: m.tracoEm,
    dur: 0.3,
    esboco: true,
  });
  const yT = yTraco + SC * 0.26 + SC;
  const wT = largura(m.total.valor, SC);
  pecas.push(escrita("espera", "?", xDir - wT / 2 - largura("?", SC * 0.9) / 2, yT, SC * 0.9, m.total.em, { esboco: true, some: m.total.em }));
  const tot = escrita("total", m.total.valor, xDir, yT, SC, m.total.em, { alinhar: "dir", cor: cor.amarelo, chave: m.total.valor });
  pecas.push(tot);
  rotuloEm(tot, m.total, n, fimDe(tot) + 0.02);
  pecas.push(circuloEm("circulo", tot, fimDe(tot) + 0.02));
  sons.push({ em: fimDe(tot), arquivo: "sfx/giz-4.wav", volume: 0.38 });
  return { pecas, sons, marcos: [m.operadorEm + 0.3, m.tracoEm + 0.35, fimDe(tot) + 0.6] };
};

const paginaResultado = (m: Resultado, layout: Layout, C: Regiao | null, R: Regiao, palavras: Plano["palavras"], chavesAnteriores: Set<string>) => {
  const pecas: Peca[] = [];
  const sons: Som[] = [];
  const ws = m.conta.split(/\s+/).filter(Boolean);
  const tempos = temposDoTexto(m.conta, palavras, m.contaEm - 0.3, m.ate, m.contaEm);
  const amarelas = indicesDoDestaque(ws, m.destaque);
  let Rv = R;
  if (C && layout !== "alto") {
    // a conta vai para o lado da janela (em até duas linhas); o resultado ocupa a lousa embaixo
    const temRotulo = !!m.rotulo;
    let linhas = [ws];
    let tamanhos = [caber(m.conta, C.w, 170, 60)];
    if (tamanhos[0] < 110 && ws.length > 1) {
      linhas = [ws.slice(0, 1), ws.slice(1)];
      tamanhos = [caber(ws[0], C.w, 190, 60), caber(ws.slice(1).join(" "), C.w, 140, 60)];
    }
    // pergunta longa: quebra em até quatro linhas e diminui até caber ao lado da janela
    const alturaLivre = C.h - (temRotulo ? 74 : 0);
    const altura0 = tamanhos.reduce((a, t, i) => a + t + (i ? t * 0.42 : 0), 0);
    if (linhas.some((l, i) => largura(l.join(" "), tamanhos[i]) > C.w + 1) || altura0 > alturaLivre) {
      const aj = ajustarTexto(m.conta, { largura: C.w, altura: alturaLivre, maximo: 140, minimo: 50, linhas: 4 });
      linhas = aj.linhas;
      tamanhos = aj.linhas.map(() => aj.tamanho);
    }
    const altura = (temRotulo ? 74 : 0) + tamanhos.reduce((a, t, i) => a + t + (i ? t * 0.42 : 0), 0);
    let y = C.y + Math.max(0, (C.h - altura) / 2);
    if (temRotulo) {
      pecas.push(rotulo("rotulo", m.rotulo as string, C.x, y + MIN.rotulo, m.de + 0.12));
      y += 74;
    }
    let indice = 0;
    linhas.forEach((l, i) => {
      y += tamanhos[i] + (i ? tamanhos[i] * 0.42 : 0);
      pecas.push(...palavrasEmLinha("conta", l, tempos, C.x, y, tamanhos[i], "esq", amarelas, indice));
      indice += l.length;
    });
  } else {
    // tudo embaixo: a conta numa linha e o resultado maior
    if (m.rotulo) pecas.push(rotulo("rotulo", m.rotulo, R.x + R.w / 2, R.y + MIN.rotulo, m.de + 0.12, "centro"));
    const topo = m.rotulo ? 66 : 0;
    const tc = caber(m.conta, R.w * 0.9, 120, 60);
    if (largura(m.conta, tc) <= R.w * 0.9 + 1) {
      const yc = R.y + topo + tc + 10;
      pecas.push(...palavrasEmLinha("conta", ws, tempos, R.x + R.w / 2, yc, tc, "centro", amarelas));
      Rv = { x: R.x, y: yc + tc * 0.3, w: R.w, h: R.y + R.h - (yc + tc * 0.3) };
    } else {
      // pergunta longa: em até duas linhas
      const aj = ajustarTexto(m.conta, { largura: R.w * 0.9, altura: R.h * 0.42, maximo: 110, minimo: 50, linhas: 2 });
      let y = R.y + topo + 10;
      let indice = 0;
      aj.linhas.forEach((l, i) => {
        y += aj.tamanho + (i ? aj.tamanho * ENTRELINHA : 0);
        pecas.push(...palavrasEmLinha("conta", l, tempos, R.x + R.w / 2, y, aj.tamanho, "centro", amarelas, indice));
        indice += l.length;
      });
      Rv = { x: R.x, y: y + aj.tamanho * 0.3, w: R.w, h: R.y + R.h - (y + aj.tamanho * 0.3) };
    }
  }
  // "= valor", com sublinhado duplo e (opcional) moldura. Se o número do valor estava na página
  // anterior (o total da conta), ele desliza até aqui e só ganha o prefixo ("R$") quando é dito.
  const partes = m.valor.match(/^(\D*?)\s*([\d.,]+)$/);
  const prefixo = partes?.[1]?.trim() ?? "";
  const numero = partes ? partes[2] : m.valor;
  const herdado = chavesAnteriores.has(numero);
  const fatorPrefixo = 0.62;
  const larguraValor = (s: number) => (prefixo ? largura(prefixo, s * fatorPrefixo) + s * 0.18 : 0) + largura(numero, s);
  const medida = (s: number) => largura("=", s) + s * 0.36 + larguraValor(s);
  // a resposta pode ser uma palavra ("critério"): aí o mínimo é o da letra, não o da conta
  const SV = Math.max(temLetra(numero) ? 40 : MIN.conta, Math.min(layout === "alto" ? 200 : 280, (Rv.h - 30) / 1.75, (Rv.w * 0.92 * 100) / medida(100)));
  const wL = medida(SV);
  const xL = Rv.x + (Rv.w - wL) / 2;
  const yL = Rv.y + (Rv.h - SV * 1.6) / 2 + SV + SV * 0.1;
  const xV = xL + largura("=", SV) + SV * 0.36;
  const wV = larguraValor(SV);
  pecas.push(escrita("igual", "=", xL, yL, SV, m.valorEm - 0.08, { esboco: true, dur: 0.16 }));
  let xN = xV;
  let ultima: PecaEscrita;
  if (prefixo) {
    ultima = escrita("prefixo", prefixo, xV, yL, SV * fatorPrefixo, m.valorEm + 0.05, { cor: cor.amarelo });
    pecas.push(ultima);
    xN += largura(prefixo, SV * fatorPrefixo) + SV * 0.18;
  }
  if (!herdado) pecas.push(escrita("espera", "?", xV + wV / 2 - largura("?", SV * 0.9) / 2, yL, SV * 0.9, m.valorEm + 0.08, { esboco: true, some: m.valorEm + 0.08 }));
  const valor = escrita("valor", numero, xN, yL, SV, m.valorEm + (prefixo ? 0.3 : 0.08), {
    cor: cor.amarelo,
    chave: numero,
    herda: herdado ? numero : undefined,
    dur: Math.min(0.5, duracaoDaEscrita(montarLinha(numero, SV))),
  });
  pecas.push(valor);
  ultima = herdado && prefixo ? (pecas.find((q) => q.id === "prefixo") as PecaEscrita) : valor;
  const fimValor = fimDe(ultima);
  const inteiro: PecaEscrita = { ...valor, id: ultima.id, texto: m.valor, x: xV, em: ultima.em, dur: ultima.dur };
  pecas.push(...sublinhadoDuplo("duplo", inteiro, fimValor + 0.04, wV));
  sons.push({ em: fimValor + 0.04, arquivo: "sfx/resposta.wav", volume: 0.42 });
  const marcos = [m.contaEm + 0.6, fimValor + 0.5];
  if (m.molduraEm !== undefined) {
    const pad = SV * 0.3;
    pecas.push({
      tipo: "traco",
      id: "moldura",
      d: molduraDeGiz(xL - pad, yL - SV - pad, wL + 2 * pad, SV * 1.45 + 2 * pad, 8),
      depois: "duplo-2",
      largura: Math.max(7, SV * 0.04),
      cor: cor.giz,
      em: m.molduraEm,
      dur: 0.5,
    });
    marcos.push(m.molduraEm + 0.6);
  }
  return { pecas, sons, marcos };
};

// bloco de linhas emolduradas (regra/macete), centrado numa região
const blocoDeRegra = (
  linhas: LinhaDeRegra[],
  R0: Regiao,
  molduraEm: number | undefined,
  tamanhoMax: number,
  rotuloTexto?: string,
  // "topo": o bloco encosta em cima da região (e devolve a altura que usou); senão, fica centrado
  alinhamento: "centro" | "topo" = "centro",
) => {
  const pecas: Peca[] = [];
  const padV = 0.45;
  const padH = 0.62;
  const alturaRotulo = rotuloTexto ? 70 : 0;
  const R = { ...R0, y: R0.y + alturaRotulo, h: R0.h - alturaRotulo };
  const larguraLinha = R.w * 0.86 - 2 * padH * tamanhoMax * 0.5;
  // linha longa diminui o que precisar para caber (nunca vaza)
  let tamanhos = linhas.map((l, i) => Math.min(caber(l.texto, larguraLinha, i === 0 ? tamanhoMax : tamanhoMax * 0.82, 56), (larguraLinha * 100) / Math.max(1, largura(l.texto, 100))));
  const altura = () => tamanhos.reduce((a, t, i) => a + t + (i ? t * 0.4 : 0), 0) + 2 * padV * Math.max(...tamanhos);
  if (altura() > R.h) tamanhos = tamanhos.map((t) => t * (R.h / altura()));
  const maior = Math.max(...tamanhos);
  const topo = alinhamento === "topo" ? R.y : R.y + (R.h - altura()) / 2;
  if (rotuloTexto) pecas.push(rotulo("regra-rotulo", rotuloTexto, R0.x + R0.w / 2, topo - alturaRotulo + MIN.rotulo, (linhas[0]?.em ?? 0) - 0.1, "centro"));
  let y = topo + padV * maior;
  const larguras = linhas.map((l, i) => largura(l.texto, tamanhos[i]));
  linhas.forEach((l, i) => {
    y += tamanhos[i] + (i ? tamanhos[i] * 0.4 : 0);
    pecas.push(...linhaCorrida(`regra-${i}`, l.texto, R.x + R.w / 2, y, tamanhos[i], "centro", l.em, l.destaque));
  });
  if (molduraEm !== undefined) {
    const w = Math.max(...larguras) + 2 * padH * Math.max(maior, 90);
    pecas.push({
      tipo: "traco",
      id: "moldura",
      d: molduraDeGiz(R.x + (R.w - w) / 2, topo, w, altura(), 6),
      largura: Math.max(7, maior * 0.05),
      cor: cor.giz,
      em: molduraEm,
      dur: 0.45,
    });
  }
  return { pecas, altura: altura() + alturaRotulo };
};

const paginaRegra = (m: Regra, C: Regiao | null, R: Regiao) => {
  const pecas: Peca[] = [...cabecalho(m, C, m.de)];
  const bloco = blocoDeRegra(m.linhas, R, m.molduraEm, 170);
  pecas.push(...bloco.pecas);
  const sons: Som[] = m.molduraEm !== undefined ? [{ em: m.molduraEm + 0.3, arquivo: "sfx/giz-2.wav", volume: 0.3 }] : [];
  return { pecas, sons, marcos: [...m.linhas.map((l) => l.em + 0.8), ...(m.molduraEm !== undefined ? [m.molduraEm + 0.6] : [])] };
};

// Ícones a giz (caixa 100 × 100): contorno + o "acontecer" (marcador enche, balão ganha linhas…)
// elo de corrente (pílula) de (x1,y1) a (x2,y2), raio r: para o ícone de link
const pilula = (x1: number, y1: number, x2: number, y2: number, r: number) => {
  const c = Math.hypot(x2 - x1, y2 - y1);
  const [ux, uy] = [(x2 - x1) / c, (y2 - y1) / c];
  const [nx, ny] = [-uy, ux];
  const k = 0.5523 * r;
  const f = (v: number) => v.toFixed(1);
  const p = (x: number, y: number) => `${f(x)} ${f(y)}`;
  return [
    `M ${p(x1 + nx * r, y1 + ny * r)} L ${p(x2 + nx * r, y2 + ny * r)}`,
    `C ${p(x2 + nx * r + ux * k, y2 + ny * r + uy * k)}, ${p(x2 + ux * r + nx * k, y2 + uy * r + ny * k)}, ${p(x2 + ux * r, y2 + uy * r)}`,
    `C ${p(x2 + ux * r - nx * k, y2 + uy * r - ny * k)}, ${p(x2 - nx * r + ux * k, y2 - ny * r + uy * k)}, ${p(x2 - nx * r, y2 - ny * r)}`,
    `L ${p(x1 - nx * r, y1 - ny * r)}`,
    `C ${p(x1 - nx * r - ux * k, y1 - ny * r - uy * k)}, ${p(x1 - ux * r - nx * k, y1 - uy * r - ny * k)}, ${p(x1 - ux * r, y1 - uy * r)}`,
    `C ${p(x1 - ux * r + nx * k, y1 - uy * r + ny * k)}, ${p(x1 + nx * r - ux * k, y1 + ny * r - uy * k)}, ${p(x1 + nx * r, y1 + ny * r)}`,
  ].join(" ");
};

const ICONES: Record<NonNullable<Cta["icone"]>, { contorno: string[]; acontece: string[] }> = {
  // dois elos de corrente; o traço amarelo que os liga "acontece"
  link: {
    contorno: [pilula(16, 84, 40, 60, 15), pilula(60, 40, 84, 16, 15)],
    acontece: ["M 34 66 L 66 34", "M 88 58 L 99 62", "M 58 88 L 62 99"],
  },
  salvar: {
    contorno: ["M 24 6 L 76 6 L 76 94 L 50 72 L 24 94 L 24 6"],
    acontece: ["M 32 20 L 46 12", "M 32 36 L 68 14", "M 32 52 L 68 30", "M 32 68 L 68 46", "M 34 80 L 68 62", "M 52 72 L 68 78"],
  },
  seguir: {
    contorno: ["M 40 8 C 26 8, 22 20, 22 28 C 22 40, 30 48, 40 48 C 50 48, 58 40, 58 28 C 58 20, 54 8, 40 8", "M 8 92 C 10 70, 22 58, 40 58 C 58 58, 70 70, 72 92 L 8 92"],
    acontece: ["M 86 30 L 86 62", "M 70 46 L 100 46"],
  },
  comentar: {
    contorno: ["M 14 10 L 86 10 C 92 10, 94 14, 94 20 L 94 62 C 94 68, 92 72, 86 72 L 40 72 L 20 92 L 24 72 L 14 72 C 8 72, 6 68, 6 62 L 6 20 C 6 14, 8 10, 14 10"],
    acontece: ["M 22 30 L 78 30", "M 22 46 L 70 46", "M 22 60 L 56 60"],
  },
  compartilhar: {
    contorno: ["M 8 48 L 92 10 L 64 92 L 46 58 L 8 48", "M 46 58 L 92 10"],
    acontece: ["M 4 74 L 26 66", "M 12 92 L 34 80"],
  },
};

// Fechamento sem regra, com a pessoa no alto: o ícone a giz grande em cima, a chamada centrada
// embaixo (palavras na fala, o `destaque` amarelo e sublinhado) e a assinatura no pé.
const chamadaEmPe = (m: Cta, R: Regiao, ws: string[], tempos: number[], assinatura: string, pecas: Peca[]) => {
  const sons: Som[] = [];
  const hAssinatura = assinatura ? 84 : 0;
  const tamIcone = Math.min(150, R.h * 0.25);
  const gap = 40;
  const aj = ajustarTexto(m.texto, { largura: R.w * 0.92, altura: R.h - tamIcone - gap - hAssinatura - 30, maximo: 100, minimo: 52, linhas: 3, juntas: juntasDoDestaque(m.texto, m.destaque) });
  const bloco = tamIcone + gap + aj.altura;
  const topo = R.y + Math.max(0, (R.h - hAssinatura - bloco) / 2);
  const icone = ICONES[m.icone ?? "salvar"];
  const sI = tamIcone / 100;
  const xIcone = R.x + R.w / 2 - tamIcone / 2;
  const desloca = (d: string) => d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g, (_, a, b) => `${(Number(a) * sI + xIcone).toFixed(1)} ${(Number(b) * sI + topo).toFixed(1)}`);
  const emIcone = (tempos[0] ?? m.de + 0.2) - 0.05;
  const acontece = m.iconeEm ?? (tempos[tempos.length - 1] ?? m.de + 1) + 0.35;
  pecas.push({ tipo: "traco", id: "icone", d: icone.contorno.map(desloca), largura: Math.max(7, tamIcone * 0.055), cor: cor.giz, em: emIcone, dur: 0.42 });
  pecas.push({ tipo: "traco", id: "icone-acontece", d: icone.acontece.map(desloca), largura: Math.max(6, tamIcone * 0.05), cor: cor.amarelo, em: acontece, dur: 0.45 });
  sons.push({ em: acontece + 0.2, arquivo: "sfx/giz-1.wav", volume: 0.3 });
  const marcadas = m.destaque ? indicesDoDestaque(ws, m.destaque) : new Set<number>();
  const destaque = marcadas.size ? marcadas : new Set<number>([0]);
  const { pecas: ps } = textoEmLinhas("chamada", aj, tempos, R.x + R.w / 2, topo + tamIcone + gap - aj.tamanho * 0.1, "centro", destaque);
  pecas.push(...ps);
  // o destaque ganha um sublinhado amarelo (na última linha dele)
  const alvo = ps.filter((_, i) => destaque.has(i));
  if (m.destaque && alvo.length) {
    const base = Math.max(...alvo.map((p) => p.y));
    const naLinha = alvo.filter((p) => p.y === base);
    const u = naLinha[naLinha.length - 1];
    pecas.push({
      tipo: "traco",
      id: "sub-destaque",
      d: [sublinhadoDeGiz(naLinha[0].x - 6, u.x + largura(u.texto, u.tamanho) + 6, base + aj.tamanho * 0.3, 8)],
      largura: Math.max(7, aj.tamanho * 0.07),
      cor: cor.amarelo,
      em: u.em + u.dur + 0.05,
      dur: 0.28,
      depois: u.id,
    });
  }
  const marcos = [...tempos.filter((_, i) => i % 3 === 2), acontece + 0.5];
  if (assinatura)
    pecas.push({ tipo: "rotulo", id: "assinatura", texto: assinatura, x: R.x + R.w / 2, y: R.y + R.h - 14, tamanho: 38, alinhar: "centro", cor: "rgba(238,237,230,0.82)", peso: 500, em: acontece + 0.15, natural: true });
  return { pecas, sons, marcos };
};

const paginaCta = (m: Cta, layout: Layout, C: Regiao | null, R: Regiao, palavras: Plano["palavras"], marca: Plano["marca"]) => {
  const pecas: Peca[] = [...cabecalho(m, C, m.de)];
  const sons: Som[] = [];
  const marcos: number[] = [];
  const assinatura = [marca.nome, marca.area].filter(Boolean).join(" · ");
  const hAssinatura = assinatura ? 96 : 0;
  // a chamada: ícone a giz + texto em até duas linhas, palavras no ritmo da fala
  const ws = m.texto.split(/\s+/).filter(Boolean);
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, inicio, m.ate, inicio);
  const ladoAlto = layout === "alto";
  // sem a regra: a chamada ocupa a lousa em pé (ícone grande em cima, a chamada embaixo);
  // no canto, o título fica ao lado da janela
  if (!m.regra) return chamadaEmPe(m, R, ws, tempos, assinatura, pecas);
  // sem a regra, a chamada é o assunto da página e cresce
  const escala = m.regra ? 1 : ladoAlto ? 1.2 : 1.35;
  const tamIcone = (ladoAlto ? 118 : 150) * escala;
  const larguraTexto = R.w * 0.92 - tamIcone - 40;
  const tamMax = (ladoAlto ? 64 : 84) * escala;
  let linhas = [ws];
  let tam = caber(m.texto, larguraTexto, tamMax, 40);
  if (tam < tamMax * 0.85 && ws.length > 2) {
    let melhor = 1;
    let menorDif = Infinity;
    for (let k = 1; k < ws.length; k++) {
      const dif = Math.abs(largura(ws.slice(0, k).join(" "), 100) - largura(ws.slice(k).join(" "), 100));
      if (dif < menorDif) [menorDif, melhor] = [dif, k];
    }
    linhas = [ws.slice(0, melhor), ws.slice(melhor)];
    tam = Math.min(...linhas.map((l) => caber(l.join(" "), larguraTexto, tamMax, 40)));
  }
  // chamada longa: quebra em até três linhas e diminui até caber (nunca vaza)
  if (linhas.some((l) => largura(l.join(" "), tam) > larguraTexto + 1)) {
    const aj = ajustarTexto(m.texto, { largura: larguraTexto, altura: tamIcone * 1.9, maximo: tamMax, minimo: 40, linhas: 3, juntas: juntasDoDestaque(m.texto, m.destaque) });
    linhas = aj.linhas;
    tam = aj.tamanho;
  }
  const alturaChamada = Math.max(tamIcone, linhas.length * tam + (linhas.length - 1) * tam * 0.5);
  // de cima para baixo: a regra (opcional), a chamada no meio do espaço que sobra, a assinatura embaixo
  let topoLivre = R.y;
  if (m.regra) {
    const bloco = blocoDeRegra(m.regra.linhas, { ...R, h: R.h - alturaChamada - hAssinatura - 60 }, m.regra.molduraEm, ladoAlto ? 110 : 150, m.regra.rotulo, "topo");
    pecas.push(...bloco.pecas);
    topoLivre = R.y + bloco.altura + 20;
    marcos.push(...m.regra.linhas.map((l) => l.em + 0.8));
  }
  const topoChamada = topoLivre + (R.y + R.h - hAssinatura - topoLivre - alturaChamada) / 2;
  const larguraLinhas = Math.max(...linhas.map((l) => largura(l.join(" "), tam)));
  const larguraChamada = tamIcone + 40 + larguraLinhas;
  const xIcone = R.x + (R.w - larguraChamada) / 2;
  const xTexto = xIcone + tamIcone + 40;
  const icone = ICONES[m.icone ?? "salvar"];
  const s = tamIcone / 100;
  const yIcone = topoChamada + (alturaChamada - tamIcone) / 2;
  const desloca = (d: string) => d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g, (_, a, b) => `${(Number(a) * s + xIcone).toFixed(1)} ${(Number(b) * s + yIcone).toFixed(1)}`);
  const emIcone = (tempos[0] ?? m.de + 0.2) - 0.05;
  const acontece = m.iconeEm ?? (tempos[tempos.length - 1] ?? m.de + 1) + 0.35;
  pecas.push({ tipo: "traco", id: "icone", d: icone.contorno.map(desloca), largura: Math.max(7, tamIcone * 0.06), cor: cor.giz, em: emIcone, dur: 0.42 });
  pecas.push({ tipo: "traco", id: "icone-acontece", d: icone.acontece.map(desloca), largura: Math.max(6, tamIcone * 0.05), cor: cor.amarelo, em: acontece, dur: 0.45 });
  sons.push({ em: acontece + 0.2, arquivo: "sfx/giz-1.wav", volume: 0.3 });
  let y = topoChamada + (alturaChamada - (linhas.length * tam + (linhas.length - 1) * tam * 0.5)) / 2;
  let indice = 0;
  // em amarelo: o `destaque` (ou a primeira palavra)
  const marcadas = m.destaque ? indicesDoDestaque(ws, m.destaque) : new Set<number>();
  const destaque = marcadas.size ? marcadas : new Set<number>([0]);
  linhas.forEach((l, i) => {
    y += tam + (i ? tam * 0.5 : 0);
    pecas.push(...palavrasEmLinha("chamada", l, tempos, xTexto, y, tam, "esq", destaque, indice));
    indice += l.length;
  });
  marcos.push(...tempos.filter((_, i) => i % 3 === 2), acontece + 0.5);
  if (assinatura) {
    const nome = marca.nome;
    pecas.push({
      tipo: "rotulo",
      id: "assinatura",
      texto: assinatura,
      x: R.x + R.w / 2,
      y: R.y + R.h - 14,
      tamanho: 38,
      alinhar: "centro",
      cor: "rgba(238,237,230,0.82)",
      peso: 500,
      em: acontece + 0.15,
      natural: true,
    });
    if (!nome) marcos.push(acontece + 0.4);
  }
  return { pecas, sons, marcos };
};

// ---------- apagador: por onde ele passa e quando cada lugar fica limpo ----------

export const DUR_APAGAR = 0.42;
// quanto tempo o texto de um bloco universal fica inteiro antes do apagador chegar nele
export const LEITURA = 0.45;
// quanto o apagador pode começar antes da página nova (bloco universal, página anterior já completa)
const ADIANTA = 0.3;
const UNIVERSAIS = new Set<string>(["abertura", "topicos", "passos", "numero", "comparacao", "grafico", "destaque", "definicao", "frase", "pergunta", "cta"]);
// páginas com a troca "de bloco": os universais e a conta de palavras (a conta de números, a do
// demo, mantém a troca original, com os números passando de uma página para a outra)
const trocaDeBloco = (m: Momento) =>
  UNIVERSAIS.has(m.tipo) ||
  (m.tipo === "coluna" && [...m.itens, m.total].some((l) => temLetra(l.valor))) ||
  (m.tipo === "resultado" && temLetra(m.valor.replace(/^\D*?\s*(?=[\d.,]+$)/, "")));
// quanto tempo um resultado circulado (ou sublinhado) fica inteiro antes do apagador chegar nele
export const RESPIRO = 0.85;
// quanto tempo o número herdado leva para deslizar até o lugar novo (depois que a lousa está limpa)
export const DUR_HERANCA = 0.38;

const area = (r: Regiao) => ({
  x: Math.max(30, r.x - 16),
  y: Math.max(60, r.y - 16),
  w: Math.min(W - 60, r.w + 32),
  h: Math.min(H - 120, r.h + 32),
});

// Passadas verticais, da esquerda para a direita, com o feltro deitado. Cada passada só cobre a
// altura em que há giz da página naquela coluna (o apagador não passa por cima do que é novo).
export const caminhoDoApagador = (r: Regiao, caixas: Regiao[] = []) => {
  const a = area(r);
  const faixa = 236;
  const n = Math.max(1, Math.ceil(a.w / (faixa * 0.8)));
  const passo = a.w / n;
  const pontos: [number, number][] = [];
  let ultimoY = a.y + a.h / 2;
  for (let i = 0; i < n; i++) {
    const x = a.x + passo * (i + 0.5);
    const daColuna = caixas.filter((c) => c.x < a.x + passo * (i + 1) && c.x + c.w > a.x + passo * i);
    let topo = daColuna.length ? Math.min(...daColuna.map((c) => c.y)) + 30 : caixas.length ? ultimoY : a.y + Math.min(60, a.h / 2);
    let base = daColuna.length ? Math.max(...daColuna.map((c) => c.y + c.h)) - 30 : caixas.length ? ultimoY : a.y + a.h - Math.min(60, a.h / 2);
    if (base < topo) [topo, base] = [(topo + base) / 2, (topo + base) / 2];
    if (i % 2 === 0) pontos.push([x - 12, topo], [x + 12, base]);
    else pontos.push([x + 12, base], [x - 12, topo]);
    ultimoY = i % 2 === 0 ? base : topo;
  }
  const d = pontos.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return { d, faixa: Math.max(faixa + 40, passo + 70), n, passo, x0: a.x };
};

const cruza = (a: Regiao, b: Regiao, folga = 0) =>
  a.x < b.x + b.w + folga && b.x < a.x + a.w + folga && a.y < b.y + b.h + folga && b.y < a.y + a.h + folga;

const inversoVaiVem = (f: number) => {
  for (let k = 0; k <= 60; k++) if (vaiVem(k / 60) >= f) return k / 60;
  return 1;
};

// quanto tempo depois de começar o apagador encosta numa caixa
const toqueDoApagador = (c: Regiao, pg: Pagina) => {
  const { d, faixa } = caminhoDoApagador(pg.area, pg.caixas);
  const meio = faixa / 2;
  for (let k = 0; k <= 80; k++) {
    const [x, y] = pontoNoCaminho(d, k / 80);
    if (cruza(c, { x: x - meio, y: y - meio, w: faixa, h: faixa })) return DUR_APAGAR * inversoVaiVem(k / 80);
  }
  return DUR_APAGAR;
};

// quanto tempo depois de começar o apagador já passou inteiro por uma caixa (ele anda da esquerda
// para a direita, em passadas verticais: o que fica à esquerda dele já está limpo)
const passouDoApagador = (c: Regiao, pg: Pagina) => {
  const { d, faixa } = caminhoDoApagador(pg.area, pg.caixas);
  for (let k = 0; k <= 80; k++) {
    const [x] = pontoNoCaminho(d, k / 80);
    if (x - faixa / 2 > c.x + c.w) return DUR_APAGAR * inversoVaiVem(k / 80);
  }
  return DUR_APAGAR;
};

const janelaLivreEm = (c: Regiao, de: number, estados: EstadoDaCaixa[]) => {
  let livre = de;
  for (let s = 0; s <= 24; s++) {
    const t = de - 0.1 + s * 0.05;
    const j = caixaNoTempo(t, estados);
    if (cruza(c, { x: j.x - 22, y: j.y - 22, w: j.w + 44, h: j.h + 44 })) livre = t + 0.05;
  }
  return livre;
};

// ---------- todas as páginas ----------

export const montarPaginas = (plano: Plano, estados: EstadoDaCaixa[]): Pagina[] => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  const paginas: Pagina[] = [];
  ordenados.forEach((m, i) => {
    const layout = layoutDe(m);
    const { cabecalho: C, principal: R } = regioesDoLayout(layout, !!m.legenda);
    const prox = ordenados[i + 1];
    const anterior = paginas[i - 1];
    const chavesAnteriores = new Set(
      (anterior?.pecas ?? []).flatMap((p) => (p.tipo === "escrita" && p.chave ? [p.chave] : [])),
    );
    const montado = (() => {
      switch (m.tipo) {
        case "titulo":
          return paginaTitulo(m, R, plano.palavras);
        case "virgula":
          return paginaVirgula(m, C, R);
        case "fracao":
          return paginaFracao(m, C, R);
        case "coluna":
          return paginaColuna(m, C, R);
        case "resultado":
          return paginaResultado(m, layout, C, R, plano.palavras, chavesAnteriores);
        case "regra":
          return paginaRegra(m, C, R);
        case "cta":
          return paginaCta(m, layout, C, R, plano.palavras, plano.marca);
        default:
          // os blocos universais (blocos.ts)
          return montarBloco(m, { layout, C, R, palavras: plano.palavras }) ?? { pecas: [], sons: [], marcos: [] };
      }
    })();
    const pecas = montado.pecas;
    const sons = [...montado.sons];

    // Apagador: começa quando a página nova começa, mas nunca antes de os resultados circulados
    // da página anterior ficarem inteiros por RESPIRO segundos (e nunca tarde demais para a página nova)
    let limpaEm = m.de;
    // giz da página anterior que a janela vai cobrir neste lugar novo: some enquanto a janela chega
    const trecho = trechosDaJanela(plano).find((tr) => tr.momento === i);
    if (anterior && trecho && trecho.layout !== "cheio" && anterior.layout !== trecho.layout) {
      const j = caixaDoLayout(trecho.layout, plano);
      const cobre = { x: j.x - 30, y: j.y - 30, w: j.w + 60, h: j.h + 60 };
      for (const q of anterior.pecas) if (cruza(caixaDaPeca(q), cobre)) q.cobertaEm = trecho.de;
    }
    // página nova de bloco universal: se a anterior já terminou, o apagador pode começar um pouco
    // antes do `de` (a página nova fica pronta para ser escrita na palavra dela)
    const novaUniversal = trocaDeBloco(m);
    if (anterior) {
      // o apagador termina quando o primeiro giz da página nova chega (nem antes, deixando a lousa
      // vazia, nem muito depois): entre ADIANTA antes e 0,8 s depois do `de`
      let piso = m.de;
      if (novaUniversal) {
        // só conta o que fica embaixo (o cabeçalho ao lado da janela não depende do apagador)
        const embaixo = pecas.filter((p) => {
          if (p.tipo === "rotulo") return false;
          const c = caixaDaPeca(p);
          return !(C && cruza(c, C) && !cruza(c, R));
        });
        const forma = embaixo.some((p) => p.tipo !== "rotulo" && p.esboco);
        const primeiro = forma ? m.de : Math.min(...embaixo.map((p) => p.em), m.de + 2);
        piso = Math.min(Math.max(primeiro - DUR_APAGAR * 0.8, m.de - ADIANTA, anterior.de + 1.0), m.de + 0.8);
      }
      let apaga = piso;
      for (const p of anterior.pecas) {
        if (p.tipo !== "traco" || !p.respira) continue;
        apaga = Math.max(apaga, p.em + p.dur + RESPIRO - toqueDoApagador(caixaDaPeca(p), anterior));
      }
      // blocos de texto (os universais): o que foi escrito por último fica inteiro um instante antes
      // de o apagador chegar nele (a fala costuma emendar na página seguinte)
      if (trocaDeBloco(anterior.m) || novaUniversal)
        for (const p of anterior.pecas) {
          if (p.tipo === "rotulo") continue;
          apaga = Math.max(apaga, p.em + p.dur + LEITURA - toqueDoApagador(caixaDaPeca(p), anterior));
        }
      apaga = Math.max(Math.min(piso, m.de), Math.min(apaga, m.de + 1.4, m.ate - DUR_APAGAR - 0.6));
      anterior.apagaEm = apaga;
      limpaEm = apaga + DUR_APAGAR;
      sons.push({ em: apaga + 0.02, arquivo: "sfx/apagador.wav", volume: 0.24 });
    }

    // Nada é escrito onde a página anterior estava antes de ela estar TODA apagada.
    // Atrás da janela que está saindo, sim: o que já foi dito aparece escrito à medida que a janela
    // libera o lugar (a página nova entra junto com a pessoa mudando de tamanho, nunca um quadro vazio).
    const atrasadas = new Set<string>();
    // caminho de cada número herdado (de onde estava até onde vai): nada novo é escrito ali antes de ele chegar
    const corredores: Regiao[] = [];
    if (anterior)
      for (const p of pecas) {
        if (p.tipo !== "escrita" || !p.herda || !chavesAnteriores.has(p.herda)) continue;
        const o = anterior.pecas.find((q) => q.tipo === "escrita" && q.chave === p.herda);
        if (o) corredores.push(uniao([caixaDaPeca(o), caixaDaPeca(p)]));
      }
    // Blocos universais: fora do cabeçalho (ao lado da janela), nada da página nova aparece antes de
    // a anterior estar toda apagada (nem esboço): a lousa nunca mostra duas páginas misturadas.
    const universal = trocaDeBloco(m);
    for (const p of pecas) {
      if (p.tipo === "escrita" && p.herda && chavesAnteriores.has(p.herda)) continue;
      const c = caixaDaPeca(p);
      const noCabecalho = !!C && cruza(c, C) && !cruza(c, R);
      const sobreAnterior = !!anterior && (anterior.caixas.some((q) => cruza(c, q, 6)) || (universal && !noCabecalho));
      const noCaminho = corredores.some((q) => cruza(c, q, 4));
      // bloco universal: o apagador é a cortina; o que fica atrás dele (já limpo) pode ser escrito
      const atrasDoApagador = universal && anterior && anterior.apagaEm !== undefined ? anterior.apagaEm + passouDoApagador(c, anterior) + 0.03 : limpaEm + 0.03;
      const livre = Math.max(
        noCaminho ? limpaEm + DUR_HERANCA + 0.02 : sobreAnterior ? Math.min(limpaEm + 0.03, atrasDoApagador) : m.de,
        // a conta da Lousa (demo aprovado) espera a janela sair; os blocos universais não
        universal ? m.de : janelaLivreEm(c, m.de, estados),
      );
      if (livre <= m.de + 0.01) continue;
      if (p.tipo === "rotulo") p.em = Math.max(p.em, livre);
      else {
        if (p.esboco || (p.tipo === "escrita" && p.some !== undefined)) p.aparece = Math.max(p.aparece ?? 0, livre);
        if (!(p.tipo === "escrita" && p.some !== undefined) && p.em < livre + 0.02) {
          p.em = livre + 0.02;
          atrasadas.add(p.id);
        }
      }
    }
    // a ordem da escrita continua a mesma: palavras da mesma linha em sequência e traços depois do que contornam
    const porId = new Map(pecas.map((p) => [p.id, p]));
    pecas.forEach((p, k) => {
      const ant = pecas[k - 1];
      const grupo = (q: Peca) => q.id.replace(/-\d+$/, "");
      if (ant && atrasadas.has(ant.id) && ant.tipo === "escrita" && p.tipo === "escrita" && grupo(ant) === grupo(p) && p.em < ant.em + 0.05) {
        p.em = ant.em + 0.05;
        atrasadas.add(p.id);
      }
      if (p.tipo === "traco" && p.depois) {
        const alvo = porId.get(p.depois);
        if (alvo && alvo.tipo !== "rotulo") p.em = Math.max(p.em, alvo.em + alvo.dur + 0.02);
      }
    });
    paginas.push({
      indice: i,
      m,
      layout,
      de: m.de,
      ate: prox ? Math.min(m.ate, prox.de) : plano.duracao + 1,
      pecas,
      area: uniao(pecas.map(caixaDaPeca)),
      caixas: pecas.map(caixaDaPeca),
      limpaEm,
      sons,
      marcos: montado.marcos,
    });
  });
  return paginas;
};
