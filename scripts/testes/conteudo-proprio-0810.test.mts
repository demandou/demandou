// A prova do "não sabe, não fala" (08/10/2026, pedido do Bruno: "os agentes
// escreveram que no meu canal do YouTube tem um vídeo que não existe. Não pode
// inventar nada, nem fontes, nem dados").
//   - o completo que não está no ar não é citado (nem o convite do corte, nem
//     a chamada das peças da semana);
//   - a peça anterior que não está no ar não é citada;
//   - o título inventado é cortado pela guarda (com o JEV fora, e com o JEV
//     dizendo que é conteúdo próprio);
//   - com o completo publicado, a chamada entra com o título real e o link
//     onde a rede aceita;
//   - número e fonte sem lastro saem; o que está na fala ou na pesquisa fica.
// Nada aqui toca banco, IA ou rede: o JEV é um dublê e a busca das peças
// publicadas é injetada.
// Rodar: npx tsx --test scripts/testes/conteudo-proprio-0810.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";

delete process.env.TYPESAFE_API_KEY;
delete process.env.JEV_LIGADO;

const {
  avisoDoEloNoQuadro,
  conviteAoCompleto,
  descricaoDoCorte,
  eloDaCampanha,
  eloDaPeca,
  fraseDoElo,
  lerEloDoPost,
  pecasDoPlano,
  removerFrasesDoElo,
  textoComElo,
} = await import("@/lib/media/elo-da-campanha");
const { candidatasDoTexto, conferirFrase, frasesDoClienteNaEdicao, guardarConteudoProprio, tirarFrases } = await import("@/lib/squad/guarda-do-conteudo-proprio");
const { listaDoInventarioParaRedator, tituloNoYoutube, urlComparavel } = await import("@/lib/analytics/tipos-do-inventario");
const { itensDaVarredura } = await import("@/lib/analytics/inventario-das-redes");
const { textoComEloDoPost, limparTextoGerado } = await import("@/lib/media/elo-na-publicacao");
const { briefingComLastro, frasesComFonteSemLastro, frasesComNumeroSemLastro, fontesCitadas, infograficoComLastro } = await import("@/lib/media/lastro-do-video");

type Item = import("@/lib/analytics/tipos-do-inventario").ItemDoInventario;
type Busca = import("@/lib/media/elo-na-publicacao").BuscarCitada;
type Perguntar = typeof import("@/lib/jev/cliente").perguntarAoJev;

const TRAVESSAO = /[—–]/;
const URL_DO_COMPLETO = "https://www.youtube.com/watch?v=abcDEF12345";
const TITULO_REAL = "Como gravar uma vez e ter conteúdo a semana inteira";

// Os textos do incidente de 08/10 (run cmuzzn4f0, projeto do Bruno), como saíram.
const IMAGEM_DE_SEXTA = `Conta pra mim: quando foi a última vez que você fechou o dia e pensou "nossa, vendi bastante hoje"?

Marketing devia te dar tempo, não comer ele.

Gravei um vídeo completo mostrando como isso funciona na prática: "Seu gêmeo IA trabalha 24 horas sem férias", lá no canal Bruno Donaire no YouTube. Vale assistir até o fim.

Quanto tempo do seu dia hoje foi pra postar, e não pra vender?

#autoridadedigital #marketingdeconteudo`;

const CARROSSEL_DE_SABADO = `Você não precisa estar em cinco redes ao mesmo tempo. Precisa gravar uma vez e deixar o sistema cuidar do resto.

E o carrossel não precisa nascer do zero: o achado do @coelhoxyz no X mostra automação que pega um carrossel de referência e adapta ao seu produto.

No canal Bruno Donaire no YouTube tem o vídeo completo sobre o gêmeo que trabalha por você. E se ainda não viu a peça de sexta sobre as horas que você perde editando, vale conferir o post anterior aqui no feed.

Me conta: qual etapa desse fluxo você ainda faz na mão?`;

const INFOGRAFICO_DE_DOMINGO = `Ter um gêmeo em IA não é ter autenticidade garantida.

No vídeo eu mostro meu gêmeo de IA apresentando o conteúdo por mim. Funciona: o sistema edita, corta e distribui.

Vem ver o fluxo completo no vídeo "Seu gêmeo IA trabalha 24 horas sem férias", lá no canal Bruno Donaire no YouTube, e dá uma olhada no carrossel que postei por aqui ontem.

Você usaria um gêmeo de IA pra representar sua marca? Comenta aqui embaixo.`;

const nada: Busca = async () => null;
function soOCompletoNoAr(titulo = TITULO_REAL): Busca {
  return async (_p, chamada) =>
    chamada.tipo === "completo" ? { postId: "yt1", rede: "youtube", url: URL_DO_COMPLETO, titulo: tituloNoYoutube(`${titulo}\n\nNesta conversa...`), formato: "video" } : null;
}

// ── 1. O completo que não está no ar não é citado ──────────────────────────

test("corte com o completo fora do ar nasce SEM convite, em toda rede", () => {
  for (const rede of ["instagram", "tiktok", "youtube", "facebook", "linkedin", "twitter"]) {
    assert.equal(conviteAoCompleto({ rede, titulo: "Seu gêmeo IA trabalha 24 horas sem férias", url: null, canal: "Bruno Donaire" }), null, rede);
    const d = descricaoDoCorte({ rede, titulo: "Seu gêmeo IA trabalha 24 horas sem férias", url: null, canal: "Bruno Donaire", legenda: "Grava uma vez, posta a semana.", links: [], contas: [] });
    assert.doesNotMatch(d, /canal|completo|YouTube/i, `${rede}: ${d}`);
  }
});

test("peça com o elo e o completo fora do ar: a publicação não põe chamada nenhuma", async () => {
  const pecas = pecasDoPlano({ dias: { "5": { formato: "image", redes: ["instagram"] }, "6": { formato: "carousel", redes: ["instagram"] } } } as never, []);
  const elo = eloDaPeca({ videoJobId: "v1", runId: "r1", dia: 6, pecas });
  assert.deepEqual(elo.chamadas.map((c) => c.tipo), ["completo", "anterior"]);
  const texto = await textoComEloDoPost({ projectId: "p1", platform: "instagram", content: "Grava uma vez.\n\nMe conta nos comentários.", metadata: { elo } }, { buscar: nada });
  assert.equal(texto, "Grava uma vez.\n\nMe conta nos comentários.");
});

test("o convite antigo do corte ('no meu canal do YouTube') sai na publicação quando o completo não está no ar", async () => {
  const antigo = "Grava uma vez.\n\nEsse trecho é de um vídeo completo. Assista inteiro no meu canal do YouTube.\n\nMinhas redes:\nTikTok: @prdonaire";
  const meta = { videoJobId: "v1", trechoIndice: 0 };
  assert.deepEqual(lerEloDoPost(meta)?.chamadas, [{ tipo: "completo", videoJobId: "v1" }]);
  const texto = await textoComEloDoPost({ projectId: "p1", platform: "instagram", content: antigo, metadata: meta }, { buscar: nada });
  assert.doesNotMatch(texto, /canal do YouTube|vídeo completo/);
  assert.match(texto, /Minhas redes:\nTikTok: @prdonaire$/);
});

test("o redator não recebe mais 'chame o completo': recebe a regra e só o inventário", () => {
  const vazio = eloDaCampanha({ inventario: listaDoInventarioParaRedator([]) });
  assert.match(vazio, /NÃO escreva convite para o vídeo completo/);
  assert.match(vazio, /CONTEÚDO PRÓPRIO COMPROVADO: nenhum/);
  assert.doesNotMatch(vazio, /convide quem lê/);
  assert.doesNotMatch(vazio, TRAVESSAO);
  const comItem = listaDoInventarioParaRedator([{ rede: "youtube", titulo: TITULO_REAL, url: URL_DO_COMPLETO, publicadoEm: "2026-10-07T12:00:00Z", formato: "video", origem: "demandou" }]);
  assert.match(comItem, new RegExp(TITULO_REAL));
  assert.match(comItem, /palavra por palavra/);
});

// ── 2. A peça anterior que não está no ar não é citada ─────────────────────

test("peça anterior fora do ar: sem 'Se perdeu'; no ar: entra com o link onde a rede aceita", async () => {
  const pecas = pecasDoPlano({ dias: { "5": { formato: "carousel", redes: ["instagram", "facebook"] }, "6": { formato: "image", redes: ["facebook"] } } } as never, []);
  const elo = eloDaPeca({ videoJobId: "v1", runId: "r1", dia: 6, pecas });
  const post = { projectId: "p1", platform: "facebook", content: "Texto do dia.", metadata: { elo } };
  assert.equal(await textoComEloDoPost(post, { buscar: nada }), "Texto do dia.");
  const anteriorNoAr: Busca = async (_p, c) => (c.tipo === "anterior" ? { postId: "a1", rede: "facebook", url: "https://www.facebook.com/123_456", titulo: null, formato: "carousel" } : null);
  const comAnterior = await textoComEloDoPost(post, { buscar: anteriorNoAr });
  assert.equal(comAnterior, "Texto do dia.\n\nSe perdeu o carrossel anterior desta série: https://www.facebook.com/123_456");
  // No Instagram (sem link clicável), diz onde está, sem inventar link.
  const noInstagram = fraseDoElo({ chamada: elo.chamadas[1], peca: { postId: "a1", rede: "instagram", url: "https://www.instagram.com/p/XYZ/", titulo: null, formato: "carousel" } }, "instagram");
  assert.equal(noInstagram, "Se perdeu o carrossel anterior desta série, está no meu perfil.");
});

test("a guarda corta 'a peça de sexta', 'o post anterior' e 'o carrossel que postei ontem' (o tempo só o elo confere)", async () => {
  const r = await guardarConteudoProprio({ texto: CARROSSEL_DE_SABADO, rede: "instagram", inventario: [], usarJev: false });
  assert.doesNotMatch(r.texto, /peça de sexta|post anterior|canal Bruno Donaire/);
  assert.match(r.texto, /@coelhoxyz/, "o achado da pesquisa sobre outra pessoa fica");
  assert.match(r.texto, /Me conta: qual etapa/);
  // Mesmo com o JEV dizendo que é conteúdo próprio e apontando um item, tempo não passa sem o elo.
  const jev: Perguntar = async (_ctx, perguntas) => Object.fromEntries(Object.keys(perguntas).map((k) => [k, k.startsWith("proprio") ? { type: "noul", noul: 0.95 } : { type: "choice", choice: "i1", probabilities: { i1: 0.9 }, confidence: 0.9 }])) as never;
  const inventario: Item[] = [{ rede: "instagram", titulo: "Você perde horas editando", url: "https://www.instagram.com/p/AAA/", publicadoEm: "2026-10-09T12:00:00Z", formato: "carousel", origem: "demandou" }];
  const comJev = await guardarConteudoProprio({ texto: "E se ainda não viu a peça de sexta, volta lá.", rede: "instagram", inventario, usarJev: true, perguntar: jev });
  assert.equal(comJev.texto, "");
});

// ── 3. O título inventado é cortado pela guarda ────────────────────────────

test("os textos do incidente: com o JEV fora, toda frase de conteúdo próprio sem prova sai (não sabe, não fala)", async () => {
  for (const [nome, texto] of [["imagem", IMAGEM_DE_SEXTA], ["carrossel", CARROSSEL_DE_SABADO], ["infográfico", INFOGRAFICO_DE_DOMINGO]] as const) {
    const r = await guardarConteudoProprio({ texto, rede: "facebook", inventario: [], usarJev: false });
    assert.doesNotMatch(r.texto, /Seu gêmeo IA trabalha 24 horas sem férias/, nome);
    assert.doesNotMatch(r.texto, /canal Bruno Donaire|Gravei um vídeo|Vale assistir|postei|No vídeo eu mostro/, nome);
    assert.ok(r.cortadas.length > 0, nome);
    assert.doesNotMatch(r.texto, /\n{3,}/, `${nome}: sem buraco no texto`);
    assert.doesNotMatch(r.texto, TRAVESSAO);
  }
  const imagem = await guardarConteudoProprio({ texto: IMAGEM_DE_SEXTA, rede: "facebook", inventario: [], usarJev: false });
  assert.match(imagem.texto, /^Conta pra mim/);
  assert.match(imagem.texto, /#autoridadedigital #marketingdeconteudo$/);
});

test("título entre aspas que não é o título real sai, mesmo com o JEV dizendo que o canal tem vídeos", async () => {
  const inventario: Item[] = [{ rede: "youtube", titulo: TITULO_REAL, url: URL_DO_COMPLETO, publicadoEm: "2026-10-07T12:00:00Z", formato: "video", origem: "varredura" }];
  const c = candidatasDoTexto(INFOGRAFICO_DE_DOMINGO).find((x) => x.titulos.length);
  assert.ok(c);
  assert.deepEqual(conferirFrase(c, inventario), { tipo: "titulo-falso", titulo: "Seu gêmeo IA trabalha 24 horas sem férias" });
  const jevDizQueSim: Perguntar = async (_ctx, perguntas) => Object.fromEntries(Object.keys(perguntas).map((k) => [k, k.startsWith("proprio") ? { type: "noul", noul: 0.97 } : { type: "choice", choice: "i1", probabilities: { i1: 0.95 }, confidence: 0.95 }])) as never;
  const r = await guardarConteudoProprio({ texto: INFOGRAFICO_DE_DOMINGO, rede: "instagram", inventario, usarJev: true, perguntar: jevDizQueSim });
  assert.doesNotMatch(r.texto, /Seu gêmeo IA trabalha 24 horas sem férias/);
});

test("o título real, palavra por palavra, passa sem precisar do JEV; o link do inventário também", async () => {
  const inventario: Item[] = [{ rede: "youtube", titulo: TITULO_REAL, url: URL_DO_COMPLETO, publicadoEm: "2026-10-07T12:00:00Z", formato: "video", origem: "varredura" }];
  const texto = `Expliquei isso no vídeo "${TITULO_REAL}", lá no meu canal.`;
  const r = await guardarConteudoProprio({ texto, rede: "instagram", inventario, usarJev: false });
  assert.equal(r.texto, texto);
  const comLink = `O passo a passo está no vídeo completo: https://youtu.be/abcDEF12345`;
  assert.equal((await guardarConteudoProprio({ texto: comLink, rede: "linkedin", inventario, usarJev: false })).texto, comLink);
  assert.equal(urlComparavel("https://youtu.be/abcDEF12345"), urlComparavel(URL_DO_COMPLETO));
  // Uma palavra diferente já não é o título real.
  const quase = `Expliquei isso no vídeo "Como gravar uma vez e ter conteúdo a semana toda", lá no meu canal.`;
  assert.equal((await guardarConteudoProprio({ texto: quase, rede: "instagram", inventario, usarJev: false })).texto, "");
});

test("o JEV decide o que o código não resolve: frase sobre outra pessoa fica; sem item do inventário, sai", async () => {
  const texto = "O Fulano gravou um vídeo inteiro sobre isso no canal dele. No meu canal tem um vídeo sobre esse tema.";
  const jev: Perguntar = async (ctx, perguntas) => {
    const frases = (ctx.state as { frases: Array<{ id: string; frase: string }> }).frases;
    return Object.fromEntries(
      Object.keys(perguntas).map((k) => {
        const id = k.split(":")[1];
        const frase = frases.find((f) => f.id === id)?.frase ?? "";
        if (k.startsWith("proprio")) return [k, { type: "noul", noul: /Fulano/.test(frase) ? 0.1 : 0.9 }];
        return [k, { type: "choice", choice: "nenhum", probabilities: { nenhum: 0.9 }, confidence: 0.9 }];
      })
    ) as never;
  };
  const inventario: Item[] = [{ rede: "youtube", titulo: "Outro assunto", url: "https://www.youtube.com/watch?v=zzzzzzzzzzz", publicadoEm: null, formato: "video", origem: "varredura" }];
  const r = await guardarConteudoProprio({ texto, rede: "linkedin", inventario, usarJev: true, perguntar: jev });
  assert.equal(r.texto, "O Fulano gravou um vídeo inteiro sobre isso no canal dele.");
  assert.equal(r.jev, true);
});

test("JEV fora do ar (erro) vale como JEV desligado: a frase sem prova sai", async () => {
  const quebrado: Perguntar = async () => {
    throw new Error("JEV respondeu 500");
  };
  const r = await guardarConteudoProprio({ texto: "No meu canal do YouTube tem o vídeo completo.", rede: "instagram", inventario: [], usarJev: true, perguntar: quebrado });
  assert.equal(r.texto, "");
  assert.equal(r.jev, false);
});

test("conselho ao leitor não é conteúdo próprio: 'seu último post', 'o último post' da lista, 'assistir a vídeos'", () => {
  // Achados na simulação dos rascunhos reais do Bruno (run cmv03t72a, 08/10).
  for (const frase of [
    "Olhou a foto, leu a bio, viu seu último post.",
    "Terceiro, o último post.",
    "Último post: um mês parado e a pessoa pensa que você sumiu ou parou de atender.",
    "Assistir a vídeos de concorrentes não ajuda.",
    "Compare com o seu post de ontem.",
    "Grava uma vez e deixa o sistema cuidar do resto.",
  ]) {
    assert.deepEqual(candidatasDoTexto(frase), [], frase);
  }
  // E a primeira pessoa continua sendo pega.
  assert.equal(candidatasDoTexto("Meu último vídeo fala disso.").length, 1);
  assert.equal(candidatasDoTexto("Vale conferir o post anterior aqui no feed.").length, 1);
});

test("num corte, 'neste vídeo' é o próprio corte e fica; num post de imagem, sai", async () => {
  const texto = "Neste vídeo eu mostro o fluxo inteiro. Salva para ver depois.";
  assert.equal((await guardarConteudoProprio({ texto, rede: "instagram", pecaEhVideo: true, inventario: [], usarJev: false })).texto, texto);
  assert.equal((await guardarConteudoProprio({ texto, rede: "instagram", pecaEhVideo: false, inventario: [], usarJev: false })).texto, "Salva para ver depois.");
});

test("thread: o tweet que esvazia sai e os outros são renumerados", () => {
  const thread = "1/ Grava uma vez.\n\n2/ Gravei um vídeo completo sobre isso no meu canal.\n\n3/ E você, posta todo dia?";
  const c = candidatasDoTexto(thread).map((x) => x.frase);
  assert.deepEqual(c, ["Gravei um vídeo completo sobre isso no meu canal."]);
  assert.equal(tirarFrases(thread, c), "1/ Grava uma vez.\n\n2/ E você, posta todo dia?");
});

test("o que o cliente escreveu na edição é dele e fica", async () => {
  const antes = "Grava uma vez.";
  const depois = "Grava uma vez. No meu canal do YouTube tem a aula inteira.";
  const doCliente = frasesDoClienteNaEdicao(antes, depois, []);
  assert.deepEqual(doCliente, ["No meu canal do YouTube tem a aula inteira."]);
  const r = await guardarConteudoProprio({ texto: depois, rede: "instagram", inventario: [], usarJev: false, frasesDoCliente: doCliente });
  assert.equal(r.texto, depois);
});

// ── 4. Com o completo publicado, a chamada entra com o título real ─────────

test("completo no ar: a chamada entra com o título REAL e o link onde a rede aceita", async () => {
  const elo = eloDaPeca({ videoJobId: "v1", runId: "r1", dia: 5, pecas: [] });
  const base = "Grava uma vez e deixa o sistema cuidar do resto.\n\nQuanto tempo você perde postando?\n\n#ia #marketing";
  const fb = await textoComEloDoPost({ projectId: "p1", platform: "facebook", content: base, metadata: { elo } }, { buscar: soOCompletoNoAr() });
  assert.equal(
    fb,
    `Grava uma vez e deixa o sistema cuidar do resto.\n\nQuanto tempo você perde postando?\n\nO vídeo completo "${TITULO_REAL}" está no YouTube: ${URL_DO_COMPLETO}\n\n#ia #marketing`
  );
  const ig = await textoComEloDoPost({ projectId: "p1", platform: "instagram", content: base, metadata: { elo } }, { buscar: soOCompletoNoAr(), canal: "Bruno Donaire" });
  assert.match(ig, new RegExp(`O vídeo completo "${TITULO_REAL}" está no YouTube, no canal Bruno Donaire\\.`));
  assert.doesNotMatch(ig, /https?:\/\//, "Instagram: nenhuma URL na legenda");
  // O título inventado pelo redator não aparece: o que entra é o do post publicado.
  assert.doesNotMatch(fb + ig, /Seu gêmeo IA/);
  assert.doesNotMatch(fb + ig, TRAVESSAO);
});

test("corte com o completo no ar: o convite de corte, com o título real e o link", async () => {
  const meta = { videoJobId: "v1", trechoIndice: 2, elo: eloDaPeca({ videoJobId: "v1", runId: "r1", dia: 3, pecas: [], corte: true }) };
  const texto = await textoComEloDoPost({ projectId: "p1", platform: "linkedin", content: "O gancho do corte.\n\nLinks:\nSite: https://demandou.com/", metadata: meta }, { buscar: soOCompletoNoAr() });
  assert.equal(texto, `O gancho do corte.\n\nEsse trecho é do vídeo completo "${TITULO_REAL}". Assista inteiro no YouTube: ${URL_DO_COMPLETO}\n\nLinks:\nSite: https://demandou.com/`);
  // Republicar não duplica: a linha antiga sai antes de a nova entrar.
  const de_novo = await textoComEloDoPost({ projectId: "p1", platform: "linkedin", content: texto, metadata: meta }, { buscar: soOCompletoNoAr() });
  assert.equal(de_novo, texto);
  // E se o completo sair do ar, a chamada sai junto.
  assert.equal(await textoComEloDoPost({ projectId: "p1", platform: "linkedin", content: texto, metadata: meta }, { buscar: nada }), "O gancho do corte.\n\nLinks:\nSite: https://demandou.com/");
});

test("no X a chamada só entra se o último tweet couber nos 280", () => {
  const curto = "1/ Grava uma vez.\n\n2/ E você?";
  assert.equal(textoComElo(curto, [`Vídeo completo no YouTube: ${URL_DO_COMPLETO}`], "twitter"), `${curto}\n\nVídeo completo no YouTube: ${URL_DO_COMPLETO}`);
  const longo = `1/ Grava uma vez.\n\n2/ ${"palavra ".repeat(33).trim()}`;
  assert.equal(textoComElo(longo, [`Vídeo completo no YouTube: ${URL_DO_COMPLETO}`], "twitter"), longo);
});

test("a guarda deixa em paz as linhas do código (o elo conferido e o bloco de links)", async () => {
  const texto = `Grava uma vez.\n\nO vídeo completo "${TITULO_REAL}" está no YouTube: ${URL_DO_COMPLETO}\n\nLinks:\nYouTube: https://www.youtube.com/@brunodonaire`;
  const r = await guardarConteudoProprio({ texto, rede: "facebook", inventario: [], usarJev: false });
  assert.equal(r.texto, texto);
  assert.equal(removerFrasesDoElo(texto), "Grava uma vez.\n\nLinks:\nYouTube: https://www.youtube.com/@brunodonaire");
});

test("o quadro avisa que a chamada entra na publicação, e quando ela já está no texto", () => {
  const elo = eloDaPeca({ videoJobId: "v1", runId: "r1", dia: 6, pecas: pecasDoPlano({ dias: { "5": { formato: "image", redes: ["instagram"] }, "6": { formato: "carousel", redes: ["instagram"] } } } as never, []) });
  const antes = avisoDoEloNoQuadro({ elo }, "Texto.");
  assert.match(antes ?? "", /entra sozinha na publicação/);
  assert.match(antes ?? "", /o vídeo completo e a imagem anterior \(sexta\)/);
  const depois = avisoDoEloNoQuadro({ elo }, `Texto.\n\nO vídeo completo "${TITULO_REAL}" está no YouTube: ${URL_DO_COMPLETO}`);
  assert.match(depois ?? "", /o vídeo completo já está no texto/);
  assert.match(depois ?? "", /a imagem anterior \(sexta\) entra sozinha/);
  assert.equal(avisoDoEloNoQuadro({ origem: "video" }, "Texto."), null);
  assert.doesNotMatch(`${antes}${depois}`, TRAVESSAO);
});

// ── O inventário ────────────────────────────────────────────────────────────

test("a varredura vira inventário com o título exato do YouTube e a primeira linha das outras redes", () => {
  const itens = itensDaVarredura("youtube", [{ url: URL_DO_COMPLETO, legenda: `${TITULO_REAL}\nDescrição longa`, publicadoEm: "2026-10-07T12:00:00Z", formato: "video" }]);
  assert.equal(itens[0].titulo, TITULO_REAL);
  const ig = itensDaVarredura("instagram", [{ url: null, legenda: "sem link", publicadoEm: null, formato: "reel" }, { url: "https://www.instagram.com/p/A/", legenda: "\nPrimeira linha\nresto", publicadoEm: null, formato: "reel" }]);
  assert.equal(ig.length, 1, "item sem endereço não comprova nada");
  assert.equal(ig[0].titulo, "Primeira linha");
});

// ── 5. Números e fontes ─────────────────────────────────────────────────────

test("número que não está na fala nem na pesquisa sai; o da fala por extenso fica", () => {
  const lastro = "Na fala: a gente perde vinte e três horas por semana editando. Pesquisa: HubSpot, 2025, profissionais economizam 10 a 15 horas por semana.";
  const texto = "Você perde 23 horas por semana editando. Segundo a HubSpot, dá para economizar de 10 a 15 horas. Um estudo mostra que 87% dos donos desistem. São 3 passos simples.";
  const sem = frasesComNumeroSemLastro(texto, lastro);
  assert.deepEqual(sem, ["Um estudo mostra que 87% dos donos desistem."]);
});

test("fonte citada que não está na pesquisa sai; a que está fica", () => {
  const lastro = "Achados: HubSpot (2025) e Sprout Social (janeiro de 2026) sobre IA nas redes.";
  assert.deepEqual(fontesCitadas("Tem um dado da HubSpot (citado em pesquisa Sprout Social, janeiro/2026)."), ["HubSpot", "Sprout Social"]);
  const texto = "Tem um dado da HubSpot (citado em pesquisa Sprout Social, janeiro/2026). A Forrester apontou que avatares soam robóticos.";
  assert.deepEqual(frasesComFonteSemLastro(texto, lastro), ["A Forrester apontou que avatares soam robóticos."]);
});

test("a semana do vídeo tira o número sem lastro e a citação inventada antes do quadro", async () => {
  const texto = "Grava uma vez.\n\nUm estudo da McKinsey mostra que 64% das empresas já usam IA.\n\nGravei um vídeo completo sobre isso no meu canal.\n\nE você?";
  const limpo = await limparTextoGerado({ texto, rede: "linkedin", projectId: "p1", inventario: [], lastro: "fala sem dado nenhum", usarJev: false, semLog: true });
  assert.equal(limpo, "Grava uma vez.\n\nE você?");
});

test("o briefing do Roberto só fica com dado e achado que existem na pesquisa", () => {
  const pesquisa = "Segundo a HubSpot (2025), 62% dos profissionais usam IA. Sprout Social: relatório de janeiro.";
  const r = briefingComLastro(
    {
      dados: [
        { valor: "62%", oQueMede: "usam IA", fonte: "HubSpot, 2025" },
        { valor: "87%", oQueMede: "desistem", fonte: "HubSpot, 2025" },
        { valor: "40%", oQueMede: "crescem", fonte: "Gartner, 2026" },
      ],
      achados: [
        { titulo: "IA nas redes", fonte: "Sprout Social", data: "", relacao: "" },
        { titulo: "Avatares", fonte: "Forrester", data: "", relacao: "" },
      ],
    },
    pesquisa
  );
  assert.deepEqual(r.dados.map((d) => d.valor), ["62%"]);
  assert.deepEqual(r.achados.map((a) => a.fonte), ["Sprout Social"]);
  assert.equal(r.tirados.length, 3);
});

test("o infográfico não desenha número sem lastro", () => {
  const r = infograficoComLastro(
    {
      title: "IA nas redes",
      subtitle: "",
      highlight: { value: "87%", label: "desistem" },
      sections: [
        { heading: "Tempo", body: "economia", stat: "10 a 15 horas" },
        { heading: "Uso", body: "adoção", stat: "64%" },
      ],
      keyNumbers: [{ value: "62%", label: "usam IA" }, { value: "2026", label: "ano" }],
    },
    "HubSpot 2025: 62% usam IA e economizam de 10 a 15 horas por semana."
  );
  assert.equal(r.conteudo.highlight, undefined);
  assert.deepEqual(r.conteudo.sections?.map((s) => s.stat ?? null), ["10 a 15 horas", null]);
  assert.deepEqual(r.conteudo.keyNumbers?.map((n) => n.value), ["62%", "2026"]);
  assert.equal(r.tirados.length, 2);
});

test("nenhuma frase montada em código leva travessão", () => {
  const elo = eloDaPeca({ videoJobId: "v1", runId: "r1", dia: 6, pecas: pecasDoPlano({ dias: { "5": { formato: "image", redes: ["instagram"] }, "6": { formato: "carousel", redes: ["instagram"] } } } as never, []) });
  const frases = ["instagram", "tiktok", "facebook", "linkedin", "twitter", "youtube"].flatMap((rede) =>
    elo.chamadas.map((chamada) => fraseDoElo({ chamada, peca: { postId: "x", rede: "instagram", url: URL_DO_COMPLETO, titulo: TITULO_REAL, formato: "image" } }, rede, { canal: "Bruno Donaire" }) ?? "")
  );
  for (const f of frases) assert.doesNotMatch(f, TRAVESSAO, f);
});
