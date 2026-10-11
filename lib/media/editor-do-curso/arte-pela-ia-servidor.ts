import type { ProporcaoPedida } from "@/lib/media/formatos-das-redes";
import type { PedidoDeArte } from "@/lib/media/arte-por-rede";
import type { ConteudoDoInfografico } from "@/lib/media/infographic";
import type { MarcaDaArte } from "@/lib/media/arte-com-frase";
import type { ContextoMidia } from "@/lib/media/usage";
import type { GeradorDoInfografico, ModeloDoInfografico } from "@/lib/media/infografico-pelo-modelo";
import { composicaoDaPeca, estiloComoLinguagem, promptDaArteNoModelo, promptDeEstiloDoModelo, type CoresDaPeca } from "./arte-pela-ia";

/**
 * O DESENHO PELA IA DE IMAGEM DAS PEÇAS DE UM PROJETO COM MODELO DO CURSO
 * (11/10/2026). As decisões e o prompt estão em arte-pela-ia.ts (puro); aqui,
 * quem chama o modelo de imagem e a conferência, para um dia (as redes do
 * mesmo dia) ou para um post do refazer.
 *
 * Quem desenha: o Nano Banana Pro primeiro (o modelo do Google feito para
 * layout com texto), o Nano Banana 2 se ele não devolver, o GPT Image (pela
 * Higgsfield) por último; a reprovação de ESCRITA refaz começando pelo GPT
 * Image (a ordem alternativa de lib/media/infografico-pelo-modelo.ts). A
 * conferência é a de toda arte com texto desenhado pelo modelo: o texto pedido
 * tem de estar todo lá, igual, e nada além dele.
 */

export const OPERACAO_DA_ARTE_PELA_IA = "arte-no-modelo-ia";

export type PecaPelaIa = {
  projectId: string;
  runId?: string | null;
  modelo: string;
  mediaType: "image" | "carousel" | "infographic";
  redes: string[];
  frase?: string | null;
  slides?: string[] | null;
  infografico?: ConteudoDoInfografico | null;
  textoDoPost?: string | null;
  dia?: number | null;
  nicho?: string | null;
  marca: MarcaDaArte;
};

export type InjecoesDaArte = {
  gerar?: GeradorDoInfografico;
  conferir?: PedidoDeArte["conferir"];
};

/** As cores da marca nos papéis (os aprovados; sem aprovação, as da marca). */
export async function coresDaPeca(marca: MarcaDaArte): Promise<CoresDaPeca> {
  const { coresDoInfografico } = await import("@/lib/media/infografico-pelo-modelo");
  const c = coresDoInfografico(marca);
  return { fundo: c.fundo, titulo: c.texto, destaque: c.destaque };
}

/** O desenhista de uma ordem de modelos, devolvendo o data URI. */
async function desenhista(ordem: ModeloDoInfografico[], ctx: ContextoMidia, gerar?: GeradorDoInfografico) {
  const { gerarInfografico } = await import("@/lib/media/infografico-pelo-modelo");
  return async (prompt: string, proporcao: ProporcaoPedida) => (await gerarInfografico(prompt, proporcao, ctx, ordem, gerar)).dataUrl;
}

/**
 * Uma peça de frase (a foto do dia, uma lâmina) em todas as redes pedidas: uma
 * imagem por proporção, recortada por rede, conferida (lib/media/arte-por-rede.ts).
 */
async function pecaDeFrase(
  p: PecaPelaIa,
  o: { texto: string; tipo: "post" | "capa" | "lamina"; lamina?: number; pagina?: { i: number; total: number } | null; redes: string[]; contentType: string },
  inj: InjecoesDaArte
): Promise<Record<string, string>> {
  const estilo = promptDeEstiloDoModelo(p.modelo);
  if (!estilo) throw new Error(`o modelo ${p.modelo} não tem o prompt de estilo`);
  const { produzirArtePorRede } = await import("@/lib/media/arte-por-rede");
  const { ORDEM_PRINCIPAL, ORDEM_ALTERNATIVA } = await import("@/lib/media/infografico-pelo-modelo");
  const ctx: ContextoMidia = { projectId: p.projectId, runId: p.runId ?? undefined, operation: OPERACAO_DA_ARTE_PELA_IA };
  const promptBase = promptDaArteNoModelo({
    estilo,
    texto: o.texto,
    tipo: o.tipo,
    cores: await coresDaPeca(p.marca),
    composicao: composicaoDaPeca(estilo, { dia: p.dia, lamina: o.lamina }),
    contexto: p.textoDoPost,
    nicho: p.nicho,
    pagina: o.pagina,
  });
  const arte = await produzirArtePorRede({
    redes: o.redes,
    contentType: o.contentType,
    promptBase,
    textoEsperado: [o.texto],
    textoDesenhadoPeloModelo: true,
    usarOlho: true,
    textoDoPost: p.textoDoPost ?? undefined,
    desenhar: await desenhista(ORDEM_PRINCIPAL, ctx, inj.gerar),
    desenharAlternativo: await desenhista(ORDEM_ALTERNATIVA, ctx, inj.gerar),
    projectId: p.projectId,
    runId: p.runId ?? undefined,
    ...(inj.conferir ? { conferir: inj.conferir } : {}),
  });
  // A frase que não passou nas três tentativas não vai ao ar pela IA: o caminho de hoje desenha (texto em código, sempre certo).
  if (arte.algumaReprovada) throw new Error(`a arte pela IA não passou na conferência: ${arte.avisos.filter((a) => /problema/.test(a)).join(" | ").slice(0, 300)}`);
  return arte.porRede;
}

/**
 * As artes de um dia (ou de um post do refazer) pela IA, por rede. O carrossel
 * devolve as lâminas juntas por "|" (a mesma arte em todas as redes do dia,
 * como hoje). Lança quando não sai: quem chama vai ao caminho de hoje.
 */
export async function desenharPelaIa(p: PecaPelaIa, inj: InjecoesDaArte = {}): Promise<Record<string, string>> {
  const estilo = promptDeEstiloDoModelo(p.modelo);
  if (!estilo) throw new Error(`o modelo ${p.modelo} não tem o prompt de estilo`);
  if (p.mediaType === "infographic") {
    if (!p.infografico?.title) throw new Error("o infográfico não tem o conteúdo gravado no post");
    const { produzirArtePorRede } = await import("@/lib/media/arte-por-rede");
    const { pedidoDoInfografico } = await import("@/lib/media/infographic");
    const arte = await produzirArtePorRede({
      redes: p.redes,
      textoDoPost: p.textoDoPost ?? undefined,
      projectId: p.projectId,
      runId: p.runId ?? undefined,
      ...(inj.conferir ? { conferir: inj.conferir } : {}),
      ...pedidoDoInfografico(p.infografico, { estilo: estiloComoLinguagem(estilo), paleta: "", marca: p.marca }, { nicho: p.nicho, ctx: { projectId: p.projectId, runId: p.runId ?? undefined, operation: "infografico" }, gerar: inj.gerar }),
    });
    return arte.porRede;
  }
  if (p.mediaType === "carousel") {
    const slides = (p.slides ?? []).map((s) => s.trim()).filter(Boolean);
    if (!slides.length) throw new Error("o carrossel não tem as frases das lâminas gravadas");
    // As lâminas saem em 4:5 numa rede só (a do primeiro post) e a mesma arte vai a todas, como hoje.
    const rede = p.redes[0] ?? "instagram";
    const urls: string[] = new Array(slides.length);
    // Três lâminas por vez: cada uma leva de 30 a 90 s no Pro, e o fornecedor limita a vazão.
    for (let ini = 0; ini < slides.length; ini += 3) {
      await Promise.all(
        slides.slice(ini, ini + 3).map(async (texto, k) => {
          const i = ini + k;
          const porRede = await pecaDeFrase(p, { texto, tipo: i === 0 ? "capa" : "lamina", lamina: i, pagina: { i: i + 1, total: slides.length }, redes: [rede], contentType: "carousel" }, inj);
          urls[i] = porRede[rede];
        })
      );
    }
    return Object.fromEntries(p.redes.map((r) => [r, urls.join("|")]));
  }
  const frase = (p.frase ?? "").trim();
  if (!frase) throw new Error("a foto do dia não tem a frase gravada no post");
  return pecaDeFrase(p, { texto: frase, tipo: "post", redes: p.redes, contentType: "image" }, inj);
}
