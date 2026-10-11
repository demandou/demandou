import { put } from "@vercel/blob";
import { prisma } from "@/lib/db/prisma";
import { lerMidia, midiaProduzida } from "@/lib/media/storage";
import { comporCapa, type Expressao } from "@/lib/media/capa-e-titulo";
import { dataUrlToBuffer } from "@/lib/media/nano-banana";
import { baseDaCapaDoCorte, falaDoCorte, falhaDaCapa, type CapaPendente, type FotoDaCapa, type TrechoDaCapa } from "@/lib/media/capa-pelo-modelo";

export { baseDaCapaDoCorte };

/**
 * A CAPA DE UM CORTE PELO CAMINHO DE HOJE (a composição em código sobre o
 * fundo gerado), com a regra do quadro nítido (11/10/2026). É a capa do
 * projeto SEM estilo escolhido. Com estilo escolhido (modelo do curso ou
 * edição sob medida), a capa sai no estilo (`capaDoCorteNoEstilo`), nunca por
 * aqui: trocar o estilo sozinho é proibido (11/10).
 *
 * A foto da pessoa:
 * - o quadro do PRÓPRIO corte, quando ele chegou com o recorte (o worker só
 *   recorta quadro que passou no crivo: olho aberto, rosto inteiro e grande,
 *   sem borrão);
 * - senão, o quadro nítido do vídeo inteiro (ou a foto da Biblioteca), pedido
 *   uma vez para todos os cortes;
 * - senão, nenhuma: a capa sai só com a frase. Nunca o quadro fixo do trecho
 *   nem o quadro-fonte antigo, que não passaram por crivo nenhum.
 */

/** Compõe a capa 9:16 de um corte e devolve a URL, ou null. */
export async function comporCapaDoCorte(o: {
  videoJobId: string;
  projectId: string;
  nicho: string | null;
  indice: number;
  trecho: TrechoDaCapa;
  doVideo: FotoDaCapa | null;
  ajuste?: string;
}): Promise<string | null> {
  const frase = o.trecho.texto?.fraseDaCapa;
  if (!frase) return null;
  const { quadroUrl, recorteUrl } = baseDaCapaDoCorte(o.trecho, o.doVideo);
  const bytes = quadroUrl ? await lerMidia(quadroUrl) : null;
  const arte = await comporCapa(bytes ? bytes.toString("base64") : "", frase, {
    expressao: o.trecho.texto?.expressao as Expressao | undefined,
    cenario: o.trecho.texto?.cenario,
    nicho: o.nicho,
    usageCtx: { projectId: o.projectId },
    formato: "9:16",
    ajuste: o.ajuste,
    quadroUrl: bytes ? quadroUrl : null,
    recorteUrl: bytes ? recorteUrl : null,
    chaveDoRecorte: `cortes/${o.videoJobId}/recorte-capa-${o.indice}.png`,
  });
  if (!arte) return null;
  const { url } = await put(`cortes/${o.videoJobId}/capa-arte-${o.indice}.jpg`, dataUrlToBuffer(arte), {
    // Capa é mídia PRODUZIDA: vai para o store público, que entrega cache e Range.
    ...midiaProduzida(),
    contentType: "image/jpeg",
    addRandomSuffix: true,
  });
  return url;
}

/** A foto do vídeo para os cortes que não têm quadro próprio: pedida só se algum precisar. */
export async function fotoDoVideoSePrecisar(videoJobId: string, projectId: string, trechos: TrechoDaCapa[]): Promise<FotoDaCapa | null> {
  if (trechos.every((t) => t.midia?.recorte?.url && t.midia?.capa?.url)) return null;
  const { fotoDaCapa } = await import("@/lib/media/capa-pelo-modelo-servidor");
  return fotoDaCapa(videoJobId, projectId, { largura: 1080, altura: 1920 });
}

/**
 * A CAPA 9:16 DE UM CORTE NO ESTILO ESCOLHIDO (11/10): a frase da capa, o
 * assunto do trecho da fala do corte, a pessoa do quadro nítido quando o
 * estilo pede a pessoa, duas tentativas no estilo (uma quando o template do
 * worker já foi a primeira). Devolve a URL; lança quando não sai.
 */
export async function capaDoCorteNoEstilo(o: {
  videoJobId: string;
  projectId: string;
  nicho: string | null;
  indice: number;
  modelo: string;
  trecho: TrechoDaCapa;
  doVideo: FotoDaCapa | null;
  fala: { texto: string | null; palavras: Array<{ word: string; start: number; end: number }> };
  ajuste?: string | null;
  tentativas?: number;
}): Promise<string> {
  const frase = o.trecho.texto?.fraseDaCapa;
  if (!frase) throw new Error("o corte não tem a frase da capa");
  const { capaDoCortePelaIa, recorteDaPessoaParaOEstilo } = await import("@/lib/media/capa-pela-ia");
  // A pessoa é o recorte real do quadro nítido (o do corte, ou o do vídeo), colado em código (11/10).
  const { quadroUrl, recorteUrl } = baseDaCapaDoCorte(o.trecho, o.doVideo);
  return capaDoCortePelaIa({
    projectId: o.projectId,
    videoJobId: o.videoJobId,
    indice: o.indice,
    modelo: o.modelo,
    frase,
    trecho: falaDoCorte(o.fala.palavras, o.trecho.inicio, o.trecho.fim),
    fala: o.fala.texto,
    contexto: [o.trecho.texto?.titulo ?? o.trecho.titulo, o.trecho.ideia].filter(Boolean).join(". ") || null,
    nicho: o.nicho,
    recorteDaPessoa: await recorteDaPessoaParaOEstilo(o.modelo, { quadroUrl, recorteUrl, chave: `cortes/${o.videoJobId}/recorte-capa-${o.indice}.png` }),
    ajuste: o.ajuste ?? null,
    tentativas: o.tentativas,
  });
}

/**
 * AS CAPAS DOS CORTES NO ESTILO ESCOLHIDO, gravadas em cada corte: a que saiu
 * vira `capaArte` (e a falha de antes sai); a que não saiu fica com
 * `capaFalhou` (a falha técnica com "Tentar de novo", sem cobrança), e a capa
 * de antes, se havia, continua. É a segunda tentativa depois do template do
 * modelo do curso, a capa da edição sob medida e o "Tentar de novo" da tela.
 */
export async function capasDosCortesNoEstilo(videoJobId: string, indices: number[], o: { modelo: string; tentativas?: number }): Promise<{ feitas: number; falhas: number }> {
  const video = await prisma.videoJob.findUnique({ where: { id: videoJobId }, select: { id: true, projectId: true, clips: true, transcript: true, project: { select: { niche: true } } } });
  if (!video) return { feitas: 0, falhas: 0 };
  const trechos = (video.clips as unknown as TrechoDaCapa[]) ?? [];
  const alvos = [...new Set(indices)].filter((i) => trechos[i]?.texto?.fraseDaCapa);
  if (!alvos.length) return { feitas: 0, falhas: 0 };
  const { promptDeEstiloDoModelo } = await import("@/lib/media/editor-do-curso/arte-pela-ia");
  const { falaDaTranscricao } = await import("@/lib/media/capa-pela-ia");
  // O quadro nítido só para o estilo que pede a pessoa (o recorte).
  const doVideo = promptDeEstiloDoModelo(o.modelo)?.pessoa ? await fotoDoVideoSePrecisar(video.id, video.projectId, alvos.map((i) => trechos[i])).catch(() => null) : null;
  const fala = falaDaTranscricao(video.transcript);
  const { fundirNoTrecho } = await import("@/lib/media/revisao-do-corte");
  let feitas = 0;
  let falhas = 0;
  const desde = new Date().toISOString();
  const lote = `capa-ia-cortes-${video.id}-${Date.now().toString(36)}`;
  // Três por vez: cada capa leva de 30 a 90 s, e o fornecedor limita a vazão.
  const fila = [...alvos];
  const trabalhar = async () => {
    for (let i = fila.shift(); i !== undefined; i = fila.shift()) {
      try {
        const url = await capaDoCorteNoEstilo({ videoJobId: video.id, projectId: video.projectId, nicho: video.project.niche, indice: i, modelo: o.modelo, trecho: trechos[i], doVideo, fala, tentativas: o.tentativas });
        // O registro da capa no estilo (o mesmo campo do template): o estilo, feita, sem pendência nem reserva.
        const anterior = (trechos[i]?.midia as { capaNoModelo?: { templateFalhou?: string | null } } | null | undefined)?.capaNoModelo?.templateFalhou ?? null;
        const registro: CapaPendente & { peca: number; caminho: "ia"; tentativaAnterior?: string } = {
          lote,
          pendente: false,
          desde,
          modelo: o.modelo,
          foto: doVideo?.origem ?? "nenhuma",
          feitoEm: new Date().toISOString(),
          peca: alvos.indexOf(i) + 1,
          caminho: "ia",
          ...(anterior ? { tentativaAnterior: anterior } : {}),
        };
        await fundirNoTrecho(video.id, i, {}, { capaArte: { url }, capaNoModelo: registro, capaFalhou: null });
        feitas++;
      } catch (e) {
        falhas++;
        const falha = falhaDaCapa(o.modelo, e);
        console.error(`[capa-do-corte][${video.id}] corte ${i}: a capa no estilo ${o.modelo} não saiu (${falha.detalhe}); para como falha técnica, sem trocar o estilo`);
        await fundirNoTrecho(video.id, i, {}, { capaFalhou: falha }).catch(() => {});
      }
    }
  };
  await Promise.all([1, 2, 3].map(trabalhar));
  return { feitas, falhas };
}
