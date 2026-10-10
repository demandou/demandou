/**
 * O MATERIAL DO CLIENTE NOS MODELOS DO CURSO (10/10/2026). O lado puro (sem
 * banco e sem rede): a tela, as rotas, a esteira dos cortes e o redator do
 * plano leem daqui.
 *
 * Seis modelos do curso "Máquina de Edição IA" não rodavam sozinhos porque
 * pedem material do cliente (catalogo.json, campo `pede`). Decisão do Bruno:
 * o cliente pode escolhê-los; ao escolher, a jornada pede o material que o
 * modelo exige, e a edição usa esse material exatamente como o curso manda.
 * O material é um conjunto de fotos da Biblioteca de materiais do projeto
 * (MaterialDoCliente), marcadas para o modelo ou enviadas ali na hora, com o
 * nome e a descrição que o cliente dá. Guardado em `ProjectMemory` (tipo
 * "editor", chave `material-do-modelo:<id>`), sem coluna nova.
 *
 * NUNCA TELA GERADA POR IA: captura de tela e print são do produto do cliente;
 * gerar um seria inventar o produto dele. Só entra arquivo que o cliente mandou.
 *
 * Onde cada template espera o arquivo, com que nome e formato, e como o
 * plano.json o referencia mora no worker, ao lado dos templates
 * (worker/src/modelo/material-do-modelo.mjs, MATERIAL_NO_TEMPLATE). Aqui fica o
 * que a tela pede (quantos, de que tipo, com que papel) e a regra de quando a
 * edição pode começar. O teste (scripts/testes/material-do-modelo-1010.test.mts)
 * confere que os dois mapas têm os mesmos modelos e que cada destino existe no
 * template.
 *
 * O que o curso pede, modelo a modelo (SKILL.md, references/plano.md e o template):
 *
 *   modelo-demo        capturas de tela (3 a 8). SKILL passo 6b: "Material do
 *                      usuário em public/tela/ passa na frente"; ".jpg em
 *                      public/tela/; a proporção é altura ÷ largura". O plano
 *                      usa no momento `tela` o `captura` (nome sem extensão) e
 *                      a `proporcao`; Tela.tsx lê staticFile(`tela/${captura}.jpg`).
 *                      Uma captura por cena (3 a 10 s), mais o resultado parado.
 *   modelo-tela-viva   capturas de tela (2 a 8). O mesmo caminho do Demo
 *                      (public/tela/<nome>.jpg, `captura` e `proporcao`); o DNA
 *                      pede duas provas em sequência, a segunda maior.
 *   modelo-etapas      prints (3 a 12). SKILL: "prints próprios na pasta
 *                      imagens/ ... node ferramentas/capturar.mjs --arquivo
 *                      agenda=imagens/agenda.png", que copia para public/img/<id>
 *                      e registra em plano.imagens; o plano usa
 *                      `imagem: { id }` nas telas de `etapa`, `grade` e `prova`.
 *                      Cada etapa troca de print a cada 0,3 a 1 s.
 *   modelo-guia        prints (2 a 8) pelo mesmo capturar.mjs --arquivo, usados
 *                      no momento `print` (`imagem: { id }`, setas em frações
 *                      do print), MAIS o recorte da pessoa sem fundo
 *                      (public/pessoa.webm, ferramentas/recortar.mjs com o
 *                      Vision do macOS). INDISPONÍVEL: o recorte ainda não roda
 *                      no worker (ver `motivo`).
 *   modelo-transformacao  o par de fotos antes e depois (exatamente 2). SKILL
 *                      passo 6b: "imagens/antes.jpg e imagens/depois.jpg";
 *                      work/imagens.json com os dois pedidos (`arquivo`) e
 *                      `node scripts/imagens.mjs --offline`; o plano usa
 *                      `antesdepois` com `antes: { id: "antes" }` e
 *                      `depois: { id: "depois" }`.
 *   modelo-janelas     NADA do cliente. O "gravação de tela" do catálogo veio
 *                      da regra do importar.mjs (teclas.mjs vira "gravação de
 *                      tela"), mas a teclas.mjs só ouve as sílabas das teclas
 *                      no áudio de public/base.mp4, para um humano achar o
 *                      instante de cada tecla. A área de trabalho e as janelas
 *                      são desenhadas pelo próprio template; o SKILL não pede
 *                      arquivo nenhum. Serve sem material.
 */

export type PapelDoMaterial = "antes" | "depois";

export const ROTULO_DO_PAPEL: Record<PapelDoMaterial, string> = { antes: "Antes", depois: "Depois" };

export type PedidoDeMaterial = {
  /** O que o modelo pede, como a tela diz ("capturas de tela do seu produto"). Null: não pede nada. */
  oQue: string | null;
  /** Singular e plural da peça, para as contas da tela ("captura", "capturas"). */
  unidade: { um: string; varios: string };
  /** Como fazer um bom material para este modelo, tirado do SKILL.md. */
  dica: string;
  /** Aviso do próprio curso que vale mostrar antes do envio (ex.: antes e depois na saúde). */
  aviso?: string;
  minimo: number;
  maximo: number;
  /** Os papéis obrigatórios, um arquivo cada (a Transformação: antes e depois). */
  papeis?: PapelDoMaterial[];
  /** False enquanto falta uma peça do nosso lado (não do cliente): o modelo não pode ser escolhido. */
  disponivel: boolean;
  /** Por que está indisponível (código), ou por que não pede nada. */
  motivo?: string;
  /** O que a tela diz quando está indisponível (cliente). */
  emBreve?: string;
};

export const MATERIAL_DOS_MODELOS: Readonly<Record<string, PedidoDeMaterial>> = {
  "modelo-demo": {
    oQue: "capturas de tela do seu produto",
    unidade: { um: "captura", varios: "capturas" },
    dica: "Prints reais do seu app, site, planilha ou painel, do jeito que aparecem na tela, de preferência inteiros (a página toda). Cada print vira um trecho da demonstração: a câmera anda por ele e o cursor aponta o que você fala, na hora em que você fala. Mande também o resultado que você quer mostrar.",
    minimo: 3,
    maximo: 8,
    disponivel: true,
  },
  "modelo-tela-viva": {
    oQue: "capturas de tela do seu produto",
    unidade: { um: "captura", varios: "capturas" },
    dica: "Prints reais do que você mostra no vídeo (o app, o site, a planilha), inteiros e nítidos. A tela de cima nunca para: a câmera percorre cada print e o cursor clica no que você cita. Se tiver duas provas, mande as duas: a segunda é a mais impressionante.",
    minimo: 2,
    maximo: 8,
    disponivel: true,
  },
  "modelo-etapas": {
    oQue: "prints das etapas do seu processo",
    unidade: { um: "print", varios: "prints" },
    dica: "Prints reais de cada etapa que você explica (o site, a agenda, o painel, o e-mail, o resultado). Eles trocam rápido na tela de cima, um por etapa, e se juntam numa grade numerada no fim. Dê a cada um um nome que diga o que é (agenda, e-mail, painel).",
    minimo: 3,
    maximo: 12,
    disponivel: true,
  },
  "modelo-guia": {
    oQue: "prints das telas que você ensina a usar",
    unidade: { um: "print", varios: "prints" },
    dica: "Um print real para cada clique que você ensina (o botão, o menu, o campo preenchido). A seta vermelha aponta o botão na palavra em que você o cita.",
    minimo: 2,
    maximo: 8,
    disponivel: false,
    // O Guia põe a pessoa recortada SEM FUNDO sobre as telas (public/pessoa.webm, que o curso faz com
    // ferramentas/recortar.mjs pelo Vision do macOS). Neste ramo o worker ainda não recorta pessoa em
    // vídeo: worker/avancado/scripts/recorte-alfa.py (RVM em CPU) é só a prova da aula 8.2, não está
    // ligado ao editar-no-modelo e a imagem do worker não tem o onnxruntime. O recorte pelo RunPod
    // está no ramo de outro agente (10/10). Quando ele entrar e gravar public/pessoa.webm depois do
    // cortar.mjs, é trocar `disponivel` para true: o pedido dos prints já está pronto.
    motivo: "o recorte da pessoa sem fundo (public/pessoa.webm) ainda não roda no worker; entra com o recorte pelo RunPod",
    emBreve: "Em breve: precisa do recorte da pessoa sem fundo, que ainda não roda aqui. Vai pedir os prints das telas que você ensina.",
  },
  "modelo-transformacao": {
    oQue: "uma foto de antes e uma de depois",
    unidade: { um: "foto", varios: "fotos" },
    dica: "As duas do mesmo lugar, do mesmo ponto e com o mesmo ângulo (o celular apoiado no mesmo lugar): a cortina antes e depois só funciona com o mesmo enquadramento.",
    aviso: "Se você é da área da saúde (médico, dentista, nutricionista, fisioterapeuta, esteticista, psicólogo), o seu conselho pode restringir ou proibir antes e depois de pacientes e exige consentimento por escrito. Prefira o seu próprio ambiente, a sua rotina ou um conteúdo educativo.",
    minimo: 2,
    maximo: 2,
    papeis: ["antes", "depois"],
    disponivel: true,
  },
  "modelo-janelas": {
    oQue: null,
    unidade: { um: "arquivo", varios: "arquivos" },
    dica: "",
    minimo: 0,
    maximo: 0,
    disponivel: true,
    motivo: "o template desenha a área de trabalho e as janelas; a teclas.mjs (que o importar.mjs leu como gravação de tela) só ouve as sílabas das teclas no áudio",
  },
};

/** O modelo é um dos que passam pelo material do cliente (mesmo os que não pedem nada, como o Janelas)? */
export function temRegraDeMaterial(id: string | null | undefined): boolean {
  return Boolean(id && MATERIAL_DOS_MODELOS[id]);
}

/** O modelo pede arquivo do cliente (mínimo acima de zero)? */
export function pedeMaterial(id: string | null | undefined): boolean {
  const p = id ? MATERIAL_DOS_MODELOS[id] : undefined;
  return Boolean(p && p.minimo > 0);
}

/** O modelo pode ser escolhido do nosso lado (nada que falta é nosso)? */
export function materialDisponivel(id: string | null | undefined): boolean {
  const p = id ? MATERIAL_DOS_MODELOS[id] : undefined;
  return Boolean(p && p.disponivel);
}

/** Um arquivo marcado para o modelo, como fica guardado. */
export type ItemDoMaterial = {
  /** MaterialDoCliente.id (foto da Biblioteca do projeto). */
  materialId: string;
  /** O nome que o cliente dá ("Tela de cadastro"). */
  nome: string;
  /** O que o arquivo mostra, nas palavras do cliente (o redator lê). */
  descricao: string;
  papel?: PapelDoMaterial | null;
};

export type SituacaoDoMaterial = {
  modelo: string;
  /** A edição pode começar. */
  basta: boolean;
  quantos: number;
  minimo: number;
  maximo: number;
  /** O que falta, na frase da tela; null quando basta. */
  falta: string | null;
  itens: ItemDoMaterial[];
};

const contar = (n: number, u: { um: string; varios: string }) => `${n} ${n === 1 ? u.um : u.varios}`;

/** A frase do pedido ("Este modelo usa capturas de tela do seu produto: envie de 3 a 8."). Null quando não pede nada. */
export function fraseDoPedido(id: string): string | null {
  const p = MATERIAL_DOS_MODELOS[id];
  if (!p?.oQue || p.minimo === 0) return null;
  if (p.papeis?.length && p.minimo === p.maximo) return `Este modelo usa ${p.oQue} do mesmo lugar: envie as duas.`;
  if (p.minimo === p.maximo) return `Este modelo usa ${p.oQue}: envie ${p.minimo}.`;
  return `Este modelo usa ${p.oQue}: envie de ${p.minimo} a ${p.maximo}.`;
}

/**
 * A REGRA DE QUANDO A EDIÇÃO PODE COMEÇAR. Puro: recebe só os itens que ainda
 * existem na Biblioteca (foto do projeto). Basta quando o modelo está
 * disponível, a quantidade está entre o mínimo e o máximo, cada papel tem o
 * seu arquivo e cada arquivo tem nome. Sem isso, o modelo fica escolhido, a
 * edição não começa e a tela diz o que falta.
 */
export function situacaoDoMaterial(modelo: string, itens: ItemDoMaterial[]): SituacaoDoMaterial {
  const p = MATERIAL_DOS_MODELOS[modelo];
  const base = { modelo, quantos: itens.length, minimo: p?.minimo ?? 0, maximo: p?.maximo ?? 0, itens };
  if (!p) return { ...base, basta: false, falta: "Este modelo não usa material seu." };
  if (!p.disponivel) return { ...base, basta: false, falta: p.emBreve ?? "Este modelo ainda não está disponível." };
  if (p.minimo === 0) return { ...base, basta: true, falta: null };
  const faltas: string[] = [];
  for (const papel of p.papeis ?? []) {
    const n = itens.filter((i) => i.papel === papel).length;
    if (n === 0) faltas.push(`falta a ${p.unidade.um} de ${ROTULO_DO_PAPEL[papel].toLowerCase()}`);
    else if (n > 1) faltas.push(`marque só uma ${p.unidade.um} como ${ROTULO_DO_PAPEL[papel].toLowerCase()}`);
  }
  if (!p.papeis?.length) {
    if (itens.length < p.minimo) {
      const resto = p.minimo - itens.length;
      faltas.push(itens.length ? `${resto === 1 ? "falta" : "faltam"} ${contar(resto, p.unidade)} (a edição começa com ${p.minimo})` : `envie pelo menos ${contar(p.minimo, p.unidade)}`);
    }
    if (itens.length > p.maximo) faltas.push(`são ${itens.length}; este modelo usa no máximo ${p.maximo}, tire ${itens.length - p.maximo}`);
  }
  const semNome = itens.filter((i) => !i.nome.trim()).length;
  if (semNome) faltas.push(semNome === 1 ? `dê um nome à ${p.unidade.um} sem nome` : `dê nome às ${contar(semNome, p.unidade)} sem nome`);
  if (!faltas.length) return { ...base, basta: true, falta: null };
  const frase = faltas.join("; ");
  return { ...base, basta: false, falta: `${frase.charAt(0).toUpperCase()}${frase.slice(1)}.` };
}

/** O material basta para o modelo servir no corte? Modelo sem regra de material: não (a recusa de sempre). */
export function materialBasta(id: string, situacao?: SituacaoDoMaterial | null): boolean {
  const p = MATERIAL_DOS_MODELOS[id];
  if (!p || !p.disponivel) return false;
  if (p.minimo === 0) return true;
  return Boolean(situacao && situacao.modelo === id && situacao.basta);
}

const TRACOS = /\s*[—–]\s*/g;
const limpar = (t: unknown, teto: number) =>
  String(t ?? "")
    .replace(TRACOS, ", ")
    .replace(/[\u0000-\u001f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, teto);

/** Os itens que vieram da tela, limpos: sem repetidos, sem travessão, com teto de texto e papel válido. */
export function normalizarItens(modelo: string, bruto: unknown): ItemDoMaterial[] {
  const p = MATERIAL_DOS_MODELOS[modelo];
  const lista = Array.isArray(bruto) ? bruto : [];
  const vistos = new Set<string>();
  const itens: ItemDoMaterial[] = [];
  for (const x of lista) {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    const materialId = typeof o.materialId === "string" ? o.materialId.trim() : "";
    if (!materialId || vistos.has(materialId)) continue;
    vistos.add(materialId);
    const papel = p?.papeis?.includes(o.papel as PapelDoMaterial) ? (o.papel as PapelDoMaterial) : null;
    itens.push({ materialId, nome: limpar(o.nome, 60), descricao: limpar(o.descricao, 300), ...(p?.papeis?.length ? { papel } : {}) });
  }
  return itens;
}

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** O id do arquivo no projeto do trabalho (nome do arquivo e o que o plano cita): do nome dado, sem acento. */
export function idsDosArquivos(modelo: string, itens: ItemDoMaterial[]): string[] {
  const p = MATERIAL_DOS_MODELOS[modelo];
  const prefixo = p?.unidade.um === "print" ? "print" : p?.unidade.um === "foto" ? "foto" : "tela";
  const usados = new Set<string>();
  return itens.map((it, i) => {
    let id = it.papel ?? (semAcento(it.nome).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24).replace(/-+$/, "") || `${prefixo}-${i + 1}`);
    if (!/^[a-z]/.test(id)) id = `${prefixo}-${id}`;
    let final = id;
    for (let k = 2; usados.has(final); k++) final = `${id}-${k}`;
    usados.add(final);
    return final;
  });
}

/** O que a tela mostra no cartão do modelo: o pedido, a dica, o aviso e os limites. Null quando o modelo não pede nada. */
export type PedidoDeMaterialNaTela = {
  frase: string;
  oQue: string;
  unidade: { um: string; varios: string };
  dica: string;
  aviso: string | null;
  minimo: number;
  maximo: number;
  papeis: PapelDoMaterial[] | null;
  disponivel: boolean;
};

export function pedidoDeMaterialNaTela(id: string): PedidoDeMaterialNaTela | null {
  const p = MATERIAL_DOS_MODELOS[id];
  const frase = fraseDoPedido(id);
  if (!p?.oQue || !frase) return null;
  return { frase, oQue: p.oQue, unidade: p.unidade, dica: p.dica, aviso: p.aviso ?? null, minimo: p.minimo, maximo: p.maximo, papeis: p.papeis ?? null, disponivel: p.disponivel };
}

// ─────────────────────────────── o redator do plano ───────────────────────────────

/** Um arquivo do material como o worker deixou no projeto do trabalho, medido. */
export type ArquivoDoMaterial = {
  /** O id que o plano cita (a `captura` do Demo, o `imagem.id` do Etapas, "antes"/"depois"). */
  id: string;
  nome: string;
  descricao: string;
  papel?: PapelDoMaterial | null;
  /** Onde ficou no projeto (public/tela/tela-1.jpg, public/img/agenda.jpg). */
  arquivo: string;
  largura: number;
  altura: number;
  /** Altura ÷ largura, como o curso mede. */
  proporcao: number;
  /** O arquivo reduzido (lado maior 900 px, o "sips -Z 900" do curso), em base64, para o redator medir as frações. */
  miniatura?: string | null;
};

/** O que o worker manda ao redator junto do pedido do plano (e do mapa, nos modelos com imagem). */
export type MaterialParaORedator = {
  modelo: string;
  oQue: string;
  /** Como o plano.json deste modelo usa cada arquivo (do mapa do worker). */
  noPlano: string;
  arquivos: ArquivoDoMaterial[];
};

const n3 = (v: number) => (Number.isFinite(v) ? v.toFixed(3) : "?");

/**
 * O bloco de instrução do material do cliente (vai no pedido, fora do cache):
 * quais arquivos existem, com o nome e a descrição do cliente, e a regra de
 * usar só eles.
 */
export function instrucaoDoMaterial(m: MaterialParaORedator, fase: "mapa" | "plano" = "plano"): string {
  const comMiniatura = m.arquivos.some((a) => a.miniatura);
  const linhas = m.arquivos.map(
    (a) =>
      `- "${a.id}"${a.papel ? ` (${ROTULO_DO_PAPEL[a.papel].toUpperCase()})` : ""}: arquivo ${a.arquivo}, ${a.largura}×${a.altura} px, proporção altura÷largura ${n3(a.proporcao)}. Nome dado pelo cliente: "${a.nome}".${a.descricao ? ` O que mostra, nas palavras dele: "${a.descricao}".` : ""}`
  );
  return [
    `# O MATERIAL DO CLIENTE PARA ESTE MODELO (${m.oQue})`,
    "",
    "O cliente mandou estes arquivos para este modelo, e eles já estão no projeto, no lugar onde o template espera (como a skill manda para o material do usuário, que passa na frente de qualquer outra fonte). São os ÚNICOS arquivos de tela, print ou foto do cliente que existem:",
    ...linhas,
    "",
    `Como o plano usa cada arquivo neste modelo: ${m.noPlano}`,
    "",
    "Regras do material (valem junto com a skill):",
    "- Use SÓ estes arquivos onde a skill pede captura, print ou foto do usuário. Nada de página pública, de captura nova, de busca de imagem para o lugar deles, e nunca interface desenhada: o produto do cliente aparece como ele é.",
    "- Cite cada arquivo exatamente pelo id entre aspas acima. Um id fora desta lista quebra o render.",
    "- A tela mostra o que o arquivo mostra: não descreva, não aponte e não escreva sobre o arquivo nada que ele não tenha. Na dúvida sobre o conteúdo, use o nome e a descrição do cliente.",
    "- Cada arquivo pode entrar mais de uma vez (outro ponto, outra câmera, outro foco), e nem todos precisam entrar; mas o vídeo usa o material do cliente pelo menos uma vez, na assinatura do modelo quando ela é o lugar dele.",
    ...(comMiniatura
      ? ["- As imagens anexadas com o rótulo \"MATERIAL DO CLIENTE\" são estes arquivos, reduzidos (lado maior 900 px), na mesma ordem. Meça nelas as frações (x, y, foco, cursor, ponta da seta) do que a pessoa cita, como a skill manda: frações do arquivo inteiro, nunca chutadas."]
      : []),
    ...(fase === "mapa" ? ["- No mapa, diga em que trecho entra cada arquivo. Na lista de imagens, não peça imagem para o lugar que um arquivo do cliente ocupa."] : []),
  ].join("\n");
}

/** As miniaturas do material para o redator, na ordem dos arquivos. */
export function imagensDoMaterial(m: MaterialParaORedator | null | undefined): Array<{ base64: string; rotulo: string }> {
  return (m?.arquivos ?? [])
    .filter((a) => a.miniatura)
    .map((a) => ({ base64: a.miniatura as string, rotulo: `MATERIAL DO CLIENTE "${a.id}"${a.papel ? ` (${ROTULO_DO_PAPEL[a.papel]})` : ""}: ${a.nome} (${a.largura}×${a.altura} px, proporção ${n3(a.proporcao)})` }));
}
