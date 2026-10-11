import { spawn } from "node:child_process";
import { createWriteStream, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

/**
 * O RECORTE DO APRESENTADOR (aula 8.2), com o motor TROCÁVEL.
 *
 * O motor é o RVM mobilenetv3 (GPL-3.0: roda só no nosso servidor, o modelo
 * nunca vai para o navegador nem para o cliente), pelo script
 * worker/avancado/scripts/recorte-alfa.py: aquecimento da memória, cor da
 * borda sem a parede, WebM VP9 com alfa e o rastro da cabeça. Onde ele roda:
 *
 *   "cpu"     aqui no worker, com onnxruntime em CPU (o padrão; ~21 s por
 *             segundo de vídeo num i3 de 4 núcleos, bem menos no Railway);
 *   "runpod"  a GPU sob demanda do RunPod Serverless (decisão do Bruno,
 *             10/10: o Modal recusou o cartão). Um endpoint com a imagem de
 *             worker/avancado/runpod, chamado por HTTP: entrada a URL do
 *             trecho, saída a URL do WebM com alfa (ou os bytes). Liga
 *             sozinho quando RUNPOD_API_KEY e RUNPOD_ENDPOINT_RECORTE existem.
 *
 * RECORTE_BACKEND=cpu força a CPU mesmo com as variáveis do RunPod.
 */
const AQUI = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = process.env.PASTA_DO_AVANCADO ? join(process.env.PASTA_DO_AVANCADO, "scripts") : join(AQUI, "..", "..", "avancado", "scripts");
const PYTHON = process.env.PYTHON_DO_RECORTE ?? "python3";
const RUNPOD = "https://api.runpod.ai/v2";

/** Qual motor usar agora. Puro (testado). */
export function backendDoRecorte(env = process.env) {
  if (env.RECORTE_BACKEND === "cpu") return "cpu";
  if (env.RUNPOD_API_KEY && env.RUNPOD_ENDPOINT_RECORTE) return "runpod";
  return "cpu";
}

/**
 * A região da gravação que vai para o WebM: a pessoa com folga para os
 * gestos, centrada no rosto médio, na altura inteira. Menos pixel no WebM é
 * menos tempo de codificação e menos memória no render. Puro (testado).
 */
export function caixaDoRecorte(rosto, largura, altura, { larguraDaCaixa = 1320 } = {}) {
  const xs = (rosto ?? []).map((r) => r.x).filter((x) => Number.isFinite(x));
  const meio = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : largura / 2;
  const l = Math.min(largura, larguraDaCaixa) - (Math.min(largura, larguraDaCaixa) % 2);
  const x = Math.round(Math.min(largura - l, Math.max(0, meio - l / 2)));
  return [x - (x % 2), 0, l, altura - (altura % 2)];
}

/** O corpo do pedido ao endpoint do RunPod (o handler.py de worker/avancado/runpod). Puro (testado). */
export function pedidoDoRunpod({ urlDoTrecho, duracao, caixa, aquecer = 1.5, razao = 0.25, saida = null }) {
  return {
    input: {
      url_do_trecho: urlDoTrecho,
      inicio: 0,
      duracao: +Number(duracao).toFixed(3),
      aquecer,
      aquecer_no_comeco: true,
      razao,
      caixa: caixa ? caixa.join(",") : null,
      ...(saida ? { saida } : {}),
    },
  };
}

/**
 * Para onde o RunPod manda o WebM: o Blob público da Vercel, com um TOKEN DE
 * CLIENTE que só serve para este arquivo e vence em 30 min (a chave do Blob
 * nunca sai do worker). O handler faz o PUT com estes cabeçalhos, como o SDK
 * do Blob faz, e devolve a URL. Os cabeçalhos são puros (testados).
 */
export function cabecalhosDoBlob({ tokenDoCliente, contentType = "video/webm" }) {
  const storeId = String(tokenDoCliente).split("_")[3] ?? "";
  return {
    authorization: `Bearer ${tokenDoCliente}`,
    "x-api-version": "12",
    "x-vercel-blob-store-id": storeId,
    "x-vercel-blob-access": "public",
    "x-content-type": contentType,
    "x-add-random-suffix": "1",
  };
}

export async function saidaNoBlob({ token, pathname, contentType = "video/webm" }) {
  const { generateClientTokenFromReadWriteToken } = await import("@vercel/blob/client");
  const tokenDoCliente = await generateClientTokenFromReadWriteToken({
    token,
    pathname,
    allowedContentTypes: [contentType],
    maximumSizeInBytes: 1024 * 1024 * 1024,
    validUntil: Date.now() + 30 * 60_000,
    addRandomSuffix: true,
  });
  return { put_url: `https://vercel.com/api/blob/?pathname=${encodeURIComponent(pathname)}`, cabecalhos: cabecalhosDoBlob({ tokenDoCliente, contentType }) };
}

/**
 * Lê a resposta do RunPod (o /status de um trabalho). Devolve
 * { estado: "andando" | "pronto" | "falhou", url?, base64?, rastro?, medida?, erro? }. Puro (testado).
 */
export function lerRespostaDoRunpod(j) {
  const status = String(j?.status ?? "");
  if (["IN_QUEUE", "IN_PROGRESS"].includes(status)) return { estado: "andando" };
  if (status !== "COMPLETED") return { estado: "falhou", erro: String(j?.error ?? (status || "sem status")).slice(0, 500) };
  const o = j.output ?? {};
  if (o.erro || o.error) return { estado: "falhou", erro: String(o.erro ?? o.error).slice(0, 500) };
  if (!o.url && !o.webm_base64) return { estado: "falhou", erro: "o RunPod terminou sem o WebM (nem url, nem bytes)" };
  return { estado: "pronto", url: o.url ?? null, base64: o.webm_base64 ?? null, rastro: o.rastro ?? null, medida: o.medida ?? null };
}

function rodarPython(args, prazoMs) {
  return new Promise((resolve) => {
    const p = spawn(PYTHON, args, { env: process.env });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    const t = setTimeout(() => p.kill("SIGKILL"), prazoMs);
    p.on("close", (codigo) => {
      clearTimeout(t);
      resolve({ codigo, out, err });
    });
    p.on("error", (e) => {
      clearTimeout(t);
      resolve({ codigo: -1, out, err: String(e) });
    });
  });
}

async function recortarNaCpu({ trecho, duracao, caixa, pasta }) {
  const alfa = join(pasta, "alfa.webm");
  const rastro = join(pasta, "rastro-recorte.json");
  const args = [
    join(SCRIPTS, "recorte-alfa.py"), "--video", trecho, "--inicio", "0", "--duracao", String(duracao),
    "--aquecer", "1.5", "--aquecer-no-comeco", "--saida", alfa, "--rastro", rastro, "--provedor", "cpu",
    ...(caixa ? ["--caixa", caixa.join(",")] : []),
  ];
  // de 21 a 60 s por segundo de vídeo no i3 de 4 núcleos (10/10), com folga; no Railway, bem menos
  const r = await rodarPython(args, Math.max(20 * 60, duracao * 120) * 1000);
  if (r.codigo !== 0 || !existsSync(alfa)) throw new Error(`recorte-alfa.py falhou: ${r.err.trim().split("\n").slice(-6).join(" | ")}`);
  const medida = JSON.parse(r.out.trim().split("\n").pop());
  return { alfa, rastro: JSON.parse(readFileSync(rastro, "utf8")), medida };
}

async function recortarNoRunpod({ trecho, duracao, caixa, pasta, publicar, destino = null, env = process.env, fetchImpl = fetch, esperaMs = 5000 }) {
  if (!publicar) throw new Error("o recorte no RunPod precisa publicar o trecho (sem função de publicar)");
  const urlDoTrecho = await publicar(trecho);
  const saida = destino ? await destino() : null;
  const base = `${RUNPOD}/${env.RUNPOD_ENDPOINT_RECORTE}`;
  const cab = { Authorization: `Bearer ${env.RUNPOD_API_KEY}`, "Content-Type": "application/json" };
  const r = await fetchImpl(`${base}/run`, { method: "POST", headers: cab, body: JSON.stringify(pedidoDoRunpod({ urlDoTrecho, duracao, caixa, saida })), signal: AbortSignal.timeout(60_000) });
  if (!r.ok) throw new Error(`o RunPod recusou o recorte (HTTP ${r.status})`);
  const { id } = await r.json();
  // a partida a frio da GPU mais ~2 s por segundo de vídeo, com folga
  const ate = Date.now() + (10 * 60 + duracao * 10) * 1000;
  for (;;) {
    if (Date.now() > ate) {
      await fetchImpl(`${base}/cancel/${id}`, { method: "POST", headers: cab }).catch(() => {});
      throw new Error("o recorte no RunPod passou do prazo");
    }
    await new Promise((x) => setTimeout(x, esperaMs));
    const s = await fetchImpl(`${base}/status/${id}`, { headers: cab, signal: AbortSignal.timeout(60_000) }).then((x) => x.json()).catch(() => null);
    const lido = lerRespostaDoRunpod(s);
    if (lido.estado === "andando") continue;
    if (lido.estado === "falhou") throw new Error(`o recorte no RunPod falhou: ${lido.erro}`);
    const alfa = join(pasta, "alfa.webm");
    if (lido.url) {
      const d = await fetchImpl(lido.url, { signal: AbortSignal.timeout(5 * 60_000) });
      if (!d.ok || !d.body) throw new Error(`não consegui baixar o WebM do RunPod (HTTP ${d.status})`);
      await pipeline(Readable.fromWeb(d.body), createWriteStream(alfa));
    } else {
      writeFileSync(alfa, Buffer.from(lido.base64, "base64"));
    }
    return { alfa, rastro: lido.rastro, medida: lido.medida, urlDoWebm: lido.url ?? null };
  }
}

/**
 * Recorta o apresentador do trecho. `publicar(arquivo)` devolve uma URL que o
 * RunPod consegue baixar (só no motor "runpod"). Devolve { alfa, rastro,
 * medida, backend, segundos }. Falhou no RunPod, cai na CPU (o corte sai mais
 * devagar, mas sai).
 */
export async function recortarApresentador({ trecho, duracao, caixa, pasta, publicar = null, destino = null, aoPublicar = () => {}, backend = backendDoRecorte() }) {
  const t0 = Date.now();
  if (backend === "runpod") {
    try {
      const r = await recortarNoRunpod({ trecho, duracao, caixa, pasta, publicar, destino });
      if (r.urlDoWebm) aoPublicar(r.urlDoWebm);
      return { ...r, backend: "runpod", segundos: +((Date.now() - t0) / 1000).toFixed(1) };
    } catch (e) {
      console.warn(`[avancado] recorte no RunPod falhou, vai na CPU: ${e instanceof Error ? e.message : e}`);
    }
  }
  const r = await recortarNaCpu({ trecho, duracao, caixa, pasta });
  return { ...r, backend: "cpu", segundos: +((Date.now() - t0) / 1000).toFixed(1) };
}

/** O rastro do rosto quadro a quadro (aula 7 e 8.1: o rosto centrado acompanhando a gravação). */
export async function rastroDoRosto({ trecho, duracao, saida }) {
  const r = await rodarPython([join(SCRIPTS, "rastro-rosto.py"), trecho, "0", String(duracao), saida, "3", "0.8"], Math.max(3 * 60_000, duracao * 6000));
  if (r.codigo !== 0 || !existsSync(saida)) throw new Error(`rastro-rosto.py falhou: ${r.err.trim().split("\n").slice(-4).join(" | ")}`);
  return JSON.parse(readFileSync(saida, "utf8"));
}
