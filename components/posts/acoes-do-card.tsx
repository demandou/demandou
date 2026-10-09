"use client";

import { useState } from "react";
import { AlarmClock, CheckCircle2, MessageSquarePlus, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * AS QUATRO AÇÕES DO CARD (pedido do Bruno em 09/10/2026): Aprovar, Agendar,
 * Pedir ajuste e Rejeitar, sempre à vista no pé do card.
 *
 *   - Aprovar: o dia vai para a fila no horário planejado (ou no próximo livre,
 *     quando o planejado passou), o mesmo "Deixar agendado" da lista;
 *   - Agendar: escolhe a data e a hora, e o dia vai para a fila nelas;
 *   - Pedir ajuste: leva ao chat do card, onde a pessoa escreve ou fala o
 *     ajuste; o agente pergunta o motivo e diz o custo antes de refazer;
 *   - Rejeitar: o post morre, com o motivo da reprovação (a janela de sempre),
 *     e o motivo decide se o crédito volta.
 */
export function AcoesDoCard({
  ocupado,
  aprovar,
  agendar,
  aoPedirAjuste,
  rejeitar,
}: {
  ocupado: boolean;
  aprovar: { pode: boolean; detalhe: string | null; aoClicar: () => void };
  agendar: { pode: boolean; data: string; hora: string; aoAgendar: (data: string, hora: string) => void };
  aoPedirAjuste: () => void;
  rejeitar: { pode: boolean; titulo: string; aoClicar: () => void };
}) {
  const [aberto, setAberto] = useState(false);
  const [data, setData] = useState(agendar.data);
  const [hora, setHora] = useState(agendar.hora);
  /** O painel abre preenchido com o horário que o dia já tem (o próximo livre, quando ele passou). */
  function alternarPainel() {
    if (!aberto) {
      setData(agendar.data);
      setHora(agendar.hora);
    }
    setAberto((v) => !v);
  }

  const base = "flex flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  return (
    <div className="space-y-2" data-acoes-do-card>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          data-acao="aprovar"
          disabled={ocupado || !aprovar.pode}
          onClick={aprovar.aoClicar}
          className={`${base} hover:bg-green-500/10`}
          style={{ borderColor: "rgba(34,197,94,0.45)", color: "#16a34a" }}
          title={aprovar.pode ? "Aprovar: vai para a fila e sai sozinho no horário" : "Nada esperando aprovação neste dia"}
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprovar
          </span>
          {aprovar.detalhe && <span className="hidden sm:block text-[10px] font-normal" style={{ color: "var(--text-muted)" }}>{aprovar.detalhe}</span>}
        </button>
        <button
          type="button"
          data-acao="agendar"
          disabled={ocupado || !agendar.pode}
          onClick={alternarPainel}
          className={`${base} hover:bg-blue-500/10`}
          style={{ borderColor: "rgba(96,165,250,0.45)", color: "#2563eb" }}
          title="Escolher a data e a hora da publicação"
          aria-expanded={aberto}
        >
          <span className="flex items-center gap-1.5">
            <AlarmClock className="w-3.5 h-3.5" />
            Agendar
          </span>
          <span className="hidden sm:block text-[10px] font-normal" style={{ color: "var(--text-muted)" }}>escolher data e hora</span>
        </button>
        <button
          type="button"
          data-acao="pedir-ajuste"
          disabled={ocupado}
          onClick={aoPedirAjuste}
          className={`${base} hover:bg-orange-500/10`}
          style={{ borderColor: "rgba(249,115,22,0.5)", color: "#ea580c" }}
          title="Escreva ou fale o ajuste no chat do card: o agente pergunta o motivo e diz o custo antes de refazer"
        >
          <span className="flex items-center gap-1.5">
            <MessageSquarePlus className="w-3.5 h-3.5" />
            Pedir ajuste
          </span>
          <span className="hidden sm:block text-[10px] font-normal" style={{ color: "var(--text-muted)" }}>escreva ou fale</span>
        </button>
        <button
          type="button"
          data-acao="rejeitar"
          disabled={ocupado || !rejeitar.pode}
          onClick={rejeitar.aoClicar}
          className={`${base} hover:bg-red-500/10`}
          style={{ borderColor: "rgba(239,68,68,0.45)", color: "#dc2626" }}
          title={rejeitar.titulo}
        >
          <span className="flex items-center gap-1.5">
            <ThumbsDown className="w-3.5 h-3.5" />
            Rejeitar
          </span>
          <span className="hidden sm:block text-[10px] font-normal" style={{ color: "var(--text-muted)" }}>com o motivo</span>
        </button>
      </div>
      {aberto && (
        <div className="rounded-xl border p-3 space-y-2" style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }} data-painel-agendar>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Data e hora da publicação (horário de Brasília). O dia vai para a fila e sai sozinho.
          </p>
          <div className="flex gap-2">
            <input
              type="date"
              className="flex-1 min-w-0 text-sm px-3 py-2 rounded-xl border outline-none"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)", colorScheme: "dark" }}
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
            <input
              type="time"
              className="w-28 text-sm px-3 py-2 rounded-xl border outline-none"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)", colorScheme: "dark" }}
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
            <Button
              size="sm"
              disabled={!data || !hora || ocupado}
              onClick={() => {
                agendar.aoAgendar(data, hora);
                setAberto(false);
              }}
            >
              Agendar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
