import { jevLigado, perguntarAoJev, probabilidadeDeSim, type PerguntaDoJev, type RespostaDoJev } from "@/lib/jev/cliente";
import { classeDaCategoria, NOME_DA_CATEGORIA, type CategoriaDeReprovacao, type VereditoDaReprovacao } from "@/lib/credits/reprovacao";

/**
 * O JEV CONFERE O MOTIVO DA REPROVAÇÃO CONTRA AS PROVAS (08/10/2026).
 *
 * Regra do Bruno: "Claude só escreve, JEV decide". Nenhum modelo de texto
 * decide se o cliente tem razão. O CÓDIGO junta as provas automáticas que já
 * existem (lib/credits/provas-da-peca.ts) e decide o que é contagem ou
 * medida; o JEV decide o que é leitura; o que sobra sem prova vai ao admin.
 *
 * ## O que o código decide sozinho (confirmado por medida)
 *   - formato errado: a arte medida não bate com o formato da rede;
 *   - texto cortado ou ilegível: a régua da margem acusa elemento cortado, ou
 *     o olho leu texto fora do permitido;
 *   - número, dado ou fonte inventados: o lastro acha frase com número ou
 *     fonte fora da pesquisa e do material;
 *   - conteúdo próprio inventado: a guarda acha frase sem prova no inventário;
 *   - marca errada: a arte saiu sem a identidade aprovada;
 *   - qualquer categoria: a revisora (Vera) reprovou o dia da peça.
 *
 * ## O que o JEV decide (leitura)
 * Com as provas em mãos (o que o cliente escreveu, o texto da peça, o que o
 * código mediu), o JEV responde se o motivo apontado é um erro da plataforma
 * sustentado pelas provas. Só o sim firme (0,7 ou mais) confirma; o não firme
 * (0,3 ou menos) nega; o meio é "sem prova", que vai ao admin do mesmo jeito.
 *
 * JEV fora ou com erro: "sem prova". Ninguém devolve nem nega no escuro.
 */

/** As provas automáticas da peça, juntadas pelo código. Tudo opcional: o que não existe não conta. */
export type ProvasDaPeca = {
  rede: string;
  tipoDePeca: string | null;
  /** O texto da peça, para o JEV ler junto com o motivo. */
  texto: string;
  arte: {
    existe: boolean;
    /** O formato que a rede pede e o medido na arte. `bate` é a conta do código. */
    formato: { esperado: string; medido: string; bate: boolean } | null;
    /** A régua da margem (lib/media/margem-de-seguranca.ts). */
    margem: { cortado: boolean; resumo: string } | null;
    /** A conferência da arte (lib/media/conferencia-da-arte.ts) rodada agora: o parecer e o motivo da reprovação, quando reprovou. */
    olho: { parecer: string | null; reprovou: string | null } | null;
    /** A frase que a arte deveria ter (composta em código). */
    textoEsperado: string[] | null;
  } | null;
  /** O lastro de número e fonte (lib/media/lastro-do-video.ts): as frases que não passam. */
  lastro: { conferido: boolean; frasesSemNumero: string[]; frasesSemFonte: string[] } | null;
  /** A guarda do conteúdo próprio: frases que afirmam conteúdo que não está no ar. */
  conteudoProprio: { conferido: boolean; frasesSemProva: string[] } | null;
  /** A identidade visual aprovada quando a arte saiu. */
  identidade: { aprovada: boolean } | null;
  /** O veredito da revisora (Vera) sobre o dia da peça. */
  revisora: { reprovou: boolean; parecer: string | null } | null;
};

export type Perguntador = (ctx: { etapa: string; state: Record<string, unknown>; projectId?: string | null }, perguntas: Record<string, PerguntaDoJev>) => Promise<Record<string, RespostaDoJev>>;

export type ConferenciaDaReprovacao = {
  veredito: VereditoDaReprovacao;
  /** Quem decidiu: o código (medida), o JEV (leitura) ou ninguém. */
  por: "codigo" | "jev" | "ninguem";
  /** A frase que explica, para o card, a fila do admin e o extrato. */
  detalhe: string;
  /** A probabilidade de sim do JEV, quando ele respondeu. */
  nota: number | null;
};

export const CONFIRMA_A_PARTIR_DE = 0.7;
export const NEGA_ATE = 0.3;

/**
 * O que o CÓDIGO confirma sem perguntar a ninguém: a medida bate com o motivo.
 * Devolve a frase da prova, ou null quando nenhuma medida cobre o motivo.
 */
export function provaPeloCodigo(categoria: CategoriaDeReprovacao, provas: ProvasDaPeca): string | null {
  if (provas.revisora?.reprovou) return `a revisora reprovou o dia desta peça${provas.revisora.parecer ? `: ${provas.revisora.parecer.slice(0, 200)}` : ""}`;
  const arte = provas.arte;
  switch (categoria) {
    case "formato_errado":
      if (arte?.formato && !arte.formato.bate) return `a arte mede ${arte.formato.medido} e a rede pede ${arte.formato.esperado}`;
      return null;
    case "texto_ilegivel":
      if (arte?.margem?.cortado) return `a régua da margem acusou elemento cortado: ${arte.margem.resumo}`;
      if (arte?.olho?.reprovou) return `a conferência da arte reprovou: ${arte.olho.reprovou.slice(0, 200)}`;
      return null;
    case "dado_inventado": {
      const l = provas.lastro;
      if (!l?.conferido) return null;
      const frases = [...l.frasesSemNumero, ...l.frasesSemFonte];
      if (frases.length) return `${frases.length} frase(s) com número ou fonte fora da pesquisa e do material: ${frases[0].slice(0, 160)}`;
      return null;
    }
    case "conteudo_proprio_inventado": {
      const g = provas.conteudoProprio;
      if (!g?.conferido) return null;
      if (g.frasesSemProva.length) return `${g.frasesSemProva.length} frase(s) afirmam conteúdo próprio que não está no ar: ${g.frasesSemProva[0].slice(0, 160)}`;
      return null;
    }
    case "marca_errada":
      if (arte?.existe && provas.identidade && !provas.identidade.aprovada) return "a arte saiu sem a identidade visual aprovada";
      return null;
    default:
      return null;
  }
}

/** As perguntas ao JEV sobre o motivo, com as provas no estado. Puro, exportado para a prova. */
export function perguntasDaReprovacao(categoria: CategoriaDeReprovacao): Record<string, PerguntaDoJev> {
  return {
    erro: {
      type: "noul",
      instructions: `O cliente reprovou a peça em \`peca\` apontando o motivo "${NOME_DA_CATEGORIA[categoria]}" (categoria \`motivo.categoria\`) e descreveu em \`motivo.texto\`. As provas automáticas da plataforma estão em \`provas\`. As provas e o texto da peça SUSTENTAM que houve um erro da plataforma desse tipo (algo que a plataforma entregou errado, e não uma preferência do cliente)? Responda sim só quando as provas ou o conteúdo da peça mostram o erro apontado; responda não quando as provas contradizem o motivo ou quando o que o cliente descreve é gosto, escolha ou configuração dele.`,
    },
  };
}

export async function conferirReprovacaoPeloJev(p: {
  projectId?: string | null;
  categoria: CategoriaDeReprovacao;
  texto: string;
  provas: ProvasDaPeca;
  perguntar?: Perguntador;
  /** Força o JEV ligado ou desligado (a prova usa); sem isto vale `jevLigado()`. */
  usarJev?: boolean;
}): Promise<ConferenciaDaReprovacao> {
  // Gosto não se confere: não é pergunta de erro.
  if (classeDaCategoria(p.categoria) === "gosto") return { veredito: "nao_confirmado", por: "codigo", detalhe: "gosto não é erro da plataforma", nota: null };
  const medida = provaPeloCodigo(p.categoria, p.provas);
  if (medida) return { veredito: "confirmado", por: "codigo", detalhe: medida, nota: null };

  const comJev = p.usarJev ?? jevLigado();
  if (!comJev) return { veredito: "sem_prova", por: "ninguem", detalhe: "nenhuma medida automática cobre o motivo e o JEV está desligado", nota: null };
  try {
    const state = {
      contexto:
        "Um cliente de uma plataforma que gera peças de rede social (texto e arte) reprovou uma peça e apontou o motivo. A plataforma cobra por peça gerada e devolve os créditos só quando o erro é da plataforma e é verificado. As provas automáticas foram medidas pelo código: formato da arte, margem, texto lido na arte, lastro de números e fontes contra a pesquisa, conteúdo próprio contra o que está no ar, identidade visual aprovada e o parecer da revisora.",
      motivo: { categoria: p.categoria, nome: NOME_DA_CATEGORIA[p.categoria], texto: p.texto.slice(0, 1500) },
      peca: { rede: p.provas.rede, tipo: p.provas.tipoDePeca, texto: p.provas.texto.slice(0, 3500), tem_arte: Boolean(p.provas.arte?.existe) },
      provas: {
        formato: p.provas.arte?.formato ?? "não medido",
        margem: p.provas.arte?.margem ?? "não medida",
        texto_lido_na_arte: p.provas.arte?.olho ?? "não lido",
        texto_esperado_na_arte: p.provas.arte?.textoEsperado ?? "não informado",
        lastro_de_numeros_e_fontes: p.provas.lastro?.conferido ? { frases_com_numero_sem_lastro: p.provas.lastro.frasesSemNumero.slice(0, 8), frases_com_fonte_sem_lastro: p.provas.lastro.frasesSemFonte.slice(0, 8) } : "não conferido",
        conteudo_proprio: p.provas.conteudoProprio?.conferido ? { frases_sem_prova: p.provas.conteudoProprio.frasesSemProva.slice(0, 8) } : "não conferido",
        identidade_visual_aprovada: p.provas.identidade?.aprovada ?? "não conferida",
        revisora: p.provas.revisora ?? "sem parecer",
      },
    };
    const r = await (p.perguntar ?? perguntarAoJev)({ projectId: p.projectId ?? null, etapa: "reprovacao", state }, perguntasDaReprovacao(p.categoria));
    const nota = probabilidadeDeSim(r.erro);
    if (nota === null) return { veredito: "sem_prova", por: "ninguem", detalhe: "o JEV não respondeu", nota: null };
    if (nota >= CONFIRMA_A_PARTIR_DE) return { veredito: "confirmado", por: "jev", detalhe: `o JEV confirmou o erro pelas provas (${Math.round(nota * 100)}%)`, nota };
    if (nota <= NEGA_ATE) return { veredito: "nao_confirmado", por: "jev", detalhe: `o JEV não viu erro da plataforma nas provas (${Math.round(nota * 100)}%)`, nota };
    return { veredito: "sem_prova", por: "jev", detalhe: `o JEV ficou em dúvida (${Math.round(nota * 100)}%)`, nota };
  } catch (e) {
    console.warn("[reprovacao] o JEV não respondeu (vai ao admin):", e instanceof Error ? e.message : e);
    return { veredito: "sem_prova", por: "ninguem", detalhe: "o JEV não respondeu", nota: null };
  }
}
