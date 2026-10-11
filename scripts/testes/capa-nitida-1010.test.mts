// A capa nítida e no estilo do modelo (10/10, noite; feito em 11/10). A queixa
// do Bruno: "as thumbs estão ficando horríveis, pegando uma imagem distorcida da
// pessoa do vídeo; sempre pegar uma imagem nítida ou não colocar foto, e a thumb,
// assim como os posts, deve seguir o estilo do estilo escolhido". E o pedido do
// teste no Estúdio: artes que não repetem o bloco nem o quadro da pessoa.
//
// Aqui: a escolha do quadro (nitidez, olho, rosto inteiro e grande, proporção,
// sem esticar, sem quadro bom = sem foto), a capa indo pelo modelo quando o
// projeto tem modelo, a capa deitada 16:9 recomposta sem esticar (ffmpeg, sem
// IA), a variedade de blocos e as fotos por peça. Nada toca banco, rede ou IA.
// Rodar: npx tsx --test scripts/testes/capa-nitida-1010.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  baseDaCapaDoCorte,
  caminhoDaCapa,
  capaAindaEspera,
  capasDoCallback,
  chaveDoLoteDaCapa,
  fotosPorPeca,
  lerRetornoDaCapa,
  limparTitulo,
  loteEhDeCapa,
  pecasDaCapaDoCompleto,
  pecasDasCapasDosCortes,
  PRAZO_DA_CAPA_NO_MODELO_MS,
  referenciaDosCortes,
} from "../../lib/media/capa-pelo-modelo";
import { decidirArtePeloModelo, lerCallbackDaArte } from "../../lib/media/editor-do-curso/arte-pelo-modelo";
import { instrucaoDasPecasParadas, nomeDaPeca, type PecasParadas } from "../../lib/media/editor-do-curso/escrever-plano";
import { instantesDaGravacao } from "../../lib/media/quadros-nitidos";

const raiz = path.resolve(import.meta.dirname, "../..");
const nitido = await import(pathToFileURL(path.join(raiz, "worker/src/quadro-nitido.mjs")).href);
const worker = await import(pathToFileURL(path.join(raiz, "worker/src/modelo/arte-no-modelo.mjs")).href);

// Um candidato como o quadro-da-capa.py devolve (1920x1080, rosto de 220 px, nítido, olho aberto).
const cand = (instante: number, m: Partial<{ piscada: number; nitidez: number; giro: number; nota: number; caixa: { x: number; y: number; w: number; h: number } }> = {}, largura = 1920, altura = 1080) => ({
  instante,
  quadro: `/tmp/c${instante}.jpg`,
  largura,
  altura,
  medida: { nota: 0.5, piscada: 0.2, boca: 0.05, sorriso: 0.1, giro: 2, nitidez: 90, caixa: { x: 0.42, y: 0.28, w: 0.115, h: 0.24 }, ...m },
});

// ─────────────────────────── a escolha do quadro ───────────────────────────

test("quadro: nítido, de olho aberto e rosto inteiro serve", () => {
  assert.deepEqual(nitido.avaliarQuadro(cand(10)), { ok: true, motivos: [] });
});

test("quadro: olho fechado, borrado, de perfil, pequeno e cortado na borda são descartados", () => {
  assert.match(nitido.avaliarQuadro(cand(1, { piscada: 0.8 })).motivos.join(), /olho fechado/);
  // Os dois quadros com borrão de movimento da gravação de prova (nitidez 42 e 49).
  assert.match(nitido.avaliarQuadro(cand(2, { nitidez: 42.1 })).motivos.join(), /borrado/);
  assert.match(nitido.avaliarQuadro(cand(3, { nitidez: 48.9 })).motivos.join(), /borrado/);
  assert.match(nitido.avaliarQuadro(cand(4, { giro: -50 })).motivos.join(), /perfil/);
  // A webcam no canto de uma gravação de tela: rosto de 100 px.
  assert.match(nitido.avaliarQuadro(cand(5, { caixa: { x: 0.8, y: 0.7, w: 0.052, h: 0.1 } })).motivos.join(), /rosto pequeno/);
  assert.match(nitido.avaliarQuadro(cand(6, { caixa: { x: -0.02, y: 0.3, w: 0.12, h: 0.24 } })).motivos.join(), /cortado/);
  assert.match(nitido.avaliarQuadro(cand(7, { caixa: { x: 0.4, y: 0.85, w: 0.12, h: 0.2 } })).motivos.join(), /cortado/);
  assert.deepEqual(nitido.avaliarQuadro({ instante: 8, largura: 1920, altura: 1080, medida: null }).motivos, ["sem rosto"]);
});

test("quadro: o destino não pode pedir mais de 2x de ampliação (720p para 9:16 cai, 1080p passa)", () => {
  const alvo = { largura: 1080, altura: 1920 };
  assert.equal(nitido.avaliarQuadro(cand(1), { alvo }).ok, true); // 1920x1080 cobre 1080x1920 com 1,78x
  const pequeno = cand(2, { caixa: { x: 0.42, y: 0.28, w: 0.2, h: 0.3 } }, 1280, 720); // 2,67x
  const a = nitido.avaliarQuadro(pequeno, { alvo });
  assert.equal(a.ok, false);
  assert.match(a.motivos.join(), /ampliação de 2\.7x/);
  assert.equal(nitido.ampliacaoParaCobrir(3840, 2160, alvo) < 1, true);
});

test("quadro: entre os que servem vence a melhor nota; nenhum serve = null (a capa sai sem foto)", () => {
  const r = nitido.escolherQuadroNitido([cand(1, { nota: 0.9, piscada: 0.7 }), cand(2, { nota: 0.4 }), cand(3, { nota: 0.6 }), cand(4, { nota: 2, nitidez: 30 })]);
  assert.equal(r.escolhido.instante, 3);
  assert.equal(r.descartados.length, 2);
  const nenhum = nitido.escolherQuadroNitido([cand(1, { piscada: 0.9 }), cand(2, { nitidez: 20 }), { instante: 3, largura: 1920, altura: 1080, medida: null }]);
  assert.equal(nenhum.escolhido, null);
  assert.equal(nenhum.descartados.length, 3);
});

test("quadro: vários nítidos e diferentes, longe no tempo uns dos outros", () => {
  const cs = [cand(10, { nota: 0.9 }), cand(12, { nota: 0.8 }), cand(40, { nota: 0.7 }), cand(41, { nota: 0.6, piscada: 0.9 }), cand(90, { nota: 0.5 })];
  assert.deepEqual(nitido.escolherVariosNitidos(cs, { quantos: 3, distancia: 8 }).map((c: { instante: number }) => c.instante), [10, 40, 90]);
  assert.deepEqual(nitido.escolherVariosNitidos(cs, { quantos: 10, distancia: 8 }).length, 3);
  assert.deepEqual(nitido.escolherVariosNitidos([cand(1, { nitidez: 10 })], { quantos: 3 }), []);
});

test("sem esticar: a janela tem a proporção exata do destino, dentro do quadro, centrada no rosto", () => {
  for (const [W, H, alvo, centro] of [
    [1920, 1080, { largura: 1080, altura: 1920 }, { x: 0.5, y: 0.4 }],
    [1920, 1080, { largura: 1280, altura: 720 }, null],
    [1080, 1920, { largura: 1280, altura: 720 }, { x: 0.5, y: 0.3 }],
    [1080, 1920, { largura: 1080, altura: 1350 }, { x: 0.95, y: 0.95 }],
  ] as const) {
    const j = nitido.janelaSemEsticar(W, H, alvo, centro);
    assert.ok(Math.abs(j.w / j.h - alvo.largura / alvo.altura) < 0.01, `proporção ${j.w}x${j.h} para ${alvo.largura}x${alvo.altura}`);
    assert.ok(j.x >= 0 && j.y >= 0 && j.x + j.w <= W && j.y + j.h <= H, "dentro do quadro");
    assert.equal(j.w % 2, 0);
  }
  const deitado = nitido.janelaSemEsticar(1920, 1080, { largura: 1080, altura: 1920 }, { x: 0.5, y: 0.4 });
  assert.equal(deitado.h, 1080);
  assert.equal(deitado.x, Math.round(960 - deitado.w / 2));
});

test("sem ampliar demais: a pessoa cresce no máximo 2x", () => {
  assert.equal(nitido.alturaSemAmpliarDemais(300, 1152), 600);
  assert.equal(nitido.alturaSemAmpliarDemais(900, 705), 705);
});

// ─────────────────────────── a capa deitada (16:9) ───────────────────────────

test("16:9: a pessoa larga perde as laterais em volta do rosto, sem encolher nem esticar, e nunca passa de 2x", () => {
  const p = worker.lugarDaPessoa16x9({ w: 1400, h: 800, rostoX: 500 });
  assert.equal(p.altura, 692); // 96% de 720, par
  assert.ok(p.largura <= Math.round(1280 * 0.46) + 2);
  // A proporção do recorte (corteW x 800) é a da pessoa na capa (largura x altura).
  assert.ok(Math.abs(p.corteW / 800 - p.largura / p.altura) < 0.01);
  assert.ok(p.corteX >= 0 && p.corteX + p.corteW <= 1400);
  assert.ok(p.corteX <= 500 && p.corteX + p.corteW >= 500, "o rosto fica dentro do recorte");
  assert.equal(p.y, 720 - p.altura);
  const pequena = worker.lugarDaPessoa16x9({ w: 150, h: 200, rostoX: 75 });
  assert.equal(pequena.altura, 400); // 2x, não os 692 pedidos
  assert.equal(pequena.escala, 2);
});

test("16:9: o texto do modelo vai inteiro, na mesma escala para letreiro e corpo, à esquerda da pessoa", () => {
  const t = worker.lugarDoTexto16x9([{ x: 0, y: 100, w: 1080, h: 120 }, { x: 40, y: 600, w: 1000, h: 700 }], { larguraDaPessoa: 560 });
  const [l, c] = t.partes;
  assert.ok(Math.abs(l.largura / 1080 - c.largura / 1000) < 0.01, "mesma escala");
  assert.ok(c.x + c.largura <= 1280 - 560, "não invade a pessoa");
  assert.ok(l.y >= 0 && c.y + c.altura <= 720);
  assert.ok(c.y > l.y + l.altura - 1, "o corpo vem depois do letreiro");
});

const temFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0;

test("16:9 no ffmpeg: a capa sai 1280x720, com a pessoa recortada e sem esticar", { skip: !temFfmpeg }, async () => {
  const pasta = mkdtempSync(path.join(tmpdir(), "capa16x9-"));
  try {
    const quadro = path.join(pasta, "q.png");
    // O quadro do modelo em pé: fundo liso, um letreiro fino no alto e um corpo de texto.
    spawnSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "color=c=0x1e1f22:s=1080x1920", "-vf", "drawbox=x=80:y=120:w=600:h=50:c=white:t=fill,drawbox=x=90:y=700:w=900:h=500:c=0xf97316:t=fill", "-frames:v", "1", "-y", quadro]);
    // A pessoa: um recorte com transparência (um bloco opaco no meio de um PNG transparente).
    const pessoa = path.join(pasta, "p.png");
    spawnSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "color=c=0x3366ff:s=1000x900,format=rgba", "-vf", "geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(between(X,200,799)*between(Y,100,899),255,0)'", "-frames:v", "1", "-y", pessoa]);
    const caixa = await worker.caixaDoAlfa(pessoa);
    assert.ok(Math.abs(caixa.x - 200) <= 4 && Math.abs(caixa.w - 600) <= 8 && Math.abs(caixa.h - 800) <= 8, JSON.stringify(caixa));
    const saida = path.join(pasta, "capa.png");
    const r = await worker.noFormato16x9(quadro, saida, { pessoa: { arquivo: pessoa, ...caixa, rostoX: caixa.w / 2 } });
    assert.equal(r.modo, "deitada");
    assert.equal(r.fundoLiso, true);
    const sonda = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", saida]).stdout.toString().trim();
    assert.equal(sonda, "1280,720");
    // A pessoa entrou na escala uniforme: 600x800 vira largura/altura = 0,75.
    assert.ok(Math.abs(r.pessoa.largura / r.pessoa.altura - 0.75) < 0.02, JSON.stringify(r.pessoa));
    // Sem pessoa: o texto centrado na capa inteira.
    const so = await worker.noFormato16x9(quadro, path.join(pasta, "so.png"), {});
    assert.equal(so.pessoa, null);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});

// ─────────────────────────── a capa pelo modelo ───────────────────────────

test("modelo: o projeto com modelo do curso faz a capa pelo template; só sem estilo escolhido vai pelo caminho de hoje; a segunda tentativa é no mesmo estilo, pela IA", () => {
  const regra = decidirArtePeloModelo({ ligada: true, modelo: "modelo-manifesto", estiloProprio: false });
  assert.equal(regra.usa, true);
  assert.equal(caminhoDaCapa({ temRegra: regra.usa }), "modelo");
  assert.equal(caminhoDaCapa({ temRegra: decidirArtePeloModelo({ ligada: true, modelo: null, estiloProprio: false }).usa }), "hoje");
  assert.equal(caminhoDaCapa({ temRegra: decidirArtePeloModelo({ ligada: false, modelo: "modelo-manifesto", estiloProprio: false }).usa }), "hoje");
  // Nunca trocar o estilo sozinho (11/10): com estilo, a reserva é a IA no MESMO estilo, nunca o caminho de hoje.
  assert.equal(caminhoDaCapa({ temRegra: true, pelaIa: true }), "ia");
  assert.equal(caminhoDaCapa({ temRegra: true, pelaIa: true, pendente: { pendente: true, desde: new Date().toISOString() } }), "ia");
  // Um pedido ainda no prazo segura o segundo (não paga duas vezes); vencido, pede de novo.
  const agora = Date.parse("2026-10-11T12:00:00Z");
  assert.equal(caminhoDaCapa({ temRegra: true, pendente: { pendente: true, desde: "2026-10-11T11:30:00Z" }, agora }), "esperando");
  assert.equal(caminhoDaCapa({ temRegra: true, pendente: { pendente: true, desde: new Date(agora - PRAZO_DA_CAPA_NO_MODELO_MS - 1).toISOString() }, agora }), "modelo");
  assert.equal(capaAindaEspera({ pendente: false, desde: "2026-10-11T11:59:00Z" }, agora), false);
});

test("modelo: as peças da capa do completo (16:9, duas) e dos cortes (9:16, uma por corte)", () => {
  assert.deepEqual(pecasDaCapaDoCompleto(["Consultoria não escala", "Por que — você trava?", "terceira"]), [
    { tipo: "capa", texto: "Consultoria não escala", formatos: ["16:9"] },
    { tipo: "capa", texto: "Por que , você trava?", formatos: ["16:9"] },
  ]);
  assert.throws(() => pecasDaCapaDoCompleto(["  "]));
  const c = pecasDasCapasDosCortes([{ indice: 0, frase: "A" }, { indice: 2, frase: "" }, { indice: 3, frase: "\"B\"" }]);
  assert.deepEqual(c.cortes, [0, 3]);
  assert.deepEqual(c.pecas.map((p) => [p.texto, p.formatos[0]]), [["A", "9:16"], ["B", "9:16"]]);
  assert.equal(limparTitulo("x–y"), "x,y");
});

test("modelo: o worker aceita o 16:9 só na capa e a foto de cada peça", () => {
  const p = worker.validarPedido({ modelo: "modelo-manifesto", pecas: [{ tipo: "capa", texto: "Título", formatos: ["16:9"] }, { tipo: "post", texto: "x", formatos: ["16:9"], fotoUrl: "https://a/b.jpg" }] });
  assert.deepEqual(p[0].formatos, ["16:9"]);
  assert.deepEqual(p[1].formatos, ["4:5"]);
  assert.equal(p[1].fotoUrl, "https://a/b.jpg");
  assert.equal(p[0].fotoUrl, undefined);
});

test("modelo: o lote de capa volta pelo callback das artes e cai na capa certa", () => {
  const lote = chaveDoLoteDaCapa("completo", "vid1", 1000);
  assert.ok(loteEhDeCapa(lote));
  assert.equal(loteEhDeCapa("arte-run-1"), false);
  const bruto = { ok: true, pecas: [{ indice: 2, url: "https://x/2.jpg", formato: "16:9" }, { indice: 1, url: "https://x/1.jpg", formato: "16:9" }], retorno: { lote, projectId: "p", alvo: "completo", videoJobId: "vid1" } };
  const cb = lerCallbackDaArte(bruto)!;
  assert.equal(cb.ok, true, "o callback das artes lê o 16:9");
  const ret = lerRetornoDaCapa(bruto)!;
  assert.equal(ret.alvo, "completo");
  assert.deepEqual(capasDoCallback(cb.pecas, ret, 2).urls, ["https://x/1.jpg", "https://x/2.jpg"]);
  // Os cortes: a peça k vai para o corte k da lista; a que faltou fica de fora (vai à reserva).
  const cortes = { alvo: "cortes" as const, cortes: [0, 3, 5] };
  const r = capasDoCallback([{ indice: 1, url: "u1", formato: "9:16" }, { indice: 3, url: "u3", formato: "9:16" }, { indice: 2, url: "deitada", formato: "16:9" }], cortes, 3);
  assert.deepEqual([...r.porCorte.entries()], [[0, "u1"], [5, "u3"]]);
  assert.deepEqual(r.faltam, [2]);
  assert.equal(lerRetornoDaCapa({ retorno: { lote: "arte-1", alvo: "completo", videoJobId: "v" } }), null);
  assert.equal(lerRetornoDaCapa({ retorno: { lote, alvo: "outra", videoJobId: "v" } }), null);
});

test("caminho de hoje: o quadro do corte só com o recorte; senão a foto do vídeo; senão nenhuma", () => {
  const doVideo = { url: "https://q/nitido.jpg", recorteUrl: "https://q/recorte.png", origem: "quadro" as const };
  assert.deepEqual(baseDaCapaDoCorte({ midia: { capa: { url: "c" }, recorte: { url: "r" } } }, doVideo), { quadroUrl: "c", recorteUrl: "r" });
  // O quadro fixo do trecho (sem recorte: não passou no crivo) não serve.
  assert.deepEqual(baseDaCapaDoCorte({ midia: { capa: { url: "fixo" } } }, doVideo), { quadroUrl: "https://q/nitido.jpg", recorteUrl: "https://q/recorte.png" });
  assert.deepEqual(baseDaCapaDoCorte({ midia: { capa: { url: "fixo" } } }, null), { quadroUrl: null, recorteUrl: null });
  assert.deepEqual(baseDaCapaDoCorte({}, { url: null, recorteUrl: null, origem: "nenhuma" }), { quadroUrl: null, recorteUrl: null });
});

test("os instantes da gravação ficam dentro dela e fogem das bordas", () => {
  const t = instantesDaGravacao(1158, 30);
  assert.equal(t.length, 30);
  assert.ok(t[0] > 30 && t[t.length - 1] < 1158 - 30);
  assert.equal(instantesDaGravacao(10, 100).length, 40);
});

// ─────────────────────────── as artes: variedade e fotos ───────────────────────────

const pecasDoLote = [
  { indice: 1, tipo: "post", texto: "a" },
  { indice: 2, tipo: "capa", texto: "b" },
  { indice: 3, tipo: "lamina", texto: "c" },
  { indice: 4, tipo: "lamina", texto: "d" },
  { indice: 5, tipo: "infografico", texto: "e" },
];

test("variedade: duas peças com o mesmo bloco reprovam, menos as lâminas entre si", () => {
  const ok = new Map([[1, "frase"], [2, "cartaz"], [3, "lista"], [4, "lista"], [5, "numero"]]);
  assert.deepEqual(worker.variedadeDasPecas(pecasDoLote, ok, ["frase", "cartaz", "lista", "numero", "citacao"]), []);
  const repetido = new Map([[1, "frase"], [2, "lista"], [3, "lista"], [4, "lista"], [5, "frase"]]);
  const erros = worker.variedadeDasPecas(pecasDoLote, repetido, ["frase", "cartaz", "lista", "numero", "citacao"]);
  assert.equal(erros.length, 3); // post e infográfico; capa e cada lâmina
  assert.match(erros.join(" "), /peças 1 \(post\) e 5 \(infografico\)/);
  assert.match(erros.join(" "), /ainda livres: cartaz, numero, citacao/);
  // Modelo com menos blocos que peças distintas: a regra não pede o impossível.
  assert.deepEqual(worker.variedadeDasPecas(pecasDoLote, repetido, ["frase", "lista"]), []);
});

test("variedade: conferirPecas reprova o lote todo igual (o teste do Bruno no Estúdio)", () => {
  const trechos = [
    { indice: 1, tipo: "post", texto: "Grave uma vez", de: 0, ate: 4, primeiraEm: 0.4, ultimaAte: 1.5 },
    { indice: 2, tipo: "capa", texto: "Publique em cinco redes", de: 4, ate: 8, primeiraEm: 4.4, ultimaAte: 6 },
  ];
  const plano = { momentos: [{ tipo: "frase", de: 0, ate: 4, texto: "Grave uma vez", em: 0.4 }, { tipo: "frase", de: 4, ate: 8, texto: "Publique em cinco redes", em: 4.4 }] };
  const erros = worker.conferirPecas(plano, trechos, "modelo-estudio", { tipos: ["frase", "cartaz"] });
  assert.equal(erros.length, 1);
  assert.match(erros[0], /mesmo bloco "frase"/);
});

test("variedade: os blocos do modelo saem do src/plano.ts do template", () => {
  const tipos = worker.tiposDoModelo(path.join(raiz, "worker/modelos/modelo-estudio/template"));
  for (const t of ["abertura", "resposta", "trilha", "citacao", "player"]) assert.ok(tipos.includes(t), t);
  assert.deepEqual(worker.tiposDoModelo(path.join(raiz, "nao-existe")), []);
});

test("variedade: o redator recebe a regra, os blocos do modelo e a referência do corte; a capa do vídeo tem nome próprio", () => {
  const pp: PecasParadas = {
    pecas: [{ indice: 1, tipo: "capa", texto: "x", formato: "16:9", de: 0, ate: 3, primeiraEm: 0.3, ultimaAte: 1 }],
    semPessoa: false,
    pessoaDaGravacao: true,
    blocosDoModelo: ["resposta", "trilha"],
    referenciaDoCorte: referenciaDosCortes([{ tipos: [{ tipo: "resposta", vezes: 3, exemplo: "Três passos" }] }, { tipos: [{ tipo: "trilha", vezes: 1 }, { tipo: "resposta", vezes: 1 }] }, null]),
  };
  const t = instrucaoDasPecasParadas(pp);
  assert.match(t, /TIPO DE BLOCO DIFERENTE/);
  assert.match(t, /Os blocos deste modelo: resposta, trilha/);
  assert.match(t, /- resposta \(4x nos cortes, ex\.: "Três passos"\)/);
  assert.match(t, /quadro parado e nítido da própria gravação/);
  assert.match(t, /capa do vídeo \(thumbnail/);
  assert.equal(nomeDaPeca({ tipo: "capa", formato: "4:5" }), "capa de carrossel");
  assert.ok(!/[—]/.test(t), "sem travessão");
  assert.equal(referenciaDosCortes([null, { tipos: [] }]), null);
});

test("16:9: o modelo com versão deitada desenha a capa no template deitado; sem versão, recompõe", () => {
  assert.equal(worker.versaoDeitada("modelo-torre"), "modelo-torre-16x9");
  assert.equal(worker.versaoDeitada("modelo-manifesto"), "modelo-manifesto-16x9");
  assert.equal(worker.versaoDeitada("modelo-que-nao-existe"), null);
});

test("fotos: uma por peça, sem repetir enquanto houver diferente", () => {
  assert.deepEqual(fotosPorPeca(["a", "b", "c"], 5), ["a", "b", "c", "a", "b"]);
  assert.deepEqual(fotosPorPeca([], 3), []);
});

test("fotos: a troca de foto cai no meio da pausa entre as peças", () => {
  const fala = worker.falaDasPecas([{ texto: "Grave uma vez" }, { texto: "Publique em cinco redes" }, { texto: "Pronto" }]);
  const j = worker.janelasDasPecas(fala);
  assert.equal(j.length, 3);
  assert.equal(j[0].de, 0);
  for (let i = 1; i < 3; i++) {
    assert.ok(j[i].de > fala.trechos[i - 1].vozAte && j[i].de < fala.trechos[i].vozDe, "no meio da pausa");
    assert.ok(Math.abs(j[i - 1].de + j[i - 1].duracao - j[i].de) < 0.002, "sem buraco");
  }
  assert.ok(Math.abs(j[2].de + j[2].duracao - fala.duracao) < 0.002);
});
