-- A REPROVAÇÃO COM MOTIVO E A DEVOLUÇÃO POR ERRO VERIFICADO (decisão do
-- Bruno em 08/10/2026). Aditiva e com IF NOT EXISTS, como as outras: rodar
-- duas vezes não pode quebrar nada. Escrita e NÃO aplicada por este commit:
-- entra pelo build (scripts/build.mjs), primeiro no Preview de dev
-- (demandou-dev) e depois na produção.
--
-- Cada linha é UMA reprovação de UMA peça, com o motivo do cliente, o que o
-- código ou o JEV concluiu contra as provas automáticas, a decisão do admin
-- quando houve, e quantos créditos voltaram. Fora do schema do Prisma (SQL
-- cru, como perfis_dos_projetos): o código antigo não cai no intervalo entre
-- a migração e o deploy, e sem a tabela a reprovação continua funcionando
-- (o estado vive em posts.metadata.reprovacao e em project_memories).

CREATE TABLE IF NOT EXISTS "motivos_de_reprovacao" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "runId" TEXT,
  "categoria" TEXT NOT NULL,
  "texto" TEXT NOT NULL DEFAULT '',
  "vereditoDoJev" TEXT,
  "decididoPor" TEXT,
  "provas" JSONB,
  "decisaoDoAdmin" TEXT,
  "adminId" TEXT,
  "motivoDoAdmin" TEXT,
  "situacao" TEXT NOT NULL DEFAULT 'em_analise',
  "creditosDevolvidos" INTEGER NOT NULL DEFAULT 0,
  "custoDaPeca" INTEGER NOT NULL DEFAULT 0,
  "reprovadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decididaEm" TIMESTAMP(3),
  CONSTRAINT "motivos_de_reprovacao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "motivos_de_reprovacao_projectId_reprovadaEm_idx" ON "motivos_de_reprovacao"("projectId", "reprovadaEm");
CREATE INDEX IF NOT EXISTS "motivos_de_reprovacao_situacao_idx" ON "motivos_de_reprovacao"("situacao");
CREATE INDEX IF NOT EXISTS "motivos_de_reprovacao_postId_idx" ON "motivos_de_reprovacao"("postId");
CREATE INDEX IF NOT EXISTS "motivos_de_reprovacao_runId_idx" ON "motivos_de_reprovacao"("runId");

-- Sem chave estrangeira para posts e users de propósito: o registro do motivo
-- sobrevive à peça apagada e à conta excluída, como o extrato e admin_acoes.
-- Só o projeto leva a linha junto quando some.
DO $$ BEGIN
  ALTER TABLE "motivos_de_reprovacao" ADD CONSTRAINT "motivos_de_reprovacao_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
