// MATERIAL SEU NESTA CAMPANHA (08/10/2026). O pedido do Bruno: "você vai usar
// material seu, foto sua, escritório seu? Vai usar essas que já existem ou vai
// subir uma nova? (...) Aí ele seleciona quais fotos vai usar nessa campanha: a
// foto 1, a 5, a 10. E em qual estilo cada foto vai se encaixar: deve escolher
// um estilo POR FOTO. (...) Se for carrossel, ele escolhe várias fotos."
// Nada aqui toca banco, IA, rede ou imagem paga: as regras são puras, o envio
// roda com falsos no lugar do navegador, a arte é desenhada de verdade com um
// banco falso em memória (globalThis.prisma) e a rede bloqueada (fetch falso
// que só devolve as duas fotos do teste), e o resto é conferido no código-fonte.
// Rodar: npx tsx --test scripts/testes/material-proprio-0810.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import {
  alternarFoto,
  caminhoDaFotoEscolhida,
  comEstiloDaFoto,
  comFotoNova,
  distribuirFotos,
  escolhaDaArteDoPost,
  estiloDaFotoValido,
  fotoDaLamina,
  fotosDoDiaNaCampanha,
  fotosDoPost,
  fotosGravadasNosPosts,
  laminasDasFotos,
  materialParaGravar,
  materialProprioValido,
  metadataDasFotosEscolhidas,
  moldeDaFotoEscolhida,
  moverFoto,
  postRecebeAFoto,
  PORTAS_DO_ESTILO,
  resumoDoPost,
  ROTULO_DA_PORTA,
  type MaterialProprio,
} from "@/lib/materiais/material-da-campanha";
import { subirMaterial, type DependenciasDoEnvio } from "@/lib/materiais/subir-no-navegador";
import { normalizarSemana, planoParaGravar } from "@/lib/media/semana-do-video";
import type { PostVisual } from "@/lib/estilo-dos-posts/tipos";
import type { MaterialNaTela } from "@/lib/materiais/tipos";

const fonte = (caminho: string) => readFileSync(new URL(`../../${caminho}`, import.meta.url), "utf8");

// O BANCO FALSO, antes de qualquer módulo que importe o Prisma: toda leitura
// devolve vazio e toda escrita fica só aqui, na lista (o .env.local aponta para
// a produção; nenhum teste pode chegar lá).
const noBancoFalso: Array<{ tabela: string; metodo: string; args: unknown }> = [];
const tabelaFalsa = (tabela: string) =>
  new Proxy(
    {},
    {
      get: (_t, metodo) => async (args: unknown) => {
        noBancoFalso.push({ tabela, metodo: String(metodo), args });
        return metodo === "findMany" ? [] : null;
      },
    }
  );
(globalThis as unknown as { prisma: unknown }).prisma = new Proxy({}, { get: (_t, tabela) => (tabela === "then" ? undefined : tabelaFalsa(String(tabela))) });

// A REDE BLOQUEADA: só as duas fotos do teste respondem (a escolhida, vermelha; outra da biblioteca, verde).
const FOTO_VERMELHA = await sharp({ create: { width: 900, height: 700, channels: 3, background: { r: 230, g: 20, b: 20 } } }).jpeg().toBuffer();
const FOTO_VERDE = await sharp({ create: { width: 900, height: 700, channels: 3, background: { r: 20, g: 210, b: 20 } } }).jpeg().toBuffer();
const URL_ESCOLHIDA = "https://teste.public.blob.vercel-storage.com/materiais/p1/escolhida.jpg";
const URL_DA_OUTRA = "https://teste.public.blob.vercel-storage.com/materiais/p1/outra.jpg";
const fetchDeVerdade = globalThis.fetch;
globalThis.fetch = (async (u: string | URL | Request) => {
  const url = typeof u === "string" ? u : u instanceof URL ? u.href : u.url;
  if (url === URL_ESCOLHIDA) return new Response(new Uint8Array(FOTO_VERMELHA), { status: 200 });
  if (url === URL_DA_OUTRA) return new Response(new Uint8Array(FOTO_VERDE), { status: 200 });
  throw new Error(`rede bloqueada no teste: ${url}`);
}) as typeof fetch;
test.after(() => {
  globalThis.fetch = fetchDeVerdade;
});

const arte = await import("@/lib/media/arte-com-frase");
const { fotoDaPeca } = await import("@/lib/media/foto-da-peca");

// A semana de exemplo: segunda foto, quarta carrossel (5 lâminas), sexta foto, sábado infográfico.
const POSTS: PostVisual[] = [
  { chave: "1", rotulo: "Segunda 13", formato: "image" },
  { chave: "3", rotulo: "Quarta 15", formato: "carousel" },
  { chave: "5", rotulo: "Sexta 17", formato: "image" },
  { chave: "6", rotulo: "Sábado 18", formato: "infographic" },
];
const LAMINAS = 5;
const DO_BOOK = { catalogoId: "foto-inteira-degrade", nome: "Foto inteira" };
const CRIADO = { designId: "design_meu_1", nome: "Fundo preto com texto" };

const marcar = (ids: string[], posts = POSTS, laminas = LAMINAS) =>
  ids.reduce<MaterialProprio>((m, id) => alternarFoto(m, id, posts, laminas), { usar: true, fotos: [] });

// ── 1. Escolher fotos que já existem ───────────────────────────────────────────

test("escolher fotos que já existem: a foto 1, a 5 e a 10 vão, na ordem, para os posts de foto e carrossel", () => {
  const m = marcar(["foto1", "foto5", "foto10"]);
  assert.deepEqual(
    m.fotos.map((f) => [f.id, f.post]),
    [
      ["foto1", "1"],
      ["foto5", "3"],
      ["foto10", "5"],
    ],
    "uma para cada post com foto, na ordem dos dias; o infográfico não recebe foto"
  );
  assert.ok(m.fotos.every((f) => f.estilo.porta === "mestre"), "toda foto nasce no Estilo mestre (o padrão)");
  const desmarcada = alternarFoto(m, "foto5", POSTS, LAMINAS);
  assert.deepEqual(desmarcada.fotos.map((f) => f.id), ["foto1", "foto10"], "tocar de novo desmarca");
  assert.equal(desmarcada.fotos.find((f) => f.id === "foto10")?.post, "3", "a regra padrão arruma o resto");
});

test("a pessoa troca o post da foto; na foto do dia ocupada, as duas trocam de lugar", () => {
  const m = marcar(["a", "b", "c"]);
  const trocada = moverFoto(m, "c", "1", POSTS, LAMINAS);
  assert.equal(trocada.fotos.find((f) => f.id === "c")?.post, "1");
  assert.equal(trocada.fotos.find((f) => f.id === "a")?.post, "5", "a que estava na segunda foi para a sexta");
  // Tirar a foto da campanha também é escolha, e a regra padrão respeita.
  const fora = moverFoto(trocada, "b", null, POSTS, LAMINAS);
  assert.equal(fora.fotos.find((f) => f.id === "b")?.post, null);
  assert.equal(distribuirFotos(fora, POSTS, LAMINAS).fotos.find((f) => f.id === "b")?.post, null, "fica fora até a pessoa mudar");
  // Post que não existe na campanha não é destino.
  assert.equal(moverFoto(m, "a", "7", POSTS, LAMINAS), m);
});

test("mais fotos que lugares: o que sobra fica fora e a escolha vai para a esteira exatamente como a tela mostrou", () => {
  const so2: PostVisual[] = [POSTS[0], POSTS[2]];
  const m = marcar(["a", "b", "c"], so2, LAMINAS);
  assert.deepEqual(m.fotos.map((f) => f.post), ["1", "5", null], "sem carrossel, a terceira foto fica fora");
  // O que a tela mostrou é o que sai: materialParaGravar não reembaralha o que já tem post válido.
  const manual = moverFoto(marcar(["a", "b", "c"]), "c", "1", POSTS, LAMINAS);
  const gravado = materialParaGravar(manual, POSTS, LAMINAS)!;
  assert.deepEqual(gravado.fotos.map((f) => [f.id, f.post]), manual.fotos.map((f) => [f.id, f.post]));
  // O dia que deixou de ser foto: só a foto dele procura outro lugar.
  const semSexta = POSTS.filter((p) => p.chave !== "5");
  const depois = materialParaGravar(manual, semSexta, LAMINAS)!;
  assert.equal(depois.fotos.find((f) => f.id === "c")?.post, "1", "a que estava num post que ainda existe fica");
  assert.equal(depois.fotos.find((f) => f.id === "a")?.post, "3", "a da sexta vai para a lâmina livre do carrossel");
});

// ── 2. Subir foto nova ali mesmo ───────────────────────────────────────────────

function envioFalso() {
  const enviados: Array<{ caminho: string; handleUploadUrl: string; clientPayload: string; contentType: string }> = [];
  const registrados: Array<Record<string, unknown>> = [];
  const material: MaterialNaTela = {
    id: "nova1", tipo: "foto", nome: "escritorio.jpg", etiquetas: [], etiquetasEditadas: false, descricao: null, qualidade: null, luz: null,
    orientacao: "horizontal", temRosto: false, status: "analisando", duracaoSec: null, largura: 2560, altura: 1440, usos: 0, temRecorte: false, createdAt: "2026-10-08T12:00:00Z",
  };
  const d: DependenciasDoEnvio = {
    enviar: async (caminho, _dado, o) => {
      enviados.push({ caminho, ...o });
      return { url: `https://x.private.blob.vercel-storage.com/${caminho}` };
    },
    registrar: async (_projectId, corpo) => {
      registrados.push(corpo);
      return { ok: true, corpo: { material } };
    },
    prepararFoto: async () => ({ arquivo: new Blob(["foto"]), mini: new Blob(["mini"]), largura: 2560, altura: 1440 }),
    prepararVideo: async () => {
      throw new Error("não devia preparar vídeo");
    },
    agora: () => 1700000000000,
  };
  return { d, enviados, registrados, material };
}

test("subir foto nova na janela usa o envio da biblioteca: pasta do projeto, rota de token, registro que etiqueta", async () => {
  const { d, enviados, registrados } = envioFalso();
  const arquivo = Object.assign(new Blob(["x"], { type: "image/jpeg" }), { name: "Escritório 1.JPG" });
  const m = await subirMaterial("proj1", arquivo, { soFoto: true, dependencias: d });
  assert.equal(m.id, "nova1");
  assert.equal(enviados.length, 2, "a foto e a miniatura");
  assert.ok(enviados.every((e) => e.caminho.startsWith("materiais/proj1/1700000000000-")), enviados.map((e) => e.caminho).join(" "));
  assert.ok(enviados.every((e) => e.handleUploadUrl === "/api/projects/proj1/materiais/upload"));
  assert.deepEqual(JSON.parse(enviados[0].clientPayload).tipo, "foto");
  assert.deepEqual(JSON.parse(enviados[1].clientPayload).tipo, "miniatura");
  assert.equal(registrados[0].tipo, "foto");
  assert.ok(String(registrados[0].url).includes("/materiais/proj1/"));
  // A biblioteca de materiais usa o MESMO envio (nada duplicado).
  assert.match(fonte("components/materiais/biblioteca-de-materiais.tsx"), /subirMaterial\(projectId, f\)/);
});

test("na janela da campanha só foto sobe; vídeo vai pela biblioteca, e o erro do servidor chega à pessoa", async () => {
  const { d } = envioFalso();
  const video = Object.assign(new Blob(["v"], { type: "video/mp4" }), { name: "bastidor.mp4" });
  await assert.rejects(subirMaterial("proj1", video, { soFoto: true, dependencias: d }), /só fotos/);
  const recusa: DependenciasDoEnvio = { ...d, registrar: async () => ({ ok: false, corpo: { error: "Arquivo fora da pasta do projeto." } }) };
  const foto = Object.assign(new Blob(["x"], { type: "image/png" }), { name: "a.png" });
  await assert.rejects(subirMaterial("proj1", foto, { soFoto: true, dependencias: recusa }), /fora da pasta/);
});

test("a foto que acabou de subir entra marcada, mesmo antes de a pessoa responder sim", () => {
  const m = comFotoNova(null, "nova1", POSTS, LAMINAS);
  assert.equal(m.usar, true);
  assert.deepEqual(m.fotos.map((f) => [f.id, f.post]), [["nova1", "1"]]);
  const de2 = comFotoNova(m, "nova2", POSTS, LAMINAS);
  assert.deepEqual(de2.fotos.map((f) => f.id), ["nova1", "nova2"]);
  assert.equal(comFotoNova(de2, "nova2", POSTS, LAMINAS).fotos.length, 2, "subir de novo não duplica");
});

// ── 3. Um estilo por foto ─────────────────────────────────────────────────────

test("as três portas do estilo, na ordem da plataforma: Estilo mestre, Da biblioteca, Criar o meu", () => {
  assert.deepEqual([...PORTAS_DO_ESTILO], ["mestre", "biblioteca", "criado"]);
  assert.deepEqual(PORTAS_DO_ESTILO.map((p) => ROTULO_DA_PORTA[p]), ["Estilo mestre", "Da biblioteca", "Criar o meu"]);
  const ui = fonte("components/materiais/material-da-campanha.tsx");
  assert.match(ui, /\(\["mestre", "biblioteca", "criado"\] as const\)/, "a tela desenha as portas nessa ordem");
  assert.match(ui, /<CriarEstilo[\s\S]*?paraOPost/, "Criar o meu reaproveita o quadro de chat (texto ou áudio), só para o post");
  assert.match(ui, /<GaleriaDaBiblioteca[\s\S]*?tipoFixo="imagem"/, "Da biblioteca abre a galeria de modelos de imagem");
});

test("cada foto tem o estilo dela; o mestre segue o post, e estilo de vídeo ou só a marca não vale para foto", () => {
  let m = marcar(["eu", "escritorio"]);
  m = comEstiloDaFoto(m, "eu", { porta: "criado", modelo: CRIADO });
  m = comEstiloDaFoto(m, "escritorio", { porta: "biblioteca", modelo: DO_BOOK });
  const lidas = fotosDoPost(m, null)!;
  assert.deepEqual(lidas, [
    { id: "eu", modelo: CRIADO },
    { id: "escritorio", modelo: DO_BOOK },
  ]);
  assert.deepEqual(fotosDoPost(comEstiloDaFoto(m, "eu", { porta: "mestre" }), "1"), [{ id: "eu", modelo: null }], "mestre: null, segue o modelo do post");
  assert.equal(estiloDaFotoValido({ porta: "biblioteca", modelo: { estiloId: "acelerado" } }).porta, "mestre", "estilo de edição não é modelo de foto");
  assert.equal(estiloDaFotoValido({ porta: "criado", modelo: { marca: true } }).porta, "mestre");
  assert.equal(estiloDaFotoValido({ porta: "biblioteca", modelo: { catalogoId: "x y" } }).porta, "mestre", "id inválido cai no mestre");
  // Ida e volta pelo JSON do banco.
  assert.deepEqual(materialProprioValido(JSON.parse(JSON.stringify(m))), m);
});

// ── 4. Carrossel com várias fotos ─────────────────────────────────────────────

test("carrossel com várias fotos: as que sobram dos posts de foto vão para as lâminas, até encher", () => {
  const m = marcar(["a", "b", "c", "d", "e", "f", "g", "h", "i"]);
  const noCarrossel = m.fotos.filter((f) => f.post === "3").map((f) => f.id);
  assert.deepEqual(noCarrossel, ["b", "d", "e", "f", "g"], "cinco lâminas, cinco fotos");
  assert.deepEqual(m.fotos.filter((f) => f.post === null).map((f) => f.id), ["h", "i"], "o resto fica fora, e a tela diz");
  // A pessoa põe várias fotos no carrossel de propósito.
  let escolha = marcar(["x", "y", "z"]);
  escolha = moverFoto(escolha, "x", "3", POSTS, LAMINAS);
  escolha = moverFoto(escolha, "z", "3", POSTS, LAMINAS);
  assert.deepEqual(escolha.fotos.filter((f) => f.post === "3").map((f) => f.id), ["x", "z"], "duas fotos no carrossel, na ordem em que foram marcadas");
  assert.equal(escolha.fotos.find((f) => f.id === "y")?.post, "1", "a outra foto vai para o post de foto que ficou livre");
  assert.equal(escolhaDaArteDoPost({ fotos: fotosDoPost(escolha, "3"), formato: "carousel", modeloDoPost: DO_BOOK }).fotos?.length, 2);
});

test("as fotos do carrossel se espalham pelas lâminas, a primeira na capa", () => {
  assert.deepEqual(laminasDasFotos(2, 5), [0, null, 1, null, null]);
  assert.deepEqual(laminasDasFotos(3, 5), [0, 1, null, 2, null]);
  assert.deepEqual(laminasDasFotos(5, 5), [0, 1, 2, 3, 4]);
  assert.deepEqual(laminasDasFotos(1, 3), [0, null, null]);
  assert.deepEqual(laminasDasFotos(7, 3), [0, 1, 2], "mais fotos que lâminas: as que sobram ficam fora");
  const fotos = ["A", "B"];
  assert.deepEqual([0, 1, 2, 3, 4].map((i) => fotoDaLamina(fotos, i, 5)), ["A", null, "B", null, null]);
  assert.equal(fotoDaLamina(fotos, 0, 1), "A", "peça única leva a primeira");
  assert.equal(fotoDaLamina([], 0, 1), null);
  assert.equal(
    resumoDoPost({ post: POSTS[1], fotos: [{ estilo: { porta: "mestre" } }, { estilo: { porta: "biblioteca", modelo: DO_BOOK } }], laminas: 5 }),
    "2 fotos suas em as lâminas 1 e 3 de 5, cada uma no estilo dela; as outras lâminas saem geradas no modelo do carrossel"
  );
});

test("a esteira do carrossel desenha cada lâmina com a foto dela, e a semana do vídeo também", () => {
  const carrossel = fonte("lib/media/carrossel.ts");
  assert.match(carrossel, /fotoDaLamina\(fotosDoPost, i, opcoes\.roteiro\.length\)/);
  assert.match(carrossel, /arteComFotoEscolhida\(/);
  assert.match(carrossel, /marca\.materiais = \[\];/, "lâmina sem foto escolhida não pega outra foto da biblioteca");
  const semana = fonte("lib/media/pecas-da-semana.ts");
  assert.match(semana, /marcaDaLaminaComFoto\(marcaDoDia, i, frases\.length\)/);
  assert.match(semana, /fotosDoPost\(semana\.material, String\(dia\)\)/);
});

// ── 5. A arte usa a foto e o estilo escolhidos ─────────────────────────────────

test("a foto do dia com estilo próprio leva o modelo dela; no mestre vale o modelo do post", () => {
  const doDia = { catalogoId: "voce-na-frente-do-titulo", nome: "Você na frente" };
  const comEstilo = escolhaDaArteDoPost({ fotos: [{ id: "eu", modelo: CRIADO }], formato: "image", modeloDoPost: doDia });
  assert.deepEqual(comEstilo, { modeloDoPost: CRIADO, fotos: [{ id: "eu", modelo: CRIADO }] });
  const mestre = escolhaDaArteDoPost({ fotos: [{ id: "eu", modelo: null }], formato: "image", modeloDoPost: doDia });
  assert.deepEqual(mestre.modeloDoPost, doDia);
  // O carrossel fica com o modelo dele; cada lâmina com foto usa o estilo da sua.
  const car = escolhaDaArteDoPost({ fotos: [{ id: "a", modelo: CRIADO }, { id: "b", modelo: null }], formato: "carousel", modeloDoPost: DO_BOOK });
  assert.deepEqual(car.modeloDoPost, DO_BOOK);
  assert.equal(car.fotos?.length, 2);
  // Infográfico e vídeo não levam foto do cliente; com escolha feita, nenhuma foto da biblioteca entra.
  assert.deepEqual(escolhaDaArteDoPost({ fotos: [{ id: "a", modelo: null }], formato: "infographic", modeloDoPost: null }).fotos, []);
});

test("o caminho da foto escolhida: a foto entra sempre, e o rosto só é refeito por IA no lugar de \"você\"", () => {
  const voce = { foto: "recorte", porPrompt: true };
  const comZona = { foto: "inteira", porPrompt: true };
  const soTexto = { foto: "nenhuma", porPrompt: false };
  const emCodigo = { foto: "topo", porPrompt: false };
  assert.equal(caminhoDaFotoEscolhida({ modelo: voce, pessoa: true, rosto: true }), "referencia", "a pessoa no modelo você: a regra de 05/10");
  assert.equal(caminhoDaFotoEscolhida({ modelo: voce, pessoa: false, rosto: false }), "composicao", "o escritório no modelo você: a foto real");
  assert.equal(caminhoDaFotoEscolhida({ modelo: comZona, pessoa: false, rosto: false }), "referencia", "produto ou lugar no modelo com foto");
  assert.equal(caminhoDaFotoEscolhida({ modelo: comZona, pessoa: true, rosto: true }), "composicao", "a pessoa fora do modelo você: a foto real, sem refazer o rosto");
  assert.equal(caminhoDaFotoEscolhida({ modelo: soTexto, pessoa: true, rosto: true }), "composicao");
  assert.equal(caminhoDaFotoEscolhida({ modelo: emCodigo, pessoa: false, rosto: false }), "composicao");
  assert.equal(caminhoDaFotoEscolhida({ modelo: null, pessoa: false, rosto: false }), "composicao");
  // O molde: o modelo do estilo quando tem lugar para foto; senão a foto manda.
  assert.equal(moldeDaFotoEscolhida({ modelo: comZona, pessoa: true }), "modelo");
  assert.equal(moldeDaFotoEscolhida({ modelo: soTexto, pessoa: true }), "voce", "fundo preto com texto e a foto da pessoa: o você na frente do título");
  assert.equal(moldeDaFotoEscolhida({ modelo: soTexto, pessoa: false }), "familia");
  assert.equal(moldeDaFotoEscolhida({ modelo: null, pessoa: false }), "familia");
});

// A arte desenhada de verdade (sharp e a composição em código), sem IA: o desenhista é falso e conta as chamadas.
const ESCOLHIDA = { id: "mat_escolhida", url: URL_ESCOLHIDA, etiquetas: ["local" as const], descricao: "o escritório", palavrasEn: [], luz: "boa", orientacao: "horizontal", temRosto: false, usos: 0, ultimoUsoEm: 0, daCampanha: true };
const DA_BIBLIOTECA = { ...ESCOLHIDA, id: "mat_outra", url: URL_DA_OUTRA, descricao: "outra foto" };
const MARCA_DE_TESTE = { familia: "impacto" as const, cores: { acento: "#f97316", escuro: "#111111", claro: "#eeeeee" } };
const naoGera = async (): Promise<string> => {
  throw new Error("não devia gerar imagem");
};

async function contarPixels(dataUri: string, cor: "vermelho" | "verde"): Promise<number> {
  const b = Buffer.from(dataUri.slice(dataUri.indexOf(",") + 1), "base64");
  const { data, info } = await sharp(b).resize(100, 100, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  let n = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, bl] = [data[i], data[i + 1], data[i + 2]];
    // Pela proporção entre os canais, para valer também na foto escurecida pelo modelo.
    if (cor === "vermelho" ? r > 50 && r > 2.5 * g && r > 2.5 * bl : g > 50 && g > 2.5 * r && g > 2.5 * bl) n++;
  }
  return n;
}

test("a arte usa a foto escolhida (e não outra da biblioteca), sem pagar imagem gerada", async () => {
  let geradas = 0;
  const desenhista = async (): Promise<string> => {
    geradas++;
    throw new Error("não devia gerar imagem");
  };
  const frase = "O escritório que trabalha por você";
  const marca = { ...MARCA_DE_TESTE, materiais: [DA_BIBLIOTECA, ESCOLHIDA], fotosDoPost: [{ material: ESCOLHIDA, modeloId: null }] };
  const uri = await arte.desenharComFraseEmCodigo(frase, marca as never, desenhista)("Scene: an office", "4:5");
  assert.equal(geradas, 0, "a foto escolhida vem antes de qualquer imagem paga");
  const vermelhos = await contarPixels(uri, "vermelho");
  assert.ok(vermelhos > 1500, `a foto escolhida quase não aparece: ${vermelhos}`);
  assert.equal(await contarPixels(uri, "verde"), 0, "a outra foto da biblioteca não entrou");
  assert.equal(fotoDaPeca(frase)?.materialId, "mat_escolhida", "o post registra a foto de verdade");
});

test("a foto entra no estilo escolhido para ela: o modelo do estilo desenha a peça", async () => {
  const frase = "Quem aparece vende mais";
  const pessoa = { ...ESCOLHIDA, id: "mat_pessoa", etiquetas: ["pessoa" as const], temRosto: true };
  const antes = noBancoFalso.length;
  // A pessoa num modelo de foto inteira que não é "você": a foto real, composta no molde do modelo.
  const marca = { ...MARCA_DE_TESTE, materiais: [], fotosDoPost: [{ material: pessoa, modeloId: "foto-escura-texto-no-centro" }] };
  const uri = await arte.desenharComFraseEmCodigo(frase, marca as never, naoGera)("Scene: a person", "4:5");
  const vermelhos = await contarPixels(uri, "vermelho");
  assert.ok(vermelhos > 1000, `a foto quase não aparece: ${vermelhos}`);
  const usosDoModelo = noBancoFalso.slice(antes).filter((e) => JSON.stringify(e.args ?? null).includes("foto-escura-texto-no-centro"));
  assert.ok(usosDoModelo.length > 0, "o uso foi contado no modelo do estilo da foto (no banco falso)");
  assert.equal(fotoDaPeca(frase)?.materialId, "mat_pessoa");
  // "Fundo preto com texto" (modelo só de texto) com a foto do escritório: a foto manda e entra na composição da marca.
  const soTexto = { ...MARCA_DE_TESTE, materiais: [], fotosDoPost: [{ material: ESCOLHIDA, modeloId: "frase-fundo-escuro" }] };
  const uri2 = await arte.desenharComFraseEmCodigo("O lugar onde tudo acontece", soTexto as never, naoGera)("Scene: an office", "4:5");
  const vermelhos2 = await contarPixels(uri2, "vermelho");
  assert.ok(vermelhos2 > 1000, `a foto escolhida ficou de fora porque o estilo é só texto: ${vermelhos2}`);
});

test("escolha feita e peça sem foto: nenhuma foto da biblioteca entra, a arte sai gerada", async () => {
  const azul = await sharp({ create: { width: 1080, height: 600, channels: 3, background: { r: 20, g: 20, b: 230 } } }).jpeg().toBuffer();
  let geradas = 0;
  const desenhista = async (): Promise<string> => {
    geradas++;
    return `data:image/jpeg;base64,${azul.toString("base64")}`;
  };
  const frase = "Uma frase sem foto";
  const marca = { ...MARCA_DE_TESTE, materiais: [DA_BIBLIOTECA], fotosDoPost: [] };
  const uri = await arte.desenharComFraseEmCodigo(frase, marca as never, desenhista)("Scene: a desk", "4:5");
  assert.equal(geradas, 1);
  assert.equal(await contarPixels(uri, "verde"), 0, "nenhuma foto da biblioteca entrou");
  assert.equal(fotoDaPeca(frase)?.fonte, "gerada");
});

test("a lâmina do carrossel desenhado fora da esteira leva a foto da posição dela", () => {
  const fotos = [
    { material: ESCOLHIDA, modeloId: null },
    { material: DA_BIBLIOTECA, modeloId: "foto-inteira-degrade" },
  ];
  const marca = { ...MARCA_DE_TESTE, fotosDoPost: fotos } as never;
  const plano = [0, 1, 2, 3, 4].map((i) => arte.fotoEscolhidaDaPeca(arte.marcaDaLaminaComFoto(marca, i, 5))?.material.id ?? null);
  assert.deepEqual(plano, ["mat_escolhida", null, "mat_outra", null, null]);
  assert.deepEqual(arte.marcaDaLaminaComFoto(marca, 1, 5).materiais, [], "lâmina sem foto: materiais vazios");
  assert.equal(arte.fotoEscolhidaDaPeca({ ...MARCA_DE_TESTE } as never), undefined, "sem escolha: a regra de hoje");
  assert.equal(arte.marcaDaLaminaComFoto({ ...MARCA_DE_TESTE, materiais: [DA_BIBLIOTECA] } as never, 0, 5).materiais?.length, 1, "sem escolha a marca segue como veio");
});

test("a arte da peça começa pela foto escolhida, e sem foto para a peça nenhuma outra da biblioteca entra", () => {
  const arte = fonte("lib/media/arte-com-frase.tsx");
  const desenhar = arte.slice(arte.indexOf("export function desenharComFraseEmCodigo"));
  const iFoto = desenhar.indexOf("fotoEscolhidaDaPeca(marcaRecebida)");
  const iPrompt = desenhar.indexOf("const porPrompt = await modeloDaMarca(marca");
  assert.ok(iFoto > 0 && iPrompt > iFoto, "a foto escolhida vem antes do modelo por prompt e da biblioteca");
  assert.match(desenhar, /marcaComFotoDaPeca\(marcaRecebida, null\)/, "escolha feita e peça sem foto: materiais vazios");
  assert.match(arte, /referenciaDaPessoa: undefined/, "a referência da pessoa é a foto escolhida, nunca outra");
  assert.match(arte, /escolheuFotos \? Promise\.resolve\(\[\]\) : materiaisDaMarca/, "com escolha, a biblioteca inteira nem é lida");
  assert.match(arte, /molde: \{ modelo: modeloDoMolde \}/, "a composição não pode deixar a foto escolhida para outra peça");
  const executar = fonte("lib/pipeline/executar.ts");
  assert.match(executar, /fotosDoPost: escolhaDaArte\.fotos/);
  assert.match(executar, /metadataDasFotosEscolhidas\(e\.fotos\)/, "as fotos ficam no post para o refazer partir delas");
  for (const refazer of ["lib/pipeline/refazer-peca.ts", "lib/media/pedido-do-card.ts", "lib/vera/regerar-arte.ts", "app/api/campaign-cards/[id]/chat/route.ts", "lib/media/artes-aguardando-identidade.ts"]) {
    assert.match(fonte(refazer), /fotosGravadasNosPosts\(/, `${refazer}: o refazer não troca a foto escolhida`);
  }
});

test("as fotos gravadas no post voltam iguais para o refazer", () => {
  const meta = metadataDasFotosEscolhidas([{ id: "eu", modelo: { ...CRIADO } }, { id: "loja", modelo: null }]);
  const lidas = fotosGravadasNosPosts([{ metadata: { outra: 1 } }, { metadata: JSON.parse(JSON.stringify(meta)) }]);
  assert.deepEqual(lidas, [
    { id: "eu", modelo: CRIADO },
    { id: "loja", modelo: null },
  ]);
  assert.deepEqual(fotosGravadasNosPosts([{ metadata: { fotosEscolhidas: [] } }]), [], "lista vazia é escolha: o post segue sem foto do cliente");
  assert.equal(fotosGravadasNosPosts([{ metadata: {} }, { metadata: null }]), null, "sem nada gravado: a regra de hoje");
  assert.deepEqual(metadataDasFotosEscolhidas(null), {});
});

test("a semana do vídeo guarda a escolha no plano e cada foto só fica em dia que recebe foto", () => {
  const material: MaterialProprio = {
    usar: true,
    fotos: [
      { id: "eu", post: "1", estilo: { porta: "criado", modelo: CRIADO } },
      { id: "loja", post: "2", estilo: { porta: "mestre" } },
    ],
  };
  const bruta = { versao: 2, inicio: null, dias: { "1": { formato: "image", redes: ["instagram"] }, "2": { formato: "text", redes: ["linkedin"] }, "3": { formato: "carousel", redes: ["instagram"] } }, material };
  const semana = normalizarSemana(bruta, ["instagram", "linkedin"]);
  assert.equal(semana.material?.fotos.find((f) => f.id === "eu")?.post, "1", "a foto em dia de foto fica");
  assert.equal(semana.material?.fotos.find((f) => f.id === "loja")?.post, "3", "a do dia de texto vai para o carrossel");
  const gravado = planoParaGravar(semana) as { material?: MaterialProprio };
  assert.deepEqual(gravado.material, semana.material, "o plano gravado (projeto e run) leva o material");
  assert.equal(normalizarSemana({ versao: 2, inicio: null, dias: bruta.dias }).material, undefined, "sem escolha, nada aparece");
});

// ── 6. Sem foto escolhida, a regra de hoje ─────────────────────────────────────

test("sem resposta, sem foto marcada ou campanha antiga: vale a regra de hoje", () => {
  assert.equal(fotosDoPost(undefined, "1"), null);
  assert.equal(fotosDoDiaNaCampanha({ campaignMode: "weekly" }, 1), null, "campanha antiga");
  assert.equal(fotosDoPost({ usar: true, fotos: [] }, "1"), null, "sim sem foto marcada não é escolha");
  assert.equal(materialParaGravar(null, POSTS, LAMINAS), undefined);
  assert.equal(materialParaGravar({ usar: true, fotos: [] }, POSTS, LAMINAS), undefined, "o envio não grava escolha vazia");
  const hoje = escolhaDaArteDoPost({ fotos: null, formato: "image", modeloDoPost: DO_BOOK });
  assert.deepEqual(hoje, { modeloDoPost: DO_BOOK, fotos: null }, "o modelo do post segue igual e a biblioteca segue valendo");
});

test("\"não desta vez\": nenhuma foto da biblioteca entra em post nenhum", () => {
  const nao = materialParaGravar({ usar: false, fotos: [] }, POSTS, LAMINAS);
  assert.deepEqual(nao, { usar: false, fotos: [] });
  assert.deepEqual(fotosDoPost(nao, "1"), []);
  assert.deepEqual(fotosDoDiaNaCampanha({ campaignMode: "weekly", materialProprio: nao }, 3), []);
});

test("foto que não foi escolhida não entra: o post sem foto da escolha recebe lista vazia", () => {
  const m = materialParaGravar(marcar(["so-uma"]), POSTS, LAMINAS)!;
  const config = { campaignMode: "weekly", materialProprio: m };
  assert.deepEqual(fotosDoDiaNaCampanha(config, 1), [{ id: "so-uma", modelo: null }]);
  assert.deepEqual(fotosDoDiaNaCampanha(config, 3), [], "o carrossel sem foto sai gerado, sem outra foto da biblioteca");
  assert.deepEqual(fotosDoDiaNaCampanha(config, 5), []);
  // No post único o dia é recalculado pela data: valem as fotos do único post.
  assert.deepEqual(fotosDoDiaNaCampanha({ campaignMode: "single", materialProprio: m }, 4), [{ id: "so-uma", modelo: null }]);
});

// ── 7. Ninguém fica trancado ──────────────────────────────────────────────────

test("membro da equipe usa: as rotas de materiais e o criar do post não pedem o dono, e a semana é campo do envio", () => {
  const lista = fonte("app/api/projects/[id]/materiais/route.ts");
  assert.match(lista, /podeUsarProjeto/);
  assert.doesNotMatch(lista, /soODono/);
  const envio = fonte("app/api/projects/[id]/materiais/upload/route.ts");
  assert.match(envio, /projetoVisivel\(userId\)/);
  assert.doesNotMatch(envio, /soODono/);
  assert.match(fonte("app/api/projects/[id]/materiais/[materialId]/arquivo/route.ts"), /podeUsarProjeto/);
  assert.match(fonte("app/api/projects/[id]/estilo-dos-posts/route.ts"), /if \(!paraOPost\) \{\s*const recusa = await soODono/, "criar o modelo para um post é de quem usa o projeto");
  assert.match(fonte("lib/equipe/permissoes.ts"), /CAMPOS_DO_ENVIO = \["videoSemana"/, "o membro grava a semana do vídeo (com o material dentro)");
  const ui = fonte("components/materiais/material-da-campanha.tsx");
  assert.doesNotMatch(ui, /podeMudar|soODono|ehDono|\bdono\b\s*[?&]/, "o bloco não esconde nada do membro");
});

test("quem não tem foto nenhuma segue: o bloco oferece subir ou seguir sem, e o envio da campanha não espera material", () => {
  const ui = fonte("components/materiais/material-da-campanha.tsx");
  assert.match(ui, /Você ainda não tem fotos na biblioteca/);
  assert.match(ui, /Não desta vez/);
  assert.match(ui, /Sem responder, vale o de sempre/);
  const modal = fonte("components/posts/campaign-setup-modal.tsx");
  assert.match(modal, /materialParaGravar\(materialProprio, postsVisuais, laminasDoCarrossel\)/);
  assert.doesNotMatch(modal, /faltaMaterial|materialObrigatorio/, "nenhuma trava nova antes de gerar");
  const jornada = fonte("components/posts/jornada-da-campanha.tsx");
  assert.match(jornada, /<MaterialDaCampanha/);
  assert.doesNotMatch(jornada.slice(jornada.indexOf("<MaterialDaCampanha")), /disabled=\{[^}]*material/i, "o Continuar não depende do material");
});

test("nada de travessão no texto novo", () => {
  for (const arquivo of ["lib/materiais/material-da-campanha.ts", "lib/materiais/subir-no-navegador.ts", "components/materiais/material-da-campanha.tsx"]) {
    assert.ok(!fonte(arquivo).includes("—"), `${arquivo} tem travessão`);
  }
});

// ── A revisão cética do ramo (08/10) ─────────────────────────────────────────

test("revisão: na lâmina do carrossel com modelo só de texto, a foto escolhida no Estilo mestre continua aparecendo", async () => {
  const frase = "A lâmina com a sua foto";
  // O carrossel cujo modelo é só texto: antes, a composição herdava o modeloFixo e a foto sumia.
  const marca = { ...MARCA_DE_TESTE, modeloFixo: "frase-fundo-escuro", pagina: { i: 0, total: 5 }, materiais: [], fotosDoPost: [{ material: ESCOLHIDA, modeloId: null }] };
  const uri = await arte.desenharComFraseEmCodigo(frase, marca as never, naoGera)("Scene: an office", "4:5");
  const vermelhos = await contarPixels(uri, "vermelho");
  assert.ok(vermelhos > 1000, `a foto sumiu da lâmina: ${vermelhos}`);
  assert.equal(fotoDaPeca(frase)?.materialId, "mat_escolhida");
  // A lâmina sem foto escolhida (a 2) sai no modelo do carrossel, sem foto nenhuma.
  const semFoto = { ...marca, pagina: { i: 1, total: 5 } };
  const uri2 = await arte.desenharComFraseEmCodigo("A lâmina sem foto", semFoto as never, naoGera)("Scene: a desk", "4:5");
  assert.equal(await contarPixels(uri2, "vermelho"), 0, "a foto da lâmina 1 não aparece na 2");
});

test("revisão: o chat do card não intercala por conta própria um carrossel com fotos escolhidas", () => {
  const pedido = fonte("lib/media/pedido-do-card.ts");
  assert.match(pedido, /const comFotosEscolhidas = Boolean\(marca\.fotosDoPost\);/);
  assert.match(pedido, /const plano: FotoDaLamina\[\] = !comFotosEscolhidas && modeloPedePessoa/, "sem plano próprio, a resposta não diz intercaladas");
  assert.match(pedido, /if \(comFotosEscolhidas\) return \{ \.\.\.marca, pagina \};/, "a lâmina sem foto não troca de modelo");
});

test("revisão: campanha sem dia de foto ou carrossel não leva uma resposta antiga escondida", () => {
  const soInfografico: PostVisual[] = [{ chave: "6", rotulo: "Sábado 18", formato: "infographic" }];
  assert.equal(materialParaGravar(marcar(["a"]), soInfografico, LAMINAS), undefined, "sim antigo: regra de hoje");
  assert.equal(materialParaGravar({ usar: false, fotos: [] }, soInfografico, LAMINAS), undefined, "não antigo: regra de hoje");
  const modal = fonte("components/posts/campaign-setup-modal.tsx");
  assert.match(modal, /m\?\.fotos\.filter\(\(f\) => f\.post\)\.map\(\(f\) => f\.id\)/, "materiaisDaCampanha só com as fotos que entram");
});

test("revisão: o carrossel cheio não aparece como destino, e a foto do dia ocupada troca", () => {
  const cheio = marcar(["a", "b", "c", "d", "e", "f", "g"]);
  const car = POSTS[1];
  assert.equal(cheio.fotos.filter((f) => f.post === "3").length, LAMINAS);
  assert.equal(postRecebeAFoto(cheio, "a", car, LAMINAS), false, "a foto da segunda não cabe no carrossel cheio");
  assert.equal(postRecebeAFoto(cheio, "b", car, LAMINAS), true, "a que já está nele continua podendo ficar");
  assert.equal(postRecebeAFoto(cheio, "a", POSTS[2], LAMINAS), true, "a foto do dia ocupada troca de lugar");
  const ui = fonte("components/materiais/material-da-campanha.tsx");
  assert.match(ui, /disabled=\{cheio\}/);
});

test("revisão: a tela não promete o que a arte não faz", () => {
  const ui = fonte("components/materiais/material-da-campanha.tsx");
  assert.doesNotMatch(ui, /como você subiu/, "no lugar de \"você\" a foto é referência do gerador, não entra crua");
  assert.match(ui, /Nenhuma foto marcada ainda\. Sem marcar, vale o de sempre/, "sim sem foto: diz que vale a regra de hoje");
  assert.match(ui, /é só texto: a foto entra num molde com foto/, "o Estilo mestre com modelo só de texto diz para onde a foto vai");
  assert.equal(moldeDaFotoEscolhida({ modelo: { foto: "nenhuma" }, pessoa: false }), "familia");
});
