import type { InjecoesDaArte } from "@/lib/media/editor-do-curso/arte-pela-ia-servidor";
import type { MarcaDaArte } from "@/lib/media/arte-com-frase";
import type { ExpressaoDaCapa, OpcaoDeCapa } from "@/lib/media/estilos-de-capa";

/**
 * AS CAPAS PELA IA NO ESTILO ESCOLHIDO (11/10/2026). A thumb 16:9 do completo
 * e a capa 9:16 de cada corte do projeto com edição sob medida (e a segunda
 * tentativa do projeto com modelo do curso, quando o template do worker não
 * entregou) saem do prompt de estilo pela IA de imagem
 * (capaPelaIa em lib/media/editor-do-curso/arte-pela-ia-servidor.ts), cada uma
 * com duas tentativas no MESMO estilo (noMesmoEstilo). O que não sair lança, e
 * quem chama grava a falha técnica com "Tentar de novo": nunca a composição de
 * antes, nunca o modelo de reserva.
 *
 * O gerador, a conferência e o lugar onde a imagem é guardada entram por
 * parâmetro: o teste troca por falsos, a prova paga usa os de verdade sem
 * gravar no banco.
 */

/** Onde a capa pronta é guardada: devolve a URL pública. */
export type GuardarCapa = (chave: string, jpeg: Buffer) => Promise<string>;

/** O store público de mídia produzida (capa é pública no YouTube de qualquer forma). */
export const guardarNoStore: GuardarCapa = async (chave, jpeg) => {
  const { put } = await import("@vercel/blob");
  const { midiaProduzida } = await import("@/lib/media/storage");
  const { url } = await put(chave, jpeg, { ...midiaProduzida(), contentType: "image/jpeg", addRandomSuffix: true });
  return url;
};

type Comum = {
  projectId: string;
  videoJobId: string;
  /** O estilo escolhido: a opção sob medida ou o modelo do curso. */
  modelo: string;
  nicho?: string | null;
  /** O título e o resumo do vídeo (ou o texto do corte): o contexto da capa. */
  contexto?: string | null;
  /** A transcrição do vídeo: o assunto sai do trecho que casa com a frase. */
  fala?: string | null;
  /** O recorte real da pessoa (data URI PNG com alfa), só para o estilo que põe a pessoa: colado em código. */
  recorteDaPessoa?: string | null;
  marca?: MarcaDaArte;
  logo?: { src: string } | null;
  inj?: InjecoesDaArte;
  guardar?: GuardarCapa;
  /** Quantas tentativas no estilo (2 por padrão; 1 quando o template já foi a primeira). */
  tentativas?: number;
};

/**
 * As opções da capa do COMPLETO, em 16:9, uma por frase, em paralelo. Cada uma
 * tenta o estilo duas vezes; as que saem viram opções (JPEG 1280x720 que o
 * YouTube aceita). Devolve as opções e os motivos das que não saíram.
 */
export async function capasDoCompletoPelaIa(o: Comum & { frases: Array<{ frase: string; expressao: ExpressaoDaCapa }> }): Promise<{ opcoes: OpcaoDeCapa[]; erros: string[] }> {
  const { capaPelaIa, noMesmoEstilo } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
  const { normalizarCapaParaYouTube } = await import("@/lib/media/capa-youtube");
  const guardar = o.guardar ?? guardarNoStore;
  const resultados = await Promise.all(
    o.frases.map(async (f, i) => {
      try {
        const jpeg = await noMesmoEstilo(
          () =>
            capaPelaIa({
              projectId: o.projectId,
              modelo: o.modelo,
              frase: f.frase,
              formato: "16:9",
              nicho: o.nicho,
              contexto: o.contexto,
              fala: o.fala,
              recorteDaPessoa: o.recorteDaPessoa,
              marca: o.marca,
              ...("logo" in o ? { logo: o.logo ?? null } : {}),
              inj: o.inj,
            }),
          { tentativas: o.tentativas, rotulo: `capa-completo ${o.videoJobId} ${i}` }
        );
        const url = await guardar(`cortes/${o.videoJobId}/capa-completo-${i}.jpg`, await normalizarCapaParaYouTube(jpeg));
        return { opcao: { url, frase: f.frase, expressao: f.expressao } as OpcaoDeCapa, erro: null };
      } catch (e) {
        return { opcao: null, erro: e instanceof Error ? e.message : String(e) };
      }
    })
  );
  return {
    opcoes: resultados.map((r) => r.opcao).filter((x): x is OpcaoDeCapa => Boolean(x)),
    erros: resultados.map((r) => r.erro).filter((x): x is string => Boolean(x)),
  };
}

/**
 * A capa 9:16 de um CORTE no estilo escolhido: a frase da capa, o assunto do
 * trecho da fala do corte, duas tentativas no estilo. Devolve a URL guardada;
 * lança quando não sai.
 */
export async function capaDoCortePelaIa(o: Comum & { indice: number; frase: string; trecho?: string | null; ajuste?: string | null }): Promise<string> {
  const { capaPelaIa, noMesmoEstilo } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
  const guardar = o.guardar ?? guardarNoStore;
  const jpeg = await noMesmoEstilo(
    () =>
      capaPelaIa({
        projectId: o.projectId,
        modelo: o.modelo,
        frase: o.frase,
        formato: "9:16",
        nicho: o.nicho,
        contexto: o.contexto,
        fala: o.fala,
        trecho: o.trecho ?? null,
        recorteDaPessoa: o.recorteDaPessoa,
        marca: o.marca,
        ...("logo" in o ? { logo: o.logo ?? null } : {}),
        ajuste: o.ajuste ?? null,
        inj: o.inj,
      }),
    { tentativas: o.tentativas, rotulo: `capa-corte ${o.videoJobId} ${o.indice}` }
  );
  return guardar(`cortes/${o.videoJobId}/capa-arte-${o.indice}.jpg`, jpeg);
}

/**
 * O RECORTE REAL DA PESSOA em data URI (PNG com alfa), 11/10: o que o worker
 * já recortou do quadro nítido (o `recorte` do /melhor-quadro, o
 * `midia.recorte` do corte); sem ele, o /recortar a partir do quadro. Null em
 * qualquer falha: a peça sai sem pessoa, nunca com uma pessoa desenhada.
 */
export async function recorteDaPessoaEmDataUri(o: { quadroUrl?: string | null; recorteUrl?: string | null; chave: string }): Promise<string | null> {
  const { lerMidia } = await import("@/lib/media/storage");
  try {
    let bytes = o.recorteUrl ? await lerMidia(o.recorteUrl).catch(() => null) : null;
    if (!bytes && o.quadroUrl) {
      const { recortarQuadro } = await import("@/lib/media/recorte-do-quadro");
      const feito = await recortarQuadro(o.quadroUrl, o.chave);
      bytes = feito?.url ? await lerMidia(feito.url).catch(() => null) : null;
    }
    return bytes ? `data:image/png;base64,${bytes.toString("base64")}` : null;
  } catch {
    return null;
  }
}

/** O recorte da pessoa para a capa, só quando o estilo põe a pessoa (o Recorte com letreiro). */
export async function recorteDaPessoaParaOEstilo(modelo: string, o: { quadroUrl?: string | null; recorteUrl?: string | null; chave: string }): Promise<string | null> {
  if (!o.quadroUrl && !o.recorteUrl) return null;
  const { promptDeEstiloDoModelo } = await import("@/lib/media/editor-do-curso/arte-pela-ia");
  if (!promptDeEstiloDoModelo(modelo)?.pessoa) return null;
  return recorteDaPessoaEmDataUri(o);
}

/** A transcrição do vídeo em texto, e as palavras com o tempo (para o trecho de cada corte). */
export function falaDaTranscricao(transcript: unknown): { texto: string | null; palavras: Array<{ word: string; start: number; end: number }> } {
  const t = transcript as { text?: unknown; words?: unknown } | string | null | undefined;
  if (typeof t === "string") return { texto: t, palavras: [] };
  const texto = typeof t?.text === "string" ? t.text : null;
  const palavras = Array.isArray(t?.words) ? (t!.words as Array<{ word: string; start: number; end: number }>).filter((w) => typeof w?.word === "string" && typeof w.start === "number" && typeof w.end === "number") : [];
  return { texto: texto ?? (palavras.length ? palavras.map((w) => w.word).join(" ") : null), palavras };
}
