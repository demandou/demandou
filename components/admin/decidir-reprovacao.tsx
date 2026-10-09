"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * OS DOIS BOTÕES DA FILA DE REPROVAÇÕES (08/10/2026): devolver ou manter, com
 * um motivo opcional que vai ao cliente no sino. Uma vez só por reprovação:
 * a rota responde 409 na segunda, e a tela some com a linha ao recarregar.
 */
export function DecidirReprovacao({ id, creditos }: { id: string; creditos: number }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<"devolver" | "manter" | null>(null);
  const [motivo, setMotivo] = useState("");
  const [aviso, setAviso] = useState<{ ok?: string; erro?: string }>({});

  async function decidir(decisao: "devolver" | "manter") {
    if (ocupado) return;
    setOcupado(decisao);
    setAviso({});
    try {
      const r = await fetch(`/api/admin/reprovacoes/${id}/decidir`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decisao, motivo }) });
      const d = (await r.json().catch(() => ({}))) as { error?: string; estado?: { creditos: number } };
      if (!r.ok) throw new Error(d.error ?? "Não consegui decidir agora.");
      setAviso({ ok: decisao === "devolver" ? `Devolvidos ${d.estado?.creditos ?? 0} créditos; o cliente foi avisado.` : "Mantido; o cliente foi avisado." });
      router.refresh();
    } catch (e) {
      setAviso({ erro: e instanceof Error ? e.message : "Não consegui decidir agora." });
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="space-y-2">
      <input
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        maxLength={500}
        placeholder="Motivo para o cliente (opcional)"
        className="w-full text-xs px-3 py-2 rounded-lg border outline-none"
        style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void decidir("devolver")} disabled={Boolean(ocupado)} className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50">
          {ocupado === "devolver" ? "Devolvendo..." : `Devolver ${creditos} créditos`}
        </button>
        <button type="button" onClick={() => void decidir("manter")} disabled={Boolean(ocupado)} className="rounded-lg border px-3 py-1.5 text-sm font-semibold hover:bg-[var(--realce-2)] disabled:opacity-50" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
          {ocupado === "manter" ? "Gravando..." : "Manter o crédito"}
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
