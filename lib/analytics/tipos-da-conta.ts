/**
 * AS ESTATÍSTICAS DA CONTA (09/10/2026), sem banco: o formato, as janelas, a
 * leitura das respostas da Meta e o estado que a tela desenha. Puro, para o
 * teste em scripts/testes e para o componente de cliente.
 *
 * O pedido do Bruno, com o print do Painel Profissional do @prdonaire (3.759
 * visualizações em 30 dias, 68,8% de seguidores, Reels 61,9%): "pra quem não
 * tinha nada... isso tem que estar na primeira tela da Demandou". Até aqui a
 * Demandou só media POST a post; o número da CONTA (quanto o perfil inteiro foi
 * visto, por quem e em que formato) não existia em lugar nenhum.
 *
 * As regras que moldaram este arquivo:
 *
 * 1. SÓ NÚMERO LIDO DA API, com a fonte e a data. Nenhuma métrica com nome
 *    inventado: os nomes abaixo são os da referência oficial da Meta
 *    (Instagram User Insights e Page Insights), conferidos em 09/10.
 * 2. "SE NÃO SABE, NÃO FALA". Sem leitura, a tela diz POR QUÊ (falta a
 *    permissão, falta reconectar, a Meta ainda não liberou) e não mostra
 *    número nenhum. Campo que não veio é nulo, nunca zero.
 * 3. A META GUARDA 90 DIAS de estatística da conta do Instagram ("User Metrics
 *    data is stored for up to 90 days"). O "antes da Demandou" (os 30 dias
 *    antes de o projeto conectar a conta) é lido UMA vez, enquanto ainda está
 *    na janela, e fica guardado para sempre. Depois de 90 dias não há como.
 */

/* ── As métricas oficiais ─────────────────────────────────────────────── */

/** Instagram, insights da conta (graph.instagram.com/{id}/insights), period=day, metric_type=total_value. */
export const METRICAS_DO_INSTAGRAM = {
  visualizacoes: "views",
  alcance: "reach",
  contasComInteracao: "accounts_engaged",
  interacoes: "total_interactions",
  seguidoresGanhos: "follows_and_unfollows",
} as const;

/** Instagram, insights de cada mídia (graph.instagram.com/{media-id}/insights). */
export const METRICAS_DA_MIDIA = ["views", "reach"] as const;

/** Facebook, insights da página (graph.facebook.com/{page-id}/insights), period=day. */
export const METRICAS_DO_FACEBOOK = { visualizacoes: "page_media_view" } as const;

/** A janela de cada leitura: 30 dias, como o Painel Profissional. */
export const DIAS_DA_JANELA = 30;
/** Quanto a Meta guarda de estatística da conta do Instagram. */
export const RETENCAO_DO_INSTAGRAM_DIAS = 90;
/** Quanto a Meta guarda de estatística de página do Facebook (dois anos). */
export const RETENCAO_DO_FACEBOOK_DIAS = 730;
/** Intervalo entre duas leituras da mesma conta. */
export const INTERVALO_DA_LEITURA_MS = 20 * 3600_000;
/** O tipo do registro em ProjectMemory (uma linha por projeto e conta). */
export const TIPO_DA_MEMORIA = "estatisticas_da_conta";

const DIA_MS = 24 * 3600_000;

/* ── O formato guardado ───────────────────────────────────────────────── */

export type RedeDaConta = "instagram" | "facebook";

/**
 * Um número com a fonte. `fonte` é a chamada exata (endereço e parâmetros,
 * nunca o token), para qualquer um refazer a conta e chegar no mesmo número.
 */
export type NumeroComFonte = { valor: number; fonte: string };

export type Janela = { desde: string; ate: string };

export type JanelaLida = {
  janela: Janela;
  visualizacoes: NumeroComFonte | null;
  alcance: NumeroComFonte | null;
};

export type ConteudoPrincipal = {
  id: string;
  legenda: string;
  /** "reels" | "publicacao" | "carrossel" | "story" | outro valor da Meta em minúsculas */
  tipo: string;
  link: string | null;
  miniatura: string | null;
  publicadoEm: string | null;
  visualizacoes: number | null;
  alcance: number | null;
  fonte: string;
};

export type DivisaoPorSeguimento = { seguidores: number; naoSeguidores: number; desconhecido: number; fonte: string };
export type DivisaoPorTipo = { reels: number; stories: number; publicacoes: number; anuncios: number; outros: number; fonte: string };
export type SeguidoresGanhos = { seguiram: number; deixaram: number; fonte: string };

/** Uma leitura que deu certo (pelo menos as visualizações vieram). */
export type LeituraDaConta = {
  lidoEm: string;
  atual: JanelaLida;
  anterior: JanelaLida | null;
  contasComInteracao: NumeroComFonte | null;
  interacoes: NumeroComFonte | null;
  porSeguimento: DivisaoPorSeguimento | null;
  porTipo: DivisaoPorTipo | null;
  seguidoresGanhos: SeguidoresGanhos | null;
  /** O total de seguidores no momento da leitura (campo followers_count). */
  seguidores: NumeroComFonte | null;
  /** Publicados na janela, pelas visualizações acumuladas de cada um. */
  principais: ConteudoPrincipal[];
  /** O que não veio nesta leitura e por quê (frases para a tela). */
  faltas: string[];
};

/**
 * O estado da última tentativa:
 * - ok: veio número;
 * - sem_permissao: a Meta recusou por permissão (código 10 ou 200 a 299);
 * - token_invalido: o token morreu (código 190): reconectar;
 * - limite: a Meta pediu para esperar (limite de chamadas);
 * - erro: qualquer outra falha, com o motivo.
 */
export type EstadoDaTentativa = "ok" | "sem_permissao" | "token_invalido" | "limite" | "erro";

/** `marcaDoToken`: um resumo do token usado (nunca o token), para saber se a conta foi reconectada depois. */
export type Tentativa = { em: string; estado: EstadoDaTentativa; motivo: string | null; marcaDoToken: string };

export type GuardadoDaConta = {
  versao: 1;
  rede: RedeDaConta;
  contaId: string;
  /** "@usuario" no Instagram, o nome da página no Facebook. */
  perfil: string | null;
  /** Quando ESTE projeto conectou a conta (SocialAccount.createdAt). */
  conectadaEm: string;
  /** A última tentativa de leitura. Null: a conexão já foi registrada e a leitura ainda não rodou. */
  tentativa: Tentativa | null;
  /**
   * As permissões que a Meta devolveu na última conexão (Instagram), quando
   * a resposta trouxe a lista. É o que separa "reconecte" de "a Meta ainda
   * não liberou para o app": reconectar de novo não muda o segundo caso.
   */
  permissoes?: { lista: string[]; em: string } | null;
  /** A última leitura que deu certo. Sobrevive às tentativas que falham depois. */
  ultima: LeituraDaConta | null;
  /** Os 30 dias antes da conexão, lidos uma vez. */
  antes: JanelaLida | null;
  /** Por que o "antes" não existe (fora dos 90 dias, ainda não lido). */
  antesMotivo: string | null;
  /** Uma linha por leitura que deu certo, a mais recente por último (até 120). */
  historico: Array<{ lidoEm: string; visualizacoes: number | null; alcance: number | null; seguidores: number | null }>;
  /** Só na tela local: números de exemplo, nunca lidos da API. */
  simulado?: boolean;
};

export const TETO_DO_HISTORICO = 120;

/* ── As janelas ───────────────────────────────────────────────────────── */

const iso = (ms: number) => new Date(ms).toISOString();

/** O instante "redondo" da leitura: a hora cheia, para duas leituras seguidas pedirem a mesma janela. */
export function horaCheia(agora: Date): number {
  return Math.floor(agora.getTime() / 3600_000) * 3600_000;
}

export type JanelasDaLeitura = {
  atual: Janela;
  anterior: Janela;
  /** Null quando a Meta já não tem o período (com o motivo em `antesMotivo`). */
  antes: Janela | null;
  antesMotivo: string | null;
  /** A partir de quando a janela atual fica inteira depois da conexão. */
  comparacaoCompletaEm: string;
};

const diaCurto = (ms: number) =>
  new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });

/**
 * As três janelas de uma leitura: os últimos 30 dias, os 30 antes deles e os
 * 30 antes de o projeto conectar a conta. Sem relógio escondido: `agora` vem
 * de quem chama.
 */
export function janelasDaLeitura(agora: Date, conectadaEm: Date, rede: RedeDaConta = "instagram"): JanelasDaLeitura {
  const ate = horaCheia(agora);
  const desde = ate - DIAS_DA_JANELA * DIA_MS;
  const conexao = conectadaEm.getTime();
  const antesDesde = conexao - DIAS_DA_JANELA * DIA_MS;
  const retencao = rede === "instagram" ? RETENCAO_DO_INSTAGRAM_DIAS : RETENCAO_DO_FACEBOOK_DIAS;
  const maisAntigo = ate - retencao * DIA_MS;
  let antes: Janela | null = null;
  let antesMotivo: string | null = null;
  if (antesDesde < maisAntigo) {
    antesMotivo = `A Meta guarda só ${retencao} dias de estatística da conta, e os 30 dias antes da conexão (${diaCurto(conexao)}) já saíram dessa janela.`;
  } else if (conexao > ate) {
    antesMotivo = "A conexão é posterior a esta leitura.";
  } else {
    antes = { desde: iso(antesDesde), ate: iso(conexao) };
  }
  return {
    atual: { desde: iso(desde), ate: iso(ate) },
    anterior: { desde: iso(desde - DIAS_DA_JANELA * DIA_MS), ate: iso(desde) },
    antes,
    antesMotivo,
    comparacaoCompletaEm: iso(conexao + DIAS_DA_JANELA * DIA_MS),
  };
}

export const segundos = (isoTexto: string) => Math.floor(new Date(isoTexto).getTime() / 1000);

/* ── As respostas da Meta ─────────────────────────────────────────────── */

type ResultadoDaQuebra = { dimension_values?: string[]; value?: number };
type ItemDaResposta = {
  name?: string;
  total_value?: { value?: number; breakdowns?: Array<{ dimension_keys?: string[]; results?: ResultadoDaQuebra[] }> };
  values?: Array<{ value?: number | Record<string, number>; end_time?: string }>;
};
export type RespostaDeInsights = { data?: ItemDaResposta[] };

/** O total de uma métrica numa resposta com metric_type=total_value. Null quando não veio (a Meta devolve vazio, não zero). */
export function totalDaMetrica(resposta: RespostaDeInsights | null | undefined, nome: string): number | null {
  const item = resposta?.data?.find((d) => d.name === nome);
  const v = item?.total_value?.value;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Os valores de uma quebra (dimensão -> valor). Null quando a quebra não veio. */
export function quebraDaMetrica(resposta: RespostaDeInsights | null | undefined, nome: string, dimensao: string): Record<string, number> | null {
  const item = resposta?.data?.find((d) => d.name === nome);
  const quebra = item?.total_value?.breakdowns?.find((b) => b.dimension_keys?.includes(dimensao));
  if (!quebra?.results) return null;
  const i = Math.max(0, quebra.dimension_keys!.indexOf(dimensao));
  const mapa: Record<string, number> = {};
  for (const r of quebra.results) {
    const chave = r.dimension_values?.[i];
    if (!chave || typeof r.value !== "number") continue;
    mapa[chave] = (mapa[chave] ?? 0) + r.value;
  }
  return mapa;
}

/** A soma dos valores diários de uma métrica de página (period=day). Null quando não veio nenhum dia. */
export function somaDosDias(resposta: RespostaDeInsights | null | undefined, nome: string): number | null {
  const item = resposta?.data?.find((d) => d.name === nome);
  const dias = (item?.values ?? []).map((v) => v.value).filter((v): v is number => typeof v === "number");
  return dias.length ? dias.reduce((a, b) => a + b, 0) : null;
}

/** As visualizações por seguimento (follow_type): FOLLOWER, NON_FOLLOWER, UNKNOWN. */
export function divisaoPorSeguimento(mapa: Record<string, number> | null, fonte: string): DivisaoPorSeguimento | null {
  if (!mapa || !Object.keys(mapa).length) return null;
  return { seguidores: mapa.FOLLOWER ?? 0, naoSeguidores: mapa.NON_FOLLOWER ?? 0, desconhecido: mapa.UNKNOWN ?? 0, fonte };
}

/**
 * As visualizações por tipo (media_product_type). A Meta devolve REEL ou
 * REELS, STORY, POST e CAROUSEL_CONTAINER (os dois do feed), AD e,
 * eventualmente, outros; o que não for conhecido vai para "outros" e aparece.
 */
export function divisaoPorTipo(mapa: Record<string, number> | null, fonte: string): DivisaoPorTipo | null {
  if (!mapa || !Object.keys(mapa).length) return null;
  const d: DivisaoPorTipo = { reels: 0, stories: 0, publicacoes: 0, anuncios: 0, outros: 0, fonte };
  for (const [k, v] of Object.entries(mapa)) {
    const t = k.toUpperCase();
    if (t === "REEL" || t === "REELS") d.reels += v;
    else if (t === "STORY" || t === "STORIES") d.stories += v;
    else if (t === "POST" || t === "CAROUSEL_CONTAINER" || t === "FEED") d.publicacoes += v;
    else if (t === "AD") d.anuncios += v;
    else d.outros += v;
  }
  return d;
}

/** follows_and_unfollows por follow_type: FOLLOWER são as contas que seguiram; NON_FOLLOWER, as que deixaram. */
export function seguidoresGanhos(mapa: Record<string, number> | null, fonte: string): SeguidoresGanhos | null {
  if (!mapa || !Object.keys(mapa).length) return null;
  return { seguiram: mapa.FOLLOWER ?? 0, deixaram: mapa.NON_FOLLOWER ?? 0, fonte };
}

/** O tipo da mídia na língua da tela, a partir de media_product_type e media_type. */
export function tipoDaMidia(produto: string | null | undefined, midia: string | null | undefined): string {
  const p = (produto ?? "").toUpperCase();
  const m = (midia ?? "").toUpperCase();
  if (p === "REELS" || p === "REEL") return "reels";
  if (p === "STORY") return "story";
  if (m === "CAROUSEL_ALBUM") return "carrossel";
  if (p === "FEED" || m === "IMAGE" || m === "VIDEO") return "publicacao";
  return (p || m || "outro").toLowerCase();
}

export const ROTULO_DO_TIPO: Record<string, string> = {
  reels: "Reels",
  story: "Story",
  carrossel: "Carrossel",
  publicacao: "Publicação",
};

/** Os N principais por visualizações, e quem não tem número fica de fora (não é zero). */
export function principaisConteudos(itens: ConteudoPrincipal[], n = 5): ConteudoPrincipal[] {
  return itens
    .filter((i) => typeof i.visualizacoes === "number")
    .sort((a, b) => (b.visualizacoes ?? 0) - (a.visualizacoes ?? 0))
    .slice(0, n);
}

/** A primeira linha da legenda, curta. */
export function legendaCurta(texto: string | null | undefined, max = 90): string {
  const linha = (texto ?? "").split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? "";
  return linha.length > max ? `${linha.slice(0, max - 1).trimEnd()}…` : linha;
}

/* ── Os erros da Meta ─────────────────────────────────────────────────── */

export type ErroDaMeta = { message?: string; code?: number; error_subcode?: number; type?: string };

/**
 * O que a recusa da Meta quer dizer. Medido em 09/10: as quatro contas
 * conectadas responderam 403 com código 10, "Application does not have
 * permission for this action". Códigos da referência de erros da Graph API:
 * 10 e 200 a 299 são permissão; 190 é token inválido; 4, 17, 32 e 613 são
 * limite de chamadas.
 */
export function classificarErroDaMeta(status: number, erro: ErroDaMeta | null | undefined): EstadoDaTentativa {
  const code = erro?.code;
  const msg = erro?.message ?? "";
  if (code === 190 || /access token|session has expired|Error validating/i.test(msg)) return "token_invalido";
  if (code === 10 || (typeof code === "number" && code >= 200 && code <= 299) || /permission/i.test(msg)) return "sem_permissao";
  if (code === 4 || code === 17 || code === 32 || code === 613 || status === 429) return "limite";
  return "erro";
}

/* ── O que a tela desenha ─────────────────────────────────────────────── */

export const PERMISSAO_DO_INSTAGRAM = "instagram_business_manage_insights";

/**
 * O estado da conta na tela:
 * - numeros: tem leitura (mesmo que a última tentativa tenha falhado depois);
 * - reconectar: a Meta recusou por permissão e a conexão é anterior ao pedido
 *   da permissão (ou o token morreu): o cliente reconecta;
 * - aguardando_meta: a conexão já pediu a permissão e a Meta não concedeu, o
 *   que depende da aprovação do app, não do cliente;
 * - aguardando_leitura: conectada, ainda sem tentativa (sai em minutos);
 * - erro: a última tentativa falhou por outro motivo, que a tela diz.
 */
export type EstadoNaTela = "numeros" | "reconectar" | "aguardando_meta" | "aguardando_leitura" | "erro";

export function estadoNaTela(g: Pick<GuardadoDaConta, "rede" | "tentativa" | "ultima" | "permissoes"> | null): EstadoNaTela {
  if (!g) return "aguardando_leitura";
  if (g.ultima) return "numeros";
  if (!g.tentativa) return "aguardando_leitura";
  const e = g.tentativa.estado;
  if (e === "token_invalido") return "reconectar";
  if (e === "sem_permissao") {
    // A conexão mais nova que a tentativa já pediu a permissão: a leitura com o
    // token novo ainda vai sair. Até lá, nem convite nem número.
    if (g.permissoes && new Date(g.permissoes.em).getTime() > new Date(g.tentativa.em).getTime()) return "aguardando_leitura";
    const pediu = g.rede === "instagram" && g.permissoes?.lista.includes(PERMISSAO_DO_INSTAGRAM);
    // A conexão devolveu a lista e ela NÃO tem a permissão: a Meta não a
    // concedeu ao app. Reconectar de novo dá no mesmo.
    if (g.rede === "instagram" && g.permissoes && !pediu) return "aguardando_meta";
    return "reconectar";
  }
  if (e === "ok") return "aguardando_leitura";
  return "erro";
}

/** A variação em porcentagem (null quando não há base para comparar). */
export function variacaoPct(atual: number | null | undefined, base: number | null | undefined): number | null {
  if (typeof atual !== "number" || typeof base !== "number" || base <= 0) return null;
  return ((atual - base) / base) * 100;
}

/** A parte de um total, em porcentagem com uma casa (o print da Meta usa uma casa). */
export function parte(valor: number, total: number): number {
  if (!total) return 0;
  return Math.round((valor / total) * 1000) / 10;
}

/** A comparação com antes da Demandou só vale quando a janela atual inteira é depois da conexão. */
export function comparacaoComAntesValida(g: Pick<GuardadoDaConta, "conectadaEm" | "antes" | "ultima">): boolean {
  if (!g.antes || !g.ultima) return false;
  return new Date(g.ultima.atual.janela.desde).getTime() >= new Date(g.conectadaEm).getTime();
}

/**
 * O PRÓXIMO REGISTRO depois de uma tentativa. A leitura que deu certo
 * sobrevive às tentativas que falham depois (a tela mostra com a data dela);
 * o "antes da Demandou" lido uma vez fica para sempre, a não ser que a conta
 * tenha sido conectada de novo do zero (outra data de conexão).
 */
export function proximoGuardado(p: {
  anterior: GuardadoDaConta | null;
  base: { rede: RedeDaConta; contaId: string; perfil: string | null; conectadaEm: string };
  tentativa: Tentativa;
  leitura: LeituraDaConta | null;
  antes: JanelaLida | null;
  antesMotivo: string | null;
}): GuardadoDaConta {
  const a = p.anterior && p.anterior.conectadaEm === p.base.conectadaEm ? p.anterior : null;
  const historico = [...(a?.historico ?? [])];
  if (p.leitura) {
    historico.push({
      lidoEm: p.leitura.lidoEm,
      visualizacoes: p.leitura.atual.visualizacoes?.valor ?? null,
      alcance: p.leitura.atual.alcance?.valor ?? null,
      seguidores: p.leitura.seguidores?.valor ?? null,
    });
  }
  const antes = a?.antes ?? p.antes ?? null;
  return {
    versao: 1,
    ...p.base,
    tentativa: p.tentativa,
    permissoes: p.anterior?.permissoes ?? null,
    ultima: p.leitura ?? a?.ultima ?? null,
    antes,
    antesMotivo: antes ? null : p.antesMotivo ?? a?.antesMotivo ?? null,
    historico: historico.slice(-TETO_DO_HISTORICO),
  };
}

/**
 * A conta precisa de leitura agora? Nunca lida; reconectada depois de uma
 * tentativa que falhou (o token mudou); limite da Meta há mais de 1 hora; ou
 * a última tentativa tem mais de 20 horas. Devolve a prioridade (0 primeiro)
 * ou null quando não está vencida.
 */
export function prioridadeDaLeitura(g: Pick<GuardadoDaConta, "tentativa"> | null, marcaDoTokenAtual: string, agora: Date): number | null {
  const t = g?.tentativa;
  if (!t) return 0;
  const idade = agora.getTime() - new Date(t.em).getTime();
  if (t.estado !== "ok" && t.marcaDoToken !== marcaDoTokenAtual) return 0;
  if (t.estado === "limite" && idade >= 3600_000) return 1;
  if (idade >= INTERVALO_DA_LEITURA_MS) return 2;
  return null;
}

/** Uma conta do projeto como a tela recebe (sem token, sem id do fornecedor além do perfil). */
export type ContaNaTela = {
  contaId: string;
  rede: string;
  perfil: string | null;
  avatarUrl: string | null;
  accountType: string;
  estado: EstadoNaTela;
  /**
   * Com número na tela, o problema da tentativa MAIS NOVA (a leitura de hoje
   * falhou e a mostrada é de antes): reconectar, aguardar a Meta ou o erro.
   */
  problema: Exclude<EstadoNaTela, "numeros"> | null;
  /** Por que reconectar: falta a permissão, ou a conexão caiu (token invalidado pela Meta). */
  causa: "permissao" | "conexao" | null;
  /** O motivo, quando não há número. */
  motivo: string | null;
  /** O descarte do convite: muda quando muda a tentativa. */
  chaveDoAviso: string | null;
  guardado: GuardadoDaConta | null;
};

/** As redes que a Demandou ainda não lê no nível da conta. */
export const REDES_SEM_LEITURA_DA_CONTA = ["linkedin", "twitter", "youtube", "tiktok"];

export type EstatisticasDoProjeto = {
  /** Instagram e Facebook: uma por conta ativa. */
  contas: ContaNaTela[];
  /** As outras redes conectadas, só para a linha que diz que ainda não lemos. */
  outrasRedes: Array<{ rede: string; perfil: string | null; avatarUrl: string | null; contas: number }>;
  /** Alguma das contas mostradas é simulação local. */
  simulacao: boolean;
};

/** O problema da tentativa mais nova quando a tela já tem número (ou null). */
export function problemaDaTentativa(g: Pick<GuardadoDaConta, "rede" | "tentativa" | "ultima" | "permissoes"> | null): ContaNaTela["problema"] {
  if (!g?.ultima || !g.tentativa || g.tentativa.estado === "ok" || g.tentativa.estado === "limite") return null;
  const e = estadoNaTela({ ...g, ultima: null });
  return e === "numeros" ? null : e;
}

/** A causa do "reconectar" pela tentativa mais nova. */
export function causaDaReconexao(g: Pick<GuardadoDaConta, "tentativa"> | null): ContaNaTela["causa"] {
  const e = g?.tentativa?.estado;
  return e === "token_invalido" ? "conexao" : e === "sem_permissao" ? "permissao" : null;
}

/** A frase do estado, sem número. */
export function fraseDoEstado(c: Pick<ContaNaTela, "rede" | "perfil" | "motivo"> & { estado: EstadoNaTela; causa?: ContaNaTela["causa"] }): string {
  const quem = c.perfil ?? (c.rede === "facebook" ? "a página" : "a conta");
  const rede = c.rede === "facebook" ? "Facebook" : "Instagram";
  switch (c.estado) {
    case "reconectar":
      if (c.causa === "conexao") {
        return `A conexão com ${quem} caiu: a Meta invalidou o acesso (acontece depois de uma troca de senha). Reconecte o ${rede} para voltar a ler as estatísticas e a publicar.`;
      }
      return c.rede === "instagram"
        ? `Ainda não temos permissão para ler as estatísticas de ${quem}. Reconecte o Instagram e autorize a leitura das estatísticas.`
        : `Ainda não temos permissão para ler as estatísticas de ${quem}. Reconecte o Facebook e autorize a leitura das estatísticas da página.`;
    case "aguardando_meta":
      return `A Meta ainda não liberou a leitura das estatísticas para a Demandou. Você já autorizou o que podia; quando a Meta liberar, os números de ${quem} aparecem aqui sem você fazer nada.`;
    case "aguardando_leitura":
      return `A primeira leitura das estatísticas de ${quem} sai em alguns minutos.`;
    case "erro":
      return `A última leitura das estatísticas de ${quem} falhou${c.motivo ? `: ${c.motivo}` : "."}`;
    default:
      return "";
  }
}
