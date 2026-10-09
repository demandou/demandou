import { prisma } from "@/lib/db/prisma";
import { askClaude } from "@/lib/claude";
import { jevLigado, perguntarAoJev, usoVazio } from "@/lib/jev/cliente";
import { coresDaMarca } from "@/lib/media/capa-composta";
import { perfilDoProjeto } from "@/lib/media/perfil-do-projeto";
import { destinoDoVideo, type ContextoDaJornada } from "@/lib/media/jornada/contexto";
import { cenarioDaEscolha } from "@/lib/media/cenario-do-video";
import { MODELO_DAS_IDEIAS, type Redator } from "@/lib/media/jornada/ideias";
import type { Jev } from "@/lib/media/jornada/decisoes";
import type { CaixaDaEdicao } from "@/lib/media/teto-da-edicao";

/**
 * As dependências DE VERDADE da jornada que tocam banco e IA paga: o contexto
 * do projeto, o redator (Sonnet, só escreve) e o JEV (decide). Os módulos
 * puros (planejar, revisao, prompts, geracao, montagem) recebem isto por
 * injeção; os testes passam simulações.
 *
 * A CAIXA DA EDIÇÃO (08/10): quem cria o redator e o JEV pode passar a caixa
 * do teto (lib/media/teto-da-edicao.ts), e cada chamada paga soma o custo
 * real nela. É assim que o diretor entra no teto de US$ 1 por minuto.
 */

/** O comando de estilo que o cliente escreveu, literal ("" sem comando). */
export async function estiloDoCliente(projectId: string): Promise<string> {
  const r = await prisma.$queryRaw<Array<{ t: string | null }>>`SELECT config -> 'comandoDoVideo' ->> 'texto' AS t FROM projects WHERE id = ${projectId}`;
  return String(r[0]?.t ?? "").trim();
}

/** O contexto do projeto para os pedidos ao Sonnet: empresa, nicho, perfil, cores e o estilo do cliente. */
export async function contextoDoProjeto(projectId: string, formato: "9:16" | "16:9", duracao: number): Promise<ContextoDaJornada> {
  const [p, perfil, estilo] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId }, select: { name: true, niche: true, colorPalette: true, videoEstiloEscolha: true } }),
    perfilDoProjeto(projectId).catch(() => null),
    estiloDoCliente(projectId).catch(() => ""),
  ]);
  const perfilTexto = perfil ? [perfil.publico ? `Público: ${perfil.publico}` : "", perfil.tom ? `Tom: ${perfil.tom}` : "", perfil.mundo ? `Mundo do cliente: ${perfil.mundo}` : ""].filter(Boolean).join(" ") : null;
  return {
    marca: p?.name ?? null,
    nicho: p?.niche ?? null,
    perfil: perfilTexto || null,
    cores: coresDaMarca(p?.colorPalette ?? null),
    estiloDoCliente: estilo,
    formato,
    duracao,
    destino: destinoDoVideo(formato, duracao),
    // O cenário escolhido (08/10): só vai ao plano, para o editor novo; hoje nada troca o fundo.
    cenario: cenarioDaEscolha(p?.videoEstiloEscolha),
  };
}

/** O redator da jornada: uma chamada por texto, esforço baixo (o trabalho é escrever, não decidir). Com a caixa, cada chamada soma o custo nela. */
export function redatorDaJornada(projectId: string | null | undefined, operacao: string, caixa?: CaixaDaEdicao | null): Redator {
  return (sistema, pedido) =>
    askClaude(sistema, pedido, {
      model: MODELO_DAS_IDEIAS,
      maxTokens: 8000,
      effort: "low",
      timeoutMs: 120_000,
      usage: { projectId: projectId ?? undefined, operation: operacao },
      ...(caixa ? { onCusto: (usd: number) => caixa.gastar(usd, operacao) } : {}),
    });
}

/** O JEV da jornada. Sem o JEV não há decisão: lança (nada de decisão escondida em código). Com a caixa, o custo de cada lote entra nela. */
export function jevDaJornada(caixa?: CaixaDaEdicao | null): Jev {
  if (!jevLigado()) throw new Error("a jornada precisa do JEV ligado (TYPESAFE_API_KEY): as decisões são dele");
  if (!caixa) return perguntarAoJev;
  return async (ctx, perguntas) => {
    const uso = ctx.uso ?? usoVazio();
    const antes = uso.custoUsd;
    const r = await perguntarAoJev({ ...ctx, uso }, perguntas);
    caixa.gastar(uso.custoUsd - antes, `jev-${ctx.etapa}`);
    return r;
  };
}
