// O RENDER DAS AMOSTRAS, com as mesmas opções do servidor (worker/src/modelo/editar-no-modelo.mjs,
// limitesDoRender, e GL_DOS_MODELOS=swangle do Dockerfile) e o áudio a -14 LUFS como o render.mjs do curso.
//
// Uso: node scripts/render.mjs <Composicao> <saida.mp4> [concorrencia=4]
//
// Mede e imprime: segundos de render, segundos de render por segundo de vídeo e o volume antes/depois.
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [id, saidaArg, concTxt] = process.argv.slice(2);
if (!id || !saidaArg) {
  console.error("uso: node scripts/render.mjs <Composicao> <saida.mp4> [concorrencia]");
  process.exit(1);
}
const saida = path.resolve(saidaArg);
const concurrency = Number(concTxt ?? 4);
const chromiumOptions = { gl: process.env.GL_DOS_MODELOS || "swangle", ...(process.platform === "linux" ? { enableMultiProcessOnLinux: true } : {}) };
const bruto = path.join(path.dirname(saida), `.${path.basename(saida, ".mp4")}-bruto.mov`);
mkdirSync(path.dirname(saida), { recursive: true });

const ffmpeg = (args) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostdin", ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`ffmpeg falhou: ${String(r.stderr).split("\n").slice(-8).join("\n")}`);
  return r.stderr;
};

const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.join(RAIZ, "src", "index.ts"), publicDir: path.join(RAIZ, "public") });
const tBundle = (Date.now() - t0) / 1000;
let duracao = 0;
const t1 = Date.now();
try {
  const composition = await selectComposition({ serveUrl, id, chromiumOptions });
  duracao = composition.durationInFrames / composition.fps;
  let ultimo = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    concurrency,
    offthreadVideoCacheSizeInBytes: 512 * 1024 * 1024,
    offthreadVideoThreads: 2,
    timeoutInMilliseconds: 120_000,
    crf: 17,
    audioCodec: "pcm-16",
    imageFormat: "jpeg",
    jpegQuality: 92,
    pixelFormat: "yuv420p",
    colorSpace: "bt709",
    outputLocation: bruto,
    chromiumOptions,
    logLevel: "error",
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== ultimo) {
        ultimo = pct;
        console.log(`render ${pct}%  (${((Date.now() - t1) / 1000).toFixed(0)} s)`);
      }
    },
  });
} finally {
  rmSync(serveUrl, { recursive: true, force: true });
}
const tRender = (Date.now() - t1) / 1000;

// -14 LUFS em duas passadas (o mesmo filtro do render.mjs do curso)
const medida = ffmpeg(["-i", bruto, "-af", "loudnorm=I=-14:TP=-2:LRA=11:print_format=json", "-f", "null", "-"]);
const m = JSON.parse(medida.slice(medida.lastIndexOf("{"), medida.lastIndexOf("}") + 1));
const filtro = `loudnorm=I=-14:TP=-2:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
ffmpeg(["-y", "-i", bruto, "-c:v", "copy", "-af", filtro, "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", saida]);
rmSync(bruto, { force: true });
console.log(
  JSON.stringify({
    composicao: id,
    saida,
    duracao_s: duracao,
    bundle_s: +tBundle.toFixed(1),
    render_s: +tRender.toFixed(1),
    render_por_s_de_video: +(tRender / duracao).toFixed(2),
    concorrencia: concurrency,
    gl: chromiumOptions.gl,
    audio: `${m.input_i} LUFS -> -14 LUFS`,
  })
);
