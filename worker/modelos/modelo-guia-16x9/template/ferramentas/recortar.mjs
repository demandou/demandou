// Guia — recorta a pessoa do fundo (sem fundo, com transparência) e grava public/pessoa.webm.
//
// Uso:  node ferramentas/recortar.mjs            (usa public/base.mp4, o vídeo já cortado)
// Roda DEPOIS do `cortar.mjs` (o recorte precisa ter a mesma linha do tempo do vídeo cortado).
// Usa a segmentação de pessoas do macOS (Apple Vision) por um pequeno programa em Swift: não baixa
// nada e não precisa de biblioteca extra, só do Xcode Command Line Tools (`xcode-select --install`).
// Sem macOS, o template ainda renderiza: a pessoa aparece como retângulo (sem recorte).
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { ffprobe, exigirProjeto } from "../scripts/comum.mjs";

exigirProjeto();
if (process.platform !== "darwin") {
  console.error("O recorte automático usa o macOS (Vision). Neste sistema, deixe `plano.recorte = false`: a pessoa fica sem recorte.");
  process.exit(1);
}
const entrada = process.argv[2] ?? "public/base.mp4";
const saida = "public/pessoa.webm";
mkdirSync("work", { recursive: true });
if (!existsSync("work/vseg")) {
  console.log("Compilando o segmentador (uma vez, ~30 s)…");
  const c = spawnSync("swiftc", ["-O", "ferramentas/vseg.swift", "-o", "work/vseg"], { stdio: "inherit" });
  if (c.status !== 0) {
    console.error("swiftc falhou: instale as ferramentas do Xcode com `xcode-select --install`.");
    process.exit(1);
  }
}
const [w, h] = ffprobe(["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", entrada]).trim().split(",").map(Number);
const fps = ffprobe(["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", entrada]).trim();
console.log(`Recortando ${entrada} (${w}×${h}, ${fps} fps)…`);

const seg = spawn("work/vseg", [entrada, String(w), String(h)], { stdio: ["ignore", "pipe", "inherit"] });
// a máscara chega como cinza cru; o filtro aperta a borda (tira o halo do fundo) e suaviza o serrilhado
const filtro = [
  "[1:v]format=gray,gblur=sigma=1.6,lutyuv=y='clip((val-70)*255/(215-70)\\,0\\,255)',gblur=sigma=0.8[m]",
  "[0:v]format=yuv420p[v]",
  "[v][m]alphamerge,format=yuva420p",
].join(";");
const ff = spawn(
  "ffmpeg",
  ["-v", "error", "-y", "-i", entrada, "-f", "rawvideo", "-pix_fmt", "gray", "-s", `${w}x${h}`, "-r", fps, "-i", "-", "-filter_complex", filtro,
   "-an", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "28", "-deadline", "realtime", "-cpu-used", "5", "-auto-alt-ref", "0", "-row-mt", "1", saida],
  { stdio: ["pipe", "inherit", "inherit"] },
);
seg.stdout.pipe(ff.stdin);
ff.on("close", (code) => {
  if (code !== 0) {
    console.error("O ffmpeg falhou ao gravar o recorte.");
    process.exit(1);
  }
  console.log(`Pronto: ${saida}. Rode \`node scripts/stills.mjs --momentos\` e olhe a borda da pessoa.`);
});
