// A direção da agenda: onde a pessoa fica em cada momento, onde cada bloco de tempo cai, a escala
// da régua de horas e o anel do cronômetro. Tudo sai do plano — o aluno não escreve posições.
import { Easing } from "remotion";
import { type Ret, escreverHora, lerHora, misturaRet, mistura, prog, troca } from "./anim";
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import type { Momento, Plano, TipoDeMomento } from "./plano";
import { type Categoria, CATEGORIAS, CONTEUDO, FOLHA, H, LIMITE_PEITO, RAIA, W } from "./tema";

export type Lugar = "cheia" | "topo" | "lado" | "canto" | "alto";
export type CaixaPessoa = Required<Caixa>;

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

// altura da pessoa "no alto" (frase): a linha do dia e a frase vêm logo abaixo
const ALTO_H = 680;

// Tela cheia: o menor zoom que deixa o rosto na linha do centro sem borda vazia (até 1,25)
export const caixaCheia = (plano: Plano): CaixaPessoa => {
  const fx = plano.rosto.x;
  const zoom = Math.min(1.25, Math.max(1, 0.5 / Math.max(0.01, Math.min(fx, 1 - fx))));
  return { x: 0, y: 0, w: W, h: H, raio: 0, zoom, ancoraY: plano.rosto.y };
};

// Gravação muito perto da câmera (rosto largo): nas caixas estreitas o zoom desce até a cabeça
// caber inteira (nunca abaixo de 1, que é o vídeo inteiro cobrindo a caixa).
const zoomQueCabe = (plano: Plano, c: CaixaPessoa) => {
  const largura = (plano.rosto as { rastro?: { largura?: number } }).rastro?.largura;
  if (!largura) return c;
  const cobre = Math.max(c.w / 1080, c.h / Math.min(1920, plano.videoAltura ?? 1920));
  const rosto = largura * 1080 * cobre;
  const maximo = Math.min(0.62 * c.w, (0.75 * c.h) / 1.45) / rosto;
  return { ...c, zoom: Math.max(1, Math.min(c.zoom, maximo)) };
};

// Os lugares da pessoa (o compromisso de vídeo) dentro da folha da agenda
export const lugares = (plano: Plano): Record<Lugar, CaixaPessoa> => {
  const L = lugaresPadrao(plano);
  return { ...L, lado: zoomQueCabe(plano, L.lado), canto: zoomQueCabe(plano, L.canto) };
};
const lugaresPadrao = (plano: Plano): Record<Lugar, CaixaPessoa> => ({
  cheia: caixaCheia(plano),
  // larga, em cima: os blocos caem embaixo
  topo: { x: 64, y: CONTEUDO.topo, w: 952, h: 620, raio: 28, zoom: 1, ancoraY: 0.5 },
  // raia da direita, em pé: os blocos ficam na raia da esquerda e o anel embaixo da pessoa
  lado: { x: 584, y: CONTEUDO.topo, w: 432, h: 820, raio: 28, zoom: 1.75, ancoraY: 0.36 },
  // pequena, no canto de cima: a agenda inteira aparece (ciclos)
  canto: { x: 676, y: CONTEUDO.topo, w: 340, h: 420, raio: 26, zoom: 2, ancoraY: 0.5 },
  // grande, no alto: a frase e a linha do dia embaixo
  alto: { x: 64, y: CONTEUDO.topo, w: 952, h: ALTO_H, raio: 28, zoom: 1, ancoraY: 0.48 },
});

// Onde o conteúdo de um bloco universal fica na folha, com a pessoa em `lugar` (nunca embaixo dela)
export const AREA_ESQUERDA = 64;
export const areaDoConteudo = (lugar: Lugar, L: Record<Lugar, CaixaPessoa>): Ret => {
  const P = L[lugar];
  const base = CONTEUDO.base - 6;
  if (lugar === "lado" || lugar === "canto") return { x: AREA_ESQUERDA, y: CONTEUDO.topo, w: P.x - 34 - AREA_ESQUERDA, h: base - CONTEUDO.topo };
  const y = P.y + P.h + 34;
  return { x: AREA_ESQUERDA, y, w: 952, h: base - y };
};

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
  L: Record<Lugar, CaixaPessoa>;
  lugarDe: Lugar[];
  // algum bloco sem duração dita: a linha do dia e os cartões não mostram horário
  qualitativa: boolean;
  // topo mínimo dos cartões no peito (abaixo do queixo)
  peito: number;
  // nome da agenda no cabeçalho, a partir de cada instante
  titulos: { de: number; texto: string }[];
};

// ---------- geometria dos cartões (usada aqui e nos componentes) ----------

// Cartões no peito: começam abaixo do queixo e nunca descem até a interface do app
export const CARTAO = { x: 60, w: 960 };
export const yNoPeito = (ag: Agenda, altura: number) => Math.max(880, Math.min(ag.peito, LIMITE_PEITO - altura));
// Gancho: cartão da pergunta/resposta no peito, com a pilha de avisos embaixo
export const CARTAO_GANCHO = { x: 60, y: 1000, w: 960 };
// Fechamento: cartão de evento no peito
export const CARTAO_CTA = { x: 60, y: 1000, w: 960, pad: 36, botao: 80, barra: 48 };
// Frase: a linha do dia logo abaixo da pessoa (como a barra de um player) e a frase embaixo dela
export const LINHA_FRASE: Ret = { x: FOLHA.x + 24, y: CONTEUDO.topo + ALTO_H + 26, w: FOLHA.w - 48, h: 104 };
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

  const peito = Math.round(Math.min(1200, Math.max(1000, (plano.zona?.topo ?? 970) + 12)));
  return { ordem, inicio, blocos, trechos, total, L, lugarDe, qualitativa, peito, titulos };
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

const cenaPara = (m: Momento, i: number, lugar: Lugar, blocos: BlocoNaAgenda[], L: Record<Lugar, CaixaPessoa>, total: number): Cena => {
  const P = L[lugar];
  const base = cenaVazia();
  // blocos que aparecem (cheios ou a lápis) até o fim deste momento
  const visiveis = blocos.filter((b) => b.momento <= i || b.esbocoDe < m.ate - ANTES - 0.01);
  const fim = Math.max(1, ...visiveis.map((b) => b.inicio + (b.maxMinutos ?? b.minutos)));
  const ids = visiveis.map((b) => b.id);

  if (lugar === "cheia") return { ...base, lugar };
  if (m.tipo === "frase") return { ...base, lugar, folha: 1, modo: "linha", linha: LINHA_FRASE, fim: total, ids: blocos.filter((b) => b.momento < i).map((b) => b.id) };
  if (m.tipo !== "blocos" && m.tipo !== "ciclos") return { ...base, lugar, folha: 1, modo: "fora" };

  // agenda (blocos e ciclos)
  let topo = lugar === "topo" ? P.y + P.h + 26 : CONTEUDO.topo;
  let baseY = CONTEUDO.base - 2;
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
  if (escala < 5) {
    escala = 5;
    topo = Math.min(topo, baseY - fim * escala);
  }
  const raiaAoLado = lugar === "lado" || lugar === "canto";
  // anel: dentro do bloco (pessoa em cima) ou na raia da pessoa, embaixo dela
  let anel: Cena["anel"];
  const crono = m.tipo === "blocos" ? visiveis.find((b) => b.momento === i && b.cronometro) : undefined;
  const naRaia = () => {
    const de = P.y + P.h + 26;
    const d = Math.min(P.w - 24, 420, baseY - de);
    return { cx: P.x + P.w / 2, cy: de + d / 2, d };
  };
  if (crono) anel = lugar === "topo" ? { cx: 0, cy: 0, d: 0, modo: "contagem", noBloco: crono.id } : { ...naRaia(), modo: "contagem" };
  if (m.tipo === "ciclos") anel = { ...naRaia(), modo: "ciclos" };
  const estreitaAte = lugar === "lado" ? 1e4 : lugar === "canto" ? (anel ? anel.cy + anel.d / 2 + 16 : P.y + P.h + 16) : -1;

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
    folha: 1,
    modo: "agenda",
    escala,
    topoAgenda: topo,
    direita: raiaAoLado ? P.x - 22 : RAIA.direita,
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
  };
};
const caixaCompleta: CaixaPessoa = { x: 0, y: 0, w: W, h: H, raio: 0, zoom: 1, ancoraY: 0.3 };

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
    estados.push({ de: i === 0 ? -10 : tr.de - ANTES, caixa: ag.L[tr.cena.lugar], dur: i === 0 ? 0.001 : TROCA, rapido });
  });
  const trocas = ag.trechos.slice(1).map((tr) => tr.de - ANTES);
  for (const c of cortesEm) {
    if (trocas.some((x) => c > x - 0.6 && c < x + TROCA + 0.5)) continue;
    const antes = [...estados].sort((a, b) => a.de - b.de).filter((e) => e.de <= c).pop();
    if (!antes) continue;
    const tr = [...ag.trechos].reverse().find((x) => x.de - ANTES <= c);
    const padrao = ag.L[tr?.cena.lugar ?? "cheia"];
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
