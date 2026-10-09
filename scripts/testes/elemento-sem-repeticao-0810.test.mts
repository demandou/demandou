// O MESMO ELEMENTO NÃO VOLTA EM DUAS PEÇAS DA CAMPANHA (08/10/2026, noite).
// A queixa do Bruno: "as últimas artes todas que foram geradas para a Demandou
// vieram com um ring light. Uma imagem é legal, mas 7 posts com a mesma arte?
// Inaceitável." E, no post único com o estilo criado por voz: "ele não está
// respeitando as escolhas do usuário". Aqui: o estilo entra só como
// linguagem, o estilo escolhido para o post manda, duas peças com o mesmo
// elemento central são vetadas pelo JEV (simulado) e pela regra, e o veto
// nunca derruba a peça (reescreve uma vez e segue). Sem banco, IA ou imagem.
// Rodar: npx tsx --test scripts/testes/elemento-sem-repeticao-0810.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ElementosDaCampanha,
  cenaMostraElemento,
  elementoParaGravar,
  elementosDoMetadata,
  estiloComoLinguagem,
  lerCenaComElemento,
  mesmoElemento,
  metadataDoElemento,
  palavrasDoElemento,
  pedidoDeReescrita,
  registrarElementoDaPeca,
  repeticaoPelaRegra,
  semDuplicados,
  usadosEmTexto,
  type CenaComElemento,
  type ElementoUsado,
} from "@/lib/media/elemento-sem-repeticao";
import { SETORES, identidadeDe, setorEmIngles } from "@/lib/media/identidade-visual";
import { direcaoComEstiloDoPost, mundoDaDirecao, type DirecaoDaPeca } from "@/lib/media/direcao-de-arte";
import { marcaDaIdentidade, pedidoDaCena, promptDaArteSemTexto, lookSemTexto } from "@/lib/media/arte-com-frase";
import { estiloNaManchete } from "@/lib/media/peca-de-feed";
import { estiloPedeFigurasPelaRegra } from "@/lib/squad/coerencia-da-arte";

const fonte = (caminho: string) => readFileSync(new URL(`../../${caminho}`, import.meta.url), "utf8");

const RING: CenaComElemento = { cena: "A switched-off ring light on a tripod in a dim creator studio, a camera beside it, cold window light.", elemento: "ring light on tripod", cenario: "creator studio" };
const RELOGIO: CenaComElemento = { cena: "A wall clock whose hands are replaced by a phone and a pen, on a plain wall of a small sales office, morning light.", elemento: "wall clock with phone hands", cenario: "small sales office" };
const CHAVE: CenaComElemento = { cena: "A single house key on a signed contract, warm daylight on a wooden desk.", elemento: "house key on contract", cenario: "wooden desk by a window" };

// ─── a guarda pura ───

test("a regra: o mesmo objeto com outras palavras é o mesmo elemento; objeto diferente não é", () => {
  assert.ok(mesmoElemento("ring light", "a switched-off ring light on a tripod"));
  assert.ok(mesmoElemento("Ring Lights", "ring light"));
  assert.ok(!mesmoElemento("paper plane", "paper boat"));
  assert.ok(!mesmoElemento("house key on contract", "wall clock with phone hands"));
  assert.deepEqual(palavrasDoElemento("a switched-off ring light"), ["ring", "light"]);
  // O elemento de outra peça aparecendo como detalhe na cena nova também é repetição.
  assert.ok(cenaMostraElemento("A phone on a desk beside a switched-off ring light, moody.", "ring light"));
  assert.ok(!cenaMostraElemento("A phone on a desk under a soft light.", "ring light"));
  // Palavra solta ("light") não veta nada sozinha.
  assert.ok(!cenaMostraElemento("A phone on a desk under a soft light.", "light"));
});

test("a regra: duas peças com o mesmo elemento central (ou o elemento virando cenário) são vetadas", () => {
  const usados: ElementoUsado[] = [{ ...RING, peca: "quinta, imagem" }];
  const veto = repeticaoPelaRegra({ cena: "A ring light glowing in an empty studio.", elemento: "glowing ring light", cenario: "empty studio" }, usados);
  assert.equal(veto?.campo, "elemento");
  assert.equal(veto?.usado.peca, "quinta, imagem");
  // O cenário igual veta pelo cenário.
  const soCenario = repeticaoPelaRegra({ cena: "A tripod camera facing a chair, in a creator studio.", elemento: "camera facing empty chair", cenario: "creator studio" }, usados);
  assert.equal(soCenario?.campo, "cenario");
  // Elemento e cenário diferentes passam.
  assert.equal(repeticaoPelaRegra(RELOGIO, usados), null);
});

test("a lista do que já foi usado e o pedido de reescrita trocam SÓ o campo vetado", () => {
  const usados: ElementoUsado[] = [{ ...RING, peca: "quinta, imagem" }];
  const texto = usadosEmTexto(usados);
  assert.match(texto, /ALREADY USED/);
  assert.match(texto, /ring light on tripod, in creator studio \(quinta, imagem\)/);
  const pedido = pedidoDeReescrita({ cena: "x", elemento: "ring light", cenario: "garage" }, { campo: "elemento", usado: usados[0], por: "jev" }, usados);
  assert.match(pedido, /Rewrite ONLY the central element/);
  assert.match(pedido, /keep the idea, the light, the lens and the mood/);
  assert.ok(!/Rewrite ONLY the setting/.test(pedido));
});

test("a leitura da resposta do redator: JSON com elemento e cenário, ou texto solto só com a cena", () => {
  const lida = lerCenaComElemento('```json\n{"cena":"A key on a desk.","elemento":"house key","cenario":"wooden desk"}\n```');
  assert.deepEqual(lida, { cena: "A key on a desk.", elemento: "house key", cenario: "wooden desk" });
  assert.deepEqual(lerCenaComElemento("A key on a desk, warm light."), { cena: "A key on a desk, warm light.", elemento: "", cenario: "" });
  assert.equal(lerCenaComElemento("   "), null);
});

// ─── a guarda da campanha, com o JEV e o redator simulados ───

test("duas peças com o mesmo elemento: o JEV veta a segunda, o redator reescreve só o elemento, e a peça segue", async () => {
  const perguntas: Array<{ nova: CenaComElemento; usados: number }> = [];
  const jev = async (nova: CenaComElemento, usados: ElementoUsado[]) => {
    perguntas.push({ nova, usados: usados.length });
    return usados.some((u) => mesmoElemento(u.elemento, nova.elemento)) ? { campo: "elemento" as const } : null;
  };
  const guarda = new ElementosDaCampanha([], jev);
  const reescritas: string[] = [];
  const reescrever = async (atual: CenaComElemento, veto: { campo: string }, usados: ElementoUsado[]) => {
    reescritas.push(`${atual.elemento} -> ${veto.campo} (${usados.length} usados)`);
    return RELOGIO;
  };
  const a = await guarda.garantir("quinta", async () => RING, reescrever);
  const b = await guarda.garantir("sexta, lâmina 1", async (usados) => {
    assert.equal(usados.length, 1, "a segunda peça escreve sabendo o que a primeira usou");
    return { ...RING, cena: "The same ring light, now glowing." };
  }, reescrever);
  assert.equal(a.veto, null);
  assert.equal(b.veto?.campo, "elemento");
  assert.equal(b.veto?.por, "jev");
  assert.equal(b.reescrita, true);
  assert.equal(b.seguiuRepetida, false);
  assert.equal(b.cena.elemento, RELOGIO.elemento);
  assert.deepEqual(reescritas, ["ring light on tripod -> elemento (1 usados)"]);
  // A semana registra as duas, com os elementos finais.
  assert.deepEqual(guarda.usados().map((u) => u.elemento), [RING.elemento, RELOGIO.elemento]);
  // A primeira peça não foi ao JEV (nada usado ainda); a segunda foi duas vezes: o veto e a conferência da reescrita.
  assert.equal(perguntas.length, 2);
  assert.equal(perguntas[1].nova.elemento, RELOGIO.elemento);
});

test("o veto nunca derruba a peça: a reescrita que falha, ou que ainda repete, segue com aviso e a peça sai", async () => {
  const guarda = new ElementosDaCampanha([{ ...RING, peca: "campanha de 06/10" }]);
  // Sem JEV (decisor ausente): a regra pura veta, a reescrita falha, a peça segue com a primeira cena.
  const r = await guarda.garantir("quinta", async () => ({ ...RING, cena: "Ring light again." }), async () => {
    throw new Error("o redator caiu");
  });
  assert.equal(r.veto?.por, "regra");
  assert.equal(r.reescrita, false);
  assert.equal(r.seguiuRepetida, true);
  assert.equal(r.cena.cena, "Ring light again.");
  // A reescrita que ainda repete: reescrita uma vez só, segue marcada.
  const guarda2 = new ElementosDaCampanha([{ ...RING, peca: "campanha de 06/10" }]);
  let vezes = 0;
  const r2 = await guarda2.garantir("sexta", async () => RING, async () => {
    vezes++;
    return { ...RING, cena: "Still the ring light." };
  });
  assert.equal(vezes, 1);
  assert.equal(r2.reescrita, true);
  assert.equal(r2.seguiuRepetida, true);
  assert.equal(r2.cena.cena, "Still the ring light.");
});

test("peças escritas em paralelo passam pela fila: a mesma peça pedida duas vezes (duas proporções) paga uma escrita só", async () => {
  const guarda = new ElementosDaCampanha([]);
  let escritas = 0;
  const escrever = async () => {
    escritas++;
    return CHAVE;
  };
  const semReescrita = async (a: CenaComElemento) => a;
  const [x, y, z] = await Promise.all([
    guarda.garantir("quinta", escrever, semReescrita),
    guarda.garantir("quinta", escrever, semReescrita),
    guarda.garantir("sexta, lâmina 1", async () => RELOGIO, semReescrita),
  ]);
  assert.equal(escritas, 1);
  assert.equal(x, y);
  assert.equal(z.veto, null);
  assert.equal(guarda.usados().length, 2);
});

test("o que já foi usado nas últimas campanhas entra pela memória do post, sem duplicar as cópias por rede", () => {
  const meta = { elementoDaArte: { elemento: "ring light on tripod", cenario: "creator studio" } };
  const laminas = { elementosDasLaminas: [{ elemento: "paper planes", cenario: "white wall" }, { elemento: "", cenario: "" }, { elemento: "camera on tripod", cenario: "sunset window" }] };
  const lidos = [...elementosDoMetadata(meta, "campanha de 06/10"), ...elementosDoMetadata(meta, "campanha de 06/10"), ...elementosDoMetadata(laminas, "campanha de 06/10")];
  assert.equal(lidos.length, 4);
  const unicos = semDuplicados(lidos);
  assert.deepEqual(unicos.map((u) => u.peca), ["campanha de 06/10", "campanha de 06/10, lâmina 1", "campanha de 06/10, lâmina 3"]);
  assert.equal(elementosDoMetadata(null, "x").length, 0);
  assert.equal(elementoParaGravar({ elemento: " ", cenario: "" }), null);
  // O registro pela frase, como a foto da peça: quem grava o post pergunta.
  registrarElementoDaPeca("Tempo gasto com postagem, zero tempo para vender", RELOGIO);
  registrarElementoDaPeca("Grave uma vez", CHAVE);
  assert.deepEqual(metadataDoElemento(["Tempo gasto com postagem, zero tempo para vender"]), { elementoDaArte: { elemento: RELOGIO.elemento, cenario: RELOGIO.cenario } });
  assert.deepEqual(metadataDoElemento(["Grave uma vez", "sem registro"]).elementosDasLaminas, [{ elemento: CHAVE.elemento, cenario: CHAVE.cenario }, { elemento: "", cenario: "" }]);
  assert.deepEqual(metadataDoElemento(["nada"]), {});
});

// ─── o estilo entra só como linguagem ───

test("a lista fixa de objetos por setor saiu: o setor dá o ramo, a luz e o que evitar, nunca o ring light", () => {
  for (const s of SETORES) assert.ok(!("mundo" in s), `o setor ${s.id} ainda tem a lista de objetos`);
  const texto = fonte("lib/media/identidade-visual.ts");
  assert.ok(!/ring light/i.test(texto.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "")), "o ring light ainda está em código vivo da identidade");
  assert.equal(setorEmIngles("marketing"), "content creation and marketing");
  assert.equal(setorEmIngles("inexistente"), "business");
  const mundo = mundoDaDirecao("marketing");
  assert.match(mundo, /^CLIENT'S WORLD: /);
  assert.match(mundo, /content creation and marketing/);
  assert.ok(!/ring|tripod|microphone|sticky/.test(mundo));
  assert.equal(mundo.indexOf("."), mundo.length - 1, "uma frase só: lookSemTexto tira até o primeiro ponto");
  assert.ok(!/CLIENT'S WORLD/.test(lookSemTexto(`Bold look. ${mundo}`)));
});

test("o pedido ao redator da cena leva o ramo, o estilo como linguagem e o que já foi usado; nunca uma lista de objetos", async () => {
  const identidade = await identidadeDe({ name: "Demandou", niche: "autoridade e presença digital, marketing de conteúdo", colorPalette: "#F97316,#1e1f22,#dbdee1" });
  assert.equal(identidade.setor.id, "marketing");
  const estilo = "High-retention viral treatment: bright, saturated. CLIENT'S WORLD: the brand works in content creation and marketing; the central element comes from the content.";
  const pedido = pedidoDaCena({ frase: "Tempo gasto com postagem, zero tempo para vender", nicho: "marketing", identidade, estilo, usados: [{ ...RING, peca: "campanha de 06/10" }] });
  assert.match(pedido, /Sector: content creation and marketing/);
  assert.match(pedido, /never from a stock prop of the sector/);
  assert.match(pedido, /VISUAL LANGUAGE \(only how the image looks/);
  assert.match(pedido, /ALREADY USED/);
  assert.match(pedido, /People: none in the scene/);
  assert.ok(!/CLIENT'S WORLD/.test(pedido), "a marca do mundo não vai ao redator");
  assert.ok(!/ring light on tripod[^\n]*\n[^A]/.test(pedido.split("ALREADY USED")[0]), "o ring light só aparece na lista do que não pode");
  // O estilo escolhido para o post manda na aparência e pode pedir figuras.
  const doPost = pedidoDaCena({ frase: "Antes de falar, ela abre seu perfil", identidade, estilo: "Stylized silhouettes of professionals walking through a tech environment, an open laptop", estiloDoPost: true, pessoas: true });
  assert.match(doPost, /THE STYLE THE CLIENT CHOSE FOR THIS POST/);
  assert.match(doPost, /People: only as the chosen style describes them/);
  // A manchete da esteira e o roteiro do carrossel recebem o mesmo tratamento.
  const naManchete = estiloNaManchete(estilo);
  assert.match(naManchete, /VISUAL LANGUAGE/);
  assert.match(naManchete, /CLIENT'S WORLD: the brand works in content creation/);
  assert.match(estiloComoLinguagem(estilo, { escolhidoParaOPost: true }), /^THE STYLE THE CLIENT CHOSE/);
  assert.equal(estiloComoLinguagem(""), "");
});

test("o estilo escolhido para o post manda na direção de arte, por cima do estilo da janela e da linguagem do vídeo", () => {
  const base: DirecaoDaPeca = {
    estilo: { id: "colagem-realista", nome: "Colagem com foto real", prompt: "Photographic collage", serveParaInfografico: true },
    paleta: "Brand colours to lean toward: vivid orange.",
    styleHint: "Photographic collage Brand colours to lean toward: vivid orange. CLIENT'S WORLD: x.",
    mundo: "CLIENT'S WORLD: x.",
    origem: "campanha",
    visualStyle: "photorealistic",
    resumo: "estilo escolhido na campanha, Colagem com foto real. Identidade: setor marketing",
  };
  const linguagem = "Wide editorial composition featuring stylized silhouettes of professionals walking through a modern tech-inspired environment, an open laptop in the foreground.";
  const d = direcaoComEstiloDoPost(base, { nome: "Agentes Tecnológicos em Movimento", linguagem });
  assert.equal(d.origem, "estilo-do-post");
  assert.equal(d.estilo.id, "estilo-do-post");
  assert.ok(d.styleHint.startsWith(linguagem));
  assert.ok(!/Photographic collage/.test(d.styleHint), "o estilo da janela saiu do caminho");
  assert.match(d.styleHint, /CLIENT'S WORLD: x\./);
  assert.match(d.resumo, /o estilo escolhido para este post, "Agentes Tecnológicos em Movimento"\. Identidade: setor marketing/);
  // Sem estilo do post, a direção fica como estava.
  assert.equal(direcaoComEstiloDoPost(base, null), base);
  assert.equal(direcaoComEstiloDoPost(base, { nome: "vazio", linguagem: "  " }), base);
});

test("o prompt da arte: o estilo do post entra no look, as figuras que ele pede deixam de ser gente proibida, e a lista 'cadeira vazia' saiu", async () => {
  const identidade = await identidadeDe({ name: "Demandou", niche: "marketing de conteúdo", colorPalette: "#F97316,#1e1f22,#dbdee1" });
  const marca = marcaDaIdentidade(identidade);
  const linguagem = "Stylized silhouettes of professionals walking through a modern tech-inspired environment, soft digital glow, photorealistic render";
  const semEstilo = promptDaArteSemTexto({ visual: "A house key on a contract.", estilo: "Photographic collage, editorial.", marca, frase: "x" });
  assert.match(semEstilo, /no people \(if the idea needs them/);
  assert.ok(!/empty chair|coat on a hook/.test(semEstilo));
  const comEstilo = promptDaArteSemTexto({ visual: "A house key on a contract.", estilo: "Photographic collage, editorial.", marca: { ...marca, estiloDoPost: { nome: "Agentes", linguagem, pedeFiguras: true } }, frase: "x" });
  assert.match(comEstilo, /people only as the chosen style describes them/);
  assert.match(comEstilo, /walking through a modern tech-inspired environment/);
  assert.ok(!/Photographic collage/.test(comEstilo), "o estilo da janela não concorre com o do post");
  // Quem decide figuras sem o JEV: a leitura das palavras.
  assert.equal(estiloPedeFigurasPelaRegra(linguagem), true);
  assert.equal(estiloPedeFigurasPelaRegra("Clean product photography, no people, soft light"), false);
  assert.equal(estiloPedeFigurasPelaRegra("Flat vector illustration of objects"), false);
});

test("a esteira e a semana do vídeo passam pela guarda, e a conferência deixa passar as figuras do estilo", () => {
  const esteira = fonte("lib/pipeline/executar.ts");
  assert.ok(esteira.includes("direcaoComEstiloDoPost(direcaoDoProjeto, marcaDaPeca.estiloDoPost)"));
  assert.ok(esteira.includes("peca.visual = await cenaDaPecaGarantida(peca.manchete, peca.visual, peca.elemento, peca.cenario);"));
  assert.ok(esteira.includes("const roteiro = await roteiroGarantido({ runId, projectId: project.id, dia: dayName, roteiro: roteiroEscrito, avisos: avisosDaGuarda });"));
  assert.ok(esteira.includes("usados: await usadosDaCampanha(runId, project.id)"));
  assert.ok((esteira.match(/permitirPessoas: figurasDoEstilo/g) ?? []).length >= 3);
  assert.ok(esteira.includes("...metadataDoElemento([peca.manchete])"));
  const semana = fonte("lib/media/pecas-da-semana.ts");
  assert.ok(/escrever: \(usados\) =>\s+cenaDaPeca\(\{/.test(semana), "a cena da semana é escrita dentro da guarda");
  assert.ok(semana.includes("estilo: estiloDoPost?.linguagem ?? estilo,"));
  assert.ok(semana.includes("Boolean(estiloDoPost?.pedeFiguras) ||"));
  assert.ok(semana.includes("...metadataDoElemento(frases)"));
  assert.ok(!semana.includes("cenaDaFrase("));
  const porRede = fonte("lib/media/arte-por-rede.ts");
  assert.ok(porRede.includes("permitirPessoas: pedido.permitirPessoas,"));
  const carrossel = fonte("lib/media/carrossel.ts");
  assert.ok(carrossel.includes('[{"frase":"...","visual":"...","elemento":"...","cenario":"..."}]'));
  assert.ok(carrossel.includes("estiloNaManchete(opcoes.estiloVisual, { estiloDoPost: opcoes.estiloDoPost })"));
  // Nenhum redator de cena recebe mais a lista do setor: `setor.mundo` não existe em código vivo.
  for (const arq of ["lib/media/arte-com-frase.tsx", "lib/media/peca-de-feed.ts", "lib/media/carrossel.ts", "lib/media/direcao-de-arte.ts", "lib/media/perfil-do-projeto.ts"]) {
    const vivo = fonte(arq).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
    assert.ok(!/setor\.mundo/.test(vivo), `${arq} ainda lê setor.mundo`);
  }
});
