// O RENDER DE UM PROJETO REMOTION COM 3D (modelos do curso Torre, Medida, Órbita, Anatomia,
// e o editor avançado), medido. O mesmo script roda no worker (CPU, gl swangle) e na GPU do
// RunPod (gl angle-egl): bundle, renderMedia e a medida de segundos por segundo de vídeo.
// Uso: node render-3d.mjs <projeto> <saida.mp4> <gl> [id=Edicao] [de] [ate] [concorrencia]
// A última linha é um JSON com a medida (ou { ok: false, erro }).
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const [projetoArg, saida, gl, id = "Edicao", deTxt, ateTxt, concTxt] = process.argv.slice(2);
const projeto = path.resolve(projetoArg);
const chromiumOptions = { gl, ...(process.platform === "linux" ? { enableMultiProcessOnLinux: true } : {}) };
const t0 = Date.now();
let serveUrl = null;
try {
  mkdirSync(path.dirname(path.resolve(saida)), { recursive: true });
  serveUrl = await bundle({ entryPoint: path.join(projeto, "src", "index.ts"), publicDir: path.join(projeto, "public"), rootDir: projeto, enableCaching: false });
  const tBundle = (Date.now() - t0) / 1000;
  const composition = await selectComposition({ serveUrl, id, chromiumOptions, timeoutInMilliseconds: 120_000 });
  const de = deTxt ? Number(deTxt) : 0;
  const ate = ateTxt ? Math.min(composition.durationInFrames - 1, Number(ateTxt)) : composition.durationInFrames - 1;
  const t1 = Date.now();
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    frameRange: [de, ate],
    concurrency: concTxt ? Number(concTxt) : null,
    crf: 18,
    imageFormat: "jpeg",
    jpegQuality: 90,
    pixelFormat: "yuv420p",
    outputLocation: saida,
    chromiumOptions,
    timeoutInMilliseconds: 120_000,
    logLevel: "error",
  });
  const s = (Date.now() - t1) / 1000;
  const segundosDeVideo = (ate - de + 1) / composition.fps;
  console.log(JSON.stringify({ ok: true, gl, bundle_s: +tBundle.toFixed(1), render_s: +s.toFixed(1), segundos_de_video: +segundosDeVideo.toFixed(2), render_por_s: +(s / segundosDeVideo).toFixed(2) }));
} catch (e) {
  console.log(JSON.stringify({ ok: false, gl, erro: String(e instanceof Error ? e.message : e).slice(0, 1500) }));
  process.exitCode = 1;
} finally {
  if (serveUrl) rmSync(serveUrl, { recursive: true, force: true });
}
