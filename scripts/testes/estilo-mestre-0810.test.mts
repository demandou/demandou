// O cenário do vídeo e o estilo mestre (08/10/2026, à noite).
// Os pedidos do Bruno, literais: "deixe uma opção para o usuário selecionar:
// trocar fundo do vídeo ou manter cenário original"; e "sobre a arte do
// carrossel, posts, estilo do vídeo de IA... tudo isso, o usuário pode
// selecionar: deixar a IA criar a partir do estilo mestre selecionado (o
// estilo do vídeo; aí toda arte segue o mesmo design), escolher um estilo da
// biblioteca ou criar meu próprio estilo a partir de uma ideia".
// Nada aqui toca banco, IA, rede ou imagem paga: a biblioteca é um depósito em
// memória, e o JEV e o redator são fakes.
// Rodar: npx tsx --test scripts/testes/estilo-mestre-0810.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { CATALOGO_DE_ESTILOS, escolhaDoPatch, escolhaDoPut, normalizarEscolha } from "@/lib/media/catalogo-de-estilos";
import {
  avisoDaTrocaDeFundo,
  cenarioDaEscolha,
  fundoSeraTrocado,
  OPCOES_DE_CENARIO,
  resumoDoCenario,
  trocaDeFundoLigada,
  trocaDeFundoNoValor,
} from "@/lib/media/cenario-do-video";
import { resumoDaEdicao } from "@/lib/media/edicao-escolhida";
import { escolhaNoEstiloDoDia, escolhaSincronizadaComComando } from "@/lib/media/estilo-do-comando";
import { decidirLinguagem, type EntradaDoPlanoPeloJev } from "@/lib/media/editor-por-comando/plano-pelo-jev";
import { planejarJornada } from "@/lib/media/jornada/planejar";
import { contextoEmTexto, type ContextoDaJornada } from "@/lib/media/jornada/contexto";
import {
  assinaturaDoTexto,
  designMestreEmDia,
  ESCOLHAS_DOS_POSTS,
  estiloMestreDe,
  linguagemDoEstiloDeVideo,
  OPCOES_DE_ESTILO,
} from "@/lib/estilo-dos-posts/estilo-mestre";
import { designMestreParaRefazer, garantirDesignMestre, type DepositoDoMestre } from "@/lib/estilo-dos-posts/design-mestre";
import {
  comoOPostDesenha,
  ESCOLHA_DO_MESTRE,
  modeloDoPostValido,
  modeloParaOFormato,
  modeloServeAoPost,
  modelosDaPeca,
  modelosParaGravar,
  oQueOPostPede,
  postsSemModelo,
  preencherModelos,
  resumoDoEstilo,
  todosEstaoNoMestre,
  todosNoMestre,
  type PostVisual,
} from "@/lib/estilo-dos-posts/tipos";
import { modeloDoDesign, registrarModeloDoCliente } from "@/lib/modelos-de-arte/modelo-do-cliente";
import { modeloDaPeca, modeloPorId } from "@/lib/modelos-de-arte/catalogo";
import { normalizarSemana, semanaComModelos, diasDeVideoCurto } from "@/lib/media/semana-do-video";
import type { DesignDaGaleria } from "@/lib/biblioteca-de-design/tipos";
import type { PerguntaDoJev, RespostaDoJev } from "@/lib/jev/cliente";

const fonte = (caminho: string) => readFileSync(new URL(`../../${caminho}`, import.meta.url), "utf8");

// ─────────────── A. o cenário do vídeo ───────────────

test("A: o cenário padrão é o original, e a escolha é guardada no Json do estilo", () => {
  assert.equal(normalizarEscolha(null).cenario, "original", "projeto sem escolha: o cenário original");
  assert.equal(normalizarEscolha({ estiloId: "vox" }).cenario, "original", "escolha antiga sem o campo: original");
  assert.equal(normalizarEscolha({ estiloId: "vox", cenario: "trocar" }).cenario, "trocar");
  assert.equal(normalizarEscolha({ estiloId: "vox", cenario: "qualquer coisa" }).cenario, "original", "valor inválido vira o padrão");
  assert.equal(cenarioDaEscolha(undefined), "original");
  assert.equal(cenarioDaEscolha({ cenario: "trocar" }), "trocar");
  assert.deepEqual(OPCOES_DE_CENARIO.map((o) => o.id), ["original", "trocar"]);
  assert.deepEqual(OPCOES_DE_CENARIO.map((o) => o.rotulo), ["Manter o cenário original", "Trocar o fundo do vídeo"]);
  for (const o of OPCOES_DE_CENARIO) assert.ok(o.explicacao.length > 20 && o.explicacao.split(/[.!?]\s/).length === 1, `uma frase só: ${o.explicacao}`);
});

test("A: o PATCH grava o cenário por um caminho só, sem mexer na legenda; e recusa o corpo vazio", () => {
  const guardada = { estiloId: "consorcio", camera: [], efeitos: [], look: null, legenda: { modo: "sem" }, legendaDosCortes: { modo: "estilo", estilo: "caixa" }, insercoesIA: true };
  const r = escolhaDoPatch(guardada, "acelerado", { cenario: "trocar" })!;
  assert.equal(r.escolha.cenario, "trocar");
  assert.deepEqual(r.escolha.legenda, { modo: "sem" }, "a legenda ficou");
  assert.deepEqual(r.escolha.legendaDosCortes, { modo: "estilo", estilo: "caixa" }, "a dos cortes também");
  assert.equal(r.escolha.insercoesIA, true);
  assert.equal(r.escolha.estiloId, "consorcio");
  // Trocar a legenda depois não desfaz o cenário.
  const r2 = escolhaDoPatch(r.escolha, "acelerado", { legenda: { modo: "auto" } })!;
  assert.equal(r2.escolha.cenario, "trocar");
  assert.equal(r2.escolha.legenda.modo, "auto");
  // Voltar ao original.
  assert.equal(escolhaDoPatch(r2.escolha, "acelerado", { cenario: "original" })!.escolha.cenario, "original");
  // Nada que este caminho grava: a rota responde 400.
  assert.equal(escolhaDoPatch(guardada, "acelerado", {}), null);
  assert.equal(escolhaDoPatch(guardada, "acelerado", { cenario: "fundo-roxo" }), null, "cenário inválido não é pedido");
  const rota = fonte("app/api/projects/[id]/estilo-de-edicao/route.ts");
  assert.ok(rota.includes("escolhaDoPatch(p?.videoEstiloEscolha, p?.videoStyle, corpo)"), "o PATCH usa a regra pura");
});

test("A: o PUT do catálogo preserva o cenário guardado (como preserva a legenda)", () => {
  const guardada = { estiloId: "vox", legenda: { modo: "sem" }, cenario: "trocar" };
  // A tela do catálogo carregou antes da troca e manda o cenário velho no corpo.
  const corpo = { estiloId: "hormozi", camera: ["crash-zoom"], efeitos: [], look: null, legenda: { modo: "auto" }, cenario: "original" };
  const e = escolhaDoPut(corpo, guardada);
  assert.equal(e.estiloId, "hormozi", "o estilo do corpo vale");
  assert.equal(e.cenario, "trocar", "o cenário que estava guardado fica");
  assert.deepEqual(e.legenda, { modo: "sem" }, "a legenda que estava guardada fica");
  assert.equal(escolhaDoPut(corpo, null).cenario, "original", "sem nada guardado, o padrão");
  const rota = fonte("app/api/projects/[id]/estilo-de-edicao/route.ts");
  assert.ok(rota.includes("escolhaDoPut(await req.json().catch(() => ({})), guardada?.videoEstiloEscolha)"));
  // O comando do vídeo e o estilo do dia do corte reescrevem a escolha sem perder o cenário.
  const sinc = escolhaSincronizadaComComando({ texto: "x", referencia: "consorcio" }, guardada, "serio")!;
  assert.equal(sinc.escolha.cenario, "trocar");
  assert.equal(escolhaNoEstiloDoDia(guardada, "serio", "hormozi")!.escolha.cenario, "trocar");
});

test("A: o editor de hoje nunca troca o fundo, com qualquer escolha", () => {
  assert.equal(trocaDeFundoLigada(), trocaDeFundoNoValor(process.env.NEXT_PUBLIC_TROCA_DE_FUNDO));
  assert.equal(trocaDeFundoNoValor(undefined), false);
  assert.equal(trocaDeFundoNoValor("0"), false);
  assert.equal(trocaDeFundoNoValor("1"), true);
  // A única porta: "trocar" com o editor novo ligado.
  assert.equal(fundoSeraTrocado("trocar", false), false, "pediu trocar, o editor de hoje não troca");
  assert.equal(fundoSeraTrocado("original", true), false, "editor novo ligado, mas o cliente quer o original");
  assert.equal(fundoSeraTrocado(undefined, true), false);
  assert.equal(fundoSeraTrocado("trocar", true), true);
  // O resolvedor do editor por comando confere o interruptor em todo plano, inclusive nos antigos.
  assert.ok(fonte("lib/media/editor-por-comando/resolver.ts").includes('const cenarioTrocado = p.linguagem?.cenario === "trocado" && trocaDeFundoLigada();'));
  // O editor sob medida não tem quem ponha "trocado" no contexto dele.
  assert.ok(!/cenario:\s*"trocado"/.test(fonte("lib/media/montagem-nos-cortes.ts")));
});

/** Um JEV de mentira que responde SIM a tudo (inclusive "troque o fundo") e guarda o que perguntaram. */
function jevQueDizSim() {
  const perguntadas: string[] = [];
  const jev = async (_c: unknown, perguntas: Record<string, PerguntaDoJev>): Promise<Record<string, RespostaDoJev>> => {
    perguntadas.push(...Object.keys(perguntas));
    return Object.fromEntries(
      Object.entries(perguntas).map(([k, p]) => [
        k,
        p.type === "noul"
          ? { type: "noul" as const, noul: k === "semVideo" ? 0 : 0.99 }
          : p.type === "choice"
            ? { type: "choice" as const, choice: Object.keys(p.criteria)[0], probabilities: {}, confidence: 0.9 }
            : { type: "score" as const, score: 1, legend: {}, probabilities: {}, confidence: 0.9 },
      ])
    );
  };
  return { jev, perguntadas };
}

test("A: o comando que pede para trocar o fundo, com o JEV dizendo sim, ainda sai com a gravação", async () => {
  const comando = { texto: "Troque o meu fundo por uma biblioteca antiga e ponha colagem de papel nas artes", fonte: "geist", cores: { tipo: "marca" }, origem: "escrito" };
  for (const cenarioDoCliente of [undefined, "original", "trocar"] as const) {
    const { jev, perguntadas } = jevQueDizSim();
    const e = { comando, frases: [], duracao: 30, formato: "9:16", base: "keynote", simulacao: { jev }, cenarioDoCliente } as unknown as EntradaDoPlanoPeloJev;
    const L = await decidirLinguagem(e);
    assert.equal(L.cenario, "gravacao", `cenário do cliente ${cenarioDoCliente ?? "ausente"}: a gravação fica`);
    if (!trocaDeFundoLigada()) assert.ok(!perguntadas.includes("trocarCenario"), "nem se pergunta ao JEV o que não pode mudar nada");
  }
  // Sem o JEV (a reserva por palavras), a mesma regra.
  const semJev = await decidirLinguagem({ comando, frases: [], duracao: 30, formato: "9:16", base: "keynote", cenarioDoCliente: "trocar" } as unknown as EntradaDoPlanoPeloJev);
  if (!trocaDeFundoLigada()) assert.equal(semJev.cenario, "gravacao");
});

test("A: o cenário escolhido vai até o plano da jornada, sem entrar no texto dos pedidos", async () => {
  let t = 0;
  const palavras = "Hoje eu mostro como planejar a troca do carro sem juros".split(" ").map((w) => {
    const p = { texto: w, inicio: +t.toFixed(2), fim: +(t + 0.35).toFixed(2) };
    t += 0.42;
    return p;
  });
  const contexto: ContextoDaJornada = { marca: "Loja X", nicho: "consórcio", perfil: null, cores: { acento: "#f97316", escuro: "#111111", claro: "#fafafa" }, estiloDoCliente: "", formato: "9:16", duracao: t + 0.5, destino: "vídeo curto vertical", cenario: "trocar" };
  const redator = async () => JSON.stringify({ ideias: [] });
  const jev = async () => ({});
  const feito = await planejarJornada({ palavras, contexto, leituraPronta: { leitura: null, amostras: [] } }, { ler: async () => ({ leitura: null, amostras: [], custoUsd: 0, avisos: [] }), redator, jev, projectId: null } as never);
  assert.equal(feito.plano.cenario, "trocar", "o plano guarda a escolha para o editor novo");
  const semEscolha = await planejarJornada({ palavras, contexto: { ...contexto, cenario: undefined }, leituraPronta: { leitura: null, amostras: [] } }, { ler: async () => ({ leitura: null, amostras: [], custoUsd: 0, avisos: [] }), redator, jev, projectId: null } as never);
  assert.equal(semEscolha.plano.cenario, "original");
  assert.ok(!/trocar|cenário escolhido/i.test(contextoEmTexto(contexto)), "o pedido ao Sonnet não muda");
  // A montagem do completo grava o cenário e o manda ao worker, para o editor novo ler.
  const mc = fonte("lib/media/montagem-do-completo.ts");
  assert.ok(mc.includes('cenario: rj?.plano?.cenario ?? contexto.cenario ?? "original",'));
  assert.ok(mc.includes('cenario: j.cenario ?? "original",'));
  assert.ok(fonte("lib/media/jornada/servidor.ts").includes("cenario: cenarioDaEscolha(p?.videoEstiloEscolha)"));
});

test("A: a tela diz a verdade: trocar o fundo chega com o editor novo, e até lá sai o original", () => {
  const hoje = resumoDoCenario("trocar", false);
  assert.match(hoje, /editor novo/);
  assert.match(hoje, /cenário original/);
  assert.match(resumoDoCenario("original", false), /Cenário original/);
  assert.match(resumoDoCenario("trocar", true), /Fundo trocado/);
  assert.match(avisoDaTrocaDeFundo(false)!, /editor novo/);
  assert.equal(avisoDaTrocaDeFundo(true), null);
  // O resumo "como este vídeo vai ser editado" leva a linha do cenário.
  const r = resumoDaEdicao({ videoEstiloEscolha: { estiloId: "vox", cenario: "trocar" }, videoStyle: "serio", trocaDeFundo: false });
  assert.equal(r.cenarioEscolhido, "trocar");
  assert.match(r.cenario, /até lá, o vídeo sai com o cenário original/);
  assert.ok(fonte("components/video/como-o-squad-edita.tsx").includes("texto: resumo.cenario"));
  // O seletor mora junto do estilo do vídeo, e a frase honesta tem o X que recolhe (nunca some).
  const seletor = fonte("components/video/cenario-do-video.tsx");
  assert.ok(seletor.includes('method: "PATCH"') && seletor.includes("JSON.stringify({ cenario: novo })"));
  assert.ok(seletor.includes("<AvisoDescartavel") && seletor.includes('modo="recolher"') && seletor.includes('chaveDaDica("troca-de-fundo-em-breve", projectId)'));
  assert.ok(seletor.includes("trocaDeFundoLigada()"));
  const estilo = fonte("components/video/estilo-do-projeto.tsx");
  assert.ok(estilo.includes("<CenarioDoVideoNaTela projectId={projectId} />") && estilo.includes("!semCenario"));
});

// ─────────────── B. o estilo mestre ───────────────

const SEMANA: PostVisual[] = [
  { chave: "1", rotulo: "Segunda", formato: "video" },
  { chave: "3", rotulo: "Quarta", formato: "carousel" },
  { chave: "4", rotulo: "Quinta", formato: "image" },
  { chave: "5", rotulo: "Sexta", formato: "short" },
  { chave: "6", rotulo: "Sábado", formato: "infographic" },
];

test("B: as três opções aparecem na mesma ordem e com o mesmo texto em todo lugar", () => {
  assert.deepEqual(OPCOES_DE_ESTILO.map((o) => o.id), ["mestre", "biblioteca", "criar"]);
  assert.deepEqual(OPCOES_DE_ESTILO.map((o) => o.rotulo), ["Estilo mestre", "Da biblioteca", "Criar o meu"]);
  assert.deepEqual(ESCOLHAS_DOS_POSTS.map((o) => o.id), ["mestre", "por-post"], "todas no mestre vem primeiro (o padrão)");
  const componente = fonte("components/estilo-dos-posts/opcoes-de-estilo.tsx");
  assert.ok(componente.includes("OPCOES_DE_ESTILO.map((o) =>"), "o componente desenha a lista única");
  // Configurações > Estilo dos posts, o modelo de cada post (campanha, semana do vídeo e vídeo por IA): o mesmo componente.
  for (const arquivo of ["components/estilo-dos-posts/estilo-dos-posts.tsx", "components/estilo-dos-posts/modelos-dos-posts.tsx"]) {
    assert.ok(fonte(arquivo).includes("<OpcoesDeEstilo"), `${arquivo} usa as três portas de sempre`);
  }
  // Ninguém escreve os rótulos à mão: só a lista única os tem.
  const telas = ["components/estilo-dos-posts", "components/posts", "components/video"].flatMap((d) => readdirSync(new URL(`../../${d}`, import.meta.url)).filter((f) => f.endsWith(".tsx")).map((f) => `${d}/${f}`));
  for (const arquivo of telas) {
    const t = fonte(arquivo);
    for (const rotulo of ['"Estilo mestre"', '"Da biblioteca"', '"Criar o meu"']) assert.ok(!t.includes(rotulo), `${arquivo} escreve ${rotulo} à mão`);
  }
  // O modelo de cada post é o mesmo componente na campanha, na semana do vídeo e na página do gêmeo.
  assert.ok(fonte("components/posts/campaign-setup-modal.tsx").includes("<ModelosDosPosts"));
  assert.ok(fonte("components/posts/jornada-da-campanha.tsx").includes("<ModelosDosPosts"));
  assert.ok(fonte("components/estilo-dos-posts/pecas-no-estilo-mestre.tsx").includes("<ModelosDosPosts"));
});

test("B: o estilo mestre é o padrão de cada post: foto, carrossel, vídeo por IA e vídeo curto", () => {
  assert.equal(oQueOPostPede("video"), "video-ia", "o vídeo por IA ganha as três opções");
  const preenchido = preencherModelos(SEMANA, {}, {});
  for (const k of ["1", "3", "4", "5"]) assert.equal(preenchido[k]?.mestre, true, `o dia ${k} vem no mestre`);
  assert.equal(preenchido["6"]?.marca, true, "o infográfico segue na marca");
  assert.deepEqual(postsSemModelo(SEMANA, preenchido), [], "nada falta: a campanha gera");
  // Mesmo com o último modelo guardado e um estilo aprovado: o mestre é o padrão.
  const ultimos = { carousel: { designId: "cmcarrossel", nome: "Carrossel de sempre" }, short: { estiloId: "vox", nome: "Vox" } };
  const comUltimos = preencherModelos(SEMANA, {}, { ultimos, padraoDaImagem: { designId: "cmestilo", nome: "Estilo do projeto" } });
  assert.equal(comUltimos["3"]?.mestre, true);
  assert.equal(comUltimos["5"]?.mestre, true);
  // Com o estilo próprio escolhido pelo dono em Configurações, vale a regra de antes.
  const proprio = preencherModelos(SEMANA, {}, { ultimos, padraoDaImagem: { designId: "cmestilo", nome: "Estilo do projeto" }, modo: "por-post" });
  assert.equal(proprio["3"]?.designId, "cmcarrossel");
  assert.equal(proprio["4"]?.designId, "cmestilo");
  assert.equal(proprio["5"]?.estiloId, "vox");
  assert.equal(proprio["1"]?.mestre, true, "o vídeo por IA não tem estilo próprio do projeto: mestre");
  // O que a pessoa escolheu não é trocado pelo preenchimento.
  assert.equal(preencherModelos(SEMANA, { "3": { designId: "cmmeu", nome: "Meu" } }, {})["3"]?.designId, "cmmeu");
  // "Todas as peças seguem o estilo mestre".
  const todos = todosNoMestre(SEMANA);
  assert.ok(todosEstaoNoMestre(SEMANA, todos));
  assert.equal(todos["6"]?.marca, true);
  assert.equal(todosEstaoNoMestre(SEMANA, { ...todos, "4": { designId: "x" } }), false);
  // A escolha vai à esteira como as outras.
  assert.deepEqual(Object.keys(modelosParaGravar(SEMANA, todos)).sort(), ["1", "3", "4", "5", "6"]);
});

test("B: a escolha do mestre vale em cada formato que pede estilo, e o vídeo por IA tem as três portas", () => {
  assert.deepEqual(modeloDoPostValido({ mestre: true, designId: "x" }), { mestre: true }, "o mestre manda sozinho");
  for (const f of ["image", "carousel", "video", "short"]) assert.ok(modeloParaOFormato(ESCOLHA_DO_MESTRE, f), f);
  assert.equal(modeloParaOFormato(ESCOLHA_DO_MESTRE, "infographic"), null, "o infográfico é desenhado na marca");
  assert.equal(modeloServeAoPost({ estiloId: "vox" }, "video-ia"), true, "da biblioteca: um estilo de vídeo do catálogo");
  assert.equal(modeloServeAoPost({ designId: "cmvideo" }, "video-ia"), true, "criado a partir de uma ideia: um design de vídeo");
  assert.equal(modeloServeAoPost({ marca: true }, "video-ia"), true, "a campanha de antes (o estilo visual da mídia) continua valendo");
  assert.equal(modeloServeAoPost({ estiloId: "vox" }, "modelo"), false, "estilo de vídeo não é modelo de foto");
  // A semana do vídeo: o corte no mestre sai no estilo do projeto (nenhum estilo do dia).
  const semana = semanaComModelos(normalizarSemana({ versao: 2, inicio: "2026-10-12", dias: { "5": { formato: "short", redes: ["youtube"] } } }, undefined, false), { "5": ESCOLHA_DO_MESTRE });
  assert.equal(semana.dias["5"]?.modelo?.mestre, true);
  assert.deepEqual(diasDeVideoCurto(semana), [{ dia: 5, redes: ["youtube"] }], "sem estilo do dia: o do projeto");
  // A linguagem do vídeo por IA de um estilo do catálogo é o bloco pesquisado dele (nunca a cena).
  assert.match(linguagemDoEstiloDeVideo("vox")!, /paper-collage/);
  for (const e of CATALOGO_DE_ESTILOS) assert.ok((linguagemDoEstiloDeVideo(e.id) ?? "").split(" ").length > 12, `${e.id} tem linguagem para o vídeo por IA`);
  assert.equal(linguagemDoEstiloDeVideo("nao-existe"), null);
  const esteira = fonte("lib/pipeline/executar.ts");
  assert.ok(esteira.includes("const linguagem = await linguagemDoVideoPorIA(project.id, modeloDoDia);"));
  assert.ok(esteira.includes("if (linguagem) styleHintEn = `${linguagem} ${paleta} ${direcao.mundo}`;"));
  assert.ok(esteira.includes("estiloVisual: styleHintEn,"), "o roteiro do vídeo por IA recebe a linguagem escolhida");
  const rota = fonte("app/api/projects/[id]/estilo-dos-posts/route.ts");
  assert.ok(rota.includes('const tipo = corpo.tipo === "video" ? "video" : "imagem";'), "criar o meu, no vídeo por IA, cria um design de vídeo");
  assert.ok(fonte("components/estilo-dos-posts/criar-estilo.tsx").includes('...(doVideo ? { tipo: "video" } : {})'));
});

// O depósito em memória do design mestre: o fluxo inteiro sem banco, sem JEV e sem IA.
function mestreEmMemoria(inicial: { comando?: { texto: string; referencia?: string | null } | null; escolha?: unknown }) {
  const projeto = { comando: inicial.comando ?? null, escolha: inicial.escolha ?? { estiloId: "consorcio" }, videoStyle: "acelerado" as string | null };
  const designs = new Map<string, DesignDaGaleria>();
  let guardado: Parameters<DepositoDoMestre["gravar"]>[1] | null = null;
  const pedidos: Array<{ pedido: string; tipo: string; comoEntrou?: string; userId: string }> = [];
  const deposito: DepositoDoMestre = {
    async fonte() {
      return { comando: projeto.comando, escolha: projeto.escolha, videoStyle: projeto.videoStyle, donoId: "cmdono", nicho: "consórcio", publico: null };
    },
    async lerGuardado() {
      return guardado;
    },
    async gravar(_p, g) {
      guardado = g;
    },
    async lerDesign(_p, id) {
      return designs.get(id) ?? null;
    },
    async registrar(o) {
      pedidos.push({ pedido: o.pedido, tipo: o.tipo, comoEntrou: o.comoEntrou, userId: o.userId });
      // Um redator de mentira lento o bastante para duas artes pedirem juntas.
      await new Promise((r) => setTimeout(r, 20));
      const id = `cmmestre${pedidos.length}`;
      const d: DesignDaGaleria = { id, tipo: "imagem", nome: "Luxo escuro com faixa", descricao: "Fundo escuro premium, número em faixa de destaque.", pedidoOriginal: "", linguagem: "Dark premium editorial look, a bold highlight band for the key number, generous negative space, brand colors only as small accents.", previaUrl: null, usos: 0, origem: "cliente", agrupadoEmId: null, catalogoId: null, publico: true, createdAt: new Date("2026-10-08T20:00:00Z").toISOString() };
      designs.set(id, d);
      return { design: d, veredito: "novo" };
    },
  };
  return { deposito, projeto, pedidos, guardado: () => guardado };
}

test("B: o post no estilo mestre usa o design mestre, o design que sai do estilo do vídeo", async () => {
  const m = mestreEmMemoria({ comando: { texto: "Autoridade high ticket: número em faixa de destaque, selo com o nome, cores fortes da marca", referencia: "consorcio" } });
  const feito = await garantirDesignMestre("cmprojeto", { deposito: m.deposito });
  assert.ok(feito.design, "o design mestre saiu");
  assert.equal(feito.refeito, true);
  assert.equal(m.pedidos.length, 1);
  assert.equal(m.pedidos[0].tipo, "imagem", "um design de ARTE, pelo mesmo fluxo de quem cria escrevendo");
  assert.equal(m.pedidos[0].comoEntrou, "mestre", "ligado como mestre: não vira o 'design mais recente' que o cliente escreveu");
  assert.equal(m.pedidos[0].userId, "cmdono", "sem quem pediu, o dono do projeto");
  assert.match(m.pedidos[0].pedido, /mesmo design do vídeo: Autoridade high ticket/);
  assert.equal(feito.mestre.nome, "Autoridade high ticket");
  // A arte do post no mestre: o design mestre vira o molde, e a IA põe o conteúdo do dia dentro dele.
  assert.equal(comoOPostDesenha(ESCOLHA_DO_MESTRE), "mestre");
  const modelo = modeloDoDesign(feito.design!)!;
  registrarModeloDoCliente(modelo);
  assert.equal(modelo.id, `design-${feito.design!.id}`);
  assert.deepEqual(modelosDaPeca({ doPost: modelo.id, doProjeto: "design-outro", book: ["foto-inteira-degrade"] }), [modelo.id], "o design mestre é o único modelo da peça");
  assert.equal(modeloDaPeca([modelo.id], "carrossel", "O lance certo encurta a espera")?.id, modelo.id, "o carrossel também");
  assert.equal(modeloPorId(modelo.id)?.nome, "Luxo escuro com faixa");
  // A marca da arte segue o mestre.
  const arte = fonte("lib/media/arte-com-frase.tsx");
  assert.ok(arte.includes('if (como === "mestre") {') && arte.includes("await garantirDesignMestre(projectId);"));
  assert.ok(arte.includes("const modelos = doPost?.semModelo ? undefined : modelosDaPeca("), "sem o design mestre, nem o book: a direção do vídeo");
  // Os outros formatos de vídeo não pedem modelo de imagem.
  assert.equal(comoOPostDesenha({ estiloId: "vox" }), "estilo-de-video");
  assert.equal(comoOPostDesenha({ marca: true }), "marca");
  assert.equal(comoOPostDesenha({ catalogoId: "foto-inteira-degrade" }), "book");
  assert.equal(comoOPostDesenha(null), null);
});

test("B: o design mestre só é refeito quando o estilo do vídeo muda, nunca a cada post", async () => {
  const m = mestreEmMemoria({ escolha: { estiloId: "vox", legenda: { modo: "auto" }, cenario: "original" } });
  // Duas artes ao mesmo tempo: uma derivação.
  const [a, b] = await Promise.all([garantirDesignMestre("cmprojeto", { deposito: m.deposito }), garantirDesignMestre("cmprojeto", { deposito: m.deposito })]);
  assert.equal(m.pedidos.length, 1, "duas artes juntas pagam uma vez");
  assert.equal(a.design?.id, b.design?.id);
  // Dez posts depois: nenhuma IA.
  for (let i = 0; i < 10; i++) {
    const r = await garantirDesignMestre("cmprojeto", { deposito: m.deposito });
    assert.equal(r.refeito, false);
  }
  assert.equal(m.pedidos.length, 1, "o design gravado vale para todos os posts");
  // Trocar a legenda, o cenário ou as camadas não é mudar o estilo do vídeo.
  m.projeto.escolha = { estiloId: "vox", legenda: { modo: "sem" }, cenario: "trocar", camera: ["dolly-in"] };
  await garantirDesignMestre("cmprojeto", { deposito: m.deposito });
  assert.equal(m.pedidos.length, 1);
  // Trocar o estilo do vídeo: refaz, uma vez.
  m.projeto.escolha = { estiloId: "lousa" };
  const novo = await garantirDesignMestre("cmprojeto", { deposito: m.deposito });
  assert.equal(novo.refeito, true);
  assert.equal(m.pedidos.length, 2);
  await garantirDesignMestre("cmprojeto", { deposito: m.deposito });
  assert.equal(m.pedidos.length, 2);
  // O comando escrito manda: mudar o texto refaz; o mesmo texto (só letra ou cores) não.
  m.projeto.comando = { texto: "Estilo Vox, colagem de papel", referencia: "vox" };
  await garantirDesignMestre("cmprojeto", { deposito: m.deposito });
  assert.equal(m.pedidos.length, 3);
  m.projeto.comando = { texto: "  estilo vox,   colagem de papel ", referencia: "vox" };
  await garantirDesignMestre("cmprojeto", { deposito: m.deposito });
  assert.equal(m.pedidos.length, 3, "espaço e caixa não mudam o estilo");
  // A regra pura da assinatura.
  const mestre = estiloMestreDe({ comando: { texto: "Estilo Vox, colagem de papel", referencia: "vox" } });
  assert.equal(mestre.estiloId, "vox");
  assert.equal(mestre.origem, "comando");
  assert.equal(assinaturaDoTexto("A b"), assinaturaDoTexto(" a   B "));
  assert.equal(designMestreEmDia({ designId: "d", nome: "", descricao: "", assinatura: mestre.assinatura, estiloId: "vox", feitoEm: "" }, mestre), true);
  assert.equal(designMestreEmDia(null, mestre), false);
  // Sem comando, o estilo do catálogo e a nota escrita nele.
  const doCatalogo = estiloMestreDe({ escolha: { estiloId: "consorcio", texto: "mais escuro" } });
  assert.equal(doCatalogo.origem, "catalogo");
  assert.match(doCatalogo.pedido, /Do jeito do cliente: mais escuro/);
  // A tela lê o estado do mestre sem derivar nada; a rota que prepara é de quem usa o projeto (o membro também).
  const rota = fonte("app/api/projects/[id]/estilo-dos-posts/mestre/route.ts");
  const post = rota.slice(rota.indexOf("export async function POST"), rota.indexOf("export async function PUT"));
  assert.ok(post.includes("garantirDesignMestre(id, { userId: r.userId })") && !post.includes("soODono"), "o membro da equipe também prepara");
  assert.ok(rota.slice(rota.indexOf("export async function PUT")).includes("soODono("), "o padrão do projeto é do dono");
  assert.ok(!fonte("lib/estilo-dos-posts/servidor.ts").includes("garantirDesignMestre"), "a leitura do estado nunca chama a IA");
});

test("B: a linha do estilo dos posts diz quando eles seguem o estilo mestre", () => {
  assert.equal(resumoDoEstilo({ aprovada: false, design: null, modelos: [], modo: "mestre", mestre: { nome: "Lousa de negócios", referencia: null, estiloId: "lousa", design: null, emDia: false } }), "Seus posts seguem o estilo mestre, o do vídeo (Lousa de negócios).");
  assert.equal(resumoDoEstilo({ aprovada: true, design: { id: "d", nome: "Aquarela", descricao: "", previaUrl: null }, modelos: [], modo: "por-post" }), 'Seus posts saem no estilo "Aquarela".');
});

test("B: o estilo vem primeiro em toda porta (menos o conteúdo pronto), e a escolha das peças logo depois", () => {
  const passo = fonte("components/estilo-dos-posts/passo-do-estilo-mestre.tsx");
  assert.ok(passo.includes('mostrar="estilo" semCenario={!comCenario}'), "o estilo mestre é o estilo do vídeo, com o cenário");
  assert.ok(passo.includes("<EscolhaDosPosts valor={modo} aoMudar={aoMudarModo} />"));
  assert.ok(passo.includes('data-lugar="material-da-campanha"'), "o lugar do material próprio da campanha, sem implementar");
  // A porta do vídeo: da porta, sempre ao passo do estilo.
  const jornada = fonte("components/posts/jornada-da-campanha.tsx");
  assert.ok(jornada.includes('{ chave: "estilo", titulo: "O estilo mestre" }'));
  assert.ok(/if \(passo === 0\) \{\s*setPasso\(semGravacao \? total - 1 : 1\);/.test(jornada), "o pulo parte do estilo");
  assert.ok(jornada.includes("<PassoDoEstiloMestre") && jornada.includes("comCenario"));
  assert.ok(jornada.includes("const passoInicial = comecarNoVideo ? 1 : 0;"), "quem veio da aba Criar começa no estilo");
  // A porta da IA: o passo do estilo antes do formato da campanha, sem cenário (não há gravação).
  const modal = fonte("components/posts/campaign-setup-modal.tsx");
  assert.ok(modal.includes('origem === "tema" && !estiloVisto && projectId ? (') && modal.includes("comCenario={false}"));
  assert.ok(modal.includes("todosNoMestre(postsVisuais)"), "todas as peças no mestre, sem lista para conferir");
  // A porta do gêmeo: logo depois do estilo, a escolha das peças.
  const gemeo = fonte("app/(app)/projects/[id]/gemeo/page.tsx");
  assert.ok(gemeo.indexOf("<ComoOSquadEdita") < gemeo.indexOf("<PecasNoEstiloMestre"), "o estilo primeiro, as peças depois");
  // O conteúdo pronto não passa pelo estilo: nada é gerado.
  assert.ok(!fonte("components/posts/janela-do-conteudo-pronto.tsx").includes("PassoDoEstiloMestre"));
});

// ─────────────── a revisão cética do ramo (08/10) ───────────────

test("revisão: o design mestre é preparado num ponto só, no fim da pesquisa, antes dos dias e do vídeo", () => {
  const esteira = fonte("lib/pipeline/executar.ts");
  const pesquisa = esteira.indexOf('if (fatia.fase === "pesquisa") {');
  const preparo = esteira.indexOf("const feito = await garantirDesignMestre(project.id).catch(() => null);");
  assert.ok(pesquisa > 0 && preparo > pesquisa && preparo - pesquisa < 1200, "logo no começo do fim da pesquisa");
  assert.ok(/some\(\(m\) => \(m as \{ mestre\?: unknown \} \| null\)\?\.mestre === true\)/.test(esteira), "só quando algum post está no mestre");
});

test("revisão: o design mestre em dia mas ilegível não vira uma derivação paga por arte", async () => {
  const agora = Date.parse("2026-10-08T21:00:00Z");
  assert.equal(designMestreParaRefazer({ feitoEm: "2026-10-08T20:55:00Z" }, agora), false, "recente: não refaz");
  assert.equal(designMestreParaRefazer({ feitoEm: "2026-10-08T20:00:00Z" }, agora), true, "antigo: o apagado de verdade volta");
  assert.equal(designMestreParaRefazer({ feitoEm: "" }, agora), true);
  // O fluxo: feito, depois ilegível (o banco piscou), dez artes: nenhuma IA a mais.
  const m = mestreEmMemoria({ escolha: { estiloId: "bbc" } });
  const primeiro = await garantirDesignMestre("cmprojeto", { deposito: m.deposito });
  assert.ok(primeiro.design);
  const ilegivel: DepositoDoMestre = { ...m.deposito, lerDesign: async () => null };
  for (let i = 0; i < 10; i++) {
    const r = await garantirDesignMestre("cmprojeto", { deposito: ilegivel });
    assert.equal(r.design, null);
  }
  assert.equal(m.pedidos.length, 1);
});

test("revisão: escolher os modelos do book é escolher o estilo dos posts; ligar o mestre não mexe no design do cliente", () => {
  const rota = fonte("app/api/projects/[id]/modelos-de-arte/route.ts");
  assert.ok(rota.includes('if (modelosMudaram && escolha?.ids.length) await salvarModoDosPosts(id, "por-post");'));
  const posts = fonte("app/api/projects/[id]/estilo-dos-posts/route.ts");
  assert.equal((posts.match(/if \(aprovacao\.aprovado\) await salvarModoDosPosts\(id, "por-post"\);/g) ?? []).length, 2, "criar e escolher como estilo do projeto");
  const registro = fonte("lib/biblioteca-de-design/registro.ts");
  assert.ok(registro.includes('update: o.comoEntrou === "mestre" ? {} : { comoEntrou: o.comoEntrou, updatedAt: new Date() },'));
  assert.ok(registro.includes('where: { projectId, tipo: "imagem", comoEntrou: { not: "mestre" } }'), "o mestre não é o design mais recente que o cliente escreveu");
});

test("revisão: nada é pintado de mestre antes de saber o padrão do projeto, e a tela não promete a grade que sumiu", () => {
  const modal = fonte("components/posts/campaign-setup-modal.tsx");
  assert.ok(modal.includes("const modoConhecido: ModoDosPosts | null = modoEscolhido ?? modoPadraoDosPosts;"));
  assert.ok(modal.includes('if (modoConhecido !== "mestre") return;'));
  assert.equal((modal.match(/<LinhaDaLinguagem projectId=\{projectId\} semGrade=\{modoDosPosts === "mestre"\} \/>/g) ?? []).length, 3);
  assert.ok(modal.includes('? " Todas as peças seguem o estilo mestre."'), "sem a grade, a linha não fala em escolher um estilo abaixo");
  const jornada = fonte("components/posts/jornada-da-campanha.tsx");
  assert.ok(jornada.includes('const nova = modoConhecido === "mestre" ? semanaNoMestre(semanaAtual) : semanaAtual;'));
  assert.ok(jornada.includes('modoConhecido === "mestre" && faltamModelos.length > 0'));
  assert.ok(/if \(aberto\) \{\s*setPasso\(passoInicial\);[\s\S]{0,120}setModoEscolhido\(null\);/.test(jornada), "cada abertura recomeça a escolha das peças");
  assert.ok(!fonte("components/estilo-dos-posts/modelos-dos-posts.tsx").includes("antes de enviar a gravação"), "fora da jornada não há gravação a enviar");
  assert.ok(fonte("components/kanban/step-materiais.tsx").includes("O padrão é o estilo mestre"));
});

test("nenhum texto novo usa travessão", () => {
  for (const arquivo of [
    "lib/media/cenario-do-video.ts",
    "lib/estilo-dos-posts/estilo-mestre.ts",
    "lib/estilo-dos-posts/design-mestre.ts",
    "lib/estilo-dos-posts/tipos.ts",
    "components/video/cenario-do-video.tsx",
    "components/estilo-dos-posts/opcoes-de-estilo.tsx",
    "components/estilo-dos-posts/passo-do-estilo-mestre.tsx",
    "components/estilo-dos-posts/pecas-no-estilo-mestre.tsx",
    "components/estilo-dos-posts/modelos-dos-posts.tsx",
    "components/estilo-dos-posts/estilo-dos-posts.tsx",
    "app/api/projects/[id]/estilo-dos-posts/mestre/route.ts",
    "components/posts/jornada-da-campanha.tsx",
    "components/kanban/step-materiais.tsx",
  ]) {
    assert.ok(!fonte(arquivo).includes(String.fromCharCode(0x2014)), arquivo);
  }
});
