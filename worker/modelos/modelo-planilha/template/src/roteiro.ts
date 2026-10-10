// A direção da planilha: onde está a célula da pessoa em cada instante, para onde o cursor de
// célula pula, o que a barra de fórmula mostra, como a tabela se arruma, quando cada célula sai
// e quando cada som toca. Tudo é calculado a partir do plano — o aluno não escreve posições.
import { fimDaDigitacao, formatar, limitar, mistura, prog, quandoDito, temposDoTexto, troca } from "./anim";
import { type GeoTabela, geoDados, geoTabela, linhasNorm, MAX_ITENS, formatoDoGrafico } from "./blocos";
import {
  type CaixaPessoa,
  caixaDoLugar,
  endereco,
  enderecoDoRet,
  linhasDaTabela,
  alturaDaLinha,
  lugaresDosMomentos,
  RET_TITULO,
  type Ret,
  type Regioes,
  regioesDoMomento,
  retCelulaLarga,
} from "./grade";
import type { Frase } from "./motor/frases";
import { type Linha, type Lugar, type Momento, type Palavra, type Plano, textoDaAbertura } from "./plano";
import { COL, GRADE_Y, LINHA, TAB, TABELA_Y } from "./tema";

// ---------- momentos ----------

export const ordenar = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

// O último momento fica até o fim do vídeo quando é o fechamento ou termina colado no fim.
export const fimDoMomento = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

// os tipos que formam a tabela acumulada das `linha`
export const ehDaTabela = (m: Momento) => m.tipo === "linha" || m.tipo === "preencher";

// ---------- tempos que o plano deixou implícitos ----------

// Preenche os instantes opcionais (detalhe, marca, rótulo…) procurando as palavras na fala, para
// componentes, cursor, barra de fórmula e sons usarem exatamente os mesmos tempos.
export const completarTempos = (plano: Plano, palavras: Palavra[]): Plano => {
  const achar = (texto: string, de: number, ate: number, padrao: number) => temposDoTexto(texto, palavras, de, ate, padrao)[0] ?? padrao;
  const dentro = (v: number, m: Momento) => Math.max(m.de, Math.min(m.ate - 0.08, v));
  const momentos = plano.momentos.map((m): Momento => {
    switch (m.tipo) {
      case "topicos":
      case "passos": {
        const itens = (m.itens ?? []).slice(0, MAX_ITENS).map((it, i, lista) => {
          const limite = lista[i + 1]?.em ?? m.ate;
          const detalheEm = it.detalhe ? dentro(it.detalheEm ?? achar(it.detalhe, it.em + 0.1, limite, fimDaDigitacao(it.texto, [it.em]) + 0.35), m) : undefined;
          const marcaEm = it.marca ? dentro(it.marcaEm ?? (detalheEm ?? it.em) + 0.3, m) : undefined;
          return { ...it, detalheEm, marcaEm };
        });
        return { ...m, itens };
      }
      case "tabela": {
        const linhas = (m.linhas ?? []).slice(0, MAX_ITENS).map((l, i, lista) => {
          const limite = lista[i + 1]?.em ?? m.ate;
          const detalheEm = l.detalhe ? dentro(l.detalheEm ?? achar(l.detalhe, l.em + 0.1, limite, fimDaDigitacao(l.texto, [l.em]) + 0.35), m) : undefined;
          const marcaEm = l.marca !== undefined ? dentro(l.marcaEm ?? (detalheEm !== undefined ? Math.min(detalheEm + 0.35, limite - 0.1) : l.em + 0.4), m) : undefined;
          return { ...l, detalheEm, marcaEm };
        });
        return { ...m, linhas };
      }
      case "numero":
        return { ...m, rotuloEm: dentro(m.rotuloEm ?? Math.min(m.em - 0.3, achar(m.rotulo, m.de, m.em + 0.3, m.de)), m) };
      case "destaque":
        return m.detalhe ? { ...m, detalheEm: dentro(m.detalheEm ?? achar(m.detalhe, m.em + 0.1, m.ate, fimDaDigitacao(m.texto, [m.em]) + 0.4), m) } : m;
      case "frase":
        return m.risco ? { ...m, riscoEm: dentro(m.riscoEm ?? achar(m.risco, m.em ?? m.de, m.ate, (m.em ?? m.de) + 0.5) + 0.25, m) } : m;
      case "comparacao": {
        const vencedorEm = m.vencedor !== undefined ? dentro(m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, m) : undefined;
        return { ...m, vencedorEm };
      }
      case "grafico":
        return { ...m, tendenciaEm: m.tendencia ? dentro(m.tendenciaEm ?? m.de + 0.3, m) : m.tendenciaEm };
      default:
        return m;
    }
  });
  return { ...plano, momentos };
};

// ---------- a célula da pessoa ----------

type Segmento = { de: number; lugar: Lugar };

// Lugar da pessoa ao longo do vídeo: o de cada momento; "cheia" nos trechos sem momento.
export const segmentosDaPessoa = (plano: Plano): Segmento[] => {
  const ordem = ordenar(plano);
  const lugares = lugaresDosMomentos(plano);
  const segs: Segmento[] = [{ de: -10, lugar: "cheia" }];
  const por = (de: number, lugar: Lugar) => {
    const ultimo = segs[segs.length - 1];
    if (ultimo.lugar === lugar) return;
    if (de <= ultimo.de + 0.01) ultimo.lugar = lugar;
    else segs.push({ de, lugar });
  };
  ordem.forEach((m, i) => {
    por(m.de <= 0.1 ? -10 : m.de, lugares.get(m) ?? "cheia");
    const proximo = ordem[i + 1];
    const fimDoVideo = m.ate >= plano.duracao - 0.3;
    if (!fimDoVideo && (!proximo || proximo.de - m.ate > 0.15)) por(m.ate, "cheia");
  });
  return segs;
};

export const DURACAO_TROCA = 0.55;

const mixCaixa = (a: CaixaPessoa, b: CaixaPessoa, p: number): CaixaPessoa => ({
  x: mistura(a.x, b.x, p),
  y: mistura(a.y, b.y, p),
  w: mistura(a.w, b.w, p),
  h: mistura(a.h, b.h, p),
  raio: 0,
  zoom: mistura(a.zoom, b.zoom, p),
  ancoraY: mistura(a.ancoraY, b.ancoraY, p),
});

// Na abertura ("grande") a pessoa ganha um empurrão lento de 3% ao longo do trecho: o gancho não
// fica parado enquanto o título é digitado. O rosto continua no mesmo ponto (o zoom parte dele).
export const EMPURRAO = 0.03;
const caixaNoSegmento = (t: number, segs: Segmento[], i: number, plano: Plano): CaixaPessoa => {
  const c = caixaDoLugar(plano, segs[i].lugar);
  if (segs[i].lugar !== "grande") return c;
  const inicio = Math.max(0, segs[i].de);
  const fim = segs[i + 1]?.de ?? plano.duracao;
  const p = limitar((t - inicio) / Math.max(0.5, fim - inicio));
  const suave = p * p * (3 - 2 * p);
  return { ...c, zoom: c.zoom * (1 + EMPURRAO * suave) };
};

export const pessoaNoTempo = (t: number, segs: Segmento[], plano: Plano, todos: Segmento[] = segs): CaixaPessoa => {
  let i = 0;
  for (let k = 0; k < segs.length; k++) if (segs[k].de <= t) i = k;
  if (i === 0) return caixaNoSegmento(t, todos, 0, plano);
  const anterior = pessoaNoTempo(segs[i].de, segs.slice(0, i), plano, todos);
  const p = prog(t, segs[i].de, DURACAO_TROCA, troca);
  return mixCaixa(anterior, caixaNoSegmento(t, todos, i, plano), p);
};

// ---------- saída das células de cada momento ----------

// Cada célula de conteúdo sai de um de dois jeitos, para nunca haver quadro vazio nem duas páginas
// de texto uma sobre a outra:
// - coberta: o lugar dela fica embaixo da pessoa ou de uma célula nova (opaca) do momento seguinte;
//   ela fica até ser coberta e só então some;
// - apagada: nada a cobre; ela é apagada (como o Delete da planilha) logo antes do momento seguinte.
// `em`/`dur`: quando a célula some; `conteudoEm`: quando o texto dela é apagado. Coberta: a pessoa
// desliza por cima dela como uma cortina (o texto fica até ser coberto; nada fica vazio no caminho).
// Apagada: texto e célula somem juntos, antes de a página seguinte escrever qualquer coisa.
export type Saida = { em: number; dur: number; conteudoEm: number };
export type SaidasDoMomento = Partial<Record<keyof Regioes, Saida>>;

const TIPOS_DE_BAIXO_OPACO = ["topicos", "passos", "tabela", "grafico"];
const regioesOpacas = (plano: Plano, m: Momento, lugar: Lugar): Ret[] => {
  const r = regioesDoMomento(plano, m, lugar);
  const lista: Ret[] = [];
  if (r.topo) lista.push(r.topo);
  if (r.larga) lista.push(r.larga);
  if (r.lado) lista.push(r.lado);
  if (r.baixo && TIPOS_DE_BAIXO_OPACO.includes(m.tipo)) lista.push(r.baixo);
  return lista;
};

const coberto = (r: Ret, cobertura: Ret[]) => {
  let dentro = 0;
  let total = 0;
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      const x = r.x + 6 + ((r.w - 12) * (i + 0.5)) / 12;
      const y = r.y + 6 + ((r.h - 12) * (j + 0.5)) / 12;
      total++;
      if (cobertura.some((c) => x >= c.x - 1 && x <= c.x + c.w + 1 && y >= c.y - 1 && y <= c.y + c.h + 1)) dentro++;
    }
  }
  return dentro / total >= 0.97;
};

export const saidasDosMomentos = (plano: Plano): Map<Momento, SaidasDoMomento> => {
  const ordem = ordenar(plano);
  const lugares = lugaresDosMomentos(plano);
  const mapa = new Map<Momento, SaidasDoMomento>();
  ordem.forEach((m, i) => {
    const lugar = lugares.get(m) ?? "cheia";
    const regioes = regioesDoMomento(plano, m, lugar);
    const proximo = ordem[i + 1];
    const saidas: SaidasDoMomento = {};
    for (const chave of Object.keys(regioes) as (keyof Regioes)[]) {
      const r = regioes[chave];
      if (!r) continue;
      if (!proximo) {
        const fim = fimDoMomento(m, plano) + 1;
        saidas[chave] = { em: fim, dur: 0.01, conteudoEm: fim };
      } else if (proximo.de - m.ate > 0.15) {
        // a pessoa volta à célula cheia e cobre tudo
        saidas[chave] = { em: m.ate + DURACAO_TROCA + 0.02, dur: 0.01, conteudoEm: m.ate + DURACAO_TROCA + 0.02 };
      } else {
        const lugarProx = lugares.get(proximo) ?? "cheia";
        const cobertura = [caixaDoLugar(plano, lugarProx), ...regioesOpacas(plano, proximo, lugarProx)];
        saidas[chave] = coberto(r, cobertura)
          ? { em: proximo.de + DURACAO_TROCA + 0.02, dur: 0.01, conteudoEm: proximo.de + DURACAO_TROCA + 0.02 }
          : { em: proximo.de - 0.12, dur: 0.12, conteudoEm: proximo.de - 0.12 };
      }
    }
    mapa.set(m, saidas);
  });
  return mapa;
};

export const visivelAte = (s: SaidasDoMomento) => Math.max(...Object.values(s).map((v) => (v ? v.em + v.dur : -10)));
export const opacidadeDeSaida = (t: number, s?: Saida) => (s ? 1 - prog(t, s.em, s.dur) : 1);
export const opacidadeDoConteudo = (t: number, s?: Saida) => (s ? 1 - prog(t, s.conteudoEm, 0.1) : 1);

// ---------- a tabela das `linha` ----------

export type Arrumacao = {
  topo: number;
  cabecalho: Ret;
  linhas: { m: Linha; ret: Ret; sub: Ret; numero: number; numeroSub: number }[];
  total: Ret | null;
  fundo: number;
};

// Sub-linha dos exemplos: abre no começo da linha e fecha no fim dela.
export const aberturaDaSub = (m: Linha, t: number) => {
  if (!m.exemplos?.length) return 0;
  const abre = prog(t, m.de + 0.1, 0.4, troca);
  const fecha = prog(t, m.ate - 0.15, 0.4, troca);
  return limitar(abre - fecha);
};

export const arrumarTabela = (plano: Plano, t: number): Arrumacao => {
  const linhas = linhasDaTabela(plano);
  const h = alturaDaLinha(linhas.length);
  const x = COL[0];
  const w = COL[3] - COL[0];
  let y = TABELA_Y;
  // linha 6 da planilha = cabeçalho da tabela (a faixa de cima ocupa 1–5)
  let numero = Math.round((TABELA_Y - GRADE_Y) / LINHA) + 1;
  const cabecalho = { x, y, w, h: TAB.cabecalho };
  y += TAB.cabecalho;
  numero++;
  const saida: Arrumacao["linhas"] = [];
  for (const m of linhas) {
    const ret = { x, y, w, h };
    const numeroDaLinha = numero++;
    y += h;
    const a = aberturaDaSub(m, t);
    const sub = { x, y, w, h: TAB.sub * a };
    const numeroSub = a > 0.5 ? numero++ : -1;
    y += sub.h;
    saida.push({ m, ret, sub, numero: numeroDaLinha, numeroSub });
  }
  const temTotal = plano.tabela?.total !== false;
  const total = temTotal ? { x, y, w, h: TAB.total } : null;
  if (total) y += TAB.total;
  return { topo: TABELA_Y, cabecalho, linhas: saida, total, fundo: y };
};

// Visibilidade da tabela: aparece no primeiro momento de tabela de cada grupo seguido e sai no fim do grupo.
export const gruposDaTabela = (plano: Plano) => {
  const ordem = ordenar(plano);
  const grupos: { de: number; ate: number }[] = [];
  for (const m of ordem) {
    if (!ehDaTabela(m)) continue;
    const ultimo = grupos[grupos.length - 1];
    const anteriorNaOrdem = ordem[ordem.indexOf(m) - 1];
    if (ultimo && anteriorNaOrdem && ehDaTabela(anteriorNaOrdem) && m.de - ultimo.ate < 0.3) ultimo.ate = fimDoMomento(m, plano);
    else grupos.push({ de: m.de, ate: fimDoMomento(m, plano) });
  }
  return grupos;
};

// O bloco de tabela (topicos, passos, tabela) que está na área de baixo no instante t: é ele que
// numera as linhas da planilha. Fora deles, vale a arrumação da tabela das `linha`.
export const blocoDeBaixoNoTempo = (plano: Plano, saidas: Map<Momento, SaidasDoMomento>, t: number): GeoTabela | null => {
  let achado: GeoTabela | null = null;
  for (const m of ordenar(plano)) {
    if (m.tipo !== "topicos" && m.tipo !== "passos" && m.tipo !== "tabela") continue;
    const s = saidas.get(m)?.baixo;
    if (t >= m.de - 0.02 && t < (s ? s.em + s.dur * 0.5 : m.ate)) achado = geoTabela(plano, m);
  }
  return achado;
};

// ---------- cursor de célula ----------

export type Alvo = { t: number; ret: Ret; nome: string; faixa?: number };

const retColuna = (linha: Ret, c: number): Ret => ({ x: COL[c], y: linha.y, w: COL[c + 1] - COL[c], h: linha.h });

// Retângulos internos dos blocos de uma célula (os componentes usam as mesmas contas)
export const linhasDaComparacao = (r: Ret, comTitulo = false): [Ret, Ret] => {
  const topo = comTitulo ? 84 : 0;
  const h = (r.h - topo) / 2;
  return [
    { x: r.x, y: r.y + topo, w: r.w, h },
    { x: r.x, y: r.y + topo + h, w: r.w, h: r.h - topo - h },
  ];
};

// Para onde o cursor pula (e o endereço na caixa de nome). As posições da tabela são calculadas
// no instante do pulo, com as sub-linhas abertas como estiverem nesse instante.
export const alvosDoCursor = (plano: Plano): Alvo[] => {
  const alvos: Alvo[] = [];
  const ordem = ordenar(plano);
  const lugares = lugaresDosMomentos(plano);
  const tituloNome = endereco(0, 1);
  for (const m of ordem) {
    const lugar = lugares.get(m) ?? "cheia";
    const reg = regioesDoMomento(plano, m, lugar);
    const celula = reg.topo ?? reg.larga;
    if (m.tipo === "abertura") {
      alvos.push({ t: m.de - 0.2, ret: RET_TITULO, nome: tituloNome });
    } else if (m.tipo === "linha") {
      const achar = (t: number) => arrumarTabela(plano, t).linhas.find((l) => l.m === m);
      const em = (t: number, c: number) => {
        const l = achar(t + 0.4);
        if (l) alvos.push({ t, ret: retColuna(l.ret, c), nome: endereco(c, l.numero) });
      };
      em(m.item.em - 0.1, 0);
      (m.exemplos ?? []).forEach((ex) => {
        const l = achar(ex.em + 0.4);
        if (l && l.sub.h > 1) alvos.push({ t: ex.em - 0.08, ret: { ...l.sub, h: TAB.sub }, nome: endereco(0, l.numeroSub > 0 ? l.numeroSub : l.numero + 1) });
      });
      if (m.marca) em(m.marca.em - 0.12, 1);
      const c3 = m.formula ? m.formula.em : m.detalhe?.em;
      if (c3 !== undefined) em(c3 - 0.1, 2);
    } else if (m.tipo === "preencher") {
      const arr = arrumarTabela(plano, m.em);
      const primeira = arr.linhas[0];
      if (primeira) {
        alvos.push({ t: m.de, ret: retColuna(primeira.ret, 0), nome: endereco(0, primeira.numero) });
        const ultima = arr.linhas[arr.linhas.length - 1];
        alvos.push({
          t: m.em,
          ret: { x: COL[0], y: primeira.ret.y, w: COL[1] - COL[0], h: ultima.ret.y + ultima.ret.h - primeira.ret.y },
          nome: `${endereco(0, primeira.numero)}:${endereco(0, ultima.numero)}`,
          faixa: arr.linhas.length,
        });
      }
    } else if (m.tipo === "cta" || m.tipo === "celula") {
      const r = celula ?? retCelulaLarga(plano);
      alvos.push({ t: m.de + 0.25, ret: r, nome: enderecoDoRet(r) });
    } else if (m.tipo === "topicos" || m.tipo === "passos" || m.tipo === "tabela") {
      const geo = geoTabela(plano, m);
      if (geo.cabecalho) alvos.push({ t: m.de, ret: geo.cabecalho.ret, nome: endereco(m.tipo === "passos" ? 1 : 0, geo.cabecalho.numero) });
      geo.linhas.forEach((l, i) => {
        const d = l.dados;
        if (m.tipo === "passos") {
          // a alça de preencher arrasta a série 1, 2, 3… pela coluna A
          const primeira = geo.linhas[0];
          const faixa = { x: COL[0], y: primeira.ret.y, w: COL[1] - COL[0], h: l.ret.y + l.ret.h - primeira.ret.y };
          alvos.push({ t: d.em - 0.1, ret: i === 0 ? l.passo ?? l.item : faixa, nome: i === 0 ? endereco(0, l.numero) : `${endereco(0, primeira.numero)}:${endereco(0, l.numero)}` });
          return;
        }
        alvos.push({ t: d.em - 0.1, ret: l.item, nome: endereco(0, l.numero) });
        if (d.marcaEm !== undefined && l.marca) alvos.push({ t: d.marcaEm - 0.1, ret: l.marca, nome: endereco(m.tipo === "tabela" ? 1 : 2, l.numero) });
        if (d.detalheEm !== undefined && l.detalhe) alvos.push({ t: d.detalheEm - 0.1, ret: l.detalhe, nome: endereco(2, l.numero) });
      });
      const tot = totalDaTabela(plano, m);
      if (geo.total && tot) alvos.push({ t: tot.em - 0.1, ret: geo.total.valor, nome: endereco(1, geo.total.numero) });
    } else if (m.tipo === "grafico") {
      const lado = reg.lado;
      const dados = (m.dados ?? []).slice(0, 6);
      if (lado && dados.length) {
        const g = geoDados(lado, dados.length);
        dados.forEach((d, i) => alvos.push({ t: d.em - 0.1, ret: g.linhas[i], nome: endereco(0, 2 + i) }));
      }
      if (reg.baixo) alvos.push({ t: dados.length ? dados[dados.length - 1].em + 0.5 : (m.tendenciaEm ?? m.de + 0.3), ret: reg.baixo, nome: `${enderecoDoRet(reg.baixo)}` });
    } else if (celula) {
      // blocos de uma célula: o cursor entra na célula no começo e acompanha as partes
      const inicio = "em" in m && typeof m.em === "number" ? Math.min(m.em, m.de + 0.25) : m.de + 0.25;
      if (m.tipo === "comparacao") {
        const [a, b] = linhasDaComparacao(celula, !!m.titulo && celula.h >= 420);
        alvos.push({ t: m.lados[0].em - 0.1, ret: a, nome: enderecoDoRet(a) });
        alvos.push({ t: m.lados[1].em - 0.1, ret: b, nome: enderecoDoRet(b) });
        if (m.vencedor !== undefined && m.vencedorEm !== undefined) {
          const r = m.vencedor === 0 ? a : b;
          alvos.push({ t: m.vencedorEm - 0.1, ret: r, nome: enderecoDoRet(r) });
        }
      } else {
        alvos.push({ t: inicio - 0.1, ret: celula, nome: enderecoDoRet(celula) });
      }
    }
  }
  return alvos.sort((a, b) => a.t - b.t);
};

// ---------- total da tabela (assinatura em um momento) ----------

// Instante e fórmula do total: depois da última marca, se ainda couber no momento.
export const totalDaTabela = (plano: Plano, m: Momento) => {
  if (m.tipo !== "tabela" || m.total === false) return null;
  const ls = linhasNorm(m).filter((l) => l.marca !== undefined && l.marcaEm !== undefined);
  if (!ls.length) return null;
  const geo = geoTabela(plano, m);
  const ultima = Math.max(...ls.map((l) => l.marcaEm ?? 0));
  const em = ultima + 0.45;
  if (em > m.ate - 0.5) return { em: Math.min(em, m.ate - 0.3), formula: null, geo };
  const numerica = ls.some((l) => typeof l.marca === "number");
  const a = geo.linhas[0]?.numero ?? 7;
  const b = geo.linhas[geo.linhas.length - 1]?.numero ?? a;
  const formula = numerica ? `=SOMA(B${a}:B${b})` : `=CONT.SE(B${a}:B${b};"${(m.conta ?? "sim") === "nao" ? "✗" : "✓"}")`;
  return { em, formula, geo };
};

// ---------- barra de fórmula ----------

export type Escrita = { de: number; ate?: number; texto: string; tempos: number[]; formula?: boolean };

export const valorDigitado = (v: number, casas = 0) => (casas ? v.toFixed(casas).replace(".", ",") : String(Math.round(v)));

export const escritas = (plano: Plano, palavras: Palavra[], frases: Frase[]): Escrita[] => {
  const lista: Escrita[] = [];
  const tempos = (texto: string, de: number, ate: number, inicio: number) => temposDoTexto(texto, palavras, de, ate, inicio);
  const digita = (texto: string | undefined, em: number | undefined, ate: number, formula = false) => {
    if (!texto || em === undefined) return;
    const tt = tempos(texto, em - 0.3, ate, em);
    lista.push({ de: tt[0] ?? em, texto, tempos: tt, formula });
  };
  for (const m of ordenar(plano)) {
    // bloco novo: a célula é selecionada e a barra de fórmula começa limpa
    if (!["abertura", "linha", "preencher", "celula", "cta", "topicos", "passos", "tabela", "grafico"].includes(m.tipo)) lista.push({ de: m.de, texto: "", tempos: [] });
    if (m.tipo === "abertura") {
      const texto = textoDaAbertura(m);
      const tt = tempos(texto, m.em !== undefined ? m.em - 0.3 : m.de, m.ate, m.em ?? m.de);
      lista.push({ de: tt[0] ?? m.de, texto, tempos: tt });
    } else if (m.tipo === "linha") {
      const it = tempos(m.item.texto, m.item.em - 0.3, m.ate, m.item.em);
      lista.push({ de: m.item.em, texto: m.item.texto, tempos: it });
      for (const ex of m.exemplos ?? []) lista.push({ de: ex.em, texto: ex.texto, tempos: tempos(ex.texto, ex.em - 0.3, m.ate, ex.em) });
      if (m.marca) {
        const v = m.marca.valor;
        const texto = typeof v === "number" ? String(v) : v === "nao" ? "✗" : "✓";
        lista.push({ de: m.marca.em, texto, tempos: [m.marca.em] });
      }
      if (m.formula) {
        lista.push({ de: m.formula.em, texto: m.formula.texto, tempos: tempos(m.formula.texto, m.formula.em - 0.3, m.ate, m.formula.em), formula: true });
      } else if (m.detalhe) {
        lista.push({ de: m.detalhe.em, texto: m.detalhe.texto, tempos: tempos(m.detalhe.texto, m.detalhe.em - 0.3, m.ate, m.detalhe.em) });
      }
    } else if (m.tipo === "preencher") {
      const tt = tempos(m.texto, m.de, m.ate, m.de);
      lista.push({ de: tt[0] ?? m.de, texto: m.texto, tempos: tt });
    } else if (m.tipo === "celula") {
      const tt = tempos(m.texto, m.de, m.ate, m.de);
      lista.push({ de: tt[0] ?? m.de, texto: m.texto, tempos: tt });
      if (m.numero?.formula) lista.push({ de: m.numero.em, texto: m.numero.formula, tempos: tempos(m.numero.formula, m.numero.em - 0.3, m.ate, m.numero.em), formula: true });
    } else if (m.tipo === "cta") {
      const tt = tempos(m.texto, m.em !== undefined ? m.em - 0.3 : m.de, m.ate + 1, m.em ?? m.de);
      lista.push({ de: tt[0] ?? m.de, texto: m.texto, tempos: tt });
    } else if (m.tipo === "topicos" || m.tipo === "passos" || m.tipo === "tabela") {
      lista.push({ de: m.de, texto: "", tempos: [] });
      if (m.titulo) digita(m.titulo, m.de, m.ate);
      for (const l of linhasNorm(m)) {
        digita(l.texto, l.em, m.ate);
        if (l.marca !== undefined && l.marcaEm !== undefined) {
          const texto = typeof l.marca === "number" ? valorDigitado(l.marca, m.tipo === "tabela" ? m.casas : 0) : l.marca === "nao" ? "✗" : "✓";
          lista.push({ de: l.marcaEm, texto, tempos: [l.marcaEm] });
        }
        if (l.detalhe) digita(l.detalhe, l.detalheEm, m.ate);
      }
      const tot = totalDaTabela(plano, m);
      if (tot?.formula) lista.push({ de: tot.em, texto: tot.formula, tempos: [tot.em], formula: true });
    } else if (m.tipo === "numero") {
      digita(m.rotulo, m.rotuloEm, m.ate);
      const texto = m.formula ?? valorDigitado(m.valor, m.casas ?? 0);
      lista.push({ de: m.em, texto, tempos: tempos(texto, m.em - 0.3, m.ate, m.em), formula: true });
    } else if (m.tipo === "destaque") {
      digita(m.texto, m.em, m.ate);
      digita(m.detalhe, m.detalheEm, m.ate);
    } else if (m.tipo === "frase") {
      digita(m.texto, m.em ?? m.de, m.ate);
    } else if (m.tipo === "definicao") {
      digita(m.termo, m.em, m.ate);
      digita(m.significado, m.significadoEm, m.ate);
    } else if (m.tipo === "pergunta") {
      digita(m.texto, m.em ?? m.de, m.ate);
      for (const o of (m.opcoes ?? []).slice(0, 4)) digita(o.texto, o.em, m.ate);
    } else if (m.tipo === "comparacao") {
      // o rótulo e o texto de cada lado, cada um quando é dito
      for (const l of m.lados) {
        const rotuloEm = quandoDito(l.rotulo, palavras, Math.max(m.de, l.em - 1.5), m.ate) ?? l.em;
        if (Math.abs(rotuloEm - l.em) < 0.05) digita(`${l.rotulo} ${l.texto}`, l.em, m.ate);
        else {
          digita(l.rotulo, rotuloEm, m.ate);
          digita(l.texto, l.em, m.ate);
        }
      }
    } else if (m.tipo === "grafico") {
      lista.push({ de: m.de, texto: "", tempos: [] });
      if (m.titulo) digita(m.titulo, m.de, m.ate);
      const f = formatoDoGrafico(m);
      for (const d of (m.dados ?? []).slice(0, 6)) {
        const texto = `${d.rotulo} ${valorDigitado(d.valor, f.casas)}`;
        const tt = tempos(texto, d.em - 0.4, m.ate, d.em);
        lista.push({ de: tt[0] ?? d.em, texto, tempos: tt });
      }
    }
  }
  // legenda: as linhas faladas fora dos momentos (o motor já tira as que caem dentro deles)
  for (const f of frases) lista.push({ de: f.de, ate: f.ate, texto: f.palavras.map((p) => p.w).join(" "), tempos: f.palavras.map((p) => p.em) });
  return lista.sort((a, b) => a.de - b.de);
};

export const escritaNoTempo = (t: number, lista: Escrita[]) => {
  let atual: Escrita | undefined;
  for (const e of lista) if (e.de - 0.02 <= t) atual = e;
  if (!atual) return null;
  if (atual.ate !== undefined && t > atual.ate + 0.25) return null;
  return atual;
};

// ---------- sons ----------

type Som = { em: number; arquivo: string; volume: number };

// Raros e tonais: um toque grave quando um item entra (sobe uma nota por linha), duas notas no ✓,
// um acorde curto quando a fórmula dá resultado, um arpejo no preencher, duas notas ao salvar.
export const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  let i = 0;
  const toque = (em: number, k: number, volume = 0.3) => lista.push({ em: em - 0.02, arquivo: `sfx/toque-${Math.min(Math.max(k, 0), 3) + 1}.wav`, volume });
  for (const m of ordenar(plano)) {
    if (m.aba) lista.push({ em: m.aba.em, arquivo: "sfx/aba.wav", volume: 0.3 });
    if (m.tipo === "linha") {
      lista.push({ em: m.item.em - 0.02, arquivo: `sfx/toque-${Math.min(i, 3) + 1}.wav`, volume: 0.32 });
      if (m.marca) lista.push({ em: m.marca.em, arquivo: "sfx/check.wav", volume: 0.26 });
      if (m.formula) lista.push({ em: m.formula.enterEm ?? fimDaDigitacao(m.formula.texto, [m.formula.em]) + 0.3, arquivo: "sfx/formula.wav", volume: 0.3 });
      i++;
    }
    if (m.tipo === "preencher") lista.push({ em: m.em, arquivo: "sfx/preenche.wav", volume: 0.28 });
    if (m.tipo === "celula" && m.numero) lista.push({ em: m.numero.em, arquivo: "sfx/formula.wav", volume: 0.3 });
    if (m.tipo === "cta") lista.push({ em: m.iconeEm ?? m.em ?? m.de + 0.4, arquivo: "sfx/salvo.wav", volume: 0.3 });
    if (m.tipo === "topicos" || m.tipo === "passos" || m.tipo === "tabela") {
      linhasNorm(m).forEach((l, k) => {
        toque(l.em, k);
        if (l.marcaEm !== undefined && l.marca !== undefined && typeof l.marca !== "number") lista.push({ em: l.marcaEm, arquivo: "sfx/check.wav", volume: 0.24 });
      });
      const tot = totalDaTabela(plano, m);
      if (tot) lista.push({ em: tot.em + (tot.formula ? Math.min(0.7, tot.formula.length * 0.03) : 0), arquivo: "sfx/formula.wav", volume: 0.28 });
    }
    if (m.tipo === "numero") lista.push({ em: m.em, arquivo: "sfx/formula.wav", volume: 0.3 });
    if (m.tipo === "destaque") toque(m.em, m.nivel === "alerta" ? 0 : 2, 0.32);
    if (m.tipo === "definicao") {
      toque(m.em, 1);
      lista.push({ em: m.significadoEm, arquivo: "sfx/aba.wav", volume: 0.28 });
    }
    if (m.tipo === "frase" && m.risco && m.riscoEm !== undefined) lista.push({ em: m.riscoEm, arquivo: "sfx/aba.wav", volume: 0.26 });
    if (m.tipo === "pergunta") {
      toque(m.em ?? m.de + 0.2, 1);
      (m.opcoes ?? []).slice(0, 4).forEach((o, k) => toque(o.em, 2 + (k % 2), 0.26));
    }
    if (m.tipo === "comparacao") {
      toque(m.lados[0].em, 0);
      toque(m.lados[1].em, 2);
      if (m.vencedorEm !== undefined) lista.push({ em: m.vencedorEm, arquivo: "sfx/check.wav", volume: 0.26 });
    }
    if (m.tipo === "grafico") {
      const dados = m.dados ?? [];
      if (dados.length) dados.slice(0, 6).forEach((d, k) => toque(d.em, k));
      else lista.push({ em: m.tendenciaEm ?? m.de + 0.3, arquivo: "sfx/preenche.wav", volume: 0.26 });
    }
  }
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.25) saida.push(s);
  return saida;
};

// ---------- abas ----------

export type EstadoAbas = { nomes: string[]; ativa: number; trocouEm: number; novaEm: number; anterior: number };

export const abasNoTempo = (plano: Plano, t: number): EstadoAbas => {
  const nomes = [...(plano.planilha?.abas?.length ? plano.planilha.abas : ["Planilha 1"])];
  let ativa = Math.min(plano.planilha?.aba ?? 0, nomes.length - 1);
  let anterior = ativa;
  let trocouEm = -10;
  let novaEm = -10;
  for (const m of ordenar(plano)) {
    if (!m.aba || m.aba.em > t) continue;
    let i = nomes.indexOf(m.aba.nome);
    if (i < 0) {
      nomes.push(m.aba.nome);
      i = nomes.length - 1;
      novaEm = m.aba.em;
    }
    anterior = ativa;
    ativa = i;
    trocouEm = m.aba.em;
  }
  return { nomes, ativa, trocouEm, novaEm, anterior };
};

// formata um número com prefixo/sufixo (pt-BR)
export const comFormato = (v: number, f: { prefixo?: string; sufixo?: string; casas?: number }) =>
  `${f.prefixo ? `${f.prefixo} ` : ""}${formatar(v, f.casas ?? 0)}${f.sufixo ?? ""}`;
