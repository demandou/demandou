import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { opcaoDeFiltro, rodar } from "../ffmpeg.mjs";
import { fatiaAtual } from "../capacidade.mjs";
import {
  BLOCO_ALVO_SEG,
  LIMIAR_DOS_BLOCOS_SEG,
  VOLTAS_POR_BLOCO,
  alinharAosQuadros,
  blocosDoPlano,
  caudaDoBloco,
  conferirEmBlocos,
  esqueletoDoBloco,
  instantesDaRevisao,
  juntarPlanos,
  paralelismoDoRender,
  partesDoRender,
  regraGeral,
  textoDaConferencia,
} from "./blocos-do-plano.mjs";
import {
  baixarMaterial,
  conferirMaterialNoPlano,
  imagensSoDoCliente,
  materialNoTemplate,
  materialParaORedator,
  pedidosFixosDoMaterial,
  registrarMaterial,
} from "./material-do-modelo.mjs";

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

/** O formato que o modelo entrega: "16:9" quando o modelo.json diz, senão o vertical ("9:16"). */
export function formatoDoModelo(id) {
  const arquivo = join(PASTA_DOS_MODELOS, id, "template", "modelo.json");
  if (!existsSync(arquivo)) return "9:16";
  try {
    return JSON.parse(readFileSync(arquivo, "utf8")).formato === "16:9" ? "16:9" : "9:16";
  } catch {
    return "9:16";
  }
}

/**
 * O MODELO NO FORMATO PEDIDO (10/10/2026), nos dois sentidos. Os 79 modelos do
 * curso nascem num formato só: 77 verticais e o Aula e o Canal deitados (16:9).
 * Cada um ganha ao lado dele a versão no outro formato, com o mesmo estilo:
 *   - `<id>-16x9`, a VERSÃO DEITADA (a primeira foi a do Manifesto), com a
 *     composição da aula 9 do curso (a pessoa numa moldura à direita, a
 *     explicação à esquerda), para o completo de gravação deitada;
 *   - `<id>-9x16`, a VERSÃO EM PÉ do Aula e do Canal, para os cortes deles.
 * Sem `formato`, ou no formato nativo, o próprio modelo. Quem chega com o id de
 * uma versão volta ao modelo dela antes (o `variante.de` do modelo.json, ou o
 * nome sem o sufixo). A versão vale só se existe no disco e o modelo.json dela
 * diz o formato pedido; pedido de um formato que o modelo ainda não tem falha
 * com a mensagem, em vez de entregar o outro formato no lugar.
 */
export function modeloNoFormato(id, formato) {
  if (!formato) return id;
  if (formato !== "16:9" && formato !== "9:16") throw new Error(`formato desconhecido: ${formato}`);
  const base = modeloDeBase(id);
  if (modeloExiste(base) && formatoDoModelo(base) === formato) return base;
  const variante = `${base}-${formato.replace(":", "x")}`;
  if (modeloExiste(variante) && formatoDoModelo(variante) === formato) return variante;
  if (modeloExiste(id) && formatoDoModelo(id) === formato) return id;
  throw new Error(`o modelo ${base} ainda não tem a versão ${formato === "16:9" ? "deitada (16:9)" : "em pé (9:16)"}`);
}

/** O modelo de uma versão (`<id>-16x9`, `<id>-9x16`): o `variante.de` do modelo.json, ou o nome sem o sufixo. O id de um modelo volta como veio. */
export function modeloDeBase(id) {
  const sufixo = typeof id === "string" ? id.match(/-(16x9|9x16)$/) : null;
  if (!sufixo) return id;
  try {
    const de = JSON.parse(readFileSync(join(PASTA_DOS_MODELOS, id, "template", "modelo.json"), "utf8")).variante?.de;
    if (typeof de === "string" && modeloExiste(de)) return de;
  } catch {
    // sem modelo.json legível, o nome diz
  }
  return id.slice(0, -sufixo[0].length);
}

/**
 * O quadro do arquivo, como ele aparece (largura e altura depois da rotação
 * gravada pelo celular); null sem leitura. O trecho que o worker extrai já sai
 * girado, mas a conta da rotação vale também para a gravação original.
 */
export function quadroDoArquivo(arquivo) {
  try {
    const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:stream_tags=rotate:stream_side_data=rotation", "-of", "json", arquivo], { encoding: "utf8" });
    const s = JSON.parse(r.stdout).streams?.[0];
    const largura = Number(s?.width);
    const altura = Number(s?.height);
    if (!(largura > 0 && altura > 0)) return null;
    const giro = Math.abs(Number(s?.tags?.rotate ?? s?.side_data_list?.find((d) => d.rotation != null)?.rotation ?? 0)) % 180;
    return giro === 90 ? { largura: altura, altura: largura } : { largura, altura };
  } catch {
    return null;
  }
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
  // A folha de quadros do exemplo (um quadro de cada momento), em base64: o
  // adaptar.md do curso manda olhar antes do mapa.
  const arquivoDosQuadros = join(r, "exemplo", "quadros.jpg");
  const quadros = existsSync(arquivoDosQuadros) ? readFileSync(arquivoDosQuadros).toString("base64") : null;
  return {
    id,
    quadros,
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
export async function extrairTrecho(original, saida, inicio, duracao, manter, { fps = null } = {}) {
  const pedacos = (manter ?? []).filter((m) => m.ate - m.de > (fps ? 0.5 / fps : 0.05));
  // NA GRADE DE QUADROS (10/10, prova do completo): com `fps` (os pedaços já na grade,
  // alinharAosQuadros), o vídeo e o áudio são emendados em dois concat separados. O concat de
  // vídeo e áudio juntos esticava cada pedaço uns milissegundos (0,6 s em 74 pedaços) e a fala
  // saía atrás das palavras; separados, o áudio sai com a soma exata dos pedaços e o vídeo com os
  // quadros exatos (cada borda um quarto de quadro antes, longe do arredondamento do trim). Se a
  // conta de quadros não bater (gravação que perdeu quadro), refaz pelo concat junto, que
  // ressincroniza a cada pedaço.
  if (fps && pedacos.length > 1) {
    const quarto = 0.25 / fps;
    const esperados = pedacos.reduce((s, m) => s + Math.round((m.ate - m.de) * fps), 0);
    const video = pedacos.map((m, i) => `[0:v]trim=start=${Math.max(0, m.de - quarto).toFixed(6)}:end=${(m.ate - quarto).toFixed(6)},setpts=PTS-STARTPTS[v${i}]`);
    const audio = pedacos.map((m, i) => `[0:a]atrim=start=${m.de.toFixed(6)}:end=${m.ate.toFixed(6)},asetpts=PTS-STARTPTS[a${i}]`);
    const grafo =
      `${video.join(";")};${pedacos.map((_, i) => `[v${i}]`).join("")}concat=n=${pedacos.length}:v=1:a=0[v];` +
      `${audio.join(";")};${pedacos.map((_, i) => `[a${i}]`).join("")}concat=n=${pedacos.length}:v=0:a=1[a]`;
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
    const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", saida], { encoding: "utf8" });
    const quadros = Number(String(r.stdout).trim());
    if (quadros === esperados) return { pedacos: pedacos.length, naGrade: true, quadros };
    console.warn(`[modelo] o trecho na grade saiu com ${quadros} quadros (esperados ${esperados}); refazendo pelo concat junto`);
  }
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

/**
 * Os quadros por segundo da gravação, quando são constantes (r_frame_rate igual
 * ao avg_frame_rate); null em gravação de quadros variáveis ou sem leitura.
 */
export function fpsConstante(arquivo) {
  try {
    const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate,avg_frame_rate", "-of", "json", arquivo], { encoding: "utf8" });
    const s = JSON.parse(r.stdout).streams?.[0];
    const valor = (f) => {
      const [a, b] = String(f ?? "").split("/").map(Number);
      return a > 0 && b > 0 ? a / b : null;
    };
    const real = valor(s?.r_frame_rate);
    const media = valor(s?.avg_frame_rate);
    return real && media && Math.abs(real - media) / real < 0.002 ? real : null;
  } catch {
    return null;
  }
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
const CAMPOS_DO_MOTOR = ["video", "fps", "largura", "altura", "duracao", "videoAltura", "rosto", "zona", "cortesEm", "palavras", "enquadramentos", "imagens"];

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
 * no tempo do corte, a fala limpa), marca {nome, area}, nicho, tetoUsd, voltas,
 * formato, formatoPelaGravacao }. `formato` ("16:9" ou "9:16", opcional) pede a
 * versão do modelo naquele formato (`modeloNoFormato`); sem ele, o fluxo é o de
 * sempre, no formato do modelo. `formatoPelaGravacao` (o completo, 10/10): o
 * trecho extraído é medido e, se a gravação for do outro formato (em pé num
 * pedido 16:9, deitada num 9:16), vale a versão do formato dela; sem essa
 * versão, falha e a reserva entra.
 * `pedirPlano(corpo)` chama o app (a IA mora lá) e devolve { mapa, plano,
 * custoUsd, numerosSemLastro }. Volta reprovada leva ao app a saída do
 * conferir.mjs, como o curso manda; o teto de gasto para antes de passar.
 * `pedido.material` (10/10, material-do-modelo.mjs): as fotos do cliente nos
 * modelos que pedem material; `obterMaterial(url, destino)` baixa cada uma.
 */
export async function editarNoModelo(pedido, pasta, { obterOriginal, pedirPlano, aoPasso = () => {}, obterTrilha = null, obterMaterial = null }) {
  // a versão no formato pedido (sem `formato`, o próprio modelo): falha antes de baixar nada
  let modelo = modeloNoFormato(pedido.modelo, pedido.formato);
  const tempos = {};
  let t = Date.now();
  const marcar = (nome) => {
    tempos[nome] = +((Date.now() - t) / 1000).toFixed(1);
    t = Date.now();
    aoPasso(nome);
  };
  const original = await obterOriginal(pedido.sourceUrl);
  const trecho = join(pasta, "trecho.mp4");
  // Os pedaços na grade de quadros da gravação e as palavras na linha do tempo do trecho
  // (alinharAosQuadros, 10/10): sem isso, no completo a fala andava até 1 s à frente das palavras.
  const alinhado = alinharAosQuadros(pedido.manter, pedido.palavras, fpsConstante(original), pedido.inicio ?? 0);
  await extrairTrecho(original, trecho, pedido.inicio ?? 0, pedido.duracao, alinhado.manter, { fps: alinhado.fps });
  marcar("trecho");
  // O COMPLETO NO FORMATO DA GRAVAÇÃO (10/10): em pé sai no 9:16 do modelo, deitada no 16:9. O
  // app escolhe pela medida do quadro que ele tem; aqui a gravação é medida de novo, e quando ela
  // é do outro formato vale a versão dele (sem a versão, falha aqui e a reserva entra).
  if (pedido.formatoPelaGravacao && pedido.formato) {
    const q = quadroDoArquivo(trecho);
    const daGravacao = q ? (q.altura > q.largura ? "9:16" : "16:9") : null;
    if (daGravacao && daGravacao !== formatoDoModelo(modelo)) {
      const pedida = modelo;
      modelo = modeloNoFormato(pedido.modelo, daGravacao);
      aoPasso(`a gravação é ${daGravacao === "9:16" ? "em pé" : "deitada"} (${q.largura}x${q.altura}): ${pedida} trocado por ${modelo}`);
    }
  }
  const projeto = criarProjeto(modelo, pasta);
  // AS CORES DA MARCA (10/10, regra do Bruno): o estilo é do modelo, a cor é da marca.
  if (pedido.cores?.destaque) {
    const { aplicarCoresDaMarca } = await import("./cores-da-marca.mjs");
    const c = aplicarCoresDaMarca(projeto, pedido.cores);
    if (c.erro) console.warn(`[modelo] as cores da marca não entraram: ${c.erro}`);
  }
  // O MATERIAL DO CLIENTE (10/10, material-do-modelo.mjs): cada foto na pasta onde o template
  // espera, em JPG e medida, antes do preparar (falha cedo, antes do que é caro). Modelo que pede
  // material e veio sem ele falha aqui: nunca se inventa tela do produto do cliente.
  const regraDoMaterial = materialNoTemplate(pedido.modelo);
  let material = null;
  if (regraDoMaterial?.pasta) {
    material = await baixarMaterial(projeto, pedido.modelo, pedido.material, { baixar: obterMaterial });
    marcar("material");
  }
  await preparar(projeto, trecho, alinhado.palavras);
  const tomadas = escolherTomadas(projeto);
  await justar(projeto);
  marcar("preparar");
  const analise = JSON.parse(readFileSync(join(projeto, "work", "analise.json"), "utf8"));
  // A versão deitada só serve à gravação deitada (10/10): gravação em pé no
  // modelo 16:9 sairia recortada; falha aqui e o editor de antes entra.
  if (formatoDoModelo(modelo) === "16:9" && Number(analise.altura) > Number(analise.largura)) {
    throw new Error(`a gravação é em pé (${analise.largura}x${analise.altura}); a versão deitada do modelo não serve`);
  }
  const medida = await medirRosto(projeto, trecho, analise.duracao);
  const corte = await cortar(projeto, medida);
  const avisos = corte.saida.split("\n").filter((l) => /^Aviso/.test(l));
  marcar("cortar");

  const referencias = referenciasDoModelo(modelo);
  const maxVoltas = Math.max(1, Math.min(4, Number(pedido.voltas) || 3));
  const teto = Number(pedido.tetoUsd) > 0 ? Number(pedido.tetoUsd) : 1;
  let gasto = 0;
  const somar = (r) => {
    gasto += Number(r?.custoUsd) || 0;
    return r;
  };
  const comum = { modelo, referencias, nicho: pedido.nicho ?? null };
  // O material como vai ao redator do mapa e do plano (só os pedidos de escrita o levam; a escolha
  // das imagens e a revisão dos quadros não precisam dele).
  let paraORedator = materialParaORedator(pedido.modelo, material);
  const comMaterial = () => (paraORedator ? { material: paraORedator } : {});

  // O VÍDEO LONGO (10/10, o completo no modelo): o plano em blocos de ~150 s,
  // a conferência do plano inteiro com o conserto só dos blocos reprovados e a
  // revisão do passo 8 bloco a bloco (blocos-do-plano.mjs). Corte curto segue
  // o fluxo de sempre, numa chamada.
  const duracaoCortada = Number(lerPlano(projeto).duracao) || analise.duracao || 0;
  const emBlocos = pedido.blocos === true || (pedido.blocos !== false && duracaoCortada > LIMIAR_DOS_BLOCOS_SEG);
  if (emBlocos) {
    if (referencias.imagens) throw new Error(`o plano em blocos ainda não faz o passo das imagens (${modelo})`);
    const r = await planoEmBlocos(projeto, { comum: { ...comum, ...comMaterial() }, pedido, pedir: (c) => pedirPlano(c).then(somar), gasto: () => gasto, teto, aoPasso });
    marcar("plano");
    const render = await renderizarEmPartes(projeto, `${modelo}.mp4`, { prazoMs: Math.max(30, Math.ceil(duracaoCortada / 60) * 25) * 60_000 });
    marcar("render");
    const arquivo = await comTrilha(render.arquivo, { pedido, pasta, modelo, obterTrilha, avisos, marcar });
    return {
      arquivo,
      modelo,
      formato: formatoDoModelo(modelo),
      mapa: r.mapa,
      voltas: r.voltas,
      historico: r.historico,
      revisao: r.revisao,
      blocos: r.blocos,
      render: render.resumo,
      creditos: null,
      custoUsd: +gasto.toFixed(4),
      tomadas,
      avisos,
      tempos,
    };
  }

  // PASSO 6b, nos modelos com imagem (references/imagens.md): mapa, pedidos,
  // busca, folha numerada, escolha olhando a folha.
  let mapaDasImagens = null;
  let creditos = null;
  if (referencias.imagens) {
    // A Transformação entra aqui com as fotos do cliente (os dois pedidos e o --offline do passo 6b dela).
    const r = await passoDasImagens(projeto, { ...comum, ...comMaterial(), esqueleto: esqueletoParaEscrever(lerPlano(projeto)) }, (c) => pedirPlano(c).then(somar), {
      fixos: pedidosFixosDoMaterial(pedido.modelo, material),
      offline: imagensSoDoCliente(pedido.modelo),
    });
    mapaDasImagens = r.mapa;
    creditos = r.creditos;
    marcar("imagens");
  }
  // Os prints do cliente no Etapas e no Guia: o capturar.mjs do curso registra em plano.imagens,
  // DEPOIS do passo das imagens (o imagens.mjs refaz plano.imagens inteiro a cada escolha).
  if (material && regraDoMaterial?.registro === "capturar") {
    material = await registrarMaterial(projeto, pedido.modelo, material, rodarNoProjeto);
    paraORedator = materialParaORedator(pedido.modelo, material);
  }

  // PASSO 7: o plano, até o conferir.mjs, o gate de tempo e a guarda de número aprovarem.
  const esqueleto = esqueletoParaEscrever(lerPlano(projeto));
  const escrever = (anterior) => pedirPlano({ ...comum, ...comMaterial(), esqueleto, marca: pedido.marca, anterior, mapa: mapaDasImagens }).then(somar);
  const conferirTudo = async (escrito) => {
    const conf = await conferir(projeto);
    const tempo = await gateDeTempo(projeto);
    const semLastro = escrito.numerosSemLastro ?? [];
    // O plano só cita o material que existe e usa o do cliente (a regra "usar só esses", 10/10).
    const doMaterial = material ? conferirMaterialNoPlano(pedido.modelo, escrito.plano, material, lerPlano(projeto).imagens) : [];
    return {
      aprovado: conf.aprovado && tempo.ok && semLastro.length === 0 && doMaterial.length === 0,
      registro: { conferir: conf.aprovado, tempo: tempo.ok, semLastro, ...(material ? { material: doMaterial } : {}) },
      anterior: {
        plano: escrito.plano,
        saidas: [conf.saida, ...tempo.resultados.filter((g) => !g.ok).map((g) => `${g.ferramenta}:\n${g.saida}`), ...(doMaterial.length ? [doMaterial.join("\n")] : [])],
        numerosSemLastro: semLastro,
      },
    };
  };
  let anterior = null;
  let mapa = mapaDasImagens ?? "";
  let aprovado = false;
  let planoAprovado = null;
  let volta = 0;
  const historico = [];
  for (; volta < maxVoltas && !aprovado; volta++) {
    if (gasto >= teto) throw new Error(`o teto de US$ ${teto.toFixed(2)} da edição foi atingido antes da volta ${volta + 1} do plano`);
    const escrito = await escrever(anterior);
    mapa = escrito.mapa || mapa;
    writeFileSync(join(projeto, "work", "mapa.md"), mapa);
    gravarPlano(projeto, escrito.plano);
    const c = await conferirTudo(escrito);
    aprovado = c.aprovado;
    historico.push({ volta: volta + 1, ...c.registro });
    if (aprovado) planoAprovado = escrito.plano;
    else anterior = c.anterior;
  }
  marcar("plano");
  if (!aprovado) {
    const ultima = anterior?.saidas?.[0]?.trim().split("\n").slice(-6).join(" ") ?? "";
    throw new Error(`o plano não passou na conferência do curso em ${maxVoltas} voltas: ${ultima.slice(0, 400)}`);
  }

  // PASSO 8: olhar os quadros de cada momento (texto inteiro, número batendo
  // com a fala, rosto livre, janela com a cabeça, a tela mudando) e corrigir
  // SÓ o momento com defeito (skill bônus de revisão: por intervalo, sem
  // refazer tudo). Uma rodada de olhar e até duas de consertar: o conserto
  // reprovado volta ao Claude com a saída do conferir.mjs, como o curso manda
  // ("até APROVADO"). Na prova do Viral (09/10) uma tentativa só reprovou e os
  // nove defeitos vistos ficaram no vídeo. Se as duas reprovarem, vale o plano
  // aprovado. Falha da revisão não segura o vídeo.
  const revisao = { rodadas: 0, problemas: [], aplicada: false, tentativas: 0 };
  if (pedido.revisar !== false && gasto < teto) {
    try {
      const quadros = await stills(projeto);
      const folhas = await folhasDosQuadros(projeto, quadros);
      if (folhas.length) {
        const rev = await pedirPlano({ ...comum, fase: "revisar", plano: planoAprovado, folhas: folhas.map((f) => f.base64), legendas: folhas.map((f) => f.legenda) }).then(somar);
        revisao.rodadas = 1;
        revisao.problemas = rev.problemas ?? [];
        if (revisao.problemas.length && gasto < teto) {
          const texto = revisao.problemas.map((p, i) => `${i + 1}. ${p.em != null ? `em ${Number(p.em).toFixed(1)} s` : ""} (${p.momento ?? "?"}): ${p.problema}${p.mudanca ? `. Mudança: ${p.mudanca}` : ""}`).join("\n");
          const pedidoDaRevisao = `REVISÃO DOS QUADROS (passo 8 do SKILL.md, olhando cada momento renderizado). Conserte SÓ estes momentos e mantenha todo o resto exatamente como está:\n${texto}`;
          let paraConsertar = { plano: planoAprovado, saidas: [pedidoDaRevisao], numerosSemLastro: [] };
          for (let tentativa = 1; tentativa <= 2 && !revisao.aplicada && gasto < teto; tentativa++) {
            revisao.tentativas = tentativa;
            const escrito = await escrever(paraConsertar);
            gravarPlano(projeto, escrito.plano);
            const c = await conferirTudo(escrito);
            historico.push({ volta: `revisao-${tentativa}`, ...c.registro, saida: c.aprovado ? undefined : c.anterior.saidas.join("\n").slice(-1500) });
            if (c.aprovado) {
              revisao.aplicada = true;
              mapa = escrito.mapa || mapa;
            } else {
              paraConsertar = {
                plano: escrito.plano,
                saidas: [pedidoDaRevisao, "O CONSERTO ACIMA FOI CONFERIDO E REPROVOU. Mantenha os consertos da revisão e corrija só o que a conferência apontou:", ...c.anterior.saidas],
                numerosSemLastro: c.anterior.numerosSemLastro,
              };
            }
          }
          if (!revisao.aplicada) gravarPlano(projeto, planoAprovado);
        }
      }
    } catch (e) {
      gravarPlano(projeto, planoAprovado);
      revisao.erro = e instanceof Error ? e.message.slice(0, 300) : String(e);
    }
    marcar("revisao");
  }

  // Vídeo longo que não veio em blocos (pedido.blocos false) ainda sai em partes.
  const emPartes = pedido.partes === true || duracaoCortada > LIMIAR_DOS_BLOCOS_SEG;
  const prazoDoRender = Math.max(30, Math.ceil((analise.duracao || 60) / 60) * 25) * 60_000;
  let arquivo = emPartes ? (await renderizarEmPartes(projeto, `${modelo}.mp4`, { prazoMs: prazoDoRender })).arquivo : await renderizar(projeto, `${modelo}.mp4`, { prazoMs: prazoDoRender });
  marcar("render");
  arquivo = await comTrilha(arquivo, { pedido, pasta, modelo, obterTrilha, avisos, marcar });
  return { arquivo, modelo, formato: formatoDoModelo(modelo), mapa, voltas: volta, historico, revisao, creditos, custoUsd: +gasto.toFixed(4), tomadas, avisos, tempos };
}

/**
 * A TRILHA DO PROJETO (10/10, Bruno: "sumiu a parte de escolher a música"): o
 * modelo renderiza a voz e os sons dele; a música escolhida entra por baixo,
 * do mesmo jeito do editor de antes (sons.mjs, misturarAudio: no volume do
 * estilo, abaixando sob a voz, com fade, em laço). Falhou, o vídeo sai sem
 * ela, nunca deixa de sair.
 */
async function comTrilha(arquivo, { pedido, pasta, modelo, obterTrilha, avisos, marcar }) {
  if (!pedido.trilha?.url || !obterTrilha) return arquivo;
  let saida = arquivo;
  try {
    const ext = String(pedido.trilha.url).match(/\.[a-z0-9]{2,4}(?=\?|$)/i)?.[0] ?? ".mp3";
    const trilha = await obterTrilha(pedido.trilha.url, join(pasta, `trilha${ext}`));
    const { misturarAudio } = await import("../sons.mjs");
    const duracao = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arquivo], { encoding: "utf8" }).stdout.trim());
    if (duracao > 0) {
      saida = await misturarAudio(arquivo, { trilha: { arquivo: trilha, volume: pedido.trilha.volume, abaixar: pedido.trilha.abaixar } }, duracao, pasta, join(pasta, `${modelo}-com-trilha.mp4`));
    }
  } catch (e) {
    avisos.push(`a trilha não entrou: ${e instanceof Error ? e.message.slice(0, 160) : e}`);
  }
  marcar("trilha");
  return saida;
}

/** Os tipos de momento do modelo, lidos do src/plano.ts do projeto (a mesma conta do conferir.mjs). */
function tiposDoProjeto(projeto) {
  const arquivo = join(projeto, "src", "plano.ts");
  if (!existsSync(arquivo)) return null;
  const achados = [...readFileSync(arquivo, "utf8").matchAll(/tipo\s*:\s*"([a-zA-Z0-9_-]+)"/g)].map((m) => m[1]);
  return achados.length ? new Set(achados) : null;
}

/** `n` de cada vez, na ordem. */
async function emPiscina(itens, n, fn) {
  let proximo = 0;
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(n, itens.length)) }, async () => {
      while (proximo < itens.length) {
        const k = proximo++;
        await fn(itens[k], k);
      }
    })
  );
}

/** Blocos escritos em paralelo (o conserto e a revisão); a escrita em ordem é uma a uma. */
const BLOCOS_JUNTOS = Number(process.env.EDITOR_DO_CURSO_BLOCOS_JUNTOS) || 3;

/**
 * O PLANO EM BLOCOS (10/10, o completo no modelo do curso; blocos-do-plano.mjs).
 *
 *  1. Escrita, em ordem: cada bloco (~150 s, cortado na pausa) é um pedido ao
 *     redator do app (o treinamento inteiro no cache), com a fala e o tempo do
 *     bloco, e o FIM do bloco anterior (últimos momentos, mapa e tipos usados)
 *     para a continuidade.
 *  2. Conferência: os blocos juntos no plano.json e o conferir.mjs do curso no
 *     plano INTEIRO (o mesmo do render.mjs), o gate de tempo e a guarda de
 *     número. Reprovado, só os blocos com defeito voltam ao redator, com a
 *     saída da conferência no tempo deles (até VOLTAS_POR_BLOCO por bloco).
 *  3. Revisão (passo 8): os quadros de conferência de todos os momentos num
 *     render de quadros só; cada bloco é olhado nas folhas dele e o que tem
 *     defeito é consertado (até 2 tentativas, aceitas só sem erro novo na
 *     conferência do bloco). O plano consertado passa de novo na conferência
 *     do plano inteiro; se reprovar, vale o plano aprovado.
 * Teto de gasto: a escrita que passa do teto falha (a reserva entra); conserto
 * e revisão só acontecem dentro dele.
 */
async function planoEmBlocos(projeto, { comum, pedido, pedir, gasto, teto, aoPasso }) {
  const esqueleto = esqueletoParaEscrever(lerPlano(projeto));
  const blocos = blocosDoPlano(esqueleto.palavras, esqueleto.duracao, Number(pedido.blocoSeg) || BLOCO_ALVO_SEG);
  const total = blocos.length;
  const modeloJson = existsSync(join(projeto, "modelo.json")) ? JSON.parse(readFileSync(join(projeto, "modelo.json"), "utf8")) : {};
  const tipos = tiposDoProjeto(projeto);
  const { conferirPlano } = await import(pathToFileURL(join(projeto, "scripts", "conferir.mjs")).href);
  const escritos = new Array(total).fill(null);
  const escreverBloco = async (b, anterior) => {
    const ant = b.indice > 0 ? escritos[b.indice - 1] : null;
    const r = await pedir({
      ...comum,
      esqueleto: esqueletoDoBloco(esqueleto, b),
      marca: pedido.marca,
      anterior,
      bloco: { indice: b.indice, total, inicio: b.inicio, fim: b.fim, cauda: ant ? caudaDoBloco(ant.plano, ant.mapa) : null },
    });
    if (!r?.plano || !Array.isArray(r.plano.momentos)) throw new Error(`o bloco ${b.indice + 1} voltou sem plano`);
    return { plano: r.plano, mapa: String(r.mapa ?? ""), semLastro: r.numerosSemLastro ?? [] };
  };
  const conferirOBloco = (planoDoBloco, b) => {
    const sub = { ...esqueletoDoBloco(lerPlano(projeto), b), momentos: planoDoBloco?.momentos ?? [] };
    return conferirPlano(sub, modeloJson, tipos);
  };
  const juntarEGravar = () => gravarPlano(projeto, juntarPlanos(blocos, escritos.map((e) => e?.plano ?? null)));
  const mapaInteiro = () =>
    escritos
      .map((e, k) => `## Trecho ${k + 1} de ${total} (${blocos[k].inicio.toFixed(1)} a ${blocos[k].fim.toFixed(1)} s do vídeo; tempos do trecho)\n\n${e?.mapa ?? ""}`)
      .join("\n\n");

  // 1. A escrita, um bloco depois do outro (cada um lê o fim do anterior).
  for (const b of blocos) {
    if (gasto() >= teto) throw new Error(`o teto de US$ ${teto.toFixed(2)} da edição foi atingido antes do bloco ${b.indice + 1} de ${total}`);
    escritos[b.indice] = await escreverBloco(b, null);
    aoPasso(`plano: bloco ${b.indice + 1} de ${total} escrito (US$ ${gasto().toFixed(3)})`);
  }

  // 2. A conferência do plano inteiro; o conserto vai só aos blocos reprovados.
  const historico = [];
  const consertos = new Array(total).fill(0);
  let aprovado = false;
  let ultimaSaida = "";
  for (let rodada = 1; ; rodada++) {
    juntarEGravar();
    const conf = await conferir(projeto);
    const tempo = await gateDeTempo(projeto);
    const cb = conferirEmBlocos({ plano: lerPlano(projeto), blocos, conferirPlano, modelo: modeloJson, tipos });
    const semLastro = escritos.flatMap((e) => e.semLastro);
    const falhos = blocos
      .map((b) => b.indice)
      .filter((i) => (!conf.aprovado && cb.porBloco[i].erros.length) || escritos[i].semLastro.length || !tempo.ok);
    historico.push({ volta: rodada, conferir: conf.aprovado, tempo: tempo.ok, semLastro, blocos: falhos.map((i) => i + 1) });
    ultimaSaida = conf.saida;
    if (conf.aprovado && tempo.ok && !semLastro.length) {
      aprovado = true;
      break;
    }
    const consertar = falhos.filter((i) => consertos[i] < VOLTAS_POR_BLOCO);
    if (!consertar.length || gasto() >= teto) break;
    await emPiscina(consertar, BLOCOS_JUNTOS, async (i) => {
      if (gasto() >= teto) return;
      consertos[i]++;
      const pb = cb.porBloco[i];
      const saidas = [];
      if (!conf.aprovado && pb.erros.length) saidas.push(textoDaConferencia(pb.erros, pb.avisos));
      if (!tempo.ok) saidas.push(...tempo.resultados.filter((g) => !g.ok).map((g) => `${g.ferramenta}:\n${g.saida}`));
      escritos[i] = await escreverBloco(blocos[i], { plano: escritos[i].plano, saidas, numerosSemLastro: escritos[i].semLastro });
    });
    aoPasso(`plano: conserto ${rodada} dos blocos ${consertar.map((i) => i + 1).join(", ")} (US$ ${gasto().toFixed(3)})`);
  }
  if (!aprovado) {
    const fim = ultimaSaida.trim().split("\n").slice(-6).join(" ");
    throw new Error(`o plano em blocos não passou na conferência do curso: ${fim.slice(0, 400)}`);
  }
  writeFileSync(join(projeto, "work", "mapa.md"), mapaInteiro());

  // 3. A revisão dos quadros (passo 8), bloco a bloco.
  const aprovados = escritos.map((e) => ({ ...e }));
  const revisao = { rodadas: 0, problemas: [], aplicada: false, tentativas: 0, blocos: [] };
  if (pedido.revisar !== false && gasto() < teto) {
    try {
      rmSync(join(projeto, "out", "stills"), { recursive: true, force: true });
      const quadros = await stills(projeto, instantesDaRevisao(lerPlano(projeto)).map(String));
      const tempoDoQuadro = (q) => Number(basename(q).match(/t(\d+\.\d+)/)?.[1] ?? NaN);
      const problemas = new Array(total).fill(null);
      await emPiscina(blocos, BLOCOS_JUNTOS, async (b) => {
        const meus = quadros.filter((q) => tempoDoQuadro(q) >= b.inicio && tempoDoQuadro(q) < b.fim);
        if (!meus.length || gasto() >= teto) return;
        const folhas = await folhasDosQuadros(projeto, meus, { deslocamento: b.inicio, prefixo: `bloco-${b.indice + 1}-` });
        if (!folhas.length) return;
        const rev = await pedir({
          ...comum,
          fase: "revisar",
          plano: escritos[b.indice].plano,
          folhas: folhas.map((f) => f.base64),
          legendas: folhas.map((f) => f.legenda),
          bloco: { indice: b.indice, total, inicio: b.inicio, fim: b.fim },
        });
        problemas[b.indice] = Array.isArray(rev?.problemas) ? rev.problemas : [];
      });
      revisao.rodadas = 1;
      revisao.problemas = problemas.flatMap((ps, i) => (ps ?? []).map((p) => ({ ...p, bloco: i + 1, em: p.em != null ? +(Number(p.em) + blocos[i].inicio).toFixed(2) : p.em })));
      const comProblema = blocos.filter((b) => problemas[b.indice]?.length);
      const aplicados = [];
      await emPiscina(comProblema, BLOCOS_JUNTOS, async (b) => {
        const i = b.indice;
        const antes = conferirOBloco(aprovados[i].plano, b);
        const regrasAntes = new Set(antes.erros.map(regraGeral).filter(Boolean));
        const texto = problemas[i].map((p, k) => `${k + 1}. ${p.em != null ? `em ${Number(p.em).toFixed(1)} s` : ""} (${p.momento ?? "?"}): ${p.problema}${p.mudanca ? `. Mudança: ${p.mudanca}` : ""}`).join("\n");
        const pedidoDaRevisao = `REVISÃO DOS QUADROS (passo 8 do SKILL.md, olhando cada momento renderizado deste trecho). Conserte SÓ estes momentos e mantenha todo o resto exatamente como está:\n${texto}`;
        let paraConsertar = { plano: aprovados[i].plano, saidas: [pedidoDaRevisao], numerosSemLastro: [] };
        for (let tentativa = 1; tentativa <= 2 && gasto() < teto; tentativa++) {
          revisao.tentativas = Math.max(revisao.tentativas, tentativa);
          const novo = await escreverBloco(b, paraConsertar);
          const depois = conferirOBloco(novo.plano, b);
          const novos = depois.erros.filter((e) => {
            const g = regraGeral(e);
            return !g || !regrasAntes.has(g);
          });
          if (!novos.length && !novo.semLastro.length) {
            escritos[i] = novo;
            aplicados.push(i + 1);
            return;
          }
          paraConsertar = {
            plano: novo.plano,
            saidas: [pedidoDaRevisao, "O CONSERTO ACIMA FOI CONFERIDO E REPROVOU. Mantenha os consertos da revisão e corrija só o que a conferência apontou:", textoDaConferencia(novos.length ? novos : depois.erros, depois.avisos)],
            numerosSemLastro: novo.semLastro,
          };
        }
      });
      if (aplicados.length) {
        juntarEGravar();
        const conf = await conferir(projeto);
        const tempo = await gateDeTempo(projeto);
        historico.push({ volta: "revisao", conferir: conf.aprovado, tempo: tempo.ok, semLastro: [], blocos: aplicados });
        if (conf.aprovado && tempo.ok) {
          revisao.aplicada = true;
          revisao.blocos = aplicados;
        } else {
          for (let k = 0; k < total; k++) escritos[k] = aprovados[k];
          juntarEGravar();
          revisao.erro = "o plano consertado pela revisão reprovou na conferência do plano inteiro; vale o aprovado";
        }
      }
    } catch (e) {
      for (let k = 0; k < total; k++) escritos[k] = aprovados[k];
      juntarEGravar();
      revisao.erro = e instanceof Error ? e.message.slice(0, 300) : String(e);
    }
    aoPasso(`revisão: ${revisao.problemas.length} defeito(s) apontado(s), ${revisao.blocos.length} bloco(s) consertado(s) (US$ ${gasto().toFixed(3)})`);
  }
  writeFileSync(join(projeto, "work", "mapa.md"), mapaInteiro());
  return {
    mapa: mapaInteiro(),
    voltas: historico.length,
    historico,
    revisao,
    blocos: blocos.map((b) => ({ indice: b.indice + 1, inicio: b.inicio, fim: b.fim, momentos: escritos[b.indice].plano.momentos.length, consertos: consertos[b.indice] })),
  };
}

/**
 * O render em partes (render-em-partes.mjs): partes de ~150 s, algumas ao
 * mesmo tempo dentro da fatia deste trabalho (as abas da fatia divididas entre
 * elas), emendadas sem recodificar e normalizadas a -14 LUFS no fim.
 */
export async function renderizarEmPartes(projeto, nome = "video-editado.mp4", { prazoMs = 90 * 60_000, alvoSeg = BLOCO_ALVO_SEG } = {}) {
  const plano = lerPlano(projeto);
  const partes = partesDoRender(plano.duracao, plano.fps, alvoSeg);
  const tres = usaTres(projeto);
  // No 3D, uma parte de cada vez, com duas abas: as partes em paralelo disputavam o processador.
  const { paralelas, concorrencia } = tres ? { paralelas: 1, concorrencia: Math.max(1, Math.min(2, fatiaAtual().remotion)) } : paralelismoDoRender(fatiaAtual(), partes.length);
  const saida = join("out", nome);
  const r = await rodarNoProjeto(projeto, [join(AQUI, "render-em-partes.mjs"), saida], {
    prazoMs: tres ? prazoMs * 2 : prazoMs,
    env: { RENDER_DO_SERVIDOR: JSON.stringify(limitesDoRender(projeto)), RENDER_EM_PARTES: JSON.stringify({ partes, paralelas, concorrencia }) },
  });
  if (r.codigo !== 0) throw falhou("render-em-partes.mjs", r);
  let resumo = null;
  try {
    resumo = JSON.parse(r.saida.trim().split("\n").filter((l) => l.trim().startsWith("{")).pop());
  } catch {
    // sem resumo: o arquivo vale do mesmo jeito
  }
  return { arquivo: join(projeto, saida), resumo };
}

/**
 * As folhas de conferência do passo 8: os quadros do stills.mjs --momentos,
 * 6 por linha e 3 linhas por folha, com a lista dos instantes na ordem (a
 * folha não tem texto: o instante de cada quadro vai na legenda). No máximo 4
 * folhas (72 quadros); acima disso, um quadro sim, um não. Num modelo deitado
 * (16:9) o quadro reduzido a 270 px não deixa ler o texto: 4 por linha, 480 px.
 */
export async function folhasDosQuadros(projeto, quadros, { deslocamento = 0, prefixo = "" } = {}) {
  // `deslocamento` (10/10, a revisão por bloco do completo): a legenda dá os instantes no tempo
  // do bloco, o mesmo do plano que o revisor recebe; `prefixo` separa as folhas de cada bloco.
  let deitado = false;
  try {
    const p = lerPlano(projeto);
    deitado = Number(p.largura) > Number(p.altura);
  } catch {
    // sem plano legível, a folha do vertical
  }
  const porFolha = deitado ? 16 : 18;
  const filtro = deitado ? "scale=480:-2,tile=4x4:padding=4:color=white" : "scale=270:-2,tile=6x3:padding=4:color=white";
  let lista = [...quadros].sort();
  while (lista.length > porFolha * 4) lista = lista.filter((_, i) => i % 2 === 0);
  const folhas = [];
  for (let i = 0; i < lista.length; i += porFolha) {
    const grupo = lista.slice(i, i + porFolha);
    const arquivoLista = join(projeto, "work", `${prefixo}folha-${folhas.length + 1}.txt`);
    writeFileSync(arquivoLista, grupo.map((q) => `file '${q.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"));
    const saida = join(projeto, "work", `${prefixo}folha-${folhas.length + 1}.jpg`);
    const r = await rodarProcesso(FFMPEG, ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", arquivoLista, "-vf", filtro, "-frames:v", "1", "-q:v", "4", saida]);
    if (r.codigo !== 0 || !existsSync(saida)) continue;
    const instantes = grupo.map((q) => {
      const t = basename(q).match(/t(\d+\.\d+)/)?.[1];
      if (!t) return "?";
      return deslocamento ? Math.max(0, Number(t) - deslocamento).toFixed(2) : t.replace(/^0+(?=\d)/, "");
    });
    folhas.push({ base64: readFileSync(saida).toString("base64"), legenda: `Folha ${folhas.length + 1}: ${grupo.length} quadros, da esquerda para a direita e de cima para baixo, nos instantes (s) ${instantes.join(", ")}` });
  }
  return folhas;
}

/**
 * PASSO 6b (references/imagens.md): o app faz o mapa e os pedidos, o
 * scripts/imagens.mjs do curso busca e monta a folha, o app escolhe olhando a
 * folha (uma nova busca permitida por pedido) e o script grava a escolha, o
 * foco, o crédito e o resumo em plano.imagens. Sem nenhum pedido, segue sem imagem.
 * Exportado para as peças paradas (arte-no-modelo.mjs), que passam pelo mesmo passo.
 *
 * O MATERIAL DO CLIENTE (10/10, material-do-modelo.mjs): `fixos` são pedidos da
 * pasta imagens/ do cliente (com `arquivo`), que o imagens.mjs acha e já marca
 * como escolhidos ("do aluno"): eles não passam pela escolha na folha.
 * `offline` é o passo 6b da Transformação: só os pedidos fixos (as duas fotos)
 * e o imagens.mjs sem internet.
 */
export async function passoDasImagens(projeto, corpo, pedir, { fixos = [], offline = false } = {}) {
  const r = await pedir({ ...corpo, fase: "imagens" });
  const doRedator = Array.isArray(r.imagens) ? r.imagens : [];
  const idsFixos = new Set(fixos.map((p) => p.id));
  const pedidos = offline ? [...fixos] : [...doRedator.filter((p) => !idsFixos.has(p.id)), ...fixos];
  if (!pedidos.length) return { mapa: r.mapa ?? null, creditos: null };
  const arquivo = join(projeto, "work", "imagens.json");
  writeFileSync(arquivo, JSON.stringify(pedidos, null, 2));
  const rodarImagens = async (args = []) => {
    const x = await rodarNoProjeto(projeto, ["scripts/imagens.mjs", ...args, ...(offline ? ["--offline"] : [])], { prazoMs: 12 * 60_000 });
    if (x.codigo !== 0) throw falhou(`imagens.mjs ${args.join(" ")}`, x);
    return x.saida;
  };
  await rodarImagens();
  const escolhidos = new Set();
  for (let rodada = 0; rodada < 2; rodada++) {
    const folhas = readdirSync(join(projeto, "work"))
      .filter((n) => /^imagens(-\d+)?\.jpg$/.test(n))
      .sort((a, b) => (Number(a.match(/-(\d+)/)?.[1] ?? 1) - Number(b.match(/-(\d+)/)?.[1] ?? 1)))
      .map((n) => readFileSync(join(projeto, "work", n)).toString("base64"));
    // O arquivo do cliente (pasta imagens/) já entra escolhido pelo imagens.mjs: não volta à escolha.
    const estado = JSON.parse(readFileSync(arquivo, "utf8")).filter((p) => !escolhidos.has(p.id) && p.escolha?.licenca !== "do aluno");
    if (!estado.length || !folhas.length) break;
    const e = await pedir({ ...corpo, fase: "escolher", pedidos: estado, folhas });
    const refazer = [];
    for (const x of e.escolhas ?? []) {
      if (!estado.some((p) => p.id === x.id)) continue;
      if (x.refazer && rodada === 0) {
        refazer.push(x);
        continue;
      }
      const n = x.refazer ? 0 : Number(x.n) || 0;
      await rodarImagens(["--escolher", x.id, String(n), ...(n && Array.isArray(x.foco) ? ["--foco", `${x.foco[0]},${x.foco[1]}`] : [])]);
      escolhidos.add(x.id);
    }
    if (!refazer.length) break;
    for (const x of refazer) await rodarImagens(["--refazer", x.id, "--busca", x.refazer]);
    await rodarImagens();
  }
  // Pedido que ficou sem resposta vira o cartão com a palavra (o curso: "cartão é melhor que imagem errada").
  for (const p of JSON.parse(readFileSync(arquivo, "utf8"))) {
    if (!escolhidos.has(p.id) && !p.escolha) await rodarImagens(["--escolher", p.id, "0"]);
  }
  await rodarImagens(["--limpar"]).catch(() => {});
  const creditos = existsSync(join(projeto, "creditos.txt")) ? readFileSync(join(projeto, "creditos.txt"), "utf8").trim() : null;
  return { mapa: r.mapa ?? null, creditos: creditos || null };
}

/** Passo 9: o render do curso, que recusa plano reprovado e normaliza o áudio a -14 LUFS. */
/**
 * Os limites do servidor para o render.mjs do curso (10/10): o primeiro corte
 * em produção morreu duas vezes em "render 0%" (EPIPE) com uma aba do Chrome
 * por núcleo. Os mesmos números do editor de antes (montagem.mjs,
 * opcoesDoRender), da fatia deste trabalho na fila (capacidade.mjs). Ver
 * worker/modelos/limites-do-servidor.mjs.
 */
export function limitesDoRender(projeto = null) {
  const tres = projeto ? usaTres(projeto) : false;
  return {
    // O 3D (WebGL por CPU, swangle) pesa cada aba: menos abas e mais prazo por quadro (10/10, noite).
    concurrency: tres ? Math.max(1, Math.min(2, fatiaAtual().remotion)) : fatiaAtual().remotion,
    offthreadVideoCacheSizeInBytes: 512 * 1024 * 1024,
    offthreadVideoThreads: 2,
    chromiumOptions: process.platform === "linux" ? { enableMultiProcessOnLinux: true } : {},
    timeoutInMilliseconds: tres ? 600_000 : 120_000,
  };
}

/**
 * O modelo desenha em 3D (@remotion/three no package.json do projeto)? No
 * servidor o WebGL roda no processador: o completo 16:9 do Torre estourou os
 * 120 s de espera do quadro com as partes em paralelo (cmv303ufi, 10/10).
 */
export function usaTres(projeto) {
  try {
    const pkg = JSON.parse(readFileSync(join(projeto, "package.json"), "utf8"));
    return Boolean(pkg.dependencies?.["@remotion/three"] || pkg.devDependencies?.["@remotion/three"]);
  } catch {
    return false;
  }
}

export async function renderizar(projeto, nome = "video-editado.mp4", { prazoMs = 90 * 60_000 } = {}) {
  const saida = join("out", nome);
  const r = await rodarNoProjeto(projeto, ["scripts/render.mjs", saida], { prazoMs, env: { RENDER_DO_SERVIDOR: JSON.stringify(limitesDoRender(projeto)) } });
  if (r.codigo !== 0) throw falhou("render.mjs", r);
  return join(projeto, saida);
}
