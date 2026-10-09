import { put } from "@vercel/blob";
import { dataUrlToBuffer, gerarImagem } from "@/lib/media/nano-banana";
import { midiaProduzida } from "@/lib/media/storage";
import { conferenciaVisualLigada, lerDescricaoDaImagem, olhoDoGemini, type DescricaoDaImagem, type Olho } from "@/lib/media/conferencia-visual";
import { decidirChoice, jevLigado, perguntarAoJev } from "@/lib/jev/cliente";
import { fichaDaPeca, PECAS_DA_PREVIA, TETO_DA_RODADA_USD, type EstiloEscrito, type PecaDaPrevia, type PreviaDaPeca } from "@/lib/estilo-proprio/tipos";

/**
 * AS PRÉVIAS DO MEU ESTILO (08/10/2026): "a própria IA gera uma thumb e
 * aquelas peças (o vertical vai ficar assim etc.), o usuário vê se é mais ou
 * menos aquilo" (Bruno).
 *
 * Quatro imagens por rodada, cada uma na proporção da peça (thumb 16:9, post
 * 4:5, vídeo vertical 9:16, capa do carrossel 4:5), pelo gerador de ARTE da
 * casa (a cascata de lib/media/nano-banana.ts: GPT Image 2 primeiro). A
 * imagem sai SEM texto: o título de exemplo entra em código, na letra e nas
 * cores da marca, na própria tela (texto em camada, regra de 07/10).
 *
 * A CONFERÊNCIA (regra da casa: Gemini só descreve, o JEV decide): as quatro
 * imagens vão numa chamada ao Gemini, que responde o que vê (texto, colagem,
 * pessoa reconhecível, o assunto, o que o estilo proíbe e aparece); o JEV
 * decide por peça se ela segue o estilo, se é refeita UMA vez ou se sai. O
 * que sai não é mostrado. Sem a conferência ligada, as imagens entram como
 * saíram, marcadas "não conferidas".
 *
 * O DINHEIRO: teto de US$ 0,40 por rodada (TETO_DA_RODADA_USD). A refação
 * só roda enquanto cabe no teto. Quem chama já reservou os créditos antes
 * (servidor.ts) e acerta pelo custo real no fim.
 */

export type GeradorDePrevia = (prompt: string, proporcao: "16:9" | "4:5" | "9:16", ctx: { projectId?: string; operation: string }) => Promise<{ jpeg: Buffer; custoUsd: number; modelo: string }>;
export type GuardaDePrevia = (nome: string, jpeg: Buffer) => Promise<string>;
export type Juiz = typeof perguntarAoJev;

export type ServicosDasPrevias = {
  gerar: GeradorDePrevia;
  guardar: GuardaDePrevia;
  olho: Olho | null;
  juiz: Juiz | null;
};

const geradorDeVerdade: GeradorDePrevia = async (prompt, proporcao, ctx) => {
  const img = await gerarImagem(prompt, proporcao, "standard", ctx, { tipo: "arte" });
  return { jpeg: dataUrlToBuffer(img.dataUrl), custoUsd: img.custoUsd, modelo: img.modelo };
};

const guardaDeVerdade: GuardaDePrevia = async (nome, jpeg) => {
  const salvo = await put(nome, jpeg, { ...midiaProduzida(), contentType: "image/jpeg", addRandomSuffix: true });
  return salvo.url;
};

export function servicosDeVerdade(): ServicosDasPrevias {
  return { gerar: geradorDeVerdade, guardar: guardaDeVerdade, olho: conferenciaVisualLigada() ? olhoDoGemini : null, juiz: jevLigado() ? perguntarAoJev : null };
}

const ESQUEMA = {
  type: "OBJECT",
  properties: {
    imagens: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          colagem: { type: "BOOLEAN" },
          paineis: { type: "INTEGER" },
          temTexto: { type: "BOOLEAN" },
          textoLido: { type: "STRING" },
          pessoaReconhecivel: { type: "BOOLEAN" },
          assunto: { type: "STRING" },
          proibidosVistos: { type: "ARRAY", items: { type: "STRING" } },
          defeitos: { type: "STRING" },
          ambiente: { type: "STRING" },
        },
        required: ["colagem", "paineis", "temTexto", "pessoaReconhecivel", "assunto", "proibidosVistos", "ambiente"],
      },
    },
  },
  required: ["imagens"],
};

const SISTEMA_DO_OLHO = `Você descreve imagens, de forma objetiva, para um juiz que vai decidir se elas seguem o estilo visual que um cliente pediu. Você NÃO decide nada: só responde o que vê em cada imagem, na ordem em que chegaram.
Para cada imagem, em português, curto:
- "colagem": true se é colagem, grade, mosaico ou tem vários painéis separados;
- "paineis": quantos quadros distintos há (1 quando é uma cena só);
- "temTexto": true se há qualquer texto, letra, número, placa, logotipo ou legenda;
- "textoLido": o texto que dá para ler (vazio se não há);
- "pessoaReconhecivel": true se há rosto nítido e de frente que identifica alguém, ou figura pública;
- "assunto": o que a imagem mostra, em uma frase concreta;
- "ambiente": o lugar, a luz e as cores dominantes, em uma frase;
- "proibidosVistos": os elementos que o ESTILO DO CLIENTE diz evitar e que aparecem (lista vazia se nenhum);
- "defeitos": deformação, mão quebrada, borda branca, marca d'água (vazio se não há).
Sem travessão.`;

export type DescricaoDaPrevia = DescricaoDaImagem & { ambiente: string };

/** Lê a resposta do olho para as peças, na ordem. Puro. */
export function lerDescricoes(cru: unknown, quantas: number): Array<DescricaoDaPrevia | null> {
  const lista = Array.isArray((cru as { imagens?: unknown })?.imagens) ? ((cru as { imagens: unknown[] }).imagens as unknown[]) : [];
  return Array.from({ length: quantas }, (_, i) => {
    const x = lista[i];
    if (!x || typeof x !== "object") return null;
    return { ...lerDescricaoDaImagem(x), ambiente: String((x as Record<string, unknown>).ambiente ?? "").trim().slice(0, 240) };
  });
}

export type DecisaoDaPrevia = "aprovar" | "refazer" | "tirar";

/** Sem o JEV: o padrão seguro pelos fatos descritos. Puro. */
export function decisaoDeReserva(d: DescricaoDaPrevia | null, jaRefeita: boolean): DecisaoDaPrevia {
  if (!d) return "aprovar";
  const ruim = d.paineis > 1 || d.temTexto || d.pessoaReconhecivel || d.proibidosVistos.length > 0;
  if (!ruim) return "aprovar";
  return jaRefeita ? "tirar" : "refazer";
}

/** O prompt refeito: o que a descrição achou vira ordem no começo. Puro. */
export function promptRefeito(prompt: string, d: DescricaoDaPrevia | null, evitar: string[]): string {
  const ordens: string[] = [];
  if (!d || d.paineis > 1) ordens.push("ONE single scene filling the frame: never a grid, a collage of separate pictures or split panels.");
  if (!d || d.temTexto) ordens.push("Absolutely no text, letters, numbers, signs, logos or captions anywhere.");
  if (!d || d.pessoaReconhecivel) ordens.push("No recognizable face: the person is anonymous, generic, never a public figure.");
  if (d?.proibidosVistos.length) ordens.push(`Do not show: ${d.proibidosVistos.join(", ")}.`);
  if (evitar.length) ordens.push(`Never include: ${evitar.join(", ")}.`);
  return `${ordens.join(" ")} ${prompt}`.trim();
}

async function decidir(
  itens: Array<{ peca: PecaDaPrevia; descricao: DescricaoDaPrevia | null; jaRefeita: boolean }>,
  estilo: EstiloEscrito,
  ctx: { projectId?: string | null; juiz: Juiz | null }
): Promise<Record<PecaDaPrevia, { decisao: DecisaoDaPrevia; porQue: string }>> {
  const saida = {} as Record<PecaDaPrevia, { decisao: DecisaoDaPrevia; porQue: string }>;
  for (const x of itens) saida[x.peca] = { decisao: decisaoDeReserva(x.descricao, x.jaRefeita), porQue: x.descricao ? "padrão seguro pelos fatos descritos" : "sem descrição: a prévia fica" };
  const comDescricao = itens.filter((x) => x.descricao);
  if (!comDescricao.length || !ctx.juiz) return saida;
  try {
    const r = await ctx.juiz(
      {
        projectId: ctx.projectId,
        etapa: "meu-estilo-previa",
        state: { estiloDoCliente: { resumo: estilo.resumo, pontos: estilo.pontos, evitar: estilo.evitar }, regra: "prévia do estilo: uma cena só, sem texto, sem rosto reconhecível, no ambiente, na luz e nas cores que o estilo descreve, sem o que o estilo evita" },
      },
      Object.fromEntries(
        comDescricao.map((x) => [
          x.peca,
          {
            type: "choice" as const,
            instructions: {
              pergunta: x.jaRefeita
                ? "Esta prévia JÁ foi refeita uma vez. Ela mostra o estilo do cliente e pode ser mostrada a ele, ou deve sair?"
                : "Esta prévia mostra o estilo do cliente e pode ser mostrada a ele, deve ser refeita uma vez com o prompt corrigido, ou deve sair?",
              peca: fichaDaPeca(x.peca).rotulo,
              oQueFoiPedido: estilo.previas[x.peca].slice(0, 500),
              descricaoDaImagem: x.descricao,
            },
            criteria: (x.jaRefeita
              ? { aprovar: "uma cena só, sem texto, sem rosto reconhecível, no ambiente e nas cores do estilo, sem o que ele evita", tirar: "ainda é colagem, tem texto, rosto reconhecível, algo que o estilo evita, ou o ambiente e a luz não têm nada a ver com o estilo" }
              : {
                  aprovar: "uma cena só, sem texto, sem rosto reconhecível, no ambiente e nas cores do estilo, sem o que ele evita",
                  refazer: "é colagem ou painéis, tem texto, rosto reconhecível, algo que o estilo evita, ou o ambiente e a luz fogem do estilo, mas um prompt corrigido resolveria",
                  tirar: "a ideia da peça não serve para mostrar este estilo",
                }) as Record<string, string>,
          },
        ])
      )
    );
    for (const x of comDescricao) {
      const resp = r[x.peca];
      if (!resp) continue;
      const opcoes = x.jaRefeita ? (["aprovar", "tirar"] as const) : (["aprovar", "refazer", "tirar"] as const);
      saida[x.peca] = { decisao: decidirChoice(resp, opcoes, saida[x.peca].decisao, 0.4), porQue: `JEV: ${resp.type === "choice" ? `${resp.choice} (${Math.round((resp.confidence ?? 0) * 100)}%)` : "sem escolha"}` };
    }
  } catch {
    // Sem o JEV agora: vale o padrão seguro.
  }
  return saida;
}

export type ResultadoDasPrevias = {
  previas: PreviaDaPeca[];
  tiradas: PecaDaPrevia[];
  custoUsd: number;
  geradas: number;
  avisos: string[];
};

/**
 * Gera, confere e guarda as prévias de uma rodada. Lança só se NENHUMA
 * imagem saiu (aí nada é cobrado); uma peça que falhou vira aviso.
 */
export async function gerarPreviasDoEstilo(
  o: { projectId: string; rodada: number; estilo: EstiloEscrito; pecas?: PecaDaPrevia[] },
  servicos: ServicosDasPrevias = servicosDeVerdade()
): Promise<ResultadoDasPrevias> {
  const pecas = (o.pecas ?? PECAS_DA_PREVIA.map((p) => p.id)).filter((p, i, a) => a.indexOf(p) === i);
  const avisos: string[] = [];
  let custoUsd = 0;
  const ctx = { projectId: o.projectId, operation: "meu-estilo-previa" };
  const nome = (peca: PecaDaPrevia, v: number) => `meu-estilo/${o.projectId}/rodada-${o.rodada}/${peca}-v${v}.jpg`;

  type Geracao = { peca: PecaDaPrevia; jpeg: Buffer; url: string; refeita: boolean };
  const gerarPeca = async (peca: PecaDaPrevia, prompt: string, refeita: boolean): Promise<Geracao | null> => {
    const ficha = fichaDaPeca(peca);
    try {
      const g = await servicos.gerar(prompt, ficha.proporcao, ctx);
      custoUsd += g.custoUsd;
      const url = await servicos.guardar(nome(peca, refeita ? 2 : 1), g.jpeg);
      return { peca, jpeg: g.jpeg, url, refeita };
    } catch (e) {
      avisos.push(`${ficha.rotulo}: ${e instanceof Error ? e.message.slice(0, 120) : String(e)}`);
      return null;
    }
  };

  const primeiras = (await Promise.all(pecas.map((p) => gerarPeca(p, o.estilo.previas[p], false)))).filter((x): x is Geracao => Boolean(x));
  if (!primeiras.length) throw new Error(`nenhuma prévia saiu (${avisos.join("; ") || "sem motivo"})`);
  let geradas = primeiras.length;

  const descrever = async (lista: Geracao[]): Promise<Array<DescricaoDaPrevia | null>> => {
    if (!servicos.olho || !lista.length) return lista.map(() => null);
    try {
      const r = await servicos.olho({
        sistema: SISTEMA_DO_OLHO,
        tarefa: `ESTILO DO CLIENTE: ${o.estilo.resumo}\nO estilo evita: ${o.estilo.evitar.join(", ") || "nada em especial"}.\nDescreva as ${lista.length} imagens, na ordem (${lista.map((x) => fichaDaPeca(x.peca).rotulo).join(", ")}).`,
        imagens: lista.map((x, i) => ({ base64: x.jpeg.toString("base64"), mimeType: "image/jpeg", rotulo: `Imagem ${i + 1}: ${fichaDaPeca(x.peca).rotulo}` })),
        esquema: ESQUEMA,
        resolucao: "padrao",
        projectId: o.projectId,
        operation: "meu-estilo-olhada",
      });
      custoUsd += r.custoUsd;
      return lerDescricoes(r.json, lista.length);
    } catch (e) {
      avisos.push(`a olhada nas prévias falhou (${e instanceof Error ? e.message.slice(0, 100) : String(e)}); entram sem conferir`);
      return lista.map(() => null);
    }
  };

  const conferindo = Boolean(servicos.olho);
  const descricoes = await descrever(primeiras);
  const decisoes = await decidir(primeiras.map((g, i) => ({ peca: g.peca, descricao: descricoes[i], jaRefeita: false })), o.estilo, { projectId: o.projectId, juiz: servicos.juiz });

  const prontas = new Map<PecaDaPrevia, Geracao>();
  const tiradas: PecaDaPrevia[] = [];
  const paraRefazer: Array<{ g: Geracao; d: DescricaoDaPrevia | null }> = [];
  primeiras.forEach((g, i) => {
    const d = decisoes[g.peca].decisao;
    if (d === "aprovar") prontas.set(g.peca, g);
    else if (d === "refazer") paraRefazer.push({ g, d: descricoes[i] });
    else tiradas.push(g.peca);
  });

  // A única refação, só enquanto a rodada cabe no teto.
  if (paraRefazer.length) {
    const cabem = paraRefazer.filter((_, i) => custoUsd + (i + 1) * 0.07 <= TETO_DA_RODADA_USD);
    for (const x of paraRefazer) if (!cabem.includes(x)) avisos.push(`${fichaDaPeca(x.g.peca).rotulo}: reprovada e sem teto para refazer; saiu`);
    const refeitas = (await Promise.all(cabem.map((x) => gerarPeca(x.g.peca, promptRefeito(o.estilo.previas[x.g.peca], x.d, o.estilo.evitar), true)))).filter((g): g is Geracao => Boolean(g));
    geradas += refeitas.length;
    const d2 = await descrever(refeitas);
    const dec2 = await decidir(refeitas.map((g, i) => ({ peca: g.peca, descricao: d2[i], jaRefeita: true })), o.estilo, { projectId: o.projectId, juiz: servicos.juiz });
    for (const g of refeitas) {
      if (dec2[g.peca].decisao === "aprovar") prontas.set(g.peca, g);
      else tiradas.push(g.peca);
    }
    for (const x of paraRefazer) if (!prontas.has(x.g.peca) && !tiradas.includes(x.g.peca)) tiradas.push(x.g.peca);
  }

  const previas: PreviaDaPeca[] = pecas
    .filter((p) => prontas.has(p))
    .map((p) => {
      const g = prontas.get(p)!;
      const f = fichaDaPeca(p);
      return { peca: p, url: g.url, largura: f.largura, altura: f.altura, conferida: conferindo, refeita: g.refeita };
    });
  return { previas, tiradas, custoUsd: +custoUsd.toFixed(4), geradas, avisos };
}
