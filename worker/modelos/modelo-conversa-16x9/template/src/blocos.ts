// Os blocos universais traduzidos para a gramática da conversa.
//
// - Blocos de quadro cheio (abertura, numero, destaque, frase, pergunta, cta, balao) continuam como
//   momentos próprios; a mensagem deles entra na conversa e aparece nela quando a pessoa vira bolha.
// - Blocos da tela do app viram uma `conversa` interna: topicos e passos = mensagens suas, uma por item;
//   definicao = o termo em negrito e a resposta citando o termo; grafico = um cartão compartilhado.
// - A comparacao e o contraste são telas próprias (duas faixas).
// Nomes antigos continuam valendo: destaque com `mensagem` = balao; "cliente" = "outro";
// "pagamento" = "confirmacao"; resultado "vacuo"/"venda" = "ruim"/"bom"; cta `acao` = `icone`.
import { normalizar as normalizarPalavra } from "./anim";
import type {
  Abertura,
  Balao,
  Comparacao,
  Contraste,
  Conversa,
  Cta,
  Destaque,
  Fixada,
  Frase,
  Grafico,
  Item,
  Mensagem,
  Momento,
  Numero,
  Palavra,
  Pergunta,
  Plano,
} from "./plano";

// Uma mensagem como o template a desenha (os blocos universais acrescentam campos internos)
export type Msg = Omit<Mensagem, "de" | "tipo"> & {
  de: "eu" | "cliente";
  tipo?: "texto" | "preco" | "cartao" | "confirmacao" | "digitando" | "grafico" | "numero";
  // corpo próprio do balão (listas com muitos itens usam letra um pouco menor)
  corpo?: number;
  // o termo da definição: negrito e um pouco maior
  forte?: boolean;
  // resposta: o texto citado no topo do balão (como "responder" no app)
  cita?: string;
  // passos: o número na bolinha e quando ela vira ✓
  passo?: number;
  feitoEm?: number;
  // uma segunda linha menor
  detalhe?: string;
  // tipo "grafico" e "numero": o bloco que o balão desenha
  grafico?: Grafico;
  numero?: Numero;
  // bolinha de alerta (✕) antes do texto: o destaque "alerta"
  alerta?: boolean;
  // trecho que trava (fundo escuro, letra no acento) quando é dito; trecho riscado
  trava?: string;
  risco?: string;
  riscoEm?: number;
  // quando o detalhe aparece (padrão: com a mensagem)
  detalheEm?: number;
  // peso do texto (padrão 500; 800 no `forte`)
  peso?: 500 | 600 | 700 | 800;
  // veio de um momento de quadro cheio (o som dela toca no peito, não na conversa)
  doCheio?: boolean;
};

export type ConversaInterna = Omit<Conversa, "mensagens"> & {
  mensagens: Msg[];
  // de que bloco universal veio (sem = conversa da assinatura)
  bloco?: "topicos" | "passos" | "definicao" | "grafico";
  // true = esta tela não tem mensagem fixada (a barra recolhe)
  semFixada?: boolean;
  // passos: a etiqueta da fixada conta os itens ditos (os `em` de cada item)
  contador?: number[];
};

export type BalaoInterno = Omit<Balao, "mensagem"> & { mensagem: Msg };

export type LadoInterno = Omit<Contraste["esquerda"], "mensagens" | "resultado"> & {
  mensagens: Msg[];
  resultado: { em: number; texto: string; tipo: "ruim" | "bom"; valor?: string; rotulo?: string };
};
export type ContrasteInterno = Omit<Contraste, "esquerda" | "direita"> & { esquerda: LadoInterno; direita: LadoInterno };

export type Cheio = Abertura | Numero | Destaque | Frase | Pergunta | Cta | BalaoInterno;
export type MomentoInterno = Cheio | ConversaInterna | ContrasteInterno | Comparacao;
export type PlanoInterno = Omit<Plano, "momentos"> & { momentos: MomentoInterno[] };

export const quem = (de: Mensagem["de"] | undefined): "eu" | "cliente" => (de === "eu" ? "eu" : "cliente");

export const msgDe = (m: Mensagem): Msg => ({
  ...m,
  de: quem(m.de),
  tipo: m.tipo === "pagamento" ? "confirmacao" : m.tipo,
});

const lado = (l: Contraste["esquerda"]): LadoInterno => ({
  ...l,
  mensagens: (l.mensagens ?? []).map(msgDe),
  resultado: { ...l.resultado, tipo: l.resultado.tipo === "venda" || l.resultado.tipo === "bom" ? "bom" : "ruim" },
});

// "digitando…" curto antes de cada item, sem passar do espaço desde o item anterior
const digitacao = (em: number, anterior: number, maximo = 0.35) => Math.max(0, Math.min(maximo, em - anterior - 0.3));

// Corpo dos balões de uma lista: com 4 ou 5 itens, a letra diminui um pouco para todos caberem
export const corpoDaLista = (n: number) => (n <= 3 ? 70 : n === 4 ? 64 : 58);

// quando o detalhe de um item é dito: a primeira palavra dele na fala, entre o item e o próximo
// (o detalhe já aparece apagado com o item e acende nessa palavra)
const quandoDiz = (texto: string | undefined, palavras: Palavra[], de: number, ate: number) => {
  if (!texto) return undefined;
  const alvo = texto.split(/\s+/).map(normalizarPalavra).filter((w) => w.length > 2);
  const achou = palavras.find((p) => p.em > de + 0.05 && p.em < ate && alvo.includes(normalizarPalavra(p.w)));
  return achou ? achou.em : undefined;
};

const itensComoMensagens = (itens: Item[], de: number, ate: number, passos: boolean, palavras: Palavra[]): Msg[] => {
  const n = itens.length;
  const corpo = corpoDaLista(n);
  return itens.map((it, i) => ({
    de: "eu",
    em: it.em,
    texto: it.texto,
    detalhe: it.detalhe,
    detalheEm: quandoDiz(it.detalhe, palavras, it.em, itens[i + 1]?.em ?? ate),
    corpo,
    digitando: digitacao(it.em, i === 0 ? de : itens[i - 1].em),
    ...(passos ? { passo: i + 1, feitoEm: itens[i + 1]?.em } : {}),
  }));
};

const traduzir = (m: Momento, palavras: Palavra[]): MomentoInterno => {
  switch (m.tipo) {
    case "topicos":
    case "passos": {
      const itens = [...(m.itens ?? [])].sort((a, b) => a.em - b.em);
      const passos = m.tipo === "passos";
      const fixada: Fixada | undefined = m.titulo ? { texto: m.titulo, tom: "certo" } : undefined;
      return {
        tipo: "conversa",
        de: m.de,
        ate: m.ate,
        legenda: m.legenda,
        bloco: m.tipo,
        fixada,
        semFixada: !fixada,
        contador: passos && fixada ? itens.map((i) => i.em) : undefined,
        mensagens: itensComoMensagens(itens, m.de, m.ate, passos, palavras),
      };
    }
    case "definicao":
      return {
        tipo: "conversa",
        de: m.de,
        ate: m.ate,
        legenda: m.legenda,
        bloco: "definicao",
        semFixada: true,
        mensagens: [
          { de: "eu", em: m.em, texto: m.termo, forte: true, digitando: digitacao(m.em, m.de, 0.5) },
          { de: "eu", em: m.significadoEm, texto: m.significado, cita: m.termo, digitando: digitacao(m.significadoEm, m.em, 0.45) },
        ],
      };
    case "grafico": {
      const primeiro = Math.min(...(m.dados?.map((d) => d.em) ?? []), m.tendenciaEm ?? m.de + 0.9);
      const em = Math.max(m.de + 0.3, Math.min(primeiro - 0.25, m.de + 0.9));
      return {
        tipo: "conversa",
        de: m.de,
        ate: m.ate,
        legenda: m.legenda,
        bloco: "grafico",
        fixada: m.titulo ? { texto: m.titulo, tom: "certo" } : undefined,
        semFixada: !m.titulo,
        mensagens: [{ de: "eu", tipo: "grafico", em, grafico: m, digitando: Math.min(0.45, em - m.de) }],
      };
    }
    case "conversa":
      return { ...m, mensagens: m.mensagens.map(msgDe) };
    case "contraste":
      return { ...m, esquerda: lado(m.esquerda), direita: lado(m.direita) };
    case "balao":
      return { ...m, mensagem: msgDe(m.mensagem) };
    case "destaque": {
      // destaque no formato antigo (com `mensagem`) = balao
      const antigo = m as unknown as Balao & { mensagem?: Mensagem };
      if (antigo.mensagem) return { ...antigo, tipo: "balao", mensagem: msgDe(antigo.mensagem) };
      return m;
    }
    default:
      return m;
  }
};

// A mensagem que um momento de quadro cheio deixa na conversa (aparece quando a pessoa vira bolha)
export const mensagemDoCheio = (m: MomentoInterno): Msg | null => {
  switch (m.tipo) {
    case "balao":
      return m.naConversa === false ? null : m.mensagem;
    case "abertura":
      return { de: "eu", em: m.em ?? m.de, texto: m.texto, digitando: 0 };
    case "frase":
      return { de: "eu", em: m.em ?? m.de, texto: m.texto, digitando: 0 };
    case "pergunta":
      return { de: "eu", em: m.em ?? m.de, texto: m.texto, digitando: 0 };
    case "destaque":
      return { de: "eu", em: m.em, texto: m.texto, forte: true, digitando: 0, alerta: m.nivel === "alerta" };
    case "numero":
      return { de: "eu", tipo: "numero", em: m.em, numero: m, digitando: 0 };
    default:
      return null;
  }
};

// O plano como o template desenha: momentos em ordem, sem invadir o seguinte, nomes antigos traduzidos
export const normalizar = (plano: Plano): PlanoInterno => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de).map((m) => traduzir(m, plano.palavras ?? []));
  return {
    ...plano,
    momentos: ordenados.map((m, i) => {
      const proximo = ordenados[i + 1];
      return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
    }),
  };
};

export const ehCheio = (m: MomentoInterno | undefined): m is Cheio =>
  !!m && m.tipo !== "conversa" && m.tipo !== "contraste" && m.tipo !== "comparacao";

// ícone/ação do fechamento
export const acaoDoCta = (m: Cta) => m.icone ?? m.acao ?? "salvar";

