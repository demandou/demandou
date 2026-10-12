// O cupom em blocos: cada momento do plano (os blocos universais e a conta, a assinatura) vira
// linhas impressas de cupom. Aqui só se calcula ONDE e QUANDO cada bloco imprime e em que papel
// ele sai (o rolo da tela dividida ou uma tira do quadro cheio); o desenho fica em
// componentes/Recibo.tsx.
import { indicesDoTrecho, numeroBR, reais, temposDoTexto } from "./anim";
import type { Dado, Icone, Linha, LinhaGrade, Momento, Palavra, Plano } from "./plano";
import { AVANCO, larguraSans, PAPEL } from "./tema";

// margens internas do papel (px, escala 1)
export const PAD_X = 28;
export const INTERNO = PAPEL - 2 * PAD_X;
// papel em branco acima do cabeçalho e abaixo da última linha impressa
export const PAD_TOPO = 26;
export const PAD_PE = 34;
// tempo que o papel leva para avançar uma linha
export const AVANCO_PAPEL = 0.24;

export type Bloco = {
  chave: string;
  em: number;
  altura: number;
  // posição do topo do bloco no papel (a partir do topo do papel)
  y: number;
  momento: number;
  c: Conteudo;
};

export type Marca = "certo" | "errado" | "vence" | "perde";

export type Conteudo =
  | { k: "cabecalho"; titulo: string; nome: string; area: string }
  | { k: "capa"; titulo: string; tamanho: number }
  | { k: "item"; linhas: string[]; tamanho: number; valorTexto?: string; espera?: string; negativo: boolean; valorEm: number; icone?: Icone }
  | { k: "nota"; texto: string }
  | { k: "vezes"; texto: string; fator: string; sinal: string; fatorEm: number }
  | { k: "corte"; riscaEm?: number }
  | { k: "gradeRotulos"; rotulos: string[]; colunas: number }
  | { k: "gradeLinha"; linha: LinhaGrade; inicio: number; fim: number; colunas: number }
  | { k: "degraus"; linha: LinhaGrade }
  | { k: "ilustrativo" }
  | {
      k: "total";
      rotulo: string[];
      tamRotulo: number;
      valor?: number;
      resultado?: string;
      prefixo: string;
      sufixo: string;
      casas: number;
      // 0 = conta suave; n = n degraus iguais
      passos: number;
      contaDe: number;
      contaAte: number;
      ilustrativo: boolean;
      carimbo?: { texto: string; em: number };
    }
  | {
      k: "texto";
      palavras: string[];
      tempos: number[];
      tamanho: number;
      grifo: boolean[];
      grifoEm: number;
      risco: boolean[];
      riscoEm: number;
      icone?: Icone;
      iconeEm: number;
      primeira: boolean;
      ultima: boolean;
    }
  | { k: "camposTitulo"; texto: string }
  | { k: "campo"; texto: string; moeda: string }
  | { k: "rodape"; nome: string; area: string; compacto?: boolean }
  | { k: "titulo"; linhas: string[]; tamanho: number }
  | {
      k: "lista";
      marcador: "ponto" | "numero" | "caixa";
      n: number;
      linhas: string[];
      tamanho: number;
      detalhe: string[];
      // passos: o item fica "da vez" (caixa cheia) de `em` até `ativoAte`
      ativoAte: number;
      primeiro: boolean;
      ultimo: boolean;
    }
  | { k: "significado"; linhas: string[]; tamanho: number }
  | { k: "lado"; rotulo: string; linhas: string[]; tamanho: number; marca?: Marca; marcaEm: number }
  | { k: "versus"; texto: string }
  | {
      k: "grafico";
      forma: "barras" | "linha" | "pizza";
      dados?: Dado[];
      tendencia?: "sobe" | "cai" | "oscila";
      tendenciaEm: number;
      unidade?: string;
      ilustrativo: boolean;
    }
  | { k: "carimbo"; linhas: string[]; tamanho: number; em: number }
  | { k: "resposta" };

// alturas fixas (px, escala 1)
export const ALTURA = {
  cabecalho: 246,
  capa: 112,
  item: 98,
  nota: 60,
  vezes: 106,
  corte: 76,
  gradeRotulos: 54,
  gradeLinha: 90,
  degraus: 292,
  ilustrativo: 56,
  total: 214,
  camposTitulo: 72,
  campo: 66,
  rodape: 270,
  rodapeCompacto: 168,
  versus: 78,
  grafico: 470,
  carimbo: 250,
  resposta: 86,
};

export const caracteresPorLinha = (tamanho: number, largura = INTERNO, espacamento = 0) => Math.max(1, Math.floor(largura / (tamanho * (AVANCO + espacamento))));

// ---------- diagramação (a mono tem largura fixa: medir é contar caracteres) ----------

// palavras que não devem terminar uma linha ("o", "de", "pra"…)
const FUNCIONAIS = new Set("a o as os e é um uma de do da dos das em no na nos nas ao aos à que se pra pro com por para".split(" "));

// Melhor quebra em até `maxLinhas` linhas de no máximo `max` caracteres: o menor número de linhas,
// depois o menor número de linhas terminando em palavra curta, depois a linha mais longa a menor
// possível. `extraNaUltima` reserva espaço no fim da última linha (o ícone).
const quebrar = (palavras: string[], max: number, maxLinhas: number, extraNaUltima = 0, juntos: Set<number> = new Set()) => {
  type Opcao = { linhas: number[][]; nota: [number, number, number, number] };
  let melhor: Opcao | null = null;
  const comprimento = (idx: number[]) => idx.reduce((n, j, k) => n + palavras[j].length + (k ? 1 : 0), 0);
  const tentar = (inicio: number, linhas: number[][]) => {
    if (linhas.length > maxLinhas) return;
    if (inicio === palavras.length) {
      const ultima = linhas.length - 1;
      if (ultima < 0 || comprimento(linhas[ultima]) + extraNaUltima > max) return;
      const ruins = linhas.slice(0, -1).filter((l) => FUNCIONAIS.has(palavras[l[l.length - 1]].toLowerCase())).length;
      // quebra no meio do trecho destacado (a palavra j e a j+1 estão em `juntos`) pesa mais que palavra curta no fim
      const partidos = linhas.slice(0, -1).filter((l) => juntos.has(l[l.length - 1])).length;
      const maior = Math.max(...linhas.map((l, i) => comprimento(l) + (i === ultima ? extraNaUltima : 0)));
      const nota: [number, number, number, number] = [linhas.length, partidos * 2 + ruins, maior, 0];
      const ganha = !melhor || nota[0] < melhor.nota[0] || (nota[0] === melhor.nota[0] && (nota[1] < melhor.nota[1] || (nota[1] === melhor.nota[1] && nota[2] < melhor.nota[2])));
      if (ganha) melhor = { linhas: linhas.map((l) => [...l]), nota };
      return;
    }
    for (let fim = inicio + 1; fim <= palavras.length; fim++) {
      const idx = Array.from({ length: fim - inicio }, (_, k) => inicio + k);
      if (comprimento(idx) > max) break;
      tentar(fim, [...linhas, idx]);
    }
  };
  tentar(0, []);
  return melhor as Opcao | null;
};

export type Diagrama = {
  tamanho: number;
  // as palavras (palavra longa demais sai partida com hífen) e, para cada uma, a palavra original
  palavras: string[];
  origem: number[];
  // índices (em `palavras`) de cada linha
  idx: number[][];
  linhas: string[];
};

// Corpo e quebra de um texto: de `maior` a `menor` (de 2 em 2 px), o que der menos linhas e menos
// linhas terminando em palavra curta; no empate, o corpo maior. Se nem no menor corpo cabe em
// `maxLinhas`, parte as palavras longas e quebra no menor corpo (nunca vaza na largura).
export const diagramar = (
  texto: string,
  o: { maior: number; menor: number; maxLinhas: number; largura?: number; extraNaUltima?: number; espacamento?: number; juntos?: Set<number> },
): Diagrama => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const largura = o.largura ?? INTERNO;
  let escolha: { tamanho: number; idx: number[][]; nota: [number, number, number, number] } | null = null;
  for (let tamanho = o.maior; tamanho >= o.menor; tamanho -= 2) {
    const q = quebrar(palavras, caracteresPorLinha(tamanho, largura, o.espacamento), o.maxLinhas, o.extraNaUltima ?? 0, o.juntos);
    if (!q) continue;
    const melhorQue = !escolha || q.nota[0] < escolha.nota[0] || (q.nota[0] === escolha.nota[0] && q.nota[1] < escolha.nota[1]);
    if (melhorQue) escolha = { tamanho, idx: q.linhas, nota: q.nota };
  }
  if (escolha) {
    const e = escolha;
    return { tamanho: e.tamanho, palavras, origem: palavras.map((_, i) => i), idx: e.idx, linhas: e.idx.map((l) => l.map((j) => palavras[j]).join(" ")) };
  }
  // não coube: menor corpo, palavra maior que a linha partida com hífen, quebra simples
  const max = caracteresPorLinha(o.menor, largura, o.espacamento);
  const partes: string[] = [];
  const origem: number[] = [];
  palavras.forEach((w, i) => {
    let resto = w;
    while (resto.length > max) {
      partes.push(`${resto.slice(0, max - 1)}-`);
      origem.push(i);
      resto = resto.slice(max - 1);
    }
    partes.push(resto);
    origem.push(i);
  });
  const idx: number[][] = [];
  let atual: number[] = [];
  let n = 0;
  partes.forEach((w, i) => {
    const extra = i === partes.length - 1 ? (o.extraNaUltima ?? 0) : 0;
    if (atual.length && n + w.length + 1 + extra > max) {
      idx.push(atual);
      atual = [];
      n = 0;
    }
    n += (atual.length ? 1 : 0) + w.length;
    atual.push(i);
  });
  if (atual.length) idx.push(atual);
  return { tamanho: o.menor, palavras: partes, origem, idx, linhas: idx.map((l) => l.map((j) => partes[j]).join(" ")) };
};

// ---------- em que papel cada momento sai ----------

const NO_ROLO = new Set(["conta", "fechamento", "topicos", "passos", "comparacao", "grafico"]);

// "cheio" (tira, pessoa em quadro cheio) ou "dividido" (rolo, pessoa na moldura)
export const quadroDo = (m: Momento): "cheio" | "dividido" => {
  if (m.quadro) return m.quadro;
  if (m.tipo === "abertura") return "cheio";
  return NO_ROLO.has(m.tipo) ? "dividido" : "cheio";
};

// No layout "lado" (o do exemplo), o primeiro momento em quadro cheio com linhas de conta é o começo
// do próprio rolo: o cupom curto da abertura que depois vira a coluna inteira.
export const comecoDoRolo = (plano: Plano, m: Momento, i: number) =>
  (plano.layout ?? "cima") === "lado" && i === 0 && quadroDo(m) === "cheio" && (m.tipo === "conta" || (m.tipo === "abertura" && !!m.linhas));

export const naTira = (plano: Plano, m: Momento, i: number) => quadroDo(m) === "cheio" && !comecoDoRolo(plano, m, i);

// ---------- os papéis ----------

export type Papel = {
  chave: string;
  blocos: Bloco[];
  // altura total do papel impresso (px, escala 1), com as margens
  altura: number;
};

export type Tira = Papel & {
  momento: number;
  lado: "esquerda" | "direita";
};

export type Papeis = { rolo: Papel; tiras: Tira[] };

const posicionar = (blocos: Omit<Bloco, "y">[]): Papel => {
  // ordem de impressão = ordem do papel; um bloco nunca imprime antes do anterior
  let y = PAD_TOPO;
  let ultimo = -Infinity;
  const saida = blocos.map((b) => {
    const em = Math.max(b.em, ultimo + 0.03);
    ultimo = em;
    const comY = { ...b, em, y };
    y += b.altura;
    return comY;
  });
  return { chave: "", blocos: saida, altura: y + PAD_PE };
};

// Monta o rolo e as tiras, com a posição de cada bloco no seu papel. `momentos` já em ordem.
export const montarPapeis = (plano: Plano, palavras: Palavra[]): Papeis => {
  const momentos = plano.momentos;
  const doRolo: Omit<Bloco, "y">[] = [];
  const tiras: Tira[] = [];
  let ladoTira: "esquerda" | "direita" = "direita";
  let primeiroDoRolo = true;

  momentos.forEach((m, mi) => {
    if (naTira(plano, m, mi)) {
      const blocos: Omit<Bloco, "y">[] = [];
      // a primeira tira, quando abre o vídeo, já vem com o título do cupom (a capa do post)
      if (mi === 0 && m.de < 0.5 && plano.cabecalho) {
        const titulo = plano.cabecalho.toUpperCase();
        const tamanho = Math.max(34, Math.min(52, Math.floor(INTERNO / Math.max(1, titulo.length * (AVANCO + 0.04)))));
        blocos.push({ chave: "capa", em: m.de - 0.6, altura: ALTURA.capa, momento: mi, c: { k: "capa", titulo, tamanho } });
      }
      blocos.push(...blocosDoMomento(m, mi, plano, palavras));
      ladoTira = ladoTira === "esquerda" ? "direita" : "esquerda";
      const papel = posicionar(blocos);
      tiras.push({ ...papel, chave: `tira-${mi}`, momento: mi, lado: ladoTira });
      return;
    }
    if (primeiroDoRolo) {
      // o cabeçalho já está impresso quando o rolo aparece
      doRolo.push({
        chave: "cabecalho",
        em: m.de - 0.6,
        altura: ALTURA.cabecalho,
        momento: mi,
        c: { k: "cabecalho", titulo: (plano.cabecalho ?? "").toUpperCase(), nome: (plano.marca.nome ?? "").toUpperCase(), area: (plano.marca.area ?? "").toUpperCase() },
      });
    } else {
      // cada etapa do rolo (menos a primeira) começa com a linha de corte, no instante da troca
      const corte = "corte" in m ? m.corte : undefined;
      if (corte !== false) doRolo.push({ chave: `corte-${mi}`, em: m.de - 0.05, altura: ALTURA.corte, momento: mi, c: { k: "corte", riscaEm: corte?.riscaEm } });
    }
    primeiroDoRolo = false;
    doRolo.push(...blocosDoMomento(m, mi, plano, palavras));
  });

  return { rolo: { ...posicionar(doRolo), chave: "rolo" }, tiras };
};

// ---------- cada momento em linhas de cupom ----------

const ultimaFalaAte = (palavras: Palavra[], de: number, ate: number) => palavras.filter((p) => p.em >= de && p.em < ate).pop();

type OpcoesTexto = {
  chave: string;
  mi: number;
  texto: string;
  em: number;
  ate: number;
  grifo?: string;
  grifoEm?: number;
  // grifa o texto inteiro (destaque "chave", o termo de uma definição)
  tudoGrifado?: boolean;
  risco?: string;
  riscoEm?: number;
  icone?: Icone;
  iconeEm?: number;
  maior?: number;
  menor?: number;
  maxLinhas?: number;
};

// Texto grande, palavra por palavra no instante em que é dita (o template procura cada palavra na
// fala a partir de `em`). Uma linha de cupom por linha de texto.
const blocosDeTexto = (o: OpcoesTexto, palavras: Palavra[]): { blocos: Omit<Bloco, "y">[]; fim: number } => {
  const texto = o.texto.toUpperCase();
  const grifados = o.tudoGrifado ? new Set(texto.split(/\s+/).filter(Boolean).map((_, i) => i)) : indicesDoTrecho(texto, o.grifo);
  // o trecho destacado não se parte entre duas linhas (se der)
  const juntos = new Set([...indicesDoTrecho(texto, o.grifo)].filter((j) => indicesDoTrecho(texto, o.grifo).has(j + 1)));
  const d = diagramar(texto, { maior: o.maior ?? 60, menor: o.menor ?? 52, maxLinhas: o.maxLinhas ?? 3, extraNaUltima: o.icone ? 2 : 0, juntos });
  const tempos = temposDoTexto(texto, palavras, o.em, o.ate, o.em);
  const total = tempos.length;
  const riscados = indicesDoTrecho(texto, o.risco);
  const primeiroGrifo = [...grifados].sort((a, b) => a - b)[0];
  const ultimoGrifo = [...grifados].sort((a, b) => b - a)[0];
  const ultimoRisco = [...riscados].sort((a, b) => b - a)[0];
  const grifoEm = o.grifoEm ?? (primeiroGrifo !== undefined ? (o.tudoGrifado ? tempos[ultimoGrifo] + 0.2 : tempos[primeiroGrifo] + 0.12) : Infinity);
  const riscoEm = o.riscoEm ?? (ultimoRisco !== undefined ? tempos[ultimoRisco] + 0.25 : Infinity);
  const alturaLinha = Math.round(d.tamanho * 1.24);
  const blocos = d.idx.map((idx, i) => ({
    chave: `${o.chave}-${i}`,
    em: tempos[d.origem[idx[0]]] - 0.04,
    altura: alturaLinha + (i === 0 ? 14 : 0) + (i === d.idx.length - 1 ? 16 : 0),
    momento: o.mi,
    c: {
      k: "texto" as const,
      palavras: idx.map((j) => d.palavras[j]),
      tempos: idx.map((j) => tempos[d.origem[j]]),
      tamanho: d.tamanho,
      grifo: idx.map((j) => grifados.has(d.origem[j])),
      grifoEm,
      risco: idx.map((j) => riscados.has(d.origem[j])),
      riscoEm,
      icone: i === d.idx.length - 1 ? o.icone : undefined,
      iconeEm: o.iconeEm ?? tempos[total - 1] + 0.1,
      primeira: i === 0,
      ultima: i === d.idx.length - 1,
    },
  }));
  return { blocos, fim: tempos[total - 1] ?? o.em };
};

// título de seção ("── TEM GENTE QUE PERDE ──"), impresso inteiro quando começa a ser dito
const blocoTitulo = (chave: string, mi: number, titulo: string, de: number, antesDe: number, palavras: Palavra[]): Omit<Bloco, "y"> => {
  const texto = titulo.toUpperCase();
  const d = diagramar(texto, { maior: 44, menor: 36, maxLinhas: 2, espacamento: 0.04, largura: INTERNO - 20 });
  const dito = temposDoTexto(texto, palavras, de, antesDe, de + 0.02)[0];
  const em = Math.min(Math.max(de + 0.02, dito - 0.04), antesDe - 0.12);
  return { chave, em, altura: Math.round(d.linhas.length * d.tamanho * 1.18) + 48, momento: mi, c: { k: "titulo", linhas: d.linhas, tamanho: d.tamanho } };
};

const blocoLista = (
  chave: string,
  mi: number,
  marcador: "ponto" | "numero" | "caixa",
  n: number,
  texto: string,
  em: number,
  ativoAte: number,
  primeiro: boolean,
  ultimo: boolean,
  detalhe?: string,
): Omit<Bloco, "y"> => {
  // o marcador ocupa 64 px à esquerda; o pontilhado do fim pede uns 3 caracteres livres
  const largura = INTERNO - 64;
  const d = diagramar(texto.toUpperCase(), { maior: 54, menor: 42, maxLinhas: 2, largura, extraNaUltima: 2 });
  const det = detalhe ? diagramar(detalhe.toUpperCase(), { maior: 38, menor: 34, maxLinhas: 2, largura }) : null;
  const altura = Math.round(d.linhas.length * d.tamanho * 1.16) + (det ? Math.round(det.linhas.length * det.tamanho * 1.2) + 6 : 0) + 40;
  return {
    chave,
    em: em - 0.04,
    altura,
    momento: mi,
    c: { k: "lista", marcador, n, linhas: d.linhas, tamanho: d.tamanho, detalhe: det?.linhas ?? [], ativoAte, primeiro, ultimo },
  };
};

// rótulo do total ("= POR MÊS"): 38 px (até 32), em até 2 linhas; o "=" sai em magenta
const rotuloDoTotal = (texto: string) => {
  const d = diagramar(`= ${texto.toUpperCase()}`, { maior: 38, menor: 32, maxLinhas: 2, espacamento: 0.05, largura: INTERNO - 24 });
  return { linhas: d.linhas, tamanho: d.tamanho };
};

const blocosDoMomento = (m: Momento, mi: number, plano: Plano, palavras: Palavra[]): Omit<Bloco, "y">[] => {
  const k = `m${mi}`;
  switch (m.tipo) {
    case "conta":
    case "abertura":
    case "fechamento": {
      if (m.tipo === "abertura" && !m.linhas) {
        return blocosDeTexto({ chave: `${k}-t`, mi, texto: m.texto ?? "", em: m.em ?? m.de, ate: m.ate, grifo: m.destaque }, palavras).blocos;
      }
      const linhas = m.linhas ?? [];
      const saida = linhas.flatMap((l, li) => linhaEmBlocos(l, `${mi}-${li}`, mi, m, plano, palavras));
      if (m.tipo === "fechamento") {
        const fala = ultimaFalaAte(palavras, m.de, m.ate);
        const em = m.rodapeEm ?? (fala ? fala.ate + 0.12 : m.ate - 0.6);
        saida.push({ chave: `rodape-${mi}`, em, altura: ALTURA.rodape, momento: mi, c: { k: "rodape", nome: plano.marca.nome ?? "", area: plano.marca.area ?? "" } });
      }
      return saida;
    }
    case "frase":
      return blocosDeTexto({ chave: `${k}-t`, mi, texto: m.texto, em: m.em ?? m.de, ate: m.ate, grifo: m.destaque, risco: m.risco, riscoEm: m.riscoEm }, palavras).blocos;
    case "destaque": {
      const saida: Omit<Bloco, "y">[] = [];
      let fim = m.em;
      if (m.nivel === "alerta") {
        // o alerta é o carimbo: o lugar dele espera a lápis e ele bate quando a frase é dita
        const texto = m.texto.toUpperCase();
        const { linhas, tamanho } = linhasDoCarimbo(texto);
        saida.push({ chave: `${k}-c`, em: Math.min(m.de + 0.02, m.em - 0.3), altura: alturaDoCarimbo(linhas.length, tamanho), momento: mi, c: { k: "carimbo", linhas, tamanho, em: m.em } });
        fim = m.em + 0.3;
      } else {
        const r = blocosDeTexto({ chave: `${k}-t`, mi, texto: m.texto, em: m.em, ate: m.ate, tudoGrifado: true, maior: 64, menor: 52 }, palavras);
        saida.push(...r.blocos);
        fim = r.fim;
      }
      if (m.detalhe) saida.push({ chave: `${k}-d`, em: m.detalheEm ?? fim + 0.35, altura: ALTURA.nota, momento: mi, c: { k: "nota", texto: m.detalhe.toUpperCase() } });
      return saida;
    }
    case "definicao": {
      const termo = blocosDeTexto({ chave: `${k}-t`, mi, texto: m.termo, em: m.em, ate: m.significadoEm, tudoGrifado: true, grifoEm: m.significadoEm + 0.25, maxLinhas: 2 }, palavras);
      const d = diagramar(m.significado.toUpperCase(), { maior: 48, menor: 40, maxLinhas: 3, largura: INTERNO - 52 });
      return [
        ...termo.blocos,
        { chave: `${k}-s`, em: m.significadoEm - 0.04, altura: Math.round(d.linhas.length * d.tamanho * 1.2) + 30, momento: mi, c: { k: "significado", linhas: d.linhas, tamanho: d.tamanho } },
      ];
    }
    case "pergunta": {
      const primeiraOpcao = m.opcoes?.[0]?.em ?? m.ate;
      const r = blocosDeTexto({ chave: `${k}-t`, mi, texto: m.texto, em: m.em ?? m.de, ate: Math.min(m.ate, primeiraOpcao), maior: 58, menor: 50 }, palavras);
      const saida = [...r.blocos];
      if (m.opcoes?.length) {
        m.opcoes.forEach((op, i) => saida.push(blocoLista(`${k}-o${i}`, mi, "caixa", i + 1, op.texto, op.em, m.ate, i === 0, i === m.opcoes!.length - 1)));
      } else {
        saida.push({ chave: `${k}-r`, em: r.fim + 0.25, altura: ALTURA.resposta, momento: mi, c: { k: "resposta" } });
      }
      return saida;
    }
    case "cta": {
      const icone: Icone | undefined = m.icone === "comentar" ? "balao" : m.icone;
      const r = blocosDeTexto({ chave: `${k}-t`, mi, texto: m.texto, em: m.em ?? m.de, ate: m.ate, grifo: m.destaque, icone, maior: 64, menor: 50 }, palavras);
      const fala = ultimaFalaAte(palavras, m.de, m.ate);
      const em = Math.max(r.fim + 0.3, fala ? fala.ate + 0.12 : m.ate - 0.6);
      // na tira, o rodapé é curto (nome e área numa linha só e o código de barras) para a chamada ficar grande
      const compacto = naTira(plano, m, mi);
      return [
        ...r.blocos,
        {
          chave: `rodape-${mi}`,
          em: Math.min(em, m.ate - 0.2),
          altura: compacto ? ALTURA.rodapeCompacto : ALTURA.rodape,
          momento: mi,
          c: { k: "rodape", nome: plano.marca.nome ?? "", area: plano.marca.area ?? "", compacto },
        },
      ];
    }
    case "numero": {
      const { linhas: rotulo, tamanho: tamRotulo } = rotuloDoTotal(m.rotulo);
      const rotuloEm = m.rotuloEm ?? Math.min(m.de + 0.02, m.em - 0.1);
      const contaAte = Math.max(m.em + 0.5, Math.min(m.em + 1.0, m.ate - 0.25));
      const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
      const saida: Omit<Bloco, "y">[] = [];
      saida.push({
        chave: `${k}-n`,
        em: rotuloEm,
        altura: ALTURA.total + (rotulo.length - 1) * 46 + (m.ilustrativo ? 48 : 0),
        momento: mi,
        c: { k: "total", rotulo, tamRotulo, valor: m.valor, prefixo: (m.prefixo ?? "").toUpperCase(), sufixo: (m.sufixo ?? "").toUpperCase(), casas, passos: 0, contaDe: m.em, contaAte, ilustrativo: !!m.ilustrativo },
      });
      return saida;
    }
    case "topicos":
    case "passos": {
      const itens = m.itens ?? [];
      const saida: Omit<Bloco, "y">[] = [];
      if (m.titulo) saida.push(blocoTitulo(`${k}-ti`, mi, m.titulo, m.de, itens[0]?.em ?? m.ate, palavras));
      itens.forEach((it, i) =>
        saida.push(
          blocoLista(`${k}-i${i}`, mi, m.tipo === "passos" ? "numero" : "ponto", i + 1, it.texto, it.em, itens[i + 1]?.em ?? m.ate + 1, i === 0, i === itens.length - 1, it.detalhe),
        ),
      );
      return saida;
    }
    case "comparacao": {
      const [a, b] = m.lados;
      const modo = m.modo ?? "contra";
      const saida: Omit<Bloco, "y">[] = [];
      if (m.titulo) saida.push(blocoTitulo(`${k}-ti`, mi, m.titulo, m.de, a.em, palavras));
      const marcas: [Marca | undefined, Marca | undefined] = [undefined, undefined];
      let marcaEm = m.vencedorEm ?? b.em + 0.35;
      if (modo === "errado-certo") {
        const certo = m.vencedor ?? 1;
        marcas[certo] = "certo";
        marcas[1 - certo] = "errado";
      } else if (m.vencedor !== undefined) {
        marcas[m.vencedor] = "vence";
        marcas[1 - m.vencedor] = "perde";
      }
      marcaEm = Math.min(marcaEm, m.ate - 0.3);
      const lado = (l: typeof a, i: 0 | 1): Omit<Bloco, "y"> => {
        // a faixa da direita (~100 px) fica livre para o selo ✓ ou o ✕
        const d = diagramar(l.texto.toUpperCase(), { maior: 60, menor: 44, maxLinhas: 2, largura: INTERNO - 104 });
        return {
          chave: `${k}-l${i}`,
          em: l.em - 0.04,
          altura: Math.round(d.linhas.length * d.tamanho * 1.14) + 74,
          momento: mi,
          c: { k: "lado", rotulo: l.rotulo.toUpperCase(), linhas: d.linhas, tamanho: d.tamanho, marca: marcas[i], marcaEm: marcas[i] === "certo" || marcas[i] === "vence" ? marcaEm + 0.2 : marcaEm },
        };
      };
      saida.push(lado(a, 0));
      saida.push({ chave: `${k}-vs`, em: Math.max(a.em + 0.1, b.em - 0.16), altura: ALTURA.versus, momento: mi, c: { k: "versus", texto: modo === "contra" ? "VS" : "↓" } });
      saida.push(lado(b, 1));
      return saida;
    }
    case "grafico": {
      const saida: Omit<Bloco, "y">[] = [];
      const dados = m.dados?.length ? m.dados.slice(0, 6) : undefined;
      const primeiro = dados ? Math.min(...dados.map((d) => d.em)) : (m.tendenciaEm ?? m.de + 0.3);
      if (m.titulo) saida.push(blocoTitulo(`${k}-ti`, mi, m.titulo, m.de, primeiro, palavras));
      saida.push({
        chave: `${k}-g`,
        em: Math.min(m.de + 0.06, primeiro - 0.12),
        altura: ALTURA.grafico,
        momento: mi,
        c: {
          k: "grafico",
          forma: m.forma,
          dados,
          tendencia: dados ? undefined : (m.tendencia ?? "sobe"),
          tendenciaEm: m.tendenciaEm ?? m.de + 0.3,
          unidade: m.unidade,
          ilustrativo: !!m.ilustrativo || !dados,
        },
      });
      return saida;
    }
  }
};

// Carimbo do alerta: 1 a 3 linhas equilibradas, no maior corpo (até 84) em que a linha mais longa
// cabe no papel com as bordas, medida na fonte de verdade. No empate, menos linhas.
export const linhasDoCarimbo = (texto: string) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const comprimento = (ws: string[]) => ws.join(" ").length;
  const opcoes: string[][] = [[palavras.join(" ")]];
  let melhor2: string[] | null = null;
  for (let i = 1; i < palavras.length; i++) {
    const l = [palavras.slice(0, i).join(" "), palavras.slice(i).join(" ")];
    if (!melhor2 || Math.max(...l.map((x) => x.length)) < Math.max(...melhor2.map((x) => x.length))) melhor2 = l;
  }
  if (melhor2) opcoes.push(melhor2);
  let melhor3: string[] | null = null;
  for (let i = 1; i < palavras.length; i++)
    for (let j = i + 1; j < palavras.length; j++) {
      const l = [palavras.slice(0, i), palavras.slice(i, j), palavras.slice(j)];
      if (!melhor3 || Math.max(...l.map(comprimento)) < Math.max(...melhor3.map((x) => x.length))) melhor3 = l.map((x) => x.join(" "));
    }
  if (melhor3) opcoes.push(melhor3);
  const util = INTERNO - 84;
  for (let tamanho = 84; tamanho >= 40; tamanho -= 2) {
    for (const linhas of opcoes) {
      if (Math.max(...linhas.map((l) => larguraSans(l, tamanho, 700, 0.05))) <= util) return { linhas, tamanho };
    }
  }
  return { linhas: opcoes[opcoes.length - 1], tamanho: 40 };
};

// altura do bloco do carimbo (o carimbo inclinado com as bordas e um respiro)
export const alturaDoCarimbo = (linhas: number, tamanho: number) => Math.round(Math.max(190, linhas * tamanho * 1.04 + 128));

const linhaEmBlocos = (l: Linha, chave: string, mi: number, m: Momento, plano: Plano, palavras: Palavra[]): Omit<Bloco, "y">[] => {
  switch (l.tipo) {
    case "item": {
      const texto = l.texto.toUpperCase();
      let valorTexto: string | undefined;
      let espera: string | undefined;
      let negativo = false;
      if (typeof l.valor === "number") {
        const prefixo = l.prefixo ?? plano.moeda ?? "R$";
        const casas = l.casas ?? 2;
        const sufixo = l.sufixo ?? "";
        negativo = l.valor < 0;
        const corpo = casas === 2 ? reais(l.valor) : numeroBR(Math.abs(l.valor), casas);
        valorTexto = `${negativo ? "− " : ""}${prefixo ? `${prefixo} ` : ""}${corpo}${sufixo ? ` ${sufixo.toUpperCase()}` : ""}`;
        // o preço espera a lápis até ser dito
        espera = prefixo === "R$" && casas === 2 && !sufixo ? "R$ __,__".padStart(valorTexto.length, " ") : valorTexto.replace(/\d/g, "_");
      } else if (typeof l.valor === "string" && l.valor.trim()) {
        valorTexto = l.valor.toUpperCase();
        negativo = /^[−-]/.test(valorTexto);
        espera = valorTexto.replace(/[^\s]/g, "_");
      }
      const espacoIcone = l.icone ? 70 : 0;
      const nValor = valorTexto?.length ?? 0;
      // uma linha (como sempre foi): o maior corpo de 56 a 42 em que nome e valor cabem
      const tamUmaLinha = Math.floor((INTERNO - espacoIcone - 30) / Math.max(1, (texto.length + nValor) * AVANCO));
      if (tamUmaLinha >= 42) {
        return [{ chave, em: l.em, altura: ALTURA.item, momento: mi, c: { k: "item", linhas: [texto], tamanho: Math.min(56, tamUmaLinha), valorTexto, espera, negativo, valorEm: l.valorEm ?? l.em, icone: l.icone } }];
      }
      // nome longo: quebra em até 2 linhas e o valor fica no fim da última
      const d = diagramar(texto, { maior: 50, menor: 42, maxLinhas: 2, largura: INTERNO - espacoIcone, extraNaUltima: nValor ? nValor + 3 : 2 });
      return [
        {
          chave,
          em: l.em,
          altura: ALTURA.item + (d.linhas.length - 1) * Math.round(d.tamanho * 1.16),
          momento: mi,
          c: { k: "item", linhas: d.linhas, tamanho: d.tamanho, valorTexto, espera, negativo, valorEm: l.valorEm ?? l.em, icone: l.icone },
        },
      ];
    }
    case "nota":
      return [{ chave, em: l.em, altura: ALTURA.nota, momento: mi, c: { k: "nota", texto: l.texto.toUpperCase() } }];
    case "vezes":
      return [{ chave, em: l.em, altura: ALTURA.vezes, momento: mi, c: { k: "vezes", texto: l.texto.toUpperCase(), fator: l.fator.toUpperCase(), sinal: l.sinal ?? "×", fatorEm: l.fatorEm ?? l.em } }];
    case "corte":
      return [{ chave, em: l.em, altura: ALTURA.corte, momento: mi, c: { k: "corte", riscaEm: l.riscaEm } }];
    case "grade": {
      const saida: Omit<Bloco, "y">[] = [];
      if (l.ilustrativo) saida.push({ chave: `${chave}-il`, em: l.em - 0.02, altura: ALTURA.ilustrativo, momento: mi, c: { k: "ilustrativo" } });
      if (l.forma === "degraus") {
        saida.push({ chave, em: l.em, altura: ALTURA.degraus, momento: mi, c: { k: "degraus", linha: { ...l, quantidade: Math.max(1, Math.min(24, Math.round(l.quantidade))) } } });
        return saida;
      }
      const quantidade = Math.max(1, Math.min(42, Math.round(l.quantidade)));
      const linha = { ...l, quantidade };
      const colunas = Math.max(1, Math.min(7, l.colunas ?? Math.min(6, quantidade)));
      const linhas = Math.ceil(quantidade / colunas);
      // as casas imprimem a lápis, linha por linha, numa rajada curta a partir de `em`
      const passo = Math.max(0.06, Math.min(0.12, (l.encheDe - l.em) / Math.max(1, linhas)));
      if (l.rotulos?.length) {
        saida.push({ chave: `${chave}-r`, em: l.em, altura: ALTURA.gradeRotulos, momento: mi, c: { k: "gradeRotulos", rotulos: l.rotulos, colunas } });
      }
      for (let r = 0; r < linhas; r++) {
        saida.push({
          chave: `${chave}-${r}`,
          em: l.em + (l.rotulos?.length ? 0.08 : 0) + r * passo,
          altura: ALTURA.gradeLinha,
          momento: mi,
          c: { k: "gradeLinha", linha, inicio: r * colunas, fim: Math.min(quantidade, (r + 1) * colunas), colunas },
        });
      }
      return saida;
    }
    case "total": {
      const contaDe = l.contaDe ?? l.em + 0.15;
      const contaAte = Math.max(contaDe + 0.2, l.contaAte ?? contaDe + 0.9);
      const { linhas: rotulo, tamanho: tamRotulo } = rotuloDoTotal(l.texto);
      const temValor = typeof l.valor === "number";
      return [
        {
          chave,
          em: l.em,
          altura: ALTURA.total + (rotulo.length - 1) * 46 + (l.ilustrativo ? 48 : 0),
          momento: mi,
          c: {
            k: "total",
            rotulo,
            tamRotulo,
            valor: temValor ? l.valor : undefined,
            resultado: temValor ? undefined : (l.resultado ?? "").toUpperCase(),
            prefixo: l.prefixo ?? plano.moeda ?? "R$",
            sufixo: (l.sufixo ?? "").toUpperCase(),
            casas: l.casas ?? 2,
            passos: Math.max(1, l.passos ?? 1),
            contaDe,
            contaAte,
            ilustrativo: !!l.ilustrativo,
            carimbo: l.carimbo,
          },
        },
      ];
    }
    case "texto":
      return blocosDeTexto({ chave, mi, texto: l.texto, em: l.em, ate: m.ate, grifo: l.grifo, grifoEm: l.grifoEm, risco: l.risco, riscoEm: l.riscoEm, icone: l.icone, iconeEm: l.iconeEm }, palavras)
        .blocos;
    case "campos": {
      const ate = l.ate ?? l.em + 0.1 * l.itens.length;
      const moeda = l.moeda === false ? "" : (plano.moeda ?? "R$");
      const saida: Omit<Bloco, "y">[] = [];
      if (l.titulo) saida.push({ chave: `${chave}-t`, em: l.em - 0.1, altura: ALTURA.camposTitulo, momento: mi, c: { k: "camposTitulo", texto: l.titulo.toUpperCase() } });
      l.itens.forEach((it, i) =>
        saida.push({
          chave: `${chave}-${i}`,
          em: l.em + ((ate - l.em) * i) / Math.max(1, l.itens.length - 1),
          altura: ALTURA.campo,
          momento: mi,
          c: { k: "campo", texto: it.toUpperCase(), moeda },
        }),
      );
      return saida;
    }
  }
};

// Quanto o papel já avançou: soma das alturas impressas até `t` (cada linha avança em AVANCO_PAPEL s)
export const avanco = (t: number, blocos: Bloco[], suave: (x: number) => number) => {
  let h = PAD_TOPO;
  for (const b of blocos) {
    if (t <= b.em - 0.04) break;
    const p = Math.min(1, (t - (b.em - 0.04)) / AVANCO_PAPEL);
    h += b.altura * suave(p);
  }
  return h + PAD_PE;
};

// degrau (1…passos) de uma contagem entre `de` e `ate`
export const degrau = (t: number, de: number, ate: number, passos: number) => {
  if (t < de) return 0;
  return Math.max(1, Math.min(passos, Math.floor(((t - de) / Math.max(0.05, ate - de)) * passos) + 1));
};
