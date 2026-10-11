/**
 * O -14 LUFS do .mov que o Remotion entrega (11/10, teste de ponta a ponta da Maquete 3D).
 *
 * O Remotion junta o áudio dos pedaços do render num .mov com PCM, e o layout de
 * canais muda no meio do arquivo. O ffmpeg 5.1 do contêiner refaz o filtro quando o
 * layout muda e não acha como ligar o aresample ao AAC ("Cannot select channel
 * layout", "Error reinitializing filters!"): o corte sob medida renderizou inteiro e
 * caiu no último passo. O ffmpeg 9 da máquina local aceita, e por isso a prova local
 * passou.
 *
 * O caminho: o PCM sai do .mov por cópia, sem filtro, para um WAV de cabeçalho único;
 * a medida e o -14 LUFS rodam sobre o WAV, e a imagem vem do .mov sem recodificar.
 * `ffmpeg(args)` roda o binário e devolve o stderr (lança se falhar).
 */
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";

export function nivelarAudioDoMov(ffmpeg, entrada, saida) {
  const wav = join(dirname(saida), `.audio-${Date.now()}.wav`);
  try {
    ffmpeg(["-y", "-i", entrada, "-map", "0:a:0", "-vn", "-c:a", "copy", wav]);
    const medida = ffmpeg(["-i", wav, "-af", "loudnorm=I=-14:TP=-2:LRA=11:print_format=json", "-f", "null", "-"]);
    const m = JSON.parse(medida.slice(medida.lastIndexOf("{"), medida.lastIndexOf("}") + 1));
    const filtro = `loudnorm=I=-14:TP=-2:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
    ffmpeg(["-y", "-i", entrada, "-i", wav, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-af", filtro, "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", saida]);
    return m;
  } finally {
    rmSync(wav, { force: true });
  }
}
