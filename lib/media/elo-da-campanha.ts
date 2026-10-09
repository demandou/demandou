import { enderecoDaRede, lerRedesEscritas, REDES_DO_PERFIL, type LinkDoCliente, type RedeDoPerfil } from "@/lib/projeto/links-do-cliente";
import { NOME_DA_REDE } from "@/lib/pipeline/redes";
import {
  datasDoPlano,
  DIAS_DA_SEMANA,
  ROTULO_DO_FORMATO,
  rotuloDaRedeNoFormato,
  type ChaveDoDia,
  type FormatoDoDia,
  type RedeDoPlano,
  type SemanaDoVideo,
} from "@/lib/media/semana-do-video";

/**
 * O ELO DA CAMPANHA DE VÍDEO (05/10, noite, regras do Bruno).
 *
 * Uma semana a partir de um vídeo é UMA campanha, e as peças se chamam umas
 * às outras:
 *
 *   1. a descrição do vídeo completo no YouTube (e a de todo post de vídeo)
 *      termina com as redes do cliente e os links cadastrados por ele, um por
 *      linha, sem inventar link (`blocoDeLinksDaDescricao`);
 *   2. todo corte convida para o vídeo completo: com o link quando o completo
 *      já está no ar, e "no meu canal do YouTube" antes disso. Quando o
 *      completo publica, os cortes ainda não publicados recebem o link
 *      (`conviteAoCompleto`, `legendaComLinkDoCompleto`; quem grava é
 *      lib/media/cortes-com-link-do-completo.ts);
 *   3. as outras peças da semana chamam a peça anterior e o completo. QUEM
 *      chamar é regra de código (a peça do dia anterior no plano, mais o
 *      completo), e o texto da chamada é escrito pelo redator na MESMA chamada
 *      que escreve a peça (`eloDaCampanha` entra no pedido dele): nenhuma
 *      rodada de revisão por LLM e nenhuma decisão de LLM sobre quem chamar.
 *
 * Tudo aqui é puro: a sincronização dos cortes, o completo no quadro, os
 * redatores da semana, as adaptações e a publicação leem destas funções, e a
 * prova roda em memória (scripts/tmp/prova-elo-da-campanha-0510.mts).
 *
 * 08/10, A CHAMADA SÓ ENTRA QUANDO A PEÇA CITADA ESTÁ NO AR (regra do Bruno,
 * depois do "vídeo que não existe": posts disseram "Gravei um vídeo
 * completo... 'Seu gêmeo IA trabalha 24 horas sem férias', lá no canal" com o
 * completo ainda em rascunho, e "o carrossel que postei ontem" sem garantia
 * de nada). As regras 2 e 3 acima mudaram assim:
 *   - o redator NÃO escreve mais a chamada dentro do texto; ele recebe só o
 *     inventário do que está no ar (lib/analytics/tipos-do-inventario.ts);
 *   - QUEM chamar continua regra de código, e fica guardado no post
 *     (`metadata.elo`, ver `eloDaPeca`);
 *   - a FRASE da chamada é montada em código (`fraseDoElo`), com o título real
 *     e o link onde a rede aceita, e só entra no texto quando a peça citada
 *     está publicada com endereço (`textoComElo`). Antes disso, nada de "no
 *     meu canal do YouTube": a frase não entra;
 *   - quem põe a frase é a publicação (lib/media/elo-na-publicacao.ts): na
 *     hora de publicar a peça, e nos rascunhos da semana assim que a peça
 *     citada vai ao ar, para o quadro mostrar o texto como vai sair.
 *
 * Nenhum texto gerado aqui leva travessão.
 */

export type ContaDoCliente = { platform: string; username?: string | null; displayName?: string | null };

export type PerfilDoCliente = {
  rede: string;
  rotulo: string;
  /** O @ limpo, quando a conta tem um ("prdonaire"); nulo quando só há o nome. */
  handle: string | null;
  /** O nome de exibição da conta, aparado. */
  nome: string | null;
  /** O endereço público do perfil, só nas redes em que ele sai do @ sem adivinhar. */
  url: string | null;
};

/**
 * As redes em que a URL na legenda é clicável e não derruba o alcance. As
 * outras (LinkedIn, Instagram, TikTok) seguem a regra de 03/10 em
 * lib/projeto/links-do-cliente.ts: nenhuma URL no texto.
 */
// Onde o link digitado vira link clicável (regra do Bruno de 06/10: link completo onde é clicável, @ onde não é).
const REDES_COM_URL = new Set(["youtube", "facebook", "linkedin", "twitter"]);

export function redeAceitaUrl(rede: string): boolean {
  return REDES_COM_URL.has(rede);
}

/** O @ só vale se parece um @ de verdade; "Bruno Donaire " (o YouTube grava o nome) não vira link. */
function handleValido(bruto: string | null | undefined): string | null {
  const h = (bruto ?? "").trim().replace(/^@/, "");
  return /^[A-Za-z0-9._-]{1,60}$/.test(h) ? h : null;
}

/**
 * O endereço do perfil a partir do @, SÓ nas redes em que o endereço é o @ e
 * nada mais (Instagram, TikTok, X, e o YouTube quando a conta tem @handle).
 * LinkedIn e Facebook não entram: o endereço deles não sai do nome, e
 * adivinhar seria inventar link.
 */
function urlDoPerfil(rede: string, handle: string | null, usernameBruto: string | null | undefined): string | null {
  if (!handle) return null;
  if (rede === "instagram") return `https://www.instagram.com/${handle}`;
  if (rede === "tiktok") return `https://www.tiktok.com/@${handle}`;
  if (rede === "twitter") return `https://x.com/${handle}`;
  if (rede === "youtube" && (usernameBruto ?? "").trim().startsWith("@")) return `https://www.youtube.com/@${handle}`;
  return null;
}

/**
 * Um perfil por rede do cliente: as conectadas, na ordem em que as contas
 * vieram, e depois as que ele só escreveu (sem conexão).
 *
 * O ENDEREÇO DE CADA REDE TEM UMA FONTE SÓ (06/10): o que o cliente escreveu
 * nos perfis do setup ou de Configurações (`config.redesDoCliente`, e o @ do
 * YouTube do campo antigo, ver `lerRedesEscritas` em
 * lib/projeto/links-do-cliente.ts) vale primeiro; o que a conexão trouxe vale
 * quando ele não escreveu nada naquela rede. O nome da conta conectada (o
 * nome do canal, por exemplo) continua como nome.
 */
export function perfisDoCliente(contas: ContaDoCliente[], config?: unknown): PerfilDoCliente[] {
  const escritas = config === undefined ? {} : lerRedesEscritas(config);
  const vistos = new Set<string>();
  const perfis: PerfilDoCliente[] = [];
  const doEscrito = (rede: RedeDoPerfil, valor: string, nome: string | null) => {
    const { handle, url } = enderecoDaRede(rede, valor);
    perfis.push({ rede, rotulo: NOME_DA_REDE[rede] ?? rede, handle, nome, url });
  };
  for (const c of contas) {
    const rede = c.platform;
    if (!rede || vistos.has(rede)) continue;
    const escrito = (REDES_DO_PERFIL as readonly string[]).includes(rede) ? escritas[rede as RedeDoPerfil] : undefined;
    if (escrito) {
      // O nome do canal que a conexão do YouTube gravou no username não se perde.
      const semArroba = !(c.username ?? "").trim().startsWith("@");
      const nome = (c.displayName ?? "").trim() || (rede === "youtube" && semArroba ? (c.username ?? "").trim() || null : null);
      vistos.add(rede);
      doEscrito(rede as RedeDoPerfil, escrito, nome);
      continue;
    }
    const nome = (c.displayName ?? "").trim() || null;
    const handle = handleValido(c.username);
    if (!handle && !nome) continue;
    vistos.add(rede);
    perfis.push({ rede, rotulo: NOME_DA_REDE[rede] ?? rede, handle, nome, url: urlDoPerfil(rede, handle, c.username) });
  }
  for (const rede of REDES_DO_PERFIL) {
    const escrito = escritas[rede];
    if (!escrito || vistos.has(rede)) continue;
    vistos.add(rede);
    doEscrito(rede, escrito, null);
  }
  return perfis;
}

/** O nome do canal do YouTube do cliente, para chamar o completo pelo nome quando não há link. */
export function nomeDoCanal(contas: ContaDoCliente[], config?: unknown): string | null {
  const yt = perfisDoCliente(contas, config).find((p) => p.rede === "youtube");
  return yt?.nome ?? (yt?.handle ? `@${yt.handle}` : null);
}

/** Como o perfil aparece numa linha da descrição: URL onde a rede aceita, @ onde não. */
function linhaDoPerfil(p: PerfilDoCliente, comUrl: boolean): string | null {
  const valor = comUrl && p.url ? p.url : p.handle ? `@${p.handle}` : p.nome;
  // LinkedIn e Facebook escritos só têm link: onde link não vai, ficam de fora.
  return valor ? `${p.rotulo}: ${valor}` : null;
}

/**
 * O BLOCO DO FIM DA DESCRIÇÃO: as redes do cliente e os links cadastrados,
 * um por linha, no que a rede do post aceita.
 *
 *   - YouTube, Facebook e LinkedIn (link clicável no texto): todos os links
 *     (o principal primeiro) e os perfis com endereço completo;
 *   - Instagram e TikTok (link não clica na legenda): só os perfis pelo @;
 *   - X: nada (280 caracteres não comportam bloco).
 * Regra do Bruno (06/10): link completo onde é clicável, @ onde não é.
 *
 * A própria rede do post fica de fora da lista de perfis: ninguém lista o
 * Instagram na legenda do Instagram. Vazio quando não há o que listar.
 */
export function blocoDeLinksDaDescricao(args: { rede: string; links: LinkDoCliente[]; contas: ContaDoCliente[]; config?: unknown }): string {
  const { rede, links, contas } = args;
  if (rede === "twitter") return "";
  const comUrl = redeAceitaUrl(rede);
  const perfis = perfisDoCliente(contas, args.config).filter((p) => p.rede !== rede);
  const linhasDeLink = comUrl
    ? links.map((l) => `${l.cta ?? l.rotulo}: ${l.url}`)
    : [];
  const linhas = [...linhasDeLink, ...perfis.map((p) => linhaDoPerfil(p, comUrl)).filter((l): l is string => Boolean(l))];
  if (!linhas.length) return "";
  return [linhasDeLink.length ? "Links:" : "Minhas redes:", ...linhas].join("\n");
}

export type ConviteArgs = {
  /** A rede do post do corte. */
  rede: string;
  /** O título do vídeo completo (a primeira linha do post do YouTube). */
  titulo: string | null;
  /** O link do completo no YouTube, só depois de publicado. */
  url: string | null;
  /** O nome do canal do cliente, para chamar pelo nome quando não há link. */
  canal?: string | null;
};

/**
 * O CONVITE AO COMPLETO que fecha a descrição de um corte, SÓ com o completo
 * no ar (`url` do post publicado). Uma frase fixa, montada em código de
 * propósito: é ela que a publicação acha e põe ou tira (`textoComElo`).
 *
 * Sem `url`, nulo (08/10): antes de o completo ir ao ar não existe "no meu
 * canal do YouTube". Com o completo publicado, a frase cita o título real e
 * leva o link onde a rede aceita; no Instagram e no TikTok chama pelo canal.
 */
export function conviteAoCompleto(args: ConviteArgs): string | null {
  const { rede, url } = args;
  if (!url) return null;
  const titulo = args.titulo?.trim().replace(/\s+/g, " ") || null;
  const canal = args.canal?.trim() || null;
  // O X tem 280 caracteres para o texto do corte e o convite juntos.
  if (rede === "twitter") return `Completo no YouTube: ${url}`;
  const abertura = titulo ? `Esse trecho é do vídeo completo "${titulo}".` : "Esse trecho é de um vídeo completo.";
  if (redeAceitaUrl(rede)) return `${abertura} Assista inteiro no YouTube: ${url}`;
  return canal ? `${abertura} Assista inteiro no YouTube, no canal ${canal}.` : `${abertura} Assista inteiro no meu canal do YouTube.`;
}

/**
 * AS LINHAS DE CHAMADA QUE O CÓDIGO MONTA (o convite ao completo e a chamada
 * à peça anterior), em qualquer das formas, inclusive as de antes de 08/10.
 * São as únicas que a publicação tira e põe; a guarda do conteúdo próprio
 * (lib/squad/guarda-do-conteudo-proprio.ts) não olha para elas.
 */
export const LINHA_DO_ELO =
  /^(?:Esse trecho é d[eo] (?:um )?vídeo completo.*|Completo no (?:YouTube: \S+|meu canal do YouTube\.)|Vídeo completo no YouTube.*|O vídeo completo (?:".+" )?está no (?:YouTube|meu canal do YouTube).*|Se perdeu (?:o|a) .+ anterior desta série.*)$/;

const TETO_DO_X = 280;
/** O X conta qualquer URL como 23 caracteres. */
function tamanhoNoX(texto: string): number {
  return texto.replace(/https?:\/\/\S+/g, "x".repeat(23)).length;
}

/**
 * A DESCRIÇÃO DE UM CORTE: a legenda do redator, o convite ao completo (só
 * com o completo no ar) e o bloco de links da rede. No X, o convite só entra
 * se couber nos 280.
 */
export function descricaoDoCorte(args: ConviteArgs & { legenda: string; links: LinkDoCliente[]; contas: ContaDoCliente[]; config?: unknown }): string {
  const legenda = args.legenda.trim();
  const convite = conviteAoCompleto(args);
  if (args.rede === "twitter") {
    if (!convite) return legenda;
    const junto = `${legenda}\n\n${convite}`;
    return tamanhoNoX(junto) <= TETO_DO_X ? junto : legenda;
  }
  const bloco = blocoDeLinksDaDescricao({ rede: args.rede, links: args.links, contas: args.contas, config: args.config });
  return [legenda, convite, bloco].filter(Boolean).join("\n\n");
}

/** A regra de link quando um texto é ADAPTADO para outra rede. */
export function regraDeLinkNaAdaptacao(rede: string): string {
  const nome = NOME_DA_REDE[rede] ?? rede;
  const base =
    "Não acrescente chamada para o vídeo completo, para outra peça da campanha nem para canal, live ou post do cliente: essa chamada entra sozinha na publicação, e só quando a peça citada estiver no ar. Se o original tiver uma, tire.";
  if (redeAceitaUrl(rede)) return `${base} Uma URL de fonte do original pode ficar, exatamente como está${rede === "twitter" ? ", e só no último tweet" : ""}.`;
  return `${base} No ${nome} nenhuma URL vai no texto (nada de "link na bio").`;
}

export type PecaDoPlano = {
  dia: number;
  formato: FormatoDoDia;
  redes: RedeDoPlano[];
  /** O título do corte, nos dias de vídeo curto. */
  tituloDoCorte: string | null;
};

/**
 * As peças do plano NA ORDEM EM QUE VÃO AO AR, com o corte de cada dia de
 * vídeo curto resolvido pela mesma regra da sincronização (o primeiro corte
 * marcado vai no primeiro dia de vídeo curto, o segundo no segundo, em
 * rodízio). `cortes` são os títulos dos cortes marcados, na ordem deles.
 */
export function pecasDoPlano(semana: SemanaDoVideo, cortes: string[]): PecaDoPlano[] {
  const ordem = semana.inicio ? datasDoPlano(semana.inicio) : DIAS_DA_SEMANA;
  const pecas: PecaDoPlano[] = [];
  let k = 0;
  for (const { dia } of ordem) {
    const d = semana.dias[String(dia) as ChaveDoDia];
    if (!d) continue;
    let tituloDoCorte: string | null = null;
    if (d.formato === "short") {
      tituloDoCorte = cortes.length ? (cortes[k % cortes.length] ?? null) : null;
      k++;
    }
    pecas.push({ dia, formato: d.formato, redes: d.redes, tituloDoCorte });
  }
  return pecas;
}

const nomeDoDia = (dia: number) => DIAS_DA_SEMANA[dia - 1]?.nome ?? "outro dia";

/** A peça com o artigo certo ("a imagem", "o carrossel"); o rótulo vem da tabela dos formatos. */
const ARTIGO_DO_FORMATO: Partial<Record<FormatoDoDia, string>> = { image: "a", carousel: "o", infographic: "o", thread: "a", poll: "a" };
function nomeDaPeca(formato: FormatoDoDia): string {
  if (formato === "text" || formato === "free") return "o post";
  const rotulo = (ROTULO_DO_FORMATO[formato] ?? "post").toLowerCase();
  return `${ARTIGO_DO_FORMATO[formato] ?? "o"} ${rotulo}`;
}

/** Como uma peça é dita a outro redator ("o corte 'X' de terça (X, Reels, TikTok, Shorts)"). */
export function descreverPeca(peca: PecaDoPlano, angulo?: string | null): string {
  const redes = peca.redes.map((r) => rotuloDaRedeNoFormato(r, peca.formato));
  const onde = redes.length ? ` (${redes.join(", ")})` : "";
  if (peca.formato === "short") {
    return peca.tituloDoCorte ? `o corte "${peca.tituloDoCorte}" de ${nomeDoDia(peca.dia)}${onde}` : `o corte de ${nomeDoDia(peca.dia)}${onde}`;
  }
  const sobre = angulo?.trim() ? `, sobre ${angulo.trim().replace(/[.]+$/, "")}` : "";
  return `${nomeDaPeca(peca.formato)} de ${nomeDoDia(peca.dia)}${onde}${sobre}`;
}

/** A peça do dia anterior no plano (a que vai ao ar logo antes desta), ou nula na primeira. */
export function pecaAnterior(pecas: PecaDoPlano[], dia: number): PecaDoPlano | null {
  const i = pecas.findIndex((p) => p.dia === dia);
  return i > 0 ? pecas[i - 1] : null;
}

/**
 * O QUE O REDATOR DO DIA RECEBE SOBRE O ELO (08/10). Ele não escreve mais a
 * chamada: só fica sabendo que ela entra sozinha, e recebe o inventário do
 * que está no ar como a ÚNICA lista de conteúdo próprio que pode citar
 * (`listaDoInventarioParaRedator`, em lib/analytics/tipos-do-inventario.ts).
 */
export function eloDaCampanha(args: { inventario: string }): string {
  return `

CONTEÚDO PRÓPRIO E CHAMADAS (regra: só se cita o que está no ar; se não sabe, não fala):
- NÃO escreva convite para o vídeo completo nem chamada para outra peça desta semana: nada de "no meu canal", "gravei um vídeo", "lá no YouTube", "o carrossel de ontem", "a peça de sexta", "o post anterior", "link na bio". Essa chamada entra sozinha na hora de publicar, com o título real e o link, e só se a peça citada já estiver publicada.
- ${args.inventario}
- Não invente título, link, rede, canal, live, artigo ou peça do cliente.`;
}

// ── O elo resolvido na publicação (08/10) ───────────────────────────────────

/** Quem uma peça chama. Decidido em código quando a peça nasce; guardado em `metadata.elo`. */
export type ChamadaDoElo =
  | { tipo: "completo"; videoJobId: string }
  | { tipo: "anterior"; runId: string; dia: number; formato: string };

export type EloDoPost = {
  chamadas: ChamadaDoElo[];
  /** Corte do vídeo: o convite ao completo tem a forma de corte ("Esse trecho é do vídeo completo"). */
  corte?: boolean;
};

/** O elo de uma peça da semana (o completo sempre; a peça anterior quando há) ou de um corte (só o completo). */
export function eloDaPeca(args: { videoJobId: string; runId: string; dia: number; pecas: PecaDoPlano[]; corte?: boolean }): EloDoPost {
  const chamadas: ChamadaDoElo[] = [{ tipo: "completo", videoJobId: args.videoJobId }];
  if (args.corte) return { chamadas, corte: true };
  const anterior = pecaAnterior(args.pecas, args.dia);
  if (anterior) chamadas.push({ tipo: "anterior", runId: args.runId, dia: anterior.dia, formato: anterior.formato });
  return { chamadas };
}

/**
 * O elo guardado no post. Corte de antes de 08/10 (sem `elo` gravado) chama o
 * completo, como sempre chamou; peça escrita de antes não ganha chamada nova
 * (a dela estava no texto, e a guarda cuida do que não for verdade).
 */
export function lerEloDoPost(metadata: unknown): EloDoPost | null {
  const m = (metadata ?? {}) as { elo?: unknown; videoJobId?: unknown; trechoIndice?: unknown; gravacaoCompleta?: unknown };
  const bruto = m.elo as { chamadas?: unknown; corte?: unknown } | undefined;
  if (bruto && Array.isArray(bruto.chamadas)) {
    const chamadas = bruto.chamadas.filter((c): c is ChamadaDoElo => {
      const x = c as Record<string, unknown> | null;
      if (!x) return false;
      if (x.tipo === "completo") return typeof x.videoJobId === "string" && Boolean(x.videoJobId);
      if (x.tipo === "anterior") return typeof x.runId === "string" && typeof x.dia === "number";
      return false;
    });
    return chamadas.length ? { chamadas, ...(bruto.corte === true ? { corte: true } : {}) } : null;
  }
  if (typeof m.videoJobId === "string" && typeof m.trechoIndice === "number" && m.gravacaoCompleta !== true) {
    return { chamadas: [{ tipo: "completo", videoJobId: m.videoJobId }], corte: true };
  }
  return null;
}

/** Uma peça citada, já CONFERIDA no ar: status publicado e endereço externo. */
export type PecaPublicada = {
  postId: string;
  rede: string;
  url: string;
  /** O título real: no YouTube, a primeira linha que virou título; nulo nas outras redes. */
  titulo: string | null;
  /** O formato da peça (image, carousel, short...), para dizer "o carrossel", "a imagem". */
  formato: string | null;
};

export type CitacaoDoElo = { chamada: ChamadaDoElo; peca: PecaPublicada };

/**
 * A FRASE DA CHAMADA, montada em código a partir da peça publicada. Nunca
 * chamada para peça que não está no ar: quem chama esta função já conferiu.
 */
export function fraseDoElo(c: CitacaoDoElo, rede: string, opcoes: { corte?: boolean; canal?: string | null } = {}): string | null {
  const { peca } = c;
  const titulo = peca.titulo?.trim().replace(/\s+/g, " ") || null;
  if (c.chamada.tipo === "completo") {
    if (opcoes.corte) return conviteAoCompleto({ rede, titulo, url: peca.url, canal: opcoes.canal });
    if (rede === "twitter") return `Vídeo completo no YouTube: ${peca.url}`;
    if (redeAceitaUrl(rede)) return titulo ? `O vídeo completo "${titulo}" está no YouTube: ${peca.url}` : `Vídeo completo no YouTube: ${peca.url}`;
    const onde = opcoes.canal?.trim() ? `YouTube, no canal ${opcoes.canal.trim()}` : "meu canal do YouTube";
    return titulo ? `O vídeo completo "${titulo}" está no ${onde}.` : `Vídeo completo no ${onde}.`;
  }
  const nome = nomeDaPeca((peca.formato ?? c.chamada.formato) as FormatoDoDia);
  if (redeAceitaUrl(rede)) return `Se perdeu ${nome} anterior desta série: ${peca.url}`;
  const ondeEsta = peca.rede === rede ? "no meu perfil" : `no meu ${NOME_DA_REDE[peca.rede] ?? peca.rede}`;
  return `Se perdeu ${nome} anterior desta série, está ${ondeEsta}.`;
}

/** Tira do texto as linhas de chamada que o código montou (qualquer forma, inclusive as antigas). */
export function removerFrasesDoElo(texto: string): string {
  return texto
    .split("\n")
    .filter((l) => !LINHA_DO_ELO.test(l.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const BLOCO_DO_FIM = /^(?:Links:|Minhas redes:)/;
const SO_HASHTAGS = /^(?:#[\p{L}\p{N}_]+[\s,]*)+$/u;

/**
 * Põe as frases de chamada no texto: antes do bloco de links e das hashtags
 * do fim, num parágrafo só. No X, só o que couber nos 280 do último tweet;
 * o que não cabe fica de fora (melhor sem chamada do que tweet recusado).
 */
export function inserirFrasesDoElo(texto: string, frases: string[], rede: string): string {
  const limpas = frases.map((f) => f.trim()).filter(Boolean);
  if (!limpas.length) return texto;
  if (rede === "twitter") {
    let saida = texto.trim();
    for (const f of limpas) {
      const tentativa = `${saida}\n\n${f}`;
      const tweets = tentativa.split(/\n(?=\d+[/)]\s)/);
      const ultimo = tweets[tweets.length - 1] ?? tentativa;
      if (tamanhoNoX(ultimo) <= TETO_DO_X) saida = tentativa;
    }
    return saida;
  }
  const paragrafos = texto.trim().split(/\n{2,}/);
  let i = paragrafos.length;
  while (i > 0 && (BLOCO_DO_FIM.test(paragrafos[i - 1].trim()) || SO_HASHTAGS.test(paragrafos[i - 1].trim()))) i--;
  paragrafos.splice(i, 0, limpas.join("\n"));
  return paragrafos.join("\n\n");
}

/**
 * O TEXTO COM O ELO DE AGORA: as chamadas antigas saem e entram só as das
 * peças publicadas. Sem citação, o texto fica sem chamada nenhuma.
 */
export function textoComElo(texto: string, frases: string[], rede: string): string {
  const base = removerFrasesDoElo(texto);
  return frases.length ? inserirFrasesDoElo(base, frases, rede) : base;
}

/**
 * O AVISO DO QUADRO (08/10): o que o cliente lê embaixo da prévia, antes de
 * publicar. A chamada não está no texto enquanto a peça citada não vai ao ar,
 * e o aviso diz isso; com a peça no ar, diz que a chamada já está no texto.
 */
export function avisoDoEloNoQuadro(metadata: unknown, texto: string): string | null {
  const elo = lerEloDoPost(metadata);
  if (!elo) return null;
  const linhas = texto.split("\n").map((l) => l.trim()).filter((l) => LINHA_DO_ELO.test(l));
  const noTexto = (c: ChamadaDoElo) => linhas.some((l) => (c.tipo === "anterior" ? l.startsWith("Se perdeu") : !l.startsWith("Se perdeu")));
  const nome = (c: ChamadaDoElo) => (c.tipo === "completo" ? "o vídeo completo" : `${nomeDaPeca(c.formato as FormatoDoDia)} anterior (${nomeDoDia(c.dia)})`);
  const ja = elo.chamadas.filter(noTexto).map(nome);
  const falta = elo.chamadas.filter((c) => !noTexto(c)).map(nome);
  const partes: string[] = [];
  if (ja.length) partes.push(`a chamada para ${ja.join(" e ")} já está no texto, porque está no ar`);
  if (falta.length) partes.push(`a chamada para ${falta.join(" e ")} entra sozinha na publicação, com o título e o link, se já estiver no ar; se não estiver, o post sai sem ela`);
  const frase = partes.join("; ");
  return frase.charAt(0).toUpperCase() + frase.slice(1) + ".";
}
