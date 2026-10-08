/**
 * O INFOGRÁFICO: extração do conteúdo e desenho pelo modelo de imagem.
 *
 * Desde 08/10/2026:
 * 1. O Gemini (texto) extrai o conteúdo estruturado do post, em português e
 *    com os dados dele, uma vez por dia.
 * 2. O Nano Banana Pro (gemini-3-pro-image-preview, o modelo do Google feito
 *    para layout com texto) DESENHA o infográfico em cada proporção do dia,
 *    com o texto exato, a identidade aprovada e o estilo do dia
 *    (lib/media/infografico-pelo-modelo.ts). Entre 30/09 e 08/10 ele era um
 *    molde em código, e o Bruno reprovou: "os infográficos não estão usando
 *    um modelo de IA".
 * 3. A conferência do texto é a de toda arte (lib/media/arte-por-rede.ts), e
 *    `pedidoDoInfografico` entrega a ela o texto pedido e o outro modelo.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ProporcaoPedida } from "./formatos-das-redes";
import { exigirIdentidadeAprovada, type MarcaDaArte } from "@/lib/media/arte-com-frase";
import { semNumerosRepetidos } from "@/lib/media/infografico-sem-repeticao";
import { infograficoRepeteDado } from "@/lib/squad/coerencia-da-arte";
import type { PedidoDeArte } from "@/lib/media/arte-por-rede";
import {
  conteudoSemTravessao,
  gerarInfografico,
  OPERACAO_DO_INFOGRAFICO,
  ORDEM_ALTERNATIVA,
  ORDEM_PRINCIPAL,
  promptCompleto,
  textosDoInfografico,
  type OpcoesDoDesenho,
} from "@/lib/media/infografico-pelo-modelo";

/**
 * A direção de arte desta peça, decidida FORA daqui (lib/media/direcao-de-arte):
 * qual estilo e quais cores. Até 14/09 este arquivo escolhia sozinho, com cinco
 * paletas fixas mapeadas pelo NICHO do projeto e uma única frase de estilo, e
 * por isso todo infográfico de um mesmo cliente saía igual, fosse qual fosse o
 * tema. O nicho diz o assunto; a marca diz a cor; o estilo alterna.
 */
export interface DirecaoDeArte {
  /** Fragmento em inglês descrevendo composição, tipografia e acabamento. */
  estilo: string;
  /** Fragmento em inglês com as cores da marca do projeto. */
  paleta: string;
  /**
   * A identidade do projeto: cores nos papéis aprovados, letra, modelo do
   * book e a trava da aprovação. É o que o prompt do infográfico usa (08/10).
   */
  marca?: MarcaDaArte;
}

/**
 * O que o infográfico precisa saber além do texto do post.
 *
 * Até 18/09 ele recebia só o post e o nicho, e era o único agente da esteira
 * cego para o funil e para os documentos do projeto. O Bruno cobrou os dois
 * de uma vez: "tudo o que preenchemos no projeto, na campanha, o RAG do
 * cliente completo com histórico, deve alimentar todos os agentes".
 */
export interface RegrasDoInfografico {
  /** O estágio da campanha. Decide se a peça pode falar de produto. */
  funil?: "tofu" | "mofu" | "bofu";
  /** Os documentos do projeto, para acertar nomes e termos da marca. */
  marca?: string;
  /** O projeto, para o JEV conferir o conjunto (06/10) e o uso cair na conta certa. */
  projectId?: string | null;
}

export interface ConteudoDoInfografico {
  title: string;
  subtitle: string;
  sections: Array<{
    heading: string;
    body: string;
    stat?: string;
  }>;
  highlight?: { value: string; label: string };
  keyNumbers?: Array<{ value: string; label: string }>;
}

/** Step 1: Extract structured content from post in Portuguese */
async function extractContent(
  postContent: string,
  niche: string,
  apiKey: string,
  regras?: RegrasDoInfografico,
  /** A segunda tentativa, depois do veto do JEV: o que não repetir. */
  evitar?: string
): Promise<ConteudoDoInfografico> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // A REGRA DA OFERTA, escrita em 18/09.
  //
  // O Bruno leu um infográfico gerado daqui com o rodapé "7 Dias para teste
  // grátis (Demandou)". Esse prazo não está no post, não está no projeto e não
  // existe: o modelo montou um infográfico de VENDA porque o post citava a
  // plataforma, e "extraia os dados do post" não proíbe inventar uma oferta.
  //
  // Prometer condição comercial que ninguém autorizou é o pior defeito que uma
  // peça pode ter, porque ela vai ao ar no nome do cliente.
  const semOferta = `6. PROIBIDO inventar oferta comercial: teste grátis, prazo, preço, desconto, bônus, garantia ou qualquer chamada para ação que não esteja ESCRITA no post acima. Se o post não traz oferta, o infográfico não traz.
7. O infográfico EXPLICA o conteúdo do post. Ele não é anúncio: não transforme o post numa peça de venda do produto citado nele.`;

  const porFunil =
    regras?.funil === "tofu"
      ? "\n8. Este é conteúdo de TOPO DE FUNIL: nenhuma menção de produto em destaque, nenhum rodapé de conversão, nenhum logotipo de oferta. O leitor está aprendendo, não comprando."
      : regras?.funil === "mofu"
        ? "\n8. Conteúdo de MEIO DE FUNIL: o produto pode aparecer como exemplo, nunca como oferta."
        : "";

  const prompt = `Extraia os dados do post abaixo para montar um infográfico profissional para LinkedIn.
${regras?.marca ? `\nContexto da marca (para acertar nomes e termos, NÃO para virar propaganda):\n${regras.marca.slice(0, 1200)}\n` : ""}
⚠️ REGRAS ABSOLUTAS:
1. TODO texto deve estar em PORTUGUÊS BRASILEIRO.
2. NUNCA use lorem ipsum, placeholders ou inventar dados.
3. Use apenas informações reais do post.
4. Se faltar dado para algum campo, resuma a ideia principal do post.
5. O título NÃO pode começar com rótulos de categoria como "IA:", "AI:", "Tech:", "Digital:", "Inovação:" ou similares. Escreva direto a manchete.
${semOferta}${porFunil}
9. NUNCA abrevie palavra ("exper.", "qtd.", "info."): o texto vai inteiro para a peça. Se não couber no limite, reescreva mais curto com palavras inteiras.
10. CADA DADO APARECE UMA VEZ SÓ no infográfico inteiro: o número do "highlight" NÃO volta no "stat" de uma seção nem em "keyNumbers", e duas seções não repetem o mesmo número nem a mesma ideia. Sem outro dado com fonte para uma seção, deixe o "stat" dela vazio.${evitar ? `
11. A versão anterior REPETIU dado no conjunto (${evitar}). Escreva de novo sem nenhuma repetição.` : ""}

Retorne APENAS JSON válido sem markdown:
{
  "title": "manchete impactante em português (máx 60 chars — NÃO inicie com 'IA:', 'AI:' ou qualquer prefixo de categoria)",
  "subtitle": "frase complementar em português (máx 100 chars)",
  "sections": [
    {"heading": "título da seção em português (máx 40 chars)", "body": "descrição em português (máx 90 chars)", "stat": "número destaque opcional como '50 GW' ou 'R$ 7,6bi'"}
  ],
  "highlight": {"value": "número ou dado mais impactante (máx 15 chars)", "label": "o que significa em português (máx 35 chars)"},
  "keyNumbers": [{"value": "número", "label": "descrição em português (máx 30 chars)"}]
}

CONTEÚDO DO POST:
${postContent.slice(0, 3000)}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Gemini não retornou JSON estruturado");

  const data = JSON.parse(jsonMatch[0]) as ConteudoDoInfografico;

  data.sections = (data.sections ?? []).slice(0, 4);
  data.keyNumbers = (data.keyNumbers ?? []).slice(0, 3);

  return data;
}

/**
 * O conteúdo pronto para a peça: sem número repetido (a guarda pura vale em
 * todo caminho: conteúdo antigo, refazer, chat) e sem travessão.
 */
function conteudoDaPeca(content: ConteudoDoInfografico): ConteudoDoInfografico {
  const { conteudo, removidos } = semNumerosRepetidos(content);
  if (removidos.length) console.warn(`[Infographic] número repetido tirado da peça: ${removidos.join("; ")}`);
  return conteudoSemTravessao(conteudo);
}

/**
 * Desenha o infográfico numa PROPORÇÃO pedida, PELO MODELO DE IMAGEM desde
 * 08/10/2026 (o Nano Banana Pro primeiro; ver lib/media/infografico-pelo-modelo.ts).
 *
 * Entre 30/09 e 08/10 ele era montado em código, com a justificativa do
 * balão "Usar chocoers maxsto fbite" de 30/09. O preço foi um infográfico sem
 * ilustração nenhuma, que o Bruno leu como "não está usando modelo de IA".
 * Agora o modelo desenha e a conferência de arte (arte-por-rede) lê o que ele
 * escreveu contra o texto pedido, refazendo no outro modelo quando a escrita
 * erra. Nenhum modelo respondeu: lança `InfograficoSemImagem`.
 *
 * `_apiKey` ficou na assinatura para as chamadas antigas não mudarem de forma;
 * a chave é lida do ambiente por quem chama o Google.
 */
export async function desenharInfografico(
  content: ConteudoDoInfografico,
  _apiKey: string,
  proporcao: ProporcaoPedida,
  direcao: DirecaoDeArte,
  opcoes: OpcoesDoDesenho = {}
): Promise<string> {
  // A TRAVA DA IDENTIDADE vale para o infográfico também (06/10): marca de
  // projeto sem identidade aprovada não desenha, e o chamador que sabe esperar
  // marca a peça como "aguardando a sua identidade visual".
  if (direcao.marca) exigirIdentidadeAprovada(direcao.marca);
  const conteudo = conteudoDaPeca(content);
  const prompt = promptCompleto({ conteudo, marca: direcao.marca, proporcao, estilo: direcao.estilo, nicho: opcoes.nicho }, opcoes.complemento);
  const ctx = opcoes.ctx ?? { projectId: direcao.marca?.projectId, operation: OPERACAO_DO_INFOGRAFICO };
  const img = await gerarInfografico(prompt, proporcao, ctx, opcoes.ordem ?? ORDEM_PRINCIPAL, opcoes.gerar);
  return img.dataUrl;
}

/**
 * O PEDIDO DE ARTE DO INFOGRÁFICO, para `produzirArtePorRede` (08/10).
 *
 * Todo caminho que desenha infográfico (esteira, semana do vídeo, chat do
 * card, pedido pelo card, refazer a peça, Vera, "Aprovar e gerar") passa por
 * aqui, e por isso todos levam as mesmas três coisas:
 *   - `textoEsperado`: o texto que o modelo TEM de escrever, para a
 *     conferência ler a imagem contra ele;
 *   - `textoDesenhadoPeloModelo`: liga a leitura, a régua da margem e a
 *     contagem do texto faltando (o texto não é composto em código aqui);
 *   - `desenharAlternativo`: o outro modelo, quando a reprovação é de escrita.
 *
 * A trava da identidade roda AQUI, antes de qualquer chamada paga.
 */
export function pedidoDoInfografico(
  content: ConteudoDoInfografico,
  direcao: DirecaoDeArte,
  opcoes: Omit<OpcoesDoDesenho, "complemento" | "ordem"> = {}
): Pick<PedidoDeArte, "contentType" | "promptBase" | "textoEsperado" | "textoDesenhadoPeloModelo" | "desenhar" | "desenharAlternativo"> {
  if (direcao.marca) exigirIdentidadeAprovada(direcao.marca);
  const conteudo = conteudoDaPeca(content);
  const desenhar = (ordem: OpcoesDoDesenho["ordem"]) => (prompt: string, proporcao: ProporcaoPedida) =>
    desenharInfografico(conteudo, "", proporcao, direcao, { ...opcoes, complemento: prompt, ordem });
  return {
    contentType: "infographic",
    promptBase: "",
    textoEsperado: textosDoInfografico(conteudo),
    textoDesenhadoPeloModelo: true,
    desenhar: desenhar(ORDEM_PRINCIPAL),
    desenharAlternativo: desenhar(ORDEM_ALTERNATIVA),
  };
}

/** A extracao do conteudo, exposta para quem precisa desenhar MAIS DE UMA
 *  proporcao do mesmo infografico. Extrair custa uma chamada de texto; desenhar
 *  custa uma de imagem. Um dia que publica em Instagram e LinkedIn precisa de
 *  duas artes e de uma extracao so. */
export async function extrairConteudoDoInfografico(
  postContent: string,
  niche: string,
  apiKey: string,
  regras?: RegrasDoInfografico
): Promise<ConteudoDoInfografico> {
  const primeira = await extractContent(postContent, niche, apiKey, regras);
  // O JEV confere o CONJUNTO (06/10): o mesmo dado no destaque e num cartão,
  // ou dois cartões dizendo a mesma coisa, é vetado e a extração roda de novo
  // uma vez sabendo o que não repetir. O JEV decide; o Gemini só escreve.
  const conjunto = (c: ConteudoDoInfografico) => ({
    destaque: c.highlight?.value ? `${c.highlight.value} ${c.highlight.label ?? ""}`.trim() : undefined,
    cartoes: (c.sections ?? []).map((s) => [s.heading, s.stat, s.body].filter(Boolean).join(" | ")),
    rodape: (c.keyNumbers ?? []).map((n) => `${n.value} ${n.label ?? ""}`.trim()),
  });
  const veto = await infograficoRepeteDado({ projectId: regras?.projectId, conjunto: conjunto(primeira) });
  let escolhida = primeira;
  if (veto.repete) {
    console.warn(`[Infographic] o JEV vetou o conjunto por dado repetido (${veto.nota?.toFixed(2)}); extraio de novo uma vez.`);
    const repetidos = semNumerosRepetidos(primeira).removidos;
    escolhida = await extractContent(postContent, niche, apiKey, regras, repetidos.length ? repetidos.join("; ") : "um dado ou ideia aparece em dois lugares").catch((e) => {
      console.warn("[Infographic] a segunda extração falhou, fica a primeira com a guarda pura:", e instanceof Error ? e.message : e);
      return primeira;
    });
  }
  const { conteudo, removidos } = semNumerosRepetidos(escolhida);
  if (removidos.length) console.warn(`[Infographic] número repetido tirado do conjunto: ${removidos.join("; ")}`);
  return conteudo;
}

/**
 * Gera um infografico completo (extrai e desenha) numa proporcao.
 *
 * A assinatura mudou em 19/09: era `platform` e virou `proporcao`. O motivo e
 * o mesmo que trouxe a tabela de formatos: com `platform`, a decisao de formato
 * tinha dois donos (esta funcao e a esteira) e os dois discordavam. Com
 * proporcao, quem decide e a tabela, e aqui so se desenha o que foi pedido.
 */
export async function generateInfographic(
  postContent: string,
  niche: string,
  apiKey: string,
  proporcao: ProporcaoPedida = "4:5",
  direcao: DirecaoDeArte = {
    estilo: "Clean, modern infographic with clear sections.",
    paleta: "Use a coherent, professional color palette that fits the topic.",
  },
  regras?: RegrasDoInfografico
): Promise<string> {
  const content = await extrairConteudoDoInfografico(postContent, niche, apiKey, regras);
  console.log(`[Infographic] Conteudo extraido - secoes: ${content.sections.length}, proporcao: ${proporcao}`);

  // Desenhado pelo modelo de imagem (ver desenharInfografico), sem a
  // conferência de arte: quem precisa dela usa `pedidoDoInfografico`.
  return desenharInfografico(content, apiKey, proporcao, direcao, { nicho: niche, ctx: { projectId: regras?.projectId ?? undefined, operation: OPERACAO_DO_INFOGRAFICO } });
}
