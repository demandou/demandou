import { put } from "@vercel/blob";
import { prisma } from "@/lib/db/prisma";
import { askClaude } from "@/lib/claude";
import { lerMidia, midiaProduzida } from "@/lib/media/storage";
import { comporCapa, type Expressao } from "@/lib/media/capa-e-titulo";
import { acentuarFrases } from "@/lib/media/acentuacao";
import {
  CLIMAS_DE_CAPA_ROTULO,
  estiloDeCapaValido,
  type CapasDoCompleto,
  type ClimaDaCapa,
  type EstiloDeCapa,
  type OpcaoDeCapa,
} from "@/lib/media/estilos-de-capa";
import { dataUrlToBuffer } from "@/lib/media/nano-banana";
import { setYouTubeThumbnail } from "@/lib/oauth/youtube";
import { normalizarCapaParaYouTube } from "@/lib/media/capa-youtube";
import { resolveSocialAccountAccessToken } from "@/lib/publish/oauth-post";
import type { Radar } from "@/lib/media/radar-do-video";
import { projetoVisivel } from "@/lib/equipe/conta";
import { caminhoDaCapa } from "@/lib/media/capa-pelo-modelo";
import { fotoDaCapa, pedirCapaDoCompletoNoModelo, regraDaCapaPeloModelo } from "@/lib/media/capa-pelo-modelo-servidor";
import { ehEstiloSobMedida } from "@/lib/media/editor-do-curso/arte-pela-ia";

/**
 * A capa (thumbnail) do vídeo COMPLETO no YouTube.
 *
 * Nasceu em 02/09, do primeiro vídeo que o Bruno publicou de verdade: "o
 * vídeo subiu para o YouTube sem capa". Lendo os dados: nada compunha uma
 * capa 16:9 para o completo (só os cortes tinham capa, em 9:16) e nada
 * chamava thumbnails/set no YouTube. O quadro-fonte (`capaFonteUrl`) existia,
 * servia de pôster no Gestor e parava aí.
 *
 * Regras dele para o conserto: "precisa dar pelo menos 2 opções para o
 * usuário, e o usuário precisa ter a opção de escolher o estilo da capa".
 * Então:
 *
 * - O estilo é do PROJETO (`Project.capaEstilo`), como o estilo de edição:
 *   canal com capa diferente a cada vídeo não constrói identidade. Escolher
 *   um estilo no card do vídeo grava no projeto e refaz as opções.
 * - Cada geração produz DUAS opções no estilo escolhido, com frases
 *   diferentes, e o cliente marca uma. A marcada vai para o YouTube na
 *   publicação; se o vídeo já foi publicado, vai na hora.
 * - Tudo fica em `VideoJob.capas`: { estilo, opcoes, escolhida, geradaEm }.
 *
 * A imagem que sobe é normalizada para JPEG 1280x720: o YouTube recusa capa
 * acima de 2 MB, e o modelo de imagem devolve PNG de tamanho variável.
 */

export { climaDeCapaValido, estiloDeCapaValido } from "@/lib/media/estilos-de-capa";
export type { CapasDoCompleto, ClimaDaCapa, OpcaoDeCapa } from "@/lib/media/estilos-de-capa";

const SISTEMA_DAS_FRASES = `Você escreve a frase que vai ESCRITA na capa (thumbnail) de um vídeo completo de YouTube.

Recebe o título do vídeo, o que a pessoa defende nele e o nicho. Devolva DUAS opções bem diferentes entre si, para o dono do vídeo escolher: uma mais afirmativa, outra mais provocativa ou em pergunta.

Cada opção tem:
- "frase": no máximo 6 PALAVRAS, para ler de relance num celular pequeno. Frase de impacto, não resumo. Prefira contraste ("Consultoria não escala") a descrição ("Sobre modelos de negócio"). Não repita o título ao pé da letra.
- "expressao": a emoção do rosto na capa, um destes valores exatos: "confiante" (afirma o que sabe, sorrindo), "alegre" (boa notícia, convite, conteúdo leve), "curioso" (levanta pergunta), "surpreso" (algo contraintuitivo), "provocativo" (opinião que desafia o senso comum), "serio" (nomeia erro, perda ou verdade dura), "preocupado" (alerta de risco). Varie: as duas opções NÃO podem ter a mesma expressão, e "serio" e "preocupado" só entram quando o conteúdo é de fato pesado. Capa com sorriso rende mais em canal pessoal; na dúvida, "confiante" ou "alegre".

Regras:
- Português do Brasil com acentuação completa, mesmo em caixa alta: "Sua IA ainda é estagiária", nunca "Sua IA ainda e estagiaria". Nunca use travessão.
- Nunca invente fato, número ou nome que não esteja no material.
- Nada de emoji, nada de aspas dentro da frase.

Responda SOMENTE com JSON válido, sem cercas de código, sem quebra de linha dentro de string:
{"opcoes":[{"frase":"...","expressao":"confiante"},{"frase":"...","expressao":"curioso"}]}`;

const EXPRESSOES: Expressao[] = [
  "confiante",
  "serio",
  "curioso",
  "surpreso",
  "preocupado",
  "alegre",
  "misterioso",
  "dramatico",
  "divertido",
  "provocativo",
];

/**
 * Quando o cliente escolhe o clima, a expressão do rosto é a do clima, e o
 * agente só escreve as frases. "automatico" deixa o agente escolher pelo
 * conteúdo, como sempre foi.
 */
const EXPRESSAO_DO_CLIMA: Record<Exclude<ClimaDaCapa, "automatico">, Expressao> = {
  alegre: "alegre",
  confiante: "confiante",
  serio: "serio",
  curioso: "curioso",
  surpreso: "surpreso",
  misterioso: "misterioso",
  dramatico: "dramatico",
  divertido: "divertido",
  provocativo: "provocativo",
};

type Frase = { frase: string; expressao: Expressao };

async function escreverFrasesDaCapa(
  material: { titulo: string; resumo: string; teses: string[]; nicho?: string | null },
  projectId: string,
  clima: ClimaDaCapa
): Promise<Frase[]> {
  const fixa = clima === "automatico" ? null : EXPRESSAO_DO_CLIMA[clima];
  const resposta = await askClaude(
    SISTEMA_DAS_FRASES,
    `${material.nicho ? `Nicho: ${material.nicho}\n\n` : ""}${
      fixa
        ? `Clima escolhido pelo dono do vídeo: ${CLIMAS_DE_CAPA_ROTULO[clima].rotulo} (${CLIMAS_DE_CAPA_ROTULO[clima].descricao}). As duas frases precisam combinar com esse clima. Ignore o campo "expressao": preencha com "${fixa}" nas duas.\n\n`
        : ""
    }Título do vídeo: ${material.titulo}
${material.resumo ? `\nO que a pessoa defende: ${material.resumo}\n` : ""}
Teses ditas no vídeo:
${material.teses.map((t) => `- ${t}`).join("\n") || "(sem teses registradas)"}`,
    { maxTokens: 4000, usage: { operation: "video_capa_texto", projectId } }
  );
  const limpo = resposta.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  const dados = JSON.parse(limpo) as { opcoes?: Array<{ frase?: string; expressao?: string }> };
  const frases = (dados.opcoes ?? [])
    .filter((o) => typeof o.frase === "string" && o.frase.trim())
    .map((o) => ({
      frase: o.frase!.trim().replace(/["“”]/g, "").slice(0, 60),
      expressao:
        fixa ?? (EXPRESSOES.includes(o.expressao as Expressao) ? (o.expressao as Expressao) : "confiante"),
    }))
    .slice(0, 2);
  // Duas opções é a promessa ao cliente. Se o modelo devolveu uma só, a
  // segunda sai do título, que é o texto mais seguro que existe sobre o vídeo.
  while (frases.length < 2) {
    frases.push({
      frase: material.titulo.split(/\s+/).slice(0, 6).join(" "),
      expressao: fixa ?? (frases.length === 0 ? "confiante" : "curioso"),
    });
  }
  // A frase sem acento ("SUA IA AINDA E ESTAGIARIA", 30/09): o modelo às vezes
  // larga o acento em frase curta de miniatura. Ver lib/media/acentuacao.ts.
  const acentuadas = await acentuarFrases(frases.map((f) => f.frase), { projectId });
  return frases.map((f, i) => ({ ...f, frase: acentuadas[i] ?? f.frase }));
}

/** A cor principal da paleta do projeto ("#F97316,#1e1f22" vira "#F97316"). */
function corPrincipal(paleta: string | null | undefined): string | null {
  const primeira = paleta?.split(",")[0]?.trim();
  return primeira && /^#[0-9a-f]{3,8}$/i.test(primeira) ? primeira : null;
}

/**
 * Gera (ou regenera) as duas opções de capa do completo, no estilo do
 * projeto ou no estilo passado. Guarda em `VideoJob.capas`, aponta o pôster
 * do card do Vitor para a primeira e deixa a escolhida no post do YouTube.
 *
 * Idempotente por chamada: quem chama duas vezes ganha opções novas (é o
 * "gerar outras 2" da tela). O piloto da esteira só dispara quando `capas`
 * está vazio, então não há geração repetida sem o cliente pedir.
 */
export async function gerarCapasDoCompleto(
  videoJobId: string,
  opcoes: {
    estilo?: EstiloDeCapa;
    clima?: ClimaDaCapa;
    userId?: string;
    /** O template do modelo já falhou (callback ou vigia): a segunda tentativa, no MESMO estilo, pela IA. */
    segundaTentativa?: boolean;
  } = {}
): Promise<CapasDoCompleto> {
  const video = await prisma.videoJob.findFirst({
    where: { id: videoJobId, ...(opcoes.userId ? { project: projetoVisivel(opcoes.userId) } : {}) },
    select: {
      id: true,
      projectId: true,
      capaFonteUrl: true,
      completoUrl: true,
      capas: true,
      radar: true,
      originalName: true,
      transcript: true,
      project: { select: { niche: true, colorPalette: true, capaEstilo: true, name: true } },
    },
  });
  if (!video) throw new Error("Vídeo não encontrado.");
  // O quadro-fonte deixou de ser obrigatório (11/10): a foto da capa é o quadro
  // NÍTIDO pedido ao worker, ou a da Biblioteca, ou nenhuma.

  const estilo: EstiloDeCapa = opcoes.estilo ?? (estiloDeCapaValido(video.project.capaEstilo) ? video.project.capaEstilo : "impacto");
  if (opcoes.estilo && opcoes.estilo !== video.project.capaEstilo) {
    // O estilo é do projeto: escolher aqui vale para os próximos vídeos.
    await prisma.project.update({ where: { id: video.projectId }, data: { capaEstilo: opcoes.estilo } });
  }

  // O clima é do vídeo, não do projeto: depende do que foi dito. Sem pedido,
  // repete o das capas anteriores deste vídeo ("Gerar outras 2" mantém).
  const clima: ClimaDaCapa =
    opcoes.clima ?? ((video.capas as CapasDoCompleto | null)?.clima ?? "automatico");

  const post = await prisma.post.findFirst({
    where: {
      projectId: video.projectId,
      platform: "youtube",
      AND: [
        { metadata: { path: ["videoJobId"], equals: video.id } },
        { metadata: { path: ["gravacaoCompleta"], equals: true } },
      ],
    },
    select: { id: true, content: true, metadata: true },
  });
  const radar = video.radar as Radar | null;
  const titulo =
    post?.content.split("\n")[0]?.trim() ||
    radar?.tema ||
    (video.originalName ?? "Vídeo").replace(/\.[^.]+$/, "");

  const anteriores = video.capas as CapasDoCompleto | null;

  // O ESTILO ESCOLHIDO MANDA NA CAPA (11/10). Com modelo do curso, a capa sai
  // pelo template do modelo, como as artes; um pedido por vez: enquanto o lote
  // está no worker, pedir de novo (a tela, o piloto) devolve o que já está a
  // caminho. Com a edição sob medida, pela IA no estilo da opção. O caminho de
  // hoje (lá embaixo) é só do projeto SEM estilo escolhido: nunca a reserva.
  const regra = await regraDaCapaPeloModelo(video.projectId);
  const pelaIa = Boolean(regra && (ehEstiloSobMedida(regra.modelo) || opcoes.segundaTentativa));
  const caminho = caminhoDaCapa({ temRegra: Boolean(regra), pelaIa, pendente: anteriores?.noModelo ?? null });
  if (caminho === "esperando") return anteriores!;

  const material = {
    titulo,
    resumo: radar?.resumo ?? "",
    teses: (radar?.teses ?? []).map((t) => t.frase).slice(0, 6),
    nicho: video.project.niche,
  };
  if (regra && caminho !== "hoje") {
    // Na segunda tentativa, as mesmas frases que foram ao template (o cliente não vê frase trocada).
    const pedidas = opcoes.segundaTentativa ? anteriores?.noModelo?.frases : null;
    const frasesDoEstilo: Frase[] = pedidas?.length ? pedidas.map((f) => ({ frase: f.frase, expressao: f.expressao as Expressao })) : await escreverFrasesDaCapa(material, video.projectId, clima);
    // A primeira tentativa de um modelo do curso: o template no worker.
    let tentativas = opcoes.segundaTentativa ? 1 : 2;
    if (caminho === "modelo") {
      const noModelo = await pedirCapaDoCompletoNoModelo({ videoJobId: video.id, projectId: video.projectId, modelo: regra.modelo, frases: frasesDoEstilo }).catch((e) => {
        console.error(`[capas-do-completo][${video.id}] o pedido ao template do ${regra.modelo} falhou; segunda tentativa no mesmo estilo pela IA:`, e);
        return null;
      });
      if (noModelo) {
        // As opções de antes ficam na tela até as novas chegarem pelo callback.
        const capas: CapasDoCompleto = {
          estilo,
          clima,
          opcoes: anteriores?.opcoes ?? [],
          escolhida: anteriores?.escolhida ?? 0,
          geradaEm: anteriores?.geradaEm ?? new Date().toISOString(),
          noModelo,
          falha: null,
        };
        await prisma.videoJob.update({ where: { id: video.id }, data: { capas: capas as never } });
        return capas;
      }
      // O template recusou: foi a primeira tentativa; a segunda é no mesmo estilo, pela IA.
      tentativas = 1;
    }
    return capasNoEstiloPelaIa({ video, regra: regra.modelo, frases: frasesDoEstilo, titulo, resumo: material.resumo, estilo, clima, anteriores, post, tentativas });
  }

  // O CAMINHO DE HOJE (projeto sem estilo escolhido), com a regra do quadro nítido.
  const [frases, foto] = await Promise.all([
    escreverFrasesDaCapa(material, video.projectId, clima),
    fotoDaCapa(video.id, video.projectId, { largura: 1280, altura: 720 }),
  ]);
  const quadro = foto.url ? await lerMidia(foto.url) : null;
  const quadroBase64 = quadro ? quadro.toString("base64") : "";

  // As duas composições em paralelo: cada uma leva de 30 s a 1 min no Pro.
  const artes = await Promise.all(
    frases.map((f) =>
      comporCapa(quadroBase64, f.frase, {
        expressao: f.expressao,
        nicho: video.project.niche,
        formato: "16:9",
        estilo,
        clima: clima === "automatico" ? undefined : clima,
        corDaMarca: corPrincipal(video.project.colorPalette),
        usageCtx: { projectId: video.projectId },
        // A pessoa do quadro NÍTIDO (já recortada pelo worker) ou da Biblioteca;
        // sem foto boa, a capa sai só com a frase. O rosto não passa por modelo nenhum.
        quadroUrl: quadro ? foto.url : null,
        recorteUrl: quadro ? foto.recorteUrl : null,
        chaveDoRecorte: `cortes/${video.id}/recorte-fonte.png`,
      })
    )
  );

  const prontas: OpcaoDeCapa[] = [];
  for (let i = 0; i < frases.length; i++) {
    const arte = artes[i];
    if (!arte) continue;
    const jpeg = await normalizarCapaParaYouTube(dataUrlToBuffer(arte));
    const { url } = await put(`cortes/${video.id}/capa-completo-${i}.jpg`, jpeg, {
      ...midiaProduzida(),
      contentType: "image/jpeg",
      addRandomSuffix: true,
    });
    prontas.push({ url, frase: frases[i].frase, expressao: frases[i].expressao });
  }
  if (prontas.length === 0) {
    throw new Error("Nenhuma capa saiu desta vez. Tente de novo em instantes.");
  }

  // A foto da biblioteca que o cliente já tinha posto entre as opções fica
  // (05/10): "Gerar outras 2" e a geração automática trocam as composições,
  // não a escolha dele. Se a escolhida era uma foto da biblioteca, ela segue
  // escolhida e as geradas entram só como opções.
  const daBiblioteca = (anteriores?.opcoes ?? []).filter((o) => o.materialId);
  const fotoEscolhida = anteriores?.opcoes[anteriores.escolhida]?.materialId;
  const opcoesNovas = [...prontas, ...daBiblioteca];
  const escolhida = fotoEscolhida ? Math.max(0, opcoesNovas.findIndex((o) => o.materialId === fotoEscolhida)) : 0;
  const capas: CapasDoCompleto = {
    estilo,
    clima,
    opcoes: opcoesNovas,
    escolhida,
    geradaEm: new Date().toISOString(),
    // O pedido ao modelo de quando o projeto tinha estilo fica fechado, com o motivo.
    ...(anteriores?.noModelo ? { noModelo: { ...anteriores.noModelo, pendente: false } } : {}),
  };
  await prisma.videoJob.update({ where: { id: video.id }, data: { capas: capas as never } });
  // A escolha da foto já está no card, no post e no YouTube: não reaponta.
  if (!fotoEscolhida) await apontarCapaEscolhida(video.id, video.projectId, post, capas.opcoes[0].url);
  return capas;
}

/**
 * AS CAPAS DO COMPLETO PELA IA NO ESTILO ESCOLHIDO (11/10): a opção sob medida
 * (duas tentativas por capa) ou a segunda tentativa de um modelo do curso cujo
 * template não entregou. As que saem viram as opções; nenhuma saiu, a capa fica
 * como falha técnica com "Tentar de novo" (as opções de antes continuam na
 * tela) e nada é cobrado. Nunca a composição de antes nem o modelo de reserva.
 */
async function capasNoEstiloPelaIa(o: {
  video: { id: string; projectId: string; transcript: unknown; project: { niche: string | null } };
  regra: string;
  frases: Frase[];
  titulo: string;
  resumo: string;
  estilo: EstiloDeCapa;
  clima: ClimaDaCapa;
  anteriores: CapasDoCompleto | null;
  post: { id: string; metadata: unknown } | null;
  tentativas: number;
}): Promise<CapasDoCompleto> {
  const { video, anteriores } = o;
  const { capasDoCompletoPelaIa, falaDaTranscricao, recorteDaPessoaParaOEstilo } = await import("@/lib/media/capa-pela-ia");
  const { falhaDaCapa } = await import("@/lib/media/capa-pelo-modelo");
  const { promptDeEstiloDoModelo } = await import("@/lib/media/editor-do-curso/arte-pela-ia");
  // A pessoa só no estilo que a pede (o recorte): o quadro NÍTIDO da gravação, ou a da Biblioteca.
  const foto = promptDeEstiloDoModelo(o.regra)?.pessoa ? await fotoDaCapa(video.id, video.projectId, { largura: 1280, altura: 720 }).catch(() => null) : null;
  const r = await capasDoCompletoPelaIa({
    projectId: video.projectId,
    videoJobId: video.id,
    modelo: o.regra,
    frases: o.frases,
    nicho: video.project.niche,
    contexto: [o.titulo, o.resumo].filter(Boolean).join(". "),
    fala: falaDaTranscricao(video.transcript).texto,
    // A pessoa é o recorte real do quadro nítido, colado em código; nunca vai à IA de imagem (11/10).
    recorteDaPessoa: await recorteDaPessoaParaOEstilo(o.regra, { quadroUrl: foto?.url ?? null, recorteUrl: foto?.recorteUrl ?? null, chave: `cortes/${video.id}/recorte-capa-completo.png` }),
    tentativas: o.tentativas,
  });
  // O registro da capa no estilo (o mesmo campo do template): o estilo, sem pendência e sem "reserva".
  const agora = new Date().toISOString();
  const anterior = anteriores?.noModelo?.templateFalhou ?? null;
  const registro: NonNullable<CapasDoCompleto["noModelo"]> = {
    lote: `capa-ia-completo-${video.id}-${Date.now().toString(36)}`,
    pendente: false,
    desde: agora,
    modelo: o.regra,
    foto: foto?.origem ?? "nenhuma",
    frases: o.frases,
    caminho: "ia",
    ...(anterior ? { tentativaAnterior: anterior } : {}),
  };
  const fechado = { noModelo: registro };
  if (!r.opcoes.length) {
    const falha = falhaDaCapa(o.regra, r.erros.join(" | ") || "a capa não saiu");
    console.error(`[capas-do-completo][${video.id}] a capa no estilo ${o.regra} não saiu (${falha.detalhe}); para como falha técnica, sem trocar o estilo`);
    const capas: CapasDoCompleto = {
      estilo: o.estilo,
      clima: o.clima,
      opcoes: anteriores?.opcoes ?? [],
      escolhida: anteriores?.escolhida ?? 0,
      geradaEm: anteriores?.geradaEm ?? new Date().toISOString(),
      ...fechado,
      falha,
    };
    await prisma.videoJob.update({ where: { id: video.id }, data: { capas: capas as never } });
    return capas;
  }
  if (r.erros.length) console.warn(`[capas-do-completo][${video.id}] ${r.erros.length} das capas no estilo ${o.regra} não saiu: ${r.erros.join(" | ").slice(0, 300)}`);
  // A foto da biblioteca que o cliente já tinha posto entre as opções fica, como no caminho de hoje.
  const daBiblioteca = (anteriores?.opcoes ?? []).filter((op) => op.materialId);
  const fotoEscolhida = anteriores?.opcoes[anteriores.escolhida]?.materialId;
  const opcoesNovas = [...r.opcoes, ...daBiblioteca];
  const escolhida = fotoEscolhida ? Math.max(0, opcoesNovas.findIndex((op) => op.materialId === fotoEscolhida)) : 0;
  const capas: CapasDoCompleto = { estilo: o.estilo, clima: o.clima, opcoes: opcoesNovas, escolhida, geradaEm: agora, noModelo: { ...registro, feitoEm: new Date().toISOString() }, falha: null };
  await prisma.videoJob.update({ where: { id: video.id }, data: { capas: capas as never } });
  if (!fotoEscolhida) await apontarCapaEscolhida(video.id, video.projectId, o.post, capas.opcoes[0].url);
  console.log(`[capas-do-completo][${video.id}] ${r.opcoes.length} capa(s) no estilo ${o.regra} pela IA`);
  return capas;
}

/**
 * O cliente marcou uma das opções. Grava a escolha, atualiza o pôster do card
 * e o post do YouTube e, se o vídeo JÁ está no ar, troca a capa lá na hora.
 *
 * Devolve `aviso` quando o YouTube recusou a troca (canal sem verificação por
 * telefone): a escolha fica gravada mesmo assim, e a tela mostra o motivo.
 */
export async function escolherCapaDoCompleto(
  videoJobId: string,
  userId: string,
  indice: number
): Promise<{ capas: CapasDoCompleto; aviso?: string }> {
  const video = await prisma.videoJob.findFirst({
    where: { id: videoJobId, project: projetoVisivel(userId) },
    select: { id: true, projectId: true, capas: true },
  });
  if (!video) throw new Error("Vídeo não encontrado.");
  const capas = video.capas as CapasDoCompleto | null;
  const opcao = capas?.opcoes[indice];
  if (!capas || !opcao) throw new Error("Essa opção de capa não existe.");

  const novas: CapasDoCompleto = { ...capas, escolhida: indice };
  await prisma.videoJob.update({ where: { id: video.id }, data: { capas: novas as never } });

  const post = await prisma.post.findFirst({
    where: {
      projectId: video.projectId,
      platform: "youtube",
      AND: [
        { metadata: { path: ["videoJobId"], equals: video.id } },
        { metadata: { path: ["gravacaoCompleta"], equals: true } },
      ],
    },
    select: { id: true, content: true, metadata: true, status: true, externalId: true },
  });
  await apontarCapaEscolhida(video.id, video.projectId, post, opcao.url);

  let aviso: string | undefined;
  if (post?.status === "published" && post.externalId) {
    try {
      await enviarCapaAoYouTube(video.projectId, post.externalId, opcao.url);
    } catch (e) {
      aviso = e instanceof Error ? e.message : "O YouTube não aceitou a capa agora.";
    }
  }
  return { capas: novas, aviso };
}

/**
 * A CAPA A PARTIR DA BIBLIOTECA DE MATERIAIS (05/10/2026): o cliente escolhe
 * uma foto que ele mesmo subiu, além das duas compostas pelo squad.
 *
 * A foto é a real, sem modelo de imagem nenhum (custo zero): recortada para
 * 16:9 pelo ponto de maior interesse (rosto, produto), em JPEG 1280x720, que
 * é o que o YouTube aceita. Vai para o store público como as outras capas,
 * porque capa é mídia produzida e é pública no YouTube de qualquer forma.
 *
 * Entra como mais uma opção em `capas.opcoes` (com `materialId`) e já sai
 * escolhida, pelo mesmo caminho da escolha comum: card, post e, se o vídeo
 * já está no ar, o YouTube. A mesma foto escolhida de novo não duplica.
 */
export async function usarMaterialComoCapa(
  videoJobId: string,
  userId: string,
  materialId: string
): Promise<{ capas: CapasDoCompleto; aviso?: string }> {
  const video = await prisma.videoJob.findFirst({
    where: { id: videoJobId, project: projetoVisivel(userId) },
    select: { id: true, projectId: true, capas: true, project: { select: { capaEstilo: true } } },
  });
  if (!video) throw new Error("Vídeo não encontrado.");
  const material = await prisma.materialDoCliente.findFirst({
    where: { id: materialId, projectId: video.projectId },
    select: { id: true, tipo: true, url: true, descricao: true },
  });
  if (!material) throw new Error("Essa foto não está na biblioteca deste projeto.");
  if (material.tipo !== "foto") throw new Error("A capa precisa ser uma foto.");

  const atuais = video.capas as CapasDoCompleto | null;
  const ja = atuais?.opcoes.findIndex((o) => o.materialId === material.id) ?? -1;
  if (atuais && ja >= 0) return escolherCapaDoCompleto(video.id, userId, ja);

  const original = await lerMidia(material.url);
  if (!original) throw new Error("Não consegui ler a foto da biblioteca.");
  const { default: sharp } = await import("sharp");
  const jpeg = await sharp(original)
    .rotate()
    .resize(1280, 720, { fit: "cover", position: sharp.strategy.attention })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  const { url } = await put(`cortes/${video.id}/capa-material-${material.id}.jpg`, jpeg, {
    ...midiaProduzida(),
    contentType: "image/jpeg",
    addRandomSuffix: true,
  });

  const nova: OpcaoDeCapa = { url, frase: "Foto da sua biblioteca", expressao: "confiante", materialId: material.id };
  const capas: CapasDoCompleto = atuais
    ? { ...atuais, opcoes: [...atuais.opcoes, nova] }
    : {
        estilo: estiloDeCapaValido(video.project.capaEstilo) ? video.project.capaEstilo : "impacto",
        opcoes: [nova],
        escolhida: 0,
        geradaEm: new Date().toISOString(),
      };
  await prisma.videoJob.update({ where: { id: video.id }, data: { capas: capas as never } });
  await prisma.materialDoCliente
    .update({ where: { id: material.id }, data: { usos: { increment: 1 }, ultimoUsoEm: new Date() } })
    .catch(() => {});
  return escolherCapaDoCompleto(video.id, userId, capas.opcoes.length - 1);
}

/**
 * A capa que chegou pelo modelo do curso (lib/media/capa-pelo-modelo-servidor.ts)
 * vai para o card do completo e para o post do YouTube, como a escolhida.
 */
export async function apontarCapaDoCompleto(videoJobId: string, projectId: string, url: string): Promise<void> {
  const post = await prisma.post.findFirst({
    where: {
      projectId,
      platform: "youtube",
      AND: [
        { metadata: { path: ["videoJobId"], equals: videoJobId } },
        { metadata: { path: ["gravacaoCompleta"], equals: true } },
      ],
    },
    select: { id: true, metadata: true },
  });
  // Como a geração de sempre: aponta no card e no post; o YouTube só troca quando o cliente escolhe.
  await apontarCapaEscolhida(videoJobId, projectId, post, url);
}

/**
 * Deixa a capa escolhida onde a tela e a publicação leem: `metadata.capaUrl`
 * no post do YouTube (a publicação sobe essa) e `metadata.thumb` no card do
 * Vitor (o pôster do player no Gestor).
 */
async function apontarCapaEscolhida(
  videoJobId: string,
  projectId: string,
  post: { id: string; metadata: unknown } | null,
  url: string
): Promise<void> {
  if (post) {
    const meta = (post.metadata as Record<string, unknown> | null) ?? {};
    await prisma.post.update({ where: { id: post.id }, data: { metadata: { ...meta, capaUrl: url } as never } });
  }
  const card = await prisma.campaignCard.findFirst({
    where: {
      projectId,
      cardType: "video_clip",
      AND: [
        { metadata: { path: ["videoJobId"], equals: videoJobId } },
        { metadata: { path: ["completo"], equals: true } },
      ],
    },
    select: { id: true, metadata: true },
  });
  if (card) {
    const meta = (card.metadata as Record<string, unknown> | null) ?? {};
    await prisma.campaignCard.update({
      where: { id: card.id },
      data: { metadata: { ...meta, thumb: url, capaUrl: url } as never },
    });
  }
}

/**
 * Sobe a capa para um vídeo do YouTube usando a conta conectada ao projeto.
 * Lança com mensagem legível; quem chama decide se é aviso ou erro.
 */
export async function enviarCapaAoYouTube(
  projectId: string,
  youtubeVideoId: string,
  capaUrl: string
): Promise<void> {
  const conta = await prisma.socialAccount.findFirst({
    where: { projectId, platform: "youtube" },
  });
  if (!conta) throw new Error("O projeto não tem canal do YouTube conectado.");
  const bytes = await lerMidia(capaUrl);
  if (!bytes) throw new Error("Não consegui ler a capa escolhida.");
  const { accessToken } = await resolveSocialAccountAccessToken(conta);
  await setYouTubeThumbnail(accessToken, youtubeVideoId, {
    bytes: await normalizarCapaParaYouTube(bytes),
    mimeType: "image/jpeg",
  });
}
