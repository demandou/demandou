/**
 * A REPROVAÇÃO COM MOTIVO E A DEVOLUÇÃO POR ERRO VERIFICADO (decisão do
 * Bruno em 08/10/2026). Módulo PURO: sem banco, sem rede, sem JEV. A tela, a
 * rota, o JEV e o admin leem a MESMA regra daqui.
 *
 * ## A regra
 *
 * Toda peça gerada é cobrada (já era assim). Reprovar passa a exigir um
 * motivo: uma categoria da lista curta mais um texto livre (escrito ou
 * falado). A categoria decide o caminho:
 *
 *   - GOSTO ("não gostei", "pedi ou configurei diferente"): o crédito fica e
 *     refazer cobra. A peça foi entregue; o cliente preferiu outra.
 *   - ERRO DA PLATAFORMA (palavra cortada ou texto ilegível, formato errado,
 *     número ou fonte inventados, conteúdo próprio inventado, marca errada,
 *     outro): o JEV confere o motivo contra as provas automáticas que já
 *     existem (régua da margem, formato medido, texto lido na arte, lastro de
 *     número e fonte, guarda do conteúdo próprio, identidade aprovada).
 *       - erro CONFIRMADO: os créditos da peça voltam na hora, uma vez só, e
 *         refazer é grátis;
 *       - NÃO confirmado: vai para o admin decidir (devolver ou manter), e o
 *         cliente recebe a resposta nos dois casos.
 *
 * Nunca saldo negativo (só crédito entra), nunca devolver duas vezes (refId
 * único no extrato, e a devolução nunca passa do que a campanha cobrou).
 *
 * O que fica gravado por reprovação vira aprendizado: a tabela
 * motivos_de_reprovacao (por projeto), a memória do cliente e o agregado por
 * categoria e por semana no /admin.
 */

export const CATEGORIAS_DE_REPROVACAO = [
  { id: "gosto", nome: "Não gostei", classe: "gosto", dica: "Gosto é trabalho novo: o crédito fica e refazer cobra." },
  { id: "pedi_diferente", nome: "Pedi ou configurei diferente", classe: "gosto", dica: "A peça saiu como estava configurado; mude a configuração e refaça." },
  { id: "texto_ilegivel", nome: "Palavra cortada ou texto ilegível", classe: "erro", dica: "Conferimos a margem e o texto lido na arte." },
  { id: "formato_errado", nome: "Formato ou proporção errada", classe: "erro", dica: "Medimos a arte contra o formato da rede." },
  { id: "dado_inventado", nome: "Número, dado ou fonte inventados ou errados", classe: "erro", dica: "Conferimos cada número e fonte contra a pesquisa e o material." },
  { id: "conteudo_proprio_inventado", nome: "Conteúdo próprio inventado (vídeo ou post que não existe)", classe: "erro", dica: "Conferimos contra o que está de fato no ar nas suas redes." },
  { id: "marca_errada", nome: "Marca errada (cores, letra, logo)", classe: "erro", dica: "Conferimos contra a identidade visual aprovada." },
  { id: "outro", nome: "Outro", classe: "erro", dica: "Descreva o que saiu errado: o admin olha caso a caso." },
] as const;

export type CategoriaDeReprovacao = (typeof CATEGORIAS_DE_REPROVACAO)[number]["id"];
export type ClasseDoMotivo = "gosto" | "erro";

export const NOME_DA_CATEGORIA: Record<CategoriaDeReprovacao, string> = Object.fromEntries(CATEGORIAS_DE_REPROVACAO.map((c) => [c.id, c.nome])) as Record<CategoriaDeReprovacao, string>;

export function categoriaValida(v: unknown): v is CategoriaDeReprovacao {
  return typeof v === "string" && CATEGORIAS_DE_REPROVACAO.some((c) => c.id === v);
}

export function classeDaCategoria(categoria: CategoriaDeReprovacao): ClasseDoMotivo {
  return CATEGORIAS_DE_REPROVACAO.find((c) => c.id === categoria)?.classe ?? "erro";
}

/** Até onde o texto livre vai (a fala de 2 minutos cabe). */
export const TAMANHO_DO_TEXTO = 2000;

/**
 * O MOTIVO É OBRIGATÓRIO: categoria da lista, sempre; texto livre obrigatório
 * em "outro" (sem ele o admin não tem o que ler). Devolve a recusa por extenso.
 */
export function validarMotivo(m: { categoria?: unknown; texto?: unknown }): { ok: true; categoria: CategoriaDeReprovacao; texto: string } | { ok: false; erro: string } {
  if (!categoriaValida(m.categoria)) return { ok: false, erro: "Escolha o motivo da reprovação." };
  const texto = typeof m.texto === "string" ? m.texto.replace(/\s+/g, " ").trim().slice(0, TAMANHO_DO_TEXTO) : "";
  if (m.categoria === "outro" && texto.length < 5) return { ok: false, erro: 'Em "Outro", escreva ou fale o que saiu errado.' };
  return { ok: true, categoria: m.categoria, texto };
}

/** O que o JEV (ou o código) concluiu sobre o motivo apontado. */
export type VereditoDaReprovacao = "confirmado" | "nao_confirmado" | "sem_prova";

/** O que acontece com a peça e com os créditos. */
export type SituacaoDaReprovacao = "mantido" | "devolvido" | "em_analise";

export type DecisaoDaReprovacao = {
  situacao: SituacaoDaReprovacao;
  /** Por que, em uma frase, para o card e para o extrato. */
  motivo: string;
};

/**
 * A decisão, sem banco: gosto mantém; erro confirmado devolve; o resto vai ao
 * admin. "Sem prova" (o JEV fora, ou nenhuma prova automática cobre o motivo)
 * é o mesmo que não confirmado: ninguém devolve no escuro, e ninguém nega no
 * escuro.
 */
export function decidirReprovacao(p: { categoria: CategoriaDeReprovacao; veredito: VereditoDaReprovacao | null }): DecisaoDaReprovacao {
  if (classeDaCategoria(p.categoria) === "gosto") {
    return { situacao: "mantido", motivo: p.categoria === "gosto" ? "a peça foi entregue e você preferiu outra: o crédito fica e refazer cobra" : "a peça saiu como estava pedido ou configurado: o crédito fica e refazer cobra" };
  }
  if (p.veredito === "confirmado") return { situacao: "devolvido", motivo: "erro confirmado pelas provas automáticas: os créditos da peça voltaram e refazer é grátis" };
  return { situacao: "em_analise", motivo: "as provas automáticas não confirmaram o erro: um admin vai olhar e você recebe a resposta" };
}

/**
 * Quanto volta: os créditos da peça (a tabela, a mesma que a tela mostra),
 * nunca mais do que a campanha cobrou de verdade menos o que já voltou dela.
 * Nunca negativo: quem não pagou não recebe.
 */
export function creditosADevolver(p: { custoDaPeca: number; cobradoNaCampanha: number; jaDevolvidoNaCampanha: number }): number {
  const teto = Math.max(0, Math.floor(p.cobradoNaCampanha) - Math.floor(p.jaDevolvidoNaCampanha));
  return Math.max(0, Math.min(Math.floor(p.custoDaPeca), teto));
}

/** A decisão do admin na fila. */
export type DecisaoDoAdmin = "devolver" | "manter";

/** O estado gravado em `post.metadata.reprovacao`: o que o card lê. */
export type EstadoDaReprovacao = {
  /** O id do registro em motivos_de_reprovacao (e a marca da ocorrência na chave do descarte). */
  id: string;
  categoria: CategoriaDeReprovacao;
  texto: string;
  situacao: SituacaoDaReprovacao;
  /** Quantos créditos voltaram (0 quando nada voltou, inclusive no erro confirmado de peça não cobrada). */
  creditos: number;
  veredito: VereditoDaReprovacao | null;
  /** "codigo" | "jev" | "ninguem" | "admin" */
  decididoPor: string | null;
  motivo: string;
  reprovadaEm: string;
  decididaEm: string | null;
  /** O refazer grátis já foi usado (erro confirmado só paga um refazer). */
  refeitaGratisEm?: string | null;
  /**
   * O MOTIVO VEIO DE UM PEDIDO DE AJUSTE no chat do card (09/10), e não de uma
   * reprovação: a peça continua viva e é refeita. Sem isto, é reprovação.
   */
  origem?: "ajuste";
  /**
   * O que o ajuste cobrou e o que já voltou (a parte que não saiu). Quando o
   * admin reconhece o erro depois, o que o ajuste cobrou volta junto, porque
   * erro reconhecido refaz de graça (lib/credits/ajuste.ts).
   */
  ajuste?: { id: string; cobrado: number; devolvido: number } | null;
};

export function lerEstadoDaReprovacao(metadata: unknown): EstadoDaReprovacao | null {
  const r = (metadata as { reprovacao?: unknown } | null)?.reprovacao;
  if (!r || typeof r !== "object") return null;
  const e = r as Partial<EstadoDaReprovacao>;
  if (typeof e.id !== "string" || !categoriaValida(e.categoria) || !e.situacao) return null;
  return e as EstadoDaReprovacao;
}

/**
 * Quanto do ajuste ainda pode voltar quando o admin reconhece o erro: o que ele
 * cobrou menos o que já voltou, e só quando o refazer grátis não foi usado
 * (ajuste grátis não cobrou nada). Nunca negativo.
 */
export function ajusteADevolver(e: EstadoDaReprovacao | null | undefined): number {
  if (!e?.ajuste || e.refeitaGratisEm) return 0;
  return Math.max(0, Math.floor(e.ajuste.cobrado) - Math.floor(e.ajuste.devolvido ?? 0));
}

/**
 * O REFAZER É GRÁTIS SÓ COM ERRO CONFIRMADO OU DECIDIDO PELO ADMIN (08/10),
 * e uma vez só por reprovação: a peça refeita volta a rascunho, e quem
 * reprova a refeita abre outra reprovação, com outro motivo e outra conferência.
 */
export function refazerSemCobrar(e: EstadoDaReprovacao | null | undefined): boolean {
  return Boolean(e && e.situacao === "devolvido" && !e.refeitaGratisEm);
}

/** A frase do card, curta, com a situação. */
export function fraseDaSituacao(e: EstadoDaReprovacao): string {
  if (e.situacao === "em_analise") return `Em análise: ${NOME_DA_CATEGORIA[e.categoria].toLowerCase()}. Um admin vai olhar e você recebe a resposta aqui e no sino.`;
  if (e.situacao === "devolvido") return e.creditos > 0 ? `Créditos devolvidos: ${e.creditos}. Refazer esta peça é grátis.` : "Erro confirmado: refazer esta peça é grátis (a peça não tinha sido cobrada).";
  return `Mantido, motivo: ${e.motivo}.`;
}

/** A chave do descarte do aviso no card: uma por ocorrência (reprovação) e por situação. */
export function chaveDoAvisoDaReprovacao(e: Pick<EstadoDaReprovacao, "id" | "situacao">, postId: string): string {
  return `reprovacao-peca:${postId}:${e.id}:${e.situacao}`;
}

/** A chave da notificação do sino, por ocorrência e por situação (a resposta do admin é outro fato). */
export function chaveDoSinoDaReprovacao(e: Pick<EstadoDaReprovacao, "id" | "situacao">, postId: string): string {
  return `reprovacao:${postId}:${e.id}:${e.situacao}`;
}

/** Uma linha de motivos_de_reprovacao, como a tela e o agregado leem. */
export type MotivoDeReprovacao = {
  id: string;
  postId: string;
  projectId: string;
  userId: string;
  runId: string | null;
  categoria: CategoriaDeReprovacao;
  texto: string;
  vereditoDoJev: VereditoDaReprovacao | null;
  decididoPor: string | null;
  provas: unknown;
  decisaoDoAdmin: DecisaoDoAdmin | null;
  adminId: string | null;
  motivoDoAdmin: string | null;
  situacao: SituacaoDaReprovacao;
  creditosDevolvidos: number;
  custoDaPeca: number;
  reprovadaEm: string;
  decididaEm: string | null;
};

/**
 * O AGREGADO DO ADMIN: por categoria e por semana (a semana termina hoje, como
 * no eixo do painel). Puro: recebe as linhas e devolve as contagens.
 */
export function agregarMotivos(
  linhas: Array<Pick<MotivoDeReprovacao, "categoria" | "situacao" | "creditosDevolvidos" | "reprovadaEm">>,
  o: { semanas: number; agora?: Date; diaLocal?: (d: Date) => string }
): {
  porCategoria: Array<{ categoria: CategoriaDeReprovacao; nome: string; total: number; devolvidos: number; mantidos: number; emAnalise: number; creditos: number }>;
  porSemana: Array<{ rotulo: string; dica: string; gosto: number; erro: number; devolvidos: number }>;
} {
  const agora = o.agora ?? new Date();
  const DIA = 86_400_000;
  const diaLocal = o.diaLocal ?? ((d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }));
  const ddmm = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
  const dias = o.semanas * 7;
  const janela: string[] = [];
  for (let i = dias - 1; i >= 0; i--) janela.push(diaLocal(new Date(agora.getTime() - i * DIA)));
  const indice = new Map(janela.map((d, i) => [d, Math.floor(i / 7)]));
  const porSemana = Array.from({ length: o.semanas }, (_, s) => {
    const doBalde = janela.filter((d) => indice.get(d) === s);
    return { rotulo: ddmm(doBalde[0]), dica: `semana de ${ddmm(doBalde[0])} a ${ddmm(doBalde[doBalde.length - 1])}`, gosto: 0, erro: 0, devolvidos: 0 };
  });
  const porCategoria = CATEGORIAS_DE_REPROVACAO.map((c) => ({ categoria: c.id, nome: c.nome, total: 0, devolvidos: 0, mantidos: 0, emAnalise: 0, creditos: 0 }));
  for (const l of linhas) {
    const c = porCategoria.find((x) => x.categoria === l.categoria);
    if (c) {
      c.total++;
      if (l.situacao === "devolvido") c.devolvidos++;
      else if (l.situacao === "mantido") c.mantidos++;
      else c.emAnalise++;
      c.creditos += l.creditosDevolvidos;
    }
    const s = indice.get(diaLocal(new Date(l.reprovadaEm)));
    if (s === undefined) continue;
    const b = porSemana[s];
    if (classeDaCategoria(l.categoria) === "gosto") b.gosto++;
    else b.erro++;
    if (l.situacao === "devolvido") b.devolvidos++;
  }
  return { porCategoria: porCategoria.filter((c) => c.total > 0).sort((a, b) => b.total - a.total), porSemana };
}
