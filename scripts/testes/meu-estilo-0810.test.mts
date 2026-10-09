// A caixa "crie o seu estilo" (08/10/2026). Pedido do Bruno, testando como
// cliente: "uma caixa igual à do ChatGPT: escreva aqui o seu estilo, como você
// é; a IA gera uma thumb e aquelas peças; se ele falar que é, isso treina o
// modelo; o usuário nunca vai descrever um prompt perfeito".
// Nada aqui toca banco, IA, rede ou imagem paga: o redator, o gerador, o olho
// e o JEV são fakes; o depósito é em memória.
// Rodar: npx tsx --test scripts/testes/meu-estilo-0810.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  acertoDaRodada,
  comRodadaNova,
  CREDITOS_RESERVADOS_DA_RODADA,
  creditosDoCusto,
  ESTADO_VAZIO,
  estadoValido,
  estimativaDaRodadaUsd,
  exemplosDaCaixa,
  falaDePecaAntiga,
  falasDaRodada,
  falaServe,
  fonteDoEstilo,
  frasesDaCaixa,
  normalizarEstiloEscrito,
  PECAS_DA_PREVIA,
  pedidoDoDesignDasArtes,
  pedidoDoDesignDeVideo,
  rodadaDe,
  rodadaParaTela,
  TETO_DA_RODADA_USD,
  TETO_DE_RODADAS,
  textoDoComando,
  urlDaPreviaNaTela,
  type EstiloEscrito,
  type EstadoDoMeuEstilo,
} from "@/lib/estilo-proprio/tipos";
import { escreverEstilo, estiloDeReserva, mensagemDoRedator } from "@/lib/estilo-proprio/redator";
import { decisaoDeReserva, gerarPreviasDoEstilo, lerDescricoes, promptRefeito, type ServicosDasPrevias } from "@/lib/estilo-proprio/previas";
import { escreverRodada, gerarPreviasDaRodada, type DepositoDoMeuEstilo, type Servicos } from "@/lib/estilo-proprio/servidor";
import { assinaturaDoTexto, estiloMestreDe } from "@/lib/estilo-dos-posts/estilo-mestre";
import type { RespostaDoJev } from "@/lib/jev/cliente";

const fonte = (caminho: string) => readFileSync(new URL(`../../${caminho}`, import.meta.url), "utf8");

const ESTILO_CRU = {
  resumo: "Você aparece sempre num ambiente claro, com muita luz natural, e as peças ficam limpas, em branco e verde. O verde da sua marca entra só nos detalhes.",
  pontos: ["Ambiente claro com luz natural", "Branco e verde", "Pessoa de verdade, nada de estúdio", "Título curto na sua letra", "Ambiente claro com luz natural"],
  evitar: ["estúdio escuro com ring light", "fundo preto"],
  titulo: "O remédio certo no horário certo.",
  video: "Edição clara e leve: a gravação fica como está, com textos em camada curtos na letra da marca, um painel branco translúcido ao lado quando houver número, imagens geradas de farmácia clara e luminosa quando a fala pedir imagem, transições suaves, algo novo na tela a cada 6 a 10 segundos, o verde da marca só nos destaques.",
  artes: "Foto editorial de uma farmácia clara, prateleiras brancas, luz natural de janela, um assunto principal no centro, zona quieta embaixo para o título, nada de texto na imagem, verde da marca só nos detalhes.",
  carrossel: "Capa com a cena mais forte e zona quieta grande; lâminas de dentro mais simples, fundo claro, com espaço para o texto.",
  videoCurto: "Cenas de farmácia e consultório claros, luz natural, câmera com movimento leve, cores suaves, verde só nos detalhes.",
  previas: {
    thumb: "Horizontal thumbnail of a bright pharmacy, an anonymous pharmacist from the chest up on the left, white shelves, natural window light, calm empty area on the right. Brand colors only as small accents.",
    post: "Vertical post image of a bright pharmacy counter, natural light, one clear subject, quiet area at the bottom. Brand colors only as small accents.",
    vertical: "Vertical frame of an anonymous presenter speaking in a bright pharmacy with one translucent white panel beside them. Brand colors only as small accents.",
    carrossel: "Vertical cover: bright pharmacy shelves, soft natural light, large quiet area for a headline. Brand colors only as small accents.",
  },
};

test("o estilo escrito é conferido em código: tetos, sem travessão, repetido sai, título curto", () => {
  const e = normalizarEstiloEscrito({ ...ESTILO_CRU, resumo: `${ESTILO_CRU.resumo} E ainda — com travessão.` })!;
  assert.ok(e, "o estilo vale");
  assert.ok(!e.resumo.includes("—"));
  assert.deepEqual(e.pontos, ["Ambiente claro com luz natural", "Branco e verde", "Pessoa de verdade, nada de estúdio", "Título curto na sua letra"], "o ponto repetido sai");
  assert.equal(e.titulo, "O remédio certo no horário certo", "sem ponto final");
  assert.equal(normalizarEstiloEscrito({ ...ESTILO_CRU, video: "curto" }), null, "sem o comando do vídeo não há estilo");
  assert.equal(normalizarEstiloEscrito({ ...ESTILO_CRU, previas: { ...ESTILO_CRU.previas, post: "" } }), null, "falta a prévia do post");
  assert.equal(normalizarEstiloEscrito(null), null);
  const longo = normalizarEstiloEscrito({ ...ESTILO_CRU, titulo: "um dois três quatro cinco seis sete oito nove dez" })!;
  assert.equal(longo.titulo.split(" ").length, 8);
  // A peça antiga do cliente não é estilo (saiu nas duas rodadas reais de 08/10): o item cai em código.
  const comAntigo = normalizarEstiloEscrito({ ...ESTILO_CRU, evitar: ["Cards antigos com texto apertado", "Cores saturadas tipo amarelo vivo ou azul forte dos cards antigos", "o post de ontem", "Estúdio escuro"] })!;
  assert.deepEqual(comAntigo.evitar, ["Estúdio escuro"]);
  assert.equal(falaDePecaAntiga("Ambiente claro com luz natural"), false);
});

test("o comando do vídeo e os pedidos da biblioteca saem do estilo, com o que ele evita", () => {
  const e = normalizarEstiloEscrito(ESTILO_CRU)!;
  const comando = textoDoComando(e);
  assert.ok(comando.startsWith("Edição clara e leve"));
  assert.ok(comando.endsWith("Nunca usar: estúdio escuro com ring light, fundo preto."), comando);
  assert.ok(comando.length <= 1500);
  assert.match(pedidoDoDesignDeVideo(e), /Cenas geradas por IA: Cenas de farmácia/);
  assert.match(pedidoDoDesignDasArtes(e), /^Foto editorial[\s\S]*Carrossel: Capa com a cena[\s\S]*Nunca: estúdio escuro/);
  // O estilo mestre do projeto sai do comando gravado: a assinatura muda quando o estilo muda.
  const m1 = estiloMestreDe({ comando: { texto: comando } });
  const m2 = estiloMestreDe({ comando: { texto: `${comando} Mais luz.` } });
  assert.equal(m1.origem, "comando");
  assert.notEqual(m1.assinatura, m2.assinatura);
  assert.equal(m1.assinatura, assinaturaDoTexto(m1.pedido));
});

test("a fala: a primeira pede uma frase, o ajuste vale com poucas letras, o último ajuste manda", () => {
  assert.equal(falaServe("sou farmacêutica, quero tudo claro", false), true);
  assert.equal(falaServe("claro", false), false);
  assert.equal(falaServe("azul", true), true);
  assert.deepEqual(falasDaRodada(["sou farmacêutica, ambiente claro"], "mais verde", true), ["sou farmacêutica, ambiente claro", "mais verde"]);
  assert.deepEqual(falasDaRodada(["sou farmacêutica, ambiente claro"], "agora sou outra coisa", false), ["agora sou outra coisa"], "sem ajuste, começa de novo");
  const muitas = falasDaRodada(Array.from({ length: 14 }, (_, i) => `fala ${i}`), "última", true);
  assert.equal(muitas.length, 12);
  assert.equal(muitas[0], "fala 0", "a primeira fala nunca sai");
  assert.equal(muitas[muitas.length - 1], "última");
});

test("o histórico: rodada nova no fim, o teto tira as antigas e nunca a confirmada", () => {
  const estilo = normalizarEstiloEscrito(ESTILO_CRU)!;
  let estado: EstadoDoMeuEstilo = { ...ESTADO_VAZIO, rodadas: [] };
  for (let i = 0; i < TETO_DE_RODADAS + 3; i++) {
    const r = comRodadaNova(estado, { falas: [`fala ${i}`], origem: "escrito", estilo, escritoPor: "redator", comPerfil: false, fonte: "geist", previas: null, em: "2026-10-08T20:00:00Z" });
    estado = r.estado;
    if (i === 1) estado = { ...estado, confirmado: { rodada: r.rodada.n, em: "", resumo: "", pontos: [], falas: [], designDeVideoId: null, designDasArtesId: null } };
  }
  assert.equal(estado.rodadas.length, TETO_DE_RODADAS);
  assert.ok(estado.rodadas.some((r) => r.n === 2), "a confirmada (rodada 2) ficou");
  assert.ok(!estado.rodadas.some((r) => r.n === 1), "a mais antiga saiu");
  assert.equal(rodadaDe(estado)?.n, TETO_DE_RODADAS + 3);
  assert.equal(rodadaDe(estado, 2)?.n, 2);
  assert.equal(estadoValido({ rodadas: [{ n: "x" }], confirmado: {} }).rodadas.length, 0, "o que não serve vira vazio");
  const paraTela = rodadaParaTela({ ...estado.rodadas[0], custoUsd: 0.31 });
  assert.ok(!("custoUsd" in paraTela), "o cliente nunca lê dólar");
});

test("os créditos: a reserva é o teto pela régua, o acerto cobra o real e devolve o resto", () => {
  assert.equal(creditosDoCusto(0.27), 54, "US$ 0,27 x 5,36 / 0,027 = 53,6 -> 54");
  assert.equal(CREDITOS_RESERVADOS_DA_RODADA, creditosDoCusto(TETO_DA_RODADA_USD));
  assert.equal(CREDITOS_RESERVADOS_DA_RODADA, 80);
  assert.ok(estimativaDaRodadaUsd() <= TETO_DA_RODADA_USD, `a rodada normal (${estimativaDaRodadaUsd()}) cabe no teto`);
  assert.deepEqual(acertoDaRodada(80, 0.244, 4), { cobrado: 49, devolver: 31 });
  assert.deepEqual(acertoDaRodada(80, 0, 0), { cobrado: 0, devolver: 80 }, "nada gerado, nada cobrado");
  assert.deepEqual(acertoDaRodada(80, 0.9, 6), { cobrado: 80, devolver: 0 }, "nunca mais que a reserva");
});

test("a caixa: os exemplos do nicho vêm primeiro, a letra da marca vira a letra do comando", () => {
  const ex = exemplosDaCaixa("Farmácia de manipulação");
  assert.match(ex[0], /farmacêutica/);
  assert.equal(ex.length, 5);
  assert.match(frasesDaCaixa(null)[0], /^Descreva o seu estilo do seu jeito/);
  assert.equal(fonteDoEstilo({ letraDaMarca: "classica" }), "playfair");
  assert.equal(fonteDoEstilo({ letraDaMarca: "impacto" }), "archivo");
  assert.equal(fonteDoEstilo({ letraDaMarca: null, fonteAtual: "oswald" }), "oswald");
  assert.equal(fonteDoEstilo({}), "geist");
  assert.equal(urlDaPreviaNaTela("p1", "https://x.public.blob.vercel-storage.com/a.jpg"), "https://x.public.blob.vercel-storage.com/a.jpg");
  assert.match(urlDaPreviaNaTela("p1", "https://x.blob.vercel-storage.com/a.jpg"), /^\/api\/projects\/p1\/meu-estilo\?previa=/);
});

test("o redator: a fala e o contexto (marca, letra, perfil) vão ao Claude; sem ele, a reserva nunca fica vazia", async () => {
  const msg = mensagemDoRedator("sou farmacêutica, quero tudo claro, branco e verde", { nicho: "Farmácia", paleta: ["#2E7D32", "#FFFFFF"], letra: "Clássica", perfil: { pessoa: "Farmacêutica em Mogi", estiloVisual: "fotos claras no balcão", cores: ["#2E7D32"] } });
  assert.match(msg, /O que o cliente contou, do jeito dele: "sou farmacêutica/);
  assert.match(msg, /Cores da marca \(a primeira é a principal\): .*green/);
  assert.match(msg, /Letra dos títulos aprovada na marca: Clássica/);
  assert.match(msg, /Quem ele é, pela leitura das redes dele: Farmacêutica em Mogi/);
  assert.match(msg, /O visual que ele já usa nas redes: fotos claras no balcão/);
  const reserva = estiloDeReserva("sou farmacêutica, quero tudo claro, branco e verde", { nicho: "Farmácia" });
  assert.ok(normalizarEstiloEscrito(reserva), "a reserva passa na conferência de código");
  for (const p of PECAS_DA_PREVIA) assert.match(reserva.previas[p.id], /No text/);
  // O Claude escreve; a conferência em código completa a guarda da imagem.
  const r = await escreverEstilo("sou farmacêutica", { nicho: "Farmácia", projectId: "p1" }, async () => JSON.stringify({ ...ESTILO_CRU, previas: { ...ESTILO_CRU.previas, thumb: "Bright pharmacy thumbnail with an anonymous pharmacist on the left and a calm area on the right for the title" } }));
  assert.equal(r.origem, "redator");
  assert.match(r.estilo.previas.thumb, /Brand colors only as small accents/);
  assert.match(r.estilo.previas.thumb, /No text/);
  const falhou = await escreverEstilo("sou farmacêutica", { projectId: "p1" }, async () => "não é json");
  assert.equal(falhou.origem, "reserva");
});

test("as prévias: quatro peças na proporção certa, o olho descreve, o JEV decide, a refação cabe no teto", async () => {
  const estilo = normalizarEstiloEscrito(ESTILO_CRU)!;
  const reservaComPessoa = estiloDeReserva("sou pastor, madeira e luz natural", {});
  const gerados: Array<{ prompt: string; proporcao: string }> = [];
  const guardados: string[] = [];
  let olhadas = 0;
  const perguntas: string[] = [];
  const servicos: ServicosDasPrevias = {
    gerar: async (prompt, proporcao) => {
      gerados.push({ prompt, proporcao });
      return { jpeg: Buffer.from(`img-${gerados.length}`), custoUsd: 0.06, modelo: "fake" };
    },
    guardar: async (nome) => {
      guardados.push(nome);
      return `https://x.blob.vercel-storage.com/${nome}`;
    },
    olho: async (p) => {
      olhadas++;
      // A primeira olhada: o post saiu com texto, a thumb virou colagem; a segunda: tudo limpo.
      const ruim = olhadas === 1;
      return {
        json: { imagens: p.imagens.map((im) => ({ colagem: ruim && /Thumb/.test(im.rotulo ?? ""), paineis: ruim && /Thumb/.test(im.rotulo ?? "") ? 3 : 1, temTexto: ruim && /Post/.test(im.rotulo ?? ""), textoLido: "", pessoaReconhecivel: false, rostoDesfocado: false, assunto: "farmácia clara", proibidosVistos: [], ambiente: "claro, luz natural" })) },
        custoUsd: 0.004,
      };
    },
    juiz: async (_ctx, qs) => {
      const saida: Record<string, RespostaDoJev> = {};
      for (const k of Object.keys(qs)) {
        perguntas.push(k);
        const q = qs[k] as unknown as { instructions: { descricaoDaImagem: { colagem: boolean; temTexto: boolean } } };
        const d = q.instructions.descricaoDaImagem;
        const choice = d.colagem || d.temTexto ? "refazer" : "aprovar";
        saida[k] = { type: "choice", choice, probabilities: { [choice]: 0.9 }, confidence: 0.9 };
      }
      return saida;
    },
  };
  const r = await gerarPreviasDoEstilo({ projectId: "p1", rodada: 1, estilo }, servicos);
  assert.deepEqual(gerados.slice(0, 4).map((g) => g.proporcao), ["16:9", "4:5", "9:16", "4:5"], "cada peça na proporção dela");
  assert.equal(gerados.length, 6, "duas refeitas uma vez");
  assert.match(gerados[4].prompt, /ONE single scene|Absolutely no text/);
  assert.equal(olhadas, 2);
  assert.equal(r.previas.length, 4, "as quatro voltam aprovadas");
  assert.ok(r.previas.find((p) => p.peca === "thumb")?.refeita);
  assert.ok(!r.previas.find((p) => p.peca === "vertical")?.refeita);
  assert.ok(r.previas.every((p) => p.conferida));
  assert.deepEqual(r.tiradas, []);
  assert.ok(r.custoUsd <= TETO_DA_RODADA_USD, `custo ${r.custoUsd} dentro do teto`);
  assert.equal(r.geradas, 6);
  assert.ok(guardados.every((g) => g.startsWith("meu-estilo/p1/rodada-1/")));
  // Sem o olho nem o JEV: as imagens entram como saíram, marcadas "não conferidas".
  const semConferir = await gerarPreviasDoEstilo({ projectId: "p1", rodada: 2, estilo }, { ...servicos, olho: null, juiz: null });
  assert.equal(semConferir.previas.length, 4);
  assert.ok(semConferir.previas.every((p) => !p.conferida));
  // Nenhuma imagem: lança (nada é cobrado por quem chama).
  await assert.rejects(gerarPreviasDoEstilo({ projectId: "p1", rodada: 3, estilo }, { ...servicos, gerar: async () => { throw new Error("fora"); } }), /nenhuma prévia saiu/);
  // As puras.
  const limpa = { colagem: false, paineis: 1, temTexto: false, textoLido: "", pessoaReconhecivel: false, rostoDesfocado: false, assunto: "", proibidosVistos: [], defeitos: "", ambiente: "" };
  assert.equal(decisaoDeReserva({ ...limpa, temTexto: true }, false), "refazer");
  assert.equal(decisaoDeReserva({ ...limpa, temTexto: true }, true), "tirar");
  assert.equal(decisaoDeReserva(limpa, false), "aprovar", "o apresentador fictício de frente não é motivo");
  assert.equal(decisaoDeReserva({ ...limpa, rostoDesfocado: true }, false), "refazer", "rosto desfocado é defeito (a primeira rodada real passou um)");
  assert.match(promptRefeito("base", { ...limpa, rostoDesfocado: true }, []), /never blurred/);
  assert.equal(lerDescricoes({ imagens: [{ paineis: 2, assunto: "a" }] }, 2)[1], null);
  assert.equal(lerDescricoes({ imagens: [{ paineis: 1, rostoDesfocado: true }] }, 1)[0]?.rostoDesfocado, true);
  assert.match(promptRefeito("base", null, ["ring light"]), /Never include: ring light/);
  // A guarda certa por peça (aprendida na primeira rodada real): com apresentador, o rosto natural; sem ele, a guarda do vídeo.
  assert.match(reservaComPessoa.previas.thumb, /generic fictional person.*never blurred/);
  assert.match(reservaComPessoa.previas.post, /people only anonymous, from behind/);
});

function servidorEmMemoria(): Servicos & { estados: Map<string, EstadoDoMeuEstilo>; chamadas: string[] } {
  const estados = new Map<string, EstadoDoMeuEstilo>();
  const chamadas: string[] = [];
  const deposito: DepositoDoMeuEstilo = {
    async ler(id) {
      return estadoValido(estados.get(id));
    },
    async gravar(id, e) {
      estados.set(id, e);
    },
    async contexto() {
      return { nicho: "Farmácia", publico: null, marca: "Bem Natura", paleta: ["#2E7D32"], cores: { acento: "#2E7D32", escuro: "#111111", claro: "#FFFFFF" }, letra: "Clássica", perfil: null, fonteAtual: null, nome: "Bem Natura", projectId: "p1" };
    },
  };
  const previas: ServicosDasPrevias = {
    gerar: async () => ({ jpeg: Buffer.from("x"), custoUsd: 0.06, modelo: "fake" }),
    guardar: async (nome) => `https://x.blob.vercel-storage.com/${nome}`,
    olho: null,
    juiz: null,
  };
  return {
    estados,
    chamadas,
    deposito,
    previas,
    escrever: async (pedido) => {
      chamadas.push(pedido);
      return { estilo: normalizarEstiloEscrito(ESTILO_CRU) as EstiloEscrito, origem: "redator", comPerfil: false };
    },
  };
}

test("o servidor: escrever grava a rodada, o ajuste continua a conversa, as prévias reservam e acertam os créditos", async () => {
  const s = servidorEmMemoria();
  const r1 = await escreverRodada({ projectId: "p1", fala: "sou farmacêutica, ambiente claro", ajuste: false, origem: "voz" }, s);
  assert.ok(r1.ok);
  assert.equal(r1.rodada.n, 1);
  assert.equal(r1.rodada.fonte, "playfair", "a letra Clássica da marca vira a serifa do editor");
  assert.equal(r1.rodada.origem, "voz");
  const r2 = await escreverRodada({ projectId: "p1", fala: "mais verde", ajuste: true, origem: "escrito" }, s);
  assert.ok(r2.ok);
  assert.equal(r2.rodada.n, 2);
  assert.deepEqual(r2.rodada.falas, ["sou farmacêutica, ambiente claro", "mais verde"]);
  assert.match(s.chamadas[1], /Ajustes pedidos depois.*mais verde/);
  const curta = await escreverRodada({ projectId: "p1", fala: "oi", ajuste: false, origem: "escrito" }, s);
  assert.equal(curta.ok, false);
  // As prévias: a reserva antes, o acerto depois.
  const movimentos: Array<{ tipo: string; quantidade: number; operation: string; refId?: string; projectId?: string }> = [];
  const dinheiro = {
    debitar: (async (a: { quantidade: number; operation: string; refId?: string; projectId?: string }) => {
      movimentos.push({ tipo: "debito", quantidade: a.quantidade, operation: a.operation, refId: a.refId, projectId: a.projectId });
      return { balance: 100, txId: "t" };
    }) as never,
    creditar: (async (a: { quantidade: number; operation: string; refId?: string; projectId?: string }) => {
      movimentos.push({ tipo: "credito", quantidade: a.quantidade, operation: a.operation, refId: a.refId, projectId: a.projectId });
      return { balance: 100, duplicado: false, contaId: "u" };
    }) as never,
  };
  const p = await gerarPreviasDaRodada({ projectId: "p1", userId: "u", rodada: 2 }, s, dinheiro);
  assert.ok(p.ok);
  assert.equal(p.rodada.previas?.length, 4);
  assert.equal(movimentos[0].tipo, "debito");
  assert.equal(movimentos[0].quantidade, 80, "reserva o teto");
  assert.equal(movimentos[0].refId, "p1:2");
  assert.equal(movimentos[1].tipo, "credito");
  assert.equal(movimentos[1].quantidade, 80 - creditosDoCusto(0.24), "o que sobrou volta");
  assert.equal(movimentos[1].projectId, "p1", "a devolução fica no extrato do mesmo projeto (pendência da primeira rodada real)");
  assert.ok(fonte("lib/credits/index.ts").includes("const { quantidade, operation, refId, note, unico, projectId } = args;"), "creditar grava o projectId");
  assert.equal(p.rodada.creditos, creditosDoCusto(0.24));
  assert.equal(s.estados.get("p1")?.rodadas[1].custoUsd, 0.24, "o custo real fica gravado para o admin");
  // De novo na mesma rodada: nada gerado, nada cobrado.
  const deNovo = await gerarPreviasDaRodada({ projectId: "p1", userId: "u", rodada: 2 }, s, dinheiro);
  assert.ok(deNovo.ok);
  assert.equal(movimentos.length, 2);
  // Gerador fora: a reserva volta inteira.
  const r3 = await escreverRodada({ projectId: "p1", fala: "outra coisa, tudo escuro agora", ajuste: false, origem: "escrito" }, s);
  assert.ok(r3.ok);
  const falhou = await gerarPreviasDaRodada({ projectId: "p1", userId: "u", rodada: 3 }, { ...s, previas: { ...s.previas!, gerar: async () => { throw new Error("fora"); } } }, dinheiro);
  assert.equal(falhou.ok, false);
  assert.equal(movimentos[3].tipo, "credito");
  assert.equal(movimentos[3].quantidade, 80);
  // Só algumas peças (a prova da segunda rodada real): gera e cobra só elas.
  const r4 = await escreverRodada({ projectId: "p1", fala: "de novo, só para provar a thumb e o vertical", ajuste: false, origem: "escrito" }, s);
  assert.ok(r4.ok);
  const duas = await gerarPreviasDaRodada({ projectId: "p1", userId: "u", rodada: 4, pecas: ["thumb", "vertical"] }, s, dinheiro);
  assert.ok(duas.ok);
  assert.deepEqual(duas.rodada.previas?.map((x) => x.peca), ["thumb", "vertical"]);
  assert.equal(duas.rodada.creditos, creditosDoCusto(0.12));
});

test("as telas e a esteira: a caixa no topo do passo e em Configurações; confirmar grava onde a esteira lê", () => {
  const passo = fonte("components/estilo-dos-posts/passo-do-estilo-mestre.tsx");
  assert.ok(passo.indexOf("<CaixaDoMeuEstilo") < passo.indexOf("<EstiloDoProjeto"), "a caixa vem antes da grade de estilos prontos");
  const config = fonte("components/projects/configuracao-do-projeto.tsx");
  assert.ok(config.indexOf("<CaixaDoMeuEstilo") < config.indexOf("<EstiloDosPosts"), "em Configurações, a caixa é a primeira coisa da aba");
  const comando = fonte("components/video/comando-do-video.tsx");
  assert.ok(comando.includes("window.addEventListener(EVENTO_DO_ESTILO_CONFIRMADO"), "o comando do vídeo relê quando o estilo é confirmado");
  const servidor = fonte("lib/estilo-proprio/servidor.ts");
  assert.ok(servidor.includes("await salvarComandoDoProjeto(o.projectId, { texto, fonte: rodada.fonte, cores: { tipo: \"marca\" }"), "o comando do vídeo, nas cores da marca");
  assert.ok(servidor.includes('tipo: "video"') && servidor.includes('comoEntrou: "pedido"'), "o design de vídeo da biblioteca (a linguagem do editor e do vídeo por IA)");
  assert.ok(servidor.includes('tipo: "imagem"') && servidor.includes('comoEntrou: "mestre"') && servidor.includes("await fixarDesignMestre(o.projectId, da.design)"), "o design das artes vira o design mestre");
  assert.ok(servidor.includes('await salvarModoDosPosts(o.projectId, "mestre")'), "todas as peças seguem o estilo mestre");
  assert.ok(servidor.includes('type: "preference"') && servidor.includes('cardType: "estilo"'), "a memória do cliente");
  const rota = fonte("app/api/projects/[id]/meu-estilo/route.ts");
  assert.ok(rota.includes('soODono(r.userId, r.project, "confirmar o estilo do projeto")'), "só o dono confirma");
  assert.ok(rota.includes("registrarNota(id, `preferencia:${res.preferenciaKey}`)"), "o cérebro lê a confirmação");
  assert.ok(rota.includes("e instanceof SaldoInsuficiente") && rota.includes("status: 402"), "sem saldo, 402 e nada gerado");
  // O estilo gravado não depende de executar.ts nem da direção de arte (outro agente mexe lá).
  assert.ok(!servidor.includes("lib/pipeline/executar") && !servidor.includes("direcao-de-arte"));
  const montagem = fonte("lib/cerebro/montagem.ts");
  assert.ok(montagem.includes('str(v.cardType) === "estilo"'), "a nota do estilo confirmado é decisão de marca, não pedido de chat");
});
