import { TETO } from "@/lib/biblioteca-de-design/tipos";
import type { ModoDosPosts } from "@/lib/estilo-dos-posts/estilo-mestre";

/**
 * O ESTILO DOS POSTS (08/10/2026): os tipos e as regras puras.
 *
 * As decisões do Bruno, literais:
 *   - "isso precisa ser um quadro de chat para o usuário escrever como ele
 *     quer o estilo dos posts, ou ele pode escolher estilos da biblioteca";
 *   - "o usuário gera a campanha toda e só no final descobre que está
 *     faltando aprovar o estilo, as artes; está muito confuso".
 *
 * Então o estilo dos posts é UM passo, com duas portas (criar falando ou
 * escrevendo, ou escolher da biblioteca), e criar ou escolher JÁ É a
 * aprovação: o registro mora na identidade aprovada (lib/modelos-de-arte/
 * identidade.ts, campo `design`). O passo aparece no assistente do projeto e
 * em Configurações.
 *
 * 08/10, à tarde (as regras novas do Bruno): o estilo do projeto é o que vem
 * PREENCHIDO; quem manda em cada arte é o modelo escolhido para cada post,
 * antes de gerar (a seção "o modelo de cada post", abaixo).
 *
 * Quem escreve a ficha do design a partir do chat é o Claude (o redator da
 * biblioteca); quem compara com a biblioteca é o JEV. Aqui só se junta o que
 * o cliente escreveu e se decide o que a tela mostra.
 *
 * Módulo puro: a tela (componente de cliente) importa daqui.
 */

/** O design que é o estilo dos posts, como a tela mostra. */
export interface DesignDoEstilo {
  id: string;
  nome: string;
  descricao: string;
  previaUrl: string | null;
}

/** O estado do estilo dos posts de um projeto (GET /api/projects/[id]/estilo-dos-posts). */
export interface EstadoDoEstiloDosPosts {
  aprovada: boolean;
  aprovadaEm: string | null;
  /** O design da biblioteca aprovado como estilo, quando é ele que manda. */
  design: DesignDoEstilo | null;
  /** Os modelos do book escolhidos (quando o estilo é o book). */
  modelos: Array<{ id: string; nome: string }>;
  /** Artes de campanhas antigas que esperavam o estilo para sair. */
  aguardando: number;
  /** Só o dono muda o estilo, como a direção visual. */
  podeMudar: boolean;
  /**
   * O último modelo usado em cada tipo de post (08/10, escolha por post): é
   * com ele que a escolha de cada dia vem preenchida, e a pessoa vê e troca.
   */
  ultimos?: UltimosModelos;
  /** O estilo de edição que vale hoje no projeto, para o vídeo curto vir preenchido. */
  edicao?: ModeloDoPost | null;
  /**
   * O PADRÃO DOS POSTS DO PROJETO (08/10): "mestre" (o padrão de todo projeto:
   * toda peça segue o estilo do vídeo) ou "por-post" (o dono escolheu em
   * Configurações um estilo da biblioteca ou criou o dele). É com ele que a
   * escolha de cada post vem preenchida.
   */
  modo?: ModoDosPosts;
  /** O estilo mestre do projeto e o design de arte que sai dele (08/10). */
  mestre?: EstadoDoMestre | null;
}

/** O estilo mestre como a tela mostra (08/10). */
export interface EstadoDoMestre {
  /** O nome do estilo do vídeo ("Autoridade high ticket", ou "o seu estilo de vídeo"). */
  nome: string;
  referencia: string | null;
  estiloId: string | null;
  /** O design de arte que sai do estilo do vídeo, quando já foi feito. */
  design: DesignDoEstilo | null;
  /** O design gravado é o do estilo do vídeo de agora (false: muda na próxima arte, uma vez). */
  emDia: boolean;
}

// ─────────────────────────── o modelo de cada post ───────────────────────────

/**
 * O MODELO É ESCOLHIDO POR POST (08/10/2026). Decisão do Bruno, literal: "o
 * modelo precisa ser escolhido por post (quarta é um carrossel, precisa
 * escolher o modelo), quinta é uma foto (escolher modelo) etc... sexta é um
 * vídeo curto (short, reel e tiktok) escolher o estilo"; e "essa parte só cria
 * o modelo, depois no quadro a IA coloca o conteúdo dentro do modelo
 * selecionado ou criado".
 *
 * Então cada dia com peça visual leva a sua escolha, guardada onde a campanha
 * já guarda a configuração dos dias (o config do run na campanha por tema, o
 * `videoSemana` do projeto na semana do vídeo), sem coluna nova:
 *   - foto e carrossel: um MODELO da biblioteca (um design de imagem: do book,
 *     com `catalogoId`, ou criado por um cliente, com `designId`);
 *   - vídeo curto: o ESTILO DE EDIÇÃO do catálogo (`estiloId`), o mesmo que a
 *     jornada do vídeo já escolhe para o projeto;
 *   - infográfico e capa de artigo: não há modelo a escolher (o infográfico
 *     é desenhado em código), e o dia sai nas cores e na letra da marca
 *     (`marca: true`, a confirmação daquele dia).
 * A aprovação antes de gerar passa a ser esta: todo dia visual com a sua
 * escolha. Módulo puro: a tela importa daqui.
 *
 * 08/10, à noite, O ESTILO MESTRE (lib/estilo-dos-posts/estilo-mestre.ts):
 * foto, carrossel, vídeo por IA e vídeo curto ganham a mesma primeira opção,
 * `mestre: true`, que é o PADRÃO (a escolha de cada post vem com ela):
 *   - foto e carrossel no mestre: a arte usa o design mestre, o design que
 *     sai do estilo do vídeo;
 *   - vídeo por IA (`video-ia`): o mestre (a linguagem visual do estilo do
 *     vídeo), um estilo de vídeo do catálogo (`estiloId`) ou um estilo de
 *     vídeo criado a partir de uma ideia (`designId` de um design de vídeo);
 *   - vídeo curto no mestre: o corte sai no estilo do vídeo do projeto.
 */

/** Os formatos de post que têm peça visual. */
export type FormatoDoPost = "image" | "carousel" | "infographic" | "video" | "article" | "short";

/** O que cada formato pede: um modelo de arte, um estilo de edição, o estilo do vídeo por IA ou só a marca. */
export type OQueOPostPede = "modelo" | "edicao" | "video-ia" | "marca";

export function oQueOPostPede(formato: string | null | undefined): OQueOPostPede | null {
  if (formato === "image" || formato === "carousel") return "modelo";
  if (formato === "short") return "edicao";
  // O vídeo por IA (08/10, à noite): o estilo mestre, um estilo de vídeo da biblioteca ou um criado a partir de uma ideia.
  if (formato === "video") return "video-ia";
  if (formato === "infographic" || formato === "article") return "marca";
  return null;
}

/** Como a tela chama cada formato na linha do dia. */
export const ROTULO_DO_POST: Record<FormatoDoPost, string> = {
  image: "Foto",
  carousel: "Carrossel",
  infographic: "Infográfico",
  video: "Vídeo por IA",
  article: "Capa do artigo",
  short: "Vídeo curto (Shorts, Reels, TikTok)",
};

/** A escolha de um post. Só um dos campos manda, conforme o formato. */
export interface ModeloDoPost {
  /**
   * O ESTILO MESTRE (08/10, à noite): o post segue o estilo do vídeo do
   * projeto. Na foto e no carrossel, a arte usa o design mestre; no vídeo por
   * IA, a linguagem visual do estilo do vídeo; no corte, a edição do projeto.
   */
  mestre?: boolean;
  /** O design da biblioteca (imagem), criado por um cliente ou semente do book. */
  designId?: string | null;
  /** O modelo do book, quando o design é semente dele (o id do catálogo). */
  catalogoId?: string | null;
  /** O estilo de edição do vídeo curto (lib/media/catalogo-de-estilos.ts). */
  estiloId?: string | null;
  /** Infográfico, vídeo por IA e capa: o dia confirmado nas cores e na letra da marca. */
  marca?: boolean;
  /** O nome que a tela mostra. */
  nome?: string | null;
}

/** As escolhas da campanha, pela chave do dia ("1" a "7"). */
export type ModelosDosPosts = Record<string, ModeloDoPost>;

/** O último modelo usado em cada tipo de post do projeto. */
export type UltimosModelos = Partial<Record<"image" | "carousel" | "short", ModeloDoPost>>;

const ID_VALIDO = /^[A-Za-z0-9_-]{1,80}$/;

/** Lê uma escolha que veio da tela ou do banco; null quando não serve para nada. Puro. */
export function modeloDoPostValido(bruto: unknown): ModeloDoPost | null {
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return null;
  const b = bruto as Record<string, unknown>;
  const id = (v: unknown) => (typeof v === "string" && ID_VALIDO.test(v) ? v : null);
  const nome = typeof b.nome === "string" && b.nome.trim() ? b.nome.replace(/\s+/g, " ").trim().slice(0, 80) : null;
  const m: ModeloDoPost = {};
  const designId = id(b.designId);
  const catalogoId = id(b.catalogoId);
  const estiloId = id(b.estiloId);
  if (designId) m.designId = designId;
  if (catalogoId) m.catalogoId = catalogoId;
  if (estiloId) m.estiloId = estiloId;
  if (b.marca === true) m.marca = true;
  // O mestre manda sozinho: a escolha que diz "mestre" não leva modelo junto.
  if (b.mestre === true) return { mestre: true, ...(nome ? { nome } : {}) };
  if (!m.designId && !m.catalogoId && !m.estiloId && !m.marca) return null;
  if (nome) m.nome = nome;
  return m;
}

/**
 * A escolha serve ao que o post pede? O mestre serve a foto, carrossel, vídeo
 * por IA e vídeo curto; fora dele, modelo para foto e carrossel, estilo de
 * edição para o curto, estilo de vídeo (do catálogo ou criado) para o vídeo
 * por IA, marca para o resto. O vídeo por IA aceita também o `marca` das
 * campanhas de antes do estilo mestre (seguia o estilo visual da mídia). Puro.
 */
export function modeloServeAoPost(m: ModeloDoPost | null | undefined, pede: OQueOPostPede | null): boolean {
  if (!m || !pede) return false;
  if (m.mestre === true) return pede !== "marca";
  if (pede === "modelo") return Boolean(m.designId || m.catalogoId);
  if (pede === "edicao") return Boolean(m.estiloId);
  if (pede === "video-ia") return Boolean(m.estiloId || m.designId || m.marca === true);
  return m.marca === true;
}

/** A escolha do estilo mestre para um post. */
export const ESCOLHA_DO_MESTRE: ModeloDoPost = { mestre: true, nome: "Estilo mestre" };

/** Qual das três portas (estilo mestre, biblioteca, criar) a escolha de agora usa, para a tela abrir nela. Puro. */
export function opcaoDaEscolha(m: ModeloDoPost | null | undefined): "mestre" | "biblioteca" | "criar" {
  if (!m || m.mestre) return "mestre";
  return "biblioteca";
}

/** Todos os posts visuais no estilo mestre (a escolha "todas as peças seguem o estilo mestre"); os de marca, na marca. Puro. */
export function todosNoMestre(posts: PostVisual[]): ModelosDosPosts {
  const out: ModelosDosPosts = {};
  for (const p of posts) {
    const pede = oQueOPostPede(p.formato);
    if (!pede) continue;
    out[p.chave] = pede === "marca" ? { marca: true, nome: "Nas cores e na letra da sua marca" } : { ...ESCOLHA_DO_MESTRE };
  }
  return out;
}

/** Todos os posts que pedem estilo estão no mestre? (a tela marca "todas seguem o estilo mestre"). Puro. */
export function todosEstaoNoMestre(posts: PostVisual[], modelos: ModelosDosPosts | null | undefined): boolean {
  return posts.every((p) => {
    const pede = oQueOPostPede(p.formato);
    return !pede || pede === "marca" || modelos?.[p.chave]?.mestre === true;
  });
}

/** A escolha de um dia, só se ela serve ao formato daquele dia; senão null. Puro. */
export function modeloParaOFormato(bruto: unknown, formato: string | null | undefined): ModeloDoPost | null {
  const m = modeloDoPostValido(bruto);
  return m && modeloServeAoPost(m, oQueOPostPede(formato)) ? m : null;
}

/**
 * O modelo gravado no post pela esteira (08/10, `metadata.modeloDoPost`): todo
 * refazer da arte (chat do card, refazer a peça, a Vera redesenhando) parte
 * dele, como a primeira arte partiu. O primeiro post do dia que tiver. Puro.
 */
export function modeloGravadoNosPosts(posts: Array<{ metadata?: unknown }>): ModeloDoPost | null {
  for (const p of posts) {
    const m = modeloDoPostValido((p.metadata as { modeloDoPost?: unknown } | null)?.modeloDoPost);
    if (m) return m;
  }
  return null;
}

/**
 * A ESCOLHA DE UM DIA NA CAMPANHA POR TEMA (08/10), como a esteira lê do
 * config. Na semana, pela chave do dia (a mesma do `weeklySchedule`). No post
 * único, a única escolha que veio: o dia dele é recalculado pela data marcada
 * (lib/pipeline/executar.ts, diasDaCampanha), e a chave da janela pode não
 * bater com ele perto da meia-noite. Puro.
 */
export function escolhaDoDiaNaCampanha(config: { campaignMode?: string | null; modelosDosPosts?: Record<string, unknown> | null }, dayOfWeek: number): unknown {
  const escolhas = config.modelosDosPosts ?? {};
  if (config.campaignMode === "single") return Object.values(escolhas)[0];
  return escolhas[String(dayOfWeek)];
}

/** Um post visual da campanha, como a lista dos modelos mostra. */
export interface PostVisual {
  /** A chave do dia ("1" a "7"). */
  chave: string;
  /** "Quarta", "Qua 08/10": quem chama decide. */
  rotulo: string;
  formato: FormatoDoPost;
}

/** Os posts que ainda não têm a escolha que o formato pede. Puro. */
export function postsSemModelo(posts: PostVisual[], modelos: ModelosDosPosts | null | undefined): PostVisual[] {
  return posts.filter((p) => !modeloServeAoPost(modelos?.[p.chave], oQueOPostPede(p.formato)));
}

/** Só as escolhas dos posts que existem, e que servem ao formato deles (o que vai para a esteira). Puro. */
export function modelosParaGravar(posts: PostVisual[], modelos: ModelosDosPosts | null | undefined): ModelosDosPosts {
  const out: ModelosDosPosts = {};
  for (const p of posts) {
    const m = modeloParaOFormato(modelos?.[p.chave], p.formato);
    if (m) out[p.chave] = m;
  }
  return out;
}

/**
 * A ESCOLHA JÁ PREENCHIDA, que a pessoa vê e troca.
 *
 * 08/10, à noite: o ESTILO MESTRE é o padrão. Todo dia sem escolha (foto,
 * carrossel, vídeo por IA e vídeo curto) vem no estilo mestre, a primeira
 * opção da lista. Só quando o dono escolheu em Configurações um estilo próprio
 * para os posts (`modo: "por-post"`) vale a regra de antes: o último modelo
 * usado naquele tipo de post, senão o estilo dos posts aprovado no projeto; o
 * vídeo curto, o último estilo de edição, senão o do projeto; sem nada disso,
 * o mestre. Infográfico e capa saem confirmados na marca. Dia que já tem
 * escolha válida não muda. Puro.
 */
export function preencherModelos(
  posts: PostVisual[],
  atuais: ModelosDosPosts | null | undefined,
  o: { ultimos?: UltimosModelos | null; padraoDaImagem?: ModeloDoPost | null; padraoDaEdicao?: ModeloDoPost | null; modo?: ModoDosPosts | null }
): ModelosDosPosts {
  const out: ModelosDosPosts = { ...(atuais ?? {}) };
  const proprio = o.modo === "por-post";
  for (const p of posts) {
    const pede = oQueOPostPede(p.formato);
    if (modeloServeAoPost(out[p.chave], pede)) continue;
    let sugerido: ModeloDoPost | null | undefined = null;
    if (pede === "modelo") {
      const tipo = p.formato === "carousel" ? "carousel" : "image";
      sugerido = proprio ? (o.ultimos?.[tipo] ?? o.padraoDaImagem ?? ESCOLHA_DO_MESTRE) : ESCOLHA_DO_MESTRE;
    } else if (pede === "edicao") {
      sugerido = proprio ? (o.ultimos?.short ?? o.padraoDaEdicao ?? ESCOLHA_DO_MESTRE) : ESCOLHA_DO_MESTRE;
    } else if (pede === "video-ia") {
      sugerido = ESCOLHA_DO_MESTRE;
    } else if (pede === "marca") {
      sugerido = { marca: true, nome: "Nas cores e na letra da sua marca" };
    }
    const valido = modeloParaOFormato(sugerido, p.formato);
    if (valido) out[p.chave] = valido;
    else delete out[p.chave];
  }
  return out;
}

/**
 * COMO A ARTE DE UM POST É DESENHADA, pela escolha dele (08/10, à noite): o
 * design mestre, um modelo do book, um design da biblioteca (de imagem, criado
 * ou escolhido), só a marca, ou um estilo de vídeo (o vídeo por IA e o curto:
 * a capa sai na marca, sem modelo de imagem). Null sem escolha: vale a regra
 * do projeto. É o que lib/media/arte-com-frase.tsx (marcaDaArte) segue. Puro.
 */
export function comoOPostDesenha(m: ModeloDoPost | null | undefined): "mestre" | "book" | "design" | "marca" | "estilo-de-video" | null {
  if (!m) return null;
  if (m.mestre) return "mestre";
  if (m.catalogoId) return "book";
  if (m.designId) return "design";
  if (m.estiloId) return "estilo-de-video";
  if (m.marca) return "marca";
  return null;
}

/**
 * OS MODELOS DA ARTE DE UM POST (08/10): o escolhido para o post manda e é o
 * único; sem ele, o design aprovado do projeto; sem ele, os modelos do book.
 * É a regra que lib/media/arte-com-frase.tsx (marcaDaArte) aplica. Puro.
 */
export function modelosDaPeca(o: { doPost?: string | null; doProjeto?: string | null; book?: string[] | null }): string[] | undefined {
  if (o.doPost) return [o.doPost];
  if (o.doProjeto) return [o.doProjeto];
  return o.book?.length ? o.book : undefined;
}

/** A peça pode gastar com a arte? Com a identidade aprovada no projeto, ou com a escolha feita para o post. Puro. */
export function pecaAprovada(o: { identidadeAprovada: boolean | null | undefined; escolhidoParaOPost: boolean }): boolean {
  return Boolean(o.identidadeAprovada) || o.escolhidoParaOPost;
}

/**
 * O estilo dos posts aprovado no projeto como escolha de um post: o design
 * criado (ou escolhido) em Fotos e estilo, ou o primeiro modelo do book
 * aprovado. Null sem aprovação: aí a pessoa escolhe. Puro.
 */
export function padraoDaImagemDoEstado(e: Pick<EstadoDoEstiloDosPosts, "aprovada" | "design" | "modelos"> | null | undefined): ModeloDoPost | null {
  if (!e?.aprovada) return null;
  if (e.design) return { designId: e.design.id, nome: e.design.nome };
  const m = e.modelos[0];
  return m ? { catalogoId: m.id, nome: m.nome } : null;
}

/** A escolha de um post a partir de um design da galeria. Puro. */
export function escolhaDoDesign(d: { id: string; nome: string; catalogoId?: string | null }): ModeloDoPost {
  return { designId: d.id, ...(d.catalogoId ? { catalogoId: d.catalogoId } : {}), nome: d.nome };
}

/**
 * O design serve àquele tipo de post? O modelo do book diz os formatos dele
 * (post, carrossel, story); o design criado por cliente é uma imagem inteira
 * com a manchete por cima e serve aos dois. Vídeo nunca serve a post de
 * imagem. `formatosDoBook` vem de quem chama (o catálogo), para este módulo
 * não carregar o book inteiro. Puro.
 */
export function designServeAoPost(
  d: { tipo: string; catalogoId?: string | null },
  formato: FormatoDoPost,
  formatosDoBook?: (catalogoId: string) => readonly string[] | null | undefined
): boolean {
  if (d.tipo !== "imagem") return false;
  if (!d.catalogoId || !formatosDoBook) return true;
  const formatos = formatosDoBook(d.catalogoId);
  if (!formatos) return true;
  return formato === "carousel" ? formatos.includes("carrossel") : formatos.includes("post");
}

/**
 * O pedido que vai à biblioteca a partir das mensagens do chat: a primeira é
 * o estilo, as seguintes são ajustes ("mais escuro", "sem pessoa"), e o
 * último ajuste manda. Cabe no teto do pedido: passando, saem os ajustes mais
 * antigos, nunca o primeiro pedido nem o último ajuste.
 */
export function pedidoDaConversa(mensagens: string[], teto: number = TETO.pedido): string {
  const limpas = mensagens.map((m) => String(m ?? "").replace(/\s+/g, " ").trim()).filter(Boolean);
  if (!limpas.length) return "";
  const [primeira, ...ajustes] = limpas;
  const montar = (lista: string[]) =>
    lista.length ? `${primeira.replace(/[.;\s]+$/, "")}. Ajustes pedidos depois, na ordem (o último manda): ${lista.map((a, i) => `${i + 1}) ${a.replace(/[.;\s]+$/, "")}`).join("; ")}.` : primeira;
  let lista = ajustes;
  let pedido = montar(lista);
  while (pedido.length > teto && lista.length > 1) {
    lista = lista.slice(1);
    pedido = montar(lista);
  }
  if (pedido.length <= teto) return pedido;
  // Nem o primeiro pedido com o último ajuste cabe: o primeiro encolhe.
  const fim = lista.length ? `. Ajuste pedido depois (manda): ${lista[lista.length - 1]}.` : "";
  return `${primeira.slice(0, Math.max(0, teto - fim.length)).trim()}${fim}`.slice(0, teto);
}

/** A linha que diz como os posts saem hoje. */
export function resumoDoEstilo(e: (Pick<EstadoDoEstiloDosPosts, "aprovada" | "design" | "modelos"> & Partial<Pick<EstadoDoEstiloDosPosts, "modo" | "mestre">>) | null | undefined): string {
  // O ESTILO MESTRE (08/10, à noite): o padrão de todo projeto.
  if (e?.modo === "mestre") return e.mestre?.nome ? `Seus posts seguem o estilo mestre, o do vídeo (${e.mestre.nome}).` : "Seus posts seguem o estilo mestre, o do vídeo.";
  // Design gravado sem aprovação (08/10, revisão): a aprovação caiu depois de
  // uma mudança na marca (cores, letra). Dizer "ainda não foi escolhido" com a
  // descrição do design logo ao lado era mentira na tela.
  if (!e?.aprovada) return e?.design ? `O estilo "${e.design.nome}" precisa ser aprovado de novo: a marca mudou depois da escolha.` : "O estilo dos posts ainda não foi escolhido.";
  if (e.design) return `Seus posts saem no estilo "${e.design.nome}".`;
  const nomes = e.modelos.map((m) => `"${m.nome}"`);
  if (!nomes.length) return "Seus posts saem no estilo aprovado.";
  if (nomes.length === 1) return `Seus posts saem no modelo ${nomes[0]}.`;
  return `Seus posts saem nos modelos ${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}.`;
}

/*
 * A trava do estilo do projeto antes de gerar (precisaEscolherEstilo e
 * artesEsperamODono, 08/10 de manhã) saiu à tarde: a aprovação antes de gerar
 * passou a ser a escolha do modelo de cada post (`postsSemModelo`), que o
 * membro da equipe também faz. Ninguém fica parado num passo que não pode
 * cumprir, e a arte do membro não espera mais o dono.
 */
