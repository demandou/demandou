import type { Email } from "@/lib/email";

/**
 * OS E-MAILS DE SEGURANÇA (08/10/2026). Texto puro, sem botão: são avisos
 * internos para o dono, e o que importa é ler rápido.
 */

function dataHora(d: Date): string {
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** O dono fica sabendo que um e-mail está levando senha errada em série. */
export function emailDeAtaqueAoLogin(args: { nome: string | null; email: string; falhas: number; ipHash: string; agora: Date }): Omit<Email, "para"> {
  const oi = (args.nome ?? "").trim().split(/\s+/)[0] || "";
  return {
    assunto: `Demandou: ${args.falhas} senhas erradas em ${args.email}`,
    texto: [
      oi ? `${oi}, um aviso de segurança.` : "Um aviso de segurança.",
      "",
      `O e-mail ${args.email} recebeu ${args.falhas} tentativas de senha errada em sequência (última em ${dataHora(args.agora)}).`,
      "O login desse e-mail está em espera progressiva: quanto mais falhas, mais tempo até a próxima tentativa.",
      "",
      "Se for um cliente, avise a pessoa para usar \"Esqueci a senha\": a redefinição não passa pelo bloqueio.",
      "Se o e-mail não é de ninguém conhecido, é um robô testando senhas e não há nada a fazer: a espera cresce sozinha.",
      "",
      `Origem (IP com sal, para cruzar no painel): ${args.ipHash}.`,
      "",
      "Este aviso sai uma vez por marco (10 e 20 falhas) por dia, para cada e-mail.",
    ].join("\n"),
  };
}

/**
 * Quem tenta criar conta com um e-mail que já tem conta recebe este e-mail,
 * e não a tela. É o que mantém a resposta do cadastro igual para todo mundo
 * (quem digita um e-mail alheio não descobre nada) sem deixar a pessoa de
 * verdade presa: ela abre a caixa e encontra o caminho.
 */
export function emailDeContaJaExiste(args: { nome: string | null; url: string }): Omit<Email, "para"> {
  const oi = (args.nome ?? "").trim().split(/\s+/)[0] || "";
  return {
    assunto: "Você já tem conta na Demandou",
    texto: [
      oi ? `${oi}, alguém (provavelmente você) tentou criar uma conta com este e-mail agora há pouco.` : "Alguém (provavelmente você) tentou criar uma conta com este e-mail agora há pouco.",
      "",
      "Este e-mail já tem conta na Demandou. É só entrar:",
      args.url,
      "",
      "Esqueceu a senha? Na tela de entrada, use \"Esqueci a senha\" e enviamos o link para trocar.",
      "",
      "Se não foi você, pode ignorar este e-mail: nada mudou na sua conta.",
    ].join("\n"),
  };
}
