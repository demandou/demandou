/**
 * O TESTE DE PONTA A PONTA DA DEMANDOU (11/10/2026).
 *
 * Roda a jornada REAL de um cliente na PRODUÇÃO, no projeto de teste "O essencial
 * bem feito" (cmtmym5bo000004l80wwvpdd7), chamando as MESMAS funções do app que a
 * tela e as rotas chamam. Nada da esteira é reimplementado aqui:
 *
 *   1. estilo: escolherModeloDoCurso, como o PUT de app/api/projects/[id]/modelo-do-curso;
 *      no modelo do curso, levarModeloParaAsPecas (a tela chama sozinha, POST {acao:"pecas"},
 *      logo depois da escolha, em components/video/pecas-no-estilo-do-modelo.tsx) e registrarNota;
 *      no sob medida, antes um modelo do curso (a reserva precisa existir), depois a opção.
 *   2. envio: put privado no Blob em videos/<projeto>/<nome> com sufixo aleatório (o mesmo
 *      caminho do upload do navegador), as mesmas portas do token (conferirGravacao,
 *      conferirArmazenamento, limitesDoEnvio), registrarGravacao e despacharPasso("transcrever"),
 *      como o onUploadCompleted de app/api/videos/upload/route.ts.
 *   3. roteiro: aprovarRoteiro com os cortes que montarTela pré-seleciona (teto de 2, pela nota),
 *      e despacharPasso("cortar"), como app/api/videos/[id]/roteiro/aprovar/route.ts.
 *   4. o resto (cortes, montagem, completo, textos, artes, capas) a produção faz sozinha:
 *      o script só acompanha, com SELECT pelo Prisma e o /saude do worker.
 *
 * O banco é LIDO pelo Prisma (findMany/findUnique, nunca SET, nunca SQL de escrita).
 * Escrita só pelas funções do app citadas acima. Qualquer projeto que não seja o de
 * teste é recusado, inclusive no --limpar e no --acompanhar.
 *
 * Uso (na raiz do repo ou do worktree):
 *   npx tsx scripts/testes-e2e/ponta-a-ponta.mts --estilo modelo-manifesto --simular
 *   npx tsx scripts/testes-e2e/ponta-a-ponta.mts --estilo sob-medida-3d [--video <arquivo>] [--prazo 150] [--cortes 2]
 *   npx tsx scripts/testes-e2e/ponta-a-ponta.mts --acompanhar <videoJobId> [--prazo 150]
 *   npx tsx scripts/testes-e2e/ponta-a-ponta.mts --limpar <videoJobId>
 *   npx tsx scripts/testes-e2e/ponta-a-ponta.mts --conferir <videoJobId>   (só leitura: conferências, custo e folhas, sem vigília)
 *
 * Custo aprovado: US$ 3 a 6 por teste (memória "pronto é teste de ponta a ponta").
 */
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ─────────────────────────────── o ambiente ───────────────────────────────

const AQUI = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** A pasta principal do repo (o worktree não tem o .env.local), como scripts/dev/com-env-dev.mjs. */
function pastaPrincipal(): string {
  const r = spawnSync("git", ["rev-parse", "--git-common-dir"], { cwd: AQUI, encoding: "utf8" });
  return r.status === 0 ? resolve(AQUI, r.stdout.trim(), "..") : AQUI;
}

const ARQUIVOS_DE_ENV = [join(AQUI, ".env.local"), join(pastaPrincipal(), ".env.local"), join(pastaPrincipal(), ".env")];
const envLido: string[] = [];
for (const arq of ARQUIVOS_DE_ENV) {
  if (!existsSync(arq) || envLido.includes(arq)) continue;
  envLido.push(arq);
  for (const l of readFileSync(arq, "utf8").split(/\r?\n/)) {
    const i = l.indexOf("=");
    if (i > 0 && !l.startsWith("#")) process.env[l.slice(0, i).trim()] ??= l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
}

/**
 * AS CHAVES DOCUMENTADAS COMO 1 NA PRODUÇÃO (docs/editor-do-curso-1110.md e HANDOFF):
 * ligadas aqui SÓ para as funções que rodam neste processo (a escolha do estilo e a
 * aprovação). A verdade da produção é conferida pelo resultado no banco, que é o que reprova.
 */
const CHAVES_LIGADAS: Record<string, string> = {
  EDITOR_DO_CURSO: "1",
  COMPLETO_PELO_MODELO: "1",
  ARTE_PELO_MODELO: "1",
  EDITOR_AVANCADO: "1",
  EDITOR_JORNADA: "1",
  MONTAGEM_NA_EDICAO: "1",
  MONTAGEM_DO_COMPLETO: "1",
  HIGGSFIELD_NA_EDICAO: "1",
};
for (const [k, v] of Object.entries(CHAVES_LIGADAS)) process.env[k] = v;

// ─────────────────────────────── a trava ───────────────────────────────

const PROJETO_DE_TESTE = "cmtmym5bo000004l80wwvpdd7";
const NOME_DO_PROJETO = "O essencial bem feito";

function travar(projectId: string | null | undefined, onde: string): void {
  if (projectId !== PROJETO_DE_TESTE) {
    throw new Error(`[trava] ${onde}: projeto ${projectId ?? "(nenhum)"} recusado. Este teste só roda no projeto de teste ${PROJETO_DE_TESTE} (${NOME_DO_PROJETO}).`);
  }
}

// ─────────────────────────────── os argumentos ───────────────────────────────

const args = process.argv.slice(2);
const opcao = (n: string): string | null => {
  const i = args.indexOf(`--${n}`);
  if (i >= 0) return args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : "";
  const igual = args.find((a) => a.startsWith(`--${n}=`));
  return igual ? igual.slice(n.length + 3) : null;
};
const flag = (n: string) => args.includes(`--${n}`);

const ORIGINAL_PADRAO = "C:/Users/devan/AppData/Local/Temp/claude/c--/7d44153b-b916-4289-8e78-2c8f60583a30/scratchpad/prova-obs/original.mp4";
const TRECHO_INICIO = 60;
const TRECHO_DURACAO = 120;
const RAIZ_DOS_RELATORIOS = "C:/Users/devan/AppData/Local/Temp/claude/c--/0d23129a-eff3-41f9-b14d-68a5bd521df1/scratchpad/e2e";
const TETO_DE_CORTES = 2;

const estiloPedido = opcao("estilo");
const videoArg = opcao("video");
const prazoMin = Number(opcao("prazo") ?? 150) || 150;
const cortesArg = opcao("cortes");
const simular = flag("simular");
const limparId = opcao("limpar");
const acompanharId = opcao("acompanhar");
const conferirId = opcao("conferir");
const projetoArg = opcao("projeto");

// ─────────────────────────────── utilidades ───────────────────────────────

const agoraIso = () => new Date().toISOString();
const seg = (a: string | null | undefined, b: string | null | undefined) => (a && b ? Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000) : null);
const min = (s: number | null | undefined) => (s == null ? "-" : `${(s / 60).toFixed(1)} min`);
const espera = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString("pt-BR")}] ${msg}`);
}
function rodar(cmd: string, a: string[]): { ok: boolean; saida: string } {
  const r = spawnSync(cmd, a, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { ok: r.status === 0, saida: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}
function duracaoDoArquivo(arq: string): number | null {
  const r = rodar("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", arq]);
  const d = Number(r.saida.trim());
  return r.ok && d > 0 ? d : null;
}

type Conferencia = { nome: string; ok: boolean; motivo: string; dependeDeCampoNovo?: string };
type Relatorio = {
  versao: 1;
  estilo: string;
  projectId: string;
  videoJobId: string | null;
  runId: string | null;
  pasta: string;
  inicio: string;
  fim: string | null;
  simulacao: boolean;
  chavesLigadasLocalmente: Record<string, string>;
  video: { arquivo: string; duracaoSeg: number | null; blobUrl: string | null };
  estiloNoProjeto: { escolhido: string | null; reserva: string | null; passos: string[] };
  aprovacao: { preSelecionados: number[]; aprovados: number[]; observacao: string | null; em: string | null };
  marcos: Record<string, string>;
  tempos: Array<{ etapa: string; medidoSeg: number | null; previstoSeg: number | null; passou: boolean | null }>;
  conferencias: Conferencia[];
  custo: { totalUsd: number; porFornecedor: Record<string, number>; linhas: Array<{ operation: string; model: string; usd: number; n: number }>; workerUsd: number; observacao: string } | null;
  imagens: Record<string, string>;
  eventos: Array<{ em: string; msg: string }>;
  veredito: "aprovado" | "reprovado" | "em andamento" | "simulado";
};

function novaPasta(estilo: string): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const nome = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}-${estilo}`;
  const pasta = `${RAIZ_DOS_RELATORIOS}/${nome}`;
  mkdirSync(pasta, { recursive: true });
  return pasta;
}

function gravarProgresso(r: Relatorio) {
  writeFileSync(`${r.pasta}/relatorio.json`, JSON.stringify(r, null, 2));
  writeFileSync(`${r.pasta}/relatorio.md`, relatorioEmMd(r));
}

function evento(r: Relatorio, msg: string) {
  r.eventos.push({ em: agoraIso(), msg });
  log(msg);
  gravarProgresso(r);
}

function marcar(r: Relatorio, chave: string, quando: string = agoraIso()) {
  if (r.marcos[chave]) return;
  r.marcos[chave] = quando;
  evento(r, `marco: ${chave}`);
}

// ─────────────────────────────── o app (importado depois do ambiente) ───────────────────────────────

const app = {
  prisma: (await import("@/lib/db/prisma")).prisma,
  noCorte: await import("@/lib/media/editor-do-curso/no-corte"),
  avancado: await import("@/lib/media/editor-avancado/no-corte"),
  pecas: await import("@/lib/media/editor-do-curso/pecas-no-modelo"),
  limites: await import("@/lib/limites-do-plano"),
  piloto: await import("@/lib/media/piloto-do-servidor"),
  roteiro: await import("@/lib/media/roteiro-da-edicao"),
  cancelar: await import("@/lib/media/cancelar-video"),
  linha: await import("@/lib/media/linha-do-tempo"),
  tempos: await import("@/lib/media/tempos-medidos"),
  storage: await import("@/lib/media/storage"),
  producao: await import("@/lib/squad/peca-em-producao"),
};
const prisma = app.prisma;

async function projetoDeTeste() {
  const p = await prisma.project.findUnique({ where: { id: PROJETO_DE_TESTE }, select: { id: true, name: true, userId: true } });
  if (!p) throw new Error(`[trava] o projeto de teste ${PROJETO_DE_TESTE} não existe neste banco`);
  travar(p.id, "projeto lido");
  return p;
}

async function saudeDoWorker(): Promise<{ ok: boolean; ocioso: boolean; resumo: string }> {
  const url = (process.env.VIDEO_WORKER_URL ?? "").replace(/\/$/, "");
  if (!url) return { ok: false, ocioso: false, resumo: "VIDEO_WORKER_URL vazio" };
  try {
    const r = await fetch(`${url}/saude`, { signal: AbortSignal.timeout(20_000) });
    const s = (await r.json()) as { ok?: boolean; trabalhando?: boolean; emAndamento?: number; trabalhos?: number; montagensNaFila?: number; ambiente?: string; desligando?: boolean };
    const ocioso = !s.trabalhando && !s.emAndamento && !s.trabalhos && !s.montagensNaFila;
    return { ok: Boolean(s.ok) && !s.desligando, ocioso, resumo: `ambiente=${s.ambiente} trabalhando=${s.trabalhando} emAndamento=${s.emAndamento} trabalhos=${s.trabalhos} fila=${s.montagensNaFila}` };
  } catch (e) {
    return { ok: false, ocioso: false, resumo: `sem resposta (${e instanceof Error ? e.message : e})` };
  }
}

// ─────────────────────────────── o estilo ───────────────────────────────

const OPCOES = ["sob-medida-3d", "sob-medida-recorte", "sob-medida-graficos"];
const MODELO_DE_RESERVA_PADRAO = "modelo-manifesto";

function validarEstilo(estilo: string): { ok: boolean; sobMedida: boolean; motivo: string } {
  const sobMedida = app.avancado.ehSobMedida(estilo);
  if (sobMedida) {
    if (!OPCOES.includes(estilo)) return { ok: false, sobMedida, motivo: `use uma das opções ${OPCOES.join(", ")}` };
    if (!app.avancado.editorAvancadoLigado()) return { ok: false, sobMedida, motivo: "EDITOR_AVANCADO desligado" };
    return { ok: true, sobMedida, motivo: "opção sob medida" };
  }
  if (!app.noCorte.modeloPodeSerEscolhido(estilo)) return { ok: false, sobMedida, motivo: "o modelo não pode ser escolhido no corte (modeloPodeSerEscolhido = false)" };
  return { ok: true, sobMedida, motivo: "modelo do curso que serve no corte" };
}

function modeloEhTres(estilo: string, reserva: string | null): boolean {
  if (estilo === "sob-medida-3d") return true;
  const id = app.avancado.ehSobMedida(estilo) ? reserva : estilo;
  const m = app.noCorte.MODELOS_DO_CURSO.find((x) => x.id === id) as { three?: boolean } | undefined;
  return Boolean(m?.three);
}

/** A escolha do estilo, exatamente como a tela faz (PUT e, no modelo do curso, o POST {acao:"pecas"} automático). */
async function escolherEstilo(r: Relatorio, estilo: string, userId: string) {
  const sobMedida = app.avancado.ehSobMedida(estilo);
  const passos = r.estiloNoProjeto.passos;
  const levarParaAsPecas = async (modelo: string) => {
    // components/video/pecas-no-estilo-do-modelo.tsx: logo depois da escolha, POST {acao:"pecas"}; o dono confirma.
    const res = await app.pecas.levarModeloParaAsPecas({ projectId: PROJETO_DE_TESTE, userId, modelo, podeConfirmar: true });
    if (!res.ok) throw new Error(`levarModeloParaAsPecas(${modelo}) recusou: ${res.erro}`);
    passos.push(`levarModeloParaAsPecas(${modelo}): rodada ${res.pecas.rodada.n}, confirmada=${res.pecas.confirmada}`);
    // A rota grava a nota do segundo cérebro depois de responder (after); aqui, em seguida.
    const chave = (res.pecas as { preferenciaKey?: string | null }).preferenciaKey;
    if (chave) {
      const { registrarNota } = await import("@/lib/cerebro/captura");
      await registrarNota(PROJETO_DE_TESTE, `preferencia:${chave}`).catch((e) => passos.push(`registrarNota falhou: ${e instanceof Error ? e.message : e}`));
      passos.push(`registrarNota(preferencia:${chave})`);
    }
  };
  if (sobMedida) {
    const antes = await app.noCorte.escolhaDoEditorDoProjeto(PROJETO_DE_TESTE);
    const reservaAtual = app.avancado.ehSobMedida(antes.escolhido) ? antes.reserva : antes.escolhido;
    if (!reservaAtual || !app.noCorte.modeloServeNoCorte(reservaAtual)) {
      // Sem modelo do curso antes, a opção nasceria sem reserva: o cliente do teste escolhe o Manifesto antes.
      await app.noCorte.escolherModeloDoCurso(PROJETO_DE_TESTE, MODELO_DE_RESERVA_PADRAO);
      passos.push(`escolherModeloDoCurso(${MODELO_DE_RESERVA_PADRAO}) para a reserva existir`);
      await levarParaAsPecas(MODELO_DE_RESERVA_PADRAO);
    } else passos.push(`reserva já existente: ${reservaAtual}`);
    await app.noCorte.escolherModeloDoCurso(PROJETO_DE_TESTE, estilo);
    passos.push(`escolherModeloDoCurso(${estilo}); a tela não chama {acao:"pecas"} no sob medida (emUso nulo em modelos-do-curso.tsx)`);
  } else {
    await app.noCorte.escolherModeloDoCurso(PROJETO_DE_TESTE, estilo);
    passos.push(`escolherModeloDoCurso(${estilo})`);
    await levarParaAsPecas(estilo);
  }
  const depois = await app.noCorte.escolhaDoEditorDoProjeto(PROJETO_DE_TESTE);
  r.estiloNoProjeto.escolhido = depois.escolhido;
  r.estiloNoProjeto.reserva = depois.reserva;
  if (depois.escolhido !== estilo) throw new Error(`a escolha não ficou gravada: ${depois.escolhido}`);
  evento(r, `estilo gravado: ${depois.escolhido}${depois.reserva ? ` (reserva ${depois.reserva})` : ""}`);
}

// ─────────────────────────────── o vídeo ───────────────────────────────

function prepararTrecho(): { arquivo: string; duracao: number | null; erro: string | null } {
  if (videoArg) {
    if (!existsSync(videoArg)) return { arquivo: videoArg, duracao: null, erro: "arquivo do --video não existe" };
    return { arquivo: videoArg, duracao: duracaoDoArquivo(videoArg), erro: null };
  }
  if (!existsSync(ORIGINAL_PADRAO)) return { arquivo: ORIGINAL_PADRAO, duracao: null, erro: "o original.mp4 padrão não existe" };
  const pasta = `${RAIZ_DOS_RELATORIOS}/trechos`;
  mkdirSync(pasta, { recursive: true });
  const arq = `${pasta}/trecho-${TRECHO_INICIO}-${TRECHO_INICIO + TRECHO_DURACAO}.mp4`;
  if (!existsSync(arq) || statSync(arq).size < 1000) {
    const r = rodar("ffmpeg", ["-y", "-v", "error", "-ss", String(TRECHO_INICIO), "-i", ORIGINAL_PADRAO, "-t", String(TRECHO_DURACAO), "-c", "copy", "-avoid_negative_ts", "make_zero", "-movflags", "+faststart", arq]);
    if (!r.ok) return { arquivo: arq, duracao: null, erro: `ffmpeg não cortou o trecho: ${r.saida.slice(0, 300)}` };
  }
  return { arquivo: arq, duracao: duracaoDoArquivo(arq), erro: null };
}

/** O envio, como o navegador e o onUploadCompleted de app/api/videos/upload/route.ts. */
async function enviar(r: Relatorio, userId: string, arquivo: string, duracao: number | null): Promise<string> {
  // As portas do token (onBeforeGenerateToken): cota de gravações, armazenamento e teto do arquivo.
  const estouro = await app.limites.conferirGravacao(userId);
  if (estouro) throw new Error(`cota de gravações: ${app.limites.fraseDoEstouro(estouro)}`);
  const cheio = await app.limites.conferirArmazenamento(userId);
  if (cheio) throw new Error(`armazenamento: ${app.limites.fraseDoEstouro(cheio)}`);
  const envio = await app.limites.limitesDoEnvio(userId);
  const tamanho = statSync(arquivo).size;
  if (tamanho > envio.bytesMaximo) throw new Error(`arquivo de ${tamanho} bytes passa do teto do plano (${envio.bytesMaximo})`);

  const nome = `teste-e2e-${r.estilo}-${Date.now()}.mp4`;
  marcar(r, "envio-comecou");
  const { put } = await import("@vercel/blob");
  const blob = await put(`videos/${PROJETO_DE_TESTE}/${nome}`, createReadStream(arquivo), {
    access: "private",
    addRandomSuffix: true,
    multipart: true,
    contentType: "video/mp4",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  r.video.blobUrl = blob.url;
  const registro = await app.limites.registrarGravacao({ userId, projectId: PROJETO_DE_TESTE, blobUrl: blob.url, originalName: nome, sizeBytes: tamanho, duracaoSeg: duracao });
  if (!registro.ok) {
    await app.limites.descartarGravacaoRecusada(blob.url, PROJETO_DE_TESTE);
    throw new Error(`registro recusado: ${app.limites.fraseDoEstouro(registro.estouro)}`);
  }
  r.videoJobId = registro.video.id;
  marcar(r, "envio-terminou");
  if (registro.video.status === "uploaded") {
    const ok = await app.piloto.despacharPasso(registro.video.id, "transcrever");
    evento(r, `despacharPasso(transcrever): ${ok ? "aceito" : "falhou (o piloto da tela cura em 90 s, mas aqui não há tela)"}`);
  }
  return registro.video.id;
}

// ─────────────────────────────── a leitura (só SELECT) ───────────────────────────────

type Montagem = {
  estado?: string;
  desde?: string;
  montadoUrl?: string;
  falhaTecnica?: boolean;
  motivo?: string | null;
  chave?: string;
  custoUsd?: number;
  curso?: { modelo?: string; desistiu?: string | null; avancadoDesistiu?: boolean | null; fixo?: boolean; tentativasNoEstilo?: number; custoUsd?: number; tecnica?: string; versao?: string } | null;
  sobMedida?: { desistiu?: string | null } | null;
  completoOriginal?: { url?: string } | null;
};
type Trecho = {
  inicio: number;
  fim: number;
  nota?: number;
  titulo?: string;
  midia?: {
    vertical?: { url?: string } | null;
    verticalOriginal?: { url?: string } | null;
    capaArte?: { url?: string } | null;
    capaNoModelo?: { modelo?: string; pendente?: boolean; feitoEm?: string; reserva?: string | null; pelaIa?: boolean } | null;
  } | null;
  montagem?: Montagem | null;
};
type Capas = { opcoes?: Array<{ url?: string }>; escolhida?: number; geradaEm?: string; noModelo?: { modelo?: string; pendente?: boolean; feitoEm?: string; reserva?: string | null; pelaIa?: boolean } | null } | null;

async function lerVideo(id: string) {
  const v = await prisma.videoJob.findUnique({
    where: { id },
    select: { id: true, projectId: true, userId: true, status: true, error: true, durationSec: true, clips: true, completoMontagem: true, completoUrl: true, capas: true, finishedAt: true, createdAt: true, rodadaEm: true, blobUrl: true },
  });
  if (!v) return null;
  travar(v.projectId, `vídeo ${id}`);
  return v;
}
type Video = NonNullable<Awaited<ReturnType<typeof lerVideo>>>;

async function lerRun(videoId: string) {
  return prisma.pipelineRun.findFirst({ where: { projectId: PROJETO_DE_TESTE, config: { path: ["videoJobId"], equals: videoId } }, orderBy: { startedAt: "desc" }, select: { id: true, archived: true } });
}

async function lerPecas(videoId: string, runId: string | null) {
  const posts = await prisma.post.findMany({
    where: { projectId: PROJETO_DE_TESTE, OR: [...(runId ? [{ runId }] : []), { metadata: { path: ["videoJobId"], equals: videoId } }] },
    select: { id: true, platform: true, mediaType: true, imageUrl: true, status: true, metadata: true, runId: true },
  });
  const cards = runId
    ? await prisma.campaignCard.findMany({ where: { runId }, select: { id: true, cardType: true, mediaType: true, mediaUrl: true, status: true, metadata: true, content: true, postId: true } })
    : [];
  return { posts, cards };
}
type Pecas = Awaited<ReturnType<typeof lerPecas>>;

const ANDANDO = ["na-fila", "preparando", "dirigindo", "ilustrando", "gerando", "montando"];
const FINAIS = ["pronto", "sem-montagem"];
const ARTES = ["image", "carousel", "infographic"];
const clipsDe = (v: Video) => (Array.isArray(v.clips) ? (v.clips as unknown as Trecho[]) : []);
const completoDe = (v: Video) => (v.completoMontagem ?? null) as unknown as (Montagem & { roteiro?: unknown }) | null;
const metaDe = (m: unknown) => (m && typeof m === "object" ? (m as Record<string, unknown>) : {});
const arteDe = (m: unknown) => metaDe(metaDe(m).arteNoModelo) as { modelo?: string; pendente?: boolean; feitoEm?: string; reserva?: string | null; pelaIa?: boolean; reservaFalhou?: unknown };

/** Peças em falha, lidas do jeito que a tela lê (arteFalhou no post, falha no card, montagem parada). */
function pecasEmFalha(v: Video, p: Pecas): string[] {
  const f: string[] = [];
  if (v.status === "failed") f.push(`vídeo em falha: ${v.error ?? "sem motivo"}`);
  clipsDe(v).forEach((t, i) => {
    if (t.montagem?.estado === "sem-montagem") f.push(`corte ${i}: sem-montagem (${t.montagem.motivo ?? t.montagem.curso?.desistiu ?? "sem motivo"})`);
  });
  const c = completoDe(v);
  if (c?.estado === "sem-montagem") f.push(`completo: sem-montagem (${c.motivo ?? c.curso?.desistiu ?? "sem motivo"})`);
  for (const post of p.posts) {
    const m = metaDe(post.metadata);
    if (m.arteFalhou) f.push(`post ${post.id} (${post.mediaType}): arteFalhou`);
    if (post.status === "failed") f.push(`post ${post.id}: status failed`);
  }
  for (const card of p.cards) if (metaDe(card.metadata).falha) f.push(`card ${card.id} (${card.cardType}): falha`);
  return f;
}

/**
 * MÍDIA CRUA COMO "ESPERANDO VOCÊ" (regra de 30/09 em lib/squad/peca-em-producao.ts):
 * corte cuja edição ainda não terminou, com o card fora do "fazendo" e o post em
 * rascunho com o vídeo cru. A tela mostraria a versão simples como se fosse a final.
 */
function cruEsperandoVoce(v: Video, p: Pecas): string[] {
  const achados: string[] = [];
  const clips = clipsDe(v);
  for (const card of p.cards) {
    const m = metaDe(card.metadata);
    const i = typeof m.trechoIndice === "number" ? m.trechoIndice : null;
    if (card.cardType !== "video_clip" || i === null || m.completo) continue;
    const t = clips[i];
    if (!t || FINAIS.includes(t.montagem?.estado ?? "")) continue;
    if (["approved", "rejected"].includes(card.status)) continue;
    if (app.producao.cardEmProducao(card as never)) continue;
    // A leitura do vídeo e a dos cards não são a mesma foto: o card que já espelha a montagem
    // PRONTA foi lido depois de ela acabar (11/10, Recorte: card pronto às 15:26:24,968, vídeo lido antes).
    if (FINAIS.includes((m.montagem as { estado?: string } | undefined)?.estado ?? "")) continue;
    const post = card.postId ? p.posts.find((x) => x.id === card.postId) : null;
    const cru = t.midia?.verticalOriginal?.url ?? t.midia?.vertical?.url ?? null;
    const urlDoPost = post?.imageUrl ?? card.mediaUrl ?? null;
    if (urlDoPost && cru && urlDoPost === cru) achados.push(`corte ${i}: card ${card.id} com o vídeo cru e fora do "fazendo" enquanto a montagem está em ${t.montagem?.estado ?? "nenhum estado"}`);
  }
  // O completo: o card do completo com o vídeo sem edição enquanto a montagem anda.
  const c = completoDe(v);
  if (c && !FINAIS.includes(c.estado ?? "")) {
    for (const card of p.cards) {
      const m = metaDe(card.metadata);
      if (card.cardType !== "video_clip" || !m.completo) continue;
      if (["approved", "rejected"].includes(card.status) || app.producao.cardEmProducao(card as never)) continue;
      achados.push(`completo: card ${card.id} fora do "fazendo" enquanto a montagem do completo está em ${c.estado}`);
    }
  }
  return achados;
}

// ─────────────────────────────── a aprovação do roteiro ───────────────────────────────

async function aprovar(r: Relatorio, v: Video, userId: string): Promise<boolean> {
  const tela = await app.roteiro.montarTela(v.id, userId);
  if (!tela) throw new Error("montarTela não achou o vídeo para o dono");
  const trechos = clipsDe(v);
  const nota = (i: number) => (typeof trechos[i]?.nota === "number" ? (trechos[i].nota as number) : 0);
  const pre = [...tela.escolhidos];
  let lista = pre;
  let obs: string | null = null;
  if (cortesArg) {
    const n = Math.max(0, Number(cortesArg) || 0);
    lista = trechos.map((_, i) => i).sort((a, b) => nota(b) - nota(a)).slice(0, n).sort((a, b) => a - b);
    obs = `--cortes ${n}: os ${n} de maior nota`;
  } else if (pre.length > TETO_DE_CORTES) {
    lista = [...pre].sort((a, b) => nota(b) - nota(a)).slice(0, TETO_DE_CORTES).sort((a, b) => a - b);
    obs = `a tela pré-selecionou ${pre.length}; ficaram os ${TETO_DE_CORTES} de maior nota (teto de gasto do teste)`;
  }
  r.aprovacao.preSelecionados = pre;
  r.aprovacao.aprovados = lista;
  r.aprovacao.observacao = obs;
  const limite = Date.now() + 10 * 60_000;
  for (;;) {
    try {
      const res = await app.roteiro.aprovarRoteiro(v.id, userId, lista, { soCompleto: lista.length === 0 });
      r.aprovacao.em = agoraIso();
      marcar(r, "roteiro-aprovado", r.aprovacao.em);
      evento(r, `aprovarRoteiro: ${res.cortes} cortes, soCompleto=${res.soCompleto}, cobrado ${res.cobrado} créditos`);
      // app/api/videos/[id]/roteiro/aprovar/route.ts: o corte sai depois da resposta.
      const ok = await app.piloto.despacharPasso(v.id, "cortar");
      evento(r, `despacharPasso(cortar): ${ok ? "aceito" : "falhou"}`);
      return true;
    } catch (e) {
      const status = (e as { status?: number }).status;
      const msg = e instanceof Error ? e.message : String(e);
      if (e instanceof app.roteiro.RecusaDoRoteiro && status === 409 && Date.now() < limite) {
        // O plano de efeitos ainda preparando: o cliente espera e aprova de novo.
        const rot = await app.roteiro.lerRoteiroDoVideo(v.id).catch(() => null);
        if (!rot?.jornada && Date.now() > limite - 2 * 60_000 && process.env.EDITOR_JORNADA === "1") {
          // A produção não fez o plano da jornada para este vídeo: a chave dela, lá, não vale para este caminho.
          delete process.env.EDITOR_JORNADA;
          evento(r, "o roteiro não tem plano da jornada depois de 8 min: EDITOR_JORNADA desligado neste processo para a aprovação, como a produção se comportou");
          // Segue para testar o resto da jornada, mas o caso reprova: ou a produção deixou de fazer o plano, ou a chave dela difere da documentada.
          r.conferencias.push({ nome: "plano da jornada no roteiro", ok: false, motivo: `${agoraIso()}: a produção não fez o plano da jornada em 8 min; conferir EDITOR_JORNADA na Vercel e a esteira do roteiro` });
          continue;
        }
        log(`aprovação recusada (${msg}); de novo em 20 s`);
        await espera(20_000);
        continue;
      }
      evento(r, `aprovação recusada: ${msg}`);
      return false;
    }
  }
}

// ─────────────────────────────── o acompanhamento ───────────────────────────────

function estadoResumido(v: Video, p: Pecas): string {
  const cs = clipsDe(v).map((t, i) => `c${i}:${t.montagem?.estado ?? "-"}`).join(" ");
  const c = completoDe(v);
  const artes = p.posts.filter((x) => ARTES.includes(x.mediaType ?? ""));
  const artesProntas = artes.filter((x) => x.imageUrl && !arteDe(x.metadata).pendente).length;
  return `status=${v.status} ${cs} completo=${c?.estado ?? "-"} artes=${artesProntas}/${artes.length} capas=${(v.capas as Capas)?.opcoes?.length ?? 0}`;
}

function tudoTerminou(v: Video, p: Pecas): boolean {
  if (["failed", "cancelado"].includes(v.status)) return true;
  if (v.status !== "ready") return false;
  if (clipsDe(v).some((t) => !FINAIS.includes(t.montagem?.estado ?? ""))) return false;
  const c = completoDe(v);
  if (!c || !FINAIS.includes(c.estado ?? "")) return false;
  if (p.posts.some((x) => ARTES.includes(x.mediaType ?? "") && arteDe(x.metadata).pendente && !metaDe(x.metadata).arteFalhou)) return false;
  if (clipsDe(v).some((t) => t.midia?.capaNoModelo?.pendente)) return false;
  const capas = v.capas as Capas;
  if (!capas?.opcoes?.length || capas.noModelo?.pendente) return false;
  return true;
}

async function acompanhar(r: Relatorio, userId: string) {
  const id = r.videoJobId!;
  const limite = new Date(r.inicio).getTime() + prazoMin * 60_000;
  let ultimo = "";
  let ultimaSaude = 0;
  const vistos = new Set<string>();
  for (;;) {
    const v = await lerVideo(id);
    if (!v) throw new Error(`vídeo ${id} sumiu`);
    const run = await lerRun(id);
    if (run && !r.runId) {
      r.runId = run.id;
      evento(r, `run do vídeo: ${run.id}`);
    }
    const p = await lerPecas(id, r.runId);
    // Os marcos de cada etapa, pelo que o banco mostra.
    if (!["uploaded", "juntando-partes"].includes(v.status)) marcar(r, "transcricao-comecou");
    if (!["uploaded", "juntando-partes", "transcribing"].includes(v.status)) marcar(r, "transcricao-terminou");
    if (v.status === "roteiro") marcar(r, "roteiro-pronto");
    if (v.status === "roteiro" && !r.marcos["roteiro-aprovado"]) {
      if (!(await aprovar(r, v, userId))) break;
      continue;
    }
    const clips = clipsDe(v);
    if (r.marcos["roteiro-aprovado"] && clips.length && clips.every((t) => t.midia?.vertical?.url || t.midia?.verticalOriginal?.url)) marcar(r, "cortes-crus-prontos");
    clips.forEach((t, i) => {
      if (FINAIS.includes(t.montagem?.estado ?? "")) marcar(r, `montagem-corte-${i}`, t.montagem?.desde ?? agoraIso());
      if (t.midia?.capaArte?.url && !t.midia?.capaNoModelo?.pendente) marcar(r, `capa-corte-${i}`, t.midia?.capaNoModelo?.feitoEm ?? agoraIso());
    });
    const c = completoDe(v);
    if (c && FINAIS.includes(c.estado ?? "")) marcar(r, "completo", c.desde ?? agoraIso());
    const capas = v.capas as Capas;
    if (capas?.opcoes?.length && !capas.noModelo?.pendente) marcar(r, "capas-do-completo", capas.noModelo?.feitoEm ?? capas.geradaEm ?? agoraIso());
    const artes = p.posts.filter((x) => ARTES.includes(x.mediaType ?? ""));
    if (artes.length && artes.every((x) => !arteDe(x.metadata).pendente || metaDe(x.metadata).arteFalhou)) {
      const ultimas = artes.map((x) => arteDe(x.metadata).feitoEm).filter(Boolean).sort() as string[];
      marcar(r, "artes", ultimas[ultimas.length - 1] ?? agoraIso());
    }
    // Durante a edição, nenhum post com mídia crua esperando o cliente.
    for (const a of cruEsperandoVoce(v, p)) {
      if (vistos.has(a)) continue;
      vistos.add(a);
      r.conferencias.push({ nome: "nenhuma mídia crua como esperando você durante a edição", ok: false, motivo: `${agoraIso()}: ${a}` });
      evento(r, `REPROVA: ${a}`);
    }
    const resumo = estadoResumido(v, p);
    if (resumo !== ultimo) {
      ultimo = resumo;
      evento(r, resumo);
    }
    if (Date.now() - ultimaSaude > 5 * 60_000) {
      ultimaSaude = Date.now();
      const s = await saudeDoWorker();
      log(`worker: ${s.resumo}`);
    }
    if (tudoTerminou(v, p)) {
      marcar(r, "fim");
      break;
    }
    if (Date.now() > limite) {
      evento(r, `prazo de ${prazoMin} min estourado: ${resumo}`);
      break;
    }
    await espera(20_000);
  }
}

// ─────────────────────────────── as conferências ───────────────────────────────

function conferir(r: Relatorio, v: Video, p: Pecas) {
  const add = (nome: string, ok: boolean, motivo: string, dependeDeCampoNovo?: string) => r.conferencias.push({ nome, ok, motivo, ...(dependeDeCampoNovo ? { dependeDeCampoNovo } : {}) });
  const estilo = r.estilo;
  const sobMedida = app.avancado.ehSobMedida(estilo);
  const reserva = r.estiloNoProjeto.reserva;

  // 0. A escolha ainda é a do teste (outro processo não trocou no meio).
  add("estilo gravado no projeto", r.estiloNoProjeto.escolhido === estilo, `escolhido=${r.estiloNoProjeto.escolhido} reserva=${reserva ?? "-"}`);

  // 1. Cada corte no estilo escolhido.
  const clips = clipsDe(v);
  add("pelo menos um corte aprovado foi editado", clips.length > 0 || r.aprovacao.aprovados.length === 0, `${clips.length} cortes na esteira, ${r.aprovacao.aprovados.length} aprovados`);
  clips.forEach((t, i) => {
    const m = t.montagem;
    const cu = m?.curso;
    const problemas: string[] = [];
    if (m?.estado !== "pronto") problemas.push(`estado ${m?.estado ?? "nenhum"}`);
    if (!cu) problemas.push("sem montagem.curso (passou pelo editor de antes, a reserva)");
    if (cu && cu.modelo !== estilo) problemas.push(`curso.modelo=${cu.modelo} (esperado ${estilo})`);
    if (cu?.desistiu) problemas.push(`curso.desistiu: ${cu.desistiu}`);
    if (cu?.avancadoDesistiu) problemas.push("curso.avancadoDesistiu: caiu para a reserva");
    if (m?.sobMedida?.desistiu) problemas.push(`sobMedida.desistiu: ${m.sobMedida.desistiu}`);
    if (sobMedida && reserva && cu?.modelo === reserva) problemas.push(`saiu na reserva ${reserva}`);
    const cru = t.midia?.verticalOriginal?.url ?? null;
    if (!m?.montadoUrl) problemas.push("sem montadoUrl");
    else if (cru && m.montadoUrl === cru) problemas.push("montadoUrl igual ao corte cru");
    if (m?.montadoUrl && !cru) problemas.push("sem midia.verticalOriginal (o cru não foi guardado na entrega)");
    if (m?.montadoUrl && t.midia?.vertical?.url !== m.montadoUrl) problemas.push("midia.vertical não é a versão editada");
    const chaveEsperada = sobMedida ? "/avancado-" : "/curso-";
    if (m?.chave && !m.chave.includes(chaveEsperada)) problemas.push(`chave ${m.chave} fora do caminho ${chaveEsperada}`);
    add(`corte ${i} no estilo ${estilo}`, problemas.length === 0, problemas.length ? problemas.join("; ") : `curso.modelo=${cu?.modelo} ${m?.montadoUrl}`);
  });

  // 2. O completo no estilo escolhido (no sob medida, pelo editor avançado, nunca pelo modelo de reserva).
  const c = completoDe(v);
  {
    const problemas: string[] = [];
    if (!c) problemas.push("sem completoMontagem");
    if (c && c.estado !== "pronto") problemas.push(`estado ${c.estado}`);
    if (c && !c.curso) problemas.push("sem completoMontagem.curso (o completo saiu pelo caminho de antes)");
    if (c?.curso && c.curso.modelo !== estilo) problemas.push(`curso.modelo=${c.curso.modelo} (esperado ${estilo})`);
    if (c?.curso?.desistiu) problemas.push(`curso.desistiu: ${c.curso.desistiu}`);
    if (sobMedida && reserva && c?.curso?.modelo === reserva) problemas.push(`o completo saiu no modelo de reserva ${reserva}`);
    if (c && !c.montadoUrl) problemas.push("sem montadoUrl");
    if (c?.montadoUrl && v.completoUrl !== c.montadoUrl) problemas.push("completoUrl não é a versão editada");
    if (c?.montadoUrl && c.completoOriginal?.url && c.montadoUrl === c.completoOriginal.url) problemas.push("montadoUrl igual ao completo original");
    if (sobMedida && c?.montadoUrl && c.montadoUrl.includes("completo-editado-curso")) problemas.push("arquivo do completo pelo caminho do modelo do curso, não do avançado");
    add(
      `completo no estilo ${estilo}`,
      problemas.length === 0,
      problemas.length ? problemas.join("; ") : `curso.modelo=${c?.curso?.modelo} ${c?.montadoUrl}`,
      sobMedida ? "completoMontagem.curso.modelo com a opção sob medida (o completo sob medida está sendo ligado em montagem-do-completo.ts; nome provável, seguindo o corte)" : undefined
    );
  }

  // 3. Cada arte (imagem, carrossel, infográfico) no estilo escolhido.
  const artes = p.posts.filter((x) => ARTES.includes(x.mediaType ?? ""));
  add("as artes dos posts nasceram", artes.length > 0, `${artes.length} posts de arte (${ARTES.join(", ")}) no run`);
  for (const post of artes) {
    const a = arteDe(post.metadata);
    const problemas: string[] = [];
    if (!metaDe(post.metadata).arteNoModelo) problemas.push("sem metadata.arteNoModelo (arte pelo caminho de antes)");
    if (a.modelo && a.modelo !== estilo) problemas.push(`arteNoModelo.modelo=${a.modelo} (esperado ${estilo})`);
    if (a.pendente) problemas.push("ainda pendente");
    if (a.reserva) problemas.push(`foi para a reserva: ${a.reserva}`);
    if (a.reservaFalhou || metaDe(post.metadata).arteFalhou) problemas.push("arte em falha");
    if (!post.imageUrl) problemas.push("sem imageUrl");
    add(
      `arte ${post.mediaType} ${post.platform} (${post.id}) no estilo ${estilo}`,
      problemas.length === 0,
      problemas.length ? problemas.join("; ") : `arteNoModelo.modelo=${a.modelo} pelaIa=${a.pelaIa ?? false}`,
      sobMedida ? "arteNoModelo.modelo com a opção sob medida (regraDaArtePeloModelo no ramo das artes sob medida)" : undefined
    );
  }

  // 4. Cada capa no estilo escolhido: a do corte (midia.capaNoModelo) e as do completo (capas.noModelo).
  const dependeCapa = sobMedida ? "capa sob medida pela IA (capaPelaIa ainda não ligada); nome provável: o mesmo capaNoModelo/noModelo com modelo = opção sob medida" : undefined;
  clips.forEach((t, i) => {
    const cm = t.midia?.capaNoModelo;
    const problemas: string[] = [];
    if (!t.midia?.capaArte?.url) problemas.push("sem midia.capaArte");
    if (!cm) problemas.push("sem midia.capaNoModelo (capa pelo caminho de antes)");
    if (cm?.modelo && cm.modelo !== estilo) problemas.push(`capaNoModelo.modelo=${cm.modelo} (esperado ${estilo})`);
    if (cm?.pendente) problemas.push("ainda pendente");
    if (cm?.reserva) problemas.push(`foi para a reserva: ${cm.reserva}`);
    add(`capa do corte ${i} no estilo ${estilo}`, problemas.length === 0, problemas.length ? problemas.join("; ") : `capaNoModelo.modelo=${cm?.modelo}`, dependeCapa);
  });
  {
    const capas = v.capas as Capas;
    const nm = capas?.noModelo;
    const problemas: string[] = [];
    if (!capas?.opcoes?.length) problemas.push("sem capas do completo");
    if (!nm) problemas.push("sem capas.noModelo (capa pelo caminho de antes)");
    if (nm?.modelo && nm.modelo !== estilo) problemas.push(`capas.noModelo.modelo=${nm.modelo} (esperado ${estilo})`);
    if (nm?.pendente) problemas.push("ainda pendente");
    if (nm?.reserva) problemas.push(`foi para a reserva: ${nm.reserva}`);
    add(`capas do completo no estilo ${estilo}`, problemas.length === 0, problemas.length ? problemas.join("; ") : `${capas?.opcoes?.length} opções, noModelo.modelo=${nm?.modelo}`, dependeCapa);
  }

  // 5. Nenhuma peça em falha.
  const falhas = pecasEmFalha(v, p);
  add("nenhuma peça em falha", falhas.length === 0, falhas.length ? falhas.join("; ") : "nenhuma");

  // 6. Nenhuma mídia crua como "esperando você" (as achadas durante a vigília já entraram como reprovação).
  if (!r.conferencias.some((x) => x.nome.startsWith("nenhuma mídia crua"))) add("nenhuma mídia crua como esperando você durante a edição", true, "nada achado nas leituras de 20 em 20 s");

  // 7. A esteira terminou.
  add("a esteira terminou dentro do prazo", Boolean(r.marcos.fim), r.marcos.fim ? `fim em ${r.marcos.fim}` : `prazo de ${prazoMin} min sem terminar (status ${v.status})`);

  // 8. Os tempos contra a promessa da linha do tempo.
  for (const t of r.tempos) {
    if (t.medidoSeg == null || t.previstoSeg == null) continue;
    add(`tempo: ${t.etapa}`, !t.passou, `medido ${min(t.medidoSeg)}, prometido ${min(t.previstoSeg)} (lib/media/linha-do-tempo.ts e tempos-medidos.ts)`);
  }
}

function calcularTempos(r: Relatorio, v: Video) {
  const d = v.durationSec ?? null;
  const tres = modeloEhTres(r.estilo, r.estiloNoProjeto.reserva);
  // A promessa do editor do estilo: o sob medida tem a dele (segundosNoSobMedida), o modelo do curso a sua.
  const sobMedida = r.estilo.startsWith("sob-medida");
  const curso = (dur: number | null) => {
    const x = sobMedida ? app.linha.segundosNoSobMedida(dur) : app.linha.segundosNoModeloDoCurso(dur, tres);
    return x.efeitos + x.montagem;
  };
  const base = app.tempos.segundosDaEtapa("base", d);
  const m = r.marcos;
  const ap = m["roteiro-aprovado"];
  const linha = (etapa: string, medido: number | null, previsto: number | null) => r.tempos.push({ etapa, medidoSeg: medido, previstoSeg: previsto, passou: medido != null && previsto != null ? medido > previsto : null });
  r.tempos = [];
  linha("envio", seg(m["envio-comecou"], m["envio-terminou"]), null);
  linha("transcrição", seg(m["envio-terminou"], m["transcricao-terminou"]), null);
  linha("do envio ao roteiro pronto", seg(m["envio-terminou"], m["roteiro-pronto"]), app.tempos.segundosDaEtapa("roteiro", d));
  linha("cortes crus (da aprovação)", seg(ap, m["cortes-crus-prontos"]), Math.round(base * 0.6));
  clipsDe(v).forEach((t, i) => linha(`montagem do corte ${i} (${(t.fim - t.inicio).toFixed(0)} s, da aprovação)`, seg(ap, m[`montagem-corte-${i}`]), Math.round(base * 0.6) + curso(t.fim - t.inicio)));
  linha("completo (da aprovação)", seg(ap, m.completo), base + curso(d));
  linha("artes (da aprovação)", seg(ap, m.artes), null);
  clipsDe(v).forEach((_, i) => linha(`capa do corte ${i} (da aprovação)`, seg(ap, m[`capa-corte-${i}`]), Math.round(base * 0.7)));
  linha("capas do completo (da aprovação)", seg(ap, m["capas-do-completo"]), null);
  // O fim é o último marco de peça (o status do vídeo fica "pronto" antes de a edição acabar).
  const ultimo = Object.entries(m).filter(([k, x]) => x && k !== "fim").map(([, x]) => String(x)).sort().pop() ?? m.fim;
  linha("tudo (do envio à última peça)", seg(m["envio-comecou"], ultimo), app.tempos.segundosDaEtapa("roteiro", d) + base + curso(d));
}

// ─────────────────────────────── o custo (só SELECT) ───────────────────────────────

function fornecedorDe(model: string, operation: string): string {
  const s = `${model} ${operation}`.toLowerCase();
  if (/higgsfield|kling|seedream|soul|nano-banana-2|hf-/.test(s)) return "Higgsfield";
  if (/runpod/.test(s)) return "RunPod";
  if (/jev/.test(s)) return "JEV";
  if (/gemini|imagen|veo|nano/.test(s)) return "Google";
  if (/gpt|openai|dall/.test(s)) return "OpenAI";
  if (/claude|sonnet|opus|haiku/.test(s)) return "Anthropic";
  if (/deepgram|nova/.test(s)) return "Deepgram";
  if (/fal|birefnet/.test(s)) return "fal";
  if (/eleven/.test(s)) return "ElevenLabs";
  return "outro";
}

async function calcularCusto(r: Relatorio, v: Video | null) {
  const desde = new Date(r.inicio);
  const ate = r.fim ? new Date(r.fim) : new Date();
  const linhas = await prisma.aiUsage.findMany({
    where: { OR: [{ projectId: PROJETO_DE_TESTE, createdAt: { gte: desde, lte: ate } }, ...(r.runId ? [{ runId: r.runId }] : [])] },
    select: { id: true, operation: true, model: true, costUsd: true },
  });
  const grupos = new Map<string, { operation: string; model: string; usd: number; n: number }>();
  const porFornecedor: Record<string, number> = {};
  let total = 0;
  for (const l of linhas) {
    const usd = Number(l.costUsd);
    total += usd;
    const k = `${l.operation}|${l.model}`;
    const g = grupos.get(k) ?? { operation: l.operation, model: l.model, usd: 0, n: 0 };
    g.usd += usd;
    g.n += 1;
    grupos.set(k, g);
    const f = fornecedorDe(l.model, l.operation);
    porFornecedor[f] = +((porFornecedor[f] ?? 0) + usd).toFixed(4);
  }
  // O que o worker diz ter gasto em cada montagem (curso.custoUsd), à parte: parte dele já está no ai_usage pela rota do plano.
  let workerUsd = 0;
  if (v) {
    for (const t of clipsDe(v)) workerUsd += Number(t.montagem?.curso?.custoUsd ?? t.montagem?.custoUsd ?? 0);
    const c = completoDe(v);
    workerUsd += Number(c?.curso?.custoUsd ?? c?.custoUsd ?? 0);
  }
  const semHiggs = !porFornecedor.Higgsfield;
  r.custo = {
    totalUsd: +total.toFixed(4),
    porFornecedor,
    linhas: [...grupos.values()].map((g) => ({ ...g, usd: +g.usd.toFixed(4) })).sort((a, b) => b.usd - a.usd),
    workerUsd: +workerUsd.toFixed(4),
    observacao:
      "ai_usage não tem videoJobId: somado por projectId na janela do teste mais o runId do vídeo. " +
      "O RunPod (recorte e render na GPU) não grava em ai_usage: o custo dele não entra aqui (referência: ~US$ 0,04 por trecho de 30 s no recorte, ESTADO-EDITOR-AVANCADO.md). " +
      (semHiggs ? "Nenhuma linha da Higgsfield na janela. " : "A Higgsfield grava em ai_usage (lib/media/higgsfield.ts) e está somada. ") +
      "workerUsd é o custo que o worker relatou nas montagens (curso.custoUsd), só de referência.",
  };
}

// ─────────────────────────────── a folha de quadros ───────────────────────────────

async function baixar(url: string, destino: string): Promise<boolean> {
  try {
    if (url.startsWith("data:")) {
      writeFileSync(destino, Buffer.from(url.slice(url.indexOf(",") + 1), "base64"));
      return true;
    }
    const buf = await app.storage.lerMidia(url);
    if (!buf) return false;
    writeFileSync(destino, buf);
    return true;
  } catch {
    return false;
  }
}

const FONTE = "C:/Windows/Fonts/arial.ttf";

function folhaDeVideo(arq: string, destino: string, pontos: number, colunas: number, largura: number, altura: number): boolean {
  const d = duracaoDoArquivo(arq);
  if (!d) return false;
  const pasta = `${destino}.quadros`;
  mkdirSync(pasta, { recursive: true });
  for (let k = 0; k < pontos; k++) {
    const t = Math.max(0, Math.min(d - 0.2, (d * (k + 0.5)) / pontos));
    // O ffmpeg do Windows não tem o fontconfig: a fonte vai pelo arquivo (sem ela, o quadro sai sem o tempo escrito).
    const texto = existsSync(FONTE) ? `,drawtext=fontfile='${FONTE.replace(":", "\\:")}':text='${t.toFixed(1)}s':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6` : "";
    rodar("ffmpeg", ["-y", "-v", "error", "-ss", t.toFixed(2), "-i", arq, "-frames:v", "1", "-vf", `scale=${largura}:${altura}:force_original_aspect_ratio=decrease,pad=${largura}:${altura}:(ow-iw)/2:(oh-ih)/2:color=black${texto}`, `${pasta}/q${String(k).padStart(2, "0")}.jpg`]);
  }
  const linhas = Math.ceil(pontos / colunas);
  return rodar("ffmpeg", ["-y", "-v", "error", "-framerate", "1", "-i", `${pasta}/q%02d.jpg`, "-vf", `tile=${colunas}x${linhas}:padding=4:color=white`, "-frames:v", "1", destino]).ok;
}

function folhaDeImagens(arquivos: string[], destino: string, colunas: number, lado: number): boolean {
  if (!arquivos.length) return false;
  const pasta = `${destino}.quadros`;
  mkdirSync(pasta, { recursive: true });
  arquivos.forEach((a, k) => rodar("ffmpeg", ["-y", "-v", "error", "-i", a, "-frames:v", "1", "-vf", `scale=${lado}:${lado}:force_original_aspect_ratio=decrease,pad=${lado}:${lado}:(ow-iw)/2:(oh-ih)/2:color=white`, `${pasta}/q${String(k).padStart(2, "0")}.jpg`]));
  const linhas = Math.ceil(arquivos.length / colunas);
  return rodar("ffmpeg", ["-y", "-v", "error", "-framerate", "1", "-i", `${pasta}/q%02d.jpg`, "-vf", `tile=${Math.min(colunas, arquivos.length)}x${linhas}:padding=4:color=gray`, "-frames:v", "1", destino]).ok;
}

async function folhas(r: Relatorio, v: Video, p: Pecas) {
  const pasta = `${r.pasta}/midias`;
  mkdirSync(pasta, { recursive: true });
  for (const [i, t] of clipsDe(v).entries()) {
    const url = t.montagem?.montadoUrl;
    if (!url) continue;
    const arq = `${pasta}/corte-${i}.mp4`;
    if (await baixar(url, arq)) {
      const f = `${r.pasta}/folha-corte-${i}.jpg`;
      if (folhaDeVideo(arq, f, 8, 4, 270, 480)) r.imagens[`corte ${i}`] = f;
    }
  }
  const c = completoDe(v);
  if (c?.montadoUrl) {
    const arq = `${pasta}/completo.mp4`;
    if (await baixar(c.montadoUrl, arq)) {
      const f = `${r.pasta}/folha-completo.jpg`;
      if (folhaDeVideo(arq, f, 12, 4, 480, 270)) r.imagens.completo = f;
    }
  }
  const artes: string[] = [];
  for (const post of p.posts.filter((x) => ARTES.includes(x.mediaType ?? "") && x.imageUrl)) {
    const urls = (post.imageUrl as string).startsWith("data:") ? [post.imageUrl as string] : (post.imageUrl as string).split("|");
    for (const [k, u] of urls.entries()) {
      const arq = `${pasta}/arte-${post.mediaType}-${post.platform}-${post.id}-${k}.img`;
      if (await baixar(u, arq)) artes.push(arq);
    }
  }
  if (folhaDeImagens(artes, `${r.pasta}/folha-artes.jpg`, 4, 420)) r.imagens.artes = `${r.pasta}/folha-artes.jpg`;
  const capas: string[] = [];
  for (const [i, t] of clipsDe(v).entries()) {
    const u = t.midia?.capaArte?.url;
    if (u && (await baixar(u, `${pasta}/capa-corte-${i}.img`))) capas.push(`${pasta}/capa-corte-${i}.img`);
  }
  for (const [k, o] of ((v.capas as Capas)?.opcoes ?? []).entries()) {
    if (o.url && (await baixar(o.url, `${pasta}/capa-completo-${k}.img`))) capas.push(`${pasta}/capa-completo-${k}.img`);
  }
  if (folhaDeImagens(capas, `${r.pasta}/folha-capas.jpg`, 4, 420)) r.imagens.capas = `${r.pasta}/folha-capas.jpg`;
}

// ─────────────────────────────── o relatório ───────────────────────────────

function relatorioEmMd(r: Relatorio): string {
  const l: string[] = [];
  l.push(`# Teste de ponta a ponta: ${r.estilo}`);
  l.push("");
  l.push(`- Veredito: **${r.veredito.toUpperCase()}**`);
  l.push(`- Projeto: ${r.projectId} (${NOME_DO_PROJETO}); vídeo: ${r.videoJobId ?? "-"}; run: ${r.runId ?? "-"}`);
  l.push(`- Início: ${r.inicio}; fim: ${r.fim ?? "-"}`);
  l.push(`- Vídeo enviado: ${r.video.arquivo} (${r.video.duracaoSeg?.toFixed(1) ?? "?"} s)`);
  l.push(`- Estilo no projeto: ${r.estiloNoProjeto.escolhido ?? "-"} (reserva ${r.estiloNoProjeto.reserva ?? "-"})`);
  for (const p of r.estiloNoProjeto.passos) l.push(`  - ${p}`);
  l.push(`- Cortes pré-selecionados pela tela: [${r.aprovacao.preSelecionados.join(", ")}]; aprovados: [${r.aprovacao.aprovados.join(", ")}]${r.aprovacao.observacao ? ` (${r.aprovacao.observacao})` : ""}`);
  l.push(`- Chaves ligadas só neste processo: ${Object.entries(r.chavesLigadasLocalmente).map(([k, v]) => `${k}=${v}`).join(", ")}`);
  l.push("");
  l.push("## Conferências");
  l.push("");
  l.push("| | Conferência | Motivo |");
  l.push("|---|---|---|");
  for (const c of r.conferencias) l.push(`| ${c.ok ? "ok" : "REPROVA"} | ${c.nome}${c.dependeDeCampoNovo ? " (campo novo, ver nota)" : ""} | ${c.motivo.replace(/\|/g, "/")} |`);
  const novos = r.conferencias.filter((c) => c.dependeDeCampoNovo);
  if (novos.length) {
    l.push("");
    l.push("Notas de campo novo (lidas pelo nome mais provável; conferir quando o ramo do outro dono entrar):");
    for (const c of novos) l.push(`- ${c.nome}: ${c.dependeDeCampoNovo}`);
  }
  l.push("");
  l.push("## Tempos");
  l.push("");
  l.push("| Etapa | Medido | Prometido | Passou? |");
  l.push("|---|---|---|---|");
  for (const t of r.tempos) l.push(`| ${t.etapa} | ${min(t.medidoSeg)} | ${min(t.previstoSeg)} | ${t.passou == null ? "-" : t.passou ? "sim" : "não"} |`);
  l.push("");
  l.push("## Custo de IA");
  l.push("");
  if (r.custo) {
    l.push(`Total: US$ ${r.custo.totalUsd.toFixed(2)}. Por fornecedor: ${Object.entries(r.custo.porFornecedor).map(([k, v]) => `${k} US$ ${v.toFixed(2)}`).join(", ") || "nenhum"}. Relatado pelo worker: US$ ${r.custo.workerUsd.toFixed(2)}.`);
    l.push("");
    l.push(r.custo.observacao);
    l.push("");
    l.push("| Operação | Modelo | Chamadas | US$ |");
    l.push("|---|---|---|---|");
    for (const g of r.custo.linhas) l.push(`| ${g.operation} | ${g.model} | ${g.n} | ${g.usd.toFixed(4)} |`);
  } else l.push("(ainda não calculado)");
  l.push("");
  l.push("## Imagens");
  l.push("");
  for (const [k, v] of Object.entries(r.imagens)) l.push(`- ${k}: ${v}`);
  l.push("");
  l.push("## Marcos");
  l.push("");
  for (const [k, v] of Object.entries(r.marcos)) l.push(`- ${k}: ${v}`);
  l.push("");
  l.push("## Eventos");
  l.push("");
  for (const e of r.eventos.slice(-200)) l.push(`- ${e.em} ${e.msg}`);
  l.push("");
  return l.join("\n");
}

function novoRelatorio(estilo: string, pasta: string, simulacao: boolean): Relatorio {
  return {
    versao: 1,
    estilo,
    projectId: PROJETO_DE_TESTE,
    videoJobId: null,
    runId: null,
    pasta,
    inicio: agoraIso(),
    fim: null,
    simulacao,
    chavesLigadasLocalmente: CHAVES_LIGADAS,
    video: { arquivo: "", duracaoSeg: null, blobUrl: null },
    estiloNoProjeto: { escolhido: null, reserva: null, passos: [] },
    aprovacao: { preSelecionados: [], aprovados: [], observacao: null, em: null },
    marcos: {},
    tempos: [],
    conferencias: [],
    custo: null,
    imagens: {},
    eventos: [],
    veredito: simulacao ? "simulado" : "em andamento",
  };
}

/** O relatório de um teste já enviado, para o --acompanhar retomar de onde parou. */
function acharRelatorio(videoJobId: string): Relatorio | null {
  if (!existsSync(RAIZ_DOS_RELATORIOS)) return null;
  for (const d of readdirSync(RAIZ_DOS_RELATORIOS).sort().reverse()) {
    const arq = `${RAIZ_DOS_RELATORIOS}/${d}/relatorio.json`;
    if (!existsSync(arq)) continue;
    try {
      const r = JSON.parse(readFileSync(arq, "utf8")) as Relatorio;
      if (r.videoJobId === videoJobId) return r;
    } catch {
      /* relatório ilegível: segue procurando */
    }
  }
  return null;
}

async function fechar(r: Relatorio, fim: string = agoraIso()) {
  const v = await lerVideo(r.videoJobId!);
  if (!v) throw new Error("vídeo sumiu antes do fechamento");
  const p = await lerPecas(v.id, r.runId);
  r.fim = fim;
  calcularTempos(r, v);
  conferir(r, v, p);
  await calcularCusto(r, v);
  evento(r, "baixando as mídias para as folhas de quadros");
  await folhas(r, v, p);
  r.veredito = r.conferencias.every((c) => c.ok) ? "aprovado" : "reprovado";
  gravarProgresso(r);
}

// ─────────────────────────────── os modos ───────────────────────────────

async function modoLimpar(id: string) {
  const projeto = await projetoDeTeste();
  const v = await prisma.videoJob.findUnique({ where: { id }, select: { id: true, projectId: true, status: true } });
  if (!v) throw new Error(`vídeo ${id} não existe`);
  travar(v.projectId, `--limpar ${id}`);
  const r = await app.cancelar.cancelarVideo(id, projeto.userId);
  console.log(JSON.stringify(r, null, 2));
}

async function modoSimular(estilo: string) {
  const r = novoRelatorio(estilo, novaPasta(`${estilo}-simulado`), true);
  const add = (nome: string, ok: boolean, motivo: string) => r.conferencias.push({ nome, ok, motivo });
  add("ambiente", true, `.env lido de ${envLido.join(" e ")}`);
  const projeto = await projetoDeTeste();
  add("projeto de teste", projeto.name === NOME_DO_PROJETO, `${projeto.id} "${projeto.name}" dono ${projeto.userId}`);
  try {
    travar("cmoutroprojeto000000000000", "prova da trava");
    add("trava recusa outro projeto", false, "a trava deixou passar outro id");
  } catch (e) {
    add("trava recusa outro projeto", true, (e as Error).message.slice(0, 90));
  }
  const ve = validarEstilo(estilo);
  add("estilo válido", ve.ok, `${estilo}: ${ve.motivo}`);
  const escolha = await app.noCorte.escolhaDoEditorDoProjeto(PROJETO_DE_TESTE);
  const reservaHoje = app.avancado.ehSobMedida(escolha.escolhido) ? escolha.reserva : escolha.escolhido;
  r.estiloNoProjeto.escolhido = escolha.escolhido;
  r.estiloNoProjeto.reserva = escolha.reserva;
  const plano = ve.sobMedida
    ? reservaHoje && app.noCorte.modeloServeNoCorte(reservaHoje)
      ? [`escolherModeloDoCurso(${estilo}) com a reserva ${reservaHoje}`]
      : [`escolherModeloDoCurso(${MODELO_DE_RESERVA_PADRAO}) e levarModeloParaAsPecas(${MODELO_DE_RESERVA_PADRAO})`, `escolherModeloDoCurso(${estilo})`]
    : [`escolherModeloDoCurso(${estilo})`, `levarModeloParaAsPecas(${estilo}) e registrarNota`];
  add("plano da escolha do estilo", true, `hoje: escolhido=${escolha.escolhido ?? "-"} reserva=${escolha.reserva ?? "-"}; faria: ${plano.join(" -> ")}`);
  const funcoes: Array<[string, unknown]> = [
    ["escolherModeloDoCurso", app.noCorte.escolherModeloDoCurso],
    ["levarModeloParaAsPecas", app.pecas.levarModeloParaAsPecas],
    ["conferirGravacao", app.limites.conferirGravacao],
    ["registrarGravacao", app.limites.registrarGravacao],
    ["despacharPasso", app.piloto.despacharPasso],
    ["montarTela", app.roteiro.montarTela],
    ["aprovarRoteiro", app.roteiro.aprovarRoteiro],
    ["cancelarVideo", app.cancelar.cancelarVideo],
    ["segundosNoModeloDoCurso", app.linha.segundosNoModeloDoCurso],
    ["segundosDaEtapa", app.tempos.segundosDaEtapa],
    ["lerMidia", app.storage.lerMidia],
    ["cardEmProducao", app.producao.cardEmProducao],
  ];
  const faltam = funcoes.filter(([, f]) => typeof f !== "function").map(([n]) => n);
  add("funções do app importáveis", faltam.length === 0, faltam.length ? `faltam: ${faltam.join(", ")}` : `${funcoes.length} funções: ${funcoes.map(([n]) => n).join(", ")}`);
  const { put } = await import("@vercel/blob");
  add("Blob e segredos", typeof put === "function" && Boolean(process.env.BLOB_READ_WRITE_TOKEN) && Boolean(process.env.PILOTO_SECRET || process.env.BETTER_AUTH_SECRET), `token do Blob ${process.env.BLOB_READ_WRITE_TOKEN ? "presente" : "AUSENTE"}, segredo do piloto ${process.env.PILOTO_SECRET ? "PILOTO_SECRET" : process.env.BETTER_AUTH_SECRET ? "BETTER_AUTH_SECRET" : "AUSENTE"}, app ${process.env.NEXT_PUBLIC_APP_URL}`);
  const estouro = await app.limites.conferirGravacao(projeto.userId);
  const cheio = await app.limites.conferirArmazenamento(projeto.userId);
  add("cota e armazenamento do dono", !estouro && !cheio, estouro ? app.limites.fraseDoEstouro(estouro) : cheio ? app.limites.fraseDoEstouro(cheio) : "livres");
  const s = await saudeDoWorker();
  add("worker /saude", s.ok, `${s.resumo}${s.ocioso ? " (ocioso)" : ""}`);
  const ff = rodar("ffmpeg", ["-version"]);
  add("ffmpeg local", ff.ok, ff.saida.split("\n")[0]);
  const trecho = prepararTrecho();
  r.video.arquivo = trecho.arquivo;
  r.video.duracaoSeg = trecho.duracao;
  add("trecho do vídeo", !trecho.erro && Boolean(trecho.duracao) && (trecho.duracao ?? 0) > app.roteiro.VIDEO_CURTO_SEG, trecho.erro ?? `${trecho.arquivo}: ${trecho.duracao?.toFixed(1)} s (acima de ${app.roteiro.VIDEO_CURTO_SEG} s, a tela pré-seleciona cortes), ${(statSync(trecho.arquivo).size / 1e6).toFixed(1)} MB`);
  // A promessa da linha do tempo para este trecho.
  const d = trecho.duracao ?? TRECHO_DURACAO;
  const tres = modeloEhTres(estilo, ve.sobMedida ? reservaHoje ?? MODELO_DE_RESERVA_PADRAO : null);
  const cursoS = app.linha.segundosNoModeloDoCurso(d, tres);
  const promessa = { roteiro: app.tempos.segundosDaEtapa("roteiro", d), base: app.tempos.segundosDaEtapa("base", d), efeitos: cursoS.efeitos, montagem: cursoS.montagem };
  add("promessa da linha do tempo", true, `vídeo de ${d.toFixed(0)} s, 3D=${tres}: roteiro ${min(promessa.roteiro)}, base ${min(promessa.base)}, efeitos ${min(promessa.efeitos)}, montagem ${min(promessa.montagem)}; tudo ${min(promessa.roteiro + promessa.base + promessa.efeitos + promessa.montagem)}`);
  add("o que roda no teste pago", true, "envio (put privado + registrarGravacao + despacharPasso transcrever), aprovação (montarTela, até 2 cortes, aprovarRoteiro + despacharPasso cortar), vigília de 20 s até o fim ou o prazo, conferências, custo, folhas de quadros");
  r.fim = agoraIso();
  gravarProgresso(r);
  console.log("");
  console.log(`SIMULAÇÃO de ${estilo} (nada enviado, nada escrito, nenhuma IA):`);
  for (const c of r.conferencias) console.log(`  ${c.ok ? "ok     " : "FALHA  "} ${c.nome}: ${c.motivo}`);
  const falhas = r.conferencias.filter((c) => !c.ok).length;
  console.log("");
  console.log(falhas ? `${falhas} item(ns) impedem o teste pago.` : "Pronto para o teste pago.");
  console.log(`Relatório: ${r.pasta}/relatorio.md`);
}

async function modoTeste(estilo: string) {
  const ve = validarEstilo(estilo);
  if (!ve.ok) throw new Error(`estilo recusado: ${ve.motivo}`);
  const projeto = await projetoDeTeste();
  const s = await saudeDoWorker();
  if (!s.ok) throw new Error(`worker sem saúde: ${s.resumo}`);
  const trecho = prepararTrecho();
  if (trecho.erro) throw new Error(trecho.erro);
  const r = novoRelatorio(estilo, novaPasta(estilo), false);
  r.video.arquivo = trecho.arquivo;
  r.video.duracaoSeg = trecho.duracao;
  evento(r, `teste de ${estilo} no projeto ${PROJETO_DE_TESTE}; worker ${s.resumo}`);
  await escolherEstilo(r, estilo, projeto.userId);
  await enviar(r, projeto.userId, trecho.arquivo, trecho.duracao);
  evento(r, `vídeo ${r.videoJobId}; para retomar: npx tsx scripts/testes-e2e/ponta-a-ponta.mts --acompanhar ${r.videoJobId}`);
  await acompanhar(r, projeto.userId);
  await fechar(r);
  imprimirFim(r);
}

async function modoAcompanhar(id: string) {
  const projeto = await projetoDeTeste();
  const v = await lerVideo(id);
  if (!v) throw new Error(`vídeo ${id} não existe`);
  let r = acharRelatorio(id);
  if (!r) {
    const escolha = await app.noCorte.escolhaDoEditorDoProjeto(PROJETO_DE_TESTE);
    const estilo = escolha.escolhido ?? "desconhecido";
    r = novoRelatorio(estilo, novaPasta(`${estilo}-retomado`), false);
    r.videoJobId = id;
    r.inicio = v.createdAt.toISOString();
    r.estiloNoProjeto = { escolhido: escolha.escolhido, reserva: escolha.reserva, passos: ["retomado sem relatório anterior: estilo lido do projeto"] };
    r.video = { arquivo: "(enviado antes)", duracaoSeg: v.durationSec ?? null, blobUrl: v.blobUrl };
    r.marcos["envio-terminou"] = v.createdAt.toISOString();
    const rot = await app.roteiro.lerRoteiroDoVideo(id).catch(() => null);
    if (rot?.aprovadoEm) r.marcos["roteiro-aprovado"] = rot.aprovadoEm;
  }
  r.veredito = "em andamento";
  r.conferencias = r.conferencias.filter((c) => c.nome.startsWith("nenhuma mídia crua"));
  evento(r, `retomando a vigília do vídeo ${id}`);
  await acompanhar(r, projeto.userId);
  await fechar(r);
  imprimirFim(r);
}

/** Só as conferências, o custo e as folhas de um vídeo do projeto de teste, sem vigília e sem aprovar nada (só leitura). */
async function modoConferir(id: string) {
  await projetoDeTeste();
  const v = await lerVideo(id);
  if (!v) throw new Error(`vídeo ${id} não existe`);
  const escolha = await app.noCorte.escolhaDoEditorDoProjeto(PROJETO_DE_TESTE);
  const anterior = acharRelatorio(id);
  const estilo = anterior?.estilo ?? escolha.escolhido ?? "desconhecido";
  const r = novoRelatorio(estilo, novaPasta(`${estilo}-conferido`), false);
  r.videoJobId = id;
  r.inicio = v.createdAt.toISOString();
  r.estiloNoProjeto = anterior?.estiloNoProjeto ?? { escolhido: escolha.escolhido, reserva: escolha.reserva, passos: ["só conferência: estilo lido do projeto agora"] };
  if (anterior) {
    r.marcos = anterior.marcos;
    r.aprovacao = anterior.aprovacao;
    r.conferencias = anterior.conferencias.filter((c) => c.nome.startsWith("nenhuma mídia crua"));
  }
  r.video = { arquivo: anterior?.video.arquivo ?? "(enviado antes)", duracaoSeg: v.durationSec ?? null, blobUrl: v.blobUrl };
  r.runId = (await lerRun(id))?.id ?? null;
  if (v.status === "ready" && v.finishedAt) r.marcos.fim ??= v.finishedAt.toISOString();
  // A janela do custo vai até o fim do vídeo (ou a última mudança dele), e não até agora.
  const ultima = await prisma.videoJob.findUnique({ where: { id }, select: { updatedAt: true, finishedAt: true } });
  await fechar(r, (ultima?.finishedAt ?? ultima?.updatedAt ?? new Date()).toISOString());
  imprimirFim(r);
}

function imprimirFim(r: Relatorio) {
  console.log("");
  console.log(`VEREDITO: ${r.veredito.toUpperCase()}`);
  for (const c of r.conferencias) console.log(`  ${c.ok ? "ok     " : "REPROVA"} ${c.nome}: ${c.motivo}`);
  if (r.custo) console.log(`Custo de IA: US$ ${r.custo.totalUsd.toFixed(2)} (${Object.entries(r.custo.porFornecedor).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(", ")})`);
  console.log(`Relatório: ${r.pasta}/relatorio.md`);
}

// ─────────────────────────────── a entrada ───────────────────────────────

try {
  if (projetoArg !== null) travar(projetoArg, "--projeto");
  if (limparId !== null) {
    if (!limparId) throw new Error("--limpar precisa do id do vídeo");
    await modoLimpar(limparId);
  } else if (conferirId !== null) {
    if (!conferirId) throw new Error("--conferir precisa do id do vídeo");
    await modoConferir(conferirId);
  } else if (acompanharId !== null) {
    if (!acompanharId) throw new Error("--acompanhar precisa do id do vídeo");
    await modoAcompanhar(acompanharId);
  } else {
    if (!estiloPedido) throw new Error("diga o estilo: --estilo <modelo-xxx | sob-medida-3d | sob-medida-recorte | sob-medida-graficos>");
    if (simular) await modoSimular(estiloPedido);
    else await modoTeste(estiloPedido);
  }
} catch (e) {
  console.error(`ERRO: ${e instanceof Error ? e.message : e}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect().catch(() => {});
}
