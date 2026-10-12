"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BotaoDescartar, Descartavel } from "@/components/ui/descartar";
import { chaveDoAjusteSemSaldo } from "@/lib/avisos/chaves";
import { BOTOES_DO_MOTIVO, saldoCobre, type PedidoDeAjuste } from "@/lib/credits/ajuste";
import type { CategoriaDeReprovacao } from "@/lib/credits/reprovacao";

/**
 * OS BOTÕES DO MOTIVO, DENTRO DO CHAT DO CARD (09/10/2026).
 *
 * O agente perguntou o motivo do ajuste no chat; aqui ficam as respostas
 * rápidas, as MESMAS categorias da janela de reprovação.
 *
 * 12/10 (decisão do Bruno): os motivos vêm TODOS JUNTOS, sem "gosto: cobra" e
 * "erro: sai de graça" à vista, senão todo cliente escolheria erro. O segundo
 * passo depende do motivo: no gosto, o custo e o saldo aparecem ANTES de gastar
 * ("Refazer" ou "Deixar como está"); no erro, a declaração de que o problema
 * está na peça entregue (o pedido vai à auditoria). Nada é gerado até a
 * confirmação. "Cancelar" tira o pedido sem gerar e sem cobrar.
 */
export function MotivoDoAjuste({
  cardId,
  pedido,
  saldo,
  interno,
  escolhendo,
  semSaldo,
  aoEscolher,
  aoCancelar,
}: {
  cardId: string;
  pedido: Pick<PedidoDeAjuste, "id" | "creditos" | "carteira" | "resumo" | "aParte" | "motivoFixo" | "origem">;
  /** O saldo da carteira do pedido, quando a tela sabe. */
  saldo: number | null;
  interno?: boolean;
  /** A categoria sendo enviada agora (o botão gira). */
  escolhendo: CategoriaDeReprovacao | null;
  /** A frase do servidor quando o saldo não cobriu (402). */
  semSaldo: string | null;
  aoEscolher: (categoria: CategoriaDeReprovacao) => void;
  aoCancelar: () => void;
}) {
  const n = (x: number) => x.toLocaleString("pt-BR");
  const unidade = pedido.carteira === "video" ? " de vídeo" : "";
  const cobre = saldo === null ? true : saldoCobre({ creditos: pedido.creditos, saldo, interno });
  const ocupado = escolhendo !== null;
  // O motivo escolhido, à espera da confirmação (12/10).
  const [escolhido, setEscolhido] = useState<(typeof BOTOES_DO_MOTIVO)[number] | null>(null);
  const [declarou, setDeclarou] = useState(false);

  const botao = (b: (typeof BOTOES_DO_MOTIVO)[number]) => (
    <button
      key={b.id}
      type="button"
      data-motivo={b.id}
      disabled={ocupado}
      onClick={() => {
        setEscolhido(b);
        setDeclarou(false);
      }}
      className={cn(
        "text-[11px] px-2.5 py-1.5 rounded-full border transition-colors disabled:opacity-50 inline-flex items-center gap-1 hover:border-orange-500/60 hover:bg-orange-500/5",
        escolhido?.id === b.id && "border-orange-500/70 bg-orange-500/10"
      )}
      style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-primary)" }}
    >
      {escolhendo === b.id && <Loader2 className="w-3 h-3 animate-spin" />}
      {b.rotulo}
    </button>
  );

  const avisoSemSaldo = (semSaldo || !cobre) && (
    <Descartavel chave={chaveDoAjusteSemSaldo(cardId, pedido.id)}>
      <div className="flex items-start gap-2 rounded-lg border px-2.5 py-2" style={{ borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.05)" }} data-ajuste-sem-saldo>
        <p className="flex-1 text-[11px]" style={{ color: "var(--text-primary)" }}>
          {semSaldo ?? "O seu saldo não cobre este ajuste. Compre mais créditos para refazer."}{" "}
          <Link href="/billing?comprar=1" className="font-semibold text-orange-400 hover:underline">
            Comprar créditos
          </Link>
        </p>
        <BotaoDescartar compacto />
      </div>
    </Descartavel>
  );

  /**
   * O MOTIVO JÁ DECIDIDO (09/10): a arte refeita porque a legenda foi editada à
   * mão é "pedi diferente" e cobra. Não há motivo a escolher: refazer, com o
   * custo no botão, ou manter como está.
   */
  if (pedido.motivoFixo) {
    return (
      <div className="mr-6 rounded-xl border px-3 py-2.5 space-y-2" style={{ borderColor: "rgba(249,115,22,0.35)", background: "var(--bg-elevated)" }} data-motivo-do-ajuste data-motivo-fixo>
        <div className="min-w-0">
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
            {pedido.origem === "legenda" ? "A arte ficou de outro assunto" : "Confirmar o ajuste"}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }} data-custo-do-ajuste>
            {pedido.resumo ? `Refazer ${pedido.resumo}: ` : ""}
            <b style={{ color: "var(--text-primary)" }}>
              {n(pedido.creditos)} {pedido.creditos === 1 ? "crédito" : "créditos"}
              {unidade}
            </b>
            .{interno ? " Acesso interno: fica no extrato e não sai do saldo." : saldo !== null ? ` Seu saldo: ${n(saldo)}${unidade}.` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-confirmar-ajuste
            disabled={ocupado}
            onClick={() => aoEscolher(pedido.motivoFixo!)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: "var(--marca-laranja-botao, #c2410c)", color: "#fff" }}
          >
            {ocupado && <Loader2 className="w-3 h-3 animate-spin" />}
            {pedido.origem === "legenda" ? "Refazer a arte" : "Refazer"} · {n(pedido.creditos)} créditos{unidade}
          </button>
          <button
            type="button"
            onClick={aoCancelar}
            disabled={ocupado}
            className="text-xs px-3 py-1.5 rounded-full border disabled:opacity-50"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            Manter como está
          </button>
        </div>
        {avisoSemSaldo}
      </div>
    );
  }

  const custo = (
    <b style={{ color: "var(--text-primary)" }}>
      {n(pedido.creditos)} {pedido.creditos === 1 ? "crédito" : "créditos"}
      {unidade}
    </b>
  );
  return (
    <div className="mr-6 rounded-xl border px-3 py-2.5 space-y-2" style={{ borderColor: "rgba(249,115,22,0.35)", background: "var(--bg-elevated)" }} data-motivo-do-ajuste>
      <div className="flex items-start gap-2">
        <p className="flex-1 min-w-0 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
          O que você quer ajustar nesta peça?
        </p>
        <button
          type="button"
          onClick={aoCancelar}
          disabled={ocupado}
          aria-label="Cancelar o ajuste"
          title="Cancelar o ajuste: nada é refeito nem cobrado"
          className="h-7 shrink-0 inline-flex items-center gap-1 rounded-full px-2 text-[11px] hover:bg-[var(--realce-2)] disabled:opacity-50"
          style={{ color: "var(--text-muted)" }}
        >
          <X className="h-3.5 w-3.5" />
          Cancelar
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">{BOTOES_DO_MOTIVO.map(botao)}</div>

      {escolhido?.classe === "gosto" && (
        <div className="space-y-2 rounded-lg border px-2.5 py-2" style={{ borderColor: "var(--border)" }} data-confirmar-gosto>
          <p className="text-[11px]" style={{ color: "var(--text-secondary)" }} data-custo-do-ajuste>
            Combinado. Refazer {pedido.resumo || "esta peça"} usa {custo}
            {interno ? " (acesso interno: fica no extrato e não sai do saldo)" : saldo !== null ? ` (seu saldo: ${n(saldo)}${unidade})` : ""}.
            {pedido.aParte ? ` ${pedido.aParte.oQue.charAt(0).toUpperCase()}${pedido.aParte.oQue.slice(1)} usa mais ${n(pedido.aParte.creditos)} quando a peça chegar lá.` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-confirmar-ajuste
              disabled={ocupado}
              onClick={() => aoEscolher(escolhido.id)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 disabled:opacity-50"
              style={{ background: "var(--marca-laranja-botao, #c2410c)", color: "#fff" }}
            >
              {ocupado && <Loader2 className="w-3 h-3 animate-spin" />}
              Refazer
            </button>
            <button type="button" onClick={aoCancelar} disabled={ocupado} className="text-xs px-3 py-1.5 rounded-full border disabled:opacity-50" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
              Deixar como está
            </button>
          </div>
        </div>
      )}

      {escolhido?.classe === "erro" && (
        <div className="space-y-2 rounded-lg border px-2.5 py-2" style={{ borderColor: "var(--border)" }} data-declaracao-do-erro>
          <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
            Antes de refazer, uma confirmação: ao seguir, você declara que o problema que apontou está na peça como foi entregue. Todo pedido fica registrado junto com a peça original e passa pela nossa auditoria.
          </p>
          <label className="flex items-start gap-2 text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>
            <input type="checkbox" className="mt-0.5" checked={declarou} onChange={(e) => setDeclarou(e.target.checked)} />
            Confirmo que o problema está na peça entregue
          </label>
          <button
            type="button"
            data-confirmar-ajuste
            disabled={ocupado || !declarou}
            onClick={() => aoEscolher(escolhido.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: "var(--marca-laranja-botao, #c2410c)", color: "#fff" }}
          >
            {ocupado && <Loader2 className="w-3 h-3 animate-spin" />}
            Confirmar e refazer
          </button>
        </div>
      )}

      {avisoSemSaldo}
    </div>
  );
}
