-- CONTRATOS E CONTAS, CASO A CASO, E OS PERFIS DOS CLIENTES (08/10/2026).
-- Aditiva e com IF NOT EXISTS, como as outras: rodar duas vezes não pode
-- quebrar nada. Escrita e NÃO aplicada por este commit: entra pelo build
-- (scripts/build.mjs). As três tabelas ficam FORA do schema do Prisma e são
-- lidas e gravadas por SQL cru (lib/admin/contas/vinculos.ts e
-- lib/admin/perfis/servidor.ts): o código tolera elas ainda não existirem, e
-- nenhum cliente do Prisma precisa ser gerado de novo.

-- 1. A CONTA PRÓPRIA LIGADA AO CONTRATO DE OUTRA CONTA. O caso da SEED: o
-- contrato nº 2 é da conta do Matheus, e o Ygor e o Vitor usam com contas
-- próprias (plano de cortesia), que não são membros da equipe dele. O admin
-- liga cada conta à conta titular do contrato na tela /admin/contas; nada é
-- inferido. Uma conta só pode estar ligada a uma titular (a chave é userId).
CREATE TABLE IF NOT EXISTS "contas_do_contrato" (
  "userId" TEXT NOT NULL,
  "titularId" TEXT NOT NULL,
  "definidoPor" TEXT,
  "observacao" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contas_do_contrato_pkey" PRIMARY KEY ("userId")
);

CREATE INDEX IF NOT EXISTS "contas_do_contrato_titularId_idx" ON "contas_do_contrato"("titularId");

DO $$ BEGIN
  ALTER TABLE "contas_do_contrato" ADD CONSTRAINT "contas_do_contrato_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "contas_do_contrato" ADD CONSTRAINT "contas_do_contrato_titularId_fkey"
    FOREIGN KEY ("titularId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. O PERFIL DE CADA PROJETO, decidido pelo JEV: a categoria de profissão ou
-- setor, se vende para empresas ou pessoas e se a marca é pessoal ou de
-- empresa, com a confiança de cada escolha, os textos que o JEV leu, o hash
-- desses textos (mudou o nicho, a classificação venceu) e a data.
CREATE TABLE IF NOT EXISTS "perfis_dos_projetos" (
  "projectId" TEXT NOT NULL,
  "categoria" TEXT NOT NULL,
  "categoriaNome" TEXT NOT NULL,
  "categoriaNova" BOOLEAN NOT NULL DEFAULT false,
  "confianca" DOUBLE PRECISION,
  "negocio" TEXT,
  "negocioConfianca" DOUBLE PRECISION,
  "pessoa" TEXT,
  "pessoaConfianca" DOUBLE PRECISION,
  "fonte" TEXT NOT NULL,
  "textos" JSONB NOT NULL,
  "hashDosTextos" TEXT NOT NULL,
  "classificadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "perfis_dos_projetos_pkey" PRIMARY KEY ("projectId")
);

CREATE INDEX IF NOT EXISTS "perfis_dos_projetos_categoria_idx" ON "perfis_dos_projetos"("categoria");

DO $$ BEGIN
  ALTER TABLE "perfis_dos_projetos" ADD CONSTRAINT "perfis_dos_projetos_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. A LISTA ABERTA DE CATEGORIAS: as que o JEV aceitou a partir do texto de
-- um cliente quando nenhuma da casa servia. As da casa moram no código
-- (lib/admin/perfis/categorias.ts); aqui só as novas, com a origem.
CREATE TABLE IF NOT EXISTS "categorias_de_perfil" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "descricao" TEXT,
  "origem" TEXT NOT NULL,
  "textoDeOrigem" TEXT,
  "projetoDeOrigem" TEXT,
  "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "categorias_de_perfil_pkey" PRIMARY KEY ("id")
);
