import { confirmarRodada, escreverRodada, estadoDoMeuEstilo } from "@/lib/estilo-proprio/servidor";
import { rodadaParaTela, type ConfirmadoDoMeuEstilo, type RodadaDoMeuEstilo } from "@/lib/estilo-proprio/tipos";
import { falaDoModeloParaAsPecas } from "./estilo-das-pecas";

/**
 * O MODELO DO VÍDEO LEVADO PARA AS PEÇAS DA CAMPANHA (10/10/2026). Ver
 * estilo-das-pecas.ts.
 *
 * Escolheu o modelo, as peças seguem: a fala do modelo vira uma rodada do
 * "Meu estilo" (o Claude só escreve) e, para o dono, é confirmada na hora
 * (comando, design mestre, padrão "mestre"). As prévias ficam para o clique
 * do cliente ("Ver como ficam"), porque custam créditos.
 *
 * SEM PAGAR DUAS VEZES: voltar ao mesmo modelo reaproveita a rodada que já
 * saiu dele (a mesma fala), e ela só é confirmada de novo se outro estilo
 * passou na frente.
 */

export type PecasNoModelo = {
  rodada: Omit<RodadaDoMeuEstilo, "custoUsd">;
  confirmada: boolean;
  confirmado: ConfirmadoDoMeuEstilo | null;
  /** A confirmação acabou de acontecer (a rota registra a nota do cérebro). */
  preferenciaKey: string | null;
  cores: { acento: string; escuro: string; claro: string };
  creditosDasPrevias: number;
};

export async function levarModeloParaAsPecas(o: { projectId: string; userId: string; modelo: string; podeConfirmar: boolean }): Promise<{ ok: true; pecas: PecasNoModelo } | { ok: false; erro: string }> {
  const fala = falaDoModeloParaAsPecas(o.modelo);
  if (!fala) return { ok: false, erro: "Este modelo ainda não tem o estilo das peças." };

  const antes = await estadoDoMeuEstilo(o.projectId);
  let rodada = [...antes.rodadas].reverse().find((r) => r.falas?.[0] === fala) ?? null;
  if (!rodada) {
    const escrita = await escreverRodada({ projectId: o.projectId, fala, ajuste: false, origem: "escrito" });
    if (!escrita.ok) return { ok: false, erro: escrita.erro };
    rodada = rodadaParaTela(escrita.rodada);
  }

  let confirmado = antes.confirmado;
  let preferenciaKey: string | null = null;
  if (o.podeConfirmar && confirmado?.rodada !== rodada.n) {
    const c = await confirmarRodada({ projectId: o.projectId, userId: o.userId, rodada: rodada.n });
    if (c.ok) {
      confirmado = c.confirmado;
      preferenciaKey = c.preferenciaKey;
    }
  }

  const depois = await estadoDoMeuEstilo(o.projectId);
  const atual = depois.rodadas.find((r) => r.n === rodada!.n) ?? rodada;
  return {
    ok: true,
    pecas: {
      rodada: atual,
      confirmada: depois.confirmado?.rodada === atual.n,
      confirmado: depois.confirmado ?? confirmado ?? null,
      preferenciaKey,
      cores: depois.cores,
      creditosDasPrevias: depois.creditosDasPrevias,
    },
  };
}

/** A rodada do modelo que já existe (sem escrever nada): para a tela mostrar ao voltar. */
export async function pecasDoModeloJaFeitas(projectId: string, modelo: string): Promise<PecasNoModelo | null> {
  const fala = falaDoModeloParaAsPecas(modelo);
  if (!fala) return null;
  const e = await estadoDoMeuEstilo(projectId);
  const rodada = [...e.rodadas].reverse().find((r) => r.falas?.[0] === fala);
  if (!rodada) return null;
  return { rodada, confirmada: e.confirmado?.rodada === rodada.n, confirmado: e.confirmado, preferenciaKey: null, cores: e.cores, creditosDasPrevias: e.creditosDasPrevias };
}
