// O fio da conversa: que mensagens existem em cada tela do app, o tamanho de cada balão
// (calculado sem medir o DOM) e onde cada linha está no instante t (a rolagem do celular).
import { mistura, prog, rola } from "./anim";
import { type ContrasteInterno, type ConversaInterna, mensagemDoCheio, type Msg, type PlanoInterno } from "./blocos";
import { geoGrafico } from "./grafico";
import type { Comparacao } from "./plano";
import { BOLHA, CONVERSA_TOPO, FIXADA, FOLGA_BOLHA, formatarNumero, larguraTexto, quebrarLinhas, T, W } from "./tema";

export type MsgFio = Msg & {
  // quando o balão (ou o "digitando…") começa a aparecer
  inicio: number;
  // já estava na conversa quando a tela abriu (aparece pronto)
  presente: boolean;
  chave: string;
};

export type Tela =
  // `perfil`: a tela abre com o cartão do contato ("Conversa nova · hoje")
  | { tipo: "fio"; de: number; ate: number; mensagens: MsgFio[]; momentos: ConversaInterna[]; perfil: boolean }
  | { tipo: "contraste"; de: number; ate: number; momento: ContrasteInterno }
  | { tipo: "comparacao"; de: number; ate: number; momento: Comparacao };

export const DIGITANDO_PADRAO = 0.6;
export const inicioDe = (m: Msg) => (m.tipo === "digitando" ? m.em : m.em - (m.digitando ?? DIGITANDO_PADRAO));

// Divide o vídeo em telas do app: cada conversa "nova" abre um fio; contraste e comparação são telas
// próprias. As mensagens dos momentos de quadro cheio entram no fio aberto (ou no próximo).
// Depois de uma tela de faixas, a conversa seguinte continua o fio de antes (sem "conversa nova").
export const montarTelas = (plano: PlanoInterno): Tela[] => {
  const ms = [...plano.momentos].sort((a, b) => a.de - b.de);
  const telas: Tela[] = [];
  let pendentes: Msg[] = [];
  let atual: Extract<Tela, { tipo: "fio" }> | null = null;
  let ultimoFio: Extract<Tela, { tipo: "fio" }> | null = null;
  const fechar = (ate: number) => {
    const ultima = telas[telas.length - 1];
    if (ultima) ultima.ate = ate;
  };
  for (const m of ms) {
    if (m.tipo === "conversa") {
      if (!atual || m.nova) {
        fechar(m.de);
        // continua a conversa de antes (depois de uma tela de faixas) ou abre uma nova
        const continua: boolean = !m.nova && ultimoFio !== null;
        const anteriores: Msg[] = continua && ultimoFio !== null ? ultimoFio.mensagens.map(({ inicio: _i, presente: _p, chave: _c, ...r }) => r) : [];
        atual = { tipo: "fio", de: m.de, ate: plano.duracao, mensagens: [], momentos: [], perfil: !continua };
        telas.push(atual);
        for (const p of [...anteriores, ...pendentes]) atual.mensagens.push(p as MsgFio);
        pendentes = [];
        ultimoFio = atual;
      }
      atual.momentos.push(m);
      for (const msg of m.mensagens) atual.mensagens.push(msg as MsgFio);
    } else if (m.tipo === "contraste" || m.tipo === "comparacao") {
      fechar(m.de);
      telas.push(m.tipo === "contraste" ? { tipo: "contraste", de: m.de, ate: plano.duracao, momento: m } : { tipo: "comparacao", de: m.de, ate: plano.duracao, momento: m });
      atual = null;
    } else {
      const doCheio = mensagemDoCheio(m);
      if (!doCheio) continue;
      // a mensagem de um momento de quadro cheio só entra na conversa depois que a pessoa cobriu a tela
      // (senão ela apareceria no app, atrás da pessoa que ainda está crescendo, por cima de outro balão)
      const coberto = Math.min(m.ate - 0.05, m.de + 0.75);
      const msg: Msg = { ...doCheio, doCheio: true, ...(doCheio.em < coberto ? { em: coberto, digitando: 0 } : {}) };
      if (atual) atual.mensagens.push(msg as MsgFio);
      else pendentes.push(msg);
    }
  }
  // completa os campos de cada mensagem
  for (const tela of telas) {
    if (tela.tipo !== "fio") continue;
    tela.mensagens = tela.mensagens
      .map((m, i) => {
        const inicio = inicioDe(m);
        return { ...m, inicio, presente: inicio < tela.de - 0.01, chave: `${tela.de}-${i}-${m.em}` };
      })
      .sort((a, b) => a.inicio - b.inicio);
  }
  return telas;
};

export const telaEm = (telas: Tela[], t: number) => {
  let achou: Tela | undefined;
  for (const tela of telas) if (tela.de <= t + 0.001) achou = tela;
  return achou;
};

// ---------- medidas de um balão ----------

// A condição quebra de preferência na vírgula ("Pagando hoje, | frete grátis")
export const linhasDaCondicao = (texto: string, largura: number, corpo: number) => {
  const partes = texto.split(/(?<=,)\s+/);
  const linhas = partes.flatMap((p) => quebrarLinhas(p, largura, corpo, 600));
  return linhas.length <= 2 ? linhas : quebrarLinhas(texto, largura, corpo, 600);
};

export type Medida = {
  w: number;
  h: number;
  linhas: string[];
  // a hora (e os vistos) cabem na última linha
  metaNaLinha: boolean;
  corpo: number;
  // preço: altura da condição; cartão: altura da imagem
  extra: number;
  condLinhas: string[];
  // peso do texto (800 no termo da definição e no destaque)
  peso: number;
  // resposta: altura da citação no topo (com o espaço até o texto)
  citaH: number;
  // passos: diâmetro da bolinha do número (0 = sem)
  chip: number;
  // segunda linha menor
  detalheLinhas: string[];
  detalheCorpo: number;
  // número: corpo do rótulo e do valor
  rotuloCorpo: number;
  valorCorpo: number;
};

export const META = 30;
export const metaLargura = (de: "cliente" | "eu") => larguraTexto("14:02", META, 500) + (de === "eu" ? 46 : 0);

// Proporções dos balões especiais (as mesmas no cálculo da altura e no desenho)
export const geoPreco = (corpo: number) => ({
  valor: Math.min(T.preco, Math.round(corpo * 2.08)),
  cond: Math.round(corpo * 0.94),
  icone: Math.round(corpo * 1.3),
});
export const geoCartao = (corpo: number, largura: number) => ({
  img: Math.round(largura * 0.3),
  titulo: Math.round(corpo * 1.0),
  linha: Math.round(corpo * 0.9),
});
// padding e entrelinha de um balão de texto
export const geoTexto = (c: number) => ({
  padH: Math.round(c * 0.66),
  padTopo: Math.round(c * 0.4),
  padBase: Math.round(c * 0.34),
  linhaH: Math.round(c * 1.24),
});
// o texto de um número com prefixo e sufixo
export const textoDoNumero = (n: NonNullable<Msg["numero"]>, v = n.valor) =>
  `${n.prefixo ? `${n.prefixo} ` : ""}${formatarNumero(v, n.casas ?? 0)}${n.sufixo ? (/^[%º°]/.test(n.sufixo) ? n.sufixo : ` ${n.sufixo}`) : ""}`;

// corpo de um balão: o da mensagem (listas) ou o padrão; o termo em negrito fica um pouco maior
export const corpoDe = (m: Msg, padrao: number) => {
  const c = m.corpo ?? padrao;
  return m.forte ? Math.round(c * 1.1) : c;
};

// `semMeta`: balão sem hora nem vistos (as mini-mensagens das faixas)
export const medidas = (m: Msg, corpoPadrao: number, larguraMax = W * 0.84, semMeta = false): Medida => {
  const corpo = corpoDe(m, corpoPadrao);
  const { padH, padTopo, padBase, linhaH } = geoTexto(corpo);
  const meta = semMeta ? 0 : metaLargura(m.de);
  const tipo = m.tipo ?? "texto";
  const base = {
    linhas: [] as string[],
    metaNaLinha: false,
    corpo,
    extra: 0,
    condLinhas: [] as string[],
    peso: 500,
    citaH: 0,
    chip: 0,
    detalheLinhas: [] as string[],
    detalheCorpo: 0,
    rotuloCorpo: 0,
    valorCorpo: 0,
  };

  if (tipo === "digitando") return { ...base, w: Math.round(corpo * 2.9), h: padTopo + linhaH + padBase };

  if (tipo === "preco") {
    const g = geoPreco(corpo);
    const larg = larguraMax;
    const condLinhas = m.condicao ? linhasDaCondicao(m.condicao.texto, larg - 2 * padH - g.icone - 3 * 18, g.cond) : [];
    const condH = m.condicao ? Math.max(g.icone + 28, condLinhas.length * Math.round(g.cond * 1.18) + 30) + 16 : 0;
    return { ...base, w: larg, h: padTopo + Math.round(g.valor * 1.08) + condH + 40 + padBase, extra: condH, condLinhas };
  }

  if (tipo === "cartao") {
    const larg = Math.min(larguraMax, corpo * 13);
    const g = geoCartao(corpo, larg);
    const titulo = m.titulo ? Math.round(g.titulo * 1.2) : 0;
    const linha = m.linha ? Math.round(g.linha * 1.25) + 6 : 0;
    return { ...base, w: larg, h: 16 + g.img + 18 + titulo + linha + 40 + padBase, extra: g.img };
  }

  if (tipo === "confirmacao") {
    // aviso do sistema, compacto: ícone + texto pequeno + valor
    const linhaTexto = m.texto ?? "";
    const linhaValor = m.valor ?? "";
    const texto = larguraTexto(linhaTexto, Math.round(corpo * 0.62), 700);
    const valor = larguraTexto(linhaValor, Math.round(corpo * 1.05), 800);
    const larg = Math.min(larguraMax, Math.max(Math.round(corpo * 10.6), Math.round(corpo * 2.9 + Math.max(texto, valor) + corpo * 0.6)));
    return { ...base, w: larg, h: Math.round(corpo * 2.95) };
  }

  if (tipo === "grafico" && m.grafico) {
    const g = geoGrafico(m.grafico, larguraMax);
    return { ...base, w: g.w, h: g.h };
  }

  if (tipo === "numero" && m.numero) {
    const rotuloCorpo = Math.max(34, Math.round(corpo * 0.6));
    const util = larguraMax - 2 * padH;
    const final = textoDoNumero(m.numero);
    let valorCorpo = Math.min(T.preco, Math.round(corpo * 1.75));
    while (valorCorpo > corpo && larguraTexto(final, valorCorpo, 800) * 1.04 > util) valorCorpo -= 4;
    const rotulo = quebrarLinhas(m.numero.rotulo, util, rotuloCorpo, 600);
    const larguraValor = larguraTexto(final, valorCorpo, 800) * 1.04;
    const larguraRotulo = Math.max(...rotulo.map((l) => larguraTexto(l, rotuloCorpo, 600)));
    const w = Math.ceil(Math.min(larguraMax, Math.max(larguraValor, larguraRotulo, meta + 140) + 2 * padH));
    const h = padTopo + rotulo.length * Math.round(rotuloCorpo * 1.2) + Math.round(valorCorpo * 1.1) + padBase + (semMeta ? 0 : 34);
    return { ...base, w, h, linhas: rotulo, rotuloCorpo, valorCorpo };
  }

  // texto (com as variações dos blocos: termo em negrito, resposta com citação, passo numerado, detalhe)
  const peso = m.peso ?? (m.forte ? 800 : 500);
  const chip = m.passo || m.alerta ? Math.round(corpo * 0.98) : 0;
  const recuo = chip ? chip + Math.round(corpo * 0.3) : 0;
  const maxTexto = larguraMax - 2 * padH - recuo;
  const linhas = quebrarLinhas(m.texto ?? "", peso > 500 ? maxTexto / 1.03 : maxTexto, corpo, peso);
  const larguras = linhas.map((l) => larguraTexto(l, corpo, peso) * (peso > 500 ? 1.03 : 1));
  const detalheCorpo = m.detalhe ? Math.max(40, Math.round(corpo * 0.66)) : 0;
  const detalheLinhas = m.detalhe ? quebrarLinhas(m.detalhe, maxTexto, detalheCorpo, 500) : [];
  const largurasDetalhe = detalheLinhas.map((l) => larguraTexto(l, detalheCorpo, 500));
  const citaCorpo = Math.max(36, Math.round(corpo * 0.6));
  const citaH = m.cita ? Math.round(citaCorpo * 1.25) + 2 * 14 + 14 : 0;
  const larguraCita = m.cita ? Math.min(maxTexto, larguraTexto(m.cita, citaCorpo, 700) + 40) : 0;
  // a hora vai ao lado da última linha (do detalhe, se houver), se couber
  const ultima = detalheLinhas.length ? (largurasDetalhe[largurasDetalhe.length - 1] ?? 0) : (larguras[larguras.length - 1] ?? 0);
  const metaNaLinha = semMeta || ultima + 22 + meta <= maxTexto;
  const larguraTextoMax = Math.max(...larguras, ...largurasDetalhe, larguraCita, semMeta ? 0 : metaNaLinha ? ultima + 22 + meta : meta);
  const detalheH = detalheLinhas.length ? detalheLinhas.length * Math.round(detalheCorpo * 1.22) + 6 : 0;
  return {
    ...base,
    linhas,
    metaNaLinha,
    peso,
    chip,
    citaH,
    detalheLinhas,
    detalheCorpo,
    w: Math.ceil(Math.min(larguraMax, larguraTextoMax + recuo + 2 * padH)),
    h: padTopo + citaH + linhas.length * linhaH + detalheH + padBase + (metaNaLinha ? 0 : 38),
  };
};

// O balão de preço cresce quando a condição chega (0 = só o preço, 1 = com a condição)
export const crescimentoDoPreco = (m: Msg, t: number) => (m.tipo === "preco" && m.condicao ? prog(t, m.condicao.em - 0.12, 0.45, rola) : 1);

// ---------- a rolagem ----------

export const VISTO_ALTURA = 56;
export const REACAO_ALTURA = 48;
const PERFIL_ALTURA = 330;
const ENTRA = 0.32;

export type Linha = {
  chave: string;
  msg?: MsgFio;
  // "perfil" = o cartão do contato que abre uma conversa nova (avatar grande, nome, "conversa nova")
  perfil?: boolean;
  y: number;
  h: number;
  // 0→1 da entrada da linha (o balão sobe e aparece)
  entrada: number;
  // 0→1 da troca de "digitando…" para a mensagem
  pronta: number;
  // 0→1 do "digitando…" que some (vácuo)
  some: number;
  medida?: Medida;
  medidaDigitando?: Medida;
};

// As linhas visíveis de um fio no instante t, empilhadas de baixo para cima a partir de `base`.
export const linhasDoFio = (tela: Extract<Tela, { tipo: "fio" }>, t: number, base: number, corpo: number): Linha[] => {
  const linhas: Omit<Linha, "y">[] = [];
  if (tela.perfil) linhas.push({ chave: `perfil-${tela.de}`, perfil: true, h: PERFIL_ALTURA, entrada: 1, pronta: 1, some: 0 });
  for (const m of tela.mensagens) {
    if (!m.presente && t < m.inicio) continue;
    const med = medidas(m, corpo);
    const dig = medidas({ ...m, tipo: "digitando", forte: false }, corpo);
    const temDigitando = m.tipo !== "digitando" && (m.digitando ?? DIGITANDO_PADRAO) > 0;
    const entrada = m.presente ? 1 : prog(t, m.inicio, ENTRA, rola);
    const pronta = m.tipo === "digitando" ? 0 : m.presente || !temDigitando ? 1 : prog(t, m.em, 0.3, rola);
    const some = m.tipo === "digitando" && m.ate !== undefined ? prog(t, m.ate, 0.3, rola) : 0;
    if (some >= 1) continue;
    const hMsg = med.h - med.extra * (m.tipo === "preco" ? 1 - crescimentoDoPreco(m, t) : 0);
    let h = temDigitando || m.tipo === "digitando" ? mistura(dig.h, hMsg, pronta) : hMsg;
    if (m.vistoEm !== undefined) h += VISTO_ALTURA * prog(t, m.vistoEm, 0.3, rola);
    if (m.reacao) h += REACAO_ALTURA * prog(t, m.reacao.em, 0.3, rola);
    h *= entrada * (1 - some);
    linhas.push({ chave: m.chave, msg: m, h, entrada, pronta, some, medida: med, medidaDigitando: dig });
  }
  // empilha de baixo para cima, com espaço maior quando muda quem fala
  const saida: Linha[] = [];
  let y = base;
  for (let i = linhas.length - 1; i >= 0; i--) {
    const l = linhas[i];
    const acima = linhas[i - 1];
    y -= l.h;
    saida.unshift({ ...l, y });
    if (acima) {
      const muda = !acima.msg || !l.msg || acima.msg.de !== l.msg.de || l.msg.tipo === "confirmacao";
      const fator = Math.min(1, l.h / 40);
      y -= (muda ? 26 : 14) * fator;
    }
  }
  return saida;
};

// Deslocamento de rolagem na troca de tela: a anterior sobe e sai, a nova sobe de baixo
export const DUR_TROCA_TELA = 0.55;
export const deslocamentoDaTela = (telas: Tela[], tela: Tela, t: number, alturaArea: number) => {
  const i = telas.indexOf(tela);
  const proxima = telas[i + 1];
  const anterior = telas[i - 1];
  const distancia = alturaArea + 120;
  // a primeira tela (ou uma que vem depois de um vão) não rola para entrar
  const entra = anterior && Math.abs(anterior.ate - tela.de) < 0.05 ? prog(t, tela.de, DUR_TROCA_TELA, rola) : 1;
  const sai = proxima && Math.abs(proxima.de - tela.ate) < 0.05 ? prog(t, proxima.de, DUR_TROCA_TELA, rola) : 0;
  return (1 - entra) * distancia - sai * distancia;
};

// O diâmetro da bolha numa conversa: a tela é dividida entre a pessoa e as mensagens DO MOMENTO
// (mais a mensagem de antes, para dar contexto). Pouca mensagem = pessoa grande; muita = pessoa
// menor (até o mínimo do momento), e as mais antigas sobem para fora, como no celular.
export const diametroNoMomento = (tela: Extract<Tela, { tipo: "fio" }>, momento: ConversaInterna, t: number, corpo: number) => {
  const linhas = linhasDoFio(tela, t, 0, corpo);
  const primeira = linhas.findIndex((l) => l.msg && !l.msg.presente && l.msg.inicio >= momento.de - 0.01);
  const foco = primeira === -1 ? linhas.slice(-1) : linhas.slice(Math.max(0, primeira - 1));
  // a mensagem de contexto conta inteira até 440 px (um cartão alto aparece só pela parte de baixo);
  // nos blocos (lista, passos, gráfico) ela conta menos: o bloco é o que importa
  const contexto = momento.bloco ? 200 : 440;
  const precisa = foco.reduce((soma, l, i) => soma + (i === 0 && primeira !== 0 ? Math.min(l.h, contexto) : l.h + 26 * Math.min(1, l.h / 40)), 0);
  const topo = CONVERSA_TOPO - (momento.semFixada ? FIXADA.altura : 0);
  const disponivel = BOLHA.base - FOLGA_BOLHA - topo - 30;
  return Math.min(BOLHA.max, Math.max(momento.minBolha ?? BOLHA.min, disponivel - precisa));
};
