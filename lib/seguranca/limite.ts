import { prisma } from "@/lib/db/prisma";

/**
 * O CONTADOR DE LIMITE DE TAXA (08/10/2026), compartilhado entre as instâncias.
 *
 * Por que existe: o limitador nativo do better-auth guarda o contador em
 * memória, e na Vercel cada instância tem a sua, ou seja o limite valia por
 * instância e zerava a cada partida a frio. A porta anti-robô
 * (lib/anti-robo/porta.ts) já conta no Postgres, mas conta por rota e por
 * janela longa, e grava uma linha por tentativa. Aqui é o oposto: UMA linha
 * por chave, janela fixa, um comando só (INSERT ... ON CONFLICT) que conta e
 * decide no mesmo passo, sem corrida entre duas requisições.
 *
 * A chave diz quem e o quê: "auth:/sign-in/email:<ip>" para o better-auth,
 * "conta:llm:<userId>" para o custo de IA por conta, "ip:email_existe:<ip>"
 * para a enumeração. Quem chama escolhe a janela e o teto.
 *
 * Falha do banco NÃO tranca a porta: o limite é uma camada, e trancar todo
 * mundo por uma piscada do Postgres seria o ataque de negação feito por nós.
 * A falha é registrada no log.
 */

export type Regra = { janelaMs: number; max: number };

export type Decisao = {
  ok: boolean;
  /** Quantas vezes a chave foi usada na janela corrente, contando esta. */
  contagem: number;
  /** Segundos até a janela abrir de novo. Zero quando ok. */
  esperarS: number;
};

export type DepositoDoLimite = {
  /** Soma um na chave dentro da janela e devolve a contagem e o início da janela. */
  consumir(chave: string, janelaMs: number, agoraMs: number): Promise<{ contagem: number; inicioMs: number }>;
  /** Apaga as linhas cuja janela começou antes de `antesDeMs`. */
  limpar(antesDeMs: number): Promise<void>;
};

/** Para os testes: a mesma regra, sem banco. */
export function depositoEmMemoria(): DepositoDoLimite & { linhas: Map<string, { contagem: number; inicioMs: number }> } {
  const linhas = new Map<string, { contagem: number; inicioMs: number }>();
  return {
    linhas,
    async consumir(chave, janelaMs, agoraMs) {
      const atual = linhas.get(chave);
      if (!atual || atual.inicioMs <= agoraMs - janelaMs) {
        const nova = { contagem: 1, inicioMs: agoraMs };
        linhas.set(chave, nova);
        return { ...nova };
      }
      atual.contagem += 1;
      return { ...atual };
    },
    async limpar(antesDeMs) {
      for (const [k, v] of linhas) if (v.inicioMs < antesDeMs) linhas.delete(k);
    },
  };
}

function depositoDoPrisma(): DepositoDoLimite {
  return {
    async consumir(chave, janelaMs, agoraMs) {
      const agora = BigInt(agoraMs);
      const limite = BigInt(agoraMs - janelaMs);
      // Tagged template: cada ${} vira $n. Nada da chave entra no texto da SQL.
      const linhas = await prisma.$queryRaw<Array<{ contagem: number; inicioMs: bigint }>>`
        INSERT INTO "limites_de_taxa" ("chave", "contagem", "inicioMs")
        VALUES (${chave}, 1, ${agora})
        ON CONFLICT ("chave") DO UPDATE SET
          "contagem" = CASE WHEN "limites_de_taxa"."inicioMs" <= ${limite} THEN 1 ELSE "limites_de_taxa"."contagem" + 1 END,
          "inicioMs" = CASE WHEN "limites_de_taxa"."inicioMs" <= ${limite} THEN ${agora} ELSE "limites_de_taxa"."inicioMs" END
        RETURNING "contagem", "inicioMs"`;
      const l = linhas[0];
      return { contagem: Number(l.contagem), inicioMs: Number(l.inicioMs) };
    },
    async limpar(antesDeMs) {
      await prisma.limiteDeTaxa.deleteMany({ where: { inicioMs: { lt: BigInt(antesDeMs) } } });
    },
  };
}

let depositoPadrao: DepositoDoLimite | null = null;

/** Troca o depósito (testes). Null volta ao Postgres. */
export function usarDepositoDoLimite(dep: DepositoDoLimite | null): void {
  depositoPadrao = dep;
}

function deposito(): DepositoDoLimite {
  return depositoPadrao ?? depositoDoPrisma();
}

/** A maior janela que alguém usa; linhas mais velhas que isso podem ir embora. */
const JANELA_MAXIMA_MS = 25 * 60 * 60 * 1000;

/**
 * Conta mais uma vez a chave e diz se ainda cabe. Decide com `contagem <= max`,
 * então a requisição recusada também conta: martelar a porta fechada não
 * adianta a abertura dela.
 */
export async function consumir(chave: string, regra: Regra, agoraMs = Date.now()): Promise<Decisao> {
  try {
    const dep = deposito();
    const r = await dep.consumir(chave, regra.janelaMs, agoraMs);
    // A limpeza vem de carona, numa fração das chamadas (como em tentativas_publicas).
    if (Math.random() < 0.01) await dep.limpar(agoraMs - JANELA_MAXIMA_MS).catch(() => {});
    if (r.contagem <= regra.max) return { ok: true, contagem: r.contagem, esperarS: 0 };
    const esperarS = Math.max(1, Math.ceil((r.inicioMs + regra.janelaMs - agoraMs) / 1000));
    return { ok: false, contagem: r.contagem, esperarS };
  } catch (e) {
    console.warn("[limite] não consegui contar; a porta segue aberta", e instanceof Error ? e.message : e);
    return { ok: true, contagem: 0, esperarS: 0 };
  }
}

/**
 * O armazém que o better-auth usa no lugar da memória. Ele chama `consume`
 * (atômico) quando existe; `get` e `set` ficam para a forma antiga da API.
 */
export function armazemDoBetterAuth() {
  type Linha = { key: string; count: number; lastRequest: number };
  return {
    async get(key: string): Promise<Linha | null> {
      try {
        const l = await prisma.limiteDeTaxa.findUnique({ where: { chave: key } });
        return l ? { key, count: l.contagem, lastRequest: Number(l.inicioMs) } : null;
      } catch {
        return null;
      }
    },
    async set(key: string, value: Linha): Promise<void> {
      try {
        await prisma.limiteDeTaxa.upsert({
          where: { chave: key },
          create: { chave: key, contagem: value.count, inicioMs: BigInt(value.lastRequest) },
          update: { contagem: value.count, inicioMs: BigInt(value.lastRequest) },
        });
      } catch (e) {
        console.warn("[limite] não consegui gravar", e instanceof Error ? e.message : e);
      }
    },
    async consume(key: string, rule: { window: number; max: number }): Promise<{ allowed: boolean; retryAfter: number | null }> {
      const d = await consumir(`auth:${key}`, { janelaMs: rule.window * 1000, max: rule.max });
      return d.ok ? { allowed: true, retryAfter: null } : { allowed: false, retryAfter: d.esperarS };
    },
  };
}

/** Os tetos por conta das chamadas de IA de texto, por minuto e por dia. */
export const CUSTO_POR_CONTA: { minuto: Regra; dia: Regra } = {
  // Uma tela que dispara vinte blocos em paralelo cabe; um laço não.
  minuto: { janelaMs: 60_000, max: Number(process.env.LLM_POR_CONTA_MINUTO ?? 120) },
  dia: { janelaMs: 24 * 60 * 60 * 1000, max: Number(process.env.LLM_POR_CONTA_DIA ?? 2_000) },
};

export class LimiteExcedido extends Error {
  readonly status = 429;
  readonly esperarS: number;
  constructor(mensagem: string, esperarS: number) {
    super(mensagem);
    this.name = "LimiteExcedido";
    this.esperarS = esperarS;
  }
}

/**
 * O CUSTO DE IA POR CONTA. Uma conta logada chamando a IA em laço gasta a
 * chave da Demandou, e crédito do plano não cobre toda rota (assistente do
 * quadro, sugestões, conversa com o agente). Dois tetos, minuto e dia, por
 * conta. Lança `LimiteExcedido` quando passa; quem chama devolve 429.
 */
export async function conferirCustoPorConta(userId: string, onde: string): Promise<void> {
  const [minuto, dia] = await Promise.all([
    consumir(`conta:llm:minuto:${userId}`, CUSTO_POR_CONTA.minuto),
    consumir(`conta:llm:dia:${userId}`, CUSTO_POR_CONTA.dia),
  ]);
  if (!minuto.ok || !dia.ok) {
    const d = !minuto.ok ? minuto : dia;
    console.warn(`[limite] conta ${userId} passou do teto de IA em "${onde}" (${d.contagem} na janela)`);
    throw new LimiteExcedido(
      "Você fez muitos pedidos à IA em pouco tempo. Espere um pouco e tente de novo.",
      d.esperarS
    );
  }
}
