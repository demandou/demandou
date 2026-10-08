import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { rodar as rodarNoWorker } from "./ffmpeg.mjs";

/**
 * JUNTAR AS PARTES DA GRAVAÇÃO (08/10/2026).
 *
 * O pedido do Bruno: "alguns usuários vão subir mais de um arquivo de vídeo
 * para edição, às vezes eles gravam em 2, 3 vezes". A pessoa escolhe a ordem
 * na tela (1, 2, 3) e confirma; aqui as partes viram UM vídeo, que passa a ser
 * a gravação do trabalho. Depois disto a esteira é a de sempre: transcrição,
 * seleção, roteiro, cortes e completo leem um arquivo só e não sabem que ele
 * nasceu em partes.
 *
 * ## Por que normalizar antes de emendar
 *
 * Cada parte pode vir de um aparelho diferente: o celular em pé a 30 quadros,
 * a câmera deitada a 25, a tela gravada a 60, um áudio a 44,1 kHz mono e outro
 * a 48 kHz estéreo, um baixinho e outro alto. Emendar por cópia juntaria tudo
 * isso no mesmo fluxo, e o player (e todo ffmpeg depois deste) se perde. Então
 * cada parte sai igual às outras:
 *
 *   - resolução e orientação da MAIOR parte (a de mais pixels; no empate, a
 *     mais longa). Parte de outra orientação ou proporção entra inteira, com
 *     faixa preta (preenchimento), e nunca esticada nem cortada;
 *   - 30 quadros por segundo, quadro a quadro na grade (setpts por índice);
 *   - áudio 48 kHz estéreo, com o volume igualado pelo loudnorm;
 *   - cor marcada como BT.709, para o cabeçalho do H.264 ser o mesmo em todas.
 *
 * ## A sincronia, que é o que não pode falhar
 *
 * Três cuidados, e cada um fecha um jeito conhecido de dessincronizar:
 *
 * 1. O deslocamento entre áudio e vídeo de cada arquivo é preservado: o
 *    ffmpeg já desloca os dois fluxos pelo mesmo início do arquivo, e aqui
 *    nada usa PTS-STARTPTS por fluxo (que apagaria a diferença). O vídeo que
 *    começa depois do áudio ganha o primeiro quadro repetido (fps com
 *    start_time=0), e o áudio que começa depois ganha silêncio (aresample
 *    first_pts=0).
 * 2. Cada parte sai com a MESMA duração nos dois fluxos, exata: N quadros a 30
 *    por segundo e N x 1600 amostras a 48 kHz. O vídeo curto repete o último
 *    quadro (tpad) e o áudio curto ganha silêncio (apad) antes do corte exato.
 * 3. O áudio intermediário é PCM, sem o quadro de 1024 amostras do AAC: a
 *    emenda por cópia de AAC deixa até 21 ms de sobra por parte, que viram
 *    salto ou eco na emenda. O AAC sai uma vez só, no arquivo final.
 *
 * No fim a duração do arquivo é conferida contra a soma das partes, e os dois
 * fluxos contra si mesmos. Se não bater, o passo falha com o motivo, em vez de
 * entregar à esteira um vídeo com a fala fora da boca.
 *
 * ## ffmpeg 5.1 (o do contêiner)
 *
 * Tudo aqui existe no 5.1 e foi provado nele (worker/prova-juntar-partes.mjs):
 * `fps:start_time`, `scale:force_divisible_by`, `tpad`, `loudnorm`, o
 * demuxer de concatenação. Cada parte é normalizada num ffmpeg próprio, com
 * grafo simples: se a gravação mudar de resolução no meio, o grafo se refaz
 * sozinho naquela parte, sem derrubar a emenda inteira.
 */

export const FPS_DA_JUNCAO = 30;
export const AMOSTRAGEM_DA_JUNCAO = 48000;
/** Amostras de áudio por quadro: 48000 / 30. */
const AMOSTRAS_POR_QUADRO = AMOSTRAGEM_DA_JUNCAO / FPS_DA_JUNCAO;
/** O volume igualado das partes. -16 deixa folga: o nivelamento das entregas (-14) vem depois. */
export const NIVELAR_PARTES = "loudnorm=I=-16:TP=-1.5:LRA=11";
/** Áudio que passa do fim do vídeo além disto é sobra do arquivo, e não fala. */
const SOBRA_MAXIMA_DE_AUDIO_S = 1;

const par = (n) => Math.max(2, Math.floor(n) - (Math.floor(n) % 2));

/** "horizontal", "vertical" ou "quadrado", pelas dimensões já giradas. */
export function orientacaoDe(largura, altura) {
  if (largura > altura) return "horizontal";
  if (altura > largura) return "vertical";
  return "quadrado";
}

/** A rotação que o player aplica, em graus (matriz de exibição ou tag antiga). */
function rotacaoDoFluxo(video) {
  for (const sd of video?.side_data_list ?? []) {
    if (sd?.rotation != null && Number.isFinite(Number(sd.rotation))) return Math.round(Number(sd.rotation));
  }
  const tag = Number(video?.tags?.rotate);
  return Number.isFinite(tag) ? Math.round(tag) : 0;
}

function numero(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function fpsDe(texto) {
  const [a, b] = String(texto ?? "").split("/").map(Number);
  if (!a) return 0;
  return b ? a / b : a;
}

/**
 * Lê o que o plano precisa de UMA parte, a partir do JSON do ffprobe. Pura,
 * para os testes: `sondar` só roda o ffprobe e passa a saída para cá.
 */
export function lerSondagem(json) {
  const streams = json?.streams ?? [];
  // Capa embutida (attached_pic) não é o vídeo; codec desconhecido ("none") não decodifica.
  const video = streams.find((s) => s.codec_type === "video" && !s.disposition?.attached_pic && s.codec_name && s.codec_name !== "none");
  const audio = streams.find((s) => s.codec_type === "audio" && s.codec_name && s.codec_name !== "none");
  const rotacao = rotacaoDoFluxo(video);
  const girado = Math.abs(rotacao) % 180 === 90;
  const w = numero(video?.width);
  const h = numero(video?.height);
  const duracaoDoArquivo = numero(json?.format?.duration);
  const duracaoVideoSeg = numero(video?.duration) || duracaoDoArquivo;
  const duracaoAudioSeg = audio ? numero(audio.duration) || duracaoDoArquivo : 0;
  // A parte dura o que o vídeo dura, mais o áudio que sobra depois dele (a
  // última palavra dita depois do último quadro), até um segundo.
  const duracaoSeg = duracaoVideoSeg
    ? Math.max(duracaoVideoSeg, Math.min(duracaoAudioSeg, duracaoVideoSeg + SOBRA_MAXIMA_DE_AUDIO_S))
    : duracaoAudioSeg;
  return {
    indiceDoVideo: video ? Number(video.index) : null,
    indiceDoAudio: audio ? Number(audio.index) : null,
    largura: girado ? h : w,
    altura: girado ? w : h,
    rotacao,
    fps: fpsDe(video?.avg_frame_rate) || fpsDe(video?.r_frame_rate),
    duracaoSeg,
    duracaoVideoSeg,
    duracaoAudioSeg,
    temAudio: Boolean(audio),
    bytes: numero(json?.format?.size),
  };
}

/** Roda o ffprobe num arquivo e devolve a leitura de `lerSondagem`. */
export function sondar(caminho) {
  return new Promise((resolve, reject) => {
    const p = spawn("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", caminho]);
    let saida = "";
    p.stdout.on("data", (d) => (saida += d.toString()));
    p.on("error", reject);
    p.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffprobe saiu com ${code} em ${basename(caminho)}`));
      try {
        resolve(lerSondagem(JSON.parse(saida)));
      } catch (e) {
        reject(e);
      }
    });
  });
}

/**
 * O PLANO DA JUNÇÃO: o quadro de saída e, por parte, quantos quadros ela
 * ocupa. Puro (os testes provam a escolha da maior parte, o preenchimento e a
 * soma das durações sem ffmpeg nenhum).
 */
export function planoDaJuncao(infos) {
  if (!Array.isArray(infos) || infos.length < 2) throw new Error("Juntar pede pelo menos duas partes");
  infos.forEach((p, i) => {
    if (!(p?.largura > 0 && p?.altura > 0) || p.indiceDoVideo === null) throw new Error(`A parte ${i + 1} não tem imagem que dê para ler`);
    if (!(p.duracaoSeg > 0)) throw new Error(`A parte ${i + 1} não tem duração que dê para ler`);
  });
  const area = (p) => p.largura * p.altura;
  let maior = 0;
  for (let i = 1; i < infos.length; i++) {
    const a = area(infos[i]);
    const b = area(infos[maior]);
    if (a > b || (a === b && infos[i].duracaoSeg > infos[maior].duracaoSeg)) maior = i;
  }
  const largura = par(infos[maior].largura);
  const altura = par(infos[maior].altura);
  const orientacao = orientacaoDe(largura, altura);
  const proporcao = largura / altura;
  const partes = infos.map((p, i) => {
    const quadros = Math.max(1, Math.round(p.duracaoSeg * FPS_DA_JUNCAO));
    const duracaoSeg = quadros / FPS_DA_JUNCAO;
    const propria = p.largura / p.altura;
    return {
      indice: i,
      quadros,
      amostras: quadros * AMOSTRAS_POR_QUADRO,
      duracaoSeg,
      orientacao: orientacaoDe(p.largura, p.altura),
      // Outra orientação, ou a mesma com outra proporção (4:3 numa saída
      // 16:9): a parte entra inteira com faixa, e nunca esticada.
      preenche: orientacaoDe(p.largura, p.altura) !== orientacao || Math.abs(propria - proporcao) > 0.01,
      // Quanto de quadro repetido o fim pode precisar (vídeo mais curto que a
      // parte), com folga: o corte exato vem depois.
      repeteNoFim: Math.max(0, duracaoSeg - (p.duracaoVideoSeg || p.duracaoSeg)) + 1,
      temAudio: Boolean(p.temAudio),
      indiceDoVideo: p.indiceDoVideo,
      indiceDoAudio: p.indiceDoAudio,
    };
  });
  const quadrosNaSoma = partes.reduce((t, p) => t + p.quadros, 0);
  return {
    largura,
    altura,
    orientacao,
    maior,
    fps: FPS_DA_JUNCAO,
    amostragem: AMOSTRAGEM_DA_JUNCAO,
    partes,
    quadros: quadrosNaSoma,
    somaSeg: quadrosNaSoma / FPS_DA_JUNCAO,
  };
}

/** O filtro de vídeo de uma parte: quadro da saída, 30 fps e duração exata. */
export function filtroDeVideo(plano, i) {
  const p = plano.partes[i];
  const { largura: W, altura: H, fps } = plano;
  return [
    // A grade de 30 a partir do zero do arquivo: vídeo que começa depois do
    // áudio repete o primeiro quadro até lá, e quadro de tempo negativo sai.
    `fps=${fps}:start_time=0`,
    `scale=${W}:${H}:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=bicubic:out_color_matrix=bt709:out_range=tv`,
    "format=yuv420p",
    // O preenchimento: a parte cabe inteira no quadro e o resto é preto.
    `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`,
    "setsar=1",
    `tpad=stop_mode=clone:stop_duration=${p.repeteNoFim.toFixed(3)}`,
    `trim=end_frame=${p.quadros}`,
    `setpts=N/(${fps}*TB)`,
  ].join(",");
}

/** O filtro de áudio de uma parte: 48 kHz estéreo, volume igualado, amostras exatas. */
export function filtroDeAudio(plano, i) {
  const p = plano.partes[i];
  const fim = `apad,atrim=end_sample=${p.amostras},asetpts=N/SR/TB`;
  const saida = `aformat=sample_fmts=s16:sample_rates=${plano.amostragem}:channel_layouts=stereo`;
  if (!p.temAudio) return `${saida},${fim}`;
  return [
    // Preenche buraco e começo atrasado com silêncio, e corta o que se
    // sobrepõe, sempre pelo relógio do arquivo (nunca esticando a fala).
    `aresample=${plano.amostragem}:async=1:first_pts=0`,
    "aformat=sample_fmts=fltp:channel_layouts=stereo",
    NIVELAR_PARTES,
    // O loudnorm devolve a 192 kHz: de volta a 48.
    `aresample=${plano.amostragem}`,
    saida,
    fim,
  ].join(",");
}

/**
 * O ffmpeg que normaliza UMA parte num intermediário .mov (H.264 + PCM).
 * Sem áudio, o silêncio entra como entrada (e não como fonte dentro do grafo,
 * que não sobrevive a uma reinicialização do grafo).
 */
export function argumentosDaParte(plano, i, entrada, saida) {
  const p = plano.partes[i];
  const silencio = !p.temAudio;
  const args = ["-i", entrada];
  if (silencio) args.push("-f", "lavfi", "-t", (p.duracaoSeg + 1).toFixed(3), "-i", `anullsrc=r=${plano.amostragem}:cl=stereo`);
  const deAudio = silencio ? "[1:a:0]" : `[0:${p.indiceDoAudio}]`;
  args.push(
    "-filter_complex",
    `[0:${p.indiceDoVideo}]${filtroDeVideo(plano, i)}[v];${deAudio}${filtroDeAudio(plano, i)}[a]`,
    "-map", "[v]",
    "-map", "[a]",
    "-c:v", "libx264",
    "-preset", "veryfast",
    // 18: o patamar de "visualmente sem perda" da casa (ver prepararCompleto).
    "-crf", "18",
    "-profile:v", "high",
    "-pix_fmt", "yuv420p",
    "-g", "60",
    "-colorspace", "bt709",
    "-color_primaries", "bt709",
    "-color_trc", "bt709",
    "-color_range", "tv",
    "-c:a", "pcm_s16le",
    "-map_metadata", "-1",
    "-f", "mov",
    saida
  );
  return args;
}

/** A emenda: vídeo por cópia (as partes saíram iguais), áudio em AAC uma vez só. */
export function argumentosDaEmenda(lista, saida) {
  return [
    "-f", "concat",
    "-safe", "0",
    "-i", lista,
    "-map", "0:v:0",
    "-map", "0:a:0",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    "-ar", String(AMOSTRAGEM_DA_JUNCAO),
    "-ac", "2",
    "-movflags", "+faststart",
    saida,
  ];
}

/** Só a fala, para a transcrição (o mesmo formato do /audio de 29/09). */
export function argumentosDoAudio(entrada, saida) {
  return ["-i", entrada, "-vn", "-ac", "1", "-ar", "44100", "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", saida];
}

/** A folga da conferência: um décimo de segundo, mais cinco centésimos por parte. */
export function toleranciaDaJuncao(partes) {
  return 0.1 + 0.05 * Math.max(1, partes);
}

/**
 * A CONFERÊNCIA DO FIM: a duração do arquivo juntado contra a soma das partes,
 * e o áudio contra o vídeo. Pura.
 */
export function conferirJuncao(final, plano) {
  const tolerancia = toleranciaDaJuncao(plano.partes.length);
  const video = final.duracaoVideoSeg || final.duracaoSeg;
  const audio = final.duracaoAudioSeg;
  const diferenca = Math.abs(video - plano.somaSeg);
  const descompasso = final.temAudio ? Math.abs(video - audio) : Infinity;
  const motivos = [];
  if (diferenca > tolerancia) motivos.push(`a duração juntada (${video.toFixed(2)} s) não bate com a soma das partes (${plano.somaSeg.toFixed(2)} s)`);
  if (!final.temAudio) motivos.push("o arquivo juntado saiu sem áudio");
  else if (descompasso > tolerancia) motivos.push(`áudio (${audio.toFixed(2)} s) e vídeo (${video.toFixed(2)} s) saíram com durações diferentes`);
  if (final.largura !== plano.largura || final.altura !== plano.altura) motivos.push(`o quadro saiu ${final.largura}x${final.altura}, e não ${plano.largura}x${plano.altura}`);
  return { ok: motivos.length === 0, esperadoSeg: plano.somaSeg, medidoSeg: video, diferencaSeg: diferenca, descompassoSeg: final.temAudio ? descompasso : null, tolerancia, motivos };
}

/** Prazo de um ffmpeg da junção: o triplo da duração, nunca menos de 30 min. */
function prazoMs(segundos) {
  return Math.max(30 * 60_000, Math.round(segundos * 3 * 1000));
}

/**
 * Junta arquivos LOCAIS, na ordem dada, em `pasta`. Apaga cada fonte assim que
 * o intermediário dela fica pronto, e os intermediários depois da emenda: uma
 * gravação de horas em três partes não cabe três vezes no disco do contêiner.
 */
export async function juntarArquivos(fontes, pasta, { rodar = rodarNoWorker, apagarFontes = false, log = () => {} } = {}) {
  const infos = [];
  for (const f of fontes) infos.push(await sondar(f));
  const plano = planoDaJuncao(infos);
  log(`plano ${plano.largura}x${plano.altura} ${plano.orientacao}, maior a parte ${plano.maior + 1}, ${plano.partes.length} partes, ${plano.somaSeg.toFixed(2)} s`);

  const intermediarios = [];
  for (let i = 0; i < fontes.length; i++) {
    const saida = join(pasta, `parte-${String(i + 1).padStart(2, "0")}.mov`);
    await rodar(argumentosDaParte(plano, i, fontes[i], saida), { timeoutMs: prazoMs(plano.partes[i].duracaoSeg) });
    intermediarios.push(saida);
    if (apagarFontes) await rm(fontes[i], { force: true }).catch(() => {});
    log(`parte ${i + 1} normalizada (${plano.partes[i].duracaoSeg.toFixed(2)} s${plano.partes[i].preenche ? ", com preenchimento" : ""}${plano.partes[i].temAudio ? "" : ", sem áudio: silêncio"})`);
  }

  const lista = join(pasta, "partes.txt");
  // Só o NOME do arquivo, e o ffmpeg rodando dentro da pasta: caminho absoluto
  // do Windows com dois-pontos quebra a lista (ver `emendar` em ffmpeg.mjs).
  await writeFile(lista, intermediarios.map((p) => `file '${basename(p)}'`).join("\n"), "utf8");
  const arquivo = join(pasta, "juntado.mp4");
  await rodar(argumentosDaEmenda(basename(lista), basename(arquivo)), { cwd: pasta, timeoutMs: prazoMs(plano.somaSeg / 4) });
  for (const p of intermediarios) await rm(p, { force: true }).catch(() => {});

  const final = await sondar(arquivo);
  const conferencia = conferirJuncao(final, plano);
  log(`juntado: ${final.duracaoVideoSeg.toFixed(3)} s de vídeo, ${final.duracaoAudioSeg.toFixed(3)} s de áudio, soma ${plano.somaSeg.toFixed(3)} s`);
  if (!conferencia.ok) throw new Error(`a junção não passou na conferência: ${conferencia.motivos.join("; ")}`);
  return { arquivo, plano, infos, final, conferencia };
}

/**
 * O trabalho do /juntar: baixa as partes na ordem pedida, junta, confere,
 * sobe o vídeo juntado e a fala dele (os dois no store PRIVADO: é a gravação
 * do cliente, não mídia publicada) e devolve o que o callback grava.
 *
 * `trabalho`: { videoJobId, chave, partes: [{ url, nome }], callbackUrl, retorno }.
 */
export async function juntarPartes(trabalho, { baixar, subir, rodar = rodarNoWorker }) {
  const partes = Array.isArray(trabalho.partes) ? trabalho.partes : [];
  if (partes.length < 2) throw new Error("Juntar pede pelo menos duas partes");
  if (partes.some((p) => !p?.url)) throw new Error("Uma das partes chegou sem endereço");
  const pasta = await mkdtemp(join(tmpdir(), "demandou-juntar-"));
  const t0 = Date.now();
  const log = (m) => console.log(`[${trabalho.videoJobId}] juntar: ${m}`);
  try {
    const fontes = [];
    for (let i = 0; i < partes.length; i++) {
      const destino = join(pasta, `fonte-${String(i + 1).padStart(2, "0")}`);
      await baixar(partes[i].url, destino);
      fontes.push(destino);
    }
    log(`${partes.length} partes baixadas em ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    const { arquivo, plano, infos, final, conferencia } = await juntarArquivos(fontes, pasta, { rodar, apagarFontes: true, log });

    const audioLocal = join(pasta, "fala.m4a");
    await rodar(argumentosDoAudio(arquivo, audioLocal), { timeoutMs: prazoMs(plano.somaSeg / 4) });

    const chave = trabalho.chave || `videos/juntado-${trabalho.videoJobId}.mp4`;
    const juntado = await subir(arquivo, chave, "video/mp4", { privado: true });
    const audio = await subir(audioLocal, `audio/${trabalho.videoJobId}.m4a`, "audio/mp4", { privado: true });
    log(`pronto em ${((Date.now() - t0) / 1000).toFixed(0)}s: ${(juntado.bytes / 1048576).toFixed(0)} MB`);
    return {
      juntado: {
        url: juntado.url,
        bytes: juntado.bytes,
        duracaoSeg: Number(conferencia.medidoSeg.toFixed(3)),
        somaSeg: Number(plano.somaSeg.toFixed(3)),
        diferencaSeg: Number(conferencia.diferencaSeg.toFixed(3)),
        largura: final.largura,
        altura: final.altura,
        orientacao: plano.orientacao,
        partes: plano.partes.map((p, i) => ({
          duracaoSeg: Number(p.duracaoSeg.toFixed(3)),
          largura: infos[i].largura,
          altura: infos[i].altura,
          fps: Number((infos[i].fps || 0).toFixed(3)),
          temAudio: p.temAudio,
          preenche: p.preenche,
        })),
      },
      audio,
      // Volta como veio: o app só aceita o aviso da rodada que pediu.
      retorno: trabalho.retorno ?? null,
    };
  } finally {
    await rm(pasta, { recursive: true, force: true }).catch(() => {});
  }
}
