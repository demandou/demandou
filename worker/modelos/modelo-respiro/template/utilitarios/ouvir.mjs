// Ferramenta do modelo Respiro: mostra a "forma" da fala num trecho do vídeo de trabalho, para achar
// o instante exato em que um número é dito ("quatro", "sete", "oito"). O Whisper às vezes junta
// números numa palavra só ("478") ou marca a última palavra da frase um pouco atrasada.
//
// Uso:  node utilitarios/ouvir.mjs 7.6 8.8
// Cada linha = 20 ms. "voz" = volume da fala (cada sílaba é um morro); "s/t" = chiado agudo
// (as consoantes "s", "ch", "t" aparecem aqui antes da vogal: "sete" começa com um morro de "s/t").
import { readFileSync, rmSync } from "node:fs";
import { argumentos, exigirProjeto, ffmpeg } from "../scripts/comum.mjs";

exigirProjeto();
const { posicionais } = argumentos();
const [de, ate] = posicionais.map(Number);
if (!Number.isFinite(de) || !Number.isFinite(ate) || ate <= de) {
  console.error("Uso: node utilitarios/ouvir.mjs <de> <ate>   (segundos no vídeo cortado, public/base.mp4)");
  process.exit(1);
}
const TAXA = 16000;
const ler = (arquivo) => {
  ffmpeg(["-y", "-ss", String(de), "-t", String(ate - de), "-i", "public/base.mp4", "-ac", "1", "-ar", String(TAXA), "-c:a", "pcm_s16le", arquivo]);
  const wav = readFileSync(arquivo);
  rmSync(arquivo, { force: true });
  const b = wav.subarray(wav.indexOf("data", 12, "ascii") + 8);
  const copia = new Uint8Array(b.length - (b.length % 2));
  copia.set(b.subarray(0, copia.length));
  return new Int16Array(copia.buffer);
};
const voz = ler("work/.ouvir.wav");
// segunda diferença: deixa passar só o agudo (os chiados), sem depender de filtro do ffmpeg
const agudo = new Float64Array(voz.length);
for (let k = 2; k < voz.length; k++) agudo[k] = voz[k] - 2 * voz[k - 1] + voz[k - 2];
const passo = Math.round(TAXA * 0.02);
const rms = (a, i) => {
  let s = 0;
  for (let k = i; k < Math.min(a.length, i + passo); k++) s += a[k] * a[k];
  return Math.sqrt(s / passo);
};
const linhas = [];
for (let i = 0; i < voz.length; i += passo) linhas.push({ t: de + i / TAXA, v: rms(voz, i), a: rms(agudo, i) });
const maxV = Math.max(...linhas.map((l) => l.v), 1);
const maxA = Math.max(...linhas.map((l) => l.a), 1);
console.log("tempo   voz                                  s/t");
for (const l of linhas) {
  const v = "#".repeat(Math.round((l.v / maxV) * 34));
  const a = "+".repeat(Math.round((l.a / maxA) * 20));
  console.log(`${l.t.toFixed(2).padStart(6)}  ${v.padEnd(36)} ${a}`);
}
