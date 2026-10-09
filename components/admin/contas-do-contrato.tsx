"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * LIGAR UMA CONTA AO CONTRATO (08/10/2026), na tela do caso
 * (/admin/contas/[titularId]). O admin escolhe a conta na lista e diz o
 * motivo; o servidor confere as travas (lib/admin/contas/vinculos.ts). A
 * ligação só soma o uso da conta no caso: plano, saldo e cobrança dela não
 * mudam.
 */

const fraco = { color: "var(--text-muted)" } as const;
const entrada = { borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-input)" } as const;
const campo = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-orange-500";

export type ContaParaLigar = { id: string; email: string; nome: string | null; plano: string };

export function LigarConta({ titularId, contas, pronta }: { titularId: string; contas: ContaParaLigar[]; pronta: boolean }) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ ok?: string; erro?: string }>({});

  if (!pronta) {
    return (
      <p className="text-xs" style={fraco}>
        A ligação de contas nasce com a migração deste pacote (tabela contas_do_contrato), aplicada no próximo deploy de produção.
      </p>
    );
  }

  async function ligar() {
    if (ocupado || !userId) return;
    setOcupado(true);
    setAviso({});
    try {
      const r = await fetch("/api/admin/contas/ligacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, titularId, observacao }),
      });
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(d.error ?? "Não consegui ligar agora.");
      setAviso({ ok: "Conta ligada. O uso dela passa a somar neste caso." });
      setUserId("");
      setObservacao("");
      router.refresh();
    } catch (e) {
      setAviso({ erro: e instanceof Error ? e.message : "Não consegui ligar agora." });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
        <label className="block">
          <span className="sr-only">Conta para ligar</span>
          <select className={campo} style={entrada} value={userId} onChange={(e) => setUserId(e.target.value)} disabled={ocupado}>
            <option value="">Escolha a conta que usa por este contrato</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome ? `${c.nome} · ` : ""}
                {c.email}
                {c.plano !== "free" ? ` · ${c.plano}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Motivo</span>
          <input
            className={campo}
            style={entrada}
            placeholder="Motivo (ex.: vendedor do time da SEED)"
            value={observacao}
            maxLength={300}
            onChange={(e) => setObservacao(e.target.value)}
            disabled={ocupado}
          />
        </label>
        <button
          type="button"
          onClick={ligar}
          disabled={ocupado || !userId}
          className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {ocupado ? "Ligando..." : "Ligar ao contrato"}
        </button>
      </div>
      {aviso.ok && (
        <p className="text-xs" style={{ color: "var(--badge-success-text)" }}>
          {aviso.ok}
        </p>
      )}
      {aviso.erro && (
        <p className="text-xs" style={{ color: "var(--badge-danger-text)" }}>
          {aviso.erro}
        </p>
      )}
    </div>
  );
}

export function DesligarConta({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function desligar() {
    if (ocupado) return;
    if (!window.confirm(`Desligar ${email} deste contrato? O uso dela deixa de somar aqui; nada mais muda na conta.`)) return;
    setOcupado(true);
    setErro(null);
    try {
      const r = await fetch("/api/admin/contas/ligacoes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(d.error ?? "Não consegui desligar agora.");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui desligar agora.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={desligar}
        disabled={ocupado}
        className="rounded-md border px-2 py-0.5 text-[11px] font-medium hover:bg-[var(--realce-2)] disabled:opacity-50"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        {ocupado ? "Desligando..." : "Desligar"}
      </button>
      {erro && (
        <span className="text-[11px]" style={{ color: "var(--badge-danger-text)" }}>
          {erro}
        </span>
      )}
    </span>
  );
}
