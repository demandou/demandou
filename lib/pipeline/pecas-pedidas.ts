/**
 * AS PEÇAS PEDIDAS, NO QUADRO E NO ESCRITÓRIO, DESDE O MINUTO DO PEDIDO (08/10/2026).
 *
 * O pedido do Bruno, testando como cliente: "pedi para gerar, foi para o
 * escritório, só que no quadro, na semana, não aparece nada. Pedi um post para
 * segunda, dia 12: eu queria ver um cardzinho, porque aí eu sei que eles
 * entenderam o que eu pedi". E, do escritório: "os mesmos cards que aparecem lá
 * embaixo no calendário aparecem na cabeça do agente".
 *
 * Por que o quadro ficava vazio: os cards da esteira só nascem quando o
 * trabalho DO DIA roda (o `saveCard` do redator), e antes dele há a pesquisa do
 * Roberto e a fila dos outros dias. A campanha de cinco dias passava a primeira
 * meia hora sem nada no quadro, e o último dia, quase a campanha inteira.
 *
 * O que já existia e conta tudo, sem coluna nova e sem chamada de IA:
 *
 *  - o CONFIG da execução: o formato de cada dia, a hora, as redes, o tema;
 *  - a linha "N dia(s) na fila: Segunda-feira 12, Terça-feira 13" que o
 *    `agendarCampanha` grava ao enfileirar (lib/pipeline/executar.ts), com o
 *    nome E o número de cada dia, já depois da regra do dia que passou;
 *  - o LOG da execução: quem pegou o dia, quem está escrevendo, desenhando ou
 *    revisando, a tentativa que falhou e a que foi a última;
 *  - as ENTREGAS: os posts da execução, de qualquer status (o cancelado
 *    também), que dizem que o dia virou peça de verdade.
 *
 * Daqui sai a lista das peças pedidas, uma por dia de cada campanha, com o dia,
 * a hora, o formato, as redes, a ETAPA e QUEM ESTÁ COM O CARD. O quadro desenha
 * o cartão "em produção" no dia certo; o escritório põe o mesmo cartão na
 * cabeça de quem está com ele e faz andar quem o leva para o próximo. As duas
 * telas leem esta mesma lista, e por isso contam a mesma história.
 *
 * A fila roda os trabalhos de uma campanha UM DE CADA VEZ e EM ORDEM (a
 * pesquisa, depois cada dia; a tentativa que falhou volta antes dos seguintes,
 * ver lib/fila/trabalhos.ts). Então a peça em produção é sempre a primeira da
 * fila que ainda não virou peça nem desistiu, e a pergunta "em que dia ela
 * está" tem uma resposta só.
 *
 * PURO de propósito: sem banco, sem React, relógio por parâmetro. A rota de
 * status manda os runs e as entregas; quem desenha chama daqui.
 */

import { AGENTES, ESPECIALISTAS_DE_REDE, type Agente } from "@/lib/squad/estado-do-squad";
import { etiquetaDaPeca } from "@/lib/posts/etiqueta-da-peca";
import { FUSO_PADRAO, instanteLocalSeguro } from "@/lib/fuso";

/**
 * Em que ponto a peça está.
 *
 * - `fila`: pedida, esperando a vez (a pesquisa ou o dia anterior);
 * - `pesquisa`: o Roberto pesquisando para a campanha inteira;
 * - `texto`, `arte`, `revisao`, `publicacao`: o dia em produção;
 * - `tentando`: uma tentativa falhou e a fila repete sozinha;
 * - `pausada`: a fila parou a campanha (saldo da plataforma) e retoma sozinha;
 * - `falhou`: a fila desistiu, ou a campanha fechou sem esta peça;
 * - `pronta`: virou post. O quadro mostra o cartão de verdade no lugar.
 */
export type EtapaDaPeca = "fila" | "pesquisa" | "texto" | "arte" | "revisao" | "publicacao" | "tentando" | "pausada" | "falhou" | "pronta";

/** O mínimo da execução que a lista precisa. É um recorte de `PipelineRun`. */
export type RunDaProgramacao = {
  id: string;
  status?: string | null;
  topic?: string | null;
  config?: unknown;
  logs?: unknown;
};

/** Um post da execução, de qualquer status: é a prova de que o dia virou peça. */
export type EntregaDaProgramacao = {
  runId?: string | null;
  dayOfWeek?: number | null;
  scheduledAt?: string | Date | null;
};

export type PecaPedida = {
  /** "pedida:<run>:<AAAA-MM-DD>": estável entre as leituras, e a chave do cartão. */
  id: string;
  runId: string;
  /** A data da peça, no calendário do cliente. */
  data: string;
  /** "09:00", a hora pedida. A peça pronta mostra a hora real do post. */
  hora: string | null;
  /** O instante previsto em milissegundos, para ordenar o dia. */
  quando: number;
  /** O dia da CAMPANHA (1 a 7), o mesmo `dayOfWeek` dos cards e dos posts. */
  dayOfWeek: number;
  weekOffset: number;
  /** O formato pedido, resolvido ("free" já vira o formato do dia). */
  tipo: string;
  /** "Carrossel", "Imagem", "Vídeo": o nome curto que o cartão mostra. */
  formato: string;
  /** As redes da campanha: "linkedin", "instagram". */
  redes: string[];
  /** O tema do dia, ou o da campanha. */
  tema: string | null;
  /** A posição na fila da campanha: a 0 é a primeira a ser feita. */
  ordem: number;
  etapa: EtapaDaPeca;
  /** A frase do cartão: "Lucas escrevendo o texto", "Na fila, depois de segunda". */
  detalhe: string;
  /** Quem está com o card agora (o agentId), ou nulo na fila e na falha. */
  agente: string | null;
  /** Quem trabalha junto na mesma peça, sem o card (o Xavier na thread). */
  ajudantes: string[];
  /** Por que falhou, na frase da esteira. Só em `falhou` e `tentando`. */
  motivo: string | null;
  /** Minutos sem novidade no log, com a peça em produção. 0 fora dela. */
  semNovidadeHaMin: number;
};

/** Sem registro novo há mais que isto, a peça em produção está "parada". */
export const MINUTOS_PARADA = 8;

type Linha = { agent?: unknown; message?: unknown; status?: unknown; timestamp?: unknown };

type ConfigLida = {
  campaignMode?: string;
  weekStart?: string;
  weeklySchedule?: Record<string, string | undefined>;
  postingTimes?: Record<string, string>;
  postingTimestamps?: Record<string, string>;
  singleScheduledAt?: string;
  singleDate?: string;
  singleTime?: string;
  singleContentType?: string;
  singlePlatform?: string;
  platforms?: string[];
  topicsPerDay?: Record<string, string>;
  videoJobId?: unknown;
};

// ─── os dias, pelo nome do log ───

const NOMES_DOS_DIAS: Array<[RegExp, number]> = [
  // O índice é o do `getUTCDay()`: domingo é 0.
  [/^domingo$/i, 0],
  [/^segunda(-feira)?$/i, 1],
  [/^ter[çc]a(-feira)?$/i, 2],
  [/^quarta(-feira)?$/i, 3],
  [/^quinta(-feira)?$/i, 4],
  [/^sexta(-feira)?$/i, 5],
  [/^s[áa]bado$/i, 6],
];

/** "Segunda-feira 12" (com o número) em qualquer ponto do texto, todas as vezes. */
const DIA_CITADO = /(Segunda-feira|Ter[çc]a-feira|Quarta-feira|Quinta-feira|Sexta-feira|S[áa]bado|Domingo)\s+(\d{1,2})\b/gi;

function diaDaSemanaPeloNome(nome: string): number | null {
  for (const [re, d] of NOMES_DOS_DIAS) if (re.test(nome.trim())) return d;
  return null;
}

function citacoes(texto: string): Array<{ semana: number; numero: number }> {
  const saida: Array<{ semana: number; numero: number }> = [];
  for (const m of texto.matchAll(DIA_CITADO)) {
    const semana = diaDaSemanaPeloNome(m[1]);
    if (semana !== null) saida.push({ semana, numero: Number(m[2]) });
  }
  return saida;
}

function somarDias(iso: string, n: number): Date {
  const d = new Date(`${iso}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

/**
 * A data do dia citado na fila, contada a partir do início da campanha, como o
 * `nomeDoDia` da esteira conta: início + (dia - 1) + 7 x semana. Devolve o dia
 * da campanha e a semana junto, que é a chave dos cards e dos posts.
 */
function dataDoDiaCitado(inicio: string, semana: number, numero: number): { data: string; dayOfWeek: number; weekOffset: number } | null {
  for (let n = 0; n < 35; n++) {
    const d = somarDias(inicio, n);
    if (d.getUTCDay() === semana && d.getUTCDate() === numero) {
      return { data: d.toISOString().slice(0, 10), dayOfWeek: (n % 7) + 1, weekOffset: Math.floor(n / 7) };
    }
  }
  return null;
}

/** O mesmo rodízio da esteira para o dia "livre" (lib/pipeline/executar.ts). */
const DO_DIA_LIVRE = ["text", "image", "poll", "image", "article"];
const DO_RECORRENTE: Record<number, string> = { 1: "text", 3: "image", 5: "poll" };

function tipoDoDia(config: ConfigLida, dayOfWeek: number): string {
  const pedido =
    config.campaignMode === "single"
      ? config.singleContentType ?? "text"
      : config.campaignMode === "recurring"
        ? DO_RECORRENTE[dayOfWeek] ?? "text"
        : config.weeklySchedule?.[String(dayOfWeek)] ?? "text";
  return pedido === "free" ? DO_DIA_LIVRE[(dayOfWeek - 1) % 5] : pedido;
}

/** As redes como a esteira as lê: as da janela; sem elas, o par antigo. */
function redesDaCampanha(config: ConfigLida): string[] {
  if (config.platforms?.length) return [...config.platforms];
  if (config.campaignMode === "single") {
    if (config.singlePlatform === "linkedin") return ["linkedin"];
    if (config.singlePlatform === "twitter") return ["twitter"];
  }
  return ["linkedin", "twitter"];
}

function horaNoFuso(d: Date, fuso: string): string {
  try {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: fuso });
  } catch {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: FUSO_PADRAO });
  }
}

/** A hora pedida e o instante, nas mesmas fontes e na mesma ordem do `getScheduledAt`. */
function horaDoDia(config: ConfigLida, data: string, dayOfWeek: number, weekOffset: number, fuso: string): { hora: string; quando: number } {
  const instante = (iso: string | undefined) => {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const exato =
    config.campaignMode === "single"
      ? instante(config.singleScheduledAt)
      : weekOffset === 0
        ? instante(config.postingTimestamps?.[String(dayOfWeek)])
        : null;
  if (exato) return { hora: horaNoFuso(exato, fuso), quando: exato.getTime() };
  const hora = (config.campaignMode === "single" ? config.singleTime : config.postingTimes?.[String(dayOfWeek)]) ?? "09:00";
  return { hora, quando: instanteLocalSeguro(data, hora, fuso).getTime() };
}

// ─── quem é quem no log ───

function agenteDoLog(nome: unknown): Agente | undefined {
  if (typeof nome !== "string") return undefined;
  const n = nome.trim().toLowerCase();
  if (!n || n === "sistema") return undefined;
  return AGENTES.find((a) => n === a.nome.toLowerCase() || n.startsWith(a.primeiroNome.toLowerCase()));
}

const ETAPA_DO_AGENTE = (id: string): EtapaDaPeca =>
  id === "diana-design" ? "arte" : id === "vera-veredito" ? "revisao" : id === "paulo-publicador" ? "publicacao" : id === "roberto-radar" ? "pesquisa" : "texto";

/** O que é da trilha do VÍDEO da campanha (roda ao lado do dia seguinte, sobre a peça já entregue). */
const DO_VIDEO = /^V[íi]deo de \d+\s*s|gerador de v[íi]deo do Google|^V[íi]deo de .+ na fila|Refazendo o v[íi]deo|Tentativa \d+ do v[íi]deo/i;

/** O nome do dia, curto, para a frase da fila ("depois de segunda"). */
const NOME_CURTO = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const nomeCurtoDe = (data: string) => NOME_CURTO[new Date(`${data}T12:00:00.000Z`).getUTCDay()];

/** A frase da etapa, com quem está nela. */
function fraseDaEtapa(etapa: EtapaDaPeca, agente: Agente | undefined, ultima: string): string {
  const quem = agente?.primeiroNome;
  switch (etapa) {
    case "pesquisa":
      return "Roberto pesquisando o tema";
    case "texto":
      return quem ? `${quem} escrevendo o texto` : "Escrevendo o texto";
    case "arte": {
      const lamina = ultima.match(/L[âa]mina (\d+)\/(\d+) pronta/i);
      if (lamina) return `Diana: lâmina ${lamina[1]} de ${lamina[2]} pronta`;
      if (/Roteiro do carrossel|carrossel/i.test(ultima)) return "Diana criando o carrossel";
      if (/infogr[áa]fico/i.test(ultima)) return "Diana criando o infográfico";
      if (/quadro|v[íi]deo/i.test(ultima)) return "Diana criando o quadro do vídeo";
      return "Diana criando a arte";
    }
    case "revisao":
      return "Vera revisando a peça";
    case "publicacao":
      return "Paulo arrumando no calendário";
    default:
      return "";
  }
}

type Acumulado = {
  peca: Omit<PecaPedida, "etapa" | "detalhe" | "agente" | "ajudantes" | "motivo" | "semNovidadeHaMin">;
  semana: number;
  numero: number;
  /** As linhas do log que são deste dia (de quem trabalhou nele). */
  linhas: Linha[];
  falhas: string[];
  tentando: string | null;
  desistiu: boolean;
  dispensada: boolean;
  entregueNoLog: boolean;
};

const JANELA_DO_MESMO_DIA_MS = 3.5 * 86_400_000;

/** A lista das peças pedidas de UMA execução. Ver `pecasPedidas`. */
export function pecasDoRun(run: RunDaProgramacao, entregas: EntregaDaProgramacao[], agora: Date = new Date(), fuso: string | null = null): PecaPedida[] {
  const config = (run.config ?? {}) as ConfigLida;
  // A semana do VÍDEO tem esteira própria e cards de espera desde o minuto
  // zero (lib/media/quadro-do-video.ts): ela não passa por aqui.
  if (typeof config.videoJobId === "string") return [];
  if (run.status === "cancelled") return [];
  const inicio = /^\d{4}-\d{2}-\d{2}/.test(config.weekStart ?? "") ? config.weekStart!.slice(0, 10) : null;
  if (!inicio) return [];
  const linhas = (Array.isArray(run.logs) ? run.logs : []) as Linha[];
  const fusoDoProjeto = fuso?.trim() || FUSO_PADRAO;

  // 1. A fila, como a esteira a gravou.
  const iFila = linhas.findIndex((l) => typeof l.message === "string" && /dia\(s\) na fila:/i.test(l.message));
  if (iFila < 0) return [];
  const textoDaFila = String(linhas[iFila].message).split(/na fila:/i)[1]?.split(/\.\s/)[0] ?? "";
  const pedidos: Acumulado[] = [];
  for (const c of citacoes(textoDaFila)) {
    const onde = dataDoDiaCitado(inicio, c.semana, c.numero);
    if (!onde || pedidos.some((p) => p.peca.data === onde.data)) continue;
    const tipo = tipoDoDia(config, onde.dayOfWeek);
    const { hora, quando } = horaDoDia(config, onde.data, onde.dayOfWeek, onde.weekOffset, fusoDoProjeto);
    pedidos.push({
      peca: {
        id: `pedida:${run.id}:${onde.data}`,
        runId: run.id,
        data: onde.data,
        hora,
        quando,
        dayOfWeek: onde.dayOfWeek,
        weekOffset: onde.weekOffset,
        tipo,
        formato: etiquetaDaPeca({ mediaType: tipo }).tipo,
        redes: redesDaCampanha(config),
        tema: config.topicsPerDay?.[String(onde.dayOfWeek)]?.trim() || run.topic?.trim() || null,
        ordem: pedidos.length,
      },
      semana: c.semana,
      numero: c.numero,
      linhas: [],
      falhas: [],
      tentando: null,
      desistiu: false,
      dispensada: false,
      entregueNoLog: false,
    });
  }
  if (!pedidos.length) return [];

  const entregue = (p: Acumulado) =>
    p.entregueNoLog ||
    entregas.some((e) => {
      if (e.runId !== run.id || e.dayOfWeek !== p.peca.dayOfWeek) return false;
      if (!e.scheduledAt) return true;
      const t = new Date(e.scheduledAt).getTime();
      return Number.isNaN(t) || Math.abs(t - p.peca.quando) < JANELA_DO_MESMO_DIA_MS;
    });
  const pendente = (p: Acumulado) => !entregue(p) && !p.desistiu && !p.dispensada;
  const citado = (texto: string): Acumulado | null => {
    for (const c of citacoes(texto)) {
      const p = pedidos.find((x) => x.semana === c.semana && x.numero === c.numero);
      if (p) return p;
    }
    return null;
  };

  // 2. O log, em ordem.
  let pesquisaPronta = false;
  let pesquisaTentando: string | null = null;
  let corrente = null as Acumulado | null;
  let ultimaFalha = null as Acumulado | null;
  let ultimoEm = 0;
  for (let i = iFila + 1; i < linhas.length; i++) {
    const l = linhas[i];
    const msg = typeof l.message === "string" ? l.message : "";
    const em = typeof l.timestamp === "string" ? new Date(l.timestamp).getTime() : NaN;
    if (!Number.isNaN(em)) ultimoEm = em;
    if (/Pesquisa guardada/i.test(msg)) {
      pesquisaPronta = true;
      pesquisaTentando = null;
      continue;
    }
    const daPesquisa = msg.match(/Tentativa \d+ da pesquisa falhou e (vai repetir|foi a última)[^:]*:\s*(.*)$/i);
    if (daPesquisa) {
      if (/foi a última/i.test(daPesquisa[1])) pesquisaPronta = true;
      else pesquisaTentando = daPesquisa[2] || "a pesquisa falhou";
      continue;
    }
    const falhaDoDia = msg.match(/^O dia (.+?) não pôde ser gerado \((.*)\)\.?$/i);
    if (falhaDoDia) {
      const p: Acumulado | null = citado(falhaDoDia[1]) ?? corrente;
      if (p) {
        p.falhas.push(falhaDoDia[2]);
        p.tentando = falhaDoDia[2];
        ultimaFalha = p;
      }
      continue;
    }
    const daFila = msg.match(/Tentativa \d+ do dia falhou e (vai repetir|foi a última)[^:]*:\s*(.*)$/i);
    if (daFila) {
      // A fila não diz o dia: é o que acabou de falhar, ou o que estava em produção.
      const p: Acumulado | null = ultimaFalha ?? corrente ?? pedidos.find(pendente) ?? null;
      if (p) {
        if (!p.falhas.length || p.falhas.at(-1) !== daFila[2]) p.falhas.push(daFila[2]);
        if (/foi a última/i.test(daFila[1])) {
          p.desistiu = true;
          p.tentando = null;
          if (corrente === p) corrente = null;
        } else {
          p.tentando = daFila[2] || p.tentando || "a tentativa falhou";
        }
      }
      ultimaFalha = null;
      continue;
    }
    if (/não está mais na semana pedida e foi dispensado/i.test(msg)) {
      const p = citado(msg);
      if (p) p.dispensada = true;
      continue;
    }
    if (/já tinha as peças de uma tentativa anterior/i.test(msg)) {
      const p = citado(msg);
      if (p) p.entregueNoLog = true;
      continue;
    }
    if (DO_VIDEO.test(msg)) continue;

    const agente = agenteDoLog(l.agent);
    const doDia = citado(msg);
    // O começo de um dia: quem trabalha cita o dia ("Escreva um post de LinkedIn
    // para Segunda-feira 12"), e a esteira também ("Segunda-feira 12: image").
    if (doDia && (agente || /^\S+(-feira)?\s+\d{1,2}:/.test(msg))) {
      if (doDia !== corrente) {
        corrente = doDia;
        doDia.tentando = null;
      }
      pesquisaPronta = true;
    }
    if (!agente) continue;
    if (!pesquisaPronta) continue; // a pesquisa é da campanha inteira, e não de um dia
    if (!corrente) corrente = pedidos.find(pendente) ?? null;
    if (corrente) {
      corrente.linhas.push(l);
      if (corrente.tentando && l.status === "running") corrente.tentando = null;
    }
  }

  // 3. A etapa de cada peça.
  const ativa = run.status === "running" || run.status === "paused" || run.status === "pending";
  const pausada = run.status === "paused";
  const minutosDesde = (ms: number) => (ms ? Math.max(0, Math.floor((agora.getTime() - ms) / 60_000)) : 0);
  // A primeira pendente da fila é a que está sendo feita: a fila não pula.
  const emProducao = ativa ? (corrente && pendente(corrente) ? corrente : pedidos.find(pendente) ?? null) : null;
  const saida: PecaPedida[] = [];
  for (const p of pedidos) {
    if (p.dispensada) continue;
    const base = { ...p.peca, ajudantes: [] as string[], motivo: null as string | null, semNovidadeHaMin: 0 };
    if (entregue(p)) {
      saida.push({ ...base, etapa: "pronta", detalhe: "Pronta", agente: null });
      continue;
    }
    // Campanha fechada sem esta peça: só é cartão se ela FALHOU. Sem falha
    // registrada (o cliente cancelou a peça, arquivou a semana), não há o que
    // dizer no quadro.
    if (p.desistiu || (!ativa && p.falhas.length)) {
      saida.push({ ...base, etapa: "falhou", detalhe: "Não saiu", agente: null, motivo: p.falhas.at(-1) ?? "a geração falhou" });
      continue;
    }
    if (!ativa) continue;
    if (pausada) {
      saida.push({ ...base, etapa: "pausada", detalhe: "A fila está pausada e retoma sozinha", agente: null });
      continue;
    }
    if (!pesquisaPronta) {
      saida.push({
        ...base,
        etapa: pesquisaTentando ? "tentando" : "pesquisa",
        detalhe: pesquisaTentando ? "A pesquisa deu erro; a fila tenta de novo sozinha" : fraseDaEtapa("pesquisa", undefined, ""),
        agente: "roberto-radar",
        motivo: pesquisaTentando,
        semNovidadeHaMin: minutosDesde(ultimoEm),
      });
      continue;
    }
    if (p !== emProducao) {
      const antes = emProducao && emProducao.peca.ordem < p.peca.ordem ? emProducao : null;
      saida.push({ ...base, etapa: "fila", detalhe: antes ? `Na fila, depois de ${nomeCurtoDe(antes.peca.data)}` : "Na fila", agente: null });
      continue;
    }
    if (p.tentando) {
      saida.push({ ...base, etapa: "tentando", detalhe: "Deu erro; a fila tenta de novo sozinha", agente: null, motivo: p.tentando, semNovidadeHaMin: minutosDesde(ultimoEm) });
      continue;
    }
    saida.push({ ...base, ...quemEstaComOCard(p.linhas), semNovidadeHaMin: minutosDesde(ultimoEm) });
  }
  return saida;
}

/**
 * QUEM ESTÁ COM O CARD de um dia em produção, lido das linhas do log dele.
 *
 * O dono é quem escreveu por último. Com uma exceção, que é a do escritório:
 * os redatores escrevem EM PARALELO (o Lucas no LinkedIn e o Xavier na thread
 * rodam juntos, e os logs se intercalam). Dar o card a quem logou por último
 * faria o card pular de um para o outro a cada linha, e no escritório isso é
 * gente andando sem parar. Na escrita, o card é do redator PRINCIPAL (o
 * primeiro a pegar o dia, o Lucas quando há LinkedIn), e os outros trabalham
 * junto, sem card. Depois que a Diana ou a Vera pegaram o dia, um redator que
 * volta a escrever é a CORREÇÃO, e aí o card é dele.
 */
export function quemEstaComOCard(linhas: Linha[]): Pick<PecaPedida, "etapa" | "detalhe" | "agente" | "ajudantes"> {
  const comAgente = linhas.map((l) => ({ l, a: agenteDoLog(l.agent) })).filter((x): x is { l: Linha; a: Agente } => Boolean(x.a));
  const ultima = comAgente.at(-1);
  if (!ultima) return { etapa: "texto", detalhe: "Começando o dia", agente: null, ajudantes: [] };
  const redator = (a: Agente) => ESPECIALISTAS_DE_REDE.includes(a.id);
  const passouDaEscrita = comAgente.some((x) => !redator(x.a) && x.a.id !== "roberto-radar");
  let dono = ultima.a;
  let ajudantes: string[] = [];
  if (redator(dono) && !passouDaEscrita) {
    const redatores = [...new Set(comAgente.filter((x) => redator(x.a)).map((x) => x.a.id))];
    const principal = redatores.includes("lucas-linkedin") ? "lucas-linkedin" : redatores[0];
    dono = AGENTES.find((a) => a.id === principal) ?? dono;
    // Ajudante é quem escreve AGORA: o último registro dele ainda é de trabalho.
    ajudantes = redatores.filter((id) => {
      if (id === dono.id) return false;
      const dele = comAgente.filter((x) => x.a.id === id).at(-1);
      return dele?.l.status === "running" && !/conclu[íi]da/i.test(String(dele.l.message ?? ""));
    });
  }
  const etapa = ETAPA_DO_AGENTE(dono.id);
  // A frase da arte lê a última linha DA DIANA, e não a última de todas.
  const ultimaDoDono = comAgente.filter((x) => x.a.id === dono.id).at(-1);
  return { etapa, detalhe: fraseDaEtapa(etapa, dono, String(ultimaDoDono?.l.message ?? "")), agente: dono.id, ajudantes };
}

/**
 * AS PEÇAS PEDIDAS de todas as execuções que a semana enxerga, em ordem de
 * data e hora. Inclui as `pronta` (para o escritório saber que o card foi
 * entregue); o quadro desenha o cartão em produção só das outras.
 */
export function pecasPedidas({
  runs,
  entregas,
  agora = new Date(),
  fuso = null,
}: {
  runs: RunDaProgramacao[];
  entregas: EntregaDaProgramacao[];
  agora?: Date;
  fuso?: string | null;
}): PecaPedida[] {
  return runs
    .flatMap((r) => pecasDoRun(r, entregas, agora, fuso))
    .sort((a, b) => a.quando - b.quando || a.ordem - b.ordem);
}

/** As peças que viram CARTÃO EM PRODUÇÃO num dia do quadro (a pronta tem o cartão de verdade). */
export function pecasEmProducaoNoDia(pecas: PecaPedida[], data: string): PecaPedida[] {
  return pecas.filter((p) => p.data === data && p.etapa !== "pronta");
}

// ─── o escritório ───

/** O card que vai na cabeça do agente: o mesmo cartão do quadro, em poucas palavras. */
export type CardNaCabeca = {
  pecaId: string;
  /** "Seg 12": o dia, como o quadro o mostra no topo da coluna. */
  dia: string;
  hora: string | null;
  formato: string;
  redes: string[];
  etapa: EtapaDaPeca;
};

const DIA_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function cardDaPeca(p: Pick<PecaPedida, "id" | "data" | "hora" | "formato" | "redes" | "etapa">): CardNaCabeca {
  const d = new Date(`${p.data}T12:00:00.000Z`);
  return {
    pecaId: p.id,
    dia: `${DIA_CURTO[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2, "0")}`,
    hora: p.hora,
    formato: p.formato,
    redes: p.redes,
    etapa: p.etapa,
  };
}

/**
 * Os cards na cabeça de cada agente: só de quem ESTÁ COM o card (a peça em
 * produção). Na pesquisa, o Roberto segura as peças todas da campanha, e o
 * escritório mostra a primeira com o "+N". A peça na fila não está na cabeça
 * de ninguém: ninguém pegou ainda.
 */
export function cardsNaCabeca(pecas: PecaPedida[]): Record<string, CardNaCabeca[]> {
  const saida: Record<string, CardNaCabeca[]> = {};
  for (const p of pecas) {
    if (!p.agente || p.etapa === "pronta" || p.etapa === "falhou" || p.etapa === "fila") continue;
    (saida[p.agente] ??= []).push(cardDaPeca(p));
  }
  return saida;
}

/** Quem trabalha junto numa peça, sem o card, e em qual (para o documentinho na cabeça). */
export function ajudandoNaPeca(pecas: PecaPedida[]): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const p of pecas) for (const a of p.ajudantes) if (!saida[a] && p.etapa !== "pronta") saida[a] = p.id;
  return saida;
}

/** Uma entrega de card: quem leva, para quem ("voce" é a sua mesa: virou peça no calendário). */
export type PassagemDoCard = { pecaId: string; de: string; para: string; card: CardNaCabeca };

/**
 * AS PASSAGENS DE CARD entre duas leituras: é o que faz alguém andar no
 * escritório, e só isso (pedido do Bruno: "só anda quem está levando o card que
 * está na cabeça dele para o próximo").
 *
 * - o dono mudou de A para B: A leva o card até B;
 * - o card de A virou peça pronta: A leva até a sua mesa (o calendário);
 * - a peça saiu da fila de A para ninguém (falhou, voltou para a fila, a semana
 *   mudou na tela): ninguém anda, o card só some.
 *
 * `antes` é o dono de cada peça na leitura anterior. A primeira leitura (antes
 * vazio) não anda ninguém: quem abre a tela no meio da campanha vê cada um na
 * sua mesa com o seu card, e não uma procissão.
 */
export function passagensDoCard(antes: Record<string, string | null>, depois: PecaPedida[]): PassagemDoCard[] {
  const saida: PassagemDoCard[] = [];
  for (const p of depois) {
    const de = antes[p.id];
    if (!de) continue;
    if (p.etapa === "pronta") {
      saida.push({ pecaId: p.id, de, para: "voce", card: cardDaPeca(p) });
      continue;
    }
    if (p.agente && p.agente !== de && p.etapa !== "fila" && p.etapa !== "falhou") {
      // Da pesquisa para o primeiro dia, o Roberto entrega UMA peça, a que o
      // redator pegou; as outras continuam na fila, sem ninguém andar com elas.
      saida.push({ pecaId: p.id, de, para: p.agente, card: cardDaPeca(p) });
    }
  }
  return saida;
}

/** O dono de cada peça agora, para a próxima comparação de `passagensDoCard`. */
export function donosDasPecas(pecas: PecaPedida[]): Record<string, string | null> {
  const saida: Record<string, string | null> = {};
  for (const p of pecas) saida[p.id] = p.etapa === "pronta" ? null : p.agente;
  return saida;
}

/**
 * HÁ PROJETO ACONTECENDO? Com peça pedida em produção (ou na fila), o
 * escritório está em horário de trabalho: todo mundo na sua mesa, sem café,
 * sem passeio e sem visita à sua sala. Livres para andar e conversar só quando
 * não há nada acontecendo.
 */
export function haProjetoAcontecendo(pecas: PecaPedida[]): boolean {
  return pecas.some((p) => p.etapa !== "pronta" && p.etapa !== "falhou");
}
