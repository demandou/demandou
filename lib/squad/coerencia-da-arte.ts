import { decidirChoice, jevLigado, perguntarAoJev, probabilidadeDeSim, type UsoDoJev } from "@/lib/jev/cliente";

/**
 * A COERÊNCIA ENTRE A ARTE E O TEXTO É DA VERA (05/10/2026, noite).
 *
 * O que aconteceu no Fé & Gestão em 05/10: a frase desenhada na arte de
 * sexta ("Não deixe o medo do julgamento travar seu projeto") era a tese do
 * minuto 13 do vídeo, enquanto a legenda falava da tese do minuto 3 (os nãos
 * de Deus). A tese do dia saía de uma conta de módulo (`(dia - 2) % n`), que
 * deu a MESMA tese para segunda e para sexta, e o ângulo do Roberto para
 * aquele dia era outro. Ninguém conferiu: a Vera pelo JEV só recebia o texto
 * da peça, sem a frase da imagem, e o chat do card, ao "refazer" a arte,
 * reaproveitava a frase gravada e jogava fora a manchete nova.
 *
 * Regra do Bruno: isso não pode passar, muito menos pela Vera, cuja função
 * principal é garantir coerência entre tudo (marca, nicho, projeto,
 * referências, imagem com texto). Então:
 *
 * 1. `teseDoAnguloPeloJev`: a tese do dia é a que CASA com o ângulo do dia,
 *    escolhida pelo JEV, e não a da conta de módulo.
 * 2. `arteCoerenteComOTexto`: antes de pagar uma arte e depois de qualquer
 *    reescrita (Vera, chat do card, edição do cliente), o JEV diz se a frase
 *    da imagem (ou as dos slides) e o texto falam da mesma ideia. Quando não,
 *    a frase nasce de novo a partir do texto e a arte é refeita.
 * 3. A Vera pelo JEV (lib/squad/vera-pelo-jev.ts) recebe a frase da imagem e
 *    tem o critério "coerencia" ao lado de nicho, regras, dado e rede.
 *
 * O JEV decide; o Claude só escreve a frase nova quando há motivo.
 */

export type ArteEmTexto = { frase?: string | null; slides?: string[] | null };

/** Abaixo disto a frase e o texto NÃO falam da mesma ideia. */
export const COERENTE_A_PARTIR_DE = 0.5;

export function temArteParaConferir(a: ArteEmTexto | null | undefined): boolean {
  return Boolean(a && ((typeof a.frase === "string" && a.frase.trim()) || (Array.isArray(a.slides) && a.slides.some((s) => typeof s === "string" && s.trim()))));
}

/** A frase da imagem (ou as dos slides) e o texto da peça falam da mesma ideia? `null` com o JEV fora. */
export async function arteCoerenteComOTexto(p: {
  projectId?: string | null;
  texto: string;
  arte: ArteEmTexto;
  projeto?: { nicho?: string | null; marca?: string | null };
  etapa?: string;
  uso?: UsoDoJev;
}): Promise<{ coerente: boolean | null; nota: number | null }> {
  if (!temArteParaConferir(p.arte)) return { coerente: true, nota: null };
  if (!jevLigado() || !p.texto.trim()) return { coerente: null, nota: null };
  const slides = (p.arte.slides ?? []).filter((s): s is string => typeof s === "string" && Boolean(s.trim()));
  try {
    const state = {
      contexto:
        "Uma peça de rede social com uma parte VISUAL (uma frase desenhada na imagem, ou uma frase por slide) e um TEXTO (a legenda). Imagem e legenda precisam ser uma peça só: mesma ideia central, mesmo assunto, mesma tese. A legenda pode desenvolver, exemplificar ou aprofundar a frase; o que não pode é falar de outro assunto.",
      projeto: { nicho: p.projeto?.nicho ?? "não informado", marca: p.projeto?.marca ?? "não informada" },
      peca: {
        ...(p.arte.frase?.trim() ? { frase_na_imagem: p.arte.frase.trim().slice(0, 300) } : {}),
        ...(slides.length ? { frases_nos_slides: slides.map((s) => s.slice(0, 300)) } : {}),
        texto: p.texto.slice(0, 3500),
      },
    };
    const r = await perguntarAoJev(
      { projectId: p.projectId, etapa: p.etapa ?? "arte-coerencia", state, uso: p.uso },
      {
        coerente: {
          type: "noul",
          instructions:
            "A frase desenhada na imagem (`peca.frase_na_imagem`) ou as frases dos slides (`peca.frases_nos_slides`) e o texto da peça (`peca.texto`) falam da MESMA ideia central e do mesmo assunto, de modo que quem vê a imagem e lê a legenda sente uma peça só? Responda não quando a imagem fala de um assunto e a legenda de outro.",
        },
      }
    );
    const nota = probabilidadeDeSim(r.coerente);
    if (nota === null) return { coerente: null, nota: null };
    return { coerente: nota >= COERENTE_A_PARTIR_DE, nota };
  } catch (e) {
    console.warn("[coerencia-da-arte] JEV falhou (sem veredito):", e instanceof Error ? e.message : e);
    return { coerente: null, nota: null };
  }
}

/**
 * A tese do vídeo que casa com o ângulo do dia, pelo JEV. Devolve o índice
 * em `teses`; sem ângulo, sem JEV ou com confiança baixa, devolve `padrao`
 * (a conta antiga), para a esteira nunca parar por isso.
 */
export async function teseDoAnguloPeloJev(p: {
  projectId?: string | null;
  angulo: string;
  teses: Array<{ minuto: string; frase: string }>;
  padrao: number;
  uso?: UsoDoJev;
}): Promise<number> {
  const n = p.teses.length;
  if (n < 2 || !p.angulo.trim() || !jevLigado()) return p.padrao;
  const ids = p.teses.map((_, i) => `t${i + 1}`);
  try {
    const r = await perguntarAoJev(
      {
        projectId: p.projectId,
        etapa: "tese-do-dia",
        state: {
          contexto: "Um vídeo tem várias TESES (ideias defendidas em minutos diferentes). Para um dia da semana, o pesquisador escreveu o ÂNGULO do post daquele dia. A arte e a legenda do dia precisam nascer da tese que esse ângulo desenvolve.",
          angulo_do_dia: p.angulo.slice(0, 1200),
          teses: p.teses.map((t, i) => ({ id: ids[i], minuto: t.minuto, frase: t.frase.slice(0, 500) })),
        },
        uso: p.uso,
      },
      {
        tese: {
          type: "choice",
          instructions: "Qual tese em `teses` é a que o `angulo_do_dia` desenvolve (mesmo assunto, mesma ideia central)?",
          criteria: Object.fromEntries(p.teses.map((t, i) => [ids[i], `[${t.minuto}] ${t.frase.slice(0, 300)}`])),
        },
      }
    );
    const escolhida = decidirChoice(r.tese, ids, ids[Math.min(Math.max(p.padrao, 0), n - 1)], 0.4);
    return ids.indexOf(escolhida);
  } catch (e) {
    console.warn("[coerencia-da-arte] tese do dia pelo JEV falhou (fica a conta antiga):", e instanceof Error ? e.message : e);
    return p.padrao;
  }
}

/**
 * O INFOGRÁFICO REPETE UM DADO? (06/10/2026). O JEV olha o conjunto inteiro
 * (destaque, cartões e rodapé) e diz se o mesmo dado ou a mesma afirmação
 * aparece mais de uma vez, mesmo com outras palavras ("9,3 horas/dia" no
 * destaque e "9,3 horas por dia" no cartão 1). Com veto, a extração roda de
 * novo uma vez sabendo o que não repetir (lib/media/infographic.ts). Sem JEV
 * ou com erro: `null`, e a guarda pura (lib/media/infografico-sem-repeticao.ts)
 * continua valendo. O JEV decide; o modelo de texto só escreve.
 */
export async function infograficoRepeteDado(p: {
  projectId?: string | null;
  conjunto: { destaque?: string; cartoes: string[]; rodape: string[] };
  uso?: UsoDoJev;
}): Promise<{ repete: boolean | null; nota: number | null }> {
  const itens = [p.conjunto.destaque ?? "", ...p.conjunto.cartoes, ...p.conjunto.rodape].filter((t) => t.trim());
  if (itens.length < 2 || !jevLigado()) return { repete: null, nota: null };
  try {
    const r = await perguntarAoJev(
      {
        projectId: p.projectId,
        etapa: "infografico-repeticao",
        state: {
          contexto:
            "Um infográfico de rede social tem um DESTAQUE (o número principal), CARTÕES (cada um com título, número opcional e texto) e um RODAPÉ (números-chave). Cada dado deve aparecer UMA vez só no conjunto: repetir o mesmo número em dois lugares desperdiça espaço e parece erro.",
          destaque: (p.conjunto.destaque ?? "").slice(0, 200),
          cartoes: p.conjunto.cartoes.map((c) => c.slice(0, 300)),
          rodape: p.conjunto.rodape.map((c) => c.slice(0, 120)),
        },
        uso: p.uso,
      },
      {
        repete: {
          type: "noul",
          instructions:
            "O mesmo dado (o mesmo número, ou a mesma afirmação com outras palavras) aparece em mais de um lugar do conjunto (destaque, cartões, rodapé)? Responda sim quando um número do destaque volta num cartão ou no rodapé, ou quando dois cartões dizem a mesma coisa.",
        },
      }
    );
    const nota = probabilidadeDeSim(r.repete);
    if (nota === null) return { repete: null, nota: null };
    return { repete: nota >= 0.5, nota };
  } catch (e) {
    console.warn("[coerencia-da-arte] JEV da repetição do infográfico falhou (fica a guarda pura):", e instanceof Error ? e.message : e);
    return { repete: null, nota: null };
  }
}

/** A partir disto o JEV diz que repete (o mesmo corte do "cortado" e da escrita: na dúvida, segue). */
export const REPETE_A_PARTIR_DE = 0.6;

/**
 * A CENA REPETE O ELEMENTO DE OUTRA PEÇA? (08/10/2026). Antes de pagar a
 * imagem, o JEV compara o elemento central e o cenário que o redator declarou
 * (e a cena inteira) com os das outras peças da campanha e das últimas
 * campanhas do projeto. O caso: as quatro artes da semana de 08/10 do Demandou
 * com o mesmo ring light. Com veto, o redator reescreve só o campo vetado
 * (lib/media/elemento-sem-repeticao.ts). Sem JEV ou com erro: `undefined`, e a
 * guarda pura continua valendo. O JEV decide; o Claude só escreve.
 */
export async function elementoRepetidoPeloJev(p: {
  projectId?: string | null;
  nova: { cena: string; elemento: string; cenario: string };
  usados: Array<{ peca: string; elemento: string; cenario: string }>;
  uso?: UsoDoJev;
}): Promise<{ campo: "elemento" | "cenario"; indice?: number; notas: { elemento: number | null; cenario: number | null } } | null | undefined> {
  if (!p.usados.length) return null;
  if (!jevLigado()) return undefined;
  const usados = p.usados.slice(-24);
  try {
    const r = await perguntarAoJev(
      {
        projectId: p.projectId,
        etapa: "elemento-repetido",
        state: {
          contexto:
            "Uma campanha de rede social tem várias peças com imagem, cada uma com a sua cena. O estilo da marca dá a LINGUAGEM (cor, luz, tratamento), e isso pode se repetir; o que NÃO pode se repetir é o OBJETO CENTRAL nem o LUGAR da cena: cada peça tem o seu, tirado do próprio conteúdo. Repetir é usar o mesmo objeto ou o mesmo lugar, mesmo com outras palavras (\"ring light\" e \"luz de anel\"; \"estúdio de gravação\" e \"set de criador\"), ou o objeto central de outra peça aparecer de novo como detalhe.",
          nova: { elemento_central: p.nova.elemento.slice(0, 120), cenario: p.nova.cenario.slice(0, 120), cena: p.nova.cena.slice(0, 600) },
          ja_usados: usados.map((u, i) => ({ id: `u${i + 1}`, peca: u.peca.slice(0, 60), elemento_central: u.elemento.slice(0, 120), cenario: u.cenario.slice(0, 120) })),
        },
        uso: p.uso,
      },
      {
        elemento: {
          type: "noul",
          instructions:
            "O elemento central da `nova` (ou um objeto visível na `nova.cena`) é o MESMO objeto que o elemento central ou um objeto do cenário de alguma peça em `ja_usados`, mesmo com outras palavras? Responda não quando são objetos diferentes, ainda que do mesmo assunto.",
        },
        cenario: {
          type: "noul",
          instructions:
            "O cenário da `nova` é o MESMO lugar que o cenário de alguma peça em `ja_usados`, mesmo com outras palavras? Responda não quando são lugares diferentes.",
        },
        qual: {
          type: "choice",
          instructions: "Se a `nova` repete alguma peça de `ja_usados`, qual é a mais parecida?",
          criteria: Object.fromEntries(usados.map((u, i) => [`u${i + 1}`, `${u.elemento}${u.cenario ? `, em ${u.cenario}` : ""}`.slice(0, 200)])),
        },
      }
    );
    const notas = { elemento: probabilidadeDeSim(r.elemento), cenario: probabilidadeDeSim(r.cenario) };
    if (notas.elemento === null && notas.cenario === null) return undefined;
    const ids = usados.map((_, i) => `u${i + 1}`);
    const escolhido = decidirChoice(r.qual, ids, "", 0.3);
    const indice = escolhido ? ids.indexOf(escolhido) : -1;
    const base = { notas, ...(indice >= 0 ? { indice: p.usados.length - usados.length + indice } : {}) };
    if ((notas.elemento ?? 0) >= REPETE_A_PARTIR_DE) return { campo: "elemento", ...base };
    if ((notas.cenario ?? 0) >= REPETE_A_PARTIR_DE) return { campo: "cenario", ...base };
    return null;
  } catch (e) {
    console.warn("[coerencia-da-arte] JEV do elemento repetido falhou (fica a guarda pura):", e instanceof Error ? e.message : e);
    return undefined;
  }
}

/**
 * O ESTILO ESCOLHIDO PEDE FIGURAS? (08/10/2026). O estilo criado por voz no
 * post único do Demandou ("os agentes andando, estilo tecnológico") pedia
 * silhuetas de profissionais andando, e a conferência reprovou "pessoa" três
 * vezes por proporção, pagando seis imagens a mais, porque a regra da casa é
 * arte sem gente. O estilo escolhido manda: quando a linguagem dele pede
 * figuras, a peça pode tê-las (como o estilo descreve). O JEV decide; sem
 * JEV, a leitura das palavras da linguagem (`estiloPedeFigurasPelaRegra`).
 */
export async function estiloPedeFigurasPeloJev(p: { projectId?: string | null; linguagem: string; uso?: UsoDoJev }): Promise<boolean | null> {
  if (!p.linguagem.trim() || !jevLigado()) return null;
  try {
    const r = await perguntarAoJev(
      {
        projectId: p.projectId,
        etapa: "estilo-pede-figuras",
        state: {
          contexto: "A linguagem visual que o cliente escolheu para as artes dos posts dele. A casa só desenha gente quando o estilo escolhido pede.",
          linguagem: p.linguagem.slice(0, 1200),
        },
        uso: p.uso,
      },
      {
        figuras: {
          type: "noul",
          instructions:
            "Esta linguagem visual pede figuras humanas na imagem (pessoas, silhuetas, personagens, profissionais, uma equipe, figuras andando), como parte do que deve aparecer? Responda não quando ela só fala de objetos, lugares, luz e cor, ou quando proíbe gente.",
        },
      }
    );
    const nota = probabilidadeDeSim(r.figuras);
    return nota === null ? null : nota >= 0.5;
  } catch (e) {
    console.warn("[coerencia-da-arte] JEV das figuras do estilo falhou (fica a leitura das palavras):", e instanceof Error ? e.message : e);
    return null;
  }
}

/** A leitura das palavras, para quando o JEV está fora: a linguagem fala de gente sem proibir gente. Pura. */
export function estiloPedeFigurasPelaRegra(linguagem: string | null | undefined): boolean {
  const t = (linguagem ?? "").toLowerCase();
  if (!t.trim()) return false;
  if (/\b(no people|without people|no humans|no person|no figures|sem pessoas|sem gente)\b/.test(t)) return false;
  return /\b(people|person|persons|human|humans|silhouettes?|figures?|characters?|professionals?|team|crowd|pessoas?|silhuetas?|figuras?|personagens?|equipe|agentes)\b/.test(t);
}
