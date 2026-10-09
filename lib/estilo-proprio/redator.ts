import { askClaude } from "@/lib/claude";
import { extrairJson } from "@/lib/media/diretor-de-montagem";
import { FAMILIA, familiaPorPalavras, GUARDA_DA_IMAGEM_ESTILIZADA } from "@/lib/media/editor-por-comando/linguagem";
import { nomeDaCorPuro } from "@/lib/modelos-de-arte/prompt-do-modelo";
import { semTravessao } from "@/lib/biblioteca-de-design/tipos";
import { GUARDA_DA_PREVIA_COM_PESSOA, normalizarEstiloEscrito, PECAS_DA_PREVIA, type EstiloEscrito, type PecaDaPrevia } from "@/lib/estilo-proprio/tipos";

/** A guarda de cada peça: com apresentador (thumb, vertical) o rosto fictício aparece natural; sem ele, a guarda do vídeo. */
export function guardaDaPeca(peca: PecaDaPrevia): string {
  return PECAS_DA_PREVIA.find((p) => p.id === peca)?.comPessoa ? GUARDA_DA_PREVIA_COM_PESSOA : GUARDA_DA_IMAGEM_ESTILIZADA;
}

/**
 * O REDATOR DO MEU ESTILO (08/10/2026): o Claude SÓ ESCREVE. A fala simples
 * do cliente ("sou farmacêutica, ambiente claro, branco e verde") vira, numa
 * chamada, o estilo completo: o comando do vídeo, o pedido das artes, do
 * carrossel e do vídeo curto, os prompts das prévias e o resumo que o cliente
 * lê. Nenhuma decisão aqui: se as prévias seguem o estilo é o JEV
 * (previas.ts); se o estilo vale é o cliente ("É isso").
 *
 * O CONTEXTO QUE ENTRA: o nicho e o público do projeto, as cores da marca
 * (como nome de cor, para o modelo de imagem) e a letra aprovada, e, quando
 * o estudo do perfil do cliente nas redes existe, quem ele é e o visual que
 * já usa (lib/referencias/perfil-proprio.ts). A regra do Bruno sobre as cores
 * vale em todo texto: a cor da marca vai nos detalhes, nunca tingindo a foto.
 *
 * Sem o Claude (chave fora, limite, erro), a RESERVA monta um estilo com as
 * palavras da própria fala e a semente da família visual: a caixa nunca fica
 * sem resposta, e o cliente vê que é uma versão simples.
 */

export const MODELO_DO_REDATOR_DO_ESTILO = process.env.MEU_ESTILO_REDATOR || process.env.BIBLIOTECA_REDATOR || "claude-sonnet-5";

export type ContextoDoEstilo = {
  nicho?: string | null;
  publico?: string | null;
  marca?: string | null;
  /** As cores da marca, em hex, na ordem do cliente (a primeira é a principal). */
  paleta?: string[];
  /** A letra aprovada da marca ("Impacto", "Moderna", "Clássica", "Amigável"), quando existe. */
  letra?: string | null;
  /** A leitura do perfil do cliente nas redes, quando o estudo já rodou. */
  perfil?: { pessoa?: string | null; produto?: string | null; linguagem?: string | null; estiloVisual?: string | null; cores?: string[] | null } | null;
  projectId?: string | null;
};

const SISTEMA = `Você escreve o ESTILO VISUAL de um cliente da Demandou a partir do que ele contou do jeito dele. O cliente nunca escreve um prompt perfeito: o seu trabalho é captar a ideia dele e escrever o que de fato entrega aquilo, para o editor de vídeo, para o gerador das artes e para o modelo de imagem.

Responda só JSON, neste formato:
{"resumo":"...","pontos":["...","..."],"evitar":["..."],"titulo":"...","video":"...","artes":"...","carrossel":"...","videoCurto":"...","previas":{"thumb":"...","post":"...","vertical":"...","carrossel":"..."}}

Regras de cada campo:
- "resumo": em português, 2 ou 3 frases simples, como se explicasse a um amigo como as peças dele vão ficar. Sem jargão (nada de "B-roll", "lower third", "grading", "prompt"). É o único texto que o cliente lê.
- "pontos": 3 a 6 itens curtos (até 10 palavras) do que ele vai ver nas peças: o ambiente, a luz, as cores, o ritmo, o que não pode faltar.
- "evitar": 0 a 4 itens do que o estilo NUNCA usa, só quando a fala, o nicho ou o bom senso pedem (ex.: "estúdio escuro com ring light" para quem pediu ambiente claro). Vazio quando não há.
- "titulo": uma manchete de exemplo do nicho dele, em português, até 8 palavras, sem ponto final e sem aspas.
- "video": em português, o comando completo do vídeo para o editor por comando: o clima, o que aparece na tela (elementos, imagens geradas, textos em camada), o ritmo, as transições, o papel das cores da marca, os ambientes e a luz das cenas geradas. 60 a 160 palavras. Nunca cite uma pessoa real nem uma marca de terceiros.
- "artes": em português, o pedido das artes dos posts (foto única) para o gerador de arte: a cena e o ambiente, a luz, a composição com uma zona quieta onde o título entra em código, o papel das cores, sem texto desenhado na imagem. 40 a 100 palavras.
- "carrossel": em português, como as lâminas do carrossel ficam (a capa e as de dentro), coerente com as artes. 30 a 80 palavras.
- "videoCurto": em português, a linguagem das cenas geradas por IA do vídeo curto e do vídeo por IA (ambiente, luz, textura, movimento de câmera), nunca a cena específica. 30 a 80 palavras.
- "previas": em INGLÊS, um prompt por peça para o modelo de imagem, 40 a 110 palavras cada, na mesma linguagem visual, SEM texto, letras, logos ou marca d'água na imagem; pessoa só anônima, nunca real nem famosa:
  . "thumb": a thumbnail horizontal de um vídeo, o apresentador anônimo visto do peito para cima num lado e o ambiente do estilo, com uma zona calma no outro lado para o título entrar em código;
  . "post": a arte vertical de um post, a cena do estilo com uma zona quieta embaixo ou em cima para o título em código;
  . "vertical": um quadro do vídeo vertical editado: o apresentador anônimo falando, com UM elemento gráfico do estilo ao lado dele (painel, recorte de papel, objeto, ilustração), como ficaria dentro do vídeo;
  . "carrossel": a capa do carrossel, a cena mais forte do estilo com uma zona quieta grande para o título em código.
  Na thumb e no vertical o apresentador é uma pessoa fictícia e genérica, de frente, com o rosto natural e em foco (nunca desfocado); o que não pode é pessoa real ou famosa.
- A cor da marca entra só nos detalhes e acentos (objetos, luz, roupa, um elemento), nunca tingindo a foto inteira. Escreva "brand colors only as small accents" em cada prompt de prévia.
- Fidelidade: traduza o que o cliente quis, sem trocar por outro estilo. O que ele disse que tem, tem; o que ele disse que não quer, não aparece em lugar nenhum.
- Os campos em português são SÓ em português, sem palavra em inglês no meio ("like", "mood", "clean"); o inglês fica só em "previas".
- O contexto das redes do cliente serve para entender quem ele é; nunca cite peças, cards, posts ou materiais antigos dele ("os cards antigos", "o post de ontem"): descreva só o estilo que vale daqui para a frente.
- Sem travessão (o sinal "—") em texto nenhum; use vírgula, dois-pontos ou ponto.`;

function coresEmTexto(paleta: string[] | undefined): string {
  const cores = (paleta ?? []).filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 4);
  if (!cores.length) return "";
  const nomes = cores.map((c) => nomeDaCorPuro(c));
  return `Cores da marca (a primeira é a principal): ${nomes.join(", ")}.`;
}

/** A mensagem do redator: a fala e o contexto, puro (a prova lê o que vai para o modelo). */
export function mensagemDoRedator(pedido: string, c: ContextoDoEstilo): string {
  const limpar = (t: string | null | undefined, n: number) => semTravessao(String(t ?? "")).replace(/\s+/g, " ").trim().slice(0, n);
  const perfil = c.perfil;
  return [
    `O que o cliente contou, do jeito dele: "${limpar(pedido, 1500)}"`,
    c.nicho ? `Nicho do projeto: ${limpar(c.nicho, 200)}` : "",
    c.publico ? `Público: ${limpar(c.publico, 200)}` : "",
    coresEmTexto(c.paleta),
    c.letra ? `Letra dos títulos aprovada na marca: ${limpar(c.letra, 40)} (a tipografia entra em código; não a descreva na imagem).` : "",
    perfil?.pessoa || perfil?.produto ? `Quem ele é, pela leitura das redes dele: ${limpar([perfil?.pessoa, perfil?.produto].filter(Boolean).join(". "), 400)}` : "",
    perfil?.estiloVisual ? `O visual que ele já usa nas redes: ${limpar(perfil.estiloVisual, 300)}` : "",
    perfil?.linguagem ? `Como ele fala: ${limpar(perfil.linguagem, 200)}` : "",
    perfil?.cores?.length ? `Cores que aparecem nas capas dele: ${perfil.cores.slice(0, 4).map((x) => nomeDaCorPuro(x)).join(", ")}.` : "",
    "Escreva o estilo completo. O que ele contou manda; o contexto só preenche o que ele não disse.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** A reserva sem o redator: as palavras da fala e a semente da família visual. */
export function estiloDeReserva(pedido: string, c: ContextoDoEstilo): EstiloEscrito {
  const fala = semTravessao(pedido).replace(/\s+/g, " ").trim().slice(0, 600);
  const familia = FAMILIA[familiaPorPalavras(`${fala} ${c.nicho ?? ""}`)];
  const cores = coresEmTexto(c.paleta);
  const acentos = " Brand colors only as small accents and details, never a flat color wash.";
  const cena = `${familia.semente}. As the client described it (Portuguese): "${fala.slice(0, 280)}".${c.nicho ? ` Field: ${semTravessao(c.nicho).slice(0, 100)}.` : ""}`;
  const previa = (peca: PecaDaPrevia, texto: string) => `${texto} ${cena}${acentos}${guardaDaPeca(peca)}`;
  return {
    resumo: `Montei uma primeira versão do seu estilo a partir do que você contou: ${fala.slice(0, 220)}${fala.length > 220 ? "..." : ""}. As cores da sua marca entram nos detalhes, nunca tingindo a foto.`,
    pontos: [fala.slice(0, 100), "As cores da marca nos detalhes", "Pessoa de verdade, nunca pessoa famosa", "Título em código, nunca desenhado na imagem"],
    evitar: [],
    titulo: "O que ninguém te conta",
    video: `Edição no estilo que o cliente descreveu: ${fala}. Algo novo na tela a cada 4 a 8 segundos, elementos e imagens geradas na mesma linguagem visual, textos em camada curtos na letra da marca, as cores da marca só nos realces. ${cores}`.trim(),
    artes: `Arte dos posts na linguagem que o cliente descreveu: ${fala}. Uma cena clara com um assunto principal e uma zona quieta onde o título entra em código; sem texto desenhado na imagem; as cores da marca só nos detalhes. ${cores}`.trim(),
    carrossel: `Capa e lâminas do carrossel na mesma linguagem das artes: a capa com a cena mais forte e uma zona quieta grande para o título; as lâminas de dentro mais simples, com espaço para o texto em código.`,
    videoCurto: `Cenas geradas por IA na mesma linguagem: ${fala}. Luz e ambiente coerentes entre as cenas, câmera com movimento leve, nunca a pessoa famosa nem a marca de terceiros.`,
    previas: {
      thumb: previa("thumb", "Horizontal 16:9 video thumbnail: a generic fictional presenter seen from the chest up on the left third, the environment of this style behind, a calm empty area on the right for a title added later in code."),
      post: previa("post", "Vertical 4:5 social post image: one clear scene of this style, a quiet area at the bottom for a headline added later in code."),
      vertical: previa("vertical", "Vertical 9:16 frame from an edited talking video: a generic fictional presenter speaking, with one graphic element of this style beside them (a panel, a paper cut-out, an object or an illustration), as it would appear inside the video."),
      carrossel: previa("carrossel", "Vertical 4:5 carousel cover: the strongest scene of this style, with a large quiet area for a headline added later in code."),
    },
  };
}

export type EstiloRedigido = { estilo: EstiloEscrito; origem: "redator" | "reserva"; comPerfil: boolean; erro?: string };

/** O Claude escreve o estilo (uma chamada); sem ele, a reserva. Nunca lança. */
export async function escreverEstilo(pedido: string, c: ContextoDoEstilo, chamar: typeof askClaude = askClaude): Promise<EstiloRedigido> {
  const comPerfil = Boolean(c.perfil && (c.perfil.pessoa || c.perfil.estiloVisual || c.perfil.produto));
  const reserva = estiloDeReserva(pedido, c);
  if (!process.env.ANTHROPIC_API_KEY && chamar === askClaude) return { estilo: reserva, origem: "reserva", comPerfil, erro: "sem chave" };
  try {
    const r = await chamar(SISTEMA, mensagemDoRedator(pedido, c), {
      model: MODELO_DO_REDATOR_DO_ESTILO,
      maxTokens: 6000,
      effort: "low",
      timeoutMs: 90_000,
      usage: { projectId: c.projectId ?? undefined, operation: "meu-estilo-redator" },
    });
    const estilo = normalizarEstiloEscrito(extrairJson(r));
    if (!estilo) return { estilo: reserva, origem: "reserva", comPerfil, erro: "estilo incompleto" };
    // A guarda da imagem em todo prompt de prévia (o modelo de imagem desenha texto e gente famosa quando não se pede o contrário).
    for (const p of PECAS_DA_PREVIA) {
      if (!/accent/i.test(estilo.previas[p.id])) estilo.previas[p.id] = `${estilo.previas[p.id]} Brand colors only as small accents.`;
      if (!/no text/i.test(estilo.previas[p.id])) estilo.previas[p.id] = `${estilo.previas[p.id]}${guardaDaPeca(p.id)}`;
    }
    return { estilo, origem: "redator", comPerfil };
  } catch (e) {
    return { estilo: reserva, origem: "reserva", comPerfil, erro: e instanceof Error ? e.message.slice(0, 120) : String(e) };
  }
}
