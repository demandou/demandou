-- O CONTADOR DE LIMITE DE TAXA (08/10/2026). Pedido do Bruno: a Demandou
-- 100% contra invasão. O limitador do better-auth guardava o contador em
-- memória, que na Vercel vale por instância e zera a cada partida a frio.
-- Esta tabela é o contador compartilhado: uma linha por chave, janela fixa,
-- escrita com INSERT ... ON CONFLICT (lib/seguranca/limite.ts).
--
-- Aditiva e com IF NOT EXISTS, como as outras: rodar duas vezes não quebra.
-- Entra pelo build (scripts/build.mjs), primeiro no Preview de dev e depois
-- na produção.

CREATE TABLE IF NOT EXISTS "limites_de_taxa" (
  "chave" TEXT NOT NULL,
  "contagem" INTEGER NOT NULL DEFAULT 0,
  "inicioMs" BIGINT NOT NULL,
  CONSTRAINT "limites_de_taxa_pkey" PRIMARY KEY ("chave")
);

CREATE INDEX IF NOT EXISTS "limites_de_taxa_inicioMs_idx" ON "limites_de_taxa"("inicioMs");
