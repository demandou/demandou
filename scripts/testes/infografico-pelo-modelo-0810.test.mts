// O INFOGRÁFICO PELO MODELO DE IMAGEM (08/10/2026). O pedido do Bruno: "os
// infográficos não estão usando um modelo de IA (...) fora que o formato sai
// errado para Instagram". O infográfico passa a ser desenhado pelo Nano Banana
// Pro na proporção nativa de cada grupo de redes, o texto pedido vai para a
// conferência, e o card mostra a arte 4:5 do Instagram.
// Nada aqui toca banco, rede ou IA paga: o gerador e a conferência são falsos.
// Rodar: npx tsx --test scripts/testes/infografico-pelo-modelo-0810.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { desenharInfografico, pedidoDoInfografico, type ConteudoDoInfografico } from "@/lib/media/infographic";
import {
  FICHA_DO_MODELO,
  ehInfograficoSemImagem,
  ORDEM_ALTERNATIVA,
  ORDEM_PRINCIPAL,
  pedidoAoGoogle,
  promptDoInfografico,
  textosDoInfografico,
  type GeradorDoInfografico,
  type ModeloDoInfografico,
} from "@/lib/media/infografico-pelo-modelo";
import { artePrincipal, produzirArtePorRede } from "@/lib/media/arte-por-rede";
import { decidirPelaDescricao, textoPedidoNaArte, type conferirArte } from "@/lib/media/conferencia-da-arte";
import { medirMargem } from "@/lib/media/margem-de-seguranca";
import { formatoDaPeca, gruposDeFormato, type ProporcaoPedida } from "@/lib/media/formatos-das-redes";
import type { MarcaDaArte } from "@/lib/media/arte-com-frase";

const CONTEUDO: ConteudoDoInfografico = {
  title: "Conteúdo que vende sem você gravar todo dia",
  // O travessão vem escrito como escape (regra do Bruno: nunca travessão em texto novo).
  subtitle: "Um vídeo vira a semana inteira de posts \u2014 com o seu jeito de falar.",
  highlight: { value: "7 peças", label: "saem de um único vídeo" },
  sections: [
    { heading: "Grave uma vez", body: "Um vídeo de 10 minutos alimenta todas as redes da semana." },
    { heading: "O squad escreve", stat: "R$ 7,6 bi", body: "O mercado de conteúdo cresce e a atenção é curta." },
    { heading: "Você aprova", body: "Cada peça chega pronta no quadro para um clique." },
  ],
  keyNumbers: [{ value: "59%", label: "das pequenas empresas já usam IA" }],
};

const MARCA: MarcaDaArte = {
  familia: "impacto",
  cores: { acento: "#98092b", escuro: "#1f2f3a", claro: "#f5f0ec", papeis: { fundo: "#f5f0ec", titulo: "#1f2f3a", destaque: "#98092b" } },
  letra: "classica",
  tipografia: "serifada",
  projectId: "cmu7hmu0j000004jrh2yc5udb",
  identidadeAprovada: true,
};

/** Uma imagem de verdade (cor chapada) na proporção pedida, para o recorte e a régua funcionarem. */
async function imagemFalsa(proporcao: ProporcaoPedida): Promise<string> {
  const [w, h] = proporcao === "4:5" ? [1600, 2000] : proporcao === "9:16" ? [1080, 1920] : proporcao === "1:1" ? [1600, 1600] : [2048, 1152];
  const buf = await sharp({ create: { width: w, height: h, channels: 3, background: "#f5f0ec" } }).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

/** O gerador falso: guarda quem foi chamado, em que proporção e com que prompt. */
function geradorFalso(falhar: ModeloDoInfografico[] = []) {
  const chamadas: Array<{ modelo: ModeloDoInfografico; proporcao: ProporcaoPedida; prompt: string }> = [];
  const gerar: GeradorDoInfografico = async (modelo, prompt, proporcao) => {
    chamadas.push({ modelo, proporcao, prompt });
    if (falhar.includes(modelo)) throw new Error(`${modelo} fora do ar`);
    return { dataUrl: await imagemFalsa(proporcao), modelo: FICHA_DO_MODELO[modelo].id, custoUsd: FICHA_DO_MODELO[modelo].precoUsd };
  };
  return { gerar, chamadas };
}

async function silencioso<T>(f: () => Promise<T>): Promise<T> {
  const w = console.warn;
  const e = console.error;
  console.warn = () => {};
  console.error = () => {};
  try {
    return await f();
  } finally {
    console.warn = w;
    console.error = e;
  }
}

test("o infográfico chama o modelo de imagem (Nano Banana Pro primeiro), e o molde em código saiu", async () => {
  const { gerar, chamadas } = geradorFalso();
  const url = await desenharInfografico(CONTEUDO, "", "4:5", { estilo: "editorial flat illustration", paleta: "", marca: MARCA }, { gerar, nicho: "marketing" });
  assert.ok(url.startsWith("data:image/jpeg;base64,"));
  assert.equal(chamadas.length, 1);
  assert.equal(chamadas[0].modelo, "nano-banana-pro");
  assert.equal(FICHA_DO_MODELO["nano-banana-pro"].id, "gemini-3-pro-image-preview");
  assert.equal(chamadas[0].proporcao, "4:5");
  // O molde em código não existe mais nem é importado.
  assert.equal(existsSync(join(process.cwd(), "lib", "media", "infografico-em-codigo.tsx")), false);
  const fonte = readFileSync(join(process.cwd(), "lib", "media", "infographic.ts"), "utf8");
  assert.doesNotMatch(fonte, /infografico-em-codigo|montarInfograficoEmCodigo/);
});

test("o Pro fora do ar: o próximo modelo desenha; todos fora: erro neutro, sem desenho em código", async () => {
  const um = geradorFalso(["nano-banana-pro"]);
  await silencioso(() => desenharInfografico(CONTEUDO, "", "16:9", { estilo: "", paleta: "", marca: MARCA }, { gerar: um.gerar }));
  assert.deepEqual(um.chamadas.map((c) => c.modelo), ["nano-banana-pro", "nano-banana-2"]);

  const todos = geradorFalso(["nano-banana-pro", "nano-banana-2", "gpt-image"]);
  await silencioso(() =>
    assert.rejects(desenharInfografico(CONTEUDO, "", "4:5", { estilo: "", paleta: "", marca: MARCA }, { gerar: todos.gerar }), (e: unknown) => {
      assert.ok(ehInfograficoSemImagem(e));
      // A mensagem chega ao cliente: nem fornecedor nem saldo.
      assert.doesNotMatch((e as Error).message, /google|gemini|higgsfield|openai|saldo/i);
      assert.equal(e.motivos.length, 3);
      return true;
    })
  );
  assert.deepEqual(ORDEM_ALTERNATIVA[0], "gpt-image", "o outro modelo começa por outra família");
  assert.deepEqual(ORDEM_PRINCIPAL[0], "nano-banana-pro");
});

test("a proporção do Instagram é 4:5, a paisagem é 16:9, e as duas vão nativas ao Google", () => {
  assert.equal(formatoDaPeca("instagram", "infographic").proporcao, "4:5");
  assert.equal(formatoDaPeca("instagram", "infographic").largura, 1080);
  assert.equal(formatoDaPeca("instagram", "infographic").altura, 1350);
  const grupos = gruposDeFormato(["linkedin", "instagram", "facebook", "twitter"], "infographic");
  assert.deepEqual(grupos.map((g) => g.proporcao).sort(), ["16:9", "4:5"]);
  assert.deepEqual(grupos.find((g) => g.proporcao === "4:5")!.redes.map((r) => r.platform), ["instagram"]);

  const ig = pedidoAoGoogle("nano-banana-pro", "x", "4:5");
  assert.match(ig.url, /models\/gemini-3-pro-image-preview:generateContent$/);
  const cfg = (ig.corpo.generationConfig as { imageConfig: { aspectRatio: string; imageSize: string } }).imageConfig;
  assert.equal(cfg.aspectRatio, "4:5");
  assert.equal(cfg.imageSize, "2K");
  const li = pedidoAoGoogle("nano-banana-pro", "x", "16:9");
  assert.equal((li.corpo.generationConfig as { imageConfig: { aspectRatio: string } }).imageConfig.aspectRatio, "16:9");
  // A chave não vai na URL.
  assert.doesNotMatch(ig.url, /key=/);
});

test("o prompt leva o texto exato entre aspas, as cores nos papéis, a letra, o estilo e o nicho, sem travessão", () => {
  const p = promptDoInfografico({ conteudo: CONTEUDO, marca: MARCA, proporcao: "4:5", estilo: "hand drawn editorial, warm paper texture", nicho: "marketing para pequenas empresas" });
  assert.match(p, /TITLE: "Conteúdo que vende sem você gravar todo dia"/);
  assert.match(p, /MAIN NUMBER: "7 peças" with the label "saem de um único vídeo"/);
  assert.match(p, /number "R\$ 7,6 bi"/);
  assert.match(p, /"59%" with the label "das pequenas empresas já usam IA"/);
  assert.match(p, /background #f5f0ec/);
  assert.match(p, /title and all body text #1f2f3a/);
  assert.match(p, /accent #98092b ONLY in details/);
  assert.match(p, /Playfair Display style typeface/);
  assert.match(p, /hand drawn editorial, warm paper texture/);
  assert.match(p, /Ignore every object, person, place or scene it names/);
  assert.match(p, /marketing para pequenas empresas/);
  assert.match(p, /HIERARCHY/);
  assert.match(p, /vertical portrait 4:5/);
  assert.doesNotMatch(p, /\u2014/, "o travessão do subtítulo não chega à peça");
  assert.match(p, /semana inteira de posts, com o seu jeito de falar/);
  // A paisagem pede letra grande (a lição do 16:9 reprovado na leitura em 06/10).
  assert.match(promptDoInfografico({ conteudo: CONTEUDO, marca: MARCA, proporcao: "16:9" }), /keep every text LARGE/);
});

test("o texto esperado do infográfico vai para a conferência, com texto obrigatório, régua e olho", async () => {
  const { gerar } = geradorFalso();
  const recebidas: Array<Parameters<typeof conferirArte>[1]> = [];
  const conferir: typeof conferirArte = async (dataUri, opcoes) => {
    recebidas.push(opcoes);
    return { aprovada: true, motivo: "ok", medida: await medirMargem(dataUri) };
  };
  const pedido = pedidoDoInfografico(CONTEUDO, { estilo: "", paleta: "", marca: MARCA }, { gerar, ctx: { operation: "infografico" } });
  assert.equal(pedido.contentType, "infographic");
  assert.equal(pedido.textoDesenhadoPeloModelo, true);
  assert.ok(pedido.desenharAlternativo, "há outro modelo para a reprovação de escrita");
  const esperado = textosDoInfografico(CONTEUDO);
  assert.deepEqual(pedido.textoEsperado, esperado);
  assert.ok(esperado.every((t) => !/\u2014/.test(t)), "o texto esperado não tem travessão");
  assert.ok(esperado.includes("Conteúdo que vende sem você gravar todo dia"));
  assert.ok(esperado.includes("R$ 7,6 bi"));

  await produzirArtePorRede({ redes: ["instagram", "linkedin"], textoDoPost: "post", conferir, ...pedido });
  assert.equal(recebidas.length, 2, "uma conferência por proporção");
  for (const o of recebidas) {
    assert.deepEqual(o.textoEsperado, pedido.textoEsperado);
    assert.equal(o.textoObrigatorio, true);
    assert.equal(o.usarRegua, true, "o texto é desenhado pelo modelo: a régua da margem vale");
    assert.notEqual(o.usarOlho, false, "o infográfico voltou ao olho");
  }
});

test("o card mostra a arte 4:5 do Instagram; sem Instagram, a regra de antes", async () => {
  const { gerar, chamadas } = geradorFalso();
  const conferir: typeof conferirArte = async (dataUri) => ({ aprovada: true, motivo: "ok", medida: await medirMargem(dataUri) });
  const arte = await produzirArtePorRede({
    redes: ["linkedin", "instagram", "facebook"],
    textoDoPost: "post",
    conferir,
    ...pedidoDoInfografico(CONTEUDO, { estilo: "", paleta: "", marca: MARCA }, { gerar }),
  });
  assert.deepEqual(chamadas.map((c) => c.proporcao).sort(), ["16:9", "4:5"], "uma geração por proporção");
  assert.equal(arte.principal, arte.porRede.instagram);
  const m = await sharp(Buffer.from(arte.principal!.split(",")[1], "base64")).metadata();
  assert.deepEqual([m.width, m.height], [1080, 1350]);
  const li = await sharp(Buffer.from(arte.porRede.linkedin.split(",")[1], "base64")).metadata();
  assert.deepEqual([li.width, li.height], [1200, 627]);

  assert.equal(artePrincipal({ linkedin: "L", instagram: "I", twitter: "X" }), "I");
  assert.equal(artePrincipal(new Map([["facebook", "F"], ["linkedin", "L"]])), "L");
  assert.equal(artePrincipal({ tiktok: "T" }), "T");
  // A semana do vídeo usa a mesma regra para o card (era a arte da rede principal do dia).
  const semana = readFileSync(join(process.cwd(), "lib", "media", "pecas-da-semana.ts"), "utf8");
  assert.match(semana, /mediaUrl: artePrincipal\(arte\.porRede\) \?\? url/);
  assert.match(semana, /mediaUrl: artePrincipal\(artes\) \?\? url/);
});

test("reprovação de escrita refaz no outro modelo, pedindo o texto exato (e não 'sem texto')", async () => {
  const { gerar, chamadas } = geradorFalso();
  let vez = 0;
  const conferir: typeof conferirArte = async (dataUri) => {
    vez++;
    const medida = await medirMargem(dataUri);
    return vez === 1 ? { aprovada: false, motivo: 'O revisor visual reprovou: texto pedido escrito errado ou faltando: peças', medida } : { aprovada: true, motivo: "ok", medida };
  };
  const arte = await produzirArtePorRede({ redes: ["instagram"], textoDoPost: "post", conferir, ...pedidoDoInfografico(CONTEUDO, { estilo: "", paleta: "", marca: MARCA }, { gerar }) });
  assert.deepEqual(chamadas.map((c) => c.modelo), ["nano-banana-pro", "gpt-image"]);
  assert.match(chamadas[1].prompt, /Render every listed string exactly once/);
  assert.doesNotMatch(chamadas[1].prompt, /prefer an image with NO text/);
  assert.ok(arte.avisos.some((a) => /outro modelo/.test(a)));
  assert.equal(arte.algumaReprovada, false);
});

test("a conta do texto pedido: número tem de ser idêntico, e arte sem texto reprova", () => {
  const pedido = textosDoInfografico(CONTEUDO);
  const certo = textoPedidoNaArte(pedido, pedido);
  assert.deepEqual(certo.numerosFaltando, []);
  assert.deepEqual(certo.palavrasFaltando, []);

  const errado = pedido.map((t) => t.replace("7,6", "76").replace("único", "unico"));
  const conta = textoPedidoNaArte(pedido, errado);
  assert.deepEqual(conta.numerosFaltando, ["7,6"]);
  assert.deepEqual(conta.palavrasFaltando, ["único"], "acento faltando é palavra diferente");

  const textos = (ts: string[]) => ({ textos: ts.map((texto) => ({ texto, borda: "longe" })), pessoas: "nenhuma", cortado: "nada" });
  assert.match(decidirPelaDescricao(textos(errado), { textoEsperado: pedido, textoObrigatorio: true }).reprovou ?? "", /número escrito diferente ou faltando: 7,6/);
  assert.match(decidirPelaDescricao(textos([]), { textoEsperado: pedido, textoObrigatorio: true }).reprovou ?? "", /sem o texto/);
  assert.equal(decidirPelaDescricao(textos(pedido), { textoEsperado: pedido, textoObrigatorio: true }).reprovou, null);
  // A arte com a frase composta em código não muda: texto ausente não reprova ali.
  assert.equal(decidirPelaDescricao(textos([]), { textoEsperado: ["Uma frase"] }).reprovou, null);
});
