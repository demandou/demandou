import { askClaude, askClaudeComImagens } from "@/lib/claude";
import { instrucaoDasPecasParadas, treinamentoDoModelo, type EsqueletoDoPlano, type PecasParadas, type ReferenciasDoModelo } from "@/lib/media/editor-do-curso/escrever-plano";

/**
 * O PASSO 6b DOS MODELOS COM IMAGEM (09/10/2026): references/imagens.md do
 * curso. A pessoa fala "mel" e o pote de mel aparece.
 *
 *   1. o Claude faz o mapa (passo 6) e lista os momentos de imagem
 *      (work/imagens.json): o que a pessoa nomeia e vale mostrar;
 *   2. o worker roda o scripts/imagens.mjs do curso: busca candidatas grátis
 *      (Openverse, Wikimedia, Pexels com chave, Fluent Emoji 3D), filtra marca,
 *      pessoa famosa e licença, e monta a folha numerada (work/imagens*.jpg);
 *   3. o Claude OLHA a folha e escolhe a candidata e o foco de cada pedido,
 *      como o curso manda ("a escolha na folha é obrigatória"); nenhuma serve,
 *      pede outra busca uma vez ou fica o cartão com a palavra;
 *   4. o worker grava as escolhas pelo mesmo script e o plano usa
 *      `imagem: { id, efeito }`.
 *
 * Escolher olhando a imagem é o método do curso e o JEV não vê imagem: por isso
 * a escolha fica com o Claude, sempre dentro das regras da skill.
 */

export type PedidoDeImagem = { id: string; em: number; palavra: string; busca?: string; tipo: "foto" | "objeto" };

export type EscolhaDeImagem =
  | { id: string; n: number; foco?: [number, number] }
  | { id: string; refazer: string }
  | { id: string; n: 0 };

const SISTEMA_DOS_PEDIDOS = `Você é o editor de vídeo que executa uma skill do curso "Máquina de Edição IA" dentro de um sistema automático. Agora você faz o passo 6 (o mapa editorial, references/adaptar.md) e o passo 6b (a lista de imagens, references/imagens.md) desta skill.

Regras do passo 6b, da própria skill:
- liste cada coisa concreta que a pessoa nomeia e que vale mostrar, um a cada 2 a 4 s nos trechos de imagem, nunca duas na mesma frase; siga o que a skill diz sobre onde a imagem entra neste modelo;
- id curto sem acento; em = o instante da palavra (tirado da lista de palavras); palavra = como foi dita;
- busca em INGLÊS, concreta, como alguém descreveria a foto ("camera tripod", não "tripod"); bicho e planta pelo nome científico; comida regional com o lugar;
- tipo "foto" ou "objeto" (coisa isolada que vira adesivo); NUNCA "print" (não há pasta do usuário);
- nada de pessoa famosa, marca, logo ou produto de marca na busca; nada que a fala não nomeou.
Nunca use o travessão (—).

Responda SOMENTE com um objeto JSON, sem cerca de código: {"mapa": "<o mapa editorial em markdown, uma linha por batida>", "imagens": [{"id": "...", "em": 0.0, "palavra": "...", "busca": "...", "tipo": "foto"}]}`;

const SISTEMA_DA_ESCOLHA = `Você é o editor de vídeo que executa o passo 6b de uma skill do curso "Máquina de Edição IA": escolher, olhando as folhas numeradas, a imagem de cada pedido e o foco.

Como escolher (references/imagens.md): o assunto inteiro e reconhecível em 1 segundo; fundo limpo; foto de verdade (não pintura, não ilustração) quando o tipo é foto; em pé quando vai para tela cheia; nada de gente reconhecível, logo, texto grande ou marca d'água; nada de animal morto ou cena desagradável. Prefira licença sem obrigação de crédito (verde) quando a qualidade for parecida, e imagem maior a "pequena". O número amarelo de cada candidata é o n. O foco é o ponto do assunto em frações da imagem inteira (as linhas finas marcam 0,25, 0,5 e 0,75): [x, y].
Nenhuma serve: peça outra busca em inglês, mais concreta ({"id", "refazer": "novo termo"}), ou fique sem imagem ({"id", "n": 0}): cartão é melhor que imagem errada.

Responda SOMENTE com um objeto JSON, sem cerca de código: {"escolhas": [{"id": "...", "n": 2, "foco": [0.5, 0.4]} | {"id": "...", "refazer": "..."} | {"id": "...", "n": 0}]}`;

function lerJson<T>(texto: string): T {
  const limpo = texto.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(limpo) as T;
  } catch {
    const a = limpo.indexOf("{");
    const b = limpo.lastIndexOf("}");
    if (a >= 0 && b > a) return JSON.parse(limpo.slice(a, b + 1)) as T;
    throw new Error("a resposta não veio em JSON válido");
  }
}

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Passo 6 e 6b: o mapa e a lista de imagens. */
export async function pedirImagensDoModelo(args: {
  referencias: ReferenciasDoModelo;
  esqueleto: EsqueletoDoPlano;
  nicho?: string | null;
  /** Os posts da campanha no estilo do modelo: no máximo uma imagem por peça, junto do texto dela. */
  pecasParadas?: PecasParadas | null;
  modelo?: string;
  usage: { projectId?: string | null; runId?: string | null; operation: string };
  onCusto?: (usd: number) => void;
}): Promise<{ mapa: string; imagens: PedidoDeImagem[] }> {
  const { referencias, esqueleto } = args;
  const pedido = `# O VÍDEO NO MODELO ${referencias.id}
${args.nicho ? `Assunto do perfil (contexto, não é texto de tela): ${args.nicho}\n` : ""}
Duração: ${esqueleto.duracao} s. A fala no vídeo já cortado (início–fim em segundos e a palavra):
${esqueleto.palavras.map((p) => `${p.em.toFixed(2)}–${p.ate.toFixed(2)} ${p.w}`).join("\n")}

${
    args.pecasParadas
      ? `${instrucaoDasPecasParadas(args.pecasParadas)}

Imagens no modo peças paradas: no máximo UMA imagem por peça, de uma coisa concreta que o texto da peça nomeia, e só para a peça cujo bloco vai mostrar o texto inteiro junto da imagem (do jeito que este modelo põe imagem). Peça sem coisa concreta fica sem imagem. Faça o mapa editorial (uma linha por peça) e a lista de imagens destas peças neste modelo.`
      : "Faça o mapa editorial e a lista de imagens deste vídeo neste modelo."
  }`;
  const opcoes = {
    cachedPrefix: treinamentoDoModelo(referencias),
    model: args.modelo,
    maxTokens: 32_000,
    timeoutMs: 12 * 60_000,
    usage: { projectId: args.usage.projectId ?? undefined, runId: args.usage.runId ?? undefined, operation: args.usage.operation },
    onCusto: args.onCusto,
  };
  const resposta = referencias.quadros
    ? await askClaudeComImagens(SISTEMA_DOS_PEDIDOS, pedido, [{ base64: referencias.quadros, rotulo: `references/exemplo/quadros.jpg do modelo ${referencias.id}: um quadro de cada momento do exemplo, com o bloco e a fala.` }], opcoes)
    : await askClaude(SISTEMA_DOS_PEDIDOS, pedido, opcoes);
  const r = lerJson<{ mapa?: string; imagens?: Array<Partial<PedidoDeImagem>> }>(resposta);
  const vistos = new Set<string>();
  const imagens: PedidoDeImagem[] = [];
  for (const p of r.imagens ?? []) {
    const id = semAcento(String(p.id ?? "")).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
    if (!id || vistos.has(id) || typeof p.em !== "number" || !p.palavra || !p.busca) continue;
    if (p.em < 0 || p.em > esqueleto.duracao) continue;
    vistos.add(id);
    imagens.push({ id, em: +p.em.toFixed(2), palavra: String(p.palavra).slice(0, 60), busca: String(p.busca).slice(0, 80), tipo: p.tipo === "objeto" ? "objeto" : "foto" });
  }
  return { mapa: String(r.mapa ?? ""), imagens: imagens.slice(0, 12) };
}

/** Passo 6b, a escolha: o Claude olha as folhas numeradas e escolhe. */
export async function escolherImagensDoModelo(args: {
  referencias: ReferenciasDoModelo;
  /** work/imagens.json depois do imagens.mjs: os pedidos com as candidatas (fonte, licença, tamanho). */
  pedidos: unknown[];
  /** As folhas (work/imagens.jpg, imagens-2.jpg...) em base64. */
  folhas: string[];
  modelo?: string;
  usage: { projectId?: string | null; runId?: string | null; operation: string };
  onCusto?: (usd: number) => void;
}): Promise<EscolhaDeImagem[]> {
  if (!args.folhas.length) return [];
  const resposta = await askClaudeComImagens(
    SISTEMA_DA_ESCOLHA,
    `Modelo ${args.referencias.id}. Os pedidos, com as candidatas que o script achou (fonte, licença, tamanho):
${JSON.stringify(args.pedidos).slice(0, 30_000)}

${args.referencias.imagens ? `O que a skill diz sobre como a imagem entra neste modelo (trecho de references/imagens.md e do SKILL.md):\n${(args.referencias.skill ?? "").split("\n").filter((l) => /imagem|foto|recorte|adesivo/i.test(l)).slice(0, 40).join("\n")}\n` : ""}
Escolha uma resposta para cada pedido.`,
    args.folhas.map((base64, i) => ({ base64, rotulo: `Folha ${i + 1} (work/imagens${i ? `-${i + 1}` : ""}.jpg)` })),
    {
      model: args.modelo,
      maxTokens: 16_000,
      timeoutMs: 8 * 60_000,
      usage: { projectId: args.usage.projectId ?? undefined, runId: args.usage.runId ?? undefined, operation: args.usage.operation },
      onCusto: args.onCusto,
    }
  );
  const r = lerJson<{ escolhas?: Array<Record<string, unknown>> }>(resposta);
  const escolhas: EscolhaDeImagem[] = [];
  for (const e of r.escolhas ?? []) {
    const id = String(e.id ?? "");
    if (!id) continue;
    if (typeof e.refazer === "string" && e.refazer.trim()) escolhas.push({ id, refazer: e.refazer.trim().slice(0, 80) });
    else if (Number(e.n) === 0) escolhas.push({ id, n: 0 });
    else if (Number.isInteger(Number(e.n)) && Number(e.n) > 0) {
      const f = Array.isArray(e.foco) && e.foco.length === 2 ? (e.foco as unknown[]).map((v) => Math.min(1, Math.max(0, Number(v)))) : undefined;
      escolhas.push({ id, n: Number(e.n), ...(f && f.every((v) => Number.isFinite(v)) ? { foco: [f[0], f[1]] as [number, number] } : {}) });
    }
  }
  return escolhas;
}
