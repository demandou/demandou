// PROVA DO INFOGRÁFICO PELO NANO BANANA PRO (08/10/2026).
//
// O Bruno: "os infográficos não estão usando um modelo de IA (...) fora que o
// formato sai errado para Instagram". Esta prova desenha UM infográfico real
// do projeto Demandou em 4:5 (Instagram) e 16:9 (LinkedIn) pelo caminho da
// esteira (produzirArtePorRede + pedidoDoInfografico), com a conferência de
// verdade (o Haiku transcreve, o código conta, o JEV decide) e a refação no
// outro modelo quando a escrita erra.
//
// DUAS FASES, DOIS PROCESSOS:
//   1. sem argumento: SÓ LEITURA. Lê o post de infográfico mais recente do
//      projeto, a marca aprovada e o estilo do dia (SELECT), grava
//      entrada.json no scratchpad e mostra o custo estimado. Nada pago.
//   2. --pagar: o banco aponta para lugar nenhum ANTES de qualquer import
//      (o extrato de custo falha calado, nada é gravado na produção), o aviso
//      de saldo fica desligado e o token do Blob sai do ambiente. Extrai o
//      conteúdo do texto do post, desenha, confere, salva os JPEG e o
//      relatório. Teto rígido de gasto (--teto, padrão US$ 1,00): passou dele,
//      nenhuma imagem nova é pedida.
//
// Uso (da raiz do repositório):
//   npx tsx scripts/tmp/prova-infografico-0810.mts             # fase 1, leitura
//   npx tsx scripts/tmp/prova-infografico-0810.mts --pagar     # fase 2, paga
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const PASTA = "C:/Users/devan/AppData/Local/Temp/claude/c--/7d44153b-b916-4289-8e78-2c8f60583a30/scratchpad/infografico-0810";
const PROJETO = "cmu7hmu0j000004jrh2yc5udb";
const args = process.argv.slice(2);
const pagar = args.includes("--pagar");
const teto = args.includes("--teto") ? Number(args[args.indexOf("--teto") + 1]) : 1.0;

for (const arq of ["C:/Users/devan/opensquad-app/.env.local", ".env.local"]) {
  if (!existsSync(arq)) continue;
  for (const l of readFileSync(arq, "utf8").split(/\r?\n/)) {
    const i = l.indexOf("=");
    if (i > 0 && !l.startsWith("#")) process.env[l.slice(0, i).trim()] ??= l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  break;
}
mkdirSync(PASTA, { recursive: true });

// Preço por imagem (lib/media/infografico-pelo-modelo.ts) e da conferência.
const PRO = 0.134;
const HAIKU_POR_CONFERENCIA = 0.005;

type Entrada = {
  postId: string;
  plataforma: string;
  texto: string;
  nicho: string | null;
  funil?: "tofu" | "mofu" | "bofu";
  estilo: string;
  paleta: string;
  marca: Record<string, unknown>;
};

if (!pagar) {
  // ───────────── FASE 1: só leitura ─────────────
  const { prisma } = await import("@/lib/db/prisma");
  const { marcaDaArte } = await import("@/lib/media/arte-com-frase");
  const { direcaoDaPeca } = await import("@/lib/media/direcao-de-arte");
  const projeto = await prisma.project.findUnique({ where: { id: PROJETO }, select: { name: true, niche: true } });
  const post = await prisma.post.findFirst({
    where: { projectId: PROJETO, mediaType: "infographic", NOT: { content: "" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, platform: true, content: true, runId: true, dayOfWeek: true, metadata: true, run: { select: { config: true } } },
  });
  if (!projeto || !post) throw new Error("projeto ou post de infográfico não encontrado");
  const config = (post.run?.config ?? {}) as {
    mediaStyle?: string;
    funnelStage?: "tofu" | "mofu" | "bofu";
    semana?: { dias?: Record<string, { modelo?: import("@/lib/estilo-dos-posts/tipos").ModeloDoPost | null } | null> };
  };
  // O MODELO ESCOLHIDO PARA O DIA na semana do vídeo (escolher é aprovar este
  // post, 08/10): é o que a esteira passou para a marca. Sem ele, a marca do
  // projeto sem identidade aprovada travaria o desenho.
  const modeloDoPost = config.semana?.dias?.[String(post.dayOfWeek ?? "")]?.modelo ?? null;
  const marca = await marcaDaArte(PROJETO, { runId: post.runId ?? undefined, modeloDoPost });
  console.log(`Modelo escolhido para o dia ${post.dayOfWeek}: ${JSON.stringify(modeloDoPost)}`);
  const direcao = post.runId
    ? await direcaoDaPeca({ projectId: PROJETO, runId: post.runId, dayOfWeek: post.dayOfWeek ?? 1, infografico: true, preferido: config.mediaStyle })
    : null;
  const entrada: Entrada = {
    postId: post.id,
    plataforma: post.platform,
    texto: post.content,
    nicho: projeto.niche,
    funil: config.funnelStage,
    estilo: direcao?.estilo.prompt ?? "",
    paleta: direcao?.paleta ?? "",
    // Só o que o prompt usa (o resto da marca tem foto, logo e materiais).
    marca: {
      familia: marca.familia,
      cores: marca.cores,
      letra: marca.letra,
      tipografia: marca.tipografia,
      identidade: marca.identidade ? { setor: { nome: marca.identidade.setor?.nome }, publico: marca.identidade.publico } : undefined,
      modelos: marca.modelos,
      identidadeAprovada: marca.identidadeAprovada,
      projectId: PROJETO,
    },
  };
  writeFileSync(join(PASTA, "entrada.json"), JSON.stringify(entrada, null, 2));
  console.log(`Projeto "${projeto.name}" (nicho: ${projeto.niche ?? "-"}). Post ${post.id} (${post.platform}), ${post.content.length} caracteres.`);
  console.log(`Identidade aprovada: ${marca.identidadeAprovada !== false ? "sim" : "NÃO (a trava não deixa desenhar)"}; letra ${marca.letra ?? "-"}; papéis ${JSON.stringify(marca.cores.papeis ?? null)}; modelos ${JSON.stringify(marca.modelos ?? [])}`);
  console.log(`Estilo do dia: ${(entrada.estilo || "(nenhum)").slice(0, 300)}`);
  console.log(`\nCUSTO ESTIMADO da fase 2 (2 proporções: 4:5 Instagram e 16:9 LinkedIn):`);
  console.log(`  sem refação: 2 x US$ ${PRO} + conferência ~US$ ${(2 * HAIKU_POR_CONFERENCIA).toFixed(3)} + extração ~US$ 0,002 = ~US$ ${(2 * PRO + 2 * HAIKU_POR_CONFERENCIA + 0.002).toFixed(2)}`);
  console.log(`  com uma refação em cada: ~US$ ${(4 * PRO + 4 * HAIKU_POR_CONFERENCIA + 0.002).toFixed(2)} (no GPT Image a refação de escrita custa ~US$ 0,06)`);
  console.log(`  pior caso (3 tentativas no Pro nas duas): ~US$ ${(6 * PRO + 6 * HAIKU_POR_CONFERENCIA + 0.002).toFixed(2)}; teto rígido do script: US$ ${teto.toFixed(2)}`);
  console.log(`\nEntrada gravada em ${join(PASTA, "entrada.json")}. Para pagar: --pagar`);
  await prisma.$disconnect();
  process.exit(0);
}

// ───────────── FASE 2: paga, sem escrita na produção ─────────────
// Antes de QUALQUER import que abra o banco: as escritas de custo (aiUsage)
// falham na hora e são ignoradas pela instrumentação; nenhuma leitura precisa
// do banco nesta fase (a entrada veio da fase 1).
process.env.DATABASE_URL = "postgresql://prova:prova@127.0.0.1:9/prova";
process.env.DIRECT_URL = "postgresql://prova:prova@127.0.0.1:9/prova";
process.env.AVISO_DE_SALDO = "0";
delete process.env.BLOB_PUBLIC_READ_WRITE_TOKEN;
delete process.env.BLOB_READ_WRITE_TOKEN;

const entrada = JSON.parse(readFileSync(join(PASTA, "entrada.json"), "utf8")) as Entrada;
const { extrairConteudoDoInfografico, pedidoDoInfografico } = await import("@/lib/media/infographic");
const { produzirArtePorRede } = await import("@/lib/media/arte-por-rede");
const { conferirArte } = await import("@/lib/media/conferencia-da-arte");
const { gerarNoModelo, promptCompleto, FICHA_DO_MODELO } = await import("@/lib/media/infografico-pelo-modelo");
const { instrucaoDeFormato } = await import("@/lib/media/formatos-das-redes");
const sharp = (await import("sharp")).default;
type MarcaDaArte = import("@/lib/media/arte-com-frase").MarcaDaArte;
type Gerador = import("@/lib/media/infografico-pelo-modelo").GeradorDoInfografico;

const marca = entrada.marca as unknown as MarcaDaArte;
let gasto = 0;
const inicio = Date.now();
const registro: Array<Record<string, unknown>> = [];
const vereditos: Array<Record<string, unknown>> = [];
let n = 0;

const gerar: Gerador = async (modelo, prompt, proporcao, ctx) => {
  const preco = FICHA_DO_MODELO[modelo].precoUsd;
  if (gasto + preco > teto) throw new Error(`teto da prova: US$ ${gasto.toFixed(3)} gastos, a próxima imagem passaria de US$ ${teto}`);
  const t0 = Date.now();
  const i = ++n;
  try {
    const r = await gerarNoModelo(modelo, prompt, proporcao, ctx);
    const segundos = Math.round((Date.now() - t0) / 1000);
    if (r) {
      gasto += r.custoUsd;
      const buf = Buffer.from(r.dataUrl.split(",")[1], "base64");
      const m = await sharp(buf).metadata();
      writeFileSync(join(PASTA, `bruto-${i}-${proporcao.replace(":", "x")}-${modelo}.${m.format === "png" ? "png" : "jpg"}`), buf);
      writeFileSync(join(PASTA, `prompt-${i}-${proporcao.replace(":", "x")}.txt`), prompt);
      registro.push({ i, modelo: r.modelo, proporcao, segundos, custoUsd: r.custoUsd, tamanho: `${m.width}x${m.height}` });
      console.log(`[prova] ${i}: ${r.modelo} ${proporcao} em ${segundos} s, ${m.width}x${m.height}, US$ ${r.custoUsd}`);
    } else {
      registro.push({ i, modelo, proporcao, segundos, semImagem: true });
    }
    return r;
  } catch (e) {
    registro.push({ i, modelo, proporcao, erro: e instanceof Error ? e.message : String(e) });
    throw e;
  }
};

const conferir: typeof conferirArte = async (dataUri, opcoes) => {
  gasto += HAIKU_POR_CONFERENCIA;
  const v = await conferirArte(dataUri, opcoes);
  vereditos.push({ formato: opcoes.formato.rotulo, aprovada: v.aprovada, motivo: v.motivo, olhoPor: v.olhoPor, parecer: v.parecerDoOlho });
  console.log(`[prova] conferência ${opcoes.formato.rotulo}: ${v.aprovada ? "APROVADA" : "REPROVADA"} (${v.olhoPor ?? "régua"}) ${v.aprovada ? "" : v.motivo}`);
  return v;
};

console.log(`[prova] post ${entrada.postId}; extraindo o conteúdo do texto...`);
const conteudo = await extrairConteudoDoInfografico(entrada.texto, entrada.nicho ?? "negocios", process.env.GEMINI_API_KEY!, { funil: entrada.funil, projectId: PROJETO });
gasto += 0.002;
writeFileSync(join(PASTA, "conteudo.json"), JSON.stringify(conteudo, null, 2));
for (const p of ["4:5", "16:9"] as const) {
  writeFileSync(join(PASTA, `prompt-de-referencia-${p.replace(":", "x")}.txt`), promptCompleto({ conteudo, marca, proporcao: p, estilo: entrada.estilo, nicho: entrada.nicho }, instrucaoDeFormato(p)));
}

let erro: string | null = null;
let arte: Awaited<ReturnType<typeof produzirArtePorRede>> | null = null;
try {
  arte = await produzirArtePorRede({
    redes: ["instagram", "linkedin"],
    textoDoPost: entrada.texto,
    projectId: PROJETO,
    conferir,
    ...pedidoDoInfografico(conteudo, { estilo: entrada.estilo, paleta: entrada.paleta, marca }, { nicho: entrada.nicho, ctx: { projectId: PROJETO, operation: "infografico" }, gerar }),
  });
  for (const [rede, uri] of Object.entries(arte.porRede)) {
    const buf = Buffer.from(uri.split(",")[1], "base64");
    const m = await sharp(buf).metadata();
    writeFileSync(join(PASTA, `final-${rede}-${m.width}x${m.height}.jpg`), buf);
  }
  if (arte.principal) writeFileSync(join(PASTA, "final-card-principal.jpg"), Buffer.from(arte.principal.split(",")[1], "base64"));
} catch (e) {
  erro = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  console.error(`[prova] a arte não saiu: ${erro}`);
}

const relatorio = {
  postId: entrada.postId,
  segundos: Math.round((Date.now() - inicio) / 1000),
  custoEstimadoUsd: Number(gasto.toFixed(3)),
  geracoes: registro,
  vereditos,
  avisos: arte?.avisos ?? [],
  algumaReprovada: arte?.algumaReprovada ?? null,
  principalEhInstagram: arte ? arte.principal === arte.porRede.instagram : null,
  erro,
};
writeFileSync(join(PASTA, "relatorio.json"), JSON.stringify(relatorio, null, 2));
console.log(JSON.stringify(relatorio, null, 2));
process.exit(0);
