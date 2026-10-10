// Ajuda a achar o instante em que cada tecla é dita (o Whisper costuma colar "Ctrl+Shift+T" numa
// palavra só, com um tempo para o atalho inteiro). Lê o áudio do vídeo de trabalho (public/base.mp4),
// mostra a energia da fala de 20 em 20 ms no trecho pedido e marca onde cada sílaba começa.
//
// Uso:  node ferramentas/teclas.mjs 3.8 5.2        (de, até — segundos do vídeo já cortado)
//
// Leia as marcas "◆ começa" na ordem e conte as sílabas de cada tecla falada:
//   Ctrl "con-trol" 2 · Shift "xíf-ti" 2 · Win "uín-dous" 2 · Cmd "co-man-di" 3 · Alt "ál-ti" 2
//   Tab "té-bi" 2 · Enter "én-ter" 2 · Esc "és-qui" 2 · letra 1 · número como é falado ("qua-tro" 2)
// O `em` da tecla é o começo da primeira sílaba dela.
import { readFileSync, rmSync } from "node:fs";
import { ffmpeg } from "../scripts/comum.mjs";

const [de, ate] = process.argv.slice(2).map(Number);
if (!Number.isFinite(de) || !Number.isFinite(ate) || ate <= de) {
  console.error("Uso: node ferramentas/teclas.mjs <de> <até>   (ex.: node ferramentas/teclas.mjs 3.8 5.2)");
  process.exit(1);
}
const TAXA = 16000;
const arquivo = "work/.teclas.wav";
ffmpeg(["-y", "-ss", String(Math.max(0, de)), "-t", String(ate - de), "-i", "public/base.mp4", "-map", "0:a:0", "-ac", "1", "-ar", String(TAXA), "-c:a", "pcm_s16le", arquivo]);
const wav = readFileSync(arquivo);
rmSync(arquivo, { force: true });
const dados = wav.subarray(wav.indexOf("data", 12, "ascii") + 8);
const amostras = new Int16Array(dados.buffer, dados.byteOffset, Math.floor(dados.length / 2));

const PASSO = Math.round(0.02 * TAXA);
const db = [];
for (let i = 0; i + PASSO <= amostras.length; i += PASSO) {
  let soma = 0;
  for (let k = i; k < i + PASSO; k++) soma += (amostras[k] / 32768) ** 2;
  db.push(10 * Math.log10(soma / PASSO + 1e-12));
}
const pico = Math.max(...db);
const limiar = pico - 22;
// sílabas: picos de energia (núcleo da vogal) separados por um vale de pelo menos 4 dB; o começo da
// sílaba é onde a energia, saindo do vale, passa de 60% da subida até o pico
const liso = db.map((_, i) => (db[Math.max(0, i - 1)] + db[i] + db[Math.min(db.length - 1, i + 1)]) / 3);
const comecos = new Set();
let vale = 0;
let candidato = -1;
for (let i = 1; i < liso.length; i++) {
  if (candidato < 0 || liso[i] < liso[vale]) {
    if (candidato < 0 && liso[i] < liso[vale]) vale = i;
  }
  if (liso[i] > limiar && liso[i] - liso[vale] >= 4) {
    if (candidato < 0 || liso[i] > liso[candidato]) candidato = i;
  }
  // depois de um pico, um novo vale de 4 dB fecha a sílaba
  if (candidato >= 0 && liso[candidato] - liso[i] >= 4) {
    const alvo = liso[vale] + 0.6 * (liso[candidato] - liso[vale]);
    let k = vale;
    while (k < candidato && liso[k] < alvo) k++;
    comecos.add(k);
    candidato = -1;
    vale = i;
  }
}
if (candidato >= 0) {
  const alvo = liso[vale] + 0.6 * (liso[candidato] - liso[vale]);
  let k = vale;
  while (k < candidato && liso[k] < alvo) k++;
  comecos.add(k);
}
for (let i = 0; i < db.length; i++) {
  const t = de + i * 0.02;
  const barra = "#".repeat(Math.max(0, Math.round((db[i] - pico + 45) / 1.5)));
  console.log(`${t.toFixed(2).padStart(6)}  ${barra.padEnd(30)}${comecos.has(i) ? "  ◆ começa" : ""}`);
}
console.log(`\nComeços de sílaba: ${[...comecos].map((i) => (de + i * 0.02).toFixed(2)).join(" · ") || "nenhum"}`);
