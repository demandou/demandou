import { estiloDoCatalogo, normalizarEscolha } from "@/lib/media/catalogo-de-estilos";
import { estiloIdDoComando } from "@/lib/media/estilo-do-comando";
import { LINGUAGEM_DOS_ESTILOS } from "@/lib/media/editor-por-comando/comando-dos-estilos";
import { FAMILIA, familiaPorPalavras } from "@/lib/media/editor-por-comando/linguagem";

/**
 * O ESTILO MESTRE (08/10/2026). Pedido do Bruno, literal: "sobre a arte do
 * carrossel, posts, estilo do vídeo de IA... tudo isso, o usuário pode
 * selecionar: deixar a IA criar a partir do estilo mestre selecionado (o
 * estilo do vídeo; aí toda arte segue o mesmo design), escolher um estilo da
 * biblioteca ou criar meu próprio estilo a partir de uma ideia".
 *
 * O ESTILO MESTRE é o estilo do vídeo do projeto: o comando do vídeo (escrito,
 * falado ou preenchido por uma miniatura) ou, sem comando, o estilo escolhido
 * no catálogo, sempre com as cores e a letra da marca. É o PADRÃO de toda peça
 * visual: foto, carrossel, vídeo por IA e o próprio corte.
 *
 * O DESIGN MESTRE é o design de arte que sai dele: o texto do estilo do vídeo
 * vira um pedido na biblioteca de design (o mesmo fluxo de quem cria um
 * estilo escrevendo: o JEV compara e separa o visual do dado do cliente, o
 * Claude escreve a ficha), e o design que volta é o molde de toda arte que
 * segue o mestre. Ele é refeito SÓ quando o estilo do vídeo muda: a
 * assinatura do pedido fica gravada com ele, e enquanto ela bate, nada de IA
 * (lib/estilo-dos-posts/design-mestre.ts).
 *
 * Módulo puro: a tela importa as opções e os textos daqui.
 */

/** As três portas do estilo de toda peça visual, NA MESMA ORDEM E COM O MESMO TEXTO em todo lugar. */
export const OPCOES_DE_ESTILO = [
  {
    id: "mestre",
    rotulo: "Estilo mestre",
    explicacao: "A IA cria a arte a partir do estilo do vídeo, nas cores e na letra da sua marca: todas as peças saem com o mesmo design.",
  },
  {
    id: "biblioteca",
    rotulo: "Da biblioteca",
    explicacao: "Escolha um estilo pronto da biblioteca, do mais usado ao menos.",
  },
  {
    id: "criar",
    rotulo: "Criar o meu",
    explicacao: "Conte a sua ideia, falando ou escrevendo, e a IA monta o seu estilo a partir dela.",
  },
] as const;

export type OpcaoDeEstilo = (typeof OPCOES_DE_ESTILO)[number]["id"];

/**
 * A escolha logo depois do estilo, em toda porta de entrada (08/10): todas as
 * peças seguem o estilo mestre (o padrão) ou a pessoa muda os posts, um a um.
 */
export const ESCOLHAS_DOS_POSTS = [
  {
    id: "mestre",
    rotulo: "Todas as peças seguem o estilo mestre",
    explicacao: "O vídeo, as artes, os carrosséis e o vídeo por IA saem no mesmo design, o do estilo acima.",
  },
  {
    id: "por-post",
    rotulo: "Quero mudar os posts",
    explicacao: "Escolha post a post: o estilo mestre, um da biblioteca ou um estilo seu, criado falando ou escrevendo.",
  },
] as const;

export type ModoDosPosts = (typeof ESCOLHAS_DOS_POSTS)[number]["id"];

/** O estilo mestre de um projeto, como a tela mostra e como a biblioteca recebe. */
export interface EstiloMestre {
  /** O estilo do catálogo, quando o mestre é um deles (a miniatura ou a escolha). */
  estiloId: string | null;
  /** Como a tela chama o estilo mestre. */
  nome: string;
  /** "estilo Vox", quando existe. */
  referencia: string | null;
  origem: "comando" | "catalogo";
  /** O texto do estilo do vídeo, como pedido de arte à biblioteca de design. */
  pedido: string;
  /** A assinatura do pedido: mudou o estilo do vídeo, muda a assinatura. */
  assinatura: string;
}

/** O que o projeto tem do vídeo para chegar ao estilo mestre. */
export interface FonteDoMestre {
  /** O comando do vídeo (config.comandoDoVideo), quando o editor por comando está ligado. */
  comando?: { texto: string; referencia?: string | null } | null;
  /** Project.videoEstiloEscolha, cru. */
  escolha?: unknown;
  videoStyle?: string | null;
}

const PREFIXO_DO_PEDIDO = "A arte dos posts (foto e carrossel) no mesmo design do vídeo:";

/** FNV-1a de 32 bits em 8 hex, do texto sem caixa e sem espaço repetido. Puro. */
export function assinaturaDoTexto(texto: string): string {
  const t = String(texto ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  let h = 0x811c9dc5;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/**
 * O ESTILO MESTRE do projeto, do comando ou do catálogo. A assinatura só
 * muda quando o estilo do vídeo muda (o texto do comando, o estilo do
 * catálogo ou a nota escrita nele): trocar a legenda, o cenário ou a trilha
 * não refaz o design mestre. Puro.
 */
export function estiloMestreDe(f: FonteDoMestre): EstiloMestre {
  const texto = f.comando?.texto?.replace(/\s+/g, " ").trim() ?? "";
  if (texto.length >= 3) {
    const id = estiloIdDoComando(f.comando ?? null);
    const e = id ? estiloDoCatalogo(id) : undefined;
    const pedido = `${PREFIXO_DO_PEDIDO} ${texto}`.slice(0, 1500);
    return {
      estiloId: e?.id ?? null,
      nome: e ? e.nome : "o seu estilo de vídeo",
      referencia: e?.referencia ?? null,
      origem: "comando",
      pedido,
      assinatura: assinaturaDoTexto(pedido),
    };
  }
  const escolha = normalizarEscolha(f.escolha, f.videoStyle ?? null);
  const e = estiloDoCatalogo(escolha.estiloId);
  const ficha = LINGUAGEM_DOS_ESTILOS[escolha.estiloId];
  const base = ficha?.comando ?? (e ? `Estilo ${e.nome}${e.referencia ? ` (${e.referencia})` : ""}: ${e.resumo}` : `Estilo ${escolha.estiloId}`);
  const nota = escolha.texto?.replace(/\s+/g, " ").trim();
  const pedido = `${PREFIXO_DO_PEDIDO} ${base}${nota ? ` Do jeito do cliente: ${nota}` : ""}`.slice(0, 1500);
  return {
    estiloId: e?.id ?? escolha.estiloId,
    nome: e?.nome ?? escolha.estiloId,
    referencia: e?.referencia ?? null,
    origem: "catalogo",
    pedido,
    assinatura: assinaturaDoTexto(pedido),
  };
}

/** O design mestre como fica gravado no projeto (ProjectMemory estilo/design-mestre). */
export interface DesignMestreGuardado {
  designId: string;
  nome: string;
  descricao: string;
  /** A assinatura do estilo do vídeo de quando o design foi feito. */
  assinatura: string;
  estiloId: string | null;
  feitoEm: string;
}

/** Lê o registro gravado; null quando não serve. Puro. */
export function designMestreValido(bruto: unknown): DesignMestreGuardado | null {
  if (!bruto || typeof bruto !== "object") return null;
  const b = bruto as Record<string, unknown>;
  if (typeof b.designId !== "string" || !b.designId || typeof b.assinatura !== "string" || !b.assinatura) return null;
  return {
    designId: b.designId,
    nome: typeof b.nome === "string" ? b.nome : "Design mestre",
    descricao: typeof b.descricao === "string" ? b.descricao : "",
    assinatura: b.assinatura,
    estiloId: typeof b.estiloId === "string" ? b.estiloId : null,
    feitoEm: typeof b.feitoEm === "string" ? b.feitoEm : "",
  };
}

/** O design mestre gravado ainda é o do estilo do vídeo de agora? Puro. */
export function designMestreEmDia(guardado: DesignMestreGuardado | null | undefined, mestre: Pick<EstiloMestre, "assinatura">): boolean {
  return Boolean(guardado && guardado.assinatura === mestre.assinatura);
}

/**
 * A LINGUAGEM VISUAL DE UM ESTILO DE VÍDEO DO CATÁLOGO, para o vídeo por IA
 * (08/10): o bloco pesquisado do estilo (materiais, luz, grão, composição, o
 * que evitar), em inglês, o mesmo que o editor põe nos prompts de imagem e de
 * B-roll. Sem ficha, a semente da família que as palavras do estilo indicam.
 * Nunca a cena: o assunto vem do roteiro do dia. Puro.
 */
export function linguagemDoEstiloDeVideo(estiloId: string | null | undefined): string | null {
  const e = estiloId ? estiloDoCatalogo(estiloId) : undefined;
  if (!e) return null;
  const ficha = LINGUAGEM_DOS_ESTILOS[e.id];
  if (ficha?.bloco) return ficha.bloco;
  return `Visual language: ${FAMILIA[familiaPorPalavras(`${e.id} ${e.resumo}`)].semente}. Brand colors only as small accents and details, never a flat color wash.`;
}
