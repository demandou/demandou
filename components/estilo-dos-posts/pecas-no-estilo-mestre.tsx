"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ModelosDosPosts } from "@/components/estilo-dos-posts/modelos-dos-posts";
import { EscolhaDosPosts, useModoPadraoDosPosts } from "@/components/estilo-dos-posts/passo-do-estilo-mestre";
import { modelosDaSemana, normalizarSemana, planoParaGravar, postsVisuaisDaSemana, semanaComModelos, type SemanaDoVideo } from "@/lib/media/semana-do-video";
import { ESCOLHA_DO_MESTRE, modeloServeAoPost, oQueOPostPede, todosNoMestre } from "@/lib/estilo-dos-posts/tipos";
import type { ModoDosPosts } from "@/lib/estilo-dos-posts/estilo-mestre";

/**
 * AS PEÇAS DA SEMANA NO ESTILO MESTRE, FORA DA JORNADA (08/10/2026): a página
 * do gêmeo digital. O vídeo do gêmeo segue a esteira de uma gravação, e a
 * semana que sai dele é a do projeto (`videoSemana`). Logo depois do estilo
 * (o cartão "Como o squad edita"), a mesma escolha de toda porta: todas as
 * peças no estilo mestre (o padrão) ou post a post.
 *
 * Com "todas", cada dia visual da semana sem escolha recebe o estilo mestre,
 * como a escolha de cada post vem preenchida na jornada (a mesma gravação do
 * `videoSemana`, que o membro da equipe também pode fazer); clicar em "todas"
 * põe todos no mestre. Com "quero mudar", a lista post a post de sempre.
 */
export function PecasNoEstiloMestre({ projectId, semana }: { projectId: string; semana: unknown }) {
  const [semanaAtual, setSemanaAtual] = useState<SemanaDoVideo>(() => normalizarSemana(semana));
  const padrao = useModoPadraoDosPosts(projectId);
  const [escolhido, setEscolhido] = useState<ModoDosPosts | null>(null);
  const modo: ModoDosPosts | null = escolhido ?? padrao;
  const ultimaSalva = useRef(JSON.stringify(planoParaGravar(normalizarSemana(semana))));
  const posts = postsVisuaisDaSemana(semanaAtual);

  function salvar(nova: SemanaDoVideo) {
    setSemanaAtual(nova);
    const plano = JSON.stringify(planoParaGravar(nova));
    if (plano === ultimaSalva.current) return;
    ultimaSalva.current = plano;
    fetch(`/api/projects/${projectId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videoSemana: JSON.parse(plano) }) })
      .then((r) => {
        if (!r.ok) throw new Error();
      })
      .catch(() => {
        ultimaSalva.current = "";
        toast.error("Não consegui guardar o estilo das peças da semana. Tente de novo.", { id: "pecas-no-mestre" });
      });
  }

  // O padrão do projeto é o estilo mestre: o dia visual sem escolha recebe o mestre (os escolhidos ficam).
  const preencheu = useRef(false);
  useEffect(() => {
    if (modo !== "mestre" || preencheu.current) return;
    preencheu.current = true;
    const atuais = modelosDaSemana(semanaAtual);
    const faltando = posts.filter((p) => !modeloServeAoPost(atuais[p.chave], oQueOPostPede(p.formato)));
    if (!faltando.length) return;
    salvar(semanaComModelos(semanaAtual, { ...atuais, ...todosNoMestre(faltando) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo]);

  if (!posts.length || !modo) return null;

  return (
    <section className="space-y-3 rounded-2xl border p-4 sm:p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <EscolhaDosPosts
        valor={modo}
        aoMudar={(m) => {
          setEscolhido(m);
          // "Todas seguem o estilo mestre": cada dia visual da semana no mestre.
          if (m === "mestre") salvar(semanaComModelos(semanaAtual, { ...modelosDaSemana(semanaAtual), ...todosNoMestre(posts) }));
        }}
      />
      {modo === "por-post" && (
        <ModelosDosPosts
          projectId={projectId}
          posts={posts}
          valor={modelosDaSemana(semanaAtual)}
          aoMudar={(m) => salvar(semanaComModelos(semanaAtual, m))}
          explicacao="As peças da semana que sai do vídeo do gêmeo. Cada dia com peça visual tem o seu estilo, e no quadro a IA coloca o conteúdo daquele dia dentro dele."
        />
      )}
      {modo === "mestre" && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {posts.length === 1 ? "A peça visual da semana sai" : `As ${posts.length} peças visuais da semana saem`} no {ESCOLHA_DO_MESTRE.nome?.toLowerCase()}, o mesmo design do vídeo.
        </p>
      )}
    </section>
  );
}
