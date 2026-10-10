// A gramática do Mosaico: a tela é uma grade de blocos que se remonta a cada momento.
// A pessoa é um dos blocos ("p"). Blocos com o mesmo `id` em momentos seguidos continuam
// (andam e mudam de tamanho); os outros saem pela borda enquanto os novos entram.
import { interpolate } from "remotion";
import { prog, remonta } from "./anim";
import type { Bloco, BlocoCompleto, Plano } from "./plano";

// Uma página do mosaico (o momento depois de resolvido por src/paginas.ts): a grade e os ladrilhos.
export type Pagina = {
  de: number;
  ate: number;
  legenda?: boolean;
  grade: string | string[];
  linhas?: number[];
  colunas?: number[];
  espelhar?: boolean;
  blocos: Bloco[];
};
type Momento = Pagina;
import { BASE_GRADE, MARGEM, RAIO, REJUNTE, REMONTA } from "./tema";

export type Ret = { x: number; y: number; w: number; h: number };

export const LARGURA = 1080;
export const ALTURA = 1920;
export const CHEIO: Ret = { x: 0, y: 0, w: LARGURA, h: ALTURA };

// Arranjos prontos. Cada string é uma linha da grade; cada letra, um bloco; "p" é a pessoa.
// Os pesos dizem a altura de cada linha e a largura de cada coluna (proporcionais).
export const ARRANJOS: Record<string, { grade: string[]; linhas?: number[]; colunas?: number[] }> = {
  // abertura: título largo em cima; dois blocos empilhados à esquerda; a pessoa grande à direita
  capa: { grade: ["tt", "ap", "bp"], linhas: [470, 540, 592], colunas: [400, 616] },
  // um bloco ocupa a metade de cima; embaixo, um bloco e a pessoa
  metade: { grade: ["aa", "bp"], linhas: [1, 1], colunas: [1, 1] },
  // dois blocos e a pessoa numa faixa em cima; um bloco grande embaixo
  L: { grade: ["ap", "bb"], linhas: [640, 1200], colunas: [1, 1] },
  // um bloco grande em cima; embaixo, a pessoa e um bloco
  destaque: { grade: ["aa", "pb"], linhas: [1.05, 1], colunas: [1, 1] },
  // o bloco principal ocupa dois terços; a pessoa e um bloco pequeno dividem o terço de baixo
  palco: { grade: ["aa", "aa", "bp"], linhas: [1, 1, 1.05], colunas: [1, 1] },
  // 2 × 2: três blocos e a pessoa
  quartos: { grade: ["ab", "cp"], linhas: [1, 1], colunas: [1, 1] },
  // três faixas: bloco, pessoa, bloco
  faixas: { grade: ["a", "p", "b"], linhas: [0.8, 1.25, 1] },
  // a pessoa grande em cima; dois blocos embaixo (bom para o fechamento)
  retrato: { grade: ["pp", "ab"], linhas: [1.55, 1], colunas: [1.05, 1] },
  // o bloco em cima, a pessoa larga embaixo (ou o contrário)
  pilha: { grade: ["a", "p"], linhas: [1.08, 1] },
  base: { grade: ["p", "a"], linhas: [1, 1.1] },
};

export type GradeResolvida = { grade: string[]; linhas: number[]; colunas: number[] };

export const resolverGrade = (m: Momento): GradeResolvida => {
  const pronto = typeof m.grade === "string" ? ARRANJOS[m.grade] : null;
  if (typeof m.grade === "string" && !pronto) throw new Error(`Arranjo desconhecido: "${m.grade}". Use um de: ${Object.keys(ARRANJOS).join(", ")}, ou escreva a grade.`);
  let grade = pronto ? pronto.grade : (m.grade as string[]);
  const nl = grade.length;
  const nc = grade[0]?.length ?? 0;
  if (!nl || !nc || grade.some((l) => l.length !== nc)) throw new Error(`Grade inválida no momento de ${m.de}s: todas as linhas precisam ter o mesmo número de letras.`);
  let linhas = m.linhas ?? pronto?.linhas ?? Array(nl).fill(1);
  let colunas = m.colunas ?? pronto?.colunas ?? Array(nc).fill(1);
  if (linhas.length !== nl || colunas.length !== nc) throw new Error(`Momento de ${m.de}s: "linhas" precisa ter ${nl} pesos e "colunas" ${nc}.`);
  if (m.espelhar) {
    grade = grade.map((l) => [...l].reverse().join(""));
    colunas = [...colunas].reverse();
  }
  return { grade, linhas, colunas };
};

// Retângulo (px) de cada letra da grade
export const retangulos = (g: GradeResolvida): Record<string, Ret> => {
  const nl = g.grade.length;
  const nc = g.grade[0].length;
  const altUtil = BASE_GRADE - MARGEM - (nl - 1) * REJUNTE;
  const largUtil = LARGURA - 2 * MARGEM - (nc - 1) * REJUNTE;
  const somaL = g.linhas.reduce((a, b) => a + b, 0);
  const somaC = g.colunas.reduce((a, b) => a + b, 0);
  const alturas = g.linhas.map((v) => (v / somaL) * altUtil);
  const larguras = g.colunas.map((v) => (v / somaC) * largUtil);
  const y0 = alturas.map((_, i) => MARGEM + alturas.slice(0, i).reduce((a, b) => a + b, 0) + i * REJUNTE);
  const x0 = larguras.map((_, i) => MARGEM + larguras.slice(0, i).reduce((a, b) => a + b, 0) + i * REJUNTE);
  const saida: Record<string, Ret> = {};
  const letras = new Set(g.grade.join("").split(""));
  for (const letra of letras) {
    if (letra === "." || letra === " ") continue;
    let l1 = nl, l2 = -1, c1 = nc, c2 = -1;
    g.grade.forEach((linha, i) =>
      [...linha].forEach((ch, j) => {
        if (ch !== letra) return;
        l1 = Math.min(l1, i); l2 = Math.max(l2, i); c1 = Math.min(c1, j); c2 = Math.max(c2, j);
      }),
    );
    for (let i = l1; i <= l2; i++)
      for (let j = c1; j <= c2; j++)
        if (g.grade[i][j] !== letra) throw new Error(`Na grade ${JSON.stringify(g.grade)}, a letra "${letra}" não forma um retângulo.`);
    saida[letra] = {
      x: x0[c1],
      y: y0[l1],
      w: x0[c2] + larguras[c2] - x0[c1],
      h: y0[l2] + alturas[l2] - y0[l1],
    };
  }
  return saida;
};

// ---------- a linha do tempo dos blocos ----------

export type Fronteiras = { inicio: number[]; fim: number[]; colado: boolean[] };

// Início de cada momento (encostado no corte mais próximo: a remontagem esconde o pulo do corte)
// e se o momento seguinte vem colado (troca direta de arranjo) ou se há um respiro em tela cheia.
export const fronteiras = (plano: Plano, momentos: Momento[]): Fronteiras => {
  const cortes = plano.cortesEm ?? [];
  const inicio = momentos.map((m) => {
    if (m.de <= 0.02) return m.de;
    const perto = cortes.find((c) => c - m.de > -0.2 && c - m.de < 0.12);
    return perto ?? m.de;
  });
  const colado = momentos.map((m, i) => i < momentos.length - 1 && inicio[i + 1] - m.ate < 0.3);
  const fim = momentos.map((m, i) => {
    if (colado[i]) return inicio[i + 1];
    // o último momento que termina colado no fim do vídeo fica até o último quadro
    if (i === momentos.length - 1 && m.ate >= plano.duracao - 0.3) return plano.duracao + 1;
    return Math.min(m.ate, momentos[i + 1]?.de ?? Infinity);
  });
  return { inicio, fim, colado };
};

export const conteudoIgual = (a: BlocoCompleto, b: BlocoCompleto) => {
  const limpar = (x: BlocoCompleto) => JSON.stringify({ ...x, area: undefined, cor: undefined });
  return limpar(a) === limpar(b);
};

export const corPadrao: Record<BlocoCompleto["tipo"], NonNullable<BlocoCompleto["cor"]>> = {
  abertura: "folha",
  titulo: "folha",
  topicos: "creme",
  passos: "creme",
  lista: "creme",
  numero: "gema",
  comparacao: "pagina",
  grafico: "creme",
  destaque: "gema",
  definicao: "pagina",
  frase: "tinta",
  pergunta: "folha",
  cta: "gema",
  partes: "creme",
  prato: "creme",
  grupo: "folha",
  selo: "creme",
  marca: "creme",
};

// Resolve os blocos "continua" (só id + area) com o conteúdo do mesmo id no momento anterior.
export const resolverBlocos = (momentos: Momento[]): BlocoCompleto[][] => {
  const ultimo = new Map<string, BlocoCompleto>();
  return momentos.map((m) =>
    m.blocos.map((b: Bloco) => {
      let completo: BlocoCompleto;
      if (!b.tipo) {
        const antes = ultimo.get(b.id);
        if (!antes) throw new Error(`O bloco "${b.id}" (momento de ${m.de}s) continua um bloco que não existe antes.`);
        completo = { ...antes, area: b.area, ...(b.cor ? { cor: b.cor } : {}) } as BlocoCompleto;
      } else completo = b as BlocoCompleto;
      completo = { ...completo, cor: completo.cor ?? corPadrao[completo.tipo] } as BlocoCompleto;
      if (completo.id) ultimo.set(completo.id, completo);
      return completo;
    }),
  );
};

// Um bloco colapsado na borda de onde ele nasce: blocos largos crescem da borda de cima ou de baixo
// da tela, blocos altos da borda lateral; um bloco do meio abre do próprio centro.
const colapsado = (r: Ret): Ret => {
  const cima = r.y <= MARGEM + 1;
  const baixo = r.y + r.h >= BASE_GRADE - 1;
  const esq = r.x <= MARGEM + 1;
  const dir = r.x + r.w >= LARGURA - MARGEM - 1;
  const largo = r.w >= r.h * 0.9;
  if (largo && cima && !baixo) return { x: r.x, y: r.y, w: r.w, h: 0 };
  if (largo && baixo && !cima) return { x: r.x, y: r.y + r.h, w: r.w, h: 0 };
  if (esq && !dir) return { x: r.x, y: r.y, w: 0, h: r.h };
  if (dir && !esq) return { x: r.x + r.w, y: r.y, w: 0, h: r.h };
  if (cima) return { x: r.x, y: r.y, w: r.w, h: 0 };
  if (baixo) return { x: r.x, y: r.y + r.h, w: r.w, h: 0 };
  return { x: r.x + r.w / 2, y: r.y + r.h / 2, w: 0, h: 0 };
};

export const misturaRet = (a: Ret, b: Ret, p: number): Ret => ({
  x: a.x + (b.x - a.x) * p,
  y: a.y + (b.y - a.y) * p,
  w: a.w + (b.w - a.w) * p,
  h: a.h + (b.h - a.h) * p,
});

// Um bloco que muda de lugar se estica: a borda da frente sai primeiro e a de trás vem depois,
// como uma peça que desliza puxada pela ponta. Assim o espaço entre os blocos nunca abre um buraco.
// Na diagonal, a troca vai em duas etapas curtas — primeiro na horizontal, depois na vertical — e o
// atraso da borda de trás diminui até o bloco nunca passar de 45% da tela (ou do tamanho que ele já
// tem) no meio da troca.
const TETO_DA_TROCA = 0.45 * 1080 * 1920;
const suaviza = (u: number) => remonta(Math.min(1, Math.max(0, u)));
// um bloco anda na diagonal quando o centro muda bastante nos dois eixos
export const naDiagonal = (a: Ret, b: Ret) => {
  const dx = b.x + b.w / 2 - (a.x + a.w / 2);
  const dy = b.y + b.h / 2 - (a.y + a.h / 2);
  return Math.abs(dx) > 60 && Math.abs(dy) > 60;
};
// tempo de cada eixo (0 a 1): numa troca em duas etapas, horizontal na primeira parte e vertical na segunda
const tempos = (u: number, etapas: boolean) => (etapas ? { ux: u / 0.58, uy: (u - 0.42) / 0.58 } : { ux: u, uy: u });
const esticado = (a: Ret, b: Ret, u: number, atraso: number, etapas: boolean): Ret => {
  const { ux, uy } = tempos(u, etapas);
  const eixo = (a0: number, a1: number, b0: number, b1: number, v: number) => {
    const frente = suaviza(v / (1 - atraso));
    const tras = suaviza((v - atraso) / (1 - atraso));
    const meio = suaviza(v);
    const d = (b0 + b1) / 2 - (a0 + a1) / 2;
    if (Math.abs(d) < 2) return [a0 + (b0 - a0) * meio, a1 + (b1 - a1) * meio];
    // indo para a frente (direita/baixo): a borda final lidera; para trás, a inicial
    return d > 0 ? [a0 + (b0 - a0) * tras, a1 + (b1 - a1) * frente] : [a0 + (b0 - a0) * frente, a1 + (b1 - a1) * tras];
  };
  const [x0, x1] = eixo(a.x, a.x + a.w, b.x, b.x + b.w, ux);
  const [y0, y1] = eixo(a.y, a.y + a.h, b.y, b.y + b.h, uy);
  return { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
};
const atrasoDaTroca = (a: Ret, b: Ret, etapas: boolean) => {
  const teto = Math.max(TETO_DA_TROCA, a.w * a.h, b.w * b.h);
  for (const atraso of [0.28, 0.22, 0.16, 0.1, 0.05]) {
    let pico = 0;
    for (let k = 1; k < 24; k++) {
      const r = esticado(a, b, k / 24, atraso, etapas);
      pico = Math.max(pico, r.w * r.h);
    }
    if (pico <= teto) return atraso;
  }
  return 0;
};
// o fundo do bloco (esticado) e o conteúdo (sem esticão: fica sempre dentro do fundo)
export const deslizaRet = (a: Ret, b: Ret, u: number, etapas: boolean): Ret => esticado(a, b, u, atrasoDaTroca(a, b, etapas), etapas);
export const deslizaConteudo = (a: Ret, b: Ret, u: number, etapas: boolean): Ret => esticado(a, b, u, 0, etapas);

// Trocas em duas etapas: se algum bloco (ou a pessoa) anda na diagonal numa remontagem, todos os blocos
// daquela remontagem andam primeiro na horizontal e depois na vertical — ninguém corta caminho e a
// página não abre buraco.
// Um bloco que só cresce ou encolhe no lugar (o retângulo novo cobre boa parte do antigo) não anda na
// diagonal, mesmo que o centro mude nos dois eixos: ele não pede a troca em duas etapas.
const cresceNoLugar = (a: Ret, b: Ret) => {
  const sobra = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return sobra / Math.max(1, Math.min(a.w * a.h, b.w * b.h)) > 0.6;
};
export const etapasDasTrocas = (momentos: Momento[], pecas: { aparicoes: Aparicao[] }[], rets: Record<string, Ret>[]) =>
  momentos.map((_, i) => {
    if (i === 0) return false;
    if (rets[i - 1].p && rets[i].p && naDiagonal(rets[i - 1].p, rets[i].p)) return true;
    return pecas.some((p) => p.aparicoes.some((a, k) => k > 0 && a.i === i && naDiagonal(p.aparicoes[k - 1].ret, a.ret) && !cresceNoLugar(p.aparicoes[k - 1].ret, a.ret)));
  });

const fase = (t: number, de: number, dur: number) =>
  interpolate(t, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: remonta });

// O estado de uma peça num instante
export type EstadoPeca = {
  chave: string;
  // o retângulo visível (fundo e recorte)
  visivel: Ret;
  // onde o conteúdo é desenhado (na entrada e na saída, o conteúdo fica parado e é revelado pela borda)
  conteudo: Ret;
  raio: number;
  // cor de fundo antes e depois (misturadas por `pCor`)
  corAntes?: BlocoCompleto["cor"];
  corDepois?: BlocoCompleto["cor"];
  pCor: number;
  // de onde a cor nova entra (ela varre o bloco nessa direção)
  direcaoCor: "baixo" | "cima" | "direita" | "esquerda";
  // conteúdo que sai e que entra (troca por dentro, sem sumir o bloco)
  antes?: { bloco: BlocoCompleto; opacidade: number; janela: { de: number; ate: number } };
  depois?: { bloco: BlocoCompleto; opacidade: number; janela: { de: number; ate: number } };
  // 0 = entrando/saindo, 1 = assentado (ordem de desenho)
  firmeza: number;
};

type Aparicao = { i: number; ret: Ret; bloco: BlocoCompleto };

// Todas as peças (blocos) do vídeo, cada uma com as aparições em momentos seguidos.
export const pecasDoVideo = (momentos: Momento[], blocos: BlocoCompleto[][], f: Fronteiras) => {
  const retsPorMomento = momentos.map((m) => retangulos(resolverGrade(m)));
  const pecas: { chave: string; aparicoes: Aparicao[] }[] = [];
  const abertas = new Map<string, { chave: string; aparicoes: Aparicao[] }>();
  momentos.forEach((m, i) => {
    const rets = retsPorMomento[i];
    const vistas = new Set<string>();
    for (const letra of Object.keys(rets)) {
      if (letra !== "p" && !blocos[i].some((b) => b.area === letra))
        throw new Error(`Na grade do momento de ${m.de}s, a letra "${letra}" não tem bloco (buraco na tela). Ponha um bloco nela ou tire a letra da grade.`);
    }
    blocos[i].forEach((b, k) => {
      const ret = rets[b.area];
      if (!ret) throw new Error(`O bloco "${b.tipo}" (momento de ${m.de}s) está na área "${b.area}", que não existe na grade.`);
      if (b.area === "p") throw new Error(`A área "p" é da pessoa; escolha outra letra para o bloco "${b.tipo}" (momento de ${m.de}s).`);
      const id = b.id ?? `${i}:${k}`;
      vistas.add(id);
      const aberta = abertas.get(id);
      if (aberta && aberta.aparicoes[aberta.aparicoes.length - 1].i === i - 1 && f.colado[i - 1]) {
        aberta.aparicoes.push({ i, ret, bloco: b });
      } else {
        const nova = { chave: `${id}@${i}`, aparicoes: [{ i, ret, bloco: b }] };
        pecas.push(nova);
        abertas.set(id, nova);
      }
    });
    for (const id of [...abertas.keys()]) if (!vistas.has(id)) abertas.delete(id);
  });

  // Troca por dentro: numa remontagem, um bloco novo que ocupa boa parte do lugar de um bloco que sai
  // herda aquele bloco — o mesmo ladrilho anda, muda de cor e troca o conteúdo, em vez de um sumir
  // e outro nascer (a tela nunca fica com buraco no meio da troca).
  const area = (r: Ret) => Math.max(1, r.w * r.h);
  const sobra = (a: Ret, b: Ret) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  for (let i = 1; i < momentos.length; i++) {
    if (!f.colado[i - 1]) continue;
    const saem = pecas.filter((p) => p.aparicoes[p.aparicoes.length - 1].i === i - 1);
    const entram = pecas.filter((p) => p.aparicoes[0].i === i);
    const pares: { e: (typeof pecas)[number]; s: (typeof pecas)[number]; quanto: number }[] = [];
    for (const e of entram)
      for (const sa of saem) {
        const a = e.aparicoes[0].ret;
        const b = sa.aparicoes[sa.aparicoes.length - 1].ret;
        const quanto = sobra(a, b) / Math.min(area(a), area(b));
        if (quanto > 0.2) pares.push({ e, s: sa, quanto });
      }
    pares.sort((x, y) => y.quanto - x.quanto);
    const usados = new Set<object>();
    for (const { e, s: sa } of pares) {
      if (usados.has(e) || usados.has(sa)) continue;
      usados.add(e);
      usados.add(sa);
      e.aparicoes = [...sa.aparicoes, ...e.aparicoes];
      e.chave = sa.chave;
      pecas.splice(pecas.indexOf(sa), 1);
    }
  }
  return { pecas, retsPorMomento };
};

// Janela de tempo em que um mesmo conteúdo fica num bloco (para achar as palavras faladas)
const janelaDo = (ap: Aparicao[], k: number, f: Fronteiras, momentos: Momento[]) => {
  let a = k;
  let b = k;
  while (a > 0 && conteudoIgual(ap[a - 1].bloco, ap[k].bloco)) a--;
  while (b < ap.length - 1 && conteudoIgual(ap[b + 1].bloco, ap[k].bloco)) b++;
  return { de: momentos[ap[a].i].de, ate: momentos[ap[b].i].ate };
};

export const estadoDaPeca = (
  t: number,
  peca: { chave: string; aparicoes: Aparicao[] },
  f: Fronteiras,
  momentos: Momento[],
  etapas: boolean[],
): EstadoPeca | null => {
  const ap = peca.aparicoes;
  const D = REMONTA;
  const primeiro = ap[0];
  const ultimo = ap[ap.length - 1];
  const entra = f.inicio[primeiro.i];
  const sai = f.fim[ultimo.i];
  const jaNoInicio = entra <= 0.02;
  // quem entra cresce junto com a remontagem; quem sai encolhe um pouco mais rápido
  // quem entra cresce decidido (sai rápido e assenta), para ocupar logo o lugar que os outros deixam
  const pEntra = jaNoInicio ? 1 : prog(t, entra, D * 0.8);
  // quem sai encolhe junto com a troca; numa troca em duas etapas, só na segunda (vertical), para
  // continuar cobrindo a página enquanto os outros ainda andam na horizontal
  const saiEmEtapas = etapas[ultimo.i + 1] ?? false;
  const pSai = saiEmEtapas ? fase(t, sai + D * 0.4, D * 0.6) : fase(t, sai, D * 0.8);
  if (t < entra && !jaNoInicio) return null;
  if (pSai >= 0.999) return null;

  // em qual aparição estamos (e se está no meio de uma troca para a próxima)
  let k = 0;
  for (let j = 1; j < ap.length; j++) if (t >= f.inicio[ap[j].i]) k = j;
  const atual = ap[k];
  let ret = atual.ret;
  let retConteudo = atual.ret;
  let pCor = 1;
  let corAntes = atual.bloco.cor;
  let direcaoCor: EstadoPeca["direcaoCor"] = "baixo";
  let antes: EstadoPeca["antes"];
  let depois: EstadoPeca["depois"];
  const janelaAtual = janelaDo(ap, k, f, momentos);

  // chegando nesta aparição vindo da anterior
  if (k > 0) {
    const B = f.inicio[atual.i];
    const anterior = ap[k - 1];
    ret = deslizaRet(anterior.ret, atual.ret, (t - B) / D, etapas[atual.i]);
    retConteudo = deslizaConteudo(anterior.ret, atual.ret, (t - B) / D, etapas[atual.i]);
    corAntes = anterior.bloco.cor;
    // a cor nova varre o bloco na primeira parte do movimento: ele chega já com a cor certa
    pCor = fase(t, B, D * 0.62);
    const dx = atual.ret.x + atual.ret.w / 2 - (anterior.ret.x + anterior.ret.w / 2);
    const dy = atual.ret.y + atual.ret.h / 2 - (anterior.ret.y + anterior.ret.h / 2);
    direcaoCor = Math.abs(dy) >= Math.abs(dx) ? (dy >= 0 ? "baixo" : "cima") : dx >= 0 ? "direita" : "esquerda";
    if (!conteudoIgual(anterior.bloco, atual.bloco)) {
      // o conteúdo que sai some depressa (a cor nova ainda está varrendo o bloco), e só depois o novo entra
      const pOut = fase(t, B, D * 0.3);
      const pIn = fase(t, B + D * 0.32, D * 0.5);
      antes = { bloco: anterior.bloco, opacidade: 1 - pOut, janela: janelaDo(ap, k - 1, f, momentos) };
      depois = { bloco: atual.bloco, opacidade: pIn, janela: janelaAtual };
    }
  }
  if (!depois) depois = { bloco: atual.bloco, opacidade: 1, janela: janelaAtual };

  // entrada e saída: o fundo cresce (ou encolhe) a partir da borda; o conteúdo fica no lugar final
  let visivel = ret;
  let conteudo = retConteudo;
  if (pEntra < 1) {
    visivel = misturaRet(colapsado(primeiro.ret), primeiro.ret, pEntra);
    conteudo = primeiro.ret;
    depois = { ...depois, opacidade: depois.opacidade * interpolate(pEntra, [0.08, 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) };
  }
  if (pSai > 0) {
    visivel = misturaRet(ultimo.ret, colapsado(ultimo.ret), pSai);
    conteudo = ultimo.ret;
    depois = { ...depois, opacidade: depois.opacidade * (1 - interpolate(pSai, [0.45, 0.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })) };
  }
  const menor = Math.min(visivel.w, visivel.h);
  return {
    chave: peca.chave,
    visivel,
    conteudo,
    raio: Math.min(RAIO, menor / 2),
    corAntes,
    corDepois: atual.bloco.cor,
    pCor,
    direcaoCor,
    antes,
    depois,
    firmeza: Math.min(pEntra, 1 - pSai),
  };
};

// ---------- a pessoa ----------

// Onde a pessoa está: tela cheia antes do primeiro momento e nos respiros; um bloco da grade nos momentos.
export const retDaPessoa = (
  t: number,
  momentos: Momento[],
  rets: Record<string, Ret>[],
  f: Fronteiras,
  etapas: boolean[],
): { ret: Ret; cheio: number } => {
  const D = REMONTA;
  type Estado = { de: number; ret: Ret; cheio: number; etapas: boolean };
  const estados: Estado[] = [{ de: -10, ret: CHEIO, cheio: 1, etapas: false }];
  momentos.forEach((m, i) => {
    const r = rets[i].p;
    if (!r) throw new Error(`O momento de ${m.de}s não tem a pessoa ("p") na grade.`);
    estados.push({ de: f.inicio[i], ret: r, cheio: 0, etapas: etapas[i] });
    if (!f.colado[i]) estados.push({ de: f.fim[i], ret: CHEIO, cheio: 1, etapas: false });
  });
  let k = 0;
  for (let j = 1; j < estados.length; j++) if (t >= estados[j].de) k = j;
  const atual = estados[k];
  if (k === 0) return { ret: atual.ret, cheio: atual.cheio };
  const anterior = estados[k - 1];
  const p = atual.de <= 0.02 ? 1 : fase(t, atual.de, D);
  const ret = atual.de <= 0.02 ? atual.ret : deslizaRet(anterior.ret, atual.ret, (t - atual.de) / D, atual.etapas);
  return { ret, cheio: anterior.cheio + (atual.cheio - anterior.cheio) * p };
};
