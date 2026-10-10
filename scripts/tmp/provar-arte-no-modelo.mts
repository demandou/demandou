/**
 * PROVA LOCAL DAS PEÇAS NO MODELO DO CURSO (10/10, protótipo): chama o MESMO
 * `arteNoModelo` do worker (worker/src/modelo/arte-no-modelo.mjs), com a parte
 * de IA feita pelas mesmas funções que a rota /api/editor-do-curso/plano usa
 * (sem HTTP), como o provar-fluxo-do-curso.mts.
 *
 * O BANCO É SÓ LEITURA nesta prova: o cliente do Prisma é criado aqui com uma
 * trava que recusa toda escrita (o registro de uso da IA, que o askClaude
 * grava, cai e é só avisado; o custo de cada chamada vai para o log e para o
 * livro-caixa da prova), e o aviso de saldo fica desligado (AVISO_DE_SALDO=0).
 *
 * Uso:
 *   npx tsx@4 --env-file=.env.local --tsconfig tsconfig.json scripts/tmp/provar-arte-no-modelo.mts \
 *     <modelo> [--projeto cmu7hmu0j000004jrh2yc5udb] [--saida <pasta>] [--nome rodada] [--teto 1]
 *     [--foto <arquivo ou url>] [--reusar <pasta de uma rodada anterior>] [--teto-total 3]
 * --reusar: usa o plano aprovado de uma rodada anterior (mesmo modelo e mesmas peças), sem IA.
 * --ate-o-corte: roda o fluxo do curso até o cortar e para antes da primeira chamada de IA.
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
const modelo = args[0];
const projectId = opcao("projeto", "cmu7hmu0j000004jrh2yc5udb");
const RAIZ_DA_SAIDA = opcao("saida", "C:/Users/devan/AppData/Local/Temp/claude/c--/7d44153b-b916-4289-8e78-2c8f60583a30/scratchpad/arte-no-modelo");
const nome = opcao("nome", modelo.replace(/^modelo-/, ""));
const teto = Number(opcao("teto", "1"));
const tetoTotal = Number(opcao("teto-total", "3"));
const foto = opcao("foto", "");
const reusar = opcao("reusar", "");
const ia = "claude-opus-5-5";

// O ambiente do worker na máquina local: Python do sistema e o modelo de rosto do MediaPipe.
process.env.PYTHON_DO_RECORTE ??= "python";
process.env.MODELO_ROSTO ??= "C:/Users/devan/AppData/Local/Temp/claude/c--/7d44153b-b916-4289-8e78-2c8f60583a30/scratchpad/prova-curso/face_landmarker.task";
process.env.AVISO_DE_SALDO = "0";

// A trava de só leitura, ANTES de qualquer módulo do app abrir o banco (lib/db/prisma.ts reaproveita o globalThis.prisma).
const ESCRITA = /^(create|createMany|createManyAndReturn|update|updateMany|updateManyAndReturn|upsert|delete|deleteMany|executeRaw|executeRawUnsafe|\$executeRaw|\$executeRawUnsafe)$/;
const base = new (PrismaClient as unknown as new (o: unknown) => PrismaClient)({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });
const soLeitura = base.$extends({
  query: {
    async $allOperations({ model, operation, args: a, query }: { model?: string; operation: string; args: unknown; query: (x: unknown) => Promise<unknown> }) {
      if (ESCRITA.test(operation)) throw new Error(`prova só leitura: ${model ?? ""}.${operation} recusado`);
      return query(a);
    },
  },
});
(globalThis as unknown as { prisma: unknown }).prisma = soLeitura;

const { estadoDaIdentidade } = await import("@/lib/modelos-de-arte/identidade-aprovada");
const { materiaisDaMarca } = await import("@/lib/materiais/escolha");
const { materiaisDaPessoa } = await import("@/lib/media/referencia-da-pessoa");
const { escreverPlanoDoModelo, numerosSemLastro } = await import("@/lib/media/editor-do-curso/escrever-plano");
const { escolherImagensDoModelo, pedirImagensDoModelo } = await import("@/lib/media/editor-do-curso/imagens");
const sharp = (await import("sharp")).default;
const arte = await import(pathToFileURL(path.resolve("worker/src/modelo/arte-no-modelo.mjs")).href);

// As peças reais da campanha do cliente (Demandou).
const pecas = [
  { tipo: "post", texto: "Você perde 9 horas por semana em tarefa que não vende nada.", formato: "4:5" },
  { tipo: "capa", texto: "Você não precisa estar em cinco redes ao mesmo tempo", formato: "4:5" },
  { tipo: "lamina", texto: "1. Grave uma vez", formato: "4:5" },
  { tipo: "lamina", texto: "2. A IA corta e edita", formato: "4:5" },
  { tipo: "lamina", texto: "3. Publica nas cinco redes", formato: "4:5" },
  { tipo: "infografico", texto: "Volume não é sobre trabalhar mais. É sobre aparecer sempre.", formato: "9:16" },
];

// As cores da marca e a foto da pessoa, lidas da produção (só leitura).
const estado = await estadoDaIdentidade(projectId);
const projeto = await soLeitura.project.findUnique({ where: { id: projectId }, select: { name: true, niche: true } });
const fotosDaPessoa = materiaisDaPessoa(await materiaisDaMarca(projectId));
console.log(`marca ${projeto?.name}: fundo ${estado.papeis.fundo}, título ${estado.papeis.titulo}, destaque ${estado.papeis.destaque}; fotos da pessoa nos materiais: ${fotosDaPessoa.length}`);

// O livro-caixa da prova inteira (todas as rodadas): o teto total vale entre rodadas.
mkdirSync(RAIZ_DA_SAIDA, { recursive: true });
const livro = path.join(RAIZ_DA_SAIDA, "gasto.json");
const lerLivro = (): { total: number; chamadas: Array<Record<string, unknown>> } => (existsSync(livro) ? JSON.parse(readFileSync(livro, "utf8")) : { total: 0, chamadas: [] });
// Uma volta do plano custa ~US$ 0,3; não começa uma chamada que pode passar do teto total.
const RESERVA_POR_CHAMADA = 0.35;

let gasto = 0;
const usage = { projectId: null, operation: "arte-no-modelo-prova" };
const planoReusado = reusar ? JSON.parse(readFileSync(path.join(reusar, "plano-aprovado.json"), "utf8")) : null;
// As respostas da IA nos passos das imagens (pedidos e escolhas), para --reusar sem pagar de novo:
// a busca do imagens.mjs tem cache em disco, então o número de cada candidata se repete.
const respostasReusadas = reusar && existsSync(path.join(reusar, "respostas-da-ia.json")) ? JSON.parse(readFileSync(path.join(reusar, "respostas-da-ia.json"), "utf8")) : null;
const respostas: { imagens: unknown; escolhas: unknown[] } = { imagens: null, escolhas: [] };
const ateOCorte = args.includes("--ate-o-corte");
const pedirPlano = async (corpo: Record<string, any>) => {
  if (ateOCorte) {
    writeFileSync(path.join(RAIZ_DA_SAIDA, `pecas-paradas-${nome}.json`), JSON.stringify(corpo.pecasParadas, null, 2));
    throw new Error("parada combinada antes da IA (--ate-o-corte)");
  }
  if (planoReusado && (corpo.fase ?? "plano") === "plano") {
    console.log("  [plano] reusado da rodada anterior, US$ 0");
    return { mapa: planoReusado.mapa ?? "", plano: planoReusado.plano, numerosSemLastro: [], custoUsd: 0 };
  }
  if (respostasReusadas && corpo.fase === "imagens" && respostasReusadas.imagens) {
    console.log("  [imagens] reusado da rodada anterior, US$ 0");
    respostas.imagens = respostasReusadas.imagens;
    return { ...respostasReusadas.imagens, custoUsd: 0 };
  }
  if (respostasReusadas && corpo.fase === "escolher") {
    const ids = new Set((corpo.pedidos ?? []).map((p: { id: string }) => p.id));
    const escolhas = (respostasReusadas.escolhas ?? []).filter((e: { id: string }) => ids.has(e.id));
    console.log(`  [escolher] reusado da rodada anterior (${escolhas.length}), US$ 0`);
    respostas.escolhas.push(...escolhas);
    return { escolhas, custoUsd: 0 };
  }
  const caixa = lerLivro();
  if (caixa.total + RESERVA_POR_CHAMADA > tetoTotal) throw new Error(`teto total de US$ ${tetoTotal} da prova: já foram US$ ${caixa.total.toFixed(3)}, parei antes de chamar a IA`);
  const antes = gasto;
  const comum = { modelo: ia, usage, onCusto: (u: number) => (gasto += u) };
  let r: Record<string, unknown>;
  if (corpo.fase === "escolher") {
    r = { escolhas: await escolherImagensDoModelo({ referencias: corpo.referencias, pedidos: corpo.pedidos ?? [], folhas: corpo.folhas ?? [], ...comum }) };
  } else if (corpo.fase === "imagens") {
    r = await pedirImagensDoModelo({ referencias: corpo.referencias, esqueleto: corpo.esqueleto, nicho: corpo.nicho ?? null, pecasParadas: corpo.pecasParadas ?? null, ...comum });
  } else {
    const escrito = await escreverPlanoDoModelo({ referencias: corpo.referencias, esqueleto: corpo.esqueleto, marca: corpo.marca, nicho: corpo.nicho ?? null, anterior: corpo.anterior ?? null, mapa: corpo.mapa ?? null, pecasParadas: corpo.pecasParadas ?? null, ...comum });
    r = { ...escrito, numerosSemLastro: numerosSemLastro(escrito.plano, corpo.esqueleto.palavras, escrito.plano.correcoes as Record<string, string> | undefined) };
  }
  if (corpo.fase === "imagens") respostas.imagens = { mapa: r.mapa, imagens: r.imagens };
  if (corpo.fase === "escolher") respostas.escolhas.push(...((r.escolhas as unknown[]) ?? []));
  const custo = gasto - antes;
  const depois = lerLivro();
  depois.total = +(depois.total + custo).toFixed(4);
  depois.chamadas.push({ rodada: nome, modelo, fase: corpo.fase ?? "plano", custoUsd: +custo.toFixed(4), em: new Date().toISOString() });
  writeFileSync(livro, JSON.stringify(depois, null, 2));
  console.log(`  [${corpo.fase ?? "plano"}] US$ ${custo.toFixed(3)} (rodada US$ ${gasto.toFixed(3)}, prova inteira US$ ${depois.total.toFixed(3)})`);
  return { ...r, custoUsd: custo };
};

const obterFoto = async (url: string, destino: string) => {
  if (/^https?:/.test(url)) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`a foto não baixou (${r.status})`);
    const arquivo = `${destino}.jpg`;
    writeFileSync(arquivo, Buffer.from(await r.arrayBuffer()));
    return arquivo;
  }
  const arquivo = `${destino}${path.extname(url) || ".png"}`;
  copyFileSync(url, arquivo);
  return arquivo;
};

const pasta = path.join(RAIZ_DA_SAIDA, "trabalho", nome);
rmSync(pasta, { recursive: true, force: true });
const t0 = Date.now();
const pedido = {
  modelo,
  pecas,
  cores: { fundo: estado.papeis.fundo, titulo: estado.papeis.titulo, destaque: estado.papeis.destaque },
  fotoUrl: foto || null,
  marca: { nome: projeto?.name ?? "", area: "" },
  nicho: projeto?.niche ?? null,
  tetoUsd: teto,
  voltas: 3,
};
try {
  const r = await arte.arteNoModelo(pedido, pasta, {
    pedirPlano,
    obterFoto,
    aoPasso: (p: string) => console.log(`[${nome} ${((Date.now() - t0) / 1000).toFixed(0)} s] ${p}`),
  });
  // As imagens da rodada, a folha de contato e o plano aprovado (para --reusar).
  const destino = path.join(RAIZ_DA_SAIDA, nome);
  rmSync(destino, { recursive: true, force: true });
  mkdirSync(destino, { recursive: true });
  for (const p of r.pecas) copyFileSync(p.arquivo, path.join(destino, path.basename(p.arquivo)));
  const plano = JSON.parse(readFileSync(path.join(r.projeto, "src", "plano.json"), "utf8"));
  const escrito = Object.fromEntries(Object.entries(plano).filter(([k]) => !["video", "fps", "largura", "altura", "duracao", "videoAltura", "rosto", "zona", "cortesEm", "palavras", "enquadramentos", "imagens", "semLegenda", "progresso", "sfx"].includes(k)));
  writeFileSync(path.join(destino, "plano-aprovado.json"), JSON.stringify({ mapa: r.mapa, plano: escrito }, null, 2));
  if (respostas.imagens) writeFileSync(path.join(destino, "respostas-da-ia.json"), JSON.stringify(respostas, null, 2));
  const ALTURA = 640;
  const partes = await Promise.all(
    r.pecas.map(async (p: { arquivo: string; indice: number; tipo: string; formato: string; momento: { tipo: string } }) => {
      const img = await sharp(p.arquivo).resize({ height: ALTURA }).toBuffer();
      const { width } = await sharp(img).metadata();
      const rotulo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="40"><rect width="100%" height="100%" fill="#111"/><text x="10" y="27" font-family="Arial" font-size="20" fill="#fff">${p.indice}. ${p.tipo} ${p.formato} (${p.momento.tipo})</text></svg>`);
      return { img, rotulo, width: width ?? 360 };
    })
  );
  const larguraTotal = partes.reduce((s, x) => s + x.width + 16, 16);
  let x = 16;
  const camadas = partes.flatMap((p) => {
    const c = [
      { input: p.rotulo, left: x, top: 16 },
      { input: p.img, left: x, top: 56 },
    ];
    x += p.width + 16;
    return c;
  });
  await sharp({ create: { width: larguraTotal, height: ALTURA + 72, channels: 3, background: "#2a2a2a" } }).composite(camadas).jpeg({ quality: 88 }).toFile(path.join(destino, "folha.jpg"));
  const resumo = { modelo, nome, foto: Boolean(foto), reusado: Boolean(reusar), custoUsd: +gasto.toFixed(4), voltas: r.voltas, historico: r.historico, relaxados: r.relaxados, cores: r.cores, pessoa: r.pessoa, avisos: r.avisos, tempos: r.tempos, creditos: r.creditos, pecas: r.pecas.map((p: Record<string, unknown>) => ({ ...p, arquivo: path.join(destino, path.basename(String(p.arquivo))) })) };
  writeFileSync(path.join(destino, "resumo.json"), JSON.stringify(resumo, null, 2));
  console.log(JSON.stringify({ ...resumo, historico: undefined, pecas: resumo.pecas.map((p: Record<string, unknown>) => `${p.indice} ${p.tipo} ${p.formato} ${(p.momento as { tipo: string }).tipo} t=${p.instante} mov=${p.movimento} ${(p.recorte as { modo: string }).modo}`) }, null, 2));
  console.log(`folha: ${path.join(destino, "folha.jpg")}`);
} catch (e) {
  console.error(`[${nome}] FALHOU: ${e instanceof Error ? e.stack ?? e.message : e}`);
  console.log(`gasto da rodada até a falha: US$ ${gasto.toFixed(3)}`);
  process.exitCode = 1;
}
await base.$disconnect().catch(() => {});
