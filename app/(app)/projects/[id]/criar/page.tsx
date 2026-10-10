import { auth } from "@/lib/auth/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { PortasDoProjeto } from "@/components/criar/portas-do-projeto";
import { podeUsarProjeto } from "@/lib/equipe/conta";
import { estatisticasDoProjeto } from "@/lib/analytics/estatisticas-da-conta";
import { CardDasVisualizacoes } from "@/components/analytics/estatisticas-da-conta";
import { impulsosDoProjeto } from "@/lib/analytics/impulso";
import { BlocoDeImpulso } from "@/components/analytics/impulso";

/** A aba Criar: as três portas de entrada do projeto (29/09). */
export default async function CriarPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id }, select: { id: true, userId: true, status: true } });
  if (!project || !(await podeUsarProjeto(userId, project))) notFound();
  // Projeto ainda no setup não tem por onde criar: o assistente vem antes.
  if (project.status !== "active") redirect(`/projects/${id}`);

  // AS VISUALIZAÇÕES DA CONTA NO TOPO (09/10, pedido do Bruno com o print do
  // Painel Profissional): a primeira coisa que o projeto mostra é quem viu o
  // conteúdo. Só SELECT; sem leitura, o card diz por quê e não mostra número.
  // Logo abaixo, o que vale impulsionar esta semana (09/10, agente de tráfego,
  // lib/analytics/impulso.ts): só SELECT; sem sugestão nem conta aprendendo,
  // o bloco não aparece.
  const [estatisticas, impulsos] = await Promise.all([estatisticasDoProjeto(id), impulsosDoProjeto(id)]);

  return (
    <div className="px-4 py-10 lg:px-8">
      <div className="mx-auto mb-10 w-full max-w-[1080px] space-y-6">
        <CardDasVisualizacoes projectId={id} estatisticas={estatisticas} souDono={project.userId === userId} />
        <BlocoDeImpulso projectId={id} impulsos={impulsos} />
      </div>
      <PortasDoProjeto projectId={id} />
    </div>
  );
}
