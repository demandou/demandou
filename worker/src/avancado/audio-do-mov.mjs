/**
 * O -14 LUFS do .mov que o Remotion entrega, pelo ffmpeg DO REMOTION (11/10, teste
 * de ponta a ponta da Maquete 3D).
 *
 * O ffmpeg 5.1 do contêiner não monta o filtro com o PCM que o Remotion grava
 * ("Cannot select channel layout for the link between filters Parsed_aresample_1
 * and format_out", "Error reinitializing filters!"), nem lendo o .mov nem lendo o
 * WAV copiado dele: o corte sob medida renderizava inteiro e caía no último passo.
 * O ffmpeg 9 da máquina local aceita, e por isso a prova local passou. O Remotion
 * traz o ffmpeg 7.1 dele (com loudnorm, aresample e o AAC) no pacote do compositor;
 * é ele que roda aqui. Sem o pacote (não deveria acontecer), o ffmpeg do sistema.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

/** A pasta do compositor do Remotion com o ffmpeg dele, ou null. */
export function pastaDoFfmpegDoRemotion() {
  try {
    const remotion = dirname(dirname(require.resolve("@remotion/renderer/package.json")));
    for (const nome of readdirSync(remotion)) {
      if (!nome.startsWith("compositor-")) continue;
      const pasta = join(remotion, nome);
      if (existsSync(join(pasta, "ffmpeg")) || existsSync(join(pasta, "ffmpeg.exe"))) return pasta;
    }
  } catch {}
  return null;
}

/** Roda o ffmpeg do Remotion (as bibliotecas dele ficam na mesma pasta) e devolve o stderr. */
function ffmpegDoRemotion(pasta) {
  const bin = join(pasta, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
  const env = { ...process.env, LD_LIBRARY_PATH: [pasta, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":") };
  return (args) => {
    const r = spawnSync(bin, ["-hide_banner", "-nostdin", ...args], { encoding: "utf8", env, maxBuffer: 64 * 1024 * 1024 });
    if (r.status !== 0) throw new Error(`ffmpeg do Remotion falhou: ${String(r.stderr).split("\n").slice(-8).join("\n")}`);
    return String(r.stderr ?? "");
  };
}

/** `ffmpegDoSistema(args)`: a reserva, só sem o pacote do compositor. */
export function nivelarAudioDoMov(ffmpegDoSistema, entrada, saida) {
  const pasta = pastaDoFfmpegDoRemotion();
  const ffmpeg = pasta ? ffmpegDoRemotion(pasta) : ffmpegDoSistema;
  const medida = ffmpeg(["-i", entrada, "-vn", "-af", "loudnorm=I=-14:TP=-2:LRA=11:print_format=json", "-f", "null", "-"]);
  const m = JSON.parse(medida.slice(medida.lastIndexOf("{"), medida.lastIndexOf("}") + 1));
  const filtro = `loudnorm=I=-14:TP=-2:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
  ffmpeg(["-y", "-i", entrada, "-map", "0:v:0", "-map", "0:a:0", "-c:v", "copy", "-af", filtro, "-c:a", "aac", "-b:a", "192k", "-ac", "2", "-shortest", "-movflags", "+faststart", saida]);
  return m;
}
