import { createHash } from "node:crypto";

/**
 * OS PERFIS DOS CLIENTES, a parte sem banco (08/10/2026).
 *
 * Pedido do Bruno: "como nós vamos ter os dados do nicho, setor etc. quando
 * os usuários fizerem as análises das suas redes, crie um gráfico para o ADM
 * entender os perfis, por nicho, por tipo (advogados, consultores,
 * vendedores, médicos etc.)".
 *
 * O texto do cliente é LIVRE ("Consórcio de imóveis para famílias", "mentoria
 * de liderança"), e transformar texto livre em categoria é DECISÃO. Pela regra
 * da casa ("Claude só escreve, JEV decide") quem decide é o JEV, numa escolha
 * entre as categorias abaixo (lib/admin/perfis/decisao-pelo-jev.ts). Nenhum
 * modelo de texto entra nesta classificação, e nenhuma regra de palavra-chave
 * decide por ele: sem o JEV, o projeto fica "sem classificação" e a tela diz.
 *
 * A LISTA É ABERTA: quando nenhuma serve, o JEV responde "outros"; o código
 * oferece então o próprio nicho do cliente como candidata a categoria nova, e
 * o JEV decide se ela é uma profissão ou setor que merece entrada própria.
 * Aceita, ela passa a valer como opção para os próximos projetos. O que fica em
 * "outros" aparece para o admin com os textos crus.
 */

export type Categoria = { id: string; nome: string; descricao: string };

/** As categorias da casa: profissão ou setor, na língua do dono. */
export const CATEGORIAS_BASE: Categoria[] = [
  { id: "advogados", nome: "Advogados e jurídico", descricao: "advogado, escritório de advocacia, direito, assessoria jurídica" },
  { id: "medicos", nome: "Médicos e clínicas", descricao: "médico, clínica médica, especialidade médica, hospital" },
  { id: "saude", nome: "Saúde (outras profissões)", descricao: "dentista, psicólogo, nutricionista, fisioterapeuta, terapeuta, veterinário, enfermagem" },
  { id: "consultores", nome: "Consultores", descricao: "consultoria empresarial, de gestão, de processos, de negócios" },
  { id: "mentores", nome: "Mentores, coaches e palestrantes", descricao: "mentoria, coaching, palestras, treinamento de pessoas, desenvolvimento pessoal" },
  { id: "vendedores", nome: "Vendedores e representantes", descricao: "vendedor, representante comercial, corretor de seguros, consórcio, venda direta, time comercial" },
  { id: "imobiliario", nome: "Imobiliário e construção", descricao: "corretor de imóveis, imobiliária, construtora, incorporadora, arquitetura, reforma" },
  { id: "financas", nome: "Finanças e contabilidade", descricao: "contador, contabilidade, investimentos, crédito, banco, planejamento financeiro" },
  { id: "educacao", nome: "Educação", descricao: "escola, professor, faculdade, cursos, ensino" },
  { id: "varejo", nome: "Varejo e comércio", descricao: "loja, comércio, e-commerce, revenda de produtos ao consumidor" },
  { id: "alimentacao", nome: "Alimentação", descricao: "restaurante, padaria, café, confeitaria, gastronomia" },
  { id: "beleza", nome: "Beleza e estética", descricao: "salão, barbearia, estética, maquiagem, cosméticos" },
  { id: "igreja", nome: "Igreja e fé", descricao: "igreja, pastor, ministério, conteúdo cristão ou religioso" },
  { id: "tecnologia", nome: "Tecnologia", descricao: "software, SaaS, startup, aplicativo, inteligência artificial" },
  { id: "marketing", nome: "Marketing e conteúdo", descricao: "agência, marketing digital, criador de conteúdo, influenciador, social media" },
  { id: "industria", nome: "Indústria, agro e logística", descricao: "fábrica, indústria, agronegócio, transporte, logística" },
  { id: "energia", nome: "Energia", descricao: "energia solar, eólica, setor elétrico, usinas" },
];

/** A resposta de quando nenhuma serve. Fica fora do gráfico principal, com os textos crus. */
export const OUTROS: Categoria = { id: "outros", nome: "Outros", descricao: "nenhuma das categorias acima descreve a profissão ou o setor" };

export const TIPOS_DE_NEGOCIO = ["b2b", "b2c", "ambos"] as const;
export type TipoDeNegocio = (typeof TIPOS_DE_NEGOCIO)[number];
export const NOME_DO_NEGOCIO: Record<TipoDeNegocio, string> = {
  b2b: "Vende para empresas (B2B)",
  b2c: "Vende para pessoas (B2C)",
  ambos: "Para empresas e pessoas",
};
export const CRITERIO_DO_NEGOCIO: Record<TipoDeNegocio, string> = {
  b2b: "o cliente vende principalmente para empresas, gestores ou outros profissionais",
  b2c: "o cliente vende principalmente para pessoas físicas, consumidor final, pacientes, fiéis ou famílias",
  ambos: "vende para empresas e para pessoas físicas em medida parecida",
};

export const TIPOS_DE_PESSOA = ["pessoa", "empresa"] as const;
export type TipoDePessoa = (typeof TIPOS_DE_PESSOA)[number];
export const NOME_DA_PESSOA: Record<TipoDePessoa, string> = {
  pessoa: "Marca pessoal (a pessoa é a marca)",
  empresa: "Marca de empresa",
};
export const CRITERIO_DA_PESSOA: Record<TipoDePessoa, string> = {
  pessoa: "o perfil é de uma pessoa, profissional ou autoridade que fala em nome próprio (marca pessoal)",
  empresa: "o perfil é de uma empresa, escritório, clínica, igreja ou instituição (marca da organização)",
};

/** Os textos crus que o JEV lê, com o nome de onde cada um veio. */
export type TextosDoPerfil = {
  nome?: string;
  nicho?: string;
  publico?: string;
  descricao?: string;
  /** Da análise das redes do próprio cliente (perfil_proprio, "quem é"). */
  redesPessoa?: string;
  redesProduto?: string;
  redesPublico?: string;
  redesObjetivo?: string;
  /** Do formulário da landing que virou esta conta. */
  cadastroFaz?: string;
  cadastroSetor?: string;
  cadastroCargo?: string;
};

export const NOME_DO_TEXTO: Record<keyof TextosDoPerfil, string> = {
  nome: "nome do projeto",
  nicho: "nicho",
  publico: "público",
  descricao: "descrição",
  redesPessoa: "análise das redes: quem é",
  redesProduto: "análise das redes: produto",
  redesPublico: "análise das redes: público",
  redesObjetivo: "análise das redes: objetivo",
  cadastroFaz: "cadastro: o que faz",
  cadastroSetor: "cadastro: setor",
  cadastroCargo: "cadastro: cargo",
};

const limpo = (t: unknown, teto = 400): string | undefined => {
  if (typeof t !== "string") return undefined;
  const s = t.replace(/\s+/g, " ").trim().slice(0, teto);
  return s || undefined;
};

/** Monta os textos de um projeto, sem nada vazio. */
export function textosDoPerfil(d: {
  nome?: string | null;
  nicho?: string | null;
  publico?: string | null;
  descricao?: string | null;
  quemE?: { pessoa?: unknown; produto?: unknown; publico?: unknown; objetivo?: unknown } | null;
  cadastro?: { faz?: string | null; setor?: string | null; cargo?: string | null } | null;
}): TextosDoPerfil {
  const t: TextosDoPerfil = {
    nome: limpo(d.nome, 120),
    nicho: limpo(d.nicho),
    publico: limpo(d.publico),
    descricao: limpo(d.descricao),
    redesPessoa: limpo(d.quemE?.pessoa),
    redesProduto: limpo(d.quemE?.produto),
    redesPublico: limpo(d.quemE?.publico),
    redesObjetivo: limpo(d.quemE?.objetivo),
    cadastroFaz: limpo(d.cadastro?.faz),
    cadastroSetor: limpo(d.cadastro?.setor),
    cadastroCargo: limpo(d.cadastro?.cargo),
  };
  for (const k of Object.keys(t) as Array<keyof TextosDoPerfil>) if (t[k] === undefined) delete t[k];
  return t;
}

/**
 * Tem o que classificar? O nome sozinho não basta (o JEV decidiria pelo nome
 * da marca, que muitas vezes é só o nome da pessoa).
 */
export function temTextoParaClassificar(t: TextosDoPerfil): boolean {
  return Object.keys(t).some((k) => k !== "nome");
}

/** A impressão digital dos textos: mudou o nicho (ou qualquer texto), a classificação venceu. */
export function hashDosTextos(t: TextosDoPerfil): string {
  const chaves = Object.keys(t).sort() as Array<keyof TextosDoPerfil>;
  const normal = chaves.map((k) => `${k}=${(t[k] ?? "").toLowerCase()}`).join("\n");
  return createHash("sha256").update(normal).digest("hex").slice(0, 32);
}

export type PerfilGuardado = {
  projectId: string;
  categoria: string;
  categoriaNome: string;
  categoriaNova: boolean;
  confianca: number | null;
  negocio: TipoDeNegocio | null;
  negocioConfianca: number | null;
  pessoa: TipoDePessoa | null;
  pessoaConfianca: number | null;
  fonte: string;
  textos: TextosDoPerfil;
  hashDosTextos: string;
  classificadoEm: string;
};

export type SituacaoDoPerfil = "classificado" | "desatualizado" | "sem_classificacao" | "sem_texto";

/** Em que pé está o perfil de um projeto, contra os textos de agora. */
export function situacaoDoPerfil(textos: TextosDoPerfil, guardado: Pick<PerfilGuardado, "hashDosTextos"> | null | undefined): SituacaoDoPerfil {
  // Sem texto não há o que conferir: a classificação antiga, se houver, não
  // vale mais (estado que sobrevive ao fato vira mentira na tela).
  if (!temTextoParaClassificar(textos)) return "sem_texto";
  if (!guardado) return "sem_classificacao";
  return guardado.hashDosTextos === hashDosTextos(textos) ? "classificado" : "desatualizado";
}

/** Sem acento, minúsculo, só letras e números com sublinhado: o id de uma categoria nova. */
export function slugDaCategoria(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

/**
 * A CANDIDATA A CATEGORIA NOVA, tirada do próprio texto do cliente (o nicho,
 * senão o setor do cadastro): a primeira oração, curta. Não é escrita por
 * modelo nenhum; o JEV só decide se ela vale como categoria. Texto longo ou
 * vago demais não vira candidata, e o projeto fica em "outros".
 */
export function candidataACategoria(t: TextosDoPerfil): { nome: string; id: string } | null {
  const base = t.nicho ?? t.cadastroSetor;
  if (!base) return null;
  const primeira = base.split(/[,;.:()/|]| para | com | que | e |\s[-–—]\s/i)[0]?.trim() ?? "";
  const palavras = primeira.split(/\s+/).filter(Boolean);
  if (primeira.length < 3 || primeira.length > 40 || palavras.length > 5) return null;
  const nome = primeira.charAt(0).toUpperCase() + primeira.slice(1);
  const id = slugDaCategoria(nome);
  if (!id || id === OUTROS.id) return null;
  return { nome, id };
}
