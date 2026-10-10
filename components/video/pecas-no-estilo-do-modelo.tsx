"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, Eye, Loader2, Pencil, RefreshCw } from "lucide-react";
import { fichaDaFonte } from "@/lib/media/editor-por-comando/comando";
import { EVENTO_DO_ESTILO_CONFIRMADO, fichaDaPeca, urlDaPreviaNaTela, type DetalheDoEstiloConfirmado, type RodadaDoMeuEstilo } from "@/lib/estilo-proprio/tipos";

/**
 * AS PEÇAS NO ESTILO DO MODELO DO VÍDEO (10/10/2026). Pedido do Bruno: o
 * cliente vê como os posts ficam seguindo o estilo do vídeo e, se não quiser,
 * cai em escrever ou narrar o próprio estilo, ou em escolher outro modelo.
 *
 * Aparece logo abaixo do modelo em uso (components/video/modelos-do-curso.tsx).
 * Ao montar, pede à rota que leve o modelo para as peças (o Claude escreve o
 * estilo das artes, do carrossel e do vídeo curto a partir do modelo; o dono
 * confirma na hora, e tudo passa a seguir). As prévias saem só no clique,
 * porque custam créditos: as mesmas da caixa "Crie o seu estilo".
 */

type Rodada = Omit<RodadaDoMeuEstilo, "custoUsd">;
type Pecas = {
  rodada: Rodada;
  confirmada: boolean;
  cores: { acento: string; escuro: string; claro: string };
  creditosDasPrevias: number;
};

export function PecasNoEstiloDoModelo({
  projectId,
  modelo,
  aoNaoGostar,
  aoTrocarModelo,
  acabouDeEscolher = false,
}: {
  projectId: string;
  modelo: { id: string; nome: string };
  /**
   * O cliente acabou de escolher este modelo: as peças passam a segui-lo (o
   * dono confirma na hora). Nas outras visitas a tela só mostra o que já
   * existe, para não passar por cima do estilo próprio de quem disse "não
   * gostei" e criou o seu.
   */
  acabouDeEscolher?: boolean;
  /** Sem ele, o botão "Não gostei" não aparece (onde a caixa do meu estilo não está na tela). */
  aoNaoGostar?: () => void;
  aoTrocarModelo: () => void;
}) {
  const [pecas, setPecas] = useState<Pecas | null>(null);
  const [levando, setLevando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [podeConfirmar, setPodeConfirmar] = useState(true);

  const levar = useCallback(async (levarAgora = true): Promise<void> => {
    setLevando(true);
    setErro(null);
    try {
      const r = await fetch(`/api/projects/${projectId}/modelo-do-curso`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: levarAgora ? "pecas" : "pecas-feitas" }) });
      const d = (await r.json().catch(() => ({}))) as { pecas?: Pecas | null; podeConfirmar?: boolean; error?: string };
      if (!r.ok) throw new Error(d.error || "Não consegui levar o estilo do modelo para as peças agora.");
      // Primeira vez deste modelo no projeto (escolhido antes desta tela existir): leva agora.
      if (!levarAgora && !d.pecas) return levar(true);
      setPecas(d.pecas ?? null);
      setPodeConfirmar(d.podeConfirmar !== false);
      // A caixa "Crie o seu estilo" e o resto da tela releem o estilo que passou a valer.
      if (d.pecas?.confirmada) window.dispatchEvent(new CustomEvent<DetalheDoEstiloConfirmado>(EVENTO_DO_ESTILO_CONFIRMADO, { detail: { projectId } }));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui agora.");
    } finally {
      setLevando(false);
    }
  }, [projectId]);

  useEffect(() => {
    void levar(acabouDeEscolher);
  }, [levar, modelo.id, acabouDeEscolher]);

  async function verComoFica() {
    if (!pecas) return;
    setGerando(true);
    try {
      const r = await fetch(`/api/projects/${projectId}/meu-estilo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "previas", rodada: pecas.rodada.n }) });
      const d = (await r.json().catch(() => ({}))) as { rodada?: Rodada; error?: string };
      if (r.status === 402) throw new Error(d.error || "Sem créditos para as prévias agora.");
      if (!r.ok || !d.rodada) throw new Error(d.error || "As prévias não saíram agora.");
      setPecas({ ...pecas, rodada: d.rodada });
      if (!d.rodada.previas?.length) toast.error("As prévias saíram fora do estilo e foram descartadas. Tente de novo ou crie o seu estilo.", { id: "pecas-do-modelo", duration: 7000 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "As prévias não saíram agora.", { id: "pecas-do-modelo" });
    } finally {
      setGerando(false);
    }
  }

  const rodada = pecas?.rodada ?? null;
  const cores = pecas?.cores ?? { acento: "#F97316", escuro: "#15171a", claro: "#f2efe8" };
  const letra = fichaDaFonte(rodada?.fonte ?? "geist");

  return (
    <section className="mb-3 space-y-3 rounded-lg border p-3" style={{ borderColor: "var(--brand)", background: "var(--bg-surface)" }} aria-labelledby={`pecas-do-modelo-${projectId}`}>
      <div>
        <p id={`pecas-do-modelo-${projectId}`} className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          As suas peças no estilo {modelo.nome}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
          As artes, os carrosséis, os infográficos e os vídeos curtos da campanha seguem o mesmo estilo do vídeo, com a cor da sua marca nos destaques.
        </p>
      </div>

      {levando && (
        <p className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Levando o estilo do {modelo.nome} para as suas peças (leva uns segundos)
        </p>
      )}

      {erro && !levando && (
        <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>{erro}</span>
          <button type="button" onClick={() => void levar(acabouDeEscolher)} className="inline-flex items-center gap-1 font-semibold" style={{ color: "var(--text-primary)" }}>
            <RefreshCw className="h-3.5 w-3.5" /> Tentar de novo
          </button>
        </div>
      )}

      {rodada && !levando && (
        <>
          <div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {rodada.estilo.resumo}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {rodada.estilo.pontos.map((p) => (
                <li key={p} className="rounded-full border px-2.5 py-1 text-[11px]" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {rodada.previas && rodada.previas.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {rodada.previas.map((p) => {
                const f = fichaDaPeca(p.peca);
                return (
                  <figure key={p.peca} className="min-w-0">
                    <div className="relative overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)", aspectRatio: `${f.largura} / ${f.altura}`, background: "var(--bg-input)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={urlDaPreviaNaTela(projectId, p.url)} alt={f.rotulo} className="absolute inset-0 h-full w-full object-cover" />
                      {f.comTitulo && (
                        <div className="absolute inset-x-0 bottom-0 p-2" style={{ background: `linear-gradient(transparent, ${cores.escuro}cc)` }}>
                          <span className="block text-[11px] font-bold leading-tight sm:text-xs" style={{ fontFamily: letra.amostraCss, fontWeight: letra.amostraPeso, textTransform: letra.caixaAlta ? "uppercase" : "none", color: cores.claro }}>
                            {rodada.estilo.titulo}
                            <span className="ml-1 inline-block h-1.5 w-6 rounded-sm align-middle" style={{ background: cores.acento }} />
                          </span>
                        </div>
                      )}
                    </div>
                    <figcaption className="mt-1 truncate text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {f.rotulo}
                      {p.conferida ? "" : " (sem conferir)"}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          )}
          {rodada.previas && rodada.previasTiradas && rodada.previasTiradas.length > 0 && (
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {rodada.previasTiradas.map((p) => fichaDaPeca(p).rotulo).join(", ")}: a prévia saiu fora do estilo e foi descartada.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {!rodada.previas && (
              <button type="button" onClick={() => void verComoFica()} disabled={gerando} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
                {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />} {gerando ? "Gerando as prévias (até uns minutos)" : `Ver como ficam as peças (até ${pecas?.creditosDasPrevias ?? 80} créditos)`}
              </button>
            )}
            {aoNaoGostar && (
              <button type="button" onClick={aoNaoGostar} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
                <Pencil className="h-4 w-4" /> Não gostei: criar o meu estilo
              </button>
            )}
            <button type="button" onClick={aoTrocarModelo} className="text-xs font-semibold underline-offset-2 hover:underline" style={{ color: "var(--text-muted)" }}>
              Escolher outro modelo
            </button>
          </div>

          <p className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
            {pecas?.confirmada ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-600" /> Todas as peças da campanha já seguem este estilo.
              </>
            ) : podeConfirmar ? (
              <>
                Hoje as suas peças seguem outro estilo (o seu, criado depois).
                <button type="button" onClick={() => void levar(true)} className="font-semibold underline underline-offset-2" style={{ color: "var(--text-primary)" }}>
                  Usar o estilo do {modelo.nome} nas peças
                </button>
              </>
            ) : (
              "Só o dono da conta grava o estilo do projeto: as peças seguem o estilo que ele escolheu."
            )}
            {!rodada.previas && " As prévias são geradas pelo melhor modelo de imagem e conferidas antes de aparecer; o que não for usado volta para o seu saldo."}
          </p>
        </>
      )}
    </section>
  );
}
