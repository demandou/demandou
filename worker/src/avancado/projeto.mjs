import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { nomeDeArquivoValido } from "./portao.mjs";

/**
 * A PASTA DO TRABALHO do editor avançado: um projeto Remotion por corte, como
 * o aluno das aulas faz ("projeto independente"), montado a partir do molde e
 * do kit (worker/avancado), com os pacotes do worker por link. A IA só escreve
 * em src/cenas; o resto é do kit e dos dados do corte.
 */
const AQUI = dirname(fileURLToPath(import.meta.url));
export const PASTA_DO_AVANCADO = process.env.PASTA_DO_AVANCADO ?? join(AQUI, "..", "..", "avancado");
const NODE_MODULES = join(AQUI, "..", "..", "node_modules");
const FONTES_DA_MARCA = join(AQUI, "..", "..", "fontes", "marca");

/** A referência que vai para quem escreve a cena: a API do kit e os exemplos, sempre os mesmos bytes (cache). */
export function referenciaDoKit() {
  const api = readFileSync(join(PASTA_DO_AVANCADO, "kit-api.md"), "utf8");
  const pastaDosExemplos = join(PASTA_DO_AVANCADO, "exemplos");
  const exemplos = existsSync(pastaDosExemplos)
    ? readdirSync(pastaDosExemplos)
        .sort()
        .map((nome) => {
          const pasta = join(pastaDosExemplos, nome);
          const leia = existsSync(join(pasta, "LEIA.txt")) ? readFileSync(join(pasta, "LEIA.txt"), "utf8").trim() : "";
          const arquivos = readdirSync(join(pasta, "cenas"))
            .filter((n) => nomeDeArquivoValido(n))
            .sort((a, b) => (a === "roteiro.json" ? -1 : b === "roteiro.json" ? 1 : a.localeCompare(b)))
            .map((n) => ({ nome: n, conteudo: readFileSync(join(pasta, "cenas", n), "utf8") }));
          return { nome, leia, arquivos };
        })
    : [];
  const versao = createHash("sha256").update(api).update(JSON.stringify(exemplos)).digest("hex").slice(0, 12);
  return { api, exemplos, versao };
}

/** Copia o molde e o kit, liga os pacotes do worker e prepara public/ com as letras da marca. */
export function montarProjeto(pasta) {
  const projeto = join(pasta, "projeto");
  rmSync(projeto, { recursive: true, force: true });
  cpSync(join(PASTA_DO_AVANCADO, "molde"), projeto, { recursive: true });
  cpSync(join(PASTA_DO_AVANCADO, "src", "kit"), join(projeto, "src", "kit"), { recursive: true });
  for (const d of ["src/cenas", "src/dados", "public/fontes", "out", "quadros"]) mkdirSync(join(projeto, d), { recursive: true });
  for (const f of readdirSync(FONTES_DA_MARCA).filter((n) => n.endsWith(".ttf"))) cpSync(join(FONTES_DA_MARCA, f), join(projeto, "public", "fontes", f));
  // "junction" no Windows (sem privilégio de administrador); no Linux o tipo é ignorado.
  symlinkSync(NODE_MODULES, join(projeto, "node_modules"), "junction");
  return projeto;
}

export function gravarDados(projeto, dados) {
  writeFileSync(join(projeto, "src", "dados", "pedido.json"), JSON.stringify(dados));
}

/**
 * Grava os arquivos escritos pela IA em src/cenas (só os nomes permitidos) e
 * gera o índice que o Palco lê. Arquivo que sumiu da volta nova é apagado.
 * Devolve a lista gravada.
 */
export function gravarCenas(projeto, arquivos, roteiro) {
  const pasta = join(projeto, "src", "cenas");
  for (const n of readdirSync(pasta)) rmSync(join(pasta, n), { force: true });
  const gravados = [];
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    if (!nomeDeArquivoValido(nome)) continue;
    writeFileSync(join(pasta, nome), conteudo);
    gravados.push(nome);
  }
  const usadas = [...new Set((roteiro?.cenas ?? []).map((c) => c.arquivo))].filter((n) => gravados.includes(n));
  const linhas = [
    "// Gerado pelo worker (editar-avancado.mjs): o roteiro e as cenas desta volta.",
    'import roteiro from "./roteiro.json";',
    'import type { Roteiro } from "../kit/roteiro";',
    'import type { ModuloDeCena } from "../kit/Palco";',
    ...usadas.map((n, i) => `import * as c${i} from "./${n.replace(/\.tsx$/, "")}";`),
    "",
    "export const ROTEIRO = roteiro as unknown as Roteiro;",
    `export const CENAS: Record<string, ModuloDeCena> = { ${usadas.map((n, i) => `"${n}": c${i}`).join(", ")} };`,
    "",
  ];
  writeFileSync(join(pasta, "indice.ts"), linhas.join("\n"));
  return gravados;
}

/** Os arquivos atuais da cena (para o conserto ver o que está valendo). */
export function lerCenas(projeto) {
  const pasta = join(projeto, "src", "cenas");
  const saida = {};
  for (const n of readdirSync(pasta)) if (nomeDeArquivoValido(n)) saida[n] = readFileSync(join(pasta, n), "utf8");
  return saida;
}
