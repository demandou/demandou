// OS LIMITES DO SERVIDOR NO RENDER DOS MODELOS (10/10/2026). O primeiro corte
// do editor do curso em produção (Manifesto, vídeo cmv1w2vzt) morreu duas vezes
// em "render 0%" com EPIPE: o render.mjs do curso abre uma aba do Chrome por
// núcleo (o contêiner tem 32) e deixa o cache do OffthreadVideo crescer até a
// metade da memória, e o compositor morre, como morreu o editor de antes na
// primeira rodada em produção (worker/src/montagem.mjs, opcoesDoRender). Aqui
// o render.mjs de cada modelo passa a aceitar os limites que o worker manda em
// RENDER_DO_SERVIDOR (JSON); sem a variável, roda como no curso.
//
// Idempotente: roda em cima de worker/modelos (os 79) e o importar.mjs chama
// a mesma função na cópia de modelos novos.
// Uso: node worker/modelos/limites-do-servidor.mjs
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MARCA = "RENDER_DO_SERVIDOR";

export function comLimitesDoServidor(texto) {
  if (texto.includes(MARCA)) return texto;
  let t = texto;
  // 1. A leitura da variável, logo depois dos imports.
  const ultimoImport = [...t.matchAll(/^import .*;$/gm)].pop();
  if (!ultimoImport) throw new Error("render.mjs sem import");
  const fim = ultimoImport.index + ultimoImport[0].length;
  t = `${t.slice(0, fim)}\n// Os limites do servidor (Demandou, 10/10): abas do Chrome, cache e multiprocesso no Linux.\nconst servidor = process.env.${MARCA} ? JSON.parse(process.env.${MARCA}) : {};${t.slice(fim)}`;
  // 2. No renderMedia, logo depois do codec (o que vem depois no curso não colide).
  if (!/^(\s*)codec: "h264",$/m.test(t)) throw new Error("render.mjs sem codec h264");
  t = t.replace(/^(\s*)codec: "h264",$/m, (_, esp) => `${esp}codec: "h264",\n${esp}...servidor,`);
  // 3. Quem já monta chromiumOptions (o gl dos modelos 3D) junta o do servidor.
  t = t.replace(/^const chromiumOptions = gl \? \{ gl \} : \{\};$/m, "const chromiumOptions = { ...(gl ? { gl } : {}), ...(servidor.chromiumOptions ?? {}) };");
  return t;
}

const AQUI = path.dirname(fileURLToPath(import.meta.url));
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let mudados = 0;
  for (const id of readdirSync(AQUI).filter((n) => n.startsWith("modelo-"))) {
    const f = path.join(AQUI, id, "template", "scripts", "render.mjs");
    if (!existsSync(f)) continue;
    const antes = readFileSync(f, "utf8");
    const depois = comLimitesDoServidor(antes);
    if (depois !== antes) {
      writeFileSync(f, depois);
      mudados++;
    }
  }
  console.log(`render.mjs com os limites do servidor: ${mudados} mudado(s)`);
}
