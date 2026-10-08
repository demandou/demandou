"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Sparkles } from "lucide-react";
import { EstiloDoProjeto } from "@/components/video/estilo-do-projeto";
import { ESCOLHAS_DOS_POSTS, type ModoDosPosts } from "@/lib/estilo-dos-posts/estilo-mestre";

/**
 * O ESTILO VEM PRIMEIRO EM TODA JORNADA (08/10/2026). Pedido do Bruno: em toda
 * porta de entrada da campanha ("Editar o meu vídeo", "O meu gêmeo digital",
 * "Gerar tudo com IA"), o primeiro passo depois de escolher a porta é escolher
 * o ESTILO MESTRE (a linguagem do vídeo, como Autoridade high ticket ou Vox,
 * ou um estilo criado a partir de uma ideia), e logo depois a escolha: "todas
 * as peças seguem o estilo mestre" (o padrão) ou "quero mudar os posts". Vale
 * para tudo que a IA gera: a edição do vídeo, as artes, os carrosséis, o
 * vídeo por IA e o gêmeo. A única porta sem este passo é "Conteúdo pronto
 * seu": ali nada é gerado.
 *
 * Nada aqui é estilo novo: o estilo mestre é o mesmo do vídeo
 * (components/video/estilo-do-projeto.tsx, o comando ou o catálogo, com o
 * cenário), e "quero mudar os posts" leva à escolha post a post de sempre
 * (components/estilo-dos-posts/modelos-dos-posts.tsx), que quem chama mostra
 * onde os posts da campanha já existem.
 */

/**
 * O padrão dos posts do projeto (o estilo mestre, a não ser que o dono tenha
 * escolhido um estilo próprio em Configurações), para a escolha vir marcada.
 * Null enquanto lê; falhou a leitura, o padrão de todos: o estilo mestre.
 */
export function useModoPadraoDosPosts(projectId: string | null | undefined): ModoDosPosts | null {
  const [modo, setModo] = useState<ModoDosPosts | null>(null);
  useEffect(() => {
    if (!projectId) return;
    let vivo = true;
    fetch(`/api/projects/${projectId}/estilo-dos-posts`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { modo?: string } | null) => {
        if (vivo) setModo(d?.modo === "por-post" ? "por-post" : "mestre");
      })
      .catch(() => vivo && setModo("mestre"));
    return () => {
      vivo = false;
    };
  }, [projectId]);
  return modo;
}

/** A escolha logo depois do estilo: todas as peças no estilo mestre, ou mudar os posts. */
export function EscolhaDosPosts({ valor, aoMudar }: { valor: ModoDosPosts; aoMudar: (m: ModoDosPosts) => void }) {
  return (
    <section className="space-y-2" aria-label="As peças da campanha">
      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
        E as peças da campanha?
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="As peças da campanha">
        {ESCOLHAS_DOS_POSTS.map((o) => {
          const ativo = valor === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => aoMudar(o.id)}
              className="rounded-lg border p-3 text-left transition-colors"
              style={ativo ? { borderColor: "#f97316", background: "rgba(249,115,22,0.10)" } : { borderColor: "var(--border)" }}
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {ativo ? <Check className="h-3.5 w-3.5 text-orange-500" /> : null}
                {o.rotulo}
              </span>
              <span className="mt-0.5 block text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
                {o.explicacao}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function PassoDoEstiloMestre({
  projectId,
  estilo,
  musica,
  termos,
  comCenario,
  modo,
  aoMudarModo,
  material,
  depoisDaEscolha,
}: {
  projectId: string;
  /** Project.videoStyle (o que o passo do estilo recebe). */
  estilo: string | null;
  musica: string | null;
  termos: string | null;
  /** Com gravação (o vídeo, o gêmeo): a escolha do cenário aparece junto do estilo. */
  comCenario: boolean;
  modo: ModoDosPosts;
  aoMudarModo: (m: ModoDosPosts) => void;
  /**
   * O LUGAR DO MATERIAL PRÓPRIO DA CAMPANHA (08/10): a escolha das fotos
   * (usar as que existem ou subir novas, e o estilo de cada foto) entra aqui,
   * logo depois do estilo, pelo ramo material-proprio-0810. Sem nada, não
   * aparece nada.
   */
  material?: ReactNode;
  /** O que vem logo depois da escolha (a lista post a post, onde quem chama já a tem). */
  depoisDaEscolha?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          <Sparkles className="h-4 w-4 text-orange-500" /> O estilo mestre
        </h3>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          É a linguagem do vídeo, nas cores e na letra da sua marca: escolha um pronto (como Autoridade high ticket ou Vox) ou crie o seu a partir de uma ideia. A edição do vídeo e as artes saem dele.
        </p>
      </div>
      <EstiloDoProjeto projectId={projectId} inicial={estilo} musicaInicial={musica} termosIniciais={termos} mostrar="estilo" semCenario={!comCenario} />
      <EscolhaDosPosts valor={modo} aoMudar={aoMudarModo} />
      {depoisDaEscolha}
      {material ? <div data-lugar="material-da-campanha">{material}</div> : null}
    </div>
  );
}
