"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, X } from "lucide-react";
import { ModelosDosPosts } from "@/components/estilo-dos-posts/modelos-dos-posts";
import type { FormatoDoPost, ModelosDosPosts as Modelos } from "@/lib/estilo-dos-posts/tipos";

/**
 * A ESCOLHA DA ARTE NO CARD (11/10, pedido do Bruno; lib/media/escolha-da-arte.ts).
 *
 * A arte do dia espera, sem gastar, até a pessoa dizer como quer: seguir o
 * design do vídeo, um modelo da biblioteca (os do book também) ou criar o
 * dela falando ou escrevendo. São as portas de sempre (ModelosDosPosts), aqui
 * para UMA peça. E duas perguntas: usar os materiais dela (as fotos da
 * Biblioteca) ou não, e se a escolha vale para todas as artes da campanha
 * que esperam.
 */
export function EscolhaDaArte({
  projectId,
  postId,
  tipoDaPeca,
  aoFechar,
}: {
  projectId: string;
  postId: string;
  /** O rótulo da peça no quadro ("Imagem", "Carrossel", "Infográfico"). */
  tipoDaPeca: string;
  aoFechar: () => void;
}) {
  const formato: FormatoDoPost = /carross/i.test(tipoDaPeca) ? "carousel" : /infogr/i.test(tipoDaPeca) ? "infographic" : "image";
  const [modelos, setModelos] = useState<Modelos>({});
  const [usarMateriais, setUsarMateriais] = useState(true);
  const [todas, setTodas] = useState(false);
  const [enviando, setEnviando] = useState(false);
  // O infográfico não tem modelo a escolher: sai nas cores e na letra da marca.
  const modelo = formato === "infographic" ? { mestre: true } : modelos["1"];

  const gerar = async () => {
    if (!modelo) return;
    setEnviando(true);
    try {
      const r = await fetch(`/api/posts/${postId}/escolha-da-arte`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelo, usarMateriais, todas }),
      });
      const d = (await r.json().catch(() => ({}))) as { frase?: string; error?: string };
      if (!r.ok) throw new Error(d.error || "Não consegui aplicar a escolha.");
      toast.success(d.frase ?? "A arte está sendo feita.");
      aoFechar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui aplicar a escolha.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Escolher a arte" onClick={aoFechar}>
      <div
        className="max-h-[92vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-t-2xl border p-4 sm:rounded-2xl sm:p-5"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Como quer esta arte?</h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Nada foi gerado ainda e nenhum crédito foi gasto. A arte sai depois da sua escolha.</p>
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="rounded-md p-1 hover:bg-black/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {formato === "infographic" ? (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>O infográfico sai nas cores e na letra da sua marca, no estilo do vídeo.</p>
        ) : (
          <ModelosDosPosts
            projectId={projectId}
            posts={[{ chave: "1", rotulo: "Esta arte", formato }]}
            valor={modelos}
            aoMudar={setModelos}
            explicacao="Siga o design do vídeo, escolha um modelo da biblioteca ou crie o seu falando ou escrevendo."
          />
        )}

        <label className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <input type="checkbox" className="mt-0.5" checked={usarMateriais} onChange={(e) => setUsarMateriais(e.target.checked)} />
          <span>Usar os meus materiais (as fotos da minha Biblioteca) nesta arte</span>
        </label>
        <label className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <input type="checkbox" className="mt-0.5" checked={todas} onChange={(e) => setTodas(e.target.checked)} />
          <span>Usar esta escolha em todas as artes desta campanha que estão esperando</span>
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={aoFechar} className="rounded-md border px-3 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}>
            Agora não
          </button>
          <button
            type="button"
            onClick={gerar}
            disabled={!modelo || enviando}
            className="flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {enviando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Gerar a arte
          </button>
        </div>
      </div>
    </div>
  );
}
