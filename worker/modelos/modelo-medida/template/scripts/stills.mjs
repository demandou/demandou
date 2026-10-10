// Passo 3 — renderiza quadros de conferência em out/stills (metade do tamanho, para olhar rápido).
//
// Uso:  node scripts/stills.mjs 1.8 4.5 10.2        (tempos em segundos)
//       node scripts/stills.mjs --momentos          (cada momento: no meio e nas duas bordas)
//       node scripts/stills.mjs --guias             (3 quadros com as guias de rosto, zona e legenda)
//       node scripts/stills.mjs --guias 12 30       (guias em tempos específicos)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { argumentos, exigirProjeto, lerJson } from "./comum.mjs";

exigirProjeto();
const { opcoes, posicionais } = argumentos();
let tempos = posicionais.map(Number).filter((n) => Number.isFinite(n));
const plano = lerJson("src/plano.json");
// todos os instantes marcados dentro de um momento: campos "em" e "...Em", em qualquer nível
const instantes = (valor, chave = "") => {
  if (Array.isArray(valor)) return valor.flatMap((v) => instantes(v));
  if (valor && typeof valor === "object") return Object.entries(valor).flatMap(([k, v]) => instantes(v, k));
  return typeof valor === "number" && (chave === "em" || /Em$/.test(chave)) ? [valor] : [];
};
if (opcoes.momentos) {
  tempos = plano.momentos.flatMap((m) => {
    // as bordas mostram se a legenda some e volta no lugar certo
    const bordas = [Math.max(0, m.de - 0.25), Math.min(plano.duracao - 0.05, m.ate + 0.25)];
    const meio = m.de + (m.ate - m.de) * 0.5;
    // cada sub-passo (item, opção, grifo, número…) um instante depois de acontecer
    const passos = instantes(m).map((t) => Math.min(m.ate - 0.1, t + 0.7));
    return [bordas[0], meio, ...passos, bordas[1]];
  });
}
if (opcoes.guias && tempos.length === 0) tempos = [0.15, 0.5, 0.85].map((f) => plano.duracao * f);
tempos = [...new Set(tempos.map((t) => Number(Math.min(Math.max(0, t), plano.duracao - 0.05).toFixed(2))))].sort((a, b) => a - b);
if (tempos.length === 0) {
  console.error("Informe os tempos (em segundos), --momentos ou --guias.");
  process.exit(1);
}

// modelos com 3D (WebGL) declaram { "gl": "angle" } no modelo.json (ver render.mjs)
const gl = existsSync("modelo.json") && lerJson("modelo.json").gl ? process.env.GL_DOS_MODELOS || lerJson("modelo.json").gl : undefined;
const chromiumOptions = gl ? { gl } : {};
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
try {
  const inputProps = opcoes.guias ? { plano, guias: true } : undefined;
  const composition = await selectComposition({ serveUrl, id: "Edicao", inputProps, chromiumOptions });
  // rodada completa começa limpa, para não confundir quadros novos com os de uma rodada anterior
  if (opcoes.momentos || (opcoes.guias && posicionais.length === 0)) rmSync("out/stills", { recursive: true, force: true });
  mkdirSync("out/stills", { recursive: true });
  for (const t of tempos) {
    const frame = Math.max(0, Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps)));
    const output = `out/stills/${opcoes.guias ? "guias-" : ""}t${t.toFixed(2).padStart(6, "0")}.jpg`;
    await renderStill({ composition, serveUrl, frame, output, inputProps, imageFormat: "jpeg", jpegQuality: 88, scale: 0.5, chromiumOptions, logLevel: "error" });
    console.log(output);
  }
} finally {
  // o bundle copia a pasta public; apagar evita encher o disco
  rmSync(serveUrl, { recursive: true, force: true });
}
