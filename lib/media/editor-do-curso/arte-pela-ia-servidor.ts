import type { ProporcaoPedida } from "@/lib/media/formatos-das-redes";
import type { PedidoDeArte } from "@/lib/media/arte-por-rede";
import type { ConteudoDoInfografico } from "@/lib/media/infographic";
import type { MarcaDaArte } from "@/lib/media/arte-com-frase";
import type { ContextoMidia } from "@/lib/media/usage";
import type { GeradorDoInfografico, ModeloDoInfografico } from "@/lib/media/infografico-pelo-modelo";
import { infograficoSoComAFala, lastroComAsFontesDoPost } from "@/lib/media/lastro-do-video";
import type { FonteDoNumero, LastroDaArte } from "@/lib/media/dados-da-arte";
import { composicaoDaPeca, estiloComoLinguagem, layoutDoFundoDoRecorte, linguagemDoInfografico, palavraDoLetreiro, promptDaArteNoModelo, promptDaCenaNoModelo, promptDeEstiloDoModelo, promptDoFundoDoRecorte, tipografiaDoEstilo, trechoDaFala, type CoresDaPeca, type TipoDaArte } from "./arte-pela-ia";

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
  /**
   * A pessoa recortada (data URI de um PNG com alfa, o recorte real do quadro
   * nítido da gravação), para o estilo que põe a pessoa: colada em código,
   * nunca enviada à IA de imagem (11/10).
   */
  recorteDaPessoa?: string | null;
  /** Os números de pesquisa aprovados para esta peça, com a fonte (o `fontesDosNumeros` do post, 11/10). */
  fontesDosNumeros?: FonteDoNumero[] | null;
};

/**
 * Quem desenha e quem confere, por parâmetro (a prova e o teste trocam). Não
 * existe mais o gerador "com a foto da pessoa" (11/10): a IA de imagem nunca
 * recebe a pessoa, que entra como recorte real em código.
 */
export type InjecoesDaArte = {
  gerar?: GeradorDoInfografico;
  conferir?: PedidoDeArte["conferir"];
};

/** O trecho da fala desta peça: o dado, ou a janela da transcrição que mais casa com a frase (peso dobrado) e a legenda. */
export function trechoDaPeca(p: Pick<PecaPelaIa, "trecho" | "fala" | "textoDoPost">, texto: string): string | null {
  return p.trecho ?? trechoDaFala(p.fala, `${texto} ${texto} ${p.textoDoPost ?? ""}`);
}

/** As cores da marca nos papéis (os aprovados; sem aprovação, as da marca). */
export async function coresDaPeca(marca: MarcaDaArte): Promise<CoresDaPeca> {
  const { coresDoInfografico } = await import("@/lib/media/infografico-pelo-modelo");
  const c = coresDoInfografico(marca);
  // A letra em destaque com contraste de leitura (11/10); a cor da marca fica nos detalhes.
  return { fundo: c.fundo, titulo: c.texto, destaque: c.destaque, destaqueNoTexto: c.destaqueNoTexto };
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
  // O estilo que põe a pessoa (o Recorte com letreiro): fundo e letreiro pela
  // IA, sem gente; a pessoa real e a frase em código (11/10).
  if (estilo.pessoa) return pecaDoRecorte(p, o, inj);
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
    trecho: trechoDaPeca(p, o.texto),
    ajuste: o.ajuste ?? null,
  });
  const arte = await produzirArtePorRede({
    redes: o.redes,
    contentType: o.contentType,
    promptBase,
    textoEsperado: [o.texto],
    textoDesenhadoPeloModelo: true,
    usarOlho: true,
    permitirPessoas: false,
    textoDoPost: p.textoDoPost ?? undefined,
    desenhar: await desenhista(ORDEM_PRINCIPAL, ctx, inj.gerar),
    desenharAlternativo: await desenhista(ORDEM_ALTERNATIVA, ctx, inj.gerar),
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
  // A letra da frase é a do estilo (11/10: a Maquete com a frase em serifa parecia outro estilo).
  const marca: MarcaDaArte = { ...p.marca, familia: "sobrio", variante: 0, tipografia: tipografiaDoEstilo(estilo), modelos: undefined, modeloFixo: undefined, estiloDoPost: undefined, materiais: undefined, tratamento: null } as MarcaDaArte;
  const promptBase = promptDaCenaNoModelo({
    estilo,
    ideia: o.texto,
    tipo: o.tipo,
    cores: await coresDaPeca(p.marca),
    composicao: composicaoDaPeca(estilo, { dia: p.dia, lamina: o.lamina }),
    contexto: p.textoDoPost,
    nicho: p.nicho,
    trecho: trechoDaPeca(p, o.texto),
  });
  const arte = await produzirArtePorRede({
    redes: o.redes,
    contentType: o.contentType,
    promptBase,
    textoEsperado: [o.texto],
    usarOlho: true,
    permitirPessoas: false,
    textoDoPost: p.textoDoPost ?? undefined,
    desenhar: async (prompt, proporcao) => {
      const dataUrl = (await gerarInfografico(prompt, proporcao, ctx, ORDEM_PRINCIPAL, inj.gerar)).dataUrl;
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

/** O data URI em bytes. */
function bytesDoDataUri(uri: string): Buffer {
  return Buffer.from(uri.slice(uri.indexOf(",") + 1), "base64");
}

/**
 * A PEÇA DO RECORTE COM LETREIRO (11/10, princípio da aula 8.2). No teste de
 * ponta a ponta a IA recebia o quadro nítido e redesenhava a pessoa (um padre,
 * um homem de óculos), escrevia palavra solta ("DING") e o carrossel parava
 * porque a cena "sem texto" do estilo pedia o letreiro gigante. Agora:
 *
 *   1  a IA desenha só o FUNDO e a PALAVRA gigante (palavraDoLetreiro), sem
 *      pessoa e com o palco vazio, e a conferência lê essa camada SOZINHA,
 *      antes de colar qualquer coisa: a palavra tem de estar lá, igual, e nada
 *      além dela; gente desenhada reprova (permitirPessoas falso);
 *   2  a IA não acertou a palavra nas tentativas: a RESERVA no mesmo estilo
 *      pede o fundo sem texto nenhum e a palavra entra em código, na mesma faixa;
 *   3  a pessoa é o RECORTE REAL (p.recorteDaPessoa), colado em código com a
 *      cabeça na frente da palavra, e a frase exata entra em código
 *      (recorte-com-letreiro.tsx).
 *
 * Nem a reserva passou: lança, e quem chama tenta de novo no MESMO estilo e,
 * sem sair, para a peça com "Tentar de novo".
 */
export async function pecaDoRecorte(
  p: PecaPelaIa,
  o: { texto: string; tipo: TipoDaArte; lamina?: number; pagina?: { i: number; total: number } | null; redes: string[]; contentType: string; ajuste?: string | null },
  inj: InjecoesDaArte
): Promise<Record<string, string>> {
  const estilo = promptDeEstiloDoModelo(p.modelo)!;
  const { produzirArtePorRede } = await import("@/lib/media/arte-por-rede");
  const { ORDEM_PRINCIPAL, ORDEM_ALTERNATIVA, gerarInfografico } = await import("@/lib/media/infografico-pelo-modelo");
  const { comporRecorteComLetreiro } = await import("./recorte-com-letreiro");
  const ctx: ContextoMidia = { projectId: p.projectId, runId: p.runId ?? undefined, operation: OPERACAO_DA_ARTE_PELA_IA };
  const cores = await coresDaPeca(p.marca);
  const palavra = palavraDoLetreiro(o.texto) || null;
  const recorte = p.recorteDaPessoa ? bytesDoDataUri(p.recorteDaPessoa) : null;
  if (!recorte) console.warn(`[recorte][${p.projectId}] sem o recorte da pessoa: a peça sai com o fundo, a palavra e a frase, sem pessoa (nunca uma pessoa desenhada)`);
  const base = {
    estilo,
    frase: o.texto,
    tipo: o.tipo,
    cores,
    composicao: composicaoDaPeca(estilo, { dia: p.dia, lamina: o.lamina }),
    contexto: p.textoDoPost,
    nicho: p.nicho,
    trecho: trechoDaPeca(p, o.texto),
    pagina: o.pagina ?? null,
    ajuste: o.ajuste ?? null,
  };
  // O layout por proporção vai junto do pedido: a mesma geometria em que o código cola a pessoa.
  const comLayout = (ordem: typeof ORDEM_PRINCIPAL, comPalavra: boolean) => async (prompt: string, proporcao: ProporcaoPedida) =>
    (await gerarInfografico(`${prompt}\n\n${layoutDoFundoDoRecorte(proporcao, comPalavra)}`, proporcao, ctx, ordem, inj.gerar)).dataUrl;
  const fundo = async (comPalavra: boolean) =>
    produzirArtePorRede({
      redes: o.redes,
      contentType: o.contentType,
      promptBase: promptDoFundoDoRecorte({ ...base, palavra: comPalavra ? palavra : null }),
      // A camada da IA é conferida SOZINHA: só a palavra (ou nada), e gente nenhuma.
      textoEsperado: comPalavra && palavra ? [palavra] : [],
      textoDesenhadoPeloModelo: Boolean(comPalavra && palavra),
      usarOlho: true,
      permitirPessoas: false,
      textoDoPost: p.textoDoPost ?? undefined,
      desenhar: comLayout(ORDEM_PRINCIPAL, comPalavra),
      desenharAlternativo: comLayout(ORDEM_ALTERNATIVA, comPalavra),
      projectId: p.projectId,
      runId: p.runId ?? undefined,
      ...(inj.conferir ? { conferir: inj.conferir } : {}),
    });
  let camada = palavra ? await fundo(true) : null;
  let palavraEmCodigo: string | null = null;
  if (!camada || camada.algumaReprovada) {
    if (camada) console.warn(`[recorte][${p.projectId}] a palavra "${palavra}" pela IA não passou (${camada.avisos.filter((a) => /problema/.test(a)).join(" | ").slice(0, 300)}); o fundo sai sem texto e a palavra entra em código, no mesmo estilo`);
    camada = await fundo(false);
    if (camada.algumaReprovada) throw new Error(`o fundo do Recorte não passou na conferência: ${camada.avisos.filter((a) => /problema/.test(a)).join(" | ").slice(0, 300)}`);
    palavraEmCodigo = palavra;
  }
  const porRede: Record<string, string> = {};
  for (const [rede, uri] of Object.entries(camada.porRede)) {
    const jpeg = await comporRecorteComLetreiro({ fundo: bytesDoDataUri(uri), recorte, frase: o.texto, palavraEmCodigo, cores });
    porRede[rede] = `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  }
  return porRede;
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
  /** O recorte real da pessoa (data URI PNG com alfa), colado em código no estilo que põe a pessoa. */
  recorteDaPessoa?: string | null;
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
    { projectId: o.projectId, modelo: o.modelo, mediaType: "image", redes, frase: o.frase, textoDoPost: o.contexto ?? null, nicho: o.nicho ?? null, marca, fala: o.fala ?? null, trecho: o.trecho ?? null, recorteDaPessoa: o.recorteDaPessoa ?? null },
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
 * O conteúdo do infográfico só com número que tem lastro de arte
 * (lib/media/lastro-do-video.ts, infograficoSoComAFala): a fala, o material, ou
 * a pesquisa com fonte que o post guardou. O número de pesquisa que fica leva o
 * rodapé da fonte. Quando nem o título se salva, lança: quem chama tenta de
 * novo no mesmo estilo e, sem sair, para a peça como falha técnica. Nunca
 * desenha número inventado.
 */
export function infograficoDaFala(c: ConteudoDoInfografico, lastro: LastroDaArte): ConteudoDoInfografico {
  const r = infograficoSoComAFala(c, lastro);
  if (r.tirados.length) console.warn(`[vera][lastro] número sem lastro tirado do infográfico: ${r.tirados.join("; ")}`);
  if (r.refazer) throw new Error(`o título do infográfico tem número sem lastro (${c.title}); a extração precisa sair de novo`);
  return r.conteudo;
}

/**
 * A reprovação do infográfico que não pode ir ao ar (11/10): gente desenhada
 * ou texto além do pedido, depois das tentativas. Margem e detalhe seguem com
 * o aviso, como sempre. Devolve o motivo ou null. Puro.
 */
export function infograficoReprovadoGrave(arte: { algumaReprovada: boolean; avisos: string[] }): string | null {
  if (!arte.algumaReprovada) return null;
  const finais = arte.avisos.filter((a) => /continua com problema/.test(a));
  const grave = finais.filter((a) => /tem pessoa|al[eé]m do permitido/i.test(a));
  return grave.length ? grave.join(" | ").slice(0, 300) : null;
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
    // TODO NÚMERO DESENHADO SAI DA FALA (11/10): a última trava antes de pagar a
    // imagem, em todo caminho (semana, refazer, Tentar de novo). Sem a fala à mão,
    // vale a trava da semana (pecas-da-semana.ts), que já gravou o conteúdo limpo.
    const conteudo = p.fala ? infograficoDaFala(p.infografico, lastroComAsFontesDoPost({ transcricao: p.fala, material: [p.nicho], fontes: p.fontesDosNumeros })) : p.infografico;
    const arte = await produzirArtePorRede({
      redes: p.redes,
      textoDoPost: p.textoDoPost ?? undefined,
      projectId: p.projectId,
      runId: p.runId ?? undefined,
      ...(inj.conferir ? { conferir: inj.conferir } : {}),
      // O estilo escolhido DESENHA o infográfico (11/10): a linguagem dele, não só a atmosfera.
      ...pedidoDoInfografico(conteudo, { estilo: estiloComoLinguagem(estilo), linguagem: linguagemDoInfografico(estilo), paleta: "", marca: p.marca }, { nicho: p.nicho, ctx: { projectId: p.projectId, runId: p.runId ?? undefined, operation: "infografico" }, gerar: inj.gerar }),
    });
    // REPROVADO NÃO SAI (11/10): os infográficos do Recorte saíram com um padre
    // e um homem de óculos depois das três tentativas reprovadas, porque aqui
    // a reprovação não parava a peça. Gente desenhada e texto inventado lançam:
    // quem chama tenta de novo no mesmo estilo e, sem sair, para com "Tentar de novo".
    const grave = infograficoReprovadoGrave(arte);
    if (grave) throw new Error(`o infográfico não passou na conferência: ${grave}`);
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
