"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * O BOTÃO DE CLASSIFICAR OS PERFIS PENDENTES (08/10/2026), na tela
 * /admin/perfis. Quem decide a categoria é o JEV (lib/admin/perfis); este
 * botão só pede a rodada e mostra o resultado. Desligado quando não há
 * pendente, quando o JEV não está ligado ou quando a migração ainda não rodou.
 */

type Resposta = {
  ok?: boolean;
  error?: string;
  classificados?: number;
  emOutros?: number;
  novas?: string[];
  semDecisao?: number;
  pendentes?: number;
};

export function ClassificarPerfis({ pendentes, ligado, pronta }: { pendentes: number; ligado: boolean; pronta: boolean }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ ok?: string; erro?: string }>({});
  const motivo = !pronta
    ? "As tabelas dos perfis nascem no próximo deploy de produção."
    : !ligado
      ? "O JEV está desligado neste ambiente: nada é classificado."
      : pendentes === 0
        ? "Nenhum projeto pendente."
        : null;

  async function classificar() {
    if (ocupado || motivo) return;
    setOcupado(true);
    setAviso({});
    try {
      const r = await fetch("/api/admin/perfis/classificar", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const d = (await r.json().catch(() => ({}))) as Resposta;
      if (!r.ok) throw new Error(d.error ?? "Não consegui classificar agora.");
      const partes = [
        `${d.classificados ?? 0} projeto(s) classificado(s) pelo JEV`,
        d.emOutros ? `${d.emOutros} em "outros"` : "",
        d.novas?.length ? `categoria(s) nova(s): ${d.novas.join(", ")}` : "",
        d.semDecisao ? `${d.semDecisao} sem decisão (o JEV falhou no lote)` : "",
      ].filter(Boolean);
      setAviso({ ok: `${partes.join("; ")}.` });
      router.refresh();
    } catch (e) {
      setAviso({ erro: e instanceof Error ? e.message : "Não consegui classificar agora." });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={classificar}
        disabled={ocupado || Boolean(motivo)}
        className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {ocupado ? "O JEV está classificando..." : `Classificar ${Math.min(pendentes, 60)} pendente(s) pelo JEV`}
      </button>
      {motivo && (
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {motivo}
        </p>
      )}
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
