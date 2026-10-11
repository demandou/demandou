import { numerosDoTexto } from "@/lib/media/numeros-falados";

/**
 * OS DADOS DE PESQUISA QUE PODEM IR À ARTE (11/10/2026, decisão do Bruno):
 * "Números das artes podem usar pesquisa, desde que não seja inventado, e
 * tenha fonte rastreável. O mais importante é ter relação com o tema do
 * vídeo, complementar o que o vídeo trouxe."
 *
 * Um número desenhado na arte vale quando está:
 *   1. na fala (a transcrição) ou no material do cliente; ou
 *   2. num dado da pesquisa do Roberto (`radar.dados`) que tem FONTE com nome
 *      e que o JEV disse que complementa o tema do vídeo
 *      (lib/squad/coerencia-da-arte.ts, dadosNoTemaPeloJev).
 * O número de pesquisa leva a fonte até a peça: o post guarda
 * `fontesDosNumeros` ({ numero, fonte, url? }), a arte escreve "Fonte: ..." num
 * rodapé discreto e a legenda cita a fonte. Número sem lastro em nenhum dos
 * três nunca entra. Este arquivo é PURO.
 */

export type DadoDePesquisa = { valor: string; oQueMede: string; fonte: string; url?: string | null };

/** O número de pesquisa que entrou numa peça, com a fonte dele (gravado no post em `fontesDosNumeros`). */
export type FonteDoNumero = { numero: string; fonte: string; url?: string };

/** O lastro de uma arte: a fala e o material (texto), e os dados de pesquisa com fonte e no tema. */
export type LastroDaArte = { texto: string; dados: DadoDePesquisa[] };

/** A fonte é rastreável: tem um nome próprio (não "pesquisa de mercado", não vazio). Pura. */
export function fonteRastreavel(fonte: string | null | undefined): boolean {
  const f = (fonte ?? "").trim();
  if (f.length < 3) return false;
  if (/^(pesquisa|estudo|levantamento|dados?|relat[óo]rio)s?( de mercado| recente| online)?\.?$/i.test(f)) return false;
  // Pelo menos uma palavra com maiúscula (o nome de quem publicou) ou um link.
  return /\p{Lu}/u.test(f) || /https?:\/\//.test(f);
}

/** Os dados da pesquisa com número e fonte rastreável (o que pode ser levado ao JEV). Pura. */
export function dadosComFonte(dados: DadoDePesquisa[] | null | undefined): DadoDePesquisa[] {
  return (dados ?? []).filter((d) => d && numerosDoTexto(d.valor ?? "").length > 0 && fonteRastreavel(d.fonte));
}

/** O tema do vídeo para o JEV julgar o dado: o tema, o resumo e as teses da fala. Pura. */
export function temaDoVideo(radar: { tema?: string; resumo?: string; teses?: Array<{ frase: string }> } | null | undefined): string {
  if (!radar) return "";
  return [radar.tema, radar.resumo, ...(radar.teses ?? []).map((t) => t.frase)].filter((t) => t && t.trim()).join("\n").slice(0, 2500);
}

/** Os traços longo e meio (pelo código do caractere: o arquivo não leva o traço escrito). */
const TRACOS = new RegExp(`[${String.fromCharCode(0x2014, 0x2013)}]`, "g");

/** A fonte como vai escrita na arte: sem o "pesquisa"/"estudo" do começo, curta. Pura. */
export function fonteCurta(fonte: string): string {
  const t = fonte
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(?:a |o )?(?:pesquisa|estudo|levantamento|relat[óo]rio)s?\s+(?:d[aoe]s?\s+)?/i, "")
    .replace(TRACOS, ",");
  const curta = t.length > 70 ? t.slice(0, 70).replace(/\s+\S*$/, "").replace(/[\s,;:.(]+$/, "") : t;
  return curta.charAt(0).toUpperCase() + curta.slice(1);
}

/** O rodapé das fontes ("Fonte: Robert Half, 2026" ou "Fontes: A; B"). Vazio sem fonte. Pura. */
export function rodapeDasFontes(fontes: FonteDoNumero[]): string {
  const nomes = [...new Set(fontes.map((f) => fonteCurta(f.fonte)).filter(Boolean))];
  if (!nomes.length) return "";
  return `${nomes.length === 1 ? "Fonte" : "Fontes"}: ${nomes.join("; ")}`;
}

/** O dado de pesquisa (com fonte e no tema) que tem este número, ou null. Pura. */
export function dadoDoNumero(numero: string, dados: DadoDePesquisa[]): DadoDePesquisa | null {
  return dados.find((d) => numerosDoTexto(d.valor).includes(numero)) ?? null;
}

const semAcento = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * A LEGENDA CITA A FONTE do número de pesquisa que usa (11/10): o número que
 * aparece na legenda e veio da pesquisa leva o nome da fonte no texto; quando
 * o redator não citou, a linha "Fonte: ..." entra no fim (antes do bloco de
 * links, que fica por último). Pura.
 */
export function legendaComAsFontes(legenda: string, fontes: FonteDoNumero[]): string {
  const texto = legenda ?? "";
  const numerosDaLegenda = new Set(numerosDoTexto(texto));
  const base = semAcento(texto);
  const faltam = fontes.filter((f) => numerosDaLegenda.has(f.numero) && !base.includes(semAcento(fonteCurta(f.fonte)).split(",")[0].trim()));
  const rodape = rodapeDasFontes(faltam);
  if (!rodape) return texto;
  const links = texto.search(/\n\s*(?:Links|Minhas redes):\s*\n/);
  if (links < 0) return `${texto.trimEnd()}\n\n${rodape}.`;
  return `${texto.slice(0, links).trimEnd()}\n\n${rodape}.${texto.slice(links)}`;
}

/**
 * Os dados de pesquisa do vídeo que podem ir à arte: com fonte rastreável e
 * que o JEV disse que complementam o tema (lib/squad/coerencia-da-arte.ts,
 * dadosNoTemaPeloJev). Sem JEV, nenhum. O perguntador entra por parâmetro
 * para o teste (nada de rede).
 */
export async function dadosDaArteNoTema(o: {
  projectId?: string | null;
  radar: { tema?: string; resumo?: string; teses?: Array<{ frase: string }>; dados?: DadoDePesquisa[] } | null | undefined;
  perguntar?: import("@/lib/squad/coerencia-da-arte").PerguntadorDoJev;
  ligado?: boolean;
}): Promise<DadoDePesquisa[]> {
  const candidatos = dadosComFonte(o.radar?.dados);
  if (!candidatos.length) return [];
  const { dadosNoTemaPeloJev } = await import("@/lib/squad/coerencia-da-arte");
  const noTema = await dadosNoTemaPeloJev({ projectId: o.projectId, tema: temaDoVideo(o.radar), dados: candidatos, perguntar: o.perguntar, ligado: o.ligado });
  const fora = candidatos.filter((d) => !noTema.includes(d));
  if (fora.length) console.warn(`[vera][lastro] dado de pesquisa fora do tema do vídeo (não vai à arte): ${fora.map((d) => `${d.valor} ${d.oQueMede.slice(0, 60)} (${d.fonte})`).join("; ")}`);
  return noTema;
}
