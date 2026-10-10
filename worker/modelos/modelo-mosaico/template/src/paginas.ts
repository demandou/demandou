// Do plano às páginas: cada momento vira uma página do mosaico.
// - o bloco do momento é o ladrilho principal (letra "a", ou `area`);
// - os companheiros (`blocos`) e a peça que `fica` de um momento anterior ocupam outros ladrilhos;
// - sem `grade`, o arranjo é escolhido aqui: a pessoa muda de lugar a cada página, o bloco principal
//   ganha o ladrilho maior, e duas cores iguais nunca ficam lado a lado.
import { ARRANJOS, corPadrao, naDiagonal, resolverGrade, retangulos, type Pagina, type Ret } from "./grade";
import type { Bloco, BlocoCompleto, Companheiro, Conteudo, Momento, NomeCor, Plano } from "./plano";

type Variante = { grade: string[]; linhas?: number[]; colunas?: number[] };

// blocos que pedem um ladrilho maior (desenho, gráfico, lista longa)
const grande = (c: Conteudo) =>
  ["grafico", "partes", "prato", "grupo"].includes(c.tipo) ||
  (["topicos", "passos", "lista"].includes(c.tipo) && "itens" in c && c.itens.length >= 4);

// Arranjos automáticos por número de companheiros. A ordem faz a pessoa andar pela página:
// embaixo à direita → em cima à esquerda → embaixo à esquerda → em cima à direita…
const variantes = (n: number, c: Conteudo, perto: boolean): Variante[] => {
  const g = grande(c) ? 1.3 : 1.08;
  if (c.tipo === "cta" && !perto) {
    // fechamento: a pessoa grande em cima, a chamada larga embaixo
    if (n === 0) return [{ grade: ["p", "a"], linhas: [1.15, 1] }];
    if (n === 1) return [{ grade: ["pp", "ab"], linhas: [1.2, 1], colunas: [2, 1] }];
  }
  if (n === 0)
    return [
      { grade: ["a", "p"], linhas: [g, 1] },
      { grade: ["p", "a"], linhas: [1, g] },
    ];
  if (n === 1)
    return [
      { grade: ["aa", "bp"], linhas: [g, 1] },
      { grade: ["bp", "aa"], linhas: [1, g] },
      { grade: ["pb", "aa"], linhas: [1, g] },
      { grade: ["aa", "pb"], linhas: [g, 1] },
    ];
  if (n === 2)
    return [
      { grade: ["aa", "bp", "cp"], linhas: [g * 1.1, 1, 1] },
      { grade: ["bp", "cp", "aa"], linhas: [1, 1, g * 1.1] },
      { grade: ["pb", "pc", "aa"], linhas: [1, 1, g * 1.1] },
      { grade: ["aa", "pb", "pc"], linhas: [g * 1.1, 1, 1] },
    ];
  return [
    { grade: ["aa", "bc", "dp"], linhas: [g * 1.2, 1, 1] },
    { grade: ["aa", "bc", "pd"], linhas: [g * 1.2, 1, 1] },
  ];
};

// blocos que continuam legíveis num ladrilho pequeno (servem de companheiro na página seguinte)
const compacto = (c: Conteudo) =>
  ["numero", "destaque", "frase", "abertura", "titulo", "definicao", "selo", "cta", "partes", "prato", "marca"].includes(c.tipo) ||
  (c.tipo === "pergunta" && !c.opcoes?.length);

// Cores preferidas de cada bloco (a primeira livre na página é a escolhida)
const PREFERIDAS: Partial<Record<Conteudo["tipo"], NomeCor[]>> = {
  abertura: ["folha", "tinta", "gema"],
  titulo: ["folha", "gema", "tinta"],
  topicos: ["creme", "folha"],
  passos: ["creme", "folha"],
  lista: ["creme", "folha"],
  numero: ["gema", "folha", "creme"],
  grafico: ["creme"],
  destaque: ["gema", "folha", "tinta"],
  frase: ["tinta", "folha", "creme"],
  pergunta: ["folha", "tinta", "gema"],
  cta: ["gema", "folha", "creme"],
  grupo: ["folha", "tomate", "gema"],
  selo: ["creme", "folha", "gema"],
  marca: ["creme", "tinta"],
};
const preferidas = (c: Conteudo): NomeCor[] => {
  if (c.tipo === "destaque" && c.nivel === "alerta") return ["tomate"];
  return PREFERIDAS[c.tipo] ?? [corPadrao[c.tipo]];
};
const escolherCor = (c: Conteudo, ocupadas: Set<NomeCor>, evitar?: NomeCor): NomeCor => {
  const lista = preferidas(c);
  return lista.find((x) => !ocupadas.has(x) && x !== evitar) ?? lista.find((x) => !ocupadas.has(x)) ?? lista[0];
};

const letrasDa = (v: { grade: string[] }) => [...new Set(v.grade.join("").split(""))].filter((l) => l !== "p" && l !== "." && l !== " ");
const ehContinua = (b: Companheiro): b is { id: string; area?: string; tipo?: undefined; cor?: NomeCor } => !b.tipo;

export const paginasDoPlano = (plano: Plano): Pagina[] => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  // a peça que fica: o id dela, até quando, a cor e o conteúdo (para saber a cor na página)
  let viajante: { id: string; ate: number; cor: NomeCor } | null = null;
  const coresDoId = new Map<string, NomeCor>();
  let passo = 0;
  let pessoaAntes: Ret | null = null;
  let corAntes: NomeCor | undefined;
  let fimAntes = -1;
  let idAntes: string | undefined;
  let compactoAntes = false;
  // onde cada peça (por id) estava na página anterior
  let retsAntes = new Map<string, Ret>();
  // gravação perto da câmera (rosto largo, medido pelo rastreio): a pessoa precisa de um ladrilho em pé
  // para a cabeça caber inteira; então uma página sem companheiro leva o bloco anterior (menor) ao lado
  // dela — ou, na primeira página, a assinatura com nome e área.
  const largura = (plano.rosto as { rastro?: { largura?: number } }).rastro?.largura ?? 0;
  const perto = largura >= 0.42;

  return ordenados.map((m: Momento, i) => {
    const proximo = ordenados[i + 1];
    const { de, ate: ate0, legenda, grade, linhas, colunas, espelhar, area, id, cor, fica, sozinho, blocos, ...resto } = m;
    // `linhas` com textos é a quebra do texto (nome antigo), não os pesos da grade
    const pesosLinhas = Array.isArray(linhas) && linhas.every((x) => typeof x === "number") ? linhas : undefined;
    const conteudo = (Array.isArray(linhas) && !pesosLinhas ? { ...resto, quebra: linhas } : resto) as Conteudo;
    // um momento nunca invade o seguinte
    const ate = proximo && ate0 > proximo.de ? proximo.de : ate0;
    const colado = de - fimAntes < 0.3;

    // ---- ladrilhos: principal, companheiros escritos e a peça que fica
    const idPrincipal = id ?? (fica !== undefined && fica !== false ? `fica-${i}` : `pagina-${i}`);
    if (fica !== undefined && fica !== false) viajante = null; // a nova peça toma o lugar da anterior
    if (viajante && viajante.ate <= de + 0.05) viajante = null;
    const companheiros: Companheiro[] = [...(blocos ?? [])];
    const ids = new Set(companheiros.map((b) => b.id).filter(Boolean));
    const levaViajante = !!viajante && !sozinho && !ids.has(viajante.id) && viajante.id !== idPrincipal;
    if (!grade && perto && !companheiros.length && !levaViajante) {
      if (colado && idAntes && compactoAntes) companheiros.push({ id: idAntes });
      else if (plano.marca?.nome) companheiros.push({ tipo: "marca" });
    }

    // ---- a grade
    let variante: Variante;
    let letraPrincipal = area ?? "a";
    if (grade) {
      const pronto = typeof grade === "string" ? ARRANJOS[grade] : null;
      if (typeof grade === "string" && !pronto)
        throw new Error(`Arranjo desconhecido: "${grade}" (momento de ${de}s). Use um de: ${Object.keys(ARRANJOS).join(", ")}, escreva a grade ou tire o campo "grade".`);
      variante = { grade: pronto ? pronto.grade : (grade as string[]), linhas: pesosLinhas ?? pronto?.linhas, colunas: colunas ?? pronto?.colunas };
      if (!area && !letrasDa(variante).includes("a")) letraPrincipal = letrasDa(variante)[0];
    } else {
      const n = Math.min(3, companheiros.length + (levaViajante ? 1 : 0));
      const opcoes = variantes(n, conteudo, perto);
      // os ids que continuam da página anterior, na ordem em que recebem as letras livres (b, c…)
      const continuam = [...companheiros.map((b) => b.id), levaViajante ? viajante?.id : undefined].slice(0, n);
      // A pessoa muda de lugar a cada página colada (nunca a mesma caixa duas vezes seguidas), de
      // preferência andando num eixo só e sem cruzar com uma peça que continua (assim ela nunca passa
      // por cima do texto de um ladrilho que fica na tela). Empate: a ordem da rotação.
      const custo = (v: Variante) => {
        const rets = retangulos(resolverGrade({ de, ate, grade: v.grade, linhas: v.linhas, colunas: v.colunas, blocos: [] }));
        const r = rets.p;
        if (!pessoaAntes || !colado) return 0;
        const P0 = pessoaAntes;
        const igual = Math.abs(r.x - P0.x) < 4 && Math.abs(r.y - P0.y) < 4 && Math.abs(r.w - P0.w) < 4 && Math.abs(r.h - P0.h) < 4;
        let c = igual ? 100 : naDiagonal(P0, r) ? 3 : 0;
        const letras = letrasDa(v).filter((l) => l !== "a");
        continuam.forEach((idc, k) => {
          const A = idc ? retsAntes.get(idc) : undefined;
          const B = rets[letras[k]];
          if (!A || !B) return;
          const meio = (x: Ret) => ({ x: x.x + x.w / 2, y: x.y + x.h / 2 });
          const [a0, a1, p0, p1] = [meio(A), meio(B), meio(P0), meio(r)];
          // trocam de lado (em x ou em y) = se cruzam no caminho
          if ((a0.x - p0.x) * (a1.x - p1.x) < -100 || (a0.y - p0.y) * (a1.y - p1.y) < -100) c += 2;
          if (naDiagonal(A, B)) c += 1;
        });
        return c;
      };
      let k = passo % opcoes.length;
      let melhor = Infinity;
      for (let j = 0; j < opcoes.length; j++) {
        const q = (passo + j) % opcoes.length;
        const c = custo(opcoes[q]);
        if (c < melhor) {
          melhor = c;
          k = q;
        }
      }
      variante = opcoes[k];
      passo = k + 1;
      letraPrincipal = "a";
    }

    // letras livres para os companheiros sem `area` e para a peça que fica
    const livres = letrasDa(variante).filter((l) => l !== letraPrincipal && !companheiros.some((b) => b.area === l));
    const pagina: Bloco[] = [];
    const ocupadas = new Set<NomeCor>();
    // primeiro os companheiros (as cores deles valem para a escolha da cor do principal)
    for (const b of companheiros) {
      const letra = b.area ?? livres.shift();
      if (!letra) throw new Error(`O momento de ${de}s tem mais blocos do que letras na grade.`);
      if (ehContinua(b)) {
        const c = b.cor ?? coresDoId.get(b.id);
        if (c) ocupadas.add(c);
        pagina.push({ id: b.id, area: letra, ...(b.cor ? { cor: b.cor } : {}) });
      } else {
        const c: NomeCor = b.cor ?? (b.id ? coresDoId.get(b.id) : undefined) ?? escolherCor(b as Conteudo, ocupadas);
        ocupadas.add(c);
        if (b.id) coresDoId.set(b.id, c);
        pagina.push({ ...(b as BlocoCompleto), area: letra, cor: c });
      }
    }
    if (levaViajante && viajante) {
      const letra = livres.shift();
      if (letra) {
        ocupadas.add(viajante.cor);
        pagina.push({ id: viajante.id, area: letra });
      }
    }
    // letra que sobrou sem bloco (grade escrita à mão): a assinatura com nome e área tapa o buraco
    for (const letra of livres) {
      if (!plano.marca?.nome) throw new Error(`Na grade do momento de ${de}s, a letra "${letra}" não tem bloco. Ponha um bloco nela ou tire a letra da grade.`);
      ocupadas.add("creme");
      pagina.push({ tipo: "marca", area: letra, cor: "creme" });
    }
    const corPrincipal: NomeCor = cor ?? (idPrincipal ? coresDoId.get(idPrincipal) : undefined) ?? escolherCor(conteudo, ocupadas, colado ? corAntes : undefined);
    if (idPrincipal) coresDoId.set(idPrincipal, corPrincipal);
    pagina.unshift({ ...conteudo, area: letraPrincipal, cor: corPrincipal, ...(idPrincipal ? { id: idPrincipal } : {}) } as BlocoCompleto);

    if (fica !== undefined && fica !== false && idPrincipal)
      viajante = { id: idPrincipal, ate: typeof fica === "number" ? fica : Infinity, cor: corPrincipal };

    const resultado: Pagina = { de, ate, legenda, grade: variante.grade, linhas: variante.linhas, colunas: variante.colunas, espelhar, blocos: pagina };
    const retsAgora = retangulos(resolverGrade(resultado));
    pessoaAntes = retsAgora.p ?? null;
    retsAntes = new Map(pagina.filter((b) => b.id).map((b) => [b.id as string, retsAgora[b.area]]));
    corAntes = corPrincipal;
    fimAntes = ate;
    idAntes = idPrincipal;
    compactoAntes = compacto(conteudo);
    return resultado;
  });
};
