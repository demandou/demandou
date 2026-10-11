// O EDITOR AVANÇADO (10/10): as partes puras. O portão do código escrito pela
// IA (lint, imports, roteiro, tempo), o ambiente limpo do processo isolado, o
// teto de custo, o motor do recorte (CPU ou RunPod), a reserva quando o corte
// falha, a leitura dos arquivos devolvidos, a guarda de número e a revisão com
// o olho e o juiz trocados por respostas fixas. Sem banco, sem rede, sem IA.
// Rodar: npx tsx --test scripts/testes/editor-avancado-1010.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const imp = (p: string) => import(pathToFileURL(path.resolve(p)).href);
const portao = await imp("worker/src/avancado/portao.mjs");
const processo = await imp("worker/src/avancado/processo.mjs");
const teto = await imp("worker/src/avancado/teto.mjs");
const recorte = await imp("worker/src/avancado/recorte.mjs");
const geometria = await imp("worker/src/avancado/geometria.mjs");
const editar = await imp("worker/src/avancado/editar-avancado.mjs");
const { lerArquivosDaResposta, textosNaTela, numerosSemLastroNaCena } = await import("@/lib/media/editor-avancado/arquivos");
const { caminhoDoCorte, reservaDoSobMedida, ID_SOB_MEDIDA, OPCOES_SOB_MEDIDA, ehSobMedida, tecnicaDaOpcao } = await import("@/lib/media/editor-avancado/no-corte");
const { tetoDoPlanoUsd } = await import("@/lib/media/editor-do-curso/no-corte");
const { revisarQuadros, ehDefeitoDoRoteiro } = await import("@/lib/media/editor-avancado/revisao");
const { decidirTecnica } = await import("@/lib/media/editor-avancado/tecnica");

const fala = [
  { de: 0.1, ate: 0.4, w: "Os" },
  { de: 0.4, ate: 0.8, w: "nãos" },
  { de: 0.8, ate: 1.0, w: "são" },
  { de: 1.0, ate: 1.6, w: "importantes," },
  { de: 1.7, ate: 2.0, w: "o" },
  { de: 2.0, ate: 2.6, w: "essencial" },
  { de: 2.6, ate: 2.9, w: "bem" },
  { de: 2.9, ate: 3.4, w: "feito." },
];

const cenaLimpa = `import React from "react";
import { dito, k, LETRA, MARCA, useTempo, type CenaProps } from "../kit";

export const Atras: React.FC<CenaProps> = ({ de }) => {
  const { t } = useTempo();
  return <div style={{ position: "absolute", top: 300, fontFamily: LETRA.titulo, color: MARCA.titulo, opacity: k(t, de, dito("essencial")) }}>ESSENCIAL</div>;
};
`;

test("a cena limpa passa no lint; cada proibição das aulas e da segurança reprova", () => {
  assert.deepEqual(portao.lintDaCena(cenaLimpa, "cena-01.tsx"), []);
  const casos: Array<[string, RegExp]> = [
    ['import { useFrame } from "@react-three/fiber";\nuseFrame(() => {});', /useFrame/],
    ["const s = { transition: \"all 1s\" };", /transição de CSS/],
    ["const s = { animation: \"girar 2s\" };", /animação de CSS/],
    ["const x = Math.random();", /Math.random/],
    ["const d = new Date();", /relógio próprio/],
    ["setTimeout(() => 1, 10);", /relógio próprio/],
    ['fetch("/api");', /rede/],
    ['const i = new Image(); i.src = "/x";', /rede/],
    ['open("/x");', /rede/],
    ['const e = createElement("script");', /documento/],
    ['const m = import("fs");', /import dinâmico/],
    ["const w = window.innerWidth;", /globais/],
    ["const f = [].constructor.constructor;", /código dinâmico/],
    ['const v = <Video src={staticFile("a.mp4")} />;', /mídia é do kit/],
    ["const [a] = useState(0);", /estado entre quadros/],
    ["const p = async () => 1;", /síncrona/],
    ["const h = <div dangerouslySetInnerHTML={{ __html: \"x\" }} />;", /injeta HTML/],
    ["while (true) {}", /laço sem fim/],
  ];
  for (const [trecho, motivo] of casos) {
    const p = portao.lintDaCena(`${cenaLimpa}\n${trecho}\n`, "cena-02.tsx");
    assert.ok(p.some((x: { motivo: string }) => motivo.test(x.motivo)), `${trecho} deveria reprovar (${motivo})`);
  }
});

test("import fora da lista reprova; os da lista, as cenas irmãs e o comum passam", () => {
  const ok = `import * as THREE from "three";\nimport { ThreeCanvas } from "@remotion/three";\nimport { Maquete } from "./comum";\nimport { X } from "./cena-02";\n${cenaLimpa}`;
  assert.deepEqual(portao.lintDaCena(ok, "cena-01.tsx"), []);
  for (const fora of ["node:fs", "child_process", "three/examples/jsm/loaders/GLTFLoader", "../dados/pedido.json", "./outro", "@remotion/media"]) {
    const p = portao.lintDaCena(`import x from "${fora}";\n${cenaLimpa}`, "cena-01.tsx");
    assert.ok(p.some((x: { motivo: string }) => /import fora da lista/.test(x.motivo)), fora);
  }
});

test("texto: travessão e endereço reprovam, dentro de string ou solto no JSX; comentário não conta", () => {
  assert.ok(portao.lintDaCena(`${cenaLimpa}\nconst a = "isso — aquilo";`, "cena-01.tsx").some((x: { motivo: string }) => /travessão/.test(x.motivo)));
  assert.ok(portao.lintDaCena(`${cenaLimpa}\nconst b = <div>isso – aquilo</div>;`, "cena-01.tsx").some((x: { motivo: string }) => /travessão/.test(x.motivo)));
  assert.ok(portao.lintDaCena(`${cenaLimpa}\nconst c = "https://exemplo.com/x.png";`, "cena-01.tsx").some((x: { motivo: string }) => /endereço/.test(x.motivo)));
  assert.deepEqual(portao.lintDaCena(`// um comentário com — travessão e Date e fetch\n${cenaLimpa}`, "cena-01.tsx"), []);
  // a palavra proibida dentro de um texto de tela não é código
  assert.deepEqual(portao.lintDaCena(cenaLimpa.replace("ESSENCIAL", "{\"a window of Date\"}"), "cena-01.tsx"), []);
});

test("a cena precisa exportar Atras ou Frente; o comum não", () => {
  assert.ok(portao.lintDaCena('import React from "react";\nexport const Outra = () => null;\n', "cena-03.tsx").some((x: { motivo: string }) => /exportar Atras/.test(x.motivo)));
  assert.deepEqual(portao.lintDaCena('import React from "react";\nexport const Peca = () => null;\n', "comum.tsx"), []);
});

test("o portão de tempo: dito() só com texto literal que está na fala (acento e caixa não contam)", () => {
  assert.deepEqual(portao.conferirDitos('dito("Essencial bem feito") + dito("nãos", 1)', "cena-01.tsx", fala), []);
  assert.equal(portao.conferirDitos('dito("excelência")', "cena-01.tsx", fala).length, 1);
  assert.equal(portao.conferirDitos('dito("nãos", 2)', "cena-01.tsx", fala).length, 1);
  assert.ok(portao.lintDaCena(`${cenaLimpa}\nconst x = dito(palavra);`, "cena-01.tsx").some((p: { motivo: string }) => /só com o texto da fala/.test(p.motivo)));
  assert.deepEqual(portao.acharNaFala(fala, "o essencial"), { i: 4, j: 5 });
});

test("o roteiro: âncora fora da fala, caixa fora do quadro, legenda colada embaixo, recorte sem alfa e cena presa a número", () => {
  const bom = {
    tecnica: "recorte-letreiro",
    apresentador: [{ em: "inicio" }, { em: { palavra: "essencial" }, caixa: { x: 70, y: 1000, l: 940, a: 600 }, forma: "assimetrica", recorte: true }],
    legenda: { topo: 1622, esquerda: 70, largura: 940, tamanho: 50 },
    cenas: [{ arquivo: "cena-01.tsx", de: { palavra: "nãos" }, ate: "fim", oQue: "NÃOS atrás da cabeça" }],
  };
  assert.deepEqual(portao.conferirRoteiro(bom, { palavras: fala, duracao: 3.5, temRecorte: true, arquivos: ["roteiro.json", "cena-01.tsx"] }), []);
  const ruim = {
    ...bom,
    apresentador: [{ em: { palavra: "excelência" }, caixa: { x: 0, y: 1800, l: 1080, a: 600 }, recorte: true }],
    legenda: { topo: 1790, esquerda: 10, largura: 1060, tamanho: 50 },
    cenas: [{ arquivo: "cena-01.tsx", de: 1.2, ate: "fim", oQue: "" }],
  };
  const p = portao.conferirRoteiro(ruim, { palavras: fala, duracao: 3.5, temRecorte: false, arquivos: ["roteiro.json", "cena-01.tsx"] }).map((x: { motivo: string }) => x.motivo).join("\n");
  for (const motivo of [/não está na fala/, /fora do quadro/, /não tem recorte/, /margem/, /1840/, /presa a uma palavra/, /oQue/]) assert.match(p, motivo);
});

test("nomes de arquivo e o portão inteiro sobre um conjunto de arquivos", () => {
  for (const ok of ["roteiro.json", "comum.tsx", "cena-01.tsx", "cena-12.tsx"]) assert.ok(portao.nomeDeArquivoValido(ok), ok);
  for (const ruim of ["../kit/index.ts", "cena-1.tsx", "Raiz.tsx", "indice.ts", "cena-01.ts"]) assert.ok(!portao.nomeDeArquivoValido(ruim), ruim);
  const r = portao.conferirArquivos({ "roteiro.json": "{ quebrado", "cena-01.tsx": cenaLimpa, "../fora.tsx": "x" }, { palavras: fala, duracao: 3.5, temRecorte: false });
  assert.ok(r.problemas.some((x: { motivo: string }) => /JSON válido/.test(x.motivo)));
  assert.ok(r.problemas.some((x: { arquivo: string }) => x.arquivo === "../fora.tsx"));
});

test("os exemplos das três aulas passam no portão estático contra a própria fala", () => {
  const falas: Record<string, string> = {
    "recorte-bem-feito": "worker/avancado/src/dados/fala-aula82.json",
    "maquete-tenda": "worker/avancado/src/dados/fala-aula81.json",
    "graficos-cripto": "worker/avancado/exemplos/graficos-cripto/fala.json",
  };
  assert.deepEqual(readdirSync("worker/avancado/exemplos").sort(), Object.keys(falas).sort());
  for (const [nome, arquivoDaFala] of Object.entries(falas)) {
    const dir = path.resolve("worker/avancado/exemplos", nome, "cenas");
    const arquivos = Object.fromEntries(readdirSync(dir).map((n) => [n, readFileSync(path.join(dir, n), "utf8")]));
    const f = JSON.parse(readFileSync(path.resolve(arquivoDaFala), "utf8"));
    const r = portao.conferirArquivos(arquivos, { palavras: f.palavras, duracao: f.duracao, temRecorte: nome.includes("recorte") });
    assert.deepEqual(r.problemas, [], nome);
    // e a guarda de número: todo número de tela dos exemplos foi dito (o 83 MIL da aula 6 também)
    assert.deepEqual(numerosSemLastroNaCena(arquivos, f.palavras.map((p: { de: number; ate: number; w: string }) => ({ em: p.de, ate: p.ate, w: p.w }))), [], `${nome}: número não dito`);
  }
});

test("o processo isolado roda sem nenhuma chave do ambiente", () => {
  const env = { PATH: "/usr/bin", TEMP: "/tmp", ANTHROPIC_API_KEY: "x", WORKER_SECRET: "y", BLOB_READ_WRITE_TOKEN: "z", DATABASE_URL: "w", RUNPOD_API_KEY: "r", GL_DOS_MODELOS: "swangle" };
  assert.deepEqual(processo.ambienteLimpo(env), { PATH: "/usr/bin", TEMP: "/tmp", GL_DOS_MODELOS: "swangle" });
});

test("o teto: max(US$ 2, US$ 1 por minuto), e cada fase só começa se couber", () => {
  assert.equal(tetoDoPlanoUsd(35), 2);
  assert.equal(tetoDoPlanoUsd(180), 3);
  assert.equal(teto.tetoPadraoUsd(35), 2);
  assert.equal(teto.tetoPadraoUsd(150), 2.5);
  assert.ok(teto.cabeNoTeto(0, 2, "escrever"));
  assert.ok(!teto.cabeNoTeto(1.5, 2, "escrever"));
  assert.ok(teto.cabeNoTeto(1.6, 2, "consertar-codigo"));
  assert.ok(!teto.cabeNoTeto(1.95, 2, "consertar"));
});

test("o motor do recorte: CPU sem as variáveis do RunPod; o pedido e a resposta do RunPod", () => {
  assert.equal(recorte.backendDoRecorte({}), "cpu");
  assert.equal(recorte.backendDoRecorte({ RUNPOD_API_KEY: "k" }), "cpu");
  assert.equal(recorte.backendDoRecorte({ RUNPOD_API_KEY: "k", RUNPOD_ENDPOINT_RECORTE: "e" }), "runpod");
  assert.equal(recorte.backendDoRecorte({ RUNPOD_API_KEY: "k", RUNPOD_ENDPOINT_RECORTE: "e", RECORTE_BACKEND: "cpu" }), "cpu");
  const p = recorte.pedidoDoRunpod({ urlDoTrecho: "https://x/t.mp4", duracao: 32.3456, caixa: [300, 0, 1320, 1080] });
  assert.deepEqual(p.input, { url_do_trecho: "https://x/t.mp4", inicio: 0, duracao: 32.346, aquecer: 1.5, aquecer_no_comeco: true, razao: 0.25, caixa: "300,0,1320,1080" });
  assert.equal(recorte.lerRespostaDoRunpod({ status: "IN_QUEUE" }).estado, "andando");
  assert.equal(recorte.lerRespostaDoRunpod({ status: "FAILED", error: "sem GPU" }).erro, "sem GPU");
  assert.equal(recorte.lerRespostaDoRunpod({ status: "COMPLETED", output: {} }).estado, "falhou");
  assert.deepEqual(recorte.lerRespostaDoRunpod({ status: "COMPLETED", output: { url: "https://b/a.webm", rastro: { caixa: [0, 0, 2, 2] } } }), { estado: "pronto", url: "https://b/a.webm", base64: null, rastro: { caixa: [0, 0, 2, 2] }, medida: null });
  // a caixa do recorte: centrada no rosto médio, par e dentro da gravação
  assert.deepEqual(recorte.caixaDoRecorte([{ x: 900 }, { x: 1000 }], 1920, 1080), [290, 0, 1320, 1080]);
  assert.deepEqual(recorte.caixaDoRecorte([{ x: 1900 }], 1920, 1080), [600, 0, 1320, 1080]);
});

test("a reserva quando a edição sob medida falha: o modelo do curso de antes, senão o editor de antes", () => {
  const serve = (id: string) => id === "modelo-viral";
  assert.deepEqual(reservaDoSobMedida({ reserva: "modelo-viral", modeloServe: serve, cursoLigado: true }), { tipo: "modelo", modelo: "modelo-viral" });
  assert.deepEqual(reservaDoSobMedida({ reserva: "modelo-viral", modeloServe: serve, cursoLigado: false }), { tipo: "editor" });
  assert.deepEqual(reservaDoSobMedida({ reserva: "modelo-sumiu", modeloServe: serve, cursoLigado: true }), { tipo: "editor" });
  assert.deepEqual(reservaDoSobMedida({ reserva: null, modeloServe: serve, cursoLigado: true }), { tipo: "editor" });
  // a reserva nunca é outra edição sob medida
  assert.deepEqual(reservaDoSobMedida({ reserva: "sob-medida-3d", modeloServe: () => true, cursoLigado: true }), { tipo: "editor" });
  const base = { escolhido: "sob-medida-recorte", reserva: "modelo-viral", avancadoLigado: true, cursoLigado: true, avancadoDesistiu: false, modeloServe: serve };
  assert.deepEqual(caminhoDoCorte(base), { tipo: "sob-medida", modelo: "sob-medida-recorte" });
  assert.deepEqual(caminhoDoCorte({ ...base, escolhido: ID_SOB_MEDIDA }), { tipo: "sob-medida", modelo: ID_SOB_MEDIDA });
  assert.deepEqual(caminhoDoCorte({ ...base, avancadoDesistiu: true }), { tipo: "modelo", modelo: "modelo-viral" });
  // a trava desligada (o padrão): quem escolheu a sob medida segue a reserva
  assert.deepEqual(caminhoDoCorte({ ...base, avancadoLigado: false }), { tipo: "modelo", modelo: "modelo-viral" });
  assert.deepEqual(caminhoDoCorte({ ...base, escolhido: "modelo-viral" }), { tipo: "modelo", modelo: "modelo-viral" });
  assert.deepEqual(caminhoDoCorte({ ...base, escolhido: null }), { tipo: "editor" });
  assert.deepEqual(caminhoDoCorte({ ...base, escolhido: "modelo-viral", cursoLigado: false }), { tipo: "editor" });
});

test("os arquivos da resposta: blocos, cerca de código tirada, nome fora da lista ignorado", () => {
  const r = lerArquivosDaResposta('=== arquivo: roteiro.json ===\n{"a": 1}\n=== arquivo: cena-01.tsx ===\n```tsx\nexport const Atras = () => null;\n```\n=== arquivo: ../kit/index.ts ===\nmal\n=== fim ===\nsobra');
  assert.deepEqual(Object.keys(r), ["roteiro.json", "cena-01.tsx"]);
  assert.equal(r["cena-01.tsx"], "export const Atras = () => null;\n");
  assert.equal(r["roteiro.json"], '{"a": 1}\n');
});

test("a guarda de número no código: número de tela não dito reprova; medida, cor, caminho e contagem não", () => {
  const codigo = `const a = <div style={{ fontSize: 120, top: "340px", color: "#f97316" }}>{comoTitulo("os nãos")}</div>;
const b = <svg><path d="M3 7.5 L12 3 L21 7.5" /></svg>;
const c = <div>3 PASSOS</div>;
const d = <div>87% DOS CLIENTES</div>;
const e = "24 horas por dia";`;
  const textos = textosNaTela(codigo);
  assert.ok(textos.includes("os nãos") && textos.includes("3 PASSOS") && textos.includes("87% DOS CLIENTES"));
  assert.ok(!textos.some((x) => /340px|#f97316|M3 7\.5/.test(x)));
  const falaDaGuarda = fala.map((p) => ({ em: p.de, ate: p.ate, w: p.w }));
  assert.deepEqual(numerosSemLastroNaCena({ "cena-01.tsx": codigo }, falaDaGuarda).sort(), ["24", "87"]);
  assert.deepEqual(numerosSemLastroNaCena({ "cena-01.tsx": 'const x = <div>{comoTitulo("o essencial")}</div>;' }, falaDaGuarda), []);
});

test("a geometria do apresentador: rosto médio, tela cheia e o recorte na escala 1,15", () => {
  const g = geometria.geometriaDoApresentador({ rosto: [{ x: 900, y: 400, queixo: 560 }, { x: 1000, y: 420, queixo: 580 }], gravacao: { largura: 1920, altura: 1080 }, recorte: { caixa: [300, 0, 1320, 1080], cabeca: [{ topo: 234, x: 600 }, null, { topo: 236, x: 610 }] } });
  assert.deepEqual(g.rostoNaGravacao, { x: 950, y: 410, queixo: 570, movimentoHorizontal: 100 });
  assert.equal(g.recorte.topoDaCabecaNaGravacao, 236);
  assert.equal(g.recorte.comEscala115.base, Math.round(560 - 236 * 1.15 + 1080 * 1.15));
  assert.equal(g.recorte.comEscala115.topoDaCabeca, 560);
});

test("o erro de render aponta a cena; a cena que quebra sai do roteiro", () => {
  assert.equal(editar.arquivoDoErro("TypeError: x is undefined at Atras (cenas/cena-03.tsx:12:4)"), "cena-03.tsx");
  assert.equal(editar.arquivoDoErro("falhou no comum.tsx"), "comum.tsx");
  assert.equal(editar.arquivoDoErro("o Chrome caiu"), "*");
  const r = editar.roteiroSemCena({ "roteiro.json": JSON.stringify({ cenas: [{ arquivo: "cena-01.tsx" }, { arquivo: "cena-02.tsx" }] }), "cena-01.tsx": "a", "cena-02.tsx": "b" }, "cena-02.tsx");
  assert.deepEqual(Object.keys(r).sort(), ["cena-01.tsx", "roteiro.json"]);
  assert.deepEqual(JSON.parse(r["roteiro.json"]).cenas, [{ arquivo: "cena-01.tsx" }]);
});

test("a revisão: o olho descreve, o juiz reprova por cena; recorte e efeito proposital não reprovam", async () => {
  const olho = async () => ({
    custoUsd: 0.002,
    json: {
      quadros: [
        { k: 0, problemas: [{ tipo: "texto-no-rosto", descricao: "o cartão cobre a boca" }] },
        { k: 1, problemas: [{ tipo: "recorte-defeituoso", descricao: "halo no cabelo" }] },
        { k: 2, problemas: [{ tipo: "legenda-coberta", descricao: "a seta passa por cima da legenda" }] },
      ],
    },
  });
  const perguntas: string[] = [];
  const juiz = (async (_ctx: unknown, qs: Record<string, { instructions: { cena: string } }>) => {
    const r: Record<string, { type: "noul"; noul: number }> = {};
    for (const [k, q] of Object.entries(qs)) {
      perguntas.push(q.instructions.cena);
      r[k] = { type: "noul", noul: q.instructions.cena.startsWith("cena-02") ? 0.9 : 0.2 };
    }
    return r;
  }) as never;
  const quadro = (t: number, cenas: string[]) => ({ t, base64: "x", cenas, fala: "fala" });
  let custo = 0;
  const r = await revisarQuadros({
    quadros: [quadro(1, ["cena-01.tsx", "cena-02.tsx"]), quadro(2, ["cena-01.tsx"]), quadro(3, [])],
    cenas: [
      { arquivo: "cena-01.tsx", oQue: "maquete", de: 0, ate: 10 },
      { arquivo: "cena-02.tsx", oQue: "cartões", de: 0.5, ate: 10 },
    ],
    olho,
    juiz,
    onCusto: (u) => (custo += u),
  });
  assert.deepEqual(r.reprovadas.map((x) => x.arquivo), ["cena-02.tsx"]);
  assert.equal(r.daGravacao.length, 1);
  // o defeito sem cena no ar vai para o roteiro (enquadramento e legenda) e é perguntado ao juiz
  assert.ok(perguntas.some((p) => /enquadramento/.test(p)));
  assert.ok(Math.abs(custo - 0.002) < 1e-9);
});

test("a técnica: o JEV escolhe; confiança baixa vale o padrão (recorte com letreiro)", async () => {
  const juiz = (conf: number, escolha: string) =>
    (async () => ({ tecnica: { type: "choice", choice: escolha, probabilities: { [escolha]: conf }, confidence: conf } })) as never;
  assert.equal((await decidirTecnica({ fala, duracao: 30, juiz: juiz(0.8, "maquete-3d") })).tecnica, "maquete-3d");
  assert.equal((await decidirTecnica({ fala, duracao: 30, juiz: juiz(0.3, "maquete-3d") })).tecnica, "recorte-letreiro");
  assert.equal((await decidirTecnica({ fala, duracao: 30, juiz: juiz(0.9, "outra") })).tecnica, "recorte-letreiro");
});

test("os instantes da conferência: um a cada 1,5 s, o começo de cada cena e o fim das transições, sem vizinhos", () => {
  const roteiro = { apresentador: [{ em: "inicio" }, { em: { palavra: "essencial" }, transicao: 0.5 }], cenas: [{ arquivo: "cena-01.tsx", de: { palavra: "nãos" }, ate: "fim" }] };
  const ts = portao.instantesDaConferencia(roteiro, fala, 3.5);
  assert.ok(ts.includes(0.75) && ts.includes(2.25));
  for (let i = 1; i < ts.length; i++) assert.ok(ts[i] - ts[i - 1] >= 0.4);
  assert.deepEqual(portao.cenasNoInstante(roteiro, 1, fala, 3.5).map((c: { arquivo: string }) => c.arquivo), ["cena-01.tsx"]);
});

test("as três aulas do curso são três opções, cada uma com a sua técnica fixa; a genérica deixa o JEV escolher", () => {
  assert.deepEqual(OPCOES_SOB_MEDIDA.map((o) => [o.id, o.tecnica]), [
    ["sob-medida-3d", "maquete-3d"],
    ["sob-medida-recorte", "recorte-letreiro"],
    ["sob-medida-graficos", "graficos"],
  ]);
  for (const o of OPCOES_SOB_MEDIDA) {
    assert.ok(ehSobMedida(o.id));
    assert.equal(tecnicaDaOpcao(o.id), o.tecnica);
    assert.doesNotMatch(`${o.nome} ${o.resumo}`, /[—–]/);
    // a técnica de cada opção é uma que o portão do worker aceita
    assert.ok(portao.TECNICAS.includes(o.tecnica), o.tecnica);
  }
  assert.ok(ehSobMedida(ID_SOB_MEDIDA));
  assert.equal(tecnicaDaOpcao(ID_SOB_MEDIDA), null);
  assert.ok(!ehSobMedida("modelo-viral") && !ehSobMedida(null));
});

test("a revisão manda o defeito da legenda e da janela da pessoa para o roteiro, não para todas as cenas no ar", async () => {
  assert.ok(ehDefeitoDoRoteiro({ tipo: "texto-cortado", descricao: "legenda cortada na borda inferior" }));
  assert.ok(ehDefeitoDoRoteiro({ tipo: "legenda-coberta", descricao: "legenda coberta pelo cartão do apresentador" }));
  assert.ok(!ehDefeitoDoRoteiro({ tipo: "legenda-coberta", descricao: "o painel do gráfico cobre a legenda" }));
  assert.ok(!ehDefeitoDoRoteiro({ tipo: "texto-cortado", descricao: "palavra MAIS cortada na borda superior" }));
  const olho = async () => ({ custoUsd: 0, json: { quadros: [0, 1, 2].map((k) => ({ k, problemas: [{ tipo: "texto-cortado", descricao: "legenda cortada na borda inferior" }] })) } });
  const juiz = (async (_c: unknown, qs: Record<string, unknown>) => Object.fromEntries(Object.keys(qs).map((k) => [k, { type: "noul", noul: 0.9 }]))) as never;
  const quadro = (t: number, cenas: string[]) => ({ t, base64: "x", cenas, fala: "" });
  const r = await revisarQuadros({
    quadros: [quadro(1, ["cena-01.tsx"]), quadro(5, ["cena-02.tsx"]), quadro(9, ["cena-03.tsx"])],
    cenas: ["cena-01.tsx", "cena-02.tsx", "cena-03.tsx"].map((arquivo, i) => ({ arquivo, oQue: "x", de: i * 4, ate: i * 4 + 4 })),
    olho,
    juiz,
  });
  assert.deepEqual(r.reprovadas.map((x) => x.arquivo), ["roteiro.json"]);
});
