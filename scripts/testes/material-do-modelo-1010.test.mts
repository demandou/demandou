/**
 * O material do cliente nos modelos do curso (10/10): o mapa por modelo (o que
 * a tela pede e onde o template espera), a regra de quando a edição pode
 * começar, a escolha na biblioteca, o envio ao worker e o worker pondo cada
 * arquivo onde o curso manda (com ffmpeg e o capturar.mjs do curso, sem nada
 * pago).
 *   npx tsx --test scripts/testes/material-do-modelo-1010.test.mts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const raiz = new URL("../../", import.meta.url);
const ler = (f: string) => readFileSync(new URL(f, raiz), "utf8").replace(/\r\n/g, "\n");
const TRAVESSAO = /[—–]/;

const M = await import("@/lib/media/editor-do-curso/material-do-modelo");
const { MODELOS_DO_CURSO, modeloServeNoCorte, modeloPodeSerEscolhido } = await import("@/lib/media/editor-do-curso/no-corte");
const { modelosDaBiblioteca, modelosQueServem } = await import("@/lib/media/editor-do-curso/biblioteca");
const { lerMontagem } = await import("@/lib/media/estado-da-montagem");
const W = await import(new URL("worker/src/modelo/material-do-modelo.mjs", raiz).href);
const { criarProjeto, rodarNoProjeto } = await import(new URL("worker/src/modelo/editar-no-modelo.mjs", raiz).href);

const SEIS = ["modelo-demo", "modelo-etapas", "modelo-guia", "modelo-janelas", "modelo-tela-viva", "modelo-transformacao"];
const item = (n: number, extra: Partial<{ nome: string; descricao: string; papel: "antes" | "depois" | null }> = {}) => ({ materialId: `m${n}`, nome: `tela ${n}`, descricao: "", ...extra });
const itens = (n: number) => Array.from({ length: n }, (_, i) => item(i + 1));

// ─────────────────────────────── o mapa por modelo ───────────────────────────────

test("o mapa cobre exatamente os seis modelos que o catálogo marca como não automáticos por material, no app e no worker", () => {
  const doCatalogo = MODELOS_DO_CURSO.filter((m) => !m.automatico && m.formato === "9:16" && m.pede.some((p) => ["capturas de tela", "gravação de tela", "fotos de antes e depois", "recorte da pessoa"].includes(p)))
    .map((m) => m.id)
    .sort();
  assert.deepEqual(doCatalogo, SEIS);
  assert.deepEqual(Object.keys(M.MATERIAL_DOS_MODELOS).sort(), SEIS);
  assert.deepEqual(Object.keys(W.MATERIAL_NO_TEMPLATE).sort(), SEIS);
  for (const id of SEIS) {
    const app = M.MATERIAL_DOS_MODELOS[id];
    const worker = W.MATERIAL_NO_TEMPLATE[id];
    // Quem não pede nada no app não tem pasta no worker, e vice-versa.
    assert.equal(app.minimo === 0, worker.pasta === null, id);
    assert.ok(app.minimo <= app.maximo, id);
    for (const t of [app.dica, app.aviso ?? "", app.emBreve ?? "", app.oQue ?? "", worker.noPlano ?? "", worker.oQue ?? ""]) assert.ok(!TRAVESSAO.test(t), `${id}: sem travessão`);
  }
});

test("o mapa do worker aponta para o que existe no template de cada modelo (pasta, nome, ferramenta e campo do plano)", () => {
  for (const id of SEIS) {
    const w = W.MATERIAL_NO_TEMPLATE[id];
    const t = (f: string) => new URL(`worker/modelos/${id}/template/${f}`, raiz);
    const skill = ler(`worker/modelos/${id}/referencias/SKILL.md`);
    if (w.pasta === "public/tela") {
      // Demo e Tela Viva: o template lê a captura direto de public/tela/<captura>.jpg.
      assert.match(readFileSync(t("src/componentes/Tela.tsx"), "utf8"), /staticFile\(`tela\/\$\{m\.captura\}\.jpg`\)/, id);
      assert.match(readFileSync(t("src/plano.ts"), "utf8"), /captura: string;[\s\S]*proporcao: number;/, id);
      assert.match(skill, /Material do usuário em `public\/tela\/` passa na frente/, id);
      assert.equal(w.registro, null, id);
    } else if (w.registro === "capturar") {
      // Etapas e Guia: o print do usuário vai por capturar.mjs --arquivo, que registra em plano.imagens.
      const capturar = readFileSync(t("ferramentas/capturar.mjs"), "utf8");
      assert.match(capturar, /--arquivo/, id);
      assert.match(capturar, /plano\.imagens\[id\] = \{ arquivo/, id);
      assert.match(skill, /capturar\.mjs --arquivo \w+=imagens\//, id);
    } else if (w.registro === "imagens-offline") {
      // Transformação: as fotos na pasta imagens/ do aluno e o imagens.mjs --offline.
      const imagens = readFileSync(t("scripts/imagens.mjs"), "utf8");
      assert.match(imagens, /const PASTA_ALUNO = "imagens";/, id);
      assert.match(imagens, /semInternet = !!opcoes\.offline/, id);
      assert.match(skill, /imagens\.mjs --offline/, id);
      assert.match(skill, /"arquivo": "antes\.jpg"/, id);
    } else {
      // Janelas: nada do cliente; a única ferramenta é a teclas.mjs, que lê o áudio de public/base.mp4.
      assert.equal(id, "modelo-janelas");
      assert.match(readFileSync(t("ferramentas/teclas.mjs"), "utf8"), /public\/base\.mp4/);
      assert.ok(!/public\/tela|imagens\//.test(skill), "o SKILL do Janelas não pede arquivo do usuário");
    }
  }
});

test("o Guia fica pedindo o material, mas indisponível até o recorte da pessoa rodar no worker, com o motivo", () => {
  const g = M.MATERIAL_DOS_MODELOS["modelo-guia"];
  assert.equal(g.disponivel, false);
  assert.match(g.motivo ?? "", /recorte da pessoa sem fundo/);
  assert.match(g.emBreve ?? "", /^Em breve: precisa do recorte da pessoa/);
  assert.equal(modeloPodeSerEscolhido("modelo-guia"), false);
  // O pedido dos prints já existe (a tela mostra o que vai pedir).
  assert.equal(M.fraseDoPedido("modelo-guia"), "Este modelo usa prints das telas que você ensina a usar: envie de 2 a 8.");
  // O template do Guia precisa de public/pessoa.webm (o recorte) e o worker ainda não o grava.
  assert.match(ler("worker/modelos/modelo-guia/template/src/componentes/Pessoa.tsx"), /staticFile\("pessoa\.webm"\)/);
  assert.ok(!/pessoa\.webm/.test(ler("worker/src/modelo/editar-no-modelo.mjs")), "quando o recorte entrar no worker, troque `disponivel` do Guia");
});

test("a frase do pedido é clara, e a Transformação pede o par", () => {
  assert.equal(M.fraseDoPedido("modelo-demo"), "Este modelo usa capturas de tela do seu produto: envie de 3 a 8.");
  assert.equal(M.fraseDoPedido("modelo-tela-viva"), "Este modelo usa capturas de tela do seu produto: envie de 2 a 8.");
  assert.equal(M.fraseDoPedido("modelo-etapas"), "Este modelo usa prints das etapas do seu processo: envie de 3 a 12.");
  assert.equal(M.fraseDoPedido("modelo-transformacao"), "Este modelo usa uma foto de antes e uma de depois do mesmo lugar: envie as duas.");
  assert.equal(M.fraseDoPedido("modelo-janelas"), null);
  assert.equal(M.pedidoDeMaterialNaTela("modelo-janelas"), null);
  assert.deepEqual(M.pedidoDeMaterialNaTela("modelo-transformacao")?.papeis, ["antes", "depois"]);
  assert.match(M.pedidoDeMaterialNaTela("modelo-transformacao")?.aviso ?? "", /conselho/);
});

// ─────────────────────────────── a regra de quando a edição pode começar ───────────────────────────────

test("a edição só começa com o mínimo, sem passar do máximo e com nome em cada arquivo", () => {
  const demo = (n: number) => M.situacaoDoMaterial("modelo-demo", itens(n));
  assert.equal(demo(0).basta, false);
  assert.equal(demo(0).falta, "Envie pelo menos 3 capturas.");
  assert.equal(demo(2).falta, "Falta 1 captura (a edição começa com 3).");
  assert.equal(M.situacaoDoMaterial("modelo-etapas", itens(1)).falta, "Faltam 2 prints (a edição começa com 3).");
  assert.equal(demo(3).basta, true);
  assert.equal(demo(3).falta, null);
  assert.equal(demo(8).basta, true);
  assert.equal(demo(9).basta, false);
  assert.match(demo(9).falta ?? "", /no máximo 8, tire 1/);
  const semNome = M.situacaoDoMaterial("modelo-demo", [item(1), item(2), item(3, { nome: "  " })]);
  assert.equal(semNome.basta, false);
  assert.equal(semNome.falta, "Dê um nome à captura sem nome.");
  for (const s of [demo(0), demo(2), demo(9), semNome]) assert.ok(!TRAVESSAO.test(s.falta ?? ""));
});

test("a Transformação só começa com uma foto de antes e uma de depois", () => {
  const t = (xs: Array<"antes" | "depois" | null>) => M.situacaoDoMaterial("modelo-transformacao", xs.map((papel, i) => item(i + 1, { papel })));
  assert.equal(t(["antes", "depois"]).basta, true);
  assert.equal(t(["antes"]).falta, "Falta a foto de depois.");
  assert.equal(t(["antes", null]).basta, false);
  assert.equal(t(["antes", "antes"]).falta, "Marque só uma foto como antes; falta a foto de depois.");
});

test("Janelas serve sem material; o Guia nunca, enquanto indisponível; modelo sem regra de material segue recusado", () => {
  assert.equal(M.situacaoDoMaterial("modelo-janelas", []).basta, true);
  assert.equal(M.materialBasta("modelo-janelas"), true);
  assert.equal(M.situacaoDoMaterial("modelo-guia", itens(4)).basta, false);
  assert.equal(M.materialBasta("modelo-guia", M.situacaoDoMaterial("modelo-guia", itens(4))), false);
  // A situação de um modelo não vale para outro.
  assert.equal(M.materialBasta("modelo-etapas", M.situacaoDoMaterial("modelo-demo", itens(4))), false);
  // Modelo sem regra de material (um que viesse a pedir 3D, por exemplo): nem a situação "basta" o libera.
  assert.equal(M.materialBasta("modelo-painel", { ...M.situacaoDoMaterial("modelo-demo", itens(4)), modelo: "modelo-painel", basta: true }), false);
});

test("os outros não automáticos seguem recusados: um modelo que o catálogo marcasse como não automático não vira escolhível", () => {
  // Hoje os seis são os únicos não automáticos; o teste troca um automático de lado, como o de 09/10.
  const painel = MODELOS_DO_CURSO.find((m) => m.id === "modelo-painel")!;
  const antes = { automatico: painel.automatico, pede: painel.pede };
  try {
    painel.automatico = false;
    painel.pede = ["3d"];
    assert.equal(modeloServeNoCorte("modelo-painel"), null);
    assert.equal(modeloServeNoCorte("modelo-painel", { ...M.situacaoDoMaterial("modelo-demo", itens(4)), modelo: "modelo-painel", basta: true }), null);
    assert.equal(modeloPodeSerEscolhido("modelo-painel"), false);
    assert.equal(modelosDaBiblioteca().find((c) => c.id === "modelo-painel")?.serve, false);
  } finally {
    painel.automatico = antes.automatico;
    painel.pede = antes.pede;
  }
});

test("modeloServeNoCorte aceita os seis só com o material que basta, e modeloPodeSerEscolhido deixa escolher antes", () => {
  const basta = (id: string, n: number) => M.situacaoDoMaterial(id, id === "modelo-transformacao" ? [item(1, { papel: "antes" }), item(2, { papel: "depois" })] : itens(n));
  for (const id of ["modelo-demo", "modelo-etapas", "modelo-tela-viva", "modelo-transformacao"]) {
    assert.equal(modeloServeNoCorte(id), null, `${id}: sem material, não serve`);
    assert.equal(modeloServeNoCorte(id, M.situacaoDoMaterial(id, []))?.id ?? null, null, id);
    assert.equal(modeloServeNoCorte(id, basta(id, 3))?.id, id, `${id}: com o material, serve`);
    assert.equal(modeloPodeSerEscolhido(id), true, id);
  }
  assert.equal(modeloServeNoCorte("modelo-janelas")?.id, "modelo-janelas");
  assert.equal(modeloServeNoCorte("modelo-guia", basta("modelo-guia", 3)), null);
  // Os automáticos não mudaram.
  for (const m of MODELOS_DO_CURSO.filter((x) => x.automatico && x.formato === "9:16")) assert.equal(modeloServeNoCorte(m.id)?.id, m.id);
});

test("os cartões: os seis aparecem com o pedido, a recomendação só olha os que servem sem material", () => {
  const cartoes = modelosDaBiblioteca();
  for (const id of ["modelo-demo", "modelo-etapas", "modelo-tela-viva", "modelo-transformacao"]) {
    const c = cartoes.find((x) => x.id === id)!;
    assert.equal(c.serve, true, id);
    assert.equal(c.falta, null, id);
    assert.ok(c.material?.frase, id);
  }
  const guia = cartoes.find((x) => x.id === "modelo-guia")!;
  assert.equal(guia.serve, false);
  assert.match(guia.falta ?? "", /^Em breve: precisa do recorte/);
  const janelas = cartoes.find((x) => x.id === "modelo-janelas")!;
  assert.equal(janelas.serve, true);
  assert.equal(janelas.material, null);
  const opcoes = modelosQueServem().map((m) => m.id);
  assert.ok(opcoes.includes("modelo-janelas"));
  for (const id of ["modelo-demo", "modelo-etapas", "modelo-tela-viva", "modelo-transformacao", "modelo-guia"]) assert.ok(!opcoes.includes(id), `${id}: fora da recomendação`);
});

test("os itens da tela são limpos (sem repetido, sem travessão, papel só onde existe) e viram ids que o plano cita", () => {
  const n = M.normalizarItens("modelo-demo", [
    { materialId: "a", nome: "Tela — cadastro", descricao: "x".repeat(400), papel: "antes" },
    { materialId: "a", nome: "repetido" },
    { materialId: "", nome: "sem id" },
    { materialId: "b", nome: "Tela de cadastro" },
    "lixo",
  ]);
  assert.deepEqual(n.map((i) => i.materialId), ["a", "b"]);
  assert.equal(n[0].nome, "Tela, cadastro");
  assert.equal(n[0].descricao.length, 300);
  assert.ok(!("papel" in n[0]), "o Demo não tem papel");
  assert.deepEqual(M.idsDosArquivos("modelo-demo", n), ["tela-cadastro", "tela-de-cadastro"]);
  assert.deepEqual(M.idsDosArquivos("modelo-demo", [item(1, { nome: "Ação!" }), item(2, { nome: "Ação" }), item(3, { nome: "" }), item(4, { nome: "2024" })]), ["acao", "acao-2", "tela-3", "tela-2024"]);
  assert.deepEqual(M.idsDosArquivos("modelo-etapas", [item(1, { nome: "" })]), ["print-1"]);
  const t = M.normalizarItens("modelo-transformacao", [{ materialId: "d", nome: "Closet hoje", papel: "depois" }, { materialId: "e", nome: "Closet antigo", papel: "antes" }, { materialId: "f", nome: "x", papel: "meio" }]);
  assert.deepEqual(t.map((i) => i.papel), ["depois", "antes", null]);
  assert.deepEqual(M.idsDosArquivos("modelo-transformacao", t.slice(0, 2)), ["depois", "antes"]);
  for (const id of M.idsDosArquivos("modelo-demo", n)) assert.match(id, /^[a-z][a-z0-9-]{0,40}$/, "o mesmo formato que o worker aceita");
});

// ─────────────────────────────── o redator do plano ───────────────────────────────

test("o redator recebe a lista dos arquivos, com o nome e a descrição do cliente, e a regra de usar só esses", () => {
  const material = {
    modelo: "modelo-demo",
    oQue: W.MATERIAL_NO_TEMPLATE["modelo-demo"].oQue,
    noPlano: W.MATERIAL_NO_TEMPLATE["modelo-demo"].noPlano,
    arquivos: [
      { id: "cadastro", nome: "Tela de cadastro", descricao: "o formulário com nome e e-mail", arquivo: "public/tela/cadastro.jpg", largura: 1080, altura: 2340, proporcao: 2.1667, miniatura: "AAA" },
      { id: "painel", nome: "Painel", descricao: "", arquivo: "public/tela/painel.jpg", largura: 2880, altura: 1800, proporcao: 0.625, miniatura: null },
    ],
  };
  const t = M.instrucaoDoMaterial(material, "plano");
  assert.match(t, /"cadastro": arquivo public\/tela\/cadastro\.jpg, 1080×2340 px, proporção altura÷largura 2\.167\. Nome dado pelo cliente: "Tela de cadastro"\. O que mostra, nas palavras dele: "o formulário com nome e e-mail"\./);
  assert.match(t, /"painel"/);
  assert.match(t, /Use SÓ estes arquivos/);
  assert.match(t, /"captura": "<id>"/);
  assert.match(t, /nunca interface desenhada/);
  assert.ok(!TRAVESSAO.test(t));
  assert.match(M.instrucaoDoMaterial(material, "mapa"), /não peça imagem para o lugar que um arquivo do cliente ocupa/);
  const anexos = M.imagensDoMaterial(material);
  assert.equal(anexos.length, 1, "só o que tem miniatura vai como imagem");
  assert.match(anexos[0].rotulo, /^MATERIAL DO CLIENTE "cadastro"/);
  // O pedido do plano, o do mapa e a rota levam o material; as miniaturas vão junto do exemplo.
  const escrever = ler("lib/media/editor-do-curso/escrever-plano.ts");
  assert.match(escrever, /instrucaoDoMaterial\(args\.material, "plano"\)/);
  assert.match(escrever, /\.\.\.imagensDoMaterial\(args\.material\)/);
  const imagens = ler("lib/media/editor-do-curso/imagens.ts");
  assert.match(imagens, /instrucaoDoMaterial\(args\.material, "mapa"\)/);
  const rota = ler("app/api/editor-do-curso/plano/route.ts");
  assert.equal((rota.match(/material: corpo\.material \?\? null/g) ?? []).length, 2, "o mapa e o plano");
});

// ─────────────────────────────── o envio ao worker ───────────────────────────────

test("a esteira manda as URLs do material ao worker e, sem o mínimo, o corte espera em vez de ir para a reserva", () => {
  const src = ler("lib/media/montagem-nos-cortes.ts");
  const enviar = src.slice(src.indexOf("async function enviarAoModeloDoCurso"), src.indexOf("/** De quanto em quanto tempo"));
  assert.match(enviar, /material: await materialParaOWorker\(video\.projectId, modelo\)/);
  assert.match(enviar, /esperandoMaterial: null/, "o corte que sai da espera limpa o aviso");
  const passo = src.slice(src.indexOf("export async function avancarMontagens"));
  const espera = passo.indexOf("faltaDoMaterialNoCorte(");
  assert.ok(espera > 0 && espera < passo.indexOf("await modeloDoCursoDoCorte(video, m)"), "a espera vem antes do modelo e da reserva");
  assert.match(passo.slice(espera, espera + 400), /esperarOMaterial\(video\.id, i, m, espera\);\s*continue;/);
  assert.match(src, /async function esperarOMaterial[\s\S]{0,400}estado: "na-fila"[\s\S]{0,200}esperarAte: depois\(ESPERA_DO_MATERIAL_MS\)[\s\S]{0,100}esperandoMaterial:/);
  // O "refazer neste estilo" também aceita os seis, e o fixo só serve com o material.
  assert.match(src, /refazerCorteNoModelo[\s\S]{0,300}modeloPodeSerEscolhido\(modelo\)/);
  assert.match(src, /m\.curso\?\.fixo && editorDoCursoLigado\(\) && \(await modeloServeNoProjeto\(video\.projectId, m\.curso\.modelo\)\)/);
  // O pacote do worker: lança sem o material que basta (nunca manda o corte sem ele).
  const servidor = ler("lib/media/editor-do-curso/material-do-modelo-servidor.ts");
  assert.match(servidor, /if \(!s\.basta\) throw new Error/);
  assert.match(servidor, /itens: itens\.map\(\(i, k\) => \(\{ id: ids\[k\], url: i\.url, nome: i\.nome, descricao: i\.descricao, papel: i\.papel \?\? null \}\)\)/);
});

test("a tela do corte diz que a edição espera o material só enquanto a espera vale", () => {
  const agora = Date.now();
  const base = { estado: "na-fila" as const, desde: new Date(agora - 60_000).toISOString(), esperandoMaterial: { modelo: "modelo-demo", falta: "Envie pelo menos 3 capturas." } };
  const vale = lerMontagem({ ...base, esperarAte: new Date(agora + 5 * 60_000).toISOString() });
  assert.equal(vale?.rotulo, "A edição espera o seu material");
  assert.match(vale?.detalhe ?? "", /^Envie pelo menos 3 capturas\. O material vai na caixa do modelo/);
  const velha = lerMontagem({ ...base, esperarAte: new Date(agora - 60_000).toISOString() });
  assert.equal(velha?.detalhe, "Na fila da edição.", "aviso vencido não vira mentira na tela");
  assert.equal(lerMontagem({ ...base, estado: "dirigindo", esperarAte: new Date(agora + 60_000).toISOString() })?.rotulo, "Vitor e Diana montando a edição");
});

test("o worker baixa antes do preparar, registra antes do plano, confere o plano e baixa pelo store privado", () => {
  const src = ler("worker/src/modelo/editar-no-modelo.mjs");
  const fluxo = src.slice(src.indexOf("export async function editarNoModelo"), src.indexOf("async function comTrilha"));
  const baixa = fluxo.indexOf("await baixarMaterial(projeto, pedido.modelo, pedido.material, { baixar: obterMaterial })");
  assert.ok(baixa > 0 && baixa < fluxo.indexOf("await preparar(projeto, trecho"), "baixa antes do preparar");
  const registra = fluxo.indexOf("await registrarMaterial(projeto, pedido.modelo, material, rodarNoProjeto)");
  assert.ok(registra > fluxo.indexOf("await passoDasImagens(") && registra < fluxo.indexOf("const esqueleto = esqueletoParaEscrever(lerPlano(projeto));"), "registra depois das imagens e antes do esqueleto do plano");
  assert.match(fluxo, /pedirPlano\(\{ \.\.\.comum, \.\.\.comMaterial\(\), esqueleto, marca: pedido\.marca/);
  assert.match(fluxo, /conferirMaterialNoPlano\(pedido\.modelo, escrito\.plano, material, lerPlano\(projeto\)\.imagens\)/);
  assert.match(fluxo, /doMaterial\.length === 0/);
  assert.match(fluxo, /fixos: pedidosFixosDoMaterial\(pedido\.modelo, material\),\s*offline: imagensSoDoCliente\(pedido\.modelo\)/);
  assert.match(src, /p\.escolha\?\.licenca !== "do aluno"/, "o arquivo do cliente não volta à escolha na folha");
  assert.match(ler("worker/src/index.mjs"), /obterMaterial: async \(url, destino\) => \{\s*await baixarQualquer\(url, destino\);/);
});

// ─────────────────────────────── o worker de verdade (ffmpeg e o capturar.mjs do curso) ───────────────────────────────

const temFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0 && spawnSync("ffprobe", ["-version"]).status === 0;

function imagem(destino: string, largura: number, altura: number, cor = "orange") {
  const r = spawnSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `color=c=${cor}:s=${largura}x${altura}`, "-frames:v", "1", destino]);
  assert.equal(r.status, 0, String(r.stderr));
}

test("Demo: as capturas vão para public/tela/<id>.jpg em JPG, medidas, com a miniatura de 900 px; a conferência cobra usar só elas", { skip: !temFfmpeg && "sem ffmpeg" }, async () => {
  const pasta = mkdtempSync(join(tmpdir(), "material-demo-"));
  try {
    const fontes = { png: join(pasta, "a.png"), jpg: join(pasta, "b.jpg") };
    imagem(fontes.png, 1080, 2340);
    imagem(fontes.jpg, 1440, 900, "blue");
    const projeto = join(pasta, "projeto");
    const baixados: string[] = [];
    const arquivos = await W.baixarMaterial(projeto, "modelo-demo", { itens: [{ id: "cadastro", url: "png", nome: "Cadastro", descricao: "o formulário" }, { id: "painel", url: "jpg", nome: "Painel", descricao: "" }] }, {
      baixar: async (url: string, destino: string) => {
        baixados.push(url);
        copyFileSync(url === "png" ? fontes.png : fontes.jpg, destino);
      },
    });
    assert.deepEqual(baixados, ["png", "jpg"]);
    assert.deepEqual(arquivos.map((a: { arquivo: string }) => a.arquivo), ["public/tela/cadastro.jpg", "public/tela/painel.jpg"]);
    for (const a of arquivos) {
      const b = readFileSync(join(projeto, a.arquivo));
      assert.ok(b[0] === 0xff && b[1] === 0xd8, `${a.id} em JPG`);
      assert.ok(a.miniatura && a.miniatura.length > 100, `${a.id}: miniatura`);
    }
    assert.equal(arquivos[0].largura, 1080);
    assert.equal(arquivos[0].proporcao, 2.1667);
    assert.equal(arquivos[1].proporcao, 0.625);
    const mini = join(projeto, "work", "material", "cadastro-900.jpg");
    const medida = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", mini], { encoding: "utf8" }).stdout.trim();
    assert.equal(medida, "415,900", "lado maior 900 px, como o sips -Z 900 do curso");
    // A regra "usar só esses".
    const plano = (capturas: string[]) => ({ momentos: capturas.map((c, i) => ({ tipo: "tela", de: i, ate: i + 1, captura: c, proporcao: 1 })) });
    assert.deepEqual(W.conferirMaterialNoPlano("modelo-demo", plano(["cadastro", "painel"]), arquivos), []);
    const fora = W.conferirMaterialNoPlano("modelo-demo", plano(["cadastro", "chrome"]), arquivos);
    assert.equal(fora.length, 1);
    assert.match(fora[0], /^MATERIAL DO CLIENTE: a captura "chrome" não existe: use só "cadastro", "painel"\.$/);
    assert.match(W.conferirMaterialNoPlano("modelo-demo", { momentos: [{ tipo: "cta", de: 0, ate: 3 }] }, arquivos)[0], /nenhum momento "tela" usa o material do cliente/);
    const red = W.materialParaORedator("modelo-demo", arquivos);
    assert.equal(red.arquivos.length, 2);
    assert.match(red.noPlano, /"captura": "<id>"/);
    // Sem arquivo, falha antes de tudo (nunca inventa a tela).
    await assert.rejects(W.baixarMaterial(join(pasta, "p2"), "modelo-demo", { itens: [] }, { baixar: async () => {} }), /pede capturas de tela do produto do cliente e o pedido veio sem nenhum arquivo/);
    await assert.rejects(W.baixarMaterial(join(pasta, "p3"), "modelo-demo", { itens: [{ id: "../fora", url: "png" }] }, { baixar: async () => {} }), /id de material inválido/);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});

test("Etapas: os prints vão para imagens/ e o capturar.mjs do curso registra em plano.imagens (id ocupado ganha -cliente)", { skip: !temFfmpeg && "sem ffmpeg" }, async () => {
  const pasta = mkdtempSync(join(tmpdir(), "material-etapas-"));
  try {
    const projeto = criarProjeto("modelo-etapas", pasta);
    const fonte = join(pasta, "print.png");
    imagem(fonte, 1280, 3000, "white");
    const baixados = await W.baixarMaterial(projeto, "modelo-etapas", { itens: [{ id: "agenda", url: "x", nome: "Agenda", descricao: "a semana cheia" }, { id: "painel", url: "x", nome: "Painel", descricao: "" }] }, { baixar: async (_: string, d: string) => copyFileSync(fonte, d), miniaturas: false });
    assert.ok(existsSync(join(projeto, "imagens", "agenda.jpg")) && existsSync(join(projeto, "imagens", "painel.jpg")));
    // O imagens.mjs já tinha escolhido uma imagem com o id "painel".
    const arq = join(projeto, "src", "plano.json");
    const plano = JSON.parse(readFileSync(arq, "utf8"));
    plano.imagens = { painel: { arquivo: "img/painel.png", largura: 10, altura: 10, foco: { x: 0.5, y: 0.5 }, transparente: false, palavra: "painel" } };
    writeFileSync(arq, JSON.stringify(plano));
    const finais = await W.registrarMaterial(projeto, "modelo-etapas", baixados, rodarNoProjeto);
    assert.deepEqual(finais.map((a: { id: string }) => a.id), ["agenda", "painel-cliente"]);
    const depois = JSON.parse(readFileSync(arq, "utf8"));
    assert.equal(depois.imagens.agenda.arquivo, "img/agenda.jpg");
    assert.equal(depois.imagens.agenda.largura, 1280);
    assert.equal(depois.imagens["painel-cliente"].arquivo, "img/painel-cliente.jpg");
    assert.equal(depois.imagens.painel.arquivo, "img/painel.png", "a imagem do imagens.mjs continua");
    assert.ok(existsSync(join(projeto, "public", "img", "painel-cliente.jpg")));
    assert.deepEqual(finais.map((a: { arquivo: string }) => a.arquivo), ["public/img/agenda.jpg", "public/img/painel-cliente.jpg"]);
    // A conferência: imagem fora de plano.imagens reprova; usar um print do cliente aprova.
    const usa = { momentos: [{ tipo: "etapa", de: 0, ate: 2, rotulo: "Agenda", telas: [{ imagem: { id: "agenda" }, em: 0 }, { imagem: { id: "painel" }, em: 1 }] }] };
    assert.deepEqual(W.conferirMaterialNoPlano("modelo-etapas", usa, finais, depois.imagens), []);
    const inventada = { momentos: [{ tipo: "prova", de: 0, ate: 6, imagem: { id: "email" } }] };
    const f = W.conferirMaterialNoPlano("modelo-etapas", inventada, finais, depois.imagens);
    assert.equal(f.length, 2);
    assert.match(f[0], /a imagem "email" não está em plano\.imagens/);
    assert.match(f[1], /o plano não usa nenhum arquivo do cliente/);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});

test("Transformação: antes e depois em imagens/, os dois pedidos do 6b e o imagens.mjs sem internet", { skip: !temFfmpeg && "sem ffmpeg" }, async () => {
  const pasta = mkdtempSync(join(tmpdir(), "material-transformacao-"));
  try {
    const fonte = join(pasta, "foto.jpg");
    imagem(fonte, 1600, 1200, "gray");
    const projeto = join(pasta, "projeto");
    const baixar = async (_: string, d: string) => copyFileSync(fonte, d);
    const arquivos = await W.baixarMaterial(projeto, "modelo-transformacao", { itens: [{ id: "antes", url: "a", nome: "Closet antigo", descricao: "", papel: "antes" }, { id: "depois", url: "d", nome: "Closet hoje", descricao: "", papel: "depois" }] }, { baixar, miniaturas: false });
    assert.deepEqual(arquivos.map((a: { arquivo: string }) => a.arquivo), ["imagens/antes.jpg", "imagens/depois.jpg"]);
    // O mesmo formato do references/imagens.md: { id, em, palavra, tipo, arquivo }.
    assert.deepEqual(W.pedidosFixosDoMaterial("modelo-transformacao", arquivos), [
      { id: "antes", em: 0, palavra: "antes", tipo: "foto", arquivo: "antes.jpg" },
      { id: "depois", em: 0.01, palavra: "depois", tipo: "foto", arquivo: "depois.jpg" },
    ]);
    assert.equal(W.imagensSoDoCliente("modelo-transformacao"), true);
    assert.equal(W.imagensSoDoCliente("modelo-etapas"), false);
    assert.deepEqual(W.pedidosFixosDoMaterial("modelo-etapas", arquivos), []);
    const ad = { momentos: [{ tipo: "antesdepois", de: 0, ate: 8, antes: { id: "antes" }, depois: { id: "depois" }, marcadores: [] }] };
    assert.deepEqual(W.conferirMaterialNoPlano("modelo-transformacao", ad, arquivos, { antes: {}, depois: {} }), []);
    await assert.rejects(W.baixarMaterial(join(pasta, "p2"), "modelo-transformacao", { itens: [{ id: "antes", url: "a", nome: "x" }] }, { baixar, miniaturas: false }), /pede a foto de depois/);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});

test("Janelas não baixa nada, e os textos novos não têm travessão", async () => {
  assert.deepEqual(await W.baixarMaterial("/nao-existe", "modelo-janelas", null, {}), []);
  assert.equal(W.materialParaORedator("modelo-janelas", []), null);
  for (const f of [
    "lib/media/editor-do-curso/material-do-modelo.ts",
    "lib/media/editor-do-curso/material-do-modelo-servidor.ts",
    "worker/src/modelo/material-do-modelo.mjs",
    "components/video/material-do-modelo.tsx",
    "app/api/projects/[id]/modelo-do-curso/material/route.ts",
  ]) {
    const linhas = ler(f).split("\n").filter((l) => TRAVESSAO.test(l) && !/\[—–\]/.test(l) && !/travessão/i.test(l));
    assert.deepEqual(linhas, [], f);
  }
  const tela = ler("components/video/material-do-modelo.tsx");
  assert.match(tela, /Nada disso é criado por IA/);
  assert.match(tela, /Escolher da Biblioteca/);
  assert.match(tela, /A edição dos cortes no \{modelo\.nome\} ainda não começou/);
  assert.match(ler("components/video/modelos-do-curso.tsx"), /emUso\?\.material && <MaterialDoModelo/);
});
