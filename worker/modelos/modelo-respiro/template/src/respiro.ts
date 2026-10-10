// O ar ao longo do vídeo: quanto a forma está cheia (0 = vazia, 1 = cheia), as marcas da contagem
// e onde está o ponto no mapa do respiro. Tudo vem das `fase` do plano.
import { ar, limitar, mistura, prog } from "./anim";
import type { Abertura, Ciclos, Destaque, Fase, Momento, Numero, Plano } from "./plano";

export const ehFase = (m: Momento): m is Fase => m.tipo === "fase";
export const ehCiclos = (m: Momento): m is Ciclos => m.tipo === "ciclos";
export const ehNumero = (m: Momento): m is Numero => m.tipo === "numero";
export const ehDestaque = (m: Momento): m is Destaque => m.tipo === "destaque";

// ---------- valores padrão (campos opcionais do plano) ----------

// "enche", "fica" e "esvazia" são sinônimos de "inspira", "segura" e "solta"
const SINONIMO = { inspira: "inspira", enche: "inspira", segura: "segura", fica: "segura", solta: "solta", esvazia: "solta" } as const;
export const faseDe = (m: Fase) => SINONIMO[m.fase] ?? "inspira";

// quantas marcas o anel tem: uma por palavra marcada, ou uma por número contado, ou nenhuma (traço contínuo)
export const nMarcas = (m: Fase) => (m.marcas?.length ? m.marcas.length : m.contagem ? Math.max(1, Math.round(m.contagem)) : 0);
// começo e fim do trecho que enche/esvazia
export const contaEmDe = (m: Fase) => m.contaEm ?? m.marcas?.[0]?.em ?? Math.min(m.de + 0.4, m.ate - 0.9);
export const chegaEmDe = (m: Fase) => m.chegaEm ?? m.marcas?.[m.marcas.length - 1]?.em ?? Math.max(contaEmDe(m) + 0.7, m.ate - 0.55);

// Marcas do anel: nas palavras marcadas, ou espaçadas por igual (a última cai no número dito)
export const marcasDaFase = (m: Fase): number[] => {
  if (m.marcas?.length) return m.marcas.map((x) => x.em);
  const n = nMarcas(m);
  if (n === 0) return [];
  const conta = contaEmDe(m);
  const chega = chegaEmDe(m);
  if (n === 1) return [chega];
  const passo = (chega - conta) / (n - 1);
  return Array.from({ length: n }, (_, i) => conta + passo * i);
};

// repetição: quantas formas, quando se dividem
export const vezesDe = (m: Ciclos) => Math.max(2, Math.min(6, Math.round(m.itens?.length ?? m.vezes ?? 3)));
export const divideEmDe = (m: Ciclos) => m.divideEm ?? (m.itens?.length ? Math.max(m.de + 0.3, m.itens[0].em - 0.6) : m.de + 0.45);

// Quanto da fase já passou (0–1): a forma acompanha a contagem e termina de encher/esvaziar
// um instante depois do número dito.
export const andamentoDaFase = (m: Fase, t: number) => ar((t - contaEmDe(m)) / Math.max(0.6, chegaEmDe(m) + 0.45 - contaEmDe(m)));

// `anterior` = a fase logo antes, no mesmo bloco: "segura" depois de "solta" segura VAZIO
// (a pausa com o peito vazio da respiração quadrada); nos outros casos, segura cheio.
const arDaFase = (m: Fase, t: number, anterior?: Fase | Ciclos) => {
  const p = andamentoDaFase(m, t);
  if (faseDe(m) === "inspira") return p;
  if (faseDe(m) === "solta") return 1 - p;
  return anterior && ehFase(anterior) && faseDe(anterior) === "solta" ? 0 : 1;
};

// Respiração "de repouso" fora das fases: lenta (5 s por ciclo), só para nada ficar parado
export const arDeRepouso = (t: number) => 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 5 - Math.PI / 2);

// Blocos de fases coladas (a forma passa de uma para a outra sem voltar ao repouso).
// A repetição (ciclos) logo depois conta como "vazia": a forma grande espera pequena.
// Também respiram: o número que conta (a forma enche com ele) e o destaque no centro da forma
export type ComAr = Fase | Ciclos | Numero | Destaque;
export const ehComAr = (m: Momento): m is ComAr => ehFase(m) || ehCiclos(m) || ehNumero(m) || ehDestaque(m);
const blocos = (fases: ComAr[]) => {
  const lista: { de: number; ate: number; fases: ComAr[] }[] = [];
  for (const f of fases) {
    const ultimo = lista[lista.length - 1];
    if (ultimo && f.de - ultimo.ate < 0.4) {
      ultimo.ate = f.ate;
      ultimo.fases.push(f);
    } else lista.push({ de: f.de, ate: f.ate, fases: [f] });
  }
  return lista;
};

export const arNoTempo = (t: number, plano: Plano) => {
  const fases = plano.momentos.filter(ehComAr).sort((a, b) => a.de - b.de);
  const repouso = arDeRepouso(t);
  for (const b of blocos(fases)) {
    const peso = Math.min(prog(t, b.de - 0.2, 0.9, ar), 1 - prog(t, b.ate + 0.2, 0.9, ar));
    if (peso <= 0) continue;
    const atual = [...b.fases].reverse().find((f) => f.de <= t) ?? b.fases[0];
    const anterior = b.fases[b.fases.indexOf(atual) - 1];
    const valor = ehFase(atual)
      ? arDaFase(atual, Math.min(t, b.ate + 0.2), anterior && (ehFase(anterior) || ehCiclos(anterior)) ? anterior : undefined)
      : ehNumero(atual)
        ? prog(t, atual.em, duracaoDaContagem(atual), ar)
        : ehDestaque(atual)
          ? atual.nivel === "alerta"
            ? 1 - 0.85 * prog(t, atual.em, 1.1, ar)
            : prog(t, atual.em, 1.1, ar)
          : 0;
    return mistura(repouso, valor, peso);
  }
  return repouso;
};

// quanto dura a contagem de um número (e a forma enchendo junto)
export const duracaoDaContagem = (m: Numero) => Math.max(0.8, Math.min(2.0, m.ate - m.em - 0.5));

// ---------- mapa do respiro ----------
// O mapa só existe quando a fala conta (`contagem` nas fases): respirar 4-7-8, "3 passos de 10 s"…

export type Etapa = { n: number; forma: "sobe" | "plano" | "desce"; nome?: string };
const FORMA = { inspira: "sobe", segura: "plano", solta: "desce" } as const;

export const fasesDoMapa = (plano: Plano) => plano.momentos.filter((m): m is Fase => ehFase(m) && !!m.contagem).sort((a, b) => a.de - b.de);

export const etapasDoPlano = (plano: Plano): Etapa[] =>
  fasesDoMapa(plano).map((f) => ({
    n: Math.max(1, Math.round(f.contagem as number)),
    forma: FORMA[faseDe(f)],
    // a nota curta vira o nome da etapa no mapa grande; nota longa cai no nome padrão
    nome: f.nota.length <= 12 && !f.nota.includes(" ") ? f.nota : undefined,
  }));

// Onde cada etapa começa e termina no mapa (0–1, proporcional à contagem)
export const faixasDasEtapas = (etapas: Etapa[]) => {
  const total = etapas.reduce((s, e) => s + e.n, 0) || 1;
  let acc = 0;
  return etapas.map((e) => {
    const de = acc / total;
    acc += e.n;
    return { de, ate: acc / total };
  });
};

// Estado do mapa no instante t: quanto de tinta cada etapa tem, qual está em curso e onde está o ponto
export const mapaNoTempo = (t: number, plano: Plano) => {
  const fases = fasesDoMapa(plano);
  const etapas = etapasDoPlano(plano);
  const faixas = faixasDasEtapas(etapas);
  const abertura = plano.momentos.find((m): m is Abertura => m.tipo === "abertura" && !!m.mapaEm?.length);
  const ciclos = plano.momentos.find(ehCiclos);

  // tinta de cada etapa: na abertura, quando o número é dito; senão, quando a fase começa
  const tinta = etapas.map((_, i) => {
    const em = abertura?.mapaEm?.[i] ?? (fases[i] ? contaEmDe(fases[i]) : Infinity);
    return prog(t, em, 0.55);
  });

  // ponto: anda junto com a tinta na abertura, depois acompanha cada fase
  let ponto = 0;
  abertura?.mapaEm?.forEach((em, i) => {
    if (faixas[i]) ponto = mistura(ponto, faixas[i].ate, prog(t, em, 0.55));
  });
  let ativa = -1;
  // quando o ponto precisa pular (do fim do mapa para o começo de uma etapa), ele some e reaparece
  let opacidadePonto = 1;
  fases.forEach((f, i) => {
    const desde = Math.min(contaEmDe(f) - 0.4, f.de + 0.6);
    const pulo = Math.abs(ponto - faixas[i].de) > 0.02;
    if (pulo) opacidadePonto = Math.min(opacidadePonto, Math.abs((t - desde) / 0.25) >= 1 ? 1 : Math.abs((t - desde) / 0.25));
    if (t >= desde) {
      const p = andamentoDaFase(f, t);
      ponto = mistura(faixas[i].de, faixas[i].ate, p);
      if (t < f.ate) ativa = i;
    }
  });
  // fechamento: o mapa volta pequeno, como assinatura, e o ponto faz uma última respiração devagar
  const cta = plano.momentos.find((m) => m.tipo === "cta");
  if (cta && t >= cta.de) {
    ativa = -1;
    ponto = prog(t, cta.de + 0.4, Math.max(0.8, plano.duracao - cta.de - 0.7), ar);
    return { etapas, faixas, tinta, ponto: limitar(ponto), ativa, opacidadePonto: 1 };
  }
  // repetição: o ponto volta ao começo e percorre o mapa inteiro de novo
  if (ciclos) {
    const { inicio, fim } = ritmoDosCiclos(ciclos);
    opacidadePonto = Math.min(opacidadePonto, limitar(Math.abs(t - (inicio - 0.3)) / 0.25));
    if (t >= inicio - 0.3) ponto = mistura(0, 1, prog(t, inicio, fim - inicio, (x) => x));
  }
  return { etapas, faixas, tinta, ponto: limitar(ponto), ativa, opacidadePonto };
};

// Quando cada forma menor respira, na repetição
// (uma depois da outra, como uma onda que dá a volta; cada uma leva `dur` para encher e esvaziar).
// Com `itens`, cada forma respira quando o seu item é dito.
export const ritmoDosCiclos = (m: Ciclos) => {
  const n = vezesDe(m);
  const divide = divideEmDe(m);
  if (m.itens?.length) {
    const inicios = m.itens.slice(0, n).map((it) => it.em - 0.05);
    const dur = 1.5;
    return { inicio: inicios[0], fim: inicios[inicios.length - 1] + dur, passo: dur / 2, dur, inicios };
  }
  const inicio = divide + 0.35;
  // a última termina antes de as formas começarem a se juntar de volta (0,62 s antes do fim)
  const passo = Math.max(0.12, (m.ate - 0.62 - inicio) / (n + 1));
  return { inicio, fim: inicio + passo * n, passo, dur: 2 * passo, inicios: Array.from({ length: n }, (_, i) => inicio + i * passo) };
};

// Visível de quando o mapa aparece (a lápis, já no começo da abertura) até o fim da última
// fase/repetição — e de novo no fechamento, pequeno, como assinatura do respiro
export const visibilidadeDoMapa = (t: number, plano: Plano, fimDe: (m: Momento) => number) => {
  const ligados = plano.momentos.filter((m) => (ehFase(m) && !!m.contagem) || ehCiclos(m) || (m.tipo === "abertura" && !!m.mapaEm?.length));
  if (!ligados.length || !fasesDoMapa(plano).length) return 0;
  const de = Math.min(...ligados.map((m) => (m.tipo === "abertura" ? m.de + 0.3 : m.de + 0.4)));
  const ate = Math.max(...ligados.map((m) => fimDe(m)));
  const principal = Math.min(prog(t, de, 0.5), 1 - prog(t, ate - 0.45, 0.45));
  const cta = plano.momentos.find((m) => m.tipo === "cta");
  const assinatura = cta && cta.de >= ate - 0.2 ? 0.9 * prog(t, cta.de + 0.2, 0.7) : 0;
  return Math.max(principal, assinatura);
};
