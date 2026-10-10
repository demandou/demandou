// AS VERSÕES DE CADA MODELO POR FORMATO (10/10/2026).
//
// Os modelos do curso nascem num formato só (77 verticais, o Aula e o Canal
// deitados). Cada um ganha, à mão, a versão no outro formato ao lado dele:
// worker/modelos/<id>-16x9 (a deitada, para o vídeo completo de gravação
// deitada) e worker/modelos/<id>-9x16 (a em pé, para os cortes do Aula e do
// Canal e o completo de gravação em pé). Este script varre o disco e grava a
// lista que o app lê (lib/media/editor-do-curso/versoes.json), porque o app na
// Vercel não enxerga a pasta do worker:
//
//   { "<id>": { "9:16": "<pasta>", "16:9": "<pasta>" } }
//
// O próprio modelo vale no formato nativo dele; a versão só entra quando a
// pasta está completa (a skill, o plano.ts, o render e o conferir do curso), o
// modelo.json diz o formato do nome da pasta e, quando diz de quem é a variante,
// diz o modelo certo. Pasta pela metade fica de fora com um aviso.
//
// O worker confere de novo pelo disco na hora de editar
// (worker/src/modelo/editar-no-modelo.mjs, modeloNoFormato).
//
// Uso: npm run modelos:versoes   (o mesmo que: node worker/modelos/versoes.mjs)
// O importar.mjs chama a mesma função no fim.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const DESTINO_DAS_VERSOES = path.join(AQUI, "..", "..", "lib", "media", "editor-do-curso", "versoes.json");

const SUFIXO = /-(16x9|9x16)$/;
const FORMATO_DO_SUFIXO = { "16x9": "16:9", "9x16": "9:16" };

/** O nome é de uma versão em outro formato (`<id>-16x9` ou `<id>-9x16`), e não de um modelo do curso. */
export function ehVersao(nome) {
  return SUFIXO.test(nome);
}

/** O que uma pasta de modelo precisa ter para o worker rodar o fluxo do curso nela. */
const ARQUIVOS_DO_MODELO = ["referencias/SKILL.md", "template/modelo.json", "template/src/plano.ts", "template/scripts/render.mjs", "template/scripts/conferir.mjs"];

function lerModeloJson(pasta) {
  try {
    return JSON.parse(readFileSync(path.join(pasta, "template", "modelo.json"), "utf8"));
  } catch {
    return null;
  }
}

/** O formato do modelo como o worker lê (formatoDoModelo): "16:9" quando o modelo.json diz, senão o vertical. */
function formatoDaPasta(pasta) {
  return lerModeloJson(pasta)?.formato === "16:9" ? "16:9" : "9:16";
}

/**
 * As versões pelo disco: { versoes, avisos }. `versoes` tem um item por modelo
 * do curso (pasta sem sufixo), com o formato nativo apontando para ele mesmo e
 * as versões completas nos outros formatos.
 */
export function versoesDoDisco(pasta = AQUI) {
  const nomes = readdirSync(pasta)
    .filter((n) => n.startsWith("modelo-") && statSync(path.join(pasta, n)).isDirectory())
    .sort();
  const faltando = (dir) => ARQUIVOS_DO_MODELO.filter((a) => !existsSync(path.join(dir, a)));
  const versoes = {};
  const avisos = [];
  for (const id of nomes.filter((n) => !ehVersao(n))) {
    const falta = faltando(path.join(pasta, id));
    if (falta.length) {
      avisos.push(`${id}: modelo incompleto (falta ${falta.join(", ")}), fora da lista`);
      continue;
    }
    versoes[id] = { [formatoDaPasta(path.join(pasta, id))]: id };
  }
  for (const nome of nomes.filter(ehVersao)) {
    const sufixo = nome.match(SUFIXO)[1];
    const formato = FORMATO_DO_SUFIXO[sufixo];
    const base = nome.slice(0, -(sufixo.length + 1));
    const dir = path.join(pasta, nome);
    if (!versoes[base]) {
      avisos.push(`${nome}: o modelo ${base} não está na lista`);
      continue;
    }
    if (versoes[base][formato] === base) {
      avisos.push(`${nome}: ${base} já nasce ${formato}; a versão sobra`);
      continue;
    }
    const falta = faltando(dir);
    if (falta.length) {
      avisos.push(`${nome}: versão incompleta (falta ${falta.join(", ")}), fora da lista`);
      continue;
    }
    const real = formatoDaPasta(dir);
    if (real !== formato) {
      avisos.push(`${nome}: o modelo.json diz ${real}, e o nome da pasta diz ${formato}; fora da lista`);
      continue;
    }
    const de = lerModeloJson(dir)?.variante?.de;
    if (de && de !== base) {
      avisos.push(`${nome}: o modelo.json diz que é versão de ${de}, e não de ${base}; fora da lista`);
      continue;
    }
    versoes[base][formato] = nome;
  }
  // A ordem das chaves fixa (o formato vertical primeiro), para o arquivo só mudar quando o disco muda.
  for (const id of Object.keys(versoes)) {
    const v = versoes[id];
    versoes[id] = Object.fromEntries(["9:16", "16:9"].filter((f) => v[f]).map((f) => [f, v[f]]));
  }
  return { versoes, avisos };
}

/** Grava o versoes.json do app e devolve o resumo. */
export function gravarVersoes({ pasta = AQUI, destino = DESTINO_DAS_VERSOES } = {}) {
  const { versoes, avisos } = versoesDoDisco(pasta);
  mkdirSync(path.dirname(destino), { recursive: true });
  writeFileSync(destino, `${JSON.stringify(versoes, null, 2)}\n`);
  const lista = Object.values(versoes);
  return {
    destino,
    modelos: lista.length,
    nosDois: lista.filter((v) => v["9:16"] && v["16:9"]).length,
    deitados: lista.filter((v) => v["16:9"]).length,
    emPe: lista.filter((v) => v["9:16"]).length,
    avisos,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = gravarVersoes();
  for (const a of r.avisos) console.warn(`aviso: ${a}`);
  console.log(`${r.modelos} modelo(s) em ${r.destino}: ${r.nosDois} nos dois formatos, ${r.deitados} com 16:9, ${r.emPe} com 9:16`);
}
