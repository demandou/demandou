"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { BotaoDescartar, Descartavel } from "@/components/ui/descartar";

/** A capa de um corte que não saiu no estilo escolhido (vem da página do servidor). */
export type CapaQueFalhou = {
  videoJobId: string;
  /** Nome do arquivo enviado, para o cliente saber de qual gravação é. */
  nome: string;
  indice: number;
  titulo?: string | null;
  motivo: string;
  /** A chave do descarte (lib/avisos/chaves.ts, "capa-falhou"), montada no servidor. */
  chave: string | null;
};

/**
 * AS CAPAS DOS CORTES QUE PARARAM NO ESTILO ESCOLHIDO (11/10/2026, regra do
 * Bruno: nunca trocar o estilo sozinho). A capa que não saiu nas duas
 * tentativas não vira outra coisa: fica aqui, acima do quadro, com o motivo e
 * o "Tentar de novo", que recomeça no MESMO estilo e não cobra. A capa do
 * completo tem o mesmo botão no card dele (components/video/capa-do-completo.tsx).
 */
export function AvisoDaCapa({ falhas, aoPedir }: { falhas: CapaQueFalhou[]; aoPedir?: () => void }) {
  const [pedidas, setPedidas] = useState<string[]>([]);
  const [pedindo, setPedindo] = useState<string | null>(null);
  const id = (f: CapaQueFalhou) => `${f.videoJobId}:${f.indice}`;
  const visiveis = falhas.filter((f) => !pedidas.includes(id(f)));
  if (!visiveis.length) return null;

  const tentar = async (f: CapaQueFalhou) => {
    setPedindo(id(f));
    try {
      const r = await fetch(`/api/videos/${f.videoJobId}/capas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indices: [f.indice], soCapa: true }),
      });
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(d.error ?? "Não consegui pedir a capa de novo.");
      setPedidas((p) => [...p, id(f)]);
      toast.success("A capa está sendo feita de novo no mesmo estilo. Ela aparece no corte em alguns minutos.");
      aoPedir?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui pedir a capa de novo.");
    } finally {
      setPedindo(null);
    }
  };

  return (
    <div className="space-y-2" data-lista-de-avisos data-aviso="capa">
      {visiveis.map((f) => (
        <Descartavel key={id(f)} chave={f.chave}>
          <div className="flex items-start gap-3 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-3">
            <AlertTriangle className="w-[18px] h-[18px] text-orange-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                Capa do corte {f.indice + 1}
                {f.titulo ? `: ${f.titulo}` : ""}
                <span style={{ color: "var(--text-muted)" }}> · {f.nome}</span>
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {f.motivo}
              </p>
              <button
                type="button"
                disabled={pedindo !== null}
                onClick={() => void tentar(f)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                {pedindo === id(f) ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Tentar de novo
              </button>
            </div>
            <BotaoDescartar compacto className="-mt-1 -mr-2" />
          </div>
        </Descartavel>
      ))}
    </div>
  );
}
