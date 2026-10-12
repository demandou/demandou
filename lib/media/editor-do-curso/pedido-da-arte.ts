import { askClaude, askClaudeComImagem } from "@/lib/claude";
import { jevLigado, perguntarAoJev, probabilidadeDeSim } from "@/lib/jev/cliente";

/**
 * O PEDIDO DO CLIENTE VIRA DIREÇÃO DE ARTE (12/10/2026, pedido do Bruno).
 *
 * "O usuário não sabe criar prompt para gerar boas imagens; os pedidos vão ser
 * iguais aos meus. Cabe à nossa IA melhorar o prompt, detalhar, colocar os
 * truques que criam imagens incríveis." O pedido dele foi: "troca a minha foto
 * pela que acabei de subir nos materiais, diminui um pouco, faz um efeito de
 * luz, e traz um recorte de papel com o globo no cantinho de cima à direita".
 * O chat leu "recorte de papel" como "estilo de colagem", trocou o estilo e
 * não fez nada do resto.
 *
 * Aqui o Claude ESCREVE (a regra da casa: LLM só redige): a direção de arte em
 * inglês para a IA de imagem, o que é da PESSOA (escala, luz, a foto nova dos
 * materiais), que o código faz e a IA nunca desenha, e a lista do que precisa
 * aparecer. Depois o Haiku descreve a arte pronta e o JEV DECIDE item a item
 * se o pedido foi cumprido.
 */

export type PedidoReescrito = {
  /** A direção de arte em inglês, para o prompt do estilo (o ajuste do cliente). */
  direcao: string;
  /** O que é da pessoa colada em código. */
  pessoa: { escala: number | null; luz: boolean };
  /** O cliente pediu a foto que acabou de subir nos materiais. */
  fotoNovaDosMateriais: boolean;
  /** O que precisa aparecer na arte, em frases curtas e conferíveis (pt-BR). */
  itens: string[];
};

const SISTEMA = `Você é diretor de arte de uma agência e traduz o pedido de um cliente leigo para a IA de imagem que desenha a FUNDO de uma peça de rede social. O estilo da peça, as cores da marca e o texto exato já estão definidos e NÃO mudam: você só detalha o que o cliente quer mudar.

Responda APENAS um JSON, sem nada fora dele:
{"direcao": "...", "pessoa": {"escala": número ou null, "luz": true|false}, "fotoNovaDosMateriais": true|false, "itens": ["...", "..."]}

- "direcao": em INGLÊS, de 2 a 6 frases, como um diretor de arte experiente escreveria para um modelo de imagem: o objeto pedido com materiais e textura reais (ex.: "a torn paper cutout with visible fibers and a soft drop shadow"), a POSIÇÃO exata na peça (ex.: "in the top right corner, occupying about 18% of the width, slightly tilted"), a luz (direção, cor, intensidade), profundidade e o que fica limpo para o texto. Use os truques que deixam imagem boa: luz de recorte, sombra de contato, textura real, profundidade de campo, composição com espaço negativo. NUNCA desenhe pessoa, rosto nem mãos: a pessoa real é colada depois, em código. Nada de texto na imagem além do que o estilo já pede.
- "pessoa": o que o cliente pediu sobre ELE MESMO na peça. "escala": 0.85 para "diminui um pouco", 0.7 para "bem menor", 1.12 para "aumenta um pouco"; null se não pediu. "luz": true se pediu efeito de luz, brilho, contraluz ou luz atrás dele.
- "fotoNovaDosMateriais": true se ele pediu para usar a foto que subiu nos materiais (ou a foto nova, a última foto).
- "itens": de 1 a 5 frases curtas em português, cada uma CONFERÍVEL olhando a arte pronta (ex.: "um globo dentro de um recorte de papel no canto superior direito"). Não inclua o texto da peça nem o estilo.

"Recorte de papel" é um OBJETO dentro da arte, não um pedido para trocar o estilo.`;

/** Lê a resposta do Claude: só campos conhecidos, escala entre 0,55 e 1,25, até 5 itens. Puro (testado). */
export function lerPedidoReescrito(bruto: string): PedidoReescrito | null {
  try {
    const limpo = bruto.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
    const j = JSON.parse(limpo.slice(limpo.indexOf("{"), limpo.lastIndexOf("}") + 1)) as Record<string, unknown>;
    const direcao = typeof j.direcao === "string" ? j.direcao.trim().slice(0, 900) : "";
    if (!direcao) return null;
    const pessoa = (j.pessoa ?? {}) as { escala?: unknown; luz?: unknown };
    const escala = typeof pessoa.escala === "number" && Number.isFinite(pessoa.escala) ? Math.min(1.25, Math.max(0.55, pessoa.escala)) : null;
    const itens = (Array.isArray(j.itens) ? j.itens : []).filter((i): i is string => typeof i === "string" && i.trim().length > 3).map((i) => i.trim().slice(0, 160)).slice(0, 5);
    return { direcao, pessoa: { escala, luz: pessoa.luz === true }, fotoNovaDosMateriais: j.fotoNovaDosMateriais === true, itens };
  } catch {
    return null;
  }
}

/** O Claude reescreve o pedido do cliente. Null quando não deu: quem chama segue com o pedido como veio. */
export async function reescreverPedidoDaArte(o: { pedido: string; frase: string | null; estilo: string; formato: string; projectId: string; runId?: string | null }): Promise<PedidoReescrito | null> {
  const usuario = `Estilo da peça (não muda): ${o.estilo}.
Formato: ${o.formato}.
${o.frase ? `Texto exato da peça (não muda): "${o.frase}".\n` : ""}
Pedido do cliente, como ele falou: ${o.pedido}`;
  try {
    const bruto = await askClaude(SISTEMA, usuario, { maxTokens: 4000, timeoutMs: 60_000, usage: { operation: "pedido_da_arte_reescrito", projectId: o.projectId, runId: o.runId ?? undefined } });
    return lerPedidoReescrito(bruto);
  } catch (e) {
    console.warn("[pedido-da-arte] a reescrita falhou; segue o pedido como veio:", e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * O PEDIDO FOI CUMPRIDO? O Haiku descreve a arte (o que tem e onde) e o JEV
 * decide cada item. Devolve os itens que faltaram (vazio: cumpriu); null
 * quando não deu para conferir (sem JEV ou falha), e quem chama segue.
 */
export async function itensQueFaltaram(o: { arte: string; itens: string[]; projectId: string; runId?: string | null }): Promise<string[] | null> {
  if (!o.itens.length || !jevLigado()) return null;
  try {
    const base64 = o.arte.startsWith("data:") ? o.arte.slice(o.arte.indexOf(",") + 1) : null;
    if (!base64) return null;
    const descricao = await askClaudeComImagem(
      "Descreva objetivamente esta arte de rede social em português: cada elemento visível, onde ele está (canto, lado, centro, em cima, embaixo), o tamanho aproximado, a luz e a pessoa (se há, o tamanho dela na peça e se há luz atrás dela). Não julgue a qualidade.",
      "Descreva a arte.",
      base64,
      "image/jpeg",
      { model: process.env.CONFERENCIA_MODELO_DA_DESCRICAO || "claude-haiku-4-5", maxTokens: 4000, timeoutMs: 45_000, usage: { projectId: o.projectId, runId: o.runId ?? undefined, operation: "pedido_da_arte_descricao" } }
    );
    const perguntas = Object.fromEntries(
      o.itens.map((item, i) => [`i${i}`, { type: "noul" as const, instructions: `A descrição da arte mostra isto: "${item}"? Responda sim só se o elemento está lá e no lugar pedido.` }])
    );
    const r = await perguntarAoJev({ projectId: o.projectId, etapa: "pedido-da-arte", state: { descricao_da_arte: descricao.slice(0, 3000) } }, perguntas);
    return o.itens.filter((_, i) => (probabilidadeDeSim(r[`i${i}`]) ?? 1) < 0.5);
  } catch (e) {
    console.warn("[pedido-da-arte] a conferência do pedido falhou; segue sem ela:", e instanceof Error ? e.message : e);
    return null;
  }
}
