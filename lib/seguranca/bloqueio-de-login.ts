/**
 * O BLOQUEIO PROGRESSIVO DO LOGIN (08/10/2026).
 *
 * A porta anti-robô limita quantas vezes um e-mail pode TENTAR entrar numa
 * janela (6 em 15 minutos), mas conta tentativas, e não falhas: quem erra a
 * senha cinco vezes e acerta na sexta é gente; quem erra cinquenta vezes é
 * programa testando senhas. Aqui a conta é das FALHAS, e a espera cresce com
 * elas: 5 falhas, um minuto; 10, quinze minutos; 20, seis horas; 30, um dia.
 * Um acerto zera a conta.
 *
 * A chave é o e-mail (com sal), exista a conta ou não: a resposta para um
 * e-mail inexistente é a mesma, então o bloqueio não ensina quem tem conta.
 * O lado ruim, dito por inteiro: alguém que conheça o e-mail de um cliente
 * pode trancá-lo por um tempo errando a senha de propósito. A saída é
 * "Esqueci a senha", que não passa por aqui, e o dono é avisado quando um
 * e-mail chega a 10 e a 20 falhas, para enxergar o ataque.
 *
 * Este módulo é puro até a linha do depósito: a regra se prova sem banco.
 */

const MINUTO = 60_000;
const HORA = 60 * MINUTO;

/** A partir de quantas falhas seguidas a espera começa. */
export const FALHAS_PARA_BLOQUEAR = 5;

/** Em quantas falhas o dono é avisado. */
export const FALHAS_QUE_AVISAM = [10, 20] as const;

/** Quanto tempo esperar depois da última falha, dado o total de falhas seguidas. */
export function duracaoDoBloqueioMs(falhas: number): number {
  if (falhas < FALHAS_PARA_BLOQUEAR) return 0;
  if (falhas < 8) return MINUTO;
  if (falhas < 10) return 5 * MINUTO;
  if (falhas < 15) return 15 * MINUTO;
  if (falhas < 20) return HORA;
  if (falhas < 30) return 6 * HORA;
  return 24 * HORA;
}

export type Historico = {
  /** Falhas desde o último acerto (dentro de 24 h). */
  falhas: number;
  /** Quando foi a última falha. Null sem falha. */
  ultimaFalhaEm: Date | null;
};

export type EstadoDoBloqueio = { bloqueado: false } | { bloqueado: true; esperarS: number; falhas: number };

/** Pura: dado o histórico e a hora, está bloqueado? */
export function estadoDoBloqueio(h: Historico, agora = new Date()): EstadoDoBloqueio {
  const duracao = duracaoDoBloqueioMs(h.falhas);
  if (!duracao || !h.ultimaFalhaEm) return { bloqueado: false };
  const ate = h.ultimaFalhaEm.getTime() + duracao;
  if (agora.getTime() >= ate) return { bloqueado: false };
  return { bloqueado: true, esperarS: Math.max(1, Math.ceil((ate - agora.getTime()) / 1000)), falhas: h.falhas };
}

/** A frase da tela. Genérica de propósito: não diz se a conta existe. */
export function mensagemDoBloqueio(esperarS: number): string {
  const min = Math.ceil(esperarS / 60);
  const tempo = min >= 120 ? `${Math.ceil(min / 60)} horas` : min > 1 ? `${min} minutos` : "um minuto";
  return `Muitas tentativas de entrar com este e-mail. Espere ${tempo} e tente de novo, ou use "Esqueci a senha".`;
}

export type DepositoDoBloqueio = {
  historico(emailHash: string, agora: Date): Promise<Historico>;
  registrar(args: { emailHash: string; ipHash: string; falhou: boolean; agente: string | null }): Promise<void>;
  /** Avisa o dono; devolve quantos admins foram avisados. Dedup é por chave. */
  avisarDono(args: { email: string; falhas: number; ipHash: string; agora: Date }): Promise<number>;
};

const ROTA_FALHA = "login_falha";
const ROTA_OK = "login_ok";

async function depositoDoPrisma(): Promise<DepositoDoBloqueio> {
  const { prisma } = await import("@/lib/db/prisma");
  return {
    async historico(emailHash, agora) {
      const desde = new Date(agora.getTime() - 24 * HORA);
      const ultimoOk = await prisma.tentativaPublica.findFirst({
        where: { rota: ROTA_OK, emailHash, createdAt: { gte: desde } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      const aPartirDe = ultimoOk ? ultimoOk.createdAt : desde;
      const [falhas, ultima] = await Promise.all([
        prisma.tentativaPublica.count({ where: { rota: ROTA_FALHA, emailHash, createdAt: { gt: aPartirDe } } }),
        prisma.tentativaPublica.findFirst({
          where: { rota: ROTA_FALHA, emailHash, createdAt: { gt: aPartirDe } },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
      ]);
      return { falhas, ultimaFalhaEm: ultima?.createdAt ?? null };
    },
    async registrar(a) {
      await prisma.tentativaPublica.create({
        data: { rota: a.falhou ? ROTA_FALHA : ROTA_OK, ipHash: a.ipHash, emailHash: a.emailHash, aceita: !a.falhou, motivo: a.falhou ? "senha_errada" : null, agente: a.agente },
      });
    },
    async avisarDono(a) {
      const { notificar } = await import("@/lib/notificacoes");
      const { enviarEmail } = await import("@/lib/email");
      const { emailDeAtaqueAoLogin } = await import("@/lib/email/seguranca");
      const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true, email: true, name: true } });
      const dia = a.agora.toISOString().slice(0, 10);
      const chave = `bloqueio-login:${a.email}:${dia}:${a.falhas}`;
      let avisados = 0;
      for (const adm of admins) {
        const r = await notificar({
          userId: adm.id,
          tipo: "falha",
          titulo: `Ataque ao login: ${a.falhas} senhas erradas em ${a.email}`,
          texto: `O e-mail ${a.email} recebeu ${a.falhas} tentativas de senha errada hoje e está bloqueado por um tempo. Se for cliente, avise a pessoa para usar "Esqueci a senha".`,
          link: "/admin/usuarios",
          chave,
        });
        if (!r.nova) continue;
        avisados++;
        await enviarEmail({ ...emailDeAtaqueAoLogin({ nome: adm.name, email: a.email, falhas: a.falhas, ipHash: a.ipHash, agora: a.agora }), para: adm.email });
      }
      return avisados;
    },
  };
}

let depositoDeTeste: DepositoDoBloqueio | null = null;
export function usarDepositoDoBloqueio(dep: DepositoDoBloqueio | null): void {
  depositoDeTeste = dep;
}
async function deposito(): Promise<DepositoDoBloqueio> {
  return depositoDeTeste ?? depositoDoPrisma();
}

/** Antes de conferir a senha: este e-mail está em espera? Nunca lança. */
export async function conferirBloqueio(emailHash: string, agora = new Date()): Promise<EstadoDoBloqueio> {
  try {
    const dep = await deposito();
    return estadoDoBloqueio(await dep.historico(emailHash, agora), agora);
  } catch (e) {
    console.warn("[bloqueio-login] não consegui ler o histórico", e instanceof Error ? e.message : e);
    return { bloqueado: false };
  }
}

/**
 * Depois da resposta do login: anota a falha (ou o acerto) e, nos marcos,
 * avisa o dono. Nunca lança: medir não derruba o login de ninguém.
 */
export async function registrarResultadoDoLogin(args: {
  email: string;
  emailHash: string;
  ipHash: string;
  falhou: boolean;
  agente: string | null;
  agora?: Date;
}): Promise<{ falhas: number; avisados: number }> {
  const agora = args.agora ?? new Date();
  try {
    const dep = await deposito();
    await dep.registrar({ emailHash: args.emailHash, ipHash: args.ipHash, falhou: args.falhou, agente: args.agente });
    if (!args.falhou) return { falhas: 0, avisados: 0 };
    const h = await dep.historico(args.emailHash, agora);
    let avisados = 0;
    if ((FALHAS_QUE_AVISAM as readonly number[]).includes(h.falhas)) {
      avisados = await dep.avisarDono({ email: args.email, falhas: h.falhas, ipHash: args.ipHash, agora });
    }
    return { falhas: h.falhas, avisados };
  } catch (e) {
    console.warn("[bloqueio-login] não consegui registrar", e instanceof Error ? e.message : e);
    return { falhas: 0, avisados: 0 };
  }
}
