"use client";

import { Clock, Coins, ThumbsDown } from "lucide-react";
import { AvisoDescartavel } from "@/components/ui/descartar";
import { cn } from "@/lib/utils";
import { chaveDoAvisoDaReprovacao, fraseDaSituacao, lerEstadoDaReprovacao, NOME_DA_CATEGORIA } from "@/lib/credits/reprovacao";

/**
 * A SITUAÇÃO DA PEÇA REPROVADA, NO CARD (08/10/2026): "em análise",
 * "créditos devolvidos" ou "mantido, motivo: ...", com o X de descartar
 * (toda notificação tem descartar, 07/10). A chave muda por reprovação e por
 * situação: a resposta do admin volta a aparecer depois de um descarte.
 */
export function EstadoDaReprovacaoNoCard({ postId, metadata, className }: { postId: string; metadata: unknown; className?: string }) {
  const e = lerEstadoDaReprovacao(metadata);
  if (!e) return null;
  const cor = e.situacao === "devolvido" ? "#22c55e" : e.situacao === "em_analise" ? "#f59e0b" : "#9599a6";
  const Icone = e.situacao === "devolvido" ? Coins : e.situacao === "em_analise" ? Clock : ThumbsDown;
  return (
    <AvisoDescartavel
      chave={chaveDoAvisoDaReprovacao(e, postId)}
      className={cn("rounded-xl border px-3 py-2", className)}
      style={{ borderColor: `${cor}55`, background: `${cor}12` }}
    >
      <div className="flex items-start gap-2" data-aviso="reprovacao-peca">
        <Icone className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: cor }} aria-hidden="true" />
        <div className="min-w-0 text-[11px] leading-snug" style={{ color: "var(--text-primary)" }}>
          <p>{fraseDaSituacao(e)}</p>
          <p style={{ color: "var(--text-muted)" }}>
            Motivo: {NOME_DA_CATEGORIA[e.categoria].toLowerCase()}
            {e.texto ? ` · "${e.texto.length > 120 ? `${e.texto.slice(0, 117)}...` : e.texto}"` : ""}
          </p>
        </div>
      </div>
    </AvisoDescartavel>
  );
}
