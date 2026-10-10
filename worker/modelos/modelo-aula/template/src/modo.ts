// A mesa de corte da Aula: em que modo o vídeo está em cada instante e onde fica a caixa da pessoa.
// - MODO PROFESSOR (quadro cheio): sem momento nenhum, ou num bloco de professor (capitulo,
//   abertura, destaque, frase, cta). Cortes seguidos no modo professor alternam a câmera (aberto
//   1,0 ↔ fechado 1,12); a volta do slide é sempre no aberto (o lugar dos cartões não muda). Cada
//   tomada aproxima devagar (até ~3%).
// - MODO SLIDE: num bloco de slide (slide, topicos, passos, numero, comparacao, grafico,
//   definicao, pergunta). O professor vai direto para a janela ao lado (troca seca, como um corte):
//   a janela nunca passa por cima do texto do slide. O conteúdo do slide entra no lugar (aparece e
//   sobe 12 px em 0,22 s).
// - Um bloco de professor dentro de um slide é a "virada": o professor volta seco para o quadro
//   cheio; depois o slide continua de onde estava.
// - Slides seguidos: o conteúdo de um sai (some e sobe em 0,16 s) e o do outro entra no lugar
//   (0,22 s), sem nunca os dois ao mesmo tempo.
// - Cauda (`plano.cauda`): no fim, o professor sai da janela e o último slide (o resumo) vai para o
//   centro da tela, legível até o fim.
import { CHEIO_16x9, caixaNoTempo, type Caixa, type EstadoDaCaixa } from "./motor/caixa";
import { doProfessor, type Momento, type Plano } from "./plano";
import { ABERTO, FECHADO, caixaCheia, caixaJanela } from "./tema";

export const DUR_ENTRA = 0.22;
export const DUR_SAI = 0.16;

export type Trecho = { de: number; ate: number; modo: "professor" | "slide"; pagina: Momento | null; zoom: number };

const guardados = new WeakMap<object, Trecho[]>();

// o bloco de slide ativo em t (o que começou por último)
const slideEm = (plano: Plano, t: number) => {
  let achado: Momento | null = null;
  for (const m of plano.momentos) if (!doProfessor(m) && t >= m.de && t < m.ate && (!achado || m.de >= achado.de)) achado = m;
  return achado;
};
const professorEm = (plano: Plano, t: number) => plano.momentos.some((m) => doProfessor(m) && t >= m.de && t < m.ate);

export const trechos = (plano: Plano): Trecho[] => {
  const salvo = guardados.get(plano);
  if (salvo) return salvo;
  const dur = plano.duracao;
  const cortes = plano.cortesEm ?? [];
  const pontos = [0, ...cortes, ...plano.momentos.flatMap((m) => [m.de, m.ate])]
    .filter((t) => t >= 0 && t < dur - 0.05)
    .sort((a, b) => a - b)
    .filter((t, i, l) => i === 0 || t - l[i - 1] > 0.02);
  const ehCorte = (t: number) => cortes.some((c) => Math.abs(c - t) < 0.12);
  const lista: Trecho[] = [];
  pontos.forEach((de, i) => {
    const ate = pontos[i + 1] ?? dur;
    const meio = (de + ate) / 2;
    const pagina = slideEm(plano, meio);
    const modo: Trecho["modo"] = !pagina || professorEm(plano, meio) ? "professor" : "slide";
    const anterior = lista[lista.length - 1];
    if (modo === "professor") {
      // tomada nova: no começo, na volta do slide (aberto) ou num corte (alterna)
      if (anterior && anterior.modo === "professor" && !ehCorte(de)) {
        anterior.ate = ate;
        return;
      }
      const zoom = anterior && anterior.modo === "professor" ? (Math.abs(anterior.zoom - ABERTO) < 0.01 ? FECHADO : ABERTO) : ABERTO;
      lista.push({ de, ate, modo, pagina, zoom });
      return;
    }
    if (anterior && anterior.modo === "slide" && anterior.pagina === pagina) {
      anterior.ate = ate;
      return;
    }
    lista.push({ de, ate, modo, pagina, zoom: ABERTO });
  });
  guardados.set(plano, lista);
  return lista;
};

export const trechoEm = (plano: Plano, t: number) => {
  const ts = trechos(plano);
  return ts.find((x) => t >= x.de && t < x.ate) ?? ts[ts.length - 1];
};

const estadosGuardados = new WeakMap<object, EstadoDaCaixa[]>();

// A caixa da pessoa no instante t (sem a aproximação lenta): toda troca é seca.
const caixaBase = (plano: Plano, t: number): Caixa => {
  let estados = estadosGuardados.get(plano);
  if (!estados) {
    const janela = caixaJanela(plano);
    estados = trechos(plano).map((x) => ({ de: Math.max(0, x.de - 0.001), dur: 0.001, caixa: x.modo === "slide" ? janela : caixaCheia(plano, x.zoom) }));
    estadosGuardados.set(plano, estados);
  }
  return caixaNoTempo(t, estados, CHEIO_16x9);
};

// Com a aproximação lenta nas tomadas do professor (até ~3%, só quando ele está em quadro cheio).
export const caixaDaPessoa = (plano: Plano, t: number): Caixa => {
  const c = caixaBase(plano, t);
  const x = trechoEm(plano, t);
  if (x.modo !== "professor") return c;
  const d = x.ate - x.de;
  const p = Math.min(1, Math.max(0, (t - x.de) / Math.max(0.01, d)));
  const quanto = Math.min(0.03, 0.012 * d);
  return { ...c, zoom: (c.zoom ?? 1) * (1 + quanto * (0.5 - Math.cos(Math.PI * p) / 2)) };
};

// 0 = a pessoa em quadro cheio, 1 = na janela (para a moldura da janela)
export const nivelDaJanela = (plano: Plano, c: Caixa) => {
  const j = caixaJanela(plano);
  return Math.min(1, Math.max(0, (CHEIO_16x9.w - c.w) / (CHEIO_16x9.w - j.w)));
};

// O cartão do professor entra no começo do trecho dele (a troca é seca: nunca por cima do slide).
export const fimDaTroca = (plano: Plano, t: number) => trechoEm(plano, t).de;

// `t` é um corte (do motor, de modo, o começo ou o fim)? Ali o cartão do professor aparece e some
// seco, junto com o corte (nada de cartão meio transparente por cima do vídeo).
export const trocaSeca = (plano: Plano, t: number) => {
  if (t <= 0.001 || t >= plano.duracao - 0.05) return true;
  if ((plano.cortesEm ?? []).some((c) => Math.abs(c - t) < 0.12)) return true;
  return trechoEm(plano, Math.max(0, t - 0.02)).modo !== trechoEm(plano, t + 0.02).modo;
};

// As páginas visíveis em t, com a opacidade e a subida do conteúdo: a página entra no lugar
// (0,22 s) e, quando outra página vem logo depois, sai antes dela (0,16 s). Nunca duas ao mesmo tempo.
export const paginasEm = (plano: Plano, t: number): { m: Momento; opacidade: number; dy: number }[] => {
  const ts = trechos(plano);
  const saida: { m: Momento; opacidade: number; dy: number }[] = [];
  ts.forEach((x, i) => {
    if (x.modo !== "slide" || !x.pagina || t < x.de || t >= x.ate) return;
    const depois = ts[i + 1];
    const entra = Math.min(1, Math.max(0, (t - x.de) / DUR_ENTRA));
    const e = 1 - Math.pow(1 - entra, 3);
    const outra = depois && depois.modo === "slide" && depois.pagina !== x.pagina;
    const sai = outra ? Math.min(1, Math.max(0, (t - (x.ate - DUR_SAI)) / DUR_SAI)) : 0;
    saida.push({ m: x.pagina, opacidade: e * (1 - sai), dy: (1 - e) * 12 - sai * 8 });
  });
  return saida;
};
