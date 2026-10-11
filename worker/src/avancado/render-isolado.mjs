/**
 * O RENDER DO CÓDIGO ESCRITO PELA IA, num processo separado (editor avançado).
 *
 * Roda com o ambiente limpo (sem nenhuma chave: processo.mjs, ambienteLimpo),
 * na pasta do trabalho, com teto de memória do Node e prazo (quem chama mata a
 * árvore inteira no estouro). O bundle só LÊ o código; a cena executa no
 * Chrome do Remotion, servida do próprio bundle, depois do portão estático
 * (portao.mjs) ter recusado rede, disco, eval e globais.
 *
 * Uso: node render-isolado.mjs <projeto> <pedido.json>
 *   pedido.acao "conferir": quadros parados (renderStill, uma aba só) e uma
 *     amostra curta (renderMedia num intervalo), para o passo 8 e para achar
 *     erro de execução antes do render final;
 *   pedido.acao "final": o corte inteiro, com o áudio a -14 LUFS.
 * A última linha da saída é um JSON: { ok, ... } ou { ok: false, erro }.
 */
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { nivelarAudioDoMov } from "./audio-do-mov.mjs";

const [projeto, arquivoDoPedido] = process.argv.slice(2);
const pedido = JSON.parse(readFileSync(arquivoDoPedido, "utf8"));
const FFMPEG = process.env.FFMPEG_BIN || "ffmpeg";
const limites = pedido.limites ?? {};
const chromiumOptions = { gl: pedido.gl || "swangle", ...(limites.chromiumOptions ?? {}) };

const ffmpeg = (args) => {
  const r = spawnSync(FFMPEG, ["-hide_banner", "-nostdin", ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`ffmpeg falhou: ${String(r.stderr).split("\n").slice(-8).join("\n")}`);
  return r.stderr;
};

/** A mensagem do erro sem o ruído: o começo (o que quebrou) e as linhas com o arquivo da cena. */
function resumir(e) {
  const texto = e instanceof Error ? `${e.message}\n${e.stack ?? ""}` : String(e);
  const linhas = texto.split("\n").map((l) => l.trimEnd()).filter(Boolean);
  const daCena = linhas.filter((l) => /cenas[\\/]/.test(l)).slice(0, 8);
  return [...linhas.slice(0, 6), ...daCena].join("\n").slice(0, 3000);
}

const t0 = Date.now();
let serveUrl = null;
let navegador = null;
try {
  serveUrl = await bundle({ entryPoint: join(projeto, "src", "index.ts"), publicDir: join(projeto, "public"), rootDir: projeto, enableCaching: false });
  const tBundle = (Date.now() - t0) / 1000;
  const composition = await selectComposition({ serveUrl, id: "Corte", chromiumOptions, timeoutInMilliseconds: limites.timeoutInMilliseconds ?? 120_000, logLevel: "error" });
  if (pedido.acao === "conferir") {
    navegador = await openBrowser("chrome", { chromiumOptions });
    const quadros = [];
    const t1 = Date.now();
    mkdirSync(pedido.pasta, { recursive: true });
    for (const q of pedido.quadros) {
      const frame = Math.min(composition.durationInFrames - 1, Math.max(0, q));
      const saida = join(pedido.pasta, `t${(frame / composition.fps).toFixed(2).padStart(6, "0")}.jpg`);
      await renderStill({
        composition,
        serveUrl,
        frame,
        output: saida,
        imageFormat: "jpeg",
        jpegQuality: 82,
        scale: pedido.escala ?? 0.375,
        chromiumOptions,
        puppeteerInstance: navegador,
        timeoutInMilliseconds: limites.timeoutInMilliseconds ?? 120_000,
        logLevel: "error",
      });
      quadros.push({ frame, t: +(frame / composition.fps).toFixed(2), arquivo: saida });
    }
    const tStills = (Date.now() - t1) / 1000;
    let amostra = null;
    if (pedido.amostra) {
      const t2 = Date.now();
      const de = Math.max(0, Math.min(composition.durationInFrames - 2, pedido.amostra.de));
      const ate = Math.max(de + 1, Math.min(composition.durationInFrames - 1, pedido.amostra.ate));
      await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        frameRange: [de, ate],
        muted: true,
        concurrency: limites.concurrency ?? 2,
        offthreadVideoCacheSizeInBytes: limites.offthreadVideoCacheSizeInBytes ?? 512 * 1024 * 1024,
        offthreadVideoThreads: limites.offthreadVideoThreads ?? 2,
        timeoutInMilliseconds: limites.timeoutInMilliseconds ?? 120_000,
        crf: 20,
        imageFormat: "jpeg",
        jpegQuality: 88,
        pixelFormat: "yuv420p",
        outputLocation: pedido.amostra.saida,
        chromiumOptions,
        logLevel: "error",
      });
      const s = (Date.now() - t2) / 1000;
      amostra = { arquivo: pedido.amostra.saida, segundos: +s.toFixed(1), segundosDeVideo: +((ate - de + 1) / composition.fps).toFixed(2), renderPorSegundo: +(s / ((ate - de + 1) / composition.fps)).toFixed(2) };
    }
    console.log(JSON.stringify({ ok: true, bundle_s: +tBundle.toFixed(1), stills_s: +tStills.toFixed(1), quadros, amostra }));
  } else {
    const t1 = Date.now();
    const bruto = join(dirname(pedido.saida), ".corte-bruto.mov");
    mkdirSync(dirname(pedido.saida), { recursive: true });
    let ultimo = -1;
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      concurrency: limites.concurrency ?? 4,
      offthreadVideoCacheSizeInBytes: limites.offthreadVideoCacheSizeInBytes ?? 512 * 1024 * 1024,
      offthreadVideoThreads: limites.offthreadVideoThreads ?? 2,
      timeoutInMilliseconds: limites.timeoutInMilliseconds ?? 120_000,
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
          console.log(`progresso ${pct}% (${((Date.now() - t1) / 1000).toFixed(0)} s)`);
        }
      },
    });
    const tRender = (Date.now() - t1) / 1000;
    if (pedido.bruto) {
      // um bloco do completo (11/10): sai com o áudio sem compressão, para a emenda sem
      // recodificar e o -14 LUFS uma vez só no vídeo inteiro (como o render em partes do curso)
      renameSync(bruto, pedido.saida);
      const duracao = composition.durationInFrames / composition.fps;
      console.log(JSON.stringify({ ok: true, bundle_s: +tBundle.toFixed(1), render_s: +tRender.toFixed(1), render_por_s: +(tRender / duracao).toFixed(2), duracao_s: duracao, arquivo: pedido.saida }));
    } else {
    // -14 LUFS em duas passadas (o mesmo filtro do render.mjs do curso)
    // pelo ffmpeg 7.1 do Remotion (audio-do-mov.mjs): o 5.1 do contêiner não monta o filtro com o PCM do Remotion
    const m = nivelarAudioDoMov(ffmpeg, bruto, pedido.saida);
    rmSync(bruto, { force: true });
    const duracao = composition.durationInFrames / composition.fps;
    console.log(JSON.stringify({ ok: true, bundle_s: +tBundle.toFixed(1), render_s: +tRender.toFixed(1), render_por_s: +(tRender / duracao).toFixed(2), duracao_s: duracao, audio: `${m.input_i} LUFS -> -14 LUFS`, arquivo: pedido.saida }));
    }
  }
} catch (e) {
  console.log(JSON.stringify({ ok: false, erro: resumir(e) }));
  process.exitCode = 1;
} finally {
  if (navegador) await navegador.close({ silent: true }).catch(() => {});
  if (serveUrl) rmSync(serveUrl, { recursive: true, force: true });
}
