// As artes da campanha pelo template do modelo do curso (10/10/2026): a regra
// (projeto e dia), os formatos por rede, as peças de cada dia, a coleta da
// semana, as marcas de espera, a leitura do callback, a decisão da reserva e os
// créditos na legenda. Do lado do worker, o pedido com vários formatos, o canto
// do logo, os créditos por imagem e o acabamento (ffmpeg, sem IA nem rede).
// Nada aqui toca banco, IA, rede ou imagem paga.
// Rodar: npx tsx --test scripts/testes/arte-pelo-modelo-1010.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  adicionarPecas,
  arteDoModeloLigada,
  arteNoModeloDe,
  decidirArtePeloModelo,
  diaVaiPeloModelo,
  formatoNoModelo,
  legendaComCreditos,
  lerCallbackDaArte,
  marcasDoModelo,
  modeloServeParaArte,
  novaColeta,
  pecasDoDiaNoModelo,
  planoDoCallback,
  PRAZO_DA_ARTE_NO_MODELO_MS,
  tetoDoLoteUsd,
  textoDoInfograficoNoModelo,
  type PostDoLote,
} from "@/lib/media/editor-do-curso/arte-pelo-modelo";
import { esperaDaIdentidade, TETO_DA_GERACAO_MS } from "@/lib/modelos-de-arte/espera-da-identidade";

const worker = await import(pathToFileURL(path.resolve("worker/src/modelo/arte-no-modelo.mjs")).href);
const TRACO = /[\u2014\u2013]/;

// ─────────────────────────── a regra ───────────────────────────

test("a trava: só ARTE_PELO_MODELO=1 liga", () => {
  assert.equal(arteDoModeloLigada({}), false);
  assert.equal(arteDoModeloLigada({ ARTE_PELO_MODELO: "0" }), false);
  assert.equal(arteDoModeloLigada({ ARTE_PELO_MODELO: "1" }), true);
});

test("a regra do projeto: modelo que serve, sem estilo próprio, com a trava ligada", () => {
  assert.deepEqual(decidirArtePeloModelo({ ligada: true, modelo: "modelo-manifesto", estiloProprio: false }), { usa: true, modelo: "modelo-manifesto" });
  assert.equal(decidirArtePeloModelo({ ligada: false, modelo: "modelo-manifesto", estiloProprio: false }).usa, false);
  assert.equal(decidirArtePeloModelo({ ligada: true, modelo: null, estiloProprio: false }).usa, false);
  // O cliente que disse "não gostei" e criou o estilo dele: o dele manda.
  const proprio = decidirArtePeloModelo({ ligada: true, modelo: "modelo-manifesto", estiloProprio: true });
  assert.equal(proprio.usa, false);
  assert.match((proprio as { motivo: string }).motivo, /próprio estilo/);
});

test("modelo que pede capturas ou fotos de antes e depois fica no caminho de hoje", () => {
  assert.equal(modeloServeParaArte("modelo-manifesto"), true);
  assert.equal(modeloServeParaArte("modelo-demo"), false, "pede capturas de tela");
  assert.equal(modeloServeParaArte("modelo-transformacao"), false, "pede fotos de antes e depois");
  assert.equal(modeloServeParaArte("modelo-que-nao-existe"), false);
  assert.equal(decidirArtePeloModelo({ ligada: true, modelo: "modelo-demo", estiloProprio: false }).usa, false);
  const lista = [{ id: "m-16x9", formato: "16:9", pede: [], automatico: true }];
  assert.equal(modeloServeParaArte("m-16x9", lista), false, "o template deitado não faz post vertical");
});

test("a regra do dia: foto e carrossel no mestre, infográfico com o projeto no mestre", () => {
  const mestre = { mestre: true, nome: "Estilo mestre" };
  assert.equal(diaVaiPeloModelo({ formato: "image", modeloDoDia: mestre, modo: "mestre", fotosDoDia: 0 }), true);
  assert.equal(diaVaiPeloModelo({ formato: "carousel", modeloDoDia: mestre, modo: "por-post", fotosDoDia: 0 }), true, "a escolha do dia manda");
  assert.equal(diaVaiPeloModelo({ formato: "image", modeloDoDia: { catalogoId: "cartaz" }, modo: "mestre", fotosDoDia: 0 }), false, "modelo do book escolhido para o dia");
  assert.equal(diaVaiPeloModelo({ formato: "image", modeloDoDia: null, modo: "mestre", fotosDoDia: 0 }), true, "sem escolha, o padrão do projeto");
  assert.equal(diaVaiPeloModelo({ formato: "image", modeloDoDia: null, modo: "por-post", fotosDoDia: 0 }), false);
  assert.equal(diaVaiPeloModelo({ formato: "infographic", modeloDoDia: { marca: true }, modo: "mestre", fotosDoDia: 0 }), true);
  assert.equal(diaVaiPeloModelo({ formato: "infographic", modeloDoDia: { marca: true }, modo: "por-post", fotosDoDia: 0 }), false);
  assert.equal(diaVaiPeloModelo({ formato: "image", modeloDoDia: mestre, modo: "mestre", fotosDoDia: 1 }), false, "foto escolhida pela pessoa manda");
  assert.equal(diaVaiPeloModelo({ formato: "text", modeloDoDia: mestre, modo: "mestre", fotosDoDia: 0 }), false);
});

// ─────────────────────────── formatos e peças ───────────────────────────

test("o formato de cada rede no modelo: 4:5 no feed, 9:16 no story, 1:1 nas de paisagem", () => {
  assert.equal(formatoNoModelo("instagram", "image"), "4:5");
  assert.equal(formatoNoModelo("linkedin", "image"), "1:1");
  assert.equal(formatoNoModelo("facebook", "image"), "1:1");
  assert.equal(formatoNoModelo("twitter", "image"), "1:1");
  assert.equal(formatoNoModelo("linkedin", "carousel"), "4:5", "carrossel é 4:5 em todas as redes");
  assert.equal(formatoNoModelo("instagram", "stories"), "9:16");
  assert.equal(formatoNoModelo("instagram", "infographic"), "4:5");
  assert.equal(formatoNoModelo("linkedin", "infographic"), "1:1");
});

test("as peças do dia: a foto é uma peça com um formato por proporção", () => {
  const r = pecasDoDiaNoModelo({ formato: "image", redes: ["instagram", "linkedin", "facebook"], frase: "Grave uma vez e publique a semana inteira" });
  assert.equal(r.pecas.length, 1);
  assert.deepEqual(r.pecas[0], { tipo: "post", texto: "Grave uma vez e publique a semana inteira", formatos: ["4:5", "1:1"] });
  assert.deepEqual(r.formatoDaRede, { instagram: "4:5", linkedin: "1:1", facebook: "1:1" });
  assert.throws(() => pecasDoDiaNoModelo({ formato: "image", redes: ["instagram"], frase: "  " }));
});

test("as peças do dia: o carrossel é a capa e as lâminas, todas em 4:5", () => {
  const r = pecasDoDiaNoModelo({ formato: "carousel", redes: ["instagram", "linkedin"], slides: ["Capa forte", "Lâmina dois", "Lâmina três"] });
  assert.deepEqual(r.pecas.map((p) => p.tipo), ["capa", "lamina", "lamina"]);
  assert.ok(r.pecas.every((p) => p.formatos.length === 1 && p.formatos[0] === "4:5"));
  assert.deepEqual(r.formatoDaRede, { instagram: "4:5", linkedin: "4:5" });
  assert.throws(() => pecasDoDiaNoModelo({ formato: "carousel", redes: ["instagram"], slides: [] }));
});

test("o texto do infográfico: o título sempre, o destaque e os cartões até o teto, sem travessão", () => {
  const conteudo = {
    title: "Volume não é trabalhar mais",
    highlight: { value: "9 horas", label: "por semana em tarefa que não vende" },
    sections: [{ heading: "Grave uma vez" }, { heading: "A IA corta e edita" }, { heading: "Publica nas cinco redes \u2014 sem esforço" }],
  };
  const t = textoDoInfograficoNoModelo(conteudo as never);
  assert.match(t, /^Volume não é trabalhar mais\. 9 horas por semana/);
  assert.match(t, /Grave uma vez\./);
  assert.equal(TRACO.test(t), false);
  const curto = textoDoInfograficoNoModelo(conteudo as never, 8);
  assert.equal(curto, "Volume não é trabalhar mais. Grave uma vez.", "o que não cabe fica de fora, o que cabe entra");
  const r = pecasDoDiaNoModelo({ formato: "infographic", redes: ["instagram", "linkedin"], infografico: conteudo as never });
  assert.equal(r.pecas[0].tipo, "infografico");
  assert.deepEqual(r.pecas[0].formatos, ["4:5", "1:1"]);
});

test("a coleta: índices contínuos, o dia nunca se separa, e o lote cheio abre outro", () => {
  const c = novaColeta("arte-run1", 5);
  const a = adicionarPecas(c, [{ tipo: "post", texto: "a", formatos: ["4:5"] }]);
  const b = adicionarPecas(c, [
    { tipo: "capa", texto: "b", formatos: ["4:5"] },
    { tipo: "lamina", texto: "c", formatos: ["4:5"] },
    { tipo: "lamina", texto: "d", formatos: ["4:5"] },
  ]);
  assert.deepEqual(a, { lote: "arte-run1-1", indices: [1] });
  assert.deepEqual(b, { lote: "arte-run1-1", indices: [2, 3, 4] });
  const d = adicionarPecas(c, [
    { tipo: "capa", texto: "e", formatos: ["4:5"] },
    { tipo: "lamina", texto: "f", formatos: ["4:5"] },
  ]);
  assert.deepEqual(d, { lote: "arte-run1-2", indices: [1, 2] }, "não cabe no primeiro: abre o segundo, com índices dele");
  assert.equal(c.lotes.length, 2);
  assert.throws(() => adicionarPecas(c, []));
  assert.throws(() => adicionarPecas(novaColeta("x", 2), [{ tipo: "post", texto: "1", formatos: ["4:5"] }, { tipo: "post", texto: "2", formatos: ["4:5"] }, { tipo: "post", texto: "3", formatos: ["4:5"] }]));
});

test("o teto de IA do lote: piso de US$ 0,50, teto de US$ 2, e a variável troca a conta", () => {
  assert.equal(tetoDoLoteUsd(1, {}), 0.5);
  assert.equal(tetoDoLoteUsd(6, {}), 1.2);
  assert.equal(tetoDoLoteUsd(20, {}), 2);
  assert.equal(tetoDoLoteUsd(6, { ARTE_PELO_MODELO_TETO_USD: "0.8" }), 0.8);
});

// ─────────────────────────── a espera ───────────────────────────

test("as marcas do modelo usam a espera de sempre, com o prazo do lote", () => {
  const agora = new Date("2026-10-10T12:00:00Z");
  const meta = marcasDoModelo({ frase: "x", arteFalhou: { motivo: "velha" } }, { lote: "arte-run1-1", indices: [2, 3], formato: "4:5", modelo: "modelo-manifesto" }, agora);
  assert.equal(meta.aguardandoIdentidade, true);
  assert.equal("arteFalhou" in meta, false, "a falha antiga não sobrevive");
  const arte = arteNoModeloDe(meta)!;
  assert.deepEqual({ lote: arte.lote, indices: arte.indices, formato: arte.formato, pendente: arte.pendente, origem: arte.origem }, { lote: "arte-run1-1", indices: [2, 3], formato: "4:5", pendente: true, origem: "semana" });
  // O quadro mostra "fazendo" além dos 20 min padrão, até o prazo do lote.
  const depoisDoTeto = new Date(agora.getTime() + TETO_DA_GERACAO_MS + 60_000);
  assert.equal(esperaDaIdentidade({ imageUrl: null, metadata: meta }, depoisDoTeto)?.estado, "gerando");
  const depoisDoPrazo = new Date(agora.getTime() + PRAZO_DA_ARTE_NO_MODELO_MS + 1);
  assert.equal(esperaDaIdentidade({ imageUrl: null, metadata: meta }, depoisDoPrazo)?.estado, "falhou");
  assert.equal(esperaDaIdentidade({ imageUrl: "https://x/a.jpg", metadata: meta }), null, "com a arte, nada a esperar");
});

// ─────────────────────────── o callback ───────────────────────────

const URL_ = (n: string) => `https://blob.exemplo/artes-no-modelo/arte-run1-1/${n}.jpg`;

test("ler o callback: sem o lote de volta não serve; peça torta é descartada", () => {
  assert.equal(lerCallbackDaArte(null), null);
  assert.equal(lerCallbackDaArte({ ok: true, pecas: [] }), null);
  const cb = lerCallbackDaArte({
    ok: true,
    custoUsd: 0.4123456,
    pecas: [
      { indice: 1, url: URL_("p1-4x5"), formato: "4:5", creditos: ["Imagem: x", 3, ""] },
      { indice: 1, url: "http://inseguro/p1.jpg", formato: "1:1" },
      { indice: 0, url: URL_("p0"), formato: "4:5" },
      { indice: 2, url: URL_("p2"), formato: "2:3" },
    ],
    retorno: { lote: "arte-run1-1", projectId: "proj1" },
  })!;
  assert.equal(cb.ok, true);
  assert.equal(cb.lote, "arte-run1-1");
  assert.equal(cb.projectId, "proj1");
  assert.equal(cb.custoUsd, 0.4123);
  assert.deepEqual(cb.pecas, [{ indice: 1, url: URL_("p1-4x5"), formato: "4:5", creditos: ["Imagem: x"] }]);
});

test("ler o callback: reinício e lote sem peça não são ok", () => {
  const reinicio = lerCallbackDaArte({ ok: false, reiniciado: true, erro: "reiniciado", retorno: { lote: "l" } })!;
  assert.equal(reinicio.ok, false);
  assert.equal(reinicio.reiniciado, true);
  const vazio = lerCallbackDaArte({ ok: true, pecas: [], retorno: { lote: "l" } })!;
  assert.equal(vazio.ok, false);
  assert.match(vazio.erro!, /nenhuma peça/);
  const falha = lerCallbackDaArte({ ok: false, erro: "o plano das peças não passou em 3 voltas", retorno: { lote: "l" } })!;
  assert.equal(falha.erro, "o plano das peças não passou em 3 voltas");
});

function post(id: string, platform: string, mediaType: string, dia: number, meta: Record<string, unknown>, imageUrl: string | null = null): PostDoLote {
  return { id, platform, mediaType, imageUrl, runId: "run1", dayOfWeek: dia, metadata: meta };
}
const marcas = (indices: number[], formato: "4:5" | "1:1", lote = "arte-run1-1") => marcasDoModelo({}, { lote, indices, formato, modelo: "modelo-manifesto" });

test("o callback nos posts: cada rede com o seu formato, o carrossel com as lâminas em ordem", () => {
  const posts = [
    post("ig-foto", "instagram", "image", 2, marcas([1], "4:5")),
    post("li-foto", "linkedin", "image", 2, marcas([1], "1:1")),
    post("ig-car", "instagram", "carousel", 6, marcas([2, 3, 4], "4:5")),
    post("li-car", "linkedin", "carousel", 6, marcas([2, 3, 4], "4:5")),
  ];
  const cb = lerCallbackDaArte({
    ok: true,
    pecas: [
      { indice: 1, url: URL_("1-4x5"), formato: "4:5", creditos: ["Imagem: \"Mesa\", de Ana (CC BY 4.0), via Wikimedia Commons: https://x/mesa"] },
      { indice: 1, url: URL_("1-1x1"), formato: "1:1", creditos: [] },
      { indice: 4, url: URL_("4"), formato: "4:5" },
      { indice: 2, url: URL_("2"), formato: "4:5" },
      { indice: 3, url: URL_("3"), formato: "4:5" },
    ],
    retorno: { lote: "arte-run1-1" },
  })!;
  const plano = planoDoCallback(posts, cb);
  assert.deepEqual(plano.reserva, []);
  const por = Object.fromEntries(plano.preencher.map((p) => [p.postId, p]));
  assert.equal(por["ig-foto"].imageUrl, URL_("1-4x5"));
  assert.equal(por["li-foto"].imageUrl, URL_("1-1x1"));
  assert.equal(por["ig-car"].imageUrl, [URL_("2"), URL_("3"), URL_("4")].join("|"));
  assert.equal(por["li-car"].imageUrl, por["ig-car"].imageUrl);
  assert.equal(por["ig-foto"].creditos.length, 1);
  assert.deepEqual(por["li-foto"].creditos, []);
});

test("a reserva é por dia: faltou uma lâmina, o carrossel inteiro vai pelo caminho de hoje", () => {
  const posts = [
    post("ig-foto", "instagram", "image", 2, marcas([1], "4:5")),
    post("ig-car", "instagram", "carousel", 6, marcas([2, 3, 4], "4:5")),
    post("li-car", "linkedin", "carousel", 6, marcas([2, 3, 4], "4:5")),
  ];
  const cb = lerCallbackDaArte({ ok: true, pecas: [{ indice: 1, url: URL_("1"), formato: "4:5" }, { indice: 2, url: URL_("2"), formato: "4:5" }, { indice: 4, url: URL_("4"), formato: "4:5" }], retorno: { lote: "arte-run1-1" } })!;
  const plano = planoDoCallback(posts, cb);
  assert.deepEqual(plano.preencher.map((p) => p.postId), ["ig-foto"]);
  assert.equal(plano.reserva.length, 1);
  assert.deepEqual(plano.reserva[0].postIds.sort(), ["ig-car", "li-car"]);
  assert.match(plano.reserva[0].motivo, /faltou a peça 3/);
});

test("a reserva por formato: a foto sem o 1:1 leva as duas redes do dia para o caminho de hoje", () => {
  const posts = [post("ig", "instagram", "image", 2, marcas([1], "4:5")), post("li", "linkedin", "image", 2, marcas([1], "1:1"))];
  const cb = lerCallbackDaArte({ ok: true, pecas: [{ indice: 1, url: URL_("1"), formato: "4:5" }], retorno: { lote: "arte-run1-1" } })!;
  const plano = planoDoCallback(posts, cb);
  assert.deepEqual(plano.preencher, []);
  assert.deepEqual(plano.reserva[0].postIds.sort(), ["ig", "li"]);
});

test("lote que falhou: todo post pendente vai para a reserva; o que já não espera é ignorado", () => {
  const naReserva = marcas([1], "4:5");
  (naReserva.arteNoModelo as Record<string, unknown>).reserva = "já foi";
  const posts = [
    post("a", "instagram", "image", 2, marcas([1], "4:5")),
    post("b", "instagram", "image", 3, marcas([2], "4:5")),
    post("com-arte", "instagram", "image", 4, marcas([3], "4:5"), "https://x/ja.jpg"),
    post("outro-lote", "instagram", "image", 5, marcas([1], "4:5", "arte-run1-2")),
    post("ja-na-reserva", "instagram", "image", 6, naReserva),
    post("sem-marca", "instagram", "image", 7, {}),
  ];
  const cb = lerCallbackDaArte({ ok: false, erro: "o render dos quadros das peças falhou", retorno: { lote: "arte-run1-1" } })!;
  const plano = planoDoCallback(posts, cb);
  assert.deepEqual(plano.preencher, []);
  assert.deepEqual(plano.reserva.map((r) => r.postIds).flat().sort(), ["a", "b"]);
  assert.ok(plano.reserva.every((r) => r.motivo === "o render dos quadros das peças falhou"));
  assert.deepEqual(plano.ignorados.sort(), ["com-arte", "ja-na-reserva", "outro-lote", "sem-marca"]);
});

// ─────────────────────────── os créditos ───────────────────────────

test("os créditos na legenda: uma linha, várias, sem repetir, e compactos no X", () => {
  assert.equal(legendaComCreditos("Texto.", [], "instagram"), "Texto.");
  const um = legendaComCreditos("Texto.", ["Imagem: \"Mesa\", de Ana (CC BY 4.0), via Wikimedia Commons: https://x/mesa"], "instagram");
  assert.equal(um, "Texto.\n\nCrédito da imagem: \"Mesa\", de Ana (CC BY 4.0), via Wikimedia Commons: https://x/mesa");
  assert.equal(legendaComCreditos(um, ["Imagem: \"Mesa\", de Ana (CC BY 4.0), via Wikimedia Commons: https://x/mesa"], "instagram"), um, "não repete");
  const dois = legendaComCreditos("Texto.", ["Imagem: a, via Pexels: https://p/1", "Imagem: b, via Pixabay: https://p/2", "Imagem: a, via Pexels: https://p/1"], "linkedin");
  assert.equal(dois, "Texto.\n\nCréditos das imagens:\n- a, via Pexels: https://p/1\n- b, via Pixabay: https://p/2");
  assert.equal(legendaComCreditos("Curto.", ["Imagem: a, via Pexels: https://p/1"], "twitter"), "Curto.\n\nCréditos: https://p/1");
  assert.equal(TRACO.test(legendaComCreditos("T", ["Imagem: a \u2014 b"], "instagram")), false);
});

// ─────────────────────────── o worker ───────────────────────────

test("worker: o pedido aceita vários formatos por peça e cai no 4:5 sem nenhum válido", () => {
  const pecas = worker.validarPedido({ modelo: "modelo-manifesto", pecas: [{ tipo: "post", texto: "a  b", formatos: ["4:5", "1:1", "4:5", "16:9"] }, { tipo: "capa", texto: "c", formato: "9:16" }, { tipo: "lamina", texto: "d" }] });
  assert.deepEqual(pecas.map((p: { formatos: string[] }) => p.formatos), [["4:5", "1:1"], ["9:16"], ["4:5"]]);
  assert.equal(pecas[0].texto, "a b");
  assert.throws(() => worker.validarPedido({ modelo: "x", pecas: [{ tipo: "story", texto: "a" }] }));
  assert.throws(() => worker.validarPedido({ modelo: "x", pecas: Array.from({ length: 11 }, () => ({ tipo: "post", texto: "a" })) }));
});

test("worker: o prazo cresce com as imagens que saem", () => {
  assert.equal(worker.prazoDaArteMs({ pecas: [{ formatos: ["4:5"] }] }), (20 + 3 + 45) * 60_000);
  assert.equal(worker.prazoDaArteMs({ pecas: [{ formatos: ["4:5", "1:1"] }, { formatos: ["4:5"] }] }), (20 + 9 + 45) * 60_000);
});

test("worker: a caixa de cada canto e a luminância", () => {
  assert.deepEqual(worker.caixaDoCanto("inferior-direito", 1080, 1350, 200, 80, 56), { x: 824, y: 1214, w: 200, h: 80 });
  assert.deepEqual(worker.caixaDoCanto("superior-esquerdo", 1080, 1350, 200, 80, 56), { x: 56, y: 56, w: 200, h: 80 });
  assert.ok(worker.luminancia([0, 0, 0]) < 0.01);
  assert.ok(worker.luminancia([255, 255, 255]) > 0.99);
});

test("worker: os créditos das fotos de banco por imagem do momento", () => {
  assert.equal(worker.linhaDeCredito({ fonte: "Openverse/Wikimedia Commons", titulo: "Mesa", autor: "Ana", licenca: "CC BY 4.0", credito: true, link: "https://x/mesa" }), 'Imagem: "Mesa", de Ana (CC BY 4.0), via Wikimedia Commons: https://x/mesa');
  assert.match(worker.linhaDeCredito({ fonte: "Pexels", titulo: "", autor: "Rui", licenca: "Pexels", credito: false, link: "https://pexels.com/p/1" }), /^Imagem: de Rui \(Pexels\), via Pexels: https:\/\/pexels.com\/p\/1$/);
  assert.equal(worker.linhaDeCredito({ fonte: "sua pasta (imagens/)", licenca: "do aluno" }), null);
  assert.equal(worker.linhaDeCredito({ sem: true }), null);
  assert.equal(worker.linhaDeCredito({ fonte: "gerada", licenca: "CC0", credito: false }), null);
  assert.deepEqual(worker.idsDeImagemNoMomento({ tipo: "cartaz", imagem: { id: "mesa", efeito: "zoom" }, itens: [{ foto: "cafe" }, "texto"] }, ["mesa", "cafe", "outra"]).sort(), ["cafe", "mesa"]);
});

test("worker: a conferência das peças cobra o % e o R$ do número (a capa \"35% dos donos\" saiu \"35 dos donos\")", () => {
  const momento = { tipo: "cartaz", numero: { valor: 35 }, texto: ["DOS DONOS DE NEGÓCIO", "ADIAM MARKETING"] };
  assert.deepEqual(worker.palavrasQueFaltam(momento, "35% dos donos de negócio adiam marketing"), ["%"]);
  assert.deepEqual(worker.palavrasQueFaltam({ ...momento, numero: { valor: 35, sufixo: "%" } }, "35% dos donos de negócio adiam marketing"), []);
  assert.deepEqual(worker.palavrasQueFaltam({ tipo: "frase", texto: "35 por cento dos donos" }, "35% dos donos"), []);
  assert.deepEqual(worker.palavrasQueFaltam({ tipo: "frase", texto: "custa 97 por mês" }, "custa R$ 97 por mês"), ["R$"]);
  assert.equal(worker.RESERVA_DO_LOGO, 56 + 84 + 24);
});

test("worker: no Manifesto, número com símbolo na palavra-janela reprova (o template limpa a janela)", () => {
  // O momento real da prova integrada: "35%" na janela saiu "35" na capa.
  const plano = { momentos: [{ tipo: "abertura", de: 0, ate: 7.8, em: 0.4, texto: "35% dos donos de negócio adiam marketing", janela: "35%" }] };
  const pecas = [{ indice: 1, tipo: "capa", texto: "35% dos donos de negócio adiam marketing", de: 0, ate: 7.8, primeiraEm: 0.4, ultimaAte: 5.5 }];
  const erros = worker.conferirPecas(plano, pecas, "modelo-manifesto");
  assert.equal(erros.length, 1);
  assert.match(erros[0], /palavra-janela "35%" tem símbolo/);
  assert.deepEqual(worker.conferirPecas(plano, pecas, "modelo-viral"), [], "a regra é do template do Manifesto");
  const semSimbolo = { momentos: [{ ...plano.momentos[0], janela: "donos" }] };
  assert.deepEqual(worker.conferirPecas(semSimbolo, pecas, "modelo-manifesto"), []);
  const emLinhas = { momentos: [{ ...plano.momentos[0], janela: { em: 1, linhas: ["R$", "97"] } }] };
  assert.equal(worker.conferirPecas(emLinhas, pecas, "modelo-manifesto").length, 1);
});

const temFfmpeg = spawnSync(process.env.FFMPEG_BIN ?? "ffmpeg", ["-version"]).status === 0;

test("worker: a recomposição deixa a base livre para o logo quando a peça leva logo", { skip: !temFfmpeg && "sem ffmpeg" }, async () => {
  const pasta = mkdtempSync(path.join(tmpdir(), "arte-base-"));
  try {
    const ff = (args: string[]) => assert.equal(spawnSync(process.env.FFMPEG_BIN ?? "ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]).status, 0);
    // O quadro do template: fundo liso, o letreiro fino no alto e um corpo alto, que não cabe no 4:5.
    const quadro = path.join(pasta, "quadro.png");
    ff(["-f", "lavfi", "-i", "color=c=0x101010:s=1080x1920", "-vf", "drawbox=x=60:y=80:w=960:h=30:color=white@1:t=fill,drawbox=x=100:y=300:w=880:h=1400:color=0xf97316@1:t=fill", "-frames:v", "1", quadro]);
    const sem = path.join(pasta, "sem.png");
    const com = path.join(pasta, "com.png");
    await worker.noFormato(quadro, "4:5", sem, {});
    await worker.noFormato(quadro, "4:5", com, { reservaDaBase: worker.RESERVA_DO_LOGO });
    const caixa = { w: 120, h: 84 };
    assert.equal(await worker.cantoLivre(sem, 1080, 1350, caixa.w, caixa.h), null, "sem a reserva, o corpo reduzido ocupa a base e o alto tem o letreiro");
    const livre = await worker.cantoLivre(com, 1080, 1350, caixa.w, caixa.h);
    assert.ok(livre && livre.canto.startsWith("inferior"), "com a reserva, um canto de baixo fica livre");
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});

test("worker: o logo vai para o canto livre, na pastilha quando o fundo é escuro", { skip: !temFfmpeg && "sem ffmpeg" }, async () => {
  const pasta = mkdtempSync(path.join(tmpdir(), "arte-logo-"));
  try {
    const ff = (args: string[]) => assert.equal(spawnSync(process.env.FFMPEG_BIN ?? "ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]).status, 0);
    // A peça: fundo azul-escuro liso, um bloco de "texto" claro no alto e um no canto de baixo à direita.
    const peca = path.join(pasta, "peca.png");
    ff(["-f", "lavfi", "-i", "color=c=0x1a2b6d:s=1080x1350", "-vf", "drawbox=x=100:y=200:w=880:h=400:color=white@1:t=fill,drawbox=x=800:y=1180:w=240:h=130:color=white@1:t=fill", "-frames:v", "1", peca]);
    // O logo (a pastilha é o logo numa caixa branca).
    const logo = path.join(pasta, "logo.png");
    ff(["-f", "lavfi", "-i", "color=c=0xff6600:s=480x240", "-frames:v", "1", logo]);
    const pastilha = path.join(pasta, "pastilha.png");
    ff(["-f", "lavfi", "-i", "color=c=0xffffff:s=614x374", "-frames:v", "1", pastilha]);
    const saida = path.join(pasta, "peca.jpg");
    const r = await worker.acabarPeca(peca, saida, { logo: { claro: logo, proporcao: 2, pastilha, proporcaoDaPastilha: 614 / 374 } });
    assert.equal(r.formato, "jpeg");
    assert.equal(r.logo?.canto, "inferior-esquerdo", "o inferior direito tem desenho; vai para o próximo livre");
    assert.equal(r.logo?.pastilha, true, "fundo escuro: a pastilha clara");
    // Todos os cantos ocupados: sem logo, nunca por cima do desenho.
    const cheia = path.join(pasta, "cheia.png");
    ff(["-f", "lavfi", "-i", "testsrc2=s=1080x1350", "-frames:v", "1", cheia]);
    const r2 = await worker.acabarPeca(cheia, path.join(pasta, "cheia.jpg"), { logo: { claro: logo, proporcao: 2, pastilha: null, proporcaoDaPastilha: null } });
    assert.equal(r2.logo, null);
    assert.equal(r2.semCantoLivre, true);
    // Sem logo: só o JPEG.
    const r3 = await worker.acabarPeca(peca, path.join(pasta, "so.jpg"));
    assert.deepEqual(r3, { logo: null, formato: "jpeg" });
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});
