"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, Image as ImageIcon, Loader2 } from "lucide-react";
import { AvisoDescartavel } from "@/components/ui/descartar";
import { chaveDaDica } from "@/lib/avisos/chaves";
import { avisoDaTrocaDeFundo, cenarioValido, OPCOES_DE_CENARIO, trocaDeFundoLigada, type CenarioDoVideo } from "@/lib/media/cenario-do-video";

/**
 * O CENÁRIO DO VÍDEO NA TELA (08/10/2026). Pedido do Bruno: "deixe uma opção
 * para o usuário selecionar: trocar fundo do vídeo ou manter cenário
 * original". Duas opções, cada uma explicada em uma frase, gravadas pelo
 * PATCH de /api/projects/[id]/estilo-de-edicao (o mesmo caminho da legenda).
 *
 * O editor de hoje nunca troca o fundo: com NEXT_PUBLIC_TROCA_DE_FUNDO
 * desligado, a opção "Trocar o fundo" diz que a troca chega com o editor novo
 * e que, até lá, o vídeo sai com o cenário original. A frase recolhe no X
 * (o aviso descartado deixa uma linha curta com o mesmo fato), para nunca
 * sumir a verdade de quem escolheu trocar.
 */
export function CenarioDoVideoNaTela({ projectId }: { projectId: string }) {
  const [cenario, setCenario] = useState<CenarioDoVideo | null>(null);
  const [gravando, setGravando] = useState<CenarioDoVideo | null>(null);
  const ligada = trocaDeFundoLigada();
  const aviso = avisoDaTrocaDeFundo(ligada);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/projects/${projectId}/estilo-de-edicao`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { escolha?: { cenario?: unknown } } | null) => {
        const c = d?.escolha?.cenario;
        if (vivo) setCenario(cenarioValido(c) ? c : "original");
      })
      .catch(() => vivo && setCenario("original"));
    return () => {
      vivo = false;
    };
  }, [projectId]);

  async function escolher(novo: CenarioDoVideo) {
    if (novo === cenario || gravando) return;
    const antes = cenario;
    setCenario(novo);
    setGravando(novo);
    try {
      const r = await fetch(`/api/projects/${projectId}/estilo-de-edicao`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cenario: novo }),
      });
      if (!r.ok) throw new Error();
    } catch {
      setCenario(antes);
      toast.error("Não consegui guardar a escolha do cenário. Tente de novo.");
    } finally {
      setGravando(null);
    }
  }

  return (
    <section className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }} aria-labelledby={`cenario-${projectId}`}>
      <p id={`cenario-${projectId}`} className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
        <ImageIcon className="h-4 w-4 text-orange-500" /> O cenário do vídeo
      </p>
      {cenario === null ? (
        <p className="mt-2 flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Lendo a escolha do projeto
        </p>
      ) : (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-labelledby={`cenario-${projectId}`}>
          {OPCOES_DE_CENARIO.map((o) => {
            const ativo = cenario === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => void escolher(o.id)}
                disabled={Boolean(gravando)}
                className="rounded-lg border p-3 text-left transition-colors disabled:opacity-70"
                style={ativo ? { borderColor: "#f97316", background: "rgba(249,115,22,0.10)" } : { borderColor: "var(--border)" }}
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {gravando === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : ativo ? <Check className="h-3.5 w-3.5 text-orange-500" /> : null}
                  {o.rotulo}
                </span>
                <span className="mt-0.5 block text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
                  {o.explicacao}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {/* A verdade de hoje, para quem escolheu trocar: recolhe no X, nunca some. */}
      {cenario === "trocar" && aviso && (
        <AvisoDescartavel
          chave={chaveDaDica("troca-de-fundo-em-breve", projectId)}
          modo="recolher"
          compacto={
            <p className="mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
              Por enquanto, o vídeo sai com o cenário original.
            </p>
          }
          className="mt-2 rounded-lg border px-3 py-2 text-xs"
          style={{ borderColor: "rgba(234,88,12,0.45)", color: "var(--text-primary)" }}
        >
          {aviso}
        </AvisoDescartavel>
      )}
    </section>
  );
}
