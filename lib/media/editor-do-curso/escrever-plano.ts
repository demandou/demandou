import { askClaude, askClaudeComImagens } from "@/lib/claude";
import { numerosDoTexto } from "@/lib/media/numeros-falados";
import { imagensDoMaterial, instrucaoDoMaterial, type MaterialParaORedator } from "@/lib/media/editor-do-curso/material-do-modelo";

/**
 * O MAPA E O PLANO DOS MODELOS DO CURSO (09/10/2026): os passos 6 e 7 do
 * SKILL.md de cada modelo, que no curso o Claude faz no computador do aluno.
 *
 * O Claude recebe o treinamento INTEIRO do modelo (SKILL.md, references/plano.md,
 * adaptar.md, estilo.md, os tipos de src/plano.ts e o exemplo comentado), a
 * fala já cortada com o tempo de cada palavra, e escreve o mapa editorial e os
 * campos do plano que o curso manda o aluno escrever (marca, momentos,
 * semLegenda, correções e os campos próprios do modelo). Quem decide se o plano
 * vale é o `conferir.mjs` do próprio curso, no worker, e a guarda de número
 * abaixo; reprovado, o motivo volta para cá e o Claude conserta só o apontado.
 *
 * Os textos de referência chegam do worker (worker/modelos/<id>/referencias),
 * que é onde os modelos moram: uma cópia só, a mesma que o render usa.
 */

export type ReferenciasDoModelo = {
  id: string;
  /** references/exemplo/quadros.jpg em base64: um quadro de cada momento do exemplo, com o bloco e a fala. */
  quadros?: string | null;
  skill: string | null;
  plano: string | null;
  adaptar: string | null;
  estilo: string | null;
  imagens: string | null;
  exemploComentado: string | null;
  exemploPlano: string | null;
  tipos: string | null;
  modelo: Record<string, unknown>;
  outros: { nome: string; texto: string }[];
};

export type PalavraDoPlano = { em: number; ate: number; w: string };

export type EsqueletoDoPlano = {
  duracao: number;
  fps: number;
  videoAltura?: number;
  rosto: { x: number; y: number } | null;
  zona?: { topo: number; altura: number };
  cortesEm?: number[];
  palavras: PalavraDoPlano[];
  [campo: string]: unknown;
};

export type PlanoEscrito = {
  mapa: string;
  plano: Record<string, unknown>;
};

export type RetornoDaConferencia = {
  /** O plano que foi conferido (o que o Claude escreveu na volta anterior). */
  plano: Record<string, unknown>;
  /** A saída do conferir.mjs e dos gates de tempo, como o curso imprime. */
  saidas: string[];
  /** Os números que a guarda não achou na fala. */
  numerosSemLastro?: string[];
};

const CAMPOS_DO_MOTOR = new Set(["video", "fps", "largura", "altura", "duracao", "videoAltura", "rosto", "zona", "cortesEm", "palavras", "enquadramentos", "imagens"]);

/**
 * AS PEÇAS PARADAS (10/10/2026, regra do Bruno): os posts da campanha (post,
 * capa e lâminas de carrossel, infográfico) saem no MESMO estilo do vídeo
 * editado pelo modelo do curso, desenhados pelo template do próprio modelo
 * (worker/src/modelo/arte-no-modelo.mjs). O worker lê o texto das peças como
 * uma fala sintética, uma peça depois da outra, e cada peça vira um quadro
 * parado do render. O plano é o mesmo do vídeo; o que muda é este bloco de
 * instrução, que só entra quando `pecasParadas` vem no pedido.
 */
export type TipoDePecaParada = "post" | "capa" | "lamina" | "infografico";

export type PecaParada = {
  /** 1, 2, 3... na ordem da fala. */
  indice: number;
  tipo: TipoDePecaParada;
  texto: string;
  formato: "4:5" | "9:16" | "1:1";
  /** O trecho da peça no vídeo já cortado: o momento dela cobre de `de` a `ate`. */
  de: number;
  ate: number;
  /** O "em" da primeira palavra e o fim da última (o quadro sai depois da última). */
  primeiraEm: number;
  ultimaAte: number;
};

export type PecasParadas = {
  pecas: PecaParada[];
  /** Sem foto do cliente: onde o modelo põe a pessoa fica um fundo liso nesta cor. */
  semPessoa: boolean;
  corDoFundo?: string | null;
};

const NOME_DA_PECA: Record<TipoDePecaParada, string> = {
  post: "post (imagem única)",
  capa: "capa de carrossel",
  lamina: "lâmina de carrossel",
  infografico: "infográfico",
};

/**
 * O VÍDEO LONGO EM TRECHOS (10/10/2026, o completo no modelo do curso): o
 * worker escreve o plano em blocos de ~150 s (worker/src/modelo/blocos-do-plano.mjs)
 * e cada bloco chega aqui como um vídeo curto que começa no zero, com o lugar
 * dele no vídeo e o fim do bloco anterior (para a continuidade). O treinamento
 * (o prefixo do cache) é o mesmo em todos os blocos.
 */
export type CaudaDoBloco = {
  /** Os últimos momentos do trecho anterior: tipo (e campo) e o texto da tela, sem tempo. */
  ultimos: Array<{ tipo: string; campo?: string; texto: string }>;
  /** As últimas linhas do mapa do trecho anterior. */
  mapa: string;
  /** Quantas vezes cada tipo foi usado no trecho anterior. */
  tipos: Record<string, number>;
};

export type BlocoDoPlano = {
  /** 0, 1, 2... */
  indice: number;
  total: number;
  /** Onde o trecho fica no vídeo inteiro (s). */
  inicio: number;
  fim: number;
  cauda?: CaudaDoBloco | null;
};

const s1 = (t: number) => `${t.toFixed(1).replace(".", ",")} s`;

/** O bloco de instrução de um trecho do vídeo longo (vai no pedido, fora do cache). */
export function instrucaoDoBloco(b: BlocoDoPlano, duracaoDoTrecho: number): string {
  const n = b.indice + 1;
  const primeiro = b.indice === 0;
  const ultimo = n === b.total;
  const linhas = [
    `# VÍDEO LONGO: VOCÊ EDITA O TRECHO ${n} DE ${b.total}`,
    "",
    `O vídeo inteiro é longo e está sendo editado em trechos de cerca de 2,5 min, um de cada vez, todos neste mesmo modelo, e depois os trechos são emendados num vídeo só. Este é o trecho ${n} de ${b.total} (de ${s1(b.inicio)} a ${s1(b.fim)} do vídeo inteiro). A fala acima e todos os tempos (de, ate, em e os campos "...Em") são DESTE TRECHO: ele começa no zero e termina em ${s1(duracaoDoTrecho)}. Escreva só os momentos deste trecho, dentro dele.`,
    "",
    "Regras dos trechos (valem junto com a skill):",
    primeiro
      ? "- É o COMEÇO do vídeo: abra com o bloco de abertura mais forte que a skill oferece para a fala."
      : "- NÃO é o começo do vídeo: não abra com bloco de abertura nem com gancho de começo; continue a edição do trecho anterior sem quebra, como se fosse o mesmo vídeo.",
    ultimo
      ? "- É o FIM do vídeo: feche como a skill manda (a chamada final e a assinatura, no último momento)."
      : "- NÃO é o fim do vídeo: nada de chamada final, de pôster de fecho nem de assinatura neste trecho (eles só existem no último trecho).",
    "- É o VÍDEO LONGO (YouTube, aula, podcast), não um corte: edite como a aula 9 do curso manda. A pessoa em tela cheia é a base; um bloco do modelo entra só quando a ideia ganha com apoio visual e sai quando a ideia termina. Mire em um momento a cada 20 a 30 s e cerca de um terço do trecho com bloco na tela; o resto é a pessoa falando com a legenda. Prefira poucos momentos fortes a muitos fracos. A conferência deste trecho cobra no mínimo 30% de cobertura e um momento a cada 25 s.",
    "- A variedade de blocos, a assinatura e os efeitos próprios do modelo continuam valendo neste trecho.",
    '- Use em "marca" exatamente o nome e a área de quem fala, iguais em todos os trechos.',
  ];
  if (b.cauda) {
    const tipos = Object.entries(b.cauda.tipos ?? {})
      .sort((a, z) => z[1] - a[1])
      .map(([t, q]) => `${t} (${q})`)
      .join(", ");
    linhas.push(
      "",
      "Como o trecho anterior terminou (só contexto para a continuidade, não repita nem reescreva):",
      ...b.cauda.ultimos.map((m) => `- ${m.tipo}${m.campo ? ` (campo ${m.campo})` : ""}: ${m.texto}`),
      ...(tipos ? [`- Tipos usados no trecho anterior: ${tipos}. Varie: não comece repetindo o último tipo dele, e prefira os blocos que ele usou menos.`] : []),
      ...(b.cauda.mapa ? ["- O fim do mapa dele:", b.cauda.mapa] : [])
    );
  }
  return linhas.join("\n");
}

/** O bloco de instrução do modo peças paradas (o mesmo no mapa das imagens e no plano). */
export function instrucaoDasPecasParadas(pp: PecasParadas): string {
  const lista = pp.pecas
    .map((p) => `${p.indice}. ${NOME_DA_PECA[p.tipo] ?? p.tipo} (${p.formato}), trecho de ${p.de.toFixed(2)} a ${p.ate.toFixed(2)} s (primeira palavra em ${p.primeiraEm.toFixed(2)}, última termina em ${p.ultimaAte.toFixed(2)}): "${p.texto}"`)
    .join("\n");
  const pessoa = pp.semPessoa
    ? `Não há pessoa nestas peças: onde o modelo põe o vídeo da pessoa (quadro cheio, janela, letras vazadas, moldura, metade de baixo), aparece um fundo liso na cor ${pp.corDoFundo ?? "do fundo da marca"}. Não escolha um campo, placa ou fundo de bloco dessa mesma cor nem perto dela, para o que o modelo desenha por cima do vídeo continuar visível.`
    : "Onde o modelo põe a pessoa, entra uma foto parada do cliente (não é quadro de gravação).";
  return `# MODO PEÇAS PARADAS (posts da campanha, não um vídeo)

Esta "fala" não é uma gravação: é o texto das peças de uma campanha lido em sequência, uma peça por trecho, para o fluxo do curso funcionar. Ninguém vai assistir a este vídeo. Cada peça vira UMA IMAGEM PARADA, tirada do render depois que o bloco dela assentou (todas as palavras já ditas e tudo já entrou). O estilo é o deste modelo (a letra, o layout, os blocos, o jeito de pôr imagem); as cores já foram trocadas pelas da marca.

As peças, com o trecho de cada uma no vídeo cortado:
${lista}

Regras deste modo (valem por cima do ritmo de vídeo da skill):
- Exatamente UM momento por peça, cobrindo o trecho inteiro dela: "de" no começo do trecho e "ate" no fim do trecho. Nada de momento extra, de respiro, de transição ou de placa solta entre as peças.
- O texto da peça aparece INTEIRO e legível no estado final do momento: todas as palavras, na ordem, sem resumir, sem trocar palavra e sem cortar (pode quebrar linha, mudar o tamanho e pôr um trecho em destaque ou na cor de acento). Os campos de texto do bloco, somados, contêm o texto todo da peça.
- Número com símbolo ("35%", "R$ 97") aparece com o símbolo na tela: não ponha esse número num campo que o template limpa para só letras e algarismos (como a palavra-janela gigante); use outra palavra na janela e deixe o número no texto.
- Escolha o bloco mais forte do modelo que mostra o texto inteiro parado: prefira a assinatura e os blocos próprios do modelo. Não use bloco que só funciona em movimento (o que só aparece na troca, a imagem em tela cheia que esconde o texto, o contador que só faz sentido andando) nem bloco que deixa o texto para a legenda: a legenda some em todas as peças.
- Capa e lâminas são da mesma série de carrossel: as lâminas usam o mesmo bloco, mudando só o texto, e a capa abre a série com o bloco mais forte.
- Dentro do momento, cada item ainda entra no "em" da palavra que o nomeia, como a skill manda; o quadro é tirado depois da última palavra da peça.
- ${pessoa}
- A densidade de momentos por segundo, a cobertura, a variedade de blocos e os efeitos que só existem em movimento, que a skill pede para vídeo, não valem aqui e não são conferidos. A assinatura do modelo continua obrigatória pelo menos uma vez, as regras de fidelidade (nada inventado) e os campos obrigatórios de cada bloco também.`;
}

/** O prefixo estável por modelo, que vai para o cache: o treinamento inteiro. */
export function treinamentoDoModelo(r: ReferenciasDoModelo): string {
  const partes: string[] = [];
  partes.push(`# TREINAMENTO DO MODELO ${r.id} (curso Máquina de Edição IA)\n`);
  partes.push("A seguir está a skill completa deste modelo, exatamente como o curso entrega. Ela é a autoridade sobre o estilo, os blocos, os campos, os limites de texto, o ritmo e a fidelidade.");
  if (r.skill) partes.push(`\n## SKILL.md\n\n${r.skill}`);
  if (r.adaptar) partes.push(`\n## references/adaptar.md\n\n${r.adaptar}`);
  if (r.plano) partes.push(`\n## references/plano.md\n\n${r.plano}`);
  if (r.estilo) partes.push(`\n## references/estilo.md\n\n${r.estilo}`);
  for (const o of r.outros) partes.push(`\n## references/${o.nome}\n\n${o.texto}`);
  if (r.tipos) partes.push(`\n## src/plano.ts (os tipos que o template aceita; campo fora daqui é ignorado ou quebra o render)\n\n\`\`\`ts\n${r.tipos}\n\`\`\``);
  if (r.modelo && Object.keys(r.modelo).length) partes.push(`\n## modelo.json (assinatura e limites da conferência deste modelo)\n\n\`\`\`json\n${JSON.stringify(r.modelo, null, 1)}\n\`\`\``);
  if (r.exemploComentado) partes.push(`\n## references/exemplo/plano-comentado.md\n\n${r.exemploComentado}`);
  if (r.exemploPlano) partes.push(`\n## O plano.json do exemplo (sem as palavras e sem o rastro do rosto)\n\n\`\`\`json\n${r.exemploPlano}\n\`\`\``);
  return partes.join("\n");
}

const SISTEMA = `Você é o editor de vídeo que executa uma skill do curso "Máquina de Edição IA" dentro de um sistema automático.

O sistema já fez os passos 1 a 5 do fluxo da skill (criar o projeto, preparar, escolher as tomadas, medir o rosto, cortar, conferir o enquadramento). Você faz os passos 6 e 7: o mapa editorial (references/adaptar.md) e o plano (references/plano.md e src/plano.ts). Não há usuário para perguntar nada: o nome e a área já vêm prontos, e onde a skill diria "pergunte", decida pelo que ela recomenda e registre no mapa.

A régua é o EXEMPLO do modelo: a folha de quadros anexada (um quadro de cada momento, com o bloco e a fala embaixo), o plano comentado e o plano.json do exemplo. Estude a folha antes do mapa, como o adaptar.md manda: é a forma mais precisa de entender o estilo. Copie o estilo, nunca o assunto. A sua edição precisa ter a MESMA densidade, a mesma variedade e o mesmo nível de riqueza do exemplo:
- use os blocos mais ricos que a fala permite, e não os mais simples: se a fala tem números, use os blocos que contam, desenham, dividem e comparam (os próprios do modelo e a assinatura), como o exemplo faz; prefira o bloco próprio do modelo ao universal quando os dois servem;
- todo número dito na fala aparece na tela no instante em que é dito, num bloco que o valoriza;
- quando a fala dá parâmetros (valor, prazo, parcela, taxa) e a skill tem o recurso de simulação ou conta, use-o como ela ensina, mostrando os parâmetros ditos e a etiqueta de simulação; conta que a skill não prevê, não faça;
- abra com o bloco de abertura mais forte que a skill oferece para a fala (no exemplo, normalmente o próprio do modelo).

Regras que não se quebram (são da própria skill):
- Tudo o que aparece na tela vem da fala. Pode resumir com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, taxa, data nem fato. Número só se foi dito. Conta feita a partir de parâmetros ditos é simulação e segue a regra de simulação da skill (ficha com os parâmetros e nota de simulação), quando a skill tiver esse recurso; se não tiver, não faça a conta.
- Sem número dito, use a forma ilustrativa que a skill define.
- Cada item entra no "em" da palavra que o nomeia, tirado da lista de palavras abaixo (tempo no vídeo já cortado). Nada aparece antes de ser dito.
- Respeite os limites de texto, os campos obrigatórios, a gramática de layout e a assinatura do modelo (pelo menos uma vez, de forma metafórica se o assunto for outro), e pelo menos 2 efeitos próprios do modelo além dos blocos universais quando o vídeo passar de 20 s.
- Use só os tipos e campos que src/plano.ts define.
- Transcrição errada vai em "correcoes", como a skill ensina, e só quando a própria fala deixa claro o certo (por exemplo, o mesmo nome dito certo mais adiante). Na dúvida, não corrija.
- Nunca use o travessão (—) em nenhum texto.
- Não escreva os campos do motor (video, fps, largura, altura, duracao, videoAltura, rosto, zona, cortesEm, palavras): eles já estão prontos.

Responda SOMENTE com um objeto JSON, sem cerca de código e sem texto antes ou depois, no formato:
{"mapa": "<o mapa editorial em markdown: uma linha por batida com tempo, trecho falado, forma, bloco e o que aparece na tela>", "plano": {"marca": {...}, "momentos": [...], "semLegenda": [...], "correcoes": {...}, <outros campos de topo que a skill manda você escrever, quando houver>}}`;

function formatarPalavras(palavras: PalavraDoPlano[]): string {
  return palavras.map((p) => `${p.em.toFixed(2)}–${p.ate.toFixed(2)} ${p.w}`).join("\n");
}

function lerJson(texto: string): PlanoEscrito {
  const limpo = texto.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  const tentar = (t: string) => {
    try {
      return JSON.parse(t) as PlanoEscrito;
    } catch {
      return null;
    }
  };
  const direto = tentar(limpo);
  if (direto) return direto;
  const a = limpo.indexOf("{");
  const b = limpo.lastIndexOf("}");
  const recorte = a >= 0 && b > a ? tentar(limpo.slice(a, b + 1)) : null;
  if (recorte) return recorte;
  throw new Error("o plano não voltou em JSON válido");
}

/**
 * Escreve (ou conserta) o mapa e o plano de um vídeo num modelo do curso.
 * `anterior` traz o plano reprovado e as saídas da conferência: o Claude
 * conserta só o que foi apontado, como a skill manda.
 */
export async function escreverPlanoDoModelo(args: {
  referencias: ReferenciasDoModelo;
  esqueleto: EsqueletoDoPlano;
  marca: { nome: string; area: string };
  nicho?: string | null;
  anterior?: RetornoDaConferencia | null;
  /** O mapa já feito no passo das imagens (modelos com imagem): o plano segue ele. */
  mapa?: string | null;
  /** Os posts da campanha no estilo do modelo (arte-no-modelo.mjs): sem isto, é o vídeo de sempre. */
  pecasParadas?: PecasParadas | null;
  /** Um trecho do vídeo longo (o completo no modelo, 10/10): sem isto, o vídeo inteiro numa chamada. */
  bloco?: BlocoDoPlano | null;
  /** O material do cliente que o worker deixou no projeto (10/10, material-do-modelo.ts): o plano usa só ele. */
  material?: MaterialParaORedator | null;
  modelo?: string;
  usage: { projectId?: string | null; runId?: string | null; operation: string };
  onCusto?: (usd: number) => void;
}): Promise<PlanoEscrito> {
  const { referencias, esqueleto, marca } = args;
  const { palavras, ...resto } = esqueleto;
  // O quadro deitado (a versão 16:9 de um modelo, para o vídeo completo) vai dito no contexto:
  // o rosto e a zona são frações e px de um quadro 1920×1080, não do vertical. No vertical o
  // contexto fica como sempre foi (o mesmo texto, o mesmo cache).
  const largura = Number(resto.largura);
  const altura = Number(resto.altura);
  const deitado = largura > altura;
  const contexto = {
    duracao: resto.duracao,
    fps: resto.fps,
    ...(deitado ? { largura, altura } : {}),
    videoAltura: resto.videoAltura,
    rosto: resto.rosto,
    zona: resto.zona,
    cortesEm: resto.cortesEm,
  };
  // As imagens escolhidas no passo 6b (o imagens.mjs grava em plano.imagens): o
  // plano só pode usar estes ids; `sem: true` vira o cartão com a palavra.
  const imagens = (resto as { imagens?: Record<string, unknown> }).imagens;
  let pedido = `# O VÍDEO A EDITAR NO MODELO ${referencias.id}

Quem fala: ${marca.nome || "(sem nome)"}${marca.area ? `, ${marca.area}. Use exatamente isto em "marca".` : `. Use este nome em "marca"; a área (até 30 caracteres, como "Consultor de consórcio") você resume do assunto do perfil abaixo, sem inventar nada que ele não diga.`}
${args.nicho ? `Assunto do perfil (contexto para entender a fala; não é texto de tela): ${args.nicho}\n` : ""}
O que o cortar.mjs já gravou no plano (não reescreva):
${JSON.stringify(contexto)}

A fala no vídeo já cortado, uma palavra por linha (início–fim em segundos e a palavra), como em work/palavras.json:
${formatarPalavras(palavras)}

${imagens && Object.keys(imagens).length ? `\nAs imagens já escolhidas no passo 6b (plano.imagens, gravado pelo imagens.mjs; use só estes ids em "imagem": { "id", "efeito" }, e "sem": true quer dizer cartão com a palavra):\n${JSON.stringify(imagens)}\n` : ""}${args.mapa ? `\nO mapa editorial já feito no passo 6 (siga-o; ajuste só o que a conferência pedir):\n${args.mapa}\n` : ""}${args.material?.arquivos?.length ? `\n${instrucaoDoMaterial(args.material, "plano")}\n` : ""}
${
    args.pecasParadas
      ? `${instrucaoDasPecasParadas(args.pecasParadas)}\n\nFaça o mapa editorial (uma linha por peça) e o plano destas peças neste modelo.`
      : args.bloco
        ? `${instrucaoDoBloco(args.bloco, Number(resto.duracao) || 0)}\n\nFaça o mapa editorial e o plano deste trecho neste modelo.`
        : "Faça o mapa editorial e o plano deste vídeo neste modelo."
  }`;

  if (args.anterior) {
    pedido += `

# A CONFERÊNCIA REPROVOU O PLANO ANTERIOR

O plano anterior:
${JSON.stringify(args.anterior.plano)}

O que o conferir.mjs e os gates de tempo do curso disseram:
${args.anterior.saidas.join("\n\n")}
${args.anterior.numerosSemLastro?.length ? `\nNúmeros na tela que não foram ditos na fala (tire, ou troque pela forma ilustrativa): ${args.anterior.numerosSemLastro.join(", ")}\n` : ""}
Conserte o que foi apontado, mantendo o que estava certo, e devolva o mapa e o plano inteiros de novo, no mesmo formato JSON.`;
  }

  const opcoes = {
    cachedPrefix: treinamentoDoModelo(referencias),
    model: args.modelo,
    maxTokens: 48_000,
    timeoutMs: 15 * 60_000,
    usage: { projectId: args.usage.projectId ?? undefined, runId: args.usage.runId ?? undefined, operation: args.usage.operation },
    onCusto: args.onCusto,
  };
  // O material do cliente vai junto, reduzido, para o redator medir as frações nele (o passo 6b do curso).
  const anexos = [
    ...(referencias.quadros
      ? [{ base64: referencias.quadros, rotulo: `references/exemplo/quadros.jpg do modelo ${referencias.id}: um quadro de cada momento do exemplo (estado montado), com o tipo do bloco e a fala embaixo.` }]
      : []),
    ...imagensDoMaterial(args.material),
  ];
  const resposta = anexos.length ? await askClaudeComImagens(SISTEMA, pedido, anexos, opcoes) : await askClaude(SISTEMA, pedido, opcoes);
  const escrito = lerJson(resposta);
  if (!escrito.plano || !Array.isArray((escrito.plano as { momentos?: unknown }).momentos)) {
    throw new Error("o plano voltou sem momentos");
  }
  for (const k of Object.keys(escrito.plano)) if (CAMPOS_DO_MOTOR.has(k)) delete escrito.plano[k];
  return { mapa: String(escrito.mapa ?? ""), plano: escrito.plano };
}

/**
 * A GUARDA DE NÚMERO: todo número na tela precisa estar na fala. O conferir do
 * curso confere forma e ritmo, não fidelidade; a fidelidade, no curso, é a
 * pessoa olhando os quadros. Aqui é código: os números ditos (por extenso ou
 * em algarismo, lib/media/numeros-falados.ts) contra os números do plano.
 *
 * Fica de fora o que não é afirmação: contagem até 10 (itens, etapas) e os
 * campos de tempo e de desenho. Momento marcado como simulação (nota com
 * "simula") passa, porque a skill exige mostrar os parâmetros ditos na ficha.
 */
const CAMPOS_DE_TEMPO_OU_DESENHO = new Set([
  "de", "ate", "em", "inicio", "casas", "zoom", "ancoraY", "ancoraX", "destaque", "vencedor", "serie", "ponto", "peso", "fatias", "x", "y", "w", "h", "nivel", "tamanho", "escala", "volume", "ordem", "indice",
]);

/**
 * "424 mil" e "1,2 milhão" escritos na tela: o algarismo com a escala vira um
 * número só (424000). Sem isto o "mil" solto contava como 1000, número que
 * ninguém disse (prova do Case, 09/10).
 */
function comEscalaJunta(texto: string): string {
  return texto.replace(/(\d+(?:[.,]\d+)*)\s*(mil|milh(?:ão|ao|ões|oes)|bilh(?:ão|ao|ões|oes))\b/gi, (_, n: string, escala: string) => {
    const base = Number(n.replace(/\.(?=\d{3}(?!\d))/g, "").replace(",", "."));
    if (!Number.isFinite(base)) return n;
    const fator = /^mil$/i.test(escala) ? 1_000 : /^milh/i.test(escala) ? 1_000_000 : 1_000_000_000;
    return String(Math.round(base * fator));
  });
}

export function numerosSemLastro(plano: Record<string, unknown>, palavras: PalavraDoPlano[], correcoes?: Record<string, string>): string[] {
  let fala = palavras.map((p) => p.w).join(" ");
  for (const certo of Object.values(correcoes ?? {})) fala += ` ${certo}`;
  const ditos = new Set(numerosDoTexto(fala).map((n) => String(Number(n))));
  const faltam = new Set<string>();
  const conferir = (n: number) => {
    if (!Number.isFinite(n) || Math.abs(n) <= 10) return;
    const chave = String(Number(n));
    if (ditos.has(chave)) return;
    // "152.638" dito e "152,6 mil" na tela: aceita o arredondamento de um dito
    for (const d of ditos) {
      const v = Number(d);
      if (v > 0 && Math.abs(v - n) / v < 0.01) return;
      if (v >= 1000 && Math.abs(v / 1000 - n) / (v / 1000) < 0.01) return;
      if (v >= 1_000_000 && Math.abs(v / 1_000_000 - n) / (v / 1_000_000) < 0.01) return;
    }
    faltam.add(chave);
  };
  const andar = (v: unknown, chave: string, simulacao: boolean) => {
    if (simulacao) return;
    if (typeof v === "number") {
      if (!CAMPOS_DE_TEMPO_OU_DESENHO.has(chave) && !/Em$/.test(chave)) conferir(v);
    } else if (typeof v === "string") {
      for (const n of numerosDoTexto(comEscalaJunta(v))) conferir(Number(n));
    } else if (Array.isArray(v)) {
      for (const x of v) andar(x, chave, simulacao);
    } else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) andar(x, k, simulacao);
    }
  };
  for (const m of (plano.momentos as Record<string, unknown>[] | undefined) ?? []) {
    const simulacao = typeof m.nota === "string" && /simula/i.test(m.nota);
    for (const [k, x] of Object.entries(m)) {
      if (k === "tipo" || k === "de" || k === "ate") continue;
      andar(x, k, simulacao);
    }
  }
  return [...faltam];
}
