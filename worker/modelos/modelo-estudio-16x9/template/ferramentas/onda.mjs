// Mede o volume da voz no vídeo de trabalho (public/<video do plano>) e grava src/onda.json:
// 20 valores por segundo, de 0 (silêncio) a 1 (fala mais alta). É isso que move a onda do
// modelo Estúdio de verdade com a voz. Rode depois do cortar (e de novo sempre que refizer o corte).
//
// Uso:  node ferramentas/onda.mjs
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { exigirProjeto, ffmpeg, gravarJson, lerJson } from "../scripts/comum.mjs";

exigirProjeto();
const plano = lerJson("src/plano.json");
const video = `public/${plano.video ?? "base.mp4"}`;
if (!existsSync(video)) throw new Error(`Não achei ${video}. Rode o cortar antes.`);

const TAXA_AUDIO = 16000;
const POR_SEGUNDO = 20;
mkdirSync("work", { recursive: true });
ffmpeg(["-y", "-i", video, "-map", "0:a:0", "-ac", "1", "-ar", String(TAXA_AUDIO), "-c:a", "pcm_s16le", "work/onda.wav"]);
const wav = readFileSync("work/onda.wav");
const pcm = wav.subarray(wav.indexOf("data", 12, "ascii") + 8);
const amostras = Math.floor(pcm.length / 2);
const janela = TAXA_AUDIO / POR_SEGUNDO;
const total = Math.floor(amostras / janela);

// RMS de cada janela de 50 ms, em dB
const db = [];
for (let k = 0; k < total; k++) {
  let soma = 0;
  for (let i = k * janela; i < (k + 1) * janela; i++) {
    const v = pcm.readInt16LE(i * 2) / 32768;
    soma += v * v;
  }
  db.push(10 * Math.log10(soma / janela + 1e-12));
}
rmSync("work/onda.wav", { force: true });

// 0 = 45 dB abaixo do pico da fala; 1 = o pico (percentil 98, para um estalo não achatar o resto)
const ordenados = [...db].sort((a, b) => a - b);
const pico = ordenados[Math.floor(ordenados.length * 0.98)] ?? -10;
const piso = pico - 45;
const valores = db.map((d) => {
  const v = Math.min(1, Math.max(0, (d - piso) / (pico - piso)));
  // curva que separa a fala do ruído de fundo
  return Number((v ** 1.6).toFixed(3));
});

// duração e número de palavras identificam o corte: se o plano mudar, o template percebe e não usa
// uma onda velha
gravarJson("src/onda.json", { duracao: plano.duracao, palavras: (plano.palavras ?? []).length, porSegundo: POR_SEGUNDO, valores });
const falando = valores.filter((v) => v > 0.25).length / Math.max(1, valores.length);
console.log(`src/onda.json: ${valores.length} valores (${POR_SEGUNDO}/s, ${(valores.length / POR_SEGUNDO).toFixed(1)} s), voz em ${(falando * 100).toFixed(0)}% do tempo.`);
