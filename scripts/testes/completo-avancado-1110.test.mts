// O COMPLETO SOB MEDIDA (11/10): as partes puras. A divisão em blocos na maior
// pausa perto dos 60 s, a fala de cada bloco, o teto por bloco, a continuidade
// (o enquadramento base e a emenda fixada no roteiro), o quadro deitado no
// portão, na geometria e no texto de quem escreve, a fila do que pesa e o
// caminho do completo no app. Sem banco, sem rede, sem IA.
// Rodar: npx tsx --test scripts/testes/completo-avancado-1110.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const imp = (p: string) => import(pathToFileURL(path.resolve(p)).href);
const blocos = await imp("worker/src/avancado/blocos-do-completo.mjs");
const portao = await imp("worker/src/avancado/portao.mjs");
const geometria = await imp("worker/src/avancado/geometria.mjs");
const completo = await imp("worker/src/avancado/completo-avancado.mjs");
const { blocoDoCorte, textoDoQuadro, textoDaContinuidade } = await import("@/lib/media/editor-avancado/escrever-cenas");
const { caminhoDoCompletoSobMedida, prazoDoCompletoSobMedidaMs } = await import("@/lib/media/editor-do-curso/no-corte");

type P = { de: number; ate: number; w: string };

/** Uma fala sintética: uma palavra a cada 0,4 s, com pausas maiores onde pedido. */
function falaCom(duracao: number, pausas: Array<{ em: number; vao: number }>): P[] {
  const fala: P[] = [];
  let t = 0.2;
  let i = 0;
  while (t < duracao - 0.5) {
    const p = pausas.find((x) => Math.abs(x.em - t) < 0.2001);
    fala.push({ de: +t.toFixed(3), ate: +(t + 0.3).toFixed(3), w: p ? `palavra${i}.` : `palavra${i}` });
    t += 0.4 + (p ? p.vao : 0);
    i++;
  }
  return fala;
}

test("blocos: cortam na maior pausa perto dos 60 s, cobrem o vídeo inteiro sem buraco e ficam na grade de quadros", () => {
  const fala = falaCom(185, [
    { em: 52.2, vao: 0.6 },
    { em: 63.0, vao: 1.2 },
    { em: 70.2, vao: 0.4 },
    { em: 121.0, vao: 0.9 },
  ]);
  const duracao = fala[fala.length - 1].ate + 0.5;
  const b = blocos.blocosPelaPausa(fala, duracao);
  assert.ok(b.length === 3, JSON.stringify(b));
  assert.equal(b[0].de, 0);
  for (let i = 1; i < b.length; i++) assert.equal(b[i].de, b[i - 1].ate);
  assert.equal(b[b.length - 1].ate, Math.floor(duracao * 30) / 30);
  assert.equal(b.reduce((n: number, x: { quadros: number }) => n + x.quadros, 0), Math.floor(duracao * 30));
  for (const x of b) assert.ok(Math.abs(x.ate * 30 - Math.round(x.ate * 30)) < 1e-6, `fora da grade: ${x.ate}`);
  // o primeiro corte cai DENTRO da maior pausa da janela de 45 a 75 s (a de 1,2 s)
  const vaos = fala.slice(1).map((p, i) => ({ de: fala[i].ate, ate: p.de })).filter((v) => (v.de + v.ate) / 2 > 45 && (v.de + v.ate) / 2 < 75);
  const maior = vaos.reduce((m, v) => (v.ate - v.de > m.ate - m.de ? v : m));
  assert.ok(maior.ate - maior.de > 1.2, JSON.stringify(maior));
  assert.ok(b[0].ate > maior.de && b[0].ate < maior.ate, `corte em ${b[0].ate}, pausa ${JSON.stringify(maior)}`);
  // nenhuma palavra fica cortada no meio
  for (const x of b.slice(0, -1)) assert.ok(!fala.some((p) => p.de < x.ate && p.ate > x.ate), `palavra cortada em ${x.ate}`);
});

test("blocos: vídeo curto é um bloco só; de 80 a 120 s vira dois parecidos; nenhum abaixo de 40 s", () => {
  assert.equal(blocos.blocosPelaPausa(falaCom(70, []), 70).length, 1);
  assert.equal(blocos.blocosPelaPausa(falaCom(30, []), 30).length, 1);
  const dois = blocos.blocosPelaPausa(falaCom(100, []), 100);
  assert.equal(dois.length, 2);
  for (const x of dois) assert.ok(x.ate - x.de >= 40, JSON.stringify(dois));
  const longo = blocos.blocosPelaPausa(falaCom(1200, []), 1200);
  assert.ok(longo.length >= 16 && longo.length <= 22, `${longo.length} blocos`);
  for (const x of longo) assert.ok(x.ate - x.de >= 40 && x.ate - x.de <= 80, JSON.stringify(x));
  assert.deepEqual(blocos.blocosPelaPausa([], 0), []);
});

test("a fala de cada bloco no tempo do bloco; o teto é US$ 2 por minuto na proporção, com o piso", () => {
  const fala = [
    { de: 59.5, ate: 59.9, w: "antes" },
    { de: 60.2, ate: 60.6, w: "depois" },
    { de: 61, ate: 62, w: "" },
  ];
  assert.deepEqual(blocos.palavrasDoBloco(fala, { de: 60, ate: 120 }), [{ em: 0.2, ate: 0.6, w: "depois" }]);
  assert.deepEqual(blocos.palavrasDoBloco(fala, { de: 0, ate: 60 }), [{ em: 59.5, ate: 59.9, w: "antes" }]);
  assert.equal(blocos.tetoDoBloco({ de: 0, ate: 60 }), 2);
  assert.equal(blocos.tetoDoBloco({ de: 0, ate: 75 }), 2.5);
  assert.equal(blocos.tetoDoBloco({ de: 0, ate: 20 }), 1.3);
});

const falaDoBloco = [
  { de: 0.2, ate: 0.6, w: "Hoje" },
  { de: 0.7, ate: 1.2, w: "vamos" },
  { de: 1.3, ate: 2.0, w: "construir" },
  { de: 30, ate: 30.5, w: "casa" },
];
const molduraEsquerda = { caixa: { x: 70, y: 110, l: 760, a: 860 }, forma: "chanfrada", borda: true, inclinacao: 5 };

test("continuidade: o primeiro bloco dá o enquadramento base (o último quadro), a legenda, as cenas e o comum", () => {
  const roteiro = {
    tecnica: "maquete-3d",
    apresentador: [{ em: "inicio" }, { em: { palavra: "construir" }, transicao: 1.2, ...molduraEsquerda }],
    legenda: { topo: 900, esquerda: 900, largura: 960, tamanho: 44 },
    cenas: [{ arquivo: "cena-01.tsx", de: { palavra: "construir" }, ate: "fim", oQue: "a casa se monta" }],
  };
  const c = blocos.continuidadeDoPrimeiro({ "roteiro.json": JSON.stringify(roteiro), "comum.tsx": "export const X = 1;" }, falaDoBloco, 40);
  assert.deepEqual(c.apresentador, molduraEsquerda);
  assert.deepEqual(c.legenda, roteiro.legenda);
  assert.deepEqual(c.cenas, [{ arquivo: "cena-01.tsx", oQue: "a casa se monta" }]);
  assert.equal(c.comum, "export const X = 1;");
});

test("a emenda fixada: o bloco começa no enquadramento base, termina nele estável e usa a legenda do vídeo", () => {
  const legenda = { topo: 900, esquerda: 900, largura: 960, tamanho: 44 };
  const escrito = {
    tecnica: "maquete-3d",
    objeto: { nome: "a casa que vamos construir", palavra: "construir" },
    apresentador: [{ em: "inicio" }, { em: { palavra: "vamos" }, caixa: { x: 1000, y: 100, l: 800, a: 800 } }, { em: 39.5, ...molduraEsquerda }],
    legenda: { topo: 950, esquerda: 100, largura: 800, tamanho: 44 },
    cenas: [{ arquivo: "cena-01.tsx", de: { palavra: "construir" }, ate: "fim", oQue: "x" }],
  };
  const fixo = blocos.fixarContinuidade({ "roteiro.json": JSON.stringify(escrito), "cena-01.tsx": "c" }, { base: molduraEsquerda, legenda, fixarInicio: true }, falaDoBloco, 40);
  const r = JSON.parse(fixo["roteiro.json"]);
  assert.deepEqual(r.apresentador[0], { em: "inicio", ...molduraEsquerda });
  const ultimo = r.apresentador[r.apresentador.length - 1];
  assert.deepEqual(blocos.enquadramento(ultimo), molduraEsquerda);
  // o quadro que começava a 0,5 s do fim saiu; o base entra a 1,5 s do fim e termina antes do fim
  assert.ok(typeof ultimo.em === "number" && ultimo.em <= 38.5 + 1e-9 && ultimo.em + ultimo.transicao <= 39.9 + 1e-9, JSON.stringify(ultimo));
  assert.deepEqual(r.legenda, legenda);
  assert.equal(fixo["cena-01.tsx"], "c");
  // o roteiro fixado passa no portão do quadro deitado
  const problemas = portao.conferirRoteiro(r, { palavras: falaDoBloco, duracao: 40, temRecorte: false, arquivos: ["roteiro.json", "cena-01.tsx"], quadro: { largura: 1920, altura: 1080 } });
  assert.deepEqual(problemas, []);
  // já certo: nada muda (o mesmo objeto)
  const certo = { "roteiro.json": JSON.stringify({ ...escrito, apresentador: [{ em: "inicio", ...molduraEsquerda }], legenda }) };
  assert.equal(blocos.fixarContinuidade(certo, { base: molduraEsquerda, legenda, fixarInicio: true }, falaDoBloco, 40), certo);
  // sem base ou roteiro quebrado: devolve como veio (o portão aponta)
  const quebrado = { "roteiro.json": "{ x" };
  assert.equal(blocos.fixarContinuidade(quebrado, { base: molduraEsquerda, fixarInicio: true }, falaDoBloco, 40), quebrado);
});

test("o quadro deitado: o portão mede pelo 1920 × 1080; a geometria e o texto de quem escreve também", () => {
  const roteiro = {
    tecnica: "graficos",
    apresentador: [{ em: "inicio", caixa: { x: 1060, y: 140, l: 800, a: 800 } }],
    legenda: { topo: 900, esquerda: 360, largura: 1200, tamanho: 44 },
    cenas: [{ arquivo: "cena-01.tsx", de: { palavra: "vamos" }, ate: "fim", oQue: "x" }],
  };
  const deitado = { palavras: falaDoBloco, duracao: 40, temRecorte: false, arquivos: ["roteiro.json", "cena-01.tsx"], quadro: { largura: 1920, altura: 1080 } };
  assert.deepEqual(portao.conferirRoteiro(roteiro, deitado), []);
  // a mesma legenda no quadro em pé passa da margem; no deitado, embaixo demais reprova com 1035
  const emPe = portao.conferirRoteiro(roteiro, { ...deitado, quadro: null }).map((p: { motivo: string }) => p.motivo).join("\n");
  assert.match(emPe, /margem|fora do quadro/);
  const baixa = portao.conferirRoteiro({ ...roteiro, legenda: { ...roteiro.legenda, topo: 1000 } }, deitado).map((p: { motivo: string }) => p.motivo).join("\n");
  assert.match(baixa, /1035/);
  assert.deepEqual(geometria.quadroDoFormato("16:9"), { largura: 1920, altura: 1080, formato: "16:9" });
  assert.deepEqual(geometria.quadroDoFormato(undefined), { largura: 1080, altura: 1920, formato: "9:16" });
  const g = geometria.geometriaDoApresentador({ rosto: [{ x: 960, y: 400, queixo: 560 }], gravacao: { largura: 1920, altura: 1080 }, recorte: { caixa: [300, 0, 1320, 1080], cabeca: [{ topo: 200, x: 600 }] }, quadro: geometria.quadroDoFormato("16:9") });
  assert.equal(g.telaCheia.escala, 1);
  assert.equal(g.telaCheia.rostoY, 400);
  assert.equal(g.recorte.comEscala100.escala, 1);
  assert.equal(g.recorte.comEscala100.topoDaCabeca, Math.round(1080 * 0.14));
  assert.match(textoDoQuadro({ largura: 1920, altura: 1080 }), /DEITADO, 1920 × 1080/);
  assert.match(textoDoQuadro(null), /em pé, 1080 × 1920/);
  const ctx = { tecnica: "graficos" as const, duracao: 40, temRecorte: false, quadro: { largura: 1920, altura: 1080 } };
  assert.match(blocoDoCorte(ctx, [{ de: 0.2, ate: 0.6, w: "Hoje" }]), /o quadro é 1920 × 1080/);
});

test("o texto da continuidade: o primeiro bloco cria a base; os outros recebem a base, a legenda e a linguagem", () => {
  const ctx = { tecnica: "maquete-3d" as const, duracao: 60, temRecorte: false, bloco: { indice: 0, total: 3, inicioNoVideo: 0, duracaoDoVideo: 180 } };
  assert.match(textoDaContinuidade(ctx), /primeiro bloco/);
  assert.equal(textoDaContinuidade({ ...ctx, bloco: null }), "");
  const segundo = textoDaContinuidade({
    ...ctx,
    bloco: { indice: 1, total: 3, inicioNoVideo: 61.2, duracaoDoVideo: 180 },
    continuidade: { apresentador: molduraEsquerda, legenda: { topo: 900 }, cenas: [{ arquivo: "cena-01.tsx", oQue: "a casa se monta" }], comum: "export const Casa = 1;" },
  });
  for (const re of [/Bloco 2 de 3/, /ENQUADRAMENTO BASE/, /chanfrada/, /a casa se monta/, /export const Casa/]) assert.match(segundo, re);
  assert.ok(!/[—–]/.test(segundo), "sem travessão");
});

test("a fila do que pesa: um de cada vez, na ordem, e a espera medida", async () => {
  const fila = completo.criarFila(1);
  const ordem: string[] = [];
  let juntos = 0;
  let maximo = 0;
  const tarefa = (nome: string) =>
    fila.rodar(async () => {
      juntos++;
      maximo = Math.max(maximo, juntos);
      ordem.push(nome);
      await new Promise((r) => setTimeout(r, 15));
      juntos--;
      return nome;
    });
  assert.deepEqual(await Promise.all([tarefa("a"), tarefa("b"), tarefa("c")]), ["a", "b", "c"]);
  assert.equal(maximo, 1);
  assert.deepEqual(ordem, ["a", "b", "c"]);
  assert.ok(fila.espera.s > 0);
  assert.equal(completo.formatoDaGravacao({ largura: 1920, altura: 1080 }), "16:9");
  assert.equal(completo.formatoDaGravacao({ largura: 1080, altura: 1920 }), "9:16");
});

test("o completo do projeto sob medida vai ao editor avançado na mesma opção; nunca à reserva", () => {
  for (const id of ["sob-medida-3d", "sob-medida-recorte", "sob-medida-graficos", "sob-medida"]) {
    const c = caminhoDoCompletoSobMedida({ escolhido: id, avancadoLigado: true, desistiu: null });
    assert.equal(c?.caminho, "sob-medida", id);
    assert.equal(c?.modelo, id);
  }
  assert.deepEqual(caminhoDoCompletoSobMedida({ escolhido: "sob-medida-3d", avancadoLigado: true, desistiu: null }), { caminho: "sob-medida", modelo: "sob-medida-3d", tecnica: "maquete-3d" });
  assert.deepEqual(caminhoDoCompletoSobMedida({ escolhido: "sob-medida", avancadoLigado: true, desistiu: null }), { caminho: "sob-medida", modelo: "sob-medida", tecnica: null });
  // modelo do curso escolhido: não é deste caminho
  assert.equal(caminhoDoCompletoSobMedida({ escolhido: "torre", avancadoLigado: true, desistiu: null }), null);
  assert.equal(caminhoDoCompletoSobMedida({ escolhido: null, avancadoLigado: true, desistiu: null }), null);
  // a trava desligada ou a desistência (as duas tentativas no mesmo estilo): para, sem ir à reserva
  assert.deepEqual(caminhoDoCompletoSobMedida({ escolhido: "sob-medida-3d", avancadoLigado: false, desistiu: null }), { caminho: "parado", modelo: "sob-medida-3d", motivo: "a trava EDITOR_AVANCADO está desligada" });
  assert.equal(caminhoDoCompletoSobMedida({ escolhido: "sob-medida-3d", avancadoLigado: true, desistiu: "falhou" })?.caminho, "parado");
  // o prazo cresce com o vídeo e cobre o do worker
  assert.ok(prazoDoCompletoSobMedidaMs(180) > blocos.prazoDoCompletoAvancadoMs(180));
  assert.ok(prazoDoCompletoSobMedidaMs(1200) > prazoDoCompletoSobMedidaMs(180));
});

test("a previsão do sob medida usa o tempo dele: escrita por bloco e o render da cena própria, acima do modelo do curso", async () => {
  const { segundosNoSobMedida, segundosNoModeloDoCurso } = await import("@/lib/media/linha-do-tempo");
  const tres = segundosNoSobMedida(180);
  assert.ok(tres.efeitos >= 15 * 60 && tres.montagem >= 25 * 60, JSON.stringify(tres));
  assert.ok(segundosNoSobMedida(1200).montagem > tres.montagem);
  const curso = segundosNoModeloDoCurso(180, true);
  assert.ok(tres.efeitos + tres.montagem > curso.efeitos + curso.montagem);
});
