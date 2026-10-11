import type { ProporcaoPedida } from "@/lib/media/formatos-das-redes";
import type { PedidoDeArte } from "@/lib/media/arte-por-rede";
import type { ConteudoDoInfografico } from "@/lib/media/infographic";
import type { MarcaDaArte } from "@/lib/media/arte-com-frase";
import type { ContextoMidia } from "@/lib/media/usage";
import type { GeradorDoInfografico, ModeloDoInfografico } from "@/lib/media/infografico-pelo-modelo";
import { composicaoDaPeca, estiloComoLinguagem, promptDaArteNoModelo, promptDaCenaNoModelo, promptDeEstiloDoModelo, trechoDaFala, type CoresDaPeca, type TipoDaArte } from "./arte-pela-ia";

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

/** Quantas vezes a peça tenta o ESTILO ESCOLHIDO antes de parar como falha técnica (11/10, a mesma regra do corte). */
export const TENTATIVAS_NO_ESTILO = 2;

/**
 * NUNCA TROCAR O ESTILO SOZINHO (11/10, regra do Bruno). Roda o desenho no
 * estilo escolhido e, se falhar, tenta de novo NO MESMO estilo; falhou de novo,
 * lança com o motivo, e quem chama marca a peça como falha técnica com
 * "Tentar de novo" e sem cobrança. Sem saldo no fornecedor não adianta repetir:
 * lança na hora (o aviso de saldo é assunto do Bruno, não do cliente).
 */
export async function noMesmoEstilo<T>(fazer: (tentativa: number) => Promise<T>, o: { tentativas?: number; rotulo?: string; semSaldo?: (e: unknown) => boolean } = {}): Promise<T> {
  const tentativas = Math.max(1, o.tentativas ?? TENTATIVAS_NO_ESTILO);
  const semSaldo = o.semSaldo ?? (await import("@/lib/media/gpt-image")).ehSemSaldoDaOpenAI;
  let ultimo: unknown = null;
  for (let t = 1; t <= tentativas; t++) {
    try {
      return await fazer(t);
    } catch (e) {
      if (semSaldo(e)) throw e;
      ultimo = e;
      const motivo = e instanceof Error ? e.message : String(e);
      if (t < tentativas) console.warn(`[estilo]${o.rotulo ? `[${o.rotulo}]` : ""} tentativa ${t} falhou (${motivo.slice(0, 200)}); de novo no mesmo estilo`);
    }
  }
  throw ultimo instanceof Error ? ultimo : new Error(String(ultimo));
}

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
  /** O trecho da transcrição de onde a peça saiu: o assunto da arte (11/10). */
  trecho?: string | null;
  /** A transcrição do vídeo: sem `trecho`, o de cada peça (cada lâmina) sai dela. */
  fala?: string | null;
  /** A foto da pessoa (data URI de um quadro nítido da gravação), para o estilo que pede a pessoa. */
  fotoDaPessoa?: string | null;
};

/** Quem desenha COM a foto da pessoa de referência. Parâmetro para a prova e o teste trocarem. */
export type GeradorComFoto = (prompt: string, proporcao: ProporcaoPedida, foto: string, ctx: ContextoMidia) => Promise<string>;

export type InjecoesDaArte = {
  gerar?: GeradorDoInfografico;
  gerarComFoto?: GeradorComFoto;
  conferir?: PedidoDeArte["conferir"];
};

/**
 * O Nano Banana Pro com a foto da pessoa junto (a edição a partir da imagem):
 * a pessoa do recorte é a da gravação, nunca uma inventada.
 */
export const gerarComFotoNoGoogle: GeradorComFoto = async (prompt, proporcao, foto, ctx) => {
  const { pedidoAoGoogle, FICHA_DO_MODELO } = await import("@/lib/media/infografico-pelo-modelo");
  const { gravarCustoDeImagem } = await import("@/lib/media/usage");
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) throw new Error("GEMINI_API_KEY não configurada");
  const { url, corpo } = pedidoAoGoogle("nano-banana-pro", prompt, proporcao);
  const mime = foto.slice(5, foto.indexOf(";")) || "image/jpeg";
  (corpo.contents as Array<{ parts: unknown[] }>)[0].parts.unshift({ inlineData: { mimeType: mime, data: foto.slice(foto.indexOf(",") + 1) } });
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": chave }, body: JSON.stringify(corpo), signal: AbortSignal.timeout(150_000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text().catch(() => "")).slice(0, 160)}`);
  const j = (await r.json()) as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data: string; mimeType?: string } }> } }> };
  const parte = (j.candidates?.[0]?.content?.parts ?? []).find((x) => x.inlineData?.data);
  if (!parte?.inlineData) throw new Error("o Nano Banana Pro não devolveu a imagem com a foto");
  gravarCustoDeImagem(FICHA_DO_MODELO["nano-banana-pro"].id, FICHA_DO_MODELO["nano-banana-pro"].precoUsd, ctx);
  return `data:${parte.inlineData.mimeType ?? "image/png"};base64,${parte.inlineData.data}`;
};

/** O trecho da fala desta peça: o dado, ou a janela da transcrição que mais casa com a frase (peso dobrado) e a legenda. */
export function trechoDaPeca(p: Pick<PecaPelaIa, "trecho" | "fala" | "textoDoPost">, texto: string): string | null {
  return p.trecho ?? trechoDaFala(p.fala, `${texto} ${texto} ${p.textoDoPost ?? ""}`);
}

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
export async function pecaDeFrase(
  p: PecaPelaIa,
  o: { texto: string; tipo: TipoDaArte; lamina?: number; pagina?: { i: number; total: number } | null; redes: string[]; contentType: string; ajuste?: string | null },
  inj: InjecoesDaArte
): Promise<Record<string, string>> {
  const estilo = promptDeEstiloDoModelo(p.modelo);
  if (!estilo) throw new Error(`o modelo ${p.modelo} não tem o prompt de estilo`);
  const { produzirArtePorRede } = await import("@/lib/media/arte-por-rede");
  const { ORDEM_PRINCIPAL, ORDEM_ALTERNATIVA } = await import("@/lib/media/infografico-pelo-modelo");
  const ctx: ContextoMidia = { projectId: p.projectId, runId: p.runId ?? undefined, operation: OPERACAO_DA_ARTE_PELA_IA };
  const comFoto = Boolean(estilo.pessoa && p.fotoDaPessoa);
  const promptBase = promptDaArteNoModelo({
    estilo,
    texto: o.texto,
    tipo: o.tipo,
    cores: await coresDaPeca(p.marca),
    composicao: composicaoDaPeca(estilo, { dia: p.dia, lamina: o.lamina }),
    contexto: p.textoDoPost,
    nicho: p.nicho,
    pagina: o.pagina,
    trecho: trechoDaPeca(p, o.texto),
    comFotoDaPessoa: comFoto,
    ajuste: o.ajuste ?? null,
  });
  // O estilo que pede a pessoa (o recorte) desenha com a foto dela; sem a foto, sem pessoa.
  const foto = comFoto ? p.fotoDaPessoa! : null;
  const comAFoto = foto ? async (prompt: string, proporcao: ProporcaoPedida) => (inj.gerarComFoto ?? gerarComFotoNoGoogle)(prompt, proporcao, foto, ctx) : null;
  const arte = await produzirArtePorRede({
    redes: o.redes,
    contentType: o.contentType,
    promptBase,
    textoEsperado: [o.texto],
    textoDesenhadoPeloModelo: true,
    usarOlho: true,
    permitirPessoas: Boolean(foto),
    textoDoPost: p.textoDoPost ?? undefined,
    desenhar: comAFoto ?? (await desenhista(ORDEM_PRINCIPAL, ctx, inj.gerar)),
    desenharAlternativo: comAFoto ?? (await desenhista(ORDEM_ALTERNATIVA, ctx, inj.gerar)),
    projectId: p.projectId,
    runId: p.runId ?? undefined,
    ...(inj.conferir ? { conferir: inj.conferir } : {}),
  });
  if (!arte.algumaReprovada) return arte.porRede;
  // A RESERVA FICA NO ESTILO DO MODELO (11/10): esgotadas as tentativas com o
  // texto desenhado pela IA, ela desenha a cena no estilo sem nenhum texto e a
  // frase entra por cima em código. Se até isso falhar, a peça lança: quem
  // chama tenta de novo no mesmo estilo e, sem sair, marca a falha técnica.
  const motivo = arte.avisos.filter((a) => /problema/.test(a)).join(" | ").slice(0, 300);
  console.warn(`[arte-no-modelo][${p.projectId}] o texto pela IA não passou (${motivo}); a cena no estilo de ${p.modelo} sai sem texto e a frase entra em código`);
  return cenaComFraseEmCodigo(p, o, inj);
}

/**
 * A cena no estilo do modelo, sem texto, com a frase composta em código por
 * cima (comporFraseNaArte, o mesmo compositor das artes de hoje), conferida sem
 * aceitar palavra a mais. O book de modelos e o tratamento de cor ficam de fora:
 * a forma é a do modelo do curso e a cor da marca não tinge a cena.
 */
export async function cenaComFraseEmCodigo(
  p: PecaPelaIa,
  o: { texto: string; tipo: TipoDaArte; lamina?: number; redes: string[]; contentType: string },
  inj: InjecoesDaArte
): Promise<Record<string, string>> {
  const estilo = promptDeEstiloDoModelo(p.modelo)!;
  const { produzirArtePorRede } = await import("@/lib/media/arte-por-rede");
  const { gerarInfografico, ORDEM_PRINCIPAL } = await import("@/lib/media/infografico-pelo-modelo");
  const { comporFraseNaArte } = await import("@/lib/media/arte-com-frase");
  const sharp = (await import("sharp")).default;
  const ctx: ContextoMidia = { projectId: p.projectId, runId: p.runId ?? undefined, operation: OPERACAO_DA_ARTE_PELA_IA };
  // A família "sobrio" com a variante 0 põe a cena na peça inteira e a frase no
  // terço de cima, a área calma que o prompt da cena pede.
  const marca: MarcaDaArte = { ...p.marca, familia: "sobrio", variante: 0, modelos: undefined, modeloFixo: undefined, estiloDoPost: undefined, materiais: undefined, tratamento: null } as MarcaDaArte;
  // O estilo que pede a pessoa (o recorte) segue com ela na cena: sem a pessoa
  // seria outra coisa, não o mesmo estilo sem a letra.
  const foto = estilo.pessoa && p.fotoDaPessoa ? p.fotoDaPessoa : null;
  const promptBase = promptDaCenaNoModelo({
    estilo,
    ideia: o.texto,
    tipo: o.tipo,
    cores: await coresDaPeca(p.marca),
    composicao: composicaoDaPeca(estilo, { dia: p.dia, lamina: o.lamina }),
    contexto: p.textoDoPost,
    nicho: p.nicho,
    trecho: trechoDaPeca(p, o.texto),
    comFotoDaPessoa: Boolean(foto),
  });
  const arte = await produzirArtePorRede({
    redes: o.redes,
    contentType: o.contentType,
    promptBase,
    textoEsperado: [o.texto],
    usarOlho: true,
    permitirPessoas: Boolean(foto),
    textoDoPost: p.textoDoPost ?? undefined,
    desenhar: async (prompt, proporcao) => {
      const dataUrl = foto ? await (inj.gerarComFoto ?? gerarComFotoNoGoogle)(prompt, proporcao, foto, ctx) : (await gerarInfografico(prompt, proporcao, ctx, ORDEM_PRINCIPAL, inj.gerar)).dataUrl;
      const bruto = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
      const m = await sharp(bruto).metadata();
      // A capa deitada sai em 1280 de largura (o tamanho do YouTube); o resto, em 1080.
      const largura = (m.width ?? 1080) > (m.height ?? 1350) ? 1280 : 1080;
      const altura = Math.round((largura * (m.height ?? 1350)) / (m.width ?? 1080));
      const jpeg = await comporFraseNaArte({ arte: bruto, frase: o.texto, marca, largura, altura });
      return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
    },
    projectId: p.projectId,
    runId: p.runId ?? undefined,
    ...(inj.conferir ? { conferir: inj.conferir } : {}),
  });
  if (arte.algumaReprovada) throw new Error(`nem a cena no estilo do modelo com a frase em código passou na conferência: ${arte.avisos.filter((a) => /problema/.test(a)).join(" | ").slice(0, 300)}`);
  return arte.porRede;
}

/**
 * A CAPA DO VÍDEO PELA IA NO ESTILO ESCOLHIDO (11/10): a thumb 16:9 do
 * completo e a capa 9:16 de cada corte saem no estilo da opção sob medida (ou
 * do modelo do curso, na segunda tentativa depois do template), com o assunto
 * do trecho da fala, a frase da capa exata, a pessoa do quadro nítido quando o
 * estilo pede a pessoa, as cores e o logo da marca. Devolve o JPEG no tamanho
 * final; lança quando não sai: quem chama tenta de novo no MESMO estilo
 * (noMesmoEstilo) e, sem sair, marca a falha técnica. Nunca o caminho antigo.
 */
export async function capaPelaIa(o: {
  projectId: string;
  modelo: string;
  frase: string;
  formato: "16:9" | "9:16";
  nicho?: string | null;
  contexto?: string | null;
  fala?: string | null;
  trecho?: string | null;
  fotoDaPessoa?: string | null;
  marca?: MarcaDaArte;
  /** O logo já pronto (null: sem logo); ausente, o do projeto. */
  logo?: { src: string } | null;
  /** O ajuste pedido no refazer, no mesmo estilo. */
  ajuste?: string | null;
  inj?: InjecoesDaArte;
}): Promise<Buffer> {
  if (!promptDeEstiloDoModelo(o.modelo)) throw new Error(`o estilo ${o.modelo} não tem o prompt de estilo`);
  const { marcaDaArte } = await import("@/lib/media/arte-com-frase");
  const marca = o.marca ?? (await marcaDaArte(o.projectId));
  const redes = o.formato === "16:9" ? ["youtube"] : ["instagram"];
  const porRede = await pecaDeFrase(
    { projectId: o.projectId, modelo: o.modelo, mediaType: "image", redes, frase: o.frase, textoDoPost: o.contexto ?? null, nicho: o.nicho ?? null, marca, fala: o.fala ?? null, trecho: o.trecho ?? null, fotoDaPessoa: o.fotoDaPessoa ?? null },
    { texto: o.frase, tipo: o.formato === "16:9" ? "thumb" : "capa-vertical", redes, contentType: o.formato === "16:9" ? "image" : "reels", ajuste: o.ajuste ?? null },
    o.inj ?? {}
  );
  const uri = porRede[redes[0]];
  if (!uri) throw new Error("a capa pela IA não saiu");
  const sharp = (await import("sharp")).default;
  const base = Buffer.from(uri.slice(uri.indexOf(",") + 1), "base64");
  const logo = "logo" in o ? o.logo ?? null : marca.logoDoModelo ?? (await logoDoProjeto(o.projectId));
  return comLogoDaMarca(await sharp(base).jpeg({ quality: 92 }).toBuffer(), logo);
}

/** O logo do projeto pronto para a arte (o mesmo tratamento das artes de hoje), ou null. */
async function logoDoProjeto(projectId: string): Promise<{ src: string } | null> {
  try {
    const { prisma } = await import("@/lib/db/prisma");
    const p = await prisma.project.findUnique({ where: { id: projectId }, select: { logoUrl: true } });
    if (!p?.logoUrl) return null;
    const { lerMidia } = await import("@/lib/media/storage");
    const { logoParaArte } = await import("@/lib/modelos-de-arte/compor");
    return await logoParaArte(await lerMidia(p.logoUrl).catch(() => null));
  } catch {
    return null;
  }
}

/** O logo da marca no canto de cima à esquerda (7% do lado menor), quando o projeto tem logo. */
export async function comLogoDaMarca(jpeg: Buffer, logo: { src: string } | null | undefined): Promise<Buffer> {
  if (!logo?.src) return jpeg;
  try {
    const sharp = (await import("sharp")).default;
    const m = await sharp(jpeg).metadata();
    const W = m.width ?? 1080;
    const H = m.height ?? 1920;
    const alto = Math.round(Math.min(W, H) * 0.07);
    const png = await sharp(Buffer.from(logo.src.slice(logo.src.indexOf(",") + 1), "base64")).resize({ height: alto }).png().toBuffer();
    const margem = Math.round(Math.min(W, H) * 0.05);
    return await sharp(jpeg).composite([{ input: png, left: margem, top: margem }]).jpeg({ quality: 92 }).toBuffer();
  } catch {
    return jpeg;
  }
}

/**
 * As artes de um dia (ou de um post do refazer) pela IA, por rede. O carrossel
 * devolve as lâminas juntas por "|" (a mesma arte em todas as redes do dia,
 * como hoje). Lança quando não sai: quem chama tenta de novo no mesmo estilo
 * e, sem sair, marca a falha técnica (nunca o caminho de antes).
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
