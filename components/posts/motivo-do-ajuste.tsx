"use client";

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
 * rápidas, as MESMAS categorias da janela de reprovação, separadas em gosto
 * (cobra) e erro da plataforma (conferido; confirmado, sai de graça). O custo
 * e o saldo ficam à vista ANTES do clique, e nada é gerado até um deles ser
 * escolhido. "Cancelar" tira o pedido sem gerar e sem cobrar.
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
  const gosto = BOTOES_DO_MOTIVO.filter((b) => b.classe === "gosto");
  const erro = BOTOES_DO_MOTIVO.filter((b) => b.classe === "erro");
  const ocupado = escolhendo !== null;

  const botao = (b: (typeof BOTOES_DO_MOTIVO)[number]) => (
    <button
      key={b.id}
      type="button"
      data-motivo={b.id}
      disabled={ocupado}
      onClick={() => aoEscolher(b.id)}
      className={cn(
        "text-[11px] px-2.5 py-1.5 rounded-full border transition-colors disabled:opacity-50 inline-flex items-center gap-1",
        b.classe === "gosto" ? "hover:border-orange-500/60 hover:bg-orange-500/5" : "hover:border-sky-500/60 hover:bg-sky-500/5"
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
          {semSaldo ?? (pedido.motivoFixo ? "O seu saldo não cobre este ajuste. Compre mais créditos para refazer." : "O seu saldo não cobre este ajuste se for gosto. Compre mais créditos, ou escolha erro da plataforma se o erro foi nosso.")}{" "}
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

  return (
    <div className="mr-6 rounded-xl border px-3 py-2.5 space-y-2" style={{ borderColor: "rgba(249,115,22,0.35)", background: "var(--bg-elevated)" }} data-motivo-do-ajuste>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
            Qual o motivo do ajuste?
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }} data-custo-do-ajuste>
            {pedido.resumo ? `Refazer ${pedido.resumo}: ` : ""}
            <b style={{ color: "var(--text-primary)" }}>
              {n(pedido.creditos)} {pedido.creditos === 1 ? "crédito" : "créditos"}
              {unidade}
            </b>{" "}
            se for gosto ou pedido diferente.
            {interno ? " Acesso interno: fica no extrato e não sai do saldo." : saldo !== null ? ` Seu saldo: ${n(saldo)}${unidade}.` : ""}
            {pedido.aParte ? ` ${pedido.aParte.oQue.charAt(0).toUpperCase()}${pedido.aParte.oQue.slice(1)} cobra à parte (${n(pedido.aParte.creditos)}).` : ""}
          </p>
        </div>
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

      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          Gosto: cobra
        </p>
        <div className="flex flex-wrap gap-1.5">{gosto.map(botao)}</div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          Erro da plataforma: eu confiro; confirmado, sai de graça
        </p>
        <div className="flex flex-wrap gap-1.5">{erro.map(botao)}</div>
      </div>

      {avisoSemSaldo}
    </div>
  );
}
