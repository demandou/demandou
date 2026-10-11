// As artes do projeto com modelo do curso pela IA de imagem (11/10/2026): o
// prompt de estilo de cada modelo (gerado no repo), a composição variada por dia
// e por lâmina, o prompt da peça (texto exato, cores da marca, nada das cores do
// modelo, nada de equipamento sem a frase pedir) e o desenho com o gerador e a
// conferência trocados por falsos. Nada aqui toca banco, rede ou imagem paga.
// Rodar: npx tsx --test scripts/testes/arte-pela-ia-1110.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import catalogo from "../../lib/media/editor-do-curso/catalogo.json" with { type: "json" };
import prompts from "../../lib/media/editor-do-curso/prompts-de-estilo.json" with { type: "json" };
import {
  arteDoModeloPelaIa,
  composicaoDaPeca,
  estiloComoLinguagem,
  frasePedeEquipamento,
  promptDaArteNoModelo,
  promptDeEstiloDoModelo,
  type PromptDeEstilo,
} from "../../lib/media/editor-do-curso/arte-pela-ia.ts";

const CORES = { fundo: "#1e1f22", titulo: "#dbdee1", destaque: "#f97316" };
const TORRE = promptDeEstiloDoModelo("modelo-torre")!;

test("todo modelo do catálogo tem o prompt de estilo, com pelo menos 3 composições e sem hex", () => {
  const lista = prompts as Record<string, PromptDeEstilo>;
  for (const m of catalogo as Array<{ id: string }>) {
    const p = lista[m.id];
    assert.ok(p, `${m.id} sem prompt`);
    assert.ok(p.composicoes.length >= 3, `${m.id} com ${p.composicoes.length} composições`);
    const tudo = JSON.stringify(p);
    assert.doesNotMatch(tudo, /#[0-9a-f]{6}\b/i, `${m.id} com hex`);
    assert.doesNotMatch(tudo, /[—–]/, `${m.id} com travessão`);
  }
});

test("a versão deitada usa o prompt do vertical; modelo sem prompt devolve null", () => {
  assert.equal(promptDeEstiloDoModelo("modelo-torre-16x9"), TORRE);
  assert.equal(promptDeEstiloDoModelo("modelo-que-nao-existe"), null);
  assert.equal(promptDeEstiloDoModelo(null), null);
});

test("a IA é o padrão; ARTE_PELO_MODELO_IA=0 volta ao template", () => {
  assert.equal(arteDoModeloPelaIa({}), true);
  assert.equal(arteDoModeloPelaIa({ ARTE_PELO_MODELO_IA: "1" }), true);
  assert.equal(arteDoModeloPelaIa({ ARTE_PELO_MODELO_IA: "0\n" }), false);
});

test("variedade: dias seguidos e lâminas seguidas não repetem a composição", () => {
  const dias = [1, 2, 3, 4, 5].map((dia) => composicaoDaPeca(TORRE, { dia }));
  assert.equal(new Set(dias).size, 5);
  const laminas = [0, 1, 2, 3].map((lamina) => composicaoDaPeca(TORRE, { dia: 3, lamina }));
  assert.equal(new Set(laminas).size, 4);
  assert.equal(composicaoDaPeca({ composicoes: [] }, { dia: 1 }), "");
});

test("o prompt da peça leva o texto exato, as cores da marca e nunca as do modelo", () => {
  const frase = "Seu conteúdo não precisa de mais ideias — precisa de método";
  const p = promptDaArteNoModelo({ estilo: TORRE, texto: frase, tipo: "post", cores: CORES, composicao: composicaoDaPeca(TORRE, { dia: 2 }), contexto: "Legenda do post sobre método.", nicho: "marketing" });
  assert.match(p, /"Seu conteúdo não precisa de mais ideias, precisa de método"/);
  for (const c of Object.values(CORES)) assert.ok(p.includes(c), `falta ${c}`);
  assert.doesNotMatch(p, /#D9BE8A|#070C17|#F5F0E6/i);
  assert.doesNotMatch(p, /[—–]/);
  assert.match(p, /No camera, microphone/);
  assert.match(p, /No empty boxes/);
  assert.match(p, new RegExp(TORRE.nomeDoEstilo));
});

test("equipamento de gravação só entra quando a frase pede", () => {
  assert.equal(frasePedeEquipamento("Ligue a câmera e comece"), true);
  assert.equal(frasePedeEquipamento("Comece pequeno"), false);
  const p = promptDaArteNoModelo({ estilo: TORRE, texto: "Ligue a câmera e comece", tipo: "post", cores: CORES, composicao: "x" });
  assert.doesNotMatch(p, /No camera, microphone/);
});

test("lâmina do carrossel diz a página e pede a mesma linguagem", () => {
  const p = promptDaArteNoModelo({ estilo: TORRE, texto: "Passo dois", tipo: "lamina", cores: CORES, composicao: "x", pagina: { i: 2, total: 5 } });
  assert.match(p, /slide 2 of 5/);
  assert.match(p, /INNER slide/);
  assert.ok(estiloComoLinguagem(TORRE).startsWith(TORRE.nomeDoEstilo));
});

// ─────────── o desenho, com o gerador e a conferência falsos ───────────

async function imagemFalsa(proporcao: string): Promise<string> {
  const [w, h] = proporcao === "4:5" ? [800, 1000] : proporcao === "1:1" ? [900, 900] : [1600, 900];
  const png = await sharp({ create: { width: w, height: h, channels: 3, background: "#1e1f22" } }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

const MARCA = { familia: "editorial", cores: { acento: "#f97316", escuro: "#1e1f22", claro: "#dbdee1", papeis: { fundo: "#1e1f22", titulo: "#dbdee1", destaque: "#f97316" } } } as never;

test("o carrossel sai lâmina por lâmina, cada uma com a sua composição, juntas por |", async () => {
  const { desenharPelaIa } = await import("../../lib/media/editor-do-curso/arte-pela-ia-servidor.ts");
  const pedidos: string[] = [];
  const porRede = await desenharPelaIa(
    { projectId: "p", runId: "r", modelo: "modelo-torre", mediaType: "carousel", redes: ["instagram", "linkedin"], slides: ["Um", "Dois", "Três"], textoDoPost: "post", dia: 1, marca: MARCA },
    {
      gerar: async (modelo, prompt, proporcao) => {
        pedidos.push(prompt);
        return { dataUrl: await imagemFalsa(proporcao), modelo, custoUsd: 0.134 };
      },
      conferir: async () => ({ aprovada: true, motivo: "ok", medida: { cortado: false, resumo: "ok", lados: {} } }) as never,
    }
  );
  assert.equal(porRede.instagram.split("|").length, 3);
  assert.equal(porRede.instagram, porRede.linkedin);
  assert.equal(pedidos.length, 3);
  const composicoes = pedidos.map((p) => /COMPOSITION FOR THIS PIECE: (.+)/.exec(p)?.[1]);
  assert.equal(new Set(composicoes).size, 3);
  assert.match(pedidos.find((p) => p.includes('"Um"'))!, /COVER slide/);
});

test("arte reprovada nas três tentativas lança (quem chama vai ao caminho de hoje)", async () => {
  const { desenharPelaIa } = await import("../../lib/media/editor-do-curso/arte-pela-ia-servidor.ts");
  let chamadas = 0;
  await assert.rejects(
    desenharPelaIa(
      { projectId: "p", modelo: "modelo-manifesto", mediaType: "image", redes: ["instagram"], frase: "Comece hoje", dia: 2, marca: MARCA },
      {
        gerar: async (modelo, _prompt, proporcao) => {
          chamadas++;
          return { dataUrl: await imagemFalsa(proporcao), modelo, custoUsd: 0.134 };
        },
        conferir: async () => ({ aprovada: false, motivo: "O revisor visual reprovou: palavra escrita errada", medida: { cortado: false, resumo: "ok", lados: {} } }) as never,
      }
    ),
    /não passou na conferência/
  );
  assert.equal(chamadas, 3);
});

test("modelo sem prompt de estilo lança antes de gastar", async () => {
  const { desenharPelaIa } = await import("../../lib/media/editor-do-curso/arte-pela-ia-servidor.ts");
  await assert.rejects(desenharPelaIa({ projectId: "p", modelo: "modelo-x", mediaType: "image", redes: ["instagram"], frase: "a", marca: MARCA }), /não tem o prompt de estilo/);
});
