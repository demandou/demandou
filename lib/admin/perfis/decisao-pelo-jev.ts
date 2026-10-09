import type { PerguntaDoJev, RespostaDoJev } from "@/lib/jev/cliente";
import {
  CATEGORIAS_BASE,
  CRITERIO_DA_PESSOA,
  CRITERIO_DO_NEGOCIO,
  OUTROS,
  TIPOS_DE_NEGOCIO,
  TIPOS_DE_PESSOA,
  candidataACategoria,
  hashDosTextos,
  type Categoria,
  type TextosDoPerfil,
  type TipoDeNegocio,
  type TipoDePessoa,
} from "@/lib/admin/perfis/categorias";

/**
 * A CLASSIFICAÇÃO DO PERFIL PELO JEV (08/10/2026). Sem banco: quem chama
 * passa a função que pergunta (em produção, perguntarAoJev de
 * lib/jev/cliente.ts; na prova, uma de mentira), e grava o resultado.
 *
 * Três escolhas por projeto, num pedido só por lote (o estado leva os textos
 * de até 10 projetos, cada um com o id):
 *  - CATEGORIA: as da casa, mais as novas já aceitas, mais "outros";
 *  - NEGÓCIO: vende para empresas, para pessoas, ou os dois;
 *  - PESSOA: marca pessoal ou marca de empresa.
 * Só vale a escolha confiante (confidence de 0,5 para cima, a régua das
 * etiquetas de 03/10). Categoria em dúvida vai para "outros", com os textos
 * crus à vista do admin; negócio e pessoa em dúvida ficam sem dado.
 *
 * A CATEGORIA NOVA: para o projeto que caiu em "outros", o código tira do
 * próprio nicho do cliente uma candidata curta (categorias.ts) e o JEV decide,
 * num sim ou não, se ela é uma profissão ou setor que não cabe na lista. Sim,
 * a categoria nasce (fonte "jev", com o texto de origem) e vale para os
 * próximos projetos. Nenhum modelo de texto escreve nada aqui.
 *
 * JEV fora do ar ou com erro: o lote fica SEM classificação (e a tela diz).
 * Não existe caminho de reserva por modelo de texto nem por palavra-chave.
 */

export type Perguntador = (
  ctx: { etapa: string; state: Record<string, unknown>; projectId?: string | null },
  perguntas: Record<string, PerguntaDoJev>
) => Promise<Record<string, RespostaDoJev>>;

export type ProjetoParaClassificar = { id: string; textos: TextosDoPerfil };

export type DecisaoDoPerfil = {
  projectId: string;
  categoria: string;
  categoriaNome: string;
  categoriaNova: boolean;
  confianca: number | null;
  negocio: TipoDeNegocio | null;
  negocioConfianca: number | null;
  pessoa: TipoDePessoa | null;
  pessoaConfianca: number | null;
  fonte: "jev";
  textos: TextosDoPerfil;
  hashDosTextos: string;
};

export type CategoriaNova = Categoria & { textoDeOrigem: string; projetoDeOrigem: string };

export type ResultadoDaClassificacao = {
  decisoes: DecisaoDoPerfil[];
  /** As categorias que nasceram nesta rodada (para gravar na lista aberta). */
  novas: CategoriaNova[];
  /** Projetos que ficaram sem decisão porque o JEV falhou no lote deles. */
  semDecisao: string[];
  falhou: boolean;
  perguntas: number;
};

export const ETAPA_DO_JEV = "perfis-categoria";
const CONFIANCA_MINIMA = 0.5;
const PROJETOS_POR_ESTADO = 10;
/** O sim da categoria nova precisa ser firme: categoria errada polui a lista de todo mundo. */
const SIM_DA_CATEGORIA_NOVA = 0.7;

function itemDoEstado(p: ProjetoParaClassificar) {
  return { id: p.id, ...p.textos };
}

function escolha(r: RespostaDoJev | undefined, opcoes: readonly string[]): { valor: string | null; confianca: number | null } {
  if (!r || r.type !== "choice") return { valor: null, confianca: null };
  const confianca = typeof r.confidence === "number" ? r.confidence : 0;
  if (!opcoes.includes(r.choice) || confianca < CONFIANCA_MINIMA) return { valor: null, confianca };
  return { valor: r.choice, confianca };
}

export async function decidirPerfisPeloJev(
  projetos: ProjetoParaClassificar[],
  extras: Categoria[],
  perguntar: Perguntador
): Promise<ResultadoDaClassificacao> {
  const decisoes: DecisaoDoPerfil[] = [];
  const novas: CategoriaNova[] = [];
  const semDecisao: string[] = [];
  let falhou = false;
  let perguntas = 0;
  // A lista cresce dentro da rodada: a categoria nova de um lote vale no próximo.
  const lista: Categoria[] = [...CATEGORIAS_BASE, ...extras.filter((x) => !CATEGORIAS_BASE.some((b) => b.id === x.id))];

  for (let i = 0; i < projetos.length; i += PROJETOS_POR_ESTADO) {
    const lote = projetos.slice(i, i + PROJETOS_POR_ESTADO);
    const criteriosDaCategoria: Record<string, string> = Object.fromEntries([...lista, OUTROS].map((c) => [c.id, `${c.nome}: ${c.descricao}`]));
    const state = {
      contexto:
        "Projetos de clientes de uma plataforma de conteúdo para redes sociais. Cada item de `projetos` tem um id e os textos que o cliente escreveu ou que a análise das redes dele gravou. O público é PARA QUEM o cliente fala, não quem ele é: classifique quem publica.",
      projetos: lote.map(itemDoEstado),
    };
    const perguntasDoLote: Record<string, PerguntaDoJev> = {};
    for (const p of lote) {
      perguntasDoLote[`categoria:${p.id}`] = {
        type: "choice",
        instructions: `No projeto de id "${p.id}": qual categoria de profissão ou setor descreve o cliente que publica?`,
        criteria: { ...criteriosDaCategoria },
      };
      perguntasDoLote[`negocio:${p.id}`] = {
        type: "choice",
        instructions: `No projeto de id "${p.id}": para quem o cliente vende?`,
        criteria: { ...CRITERIO_DO_NEGOCIO },
      };
      perguntasDoLote[`pessoa:${p.id}`] = {
        type: "choice",
        instructions: `No projeto de id "${p.id}": o perfil é de uma pessoa ou de uma empresa?`,
        criteria: { ...CRITERIO_DA_PESSOA },
      };
    }
    let r: Record<string, RespostaDoJev>;
    try {
      perguntas += Object.keys(perguntasDoLote).length;
      r = await perguntar({ etapa: ETAPA_DO_JEV, state }, perguntasDoLote);
    } catch (e) {
      console.error(`[perfis] o JEV falhou no lote, ${lote.length} projeto(s) ficam sem classificação: ${e instanceof Error ? e.message : e}`);
      falhou = true;
      semDecisao.push(...lote.map((p) => p.id));
      continue;
    }

    const idsDaLista = [...lista.map((c) => c.id), OUTROS.id];
    const doLote: DecisaoDoPerfil[] = lote.map((p) => {
      const cat = escolha(r[`categoria:${p.id}`], idsDaLista);
      const neg = escolha(r[`negocio:${p.id}`], TIPOS_DE_NEGOCIO);
      const pes = escolha(r[`pessoa:${p.id}`], TIPOS_DE_PESSOA);
      const categoria = cat.valor ? (lista.find((c) => c.id === cat.valor) ?? OUTROS) : OUTROS;
      return {
        projectId: p.id,
        categoria: categoria.id,
        categoriaNome: categoria.nome,
        categoriaNova: extras.some((x) => x.id === categoria.id) || novas.some((x) => x.id === categoria.id),
        confianca: cat.confianca,
        negocio: neg.valor as TipoDeNegocio | null,
        negocioConfianca: neg.confianca,
        pessoa: pes.valor as TipoDePessoa | null,
        pessoaConfianca: pes.confianca,
        fonte: "jev",
        textos: p.textos,
        hashDosTextos: hashDosTextos(p.textos),
      };
    });

    // A segunda volta: quem caiu em "outros" com uma candidata do próprio texto.
    const candidatas = new Map<string, { nome: string; id: string }>();
    for (const d of doLote) {
      if (d.categoria !== OUTROS.id) continue;
      const c = candidataACategoria(d.textos);
      if (!c || lista.some((x) => x.id === c.id)) continue;
      candidatas.set(d.projectId, c);
    }
    if (candidatas.size) {
      const nomes = lista.map((c) => c.nome).join("; ");
      const segunda: Record<string, PerguntaDoJev> = {};
      for (const [projectId, c] of candidatas) {
        segunda[`nova:${projectId}`] = {
          type: "noul",
          instructions: `No projeto de id "${projectId}": "${c.nome}" é o nome de uma profissão ou de um setor de negócio, genérico o bastante para agrupar outros clientes, que NÃO cabe em nenhuma destas categorias: ${nomes}?`,
        };
      }
      try {
        perguntas += Object.keys(segunda).length;
        const r2 = await perguntar({ etapa: ETAPA_DO_JEV, state }, segunda);
        for (const d of doLote) {
          const c = candidatas.get(d.projectId);
          const resp = r2[`nova:${d.projectId}`];
          if (!c || !resp || resp.type !== "noul" || typeof resp.noul !== "number" || resp.noul < SIM_DA_CATEGORIA_NOVA) continue;
          const ja = lista.find((x) => x.id === c.id);
          const categoria: Categoria = ja ?? { id: c.id, nome: c.nome, descricao: `categoria proposta a partir do texto "${d.textos.nicho ?? d.textos.cadastroSetor ?? c.nome}"` };
          if (!ja) {
            lista.push(categoria);
            novas.push({ ...categoria, textoDeOrigem: d.textos.nicho ?? d.textos.cadastroSetor ?? c.nome, projetoDeOrigem: d.projectId });
          }
          d.categoria = categoria.id;
          d.categoriaNome = categoria.nome;
          d.categoriaNova = true;
          d.confianca = resp.noul;
        }
      } catch (e) {
        // A segunda volta é só a proposta de categoria nova: falhou, os
        // projetos ficam em "outros" (decididos), com os textos à vista.
        console.error(`[perfis] o JEV falhou na categoria nova, fica "outros": ${e instanceof Error ? e.message : e}`);
      }
    }
    decisoes.push(...doLote);
  }
  return { decisoes, novas, semDecisao, falhou, perguntas };
}
