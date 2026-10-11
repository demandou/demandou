// O RENDER 3D NA GPU DO RUNPOD (11/10/2026): os modelos do curso com @remotion/three
// (Torre, Medida, Órbita, Anatomia) renderizam no Railway com WebGL por CPU (swangle),
// dezenas de segundos por segundo de vídeo. Com RENDER_3D_NA_GPU=1, RUNPOD_API_KEY e
// RUNPOD_ENDPOINT_RENDER3D, o projeto (sem node_modules, out e work) vai num tar.gz pelo
// Blob público, o endpoint demandou-render3d (worker/avancado/render3d) roda o MESMO
// scripts/render.mjs do curso com o Chrome desenhando na GPU (gl angle-egl) e o MP4 volta
// pelo Blob com token de cliente. Qualquer falha volta para o render por CPU de sempre.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** O que fica fora do pacote: as dependências (o endpoint tem as dele), saídas e intermediários. */
export const FORA_DO_PACOTE = ["node_modules", "out", "work", ".cache"];

/** A rota está ligada para este projeto? Puro (testado). */
export function deveRenderizarNaGpu({ tres, env = process.env } = {}) {
  if (!tres) return false;
  if (!["1", "true", "sim"].includes(String(env.RENDER_3D_NA_GPU ?? "").trim().toLowerCase())) return false;
  return Boolean(env.RUNPOD_API_KEY && env.RUNPOD_ENDPOINT_RENDER3D && env.BLOB_PUBLIC_READ_WRITE_TOKEN);
}

/**
 * O corpo do /run do endpoint de render 3D. Puro (testado). `limites` são os do servidor
 * (RENDER_DO_SERVIDOR) sem o que só vale na CPU: na GPU as abas do Chrome não disputam o
 * processador do Railway, então vai a concorrência pedida (padrão do Remotion se nula).
 */
export function pedidoDoRender3d({ urlDoProjeto, nome, saida, gl = "angle-egl", chromeMode = "chrome-for-testing", limites = {}, concorrencia = null }) {
  const { concurrency: _cpu, ...resto } = limites ?? {};
  // o headless shell não desenha na GPU no Linux: o Chrome for Testing sim (vai no renderMedia do render.mjs)
  const servidor = { ...resto, chromeMode, ...(concorrencia ? { concurrency: concorrencia } : {}), chromiumOptions: { ...(resto.chromiumOptions ?? {}), enableMultiProcessOnLinux: true } };
  return {
    input: {
      url_do_projeto: urlDoProjeto,
      modo: "script",
      script: "scripts/render.mjs",
      args: [`out/${nome}`],
      arquivo: `out/${nome}`,
      gl,
      env: { RENDER_DO_SERVIDOR: JSON.stringify(servidor) },
      saida,
    },
  };
}

/** Lê o /status do endpoint de render. Puro (testado). */
export function lerRespostaDoRender3d(j) {
  const status = String(j?.status ?? "");
  if (["IN_QUEUE", "IN_PROGRESS"].includes(status)) return { estado: "andando" };
  if (status !== "COMPLETED") return { estado: "falhou", erro: String(j?.error ?? (status || "sem status")).slice(0, 500) };
  const o = j.output ?? {};
  if (o.erro || o.error) return { estado: "falhou", erro: String(o.erro ?? o.error).slice(0, 500) };
  if (!o.url) return { estado: "falhou", erro: "o RunPod terminou sem o MP4" };
  return { estado: "pronto", url: o.url, medida: o.medida ?? null, gpu: o.gpu ?? null };
}

/** Empacota o projeto num tar.gz (tar do sistema; no Railway é Linux). */
export function empacotarProjeto(projeto, destino) {
  mkdirSync(dirname(destino), { recursive: true });
  const fora = FORA_DO_PACOTE.flatMap((n) => [`--exclude=./${n}`]);
  const r = spawnSync("tar", ["-czf", destino, ...fora, "-C", projeto, "."], { encoding: "utf8" });
  if (r.status !== 0 || !existsSync(destino)) throw new Error(`tar do projeto falhou: ${(r.stderr || r.error?.message || "").slice(0, 300)}`);
  return destino;
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Renderiza o projeto na GPU e grava o MP4 em <projeto>/out/<nome>. Devolve
 * { arquivo, medida, gpu, segundos } ou lança (quem chama volta para a CPU).
 */
export async function renderizarNaGpu(projeto, nome, { limites = {}, prazoMs = 60 * 60_000, env = process.env, aoPasso = () => {} } = {}) {
  const chave = env.RUNPOD_API_KEY;
  const endpoint = env.RUNPOD_ENDPOINT_RENDER3D;
  const token = env.BLOB_PUBLIC_READ_WRITE_TOKEN;
  const { put, del } = await import("@vercel/blob");
  const { saidaNoBlob } = await import("../avancado/recorte.mjs");
  const t0 = Date.now();
  const pacote = empacotarProjeto(projeto, join(projeto, "work", "projeto-para-gpu.tar.gz"));
  const apagar = [];
  try {
    const sobe = await put(`render3d/${Date.now()}-projeto.tar.gz`, readFileSync(pacote), { access: "public", token, addRandomSuffix: true, contentType: "application/gzip" });
    apagar.push(sobe.url);
    aoPasso(`render na GPU: projeto de ${(statSync(pacote).size / 1e6).toFixed(1)} MB enviado`);
    const saida = await saidaNoBlob({ token, pathname: `render3d/${Date.now()}-${nome}`, contentType: "video/mp4" });
    const corpo = pedidoDoRender3d({ urlDoProjeto: sobe.url, nome, saida, gl: env.GL_NA_GPU || "angle-egl", limites, concorrencia: Number(env.CONCORRENCIA_NA_GPU) || null });
    const cab = { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" };
    const r = await fetch(`https://api.runpod.ai/v2/${endpoint}/run`, { method: "POST", headers: cab, body: JSON.stringify(corpo) });
    if (!r.ok) throw new Error(`RunPod /run: HTTP ${r.status}`);
    const { id } = await r.json();
    let lido;
    for (;;) {
      await espera(5000);
      if (Date.now() - t0 > prazoMs) {
        await fetch(`https://api.runpod.ai/v2/${endpoint}/cancel/${id}`, { method: "POST", headers: cab }).catch(() => {});
        throw new Error("render na GPU passou do prazo");
      }
      const s = await fetch(`https://api.runpod.ai/v2/${endpoint}/status/${id}`, { headers: cab }).then((x) => x.json()).catch(() => null);
      if (!s) continue;
      lido = lerRespostaDoRender3d(s);
      if (lido.estado !== "andando") break;
    }
    if (lido.estado !== "pronto") throw new Error(`render na GPU falhou: ${lido.erro}`);
    apagar.push(lido.url);
    const v = await fetch(lido.url);
    if (!v.ok) throw new Error(`download do MP4 da GPU: HTTP ${v.status}`);
    const arquivo = join(projeto, "out", nome);
    mkdirSync(dirname(arquivo), { recursive: true });
    writeFileSync(arquivo, Buffer.from(await v.arrayBuffer()));
    return { arquivo, medida: lido.medida, gpu: lido.gpu, segundos: Math.round((Date.now() - t0) / 1000) };
  } finally {
    rmSync(pacote, { force: true });
    for (const u of apagar) await del(u, { token }).catch(() => {});
  }
}
