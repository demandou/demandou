/**
 * A PROVA DO JUNTAR (08/10/2026): três vídeos curtos gerados aqui, cada um de
 * um jeito, juntados pelo mesmo código do worker (src/juntar-partes.mjs) e
 * medidos depois. Nada de storage nem de app: só ffmpeg, na máquina.
 *
 *   parte 1: deitada 1920x1080, 30 quadros, vermelha, som 48 kHz estéreo baixinho
 *   parte 2: celular EM PÉ (1920x1080 com rotação 90, exibe 1080x1920), 25
 *            quadros, verde, som 44,1 kHz mono alto
 *   parte 3: 1280x720, 60 quadros, azul, som que COMEÇA 0,2 s depois do vídeo
 *
 * Em cada parte há dois clarões brancos (1,0 s e 2,4 s) e, no mesmo instante,
 * dois bipes de 3 kHz. Depois de juntar, a prova confere:
 *
 *   - a duração do vídeo e do áudio contra a soma das partes;
 *   - a ORDEM, pela cor do meio de cada trecho (vermelho, verde, azul);
 *   - a SINCRONIA, bipe contra clarão, em cada um dos seis eventos;
 *   - o VOLUME igualado, pela loudness de cada trecho antes e depois.
 *
 * Rodar com o ffmpeg do contêiner (5.1), que é o que vale:
 *   PATH=~/ff51:$PATH node worker/prova-juntar-partes.mjs [pasta]
 * Sai com código 1 se alguma conferência falhar.
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { juntarArquivos, sondar } from "./src/juntar-partes.mjs";

const TOLERANCIA_DA_SINCRONIA_S = 0.034; // um quadro a 30
// 1,0 e 2,4 caem na grade de 25, de 30 e de 60 quadros (múltiplos de 0,2 s):
// assim o clarão de cada parte começa no instante exato do bipe na origem.
const EVENTOS_LOCAIS = [1.0, 2.4];

function executar(bin, args, { cwd } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve({ out, err }) : reject(new Error(`${bin} saiu com ${code}: ${err.slice(-1500)}`))));
  });
}
const ffmpeg = (args, opts) => executar("ffmpeg", ["-hide_banner", "-nostdin", "-y", ...args], opts);

function somDaParte({ freqDoFundo, amplitude, duracao, atraso = 0 }) {
  // Os bipes caem no tempo de APRESENTAÇÃO; com o áudio atrasado, o relógio
  // dele começa `atraso` depois.
  const bipes = EVENTOS_LOCAIS.map((t) => `between(t,${(t - atraso).toFixed(3)},${(t - atraso + 0.1).toFixed(3)})`).join("+");
  return `aevalsrc='${amplitude}*sin(2*PI*${freqDoFundo}*t)+${amplitude}*sin(2*PI*3000*t)*(${bipes})':d=${(duracao - atraso).toFixed(3)}`;
}

function imagemDaParte({ cor, largura, altura, fps, duracao }) {
  const clarao = EVENTOS_LOCAIS.map((t) => `between(t,${t},${(t + 0.099).toFixed(3)})`).join("+");
  return `color=c=${cor}:s=${largura}x${altura}:r=${fps}:d=${duracao},drawbox=x=0:y=0:w=iw:h=ih:color=white:t=fill:enable='${clarao}'`;
}

async function gerarPartes(pasta) {
  const a = join(pasta, "parte-1-deitada.mp4");
  await ffmpeg([
    "-f", "lavfi", "-i", imagemDaParte({ cor: "red", largura: 1920, altura: 1080, fps: 30, duracao: 4 }),
    "-f", "lavfi", "-i", `${somDaParte({ freqDoFundo: 300, amplitude: 0.03, duracao: 4 })}:s=48000:c=stereo`,
    "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ac", "2", "-shortest", a,
  ]);

  // O celular em pé: o quadro é gravado DEITADO e o arquivo leva a marca
  // "gire 90" (matriz de exibição), como sai de um telefone de verdade.
  const deitada = join(pasta, "parte-2-sem-rotacao.mp4");
  await ffmpeg([
    "-f", "lavfi", "-i", imagemDaParte({ cor: "green", largura: 1920, altura: 1080, fps: 25, duracao: 3.5 }),
    "-f", "lavfi", "-i", `${somDaParte({ freqDoFundo: 400, amplitude: 0.45, duracao: 3.5 })}:s=44100`,
    "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ac", "1", "-ar", "44100", "-shortest", deitada,
  ]);
  const b = join(pasta, "parte-2-em-pe.mp4");
  // Até o ffmpeg 4 a marca vem pela tag `rotate`; do 6 em diante, pela opção
  // de entrada `-display_rotation`. O 5.1 do contêiner não grava nenhuma das
  // duas, então a marca sai de outro ffmpeg (FFMPEG_DA_ROTACAO), só por cópia:
  // o vídeo é o mesmo, muda só o cabeçalho.
  await ffmpeg(["-i", deitada, "-c", "copy", "-metadata:s:v:0", "rotate=90", b]).catch(() => {});
  if (Math.abs((await sondar(b).catch(() => ({ rotacao: 0 }))).rotacao) !== 90) {
    await executar(process.env.FFMPEG_DA_ROTACAO || "ffmpeg", ["-hide_banner", "-nostdin", "-y", "-display_rotation", "90", "-i", deitada, "-c", "copy", b]);
  }
  if (Math.abs((await sondar(b)).rotacao) !== 90) throw new Error("não consegui gerar a parte em pé com a marca de rotação");
  await rm(deitada, { force: true });

  const c = join(pasta, "parte-3-60qps-som-atrasado.mp4");
  await ffmpeg([
    "-f", "lavfi", "-i", imagemDaParte({ cor: "blue", largura: 1280, altura: 720, fps: 60, duracao: 3 }),
    "-itsoffset", "0.2",
    "-f", "lavfi", "-i", `${somDaParte({ freqDoFundo: 500, amplitude: 0.15, duracao: 3, atraso: 0.2 })}:s=48000:c=stereo`,
    "-map", "0:v", "-map", "1:a",
    "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ac", "2", c,
  ]);
  return [a, b, c];
}

/** Os começos dos clarões: quadro com o centro branco depois de um que não era. */
async function claroes(arquivo) {
  const { err } = await ffmpeg(["-i", arquivo, "-an", "-vf", "crop=160:160:(iw-160)/2:(ih-160)/2,signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-f", "null", "-"]);
  const inicios = [];
  let t = null;
  let antes = false;
  for (const linha of err.split("\n")) {
    const m = linha.match(/pts_time:([\d.]+)/);
    if (m) t = Number(m[1]);
    const y = linha.match(/YAVG=([\d.]+)/);
    if (y && t !== null) {
      const branco = Number(y[1]) > 200;
      if (branco && !antes) inicios.push(t);
      antes = branco;
    }
  }
  return inicios;
}

/** Os começos dos bipes: o fim de cada silêncio depois do filtro que só deixa os 3 kHz. */
async function bipes(arquivo) {
  const { err } = await ffmpeg(["-i", arquivo, "-vn", "-af", "highpass=f=2000,highpass=f=2000,highpass=f=2000,silencedetect=n=-45dB:d=0.05", "-f", "null", "-"]);
  return [...err.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
}

/** A cor do centro num instante: vermelho, verde ou azul, pelo U e V médios. */
async function corEm(arquivo, t) {
  const { err } = await ffmpeg(["-ss", String(t), "-i", arquivo, "-frames:v", "1", "-an", "-vf", "crop=160:160:(iw-160)/2:(ih-160)/2,signalstats,metadata=print", "-f", "null", "-"]);
  const u = Number(err.match(/UAVG=([\d.]+)/)?.[1]);
  const v = Number(err.match(/VAVG=([\d.]+)/)?.[1]);
  const ref = { vermelho: [90, 240], verde: [54, 34], azul: [240, 110] };
  return Object.entries(ref).sort(([, a], [, b]) => Math.hypot(a[0] - u, a[1] - v) - Math.hypot(b[0] - u, b[1] - v))[0][0];
}

/** Loudness integrada (LUFS) de um trecho do áudio. */
async function loudness(arquivo, de, ate) {
  const { err } = await ffmpeg(["-i", arquivo, "-vn", "-af", `atrim=${de}:${ate},ebur128`, "-f", "null", "-"]);
  const todos = [...err.matchAll(/I:\s+(-?[\d.]+) LUFS/g)];
  return Number(todos.at(-1)?.[1]);
}

async function main() {
  const pasta = process.argv[2] ?? (await mkdtemp(join(tmpdir(), "prova-juntar-")));
  const versao = (await executar("ffmpeg", ["-version"])).out.split("\n")[0];
  const fontes = await gerarPartes(pasta);
  const entradas = [];
  for (const f of fontes) entradas.push(await sondar(f));
  const loudAntes = [];
  for (let i = 0; i < fontes.length; i++) loudAntes.push(await loudness(fontes[i], 0, entradas[i].duracaoSeg));

  const { arquivo, plano, final, conferencia } = await juntarArquivos(fontes, pasta, { log: (m) => console.log(`[juntar] ${m}`) });

  // Onde cada parte começa na linha do tempo juntada.
  const inicios = [];
  let acumulado = 0;
  for (const p of plano.partes) {
    inicios.push(acumulado);
    acumulado += p.duracaoSeg;
  }
  const esperados = inicios.flatMap((t0) => EVENTOS_LOCAIS.map((t) => Number((t0 + t).toFixed(3))));
  const vistos = await claroes(arquivo);
  const ouvidos = await bipes(arquivo);
  const sincronia = esperados.map((e) => {
    const clarao = vistos.find((t) => Math.abs(t - e) < 0.3);
    const bipe = ouvidos.find((t) => Math.abs(t - e) < 0.3);
    return {
      esperado: e,
      clarao: clarao ?? null,
      bipe: bipe ?? null,
      descompassoMs: clarao !== undefined && bipe !== undefined ? Math.round((bipe - clarao) * 1000) : null,
    };
  });
  const ordem = [];
  for (const t0 of inicios) ordem.push(await corEm(arquivo, t0 + 0.5));
  const loudDepois = [];
  for (let i = 0; i < plano.partes.length; i++) loudDepois.push(await loudness(arquivo, inicios[i] + 0.2, inicios[i] + plano.partes[i].duracaoSeg - 0.05));
  const espalhamento = (xs) => Math.max(...xs) - Math.min(...xs);

  const relatorio = {
    ffmpeg: versao,
    entradas: entradas.map((e, i) => ({ arquivo: fontes[i].split(/[\\/]/).pop(), largura: e.largura, altura: e.altura, rotacao: e.rotacao, fps: Number(e.fps.toFixed(2)), video: Number(e.duracaoVideoSeg.toFixed(3)), audio: Number(e.duracaoAudioSeg.toFixed(3)) })),
    saida: { largura: final.largura, altura: final.altura, rotacao: final.rotacao, fps: final.fps, video: final.duracaoVideoSeg, audio: final.duracaoAudioSeg, somaDasPartes: plano.somaSeg, diferencaSeg: Number(conferencia.diferencaSeg.toFixed(4)) },
    preenchidas: plano.partes.filter((p) => p.preenche).map((p) => p.indice + 1),
    ordem,
    sincronia,
    loudnessAntes: loudAntes,
    loudnessDepois: loudDepois,
  };
  const falhas = [];
  if (!conferencia.ok) falhas.push(...conferencia.motivos);
  if (ordem.join(",") !== "vermelho,verde,azul") falhas.push(`ordem errada: ${ordem.join(", ")}`);
  for (const s of sincronia) {
    if (s.descompassoMs === null) falhas.push(`evento em ${s.esperado} s não achado (clarão ${s.clarao}, bipe ${s.bipe})`);
    else if (Math.abs(s.descompassoMs) > TOLERANCIA_DA_SINCRONIA_S * 1000) falhas.push(`descompasso de ${s.descompassoMs} ms em ${s.esperado} s`);
    if (s.clarao !== null && Math.abs(s.clarao - s.esperado) > 0.04) falhas.push(`clarão de ${s.esperado} s caiu em ${s.clarao} s`);
  }
  if (final.rotacao !== 0) falhas.push(`a saída ficou com rotação ${final.rotacao}`);
  if (!(espalhamento(loudDepois) < 2.5)) falhas.push(`volume não igualou: ${loudDepois.join(", ")} LUFS`);
  console.log(JSON.stringify({ ...relatorio, falhas }, null, 2));
  if (!process.argv[2]) await rm(pasta, { recursive: true, force: true }).catch(() => {});
  process.exit(falhas.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
