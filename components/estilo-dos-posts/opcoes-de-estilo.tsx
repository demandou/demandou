"use client";

import { Library, Sparkles, Wand2 } from "lucide-react";
import { OPCOES_DE_ESTILO, type OpcaoDeEstilo } from "@/lib/estilo-dos-posts/estilo-mestre";

/**
 * AS TRÊS PORTAS DO ESTILO DE TODA PEÇA VISUAL (08/10/2026). Pedido do Bruno:
 * "deixar a IA criar a partir do estilo mestre selecionado (o estilo do
 * vídeo; aí toda arte segue o mesmo design), escolher um estilo da biblioteca
 * ou criar meu próprio estilo a partir de uma ideia".
 *
 * Um componente só, com o texto e a ordem de lib/estilo-dos-posts/estilo-mestre.ts
 * (`OPCOES_DE_ESTILO`): Configurações > Estilo dos posts, o modelo de cada
 * post da campanha, a semana do vídeo e o vídeo por IA mostram exatamente as
 * mesmas três, na mesma ordem. Quem chama decide o que cada porta abre.
 */

const ICONE: Record<OpcaoDeEstilo, typeof Sparkles> = { mestre: Sparkles, biblioteca: Library, criar: Wand2 };

export function OpcoesDeEstilo({
  valor,
  aoMudar,
  rotulo,
  explicar = true,
  desligadas,
}: {
  valor: OpcaoDeEstilo;
  aoMudar: (o: OpcaoDeEstilo) => void;
  /** O nome acessível do grupo ("O estilo de Quarta"). */
  rotulo: string;
  /** Mostra a frase da opção escolhida embaixo (padrão). */
  explicar?: boolean;
  /** Opções que não abrem aqui (o dono escolhe em Configurações), com o motivo no título. */
  desligadas?: Partial<Record<OpcaoDeEstilo, string>>;
}) {
  const escolhida = OPCOES_DE_ESTILO.find((o) => o.id === valor) ?? OPCOES_DE_ESTILO[0];
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={rotulo}>
        {OPCOES_DE_ESTILO.map((o) => {
          const Icone = ICONE[o.id];
          const ativa = valor === o.id;
          const motivo = desligadas?.[o.id];
          return (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={ativa}
              disabled={Boolean(motivo)}
              title={motivo ?? o.explicacao}
              onClick={() => aoMudar(o.id)}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={ativa ? { borderColor: "#f97316", background: "rgba(249,115,22,0.10)", color: "var(--text-primary)" } : { borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              <Icone className="h-3.5 w-3.5" /> {o.rotulo}
            </button>
          );
        })}
      </div>
      {explicar && (
        <p className="text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>
          {escolhida.explicacao}
        </p>
      )}
    </div>
  );
}
