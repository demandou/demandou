import { conferirCustoPorConta } from "@/lib/seguranca/limite";

/**
 * O TETO DE IA POR CONTA, NA PORTA DO CLIENTE DO CLAUDE (08/10/2026).
 *
 * Mora aqui, e não em cada rota, porque são mais de vinte rotas que chamam o
 * modelo para uma conta logada (assistente do quadro, sugestões, conversa
 * com o agente, reescrita, cérebro) e nem todas debitam crédito. Uma rota
 * esquecida seria a porta do ataque de custo. Dentro de `askClaude` nenhuma
 * fica de fora.
 *
 * Fora de uma requisição (cron, fila, callback do worker, script) não há
 * sessão, e a chamada passa: o teto é para quem está logado chamando em laço,
 * e a esteira do produto tem a própria cota por plano.
 */
export async function conferirCustoDaSessao(onde: string): Promise<void> {
  // O executor de testes do Node não tem requisição nem banco.
  if (process.env.NODE_TEST_CONTEXT) return;
  let userId: string | null = null;
  try {
    const { auth } = await import("@/lib/auth/server");
    userId = (await auth()).userId;
  } catch {
    // headers() fora do escopo de uma requisição: não é gente logada.
    return;
  }
  if (!userId) return;
  await conferirCustoPorConta(userId, onde);
}
