// PREPARA OS TRECHOS DAS AMOSTRAS (aulas 8.1 e 8.2) a partir da gravação e da transcrição.
//
// Uso: node scripts/preparar.mjs <original.mp4> <palavras.json>
//
// Para cada trecho: as palavras reais no tempo do trecho (src/dados/fala-<id>.json,
// nada inventado), a voz em WAV (public/<id>-voz.wav) e, na 8.1, o vídeo do
// apresentador (public/<id>-trecho.mp4), que entra na moldura sem recorte.
// O recorte com alfa da 8.2 sai do scripts/recorte-alfa.py (Python), não daqui.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const TRECHOS = {
  // "o bem feito ele remete a você fazer o certo com o que você tem. E muita das vezes
  // a gente acha que a excelência é o produto mais caro, é o computador mais caro, é o celular mais caro."
  aula82: { inicio: 64.45, duracao: 15, video: false },
  // "e se prepara pra receber essa benção. Não, trabalha, aumenta a casa, estica a corda,
  // o finca e estaca, deixa a cortina bem esticadinha, faça o essencial bem feito,"
  aula81: { inicio: 957.85, duracao: 12, video: true },
};

const [original, arquivoPalavras] = process.argv.slice(2);
if (!original || !arquivoPalavras) {
  console.error("uso: node scripts/preparar.mjs <original.mp4> <palavras.json>");
  process.exit(1);
}
const palavras = JSON.parse(readFileSync(arquivoPalavras, "utf8"));
mkdirSync(path.join(RAIZ, "src", "dados"), { recursive: true });
mkdirSync(path.join(RAIZ, "public"), { recursive: true });

const ffmpeg = (args) => {
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg falhou: ${r.stderr}`);
};

for (const [id, t] of Object.entries(TRECHOS)) {
  const fim = t.inicio + t.duracao;
  const fala = palavras
    .filter((p) => p.em >= t.inicio - 0.05 && p.em < fim - 0.05)
    .map((p) => ({ de: +(p.em - t.inicio).toFixed(3), ate: +(Math.min(p.ate, fim) - t.inicio).toFixed(3), w: p.w }));
  writeFileSync(path.join(RAIZ, "src", "dados", `fala-${id}.json`), `${JSON.stringify({ inicio: t.inicio, duracao: t.duracao, palavras: fala }, null, 1)}\n`);
  ffmpeg(["-ss", String(t.inicio), "-i", original, "-t", String(t.duracao), "-vn", "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", path.join(RAIZ, "public", `${id}-voz.wav`)]);
  if (t.video) {
    ffmpeg([
      "-ss", String(t.inicio), "-i", original, "-t", String(t.duracao), "-an",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "15", "-pix_fmt", "yuv420p", "-g", "15", "-movflags", "+faststart",
      path.join(RAIZ, "public", `${id}-trecho.mp4`),
    ]);
  }
  console.log(`${id}: ${fala.length} palavras, ${fala.map((p) => p.w).join(" ")}`);
}
