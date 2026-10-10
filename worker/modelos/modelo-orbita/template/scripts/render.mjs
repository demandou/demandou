// Passo 4 — renderiza o vídeo final e normaliza o áudio a -14 LUFS (padrão das redes).
//
// Uso:  node scripts/render.mjs [out/nome-do-video.mp4]
//
// Antes de renderizar, roda a conferência do plano (conferir.mjs) e para se ele for reprovado.
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { argumentos, exigirProjeto, ffmpeg, lerJson, medirVolume } from "./comum.mjs";
import { conferirPlano, tiposDoModelo } from "./conferir.mjs";

exigirProjeto();
const { posicionais, opcoes } = argumentos();

// antes de gastar minutos renderizando: o plano é uma edição de verdade? (references/adaptar.md)
{
  const plano = lerJson("src/plano.json");
  const modelo = existsSync("modelo.json") ? lerJson("modelo.json") : {};
  const r = conferirPlano(plano, modelo, tiposDoModelo());
  if (!r.ok && !opcoes.forcar) {
    console.error("O plano não passou na conferência (node scripts/conferir.mjs --mapa para ver tudo):");
    r.erros.forEach((e, i) => console.error(`  ${i + 1}. ${e}`));
    console.error("\nCorrija o plano e rode o render de novo. Não entregue uma edição só com legenda.");
    process.exit(1);
  }
  if (!r.ok) console.warn("Atenção: renderizando com --forcar um plano reprovado na conferência. Diga isso ao usuário na entrega.");
}
const saida = posicionais[0] ?? "out/video-editado.mp4";
// modelos com 3D (WebGL) declaram { "gl": "angle" } no modelo.json: sem isso o navegador do render não cria o contexto 3D
const gl = existsSync("modelo.json") ? lerJson("modelo.json").gl : undefined;
const chromiumOptions = gl ? { gl } : {};
// o bruto sai com áudio sem compressão: o AAC do render chega ~43 ms atrasado em relação à imagem;
// o AAC feito aqui no fim fica no tempo certo
const bruto = path.join(path.dirname(saida), ".render-sem-normalizar.mov");
mkdirSync(path.dirname(saida), { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
try {
  const composition = await selectComposition({ serveUrl, id: "Edicao", chromiumOptions });
  let ultimo = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 17,
    audioCodec: "pcm-16",
    imageFormat: "jpeg",
    jpegQuality: 92,
    // sem isto o arquivo sai marcado como "full range" e as cores mudam em alguns players
    pixelFormat: "yuv420p",
    colorSpace: "bt709",
    outputLocation: bruto,
    chromiumOptions,
    logLevel: "error",
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== ultimo) {
        ultimo = pct;
        console.log(`render ${pct}%`);
      }
    },
  });
} finally {
  // o bundle copia a pasta public; apagar evita encher o disco
  rmSync(serveUrl, { recursive: true, force: true });
}

const m = medirVolume(bruto);
const filtro = `loudnorm=I=-14:TP=-2:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
ffmpeg(["-y", "-i", bruto, "-c:v", "copy", "-af", filtro, "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", saida]);
rmSync(bruto, { force: true });
console.log(`\nPronto: ${path.resolve(saida)}  (áudio ${m.input_i} → -14 LUFS)`);
