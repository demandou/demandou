import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db/prisma";
import { emailHabilitado, enviarEmail, emailDeConfirmacao, emailDeSenha } from "@/lib/email";
import { armazemDoBetterAuth } from "@/lib/seguranca/limite";

// Cada provedor entra sozinho quando as credenciais existem no ambiente, e o
// botão correspondente é gateado por NEXT_PUBLIC_*_AUTH=1 no cliente. Assim o
// código sobe antes das credenciais sem quebrar nada.
const socialProviders: Record<
  string,
  { clientId: string; clientSecret: string; scope?: string[] }
> = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}
// Reusa o app OAuth do LinkedIn que já publica posts; para o login funcionar,
// o app precisa do produto "Sign In with LinkedIn using OpenID Connect" e da
// redirect https://demandou.com/api/auth/callback/linkedin no painel deles.
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  socialProviders.linkedin = {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    // Publicar exige w_member_social, e pedir ja no login e o que deixa o
    // LinkedIn conectado sem segunda autorizacao (decisao de 21/08).
    //
    // AQUI, e nao no signIn.social do cliente: o provedor soma este campo aos
    // padroes (profile, email, openid) sem duplicar, conferido no fonte do
    // @better-auth/core. Passar pelo cliente somava em cima dos padroes que
    // ja estavam somados e o pedido saia com escopos duplicados.
    scope: ["w_member_social"],
  };
}

// Origens que o better-auth aceita. Sem isso, o navegador recebe "Invalid
// origin" sempre que a porta ou o domínio diferirem do baseURL configurado.
// Em desenvolvimento aceitamos as portas alternativas que o Next escolhe
// sozinho quando a 3000 está ocupada.
const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  "https://demandou.com",
  "https://www.demandou.com",
  ...(process.env.NODE_ENV === "production"
    ? []
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
      ]),
].filter((origin): origin is string => Boolean(origin));

/**
 * Registra o passo `cadastro` do funil para uma conta confirmada. Nunca lança:
 * medir não derruba confirmação de ninguém.
 */
async function contarCadastro(userId: string, cabecalhos: Headers | null, caminho: string) {
  try {
    const { registrarPasso, origemDoCookie, carimbarOrigemDoUsuario } = await import("@/lib/funil/eventos");
    const { extrairIp, hashIp } = await import("@/lib/demo/rate-limit");
    await registrarPasso("cadastro", {
      userId,
      caminho,
      ipHash: cabecalhos ? hashIp(extrairIp(cabecalhos)) : null,
    });
    await carimbarOrigemDoUsuario(userId, await origemDoCookie());
  } catch (e) {
    console.warn("[auth] não consegui contar o cadastro", e instanceof Error ? e.message : e);
  }
}

/**
 * AS PORTAS DO BETTER-AUTH QUE PASSAM PELA DEFESA CONTRA ROBÔ (01/10).
 *
 * O cadastro leva a prova completa (isca, carimbo, Turnstile, e-mail e nome).
 * Login, reenvio da confirmação e recuperação de senha só levam o limite por
 * IP e por e-mail, porque os três mandam e-mail (o login manda de novo a
 * confirmação para conta não confirmada) e e-mail para terceiro é o custo que
 * o robô gerava. Ver lib/anti-robo/porta.ts.
 */
const PORTAS_DO_AUTH: Record<string, "cadastro" | "login" | "reenvio" | "senha"> = {
  "/sign-up/email": "cadastro",
  "/sign-in/email": "login",
  "/send-verification-email": "reenvio",
  "/request-password-reset": "senha",
  "/forget-password": "senha",
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Exigir e-mail confirmado para entrar, MAS só quando existe como mandar
    // o e-mail. Ligar isto sem `RESEND_API_KEY` no ambiente trancaria o
    // produto inteiro: a pessoa se cadastra, nunca recebe nada, e nunca entra.
    // Amarrado à configuração, o código sobe hoje e a trava fecha sozinha no
    // instante em que a chave existir, sem precisar de outro deploy.
    requireEmailVerification: emailHabilitado(),
    /**
     * TROCAR OU DEFINIR A SENHA, desde 23/09.
     *
     * Não existia recuperação nenhuma até o CRM do painel precisar dela: a
     * conta criada pelo admin nasce sem senha, e é este mesmo link que a pessoa
     * usa para escolher a primeira. O better-auth cria a credencial quando ela
     * ainda não existe, então convite e esqueci-a-senha são o mesmo caminho.
     *
     * Conta sem NENHUM vínculo (nem senha, nem Google, nem LinkedIn) é conta
     * criada pelo admin, e recebe o texto de convite: dizer "você pediu para
     * trocar a senha" a quem nunca entrou é o desenho exato de golpe. Quem
     * entrou só pelo Google e pediu senha recebe o texto normal, que é o certo.
     */
    resetPasswordTokenExpiresIn: 60 * 60,
    /**
     * CADASTRO COM E-MAIL QUE JÁ TEM CONTA (08/10). O better-auth responde
     * igual ao cadastro de verdade (não ensina quem tem conta), e a pessoa
     * recebe na caixa dela o aviso "você já tem conta, entre aqui". Assim a
     * tela não precisa perguntar antes se o e-mail existe para a pessoa não
     * ficar presa, que foi o achado de 23/09.
     */
    async onExistingUserSignUp({ user }) {
      const { emailDeContaJaExiste } = await import("@/lib/email/seguranca");
      const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://demandou.com").replace(/\/$/, "");
      await enviarEmail({ ...emailDeContaJaExiste({ nome: user.name ?? null, url: `${base}/sign-in` }), para: user.email });
    },
    async sendResetPassword({ user, url }) {
      // BOAS-VINDAS DO CONTRATO (04/10): o link pedido pela ativação de um
      // contrato pago vai dentro do e-mail de boas-vindas, e não num segundo
      // e-mail de "escolha a senha". Ver lib/contratos/boas-vindas.ts.
      const { tirarBoasVindas } = await import("@/lib/contratos/boas-vindas");
      const bv = tirarBoasVindas(user.email);
      if (bv) {
        const { boasVindasDoContrato } = await import("@/lib/email/contratos");
        await enviarEmail({ ...boasVindasDoContrato({ nome: user.name ?? null, ...bv, url, definirSenha: true }), para: user.email });
        return;
      }
      const { prisma } = await import("@/lib/db/prisma");
      const vinculos = await prisma.account.count({ where: { userId: user.id } });
      const email = emailDeSenha({ nome: user.name ?? "", url, convite: vinculos === 0 });
      await enviarEmail({ ...email, para: user.email });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    // Também no login: quem se cadastrou ANTES desta mudança está com
    // `emailVerified: false` e bateria numa parede sem saída. Assim a
    // tentativa de entrar dispara um e-mail novo em vez de só recusar.
    sendOnSignIn: true,
    // Confirmou, está dentro. Mandar a pessoa digitar a senha de novo logo
    // depois de clicar no link é atrito sem ganho de segurança: quem clicou
    // provou que tem a caixa de e-mail.
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    /**
     * O CADASTRO ENTRA NO FUNIL AQUI, e não mais no navegador (01/10).
     *
     * Antes era o formulário que avisava "cadastro" logo depois de criar a
     * conta, com o e-mail ainda sem confirmar, e o robô roda o mesmo código da
     * tela: dos 97 cadastros contados em 30 dias, 86 eram contas de robô.
     * Confirmar o e-mail é o primeiro instante em que existe uma pessoa (ou ao
     * menos uma caixa de verdade) do outro lado. A origem da primeira visita
     * passa do cookie para o usuário no mesmo passo, como fazia o beacon.
     */
    async afterEmailVerification(user, request) {
      await contarCadastro(user.id, request?.headers ?? null, "/verify-email");
    },
    async sendVerificationEmail({ user, url }) {
      /**
       * A VAGA DE FUNDADOR ENTRA NO E-MAIL, quando ainda existe.
       *
       * O numero e contado no Stripe na hora do envio. O import e aqui dentro
       * de proposito: `lib/stripe` carrega o SDK, e este modulo e carregado em
       * toda requisicao autenticada, inclusive nas que nunca mandam e-mail.
       *
       * `vagasDeFundador` ja engole o proprio erro e devolve 0, e 0 esconde a
       * linha. Ou seja, Stripe fora do ar nao derruba o cadastro de ninguem:
       * o e-mail sai sem a oferta, que e o lado seguro de errar.
       */
      let vagas = 0;
      try {
        const { vagasDeFundador } = await import("@/lib/stripe");
        vagas = await vagasDeFundador();
      } catch {
        vagas = 0;
      }
      const email = emailDeConfirmacao(user.name ?? "", url, vagas);
      await enviarEmail({ ...email, para: user.email });
    },
  },
  socialProviders:
    Object.keys(socialProviders).length > 0 ? socialProviders : undefined,
  account: {
    accountLinking: {
      // Sem isto, quem criou a conta com senha e depois clica em "Continuar
      // com Google" no mesmo e-mail leva `account_not_linked` e não entra
      // nunca (achado do teste de jornada de 21/08).
      //
      // A recusa padrão existe para impedir que alguém crie conta social com
      // e-mail alheio e assuma a conta da vítima. O risco só existe quando o
      // provedor não confirma o e-mail; Google e LinkedIn confirmam antes de
      // emitir o token, então vincular pelo e-mail é seguro com eles, e só
      // com eles.
      enabled: true,
      trustedProviders: ["google", "linkedin"],
      // Segunda trava do better-auth, e a que realmente barrava: além do
      // provedor confiável, ele exige por padrão que a conta LOCAL já tenha
      // e-mail verificado. Como o cadastro por senha ainda não envia e-mail
      // de confirmação, todo usuário nasce com `emailVerified: false` e a
      // vinculação nunca aconteceria.
      //
      // Estava `false` desde 21/08, porque o cadastro por senha não mandava
      // e-mail de confirmação e todo usuário nascia com `emailVerified: false`,
      // o que fazia a vinculação nunca acontecer. Em 23/08 o envio passou a
      // existir, então a trava volta, e ela volta amarrada à MESMA condição do
      // `requireEmailVerification`: sem forma de mandar e-mail, ninguém
      // consegue verificar, e exigir verificado seria recriar o bloqueio que
      // esta linha existia para contornar.
      requireLocalEmailVerified: emailHabilitado(),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 dias
    updateAge: 60 * 60 * 24, // renova o cookie 1x/dia
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min sem bater no banco a cada request
    },
  },
  /**
   * O LIMITADOR NATIVO, LIGADO E NO BANCO (08/10). Por padrão ele só liga em
   * produção e conta em memória, que na Vercel é por instância e zera a cada
   * partida a frio. Aqui vale em todo ambiente (a prova de ponta a ponta roda
   * no dev local) e conta na tabela `limites_de_taxa`, por IP e por rota.
   * Cobre TODA rota do better-auth, inclusive as que a porta anti-robô não
   * olha: redefinição de senha pelo token, confirmação do e-mail, troca de
   * senha e de e-mail, callbacks sociais. Ver lib/seguranca/limite.ts.
   */
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customStorage: armazemDoBetterAuth(),
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-in/social": { window: 60, max: 10 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60, max: 3 },
      "/forget-password": { window: 60, max: 3 },
      "/send-verification-email": { window: 60, max: 3 },
      // O token da redefinição e o da confirmação chegam pela URL: quem
      // chuta token em laço bate aqui.
      "/reset-password": { window: 60, max: 5 },
      "/reset-password/*": { window: 60, max: 10 },
      "/verify-email": { window: 60, max: 10 },
      "/change-password": { window: 60, max: 5 },
      "/change-email": { window: 60, max: 5 },
      "/delete-user": { window: 60, max: 5 },
      "/callback/*": { window: 60, max: 20 },
      // Leitura da sessão: o cliente pergunta a cada tela e o cookie em cache
      // responde sem banco. Contar isso seria uma ida ao banco por tela.
      "/get-session": false,
      "/ok": false,
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const porta = PORTAS_DO_AUTH[ctx.path];
      if (!porta) return;
      // Sem requisição é chamada interna (auth.api no servidor, como o convite
      // do admin pedindo o link de senha): não é porta pública, não passa aqui.
      if (!ctx.request || !ctx.headers) return;
      const { conferirEnvio, hashDoEmail } = await import("@/lib/anti-robo/porta");
      const { lerProva, CABECALHO_DA_PROVA } = await import("@/lib/anti-robo/regras");
      const corpo = (ctx.body ?? {}) as { email?: unknown; name?: unknown };
      const email = typeof corpo.email === "string" ? corpo.email : null;
      const veredito = await conferirEnvio({
        porta,
        headers: ctx.headers,
        prova: lerProva(ctx.headers.get(CABECALHO_DA_PROVA)),
        email,
        nome: typeof corpo.name === "string" ? corpo.name : null,
      });
      if (!veredito.ok) {
        throw new APIError(veredito.status === 429 ? "TOO_MANY_REQUESTS" : "BAD_REQUEST", {
          message: veredito.mensagem,
          code: `ANTI_ROBO_${veredito.motivo.toUpperCase()}`,
        });
      }
      // O BLOQUEIO PROGRESSIVO (08/10): depois de 5 senhas erradas seguidas o
      // e-mail espera, e a espera cresce. Ver lib/seguranca/bloqueio-de-login.ts.
      if (porta === "login" && email && email.includes("@")) {
        const { conferirBloqueio, mensagemDoBloqueio } = await import("@/lib/seguranca/bloqueio-de-login");
        const estado = await conferirBloqueio(hashDoEmail(email));
        if (estado.bloqueado) {
          throw new APIError("TOO_MANY_REQUESTS", {
            message: mensagemDoBloqueio(estado.esperarS),
            code: "LOGIN_BLOQUEADO",
          });
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      // Só o login por senha tem "falha" que interessa contar. Chamada interna
      // (sem requisição) não é tentativa de ninguém.
      if (ctx.path !== "/sign-in/email" || !ctx.request || !ctx.headers) return;
      const corpo = (ctx.body ?? {}) as { email?: unknown };
      const email = typeof corpo.email === "string" ? corpo.email.trim().toLowerCase() : "";
      if (!email.includes("@")) return;
      const devolvido = ctx.context.returned;
      // 401 é senha errada (ou e-mail sem conta: a resposta é a mesma). 403 é
      // e-mail não confirmado, que só aparece com a senha certa: não é falha.
      const falhou = devolvido instanceof APIError && devolvido.statusCode === 401;
      const sucesso = !(devolvido instanceof APIError);
      if (!falhou && !sucesso) return;
      const { hashDoEmail } = await import("@/lib/anti-robo/porta");
      const { extrairIp, hashIp } = await import("@/lib/demo/rate-limit");
      const { registrarResultadoDoLogin } = await import("@/lib/seguranca/bloqueio-de-login");
      await registrarResultadoDoLogin({
        email,
        emailHash: hashDoEmail(email),
        ipHash: hashIp(extrairIp(ctx.headers)),
        falhou,
        agente: ctx.headers.get("user-agent")?.slice(0, 200) ?? null,
      });
    }),
  },
  databaseHooks: {
    user: {
      create: {
        /**
         * DE ONDE O CADASTRO VEIO, guardado na própria conta (01/10). Até aqui
         * nada disso existia, e o diagnóstico dos robôs não sabia dizer se as
         * 86 contas vinham de uma máquina ou de oitenta. IP com sal, nunca puro.
         *
         * Conta que JÁ NASCE confirmada (Google, LinkedIn) entra no funil aqui;
         * a de e-mail e senha entra quando confirmar (afterEmailVerification).
         */
        async after(user, ctx) {
          try {
            const cabecalhos = ctx?.headers ?? ctx?.request?.headers ?? null;
            if (cabecalhos) {
              const { extrairIp, hashIp } = await import("@/lib/demo/rate-limit");
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  cadastroIpHash: hashIp(extrairIp(cabecalhos)),
                  cadastroAgente: cabecalhos.get("user-agent")?.slice(0, 200) ?? null,
                },
              });
            }
            if (user.emailVerified && ctx?.request) await contarCadastro(user.id, cabecalhos, ctx.path ?? "/social");
          } catch (e) {
            console.warn("[auth] não consegui anotar a origem do cadastro", e instanceof Error ? e.message : e);
          }
        },
      },
    },
    session: {
      create: {
        /**
         * SEM E-MAIL CONFIRMADO, NÃO HÁ SESSÃO (01/10). É o que faz a conta só
         * virar "ativa" depois da confirmação, em todos os caminhos.
         *
         * O e-mail e senha já era barrado pelo better-auth. O buraco era o
         * login social: quando o provedor devolve o e-mail como NÃO confirmado,
         * o better-auth cria a conta, manda o link e ABRE A SESSÃO mesmo assim.
         * Com sessão, a pessoa chega ao checkout e aos agentes. Agora a sessão
         * espera o clique no link, como no e-mail e senha.
         *
         * Lido pelo adaptador do próprio better-auth, e não pelo Prisma direto,
         * porque no login social a conta pode ter acabado de nascer dentro da
         * mesma transação. Admin passa sempre (é acesso interno). E só vale
         * quando existe como mandar o e-mail, pela mesma razão do
         * `requireEmailVerification`: sem envio, ninguém confirmaria nunca.
         */
        async before(session, ctx) {
          if (!emailHabilitado() || !ctx) return;
          try {
            const dono = await ctx.context.internalAdapter.findUserById(session.userId);
            if (dono && !dono.emailVerified && (dono as { role?: string }).role !== "admin") return false;
          } catch (e) {
            console.warn("[auth] não consegui conferir a confirmação antes da sessão", e instanceof Error ? e.message : e);
          }
        },
      },
    },
  },
  advanced: {
    database: {
      generateId: false, // Prisma gera cuid() — mantém padrão do schema
    },
  },
});

export type Session = typeof auth.$Infer.Session;
