import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { opcaoDeFiltro, rodar } from "../ffmpeg.mjs";

/**
 * O EDITOR DOS MODELOS DO CURSO (09/10/2026).
 *
 * Decisão do Bruno depois de comparar os vídeos do curso "Máquina de Edição IA"
 * com os do editor próprio: "a distância é gigantesca". Os 79 modelos do curso
 * viram o editor da Demandou, cada um com o treinamento da própria skill, e o
 * editor antigo (Vox, impacto, sóbrio) fica de reserva.
 *
 * A regra deste arquivo é FIDELIDADE: o vídeo sai pelos MESMOS scripts do curso
 * (worker/modelos/<id>/template/scripts), na MESMA ordem do SKILL.md, num
 * projeto novo por trabalho (a cópia do template, como o passo 1 manda). O que
 * muda é só quem faz os passos que no curso são de uma pessoa olhando:
 *
 *   curso                                   aqui
 *   1  copiar o template, npm install       cópia + node_modules do worker por link
 *   2  preparar.mjs (Whisper)               preparar.mjs --palavras (a Deepgram que o
 *                                           app já fez; o resto do script é o mesmo)
 *   3  escolher tomadas em cortes.json      a proposta do preparar (os trechos sem fala
 *                                           já saem); justar.mjs quando o modelo tem
 *   4  ler medir-1..3.jpg e medir o rosto   medir-rosto.py (Face Landmarker do MediaPipe)
 *      cortar.mjs --rosto-x/-y --queixo-y   cortar.mjs com as três medidas
 *   6/7 mapa editorial e plano.json         o app escreve (o Claude, com a skill inteira)
 *      conferir.mjs --mapa até APROVADO     conferir.mjs, que decide; nunca --forcar
 *      gate de tempo (ferramentas)          timing.mjs / conferir-tempos.mjs quando há
 *   9  render.mjs (-14 LUFS)                render.mjs
 *
 * Este módulo não chama IA: a escrita do plano mora no app, onde a conta de
 * custo de IA vive num lugar só (como o enquadramento e o diretor de sempre).
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
export const PASTA_DOS_MODELOS = process.env.PASTA_DOS_MODELOS ?? join(AQUI, "..", "..", "modelos");
/** Os pacotes do Remotion que os templates usam vêm do worker (mesma versão para todos). */
const NODE_MODULES = join(AQUI, "..", "..", "node_modules");
const PYTHON = process.env.PYTHON_DO_RECORTE ?? "python3";
const MODELO_ROSTO = process.env.MODELO_ROSTO ?? "/app/modelos/face_landmarker.task";
const FFMPEG = process.env.FFMPEG_BIN ?? "ffmpeg";

/** O índice gerado pelo importar.mjs: assinatura, 3D, ferramentas e imagens de cada modelo. */
export function indiceDosModelos() {
  return JSON.parse(readFileSync(join(PASTA_DOS_MODELOS, "indice.json"), "utf8"));
}

export function modeloExiste(id) {
  return typeof id === "string" && /^modelo-[a-z0-9-]+$/.test(id) && existsSync(join(PASTA_DOS_MODELOS, id, "template", "src", "plano.ts"));
}

/**
 * O treinamento do modelo, como o app precisa para escrever o plano: a skill,
 * o formato (plano.md e os tipos de src/plano.ts), como adaptar, o estilo e o
 * exemplo comentado. O plano do exemplo vai sem `palavras` e sem o rastro do
 * rosto, que são dados da gravação do exemplo e só ocupariam contexto.
 */
export function referenciasDoModelo(id) {
  if (!modeloExiste(id)) throw new Error(`modelo desconhecido: ${id}`);
  const r = join(PASTA_DOS_MODELOS, id, "referencias");
  const t = join(PASTA_DOS_MODELOS, id, "template");
  const ler = (...partes) => (existsSync(join(...partes)) ? readFileSync(join(...partes), "utf8") : null);
  let exemploPlano = null;
  const bruto = ler(r, "exemplo", "plano.json");
  if (bruto) {
    try {
      const p = JSON.parse(bruto);
      delete p.palavras;
      if (p.rosto?.rastro) delete p.rosto.rastro;
      exemploPlano = JSON.stringify(p, null, 1);
    } catch {
      exemploPlano = bruto;
    }
  }
  const conhecidos = new Set(["SKILL.md", "plano.md", "adaptar.md", "estilo.md", "imagens.md"]);
  const outros = readdirSync(r)
    .filter((n) => n.endsWith(".md") && !conhecidos.has(n))
    .map((n) => ({ nome: n, texto: readFileSync(join(r, n), "utf8") }));
  return {
    id,
    skill: ler(r, "SKILL.md"),
    plano: ler(r, "plano.md"),
    adaptar: ler(r, "adaptar.md"),
    estilo: ler(r, "estilo.md"),
    imagens: ler(r, "imagens.md"),
    exemploComentado: ler(r, "exemplo", "plano-comentado.md"),
    exemploPlano,
    tipos: ler(t, "src", "plano.ts"),
    modelo: existsSync(join(t, "modelo.json")) ? JSON.parse(readFileSync(join(t, "modelo.json"), "utf8")) : {},
    outros,
  };
}

/** Roda um script do projeto com o Node do worker, no diretório do projeto (os scripts exigem). */
export function rodarNoProjeto(projeto, args, { prazoMs = 20 * 60_000, env = {} } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, args, { cwd: projeto, env: { ...process.env, ...env } });
    let saida = "";
    p.stdout.on("data", (d) => (saida += d));
    p.stderr.on("data", (d) => (saida += d));
    let estourou = false;
    const t = setTimeout(() => {
      estourou = true;
      p.kill("SIGKILL");
    }, prazoMs);
    p.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
    p.on("close", (codigo) => {
      clearTimeout(t);
      resolve({ codigo: estourou ? -1 : codigo, saida: estourou ? `${saida}\n[passou de ${Math.round(prazoMs / 60_000)} min e foi parado]` : saida });
    });
  });
}

function rodarProcesso(bin, args, prazoMs = 5 * 60_000) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args);
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    const t = setTimeout(() => p.kill("SIGKILL"), prazoMs);
    p.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
    p.on("close", (codigo) => {
      clearTimeout(t);
      resolve({ codigo, out, err });
    });
  });
}

/** Falha de um passo do curso: a mensagem leva o fim da saída do script, que é onde o curso explica o erro. */
function falhou(passo, r) {
  const fim = String(r.saida ?? r.err ?? "").trim().split("\n").slice(-15).join("\n");
  return new Error(`${passo} falhou (código ${r.codigo}):\n${fim}`);
}

/**
 * O trecho de um corte como o curso espera a gravação: os pedaços mantidos da
 * fala limpa (relativos a `inicio`, os mesmos da edição gravada no app),
 * emendados na resolução e no enquadramento ORIGINAIS. Sem o punch-in
 * alternado do corte simples (ffmpeg.mjs, prepararTrecho): o enquadramento
 * agora é do cortar.mjs do curso, que mede o rosto e segue a pessoa.
 */
export async function extrairTrecho(original, saida, inicio, duracao, manter) {
  const pedacos = (manter ?? []).filter((m) => m.ate - m.de > 0.05);
  if (pedacos.length <= 1) {
    const de = pedacos[0]?.de ?? 0;
    const ate = pedacos[0]?.ate ?? duracao;
    await rodar([
      "-ss", String(inicio + de), "-i", original, "-t", String(ate - de),
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", saida,
    ]);
    return { pedacos: 1 };
  }
  const partes = [];
  const mapa = [];
  pedacos.forEach((m, i) => {
    partes.push(
      `[0:v]trim=start=${m.de.toFixed(3)}:end=${m.ate.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`,
      `[0:a]atrim=start=${m.de.toFixed(3)}:end=${m.ate.toFixed(3)},asetpts=PTS-STARTPTS[a${i}]`
    );
    mapa.push(`[v${i}][a${i}]`);
  });
  const grafo = `${partes.join(";")};${mapa.join("")}concat=n=${pedacos.length}:v=1:a=1[v][a]`;
  const pasta = dirname(saida);
  const arquivo = join(pasta, `filtro-${basename(saida)}.txt`);
  await writeFile(arquivo, grafo, "utf8");
  await rodar(
    [
      "-ss", String(inicio), "-i", original, "-t", String(duracao),
      opcaoDeFiltro(), basename(arquivo),
      "-map", "[v]", "-map", "[a]",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", saida,
    ],
    { cwd: pasta }
  );
  return { pedacos: pedacos.length };
}

/** Passo 1: o projeto do trabalho, cópia do template com os pacotes do worker. */
export function criarProjeto(id, pasta) {
  if (!modeloExiste(id)) throw new Error(`modelo desconhecido: ${id}`);
  const projeto = join(pasta, "projeto");
  cpSync(join(PASTA_DOS_MODELOS, id, "template"), projeto, { recursive: true });
  // "junction" no Windows (sem privilégio de administrador); no Linux o tipo é ignorado.
  symlinkSync(NODE_MODULES, join(projeto, "node_modules"), "junction");
  for (const d of ["work", "out", "public"]) mkdirSync(join(projeto, d), { recursive: true });
  return projeto;
}

/** Passo 2: análise do vídeo bruto com a transcrição que o app já tem. */
export async function preparar(projeto, video, palavras) {
  const arquivo = join(projeto, "work", "palavras-externas.json");
  writeFileSync(arquivo, JSON.stringify(palavras));
  const r = await rodarNoProjeto(projeto, ["scripts/preparar.mjs", video, "--palavras", arquivo], { prazoMs: 30 * 60_000 });
  if (r.codigo !== 0) throw falhou("preparar.mjs", r);
  return { saida: r.saida, cortes: JSON.parse(readFileSync(join(projeto, "work", "cortes.json"), "utf8")) };
}

/**
 * Passo 3: as tomadas. O curso marca "[sem transcrição: ouça antes de tirar]"
 * nos trechos com volume de voz e nenhuma palavra, e pede para uma pessoa ouvir.
 * Aqui a transcrição é a da Deepgram, que já ouviu a gravação inteira: trecho
 * sem palavra DEPOIS da última fala (o fim da gravação, depois da chamada) sai;
 * no meio do vídeo fica, porque tirar uma palavra curta que a transcrição perdeu
 * é pior que deixar um respiro. Repetição de tomada não é tratada aqui.
 */
export function escolherTomadas(projeto) {
  const arquivo = join(projeto, "work", "cortes.json");
  const cortes = JSON.parse(readFileSync(arquivo, "utf8"));
  let ultimaFala = -1;
  cortes.forEach((c, i) => {
    if (c.texto?.trim()) ultimaFala = i;
  });
  const tirados = [];
  cortes.forEach((c, i) => {
    if (i > ultimaFala && c.manter !== false && !c.texto?.trim()) {
      c.manter = false;
      tirados.push({ de: c.de, ate: c.ate });
    }
  });
  writeFileSync(arquivo, `${JSON.stringify(cortes, null, 2)}\n`);
  return { tirados, mantidos: cortes.filter((c) => c.manter !== false).length };
}

/** Passo 3b: cortes justos nas pausas reais, nos modelos de corte seco que trazem a ferramenta. */
export async function justar(projeto, respiro) {
  if (!existsSync(join(projeto, "ferramentas", "justar.mjs"))) return null;
  const r = await rodarNoProjeto(projeto, ["ferramentas/justar.mjs", ...(respiro ? ["--respiro", String(respiro)] : [])], { prazoMs: 5 * 60_000 });
  if (r.codigo !== 0) throw falhou("justar.mjs", r);
  return r.saida;
}

/**
 * Passo 4a: rosto e queixo no vídeo ORIGINAL, em frações, nos mesmos três
 * instantes do preparar (15%, 50% e 85%). Os quadros saem sem a grade (a grade
 * é para olho humano e só atrapalharia o detector).
 */
export async function medirRosto(projeto, video, duracao) {
  const quadros = [];
  for (const [i, f] of [0.15, 0.5, 0.85].entries()) {
    const saida = join(projeto, "work", `rosto-${i + 1}.jpg`);
    const r = await rodarProcesso(FFMPEG, ["-y", "-v", "error", "-ss", (duracao * f).toFixed(3), "-i", video, "-frames:v", "1", "-q:v", "2", saida]);
    if (r.codigo === 0 && existsSync(saida)) quadros.push(saida);
  }
  if (!quadros.length) throw new Error("não consegui tirar os quadros de medida do vídeo");
  const r = await rodarProcesso(PYTHON, [join(AQUI, "medir-rosto.py"), JSON.stringify({ quadros, modelo_rosto: MODELO_ROSTO })], 3 * 60_000);
  if (r.codigo !== 0) throw new Error(`medir-rosto.py falhou: ${r.err.trim().split("\n").slice(-5).join("\n")}`);
  const medida = JSON.parse(r.out.trim().split("\n").pop());
  if (medida.erro) throw new Error(medida.erro);
  return medida;
}

/** Passo 4b: aplica os cortes, enquadra, segue o rosto e grava o esqueleto do plano. */
export async function cortar(projeto, medida, { recorte } = {}) {
  const args = ["scripts/cortar.mjs", "--rosto-x", String(medida.rostoX), "--rosto-y", String(medida.rostoY), "--queixo-y", String(medida.queixoY)];
  if (recorte) args.push("--recorte", recorte);
  const r = await rodarNoProjeto(projeto, args, { prazoMs: 30 * 60_000 });
  if (r.codigo !== 0) throw falhou("cortar.mjs", r);
  return { saida: r.saida, plano: lerPlano(projeto) };
}

export function lerPlano(projeto) {
  return JSON.parse(readFileSync(join(projeto, "src", "plano.json"), "utf8"));
}

/** O que o curso diz para nunca editar à mão: vem do cortar e não do plano escrito. */
const CAMPOS_DO_MOTOR = ["video", "fps", "largura", "altura", "duracao", "videoAltura", "rosto", "zona", "cortesEm", "palavras", "enquadramentos"];

/**
 * Junta o que o app escreveu (marca, momentos, semLegenda, correções e os
 * campos próprios do modelo) ao esqueleto do cortar. Campo do motor nunca é
 * trocado pelo que veio escrito.
 */
export function gravarPlano(projeto, escrito) {
  const base = lerPlano(projeto);
  const plano = { ...base };
  for (const [k, v] of Object.entries(escrito ?? {})) {
    if (CAMPOS_DO_MOTOR.includes(k)) continue;
    plano[k] = v;
  }
  writeFileSync(join(projeto, "src", "plano.json"), `${JSON.stringify(plano, null, 2)}\n`);
  return plano;
}

/** O resumo do esqueleto que vai ao app: tudo menos o rastro do rosto (milhares de números). */
export function esqueletoParaEscrever(plano) {
  const { rosto, ...resto } = plano;
  return { ...resto, rosto: rosto ? { x: rosto.x, y: rosto.y } : null };
}

/** Passo 7: a conferência do curso. Aprovado só com código 0 e a palavra APROVADO. */
export async function conferir(projeto) {
  const r = await rodarNoProjeto(projeto, ["scripts/conferir.mjs", "--mapa"], { prazoMs: 2 * 60_000 });
  return { aprovado: r.codigo === 0 && /APROVADO\./.test(r.saida), saida: r.saida };
}

/**
 * O gate de tempo dos modelos que trazem um (±0,15 s entre o que entra na tela
 * e a palavra que o nomeia). Modelo sem ferramenta de tempo passa direto.
 */
export async function gateDeTempo(projeto) {
  const resultados = [];
  for (const f of ["timing.mjs", "conferir-tempos.mjs", "conferir-tempo.mjs"]) {
    if (!existsSync(join(projeto, "ferramentas", f))) continue;
    const r = await rodarNoProjeto(projeto, [`ferramentas/${f}`], { prazoMs: 2 * 60_000 });
    resultados.push({ ferramenta: f, ok: r.codigo === 0, saida: r.saida });
  }
  return { ok: resultados.every((x) => x.ok), resultados };
}

/** As linhas de legenda, para o relatório (quebra ruim e palavra solta). */
export async function legendas(projeto) {
  const r = await rodarNoProjeto(projeto, ["scripts/legendas.mjs"], { prazoMs: 2 * 60_000 });
  return r.saida;
}

/** Passo 8: quadros de conferência de cada momento (metade do tamanho), em out/stills. */
export async function stills(projeto, args = ["--momentos"]) {
  const r = await rodarNoProjeto(projeto, ["scripts/stills.mjs", ...args], { prazoMs: 20 * 60_000 });
  if (r.codigo !== 0) throw falhou("stills.mjs", r);
  return r.saida
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.endsWith(".jpg"))
    .map((l) => join(projeto, l));
}

/**
 * O FLUXO INTEIRO de um corte num modelo do curso, na ordem do SKILL.md.
 *
 * `pedido`: { modelo, sourceUrl, inicio, duracao, manter, palavras ([{em, ate, w}]
 * no tempo do corte, a fala limpa), marca {nome, area}, nicho, tetoUsd, voltas }.
 * `pedirPlano(corpo)` chama o app (a IA mora lá) e devolve { mapa, plano,
 * custoUsd, numerosSemLastro }. Volta reprovada leva ao app a saída do
 * conferir.mjs, como o curso manda; o teto de gasto para antes de passar.
 */
export async function editarNoModelo(pedido, pasta, { obterOriginal, pedirPlano, aoPasso = () => {} }) {
  const tempos = {};
  let t = Date.now();
  const marcar = (nome) => {
    tempos[nome] = +((Date.now() - t) / 1000).toFixed(1);
    t = Date.now();
    aoPasso(nome);
  };
  const original = await obterOriginal(pedido.sourceUrl);
  const trecho = join(pasta, "trecho.mp4");
  await extrairTrecho(original, trecho, pedido.inicio ?? 0, pedido.duracao, pedido.manter);
  marcar("trecho");
  const projeto = criarProjeto(pedido.modelo, pasta);
  await preparar(projeto, trecho, pedido.palavras);
  const tomadas = escolherTomadas(projeto);
  await justar(projeto);
  marcar("preparar");
  const analise = JSON.parse(readFileSync(join(projeto, "work", "analise.json"), "utf8"));
  const medida = await medirRosto(projeto, trecho, analise.duracao);
  const corte = await cortar(projeto, medida);
  const avisos = corte.saida.split("\n").filter((l) => /^Aviso/.test(l));
  marcar("cortar");

  const referencias = referenciasDoModelo(pedido.modelo);
  const esqueleto = esqueletoParaEscrever(corte.plano);
  const maxVoltas = Math.max(1, Math.min(4, Number(pedido.voltas) || 3));
  const teto = Number(pedido.tetoUsd) > 0 ? Number(pedido.tetoUsd) : 1;
  let anterior = null;
  let gasto = 0;
  let mapa = "";
  let aprovado = false;
  let volta = 0;
  const historico = [];
  for (; volta < maxVoltas && !aprovado; volta++) {
    if (gasto >= teto) throw new Error(`o teto de US$ ${teto.toFixed(2)} da edição foi atingido antes da volta ${volta + 1} do plano`);
    const escrito = await pedirPlano({ modelo: pedido.modelo, referencias, esqueleto, marca: pedido.marca, nicho: pedido.nicho ?? null, anterior });
    gasto += Number(escrito.custoUsd) || 0;
    mapa = escrito.mapa ?? "";
    writeFileSync(join(projeto, "work", "mapa.md"), mapa);
    gravarPlano(projeto, escrito.plano);
    const conf = await conferir(projeto);
    const tempo = await gateDeTempo(projeto);
    const semLastro = escrito.numerosSemLastro ?? [];
    aprovado = conf.aprovado && tempo.ok && semLastro.length === 0;
    historico.push({ volta: volta + 1, conferir: conf.aprovado, tempo: tempo.ok, semLastro });
    if (!aprovado) {
      anterior = {
        plano: escrito.plano,
        saidas: [conf.saida, ...tempo.resultados.filter((g) => !g.ok).map((g) => `${g.ferramenta}:\n${g.saida}`)],
        numerosSemLastro: semLastro,
      };
    }
  }
  marcar("plano");
  if (!aprovado) {
    const ultima = anterior?.saidas?.[0]?.trim().split("\n").slice(-6).join(" ") ?? "";
    throw new Error(`o plano não passou na conferência do curso em ${maxVoltas} voltas: ${ultima.slice(0, 400)}`);
  }
  const arquivo = await renderizar(projeto, `${pedido.modelo}.mp4`, { prazoMs: Math.max(30, Math.ceil((analise.duracao || 60) / 60) * 25) * 60_000 });
  marcar("render");
  return { arquivo, mapa, voltas: volta, historico, custoUsd: +gasto.toFixed(4), tomadas, avisos, tempos };
}

/** Passo 9: o render do curso, que recusa plano reprovado e normaliza o áudio a -14 LUFS. */
export async function renderizar(projeto, nome = "video-editado.mp4", { prazoMs = 90 * 60_000 } = {}) {
  const saida = join("out", nome);
  const r = await rodarNoProjeto(projeto, ["scripts/render.mjs", saida], { prazoMs });
  if (r.codigo !== 0) throw falhou("render.mjs", r);
  return join(projeto, saida);
}
