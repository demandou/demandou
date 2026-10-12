// O funil como dados: o desenho do funil (largura de cada etapa = quantas pessoas chegam lá) e a
// história de cada ponto no tempo. Tudo é calculado a partir do plano, sem estado: o mesmo
// instante sempre gera o mesmo quadro.
//
// Cada ponto vale `unidade` pessoas (1 ponto = 10 pessoas no exemplo de 1.000). Uma etapa com menos
// que um ponto (ex.: 1 compra = 0,1 de ponto) mostra um ponto parcial: o contorno do ponto e uma
// fatia do tamanho da fração. Um ponto também pode ter fatias: a parte que passou para a etapa de
// baixo (grafite, ou verde se passou por causa de um conserto) e a parte que ficou pelo caminho.
import { aleatorio, apuracao, limitar, mistura, prog, queda, troca } from "./anim";
import type { Conserto, Etapa, Funil, Momento } from "./plano";
import { formatar } from "./tema";

// ——— geometria (px lógicos da página; na tela, × ESCALA de tema.ts) ———
// No quadro deitado a página é o QUADRO do lado esquerdo (a pessoa fica na moldura à direita).
// O funil fica no lado direito da página: à esquerda dele, os contadores e os selos; à direita,
// o traço do caminho com o texto dele; no alto, a etiqueta (esquerda) e o botão "depois" (direita).

export const FUNIL = {
  centro: 860, // eixo do funil
  boca: 290, // topo do funil (a etiqueta e o contador da primeira etapa ficam acima)
  base: 1010, // fundo do bico (acima da legenda)
  larguraMax: 740, // a boca
  larguraMin: 92, // o bico
};
// altura mínima de uma etapa (da segunda em diante): o selo na divisa e, abaixo dele, a fileira
// do contador (rótulo e número lado a lado). Com etapas mais altas o contador volta a ser a pilha
// do vertical (número em cima, rótulo embaixo).
export const ETAPA_MIN = 132;
const MARGEM = 16; // entre os pontos e a parede

export type Geometria = {
  n: number;
  unidade: number;
  // eixo do funil (x) e largura da boca: o padrão é 430 e 740; sem números (ou com etapas do
  // meio largas) o funil fica um pouco mais estreito e mais à direita, para os rótulos caberem
  centro: number;
  bocaMax: number;
  // topo de cada etapa (y) e o fundo da última
  y: number[];
  // largura no topo de cada etapa, no começo (antes de qualquer conserto) e no máximo
  largura0: number[];
  larguraMax: number[];
  passo: number; // distância entre pontos
  ponto: number; // diâmetro do ponto
};

const REDONDOS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000, 100000];
// unidade dos pontos: um número redondo que deixa a primeira etapa com até ~120 pontos
const unidadeDe = (topo: number) => (topo <= 120 ? 1 : (REDONDOS.find((u) => topo / u <= 120) ?? Math.ceil(topo / 120)));

// ——— história ———

type Cor = "normal" | "conserto";
// um pedaço de ponto que chega numa vaga (ou sai dela para a etapa de baixo)
export type Pedaco = { vaga: number; quanto: number; em: number; cor: Cor };
export type Particula = { de: number; vaga: number; quanto: number; atraso: number; cor: Cor };

export type Transferencia = {
  para: number; // etapa que recebe
  inicio: number;
  dur: number;
  particulas: Particula[];
  quantosAntes: number; // pontos (fracionários) da etapa antes e depois
  quantosDepois: number;
  valorAntes: number;
  valorDepois: number;
  cor: Cor;
};

export type Historia = {
  funil: Funil;
  // sem nenhum número dito: os pontos são ilustrativos e a tela não mostra números
  qualitativo: boolean;
  // algum número na tela é ilustrativo (mostra a etiqueta "Ilustrativo" se não houver `rotulo`)
  ilustrativo: boolean;
  // por etapa: o contador mostra o número (dito ou tirado de uma taxa dita)?
  mostraNumero: boolean[];
  // por passo (etapa 1 em diante): o selo mostra a taxa em %?
  mostraTaxa: boolean[];
  geo: Geometria;
  transferencias: Transferencia[];
  chegadas: Pedaco[][]; // por etapa
  saidas: Pedaco[][]; // por etapa: o que passou para a etapa de baixo
  primeiraSaida: number[];
  alertas: { etapa: number; em: number }[];
  // `ilustrativo`: a taxa nova não foi dita (o ganho é ilustrativo e os números que mudam ganham "≈")
  consertos: { etapa: number; em: number; taxaAntes: number; taxaDepois: number; texto?: string; ilustrativo: boolean }[];
  valores: number[]; // valores iniciais
  valoresFinais: number[];
};

const PREPARO = 0.12; // os escolhidos acendem antes de cair
const duracaoDaQueda = (n: number) => (n <= 2 ? 0.55 : n <= 12 ? 0.68 : 0.8);

const ordemDeEscolha = (n: number, semente: number) => {
  const r = aleatorio(semente);
  const ordem = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
  }
  return ordem;
};

// ——— os números de cada etapa: ditos, tirados de uma taxa dita, ou ilustrativos ———

// proporções ilustrativas (sem números ditos): o funil afina de forma clara, sem parecer dado real
const ILUSTRATIVOS: Record<number, number[]> = {
  1: [100],
  2: [100, 15],
  3: [100, 30, 6],
  4: [100, 40, 15, 4],
  5: [100, 50, 24, 10, 3],
};
const QUEDA_ILUSTRATIVA = 0.45;

const temNumero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

export const resolverValores = (etapas: Etapa[]) => {
  const n = etapas.length;
  const algumDado = etapas.some((e) => temNumero(e.valor) || temNumero(e.taxa));
  if (!algumDado) {
    const base = ILUSTRATIVOS[n] ?? Array.from({ length: n }, (_, k) => Math.round(100 * QUEDA_ILUSTRATIVA ** k));
    return { valores: base, qualitativo: true, mostraNumero: etapas.map(() => false), mostraTaxa: etapas.map(() => false), inventado: true };
  }
  const v: (number | undefined)[] = etapas.map((e) => (temNumero(e.valor) ? e.valor : undefined));
  let inventado = false;
  if (v[0] === undefined) {
    // sem a base dita: 100 (ou uma potência de 10 acima do maior número dito)
    const maior = Math.max(0, ...v.filter(temNumero));
    v[0] = maior * 2 <= 100 ? 100 : 10 ** Math.ceil(Math.log10(maior * 2));
    inventado = true;
  }
  // de cima para baixo: número dito, ou taxa dita sobre a etapa de cima
  for (let k = 1; k < n; k++) {
    const anterior = v[k - 1];
    if (v[k] !== undefined) v[k] = anterior !== undefined ? Math.min(v[k] as number, anterior) : v[k];
    else if (temNumero(etapas[k].taxa) && anterior !== undefined) v[k] = (anterior * Math.min(100, etapas[k].taxa as number)) / 100;
  }
  // o que falta: entre dois números conhecidos, uma progressão geométrica; depois do último, uma queda ilustrativa
  for (let k = 1; k < n; k++) {
    if (v[k] !== undefined) continue;
    inventado = true;
    const antes = v[k - 1] as number;
    let j = k + 1;
    while (j < n && v[j] === undefined) j++;
    if (j < n) {
      const depois = Math.max(v[j] as number, 1e-6);
      v[k] = antes * (depois / Math.max(antes, 1e-6)) ** (1 / (j - k + 1));
    } else v[k] = antes * QUEDA_ILUSTRATIVA;
    v[k] = Math.max(0, Number((v[k] as number).toPrecision(2)));
  }
  const valores = v.map((x) => x as number);
  const mostraNumero = etapas.map((e, k) => (k === 0 ? temNumero(e.valor) : temNumero(e.valor) || temNumero(e.taxa)));
  const mostraTaxa = etapas.map((e, k) => k > 0 && (temNumero(e.taxa) || (mostraNumero[k] && mostraNumero[k - 1])));
  return { valores, qualitativo: false, mostraNumero, mostraTaxa, inventado };
};

// taxa nova de um conserto sem taxa dita: a taxa dobra (no máximo +35 pontos e 90%)
const taxaIlustrativa = (atual: number) => Math.min(90, Math.max(atual + 5, Math.min(atual * 2, atual + 35)));

// novos valores depois de consertar o passo `etapa` com a taxa `taxa` (%): as etapas de baixo
// crescem junto, mantendo as próprias taxas
const aplicarConserto = (v: number[], etapa: number, taxa: number) => {
  const taxas = v.map((x, k) => (k === 0 ? 1 : v[k - 1] > 0 ? x / v[k - 1] : 0));
  const novo = [...v];
  novo[etapa] = Math.max(v[etapa], Math.round((v[etapa - 1] * taxa) / 100));
  for (let k = etapa + 1; k < v.length; k++) novo[k] = Math.max(v[k], Math.round(novo[k - 1] * taxas[k]));
  return novo;
};

export const montarHistoria = (funil: Funil, consertos: Conserto[]): Historia => {
  const etapas = funil.etapas;
  const n = etapas.length;
  const resolvido = resolverValores(etapas);
  const valores = resolvido.valores;
  const unidade = unidadeDe(valores[0]);
  const listaConsertos = consertos
    .flatMap((m) => m.consertos ?? [])
    .filter((c) => c.etapa >= 1 && c.etapa < n)
    .sort((a, b) => a.em - b.em);
  // a taxa de cada conserto: a dita, ou uma ilustrativa (a taxa dobra)
  const taxasDosConsertos: number[] = [];
  {
    let v = [...valores];
    for (const c of listaConsertos) {
      const atual = (v[c.etapa] / Math.max(1e-6, v[c.etapa - 1])) * 100;
      const taxa = temNumero(c.taxa) ? c.taxa : taxaIlustrativa(atual);
      taxasDosConsertos.push(taxa);
      v = aplicarConserto(v, c.etapa, taxa);
    }
  }

  // valores finais (para reservar espaço e largura)
  let finais = [...valores];
  listaConsertos.forEach((c, i) => {
    finais = aplicarConserto(finais, c.etapa, taxasDosConsertos[i]);
  });
  const geo = geometria(funil, unidade, valores, finais, formaDoFunil(valores, resolvido.qualitativo));

  const quantos = valores.map(() => 0); // pontos planejados por etapa
  const chegadas: Pedaco[][] = valores.map(() => []);
  const saidas: Pedaco[][] = valores.map(() => []);
  const transferencias: Transferencia[] = [];
  const ordens = finais.map((v, k) => ordemDeEscolha(Math.ceil(v / unidade) + 1, 17 + k * 7));

  // a primeira etapa enche numa varredura, da esquerda para a direita, enquanto o contador conta
  {
    const total = valores[0] / unidade;
    const vagas = Math.ceil(total - 1e-9);
    const xs = Array.from({ length: vagas }, (_, v) => posicaoDaVaga(geo, 0, v, vagas).x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    for (let v = 0; v < vagas; v++) {
      const pos = posicaoDaVaga(geo, 0, v, vagas);
      const linha = (geo.y[1] - pos.y) / (geo.y[1] - geo.y[0]);
      const em = etapas[0].em + 0.8 * (((pos.x - minX) / Math.max(1, maxX - minX)) * 0.75 + linha * 0.25);
      chegadas[0].push({ vaga: v, quanto: Math.min(1, total - v), em, cor: "normal" });
    }
    quantos[0] = total;
  }

  // quanto de cada vaga já foi planejado para chegar / sair
  const cheio = (k: number, vaga: number, ate = Infinity) =>
    chegadas[k].filter((p) => p.vaga === vaga && p.em <= ate).reduce((s, p) => s + p.quanto, 0);
  const saiu = (k: number, vaga: number) => saidas[k].filter((p) => p.vaga === vaga).reduce((s, p) => s + p.quanto, 0);

  // planeja uma descida de `quanto` (em pontos) para a etapa `para`
  const descer = (para: number, quanto: number, inicio: number, valorAntes: number, valorDepois: number, corDaDescida: Cor) => {
    const de = para - 1;
    const r = aleatorio(para * 31 + Math.round(inicio * 100));
    // de onde sai: vagas da etapa de cima, na ordem de escolha. Numa descida normal, primeiro as
    // que já chegaram; num conserto, primeiro os pontos que também vieram de um conserto (o fluxo
    // consertado continua descendo), mesmo que ainda estejam pousando
    const chegadaDa = (vaga: number) => Math.max(-Infinity, ...chegadas[de].filter((p) => p.vaga === vaga).map((p) => p.em));
    const doConserto = (vaga: number) => chegadas[de].some((p) => p.vaga === vaga && p.cor === "conserto");
    const criterios: ((vaga: number) => boolean)[] = [
      ...(corDaDescida === "conserto" ? [(vaga: number) => doConserto(vaga)] : []),
      (vaga: number) => chegadaDa(vaga) <= inicio + 0.05,
      () => true,
    ];
    const fontes: { vaga: number; quanto: number }[] = [];
    let falta = quanto;
    for (const criterio of criterios) {
      for (const vaga of ordens[de]) {
        if (falta <= 1e-6) break;
        if (!criterio(vaga)) continue;
        const disponivel = cheio(de, vaga) - saiu(de, vaga) - (fontes.find((f) => f.vaga === vaga)?.quanto ?? 0);
        if (disponivel <= 1e-6) continue;
        const pega = Math.min(disponivel, falta);
        const existente = fontes.find((f) => f.vaga === vaga);
        if (existente) existente.quanto += pega;
        else fontes.push({ vaga, quanto: pega });
        falta -= pega;
      }
    }
    const recebido = quanto - falta;
    // para onde vai: completa a vaga parcial e abre as seguintes
    const antes = quantos[para];
    const alvos: { vaga: number; quanto: number }[] = [];
    let resto = recebido;
    let cursor = antes;
    while (resto > 1e-6) {
      const vaga = Math.floor(cursor + 1e-9);
      const espaco = Math.min(resto, vaga + 1 - cursor);
      alvos.push({ vaga, quanto: espaco });
      cursor += espaco;
      resto -= espaco;
    }
    // casa as fontes com os alvos em partículas
    const particulas: Particula[] = [];
    const fs = fontes.map((f) => ({ ...f }));
    const as = alvos.map((a) => ({ ...a }));
    let i = 0;
    let j = 0;
    while (i < fs.length && j < as.length) {
      const q = Math.min(fs[i].quanto, as[j].quanto);
      if (q > 1e-6) particulas.push({ de: fs[i].vaga, vaga: as[j].vaga, quanto: q, atraso: 0, cor: corDaDescida });
      fs[i].quanto -= q;
      as[j].quanto -= q;
      if (fs[i].quanto <= 1e-6) i++;
      if (as[j].quanto <= 1e-6) j++;
    }
    const espalhar = particulas.length <= 1 ? 0 : Math.min(0.42, 0.012 * particulas.length + 0.06);
    particulas.forEach((p) => {
      // um ponto só sai depois de ter pousado na etapa de cima
      p.atraso = Math.max(r() * espalhar, chegadaDa(p.de) - inicio - PREPARO + 0.03);
    });
    const dur = duracaoDaQueda(particulas.length);
    for (const p of particulas) {
      saidas[de].push({ vaga: p.de, quanto: p.quanto, em: inicio, cor: corDaDescida });
      chegadas[para].push({ vaga: p.vaga, quanto: p.quanto, em: inicio + PREPARO + p.atraso + dur, cor: corDaDescida });
    }
    quantos[para] = antes + recebido;
    transferencias.push({ para, inicio, dur, particulas, quantosAntes: antes, quantosDepois: quantos[para], valorAntes, valorDepois, cor: corDaDescida });
  };

  // montagem: cada etapa recebe os pontos da de cima quando o número é dito
  for (let k = 1; k < n; k++) descer(k, valores[k] / unidade, etapas[k].em, 0, valores[k], "normal");

  // consertos: a taxa do passo melhora e as etapas de baixo crescem junto
  const consertosDaHistoria: Historia["consertos"] = [];
  let atuais = [...valores];
  for (const [i, c] of listaConsertos.entries()) {
    const novo = aplicarConserto(atuais, c.etapa, taxasDosConsertos[i]);
    consertosDaHistoria.push({
      etapa: c.etapa,
      em: c.em,
      taxaAntes: (atuais[c.etapa] / Math.max(1e-6, atuais[c.etapa - 1])) * 100,
      taxaDepois: (novo[c.etapa] / Math.max(1e-6, novo[c.etapa - 1])) * 100,
      texto: c.texto,
      ilustrativo: !temNumero(c.taxa),
    });
    // o próximo conserto: a onda deste não pode passar dele (os números ficariam fora de ordem)
    const proximo = listaConsertos.find((o) => o.em > c.em + 1e-6);
    for (let k = c.etapa; k < n; k++) {
      const delta = (novo[k] - atuais[k]) / unidade;
      if (delta <= 1e-6) continue;
      // a etapa de baixo recebe um instante depois (a onda desce pelo funil)
      const inicio = k === c.etapa ? c.em : Math.min(c.em + 0.4 * (k - c.etapa), proximo ? proximo.em - 0.04 : Infinity);
      descer(k, delta, inicio, atuais[k], novo[k], "conserto");
    }
    atuais = novo;
  }

  const primeiraSaida = valores.map((_, k) => Math.min(Infinity, ...saidas[k].map((s) => s.em)));
  const alertas = [...(funil.alertas ?? []), ...consertos.flatMap((m) => m.alertas ?? [])].filter((a) => a.etapa >= 1 && a.etapa < n);
  const ilustrativo = !!funil.ilustrativo || resolvido.inventado || consertosDaHistoria.some((c) => c.ilustrativo && !resolvido.qualitativo);

  return {
    funil,
    qualitativo: resolvido.qualitativo,
    ilustrativo,
    mostraNumero: resolvido.mostraNumero,
    mostraTaxa: resolvido.mostraTaxa,
    geo,
    transferencias: transferencias.sort((a, b) => a.inicio - b.inicio),
    chegadas,
    saidas,
    primeiraSaida,
    alertas,
    consertos: consertosDaHistoria,
    valores,
    valoresFinais: finais,
  };
};

// largura do funil para uma quantidade de pontos: potência, para 1.000 → 1 caber de 740 a 92 px lógicos
const larguraPara = (pontos: number, topo: number, expoente: number, boca = FUNIL.larguraMax) =>
  Math.max(FUNIL.larguraMin, Math.min(boca, boca * Math.max(1e-6, pontos / topo) ** expoente));

const expoenteDe = (valores: number[], boca = FUNIL.larguraMax) => {
  const positivos = valores.filter((v) => v > 0);
  const razao = Math.max(...positivos) / Math.min(...positivos);
  if (razao <= 1.01) return 0.3;
  return limitar(Math.log(boca / FUNIL.larguraMin) / Math.log(razao), 0.18, 0.85);
};

// Funil estreito (rótulos sem número, mais compridos; ou etapas do meio largas): o eixo vai um pouco
// para a direita e a boca diminui, para os rótulos da esquerda caberem.
export const formaDoFunil = (valores: number[], qualitativo: boolean) => {
  const largas = valores.slice(1, -1).some((v) => v / Math.max(1e-6, valores[0]) > 0.3);
  return qualitativo || largas ? { centro: 920, boca: 620 } : { centro: FUNIL.centro, boca: FUNIL.larguraMax };
};

const geometria = (funil: Funil, unidade: number, valores: number[], finais: number[], forma: { centro: number; boca: number }): Geometria => {
  const n = funil.etapas.length;
  const expoente = expoenteDe(valores, forma.boca);
  const largura0 = valores.map((v) => larguraPara(v, valores[0], expoente, forma.boca));
  const larguraMax = finais.map((v) => larguraPara(v, valores[0], expoente, forma.boca));
  // a primeira etapa ganha a altura que precisa para os seus pontos; as outras dividem o resto
  const total = FUNIL.base - FUNIL.boca;
  const geoTeste = (passo: number, h0: number): Geometria => {
    const outras = n > 1 ? (total - h0) / (n - 1) : 0;
    const y = [FUNIL.boca];
    for (let k = 0; k < n; k++) y.push(y[k] + (k === 0 ? (n === 1 ? total : h0) : outras));
    return { n, unidade, centro: forma.centro, bocaMax: forma.boca, y, largura0, larguraMax, passo, ponto: Math.round(passo * 0.75) };
  };
  const pontos0 = Math.ceil(Math.max(...[valores[0], finais[0]]) / unidade - 1e-9);
  // (no quadro deitado a altura é curta: a primeira etapa começa em 160 e as outras têm ETAPA_MIN)
  const h0Max = Math.max(150, Math.min(400, total - ETAPA_MIN * (n - 1)));
  for (const passo of [40, 36, 32, 28]) {
    for (let h0 = 160; h0 <= h0Max; h0 += 10) {
      const g = geoTeste(passo, h0);
      if (cabe(g, 0, pontos0)) return g;
    }
  }
  return geoTeste(28, h0Max);
};

// ——— onde fica cada ponto ———

// largura do funil (parede a parede) na altura y, com as larguras dadas
export const larguraNaAltura = (geo: Geometria, larguras: number[], y: number) => {
  const { n } = geo;
  if (y <= geo.y[0]) return larguras[0];
  for (let k = 0; k < n; k++) {
    if (y <= geo.y[k + 1]) {
      const topo = larguras[k];
      const fundo = k < n - 1 ? larguras[k + 1] : larguras[k];
      return mistura(topo, fundo, (y - geo.y[k]) / (geo.y[k + 1] - geo.y[k]));
    }
  }
  return larguras[n - 1];
};

// fileiras de pontos de uma etapa, de baixo para cima (os pontos assentam no fundo, como areia)
const fileiras = (geo: Geometria, k: number, vagas: number) => {
  const lista: { y: number; cabe: number }[] = [];
  let resto = vagas;
  let y = geo.y[k + 1] - MARGEM - geo.passo / 2;
  while (resto > 0) {
    const largura = larguraNaAltura(geo, geo.largura0, y - geo.passo / 2) - 2 * MARGEM;
    const cabe = Math.max(1, Math.floor(largura / geo.passo));
    lista.push({ y, cabe: Math.min(cabe, resto) });
    resto -= cabe;
    y -= geo.passo;
  }
  return lista;
};

const cabe = (geo: Geometria, k: number, vagas: number) => {
  const f = fileiras(geo, k, vagas);
  return f.length === 0 || f[f.length - 1].y - geo.passo / 2 >= geo.y[k] + MARGEM / 2;
};

export const posicaoDaVaga = (geo: Geometria, k: number, vaga: number, vagas: number) => {
  const fs = fileiras(geo, k, Math.max(vagas, vaga + 1));
  let antes = 0;
  for (const f of fs) {
    if (vaga < antes + f.cabe) {
      const i = vaga - antes;
      return { x: geo.centro - (f.cabe * geo.passo) / 2 + (i + 0.5) * geo.passo, y: f.y };
    }
    antes += f.cabe;
  }
  return { x: geo.centro, y: geo.y[k + 1] - geo.passo };
};

// quantas vagas a etapa tem (para o arranjo) no instante t, e a troca de arranjo em andamento
export const arranjo = (h: Historia, k: number, t: number) => {
  const vagas = (q: number) => Math.ceil(q - 1e-9);
  if (k === 0) {
    const v = vagas(h.valores[0] / h.geo.unidade);
    return { vagas: v, antes: v, p: 1 };
  }
  const minhas = h.transferencias.filter((x) => x.para === k && x.inicio <= t);
  if (minhas.length === 0) return { vagas: 0, antes: 0, p: 1 };
  const ultima = minhas[minhas.length - 1];
  return { vagas: vagas(ultima.quantosDepois), antes: vagas(ultima.quantosAntes), p: prog(t, ultima.inicio, 0.5, troca) };
};

export const posicaoNoTempo = (h: Historia, k: number, vaga: number, t: number) => {
  const a = arranjo(h, k, t);
  const fim = posicaoDaVaga(h.geo, k, vaga, Math.max(a.vagas, vaga + 1));
  if (a.p >= 1 || vaga >= a.antes) return fim;
  const ini = posicaoDaVaga(h.geo, k, vaga, a.antes);
  return { x: mistura(ini.x, fim.x, a.p), y: mistura(ini.y, fim.y, a.p) };
};

// ——— o estado no instante t ———

// pedaços de uma vaga que já chegaram (na ordem) e os que já saíram
export const estadoDaVaga = (h: Historia, k: number, vaga: number, t: number) => {
  const chegou = h.chegadas[k].filter((p) => p.vaga === vaga && p.em <= t);
  const saiu = h.saidas[k].filter((p) => p.vaga === vaga && p.em <= t);
  return { chegou, saiu, cheio: Math.min(1, chegou.reduce((s, p) => s + p.quanto, 0)) };
};

export type Voo = { x: number; y: number; d: number; p: number; cor: Cor };

// pontos no ar (descendo de uma etapa para a outra) no instante t
export const voos = (h: Historia, t: number): Voo[] => {
  const lista: Voo[] = [];
  for (const x of h.transferencias) {
    const ini = x.inicio + PREPARO;
    if (t < ini || t > ini + 0.5 + x.dur) continue;
    for (const q of x.particulas) {
      const p = (t - ini - q.atraso) / x.dur;
      if (p <= 0 || p >= 1) continue;
      const a = posicaoNoTempo(h, x.para - 1, q.de, x.inicio);
      const b = posicaoDaVaga(h.geo, x.para, q.vaga, Math.ceil(x.quantosDepois - 1e-9));
      const e = queda(p);
      // passa pelo gargalo (perto do eixo, na divisa entre as etapas) e assenta no fundo da etapa
      const cx = h.geo.centro + (a.x - h.geo.centro) * 0.25;
      const cy = h.geo.y[x.para];
      const u = 1 - e;
      lista.push({
        x: u * u * a.x + 2 * u * e * cx + e * e * b.x,
        y: u * u * a.y + 2 * u * e * cy + e * e * b.y,
        d: h.geo.ponto * Math.sqrt(Math.min(1, q.quanto)),
        p,
        cor: q.cor,
      });
    }
  }
  return lista;
};

// valor do contador da etapa no instante t
export const valorNoTempo = (h: Historia, k: number, t: number) => {
  const e = h.funil.etapas[k];
  if (k === 0) return h.valores[0] * prog(t, e.em, 0.9, apuracao);
  // os valores só crescem: vale o maior entre as descidas que já começaram
  let v = 0;
  for (const x of h.transferencias) {
    if (x.para !== k || t < x.inicio) continue;
    // o contador acompanha a fala: começa quando o número é dito e chega logo
    const dur = x.particulas.length <= 2 ? 0.35 : Math.min(0.8, x.dur);
    v = Math.max(v, mistura(x.valorAntes, x.valorDepois, prog(t, x.inicio + 0.02, dur, apuracao)));
  }
  return v;
};

// larguras do funil no instante t: começam pelos valores iniciais e alargam nos consertos
export const largurasNoTempo = (h: Historia, t: number) =>
  h.geo.largura0.map((l0, k) => Math.max(l0, Math.min(h.geo.larguraMax[k], larguraDoValor(h, valorNoTempo(h, k, t)))));

const larguraDoValor = (h: Historia, valor: number) => larguraPara(valor, h.valores[0], expoenteDe(h.valores, h.geo.bocaMax), h.geo.bocaMax);

export const etapaAtiva = (h: Historia, k: number, t: number) => t >= h.funil.etapas[k].em - 0.02;

// taxa do passo que leva à etapa k (em %), no instante t
export const taxaNoTempo = (h: Historia, k: number, t: number) => {
  const conserto = [...h.consertos].reverse().find((c) => c.etapa === k && t >= c.em);
  if (conserto) return mistura(conserto.taxaAntes, conserto.taxaDepois, prog(t, conserto.em + 0.1, 0.7, apuracao));
  return h.valores[k - 1] > 0 ? (h.valores[k] / h.valores[k - 1]) * 100 : 0;
};

// estado do passo: alerta (pisca) desde o alerta até o conserto; consertado depois
export const estadoDoPasso = (h: Historia, k: number, t: number) => {
  const alerta = h.alertas.find((a) => a.etapa === k && t >= a.em);
  const conserto = h.consertos.find((c) => c.etapa === k && t >= c.em);
  return {
    alerta: alerta && !conserto ? alerta.em : undefined,
    consertado: conserto ? conserto.em : undefined,
  };
};

// ——— vários funis no mesmo vídeo: cada `conserto` vale para o último `funil` antes dele ———

export const historias = (momentos: Momento[]) => {
  const ordem = [...momentos].sort((a, b) => a.de - b.de);
  const lista: { historia: Historia; momentos: Momento[] }[] = [];
  let atual: { funil: Funil; consertos: Conserto[]; momentos: Momento[] } | null = null;
  const fechar = () => {
    if (atual) lista.push({ historia: montarHistoria(atual.funil, atual.consertos), momentos: atual.momentos });
  };
  for (const m of ordem) {
    if (m.tipo === "funil") {
      fechar();
      atual = { funil: m, consertos: [], momentos: [m] };
    } else if (m.tipo === "conserto" && atual) {
      atual.consertos.push(m);
      atual.momentos.push(m);
    }
  }
  fechar();
  return lista;
};

// a nota ao lado da etiqueta: "● = 10 pessoas" (cada ponto vale um número redondo) ou, sem números,
// "● = agitação" (o que o ponto representa). Vazia quando não há o que dizer.
export const notaDaUnidade = (h: Historia) => {
  const nome = h.funil.unidade?.trim();
  if (h.qualitativo) return nome ? nome : "";
  if (h.geo.unidade > 1) return `${formatar(h.geo.unidade)} ${nome || "pessoas"}`;
  return nome && nome !== "pessoas" ? `1 ${singular(nome)}` : "";
};
const singular = (nome: string) => (nome.endsWith("ões") ? `${nome.slice(0, -3)}ão` : nome.endsWith("s") ? nome.slice(0, -1) : nome);

export { PREPARO };
