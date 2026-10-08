import { modeloDoPostValido, type ModeloDoPost, type PostVisual } from "@/lib/estilo-dos-posts/tipos";

/**
 * MATERIAL SEU NESTA CAMPANHA (08/10/2026): o que é puro.
 *
 * O pedido do Bruno, literal: "se ele quiser criar um design usando uma foto
 * dele, um cenário dele, o escritório dele, ele precisa subir esses
 * materiais. Durante a criação da campanha, mesmo que ele já tenha subido lá
 * na configuração, é legal ele ter a opção: você vai usar material seu, foto
 * sua, escritório seu? Vai usar essas que já existem ou vai subir uma nova?
 * (...) Aí ele seleciona quais fotos vai usar nessa campanha: a foto 1, a 5, a
 * 10. E em qual estilo cada foto vai se encaixar: deve escolher um estilo POR
 * FOTO, porque às vezes ele quer a foto dele num fundo preto com texto. Se for
 * carrossel, ele escolhe várias fotos."
 *
 * A escolha fica onde a campanha já guarda a configuração dos dias, sem
 * coluna nova: `config.materialProprio` na campanha por tema e
 * `videoSemana.material` na semana do vídeo (congelada no run em
 * `config.semana.material`). Três estados, e cada um diz a verdade na tela:
 *
 *   - sem resposta (campo ausente): vale a regra de hoje
 *     (lib/materiais/escolha.ts): o squad usa uma foto da biblioteca quando
 *     ela serve ao post, as marcadas em `materiaisDaCampanha` primeiro;
 *   - "não desta vez" (`usar: false`): nenhuma foto da biblioteca entra nesta
 *     campanha; as artes saem geradas no modelo de cada post;
 *   - "sim" (`usar: true` com fotos): cada foto vai para o post escolhido
 *     (foto ou carrossel), no estilo escolhido para ELA; foto que não foi
 *     escolhida não entra em post nenhum desta campanha, e o post sem foto sai
 *     com a arte gerada no modelo dele.
 *
 * O estilo de cada foto tem as mesmas três portas do resto da plataforma, na
 * mesma ordem: "Estilo mestre" (segue o estilo do post, que é o da campanha;
 * o padrão), "Da biblioteca" e "Criar o meu" (o modelo vira o daquela foto).
 * O "Estilo mestre" aqui entrega a decisão ao estilo que o post já tem (o
 * modelo escolhido para o dia, ou a regra do projeto); a derivação do design
 * mestre mora em outra frente e encaixa por cima sem mudar este formato.
 *
 * Módulo puro: a tela (componente de cliente), a esteira e o teste importam
 * daqui. Quem lê o banco e a foto é lib/media/arte-com-frase.tsx.
 */

/** As três portas do estilo de uma foto, na ordem da plataforma inteira. */
export const PORTAS_DO_ESTILO = ["mestre", "biblioteca", "criado"] as const;
export type PortaDoEstilo = (typeof PORTAS_DO_ESTILO)[number];

export const ROTULO_DA_PORTA: Record<PortaDoEstilo, string> = {
  mestre: "Estilo mestre",
  biblioteca: "Da biblioteca",
  criado: "Criar o meu",
};

/** O estilo de uma foto. Só "biblioteca" e "criado" carregam modelo; o mestre segue o post. */
export type EstiloDaFoto = { porta: "mestre" } | { porta: "biblioteca" | "criado"; modelo: ModeloDoPost };

export const ESTILO_MESTRE: EstiloDaFoto = { porta: "mestre" };

/** Uma foto escolhida para a campanha. */
export interface FotoDaCampanha {
  /** O id em materiais_do_cliente. */
  id: string;
  /** A chave do dia do post em que a foto entra ("1" a "7"); null: fica fora desta campanha. */
  post: string | null;
  /** A pessoa escolheu o post desta foto: a distribuição padrão não mexe mais nela. */
  postEscolhido?: boolean;
  estilo: EstiloDaFoto;
}

/** A escolha da campanha inteira. */
export interface MaterialProprio {
  /** true: "sim, usar fotos minhas"; false: "não desta vez". */
  usar: boolean;
  /** As fotos marcadas, na ordem em que a pessoa marcou (é a ordem das lâminas no carrossel). */
  fotos: FotoDaCampanha[];
}

/** Quantas fotos uma campanha leva, no máximo (o teto do envio da biblioteca). */
export const MAXIMO_DE_FOTOS = 20;

/** Os formatos em que uma foto do cliente entra: a foto do dia e as lâminas do carrossel. */
export const FORMATOS_COM_FOTO = ["image", "carousel"] as const;

const ID_VALIDO = /^[A-Za-z0-9_-]{1,80}$/;

/** O modelo de uma foto só serve se for de imagem (da biblioteca ou do book), nunca estilo de edição nem "só a marca". */
function modeloDeImagem(bruto: unknown): ModeloDoPost | null {
  const m = modeloDoPostValido(bruto);
  if (!m || !(m.designId || m.catalogoId)) return null;
  const { estiloId: _e, marca: _m, ...resto } = m;
  void _e;
  void _m;
  return resto;
}

/** Lê o estilo de uma foto; sem modelo que sirva, é o estilo mestre. Puro. */
export function estiloDaFotoValido(bruto: unknown): EstiloDaFoto {
  const b = bruto as { porta?: unknown; modelo?: unknown } | null;
  if (!b || typeof b !== "object") return ESTILO_MESTRE;
  if (b.porta === "biblioteca" || b.porta === "criado") {
    const modelo = modeloDeImagem(b.modelo);
    if (modelo) return { porta: b.porta, modelo };
  }
  return ESTILO_MESTRE;
}

/**
 * Lê a escolha que veio da tela ou do banco. Null quando não há resposta (a
 * regra de hoje). Fotos repetidas ou com id inválido saem; o teto vale. Puro.
 */
export function materialProprioValido(bruto: unknown): MaterialProprio | null {
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return null;
  const b = bruto as { usar?: unknown; fotos?: unknown };
  if (typeof b.usar !== "boolean") return null;
  const vistas = new Set<string>();
  const fotos: FotoDaCampanha[] = [];
  for (const f of Array.isArray(b.fotos) ? b.fotos : []) {
    const id = (f as { id?: unknown } | null)?.id;
    if (typeof id !== "string" || !ID_VALIDO.test(id) || vistas.has(id)) continue;
    vistas.add(id);
    const post = (f as { post?: unknown }).post;
    fotos.push({
      id,
      post: typeof post === "string" && /^[1-7]$/.test(post) ? post : null,
      ...((f as { postEscolhido?: unknown }).postEscolhido === true ? { postEscolhido: true } : {}),
      estilo: estiloDaFotoValido((f as { estilo?: unknown }).estilo),
    });
    if (fotos.length >= MAXIMO_DE_FOTOS) break;
  }
  return { usar: b.usar, fotos: b.usar ? fotos : [] };
}

/** Os posts da campanha que recebem foto do cliente: foto e carrossel. Puro. */
export function postsQueRecebemFoto(posts: PostVisual[]): PostVisual[] {
  return posts.filter((p) => (FORMATOS_COM_FOTO as readonly string[]).includes(p.formato));
}

/** Quantas fotos cabem num post: uma na foto do dia; uma por lâmina no carrossel. Puro. */
export function capacidadeDoPost(post: Pick<PostVisual, "formato">, laminas: number): number {
  if (post.formato === "image") return 1;
  if (post.formato === "carousel") return Math.max(1, Math.min(20, Math.floor(laminas) || 5));
  return 0;
}

/**
 * A REGRA PADRÃO DE DISTRIBUIÇÃO, que a pessoa pode trocar foto a foto:
 *
 *   1. a foto que a pessoa pôs num post fica nele (se o post ainda existe e
 *      ainda cabe: a foto do dia leva uma, o carrossel leva uma por lâmina);
 *      com `manterValidas`, TODA foto que já está num post válido fica (é o
 *      que vai para a esteira: exatamente o que a tela mostrou, e só a foto
 *      cujo post deixou de existir procura outro lugar);
 *   2. as outras, na ordem em que foram marcadas, vão uma para cada post com
 *      foto que ainda está sem nenhuma, na ordem dos dias;
 *   3. sobrando foto, ela vai para os carrosséis, em rodízio, até encher as
 *      lâminas;
 *   4. sobrando ainda (mais fotos que lugares), a foto fica fora, e a tela diz.
 *
 * Puro: devolve uma escolha nova, sem mexer na que veio.
 */
export function distribuirFotos(material: MaterialProprio, posts: PostVisual[], laminas: number, opcoes: { manterValidas?: boolean } = {}): MaterialProprio {
  if (!material.usar) return { usar: false, fotos: [] };
  const alvos = postsQueRecebemFoto(posts);
  const cap = new Map(alvos.map((p) => [p.chave, capacidadeDoPost(p, laminas)] as const));
  const ocupados = new Map<string, number>(alvos.map((p) => [p.chave, 0]));
  const cabe = (chave: string) => (ocupados.get(chave) ?? 0) < (cap.get(chave) ?? 0);
  const ocupar = (chave: string) => ocupados.set(chave, (ocupados.get(chave) ?? 0) + 1);

  const fotos = material.fotos.map((f) => ({ ...f }));
  const soltas: FotoDaCampanha[] = [];
  // 1. as escolhidas pela pessoa ficam, enquanto o post existe e cabe
  for (const f of fotos) {
    if (f.postEscolhido && f.post === null) continue; // "fica fora" é escolha também
    if ((f.postEscolhido || opcoes.manterValidas) && f.post && cap.has(f.post) && cabe(f.post)) {
      ocupar(f.post);
      continue;
    }
    f.post = null;
    delete f.postEscolhido;
    soltas.push(f);
  }
  // 2. uma para cada post ainda sem foto, na ordem dos dias
  for (const p of alvos) {
    if ((ocupados.get(p.chave) ?? 0) > 0) continue;
    const f = soltas.shift();
    if (!f) break;
    f.post = p.chave;
    ocupar(p.chave);
  }
  // 3. o resto vai para os carrosséis, em rodízio, até encher
  const carrosseis = alvos.filter((p) => p.formato === "carousel");
  while (soltas.length && carrosseis.some((c) => cabe(c.chave))) {
    for (const c of carrosseis) {
      if (!soltas.length) break;
      if (!cabe(c.chave)) continue;
      const f = soltas.shift()!;
      f.post = c.chave;
      ocupar(c.chave);
    }
  }
  // 4. o que sobrou fica fora (post null), e a tela mostra
  return { usar: true, fotos };
}

/**
 * O post ainda recebe esta foto? A foto do dia ocupada troca de lugar (sempre
 * pode); o carrossel cheio não recebe mais nenhuma (a tela desliga a opção,
 * senão a foto voltaria sozinha para outro lugar). Puro.
 */
export function postRecebeAFoto(material: MaterialProprio, id: string, post: Pick<PostVisual, "chave" | "formato">, laminas: number): boolean {
  if (post.formato === "image") return true;
  const outras = material.fotos.filter((f) => f.id !== id && f.post === post.chave).length;
  return outras < capacidadeDoPost(post, laminas);
}

/**
 * A pessoa põe a foto num post (ou tira de todos, com null). Se o post é uma
 * foto do dia já ocupada, a outra foto troca de lugar com esta. Depois, a
 * distribuição padrão arruma o resto. Puro.
 */
export function moverFoto(material: MaterialProprio, id: string, post: string | null, posts: PostVisual[], laminas: number): MaterialProprio {
  const fotos = material.fotos.map((f) => ({ ...f }));
  const esta = fotos.find((f) => f.id === id);
  if (!esta) return material;
  const antes = esta.post;
  const alvo = post ? postsQueRecebemFoto(posts).find((p) => p.chave === post) : null;
  if (post && !alvo) return material;
  if (alvo && alvo.formato === "image") {
    const outra = fotos.find((f) => f.id !== id && f.post === post);
    if (outra) {
      outra.post = antes;
      outra.postEscolhido = true;
    }
  }
  esta.post = post;
  esta.postEscolhido = true;
  return distribuirFotos({ ...material, fotos }, posts, laminas);
}

/** Marca ou desmarca uma foto da biblioteca. A recém-marcada entra no fim, com o estilo mestre. Puro. */
export function alternarFoto(material: MaterialProprio, id: string, posts: PostVisual[], laminas: number): MaterialProprio {
  const tem = material.fotos.some((f) => f.id === id);
  if (!tem && material.fotos.length >= MAXIMO_DE_FOTOS) return material;
  const fotos = tem ? material.fotos.filter((f) => f.id !== id) : [...material.fotos, { id, post: null, estilo: ESTILO_MESTRE }];
  return distribuirFotos({ usar: true, fotos }, posts, laminas);
}

/** A foto que acabou de subir na própria janela já entra marcada. Puro. */
export function comFotoNova(material: MaterialProprio | null, id: string, posts: PostVisual[], laminas: number): MaterialProprio {
  const base = material?.usar ? material : { usar: true, fotos: [] };
  if (base.fotos.some((f) => f.id === id)) return distribuirFotos(base, posts, laminas);
  return alternarFoto(base, id, posts, laminas);
}

/** Troca o estilo de uma foto. Puro. */
export function comEstiloDaFoto(material: MaterialProprio, id: string, estilo: EstiloDaFoto): MaterialProprio {
  return { ...material, fotos: material.fotos.map((f) => (f.id === id ? { ...f, estilo: estiloDaFotoValido(estilo) } : f)) };
}

/**
 * O que vai para a esteira: a escolha arrumada contra os posts que existem de
 * verdade no envio (a pessoa pode ter mudado um dia depois de escolher). "Sim"
 * sem nenhuma foto marcada não é escolha nenhuma: volta a regra de hoje
 * (undefined). Campanha sem dia de foto ou carrossel também (08/10, revisão):
 * a pergunta nem aparece na tela, então uma resposta antiga não pode mudar a
 * campanha escondida. Puro.
 */
export function materialParaGravar(material: MaterialProprio | null | undefined, posts: PostVisual[], laminas: number): MaterialProprio | undefined {
  const valido = materialProprioValido(material);
  if (!valido) return undefined;
  if (!postsQueRecebemFoto(posts).length) return undefined;
  if (!valido.usar) return { usar: false, fotos: [] };
  if (!valido.fotos.length) return undefined;
  return distribuirFotos(valido, posts, laminas, { manterValidas: true });
}

// ─────────────────────────── na geração ───────────────────────────

/**
 * Uma foto escolhida para um post, como a esteira lê: o id e o modelo do
 * estilo dela (null: segue o post). Tipo (e não interface) para caber no
 * metadata JSON do post sem conversão.
 */
export type FotoDoPost = {
  id: string;
  modelo: ModeloDoPost | null;
};

/**
 * As fotos de um post, como a geração lê. Null: não houve escolha, vale a
 * regra de hoje. Lista vazia: houve escolha e este post não leva foto do
 * cliente (nenhuma foto da biblioteca entra nele). Puro.
 */
export function fotosDoPost(material: unknown, chave: string | null | undefined): FotoDoPost[] | null {
  const m = materialProprioValido(material);
  if (!m) return null;
  if (!m.usar) return [];
  // "Sim" sem nenhuma foto marcada não é escolha: vale a regra de hoje.
  if (!m.fotos.length) return null;
  return m.fotos
    .filter((f) => f.post !== null && (chave == null || f.post === chave))
    .map((f) => ({ id: f.id, modelo: f.estilo.porta === "mestre" ? null : f.estilo.modelo }));
}

/**
 * As fotos de um dia na campanha por tema, como a esteira lê do config. No
 * post único, as fotos que a pessoa pôs no único post (o dia dele é
 * recalculado pela data, como em `escolhaDoDiaNaCampanha`). Puro.
 */
export function fotosDoDiaNaCampanha(config: { campaignMode?: string | null; materialProprio?: unknown }, dayOfWeek: number): FotoDoPost[] | null {
  return fotosDoPost(config.materialProprio, config.campaignMode === "single" ? null : String(dayOfWeek));
}

/**
 * A ESCOLHA DA ARTE DE UM POST: o modelo que vai para a marca e as fotos do
 * post. Na foto do dia, a foto com estilo próprio leva o modelo dela (é ele
 * que desenha o post inteiro); no "Estilo mestre", vale o modelo do post. No
 * carrossel, o modelo do post é o do carrossel, e cada lâmina com foto de
 * estilo próprio usa o dela. Fora de foto e carrossel, nenhuma foto do
 * cliente entra (lista vazia quando houve escolha). Puro.
 */
export function escolhaDaArteDoPost(o: { fotos: FotoDoPost[] | null; formato: string | null | undefined; modeloDoPost: ModeloDoPost | null | undefined }): { modeloDoPost: ModeloDoPost | null; fotos: FotoDoPost[] | null } {
  const modeloDoPost = o.modeloDoPost ?? null;
  if (o.fotos === null) return { modeloDoPost, fotos: null };
  if (o.formato === "image") {
    const fotos = o.fotos.slice(0, 1);
    return { modeloDoPost: fotos[0]?.modelo ?? modeloDoPost, fotos };
  }
  if (o.formato === "carousel") return { modeloDoPost, fotos: o.fotos };
  return { modeloDoPost, fotos: [] };
}

/**
 * EM QUE LÂMINA ENTRA CADA FOTO DO CARROSSEL: espalhadas, a primeira sempre
 * na capa (lâmina 1). Cinco lâminas e duas fotos: lâminas 1 e 3. Mais fotos
 * que lâminas não acontece (a distribuição respeita o teto); se acontecer, as
 * que sobram ficam fora. Devolve, por lâmina, o índice da foto ou null. Puro.
 */
export function laminasDasFotos(fotos: number, laminas: number): Array<number | null> {
  const n = Math.max(0, Math.floor(laminas));
  const k = Math.max(0, Math.min(Math.floor(fotos), n));
  const plano: Array<number | null> = Array.from({ length: n }, () => null);
  for (let i = 0; i < k; i++) plano[Math.floor((i * n) / k)] = i;
  return plano;
}

/** A foto de uma lâmina (ou da peça inteira, com `total` 1). Null: a lâmina sai sem foto do cliente. Puro. */
export function fotoDaLamina<T>(fotos: T[] | null | undefined, i: number, total: number): T | null {
  if (!fotos?.length) return null;
  if (total <= 1) return fotos[0] ?? null;
  const idx = laminasDasFotos(fotos.length, total)[i];
  return idx == null ? null : fotos[idx] ?? null;
}

/** O que o modelo tem para a foto, no formato que a decisão precisa (sem carregar o catálogo aqui). */
export interface ModeloParaAFoto {
  /** "nenhuma" (só texto), "recorte" (o lugar de "você") ou a zona da foto ("inteira", "topo"...). */
  foto: string;
  /** O modelo gera o visual pelo modelo de imagem (tem prompt). */
  porPrompt: boolean;
}

/**
 * COMO A FOTO ESCOLHIDA ENTRA NA ARTE (08/10). A pessoa escolheu ESTA foto
 * para ESTE post: ela entra sempre, e a pergunta é só o caminho.
 *
 *   - "referencia": o modelo gera o visual pelo modelo de imagem com a foto de
 *     referência (a regra geral de 05/10). Só onde isso já era a regra: a
 *     foto da PESSOA, com rosto, nos modelos com o lugar de "você"; e a foto
 *     que não é pessoa (produto, lugar) nos modelos com zona de foto;
 *   - "composicao": a foto real entra como foi tirada (tratada em luz e cor),
 *     composta em código no molde do modelo. É o caminho da foto da pessoa
 *     num modelo que não é "você" (o rosto nunca é refeito por IA fora do
 *     lugar de "você"), do modelo só de texto e de quando não há modelo.
 * Puro.
 */
export function caminhoDaFotoEscolhida(o: { modelo: ModeloParaAFoto | null; pessoa: boolean; rosto: boolean }): "referencia" | "composicao" {
  const m = o.modelo;
  if (!m || !m.porPrompt || m.foto === "nenhuma") return "composicao";
  if (m.foto === "recorte") return o.pessoa && o.rosto ? "referencia" : "composicao";
  return o.pessoa ? "composicao" : "referencia";
}

/**
 * O MOLDE DA COMPOSIÇÃO com a foto escolhida: o modelo do estilo quando ele
 * tem lugar para foto; no modelo só de texto (ou sem modelo), a foto manda,
 * porque ela foi escolhida para o post: a pessoa vai para o "Você na frente
 * do título" e o resto para a composição da família da marca. Puro.
 */
export function moldeDaFotoEscolhida(o: { modelo: Pick<ModeloParaAFoto, "foto"> | null; pessoa: boolean }): "modelo" | "voce" | "familia" {
  if (o.modelo && o.modelo.foto !== "nenhuma") return "modelo";
  return o.pessoa ? "voce" : "familia";
}

/**
 * As fotos escolhidas gravadas no post (`metadata.fotosEscolhidas`): o
 * refazer da arte (chat do card, refazer a peça, a Vera redesenhando) parte
 * delas, como a primeira arte partiu. Null: o post não tinha escolha (vale a
 * regra de hoje). Puro.
 */
export function fotosGravadasNosPosts(posts: Array<{ metadata?: unknown }>): FotoDoPost[] | null {
  for (const p of posts) {
    const v = (p.metadata as { fotosEscolhidas?: unknown } | null)?.fotosEscolhidas;
    if (!Array.isArray(v)) continue;
    return v
      .map((f) => {
        const id = (f as { id?: unknown } | null)?.id;
        if (typeof id !== "string" || !ID_VALIDO.test(id)) return null;
        return { id, modelo: modeloDeImagem((f as { modelo?: unknown }).modelo) };
      })
      .filter((f): f is FotoDoPost => f !== null);
  }
  return null;
}

/** O modelo de uma foto como vai no metadata (JSON puro). */
type ModeloNoMetadata = { designId?: string; catalogoId?: string; nome?: string };

/** O que vai no metadata do post: só quando houve escolha (lista vazia também é escolha). Puro. */
export function metadataDasFotosEscolhidas(fotos: FotoDoPost[] | null | undefined): { fotosEscolhidas?: Array<{ id: string; modelo: ModeloNoMetadata | null }> } {
  if (!fotos) return {};
  return {
    fotosEscolhidas: fotos.map((f) => ({
      id: f.id,
      modelo: f.modelo
        ? {
            ...(f.modelo.designId ? { designId: f.modelo.designId } : {}),
            ...(f.modelo.catalogoId ? { catalogoId: f.modelo.catalogoId } : {}),
            ...(f.modelo.nome ? { nome: f.modelo.nome } : {}),
          }
        : null,
    })),
  };
}

// ─────────────────────────── na tela ───────────────────────────

/**
 * Como a linha de cada post diz onde as fotos entram, sem prometer o que a
 * esteira não faz: na foto do dia, a foto com estilo próprio manda no post
 * inteiro (no lugar do modelo do dia); no carrossel, as lâminas com foto
 * levam o estilo de cada foto e as outras saem no modelo do carrossel. Puro.
 */
export function resumoDoPost(o: { post: PostVisual; fotos: Array<Pick<FotoDaCampanha, "estilo">>; laminas: number }): string {
  const proprios = o.fotos.filter((f) => f.estilo.porta !== "mestre").length;
  if (o.post.formato === "image") {
    if (!o.fotos.length) return "sem foto sua: a arte sai gerada no modelo do dia";
    return proprios ? "com a sua foto, no estilo escolhido para ela (no lugar do modelo do dia)" : "com a sua foto, no modelo do dia";
  }
  if (o.post.formato === "carousel") {
    if (!o.fotos.length) return "sem foto sua: as lâminas saem geradas no modelo do carrossel";
    const plano = laminasDasFotos(o.fotos.length, o.laminas);
    const comFoto = plano.map((x, i) => (x === null ? null : i + 1)).filter((x): x is number => x !== null);
    const lista = comFoto.length === 1 ? `a lâmina ${comFoto[0]}` : `as lâminas ${comFoto.slice(0, -1).join(", ")} e ${comFoto[comFoto.length - 1]}`;
    const resto = o.laminas - comFoto.length;
    const estilo = proprios ? ", cada uma no estilo dela" : ", no modelo do carrossel";
    return `${o.fotos.length === 1 ? "1 foto sua" : `${o.fotos.length} fotos suas`} em ${lista} de ${o.laminas}${estilo}${resto > 0 ? "; as outras lâminas saem geradas no modelo do carrossel" : ""}`;
  }
  return "";
}
