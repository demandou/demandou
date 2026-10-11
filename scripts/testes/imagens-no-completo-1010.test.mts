/**
 * O passo das imagens no completo em blocos (10/10): os 28 modelos com imagem
 * (references/imagens.md) não desistem mais do completo; cada trecho faz o
 * mapa e os pedidos dele, o imagens.mjs roda uma vez para o vídeo inteiro, a
 * escolha de cada trecho olha só as folhas dele, o plano de cada trecho recebe
 * só as imagens dele e as chamadas de imagem contam no teto. O fluxo roda num
 * projeto de mentira (o imagens.mjs e o conferir.mjs fingidos, com a mesma
 * interface dos do curso), sem banco, sem rede, sem IA.
 *   npx tsx --test scripts/testes/imagens-no-completo-1010.test.mts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// A escrita e a escolha uma de cada vez: a conta do teto fica igual em toda máquina.
process.env.EDITOR_DO_CURSO_BLOCOS_JUNTOS = "1";

const raiz = new URL("../../", import.meta.url);
const ler = (f: string) => readFileSync(new URL(f, raiz), "utf8").replace(/\r\n/g, "\n");
const TRAVESSAO = new RegExp(`[${String.fromCharCode(0x2014, 0x2013)}]`);

const B = await import(new URL("worker/src/modelo/blocos-do-plano.mjs", raiz).href);
const W = await import(new URL("worker/src/modelo/editar-no-modelo.mjs", raiz).href);
const { espalharPedidos, IMAGENS_POR_TRECHO } = await import("@/lib/media/editor-do-curso/imagens");
const { prazoDoCompletoNoModeloMs } = await import("@/lib/media/editor-do-curso/no-corte");
const { TETO_DA_ESPERA_MS } = await import("@/lib/media/montagem-no-worker");

type Palavra = { em: number; ate: number; w: string };
type Bloco = { indice: number; de: number; ate: number; inicio: number; fim: number };
type Pedido = { id: string; em: number; palavra: string; busca?: string; tipo: string; arquivo?: string; escolha?: Record<string, unknown> };
type Corpo = Record<string, any>;

/** Fala sintética: uma palavra a cada 0,4 s, com uma pausa longa a cada ~150 s. */
function falaCom(duracao: number): Palavra[] {
  const ps: Palavra[] = [];
  let t = 0.2;
  let k = 0;
  while (t < duracao - 0.5) {
    ps.push({ em: +t.toFixed(3), ate: +(t + 0.3).toFixed(3), w: k % 12 === 11 ? "fim." : `p${k}` });
    t += 0.4;
    if (Math.abs(t - 150) < 0.2 || Math.abs(t - 300) < 0.2) t += 1.5;
    k++;
  }
  return ps;
}

// ─────────────────────────────── o projeto de mentira ───────────────────────────────

/** O imagens.mjs fingido: a mesma linha de comando e os mesmos arquivos do script do curso (work/imagens.json, as folhas, plano.imagens, creditos.txt). */
const IMAGENS_FINGIDO = `import { appendFileSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
const POR_FOLHA = 4;
const args = process.argv.slice(2);
appendFileSync("work/chamadas.log", JSON.stringify(args) + "\\n");
const pedidos = JSON.parse(readFileSync("work/imagens.json", "utf8"));
const valor = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const gravar = () => writeFileSync("work/imagens.json", JSON.stringify(pedidos, null, 2));
const sincronizar = () => {
  const plano = JSON.parse(readFileSync("src/plano.json", "utf8"));
  plano.imagens = Object.fromEntries(pedidos.filter((p) => p.escolha).map((p) => [p.id, p.escolha.sem ? { sem: true, palavra: p.palavra } : { arquivo: p.escolha.arquivo, largura: 800, altura: 1200, foco: p.escolha.foco, transparente: false, palavra: p.palavra }]));
  writeFileSync("src/plano.json", JSON.stringify(plano, null, 2));
  writeFileSync("creditos.txt", "Créditos das imagens (cole na legenda do post)\\n" + pedidos.filter((p) => p.escolha && !p.escolha.sem).map((p) => "- " + p.id).join("\\n"));
};
if (args.includes("--escolher")) {
  const id = valor("--escolher");
  const n = args[args.indexOf("--escolher") + 2];
  const p = pedidos.find((q) => q.id === id);
  if (!p) { console.error("Não achei o pedido " + id); process.exit(1); }
  const foco = valor("--foco");
  p.escolha = n === "0" ? { sem: true, motivo: "escolhido na conferência" } : { n: Number(n), arquivo: "img/" + id + ".jpg", foco: foco ? { x: Number(foco.split(",")[0]), y: Number(foco.split(",")[1]) } : { x: 0.5, y: 0.5 } };
  gravar();
  sincronizar();
  process.exit(0);
}
if (args.includes("--limpar")) process.exit(0);
for (const p of pedidos) {
  if (p.buscado === p.busca && p.candidatas?.length) continue;
  p.candidatas = [1, 2, 3].map((n) => ({ n, arquivo: "img/candidatas/" + p.id + "-" + n + ".jpg" }));
  p.buscado = p.busca;
  if (p.arquivo) p.escolha = { n: 1, arquivo: "img/" + p.id + ".jpg", foco: { x: 0.5, y: 0.5 }, licenca: "do aluno" };
}
for (const f of readdirSync("work").filter((f) => /^imagens(-\\d+)?\\.jpg$/.test(f))) rmSync("work/" + f);
for (let k = 0; k * POR_FOLHA < pedidos.length; k++) {
  writeFileSync(k === 0 ? "work/imagens.jpg" : "work/imagens-" + (k + 1) + ".jpg", "FOLHA " + (k + 1) + ": " + pedidos.slice(k * POR_FOLHA, (k + 1) * POR_FOLHA).map((p) => p.id).join(","));
}
gravar();
sincronizar();
console.log("Folha de conferência pronta");
`;

/** O conferir.mjs fingido: aprova tudo (quem confere o estilo é o do curso; aqui o teste é o caminho das imagens). */
const CONFERIR_FINGIDO = `export const conferirPlano = () => ({ ok: true, erros: [], avisos: [], vaos: [] });
export const tiposDoModelo = () => null;
if (process.argv[1] && /conferir\\.mjs$/.test(process.argv[1])) console.log("Plano conferido.\\nAPROVADO.");
`;

function projetoDeMentira(duracao: number) {
  const pasta = mkdtempSync(join(tmpdir(), "imagens-no-completo-"));
  const projeto = join(pasta, "projeto");
  for (const d of ["scripts", "src", "work", "public"]) mkdirSync(join(projeto, d), { recursive: true });
  writeFileSync(join(projeto, "scripts", "imagens.mjs"), IMAGENS_FINGIDO);
  writeFileSync(join(projeto, "scripts", "conferir.mjs"), CONFERIR_FINGIDO);
  writeFileSync(join(projeto, "src", "plano.ts"), 'export type Momento = { tipo: "destaque" } | { tipo: "foto" };\n');
  const palavras = falaCom(duracao);
  const plano = { video: "base.mp4", fps: 30, largura: 1080, altura: 1920, duracao, rosto: { x: 0.5, y: 0.4, rastro: [] }, cortesEm: [], palavras };
  writeFileSync(join(projeto, "src", "plano.json"), JSON.stringify(plano, null, 2));
  return { pasta, projeto, palavras };
}

/** O app de mentira: responde cada fase como a rota do plano, com o custo de cada chamada. */
function appDeMentira(opcoes: { citarDeOutroTrecho?: number; refazer?: string } = {}) {
  const chamadas: { imagens: Corpo[]; escolher: Corpo[]; plano: Corpo[] } = { imagens: [], escolher: [], plano: [] };
  const custo = { imagens: 0.08, escolher: 0.05, plano: 0.2 };
  const pedidoDeRefazer = new Set<string>();
  const responder = async (c: Corpo) => {
    const fase = c.fase ?? "plano";
    if (fase === "imagens") {
      chamadas.imagens.push(c);
      const ps: Palavra[] = c.esqueleto.palavras;
      const k = c.bloco.indice;
      const em = (i: number) => ps[Math.min(ps.length - 1, i)].em;
      return {
        mapa: `mapa do trecho ${k + 1}`,
        imagens: [
          { id: "mel", em: em(3), palavra: "mel", busca: "honey jar", tipo: "foto" },
          { id: "cafe", em: em(40), palavra: "café", busca: "coffee", tipo: "foto" },
          { id: `coisa-${k + 1}`, em: em(90), palavra: "coisa", busca: "thing", tipo: "objeto" },
          { id: "pao", em: em(150), palavra: "pão", busca: "bread loaf", tipo: "foto" },
          { id: "mesa", em: em(250), palavra: "mesa", busca: "wooden table", tipo: "foto" },
          { id: "longe", em: c.esqueleto.duracao + 30, palavra: "longe", busca: "far", tipo: "foto" },
        ],
        custoUsd: custo.imagens,
      };
    }
    if (fase === "escolher") {
      chamadas.escolher.push(c);
      const escolhas = (c.pedidos as Pedido[]).map((p) => {
        if (p.id === opcoes.refazer && !pedidoDeRefazer.has(p.id)) {
          pedidoDeRefazer.add(p.id);
          return { id: p.id, refazer: "coffee cup" };
        }
        return { id: p.id, n: 2, foco: [0.4, 0.3] };
      });
      return { escolhas, custoUsd: custo.escolher };
    }
    chamadas.plano.push(c);
    const k = c.bloco.indice;
    const minhas = Object.keys(c.esqueleto.imagens ?? {});
    const cita = k === opcoes.citarDeOutroTrecho && !c.anterior ? "mel" : minhas.find((id) => id !== "mel" || k === 0) ?? null;
    return {
      mapa: `mapa escrito ${k + 1}`,
      plano: {
        marca: { nome: "Ana", area: "Doceira" },
        momentos: [{ tipo: "destaque", de: 0.5, ate: 4, em: 0.6, texto: "oi", ...(cita ? { imagem: { id: cita, efeito: "aproximar" } } : {}) }],
      },
      numerosSemLastro: [],
      custoUsd: custo.plano,
    };
  };
  let gasto = 0;
  const pedir = (c: Corpo) =>
    responder(c).then((r) => {
      gasto += Number(r.custoUsd) || 0;
      return r;
    });
  return { chamadas, pedir, gasto: () => gasto };
}

const lerJson = (arquivo: string) => JSON.parse(readFileSync(arquivo, "utf8"));
const comum = { modelo: "modelo-teste", referencias: { id: "modelo-teste", skill: "x", imagens: "references/imagens.md" }, nicho: null };
const pedido = { marca: { nome: "Ana", area: "Doceira" }, revisar: false };

// ─────────────────────────────── o completo não desiste mais ───────────────────────────────

test("o completo de um modelo com imagem não desiste mais: o passo 6b entra no plano em blocos", () => {
  const src = ler("worker/src/modelo/editar-no-modelo.mjs");
  assert.doesNotMatch(src, /ainda não faz o passo das imagens/);
  const fluxo = src.slice(src.indexOf("export async function editarNoModelo"), src.indexOf("async function comTrilha"));
  const ramo = fluxo.slice(fluxo.indexOf("if (emBlocos) {"), fluxo.indexOf("// PASSO 6b, nos modelos com imagem"));
  assert.match(ramo, /pedir: \(c\) => pedirPlano\(c\)\.then\(somar\)/, "as chamadas de imagem passam pelo mesmo pedir que soma o gasto");
  assert.match(ramo, /imagens: referencias\.imagens\s*\?/);
  assert.match(ramo, /fixos: pedidosFixosDoMaterial\(pedido\.modelo, material\),\s*offline: imagensSoDoCliente\(pedido\.modelo\)/);
  assert.match(ramo, /creditos: r\.creditos/);
  // a rota do plano leva o trecho à fase das imagens e o nome das folhas à escolha
  const rota = ler("app/api/editor-do-curso/plano/route.ts");
  assert.match(rota, /pedirImagensDoModelo\(\{[\s\S]*bloco: corpo\.bloco \?\? null,[\s\S]*\}\)/);
  assert.match(rota, /rotulos: corpo\.rotulos \?\? null/);
  const imagens = ler("lib/media/editor-do-curso/imagens.ts");
  assert.match(imagens, /instrucaoDoBloco\(args\.bloco/);
  for (const f of ["worker/src/modelo/editar-no-modelo.mjs", "worker/src/modelo/blocos-do-plano.mjs"]) assert.doesNotMatch(ler(f), TRAVESSAO, `travessão em ${f}`);
  // em imagens.ts, só o texto novo (o traço entre início e fim da lista de palavras é o formato do curso, de antes)
  const novo = imagens.slice(imagens.indexOf("export const IMAGENS_POR_TRECHO"), imagens.indexOf("/** Passo 6 e 6b")) + imagens.slice(imagens.indexOf(": args.bloco"), imagens.indexOf('"Faça o mapa editorial e a lista de imagens deste vídeo'));
  assert.ok(novo.length > 400);
  assert.doesNotMatch(novo, TRAVESSAO);
});

test("os modelos com imagem: os 28 do índice, o script do curso em cada um, e a versão deitada com a mesma estrutura", () => {
  const indice = JSON.parse(ler("worker/modelos/indice.json")) as Array<{ id: string; imagens?: unknown }>;
  const comImagem = indice.filter((m) => m.imagens).map((m) => m.id);
  assert.equal(comImagem.length, 28);
  assert.ok(comImagem.includes("modelo-viral"));
  const pasta = new URL("worker/modelos/", raiz);
  const doDisco = readdirSync(pasta).filter((d) => d.startsWith("modelo-") && existsSync(new URL(`${d}/referencias/imagens.md`, pasta)));
  for (const id of doDisco) {
    const script = ler(`worker/modelos/${id}/template/scripts/imagens.mjs`);
    assert.match(script, /const POR_FOLHA = 4;/, `${id}: a folha de 4 pedidos que a escolha por trecho conta`);
    assert.match(script, /opcoes\.escolher/);
    assert.match(script, /opcoes\.limpar/);
    assert.match(script, /p\.buscado !== assinatura\(p\)/, `${id}: o script refaz o pedido cuja busca mudou`);
  }
  // toda versão (16:9 ou 9:16) de um modelo com imagem traz o passo das imagens dela
  for (const d of readdirSync(pasta).filter((d) => /-(16x9|9x16)$/.test(d))) {
    const base = d.replace(/-(16x9|9x16)$/, "");
    if (!comImagem.includes(base)) continue;
    assert.ok(existsSync(new URL(`${d}/referencias/imagens.md`, pasta)), `${d} sem referencias/imagens.md`);
    assert.ok(existsSync(new URL(`${d}/template/scripts/imagens.mjs`, pasta)), `${d} sem scripts/imagens.mjs`);
  }
  assert.ok(doDisco.includes("modelo-viral-16x9"));
});

// ─────────────────────────────── as peças puras ───────────────────────────────

test("os pedidos dos trechos num work/imagens.json só: tempo do vídeo, id único, fora do trecho sai, fixos primeiro", () => {
  const blocos: Bloco[] = [
    { indice: 0, de: 0, ate: 9, inicio: 0, fim: 150 },
    { indice: 1, de: 10, ate: 19, inicio: 150, fim: 300 },
    { indice: 2, de: 20, ate: 29, inicio: 300, fim: 420 },
  ];
  const listas = [
    [{ id: "mel", em: 3, palavra: "mel", busca: "honey jar", tipo: "foto" }, { id: "Pão de Queijo", em: 1, palavra: "pão de queijo", busca: "cheese bread", tipo: "foto" }],
    [{ id: "mel", em: 10, palavra: "mel", busca: "honey", tipo: "foto" }, { id: "longe", em: 200, palavra: "longe", busca: "far", tipo: "foto" }],
    [{ id: "mel", em: 5, palavra: "mel", busca: "honey", tipo: "foto" }, { id: "mel-3", em: 6, palavra: "mel", busca: "honey pot", tipo: "foto" }, { id: "antes", em: 2, palavra: "antes", busca: "x", tipo: "foto" }],
  ];
  const fixos = [{ id: "antes", em: 0, palavra: "antes", tipo: "foto", arquivo: "antes.jpg" }, { id: "depois", em: 0.01, palavra: "depois", tipo: "foto", arquivo: "depois.jpg" }];
  const j = B.juntarPedidosDasImagens(blocos, listas, fixos);
  assert.deepEqual(j.comuns, ["antes", "depois"]);
  // em ordem de tempo dentro do trecho; "mel-3" já tomado pelo "mel" do trecho 3 vira "mel-3-3"
  assert.deepEqual(j.porBloco, [["pao-de-queijo", "mel"], ["mel-2"], ["antes-3", "mel-3", "mel-3-3"]]);
  assert.deepEqual(
    j.pedidos.map((p: Pedido) => [p.id, p.em]),
    [["antes", 0], ["depois", 0.01], ["pao-de-queijo", 1], ["mel", 3], ["mel-2", 160], ["antes-3", 302], ["mel-3", 305], ["mel-3-3", 306]]
  );
  assert.equal(new Set(j.pedidos.map((p: Pedido) => p.id)).size, j.pedidos.length, "id único, como o imagens.mjs exige");
  assert.equal(j.pedidos[0].arquivo, "antes.jpg");
  assert.equal(B.idDaImagem("Pão de Queijo!"), "pao-de-queijo");
});

test("cada trecho: o esqueleto leva só as imagens dele, e a conferência aponta imagem de fora", () => {
  const ps = falaCom(400);
  const [b0, b1] = B.blocosDoPlano(ps, 400);
  const esq = { fps: 30, duracao: 400, rosto: { x: 0.5, y: 0.4 }, palavras: ps, imagens: { mel: { arquivo: "img/mel.jpg" }, "mel-2": { arquivo: "img/mel-2.jpg" }, cafe: { sem: true, palavra: "café" }, antes: { arquivo: "img/antes.jpg" } } };
  assert.deepEqual(Object.keys(B.esqueletoDoBloco(esq, b1, ["mel-2", "antes"]).imagens), ["mel-2", "antes"]);
  assert.deepEqual(B.esqueletoDoBloco(esq, b0, []).imagens, {});
  assert.deepEqual(Object.keys(B.esqueletoDoBloco(esq, b0).imagens).length, 4, "sem a lista, o plano.imagens vai como está (o corte e a conferência)");
  const plano = { momentos: [{ tipo: "foto", de: 1, ate: 3, imagem: { id: "mel" } }, { tipo: "antesdepois", de: 4, ate: 8, antes: { id: "antes" }, depois: { id: "depois" } }, { tipo: "lista", de: 9, ate: 12, itens: [{ imagem: { id: "cafe" } }] }] };
  assert.deepEqual(B.imagensCitadas(plano), ["mel", "antes", "depois", "cafe"]);
  const fora = B.imagensForaDoBloco(plano, ["mel-2", "antes", "cafe"]);
  assert.equal(fora.length, 2);
  assert.match(fora[0], /^A imagem "mel" não está entre as imagens deste trecho/);
  assert.match(fora[1], /"depois"/);
  assert.deepEqual(B.imagensForaDoBloco(plano, ["mel", "antes", "depois", "cafe"]), []);
  assert.match(B.imagensForaDoBloco(plano, [])[0], /Este trecho não tem imagem/);
  for (const f of fora) assert.doesNotMatch(f, TRAVESSAO);
});

test("as folhas de um trecho: só as que mostram os pedidos dele (4 por folha)", () => {
  assert.deepEqual(B.folhasDosPedidos([0, 1, 2, 3], 4).map((f: { arquivo: string }) => f.arquivo), ["imagens.jpg"]);
  assert.deepEqual(B.folhasDosPedidos([5, 6, 7, 8, 9], 4).map((f: { numero: number; arquivo: string }) => [f.numero, f.arquivo]), [[2, "imagens-2.jpg"], [3, "imagens-3.jpg"]]);
  assert.deepEqual(B.folhasDosPedidos([], 4), []);
});

test("os pedidos de um trecho: no máximo 12, espalhados pelo trecho inteiro e não só o começo", () => {
  assert.equal(IMAGENS_POR_TRECHO, 12);
  const muitos = Array.from({ length: 30 }, (_, i) => ({ id: `i${i}`, em: 149 - i * 5 }));
  const doze = espalharPedidos(muitos, 12);
  assert.equal(doze.length, 12);
  assert.deepEqual([doze[0].em, doze.at(-1)!.em], [4, 149], "do começo ao fim do trecho");
  assert.ok(doze.every((p, i) => i === 0 || p.em > doze[i - 1].em), "em ordem de tempo");
  assert.deepEqual(espalharPedidos(muitos.slice(0, 3), 12).map((p) => p.id), ["i2", "i1", "i0"]);
});

// ─────────────────────────────── o fluxo de verdade, no projeto de mentira ───────────────────────────────

test("o plano em blocos com imagens: cada trecho pede, escolhe nas folhas dele e escreve só com as imagens dele", async () => {
  const { pasta, projeto } = projetoDeMentira(420);
  try {
    const app = appDeMentira({ citarDeOutroTrecho: 2, refazer: "cafe-2" });
    const passos: string[] = [];
    const tempos: string[] = [];
    const r = await W.planoEmBlocos(projeto, { comum, pedido, pedir: app.pedir, gasto: app.gasto, teto: 7, aoPasso: (p: string) => passos.push(p), marcar: (n: string) => tempos.push(n), imagens: { fixos: [], offline: false } });
    const blocos: Bloco[] = B.blocosDoPlano(lerJson(join(projeto, "src", "plano.json")).palavras, 420);
    assert.equal(blocos.length, 3);
    assert.deepEqual(tempos, ["imagens"]);

    // 1. o mapa e os pedidos de cada trecho, no tempo dele
    assert.deepEqual(app.chamadas.imagens.map((c) => c.bloco.indice), [0, 1, 2]);
    for (const c of app.chamadas.imagens) {
      const b = blocos[c.bloco.indice];
      assert.equal(c.esqueleto.duracao, +(b.fim - b.inicio).toFixed(3));
      assert.ok(c.esqueleto.palavras[0].em < 2, "a fala do trecho começa no zero");
      assert.deepEqual([c.bloco.inicio, c.bloco.fim, c.bloco.total], [b.inicio, b.fim, 3]);
    }

    // 2. um work/imagens.json só, com os pedidos de todos os trechos no tempo do vídeo
    const pedidos = lerJson(join(projeto, "work", "imagens.json")) as Pedido[];
    assert.equal(pedidos.length, 15, "cinco por trecho; o pedido fora do trecho saiu");
    assert.deepEqual(pedidos.filter((p) => p.palavra === "mel").map((p) => p.id), ["mel", "mel-2", "mel-3"]);
    for (const p of pedidos) {
      const k = Number(p.id.match(/-(\d)$/)?.[1] ?? 1) - 1;
      assert.ok(p.em >= blocos[k].inicio && p.em <= blocos[k].fim, `${p.id} em ${p.em} fora do trecho ${k + 1}`);
    }
    const busca = readFileSync(join(projeto, "work", "chamadas.log"), "utf8").trim().split("\n").map((l) => JSON.parse(l) as string[]);
    assert.equal(busca.filter((a) => a.length === 0).length, 2, "o script busca uma vez para o vídeo inteiro e uma vez para a nova busca");

    // 3. a escolha de cada trecho: só os pedidos dele, só as folhas que os mostram
    const primeira = app.chamadas.escolher.slice(0, 3);
    assert.deepEqual(primeira.map((c) => c.bloco.indice), [0, 1, 2]);
    const porBloco = blocos.map((b) => pedidos.filter((p) => p.em >= b.inicio && p.em < b.fim).map((p) => p.id));
    const folhas = (c: Corpo) => (c.folhas as string[]).map((f) => Buffer.from(f, "base64").toString("utf8").split(":")[0]);
    assert.deepEqual(primeira.map((c) => (c.pedidos as Pedido[]).map((p) => p.id)), porBloco);
    assert.deepEqual(primeira.map(folhas), [["FOLHA 1", "FOLHA 2"], ["FOLHA 2", "FOLHA 3"], ["FOLHA 3", "FOLHA 4"]]);
    assert.deepEqual(primeira[1].rotulos, ["Folha 2 (work/imagens-2.jpg)", "Folha 3 (work/imagens-3.jpg)"]);
    // a nova busca: o termo novo no work/imagens.json e uma segunda escolha só daquele pedido
    assert.equal(pedidos.find((p) => p.id === "cafe-2")!.busca, "coffee cup");
    assert.equal(app.chamadas.escolher.length, 4);
    assert.deepEqual((app.chamadas.escolher[3].pedidos as Pedido[]).map((p) => p.id), ["cafe-2"]);
    assert.deepEqual(folhas(app.chamadas.escolher[3]), ["FOLHA 2"]);
    assert.ok(pedidos.every((p) => (p.escolha as { n?: number })?.n === 2), "todas escolhidas na folha, pelo script do curso");
    assert.ok(busca.some((a) => a[0] === "--limpar"));

    // 4. o plano de cada trecho: o mapa dele e só as imagens dele
    const primeiras = blocos.map((b) => app.chamadas.plano.find((c) => c.bloco.indice === b.indice)!);
    assert.deepEqual(primeiras.map((c) => Object.keys(c.esqueleto.imagens).sort()), porBloco.map((ids) => [...ids].sort()));
    assert.deepEqual(primeiras.map((c) => c.mapa), ["mapa do trecho 1", "mapa do trecho 2", "mapa do trecho 3"]);
    // o trecho 3 citou a imagem do trecho 1: volta para conserto com a regra, e o conserto vale
    const conserto = app.chamadas.plano.filter((c) => c.bloco.indice === 2);
    assert.equal(conserto.length, 2);
    assert.match(conserto[1].anterior.saidas.join("\n"), /A imagem "mel" não está entre as imagens deste trecho/);
    assert.equal(r.historico[0].imagensFora.length, 1);
    assert.deepEqual(r.historico[0].blocos, [3]);
    assert.equal(r.historico.at(-1).imagensFora.length, 0);
    assert.deepEqual(r.blocos.map((b: { imagens: number }) => b.imagens), [5, 5, 5]);

    // o plano junto: plano.imagens inteiro (o do script), cada momento com a imagem do trecho dele
    const final = lerJson(join(projeto, "src", "plano.json"));
    assert.equal(Object.keys(final.imagens).length, 15);
    const citadas: Array<[number, string]> = final.momentos.map((m: { de: number; imagem?: { id: string } }) => [m.de, m.imagem?.id ?? ""]);
    for (const [de, id] of citadas) {
      const k = blocos.findIndex((b) => de >= b.inicio && de < b.fim);
      assert.ok(porBloco[k].includes(id), `momento em ${de} cita ${id}, que não é do trecho ${k + 1}`);
    }
    assert.match(r.creditos ?? "", /^Créditos das imagens/);
    // o gasto: 3 pedidos (0,08), 4 escolhas (0,05) e 4 escritas (0,20)
    assert.equal(+app.gasto().toFixed(2), 1.24);
    for (const p of passos) assert.doesNotMatch(p, TRAVESSAO);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});

test("o material do cliente vale em todos os trechos: o par da Transformação (offline) e os prints registrados depois", async () => {
  const { pasta, projeto } = projetoDeMentira(420);
  try {
    const app = appDeMentira();
    const fixos = [{ id: "antes", em: 0, palavra: "antes", tipo: "foto", arquivo: "antes.jpg" }, { id: "depois", em: 0.01, palavra: "depois", tipo: "foto", arquivo: "depois.jpg" }];
    let registrou = false;
    const depois = async () => {
      // como o capturar.mjs do curso: o print do cliente entra em plano.imagens depois do passo das imagens
      const plano = lerJson(join(projeto, "src", "plano.json"));
      plano.imagens["tela-cliente"] = { arquivo: "img/tela-cliente.jpg", largura: 900, altura: 1600 };
      writeFileSync(join(projeto, "src", "plano.json"), JSON.stringify(plano));
      registrou = true;
      return { material: { modelo: "modelo-teste", arquivos: [{ id: "tela-cliente" }] }, ids: ["tela-cliente"] };
    };
    await W.planoEmBlocos(projeto, { comum, pedido, pedir: app.pedir, gasto: app.gasto, teto: 7, imagens: { fixos, offline: true, depois } });
    assert.ok(registrou);
    assert.equal(app.chamadas.imagens.length, 3, "o mapa de cada trecho vem do passo 6 mesmo no offline");
    assert.equal(app.chamadas.escolher.length, 0, "a foto do cliente já entra escolhida: não volta à folha");
    const pedidos = lerJson(join(projeto, "work", "imagens.json")) as Pedido[];
    assert.deepEqual(pedidos.map((p) => p.id), ["antes", "depois"], "offline: só as duas fotos do cliente");
    const chamadas = readFileSync(join(projeto, "work", "chamadas.log"), "utf8").trim().split("\n").map((l) => JSON.parse(l) as string[]);
    assert.ok(chamadas.every((a) => a.includes("--offline")));
    for (const c of app.chamadas.plano) {
      assert.deepEqual(Object.keys(c.esqueleto.imagens).sort(), ["antes", "depois", "tela-cliente"]);
      assert.deepEqual(c.material, { modelo: "modelo-teste", arquivos: [{ id: "tela-cliente" }] }, "o redator recebe o material registrado");
    }
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});

test("o teto conta as imagens: o passo para na parte dele e a escrita para no teto com o gasto das imagens", async () => {
  // Sem imagem, as três escritas (0,20 cada) cabem num teto de US$ 0,50 (a última começa com 0,40).
  {
    const { pasta, projeto } = projetoDeMentira(420);
    try {
      const app = appDeMentira();
      await W.planoEmBlocos(projeto, { comum, pedido, pedir: app.pedir, gasto: app.gasto, teto: 0.5, imagens: null });
      assert.equal(app.chamadas.plano.length, 3);
      assert.equal(app.chamadas.imagens.length, 0);
    } finally {
      rmSync(pasta, { recursive: true, force: true });
    }
  }
  // Com imagem, o mesmo teto: o passo usa até 30% dele (US$ 0,15), o trecho que passou disso fica
  // sem imagem, as que não foram escolhidas viram cartão, e a escrita do último trecho não cabe mais.
  const { pasta, projeto } = projetoDeMentira(420);
  try {
    assert.equal(W.PARTE_DO_TETO_DAS_IMAGENS, 0.3);
    const app = appDeMentira();
    await assert.rejects(
      W.planoEmBlocos(projeto, { comum, pedido, pedir: app.pedir, gasto: app.gasto, teto: 0.5, imagens: { fixos: [], offline: false } }),
      /o teto de US\$ 0\.50 da edição foi atingido antes do bloco 3 de 3/
    );
    assert.deepEqual(app.chamadas.imagens.map((c) => c.bloco.indice), [0, 1], "o terceiro trecho já passou da parte das imagens");
    assert.equal(app.chamadas.escolher.length, 0, "a escolha também conta: sem folga, nada de escolha");
    const pedidos = lerJson(join(projeto, "work", "imagens.json")) as Pedido[];
    assert.equal(pedidos.length, 10);
    assert.ok(pedidos.every((p) => (p.escolha as { sem?: boolean })?.sem === true), "sem escolha, cartão com a palavra");
    assert.equal(+app.gasto().toFixed(2), 0.56);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});

test("o prazo do completo dá ~15 min por bloco (o passo das imagens) e ainda cabe no teto da espera", () => {
  const umBlocoAMais = prazoDoCompletoNoModeloMs(301) - prazoDoCompletoNoModeloMs(300) - Math.round(8 * 1000);
  assert.equal(umBlocoAMais, 15 * 60_000);
  assert.ok(prazoDoCompletoNoModeloMs(20 * 60) < TETO_DA_ESPERA_MS);
  assert.match(ler("worker/src/index.mjs"), /\/ 150\) \* 15 \* 60_000/);
});
