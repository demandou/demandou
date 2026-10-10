// Aula — mostra onde a voz começa e para num trecho (para acertar o tempo das palavras).
//
// Uso:  node ferramentas/ataques.mjs --de 9 --ate 14        (segundos do vídeo cortado)
//
// Por quê: na fórmula e nos números cada termo entra na palavra exata, e o Whisper às vezes devolve
// um trecho com os tempos adiantados ou espremidos (o `preparar` avisa: "tempos do Whisper
// quebrados… palavras redistribuídas"). Este script lê o áudio de public/base.mp4 e imprime:
// - uma linha a cada 0,2 s com o volume de 20 em 20 ms (" " silêncio, "." fraco, "o" médio, "#" forte);
// - os ATAQUES: os instantes em que a voz volta depois de uma pausa (≥ 0,08 s de silêncio) — é ali
//   que começa a palavra seguinte a uma pausa. Palavras ditas pausadamente ("M… igual a C…
//   vezes…") começam exatamente nesses ataques.
// Com isso, corrija o `em` (e o `ate` da anterior) das palavras em src/plano.json → `palavras`
// (e em work/palavras.json), e rode de novo o `ferramentas/timing.mjs`.
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { argumentos, ffmpeg } from "../scripts/comum.mjs";

const { opcoes } = argumentos();
if (!existsSync("public/base.mp4")) {
  console.error("Rode de dentro da pasta do projeto, depois do cortar (falta public/base.mp4).");
  process.exit(2);
}
const de = Math.max(0, Number(opcoes.de ?? 0));
const ate = Number(opcoes.ate ?? de + 6);
const TAXA = 16000;
mkdirSync("work", { recursive: true });
const tmp = "work/.ataques.wav";
ffmpeg(["-v", "error", "-y", "-ss", String(de), "-to", String(ate), "-i", "public/base.mp4", "-ac", "1", "-ar", String(TAXA), "-c:a", "pcm_s16le", tmp]);
const wav = readFileSync(tmp);
rmSync(tmp, { force: true });
// as amostras ficam depois do bloco "data" do WAV
const inicio = wav.indexOf("data", 12) + 8;
const pcm = wav.subarray(inicio);
const passo = Math.round(0.02 * TAXA);
const db = [];
for (let i = 0; i + passo * 2 <= pcm.length; i += passo * 2) {
  let soma = 0;
  for (let k = 0; k < passo; k++) {
    const v = pcm.readInt16LE(i + k * 2);
    soma += v * v;
  }
  db.push(20 * Math.log10(Math.sqrt(soma / passo) + 1e-9) - 90.3);
}
const s = (t) => t.toFixed(2).replace(".", ",");
let linha = "";
db.forEach((v, k) => {
  if (k % 10 === 0) linha += `\n${s(de + k * 0.02).padStart(6)}  `;
  linha += v < -45 ? " " : v < -30 ? "." : v < -20 ? "o" : "#";
});
console.log(`Volume de ${s(de)} a ${s(ate)} s (cada caractere = 20 ms):${linha}\n`);
const ataques = [];
let silencio = 0;
db.forEach((v, k) => {
  if (v < -45) silencio++;
  else {
    if (silencio >= 4 && v >= -45) ataques.push(de + k * 0.02);
    silencio = 0;
  }
});
console.log(`Ataques (a voz volta depois de uma pausa): ${ataques.map(s).join(" · ") || "nenhum"}`);
