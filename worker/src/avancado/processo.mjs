import { spawn, spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * OS PROCESSOS DO CÓDIGO ESCRITO PELA IA (editor avançado): o tsc e o render
 * rodam em processo separado, na pasta do trabalho, com o AMBIENTE LIMPO (só o
 * que um render precisa: caminho, pasta temporária, idioma, o GL; nenhuma
 * chave de API, segredo do worker ou token do Blob), teto de memória do Node e
 * prazo. No estouro, a árvore inteira morre (o Chrome junto).
 */
const AQUI = dirname(fileURLToPath(import.meta.url));

const PERMITIDAS = new Set([
  "PATH", "Path", "PATHEXT", "SystemRoot", "SYSTEMROOT", "windir", "WINDIR", "ComSpec", "COMSPEC",
  "TEMP", "TMP", "TMPDIR", "HOME", "USERPROFILE", "LOCALAPPDATA", "APPDATA", "HOMEDRIVE", "HOMEPATH",
  "LANG", "LC_ALL", "TZ", "FONTCONFIG_PATH", "FONTCONFIG_FILE", "XDG_CACHE_HOME", "NUMBER_OF_PROCESSORS", "PROCESSOR_ARCHITECTURE",
  "GL_DOS_MODELOS", "FFMPEG_BIN", "NODE_ENV", "REMOTION_CHROME_EXECUTABLE",
]);

/** O ambiente do processo filho: só as variáveis da lista. Puro (testado). */
export function ambienteLimpo(env = process.env) {
  const saida = {};
  for (const [k, v] of Object.entries(env)) if (PERMITIDAS.has(k) && typeof v === "string") saida[k] = v;
  return saida;
}

/** Mata o processo e os filhos dele (o Chrome do render não pode ficar órfão). */
function matarArvore(filho) {
  if (!filho.pid) return;
  try {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(filho.pid), "/T", "/F"], { stdio: "ignore" });
    else process.kill(-filho.pid, "SIGKILL");
  } catch {
    try {
      filho.kill("SIGKILL");
    } catch {
      // já saiu
    }
  }
}

/** Roda `node <script> ...args` isolado. Devolve { codigo, saida, estourou, json } (json: a última linha que é JSON). */
export function rodarIsolado(script, args, { cwd, prazoMs = 20 * 60_000, memoriaMb = 3072, aoLinha = () => {} } = {}) {
  return new Promise((resolve) => {
    const filho = spawn(process.execPath, [`--max-old-space-size=${memoriaMb}`, script, ...args], {
      cwd,
      env: ambienteLimpo(),
      // grupo próprio no Linux, para o kill -pid levar o Chrome junto
      detached: process.platform !== "win32",
      windowsHide: true,
    });
    let saida = "";
    let resto = "";
    const ler = (d) => {
      const texto = String(d);
      saida += texto;
      resto += texto;
      const linhas = resto.split("\n");
      resto = linhas.pop() ?? "";
      for (const l of linhas) if (l.trim()) aoLinha(l.trim());
    };
    filho.stdout.on("data", ler);
    filho.stderr.on("data", (d) => (saida += String(d)));
    let estourou = false;
    const t = setTimeout(() => {
      estourou = true;
      matarArvore(filho);
    }, prazoMs);
    filho.on("close", (codigo) => {
      clearTimeout(t);
      let json = null;
      for (const l of saida.trim().split("\n").reverse()) {
        const s = l.trim();
        if (s.startsWith("{") && s.endsWith("}")) {
          try {
            json = JSON.parse(s);
            break;
          } catch {
            // não era o JSON final
          }
        }
      }
      resolve({ codigo: estourou ? -1 : codigo, saida: saida.slice(-20_000), estourou, json });
    });
    filho.on("error", () => {
      clearTimeout(t);
      resolve({ codigo: -2, saida, estourou: false, json: null });
    });
  });
}

/** Onde está o tsc: o do worker (produção) ou o do app (a máquina de desenvolvimento). */
function acharTsc() {
  for (const base of [join(AQUI, "..", "..", "package.json"), join(AQUI, "..", "..", "..", "package.json")]) {
    try {
      return createRequire(base).resolve("typescript/lib/tsc.js");
    } catch {
      // tenta o próximo
    }
  }
  return null;
}

/** Os tipos do three: os do worker em produção, ou os do app na máquina de desenvolvimento. */
function tiposDoThree() {
  for (const d of [join(AQUI, "..", "..", "node_modules", "@types", "three"), join(AQUI, "..", "..", "..", "node_modules", "@types", "three")]) {
    if (existsSync(join(d, "index.d.ts"))) return d;
  }
  return null;
}

/**
 * O PORTÃO DO TIPO: tsc --noEmit no projeto do trabalho (kit, roteiro e
 * cenas). Devolve a lista de erros no formato do portão, só os das cenas
 * (erro no kit é nosso, e vem com o nome do arquivo também).
 */
export async function portaoDoTsc(projeto, { prazoMs = 4 * 60_000 } = {}) {
  const tsc = acharTsc();
  if (!tsc) return { pulado: "tsc não encontrado", problemas: [] };
  const three = tiposDoThree();
  const config = {
    extends: "./tsconfig.json",
    compilerOptions: { ...(three ? { paths: { three: [three] } } : {}) },
    include: ["src/**/*.ts", "src/**/*.tsx"],
  };
  writeFileSync(join(projeto, "tsconfig.portao.json"), JSON.stringify(config));
  const r = await rodarIsolado(tsc, ["-p", "tsconfig.portao.json", "--pretty", "false"], { cwd: projeto, prazoMs, memoriaMb: 2048 });
  if (r.estourou) return { problemas: [{ arquivo: "*", linha: 1, motivo: "o tsc passou do prazo" }] };
  const problemas = [];
  for (const l of r.saida.split("\n")) {
    const m = l.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/);
    if (!m) continue;
    const arquivo = m[1].replace(/\\/g, "/").replace(/^.*src\//, "src/");
    problemas.push({ arquivo: arquivo.replace(/^src\/cenas\//, ""), linha: Number(m[2]), motivo: `${m[4]}: ${m[5]}` });
  }
  if (r.codigo !== 0 && !problemas.length) problemas.push({ arquivo: "*", linha: 1, motivo: `o tsc falhou: ${r.saida.slice(-600)}` });
  return { problemas };
}
