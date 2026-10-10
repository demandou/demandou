// QUADROS DE CONFERÊNCIA (o "olhar os quadros" das aulas): um bundle só e um
// renderStill por instante, com o mesmo GL do servidor, e uma folha de contato.
//
// Uso: node scripts/stills.mjs <Composicao> <pasta> <quadro,quadro,...> [escala=0.5]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [id, pasta, lista, escalaTxt] = process.argv.slice(2);
const quadros = lista.split(",").map(Number);
const escala = Number(escalaTxt ?? 0.5);
mkdirSync(pasta, { recursive: true });
const chromiumOptions = { gl: process.env.GL_DOS_MODELOS || "swangle" };

const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.join(RAIZ, "src", "index.ts"), publicDir: path.join(RAIZ, "public") });
try {
  const composition = await selectComposition({ serveUrl, id, chromiumOptions });
  const arquivos = [];
  for (const q of quadros) {
    const saida = path.join(pasta, `${id}-q${String(q).padStart(4, "0")}.png`);
    await renderStill({ composition, serveUrl, frame: q, output: saida, chromiumOptions, scale: escala, logLevel: "error" });
    arquivos.push(saida);
    console.log(saida);
  }
  // folha de contato, na ordem, com o número do quadro escrito embaixo de cada um
  const lista = path.join(pasta, `${id}-lista.txt`);
  writeFileSync(lista, arquivos.map((a) => `file '${a.replace(/\\/g, "/")}'`).join("\n"));
  const colunas = Math.min(4, arquivos.length);
  const linhas = Math.ceil(arquivos.length / colunas);
  spawnSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lista, "-vf", `scale=360:-2,tile=${colunas}x${linhas}:padding=6:color=white`, "-frames:v", "1", path.join(pasta, `${id}-folha.jpg`)]);
  rmSync(lista, { force: true });
} finally {
  rmSync(serveUrl, { recursive: true, force: true });
}
console.log(`stills em ${((Date.now() - t0) / 1000).toFixed(1)} s`);
