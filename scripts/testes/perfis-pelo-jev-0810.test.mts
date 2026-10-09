// OS PERFIS DOS CLIENTES PELO JEV (08/10/2026), sem banco e sem rede: o JEV é
// uma função de mentira injetada. Prova que a classificação é decisão do JEV
// (nunca de modelo de texto nem de palavra-chave), que a dúvida vira "outros",
// que a categoria nova só nasce com o sim firme do JEV, e que o hash dos textos
// marca a reclassificação quando o nicho muda.
// Rodar: npx tsx --test scripts/testes/perfis-pelo-jev-0810.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { decidirPerfisPeloJev, type Perguntador } from "@/lib/admin/perfis/decisao-pelo-jev";
import { CATEGORIAS_BASE, OUTROS, candidataACategoria, hashDosTextos, situacaoDoPerfil, temTextoParaClassificar, textosDoPerfil } from "@/lib/admin/perfis/categorias";

const TRAVESSAO = /[—–]/;
type Resp = Awaited<ReturnType<Perguntador>>;

function jevDeMentira(respostas: (chave: string, pergunta: { type: string; criteria?: Record<string, string> }) => Resp[string] | undefined, registro: Array<Record<string, unknown>> = []): Perguntador {
  return async (ctx, perguntas) => {
    registro.push({ etapa: ctx.etapa, chaves: Object.keys(perguntas), state: ctx.state });
    const saida: Resp = {};
    for (const [k, p] of Object.entries(perguntas)) {
      const r = respostas(k, p as never);
      if (r) saida[k] = r;
    }
    return saida;
  };
}

const escolha = (choice: string, confidence: number): Resp[string] => ({ type: "choice", choice, probabilities: {}, confidence });

test("o JEV decide a categoria, o negócio e a pessoa; só a escolha confiante vale", async () => {
  const registro: Array<Record<string, unknown>> = [];
  const jev = jevDeMentira((k) => {
    if (k === "categoria:p1") return escolha("advogados", 0.9);
    if (k === "negocio:p1") return escolha("b2c", 0.8);
    if (k === "pessoa:p1") return escolha("pessoa", 0.3); // em dúvida
    if (k === "categoria:p2") return escolha("medicos", 0.4); // em dúvida: outros
    if (k === "negocio:p2") return escolha("inventado", 0.9); // fora da lista
    return undefined;
  }, registro);
  const r = await decidirPerfisPeloJev(
    [
      { id: "p1", textos: { nicho: "Advocacia trabalhista para empregados", publico: "trabalhadores demitidos" } },
      { id: "p2", textos: { nicho: "um texto qualquer muito longo e cheio de coisas sem fim que não vira candidata nenhuma" } },
    ],
    [],
    jev
  );
  assert.equal(r.falhou, false);
  const p1 = r.decisoes.find((d) => d.projectId === "p1")!;
  assert.equal(p1.categoria, "advogados");
  assert.equal(p1.categoriaNome, "Advogados e jurídico");
  assert.equal(p1.negocio, "b2c");
  assert.equal(p1.pessoa, null);
  assert.equal(p1.fonte, "jev");
  assert.equal(p1.hashDosTextos, hashDosTextos(p1.textos));
  const p2 = r.decisoes.find((d) => d.projectId === "p2")!;
  assert.equal(p2.categoria, OUTROS.id);
  assert.equal(p2.negocio, null);
  // Uma pergunta de categoria por projeto, com todas as opções da casa mais "outros".
  const primeira = registro[0] as { chaves: string[]; state: { projetos: unknown[] } };
  assert.ok(primeira.chaves.includes("categoria:p1") && primeira.chaves.includes("pessoa:p2"));
  assert.equal(primeira.state.projetos.length, 2);
  assert.equal(registro[0].etapa, "perfis-categoria");
  for (const c of CATEGORIAS_BASE) assert.doesNotMatch(`${c.nome} ${c.descricao}`, TRAVESSAO);
});

test("categoria nova só com o sim firme do JEV; recusada, fica em outros com os textos", async () => {
  const jev = jevDeMentira((k) => {
    if (k.startsWith("categoria:")) return escolha(OUTROS.id, 0.95);
    if (k === "nova:p1") return { type: "noul", noul: 0.9 };
    if (k === "nova:p2") return { type: "noul", noul: 0.4 };
    return undefined;
  });
  const r = await decidirPerfisPeloJev(
    [
      { id: "p1", textos: { nicho: "Arquitetura naval para estaleiros" } },
      { id: "p2", textos: { nicho: "Coisas variadas" } },
    ],
    [],
    jev
  );
  assert.equal(r.novas.length, 1);
  assert.equal(r.novas[0].id, "arquitetura_naval");
  assert.equal(r.novas[0].nome, "Arquitetura naval");
  assert.equal(r.novas[0].textoDeOrigem, "Arquitetura naval para estaleiros");
  const p1 = r.decisoes.find((d) => d.projectId === "p1")!;
  assert.equal(p1.categoria, "arquitetura_naval");
  assert.equal(p1.categoriaNova, true);
  const p2 = r.decisoes.find((d) => d.projectId === "p2")!;
  assert.equal(p2.categoria, OUTROS.id);
  // A categoria aceita já é opção para a próxima rodada.
  const jev2 = jevDeMentira((k, p) => (k.startsWith("categoria:") && p.criteria && "arquitetura_naval" in p.criteria ? escolha("arquitetura_naval", 0.9) : undefined));
  const r2 = await decidirPerfisPeloJev([{ id: "p3", textos: { nicho: "Projetos de navios" } }], r.novas, jev2);
  assert.equal(r2.decisoes[0].categoria, "arquitetura_naval");
  assert.equal(r2.decisoes[0].categoriaNova, true);
});

test("JEV fora do ar: o lote fica sem decisão, sem caminho de reserva por modelo de texto", async () => {
  const jev: Perguntador = async () => {
    throw new Error("JEV respondeu 503");
  };
  const r = await decidirPerfisPeloJev([{ id: "p1", textos: { nicho: "Advocacia" } }], [], jev);
  assert.equal(r.falhou, true);
  assert.deepEqual(r.semDecisao, ["p1"]);
  assert.equal(r.decisoes.length, 0);
});

test("os textos: a candidata, o hash e a situação (mudou o nicho, reclassifica)", () => {
  const t = textosDoPerfil({ nome: "Clínica Vida", nicho: "  Clínica de  fisioterapia ", publico: null, quemE: { pessoa: "Dr. João", produto: 42 }, cadastro: { faz: "fisio", setor: null, cargo: undefined } });
  assert.deepEqual(t, { nome: "Clínica Vida", nicho: "Clínica de fisioterapia", redesPessoa: "Dr. João", cadastroFaz: "fisio" });
  assert.equal(temTextoParaClassificar({ nome: "Só o nome" }), false);
  assert.equal(temTextoParaClassificar(t), true);
  const guardado = { hashDosTextos: hashDosTextos(t) };
  assert.equal(situacaoDoPerfil(t, guardado), "classificado");
  assert.equal(situacaoDoPerfil({ ...t, nicho: "Clínica de pilates" }, guardado), "desatualizado");
  assert.equal(situacaoDoPerfil(t, null), "sem_classificacao");
  assert.equal(situacaoDoPerfil({ nome: "x" }, guardado), "sem_texto");
  // O hash não muda com maiúsculas, muda com o texto.
  assert.equal(hashDosTextos({ nicho: "ADVOCACIA" }), hashDosTextos({ nicho: "advocacia" }));
  assert.notEqual(hashDosTextos({ nicho: "advocacia" }), hashDosTextos({ nicho: "medicina" }));
  assert.deepEqual(candidataACategoria({ nicho: "Consórcio de imóveis para famílias" }), { nome: "Consórcio de imóveis", id: "consorcio_de_imoveis" });
  assert.equal(candidataACategoria({ nicho: "um texto muito longo cheio de palavras demais para ser uma categoria de verdade" }), null);
  assert.equal(candidataACategoria({ publico: "só público" }), null);
  assert.equal(candidataACategoria({ cadastroSetor: "Energia solar" })?.id, "energia_solar");
});
