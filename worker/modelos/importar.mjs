// Importa os modelos do curso "Máquina de Edição IA" para worker/modelos/<id>/.
//
// Uso:  node worker/modelos/importar.mjs "C:\caminho\das\skills" [--so modelo-painel,modelo-viral]
//
// A pasta de origem tem um diretório por skill, no formato que o .skill extraído
// deixa: <modelo>/<modelo>/{SKILL.md, references/, assets/template/}.
//
// O que entra em cada modelo (o que o worker precisa para rodar o fluxo do curso):
//   template/   scripts/, ferramentas/, scripts-modelo/, utilitarios/, src/, public/,
//               modelo.json, remotion.config.ts, tsconfig.json, package.json (só referência)
//   referencias/ SKILL.md, plano.md, adaptar.md, estilo.md, imagens.md, exemplo/plano-comentado.md,
//               exemplo/plano.json (o src/plano.json do template, que é o plano do exemplo)
//
// O que fica de fora, de propósito: node_modules, work/, out/, references/exemplo/*.mp4|jpg
// (193 MB de vídeo de demonstração), public/img/ e public/tela/ e public/lenta/ (fotos e
// capturas do exemplo, não do estilo) e pessoa.webm (recorte de exemplo do guia).
//
// Um ajuste no preparar.mjs de cada modelo, documentado em patches.md: `--palavras arquivo`
// recebe a transcrição já feita (a Deepgram da Demandou, tempo por palavra) e pula o Whisper.
// O resto do script continua igual (silêncios, trechos, quadros de medida).
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
// --so-catalogo: não copia nada, só refaz indice.json e o catálogo do app a partir de worker/modelos
const soCatalogo = argv.includes("--so-catalogo");
const origem = soCatalogo ? null : argv[0];
if (!soCatalogo && (!origem || !existsSync(origem))) {
  console.error('Uso: node worker/modelos/importar.mjs "C:\\caminho\\das\\skills" [--so a,b] | --so-catalogo');
  process.exit(1);
}
const soIdx = argv.indexOf("--so");
const so = soIdx >= 0 ? new Set(argv[soIdx + 1].split(",")) : null;

const FORA_DO_PUBLIC = new Set(["img", "tela", "lenta", "pessoa.webm", "medir"]);

const copiarDir = (de, para, filtro = () => true) => {
  if (!existsSync(de)) return;
  mkdirSync(para, { recursive: true });
  for (const nome of readdirSync(de)) {
    const a = path.join(de, nome);
    const b = path.join(para, nome);
    if (!filtro(nome, a)) continue;
    if (statSync(a).isDirectory()) cpSync(a, b, { recursive: true });
    else cpSync(a, b);
  }
};

// Ajuste do preparar.mjs: transcrição externa no lugar do Whisper.
const ANCORA_INICIO = "console.log(`Transcrevendo a fala em ${ilhas.length} bloco(s) (${modelo}, ${idioma})…`);";
const ANCORA_FIM = "// Palavra não começa no meio de uma pausa:";
const ANCORA_IMPORT = 'import { downloadWhisperModel, installWhisperCpp, toCaptions, transcribe } from "@remotion/install-whisper-cpp";';
const ANCORA_PALAVRAS = "const palavras = [];\nmkdirSync(\"work/ilhas\", { recursive: true });";
function ajustarPreparar(texto, modelo) {
  const i = texto.indexOf(ANCORA_INICIO);
  const f = texto.indexOf(ANCORA_FIM);
  if (i < 0 || f < 0 || !texto.includes(ANCORA_IMPORT) || !texto.includes(ANCORA_PALAVRAS)) {
    throw new Error(`${modelo}: preparar.mjs sem as âncoras esperadas para o ajuste --palavras`);
  }
  // O import do Whisper vira dinâmico: o pacote só é carregado quando não há transcrição externa.
  let saida = texto.replace(ANCORA_IMPORT, "// (Demandou) o Whisper só é carregado quando não vem transcrição pronta em --palavras");
  const antes = saida.slice(0, saida.indexOf(ANCORA_INICIO));
  const trechoWhisper = saida.slice(saida.indexOf(ANCORA_INICIO), saida.indexOf(ANCORA_FIM));
  const depois = saida.slice(saida.indexOf(ANCORA_FIM));
  // As pausas curtas são calculadas dentro do trecho do Whisper e usadas depois dele
  // ("palavra não começa no meio de uma pausa"): precisam existir nos dois caminhos.
  const ANCORA_PAUSAS = "const pausasCurtas = [];\n{";
  if (!trechoWhisper.includes(ANCORA_PAUSAS)) throw new Error(`${modelo}: preparar.mjs sem o bloco das pausas curtas`);
  const trechoWhisperAjustado = trechoWhisper
    .replace(ANCORA_PAUSAS, "{")
    // `palavras` passa a ser declarado antes do if
    .replace(ANCORA_PALAVRAS, 'mkdirSync("work/ilhas", { recursive: true });');
  const trechoCondicional =
    `// (Demandou) --palavras: a transcrição já feita (tempo por palavra, na linha do tempo do\n` +
    `// original, [{ em, ate, w }]). Com ela o Whisper não roda; o resto do passo é o mesmo.\n` +
    `const palavras = [];\n` +
    `const pausasCurtas = [];\n` +
    `const palavrasExternas = opcoes.palavras ? JSON.parse(readFileSync(opcoes.palavras, "utf8")) : null;\n` +
    `if (palavrasExternas) {\n` +
    `  const { stderr: saidaCurta } = ffmpeg(["-i", origem, "-map", "0:a:0", "-af", \`silencedetect=noise=\${limiar}dB:d=0.2\`, "-f", "null", "-"]);\n` +
    `  let comeco = null;\n` +
    `  for (const linha of saidaCurta.split("\\n")) {\n` +
    `    const a = linha.match(/silence_start: ([\\d.-]+)/);\n` +
    `    const b = linha.match(/silence_end: ([\\d.-]+)/);\n` +
    `    if (a) comeco = Math.max(0, Number(a[1]));\n` +
    `    if (b && comeco !== null) {\n` +
    `      pausasCurtas.push({ de: comeco, ate: Number(b[1]) });\n` +
    `      comeco = null;\n` +
    `    }\n` +
    `  }\n` +
    `  for (const p of palavrasExternas) {\n` +
    `    const em = Number(Math.max(0, Math.min(duracao, Number(p.em))).toFixed(3));\n` +
    `    const ate = Number(Math.max(em + 0.05, Math.min(duracao, Number(p.ate))).toFixed(3));\n` +
    `    const w = String(p.w ?? "").trim();\n` +
    `    if (w) palavras.push({ em, ate, w });\n` +
    `  }\n` +
    `  palavras.sort((a, b) => a.em - b.em);\n` +
    `  rmSync("work/ilhas", { recursive: true, force: true });\n` +
    `  rmSync("work/audio.wav", { force: true });\n` +
    `} else {\n` +
    `const { downloadWhisperModel, installWhisperCpp, toCaptions, transcribe } = await import("@remotion/install-whisper-cpp");\n` +
    trechoWhisperAjustado +
    `}\n`;
  saida = antes + trechoCondicional + depois;
  return saida;
}

const modelos = soCatalogo ? [] : readdirSync(origem).filter((n) => n.startsWith("modelo-") && (!so || so.has(n))).sort();
for (const id of modelos) {
  const raiz = path.join(origem, id, id);
  const template = path.join(raiz, "assets", "template");
  if (!existsSync(path.join(raiz, "SKILL.md")) || !existsSync(template)) {
    console.warn(`pulando ${id}: sem SKILL.md ou assets/template`);
    continue;
  }
  const destino = path.join(AQUI, id);
  rmSync(destino, { recursive: true, force: true });
  const t = path.join(destino, "template");
  for (const pasta of ["scripts", "ferramentas", "scripts-modelo", "utilitarios", "src"]) {
    copiarDir(path.join(template, pasta), path.join(t, pasta));
  }
  copiarDir(path.join(template, "public"), path.join(t, "public"), (nome) => !FORA_DO_PUBLIC.has(nome));
  for (const arq of ["modelo.json", "remotion.config.ts", "tsconfig.json", "package.json", "creditos.txt"]) {
    if (existsSync(path.join(template, arq))) cpSync(path.join(template, arq), path.join(t, arq));
  }
  // o preparar com a transcrição externa
  const preparar = path.join(t, "scripts", "preparar.mjs");
  writeFileSync(preparar, ajustarPreparar(readFileSync(preparar, "utf8"), id));
  // O PIXABAY no motor de imagens (09/10, pedido do Bruno: "temos chaves do
  // Pixabay"). O curso diz que o banco com chave (Pexels) é o salto de
  // qualidade nas fotos de produto e de cotidiano; o Pixabay tem a mesma
  // licença livre (uso comercial, sem crédito) e entra no mesmo lugar da fila.
  const imagensMjs = path.join(t, "scripts", "imagens.mjs");
  if (existsSync(imagensMjs)) {
    let texto = readFileSync(imagensMjs, "utf8");
    const antesDoFluent = "// Fluent Emoji 3D (Microsoft, MIT): só objetos.";
    const chamada = "    pexels(p.busca),\n";
    if (texto.includes(antesDoFluent) && texto.includes(chamada) && !texto.includes("const pixabay =")) {
      texto = texto.replace(
        antesDoFluent,
        [
          "// (Demandou, 09/10) Pixabay: licença de conteúdo do Pixabay, uso comercial livre e sem crédito.",
          "const pixabay = async (busca) => {",
          "  const chave = process.env.PIXABAY_API_KEY;",
          "  if (!chave) return [];",
          "  const d = await buscar(\"Pixabay\", `https://pixabay.com/api/?key=${encodeURIComponent(chave)}&q=${encodeURIComponent(busca)}&image_type=photo&safesearch=true&per_page=12`);",
          "  return (d?.hits ?? []).flatMap((f) => {",
          "    if (!f.largeImageURL || !f.imageWidth || !f.imageHeight) return [];",
          "    const escala = Math.min(1, 1280 / Math.max(f.imageWidth, f.imageHeight));",
          "    return [{ fonte: \"Pixabay\", url: f.largeImageURL, largura: Math.round(f.imageWidth * escala), altura: Math.round(f.imageHeight * escala), titulo: f.tags || busca, autor: f.user || \"Pixabay\", link: f.pageURL, licenca: \"Licença Pixabay\", credito: false, nivel: 1, palavras: `${f.tags ?? \"\"} ${busca}` }];",
          "  });",
          "};",
          "",
          antesDoFluent,
        ].join("\n")
      );
      texto = texto.replace(chamada, "    Promise.all([pexels(p.busca), pixabay(p.busca)]).then(([a, b]) => [...a, ...b]),\n");
      writeFileSync(imagensMjs, texto);
    }
  }
  // O 3D sem placa de vídeo (09/10): o curso pede "gl": "angle" (GPU) e manda
  // trocar por "swangle" no Linux sem GPU. GL_DOS_MODELOS (o worker define
  // swangle) vale por cima do modelo.json, só nos modelos que pedem 3D.
  const LINHA_GL = 'const gl = existsSync("modelo.json") ? lerJson("modelo.json").gl : undefined;';
  for (const script of ["render.mjs", "stills.mjs"]) {
    const arq = path.join(t, "scripts", script);
    const texto = readFileSync(arq, "utf8");
    if (texto.includes(LINHA_GL)) {
      writeFileSync(arq, texto.replace(LINHA_GL, 'const gl = existsSync("modelo.json") && lerJson("modelo.json").gl ? process.env.GL_DOS_MODELOS || lerJson("modelo.json").gl : undefined;'));
    }
  }

  const r = path.join(destino, "referencias");
  mkdirSync(path.join(r, "exemplo"), { recursive: true });
  cpSync(path.join(raiz, "SKILL.md"), path.join(r, "SKILL.md"));
  for (const arq of ["plano.md", "adaptar.md", "estilo.md", "imagens.md"]) {
    const de = path.join(raiz, "references", arq);
    if (existsSync(de)) cpSync(de, path.join(r, arq));
  }
  const comentado = path.join(raiz, "references", "exemplo", "plano-comentado.md");
  if (existsSync(comentado)) cpSync(comentado, path.join(r, "exemplo", "plano-comentado.md"));
  // A folha de quadros do exemplo: o adaptar.md manda abrir e olhar antes do
  // mapa ("a forma mais precisa de entender o estilo"); vai ao Claude como imagem.
  const quadros = path.join(raiz, "references", "exemplo", "quadros.jpg");
  if (existsSync(quadros)) cpSync(quadros, path.join(r, "exemplo", "quadros.jpg"));
  if (existsSync(path.join(template, "src", "plano.json"))) cpSync(path.join(template, "src", "plano.json"), path.join(r, "exemplo", "plano.json"));
  // outros .md das references (BLOCOS.md, IMAGENS.md etc.), quando houver
  for (const nome of readdirSync(path.join(raiz, "references"))) {
    if (nome.endsWith(".md") && !existsSync(path.join(r, nome))) cpSync(path.join(raiz, "references", nome), path.join(r, nome));
  }

  console.log(`${id}: copiado`);
}

// O índice e o catálogo saem do que está em worker/modelos (vale também com --so-catalogo).
const resumo = [];
for (const id of readdirSync(AQUI).filter((n) => n.startsWith("modelo-")).sort()) {
  const destino = path.join(AQUI, id);
  const t = path.join(destino, "template");
  const r = path.join(destino, "referencias");
  if (!existsSync(path.join(r, "SKILL.md")) || !existsSync(path.join(t, "src", "plano.ts"))) continue;
  const modeloJson = existsSync(path.join(t, "modelo.json")) ? JSON.parse(readFileSync(path.join(t, "modelo.json"), "utf8")) : {};
  const pkg = JSON.parse(readFileSync(path.join(t, "package.json"), "utf8"));
  const ferramentas = existsSync(path.join(t, "ferramentas")) ? readdirSync(path.join(t, "ferramentas")) : [];
  const skill = readFileSync(path.join(r, "SKILL.md"), "utf8");
  const descricao = (skill.match(/^description:\s*"((?:[^"\\]|\\.)*)"/m)?.[1] ?? "").replace(/\\"/g, '"');
  const nome = skill.match(/^#\s+Modelo\s+(.+)$/m)?.[1]?.trim() ?? id.replace(/^modelo-/, "");
  const imagens = existsSync(path.join(r, "imagens.md"));
  const formato = modeloJson.formato === "16:9" ? "16:9" : "9:16";
  // O que ainda pede alguém de fora do fluxo automático (09/10): busca e escolha
  // de imagem, 3D com GPU, capturas de tela reais, recorte só de Mac, fotos do
  // próprio usuário. Esses modelos ficam no catálogo e entram quando o passo
  // que falta for automatizado.
  const pede = [];
  if (ferramentas.some((f) => /^capturar/.test(f))) pede.push("capturas de tela");
  if (ferramentas.includes("vseg.swift") || ferramentas.includes("recortar.mjs")) pede.push("recorte da pessoa");
  if (ferramentas.includes("teclas.mjs")) pede.push("gravação de tela");
  if (id === "modelo-transformacao") pede.push("fotos de antes e depois");
  resumo.push({
    id,
    nome,
    descricao,
    formato,
    assinatura: modeloJson.blocos?.assinatura ?? [],
    gl: modeloJson.gl ?? null,
    recorte: modeloJson.recorte ?? null,
    conferir: modeloJson.conferir ?? null,
    palavraPorPalavra: modeloJson.palavraPorPalavra ?? [],
    three: Boolean(pkg.dependencies?.three),
    ferramentas,
    imagens,
    pede,
    automatico: pede.length === 0,
  });
}
writeFileSync(path.join(AQUI, "indice.json"), JSON.stringify(resumo, null, 2) + "\n");
// O catálogo que o app lê (a tela de estilo e a recomendação pelo perfil): o
// app na Vercel não enxerga a pasta do worker.
const paraOApp = resumo.map(({ id, nome, descricao, formato, assinatura, pede, automatico }) => ({ id, nome, descricao, formato, assinatura, pede, automatico }));
const destinoApp = path.join(AQUI, "..", "..", "lib", "media", "editor-do-curso", "catalogo.json");
mkdirSync(path.dirname(destinoApp), { recursive: true });
writeFileSync(destinoApp, JSON.stringify(paraOApp, null, 2) + "\n");
console.log(`\n${resumo.length} modelo(s) em ${AQUI}; índice em indice.json; catálogo do app em ${destinoApp}`);
console.log(`automáticos: ${resumo.filter((m) => m.automatico).length} (9:16: ${resumo.filter((m) => m.automatico && m.formato === "9:16").length})`);
