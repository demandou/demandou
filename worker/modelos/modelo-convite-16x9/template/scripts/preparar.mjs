// Passo 1 — analisa o vídeo bruto: mede, transcreve com tempo por palavra,
// acha os silêncios e propõe os cortes. Não altera o vídeo.
//
// Uso:  node scripts/preparar.mjs "/caminho/do/video.mp4" [--idioma pt] [--modelo large-v3-turbo]
// Gera: work/analise.json, work/cortes.json, work/medir-1..3.jpg (quadros com grade para medir o rosto)
import { bundle } from "@remotion/bundler";
// (Demandou) o Whisper só é carregado quando não vem transcrição pronta em --palavras
import { renderStill, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { argumentos, exigirProjeto, ffmpeg, ffprobe, gravarJson, medirVolume, mmss } from "./comum.mjs";

// 1.7.2: última versão que compila só com `make` e já conhece o modelo turbo.
const VERSAO_WHISPER = "1.7.2";
// Fica fora do projeto para o modelo (1,6 GB) ser baixado uma vez só.
const CACHE = path.join(os.homedir(), ".cache", "modelos-edicao");
const PASTA_WHISPER = path.join(CACHE, `whisper.cpp-${VERSAO_WHISPER}`);
const PASTA_MODELOS = path.join(CACHE, "modelos");

const { opcoes, posicionais } = argumentos();
const origem = posicionais[0] ? path.resolve(posicionais[0]) : null;
if (!origem || !existsSync(origem)) {
  console.error('Uso: node scripts/preparar.mjs "/caminho/do/video.mp4" [--idioma pt] [--modelo large-v3-turbo]');
  process.exit(1);
}
exigirProjeto();
const idioma = opcoes.idioma ?? "pt";
const modelo = opcoes.modelo ?? "large-v3-turbo";
mkdirSync("work", { recursive: true });

// 1. Medidas do vídeo
const info = JSON.parse(ffprobe(["-v", "error", "-print_format", "json", "-show_streams", "-show_format", origem]));
const v = info.streams.find((s) => s.codec_type === "video");
const a = info.streams.find((s) => s.codec_type === "audio");
if (!v || !a) throw new Error("O arquivo precisa ter vídeo e áudio.");
const rotacao = Math.abs(Number(v.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? v.tags?.rotate ?? 0));
const deitado = rotacao === 90 || rotacao === 270;
const largura = deitado ? v.height : v.width;
const altura = deitado ? v.width : v.height;
const [num, den] = String(v.avg_frame_rate || v.r_frame_rate).split("/").map(Number);
const fps = den ? num / den : num;
const duracao = Number(info.format.duration);
const hdr = ["arib-std-b67", "smpte2084"].includes(v.color_transfer);

// 2. Silêncios, com limiar adaptado ao volume da gravação
ffmpeg(["-y", "-i", origem, "-map", "0:a:0", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", "work/audio.wav"]);
const volume = medirVolume(origem);
const limiar = Math.min(-28, Number(volume.input_thresh));
const { stderr } = ffmpeg(["-i", origem, "-map", "0:a:0", "-af", `silencedetect=noise=${limiar}dB:d=0.35`, "-f", "null", "-"]);
const silencios = [];
let inicio = null;
for (const linha of stderr.split("\n")) {
  const s = linha.match(/silence_start: ([\d.-]+)/);
  const e = linha.match(/silence_end: ([\d.-]+)/);
  if (s) inicio = Math.max(0, Number(s[1]));
  if (e && inicio !== null) {
    silencios.push({ de: inicio, ate: Number(e[1]) });
    inicio = null;
  }
}
if (inicio !== null) silencios.push({ de: inicio, ate: duracao });

// 3. Transcrição com tempo por palavra, um trecho de fala ("ilha") por vez.
// Ouvindo o arquivo inteiro, o Whisper joga palavras para dentro das pausas e inventa frases no
// silêncio; ouvindo a fala colada, ele junta tomadas repetidas numa só. Ilha por ilha, cada
// tentativa aparece separada e com o tempo certo.
const TAXA = 16000;
const wav = readFileSync("work/audio.wav");
const pcm = wav.subarray(wav.indexOf("data", 12, "ascii") + 8);
const ilhas = [];
let cursorFala = 0;
for (const s of [...silencios, { de: duracao, ate: duracao }]) {
  if (s.de - cursorFala > 0.2) {
    const de = Math.max(0, cursorFala - 0.2);
    const ate = Math.min(duracao, s.de + 0.2);
    const anterior = ilhas[ilhas.length - 1];
    if (anterior && de <= anterior.ate) anterior.ate = ate;
    else ilhas.push({ de, ate });
  }
  cursorFala = s.ate;
}

const gravarWav = (arquivo, dados) => {
  const c = Buffer.alloc(44);
  c.write("RIFF", 0);
  c.writeUInt32LE(36 + dados.length, 4);
  c.write("WAVEfmt ", 8);
  c.writeUInt32LE(16, 16);
  c.writeUInt16LE(1, 20);
  c.writeUInt16LE(1, 22);
  c.writeUInt32LE(TAXA, 24);
  c.writeUInt32LE(TAXA * 2, 28);
  c.writeUInt16LE(2, 32);
  c.writeUInt16LE(16, 34);
  c.write("data", 36);
  c.writeUInt32LE(dados.length, 40);
  writeFileSync(arquivo, Buffer.concat([c, dados]));
};

// (Demandou) --palavras: a transcrição já feita (tempo por palavra, na linha do tempo do
// original, [{ em, ate, w }]). Com ela o Whisper não roda; o resto do passo é o mesmo.
const palavras = [];
const pausasCurtas = [];
const palavrasExternas = opcoes.palavras ? JSON.parse(readFileSync(opcoes.palavras, "utf8")) : null;
if (palavrasExternas) {
  const { stderr: saidaCurta } = ffmpeg(["-i", origem, "-map", "0:a:0", "-af", `silencedetect=noise=${limiar}dB:d=0.2`, "-f", "null", "-"]);
  let comeco = null;
  for (const linha of saidaCurta.split("\n")) {
    const a = linha.match(/silence_start: ([\d.-]+)/);
    const b = linha.match(/silence_end: ([\d.-]+)/);
    if (a) comeco = Math.max(0, Number(a[1]));
    if (b && comeco !== null) {
      pausasCurtas.push({ de: comeco, ate: Number(b[1]) });
      comeco = null;
    }
  }
  for (const p of palavrasExternas) {
    const em = Number(Math.max(0, Math.min(duracao, Number(p.em))).toFixed(3));
    const ate = Number(Math.max(em + 0.05, Math.min(duracao, Number(p.ate))).toFixed(3));
    const w = String(p.w ?? "").trim();
    if (w) palavras.push({ em, ate, w });
  }
  palavras.sort((a, b) => a.em - b.em);
  rmSync("work/ilhas", { recursive: true, force: true });
  rmSync("work/audio.wav", { force: true });
} else {
const { downloadWhisperModel, installWhisperCpp, toCaptions, transcribe } = await import("@remotion/install-whisper-cpp");
console.log(`Transcrevendo a fala em ${ilhas.length} bloco(s) (${modelo}, ${idioma})…`);
console.log("Na primeira vez o Whisper é compilado e o modelo (1,6 GB) é baixado: leva alguns minutos.");
await installWhisperCpp({ to: PASTA_WHISPER, version: VERSAO_WHISPER, printOutput: false });
mkdirSync(PASTA_MODELOS, { recursive: true });
await downloadWhisperModel({ model: modelo, folder: PASTA_MODELOS, printOutput: false });

// Pausas curtas (a partir de 0,2 s): usadas para tirar palavra de dentro de pausa e para
// redistribuir as palavras de um trecho em que o Whisper devolveu tempos quebrados
{
  const { stderr: saidaCurta } = ffmpeg(["-i", origem, "-map", "0:a:0", "-af", `silencedetect=noise=${limiar}dB:d=0.2`, "-f", "null", "-"]);
  let comeco = null;
  for (const linha of saidaCurta.split("\n")) {
    const a = linha.match(/silence_start: ([\d.-]+)/);
    const b = linha.match(/silence_end: ([\d.-]+)/);
    if (a) comeco = Math.max(0, Number(a[1]));
    if (b && comeco !== null) {
      pausasCurtas.push({ de: comeco, ate: Number(b[1]) });
      comeco = null;
    }
  }
}

// Às vezes o Whisper devolve os tempos de um trecho quebrados: várias palavras espremidas em
// centésimos de segundo e outra "durando" segundos. Aí o corte descartava palavras e a legenda
// saía fora do tempo. Nesses trechos as palavras são redistribuídas pela fala do trecho (sem as
// pausas), na proporção das sílabas: erro de ~0,1–0,2 s em vez de palavras perdidas.
const silabas = (w) => {
  // número escrito em algarismos ("1/4", "2007") é falado com várias sílabas
  const digitos = (w.match(/\d/g) ?? []).length;
  const vogais = (w.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[aeiouy]+/gi) ?? []).length;
  return Math.max(1, vogais + Math.ceil(digitos * 1.5));
};
const temposQuebrados = (lista) => {
  if (lista.some((p) => p.ate - p.em > 1.5)) return true;
  let seguidas = 0;
  for (const p of lista) {
    seguidas = p.ate - p.em <= 0.06 ? seguidas + 1 : 0;
    if (seguidas >= 3) return true;
  }
  return false;
};
const redistribuir = (lista, de, ate) => {
  let partes = [{ de, ate }];
  for (const z of pausasCurtas) {
    partes = partes.flatMap((q) =>
      z.ate <= q.de || z.de >= q.ate
        ? [q]
        : [...(z.de > q.de ? [{ de: q.de, ate: z.de }] : []), ...(z.ate < q.ate ? [{ de: z.ate, ate: q.ate }] : [])],
    );
  }
  partes = partes.filter((q) => q.ate - q.de > 0.05);
  const total = partes.reduce((soma, q) => soma + q.ate - q.de, 0);
  if (total <= 0) return false;
  const pesos = lista.map((p) => silabas(p.w));
  const acum = [0];
  pesos.forEach((w, i) => acum.push(acum[i] + w));
  const ritmo = acum[acum.length - 1] / total; // sílabas por segundo de fala
  // Cada pedaço de fala (entre pausas) recebe um grupo seguido de palavras: escolhe a divisão em que
  // cada pedaço fica com o ritmo mais parecido com o do trecho, preferindo pausa depois de vírgula/ponto
  const P = partes.length;
  const N = lista.length;
  const custo = (i, j, k) => {
    const d = partes[k].ate - partes[k].de;
    if (j === i) return d < 0.3 ? 0 : 4;
    let c = Math.log((acum[j] - acum[i]) / d / ritmo) ** 2;
    if (k < P - 1 && !/[,.;:!?…]$/.test(lista[j - 1].w)) c += 0.3;
    return c;
  };
  const melhor = Array.from({ length: P + 1 }, () => new Array(N + 1).fill(Infinity));
  const volta = Array.from({ length: P + 1 }, () => new Array(N + 1).fill(-1));
  melhor[0][0] = 0;
  for (let k = 0; k < P; k++)
    for (let i = 0; i <= N; i++) {
      if (!Number.isFinite(melhor[k][i])) continue;
      for (let j = i; j <= N; j++) {
        const v = melhor[k][i] + custo(i, j, k);
        if (v < melhor[k + 1][j]) {
          melhor[k + 1][j] = v;
          volta[k + 1][j] = i;
        }
      }
    }
  const cortes = [N];
  for (let k = P; k > 0; k--) cortes.unshift(volta[k][cortes[0]]);
  // dentro de cada pedaço, as palavras dividem o tempo na proporção das sílabas
  for (let k = 0; k < P; k++) {
    const [i, j] = [cortes[k], cortes[k + 1]];
    const d = partes[k].ate - partes[k].de;
    for (let n = i; n < j; n++) {
      const p = lista[n];
      p.em = Number((partes[k].de + ((acum[n] - acum[i]) / (acum[j] - acum[i])) * d + 0.001).toFixed(3));
      p.ate = Number(Math.max(partes[k].de + ((acum[n + 1] - acum[i]) / (acum[j] - acum[i])) * d, p.em + 0.05).toFixed(3));
    }
  }
  return true;
};

// frases que o Whisper inventa em trechos sem fala de verdade
const ALUCINACAO = /amara\.org|legendas pela comunidade|inscreva-se no canal/i;
mkdirSync("work/ilhas", { recursive: true });
for (const [n, ilha] of ilhas.entries()) {
  const arquivo = path.resolve(`work/ilhas/${String(n).padStart(4, "0")}.wav`);
  // O Whisper descarta áudio com menos de 1 s (uma palavra solta entre pausas voltava vazia):
  // o trecho curto ganha silêncio no fim até 1,5 s. O tempo das palavras não muda.
  const janela = { de: ilha.de, ate: ilha.ate };
  const trecho = pcm.subarray(Math.floor(ilha.de * TAXA) * 2, Math.floor(ilha.ate * TAXA) * 2);
  const completar = Math.max(0, Math.floor(1.5 * TAXA) * 2 - trecho.length);
  gravarWav(arquivo, Buffer.concat([trecho, Buffer.alloc(completar)]));
  const saida = await transcribe({
    inputPath: arquivo,
    whisperPath: PASTA_WHISPER,
    whisperCppVersion: VERSAO_WHISPER,
    model: modelo,
    modelFolder: PASTA_MODELOS,
    language: idioma,
    tokenLevelTimestamps: true,
    printOutput: false,
  });
  const { captions } = toCaptions({ whisperCppOutput: saida });
  const daIlha = [];
  for (const c of captions) {
    const texto = c.text;
    if (!texto.trim()) continue;
    const em = Number(Math.min(janela.ate, janela.de + c.startMs / 1000).toFixed(3));
    const ate = Number(Math.min(janela.ate, janela.de + c.endMs / 1000).toFixed(3));
    if (texto.startsWith(" ") || daIlha.length === 0) daIlha.push({ em, ate: Math.max(ate, em + 0.05), w: texto.trim() });
    else {
      const ultima = daIlha[daIlha.length - 1];
      ultima.w += texto.trim();
      ultima.ate = Math.max(ate, ultima.ate);
    }
  }
  // nada fora do trecho (o silêncio de complemento não tem fala)
  const doTrecho = daIlha.filter((p) => p.em < ilha.ate);
  // a ordem das palavras é a da transcrição; os tempos às vezes voltam fora de ordem em palavras
  // curtas, então cada palavra começa depois da anterior e a anterior termina onde esta começa
  const ultimaAntes = palavras[palavras.length - 1];
  doTrecho.forEach((p, k) => {
    const anterior = k > 0 ? doTrecho[k - 1] : ultimaAntes;
    if (anterior) {
      p.em = Number(Math.max(p.em, anterior.em + 0.02).toFixed(3));
      anterior.ate = Number(Math.min(Math.max(anterior.ate, anterior.em + 0.02), p.em).toFixed(3));
    }
    p.ate = Number(Math.max(p.ate, p.em + 0.05).toFixed(3));
  });
  if (doTrecho.length >= 2 && temposQuebrados(doTrecho) && redistribuir(doTrecho, ilha.de, ilha.ate)) {
    console.log(`  aviso: tempos do Whisper quebrados em ${mmss(ilha.de)}–${mmss(ilha.ate)}; palavras redistribuídas pela fala do trecho (confira nos quadros)`);
  }
  // (testado: passar o texto anterior como --prompt melhora uma palavra ou outra, mas adianta
  // o tempo das palavras em até 0,5 s; tempo certo vale mais — erro de palavra vai em `correcoes`)
  // trecho curto que vira só "Obrigado." / "E aí" costuma ser respiro ou ruído completado com silêncio
  const textoCurto = doTrecho.map((p) => p.w).join(" ");
  const inventado = ilha.ate - ilha.de < 0.9 && /^(obrigad[oa]|e aí|aí|tchau|valeu|hum+|ah+|é|tá)[.!?,…]*$/i.test(textoCurto.trim());
  if (!ALUCINACAO.test(textoCurto) && !inventado) palavras.push(...doTrecho);
  if ((n + 1) % 10 === 0) console.log(`  ${n + 1}/${ilhas.length}`);
}
}
// Palavra não começa no meio de uma pausa: se o tempo caiu dentro de uma pausa, ela começa quando a fala volta
for (const p of palavras) {
  const pausa = pausasCurtas.find((z) => p.em > z.de + 0.03 && p.em < z.ate - 0.03);
  if (pausa) p.em = Number(Math.min(pausa.ate, p.ate - 0.03).toFixed(3));
}
palavras.forEach((p, k) => {
  const anterior = palavras[k - 1];
  if (anterior && p.em <= anterior.em) p.em = Number((anterior.em + 0.02).toFixed(3));
  if (anterior && anterior.ate > p.em) anterior.ate = p.em;
  p.ate = Number(Math.max(p.ate, p.em + 0.05).toFixed(3));
});
rmSync("work/ilhas", { recursive: true, force: true });
rmSync("work/audio.wav", { force: true });

// 4. Proposta de cortes: um item por trecho de fala (entre pausas de 0,35 s ou mais).
// Um item por trecho deixa cada tentativa separada: basta marcar "manter": false nas que saem.
// O cortar junta de volta os trechos vizinhos mantidos quando a pausa entre eles é natural.
const FOLGA_ANTES = 0.1;
const FOLGA_DEPOIS = 0.16;
const falas = [];
let cursor = 0;
for (const s of [...silencios, { de: duracao, ate: duracao }]) {
  if (s.de - cursor > 0.12) {
    falas.push({ de: Math.max(0, cursor - FOLGA_ANTES), ate: Math.min(duracao, s.de + FOLGA_DEPOIS) });
  }
  cursor = s.ate;
}
// o último trecho ganha um respiro no fim, para o vídeo não acabar em cima da última sílaba
if (falas.length > 0) falas[falas.length - 1].ate = Math.min(duracao, falas[falas.length - 1].ate + 0.45);

// frases dentro de cada trecho, com o tempo de início, para dividir um trecho quando só parte dele presta
const frasesDe = (lista) => {
  const frases = [];
  let atual = [];
  lista.forEach((p, i) => {
    atual.push(p);
    const prox = lista[i + 1];
    if (!prox || /[.?!…]$/.test(p.w) || prox.em - p.ate > 0.3) {
      frases.push({ em: Number(atual[0].em.toFixed(2)), texto: atual.map((x) => x.w).join(" ") });
      atual = [];
    }
  });
  return frases;
};
// cada palavra vai para o trecho mais próximo (as que caem na folga entre dois trechos não somem)
const distancia = (t, f) => (t < f.de ? f.de - t : t > f.ate ? t - f.ate : 0);
const donoDe = palavras.map((p) => {
  const meio = (p.em + p.ate) / 2;
  let melhor = 0;
  falas.forEach((f, k) => {
    if (distancia(meio, f) < distancia(meio, falas[melhor])) melhor = k;
  });
  return melhor;
});
// volume médio (dB) de um trecho do áudio de 16 kHz que ficou na memória
const volumeDb = (de, ate) => {
  const a = Math.max(0, Math.floor(de * TAXA));
  const b = Math.min(Math.floor(pcm.length / 2), Math.floor(ate * TAXA));
  let soma = 0;
  for (let i = a; i < b; i++) {
    const v = pcm.readInt16LE(i * 2) / 32768;
    soma += v * v;
  }
  return b > a ? 10 * Math.log10(soma / (b - a) + 1e-12) : -120;
};
const comTexto = falas.filter((_, k) => donoDe.includes(k)).map((f) => volumeDb(f.de, f.ate)).sort((x, y) => x - y);
const volumeDaFala = comTexto.length ? comTexto[Math.floor(comTexto.length / 2)] : -30;
const cortes = falas.map((f, k) => {
  const dela = palavras.filter((_, i) => donoDe[i] === k);
  const frases = frasesDe(dela);
  // sem palavras reconhecidas: pode ser respiro/ruído (sai) ou uma palavra curta e solta que a
  // transcrição perdeu, como um "Um:" de lista. Trecho com volume de fala fica e pede conferência.
  const semTexto = dela.length === 0;
  const longo = f.ate - f.de >= 0.7;
  const temVozDeFala = semTexto && volumeDb(f.de, f.ate) >= volumeDaFala - 9;
  const fica = !semTexto || longo || temVozDeFala;
  return {
    de: Number(f.de.toFixed(3)),
    ate: Number(f.ate.toFixed(3)),
    manter: fica,
    ...(semTexto && fica
      ? { conferir: longo ? "sem transcrição: ouça antes de tirar" : "palavra curta sem transcrição (ex.: \"Um:\"): ouça e, se for fala, ponha a palavra no plano" }
      : {}),
    texto: frases.map((x) => x.texto).join(" "),
    frases,
  };
});

// 5. Três quadros do original (começo, meio, fim) com uma grade em frações por cima,
// para medir onde ficam o rosto e o queixo (e o quanto a pessoa se mexe)
mkdirSync("public/medir", { recursive: true });
const alturaQuadro = 960;
const larguraQuadro = Math.round((largura / altura) * alturaQuadro / 2) * 2;
[0.15, 0.5, 0.85].forEach((fracao, i) => {
  ffmpeg(["-y", "-ss", String(duracao * fracao), "-i", origem, "-frames:v", "1", "-vf", `scale=${larguraQuadro}:${alturaQuadro}`, `public/medir/quadro-${i + 1}.jpg`]);
});
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
try {
  for (const i of [1, 2, 3]) {
    const inputProps = { imagem: `medir/quadro-${i}.jpg`, largura: larguraQuadro, altura: alturaQuadro };
    const composition = await selectComposition({ serveUrl, id: "Medir", inputProps });
    await renderStill({ composition, serveUrl, frame: 0, output: `work/medir-${i}.jpg`, inputProps, imageFormat: "jpeg", logLevel: "error" });
  }
} finally {
  rmSync(serveUrl, { recursive: true, force: true });
  rmSync("public/medir", { recursive: true, force: true });
}

gravarJson("work/analise.json", { origem, largura, altura, rotacao, fps, duracao, hdr, volume, palavras, silencios });
gravarJson("work/cortes.json", cortes);

console.log(`\nVídeo: ${largura}×${altura}, ${fps.toFixed(2)} fps, ${duracao.toFixed(1)} s${hdr ? ", HDR" : ""}`);
// o modelo.json do template diz se o vídeo final é vertical (padrão) ou 16:9
const entrega16x9 = existsSync("modelo.json") && JSON.parse(readFileSync("modelo.json", "utf8")).formato === "16:9";
console.log(
  `Formato: ${
    entrega16x9
      ? largura > altura
        ? "horizontal — este modelo entrega 16:9 (1920×1080); o vídeo entra inteiro"
        : "vertical — este modelo entrega 16:9 (1920×1080): o cortar usa uma faixa deitada em volta do rosto (para a melhor imagem, grave deitado)"
      : largura > altura
        ? "horizontal — o cortar recorta em volta do rosto"
        : "vertical"
  }`,
);
console.log(`\nTrechos de fala (work/cortes.json) — cada linha recuada é uma frase, com o tempo em que começa:`);
cortes.forEach((c, i) => {
  // fala normal tem 2 a 4 palavras por segundo; bem menos que isso costuma esconder tomadas repetidas
  const porSegundo = c.texto ? c.texto.split(" ").length / (c.ate - c.de) : 0;
  const aviso = c.manter && c.ate - c.de > 3 && porSegundo < 1.4 ? "  [conferir: pouca fala para a duração]" : "";
  const marca = c.conferir ? `  [${c.conferir}]` : c.manter ? "" : "  [sem fala, sai]";
  console.log(`${String(i + 1).padStart(3)}. ${mmss(c.de)} → ${mmss(c.ate)}${marca}${aviso}`);
  c.frases.forEach((f) => console.log(`        ${mmss(f.em)}  ${f.texto}`));
});
const mantido = cortes.filter((c) => c.manter).reduce((t, c) => t + c.ate - c.de, 0);
console.log(`\nSe nada sair: ${mantido.toFixed(1)} s de ${duracao.toFixed(1)} s.`);
console.log("Para medir rosto e queixo: work/medir-1.jpg, -2 e -3 (a grade marca frações de 0,05 em 0,05).");
console.log(
  cortes.length === 1
    ? "Um trecho só: a gravação é contínua e não há o que cortar além das pontas. Siga para: node scripts/cortar.mjs"
    : 'Revise work/cortes.json: marque "manter": false nas tentativas repetidas ou erradas (fica a última completa), depois rode: node scripts/cortar.mjs',
);
