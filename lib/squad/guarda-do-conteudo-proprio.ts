import { decidirChoice, jevLigado, perguntarAoJev, probabilidadeDeSim, type PerguntaDoJev, type RespostaDoJev } from "@/lib/jev/cliente";
import { NOME_DA_REDE } from "@/lib/pipeline/redes";
import { rotuloDoItem, tituloComparavel, urlComparavel, type ItemDoInventario } from "@/lib/analytics/tipos-do-inventario";
import { LINHA_DO_ELO } from "@/lib/media/elo-da-campanha";

/**
 * A GUARDA DO CONTEÚDO PRÓPRIO (08/10/2026, regra do Bruno).
 *
 * O que aconteceu: os posts da campanha de teste disseram "Gravei um vídeo
 * completo... 'Seu gêmeo IA trabalha 24 horas sem férias', lá no canal Bruno
 * Donaire no YouTube". Esse vídeo não existe: o completo daquela semana era um
 * rascunho com outro título, e o projeto não tinha nenhum vídeo publicado no
 * YouTube. Outras peças falavam do "carrossel que postei ontem" e da "peça de
 * sexta" sem que nada garantisse que essas peças tinham ido ao ar.
 *
 * Regra: NENHUM texto gerado afirma que existe conteúdo do cliente (vídeo,
 * post, carrossel, live, artigo, link, título) que não esteja comprovado
 * publicado. Comprovado é o que está no INVENTÁRIO: post nosso com status
 * publicado e endereço externo, ou item visto na varredura das redes do
 * cliente (lib/analytics/inventario-das-redes.ts). Título citado tem que ser o
 * título real, palavra por palavra. Não sabe, não fala.
 *
 * Como decide, sem LLM:
 *   1. o CÓDIGO acha as frases candidatas (as que falam de conteúdo próprio:
 *      "meu canal", "vídeo completo", "postei ontem", "a peça de sexta", título
 *      entre aspas ao lado de vídeo ou post, link de rede social, "link na
 *      bio") e confere por código o que dá para conferir: título citado tem
 *      que bater com um título do inventário, link tem que estar no inventário;
 *   2. o JEV diz, frase por frase, se ela de fato afirma conteúdo próprio
 *      publicado fora da peça (e não fala de outra pessoa ou de uma ideia
 *      geral) e, quando a frase não traz título nem link, qual item do
 *      inventário ela cita;
 *   3. o que não for comprovado sai do texto. Com o JEV desligado ou em
 *      dúvida, a frase candidata sai: não sabe, não fala.
 *
 * As frases de chamada que o CÓDIGO monta (o elo da campanha, já conferido na
 * hora de publicar) e o bloco de links do fim da descrição ficam fora desta
 * guarda: quem cuida deles é lib/media/elo-da-campanha.ts.
 *
 * Nenhum texto gerado aqui leva travessão.
 */

export type { ItemDoInventario };

export type MotivoDaCandidata = "titulo" | "link" | "tempo" | "anterior" | "canal" | "completo" | "publiquei" | "bio" | "referencia";

export type FraseCandidata = {
  id: string;
  frase: string;
  motivos: MotivoDaCandidata[];
  /** Os títulos entre aspas que a frase dá a um conteúdo. */
  titulos: string[];
  /** Os links de rede social na frase. */
  urls: string[];
};

export type ConferenciaDaFrase =
  | { tipo: "comprovada" }
  /** Título entre aspas que não é nenhum título do inventário. */
  | { tipo: "titulo-falso"; titulo: string }
  /** Link de rede social que não está no inventário nem nos links do cliente. */
  | { tipo: "link-falso"; url: string }
  /** "Ontem", "sexta", "anterior": tempo que o código não confere; a chamada certa é a do elo. */
  | { tipo: "tempo" }
  /** Sem título nem link: só o JEV diz se é afirmação e qual item ela cita. */
  | { tipo: "sem-prova" };

export type FraseCortada = { frase: string; motivo: string };

// ── O que o código reconhece ────────────────────────────────────────────────

// O `\b` do JavaScript só conhece letra sem acento: "lá", "último" e
// "íntegra" escapavam dele. Estas bordas valem para qualquer letra.
const B = "(?<![\\p{L}\\p{N}_])";
const E = "(?![\\p{L}\\p{N}_])";
const re = (fonte: string, flags = "iu") => new RegExp(fonte, flags);

const PECA =
  "(?:v[íi]deos?|posts?|postagens?|carross[ée]is|carrossel|pe[çc]as?|lives?|artigos?|epis[óo]dios?|reels?|threads?|enquetes?|infogr[áa]ficos?|cortes?|shorts?|podcasts?|aulas?|publica[çc](?:[ãa]o|[õo]es)|conte[úu]dos?|newsletters?|webinars?)";
const DIAS = "(?:segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo)(?:-feira)?";
const TEMPO = `(?:ontem|anteontem|${DIAS}|semana\\s+passada|m[êe]s\\s+passado|hoje\\s+cedo|outro\\s+dia|dias?\\s+atr[áa]s)`;
const VERBOS_DE_PUBLICAR = "(?:gravei|gravamos|postei|postamos|publiquei|publicamos|subi|subimos|lancei|lan[çc]amos|soltei|soltamos|compartilhei|compartilhamos)";

const RE = {
  canalMeu: re(`${B}(?:meu|nosso)\\s+canal${E}(?!\\s+de\\s+(?:venda|atendimento|aquisi|comunica|distribui|marketing|contato))`),
  canalLa: re(`${B}l[áa]\\s+no\\s+canal${E}`),
  // "no canal Bruno Donaire", "no canal @fulano": canal com nome próprio (sem
  // a bandeira i, para a maiúscula do nome contar).
  canalNome: re(`${B}[Nn]o\\s+canal\\s+(?:d[oae]\\s+)?(?:@\\S|\\p{Lu})`, "u"),
  completo: re(`${B}v[íi]deo\\s+(?:completo|inteiro|na\\s+[íi]ntegra)${E}`),
  assista: re(`${B}assist(?:a|e|ir|am)\\s+(?:(?:ao|o)\\s+v[íi]deo\\s+)?(?:inteiro|completo|l[áa]|no\\s+(?:meu\\s+)?canal|no\\s+youtube)${E}`),
  publiqueiComPeca: re(`${B}${VERBOS_DE_PUBLICAR}${E}[^.!?]{0,80}${B}${PECA}${E}|${B}${PECA}${E}[^.!?]{0,40}${B}que\\s+(?:eu\\s+|n[óo]s\\s+)?${VERBOS_DE_PUBLICAR}${E}`),
  publiqueiComTempo: re(`${B}${VERBOS_DE_PUBLICAR}${E}[^.!?]{0,60}${B}${TEMPO}${E}`),
  // "o post de ontem", "a peça de sexta"; "o SEU post de ontem" é do leitor e não conta.
  pecaDeTempo: re(`(?<!${B}(?:seu|sua|teu|tua|seus|suas)\\s+)${B}${PECA}\\s+(?:de|da|do)\\s+${TEMPO}${E}`),
  // "o post anterior", "meu último vídeo". Sem a primeira pessoa, "último post"
  // é conselho ("viu seu último post", "terceiro, o último post") e não conta.
  anterior: re(
    `(?<!${B}(?:seu|sua|teu|tua|seus|suas|dele|dela)\\s+)${B}${PECA}\\s+(?:anterior|passad[oa])${E}|${B}(?:meu|minha|nosso|nossa|meus|minhas|nossos|nossas)\\s+(?:[úu]ltim[oa]s?|pen[úu]ltim[oa]s?)\\s+${PECA}${E}`
  ),
  bio: re(`${B}link\\s+(?:est[áa]\\s+|fica\\s+|t[áa]\\s+)?na\\s+bio${E}|${B}na\\s+bio\\s+(?:tem|t[áa]|est[áa])\\s+(?:o\\s+)?link${E}`),
  // Só em peça que NÃO é vídeo: "no vídeo eu mostro" num infográfico promete
  // um vídeo que o leitor não tem. Num corte, "neste vídeo" é o próprio corte.
  // "Vale assistir até o fim" depois do convite cortado ficava órfã: numa peça
  // que não é vídeo, "assistir" e "confira lá" também apontam para fora dela.
  referencia: re(
    `${B}(?:no|neste|nesse|deste|desse|naquele|no\\s+meu|num)\\s+v[íi]deo${E}|${B}(?:na|nesta|nessa|naquela)\\s+live${E}|${B}no\\s+(?:meu\\s+)?(?:epis[óo]dio|podcast)${E}|${B}assist(?:a|e|ir|am|indo)\\s+(?:at[ée]\\s+o\\s+(?:fim|final)|l[áa]|agora|inteiro|completo|(?:ao|o)\\s+v[íi]deo)${E}|${B}(?:confira|confere|veja|v[êe]|passa)\\s+(?:l[áa]|ali|no\\s+(?:meu\\s+)?(?:canal|perfil|feed))${E}`
  ),
};

/** Links de rede social (onde mora conteúdo do cliente). Link de fonte de pesquisa não entra. */
const LINK_DE_REDE = /https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be|instagram\.com|tiktok\.com|facebook\.com|fb\.watch|linkedin\.com|x\.com|twitter\.com)\/\S+/gi;

/** Aspas de título: retas, curvas e angulares. */
const ENTRE_ASPAS = /["“”«»‘’]([^"“”«»‘’\n]{3,160})["“”«»‘’]/g;

/** Um conteúdo perto das aspas: "o vídeo 'X'", "'X', lá no canal". */
const PECA_ANTES = re(`${B}${PECA}${E}[^.!?"“”«»‘’]{0,60}$`);
const LUGAR_DEPOIS = re(`^[^.!?"“”«»‘’]{0,25}${B}(?:no|na|l[áa]\\s+no)\\s+(?:meu\\s+|minha\\s+)?(?:canal|youtube|instagram|perfil|feed|p[áa]gina|linkedin|tiktok)${E}`);

/** O bloco de links que o código monta no fim da descrição (lib/media/elo-da-campanha.ts). */
const ABRE_BLOCO_DE_LINKS = /^(?:Links|Minhas redes):\s*$/;

const MARCA_DE_TWEET = /^(\d+[/)]\s+)(.*)$/;

// ── As frases do texto ──────────────────────────────────────────────────────

type Linha = { texto: string; prefixo: string; corpo: string; protegida: boolean };

/** As linhas do texto, com as do código (bloco de links e elo) protegidas. */
function linhasDoTexto(texto: string): Linha[] {
  const linhas = texto.split("\n");
  const saida: Linha[] = [];
  let noBloco = false;
  for (const l of linhas) {
    const limpa = l.trim();
    if (!limpa) noBloco = false;
    if (ABRE_BLOCO_DE_LINKS.test(limpa)) noBloco = true;
    const m = l.match(MARCA_DE_TWEET);
    saida.push({
      texto: l,
      prefixo: m ? m[1] : "",
      corpo: m ? m[2] : l,
      protegida: noBloco || LINHA_DO_ELO.test(limpa),
    });
  }
  return saida;
}

/** As frases de uma linha, como estão escritas (para tirar pelo texto exato). */
function frasesDaLinha(corpo: string): string[] {
  return corpo
    .split(/(?<=[.!?…])\s+/)
    .map((f) => f.trim())
    .filter(Boolean);
}

function titulosDaFrase(frase: string): string[] {
  const titulos: string[] = [];
  for (const m of frase.matchAll(ENTRE_ASPAS)) {
    const antes = frase.slice(0, m.index ?? 0);
    const depois = frase.slice((m.index ?? 0) + m[0].length);
    if (PECA_ANTES.test(antes) || LUGAR_DEPOIS.test(depois)) titulos.push(m[1].trim());
  }
  return titulos;
}

/**
 * As frases que falam de conteúdo próprio, com o porquê. Puro.
 * `pecaEhVideo`: num corte ou no completo, "neste vídeo" é a própria peça.
 */
export function candidatasDoTexto(texto: string, opcoes: { pecaEhVideo?: boolean; rede?: string } = {}): FraseCandidata[] {
  const candidatas: FraseCandidata[] = [];
  for (const linha of linhasDoTexto(texto)) {
    if (linha.protegida) continue;
    for (const frase of frasesDaLinha(linha.corpo)) {
      const motivos: MotivoDaCandidata[] = [];
      const titulos = titulosDaFrase(frase);
      const urls = [...frase.matchAll(LINK_DE_REDE)].map((m) => m[0].replace(/[).,;:!?]+$/, ""));
      if (titulos.length) motivos.push("titulo");
      if (urls.length) motivos.push("link");
      if (RE.publiqueiComTempo.test(frase) || RE.pecaDeTempo.test(frase)) motivos.push("tempo");
      if (RE.anterior.test(frase)) motivos.push("anterior");
      // Na descrição do próprio YouTube, "meu canal" é o canal onde a peça está.
      if (opcoes.rede !== "youtube" && (RE.canalMeu.test(frase) || RE.canalLa.test(frase) || RE.canalNome.test(frase))) motivos.push("canal");
      if (RE.completo.test(frase) || RE.assista.test(frase)) motivos.push("completo");
      if (RE.publiqueiComPeca.test(frase)) motivos.push("publiquei");
      if (RE.bio.test(frase)) motivos.push("bio");
      if (!opcoes.pecaEhVideo && RE.referencia.test(frase)) motivos.push("referencia");
      if (!motivos.length) continue;
      candidatas.push({ id: `f${candidatas.length + 1}`, frase, motivos, titulos, urls });
    }
  }
  return candidatas;
}

/**
 * O que o código consegue conferir sozinho. Título entre aspas tem que ser
 * um título do inventário, palavra por palavra; link de rede tem que estar no
 * inventário (ou ser um link do próprio cliente, como o do perfil). Tempo
 * ("ontem", "sexta", "anterior") o código não confere: quem chama a peça
 * anterior é o elo da campanha, na publicação.
 */
export function conferirFrase(c: FraseCandidata, inventario: ItemDoInventario[], permitidos: string[] = []): ConferenciaDaFrase {
  const titulos = new Set(inventario.map((i) => (i.titulo ? tituloComparavel(i.titulo) : "")).filter(Boolean));
  const urls = new Set([...inventario.map((i) => (i.url ? urlComparavel(i.url) : "")), ...permitidos.map(urlComparavel)].filter(Boolean));
  for (const t of c.titulos) if (!titulos.has(tituloComparavel(t))) return { tipo: "titulo-falso", titulo: t };
  for (const u of c.urls) if (!urls.has(urlComparavel(u))) return { tipo: "link-falso", url: u };
  if (c.motivos.includes("tempo") || c.motivos.includes("anterior")) return { tipo: "tempo" };
  if (c.titulos.length || c.urls.length) return { tipo: "comprovada" };
  return { tipo: "sem-prova" };
}

// ── O JEV ───────────────────────────────────────────────────────────────────

/** Até onde o inventário vai ao JEV (os mais recentes primeiro). */
const ITENS_NO_JEV = 30;

/** As perguntas ao JEV sobre as frases que o código não resolveu. Puro, exportado para o teste. */
export function perguntasDaGuarda(
  candidatas: Array<{ c: FraseCandidata; conferencia: ConferenciaDaFrase }>,
  inventario: ItemDoInventario[]
): Record<string, PerguntaDoJev> {
  const itens = inventario.slice(0, ITENS_NO_JEV);
  const perguntas: Record<string, PerguntaDoJev> = {};
  for (const { c, conferencia } of candidatas) {
    if (conferencia.tipo === "comprovada") continue;
    perguntas[`proprio:${c.id}`] = {
      type: "noul",
      instructions: `A frase de id "${c.id}" em \`frases\` afirma ou dá a entender que o AUTOR desta peça já gravou, publicou ou tem no ar um conteúdo PRÓPRIO (vídeo, post, carrossel, live, artigo, canal com aquele conteúdo, link na bio) fora desta peça, que o leitor poderia ir ver? Responda NÃO quando a frase só fala de conteúdo de outra pessoa ou empresa (um achado da pesquisa), de uma ideia geral, de um hábito, ou desta própria peça.`,
    };
    if (conferencia.tipo === "sem-prova" && itens.length && !c.motivos.includes("bio")) {
      perguntas[`qual:${c.id}`] = {
        type: "choice",
        instructions: `Qual item de \`conteudo_comprovado\` é o conteúdo próprio que a frase de id "${c.id}" cita? Escolha "nenhum" quando a frase cita algo que não está na lista, quando cita com outro título, ou quando não dá para saber qual é.`,
        criteria: Object.fromEntries([...itens.map((i, k) => [`i${k + 1}`, rotuloDoItem(i)]), ["nenhum", "a frase cita conteúdo que não está na lista, ou não dá para saber qual"]]),
      };
    }
  }
  return perguntas;
}

/** Abaixo disto o JEV disse que a frase NÃO afirma conteúdo próprio (fica). */
const NAO_E_PROPRIO_ATE = 0.35;
/** Confiança mínima para aceitar o item que o JEV apontou. */
const CONFIANCA_DO_ITEM = 0.6;

const MOTIVO_EM_PORTUGUES: Record<ConferenciaDaFrase["tipo"], string> = {
  comprovada: "comprovada",
  "titulo-falso": "cita um título que não está entre os conteúdos publicados",
  "link-falso": "traz um link que não é de conteúdo publicado",
  tempo: "fala de peça anterior ou de dia de publicação, o que só a chamada da publicação confere",
  "sem-prova": "cita conteúdo seu que não está comprovado publicado",
};

/**
 * A decisão, frase por frase. Puro. Sem resposta do JEV (desligado ou
 * falhou), toda frase não comprovada sai.
 */
export function decisaoDaGuarda(
  candidatas: Array<{ c: FraseCandidata; conferencia: ConferenciaDaFrase }>,
  respostas: Record<string, RespostaDoJev | undefined> | null,
  inventario: ItemDoInventario[]
): FraseCortada[] {
  const itens = inventario.slice(0, ITENS_NO_JEV);
  const cortadas: FraseCortada[] = [];
  for (const { c, conferencia } of candidatas) {
    if (conferencia.tipo === "comprovada") continue;
    if (respostas) {
      const proprio = probabilidadeDeSim(respostas[`proprio:${c.id}`]);
      // O JEV disse que a frase não fala de conteúdo próprio: fica.
      if (proprio !== null && proprio <= NAO_E_PROPRIO_ATE) continue;
      if (conferencia.tipo === "sem-prova" && itens.length) {
        const opcoes = [...itens.map((_, k) => `i${k + 1}`), "nenhum"] as const;
        const qual = decidirChoice(respostas[`qual:${c.id}`], opcoes, "nenhum", CONFIANCA_DO_ITEM);
        if (qual !== "nenhum") continue;
      }
    }
    cortadas.push({ frase: c.frase, motivo: MOTIVO_EM_PORTUGUES[conferencia.tipo] });
  }
  return cortadas;
}

// ── Tirar as frases ─────────────────────────────────────────────────────────

/**
 * Tira as frases do texto, linha por linha, sem tocar nas linhas do código.
 * Linha que esvazia sai; numa thread, o tweet que esvazia sai e os outros são
 * renumerados (1/, 2/, 3/...). Puro.
 */
export function tirarFrases(texto: string, frases: string[]): string {
  if (!frases.length) return texto;
  const alvo = new Set(frases.map((f) => f.trim()));
  const linhas = linhasDoTexto(texto);
  const saida: string[] = [];
  for (const l of linhas) {
    if (l.protegida || !l.corpo.trim()) {
      saida.push(l.texto);
      continue;
    }
    const partes = frasesDaLinha(l.corpo);
    const ficam = partes.filter((p) => !alvo.has(p));
    if (ficam.length === partes.length) {
      saida.push(l.texto);
      continue;
    }
    const corpo = ficam.join(" ").trim();
    // Sobrou só pontuação ou nada: a linha sai inteira (com a marca do tweet).
    if (!corpo || !/[\p{L}\p{N}]/u.test(corpo)) continue;
    saida.push(`${l.prefixo}${corpo}`);
  }
  let resultado = saida.join("\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  // Thread: renumera os tweets que sobraram.
  const marcas = resultado.split("\n").filter((l) => MARCA_DE_TWEET.test(l)).length;
  if (marcas >= 2) {
    let n = 0;
    resultado = resultado
      .split("\n")
      .map((l) => {
        const m = l.match(/^(\d+)([/)])(\s+.*)$/);
        if (!m) return l;
        n++;
        return `${n}${m[2]}${m[3]}`;
      })
      .join("\n");
  }
  return resultado;
}


// ── A guarda inteira ────────────────────────────────────────────────────────

export type ResultadoDaGuarda = { texto: string; cortadas: FraseCortada[]; jev: boolean };

/**
 * Passa o texto pela guarda: código acha e confere, JEV decide o que o código
 * não resolve, e o que não é comprovado sai. Nunca lança: com o JEV fora ou
 * em erro, as frases não comprovadas saem (não sabe, não fala).
 */
export async function guardarConteudoProprio(p: {
  projectId?: string | null;
  texto: string;
  rede: string;
  pecaEhVideo?: boolean;
  inventario: ItemDoInventario[];
  /** Links do próprio cliente que podem aparecer no texto (os cadastrados, o endereço dos perfis). */
  permitidos?: string[];
  perguntar?: typeof perguntarAoJev;
  /** Força o JEV ligado ou desligado (o teste usa); sem isto vale `jevLigado()`. */
  usarJev?: boolean;
  /** Frases que o PRÓPRIO CLIENTE escreveu ao editar o texto (`metadata.frasesDoCliente`): são dele, ficam. */
  frasesDoCliente?: string[];
}): Promise<ResultadoDaGuarda> {
  const doCliente = new Set((p.frasesDoCliente ?? []).map((f) => f.trim()));
  const candidatas = candidatasDoTexto(p.texto, { pecaEhVideo: p.pecaEhVideo, rede: p.rede })
    .filter((c) => !doCliente.has(c.frase.trim()))
    .map((c) => ({ c, conferencia: conferirFrase(c, p.inventario, p.permitidos) }));
  const abertas = candidatas.filter((x) => x.conferencia.tipo !== "comprovada");
  if (!abertas.length) return { texto: p.texto, cortadas: [], jev: false };
  const comJev = p.usarJev ?? jevLigado();
  let respostas: Awaited<ReturnType<typeof perguntarAoJev>> | null = null;
  if (comJev) {
    const perguntas = perguntasDaGuarda(abertas, p.inventario);
    try {
      const state = {
        contexto:
          "Frases de uma peça de rede social escrita no nome do cliente. A regra: nenhuma frase pode afirmar que o cliente tem publicado um conteúdo (vídeo, post, carrossel, live, artigo, link) que não esteja em `conteudo_comprovado`, a lista do que está de fato no ar. Achados de pesquisa sobre outras pessoas e empresas são permitidos.",
        peca: { rede: NOME_DA_REDE[p.rede] ?? p.rede, eh_video: Boolean(p.pecaEhVideo) },
        conteudo_comprovado: p.inventario.slice(0, ITENS_NO_JEV).map((i, k) => ({ id: `i${k + 1}`, item: rotuloDoItem(i) })),
        frases: abertas.map(({ c }) => ({ id: c.id, frase: c.frase.slice(0, 400) })),
      };
      respostas = await (p.perguntar ?? perguntarAoJev)({ projectId: p.projectId ?? null, etapa: "guarda-do-proprio", state }, perguntas);
    } catch (e) {
      console.warn("[guarda-do-proprio] o JEV não respondeu; frases não comprovadas saem:", e instanceof Error ? e.message : e);
      respostas = null;
    }
  }
  const cortadas = decisaoDaGuarda(abertas, respostas, p.inventario);
  if (!cortadas.length) return { texto: p.texto, cortadas, jev: Boolean(respostas) };
  const texto = tirarFrases(p.texto, cortadas.map((c) => c.frase));
  return { texto, cortadas, jev: Boolean(respostas) };
}

/**
 * AS FRASES QUE O CLIENTE ESCREVEU (08/10). A regra vale para texto GERADO:
 * o que o cliente escreve na edição da peça é a palavra dele, e a guarda da
 * publicação não tira. Guardado em `metadata.frasesDoCliente` pela rota de
 * edição do post: as frases novas desta edição mais as de edições anteriores
 * que continuam no texto. Puro.
 */
export function frasesDoClienteNaEdicao(antes: string, depois: string, anteriores: unknown): string[] {
  const todas = (t: string) => t.split("\n").flatMap((l) => frasesDaLinha((l.match(MARCA_DE_TWEET)?.[2] ?? l)));
  const velhas = new Set(todas(antes));
  const atuais = todas(depois);
  const jaEram = new Set(Array.isArray(anteriores) ? anteriores.filter((x): x is string => typeof x === "string") : []);
  return [...new Set(atuais.filter((f) => !velhas.has(f) || jaEram.has(f)))].slice(0, 60);
}

/** A linha do log da Vera para uma frase cortada. */
export function avisoDaFraseCortada(c: FraseCortada, onde: string): string {
  return `Tirei ${onde} a frase "${c.frase.slice(0, 200)}": ${c.motivo}. Só citamos conteúdo que está no ar; a chamada para o vídeo completo e para a peça anterior entra sozinha na publicação, quando a peça citada estiver publicada.`;
}
