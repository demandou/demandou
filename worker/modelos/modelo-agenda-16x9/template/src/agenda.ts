// A direção da agenda: onde a pessoa fica em cada momento, onde cada bloco de tempo cai, a escala
// da régua de horas e o anel do cronômetro. Tudo sai do plano — o aluno não escreve posições.
//
// Versão deitada (16:9), pela aula 9 do curso: a tela cheia é a base (a pessoa como foi gravada, os
// cartões numa coluna livre ao lado do peito); na folha, a pessoa vai para uma MOLDURA do lado
// direito, com o rosto centralizado e acompanhado, e o conteúdo ocupa o QUADRO à esquerda. As
// medidas são da tela virtual de 2400×1350 unidades (src/tema.ts).
import { Easing } from "remotion";
import { type Ret, escreverHora, lerHora, misturaRet, mistura, prog, troca } from "./anim";
import { type Caixa, type EstadoDaCaixa, QUADRO_16x9, type Rosto, rostoNaTela } from "./motor/caixa";
import type { Momento, Plano, TipoDeMomento } from "./plano";
import { type Categoria, CATEGORIAS, CONTEUDO, emUnidades, ESCALA, FOLHA, H, LIMITE_APP, LIMITE_PEITO, MARGEM, QUADRO, RAIA, TOPO_PEITO, W } from "./tema";

export type Lugar = "cheia" | "topo" | "lado" | "canto" | "alto";
export type CaixaPessoa = Required<Caixa>;
// os lugares da pessoa e a moldura da raia mais baixa, que deixa o anel do cronômetro embaixo dela
export type Lugares = Record<Lugar, CaixaPessoa> & { ladoComAnel: CaixaPessoa };

// O rosto do plano no quadro deitado (o cortar grava `rosto.quadro`; um plano antigo pode não ter)
export const rostoDoPlano = (plano: Plano): Rosto => {
  const r = plano.rosto as Rosto;
  return r.quadro ? r : { ...r, quadro: QUADRO_16x9 };
};
// a altura do vídeo de trabalho no quadro (1080 no 16:9)
export const alturaDoVideo = (plano: Plano) => Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
// a largura média do rosto (fração da largura do quadro), do rastro do cortar.mjs ou o padrão do 16:9 (~250 px)
export const larguraDoRosto = (plano: Plano) => {
  const l = (plano.rosto as Rosto).rastro?.largura;
  return l && l > 0.03 ? l : 0.13;
};

// duração de uma troca de layout; ela começa um pouco antes do `de` (o corte cai no meio do movimento)
export const TROCA = 0.6;
export const ANTES = 0.15;

// altura de um bloco sem `minutos` (qualitativo), em "minutos" da régua
export const UNIDADE = 30;

// Ajuste de segurança: ordena e impede que um momento invada o seguinte.
export const ordenar = (plano: Plano): Plano => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  return {
    ...plano,
    momentos: ordenados.map((m, i) => {
      const proximo = ordenados[i + 1];
      return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
    }),
  };
};

// ---------- a pessoa ----------

// As molduras da pessoa na folha (a aula 9: sempre do lado direito, a explicação à esquerda). Todas
// encostam na direita da folha; mudam a largura e a altura, e por isso a pessoa continua mudando de
// lugar a cada momento. Larguras em unidades da tela virtual.
const MOLDURA = { topo: 800, lado: 660, canto: 420, alto: 940 };
const ALTURA_CHEIA = CONTEUDO.base - CONTEUDO.topo;
// a moldura da raia com o anel do cronômetro embaixo dela
const LADO_COM_ANEL_H = 720;
// a moldura pequena do canto (ciclos): o anel contador fica embaixo dela
const CANTO_H = 480;
// o rosto ocupa esta fração da largura da moldura (centralizado nela)
const ROSTO_NA_MOLDURA = { topo: 0.36, lado: 0.4, canto: 0.46, alto: 0.34 };
// quanto o vídeo pode ser ampliado numa moldura (1 = os 1920 px do quadro na largura dele)
const AMPLIACAO_MAX = 1.3;

// Tela cheia: a pessoa como foi gravada (o vídeo cobre o quadro sem aproximar). As âncoras ficam no
// rosto: quando dois momentos seguidos em tela cheia alternam o enquadramento (1 ↔ 1,06), o vídeo
// aproxima em volta do rosto, sem mudar o lugar dele.
export const caixaCheia = (plano: Plano): CaixaPessoa => ({ x: 0, y: 0, w: W, h: H, raio: 0, zoom: 1, ancoraY: plano.rosto.y, ancoraX: plano.rosto.x });

// O zoom de uma moldura: o rosto ocupa `alvo` da largura dela, sem a cabeça passar da caixa
// (gravação muito perto da câmera) e sem ampliar o vídeo além de AMPLIACAO_MAX (nunca abaixo de 1,
// que é o vídeo inteiro cobrindo a caixa).
const zoomDaMoldura = (plano: Plano, c: CaixaPessoa, alvo: number): CaixaPessoa => {
  const cobre = Math.max(c.w / QUADRO.w, c.h / alturaDoVideo(plano));
  const rosto = larguraDoRosto(plano) * QUADRO.w * cobre;
  const desejado = (alvo * c.w) / rosto;
  const cabe = Math.min(0.62 * c.w, (0.75 * c.h) / 1.45) / rosto;
  const nitido = AMPLIACAO_MAX / (cobre * ESCALA);
  return { ...c, zoom: Math.max(1, Math.min(desejado, cabe, nitido)) };
};

const moldura = (w: number, h: number, raio: number, ancoraY: number): CaixaPessoa => ({
  x: RAIA.direita - w,
  y: CONTEUDO.topo,
  w,
  h,
  raio,
  zoom: 1,
  ancoraY,
  ancoraX: 0.5,
});

// Os lugares da pessoa (o compromisso de vídeo) dentro da folha da agenda
export const lugares = (plano: Plano): Lugares => ({
  cheia: caixaCheia(plano),
  // a moldura larga: os blocos e o conteúdo ficam no quadro à esquerda
  topo: zoomDaMoldura(plano, moldura(MOLDURA.topo, ALTURA_CHEIA, 28, 0.4), ROSTO_NA_MOLDURA.topo),
  // a moldura em pé, mais estreita: o quadro à esquerda fica mais largo
  lado: zoomDaMoldura(plano, moldura(MOLDURA.lado, ALTURA_CHEIA, 28, 0.4), ROSTO_NA_MOLDURA.lado),
  // a mesma raia, mais baixa: o anel do cronômetro fica embaixo da pessoa
  ladoComAnel: zoomDaMoldura(plano, moldura(MOLDURA.lado, LADO_COM_ANEL_H, 28, 0.42), ROSTO_NA_MOLDURA.lado),
  // pequena, no canto de cima: a agenda inteira aparece (ciclos) e o contador fica embaixo dela
  canto: zoomDaMoldura(plano, moldura(MOLDURA.canto, CANTO_H, 26, 0.46), ROSTO_NA_MOLDURA.canto),
  // a maior: a linha do dia e a frase ficam à esquerda
  alto: zoomDaMoldura(plano, moldura(MOLDURA.alto, ALTURA_CHEIA, 28, 0.42), ROSTO_NA_MOLDURA.alto),
});

// Onde o conteúdo de um bloco universal fica na folha, com a pessoa em `lugar`: o quadro à esquerda
// da moldura (nunca embaixo dela), da margem segura até 34 unidades antes da pessoa
export const AREA_ESQUERDA = MARGEM;
export const areaDoConteudo = (lugar: Lugar, L: Record<Lugar, CaixaPessoa>): Ret => {
  const P = L[lugar];
  const base = CONTEUDO.base - 6;
  const direita = lugar === "cheia" ? RAIA.direita : P.x - 34;
  return { x: AREA_ESQUERDA, y: CONTEUDO.topo, w: direita - AREA_ESQUERDA, h: base - CONTEUDO.topo };
};
// o quadro à esquerda é estreito (empilha o conteúdo em vez de pôr lado a lado)?
export const quadroEstreito = (area: Ret) => area.w < 900;

// ---------- os blocos ----------

export type BlocoNaAgenda = {
  id: string;
  indice: number;
  categoria: Categoria;
  titulo: string;
  // janela da fala em que as palavras do título são procuradas
  falaDe: number;
  falaAte: number;
  // minutos desde o início da agenda
  inicio: number;
  minutos: number;
  maxMinutos?: number;
  minutosEm?: number;
  maxEm?: number;
  // quando cai e se encaixa; quando o lugar dele aparece a lápis
  em: number;
  esbocoDe: number;
  momento: number;
  ciclo?: { n: number; em: number };
  cronometro?: { em: number; ate: number };
  final?: boolean;
  // sem `minutos`: altura padrão, sem duração nem horário calculado
  qualitativo?: boolean;
  // o horário de começo é conhecido (dito, ou a soma de durações ditas)
  horaConhecida: boolean;
  // o que a régua mostra na altura do bloco (texto pronto), quando não é um horário calculado
  quando?: string;
};

export type Cena = {
  lugar: Lugar;
  // a moldura da pessoa, quando não é a do lugar (a raia mais baixa, com o anel embaixo)
  pessoa?: CaixaPessoa;
  folha: number;
  modo: "agenda" | "linha" | "fora";
  escala: number;
  topoAgenda: number;
  // blocos que começam acima de `estreitaAte` ficam na raia estreita (até `direita`)
  direita: number;
  estreitaAte: number;
  linha: Ret;
  anel?: { cx: number; cy: number; d: number; modo: "contagem" | "ciclos"; noBloco?: string };
  // rótulos da régua: `texto` "hora" = o horário calculado; qualquer outro texto sai como está
  rotulos: { min: number; de: number; texto: string }[];
  fim: number;
  // blocos que existem nesta cena (cheios ou a lápis)
  ids: string[];
};

export type Trecho = { de: number; ate: number; momento: number | null; cena: Cena };

export type Agenda = {
  ordem: Momento[];
  inicio: number;
  blocos: BlocoNaAgenda[];
  trechos: Trecho[];
  total: number;
  L: Lugares;
  lugarDe: Lugar[];
  // algum bloco sem duração dita: a linha do dia e os cartões não mostram horário
  qualitativa: boolean;
  // a linha do peito (unidades): os cartões da tela cheia se centram nela
  peito: number;
  // nome da agenda no cabeçalho, a partir de cada instante
  titulos: { de: number; texto: string }[];
  // o rosto (com o quadro) e a altura do vídeo, para pôr os cartões ao lado do corpo
  rosto: Rosto;
  videoAltura: number;
  colunas: Map<string, Coluna>;
};

// ---------- geometria dos cartões (usada aqui e nos componentes) ----------

// Cartões da tela cheia. No vertical eles ficam no peito, embaixo do queixo; no quadro deitado não
// sobra altura embaixo do queixo, mas sobra largura dos lados da pessoa: o cartão vai numa COLUNA
// LIVRE ao lado do corpo, na altura do peito. A da esquerda vale quando cabe (a aula 9 põe a
// explicação à esquerda); senão, a da direita. A coluna é medida com o rosto em todo o trecho do
// momento (o rastro): o cartão nunca cobre o rosto, mesmo quando a pessoa se mexe. Pessoa tão perto
// da câmera que nenhum lado serve: o cartão vai embaixo, no peito, como no vertical.
export const CARTAO = { max: 1040, min: 620, pad: 44 };
export type Coluna = { x: number; w: number; lado: "esquerda" | "direita" | "embaixo" };
// folga entre o rosto (com o cabelo e as orelhas) e a coluna
const FOLGA_DO_ROSTO = 56;
export const colunaDoPeito = (ag: Agenda, de: number, ate: number): Coluna => {
  const chave = `${de.toFixed(2)}-${ate.toFixed(2)}`;
  const guardada = ag.colunas.get(chave);
  if (guardada) return guardada;
  const passos = Math.max(2, Math.min(40, Math.ceil((ate - de) / 0.25)));
  let min = Infinity;
  let max = -Infinity;
  let largura = 0;
  for (let i = 0; i <= passos; i++) {
    const t = Math.max(0, de + ((ate - de) * i) / passos);
    // as duas molduras da tela cheia (1 e 1,06): o rosto não pode cair na coluna em nenhuma
    for (const zoom of [1, 1.06]) {
      const p = rostoNaTela({ ...ag.L.cheia, zoom: ag.L.cheia.zoom * zoom }, ag.rosto, ag.videoAltura, t);
      min = Math.min(min, p.x);
      max = Math.max(max, p.x);
      largura = Math.max(largura, (ag.rosto.rastro?.largura && ag.rosto.rastro.largura > 0.03 ? ag.rosto.rastro.largura : 0.13) * QUADRO.w * p.escala);
    }
  }
  if (!Number.isFinite(min)) min = max = ag.rosto.x * W;
  const meio = Math.max(190, largura * 0.8) + FOLGA_DO_ROSTO;
  const esquerda = { x0: MARGEM, x1: min - meio };
  const direita = { x0: max + meio, x1: W - MARGEM };
  const we = esquerda.x1 - esquerda.x0;
  const wd = direita.x1 - direita.x0;
  let coluna: Coluna;
  if (we >= CARTAO.min || wd >= CARTAO.min) {
    const lado = we >= CARTAO.min ? esquerda : direita;
    const w = Math.min(CARTAO.max, lado.x1 - lado.x0);
    coluna = { x: Math.round(lado.x0 + (lado.x1 - lado.x0 - w) / 2), w: Math.round(w), lado: lado === esquerda ? "esquerda" : "direita" };
  } else {
    coluna = { x: Math.round((W - 1200) / 2), w: 1200, lado: "embaixo" };
  }
  ag.colunas.set(chave, coluna);
  return coluna;
};
// O topo de um cartão de altura `altura`: centrado na linha do peito, entre a etiqueta da câmera e
// os controles do player; embaixo (pessoa muito perto da câmera), encostado no limite de baixo. Com a
// legenda ligada no momento (`legenda: true`), o cartão termina acima dela.
export const ALTURA_DA_LEGENDA = 160;
export const yNoPeito = (ag: Agenda, altura: number, coluna?: Coluna, legenda = false) => {
  const limite = LIMITE_PEITO - (legenda ? ALTURA_DA_LEGENDA : 0);
  return coluna?.lado === "embaixo"
    ? Math.max(TOPO_PEITO, limite - altura)
    : Math.round(Math.max(TOPO_PEITO, Math.min(ag.peito - altura / 2, limite - altura)));
};
// Fechamento: cartão de evento ao lado do peito
export const CARTAO_CTA = { pad: 36, botao: 80, barra: 48 };
// Frase: a pessoa na moldura maior, à direita; a linha do dia no alto do quadro à esquerda (como a
// barra de um player) e a frase embaixo dela
const ALTO_X = RAIA.direita - MOLDURA.alto;
export const LINHA_FRASE: Ret = { x: MARGEM, y: CONTEUDO.topo + 20, w: ALTO_X - 34 - MARGEM, h: 104 };
// onde a frase começa (abaixo da linha e da etiqueta do horário)
export const TOPO_DA_FRASE = LINHA_FRASE.y + LINHA_FRASE.h + 14 + 58 + 34;

const ALTURA_MINIMA = 22;
// lugar da etiqueta do que fica de fora, embaixo do último bloco
export const ESPACO_SEM = 92 + 30;

const cronometroFinal = (f: NonNullable<Extract<Momento, { tipo: "ciclos" }>["final"]>, ate: number) => {
  if (f.cronometroEm === null) return undefined;
  const em = f.cronometroEm ?? Math.max(f.em, f.minutosEm ?? 0, f.maxEm ?? 0) + 0.45;
  return ate - 0.15 - em >= 0.4 ? { em, ate: ate - 0.15 } : undefined;
};

// ---------- montagem ----------

// Tipos com a pessoa em tela cheia (cartão no peito)
const NO_PEITO: TipoDeMomento[] = ["gancho", "abertura", "destaque", "pergunta", "cta"];
// Blocos universais na folha: lugares possíveis da pessoa, em ordem de preferência. Quando o
// momento anterior usou o primeiro, vai o segundo (o layout muda a cada momento).
const NA_FOLHA: Partial<Record<TipoDeMomento, Lugar[]>> = {
  topicos: ["topo", "lado"],
  passos: ["lado", "topo"],
  numero: ["topo", "lado"],
  comparacao: ["topo", "lado"],
  grafico: ["topo", "canto"],
  definicao: ["topo", "lado"],
};
export const ehUniversalNaFolha = (m: Momento) => m.tipo in NA_FOLHA;

// Lugar da pessoa em cada momento. Momentos seguidos na folha alternam os lugares (o layout muda a
// cada momento), a não ser que o plano fixe `pessoa`.
const lugarPadrao = (m: Momento, i: number, anterior: { tipo: Momento["tipo"]; lugar: Lugar } | undefined): Lugar => {
  if (m.tipo === "numero" && (m.pessoa === "cheia" || (!m.pessoa && i === 0 && m.de < 0.4))) return "cheia";
  if (NO_PEITO.includes(m.tipo)) return "cheia";
  switch (m.tipo) {
    case "blocos":
      return m.pessoa ?? (anterior?.tipo === "blocos" && anterior.lugar === "topo" ? "lado" : "topo");
    case "ciclos":
      return "canto";
    case "frase":
      return "alto";
    case "tarefas":
      return "topo";
  }
  // lista longa (4 ou 5 itens) cabe melhor na coluna alta, com a pessoa na raia
  const opcoes =
    m.tipo === "topicos" && m.itens.length >= 4
      ? (["lado", "topo"] as Lugar[])
      : m.tipo === "grafico" && !m.titulo?.trim()
        ? (["topo", "lado"] as Lugar[])
        : (NA_FOLHA[m.tipo] ?? ["topo"]);
  const pedido = "pessoa" in m ? m.pessoa : undefined;
  if (pedido === "topo" || pedido === "lado") return pedido;
  return anterior && anterior.lugar === opcoes[0] && opcoes[1] ? opcoes[1] : opcoes[0];
};

export const montarAgenda = (planoOriginal: Plano): Agenda => {
  const plano = ordenar(planoOriginal);
  const ordem = plano.momentos;
  const L = lugares(plano);

  // 1. blocos de tempo, na ordem em que entram na agenda
  const primeiroInicio = ordem.flatMap((m) => (m.tipo === "blocos" ? m.blocos : [])).map((b) => lerHora(b.inicio)).find((v) => v !== null);
  const inicio = lerHora(plano.agenda?.inicio) ?? primeiroInicio ?? 9 * 60;
  const blocos: BlocoNaAgenda[] = [];
  let cursor = 0;
  let conhecida = true;
  let ordinal = 0;
  let padraoDe = 0;
  let padrao: BlocoNaAgenda[] = [];
  ordem.forEach((m, i) => {
    if (m.tipo === "blocos") {
      m.blocos.forEach((b, j) => {
        const hora = lerHora(b.inicio);
        const comeca = hora !== null ? Math.max(0, hora - inicio) : cursor;
        const qualitativo = !(typeof b.minutos === "number" && b.minutos > 0);
        if (hora !== null) conhecida = true;
        const horaConhecida = conhecida && !qualitativo;
        if (qualitativo) ordinal++;
        const novo: BlocoNaAgenda = {
          id: `b${i}-${j}`,
          indice: blocos.length,
          categoria: b.categoria,
          titulo: b.titulo ?? CATEGORIAS[b.categoria].nome,
          falaDe: m.de,
          falaAte: m.ate,
          inicio: comeca,
          minutos: qualitativo ? UNIDADE : (b.minutos as number),
          em: b.em,
          esbocoDe: m.de - ANTES,
          momento: i,
          qualitativo,
          horaConhecida,
          quando: b.quando ?? (qualitativo ? (hora !== null ? escreverHora(hora) : String(ordinal)) : undefined),
        };
        blocos.push(novo);
        padrao.push(novo);
        cursor = Math.max(cursor, comeca + novo.minutos);
        if (qualitativo) conhecida = false;
      });
      const ultimo = blocos[blocos.length - 1];
      if (m.cronometro && ultimo && ultimo.momento === i && !ultimo.qualitativo) ultimo.cronometro = { em: m.cronometro.em, ate: m.cronometro.ate ?? m.ate - 0.15 };
    }
    if (m.tipo === "ciclos") {
      const span = cursor - padraoDe;
      if (padrao.length && span > 0) {
        padrao[0].ciclo = { n: 1, em: m.itens[0]?.em ?? m.de };
        const anterior = ordem[i - 1];
        const colado = anterior && anterior.tipo === "blocos" && m.de - anterior.ate < 0.3;
        for (let k = 1; k < m.itens.length; k++) {
          padrao.forEach((b, j) => {
            blocos.push({
              ...b,
              id: `${b.id}-c${k}`,
              indice: blocos.length,
              inicio: b.inicio + k * span,
              em: m.itens[k].em + j * 0.08,
              // o próximo ciclo já espera a lápis no fim do momento anterior; os outros, logo que a agenda encolhe
              esbocoDe: k === 1 && colado ? anterior.de + 0.9 : m.de + 0.3,
              momento: i,
              ciclo: j === 0 ? { n: k + 1, em: m.itens[k].em } : undefined,
              cronometro: undefined,
              horaConhecida: b.horaConhecida,
              // a cópia de um bloco sem horário repete o texto da régua só se ele foi escrito ("18:00", "Todo dia")
              quando: b.qualitativo && /^\d+$/.test(b.quando ?? "") ? undefined : b.quando,
            });
          });
        }
        cursor = padraoDe + Math.max(1, m.itens.length) * span;
      }
      if (m.final) {
        const f = m.final;
        blocos.push({
          id: `f${i}`,
          indice: blocos.length,
          categoria: f.categoria,
          titulo: f.titulo ?? CATEGORIAS[f.categoria].nome,
          falaDe: m.de,
          falaAte: m.ate,
          inicio: cursor,
          minutos: f.minutos,
          maxMinutos: f.maxMinutos,
          minutosEm: f.minutosEm,
          maxEm: f.maxEm,
          em: f.em,
          esbocoDe: m.de - ANTES,
          momento: i,
          final: true,
          horaConhecida: conhecida,
          // o anel conta a pausa longa depois que a faixa fecha (se sobrar tempo no momento)
          cronometro: cronometroFinal(f, m.ate),
        });
        cursor += f.maxMinutos ?? f.minutos;
      }
      padrao = [];
      padraoDe = cursor;
    }
  });
  const total = Math.max(1, ...blocos.map((b) => b.inicio + (b.maxMinutos ?? b.minutos)));
  const qualitativa = blocos.some((b) => b.qualitativo);

  // 2. trechos: um por momento; buraco longo entre momentos = pessoa em tela cheia com legenda
  const trechos: Trecho[] = [];
  const lugarDe: Lugar[] = [];
  ordem.forEach((m, i) => {
    const anterior = i > 0 && m.de - ordem[i - 1].ate < 1.2 ? { tipo: ordem[i - 1].tipo, lugar: lugarDe[i - 1] } : undefined;
    lugarDe.push(lugarPadrao(m, i, anterior));
  });
  const cenaDoMomento = (i: number): Cena => cenaPara(ordem[i], i, lugarDe[i], blocos, L, total);
  const cheia = (): Cena => ({ ...cenaVazia(), lugar: "cheia" });
  if (!ordem.length || ordem[0].de > 0.15) trechos.push({ de: -10, ate: ordem[0]?.de ?? 1e4, momento: null, cena: cheia() });
  ordem.forEach((m, i) => {
    const proximo = ordem[i + 1];
    const fimDoVideo = !proximo && m.ate >= plano.duracao - 0.3;
    trechos.push({ de: m.de <= 0.15 ? -10 : m.de, ate: proximo ? proximo.de : fimDoVideo ? 1e4 : m.ate, momento: i, cena: cenaDoMomento(i) });
    const buraco = (proximo ? proximo.de : plano.duracao) - m.ate;
    if (buraco > 1.2) {
      trechos[trechos.length - 1].ate = m.ate;
      trechos.push({ de: m.ate, ate: proximo ? proximo.de : 1e4, momento: null, cena: cheia() });
    }
  });

  // 3. o nome da agenda no cabeçalho
  const gancho = ordem.find((m) => m.tipo === "gancho");
  const titulos = [{ de: -10, texto: plano.agenda?.titulo ?? (gancho?.tipo === "gancho" ? gancho.resposta : undefined) ?? plano.marca.area ?? "" }];
  ordem.forEach((m) => {
    if (m.tipo === "blocos" && m.agenda?.trim()) titulos.push({ de: m.de - ANTES, texto: m.agenda.trim() });
  });

  // a linha do peito: um pouco acima da `zona` do cortar (que começa logo abaixo do queixo, em px do
  // quadro), entre 600 e 800 unidades
  const peito = Math.round(Math.min(800, Math.max(600, emUnidades(plano.zona?.topo ?? 700) - 60)));
  return {
    ordem,
    inicio,
    blocos,
    trechos,
    total,
    L,
    lugarDe,
    qualitativa,
    peito,
    titulos,
    rosto: rostoDoPlano(plano),
    videoAltura: alturaDoVideo(plano),
    colunas: new Map(),
  };
};

const cenaVazia = (): Cena => ({
  lugar: "cheia",
  folha: 0,
  modo: "fora",
  escala: 20,
  topoAgenda: CONTEUDO.topo,
  direita: RAIA.direita,
  estreitaAte: -1,
  linha: LINHA_FRASE,
  rotulos: [],
  fim: 1,
  ids: [],
});

const cenaPara = (m: Momento, i: number, lugar: Lugar, blocos: BlocoNaAgenda[], L: Lugares, total: number): Cena => {
  const P = L[lugar];
  const base = cenaVazia();
  // blocos que aparecem (cheios ou a lápis) até o fim deste momento
  const visiveis = blocos.filter((b) => b.momento <= i || b.esbocoDe < m.ate - ANTES - 0.01);
  const fim = Math.max(1, ...visiveis.map((b) => b.inicio + (b.maxMinutos ?? b.minutos)));
  const ids = visiveis.map((b) => b.id);

  if (lugar === "cheia") return { ...base, lugar };
  if (m.tipo === "frase") return { ...base, lugar, folha: 1, modo: "linha", linha: LINHA_FRASE, fim: total, ids: blocos.filter((b) => b.momento < i).map((b) => b.id) };
  if (m.tipo !== "blocos" && m.tipo !== "ciclos") return { ...base, lugar, folha: 1, modo: "fora" };

  // agenda (blocos e ciclos): no quadro deitado a régua e os blocos ficam sempre à esquerda da
  // moldura, do alto da folha até embaixo. O último horário da régua (centrado na linha do fim)
  // termina acima dos controles do player (y 984 px).
  let topo = CONTEUDO.topo;
  let baseY = Math.min(CONTEUDO.base - 2, LIMITE_APP - 22);
  let escala = Math.min(30, (baseY - topo) / fim);
  // o que fica de fora ("sem celular") vai dentro do último bloco, se ele for grande; senão, logo
  // abaixo dele: a agenda reserva esse lugar
  if (m.tipo === "blocos" && m.sem) {
    const ultimo = visiveis.filter((b) => b.momento === i).pop();
    if (ultimo && ultimo.minutos * escala < 300) {
      baseY -= ESPACO_SEM;
      escala = Math.min(30, (baseY - topo) / fim);
    }
  }
  // agenda comprida (muitos ciclos): a escala não desce do piso e a agenda rola para cima (os blocos
  // antigos somem embaixo do cabeçalho). No quadro deitado a folha é mais baixa: o piso é 4 por minuto
  // (um bloco de 30 minutos ainda tem 120 unidades e o título numa linha)
  const PISO = 4;
  if (escala < PISO) {
    escala = PISO;
    topo = Math.min(topo, baseY - fim * escala);
  }
  // anel: dentro do bloco (moldura larga) ou na coluna da pessoa, embaixo da moldura (que fica mais
  // baixa para ele caber)
  let anel: Cena["anel"];
  let pessoa: CaixaPessoa | undefined;
  const crono = m.tipo === "blocos" ? visiveis.find((b) => b.momento === i && b.cronometro) : undefined;
  const naRaia = (C: CaixaPessoa) => {
    const de = C.y + C.h + 26;
    const d = Math.min(C.w - 24, 420, baseY - de);
    return { cx: C.x + C.w / 2, cy: de + d / 2, d };
  };
  if (crono) {
    if (lugar === "topo") anel = { cx: 0, cy: 0, d: 0, modo: "contagem", noBloco: crono.id };
    else {
      const C = lugar === "lado" ? L.ladoComAnel : P;
      if (C !== P) pessoa = C;
      anel = { ...naRaia(C), modo: "contagem" };
    }
  }
  if (m.tipo === "ciclos") anel = { ...naRaia(P), modo: "ciclos" };
  // a moldura fica sempre na direita: todos os blocos são da largura do quadro à esquerda dela
  const estreitaAte = 1e4;

  // a régua: horários de começo conhecidos (foco/longa/compromisso; pausa se couber), o "quando"
  // dos blocos sem horário e o fim, se a duração do último foi dita
  const textoDe = (b: BlocoNaAgenda) => b.quando ?? (b.horaConhecida ? "hora" : undefined);
  const ultimo = [...visiveis].sort((a, b) => a.inicio + (a.maxMinutos ?? a.minutos) - (b.inicio + (b.maxMinutos ?? b.minutos))).pop();
  const candidatos = [
    // cada rótulo aparece junto com o lugar a lápis do bloco
    ...visiveis.filter((b) => b.categoria !== "pausa" || b.quando).map((b) => ({ min: b.inicio, de: b.esbocoDe, texto: textoDe(b) })),
    ...(ultimo && !ultimo.qualitativo && ultimo.horaConhecida ? [{ min: fim, de: Math.max(...visiveis.map((b) => b.esbocoDe)), texto: "hora" }] : []),
    ...visiveis.filter((b) => b.categoria === "pausa" && !b.quando).map((b) => ({ min: b.inicio, de: b.esbocoDe, texto: textoDe(b) })),
  ];
  const rotulos: Cena["rotulos"] = [];
  for (const c of candidatos) {
    if (!c.texto) continue;
    if (rotulos.some((r) => Math.abs(r.min - c.min) * escala < 62)) continue;
    rotulos.push({ min: c.min, de: c.de, texto: c.texto });
  }

  return {
    ...base,
    lugar,
    ...(pessoa ? { pessoa } : {}),
    folha: 1,
    modo: "agenda",
    escala,
    topoAgenda: topo,
    direita: P.x - 22,
    estreitaAte,
    anel,
    rotulos,
    fim,
    ids,
  };
};

// ---------- no tempo ----------

// Qual trecho vale em `t` e quanto a troca para ele já andou (0 = ainda no anterior, 1 = assentou)
export const trechoNoTempo = (t: number, trechos: Trecho[]) => {
  let k = 0;
  for (let i = 0; i < trechos.length; i++) if (trechos[i].de - ANTES <= t) k = i;
  const atual = trechos[k];
  const anterior = trechos[k - 1] ?? atual;
  const p = k === 0 ? 1 : prog(t, atual.de - ANTES, TROCA, troca);
  return { k, atual, anterior, p };
};

// A cortina: entre dois momentos na folha (quando um deles não é a agenda de blocos), a linha do
// "agora" varre a página de cima para baixo. Acima dela já está o momento novo; abaixo, ainda o
// anterior. Nunca há quadro vazio nem dois textos um sobre o outro.
export const DUR_CORTINA = 0.5;
export const CORTINA = { de: FOLHA.y + 92, ate: FOLHA.y + FOLHA.h };
const temCortina = (a: Cena, b: Cena) => a.folha > 0 && b.folha > 0 && (a.modo === "fora" || b.modo === "fora");

export type Cortina = { q: number; y: number; saindo: number | null; entrando: number | null; agendaSai: boolean; agendaEntra: boolean };
export const cortinaNoTempo = (ag: Agenda, t: number): Cortina | null => {
  const { k, atual, anterior } = trechoNoTempo(t, ag.trechos);
  if (k === 0 || !temCortina(anterior.cena, atual.cena)) return null;
  const q = prog(t, atual.de - ANTES, DUR_CORTINA, troca);
  if (q <= 0 || q >= 1) return null;
  return {
    q,
    y: mistura(CORTINA.de, CORTINA.ate, q),
    saindo: anterior.momento,
    entrando: atual.momento,
    agendaSai: anterior.cena.modo !== "fora",
    agendaEntra: atual.cena.modo !== "fora",
  };
};
// recorte de uma camada durante a cortina: a que sai fica abaixo da linha, a que entra, acima
// (`topo` e `altura`: a caixa da camada, se ela não for o quadro inteiro)
export const recorteDaCortina = (c: Cortina | null, papel: "sai" | "entra" | null, topo = 0, altura = H): string | undefined => {
  if (!c || !papel) return undefined;
  const y = c.y - topo;
  return papel === "sai" ? `inset(${y.toFixed(1)}px 0 0 0)` : `inset(0 0 ${(altura - y).toFixed(1)}px 0)`;
};

// Como o conteúdo de um momento na folha entra e sai, conforme o vizinho:
// - vindo da tela cheia: já está na folha quando a pessoa começa a encolher (ela o descobre);
// - vindo de outro momento na folha: a cortina o revela de cima para baixo;
// - indo para a tela cheia: fica até a pessoa cobrir a folha; indo para outro na folha: a cortina o
//   leva embora (nunca dois textos um sobre o outro).
export const entradaESaida = (ag: Agenda, i: number) => {
  const m = ag.ordem[i];
  const tr = ag.trechos.find((x) => x.momento === i);
  const k = tr ? ag.trechos.indexOf(tr) : -1;
  const antes = k > 0 ? ag.trechos[k - 1].cena : null;
  const depois = k >= 0 ? ag.trechos[k + 1]?.cena : undefined;
  const fim = tr?.ate ?? m.ate;
  const deCortina = !!antes && !!tr && temCortina(antes, tr.cena);
  const paraCortina = !!depois && !!tr && temCortina(tr.cena, depois);
  const paraCheia = !depois || depois.lugar === "cheia";
  return {
    i,
    deCortina,
    paraCortina,
    // instante em que o conteúdo começa a entrar e quanto tempo leva
    entra: m.de - ANTES,
    durEntra: deCortina ? 0.001 : 0.1,
    deslizar: false,
    // instante em que termina de sair e quanto tempo leva
    sai: paraCortina ? fim - ANTES + DUR_CORTINA : paraCheia ? fim - ANTES + 0.5 : fim - 0.05,
    durSai: paraCortina ? 0.001 : paraCheia ? 0.08 : 0.16,
    fim,
  };
};

// A caixa da pessoa em `t` (mesma conta do caixaNoTempo do motor, com a curva escolhida por troca):
// sair da tela cheia ou voltar para ela arranca rápido e assenta devagar — a folha embaixo aparece
// logo; entre dois lugares da folha, arranca e freia.
export type EstadoDaPessoa = EstadoDaCaixa & { rapido?: boolean };
const arranque = Easing.bezier(0.22, 0.75, 0.25, 1);
export const pessoaNoTempo = (t: number, estados: EstadoDaPessoa[]): CaixaPessoa => {
  let i = 0;
  for (let k = 0; k < estados.length; k++) if (estados[k].de <= t) i = k;
  const agora = { ...caixaCompleta, ...estados[i].caixa } as CaixaPessoa;
  if (i === 0) return agora;
  const antes = { ...caixaCompleta, ...estados[i - 1].caixa } as CaixaPessoa;
  const e = estados[i];
  const p = prog(t, e.de, e.dur ?? TROCA, e.rapido ? arranque : troca);
  const m = (a: number, b: number) => a + (b - a) * p;
  return {
    x: m(antes.x, agora.x),
    y: m(antes.y, agora.y),
    w: m(antes.w, agora.w),
    h: m(antes.h, agora.h),
    raio: m(antes.raio, agora.raio),
    zoom: m(antes.zoom, agora.zoom),
    ancoraY: m(antes.ancoraY, agora.ancoraY),
    ancoraX: m(antes.ancoraX, agora.ancoraX),
  };
};
const caixaCompleta: CaixaPessoa = { x: 0, y: 0, w: W, h: H, raio: 0, zoom: 1, ancoraY: 0.38, ancoraX: 0.5 };
// a moldura da pessoa numa cena
const caixaDaCena = (ag: Agenda, c: Cena) => c.pessoa ?? ag.L[c.lugar];

// Estados da caixa da pessoa. Corte no meio de um trecho ganha uma troca seca de enquadramento
// (1 ↔ 1,06) para disfarçar o pulo; dois momentos seguidos em tela cheia também alternam o
// enquadramento (seco, se houver um corte na fronteira; suave, se não houver).
export const estadosDaPessoa = (ag: Agenda, cortesEm: number[] = []): EstadoDaPessoa[] => {
  const estados: EstadoDaPessoa[] = [];
  let perto = false;
  ag.trechos.forEach((tr, i) => {
    const anterior = ag.trechos[i - 1];
    const rapido = i > 0 && (tr.cena.lugar === "cheia") !== (anterior.cena.lugar === "cheia");
    const cheiaCheia = i > 0 && tr.cena.lugar === "cheia" && anterior.cena.lugar === "cheia" && tr.momento !== null && anterior.momento !== null;
    if (cheiaCheia) {
      perto = !perto;
      const corte = cortesEm.find((c) => Math.abs(c - tr.de) < 0.35);
      const caixa = { ...ag.L.cheia, zoom: ag.L.cheia.zoom * (perto ? 1.06 : 1) };
      estados.push(corte !== undefined ? { de: corte, caixa, dur: 0.001 } : { de: tr.de - ANTES, caixa, dur: TROCA });
      return;
    }
    perto = false;
    estados.push({ de: i === 0 ? -10 : tr.de - ANTES, caixa: caixaDaCena(ag, tr.cena), dur: i === 0 ? 0.001 : TROCA, rapido });
  });
  const trocas = ag.trechos.slice(1).map((tr) => tr.de - ANTES);
  for (const c of cortesEm) {
    if (trocas.some((x) => c > x - 0.6 && c < x + TROCA + 0.5)) continue;
    const antes = [...estados].sort((a, b) => a.de - b.de).filter((e) => e.de <= c).pop();
    if (!antes) continue;
    const tr = [...ag.trechos].reverse().find((x) => x.de - ANTES <= c);
    const padrao = tr ? caixaDaCena(ag, tr.cena) : ag.L.cheia;
    const aproximado = (antes.caixa.zoom ?? 1) > padrao.zoom + 0.001;
    estados.push({ de: c, caixa: { ...padrao, zoom: padrao.zoom * (aproximado ? 1 : 1.06) }, dur: 0.001 });
  }
  return estados.sort((a, b) => a.de - b.de);
};

// Minutos de um bloco agora (o bloco final estica de `minutos` até `maxMinutos` em `maxEm`)
export const minutosAgora = (b: BlocoNaAgenda, t: number) =>
  b.maxMinutos && b.maxEm !== undefined ? mistura(b.minutos, b.maxMinutos, prog(t, b.maxEm, 0.5)) : b.minutos;

// Retângulo de um bloco numa cena
export const retNaCena = (b: BlocoNaAgenda, c: Cena, minutos: number, total: number): Ret => {
  if (c.modo === "linha") {
    const L = c.linha;
    const vao = 5;
    const x = L.x + (b.inicio / total) * L.w;
    const w = Math.max(4, ((b.maxMinutos ?? minutos) / total) * L.w - vao);
    return { x, y: L.y, w, h: L.h };
  }
  const y = c.topoAgenda + b.inicio * c.escala;
  const h = Math.max(ALTURA_MINIMA, minutos * c.escala);
  const estreito = y < c.estreitaAte;
  return { x: RAIA.x, y: y + 3, w: (estreito ? c.direita : RAIA.direita) - RAIA.x, h: h - 6 };
};

// Retângulo de um bloco em `t`, já misturando a cena anterior com a atual (com um leve escalonamento)
export const retNoTempo = (b: BlocoNaAgenda, t: number, ag: Agenda) => {
  const { atual, anterior, k } = trechoNoTempo(t, ag.trechos);
  const min = minutosAgora(b, t);
  const de = atual.cena.modo === "fora" ? anterior.cena : atual.cena;
  // bloco que não existia na cena anterior já nasce no lugar da cena atual
  const antes = anterior.cena.modo === "fora" || !anterior.cena.ids.includes(b.id) ? de : anterior.cena;
  const paraLinha = atual.cena.modo === "linha";
  const atraso = paraLinha ? b.indice * 0.025 : 0;
  const p = k === 0 ? 1 : prog(t, atual.de - ANTES + atraso, paraLinha ? 0.5 : TROCA, troca);
  const ret = misturaRet(retNaCena(b, antes, min, ag.total), retNaCena(b, de, min, ag.total), p);
  // modo da cena que vale para o desenho (texto dentro do bloco só na agenda)
  const naAgenda = mistura(antes.modo === "agenda" ? 1 : 0, de.modo === "agenda" ? 1 : 0, p);
  // com a cortina (troca entre a agenda e um bloco universal na folha), os blocos entram e saem
  // inteiros: a linha do "agora" é que os revela ou os leva
  const cortina = k > 0 && temCortina(anterior.cena, atual.cena);
  const visivel = cortina
    ? anterior.cena.modo === "fora" && atual.cena.modo === "fora"
      ? 0
      : atual.cena.modo === "fora"
        ? 1 - prog(t, atual.de - ANTES + DUR_CORTINA, 0.001)
        : prog(t, atual.de - ANTES, 0.001)
    : mistura(anterior.cena.modo === "fora" ? 0 : 1, atual.cena.modo === "fora" ? 0 : 1, prog(t, atual.de - ANTES, anterior.cena.modo === "fora" ? 0.15 : 0.35));
  // o texto dentro do bloco some logo no começo de uma troca para a linha e volta no fim de uma
  // troca para a agenda (nunca passa voando por cima de outra coisa)
  const inicioTroca = atual.de - ANTES;
  const texto =
    antes.modo === "agenda" && de.modo === "agenda"
      ? 1
      : de.modo === "agenda"
        ? prog(t, inicioTroca + TROCA * 0.6, 0.3)
        : antes.modo === "agenda" && k > 0
          ? 1 - prog(t, inicioTroca, 0.16)
          : 0;
  return { ret, naAgenda, visivel, texto };
};

// O nome da agenda no cabeçalho em `t` (e o anterior, para a troca)
export const tituloNoTempo = (ag: Agenda, t: number) => {
  let k = 0;
  for (let i = 0; i < ag.titulos.length; i++) if (ag.titulos[i].de <= t) k = i;
  return { atual: ag.titulos[k], anterior: k > 0 ? ag.titulos[k - 1] : null };
};

export { H };
