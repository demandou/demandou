/**
 * Limites do upload de vídeo, e o porquê de cada número.
 *
 * DECISÃO DE 22/08/2026 (Bruno): não limitar o cliente, cobrar por ele. Vídeo
 * maior custa mais créditos, e não é recusado. A versão anterior barrava por
 * taxa de gravação e por tamanho, e o Bruno esbarrou no próprio produto ao
 * tentar subir a gravação de 27 minutos que abre o canal dele. Resolver o
 * nosso problema de margem com o tempo do cliente é o caminho errado.
 *
 * A Deepgram, que transcreve, aceita no máximo 2 GB por arquivo, e até 29/09
 * esse era o teto do upload. O conserto de raiz entrou em 29/09: acima de
 * `LIMITE_DA_TRANSCRICAO_DIRETA` o worker extrai só o áudio e a Deepgram
 * recebe dezenas de megabytes. Desde então o teto é do PLANO (1, 2 e 5 horas).
 *
 * Onde o custo mora, e é contraintuitivo: não é a transcrição nem a IA, é a
 * transferência. Blob acima de 512 MB nunca entra em cache, então todo acesso
 * paga, e store privado paga duas vezes, porque a função busca no store e
 * depois entrega ao navegador. Por isso o crédito extra é cobrado por GB, que
 * é onde o custo realmente escala, e não por minuto.
 */

/** O que a gente recomenda gravar, que é onde a margem fica saudável. */
export const MB_POR_MINUTO_RECOMENDADO = 30; // 4 Mbps

/**
 * Teto da Deepgram, com folga de 100 MB para o overhead do multipart.
 *
 * Até 29/09 este era o teto do UPLOAD, e por isso nenhuma gravação passava de
 * 2 h. Agora é só o ponto em que a transcrição muda de caminho: acima dele o
 * worker extrai o áudio (5 h de fala viram cerca de 110 MB) e a Deepgram
 * recebe só o áudio. O cliente não vê diferença nenhuma.
 */
export const LIMITE_DA_TRANSCRICAO_DIRETA = 1_900 * 1024 * 1024;

/**
 * Os tetos ABSOLUTOS, que são os do maior plano (Enterprise: 5 h, 20 GB).
 * Valem para o token do upload quando o plano não é conhecido e para o acesso
 * interno. O teto de cada plano mora em `lib/planos.ts` e chega aqui por
 * `LimitesDoEnvio`.
 */
export const MAX_BYTES = 20 * 1024 * 1024 * 1024;
export const MAX_DURACAO_SEGUNDOS = 300 * 60;

/**
 * O que um envio pode ter, no plano de quem envia.
 *
 * Mora aqui, e não em `lib/limites-do-plano.ts`, porque o navegador precisa
 * dele para recusar ANTES de subir um byte, e aquele módulo importa o banco.
 */
/**
 * A DURAÇÃO DE CADA GRAVAÇÃO POR PAPEL (08/10, decisão do Bruno): "vendedor
 * ligado ao contrato não sobe vídeo acima de 5 minutos; vídeo longo só o
 * titular; podcast de 3 horas só o titular do Enterprise". Quem envia pela
 * equipe ou pelo contrato é "membro"; quem paga é "titular". A duração do
 * plano (1 h, 2 h, 3 h) só vale para o titular.
 */
export type PapelDoEnvio = "titular" | "membro";
export const MINUTOS_POR_GRAVACAO_DO_MEMBRO = 5;

export function duracaoMaximaDaGravacaoMin(papel: PapelDoEnvio, duracaoMaximaDoPlanoMin: number): number {
  return papel === "membro" ? Math.min(MINUTOS_POR_GRAVACAO_DO_MEMBRO, duracaoMaximaDoPlanoMin) : duracaoMaximaDoPlanoMin;
}

/** "Vídeos acima de 5 minutos só a titular do contrato envia." A mesma frase na tela de envio e na recusa do servidor. */
export function fraseDoVideoLongoDoMembro(limiteMin: number, contrato: boolean, dono: string | null | undefined): string {
  const quem = contrato ? "a titular do contrato" : dono?.trim() ? `${dono.trim()}, que administra a conta,` : "quem administra a conta";
  return `Vídeos acima de ${limiteMin} minutos só ${quem} envia.`;
}

export type LimitesDoEnvio = {
  /** O que ESTE envio pode ter: o menor entre a duração que o papel permite e os minutos que sobram no mês. */
  duracaoMaximaSeg: number;
  bytesMaximo: number;
  /** O nome que o cliente vê. Null para acesso interno ou sem plano. */
  plano: string | null;
  /** Quem resolve se não couber: nome, duração e minutos por mês do plano de cima. */
  proximo: { nome: string; duracaoMaximaMin: number; arquivoMaximoGb: number; minutosPorMes?: number } | null;
  /**
   * OS MINUTOS DE VÍDEO DO MÊS (08/10): o teto do plano e o que ainda sobra no
   * ciclo. Null para acesso interno. É o mesmo número do cartão do plano
   * (lib/entregas-do-plano.ts, `minutosPorMesDoPlano`).
   */
  minutos?: { porMes: number; usados: number; restantes: number } | null;
  /** O PAPEL de quem envia (08/10) e a duração que ele permite por gravação; `dono` é quem envia o vídeo longo. */
  papel?: { tipo: PapelDoEnvio; duracaoMaximaMin: number; dono: string | null; contrato: boolean } | null;
};

/** Sem plano conhecido, vale o maior teto: quem barra de verdade é o servidor. */
export const LIMITES_SEM_PLANO: LimitesDoEnvio = {
  duracaoMaximaSeg: MAX_DURACAO_SEGUNDOS,
  bytesMaximo: MAX_BYTES,
  plano: null,
  proximo: null,
  minutos: null,
  papel: null,
};

/**
 * O TETO DE DURAÇÃO DE UM ENVIO (08/10), sem banco: o menor entre a duração
 * máxima técnica do plano e os minutos que sobram no mês. Quem já usou os
 * minutos do mês não sobe mais nada (0 s), e a tela diz por quê.
 */
export function duracaoMaximaDoEnvioSeg(duracaoMaximaMin: number, minutosRestantes: number | null | undefined): number {
  const doPlano = duracaoMaximaMin * 60;
  if (minutosRestantes === null || minutosRestantes === undefined) return doPlano;
  return Math.max(0, Math.min(doPlano, Math.floor(minutosRestantes) * 60));
}

/** "1 hora", "2 horas", "90 minutos": duração como gente fala. */
export function duracaoPorExtenso(segundos: number): string {
  const min = Math.round(segundos / 60);
  if (min % 60 === 0) {
    const h = min / 60;
    return `${h} hora${h > 1 ? "s" : ""}`;
  }
  return `${min} minutos`;
}

export const TIPOS_ACEITOS = [
  "video/mp4",
  "video/quicktime",
  "video/x-matroska",
  "video/webm",
];

/**
 * Limite duro de caracteres do X. Post acima disso é recusado na publicação.
 *
 * Mora aqui, e não junto do redator, porque a tela de aprovação precisa dele
 * para avisar antes de o cliente tentar publicar. O módulo do redator importa
 * o cliente do Claude, que importa o Prisma, que arrasta o driver do Postgres
 * para o bundle do navegador e quebra o build.
 */
export const MAX_X = 280;

/**
 * Créditos da edição pelo caminho ANTIGO, de cobrança única (a rota /write,
 * quando a tela de roteiro está desligada). Desde 01/10 é a soma exata das duas
 * partes com 3 cortes: roteiro + completo + 3 cortes nos fixos, e roteiro +
 * completo no por minuto. Assim o número da sugestão de "grave mais leve" na
 * tela de envio bate com o total que a mesma tela mostra (01/10).
 *
 * Histórico: 260 fixos mais 17 por minuto (aprovado pelo Bruno em 29/09). A
 * regra de antes dessa (2 por minuto e 4 por corte) cobrava 50 créditos por um
 * vídeo de 16 min que custou US$ 3,13 de IA. A abertura por IA da Higgsfield e
 * o arquivo acima do recomendado continuam cobrados à parte.
 */
// Até 30/09: export const CREDITOS_FIXOS_DA_EDICAO = 260;
// Até 30/09: export const CREDITOS_POR_MINUTO = 17;
// Até 02/10: 2140 (550 + 390 + 3 x 400).
// Até 03/10: 2200. Imagens em qualidade média (aprovado pelo Bruno em 03/10).
// Até 08/10: 2300 (590 + 390 + 3 x 440) e 61 por minuto (25 + 36).
// Desde 08/10 os dois saem das partes abaixo, para nunca mais divergirem delas.
export const CREDITOS_FIXOS_DA_EDICAO = 1430; // 590 + 60 + 3 x 260 (08/10); conferido num teste contra as partes
export const CREDITOS_POR_MINUTO = 230; // 25 + 205 (08/10); CREDITOS_POR_MINUTO_DE_VIDEO, abaixo

/**
 * OS CRÉDITOS EM DUAS PARTES (30/09, tela de roteiro). O Bruno: "essa etapa
 * consome créditos, mas não todos; os demais só depois de confirmar os cortes
 * e os efeitos". A esteira PARA depois de transcrever, limpar, escolher os
 * cortes e planejar a edição em texto, e só gera imagem, cena, corte e
 * montagem depois que o cliente aprova.
 *
 * PREÇO EM VIGOR DESDE 01/10 (decisão do Bruno): partir da proposta branda de
 * 30/09 e garantir mais de 70% de margem bruta sobre o custo de IA em todos os
 * planos, no uso típico e no uso máximo dos créditos do plano. A regra: nenhuma
 * etapa pode custar mais de R$ 0,027 de IA por crédito. O crédito vale R$ 0,150
 * no Starter (R$ 2.997 por 20.000), R$ 0,100 no Pro e R$ 0,094 no Enterprise, e
 * R$ 0,027 é o que deixa o Enterprise, o de crédito mais barato, acima de 70%
 * (71,5%) mesmo que o cliente gaste tudo na etapa mais cara.
 *
 * O custo de cada etapa saiu do uso MEDIDO em `ai_usage` nas três gravações de
 * 30/09 (cmuo1ot5g: 22 min e 3 cortes; cmuo6nirp: 22 min e 2 cortes; cmuon0yxo:
 * 4,7 min e 2 cortes), com as mesmas chamadas e os mesmos tokens, reprecificado
 * para o que entrou em 01/10: o texto no Claude Sonnet 5 (US$ 2 e US$ 10 por
 * milhão de tokens, 40% do Opus 5) e a imagem na Higgsfield (colagem e arte no
 * GPT Image 2.5 baixa a US$ 0,025, elemento no Recraft V4.1 a US$ 0,035, cenário
 * no Grok a US$ 0,08), com 20% das imagens caindo no recuo do Google (US$ 0,101
 * em 2K). A capa continua no Google. Dólar a R$ 5,36, já com IOF:
 *
 * - ROTEIRO (antes de aprovar): a semana de peças escritas (~US$ 1,7), seleção e
 *   radar, transcrição e limpeza, e o diretor em texto (~US$ 0,15 por corte
 *   candidato, até 6, e por bloco de 3,5 min do completo). US$ 2,60 mais 0,065
 *   por minuto. Ficou a branda (550 + 25), que já passa: R$ 0,025 e R$ 0,014.
 * - COMPLETO: 4 cenas de cinema (Kling, ~US$ 1,8, teto fixo do completo), as
 *   capas e as imagens ao longo do vídeo (perto de 2 por minuto). US$ 1,95
 *   mais 0,11 por minuto. Subiu de 110 + 21 para 390 + 22: as cenas de cinema
 *   não ficaram mais baratas, e o fixo da branda pagava só um terço delas.
 * - POR CORTE aprovado: cena de cinema, imagens, enquadramento, capa, efeitos,
 *   revisão e redação. Medido US$ 1,31 a 2,17 por corte; conta com US$ 2,00.
 *   Subiu de 275 para 400 pelo mesmo motivo: o Kling é o grosso do corte.
 *
 * Conferência: 22 min com 3 cortes dá 3.174 créditos e US$ 14,40 no modelo; o
 * medido reprecificado foi US$ 11,83. O modelo erra para cima, do lado seguro.
 *
 * O PREÇO DE 08/10 (decisão do Bruno: "qualquer vídeo custa no máximo US$ 1
 * por minuto" e "a margem combinada de 70% nunca é prejudicada"). O crédito
 * é a MOEDA ÚNICA e a régua de R$ 0,027 de IA por crédito (US$ 0,005037,
 * DOLAR_POR_CREDITO) vale para toda ação, inclusive o minuto de vídeo
 * editado, que até aqui furava a régua: 61 créditos por minuto deixavam
 * gastar US$ 0,31 num minuto que custava US$ 1,34 medido (R$ 0,12 de IA por
 * crédito). A conta do minuto (lib/media/teto-da-edicao.ts):
 *
 * - a EDIÇÃO inteira (plano, prompts, textos, direção, geração, montagem)
 *   tem teto de US$ 1,00 por minuto, somado em tempo real na montagem;
 * - FORA da edição rodam transcrição, leitura do vídeo, seleção, radar,
 *   limpeza, capas e enquadramento: medido US$ 0,10 a 0,13 por minuto na
 *   jornada de 07 e 08/10; entra 0,15;
 * - US$ 1,15 por minuto na régua são 228,3 créditos; cobra-se 230, repartidos
 *   entre as duas partes: 25 no roteiro (o que roda antes de aprovar) e 205
 *   no completo (a edição sob o teto, US$ 1,03 na régua);
 * - os FIXOS por gravação cobrem o que não escala com o minuto: a semana de
 *   peças escritas, a seleção e o radar no roteiro (590, ~US$ 2,6 medido); as
 *   capas, o enquadramento e a redação do completo (60, US$ 0,30); cada corte
 *   (260): o corte reaproveita as mídias do completo e gera sozinho no máximo
 *   US$ 1 (TETO_USD_DO_CORTE), mais textos, capa, redação e revisão (~0,2);
 *   260 créditos deixam gastar US$ 1,31. O 390 fixo do completo (as 4 cenas
 *   de cinema do Kling) saiu: as cenas agora estão dentro do teto por minuto.
 *
 * Um minuto de vídeo editado com a semana sugerida custa então 1.450 fixos
 * (590 + 60 + 3 x 260 + 20 da abertura) mais 230 por minuto. É deste número
 * que saem os minutos de cada plano (lib/entregas-do-plano.ts), e não o
 * contrário.
 */
// Até 30/09 (escala de 29/09, sem a margem):
// export const CREDITOS_DO_ROTEIRO_FIXOS = 90;
// export const CREDITOS_DO_ROTEIRO_POR_MINUTO = 7;
// export const CREDITOS_DO_COMPLETO_FIXOS = 75;
// export const CREDITOS_DO_COMPLETO_POR_MINUTO = 3;
// export const CREDITOS_POR_CORTE_APROVADO = 80;
// 550 até 03/10; a semana de artes subiu para o GPT Image 2 medium (prova A/B de 02/10).
export const CREDITOS_DO_ROTEIRO_FIXOS = 590;
export const CREDITOS_DO_ROTEIRO_POR_MINUTO = 25;
// 390 até 08/10 (as 4 cenas de cinema do Kling, hoje dentro do teto por minuto).
export const CREDITOS_DO_COMPLETO_FIXOS = 60;
// 22 até 01/10 à tarde. Subiu para 28 por decisão do Bruno: o diretor do
// completo passou a cobrir o vídeo inteiro (cotas por minuto, o dobro de
// inserções) e custou cerca de US$ 2,5 num vídeo de 22 min, o que deixava a
// soma de roteiro e completo encostada no teto de R$ 0,027 por crédito.
// 28 até 03/10; imagens do completo em medium (+US$ 0,07 por minuto).
// 36 até 08/10; desde então o minuto editado paga o teto de US$ 1 na régua.
export const CREDITOS_DO_COMPLETO_POR_MINUTO = 205;
/**
 * O MINUTO DE VÍDEO EDITADO, em créditos: a soma das duas partes por minuto.
 * É o número que vira "minutos de vídeo por mês" no cartão do plano.
 */
export const CREDITOS_POR_MINUTO_DE_VIDEO = CREDITOS_DO_ROTEIRO_POR_MINUTO + CREDITOS_DO_COMPLETO_POR_MINUTO;
// 400 até 02/10. Subiu para 420 com a aprovação do Bruno: a revisão visual
// (~US$ 0,08 por corte) deixava o corte 3% acima da régua de R$ 0,027 por crédito.
// 420 até 03/10; 2 a 3 imagens por corte em medium.
// 440 até 08/10. Desde a jornada (08/10) o corte usa as mídias do completo e
// o que gera sozinho cabe em US$ 1 (TETO_USD_DO_CORTE): 260 na régua.
export const CREDITOS_POR_CORTE_APROVADO = 260;
/**
 * A DEVOLUÇÃO DA EDIÇÃO NÃO ENTREGUE (02/10, prometida ao Bruno): quando a
 * montagem de efeitos falha por erro nosso ou a revisão visual entrega a
 * versão segura (sem inserção), volta a parte que não foi entregue. No
 * completo, a parte do completo inteira (fixo e por minuto, e a abertura se
 * ela saiu): o corte limpo de fala já vinha da primeira parte. No corte, a
 * MONTAGEM: era 250 dos 420 (a cena de cinema e as imagens, o grosso do
 * corte); desde 08/10, 200 dos 260 (as mídias e a montagem sob o teto de
 * US$ 1); capa, enquadramento, revisão e redação foram entregues.
 */
// Até 08/10: 250 (de 440).
export const CREDITOS_DA_MONTAGEM_DO_CORTE = 200;
/**
 * A ABERTURA COM OS MELHORES MOMENTOS do completo (01/10, estilo MrBeast):
 * a escolha das frases no Sonnet (~US$ 0,05 com o vídeo de 22 min) e ~1 min
 * de ffmpeg no worker. 20 créditos ficam abaixo de R$ 0,027 de IA por
 * crédito (US$ 0,10 de teto). Cobrada na aprovação, só se a abertura estiver
 * ligada; aparece na tela de roteiro antes. O gancho dos cortes curtos sai
 * no preço do corte (uma chamada só para todos, centavos).
 */
export const CREDITOS_DA_ABERTURA_DO_COMPLETO = 20;
/**
 * Quantos cortes o cliente pode aprovar na tela de roteiro. Era 3 (pedido do
 * Bruno de 30/09); desde 01/10 a seleção traz o pedido e mais 2 candidatos,
 * até 8, e todos podem ir ao ar. A cobrança é POR CORTE aprovado
 * (`creditosDaAprovacao`), então aprovar mais não mexe na margem.
 */
// Até 01/10: export const MAX_CORTES_APROVADOS = 3;
export const MAX_CORTES_APROVADOS = 8;
/** Quantos a tela já deixa marcados (os mais fortes pela nota) e a conta típica da tela de envio. */
export const CORTES_SUGERIDOS = 3;
/**
 * "Outra ideia" numa cena: uma chamada curta ao diretor. Medido US$ 0,051 por
 * pedido no Opus 5, ~US$ 0,02 no Sonnet 5. Cobrada na hora do pedido, e o
 * número aparece no botão antes do clique. 10 desde 01/10 (era 5): com 5, a
 * chamada no Opus custava mais que o crédito valia.
 */
// Até 30/09: export const CREDITOS_POR_NOVA_IDEIA = 5;
export const CREDITOS_POR_NOVA_IDEIA = 10;
/**
 * Ajuste do vídeo PELO CHAT do card (30/09): o que o pedido gera de novo.
 * Tirar efeito, trocar texto e recortar a fala não geram nada e não cobram.
 * Preços de 01/10, cada um abaixo de R$ 0,027 de IA por crédito:
 *
 * - IMAGEM (20, era 8): a imagem na Higgsfield (~US$ 0,04 contando o recuo do
 *   Google), a conferência de texto e a chamada do chat no Sonnet: ~US$ 0,056.
 *   Os 8 tinham sido calculados no preço que o código gravava para o Google
 *   (US$ 0,039), e não nos US$ 0,101 que ele cobra em 2K.
 * - CENA (95, era 80): cena de cinema do Kling de 4 s (US$ 0,448) mais a
 *   chamada do chat, US$ 0,46. Com 80, R$ 0,031 por crédito.
 * - SALA, o cenário do narrador (110, era 100): a edição do quadro no Grok
 *   (US$ 0,08, ou 0,136 no recuo) mais a cena, US$ 0,55.
 */
// Até 30/09: export const CREDITOS_POR_IMAGEM_NO_AJUSTE = 8;
// Até 30/09: export const CREDITOS_POR_CENA_NO_AJUSTE = 80;
// Até 30/09: export const CREDITOS_POR_CENARIO_NO_AJUSTE = 100;
export const CREDITOS_POR_IMAGEM_NO_AJUSTE = 20;
export const CREDITOS_POR_CENA_NO_AJUSTE = 95;
export const CREDITOS_POR_CENARIO_NO_AJUSTE = 110;

/**
 * O GÊMEO DIGITAL, PROPOSTO E AINDA NÃO COBRADO (01/10): o recurso está em
 * teste e nada no código lê este número. Fica aqui para o preço nascer na
 * mesma régua quando o gêmeo for ligado: Kling Avatar no fal.ai a ~US$ 0,115
 * por segundo, a voz da ElevenLabs (~US$ 0,004 por segundo de fala) e o roteiro
 * no Sonnet, perto de US$ 0,12 por segundo, ou R$ 0,65. 25 créditos por
 * segundo dão R$ 0,026 por crédito; um vídeo de 30 s sai a 750.
 */
// 34, e não 25 (01/10): o gerador escolhido foi o OmniHuman 1.5 (US$ 0,16/s),
// mais caro que o Kling usado na conta anterior. O valor que vale mora em
// lib/media/gemeo.ts (CREDITOS_POR_SEGUNDO_DE_GEMEO); este espelha.
export const CREDITOS_POR_SEGUNDO_DO_GEMEO = 34;

/*
 * A PROPOSTA DE 30/09, substituída pelo preço de 01/10 acima. Ficou como
 * registro do raciocínio (estava desligada, nada lia este objeto):
 *
 * export const PRECO_PROPOSTO_DOS_CREDITOS_3009 = {
 *   ligado: false,
 *   reaisDeCustoPorCredito: 0.031,
 *   reaisPorDolar: 5.4,
 *   roteiroFixos: 800, roteiroPorMinuto: 37,
 *   completoFixos: 160, completoPorMinuto: 30,
 *   porCorteAprovado: 400, novaIdeia: 10,
 *   imagemNoAjuste: 20, cenaNoAjuste: 80, cenarioNoAjuste: 100,
 *   aberturaHiggsfield: 59, edicaoFixos: 2160, edicaoPorMinuto: 67,
 * } as const;
 *
 * Ela partia do custo com o texto no Opus 5 e a imagem no Google (gravação de
 * 22 min a US$ 16 a 21) e devolvia a gravação a R$ 0,031 de custo por crédito,
 * margem de 79%, 69% e 67%. A branda (R$ 0,045: roteiro 550 + 25, completo
 * 110 + 21, corte 275) dava 70%, 55% e 53%. Com o Sonnet e a Higgsfield a
 * gravação caiu para ~US$ 12 a 14, e a branda passou a precisar subir só no
 * completo e no corte.
 */

/**
 * A PRIMEIRA PARTE NO PREÇO DE ATÉ 30/09 (01/10). Quem enviou a gravação antes
 * da troca viu na tela de envio o total antigo e pagou o roteiro antigo; cobrar
 * a aprovação no preço novo seria mudar o combinado no meio. A conta antiga
 * fica aqui só para essa transição, e o jeito de reconhecer quem pagou no preço
 * antigo é o próprio valor pago: o roteiro antigo (90 + 7 por minuto) é sempre
 * menor que o novo (550 + 25) para a mesma duração e o mesmo arquivo.
 */
const PRECO_ATE_3009 = { roteiroFixos: 90, roteiroPorMinuto: 7, completoFixos: 75, completoPorMinuto: 3, porCorte: 80 } as const;

/** O roteiro foi pago no preço de até 30/09? Pelo valor que saiu do saldo. */
export function roteiroPagoNoPrecoAntigo(pago: number | null | undefined, duracaoSegundos: number, bytes?: number): boolean {
  const valor = Math.abs(pago ?? 0);
  return valor > 0 && valor < creditosDoRoteiro(duracaoSegundos, bytes);
}

/** Primeira parte: cobrada quando a esteira começa a trabalhar, antes da seleção. */
export function creditosDoRoteiro(duracaoSegundos: number, bytes?: number): number {
  const minutos = Math.ceil(duracaoSegundos / 60);
  let base = CREDITOS_DO_ROTEIRO_FIXOS + minutos * CREDITOS_DO_ROTEIRO_POR_MINUTO;
  // O excedente de arquivo é custo de transferência do ENVIO: fica na primeira parte.
  if (bytes) {
    const excedenteGb = Math.max(0, (bytes - bytesRecomendados(duracaoSegundos)) / 1073741824 - TOLERANCIA_GB);
    base += Math.ceil(excedenteGb * CREDITOS_POR_GB_EXTRA);
  }
  return base;
}

/**
 * Segunda parte: cobrada na aprovação, pelos cortes escolhidos e pelo completo.
 * `precoAntigo` vale para quem pagou o roteiro antes de 01/10 (ver
 * `roteiroPagoNoPrecoAntigo`).
 */
export function creditosDaAprovacao(duracaoSegundos: number, cortes: number, precoAntigo = false): number {
  const minutos = Math.ceil(duracaoSegundos / 60);
  const n = Math.max(0, Math.min(MAX_CORTES_APROVADOS, cortes));
  if (precoAntigo) {
    const a = PRECO_ATE_3009;
    return a.completoFixos + minutos * a.completoPorMinuto + n * a.porCorte;
  }
  return CREDITOS_DO_COMPLETO_FIXOS + minutos * CREDITOS_DO_COMPLETO_POR_MINUTO + n * CREDITOS_POR_CORTE_APROVADO;
}

/** O preço de um corte na aprovação, no preço novo ou no de até 30/09. */
export function creditosPorCorteAprovado(precoAntigo = false): number {
  return precoAntigo ? PRECO_ATE_3009.porCorte : CREDITOS_POR_CORTE_APROVADO;
}

/** As duas partes para a tela de envio: a primeira e o teto da segunda (3 cortes). */
export function creditosEmDuasPartes(
  duracaoSegundos: number,
  bytes?: number
): { roteiro: number; aprovacaoMax: number; porCorte: number; completo: number; total: number } {
  const roteiro = creditosDoRoteiro(duracaoSegundos, bytes);
  // A abertura com os melhores momentos (01/10) entra na segunda parte: ela
  // vem ligada em toda edição, e o cliente só tira na tela de roteiro. A conta
  // da tela de envio é a dos cortes SUGERIDOS (3); com até 8 aprováveis desde
  // 01/10, o teto de 8 mostraria um número que quase ninguém paga.
  const aprovacaoMax = creditosDaAprovacao(duracaoSegundos, CORTES_SUGERIDOS) + CREDITOS_DA_ABERTURA_DO_COMPLETO;
  return {
    roteiro,
    aprovacaoMax,
    porCorte: CREDITOS_POR_CORTE_APROVADO,
    completo: creditosDaAprovacao(duracaoSegundos, 0) + CREDITOS_DA_ABERTURA_DO_COMPLETO,
    total: roteiro + aprovacaoMax,
  };
}

/** "3.174": créditos como a tela mostra, com separador de milhar (01/10). */
export function creditosNaTela(n: number): string {
  return Math.round(n).toLocaleString("pt-BR");
}

/**
 * Créditos por GB acima do que a gravação recomendada geraria.
 *
 * De onde vem o 20: transferência sai por volta de R$ 0,60 por GB no desenho
 * atual (Blob transfer mais Fast Origin, e store privado paga as duas pernas),
 * e um crédito equivale a cerca de R$ 0,028 de custo variável na calibração da
 * Opção B. R$ 0,60 dividido por R$ 0,028 dá 21, arredondado para baixo. Ou
 * seja: cobre o custo mantendo a mesma margem dos outros créditos, sem punir.
 */
export const CREDITOS_POR_GB_EXTRA = 20;

/**
 * Folga antes de cobrar excedente. Sem ela, quem grava exatamente na taxa
 * recomendada leva 1 crédito a mais pelo arredondamento do contêiner e ainda
 * vê uma sugestão inútil de "economize 1 crédito" (pego no teste da mudança).
 * 150 MB cobre a variação de contêiner, faixa de áudio e metadados.
 */
export const TOLERANCIA_GB = 0.15;

/** Abaixo disso a sugestão não aparece: economia de 1 ou 2 créditos é ruído. */
export const ECONOMIA_MINIMA_PARA_SUGERIR = 5;

/** Quantos clipes um vídeo dessa duração rende. Sublinear de propósito: */
/** momento bom não escala junto com o tempo de gravação. */
export function clipesEstimados(duracaoSegundos: number): number {
  const minutos = duracaoSegundos / 60;
  return Math.max(3, Math.min(Math.round(minutos / 4), 15));
}

/** Bytes que a gravação recomendada geraria para essa duração. */
export function bytesRecomendados(duracaoSegundos: number): number {
  return (duracaoSegundos / 60) * MB_POR_MINUTO_RECOMENDADO * 1048576;
}

/**
 * Créditos do trabalho. O excedente de transferência entra só quando existe:
 * quem grava na taxa recomendada paga exatamente o mesmo de antes.
 */
export function creditosEstimados(
  duracaoSegundos: number,
  bytes?: number
): number {
  const minutos = Math.ceil(duracaoSegundos / 60);
  const base = CREDITOS_FIXOS_DA_EDICAO + minutos * CREDITOS_POR_MINUTO;

  if (!bytes) return base;

  const excedenteGb = Math.max(
    0,
    (bytes - bytesRecomendados(duracaoSegundos)) / 1073741824 - TOLERANCIA_GB
  );
  return base + Math.ceil(excedenteGb * CREDITOS_POR_GB_EXTRA);
}

export type Veredito =
  | {
      ok: true;
      mbPorMinuto: number;
      creditos: number;
      /** Quanto custaria gravando na taxa recomendada, para comparar. */
      creditosSeRecomendado: number;
      /** Preenchido quando vale sugerir gravar mais leve. */
      sugestao?: string;
      clipes: number;
    }
  | { ok: false; motivo: string; dica?: string };

/**
 * Roda no navegador, antes de subir um byte. O navegador já sabe a duração
 * (metadados do elemento video) e o tamanho do arquivo, então dá para avisar
 * na hora, com instrução, em vez de deixar a pessoa esperar o upload inteiro
 * para descobrir o custo.
 *
 * Desde 22/08 só recusa o que tecnicamente não funciona. Taxa de gravação alta
 * deixou de ser recusa e virou preço.
 */
export function validarVideo(
  bytes: number,
  duracaoSegundos: number,
  limites: LimitesDoEnvio = LIMITES_SEM_PLANO
): Veredito {
  if (!duracaoSegundos || !Number.isFinite(duracaoSegundos)) {
    return {
      ok: false,
      motivo: "Não consegui ler a duração desse arquivo.",
      dica: "Tente exportar em MP4. Alguns arquivos gravados por tela vêm sem os metadados de duração.",
    };
  }

  // O teto de duração é do PLANO desde 29/09, e a recusa diz qual plano
  // resolve: "o limite é 60" sem saída parece defeito, e com a saída escrita
  // vira escolha do cliente.
  if (duracaoSegundos > limites.duracaoMaximaSeg) {
    const min = Math.round(duracaoSegundos / 60);
    const doPlano = limites.plano ? ` no ${limites.plano}` : "";
    // O PAPEL (08/10): membro e conta ligada ao contrato só enviam até 5 minutos; a frase diz quem envia o longo.
    const papel = limites.papel;
    if (papel?.tipo === "membro" && duracaoSegundos > papel.duracaoMaximaMin * 60) {
      return {
        ok: false,
        motivo: `Esse vídeo tem ${min} minutos. ${fraseDoVideoLongoDoMembro(papel.duracaoMaximaMin, papel.contrato, papel.dono)}`,
        dica: `Corte no trecho mais forte e envie de novo, ou peça a ${papel.contrato ? "titular do contrato" : papel.dono?.trim() || "quem administra a conta"} para enviar o vídeo inteiro.`,
      };
    }
    // OS MINUTOS DO MÊS (08/10): quando o que barra é o total de minutos do
    // ciclo, e não o tamanho do arquivo, a frase diz isso, com o número do
    // cartão, e aponta o plano de cima pelos minutos dele.
    const m = limites.minutos;
    if (m && duracaoSegundos > m.restantes * 60 - 1e-9) {
      const sobe = limites.proximo?.minutosPorMes && duracaoSegundos <= (limites.proximo.minutosPorMes - m.usados) * 60 ? ` O ${limites.proximo.nome} tem ${limites.proximo.minutosPorMes} minutos por mês.` : "";
      const restam = m.restantes > 0 ? `ainda cabem ${duracaoPorExtenso(Math.floor(m.restantes) * 60)} este mês` : "os minutos deste mês já foram usados";
      return {
        ok: false,
        motivo: `Esse vídeo tem ${min} minutos; o ${limites.plano ?? "plano"} inclui ${duracaoPorExtenso(m.porMes * 60)} de vídeo editado por mês, e ${restam}.`,
        dica: `Corte no trecho mais forte e envie de novo, ou espere a próxima reposição.${sobe}`,
      };
    }
    const sobe =
      limites.proximo && duracaoSegundos <= limites.proximo.duracaoMaximaMin * 60
        ? ` O ${limites.proximo.nome} aceita até ${duracaoPorExtenso(limites.proximo.duracaoMaximaMin * 60)}.`
        : "";
    return {
      ok: false,
      motivo: `Esse vídeo tem ${min} minutos, e o limite${doPlano} é de ${duracaoPorExtenso(limites.duracaoMaximaSeg)}.`,
      dica: `Corte no trecho mais forte e envie de novo.${sobe}`,
    };
  }

  if (bytes > limites.bytesMaximo) {
    const gb = (bytes / 1073741824).toFixed(1).replace(".", ",");
    const teto = Math.round(limites.bytesMaximo / 1073741824);
    const minutos = Math.round(duracaoSegundos / 60);
    const estimadoRecomendado = (bytesRecomendados(duracaoSegundos) / 1073741824)
      .toFixed(1)
      .replace(".", ",");
    return {
      ok: false,
      motivo: `O arquivo tem ${gb} GB, e o limite${limites.plano ? ` do ${limites.plano}` : ""} é de ${teto} GB por arquivo.`,
      dica: `Gravando a 4000 Kbps no OBS (Configurações, Saída, Taxa de bits do vídeo), esses ${minutos} minutos ficariam em cerca de ${estimadoRecomendado} GB, com a mesma imagem para alguém falando.`,
    };
  }

  const mbPorMinuto = bytes / 1048576 / (duracaoSegundos / 60);
  const creditos = creditosEstimados(duracaoSegundos, bytes);
  const creditosSeRecomendado = creditosEstimados(
    duracaoSegundos,
    bytesRecomendados(duracaoSegundos)
  );

  const economia = creditos - creditosSeRecomendado;
  const sugestao =
    economia >= ECONOMIA_MINIMA_PARA_SUGERIR
      ? `Gravando a 4000 Kbps no OBS, esse mesmo vídeo custaria ${creditosNaTela(creditosSeRecomendado)} créditos em vez de ${creditosNaTela(creditos)}, com a mesma imagem. Você economiza ${creditosNaTela(economia)}.`
      : undefined;

  return {
    ok: true,
    mbPorMinuto,
    creditos,
    creditosSeRecomendado,
    sugestao,
    clipes: clipesEstimados(duracaoSegundos),
  };
}
