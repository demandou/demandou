// O AGENTE DE TRÁFEGO, fase 1 (09/10/2026): quais posts valem ser
// impulsionados e por quê, só sugestão.
//   - o formato do post e a leitura que vale em cada marco (janela, pendente fora);
//   - o primeiro comentário da própria conta sai da contagem;
//   - a linha de base: mediana, 5 posts no formato senão a conta, menos de 5
//     na conta é "aprendendo";
//   - os sinais e quem pode ser candidato (idade, story, LinkedIn pessoal, sem link);
//   - o JEV decide (sim com folga, motivo com confiança de 0,5, só motivo que
//     os números sustentam, prioridade);
//   - a frase do Haiku: todo número conferido, travessão e extenso recusados;
//   - a passada inteira com o JEV e o Haiku trocados por respostas fixas;
//   - a chave do descarte e nenhum travessão nos arquivos novos.
// Nada aqui toca banco, IA ou rede.
// Rodar: npx tsx --test scripts/testes/impulso-0910.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  MINIMO_DE_POSTS,
  analisarPosts,
  calcularBase,
  conferirFrase,
  estadoDoJev,
  fotoNoMarco,
  formatoDoPost,
  fraseDoCodigo,
  impulsosNaTela,
  lerDecisao,
  lerFrases,
  montarSugestao,
  nomeComparavel,
  numerosDoTexto,
  numerosQueSustentam,
  perguntasDoJev,
  permitidosDo,
  postParaImpulso,
  seguidoresDaConta,
  semComentarioProprio,
  sinaisDoPost,
  TRACOS_LONGOS,
  type GuardadoDoImpulso,
  type LeituraParaImpulso,
  type LinhaDoPost,
  type PedidoDeFrase,
  type PostParaImpulso,
} from "@/lib/analytics/tipos-do-impulso";
import { chaveDoImpulso, ehChaveDasTelas } from "@/lib/avisos/chaves";
import type { RespostaDoJev } from "@/lib/jev/cliente";

const AGORA = new Date("2026-10-09T12:00:00.000Z");
/** O travessão montado pelo código do caractere: este arquivo não carrega nenhum. */
const TRAVESSAO = String.fromCharCode(0x2014);
const H = 3600_000;
const horasAtras = (h: number) => new Date(AGORA.getTime() - h * H).toISOString();

let n = 0;
function post(p: { idadeH: number; formato?: string; mediaType?: string; rede?: string; conta?: string | null; accountType?: string; link?: string | null; leituras: Array<{ h: number; curtidas?: number; comentarios?: number; visualizacoes?: number; salvamentos?: number; compartilhamentos?: number; status?: string; fonte?: string }>; metadata?: Record<string, unknown> }): PostParaImpulso {
  const id = `post${++n}`;
  const publicado = horasAtras(p.idadeH);
  const linha: LinhaDoPost = {
    id,
    platform: p.rede ?? "instagram",
    mediaType: p.mediaType ?? "carousel",
    metadata: { formato: p.formato ?? "carousel", ...(p.metadata ?? {}) },
    publishedAt: publicado,
    externalUrl: p.link === undefined ? `https://www.instagram.com/p/${id}/` : p.link,
    content: `Legenda do ${id}\nsegunda linha`,
    socialAccountId: p.conta === undefined ? "acc1" : p.conta,
    accountType: p.accountType ?? "personal",
    username: "cliente",
    displayName: "Cliente",
    funil: null,
  };
  const leituras: LeituraParaImpulso[] = p.leituras.map((l) => ({
    postId: id,
    fonte: l.fonte ?? "api:instagram",
    status: l.status ?? "ok",
    lidoEm: new Date(new Date(publicado).getTime() + l.h * H).toISOString(),
    curtidas: l.curtidas ?? null,
    comentarios: l.comentarios ?? null,
    visualizacoes: l.visualizacoes ?? null,
    salvamentos: l.salvamentos ?? null,
    compartilhamentos: l.compartilhamentos ?? null,
  }));
  return postParaImpulso(linha, leituras);
}

/** Seis carrosséis comuns (10 a 30 dias), com leitura de 24 h e de 3 dias. */
function contaComum(): PostParaImpulso[] {
  const base = [
    [9, 1],
    [10, 2],
    [7, 1],
    [10, 1],
    [7, 2],
    [9, 1],
  ];
  return base.map(([c, k], i) =>
    post({
      idadeH: 240 + i * 72,
      leituras: [
        { h: 2, curtidas: 3, comentarios: 0 },
        { h: 24.2, curtidas: c, comentarios: k },
        { h: 72.1, curtidas: c + 1, comentarios: k },
      ],
    })
  );
}

test("o formato sai do mediaType e do metadata.formato", () => {
  assert.equal(formatoDoPost("carousel", { formato: "story" }), "story");
  assert.equal(formatoDoPost("carousel", { formato: "reel" }), "reel");
  assert.equal(formatoDoPost("video", null), "video");
  assert.equal(formatoDoPost("carousel", { formato: "feed" }), "carrossel");
  assert.equal(formatoDoPost("infographic", null), "imagem");
  assert.equal(formatoDoPost("thread", { formato: "text" }), "texto");
  assert.equal(formatoDoPost(null, null), "outro");
});

test("a leitura do marco é a primeira ok da janela; fora da janela e pendente não entram", () => {
  const p = post({
    idadeH: 100,
    leituras: [
      { h: 2, curtidas: 1 },
      { h: 23, status: "pendente" },
      { h: 25, curtidas: 5, comentarios: 1 },
      { h: 30, curtidas: 7, comentarios: 1 },
      { h: 50, curtidas: 9, comentarios: 2 },
    ],
  });
  const f24 = fotoNoMarco(p.publicadoEm, p.leituras, 24)!;
  assert.equal(f24.numeros.curtidas, 5);
  assert.equal(f24.idadeH, 25);
  // 50 h não vale como 24 h (janela até 36 h) nem como 72 h (começa em 64,8 h).
  assert.equal(fotoNoMarco(p.publicadoEm, p.leituras, 72), null);
});

test("o primeiro comentário da própria conta sai da contagem depois de publicado", () => {
  const em = horasAtras(48);
  const l: LeituraParaImpulso[] = [
    { postId: "x", fonte: "api:linkedin", status: "ok", lidoEm: horasAtras(50), comentarios: 0 },
    { postId: "x", fonte: "api:linkedin", status: "ok", lidoEm: horasAtras(24), comentarios: 3 },
    { postId: "x", fonte: "api:linkedin", status: "ok", lidoEm: horasAtras(20), comentarios: 0 },
  ];
  const r = semComentarioProprio(l, em);
  assert.deepEqual(r.map((x) => x.comentarios), [0, 2, 0]);
  const p = post({ idadeH: 30, rede: "linkedin", accountType: "organization", metadata: { firstCommentPublishedAt: horasAtras(29.9) }, leituras: [{ h: 24.5, curtidas: 0, comentarios: 1 }] });
  assert.equal(p.semPrimeiroComentario, true);
  assert.equal(p.leituras[0].comentarios, 0);
});

test("linha de base: mediana, 5 posts no formato senão a conta, e aprendendo abaixo de 5", () => {
  const posts = contaComum();
  const base = calcularBase(posts, AGORA, null);
  assert.equal(base.postsMedidos, 6);
  assert.equal(base.geral["24"].interacoes!.mediana, 10);
  assert.equal(base.geral["24"].comentarios!.mediana, 1);
  // Visualização não veio em nenhum: sem base para ela, nunca zero.
  assert.equal(base.geral["24"].visualizacoes, null);
  // Subida 24 h a 72 h: uma curtida a mais em cada.
  assert.ok(base.geral["72"].crescimento!.mediana > 0);

  // Um reel novo (formato com 1 post) usa a base da conta inteira.
  const reel = post({ idadeH: 30, formato: "reel", mediaType: "video", leituras: [{ h: 24.3, curtidas: 30, comentarios: 6 }] });
  const s = sinaisDoPost(reel, calcularBase([...posts, reel], AGORA, null), AGORA)!;
  assert.equal(s.escopo, "conta");

  const poucos = posts.slice(0, MINIMO_DE_POSTS - 2);
  const novo = post({ idadeH: 30, leituras: [{ h: 24.3, curtidas: 30, comentarios: 6 }] });
  const a = analisarPosts([...poucos, novo], {}, AGORA);
  assert.equal(a.candidatos.length, 0);
  assert.equal(a.aprendendo.length, 1);
  assert.equal(a.aprendendo[0].medidos, MINIMO_DE_POSTS - 1);
});

test("o candidato: comentários e interações acima da mediana, com os motivos que os números sustentam", () => {
  const posts = contaComum();
  const destaque = post({ idadeH: 50, leituras: [{ h: 2, curtidas: 8 }, { h: 24.4, curtidas: 25, comentarios: 6 }] });
  const a = analisarPosts([...posts, destaque], { "instagram:acc1": { valor: 1000, fonte: "apify:instagram", lidoEm: horasAtras(48) } }, AGORA);
  assert.equal(a.candidatos.length, 1);
  const c = a.candidatos[0];
  assert.equal(c.postId, destaque.id);
  assert.equal(c.foto.marco, 24);
  assert.equal(c.engajamento!.valor, 31);
  assert.equal(c.comentarios!.razao, 6);
  assert.deepEqual(c.motivos, ["conversa", "velocidade", "fora_da_curva"]);
  assert.equal(c.taxa!.valor, 0.031);
  const nums = numerosQueSustentam(c, "conversa");
  assert.equal(nums.length, 2);
  assert.match(nums[0].curto, /^6x os comentários da sua média$/);
  // Na leitura de 24 h, "interações" e "interações do primeiro dia" não aparecem as duas.
  const vel = numerosQueSustentam(c, "velocidade");
  assert.equal(vel.filter((x) => x.sinal === "engajamento" || x.sinal === "velocidade").length, 1);
  assert.match(fraseDoCodigo("conversa", nums), /^Este post puxou conversa acima do normal: 6x os comentários da sua média; /);
});

test("fica de fora: story, LinkedIn pessoal, sem link, novo demais, velho demais, conta desconectada", () => {
  const posts = contaComum();
  const base = calcularBase(posts, AGORA, null);
  const forte = [{ h: 24.4, curtidas: 40, comentarios: 9 }];
  assert.equal(sinaisDoPost(post({ idadeH: 30, formato: "story", leituras: forte }), base, AGORA), null);
  assert.equal(sinaisDoPost(post({ idadeH: 30, rede: "linkedin", accountType: "personal", leituras: forte }), base, AGORA), null);
  assert.equal(sinaisDoPost(post({ idadeH: 30, link: null, leituras: forte }), base, AGORA), null);
  assert.equal(sinaisDoPost(post({ idadeH: 20, leituras: [{ h: 2, curtidas: 40 }] }), base, AGORA), null);
  assert.equal(sinaisDoPost(post({ idadeH: 200, leituras: forte }), base, AGORA), null);
  const solto = post({ idadeH: 30, conta: null, leituras: forte });
  assert.equal(analisarPosts([...posts, solto], {}, AGORA).candidatos.length, 0);
  // Interação pequena não é sinal, mesmo com razão alta.
  const pouco = post({ idadeH: 30, leituras: [{ h: 24.4, curtidas: 2, comentarios: 0 }] });
  const s = sinaisDoPost(pouco, base, AGORA)!;
  assert.equal(s.destaques.length, 0);
});

test("os seguidores: a Meta primeiro, senão o perfil estudado com o MESMO nome", () => {
  const proprios = [{ rede: "instagram", perfil: "demandou_", seguidores: 65, em: horasAtras(80) }, { rede: "linkedin", perfil: "https://www.linkedin.com/company/areticon/", seguidores: 143, em: horasAtras(60) }];
  assert.equal(seguidoresDaConta({ platform: "instagram", platformUserId: "1", username: "demandoupostou" }, [], proprios), null);
  assert.equal(seguidoresDaConta({ platform: "linkedin", platformUserId: "2", username: "areticon" }, [], proprios)!.valor, 143);
  const meta = [{ chave: "instagram:1", valor: 900, lidoEm: horasAtras(5), rede: "instagram" }];
  assert.equal(seguidoresDaConta({ platform: "instagram", platformUserId: "1", username: "demandou_" }, meta, proprios)!.fonte, "api:instagram");
  assert.equal(nomeComparavel("@Bruno.Donaire"), "brunodonaire");
});

function candidatoPronto() {
  const posts = contaComum();
  const destaque = post({ idadeH: 50, leituras: [{ h: 24.4, curtidas: 25, comentarios: 6 }] });
  const outro = post({ idadeH: 40, leituras: [{ h: 24.4, curtidas: 20, comentarios: 1 }] });
  return analisarPosts([...posts, destaque, outro], {}, AGORA);
}

test("as perguntas do JEV: noul e choice por candidato, prioridade entre eles, motivos só os sustentados", () => {
  const a = candidatoPronto();
  assert.equal(a.candidatos.length, 2);
  const q = perguntasDoJev(a.candidatos);
  const [c1, c2] = a.candidatos;
  assert.equal(q[`impulsionar_${c1.postId}`].type, "noul");
  const m2 = q[`motivo_${c2.postId}`];
  assert.equal(m2.type, "choice");
  // O segundo não tem comentário acima: "conversa" nem aparece.
  assert.ok(m2.type === "choice" && !("conversa" in m2.criteria));
  assert.equal(q.prioridade.type, "choice");
  const estado = estadoDoJev(a) as { candidatos: unknown[]; contexto: string };
  assert.equal(estado.candidatos.length, 2);
  assert.doesNotMatch(JSON.stringify(estado), TRACOS_LONGOS);
});

test("a decisão do JEV: sim com folga, motivo confiante e sustentado, prioridade na frente", () => {
  const a = candidatoPronto();
  const [c1, c2] = a.candidatos;
  const r = (x: Record<string, RespostaDoJev>) => lerDecisao(x, a.candidatos);
  const sim = (p: number): RespostaDoJev => ({ type: "noul", noul: p });
  const motivo = (choice: string, confidence: number): RespostaDoJev => ({ type: "choice", choice, probabilities: {}, confidence });
  // Sim fraco (0,6) é "não sei": nenhuma sugestão.
  assert.equal(r({ [`impulsionar_${c1.postId}`]: sim(0.6), [`motivo_${c1.postId}`]: motivo("conversa", 0.9) }).length, 0);
  // Motivo com confiança 0,4: nenhuma sugestão.
  assert.equal(r({ [`impulsionar_${c1.postId}`]: sim(0.9), [`motivo_${c1.postId}`]: motivo("conversa", 0.4) }).length, 0);
  // Motivo que os números não sustentam: nenhuma sugestão.
  assert.equal(r({ [`impulsionar_${c2.postId}`]: sim(0.9), [`motivo_${c2.postId}`]: motivo("conversa", 0.9) }).length, 0);
  const ambos = {
    [`impulsionar_${c1.postId}`]: sim(0.8),
    [`motivo_${c1.postId}`]: motivo("conversa", 0.7),
    [`impulsionar_${c2.postId}`]: sim(0.95),
    [`motivo_${c2.postId}`]: motivo("fora_da_curva", 0.6),
  };
  assert.deepEqual(r(ambos).map((d) => d.postId), [c2.postId, c1.postId]);
  assert.deepEqual(r({ ...ambos, prioridade: motivo(c1.postId, 0.8) }).map((d) => d.postId), [c1.postId, c2.postId]);
  // Prioridade sem confiança não reordena.
  assert.deepEqual(r({ ...ambos, prioridade: motivo(c1.postId, 0.3) }).map((d) => d.postId), [c2.postId, c1.postId]);
});

test("a frase do Haiku: todo número conferido; travessão, extenso e número inventado recusados", () => {
  assert.deepEqual(numerosDoTexto("6,0x, 31 contra 10,5; 1.234 e 2.3"), [6, 31, 10.5, 1234, 2.3]);
  const permitidos = ["6x os comentários da sua média", "6 comentários em 24 h, contra 1 da mediana de 7 posts"];
  assert.equal(conferirFrase("Você recebeu 6x os comentários da sua média neste post.", permitidos).ok, true);
  assert.equal(conferirFrase("Você recebeu 6x os comentários e pode vender 30% mais.", permitidos).ok, false);
  assert.equal(conferirFrase("Você recebeu o dobro dos comentários de sempre.", permitidos).ok, false);
  assert.equal(conferirFrase(`Você recebeu 6x os comentários ${TRAVESSAO} impulsione.`, permitidos).ok, false);

  const a = candidatoPronto();
  const c = a.candidatos.find((x) => x.motivos.includes("conversa"))!;
  const pedido: PedidoDeFrase = { id: c.postId, rede: c.rede, formato: "carrossel", motivo: "conversa", numeros: numerosQueSustentam(c, "conversa") };
  const ok = `Este post rendeu ${pedido.numeros[0].curto}, a conversa está acima do seu normal.`;
  const r = lerFrases(JSON.stringify({ frases: [{ id: c.postId, frase: ok }] }), [pedido]);
  assert.equal(r.frases[c.postId], ok);
  const r2 = lerFrases(JSON.stringify({ frases: [{ id: c.postId, frase: "Este post teve 99 comentários, impulsione já." }] }), [pedido]);
  assert.equal(r2.frases[c.postId], undefined);
  assert.match(r2.recusadas[c.postId], /fora do estado/);
  assert.ok(permitidosDo(pedido).length >= 2);
});

test("a sugestão montada: chave do descarte, fonte, orçamento rotulado e validade de 7 dias", () => {
  const a = candidatoPronto();
  const c = a.candidatos[0];
  const s = montarSugestao(c, { postId: c.postId, probabilidade: 0.9, motivo: c.motivos[0], confiancaDoMotivo: 0.8 }, null);
  assert.equal(s.chave, `impulsionar:${c.postId}:24`);
  assert.ok(ehChaveDasTelas(s.chave));
  assert.equal(s.fraseDe, "codigo");
  assert.equal(s.fonte, "api:instagram");
  assert.match(s.orcamento, /^R\$ 20 por dia durante 5 dias \(R\$ 100 no total\)/);
  assert.equal(s.comoFazer, "Abra o post no Instagram e toque em Turbinar.");
  const g: GuardadoDoImpulso = { versao: 1, calculadoEm: AGORA.toISOString(), estado: "decidido", marcaDaEntrada: "", candidatos: 1, aprendendo: [], sugestoes: [s], custoUsd: { jev: 0, texto: 0 }, motivo: null };
  assert.equal(impulsosNaTela(g, AGORA).sugestoes.length, 1);
  assert.equal(impulsosNaTela(g, new Date(AGORA.getTime() + 8 * 24 * H)).sugestoes.length, 0);
  assert.equal(impulsosNaTela(null, AGORA).estado, "sem_leitura");
  assert.equal(chaveDoImpulso("p1", null), null);
});

test("a passada inteira com o JEV e o Haiku trocados: decide, escreve, confere e não grava", async () => {
  const { atualizarImpulsos } = await import("@/lib/analytics/impulso");
  const a = candidatoPronto();
  const [c1, c2] = a.candidatos;
  let pedidosAoJev = 0;
  const perguntar = async (_ctx: unknown, perguntas: Record<string, unknown>) => {
    pedidosAoJev++;
    assert.ok(`impulsionar_${c1.postId}` in perguntas);
    return {
      [`impulsionar_${c1.postId}`]: { type: "noul", noul: 0.9 },
      [`motivo_${c1.postId}`]: { type: "choice", choice: "conversa", probabilities: {}, confidence: 0.8 },
      [`impulsionar_${c2.postId}`]: { type: "noul", noul: 0.2 },
      [`motivo_${c2.postId}`]: { type: "choice", choice: "fora_da_curva", probabilities: {}, confidence: 0.8 },
    } as Record<string, RespostaDoJev>;
  };
  const redigir = async (_s: string, pedido: string) => {
    const p = JSON.parse(pedido) as { posts: Array<{ id: string; resumo_dos_numeros: string[] }> };
    return JSON.stringify({ frases: p.posts.map((x) => ({ id: x.id, frase: `Vale impulsionar: ${x.resumo_dos_numeros[0]}.` })) });
  };
  const g = await atualizarImpulsos("proj", { agora: AGORA, anterior: null, analise: a, perguntar, redigir, gravar: false });
  assert.equal(g.estado, "decidido");
  assert.equal(g.sugestoes.length, 1);
  assert.equal(g.sugestoes[0].postId, c1.postId);
  assert.equal(g.sugestoes[0].fraseDe, "haiku");
  assert.match(g.sugestoes[0].frase, /^Vale impulsionar: 6x os comentários da sua média\.$/);

  // Mesma entrada na passada seguinte: o JEV não é perguntado de novo.
  const g2 = await atualizarImpulsos("proj", { agora: AGORA, anterior: g, analise: a, perguntar, redigir, gravar: false });
  assert.equal(pedidosAoJev, 1);
  assert.equal(g2.sugestoes[0].frase, g.sugestoes[0].frase);

  // Haiku que inventa número: vale a frase em código.
  const inventa = async (_s: string, pedido: string) => {
    const p = JSON.parse(pedido) as { posts: Array<{ id: string }> };
    return JSON.stringify({ frases: p.posts.map((x) => ({ id: x.id, frase: "Este post vai te dar 500 seguidores novos." })) });
  };
  const g3 = await atualizarImpulsos("proj", { agora: AGORA, anterior: null, analise: a, perguntar, redigir: inventa, gravar: false });
  assert.equal(g3.sugestoes[0].fraseDe, "codigo");
  assert.match(g3.sugestoes[0].frase, /^Este post puxou conversa acima do normal: /);

  // JEV que falha: nenhuma sugestão.
  const falha = async () => {
    throw new Error("JEV respondeu 500");
  };
  const g4 = await atualizarImpulsos("proj", { agora: AGORA, anterior: null, analise: a, perguntar: falha, redigir, gravar: false });
  assert.equal(g4.estado, "jev_falhou");
  assert.equal(g4.sugestoes.length, 0);
});

test("nenhum travessão nos arquivos novos do agente de tráfego", () => {
  const raiz = path.resolve(import.meta.dirname, "..", "..");
  for (const f of [
    "lib/analytics/tipos-do-impulso.ts",
    "lib/analytics/impulso.ts",
    "lib/analytics/impulsos-locais.ts",
    "components/analytics/impulso.tsx",
    "scripts/tmp/impulso-amostra-0910.mts",
    "scripts/tmp/impulso-prova-paga-0910.mts",
    "scripts/tmp/impulso-render-0910.tsx",
    "scripts/testes/impulso-0910.test.mts",
  ]) {
    const t = fs.readFileSync(path.join(raiz, f), "utf8");
    assert.doesNotMatch(t, TRACOS_LONGOS, f);
  }
});
