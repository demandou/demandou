import { askClaudeComImagens } from "@/lib/claude";
import { treinamentoDoModelo, type ReferenciasDoModelo } from "@/lib/media/editor-do-curso/escrever-plano";

/**
 * O PASSO 8 DOS MODELOS DO CURSO (09/10/2026): "olhe cada imagem reduzida a
 * ~540 px e confira". No curso quem olha é a pessoa (ou o Claude no computador
 * dela); aqui o Claude olha as folhas com os quadros de cada momento
 * (scripts/stills.mjs --momentos) e aponta SÓ defeito concreto, com o
 * instante, o momento e a mudança verificável, como a skill bônus de revisão
 * do curso pede: preferência nova não é defeito, nada de inventar falha para
 * justificar outra rodada. O conserto volta ao redator do plano e passa de
 * novo pela conferência do curso no worker.
 */

export type ProblemaNoQuadro = { em?: number; momento?: string; problema: string; mudanca?: string };

const SISTEMA = `Você faz o passo 8 de uma skill do curso "Máquina de Edição IA": olhar os quadros de conferência de cada momento do vídeo já montado e apontar o que precisa ser corrigido no plano antes do render final.

O que conferir em cada quadro (o passo 8 do SKILL.md, que está no treinamento acima, manda; siga também o que ele diz de próprio deste modelo):
- o texto cabe e está INTEIRO: nenhuma palavra ou número cortado na borda, nada saindo do quadro, nada atrás de outro elemento;
- os números batem com a fala e aparecem quando são ditos;
- nada cobre o rosto onde a skill diz que o rosto fica livre; a moldura ou janela mostra a cabeça inteira;
- a legenda não colide com cartões, títulos ou rótulos;
- a tela muda de verdade, sem trecho parado longo;
- o estilo bate com a folha de quadros do exemplo do modelo.

Regras da revisão (skill bônus de revisão do curso): aponte só DEFEITO concreto e visível, nunca preferência; para cada um, o instante (s), o momento (tipo do bloco), o problema observado e a mudança verificável no plano (encurtar o texto com as palavras da fala, trocar de bloco, ajustar o retrato da janela, mover o instante). Se o que você vê é da gravação (pouca resolução, outra pessoa no vídeo, enquadramento da câmera) e não do plano, não aponte. Sem defeito, devolva a lista vazia. Nunca use travessão (—).

Responda SOMENTE com um objeto JSON, sem cerca de código: {"problemas": [{"em": 12.3, "momento": "grafico", "problema": "...", "mudanca": "..."}]}`;

export async function revisarQuadrosDoModelo(args: {
  referencias: ReferenciasDoModelo;
  plano: Record<string, unknown> | null;
  folhas: string[];
  legendas?: string[];
  /** Um trecho do vídeo longo (10/10): os tempos do plano e das folhas são os do trecho. */
  bloco?: { indice: number; total: number; inicio: number; fim: number } | null;
  modelo?: string;
  usage: { projectId?: string | null; operation: string };
  onCusto?: (usd: number) => void;
}): Promise<ProblemaNoQuadro[]> {
  if (!args.folhas.length) return [];
  const imagens = [
    ...(args.referencias.quadros ? [{ base64: args.referencias.quadros, rotulo: `A folha de quadros do EXEMPLO do modelo ${args.referencias.id} (o padrão a alcançar).` }] : []),
    ...args.folhas.map((base64, i) => ({ base64, rotulo: args.legendas?.[i] ?? `Folha ${i + 1} do vídeo montado` })),
  ];
  const momentos = (args.plano?.momentos as unknown[] | undefined) ?? [];
  const resposta = await askClaudeComImagens(
    SISTEMA,
    `${
      args.bloco
        ? `Este é o trecho ${args.bloco.indice + 1} de ${args.bloco.total} de um vídeo longo editado em trechos; os tempos dos momentos e das folhas são os do trecho (ele começa no zero). Abertura só existe no primeiro trecho e a chamada final só no último: a falta delas aqui não é defeito.

`
        : ""
    }Os momentos do plano aprovado (tipo, de, ate e os textos), para você ligar cada quadro ao momento:
${JSON.stringify(momentos).slice(0, 40_000)}

Olhe as folhas do vídeo montado e devolva os defeitos.`,
    imagens,
    {
      cachedPrefix: treinamentoDoModelo(args.referencias),
      model: args.modelo,
      maxTokens: 16_000,
      timeoutMs: 8 * 60_000,
      usage: { projectId: args.usage.projectId ?? undefined, operation: args.usage.operation },
      onCusto: args.onCusto,
    }
  );
  const limpo = resposta.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  let bruto: { problemas?: Array<Record<string, unknown>> } = {};
  try {
    bruto = JSON.parse(limpo);
  } catch {
    const a = limpo.indexOf("{");
    const b = limpo.lastIndexOf("}");
    if (a >= 0 && b > a) bruto = JSON.parse(limpo.slice(a, b + 1));
  }
  return (bruto.problemas ?? [])
    .filter((p) => typeof p.problema === "string" && p.problema.trim())
    .slice(0, 12)
    .map((p) => ({
      em: typeof p.em === "number" ? p.em : undefined,
      momento: typeof p.momento === "string" ? p.momento : undefined,
      problema: String(p.problema).slice(0, 300),
      mudanca: typeof p.mudanca === "string" ? p.mudanca.slice(0, 300) : undefined,
    }));
}
