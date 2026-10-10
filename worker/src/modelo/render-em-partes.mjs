// O RENDER EM PARTES do vídeo completo no modelo do curso (10/10/2026).
//
// O render.mjs do curso renderiza o vídeo inteiro numa chamada. Num completo de 15 a 20 min isso
// é uma hora de Chrome aberto, com o cache do vídeo crescendo, e uma falha no minuto 50 joga tudo
// fora. Aqui o MESMO render (a mesma conferência antes, os mesmos parâmetros de vídeo, o mesmo
// -14 LUFS no fim) sai em PARTES de quadros (frameRange do Remotion), algumas ao mesmo tempo, num
// Chrome só, e as partes são emendadas sem recodificar o vídeo:
//
//   - cada parte sai em .mov com o vídeo h264 (crf 17, yuv420p, bt709, os parâmetros do curso) e
//     o áudio em PCM: o PCM não tem o atraso de começo do AAC, então a emenda não desloca o som;
//   - as partes são emendadas pelo concat do ffmpeg com -c copy (mesmo codec e parâmetros, cada
//     parte começa num quadro-chave) e a soma dos quadros é conferida contra a composição;
//   - o volume é medido e normalizado a -14 LUFS UMA vez, no vídeo inteiro (como o render.mjs),
//     e só então o áudio vira AAC.
//
// Uma parte que falha tenta de novo uma vez sozinha, sem refazer as outras.
//
// Roda dentro da pasta do projeto (cwd), como os scripts do curso:
//   node <worker>/src/modelo/render-em-partes.mjs out/video.mp4
// com RENDER_DO_SERVIDOR (os limites do servidor, como no render.mjs) e RENDER_EM_PARTES (JSON:
// { partes: [[de, ate], ...] em quadros, inclusivos; paralelas; concorrencia por parte }).
// A última linha da saída é um JSON com o resumo (partes, quadros, segundos, pico de memória).
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const inicio = Date.now();
const servidor = process.env.RENDER_DO_SERVIDOR ? JSON.parse(process.env.RENDER_DO_SERVIDOR) : {};
const pedido = process.env.RENDER_EM_PARTES ? JSON.parse(process.env.RENDER_EM_PARTES) : {};
const saida = process.argv[2] ?? "out/video-editado.mp4";

if (!existsSync("src/plano.json") || !existsSync("scripts/conferir.mjs")) {
  console.error("Rode de dentro da pasta do projeto (a cópia do template).");
  process.exit(2);
}
const comum = await import(pathToFileURL(path.resolve("scripts/comum.mjs")).href);
const { conferirPlano, tiposDoModelo } = await import(pathToFileURL(path.resolve("scripts/conferir.mjs")).href);

// A conferência do curso antes de gastar minutos renderizando (a mesma do render.mjs).
{
  const plano = JSON.parse(readFileSync("src/plano.json", "utf8"));
  const modelo = existsSync("modelo.json") ? JSON.parse(readFileSync("modelo.json", "utf8")) : {};
  const r = conferirPlano(plano, modelo, tiposDoModelo());
  if (!r.ok) {
    console.error("O plano não passou na conferência (node scripts/conferir.mjs --mapa para ver tudo):");
    r.erros.forEach((e, i) => console.error(`  ${i + 1}. ${e}`));
    process.exit(1);
  }
}

// A memória da máquina durante o render: o pico usado acima do que já estava usado no começo.
const usadaMb = () => Math.round((os.totalmem() - os.freemem()) / 1048576);
const memoriaNoComeco = usadaMb();
let picoMb = memoriaNoComeco;
const relogio = setInterval(() => {
  picoMb = Math.max(picoMb, usadaMb());
}, 2000);

const pasta = path.join(path.dirname(saida), ".partes");
rmSync(pasta, { recursive: true, force: true });
mkdirSync(pasta, { recursive: true });

const { chromiumOptions = {}, concurrency: concorrenciaDoServidor, ...resto } = servidor;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
let browser = null;
const tempos = [];
try {
  const composition = await selectComposition({ serveUrl, id: "Edicao" });
  const total = composition.durationInFrames;
  const partes = (Array.isArray(pedido.partes) && pedido.partes.length ? pedido.partes : [[0, total - 1]]).map(([a, b]) => [
    Math.max(0, Math.round(a)),
    Math.min(total - 1, Math.round(b)),
  ]);
  // as partes cobrem a composição inteira, em ordem e sem buraco
  partes.forEach(([a, b], k) => {
    if (b < a) throw new Error(`parte ${k + 1} vazia (${a} a ${b})`);
    if (k === 0 && a !== 0) throw new Error("a primeira parte não começa no quadro 0");
    if (k > 0 && a !== partes[k - 1][1] + 1) throw new Error(`buraco ou sobreposição antes da parte ${k + 1}`);
  });
  if (partes[partes.length - 1][1] !== total - 1) throw new Error("a última parte não termina no último quadro");
  const paralelas = Math.max(1, Math.min(partes.length, Number(pedido.paralelas) || 1));
  const concorrencia = Math.max(1, Number(pedido.concorrencia) || Math.floor((Number(concorrenciaDoServidor) || 2) / paralelas) || 1);
  console.log(`render em ${partes.length} parte(s), ${paralelas} de cada vez, ${concorrencia} aba(s) por parte, ${total} quadros`);
  browser = await openBrowser("chrome", { chromiumOptions, logLevel: "error" });

  const arquivos = partes.map((_, k) => path.join(pasta, `parte-${String(k + 1).padStart(3, "0")}.mov`));
  const renderizarParte = async (k) => {
    const [a, b] = partes[k];
    const t0 = Date.now();
    let ultimo = -1;
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      try {
        await renderMedia({
          composition,
          serveUrl,
          codec: "h264",
          ...resto,
          concurrency: concorrencia,
          crf: 17,
          audioCodec: "pcm-16",
          imageFormat: "jpeg",
          jpegQuality: 92,
          pixelFormat: "yuv420p",
          colorSpace: "bt709",
          frameRange: [a, b],
          outputLocation: arquivos[k],
          puppeteerInstance: browser,
          logLevel: "error",
          onProgress: ({ progress }) => {
            const pct = Math.floor(progress * 4) * 25;
            if (pct !== ultimo) {
              ultimo = pct;
              console.log(`parte ${k + 1}/${partes.length}: ${pct}%`);
            }
          },
        });
        tempos[k] = +((Date.now() - t0) / 1000).toFixed(1);
        return;
      } catch (e) {
        if (tentativa === 2) throw new Error(`a parte ${k + 1} (${a} a ${b}) falhou duas vezes: ${e instanceof Error ? e.message : e}`);
        console.warn(`parte ${k + 1} falhou (${e instanceof Error ? e.message.slice(0, 200) : e}); tentando de novo`);
        rmSync(arquivos[k], { force: true });
      }
    }
  };
  // piscina: `paralelas` partes ao mesmo tempo, na ordem
  let proxima = 0;
  await Promise.all(
    Array.from({ length: paralelas }, async () => {
      while (proxima < partes.length) {
        const k = proxima++;
        await renderizarParte(k);
      }
    }),
  );

  // A emenda sem recodificar (concat do ffmpeg, -c copy) e a contagem de quadros.
  const lista = path.join(pasta, "lista.txt");
  writeFileSync(lista, arquivos.map((f) => `file '${path.resolve(f).replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"));
  const junto = path.join(pasta, "junto.mov");
  comum.ffmpeg(["-y", "-f", "concat", "-safe", "0", "-i", lista, "-map", "0:v:0", "-map", "0:a:0", "-c", "copy", junto]);
  const quadros = Number(comum.ffprobe(["-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", junto]).trim());
  if (quadros !== total) throw new Error(`a emenda tem ${quadros} quadros, a composição ${total}`);
  const durV = Number(comum.ffprobe(["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=duration", "-of", "csv=p=0", junto]).trim());
  const durA = Number(comum.ffprobe(["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=duration", "-of", "csv=p=0", junto]).trim());
  if (Number.isFinite(durV) && Number.isFinite(durA) && Math.abs(durV - durA) > 1.5 / composition.fps) {
    throw new Error(`a emenda saiu com som e imagem de durações diferentes (${durA.toFixed(3)} s e ${durV.toFixed(3)} s)`);
  }

  // -14 LUFS no vídeo inteiro (o mesmo filtro do render.mjs), e o AAC só aqui no fim.
  const m = comum.medirVolume(junto);
  const filtro = `loudnorm=I=-14:TP=-2:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
  mkdirSync(path.dirname(saida), { recursive: true });
  comum.ffmpeg(["-y", "-i", junto, "-c:v", "copy", "-af", filtro, "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", saida]);
  clearInterval(relogio);
  const resumo = {
    partes: partes.length,
    paralelas,
    concorrencia,
    quadros,
    segundos: +((Date.now() - inicio) / 1000).toFixed(1),
    temposDasPartes: tempos,
    memoriaNoComecoMb: memoriaNoComeco,
    picoMb,
    acimaDoComecoMb: picoMb - memoriaNoComeco,
    volume: { antes: m.input_i, depois: -14 },
    bytes: statSync(saida).size,
  };
  console.log(`\nPronto: ${path.resolve(saida)}  (áudio ${m.input_i} → -14 LUFS)`);
  console.log(JSON.stringify(resumo));
} finally {
  clearInterval(relogio);
  if (browser) await browser.close({ silent: true }).catch(() => {});
  // o bundle copia a pasta public; apagar evita encher o disco (como no render.mjs)
  rmSync(serveUrl, { recursive: true, force: true });
  rmSync(pasta, { recursive: true, force: true });
}
