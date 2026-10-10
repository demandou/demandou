/**
 * Os modelos do curso na biblioteca de estilos (09/10, noite): os cartões saem
 * do catálogo (sem lista fixa), a recomendação é do JEV pelo perfil com a
 * margem do "não sei", o motivo não leva travessão, e a tela mostra o editor
 * novo antes do de antes.
 *   npx tsx --test scripts/testes/modelo-do-curso-0910.test.mts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
const { modelosDaBiblioteca, resumoDoModelo, descricaoParaDecidir, faltaDoModelo, modelosQueServem } = await import("@/lib/media/editor-do-curso/biblioteca");
const { MODELOS_DO_CURSO, VERSOES_DOS_MODELOS, modeloServeNoCorte, versaoNoFormato } = await import("@/lib/media/editor-do-curso/no-corte");
const { chaveDaOpcao, visualSemNome, lerEscolha, hashDaRecomendacao, limparMotivo, motivoEmCodigo, perguntasDoJev, temPerfilParaRecomendar, estadoDoJev, CONFIANCA_MINIMA } = await import(
  "@/lib/media/editor-do-curso/recomendacao"
);

const raiz = new URL("../../", import.meta.url);
const ler = (f: string) => readFileSync(new URL(f, raiz), "utf8").replace(/\r\n/g, "\n");
const TRAVESSAO = /[—–]/;

test("os cartões são os 79 do catálogo, e serve é o que o catálogo marca como automático e tem a versão vertical", () => {
  const cartoes = modelosDaBiblioteca();
  assert.equal(cartoes.length, MODELOS_DO_CURSO.length);
  for (const c of cartoes) {
    const m = MODELOS_DO_CURSO.find((x) => x.id === c.id)!;
    assert.equal(c.serve, m.automatico && Boolean(versaoNoFormato(m.id, "9:16")), c.id);
    if (m.formato === "9:16") assert.equal(c.serve, m.automatico, c.id);
    assert.equal(c.falta === null, c.serve, `${c.id}: só o que não serve diz o que falta`);
    if (c.falta) assert.match(c.falta, /^Em breve/);
  }
  assert.equal(modelosQueServem().length, cartoes.filter((c) => c.serve).length);
});

test("o Aula e o Canal (nascem 16:9) entram no corte quando a versão 9:16 está no versoes.json, e só então", () => {
  for (const id of ["modelo-aula", "modelo-canal"]) {
    const m = MODELOS_DO_CURSO.find((x) => x.id === id)!;
    assert.equal(m.formato, "16:9");
    const lista = VERSOES_DOS_MODELOS as Record<string, Record<string, string>>;
    const antes = { ...lista[id] };
    try {
      delete lista[id]["9:16"];
      assert.equal(modeloServeNoCorte(id), null, `${id} sem a versão em pé não serve no corte`);
      assert.match(modelosDaBiblioteca().find((c) => c.id === id)!.falta ?? "", /deitado \(16:9\)/);
      lista[id]["9:16"] = `${id}-9x16`;
      assert.equal(modeloServeNoCorte(id)?.id, m.automatico ? id : undefined);
      assert.equal(versaoNoFormato(id, "9:16"), `${id}-9x16`);
      assert.equal(versaoNoFormato(id, "16:9"), id);
      if (m.automatico) {
        assert.equal(modelosDaBiblioteca().find((c) => c.id === id)?.serve, true);
        assert.ok(modelosQueServem().some((x) => x.id === id), "entra nas opções da recomendação");
      }
    } finally {
      lista[id] = antes;
    }
  }
});

test("o pedido do corte ao worker vai sempre no formato vertical", () => {
  const src = ler("lib/media/montagem-nos-cortes.ts");
  const envio = src.slice(src.indexOf("async function enviarAoModeloDoCurso"), src.indexOf("async function desistirDoModeloDoCurso"));
  assert.match(envio, /formato: "9:16"/);
});

test("modelo que o catálogo passa a marcar como automático sobe para a grade sem mudar código", () => {
  const imagem = MODELOS_DO_CURSO.find((m) => !m.automatico && m.formato === "9:16");
  assert.ok(imagem, "há um modelo vertical ainda fora");
  const antes = imagem.automatico;
  try {
    imagem.automatico = true;
    assert.equal(modelosDaBiblioteca().find((c) => c.id === imagem.id)?.serve, true);
    const servem = modelosQueServem();
    const i = servem.findIndex((m) => m.id === imagem.id);
    assert.ok(i >= 0 && Object.keys((perguntasDoJev(servem).modelo as { criteria: Record<string, string> }).criteria).includes(chaveDaOpcao(i)));
  } finally {
    imagem.automatico = antes;
  }
});

test("a arte do cartão existe quando o manifesto diz, e não há prévia em vídeo (nada do exemplo do curso)", () => {
  const manifesto = JSON.parse(ler("lib/media/editor-do-curso/artes.json")) as string[];
  for (const c of modelosDaBiblioteca()) {
    assert.equal(c.previa, null, `${c.id}: sem prévia por enquanto`);
    if (!manifesto.includes(c.id)) {
      assert.equal(c.arte, null, `${c.id}: sem arte, o cartão fica só com o texto`);
      continue;
    }
    assert.equal(c.arte, `/estilos/curso/${c.id}.webp`);
    assert.ok(existsSync(new URL(`public${c.arte}`, raiz)), `${c.id}: arte`);
  }
  const pasta = new URL("public/estilos/curso/", raiz);
  if (existsSync(pasta)) assert.deepEqual(readdirSync(pasta).filter((n) => !n.endsWith(".webp")), [], "só as artes .webp, nenhum vídeo");
});

test("resumo, falta e descrição para decidir: sem travessão, sem o começo fixo e sem a instrução de uso", () => {
  for (const m of MODELOS_DO_CURSO) {
    const r = resumoDoModelo(m);
    assert.ok(!TRAVESSAO.test(r) && !TRAVESSAO.test(faltaDoModelo(m) ?? ""), m.id);
    assert.ok(!/^Edita qualquer/.test(r), m.id);
    assert.ok(r.length <= 172, `${m.id}: ${r.length}`);
    const d = descricaoParaDecidir(m);
    assert.ok(!TRAVESSAO.test(d) && !/Use sempre que/.test(d) && !/Entrega um MP4/.test(d), m.id);
  }
  const autoridade = MODELOS_DO_CURSO.find((m) => m.id === "modelo-autoridade")!;
  assert.equal(resumoDoModelo(autoridade), "Sóbrio e editorial, como uma revista séria.");
});

test("a escolha do JEV só vale com confiança de 0,5 para cima e dentro das opções", () => {
  const opcoes = ["modelo-a", "modelo-b", "modelo-c", "modelo-d"];
  // A pergunta usa chaves neutras na ordem das opções (10/10): estilo_02 é o modelo-b.
  const probabilities = { estilo_01: 0.1, estilo_02: 0.62, estilo_03: 0.2, estilo_04: 0.08, "fora-da-lista": 0.5 };
  const firme = lerEscolha({ type: "choice", choice: "estilo_02", probabilities, confidence: 0.71 }, opcoes);
  assert.equal(firme.modelo, "modelo-b");
  assert.deepEqual(firme.alternativas.map((a) => a.modelo), ["modelo-b", "modelo-c", "modelo-a"]);
  assert.equal(lerEscolha({ type: "choice", choice: "estilo_02", probabilities, confidence: CONFIANCA_MINIMA - 0.01 }, opcoes).modelo, null, "não sei");
  assert.equal(lerEscolha({ type: "choice", choice: "fora-da-lista", probabilities, confidence: 0.9 }, opcoes).modelo, null);
  assert.equal(lerEscolha(undefined, opcoes).modelo, null);
  assert.equal(lerEscolha({ type: "noul", noul: 0.9 }, opcoes).modelo, null);
});

test("o hash muda com o perfil e com as opções, e não com a ordem das chaves", () => {
  const base = { textos: { nome: "X", nicho: "consórcio de imóveis", publico: "famílias" }, tom: "acolhedor", regrasDaEdicao: ["legenda grande"] };
  const h = hashDaRecomendacao(base, ["a", "b"]);
  assert.equal(hashDaRecomendacao({ ...base, textos: { publico: "famílias", nicho: "consórcio de imóveis", nome: "X" } }, ["b", "a"]), h);
  assert.notEqual(hashDaRecomendacao({ ...base, textos: { ...base.textos, nicho: "advocacia" } }, ["a", "b"]), h);
  assert.notEqual(hashDaRecomendacao(base, ["a", "b", "c"]), h, "modelo novo no corte refaz a recomendação");
  assert.equal(temPerfilParaRecomendar({ textos: { nome: "Só o nome" }, regrasDaEdicao: [] }), false);
  assert.equal(temPerfilParaRecomendar(base), true);
});

test("a pergunta do JEV é uma escolha entre os modelos que servem, e o estado leva o perfil", () => {
  const p = perguntasDoJev(modelosQueServem()).modelo;
  assert.equal(p.type, "choice");
  const criterios = (p as { criteria: Record<string, string> }).criteria;
  assert.deepEqual(Object.keys(criterios), modelosQueServem().map((_, i) => chaveDaOpcao(i)));
  // Sem o nome do modelo na pergunta (10/10): o JEV decide pelo visual, não pela palavra repetida no perfil.
  for (const [i, m] of modelosQueServem().entries()) {
    const escapado = m.nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.doesNotMatch(criterios[chaveDaOpcao(i)], new RegExp(`(^|[^\\p{L}])${escapado}(?=$|[^\\p{L}])`, "iu"), m.id);
  }
  assert.ok(!visualSemNome(MODELOS_DO_CURSO.find((m) => m.id === "modelo-autoridade")!).toLowerCase().startsWith("estilo autoridade"));
  const estado = estadoDoJev({ textos: { nicho: "clínica de estética" }, tom: "elegante", regrasDaEdicao: [] }, { setor: "Saúde", guardas: ["sem antes e depois"] });
  const cliente = estado.cliente as Record<string, unknown>;
  assert.equal(cliente.nicho, "clínica de estética");
  assert.equal(cliente["tom da marca"], "elegante");
  assert.deepEqual(cliente["guardas do setor"], ["sem antes e depois"]);
});

test("o motivo sai limpo: sem travessão, sem aspas, sem repetir o começo da tela", () => {
  assert.equal(limparMotivo('"Baseado no seu perfil, o painel calmo — com números — combina com quem vende consórcio."'), "O painel calmo, com números, combina com quem vende consórcio.");
  assert.equal(limparMotivo("curto"), null);
  const m = MODELOS_DO_CURSO.find((x) => x.id === "modelo-painel")!;
  const doCodigo = motivoEmCodigo(m, { textos: { nicho: "consórcio de imóveis" }, regrasDaEdicao: [] });
  assert.match(doCodigo, /consórcio de imóveis/);
  assert.ok(!TRAVESSAO.test(doCodigo));
});

test("a rota confere dono ou equipe, o GET não paga nada e o PUT recusa modelo que não serve", () => {
  const src = ler("app/api/projects/[id]/modelo-do-curso/route.ts");
  assert.match(src, /podeUsarProjeto\(userId, p\)/);
  assert.equal((src.match(/if \(!\(await podeUsar\(id\)\)\)/g) ?? []).length, 3, "GET, POST e PUT");
  const get = src.slice(src.indexOf("export async function GET"), src.indexOf("export async function POST"));
  assert.ok(!/recomendarModelo/.test(get), "o GET só lê a guardada");
  assert.match(src, /!modeloServeNoCorte\(modelo\)[\s\S]{0,200}status: 400/);
});

test("a tela mostra o editor novo no topo da linguagem, antes dos melhores modelos, e nenhum texto novo tem travessão", () => {
  const cat = ler("components/video/catalogo-de-estilos.tsx");
  const novo = cat.indexOf("<ModelosDoCurso projectId={projectId}");
  assert.ok(novo > 0 && novo < cat.indexOf('id="estilos-melhores"') && novo < cat.indexOf("Ou escreva o estilo com as suas palavras"));
  // Com o editor por comando ligado (produção), o catálogo não aparece: o editor novo vem antes do comando.
  const comando = ler("components/video/comando-do-video.tsx");
  const noComando = comando.indexOf("<ModelosDoCurso projectId={projectId}");
  assert.ok(noComando > 0 && noComando < comando.indexOf("Descreva o vídeo que você quer"));
  const tela = ler("components/video/modelos-do-curso.tsx");
  assert.ok(!TRAVESSAO.test(tela));
  assert.match(tela, /Baseado no seu perfil, recomendo/);
  assert.match(tela, /pessoa criada por IA/, "a tela diz que a pessoa da arte foi criada por IA");
  assert.match(tela, /Voltar ao editor de antes/);
  assert.match(tela, /fica de reserva/);
  assert.match(tela, /m\.serve/, "quem pode ser escolhido vem do catálogo");
  assert.ok(!/modelo-(painel|lousa|agenda)/.test(tela), "sem lista fixa de modelos na tela");
  for (const f of ["lib/media/editor-do-curso/biblioteca.ts", "lib/media/editor-do-curso/recomendacao.ts", "app/api/projects/[id]/modelo-do-curso/route.ts"]) {
    // O travessão só aparece dentro das expressões que o tiram.
    const linhas = ler(f).split("\n").filter((l) => TRAVESSAO.test(l) && !/\[—–\]/.test(l) && !/travessão/i.test(l));
    assert.deepEqual(linhas, [], f);
  }
});
