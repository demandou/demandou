/**
 * PROVA LOCAL DA INTEGRAÇÃO DAS ARTES PELO MODELO (10/10/2026), de ponta a
 * ponta e SEM ESCREVER NADA NA PRODUÇÃO:
 *
 *   1  lê (SELECT) os posts reais de uma semana do vídeo do projeto Demandou e
 *      passa pela MESMA regra do app (regraDaArtePeloModelo, diaVaiPeloModelo);
 *   2  monta a coleta com as MESMAS funções da semana (pecasDoDiaNoModelo,
 *      adicionarPecas, marcasDoModelo), numa cópia dos posts em memória;
 *   3  monta o pedido com a MESMA base do app (baseDoPedido: cores da marca,
 *      quem fala, foto da pessoa da Biblioteca, logo das artes de hoje);
 *   4  roda o `arteNoModelo` do worker aqui, com a parte escrita feita pelas
 *      mesmas funções da rota /api/editor-do-curso/plano (sem HTTP);
 *   5  simula o callback (as imagens ficam no disco; as URLs são de mentira) e
 *      aplica lerCallbackDaArte + planoDoCallback + legendaComCreditos na cópia
 *      em memória, e simula também a falha e a peça que faltou (a reserva).
 *
 * O banco é só leitura (o cliente do Prisma recusa toda escrita), nada sobe
 * para o Blob, e o gasto de IA tem teto (livro-caixa em <saida>/gasto.json).
 *
 * Uso:
 *   npx tsx@4 --env-file=.env.local --tsconfig tsconfig.json scripts/tmp/provar-arte-integrada.mts \
 *     [--run <runId>] [--teto-total 1.5] [--reusar-plano <arquivo json>]
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const args = process.argv.slice(2);
const opcao = (nome: string, padrao: string) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? args[i + 1] : padrao;
};
const projectId = "cmu7hmu0j000004jrh2yc5udb";
const SAIDA = "C:/Users/devan/AppData/Local/Temp/claude/c--/7d44153b-b916-4289-8e78-2c8f60583a30/scratchpad/arte-integrada";
const tetoTotal = Number(opcao("teto-total", "1.5"));
const planoReusado = opcao("reusar-plano", "") ? JSON.parse(readFileSync(opcao("reusar-plano", ""), "utf8")) : null;

// A trava liga só neste processo, e o ambiente do worker na máquina local.
process.env.ARTE_PELO_MODELO = "1";
process.env.PYTHON_DO_RECORTE ??= "python";
process.env.MODELO_ROSTO ??= "C:/Users/devan/AppData/Local/Temp/claude/c--/7d44153b-b916-4289-8e78-2c8f60583a30/scratchpad/prova-curso/face_landmarker.task";
process.env.AVISO_DE_SALDO = "0";

// SÓ LEITURA, antes de qualquer módulo do app abrir o banco.
const ESCRITA = /^(create|createMany|createManyAndReturn|update|updateMany|updateManyAndReturn|upsert|delete|deleteMany|executeRaw|executeRawUnsafe|\$executeRaw|\$executeRawUnsafe)$/;
const base = new (PrismaClient as unknown as new (o: unknown) => PrismaClient)({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });
let escritasRecusadas = 0;
const soLeitura = base.$extends({
  query: {
    async $allOperations({ model, operation, args: a, query }: { model?: string; operation: string; args: unknown; query: (x: unknown) => Promise<unknown> }) {
      if (ESCRITA.test(operation)) {
        escritasRecusadas++;
        throw new Error(`prova só leitura: ${model ?? ""}.${operation} recusado`);
      }
      return query(a);
    },
  },
});
(globalThis as unknown as { prisma: unknown }).prisma = soLeitura;

const pure = await import("@/lib/media/editor-do-curso/arte-pelo-modelo");
const servidor = await import("@/lib/media/editor-do-curso/arte-pelo-modelo-servidor");
const { modeloGravadoNosPosts } = await import("@/lib/estilo-dos-posts/tipos");
const { fotosGravadasNosPosts } = await import("@/lib/materiais/material-da-campanha");
const { esperaDaIdentidade, semEspera } = await import("@/lib/modelos-de-arte/espera-da-identidade");
const { escreverPlanoDoModelo, numerosSemLastro } = await import("@/lib/media/editor-do-curso/escrever-plano");
const { escolherImagensDoModelo, pedirImagensDoModelo } = await import("@/lib/media/editor-do-curso/imagens");
const { revisarQuadrosDoModelo } = await import("@/lib/media/editor-do-curso/revisao");
const sharp = (await import("sharp")).default;
const arte = await import(pathToFileURL(path.resolve("worker/src/modelo/arte-no-modelo.mjs")).href);

mkdirSync(SAIDA, { recursive: true });
const log: string[] = [];
const dizer = (s: string) => {
  console.log(s);
  log.push(s);
};

// 1. A regra do projeto e os posts reais (a semana do vídeo mais recente com foto e carrossel).
const regra = await servidor.regraDaArtePeloModelo(projectId);
dizer(`regra do projeto: ${JSON.stringify(regra)}`);
if (!regra) throw new Error("a regra não vale para o projeto: nada a provar");
const runId = opcao("run", "") || (await soLeitura.post.findFirst({ where: { projectId, mediaType: "carousel", metadata: { path: ["origem"], equals: "video" }, status: { in: ["draft", "scheduled"] } }, orderBy: { createdAt: "desc" }, select: { runId: true } }))?.runId;
if (!runId) throw new Error("sem semana do vídeo com carrossel");
const reais = await soLeitura.post.findMany({
  where: { projectId, runId, mediaType: { in: ["image", "carousel"] }, metadata: { path: ["origem"], equals: "video" } },
  select: { id: true, platform: true, mediaType: true, imageUrl: true, runId: true, dayOfWeek: true, metadata: true, content: true, status: true },
  orderBy: { dayOfWeek: "asc" },
});
dizer(`run ${runId}: ${reais.length} post(s) de foto e carrossel`);

// 2. A coleta, dia a dia, com as funções da semana; a cópia dos posts em memória.
const coleta = pure.novaColeta(`arte-${runId}-prova`);
type Copia = (typeof reais)[number] & { metadataAntes: unknown };
const copia: Copia[] = [];
const dias = [...new Set(reais.map((p) => `${p.dayOfWeek}:${p.mediaType}`))];
for (const chave of dias) {
  const posts = reais.filter((p) => `${p.dayOfWeek}:${p.mediaType}` === chave);
  const formato = posts[0].mediaType as "image" | "carousel";
  const meta = posts[0].metadata as { frase?: string; slides?: string[] };
  const vai = pure.diaVaiPeloModelo({ formato, modeloDoDia: modeloGravadoNosPosts(posts), modo: regra.modo, fotosDoDia: fotosGravadasNosPosts(posts)?.length ?? 0 });
  dizer(`dia ${chave}: ${posts.map((p) => p.platform).join(", ")}; vai pelo modelo: ${vai}`);
  if (!vai) continue;
  const { pecas, formatoDaRede } = pure.pecasDoDiaNoModelo({ formato, redes: posts.map((p) => p.platform), frase: meta.frase, slides: meta.slides });
  const { lote, indices } = pure.adicionarPecas(coleta, pecas);
  for (const p of posts) {
    copia.push({ ...p, imageUrl: null, metadataAntes: p.metadata, metadata: pure.marcasDoModelo(p.metadata, { lote, indices, formato: formatoDaRede[p.platform], modelo: regra.modelo }) as never });
  }
}
const lote = coleta.lotes[0];
if (!lote || coleta.lotes.length !== 1) throw new Error(`a prova espera um lote só (veio ${coleta.lotes.length})`);
dizer(`lote ${lote.chave}: ${lote.pecas.length} peças: ${lote.pecas.map((p, i) => `${i + 1}. ${p.tipo} [${p.formatos.join(", ")}] "${p.texto}"`).join(" | ")}`);
dizer(`espera na tela antes do callback: ${copia.map((p) => `${p.platform}/${p.mediaType}=${esperaDaIdentidade({ imageUrl: p.imageUrl, metadata: p.metadata })?.estado}`).join(", ")}`);

// 3. A base do pedido, como o app manda ao worker.
const basePedido = await servidor.baseDoPedido(projectId, runId);
dizer(`base: cores ${JSON.stringify(basePedido.cores)}, quem fala "${basePedido.marca.nome}", foto da pessoa: ${basePedido.fotoUrl ? "sim" : "não"}, logo: ${basePedido.logo ? `sim (proporção ${basePedido.logo.proporcao.toFixed(2)}, pastilha ${basePedido.logo.pastilha ? "sim" : "não"})` : "não"}`);
const pedido = {
  chave: lote.chave,
  modelo: regra.modelo,
  pecas: lote.pecas,
  cores: basePedido.cores,
  fotoUrl: basePedido.fotoUrl,
  marca: basePedido.marca,
  nicho: basePedido.nicho,
  logo: basePedido.logo,
  tetoUsd: pure.tetoDoLoteUsd(lote.pecas.length),
  voltas: 3,
};

// 4. A parte escrita, como a rota do plano faz, com o livro-caixa e o teto da prova.
const livro = path.join(SAIDA, "gasto.json");
const lerLivro = (): { total: number; chamadas: Array<Record<string, unknown>> } => (existsSync(livro) ? JSON.parse(readFileSync(livro, "utf8")) : { total: 0, chamadas: [] });
const RESERVA_POR_CHAMADA = 0.4;
const usage = { projectId, runId, operation: "arte-no-modelo" };
let volta = 0;
const pedirPlano = async (corpo: Record<string, any>) => {
  const fase = corpo.fase ?? "plano";
  if (planoReusado && fase === "plano") {
    dizer("  [plano] reusado de uma rodada anterior desta prova, US$ 0");
    return { mapa: planoReusado.mapa ?? "", plano: planoReusado.plano, numerosSemLastro: [], custoUsd: 0 };
  }
  const caixa = lerLivro();
  if (caixa.total + RESERVA_POR_CHAMADA > tetoTotal) throw new Error(`teto da prova de US$ ${tetoTotal}: já foram US$ ${caixa.total.toFixed(3)}, parei antes de chamar a IA`);
  let custo = 0;
  const comum = { modelo: process.env.EDITOR_DO_CURSO_IA || undefined, usage, onCusto: (u: number) => (custo += u) };
  let r: Record<string, unknown>;
  if (fase === "escolher") r = { escolhas: await escolherImagensDoModelo({ referencias: corpo.referencias, pedidos: corpo.pedidos ?? [], folhas: corpo.folhas ?? [], ...comum }) };
  else if (fase === "revisar") r = { problemas: await revisarQuadrosDoModelo({ referencias: corpo.referencias, plano: corpo.plano ?? null, folhas: corpo.folhas ?? [], legendas: corpo.legendas, ...comum }) };
  else if (fase === "imagens") r = await pedirImagensDoModelo({ referencias: corpo.referencias, esqueleto: corpo.esqueleto, nicho: corpo.nicho ?? null, pecasParadas: corpo.pecasParadas ?? null, ...comum });
  else {
    const escrito = await escreverPlanoDoModelo({ referencias: corpo.referencias, esqueleto: corpo.esqueleto, marca: corpo.marca, nicho: corpo.nicho ?? null, anterior: corpo.anterior ?? null, mapa: corpo.mapa ?? null, pecasParadas: corpo.pecasParadas ?? null, ...comum });
    r = { ...escrito, numerosSemLastro: numerosSemLastro(escrito.plano, corpo.esqueleto.palavras, escrito.plano.correcoes as Record<string, string> | undefined) };
    volta++;
    mkdirSync(path.join(SAIDA, "planos"), { recursive: true });
    writeFileSync(path.join(SAIDA, "planos", `volta-${volta}.json`), JSON.stringify({ mapa: r.mapa, plano: r.plano }, null, 2));
  }
  const depois = lerLivro();
  depois.total = +(depois.total + custo).toFixed(4);
  depois.chamadas.push({ fase, custoUsd: +custo.toFixed(4), em: new Date().toISOString() });
  writeFileSync(livro, JSON.stringify(depois, null, 2));
  dizer(`  [${fase}] US$ ${custo.toFixed(3)} (prova inteira US$ ${depois.total.toFixed(3)})`);
  return { ...r, custoUsd: custo };
};
const obterFoto = async (url: string, destino: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`a foto não baixou (${r.status})`);
  const arquivo = `${destino}.jpg`;
  writeFileSync(arquivo, Buffer.from(await r.arrayBuffer()));
  return arquivo;
};

if (args.includes("--seco")) {
  dizer(`--seco: parei antes do worker. Pedido sem o logo: ${JSON.stringify({ ...pedido, logo: pedido.logo ? "(data URI)" : null })}`);
  await base.$disconnect().catch(() => {});
  process.exit(0);
}
const pasta = path.join(SAIDA, "trabalho");
rmSync(pasta, { recursive: true, force: true });
const t0 = Date.now();
const feito = await arte.arteNoModelo(pedido, pasta, { pedirPlano, obterFoto, aoPasso: (p: string) => dizer(`[${((Date.now() - t0) / 1000).toFixed(0)} s] ${p}`) });
writeFileSync(path.join(SAIDA, "plano-aprovado.json"), JSON.stringify({ mapa: feito.mapa, plano: JSON.parse(readFileSync(path.join(feito.projeto, "src", "plano.json"), "utf8")) }, null, 2));

// As imagens prontas (JPEG com o logo) na pasta da prova.
const pastaDasPecas = path.join(SAIDA, "pecas");
rmSync(pastaDasPecas, { recursive: true, force: true });
mkdirSync(pastaDasPecas, { recursive: true });
const urlLocal = new Map<string, string>();
for (const p of feito.pecas) {
  const destino = path.join(pastaDasPecas, path.basename(p.arquivo));
  copyFileSync(p.arquivo, destino);
  urlLocal.set(`https://prova.local/${path.basename(p.arquivo)}`, destino);
}
dizer(`peças: ${feito.pecas.map((p: Record<string, any>) => `${p.indice} ${p.tipo} ${p.formato} logo=${p.logo?.canto ?? "não"}${p.logo?.pastilha ? " (pastilha)" : ""} momento=${p.momento.tipo} recorte=${p.recorte.modo}`).join(" | ")}`);

// 5. O callback simulado, aplicado na cópia em memória com as funções do app.
const corpoDoCallback = {
  ok: true,
  pecas: feito.pecas.map((p: Record<string, any>) => ({ indice: p.indice, url: `https://prova.local/${path.basename(p.arquivo)}`, formato: p.formato, creditos: p.creditos ?? [] })),
  custoUsd: feito.custoUsd,
  creditos: feito.creditos ?? null,
  avisos: feito.avisos,
  retorno: { lote: lote.chave, projectId },
};
const cb = pure.lerCallbackDaArte(JSON.parse(JSON.stringify(corpoDoCallback)))!;
const plano = pure.planoDoCallback(copia as never, cb);
dizer(`callback: ${plano.preencher.length} post(s) preenchido(s), ${plano.reserva.length} grupo(s) na reserva, ${plano.ignorados.length} ignorado(s)`);
const depois = copia.map((p) => {
  const f = plano.preencher.find((x) => x.postId === p.id);
  if (!f) return { ...p, metadata: p.metadata };
  return { ...p, imageUrl: f.imageUrl, content: pure.legendaComCreditos(p.content, f.creditos, p.platform), metadata: { ...semEspera(p.metadata), arteNoModelo: { ...(p.metadata as any).arteNoModelo, pendente: false, feitoEm: new Date().toISOString() } } };
});
dizer(`espera na tela depois do callback: ${depois.map((p) => `${p.platform}/${p.mediaType}=${esperaDaIdentidade({ imageUrl: p.imageUrl, metadata: p.metadata })?.estado ?? "pronto"}`).join(", ")}`);
for (const p of depois) dizer(`  ${p.id} ${p.platform} ${p.mediaType} dia ${p.dayOfWeek}: ${(p.imageUrl ?? "(sem arte)").split("|").map((u) => path.basename(u)).join(" | ")}${p.content !== reais.find((r) => r.id === p.id)?.content ? " (legenda com créditos)" : ""}`);

// A reserva simulada: o lote que falhou e a lâmina que faltou.
const falha = pure.planoDoCallback(copia as never, pure.lerCallbackDaArte({ ok: false, erro: "o plano das peças não passou em 3 voltas", retorno: { lote: lote.chave } })!);
const semUma = pure.planoDoCallback(copia as never, pure.lerCallbackDaArte({ ...corpoDoCallback, pecas: corpoDoCallback.pecas.filter((p: { indice: number }) => p.indice !== lote.pecas.length) })!);
dizer(`simulação de falha do lote: ${falha.reserva.map((r) => `[${r.postIds.length} post(s): ${r.motivo}]`).join(" ")}`);
dizer(`simulação da última lâmina faltando: preenchidos ${semUma.preencher.length}, reserva ${semUma.reserva.map((r) => `[${r.postIds.length} post(s): ${r.motivo}]`).join(" ")}`);

// A folha: cada post como ficaria no quadro (as imagens dele, na ordem).
const ALTURA = 520;
const linhas = await Promise.all(
  depois.map(async (p) => {
    const urls = (p.imageUrl ?? "").split("|").filter(Boolean);
    const imgs = await Promise.all(urls.map(async (u) => sharp(urlLocal.get(u)!).resize({ height: ALTURA }).toBuffer()));
    const larguras = await Promise.all(imgs.map(async (b) => (await sharp(b).metadata()).width ?? 400));
    return { p, imgs, larguras };
  })
);
const larguraTotal = Math.max(...linhas.map((l) => l.larguras.reduce((s, w) => s + w + 12, 12)), 900);
const camadas: Array<{ input: Buffer; left: number; top: number }> = [];
let y = 12;
for (const l of linhas) {
  const rotulo = `${l.p.platform} ${l.p.mediaType} (dia ${l.p.dayOfWeek})`;
  camadas.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${larguraTotal}" height="36"><text x="12" y="26" font-family="Arial" font-size="22" fill="#fff">${rotulo}</text></svg>`), left: 0, top: y });
  y += 40;
  let x = 12;
  l.imgs.forEach((b, i) => {
    camadas.push({ input: b, left: x, top: y });
    x += l.larguras[i] + 12;
  });
  y += ALTURA + 16;
}
await sharp({ create: { width: larguraTotal, height: y, channels: 3, background: "#222" } }).composite(camadas).jpeg({ quality: 85 }).toFile(path.join(SAIDA, "folha-dos-posts.jpg"));

const resumo = {
  projectId,
  runId,
  regra,
  lote: { chave: lote.chave, pecas: lote.pecas },
  custoUsd: feito.custoUsd,
  gastoDaProva: lerLivro().total,
  voltas: feito.voltas,
  tempos: feito.tempos,
  avisos: feito.avisos,
  pecas: feito.pecas.map((p: Record<string, any>) => ({ indice: p.indice, tipo: p.tipo, formato: p.formato, texto: p.texto, arquivo: path.join(pastaDasPecas, path.basename(p.arquivo)), logo: p.logo, momento: p.momento, recorte: p.recorte, creditos: p.creditos })),
  callback: { preencher: plano.preencher, reserva: plano.reserva, ignorados: plano.ignorados },
  postsDepois: depois.map((p) => ({ id: p.id, platform: p.platform, mediaType: p.mediaType, dia: p.dayOfWeek, imageUrl: p.imageUrl, legendaMudou: p.content !== reais.find((r) => r.id === p.id)?.content, espera: esperaDaIdentidade({ imageUrl: p.imageUrl, metadata: p.metadata })?.estado ?? null })),
  simulacoes: { falhaDoLote: falha, ultimaLaminaFaltando: { preencher: semUma.preencher.length, reserva: semUma.reserva } },
  escritasRecusadasNoBanco: escritasRecusadas,
};
writeFileSync(path.join(SAIDA, "resumo.json"), JSON.stringify(resumo, null, 2));
writeFileSync(path.join(SAIDA, "log.txt"), log.join("\n"));
dizer(`folha: ${path.join(SAIDA, "folha-dos-posts.jpg")}; escritas recusadas no banco (uso de IA): ${escritasRecusadas}`);
await base.$disconnect().catch(() => {});
