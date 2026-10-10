import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { askClaude } from "@/lib/claude";
import { jevLigado, perguntarAoJev, usoVazio, type PerguntaDoJev, type RespostaDoJev } from "@/lib/jev/cliente";
import { GUARDA_DE_IMAGEM, perfilDoProjeto } from "@/lib/media/perfil-do-projeto";
import {
  NOME_DA_PESSOA,
  NOME_DO_NEGOCIO,
  NOME_DO_TEXTO,
  temTextoParaClassificar,
  textosDoPerfil,
  type TextosDoPerfil,
  type TipoDeNegocio,
  type TipoDePessoa,
} from "@/lib/admin/perfis/categorias";
import { regrasAprovadas } from "@/lib/referencias/regras";
import { descricaoParaDecidir, modelosQueServem, resumoDoModelo, semTravessao } from "./biblioteca";
import { MODELOS_DO_CURSO, modeloServeNoCorte, type ModeloDoCurso } from "./no-corte";

/**
 * O MODELO DO CURSO RECOMENDADO PELO PERFIL (09/10/2026, noite).
 *
 * Regra do Bruno (09/10): "baseado no seu perfil, o estilo que eu recomendo é
 * este", e o cliente mantém ou muda. Nada de molde por nicho: quem DECIDE é o
 * JEV, numa pergunta `choice` entre os modelos que servem no corte, lendo o
 * perfil do projeto (o que o cliente faz, para quem fala, o tom, as regras que
 * ele aprovou, as guardas do setor) e, de cada modelo, o nome e a descrição
 * oficial da skill. Confiança abaixo de 0,5 é "não sei": fica sem
 * recomendação, e a tela não inventa uma.
 *
 * O Haiku só ESCREVE o motivo em uma frase, a partir da escolha e do perfil,
 * sem inventar. Falhou, o motivo sai montado em código com o resumo do modelo.
 *
 * GUARDADA em project_memories (tipo "editor", chave "recomendacao-do-curso"),
 * com a data e o hash do estado (perfil e lista de opções). Só é refeita
 * quando não há uma guardada ou quando o hash mudou (o cliente mexeu no
 * perfil, ou um modelo novo passou a servir no corte). Custo esperado: o JEV
 * lê ~15 mil tokens (US$ 0,0006) e o Haiku escreve uma frase (US$ 0,002).
 */

const TIPO = "editor";
const CHAVE = "recomendacao-do-curso";
/** Sobe quando a pergunta ou o estado mudam de forma: as guardadas vencem. */
const VERSAO = 1;
export const CONFIANCA_MINIMA = 0.5;
export const ETAPA_DO_JEV = "modelo-do-curso";
const MODELO_DO_MOTIVO = "claude-haiku-4-5";

export type PerfilParaRecomendar = {
  textos: TextosDoPerfil;
  tom?: string;
  regrasDaEdicao: string[];
  /** A classificação do perfil pelo JEV (perfis_dos_projetos), quando confiante. */
  categoria?: string;
  negocio?: string;
  pessoa?: string;
};

export type RecomendacaoGuardada = {
  modelo: string | null;
  motivo: string | null;
  confianca: number | null;
  /** As três opções mais prováveis para o JEV (para o admin entender a escolha). */
  alternativas: Array<{ modelo: string; p: number }>;
  hash: string;
  em: string;
  custoUsd: number;
  fonte: "jev";
  motivoPor: "haiku" | "codigo" | null;
};

export type Recomendacao = { modelo: string; nome: string; motivo: string; confianca: number };

export type Perguntar = (
  ctx: { projectId: string; etapa: string; state: Record<string, unknown>; uso: ReturnType<typeof usoVazio> },
  perguntas: Record<string, PerguntaDoJev>
) => Promise<Record<string, RespostaDoJev>>;

export type Escrever = (sistema: string, mensagem: string, ctx: { projectId: string; onCusto: (usd: number) => void }) => Promise<string>;

// ── Sem banco (testável) ─────────────────────────────────────────────────────

/** Tem perfil para recomendar? O nome do projeto sozinho não basta. */
export function temPerfilParaRecomendar(p: PerfilParaRecomendar): boolean {
  return temTextoParaClassificar(p.textos) || Boolean(p.tom) || p.regrasDaEdicao.length > 0;
}

/** A impressão digital do estado: mudou o perfil ou a lista de opções, a recomendação venceu. */
export function hashDaRecomendacao(p: PerfilParaRecomendar, opcoes: string[]): string {
  const textos = Object.fromEntries(Object.entries(p.textos).sort(([a], [b]) => a.localeCompare(b)));
  const normal = JSON.stringify({
    v: VERSAO,
    textos,
    tom: p.tom ?? null,
    regras: [...p.regrasDaEdicao].sort(),
    categoria: p.categoria ?? null,
    negocio: p.negocio ?? null,
    pessoa: p.pessoa ?? null,
    opcoes: [...opcoes].sort(),
  }).toLowerCase();
  return createHash("sha256").update(normal).digest("hex").slice(0, 32);
}

/** O perfil em linhas legíveis (o mesmo texto vai para o JEV e para o Haiku). */
export function perfilEmLinhas(p: PerfilParaRecomendar, extra?: { setor?: string; guardas?: string[] }): Record<string, unknown> {
  const linhas: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p.textos)) if (v) linhas[NOME_DO_TEXTO[k as keyof TextosDoPerfil] ?? k] = v;
  if (p.tom) linhas["tom da marca"] = p.tom;
  if (p.categoria) linhas["categoria do perfil"] = p.categoria;
  if (p.negocio) linhas["para quem vende"] = p.negocio;
  if (p.pessoa) linhas["tipo de marca"] = p.pessoa;
  if (extra?.setor) linhas.setor = extra.setor;
  if (p.regrasDaEdicao.length) linhas["regras de edição aprovadas pelo cliente"] = p.regrasDaEdicao;
  if (extra?.guardas?.length) linhas["guardas do setor"] = extra.guardas;
  return linhas;
}

export function estadoDoJev(p: PerfilParaRecomendar, extra?: { setor?: string; guardas?: string[] }): Record<string, unknown> {
  return {
    contexto:
      "Uma plataforma edita os cortes verticais (Reels, TikTok, Shorts) de um cliente que grava a si mesmo falando para a câmera. Cada modelo de edição é um visual completo, do primeiro ao último quadro. Todo modelo funciona com qualquer assunto, mas cada um tem um clima (sóbrio, enérgico, calmo, luxuoso, técnico, didático, afetivo) e um universo visual que combina mais com uns clientes do que com outros. `cliente` traz o que se sabe dele: o que faz, para quem fala, o tom da marca, as regras que aprovou e as guardas do setor. Quem assiste aos vídeos é o público do cliente.",
    cliente: perfilEmLinhas(p, extra),
  };
}

export function perguntasDoJev(opcoes: ModeloDoCurso[]): Record<string, PerguntaDoJev> {
  return {
    modelo: {
      type: "choice",
      instructions:
        "Qual modelo de edição combina mais com `cliente`? Pese o que ele faz e o universo do negócio dele, o público para quem ele fala e o tom da marca. Um modelo cujo clima contraria o tom da marca ou as guardas do setor não serve.",
      criteria: Object.fromEntries(opcoes.map((m) => [m.id, `${m.nome}. ${descricaoParaDecidir(m)}`])),
    },
  };
}

/** Lê a escolha do JEV com a margem do "não sei". */
export function lerEscolha(r: RespostaDoJev | undefined, opcoes: string[]): { modelo: string | null; confianca: number | null; alternativas: Array<{ modelo: string; p: number }> } {
  if (!r || r.type !== "choice") return { modelo: null, confianca: null, alternativas: [] };
  const confianca = typeof r.confidence === "number" ? r.confidence : null;
  const alternativas = Object.entries(r.probabilities ?? {})
    .filter(([id, p]) => opcoes.includes(id) && typeof p === "number")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([modelo, p]) => ({ modelo, p: +p.toFixed(4) }));
  const valida = opcoes.includes(r.choice) && confianca !== null && confianca >= CONFIANCA_MINIMA;
  return { modelo: valida ? r.choice : null, confianca, alternativas };
}

/** O motivo montado em código, quando o Haiku não escreve: o perfil e o resumo do modelo, sem nada inventado. */
export function motivoEmCodigo(m: ModeloDoCurso, p: PerfilParaRecomendar): string {
  const assunto = p.textos.nicho ?? p.textos.cadastroFaz ?? p.textos.redesProduto;
  const resumo = resumoDoModelo(m);
  const r = resumo.charAt(0).toLowerCase() + resumo.slice(1);
  return semTravessao(`Combina com o seu perfil${assunto ? ` (${assunto.slice(0, 80)})` : ""}: ${r}`);
}

/** Limpa a frase do Haiku: sem aspas, sem travessão, sem o começo que a tela já diz, com teto. */
export function limparMotivo(bruto: string): string | null {
  let t = semTravessao(bruto.replace(/\s+/g, " ").trim()).replace(/^["'“”‘’]+|["'“”‘’]+$/g, "").trim();
  t = t.replace(/^baseado no seu perfil,?\s*/i, "").trim();
  if (t.length < 20) return null;
  if (t.length > 260) {
    const corte = t.lastIndexOf(" ", 250);
    t = `${t.slice(0, corte > 120 ? corte : 250).replace(/[\s,;:]+$/, "")}…`;
  }
  return t.replace(/\p{L}/u, (l) => l.toUpperCase());
}

export const SISTEMA_DO_MOTIVO = `Você escreve uma frase para a tela de escolha do estilo de edição de vídeo de uma plataforma. O modelo já foi escolhido pelo perfil do cliente; o seu trabalho é só dizer por que ele combina, em UMA frase em português do Brasil, falando com o cliente (você).
Regras:
- Use só o que está no perfil e na descrição do modelo. Não invente fato, número, resultado nem promessa.
- Cite o que o cliente faz ou para quem ele fala, e uma característica visual do modelo.
- Até 180 caracteres, sem aspas, sem emoji e sem travessão (use vírgula ou dois-pontos).
- Não comece com "Baseado no seu perfil" (a tela já diz isso).
Responda só com a frase.`;

export function mensagemDoMotivo(m: ModeloDoCurso, p: PerfilParaRecomendar, extra?: { setor?: string }): string {
  const perfil = Object.entries(perfilEmLinhas(p, extra))
    .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join("; ") : String(v)}`)
    .join("\n");
  return `PERFIL DO CLIENTE:\n${perfil}\n\nMODELO ESCOLHIDO: ${m.nome}\n${descricaoParaDecidir(m)}`;
}

// ── Com banco ────────────────────────────────────────────────────────────────

/** O perfil do projeto que a recomendação lê (só leituras baratas: sem logo, sem rede). */
export async function lerPerfilParaRecomendar(projectId: string): Promise<PerfilParaRecomendar | null> {
  const p = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, niche: true, targetAudience: true, voice: true, description: true, userId: true },
  });
  if (!p) return null;
  const [quem, lead, regras, classificacao] = await Promise.all([
    prisma.projectMemory.findUnique({ where: { projectId_type_key: { projectId, type: "perfil_proprio", key: "relatorio" } }, select: { value: true } }).catch(() => null),
    prisma.lead.findFirst({ where: { convertedUserId: p.userId }, select: { faz: true, setor: true, cargo: true }, orderBy: { createdAt: "desc" } }).catch(() => null),
    regrasAprovadas(projectId, ["edicao"]),
    // A tabela da classificação fica fora do Prisma e pode não existir ainda.
    prisma
      .$queryRawUnsafe<Array<{ categoria: string; categoriaNome: string; confianca: number | null; negocio: string | null; pessoa: string | null }>>(
        `SELECT categoria, "categoriaNome", confianca, negocio, pessoa FROM perfis_dos_projetos WHERE "projectId" = $1`,
        projectId
      )
      .catch(() => []),
  ]);
  const quemE = (quem?.value as { quemE?: { pessoa?: unknown; produto?: unknown; publico?: unknown; objetivo?: unknown } } | null)?.quemE ?? null;
  const c = classificacao[0];
  return {
    textos: textosDoPerfil({ nome: p.name, nicho: p.niche, publico: p.targetAudience, descricao: p.description, quemE, cadastro: lead }),
    tom: p.voice?.replace(/\s+/g, " ").trim().slice(0, 300) || undefined,
    regrasDaEdicao: regras.map((r) => r.texto).slice(0, 8),
    categoria: c && c.categoria !== "outros" && (c.confianca ?? 0) >= CONFIANCA_MINIMA ? c.categoriaNome : undefined,
    negocio: c?.negocio ? NOME_DO_NEGOCIO[c.negocio as TipoDeNegocio] : undefined,
    pessoa: c?.pessoa ? NOME_DA_PESSOA[c.pessoa as TipoDePessoa] : undefined,
  };
}

export async function recomendacaoGuardada(projectId: string): Promise<RecomendacaoGuardada | null> {
  const m = await prisma.projectMemory.findUnique({ where: { projectId_type_key: { projectId, type: TIPO, key: CHAVE } }, select: { value: true } });
  const v = m?.value as Partial<RecomendacaoGuardada> | null | undefined;
  return v && typeof v.hash === "string" ? (v as RecomendacaoGuardada) : null;
}

function paraTela(g: RecomendacaoGuardada | null): Recomendacao | null {
  if (!g?.modelo || !g.motivo || g.confianca === null) return null;
  const m = modeloServeNoCorte(g.modelo);
  return m ? { modelo: m.id, nome: m.nome, motivo: g.motivo, confianca: g.confianca } : null;
}

export type SituacaoDaRecomendacao = {
  recomendacao: Recomendacao | null;
  /** Falta calcular (sem guardada, ou o perfil mudou) e dá para calcular agora. */
  pendente: boolean;
};

/** A leitura rápida, sem chamada paga: a guardada, se ainda vale, e se falta calcular. */
export async function situacaoDaRecomendacao(
  projectId: string
): Promise<SituacaoDaRecomendacao & { perfil: PerfilParaRecomendar | null; hash: string | null; vencida: boolean }> {
  const [perfil, guardada] = await Promise.all([lerPerfilParaRecomendar(projectId), recomendacaoGuardada(projectId)]);
  if (!perfil || !temPerfilParaRecomendar(perfil)) return { recomendacao: null, pendente: false, perfil, hash: null, vencida: false };
  const hash = hashDaRecomendacao(perfil, modelosQueServem().map((m) => m.id));
  if (guardada && guardada.hash === hash) return { recomendacao: paraTela(guardada), pendente: false, perfil, hash, vencida: false };
  return { recomendacao: null, pendente: jevLigado(), perfil, hash, vencida: true };
}

const perguntarDeVerdade: Perguntar = (ctx, perguntas) => perguntarAoJev({ projectId: ctx.projectId, etapa: ctx.etapa, state: ctx.state, uso: ctx.uso }, perguntas);

const escreverDeVerdade: Escrever = (sistema, mensagem, ctx) =>
  askClaude(sistema, mensagem, {
    model: MODELO_DO_MOTIVO,
    maxTokens: 4000,
    timeoutMs: 30_000,
    usage: { projectId: ctx.projectId, operation: "modelo_do_curso_motivo" },
    onCusto: ctx.onCusto,
  });

/**
 * Recomenda (ou devolve a guardada que ainda vale). Só chama o JEV quando falta
 * calcular; JEV desligado ou com erro não grava nada e devolve sem
 * recomendação (a próxima visita tenta de novo; a falha do JEV não custa).
 */
export async function recomendarModelo(
  projectId: string,
  opcoes: { perguntar?: Perguntar; escrever?: Escrever } = {}
): Promise<SituacaoDaRecomendacao & { calculada: boolean; guardada: RecomendacaoGuardada | null }> {
  const s = await situacaoDaRecomendacao(projectId);
  const ligado = jevLigado() || Boolean(opcoes.perguntar);
  if (!s.perfil || !s.hash || !s.vencida || !ligado) {
    return { recomendacao: s.recomendacao, pendente: false, calculada: false, guardada: null };
  }
  const perfil = s.perfil;
  const opcoesDoCorte = modelosQueServem();
  const ids = opcoesDoCorte.map((m) => m.id);

  // O setor e as guardas vêm do perfil do projeto da edição (o mesmo que o diretor lê).
  const pp = await perfilDoProjeto(projectId);
  const extra = pp ? { setor: pp.setor.nome, guardas: pp.guardas.filter((g) => g !== GUARDA_DE_IMAGEM) } : undefined;

  const uso = usoVazio();
  let resposta: Record<string, RespostaDoJev>;
  try {
    resposta = await (opcoes.perguntar ?? perguntarDeVerdade)({ projectId, etapa: ETAPA_DO_JEV, state: estadoDoJev(perfil, extra), uso }, perguntasDoJev(opcoesDoCorte));
  } catch (e) {
    console.warn(`[modelo-do-curso] o JEV falhou na recomendação de ${projectId} (fica sem): ${e instanceof Error ? e.message : e}`);
    return { recomendacao: null, pendente: false, calculada: false, guardada: null };
  }
  const escolha = lerEscolha(resposta.modelo, ids);
  let custo = uso.custoUsd;
  let motivo: string | null = null;
  let motivoPor: RecomendacaoGuardada["motivoPor"] = null;
  const m = escolha.modelo ? MODELOS_DO_CURSO.find((x) => x.id === escolha.modelo) ?? null : null;
  if (m) {
    try {
      const bruto = await (opcoes.escrever ?? escreverDeVerdade)(SISTEMA_DO_MOTIVO, mensagemDoMotivo(m, perfil, extra), {
        projectId,
        onCusto: (usd) => {
          custo += usd;
        },
      });
      motivo = limparMotivo(bruto);
      if (motivo) motivoPor = "haiku";
    } catch (e) {
      console.warn(`[modelo-do-curso] o motivo não saiu pelo Haiku (vai o de código): ${e instanceof Error ? e.message : e}`);
    }
    if (!motivo) {
      motivo = motivoEmCodigo(m, perfil);
      motivoPor = "codigo";
    }
  }
  const guardada: RecomendacaoGuardada = {
    modelo: m?.id ?? null,
    motivo,
    confianca: escolha.confianca,
    alternativas: escolha.alternativas,
    hash: s.hash,
    em: new Date().toISOString(),
    custoUsd: +custo.toFixed(6),
    fonte: "jev",
    motivoPor,
  };
  await prisma.projectMemory.upsert({
    where: { projectId_type_key: { projectId, type: TIPO, key: CHAVE } },
    create: { projectId, type: TIPO, key: CHAVE, value: guardada as never },
    update: { value: guardada as never },
  });
  return { recomendacao: paraTela(guardada), pendente: false, calculada: true, guardada };
}
