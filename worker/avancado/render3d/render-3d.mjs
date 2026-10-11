// O RENDER DE UM PROJETO REMOTION COM 3D (modelos do curso Torre, Medida, Órbita, Anatomia,
// e o editor avançado), medido. O mesmo script roda no worker (CPU, gl swangle) e na GPU do
// RunPod (gl angle-egl): bundle, renderMedia e a medida de segundos por segundo de vídeo.
// Uso: node render-3d.mjs <projeto> <saida.mp4> <gl> [id=Edicao] [de] [ate] [concorrencia]
// A última linha é um JSON com a medida (ou { ok: false, erro }).
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const [projetoArg, saida, glArg, id = "Edicao", deTxt, ateTxt, concTxt] = process.argv.slice(2);
const projeto = path.resolve(projetoArg);
// "angle-egl+cft": o Chrome for Testing (o headless shell não desenha na GPU no Linux).
const [gl, modo] = String(glArg).split("+");
const chromeMode = String(modo).startsWith("cft") ? "chrome-for-testing" : "headless-shell";
// "+cftw" ou "+hsw": o mesmo navegador por um invólucro que desliga a decodificação de vídeo por
// hardware (a imagem do RunPod cria /app/chrome-cft-sem-hw e /app/chrome-hs-sem-hw).
const browserExecutable = String(modo).endsWith("w") ? (chromeMode === "chrome-for-testing" ? "/app/chrome-cft-sem-hw" : "/app/chrome-hs-sem-hw") : null;
const chromiumOptions = { gl, ...(process.platform === "linux" ? { enableMultiProcessOnLinux: true } : {}) };
const t0 = Date.now();
let serveUrl = null;
try {
  mkdirSync(path.dirname(path.resolve(saida)), { recursive: true });
  serveUrl = await bundle({ entryPoint: path.join(projeto, "src", "index.ts"), publicDir: path.join(projeto, "public"), rootDir: projeto, enableCaching: false });
  const tBundle = (Date.now() - t0) / 1000;
  const composition = await selectComposition({ serveUrl, id, chromiumOptions, chromeMode, browserExecutable, timeoutInMilliseconds: 120_000 });
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
    chromeMode,
    browserExecutable,
    timeoutInMilliseconds: 120_000,
    // os mesmos limites do worker (limitesDoRender): cache e threads do extrator de quadros
    offthreadVideoCacheSizeInBytes: 512 * 1024 * 1024,
    offthreadVideoThreads: 2,
    logLevel: process.env.RENDER_LOG || "error",
  });
  const s = (Date.now() - t1) / 1000;
  const segundosDeVideo = (ate - de + 1) / composition.fps;
  console.log(JSON.stringify({ ok: true, gl: glArg, bundle_s: +tBundle.toFixed(1), render_s: +s.toFixed(1), segundos_de_video: +segundosDeVideo.toFixed(2), render_por_s: +(s / segundosDeVideo).toFixed(2) }));
} catch (e) {
  console.log(JSON.stringify({ ok: false, gl: glArg, erro: String(e instanceof Error ? e.message : e).slice(0, 1500) }));
  process.exitCode = 1;
} finally {
  if (serveUrl) rmSync(serveUrl, { recursive: true, force: true });
}
